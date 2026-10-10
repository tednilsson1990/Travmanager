/**
 * PROV — UI-VAKTEN (v145, kap 26 A-e: morgonens lektion)
 *
 * Två livekrascher nådde Teds skärm för att ingen vakt RENDERAR
 * komponenterna: verifieraren fångar importfel, sviterna motorn —
 * men en TDZ eller en tappad parameter syns först när kroppen körs.
 * Här körs den: hook-fria komponenter anropas direkt med
 * representativa props (kroppen och html-uttrycken evalueras),
 * hook-vyer renderas till sträng i sitt startläge.
 *
 * Kräver preact/htm i föräldrakatalogens node_modules (installeras
 * av byggkedjan, följer aldrig med i paketet).
 */
import { render } from "preact-render-to-string";
import { h } from "preact";
import { sättRng, seedad } from "./engine-util.js";
import { byggVärld } from "./engine-varld.js";
import { prologhästar } from "./engine-prolog.js";
import { KUSKAR } from "./data-kuskar.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };
const provaRender = async (namn, fn) => {
  try { const ut = await fn(); ok(typeof ut === "string" && ut.length > 40, `${namn} renderar (${ut.length} tecken)`); }
  catch (e) { fel++; console.log(`  ✗ ${namn} KRASCHAR: ${e.message}`); }
};

console.log("PROV: UI-vakten\n");

sättRng(seedad(12));
const stall = prologhästar();
const spel = {
  säsong: 2, vecka: 5, veckor: 18, stallnamn: "Vaktgården", hemmabana: "nordstad",
  kassa: 120000, renommé: 30, spelförtroende: 40, stall, värld: byggVärld(8),
  startadeLopp: [], anmälningar: [], press: [{ rubrik: "R", byline: "B", ton: "neutral" }],
  logg: [], krönika: [], troférum: [], historik: [], hallOfFame: [],
  förstaman: { namn: "Ulla Vakt", profil: "taktiker", säsonger: 2 },
  prolog: { aktiv: false, klar: true, mentor: { namn: "Gunnar", motto: "Hästen först.", borta: false } },
  sponsorer: [], sponsorerbjudanden: [], kuskrelation: {}, ägarrelationer: {},
  rivaliteter: {}, inkorgLästa: [], inkorgBeslutade: [], telefonlogg: [],
  huvudnyhet: null, båge: null, loppfacit: {}, avelsston: [], scener: [],
  föl: [], anläggning: { boxar: 8 }, gård: { tomter: 2, markköp: 0 },
  seriepoäng: {}, seriemästare: [], rykten: [], skötare: { namn: "Bo", roll: "Hästskötare" },
  karriär: { starter: 20, segrar: 3, prispengar: 200000, storloppssegrar: 0 },
  stopp: "måndag", uppstartKlar: true,
};
/* v146–v147: stambok, legendar och raritet in i fixturen — journalens
   stamboksflik och märkena i stall/startlista ska renderas skarpt. */
stall[0].raritet = "stjärna";
stall[0].mor = "Vaktmodern"; stall[0].far = "Vaktfadern";
spel.stambok = [];
/* v155: stamboksfliken ska rendera en RIKTIG familj, inte tomläget. */
const { säkraStambok } = await import("./engine-stambok.js");
säkraStambok(spel);
spel.legendar = { id: -1, namn: "Fenomenet", föddSäsong: 1, status: "aktiv", segrarSnapshot: 3, möten: 0, slagen: false };
sättRng();

/* ---------- Hook-fria komponenter: kroppen körs direkt ---------- */
{
  const { default: _ } = await import("./ui-loppvy.js").catch((e) => { fel++; console.log("  ✗ ui-loppvy laddar inte: " + e.message); return {}; });
}
const loppvyMod = await import("./ui-loppvy.js");
const grafik = await import("./ui-grafik.js");

await provaRender("Gårdskartan", () =>
  render(h(grafik.Gårdskarta, { spel, påMark: () => {}, påBygg: () => {} })));

/* ---------- Hook-vyer: renderas i startläget ---------- */
const vyer = [
  ["InkorgVy (hemskärmen)", "./ui-inkorgvy.js", { spel, uppdatera: () => {}, gåTill: () => {} }],
  ["StallVy", "./ui-stallvy.js", { spel, uppdatera: () => {}, nystart: () => {}, efterVecka: () => {} }],
  ["GårdVy", "./ui-gardvy.js", { spel, uppdatera: () => {} }],
  ["SfärVy", "./ui-sfarvy.js", { spel }],
  ["StatistikVy", "./ui-statistikvy.js", { spel }],
  ["KontorVy", "./ui-kontorvy.js", { spel, uppdatera: () => {} }],
  ["JournalVy", "./ui-journalvy.js", { spel }],
  ["LoppVy (måndagen)", "./ui-loppvy.js", { spel, uppdatera: () => {} }],
];
for (const [namn, väg, props] of vyer) {
  await provaRender(namn, async () => {
    const mod = await import(väg);
    return render(h(mod.default, props));
  });
}


/* ---------- DJUPLÄGENA (v155, block A-resten): varje flik och app.
   Läxan från TDZ-kraschen (v121→v142): ett läge som aldrig renderas i
   prov är ett läge som kan vara trasigt i elva versioner. Vyerna tar
   startläges-props (bara vakten använder dem) så varje flik körs. ---- */
{
  const journal = (await import("./ui-journalvy.js")).default;
  for (const flik of ["krönika", "album", "stambok", "säsonger", "rekord", "troférum", "rivaler"]) {
    await provaRender(`JournalVy › ${flik}`, () => render(h(journal, { spel, startflik: flik })));
  }
  const inkorg = (await import("./ui-inkorgvy.js")).default;
  for (const app of ["meddelanden", "samtal", "mejl", "nyheter"]) {
    await provaRender(`Telefonen › ${app}`, () =>
      render(h(inkorg, { spel, uppdatera: () => {}, gåTill: () => {}, startApp: app })));
  }
  const stall = (await import("./ui-stallvy.js")).default;
  for (const flik of ["översikt", "karriär", "form", "mål", "relationer"]) {
    await provaRender(`HästSidan › ${flik}`, () =>
      render(h(stall, { spel, uppdatera: () => {}, nystart: () => {}, efterVecka: () => {},
        startHästId: spel.stall[0].id, startHästflik: flik })));
  }
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
