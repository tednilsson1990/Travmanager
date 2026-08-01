/**
 * PROV — EFTERLOPPSANALYSEN (v88, kap 14 + plan 3.7)
 *
 * Analysen får aldrig hitta på. Proven låser tre saker: att den är
 * deterministisk (samma simulering, samma analys), att måtten är
 * fysiskt rimliga mot loppet de lästes ur, och att rösterna säger det
 * datat säger — vägrad attack ger vägrans-avgörande, tom häst ger
 * vilorekommendation, instängning på upploppet pekas ut.
 */
import { sättRng, seedad } from "./engine-util.js";
import { veckansLopp } from "./data-kalender.js";
import { byggVärld, byggFält, rustaFält } from "./engine-varld.js";
import { beräknaStreck } from "./engine-streck.js";
import { simulera } from "./engine-simulera.js";
import { loppanalys } from "./engine-analys.js";
import { nyHäst } from "./engine-hast.js";
import { KUSKAR } from "./data-kuskar.js";

let fel = 0;
const ok = (villkor, text) => {
  if (villkor) console.log("  ✓ " + text);
  else { console.log("  ✗ " + text); fel++; }
};

function byggKörning(frö) {
  sättRng(seedad(frö));
  const värld = byggVärld();
  const lopp = veckansLopp(1 + (frö % 18))[frö % 3] || veckansLopp(1)[0];
  const egen = nyHäst({ ålder: 5 });
  egen.egen = true;
  egen.form = 58; egen.energi = 80; egen.hype = 30; egen.streck = 12;
  egen.taktik = "rygg";
  const fält = byggFält(värld, lopp, 1, new Set(), egen);
  rustaFält(fält, lopp, KUSKAR[0], "rygg");
  beräknaStreck(fält, { spelförtroende: 40, stallform: 50, marknadsbild: 0 }, lopp);
  return { fält, lopp, egen };
}

console.log("PROV: efterloppsanalysen\n");

/* ---------- Determinism och rimlighet över många lopp ---------- */
{
  let rimliga = 0, prövade = 0, medAttack = 0, medPos = 0;
  for (let i = 0; i < 60; i++) {
    const a = byggKörning(9000 + i);
    sättRng(seedad(i * 19 + 3));
    const sim = simulera(a.fält, a.lopp);
    const an1 = loppanalys(sim, a.lopp, { häst: a.egen, kusk: KUSKAR[0], taktik: "rygg", slutorder: null });
    const an2 = loppanalys(sim, a.lopp, { häst: a.egen, kusk: KUSKAR[0], taktik: "rygg", slutorder: null });
    if (JSON.stringify(an1) !== JSON.stringify(an2)) { ok(false, "determinism brast i lopp " + i); break; }
    prövade++;
    const min = sim.resultat.find((r) => r.häst.egen);
    const okMått = an1.mLedning >= 0 && an1.mLedning <= a.lopp.dist + 100
      && an1.mTredje >= 0 && an1.mTredje <= a.lopp.dist
      && an1.extraVäg >= 0 && an1.extraVäg < 80
      && (an1.kraftKvar === null || (an1.kraftKvar >= 0 && an1.kraftKvar <= 100))
      && typeof an1.avgörande === "string" && an1.avgörande.length > 10
      && an1.bra.length >= 1 && typeof an1.nästaSteg === "string";
    if (okMått) rimliga++;
    if (an1.attack) medAttack++;
    if (an1.pos.v1000 && (!min.ur ? an1.pos.v1000.plats >= 1 && an1.pos.v1000.plats <= a.fält.length : true)) medPos++;
  }
  ok(prövade === 60, "analysen är deterministisk över 60 lopp");
  ok(rimliga === prövade, `måtten är fysiskt rimliga i ${rimliga}/${prövade} lopp`);
  ok(medAttack > 10, `attackpunkten hittas när den finns (${medAttack} av 60 lopp)`);
  ok(medPos > 45, `positionen vid 1 000 kvar läses ur rutorna (${medPos} av 60)`);
}

/* ---------- Rösterna säger vad datat säger ---------- */
{
  /* Vägrad attack: hitta ett lopp där kusken vägrade och kontrollera
     att både avgörandet och nästa steg talar om saken. */
  let hittad = false;
  for (let i = 0; i < 120 && !hittad; i++) {
    const a = byggKörning(5000 + i);
    sättRng(seedad(i * 17 + 5));
    const sim = simulera(a.fält, a.lopp, { vid: 500, order: "attack" });
    if (sim.ingripandeUtfall?.beslut !== "vägrade") continue;
    hittad = true;
    const an = loppanalys(sim, a.lopp, { häst: a.egen, kusk: KUSKAR[0], taktik: "rygg", slutorder: "attack" });
    const minPlats = sim.resultat.find((r) => r.häst.egen);
    const bittert = an.instängdSent > 40 && !(minPlats && !minPlats.ur && minPlats.plats <= 3);
    ok(an.utfall.beslut === "vägrade", "utfallet följer med in i analysen");
    ok(bittert || an.avgörande.includes("uteblev") || an.avgörande.includes("Galoppen"),
      "vägrad attack pekas ut i avgörandet (om inte instängning eller galopp vägde tyngre)");
  }
  ok(hittad, "hittade ett lopp med vägrad attack att pröva rösterna på");

  /* Tom häst: nästa steg ska vara vila, oavsett lopp. */
  const a = byggKörning(9100);
  sättRng(seedad(41));
  const sim = simulera(a.fält, a.lopp);
  a.egen.energi = 20;
  const an = loppanalys(sim, a.lopp, { häst: a.egen, kusk: KUSKAR[0], taktik: "rygg", slutorder: null });
  ok(an.nästaSteg.startsWith("Vila"), "tom häst ger vilorekommendation som nästa steg");
}

sättRng();
/* ---------- Diskade lopp slutar i tid (v113-vakten) ---------- */
{
  /* Teds speltest: en mittdiskning (galopp) fick loppet att mala till
     maxtiden — levande räknades före start. Vakten provocerar
     galopper och låser att diskade lopp slutar i samma takt som rena. */
  let mittDisk = 0, värsta = 0, rentTak = 0;
  for (let i = 0; i < 30; i++) {
    const a = byggKörning(80000 + i);
    a.fält.forEach((h) => { h.trav = Math.min(h.trav ?? 50, 25); h.lynne = 25; });
    sättRng(seedad(i * 13 + 5));
    const sim = simulera(a.fält, a.lopp);
    const första = sim.bild[0]?.pos ?? [];
    const mitt = sim.resultat.some((r) => r.ur && första.some((p) => p.namn === r.häst.namn && !p.ur));
    if (mitt) { mittDisk++; värsta = Math.max(värsta, sim.bild.length); }
    else rentTak = Math.max(rentTak, sim.bild.length);
  }
  ok(mittDisk >= 2, `${mittDisk} lopp med diskning mitt i — vakten har underlag`);
  ok(värsta > 0 && värsta <= rentTak * 1.4,
    `diskade lopp slutar i tid: värsta ${värsta} rutor mot ${rentTak} för rena`);
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
