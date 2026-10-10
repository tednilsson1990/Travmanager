/**
 * PROV — GÅRDSKARTAN (v122, kapitel 23: Theme Park-loopen)
 *
 * Mark → byggrätt → bygg. Marken kostar mer för varje köp och tar
 * slut vid taket, byggrätterna räknas ärligt, bygget nekas utan mark
 * OCH utan pengar, och äldre sparfiler med mer byggt än marken rymmer
 * får marken på köpet — historien skrivs inte om.
 */
import { säkraGård, köpMark, byggPåGården, byggrätter, markpris,
  TOMTER_START, TOMTER_MAX, nyAnläggning } from "./engine-gard.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: gårdskartan\n");

const nytt = (kassa = 500000) => ({ kassa, stallnamn: "Provgården",
  anläggning: { ...nyAnläggning() }, stall: [], press: [], vecka: 3, säsong: 1 });

{
  const spel = nytt();
  säkraGård(spel);
  ok(spel.gård.tomter === TOMTER_START && byggrätter(spel) === 2,
    "gården börjar med två byggrätter");

  ok(byggPåGården(spel, "rakbana") && byggPåGården(spel, "backe"),
    "två byggen ryms på starttomterna");
  ok(byggrätter(spel) === 0 && !byggPåGården(spel, "vattenband"),
    "tredje bygget nekas — marken är slut, inte pengarna");
  ok(spel.anläggning.vattenband !== true && spel.kassa === 500000 - 80000 - 60000,
    "nekat bygge rör varken anläggning eller kassa");

  const pris1 = markpris(spel);
  ok(köpMark(spel) && spel.gård.tomter === 4 && byggrätter(spel) === 2,
    "markköpet ger två tomter till");
  ok(markpris(spel) === pris1 + 60000, "nästa markbit kostar mer");
  ok(byggPåGården(spel, "vattenband") && spel.anläggning.vattenband === true,
    "med ny mark går bygget igenom — samma bygg() som förut äger effekten");
  ok(spel.press.some((p) => p.rubrik.includes("köper mark")),
    "pressen skriver om markköpet");

  spel.gård.tomter = TOMTER_MAX;
  ok(!köpMark(spel), "vid tomttaket säljs ingen mer mark — en gård, inte ett industriområde");

  const pank = nytt(1000);
  ok(!köpMark(pank) && pank.gård.tomter === TOMTER_START,
    "utan pengar ingen mark");
}

{
  /* Migreringen: tre byggda men gammal sparfil utan gård. */
  const spel = nytt();
  spel.anläggning.rakbana = spel.anläggning.backe = spel.anläggning.vattenband = true;
  säkraGård(spel);
  ok(spel.gård.tomter === 3 && byggrätter(spel) === 0,
    "äldre sparfil: marken följer det redan byggda");
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
