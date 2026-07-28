/**
 * ANMÄLNINGSMOTORN (v93, tävlingsmanualen kap 6–7 — etapp B)
 *
 * Anmälan slutar vara en transportsträcka: en plats i loppet är inte
 * längre garanterad. Världens tränare anmäler till samma lopp, och blir
 * det fler än det finns platser avgör STARTPOÄNGEN vem som kommer med.
 * Ett lopp med för få anmälda ställs in — och varje utfall förklaras
 * med exakta siffror, aldrig med en kod (transparenskravet).
 *
 * TRÖSKLARNA (manualen 6.6): 0–3 anmälda ställs in, 4–7 är
 * arrangörens beslut, 8+ körs alltid.
 *
 * UTTAGNINGEN (7.1): startpoäng ur de fem senaste starterna —
 * 400/200/100/50/25 plus en poäng per vunna 100 kr — för din häst OCH
 * världens (deras loppbok bär pris sedan v93). FÖRETRÄDET: ostartade
 * hästar går före i lopp med pengatak — det är där karriärer ska börja.
 *
 * DETERMINISMEN: anmälningsläget för ett lopp en viss vecka är ETT
 * faktum, inte ett tärningskast per knapptryck. Världsurvalet seedas ur
 * lopp-id + vecka (UI-hashregeln), så att samma lopp ger samma anmälda
 * hur många gånger spelaren än prövar — och rng-flödet i resten av
 * spelet lämnas orört.
 *
 * PENGARNA: att bli struken eller få loppet inställt kostar ingenting —
 * kusken kördes aldrig. Arvode och resa dras först när platsen är klar.
 *
 * GRÄNSEN MOT VÄRLDEN: byggFält och körVärldensVecka är orörda —
 * AI-veckan och kalibreringen ser inte den här modulen. Den gäller
 * SPELARENS anmälan, där känslan bor.
 */
import { klamp, seedad, sättRng, slump } from "./engine-util.js";
import { tillgängliga } from "./engine-varld.js";
import { startpoäng } from "./engine-proposition.js";
import { veckansAnmälningar } from "./engine-aitranare.js";
import { ärEftertraktad, relation } from "./data-kuskar.js";

/** Arrangörens beslut vid 4–7 anmälda — deterministiskt och viktat
    (4: 25 %, 5: 43 %, 6: 61 %, 7: 79 %). Samma funktion för spelarens
    lopp och världens, så trösklarna aldrig divergerar. */
export function arrangörenKör(loppId, vecka, antal) {
  return hash(`${loppId}:${vecka}:arrangör`) % 100 < 25 + (antal - 4) * 18;
}

/** Stabil hash för deterministiska beslut (samma som UI-hashregeln). */
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Företrädet: ostartad häst i ett lopp med pengatak går före poängen. */
const harFöreträde = (häst, lopp) =>
  (häst.starter ?? 0) === 0 && !!lopp.krav?.maxInsprunget;

/**
 * Vilka världshästar som anmäler sig. Samma klassfönster som fältbygget
 * alltid använt, men var och en anmäler med ~3/4 sannolikhet —
 * deterministiskt ur häst + lopp + vecka, så listan är ett faktum.
 */
export function anmälningsläge(spel, lopp, egenHäst) {
  /* Sedan v95 kommer världens anmälda ur AI-tränarnas riktiga loppval
     (engine-aitranare) — samma karta som världsveckan sedan kör. Bara
     specialloppen utanför kalendern (minneslopp, inbjudan) behåller
     klassfönstermetoden. */
  const karta = veckansAnmälningar(spel);
  if (karta.has(lopp.id)) {
    return { anmälda: [egenHäst, ...karta.get(lopp.id)], platser: lopp.startande };
  }
  sättRng(seedad(hash(`${lopp.id}:${spel.vecka}:anmälan`)));
  const kandidater = tillgängliga(spel.värld, lopp, spel.vecka, new Set())
    .sort((a, b) => b.intjänat - a.intjänat);
  sättRng();
  const platser = lopp.startande;
  const fönster = Math.max(0, kandidater.length - platser);
  const start = Math.round(fönster * klamp(1 - lopp.nivå / 78, 0, 1));
  /* Balansen (prövad i prov-anmalan): 1,5 × platser i fönstret och två
     tredjedelars anmälningsvilja ger ett väntevärde strax under fullt
     fält — överanmälan ungefär varannan gång, tunna fält då och då.
     87 % överanmälda (första kalibreringen) var tjat, inte dramatik. */
  const bredd = Math.min(kandidater.length - start, Math.round(platser * 1.5));
  const iFönstret = kandidater.slice(start, start + Math.max(0, bredd));
  const världsanmälda = iFönstret.filter((h) =>
    hash(`${h.id}:${lopp.id}:${spel.vecka}`) % 100 < 66);
  return { anmälda: [egenHäst, ...världsanmälda], platser };
}

/**
 * Hela uttagningen. Returnerar alltid ett utfall med människoläsbar
 * text och siffrorna bakom:
 *   { utfall: "inställt" | "med" | "struken", ... }
 */
export function uttagning(spel, lopp, egenHäst) {
  const { anmälda, platser } = anmälningsläge(spel, lopp, egenHäst);
  const antal = anmälda.length;

  /* 0–3: ställs in. 4–7: arrangörens beslut — deterministiskt ur
     lopp + vecka, och viktat: sex anmälda körs oftare än fyra. */
  if (antal <= 3) {
    return { utfall: "inställt", antal, platser,
      text: `Endast ${antal} anmälda — loppet ställs in.` };
  }
  if (antal <= 7) {
    const körs = arrangörenKör(lopp.id, spel.vecka, antal);
    if (!körs) {
      return { utfall: "inställt", antal, platser, arrangör: true,
        text: `${antal} anmälda — arrangören valde att ställa in loppet.` };
    }
    return { utfall: "med", antal, platser, arrangör: true, överanmält: false,
      fält: ordna(anmälda, egenHäst),
      text: `${antal} anmälda — arrangören kör loppet trots det tunna fältet.` };
  }
  if (antal <= platser) {
    return { utfall: "med", antal, platser, överanmält: false,
      fält: ordna(anmälda, egenHäst),
      text: `${antal} anmälda till ${platser} platser — alla kommer med.` };
  }

  /* DELNINGEN (v96, manualen 6.6): vid stor överanmälan i vardagslopp
     delas loppet i avdelningar och ALLA kommer med — precis som i
     svensk travvardag. Storlopp, V85 och speciallopp delas aldrig:
     deras fält är poängen. Round-robin på poängsorterad lista ger jämna
     avdelningar, och ingen avdelning kan överstiga platstaket. */
  const kanDelas = !lopp.storlopp && !lopp.v85 && !lopp.minneslopp && !lopp.id.endsWith("-inbjudan");
  if (kanDelas && antal >= platser + 5) {
    const avdelningar = delaFält(anmälda, lopp);
    const ix = avdelningar.findIndex((avd) => avd.includes(egenHäst));
    return { utfall: "med", antal, platser, delat: true,
      avdelning: ix + 1, antalAvdelningar: avdelningar.length,
      fält: ordna(avdelningar[ix], egenHäst),
      text: `Överanmält: ${antal} anmälda till ${platser} platser. Loppet delas i ${avdelningar.length} avdelningar — alla kommer med. Ni startar i avdelning ${ix + 1}.` };
  }

  /* Överanmält: startpoängen avgör, företrädet först. */
  const rader = anmälda.map((h) => ({
    h, företräde: harFöreträde(h, lopp), poäng: startpoäng(h).poäng,
  })).sort((a, b) =>
    (b.företräde ? 1 : 0) - (a.företräde ? 1 : 0)
    || b.poäng - a.poäng
    /* Skiljenyckeln vid lika poäng — vanligt tidigt i karriären när
       raderna är tunna: klassmeriterna (startsumman) avgör, dokumenterat
       och synligt i beskedet i stället för godtycklig listordning. */
    || (b.h.intjänat ?? 0) - (a.h.intjänat ?? 0));
  const uttagna = rader.slice(0, platser);
  const gräns = uttagna[uttagna.length - 1].poäng;
  const egenRad = rader.find((r) => r.h === egenHäst);
  const med = uttagna.some((r) => r.h === egenHäst);
  const grund = gräns > 0
    ? `Överanmält: ${antal} anmälda till ${platser} platser. Uttagning på startpoäng — gränsen gick vid ${gräns}.`
    : `Överanmält: ${antal} anmälda till ${platser} platser. Raderna är tunna — startpoäng och därefter klassmeriter fick skilja fältet.`;
  if (med) {
    return { utfall: "med", antal, platser, överanmält: true, gräns,
      dinPoäng: egenRad.poäng, företräde: egenRad.företräde,
      fält: ordna(uttagna.map((r) => r.h), egenHäst),
      text: `${grund} ${egenRad.företräde
        ? `${egenHäst.namn} är ostartad och gick in på företrädesregeln.`
        : `Din poäng: ${egenRad.poäng} — ni är med.`}` };
  }
  return { utfall: "struken", antal, platser, överanmält: true, gräns,
    dinPoäng: egenRad.poäng,
    text: `${grund} Din poäng: ${egenRad.poäng} — ${egenHäst.namn} kom inte med. ${platser} hästar hade starkare rader.` };
}

/**
 * KUSKBEKRÄFTELSEN (v97, manualen kap 9). En preliminär bokning prövas
 * när fältet är känt: den eftertraktade kusken jämför din häst mot
 * loppets bästa — med kuskens ögon (samma kapacitetsmått som
 * AI-tränarnas skattning, ingen facit-titt i simuleringen). Är din häst
 * bland fältets tre bästa håller bokningen alltid. Annars avgör
 * relationen: ju längre ni kört ihop, desto oftare står kusken vid sitt
 * ord. Deterministiskt ur kusk + lopp + vecka — samma besked varje gång.
 */
export function kuskbekräftelse(spel, kusk, egenHäst, fält, lopp) {
  if (!ärEftertraktad(kusk) || relation(spel, kusk) >= 70) return { bekräftad: true };
  const mått = (h) => (h.start + h.fart + h.styrka) / 3 * 0.55 + h.form * 0.45;
  const ordnade = [...fält].sort((a, b) => mått(b) - mått(a));
  const rang = ordnade.indexOf(egenHäst) + 1;
  if (rang <= 3) return { bekräftad: true, rang };
  const risk = Math.max(8, 58 - relation(spel, kusk) / 2 - (fält.length - rang) * 2);
  if (hash(`${kusk.namn}:${lopp.id}:${spel.vecka}:bokning`) % 100 < risk) {
    const bästa = ordnade.find((h) => h !== egenHäst);
    return { bekräftad: false, rang, till: bästa?.namn ?? "en annan häst",
      text: `${kusk.namn} bryter den preliminära bokningen — »${bästa?.namn ?? "Fältets bästa"} är svår att tacka nej till. Inget illa ment.«` };
  }
  return { bekräftad: true, rang };
}

/**
 * Delningen av ett överanmält fält: poängsorterad round-robin ger jämna
 * avdelningar (bästa hästen i avd 1, näst bästa i avd 2, tredje i avd 1
 * ...). Antalet avdelningar är det minsta som ryms under platstaket.
 * Används av både spelarens uttagning och världsveckan.
 */
export function delaFält(anmälda, lopp) {
  const sorterade = [...anmälda].sort((a, b) =>
    startpoäng(b).poäng - startpoäng(a).poäng || (b.intjänat ?? 0) - (a.intjänat ?? 0));
  /* Ren ceil, inget tak: kartan kan ge en populär proposition 37+
     anmälda, och tre avdelningar à 13 vore ett regelbrott. Fyra
     avdelningar är ovanligt men regelrätt — och besked­et säger det. */
  const antalAvd = Math.ceil(sorterade.length / lopp.startande);
  const avdelningar = Array.from({ length: antalAvd }, () => []);
  sorterade.forEach((h, i) => avdelningar[i % antalAvd].push(h));
  return avdelningar;
}

/** Fältkonventionen: spelarens häst först, resten i anmälningsordning. */
function ordna(hästar, egen) {
  return [egen, ...hästar.filter((h) => h !== egen)];
}

/**
 * Alternativen vid struken eller inställd anmälan (manualen 6.6:
 * spelaren ska föreslås alternativ, aldrig lämnas i en återvändsgränd).
 * loppläge skickas in från propositionsmotorn så att modulerna inte
 * korsimporterar — de två första berättigade loppen, bäst bedömning först.
 */
export function alternativlopp(veckans, lopp, häst, loppläge) {
  return veckans
    .filter((l) => l !== lopp && l.id !== lopp.id)
    .map((l) => ({ l, läge: loppläge(häst, l) }))
    .filter((x) => x.läge.status !== "ej")
    .sort((a, b) => a.läge.ordning - b.läge.ordning)
    .slice(0, 2);
}

/* Anteckning: slump importeras inte i onödan — deterministiken är hela
   poängen; kvar för framtida mörk anmälan (manualen 6.5). */
export const _reserverad = () => slump;
