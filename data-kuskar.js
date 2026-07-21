/**
 * Kuskkåren är statisk data. Relationen till DIG är speltillstånd och bor i
 * spel.kuskrelation, så att den följer med i sparfilen.
 * krav       = renommé + relation/2 som krävs för att kusken tackar ja
 * ryktbarhet = hur mycket kusken drar streck hos spelarna
 */
export const KUSKAR = [
  { namn: "E. Lindblom", start: 82, taktik: 78, avslutning: 80, kyla: 74, ryktbarhet: 92, arvode: 4000, andel: 0.08, krav: 64, startrelation: 18 },
  { namn: "A. Sjöqvist", start: 88, taktik: 60, avslutning: 74, kyla: 56, ryktbarhet: 81, arvode: 3200, andel: 0.07, krav: 52, startrelation: 24 },
  { namn: "M. Hägg", start: 64, taktik: 87, avslutning: 71, kyla: 84, ryktbarhet: 79, arvode: 3000, andel: 0.07, krav: 50, startrelation: 26 },
  { namn: "P. Ranta", start: 55, taktik: 63, avslutning: 89, kyla: 70, ryktbarhet: 74, arvode: 2800, andel: 0.07, krav: 44, startrelation: 30 },
  { namn: "T. Wiik", start: 71, taktik: 74, avslutning: 78, kyla: 62, ryktbarhet: 68, arvode: 2600, andel: 0.07, krav: 38, startrelation: 34 },
  { namn: "H. Öberg", start: 66, taktik: 69, avslutning: 64, kyla: 72, ryktbarhet: 60, arvode: 2200, andel: 0.06, krav: 32, startrelation: 38 },
  { namn: "S. Åkerlund", start: 73, taktik: 70, avslutning: 66, kyla: 66, ryktbarhet: 57, arvode: 2000, andel: 0.06, krav: 27, startrelation: 42 },
  { namn: "L. Frisk", start: 58, taktik: 66, avslutning: 70, kyla: 75, ryktbarhet: 52, arvode: 1800, andel: 0.06, krav: 22, startrelation: 45 },
  { namn: "R. Toivonen", start: 69, taktik: 55, avslutning: 61, kyla: 54, ryktbarhet: 48, arvode: 1600, andel: 0.05, krav: 18, startrelation: 48 },
  { namn: "N. Ekvall", start: 52, taktik: 61, avslutning: 63, kyla: 69, ryktbarhet: 44, arvode: 1400, andel: 0.05, krav: 14, startrelation: 50 },
  { namn: "K. Norell", start: 60, taktik: 58, avslutning: 57, kyla: 81, ryktbarhet: 41, arvode: 1200, andel: 0.05, krav: 10, startrelation: 52 },
  { namn: "V. Malm", start: 57, taktik: 54, avslutning: 55, kyla: 60, ryktbarhet: 36, arvode: 1100, andel: 0.05, krav: 6, startrelation: 54 },
  { namn: "C. Storm", start: 63, taktik: 47, avslutning: 52, kyla: 45, ryktbarhet: 33, arvode: 1000, andel: 0.05, krav: 4, startrelation: 55 },
  { namn: "D. Sandin", start: 50, taktik: 53, avslutning: 54, kyla: 63, ryktbarhet: 29, arvode: 900, andel: 0.05, krav: 0, startrelation: 56 },
  { namn: "B. Ahl", start: 46, taktik: 50, avslutning: 49, kyla: 58, ryktbarhet: 24, arvode: 800, andel: 0.05, krav: 0, startrelation: 58 },
  { namn: "J. Bergvall", start: 44, taktik: 48, avslutning: 47, kyla: 51, ryktbarhet: 20, arvode: 700, andel: 0.05, krav: 0, startrelation: 60 },
];

export const kuskEfterNamn = (namn) => KUSKAR.find((k) => k.namn === namn);
export const relation = (spel, kusk) => spel.kuskrelation[kusk.namn] ?? kusk.startrelation;
export const villig = (spel, kusk) => spel.renommé + relation(spel, kusk) * 0.5 >= kusk.krav;
export const svar = (spel, kusk) => {
  const m = spel.renommé + relation(spel, kusk) * 0.5 - kusk.krav;
  return m >= 12 ? { t: "tackar ja", c: "ja" }
       : m >= 0  ? { t: "tvekar", c: "kanske" }
                 : { t: "tackar nej", c: "nej" };
};
