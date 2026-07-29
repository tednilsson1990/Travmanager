/**
 * PROV — STATISTIKLAGRET (v109, 20.3)
 *
 * Aggregaten ska räkna rätt och ljuga aldrig: procent ur bevarade
 * rader, banor och positioner bara där data finns (inga gissningar för
 * gamla rader), tränarens totaler ur karriären och inte ur raderna,
 * och grupperingen sorterad så det mesta står först.
 */
import { hästStatistik, tränarStatistik } from "./engine-statistik.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: statistiklagret\n");

const rad = (extra) => ({ säsong: 1, vecka: 2, lopp: "P", bana: "Romme", dist: 2140,
  start: "auto", plats: 4, startande: 12, km: 15.1, läge: "rygg/inner", spår: 5,
  kusk: "A Kusksson", pris: 3000, ...extra });

/* ---------- Hästens aggregat ---------- */
{
  const häst = { resultat: [
    rad({ plats: 1, läge: "ledningen", km: 14.2, pris: 40000 }),
    rad({ plats: 2, bana: "Solänget", start: "volt", dist: 2600, läge: "dödens" }),
    rad({ plats: 6, kusk: "B Körare", läge: "utvändigt" }),
    rad({ plats: 1, km: 14.8, pris: 35000 }),
    rad({ plats: null, ur: true, km: null, läge: undefined, bana: undefined }),
  ] };
  const s = hästStatistik(häst);
  ok(s.starter === 4 && s.segrar === 2 && s.segerprocent === 50,
    `räknar bevarade starter rätt: ${s.starter} st, ${s.segrar} seg, ${s.segerprocent} %`);
  ok(s.bästaKm === 14.2, "bästa kilometertid är minsta km-värdet");
  ok(s.positioner.some((p) => p.namn === "Ledningen" && p.segrar === 1)
    && !s.positioner.some((p) => p.namn === "undefined"),
    "positionstabellen har ledningen — och gissar aldrig där data saknas");
  ok(s.banor.find((b) => b.namn === "Romme").starter === 3
    && s.banor.length === 2,
    "banorna grupperas ur radernas banfält");
  ok(s.startmetod.find((m) => m.namn === "Volt")?.starter === 1,
    "volt och autostart hålls isär");
  ok(s.distanser.some((d) => d.namn.startsWith("Lång")),
    "distansgrupperna delar kort, medel och lång");
}

/* ---------- Tränarens totaler ---------- */
{
  const spel = {
    karriär: { starter: 180, segrar: 27, prispengar: 2340000, storloppssegrar: 1 },
    stall: [
      { resultat: [rad({ plats: 1, kusk: "A Kusksson" }), rad({ plats: 3, bana: "Solänget" })] },
      { resultat: [rad({ plats: 1, kusk: "A Kusksson", bana: "Romme" })] },
    ],
  };
  const t = tränarStatistik(spel);
  ok(t.starter === 180 && t.segerprocent === 15,
    "totalerna kommer ur karriären — inte ur de trunkerade raderna");
  ok(t.snittintjäning === 13000, `snittintjäningen: ${t.snittintjäning} kr per start`);
  ok(t.bästaKusk?.namn === "A Kusksson" && t.bästaKusk.segrar === 2,
    "främsta kusken räknas över hela stallet");
  ok(t.bästaBana?.namn === "Romme", "bästa banan likaså");
  ok(t.säsonger.length === 1 && t.säsonger[0].namn === "Säsong 1",
    "säsongstabellen ur radernas säsongsfält");
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
