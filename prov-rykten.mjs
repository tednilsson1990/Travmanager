/**
 * PROV — RYKTENA (v139, 20.6: inte alltid sanna)
 *
 * Sanningens förankring är löftet: ett sant rykte pekar på en kusk
 * som generationsmaskinen FAKTISKT pensionerar, ett falskt på en som
 * kör vidare — och facit vid skiftet säger rätt sak om rätt person.
 * Hash-avgjort: samma karriär, samma viskningar.
 */
import { väckRykten, avgörRykten } from "./engine-rykten.js";
import { kuskålder, utvecklaVärlden } from "./engine-varldsutveckling.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: ryktena\n");

const nytt = () => ({ säsong: 4, vecka: 1, veckor: 18, stallnamn: "P",   /* säsong 1 KAN inte ha sanna pensionsrykten — ingen fyller 58 så tidigt (v111) */
  sponsorer: [], press: [], rykten: [] });

{
  const spel = nytt();
  for (let v = 1; v <= 18; v++) { spel.vecka = v; väckRykten(spel); }
  ok(spel.rykten.length >= 3 && spel.rykten.length <= 9,
    `en säsong viskar lagom (${spel.rykten.length} rykten på 18 veckor)`);
  ok(spel.rykten.every((r) => r.sant
    ? kuskålder(r.namn, 5) >= 58
    : kuskålder(r.namn, 5) < 54),
    "sanningen är förankrad: sanna rykten pekar på verkliga pensionskandidater");

  const spel2 = nytt();
  for (let v = 1; v <= 18; v++) { spel2.vecka = v; väckRykten(spel2); }
  ok(JSON.stringify(spel2.rykten.map((r) => r.namn)) === JSON.stringify(spel.rykten.map((r) => r.namn)),
    "hash-avgjort: samma karriär, samma viskningar");

  /* Facit: kör generationsmaskinen och avgör. */
  spel.säsong = 5;
  utvecklaVärlden(spel);
  const ryktenFacit = [...spel.rykten];
  const press = avgörRykten(spel);
  ok(press.length >= spel.rykten.length === false || press.length > 0,
    `facit vid skiftet: ${press.length} rykten avgjorda i pressen`);
  const stämde = press.filter((p) => p.rubrik.startsWith("Ryktet stämde"));
  const dementier = press.filter((p) => p.rubrik.includes("Jag kör vidare"));
  ok(stämde.length + dementier.length === press.length && press.length > 0,
    `varje rykte får ett slut: ${stämde.length} bekräftade, ${dementier.length} dementerade`);
  /* Kärnlöftet: sant rykte → bekräftelse, falskt → dementi. */
  ok(ryktenFacit.every((r) => (r.sant && r.utfall === "stämde") || (!r.sant && r.utfall === "dementi")),
    "facit träffar rätt person: sanna bekräftas, falska dementeras");
  const santFanns = ryktenFacit.some((r) => r.sant);
  ok(santFanns, "minst ett sant rykte uppstod — sanningens väg är provad");
  ok((spel.rykten ?? []).every((r) => !r.avgjort),
    "avgjorda rykten lämnar listan — nya säsonger, nya viskningar");
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
