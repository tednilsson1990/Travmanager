import { nyAnläggning } from "./engine-gard.js";
import { nyMentor, nyGårdshistoria, prologhästar } from "./engine-prolog.js";
import { useEffect, useRef, useState, useCallback } from "preact/hooks";
import { nyHäst, sättIdRäknare, idRäknare } from "./engine-hast.js";
import { byggVärld } from "./engine-varld.js";

const NYCKEL = "travmanager.sparfil.v1";
/* Höj VERSION när sparfilens FORM ändras. Migreringen i ladda() ska då
   känna igen den gamla formen och fylla på det som saknas — aldrig kasta
   bort en karriär utan att säga till. */
const VERSION = 2;

export function nyttSpel() {
  sättIdRäknare(1);
  const mentor = nyMentor();
  return {
    version: VERSION,
    säsong: 0,
    historik: [],
    stallnamn: "Björkhaga",
    vecka: 18, veckor: 20,
    prolog: { aktiv: true, klar: false, övertagen: false, mentor, sistaResultat: null },
    gårdshistoria: nyGårdshistoria(mentor),
    krönika: [],
    kassa: 180000, intjänat: 0,
    renommé: 25, spelförtroende: 40,
    stallform: 50, marknadsbild: 0, resultathistorik: [],
    värld: byggVärld(),
    startadeLopp: [],
    stall: prologhästar(),
    kuskrelation: {},
    dräkt: null, hemmabana: null, uppstartKlar: false,
    förstaman: null, banerbjudande: null, inbjudan: null, segrarTotalt: 0,
    anläggning: nyAnläggning(),
    logg: [], press: [], föl: [],
    erbjudande: null,
    nästaId: idRäknare(),
  };
}

export function spara(spel) {
  try {
    spel.nästaId = idRäknare();
    localStorage.setItem(NYCKEL, JSON.stringify(spel));
    return true;
  } catch { return false; }
}

export function ladda() {
  try {
    const rå = localStorage.getItem(NYCKEL);
    if (!rå) return null;
    const spel = JSON.parse(rå);
    if (!spel.version || spel.version > VERSION) return null;
    /* Migrering: fyll på det som tillkommit sedan sparfilen skrevs. */
    spel.säsong ??= 1;
    spel.historik ??= [];
    spel.stall.forEach((h) => { h.ålder ??= 5; });
    spel.version = VERSION;
    sättIdRäknare(spel.nästaId || 1000);
    // Fält som tillkommit efter att sparfilen skapades
    spel.stallform ??= 50;
    spel.marknadsbild ??= 0;
    spel.resultathistorik ??= [];
    spel.startadeLopp ??= [];
    // Världen tillkom efter att äldre sparfiler skapades
    if (!spel.värld) spel.värld = byggVärld();
    spel.stall.forEach((h) => {
      h.distans ??= { optimal: 2140, tolerans: 520, typ: "medeldistans" };
      h.senasteStartVecka ??= 0;
    });
    return spel;
  } catch { return null; }
}

export function raderaSparfil() {
  try { localStorage.removeItem(NYCKEL); } catch { /* strunt samma */ }
}

/**
 * Motorn muterar spelobjektet. Hooken håller en stabil referens och tvingar
 * omritning via en räknare — billigare än att djupkopiera världen varje tick.
 */
export function useSpel() {
  const ref = useRef(null);
  if (ref.current === null) ref.current = ladda() ?? nyttSpel();
  const [, sättVersion] = useState(0);

  const uppdatera = useCallback((fn) => {
    if (fn) fn(ref.current);
    spara(ref.current);
    sättVersion((v) => v + 1);
  }, []);

  const nystart = useCallback(() => {
    raderaSparfil();
    ref.current = nyttSpel();
    uppdatera();
  }, [uppdatera]);

  useEffect(() => {
    const av = () => spara(ref.current);
    window.addEventListener("beforeunload", av);
    return () => window.removeEventListener("beforeunload", av);
  }, []);

  return { spel: ref.current, uppdatera, nystart };
}
