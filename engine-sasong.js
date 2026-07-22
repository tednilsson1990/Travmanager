import { rnd, int, klamp, plock, kr, slump as slumpTal } from "./engine-util.js";
import { nyHäst } from "./engine-hast.js";
import { nyttNamn } from "./data-namn.js";
import { tränarliga } from "./engine-varld.js";

/**
 * SÄSONGEN
 *
 * Utan den här filen är spelet en tjugoveckorsdemo: efter sista veckan blir
 * knappen grå och ingenting händer. Hästarna blir heller aldrig äldre, vilket
 * gör avel meningslös och unghästlopp omöjliga från säsong två.
 *
 * Här bor allt som händer MELLAN säsonger: åldrande, utveckling, pensionering,
 * nya årgångar i världens stall, och den historik som gör en karriär till en
 * karriär i stället för en serie lösryckta lopp.
 */

export const PENSIONSÅLDER = 13;

/**
 * Utvecklingskurvan. En treåring växer kraftigt, en sjuåring står stilla och
 * en elvaåring tappar. Kurvan gäller alla hästar, dina som världens.
 */
export function utvecklingssteg(ålder) {
  if (ålder <= 4) return rnd(2.5, 6.5);
  if (ålder === 5) return rnd(1.0, 4.0);
  if (ålder <= 7) return rnd(-0.5, 2.0);
  if (ålder <= 9) return rnd(-1.5, 1.0);
  if (ålder <= 11) return rnd(-3.5, -0.5);
  return rnd(-6.0, -2.0);
}

/** Åldrar och utvecklar en häst ett år. Returnerar true om den bör pensioneras. */
export function åldraHäst(h) {
  h.ålder += 1;
  const steg = utvecklingssteg(h.ålder);
  /* Egenskaperna utvecklas olika snabbt. Startsnabbheten mognar tidigt,
     orken sist — och toppfarten är det första som försvinner med åldern. */
  h.start = klamp(h.start + steg * rnd(0.7, 1.3));
  h.fart = klamp(h.fart + steg * rnd(0.8, 1.4));
  h.styrka = klamp(h.styrka + steg * rnd(0.6, 1.2));
  h.form = klamp(rnd(42, 62));
  h.energi = klamp(rnd(78, 95));
  h.skada = 0;
  h.senasteStartVecka = 0;
  h.hype = klamp(h.hype * 0.5);
  return h.ålder > PENSIONSÅLDER || (h.ålder >= 11 && (h.start + h.fart + h.styrka) / 3 < 34);
}

/** En ny årgång till ett AI-stall, så att unghästloppen har startande. */
function nyÅrgång(stallId, styrka) {
  const bas = 26 + styrka * 34;
  const h = nyHäst({
    namn: nyttNamn(),
    ålder: 3,
    start: klamp(Math.round(rnd(bas - 8, bas + 14))),
    fart: klamp(Math.round(rnd(bas - 8, bas + 14))),
    styrka: klamp(Math.round(rnd(bas - 8, bas + 14))),
  });
  h.egen = false;
  h.stallId = stallId;
  h.form = klamp(Math.round(rnd(40, 58)));
  h.energi = klamp(Math.round(rnd(78, 94)));
  h.starter = 0;
  h.segrar = 0;
  h.intjänat = 0;
  h.senasteStartVecka = 0;
  return h;
}

/**
 * Avslutar säsongen: räknar ihop, skriver in i historiken och returnerar en
 * sammanfattning som gränssnittet kan visa.
 */
export function avslutaSäsong(spel) {
  const liga = tränarliga(spel);
  const plats = liga.findIndex((r) => r.du) + 1;
  const bästa = [...spel.stall].sort((a, b) => (b.intjänat || 0) - (a.intjänat || 0))[0];
  const segrar = spel.stall.reduce((a, h) => a + (h.segrar || 0), 0);
  const starter = spel.stall.reduce((a, h) => a + (h.starter || 0), 0);

  const rad = {
    säsong: spel.säsong || 1,
    plats,
    avStall: liga.length,
    intjänat: spel.intjänat,
    segrar,
    starter,
    renommé: Math.round(spel.renommé),
    bästaHäst: bästa ? bästa.namn : null,
    bästaHästIntjänat: bästa ? bästa.intjänat : 0,
  };
  spel.historik = [rad, ...(spel.historik || [])];
  return rad;
}

/**
 * Startar nästa säsong. Alla hästar åldras och utvecklas, gamla pensioneras,
 * världens stall fyller på med nya årgångar, och veckoräknaren nollställs.
 * Insprungna pengar följer med — det är hästens merit och styr vilka lopp
 * den får starta i.
 */
export function nySäsong(spel) {
  spel.säsong = (spel.säsong || 1) + 1;
  spel.vecka = 1;
  spel.intjänat = 0;
  spel.logg = [];
  spel.startadeLopp = [];
  spel.erbjudande = null;

  const pensionerade = [];
  spel.stall = spel.stall.filter((h) => {
    if (åldraHäst(h)) { pensionerade.push(h); return false; }
    return true;
  });

  const värld = spel.värld;
  if (värld) {
    värld.hästar = värld.hästar.filter((h) => !åldraHäst(h));
    värld.stall.forEach((st) => {
      st.insprunget = 0;
      st.starter = 0;
      st.segrar = 0;

      /* En ny årgång kommer varje år, oavsett om någon pensionerats. Utan det
         stiger världens snittålder ett år per säsong och unghästloppen står
         till slut tomma. För att stallet inte ska växa i all oändlighet
         lämnar de äldsta plats åt de yngsta. */
      const mål = 6 + Math.round((st.styrka || 0.6) * 5);
      const mina = värld.hästar.filter((h) => h.stallId === st.id);
      const nya = 1 + (slumpTal() < 0.45 ? 1 : 0);
      const överskott = Math.max(0, mina.length + nya - mål);
      mina.sort((a, b) => b.ålder - a.ålder)
        .slice(0, överskott)
        .forEach((h) => { h.pensionerad = true; });
      värld.hästar = värld.hästar.filter((h) => !h.pensionerad);
      for (let i = 0; i < nya; i++) värld.hästar.push(nyÅrgång(st.id, st.styrka || 0.6));
    });
  }

  /* Ett nytt år, en ny start för dem som varit i skottgluggen. */
  spel.stall.forEach((h) => { if (h.krav) h.kravStarter = 0; });
  return { pensionerade, säsong: spel.säsong };
}

/** Kort sammanfattning i klartext, för pressen och säsongsvyn. */
export function säsongstext(rad) {
  return `Säsong ${rad.säsong}: ${rad.plats}:a av ${rad.avStall} stall, ` +
    `${kr(rad.intjänat)} kr insprunget på ${rad.starter} starter och ${rad.segrar} segrar.`;
}
