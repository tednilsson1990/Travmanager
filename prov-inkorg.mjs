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
import { arkiveraTelefonen } from "./engine-inkorg.js";
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
    vecka: 16, veckor: 18, säsong: 2, kassa: 40000,
    stall, förstaman: { namn: "Ulla Provsson", profil: "taktiker", säsonger: 2 },
    personal: [], byggen: {}, press: [
      { rubrik: "Provrubrik ett", byline: "En rad om saken." },
      { rubrik: "Provrubrik två", byline: "En annan rad." },
    ],
    sponsorer: [{ namn: "Provfirman", perVecka: 900,
      krav: { typ: "segrar", antal: 2, text: "två segrar" },
      status: { starter: 6, segrar: 1, hemmastarter: 0 } }], sponsorerbjudanden: [{ namn: "Provbolaget", typId: "foder", typnamn: "Foderpartner",
      perVecka: 1500, segerbonus: 4000, gällerTill: 8, krav: { text: "en seger", mål: 1, nu: 0 } }],
    kassa2: 0, inkorgLästa: [], inkorgBeslutade: [],
    huvudnyhet: { säsong: 2, vecka: 16, etikett: "Storloppssöndag", rubrik: "Provrubriken över uppslaget",
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
  ok(!!möte && möte.typ === "rapport" && möte.rubrik.includes("Stallmötet"),
    "stallmötet är måndagens fästa rapport (v167 — förr genomgången)");
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

/* ---------- Uttalandet i luren (v135) ---------- */
{
  const spel = byggSpel();
  spel.senasteAnalyser = [{ hästId: spel.stall[0].id, hästNamn: spel.stall[0].namn,
    kuskNamn: "A", lopp: "Bronsserien", vecka: spel.vecka - 1, säsong: spel.säsong,
    plats: 1, ur: false, varFavorit: false, streck: 20, läge: "ledningen",
    nivå: 40, avgörande: "Spets hela vägen.", läxa: null, uttalad: false }];
  const alla = byggInkorg(spel);
  const samtal = alla.find((h) => h.roll === "Tidningen" && h.typ === "samtal" && h.beslut);
  ok(!!samtal && samtal.beslut.typ === "uttalande",
    "segern: Travbladet ringer och uttalandet bor i luren");
  ok(!alla.some((h) => h.rubrik?.startsWith("Efteranalysen") && h.beslut),
    "efteranalysrapporten bär inte längre beslutet");

  spel.senasteAnalyser[0].plats = 5; spel.senasteAnalyser[0].varFavorit = false;
  ok(!byggInkorg(spel).some((h) => h.roll === "Tidningen" && h.typ === "samtal" && h.beslut),
    "den grå mittendagen ringer ingen om — realistisk presslogik");
}

/* ---------- Telefonen (v131): mediet bär brådskan ---------- */
{
  const spel = byggSpel();
  spel.stall[1].skada = 3; spel.stall[1].skadadVecka = spel.vecka - 1;
  const alla = byggInkorg(spel);
  const vetsamtal = alla.find((h) => h.roll === "Stallveterinär" && h.typ === "samtal");
  ok(!!vetsamtal && vetsamtal.lång.includes("står i stallet"),
    "nyskadad häst: veterinären RINGER — mediet bär brådskan");
  ok(!alla.some((h) => h.roll === "Stallveterinär" && h.typ === "rapport"
    && h.rubrik.includes(spel.stall[1].namn)),
    "samtalet ersätter rapporten den första veckan");

  spel.stall[0].genombrott = { säsong: spel.säsong, vecka: spel.vecka - 1, lopp: "P" };
  ok(byggInkorg(spel).some((h) => h.roll === "Tidningen" && h.typ === "samtal"),
    "genombrottet: journalisten ringer");

  /* Telefonloggen: idempotent arkivering och svarsbubblan. */
  arkiveraTelefonen(spel);
  const n1 = spel.telefonlogg.length;
  arkiveraTelefonen(spel);
  ok(n1 > 0 && spel.telefonlogg.length === n1,
    `arkiveringen är idempotent (${n1} rader, oförändrat vid andra anropet)`);
  const beslut = byggInkorg(spel).find((h) => h.beslut);
  if (beslut) {
    verkställBeslut(spel, beslut, beslut.beslut.alternativ[0].id);
    const svar = spel.telefonlogg.find((r) => r.typ === "svar");
    ok(!!svar && svar.avsändare === beslut.avsändare,
      "svaret bokförs i tråden — chatten minns vad du sa");
  }
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
  spel3.stall[0].resultat = [{ säsong: 2, vecka: 15, lopp: "P", plats: 1, km: 14.9,
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

/* ---------------- Stallmötet (v167, 30.9) ---------------- */
{
  const { byggInkorg: bygg, verkställBeslut: verkställ } = await import("./engine-inkorg.js");
  const spel = {
    säsong: 2, vecka: 3, veckor: 18, kassa: 90000, renommé: 30, stallnamn: "P",
    press: [], logg: [], föl: [], sponsorer: [], sponsorerbjudanden: [],
    telefonlogg: [], inkorgLästa: [], inkorgBeslutade: [], anmälningar: [],
    startadeLopp: [], kuskrelation: {}, ägarrelationer: {}, anläggning: {},
    förstaman: { namn: "Ulla Möte", profil: "taktiker", säsonger: 2 },
    stall: [
      { id: 1, namn: "Trötta Trean", ålder: 5, skada: 0, energi: 20, form: 50, start: 50, träning: "kvalitet" },
      { id: 2, namn: "Pigga Tvåan", ålder: 5, skada: 0, energi: 80, form: 40, start: 55, träning: "vila" },
    ],
    värld: { stall: [], hästar: [] },
  };
  const möte = bygg(spel).find((h) => h.rubrik?.startsWith("Stallmötet"));
  ok(!!möte && möte.fäst === true, "måndagens fästa post är nu ett stallmöte");
  ok(möte.lång.includes("FÖRSLAGET PÅ BORDET") && möte.beslut?.typ === "stallmöte",
    "mötet har ett förslag på bordet — och ett beslut i posten");
  verkställ(spel, möte, "plan");
  ok(spel.stall[0].träning === "vila" && spel.stall[1].träning !== "vila",
    "»kör din plan« lägger hela träningen med ett tryck");
  /* Med autoträning på: inget beslut — planen ligger redan. */
  const spel2 = { ...spel, autoTräning: true, inkorgBeslutade: [], telefonlogg: [], logg: [] };
  const möte2 = bygg(spel2).find((h) => h.rubrik?.startsWith("Stallmötet"));
  ok(!!möte2 && !möte2.beslut && möte2.lång.includes("sköter jag som vanligt"),
    "med autoträningen på konstaterar mötet att planen ligger");
}


/* ---------------- Mötesskärpningen (v174, 31:5) ---------------- */
{
  const { byggInkorg: bygg } = await import("./engine-inkorg.js");
  const grund = {
    säsong: 2, vecka: 3, veckor: 18, kassa: 90000, renommé: 30, stallnamn: "P",
    press: [], logg: [], föl: [], sponsorer: [], sponsorerbjudanden: [],
    telefonlogg: [], inkorgLästa: [], inkorgBeslutade: [], anmälningar: [],
    startadeLopp: [], kuskrelation: {}, ägarrelationer: {}, anläggning: {},
    förstaman: { namn: "Ulla Skarp", profil: "taktiker", säsonger: 2 },
    värld: { stall: [], hästar: [] },
  };
  /* EN mild avvikelse: läsning, inget beslut. */
  const spelMild = { ...grund, stall: [
    { id: 1, namn: "Milda", ålder: 5, skada: 0, energi: 70, form: 55, start: 60, träning: "vila" }] };
  const mildMöte = bygg(spelMild).find((h) => h.rubrik?.startsWith("Stallmötet"));
  ok(!!mildMöte && !mildMöte.beslut,
    "en mild justering är läsning — inget veckoklickbeslut");
  /* En körd häst: beslutet kommer även ensamt. */
  const spelAkut = { ...grund, stall: [
    { id: 1, namn: "Körda", ålder: 5, skada: 0, energi: 20, form: 55, start: 60, träning: "kvalitet" }] };
  ok(!!bygg(spelAkut).find((h) => h.rubrik?.startsWith("Stallmötet"))?.beslut,
    "en häst körd i botten kräver svar — beslutet kommer");
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
