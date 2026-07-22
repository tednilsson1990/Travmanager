import { spårfördel } from "./data-lopp.js";
import { rnd } from "./engine-util.js";

/**
 * Streckprocent bygger på det publiken SER — form, segerprocent, hype,
 * kuskens rykte och spår — aldrig på hästens sanna värden. Det är därför
 * spelaren kan äga information som marknaden saknar.
 */
export function beräknaStreck(fält, spel, lopp) {
  /* Spelarna ser inte bara hästen utan hela stallet: hur det gått den
     senaste tiden, och om dina hästar brukar överträffa sina odds.
     Den som skrällt några gånger blir hårdare spelad nästa gång — kanten
     äts upp av att marknaden lär sig dig. */
  const s = typeof spel === "number" ? { spelförtroende: spel } : (spel || {});
  const förtroende = s.spelförtroende ?? 40;
  const stallform = s.stallform ?? 50;
  const marknadsbild = s.marknadsbild ?? 0;
  /* Spårets värde beror på startmetoden — springspår och bakspår i volt
     bedöms helt annorlunda än autostartens led. */
  const startmetod = lopp?.start ?? "bil";

  /* Publiken bedömer hästarna mot VARANDRA, inte mot en absolut skala.
     Poängen standardiseras därför inom loppet och koncentrationen ställs
     med ett enda tal. Utan det blir strecken utsmetade: i verkligheten
     finns ett par tydliga favoriter och en lång svans under tre procent. */
  const rå = fält.map((h) => {
    const merit = h.starter > 0 ? (h.segrar / h.starter) * 100 : 22;
    const stallbonus = h.egen
      ? (förtroende - 40) * 0.16 + (stallform - 50) * 0.20 + marknadsbild * 9
      : 0;
    /* Snittförtjänsten per start är travspelarens viktigaste enskilda
       siffra — den säger mer om klass än segerprocenten, som svänger
       kraftigt på få starter. */
    const perStart = h.starter > 0 ? h.intjänat / h.starter : 8000;
    return h.form * 0.85
      + merit * 0.35
      + Math.min(perStart / 1000, 60) * 1.5
      + h.hype * 0.35
      + (h.kusk?.ryktbarhet ?? 50) * 0.30
      + stallbonus
      - spårfördel(h.spår, startmetod) * 0.5;
  });
  /* Marknadsbrus. Spelarna är inte perfekta: en häst blir överspelad, en
     annan förbisedd. Utan bruset speglar strecken alltid den sanna chansen
     och då finns inget spelvärde att hitta — varken för publiken eller för
     dig som tränare. */
  const brusigt = rå.map((v) => v * (1 + rnd(-0.085, 0.085)));
  const medel = brusigt.reduce((a, b) => a + b, 0) / brusigt.length;
  const spridning = Math.sqrt(
    brusigt.reduce((a, b) => a + (b - medel) ** 2, 0) / brusigt.length
  ) || 1;
  const SKÄRPA = 1.2;
  const poäng = brusigt.map((v) => Math.exp(((v - medel) / spridning) * SKÄRPA));
  const summa = poäng.reduce((a, b) => a + b, 0);
  fält.forEach((h, i) => (h.streck = (poäng[i] / summa) * 100));
  return fält;
}
