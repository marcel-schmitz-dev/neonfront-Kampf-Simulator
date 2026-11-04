/**
 * @typedef {Object} Modifiers Alle Werte, die aus General, Fähigkeiten und Skillung in den Kampf eingehen
 * @property {number} dmg Schaden aller Einheiten in %
 * @property {number} off Schaden der Angriffseinheiten in %
 * @property {number} swift Schaden der Schnellen Einheiten in %
 * @property {number} heavy Schaden der Schweren Einheiten in %
 * @property {number} hp Lebenspunkte aller Einheiten in %
 * @property {number} edm Schaden der Gegner in %
 * @property {number} eacc Trefferfaktor der Gegner (1 = unverändert)
 * @property {boolean} all alle Einheiten greifen mit Flächenschaden an
 * @property {number} boss Lebenspunkte der Bosse in % (mindestens −75)
 * @property {number} rec Rückgewinn in % (höchstens 100)
 * @property {number} acc Treffer in Prozentpunkten
 * @property {number} bf Schadenszuwachs je Kampfrunde in %
 * @property {number} lt 1 = General greift zweimal an
 * @property {number} fS Zusatzschaden Schnelle Einheiten
 * @property {number} pS Splash-Chance Schnelle Einheiten
 * @property {number} fH Zusatzschaden Schwere Einheiten
 * @property {number} fE Zusatzschaden Elitesoldaten
 * @property {number} pE Splash-Chance Elitesoldaten
 * @property {number} sMn Mindestschaden Langbogen/Scharfschützen in %
 * @property {number} sMx Maximalschaden Langbogen/Scharfschützen in %
 * @property {number} fR Maximaler Zusatzschaden Bogenschützen
 * @property {number} fJ Zusatzschaden des Generals
 * @property {number} pJ Splash-Chance des Generals
 * @property {AbilityDef} ab Fähigkeiten des Generals
 */

/**
 * @typedef {Object} UnitTemplate Kampfwerte einer Einheitenart
 * @property {string} id Einheiten-ID
 * @property {0|1} side 0 = eigene Einheit, 1 = Gegner
 * @property {number} h Lebenspunkte
 * @property {number} mn Mindestschaden
 * @property {number} mx Maximalschaden
 * @property {number} a Trefferchance in %
 * @property {number} pc Chance auf Flächenschaden (0 bis 1)
 * @property {boolean} fl kann flankieren
 * @property {0|1|2} ph Angriffsphase (0 Erstschlag, 1 normal, 2 letzter Schlag)
 * @property {number} bf Schadenszuwachs je Kampfrunde in %
 */

/** @type {number[]} Maximalschaden-Bonus in % je Stufe des Scharfschützen-Skills */
const SNIPER_MAX_BONUS = [0, 5, 10, 15];

/**
 * Werte aus den einfachen Grunddaten eines Generals.
 * @param {Object<string, number>} t Grunddaten (D.g[].t)
 * @returns {Object} Teil der Modifiers
 */
function traitMods(t) {
    const g = (k) => t[k] || 0;
    return {
        dmg: g("dmg"),
        off: g("off"),
        swift: g("swift"),
        heavy: g("heavy"),
        hp: g("hp"),
        edm: g("edm"),
        eacc: (t.eacc ?? 100) / 100,
        all: !!t.sp,
    };
}

/**
 * Werte aus der Skillung.
 * @param {Object<string, number>} s Skillung
 * @param {Object<string, number>} t Grunddaten des Generals
 * @returns {Object} Teil der Modifiers
 */
function skillMods(s, t) {
    return {
        boss: Math.max(-75, (t.boss || 0) - svK(s, "boss")),
        rec: Math.min(100, (t.rec || 0) + svK(s, "rec")),
        acc: svK(s, "acc"),
        bf: svK(s, "bf"),
        lt: lvK(s, "lt") ? 1 : 0,
        fS: svK(s, "swift"),
        pS: spK(s, "swift"),
        fH: svK(s, "heavy"),
        fE: svK(s, "cleave"),
        pE: spK(s, "cleave"),
        sMn: svK(s, "sniper"),
        sMx: SNIPER_MAX_BONUS[lvK(s, "sniper")],
        fR: svK(s, "rapid"),
        fJ: svK(s, "jugg"),
        pJ: spK(s, "jugg"),
    };
}

/**
 * Sammelt alle Kampfmodifikatoren eines Generals.
 * @param {GeneralState} [st] General, Standard: der gewählte
 * @returns {Modifiers}
 */
const mods = (st = curState()) => ({
    ...traitMods(st.t),
    ...skillMods(st.sk, st.t),
    ab: ABIL[st.u] || {},
});

/**
 * Angriffsphase einer Einheit.
 * @param {UnitDef} s Einheit
 * @param {string[]} k Fähigkeiten-Schlüssel
 * @returns {0|1|2} 0 Erstschlag, 1 normal, 2 letzter Schlag
 */
function strikePhase(s, k) {
    if (k.includes("UnitSkillFirstStrike") || s.o == 1) return 0;
    return k.includes("UnitSkillLastStrike") ? 2 : 1;
}

/**
 * Grundwerte einer Einheit, noch ohne Boni.
 * @param {string} id Einheiten-ID
 * @param {0|1} side 0 = eigene Einheit, 1 = Gegner
 * @param {Modifiers} M
 * @returns {UnitTemplate}
 */
function baseTemplate(id, side, M) {
    const s = U[id];
    const k = s.k || [];
    return {
        id,
        side,
        h: s.h,
        mn: s.mn,
        mx: s.mx,
        a: s.a,
        pc: k.includes("UnitSkillSplashDamage") ? 1 : 0,
        fl: k.includes("UnitSkillAttackWeakestTarget"),
        ph: strikePhase(s, k),
        bf: M.bf,
    };
}

/**
 * Skaliert den Schaden nach Kategorie (alle, Angriff, Schnelle, Schwere).
 * @param {UnitTemplate} t wird verändert
 * @param {string} id
 * @param {Modifiers} M
 */
function scaleDamage(t, id, M) {
    let f = 1 + M.dmg / 100;
    if (OF.includes(id)) f *= 1 + M.off / 100;
    if (SW.includes(id)) f *= 1 + M.swift / 100;
    if (HV.includes(id)) f *= 1 + M.heavy / 100;
    t.mn *= f;
    t.mx *= f;
}

/**
 * Wendet die Einheiten-Boni der General-Fähigkeit an.
 * @param {UnitTemplate} t wird verändert
 * @param {string} id
 * @param {Modifiers} M
 */
function applyAbilityUnits(t, id, M) {
    for (const r of M.ab.units || []) {
        if (!r.ids.includes(id)) continue;
        const g = 1 + (r.dmg || 0) / 100;
        t.mn *= g;
        t.mx *= g;
        if (r.hp) t.h *= 1 + r.hp / 100;
        if (r.splash) t.pc = 1;
        if (r.flat) {
            t.mn += r.flat;
            t.mx += r.flat;
        }
        if (r.acc) t.a = Math.min(100, t.a + r.acc);
        if (r.flank) t.fl = true;
        if (r.rounds) t.bf = Math.max(t.bf, r.rounds);
    }
}

/**
 * Wendet die Skill-Boni einzelner Einheitenarten an.
 * @param {UnitTemplate} t wird verändert
 * @param {string} id
 * @param {Modifiers} M
 */
function applySkillBonuses(t, id, M) {
    const add = (v) => {
        t.mn += v;
        t.mx += v;
    };
    if (SW.includes(id) && M.fS) {
        add(M.fS);
        t.pc = Math.max(t.pc, M.pS);
    }
    if (HV.includes(id)) add(M.fH);
    if (id == "EliteSoldier" && M.fE) {
        add(M.fE);
        t.pc = Math.max(t.pc, M.pE);
    }
    if (id == "Bowman") t.mx += M.fR;
    if (id == "Longbowman" || id == "Marksman") {
        t.mn *= 1 + M.sMn / 100;
        t.mx *= 1 + M.sMx / 100;
    }
}

/**
 * Wendet alle Boni auf eine eigene Einheit an.
 * @param {UnitTemplate} t wird verändert
 * @param {string} id
 * @param {Modifiers} M
 */
function applyOwnMods(t, id, M) {
    scaleDamage(t, id, M);
    applyAbilityUnits(t, id, M);
    applySkillBonuses(t, id, M);
    t.h *= 1 + M.hp / 100;
    t.a = Math.min(100, t.a + M.acc);
    if (M.all) t.pc = 1;
}

/**
 * Wendet alle Mali auf eine gegnerische Einheit an.
 * @param {UnitTemplate} t wird verändert
 * @param {string} id
 * @param {Modifiers} M
 */
function applyEnemyMods(t, id, M) {
    let f = 1 + M.edm / 100;
    for (const r of M.ab.enemyDmg || [])
        if (CATM[r.cat](id)) f *= 1 + r.v / 100;
    if (M.ab.noFlank) t.fl = false;
    for (const r of M.ab.enemyHp || [])
        if (CATM[r.cat](id)) t.h *= 1 + r.v / 100;
    t.mn *= f;
    t.mx *= f;
    t.a = Math.min(100, t.a * M.eacc);
    if (/Boss/.test(id)) t.h *= 1 + M.boss / 100;
}

/**
 * Berechnet die Kampfwerte einer Einheitenart.
 * @param {string} id Einheiten-ID
 * @param {0|1} side 0 = eigene Einheit, 1 = Gegner
 * @param {Modifiers} M
 * @returns {UnitTemplate|null} null bei unbekannter Einheit
 */
function tpl(id, side, M) {
    if (!U[id]) return null;
    const t = baseTemplate(id, side, M);
    if (side == 0) applyOwnMods(t, id, M);
    else applyEnemyMods(t, id, M);
    return t;
}

/**
 * Kampfwerte des Generals.
 * @param {Modifiers} M
 * @param {GeneralState} [st] General, Standard: der gewählte
 * @returns {UnitTemplate}
 */
function genT(M, st = curState()) {
    const f = 1 + (st.t.dmg || 0) / 100;
    return {
        id: st.u,
        side: 0,
        h: st.h || 1,
        mn: st.mn * f + M.fJ,
        mx: st.mx * f + M.fJ,
        a: Math.min(100, st.a + M.acc),
        pc: st.sp || M.all ? 1 : M.pJ,
        fl: !!st.fl,
        ph: st.fs ? 0 : st.ls ? 2 : 1,
        bf: Math.max(M.bf, M.ab.genRounds || 0),
    };
}
