/**
 * SCENERNA — de stora ögonblicken på helskärm
 *
 * Ett storlopp vunnet, ett arv fullbordat, en trotjänare som slutar —
 * sådant förtjänar mer plats än en ruta högst upp på Hem. Scenerna tar
 * över hela skärmen som prologens gör: bild, rubrik, ingress, faktaruta,
 * citat — och ibland ett VAL. Först när spelaren går vidare släpps hen
 * tillbaka till vardagsvyn, och ögonblicket bor sedan kvar som uppslag
 * på Hem.
 *
 * Kön (spel.scener) är serialiserbar: stängs appen mitt i står scenen
 * kvar vid nästa start. Därför får en scen ALDRIG bära funktioner —
 * valen är typ + data, och effekterna bor i VALEFFEKTER här. En okänd
 * valtyp gör ingenting i stället för att krascha: en gammal sparfil med
 * en scen från en nyare version ska degradera snällt.
 *
 * DESIGNGRÄNS: scenerna är berättelsens yta. De läser händelsedata och
 * gör begränsade, väldokumenterade effekter (kassa, hype, renommé,
 * avelshagen). De rör aldrig loppmotorn.
 */
import { klamp } from "./engine-util.js";
import { skrivPress } from "./engine-vecka.js";

/** Lägg en scen i kön. Viktigast först; högst fem — resten är inte scener. */
export function köScen(spel, scen) {
  spel.scener = spel.scener ?? [];
  spel.scener.push({ säsong: spel.säsong ?? 1, vecka: spel.vecka, ...scen });
  spel.scener.sort((a, b) => (b.betydelse ?? 0) - (a.betydelse ?? 0));
  spel.scener = spel.scener.slice(0, 5);
}

/* ------------------------------------------------------------------ */
/* Valens effekter                                                     */
/* ------------------------------------------------------------------ */

const VALEFFEKTER = {
  /* Segerintervjun. Vad du säger efter ett storlopp sätter tonen: talar
     du upp hästen stiger hypen (och nästa lopps förväntan), håller du
     igen behåller du utrymmet hos spelarna, hyllar du kusken byggs
     relationen. Små effekter — det är tonen, inte en ny motor. */
  intervju_tala_upp(spel, scen) {
    const h = spel.stall.find((x) => x.id === scen.data?.hästId);
    if (h) h.hype = klamp(h.hype + 12);
    spel.renommé = klamp(spel.renommé + 1);
    skrivPress(spel, `»Det här är bara början« — Björkhaga om ${h?.namn ?? "segraren"}`,
      "Tränaren stack inte under stol med ambitionerna.", "bra");
  },
  intervju_ödmjuk(spel, scen) {
    const h = spel.stall.find((x) => x.id === scen.data?.hästId);
    if (h) h.hype = klamp(h.hype - 4);
    spel.spelförtroende = klamp(spel.spelförtroende + 2);
    skrivPress(spel, `Björkhaga tonar ner efter triumfen`,
      "»En bra dag. Vi tar nästa lopp när det kommer.«", "neutral");
  },
  intervju_hylla_kusken(spel, scen) {
    const kusk = scen.data?.kuskNamn;
    if (kusk) spel.kuskrelation[kusk] =
      klamp((spel.kuskrelation[kusk] ?? 50) + 6);
    skrivPress(spel, `»Segern är ${kusk ?? "kuskens"}«`,
      "Tränaren gav all ära åt sulkyn.", "bra");
  },

  /* Trotjänarens pension: hagen eller avelsköparen. Att sälja ger pengar
     nu; att behålla ger avkommorna — och chansen till arvet. Det är
     generationsspelets första riktiga avvägning. */
  pension_behåll(spel, scen) {
    /* Stoet ligger redan i avelshagen (säsongsmotorn la henne där).
       Valet bekräftar — och pressen noterar långsiktigheten. */
    skrivPress(spel, `${scen.data?.hästNamn ?? "Stjärnan"} stannar på gården`,
      "Björkhaga behåller sitt stjärnsto för avel.", "positiv");
  },
  pension_sälj(spel, scen) {
    const id = scen.data?.hästId;
    const bud = scen.data?.bud ?? 150000;
    spel.avelsston = (spel.avelsston ?? []).filter((m) => m.id !== id);
    spel.kassa += bud;
    skrivPress(spel, `${scen.data?.hästNamn ?? "Stjärnan"} såld till avel`,
      `Budet på ${Math.round(bud / 1000)} tkr gick inte att tacka nej till.`, "neutral");
  },
};

/**
 * Utför valet och plocka scenen ur kön. Anropas från scenvyn via
 * uppdatera() så att allt sparas i samma svep.
 */
export function görVal(spel, scenIndex, valId) {
  const scen = (spel.scener ?? [])[scenIndex];
  if (!scen) return;
  const val = (scen.val ?? []).find((v) => v.id === valId);
  /* En scen MED val får bara stängas av ett giltigt val. Ett felskickat
     id (t.ex. ur en gammal sparfil) ska inte tyst förbruka spelarens
     beslut — scenen står kvar och frågar igen. En okänd EFFEKT är däremot
     ett versionsglapp: valet är gjort, scenen stängs, effekten uteblir. */
  if ((scen.val ?? []).length > 0 && !val) return;
  const effekt = val && VALEFFEKTER[val.effekt];
  if (effekt) {
    try { effekt(spel, scen, val); }
    catch (fel) { spel.logg?.push(`<b>Fel i scenval:</b> ${fel?.message || fel}`); }
  }
  spel.scener.splice(scenIndex, 1);
}

/** Gå vidare utan val (eller scen utan val). */
export function stängScen(spel, scenIndex = 0) {
  (spel.scener ?? []).splice(scenIndex, 1);
}
