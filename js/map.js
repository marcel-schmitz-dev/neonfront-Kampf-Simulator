/**
 * @typedef {Object} Camp Gegnerlager einer Abenteuerkarte
 * @property {string} n Lager-ID
 * @property {number|null} x Position auf der Karte in Pixeln
 * @property {number|null} y Position auf der Karte in Pixeln
 * @property {Object<string, number>} j Gegner: Einheiten-ID -> Anzahl
 */

/**
 * @typedef {Object} Adventure Abenteuerkarte aus D.m
 * @property {string} n Name
 * @property {number} w Breite des Kartenbilds
 * @property {number} h Höhe des Kartenbilds
 * @property {string} img Kartenbild als Data-URL
 * @property {Camp[]} c Lager
 */

/**
 * @typedef {Object} CampResult Ergebnis der Simulation eines Lagers
 * @property {number} p Siegchance in %
 * @property {number} r Ø Kampfrunden je Welle
 * @property {Object<string, number>} L Ø Verluste je Einheit
 * @property {Object<string, [number, number]>} mm Minimale und maximale Verluste je Einheit
 * @property {number} viol Anteil der Läufe mit Verlusten geschützter Einheiten in %
 * @property {number} gd Anteil der Läufe, in denen der General fällt, in %
 * @property {number} w Ø Angriffswellen je Lauf
 * @property {Array<Object<string, number>>} [plan] Angriffsplan
 * @property {string} [gn] Name des eingesetzten Generals
 * @property {number} [cost] Verlustkosten
 */

/** @type {Adventure} Gewählte Abenteuerkarte */
let cur = null;

/** @type {number|null} Index des gewählten Lagers */
let sc = null;

/** @type {Object<number, CampResult>} Ergebnisse je Lagerindex */
let RES = {};

/** @type {Object<number, {gn: string, plan: Array<Object<string, number>>, p: number}>} Angriffspläne je Lagerindex */
let PLAN = {};

/** @type {number} Index des gerade simulierten Lagers, -1 = keines */
let busy = -1;

/** @type {boolean} true, solange Lager per Klick ausgewählt werden */
let selMode = false;

/** @type {number} Zoomfaktor der Karte */
let zl = 1;

/**
 * Lädt die gespeicherte Lagerauswahl.
 * @returns {Object<string, Set<number>>} Abenteuername -> Menge von Lagerindizes
 */
function loadSelections() {
    const sets = {};
    try {
        for (const [k, v] of Object.entries(readJson("nf_sel", {})))
            sets[k] = new Set(v);
    } catch {
        return sets;
    }
    return sets;
}

/** @type {Object<string, Set<number>>} Eigene Lagerauswahl je Abenteuer */
const SELS = loadSelections();

/** Speichert die Lagerauswahl. */
const saveSel = () =>
    writeJson(
        "nf_sel",
        Object.fromEntries(Object.entries(SELS).map(([k, s]) => [k, [...s]])),
    );

/**
 * Auswahl des aktuellen Abenteuers; wird bei Bedarf angelegt.
 * @returns {Set<number>}
 */
function selSet() {
    if (!SELS[cur.n]) SELS[cur.n] = new Set();
    return SELS[cur.n];
}

/**
 * Ist das Lager ein Boss- oder Anführer-Lager?
 * @param {Camp} c
 * @returns {boolean}
 */
const isBoss = (c) => Object.keys(c.j).some((x) => /Boss|Leader/.test(x));

/**
 * Beschriftung eines Lagers: Nummer statt langer ID.
 * @param {Camp} c
 * @param {number} i Index des Lagers
 * @returns {string}
 */
const lab = (c, i) => (/^\d{4,}$/.test(c.n) ? String(i + 1) : c.n);

/**
 * Kürzt einen Generalnamen für die Karte.
 * @param {string} n
 * @returns {string} höchstens 9 Zeichen
 */
const gShort = (n) =>
    n
        .replace(/^General(in)?\s+/, "")
        .replace(/[\s-]*General(in)?$/, "")
        .replace(/,.*$/, "")
        .slice(0, 9);

/**
 * Ist die Karte im Vollbild?
 * @returns {boolean}
 */
const isMapFullscreen = () => $("sec-map").classList.contains("fs");

/** Zeigt die Anzahl ausgewählter Lager an. */
function updSel() {
    $("selcnt").textContent = selSet().size;
}

/** Speichert die Lagerauswahl und zeichnet Anzeige und Markierungen neu. */
function commitSelection() {
    saveSel();
    updSel();
    drawMarks();
}

/**
 * Position eines Lagers in Prozent der Kartengröße.
 * @param {Camp} c
 * @returns {{left: string, top: string}}
 */
const markPos = (c) => ({
    left: (c.x / cur.w) * 100 + "%",
    top: (c.y / cur.h) * 100 + "%",
});

/**
 * CSS-Klassen einer Markierung.
 * @param {Camp} c
 * @param {number} i
 * @param {Set<number>} sel
 * @returns {string}
 */
const markClass = (c, i, sel) =>
    "mk" +
    (i == sc ? " sel" : "") +
    (i === busy ? " run" : "") +
    (isBoss(c) ? " boss" : "") +
    (sel.has(i) ? " pick" : "");

/**
 * Tooltip einer Markierung.
 * @param {Camp} c
 * @param {number} i
 * @param {Set<number>} sel
 * @returns {string}
 */
const markTitle = (c, i, sel) =>
    "Lager " +
    lab(c, i) +
    " (ID " +
    c.n +
    ")" +
    (isBoss(c) ? " – Boss-/Anführer-Lager" : "") +
    (sel.has(i) ? " – in deiner Auswahl" : "") +
    (RES[i] ? " – " + RES[i].p.toFixed(0) + " %" : "");

/**
 * Klick auf eine Markierung: Lager auswählen oder in die Auswahl aufnehmen.
 * @param {number} i
 * @param {Set<number>} sel
 */
function onMarkClick(i, sel) {
    if (!selMode) return pickCamp(i);
    if (sel.has(i)) sel.delete(i);
    else sel.add(i);
    commitSelection();
}

/**
 * Erzeugt die Markierung eines Lagers.
 * @param {Camp} c
 * @param {number} i
 * @param {Set<number>} sel
 * @returns {HTMLButtonElement}
 */
function createMark(c, i, sel) {
    const b = document.createElement("button");
    const r = RES[i];
    const pos = markPos(c);
    b.className = markClass(c, i, sel);
    b.textContent = lab(c, i);
    b.style.left = pos.left;
    b.style.top = pos.top;
    b.style.setProperty(
        "--c",
        r ? rateColor(r.p, "#39ff88", "#ffd23f", "#ff4d6d") : "#00f0ff",
    );
    b.title = markTitle(c, i, sel);
    b.onclick = () => onMarkClick(i, sel);
    return b;
}

/**
 * Inhalt der Plan-Anzeige an einem Lager.
 * @param {{gn: string, plan: Array<Object<string, number>>}} pl
 * @param {boolean} isFs true im Vollbild (zeigt alle Angriffe)
 * @returns {string} HTML
 */
function planTagHtml(pl, isFs) {
    const w = pl.plan.length;
    if (isFs)
        return `<b>${gShort(pl.gn)}</b> ${pl.plan.map(abbr).join(" <i>›</i> ")}`;
    return `<b>${gShort(pl.gn)}</b> ${abbr(pl.plan[0])}${w > 1 ? ` <i>+${w - 1}</i>` : ""}`;
}

/**
 * Erzeugt die Plan-Anzeige an einem Lager.
 * @param {Camp} c
 * @param {{gn: string, plan: Array<Object<string, number>>, p: number}} pl
 * @param {boolean} isFs
 * @returns {HTMLDivElement}
 */
function createPlanTag(c, pl, isFs) {
    const t = document.createElement("div");
    const pos = markPos(c);
    t.className = "ptag";
    t.style.left = pos.left;
    t.style.top = pos.top;
    t.style.setProperty(
        "--c",
        rateColor(pl.p, "#39ff88", "#ffd23f", "#ff4d6d"),
    );
    t.innerHTML = planTagHtml(pl, isFs);
    t.title =
        pl.gn +
        ": " +
        pl.plan
            .map((a, k) => "Angriff " + (k + 1) + ": " + abbr(a))
            .join(" | ");
    return t;
}

/** Zeichnet Lagermarkierungen und Plan-Anzeigen neu. */
function drawMarks() {
    document.querySelectorAll(".mk,.ptag").forEach((e) => e.remove());
    const sel = selSet();
    const showPlan = $("showplan").checked;
    const isFs = isMapFullscreen();
    cur.c.forEach((c, i) => {
        if (c.x == null) return;
        $("mapin").append(createMark(c, i, sel));
        if (showPlan && PLAN[i])
            $("mapin").append(createPlanTag(c, PLAN[i], isFs));
    });
}

/**
 * Anzeige eines Gegners im Lager-Info-Feld.
 * @param {string} id Einheiten-ID
 * @param {number} n Anzahl
 * @returns {string} HTML
 */
const enemyChip = (id, n) =>
    `<span class="chip">${ico(id)}${n}× ${nm(id)} <small>${U[id].h} HP · ${Math.round(U[id].mn)}–${Math.round(U[id].mx)}</small></span>`;

/**
 * Wählt ein Lager aus und zeigt seine Gegner an.
 * @param {number} i Index des Lagers
 */
function pickCamp(i) {
    sc = i;
    const c = cur.c[i];
    $("enemy").innerHTML =
        `<b style="width:100%">Lager ${lab(c, i)}${isBoss(c) ? " ★" : ""}</b>` +
        Object.entries(c.j)
            .map(([id, n]) => enemyChip(id, n))
            .join("");
    drawMarks();
}

/** Übernimmt die gewählte Abenteuerkarte und setzt Ergebnisse zurück. */
function pickMap() {
    cur = D.m[$("map").value];
    RES = {};
    PLAN = {};
    busy = -1;
    $("mapimg").src = cur.img;
    drawMarks();
    pickCamp(0);
    updSel();
    fitMap();
}

/** Füllt die Kartenauswahl und verdrahtet sie. */
function initMapSelect() {
    D.m.forEach((m, i) => $("map").add(new Option(m.n, i)));
    $("map").onchange = pickMap;
}
