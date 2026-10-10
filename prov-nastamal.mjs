/**
 * PROV — NÄSTA MÅL-RADEN (v133, kap 26 B-e)
 *
 * Prioritetsordningen är löftet: finalen före allt, obesvarade besked
 * före klassklivet, klassklivet före serietoppen — och vilan är också
 * ett besked. Raden är deterministisk och alltid klickbar (har flik).
 */
import { nästaMål } from "./engine-nastamal.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: nästa mål-raden\n");

const bas = () => ({ säsong: 2, vecka: 5, veckor: 18, kassa: 40000, renommé: 20,
  stall: [{ id: 1, namn: "Målhästen", skada: 0, energi: 80, intjänat: 120000 }],
  anmälningar: [], stopp: "måndag", anläggning: { boxar: 8 }, gård: { tomter: 2, markköp: 0 },
  seriepoäng: {}, sällskap: { ledamot: false } });

{
  const spel = bas();
  spel.anmälningar = [{ hästId: 1, loppId: "x", status: null }];
  spel.stopp = "onsdag";
  ok(nästaMål(spel).text.includes("uttagningsbesked"),
    "obesvarat onsdagsbesked pekas ut");

  const spel2 = bas();
  spel2.stall[0].intjänat = 230000;   /* 20 000 kr från Silver */
  const m2 = nästaMål(spel2);
  ok(m2.text.includes("Målhästen") && m2.flik === "stall",
    `klassklivet: "${m2.text}"`);

  const spel3 = bas();
  spel3.seriepoäng = { "Bronsserien": { "Målhästen": { poäng: 40, starter: 3, egen: true } } };
  ok(nästaMål(spel3).text.includes("1:a i Bronsserien"),
    "serietoppen: trappan pekas ut");

  /* Finalen slår allt — sista veckan med kvalad häst. */
  const spel4 = bas();
  spel4.vecka = 18;
  spel4.seriepoäng = { "Bronsserien": Object.fromEntries(
    ["Målhästen", "B", "C", "D", "E", "F", "G", "H"].map((n, i) =>
      [n, { poäng: 50 - i, starter: 4, egen: n === "Målhästen" }])) };
  spel4.anmälningar = [{ hästId: 1, loppId: "x", status: null }];
  spel4.stopp = "onsdag";
  ok(nästaMål(spel4).text.includes("Finalhelg"),
    "finalen före allt annat — även obesvarade besked");

  const spel5 = bas();
  spel5.stall = [];
  const m5 = nästaMål(spel5);
  ok(m5.text.length > 0 && m5.flik,
    "tomt stall: raden har alltid ett svar och en riktning");

  const a = nästaMål(bas()); const b = nästaMål(bas());
  ok(a.text === b.text, "deterministisk: samma läge ger samma rad");
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
