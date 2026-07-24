/**
 * HÄNDELSEMOTORN — spelets strukturerade minne
 *
 * Allt som betyder något registreras här: typ, betydelse (0–100), aktörer
 * och data. Krönikan (spel.krönika) överlever veckorna — till skillnad
 * från loggen som rensas — och är grunden för säsongskrönikor, mentorns
 * reaktioner, gårdshistorien och framtida berättelsetrådar.
 *
 * Principen: EN registrering, flera reaktioner. Pressen, mentorn och
 * historiken lyssnar på samma händelse i stället för att varje vy hittar
 * på egna texter.
 */
import { skrivPress } from "./engine-vecka.js";

let nästaHändelseId = 1;

export function registreraHändelse(spel, händelse) {
  spel.krönika = spel.krönika ?? [];
  const post = {
    id: `h${nästaHändelseId++}`,
    säsong: spel.säsong ?? 1,
    vecka: spel.vecka,
    betydelse: 50,
    ...händelse,
  };
  spel.krönika.push(post);
  if (spel.krönika.length > 400) spel.krönika = spel.krönika.slice(-400);

  /* Mentorn följer karriären efter pensionen. Hen hör av sig vid det som
     betyder något — sparsamt, så att samtalen fortsätter kännas. */
  const mentor = spel.prolog?.mentor;
  if (mentor && !spel.prolog?.aktiv) {
    if (post.typ === "första_seger")
      spel.logg?.unshift(`<b>${mentor.namn}</b> ringde på kvällen. »Jag såg loppet. Första segern glömmer man aldrig — min kom också på ${post.data?.bana ?? "hemmabanan"}.«`);
    if (post.typ === "storloppsseger")
      skrivPress(spel, `${mentor.namn}: »Nu är gården i bättre händer än mina«`,
        `Den gamle tränaren om stallets storloppstriumf`, "positiv");
    if (post.typ === "gårdsrekord")
      spel.logg?.unshift(`<b>${mentor.namn}</b> hörde av sig: »${post.data?.text ?? "Rekordet"}. Jag hade det i ${post.data?.gammaltÅr ?? "många"} år. Det är rätt att det faller.«`);
  }
  return post;
}

/** Säsongens viktigaste händelser, för krönikan vid säsongsslut. */
export const säsongsHändelser = (spel, säsong) =>
  (spel.krönika ?? []).filter((h) => h.säsong === säsong)
    .sort((a, b) => b.betydelse - a.betydelse);

/**
 * Hästmilstolpar. Anropas efter varje lopp; upptäcker och registrerar
 * första start, första prispeng, första seger, storloppsseger, miljonen
 * och comeback. Milstolparna sparas även på hästen — dess biografi.
 */
export function hästmilstolpar(spel, häst, lopp, min, brutto) {
  häst.milstolpar = häst.milstolpar ?? [];
  const lägg = (typ, betydelse, text, data = {}) => {
    häst.milstolpar.push({ typ, säsong: spel.säsong ?? 1, vecka: spel.vecka, text });
    registreraHändelse(spel, { typ, betydelse, aktörer: { häst: häst.namn },
      data: { lopp: lopp.kortnamn || lopp.namn, bana: lopp.banaNamn, ...data } });
  };
  const har = (typ) => häst.milstolpar.some((m) => m.typ === typ);
  const vann = !min.ur && min.plats === 1;

  if (häst.starter === 1 && !har("första_start"))
    lägg("första_start", 15, `Första starten, ${lopp.kortnamn || lopp.namn}.`);
  if (brutto > 0 && !har("första_prispeng"))
    lägg("första_prispeng", 12, `Första prispengen: ${brutto.toLocaleString("sv-SE")} kr.`);
  if (vann && !har("första_seger"))
    lägg("första_seger", 55, `Första segern, i ${lopp.kortnamn || lopp.namn}.`,
      { favorit: min.streck >= 25 });
  if (vann && lopp.storlopp && !har("storloppsseger"))
    lägg("storloppsseger", 92, `Storloppsseger i ${lopp.kortnamn || lopp.namn}!`);
  if (häst.intjänat >= 1000000 && !har("miljonen"))
    lägg("miljonen", 70, `Passerade miljonen i insprunget.`);
  if (vann && häst.friskVecka != null && spel.vecka - häst.friskVecka <= 3 && !har("comeback_" + häst.friskVecka))
    lägg("comeback_" + häst.friskVecka, 45, `Vann direkt i comebacken efter skadan.`);
}
