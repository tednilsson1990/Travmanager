/**
 * PROV — STARTERVALET OCH GENOMBROTTET (v115, kap 21.1–21.2)
 *
 * Startervalet: tre tydligt olika kandidater med arvtagarrollen, och
 * profilerna håller sina löften (spetsaren snabb ut och nära taket,
 * stayern stark och långdistanssinnad, talangen ung och grön).
 * Genombrottet: en ung vinnare i ett lopp som betyder något får
 * ceremonin EN gång — pressen skriver, sammanfattningen bär raden,
 * hästen bär märket. En gammal häst får den aldrig.
 */
import { sättRng, seedad } from "./engine-util.js";
import { startervalskandidater, STARTERTEXT } from "./engine-prolog.js";
import { simulera } from "./engine-simulera.js";
import { efterLopp } from "./engine-vecka.js";
import { nyHäst } from "./engine-hast.js";
import { KUSKAR } from "./data-kuskar.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: startervalet och genombrottet\n");

/* ---------- Startervalet ---------- */
{
  sättRng(seedad(7));
  const val = startervalskandidater();
  sättRng();
  ok(val.length === 3 && val.every((h) => h.roll === "arvtagaren"),
    "tre kandidater, alla med arvtagarens roll");
  const [spets, stayer, talang] = val;
  ok(spets.ålder === 5 && spets.start >= 66 && spets.styrka <= 52,
    "spetsaren: färdig femåring — snabb ut, taket nära");
  ok(stayer.ålder === 6 && stayer.styrka >= 66 && stayer.distans === "lång",
    "stayern: styrkan och den långa distansen");
  ok(talang.ålder === 3 && talang.start <= 48 && talang.travsäkerhet <= 0.8 && talang.hype >= 20,
    "talangen: ung, grön och omtalad — åldern är taket");
  ok(val.every((h) => STARTERTEXT[h.starterprofil]?.ord.length > 40),
    "korten talar i ord — nivå 0 vet inga siffror");
}

/* ---------- Genombrottet ---------- */
{
  const lopp = { dist: 2140, start: "auto", startande: 10, banaNamn: "Prov", kortnamn: "Vårfavoriten",
    pris: [30000,15000,7500,4000,2500,1500,1000,800], garanterad: 500, nivå: 50, id: "p" };
  const kör = (ålder) => {
    for (let seed = 1; seed <= 200; seed++) {
      sättRng(seedad(seed));
      const fält = Array.from({ length: 10 }, (_, i) => {
        const h = nyHäst({ ålder: 5 }); h.spår = i + 1; h.kusk = KUSKAR[i]; h.taktik = "rygg"; h.streck = 10;
        return h;
      });
      const egen = fält[0];
      egen.egen = true; egen.ålder = ålder;
      egen.fart = 78; egen.styrka = 76; egen.start = 74; egen.form = 70; egen.energi = 90;
      const sim = simulera(fält, lopp);
      const min = sim.resultat.find((r) => r.häst === egen);
      if (min?.plats !== 1) continue;
      const spel = { vecka: 4, säsong: 1, veckor: 18, kassa: 50000, stall: [egen], press: [], logg: [],
        värld: { hästar: [], stall: [] }, renommé: 30, ägarrelationer: {}, sponsorer: [],
        rivaliteter: {}, kuskrelation: {}, händelser: [], huvudnyhet: null };
      const s1 = efterLopp(spel, { häst: egen, kusk: KUSKAR[0], lopp, min, sim, varFavorit: true, streckRang: 1 });
      sättRng();
      return { spel, egen, s1, sim, lopp };
    }
    sättRng();
    return null;
  };

  const ung = kör(4);
  ok(!!ung, "en ung vinnare hittades i provloppen");
  if (ung) {
    ok(!!ung.egen.genombrott && ung.egen.genombrott.lopp === "Vårfavoriten",
      "genombrottet bokförs på hästen med lopp och säsong");
    ok(typeof ung.s1.genombrott === "string" && ung.s1.genombrott.includes("genombrottet"),
      "sammanfattningen bär ceremoniraden");
    ok(ung.spel.press.some((p) => p.rubrik.startsWith("GENOMBROTTET")),
      "pressen skriver om klivet");
    /* En gång per häst: en andra seger ger ingen ny ceremoni. */
    sättRng(seedad(999));
    const min2 = { ...ung.sim.resultat.find((r) => r.häst === ung.egen) };
    const s2 = efterLopp(ung.spel, { häst: ung.egen, kusk: KUSKAR[0], lopp: ung.lopp,
      min: min2, sim: ung.sim, varFavorit: true, streckRang: 1 });
    sättRng();
    ok(!s2.genombrott, "ceremonin sker EN gång — andra segern är bara en seger");
  }

  const gammal = kör(7);
  ok(!!gammal && !gammal.egen.genombrott,
    "sjuåringen får aldrig genombrottet — klivet tillhör de unga");
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
