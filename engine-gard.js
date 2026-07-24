/**
 * GÅRDEN
 *
 * Anläggningen och personalen. Stallet börjar med fyra boxar och en grusad
 * träningsslinga — allt därutöver byggs eller anställs för pengar som
 * kunde ha blivit hästar. Det är avvägningen som gör gården intressant.
 *
 * DESIGNGRÄNS: gården påverkar VECKAN — träningsutbyte, återhämtning,
 * skaderisk, läkning, kapacitet — aldrig loppmotorn. Kalibreringen ska
 * inte kunna se om spelaren har vattenband.
 */
import { skrivPress } from "./engine-vecka.js";

export const BYGGEN = {
  boxar2: { namn: "Två boxar till", pris: 45000, drift: 0, upprepbar: true,
    text: "Fler hästar i träning — fler ägararvoden, fler chanser." },
  rakbana: { namn: "Egen rakbana", pris: 80000, drift: 900,
    text: "Snabbjobb på hemmaplan. Start- och intervallträning ger mer." },
  backe: { namn: "Träningsbacke", pris: 60000, drift: 400,
    text: "Backjobb bygger ork utan att slita på benen." },
  vattenband: { namn: "Vattenband", pris: 70000, drift: 1100,
    text: "Skonsam grundkondition. Hästarna hämtar sig fortare och skadas mindre i jobben." },
};

export const ANSTÄLLDA = {
  veterinär: { namn: "Stallveterinär", lön: 2600,
    text: "Ser sakerna innan de blir stora. Skador läker en vecka fortare." },
  hovslagare: { namn: "Egen hovslagare", lön: 1600,
    text: "Rätt balans under hästen. Märkbart färre träningsskador." },
};

/** Nystartsvärden. Äldre sparfiler får kapacitet som matchar gamla taket. */
export function nyAnläggning() {
  return { boxar: 4, rakbana: false, backe: false, vattenband: false,
           veterinär: false, hovslagare: false };
}
export function säkraAnläggning(spel) {
  if (!spel.anläggning) {
    spel.anläggning = { ...nyAnläggning(), boxar: 8 };
    return true;
  }
  return false;
}

/** Boxarna är stallets tak — ägarförfrågningar slutar komma när det är fullt. */
export const boxplats = (spel) =>
  (spel.anläggning?.boxar ?? 8) - spel.stall.length;

/** Veckans driftkostnad för anläggning och personal. */
export function gåraugifter(spel) {
  const a = spel.anläggning;
  if (!a) return 0;
  let summa = 0;
  for (const [id, b] of Object.entries(BYGGEN)) if (a[id] && b.drift) summa += b.drift;
  for (const [id, p] of Object.entries(ANSTÄLLDA)) if (a[id]) summa += p.lön;
  summa += spel.förstaman?.lön ?? 0;
  return summa;
}

/**
 * Träningsmodifierare för en häst en given vecka.
 * Returnerar { form, start, styrka, energi, riskfaktor } som ADDERAS
 * respektive MULTIPLICERAS på grundträningens utbyte.
 */
export function gårdseffekt(spel, häst) {
  const a = spel.anläggning ?? {};
  const e = { form: 0, start: 0, styrka: 0, energi: 0, riskfaktor: 1 };
  const t = häst.träning;
  if (a.rakbana && (t === "start" || t === "intervall" || t === "kvalitet")) {
    e.form += 2; e.start += t === "start" ? 0.5 : 0;
  }
  if (a.backe && (t === "intervall" || t === "kvalitet")) {
    /* Avtagande utbyte: backen bygger ork upp mot ett tak kring 78 —
       en medelhäst vinner några punkter över en säsong, en stark häst
       nästan inget. Kärnegenskaper får inte växa linjärt i evighet. */
    e.styrka += 0.35 * Math.max(0, Math.min(1, (78 - (häst.styrka ?? 60)) / 30));
    e.riskfaktor *= 0.85;
  }
  if (a.vattenband) { e.energi += 4; e.riskfaktor *= 0.75; }
  if (a.hovslagare) e.riskfaktor *= 0.75;
  return e;
}

/** Läkningsbonus: veterinären kortar varje ny skada med en vecka (minst en). */
export const läkning = (spel, veckor) =>
  spel.anläggning?.veterinär ? Math.max(1, veckor - 1) : veckor;

/** Genomför ett bygge. Returnerar false om det inte går. */
export function bygg(spel, id) {
  const b = BYGGEN[id];
  const a = spel.anläggning;
  if (!b || !a || spel.kassa < b.pris) return false;
  if (id !== "boxar2" && a[id]) return false;
  spel.kassa -= b.pris;
  if (id === "boxar2") a.boxar += 2; else a[id] = true;
  skrivPress(spel, `${spel.stallnamn} bygger ut: ${b.namn.toLowerCase()}`,
    "Anläggningen växer med framgångarna", "positiv");
  return true;
}

export function anställ(spel, id) {
  const p = ANSTÄLLDA[id];
  if (!p || !spel.anläggning || spel.anläggning[id]) return false;
  spel.anläggning[id] = true;
  skrivPress(spel, `${p.namn} till ${spel.stallnamn}`, "Stallet förstärker", "positiv");
  return true;
}
export function sägUpp(spel, id) {
  if (!ANSTÄLLDA[id] || !spel.anläggning?.[id]) return false;
  spel.anläggning[id] = false;
  return true;
}
