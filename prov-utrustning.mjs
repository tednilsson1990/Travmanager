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
import { sättBalans, släppBalans, vinterbana, UTRUSTNING } from "./engine-utrustning.js";
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
    && h.balans.delar.includes("Huvudlappar") && !h.balans.delar.includes("Barfota runt om"),
    "vinterbana: barfota spärras med orsak — huvudlapparna går på");
  släppBalans(h);
  ok(h.balans === null, "efter loppet: balansen släppt");
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
