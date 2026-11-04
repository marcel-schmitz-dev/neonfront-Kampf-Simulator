/** @type {string} Hinweis zum Kampfmodell unter den Ergebnissen */
const MODEL_NOTE =
    "Kampfmodell nach den Spielregeln: Genauigkeit = Chance auf den hohen Schadenswert, Splash trägt Überschussschaden zur nächsten Einheit, Flankieren trifft die Einheit mit den wenigsten Basis-HP (nie den General). Reihenfolge der Ziele und Rundenablauf sind genähert. Verluste nach Rückgewinn. Der General kämpft als Einheit mit eigenen Lebenspunkten und steht in der Schlachtreihe ganz hinten. Mehrere Angriffe pro Lager: getötete Gegner bleiben tot, verletzte heilen zwischen den Angriffen voll, jeder Angriff nutzt einen frischen General. Angriffe innerhalb einer Phase sind gleichzeitig. ★ = Boss-/Anführer-Lager.";

/** @type {string} Hinweis zur Herkunft der Skillwerte */
const SKILL_NOTE =
    "Skillwerte aus den Entwickler-Angaben (Dev Diary 2017). Unsicher: Splash-Chance von Unstoppable Charge und dessen Bonus.";

/**
 * Chips mit Icon und gerundeter Zahl je Einheit.
 * @param {Object<string, number>} o Einheiten-ID -> Anzahl
 * @returns {string} HTML
 */
const unitChips = (o) =>
    Object.entries(o)
        .map(([u, v]) => `<span class="chip">${ico(u)}${Math.round(v)}</span>`)
        .join("");

/**
 * Anzeige einer Angriffswelle.
 * @param {Object<string, number>} wave Einheiten-ID -> Anzahl
 * @param {number} j Nummer der Welle ab 0
 * @returns {string} HTML
 */
const waveHtml = (wave, j) =>
    `<div class="wv"><b>A${j + 1}</b> ${Object.entries(wave)
        .map(([u, v]) => `<span class="lc">${ico(u)}${v}</span>`)
        .join("")}</div>`;

/**
 * Verluste eines Lagers: minimal bis maximal, in Klammern der Durchschnitt.
 * @param {CampResult} r
 * @returns {string} HTML
 */
const lossCellHtml = (r) =>
    Object.entries(r.mm)
        .filter(([, v]) => v[1] > 0)
        .map(
            ([u, v]) =>
                `<span class="lc">${ico(u)}${v[0]}–${v[1]} (${r.L[u].toFixed(0)})</span>`,
        )
        .join("");

/**
 * Zusatzzeilen unter der Siegchance: Fall des Generals, Schutzverletzung.
 * @param {CampResult} r
 * @returns {string} HTML
 */
const riskHtml = (r) =>
    (r.gd > 0
        ? `<div class="ls">General fällt ${r.gd.toFixed(0)}%</div>`
        : "") +
    (r.viol > 0
        ? `<div class="ls" style="color:var(--bad)">Schutz −${r.viol.toFixed(0)}%</div>`
        : "");

/**
 * Tabellenzeile eines Lagers.
 * @param {number} i Index des Lagers
 * @returns {string} HTML
 */
function resultRowHtml(i) {
    const c = cur.c[i];
    const r = RES[i];
    const col = rateColor(r.p, "var(--ok)", "#ffd23f", "var(--bad)");
    const head = `<td><b>${lab(c, i)}</b>${isBoss(c) ? " ★" : ""}<div class="ls">${r.gn}</div></td>`;
    const rate = `<td style="color:${col}">${r.p.toFixed(0)}%${riskHtml(r)}</td>`;
    const waves = `<td>${r.plan.map(waveHtml).join("")}</td>`;
    return `<tr onclick="pickCamp(${i})">${head}${rate}${waves}<td>${lossCellHtml(r) || "–"}</td></tr>`;
}

/**
 * Kennzahlen über alle simulierten Lager.
 * @param {number[]} idx Indizes der Lager
 * @param {Accumulator} acc
 * @returns {{n: number, safe: number, gdN: number, vN: number, lossT: Object<string, number>}}
 */
function summarize(idx, acc) {
    const count = (test) => idx.filter((i) => test(RES[i])).length;
    return {
        n: idx.length,
        safe: count((r) => r.p >= 95),
        gdN: count((r) => r.gd > 0),
        vN: count((r) => r.viol > 0),
        lossT: Object.fromEntries(
            Object.entries(acc.sumL).map(([u, v]) => [u, Math.round(v)]),
        ),
    };
}

/**
 * Kennzahlen-Kacheln.
 * @param {Accumulator} acc
 * @param {ReturnType<typeof summarize>} s
 * @returns {string} HTML
 */
const statsHtml = (acc, s) =>
    `<div class="stats"><div><b>${acc.wins.toFixed(1)}/${s.n}</b>erwartete Siege</div><div><b>${s.safe}/${s.n}</b>sichere Lager (≥95 %)</div><div><b>${acc.waves}</b>Angriffswellen</div><div><b>${s.vN}</b>Lager mit Schutzverletzung</div></div>`;

/**
 * Übersicht von Truppen, Verlusten, Generälen sowie General und Schutz.
 * @param {Accumulator} acc
 * @param {ReturnType<typeof summarize>} s
 * @returns {string} HTML
 */
function planHtml(acc, s) {
    const gens = Object.entries(acc.gc)
        .map(([g, v]) => v + "× " + g)
        .join(" · ");
    const general = s.gdN
        ? `General fällt in ${s.gdN} Lager(n)`
        : "General überlebt überall";
    const guard = s.vN
        ? `Schutz verletzt in ${s.vN} Lager(n)`
        : "geschützte Einheiten ohne Verluste";
    return `<div class="plan"><div><span>Truppen gesamt</span><b>${abbr(acc.allT) || "–"}</b></div><div><span>Verluste (Ø)</span><b class="lossb">${abbr(s.lossT) || "keine"}</b></div><div><span>Generäle</span><b>${gens}</b></div><div><span>General &amp; Schutz</span><b>${general} · ${guard}</b></div></div>`;
}

/**
 * Baut die komplette Ergebnisanzeige.
 * @param {number[]} idx Indizes der simulierten Lager
 * @param {Accumulator} acc
 * @returns {string} HTML
 */
function renderResults(idx, acc) {
    const s = summarize(idx, acc);
    const generals = Object.entries(acc.gc)
        .map(([g, v]) => `<span class="chip">${g}: ${v}×</span>`)
        .join("");
    const rows = idx.map(resultRowHtml).join("");
    const table = `<div class="tw"><table><tr><th>Lager / General</th><th>Sieg</th><th>Angriffe</th><th>Verluste min–max (Ø)</th></tr>${rows}</table></div>`;
    return [
        statsHtml(acc, s),
        `<label>Eingesetzte Generäle</label><div class="chips">${generals}</div>`,
        planHtml(acc, s),
        `<label>Benötigte Truppen (Maximum pro Lager)</label><div class="chips">${unitChips(acc.need)}</div>`,
        `<label>Erwartete Gesamtverluste</label><div class="chips">${unitChips(acc.sumL) || "–"}</div>`,
        `${table}<p class="note">${MODEL_NOTE}</p><p class="note">${SKILL_NOTE}</p>`,
    ].join("\n");
}
