/**
 * PROV — KONTINUITETSMINNET (v104, 20.2)
 *
 * Spelet ska referera rätt: grundplåten räknas ärligt ur befintliga
 * rader, milstolparna träffar de jämna siffrorna, rivalraden bär
 * ställning och senaste vinnare, loppminnet skiljer på egen insats
 * och stallets, och bokföringen efter loppet ger milstolpsraden
 * exakt när siffran är jämn — aldrig annars.
 */
import { säkraKarriär, nästaMilstolpe, minnenInförLopp, bokförKarriär } from "./engine-minnen.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: kontinuitetsminnet\n");

const häst = (extra = {}) => ({ id: 1, namn: "Provhästen", starter: 6, intjänat: 80000,
  resultat: [{ lopp: "Provpokalen", plats: 3, pris: 8000 }], ...extra });

/* ---------- Grundplåten ---------- */
{
  const spel = { stall: [häst(), häst({ id: 2, namn: "Två", starter: 4, intjänat: 20000,
    resultat: [{ lopp: "X", plats: 1, pris: 20000 }] })] };
  const k = säkraKarriär(spel);
  ok(k.starter === 10 && k.segrar === 1 && k.prispengar === 100000,
    `grundplåten ur befintliga rader: ${k.starter} starter, ${k.segrar} seger, ${k.prispengar} kr`);
  ok(säkraKarriär(spel) === k, "grundas bara en gång — sedan är totalerna sanningen");
}

/* ---------- Milstolparna ---------- */
{
  ok(nästaMilstolpe(0) === 1 && nästaMilstolpe(9) === 10 && nästaMilstolpe(10) === 25
    && nästaMilstolpe(99) === 100 && nästaMilstolpe(1000) === 2500,
    "stolparna: 1, 10, 25, 50, 100 ... och vidare");
}

/* ---------- Inför loppet ---------- */
{
  const spel = { stall: [], karriär: { starter: 200, segrar: 49, prispengar: 0, storloppssegrar: 2 },
    rivaliteter: { a: { hästId: 1, rivalNamn: "Stormvind", möten: 3, dinaSegrar: 1, hansSegrar: 2, senastVann: "rival" } },
    loppfacit: { "Guldstoet": { säsong: 1, häst: "Gamla Stjärnan", plats: 1 } } };
  const h = häst();
  const fält = [h, { namn: "Stormvind" }, { namn: "Annan" }];
  const rader = minnenInförLopp(spel, h, { kortnamn: "Provpokalen" }, fält);
  ok(rader.some((r) => r.includes("50:e")), "milstolpen nämns när nästa seger är jämn");
  ok(rader.some((r) => r.includes("Stormvind") && r.includes("1–2") && r.includes("Senast vann Stormvind")),
    "rivalraden bär ställningen och senaste vinnaren");
  ok(rader.some((r) => r.includes("3:a") && r.includes("Provpokalen") === false),
    "loppminnet läser hästens egen rad — revanschen, inte loppnamnet igen");
  const rader2 = minnenInförLopp(spel, h, { kortnamn: "Guldstoet" }, [h]);
  ok(rader2.some((r) => r.includes("Gamla Stjärnan")),
    "stallets loppfacit minns även när hästen är en annan");
  ok(rader.length <= 3, "aldrig fler än tre rader — minne, inte mässa");
}

/* ---------- Bokföringen efter loppet ---------- */
{
  const spel = { stall: [], karriär: { starter: 10, segrar: 9, prispengar: 0, storloppssegrar: 0 } };
  const rad = bokförKarriär(spel, { vann: true, brutto: 30000, lopp: { kortnamn: "P" }, häst: häst(), plats: 1 });
  ok(spel.karriär.segrar === 10 && rad && rad.includes("10:e"),
    "tionde segern ger milstolpsraden: " + rad);
  const rad2 = bokförKarriär(spel, { vann: true, brutto: 30000, lopp: { kortnamn: "P" }, häst: häst(), plats: 1 });
  ok(spel.karriär.segrar === 11 && rad2 === null,
    "elfte segern är bara en seger — ingen falsk högtid");
  ok(spel.loppfacit?.P?.plats === 1, "loppfacit minns stallets bästa insats per lopp");
  const spel2 = { stall: [], karriär: { starter: 0, segrar: 0, prispengar: 0, storloppssegrar: 0 } };
  const först = bokförKarriär(spel2, { vann: true, brutto: 10000, lopp: { kortnamn: "Q" }, häst: häst(), plats: 1 });
  ok(först && först.includes("FÖRSTA"), "första segern får sin egen rad");
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
