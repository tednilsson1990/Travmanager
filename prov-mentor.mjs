/**
 * PROV — mentorns sista båge: `node prov-mentor.mjs`
 *
 * Varsamheten är regeln, och den provas: bortgången kommer aldrig tidigt,
 * beskedet är två scener utan val, minnesloppet instiftas och går sin
 * vecka varje säsong, kransen registreras, och rösterna i lyssnarna
 * respekterar att mentorn är borta.
 */
import { mentornLever, prövaMentornsBortgång, mentornsNärvaro,
         veckansMinneslopp, efterMinneslopp } from "./engine-mentor.js";
import { registreraHändelse } from "./engine-handelser.js";
import { sättRng, seedad } from "./engine-util.js";
import "./engine-lyssnare.js";

let fel = 0;
const prov = (namn, villkor) => {
  console.log(`${villkor ? "  ok  " : "  FEL "} ${namn}`);
  if (!villkor) fel++;
};
const nyttProvspel = (säsong, ålder = 80) => ({
  säsong, vecka: 3, veckor: 20, stallnamn: "Björkhaga", hemmabana: "nordstad",
  kassa: 1e5, renommé: 50, spelförtroende: 50,
  krönika: [], press: [], logg: [], troférum: [], rivaliteter: {},
  huvudnyhet: null, scener: [], avelsston: [], kuskrelation: {}, minneslopp: null,
  gårdshistoria: { störstaSeger: "Guldsjuan 2009", bästaHäst: "Rimfrost Löftet" },
  förstaman: { namn: "Elin R", profil: "fostrare" },
  prolog: { aktiv: false, mentor: { namn: "Evert Sandelius", ålder } },
  stall: [], värld: { hästar: [] },
});

console.log("\nPROV 1 — aldrig före säsong 5, oavsett ålder och slump");
{
  sättRng(() => 0);   // slumpen säger alltid ja
  const spel = nyttProvspel(4, 95);
  prov("säsong 4 skonas", prövaMentornsBortgång(spel) === false && mentornLever(spel));
  prov("men mentorn åldras ändå", spel.prolog.mentor.ålder === 96);
  sättRng(seedad(1));
}

console.log("\nPROV 2 — beskedet: två scener, inga val, varsam text");
{
  sättRng(() => 0);
  const spel = nyttProvspel(8, 84);
  prov("bortgången kom", prövaMentornsBortgång(spel) === true);
  prov("registrerad i krönikan", spel.krönika.some((h) => h.typ === "mentorns_bortgång"));
  prov("två scener i kön", spel.scener.length === 2);
  prov("ingen av dem har val", spel.scener.every((s) => (s.val ?? []).length === 0));
  prov("samtalet först, runan i tidningen sedan",
    spel.scener[0].rubrik === "SAMTALET" && spel.scener[1].stil === "tidning");
  prov("texten är stilla — 'somnade in', inga detaljer",
    spel.scener[0].ingress.includes("somnade in") && spel.scener[0].ingress.includes("stilla"));
  prov("runan bär överlämningens ord",
    spel.scener[1].citat.includes("nyckelknippan"));
  prov("minnesloppet instiftades med rätt genitiv",
    spel.minneslopp?.namn === "Evert Sandelius Minne");
  prov("pressen skrev om instiftandet", spel.press.some((p) => p.rubrik.includes("Minne")));
  prov("hen prövas inte igen", prövaMentornsBortgång(spel) === false);
  sättRng(seedad(1));
}

console.log("\nPROV 3 — minnesloppet går sin vecka, med rätt namn och bana");
{
  const spel = nyttProvspel(9);
  spel.minneslopp = { namn: "Evert Sandelius Minne", vecka: 7, instiftatSäsong: 8 };
  spel.vecka = 6;
  prov("fel vecka: inget lopp", veckansMinneslopp(spel) === null);
  spel.vecka = 7;
  const lopp = veckansMinneslopp(spel);
  prov("rätt vecka: loppet finns", !!lopp && lopp.minneslopp === true);
  prov("bär mentorns namn", lopp.kortnamn === "Evert Sandelius Minne");
    /* Nyckeln måste vara en riktig bana ur namnpaketet — "solvalla" finns
     inte där (banorna är fiktiva av licensskäl), och en okänd nyckel ska
     falla tillbaka på grundloppets bana i stället för att krascha. */
  prov("går på hemmabanan", lopp.banaNamn === "Nordstad Travbana".replace(" Travbana","") || lopp.banaNamn.startsWith("Nordstad"));
  prov("deterministiskt — samma lopp vid omritning",
    JSON.stringify(veckansMinneslopp(spel)) === JSON.stringify(lopp));

  const häst = { id: 3, namn: "Vindarnas Ö" };
  efterMinneslopp(spel, lopp, häst, { ur: false, plats: 1 });
  prov("kransen registrerades", spel.krönika.some((h) => h.typ === "minnesloppsseger"));
  prov("och blev en scen", spel.scener.some((s) => s.rubrik === "KRANSEN SOM VÄGER MEST"));
  efterMinneslopp(spel, lopp, häst, { ur: false, plats: 2 });
  prov("en tvåa får ingen krans",
    spel.krönika.filter((h) => h.typ === "minnesloppsseger").length === 1);
}

console.log("\nPROV 4 — rösterna respekterar bortgången");
{
  const spel = nyttProvspel(9);
  spel.prolog.mentor.borta = true;
  spel.stall = [{ id: 1, namn: "Dottern", morId: 700, mor: "Stjärnmamman", milstolpar: [] }];
  registreraHändelse(spel, { typ: "arvet", betydelse: 96,
    aktörer: { hästId: 1, hästNamn: "Dottern" },
    data: { lopp: "Kungsloppet", mor: "Stjärnmamman", morSäsong: 2 } });
  prov("läktarraden ersätts av minnesraden",
    spel.logg.some((r) => r.includes("saknades en")));
  prov("mentorn ringer inte längre",
    !spel.logg.some((r) => r.includes("<b>Evert Sandelius</b>")));

  const före = spel.logg.length;
  sättRng(() => 0);   // hälsningschansen slår alltid in — om hen levde
  mentornsNärvaro(spel);
  prov("ingen hälsning från andra sidan", spel.logg.length === före);
  sättRng(seedad(1));
}

console.log("\nPROV 5 — närvaron glesnar med åren");
{
  const räkna = (säsong) => {
    sättRng(seedad(42));
    const spel = nyttProvspel(säsong);
    let n = 0;
    for (let i = 0; i < 2000; i++) { spel.logg = []; mentornsNärvaro(spel); n += spel.logg.length; }
    return n;
  };
  const tidigt = räkna(2), sent = räkna(12);
  prov(`år 2 hörs hen ofta (${tidigt}/2000), år 12 sällan (${sent}/2000)`,
    tidigt > sent * 3 && sent > 0);
  sättRng(seedad(1));
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV MISSLYCKADES\n`);
process.exit(fel ? 1 : 0);
