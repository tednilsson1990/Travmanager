/**
 * STAMBOKEN (v146, plan 21.3 — kap 26: generationsspelet läsbart)
 *
 * Travsporten ÄR härstamning. Varje riktig startlista skriver
 * "e. Maharajah u. Isabella Boko" — efter pappan, undan mamman — och
 * varje uppfödare kan sin stammoder tre led bakåt. Spelet har byggt
 * generationerna länge (avelshagen, fölen, hall of fame) men aldrig
 * gjort dem LÄSBARA: stamboken är boken där gårdens alla hästar står
 * med härstamning, meriter och öde, familjevis under sina stammödrar.
 *
 * Pokémon-parallellen är lagd i travets egen form: "boxen" där man
 * ser allt man fött upp, fångat och släppt — men här heter det
 * stambok, ödena heter "i träning", "avelshagen", "såld", och
 * notationen är travets egen.
 *
 * REN BOKFÖRING: ingen slump, inga beslut. säkraStambok är en
 * idempotent migrator/synk (körs i veckoskiftet), ödeskrokarna
 * anropas där ödena redan avgörs (säsongsskiftet, säljknappen).
 */

const ÖDEN = ["aktiv", "pensionerad", "avelssto", "såld", "flyttad"];

/** Född-säsong härleds ur åldern — hästar åldras ett år per säsong. */
const föddSäsong = (häst, säsong) => (säsong ?? 1) - (häst.ålder ?? 3);

function nyPost(häst, spel, öde) {
  return {
    id: häst.id ?? null,
    namn: häst.namn,
    kön: häst.kön ?? null,
    född: föddSäsong(häst, spel.säsong),
    mor: häst.mor ?? null,
    far: häst.far ?? null,
    morId: häst.morId ?? null,
    uppfödd: !!häst.mor,                      /* gårdens egen uppfödning */
    raritet: häst.raritet ?? null,            /* vit stjärna (v147, 21.5) */
    öde: öde ?? "aktiv",
    slutSäsong: null,
    segrar: häst.segrar ?? 0,
    starter: häst.starter ?? 0,
    intjänat: häst.intjänat ?? 0,
    hallOfFame: false,
  };
}

const hitta = (bok, häst) =>
  bok.find((p) => (häst.id != null && p.id === häst.id) || p.namn === häst.namn);

/**
 * Migrerar och synkar. Idempotent — körs varje vecka: stallets hästar
 * hålls uppdaterade (meriter växer), avelshagen och hall of fame
 * fångas upp ur äldre sparfiler som levde före stamboken.
 */
export function säkraStambok(spel) {
  spel.stambok = spel.stambok ?? [];
  const bok = spel.stambok;

  (spel.stall ?? []).forEach((h) => {
    const p = hitta(bok, h);
    if (p) {
      p.segrar = h.segrar ?? p.segrar;
      p.starter = h.starter ?? p.starter;
      p.intjänat = h.intjänat ?? p.intjänat;
      if (p.id == null) p.id = h.id ?? null;
      if (h.raritet && !p.raritet) p.raritet = h.raritet;
      p.öde = "aktiv"; p.slutSäsong = null;   /* återköpt/återfunnen */
    } else bok.push(nyPost(h, spel, "aktiv"));
  });

  (spel.avelsston ?? []).forEach((m) => {
    const p = hitta(bok, m);
    if (p) { p.öde = "avelssto"; p.segrar = m.segrar ?? p.segrar; p.intjänat = m.intjänat ?? p.intjänat; }
    else bok.push({ ...nyPost(m, spel, "avelssto"), slutSäsong: spel.säsong ?? 1 });
  });

  (spel.hallOfFame ?? []).forEach((hof) => {
    const p = bok.find((x) => (hof.hästId != null && x.id === hof.hästId) || x.namn === hof.namn);
    if (p) { p.hallOfFame = true; }
    else bok.push({
      id: hof.hästId ?? null, namn: hof.namn, kön: null,
      född: null, mor: hof.mor ?? null, far: null, morId: null,
      uppfödd: !!hof.mor, öde: "pensionerad", slutSäsong: hof.säsong ?? null,
      segrar: hof.segrar ?? 0, starter: hof.starter ?? 0,
      intjänat: hof.intjänat ?? 0, hallOfFame: true,
    });
  });

  /* Boken är ett arkiv men sparfilen har tak: över 80 poster gallras
     de som varken vann, föddes här eller fick avkomma — minst
     minnesvärda först. Hall of fame gallras aldrig. */
  if (bok.length > 80) {
    const mödrar = new Set(bok.map((p) => p.mor).filter(Boolean));
    const gallringsbar = (p) => !p.hallOfFame && !p.uppfödd && p.öde !== "aktiv"
      && !mödrar.has(p.namn) && (p.segrar ?? 0) === 0;
    while (bok.length > 80) {
      const ix = bok.findIndex(gallringsbar);
      if (ix === -1) break;
      bok.splice(ix, 1);
    }
  }
  return bok;
}

/**
 * Ödeskroken — anropas där ödet avgörs: säsongsskiftet (pensionerad/
 * avelssto) och säljknappen (såld). Robust: saknas posten (hästen
 * köptes och såldes mellan två veckoskiften) skapas den först.
 */
export function bokförStamÖde(spel, häst, öde) {
  if (!ÖDEN.includes(öde)) return null;
  spel.stambok = spel.stambok ?? [];
  let p = hitta(spel.stambok, häst);
  if (!p) { p = nyPost(häst, spel, öde); spel.stambok.push(p); }
  p.öde = öde;
  p.slutSäsong = spel.säsong ?? 1;
  p.segrar = häst.segrar ?? p.segrar;
  p.starter = häst.starter ?? p.starter;
  p.intjänat = häst.intjänat ?? p.intjänat;
  return p;
}

/**
 * Stamträdet, för journalens stamboksflik: familjerna grupperade
 * under sina stammödrar (travets sätt att läsa en stam), övriga
 * hästar — förvärven — för sig. Stammodern själv lyfts ur övriga
 * när hon står i boken.
 */
export function stamträd(spel) {
  const bok = spel.stambok ?? [];
  const perMor = new Map();
  bok.forEach((p) => {
    if (!p.mor) return;
    if (!perMor.has(p.mor)) perMor.set(p.mor, []);
    perMor.get(p.mor).push(p);
  });
  const familjer = [...perMor.entries()].map(([mor, avkommor]) => ({
    stammoder: mor,
    moderpost: bok.find((p) => p.namn === mor) ?? null,
    avkommor: avkommor.sort((a, b) => (b.född ?? 0) - (a.född ?? 0)),
  })).sort((a, b) => b.avkommor.length - a.avkommor.length);

  const iFamilj = new Set();
  familjer.forEach((f) => {
    if (f.moderpost) iFamilj.add(f.moderpost.namn);
    f.avkommor.forEach((p) => iFamilj.add(p.namn));
  });
  const övriga = bok.filter((p) => !iFamilj.has(p.namn))
    .sort((a, b) => (b.intjänat ?? 0) - (a.intjänat ?? 0));
  return { familjer, övriga };
}

/** Travets notation, så som varje startlista i landet skriver den. */
export const härstamning = (p) =>
  p.far && p.mor ? `e. ${p.far} u. ${p.mor}`
  : p.mor ? `u. ${p.mor}`
  : p.far ? `e. ${p.far}` : null;

/** Ödet i klartext — stambokens språk, inte kodens. */
export function ödestext(p, säsong) {
  switch (p.öde) {
    case "aktiv": return "I träning";
    case "avelssto": return "I avelshagen";
    case "såld": return p.slutSäsong ? `Såld säsong ${p.slutSäsong}` : "Såld";
    case "flyttad": return p.slutSäsong ? `Flyttad av ägaren säsong ${p.slutSäsong}` : "Flyttad av ägaren";
    case "pensionerad": return p.slutSäsong ? `Pensionerad säsong ${p.slutSäsong}` : "Pensionerad";
    default: return "";
  }
}

/* ------------------------------------------------------------------ */
/* UPPFÖDARPREMIEN (v160, plan 28.4 c)                                 */
/* ------------------------------------------------------------------ */
/*
 * Verklighetens mekanik: uppfödaren får en premie på hästens
 * prispengar — även efter att hästen sålts. Det är så svensk
 * uppfödning bär sig, och i spelet är det generationsspelets lön:
 * fölet du födde upp fortsätter ge, var det än står. Egna uppfödda
 * ger premien direkt i efterLopp; sålda/flyttade via veckosynken
 * mot världen (Gamla bekanta-lagret).
 */
export const UPPFÖDARPREMIE = 0.1;
export const uppfödarpremie = (brutto) =>
  Math.max(0, Math.round((brutto ?? 0) * UPPFÖDARPREMIE));
