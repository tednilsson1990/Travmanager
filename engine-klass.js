/**
 * KLASSTRAPPAN (v116, Pokémon-inspirationen 21.8: "levels — lättare
 * för spelaren att förstå när man ska välja lopp")
 *
 * Travet har redan levels på riktigt: KLASSYSTEMET. Insprungna pengar
 * är hästens XP och Brons → Silver → Guld är levelkurvan — spelet har
 * bara aldrig VISAT det. Två läsningar, båda rena:
 *
 * klassnivå(häst): brickan och mätaren — "SILVER II, 84 000 kr till
 * SILVER I". Stegen inom varje klass (III → II → I) är tredjedelar av
 * klassens spann, som gradbeteckningar.
 *
 * klassläge(häst, lopp): det en travtränare faktiskt tittar på i
 * propositionen — VAR I KRAVSPANNET hästen ligger. Högt i klassen =
 * bland de mest meriterade i loppet (bra läge). Lågt = nyuppflyttad,
 * tufft emot. Det är Pokémons "rätt level för rutten", travärligt.
 *
 * Gränserna kommer ur kalenderns verkliga seriekrav (Bronsserien tar
 * emot upp till 250 000, Silverserien till 700 000, Guldserien däröver).
 */

export const KLASSTRAPPA = [
  { namn: "Brons", från: 0, till: 250000 },
  { namn: "Silver", från: 250000, till: 700000 },
  { namn: "Guld", från: 700000, till: 2800000 },
];

const STEGNAMN = ["III", "II", "I"];

/** Hästens klassbricka: { klass, steg, etikett, nästa, kvar, andel }. */
export function klassnivå(häst) {
  const p = häst.intjänat ?? 0;
  const trappsteg = KLASSTRAPPA.find((k) => p < k.till) ?? KLASSTRAPPA[KLASSTRAPPA.length - 1];
  const i = KLASSTRAPPA.indexOf(trappsteg);
  const spann = trappsteg.till - trappsteg.från;
  const inne = Math.min(Math.max(p - trappsteg.från, 0), spann);
  const stegIndex = Math.min(2, Math.floor((inne / spann) * 3));
  const stegTak = trappsteg.från + (spann / 3) * (stegIndex + 1);
  const sista = i === KLASSTRAPPA.length - 1 && stegIndex === 2;
  const nästa = sista ? null
    : stegIndex === 2 ? `${KLASSTRAPPA[i + 1].namn} ${STEGNAMN[0]}`
    : `${trappsteg.namn} ${STEGNAMN[stegIndex + 1]}`;
  return {
    klass: trappsteg.namn,
    steg: STEGNAMN[stegIndex],
    etikett: `${trappsteg.namn} ${STEGNAMN[stegIndex]}`,
    nästa,
    kvar: sista ? 0 : Math.max(0, Math.round(stegTak - p)),
    andel: Math.min(1, (inne % (spann / 3)) / (spann / 3)),
  };
}

/**
 * Hästens läge i ett lopps kravspann. Returnerar null när loppet
 * saknar penningkrav (öppen klass — meriten avgör inget företräde).
 */
export function klassläge(häst, lopp) {
  const krav = lopp.krav ?? {};
  const min = krav.minInsprunget ?? 0;
  const max = krav.maxInsprunget ?? null;
  const p = häst.intjänat ?? 0;
  if (max == null) {
    if (!krav.minInsprunget) return null;
    /* Öppna klasser uppåt: läget mäts mot golvet. */
    const över = p / Math.max(1, min);
    return över >= 2.2
      ? { läge: "hög", text: "Högt i klassen — bland de mest meriterade" }
      : över >= 1.35
        ? { läge: "mitt", text: "Mitt i klassen" }
        : { läge: "låg", text: "Lågt i klassen — nyuppflyttad, tufft emot" };
  }
  const andel = (p - min) / Math.max(1, max - min);
  return andel >= 0.72
    ? { läge: "hög", text: "Högt i klassen — bland de mest meriterade" }
    : andel >= 0.3
      ? { läge: "mitt", text: "Mitt i klassen" }
      : { läge: "låg", text: "Lågt i klassen — nyuppflyttad, tufft emot" };
}
