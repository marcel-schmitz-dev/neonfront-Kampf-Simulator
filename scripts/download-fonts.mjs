// Einmalig lokal ausführen (Node 18+):  node scripts/download-fonts.mjs
// Lädt Orbitron/Rajdhani (SIL OFL 1.1) als woff2 über Fontsource in den Ordner /fonts.
// Danach die Dateien mit hochladen – der Besucher-Browser verbindet sich nie mit Dritten.
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "fonts");
const files = [
    ["orbitron", 500],
    ["orbitron", 800],
    ["rajdhani", 500],
    ["rajdhani", 600],
];

await mkdir(dir, { recursive: true });
for (const [family, weight] of files) {
    const name = `${family}-latin-${weight}-normal.woff2`;
    const url = `https://cdn.jsdelivr.net/npm/@fontsource/${family}/files/${name}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    await writeFile(join(dir, name), Buffer.from(await res.arrayBuffer()));
    console.log("OK", name);
}
