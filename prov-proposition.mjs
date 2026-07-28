/**
 * PROV — PROPOSITIONSMOTORN OCH STARTREGLERNA (v92, etapp A)
 *
 * Manualens transparenskrav är provbart: exakta orsaker med bådas
 * siffror, fyra grupper med rätt prioritering, klassklättringsvarningen
 * räknad mot samma klassgränser som kalendern bygger av, startpoängen
 * enligt 7.1 till punkt och pricka — och de fastställda taken: aldrig
 * fler än tolv bakom bilen, aldrig fler än tolv på samma distans i
 * volt, över hela kalenderns säsong.
 */
import { klassEtikett, behörighet, loppläge, klassklättring, startpoäng, startpoängText }
  from "./engine-proposition.js";
import { veckansLopp, KLASSER } from "./data-kalender.js";
import { STARTREGLER, spårkaraktär, spårtrappa, spårfördel, framförSpår } from "./data-lopp.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

const häst = (extra = {}) => ({ namn: "Provhästen", kön: "hingst", ålder: 5,
  intjänat: 82500, skada: 0, distans: { optimal: 2140, tolerans: 300, typ: "medel" },
  resultat: [], ...extra });
const lopp = (krav, extra = {}) => ({ namn: "Provlopp", dist: 2140, start: "bil",
  krav, pris: [50000, 25000, 12000, 7000, 4000], ...extra });

console.log("PROV: propositionsmotorn\n");
const siffra = (text, tal) => text.replace(/\s/g, "").includes(String(tal));

/* ---------- Startreglerna över hela säsongen ---------- */
{
  let bilMax = 0, voltMax = 0, prövade = 0, voltbrott = 0, voltlopp = 0;
  for (let v = 1; v <= 20; v++) {
    for (const l of veckansLopp(v)) {
      prövade++;
      if (l.start === "bil") bilMax = Math.max(bilMax, l.startande);
      else {
        voltlopp++;
        voltMax = Math.max(voltMax, l.startande);
        if (!(l.förstaVolt === 12 || l.startande <= 12)) voltbrott++;
      }
    }
  }
  ok(prövade > 80, `hela säsongens kalender prövad (${prövade} lopp)`);
  ok(voltbrott === 0, `alla ${voltlopp} voltlopp: högst 12 på grunddistansen, resten på tillägg`);
  ok(bilMax <= STARTREGLER.bilMax,
    `aldrig fler än ${STARTREGLER.bilMax} bakom bilen (störst funnet: ${bilMax}) — regelbrottet från v83 är borta`);
  ok(voltMax <= STARTREGLER.voltMax,
    `aldrig fler än ${STARTREGLER.voltMax} i volt (störst funnet: ${voltMax})`);
}

/* ---------- Behörighet med exakta siffror ---------- */
{
  const b1 = behörighet(häst({ intjänat: 312400 }), lopp({ maxInsprunget: 250000 }));
  ok(!b1.ok && siffra(b1.orsak, 312400) && siffra(b1.orsak, 250000),
    "pengataket nämner BÅDA siffrorna: hästens startsumma och loppets tak");
  const b2 = behörighet(häst({ intjänat: 82500 }), lopp({ minInsprunget: 200000 }));
  ok(!b2.ok && siffra(b2.orsak, 200000) && siffra(b2.orsak, 82500),
    "pengagolvet likaså");
  const b3 = behörighet(häst({ kön: "hingst" }), lopp({ kön: "sto" }));
  ok(!b3.ok && b3.orsak.includes("ston"), "könsvillkoret ger klartext");
  const b4 = behörighet(häst({ ålder: 7 }), lopp({ maxÅlder: 5 }));
  ok(!b4.ok && b4.orsak.includes("7"), "åldersvillkoret nämner hästens ålder");
  ok(behörighet(häst(), lopp({ maxInsprunget: 250000 })).ok, "berättigad häst släpps igenom");
}

/* ---------- Fyra grupper med rätt prioritering ---------- */
{
  ok(loppläge(häst({ intjänat: 500000 }), lopp({ maxInsprunget: 250000 })).status === "ej",
    "obehörig → ej, oavsett allt annat");
  const risk = loppläge(häst({ intjänat: 78000 }), lopp({ minInsprunget: 75001, maxInsprunget: 150000 }));
  ok(risk.status === "riskfylld" && risk.not.includes("hårt inne"),
    "nära pengafönstrets botten → riskfylld med manualens formulering");
  const möjl = loppläge(häst({ intjänat: 140000, distans: { optimal: 2140, tolerans: 220, typ: "medel" } }),
    lopp({ minInsprunget: 75001, maxInsprunget: 150000 }, { dist: 3140 }));
  ok(möjl.status === "möjlig" && möjl.not.includes("3140"),
    "fel distans → möjlig, med distansen som utpekad nackdel");
  ok(loppläge(häst({ intjänat: 140000 }), lopp({ minInsprunget: 75001, maxInsprunget: 150000 })).status
    === "rekommenderad", "väl till i klassen och rätt distans → rekommenderad");
}

/* ---------- Klassklättringsvarningen ---------- */
{
  /* 95 000 + 60 000 i förstapris = 155 000: lärlingsklassen (≤120k) är
     redan stängd, klass 3 (≤250k) förblir öppen — men ett lopp med
     förstapris som passerar 250 000 ska varna för klass 3. */
  const h = häst({ intjänat: 230000 });
  const kl = klassklättring(h, lopp({}, { pris: [60000, 30000, 15000, 9000, 6000] }));
  ok(kl.ny === 290000 && kl.stängs.some((n) => KLASSER[1].namn === n),
    `segern lyfter till ${kl.ny} kr och varnar: ${kl.stängs.join(", ")} stängs`);
  const lugn = klassklättring(häst({ intjänat: 30000 }), lopp({}, { pris: [18000, 9000, 5000, 3000, 2000] }));
  ok(lugn.stängs.length === 0, "liten seger långt från taken varnar inte — ingen falsklarmig varning");
}

/* ---------- Startpoängen enligt 7.1 ---------- */
{
  const h = häst({ resultat: [
    { plats: 1, pris: 30000 },   // 400 + 300
    { plats: 4, pris: 4000 },    // 50 + 40
    { plats: null, pris: 0 },    // diskad: 0
    { plats: 2, pris: 15000 },   // 200 + 150
    { plats: 6, pris: 1500 },    // 0 + 15
    { plats: 1, pris: 90000 },   // UTANFÖR de fem senaste — räknas inte
  ]});
  const sp = startpoäng(h);
  ok(sp.poäng === 400 + 300 + 50 + 40 + 200 + 150 + 15,
    `fem senaste, 400/200/100/50/25 + 1 p/100 kr: ${sp.poäng} poäng`);
  ok(sp.starter === 5, "äldre starter än fem räknas inte");
  ok(startpoängText({ poäng: 0, starter: 0 }).includes("ostartade"),
    "ostartad häst hänvisas till företrädesregler, inte till noll poäng");
  ok(startpoängText(sp).length > 10, "prognosen är text, inte bara en siffra");
}

/* ---------- Nivåetiketten ---------- */
{
  ok(klassEtikett(häst({ intjänat: 82500 })).etikett === "låg klass", "82 500 kr → låg klass");
  ok(klassEtikett(häst({ intjänat: 900000 })).etikett === "elitnivå", "900 000 kr → elitnivå");
  ok(klassEtikett(häst()).text.includes("passar oftast"),
    "etiketten är vägledning med pengafönster — aldrig en spärr");
}

/* ---------- Spårtrappan (v94): trappan kan aldrig ljuga om motorn ---------- */
{
  const bil = { start: "bil", startande: 12 };
  const volt = { start: "volt", startande: 15, förstaVolt: 12, tillägg: 20 };
  const t = spårtrappa(bil);
  ok(t.rader.every((r) => r.fördel === spårfördel(r.spår, "bil")),
    "trappan läser exakt samma fördelstal som utlösningen");
  ok(t.bäst.every((s) => [4, 5].includes(s)),
    `puckeln syns: bäst i dag är ${t.bäst.join(" och ")} (statistikens 4–5)`);
  ok(t.svårast.every((s) => s >= 9), "svårast är andra ledet");
  for (let s2 = 1; s2 <= 12; s2++) ok2(spårkaraktär(s2, bil));
  for (let s2 = 1; s2 <= 15; s2++) ok2(spårkaraktär(s2, volt));
  ok(spårkaraktär(10, bil).klass === "andraled" && framförSpår(10) === 2,
    "tian i autostart: andra ledet, bakom spår 2");
  ok(spårkaraktär(6, volt).klass === "springspår", "sexan i volt är springspår");
  ok(spårkaraktär(10, volt).klass === "andraled", "tian i volt är andra volten");
  ok(spårkaraktär(14, volt).klass === "tillägg", "fjortonde spåret i volt står på tillägg");
  function ok2(k) {
    if (!(k && k.klass && k.text.length > 10)) { console.log("  ✗ spår utan karaktär"); fel++; }
  }
  console.log("  ✓ alla spår i båda startmetoderna har klass och begriplig text");
}

/* ---------- Bedömningsnivåerna (v96, manualen 6.3) ---------- */
{
  const h = häst({ intjänat: 78000 });
  const risk = lopp({ minInsprunget: 75001, maxInsprunget: 150000 });
  ok(loppläge(h, risk, 0).status === "möjlig"
    && loppläge(h, risk, 0).not.includes("utan förstaman"),
    "nivå 0: ingen klassläsning — bara berättigad, ärligt sagt");
  ok(loppläge(h, risk, 1).status === "riskfylld", "nivå 1: förstamannen ser klassläget");
  const rek = loppläge(häst({ intjänat: 140000 }), risk, 2);
  ok(rek.siffra && rek.siffra.includes("%"),
    "nivå 2: taktikern ger siffrorna — " + rek.siffra);
  ok(loppläge(häst({ intjänat: 500000 }), risk, 0).status === "ej",
    "behörigheten är regelfakta — den ser alla, oavsett organisation");
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
