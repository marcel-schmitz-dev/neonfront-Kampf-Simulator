/** @type {number} Maximal verteilbare Skillpunkte */
const MAX_POINTS = 21;

/** @type {Object<string, number[]>} Effektwerte je Skill-Gruppe und Stufe */
const LV = {
    lt: [1],
    acc: [10],
    rapid: [5, 10, 15],
    jugg: [20, 40, 60],
    rec: [2, 4, 6],
    sniper: [45, 85, 130],
    boss: [8, 16, 25],
    swift: [1, 2, 3],
    bf: [10, 20, 30],
    cleave: [4, 8, 12],
    heavy: [10, 20, 30],
    cap: [5, 10, 15],
};

/** @type {number[]} Splash-Chance je Skillstufe */
const SPC = [0.33, 0.66, 1];

/** @type {string} Präfix der Skill-Namen in D.s */
const S = "Skill_";

/** @type {Array<Array<[string, string, number]>>} Skillbaum: Reihen aus [Skill-ID, Effekt-Gruppe, max. Stufe] */
const TREE = [
    [
        ["IncreaseBowmanMaximumAD", "rapid", 3],
        ["IncreaseGeneralSplashAndAD", "jugg", 3],
        ["ResurrectLosses", "rec", 3],
        ["IncreasePeacefulMovementSpeed", "", 3],
    ],
    [
        ["IncreaseLongbowmanAndMarksmanAD", "sniper", 3],
        ["DescreaseBossHP", "boss", 3],
        ["GetRecruits", "", 3],
        ["IncreaseTravelSpeed", "", 3],
    ],
    [
        ["IncreaseSwiftSplashAndAD", "swift", 3],
        ["IncreaseADEveryRound", "bf", 3],
        ["IncreaseXP", "", 3],
        ["IncreaseRecoverySpeed", "", 3],
    ],
    [
        ["IncreaseEliteSoldierSplashAndAD", "cleave", 3],
        ["IncreaseHeavyAD", "heavy", 3],
        ["IncreaseCapacity", "cap", 3],
        ["IncreaseCombatSpeed", "", 3],
    ],
    [
        ["GeneralAttacksTwice", "lt", 1],
        ["IncreaseAccuracy", "acc", 1],
        ["GetStarCoins", "", 1],
        ["InstantRecovery", "", 1],
    ],
];

/**
 * Zeichnet ein Linien-Icon aus einem SVG-Pfad.
 * @param {string} d Pfaddaten
 * @returns {string} SVG als HTML
 */
const GL = (d) =>
    `<svg viewBox="0 0 24 24" class="ic" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;

const STAR =
    "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.3l6.1-.7z";
const HEART =
    "M12 20s-7-4.400-7-9.500A4 4 0 0 1 12 8a4 4 0 0 1 7 2.500C19 15.600 12 20 12 20z";
const CHEV = "M6 6l6 6-6 6M13 6l6 6-6 6";

/** @type {Object<string, string>} Skill-ID -> Icon ("u:" = Einheitenicon, "g:" = SVG-Pfad) */
const SKI = {
    IncreaseBowmanMaximumAD: "u:Bowman",
    IncreaseGeneralSplashAndAD: "u:General",
    ResurrectLosses: "g:M12 5v14M5 12h14",
    IncreasePeacefulMovementSpeed: "g:" + CHEV,
    IncreaseLongbowmanAndMarksmanAD: "u:Longbowman",
    DescreaseBossHP: "u:_skull",
    GetRecruits: "u:Recruit",
    IncreaseTravelSpeed: "g:" + CHEV,
    IncreaseSwiftSplashAndAD: "u:Cavalry",
    IncreaseADEveryRound: "g:M13 3L5 14h6l-1 7 8-11h-6z",
    IncreaseXP: "g:" + STAR,
    IncreaseRecoverySpeed: "g:" + HEART,
    IncreaseEliteSoldierSplashAndAD: "u:EliteSoldier",
    IncreaseHeavyAD: "u:Cannoneer",
    IncreaseCapacity: "g:M4 4h16v16H4zM12 8v8M8 12h8",
    IncreaseCombatSpeed: "g:M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
    GeneralAttacksTwice: "g:M5 19L19 5M5 12L12 5M12 19l7-7",
    IncreaseAccuracy:
        "g:M12 3v4M12 17v4M3 12h4M17 12h4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    GetStarCoins: "g:" + STAR,
    InstantRecovery: "g:" + HEART,
};

/**
 * @typedef {Object} SkillMeta
 * @property {string} k Effekt-Gruppe (leer = kein Kampfeffekt)
 * @property {number} mx maximale Stufe
 * @property {number} r Reihe im Baum
 * @property {string} n Anzeigename
 */

/** @type {Object<string, SkillMeta>} Skill-ID -> Metadaten */
const SKM = Object.fromEntries(
    TREE.flatMap((row, r) =>
        row.map(([id, k, mx]) => [id, { k, mx, r, n: D.s[S + id] || id }]),
    ),
);

/** @type {Object<string, number>} Aktuelle Skillung: Skill-ID -> Stufe */
let sk = {};

/**
 * Bisher verteilte Skillpunkte der aktuellen Skillung.
 * @returns {number}
 */
const spentPoints = () => sum(sk);

/**
 * Stufe einer Skill-Gruppe in einer Skillung.
 * @param {Object<string, number>} s Skillung
 * @param {string} k Effekt-Gruppe
 * @returns {number} 0, wenn nicht geskillt
 */
const lvK = (s, k) => {
    for (const id in s) if (SKM[id] && SKM[id].k == k) return s[id];
    return 0;
};

/**
 * Effektwert einer Skill-Gruppe in einer Skillung.
 * @param {Object<string, number>} s Skillung
 * @param {string} k Effekt-Gruppe
 * @returns {number} 0, wenn nicht geskillt
 */
const svK = (s, k) => {
    const l = lvK(s, k);
    return l ? LV[k][l - 1] : 0;
};

/**
 * Splash-Chance einer Skill-Gruppe in einer Skillung.
 * @param {Object<string, number>} s Skillung
 * @param {string} k Effekt-Gruppe
 * @returns {number} 0 bis 1
 */
const spK = (s, k) => {
    const l = lvK(s, k);
    return l ? SPC[l - 1] : 0;
};

/**
 * Icon eines Skills als HTML.
 * @param {string} id Skill-ID
 * @returns {string}
 */
function skIco(id) {
    if (SKIMG[id]) return `<img class="ic sic" src="${SKIMG[id]}" alt="">`;
    const v = SKI[id] || "";
    if (v.startsWith("u:")) return ico(v.slice(2));
    return v.startsWith("g:") ? GL(v.slice(2)) : "";
}

/**
 * Erzeugt die Schaltfläche eines Skills (Linksklick +1, Rechtsklick −1).
 * @param {string} id Skill-ID
 * @returns {HTMLButtonElement}
 */
function skillButton(id) {
    const m = SKM[id];
    const l = sk[id] || 0;
    const b = document.createElement("button");
    b.type = "button";
    b.className =
        "sk" +
        (l ? " on" : "") +
        (l == m.mx ? " max" : "") +
        (m.k ? "" : " dim");
    b.innerHTML = `${skIco(id)}<span>${m.n}</span><b>${l}/${m.mx}</b>`;
    b.title =
        m.n +
        (m.k ? "" : " – kein Kampfeffekt") +
        " (Linksklick +1, Rechtsklick −1)";
    b.onclick = () => clk(id);
    b.oncontextmenu = (e) => {
        e.preventDefault();
        dec(id);
    };
    return b;
}

/**
 * Erzeugt eine Reihe des Skillbaums.
 * @param {Array<[string, string, number]>} row
 * @returns {HTMLDivElement}
 */
function treeRow(row) {
    const d = document.createElement("div");
    d.className = "trow";
    row.forEach(([id]) => d.append(skillButton(id)));
    return d;
}

/** Zeichnet den Skillbaum samt Punktestand neu und aktualisiert die Kapazität. */
function drawTree() {
    const t = $("tree");
    t.innerHTML = "";
    [...TREE].reverse().forEach((row) => t.append(treeRow(row)));
    const n = spentPoints();
    $("pts").textContent = n + "/" + MAX_POINTS;
    $("skn").textContent = n + "/" + MAX_POINTS;
    cap();
}

/**
 * Erhöht einen Skill um eine Stufe; auf der letzten Stufe wird er zurückgesetzt.
 * @param {string} id Skill-ID
 */
function clk(id) {
    const m = SKM[id];
    const l = sk[id] || 0;
    if (l >= m.mx) delete sk[id];
    else {
        if (spentPoints() >= MAX_POINTS) return;
        sk[id] = l + 1;
    }
    drawTree();
    autosave();
}

/**
 * Senkt einen Skill um eine Stufe.
 * @param {string} id Skill-ID
 */
function dec(id) {
    const l = sk[id] || 0;
    if (l <= 1) delete sk[id];
    else sk[id] = l - 1;
    drawTree();
    autosave();
}

/** Setzt die komplette Skillung zurück. */
function resetSkills() {
    sk = {};
    drawTree();
    autosave();
}

/** Verdrahtet die Bedienelemente des Skillbaums. */
function initSkills() {
    $("rst").onclick = resetSkills;
}
