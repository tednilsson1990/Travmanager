/**
 * PROV — STYRELSEMÅTTET (v151, 20.7)
 *
 * Ägarkretsen som styrelse: fyra delmått ur siffror som redan levs,
 * ren derivation, verkliga effekter (erbjudandeflöde, tålamod).
 */
import { styrelsemått, förtroendetext, säkraÄgarprofil, ägarKontakt, ägarSport } from "./engine-agare.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: styrelsemåttet\n");

{
  /* Utan externa ägare: neutralt, aldrig krasch. */
  const tomt = { stall: [], stallform: 50, kassa: 150000, ägarrelationer: {} };
  const m0 = styrelsemått(tomt);
  ok(m0.total >= 40 && m0.total <= 60 && m0.antalÄgare === 0,
    `utan ägare: neutralt läge (${m0.total})`);
  ok(typeof förtroendetext(m0.total) === "string" && förtroendetext(0).length > 0
    && förtroendetext(100) !== förtroendetext(0), "förtroendet har ord för hela skalan");
}

{
  /* Fyra dimensioner som svarar på rätt saker. */
  const spel = {
    stall: [{ id: 1, namn: "A", ägare: "Konsortiet Norr" }, { id: 2, namn: "B", ägare: "Byalaget" }],
    stallform: 80, kassa: 300000, ägarrelationer: {},
  };
  säkraÄgarprofil(spel, "Konsortiet Norr");
  säkraÄgarprofil(spel, "Byalaget");
  const bas = styrelsemått(spel);
  ok(bas.antalÄgare === 2 && bas.ekonomi === 100 && bas.resultat === 80,
    `delmåtten läser rätt källor (res ${bas.resultat}, eko ${bas.ekonomi})`);

  ägarKontakt(spel, "Konsortiet Norr", 30);
  ägarKontakt(spel, "Byalaget", 30);
  const efterMöten = styrelsemått(spel);
  ok(efterMöten.kommunikation > bas.kommunikation && efterMöten.total > bas.total,
    "mötena lyfter kommunikationen — och totalen");

  ägarSport(spel, "Konsortiet Norr", -40);
  ägarSport(spel, "Byalaget", -40);
  const efterFloppar = styrelsemått(spel);
  ok(efterFloppar.utveckling < efterMöten.utveckling && efterFloppar.total < efterMöten.total,
    "sportsliga smällar sänker utvecklingen — och totalen");

  /* Bara ägare MED häst i stallet räknas — gamla bekanta hemsöker inte. */
  spel.ägarrelationer["Spöket"] = { typ: "otålig", sport: 1, komm: 1, relation: 1 };
  ok(styrelsemått(spel).antalÄgare === 2, "ägare utan häst i stallet räknas inte");
}

{
  /* Erbjudandeformeln: högt förtroende ska öppna plånböcker. */
  const chans = (styrelse, renommé) =>
    Math.max(0.02, Math.min(0.4, 0.1 + renommé / 220 + (styrelse - 50) / 400));
  ok(chans(90, 40) > chans(50, 40) && chans(50, 40) > chans(15, 40),
    `förtroendet styr flödet (${chans(15, 40).toFixed(3)} → ${chans(90, 40).toFixed(3)})`);
  ok(chans(0, 0) >= 0.02, "golvet: dörren stängs aldrig helt");
}

console.log(fel === 0 ? "\nALLT GRÖNT" : `\n${fel} FEL`);
process.exit(fel === 0 ? 0 : 1);
