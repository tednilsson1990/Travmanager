/**
 * PROV — UTRUSTNINGEN/BALANSEN (v138, 21.9)
 *
 * Opt-in-löftet: utan balans är loppet IDENTISKT ner till sista
 * sekunden, och hästens värden rörs aldrig. Barfota ska mätbart
 * sänka kilometertiden men höja galopprisken över en population.
 * Vinterförbudet spärrar med orsak, och attributen återställs
 * garanterat efter varje lopp.
 */
import { sättRng, seedad } from "./engine-util.js";
import { simulera } from "./engine-simulera.js";
import { sättBalans, släppBalans, vinterbana, UTRUSTNING, tusseffekt, veckovård, hovläge, utrustningssvar, utrustningKänd, svarstext } from "./engine-utrustning.js";
import { nyHäst } from "./engine-hast.js";
import { KUSKAR } from "./data-kuskar.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: utrustningen\n");

const lopp = { dist: 2140, start: "auto", startande: 10, banaNamn: "P",
  pris: [30000,15000,7500,4000,2500,1500,1000,800], garanterad: 500, nivå: 50, id: "p" };
const byggFält = (seed) => {
  sättRng(seedad(seed));
  const fält = Array.from({ length: 10 }, (_, i) => {
    const h = nyHäst({ ålder: 5 }); h.spår = i + 1; h.kusk = KUSKAR[i];
    h.taktik = i === 0 ? "ledning" : "rygg"; h.streck = 10; return h;
  });
  return fält;
};

/* ---------- Opt-in-löftet ---------- */
{
  const a = byggFält(3); sättRng(seedad(100)); const simA = simulera(a, lopp);
  const b = byggFält(3); sättRng(seedad(100)); const simB = simulera(b, lopp);
  sättRng();
  ok(JSON.stringify(simA.resultat.map((r) => [r.häst.namn, r.plats, r.sek]))
    === JSON.stringify(simB.resultat.map((r) => [r.häst.namn, r.plats, r.sek])),
    "utan balans: samma frö ger identiskt lopp — regressionen omöjlig");
}

/* ---------- Effekten, mätt över population ---------- */
{
  let medSnitt = 0, utanSnitt = 0, medGalopp = 0, utanGalopp = 0, n = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const utan = byggFält(seed);
    sättRng(seedad(500 + seed)); const sU = simulera(utan, lopp);
    const med = byggFält(seed);
    med[0].balansVal = { barfota: true };
    sättBalans(med[0], { vecka: 8, veckor: 18 });
    sättRng(seedad(500 + seed)); const sM = simulera(med, lopp);
    const rU = sU.resultat.find((r) => r.häst.namn === utan[0].namn);
    const rM = sM.resultat.find((r) => r.häst.namn === med[0].namn);
    if (rU?.km && rM?.km) { utanSnitt += rU.km; medSnitt += rM.km; n++; }
    if (rU?.ur) utanGalopp++;
    if (rM?.ur) medGalopp++;
    ok2: if (seed === 1) {
      if (med[0].fart !== utan[0].fart) { fel++; console.log("  ✗ attributen återställdes inte"); break ok2; }
      console.log("  ✓ attributen återställs efter loppet — fart orörd efteråt");
    }
  }
  sättRng();
  const diff = (utanSnitt - medSnitt) / n;
  ok(diff > 0.15 && diff < 1.6,
    `barfota sänker kilometertiden med ${diff.toFixed(2)} s över ${n} lopp — kännbart, inte magiskt`);
  ok(medGalopp >= utanGalopp,
    `känsligheten syns: ${medGalopp} galopper barfota mot ${utanGalopp} med skor (60 lopp)`);
}

/* ---------- Vinterförbudet ---------- */
{
  const h = { balansVal: { barfota: true, huvudlappar: true } };
  const läge = sättBalans(h, { vecka: 2, veckor: 18 });
  ok(vinterbana({ vecka: 2, veckor: 18 }) && läge.spärrar.length === 1
    && h.balans.delar.includes("Norskt huvudlag") && !h.balans.delar.includes("Barfota runt om"),
    "vinterbana: barfota spärras med orsak — norska huvudlaget går på");
  släppBalans(h);
  ok(h.balans === null, "efter loppet: balansen släppt");
}


/* ---------------- Hovarna, tussarna och planen (v168) ---------------- */
{
  /* Hovkapitalet: barfota sliter, veckorna läker — sparandet är en plan. */
  const h = { namn: "Hovprovet", balansVal: { barfota: true } };
  sättBalans(h, { vecka: 9, veckor: 18 });
  ok(h.balans?.barfota === true && hovläge(h) === 100, "fulla hovar: barfota går på");
  släppBalans(h);
  ok(hovläge(h) === 65, `en barfotastart kostar (hovarna ${hovläge(h)})`);
  släppBalans({ ...h, balans: { barfota: true, delar: ["Barfota runt om"] } });
  h.hovar = 30;
  const läge = sättBalans(h, { vecka: 9, veckor: 18 });
  ok(h.balans === null && läge.spärrar.some((s) => s.includes("växa")),
    "slitna hovar spärrar barfota — med orsaken i klartext");
  for (let v = 0; v < 4; v++) veckovård(h);
  ok(hovläge(h) === 62 && sättBalans(h, { vecka: 9, veckor: 18 }).balans?.barfota,
    `fyra veckors skor och hovarna tål det igen (${hovläge(h)})`);
  släppBalans(h);

  /* Tussarna: första gången full effekt, sedan mattat — vila återställer. */
  const t2 = { namn: "Tussprovet" };
  ok(tusseffekt(t2) === 1, "osedda tussar: full effekt");
  t2.tussVana = 1;
  ok(tusseffekt(t2) === 0.7, "nyss visade: effekten mattad");
  for (let v = 0; v < 5; v++) veckovård(t2);
  ok(tusseffekt(t2) === 1, "fem veckors vila och rycket biter igen");

  /* Ett huvudlag åt gången. */
  const t3 = { namn: "Huvudlagsprovet", balansVal: { huvudlappar: true, helstängt: true } };
  const l3 = sättBalans(t3, { vecka: 9, veckor: 18 });
  ok(t3.balans.delar.length === 1 && l3.spärrar.some((s) => s.includes("huvudlag")),
    "norskt och helstängt samtidigt vägras — ett huvudlag åt gången");
  släppBalans(t3);
}

/* ---------------- Planen läggs på mötet och förifyller loppdagen ---------------- */
{
  const { byggInkorg, verkställBeslut } = await import("./engine-inkorg.js");
  const { veckansLopp } = await import("./data-kalender.js");
  let storvecka = null, storlopp = null;
  for (let v = 18; v >= 1 && !storvecka; v--) {
    const l = veckansLopp(v).find((x) => x.storlopp);
    if (l) { storvecka = v; storlopp = l; }
  }
  const spel = {
    säsong: 2, vecka: storvecka - 2, veckor: 18, kassa: 90000, renommé: 40,
    stallnamn: "P", press: [], logg: [], föl: [], sponsorer: [], sponsorerbjudanden: [],
    telefonlogg: [], inkorgLästa: [], inkorgBeslutade: [], anmälningar: [], startadeLopp: [],
    kuskrelation: {}, ägarrelationer: {}, anläggning: {}, stopp: "måndag",
    förstaman: { namn: "Ulla Plan", profil: "taktiker", säsonger: 2 },
    stall: [{ id: 1, namn: "Planhästen", ålder: 6, skada: 0, energi: 80, form: 60,
      start: 70, fart: 72, styrka: 70, intjänat: 900000, starter: 20, segrar: 6,
      senasteStartVecka: storvecka - 3, träning: "lugnt", resultat: [] }],
    värld: { stall: [], hästar: [] },
  };
  const samtal = byggInkorg(spel).find((h) => h.beslut?.typ === "utrustningsplan");
  ok(!!samtal && samtal.lång.includes("rycktussarna") || samtal?.lång.includes("Hovarna"),
    "förstamannen ringer om planen när målloppet närmar sig");
  verkställBeslut(spel, samtal, "spara");
  const plan = spel.utrustningsplan[1];
  ok(plan?.loppId === storlopp.id && plan.val.barfota && plan.val.tussar,
    "»lägg planen« sparar barfota och tussar till målloppet");
  ok(!byggInkorg(spel).some((h) => h.beslut?.typ === "utrustningsplan"),
    "frågan ställs inte om när planen redan ligger");
}


/* ---------------- Individen (v169, 21.9b) ---------------- */
{
  /* Travlogiken: het häst tål aldrig helstängt, orolig samlas av norskt,
     stark häst tål alltid barfota. */
  ok(utrustningssvar({ namn: "Heta Hilda", id: 1, lynne: 30 }, "helstängt") === "fel",
    "het häst (lynne 30) tål aldrig helstängt — galopperar av vass utrustning");
  ok(utrustningssvar({ namn: "Oroliga Olga", id: 2, lynne: 40 }, "huvudlappar") === "stark",
    "orolig häst samlas av norskt huvudlag");
  for (let i = 0; i < 50; i++) {
    const svar = utrustningssvar({ namn: `Starka ${i}`, id: i, styrka: 70 }, "barfota");
    if (svar === "fel") { ok(false, "stark häst fick fel-svar på barfota"); break; }
    if (i === 49) ok(true, "stark häst (styrka ≥62) tål alltid barfota — 50 individer provade");
  }
  /* Fördelningen: individer skiljer sig, men de flesta är vanliga. */
  const räkning = { stark: 0, neutral: 0, fel: 0 };
  for (let i = 0; i < 1000; i++) räkning[utrustningssvar({ namn: `J${i}`, id: i, lynne: 55, styrka: 50 }, "jänkarvagn")]++;
  ok(räkning.fel > 120 && räkning.fel < 280 && räkning.stark > 150,
    `jänkarvagnen är ren individ (${räkning.stark} starka, ${räkning.fel} går inte i den av 1000)`);

  /* Effekten: tål-inte ger NOLL nytta och orenare trav. */
  const felhäst = { namn: "Heta Hilda", id: 1, lynne: 30, balansVal: { helstängt: true } };
  sättBalans(felhäst, { vecka: 9, veckor: 18 });
  ok(felhäst.balans.fart === 0 && felhäst.balans.travsäkerhet < 0,
    "fel utrustning på fel häst: ingen fart, orenare trav");
  /* Upptäckten: svaret är dolt tills provat. */
  ok(svarstext(felhäst, "helstängt") === "oprövat på hästen", "svaret är dolt före första provet");
  släppBalans(felhäst);
  ok(utrustningKänd(felhäst, "helstängt") && svarstext(felhäst, "helstängt").includes("tål den inte"),
    "efter starten VET tränaren — hästens egen låda byggs av prov");

  /* Brodd: vinterns val, spärrad på sommarbana. */
  const b = { namn: "Broddprovet", balansVal: { brodd: true } };
  const sommar = sättBalans(b, { vecka: 9, veckor: 18 });
  ok(b.balans === null && sommar.spärrar.some((s) => s.includes("Brodd")),
    "brodd utan is spärras med orsak");
  sättBalans(b, { vecka: 2, veckor: 18 });
  ok(b.balans?.travsäkerhet > 0 && b.balans.fart < 0,
    "på vinterbana: tryggare och något trögare — exakt vad brodd gör");
  släppBalans(b);
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
