/**
 * STATISTIKLAGRET (v109, utvecklingsplanen 20.3 — FM-punkt 2:
 * "man ska kunna grotta ner sig i siffror i timmar")
 *
 * Ren läsning av det som redan sparas: hästarnas resultatrader (med
 * positionsklassen från målraden, och från och med nu även banan),
 * karriärtotalerna och loppfacit. Ingen egen lagring, inga slumptal —
 * aggregaten räknas när de efterfrågas.
 *
 * ÄRLIGHETEN: resultatraderna sparas till max 24 per häst, så
 * radaggregaten gäller "de bevarade starterna" — helheten bärs av
 * karriärtotalerna (spel.karriär), och det står i vyn. Rader från
 * före v109 saknar bana och rader från före v88 saknar läge — de
 * hamnar utanför just de tabellerna i stället för att gissas.
 */

const POSITIONSNAMN = {
  "ledningen": "Ledningen", "dödens": "Dödens", "utvändigt": "Utvändigt",
  "rygg/inner": "Rygg/inner", "fri inner": "Fri inner",
};

const grupp = (rader, nyckelFn) => {
  const m = new Map();
  rader.forEach((r) => {
    const k = nyckelFn(r);
    if (k == null) return;
    const g = m.get(k) ?? { starter: 0, segrar: 0, topp3: 0, pris: 0 };
    g.starter++; if (r.plats === 1) g.segrar++;
    if (r.plats && r.plats <= 3) g.topp3++;
    g.pris += r.pris ?? 0;
    m.set(k, g);
  });
  return [...m.entries()]
    .map(([namn, g]) => ({ namn, ...g, segerprocent: Math.round(100 * g.segrar / g.starter) }))
    .sort((a, b) => b.starter - a.starter || b.segrar - a.segrar);
};

/** En hästs statistik ur de bevarade raderna. */
export function hästStatistik(häst) {
  const rader = (häst.resultat ?? []).filter((r) => !r.ur || r.plats);
  const starter = rader.length;
  const segrar = rader.filter((r) => r.plats === 1).length;
  const topp3 = rader.filter((r) => r.plats && r.plats <= 3).length;
  const kmRader = rader.filter((r) => r.km);
  return {
    starter, segrar, topp3,
    segerprocent: starter ? Math.round(100 * segrar / starter) : 0,
    platsprocent: starter ? Math.round(100 * topp3 / starter) : 0,
    bästaKm: kmRader.length ? Math.min(...kmRader.map((r) => r.km)) : null,
    banor: grupp(rader, (r) => r.bana),
    startmetod: grupp(rader, (r) => r.start === "volt" ? "Volt" : r.start ? "Autostart" : null),
    distanser: grupp(rader, (r) => !r.dist ? null
      : r.dist <= 2000 ? "Kort (–2000 m)" : r.dist <= 2400 ? "Medel (2100–2400 m)" : "Lång (2500 m–)"),
    positioner: grupp(rader, (r) => POSITIONSNAMN[r.läge] ?? null),
    kuskar: grupp(rader, (r) => r.kusk),
    bevarade: starter,
  };
}

/** Tränarens (stallets) statistik: totalerna + aggregat över alla rader. */
export function tränarStatistik(spel) {
  const karriär = spel.karriär ?? { starter: 0, segrar: 0, prispengar: 0, storloppssegrar: 0 };
  const alla = (spel.stall ?? []).flatMap((h) => h.resultat ?? []);
  const banor = grupp(alla, (r) => r.bana);
  const kuskar = grupp(alla, (r) => r.kusk);
  const säsonger = grupp(alla, (r) => r.säsong != null ? `Säsong ${r.säsong}` : null);
  const bästaBana = [...banor].sort((a, b) => b.segrar - a.segrar || b.topp3 - a.topp3)[0] ?? null;
  const bästaKusk = [...kuskar].sort((a, b) => b.segrar - a.segrar || b.topp3 - a.topp3)[0] ?? null;
  return {
    ...karriär,
    segerprocent: karriär.starter ? Math.round(100 * karriär.segrar / karriär.starter) : 0,
    snittintjäning: karriär.starter ? Math.round(karriär.prispengar / karriär.starter) : 0,
    bästaBana, bästaKusk, säsonger,
    bevaradeRader: alla.length,
  };
}
