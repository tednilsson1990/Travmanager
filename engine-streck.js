import { spårfördel } from "./data-lopp.js";
import { rnd } from "./engine-util.js";

/**
 * Streckprocent bygger på det publiken SER — form, segerprocent, hype,
 * kuskens rykte och spår — aldrig på hästens sanna värden. Det är därför
 * spelaren kan äga information som marknaden saknar.
 */
/**
 * Öppningsprocenten: var marknaden STARTADE innan sena pengar kom in.
 * Deterministisk förskjutning ur häst+lopp (hashad, ingen slump — samma
 * lopp visar samma öppning hur ofta vyn än ritas): hypade hästar öppnar
 * högre än de landar (tidiga pengar jagar rubriker), lågt spelade
 * öppnar lägre. Skillnaden mot aktuell procent ÄR trenden spelarna
 * läser — och spelet avslöjar aldrig någon "sann" chans: osäkerhet och
 * felvärdering är travspelets kärna.
 */
function hash01Streck(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

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
  /* Öppningen läggs sist, när aktuell procent är färdignormaliserad —
     och FÖRE return (första insticket hamnade efter return och blev död
     kod: öppningen var undefined och determinismprovet "lyckades" på
     undefined === undefined — därav dubbelkollen mot ett tal nedan i
     provet). */
  for (const h of fält) {
    const drag = (hash01Streck(`${lopp?.id ?? ""}•${h.id}`) - 0.5) * 6;
    const hypeskjuts = ((h.hype ?? 20) - 30) * 0.06;
    h.öppningsstreck = Math.max(0.4, Math.min(96, (h.streck ?? 1) + drag + hypeskjuts));
  }
  return fält;
}
