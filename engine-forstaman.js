/**
 * FÖRSTAMANNEN
 *
 * Stallets högra hand. Ger träningsråd per häst och pekar ut veckans
 * lämpligaste lopp — med motivering, för poängen är inte att spela åt
 * spelaren utan att lära ut hur man tänker. Råden är regelstyrda och
 * deterministiska för ett givet spelläge; profilen (fostrare, pådrivare,
 * taktiker) förskjuter tonvikten utan att göra råden dåliga.
 */
import { slump } from "./engine-util.js";
import { FÖRSTAMANSNAMN, FÖRSTAMANSPROFILER, BANOR } from "./data-namnpaket.js";
import { TRÄNING } from "./engine-hast.js";

export function nyFörstaman() {
  const namn = FÖRSTAMANSNAMN[Math.floor(slump() * FÖRSTAMANSNAMN.length)];
  const profil = FÖRSTAMANSPROFILER[Math.floor(slump() * FÖRSTAMANSPROFILER.length)];
  return { namn, profil: profil.id, profiltext: profil.text, lön: 0 };
}

/**
 * Tre kandidater till förstamansjobbet — karriärens första stora
 * rekrytering. Olika profiler, åldrar och lönekrav; valet färgar råden
 * genom hela karriären. Namnen dras utan dubbletter.
 */
export function förstamanskandidater() {
  const namn = [...FÖRSTAMANSNAMN].sort(() => slump() - 0.5);
  const löner = { fostrare: 900, pådrivare: 1200, taktiker: 1500 };
  const pitch = {
    fostrare: "»Hästar går sönder av otålighet, inte av vila. Jag bygger långsamt och rätt.«",
    pådrivare: "»Form väntar man inte fram, den byggs. Ge mig ansvaret så levererar jag.«",
    taktiker: "»Rätt häst i rätt lopp slår bättre häst i fel lopp. Varje vecka.«",
  };
  return FÖRSTAMANSPROFILER.map((p, i) => ({
    namn: namn[i], ålder: 24 + Math.floor(slump() * 30),
    profil: p.id, profiltext: p.text, lön: löner[p.id] ?? 1000,
    pitch: pitch[p.id] ?? "",
  }));
}

/**
 * Träningsråd för en häst. Returnerar { träning, motiv }.
 * Grundreglerna är trav-sunt förnuft: trött häst vilar, formsvag häst
 * jobbar om orken finns, startsnabbhet slipas inför lopp. Profilen
 * flyttar gränserna något.
 */
export function träningsråd(förstaman, häst) {
  const p = förstaman?.profil ?? "fostrare";
  const vilogräns = p === "fostrare" ? 45 : p === "pådrivare" ? 32 : 40;
  const jobbgräns = p === "pådrivare" ? 68 : 74;

  if (häst.skada > 0)
    return { träning: "vila", motiv: `${häst.namn} känns inte helt bra — vila tills det släpper.` };
  if (häst.energi < vilogräns)
    return { träning: "vila", motiv: `orken är nere på ${Math.round(häst.energi)}. En trött häst lär sig ingenting.` };
  if (häst.form < 48 && häst.energi > jobbgräns)
    return { träning: p === "pådrivare" ? "kvalitet" : "intervall",
             motiv: `formen ligger på ${Math.round(häst.form)} och orken finns — dags att bygga.` };
  if (häst.start < 52 && häst.energi > 55)
    return { träning: "start", motiv: `startsnabbheten släpar. Några voltar bakom bilen gör susen.` };
  if (häst.form < 60 && häst.energi > 60)
    return { träning: "intervall", motiv: `halvbra form och gott om ork — intervaller lyfter den sista biten.` };
  return { träning: "lugnt", motiv: `${häst.namn} är i balans. Lugnt jobb och håll den där.` };
}

/**
 * Poängsätter ett lopp för en häst. Högre är bättre.
 * Väger distanspassning, klass mot hästens meriter, banans karaktär mot
 * hästens löpstil, och prispengar. Returnerar { poäng, skäl[] }.
 */
export function loppbetyg(häst, lopp) {
  const skäl = [];
  let poäng = 0;

  const opt = häst.distans?.optimal ?? 2140;
  const diff = Math.abs(lopp.dist - opt);
  if (diff <= 160) { poäng += 3; skäl.push("distansen passar"); }
  else if (diff <= 400) { poäng += 1; }
  else { poäng -= 2; skäl.push(`${lopp.dist} m är fel distans`); }

  /* Klass mot meriter: intjänat per start som grov nivåmätare. */
  const snitt = häst.starter > 0 ? häst.intjänat / häst.starter : 4000;
  const loppnivå = (lopp.pris?.[0] ?? 30000) / 6;
  if (loppnivå < snitt * 0.55) { poäng -= 1; skäl.push("för enkelt för att betala sig"); }
  else if (loppnivå > snitt * 3.2) { poäng -= 2; skäl.push("fältet blir en klass för tufft"); }
  else { poäng += 2; skäl.push("rätt klass"); }

  if (lopp.openStretch && (häst.start ?? 50) < 55) { poäng += 1; skäl.push("öppet innerspår hjälper en som fastnar"); }
  if (lopp.start === "volt" && (häst.start ?? 50) < 45) { poäng -= 1; skäl.push("voltstart är ett vågspel med den startsnabbheten"); }
  if ((lopp.pris?.[0] ?? 0) >= 100000) { poäng += 1; skäl.push("pengarna är stora"); }

  return { poäng, skäl };
}

/** Veckans bästa lopp för hästen, med förstamannens formulering. */
export function loppmatchning(förstaman, häst, loppLista) {
  if (!häst || !loppLista?.length) return null;
  const bedömda = loppLista.map((lopp) => ({ lopp, ...loppbetyg(häst, lopp) }))
    .sort((a, b) => b.poäng - a.poäng);
  const bäst = bedömda[0];
  if (bäst.poäng < 0)
    return { lopp: null, text: `Ingen av veckans propositioner passar ${häst.namn}. Jag hade tränat i veckan och väntat.` };
  const skäl = bäst.skäl.slice(0, 2).join(" och ");
  return { lopp: bäst.lopp, text: `${bäst.lopp.kortnamn || bäst.lopp.namn} på ${bäst.lopp.banaNamn} — ${skäl}.` };
}

/** Kort hälsning vid uppstart, färgad av profilen. */
export function hälsning(förstaman, hemmabanaId) {
  const bana = BANOR[hemmabanaId]?.namn ?? "banan";
  const p = förstaman.profil;
  const rader = {
    fostrare: `Välkommen till ${bana}. Jag har krattat rakbanan och satt på kaffet. Vi bygger det här långsamt och rätt.`,
    pådrivare: `${bana} är ingen fin adress — än. Ge mig hästar med ork så visar vi dem.`,
    taktiker: `Jag har redan läst propositionerna tre veckor framåt. Det finns lopp att vinna för den som väljer rätt.`,
  };
  return rader[p] ?? rader.fostrare;
}

/** Säkerställ att sparfilen har en förstaman (äldre karriärer saknar en). */
export function säkraFörstaman(spel) {
  if (!spel.förstaman) {
    spel.förstaman = nyFörstaman();
    return true;
  }
  return false;
}

export { TRÄNING };
