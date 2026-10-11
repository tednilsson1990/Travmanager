/**
 * UTRUSTNINGEN — BALANSEN (v138, plan 21.9 / kap 26 E-a)
 *
 * Travets egen "held item"-mekanik, och granskningens unika
 * differentierare: INGET annat spel har skoning. Tre verkliga val
 * inför starten, med verkliga avvägningar:
 *
 *   BARFOTA RUNT OM — snabbare (ungefär sekunden per kilometer i
 *     verkligheten) men känsligare: galopprisken stiger. FÖRBJUDET
 *     PÅ VINTERBANA, precis som i verkligheten.
 *   JÄNKARVAGN — den amerikanska sulkyn rullar lättare: lite fart,
 *     ingen baksida utom hyran (dras på loppdagen).
 *   HUVUDLAPPAR — hästen ser bara framåt: tryggare i trav och
 *     vassare i starten, men vinner ingen fart.
 *
 * ALLT ÄR OPT-IN: utan val är hästen och loppet EXAKT som förut —
 * inga nya slumpkällor, modifierarna läggs på och återställs runt
 * simuleringen. Spelarens verktyg i etapp A; världens hästar kör
 * oförändrat (antecknat).
 */

export const UTRUSTNING = {
  barfota: {
    namn: "Barfota runt om",
    effekt: { fart: 1.6, travsäkerhet: -0.05 },
    kostnad: 0,
    text: "Snabbare — men sliter hovarna. Går inte på vinterbana.",
    /* HOVKAPITALET (v168, Teds analys: "spara hovarna till finalen").
       En barfotastart sliter; hovarna växer med veckorna. Det gör
       barfota till en PLAN, inte en kryssruta — precis som på riktigt. */
    hovkrav: 60, hovslitage: 35,
  },
  jänkarvagn: {
    namn: "Jänkarvagn",
    effekt: { fart: 1.0 },
    kostnad: 900,
    text: "Den amerikanska sulkyn rullar lättare. Hyran dras på loppdagen.",
  },
  huvudlappar: {
    namn: "Norskt huvudlag",            /* v168: travets riktiga namn — samma sparfältsnyckel som förut */
    effekt: { travsäkerhet: 0.04, start: 1 },
    kostnad: 0,
    huvudlag: true,
    text: "Halvstängt: hästen ser bara framåt. Tryggare trav, vassare start.",
  },
  helstängt: {
    namn: "Helstängt huvudlag",
    effekt: { fart: 0.7, start: 1, travsäkerhet: -0.03 },
    kostnad: 0,
    huvudlag: true,
    text: "Hästen ser inget som skrämmer — går på för fullt. Passar inte alla.",
  },
  brodd: {
    namn: "Broddade skor",
    effekt: { travsäkerhet: 0.05, fart: -0.3 },
    kostnad: 0,
    vinter: true,
    text: "Grepp på snö och is — tryggare, något trögare. Vinterns val.",
  },
  tussar: {
    namn: "Rycktussar",
    effekt: { fart: 0.8 },
    kostnad: 0,
    tuss: true,
    text: "Rycks på upploppet — en växel till. Effekten mattas om de visas för ofta.",
  },
};

/* Tussarnas verkan mattas med vanan: första gången full effekt, sedan
   allt mindre tills hästen fått vila från dem. Spara dem till loppet
   som betyder något — det är hela poängen. */
export const tusseffekt = (häst) =>
  Math.max(0.25, 1 - (häst.tussVana ?? 0) * 0.3);

/** Hovarna i dag — fullt kapital för hästar från tiden före v168. */
export const hovläge = (häst) => Math.round(häst.hovar ?? 100);

/* ------------------------------------------------------------------ */
/* INDIVIDEN (v169, 21.9b — Teds direktiv: "all utrustning passar     */
/* inte alla hästar")                                                  */
/* ------------------------------------------------------------------ */
function svarshash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/**
 * Hästens svar på en utrustning: "stark" | "neutral" | "fel".
 * Härlett ur hash + egenskaperna, med travets egen logik:
 * stark häst tål barfota, het häst tål aldrig helstängt, orolig häst
 * blir STABILARE av norskt huvudlag. Ingen lagring — individen är
 * densamma karriären ut, för alla hästar, även världens.
 */
export function utrustningssvar(häst, id) {
  if (id === "brodd") return "neutral";          /* brodd är vinterns standard */
  const lynne = häst.lynne ?? 50;
  if (id === "helstängt" && lynne < 40) return "fel";      /* het häst blir vild */
  if (id === "huvudlappar" && lynne < 45) return "stark";  /* orolig häst samlas */
  if (id === "barfota" && (häst.styrka ?? 50) >= 62) {
    /* Stark häst tål alltid barfota — men bara individen gör den vass. */
    return svarshash(`svar:${id}:${häst.namn}:${häst.id ?? ""}`) % 100 < 30 ? "stark" : "neutral";
  }
  const h = svarshash(`svar:${id}:${häst.namn}:${häst.id ?? ""}`) % 100;
  return h < 25 ? "stark" : h < 80 ? "neutral" : "fel";
}

/** Har spelaren provat utrustningen på hästen? Svaret visas först då. */
export const utrustningKänd = (häst, id) => !!häst.utrProvat?.[id];

/** Svarsordet för vyerna — i travspråk, aldrig i faktorer. */
export function svarstext(häst, id) {
  if (!utrustningKänd(häst, id)) return "oprövat på hästen";
  const svar = utrustningssvar(häst, id);
  if (svar === "stark") return id === "huvudlappar" && (häst.lynne ?? 50) < 45
    ? "samlar hästen — stabilare, inte snabbare"
    : "svarar starkt";
  if (svar === "fel") return "tål den inte — går orent";
  return "fungerar som den ska";
}

/** Vinterbana: säsongens tre första och tre sista veckor (23 C). */
export const vinterbana = (spel) =>
  (spel.vecka ?? 1) <= 3 || (spel.vecka ?? 1) >= (spel.veckor ?? 18) - 2;

/**
 * Räknar ihop balansen ur hästens val. Barfota stryks på vinterbana
 * — med orsaken tillbaka till UI:t (v98-principen: orsaken nära).
 */
export function sättBalans(häst, spel) {
  const val = häst.balansVal ?? {};
  const vinter = vinterbana(spel);
  const spärrar = [];
  const balans = { fart: 0, travsäkerhet: 0, start: 0, kostnad: 0, delar: [] };
  let huvudlagValt = false;
  Object.entries(UTRUSTNING).forEach(([id, u]) => {
    if (!val[id]) return;
    if (id === "barfota" && vinter) { spärrar.push("Barfota är förbjudet på vinterbana — skor på."); return; }
    if (id === "brodd" && !vinter) { spärrar.push("Brodd utan is sliter bara banan — de åker av."); return; }
    if (id === "barfota" && hovläge(häst) < (u.hovkrav ?? 0)) {
      spärrar.push(`Hovarna är nere på ${hovläge(häst)} — de behöver växa innan nästa barfotastart. Skor på.`);
      return;
    }
    if (u.huvudlag) {
      if (huvudlagValt) { spärrar.push("Ett huvudlag åt gången — det norska fick platsen."); return; }
      huvudlagValt = true;
    }
    /* INDIVIDEN (v169): hästens svar avgör vad utrustningen GÖR.
       Starkt svar förstärker; tål-inte ger noll nytta och orenare
       trav — vass utrustning på fel häst kostar. Tussarna skalar
       dessutom med vanan. */
    const svar = utrustningssvar(häst, id);
    const faktor = (u.tuss ? tusseffekt(häst) : 1)
      * (svar === "stark" ? 1.35 : svar === "fel" ? 0 : 1);
    balans.fart += (u.effekt.fart ?? 0) * faktor;
    balans.travsäkerhet += (u.effekt.travsäkerhet ?? 0) * faktor;
    balans.start += (u.effekt.start ?? 0) * faktor;
    if (svar === "fel") balans.travsäkerhet -= 0.05;
    /* Oroliga hästen + norskt: stabilare, inte snabbare. */
    if (svar === "stark" && id === "huvudlappar" && (häst.lynne ?? 50) < 45) {
      balans.travsäkerhet += 0.03; balans.start -= (u.effekt.start ?? 0) * 0.35;
    }
    balans.kostnad += u.kostnad ?? 0;
    balans.delar.push(u.namn);
    if (id === "barfota") balans.barfota = true;
    if (u.tuss) balans.tussar = true;
    balans.provade = [...(balans.provade ?? []), id];
  });
  häst.balans = balans.delar.length ? balans : null;
  return { balans: häst.balans, spärrar };
}

/**
 * Loppet är kört — balansen gäller en start i taget, och NU bokförs
 * priset: barfota sliter hovarna, visade tussar höjer vanan (v168).
 */
export function släppBalans(häst) {
  if (häst.balans?.barfota) häst.hovar = Math.max(0, (häst.hovar ?? 100) - (UTRUSTNING.barfota.hovslitage ?? 35));
  if (häst.balans?.tussar) häst.tussVana = Math.min(3, (häst.tussVana ?? 0) + 1);
  /* UPPTÄCKTEN (v169): efter starten VET man hur hästen svarade —
     det är så en travtränare bygger hästens egen utrustningslåda. */
  (häst.balans?.provade ?? []).forEach((id) => {
    (häst.utrProvat ??= {})[id] = true;
  });
  häst.balans = null;
}

/** Veckovården (v168) — anropas i veckoskiftet: hovarna växer, tussarna
 * glöms. Det är tiden som gör sparandet till en plan. */
export function veckovård(häst) {
  häst.hovar = Math.min(100, (häst.hovar ?? 100) + 8);
  häst.tussVana = Math.max(0, (häst.tussVana ?? 0) - 0.2);
}
