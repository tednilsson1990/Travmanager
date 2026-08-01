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
import { teckna, tackaNej, kravläge } from "./engine-sponsor.js";
import { stoppFör } from "./engine-klocka.js";
import { träningsråd } from "./engine-forstaman.js";
import { säkraKarriär, nästaMilstolpe } from "./engine-minnen.js";
import { skrivPress } from "./engine-vecka.js";
import { klamp } from "./engine-util.js";
import { veckansGenomgång } from "./engine-veckomote.js";
import { ägartyp, ägarKontakt } from "./engine-agare.js";
import { KUSKAR, relation as kuskrelation } from "./data-kuskar.js";

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
    lägg({ avsändare: fmNamn, roll: "Förstaman", typ: "rapport", prioritet: "info", fäst: true, ...genomgång, flik: "stall" });
  }

  /* ---- Vägvisaren → förstamannens sms. Akut ton = beslut krävs.
     Rader som blivit RIKTIGA beslutshändelser nedan (sponsorerbjudandet,
     träningsjusteringen) filtreras bort här — en fråga ska aldrig
     ställas två gånger i samma inkorg. ---- */
  nästaSteg(spel).forEach((rad) => {
    if (rad.text.includes("vill sponsra") || rad.text.includes("vill ändra träningen")) return;
    lägg({
      avsändare: fmNamn, roll: "Förstaman", typ: "sms",
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
      avsändare: e.namn, roll: "Sponsorbud", typ: "samtal", prioritet: "beslut",
      rubrik: `Vill sponsra stallet — svar senast v ${e.gällerTill}`,
      text: `${e.typnamn}. »Vi tror på det ni bygger. Här är vårt bud.«`,
      lång: `— Hej, det är ${e.namn}. Har du en minut?\n— Vi har följt stallet ett tag nu. Sättet ni jobbar på — det är sånt vi vill synas ihop med.\n— Budet är enkelt: ${e.typnamn.toLowerCase()}. Siffrorna står i avtalet nedanför.\n— Kravet från vår sida: ${e.krav.text}. Inget konstigt, men vi menar allvar med det.\n— Fundera inte för länge bara. Erbjudandet står till vecka ${e.gällerTill}.`,
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
        avsändare: fmNamn, roll: "Förstaman", typ: "sms", prioritet: "beslut",
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
        avsändare: "Arrangörerna", roll: "Tävlingsledningen", typ: "mejl", prioritet: "rekommendation",
        rubrik: `${passande.size === 1 ? "En proposition" : `${passande.size} propositioner`} passar stallet`,
        text: `Veckans lopplista har ${passande.size === 1 ? "ett lopp" : `${passande.size} lopp`} där dina hästar ligger rätt i klassen.`,
        lång: `Hej ${spel.stallnamn ?? "tränaren"},\n\nVeckans propositioner är publicerade, och vid en genomgång ser vi ${passande.size === 1 ? "ett lopp" : `${passande.size} lopp`} där ${passande.size === 1 ? "en av era hästar ligger" : "era hästar ligger"} rätt i klassen. Anmälningstiden går ut i och med måndagens slut — anmälan är kostnadsfri och besked om uttagning lämnas under onsdagen.\n\nVälkomna med er anmälan.\n\nMed vänlig hälsning,\nTävlingsledningen`,
        flik: "lopp",
      });
    }
  }

  /* ---- Veterinären → skaderapport per skadad häst. ---- */
  (spel.stall ?? []).filter((h) => h.skada > 0).forEach((h) => {
    lägg({
      avsändare: "Veterinären", roll: "Stallveterinär", typ: "rapport",
      prioritet: h.skada === 1 ? "beslut" : "info",
      rubrik: `${h.namn}: ${h.skada} ${h.skada === 1 ? "vecka" : "veckor"} kvar`,
      text: `Läkningen följer plan. Åter i full träning om ${h.skada} ${h.skada === 1 ? "vecka" : "veckor"}.`,
      lång: `VETERINÄRRAPPORT · ${h.namn}\n\nSTATUS\nLäkningen följer plan. Hästen är pigg i boxen och rör sig utan besvär i skritt.\n\nBEDÖMNING\nÅter i full träning om ${h.skada} ${h.skada === 1 ? "vecka" : "veckor"}. Vävnaden behöver den tiden — att stressa läkning är att låna av nästa skada.${h.skada === 1 ? "\n\nREKOMMENDATION\nSista veckan. Ni kan släppa på tyglarna enligt plan — eller ge en extra vecka och få tillbaka en mer utvilad häst. Ert beslut." : ""}`,
      detaljer: [
        { namn: "Vila kvar", värde: `${h.skada} ${h.skada === 1 ? "vecka" : "veckor"}` },
        { namn: "Form vid skadan", värde: `${h.form ?? "–"}` },
      ],
      ...(h.skada === 1 ? { beslut: { typ: "vila", ref: h.id, alternativ: [
        { id: "plan", etikett: "Följ planen — åter nästa vecka" },
        { id: "extra", etikett: "En vecka extra vila", sekundär: true },
      ] } } : {}),
      flik: "stall",
    });
  });

  /* ---- Ekonomin → egen rapport BARA när det är akut beslut (kassan
     täcker inte en månad) eller när förstaman saknas — annars bär
     genomgången siffrorna (v105: en sak sägs på ett ställe). ---- */
  const netto = veckonetto(spel);
  if (netto.netto < 0 && (!genomgång || (spel.kassa ?? 0) < -netto.netto * 4)) {
    lägg({
      avsändare: "Kontoret", roll: "Ekonomin", typ: "rapport",
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
    /* v113-lagning (Teds spelrapport: "gjort massor lopp men notisen
       säger inget kört"): framsteget bor i avtal.status via kravläge()
       — inte i krav.nu, som aldrig funnits. Och avtalen är säsongs-
       bundna: veckorna kvar räknas ur säsongen. */
    if (!avtal.krav) return;
    const veckorKvar = Math.max(0, (spel.veckor ?? 18) - spel.vecka + 1);
    const läge = kravläge(avtal);
    if (veckorKvar <= 3 && !läge.klar) {
      lägg({
        avsändare: avtal.namn, roll: "Sponsor", typ: "samtal", prioritet: "beslut",
        rubrik: "Utvärderingen närmar sig",
        text: `${veckorKvar} ${veckorKvar === 1 ? "vecka" : "veckor"} kvar av säsongen. Kravet: ${läge.text} — läget är ${läge.nu} av ${läge.mål}.`,
        flik: "kontor",
      });
    }
  });

  /* ---- SKÖTARENS SMS (v108, Teds riktning: story med personalen och
     riktiga dialoger). En röst från stallgången varje vecka — hash-vald
     häst, text ur hästens verkliga läge, och ibland ett litet val som
     känns som stallvardag: "ska jag ge henne en lugn dag?" ---- */
  if ((spel.stall ?? []).length > 0) {
    const skötare = spel.skötare?.namn ?? "Skötaren";
    const veckoHash = hash(`skötare:${spel.säsong ?? 1}:${spel.vecka}`);
    const friska2 = (spel.stall ?? []).filter((h) => h.skada === 0);
    const h = friska2[parseInt(veckoHash, 36) % Math.max(1, friska2.length)] ?? spel.stall[0];
    if (h) {
      const trött = (h.energi ?? 70) < 45;
      const pigg = (h.form ?? 50) >= 68;
      lägg({
        avsändare: skötare.split(" ")[0], roll: "Hästskötare", typ: "sms",
        prioritet: trött ? "beslut" : "info",
        rubrik: trött ? `${h.namn} känns sliten` : pigg ? `${h.namn} sprudlar` : `Läget i stallgången`,
        text: trött
          ? `${h.namn} åt inte upp i går kväll och hängde lite med huvudet i morse. Inte sjuk — bara sliten, tror jag. Ska jag ge hen en riktigt lugn dag i hagen?`
          : pigg
            ? `Du skulle sett ${h.namn} i morse. Drog i linorna redan i stallgången och ville MER hela passet. Hen är på gång, känner jag.`
            : `Allt lugnt härute. ${h.namn} skötte sitt, åt bra och står och halvsover i boxen nu. Ibland är ingenting det bästa nyheterna.`,
        ...(trött ? { beslut: { typ: "skötardag", ref: h.id, alternativ: [
          { id: "ja", etikett: "Ja — lugn dag i hagen" },
          { id: "nej", etikett: "Nej, håll planen", sekundär: true },
        ] } } : {}),
        flik: "stall",
      });
    }
  }

  /* ---- EFTERANALYSEN I INKORGEN (v113, Teds önskan: "saknar analys
     efter loppet i inkorgen, samt chans att uttala sig"). En rapport
     per start förra veckan, med förstamannens avgörande och läxa —
     och UTTALANDET som beslut: tre toner formulerade ur utfallet
     ("föll som favorit — svårt att vinna från det läget", "trea —
     bra prestation för klassen"). Uttalandet blir en pressnotis med
     din signatur och en liten hypeeffekt. ---- */
  (spel.senasteAnalyser ?? [])
    .filter((a) => a.vecka === spel.vecka - 1 && a.säsong === (spel.säsong ?? 1))
    .forEach((a) => {
      const utfall = a.ur ? "bortkörd"
        : a.plats === 1 ? "seger"
        : a.varFavorit && (a.plats ?? 9) > 3 ? "favoritfall"
        : (a.plats ?? 9) <= 3 ? "pall" : "mitt";
      const lägesord = a.läge === "dödens" ? " från dödens" : a.läge === "ledningen" ? " från ledningen" : "";
      const alternativ = {
        seger: [
          { id: "lyft", etikett: `»${a.hästNamn} är på väg mot något stort«` },
          { id: "lugn", etikett: "»Vi tar ett lopp i taget«", sekundär: true },
        ],
        favoritfall: [
          { id: "läget", etikett: `»Svårt att vinna${lägesord || " från det läget"}«` },
          { id: "ansvar", etikett: "»Det här ska vi göra bättre — mitt ansvar«", sekundär: true },
        ],
        pall: [
          { id: "klass", etikett: "»Bra prestation för den här klassen«" },
          { id: "mer", etikett: "»Det finns mer att hämta«", sekundär: true },
        ],
        bortkörd: [
          { id: "hästen", etikett: `»Sånt händer — ${a.hästNamn} är bättre än så här«` },
          { id: "tyst", etikett: "Avstå från kommentar", sekundär: true },
        ],
        mitt: [
          { id: "nykter", etikett: "»Ungefär där vi står just nu«" },
          { id: "mer", etikett: "»Det finns mer att hämta«", sekundär: true },
        ],
      }[utfall];
      lägg({
        avsändare: fmNamn, roll: "Förstaman", typ: "rapport",
        prioritet: a.uttalad ? "info" : "rekommendation",
        rubrik: `Efteranalysen: ${a.hästNamn} i ${a.lopp}`,
        text: a.avgörande ?? (a.ur ? "Bortkörd — loppet fick aldrig ett slut för vår del." : `${a.plats}:a av fältet.`),
        lång: [
          `EFTERANALYS · ${a.hästNamn} · ${a.lopp}`,
          `UTFALLET\n${a.ur ? "Bortkörd." : `Plats ${a.plats}.`}${a.varFavorit ? " Loppets mest spelade häst." : ""}${a.läge ? ` Resan: ${a.läge}.` : ""}`,
          a.avgörande ? `AVGÖRANDET\n${a.avgörande}` : null,
          a.läxa ? `LÄXAN\n${a.läxa}` : null,
          !a.uttalad ? `PRESSEN VÄNTAR\nTravbladet vill ha en kommentar. Välj ton nedan — den hamnar i tidningen med ditt namn under.` : null,
        ].filter(Boolean).join("\n\n"),
        detaljer: [
          { namn: "Placering", värde: a.ur ? "bortkörd" : `${a.plats}` },
          { namn: "Spelprocent", värde: `${(a.streck ?? 0).toFixed?.(0) ?? a.streck} %` },
        ],
        ...(a.uttalad ? {} : { beslut: { typ: "uttalande",
          ref: { hästId: a.hästId, vecka: a.vecka, utfall }, alternativ } }),
        flik: "lopp",
      });
    });

  /* ---- ÄGARNAS RÖSTER (v110, Teds punkt 3–4: relationer och
     personligheter). Läser rent — profilerna skapas av ägarmotorn,
     typen färgar replikerna. ---- */
  {
    const ägarNamn = [...new Set((spel.stall ?? []).map((h) => h.ägare).filter(Boolean))];

    /* Tacksamtalet: en ägares häst vann i helgen. Ren värme — så byggs
       "Anders uppskattar att du alltid ringer efter loppen". */
    for (const namn of ägarNamn) {
      const h = (spel.stall ?? []).find((x) => x.ägare === namn
        && x.resultat?.[0]?.plats === 1 && x.resultat[0].vecka === spel.vecka - 1
        && x.resultat[0].säsong === (spel.säsong ?? 1));
      if (h) {
        const typ = ägartyp(namn);
        lägg({
          avsändare: namn, roll: "Hästägare", typ: "samtal", prioritet: "info",
          rubrik: `Ringer om segern`,
          text: `»${h.namn}! Jag har sett omloppet tre gånger nu.«`,
          lång: `— Hallå? Ja, det är ${namn.split(" ")[0]}. Jag ska inte störa länge.\n— Jag har sett omloppet tre gånger nu. TRE gånger. ${typ === "känslosam" ? "Jag grät faktiskt en skvätt vid mållinjen, det erkänner jag." : typ === "tävlingsmänniska" ? "Och jag har redan börjat fundera på nästa lopp — vad siktar vi på?" : "Sånt här är precis varför man håller på med trav."}\n— Hälsa alla i stallet. Och tack. Jag menar det.`,
          flik: "stall",
        });
        break;
      }
    }

    /* Otåliga samtalet: hästen har stått länge och relationen kärvar.
       Valet är riktigt: löftet bokförs med deadline och FÖLJS UPP. */
    const otålig = ägarNamn.map((namn) => ({
      namn,
      h: (spel.stall ?? []).find((x) => x.ägare === namn && x.skada === 0
        && (x.senasteStartVecka ?? 0) <= spel.vecka - 5),
      rel: spel.ägarrelationer?.[namn]?.relation ?? 50,
    })).find((k) => k.h && k.rel < 65 && !(spel.ägarlöften ?? {})[k.namn]);
    if (otålig) {
      const typ = ägartyp(otålig.namn);
      lägg({
        avsändare: otålig.namn, roll: "Hästägare", typ: "samtal", prioritet: "beslut",
        rubrik: `Undrar när ${otålig.h.namn} ska starta`,
        text: `»Jag betalar träningsavgift varje månad — och hästen står hemma.«`,
        lång: `— Du, det är ${otålig.namn.split(" ")[0]}. Jag ska vara rak.\n— ${otålig.h.namn} har inte startat på över en månad. Jag betalar träningsavgift varje månad, och hästen står hemma.\n— ${typ === "otålig" ? "Jag är inte känd för mitt tålamod, det vet du." : typ === "snål" ? "Och varje vecka utan lopp är en vecka utan prispengar. Räkna på det." : "Jag litar på dig, men jag vill förstå planen."}\n— Så: när startar hon?`,
        detaljer: [
          { namn: "Senast i lopp", värde: otålig.h.senasteStartVecka ? `vecka ${otålig.h.senasteStartVecka}` : "aldrig" },
          { namn: "Relationen", värde: `${otålig.rel} av 100` },
        ],
        beslut: { typ: "ägarlöfte", ref: { namn: otålig.namn, hästId: otålig.h.id },
          alternativ: [
            { id: "lova", etikett: "Lova en start inom tre veckor" },
            { id: "ärlig", etikett: "Var ärlig — hästen behöver tid", sekundär: true },
          ] },
        flik: "stall",
      });
    }

    /* Löftesbrottet: förra veckans svek sägs rakt ut. */
    Object.entries(spel.löftesbrott ?? {}).forEach(([namn, v]) => {
      if (v !== spel.vecka) return;
      lägg({
        avsändare: namn, roll: "Hästägare", typ: "sms", prioritet: "info",
        rubrik: "Löftet som inte hölls",
        text: `Du lovade en start. Det blev ingen. Jag glömmer inte sånt.`,
        flik: "stall",
      });
    });
  }

  /* ---- KUSKENS MÅNDAGS-SMS (v110): rösten efter helgens körning,
     färgad av resan och relationen. Ingen mekanik — bara människan. ---- */
  {
    const senaste = (spel.stall ?? [])
      .map((h) => ({ h, r: h.resultat?.[0] }))
      .filter((x) => x.r && x.r.vecka === spel.vecka - 1 && x.r.säsong === (spel.säsong ?? 1) && x.r.kusk)
      .sort((a, b) => (a.r.plats ?? 99) - (b.r.plats ?? 99))[0];
    if (senaste) {
      const kuskObj = KUSKAR.find((k) => k.namn === senaste.r.kusk);
      const rel = kuskObj ? kuskrelation(spel, kuskObj) : 50;
      const { h, r } = senaste;
      const text = r.plats === 1
        ? `Satt och tänkte på gårdagen. ${h.namn} svarade direkt när jag klickade — sån häst kör man gärna igen.${rel >= 70 ? " Som alltid: tack för förtroendet." : ""}`
        : r.läge === "dödens"
          ? `Vi fick dödens och fick betala hela vägen hem. Inte hästens fel — hon gjorde jobbet. Med ett bättre läge är hon med där framme.`
          : (r.plats ?? 99) <= 3
            ? `Bra dag i sulkyn. ${h.namn} gjorde det mesta rätt — det där sista klivet tar vi nästa gång.`
            : `Ingen resa att rama in, jag vet. Men spara inte på ${h.namn} för det — det fanns mer i henne än resultatet visar.`;
      lägg({
        avsändare: senaste.r.kusk.split(" ").slice(-1)[0], roll: "Kusk", typ: "sms",
        prioritet: "info", rubrik: `Om helgens lopp med ${h.namn}`, text, flik: "stall",
      });
    }
  }

  /* ---- Milstolpen som närmar sig (v104, 20.2): förstamannen håller
     räkningen — bara när nästa seger ÄR siffran, och bara med
     startklara hästar i stallet. ---- */
  {
    const karriär = säkraKarriär(spel);
    const stolpe = nästaMilstolpe(karriär.segrar);
    if (karriär.segrar + 1 === stolpe && stolpe >= 10 && startbara.length > 0) {
      lägg({
        avsändare: fmNamn, roll: "Förstaman", typ: "sms", prioritet: "info",
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
      avsändare: "Arrangörerna", roll: "Tävlingsledningen", typ: "mejl", prioritet: "beslut",
      rubrik: `Uttagningsbeskeden har kommit (${obesvarade})`,
      text: "Kom hästen med? Öppna loppfliken och ta beskeden — bekräfta, byt lopp eller avstå.",
      flik: "lopp",
    });
  }
  const helgstarter = (spel.anmälningar ?? []).filter((a) => a.status === "med"
    && !(spel.startadeLopp ?? []).includes(a.loppId));
  if (stopp === "helg" && helgstarter.length > 0) {
    lägg({
      avsändare: fmNamn, roll: "Förstaman", typ: "sms", prioritet: "rekommendation",
      rubrik: `Loppdag — ${helgstarter.length} ${helgstarter.length === 1 ? "start" : "starter"} i helgen`,
      text: `»${helgstarter.map((a) => spel.stall.find((h) => h.id === a.hästId)?.namn).filter(Boolean).join(" och ")} är klara. Selarna hänger framme.«`,
      flik: "lopp",
    });
  }

  /* ---- Travbladet → veckans nyheter (senaste tre pressnotiserna). ---- */
  (spel.press ?? []).slice(0, 3).forEach((n) => {
    lägg({
      avsändare: "Travbladet", roll: "Tidningen", typ: "nyhet", prioritet: "info",
      rubrik: n.rubrik, text: n.byline ?? "",
      lång: `${n.byline ?? ""}\n\n${n.ton === "positiv"
        ? `Det är den sortens vecka som får sporten att kännas enkel. I stallgången hos ${spel.stallnamn ?? "stallet"} märks det på tempot: alla vet vad som fungerar just nu, och ingen vill vara den som bryter det.`
        : n.ton === "negativ"
          ? `I trav finns inga hemligheter längre än till nästa lopp. Frågorna kommer att ställas — av ägare, av spelare, av oss — och svaren måste komma på banan, ingen annanstans.`
          : `Travvardagen rullar vidare, och det är i veckorna som den här som säsonger avgörs: i träningslistorna, anmälningarna och de små besluten ingen skriver om förrän efteråt.`}`,
      flik: "sfar",
    });
  });

  /* ---- STORYN IN I INKORGEN (v103, Teds riktning): huvudnyheten som
     stort urklipp med lång text för helskärmsläsning, och följetongens
     trådar som notiser. Sfären behåller sina — "också", inte "i
     stället". ---- */
  const stor = spel.huvudnyhet;
  if (stor && stor.säsong === (spel.säsong ?? 1) && spel.vecka - stor.vecka <= 1) {
    lägg({
      avsändare: "Travbladet", roll: "Tidningen", typ: "nyhet", prioritet: "info",
      etikett: stor.etikett, rubrik: stor.rubrik, text: stor.ingress,
      lång: [stor.ingress, stor.brödtext, stor.citat ? `»${stor.citat}«` : null]
        .filter(Boolean).join("\n\n"),
      flik: "sfar",
    });
  }
  berättelsetrådar(spel).slice(0, 2).forEach((t) => {
    lägg({
      avsändare: "Travbladet", roll: "Tidningen", typ: "nyhet", prioritet: "info",
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
  if (b.typ === "uttalande") {
    const post = (spel.senasteAnalyser ?? []).find((x) =>
      x.hästId === b.ref.hästId && x.vecka === b.ref.vecka);
    const häst = (spel.stall ?? []).find((h) => h.id === b.ref.hästId);
    if (post && valId !== "tyst") {
      const alt = händelse.beslut.alternativ.find((a) => a.id === valId);
      const citat = (alt?.etikett ?? "").replace(/[»«]/g, "");
      const hype = valId === "lyft" ? 3 : valId === "mer" ? 1 : valId === "lugn" ? -1 : 0;
      skrivPress(spel, `${post.hästNamn}: »${citat}«`,
        `Tränarkommentar efter ${post.lopp}.`, post.plats === 1 ? "positiv" : "neutral",
        häst, hype, spel.stallnamn ?? null);
    }
    if (post) post.uttalad = true;
  }
  if (b.typ === "ägarlöfte") {
    if (valId === "lova") {
      ägarKontakt(spel, b.ref.namn, 7);
      (spel.ägarlöften ??= {})[b.ref.namn] = {
        hästId: b.ref.hästId, från: spel.vecka, deadline: spel.vecka + 3,
      };
    } else {
      /* Ärligheten kostar lite värme nu — men bygger ingen bomb. */
      ägarKontakt(spel, b.ref.namn, -2);
    }
  }
  if (b.typ === "vila" && valId === "extra") {
    const h = (spel.stall ?? []).find((x) => x.id === b.ref);
    /* En vecka till i hagen: senare comeback, men utvilad häst. */
    if (h && h.skada > 0) { h.skada += 1; h.energi = klamp((h.energi ?? 70) + 12, 0, 100); }
  }
  if (b.typ === "skötardag" && valId === "ja") {
    const h = (spel.stall ?? []).find((x) => x.id === b.ref);
    /* Lugn dag i hagen: orken tillbaka, udden av träningsveckan mildras. */
    if (h) { h.energi = klamp((h.energi ?? 70) + 8, 0, 100); h.form = klamp((h.form ?? 50) - 1, 0, 100); }
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
