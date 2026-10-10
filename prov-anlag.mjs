/**
 * PROV — DOLDA ANLAG & SCOUTINGEN (v148, 21.4 + 20.7)
 *
 * Anlaget: härlett, aldrig lagrat — dold multiplikator på de unga
 * årens utveckling, avslöjat av starter, ålder eller veterinärtest.
 * Scoutingen: förstamannens mejl pekar på en verklig marknadshäst,
 * och anlagsordet är sant. Marknaden: deterministisk per vecka —
 * löftet i kommentaren hålls nu.
 */
import { anlag, anlagsklass, anlagsvetskap, anlagsbedömning, veterinärtest,
  VETERINÄRTEST_PRIS, nyHäst } from "./engine-hast.js";
import { åldraHäst } from "./engine-sasong.js";
import { marknaden } from "./engine-marknad.js";
import { byggInkorg } from "./engine-inkorg.js";
import { seedad, sättRng, slump } from "./engine-util.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: dolda anlag & scoutingen\n");

/* ---------------- Anlaget: härlett, centrerat, i ord ---------------- */
{
  const h = { namn: "Provhästen", id: 42 };
  ok(anlag(h) === anlag(h) && anlag(h) >= 0.65 && anlag(h) <= 1.36,
    `härlett och stabilt (${anlag(h).toFixed(2)})`);
  let summa = 0; const N = 20000;
  for (let i = 0; i < N; i++) summa += anlag({ namn: `H${i}`, id: i });
  const snitt = summa / N;
  ok(snitt > 0.97 && snitt < 1.03, `snittet är neutralt (${snitt.toFixed(3)}) — världen blir inte bättre eller sämre`);
  ok(anlagsklass({ namn: "a", id: 1 }).ord.includes("anlag"), "klassen talar i ord, aldrig i multiplikatorer");
}

/* ---------------- Vetskapen: starter, ålder eller testet ---------------- */
{
  const ung = { namn: "Okända", id: 1, ålder: 3, starter: 0 };
  ok(anlagsvetskap(ung) === "okänd" && anlagsbedömning(ung).includes("veterinärtest"),
    "oprövad unghäst: anlagen okända");
  ung.starter = 3;
  ok(anlagsvetskap(ung) === "anad" && anlagsbedömning(ung).includes("taket börjar synas"),
    "tre starter: en aning, med riktning");
  ung.starter = 8;
  ok(anlagsvetskap(ung) === "känd" && anlagsbedömning(ung) === anlagsklass(ung).ord,
    "åtta starter: loppen har talat — facit gratis");
  const veteran = { namn: "Veteranen", id: 2, ålder: 7, starter: 1 };
  ok(anlagsvetskap(veteran) === "känd", "sju år: hästen har visat sitt tak oavsett starter");

  /* Veterinärtestet: kostar, svarar direkt, vägrar dubbelt. */
  const spel = { kassa: 10000, logg: [] };
  const ny = { namn: "Testade", id: 3, ålder: 3, starter: 0 };
  const svar = veterinärtest(spel, ny);
  ok(svar.klass && spel.kassa === 10000 - VETERINÄRTEST_PRIS && anlagsvetskap(ny) === "känd",
    "testet drar kassan och ger facit direkt");
  ok(veterinärtest(spel, ny).fel != null, "ett andra test vägras — anlagen är redan kända");
  ok(veterinärtest({ kassa: 100, logg: [] }, { namn: "Pank", id: 4, ålder: 3, starter: 0 }).fel != null,
    "utan pengar inget test");
}

/* ---------------- Anlaget VERKAR: talang växer snabbare ---------------- */
{
  /* Hitta ett namnpar med extrema anlag, åldra båda med SAMMA frö. */
  let stor = null, liten = null;
  for (let i = 0; i < 3000 && (!stor || !liten); i++) {
    const h = { namn: `Sök${i}`, id: i };
    if (!stor && anlag(h) >= 1.3) stor = h;
    if (!liten && anlag(h) <= 0.7) liten = h;
  }
  ok(!!stor && !!liten, "extremerna finns i namnrymden");
  const bygg = (mall) => ({ ...nyHäst({ namn: mall.namn, ålder: 3, start: 50, fart: 50, styrka: 50 }), id: mall.id, namn: mall.namn });
  sättRng(seedad(7)); const a = bygg(stor); åldraHäst(a); åldraHäst(a);
  sättRng(seedad(7)); const b = bygg(liten); åldraHäst(b); åldraHäst(b);
  sättRng();
  const kapA = a.start + a.fart + a.styrka, kapB = b.start + b.fart + b.styrka;
  ok(kapA > kapB + 5,
    `enastående anlag växer ifrån begränsade (${Math.round(kapA)} mot ${Math.round(kapB)} efter två säsonger)`);
}

/* ---------------- Marknaden: deterministisk, rng-ren ---------------- */
{
  sättRng(seedad(5));
  const hästar = Array.from({ length: 30 }, (_, i) => {
    const h = nyHäst({ ålder: 4 + (i % 6) }); h.egen = false; h.stallId = 1; return h;
  });
  sättRng();
  const spel = { säsong: 2, vecka: 7, värld: { stall: [{ id: 1, namn: "Provstallet" }], hästar } };
  const a = marknaden(spel).map((p) => `${p.häst.namn}:${p.pris}`);
  const b = marknaden(spel).map((p) => `${p.häst.namn}:${p.pris}`);
  ok(a.length > 0 && JSON.stringify(a) === JSON.stringify(b),
    "utbudet är detsamma vid varje omritning — löftet hålls nu");
  /* Rng-renhetsprovet: marknaden får inte lämna en seedad rng efter sig. */
  marknaden(spel);
  const x1 = slump(), x2 = slump();
  marknaden(spel);
  const y1 = slump(), y2 = slump();
  ok(!(x1 === y1 && x2 === y2), "marknaden återställer slumpen efter sig (finally)");
}

/* ---------------- Scoutrapporten: sann, i Telefonen ---------------- */
{
  sättRng(seedad(5));
  const hästar = Array.from({ length: 30 }, (_, i) => {
    const h = nyHäst({ ålder: 3 + (i % 4) }); h.egen = false; h.stallId = 1; return h;
  });
  sättRng();
  const grund = {
    säsong: 2, veckor: 18, kassa: 90000, renommé: 30, stall: [], föl: [],
    press: [], logg: [], anmälningar: [], startadeLopp: [], sponsorer: [],
    sponsorerbjudanden: [], telefonlogg: [], inkorgLästa: [], inkorgBeslutade: [],
    förstaman: { namn: "Ulla Scout", profil: "taktiker", säsonger: 2 },
    värld: { stall: [{ id: 1, namn: "Provstallet" }], hästar },
  };
  let rapport = null, rapportVecka = 0;
  for (let v = 1; v <= 18 && !rapport; v++) {
    const spel = { ...grund, vecka: v };
    rapport = byggInkorg(spel).find((h) => h.rubrik?.startsWith("Scoutrapport")) ?? null;
    rapportVecka = v;
  }
  ok(!!rapport, `scouten hör av sig under säsongen (vecka ${rapportVecka})`);
  const namn = rapport.rubrik.replace("Scoutrapport: ", "");
  const spelDå = { ...grund, vecka: rapportVecka };
  const post = marknaden(spelDå).find((p) => p.häst.namn === namn);
  ok(!!post, "hästen i rapporten FINNS på marknaden samma vecka — seedningen gör scouten ärlig");
  ok(post && rapport.text.includes(anlagsklass(post.häst).ord),
    `anlagsordet i rapporten är sant (${post ? anlagsklass(post.häst).ord : "?"})`);
  ok(rapport.typ === "mejl" && rapport.roll === "Förstaman", "rapporten är ett mejl från förstamannen");
}


/* ---------------- Kuskscouten (v157, 20.7 B) ---------------- */
{
  sättRng(seedad(5));
  const hästar = Array.from({ length: 30 }, (_, i) => {
    const h = nyHäst({ ålder: 3 + (i % 4) }); h.egen = false; h.stallId = 1; return h;
  });
  sättRng();
  const grund = {
    säsong: 2, veckor: 18, kassa: 90000, renommé: 30, stall: [], föl: [],
    press: [], logg: [], anmälningar: [], startadeLopp: [], sponsorer: [],
    sponsorerbjudanden: [], telefonlogg: [], inkorgLästa: [], inkorgBeslutade: [],
    kuskrelation: {},
    förstaman: { namn: "Ulla Scout", profil: "taktiker", säsonger: 2 },
    värld: { stall: [{ id: 1, namn: "Provstallet" }], hästar },
  };
  let tips = null;
  for (let v = 1; v <= 18 && !tips; v++) {
    tips = byggInkorg({ ...grund, vecka: v }).find((h) => h.rubrik?.startsWith("Kusktipset")) ?? null;
  }
  ok(!!tips, "kuskscouten hör av sig under säsongen");
  ok(tips && tips.typ === "mejl" && tips.lång.includes("relationen"),
    "tipset pekar på relationsbygget — boka, inte läsa");
  const namn = tips.rubrik.replace("Kusktipset: ", "");
  const alla = (await import("./data-kuskar.js")).KUSKAR;
  const k = alla.find((x) => x.namn === namn);
  ok(!k || (k.ryktbarhet <= 45), `fyndet är inget stjärnnamn (${namn})`);
}

console.log(fel === 0 ? "\nALLT GRÖNT" : `\n${fel} FEL`);
process.exit(fel === 0 ? 0 : 1);
