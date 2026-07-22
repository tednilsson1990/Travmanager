import { byggKuskkår } from "./data-namnpaket.js";

/**
 * Kuskkåren är statisk data och byggs ur namnlagret, så att ett licensierat
 * namnpaket kan bytas in utan att röra motorn. Relationen till DIG är
 * speltillstånd och bor i spel.kuskrelation, så att den följer med i
 * sparfilen.
 *
 * krav       = renommé + relation/2 som krävs för att kusken tackar ja
 * ryktbarhet = hur mycket kusken drar streck hos spelarna
 */
export const KUSKAR = byggKuskkår(90);

export const kuskEfterNamn = (namn) => KUSKAR.find((k) => k.namn === namn);
export const relation = (spel, kusk) => spel.kuskrelation[kusk.namn] ?? kusk.startrelation;
export const villig = (spel, kusk) => spel.renommé + relation(spel, kusk) * 0.5 >= kusk.krav;
export const svar = (spel, kusk) => {
  const m = spel.renommé + relation(spel, kusk) * 0.5 - kusk.krav;
  return m >= 12 ? { t: "tackar ja", c: "ja" }
       : m >= 0  ? { t: "tvekar", c: "kanske" }
                 : { t: "tackar nej", c: "nej" };
};
