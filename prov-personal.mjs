/**
 * PROV — personalen och relationerna: `node prov-personal.mjs`
 *
 * Karriärbågen "förstamannen lämnar och blir din rival" spänner över
 * ambition → avgångsscen → eget stall i världen → gamla bekanta i loppen
 * → eleven slog mästaren. Varje led provas för sig och hela kedjan i
 * följd. Dessutom: ägarrelationerna och deras hästerbjudande.
 */
import { uppdateraAmbition, prövaAvgång, startaEgetStall, gamlaBekanta,
         ägarrelation, köRekrytering } from "./engine-personal.js";
import { görVal } from "./engine-scener.js";
import { byggVärld } from "./engine-varld.js";
import { sättRng, seedad } from "./engine-util.js";
import "./engine-lyssnare.js";

sättRng(seedad(777));
let fel = 0;
const prov = (namn, villkor) => {
  console.log(`${villkor ? "  ok  " : "  FEL "} ${namn}`);
  if (!villkor) fel++;
};
const nyttProvspel = () => ({
  säsong: 3, vecka: 6, veckor: 20, stallnamn: "Björkhaga",
  kassa: 500000, renommé: 60, spelförtroende: 50,
  krönika: [], press: [], logg: [], troférum: [], rivaliteter: {},
  huvudnyhet: null, scener: [], avelsston: [], kuskrelation: {},
  tidigareFörstamän: [], ägarrelationer: {}, banerbjudande: null,
  förstaman: { namn: "Elin Ranstad", profil: "pådrivare", lön: 1200,
    ambition: 20, säsongerHosDig: 2 },
  prolog: { aktiv: false, mentor: { namn: "Gunnar Falk" } },
  stall: [], värld: byggVärld(6), föl: [],
});

console.log("\nPROV 1 — ambitionen växer, och står still i motvind");
{
  const spel = nyttProvspel();
  const a0 = spel.förstaman.ambition;
  uppdateraAmbition(spel);
  prov("växer i medvind", spel.förstaman.ambition > a0);
  spel.renommé = 20;
  const a1 = spel.förstaman.ambition;
  uppdateraAmbition(spel);
  prov("står still under 30 i renommé", spel.förstaman.ambition === a1);
  spel.renommé = 60;
  spel.förstaman.delägare = true;
  uppdateraAmbition(spel);
  prov("delägaren är redan framme", spel.förstaman.ambition === a1);
}

console.log("\nPROV 2 — avgångsscenen kommer när det är dags, en gång");
{
  const spel = nyttProvspel();
  spel.förstaman.ambition = 90;
  prövaAvgång(spel);
  prov("scenen köades", spel.scener.some((s) => s.slag === "förstaman_avgång"));
  prov("med tre val", spel.scener[0].val.length === 3);
  prövaAvgång(spel);
  prov("men bara en gång", spel.scener.length === 1);
}

console.log("\nPROV 3 — släpp: eget stall, rekrytering, krönika");
{
  const spel = nyttProvspel();
  spel.förstaman.ambition = 90;
  prövaAvgång(spel);
  const stallFöre = spel.värld.stall.length;
  görVal(spel, 0, "släpp");
  prov("förstamannen lämnade", spel.förstaman === null);
  prov("stallet föddes i världen", spel.värld.stall.length === stallFöre + 1);
  const nya = spel.värld.stall[spel.värld.stall.length - 1];
  prov("med hens namn som tränare", nya.tränare === "Elin Ranstad"
    && nya.namn === "Stall Ranstad" && nya.exFörstaman === true);
  prov("och fem hästar", spel.värld.hästar.filter((h) => h.stallId === nya.id).length === 5);
  prov("avgången i krönikan", spel.krönika.some((h) => h.typ === "förstaman_lämnade"));
  prov("rekryteringsscenen köades direkt", spel.scener.some((s) => s.slag === "rekrytering"));
  prov("gamla bekanta-listan minns", spel.tidigareFörstamän[0]?.namn === "Elin Ranstad");

  const rekIx = spel.scener.findIndex((s) => s.slag === "rekrytering");
  const kandidat = spel.scener[rekIx].data.kandidater[1];
  görVal(spel, rekIx, "k1");
  prov("kandidaten anställdes", spel.förstaman?.namn === kandidat.namn);
  prov("med nollställd ambition", spel.förstaman.ambition === 20);
}

console.log("\nPROV 4 — motbud och delägarskap");
{
  const spel = nyttProvspel();
  spel.förstaman.ambition = 90;
  prövaAvgång(spel);
  görVal(spel, 0, "motbjud");
  prov("lönen höjdes", spel.förstaman.lön > 1200);
  prov("ambitionen föll men lever", spel.förstaman.ambition === 55);
  prov("frågan kan komma igen", spel.förstaman.avgångsfråganStälld === false);

  spel.förstaman.ambition = 90;
  prövaAvgång(spel);
  görVal(spel, 0, "delägare");
  prov("delägarskapet i krönikan", spel.krönika.some((h) => h.typ === "delägarskap"));
  prov("hen stannar för gott", spel.förstaman.delägare === true);
}

console.log("\nPROV 5 — gamla bekanta: eleven slår mästaren en gång");
{
  const spel = nyttProvspel();
  const stallId = startaEgetStall(spel, "Elin Ranstad", "pådrivare");
  const deras = spel.värld.hästar.find((h) => h.stallId === stallId);
  const min = { id: 5, namn: "Min Häst" };
  const resultat = [
    { plats: 1, häst: deras, ur: false },
    { plats: 2, häst: min, ur: false },
  ];
  gamlaBekanta(spel, resultat, min, 2);
  prov("händelsen registrerades", spel.krönika.some((h) => h.typ === "eleven_slog_mästaren"));
  prov("scenen köades", spel.scener.some((s) => s.rubrik === "ELEVEN SLOG MÄSTAREN"));
  prov("mentorn ringde, road", spel.logg.some((r) => r.includes("Cirkeln")));

  const antalFöre = spel.krönika.filter((h) => h.typ === "eleven_slog_mästaren").length;
  gamlaBekanta(spel, resultat, min, 2);
  prov("födelsen sker bara en gång",
    spel.krönika.filter((h) => h.typ === "eleven_slog_mästaren").length === antalFöre);
  prov("men mötena räknas", spel.tidigareFörstamän[0].mötenMotDig === 2);

  const omvänt = [{ plats: 1, häst: min, ur: false }, { plats: 2, häst: deras, ur: false }];
  gamlaBekanta(spel, omvänt, min, 1);
  prov("läromästaren som håller undan blir press",
    spel.press.some((p) => p.rubrik.includes("Läromästaren")));
}

console.log("\nPROV 6 — ägarrelationen bär till hästerbjudandet");
{
  const spel = nyttProvspel();
  for (let i = 0; i < 4; i++) ägarrelation(spel, "Stall Nyberg & Co", 8);
  prov("relationen ackumuleras", spel.ägarrelationer["Stall Nyberg & Co"].relation === 82);
  const scen = spel.scener.find((s) => s.slag === "ägarhäst");
  prov("erbjudandescenen köades vid 80", !!scen);

  const antalFöre = spel.stall.length;
  görVal(spel, spel.scener.indexOf(scen), "ta");
  prov("hästen kom med ägare och krav",
    spel.stall.length === antalFöre + 1 && spel.stall.at(-1).ägare === "Stall Nyberg & Co"
    && spel.stall.at(-1).krav?.typ === "seger");
  prov("erbjudandet kommer inte igen av sig självt",
    !spel.scener.some((s) => s.slag === "ägarhäst"));
}

console.log("\nPROV 7 — nej tack kostar, men stänger inte dörren");
{
  const spel = nyttProvspel();
  for (let i = 0; i < 4; i++) ägarrelation(spel, "Team Solkatt", 8);
  const scenIx = spel.scener.findIndex((s) => s.slag === "ägarhäst");
  görVal(spel, scenIx, "nej");
  const r = spel.ägarrelationer["Team Solkatt"];
  prov("relationen föll", r.relation < 80);
  prov("men frågan kan väckas igen", r.hästerbjudet === false);
}

console.log("\nPROV 8 — kandidaten från egna led");
{
  const { förstamanskandidater } = await import("./engine-forstaman.js");
  const k = förstamanskandidater();
  const egen = k.find((x) => x.urEgnaLed);
  prov("fyra kandidater, en från egna led", k.length === 4 && !!egen);
  prov("ung och billigast", egen.ålder < 25 && egen.lön < Math.min(...k.filter(x=>!x.urEgnaLed).map(x=>x.lön)));
  prov("med eget porträtt", egen.bildId === "kandidat-egna-led");

  const spel = nyttProvspel();
  spel.förstaman = { namn: egen.namn, profil: "pådrivare", lön: 600,
    ambition: 20, säsongerHosDig: 1, urEgnaLed: true };
  uppdateraAmbition(spel);
  const egenTakt = spel.förstaman.ambition - 20;
  spel.förstaman = { namn: "Yttre", profil: "pådrivare", lön: 1200,
    ambition: 20, säsongerHosDig: 1 };
  uppdateraAmbition(spel);
  const yttreTakt = spel.förstaman.ambition - 20;
  prov("den egna drömmer långsammare", egenTakt < yttreTakt && egenTakt > 0);

  spel.förstaman = null;
  spel.scener = [];
  köRekrytering(spel);
  const scen = spel.scener.find((s) => s.slag === "rekrytering");
  prov("rekryteringsscenen har fyra val", scen.val.length === 4);
  prov("egna ledet märkt i valtexten", scen.val.some((v) => v.text.includes("från egna led")));
  const ixEgen = scen.data.kandidater.findIndex((x) => x.urEgnaLed);
  görVal(spel, spel.scener.indexOf(scen), "k" + ixEgen);
  prov("anställningen bär lojaliteten", spel.förstaman.urEgnaLed === true);
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV MISSLYCKADES\n`);
process.exit(fel ? 1 : 0);
