/**
 * PROV — rekorden och säsongskrönikan: `node prov-rekord.mjs`
 *
 * Rekordtavlan ska bara jämföra ärligt (km-tid enbart vid bilstart och
 * seger), första noteringen ska vara tyst, brutna rekord ska låta.
 * Hall of fame ska vara svår. Krönikan ska byggas av det som hände —
 * och sakna stycken om det året saknade innehåll.
 */
import { uppdateraRekordEfterLopp, invalIHallOfFame, skrivSäsongskrönika }
  from "./engine-rekord.js";

let fel = 0;
const prov = (namn, villkor) => {
  console.log(`${villkor ? "  ok  " : "  FEL "} ${namn}`);
  if (!villkor) fel++;
};
const press = [];
const skrivPress = (spel, rubrik) => press.push(rubrik);
const nyttProvspel = () => ({ säsong: 4, vecka: 9, stallnamn: "Björkhaga",
  krönika: [], rekord: {}, hallOfFame: [], historik: [], press: [], logg: [] });

console.log("\nPROV 1 — första noteringen tyst, bruten notering låter");
{
  const spel = nyttProvspel();
  const häst = { id: 1, namn: "Blixten" };
  const lopp = { kortnamn: "Bronsserien", start: "bil" };
  uppdateraRekordEfterLopp(spel, { häst, lopp, min: { plats: 1, ur: false, km: 76.2 },
    brutto: 30000, fakta: { marginal: 1.1 }, skrivPress });
  prov("noteringen sattes", spel.rekord.snabbasteSeger?.värde === 76.2);
  prov("men tyst — tavlan var tom", press.length === 0 && spel.krönika.length === 0);

  uppdateraRekordEfterLopp(spel, { häst: { id: 2, namn: "Stormen" }, lopp,
    min: { plats: 1, ur: false, km: 74.8 }, brutto: 20000,
    fakta: { marginal: 0.4 }, skrivPress });
  prov("rekordet föll och bytte ägare", spel.rekord.snabbasteSeger.häst === "Stormen");
  prov("nu hördes det", press.some((r) => r.includes("74,8"))
    && spel.krönika.some((h) => h.typ === "stallrekord"));
  prov("marginalrekordet stod kvar — 0,4 slår inte 1,1",
    spel.rekord.störstaMarginal.värde === 1.1);
}

console.log("\nPROV 2 — ärliga jämförelser");
{
  const spel = nyttProvspel();
  const häst = { id: 1, namn: "Blixten" };
  uppdateraRekordEfterLopp(spel, { häst, lopp: { kortnamn: "X", start: "volt" },
    min: { plats: 1, ur: false, km: 70.0 }, brutto: 0, fakta: {}, skrivPress });
  prov("voltstartens km-tid räknas inte", !spel.rekord.snabbasteSeger);
  uppdateraRekordEfterLopp(spel, { häst, lopp: { kortnamn: "X", start: "bil" },
    min: { plats: 2, ur: false, km: 69.0 }, brutto: 15000, fakta: {}, skrivPress });
  prov("en tvåas tid är ingen notering", !spel.rekord.snabbasteSeger);
}

console.log("\nPROV 3 — hall of fame är en vägg, inte ett arkiv");
{
  const spel = nyttProvspel();
  for (let i = 0; i < 12; i++) {
    invalIHallOfFame(spel, { id: i, namn: "Häst" + i, segrar: i, starter: 30,
      intjänat: i * 120000, milstolpar: [] });
  }
  prov("tio platser, inte tolv", spel.hallOfFame.length === 10);
  prov("störst överst", spel.hallOfFame[0].namn === "Häst11");
  prov("de minsta petades", !spel.hallOfFame.some((p) => p.namn === "Häst0"));
  /* Storloppsbonusen (250 tkr merit) ska lyfta förbi jämnrika hästar men
     inte förbi dem med dubbelt så stor karriär — prispengen ligger redan i
     insprunget, bonusen är äran. Häst6 (900 tkr merit) ska passeras av
     500 tkr + storlopp (870 tkr)? Nej: 870 < 900. Men Häst5 (750 tkr)
     ska det, och utan storloppet (620 tkr) hade han inte gjort det. */
  const stor = { id: 99, namn: "Storloppsvinnaren", segrar: 4, starter: 20,
    intjänat: 500000, milstolpar: [{ typ: "storloppsseger" }] };
  invalIHallOfFame(spel, stor);
  const ix = spel.hallOfFame.findIndex((p) => p.namn === "Storloppsvinnaren");
  const ixH5 = spel.hallOfFame.findIndex((p) => p.namn === "Häst5");
  prov("storloppet lyfte förbi den jämnrike",
    ix !== -1 && (ixH5 === -1 || ix < ixH5));
}

console.log("\nPROV 4 — krönikan byggs av året, inte av en mall");
{
  const spel = nyttProvspel();
  spel.krönika = [
    { typ: "storloppsseger", säsong: 4, vecka: 12, betydelse: 92,
      aktörer: { hästNamn: "Vindarnas Ö" },
      data: { lopp: "Kungsloppet", bana: "Solvalla", position1000: "dödens" } },
    { typ: "stallrekord", säsong: 4, vecka: 12, betydelse: 58,
      data: { text: "Stallrekord: 74,8 per kilometer" } },
    { typ: "pensionering", säsong: 4, vecka: 20, betydelse: 60,
      aktörer: { hästNamn: "Gamle Bo" }, data: { starter: 55 } },
    { typ: "storloppsseger", säsong: 3, vecka: 5, betydelse: 92,
      aktörer: { hästNamn: "FelSäsong" }, data: { lopp: "Annat" } },
  ];
  const rad = { säsong: 4, plats: 1, avStall: 21, segrar: 14, starter: 40,
    intjänat: 2400000, bästaHäst: "Vindarnas Ö", bästaHästIntjänat: 1100000 };
  const k = skrivSäsongskrönika(spel, rad);
  const text = k.stycken.join(" ");
  prov("krönikan sparades på historikraden", rad.krönika === k);
  prov("ligasegern öppnar", text.includes("överst i tränarligan"));
  prov("årets ögonblick: dödensresan i Kungsloppet",
    text.includes("Kungsloppet") && text.includes("Utvändigt"));
  prov("fel säsongs händelser lämnas utanför", !text.includes("FelSäsong"));
  prov("rekordet nämns", text.includes("notering"));
  prov("avskedet nämns", text.includes("Gamle Bo"));
  prov("tronförsvaret avslutar", text.includes("tron"));

  const tomRad = { säsong: 4, plats: 12, avStall: 21, segrar: 1, starter: 22,
    intjänat: 90000, bästaHäst: null };
  const spel2 = nyttProvspel();
  const k2 = skrivSäsongskrönika(spel2, tomRad);
  prov("ett tomt år ger en kort krönika", k2.stycken.length === 2);
  prov("utan ögonblicksstycke", !k2.stycken.join(" ").includes("ögonblick"));
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV MISSLYCKADES\n`);
process.exit(fel ? 1 : 0);
