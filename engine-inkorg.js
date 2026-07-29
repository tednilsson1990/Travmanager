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
import { stoppFör } from "./engine-klocka.js";
import { träningsråd } from "./engine-forstaman.js";
import { säkraKarriär, nästaMilstolpe } from "./engine-minnen.js";
import { veckansGenomgång } from "./engine-veckomote.js";

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

  /* ---- VECKOMÖTET (v105, 20.4): förstamannens genomgång är veckans
     FÄSTA första rapport — ekonomi, form, starter, sponsorer, problem
     i hans egen röst. Långtexten är byggd för förhand och helskärm. ---- */
  const genomgång = fm ? veckansGenomgång(spel) : null;
  if (genomgång) {
    lägg({ avsändare: fmNamn, typ: "rapport", prioritet: "info", fäst: true, ...genomgång, flik: "stall" });
  }

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

  /* ---- Ekonomin → egen rapport BARA när det är akut beslut (kassan
     täcker inte en månad) eller när förstaman saknas — annars bär
     genomgången siffrorna (v105: en sak sägs på ett ställe). ---- */
  const netto = veckonetto(spel);
  if (netto.netto < 0 && (!genomgång || (spel.kassa ?? 0) < -netto.netto * 4)) {
    lägg({
      avsändare: "Kontoret", typ: "rapport",
      prioritet: (spel.kassa ?? 0) < -netto.netto * 4 ? "beslut" : "info",
      rubrik: `Veckonettot: −${kr(-netto.netto)} kr`,
      text: `Kostnaderna överstiger intäkterna med ${kr(-netto.netto)} kr i veckan. Kassan: ${kr(spel.kassa ?? 0)} kr.`,
      flik: "kontor",
    });
  }

  /* ---- Sponsorn → telefonsamtal när ett avtal hänger löst. (v105-
     lagning: läser spel.sponsorer — ARRAYEN spelet faktiskt använder.
     Singularfältet i v99 fanns bara i provfixturen; notisen har aldrig
     kunnat avfyras i riktigt spel. Provet avslöjade det.) ---- */
  (spel.sponsorer ?? []).forEach((avtal) => {
    if (avtal.krav && avtal.veckorKvar !== undefined && avtal.veckorKvar <= 3) {
      lägg({
        avsändare: avtal.namn, typ: "samtal", prioritet: "beslut",
        rubrik: "Avtalet löper ut",
        text: `${avtal.veckorKvar} ${avtal.veckorKvar === 1 ? "vecka" : "veckor"} kvar på avtalet med ${avtal.namn}. Utvärderingen väger era resultat: ${avtal.krav.nu ?? 0} av ${avtal.krav.mål} (${avtal.krav.text}).`,
        flik: "kontor",
      });
    }
  });

  /* ---- Milstolpen som närmar sig (v104, 20.2): förstamannen håller
     räkningen — bara när nästa seger ÄR siffran, och bara med
     startklara hästar i stallet. ---- */
  {
    const karriär = säkraKarriär(spel);
    const stolpe = nästaMilstolpe(karriär.segrar);
    if (karriär.segrar + 1 === stolpe && stolpe >= 10 && startbara.length > 0) {
      lägg({
        avsändare: fmNamn, typ: "sms", prioritet: "info",
        rubrik: `Nästa seger är den ${stolpe}:e`,
        text: `»Jag räknade i går kväll. Nästa gång vi vinner är det stallets ${stolpe}:e seger. Bara så du vet vad som står på spel i veckan.«`,
        flik: "lopp",
      });
    }
  }

  /* ---- Klockans stoppnotiser (v101, 20.1): onsdagens besked och
     helgens loppdag som händelser — inkorgen känner veckans rytm. ---- */
  const stopp = stoppFör(spel);
  const obesvarade = (spel.anmälningar ?? []).filter((a) => !a.status).length;
  if (stopp === "onsdag" && obesvarade > 0) {
    lägg({
      avsändare: "Arrangörerna", typ: "mejl", prioritet: "beslut",
      rubrik: `Uttagningsbeskeden har kommit (${obesvarade})`,
      text: "Kom hästen med? Öppna loppfliken och ta beskeden — bekräfta, byt lopp eller avstå.",
      flik: "lopp",
    });
  }
  const helgstarter = (spel.anmälningar ?? []).filter((a) => a.status === "med"
    && !(spel.startadeLopp ?? []).includes(a.loppId));
  if (stopp === "helg" && helgstarter.length > 0) {
    lägg({
      avsändare: fmNamn, typ: "sms", prioritet: "rekommendation",
      rubrik: `Loppdag — ${helgstarter.length} ${helgstarter.length === 1 ? "start" : "starter"} i helgen`,
      text: `»${helgstarter.map((a) => spel.stall.find((h) => h.id === a.hästId)?.namn).filter(Boolean).join(" och ")} är klara. Selarna hänger framme.«`,
      flik: "lopp",
    });
  }

  /* ---- Travbladet → veckans nyheter (senaste tre pressnotiserna). ---- */
  (spel.press ?? []).slice(0, 3).forEach((n) => {
    lägg({
      avsändare: "Travbladet", typ: "nyhet", prioritet: "info",
      rubrik: n.rubrik, text: n.byline ?? "", flik: "sfar",
    });
  });

  /* ---- STORYN IN I INKORGEN (v103, Teds riktning): huvudnyheten som
     stort urklipp med lång text för helskärmsläsning, och följetongens
     trådar som notiser. Sfären behåller sina — "också", inte "i
     stället". ---- */
  const stor = spel.huvudnyhet;
  if (stor && stor.säsong === (spel.säsong ?? 1) && spel.vecka - stor.vecka <= 1) {
    lägg({
      avsändare: "Travbladet", typ: "nyhet", prioritet: "info",
      etikett: stor.etikett, rubrik: stor.rubrik, text: stor.ingress,
      lång: [stor.ingress, stor.brödtext, stor.citat ? `»${stor.citat}«` : null]
        .filter(Boolean).join("\n\n"),
      flik: "sfar",
    });
  }
  berättelsetrådar(spel).slice(0, 2).forEach((t) => {
    lägg({
      avsändare: "Travbladet", typ: "nyhet", prioritet: "info",
      etikett: "Följetongen", rubrik: t.rubrik, text: t.text, flik: "sfar",
    });
  });

  return händelser.sort((a, b) =>
    (b.fäst ? 1 : 0) - (a.fäst ? 1 : 0)
    || PRIORITETSORDNING[a.prioritet] - PRIORITETSORDNING[b.prioritet]);
}

/**
 * FÖLJETONGENS TRÅDAR (v103): samma läsning som Sfärens "Pågående
 * berättelser" — tillstånd andra motorer äger, aldrig något eget.
 * Delad källa så inkorgen och Sfären aldrig berättar olika.
 */
export function berättelsetrådar(spel) {
  const trådar = [];
  if (spel.båge?.lopp) trådar.push({ rubrik: "Satsningen",
    text: `${spel.båge.lopp} om ${spel.båge.veckorKvar} ${spel.båge.veckorKvar === 1 ? "vecka" : "veckor"} — hela stallet vet vad som gäller.` });
  const comeback = (spel.stall ?? []).find((h) => h.skadenyhet && h.skada > 0);
  if (comeback) trådar.push({ rubrik: "Comebacken",
    text: `${comeback.namn} åter i träning om ${comeback.skada} ${comeback.skada === 1 ? "vecka" : "veckor"}. Frågan är vilken häst som kommer tillbaka.` });
  const svacka = (spel.stall ?? []).find((h) => h.svackafråga);
  if (svacka) trådar.push({ rubrik: "Frågetecknet",
    text: `Vad är det med ${svacka.namn}? Formen pekar nedåt och ingen i stallet har svaret ännu.` });
  if ((spel.förstaman?.ambition ?? 0) >= 70 && !spel.förstaman.delägare)
    trådar.push({ rubrik: "Förstamannens framtid",
      text: `${spel.förstaman.namn.split(" ")[0]} funderar. Ambitionen är större än rollen — frågan är vad som händer härnäst.` });
  const tf = (spel.tidigareFörstamän ?? []).find((f) => !f.segerMotDig && f.mötenMotDig > 0);
  if (tf) trådar.push({ rubrik: "Eleven jagar",
    text: `${tf.namn} har mött dig ${tf.mötenMotDig} ${tf.mötenMotDig === 1 ? "gång" : "gånger"} — och ännu inte vunnit. Alla vet vad den segern skulle betyda.` });
  return trådar;
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
