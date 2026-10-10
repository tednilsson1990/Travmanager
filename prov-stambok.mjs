/**
 * PROV — STAMBOKEN & LEGENDAREN (v146, 21.3 + 21.12)
 *
 * Stamboken: ren bokföring — idempotent synk, ödena skrivs där de
 * avgörs, familjerna grupperas undan stammödrarna med travets
 * notation. Legendaren: hash-gatet fenomen, aldrig två samtidigt,
 * följs säsong för säsong och får sin epilog.
 */
import { säkraStambok, bokförStamÖde, stamträd, härstamning, ödestext, uppfödarpremie, UPPFÖDARPREMIE } from "./engine-stambok.js";
import { prövaLegendaren } from "./engine-varldsutveckling.js";
import { sälj } from "./engine-marknad.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: stamboken & legendaren\n");

/* ---------------- Stamboken: migration och synk ---------------- */
{
  const spel = {
    säsong: 3, stall: [
      { id: 1, namn: "Björkens Ess", kön: "hingst", ålder: 5, segrar: 4, starter: 12, intjänat: 180000, mor: "Björkens Dam", far: "Maharajah", morId: 9 },
      { id: 2, namn: "Köpingen", kön: "sto", ålder: 6, segrar: 1, starter: 8, intjänat: 40000 },
    ],
    avelsston: [{ id: 9, namn: "Björkens Dam", ålder: 12, segrar: 7, intjänat: 900000 }],
    hallOfFame: [{ hästId: 9, namn: "Björkens Dam", segrar: 7, starter: 40, intjänat: 900000, mor: null, säsong: 2 }],
  };
  säkraStambok(spel);
  ok(spel.stambok.length === 3, `migrationen fångar stall + hage + hall of fame (${spel.stambok.length} poster)`);
  const dam = spel.stambok.find((p) => p.namn === "Björkens Dam");
  ok(dam.öde === "avelssto" && dam.hallOfFame === true,
    "avelsstoet står som avelssto OCH hall of fame — en post, två sanningar");
  const ess = spel.stambok.find((p) => p.namn === "Björkens Ess");
  ok(ess.uppfödd === true && härstamning(ess) === "e. Maharajah u. Björkens Dam",
    `travets notation: ${härstamning(ess)}`);

  /* Idempotens + meritsynk: segern växer i boken, inget dubbleras. */
  spel.stall[0].segrar = 5; spel.stall[0].intjänat = 220000;
  säkraStambok(spel);
  ok(spel.stambok.length === 3 && ess.segrar === 5 && ess.intjänat === 220000,
    "idempotent synk: meriterna växer i boken, inga dubbletter");

  /* Stamträdet: familjen grupperas undan stammodern. */
  const träd = stamträd(spel);
  ok(träd.familjer.length === 1 && träd.familjer[0].stammoder === "Björkens Dam"
    && träd.familjer[0].avkommor.some((p) => p.namn === "Björkens Ess")
    && träd.familjer[0].moderpost?.namn === "Björkens Dam",
    "stamträdet: avkomman under sin stammoder, modern lyfts ur övriga");
  ok(träd.övriga.length === 1 && träd.övriga[0].namn === "Köpingen",
    "förvärvet utan härstamning står för sig");
}

/* ---------------- Ödena skrivs där de avgörs ---------------- */
{
  const spel = { säsong: 4, stall: [], avelsston: [], hallOfFame: [], kassa: 0, stambok: [] };
  const h = { id: 11, namn: "Sålda Snabben", kön: "hingst", ålder: 5, segrar: 2, starter: 9, intjänat: 120000 };
  bokförStamÖde(spel, h, "såld");
  const p = spel.stambok.find((x) => x.namn === "Sålda Snabben");
  ok(p && p.öde === "såld" && p.slutSäsong === 4,
    "sälj skapar posten om den saknas och skriver ödet med säsong");
  ok(ödestext(p).includes("Såld") && ödestext({ öde: "aktiv" }) === "I träning",
    "ödestexterna talar stambokens språk");
  bokförStamÖde(spel, h, "flyttad-till-månen");
  ok(p.öde === "såld", "okända öden avvisas — boken ljuger aldrig");
  /* v153: ägarflytten är ett eget öde — hästen såldes aldrig. */
  const fh = { id: 12, namn: "Flyttade Fanny", kön: "sto", ålder: 6, segrar: 3, starter: 14, intjänat: 200000 };
  bokförStamÖde(spel, fh, "flyttad");
  const fp = spel.stambok.find((x) => x.namn === "Flyttade Fanny");
  ok(fp?.öde === "flyttad" && ödestext(fp).includes("Flyttad av ägaren"),
    "ägarflytten bokförs med eget öde och eget språk");

  /* Säljflödet på riktigt: engine-marknad skriver ödet. */
  const spel2 = {
    säsong: 2, kassa: 0, stambok: [],
    stall: [
      { id: 21, namn: "Kvarvarande", kön: "sto", ålder: 4, start: 50, fart: 50, styrka: 50, form: 50, segrar: 0, starter: 2, intjänat: 10000 },
      { id: 22, namn: "Till Salu", kön: "hingst", ålder: 5, start: 55, fart: 55, styrka: 55, form: 55, segrar: 1, starter: 6, intjänat: 60000 },
    ],
    värld: { stall: [], hästar: [] },
  };
  const res = sälj(spel2, spel2.stall[1]);
  ok(res?.pris > 0 && spel2.stambok.some((x) => x.namn === "Till Salu" && x.öde === "såld"),
    "sälj() i marknaden bokför ödet — såld är ett öde, inte en radering");
}

/* ---------------- Gallringen: boken växer inte i oändlighet ---------------- */
{
  const spel = { säsong: 8, stall: [], avelsston: [], hallOfFame: [], stambok: [] };
  for (let i = 0; i < 95; i++) {
    spel.stambok.push({
      id: 1000 + i, namn: `Bulkhäst ${i}`, kön: "hingst", född: 1,
      mor: null, far: null, morId: null, uppfödd: false,
      öde: "såld", slutSäsong: 2, segrar: 0, starter: 3, intjänat: 9000, hallOfFame: false,
    });
  }
  spel.stambok.push({ id: 2000, namn: "Oförglömliga", kön: "sto", född: 1, mor: "Stammor", far: "Far", morId: null, uppfödd: true, öde: "pensionerad", slutSäsong: 3, segrar: 9, starter: 30, intjänat: 700000, hallOfFame: true });
  säkraStambok(spel);
  ok(spel.stambok.length <= 80, `gallringen håller taket (${spel.stambok.length} ≤ 80)`);
  ok(spel.stambok.some((p) => p.namn === "Oförglömliga"),
    "hall of fame och uppfödda gallras aldrig");
}

/* ---------------- Legendaren: födelse, uppföljning, epilog ---------------- */
{
  const världshäst = (id, ålder) => ({
    id, namn: `Världs ${id}`, ålder, kön: "hingst",
    start: 55 + (id % 10), fart: 56 + (id % 8), styrka: 54 + (id % 9),
    form: 55, segrar: 2, starter: 10, intjänat: 80000, stallId: 1,
  });
  const nytt = (säsong) => ({
    säsong, stallnamn: "Provgården", press: [],
    värld: { stall: [{ id: 1, styrka: 0.7 }], hästar: Array.from({ length: 24 }, (_, i) => världshäst(100 + i, 3 + (i % 5))) },
  });

  /* Hash-gaten: hitta en säsong som föder — och bekräfta determinismen. */
  let föddes = null;
  for (let s = 2; s <= 30 && !föddes; s++) {
    const spel = nytt(s);
    const press = prövaLegendaren(spel);
    if (spel.legendar) föddes = { säsong: s, spel, press };
  }
  ok(!!föddes, `gaten öppnar inom 30 säsonger (säsong ${föddes?.säsong})`);
  const { spel, press } = föddes;
  const leg = spel.värld.hästar.find((h) => h.legendar);
  ok(!!leg && leg.fart >= 78 && spel.legendar.namn === leg.namn,
    `fenomenet lyfts på riktigt (fart ${leg?.fart} ≥ 78) och registret pekar rätt`);
  ok(press.length === 1 && press[0].rubrik.includes(leg.namn),
    "födelsen får sin förstasida");
  ok((leg.ålder ?? 9) <= 4, "fenomenet är en unghäst — en generation, inte en veteran");

  /* Determinism: samma säsong, samma värld → samma fenomen. */
  const spelB = nytt(föddes.säsong);
  prövaLegendaren(spelB);
  ok(spelB.legendar?.namn === spel.legendar.namn, "hash-avgjort: samma karriär, samma fenomen");

  /* Aldrig två samtidigt: nästa skifte följer upp i stället för att föda. */
  spel.säsong += 1;
  leg.segrar += 4;
  const press2 = prövaLegendaren(spel);
  ok(spel.legendar.status === "aktiv" && spel.värld.hästar.filter((h) => h.legendar).length === 1,
    "aldrig två fenomen samtidigt — uppföljning, inte ny födelse");
  ok(press2.length === 1 && press2[0].byline.includes("segrar"),
    `Travbladet följer segersviten (${press2[0]?.rubrik})`);
  ok(spel.legendar.segrarSnapshot === leg.segrar, "snapshotet flyttas fram");

  /* Epilogen: hästen pensioneras av världens maskineri → epoken sluts. */
  spel.säsong += 1;
  spel.värld.hästar = spel.värld.hästar.filter((h) => !h.legendar);
  const press3 = prövaLegendaren(spel);
  ok(spel.legendar.status === "pensionerad" && press3.length === 1
    && press3[0].rubrik.includes("epok"),
    "epilogen skrivs när sulkyn hängs upp");

  /* Och därefter är tronen ledig: gaten kan öppna igen. */
  let igen = false;
  for (let s = spel.säsong + 1; s <= spel.säsong + 40 && !igen; s++) {
    spel.säsong = s;
    spel.värld.hästar = Array.from({ length: 24 }, (_, i) => världshäst(500 + s * 30 + i, 3 + (i % 5)));
    prövaLegendaren(spel);
    if (spel.legendar?.status === "aktiv") igen = true;
  }
  ok(igen, "tronen ärvs: ett nytt fenomen kan födas efter epilogen");
}


/* ---------------- Uppfödarpremien & andelslaget (v160, 28.4) ---------------- */
{
  ok(uppfödarpremie(100000) === 10000 && uppfödarpremie(0) === 0 && uppfödarpremie(-5) === 0,
    `premien är ${UPPFÖDARPREMIE * 100} % av prispengarna, aldrig negativ`);
  const { ÄGARTYPER } = await import("./data-agare.js");
  const a = ÄGARTYPER.andelslag;
  ok(!!a && a.kommvikt >= 0.5 && a.resultatkänsla <= 0.7 && a.tålamod >= 1.4,
    "andelslaget finns: tåligt, resultatmilt — men dialogen är allt");
}

console.log(fel === 0 ? "\nALLT GRÖNT" : `\n${fel} FEL`);
process.exit(fel === 0 ? 0 : 1);
