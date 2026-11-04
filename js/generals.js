/**
 * @typedef {Object} GeneralDef General aus D.g
 * @property {string} n Anzeigename
 * @property {string} u Spiel-ID
 * @property {number} c Kapazität
 * @property {number} mn Mindestschaden
 * @property {number} mx Maximalschaden
 * @property {number} a Trefferchance in %
 * @property {number} h Lebenspunkte
 * @property {number} [fs] 1 = Erstschlag
 * @property {number} [ls] 1 = letzter Schlag
 * @property {number} [sp] 1 = Flächenschaden
 * @property {number} [fl] 1 = Flankieren
 * @property {Object<string, number>} [t] einfache Werte (dmg, off, swift, heavy, hp, edm, eacc, boss, rec)
 * @property {string} [note] Hinweis zur Datenquelle
 */

/**
 * @typedef {Object} SavedBuild Benannte, gespeicherte Skillung
 * @property {string} name
 * @property {string} u General-ID
 * @property {Object<string, number>} sk Skill-ID -> Stufe
 */

/**
 * @typedef {Object} GeneralState General samt gewählter Skillung
 * @property {string} n Anzeigename (bei benannter Skillung deren Name)
 * @property {string} u Spiel-ID
 * @property {number} mn Mindestschaden
 * @property {number} mx Maximalschaden
 * @property {number} a Trefferchance in %
 * @property {number} h Lebenspunkte
 * @property {number} c Grundkapazität
 * @property {boolean} fs Erstschlag
 * @property {boolean} ls letzter Schlag
 * @property {boolean} sp Flächenschaden
 * @property {boolean} fl Flankieren
 * @property {Object<string, number>} t einfache Werte inklusive eacc
 * @property {Object<string, number>} sk Skillung
 */

/** @type {string} Vorauswahl, wenn kein General gespeichert ist */
const DEFAULT_GENERAL = "G:ResoluteGeneral";

/** @type {Array<[string, string, string]>} Anzeigezeilen der Grundwerte: [Schlüssel, Beginn, Ende] */
const TRAIT_ROWS = [
    ["dmg", "Alle Einheiten: ", " Schaden"],
    ["off", "Angriffseinheiten: ", " Schaden"],
    ["swift", "Schnelle Einheiten: ", " Schaden"],
    ["heavy", "Schwere Einheiten: ", " Schaden"],
    ["hp", "Alle Einheiten: ", " Lebenspunkte"],
    ["edm", "Gegnerische Einheiten: ", " Schaden"],
];

/**
 * Vergleicht zwei Generäle nach Namen.
 * @param {GeneralDef} a
 * @param {GeneralDef} b
 * @returns {number}
 */
const cmp = (a, b) => a.n.localeCompare(b.n, "de");

/** @type {GeneralDef[]} Alle Standard-Generäle, alphabetisch */
const std = [...D.g].sort(cmp);

/** @type {SavedBuild[]} Benannte Skillungen */
let SAVED = readJson("nf_gens", []);

/** @type {Object<string, {sk: Object<string, number>}>} Letzte Skillung je Standard-General */
let BUILDS = readJson("nf_builds", {});

/** @type {boolean} true, solange ein General geladen wird (verhindert Autosave) */
let loading = false;

/** Speichert die benannten Skillungen. */
const persist = () => writeJson("nf_gens", SAVED);

/** Speichert die Skillungen der Standard-Generäle. */
const persistB = () => writeJson("nf_builds", BUILDS);

/**
 * Ist der Wert eine benannte Skillung ("S:...")?
 * @param {string} v Auswahlwert
 * @returns {boolean}
 */
const isVar = (v) => v.startsWith("S:");

/**
 * Sucht die benannte Skillung zu einem Auswahlwert.
 * @param {string} v Auswahlwert ("S:Name")
 * @returns {SavedBuild|undefined}
 */
const varOf = (v) => SAVED.find((x) => x.name == v.slice(2));

/**
 * Liefert den Standard-General hinter einem Auswahlwert.
 * @param {string} v Auswahlwert ("G:ID" oder "S:Name")
 * @returns {GeneralDef}
 */
const base = (v) =>
    D.g.find((g) => g.u == (isVar(v) ? varOf(v).u : v.slice(2)));

/**
 * Anzeigename einer benannten Skillung, z. B. "Test (Brohmann)".
 * @param {SavedBuild} x
 * @returns {string}
 */
const varLabel = (x) =>
    `${x.name} (${(D.g.find((g) => g.u == x.u) || { n: x.u }).n})`;

/**
 * Benannte Skillungen, alphabetisch sortiert.
 * @returns {SavedBuild[]}
 */
const sortedSaved = () =>
    [...SAVED].sort((a, b) => a.name.localeCompare(b.name, "de"));

/**
 * Erzeugt eine Optionsgruppe für das Auswahlfeld.
 * @param {string} label Gruppenname
 * @param {Array<[string, string]>} options Paare aus [Text, Wert]
 * @returns {HTMLOptGroupElement}
 */
function optGroup(label, options) {
    const g = document.createElement("optgroup");
    g.label = label;
    options.forEach(([text, value]) => g.append(new Option(text, value)));
    return g;
}

/**
 * Wählt einen General im Auswahlfeld; fällt auf Standardwerte zurück.
 * @param {HTMLSelectElement} select
 * @param {string} [keep] gewünschter Wert
 */
function chooseGeneral(select, keep) {
    select.value = keep || storeGet("nf_lastgen") || DEFAULT_GENERAL;
    if (!select.value) select.value = DEFAULT_GENERAL;
    if (!select.value) select.value = "G:" + std[0].u;
}

/**
 * Füllt das General-Auswahlfeld neu.
 * @param {string} [keep] Wert, der danach gewählt sein soll
 */
function genOpts(keep) {
    const s = $("gen");
    s.innerHTML = "";
    SAVED = SAVED.filter((x) => D.g.some((g) => g.u == x.u));
    if (SAVED.length) {
        const options = sortedSaved().map((x) => [
            "★ " + varLabel(x),
            "S:" + x.name,
        ]);
        s.append(optGroup("Deine Skillungen", options));
    }
    s.append(
        optGroup(
            "Generäle",
            std.map((g) => [g.n, "G:" + g.u]),
        ),
    );
    chooseGeneral(s, keep);
    mgList();
}

/**
 * Werte aller angehakten Generäle im Vergleichsfeld.
 * @returns {string[]}
 */
const mgSel = () =>
    [...document.querySelectorAll("#mgl input:checked")].map((i) => i.value);

/** Aktualisiert die Beschriftung des Vergleichsfelds. */
const mgCount = () => {
    $("mgs").textContent =
        "Mehrere Generäle vergleichen (" + mgSel().length + " gewählt)";
};

/**
 * Erzeugt einen Eintrag der Vergleichsliste.
 * @param {string} value Auswahlwert
 * @param {string} text Anzeigetext
 * @param {boolean} checked
 * @returns {HTMLLabelElement}
 */
function mgItem(value, text, checked) {
    const l = document.createElement("label");
    l.className = "mgi";
    l.innerHTML = `<input type="checkbox" value="${value}"${checked ? " checked" : ""}> ${text}`;
    l.querySelector("input").onchange = mgCount;
    return l;
}

/** Baut die Vergleichsliste neu auf und behält die Auswahl bei. */
function mgList() {
    const d = $("mgl");
    const keep = new Set(mgSel());
    d.innerHTML = "";
    sortedSaved().forEach((x) => {
        const v = "S:" + x.name;
        d.append(mgItem(v, "★ " + varLabel(x), keep.has(v)));
    });
    std.forEach((g) => {
        const v = "G:" + g.u;
        d.append(mgItem(v, g.n, keep.has(v)));
    });
    mgCount();
}

/**
 * Hakt alle Generäle im Vergleichsfeld an oder ab.
 * @param {boolean} on
 */
function setAllCompare(on) {
    document.querySelectorAll("#mgl input").forEach((i) => (i.checked = on));
    mgCount();
}

/** Speichert die aktuelle Skillung automatisch beim gewählten General. */
function autosave() {
    if (loading) return;
    const v = $("gen").value;
    if (isVar(v)) {
        const x = varOf(v);
        if (x) {
            x.sk = { ...sk };
            persist();
        }
        return;
    }
    BUILDS[v.slice(2)] = { sk: { ...sk } };
    persistB();
}

/**
 * Gespeicherte Skillung zu einem Auswahlwert.
 * @param {string} v Auswahlwert
 * @returns {Object<string, number>} Kopie der Skillung, leer wenn keine vorhanden
 */
const skOf = (v) =>
    isVar(v)
        ? { ...((varOf(v) || {}).sk || {}) }
        : { ...((BUILDS[v.slice(2)] || {}).sk || {}) };

/**
 * Baut den Kampfzustand eines Generals aus Grunddaten, Fähigkeiten und Skillung.
 * @param {string} v Auswahlwert
 * @returns {GeneralState}
 */
function stateOf(v) {
    const g = base(v);
    const ab = ABIL[g.u] || {};
    return {
        n: isVar(v) ? v.slice(2) : g.n,
        u: g.u,
        mn: g.mn,
        mx: g.mx,
        a: g.a,
        fs: !!g.fs,
        ls: !!g.ls,
        sp: !!g.sp,
        fl: !!g.fl,
        t: { eacc: 100, ...(ab.t || g.t || {}) },
        sk: skOf(v),
        c: g.c,
        h: g.h,
    };
}

/**
 * Zustand des gewählten Generals mit der aktuell angezeigten Skillung.
 * @returns {GeneralState}
 */
function curState() {
    const st = stateOf($("gen").value);
    st.sk = { ...sk };
    return st;
}

/**
 * Zustände aller zum Vergleich angehakten Generäle, sonst nur der gewählte.
 * @returns {GeneralState[]}
 */
function selectedStates() {
    const vs = mgSel();
    return vs.length ? vs.map(stateOf) : [curState()];
}

/**
 * Formatiert eine Prozentzahl mit Vorzeichen, z. B. "+10 %".
 * @param {number} v
 * @returns {string}
 */
const signed = (v) => (v > 0 ? "+" : "") + v + " %";

/**
 * Fähigkeiten eines Generals als lesbare Zeilen.
 * @param {GeneralDef} g
 * @returns {string[]}
 */
function traitLines(g) {
    const ab = ABIL[g.u];
    if (ab && ab.desc) return ab.desc;
    const t = g.t || {};
    const lines = TRAIT_ROWS.filter(([k]) => t[k]).map(
        ([k, pre, post]) => pre + signed(t[k]) + post,
    );
    if (t.eacc != null && t.eacc !== 100)
        lines.push("Gegnerische Trefferchance: " + t.eacc + " %");
    if (t.boss) lines.push("Boss-Lebenspunkte: " + signed(t.boss));
    if (t.rec)
        lines.push("Rückgewinn: " + t.rec + " % der verlorenen Einheiten");
    if (t.sp) lines.push("Alle Einheiten greifen mit Flächenschaden an");
    return lines;
}

/** Zeigt Fähigkeiten und Hinweis des gewählten Generals an. */
function renderTraits() {
    const g = base($("gen").value);
    const lines = traitLines(g);
    const note = (g.note || "").replace(/,?\s*bitte anpassen\.?/i, ".");
    const list = lines.length
        ? "<ul>" + lines.map((x) => `<li>${x}</li>`).join("") + "</ul>"
        : '<p class="note">Keine besonderen Fähigkeiten hinterlegt.</p>';
    $("gnote").innerHTML = list + (note ? `<p class="note">${note}</p>` : "");
}

/** Übernimmt die Auswahl im General-Feld: lädt Skillung, Fähigkeiten und Baum. */
function pickGen() {
    loading = true;
    const v = $("gen").value;
    const g = base(v);
    sk = skOf(v);
    $("skt").textContent = isVar(v) ? v.slice(2) + " (" + g.n + ")" : g.n;
    $("sname").value = isVar(v) ? v.slice(2) : "";
    $("del").disabled = !isVar(v);
    storeSet("nf_lastgen", v);
    renderTraits();
    loading = false;
    drawTree();
}

/** Speichert die Skillung unter dem eingegebenen Namen (derselbe General darf mehrfach vorkommen). */
function saveBuild() {
    const name = $("sname").value.trim();
    if (!name) return;
    const entry = { name, u: base($("gen").value).u, sk: { ...sk } };
    const i = SAVED.findIndex((x) => x.name == name);
    if (i >= 0) SAVED[i] = entry;
    else SAVED.push(entry);
    persist();
    genOpts("S:" + name);
    pickGen();
}

/** Löscht die gewählte benannte Skillung nach Rückfrage. */
function deleteBuild() {
    const v = $("gen").value;
    if (!isVar(v)) return;
    if (!confirm("Skillung „" + v.slice(2) + "“ löschen?")) return;
    SAVED = SAVED.filter((x) => x.name != v.slice(2));
    persist();
    genOpts();
    pickGen();
}

/** Verdrahtet die Bedienelemente der Generalauswahl. */
function initGenerals() {
    $("gen").onchange = pickGen;
    $("save").onclick = saveBuild;
    $("del").onclick = deleteBuild;
    $("mga").onclick = () => setAllCompare(true);
    $("mgn").onclick = () => setAllCompare(false);
}
