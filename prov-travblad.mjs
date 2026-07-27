/**
 * PROV — TRAVBLADET (v89, kap 5)
 *
 * Tidningen får aldrig hitta på. Proven låser: att förstasidans
 * hierarki följer nyhetsvärderingen (5.3), att statistikern bara
 * skriver tal som finns, att krönikans kritik kräver facit (5.5 —
 * sportjournalistik, inte dokusåpa), att pressfrågan väljs ur
 * historiken enligt prioriteringen (5.4), och att veckomotorn arkiverar
 * pressval och favoritfacit så minnet faktiskt byggs.
 */
import { förstasidan, statistikern, krönikan, pressfråga } from "./engine-travblad.js";
import { JOURNALISTER } from "./data-namnpaket.js";

let fel = 0;
const ok = (villkor, text) => {
  if (villkor) console.log("  ✓ " + text);
  else { console.log("  ✗ " + text); fel++; }
};

const nyttSpel = () => ({
  säsong: 2, vecka: 8, veckor: 20, stallnamn: "Provstallet",
  intjänat: 120000, stallform: 55, marknadsbild: 0, iKris: 0,
  stall: [], press: [], krönika: [], favoritfacit: [],
  tidigareFörstamän: [], värld: { stall: [] },
});

console.log("PROV: Travbladet\n");

/* ---------- Nyhetsvärderingen (5.3) ---------- */
{
  const spel = nyttSpel();
  spel.krönika = [
    { säsong: 2, vecka: 8, betydelse: 80, data: { text: "Storloppssegern" } },
    { säsong: 2, vecka: 8, betydelse: 60, data: { text: "En mindre nyhet" } },
    { säsong: 2, vecka: 2, betydelse: 95, data: { text: "Gammal jättenyhet" } },
    { säsong: 2, vecka: 8, betydelse: 30, data: { text: "En lunchseger" } },
  ];
  spel.press = [
    { rubrik: "Laddad rubrik", byline: "b", ton: "bra", vecka: 8 },
    { rubrik: "Neutral rad", byline: "b", ton: "neutral", vecka: 8 },
    { rubrik: "Gammal laddad", byline: "b", ton: "dålig", vecka: 1 },
  ];
  const sida = förstasidan(spel);
  ok(sida.uppslag?.rubrik === "Storloppssegern",
    "uppslaget är veckans TYNGSTA händelse — inte den senaste");
  ok(!sida.artiklar.some((p) => p.rubrik === "Gammal laddad") &&
     sida.artiklar.some((p) => p.rubrik === "Laddad rubrik"),
    "artiklar kräver laddning OCH färskhet; resten blir notiser");
  ok(sida.notiser.some((p) => p.rubrik === "Neutral rad") &&
     sida.notiser.some((p) => p.rubrik === "Gammal laddad"),
    "notiserna fångar det som inte bar en artikel");

  const tom = nyttSpel();
  tom.krönika = [{ säsong: 2, vecka: 8, betydelse: 40, data: { text: "Lunchseger" } }];
  ok(förstasidan(tom).uppslag === null,
    "en vanlig lunchseger får INGET uppslag — hierarkin håller (5.3)");
}

/* ---------- Statistikern skriver bara tal som finns ---------- */
{
  const spel = nyttSpel();
  const stat = statistikern(spel);
  ok(stat.signatur === JOURNALISTER.siffror && stat.rader.length >= 1,
    "kolumnen är signerad statistikern och har rader");
  ok(!stat.rader.some((r) => r.includes("favorit")),
    "utan favoritstarter nämns inget favoritfacit");
  spel.favoritfacit = [{ plats: 1 }, { plats: 5 }, { plats: 2 }];
  ok(statistikern(spel).rader.some((r) => r.includes("2 av 3")),
    "med facit räknar statistikern rätt: 2 av 3 på pallen");
}

/* ---------- Krönikans kritik kräver facit (5.5) ---------- */
{
  const spel = nyttSpel();
  ok(!krönikan(spel).text.includes("mönster"),
    "utan favoritmissar ingen mönsterkritik");
  spel.favoritfacit = [{ plats: 5 }, { ur: true, plats: null }, { plats: 7 }];
  const k = krönikan(spel);
  ok(k.text.includes("mönster") && k.signatur === JOURNALISTER.krönikör,
    "tre favoritmissar ger krönikörens mönsterkritik");
  spel.favoritfacit = [];
  spel.stallform = 30;
  ok(krönikan(spel).text.includes("Formsiffrorna"),
    "svag form ger formkritik — saklig, inte dokusåpa");
}

/* ---------- Pressfrågan med minne (5.4) ---------- */
{
  const spel = nyttSpel();
  const häst = { namn: "Provhästen", spår: 4, egen: true, presshistorik: [] };
  const lopp = { namn: "Provloppet", kortnamn: "Provloppet" };
  const fält = [häst, { namn: "Motståndare", streck: 30, stallNamn: "Annat Stall" }];

  ok(pressfråga(spel, häst, lopp, fält).typ === "vanlig", "utan historik: vanlig fråga");

  häst.presshistorik = [{ val: "upp", plats: 6, ur: false }];
  const q1 = pressfråga(spel, häst, lopp, fält);
  ok(q1.typ === "brutet_löfte" && q1.text.includes("blev 6:a"),
    "lovad seger + stryk ger brutet löfte-frågan med platsen i");

  häst.presshistorik = [{ val: "ner", plats: 4 }, { val: "ner", plats: 5 }, { val: "ner", plats: 2 }];
  ok(pressfråga(spel, häst, lopp, fält).typ === "nedtoning",
    "tre nedtoningar i rad ger nedtoningsfrågan");

  /* Exförstamannen i fältet slår allt — personkoppling + konflikt. */
  spel.tidigareFörstamän = [{ namn: "Kim Ek", stallId: "s1" }];
  spel.värld.stall = [{ id: "s1", namn: "Eks Träningsstall" }];
  fält.push({ namn: "Ekhästen", streck: 44, stallNamn: "Eks Träningsstall" });
  const q2 = pressfråga(spel, häst, lopp, fält);
  ok(q2.typ === "exförstaman" && q2.text.includes("Kim Ek") && q2.text.includes("favoriten"),
    "gamla förstamannen i fältet slår allt — och favoritskapet nämns");
}

/* ---------- Veckomotorn bygger minnet ---------- */
{
  const { efterLopp } = await import("./engine-vecka.js");
  const { sättRng, seedad } = await import("./engine-util.js");
  sättRng(seedad(5));
  const spel = {
    säsong: 2, vecka: 8, veckor: 20, stallnamn: "Provstallet", hemmabana: null,
    kassa: 100000, intjänat: 0, renommé: 40, spelförtroende: 40, stallform: 50,
    marknadsbild: 0, resultathistorik: [], segrarTotalt: 0,
    stall: [], logg: [], press: [], krönika: [], troférum: [], rivaliteter: {},
    kuskrelation: {}, ägarrelationer: {}, rekord: {}, hallOfFame: [],
    tidigareFörstamän: [], värld: { stall: [], hästar: [] }, bågeSkrivet: {}, scener: [],
  };
  const häst = { id: 1, namn: "Minneshästen", egen: true, ägare: null,
    starter: 4, segrar: 0, pallplatser: 1, intjänat: 40000, form: 55, energi: 70,
    hype: 30, skada: 0, ålder: 5, kön: "hingst", lynne: 60,
    resultat: [], milstolpar: [], senastePressval: "upp",
    distans: { optimal: 2140, tolerans: 300, typ: "medel" } };
  const kusk = { namn: "Provkusken", andel: 0.05, arvode: 1500 };
  const lopp = { namn: "Provloppet", kortnamn: "Provl.", dist: 2140, start: "bil",
    banaNamn: "Provbanan", startande: 12, pris: [30000, 15000, 8000, 4000, 2500],
    garanterad: 1500, förstapris: 30000, antalPris: 5 };
  const min = { ur: false, plats: 5, km: 76.2, sek: 163, spår: 4, streck: 34,
    läge: "rygg/inner", sista800: 58, sista400: 28.5, utanSkydd: 4, dödensTid: 0,
    häst, kusk, dagsform: 1.0, dagsformText: "" };
  efterLopp(spel, { häst, kusk, lopp, min, varFavorit: true, streckRang: 1, sim: null });
  ok(häst.presshistorik?.[0]?.val === "upp" && häst.presshistorik[0].plats === 5
     && häst.senastePressval === undefined,
    "pressvalet arkiveras med resultatet och töms (5.4)");
  ok(spel.favoritfacit?.length === 1 && spel.favoritfacit[0].plats === 5,
    "favoritstarten bokförs i facit (5.5)");
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
