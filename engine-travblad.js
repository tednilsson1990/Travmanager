/**
 * TRAVBLADET (v89, kap 5)
 *
 * Journalisten dömer världen på om den producerar riktiga berättelser
 * eller bara slumpmässiga rubriker. Den här modulen är tidningens
 * redaktion: den VÄRDERAR nyheter, räknar statistik och ställer frågor
 * med minne — men den hittar aldrig på fakta. Varje rad läses ur
 * registrerade händelser, pressnotiser och spelets siffror.
 *
 * NYHETSVÄRDERINGEN (5.3): en vanlig lunchseger ska inte få samma
 * rubrikstorlek som stallets första storloppsseger. Förstasidan byggs
 * därför av händelsemotorns betydelse: uppslaget är veckans tyngsta
 * händelse (om den väger nog), artiklarna är pressens laddade rubriker,
 * notiserna resten. Tre storlekar, tydlig hierarki — pressmallarna
 * från v55 får äntligen bära en hel förstasida.
 *
 * RÖSTERNA (5.2): tidningens tre signaturer ur data-namnpaket har
 * varsin avdelning — nyhetsreportern förstasidan, statistikern sifferkolumnen
 * (bara tal som finns: ligan, stallformen, favoritfacit, marknadsbilden),
 * krönikören den kritiska spalten. Krönikan är en LÄSNING av läget,
 * deterministisk ur samma siffror som kolumnen — sportjournalistik,
 * inte dokusåpa (5.5).
 *
 * PRESSFRÅGAN MED MINNE (5.4): pressen minns vad du sagt. Tonat ner tre
 * starter i rad? Lovat seger och åkt på stryk? Möter din gamla förstaman
 * dig med loppets favorit? Då är det DEN frågan som ställs — annars den
 * vanliga. Minnet bor på hästen (presshistorik, skriven av veckomotorn).
 */
import { tränarliga } from "./engine-varld.js";
import { JOURNALISTER } from "./data-namnpaket.js";

/* ------------------------------------------------------------------ */
/* Förstasidan — nyhetsvärderingen (5.3)                               */
/* ------------------------------------------------------------------ */

/**
 * Veckans tyngsta registrerade händelse, om den väger nog för ett
 * uppslag. Betydelsen är händelsemotorns — samma tal som styr Albumet.
 */
function veckansUppslag(spel) {
  const nu = spel.säsong ?? 1;
  const färska = (spel.krönika ?? []).filter((h) =>
    h.säsong === nu && (spel.vecka - h.vecka) <= 1 && (h.betydelse ?? 0) >= 55
    && h.data?.text);
  if (!färska.length) return null;
  const topp = [...färska].sort((a, b) => (b.betydelse ?? 0) - (a.betydelse ?? 0))[0];
  return {
    rubrik: topp.data.text,
    etikett: `Säsong ${topp.säsong} · vecka ${topp.vecka}`,
    betydelse: topp.betydelse,
  };
}

/**
 * Hela förstasidan: uppslag, artiklar och notiser ur det som redan är
 * skrivet. Pressens laddade rubriker (bra/dålig) från de två senaste
 * veckorna blir artiklar; resten notiser.
 */
export function förstasidan(spel) {
  const press = spel.press ?? [];
  const uppslag = veckansUppslag(spel);
  const färsk = (p) => (spel.vecka - p.vecka) <= 2 && p.vecka <= spel.vecka;
  const artiklar = press.filter((p) => färsk(p) && p.ton !== "neutral").slice(0, 3);
  const iArtiklar = new Set(artiklar);
  const notiser = press.filter((p) => !iArtiklar.has(p)).slice(0, 6);
  return { uppslag, artiklar, notiser };
}

/* ------------------------------------------------------------------ */
/* Statistikerns kolumn och krönikan (5.2, 5.5)                        */
/* ------------------------------------------------------------------ */

/** Favoritfacit: de senaste starterna som favorit — skrivs av veckomotorn. */
const favoritLäge = (spel) => {
  const facit = spel.favoritfacit ?? [];
  const missar = facit.filter((f) => f.ur || (f.plats ?? 9) > 3).length;
  return { starter: facit.length, missar };
};

/** Sifferkolumnen: bara tal som finns. Signerad statistikern. */
export function statistikern(spel) {
  const liga = tränarliga(spel);
  const plats = liga.findIndex((r) => r.du) + 1;
  const fav = favoritLäge(spel);
  const rader = [];
  if (plats > 0) rader.push(`Tränarligan: ${plats}:a av ${liga.length}, ${Math.round(spel.intjänat / 1000)} tkr insprunget i år.`);
  rader.push(`Stallform ${Math.round(spel.stallform ?? 50)} av 100 — räknat på de senaste tolv starterna.`);
  if (fav.starter >= 3) rader.push(`Som favorit: ${fav.starter - fav.missar} av ${fav.starter} senaste favoritstarterna slutade på pallen.`);
  const m = spel.marknadsbild ?? 0;
  if (Math.abs(m) > 0.25) rader.push(m > 0
    ? "Stallets hästar har överpresterat mot spelet — marknaden justerar upp."
    : "Stallets hästar har underpresterat mot spelet — oddsen ger utrymme.");
  return { rader, signatur: JOURNALISTER.siffror };
}

/**
 * Krönikan: den kritiska rösten, deterministiskt läst ur samma siffror.
 * Kritiken kommer när facit motiverar den (upprepade favoritmissar,
 * kassakris, svag form) — annars är tonen saklig. Aldrig dokusåpa.
 */
export function krönikan(spel) {
  const fav = favoritLäge(spel);
  const liga = tränarliga(spel);
  const plats = liga.findIndex((r) => r.du) + 1;
  let text;
  if (fav.starter >= 3 && fav.missar >= 3) {
    text = `Tre av spelarnas senaste förtroenden har ${spel.stallnamn} förvaltat till placeringar utanför pallen. Det är inte otur längre — det är ett mönster, och mönster har orsaker. Matchningen, formen eller ambitionen: någonstans ska svaret hämtas.`;
  } else if ((spel.iKris ?? 0) > 0) {
    text = `Sport kostar, och ${spel.stallnamn}s kassa ser ut därefter. Frågan ägare och sponsorer ställer sig är den enkla: bär verksamheten sig — eller bär den på lånad tid?`;
  } else if ((spel.stallform ?? 50) < 38) {
    text = `Formsiffrorna ljuger sällan, och ${spel.stallnamn}s pekar nedåt. Ett stall i svacka har två val: vila och bygga, eller starta och hoppas. Det första kräver tålamod. Det andra brukar kosta mer än det ger.`;
  } else if (plats > 0 && plats <= 3) {
    text = `${spel.stallnamn} ligger ${plats === 1 ? "etta" : plats + ":a"} i ligan, och det syns i sättet hästarna kommer till start: förberedda, rätt matchade, med planer som håller. Så ser ett stall ut som vet vad det gör.`;
  } else {
    text = `Ingen kris, ingen rubrik — bara ett stall som gör jobbet. Det är i sådana veckor grunden läggs, även om ingen skriver hem om det. Utom vi, här, nu.`;
  }
  return { text, signatur: JOURNALISTER.krönikör };
}

/* ------------------------------------------------------------------ */
/* Pressfrågan med minne (5.4)                                         */
/* ------------------------------------------------------------------ */

/**
 * Vilken fråga pressen ställer inför loppet. Prioritering: den gamla
 * förstamannen i fältet slår allt (personkoppling + konflikt är högsta
 * nyhetsvärde enligt 5.3), sedan det brutna löftet, sedan nedtoningen
 * — sist den vanliga frågan. Deterministiskt ur historiken: ingen slump.
 */
export function pressfråga(spel, häst, lopp, fält) {
  /* Din tidigare förstaman som tränare i fältet — extra vasst om det
     är för favoriten. */
  const exNamn = new Map((spel.tidigareFörstamän ?? []).map((f) => {
    const stall = spel.värld?.stall?.find((s) => s.id === f.stallId);
    return [stall?.namn, f.namn];
  }).filter(([n]) => n));
  const favorit = [...fält].sort((a, b) => (b.streck ?? 0) - (a.streck ?? 0))[0];
  const exIFält = fält.find((h) => !h.egen && exNamn.has(h.stallNamn));
  if (exIFält) {
    const ex = exNamn.get(exIFält.stallNamn);
    return {
      typ: "exförstaman",
      text: `Din tidigare förstaman ${ex} möter dig här — ${exIFält === favorit
        ? `som tränare för favoriten ${exIFält.namn}` : `med ${exIFält.namn} i fältet`}. Hur känns det?`,
    };
  }
  const hist = häst.presshistorik ?? [];
  if (hist[0]?.val === "upp" && (hist[0].ur || (hist[0].plats ?? 1) > 3)) {
    return {
      typ: "brutet_löfte",
      text: `Förra gången lovade du seger och ${häst.namn} ${hist[0].ur ? "blev bortkörd" : `blev ${hist[0].plats}:a`}. Varför ska spelarna tro på dig nu?`,
    };
  }
  if (hist.length >= 3 && hist.slice(0, 3).every((h) => h.val === "ner")) {
    return {
      typ: "nedtoning",
      text: `Du har tonat ner ${häst.namn} inför de tre senaste starterna. Är det försiktighet — eller är du inte nöjd med hästen?`,
    };
  }
  return {
    typ: "vanlig",
    text: `Vi skriver inför ${lopp.kortnamn || lopp.namn}. ${häst.namn} fick spår ${häst.spår} — hur ser du på chansen?`,
  };
}
