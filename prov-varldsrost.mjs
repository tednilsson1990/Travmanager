/**
 * PROV — världens röst: `node prov-varldsrost.mjs`
 *
 * Throttlingen ÄR designen: världen ska sorla, inte dränka. En ligarubrik
 * per säsong, sviter från fem raka, en miljonär per säsong, och högst en
 * världsföljetong var tredje vecka.
 */
import { världensRöst } from "./engine-varldsrost.js";
import { skrivPress } from "./engine-vecka.js";
import { sättRng, seedad } from "./engine-util.js";

sättRng(seedad(5));
let fel = 0;
const prov = (namn, villkor) => {
  console.log(`${villkor ? "  ok  " : "  FEL "} ${namn}`);
  if (!villkor) fel++;
};
const nyttProvspel = () => ({ säsong: 3, vecka: 12, veckor: 20, stallnamn: "Björkhaga",
  press: [], logg: [], renommé: 50,
  värld: { stall: [
    { id: 1, namn: "Storhagen", tränare: "A Alm", insprunget: 900000, segrar: 12, starter: 40 },
    { id: 2, namn: "Lillhagen", tränare: "B Berg", insprunget: 300000, segrar: 4, starter: 40 },
  ], hästar: [] },
  stall: [], resultathistorik: [] });

console.log("\nPROV 1 — ligarubriken: en per säsong, rätt vinkel");
{
  const spel = nyttProvspel();
  världensRöst(spel, skrivPress);
  prov("dominans ger ifrån-rubriken",
    spel.press.some((p) => p.rubrik.includes("Storhagen")));
  const antal = spel.press.length;
  världensRöst(spel, skrivPress);
  prov("men bara en gång per säsong", spel.press.length === antal);
  const spel2 = nyttProvspel();
  spel2.värld.stall[1].insprunget = 850000;
  världensRöst(spel2, skrivPress);
  prov("jämn toppstrid ger rysar-rubriken",
    spel2.press.some((p) => p.rubrik.includes("Rysare")));
}

console.log("\nPROV 2 — sviten: fem raka, en följetong i taget");
{
  const spel = nyttProvspel();
  spel.ligarubrikSäsong = 3;   // stäng av ligan för renodlat prov
  spel.värld.hästar = [
    { id: 10, namn: "Fyrraka", stallId: 1, svit: 4, intjänat: 0 },
    { id: 11, namn: "Femraka", stallId: 1, svit: 5, intjänat: 0 },
  ];
  världensRöst(spel, skrivPress);
  prov("fyra raka är ingen nyhet, fem är",
    !spel.press.some((p) => p.rubrik.includes("Fyrraka"))
    && spel.press.some((p) => p.rubrik.includes("Femraka")));
  spel.värld.hästar[0].svit = 6;
  världensRöst(spel, skrivPress);
  prov("följetongsfönstret spärrar tre veckor",
    !spel.press.some((p) => p.rubrik.includes("Fyrraka")));
  spel.vecka = 16;
  världensRöst(spel, skrivPress);
  prov("efter fönstret släpps nästa", spel.press.some((p) => p.rubrik.includes("Fyrraka")));
}

console.log("\nPROV 3 — miljonen: en rubrik per säsong, resten tysta");
{
  const spel = nyttProvspel();
  spel.ligarubrikSäsong = 3;
  spel.värld.hästar = [
    { id: 20, namn: "Miljonär Ett", stallId: 1, intjänat: 1100000, svit: 0 },
    { id: 21, namn: "Miljonär Två", stallId: 1, intjänat: 1200000, svit: 0 },
  ];
  världensRöst(spel, skrivPress);
  prov("första miljonären fick rubriken",
    spel.press.filter((p) => p.rubrik.includes("miljonär")).length === 1);
  spel.vecka = 16;
  världensRöst(spel, skrivPress);
  prov("den andra tystades för säsongen",
    spel.press.filter((p) => p.rubrik.includes("miljonär")).length === 1
    && spel.värld.hästar[1].miljonNoterad === true);
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV MISSLYCKADES\n`);
process.exit(fel ? 1 : 0);
