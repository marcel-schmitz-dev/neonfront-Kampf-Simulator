/**
 * Schließt einen Dialog bei Klick auf den Hintergrund.
 * @param {HTMLDialogElement} dlg
 */
function closeOnBackdrop(dlg) {
    dlg.addEventListener("click", (e) => {
        if (e.target === dlg) dlg.close();
    });
}

/**
 * Öffnet den Rechtstext-Dialog auf dem gewünschten Reiter.
 * @param {string} id Reiter: "impressum", "privacy" und weitere aus data-legal
 */
function openLegal(id) {
    const dlg = $("legal");
    dlg.querySelectorAll(".lg").forEach(
        (s) => (s.hidden = s.id !== "lg-" + id),
    );
    dlg.querySelectorAll(".tabs button").forEach((b) =>
        b.classList.toggle("on", b.dataset.legal === id),
    );
    if (!dlg.open) dlg.showModal();
    dlg.scrollTop = 0;
}

/** Verdrahtet den Skill-Dialog. */
function initSkillDialog() {
    const dlg = $("skdlg");
    $("skbtn").onclick = () => dlg.showModal();
    $("skx").onclick = () => dlg.close();
    closeOnBackdrop(dlg);
}

/** Verdrahtet den Rechtstext-Dialog (Impressum, Datenschutz, Haftungsausschluss). */
function initLegalDialog() {
    const dlg = $("legal");
    document
        .querySelectorAll("[data-legal]")
        .forEach((b) => (b.onclick = () => openLegal(b.dataset.legal)));
    $("lgx").onclick = () => dlg.close();
    closeOnBackdrop(dlg);
}
