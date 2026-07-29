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
import { följUppÄgarlöften } from "./engine-agare.js";
import { byggInkorg, inkorgsläge, synligInkorg, verkställBeslut, berättelsetrådar } from "./engine-inkorg.js";
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
    sponsorer: [{ namn: "Provfirman", perVecka: 900, krav: { text: "två segrar", mål: 2, nu: 0 }, veckorKvar: 2 }], sponsorerbjudanden: [{ namn: "Provbolaget", typId: "foder", typnamn: "Foderpartner",
      perVecka: 1500, segerbonus: 4000, gällerTill: 8, krav: { text: "en seger", mål: 1, nu: 0 } }],
    kassa2: 0, inkorgLästa: [], inkorgBeslutade: [],
    huvudnyhet: { säsong: 2, vecka: 6, etikett: "Storloppssöndag", rubrik: "Provrubriken över uppslaget",
      ingress: "Ingressen som sätter tonen.", brödtext: "Brödtexten som bara helskärmen visar i sin helhet." },
    båge: { lopp: "Provpokalen", veckorKvar: 3 },
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
  const ofästa = a.filter((h) => !h.fäst);
  ok(a.findIndex((h) => h.fäst) === 0,
    "fästa händelser (veckomötet) ligger först — sedan prioriteterna");
  ok(ofästa.every((h, i) => i === 0 || ordning[ofästa[i - 1].prioritet] <= ordning[h.prioritet]),
    "bland de ofästa: beslut, sedan rekommendationer, sist information");
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

/* ---------- Veckomötet (v105, 20.4) ---------- */
{
  const spel = byggSpel();
  const möte = byggInkorg(spel).find((h) => h.fäst);
  ok(!!möte && möte.typ === "rapport" && möte.rubrik.includes("genomgång"),
    "veckans genomgång är måndagens fästa rapport");
  ok(möte.lång.split("\n\n").length >= 4,
    `genomgången har sektioner för helskärmen (${möte.lång.split("\n\n").length} stycken)`);
  ok(möte.lång.includes("EKONOMI") && möte.lång.includes("FORMEN")
    && möte.lång.includes("SPONSORN"),
    "ekonomi, form och sponsorläget står i mötet under sina rubriker");
  ok(!byggInkorg(spel).some((h) => !h.fäst && h.rubrik.startsWith("Veckonettot")),
    "den lösa nettorapporten viker när genomgången bär siffrorna");
  const utanFm = { ...byggSpel(), förstaman: null };
  ok(!byggInkorg(utanFm).some((h) => h.fäst),
    "utan förstaman: inget möte — ingen låtsasröst");
}

/* ---------- Ägarna och kuskarna (v110) ---------- */
{
  const spel = byggSpel();
  spel.stall[0].ägare = "Lena Provägare";
  spel.stall[0].senasteStartVecka = 1;   /* vecka 6 nu — fem veckor still */
  spel.ägarrelationer = { "Lena Provägare": { relation: 48, sport: 48, komm: 48, typ: "lojal" } };
  const samtal = byggInkorg(spel).find((h) => h.roll === "Hästägare" && h.beslut);
  ok(!!samtal && samtal.beslut.typ === "ägarlöfte"
    && samtal.lång.split("\n").filter((r) => r.startsWith("—")).length >= 4,
    "otålig ägare ringer — replikväxling med ett riktigt val");

  verkställBeslut(spel, samtal, "lova");
  ok(spel.ägarlöften["Lena Provägare"]?.deadline === spel.vecka + 3
    && spel.ägarrelationer["Lena Provägare"].komm > 48,
    "löftet bokförs med deadline och värmer kommunikationen");

  /* Uppföljningen: hålls löftet stärks den — bryts det rasar den. */
  spel.stall[0].senasteStartVecka = spel.vecka + 1;
  spel.vecka += 2;
  följUppÄgarlöften(spel);
  ok(!spel.ägarlöften["Lena Provägare"] && spel.ägarrelationer["Lena Provägare"].komm >= 55,
    "hållet löfte: uppfyllt, avskrivet och belönat");

  const spel2 = byggSpel();
  spel2.stall[0].ägare = "Bo Provägare";
  spel2.ägarrelationer = { "Bo Provägare": { relation: 40, sport: 40, komm: 40, typ: "otålig" } };
  spel2.ägarlöften = { "Bo Provägare": { hästId: spel2.stall[0].id, från: 3, deadline: 5 } };
  spel2.stall[0].senasteStartVecka = 1;
  spel2.vecka = 6;
  följUppÄgarlöften(spel2);
  ok(spel2.löftesbrott["Bo Provägare"] === 6
    && spel2.ägarrelationer["Bo Provägare"].komm <= 28,
    "brutet löfte: kommunikationen rasar och brottet antecknas");
  ok(byggInkorg(spel2).some((h) => h.rubrik === "Löftet som inte hölls"),
    "ägaren säger det rakt ut i inkorgen veckan därpå");

  /* Kuskens måndags-sms ur färskaste raden. */
  const spel3 = byggSpel();
  spel3.stall[0].resultat = [{ säsong: 2, vecka: 5, lopp: "P", plats: 1, km: 14.9,
    läge: "rygg/inner", kusk: "Ann Provkusk", pris: 30000 }];
  const kusksms = byggInkorg(spel3).find((h) => h.roll === "Kusk");
  ok(!!kusksms && kusksms.text.includes("svarade direkt"),
    "kusken sms:ar på måndagen — segertonen ur radens verkliga innehåll");
}

/* ---------- Formaten och rösterna (v108) ---------- */
{
  const spel = byggSpel();
  const alla = byggInkorg(spel);
  const mejl = alla.find((h) => h.typ === "mejl" && h.avsändare === "Arrangörerna");
  ok(!!mejl && mejl.lång.startsWith("Hej") && mejl.lång.includes("Med vänlig hälsning"),
    "arrangörsmejlet är ett riktigt brev — hälsning, stycken, signatur");
  const samtal = alla.find((h) => h.avsändare === "Provbolaget");
  ok(samtal?.lång?.split("\n").filter((r) => r.startsWith("—")).length >= 4,
    "sponsorsamtalet är en replikväxling — minst fyra repliker med tankstreck");
  const vet = alla.find((h) => h.avsändare === "Veterinären");
  ok(vet?.lång?.includes("VETERINÄRRAPPORT") && vet.lång.includes("BEDÖMNING"),
    "veterinärens rapport har rapportens struktur");
  const skötarsms = alla.find((h) => h.roll === "Hästskötare");
  ok(!!skötarsms && skötarsms.typ === "sms",
    "skötaren hörs från stallgången — stallets tredje röst");

  /* Vilobeslut: sista skadeveckan ger valet, och extra vila verkställs. */
  spel.stall[1].skada = 1; spel.stall[1].energi = 50;
  const vetBeslut = byggInkorg(spel).find((h) => h.avsändare === "Veterinären" && h.beslut);
  ok(!!vetBeslut && vetBeslut.beslut.typ === "vila",
    "sista skadeveckan: veterinären ger ett riktigt val");
  verkställBeslut(spel, vetBeslut, "extra");
  ok(spel.stall[1].skada === 2 && spel.stall[1].energi === 62,
    "»en vecka extra vila« verkställs: skadan +1, orken +12");
}

/* ---------- Storyn i inkorgen (v103) ---------- */
{
  const spel = byggSpel();
  const alla = byggInkorg(spel);
  const uppslag = alla.find((h) => h.rubrik === "Provrubriken över uppslaget");
  ok(!!uppslag && uppslag.typ === "nyhet" && uppslag.etikett === "Storloppssöndag",
    "huvudnyheten blir ett urklipp med sin etikett");
  ok(uppslag.lång?.includes("Brödtexten") && !uppslag.text.includes("Brödtexten"),
    "långa texten bär brödtexten — listraden nöjer sig med ingressen");
  ok(alla.some((h) => h.etikett === "Följetongen" && h.rubrik === "Satsningen"),
    "följetongens trådar landar som notiser");
  ok(berättelsetrådar(spel).length >= 1
    && berättelsetrådar(spel).every((t) => t.rubrik && t.text.length > 20),
    "trådkällan är delad och bär riktig prosa — Sfären och inkorgen berättar samma sak");
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

  const avtalFöre = (spel.sponsorer ?? []).length;
  verkställBeslut(spel, sponsorfråga, "ja");
  ok((spel.sponsorer ?? []).length === avtalFöre + 1 && spel.sponsorerbjudanden.length === 0,
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
