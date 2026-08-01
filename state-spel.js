import { nyAnläggning } from "./engine-gard.js";
import { nyMentor, nyGårdshistoria, prologhästar } from "./engine-prolog.js";
import { useEffect, useRef, useState, useCallback } from "preact/hooks";
import { nyHäst, sättIdRäknare, idRäknare } from "./engine-hast.js";
import { byggVärld } from "./engine-varld.js";
import { sättHändelseRäknare, händelseRäknare } from "./engine-handelser.js";

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
    krönika: [], troférum: [], rivaliteter: {}, huvudnyhet: null,
    avelsston: [], bågeSkrivet: {}, båge: null, scener: [],
    tidigareFörstamän: [], ägarrelationer: {}, rekord: {}, hallOfFame: [],
    minneslopp: null, tränarnamn: null,
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
    nästaHändelseId: 1,
  };
}

export function spara(spel) {
  try {
    spel.nästaId = idRäknare();
    spel.nästaHändelseId = händelseRäknare();
    localStorage.setItem(NYCKEL, JSON.stringify(spel));
    /* Sparstatus utanför sparfilen (annars sparar vi tidsstämpeln om
       sparningen som skrev den — hönan och ägget). Indikatorn i toppraden
       läser den här: ett managerspel som ska levas i decennier måste
       visa att karriären faktiskt ligger säkert. */
    sparstatus = { när: Date.now(), ok: true };
    return true;
  } catch {
    sparstatus = { när: Date.now(), ok: false };
    return false;
  }
}

let sparstatus = { när: null, ok: true };
export const senasteSparning = () => sparstatus;

/** Exportera karriären som JSON-text (för fil eller urklipp). */
export function exporteraSparfil() {
  return localStorage.getItem(NYCKEL) ?? "";
}

/**
 * Importera en karriär från JSON-text. Valideras HÅRT innan något
 * skrivs: en trasig import får aldrig förstöra den sparfil som redan
 * ligger — den gamla röres inte förrän den nya bevisat sig parsbar och
 * versionsmigrerbar.
 */
export function importeraSparfil(text) {
  const data = JSON.parse(text);            // kastar vid trasig JSON — bra
  if (!data || typeof data !== "object" || !Array.isArray(data.stall))
    throw new Error("Filen ser inte ut som en Travmanager-karriär.");
  localStorage.setItem(NYCKEL, text);
  return true;
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
    /* Händelse-id:n måste fortsätta där sparfilen slutade — annars får två
       olika händelser samma id och krönikan kan inte skilja dem åt. */
    sättHändelseRäknare(spel.nästaHändelseId || ((spel.krönika?.length ?? 0) + 1));
    /* v59: händelsebussens nya lager. Äldre karriärer får dem tomma —
       krönikan de redan har fortsätter fungera, aktörerna normaliseras
       vid nästa registrering. */
    spel.krönika ??= [];
    spel.troférum ??= [];
    spel.rivaliteter ??= {};
    spel.huvudnyhet ??= null;
    spel.stall.forEach((h) => { h.dagbok ??= []; });
    /* v60: storloppsbågen och avelshagen. */
    spel.avelsston ??= [];
    spel.bågeSkrivet ??= {};
    spel.båge ??= null;
    /* v61: scenkön. Serialiserbar; en halvläst scen överlever omstart. */
    spel.scener ??= [];
    /* v62: personalens karriärer och ägarrelationerna. */
    spel.tidigareFörstamän ??= [];
    spel.ägarrelationer ??= {};
    /* v63: rekordtavlan, hall of fame och säsongskrönikorna. */
    spel.rekord ??= {};
    spel.hallOfFame ??= [];
    /* v65: minnesloppet. Mentorer i äldre sparfiler saknar borta-flaggan
       — den lämnas odefinierad, vilket betyder att hen lever. */
    spel.minneslopp ??= null;
    /* v73: tränarnamnet. Äldre karriärer får det tomt — ligan visar då
       "du" som förr, och namnet kan aldrig krocka med något. */
    spel.tränarnamn ??= null;
    if (spel.förstaman) {
      spel.förstaman.ambition ??= 20;
      spel.förstaman.säsongerHosDig ??= Math.max(0, (spel.säsong ?? 1) - 1);
    }
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
    /* KLICKVAKTEN (v114, Teds knapp som "inte gick att trycka på"):
       kastar mutationen får det ALDRIG bli tyst. Sparning och
       omritning körs ändå, och felet kastas om asynkront så den
       globala felbannern garanterat visar rad och meddelande. */
    let klickfel = null;
    if (fn) { try { fn(ref.current); } catch (e) { klickfel = e; } }
    spara(ref.current);
    sättVersion((v) => v + 1);
    if (klickfel) setTimeout(() => { throw klickfel; }, 0);
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
