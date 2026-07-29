/**
 * AI-TRÄNARNAS LOPPVAL (v95, tävlingsmanualen kap 12 — etapp D)
 *
 * Världens tränare slutar vara statister: varje stall väljer lopp åt
 * sina hästar med VIKTAD NYTTA — vinstchans, prispengar, utveckling,
 * försiktighet — färgad av profilens SYNFEL: en systematisk, per
 * tränare-och-häst stabil över- eller undervärdering av den egna
 * hästen. Ofullständig information och rimliga misstag är modellens
 * mening: "jagar prispengar"-stallet anmäler sin stjärna ett snäpp för
 * högt, "tålmodig" tackar nej till loppet som skulle lyfta hästen ur
 * en gynnsam klass (klassklättringsmedvetenheten läser SAMMA funktion
 * som spelarens varning).
 *
 * VECKANS ANMÄLNINGSKARTA är EN sanning för hela spelet: samma
 * deterministiska karta (seedad ur veckan, hash-styrda val) driver både
 * spelarens uttagning (engine-anmalan läser den) och världens vecka
 * (körVärldensVecka kör loppen med den). Hästen du slogs ut av i
 * uttagningen finns alltså på riktigt i det loppet när världen körs —
 * och en struken AI-häst omplaceras inte, den vilar, precis som i
 * verkligheten.
 *
 * GRÄNSERNA: ingen kontakt med loppmotorn (skattningen läser hästens
 * blad, aldrig simuleringen), och kalibreringen använder byggFält som
 * är orörd.
 */
import { klamp } from "./engine-util.js";
import { veckansLopp, startförbud } from "./data-kalender.js";
import { FILOSOFIER } from "./engine-varld.js";
import { klassklättring, startpoäng } from "./engine-proposition.js";

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/**
 * Tränarens skattning av hästens chans i ett lopp — mot loppets nivå,
 * med profilens synfel: stabilt per tränare och häst (samma hash), så
 * en övervärderad stjärna förblir övervärderad. Det är så riktiga
 * felbedömningar ser ut — inte brus, utan övertygelse.
 */
export function skattaChans(häst, lopp, stall) {
  const fil = stall?.filosofi ?? FILOSOFIER[0];
  const kapacitet = (häst.start + häst.fart + häst.styrka) / 3 * 0.55 + häst.form * 0.45;
  const bias = ((hash(`${stall?.id ?? "x"}:${häst.id}:syn`) % 21) - 10) / 10 * fil.synfel;
  const övertag = kapacitet + bias - lopp.nivå;
  return klamp(0.5 + övertag / 40, 0.03, 0.95);
}

/** Nyttan av ett lopp för en häst, genom tränarens ögon. */
export function loppnytta(häst, lopp, stall) {
  const fil = stall?.filosofi ?? FILOSOFIER[0];
  const v = fil.vikt ?? { vinst: 0.4, pengar: 0.3, utveckling: 0.1, försiktighet: 0.2 };
  const chans = skattaChans(häst, lopp, stall);
  const pengar = Math.min(1, lopp.pris[0] / 90000) * chans;
  /* Utvecklingen: att möta något hårdare bygger hästen — men bara ett
     snäpp; tio nivåer över är stryk, inte skola. */
  const kapacitet = (häst.start + häst.fart + häst.styrka) / 3 * 0.55 + häst.form * 0.45;
  const steg = lopp.nivå - kapacitet;
  const utveckling = steg > 0 && steg < 9 ? 0.6 : 0;
  /* Försiktigheten: klättringsrisken väger bara när chansen är verklig
     — man oroar sig inte för segerns konsekvenser i ett lopp man inte
     kan vinna. Samma funktion som spelarens varning läser. */
  const klättring = klassklättring(häst, lopp).stängs.length > 0 ? chans * 0.7 : 0;
  return v.vinst * chans + v.pengar * pengar + v.utveckling * utveckling - v.försiktighet * klättring;
}

/**
 * VECKANS ANMÄLNINGSKARTA: loppId → världshästarna som anmält sig.
 * Deterministisk för en given vecka — tillgänglighetens slump seedas ur
 * veckan (spelets övriga slumpflöde lämnas orört), loppvalen är rena
 * hash- och nyttoberäkningar. Varje häst väljer högst ETT lopp; den som
 * inte hittar något värt startar inte den veckan. Kartan är REN hash —
 * ingen slump alls — och därmed identisk före och efter spelarens lopp
 * (bortsett från hästar spelarens lopp förbrukat), vilket är hela
 * konsistenslöftet.
 */
export function veckansAnmälningar(spel) {
  const värld = spel.värld;
  const vecka = spel.vecka;
  const karta = new Map();
  if (!värld) return karta;
  const lopp = veckansLopp(vecka);
  lopp.forEach((l) => karta.set(l.id, []));
  värld.hästar.forEach((h) => {
    /* v107: ingen filtrering på senasteStartVecka === vecka — anmälan
       skedde i början av veckan, och kartan måste vara STABIL över
       spelarens körningar (avdelning 2:s fält ska vara identiskt med
       onsdagens besked även efter att avdelning 1 körts).
       Dubbelstartsskyddet bor i körVärldensVecka. */
    if (h.skada > 0) return;
    const stall = värld.stall.find((s) => s.id === h.stallId);
    const fil = stall?.filosofi ?? FILOSOFIER[0];
    if (h.energi < fil.vilaTröskel) return;
    /* Startviljan: deterministisk per häst och vecka i stället för
       tärning — kartan är ett faktum, inte ett kast. */
    const veckorSedan = vecka - (h.senasteStartVecka || 0);
    const vilja = fil.startvilja * (veckorSedan < 2 ? 0.35 : 1);
    if (hash(`${h.id}:${vecka}:vilja`) % 100 >= vilja * 100) return;
    /* Loppvalet: nyttogolv så att ingen anmäler av gammal vana — och
       SPRIDNING i stället för strikt argmax: alla lopp inom femton
       procent av toppnyttan är kandidater, och hash väljer bland dem.
       Riktiga tränare vet inte vilka fält som fylls; strikt argmax
       flockade alla till samma lopp (22 anmälda till ett, var tredje
       lopp inställt i första kalibreringen). */
    const kandidater = [];
    let toppNytta = 0;
    lopp.forEach((l) => {
      if (startförbud(h, l)) return;
      const n = loppnytta(h, l, stall);
      if (n >= 0.10) { kandidater.push({ l, n }); toppNytta = Math.max(toppNytta, n); }
    });
    const nära = kandidater.filter((k) => k.n >= toppNytta * 0.85);
    if (nära.length) {
      const val = nära[hash(`${h.id}:${vecka}:val`) % nära.length];
      karta.get(val.l.id).push(h);
    }
  });
  return karta;
}

/**
 * Uttagningen för ett världslopp — samma poängregler som spelarens
 * (engine-anmalan äger reglerna för spelarens lopp; det här är samma
 * sortering för världens): startpoäng, klassmeriter som skiljenyckel.
 */
export function taUtVärldsfält(anmälda, lopp) {
  return [...anmälda]
    .sort((a, b) => startpoäng(b).poäng - startpoäng(a).poäng
      || (b.intjänat ?? 0) - (a.intjänat ?? 0))
    .slice(0, lopp.startande);
}
