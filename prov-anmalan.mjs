/**
 * PROV — ANMÄLNINGSMOTORN (v93, etapp B)
 *
 * Uttagningen är spelets nya rättvisemaskin och måste vara vattentät:
 * samma lopp och vecka ger samma anmälningsläge hur många gånger man än
 * frågar (deterministiskt faktum, inte tärningskast per knapptryck),
 * trösklarna 0–3/4–7/8+ följs, poänggränsen är verkligen de uttagnas
 * lägsta, ingen struken har högre poäng än gränsen (utan företräde),
 * ostartade går före i taklopp, och alternativen är berättigade lopp
 * med bäst bedömning först.
 */
import { sättRng, seedad } from "./engine-util.js";
import { byggVärld } from "./engine-varld.js";
import { veckansLopp } from "./data-kalender.js";
import { anmälningsläge, uttagning, alternativlopp, delaFält } from "./engine-anmalan.js";
import { startpoäng, loppläge } from "./engine-proposition.js";
import { nyHäst } from "./engine-hast.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

function byggSpel(frö) {
  sättRng(seedad(frö));
  const värld = byggVärld();
  sättRng();
  const egen = nyHäst({ ålder: 5 });
  egen.egen = true; egen.intjänat = 90000; egen.starter = 8;
  egen.resultat = [
    { plats: 2, pris: 15000 }, { plats: 1, pris: 30000 }, { plats: 4, pris: 4000 },
    { plats: 3, pris: 8000 }, { plats: 5, pris: 2500 },
  ];
  return { spel: { vecka: 6, värld }, egen };
}

console.log("PROV: anmälningsmotorn\n");

/* ---------- Determinism ---------- */
{
  const { spel, egen } = byggSpel(11);
  const lopp = veckansLopp(6)[0];
  const a = anmälningsläge(spel, lopp, egen);
  const b = anmälningsläge(spel, lopp, egen);
  ok(a.anmälda.length === b.anmälda.length
    && a.anmälda.every((h, i) => h === b.anmälda[i]),
    `anmälningsläget är ett faktum: ${a.anmälda.length} anmälda, samma lista varje gång`);
  const u1 = uttagning(spel, lopp, egen);
  const u2 = uttagning(spel, lopp, egen);
  ok(u1.utfall === u2.utfall && u1.text === u2.text,
    "uttagningens utfall och text är identiska mellan anrop");
}

/* ---------- Trösklar, gräns och strukna över många lopp ---------- */
{
  let prövade = 0, överanmälda = 0, inställda = 0, tunna = 0, gränsfel = 0, strukenfel = 0, textlösa = 0;
  for (let frö = 0; frö < 25; frö++) {
    const { spel, egen } = byggSpel(100 + frö);
    for (const lopp of veckansLopp(1 + (frö % 18))) {
      spel.vecka = 1 + (frö % 18);
      const u = uttagning(spel, lopp, egen);
      prövade++;
      if (!u.text || u.text.length < 15) textlösa++;
      if (u.utfall === "inställt") { inställda++; if (u.antal > 7) gränsfel++; continue; }
      if (u.arrangör && u.utfall === "med") tunna++;
      if (u.antal >= 8 && u.utfall === "inställt") gränsfel++;
      if (u.överanmält) {
        överanmälda++;
        if (u.utfall === "med") {
          if (u.fält.length !== u.platser) gränsfel++;
        } else if (u.utfall === "struken") {
          /* Struken utan företräde får inte ha poäng över gränsen. */
          if (u.dinPoäng > u.gräns) strukenfel++;
        }
      }
      if (u.utfall === "med" && u.fält[0] !== egen) gränsfel++;
    }
  }
  ok(prövade > 100, `${prövade} lopp prövade över 25 världar`);
  ok(överanmälda > 15, `överanmälan förekommer på riktigt (${överanmälda} lopp)`);
  ok(inställda > 0 || tunna > 0, `tunna fält händer: ${inställda} inställda, ${tunna} arrangörskörda`);
  ok(gränsfel === 0, "trösklarna 0–3/4–7/8+ och fältstorleken håller i varje lopp");
  ok(strukenfel === 0, "ingen struken hade poäng över gränsen");
  ok(textlösa === 0, "varje utfall förklaras i klartext — transparenskravet");
}

/* ---------- Poänggränsen är de uttagnas lägsta ---------- */
{
  let kontrollerad = false;
  for (let frö = 0; frö < 40 && !kontrollerad; frö++) {
    const { spel, egen } = byggSpel(300 + frö);
    for (const lopp of veckansLopp(1 + (frö % 18))) {
      spel.vecka = 1 + (frö % 18);
      const u = uttagning(spel, lopp, egen);
      if (u.utfall !== "med" || !u.överanmält) continue;
      const lägst = Math.min(...u.fält.map((h) => startpoäng(h).poäng));
      ok(u.gräns === lägst, `gränsen (${u.gräns}) är de uttagnas lägsta poäng`);
      kontrollerad = true; break;
    }
  }
  ok(kontrollerad, "hittade ett överanmält lopp att kontrollera gränsen i");
}

/* ---------- Företrädet för ostartade i taklopp ---------- */
{
  const { spel } = byggSpel(77);
  const ostartad = nyHäst({ ålder: 3 });
  ostartad.egen = true; ostartad.starter = 0; ostartad.intjänat = 0; ostartad.resultat = [];
  const taklopp = veckansLopp(6).find((l) => l.krav?.maxInsprunget);
  spel.vecka = 6;
  let träff = null;
  for (let v = 1; v <= 18 && !träff; v++) {
    spel.vecka = v;
    for (const l of veckansLopp(v)) {
      if (!l.krav?.maxInsprunget) continue;
      const u = uttagning(spel, l, ostartad);
      if (u.överanmält && u.utfall === "med" && u.företräde) { träff = u; break; }
    }
  }
  ok(!!träff && träff.text.includes("företräde"),
    "ostartad häst går in på företrädesregeln i överanmält taklopp — och beskedet säger det");
  ok(!!taklopp, "kalendern har taklopp att pröva mot");
}

/* ---------- Alternativen ---------- */
{
  const { spel, egen } = byggSpel(5);
  const veckans = veckansLopp(6);
  spel.vecka = 6;
  const alt = alternativlopp(veckans, veckans[0], egen, loppläge);
  ok(alt.length > 0 && alt.length <= 2, `högst två alternativ föreslås (${alt.length})`);
  ok(alt.every((x) => x.läge.status !== "ej"), "alla alternativ är berättigade");
  ok(alt.every((x, i, arr) => i === 0 || arr[i - 1].läge.ordning <= x.läge.ordning),
    "bäst bedömning först");
}

/* ---------- Delningen (v96, manualen 6.6) ---------- */
{
  let delade = 0, egenMedAlltid = true, taketHåller = true, prövade = 0, storloppsdelning = 0;
  for (let frö = 0; frö < 30; frö++) {
    const { spel, egen } = byggSpel(700 + frö);
    for (const lopp of veckansLopp(1 + (frö % 18))) {
      spel.vecka = 1 + (frö % 18);
      const u = uttagning(spel, lopp, egen);
      prövade++;
      if (!u.delat) { if ((lopp.storlopp || lopp.v85) && u.delat) storloppsdelning++; continue; }
      delade++;
      if (lopp.storlopp || lopp.v85) storloppsdelning++;
      if (!u.fält.includes(egen)) egenMedAlltid = false;
      if (u.fält.length > lopp.startande) taketHåller = false;
      if (u.fält[0] !== egen) egenMedAlltid = false;
    }
  }
  ok(delade > 5, `stora överanmälningar delas (${delade} av ${prövade} lopp)`);
  ok(egenMedAlltid, "spelarens häst är alltid med i sin avdelning, först i fältet");
  ok(taketHåller, "ingen avdelning överstiger platstaket");
  ok(storloppsdelning === 0, "storlopp och V85 delas aldrig — deras fält är poängen");

  /* Jämnheten: round-robin ger avdelningar med likvärdig poängtyngd. */
  const hästar = Array.from({ length: 20 }, (_, i) => ({
    id: i, namn: "H" + i, intjänat: i * 10000, starter: 5,
    resultat: [{ plats: (i % 5) + 1, pris: i * 1000 }],
  }));
  const avd = delaFält(hästar, { startande: 12 });
  /* Jämnheten mäts i det delningen sorterar på: startpoängen. */
  const poängsumma = (a) => a.reduce((x, h) => x + startpoäng(h).poäng, 0);
  ok(avd.length === 2 && Math.abs(poängsumma(avd[0]) - poängsumma(avd[1])) < poängsumma(avd[0]) * 0.15,
    "avdelningarna är poängmässigt jämna — ingen b-final");
}

sättRng();
console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
