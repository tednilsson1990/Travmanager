/**
 * KLOCKAN (v101, utvecklingsplanen 20.1 — Teds tidsidé, etapp A)
 *
 * "Det behöver inte vara nästa vecka man hoppar fram — kanske en dag,
 * beroende på vad som händer." Veckan FÖRBLIR motorernas ryggrad (allt
 * är veckonycklat; en riktig dygnsklocka vore en omskrivning), men
 * veckan får STOPP, och knappen är inte "Kör veckan" utan HOPPA FRAM —
 * till nästa stopp som har något åt dig. Tomma stopp slås ihop.
 *
 * STOPPEN:
 *   måndag — veckans start: inkorgen, träningen, stallmötet, marknaden.
 *            Anmälningarna är ÖPPNA: du skickar in, det kostar inget,
 *            och du får vänta på beskedet. Spänningen bor i väntan.
 *   onsdag — uttagningsbeskeden: överanmält? struken? delat? Kuskens
 *            bekräftelse eller avhopp. Bara om anmälningar finns.
 *   helg   — loppdagarna: lottning, kusksamtal, loppen. Bara om någon
 *            anmälan kom med.
 *
 * Hoppet förbi veckans sista meningsfulla stopp kör veckoväxlingen
 * (körVecka — orörd) och landar på nästa måndag, i inkorgen.
 *
 * TILLSTÅNDET: spel.stopp ("måndag"|"onsdag"|"helg", äldre sparfiler
 * utan fältet läses som måndag) och spel.anmälningar — listan av
 * inskickade anmälningar { hästId, loppId, kuskNamn, status? } där
 * status sätts vid beskedet ("med" | "avstod") och loppet prickas av
 * mot spel.startadeLopp när det körts. Oanvända anmälningar förfaller
 * vid veckoväxlingen — ett lopp man inte red färdigt är ett lopp som
 * gick utan en.
 */
import { körVecka } from "./engine-vecka.js";

export const STOPPNAMN = { "måndag": "måndag", "onsdag": "onsdag", "helg": "helgen" };

export const stoppFör = (spel) => spel.stopp ?? "måndag";

/** Har onsdagen något åt spelaren? Obesvarade anmälningar. */
const onsdagHarInnehåll = (spel) =>
  (spel.anmälningar ?? []).some((a) => !a.status);

/** Har helgen något? Anmälningar som kom med och inte körts. */
const helgHarInnehåll = (spel) =>
  (spel.anmälningar ?? []).some((a) => a.status === "med"
    && !(spel.startadeLopp ?? []).includes(a.loppId));

/**
 * Nästa stopp med innehåll — eller veckoväxlingen. Returnerar
 * { mål: "onsdag"|"helg"|"vecka", etikett } där etiketten är
 * hoppknappens text.
 */
export function nästaStopp(spel) {
  const nu = stoppFör(spel);
  if (nu === "måndag" && onsdagHarInnehåll(spel))
    return { mål: "onsdag", etikett: "Hoppa fram → onsdag: uttagningsbeskeden" };
  if (nu !== "helg" && helgHarInnehåll(spel))
    return { mål: "helg", etikett: "Hoppa fram → helgen: loppdag" };
  /* Ärlig varning: hoppet förbi obesvarade besked eller okörda lopp
     låter dem förfalla — det ska stå på knappen, inte upptäckas efteråt. */
  if (onsdagHarInnehåll(spel) || helgHarInnehåll(spel))
    return { mål: "vecka", etikett: "Hoppa fram → ny vecka (väntande starter förfaller)" };
  return { mål: "vecka", etikett: "Hoppa fram → ny vecka" };
}

/** Verkställ hoppet. Muterar spelet; veckoväxlingen är befintliga körVecka. */
export function hoppaFram(spel, kör = körVecka) {
  const steg = nästaStopp(spel);
  if (steg.mål === "vecka") {
    kör(spel);
    spel.anmälningar = [];
    spel.stopp = "måndag";
  } else {
    spel.stopp = steg.mål;
  }
  return steg.mål;
}
