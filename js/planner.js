/**
 * Kosten der Verluste einer Einheitenart in Stunden.
 * @param {string} id Einheiten-ID
 * @param {number} n Anzahl
 * @returns {number}
 */
const lossHours = (id, n) => (n * (U[id].b || 300)) / 3600;

/**
 * Passt eine Mischung an: ganzzahlig, höchstens der Vorrat, bei "full" bis zur Kapazität aufgefüllt.
 * @param {Object<string, number>} m Einheiten-ID -> gewünschte Anzahl
 * @param {Object<string, number>} rem verfügbare Einheiten
 * @param {number} cap Kapazität
 * @param {boolean} full true = Kapazität ausschöpfen
 * @returns {Object<string, number>|null} null, wenn die Mischung leer oder zu groß ist
 */
function normalize(m, rem, cap, full) {
    const r = {};
    let t = 0;
    for (const k in m) {
        const n = Math.min(Math.floor(m[k]), rem[k]);
        if (n > 0) {
            r[k] = n;
            t += n;
        }
    }
    if (full && t < cap) t = topUp(r, rem, cap, t);
    return t && t <= cap ? r : null;
}

/**
 * Füllt eine Mischung mit den zahlreichsten verfügbaren Einheiten bis zur Kapazität auf.
 * @param {Object<string, number>} r Mischung, wird verändert
 * @param {Object<string, number>} rem verfügbare Einheiten
 * @param {number} cap Kapazität
 * @param {number} total bisherige Gesamtzahl
 * @returns {number} neue Gesamtzahl
 */
function topUp(r, rem, cap, total) {
    let t = total;
    for (const k of Object.keys(rem).sort((a, b) => rem[b] - rem[a])) {
        const n = Math.min(rem[k] - (r[k] || 0), cap - t);
        if (n > 0) {
            r[k] = (r[k] || 0) + n;
            t += n;
        }
    }
    return t;
}

/**
 * Reine Einheitenarten in verschiedenen Anteilen.
 * @param {string[]} K verfügbare Einheiten-IDs
 * @param {Object<string, number>} rem verfügbare Einheiten
 * @param {number} cap Kapazität
 * @param {boolean} full true = nur volle Kapazität
 * @returns {Array<Object<string, number>>}
 */
function singleMixes(K, rem, cap, full) {
    const out = [];
    for (const k of K)
        for (const f of full ? [1] : [1, 0.5, 0.25])
            out.push({ [k]: Math.min(rem[k], cap) * f });
    if (!full)
        for (const k of K) [1, 2, 3].forEach((n) => out.push({ [k]: n }));
    return out;
}

/**
 * Paare der sechs stärksten Einheitenarten in drei Verhältnissen.
 * @param {string[]} K verfügbare Einheiten-IDs
 * @param {number} cap Kapazität
 * @returns {Array<Object<string, number>>}
 */
function pairMixes(K, cap) {
    const out = [];
    const power = (id) => U[id].mx * U[id].a;
    const top = [...K].sort((a, b) => power(b) - power(a)).slice(0, 6);
    for (const a of top)
        for (const b of top)
            if (a < b)
                for (const r of [0.7, 0.5, 0.3])
                    out.push({ [a]: cap * r, [b]: cap * (1 - r) });
    return out;
}

/**
 * Zufällige Mischung aus zwei bis vier Einheitenarten.
 * @param {string[]} K verfügbare Einheiten-IDs
 * @param {number} cap Kapazität
 * @param {boolean} full true = volle Kapazität
 * @returns {Object<string, number>}
 */
function randomMix(K, cap, full) {
    const ks = [...K].sort(() => rnd() - 0.5).slice(0, 2 + ((rnd() * 3) | 0));
    const w = ks.map(() => 0.2 + rnd());
    const s = w.reduce((a, b) => a + b);
    const f = full ? 1 : 0.3 + rnd() * 0.7;
    const m = {};
    ks.forEach((k, j) => (m[k] = (cap * f * w[j]) / s));
    return m;
}

/**
 * Erzeugt Kandidaten für die nächste Angriffswelle.
 * @param {Object<string, number>} rem verfügbare Einheiten
 * @param {number} cap Kapazität
 * @param {boolean} full true = Kapazität ausschöpfen
 * @returns {Array<Object<string, number>>}
 */
function cands(rem, cap, full) {
    const K = Object.keys(rem);
    const randoms = [];
    for (let i = 0; i < 14 && K.length > 1; i++)
        randoms.push(randomMix(K, cap, full));
    return [...singleMixes(K, rem, cap, full), ...pairMixes(K, cap), ...randoms]
        .map((m) => normalize(m, rem, cap, full))
        .filter(Boolean);
}

/**
 * Bewertet eine Welle gegen die verbleibenden Gegner.
 * @param {Object<string, number>} cd Einsatz
 * @param {BattleUnit[]} E verbleibende Gegner
 * @param {Object<string, UnitTemplate>} T
 * @param {Modifiers} M
 * @param {{t: UnitTemplate}} G
 * @returns {{o: BattleOutcome, s: number}} Kampfergebnis und Punktzahl (höher ist besser)
 */
function evalW(cd, E, T, M, G) {
    const e = clone(E);
    const h0 = e.reduce((a, u) => a + u.hp, 0) || 1;
    const o = sim(build(cd, T, G), e, M);
    const left = o.E.reduce((a, u) => a + u.hp, 0) / h0;
    let lh = 0;
    let q = 0;
    for (const k in o.loss) {
        lh += lossHours(k, o.loss[k]);
        if (lock[k]) q += o.loss[k];
    }
    const score = o.win ? 2000 - 2 * lh : 500 * (1 - left) - 0.4 * lh;
    return { o, s: score - (q ? 600 + 5 * q : 0) };
}

/**
 * Durchschnittliche Punktzahl eines Kandidaten über mehrere Probekämpfe.
 * @param {Object<string, number>} cd
 * @param {number} tries Anzahl der Probekämpfe
 * @param {number} start bisherige Punktsumme
 * @param {Array} ctx Argumente für evalW ohne Kandidat: E, T, M, G
 * @returns {number} Summe aller Punkte
 */
function scoreSum(cd, tries, start, ctx) {
    let s = start;
    for (let k = 0; k < tries; k++) s += evalW(cd, ...ctx).s;
    return s;
}

/**
 * Wählt aus Kandidaten den besten aus: grob für alle, genau für die besten zwei.
 * @param {Array<Object<string, number>>} cs Kandidaten
 * @param {Array} ctx Argumente für evalW ohne Kandidat: E, T, M, G
 * @returns {Object<string, number>}
 */
function rankCandidates(cs, ctx) {
    const rough = cs
        .map((cd) => [scoreSum(cd, 3, 0, ctx) / 3, cd])
        .sort((a, b) => b[0] - a[0]);
    const fine = rough
        .slice(0, 2)
        .map(([s, cd]) => [scoreSum(cd, 8, s * 3, ctx) / 11, cd])
        .sort((a, b) => b[0] - a[0]);
    return fine[0][1];
}

/**
 * Sucht Welle für Welle die beste Armee.
 * @param {Camp} c
 * @param {Object<string, number>} pool verfügbare Einheiten
 * @param {Modifiers} M
 * @param {Object<string, UnitTemplate>} T
 * @param {{t: UnitTemplate}} G
 * @param {number} cap Kapazität
 * @param {boolean} full true = Kapazität ausschöpfen
 * @returns {Promise<Array<Object<string, number>>>} Einsatz je Welle (höchstens 6)
 */
async function search(c, pool, M, T, G, cap, full) {
    let E = freshE(c, M);
    const plan = [];
    const rem = { ...pool };
    for (let w = 0; w < 6; w++) {
        const cs = cands(rem, cap, full);
        if (!cs.length) break;
        const best = rankCandidates(cs, [E, T, M, G]);
        plan.push(best);
        const r = evalW(best, E, T, M, G);
        for (const k in r.o.loss) rem[k] -= r.o.loss[k];
        E = r.o.E;
        if (r.o.win || !sum(rem) || !E.length) break;
        await yieldToBrowser();
    }
    return plan;
}

/**
 * Kürzt einen Einsatz proportional auf die Kapazität.
 * @param {Object<string, number>} m Einsatz
 * @param {number} cp Kapazität
 * @returns {Object<string, number>}
 */
function clipTo(m, cp) {
    const t = sum(m);
    if (t <= cp) return m;
    const o = {};
    for (const k in m) {
        const n = Math.floor((m[k] * cp) / t);
        if (n > 0) o[k] = n;
    }
    return o;
}

/**
 * Gesamtkosten eines Ergebnisses: Verluste, Fall des Generals, Schutzverletzung.
 * @param {CampResult} r
 * @returns {number}
 */
function lossCost(r) {
    let x = 0;
    for (const k in r.L) x += lossHours(k, r.L[k]);
    return x + (r.gd / 100) * 2 + (r.viol / 100) * 50;
}

/**
 * Ist Ergebnis a besser als b? Ab 90 % Siegchance zählen die Kosten, sonst die Siegchance.
 * @param {CampResult} a
 * @param {CampResult} b
 * @returns {boolean}
 */
function better(a, b) {
    const A = a.p >= 90;
    const B = b.p >= 90;
    if (A != B) return A;
    if (A) return a.cost < b.cost;
    return a.p > b.p || (a.p == b.p && a.cost < b.cost);
}
