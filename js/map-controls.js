/**
 * Breite der Karte im Vollbild: so groß wie möglich bei gleichem Seitenverhältnis.
 * @returns {string} CSS-Breite in Pixeln
 */
function fullscreenWidth() {
    const w = $("mapw");
    const ratio = cur.w / cur.h;
    const fit = Math.min(w.clientWidth - 4, (w.clientHeight - 4) * ratio);
    return Math.max(200, Math.floor(fit)) + "px";
}

/** Passt die Kartenbreite an Zoomstufe oder Vollbild an. */
function fitMap() {
    $("mapin").style.width = isMapFullscreen()
        ? fullscreenWidth()
        : zl * 100 + "%";
}

/**
 * Schaltet das Kartenvollbild um.
 * @param {boolean} [on] gewünschter Zustand, ohne Angabe wird umgeschaltet
 */
function toggleFs(on) {
    const fsOn = on === undefined ? !isMapFullscreen() : on;
    $("sec-map").classList.toggle("fs", fsOn);
    document.querySelector(".side").classList.toggle("fs-on", fsOn);
    document.documentElement.classList.toggle("noscroll", fsOn);
    $("mfs").title = fsOn
        ? "Vollbild beenden (Esc)"
        : "Karte im Vollbild (Esc zum Schließen)";
    zl = 1;
    fitMap();
    drawMarks();
}

/**
 * Ändert den Zoom der Karte.
 * @param {number} delta Änderung der Zoomstufe
 */
function zoomMap(delta) {
    zl = Math.min(4, Math.max(1, zl + delta));
    fitMap();
}

/** Schaltet die Lagerauswahl per Klick um. */
function toggleSelMode() {
    selMode = !selMode;
    $("rq").textContent =
        "Lager auswählen: " + (selMode ? "AN (Karte anklicken)" : "aus");
    $("rq").classList.toggle("on", selMode);
}

/**
 * Esc beendet das Vollbild, sofern kein Dialog offen ist.
 * @param {KeyboardEvent} e
 */
function onEscape(e) {
    const dialogOpen = document.querySelector("dialog[open]");
    if (e.key === "Escape" && isMapFullscreen() && !dialogOpen) toggleFs(false);
}

/** Verdrahtet Zoom, Vollbild und Lagerauswahl der Karte. */
function initMapControls() {
    $("zp").onclick = () => zoomMap(0.5);
    $("zm").onclick = () => zoomMap(-0.5);
    $("mfs").onclick = () => toggleFs();
    $("rq").onclick = toggleSelMode;
    $("selclr").onclick = () => {
        selSet().clear();
        commitSelection();
    };
    $("showplan").onchange = drawMarks;
    document.addEventListener("keydown", onEscape);
    window.addEventListener("resize", fitMap);
}
