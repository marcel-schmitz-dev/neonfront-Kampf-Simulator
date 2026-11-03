# NEONFRONT – Siedler Kampflabor

Inoffizieller Neon/Cyberpunk-Kampfsimulator für Die Siedler Online (Fan-Projekt).
Läuft komplett im Browser, einfach `index.html` öffnen oder per GitHub Pages hosten.

## Struktur
```
index.html        Markup (Header, Karten, Dialoge, Footer)
css/style.css     gesamtes Styling
js/data.js        Spieldaten (Einheiten, Generäle, Karten, Icons) – große Datei
js/core.js        Hilfsfunktionen, Konstanten, Einheiten-Kürzel
js/abilities.js   Fähigkeiten der Generäle (z. B. Entschlossener General) – hier neue Generäle ergänzen
js/icons.js       Original-Skill-Icons (Base64)
js/skills.js      Skillbaum
js/generals.js    Generäle, pro General gespeicherte Skillung
js/units.js       Einheiten-Liste, Kapazität, Kurzübersicht
js/map.js         Abenteuerkarte & Lager
js/sim.js         Kampfmodell, Einheitensuche
js/results.js     Simulation starten, Ergebnistabelle
js/main.js        Event-Verdrahtung, Dialoge, Start
```
Die Skripte werden der Reihe nach geladen (siehe `index.html`), es gibt kein Build-System.

## Vor dem Veröffentlichen
- Impressum und Datenschutz in `index.html` (Dialog `#legal`): gelbe Platzhalter `[…]` ersetzen.
- Optional: Google Fonts lokal einbinden (Datenschutz).
