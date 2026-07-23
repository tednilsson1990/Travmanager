import { rnd, int, klamp, blanda, slump } from "./engine-util.js";
import { nyHäst } from "./engine-hast.js";
import { nyttNamn } from "./data-namn.js";

/**
 * HÄSTMARKNADEN
 *
 * Utan den är åldrandet en enkelriktad gata: dina hästar tappar år för år
 * medan världen fylls på med unga, och stallet faller obönhörligt i tabellen.
 * Marknaden är alltså inte en bekvämlighet utan förutsättningen för att en
 * karriär ska gå att bygga över flera säsonger.
 *
 * Priserna följer det en travköpare faktiskt tittar på: kapacitet, ålder,
 * meriter och form. En fyraåring med stigande kurva kostar långt mer än en
 * tioåring med samma siffror, eftersom man köper de år som återstår.
 */

/** Hur många år av karriär finns kvar? Det är i praktiken det man betalar för. */
function åldersfaktor(ålder) {
  if (ålder <= 3) return 1.25;      // outsiderchans, men allt återstår
  if (ålder === 4) return 1.45;     // toppen av marknaden
  if (ålder === 5) return 1.35;
  if (ålder === 6) return 1.15;
  if (ålder === 7) return 0.95;
  if (ålder === 8) return 0.75;
  if (ålder === 9) return 0.55;
  if (ålder === 10) return 0.38;
  if (ålder === 11) return 0.24;
  return 0.14;
}

/**
 * Värdering i kronor. Kapaciteten väger tyngst, men meriter och form
 * påverkar — precis som i verkligheten betalar man både för vad hästen är
 * och för vad den bevisat.
 */
export function värdera(häst) {
  const kapacitet = (häst.start + häst.fart + häst.styrka) / 3;
  const grund = Math.pow(klamp(kapacitet - 22, 1, 80), 2.1) * 42;
  const meritdel = (häst.intjänat || 0) * 0.18;
  const formdel = 1 + (häst.form - 50) / 260;
  const pris = (grund + meritdel) * åldersfaktor(häst.ålder) * formdel;
  return Math.max(15000, Math.round(pris / 5000) * 5000);
}

/** Kort omdöme att visa spelaren, utan att avslöja de sanna värdena. */
export function omdöme(häst) {
  const k = (häst.start + häst.fart + häst.styrka) / 3;
  const klass = k > 68 ? "toppklass" : k > 58 ? "bra klass"
    : k > 48 ? "medelmåtta" : "enkel häst";
  const bana = häst.ålder <= 5 ? "har sina bästa år framför sig"
    : häst.ålder <= 8 ? "i sina bästa år" : "på nedgång";
  return `${klass}, ${bana}`;
}

/**
 * Veckans utbud. Världens stall säljer några hästar, och några unghästar
 * kommer ut från uppfödarna. Listan är deterministisk per vecka och säsong,
 * så den ser likadan ut tills veckan körs — annars kan spelaren ladda om
 * sidan tills rätt häst dyker upp.
 */
export function marknaden(spel) {
  const värld = spel.värld;
  if (!värld) return [];
  const nyckel = (spel.säsong || 1) * 100 + spel.vecka;

  /* Hästar som världens stall vill bli av med: äldre, sämre, eller ur form.
     Ett stall säljer sällan sin bästa häst. */
  const kandidater = värld.hästar
    .filter((h) => h.skada === 0)
    .map((h) => ({ h, lust: (h.ålder >= 8 ? 2 : 0) + (h.form < 45 ? 1.5 : 0)
      + ((h.start + h.fart + h.styrka) / 3 < 50 ? 1.5 : 0) + slump() * 2 }))
    .sort((a, b) => b.lust - a.lust)
    .slice(0, 40);

  /* Ett par hästar som stallen faktiskt vill behålla dyker ändå upp — någon
     behöver pengar, någon har för många i träning. Utan dem består utbudet
     bara av gamlingar och marknaden blir meningslös. */
  const kvalitet = blanda(värld.hästar.filter(
    (h) => h.skada === 0 && h.ålder <= 7 && (h.start + h.fart + h.styrka) / 3 > 55
  )).slice(0, 1 + (nyckel % 2));

  const antal = 2 + (nyckel % 3);
  const säljs = [...blanda(kandidater).slice(0, antal).map((x) => x.h), ...kvalitet];
  const utbud = säljs.map((h) => ({
    häst: h,
    pris: Math.round(värdera(h) * rnd(0.92, 1.18) / 5000) * 5000,
    ursprung: värld.stall.find((s) => s.id === h.stallId)?.namn ?? "okänt stall",
    ung: false,
  }));

  /* Ett par unghästar från uppfödarna. Billiga, obeprövade, och ibland
     riktigt bra — det är där ett litet stall kan göra sitt klipp. */
  const antalUnga = 1 + (nyckel % 2);
  for (let i = 0; i < antalUnga; i++) {
    const bas = rnd(30, 66);
    const h = nyHäst({
      namn: nyttNamn(),
      ålder: 3,
      start: klamp(Math.round(rnd(bas - 9, bas + 12))),
      fart: klamp(Math.round(rnd(bas - 9, bas + 12))),
      styrka: klamp(Math.round(rnd(bas - 9, bas + 12))),
    });
    h.egen = false;
    h.form = klamp(Math.round(rnd(40, 58)));
    h.energi = klamp(Math.round(rnd(78, 94)));
    h.starter = 0; h.segrar = 0; h.intjänat = 0;
    h.senasteStartVecka = 0;
    utbud.push({
      häst: h,
      pris: Math.round(värdera(h) * rnd(0.85, 1.3) / 5000) * 5000,
      ursprung: "uppfödningen",
      ung: true,
    });
  }
  return utbud;
}

/** Köper en häst. Returnerar ett meddelande, eller null om det gick igenom. */
export function köp(spel, post) {
  if (spel.kassa < post.pris) return "Kassan räcker inte.";
  if (spel.stall.length >= 10) return "Stallet är fullt — sälj eller pensionera först.";
  const h = post.häst;
  spel.kassa -= post.pris;
  if (spel.värld) spel.värld.hästar = spel.värld.hästar.filter((x) => x !== h);
  h.egen = true;
  h.stallId = null;
  h.ägare = null;
  h.krav = null;
  h.träning = "lugnt";
  h.senasteStartVecka = 0;
  spel.stall.push(h);
  spel.köpta = [...(spel.köpta || []), { namn: h.namn, pris: post.pris, säsong: spel.säsong || 1 }];
  return null;
}

/**
 * Säljer en häst. Man får något under värderingen — mellanskillnaden är
 * vad det kostar att vara den som vill sälja.
 */
export function sälj(spel, häst) {
  if (häst.ägare) return "Hästen ägs av " + häst.ägare + " och kan inte säljas.";
  if (spel.stall.length <= 1) return "Du kan inte sälja din sista häst.";
  const pris = Math.round(värdera(häst) * rnd(0.78, 0.92) / 5000) * 5000;
  spel.kassa += pris;
  spel.stall = spel.stall.filter((h) => h !== häst);
  /* Hästen försvinner inte ur världen — den hamnar i ett annat stall och
     kan mycket väl möta dig igen. */
  if (spel.värld && spel.värld.stall.length) {
    const st = spel.värld.stall[int(0, spel.värld.stall.length - 1)];
    häst.egen = false;
    häst.stallId = st.id;
    spel.värld.hästar.push(häst);
  }
  return { pris };
}
