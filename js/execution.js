/**
 * Begrenzt einen Einsatz auf die verfügbaren Einheiten.
 * @param {Object<string, number>} spec geplanter Einsatz
 * @param {Object<string, number>} pool verfügbare Einheiten
 * @returns {Object<string, number>}
 */
function limitToPool(spec, pool) {
    const out = {};
    for (const k in spec) {
        const n = Math.min(spec[k], pool[k] || 0);
        if (n > 0) out[k] = n;
    }
    return out;
}

/**
 * Bucht Verluste auf die Verlustsumme und aus dem Vorrat ab.
 * @param {Object<string, number>} lr Verlustsumme, wird verändert
 * @param {Object<string, number>} loss Verluste des Kampfes
 * @param {Object<string, number>|null} pl Vorrat, wird verändert
 */
function addLosses(lr, loss, pl) {
    for (const k in loss) {
        lr[k] = (lr[k] || 0) + loss[k];
        if (pl) pl[k] -= loss[k];
    }
}

/**
 * @typedef {Object} PlanRun Ablauf eines Durchlaufs durch den gesamten Plan
 * @property {boolean} ok Lager besiegt
 * @property {number} gx 1 = General gefallen
 * @property {number} waves gekämpfte Wellen
 * @property {number} rounds Kampfrunden insgesamt
 * @property {Object<string, number>} lr Verluste je Einheitenart
 */

/**
 * Spielt den Angriffsplan einmal gegen ein Lager durch.
 * @param {Camp} c
 * @param {Array<Object<string, number>>} plan Einsatz je Welle
 * @param {Modifiers} M
 * @param {Object<string, UnitTemplate>} T
 * @param {{t: UnitTemplate}} G
 * @param {Object<string, number>|null} pool begrenzter Vorrat oder null
 * @returns {PlanRun}
 */
function playPlan(c, plan, M, T, G, pool) {
    let E = freshE(c, M);
    const pl = pool ? { ...pool } : null;
    const run = { ok: false, gx: 0, waves: 0, rounds: 0, lr: {} };
    for (const planned of plan) {
        const spec = pl ? limitToPool(planned, pl) : planned;
        if (!sum(spec)) break;
        const o = sim(build(spec, T, G), E, M);
        run.waves++;
        run.rounds += o.r;
        if (o.gd) run.gx = 1;
        addLosses(run.lr, o.loss, pl);
        E = o.E;
        if (o.win) {
            run.ok = true;
            break;
        }
    }
    return run;
}

/**
 * Trägt die Verluste eines Durchlaufs ein.
 * @param {Object<string, number[]>} per Verluste je Einheitenart und Durchlauf, wird verändert
 * @param {Object<string, number>} lr Verluste des Durchlaufs
 * @returns {number} 1, wenn eine geschützte Einheit gefallen ist, sonst 0
 */
function recordLosses(per, lr) {
    let violated = 0;
    for (const k in per) {
        per[k].push(lr[k] || 0);
        if (lock[k] && lr[k]) violated = 1;
    }
    return violated;
}

/**
 * Durchschnittliche, minimale und maximale Verluste je Einheitenart.
 * @param {Object<string, number[]>} per
 * @param {number} N Anzahl der Durchläufe
 * @param {number} rec Rückgewinn in %
 * @returns {{L: Object<string, number>, mm: Object<string, [number, number]>}}
 */
function lossStats(per, N, rec) {
    const keep = 1 - rec / 100;
    const L = {};
    const mm = {};
    for (const k in per) {
        const a = per[k];
        L[k] = (a.reduce((x, y) => x + y, 0) / N) * keep;
        mm[k] = [
            Math.round(Math.min(...a) * keep),
            Math.round(Math.max(...a) * keep),
        ];
    }
    return { L, mm };
}

/**
 * Führt einen Angriffsplan N-mal aus und wertet ihn statistisch aus.
 * @param {Camp} c
 * @param {Array<Object<string, number>>} plan Einsatz je Welle
 * @param {number} N Anzahl der Durchläufe
 * @param {Modifiers} M
 * @param {Object<string, UnitTemplate>} T
 * @param {{t: UnitTemplate}} G
 * @param {Object<string, number>|null} pool begrenzter Vorrat oder null
 * @returns {CampResult}
 */
function execPlan(c, plan, N, M, T, G, pool) {
    const per = {};
    plan.forEach((s) => Object.keys(s).forEach((k) => (per[k] = [])));
    let wins = 0;
    let rounds = 0;
    let waves = 0;
    let viol = 0;
    let gd = 0;
    for (let i = 0; i < N; i++) {
        const run = playPlan(c, plan, M, T, G, pool);
        if (run.ok) wins++;
        gd += run.gx;
        rounds += run.rounds;
        waves += run.waves;
        viol += recordLosses(per, run.lr);
    }
    const { L, mm } = lossStats(per, N, M.rec);
    return {
        p: (wins / N) * 100,
        r: rounds / Math.max(1, waves),
        L,
        mm,
        viol: (viol / N) * 100,
        gd: (gd / N) * 100,
        w: waves / N,
    };
}
