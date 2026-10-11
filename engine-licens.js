/**
 * KARRIÄRSTEGEN (v171, kap 31 rek 1 — spelbarhetsgranskningens
 * viktigaste fynd: spelet saknade en trappa att klättra)
 *
 * Svensk trav har den på riktigt: B-tränarlicensen man börjar med,
 * A-licensen när verksamheten bär, och eliten — namnen alla kan.
 * Spelets version: tre steg med verkliga krav ur karriärtotalerna,
 * prövade vid säsongsskiftet (uppgraderingar är ceremonier, inte
 * notiser), och SÄSONGSGALAN som varje år korar Årets tränare och
 * Årets häst. Tillsammans är de tio-säsongersmotivationen:
 * det finns alltid ett nästa steg, och alltid ett pris att försvara.
 *
 * Ren derivation + en skiftesprövning. Ingen slump.
 */

export const LICENSER = [
  { id: "b", namn: "B-licens", kortnamn: "B",
    text: "Nybörjarlicensen — alla börjar här." },
  { id: "a", namn: "A-licens", kortnamn: "A",
    krav: { segrar: 25, prispengar: 1_500_000 },
    kravtext: "25 segrar och 1,5 miljoner insprunget",
    text: "Yrkestränarens licens. Verksamheten bär." },
  { id: "elit", namn: "Elitlicens", kortnamn: "ELIT",
    krav: { segrar: 80, prispengar: 6_000_000, titlar: 1 },
    kravtext: "80 segrar, 6 miljoner insprunget och en mästartitel",
    text: "Namnen alla kan. Få kommer hit." },
];

const uppfyllt = (spel, krav) => {
  if (!krav) return true;
  const k = spel.karriär ?? {};
  const titlar = (spel.troférum ?? []).filter((t) =>
    t.typ === "seriemästare" || t.typ === "årets_tränare").length
    + ((k.storloppssegrar ?? 0) > 0 ? 1 : 0);
  return (k.segrar ?? 0) >= (krav.segrar ?? 0)
    && (k.prispengar ?? 0) >= (krav.prispengar ?? 0)
    && titlar >= (krav.titlar ?? 0);
};

/** Läget på stegen: nuvarande steg, nästa, och progress mot det. */
export function licensläge(spel) {
  const ix = Math.max(0, LICENSER.findIndex((l) => l.id === (spel.licens ?? "b")));
  const nuvarande = LICENSER[ix];
  const nästa = LICENSER[ix + 1] ?? null;
  const k = spel.karriär ?? {};
  const progress = nästa?.krav ? [
    { namn: "Segrar", nu: k.segrar ?? 0, mål: nästa.krav.segrar },
    { namn: "Insprunget", nu: k.prispengar ?? 0, mål: nästa.krav.prispengar, kr: true },
    ...(nästa.krav.titlar ? [{ namn: "Mästartitlar", mål: nästa.krav.titlar,
      nu: (spel.troférum ?? []).filter((t) => t.typ === "seriemästare" || t.typ === "årets_tränare").length
        + ((k.storloppssegrar ?? 0) > 0 ? 1 : 0) }] : []),
  ] : [];
  return { nuvarande, nästa, progress };
}

/**
 * Skiftesprövningen — anropas i nySäsong. Ett steg per år, aldrig två:
 * en uppgradering ska hinna kännas innan nästa jagas.
 */
export function prövaLicens(spel) {
  const press = [];
  spel.licens = spel.licens ?? "b";
  const { nästa } = licensläge(spel);
  if (nästa && uppfyllt(spel, nästa.krav)) {
    spel.licens = nästa.id;
    press.push({
      rubrik: `${spel.stallnamn} beviljas ${nästa.namn.toLowerCase()}en`,
      byline: nästa.id === "elit"
        ? `${nästa.kravtext} — kraven är nådda, och sporten har fått ett nytt elitstall. Det här är nivån där legenderna tränar.`
        : `${nästa.kravtext} — nu är det på riktigt. Propositionerna öppnar sig, och förväntningarna med dem.`,
      ton: "positiv",
    });
    (spel.troférum ??= []).unshift({ säsong: (spel.säsong ?? 1) - 1, vecka: spel.veckor ?? 18,
      typ: "licens", rubrik: `${nästa.namn} beviljad` });
  }
  return press;
}

/**
 * SÄSONGSGALAN — körs i nySäsong på fjolårets siffror. Årets tränare
 * (tränarligan, spelarens plats ur historiken) och Årets häst (högst
 * insprunget i fjol, dina och världens på samma villkor).
 */
export function körGalan(spel, tränarligaRader) {
  const press = [];
  const fjol = (spel.säsong ?? 1) - 1;
  const minPlats = spel.historik?.at?.(-1)?.plats ?? null;

  /* Årets tränare: ligavinnaren. Är det du är det en karriärhändelse. */
  const etta = tränarligaRader?.[0];
  if (etta) {
    const jag = !!etta.du;
    press.push({
      rubrik: jag ? `Årets tränare: ${spel.stallnamn}` : `Årets tränare: ${etta.tränare}`,
      byline: jag
        ? `Tränarligan vanns av ${spel.stallnamn} — galan reste sig. Titeln som betyder mest i sporten är din.`
        : `${etta.namn} vann tränarligan${minPlats ? ` — ${spel.stallnamn} slutade ${minPlats}:a` : ""}. Galan tackade för säsongen.`,
      ton: jag ? "positiv" : "neutral",
    });
    if (jag) (spel.troférum ??= []).unshift({ säsong: fjol, vecka: spel.veckor ?? 18,
      typ: "årets_tränare", rubrik: "Årets tränare" });
  }

  /* Årets häst: högst insprunget i fjol — dina räknas via intjänat i år
     (nollställs vid skiftet, så detta körs FÖRE nollställningen i
     nySäsong? Nej — vi läser hästens säsongsrader). Enkel och ärlig
     proxy: världens stall bär insprunget per säsong; din bästa läses
     ur historikens rad. */
  const minBästa = spel.historik?.at?.(-1)?.bästaHäst ?? null;
  const världsbäst = [...(spel.värld?.hästar ?? [])]
    .sort((a, b) => (b.intjänat ?? 0) - (a.intjänat ?? 0))[0];
  if (världsbäst) {
    press.push({
      rubrik: `Årets häst: ${världsbäst.namn}`,
      byline: `${Math.round((världsbäst.intjänat ?? 0) / 1000)} tkr i karriären och en säsong som avgjorde${minBästa ? `. I ${spel.stallnamn}s läger gratulerades — med ${minBästa} som eget affischnamn` : ""}.`,
      ton: "neutral",
    });
  }
  return press;
}
