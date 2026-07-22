/**
 * KALIBRERING
 *
 * All slump går genom slump() i engine-util.js. Här sätts en seedad
 * generator, så samma seed ger exakt samma lopp. Ett misstänkt utfall kan
 * köras om med `node kalibrering.mjs <seed>`.
 *
 * VIKTIGT OM MÅTTET
 * Källmaterialet (Statistikbibeln, Åbystatistiken) anger positionen
 * "ca 1 000 m kvar". Det är därför huvudmåttet här. Tidigare mätte vi var
 * vinnaren tillbringade mest tid mellan 20 och 80 procent av loppet — ett
 * eget påfund som gav systematiskt andra siffror, eftersom en häst som
 * ligger 1 200 meter i andra utvändigt och går fram sista 700 klassas som
 * dödens av det måttet men som andra utvändigt av källans.
 *
 * Övriga mått rapporteras som diagnostik, inte som kalibreringsmål.
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
const LÄGEN = Object.keys(MÅL);
const namnge = (r) => {
  if (r.kol === 0) return r.rang === 1 ? "ledningen" : r.rang === 2 ? "rygg ledaren"
    : r.rang === 3 ? "tredje invändigt" : "bak invändigt";
  if (r.kol === 1) return r.rang === 1 ? "dödens" : r.rang === 2 ? "andra utvändigt"
    : r.rang === 3 ? "tredje utvändigt" : "bak utvändigt";
  return "tredje spåret";
};
const nyRäknare = () => ({ vid1000: {}, vid500: {}, någonGång: {}, meter: {} });

function körSeed(frö, loppPerSeed = 120) {
  sättRng(seedad(frö));
  const värld = byggVärld();
  const m = {
    n: 0, r: nyRäknare(), perTyp: {},
    t1: [], t2: [], t3: [], favVann: 0, bästVann: 0,
    tider: [], galopp: 0, dq: 0,
    pressNärvaro: [], pressVerklig: [],
    ryggFriVäg: 0, ryggFinns: 0, ryggVann: 0,
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

    const vinnare = resultat[0].häst.namn;
    const vid = (kvarMeter) => {
      const b = bild.find((x) => lopp.dist - x.meter <= kvarMeter) || bild[bild.length - 1];
      const r = b.rader.find((x) => x.namn === vinnare);
      return r && r.kol !== undefined ? namnge(r) : null;
    };
    const p1000 = vid(1000), p500 = vid(500);
    if (p1000) m.r.vid1000[p1000] = (m.r.vid1000[p1000] || 0) + 1;
    if (p500) m.r.vid500[p500] = (m.r.vid500[p500] || 0) + 1;

    /* Meter i varje position, och vilka positioner vinnaren någonsin haft.
       Det skiljer "satt där hela loppet" från "passerade förbi". */
    const sedda = new Set();
    let förra = null;
    bild.forEach((b) => {
      const r = b.rader.find((x) => x.namn === vinnare);
      if (!r || r.kol === undefined || r.läge === "i mål") return;
      const k = namnge(r);
      sedda.add(k);
      if (förra !== null) m.r.meter[k] = (m.r.meter[k] || 0) + (b.meter - förra);
      förra = b.meter;
    });
    sedda.forEach((k) => { m.r.någonGång[k] = (m.r.någonGång[k] || 0) + 1; });

    /* Press på ledaren. Närvaro = någon ligger utvändigt intill. Verklig
       press = den håller farten uppe OCH tvingar ledaren över sin plan. */
    let närvaro = 0, verklig = 0, rutor = 0;
    bild.forEach((b) => {
      const l = b.rader[0];
      if (!l || l.läge === "i mål") return;
      rutor++;
      const ute = b.rader.find((x) => x.kol >= 1 && x.avst < 4);
      if (ute) {
        närvaro++;
        if (ute.avst < 1.2 && ute.fart >= l.fart - 0.8) verklig++;
      }
    });
    if (rutor) { m.pressNärvaro.push(närvaro / rutor); m.pressVerklig.push(verklig / rutor); }

    /* Rygg ledaren: får den fri väg över upploppet? */
    const ram = bild.find((x) => lopp.dist - x.meter <= 400);
    if (ram) {
      const r = ram.rader.find((x) => x.kol === 0 && x.rang === 2);
      if (r) {
        m.ryggFinns++;
        if (r.läge !== "instängd") m.ryggFriVäg++;
        if (r.namn === vinnare) m.ryggVann++;
      }
    }

    const typ = `${lopp.dist} ${lopp.start}${lopp.openStretch ? " OS" : ""}`;
    m.perTyp[typ] = m.perTyp[typ] || { n: 0, led: 0 };
    m.perTyp[typ].n++;
    if (p1000 === "ledningen") m.perTyp[typ].led++;
  }
  return m;
}

const seeds = process.argv[2] ? [Number(process.argv[2])]
  : [11, 29, 47, 83, 101, 137, 181, 233, 307, 401, 509, 613];
const LOPP_PER_SEED = 120;
const alla = seeds.map((f) => körSeed(f, LOPP_PER_SEED));
const sn = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const tot = (f) => sn(alla.map(f));

console.log(`KALIBRERING — ${seeds.length} seeds à ${LOPP_PER_SEED} lopp`);
console.log(`seeds: ${seeds.join(", ")}\n`);

console.log("SEGRARENS POSITION 1 000 M FRÅN MÅL  (källans definition)");
LÄGEN.forEach((k) => {
  const v = tot((m) => (m.r.vid1000[k] || 0) / m.n * 100);
  const spann = alla.map((m) => (m.r.vid1000[k] || 0) / m.n * 100);
  const avv = v - MÅL[k];
  console.log("  " + k.padEnd(18) + v.toFixed(1).padStart(5) + " %  mål " + String(MÅL[k]).padStart(4) +
    "   seedspann " + Math.min(...spann).toFixed(0) + "–" + Math.max(...spann).toFixed(0) +
    "   " + (Math.abs(avv) < 3 ? "✓" : (avv > 0 ? "+" : "") + avv.toFixed(0)));
});

console.log("\nDIAGNOSTIK — samma vinnare, andra mått");
console.log("  läge                vid 500 m   någon gång   meter i läget");
LÄGEN.forEach((k) => {
  const v500 = tot((m) => (m.r.vid500[k] || 0) / m.n * 100);
  const ng = tot((m) => (m.r.någonGång[k] || 0) / m.n * 100);
  const met = tot((m) => (m.r.meter[k] || 0) / m.n);
  console.log("  " + k.padEnd(18) + v500.toFixed(1).padStart(7) + " %" +
    ng.toFixed(0).padStart(11) + " %" + met.toFixed(0).padStart(12) + " m");
});

console.log("\nSPELMARKNADEN");
console.log("  favoriten streckas   " + tot((m) => sn(m.t1)).toFixed(1) + " %   (verkligt ~35)");
console.log("  två främsta          " + tot((m) => sn(m.t2)).toFixed(0) + " %   (verkligt 55–60)");
console.log("  tre främsta          " + tot((m) => sn(m.t3)).toFixed(0) + " %   (verkligt 70–75)");
console.log("  favoriten vinner     " + tot((m) => m.favVann / m.n * 100).toFixed(1) + " %");
console.log("  bästa hästen vinner  " + tot((m) => m.bästVann / m.n * 100).toFixed(1) + " %   (verkligt 30–40)");

console.log("\nLEDAREN OCH RYGGHÄSTEN");
console.log("  någon ligger utvändigt intill   " + tot((m) => sn(m.pressNärvaro) * 100).toFixed(0) + " % av loppet");
console.log("  verklig press (håller farten)   " + tot((m) => sn(m.pressVerklig) * 100).toFixed(0) + " % av loppet");
console.log("  rygg ledaren har fri väg vid 400 m  " + tot((m) => m.ryggFriVäg / Math.max(1, m.ryggFinns) * 100).toFixed(0) + " %");
console.log("  rygg ledaren vinner därifrån        " + tot((m) => m.ryggVann / Math.max(1, m.ryggFinns) * 100).toFixed(0) + " %");

console.log("\nPER LOPPTYP — hur ofta vinner ledningen");
const typer = {};
alla.forEach((m) => Object.entries(m.perTyp).forEach(([t, v]) => {
  typer[t] = typer[t] || { n: 0, led: 0 };
  typer[t].n += v.n; typer[t].led += v.led;
}));
Object.entries(typer).sort((a, b) => b[1].n - a[1].n).forEach(([t, v]) =>
  console.log("  " + t.padEnd(16) + (v.led / v.n * 100).toFixed(0).padStart(3) + " %   (" + v.n + " lopp)"));

const tider = alla.flatMap((m) => m.tider).sort((a, b) => a - b);
console.log("\nLOPPET");
console.log("  segrartid median     " + kmtid(tider[Math.floor(tider.length / 2)]));
console.log("  galopper per lopp    " + tot((m) => m.galopp / m.n).toFixed(2));
console.log("  diskade per lopp     " + tot((m) => m.dq / m.n).toFixed(2));
