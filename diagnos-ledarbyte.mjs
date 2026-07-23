/**
 * DIAGNOS: LEDARBYTEN
 *
 * Hypotes: "ledningen −6" och "rygg ledaren +8" har samma orsak — ledningen
 * byter ägare för lätt sent i loppet. Om 1000-metersledaren blir omkörd
 * oftare än i verkligheten flyttas hens segrar till angriparna, som till
 * största delen kommer från rygg ledaren.
 *
 * Mäter, utan att röra motorn:
 *   1. Hur ofta håller 1000-metersledaren ledningen ända in i mål?
 *   2. När ledaren blir omkörd efter 1000 m — varifrån kom omkörarn?
 *   3. Ledarbyten per lopp i sista 1000 m.
 *
 * Verklighetsriktmärke: ledningen vid 1000 m vinner 42 % — och i lopp där
 * ledaren INTE vinner slutar hen ofta tvåa/trea, dvs behåller ofta spets.
 */
import { sättRng, seedad } from "./engine-util.js";
import { veckansLopp } from "./data-kalender.js";
import { byggVärld, byggFält, rustaFält } from "./engine-varld.js";
import { beräknaStreck } from "./engine-streck.js";
import { simulera } from "./engine-simulera.js";

const SEEDS = [18472, 3, 991, 7710, 42424, 130862];
const namnge = (r) => {
  if (r.kol === 0) return r.rang === 1 ? "ledningen" : r.rang === 2 ? "rygg ledaren"
    : r.rang === 3 ? "tredje invändigt" : "bak invändigt";
  if (r.kol === 1) return r.rang === 1 ? "dödens" : r.rang === 2 ? "andra utvändigt"
    : r.rang === 3 ? "tredje utvändigt" : "bak utvändigt";
  return "tredje spåret";
};

let lopp_n = 0, ledareHåller = 0, ledareVinner = 0, ledarePall = 0;
const omkörareFrån = {};
let bytenSista1000 = 0;

for (const frö of SEEDS) {
  sättRng(seedad(frö));
  const värld = byggVärld();
  for (let i = 0; i < 120; i++) {
    const lopp = veckansLopp(1 + (i % 20))[i % 3] || veckansLopp(1)[0];
    const fält = byggFält(värld, lopp, 1 + i, new Set());
    rustaFält(fält, lopp);
    beräknaStreck(fält, { spelförtroende: 40, stallform: 50, marknadsbild: 0 }, lopp);
    const { bild, resultat } = simulera(fält, lopp);
    if (!bild.length || !resultat.length || !resultat[0].plats) continue;

    const dist = lopp.dist;
    /* Frame närmast 1000 m kvar */
    const vid = (kvar) => bild.reduce((b, f) =>
      Math.abs(dist - f.meter - kvar) < Math.abs(dist - b.meter - kvar) ? f : b);
    const f1000 = vid(1000);
    const ledare1000 = f1000.rader.find((r) => r.läge === "leder");
    if (!ledare1000) continue;
    lopp_n++;

    /* Håller hen ledningen? Sista framen före mål */
    const sista = bild[bild.length - 1];
    const ledareSist = sista.rader.find((r) => r.läge === "leder");
    const höll = ledareSist && ledareSist.namn === ledare1000.namn;
    if (höll) ledareHåller++;

    const vinnare = resultat[0];
    if (vinnare.häst.namn === ledare1000.namn) ledareVinner++;
    const ledResultat = resultat.find((r) => r.häst.namn === ledare1000.namn);
    if (ledResultat?.plats && ledResultat.plats <= 3) ledarePall++;

    /* Om ledaren blev omkörd och omkörarn vann: varifrån kom hen vid 1000? */
    if (!höll && vinnare.häst.namn !== ledare1000.namn) {
      const vinnVid1000 = f1000.rader.find((r) => r.namn === vinnare.häst.namn);
      if (vinnVid1000) {
        const läge = vinnVid1000.läge === "leder" ? "ledningen"
          : vinnVid1000.läge;
        omkörareFrån[läge] = (omkörareFrån[läge] || 0) + 1;
      }
    }

    /* Ledarbyten i sista 1000 m */
    let förra = null;
    for (const f of bild) {
      if (dist - f.meter > 1000) continue;
      const l = f.rader.find((r) => r.läge === "leder");
      if (l && förra && l.namn !== förra) bytenSista1000++;
      if (l) förra = l.namn;
    }
  }
}

console.log(`Lopp analyserade: ${lopp_n}`);
console.log(`\n1000-metersledaren:`);
console.log(`  håller ledningen i mål   ${(ledareHåller / lopp_n * 100).toFixed(1)} %`);
console.log(`  vinner                   ${(ledareVinner / lopp_n * 100).toFixed(1)} %   (mål 42)`);
console.log(`  slutar topp 3            ${(ledarePall / lopp_n * 100).toFixed(1)} %`);
console.log(`\nLedarbyten sista 1000 m: ${(bytenSista1000 / lopp_n).toFixed(2)} per lopp`);
console.log(`\nNär ledaren omkörs och omkörarn VINNER — varifrån kom hen vid 1000 m:`);
Object.entries(omkörareFrån).sort((a, b) => b[1] - a[1]).forEach(([läge, n]) =>
  console.log(`  ${läge.padEnd(24)} ${n}  (${(n / lopp_n * 100).toFixed(1)} % av loppen)`));
