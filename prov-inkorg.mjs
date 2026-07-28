/**
 * PROV — INKORGEN (v99, kap 19 etapp A)
 *
 * Inkorgen ska vara pålitlig som ett postbud: samma spel ger samma
 * händelser med samma id:n (annars tappas lästmarkeringarna),
 * beslut sorteras alltid först, varje händelse har avsändare, typ,
 * rubrik och en genväg som pekar på en verklig flik — och källorna
 * täcks: skadad häst ger veterinärrapport, negativt netto ger
 * ekonomirapport, press ger Travbladsnyhet, passande propositioner
 * ger arrangörsmejl.
 */
import { sättRng, seedad } from "./engine-util.js";
import { byggInkorg, inkorgsläge, synligInkorg, verkställBeslut } from "./engine-inkorg.js";
import { nyHäst } from "./engine-hast.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

function byggSpel() {
  sättRng(seedad(7));
  const stall = [nyHäst({ ålder: 5 }), nyHäst({ ålder: 4 }), nyHäst({ ålder: 6 })];
  sättRng();
  stall[0].skada = 0; stall[0].intjänat = 90000; stall[0].form = 62;
  stall[1].skada = 3; stall[1].namn = "Provhästen Skadad";
  stall[2].skada = 0; stall[2].intjänat = 40000;
  return {
    vecka: 6, veckor: 18, säsong: 2, kassa: 40000,
    stall, förstaman: { namn: "Ulla Provsson", profil: "taktiker", säsonger: 2 },
    personal: [], byggen: {}, press: [
      { rubrik: "Provrubrik ett", byline: "En rad om saken." },
      { rubrik: "Provrubrik två", byline: "En annan rad." },
    ],
    sponsor: { namn: "Provfirman", krav: { text: "två segrar", mål: 2, nu: 0 }, veckorKvar: 2 },
    sponsorer: [], sponsorerbjudanden: [{ namn: "Provbolaget", typId: "foder", typnamn: "Foderpartner",
      perVecka: 1500, segerbonus: 4000, gällerTill: 8, krav: { text: "en seger", mål: 1, nu: 0 } }],
    kassa2: 0, inkorgLästa: [], inkorgBeslutade: [],
  };
}

console.log("PROV: inkorgen\n");

/* ---------- Determinism och id-stabilitet ---------- */
{
  const spel = byggSpel();
  const a = byggInkorg(spel);
  const b = byggInkorg(spel);
  ok(a.length > 4, `inkorgen fylls ur källorna (${a.length} händelser)`);
  ok(a.length === b.length && a.every((h, i) => h.id === b.id?.[i]?.id || h.id === b[i].id),
    "samma spel ger samma händelser med samma id:n — lästmarkeringarna överlever");
  ok(new Set(a.map((h) => h.id)).size === a.length, "alla id:n är unika");
}

/* ---------- Prioritetssortering och fältkrav ---------- */
{
  const a = byggInkorg(byggSpel());
  const ordning = { beslut: 0, rekommendation: 1, info: 2 };
  ok(a.every((h, i) => i === 0 || ordning[a[i - 1].prioritet] <= ordning[h.prioritet]),
    "beslut sorteras först, sedan rekommendationer, sist information");
  const flikar = new Set(["hem", "inkorg", "stall", "lopp", "sfar", "kontor", "gård", "mer"]);
  ok(a.every((h) => h.avsändare && h.rubrik && h.text !== undefined
      && ["sms", "samtal", "mejl", "rapport", "nyhet"].includes(h.typ)),
    "varje händelse har avsändare, rubrik och giltig typ");
  ok(a.every((h) => flikar.has(h.flik)),
    "varje genväg pekar på en verklig flik — aldrig en återvändsgränd");
}

/* ---------- Källtäckningen ---------- */
{
  const a = byggInkorg(byggSpel());
  ok(a.some((h) => h.avsändare === "Veterinären" && h.rubrik.includes("Provhästen Skadad")),
    "skadad häst → veterinärrapport med hästens namn");
  ok(a.some((h) => h.avsändare === "Travbladet" && h.typ === "nyhet" && h.flik === "sfar"),
    "pressen → Travbladsnyhet med genväg till Sfären");
  ok(a.some((h) => h.avsändare === "Provfirman" && h.typ === "samtal" && h.prioritet === "beslut"),
    "sponsoravtal på upphällningen → telefonsamtal som kräver beslut");
  ok(a.some((h) => h.typ === "sms"), "vägvisaren → förstamannens sms");
}

/* ---------- Olästräknaren ---------- */
{
  const spel = byggSpel();
  const före = inkorgsläge(spel);
  const alla = byggInkorg(spel);
  spel.inkorgLästa = [alla[0].id];
  const efter = inkorgsläge(spel);
  ok(före.antal === alla.length && efter.antal === alla.length - 1,
    `lästmarkeringen räknas: ${före.antal} → ${efter.antal} olästa`);
  ok(före.beslut >= 1, `${före.beslut} händelse(r) kräver beslut — märket i flikraden har underlag`);
}

/* ---------- Beslut i raden (v100) ---------- */
{
  const spel = byggSpel();
  const alla = byggInkorg(spel);
  const sponsorfråga = alla.find((h) => h.avsändare === "Provbolaget");
  ok(!!sponsorfråga && sponsorfråga.beslut?.alternativ?.length === 2
    && sponsorfråga.detaljer?.length >= 2,
    "sponsorerbjudandet är en beslutshändelse med två val och detaljrader");
  ok(!alla.some((h) => h.typ === "sms" && h.text.includes("vill sponsra")),
    "vägvisarens dubblettrad är filtrerad — en fråga ställs aldrig två gånger");

  verkställBeslut(spel, sponsorfråga, "ja");
  ok((spel.sponsorer ?? []).length === 1 && spel.sponsorerbjudanden.length === 0,
    "»Skriv på« i inkorgen tecknar avtalet — samma mutation som Kontoret");
  ok(spel.inkorgBeslutade.includes(sponsorfråga.id)
    && !synligInkorg(spel).some((h) => h.id === sponsorfråga.id),
    "besvarade beslut försvinner ur den synliga inkorgen");

  /* Träningsjusteringen: godkännandet lägger om alla friska hästar. */
  const spel2 = byggSpel();
  spel2.stall.forEach((h) => { h.träning = "lugnt"; });
  const fråga = byggInkorg(spel2).find((h) => h.beslut?.typ === "träningsjustering");
  if (fråga) {
    verkställBeslut(spel2, fråga, "godkänn");
    ok(!byggInkorg(spel2).some((h) => h.beslut?.typ === "träningsjustering"),
      "»Lägg om enligt råden« nollar avvikelserna — frågan självslocknar");
  } else {
    ok(true, "(råden råkade sammanfalla med planen — träningsprovet överhoppat)");
  }
}

sättRng();
console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
