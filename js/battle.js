/**
 * @typedef {Object} BattleUnit Einzelne Einheit im Kampf
 * @property {UnitTemplate} t Kampfwerte
 * @property {string} id Einheiten-ID
 * @property {number} hp aktuelle Lebenspunkte
 * @property {number} [g] 1 = General
 */

/**
 * @typedef {Object} BattleOutcome Ergebnis eines Kampfes
 * @property {boolean} win alle Gegner besiegt
 * @property {number} r Anzahl der Kampfrunden
 * @property {Object<string, number>} loss Verluste je Einheitenart
 * @property {boolean} gd der General ist gefallen
 * @property {BattleUnit[]} E überlebende Gegner, voll geheilt
 */

/** @type {function(): number} Zufallsquelle */
const rnd = Math.random;

/** @type {number} Obergrenze der Kampfrunden */
const MAX_ROUNDS = 150;

/** @type {string[]} Reihenfolge der Einheiten in der Schlachtreihe */
const ORD = [
    "Recruit",
    "Militia",
    "Soldier",
    "EliteSoldier",
    "Swordsman",
    "Cavalry",
    "MountedSwordsman",
    "Knight",
    "Bowman",
    "Longbowman",
    "Crossbowman",
    "Marksman",
    "ArmoredMarksman",
    "MountedMarksman",
    "Cannoneer",
    "Besieger",
];

/**
 * Position einer Einheitenart in der Schlachtreihe.
 * @param {string} id
 * @returns {number} 99 für unbekannte Einheiten
 */
const unitOrder = (id) => {
    const i = ORD.indexOf(id);
    return i < 0 ? 99 : i;
};

/**
 * Erzeugt mehrere Einheiten einer Art.
 * @param {UnitTemplate} t
 * @param {number} n Anzahl
 * @returns {BattleUnit[]}
 */
const mkU = (t, n) =>
    Array.from({ length: n }, () => ({ t, id: t.id, hp: t.h }));

/**
 * Lebt die Einheit noch?
 * @param {BattleUnit} u
 * @returns {boolean}
 */
const alive = (u) => u.hp > 0;

/**
 * Lebt noch mindestens eine Einheit?
 * @param {BattleUnit[]} units
 * @returns {boolean}
 */
const anyAlive = (units) => units.some(alive);

/**
 * Erzeugt die Gegner eines Lagers mit vollen Lebenspunkten.
 * @param {Camp} c
 * @param {Modifiers} M
 * @returns {BattleUnit[]}
 */
function freshE(c, M) {
    const E = [];
    for (const id in c.j) {
        const t = tpl(id, 1, M);
        if (t) E.push(...mkU(t, c.j[id]));
    }
    return E;
}

/**
 * Kopiert Einheiten mit ihren aktuellen Lebenspunkten.
 * @param {BattleUnit[]} E
 * @returns {BattleUnit[]}
 */
const clone = (E) => E.map((u) => ({ t: u.t, id: u.id, hp: u.hp }));

/**
 * Stellt die eigene Armee in Schlachtreihe auf; der General steht hinten.
 * @param {Object<string, number>} spec Einheiten-ID -> Anzahl
 * @param {Object<string, UnitTemplate>} T Kampfwerte je Einheit
 * @param {{t: UnitTemplate}} G General
 * @returns {BattleUnit[]}
 */
function build(spec, T, G) {
    const A = [];
    const ids = Object.keys(spec).sort((a, b) => unitOrder(a) - unitOrder(b));
    for (const id of ids) A.push(...mkU(T[id], spec[id]));
    A.push({ t: G.t, id: G.t.id, hp: G.t.h, g: 1 });
    return A;
}

/**
 * Index der ersten lebenden Einheit ab einer Position.
 * @param {BattleUnit[]} L
 * @param {number} from
 * @returns {number} L.length, wenn keine mehr lebt
 */
function firstAlive(L, from) {
    let f = from;
    while (f < L.length && L[f].hp <= 0) f++;
    return f;
}

/**
 * Sucht beim Flankieren die Einheit mit den wenigsten Basis-Lebenspunkten (nie den General).
 * @param {BattleUnit[]} L
 * @param {number} f Startindex
 * @param {number} i Rückfall-Index
 * @returns {BattleUnit|null}
 */
function pickWeakest(L, f, i) {
    let x = null;
    for (let q = f; q < L.length; q++) {
        const y = L[q];
        if (y.hp > 0 && !y.g && (!x || y.t.h < x.t.h)) x = y;
    }
    const fallback = L[i];
    return x || (fallback && fallback.hp > 0 ? fallback : null);
}

/**
 * Wählt das nächste Ziel.
 * @param {UnitTemplate} t Angreifer
 * @param {BattleUnit[]} L Ziele
 * @param {number} f Index des ersten lebenden Ziels
 * @param {{i: number}} cursor aktuelle Position, wird bei Bedarf vorgerückt
 * @returns {BattleUnit|null}
 */
function pickTarget(t, L, f, cursor) {
    if (t.fl) return pickWeakest(L, f, cursor.i);
    cursor.i = firstAlive(L, cursor.i);
    return cursor.i < L.length ? L[cursor.i] : null;
}

/**
 * Führt den Angriff einer Einheit aus; Überschussschaden geht bei Splash weiter.
 * @param {BattleUnit} u Angreifer
 * @param {BattleUnit[]} L Ziele
 * @param {number} f Index des ersten lebenden Ziels
 * @param {number} r aktuelle Kampfrunde
 */
function attack(u, L, f, r) {
    const t = u.t;
    let d = rnd() * 100 < t.a ? t.mx : t.mn;
    if (!t.side) d *= 1 + ((t.bf || 0) / 100) * (r - 1);
    const splash = t.pc >= 1 || (t.pc > 0 && rnd() < t.pc);
    const cursor = { i: f };
    while (d > 0) {
        const x = pickTarget(t, L, f, cursor);
        if (!x) break;
        x.hp -= d;
        if (x.hp > 0 || !splash) break;
        d = -x.hp;
    }
}

/**
 * Einheiten, die in einer Phase angreifen.
 * @param {BattleUnit[]} A eigene Einheiten
 * @param {BattleUnit[]} E Gegner
 * @param {number} p Phase (0 Erstschlag, 1 normal, 2 letzter Schlag)
 * @param {Modifiers} M
 * @param {BattleUnit} GG General
 * @returns {BattleUnit[]}
 */
function attackersOf(A, E, p, M, GG) {
    const all = [...A, ...E].filter((u) => u.hp > 0 && u.t.ph == p);
    if (p == 2 && M.lt && GG && GG.hp > 0) all.push(GG);
    return all;
}

/**
 * Führt eine Phase einer Runde aus; alle Angriffe darin gelten als gleichzeitig.
 * @param {BattleUnit[]} A eigene Einheiten
 * @param {BattleUnit[]} E Gegner
 * @param {number} p Phase
 * @param {number} r Kampfrunde
 * @param {Modifiers} M
 * @param {BattleUnit} GG General
 */
function runPhase(A, E, p, r, M, GG) {
    const all = attackersOf(A, E, p, M, GG);
    const LA = A.filter(alive);
    const LE = E.filter(alive);
    const ptr = [0, 0];
    for (const u of all) {
        const L = u.t.side ? LA : LE;
        const s = u.t.side ? 0 : 1;
        ptr[s] = firstAlive(L, ptr[s]);
        if (ptr[s] < L.length) attack(u, L, ptr[s], r);
    }
}

/**
 * Wertet einen beendeten Kampf aus.
 * @param {BattleUnit[]} A
 * @param {BattleUnit[]} E
 * @param {number} r Anzahl der Runden
 * @param {BattleUnit} GG General
 * @returns {BattleOutcome}
 */
function outcome(A, E, r, GG) {
    const loss = {};
    A.forEach((u) => {
        if (u.hp <= 0 && !u.g) loss[u.id] = (loss[u.id] || 0) + 1;
    });
    return {
        win: !anyAlive(E),
        r,
        loss,
        gd: !!(GG && GG.hp <= 0),
        E: E.filter(alive).map((u) => ({ t: u.t, id: u.id, hp: u.t.h })),
    };
}

/**
 * Simuliert einen Kampf bis eine Seite besiegt ist.
 * @param {BattleUnit[]} A eigene Einheiten inklusive General
 * @param {BattleUnit[]} E Gegner
 * @param {Modifiers} M
 * @returns {BattleOutcome}
 */
function sim(A, E, M) {
    let r = 0;
    const GG = A.find((u) => u.g);
    while (r < MAX_ROUNDS && anyAlive(A) && anyAlive(E)) {
        r++;
        for (let p = 0; p < 3; p++) runPhase(A, E, p, r, M, GG);
    }
    return outcome(A, E, r, GG);
}
