/**
 * PERSONALEN OCH RELATIONERNA — människorna som karriärbågar
 *
 * Designdokumentets mening: "Min första förstaman var en ung hästskötare
 * som senare lämnade och blev min största rival." Det kräver att
 * förstamannen inte är en evig egenskapspåse utan en människa med egen
 * kurva: ambitionen växer av stallets framgång, en dag räcker inte
 * jobbet, och valet du gör då — släppa, betala eller dela — avgör om ni
 * skiljs som vänner eller möts som konkurrenter.
 *
 * Här bor också ägarrelationerna (nöjda ägare kommer med bättre hästar)
 * och banflytten som scen. Allt är byggt på samma tre fundament som
 * resten av berättelselagret: händelser registreras i krönikan, stora
 * ögonblick blir scener, och effekterna är serialiserbara valtyper.
 *
 * DESIGNGRÄNS: modulen skriver i världen (nya stall) och i spelet
 * (relationer, personal) men rör aldrig loppmotorn. Att exförstamannens
 * stall möter ditt följer av att det ligger i världen — fältbygget vet
 * ingenting om er historia.
 */
import { klamp, slump, rnd, int, plock } from "./engine-util.js";
import { nyHäst } from "./engine-hast.js";
import { registreraHändelse } from "./engine-handelser.js";
import { köScen, registreraValeffekt } from "./engine-scener.js";
import { förstamanskandidater } from "./engine-forstaman.js";
import { skrivPress } from "./engine-vecka.js";
import { ÄGARNAMN } from "./data-agare.js";
import { BANOR } from "./data-namnpaket.js";

const efternamn = (n) => String(n || "").split(" ").slice(-1)[0];
const förnamn = (n) => String(n || "").split(" ")[0];

/* ------------------------------------------------------------------ */
/* Förstamannens ambition                                              */
/* ------------------------------------------------------------------ */

/**
 * Ambitionen växer varje vecka — snabbast för pådrivaren, långsammast
 * för fostraren — och tar språng när stallet lyckas (lyssnaren på
 * storloppsseger lägger på). Ett stall i motvind väcker ingen längtan:
 * under 30 i renommé står ambitionen still. Kurvan är långsam med
 * flit: avgångsfrågan ska komma efter säsonger, inte veckor.
 */
export function uppdateraAmbition(spel) {
  const fm = spel.förstaman;
  if (!fm) return;
  fm.ambition = fm.ambition ?? 20;
  fm.säsongerHosDig = fm.säsongerHosDig ?? 0;
  if (fm.delägare) return;                      // delägaren är redan framme
  if (spel.renommé < 30) return;
  const takt = fm.profil === "pådrivare" ? 0.75 : fm.profil === "taktiker" ? 0.55 : 0.4;
  fm.ambition = klamp(fm.ambition + takt * (1 + spel.renommé / 150));
}

/**
 * Är det dags för samtalet? Kräver mogen ambition, minst en hel säsong
 * ihop och att frågan inte redan ligger på bordet. Scenen ställer det
 * val designdokumentet pekar ut.
 */
export function prövaAvgång(spel) {
  const fm = spel.förstaman;
  if (!fm || fm.delägare) return;
  if ((fm.ambition ?? 0) < 85 || (fm.säsongerHosDig ?? 0) < 1) return;
  if ((spel.scener ?? []).some((s) => s.slag === "förstaman_avgång")) return;
  if (fm.avgångsfråganStälld) return;
  fm.avgångsfråganStälld = true;

  const nyLön = Math.round((fm.lön || 1000) * 1.6 / 100) * 100;
  köScen(spel, {
    slag: "förstaman_avgång",
    betydelse: 78, bild: "forstaman",
    etikett: "STALLKONTORET",
    rubrik: `${förnamn(fm.namn).toUpperCase()} VILL VIDARE`,
    ingress: `${fm.namn} har varit din högra hand i ${fm.säsongerHosDig} säsong${fm.säsongerHosDig > 1 ? "er" : ""}. `
      + `Nu står hen i dörren med hatten i hand: drömmen är ett eget stall, en egen licens, egna hästar.`,
    citat: fm.profil === "pådrivare"
      ? "Jag har byggt din form i åratal. Nu vill jag se vad jag kan bygga i eget namn."
      : fm.profil === "taktiker"
        ? "Jag har läst propositioner åt dig länge nog. Nästa gång vill jag läsa dem åt mig själv."
        : "Du har lärt mig allt om att bygga långsamt. Nu vill jag bygga något eget.",
    citatVem: fm.namn,
    fråga: "Vad svarar du?",
    data: { namn: fm.namn, profil: fm.profil, nyLön },
    val: [
      { id: "släpp", effekt: "förstaman_släpp",
        text: "»Gå. Och gör det ordentligt.«",
        följd: "Ni skiljs som vänner — och möts som konkurrenter" },
      { id: "motbjud", effekt: "förstaman_motbjud",
        text: `Höj lönen till ${nyLön} kr/v`,
        följd: "Hen stannar — men drömmen försvinner inte" },
      { id: "delägare", effekt: "förstaman_delägare",
        text: "Erbjud delägarskap: 10 % av prispengarna",
        följd: "Hen stannar för gott. Dyrt — och lojalt" },
    ],
  });
}

/**
 * Exförstamannens eget stall. Läggs i världen med måttlig styrka — hen
 * börjar från noll precis som du gjorde — och märks som gammal bekant.
 * Från och med nu bygger världsmotorn hens fält, tränar hens hästar och
 * räknar hens liga precis som alla andras: rivaliteten UPPSTÅR av att ni
 * delar banor, den simuleras inte fram.
 */
export function startaEgetStall(spel, namn, profil) {
  const värld = spel.värld;
  const id = Math.max(0, ...värld.stall.map((s) => s.id)) + 1;
  const styrka = 0.5 + rnd(0, 0.14);
  värld.stall.push({
    id, namn: `Stall ${efternamn(namn)}`, tränare: namn,
    filosofi: { namn: profil === "pådrivare" ? "hårda jobb" : profil === "taktiker" ? "tålmodig" : "vilar mycket",
      vilaTröskel: profil === "pådrivare" ? 52 : 64,
      träning: profil === "pådrivare" ? "kvalitet" : "lugnt",
      startvilja: profil === "taktiker" ? 0.6 : 0.7 },
    styrka: Math.round(styrka * 100) / 100,
    insprunget: 0, starter: 0, segrar: 0,
    exFörstaman: true,
  });
  for (let i = 0; i < 5; i++) {
    const bas = 30 + styrka * 40;
    const h = nyHäst({ ålder: int(3, 8),
      start: klamp(Math.round(rnd(bas - 8, bas + 16))),
      fart: klamp(Math.round(rnd(bas - 8, bas + 16))),
      styrka: klamp(Math.round(rnd(bas - 8, bas + 16))) });
    h.egen = false; h.stallId = id;
    h.form = klamp(Math.round(rnd(42, 64)));
    h.energi = klamp(Math.round(rnd(70, 92)));
    h.starter = int(3, 25);
    const kap = (h.start + h.fart + h.styrka) / 3;
    const klass = klamp((kap - 28) / 55, 0.05, 1);
    h.segrar = Math.round(h.starter * klass * 0.3 * rnd(0.6, 1.3));
    h.intjänat = Math.round(h.starter * (2500 + klass * 22000) * rnd(0.75, 1.25));
    h.senasteStartVecka = 0;
    värld.hästar.push(h);
  }
  spel.tidigareFörstamän = spel.tidigareFörstamän ?? [];
  spel.tidigareFörstamän.push({ namn, stallId: id, lämnadeSäsong: spel.säsong ?? 1,
    mötenMotDig: 0, segerMotDig: false });
  return id;
}

/** Rekryteringsscenen: tre kandidater, som val. */
export function köRekrytering(spel) {
  const kandidater = förstamanskandidater();
  köScen(spel, {
    slag: "rekrytering",
    betydelse: 70, bild: "forstaman",
    etikett: "STALLKONTORET",
    rubrik: "STOLEN STÅR TOM",
    ingress: "Tre har sökt jobbet som förstaman. Profilen färgar råden genom hela karriären — fostraren bygger långsamt, pådrivaren pressar formen, taktikern läser loppen.",
    fråga: "Vem får nycklarna till stallet?",
    data: { kandidater },
    val: kandidater.map((k, i) => ({
      id: "k" + i, effekt: "anställ_förstaman",
      text: `${k.namn}, ${k.ålder} år — ${k.profiltext}`,
      följd: `${k.pitch} (${k.lön} kr/v)`,
    })),
  });
}

/* ------------------------------------------------------------------ */
/* Gamla bekanta i loppen                                              */
/* ------------------------------------------------------------------ */

/**
 * Efter varje lopp: stod en exförstamans häst i fältet? Pressen älskar
 * den vinkeln — men bara när den bär: någon av er vann, eller ni slutade
 * sida vid sida. Vartenda möte som rubrik gör historien platt.
 */
export function gamlaBekanta(spel, resultat, minHäst, minPlacering) {
  const tidigare = spel.tidigareFörstamän ?? [];
  if (!tidigare.length || !resultat?.length) return;
  for (const fm of tidigare) {
    const deras = resultat.find((r) => r.häst?.stallId === fm.stallId && !r.ur);
    if (!deras) continue;
    fm.mötenMotDig++;
    const deVann = deras.plats === 1;
    const duVann = minPlacering === 1;
    const nära = Math.abs((deras.plats ?? 99) - (minPlacering ?? 99)) <= 1;
    if (!deVann && !duVann && !nära) continue;

    if (deVann && !fm.segerMotDig) {
      /* Första gången eleven slår mästaren är en händelse — och en scen.
         Det är rivalitetens födelseögonblick i designdokumentet. */
      fm.segerMotDig = true;
      registreraHändelse(spel, {
        typ: "eleven_slog_mästaren", betydelse: 72,
        aktörer: { hästId: minHäst?.id, hästNamn: minHäst?.namn },
        data: { tränare: fm.namn, häst: deras.häst?.namn },
      });
    } else if (deVann) {
      skrivPress(spel, `${fm.namn} vann — före sitt gamla stall`,
        `${deras.häst?.namn} höll ${minHäst?.namn ?? "ditt ekipage"} bakom sig.`, "neutral");
    } else if (duVann && nära) {
      skrivPress(spel, `Läromästaren höll undan`,
        `${minHäst?.namn} slog ${fm.namn}s ${deras.häst?.namn} — den här gången.`, "bra");
    }
  }
}

/* ------------------------------------------------------------------ */
/* Ägarrelationer                                                      */
/* ------------------------------------------------------------------ */

/**
 * Ägare minns. Relationen byggs av det deras häst gör hos dig — segrar,
 * pallplatser, uppfyllda krav — och rivs av skador och missade krav.
 * En riktigt nöjd ägare kommer tillbaka med en BÄTTRE häst: det är så
 * uppdragsstallar växer i verkligheten, på rykte hos ägarna, inte bara
 * hos publiken.
 */
export function ägarrelation(spel, ägare, delta) {
  if (!ägare) return;
  spel.ägarrelationer = spel.ägarrelationer ?? {};
  const r = spel.ägarrelationer[ägare] ?? { relation: 50, hästerbjudet: false };
  r.relation = klamp(r.relation + delta);
  spel.ägarrelationer[ägare] = r;

  if (r.relation >= 80 && !r.hästerbjudet) {
    r.hästerbjudet = true;
    const nivå = 46 + Math.round(spel.renommé / 5);
    köScen(spel, {
      slag: "ägarhäst",
      betydelse: 64, bild: "stall-morgon",
      etikett: "TELEFONEN RINGER",
      rubrik: `${ägare.toUpperCase()} HAR EN TILL`,
      ingress: `${ägare} är nöjd — så nöjd att nästa häst också ska stå hos dig. Den här är bättre än den förra: ägaren har köpt dyrt och siktar högt.`,
      fråga: "Tar du emot den?",
      data: { ägare, nivå },
      val: [
        { id: "ta", effekt: "ägarhäst_ta",
          text: "»Boxen står redo.«", följd: "En bra häst — och högre förväntningar" },
        { id: "nej", effekt: "ägarhäst_nej",
          text: "»Tyvärr — fullt i stallet.«", följd: "Relationen tål ett nej, men bara ett" },
      ],
    });
  }
}

/* ------------------------------------------------------------------ */
/* Valeffekterna                                                       */
/* ------------------------------------------------------------------ */

registreraValeffekt("förstaman_släpp", (spel, scen) => {
  const { namn, profil } = scen.data ?? {};
  const stallId = startaEgetStall(spel, namn, profil);
  const stall = spel.värld.stall.find((s) => s.id === stallId);
  spel.förstaman = null;
  registreraHändelse(spel, {
    typ: "förstaman_lämnade", betydelse: 68,
    aktörer: { förstamanId: namn },
    data: { stall: stall?.namn, text: `${namn} lämnade för att starta ${stall?.namn}.` },
  });
  skrivPress(spel, `${namn} startar eget`,
    `Efter åren hos ${spel.stallnamn} löser ${förnamn(namn)} egen licens. ${stall?.namn} är fött.`, "neutral");
  köRekrytering(spel);
});

registreraValeffekt("förstaman_motbjud", (spel, scen) => {
  const fm = spel.förstaman;
  if (!fm) return;
  fm.lön = scen.data?.nyLön ?? Math.round((fm.lön || 1000) * 1.6);
  /* Drömmen köps inte bort, bara framskjuten: ambitionen faller men
     frågan får ställas igen — och nästa motbud blir dyrare. */
  fm.ambition = 55;
  fm.avgångsfråganStälld = false;
  spel.logg?.unshift(`<b>${förnamn(fm.namn)}</b> tackade ja till ${fm.lön} kr i veckan. »Ett tag till, då.«`);
});

registreraValeffekt("förstaman_delägare", (spel, scen) => {
  const fm = spel.förstaman;
  if (!fm) return;
  fm.delägare = true;
  fm.ambition = 60;
  registreraHändelse(spel, {
    typ: "delägarskap", betydelse: 55,
    aktörer: { förstamanId: fm.namn },
    data: { text: `${fm.namn} blev delägare i ${spel.stallnamn}.` },
  });
  skrivPress(spel, `${fm.namn} delägare i ${spel.stallnamn}`,
    "Förstamannen köper in sig — och stannar.", "positiv");
});

registreraValeffekt("anställ_förstaman", (spel, scen, val) => {
  const ix = Number(String(val.id).slice(1));
  const k = (scen.data?.kandidater ?? [])[ix];
  if (!k) return;
  spel.förstaman = { namn: k.namn, profil: k.profil, profiltext: k.profiltext,
    lön: k.lön, ambition: 20, säsongerHosDig: 0 };
  registreraHändelse(spel, {
    typ: "förstaman_anställd", betydelse: 45,
    aktörer: { förstamanId: k.namn },
    data: { text: `${k.namn} anställdes som förstaman.`, profil: k.profil },
  });
  spel.logg?.unshift(`<b>${k.namn}</b> hängde in sin jacka på kontoret. ${k.pitch}`);
});

registreraValeffekt("ägarhäst_ta", (spel, scen) => {
  const { ägare, nivå } = scen.data ?? {};
  const h = nyHäst({
    ålder: int(4, 6),
    start: klamp(Math.round(rnd(nivå - 6, nivå + 12))),
    fart: klamp(Math.round(rnd(nivå - 4, nivå + 14))),
    styrka: klamp(Math.round(rnd(nivå - 6, nivå + 12))),
    ägare,
  });
  h.form = 50; h.energi = 85; h.hype = 25;
  h.tålamod = 14;
  h.krav = { text: "minst en seger inom tolv starter", typ: "seger", antal: 12 };
  spel.stall.push(h);
  skrivPress(spel, `${ägare} placerar ${h.namn} hos ${spel.stallnamn}`,
    "Ägarens andra häst i stallet — och den bättre av dem.", "positiv");
});

registreraValeffekt("ägarhäst_nej", (spel, scen) => {
  const ägare = scen.data?.ägare;
  if (ägare && spel.ägarrelationer?.[ägare]) {
    spel.ägarrelationer[ägare].relation = klamp(spel.ägarrelationer[ägare].relation - 20);
    spel.ägarrelationer[ägare].hästerbjudet = false;   // kan fråga igen längre fram
  }
  spel.logg?.unshift(`<b>${ägare}</b> lät besviken. »Jag hör av mig igen. Kanske.«`);
});

registreraValeffekt("bana_flytta", (spel, scen) => {
  const { banaId, kostnad } = scen.data ?? {};
  if (spel.kassa < kostnad) {
    spel.logg?.unshift(`Kassan räckte inte till flytten (${kostnad} kr). Erbjudandet ligger kvar på stallsidan.`);
    return;
  }
  spel.kassa -= kostnad;
  spel.hemmabana = banaId;
  spel.renommé = klamp(spel.renommé + 4);
  spel.banerbjudande = null;
  registreraHändelse(spel, {
    typ: "banflytt", betydelse: 60,
    data: { text: `Stallet flyttade till ${BANOR[banaId]?.namn}.` },
  });
  spel.logg?.unshift(`Stallet flyttar till <b>${BANOR[banaId]?.namn}</b>. Ett nytt kapitel.`);
});

registreraValeffekt("bana_stanna", (spel) => {
  spel.banerbjudande = null;
  skrivPress(spel, `${spel.stallnamn} stannar hemma`,
    "»Vi trivs där vi är.« Publiken på hemmabanan jublar.", "bra");
});

/* Använd ÄGARNAMN-importen för nya spontana ägare i framtiden. */
export const slumpaÄgare = () => plock(ÄGARNAMN);
export const _internt = { efternamn };
