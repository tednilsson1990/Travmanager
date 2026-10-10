/**
 * SERIERNA SOM GYM-TRAPPA (v120, mixens kärnbygge — plan 18.10 + 20.5,
 * prioritet 1 i kapitel 22)
 *
 * FM:s säsongsdrama och Pokémons gym-trappa i samma system. Varje
 * deltävling i en serie ger placeringspoäng (15-12-10-8-6-4-2-1, som
 * V75-finalernas kultur), tabellen räknas över säsongen för HELA
 * världen — dina hästar och alla andras i samma lista — och vid
 * säsongsskiftet koras seriemästarna: pressen skriver, och är
 * mästaren din står MÄRKET i troférummet för alltid. Brons → Silver
 * → Guld är gymledarna; märkesväggen är trappan man ser.
 *
 * Allt är bokföring av lopp som ändå körs — inga nya slumpkällor,
 * ingen motorändring. Poängen skrivs där resultaten redan bokförs.
 */

import { veckansLopp } from "./data-kalender.js";

export const SERIEPOÄNG = [15, 12, 10, 8, 6, 4, 2, 1];

export const SERIENAMN = [
  "Lärlingsserien", "Bronsserien", "Silverserien", "Guldserien",
  "Unghästserien", "Stoserien",
];

/** Serienyckeln ur ett lopp — "Bronsserien avd 2" hör till "Bronsserien". */
export function serienyckel(lopp) {
  const namn = (lopp.kortnamn || lopp.namn || "").replace(/ avd.*$/i, "").trim();
  return SERIENAMN.includes(namn) ? namn : null;
}

/** Bokför placeringspoängen för ett kört lopp — hela fältet på en gång. */
export function bokförSeriepoäng(spel, lopp, resultat) {
  if (lopp.final) return;   /* finalen ger titeln, inte poäng */
  const serie = serienyckel(lopp);
  if (!serie) return;
  spel.seriepoäng = spel.seriepoäng ?? {};
  const tabell = (spel.seriepoäng[serie] = spel.seriepoäng[serie] ?? {});
  resultat.forEach((r) => {
    if (r.ur || !r.plats || r.plats > SERIEPOÄNG.length) return;
    const namn = r.häst?.namn ?? r.namn;
    if (!namn) return;
    const post = tabell[namn] ?? { poäng: 0, starter: 0, egen: false };
    post.poäng += SERIEPOÄNG[r.plats - 1];
    post.starter += 1;
    post.egen = post.egen || !!r.häst?.egen;
    tabell[namn] = post;
  });
}

/** Tabellen, sorterad: poäng, sedan färre starter (effektivitet). */
export function serietabell(spel, serie) {
  const tabell = spel.seriepoäng?.[serie] ?? {};
  return Object.entries(tabell)
    .map(([namn, p]) => ({ namn, ...p }))
    .sort((a, b) => b.poäng - a.poäng || a.starter - b.starter);
}

/* ==================== FINALVECKAN (v130, 18.10 B — kap 26 B-a) ====
 * Poängkorningen var etapp A:s ärliga förenkling. Nu avgörs titeln
 * som i STL: seriens ÅTTA FRÄMSTA möts i ett riktigt finallopp sista
 * veckan. Spelarens kvalade hästar går genom det vanliga anmälnings-
 * flödet (uttagningen känner igen finalen), världens körs i vecko-
 * motorn — och mästaren är FINALVINNAREN. Poängen står kvar som
 * reserv för serier som inte bar till final.
 */

/** Seriens åtta främsta — namnen i poängordning. */
export function finalkandidater(spel, serie) {
  return serietabell(spel, serie).slice(0, 8).map((r) => r.namn);
}

/**
 * Sista veckans finallopp — ett per serie med minst sex poängsatta
 * hästar. Mallen (distans, start, bana, prisnivå) hämtas ur seriens
 * egen proposition i kalendern; finalen kör 2,5× prispengarna.
 */
export function finallopp(spel) {
  if ((spel.vecka ?? 0) !== (spel.veckor ?? 18)) return [];
  const mallar = {};
  for (let v = 1; v <= (spel.veckor ?? 18) && Object.keys(mallar).length < SERIENAMN.length; v++) {
    veckansLopp(v).forEach((l) => {
      const serie = serienyckel(l);
      if (serie && !mallar[serie]) mallar[serie] = l;
    });
  }
  return SERIENAMN.flatMap((serie) => {
    const kand = finalkandidater(spel, serie);
    const mall = mallar[serie];
    if (kand.length < 6 || !mall) return [];
    return [{
      id: `final-${serie.toLowerCase().replace(/[^a-z]/g, "")}-s${spel.säsong ?? 1}`,
      namn: `${serie} — finalen`, kortnamn: `${serie} — finalen`,
      final: true, serie, finalnamn: kand,
      dist: mall.dist, start: mall.start, banaNamn: mall.banaNamn,
      startande: 8, nivå: Math.min(92, (mall.nivå ?? 50) + 8),
      pris: (mall.pris ?? [20000]).map((p) => Math.round(p * 2.5)),
      förstapris: Math.round((mall.förstapris ?? mall.pris?.[0] ?? 20000) * 2.5),
      garanterad: Math.round((mall.garanterad ?? 500) * 2),
    }];
  });
}

/**
 * Finalfältet: namnen upplösta till hästarna — spelarens först (så
 * identiteten bevaras), sedan världens. Spåren efter poängordningen:
 * seriesegraren har förtjänat innerspåret.
 */
export function finalfält(spel, lopp) {
  const fält = [];
  (lopp.finalnamn ?? []).forEach((namn) => {
    const h = (spel.stall ?? []).find((x) => x.namn === namn)
      ?? (spel.värld?.hästar ?? []).find((x) => x.namn === namn);
    if (h) fält.push(h);
  });
  fält.slice(0, 8).forEach((h, i) => { h.spår = i + 1; });
  return fält.slice(0, 8);
}

/** Finalens utgång bokförs — korningen läser den före poängen. */
export function registreraFinalresultat(spel, serie, vinnarNamn, egen) {
  (spel.finalresultat ??= {})[serie] = { häst: vinnarNamn, egen: !!egen };
}

/**
 * Säsongsskiftets korning: mästarna utses, pressen får raderna, och
 * en egen mästare ger troféposten. Tabellerna arkiveras och nollas —
 * ny säsong, ny trappa. Anropas ur nySäsong FÖRE veckan nollas.
 */
export function koraSeriemästare(spel, avslutadSäsong = (spel.säsong ?? 1)) {
  const press = [];
  const troféer = [];
  spel.seriemästare = spel.seriemästare ?? [];
  SERIENAMN.forEach((serie) => {
    const tabellTopp = serietabell(spel, serie)[0];
    const final = spel.finalresultat?.[serie];
    /* Finalvinnaren före poängtoppen — poängen är reserven (v130). */
    const topp = final
      ? { namn: final.häst, egen: final.egen, viaFinal: true,
          poäng: serietabell(spel, serie).find((r) => r.namn === final.häst)?.poäng ?? 0 }
      : tabellTopp;
    if (!topp || (!topp.viaFinal && topp.poäng < SERIEPOÄNG[0])) return;
    spel.seriemästare.unshift({ säsong: avslutadSäsong, serie, häst: topp.namn,
      poäng: topp.poäng, egen: topp.egen, viaFinal: !!topp.viaFinal });
    press.push({
      rubrik: `${topp.namn} seriemästare i ${serie}`,
      byline: topp.viaFinal
        ? (topp.egen
          ? `Vann finalen — och märket hänger nu i ${spel.stallnamn ?? "stallets"} troférum.`
          : `Avgjort där det ska avgöras: i finalen.`)
        : (topp.egen
          ? `${topp.poäng} poäng över säsongen — och märket hänger nu i ${spel.stallnamn ?? "stallets"} troférum.`
          : `${topp.poäng} poäng över säsongen. En trappa avklarad — nästa väntar.`),
      ton: topp.egen ? "positiv" : "neutral",
    });
    if (topp.egen) {
      troféer.push({ typ: "seriemästare", rubrik: `${serie} — mästare`,
        häst: topp.namn, text: `Seriemästare ${serie}, säsong ${avslutadSäsong}${topp.viaFinal ? " — finalseger" : ` (${topp.poäng} p)`}.` });
    }
  });
  spel.seriemästare = spel.seriemästare.slice(0, 40);
  spel.seriepoäng = {};
  spel.finalresultat = {};
  return { press, troféer };
}
