// ============================================================
// Fähigkeiten der Generäle
// Alles hier wird automatisch in die Simulation eingerechnet –
// der Nutzer muss nichts einstellen. Schlüssel = General-ID (D.g[].u).
//
//  units     Bonus/Malus für EIGENE Einheiten (ids):
//            hp %, dmg %, splash (Flächenschaden), rounds (+% Schaden je Kampfrunde)
//  genRounds +% Schaden je Kampfrunde für den General selbst
//  enemyDmg  Malus auf den Schaden gegnerischer Einheiten (cat: 'off' = Angriffs-, 'hv' = Schwere Einheiten)
//  noFlank   Gegner können nicht flankieren
//  desc      Anzeige-Text im Skill-Dialog
//
// Einfache Werte (Schnelle +%, Gegner-Schaden, Rückgewinn …) stehen weiter in D.g[].t (data.js).
// ============================================================
const PRO=['Soldier','EliteSoldier','Swordsman'];   // Berufsinfanterie
const CATM={
  off:id=>OF.includes(id)||(/bowman|crossbow|cavalry|marksman|knight|rider|archer/i.test(id)&&!/swordsman/i.test(id)),
  hv:id=>HV.includes(id)||/cann?on|besieg/i.test(id)
};
const ABIL={
  ResoluteGeneral:{
    units:[{ids:PRO,hp:100,dmg:-30,splash:true,rounds:50}],
    genRounds:50,
    enemyDmg:[{cat:'off',v:-30},{cat:'hv',v:-30}],
    noFlank:true,
    desc:[
      'Soldaten, Elitesoldaten, Schwertkämpfer: +100 % Lebenspunkte, −30 % Schaden, Flächenschaden',
      'Diese Einheiten und der General: +50 % Schaden nach jeder Kampfrunde (stapelt sich nicht mit Kampfrausch)',
      'Gegnerische Angriffs- und Schwere Einheiten: −30 % Schaden',
      'Gegnerische Einheiten können nicht flankieren'
    ]
  }
};
