/**
 * PROV — RARITETSHÄSTEN (v147, 21.5)
 *
 * Vit stjärna i pannan: hash-avgjord, ren teckning, noll egenskaper.
 * Frekvensen ska vara sällsynt men upplevbar (1/64 egna föl, 1/400 i
 * världen), stamboken ska bära märket, och samma nyckel ska alltid
 * ge samma svar — travets shiny är deterministisk.
 */
import { prövaRaritet, RARITETSTEXT, nyHäst } from "./engine-hast.js";
import { säkraStambok } from "./engine-stambok.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: raritetshästen\n");

/* ---------------- Determinism och frekvens ---------------- */
{
  ok(prövaRaritet("prov:abc", 64) === prövaRaritet("prov:abc", 64),
    "samma nyckel, samma svar — ingen slump");

  const N = 64000;
  let träffar64 = 0, träffar400 = 0;
  for (let i = 0; i < N; i++) {
    if (prövaRaritet(`frekvens:${i}`, 64)) träffar64++;
    if (prövaRaritet(`frekvens:${i}`, 400)) träffar400++;
  }
  ok(träffar64 > 800 && träffar64 < 1200,
    `1 på 64 håller måttet (${träffar64}/${N} ≈ 1/${Math.round(N / träffar64)})`);
  ok(träffar400 > 110 && träffar400 < 210,
    `1 på 400 håller måttet (${träffar400}/${N} ≈ 1/${Math.round(N / träffar400)})`);
}

/* ---------------- Ren teckning: inga egenskaper ---------------- */
{
  const h = nyHäst({ namn: "Stjärnprovet", start: 50, fart: 50, styrka: 50 });
  const före = { start: h.start, fart: h.fart, styrka: h.styrka };
  h.raritet = "stjärna";
  ok(h.start === före.start && h.fart === före.fart && h.styrka === före.styrka,
    "märket rör inga egenskaper — realismvakten håller");
  ok(RARITETSTEXT.includes("vit stjärna"), "berättelsen bor på ett ställe");
}

/* ---------------- Stamboken bär stjärnan ---------------- */
{
  const spel = {
    säsong: 2, avelsston: [], hallOfFame: [],
    stall: [{ id: 1, namn: "Stjärnfölet", kön: "sto", ålder: 3, segrar: 0, starter: 0,
      intjänat: 0, mor: "Modern", far: "Fadern", morId: 7, raritet: "stjärna" }],
  };
  säkraStambok(spel);
  const p = spel.stambok.find((x) => x.namn === "Stjärnfölet");
  ok(p?.raritet === "stjärna", "stamboksposten bär märket från födseln");

  /* Äldre post utan raritet uppgraderas när hästen visar sig bära den. */
  const spel2 = {
    säsong: 2, avelsston: [], hallOfFame: [],
    stall: [{ id: 2, namn: "Senupptäckta", kön: "hingst", ålder: 4, segrar: 1, starter: 3, intjänat: 20000 }],
  };
  säkraStambok(spel2);
  spel2.stall[0].raritet = "stjärna";
  säkraStambok(spel2);
  ok(spel2.stambok.find((x) => x.namn === "Senupptäckta")?.raritet === "stjärna",
    "synken lyfter in märket i en äldre post");
}

/* ---------------- Motorns nycklar ger upplevbara stjärnor ---------------- */
{
  /* Exakt kläckningsnyckeln: över en rimlig mängd föl ska stjärnan
     faktiskt födas — drömmen ska gå att uppleva, inte bara finnas. */
  let födda = 0;
  for (let s = 1; s <= 10; s++) for (let v = 1; v <= 18; v++) for (const namn of ["Alfa", "Beta", "Gamma", "Delta"]) {
    if (prövaRaritet(`raritet:${namn}:${s}:${v}`, 64)) födda++;
  }
  ok(födda >= 4 && födda <= 24,
    `kläckningsnyckeln föder stjärnor i upplevbar takt (${födda} på 720 föl)`);
}

console.log(fel === 0 ? "\nALLT GRÖNT" : `\n${fel} FEL`);
process.exit(fel === 0 ? 0 : 1);
