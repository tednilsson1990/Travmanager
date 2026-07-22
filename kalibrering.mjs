/**
 * KALIBRERING
 *
 * Kör flera seedade världar och rapporterar medelvärden, så att siffrorna
 * inte hoppar mellan körningar. Ett misstänkt utfall går att köra om exakt
 * genom att ange samma seed.
 *
 *   node kalibrering.mjs           kör tolv seeds
 *   node kalibrering.mjs 18472     kör bara den seeden
 */
import { sättRng, seedad, kmtid } from "./engine-util.js";
import { veckansLopp } from "./data-kalender.js";
import { byggVärld, byggFält, rustaFält } from "./engine-varld.js";
import { beräknaStreck } from "./engine-streck.js";
import { simulera } from "./engine-simulera.js";

const MÅL = {
  "ledningen": 42, "dödens": 13, "rygg ledaren": 7,
  "andra utvändigt": 9.6, "tredje utvändigt": 7, "tredje invändigt": 3,
};
const namnge = (r) => {
  if (r.kol === 0) return r.rang === 1 ? "ledningen" : r.rang === 2 ? "rygg ledaren"
    : r.rang === 3 ? "tredje invändigt" : "bak invändigt";
  if (r.kol === 1) return r.rang === 1 ? "dödens" : r.rang === 2 ? "andra utvändigt"
    : r.rang === 3 ? "tredje utvändigt" : "bak utvändigt";
  return "tredje spåret";
};

function körSeed(frö, loppPerSeed = 120) {
  sättRng(seedad(frö));
  const värld = byggVärld();
  const m = {
    pos: {}, streck: [], t1: [], t2: [], t3: [],
    favVann: 0, bästVann: 0, n: 0, tider: [],
    galopp: 0, dq: 0, spårseger: {}, press: [],
  };
  for (let i = 0; i < loppPerSeed; i++) {
    const lopp = veckansLopp(1 + (i % 20))[i % 3] || veckansLopp(1)[0];
    const fält = byggFält(värld, lopp, 1 + i, new Set());
    rustaFält(fält, lopp);
    beräknaStreck(fält, { spelförtroende: 40, stallform: 50, marknadsbild: 0 }, lopp);
    const kap = (h) => (h.start + h.fart + h.styrka) / 3;
    const bäst = [...fält].sort((a, b) => kap(b) - kap(a))[0];
    const fav = [...fält].sort((a, b) => b.streck - a.streck)[0];
    const s = fält.map((h) => h.streck).sort((a, b) => b - a);
    m.t1.push(s[0]); m.t2.push(s[0] + s[1]); m.t3.push(s[0] + s[1] + s[2]);

    const { bild, resultat } = simulera(fält, lopp);
    m.n++;
    m.tider.push(resultat[0].km);
    m.dq += resultat.filter((r) => r.ur).length;
    m.galopp += bild.flatMap((b) => b.text).filter((x) => /galopp|felsteg/i.test(x.t)).length;
    if (resultat[0].häst === fav) m.favVann++;
    if (resultat[0].häst === bäst) m.bästVann++;
    m.spårseger[resultat[0].spår] = (m.spårseger[resultat[0].spår] || 0) + 1;

    let p = 0, r2 = 0;
    bild.forEach((b) => {
      const l = b.rader[0];
      if (!l || l.läge === "i mål") return;
      r2++;
      if (b.rader.some((x) => x.kol >= 1 && x.avst < 4)) p++;
    });
    if (r2) m.press.push(p / r2);

    const räkna = {};
    bild.forEach((b) => {
      const a = b.meter / lopp.dist;
      if (a < 0.2 || a > 0.8) return;
      const r = b.rader.find((x) => x.namn === resultat[0].häst.namn);
      if (r && r.kol !== undefined) { const k = namnge(r); räkna[k] = (räkna[k] || 0) + 1; }
    });
    const b2 = Object.entries(räkna).sort((a, b) => b[1] - a[1])[0];
    if (b2) m.pos[b2[0]] = (m.pos[b2[0]] || 0) + 1;
  }
  return m;
}

const arg = process.argv[2] ? [Number(process.argv[2])] : [11, 29, 47, 83, 101, 137, 181, 233, 307, 401, 509, 613];
const alla = arg.map((f) => körSeed(f));
const sn = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const tot = (f) => sn(alla.map(f));
const N = sn(alla.map((m) => m.n));

console.log(`KALIBRERING — ${arg.length} seeds à ${Math.round(N)} lopp\n`);
console.log("SEGRARENS RESA (20–80 % av loppet)");
Object.entries(MÅL).forEach(([k, mål]) => {
  const v = tot((m) => (m.pos[k] || 0) / m.n * 100);
  const spann = alla.map((m) => (m.pos[k] || 0) / m.n * 100);
  const avv = Math.abs(v - mål);
  console.log("  " + k.padEnd(18) + v.toFixed(1).padStart(5) + " %  mål " + String(mål).padStart(4) +
    "   spridning " + Math.min(...spann).toFixed(0) + "–" + Math.max(...spann).toFixed(0) +
    "   " + (avv < 3 ? "✓" : (v > mål ? "+" : "") + (v - mål).toFixed(0)));
});

console.log("\nSPELMARKNADEN");
console.log("  favoriten streckas   " + tot((m) => sn(m.t1)).toFixed(1) + " %   (verkligt ~35)");
console.log("  två främsta          " + tot((m) => sn(m.t2)).toFixed(0) + " %   (verkligt 55–60)");
console.log("  tre främsta          " + tot((m) => sn(m.t3)).toFixed(0) + " %   (verkligt 70–75)");
console.log("  favoriten vinner     " + tot((m) => m.favVann / m.n * 100).toFixed(1) + " %");
console.log("  bästa hästen vinner  " + tot((m) => m.bästVann / m.n * 100).toFixed(1) + " %   (verkligt 30–40)");

console.log("\nLOPPET");
const tider = alla.flatMap((m) => m.tider).sort((a, b) => a - b);
console.log("  segrartid median     " + kmtid(tider[Math.floor(tider.length / 2)]) +
  "   spridning " + kmtid(tider[Math.floor(tider.length * 0.1)]) + "–" + kmtid(tider[Math.floor(tider.length * 0.9)]));
console.log("  galopper per lopp    " + tot((m) => m.galopp / m.n).toFixed(2));
console.log("  diskade per lopp     " + tot((m) => m.dq / m.n).toFixed(2));
console.log("  ledaren pressad      " + tot((m) => sn(m.press) * 100).toFixed(0) + " % av loppet");
