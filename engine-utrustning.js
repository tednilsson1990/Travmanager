/**
 * UTRUSTNINGEN — BALANSEN (v138, plan 21.9 / kap 26 E-a)
 *
 * Travets egen "held item"-mekanik, och granskningens unika
 * differentierare: INGET annat spel har skoning. Tre verkliga val
 * inför starten, med verkliga avvägningar:
 *
 *   BARFOTA RUNT OM — snabbare (ungefär sekunden per kilometer i
 *     verkligheten) men känsligare: galopprisken stiger. FÖRBJUDET
 *     PÅ VINTERBANA, precis som i verkligheten.
 *   JÄNKARVAGN — den amerikanska sulkyn rullar lättare: lite fart,
 *     ingen baksida utom hyran (dras på loppdagen).
 *   HUVUDLAPPAR — hästen ser bara framåt: tryggare i trav och
 *     vassare i starten, men vinner ingen fart.
 *
 * ALLT ÄR OPT-IN: utan val är hästen och loppet EXAKT som förut —
 * inga nya slumpkällor, modifierarna läggs på och återställs runt
 * simuleringen. Spelarens verktyg i etapp A; världens hästar kör
 * oförändrat (antecknat).
 */

export const UTRUSTNING = {
  barfota: {
    namn: "Barfota runt om",
    effekt: { fart: 1.6, travsäkerhet: -0.05 },
    kostnad: 0,
    text: "Snabbare — men känsligare. Går inte på vinterbana.",
  },
  jänkarvagn: {
    namn: "Jänkarvagn",
    effekt: { fart: 1.0 },
    kostnad: 900,
    text: "Rullar lättare. Hyran dras på loppdagen.",
  },
  huvudlappar: {
    namn: "Huvudlappar",
    effekt: { travsäkerhet: 0.04, start: 1 },
    kostnad: 0,
    text: "Ser bara framåt: tryggare trav, vassare start.",
  },
};

/** Vinterbana: säsongens tre första och tre sista veckor (23 C). */
export const vinterbana = (spel) =>
  (spel.vecka ?? 1) <= 3 || (spel.vecka ?? 1) >= (spel.veckor ?? 18) - 2;

/**
 * Räknar ihop balansen ur hästens val. Barfota stryks på vinterbana
 * — med orsaken tillbaka till UI:t (v98-principen: orsaken nära).
 */
export function sättBalans(häst, spel) {
  const val = häst.balansVal ?? {};
  const vinter = vinterbana(spel);
  const spärrar = [];
  const balans = { fart: 0, travsäkerhet: 0, start: 0, kostnad: 0, delar: [] };
  Object.entries(UTRUSTNING).forEach(([id, u]) => {
    if (!val[id]) return;
    if (id === "barfota" && vinter) { spärrar.push("Barfota är förbjudet på vinterbana — skor på."); return; }
    balans.fart += u.effekt.fart ?? 0;
    balans.travsäkerhet += u.effekt.travsäkerhet ?? 0;
    balans.start += u.effekt.start ?? 0;
    balans.kostnad += u.kostnad ?? 0;
    balans.delar.push(u.namn);
  });
  häst.balans = balans.delar.length ? balans : null;
  return { balans: häst.balans, spärrar };
}

/** Loppet är kört — balansen gäller en start i taget. */
export function släppBalans(häst) {
  häst.balans = null;
}
