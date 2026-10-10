/**
 * PROV — RAMPLJUSET (v158, 28.1)
 *
 * Storloppshelgen drar allt ljus mot sig: journalisten ringer före
 * loppet, ägaren trycker på när hans kvalade häst inte är anmäld,
 * comebacken får sin förstasida, och orden till förhandssidan flyttar
 * hypen. Teds exempel, som system.
 */
import { byggInkorg, verkställBeslut } from "./engine-inkorg.js";
import { ärComeback, rampljusPress, nästaStorlopp } from "./engine-storlopp.js";
import { veckansLopp } from "./data-kalender.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: rampljuset\n");

/* Hitta en storloppsvecka i kalendern. */
let storvecka = null, storlopp = null;
for (let v = 18; v >= 1 && !storvecka; v--) {   /* senast på året: frånvaro hinner bli comeback */
  const l = veckansLopp(v).find((x) => x.storlopp);
  if (l) { storvecka = v; storlopp = l; }
}
ok(!!storvecka, `kalendern har en storloppsvecka (v${storvecka}: ${storlopp?.namn})`);

const grund = () => ({
  säsong: 2, vecka: storvecka, veckor: 18, kassa: 90000, renommé: 40,
  stallnamn: "Provgården", press: [], logg: [], föl: [], sponsorer: [],
  sponsorerbjudanden: [], telefonlogg: [], inkorgLästa: [], inkorgBeslutade: [],
  anmälningar: [], startadeLopp: [], kuskrelation: {}, ägarrelationer: {},
  bågeSkrivet: {},
  förstaman: { namn: "Ulla Ramp", profil: "taktiker", säsonger: 2 },
  stall: [{ id: 1, namn: "Rampens Stjärna", kön: "sto", ålder: 6, start: 70, fart: 72,
    styrka: 70, form: 60, energi: 80, skada: 0, hype: 20, starter: 22, segrar: 6,
    intjänat: 900000, senasteStartVecka: Math.max(1, storvecka - 10), resultat: [] }],
  värld: { stall: [], hästar: [] },
});

/* ---------------- Comebackdetektorn ---------------- */
{
  const spel = grund();
  const sent = { ...spel, vecka: 14 };          /* frånvaron mäts i veckor */
  ok(ärComeback(sent, { ...spel.stall[0], senasteStartVecka: 3 }),
    "lång frånvaro (≥8 veckor med karriär bakom sig) är en comeback");
  ok(!ärComeback(spel, { ...spel.stall[0], senasteStartVecka: storvecka - 1 }),
    "en häst i full gång är ingen comeback");
  ok(ärComeback(spel, { ...spel.stall[0], senasteStartVecka: storvecka - 1, friskVecka: storvecka - 2 }),
    "nyss friskförklarad är en comeback oavsett starttäthet");
  ok(!ärComeback(spel, { ...spel.stall[0], skada: 3 }),
    "en skadad häst gör ingen comeback än");
}

/* ---------------- Journalistens förhandssamtal ---------------- */
{
  const spel = grund();
  spel.anmälningar = [{ loppId: storlopp.id, hästId: 1, status: "med" }];
  const samtal = byggInkorg(spel).find((h) => h.rubrik?.startsWith("Inför "));
  ok(!!samtal && samtal.typ === "samtal" && samtal.roll === "Journalist",
    "journalisten ringer före det stora loppet");
  ok(samtal.lång.includes("Comebacken") || samtal.text.includes("comeback"),
    "comebackvinkeln finns i samtalet — det är den sporten vill läsa");
  /* Orden flyttar hypen. */
  const före = spel.stall[0].hype;
  verkställBeslut(spel, samtal, "upp");
  ok(spel.stall[0].hype > före && spel.press.some((p) => p.rubrik.includes("vinna")),
    `»vi är här för att vinna« höjer trycket (hype ${före} → ${spel.stall[0].hype})`);
  const spel2 = grund();
  spel2.anmälningar = [{ loppId: storlopp.id, hästId: 1, status: "med" }];
  const samtal2 = byggInkorg(spel2).find((h) => h.rubrik?.startsWith("Inför "));
  verkställBeslut(spel2, samtal2, "ned");
  ok(spel2.stall[0].hype < 20, "att tona ned släpper ut luften");
}

/* ---------------- Ägartrycket ---------------- */
{
  const spel = grund();
  spel.stall[0].ägare = "Direktör Palm";
  spel.stall[0].senasteStartVecka = storvecka - 2;   /* ingen comeback — rent tryck */
  const samtal = byggInkorg(spel).find((h) => h.beslut?.typ === "ägartryck");
  ok(!!samtal && samtal.avsändare === "Direktör Palm",
    "ägaren ringer när hans kvalade häst inte är anmäld");
  verkställBeslut(spel, samtal, "avstår");
  const r = spel.ägarrelationer["Direktör Palm"];
  ok(r && r.sport < 50, "att säga nej kostar sportslig nöjdhet — men är ett val");
  /* Är hästen anmäld ringer ingen. */
  const spel3 = grund();
  spel3.stall[0].ägare = "Direktör Palm";
  spel3.anmälningar = [{ loppId: storlopp.id, hästId: 1, status: "med" }];
  ok(!byggInkorg(spel3).some((h) => h.beslut?.typ === "ägartryck"),
    "en anmäld häst ger inget ägartryck — ägaren fick som han ville");
}

/* ---------------- Comebackens förstasida ---------------- */
{
  const spel = grund();
  spel.anmälningar = [{ loppId: storlopp.id, hästId: 1, status: "med" }];
  const press = [];
  const skriv = (s, rubrik, byline, ton) => press.push({ rubrik, byline, ton });
  rampljusPress(spel, skriv);
  ok(press.length === 1 && press[0].rubrik.startsWith("Comebacken:"),
    `comebacken får förstasidan (${press[0]?.rubrik})`);
  rampljusPress(spel, skriv);
  ok(press.length === 1, "förstasidan skrivs EN gång — bågeSkrivet minns");
}


/* ---------------- Travspelarens lager (v159, 28.2) ---------------- */
{
  const { nySäsong } = await import("./engine-sasong.js");
  /* Tipsfacit-bokslutet: skrivs, nollställs, och språket följer utfallet. */
  const spel = {
    säsong: 1, vecka: 19, veckor: 18, press: [], logg: [], stall: [],
    historik: [], startadeLopp: [], troférum: [], rykten: [],
    tipsfacit: { spikar: 10, rätt: 3 },
    värld: { stall: [], hästar: [] },
  };
  try { nySäsong(spel); } catch { /* fixturen är minimal — pressen hinner skrivas */ }
  const facit = spel.press.find((p) => p.rubrik.includes("spikar"));
  ok(!!facit && facit.rubrik.includes("3 av 10"),
    `säsongsbokslutet redovisar spikarna (${facit?.rubrik})`);
  ok(spel.tipsfacit.spikar === 0, "räknaren nollställs — varje år får sitt facit");
}


/* ---------------- Omgången & vinklarna (v161) ---------------- */
{
  const { journalistvinkel, VINKLAR } = await import("./engine-varldsutveckling.js");
  const spel = grund();
  spel.vecka = storvecka - 1;
  spel.värld.hästar = Array.from({ length: 6 }, (_, i) => ({
    id: 500 + i, namn: `Världsnamn ${i}`, ålder: 6, skada: 0,
    start: 70, fart: 70, styrka: 70, intjänat: 900000 - i * 50000, starter: 30, segrar: 8,
  }));
  const press = [];
  rampljusPress(spel, (s, rubrik, byline, ton) => press.push({ rubrik, byline }));
  const omgång = press.find((p) => p.rubrik.startsWith("Omgången:"));
  ok(!!omgång && omgång.byline.includes("Världsnamn 0"),
    `veckan före skrivs förhandstexten med världens namn (${omgång?.rubrik})`);
  rampljusPress(spel, (s, rubrik) => press.push({ rubrik }));
  ok(press.filter((p) => p.rubrik.startsWith("Omgången:")).length === 1,
    "förhandstexten skrivs en gång per storlopp");

  const v = journalistvinkel(spel, "nyheter");
  ok(!!VINKLAR[v.id] && v.samtalston.startsWith("—"),
    `pennan har en vinkel (${v.namn}: ${v.ord})`);
  /* Vinkeln följer NAMNET: byt penna, byt blick. */
  spel.pressvärld = { journalister: { nyheter: "Nadja Severin" }, tidigare: [] };
  const v2 = journalistvinkel(spel, "nyheter");
  ok(v2.namn === "Nadja Severin", "vinkeln läser den penna som faktiskt håller spalten");
}

console.log(fel === 0 ? "\nALLT GRÖNT" : `\n${fel} FEL`);
process.exit(fel === 0 ? 0 : 1);
