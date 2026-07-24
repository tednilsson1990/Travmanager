/**
 * PROV — storloppsbågen och arvet: `node prov-storlopp.mjs`
 *
 * Bågen är härledd ur kalendern och spelläget; det här skriptet låser
 * dess kontrakt: rätt lopp hittas, kvalgränsen räknas rätt, varje
 * pressetapp skrivs exakt en gång, och arvet upptäcks ur krönikan även
 * när modern inte längre finns i stallet.
 */
import { nästaStorlopp, kvalläge, körStorloppsbåge } from "./engine-storlopp.js";
import { registreraHändelse, hästmilstolpar } from "./engine-handelser.js";
import { skrivPress } from "./engine-vecka.js";
import { veckansLopp } from "./data-kalender.js";

let fel = 0;
const prov = (namn, villkor) => {
  console.log(`${villkor ? "  ok  " : "  FEL "} ${namn}`);
  if (!villkor) fel++;
};
const nyttProvspel = (vecka) => ({
  säsong: 2, vecka, veckor: 20, stallnamn: "Björkhaga",
  kassa: 100000, renommé: 40, spelförtroende: 50,
  krönika: [], press: [], logg: [], troférum: [], rivaliteter: {},
  huvudnyhet: null, bågeSkrivet: {}, båge: null,
  förstaman: { namn: "Elin Ranstad", profil: "taktiker" },
  prolog: { aktiv: false, mentor: { namn: "Gunnar Falk" } },
  stall: [], värld: { hästar: [], stall: [] },
});

console.log("\nPROV 1 — bågen hittar rätt lopp och kvalläget stämmer");
{
  const spel = nyttProvspel(2);              // Vinterpokalen går vecka 5
  const nästa = nästaStorlopp(spel);
  prov("nästa storlopp är Vinterpokalen", nästa?.lopp.kortnamn === "Vinterpokalen");
  prov("tre veckor kvar", nästa?.veckorKvar === 3);

  spel.stall = [
    { id: 1, namn: "Kvalad", kön: "hingst", ålder: 6, intjänat: 400000 },
    { id: 2, namn: "Nära", kön: "sto", ålder: 5, intjänat: 200000 },
    { id: 3, namn: "Långtifrån", kön: "hingst", ålder: 6, intjänat: 30000 },
  ];
  const { kvalade, nära } = kvalläge(spel, nästa.lopp);   // gräns 250 tkr
  prov("den kvalade hittas", kvalade.length === 1 && kvalade[0].namn === "Kvalad");
  prov("den nära hittas med rätt saknat belopp",
    nära.length === 1 && nära[0].häst.namn === "Nära" && nära[0].saknas === 50000);
}

console.log("\nPROV 2 — varje pressetapp skrivs exakt en gång");
{
  const spel = nyttProvspel(2);
  spel.stall = [{ id: 1, namn: "Kvalad", kön: "hingst", ålder: 6, intjänat: 400000 }];
  körStorloppsbåge(spel, skrivPress);
  const efterFörsta = spel.press.length;
  prov("upptakten skrevs", efterFörsta === 1);
  körStorloppsbåge(spel, skrivPress);
  prov("men inte två gånger", spel.press.length === efterFörsta);
  prov("bågen syns för Hem", spel.båge?.lopp === "Vinterpokalen" && spel.båge.kvalade.length === 1);

  spel.vecka = 4;                            // en vecka kvar
  körStorloppsbåge(spel, skrivPress);
  prov("laddningen registrerades som händelse",
    spel.krönika.some((h) => h.typ === "storloppsladdning"));
  prov("förstamannen kommenterade upplägget",
    spel.logg.some((r) => r.includes("Elin")));
}

console.log("\nPROV 3 — arvet upptäcks ur krönikan, inte ur stallet");
{
  const spel = nyttProvspel(5);
  /* Modern vann Vinterpokalen säsong 1 — och finns INTE längre i spelet. */
  spel.krönika.push({ id: "h1", typ: "storloppsseger", säsong: 1, vecka: 5,
    betydelse: 92, aktörer: { hästId: 700, hästNamn: "Stjärnmamman" },
    data: { lopp: "Vinterpokalen" } });

  const dotter = { id: 41, namn: "Dottern", morId: 700, mor: "Stjärnmamman",
    starter: 9, segrar: 3, intjänat: 500000, milstolpar: [
      { typ: "första_start" }, { typ: "första_prispeng" }, { typ: "första_seger" }] };
  spel.stall = [dotter];
  const lopp = veckansLopp(5).find((l) => l.storlopp);
  hästmilstolpar(spel, dotter, lopp, { ur: false, plats: 1 }, 150000, {});

  const arv = spel.krönika.find((h) => h.typ === "arvet");
  prov("arvet registrerades", !!arv);
  prov("med moderns säsong", arv?.data?.morSäsong === 1);
  prov("huvudnyheten är SOM SIN MOR", spel.huvudnyhet?.rubrik === "SOM SIN MOR");
  prov("mentorn stod på läktaren", spel.logg.some((r) => r.includes("läktaren")));
  prov("troféen kom på plats", spel.troférum.some((t) => t.typ === "arvet"));
}

console.log("\nPROV 4 — inget arv utan matchande lopp");
{
  const spel = nyttProvspel(5);
  spel.krönika.push({ id: "h1", typ: "storloppsseger", säsong: 1, vecka: 9,
    betydelse: 92, aktörer: { hästId: 700, hästNamn: "Stjärnmamman" },
    data: { lopp: "Stochampionatet" } });
  const dotter = { id: 41, namn: "Dottern", morId: 700, mor: "Stjärnmamman",
    starter: 9, segrar: 3, intjänat: 500000, milstolpar: [
      { typ: "första_start" }, { typ: "första_prispeng" }, { typ: "första_seger" }] };
  spel.stall = [dotter];
  const lopp = veckansLopp(5).find((l) => l.storlopp);
  hästmilstolpar(spel, dotter, lopp, { ur: false, plats: 1 }, 150000, {});
  prov("annat lopp ger inget arv", !spel.krönika.some((h) => h.typ === "arvet"));
}

console.log("\nPROV 5 — avelshagen tar emot pensionerade stjärnston");
{
  const { nySäsong } = await import("./engine-sasong.js");
  const { byggVärld } = await import("./engine-varld.js");
  const spel = nyttProvspel(21);
  spel.värld = byggVärld();
  spel.stall = [
    { id: 1, namn: "Stjärnan", kön: "sto", ålder: 13, segrar: 6, intjänat: 900000,
      start: 70, fart: 72, styrka: 68, hype: 10, form: 50, energi: 80, milstolpar: [] },
    { id: 2, namn: "Utan meriter", kön: "sto", ålder: 13, segrar: 0, intjänat: 40000,
      start: 40, fart: 40, styrka: 40, hype: 5, form: 50, energi: 80, milstolpar: [] },
    { id: 3, namn: "Ung och kvar", kön: "sto", ålder: 5, segrar: 1, intjänat: 90000,
      start: 55, fart: 55, styrka: 55, hype: 5, form: 50, energi: 80, milstolpar: [] },
  ];
  nySäsong(spel);
  prov("stjärnan hamnade i hagen", (spel.avelsston ?? []).some((m) => m.namn === "Stjärnan"));
  prov("den meritlösa gjorde det inte", !(spel.avelsston ?? []).some((m) => m.namn === "Utan meriter"));
  prov("den unga stannade i stallet", spel.stall.some((h) => h.namn === "Ung och kvar"));
  prov("egenskaperna frystes", spel.avelsston[0]?.fart === 72);
  prov("pensioneringarna registrerades",
    spel.krönika.filter((h) => h.typ === "pensionering").length === 2);
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV MISSLYCKADES\n`);
process.exit(fel ? 1 : 0);
