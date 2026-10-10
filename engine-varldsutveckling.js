/**
 * VÄRLDENS UTVECKLING (v111, utvecklingsplanen 20.8 — Teds viktigaste
 * punkt: "när du spelar tio säsonger ska världen vara helt annorlunda")
 *
 * Hästarna åldras och pensioneras redan i säsongsskiftet. Nu även
 * MÄNNISKORNA — etapp A: kuskkåren och sponsorsfären.
 *
 * KUSKARNA ÅLDRAS deterministiskt: grundåldern hashas ur namnet
 * (24–49 år vid karriärstart) och stiger med säsongerna. Vid 58+
 * hänger de äldsta upp sulkyn — högst två per säsongsskifte, äldst
 * först, så kåren glesnar i verklig takt i stället för att kollapsa.
 * Varje säsong DEBUTERAR en lärling ur namnpaketet: lågt arvode, låga
 * krav, ingen ryktbarhet — men hungrig relation. Efter tio säsonger
 * är kuskkåren en annan än den du började med.
 *
 * SPONSORSFÄREN omsätts: varannan säsong lämnar en sponsortyp sporten
 * (hash-vald bland dem du inte har avtal med) och syns inte i
 * erbjudandeflödet igen. Pressen berättar om alltihop — och därmed
 * inkorgen.
 *
 * Allt är hash-avgjort ur säsong och namn: ingen slump i motorflödet,
 * samma karriär ger samma värld.
 */
import { KUSKAR } from "./data-kuskar.js";
import { byggLärling } from "./data-namnpaket.js";
import { SPONSORTYPER } from "./engine-sponsor.js";

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Kuskens ålder en given säsong — grundåldern bor i namnet (24–55:
 * en verklig kår har veteraner nära pension redan dag ett). */
export const kuskålder = (namn, säsong) => 24 + (hash(namn) % 32) + (säsong - 1);

const PENSIONSÅLDER = 58;

/**
 * Generationsfasen — anropas ur nySäsong, EFTER säsongsräknaren höjts.
 * Returnerar pressraderna så säsongsmotorn kan skriva dem med sin
 * egen skrivPress (ingen presskoppling härifrån).
 */
export function utvecklaVärlden(spel) {
  const press = [];
  spel.kuskvärld = spel.kuskvärld ?? { pensionerade: [], lärlingar: [] };
  const kv = spel.kuskvärld;

  /* ---- Pensioneringarna: äldst först, högst två per säsong. ---- */
  const borta = new Set(kv.pensionerade);
  const kandidater = KUSKAR
    .filter((k) => !borta.has(k.namn) && kuskålder(k.namn, spel.säsong) >= PENSIONSÅLDER)
    .sort((a, b) => kuskålder(b.namn, spel.säsong) - kuskålder(a.namn, spel.säsong))
    .slice(0, 2);
  kandidater.forEach((k) => {
    kv.pensionerade.push(k.namn);
    const ålder = kuskålder(k.namn, spel.säsong);
    press.push({
      rubrik: `${k.namn} hänger upp sulkyn`,
      byline: k.ryktbarhet >= 70
        ? `En av sportens största lämnar vid ${ålder}. Banorna blir sig inte lika.`
        : `${ålder} år och tusentals lopp senare säger en trotjänare tack.`,
      ton: "neutral",
    });
  });

  /* ---- Lärlingsdebuten: en per säsong, från säsong 2. ---- */
  if ((spel.säsong ?? 1) >= 2) {
    /* Namnkrocken med 90-mannakåren är vanlig (initial + efternamn) —
       löpnumret stegas deterministiskt tills namnet är ledigt. */
    let lärling = null;
    for (let steg = 0; steg < 12 && !lärling; steg++) {
      const kandidat = byggLärling((kv.lärlingar.length + 1) + steg * 100);
      const upptaget = KUSKAR.some((k) => k.namn === kandidat.namn)
        || kv.lärlingar.some((k) => k.namn === kandidat.namn)
        || kv.pensionerade.includes(kandidat.namn);
      if (!upptaget) lärling = kandidat;
    }
    if (lärling) {
      lärling.debutSäsong = spel.säsong;
      kv.lärlingar.push(lärling);
      press.push({
        rubrik: `Lärlingen ${lärling.namn} tar licens`,
        byline: `Nytt namn i kuskkåren. Lågt arvode, ingen ryktbarhet — och allt att bevisa.`,
        ton: "positiv",
      });
    }
  }

  /* ---- Tränargenerationerna & banorna (v150, 20.8 B). ---- */
  skiftaTränare(spel).forEach((p) => press.push(p));
  renoveraBana(spel).forEach((p) => press.push(p));
  /* ---- Journalisterna (v152, 20.8 C). ---- */
  skiftaJournalist(spel).forEach((p) => press.push(p));

  /* ---- Sponsoromsättningen: varannan säsong lämnar en typ sporten. ---- */
  spel.sponsorvärld = spel.sponsorvärld ?? { borta: [] };
  if ((spel.säsong ?? 1) % 2 === 0) {
    const kvar = Object.entries(SPONSORTYPER).filter(([id]) =>
      !spel.sponsorvärld.borta.includes(id)
      && !(spel.sponsorer ?? []).some((a) => a.typId === id));
    if (kvar.length > 2) {
      const [id, t] = kvar[hash(`sponsor:${spel.säsong}:${spel.stallnamn ?? ""}`) % kvar.length];
      spel.sponsorvärld.borta.push(id);
      press.push({
        rubrik: `${t.namn}-pengarna lämnar traven`,
        byline: `Sponsorkartan ritas om — en dörr som stod öppen är stängd.`,
        ton: "negativ",
      });
    }
  }

  return press;
}

/* ------------------------------------------------------------------ */
/* LEGENDAREN (v146, plan 21.12 — "det legendariska mötet")            */
/* ------------------------------------------------------------------ */
/*
 * Varje generation har sin häst: Varenne, Victory Tilly, Readly
 * Express. Ungefär var åttonde säsong (hash-gatet, aldrig två
 * samtidigt) tar en av världens treåringar klivet till fenomen:
 * egenskaperna lyfts till 78–88, pressen döper epoken, och Travbladet
 * följer segersviten säsong för säsong tills sulkyn hängs upp — då
 * skrivs epilogen. Möter du fenomenet i ett lopp bokförs det i
 * loppvyn: att SLÅ legendaren är en karriärrubrik.
 *
 * Hästen är en VERKLIG världshäst — den startar, vinner och syns i
 * startlistor via världens vanliga maskineri. Det här lagret väljer
 * bara ut den, lyfter den och berättar om den. Boosten sker i
 * säsongsskiftet, aldrig i loppflödet: inga nya slumpkällor där.
 */

const LEGENDARRUBRIKER = [
  "Ett fenomen är fött",
  "»En sådan föds en gång per generation«",
  "Experterna eniga: det här är nästa stora",
];

/**
 * Prövas SIST i nySäsong, efter världens årgångar. Returnerar
 * pressrader; muterar spel.legendar och (vid födsel) världshästen.
 */
export function prövaLegendaren(spel) {
  const press = [];
  const värld = spel.värld;
  if (!värld?.hästar?.length) return press;
  const säsong = spel.säsong ?? 1;

  /* ---- Uppföljningen: fenomenet följs säsong för säsong. ---- */
  const leg = spel.legendar;
  if (leg?.status === "aktiv") {
    const h = värld.hästar.find((x) => x.id === leg.id || x.namn === leg.namn);
    if (!h) {
      /* Pensionerad av världens eget maskineri — epilogen. */
      leg.status = "pensionerad";
      leg.slutSäsong = säsong;
      press.push({
        rubrik: `${leg.namn} lämnar banorna — en epok är över`,
        byline: `${Math.max(0, (leg.segrarVidSlut ?? leg.segrarSnapshot ?? 0))} segrar, ${säsong - leg.föddSäsong} säsonger i strålkastarljuset. Hästen som definierade sin generation.`,
        ton: "neutral",
      });
      return press;
    }
    const delta = (h.segrar ?? 0) - (leg.segrarSnapshot ?? 0);
    leg.segrarSnapshot = h.segrar ?? 0;
    leg.segrarVidSlut = h.segrar ?? 0;
    press.push(delta >= 3
      ? { rubrik: `${leg.namn} bara fortsätter vinna`,
          byline: `${delta} segrar till i fjol — fenomenet visar inga sprickor. ${h.segrar} i karriären.`, ton: "neutral" }
      : { rubrik: `Har ${leg.namn} tappat stinget?`,
          byline: delta === 0
            ? `En hel säsong utan seger. Experterna tvekar — publiken hoppas.`
            : `${delta} ${delta === 1 ? "seger" : "segrar"} i fjol. Fenomen eller inte — åren tar sitt.`, ton: "neutral" });
    return press;
  }

  /* ---- Födelsen: hash-gatet, ungefär var åttonde säsong. ---- */
  if (säsong < 2) return press;
  if (hash(`legendar:${säsong}:${spel.stallnamn ?? ""}`) % 100 >= 13) return press;
  const kandidater = värld.hästar
    .filter((h) => (h.ålder ?? 9) <= 4 && !h.tillfällig)
    .sort((a, b) => (b.start + b.fart + b.styrka) - (a.start + a.fart + a.styrka));
  const h = kandidater[0];
  if (!h) return press;

  const bas = 78 + (hash(`legendar:nivå:${säsong}:${h.namn}`) % 9);   /* 78–86 */
  h.start = Math.max(h.start, bas - 2);
  h.fart = Math.max(h.fart, bas + 2);
  h.styrka = Math.max(h.styrka, bas);
  h.form = Math.max(h.form ?? 50, 72);
  h.hype = 92;
  h.legendar = true;

  spel.legendar = {
    id: h.id, namn: h.namn, föddSäsong: säsong, status: "aktiv",
    segrarSnapshot: h.segrar ?? 0, möten: 0, slagen: false,
  };
  press.push({
    rubrik: `${LEGENDARRUBRIKER[hash(`legendar:rubrik:${säsong}`) % LEGENDARRUBRIKER.length]}: ${h.namn}`,
    byline: `${h.ålder} år och redan omskriven i varje stallbacke. Tränarna som mött ${h.kön === "sto" ? "henne" : "honom"} säger samma sak: det här är något annat.`,
    ton: "positiv",
  });
  return press;
}

/* ------------------------------------------------------------------ */
/* TRÄNARGENERATIONERNA & BANORNA (v150, plan 20.8 B)                  */
/* ------------------------------------------------------------------ */
/*
 * Kuskarna åldras sedan v111 — nu TRÄNARNA: grundåldern hashas ur
 * namnet (38–61 vid karriärstart), och vid 64+ lämnar den äldste över
 * till en arvtagare. Stallet består — hästarna, filosofin och det
 * upparbetade — men namnet på boxdörren byts, och styrkan justeras ett
 * snäpp: en ny generation har ett nytt grepp, på gott och ont. Högst
 * ett skifte per säsong: generationsväxling, inte utrensning.
 *
 * Banorna: ungefär var fjärde säsong bygger någon av landets banor om
 * — publikanläggning, ny belysning, omlagt underlag. Etapp A är
 * Travbladets värld: pressen skriver, spel.banvärld minns. (Effekter
 * på publik/underlag antecknade till 20.3-vädret, där de hör hemma.)
 */
import { TRÄNARFÖR, TRÄNAREFTER } from "./engine-varld.js";
import { BANOR } from "./data-namnpaket.js";

export const tränarålder = (namn, säsong) => 38 + (hash(`tränare:${namn}`) % 24) + (säsong - 1);
const TRÄNARPENSION = 64;

/** Tränarskiftet — anropas ur utvecklaVärlden. Returnerar pressrader. */
export function skiftaTränare(spel) {
  const press = [];
  const värld = spel.värld;
  if (!värld?.stall?.length) return press;
  spel.tränarvärld = spel.tränarvärld ?? { skiften: [] };

  /* Arvtagare räknar sin ålder från TILLTRÄDET och börjar unga (30–45)
     — annars ärver de karriärstartens årtal och pensioneras i kedja. */
  const tillträde = new Map(spel.tränarvärld.skiften.map((s) => [s.tillträdande, s.säsong]));
  const åldern = (namn) => tillträde.has(namn)
    ? 30 + (hash(`tränare:${namn}`) % 16) + (spel.säsong - tillträde.get(namn))
    : tränarålder(namn, spel.säsong);
  const kandidater = värld.stall
    .filter((st) => !st.rival)                     /* rivalen har sin egen båge */
    .filter((st) => åldern(st.tränare) >= TRÄNARPENSION)
    .sort((a, b) => åldern(b.tränare) - åldern(a.tränare));
  const st = kandidater[0];
  if (!st) return press;

  /* Arvtagaren: krocksäkrat namn ur poolerna, deterministiskt stegat. */
  const upptagna = new Set(värld.stall.map((s) => s.tränare));
  spel.tränarvärld.skiften.forEach((s) => upptagna.add(s.tillträdande));
  const frö = hash(`arvtagare:${st.tränare}:${spel.säsong}`);
  let ny = null;
  for (let steg = 0; steg < 40 && !ny; steg++) {
    const namn = `${TRÄNARFÖR[(frö + steg) % TRÄNARFÖR.length]} ${TRÄNAREFTER[(Math.floor(frö / 7) + steg * 3) % TRÄNAREFTER.length]}`;
    if (!upptagna.has(namn)) ny = namn;
  }
  if (!ny) return press;

  const gammal = st.tränare;
  const ålder = åldern(gammal);
  st.tränare = ny;
  /* Nytt grepp: ±0,08 i styrka, hash-avgjort — arvtagare är inte kopior. */
  const riktning = hash(`grepp:${ny}`) % 2 === 0 ? 1 : -1;
  st.styrka = Math.max(0.3, Math.min(1.0, Math.round((st.styrka + riktning * 0.08) * 100) / 100));
  spel.tränarvärld.skiften.push({ säsong: spel.säsong, stallnamn: st.namn, avgående: gammal, tillträdande: ny });
  spel.tränarvärld.skiften = spel.tränarvärld.skiften.slice(-20);

  press.push({
    rubrik: `${gammal} slutar — ${ny} tar över ${st.namn}`,
    byline: `${ålder} år och ett helt yrkesliv på stallbacken. Arvtagaren ${riktning > 0 ? "lär vässa laget" : "har stora skor att fylla"}.`,
    ton: "neutral",
  });
  return press;
}

/** Banrenoveringen — vart ~fjärde säsongsskifte bygger en bana om. */
export function renoveraBana(spel) {
  const press = [];
  if ((spel.säsong ?? 1) < 2) return press;
  if (hash(`banbygge:${spel.säsong}`) % 100 >= 26) return press;
  spel.banvärld = spel.banvärld ?? { renoverade: {} };
  const banor = Object.keys(BANOR)
    .filter((id) => (spel.banvärld.renoverade[id] ?? -9) < (spel.säsong - 6));
  if (!banor.length) return press;
  const id = banor[hash(`banval:${spel.säsong}`) % banor.length];
  spel.banvärld.renoverade[id] = spel.säsong;
  const projekt = ["ny publikanläggning", "omlagt underlag och ny belysning", "utbyggd stallbacke"][hash(`projekt:${spel.säsong}`) % 3];
  press.push({
    rubrik: `${BANOR[id].namn} bygger om`,
    byline: `Spaden i marken i vinter: ${projekt}. ${id === spel.hemmabana ? "Din hemmabana rustar — publiken lär märka skillnaden." : "Banorna rustar ikapp varandra."}`,
    ton: "positiv",
  });
  return press;
}

/* ------------------------------------------------------------------ */
/* JOURNALISTERNA (v152, plan 20.8 C — redaktionen åldras också)       */
/* ------------------------------------------------------------------ */
/*
 * Travbladets tre signaturer — krönikören, siffrorna, nyhetsdesken —
 * är inte eviga. Ungefär var femte säsong lägger en av dem ner pennan
 * och en ny röst tar över spalten. Allt som skrivs därefter bär den
 * nya signaturen: presslagret frågar signaturen(spel, roll) i stället
 * för att läsa konstanten.
 */
import { JOURNALISTER, JOURNALISTPOOL } from "./data-namnpaket.js";

const ROLLRUBRIK = { krönikör: "krönikan", siffror: "siffersidan", nyheter: "nyhetsdesken" };

/** Den som HÅLLER pennan just nu — presslagrets enda väg till namnet. */
export function signaturen(spel, roll) {
  return spel?.pressvärld?.journalister?.[roll] ?? JOURNALISTER[roll];
}

/** Journalistbytet — anropas ur utvecklaVärlden. Returnerar pressrader. */
export function skiftaJournalist(spel) {
  const press = [];
  if ((spel.säsong ?? 1) < 3) return press;
  if (hash(`journalist:${spel.säsong}`) % 100 >= 20) return press;
  spel.pressvärld = spel.pressvärld ?? { journalister: {}, tidigare: [] };
  const pv = spel.pressvärld;
  pv.tidigare = pv.tidigare ?? [];

  const roller = Object.keys(JOURNALISTER);
  const roll = roller[hash(`journalistroll:${spel.säsong}`) % roller.length];
  const avgående = signaturen(spel, roll);

  const upptagna = new Set([
    ...roller.map((r) => signaturen(spel, r)),
    ...pv.tidigare.map((x) => x.namn),
  ]);
  const frö = hash(`journalistny:${spel.säsong}`);
  let ny = null;
  for (let steg = 0; steg < JOURNALISTPOOL.length && !ny; steg++) {
    const kandidat = JOURNALISTPOOL[(frö + steg) % JOURNALISTPOOL.length];
    if (!upptagna.has(kandidat)) ny = kandidat;
  }
  if (!ny) return press;                          /* hela poolen förbrukad */

  pv.journalister[roll] = ny;
  pv.tidigare.push({ namn: avgående, roll, säsong: spel.säsong });
  pv.tidigare = pv.tidigare.slice(-12);
  const nyVinkel = VINKLAR[Object.keys(VINKLAR)[hash(`vinkel:${ny}`) % Object.keys(VINKLAR).length]];
  press.push({
    rubrik: `${avgående} lägger ner pennan`,
    byline: `Efter alla år tackar en av tidningens röster för sig. ${ny} tar över ${ROLLRUBRIK[roll] ?? "spalten"} — ${nyVinkel.karaktär}. Spalten blir sig inte lik.`,
    ton: "neutral",
  });
  return press;
}

/* ------------------------------------------------------------------ */
/* JOURNALISTVINKLARNA (v161, plan 28.5 a)                             */
/* ------------------------------------------------------------------ */
/*
 * En penna är inte neutral — den har en blick. Vinkeln hashas ur
 * NAMNET, så den följer personen: när generationsskiftet (v152)
 * sätter en ny signatur på spalten byter spalten karaktär. Det är så
 * en redaktion åldras på riktigt.
 */
export const VINKLAR = {
  entusiast: {
    ord: "entusiasten",
    karaktär: "en som hellre skriver om det som lyfter sporten",
    samtalston: "— Ärligt talat hoppas jag på er. Sporten behöver sådana här historier.",
  },
  granskare: {
    ord: "granskaren",
    karaktär: "en som aldrig låter en bortförklaring passera",
    samtalston: "— Jag ska vara ärlig: siffrorna talar emot er. Övertyga mig.",
  },
  rubrikmakare: {
    ord: "rubrikmakaren",
    karaktär: "en som vet att förstasidor säljs på känslor",
    samtalston: "— Ge mig ett citat folk minns. Det är så förstasidor görs.",
  },
};

/** Pennans vinkel — följer namnet, inte rollen. */
export function journalistvinkel(spel, roll) {
  const namn = signaturen(spel, roll);
  const nycklar = Object.keys(VINKLAR);
  const id = nycklar[hash(`vinkel:${namn}`) % nycklar.length];
  return { id, namn, ...VINKLAR[id] };
}
