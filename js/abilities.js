/**
 * @typedef {Object} UnitBonus Bonus oder Malus für eigene Einheiten
 * @property {string[]} ids betroffene Einheiten-IDs
 * @property {number} [hp] Lebenspunkte in %
 * @property {number} [dmg] Schaden in %
 * @property {number} [flat] fester Zusatzschaden
 * @property {number} [acc] Treffer in Prozentpunkten
 * @property {boolean} [splash] Flächenschaden
 * @property {boolean} [flank] Einheit kann flankieren
 * @property {number} [rounds] +% Schaden je Kampfrunde
 */

/**
 * @typedef {Object} EnemyMod Änderung für gegnerische Einheiten einer Kategorie
 * @property {"off"|"hv"|"all"|"boss"|"sw"|"def"} cat Kategorie (siehe CATM)
 * @property {number} v Änderung in %
 */

/**
 * @typedef {Object} AbilityDef Fähigkeiten eines Generals, wird automatisch eingerechnet
 * @property {Object<string, number>} [t] ersetzt die einfachen Werte aus D.g[].t
 * @property {UnitBonus[]} [units] Boni für eigene Einheiten
 * @property {number} [genRounds] +% Schaden je Kampfrunde für den General selbst
 * @property {EnemyMod[]} [enemyDmg] Malus auf den Schaden der Gegner
 * @property {EnemyMod[]} [enemyHp] Malus auf die Lebenspunkte der Gegner
 * @property {boolean} [noFlank] Gegner können nicht flankieren
 * @property {string[]} desc Anzeige-Text im Skill-Dialog
 */

/** @type {string[]} Berufsinfanterie */
const PRO = ["Soldier", "EliteSoldier", "Swordsman"];

/** @type {string[]} Verteidigungseinheiten (Annahme) */
const DEF = [
    "Recruit",
    "Militia",
    "Soldier",
    "EliteSoldier",
    "Swordsman",
    "MountedSwordsman",
];

/** @type {Object<string, function(string): boolean>} Prüfer für Einheitenkategorien */
const CATM = {
    off: (id) =>
        (OF.includes(id) && !SW.includes(id)) ||
        (/bowman|crossbow|marksman|archer/i.test(id) &&
            !/cavalry|mounted|rider|knight|swordsman/i.test(id)),
    hv: (id) => HV.includes(id) || /cann?on|besieg/i.test(id),
    all: () => true,
    boss: (id) => /Boss/.test(id),
    sw: (id) => /cavalry|rider|knight/i.test(id),
    def: (id) =>
        !/Boss/.test(id) && /recruit|militia|soldier|swordsman/i.test(id),
};

/** @type {Object<string, AbilityDef>} Fähigkeiten, Schlüssel = General-ID (D.g[].u) */
const ABIL = {
    ResoluteGeneral: {
        units: [{ ids: PRO, hp: 100, dmg: -30, splash: true, rounds: 50 }],
        genRounds: 50,
        enemyDmg: [
            { cat: "off", v: -30 },
            { cat: "hv", v: -30 },
        ],
        noFlank: true,
        desc: [
            "Soldaten, Elitesoldaten, Schwertkämpfer: +100 % Lebenspunkte, −30 % Schaden, Flächenschaden",
            "Diese Einheiten und der General: +50 % Schaden nach jeder Kampfrunde (stapelt sich nicht mit Kampfrausch)",
            "Gegnerische Angriffs- und Schwere Einheiten: −30 % Schaden",
            "Gegnerische Einheiten können nicht flankieren",
        ],
    },
    Xmas2019General: {
        t: {},
        units: [{ ids: SW, dmg: 20, acc: 20, splash: true, flank: true }],
        desc: [
            "Schnelle Einheiten: Flankieren, Flächenschaden, Treffer +20 %, Schaden +20 %",
        ],
    },
    GeneralLoudmouth: {
        t: {},
        enemyDmg: [{ cat: "all", v: -10 }],
        noFlank: true,
        desc: [
            "Gegnerische Einheiten: −10 % Schaden",
            "Gegner können nicht zuerst deine schwächsten Einheiten angreifen (kein Flankieren)",
        ],
    },
    Halloween2019General: {
        units: [{ ids: DEF, acc: 10, flank: true }],
        desc: ["Verteidigungseinheiten: Treffer +10 %, Flankieren"],
    },
    FrostyGeneral: {
        units: [{ ids: DEF, dmg: 30, splash: true }],
        desc: ["Verteidigungseinheiten: +30 % Schaden, Flächenschaden"],
    },
    AssassinGeneral: {
        t: {},
        enemyDmg: [{ cat: "boss", v: -25 }],
        enemyHp: [
            { cat: "boss", v: -25 },
            { cat: "def", v: -25 },
        ],
        desc: [
            "Gegnerische Bosse: −25 % Lebenspunkte, −25 % Schaden",
            "Gegnerische Verteidigungseinheiten: −25 % Lebenspunkte",
        ],
    },
    Brohmann: {
        units: [
            { ids: ["Cavalry", "Knight"], flat: 30 },
            { ids: ["Knight"], flank: true },
        ],
        desc: ["Reiterei, Ritter: +30 Schaden", "Ritter: Flankieren"],
    },
    BorisGeneral: {
        enemyDmg: [{ cat: "sw", v: -50 }],
        desc: [
            "Schnelle Einheiten: +50 % Schaden",
            "Gegnerische Schnelle Einheiten: −50 % Schaden",
        ],
    },
    SylvanaGeneral: {
        enemyDmg: [{ cat: "sw", v: -50 }],
        desc: [
            "Schnelle Einheiten: +50 % Schaden",
            "Gegnerische Schnelle Einheiten: −50 % Schaden",
        ],
    },
    GeneralVargus: {
        t: {},
        enemyDmg: [{ cat: "all", v: -5 }],
        noFlank: true,
        desc: ["Gegnerische Einheiten: −5 % Schaden, können nicht flankieren"],
    },
    GeneralNusala: {
        t: {},
        units: [{ ids: OF, splash: true, flank: true }],
        desc: ["Angriffseinheiten: Flächenschaden, Flankieren"],
    },
};
