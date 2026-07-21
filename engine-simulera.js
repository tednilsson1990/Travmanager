import { rnd, klamp, LÄNGD, kmtid } from "./engine-util.js";
import { spårfördel } from "./data-lopp.js";

const DT = 0.25;          // sekunder per tick
const MAXTID = 400;       // säkerhetsspärr
const BILDINTERVALL = 0.5; // hur ofta en bildruta sparas

/**
 * Tick-baserad loppsimulering.
 *
 * Allt som visas — placering, avstånd i längder, km/h, sektionstider —
 * läses ur samma två storheter som en riktig tracking-graf: meter och m/s.
 * Ingen separat "placeringsformel" finns.
 *
 * @param {Array} fält   hästar med .kusk, .taktik, .spår och .streck satta
 * @param {Object} lopp  loppdefinition
 * @returns {{bild: Array, resultat: Array}}
 */
export function simulera(fält, lopp) {
  const dist = lopp.dist;
  const bild = [];
  const kommentar = [];
  const säg = (t, k = "") => kommentar.push({ t, k });

  const H = fält.map((h) => ({
    h,
    kusk: h.kusk,
    taktik: h.taktik,
    spår: h.spår,
    d: 0,
    v: 0,
    // Formen påverkar både toppfart och hur mycket hästen orkar. Utan detta
    // vore publikens formbaserade streckprocent frånkopplad från utfallet.
    vmax: (12.15 + h.fart * 0.031) * (1 + (h.form - 50) * 0.0016),
    kraft: 100 + (h.form - 50) * 0.28 + (h.energi - 85) * 0.12,
    sf: 0.68 + (h.styrka / 100) * 0.62, // uthållighetsfaktor
    lane: 0,                            // 0 inner, 1 utvändigt, 2 tredje
    galopp: 0,
    ur: false,
    instängd: false,
    skyddTid: 0,
    utanSkyddTid: 0,
    respekt: klamp(h.streck / 45, 0, 1), // välspelad = utmanas mer sällan
    mål: null,
    sista800: null,
    sista400: null,
  }));

  /* ---------- Startmomentet ---------- */
  H.forEach((s) => {
    const utlösning =
      s.h.start * 0.72 +
      s.kusk.start * 0.34 +
      spårfördel(s.spår, lopp.start) +
      rnd(-7, 7) +
      (s.taktik === "ledning" ? 9 : s.taktik === "rygg" ? 4
        : s.taktik === "spurt" ? -9 : s.taktik === "skydd" ? -3 : 0);
    s.d = Math.max(0, (utlösning - 40) * 0.55);
    s.v = 12.6 + utlösning * 0.012;

    let p = 0.055 * (1 + (70 - s.h.lynne) / 85) * (1 - (s.kusk.kyla - 50) / 190);
    if (lopp.start === "volt" && s.spår >= 5) p *= 1.6;
    if (s.taktik === "ledning") p *= 1.35;
    if (Math.random() < p) {
      s.galopp = 1;
      s.kraft -= 16;
      s.d -= rnd(18, 34);
      s.v = 9;
      if (Math.random() < 0.26) s.ur = true;
      säg(`<b>${s.h.namn}</b> galopperar i starten${s.ur ? " och blir bortkörd" : ""}.`, "illa");
    }
  });

  const iOrdning = () => H.filter((s) => !s.ur).sort((a, b) => b.d - a.d);
  /** Hästen jag har rygg av: samma spårled, 0,5–9 m framför. */
  const framför = (s) => {
    let bäst = null;
    H.forEach((o) => {
      if (o === s || o.ur || o.lane !== s.lane) return;
      const gap = o.d - s.d;
      if (gap > 0.5 && gap < 9 && (!bäst || gap < bäst.d - s.d)) bäst = o;
    });
    return bäst;
  };
  const upptaget = (lane, d) => H.some((o) => !o.ur && o.lane === lane && Math.abs(o.d - d) < 5);

  let t = 0, klara = 0, förraLedare = null;
  const levande = H.filter((s) => !s.ur).length;

  /* ---------- Loppets gång ---------- */
  while (t < MAXTID && klara < levande) {
    t += DT;
    const ord = iOrdning();
    const led = ord[0];
    const kvar = dist - (led ? led.d : 0);
    const upplopp = kvar < 420;

    if (led && led !== förraLedare && t > 3) {
      säg(förraLedare
        ? `<b>${led.h.namn}</b> tar över ledningen från <b>${förraLedare.h.namn}</b>.`
        : `<b>${led.h.namn}</b> leder fältet.`, "hot");
      förraLedare = led;
    }

    H.forEach((s) => {
      if (s.ur || s.mål !== null) return;
      const drag = framför(s);
      const skydd = !!drag;
      skydd ? (s.skyddTid += DT) : (s.utanSkyddTid += DT);

      /* --- Taktiskt beslut var tredje sekund --- */
      if (Math.abs(t % 3) < DT && t > 2 && !upplopp) {
        const plats = ord.indexOf(s);
        const villUt =
          (s.taktik === "ledning" && plats > 0) ||
          (s.taktik === "utv" && s.lane === 0) ||
          (s.taktik === "spurt" && kvar < 800) ||
          (s.taktik === "rygg" && plats > 3);
        // Respekt: en välspelad häst framför utmanas mer sällan
        const respekt = drag ? drag.respekt : 0;
        const chans = (villUt ? 0.45 : 0.1) * (1 - respekt * 0.55) * (0.6 + s.kusk.taktik / 160);

        if (s.kraft > 32 && Math.random() < chans && s.lane < 2 && !upptaget(s.lane + 1, s.d)) {
          s.lane++;
          s.kraft -= 1.5;
          if (s.lane === 1 && plats <= 3) säg(`<b>${s.h.namn}</b> går ut och upp utvändigt.`, "hot");
          const g = 0.03 * (1 + (70 - s.h.lynne) / 95) * (1 - (s.kusk.kyla - 50) / 200);
          if (Math.random() < g) {
            s.galopp++; s.kraft -= 14; s.v *= 0.6;
            säg(`<b>${s.h.namn}</b> galopperar i rycket.`, "illa");
          }
        } else if (s.lane > 0 && s.kraft < 38 && !upptaget(s.lane - 1, s.d) && Math.random() < 0.4) {
          s.lane--; // söker skydd igen när krafterna tryter
        }
      }

      /* --- Önskad fart --- */
      let mål;
      if (upplopp) mål = s.vmax * 1.02;
      else if (s === led) {
        const press = H.some((o) => !o.ur && o.lane > 0 && Math.abs(o.d - s.d) < 6);
        mål = s.vmax * (press ? 0.985 : 0.945);
      } else if (skydd) mål = Math.min(drag.v + 0.05, s.vmax);
      else mål = s.vmax * (s.lane >= 1 ? 0.985 : 0.95);

      /* --- Instängd: någon precis framför och utvändigt blockerat --- */
      s.instängd = false;
      if (s.lane === 0 && drag && drag.d - s.d < 4 && upptaget(1, s.d)) {
        if (Math.random() > 0.008 + (s.kusk.taktik - 50) / 9000) {
          s.instängd = true;
          mål = Math.min(mål, drag.v);
        }
      }

      /* --- Kraftuttag: farten i kubik, rabatt för rygg --- */
      const lägeMult = skydd ? 0.7 : s === led ? 0.92 : s.lane >= 1 ? 1.1 : 0.98;
      s.kraft = Math.max(0, s.kraft - DT * 0.62 * Math.pow(s.v / 13.6, 3) * lägeMult / s.sf);
      mål = Math.min(mål, s.vmax * (0.74 + 0.26 * klamp(s.kraft / 38, 0, 1)));

      s.v = Math.max(8, s.v + (mål - s.v) * (mål > s.v ? 0.55 : 0.9) * DT * 2.2);
      s.d += s.v * DT;

      if (s.sista800 === null && s.d >= dist - 800) s.sista800 = t;
      if (s.sista400 === null && s.d >= dist - 400) s.sista400 = t;
      if (s.d >= dist && s.mål === null) { s.mål = t - (s.d - dist) / s.v; klara++; }
    });

    /* --- Bildruta för banvyn och tracking-listan --- */
    if (Math.abs(t % BILDINTERVALL) < DT) {
      const l = iOrdning()[0];
      bild.push({
        tid: t,
        meter: Math.round(l ? Math.min(l.d, dist) : 0),
        pos: H.map((s) => ({
          namn: s.h.namn, spår: s.spår, egen: s.h.egen, ur: s.ur,
          d: Math.min(s.d, dist), lane: s.lane, iMål: s.mål !== null,
        })),
        rader: iOrdning().map((s, i) => ({
          namn: s.h.namn, spår: s.spår, egen: s.h.egen,
          avst: i === 0 ? 0 : (l.d - s.d) / LÄNGD,
          fart: s.v * 3.6,
          kraft: s.kraft,
          läge: s.mål !== null ? "i mål" : i === 0 ? "leder"
            : s.instängd ? "instängd" : s.lane >= 2 ? "tredje utv"
            : s.lane === 1 ? "utvändigt" : framför(s) ? "i rygg" : "fri inner",
        })),
        ur: H.filter((s) => s.ur).map((s) => ({ namn: s.h.namn, spår: s.spår })),
        text: kommentar.splice(0),
      });
    }
  }

  H.filter((s) => !s.ur && s.mål === null)
    .forEach((s) => (s.mål = t + (dist - s.d) / Math.max(s.v, 6)));

  const resultat = H.filter((s) => !s.ur)
    .sort((a, b) => a.mål - b.mål)
    .map((s, i) => ({
      häst: s.h, plats: i + 1, sek: s.mål, km: s.mål / (dist / 1000),
      kusk: s.kusk, spår: s.spår, streck: s.h.streck,
      sista800: s.sista800 !== null ? s.mål - s.sista800 : null,
      sista400: s.sista400 !== null ? s.mål - s.sista400 : null,
      läge: s.lane === 0 ? (s.skyddTid > s.utanSkyddTid ? "rygg/inner" : "fri inner") : "utvändigt",
      utanSkydd: s.utanSkyddTid,
      ur: false,
    }));

  H.filter((s) => s.ur).forEach((s) =>
    resultat.push({ häst: s.h, plats: null, kusk: s.kusk, spår: s.spår, streck: s.h.streck, ur: true }));

  if (bild.length) {
    bild[bild.length - 1].text.push({
      t: `<b>${resultat[0].häst.namn}</b> vinner på ${kmtid(resultat[0].km)}.`, k: "hot",
    });
  }
  return { bild, resultat };
}
