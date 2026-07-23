/**
 * DIAGNOS: VARFÖR ÄR RYGG LEDAREN FRI VID 400 M?
 *
 * Fri väg kräver att platsen utanför ryggen är tom. 96 % fri väg betyder
 * att ytterraden nästan aldrig täcker rygghästen där. Skriptet mäter vid
 * 400 m kvar:
 *
 *   A. Finns det ingen häst alls i andraspåret i främre delen?
 *   B. Finns ytterhästar, men alla ligger FÖRE ryggens höjd (attacken gick)?
 *   C. Finns ytterhästar, men alla ligger EFTER (raden gled bakåt)?
 *   D. Täckt — någon ligger jämsides ryggen.
 *
 * Avstånd i 'avst' är längder bakom täten. En häst täcker ryggen om den
 * ligger i kol 1 och inom ±1,2 längder från ryggens höjd (motsvarar
 * upptaget-kontrollen i motorn).
 */
import { sättRng, seedad } from "./engine-util.js";
import { veckansLopp } from "./data-kalender.js";
import { byggVärld, byggFält, rustaFält } from "./engine-varld.js";
import { beräknaStreck } from "./engine-streck.js";
import { simulera } from "./engine-simulera.js";

const SEEDS = [18472, 3, 991, 7710, 42424, 130862];
let n = 0, ingenYtter = 0, allaFöre = 0, allaEfter = 0, täckt = 0;
let ytterAntalSum = 0, kol2Sum = 0;
const täcktVid = { 800: 0, 600: 0, 400: 0, 300: 0 };
const finnsVid = { 800: 0, 600: 0, 400: 0, 300: 0 };

for (const frö of SEEDS) {
  sättRng(seedad(frö));
  const värld = byggVärld();
  for (let i = 0; i < 120; i++) {
    const lopp = veckansLopp(1 + (i % 20))[i % 3] || veckansLopp(1)[0];
    const fält = byggFält(värld, lopp, 1 + i, new Set());
    rustaFält(fält, lopp);
    beräknaStreck(fält, { spelförtroende: 40, stallform: 50, marknadsbild: 0 }, lopp);
    const { bild } = simulera(fält, lopp);
    if (!bild.length) continue;
    const dist = lopp.dist;
    const vid = (kvar) => bild.reduce((b, f) =>
      Math.abs(dist - f.meter - kvar) < Math.abs(dist - b.meter - kvar) ? f : b);

    /* Täckningsgrad över tid */
    for (const kvar of [800, 600, 400, 300]) {
      const f = vid(kvar);
      const rygg = f.rader.find((r) => r.kol === 0 && r.rang === 2);
      if (!rygg) continue;
      finnsVid[kvar]++;
      const täcker = f.rader.some((r) => r.kol === 1 && Math.abs(r.avst - rygg.avst) < 1.2);
      if (täcker) täcktVid[kvar]++;
    }

    /* Detaljbild vid 400 m */
    const f = vid(400);
    const rygg = f.rader.find((r) => r.kol === 0 && r.rang === 2);
    if (!rygg) continue;
    n++;
    const ytter = f.rader.filter((r) => r.kol === 1);
    const kol2 = f.rader.filter((r) => r.kol >= 2);
    ytterAntalSum += ytter.length;
    kol2Sum += kol2.length;
    const jäms = ytter.filter((r) => Math.abs(r.avst - rygg.avst) < 1.2);
    if (jäms.length) { täckt++; continue; }
    if (!ytter.length) { ingenYtter++; continue; }
    if (ytter.every((r) => r.avst < rygg.avst - 1.2)) { allaFöre++; continue; }
    if (ytter.every((r) => r.avst > rygg.avst + 1.2)) { allaEfter++; continue; }
    /* Blandat: några före, några efter — men luckan är vid ryggen */
    allaFöre += 0; allaEfter += 0; ingenYtter += 0;
    täckt += 0;  // hamnar i "lucka mitt i raden" nedan
  }
}
const lucka = n - täckt - ingenYtter - allaFöre - allaEfter;

console.log(`Lopp med rygg ledaren vid 400 m: ${n}`);
console.log(`\nVid 400 m kvar — läget utanför ryggen:`);
console.log(`  täckt (jämsides inom 1,2 längd)   ${(täckt / n * 100).toFixed(1)} %`);
console.log(`  ytterraden helt tom               ${(ingenYtter / n * 100).toFixed(1)} %`);
console.log(`  alla ytterhästar FÖRE ryggen      ${(allaFöre / n * 100).toFixed(1)} %  ← attacken gick, ingen fyllde`);
console.log(`  alla ytterhästar EFTER ryggen     ${(allaEfter / n * 100).toFixed(1)} %  ← raden gled bakåt`);
console.log(`  lucka mitt i raden vid ryggen     ${(lucka / n * 100).toFixed(1)} %`);
console.log(`\nSnitt vid 400 m: ${(ytterAntalSum / n).toFixed(1)} hästar i andraspåret, ${(kol2Sum / n).toFixed(1)} i tredje+`);
console.log(`\nTäckningsgrad över loppet (andel lopp där ryggen är täckt):`);
for (const kvar of [800, 600, 400, 300])
  console.log(`  ${kvar} m kvar   ${(täcktVid[kvar] / Math.max(1, finnsVid[kvar]) * 100).toFixed(0)} %`);
