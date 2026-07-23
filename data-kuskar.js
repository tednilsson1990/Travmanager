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

/* ==================== Uppbokade kuskar ==================== */

/**
 * En kusk kan vara uppbokad av ett annat stall i just det loppet — då hjälper
 * varken renommé eller pengar, hen sitter redan i en annan sulky.
 *
 * Avgörs DETERMINISTISKT av (säsong, vecka, lopp, kusk) via en hash, inte av
 * slump(). Två skäl: samma fråga måste ge samma svar hur många gånger vyn än
 * ritas om — annars blinkar kusken mellan ledig och uppbokad — och slump()
 * får inte förbrukas i gränssnittet, för då tappar kalibreringens seedade
 * körningar sin reproducerbarhet.
 *
 * Elitkuskarna är mest eftertraktade och därför oftast tagna: ryktbarhet 90
 * ger runt 45 % risk, ryktbarhet 20 runt 10 %. En god relation gör att kusken
 * håller sig ledig för din skull — vid relation 80 halveras risken. Att samma
 * kusk är uppbokad i ett lopp men ledig i nästa är precis poängen: ibland är
 * rätt drag att byta lopp i stället för kusk.
 */
function hash01(text) {
  let h = 2166136261;
  for (const tecken of text) {
    h ^= tecken.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

export function uppbokad(spel, kusk, lopp) {
  const risk = (0.05 + (kusk.ryktbarhet / 100) * 0.44)
             * (1 - relation(spel, kusk) / 160);
  return hash01(`${spel.säsong ?? 1}:${spel.vecka}:${lopp.id}:${kusk.namn}`) < risk;
}

/** Kuskarna som är uppbokade i ett visst lopp, för fältbygget och vyn. */
export const uppbokadeI = (spel, lopp) => KUSKAR.filter((k) => uppbokad(spel, k, lopp));
