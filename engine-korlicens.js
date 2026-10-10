/**
 * KÖRLICENSEN (v137, plan 18.11 — kap 26 B-f: tränaren som kusk)
 *
 * I verkligheten kör många tränare sina hästar själva. Nu kan du:
 * välj dig själv i kuskväljaren — inget arvode, ingen kuskandel,
 * alltid "bekräftad" (du svarar själv i luren). Men körförmågan är
 * DIN EGEN: start, avslutning och omdöme som växer långsamt med
 * körda lopp, och som länge är sämre än proffsens. Gratis är inte
 * gratis — en sämre kusk kostar placeringar. Det är avvägningen.
 *
 * Utvecklingen: +0,35 per körning mot taket 62 (en hygglig
 * amatör, aldrig en Goop), pallplats ger lite extra. Ryktbarheten
 * växer med körda lopp — de första trettio räknas du som kårens
 * återväxt och får köra Lärlingsserien (18.6).
 */
import { klamp } from "./engine-util.js";

export const TRÄNARKUSKEN = "Tränaren själv";

export function säkraKörlicens(spel) {
  if (!spel.körlicens) {
    spel.körlicens = { start: 38, avslutning: 38, omdöme: 42, körda: 0, pall: 0 };
  }
  return spel.körlicens;
}

/** Kuskobjektet väljaren och motorn ser — samma form som kåren. */
export function spelarKusk(spel) {
  const k = spel.körlicens ?? { start: 38, avslutning: 38, omdöme: 42, körda: 0 };
  return {
    namn: TRÄNARKUSKEN,
    start: Math.round(k.start), avslutning: Math.round(k.avslutning),
    omdöme: Math.round(k.omdöme),
    arvode: 0, krav: 0, andel: 0,
    startrelation: 100,
    ryktbarhet: Math.min(24, 5 + Math.floor((k.körda ?? 0) / 4)),
    lärling: (k.körda ?? 0) < 30,
    stil: "egen känsla",
    tränarkusk: true,
  };
}

/** Bokförs efter varje egen körning — långsam, ärlig utveckling. */
export function bokförKörning(spel, min) {
  const k = säkraKörlicens(spel);
  k.körda += 1;
  const pall = !min?.ur && (min?.plats ?? 99) <= 3;
  if (pall) k.pall += 1;
  const steg = 0.35 + (pall ? 0.25 : 0);
  k.start = klamp(k.start + steg, 0, 62);
  k.avslutning = klamp(k.avslutning + steg, 0, 62);
  k.omdöme = klamp(k.omdöme + steg * 0.8, 0, 62);
  return k;
}
