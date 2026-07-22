import { rnd, int, plock, klamp, blanda } from "./engine-util.js";
import { nyHäst, TRÄNING } from "./engine-hast.js";
import { nyttNamn } from "./data-namn.js";
import { KUSKAR } from "./data-kuskar.js";
import { veckansLopp, startförbud } from "./data-kalender.js";
import { beräknaStreck } from "./engine-streck.js";

/**
 * VÄRLDEN
 *
 * Motståndarna är inte längre slumptal som föds i anmälan och försvinner vid
 * målgång. De är individer med namn, meriter och ett stall bakom sig. De
 * tävlar mot varandra även de veckor du inte möter dem, deras startsummor
 * växer och flyttar dem mellan klasserna, och de tränas efter sin tränares
 * filosofi.
 *
 * Det är därför en seger betyder något: du tog den från någon.
 *
 * Modulen känner till simuleringen, men simuleringen känner inte till den.
 */

const STALLNAMN = [
  "Stall Vinterfrid", "Hägglunds", "Team Solkatt", "Stall Nyberg",
  "Bergslagens Trav", "Stall Kvarnbacken", "Ulriksdal Invest", "Stall Tre Kronor",
  "Stall Norrsken", "Team Fager", "Stall Ekhult", "Björkedals Trav",
  "Stall Vidöppet", "Team Storm", "Stall Rosendal", "Kviberga Trav",
  "Stall Havsvind", "Team Lyckan", "Stall Fridhem", "Ödegårds Trav",
];
const TRÄNARFÖR = ["Anders", "Karin", "Petter", "Lena", "Jonas", "Marie", "Stefan",
  "Camilla", "Roger", "Ulrika", "Kent", "Annika", "Micke", "Pia", "Lars", "Eva"];
const TRÄNAREFTER = ["Kilberg", "Sandvall", "Ryhd", "Norrman", "Tollner", "Brandt",
  "Ekengren", "Sjölin", "Haglund", "Persén", "Vidmark", "Örn", "Lindkvist",
  "Bohlin", "Trygg", "Almén"];

/**
 * Tränarfilosofier. De styr hur AI-stallen sköter och startar sina hästar,
 * och gör att stallen skiljer sig åt över en säsong.
 */
export const FILOSOFIER = [
  { namn: "startar ofta", vilaTröskel: 42, träning: "intervall", startvilja: 0.85 },
  { namn: "vilar mycket", vilaTröskel: 74, träning: "lugnt", startvilja: 0.45 },
  { namn: "hårda jobb", vilaTröskel: 58, träning: "kvalitet", startvilja: 0.7 },
  { namn: "tålmodig", vilaTröskel: 66, träning: "lugnt", startvilja: 0.55 },
  { namn: "startsnabb skola", vilaTröskel: 55, träning: "start", startvilja: 0.7 },
];

/** Bygger världen vid karriärstart. */
export function byggVärld(antalStall = 20) {
  const stall = [];
  const hästar = [];
  const namn = blanda(STALLNAMN).slice(0, antalStall);
  const tränare = blanda(TRÄNARFÖR);
  const efter = blanda(TRÄNAREFTER);

  namn.forEach((stallnamn, i) => {
    const styrka = i < 3 ? rnd(0.82, 1.0) : i < 7 ? rnd(0.6, 0.85) : rnd(0.42, 0.68);
    const id = i + 1;
    stall.push({
      id,
      namn: stallnamn,
      tränare: `${tränare[i % tränare.length]} ${efter[i % efter.length]}`,
      filosofi: plock(FILOSOFIER),
      styrka: Math.round(styrka * 100) / 100,
      insprunget: 0, starter: 0, segrar: 0,
    });

    const antalHästar = 6 + Math.round(styrka * 5);
    for (let h = 0; h < antalHästar; h++) {
      const bas = 30 + styrka * 40;
      const häst = nyHäst({
        namn: nyttNamn(),
        ålder: int(3, 10),
        start: klamp(Math.round(rnd(bas - 10, bas + 18))),
        fart: klamp(Math.round(rnd(bas - 10, bas + 18))),
        styrka: klamp(Math.round(rnd(bas - 10, bas + 18))),
      });
      häst.egen = false;
      häst.stallId = id;
      häst.form = klamp(Math.round(rnd(40, 68)));
      häst.energi = klamp(Math.round(rnd(70, 95)));
      /* Meriterna byggs upp bakåt så att propositionerna fungerar redan
         första veckan — annars vore alla lopp öppna för alla. */
      häst.starter = int(3, 45);
      häst.segrar = Math.round(häst.starter * klamp((bas - 30) / 120, 0.02, 0.35) * rnd(0.5, 1.4));
      häst.intjänat = Math.round(häst.starter * rnd(4000, 24000) * (0.4 + styrka));
      häst.träning = plock(Object.keys(TRÄNING));
      häst.senasteStartVecka = 0;
      hästar.push(häst);
    }
  });
  return { stall, hästar, vecka: 1 };
}

/** Hästar som får starta i loppet och inte redan är anmälda den här veckan. */
export function tillgängliga(värld, lopp, vecka, upptagna) {
  return värld.hästar.filter((h) => {
    if (h.skada > 0 || h.senasteStartVecka === vecka || upptagna.has(h.id)) return false;
    if (startförbud(h, lopp)) return false;
    /* Tränarens filosofi avgör hur ofta hästen kommer till start, och en
       trött häst stannar hemma. Utan det startar varje häst varannan vecka
       och hela världen körs sönder på en säsong. */
    const st = värld.stall.find((s) => s.id === h.stallId);
    const fil = st ? st.filosofi : FILOSOFIER[0];
    if (h.energi < fil.vilaTröskel) return false;
    const veckorSedan = vecka - (h.senasteStartVecka || 0);
    if (veckorSedan < 2 && Math.random() > fil.startvilja * 0.35) return false;
    return true;
  });
}

/**
 * Bygger startfältet ur världen. Hästarna sorteras efter meriter och ett
 * sammanhängande snitt runt loppets nivå väljs, så att fältet håller ihop i
 * klass i stället för att blanda toppstall med lärlingshästar.
 */
export function byggFält(värld, lopp, vecka, upptagna, egenHäst = null) {
  const platser = (lopp.startande || 12) - (egenHäst ? 1 : 0);
  const kandidater = tillgängliga(värld, lopp, vecka, upptagna)
    .sort((a, b) => b.intjänat - a.intjänat);

  const fönster = Math.max(0, kandidater.length - platser);
  const start = Math.round(fönster * klamp(1 - lopp.nivå / 78, 0, 1));
  const valda = kandidater.slice(start, start + platser);

  /* Räcker inte behöriga hästar fylls resten på med tillfälliga. Hellre det
     än ett inställt lopp — men de bokförs inte i världen. */
  while (valda.length < platser) {
    const fyll = nyHäst({ ålder: int(4, 9) });
    fyll.egen = false;
    fyll.tillfällig = true;
    fyll.form = klamp(Math.round(rnd(40, 65)));
    fyll.starter = int(5, 30);
    fyll.intjänat = Math.round(fyll.starter * rnd(4000, 15000));
    valda.push(fyll);
  }
  return egenHäst ? [egenHäst, ...valda] : valda;
}

/** AI-kuskens körorder, utifrån hästens egenskaper och spåret. */
function välTaktik(häst, lopp) {
  const bakspår = lopp.start === "bil" ? häst.spår >= 9 : häst.spår >= 8;
  if (bakspår) return Math.random() < 0.65 ? "skydd" : "spurt";
  if (häst.start >= 66 && Math.random() < 0.55) return "ledning";
  if (häst.fart >= 64 && häst.start < 55) return "spurt";
  if (häst.styrka >= 64 && Math.random() < 0.3) return "utv";
  return Math.random() < 0.5 ? "rygg" : "skydd";
}

/** Lottar spår, kuskar och körorder på ett fält. */
export function rustaFält(fält, lopp, egenKusk = null, egenTaktik = null) {
  const antal = fält.length;
  const spårnr = blanda(Array.from({ length: antal }, (_, i) => i + 1));
  const kuskar = blanda(KUSKAR.filter((k) => !egenKusk || k.namn !== egenKusk.namn));
  let n = 0;
  fält.forEach((h, i) => {
    h.spår = spårnr[i];
    h.kusk = h.egen && egenKusk ? egenKusk : (kuskar[n++] || KUSKAR[i % KUSKAR.length]);
    h.taktik = h.egen && egenTaktik ? egenTaktik : välTaktik(h, lopp);
  });
  return fält;
}

/**
 * Snabbavgörande för lopp som spelaren inte ser.
 *
 * Att köra hela tick-simuleringen för varje AI-lopp kostar drygt en sekund
 * per vecka på en dator och flera på en telefon — en frysning varje gång
 * spelaren trycker på knappen. Ingen tittar på de här loppen; det enda som
 * behöver bli rätt är vem som tjänar pengar och hur meriterna växer.
 *
 * Modellen väger samma saker som simuleringen: kapacitet, form, spår,
 * dagsform och resans slump. Den ger inte identiska utfall, men rätt sorts.
 */
function snabbresultat(fält, lopp) {
  const poäng = fält.map((h) => {
    const dagsform = rnd(0.9, 1.06);
    const passning = h.distans
      ? klamp(1 - Math.abs(lopp.dist - h.distans.optimal) / h.distans.tolerans, 0, 1)
      : 1;
    const spår = lopp.start === "bil"
      ? (h.spår <= 8 ? (8 - h.spår) * 0.35 : -4 - (h.spår - 9) * 0.3)
      : (h.spår <= 5 ? (6 - h.spår) * 0.5 : h.spår <= 7 ? 1.4 : -2.5);
    const galopp = Math.random() < 0.055 + (70 - h.lynne) / 1400 ? true : false;
    return {
      häst: h,
      ur: galopp && Math.random() < 0.3,
      poäng: (h.fart * 0.9 + h.styrka * 0.55 + h.start * 0.35) * dagsform
        + h.form * 0.45 + passning * 6 + spår + (h.kusk?.avslutning ?? 55) * 0.12
        + rnd(-9, 9) - (galopp ? 26 : 0),
    };
  });
  poäng.sort((a, b) => (a.ur === b.ur ? b.poäng - a.poäng : a.ur ? 1 : -1));
  return poäng.map((p, i) => ({
    häst: p.häst,
    plats: p.ur ? null : i + 1,
    ur: p.ur,
    spår: p.häst.spår,
    kusk: p.häst.kusk,
    streck: p.häst.streck ?? 0,
  }));
}

/** Bokför ett loppresultat på hästar och stall. */
export function bokför(värld, lopp, resultat, vecka) {
  resultat.forEach((r) => {
    const h = r.häst;
    if (h.egen || h.tillfällig) return;     // spelarens häst bokförs på annat håll
    h.starter = (h.starter || 0) + 1;
    h.energi = klamp(h.energi - int(14, 24));
    h.senasteStartVecka = vecka;
    const pris = r.ur
      ? (lopp.garanterad || 0)
      : (lopp.pris[r.plats - 1] ?? lopp.garanterad ?? 0);
    h.intjänat = (h.intjänat || 0) + pris;
    if (!r.ur && r.plats) {
      h.form = klamp(h.form + (r.plats <= 3 ? 4 : -2));
      if (r.plats === 1) h.segrar = (h.segrar || 0) + 1;
    } else {
      h.form = klamp(h.form - 3);
    }
    const st = värld.stall.find((s) => s.id === h.stallId);
    if (st) {
      st.insprunget += pris;
      st.starter += 1;
      if (!r.ur && r.plats === 1) st.segrar += 1;
    }
    if (Math.random() < (h.energi < 25 ? 0.14 : 0.04)) h.skada = int(1, 2);
  });
}

/**
 * Kör världens vecka: AI-stallen anmäler sina hästar till veckans lopp och
 * loppen avgörs. Lopp som spelaren själv startat i hoppas över — de har
 * redan körts live.
 */
export function körVärldensVecka(spel) {
  const värld = spel.värld;
  if (!värld) return [];
  const vecka = spel.vecka;
  const lopp = veckansLopp(vecka);
  const körda = spel.startadeLopp || [];
  const upptagna = new Set();
  const nyheter = [];

  lopp.forEach((l) => {
    if (körda.includes(l.id)) return;
    const fält = byggFält(värld, l, vecka, upptagna);
    if (fält.length < 6) return;
    fält.forEach((h) => { if (h.id) upptagna.add(h.id); });
    rustaFält(fält, l);
    beräknaStreck(fält, { spelförtroende: 40, stallform: 50, marknadsbild: 0 });
    const resultat = snabbresultat(fält, l);
    bokför(värld, l, resultat, vecka);

    if (l.storlopp || l.v85) {
      const v = resultat[0];
      const st = värld.stall.find((s) => s.id === v.häst.stallId);
      nyheter.push({
        rubrik: `${v.häst.namn} vann ${l.kortnamn || l.namn}`,
        byline: st ? `${st.namn} tog hem prispotten.` : "Storloppet gick till en outsider.",
      });
    }
  });
  return nyheter;
}

/** Veckans skötsel av världens hästar — träning, vila, återhämtning. */
export function skötVärlden(värld) {
  if (!värld) return;
  värld.hästar.forEach((h) => {
    if (h.skada > 0) { h.skada--; h.energi = klamp(h.energi + 16); return; }
    const st = värld.stall.find((s) => s.id === h.stallId);
    const fil = st ? st.filosofi : FILOSOFIER[0];
    /* Filosofin avgör om hästen vilar eller jobbar. Ett stall som startar
       ofta kör slitna hästar; ett tålmodigt stall får dem hela men startar
       färre gånger. */
    const jobb = h.energi < fil.vilaTröskel ? "vila" : fil.träning;
    const t = TRÄNING[jobb] || TRÄNING.lugnt;
    h.energi = klamp(h.energi + t.energi);
    h.form = klamp(h.form + t.form);
    h.start = klamp(h.start + t.start);
    if (Math.random() < t.risk * (h.energi < 30 ? 2 : 1)) h.skada = int(1, 3);
  });
}

/** Tränarligan — ditt stall inräknat. */
export function tränarliga(spel) {
  const rader = (spel.värld?.stall || []).map((s) => ({
    namn: s.namn,
    tränare: s.tränare,
    filosofi: s.filosofi?.namn ?? "",
    insprunget: s.insprunget,
    segrar: s.segrar,
    starter: s.starter,
    du: false,
  }));
  rader.push({
    namn: spel.stallnamn,
    tränare: "du",
    filosofi: "",
    insprunget: spel.intjänat,
    segrar: spel.stall.reduce((a, h) => a + (h.segrar || 0), 0),
    starter: spel.stall.reduce((a, h) => a + (h.starter || 0), 0),
    du: true,
  });
  return rader.sort((a, b) => b.insprunget - a.insprunget);
}
