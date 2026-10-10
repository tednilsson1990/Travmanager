import { rnd, int, klamp, slump } from "./engine-util.js";
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
  const r = slump();
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
    kön: o.kön ?? (slump() < 0.5 ? "sto" : "hingst"),
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

/* ------------------------------------------------------------------ */
/* RARITETEN (v147, plan 21.5 — vit stjärna i pannan)                  */
/* ------------------------------------------------------------------ */
/*
 * Travets shiny: någon enstaka häst föds med en vit stjärna i pannan.
 * REN BERÄTTELSEKRYDDA — inga egenskaper, inga procent (realismvakten
 * 22.6: en teckning gör ingen häst snabbare). Pressen älskar henne,
 * stamboken minns henne, startlistan bär märket.
 *
 * Hash-avgjort, aldrig slump: avgörandet sker där hästar FÖDS —
 * fölkläckningen (1 på 64: en karriär föder en handfull föl, och
 * drömmen ska gå att uppleva) och världens nya årgångar (1 på 400:
 * nära planens "1 på ~500" — att MÖTA henne är en händelse).
 * Marknadens hästar är redan födda någonstans — de prövas inte
 * (antecknat till etapp B).
 */
function raritetshash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Ett hash-avgjort "en på N" — samma nyckel, samma svar. */
export const prövaRaritet = (nyckel, enPå) => raritetshash(nyckel) % enPå === 0;

/** Märkets berättelse, på ett ställe — vyerna läser härifrån. */
export const RARITETSTEXT = "Född med en vit stjärna i pannan — en på femhundra.";

/* ------------------------------------------------------------------ */
/* DOLDA ANLAG (v148, plan 21.4 — upptäcktsglädjen)                    */
/* ------------------------------------------------------------------ */
/*
 * AI-tränarna har sitt synfel — nu har spelaren sin motsvarighet:
 * hästens UTVECKLINGSTAK är dolt. Siffrorna du ser är hästen i dag
 * (tränaren känner sin häst), men hur långt den kan NÅ vet ingen
 * förrän den visat det. Anlaget är en dold multiplikator på
 * säsongsutvecklingen (0,65–1,35, snitt 1,0): en häst med enastående
 * anlag växer dubbelt så fort som en med begränsade.
 *
 * HÄRLEDNING, INTE LAGRING: anlaget hashas ur namn+id — ingen
 * migration, inga nya sparfält, världens och marknadens hästar bär
 * det automatiskt. Vetskapen är spelarens: okänd → anad (3 starter)
 * → känd (8 starter eller 7 års ålder — då har hästen visat sitt
 * tak), eller direkt via veterinärtestet. Exakt som i verkligheten:
 * man röntgar och testar unghästen, eller låter loppen tala.
 */

export const VETERINÄRTEST_PRIS = 6000;

/** Det dolda anlaget: 0,65–1,35, hash-avgjort ur namn + id. */
export function anlag(häst) {
  return 0.65 + (raritetshash(`anlag:${häst.namn}:${häst.id ?? ""}`) % 71) / 100;
}

/** Anlaget i ord — spelet talar aldrig i multiplikatorer. */
export function anlagsklass(häst) {
  const a = anlag(häst);
  if (a >= 1.22) return { ord: "enastående anlag", nivå: 5 };
  if (a >= 1.08) return { ord: "stora anlag", nivå: 4 };
  if (a >= 0.92) return { ord: "vanliga anlag", nivå: 3 };
  if (a >= 0.78) return { ord: "små anlag", nivå: 2 };
  return { ord: "begränsade anlag", nivå: 1 };
}

/** Vad VET spelaren? Starter och ålder avslöjar gratis — testet direkt. */
export function anlagsvetskap(häst) {
  if ((häst.anlagKänt ?? 0) >= 1 || (häst.starter ?? 0) >= 8 || (häst.ålder ?? 3) >= 7) return "känd";
  if ((häst.starter ?? 0) >= 3) return "anad";
  return "okänd";
}

/** Bedömningen hästsidan visar — precisionen följer vetskapen. */
export function anlagsbedömning(häst) {
  const vet = anlagsvetskap(häst);
  if (vet === "känd") return anlagsklass(häst).ord;
  if (vet === "anad") {
    return anlag(häst) >= 1.0
      ? "taket börjar synas — åt det fina hållet"
      : "taket börjar synas — knappast någon stjärna";
  }
  return "okända — starter eller ett veterinärtest visar taket";
}

/** Veterinärtestet: kostar, men svarar direkt. Returnerar besked/fel. */
export function veterinärtest(spel, häst) {
  if (anlagsvetskap(häst) === "känd") return { fel: "Anlagen är redan kända." };
  if (spel.kassa < VETERINÄRTEST_PRIS) return { fel: "Kassan räcker inte till testet." };
  spel.kassa -= VETERINÄRTEST_PRIS;
  häst.anlagKänt = 1;
  const klass = anlagsklass(häst);
  spel.logg?.push?.(`Veterinärtest på <b>${häst.namn}</b>: ${klass.ord}.`);
  return { klass };
}
