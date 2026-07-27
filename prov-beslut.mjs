/**
 * PROV — SLUTORDERN (v84, omgjord v86: ordern ges i kusksamtalet FÖRE
 * loppet, inte i en paus — men motorlöftena är exakt desamma)
 *
 * Slutordern bygger på tre löften, och alla tre prövas här:
 *
 * 1. DETERMINISM. Samma seed utan ingripande ger exakt samma lopp,
 *    bildruta för bildruta. Utan det kan omsimuleringen inte lova något.
 * 2. IDENTISKT PREFIX. Med ingripande vid 500 kvar är varje bildruta
 *    FÖRE beslutspunkten identisk med loppet utan ingripande. Det är
 *    motorgarantin för att slutordern inte smittar loppets första del.
 * 3. VERKLIG EFFEKT. Ordern ändrar utfall i en rimlig andel av loppen —
 *    annars är valet teater. Men den får inte vara en vinstknapp:
 *    attack ska både kunna lyfta och sänka.
 *
 * Dessutom: simulera() får inte mutera fältets hästar (annars går
 * loppet inte att köra om), och utan ingripande är motorn orörd —
 * det senare bevisas separat av att kalibrering.mjs är identisk.
 */
import { sättRng, seedad } from "./engine-util.js";
import { veckansLopp } from "./data-kalender.js";
import { byggVärld, byggFält, rustaFält } from "./engine-varld.js";
import { beräknaStreck } from "./engine-streck.js";
import { simulera } from "./engine-simulera.js";
import { nyHäst } from "./engine-hast.js";
import { KUSKAR } from "./data-kuskar.js";

let fel = 0;
const ok = (villkor, text) => {
  if (villkor) console.log("  ✓ " + text);
  else { console.log("  ✗ " + text); fel++; }
};

/** Ett lopp med spelarhäst, byggt exakt som loppvyn bygger det. */
function byggKörning(frö) {
  sättRng(seedad(frö));
  const värld = byggVärld();
  const lopp = veckansLopp(1 + (frö % 18))[frö % 3] || veckansLopp(1)[0];
  const egen = nyHäst({ ålder: 5 });
  egen.egen = true;
  egen.form = 58; egen.energi = 80; egen.hype = 30; egen.streck = 12;
  egen.taktik = "rygg";
  const fält = byggFält(värld, lopp, 1, new Set(), egen);
  rustaFält(fält, lopp, KUSKAR[0], "rygg");
  beräknaStreck(fält, { spelförtroende: 40, stallform: 50, marknadsbild: 0 }, lopp);
  return { fält, lopp };
}

const bildJson = (sim) => JSON.stringify(sim.bild.map((b) => ({
  m: b.meter, p: b.pos.map((x) => [x.namn, Math.round(x.d * 100), x.lane]),
})));

console.log("PROV: beslutsfönstret\n");

/* ---------- 1. Determinism ---------- */
{
  const a = byggKörning(4711);
  sättRng(seedad(999)); const sim1 = simulera(a.fält, a.lopp);
  sättRng(seedad(999)); const sim2 = simulera(a.fält, a.lopp);
  ok(bildJson(sim1) === bildJson(sim2), "samma seed utan ingripande ger identiskt lopp");

  /* Muterar simulera fältet? Då vore ovan omöjligt — men pröva uttryckligen
     de fält som spelet läser efteråt. */
  const före = JSON.stringify(a.fält.map((h) => [h.namn, h.form, h.energi, h.streck, h.taktik, h.spår]));
  sättRng(seedad(31)); simulera(a.fält, a.lopp);
  const efter = JSON.stringify(a.fält.map((h) => [h.namn, h.form, h.energi, h.streck, h.taktik, h.spår]));
  ok(före === efter, "simulera muterar inte fältets hästar");
}

/* ---------- 2. Identiskt prefix före beslutspunkten ---------- */
{
  let prövade = 0, identiska = 0;
  for (const frö of [11, 29, 47, 83, 101, 137]) {
    const a = byggKörning(frö);
    sättRng(seedad(frö * 7)); const utan = simulera(a.fält, a.lopp);
    sättRng(seedad(frö * 7)); const med = simulera(a.fält, a.lopp, { vid: 500, order: "attack" });
    /* Prefixet: alla bildrutor där mer än 500 m återstår. Rutan där
       gränsen passeras kan redan bära ordern, så den räknas inte. */
    const gräns = utan.bild.findIndex((b) => b.meter >= a.lopp.dist - 500);
    if (gräns < 2) continue;
    prövade++;
    const klipp = (sim) => bildJson({ bild: sim.bild.slice(0, gräns) });
    if (klipp(utan) === klipp(med)) identiska++;
  }
  ok(prövade >= 4 && identiska === prövade,
    `prefixet före 500 kvar är identiskt med och utan order (${identiska}/${prövade} lopp)`);
}

/* ---------- 3. Verklig effekt — men ingen vinstknapp ---------- */
{
  const N = 120;
  let ändradeAttack = 0, ändradeVänta = 0;
  let placUtan = 0, placAttack = 0, räknade = 0;
  for (let i = 0; i < N; i++) {
    const a = byggKörning(1000 + i);
    const plats = (sim) => {
      const r = sim.resultat.find((x) => x.häst.egen);
      return r && !r.ur ? r.plats : 16;
    };
    sättRng(seedad(i * 13 + 1)); const utan = simulera(a.fält, a.lopp);
    sättRng(seedad(i * 13 + 1)); const attack = simulera(a.fält, a.lopp, { vid: 500, order: "attack" });
    sättRng(seedad(i * 13 + 1)); const vänta = simulera(a.fält, a.lopp, { vid: 500, order: "vänta" });
    if (plats(utan) !== plats(attack)) ändradeAttack++;
    if (plats(utan) !== plats(vänta)) ändradeVänta++;
    räknade++; placUtan += plats(utan); placAttack += plats(attack);
  }
  ok(ändradeAttack >= N * 0.2,
    `attack ändrar utfallet i ${(100 * ändradeAttack / N).toFixed(0)} % av loppen (kräver ≥ 20)`);
  ok(ändradeVänta >= N * 0.1,
    `vänta ändrar utfallet i ${(100 * ändradeVänta / N).toFixed(0)} % av loppen (kräver ≥ 10)`);
  const skillnad = (placUtan - placAttack) / räknade;
  ok(Math.abs(skillnad) < 1.2,
    `attack är ingen vinstknapp: snittplacering ändras ${skillnad >= 0 ? "+" : ""}${skillnad.toFixed(2)} platser`);
}

/* ---------- 4. Tränaren rekommenderar — kusken beslutar ---------- */
{
  const N = 80;
  let punkter = 0, spår = 0, vägrade = 0, tommaSomAttackerade = 0;
  for (let i = 0; i < N; i++) {
    const a = byggKörning(5000 + i);
    sättRng(seedad(i * 17 + 5));
    const med = simulera(a.fält, a.lopp, { vid: 500, order: "attack" });
    const alltText = med.bild.flatMap((b) => b.text.map((t) => t.t)).join(" | ");
    const gick = alltText.includes("som det var sagt i stallbacken");
    const vägr = alltText.includes("litar på känslan och väntar");
    if (gick || vägr) spår++;
    if (vägr) vägrade++;
    /* Levde hästen vid punkten ska EXAKT ett av spåren finnas. */
    const gräns = med.bild.findIndex((b) => b.meter >= a.lopp.dist - 500);
    const levde = gräns >= 0 && med.bild[gräns].rader.some((r) => r.egen);
    if (levde) { punkter++; if (!(gick !== vägr)) tommaSomAttackerade++; }
  }
  ok(punkter > 0 && spår === punkter,
    `varje rekommendation vid punkten lämnar exakt ett spår i referatet (${spår}/${punkter})`);
  ok(vägrade > 0,
    `kusken vägrar ibland attackera en tom häst (${vägrade} av ${punkter} lopp) — tränaren rekommenderar, kusken beslutar`);
  ok(tommaSomAttackerade === 0, "aldrig både gå-på och vägran i samma lopp");
}

sättRng();
console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
