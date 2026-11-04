/** Verdrahtet alle Bedienelemente und zeigt den Startzustand. */
function init() {
    initSkills();
    initGenerals();
    initUnits();
    initMapSelect();
    initMapControls();
    initRunner();
    initSkillDialog();
    initLegalDialog();
    $("yr").textContent = new Date().getFullYear();
    genOpts();
    pickMap();
    pickGen();
}

init();
