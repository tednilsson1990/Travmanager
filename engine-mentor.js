/**
 * MENTORN — den sista bågen
 *
 * Mentorn följer karriären efter pensionen: ringer efter första segern,
 * skriver i pressen efter storlopp, står på läktaren när arvet fullbordas.
 * Men hen är 68–74 redan vid överlämningen, och en berättelse som pågår i
 * decennier måste våga låta människor åldras. Närvaron GLESNAR med åren —
 * samtalen blir färre, kortare, varmare — och en dag, långt in i
 * karriären, kommer beskedet.
 *
 * VARSAMHETEN ÄR REGELN. Bortgången är stilla ("i sömnen, hemma på
 * gården hen flyttade till"), utan detaljer, utan val — vissa scener ska
 * bara få vara. Två scener: samtalet (kväll, personligt) och runan
 * (Travbladet, TILL MINNE). Sedan instiftar hemmabanan minnesloppet:
 * ett årligt lopp i mentorns namn, samma vecka varje säsong. Sorgen får
 * en form som ger tillbaka — det är travsportens eget sätt.
 *
 * DESIGNGRÄNS: modulen rör aldrig loppmotorn. Minnesloppet byggs med
 * samma verktyg som inbjudningsloppen och simuleras som vilket lopp som
 * helst — det som gör det särskilt är namnet och vad det betyder.
 */
import { slump, int, kr } from "./engine-util.js";
import { registreraHändelse } from "./engine-handelser.js";
import { köScen } from "./engine-scener.js";
import { inbjudningslopp } from "./data-kalender.js";
import { JOURNALISTER, TIDNINGSNAMN, BANOR } from "./data-namnpaket.js";

/** Är mentorn kvar i livet och pensionerad? */
export const mentornLever = (spel) =>
  !!(spel.prolog?.mentor && !spel.prolog.aktiv && !spel.prolog.mentor.borta);

/* ------------------------------------------------------------------ */
/* Närvaron som glesnar                                                */
/* ------------------------------------------------------------------ */

const HÄLSNINGAR = [
  (m, spel) => `<b>${m.namn}</b> ringde en kväll. »Jag läser om ${spel.stallnamn} i ${TIDNINGSNAMN}. Varje gång.«`,
  (m) => `<b>${m.namn}</b> skickade ett vykort från kusten. »Hästarna syns härifrån också. Sköt om dig.«`,
  (m, spel) => `<b>${m.namn}</b> tittade förbi gårdsplanen. Stod länge vid staketet utan att säga något. »Den luktar likadant«, sa hen till slut.`,
  (m) => `<b>${m.namn}</b> ringde. Samtalet var kort. »Jag ville bara höra hovarna i bakgrunden.«`,
];

/**
 * En hälsning ibland — oftare de första åren, glesare sedan. Kurvan är
 * poängen: från var ~8:e vecka året efter pensionen till någon gång per
 * säsong efter tio år. Frånvaron ska hinna kännas INNAN beskedet kommer,
 * annars är beskedet bara text.
 */
export function mentornsNärvaro(spel) {
  const m = spel.prolog?.mentor;
  if (!mentornLever(spel)) return;
  const årSedan = Math.max(0, (spel.säsong ?? 1) - 1);
  const chans = Math.max(0.006, 0.12 / (1 + årSedan * 0.7));
  if (slump() < chans) {
    const rad = HÄLSNINGAR[int(0, HÄLSNINGAR.length - 1)];
    spel.logg?.push(rad(m, spel));
  }
}

/* ------------------------------------------------------------------ */
/* Bortgången                                                          */
/* ------------------------------------------------------------------ */

/**
 * Prövas en gång per säsong, i säsongsskiftet. Aldrig före säsong 5 —
 * de första åren BEHÖVER mentorn för prologens efterklang (arvet,
 * elevens seger, rekorden) — och sedan med en sannolikhet som växer med
 * åldern. Vid 92 är det dags oavsett. Slumpen gör varje karriärs
 * tidslinje till sin egen.
 */
export function prövaMentornsBortgång(spel) {
  const m = spel.prolog?.mentor;
  if (!mentornLever(spel)) return false;
  m.ålder = (m.ålder ?? 72) + 1;
  if ((spel.säsong ?? 1) < 5) return false;
  const chans = m.ålder >= 92 ? 1 : Math.max(0, (m.ålder - 78) * 0.06);
  if (slump() >= chans) return false;

  m.borta = true;
  m.bortaSäsong = spel.säsong;
  registreraHändelse(spel, {
    typ: "mentorns_bortgång", betydelse: 88,
    data: { namn: m.namn, ålder: m.ålder },
  });

  /* Samtalet — kvällsscen, personlig, utan val. Stillhet, inga detaljer. */
  köScen(spel, {
    betydelse: 88, bild: "mentor",
    etikett: "TELEFONEN RINGER",
    rubrik: "SAMTALET",
    ingress: `Det är grannen som ringer, från gården dit ${m.namn} flyttade. `
      + `${m.namn} somnade in i går kväll, stilla, hemma. ${m.ålder} år.`,
    citat: "Hen satt på verandan i går eftermiddag och läste travsidorna. Som alltid.",
    citatVem: "Grannen",
  });

  /* Runan — Travbladet, TILL MINNE. Karriären i sin helhet, och slutet
     som handlar om er: gården som levde vidare. */
  const gh = spel.gårdshistoria ?? {};
  köScen(spel, {
    betydelse: 86, stil: "tidning", bild: "mentor",
    signatur: JOURNALISTER.krönikör,
    etikett: "TILL MINNE",
    rubrik: `${m.namn.toUpperCase()} ${m.ålder ? `· ${m.ålder} ÅR` : ""}`,
    ingress: `${m.namn}, mångårig tränare vid ${spel.stallnamn}, har lämnat oss. `
      + `Ett tränarliv som sträckte sig över mer än tre decennier är till ända.`,
    brödtext: [
      `Största segern kom ${gh.störstaSeger ? `i ${gh.störstaSeger}` : "på hemmabanan"}`
        + `${gh.bästaHäst ? ` med ${gh.bästaHäst}` : ""}, men de som stod hen nära vet att stoltheten på äldre dagar hette något annat: gården som levde vidare.`,
      `»Jag trodde länge att allt skulle behöva säljas«, sa hen vid överlämningen. Det behövde det inte. ${spel.stallnamn} tävlar än.`,
    ],
    citat: "Tre veckor går du bredvid mig. Sedan är nyckelknippan din.",
    citatVem: `${m.namn}, vid överlämningen`,
  });

  /* Minnesloppet instiftas: årligt, samma vecka, i mentorns namn.
     Svensk genitiv: namn som slutar på s får inget extra s —
     "Evert Sandelius Minne", inte "Sandeliuss". */
  const genitiv = /s$/i.test(m.namn.trim()) ? m.namn : `${m.namn}s`;
  const vecka = Math.min(spel.veckor - 1, Math.max(3, int(6, 14)));
  spel.minneslopp = { namn: `${genitiv} Minne`, vecka, instiftatSäsong: spel.säsong };
  const bana = BANOR[spel.hemmabana]?.namn ?? "hemmabanan";
  spel.press?.unshift({ rubrik: `${bana} instiftar ${m.namn}s Minne`,
    byline: `Ett årligt lopp till den gamle tränarens ära — körs vecka ${vecka} varje säsong.`,
    ton: "neutral", vecka: spel.vecka, signatur: JOURNALISTER.nyheter });
  return true;
}

/* ------------------------------------------------------------------ */
/* Minnesloppet                                                        */
/* ------------------------------------------------------------------ */

/**
 * Veckans minneslopp, om det är den veckan. Byggs på inbjudningsloppets
 * stomme — deterministiskt av veckan — men får mentorns namn, hemmabanan
 * och en krans i prispengarna. Att VINNA det registreras som en egen
 * händelse: vissa segrar väger mer än sitt förstapris.
 */
export function veckansMinneslopp(spel) {
  if (!spel.minneslopp || spel.minneslopp.vecka !== spel.vecka) return null;
  const grund = inbjudningslopp(spel.vecka * 31 + 7);
  const bana = BANOR[spel.hemmabana];
  return {
    ...grund,
    id: `v${spel.vecka}-minne`,
    namn: `${spel.minneslopp.namn}, ${bana?.namn ?? grund.banaNamn}`,
    kortnamn: spel.minneslopp.namn,
    bana: bana?.bana ?? grund.bana,
    banaNamn: bana?.namn ?? grund.banaNamn,
    openStretch: bana?.openStretch ?? grund.openStretch,
    upplopp: bana?.upplopp ?? grund.upplopp,
    prestige: 4,
    minneslopp: true,
    pris: grund.pris.map((p) => Math.round(p * 1.25 / 500) * 500),
  };
}

/** Kallas efter lopp: vann spelaren minnesloppet? */
export function efterMinneslopp(spel, lopp, häst, min) {
  if (!lopp?.minneslopp || min.ur || min.plats !== 1) return;
  registreraHändelse(spel, {
    typ: "minnesloppsseger", betydelse: 80,
    aktörer: { hästId: häst.id, hästNamn: häst.namn },
    data: { lopp: lopp.kortnamn, mentor: spel.prolog?.mentor?.namn },
  });
  köScen(spel, {
    betydelse: 80, bild: "seger",
    etikett: lopp.banaNamn?.toUpperCase() ?? "HEMMABANAN",
    rubrik: "KRANSEN SOM VÄGER MEST",
    ingress: `${häst.namn} vann ${lopp.kortnamn} — loppet som bär ${spel.prolog?.mentor?.namn}s namn, `
      + `på banan där allt började. ${kr(lopp.pris?.[0] ?? 0)} kr i förstapris, men det är inte det man minns.`,
    citat: "Hen hade suttit längst fram. Och sagt åt oss att inte gråta på en tävlingsdag.",
    citatVem: spel.stallnamn,
  });
}
