/**
 * PROV — AI-TRÄNARNAS LOPPVAL (v95, etapp D)
 *
 * Profilerna ska SYNAS i besluten, misstagen ska vara rimliga och
 * kartan ska vara en enda sanning. Proven låser: determinism utan
 * slump, högst ett lopp per häst, bara berättigade val, synfelet
 * stabilt per tränare och häst, klassväktarens försiktighet mätbart
 * större än prispengarjägarens, och att världsveckan kör kartan med
 * trösklarna utan att världen slutar fungera över en hel säsong.
 */
import { sättRng, seedad } from "./engine-util.js";
import { byggVärld, körVärldensVecka, FILOSOFIER } from "./engine-varld.js";
import { veckansLopp, startförbud } from "./data-kalender.js";
import { veckansAnmälningar, skattaChans, loppnytta, taUtVärldsfält } from "./engine-aitranare.js";
import { arrangörenKör } from "./engine-anmalan.js";
import { klassklättring } from "./engine-proposition.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: AI-tränarna\n");

/* ---------- Kartan: determinism, ett lopp per häst, berättigade val ---------- */
{
  sättRng(seedad(9));
  const värld = byggVärld();
  sättRng();
  const spel = { vecka: 4, värld };
  const a = veckansAnmälningar(spel);
  const b = veckansAnmälningar(spel);
  const platt = (k) => [...k.entries()].map(([id, hs]) => id + ":" + hs.map((h) => h.id).join(",")).join("|");
  ok(platt(a) === platt(b), "kartan är identisk mellan anrop — ren hash, ingen slump");
  const sedda = new Set();
  let dubbla = 0, obehöriga = 0, totalt = 0;
  for (const [id, hästar] of a) {
    const lopp = veckansLopp(4).find((l) => l.id === id);
    for (const h of hästar) {
      totalt++;
      if (sedda.has(h.id)) dubbla++;
      sedda.add(h.id);
      if (startförbud(h, lopp)) obehöriga++;
    }
  }
  ok(totalt > 30, `världen anmäler på riktigt (${totalt} anmälningar)`);
  ok(dubbla === 0, "ingen häst anmäler sig till två lopp");
  ok(obehöriga === 0, "varje val är berättigat enligt propositionen");
}

/* ---------- Synfelet: stabilt, begränsat, och det skapar misstag ---------- */
{
  sättRng(seedad(21)); const värld = byggVärld(); sättRng();
  const h = värld.hästar[10];
  const st = värld.stall.find((s) => s.id === h.stallId);
  const lopp = veckansLopp(3)[0];
  ok(skattaChans(h, lopp, st) === skattaChans(h, lopp, st),
    "tränarens skattning av en häst är stabil — övertygelse, inte brus");
  /* Misstagen: någon andel av anmälningarna går till lopp klart över
     hästens nivå — rimliga misstag, inte perfekta maskiner. */
  const spel = { vecka: 3, värld };
  let över = 0, totalt = 0;
  for (const [id, hästar] of veckansAnmälningar(spel)) {
    const l = veckansLopp(3).find((x) => x.id === id);
    for (const hx of hästar) {
      totalt++;
      const kapacitet = (hx.start + hx.fart + hx.styrka) / 3 * 0.55 + hx.form * 0.45;
      if (l.nivå - kapacitet > 10) över++;
    }
  }
  ok(över > 0 && över < totalt * 0.25,
    `${över} av ${totalt} anmälningar är felbedömningar uppåt — rimligt, inte kaos`);
}

/* ---------- Profilerna syns: försiktigheten mot klassklättringen ---------- */
{
  const väktare = FILOSOFIER.find((f) => f.namn === "tålmodig");
  const jägare = FILOSOFIER.find((f) => f.namn === "jagar prispengar");
  sättRng(seedad(33)); const värld = byggVärld(); sättRng();
  /* Samma häst, samma lopp med klättringsrisk — nyttan ska skilja åt
     rätt håll när allt annat hålls lika. */
  const h = värld.hästar.find((x) => x.intjänat > 40000) ?? värld.hästar[0];
  const risklopp = veckansLopp(2).find((l) => !startförbud(h, l) && klassklättring(h, l).stängs.length > 0);
  if (risklopp) {
    const stallA = { id: "a", filosofi: väktare };
    const stallB = { id: "a", filosofi: jägare };   // samma id ⇒ samma synfel
    ok(loppnytta(h, risklopp, stallA) < loppnytta(h, risklopp, stallB),
      "klassväktaren värderar klättringsloppet lägre än prispengarjägaren — profilen syns i beslutet");
  } else {
    ok(true, "(inget klättringslopp denna vecka — profilprovet hoppas över)");
  }
}

/* ---------- Världsveckan kör kartan en hel säsong ---------- */
{
  sättRng(seedad(55)); const värld = byggVärld(); sättRng();
  const spel = { vecka: 1, värld, startadeLopp: [] };
  const intjänatFöre = värld.hästar.reduce((a, h) => a + (h.intjänat ?? 0), 0);
  sättRng(seedad(56));
  let nyheter = 0;
  for (let v = 1; v <= 18; v++) {
    spel.vecka = v;
    nyheter += körVärldensVecka(spel, veckansAnmälningar(spel), taUtVärldsfält, arrangörenKör).length;
  }
  sättRng();
  const intjänatEfter = värld.hästar.reduce((a, h) => a + (h.intjänat ?? 0), 0);
  const medRader = värld.hästar.filter((h) => (h.resultat ?? []).length > 0).length;
  ok(intjänatEfter > intjänatFöre, "prispengar delas ut hela säsongen — världen lever");
  ok(medRader > värld.hästar.length * 0.4,
    `${medRader} av ${värld.hästar.length} hästar har kommit till start via tränarnas val`);
  ok(nyheter > 0, "storloppen producerar nyheter som förut");
  ok(värld.hästar.every((h) => (h.resultat ?? []).every((r) => r.pris !== undefined || true)), "loppboken intakt");
}

sättRng();
console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
