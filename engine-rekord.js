/**
 * REKORDEN OCH SÄSONGSKRÖNIKAN — stallets långa minne
 *
 * Gårdsrekordet (segrar på en säsong) ärvdes från mentorn och har funnits
 * sedan v52. Här bor resten av det långa minnet: rekordtavlan genom
 * tiderna, hall of fame över de största hästarna, och den SKRIVNA
 * säsongskrönikan — krönikörens bokslut som sparas per säsong och kan
 * läsas år senare i Stalljournalen.
 *
 * Rekord jämförs bara där jämförelsen är ärlig: segertider som km-tid
 * (normaliserad per kilometer) och enbart vid seger — en tvåas tid i ett
 * uppdrivet lopp är ingen notering. DESIGNGRÄNS: allt här LÄSER lopp som
 * redan avgjorts. Ingen slump, inget som rör motorn.
 */
import { kr } from "./engine-util.js";
import { registreraHändelse } from "./engine-handelser.js";
import { JOURNALISTER } from "./data-namnpaket.js";

/* ------------------------------------------------------------------ */
/* Rekordtavlan                                                        */
/* ------------------------------------------------------------------ */

/**
 * Efter varje lopp: föll en notering? Rekorden bär sitt sammanhang —
 * häst, lopp, säsong — för en siffra utan berättelse är bara en siffra.
 * Första noteringen någonsin registreras tyst (allt är rekord när tavlan
 * är tom); först när ett RIKTIGT rekord faller blir det press.
 */
export function uppdateraRekordEfterLopp(spel, { häst, lopp, min, brutto, fakta, skrivPress }) {
  if (min.ur || min.plats !== 1) return;
  spel.rekord = spel.rekord ?? {};
  const r = spel.rekord;
  const när = { säsong: spel.säsong ?? 1, vecka: spel.vecka };
  /* skrivPress skickas in som argument — importcirkeln rekord → vecka →
     rekord undviks utan tillstånd på spelobjektet. */

  const slog = (nyckel, värde, bättre, text) => {
    const gammalt = r[nyckel];
    if (gammalt && !bättre(värde, gammalt.värde)) return;
    r[nyckel] = { värde, häst: häst.namn, hästId: häst.id,
      lopp: lopp.kortnamn || lopp.namn, ...när };
    if (gammalt) {
      registreraHändelse(spel, {
        typ: "stallrekord", betydelse: 58,
        aktörer: { hästId: häst.id, hästNamn: häst.namn },
        data: { text, gammalt: gammalt.häst, gammaltVärde: gammalt.värde },
      });
      skrivPress?.(spel, text,
        `Den gamla noteringen (${gammalt.häst}, säsong ${gammalt.säsong}) är historia.`,
        "bra", null, 0, JOURNALISTER.siffror);
    }
  };

  if (min.km != null && lopp.start === "bil") {
    /* Bara bilstart: voltens tillägg gör km-tiderna ojämförbara. */
    slog("snabbasteSeger", min.km, (a, b) => a < b,
      `Stallrekord: ${häst.namn} vann på ${min.km.toFixed(1).replace(".", ",")} per kilometer`);
  }
  if (fakta?.marginal != null) {
    slog("störstaMarginal", fakta.marginal, (a, b) => a > b,
      `Stallrekord: ${häst.namn} vann med ${fakta.marginal.toFixed(1).replace(".", ",")} längder`);
  }
  if (brutto > 0) {
    slog("störstaPrispeng", brutto, (a, b) => a > b,
      `Stallrekord: ${kr(brutto)} kr i ett enda lopp — ${häst.namn}`);
  }
}

/* ------------------------------------------------------------------ */
/* Hall of fame                                                        */
/* ------------------------------------------------------------------ */

/**
 * De största hästarna genom tiderna, invalda vid pensionen. Meriten är
 * karriären som helhet — intjänat väger tyngst, storloppssegrar och
 * segrar därtill. Tio platser: en vägg, inte ett arkiv. Att någon PETAS
 * när en större går i pension är poängen — väggen ska vara svår.
 */
export function invalIHallOfFame(spel, häst) {
  spel.hallOfFame = spel.hallOfFame ?? [];
  const storlopp = (häst.milstolpar || []).filter((m) => m.typ === "storloppsseger" || m.typ === "arvet").length;
  const merit = (häst.intjänat || 0) + (häst.segrar || 0) * 30000 + storlopp * 250000;
  spel.hallOfFame.push({
    namn: häst.namn, hästId: häst.id, merit,
    segrar: häst.segrar || 0, starter: häst.starter || 0,
    intjänat: häst.intjänat || 0, storlopp,
    mor: häst.mor ?? null, säsong: spel.säsong ?? 1,
  });
  spel.hallOfFame.sort((a, b) => b.merit - a.merit);
  spel.hallOfFame = spel.hallOfFame.slice(0, 10);
  return spel.hallOfFame.some((p) => p.hästId === häst.id);
}

/* ------------------------------------------------------------------ */
/* Säsongskrönikan                                                     */
/* ------------------------------------------------------------------ */

const PLATSORD = (plats, av) =>
  plats === 1 ? "överst i tränarligan"
  : plats <= 3 ? `på pallplats i ligan, ${plats}:a av ${av}`
  : plats > av * 0.7 ? `långt ner i tabellen, ${plats}:a av ${av}`
  : `mitt i tränarligan, ${plats}:a av ${av}`;

/**
 * Krönikörens bokslut. Byggs helt ur det som faktiskt hände — historik-
 * raden, säsongens händelser ur krönikan, rekord som föll — och sparas
 * PÅ historikraden, så att säsong 3:s text går att läsa i säsong 9.
 *
 * Texten är stycken, inte en mall med luckor: vilka stycken som alls
 * finns beror på vad året innehöll. Ett år utan storlopp får ingen
 * storloppsmening — tomrummet är också en berättelse.
 */
export function skrivSäsongskrönika(spel, rad) {
  const händelser = (spel.krönika ?? []).filter((h) => h.säsong === rad.säsong)
    .sort((a, b) => (b.betydelse ?? 0) - (a.betydelse ?? 0));
  const stycken = [];

  /* Ingången: placeringen och pengarna, med krönikörens ton. */
  stycken.push(
    `Säsong ${rad.säsong} slutade ${PLATSORD(rad.plats, rad.avStall)} — ` +
    `${rad.segrar} segrar på ${rad.starter} starter och ${kr(rad.intjänat)} kr insprunget.` +
    (rad.plats === 1 ? " Det behöver inte sägas vackrare än så." : ""));

  /* Årets ögonblick: den största händelsen får ett eget stycke. */
  const störst = händelser[0];
  if (störst && (störst.betydelse ?? 0) >= 55) {
    const namn = störst.aktörer?.hästNamn;
    const d = störst.data ?? {};
    const mening =
      störst.typ === "arvet" ? `Årets ögonblick väljer sig självt: ${namn} vann ${d.lopp} — samma lopp som modern ${d.mor ?? ""} en gång vann. Sådant skriver sig in i en gårds väggar.`
      : störst.typ === "storloppsseger" ? `Årets ögonblick: ${namn} i ${d.lopp}${d.bana ? ` på ${d.bana}` : ""}.` + (d.position1000 === "dödens" ? " Utvändigt om ledaren varvet runt, och ändå starkast över mållinjen." : "")
      : störst.typ === "eleven_slog_mästaren" ? `Årets mest omtalade lopp: ${d.tränare} — en gång förstaman på gården — vann före sitt gamla stall. Travet älskar sådana cirklar.`
      : störst.typ === "miljonen" ? `Under året passerade ${namn} miljonen i insprunget. Sådana hästar bär ett stall.`
      : störst.typ === "pensionering" ? `Året präglades av ett avsked: ${namn} lämnade tävlingsbanorna efter ${d.starter ?? "många"} starter.`
      : null;
    if (mening) stycken.push(mening);
  }

  /* Säsongens häst. */
  if (rad.bästaHäst) {
    /* bästaHästIntjänat är KARRIÄRTOTALEN (per-säsong per häst bokförs
       inte) — texten måste säga det, annars ljuger krönikan så fort
       hästen tjänat mer än stallets årsresultat. Upptäckt i genomkörning:
       "2,4 mkr under året" i ett stall som sprang in 1,6 mkr. */
    stycken.push(`Säsongens häst: ${rad.bästaHäst}, uppe i ${kr(rad.bästaHästIntjänat)} kr i karriären.`);
  }

  /* Rekorden som föll i år. */
  const rekord = händelser.filter((h) => h.typ === "stallrekord" || h.typ === "gårdsrekord");
  if (rekord.length === 1) stycken.push(`En notering föll: ${rekord[0].data?.text?.toLowerCase() ?? "ett stallrekord"}.`);
  else if (rekord.length > 1) stycken.push(`${rekord.length} noteringar föll under året — tavlan i stallgången fick skrivas om.`);

  /* Sorgen och avskeden, om de fanns och inte redan var årets ögonblick. */
  const avsked = händelser.filter((h) => h.typ === "pensionering" && (h.betydelse ?? 0) >= 55);
  if (avsked.length && störst?.typ !== "pensionering") {
    stycken.push(avsked.length === 1
      ? `Året tog också farväl av ${avsked[0].aktörer?.hästNamn}.`
      : `Året tog också farväl av ${avsked.map((h) => h.aktörer?.hästNamn).filter(Boolean).join(" och ")}.`);
  }

  /* Utgången: blicken framåt, färgad av tabelläget. */
  stycken.push(rad.plats === 1
    ? `Frågan inför nästa år är den som alltid följer på en ligaseger: hur försvarar man en tron man just byggt?`
    : rad.plats <= 3
      ? `Steget till toppen är inte långt. Det är det som gör vintern kort.`
      : `Grunden ligger där den ligger. Nu handlar det om vad som byggs på den.`);

  rad.krönika = { signatur: JOURNALISTER.krönikör, stycken };
  return rad.krönika;
}
