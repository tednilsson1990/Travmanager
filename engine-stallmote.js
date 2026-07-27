/**
 * STALLMÖTET OCH VECKOSLOTSEN (v84, plan 4.1)
 *
 * En travtränares vecka är inte oändlig. Snabbjobb, intervaller och
 * startträning kräver banan, personalen och förmiddagen — man hinner ett
 * begränsat antal krävande pass per vecka, och resten av stallet får
 * lugnt jobb eller vila. Det är stallmötets kärna: VILKA hästar får
 * veckans hårda pass?
 *
 * Slotsen byggs av organisationen, aldrig av loppmotorn (designgränsen
 * från v51 gäller): grunden är tre pass, egen rakbana och träningsbacke
 * ger ett var — anläggningen gör hårda pass billigare att organisera —
 * och en förstaman leder ett pass själv.
 *
 * Spelet FÖRBJUDER inte överplanering i datat (äldre sparfiler kan ha
 * fler), utan verkställer vid veckokörningen: överskottet flyttas ned
 * till lugnt jobb med besked i rapporten. Gränssnittet hindrar dessutom
 * nya överdrag genom att stänga chipsen när veckan är full.
 */
/** Passen som kräver bana, personal och förmiddag — nycklarna i TRÄNING. */
export const KRÄVANDE_PASS = ["start", "intervall", "kvalitet"];

export const ärKrävande = (träning) => KRÄVANDE_PASS.includes(träning);

/** Hur många krävande pass organisationen orkar den här veckan. */
export function veckoslots(spel) {
  const a = spel.anläggning ?? {};
  let slots = 3;
  if (a.rakbana) slots += 1;
  if (a.backe) slots += 1;
  if (spel.förstaman) slots += 1;
  return slots;
}

/** Hur många krävande pass som ligger i veckans plan just nu. */
export function slotsAnvända(spel) {
  return spel.stall.filter((h) => h.skada === 0 && ärKrävande(h.träning)).length;
}

/**
 * Verkställer slotsgränsen vid veckokörningen. Överskottet — räknat i
 * stallordning, samma ordning spelaren ser — flyttas ned till lugnt jobb.
 * Returnerar vilka som flyttades så rapporten kan berätta det.
 */
export function verkställVeckoslots(spel) {
  const slots = veckoslots(spel);
  let kvar = slots;
  const nedflyttade = [];
  spel.stall.forEach((h) => {
    if (h.skada > 0 || !ärKrävande(h.träning)) return;
    if (kvar > 0) { kvar--; return; }
    nedflyttade.push(h.namn);
    h.träning = "lugnt";
  });
  return { slots, nedflyttade };
}

/**
 * Förstamannens plan, lagd inom veckans slots. Hen prioriterar hästarna
 * med störst behov — lägst form först — och ger resten lugnt jobb när
 * slotsen är slut. Rådet i sig kommer från engine-forstaman; här läggs
 * bara veckans verklighet ovanpå.
 */
export function läggPlanMedSlots(spel, träningsråd) {
  if (!spel.förstaman) return;
  let kvar = veckoslots(spel);
  const friska = spel.stall.filter((h) => h.skada === 0);
  [...friska].sort((a, b) => a.form - b.form).forEach((h) => {
    const råd = träningsråd(spel.förstaman, h).träning;
    if (!ärKrävande(råd)) { h.träning = råd; return; }
    if (kvar > 0) { kvar--; h.träning = råd; }
    else h.träning = "lugnt";
  });
}
