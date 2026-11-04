/** @type {Object<string, boolean>} Einheiten-ID -> geschützt (darf keine Verluste haben) */
const lock = {};

/** @type {Object<string, {row: HTMLElement, lk: HTMLElement}>} Einheiten-ID -> Zeilenelemente */
const ROWS = {};

/** @type {string[]} Nur diese Einheiten dürfen fallen, alle anderen werden geschützt */
const TANKS = ["Swordsman", "MountedSwordsman", "Knight"];

/**
 * Erzeugt ein Button-Icon im einheitlichen Stil.
 * @param {string} inner SVG-Inhalt
 * @param {boolean} [rounded] true = zusätzlich runde Linienverbindungen
 * @returns {string} SVG als HTML
 */
const btnSvg = (inner, rounded = true) =>
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"${rounded ? ' stroke-linejoin="round"' : ""}>${inner}</svg>`;

/** @type {{fill: string, zero: string, lock: string}} Icons der Einheiten-Buttons */
const IC = {
    fill: btnSvg('<path d="M5 4h14M12 20V8M6 13l6-6 6 6"/>'),
    zero: btnSvg('<path d="M5 20h14M12 4v12M6 11l6 6 6-6"/>'),
    lock: btnSvg(
        '<circle cx="12" cy="12" r="8"/><path d="M6.3 6.3l11.4 11.4"/>',
        false,
    ),
};

/**
 * Erzeugt einen kleinen Icon-Button.
 * @param {string} svg Icon als HTML
 * @param {string} title Tooltip
 * @param {function(): void} fn Klick-Handler
 * @returns {HTMLButtonElement}
 */
function mkBtn(svg, title, fn) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ub";
    b.innerHTML = svg;
    b.title = title;
    b.onclick = fn;
    return b;
}

/**
 * Schützt eine Einheit oder hebt den Schutz auf.
 * @param {string} id Einheiten-ID
 * @param {boolean} v true = schützen
 */
function setLock(id, v) {
    lock[id] = !!v;
    ROWS[id].row.classList.toggle("lk", !!v);
    ROWS[id].lk.classList.toggle("on", !!v);
}

/**
 * Erzeugt das Zahlenfeld einer Einheit.
 * @param {string} id Einheiten-ID
 * @returns {HTMLInputElement}
 */
function unitInput(id) {
    const inp = document.createElement("input");
    inp.type = "number";
    inp.min = 0;
    inp.value = 0;
    inp.id = "u_" + id;
    inp.oninput = cap;
    return inp;
}

/**
 * Erzeugt die Zeile einer Einheit mit Zahlenfeld, Auffüllen, Leeren und Schutz.
 * @param {string} id Einheiten-ID
 * @returns {HTMLDivElement}
 */
function buildUnitRow(id) {
    const row = document.createElement("div");
    row.className = "urow";
    row.innerHTML = `<div class="un">${ico(id)}<span>${nm(id)}</span></div>`;
    const inp = unitInput(id);
    const fill = mkBtn(
        IC.fill,
        "Auf die maximale Kapazität des Generals auffüllen",
        () => {
            inp.value = capMax();
            cap();
        },
    );
    const zero = mkBtn(IC.zero, "Auf 0 setzen", () => {
        inp.value = 0;
        cap();
    });
    const lk = mkBtn(
        IC.lock,
        "Schützen: Einheit kämpft mit, darf aber keine Verluste haben",
        () => {
            setLock(id, !lock[id]);
            cap();
        },
    );
    row.append(inp, fill, zero, lk);
    ROWS[id] = { row, lk };
    return row;
}

/** Baut die Einheitenliste auf und verdrahtet die Sammel-Buttons. */
function initUnits() {
    D.p.forEach((id) => $("units").append(buildUnitRow(id)));
    $("uclear").onclick = () => {
        D.p.forEach((id) => ($("u_" + id).value = 0));
        cap();
    };
    $("tank").onclick = () => {
        D.p.forEach((id) => setLock(id, !TANKS.includes(id)));
        cap();
    };
}

/**
 * Maximale Kapazität eines Generals inklusive Kapazitäts-Skill.
 * @param {GeneralState} [st] General, Standard: der gewählte
 * @returns {number}
 */
const capMax = (st = curState()) => st.c + svK(st.sk, "cap");

/**
 * Gesamtzahl der eingetragenen Einheiten.
 * @returns {number}
 */
const deployedCount = () =>
    D.p.reduce((t, id) => t + (+$("u_" + id).value || 0), 0);

/** Aktualisiert Kapazitätsbalken und -text und danach die Kurzübersicht. */
function cap() {
    const t = deployedCount();
    const c = capMax();
    $("capbar").style.width = Math.min(100, (t / c) * 100) + "%";
    $("captxt").innerHTML =
        `Einsatz <b>${t}</b> / ${c}` +
        (t > c
            ? ` <em>· mehr als die Kapazität – die Einheitensuche wählt daraus die beste Armee</em>`
            : "");
    effp();
}

/**
 * Grundwerte des Generals als Anzeigezeilen.
 * @param {GeneralState} st
 * @param {Modifiers} M
 * @param {UnitTemplate} g Kampfwerte des Generals
 * @returns {Array<[string, string|number]>} Paare aus [Bezeichnung, Wert]
 */
function effBaseRows(st, M, g) {
    const spc = st.sp || M.all ? 100 : M.pJ * 100;
    const init = st.fs ? "Erstschlag" : st.ls ? "Letzter Schlag" : "Normal";
    return [
        ["Schaden", Math.round(g.mn) + "–" + Math.round(g.mx)],
        ["Treffer", g.a + " %"],
        ["Kapazität", capMax(st)],
        ["Lebenspunkte", st.h],
        ["Angriffe/Runde", M.lt ? 2 : 1],
        ["Initiative", init],
        ["Splash", spc ? spc.toFixed(0) + " %" : "–"],
        ["Flankieren", st.fl ? "Ja" : "Nein"],
    ];
}

/**
 * Skill-Boni als Anzeigezeilen; nur Boni, die tatsächlich wirken.
 * @param {Modifiers} M
 * @returns {Array<[string, string]>}
 */
function effBonusRows(M) {
    const bonuses = [
        [
            M.fS,
            "Schnelle",
            `+${M.fS} Schaden, Splash ${Math.round(M.pS * 100)} %`,
        ],
        [
            M.fE,
            "Elitesoldaten",
            `+${M.fE} Schaden, Splash ${Math.round(M.pE * 100)} %`,
        ],
        [M.fH, "Schwere", "+" + M.fH + " Schaden"],
        [M.fR, "Bogenschützen", "Max +" + M.fR],
        [M.sMn, "Langbogen/Scharfsch.", `Min +${M.sMn} %, Max +${M.sMx} %`],
        [M.bf, "Kampfrausch", "+" + M.bf + " % pro Runde"],
        [M.boss, "Boss-HP", M.boss + " %"],
        [M.rec, "Rückgewinn", M.rec + " %"],
    ];
    return bonuses.filter(([on]) => on).map(([, label, text]) => [label, text]);
}

/**
 * Zeigt die berechneten Werte des Generals an.
 * @param {GeneralState} st
 * @param {Modifiers} M
 * @param {UnitTemplate} g Kampfwerte des Generals
 */
function effDetail(st, M, g) {
    const rows = [...effBaseRows(st, M, g), ...effBonusRows(M)];
    $("eff").innerHTML = rows
        .map((x) => `<div><span>${x[0]}</span><b>${x[1]}</b></div>`)
        .join("");
}

/** Aktualisiert die Kurzübersichten und die berechneten Werte des Generals. */
function effp() {
    const st = curState();
    const M = mods(st);
    const g = genT(M, st);
    $("gsum").innerHTML = $("dsum").innerHTML =
        `<span>Kapazität<b>${capMax(st)}</b></span><span>Schaden<b>${Math.round(g.mn)}–${Math.round(g.mx)}</b></span><span>Treffer<b>${g.a} %</b></span><span>Skills<b>${spentPoints()}/${MAX_POINTS}</b></span>`;
    effDetail(st, M, g);
}
