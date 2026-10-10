/**
 * NÄSTA MÅL-RADEN (v133, kap 26 B-e — kap 16-dokumentets Nästa
 * steg-panel möter Pokémons "nästa gym", genom partymenyprovet:
 * EN rad, alltid synlig, alltid klickbar.
 *
 * Spelaren ska alltid kunna svara på "vad är nästa naturliga steg?"
 * Raden väljer det VIKTIGASTE just nu, i fast prioritetsordning —
 * deterministisk läsning av spelet, ingen slump, inget minne.
 * Principen ur kapitel 16: intelligenta rekommendationer, aldrig
 * uppdrag — raden pekar, den kräver inget.
 */
import { klassnivå } from "./engine-klass.js";
import { SERIENAMN, serietabell, finalkandidater } from "./engine-serie.js";
import { byggrätter } from "./engine-gard.js";
import { invalsläge } from "./engine-sallskap.js";
import { stoppFör } from "./engine-klocka.js";
import { kr } from "./engine-util.js";

export function nästaMål(spel) {
  const stall = spel.stall ?? [];
  const friska = stall.filter((h) => h.skada === 0);
  const stopp = stoppFör(spel);
  const sistaVeckan = (spel.vecka ?? 1) === (spel.veckor ?? 18);

  /* 1. Finalen — säsongens klimax går före allt. */
  if (sistaVeckan) {
    for (const serie of SERIENAMN) {
      const kand = finalkandidater(spel, serie);
      if (kand.length < 6) continue;
      const egen = stall.find((h) => kand.includes(h.namn));
      if (egen) return { text: `Finalhelg — ${egen.namn} är kvalad i ${serie}`, flik: "lopp" };
    }
  }

  /* 2. Obesvarade onsdagsbesked — klockan står still tills du svarat. */
  if (stopp === "onsdag" && (spel.anmälningar ?? []).some((a) => !a.status)) {
    return { text: "Onsdagens uttagningsbesked väntar på svar", flik: "lopp" };
  }

  /* 3. Skadefri häst nära ett klasskliv — Pokémons nästa level. */
  const nära = friska
    .map((h) => ({ h, kn: klassnivå(h) }))
    .filter((x) => x.kn.nästa && x.kn.kvar > 0 && x.kn.kvar <= 30000)
    .sort((a, b) => a.kn.kvar - b.kn.kvar)[0];
  if (nära) return { text: `${nära.h.namn}: ${kr(nära.kn.kvar)} kr till ${nära.kn.nästa}`, flik: "stall" };

  /* 4. Egen häst i serietoppen — trappan är öppen. */
  if (!sistaVeckan) {
    for (const serie of SERIENAMN) {
      const tabell = serietabell(spel, serie).slice(0, 3);
      const i = tabell.findIndex((r) => r.egen);
      if (i >= 0) return { text: `${tabell[i].namn} ligger ${i + 1}:a i ${serie} — finalen hägrar`, flik: "sfar" };
    }
  }

  /* 5. Valberedningen väntar på besked. */
  if (invalsläge(spel).kvalar) {
    return { text: "Travsällskapet söker en ledamot — valberedningen väntar", flik: "inkorg" };
  }

  /* 6. En tom tomt och pengar på banken. */
  if ((spel.anläggning) && byggrätter(spel) > 0 && (spel.kassa ?? 0) > 90000) {
    return { text: "En ledig tomt på gården — och kassan räcker till ett bygge", flik: "gård" };
  }

  /* 7. Måndagens grundärende. */
  if (stopp === "måndag" && friska.some((h) => (h.energi ?? 0) > 55)
    && !(spel.anmälningar ?? []).length) {
    return { text: "Anmälningarna är öppna — veckans propositioner väntar", flik: "lopp" };
  }

  /* 8. Vilan är också ett besked. */
  return { text: "Stallet sköter sig — kör veckan när du är redo", flik: "inkorg" };
}
