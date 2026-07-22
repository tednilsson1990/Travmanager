import { rnd, int, klamp } from "./engine-util.js";
import { nyttNamn } from "./data-namn.js";

let nästaId = 1;
export const sättIdRäknare = (n) => { nästaId = n; };
export const idRäknare = () => nästaId;

/**
 * Distansprofil. Varje häst har en distans där den kommer bäst till sin rätt
 * och en tolerans för hur långt därifrån den klarar sig.
 *
 * En uthållig häst är inte automatiskt långsam på sprinterdistans — men den
 * behöver högt tempo för att få effekt av sin styrka. En snabb häst som
 * tvingas gå för långt tappar i stället i tanken.
 */
export const DISTANSTYPER = [
  { namn: "sprinter", optimal: 1640, vikt: 0.3 },
  { namn: "medeldistans", optimal: 2140, vikt: 0.45 },
  { namn: "stayer", optimal: 2640, vikt: 0.25 },
];

function slumpaDistansprofil() {
  const r = Math.random();
  let ack = 0;
  for (const t of DISTANSTYPER) {
    ack += t.vikt;
    if (r <= ack) {
      return {
        optimal: t.optimal + Math.round(rnd(-120, 120)),
        tolerans: Math.round(rnd(340, 720)),
        typ: t.namn,
      };
    }
  }
  return { optimal: 2140, tolerans: 500, typ: "medeldistans" };
}

/**
 * Hur väl loppets distans passar hästen. 1 = perfekt, 0 = helt fel.
 * Används både i simuleringen och för att visa spelaren om ett lopp passar.
 */
export function distanspassning(häst, distans) {
  if (!häst.distans) return 1;
  const avvikelse = Math.abs(distans - häst.distans.optimal) / häst.distans.tolerans;
  return klamp(1 - avvikelse, 0, 1);
}

/**
 * En häst. Fyra sanna grundegenskaper — start, fart, styrka, lynne —
 * som spelaren ser men publiken inte gör.
 */
export function nyHäst(o = {}) {
  return {
    id: nästaId++,
    namn: o.namn ?? nyttNamn(),
    ålder: o.ålder ?? int(3, 8),
    kön: o.kön ?? (Math.random() < 0.5 ? "sto" : "hingst"),
    start: o.start ?? Math.round(rnd(35, 75)),
    fart: o.fart ?? Math.round(rnd(38, 74)),
    styrka: o.styrka ?? Math.round(rnd(38, 74)),
    lynne: o.lynne ?? Math.round(rnd(30, 85)),
    distans: o.distans ?? slumpaDistansprofil(),
    form: o.form ?? 50,
    energi: o.energi ?? 85,
    skada: 0,
    hype: o.hype ?? 12,
    starter: 0, segrar: 0, pallplatser: 0, intjänat: 0,
    träning: "lugnt",
    egen: true,
    ägare: o.ägare ?? null,
    krav: o.krav ?? null,
    kravStarter: 0,
  };
}

/** Motståndare genereras kring loppets nivå och får en publik merit. */
export function motståndare(nivå, antal) {
  const ut = [];
  for (let i = 0; i < antal; i++) {
    const h = nyHäst({
      start: klamp(Math.round(rnd(nivå - 14, nivå + 16))),
      fart: klamp(Math.round(rnd(nivå - 12, nivå + 16))),
      styrka: klamp(Math.round(rnd(nivå - 12, nivå + 16))),
      lynne: int(30, 88),
    });
    h.egen = false;
    h.energi = 90;
    // Publikens signaler ska KORRELERA med sann kapacitet, annars blir
    // marknaden brus och favoriter vinner inte oftare än slumpen.
    const kapacitet = (h.start + h.fart + h.styrka) / 3;
    h.form = klamp(Math.round(kapacitet * 0.6 + rnd(5, 35)));
    h.starter = int(4, 40);
    const segerandel = klamp((kapacitet - 30) / 100, 0.02, 0.45) * rnd(0.6, 1.3);
    h.segrar = Math.min(h.starter, Math.round(h.starter * segerandel));
    h.hype = klamp(Math.round(kapacitet * 0.45 + rnd(-10, 20)));
    ut.push(h);
  }
  return ut;
}

export const TRÄNING = {
  vila: { namn: "Vila", energi: +22, form: -3, start: 0, risk: 0 },
  lugnt: { namn: "Lugnt jobb", energi: +6, form: +3, start: 0, risk: 0.02 },
  start: { namn: "Startjobb", energi: -8, form: +4, start: +1.6, risk: 0.07 },
  intervall: { namn: "Intervaller", energi: -12, form: +9, start: 0, risk: 0.09 },
  kvalitet: { namn: "Snabbjobb", energi: -18, form: +13, start: +0.5, risk: 0.15 },
};
