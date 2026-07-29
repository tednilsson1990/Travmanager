/**
 * KONTINUITETSMINNET (v104, utvecklingsplanen 20.2 — FM-punkt 1:
 * "allt kommer ihåg")
 *
 * Teds insikt: spelet VET redan mycket — resultatrader, rivaliteter,
 * loppnamn — men REFERERAR aldrig till det. Den här motorn är ren
 * läsning av det som redan sparas, formulerad som kontextrader:
 * "din 100:e seger om ni vinner i dag", "förra gången ni möttes vann
 * Stormvind", "hon var trea i det här loppet i fjol". Raderna
 * injiceras där de gör story: lottningen (inför), efteranalysen
 * (efter) och inkorgen (milstolpen som närmar sig).
 *
 * KARRIÄRTOTALERNA börjar räknas nu: spel.karriär { starter, segrar,
 * prispengar, storloppssegrar } skrivs i efterLopp, och äldre karriärer
 * får en ÄRLIG grundplåt ur de nuvarande hästarnas resultatrader —
 * sålda hästars starter saknas och det låtsas vi inte om (hellre en
 * försiktig siffra än en påhittad). spel.loppfacit { kortnamn →
 * { säsong, häst, plats } } minns stallets bästa insats per lopp, så
 * "ni vann det här i fjol" fungerar även när hästen är en annan.
 *
 * Inget slumpas, inget simuleras — motorn läser och formulerar.
 */

/** Karriärtotalerna — grundas ur befintliga rader första gången. */
export function säkraKarriär(spel) {
  if (spel.karriär) return spel.karriär;
  const grund = { starter: 0, segrar: 0, prispengar: 0, storloppssegrar: 0 };
  (spel.stall ?? []).forEach((h) => {
    grund.starter += h.starter ?? 0;
    (h.resultat ?? []).forEach((r) => { if (r.plats === 1) grund.segrar++; });
    grund.prispengar += h.intjänat ?? 0;
  });
  spel.karriär = grund;
  return grund;
}

/** Nästa jämna milstolpe för ett antal segrar (FM-punkt 9 i frö). */
export function nästaMilstolpe(segrar) {
  const stolpar = [1, 10, 25, 50, 100, 250, 500, 1000, 2500];
  return stolpar.find((m) => m > segrar) ?? Math.ceil((segrar + 1) / 1000) * 1000;
}

/**
 * Kontextraderna inför ett lopp — max tre, viktigast först:
 * milstolpen (störst laddning), rivalmötet, loppminnet.
 */
export function minnenInförLopp(spel, häst, lopp, fält = []) {
  const rader = [];
  const karriär = säkraKarriär(spel);
  const namn = lopp.kortnamn || lopp.namn;

  /* Milstolpen: en seger i dag är en jämn siffra. */
  const stolpe = nästaMilstolpe(karriär.segrar);
  if (karriär.segrar + 1 === stolpe && stolpe >= 10) {
    rader.push(`En seger i dag blir stallets ${stolpe}:e — siffran alla i stallet känner till.`);
  } else if (karriär.segrar === 0) {
    rader.push(`Stallet jagar fortfarande sin första seger. Den här dagen kan bli den man minns.`);
  }

  /* Rivalmötet: någon i fältet med gemensam historia. */
  const rivaler = Object.values(spel.rivaliteter ?? {});
  for (const s of fält) {
    if (s === häst) continue;
    const r = rivaler.find((x) => x.hästId === häst.id && x.rivalNamn === s.namn);
    if (r && r.möten >= 2) {
      const ställning = `${r.dinaSegrar}–${r.hansSegrar}`;
      const senast = r.senastVann === "du" ? `Senast vann ${häst.namn}.`
        : r.senastVann === "rival" ? `Senast vann ${r.rivalNamn}.` : "";
      rader.push(`Möte ${r.möten + 1} med ${r.rivalNamn}. Ställningen: ${ställning}. ${senast}`.trim());
      break;
    }
  }

  /* Loppminnet: hästens egen rad i samma lopp, eller stallets facit. */
  const egen = (häst.resultat ?? []).find((r) => r.lopp === namn && r.plats);
  if (egen) {
    rader.push(egen.plats === 1
      ? `${häst.namn} har vunnit det här loppet förut — banan och avstånden sitter i kroppen.`
      : `${häst.namn} var ${egen.plats}:a i det här loppet senast. Revanschen ligger framdukad.`);
  } else {
    const facit = spel.loppfacit?.[namn];
    if (facit && facit.plats === 1 && facit.häst !== häst.namn) {
      rader.push(`Stallet vann det här loppet säsong ${facit.säsong} med ${facit.häst}. Nu är det ${häst.namn}s tur.`);
    }
  }

  return rader.slice(0, 3);
}

/**
 * Bokföringen efter loppet — anropas ur efterLopp (engine-vecka) med
 * utfallet. Returnerar eventuell karriärminnesrad till sammanfattningen.
 */
export function bokförKarriär(spel, { vann, brutto, lopp, häst, plats }) {
  const karriär = säkraKarriär(spel);
  karriär.starter++;
  karriär.prispengar += brutto ?? 0;
  if (vann) {
    karriär.segrar++;
    if (lopp.storlopp) karriär.storloppssegrar++;
  }
  /* Loppfacit: stallets bästa insats per lopp. */
  const namn = lopp.kortnamn || lopp.namn;
  if (plats && (!spel.loppfacit?.[namn] || plats < spel.loppfacit[namn].plats)) {
    (spel.loppfacit ??= {})[namn] = { säsong: spel.säsong ?? 1, häst: häst.namn, plats };
  }
  if (vann) {
    const s = karriär.segrar;
    if (s === 1) return `Stallets FÖRSTA seger. Den här dagen har ett datum nu.`;
    if ([10, 25, 50, 100, 250, 500, 1000].includes(s)) return `Stallets ${s}:e seger — en siffra att skåla i.`;
    if (lopp.storlopp && karriär.storloppssegrar === 1) return `Stallets första storloppsseger. Allt före i dag var uppladdning.`;
  }
  return null;
}
