/**
 * TRAVSÄLLSKAPET (v124, kapitel 24 etapp A — Teds idé: "komma med i
 * styrelsen på sin hemmabana och vara med och påverka")
 *
 * Djupt travrealistiskt: svenska banor ägs av travsällskap, och en
 * framgångsrik tränare som väljs in i styrelsen är exakt så
 * inflytande fungerar. Etapp A: INVALET (förtjänas — aldrig köps),
 * MOTIONERNA (en per säsong, deterministiskt vald ur bankänsligt
 * urval) och RÖSTEN (du har EN röst av sju — påverka, inte
 * bestämma). Utfallet ändrar hemmabanans verkliga förhållanden:
 * open stretch-motionen ger banan öppet innerspår i ALLA lopp där —
 * dina och världens.
 *
 * Intressekonflikten är dramat: rösta för det som gynnar ditt eget
 * stall och Travbladet ställer jävsfrågan. Realismvakten (22.6):
 * orden är sällskapets — motion, ledamot, valberedning — aldrig
 * spelifieringens.
 */
import { BANOR } from "./data-namnpaket.js";

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export const INVALSKRAV = { renommé: 42, säsonger: 2 };

/** Kvalificerar tränaren för valberedningens samtal? */
export function invalsläge(spel) {
  const säsonger = (spel.säsong ?? 1) - 1;
  const s = spel.sällskap ?? {};
  return {
    kvalar: (spel.renommé ?? 0) >= INVALSKRAV.renommé
      && säsonger >= INVALSKRAV.säsonger
      && !s.ledamot
      && s.avböjtSäsong !== (spel.säsong ?? 1),
    ledamot: !!s.ledamot,
  };
}

export function säkraSällskap(spel) {
  spel.sällskap = spel.sällskap ?? { ledamot: false, motioner: [] };
  return spel.sällskap;
}

/** Motionskatalogen — varje post vet sin verkliga effekt. */
export const MOTIONER = {
  openStretch: {
    rubrik: "Öppna innerspåret på upploppet",
    text: "Styrelsen föreslår att banan bygger om upploppet med open stretch — ett extra innerspår som öppnas de sista metrarna. Dyrt, men loppen blir rättvisare för hästar i rygg.",
    gynnarStallet: true,   /* fler vägar ur ryggläge gynnar aktiva tränare */
  },
  breddpriser: {
    rubrik: "Höjda priser i breddloppen",
    text: "Prispengarna i banans lägre klasser höjs med tio procent, finansierat ur publikintäkterna. Vardagstränarnas motion — och du är en av dem.",
    gynnarStallet: true,
  },
  publiksatsning: {
    rubrik: "Publiksatsning på tävlingsdagarna",
    text: "Ny familjeläktare och sänkta entrépriser. Kostar på kort sikt, bygger banan på lång.",
    gynnarStallet: false,
  },
  ungdomssatsning: {
    rubrik: "Ponnytrav och ungdomsverksamhet",
    text: "Sällskapet avsätter medel för ponnytravskola. Ger inget i år — ger allt om tjugo.",
    gynnarStallet: false,
  },
};

/** Säsongens motion — deterministisk, och aldrig en som redan gått igenom. */
export function säsongsmotion(spel) {
  const s = säkraSällskap(spel);
  if (!s.ledamot) return null;
  const beslutade = new Set((s.motioner ?? []).filter((m) => m.utfall === "bifall").map((m) => m.id));
  const hemma = BANOR[spel.hemmabana];
  const kandidater = Object.keys(MOTIONER).filter((id) => {
    if (beslutade.has(id)) return false;
    if (id === "openStretch" && (hemma?.openStretch || spel.banutveckling?.openStretch)) return false;
    return true;
  });
  if (!kandidater.length) return null;
  const redan = (s.motioner ?? []).find((m) => m.säsong === (spel.säsong ?? 1));
  if (redan) return redan.utfall ? null : redan;
  const id = kandidater[hash(`motion:${spel.säsong}:${spel.hemmabana}`) % kandidater.length];
  const motion = { id, säsong: spel.säsong ?? 1, utfall: null, dinRöst: null };
  s.motioner = [...(s.motioner ?? []), motion];
  return motion;
}

/**
 * Rösten: du är en av sju. Övriga sex röstar hash-avgjort med lätt
 * övervikt för bifall (styrelser lägger sällan fram det de tänker
 * fälla). Bifallen motion får sin VERKLIGA effekt direkt.
 */
export function rösta(spel, motionId, röst) {
  const s = säkraSällskap(spel);
  const motion = (s.motioner ?? []).find((m) => m.id === motionId && !m.utfall);
  if (!motion || !s.ledamot) return null;
  motion.dinRöst = röst;
  let ja = röst === "ja" ? 1 : 0;
  for (let i = 0; i < 6; i++) {
    if (hash(`röst:${motionId}:${motion.säsong}:${i}:${spel.hemmabana}`) % 100 < 58) ja++;
  }
  motion.röster = { ja, nej: 7 - ja };
  motion.utfall = ja >= 4 ? "bifall" : "avslag";
  if (motion.utfall === "bifall") {
    spel.banutveckling = spel.banutveckling ?? {};
    if (motion.id === "openStretch") spel.banutveckling.openStretch = true;
    if (motion.id === "breddpriser") spel.banutveckling.breddpriser = true;
    if (motion.id === "publiksatsning") spel.banutveckling.publik = (spel.banutveckling.publik ?? 0) + 1;
    if (motion.id === "ungdomssatsning") spel.banutveckling.ungdom = true;
  }
  /* Jävsfrågan: röstade du ja till det som gynnar ditt stall, och det
     gick igenom, skriver Travbladet. Trovärdigheten är valutan. */
  const jäv = MOTIONER[motion.id]?.gynnarStallet && röst === "ja" && motion.utfall === "bifall";
  return { motion, jäv };
}

/**
 * Hemmabanans utveckling tillämpad på ett lopp — anropas där loppen
 * konsumeras (spelarens lista, världens körning, AI-kartan) så
 * beslutet gäller ALLA lopp på banan, inte bara dina.
 */
export function justeraFörBanutveckling(spel, lopp) {
  const hemma = BANOR[spel.hemmabana];
  if (!hemma || lopp.banaNamn !== hemma.namn) return lopp;
  const u = spel.banutveckling ?? {};
  if (u.openStretch && !lopp.openStretch) lopp = { ...lopp, openStretch: true };
  if (u.breddpriser && (lopp.nivå ?? 50) <= 46 && !lopp.breddhöjd) {
    lopp = { ...lopp, breddhöjd: true,
      pris: (lopp.pris ?? []).map((p) => Math.round(p * 1.1)),
      förstapris: Math.round((lopp.förstapris ?? lopp.pris?.[0] ?? 0) * 1.1) };
  }
  return lopp;
}
