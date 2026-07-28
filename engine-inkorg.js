/**
 * INKORGEN (v99, utvecklingsplanen kap 19 — etapp A, Teds dokument)
 *
 * Teds kärninsikt ur Football Manager: inkorgen är inte en funktion
 * utan SPELETS MOTOR — nästan varje beslut börjar där, nästan varje
 * system kommunicerar genom den. Den här modulen är händelseformatet
 * och adaptrarna; den ERSÄTTER inga motorer utan blir deras gemensamma
 * postlåda.
 *
 * HÄNDELSEFORMATET (19.1):
 *   { id, avsändare, typ, prioritet, rubrik, text, flik }
 *   typ:       "sms" | "samtal" | "mejl" | "rapport" | "nyhet"
 *   prioritet: "beslut" | "rekommendation" | "info"  (dokumentets tre
 *              nivåer — spelaren ska snabbt se vad som är viktigt)
 *   flik:      genvägen. Inkorgen är ALDRIG en återvändsgränd — varje
 *              händelse pekar på vyn där man agerar.
 *
 * DERIVATION, INTE DUBBELLAGRING: veckans inkorg härleds ur spelets
 * tillstånd varje gång den efterfrågas — samma spel ger samma händelser
 * med samma id:n (stabil innehållshash), så lästmarkeringarna i
 * spel.inkorgLästa överlever omrendering utan att sparfilen växer.
 * Historiken (19.4, karriärdagboken) är etapp D och får sin egen,
 * komprimerade lagring då.
 *
 * KÄLLORNA är befintliga motorer, rent lästa:
 *   vägvisaren      → förstamannens sms (rekommendationer, akuta beslut)
 *   propositionerna → arrangörens mejl (lopp som passar, via loppläge)
 *   pressen         → Travbladets nyheter (genväg till Sfären)
 *   veterinären     → skaderapporter
 *   ekonomin        → veckonettot som rapport när det lutar fel
 *   sponsorn        → telefonsamtal när avtalet hänger löst
 */
import { nästaSteg, veckonetto } from "./engine-vagvisare.js";
import { loppläge, bedömningsnivå } from "./engine-proposition.js";
import { veckansLopp } from "./data-kalender.js";
import { kr } from "./engine-util.js";
import { teckna, tackaNej } from "./engine-sponsor.js";
import { träningsråd } from "./engine-forstaman.js";

/** Stabil innehållshash — lästmarkeringens ankare. */
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

const PRIORITETSORDNING = { beslut: 0, rekommendation: 1, info: 2 };

/**
 * Veckans inkorg, sorterad beslut → rekommendation → info och därefter
 * i källordning. Ren funktion av spelet.
 */
export function byggInkorg(spel) {
  const händelser = [];
  const lägg = (h) => händelser.push({ ...h, id: hash(`${spel.säsong ?? 1}:${spel.vecka}:${h.avsändare}:${h.rubrik}`) });
  const fm = spel.förstaman;
  const fmNamn = fm ? fm.namn.split(" ")[0] : "Stallet";

  /* ---- Vägvisaren → förstamannens sms. Akut ton = beslut krävs.
     Rader som blivit RIKTIGA beslutshändelser nedan (sponsorerbjudandet,
     träningsjusteringen) filtreras bort här — en fråga ska aldrig
     ställas två gånger i samma inkorg. ---- */
  nästaSteg(spel).forEach((rad) => {
    if (rad.text.includes("vill sponsra") || rad.text.includes("vill ändra träningen")) return;
    lägg({
      avsändare: fmNamn, typ: "sms",
      prioritet: rad.akut ? "beslut" : rad.ton === "gul" ? "rekommendation" : "info",
      rubrik: rad.text.split(":")[0].split("—")[0].trim(),
      text: rad.text, flik: rad.flik ?? "hem",
    });
  });

  /* ---- SPONSORERBJUDANDET → telefonsamtal med beslutet I inkorgen
     (v100, Teds princip: agera i notisen, inte länkas vidare). Samma
     teckna/tackaNej som Kontoret använder — ett beslut, en mutation. ---- */
  (spel.sponsorerbjudanden ?? []).forEach((e) => {
    lägg({
      avsändare: e.namn, typ: "samtal", prioritet: "beslut",
      rubrik: `Vill sponsra stallet — svar senast v ${e.gällerTill}`,
      text: `${e.typnamn}. »Vi tror på det ni bygger. Här är vårt bud.«`,
      flik: "kontor",
      detaljer: [
        { namn: "Ersättning", värde: `${kr(e.perVecka)} kr/v + ${kr(e.segerbonus)} kr/seger` },
        ...(e.förmån ? [{ namn: "Förmån", värde: e.förmån.text }] : []),
        { namn: "Kravet", värde: e.krav.text },
      ],
      beslut: { typ: "sponsorerbjudande", ref: { namn: e.namn, typId: e.typId },
        alternativ: [{ id: "ja", etikett: "Skriv på" }, { id: "nej", etikett: "Tacka nej", sekundär: true }] },
    });
  });

  /* ---- TRÄNINGSJUSTERINGEN → förstamannens sms med beslutet i raden:
     godkänn alla råd med ett tryck, eller behåll din plan (frågan
     återkommer först nästa vecka — nytt id, ny fråga, inget tjat). ---- */
  if (fm) {
    const avvikande = (spel.stall ?? []).filter((h) => h.skada === 0
      && h.träning !== träningsråd(fm, h).träning);
    if (avvikande.length > 0) {
      lägg({
        avsändare: fmNamn, typ: "sms", prioritet: "beslut",
        rubrik: `Vill ändra träningen för ${avvikande.length} ${avvikande.length === 1 ? "häst" : "hästar"}`,
        text: `»${avvikande.map((h) => `${h.namn}: ${h.träning} → ${träningsråd(fm, h).träning}`).join(" · ")}. Säger du ja lägger jag om från i dag.«`,
        flik: "stall",
        beslut: { typ: "träningsjustering", ref: null,
          alternativ: [{ id: "godkänn", etikett: "Lägg om enligt råden" }, { id: "behåll", etikett: "Behåll min plan", sekundär: true }] },
      });
    }
  }

  /* ---- Propositionerna → arrangörens mejl (dokumentets exempel:
     "Tre propositioner passar dina hästar"). Räknas med samma
     loppläge som anmälans väljare — inkorgen kan inte lova mer än
     loppfliken håller. ---- */
  const nivå = bedömningsnivå(spel);
  const startbara = (spel.stall ?? []).filter((h) => h.skada === 0 && h.senasteStartVecka !== spel.vecka);
  if (startbara.length > 0) {
    const veckans = veckansLopp(spel.vecka);
    const passande = new Set();
    startbara.forEach((h) => veckans.forEach((l) => {
      const st = loppläge(h, l, nivå).status;
      if (st === "rekommenderad" || (nivå === 0 && st === "möjlig")) passande.add(l.id);
    }));
    if (passande.size > 0) {
      lägg({
        avsändare: "Arrangörerna", typ: "mejl", prioritet: "rekommendation",
        rubrik: `${passande.size === 1 ? "En proposition" : `${passande.size} propositioner`} passar stallet`,
        text: `Veckans lopplista har ${passande.size === 1 ? "ett lopp" : `${passande.size} lopp`} där dina hästar ligger rätt i klassen. Anmälningarna är öppna.`,
        flik: "lopp",
      });
    }
  }

  /* ---- Veterinären → skaderapport per skadad häst. ---- */
  (spel.stall ?? []).filter((h) => h.skada > 0).forEach((h) => {
    lägg({
      avsändare: "Veterinären", typ: "rapport", prioritet: "info",
      rubrik: `${h.namn}: ${h.skada} ${h.skada === 1 ? "vecka" : "veckor"} kvar`,
      text: `Läkningen följer plan. ${h.namn} bör vara i full träning om ${h.skada} ${h.skada === 1 ? "vecka" : "veckor"}.`,
      flik: "stall",
    });
  });

  /* ---- Ekonomin → rapport när nettot lutar fel. ---- */
  const netto = veckonetto(spel);
  if (netto.netto < 0) {
    lägg({
      avsändare: "Kontoret", typ: "rapport",
      prioritet: (spel.kassa ?? 0) < -netto.netto * 4 ? "beslut" : "info",
      rubrik: `Veckonettot: −${kr(-netto.netto)} kr`,
      text: `Kostnaderna överstiger intäkterna med ${kr(-netto.netto)} kr i veckan. Kassan: ${kr(spel.kassa ?? 0)} kr.`,
      flik: "kontor",
    });
  }

  /* ---- Sponsorn → telefonsamtal när avtalet hänger löst. ---- */
  if (spel.sponsor?.krav && spel.sponsor.veckorKvar <= 3) {
    lägg({
      avsändare: spel.sponsor.namn ?? "Sponsorn", typ: "samtal", prioritet: "beslut",
      rubrik: "Avtalet löper ut",
      text: `${spel.sponsor.veckorKvar} ${spel.sponsor.veckorKvar === 1 ? "vecka" : "veckor"} kvar på sponsoravtalet. Utvärderingen väger era resultat.`,
      flik: "kontor",
    });
  }

  /* ---- Travbladet → veckans nyheter (senaste tre pressnotiserna). ---- */
  (spel.press ?? []).slice(0, 3).forEach((n) => {
    lägg({
      avsändare: "Travbladet", typ: "nyhet", prioritet: "info",
      rubrik: n.rubrik, text: n.byline ?? "", flik: "sfar",
    });
  });

  return händelser.sort((a, b) =>
    PRIORITETSORDNING[a.prioritet] - PRIORITETSORDNING[b.prioritet]);
}

/**
 * VERKSTÄLL ETT BESLUT (v100): muterar spelet med SAMMA funktioner som
 * vyerna använder — inkorgen är en dörr till motorerna, aldrig en egen
 * regeluppsättning. Besvarade händelser antecknas i spel.inkorgBeslutade
 * så frågan inte tjatar; id:t bär veckan, så en kvarstående fråga
 * återkommer naturligt nästa vecka.
 */
export function verkställBeslut(spel, händelse, valId) {
  const b = händelse.beslut;
  if (!b) return;
  if (b.typ === "sponsorerbjudande") {
    const mål = (spel.sponsorerbjudanden ?? []).find((e) =>
      e.namn === b.ref.namn && e.typId === b.ref.typId);
    if (mål) (valId === "ja" ? teckna : tackaNej)(spel, mål);
  }
  if (b.typ === "träningsjustering" && valId === "godkänn" && spel.förstaman) {
    spel.stall.forEach((h) => {
      if (h.skada === 0) h.träning = träningsråd(spel.förstaman, h).träning;
    });
  }
  spel.inkorgBeslutade = [...(spel.inkorgBeslutade ?? []), händelse.id].slice(-60);
  spel.inkorgLästa = [...new Set([...(spel.inkorgLästa ?? []), händelse.id])].slice(-120);
}

/** Inkorgen som visas: besvarade beslut filtrerade. */
export function synligInkorg(spel) {
  const beslutade = new Set(spel.inkorgBeslutade ?? []);
  return byggInkorg(spel).filter((h) => !beslutade.has(h.id));
}

/** Olästa händelser — och hur många som kräver beslut. */
export function inkorgsläge(spel) {
  const lästa = new Set(spel.inkorgLästa ?? []);
  const olästa = synligInkorg(spel).filter((h) => !lästa.has(h.id));
  return { antal: olästa.length, beslut: olästa.filter((h) => h.prioritet === "beslut").length };
}
