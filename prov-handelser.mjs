/**
 * PROV — händelsebussen: `node prov-handelser.mjs`
 *
 * Bussen har ingen kalibrering att falla tillbaka på: går en lyssnare
 * sönder märks det som en uteblíven rubrik, inte som ett fel. Därför det
 * här skriptet. Det kör en händelse genom hela kedjan och kontrollerar att
 * VARJE reaktion faktiskt inträffade — press, mentor, ägare, förstaman,
 * troférum, renommé, krönika.
 *
 * Kör det efter varje ändring i engine-lyssnare.js.
 */
import { registreraHändelse, uppdateraRivalitet, loppfakta, slåUppHäst,
         rivalerFör, händelserOm } from "./engine-handelser.js";
import "./engine-lyssnare.js";

let fel = 0;
const prov = (namn, villkor) => {
  console.log(`${villkor ? "  ok  " : "  FEL "} ${namn}`);
  if (!villkor) fel++;
};

/** Minsta möjliga spel — bussen ska inte kräva ett helt karriärläge. */
function nyttProvspel() {
  return {
    säsong: 3, vecka: 7, stallnamn: "Björkhaga",
    kassa: 100000, renommé: 40, spelförtroende: 50,
    krönika: [], press: [], logg: [], troférum: [], rivaliteter: {},
    huvudnyhet: null,
    förstaman: { namn: "Elin Ranstad", profil: "fostrare" },
    prolog: { aktiv: false, mentor: { namn: "Gunnar Falk" } },
    stall: [], värld: { hästar: [] },
  };
}

console.log("\nPROV 1 — storloppsseger utlöser alla reaktioner");
{
  const spel = nyttProvspel();
  const häst = { id: 12, namn: "Vindarnas Ö", ägare: "Stall Nordkap", milstolpar: [] };
  spel.stall.push(häst);

  registreraHändelse(spel, {
    typ: "storloppsseger", betydelse: 92,
    aktörer: { hästId: 12, kuskNamn: "Ola Kvist", ägare: "Stall Nordkap" },
    data: { lopp: "Silverpokalen", bana: "Solvalla", streck: 8,
            position1000: "dödens", meterUtanRygg: 340, marginal: 2.4, segertid: 72.1 },
  });

  prov("krönikan fick posten", spel.krönika.length === 1);
  prov("hästNamn fylldes i ur id:t", spel.krönika[0].aktörer.hästNamn === "Vindarnas Ö");
  prov("förstamanId sattes automatiskt", spel.krönika[0].aktörer.förstamanId === "Elin Ranstad");
  /* Sedan v67 dras rubriken ur en variantpool — provet låser GRENEN
     (dödensresan), inte den exakta strängen. */
  prov("huvudnyheten skrevs ur dödensgrenen",
    ["KROSSADE MOTSTÅNDET", "STARKAST NÄR DET KOSTADE", "VANN UTAN RYGG — VANN ÄNDÅ"]
      .includes(spel.huvudnyhet?.rubrik));
  prov("huvudnyheten fick faktaruta", (spel.huvudnyhet?.fakta ?? []).length >= 4);
  prov("troférummet fick sin pokal", spel.troférum.length === 1);
  prov("renommét steg", spel.renommé > 40);
  prov("mentorn skrev i pressen", spel.press.some((p) => p.rubrik.includes("Gunnar Falk")));
  prov("ägaren hörde av sig", spel.logg.some((r) => r.includes("Stall Nordkap")));
  prov("förstamannen kommenterade", spel.logg.some((r) => r.includes("Elin")));
}

console.log("\nPROV 2 — en trasig lyssnare fäller inte de andra");
{
  const spel = nyttProvspel();
  const { påHändelse } = await import("./engine-handelser.js");
  const av = påHändelse("miljonen", () => { throw new Error("avsiktligt"); });
  registreraHändelse(spel, {
    typ: "miljonen", betydelse: 70,
    aktörer: { hästId: 1, hästNamn: "Provhästen" },
  });
  av();
  prov("felet hamnade i loggen", spel.logg.some((r) => r.includes("avsiktligt")));
  prov("de övriga lyssnarna körde ändå", spel.troférum.length === 1);
  prov("pressen skrev om miljonen", spel.press.length > 0);
}

console.log("\nPROV 3 — rivaliteten upptäcks först vid femte mötet");
{
  const spel = nyttProvspel();
  const häst = { id: 5, namn: "Grimstad", milstolpar: [] };
  spel.stall.push(häst);
  const fakta = { rivalId: 900, rivalNamn: "Åbytorparn", vannMot: false };

  for (let i = 1; i <= 4; i++) uppdateraRivalitet(spel, häst, fakta);
  prov("fyra möten ger ingen händelse", spel.krönika.length === 0);
  prov("men mötena räknas", rivalerFör(spel, häst)[0]?.möten === 4);

  uppdateraRivalitet(spel, häst, { ...fakta, vannMot: true });
  prov("femte mötet utropar rivaliteten", spel.krönika.some((h) => h.typ === "rivalitet"));
  prov("pressen skrev om den", spel.press.some((p) => p.rubrik.includes("Åbytorparn")));

  uppdateraRivalitet(spel, häst, fakta);
  prov("den utropas bara en gång",
    spel.krönika.filter((h) => h.typ === "rivalitet").length === 1);
  prov("ställningen räknas åt båda håll",
    rivalerFör(spel, häst)[0].dinaSegrar === 1 && rivalerFör(spel, häst)[0].hansSegrar === 5);
}

console.log("\nPROV 4 — loppfakta läser rätt ur simuleringen");
{
  const häst = { id: 3, namn: "Egen Häst", egen: true };
  const rival = { id: 77, namn: "Motståndaren", egen: false };
  const sim = {
    resultat: [
      { plats: 1, häst, sek: 100.0, km: 71.4, streck: 30 },
      { plats: 2, häst: rival, sek: 100.4, streck: 22 },
    ],
    bild: [
      { meter: 600, rader: [{ namn: "Egen Häst", läge: "rygg ledaren" }] },
      { meter: 1140, rader: [{ namn: "Egen Häst", läge: "dödens" }] },
      { meter: 1800, rader: [{ namn: "Egen Häst", läge: "leder" }] },
    ],
  };
  const min = { plats: 1, ur: false, sek: 100.0, km: 71.4, streck: 30, dödensTid: 30 };
  const f = loppfakta(sim, min, { dist: 2140 }, häst);

  prov("favoritskapet avgjordes ur streckprocenten", f.favorit === true);
  prov("position vid 1 000 m togs ur rätt bildruta", f.position1000 === "dödens");
  prov("marginalen räknades i längder", Math.abs(f.marginal - 2.2) < 0.01);
  prov("meter utan rygg räknades", f.meterUtanRygg === 390);
  prov("rivalen är hästen närmast bakom", f.rivalId === 77);
  prov("mötet räknades", f.möten.length === 1 && f.möten[0].dinSeger === true);
}

console.log("\nPROV 5 — uppslagning och biografi");
{
  const spel = nyttProvspel();
  const häst = { id: 44, namn: "Sökt Häst", milstolpar: [] };
  spel.stall.push(häst);
  registreraHändelse(spel, { typ: "första_seger", betydelse: 55,
    aktörer: { hästId: 44 }, data: { lopp: "Ett lopp", bana: "Åby" } });

  prov("hästen går att slå upp ur id:t", slåUppHäst(spel, 44)?.namn === "Sökt Häst");
  prov("okänt id ger null, inte krasch", slåUppHäst(spel, 9999) === null);
  prov("händelserOm hittar hästens historia", händelserOm(spel, "hästId", 44).length === 1);
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV MISSLYCKADES\n`);
process.exit(fel ? 1 : 0);
