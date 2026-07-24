import { rnd, int, klamp, plock, kr, slump as slumpTal } from "./engine-util.js";
import { nyHäst } from "./engine-hast.js";
import { nyttNamn } from "./data-namn.js";
import { tränarliga } from "./engine-varld.js";
import { registreraHändelse } from "./engine-handelser.js";
import { invalIHallOfFame } from "./engine-rekord.js";
import { prövaMentornsBortgång } from "./engine-mentor.js";

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
  /* Ny säsong, ny chans till en (1) skadeförstasida. */
  delete spel.skadescenSäsong;
  spel.intjänat = 0;
  spel.logg = [];
  spel.startadeLopp = [];
  spel.erbjudande = null;

  const pensionerade = [];
  /* Egenskaperna som nedärvs ska vara hästens — inte hästens sista
     ålderstapp. åldraHäst muterar på plats, så en ögonblicksbild tas
     FÖRE åldrandet; det är den som följer med till avelshagen. Utan
     detta ärvde fölen alltid en extra årgång förfall. */
  const föreÅldring = new Map(spel.stall.map((h) => [h.id,
    { start: h.start, fart: h.fart, styrka: h.styrka }]));
  spel.stall = spel.stall.filter((h) => {
    if (åldraHäst(h)) { pensionerade.push(h); return false; }
    return true;
  });

  /* PENSIONERINGEN är karriärens sista rubrik, inte en tyst radering ur
     en lista. Betydelsen följer vad hästen faktiskt betydde för stallet:
     en trotjänare med segrar får ett uppslag på Hem och en plats i
     troférummet, en häst som aldrig kom till sin rätt får en notis.
     Lyssnarna avgör resten — den här filen skickar bara händelsen. */
  /* AVELSSTONA. Ett pensionerat sto med meriter försvinner inte — hon
     flyttar till avelshagen och kan betäckas. Det är fas 5 på riktigt:
     avkommor EFTER gamla stjärnor, inte bara efter de ston som råkar stå
     kvar i tävlingsstallet. Grundegenskaperna fryses vid pensionen; det
     är dem hon nedärver. Högst sex i hagen — de äldsta lämnar. */
  spel.avelsston = spel.avelsston ?? [];
  pensionerade.forEach((h) => {
    if (h.kön === "sto" && !h.ägare && ((h.segrar || 0) >= 2 || (h.intjänat || 0) >= 300000)) {
      const frusen = föreÅldring.get(h.id) ?? h;
      spel.avelsston.push({
        id: h.id, namn: h.namn, ålder: h.ålder,
        start: frusen.start, fart: frusen.fart, styrka: frusen.styrka,
        segrar: h.segrar || 0, intjänat: h.intjänat || 0,
        milstolpar: h.milstolpar || [],
      });
    }
  });
  spel.avelsston.forEach((m) => { m.ålder++; });
  /* Förstamannens tid hos dig räknas i säsonger — det är den valutan
     avgångssamtalet mäts i. */
  if (spel.förstaman) spel.förstaman.säsongerHosDig = (spel.förstaman.säsongerHosDig ?? 0) + 1;
  spel.avelsston = spel.avelsston.filter((m) => m.ålder <= 20).slice(-6);

  /* Väggen i stallgången: de största går in i hall of fame vid pensionen.
     Tio platser, meriten avgör — att någon petas är poängen. */
  pensionerade.forEach((h) => {
    if ((h.segrar || 0) > 0 || (h.intjänat || 0) > 100000) invalIHallOfFame(spel, h);
  });
  pensionerade.forEach((h) => {
    const betydelse = Math.min(95, 25
      + (h.segrar || 0) * 6
      + Math.min(30, (h.intjänat || 0) / 40000)
      + ((h.milstolpar || []).some((m) => m.typ === "storloppsseger") ? 20 : 0));
    registreraHändelse(spel, {
      typ: "pensionering",
      betydelse: Math.round(betydelse),
      aktörer: { hästId: h.id, hästNamn: h.namn, ägare: h.ägare ?? null },
      data: {
        ålder: h.ålder, starter: h.starter || 0, segrar: h.segrar || 0,
        intjänat: h.intjänat || 0,
        gårdsveteran: spel.gårdsveteran?.namn === h.namn,
      },
    });
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

  /* Mentorn åldras med säsongerna — och en dag kommer beskedet.
     Prövas sist, så att årets övriga scener redan ligger i kön. */
  prövaMentornsBortgång(spel);
  return { pensionerade, säsong: spel.säsong };
}

/** Kort sammanfattning i klartext, för pressen och säsongsvyn. */
export function säsongstext(rad) {
  return `Säsong ${rad.säsong}: ${rad.plats}:a av ${rad.avStall} stall, ` +
    `${kr(rad.intjänat)} kr insprunget på ${rad.starter} starter och ${rad.segrar} segrar.`;
}
