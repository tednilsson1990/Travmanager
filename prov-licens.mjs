/**
 * PROV — KARRIÄRSTEGEN (v171, kap 31:1)
 *
 * Licensen: tre steg, verkliga krav, ett steg per skifte. Galan:
 * Årets tränare och Årets häst på fjolårets siffror.
 */
import { LICENSER, licensläge, prövaLicens, körGalan } from "./engine-licens.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: karriärstegen\n");

{
  const spel = { säsong: 3, veckor: 18, stallnamn: "Stegens",
    karriär: { segrar: 10, prispengar: 400000, storloppssegrar: 0 },
    troférum: [], historik: [] };
  const läge = licensläge(spel);
  ok(läge.nuvarande.id === "b" && läge.nästa.id === "a",
    "alla börjar på B — och ser nästa steg");
  ok(läge.progress.length === 2 && läge.progress[0].nu === 10,
    "progressen räknar karriärens verkliga siffror");
  ok(prövaLicens(spel).length === 0 && spel.licens === "b",
    "kraven inte nådda: ingen uppgradering");

  spel.karriär = { segrar: 30, prispengar: 2_000_000, storloppssegrar: 0 };
  const press = prövaLicens(spel);
  ok(spel.licens === "a" && press.length === 1 && press[0].rubrik.includes("a-licens"),
    `A-licensen beviljas med förstasida (${press[0]?.rubrik})`);
  ok(spel.troférum.some((t) => t.typ === "licens"), "uppgraderingen hänger i troférummet");

  /* Ett steg per skifte — även om elitkraven råkar vara nådda. */
  spel.karriär = { segrar: 200, prispengar: 9_000_000, storloppssegrar: 2 };
  spel.troférum.push({ typ: "seriemästare", rubrik: "Guldserien — mästare", säsong: 2 });
  const spel2 = { ...spel, licens: "b", troférum: [...spel.troférum] };
  prövaLicens(spel2);
  ok(spel2.licens === "a", "aldrig två steg på ett skifte — uppgraderingen ska hinna kännas");
  prövaLicens(spel);
  ok(spel.licens === "elit", "eliten nås när titlarna finns");
  ok(prövaLicens(spel).length === 0, "ovanför eliten finns inget — stegen är klättrad");
}

{
  const spel = { säsong: 4, veckor: 18, stallnamn: "Galans", press: [],
    historik: [{ säsong: 3, plats: 1, bästaHäst: "Galahästen" }],
    troférum: [], värld: { hästar: [{ namn: "Världsstjärnan", intjänat: 2_000_000 }] } };
  const liga = [{ namn: "Galans", tränare: "Du", du: true }];
  const press = körGalan(spel, liga);
  ok(press.some((p) => p.rubrik === "Årets tränare: Galans"),
    "ligavinst = Årets tränare med ditt namn");
  ok(spel.troférum.some((t) => t.typ === "årets_tränare"), "titeln hänger i troférummet");
  ok(press.some((p) => p.rubrik.startsWith("Årets häst:")), "Årets häst koras på galan");

  const spel3 = { ...spel, troférum: [], press: [] };
  const press2 = körGalan(spel3, [{ namn: "Rivalstallet", tränare: "Motståndaren", du: false }]);
  ok(press2.some((p) => p.rubrik === "Årets tränare: Motståndaren")
    && spel3.troférum.length === 0,
    "förlorar du ligan får någon annan priset — och du ser det");
}

console.log(fel === 0 ? "\nALLT GRÖNT" : `\n${fel} FEL`);
process.exit(fel === 0 ? 0 : 1);
