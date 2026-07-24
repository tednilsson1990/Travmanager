/**
 * PROV — scenerna: `node prov-scener.mjs`
 *
 * Scenkön ska vara serialiserbar, valen ska ha effekt, och en okänd
 * effekttyp ska degradera snällt. Dessutom: helskärmsscenen skapas av
 * samma händelser som uppslaget på Hem — en källa, två visningar.
 */
import { registreraHändelse } from "./engine-handelser.js";
import { köScen, görVal, stängScen } from "./engine-scener.js";
import "./engine-lyssnare.js";

let fel = 0;
const prov = (namn, villkor) => {
  console.log(`${villkor ? "  ok  " : "  FEL "} ${namn}`);
  if (!villkor) fel++;
};
const nyttProvspel = () => ({
  säsong: 3, vecka: 7, stallnamn: "Björkhaga",
  kassa: 100000, renommé: 40, spelförtroende: 50,
  krönika: [], press: [], logg: [], troférum: [], rivaliteter: {},
  huvudnyhet: null, scener: [], avelsston: [], kuskrelation: {},
  förstaman: { namn: "Elin Ranstad", profil: "fostrare" },
  prolog: { aktiv: false, mentor: { namn: "Gunnar Falk" } },
  stall: [], värld: { hästar: [] },
});

console.log("\nPROV 1 — storloppsseger ger scen med intervjuval, i synk med uppslaget");
{
  const spel = nyttProvspel();
  spel.stall.push({ id: 12, namn: "Vindarnas Ö", hype: 30, milstolpar: [] });
  registreraHändelse(spel, {
    typ: "storloppsseger", betydelse: 92,
    aktörer: { hästId: 12, kuskNamn: "Ola Kvist" },
    data: { lopp: "Silverpokalen", bana: "Solvalla", streck: 8,
            position1000: "dödens", meterUtanRygg: 340 },
  });
  const scen = spel.scener[0];
  prov("scenen köades", !!scen);
  prov("samma rubrik som uppslaget", scen?.rubrik === spel.huvudnyhet?.rubrik);
  prov("tre intervjuval", (scen?.val ?? []).length === 3);
  prov("scenen är serialiserbar (inga funktioner)",
    JSON.parse(JSON.stringify(spel.scener))[0].val[0].effekt === "intervju_tala_upp");
  prov("nyheten sätts som tidningssida med signatur",
    scen.stil === "tidning" && !!scen.signatur);

  const hypeFöre = spel.stall[0].hype;
  görVal(spel, 0, "upp");
  prov("valet höjde hypen", spel.stall[0].hype > hypeFöre);
  prov("pressen skrev om uttalandet", spel.press.some((p) => p.rubrik.includes("bara början")));
  prov("scenen lämnade kön", spel.scener.length === 0);
}

console.log("\nPROV 2 — hylla kusken bygger relationen");
{
  const spel = nyttProvspel();
  spel.stall.push({ id: 12, namn: "Vindarnas Ö", hype: 30, milstolpar: [] });
  registreraHändelse(spel, {
    typ: "storloppsseger", betydelse: 92,
    aktörer: { hästId: 12, kuskNamn: "Ola Kvist" },
    data: { lopp: "Silverpokalen", bana: "Solvalla", streck: 30 },
  });
  görVal(spel, 0, "kusk");
  prov("kuskrelationen steg", (spel.kuskrelation["Ola Kvist"] ?? 0) > 50);
}

console.log("\nPROV 3 — stjärnstoets pension: sälja tar henne ur hagen");
{
  const spel = nyttProvspel();
  spel.avelsston = [{ id: 8, namn: "Stjärnan", ålder: 14, start: 70, fart: 72, styrka: 68 }];
  registreraHändelse(spel, {
    typ: "pensionering", betydelse: 80,
    aktörer: { hästId: 8, hästNamn: "Stjärnan" },
    data: { ålder: 13, starter: 60, segrar: 9, intjänat: 1200000 },
  });
  const scen = spel.scener[0];
  prov("avskedsscenen köades", scen?.rubrik === "STJÄRNAN SLUTAR");
  prov("hagen gav valet", (scen?.val ?? []).length === 2);
  prov("budet växer med meriterna", scen?.data?.bud > 200000);

  const kassaFöre = spel.kassa;
  görVal(spel, 0, "sälj");
  prov("försäljningen betalade", spel.kassa === kassaFöre + scen.data.bud);
  prov("och tömde hagen", spel.avelsston.length === 0);
}

console.log("\nPROV 4 — pension utan hage ger scen utan val");
{
  const spel = nyttProvspel();
  registreraHändelse(spel, {
    typ: "pensionering", betydelse: 60,
    aktörer: { hästId: 99, hästNamn: "Valacken" },
    data: { ålder: 13, starter: 40, segrar: 3, intjänat: 400000 },
  });
  prov("scen utan val", (spel.scener[0]?.val ?? []).length === 0);
  stängScen(spel, 0);
  prov("Vidare stänger den", spel.scener.length === 0);
}

console.log("\nPROV 5 — robusthet: okänt val och okänd effekt");
{
  const spel = nyttProvspel();
  köScen(spel, { betydelse: 50, rubrik: "PROV",
    val: [{ id: "x", effekt: "finns_inte", text: "?" }] });
  görVal(spel, 0, "saknas");     // ogiltigt val-id: inget händer, scenen kvar
  prov("ogiltigt val lämnar scenen kvar", spel.scener.length === 1);
  görVal(spel, 0, "x");          // okänd effekt: scenen stängs ändå
  prov("okänd effekt kraschar inte och stänger scenen", spel.scener.length === 0);
}

console.log("\nPROV 6 — kön prioriterar och begränsas");
{
  const spel = nyttProvspel();
  for (let i = 0; i < 7; i++) köScen(spel, { betydelse: 30 + i * 10, rubrik: "S" + i });
  prov("högst fem i kön", spel.scener.length === 5);
  prov("viktigast först", spel.scener[0].rubrik === "S6");
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV MISSLYCKADES\n`);
process.exit(fel ? 1 : 0);
