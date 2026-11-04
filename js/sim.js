// Kampf
function mods(st) {
    st = st || curState();
    const t = st.t,
        s = st.sk,
        g = (k) => t[k] || 0;
    return {
        dmg: g("dmg"),
        off: g("off"),
        swift: g("swift"),
        heavy: g("heavy"),
        hp: g("hp"),
        edm: g("edm"),
        eacc: (t.eacc ?? 100) / 100,
        boss: Math.max(-75, g("boss") - svK(s, "boss")),
        rec: Math.min(100, g("rec") + svK(s, "rec")),
        all: !!t.sp,
        acc: svK(s, "acc"),
        bf: svK(s, "bf"),
        lt: lvK(s, "lt") ? 1 : 0,
        fS: svK(s, "swift"),
        pS: spK(s, "swift"),
        fH: svK(s, "heavy"),
        fE: svK(s, "cleave"),
        pE: spK(s, "cleave"),
        sMn: svK(s, "sniper"),
        sMx: [0, 5, 10, 15][lvK(s, "sniper")],
        fR: svK(s, "rapid"),
        fJ: svK(s, "jugg"),
        pJ: spK(s, "jugg"),
        ab: ABIL[st.u] || {},
    };
}
const rnd = Math.random;
function tpl(id, side, M) {
    const s = U[id];
    if (!s) return null;
    let bfu = M.bf,
        hp = s.h,
        mn = s.mn,
        mx = s.mx,
        a = s.a,
        k = s.k || [],
        pc = k.includes("UnitSkillSplashDamage") ? 1 : 0,
        fl = k.includes("UnitSkillAttackWeakestTarget"),
        ph =
            k.includes("UnitSkillFirstStrike") || s.o == 1
                ? 0
                : k.includes("UnitSkillLastStrike")
                  ? 2
                  : 1;
    if (side == 0) {
        let f = 1 + M.dmg / 100;
        if (OF.includes(id)) f *= 1 + M.off / 100;
        if (SW.includes(id)) f *= 1 + M.swift / 100;
        if (HV.includes(id)) f *= 1 + M.heavy / 100;
        mn *= f;
        mx *= f;
        for (const r of M.ab.units || [])
            if (r.ids.includes(id)) {
                const g = 1 + (r.dmg || 0) / 100;
                mn *= g;
                mx *= g;
                if (r.hp) hp *= 1 + r.hp / 100;
                if (r.splash) pc = 1;
                if (r.flat) {
                    mn += r.flat;
                    mx += r.flat;
                }
                if (r.acc) a = Math.min(100, a + r.acc);
                if (r.flank) fl = true;
                if (r.rounds) bfu = Math.max(bfu, r.rounds);
            }
        if (SW.includes(id) && M.fS) {
            mn += M.fS;
            mx += M.fS;
            pc = Math.max(pc, M.pS);
        }
        if (HV.includes(id)) {
            mn += M.fH;
            mx += M.fH;
        }
        if (id == "EliteSoldier" && M.fE) {
            mn += M.fE;
            mx += M.fE;
            pc = Math.max(pc, M.pE);
        }
        if (id == "Bowman") mx += M.fR;
        if (id == "Longbowman" || id == "Marksman") {
            mn *= 1 + M.sMn / 100;
            mx *= 1 + M.sMx / 100;
        }
        hp *= 1 + M.hp / 100;
        a = Math.min(100, a + M.acc);
        if (M.all) pc = 1;
    } else {
        let f = 1 + M.edm / 100;
        for (const r of M.ab.enemyDmg || [])
            if (CATM[r.cat](id)) f *= 1 + r.v / 100;
        if (M.ab.noFlank) fl = false;
        for (const r of M.ab.enemyHp || [])
            if (CATM[r.cat](id)) hp *= 1 + r.v / 100;
        mn *= f;
        mx *= f;
        a = Math.min(100, a * M.eacc);
        if (/Boss/.test(id)) hp *= 1 + M.boss / 100;
    }
    return { id, side, h: hp, mn, mx, a, pc, fl, ph, bf: bfu };
}
function genT(M, st) {
    st = st || curState();
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
const mkU = (t, n) =>
    Array.from({ length: n }, () => ({ t, id: t.id, hp: t.h }));
function sim(A, E, M) {
    let r = 0;
    const GG = A.find((u) => u.g);
    while (r < 150 && A.some((u) => u.hp > 0) && E.some((u) => u.hp > 0)) {
        r++;
        for (let p = 0; p < 3; p++) {
            const all = [...A, ...E].filter((u) => u.hp > 0 && u.t.ph == p);
            if (p == 2 && M.lt && GG && GG.hp > 0) all.push(GG);
            const LA = A.filter((u) => u.hp > 0),
                LE = E.filter((u) => u.hp > 0),
                ptr = [0, 0];
            for (const u of all) {
                const t = u.t,
                    L = t.side ? LA : LE,
                    s = t.side ? 0 : 1;
                let f = ptr[s];
                while (f < L.length && L[f].hp <= 0) f++;
                ptr[s] = f;
                if (f >= L.length) continue;
                let d = rnd() * 100 < t.a ? t.mx : t.mn;
                if (!t.side) d *= 1 + ((t.bf || 0) / 100) * (r - 1);
                const spl = t.pc >= 1 || (t.pc > 0 && rnd() < t.pc);
                let i = f;
                while (d > 0) {
                    let x = null;
                    if (t.fl) {
                        for (let q = f; q < L.length; q++) {
                            const y = L[q];
                            if (y.hp > 0 && !y.g && (!x || y.t.h < x.t.h))
                                x = y;
                        }
                        if (!x && L[i] && L[i].hp > 0) x = L[i];
                    } else {
                        while (i < L.length && L[i].hp <= 0) i++;
                        x = i < L.length ? L[i] : null;
                    }
                    if (!x) break;
                    x.hp -= d;
                    if (x.hp > 0 || !spl) break;
                    d = -x.hp;
                }
            }
        }
    }
    const loss = {};
    A.forEach((u) => {
        if (u.hp <= 0 && !u.g) loss[u.id] = (loss[u.id] || 0) + 1;
    });
    return {
        win: !E.some((u) => u.hp > 0),
        r,
        loss,
        gd: !!(GG && GG.hp <= 0),
        E: E.filter((u) => u.hp > 0).map((u) => ({
            t: u.t,
            id: u.id,
            hp: u.t.h,
        })),
    };
}
const freshE = (c, M) => {
    const E = [];
    for (const id in c.j) {
        const t = tpl(id, 1, M);
        if (t) E.push(...mkU(t, c.j[id]));
    }
    return E;
};
const clone = (E) => E.map((u) => ({ t: u.t, id: u.id, hp: u.hp }));
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
const ORD = [
        "Recruit",
        "Militia",
        "Soldier",
        "EliteSoldier",
        "Swordsman",
        "Cavalry",
        "MountedSwordsman",
        "Knight",
        "Bowman",
        "Longbowman",
        "Crossbowman",
        "Marksman",
        "ArmoredMarksman",
        "MountedMarksman",
        "Cannoneer",
        "Besieger",
    ],
    oi = (id) => {
        const i = ORD.indexOf(id);
        return i < 0 ? 99 : i;
    };
const build = (spec, T, G) => {
    const A = [];
    for (const id of Object.keys(spec).sort((a, b) => oi(a) - oi(b)))
        A.push(...mkU(T[id], spec[id]));
    A.push({ t: G.t, id: G.t.id, hp: G.t.h, g: 1 });
    return A;
};
function execPlan(c, plan, N, M, T, G, pool) {
    let w = 0,
        R = 0,
        W = 0,
        viol = 0,
        gd = 0;
    const L = {},
        mm = {},
        per = {},
        us = new Set();
    plan.forEach((s) =>
        Object.keys(s).forEach((k) => {
            us.add(k);
            per[k] = [];
        }),
    );
    for (let i = 0; i < N; i++) {
        let E = freshE(c, M),
            pl = pool ? { ...pool } : null,
            ok = false,
            gx = 0;
        const lr = {};
        for (const sp0 of plan) {
            let spec = sp0;
            if (pl) {
                spec = {};
                for (const k in sp0) {
                    const n = Math.min(sp0[k], pl[k] || 0);
                    if (n > 0) spec[k] = n;
                }
            }
            if (!sum(spec)) break;
            const o = sim(build(spec, T, G), E, M);
            W++;
            R += o.r;
            if (o.gd) gx = 1;
            for (const k in o.loss) {
                lr[k] = (lr[k] || 0) + o.loss[k];
                if (pl) pl[k] -= o.loss[k];
            }
            E = o.E;
            if (o.win) {
                ok = true;
                break;
            }
        }
        if (ok) w++;
        gd += gx;
        let v = 0;
        us.forEach((k) => {
            per[k].push(lr[k] || 0);
            if (lock[k] && lr[k]) v = 1;
        });
        viol += v;
    }
    const keep = 1 - M.rec / 100;
    us.forEach((k) => {
        const a = per[k];
        L[k] = (a.reduce((x, y) => x + y, 0) / N) * keep;
        mm[k] = [
            Math.round(Math.min(...a) * keep),
            Math.round(Math.max(...a) * keep),
        ];
    });
    return {
        p: (w / N) * 100,
        r: R / Math.max(1, W),
        L,
        mm,
        viol: (viol / N) * 100,
        gd: (gd / N) * 100,
        w: W / N,
    };
}
// Einheitensuche
function cands(rem, cap, full) {
    const K = Object.keys(rem),
        out = [];
    const add = (m) => {
        const r = {};
        let t = 0;
        for (const k in m) {
            const n = Math.min(Math.floor(m[k]), rem[k]);
            if (n > 0) {
                r[k] = n;
                t += n;
            }
        }
        if (full && t < cap) {
            for (const k of [...K].sort((a, b) => rem[b] - rem[a])) {
                const n = Math.min(rem[k] - (r[k] || 0), cap - t);
                if (n > 0) {
                    r[k] = (r[k] || 0) + n;
                    t += n;
                }
            }
        }
        if (t && t <= cap) out.push(r);
    };
    for (const k of K)
        for (const f of full ? [1] : [1, 0.5, 0.25])
            add({ [k]: Math.min(rem[k], cap) * f });
    if (!full) for (const k of K) [1, 2, 3].forEach((n) => add({ [k]: n }));
    const top = [...K]
        .sort((a, b) => U[b].mx * U[b].a - U[a].mx * U[a].a)
        .slice(0, 6);
    for (const a of top)
        for (const b of top)
            if (a < b)
                for (const r of [0.7, 0.5, 0.3])
                    add({ [a]: cap * r, [b]: cap * (1 - r) });
    for (let i = 0; i < 14 && K.length > 1; i++) {
        const ks = [...K]
                .sort(() => rnd() - 0.5)
                .slice(0, 2 + ((rnd() * 3) | 0)),
            w = ks.map(() => 0.2 + rnd()),
            s = w.reduce((a, b) => a + b),
            f = full ? 1 : 0.3 + rnd() * 0.7,
            m = {};
        ks.forEach((k, j) => (m[k] = (cap * f * w[j]) / s));
        add(m);
    }
    return out;
}
function evalW(cd, E, T, M, G) {
    const e = clone(E),
        h0 = e.reduce((a, u) => a + u.hp, 0) || 1,
        o = sim(build(cd, T, G), e, M),
        left = o.E.reduce((a, u) => a + u.hp, 0) / h0;
    let lh = 0,
        q = 0;
    for (const k in o.loss) {
        lh += (o.loss[k] * (U[k].b || 300)) / 3600;
        if (lock[k]) q += o.loss[k];
    }
    return {
        o,
        s:
            (o.win ? 2000 - 2 * lh : 500 * (1 - left) - 0.4 * lh) -
            (q ? 600 + 5 * q : 0),
    };
}
async function search(c, pool, M, T, G, cap, full) {
    let E = freshE(c, M),
        plan = [],
        rem = { ...pool };
    for (let w = 0; w < 6; w++) {
        const cs = cands(rem, cap, full);
        if (!cs.length) break;
        let sc = cs
            .map((cd) => {
                let s = 0;
                for (let k = 0; k < 3; k++) s += evalW(cd, E, T, M, G).s;
                return [s / 3, cd];
            })
            .sort((a, b) => b[0] - a[0]);
        sc = sc
            .slice(0, 2)
            .map(([s, cd]) => {
                let t = s * 3;
                for (let k = 0; k < 8; k++) t += evalW(cd, E, T, M, G).s;
                return [t / 11, cd];
            })
            .sort((a, b) => b[0] - a[0]);
        const best = sc[0][1];
        plan.push(best);
        const r = evalW(best, E, T, M, G);
        for (const k in r.o.loss) rem[k] -= r.o.loss[k];
        E = r.o.E;
        if (r.o.win || !sum(rem) || !E.length) break;
        await new Promise((r) => setTimeout(r, 0));
    }
    return plan;
}
function clipTo(m, cp) {
    const t = sum(m);
    if (t <= cp) return m;
    const o = {};
    for (const k in m) {
        const n = Math.floor((m[k] * cp) / t);
        if (n > 0) o[k] = n;
    }
    return o;
}
const lossCost = (r) => {
    let x = 0;
    for (const k in r.L) x += (r.L[k] * (U[k].b || 300)) / 3600;
    return x + (r.gd / 100) * 2 + (r.viol / 100) * 50;
};
const better = (a, b) => {
    const A = a.p >= 90,
        B = b.p >= 90;
    if (A != B) return A;
    if (A) return a.cost < b.cost;
    return a.p > b.p || (a.p == b.p && a.cost < b.cost);
};
