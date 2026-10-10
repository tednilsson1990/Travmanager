/**
 * PROV — VÄDRET (v154, 20.3 etapp A)
 *
 * Datan, inte effekten: deterministiskt veckoväder, snö bara i
 * vinterfönstret, raderna bär det och statistiken grupperar det.
 */
import { veckansVäder, väderläge, VÄDER } from "./engine-vader.js";
import { vinterbana } from "./engine-utrustning.js";
import { hästStatistik } from "./engine-statistik.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: vädret\n");

{
  const spel = { säsong: 2, vecka: 9, veckor: 18 };
  ok(veckansVäder(spel) === veckansVäder({ ...spel }),
    "hash-avgjort: samma vecka, samma himmel");
  const räkning = { sol: 0, mulet: 0, regn: 0, snö: 0 };
  let snöUtanförVintern = 0, regnIVintern = 0;
  for (let s = 1; s <= 30; s++) for (let v = 1; v <= 18; v++) {
    const sp = { säsong: s, vecka: v, veckor: 18 };
    const id = veckansVäder(sp);
    räkning[id]++;
    if (id === "snö" && !vinterbana(sp)) snöUtanförVintern++;
    if (id === "regn" && vinterbana(sp)) regnIVintern++;
  }
  ok(snöUtanförVintern === 0 && regnIVintern === 0,
    "snön håller sig till vinterfönstret — samma veckor som barfota-förbudet");
  ok(räkning.sol > 100 && räkning.regn > 50 && räkning.snö > 30,
    `alla väder förekommer (sol ${räkning.sol}, mulet ${räkning.mulet}, regn ${räkning.regn}, snö ${räkning.snö})`);
  const läge = väderläge(spel);
  ok(läge.namn && läge.glyf && läge.text && VÄDER[läge.id] === VÄDER[veckansVäder(spel)],
    "väderläget bär namn, glyf och rad för vyerna");
}

{
  /* Statistiken grupperar väder — och gamla rader utan fältet stör inte. */
  const häst = { resultat: [
    { plats: 1, km: 75.1, väder: "regn", bana: "A", kusk: "K", start: "auto", dist: 2140, säsong: 1 },
    { plats: 2, km: 76.0, väder: "regn", bana: "A", kusk: "K", start: "auto", dist: 2140, säsong: 1 },
    { plats: 5, km: 77.2, väder: "sol", bana: "A", kusk: "K", start: "auto", dist: 2140, säsong: 1 },
    { plats: 3, km: 76.5, bana: "A", kusk: "K", start: "auto", dist: 2140, säsong: 1 },
  ] };
  const hs = hästStatistik(häst);
  const regn = hs.väder.find((r) => r.namn === "Regn");
  ok(regn?.starter === 2 && regn.segrar === 1, "regnhästen syns i statistiken (2 starter, 1 seger i regn)");
  ok(hs.väder.every((r) => r.namn !== "undefined" && r.namn != null),
    "rader från tiden före vädret grupperas inte som skräp");
}

console.log(fel === 0 ? "\nALLT GRÖNT" : `\n${fel} FEL`);
process.exit(fel === 0 ? 0 : 1);
