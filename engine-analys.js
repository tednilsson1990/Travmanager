/**
 * EFTERLOPPSANALYSEN (v88, kap 14 + plan 3.7)
 *
 * Efter loppet ska spelaren förstå: vad planen var, vad som hände,
 * vilket beslut som blev avgörande, vad hästen gjorde bra och vad nästa
 * steg bör vara. Det är kapitel 14 ordagrant — och hela poängen med att
 * simuleringen är tick-baserad: allt som visas här LÄSES ur bildrutorna
 * och resultatet som redan finns. Ingen slump, ingen ny motordata, inget
 * påhitt. Samma lopp ger samma analys, varje gång.
 *
 * Måtten är plan 3.7:s: position vid 1 500/1 000/500 kvar, meter i
 * ledningen och utan rygg, meter i tredjespår, extra löpt väg,
 * attackpunkten, avslutningen, kraft kvar, galopp eller instängning och
 * tempot i öppningen mot avslutningen. Siffrorna är skattningar ur
 * bildrutorna (varannan halvsekund) — samma upplösning som spelaren
 * såg loppet i, vilket är exakt rätt anspråksnivå.
 *
 * RÖSTERNA följer rollprincipen (v87): analysen är TRÄNARENS läsning av
 * loppet och förstamannens råd om nästa steg — rekommendationer, aldrig
 * facit om vad kusken "borde" ha känt.
 */
import { LÄNGD, kmtid, klamp } from "./engine-util.js";
import { distanspassning } from "./engine-hast.js";

const EXTRA_VÄG = 0.0063;   // samma konstant som motorn — dokumenterad i README
const RUTA_S = 0.5;         // bildrutornas intervall

/** Placering och läge för egen häst i första rutan där ≤ `kvar` m återstår. */
function positionVid(bild, dist, kvar) {
  const i = bild.findIndex((b) => b.meter >= dist - kvar);
  if (i < 0) return null;
  const rad = bild[i].rader.find((r) => r.egen);
  if (!rad) return null;
  return { plats: bild[i].rader.indexOf(rad) + 1, läge: rad.läge };
}

/**
 * Hela analysen. sim är simuleringens retur, resten är körningens fakta.
 * Returnerar null om egen häst saknas i loppet (ska inte hända).
 */
export function loppanalys(sim, lopp, { häst, kusk, taktik, slutorder, förstaman } = {}) {
  const min = sim.resultat.find((r) => r.häst.egen);
  if (!min) return null;
  const dist = lopp.dist;
  const bild = sim.bild;

  /* ---- Resan: positionerna och metrarna (plan 3.7) ---- */
  const pos = {
    v1500: dist > 1700 ? positionVid(bild, dist, 1500) : null,
    v1000: positionVid(bild, dist, 1000),
    v500: positionVid(bild, dist, 500),
  };
  let mLedning = 0, mTredje = 0, extraVäg = 0, instängdSent = 0, mDödens = 0;
  bild.forEach((b) => {
    const r = b.rader.find((x) => x.egen);
    if (!r || r.läge === "i mål") return;
    const m = (r.fart / 3.6) * RUTA_S;
    if (r.läge === "leder") mLedning += m;
    if (r.kol >= 2) mTredje += m;
    if (r.läge === "dödens") mDödens += m;
    extraVäg += m * r.kol * EXTRA_VÄG * (1 / (1 + r.kol * EXTRA_VÄG));
    if (r.läge === "instängd" && b.meter > dist - 600) instängdSent += m;
  });
  /* Utan rygg räknas i motorn (sekunder) — meter skattas med snittfart. */
  const mUtanRygg = min.ur ? null : Math.round((min.utanSkydd ?? 0) * 13);

  /* ---- Attackpunkten: sista gången hästen lämnade innerspåret ---- */
  let attack = null;
  for (let i = 1; i < bild.length; i++) {
    const förr = bild[i - 1].rader.find((x) => x.egen);
    const nu = bild[i].rader.find((x) => x.egen);
    if (förr && nu && förr.kol === 0 && nu.kol >= 1) {
      attack = { kvar: Math.max(0, dist - bild[i].meter), läge: nu.läge };
    }
  }

  /* ---- Tempot: ledarens fart i öppningen mot avslutningen ---- */
  const snittFart = (fr, till) => {
    const f = bild.filter((b) => b.meter >= fr && b.meter < till)
      .map((b) => b.rader[0]?.fart).filter(Boolean);
    return f.length ? f.reduce((a, x) => a + x, 0) / f.length : null;
  };
  const paceAv = (fart) => fart ? kmtid(1000 / (fart / 3.6)) : null;
  const tempo = {
    öppning: paceAv(snittFart(80, 700)),
    avslutning: paceAv(snittFart(dist - 700, dist - 20)),
  };

  /* ---- Kraft kvar och slutrutan ---- */
  const sistaRad = [...bild].reverse()
    .map((b) => b.rader.find((x) => x.egen)).find(Boolean);
  const kraftKvar = sistaRad ? Math.round(klamp(sistaRad.kraft)) : null;

  /* ---- Avgörandet: EN sak, viktigast först (kap 14) ---- */
  const vann = !min.ur && min.plats === 1;
  const pall = !min.ur && min.plats <= 3;
  const namn = häst?.namn ?? min.häst.namn;
  const vägrade = sim.ingripandeUtfall?.beslut === "vägrade";
  let avgörande;
  if (min.ur) {
    avgörande = `Galoppen avgjorde. ${namn} blev bortkörd — resten av loppet fanns aldrig.`;
  } else if (instängdSent > 40 && !pall) {
    avgörande = `Instängningen avgjorde. ${namn} satt fast ${Math.round(instängdSent)} meter av upploppet` +
      (kraftKvar >= 40 ? ` — med kraft kvar. Bittraste sortens förlust.` : `.`);
  } else if (vägrade) {
    avgörande = `Attacken uteblev — kusken kände en tom häst vid 500 kvar och vägrade driva. Rätt beslut av kusken; frågan är varför tanken var tom.`;
  } else if (mDödens > 250 && !vann) {
    avgörande = `Resan avgjorde. ${Math.round(mDödens)} meter i dödens kostar — ${namn} betalade för varje meter utan rygg.`;
  } else if (mDödens > 250 && vann) {
    avgörande = `Styrkan avgjorde. ${Math.round(mDödens)} meter i dödens — och ändå först över linjen. Sånt bygger rykte.`;
  } else if (vann && mLedning > dist * 0.7) {
    avgörande = `Spetsen avgjorde. ${namn} fick bestämma tempot och släppte aldrig kommandot.`;
  } else if (vann && attack && attack.kvar < 650) {
    avgörande = `Tajmingen avgjorde. Attacken kom vid ${Math.round(attack.kvar / 50) * 50} kvar — och den satt.`;
  } else if (!pall && (min.sista400 ?? 99) < 28 && kraftKvar >= 35) {
    avgörande = `Läget avgjorde. Avslutningen fanns där men vägen fram öppnade sig för sent.`;
  } else if (vann) {
    avgörande = `Helheten avgjorde. Ingen enskild vändpunkt — ${namn} var helt enkelt bäst i dag.`;
  } else {
    avgörande = `Resan speglade resultatet. ${namn} fick loppet ${pall ? "nästan " : ""}som planerat men räckte inte hela vägen.`;
  }

  /* ---- Vad hästen gjorde bra: max två, ärligt lästa ---- */
  const bra = [];
  if (pos.v1500 && pos.v1500.plats <= 3 && lopp.start === "bil") bra.push("kom perfekt ut ur bilen");
  if (pos.v1500 && pos.v1500.plats <= 3 && lopp.start === "volt") bra.push("klanderfri volt");
  if (!min.ur && !bild.some((b) => b.ur.some((u) => u.namn === namn)) && (häst?.lynne ?? 60) < 50)
    bra.push("höll gångarten trots det heta lynnet");
  if (mDödens > 200 && (min.plats ?? 99) <= 4) bra.push(`bar ${Math.round(mDödens)} meter i dödens utan att vika`);
  if ((min.sista400 ?? 99) < 27.5) bra.push(`avslutade sista 400 på ${min.sista400.toFixed(1)} — riktig fart i benen`);
  /* Även en bortkörd häst får en rad — analysen lämnar aldrig fältet
     tomt (v95-läxan: lopp med galopp gav tom "att ta med"-lista). */
  if (bra.length === 0) bra.push(min.ur
    ? "gångarten är läxan — resten av loppet fanns aldrig"
    : "gjorde ett ärligt lopp");

  /* ---- Nästa steg: förstamannens rekommendation (aldrig ett facit) ---- */
  const passning = häst ? distanspassning(häst, dist) : 1;
  const fm = förstaman;
  const fmNamn = fm ? fm.namn.split(" ")[0] : null;
  let nästaSteg;
  if (häst && häst.skada > 0) {
    nästaSteg = `Vila. ${namn} kom ur loppet ömmande — ${häst.skada} v innan vi pratar lopp igen.`;
  } else if (häst && häst.energi < 32) {
    nästaSteg = `Vila eller lugnt jobb. Tanken är tom — en start till nu vore att låna av nästa månad.`;
  } else if (häst && passning < 0.4) {
    nästaSteg = `Fel distans. ${namn} vill ha ${häst.distans.optimal} m — leta proposition närmare det i stället för ${dist}.`;
  } else if (vägrade) {
    nästaSteg = `Bygg orken innan nästa attackplan — backen eller intervaller, så finns det något att gå på med nästa gång.`;
  } else if (!pall && (min.streck ?? 20) < 8) {
    nästaSteg = `Rätt klass? Fältet var för tufft. En enklare proposition ger ${namn} chansen att vinna sig varm.`;
  } else if (vann && (min.streck ?? 0) > 40) {
    nästaSteg = `Höj klassen. ${namn} vann som favoriten ska — nästa fält får gärna bjuda mer motstånd.`;
  } else if (instängdSent > 40) {
    nästaSteg = `Samma häst, annan resa. Överväg en offensivare grundorder nästa gång — han är för bra för att sitta fast.`;
  } else {
    nästaSteg = pall
      ? `Fortsätt på inslagen väg. Formen bär — matcha vidare i samma klass.`
      : `Ingen dramatik. En vecka träning, sen tittar vi i programmen igen.`;
  }

  return {
    plan: { taktik, slutorder: slutorder ?? null, kusk: kusk?.namn ?? null },
    utfall: sim.ingripandeUtfall ?? null,
    pos, mLedning: Math.round(mLedning), mDödens: Math.round(mDödens),
    mUtanRygg, mTredje: Math.round(mTredje), extraVäg: Math.round(extraVäg),
    instängdSent: Math.round(instängdSent),
    attack, tempo, kraftKvar,
    avgörande, bra: bra.slice(0, 2),
    nästaSteg, nästaStegAv: fmNamn,
  };
}
