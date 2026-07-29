/**
 * HÄSTÄGARNA SOM KÄRNSYSTEM (v84, kap 7)
 *
 * Ett uppdragsstall lever på sina ägare — inte på publiken. Varje ägare
 * är en person med typ, temperament och minne:
 *
 *   TYPEN avgörs deterministiskt av namnet (samma ägare, samma person,
 *   varje karriär) och färgar allt: hur hårt resultat väger, hur länge
 *   tålamodet räcker, vad arvodet ligger på och vad ägaren egentligen
 *   vill ha ut av sitt hästägande.
 *
 *   NÖJDHETEN har två dimensioner, för så är det i verkligheten: en
 *   ägare kan vara nöjd sportsligt men missnöjd med kommunikationen —
 *   eller tvärtom. Sporten byggs av loppen (efterLopp skalar sina delta
 *   med typens resultatkänsla), kommunikationen byggs av kontakt: den
 *   svalnar varje tyst vecka och lyfts av möten och av att ägarens häst
 *   faktiskt kommer till start.
 *
 *   Relationen som resten av spelet läser (hästerbjudanden i
 *   engine-personal, krav i engine-vecka) är sammanvägningen av de två.
 *   Ingen befintlig kod behöver ändras för att förstå det nya.
 *
 * KONSEKVENSERNA: en riktigt missnöjd ägare flyttar hästen — med besked
 * i pressen, inte i tysthet. Det prövas varje vecka i körVecka.
 */
import { klamp, plock, slump } from "./engine-util.js";
import { ÄGARTYPER } from "./data-agare.js";

/** Deterministisk typ ur ägarnamnet — samma ägare är samma person. */
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function ägartyp(namn) {
  const nycklar = Object.keys(ÄGARTYPER);
  return nycklar[hash(namn) % nycklar.length];
}

/**
 * Säkrar att ägaren har en full profil. Äldre sparfiler har bara
 * { relation, hästerbjudet } — de får typ och dimensioner utan att
 * tappa den relation de redan byggt.
 */
export function säkraÄgarprofil(spel, namn) {
  if (!namn) return null;
  spel.ägarrelationer = spel.ägarrelationer ?? {};
  const r = spel.ägarrelationer[namn] ?? { relation: 50, hästerbjudet: false };
  if (!r.typ) {
    r.typ = ägartyp(namn);
    r.sport = r.relation ?? 50;      // migrering: gamla relationen var sporten
    r.komm = 55;
    r.senastMöte = null;
    r.tålamodBett = false;           // "be om tålamod" — en gång per krav
  }
  spel.ägarrelationer[namn] = r;
  return r;
}

/** Sammanvägningen som resten av spelet läser via r.relation. */
function vägSamman(r) {
  const t = ÄGARTYPER[r.typ] ?? {};
  /* Kommunikationsvikt per typ: småägaren och travfamiljen bryr sig om
     dialogen, storsatsaren nästan bara om resultaten. */
  const kv = t.kommvikt ?? 0.3;
  r.relation = klamp(Math.round(r.sport * (1 - kv) + r.komm * kv));
}

/** Sportslig nöjdhet — anropas där ägarrelation() förr fick sina delta. */
export function ägarSport(spel, namn, delta) {
  const r = säkraÄgarprofil(spel, namn);
  if (!r) return;
  const känsla = ÄGARTYPER[r.typ]?.resultatkänsla ?? 1;
  /* Resultatkänslan skalar smällarna hårdare än glädjen — en storsatsare
     glömmer aldrig en floppad favorit, men tar segrar för givna. */
  r.sport = klamp(r.sport + delta * (delta < 0 ? känsla : (0.6 + känsla * 0.4)));
  vägSamman(r);
}

/** Kommunikation: kontakt värmer. */
export function ägarKontakt(spel, namn, delta) {
  const r = säkraÄgarprofil(spel, namn);
  if (!r) return;
  r.komm = klamp(r.komm + delta);
  vägSamman(r);
}

/**
 * Veckans tystnad. Alla ägare med häst i stallet svalnar en aning i
 * kommunikationen — det är därför mötena finns. Vid riktig missnöjdhet
 * flyttas hästen: ägaren är en person, inte en resurskran.
 * skrivPress följer med som argument (samma mönster som rekordmodulen)
 * så att ägarmotorn slipper importera veckomotorn tillbaka.
 * Returnerar hästar som lämnade (körVecka plockar bort dem).
 */
export function ägarVecka(spel, skrivPress) {
  const lämnar = [];
  const ägare = new Set(spel.stall.map((h) => h.ägare).filter(Boolean));
  ägare.forEach((namn) => {
    const r = säkraÄgarprofil(spel, namn);
    r.komm = klamp(r.komm - 1.2);
    vägSamman(r);
    if (r.relation < 18 && slump() < 0.5) {
      const häst = spel.stall.find((h) => h.ägare === namn);
      if (häst) {
        lämnar.push(häst);
        skrivPress(spel, `${namn} flyttar ${häst.namn}`,
          `Relationen med ${spel.stallnamn} har varit ansträngd en tid. Nu tar ägaren konsekvensen.`, "dålig");
        r.sport = klamp(r.sport + 10);   // luften går ur konflikten
        r.komm = klamp(r.komm + 10);
        vägSamman(r);
      }
    }
  });
  return lämnar;
}

/* ------------------------------------------------------------------ */
/* Ägarmötet — kontorets viktigaste knapp                              */
/* ------------------------------------------------------------------ */

export const MÖTESVAL = [
  { id: "lyssna", rubrik: "Lyssna och håll ägaren nära",
    följd: "Kommunikationen lyfter rejält. Kostar bara en förmiddag." },
  { id: "tålamod", rubrik: "Be om tålamod med hästen",
    följd: "Kravet förlängs två starter — men en resultatägare hör bara ursäkter." },
];

/**
 * Mötet genomförs direkt — inga dolda tärningar. "Lyssna" bygger
 * kommunikation; "tålamod" förlänger kravet en gång per krav, och typen
 * avgör hur begäran tas emot: småägaren nickar, storsatsaren himlar.
 */
export function hållMöte(spel, namn, valId) {
  const r = säkraÄgarprofil(spel, namn);
  if (!r) return null;
  r.senastMöte = { säsong: spel.säsong ?? 1, vecka: spel.vecka };
  if (valId === "lyssna") {
    ägarKontakt(spel, namn, 26);
    return { text: `${namn} uppskattade samtalet. »Det är sånt här som gör att man stannar.«` };
  }
  if (valId === "tålamod") {
    const t = ÄGARTYPER[r.typ] ?? {};
    const häst = spel.stall.find((h) => h.ägare === namn && h.krav);
    if (!häst || r.tålamodBett) {
      ägarKontakt(spel, namn, 8);
      return { text: `${namn} lyssnade. »Vi ses vid banan.«` };
    }
    r.tålamodBett = true;
    häst.krav = { ...häst.krav, antal: häst.krav.antal + 2 };
    const förstående = (t.tålamod ?? 1) >= 1;
    ägarKontakt(spel, namn, förstående ? 14 : 4);
    ägarSport(spel, namn, förstående ? 2 : -5);
    return { text: förstående
      ? `${namn} nickade långsamt. »Hästar tar den tid hästar tar. Två starter till.«`
      : `${namn} suckade. »Två starter. Sen vill jag se resultat — inte förklaringar.«` };
  }
  return null;
}

/** Kontorets lista: varje ägare med hästar hos dig, med hela läget. */
export function ägarlista(spel) {
  const perÄgare = new Map();
  spel.stall.forEach((h) => {
    if (!h.ägare) return;
    if (!perÄgare.has(h.ägare)) perÄgare.set(h.ägare, []);
    perÄgare.get(h.ägare).push(h);
  });
  return [...perÄgare.entries()].map(([namn, hästar]) => {
    const r = säkraÄgarprofil(spel, namn);
    return { namn, hästar, ...r, typinfo: ÄGARTYPER[r.typ] };
  }).sort((a, b) => a.relation - b.relation);
}

/** Nya ägare ska också få veta att deras start är en kontakt. */
export function ägarEfterStart(spel, häst) {
  if (häst?.ägare) ägarKontakt(spel, häst.ägare, 5);
}

/* Anteckning för läsaren: plock importeras inte i onödan — den används
   av framtida spontanägare. */
export const slumpaÄgartyp = () => plock(Object.keys(ÄGARTYPER));


/**
 * ÄGARLÖFTENA (v110, inkorgens ägarsamtal): "jag lovar att planera en
 * start" är ett riktigt val med riktig risk. Löftet sparas med
 * deadline; hålls det (hästen startar i tid) stärks kommunikationen,
 * bryts det rasar den — och ägaren säger det i inkorgen veckan därpå.
 * Anropas ur körVecka; ren att prova isolerat.
 */
export function följUppÄgarlöften(spel) {
  const löften = spel.ägarlöften ?? {};
  Object.entries(löften).forEach(([namn, löfte]) => {
    const häst = spel.stall.find((h) => h.id === löfte.hästId);
    if (!häst) { delete löften[namn]; return; }
    if ((häst.senasteStartVecka ?? 0) >= löfte.från) {
      ägarKontakt(spel, namn, 5);
      delete löften[namn];
    } else if (spel.vecka > löfte.deadline) {
      ägarKontakt(spel, namn, -12);
      (spel.löftesbrott ??= {})[namn] = spel.vecka;
      delete löften[namn];
    }
  });
}
