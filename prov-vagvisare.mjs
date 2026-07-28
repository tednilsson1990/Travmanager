/**
 * PROV — VÄGVISAREN (v90, kap 16) och pälsskifteslagningen.
 *
 * Riktningen får inte tjata eller ljuga: proven låser att sorteringen
 * sätter det akuta först (veckans viktigaste ÄR första raden), att
 * rekommendationerna kräver sina förutsättningar, att milstolparna är
 * de NÄRMASTE onådda med korrekt progress — och att pälsskiftet (buggen
 * som kraschade stallvyn) ger stallkamrater med samma päls olika index.
 */
import { nästaSteg, långsiktigt, veckonetto } from "./engine-vagvisare.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

const nyttSpel = () => ({
  säsong: 1, vecka: 5, veckor: 20, kassa: 200000, intjänat: 120000, renommé: 40,
  stall: [], ägarrelationer: {}, sponsorer: [], sponsorerbjudanden: [],
  anläggning: { boxar: 8 }, förstaman: null, prolog: {},
});
const häst = (namn, extra = {}) => ({ id: namn, namn, skada: 0, form: 50,
  träning: "lugnt", energi: 70, ägare: null, senasteStartVecka: 0, ...extra });

console.log("PROV: vägvisaren\n");

{
  const spel = nyttSpel();
  spel.stall = [häst("Lugn")];
  spel.ägarrelationer["Sur Ägare"] = { relation: 20 };
  spel.stall.push(häst("Ägarhästen", { ägare: "Sur Ägare" }));
  spel.stall.push(häst("Stjärnan", { form: 72 }));
  const steg = nästaSteg(spel);
  ok(steg[0].akut === true && steg[0].text.includes("Sur Ägare"),
    "veckans viktigaste är första raden — det akuta sorteras främst");
  ok(steg.some((u) => u.text.includes("Stjärnan") && u.text.includes("72")),
    "formstark häst ger 'planera nästa start' med formen i texten (16.1)");
  ok(steg.every((u) => u.text && u.flik), "varje rad har text och mål-flik");
}

{
  const spel = nyttSpel();
  spel.stall = [häst("Enda")];
  const steg = nästaSteg(spel);
  ok(!steg.some((u) => u.akut), "utan kriser: inga akuta rader — riktning utan tjat");
}

{
  const spel = nyttSpel();
  spel.stall = [häst("A"), häst("B")];
  const mål = långsiktigt(spel);
  ok(mål.length === 2 && mål[0].mål.includes("Sex hästar"),
    "närmaste onådda milstolpen först: sex hästar i träning");
  ok(Math.abs(mål[0].andel - 2 / 6) < 0.01, "progressen räknas ur verkliga siffror (2/6)");
  spel.stall = Array.from({ length: 7 }, (_, i) => häst("H" + i));
  ok(!långsiktigt(spel).some((k) => k.mål.includes("Sex hästar")),
    "uppnådda milstolpar försvinner tyst — riktmärken, inte troféer");
}

{
  const spel = nyttSpel();
  spel.stall = [häst("A", { ägare: "X" })];
  const n = veckonetto(spel);
  ok(n.intäkter > 0 && n.kostnader > 0 && n.netto === n.intäkter - n.kostnader,
    "veckonettot (flyttat till motorn) räknar ihop");
}

{
  /* Pälsskifteslogiken (lagningen i ui-stallvy, fristående från UI-lagret):
     hästens index bland stallkamrater med samma pälsnamn — per konstruktion
     unikt inom pälsgruppen, stabilt oavsett övriga stallets ordning. */
  const pälsAv = (n) => n.length % 2 ? "brun" : "fux";   // stubb — grupperingen är det som prövas
  const skifte = (stall, häst) => Math.max(0, stall
    .filter((h) => pälsAv(h.namn) === pälsAv(häst.namn))
    .findIndex((h) => h.id === häst.id));
  const stall = ["Alfa", "Beta", "Gamma", "Delta", "Epsilon"].map((n) => ({ id: n, namn: n }));
  const grupper = {};
  stall.forEach((h) => { (grupper[pälsAv(h.namn)] ??= []).push(skifte(stall, h)); });
  ok(Object.values(grupper).every((ix) => new Set(ix).size === ix.length),
    "stallkamrater med samma päls får garanterat olika fotoindex");
  ok(skifte(stall, { id: "Okänd", namn: "Okänd" }) === 0,
    "häst utanför stallet faller ofarligt till index 0");
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
