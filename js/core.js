/**
 * @typedef {Object} UnitDef Einheit aus D.u
 * @property {string} n Anzeigename
 * @property {number} h Lebenspunkte
 * @property {number} a Trefferchance in %
 * @property {number} mn Mindestschaden
 * @property {number} mx Maximalschaden
 * @property {number} [o] Angriffsreihenfolge (1 = greift zuerst an)
 * @property {string[]} [k] Fähigkeiten-Schlüssel des Spiels
 * @property {number} [b] Dauer in Sekunden (Grundlage der Verlustkosten)
 */

/**
 * Kurzform für document.getElementById.
 * @param {string} s ID des Elements
 * @returns {HTMLElement}
 */
const $ = (s) => document.getElementById(s);

/** @type {Object<string, UnitDef>} */
const U = D.u;

/** @type {Object<string, string>} Einheiten-ID -> Icon als Data-URL */
const I = D.i;

/** @type {string[]} Schnelle Einheiten */
const SW = ["Cavalry", "Knight", "MountedSwordsman", "MountedMarksman"];

/** @type {string[]} Schwere Einheiten */
const HV = ["Cannoneer", "Besieger"];

/** @type {string[]} Angriffseinheiten */
const OF = [
    "Bowman",
    "Longbowman",
    "Crossbowman",
    "Marksman",
    "ArmoredMarksman",
    "MountedMarksman",
    "Cavalry",
    "Knight",
];

/** @type {Object<string, string>} Einheiten-ID -> Kurzform wie im Wiki-Simulator */
const ABBR = {
    Recruit: "REK",
    Militia: "MIL",
    Soldier: "SOL",
    EliteSoldier: "ES",
    Swordsman: "SK",
    MountedSwordsman: "BSK",
    Knight: "RI",
    Cavalry: "REI",
    Bowman: "BS",
    Longbowman: "LB",
    Crossbowman: "AB",
    Marksman: "SS",
    ArmoredMarksman: "GSS",
    MountedMarksman: "BSS",
    Cannoneer: "KAN",
    Besieger: "BEL",
};

/**
 * Liest einen Text aus dem localStorage.
 * @param {string} key
 * @returns {string|null} null, wenn der Eintrag fehlt oder der Zugriff scheitert
 */
function storeGet(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

/**
 * Schreibt einen Text in den localStorage; Fehler werden ignoriert.
 * @param {string} key
 * @param {string} text
 */
function storeSet(key, text) {
    try {
        localStorage.setItem(key, text);
    } catch {
        return;
    }
}

/**
 * Liest und parst einen JSON-Wert aus dem localStorage.
 * @template T
 * @param {string} key
 * @param {T} fallback Wert bei fehlendem oder defektem Eintrag
 * @returns {T}
 */
function readJson(key, fallback) {
    try {
        const raw = storeGet(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

/**
 * Speichert einen Wert als JSON im localStorage.
 * @param {string} key
 * @param {*} value
 */
function writeJson(key, value) {
    try {
        storeSet(key, JSON.stringify(value));
    } catch {
        return;
    }
}

/**
 * Summe aller Werte eines Objekts.
 * @param {Object<string, number>} o
 * @returns {number}
 */
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);

/**
 * Wählt je nach Erfolgsquote eine von drei Farben.
 * @param {number} p Quote in %
 * @param {string} good ab 80 %
 * @param {string} mid ab 40 %
 * @param {string} bad darunter
 * @returns {string}
 */
const rateColor = (p, good, mid, bad) => (p >= 80 ? good : p >= 40 ? mid : bad);

/**
 * Gibt dem Browser Zeit zum Neuzeichnen, bevor es weitergeht.
 * @returns {Promise<void>}
 */
const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Icon einer Einheit als HTML (Bild oder Anfangsbuchstabe).
 * @param {string} id Einheiten-ID
 * @returns {string}
 */
const ico = (id) =>
    I[id]
        ? `<img class="ic" src="${I[id]}" alt="">`
        : `<span class="ic">${(id || "?")[0]}</span>`;

/**
 * Anzeigename einer Einheit.
 * @param {string} id Einheiten-ID
 * @returns {string} Name oder die ID, falls keiner hinterlegt ist
 */
const nm = (id) => (U[id] && U[id].n) || id;

/**
 * Kurzform einer Einheitenmenge, z. B. "40SK 20BS".
 * @param {Object<string, number>} o Einheiten-ID -> Anzahl
 * @returns {string}
 */
const abbr = (o) =>
    Object.entries(o)
        .filter(([, n]) => n > 0)
        .map(([u, n]) => Math.round(n) + (ABBR[u] || u))
        .join(" ");
