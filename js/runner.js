/**
 * @typedef {Object} RunSetup Einstellungen eines Simulationslaufs
 * @property {number} mode 0 = fester Einsatz, 1 = Einheitensuche
 * @property {number} N Läufe pro Lager
 * @property {boolean} full Kapazität bei der Suche ausschöpfen
 * @property {Object<string, number>|null} pool Vorrat für die Suche
 * @property {Object<string, number>|null} man fester Einsatz
 */

/**
 * @typedef {Object} Accumulator Gesamtwerte über alle simulierten Lager
 * @property {Object<string, number>} sumL erwartete Verluste je Einheit
 * @property {Object<string, number>} need Maximum je Einheit in einem Lager
 * @property {Object<string, number>} gc Einsätze je General
 * @property {Object<string, number>} allT Truppen gesamt je Einheit
 * @property {number} wins erwartete Siege
 * @property {number} waves Angriffswellen
 */

/**
 * Zeigt eine Fehlermeldung im Ergebnisbereich.
 * @param {string} text
 */
function showMessage(text) {
    $("res").innerHTML = `<p class="note" style="color:var(--bad)">${text}</p>`;
}

/**
 * Liest die eingetragenen Einheiten.
 * @returns {Object<string, number>} nur Einheiten mit Anzahl über 0
 */
function readUnits() {
    const units = {};
    D.p.forEach((id) => {
        const n = +$("u_" + id).value || 0;
        if (n > 0) units[id] = n;
    });
    return units;
}

/**
 * Bereitet je General Modifikatoren, Einheitenwerte und Kapazität vor.
 * @param {GeneralState[]} states
 * @returns {Array<{st: GeneralState, M: Modifiers, T: Object<string, UnitTemplate>, G: {t: UnitTemplate}, cp: number}>}
 */
function buildContexts(states) {
    return states.map((st) => {
        const M = mods(st);
        const T = {};
        D.p.forEach((id) => (T[id] = tpl(id, 0, M)));
        return { st, M, T, G: { t: genT(M, st) }, cp: capMax(st) };
    });
}

/**
 * Indizes der Lager, die zum gewählten Umfang gehören.
 * @param {string} scope "all", "boss", "pick" oder "one"
 * @returns {number[]}
 */
function campsFor(scope) {
    return cur.c
        .map((c, i) => i)
        .filter(
            (i) =>
                scope == "all" ||
                (scope == "boss" && isBoss(cur.c[i])) ||
                (scope == "pick" && selSet().has(i)) ||
                (scope == "one" && i == sc),
        );
}

/**
 * Meldung, wenn der gewählte Umfang kein Lager enthält.
 * @param {string} scope
 * @returns {string}
 */
function emptyScopeMessage(scope) {
    if (scope == "pick")
        return "Du hast noch keine Lager ausgewählt – Schalter „Lager auswählen“ einschalten und Lager auf der Karte anklicken.";
    if (scope == "boss") return "Dieses Abenteuer hat keine Boss-Lager.";
    return "Keine Lager ausgewählt.";
}

/**
 * Simuliert ein Lager mit einem General.
 * @param {Camp} c
 * @param {Object} x Kontext aus buildContexts
 * @param {RunSetup} setup
 * @returns {Promise<CampResult>} Ergebnis inklusive Plan, Generalname und Kosten
 */
async function evaluateContext(c, x, setup) {
    const { mode, pool, man, N, full } = setup;
    const plan = mode
        ? await search(c, pool, x.M, x.T, x.G, x.cp, full)
        : [clipTo(man, x.cp)];
    const r = execPlan(c, plan, N, x.M, x.T, x.G, mode ? pool : null);
    r.plan = plan;
    r.gn = x.st.n;
    r.cost = lossCost(r);
    return r;
}

/**
 * Ermittelt für ein Lager das beste Ergebnis über alle Generäle.
 * @param {number} ci Index des Lagers
 * @param {number} k Position in der Lagerliste
 * @param {number} total Anzahl der Lager
 * @param {Array<Object>} ctx Kontexte aus buildContexts
 * @param {RunSetup} setup
 * @returns {Promise<CampResult>}
 */
async function bestResultFor(ci, k, total, ctx, setup) {
    const c = cur.c[ci];
    let best = null;
    for (const x of ctx) {
        $("curcamp").textContent =
            `Simuliere Lager ${lab(c, ci)} (${k + 1}/${total}) mit ${x.st.n} …`;
        drawMarks();
        await yieldToBrowser();
        const r = await evaluateContext(c, x, setup);
        if (!best || better(r, best)) best = r;
    }
    return best;
}

/**
 * Gesamtmenge je Einheit über alle Wellen eines Plans.
 * @param {Array<Object<string, number>>} plan
 * @returns {Object<string, number>}
 */
function planTotals(plan) {
    const tot = {};
    plan.forEach((s) => {
        for (const u in s) tot[u] = (tot[u] || 0) + s[u];
    });
    return tot;
}

/**
 * Rechnet das Ergebnis eines Lagers in die Gesamtwerte ein.
 * @param {Accumulator} acc wird verändert
 * @param {CampResult} best
 */
function accumulate(acc, best) {
    acc.wins += best.p / 100;
    acc.waves += best.plan.length;
    acc.gc[best.gn] = (acc.gc[best.gn] || 0) + 1;
    const tot = planTotals(best.plan);
    for (const u in tot) {
        acc.need[u] = Math.max(acc.need[u] || 0, tot[u]);
        acc.allT[u] = (acc.allT[u] || 0) + tot[u];
    }
    for (const u in best.L)
        acc.sumL[u] = (acc.sumL[u] || 0) + (best.L[u] * best.p) / 100;
}

/**
 * Simuliert alle gewählten Lager nacheinander und zeigt den Fortschritt.
 * @param {number[]} idx Indizes der Lager
 * @param {Array<Object>} ctx Kontexte aus buildContexts
 * @param {RunSetup} setup
 * @returns {Promise<Accumulator>}
 */
async function simulateCamps(idx, ctx, setup) {
    RES = {};
    PLAN = {};
    const acc = { sumL: {}, need: {}, gc: {}, allT: {}, wins: 0, waves: 0 };
    for (let k = 0; k < idx.length; k++) {
        const ci = idx[k];
        busy = ci;
        const best = await bestResultFor(ci, k, idx.length, ctx, setup);
        RES[ci] = best;
        PLAN[ci] = { gn: best.gn, plan: best.plan, p: best.p };
        accumulate(acc, best);
        $("prog").style.width = ((k + 1) / idx.length) * 100 + "%";
    }
    return acc;
}

/**
 * Sperrt oder entsperrt die Start-Buttons.
 * @param {boolean} on true = gesperrt
 */
function setRunning(on) {
    $("go").disabled = $("srch").disabled = on;
}

/**
 * Startet die Simulation aller gewählten Lager und zeigt das Ergebnis.
 * @param {number} mode 0 = fester Einsatz, 1 = Einheitensuche
 * @returns {Promise<void>}
 */
async function runAll(mode) {
    const units = readUnits();
    if (!sum(units))
        return showMessage("Bitte bei Einheiten eine Anzahl eintragen.");
    const setup = {
        mode,
        N: +$("runs").value,
        full: $("full").checked,
        pool: mode ? units : null,
        man: mode ? null : units,
    };
    const ctx = buildContexts(selectedStates());
    const scope = document.querySelector("input[name=sc]:checked").value;
    const idx = campsFor(scope);
    if (!idx.length) return showMessage(emptyScopeMessage(scope));
    setRunning(true);
    const acc = await simulateCamps(idx, ctx, setup);
    busy = -1;
    $("curcamp").textContent = "";
    $("showplan").checked = true;
    drawMarks();
    setRunning(false);
    $("res").innerHTML = renderResults(idx, acc);
}

/** Verdrahtet die Start-Buttons. */
function initRunner() {
    $("go").onclick = () => runAll(0);
    $("srch").onclick = () => runAll(1);
}
