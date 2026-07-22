import { spårfördel } from "./data-lopp.js";

/**
 * Streckprocent bygger på det publiken SER — form, segerprocent, hype,
 * kuskens rykte och spår — aldrig på hästens sanna värden. Det är därför
 * spelaren kan äga information som marknaden saknar.
 */
export function beräknaStreck(fält, spel) {
  /* Spelarna ser inte bara hästen utan hela stallet: hur det gått den
     senaste tiden, och om dina hästar brukar överträffa sina odds.
     Den som skrällt några gånger blir hårdare spelad nästa gång — kanten
     äts upp av att marknaden lär sig dig. */
  const s = typeof spel === "number" ? { spelförtroende: spel } : (spel || {});
  const förtroende = s.spelförtroende ?? 40;
  const stallform = s.stallform ?? 50;
  const marknadsbild = s.marknadsbild ?? 0;

  const poäng = fält.map((h) => {
    const merit = h.starter > 0 ? (h.segrar / h.starter) * 40 : 12;
    const stallbonus = h.egen
      ? (förtroende - 40) * 0.16 + (stallform - 50) * 0.20 + marknadsbild * 9
      : 0;
    return Math.exp(
      (h.form * 0.55 + merit + h.hype * 0.35 + h.kusk.ryktbarhet * 0.3 +
        stallbonus - spårfördel(h.spår, "bil") * 0.4) / 14
    );
  });
  const summa = poäng.reduce((a, b) => a + b, 0);
  fält.forEach((h, i) => (h.streck = (poäng[i] / summa) * 100));
  return fält;
}
