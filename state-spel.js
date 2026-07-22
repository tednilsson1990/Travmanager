import { useEffect, useRef, useState, useCallback } from "preact/hooks";
import { nyHäst, sättIdRäknare, idRäknare } from "./engine-hast.js";

const NYCKEL = "travmanager.sparfil.v1";

export function nyttSpel() {
  sättIdRäknare(1);
  return {
    version: 1,
    stallnamn: "Björkhaga",
    vecka: 1, veckor: 20,
    kassa: 180000, intjänat: 0,
    renommé: 25, spelförtroende: 40,
    stallform: 50, marknadsbild: 0, resultathistorik: [],
    stall: [nyHäst({ ålder: 5 }), nyHäst({ ålder: 4 }), nyHäst({ ålder: 7 })],
    kuskrelation: {},
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
    if (spel.version !== 1) return null;
    sättIdRäknare(spel.nästaId || 1000);
    // Fält som tillkommit efter att sparfilen skapades
    spel.stallform ??= 50;
    spel.marknadsbild ??= 0;
    spel.resultathistorik ??= [];
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
