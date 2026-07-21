import { spårfördel } from "./data-lopp.js";

/**
 * Streckprocent bygger på det publiken SER — form, segerprocent, hype,
 * kuskens rykte och spår — aldrig på hästens sanna värden. Det är därför
 * spelaren kan äga information som marknaden saknar.
 */
export function beräknaStreck(fält, spelförtroende) {
  const poäng = fält.map((h) => {
    const merit = h.starter > 0 ? (h.segrar / h.starter) * 40 : 12;
    const stallbonus = h.egen ? (spelförtroende - 40) * 0.22 : 0;
    return Math.exp(
      (h.form * 0.55 + merit + h.hype * 0.35 + h.kusk.ryktbarhet * 0.3 +
        stallbonus - spårfördel(h.spår, "bil") * 0.4) / 14
    );
  });
  const summa = poäng.reduce((a, b) => a + b, 0);
  fält.forEach((h, i) => (h.streck = (poäng[i] / summa) * 100));
  return fält;
}
