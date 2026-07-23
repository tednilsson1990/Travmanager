import { slump } from "./engine-util.js";
/**
 * Tävlingskalender.
 *
 * Lopp går en bestämd vecka och kräver meriter. Det är skillnaden mellan att
 * välja fritt varje vecka och att behöva planera: du måste bestämma vad du
 * sparar hästen till, och ibland avstå ett lopp för att nå ett större.
 *
 * Kalendern genereras deterministiskt ur veckonumret, så samma vecka ger
 * alltid samma propositioner. Den behöver därför inte sparas.
 */

export { BANOR } from "./data-namnpaket.js";
import { BANOR, STORLOPPSMALLAR, KLASSNAMN, STORSPEL } from "./data-namnpaket.js";

/** Liten deterministisk slump så att en vecka alltid ger samma lopp. */
function frö(n) {
  let x = (n * 2654435761) % 4294967296;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}
const välj = (r, a) => a[Math.floor(r() * a.length) % a.length];

const DISTANSER = [1640, 2140, 2140, 2640];

/**
 * Propositioner. Kravet avgör vilka hästar som får starta och styr därmed
 * både motståndet och vad du kan sikta på.
 */
const KLASSER = [
  { namn: KLASSNAMN.lärling, nivå: 38, prestige: 1, startande: 15,
    krav: { maxInsprunget: 120000 }, pris: [18000, 9000, 5000, 3000, 2000] },
  { namn: KLASSNAMN.klass3, nivå: 44, prestige: 1, startande: 15,
    krav: { maxInsprunget: 250000 }, pris: [30000, 15000, 8000, 5000, 3000] },
  { namn: KLASSNAMN.klass2, nivå: 54, prestige: 2, startande: 14,
    krav: { minInsprunget: 60000, maxInsprunget: 700000 }, pris: [60000, 30000, 15000, 9000, 6000] },
  { namn: KLASSNAMN.klass1, nivå: 62, prestige: 3, startande: 12,
    krav: { minInsprunget: 200000 }, pris: [90000, 45000, 23000, 14000, 9000] },
  { namn: KLASSNAMN.sto, nivå: 56, prestige: 2, startande: 14,
    krav: { kön: "sto" }, pris: [70000, 35000, 18000, 11000, 7000] },
  { namn: KLASSNAMN.ung, nivå: 48, prestige: 2, startande: 14,
    krav: { maxÅlder: 5 }, pris: [55000, 28000, 14000, 8000, 5000] },
];

/** Storloppen kommer ur namnlagret. Vecka, distans och krav styr spelet;
    namnen är utbytbara mot ett licensierat paket. */
const STORLOPP = STORLOPPSMALLAR.map((m) => ({
  vecka: m.vecka,
  namn: m.namn,
  bana: Object.keys(BANOR)[m.vecka % Object.keys(BANOR).length],
  dist: m.dist,
  nivå: 60 + m.prestige * 2,
  prestige: m.prestige,
  startande: 12,
  krav: {
    ...(m.minInsprunget ? { minInsprunget: m.minInsprunget } : {}),
    ...(m.kön ? { kön: m.kön } : {}),
    ...(m.maxÅlder ? { maxÅlder: m.maxÅlder } : {}),
  },
  pris: m.pris,
}));

export const ärV85Vecka = (vecka) => vecka % 4 === 0;

/**
 * Prisstegen.
 *
 * I trav får nästan alltid flera hästar betalt, och alla startande får
 * normalt en garanterad prispeng — även oplacerade och diskvalificerade.
 * Hur många som får pris beror på förstaprisets storlek och antalet
 * startande:
 *
 *   förstapris ≤ 30 000 kr  → 8 pris oavsett fältstorlek
 *   förstapris > 30 000 kr  → 5 pris vid ≤9 startande
 *                             6 pris vid 10–12
 *                             7 pris vid 13–15
 *
 * Det spelar roll långt utöver kassan: startsumman avgör vilka lopp hästen
 * får starta i, så en femteplats kan flytta en häst till tuffare motstånd.
 */
const STEGE = [1, 0.5, 0.35, 0.25, 0.16, 0.11, 0.08, 0.06];

export function prisstege(förstapris, startande) {
  const antalPris = förstapris <= 30000 ? 8
    : startande <= 9 ? 5
    : startande <= 12 ? 6
    : 7;
  const garanterad = Math.max(500, Math.round(förstapris * 0.03 / 100) * 100);
  const pris = [];
  for (let i = 0; i < startande; i++) {
    pris.push(i < antalPris
      ? Math.round(förstapris * STEGE[i] / 500) * 500
      : garanterad);
  }
  return { pris, garanterad, antalPris };
}

function byggLopp(r, { id, namn, banaId, dist, start, klass, extra = {} }) {
  const bana = BANOR[banaId];
  const startande = extra.startande ?? klass.startande;
  return {
    id,
    namn: `${namn}, ${bana.namn}`,
    kortnamn: namn,
    bana: bana.bana,
    banaNamn: bana.namn,
    openStretch: bana.openStretch,
    upplopp: bana.upplopp,
    dist,
    start,
    nivå: extra.nivå ?? klass.nivå,
    prestige: extra.prestige ?? klass.prestige,
    storlopp: !!extra.storlopp,
    v85: !!extra.v85,
    avdelning: extra.avdelning ?? null,
    startande,
    förstaVolt: start === "volt" ? 12 : undefined,
    tillägg: start === "volt" ? 20 : undefined,
    krav: extra.krav ?? klass.krav ?? {},
    ...(() => {
      const förstapris = (extra.pris ?? klass.pris)[0];
      const { pris, garanterad, antalPris } = prisstege(förstapris, startande);
      return { pris, garanterad, antalPris, förstapris };
    })(),
  };
}

/** Veckans lopp. Fyra till sex vardagslopp, plus V85-avdelning var fjärde vecka. */
/**
 * Ett inbjudningslopp: arrangören har sett stallets framgångar och bjuder
 * in. Högre klass än vardagsloppen, rejäla pengar, och fältet byggs av
 * nivån — motståndet är på riktigt. Deterministiskt av (vecka, frö2) så
 * samma inbjudan ger samma lopp.
 */
export function inbjudningslopp(vecka) {
  const r = frö(vecka * 7919 + 31);
  const klass = KLASSER[KLASSER.length - 1];
  const banaId = välj(r, Object.keys(BANOR).filter((b) => BANOR[b].storlek >= 2));
  return byggLopp(r, {
    id: `v${vecka}-inbjudan`,
    namn: "Arrangörens inbjudningslopp",
    banaId, dist: välj(r, DISTANSER), start: "bil", klass,
    extra: { nivå: (klass.nivå ?? 3) + 1, prestige: (klass.prestige ?? 2) + 1 },
  });
}

/* Prispengarna boostas efter bygget — arrangören betalar för att locka. */
export function medInbjudningspengar(lopp) {
  return { ...lopp, pris: lopp.pris.map((p) => Math.round(p * 1.6 / 500) * 500),
           garanterad: Math.round((lopp.garanterad || 0) * 1.6 / 500) * 500 };
}

export function veckansLopp(vecka) {
  const r = frö(vecka);
  const lopp = [];
  const antal = 4 + Math.floor(r() * 3);   // fyra till sex vardagslopp

  for (let i = 0; i < antal; i++) {
    const klass = välj(r, KLASSER);
    const banaId = välj(r, Object.keys(BANOR));
    const dist = välj(r, DISTANSER);
    const start = r() < 0.45 ? "bil" : "volt";
    lopp.push(byggLopp(r, {
      id: `v${vecka}-${i}`,
      namn: klass.namn,
      banaId, dist, start, klass,
    }));
  }

  const stor = STORLOPP.find((s) => s.vecka === vecka);
  if (stor) {
    lopp.push(byggLopp(r, {
      id: `v${vecka}-stor`,
      namn: stor.namn,
      banaId: stor.bana,
      dist: stor.dist,
      start: "volt",
      klass: KLASSER[3],
      extra: { ...stor, storlopp: true },
    }));
  }

  if (ärV85Vecka(vecka)) {
    const avd = 1 + Math.floor(r() * STORSPEL.avdelningar);
    const banaId = välj(r, Object.keys(BANOR));
    lopp.push(byggLopp(r, {
      id: `v${vecka}-v85`,
      namn: `${STORSPEL.namn} avdelning ${avd}`,
      banaId,
      dist: välj(r, [2140, 2140, 1640, 2640]),
      start: r() < 0.4 ? "bil" : "volt",
      klass: KLASSER[3],
      extra: {
        v85: true, avdelning: avd, prestige: 4, nivå: 60, startande: 15,
        krav: { minInsprunget: 150000 },
        pris: [125000, 62000, 31000, 19000, 12000],
      },
    }));
  }
  return lopp;
}

/**
 * Får hästen starta? Returnerar null om allt är i ordning, annars skälet.
 * Propositionen är det som gör kalendern till ett val: din bästa häst är
 * inte alltid välkommen i det lopp du helst vill vinna.
 */
export function startförbud(häst, lopp) {
  const k = lopp.krav || {};
  if (k.kön && häst.kön !== k.kön) return `Endast ${k.kön}`;
  if (k.minÅlder && häst.ålder < k.minÅlder) return `Minst ${k.minÅlder} år`;
  if (k.maxÅlder && häst.ålder > k.maxÅlder) return `Högst ${k.maxÅlder} år`;
  if (k.minInsprunget && häst.intjänat < k.minInsprunget)
    return `Kräver ${Math.round(k.minInsprunget / 1000)} tkr insprunget`;
  if (k.maxInsprunget && häst.intjänat > k.maxInsprunget)
    return `Högst ${Math.round(k.maxInsprunget / 1000)} tkr insprunget`;
  return null;
}

/** Kort beskrivning av propositionen, för anmälningsvyn. */
export function kravText(lopp) {
  const k = lopp.krav || {};
  const delar = [];
  if (k.kön) delar.push(k.kön === "sto" ? "ston" : "hingstar och valacker");
  if (k.maxÅlder) delar.push(`högst ${k.maxÅlder} år`);
  if (k.minÅlder) delar.push(`minst ${k.minÅlder} år`);
  if (k.minInsprunget) delar.push(`från ${Math.round(k.minInsprunget / 1000)} tkr`);
  if (k.maxInsprunget) delar.push(`upp till ${Math.round(k.maxInsprunget / 1000)} tkr`);
  return delar.length ? delar.join(", ") : "öppet lopp";
}
