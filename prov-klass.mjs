/**
 * PROV — KLASSTRAPPAN (v116, 21.8: levels gjorda travärliga)
 *
 * Brickan ska trappa rätt (Brons III → Guld I), mätaren räkna ärligt,
 * loppmärket läsa kravspannet som en travtränare — och trappans
 * gränser får ALDRIG glida ifrån kalenderns verkliga seriekrav
 * (divergensvakten).
 */
import { klassnivå, klassläge, KLASSTRAPPA } from "./engine-klass.js";
import { KLASSER } from "./data-kalender.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: klasstrappan\n");

/* ---------- Divergensvakten ---------- */
{
  const brons = KLASSER.find((k) => k.krav?.maxInsprunget === KLASSTRAPPA[0].till);
  const silver = KLASSER.find((k) => k.krav?.maxInsprunget === KLASSTRAPPA[1].till);
  ok(!!brons && !!silver,
    "trappans gränser speglar kalenderns seriekrav — glider kraven ska detta prov falla");
}

/* ---------- Brickan ---------- */
{
  ok(klassnivå({ intjänat: 0 }).etikett === "Brons III", "noll kronor: Brons III");
  ok(klassnivå({ intjänat: 100000 }).etikett === "Brons II", "hundra tusen: Brons II");
  const b1 = klassnivå({ intjänat: 200000 });
  ok(b1.etikett === "Brons I" && b1.nästa === "Silver III",
    "Brons I ser Silver III som nästa steg");
  ok(b1.kvar === 50000, `mätaren räknar ärligt: ${b1.kvar} kr kvar till Silver`);
  ok(klassnivå({ intjänat: 400000 }).klass === "Silver", "fyrahundra tusen: Silver");
  const topp = klassnivå({ intjänat: 4000000 });
  ok(topp.etikett === "Guld I" && topp.nästa === null && topp.kvar === 0,
    "Guld I är trappans topp — ingen nästa, inget kvar");
}

/* ---------- Loppmärket ---------- */
{
  const lopp = { krav: { minInsprunget: 60000, maxInsprunget: 700000 } };
  ok(klassläge({ intjänat: 620000 }, lopp)?.läge === "hög",
    "nära kravtaket: högt i klassen — bland de mest meriterade");
  ok(klassläge({ intjänat: 300000 }, lopp)?.läge === "mitt", "mitt i spannet: mitt i klassen");
  ok(klassläge({ intjänat: 90000 }, lopp)?.läge === "låg",
    "nyss över golvet: lågt i klassen — tufft emot");
  ok(klassläge({ intjänat: 500000 }, { krav: {} }) === null,
    "lopp utan penningkrav: inget märke — meriten ger inget företräde");
  ok(klassläge({ intjänat: 800000 }, { krav: { minInsprunget: 200000 } })?.läge === "hög",
    "öppen klass uppåt: läget mäts mot golvet");
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
