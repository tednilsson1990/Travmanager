/**
 * PROPOSITIONSMOTORN (v92, tävlingsmanualen kap 2–3, 6.2, 7.1 — etapp A)
 *
 * Manualens kärna: propositionen avgör behörighet, klassetiketten är
 * bara vägledning — och spelaren ska ALLTID få en konkret förklaring
 * till utfall och regel. Den här modulen är förklaringsmaskinen:
 *
 *   NIVÅETIKETTEN läses ur startsumman mot samma klassgränser som
 *   kalendern bygger loppen av (KLASSER i data-kalender) — en etikett
 *   och ett "passar oftast i lopp mellan A och B", aldrig en spärr.
 *
 *   BEHÖRIGHETEN återanvänder kalenderns startförbud men svarar med
 *   FULLSTÄNDIGA siffror: inte "högst 250 tkr" utan "startsumman
 *   312 400 kr överstiger loppets tak 250 000 kr". Exakt orsak: pengar,
 *   ålder eller kön (kval, licens och serieplats kommer med sina system).
 *
 *   FYRA GRUPPER (6.2): rekommenderad, möjlig, riskfylld, ej berättigad.
 *   Riskfylld = startberättigad men sannolikt hårt inne i klassen —
 *   startsumman ligger i pengafönstrets nedre del, motståndet är
 *   dyrare. Möjlig = berättigad med en tydlig nackdel (distansen).
 *   Även ej berättigade lopp VISAS, med orsaken — så spelaren förstår
 *   nästa karriärsteg.
 *
 *   KLASSKLÄTTRINGSVARNINGEN (3.2): segern som både belöning och
 *   problem. Om förstapriset lyfter startsumman förbi ett tak som i dag
 *   är öppet, sägs det FÖRE anmälan — vilka lopptyper som stängs och
 *   vid vilken ny startsumma.
 *
 *   STARTPOÄNGEN (7.1): de fem senaste starterna, 400/200/100/50/25
 *   för placering 1–5 plus en poäng per vunna 100 kr i respektive lopp.
 *   Räknas ur hästens egen resultatrad (pris per start finns i datat).
 *   I etapp A visas poängen och prognosen; uttagningen den styr kommer
 *   i etapp B (överanmälan).
 *
 * Allt är ren läsning av häst + lopp + klassdata. Ingen slump, ingen
 * motorpåverkan — loppmotorn vet inte att modulen finns.
 */
import { kr } from "./engine-util.js";
import { KLASSER, startförbud } from "./data-kalender.js";
import { distanspassning } from "./engine-hast.js";

/* ------------------------------------------------------------------ */
/* Nivåetiketten (manualen 2.1, 3)                                     */
/* ------------------------------------------------------------------ */

const ETIKETTER = [
  { tak: 120000, namn: "låg klass" },
  { tak: 250000, namn: "vardagsklass" },
  { tak: 700000, namn: "hög vardagsklass" },
  { tak: Infinity, namn: "elitnivå" },
];

/** Etikett + pengafönstret hästen oftast passar i. Vägledning, aldrig spärr. */
export function klassEtikett(häst) {
  const etikett = ETIKETTER.find((e) => häst.intjänat < e.tak).namn;
  /* Fönstret: klasser vars pengavillkor hästen uppfyller i dag. */
  const öppna = KLASSER.filter((k) => {
    const kk = k.krav ?? {};
    if (kk.kön || kk.maxÅlder) return false;   // special­vägar räknas inte in i "oftast"
    if (kk.minInsprunget && häst.intjänat < kk.minInsprunget) return false;
    if (kk.maxInsprunget && häst.intjänat > kk.maxInsprunget) return false;
    return true;
  });
  const låg = Math.min(...öppna.map((k) => k.pris[0]), Infinity);
  const hög = Math.max(...öppna.map((k) => k.pris[0]), 0);
  return {
    etikett,
    text: hög > 0
      ? `${etikett} · startsumma ${kr(häst.intjänat)} kr · passar oftast i lopp med ${kr(låg)}–${kr(hög)} kr i förstapris`
      : `${etikett} · startsumma ${kr(häst.intjänat)} kr`,
  };
}

/* ------------------------------------------------------------------ */
/* Behörighet med exakt orsak (manualen 2.3, 6.2)                      */
/* ------------------------------------------------------------------ */

/**
 * Fullständig orsak med hästens och loppets siffror. Villkorsordningen
 * är samma som kalenderns startförbud — svaren får aldrig peka på olika
 * regler för samma häst och lopp.
 */
export function behörighet(häst, lopp) {
  const k = lopp.krav ?? {};
  if (k.kön && häst.kön !== k.kön)
    return { ok: false, orsak: `öppet endast för ${k.kön === "sto" ? "ston" : k.kön}` };
  if (k.minÅlder && häst.ålder < k.minÅlder)
    return { ok: false, orsak: `öppet från ${k.minÅlder} år — ${häst.namn} är ${häst.ålder}` };
  if (k.maxÅlder && häst.ålder > k.maxÅlder)
    return { ok: false, orsak: `öppet till och med ${k.maxÅlder} år — ${häst.namn} är ${häst.ålder}` };
  if (k.minInsprunget && häst.intjänat < k.minInsprunget)
    return { ok: false, orsak: `kräver minst ${kr(k.minInsprunget)} kr i startsumma — hästen har ${kr(häst.intjänat)}` };
  if (k.maxInsprunget && häst.intjänat > k.maxInsprunget)
    return { ok: false, orsak: `startsumman ${kr(häst.intjänat)} kr överstiger loppets tak ${kr(k.maxInsprunget)} kr` };
  /* Säkerhetsnät: skulle kalenderns förbud se något mer säger vi det rakt. */
  const övrigt = startförbud(häst, lopp);
  if (övrigt) return { ok: false, orsak: övrigt.toLowerCase() };
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Loppväljarens fyra grupper (manualen 6.2)                           */
/* ------------------------------------------------------------------ */

/**
 * Var i pengafönstret hästen ligger: 0 = fönstrets botten (billigast
 * i loppet, hårdast motstånd), 1 = taket (dyrast, gynnsam klass).
 * Öppna fönster (utan tak eller golv) skattas mot loppets nivå.
 */
function fönsterläge(häst, lopp) {
  const k = lopp.krav ?? {};
  const golv = k.minInsprunget ?? 0;
  const tak = k.maxInsprunget ?? null;
  if (tak) return (häst.intjänat - golv) / Math.max(1, tak - golv);
  /* Lägst-lopp utan tak: hårt inne om hästen är nära golvet. */
  if (golv > 0) return Math.min(1, (häst.intjänat - golv) / (golv * 0.8));
  return 0.5;
}

/**
 * Fyra grupper med orsak. Prioritering: ej berättigad (exakt orsak) →
 * riskfylld (hårt inne i klassen) → möjlig (tydlig nackdel: distansen)
 * → rekommenderad. Deterministiskt — bedömningens skärpa är etapp B-
 * material (manualen 6.3: precisionen ska bero på organisationen).
 */
export function loppläge(häst, lopp, nivå = 1) {
  const b = behörighet(häst, lopp);
  if (!b.ok) return { status: "ej", ordning: 3, not: b.orsak };
  /* Nivå 0 (manualen 6.3): utan förstaman finns ingen klassläsning —
     berättigad är allt spelet kan säga, och det sägs ärligt. */
  if (nivå === 0) {
    return { status: "möjlig", ordning: 1,
      not: "startberättigad — ingen lämplighetsbedömning utan förstaman" };
  }
  const läge = fönsterläge(häst, lopp);
  if (läge < 0.25) {
    const k = lopp.krav ?? {};
    return { status: "riskfylld", ordning: 2,
      not: `sannolikt hårt inne i klassen — startsumman ${kr(häst.intjänat)} kr ligger i pengafönstrets nedre del${k.maxInsprunget ? ` (${kr(k.minInsprunget ?? 0)}–${kr(k.maxInsprunget)} kr)` : ""}` };
  }
  const passning = distanspassning(häst, lopp.dist);
  if (passning < 0.4) {
    return { status: "möjlig", ordning: 1,
      not: `startberättigad, men ${lopp.dist} m är en tydlig nackdel — ${häst.namn} vill ha ${häst.distans?.optimal ?? 2140} m` };
  }
  const grund = { status: "rekommenderad", ordning: 0,
    not: `passar villkoren och ligger väl till i pengaklassen` };
  /* Nivå 2: siffrorna — fönsterläget i procent. */
  if (nivå >= 2 && (lopp.krav?.maxInsprunget || lopp.krav?.minInsprunget)) {
    grund.siffra = `startsumman på ${Math.round(läge * 100)} % av pengafönstret`;
  }
  return grund;
}

/**
 * BEDÖMNINGSNIVÅN (v96, manualen 6.3): lämplighetsbedömningens precision
 * beror på organisationen — regelfakta (behörighet, klassklättring) får
 * alla, men KLASSLÄSNINGEN är förstamannens hantverk.
 *   0 = ingen förstaman: bara berättigad/ej.
 *   1 = förstaman: de fyra grupperna.
 *   2 = rutinerad förstaman (taktikern, eller 5+ säsonger hos dig):
 *       plus siffrorna — fönsterläget i procent och senaste kända
 *       uttagningsgränsen i klassen.
 */
export function bedömningsnivå(spel) {
  const fm = spel.förstaman;
  if (!fm) return 0;
  if (fm.profil === "taktiker" || (fm.säsonger ?? 0) >= 5) return 2;
  return 1;
}

export const GRUPPNAMN = {
  rekommenderad: "Rekommenderade", möjlig: "Möjliga",
  riskfylld: "Riskfyllda", ej: "Inte berättigad",
};

/* ------------------------------------------------------------------ */
/* Klassklättringsvarningen (manualen 3.2)                             */
/* ------------------------------------------------------------------ */

/**
 * Vad en seger gör med hästens kommande klass: den nya startsumman och
 * vilka lopptyper som stängs. Bara pengavillkoret prövas — det är
 * klassmotorn. Tom lista = ingen varning behövs.
 */
export function klassklättring(häst, lopp) {
  const ny = häst.intjänat + lopp.pris[0];
  const stängs = KLASSER.filter((k) => {
    const kk = k.krav ?? {};
    if (!kk.maxInsprunget) return false;
    const öppenNu = häst.intjänat <= kk.maxInsprunget
      && (!kk.minInsprunget || häst.intjänat >= kk.minInsprunget);
    return öppenNu && ny > kk.maxInsprunget;
  }).map((k) => k.namn);
  return { ny, stängs };
}

/* ------------------------------------------------------------------ */
/* Startpoängen (manualen 7.1)                                         */
/* ------------------------------------------------------------------ */

const PLACERINGSPOÄNG = { 1: 400, 2: 200, 3: 100, 4: 50, 5: 25 };

/** De fem senaste starterna: placeringspoäng + en poäng per vunna 100 kr. */
export function startpoäng(häst) {
  const rader = (häst.resultat ?? []).slice(0, 5);
  const poäng = rader.reduce((a, r) =>
    a + (PLACERINGSPOÄNG[r.plats] ?? 0) + Math.floor((r.pris ?? 0) / 100), 0);
  return { poäng, starter: rader.length };
}

/** Begriplig prognos — manualen: viktigare än att spelaren räknar själv. */
export function startpoängText(sp) {
  if (sp.starter === 0) return "inga starter att räkna på — ostartade prioriteras via företrädesregler";
  if (sp.poäng >= 900) return "god chans att komma med vid överanmälan";
  if (sp.poäng >= 400) return "osäker plats vid hård överanmälan";
  return "låg prioritet vid överanmälan — resultatraden behöver stärkas";
}
