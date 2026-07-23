/**
 * DIAGNOS: ENERGI ELLER BETEENDE?
 *
 * Ytterraden ligger bakom ryggen i 47 % av loppen vid 400 m. Två möjliga
 * orsaker med helt olika åtgärd:
 *
 *   H1 BETEENDE — ytterhästarna har krafter kvar men regleringen håller dem
 *      bak (stationsklampen, följningen). Åtgärd: regleringen.
 *   H2 ENERGI — raden smälter framifrån: dödens (1,34×) töms och faller,
 *      nästa ytterhäst blir radens främsta utan rygg, betalar 1,34× och
 *      töms i sin tur. Åtgärd: kostnader eller radens återfyllnad.
 *
 * Mäter kraften hos radens främsta ytterhäst i de lopp där raden ligger
 * bakom ryggen, jämfört med ryggens egen kraft. Har radens hästar >45 i
 * kraft när de ligger bak är det beteende; ligger de under ~30 är de tomma.
 */
import { sättRng, seedad } from "./engine-util.js";
import { veckansLopp } from "./data-kalender.js";
import { byggVärld, byggFält, rustaFält } from "./engine-varld.js";
import { beräknaStreck } from "./engine-streck.js";
import { simulera } from "./engine-simulera.js";

const SEEDS = [18472, 3, 991, 7710, 42424, 130862];
const prov = { 800: [], 600: [], 400: [] };

for (const frö of SEEDS) {
  sättRng(seedad(frö));
  const värld = byggVärld();
  for (let i = 0; i < 120; i++) {
    const lopp = veckansLopp(1 + (i % 20))[i % 3] || veckansLopp(1)[0];
    const fält = byggFält(värld, lopp, 1 + i, new Set());
    rustaFält(fält, lopp);
    beräknaStreck(fält, { spelförtroende: 40, stallform: 50, marknadsbild: 0 }, lopp);
    const { bild } = simulera(fält, lopp);
    if (!bild.length) continue;
    const dist = lopp.dist;
    for (const kvar of [800, 600, 400]) {
      const f = bild.reduce((b, x) =>
        Math.abs(dist - x.meter - kvar) < Math.abs(dist - b.meter - kvar) ? x : b);
      const rygg = f.rader.find((r) => r.kol === 0 && r.rang === 2 && r.läge !== "i mål");
      const ytter = f.rader.filter((r) => r.kol === 1 && r.läge !== "i mål");
      if (!rygg || !ytter.length) continue;
      const främst = ytter.reduce((a, b) => (a.avst < b.avst ? a : b));
      prov[kvar].push({
        bakom: främst.avst - rygg.avst,          // >0 = radens främsta ligger bakom ryggen
        kraftYtter: främst.kraft,
        kraftRygg: rygg.kraft,
      });
    }
  }
}

const snitt = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
for (const kvar of [800, 600, 400]) {
  const p = prov[kvar];
  const bak = p.filter((x) => x.bakom > 1.2);
  console.log(`\n${kvar} m kvar  (${p.length} lopp, raden bakom ryggen i ${(bak.length / p.length * 100).toFixed(0)} %)`);
  console.log(`  radens främsta, kraft när den ligger BAKOM:  ${snitt(bak.map((x) => x.kraftYtter)).toFixed(0)}`);
  console.log(`  ryggens kraft i samma lopp:                  ${snitt(bak.map((x) => x.kraftRygg)).toFixed(0)}`);
  console.log(`  hur långt bakom (längder):                   ${snitt(bak.map((x) => x.bakom)).toFixed(1)}`);
}
console.log(`\nTolkning: kraft >45 hos radens främsta ⇒ BETEENDE. Kraft <30 ⇒ ENERGI.`);
