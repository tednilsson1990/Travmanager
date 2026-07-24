/**
 * LYSSNARNA — en händelse, många reaktioner
 *
 * Här bor allt som HÄNDER när något registreras i händelsemotorn: pressen
 * skriver, mentorn ringer, ägaren hör av sig, förstamannen kommenterar,
 * troféen hamnar i skåpet, renommét rör sig, och krönikan får sin post.
 *
 * Före v59 låg mentorns repliker inne i registreraHändelse och allt annat
 * spritt i vyerna som egna textrutor. Följden var att en storloppsseger
 * skrevs på fem ställen med fem olika sanningar. Nu står allt här, och en
 * ny berättelse är en registrering till — inte en ändring i motorn.
 *
 * Filen importeras för sin SIDOEFFEKT: att importera den kopplar in
 * lyssnarna. engine-vecka.js gör det, och därmed är de på plats innan
 * något lopp körs.
 */
import { påHändelse } from "./engine-handelser.js";
import { skrivPress } from "./engine-vecka.js";
import { klamp, kr } from "./engine-util.js";

/* ------------------------------------------------------------------ */
/* Hjälpare                                                            */
/* ------------------------------------------------------------------ */

const förnamn = (n) => (n || "").split(" ")[0];
const längder = (m) => (m == null ? null : m.toFixed(1).replace(".", ","));

/** Mentorn finns bara efter pensionen — under prologen står hen bredvid dig. */
const mentorn = (spel) =>
  (spel.prolog?.mentor && !spel.prolog?.aktiv) ? spel.prolog.mentor : null;

/**
 * Huvudnyheten på Hem. Rikare än en pressnotis: rubrik, ingress, faktaruta
 * och citat — skisserna panel 3. Den skrivs bara av det som verkligen bär
 * ett uppslag; får allt en stor rubrik känns ingenting stort.
 */
function sättHuvudnyhet(spel, nyhet) {
  const gammal = spel.huvudnyhet;
  if (gammal && gammal.säsong === (spel.säsong ?? 1) && gammal.vecka === spel.vecka
      && (gammal.betydelse ?? 0) > (nyhet.betydelse ?? 0)) return;
  spel.huvudnyhet = { säsong: spel.säsong ?? 1, vecka: spel.vecka, ...nyhet };
}

/** Troférummet — gårdens fysiska minne. Fas 5, men grunden läggs nu. */
function läggTrofé(spel, trofé) {
  spel.troférum = spel.troférum ?? [];
  spel.troférum.unshift({ säsong: spel.säsong ?? 1, vecka: spel.vecka, ...trofé });
  spel.troférum = spel.troférum.slice(0, 60);
}

/* ------------------------------------------------------------------ */
/* Mentorn — hen följer karriären efter pensionen                      */
/* ------------------------------------------------------------------ */

påHändelse("första_seger", (spel, h) => {
  const m = mentorn(spel);
  if (!m) return;
  spel.logg?.unshift(
    `<b>${m.namn}</b> ringde på kvällen. »Jag såg loppet. Första segern glömmer man aldrig — min kom också på ${h.data?.bana ?? "hemmabanan"}.«`
  );
});

påHändelse("storloppsseger", (spel, h) => {
  const m = mentorn(spel);
  if (!m) return;
  skrivPress(spel, `${m.namn}: »Nu är gården i bättre händer än mina«`,
    `Den gamle tränaren om ${h.aktörer?.hästNamn ?? "stallets"} triumf`, "positiv");
});

påHändelse("gårdsrekord", (spel, h) => {
  const m = mentorn(spel);
  if (!m) return;
  spel.logg?.unshift(
    `<b>${m.namn}</b> hörde av sig: »${h.data?.text ?? "Rekordet"}. Jag hade det i ${h.data?.gammaltÅr ?? "många"} år. Det är rätt att det faller.«`
  );
});

påHändelse("pensionering", (spel, h) => {
  const m = mentorn(spel);
  if (!m || (h.betydelse ?? 0) < 45) return;
  spel.logg?.unshift(
    `<b>${m.namn}</b>: »${h.aktörer?.hästNamn ?? "Hästen"} förtjänar sina år på hagen. Glöm inte att gå ut och klappa den ibland.«`
  );
});

/* ------------------------------------------------------------------ */
/* Pressen och Hem                                                     */
/* ------------------------------------------------------------------ */

påHändelse("storloppsseger", (spel, h) => {
  const d = h.data ?? {};
  const namn = h.aktörer?.hästNamn ?? "Stallets häst";
  const dödens = (d.meterUtanRygg ?? 0) > 280;
  const skräll = (d.streck ?? 100) < 12;
  const spets = d.position1000 === "ledningen";

  sättHuvudnyhet(spel, {
    betydelse: h.betydelse,
    etikett: `${d.bana ?? ""} · STORLOPP`,
    rubrik: dödens ? "KROSSADE MOTSTÅNDET"
      : skräll ? "SKRÄLLEN INGEN SÅG KOMMA"
      : spets ? "LEDDE FRÅN START TILL MÅL"
      : "STALLETS STÖRSTA KVÄLL",
    ingress: dödens
      ? `${namn} vann från dödens — ${d.meterUtanRygg} meter utan rygg, och ändå starkast på upploppet.`
      : skräll ? `Bara ${Math.round(d.streck)} % av spelarna trodde på ${namn}. ${h.aktörer?.kuskNamn ?? "Kusken"} visste bättre.`
      : spets ? `${h.aktörer?.kuskNamn ?? "Kusken"} tog kommandot direkt med ${namn} och släppte det aldrig.`
      : `${namn} vann ${d.lopp ?? "storloppet"} när det gällde som mest.`,
    fakta: [
      d.lopp && { etikett: "Lopp", värde: d.lopp },
      d.segertid && { etikett: "Segertid", värde: d.segertid.toFixed(1).replace(".", ",") },
      d.marginal && { etikett: "Marginal", värde: `${längder(d.marginal)} längder` },
      d.streck != null && { etikett: "Spelprocent", värde: `${Math.round(d.streck)} %` },
      d.position1000 && { etikett: "Vid 1 000 m", värde: d.position1000 },
      d.meterUtanRygg ? { etikett: "Utan rygg", värde: `ca ${d.meterUtanRygg} m` } : null,
    ].filter(Boolean),
    citat: dödens ? "Hon fick göra allt jobbet själv. Att hon ändå orkar hela vägen — det säger allt."
      : skräll ? "Vi visste mer än spelarna den här gången."
      : "Precis loppet vi ville ha.",
    citatVem: h.aktörer?.kuskNamn ? `${h.aktörer.kuskNamn}, kusk` : "Stallet",
  });

  läggTrofé(spel, {
    typ: "storlopp", rubrik: d.lopp ?? "Storlopp",
    häst: namn, hästId: h.aktörer?.hästId, bana: d.bana,
    text: `Vann ${d.lopp ?? "storloppet"}${d.bana ? ` på ${d.bana}` : ""}.`,
  });
  spel.renommé = klamp(spel.renommé + 3);
});

påHändelse("miljonen", (spel, h) => {
  const namn = h.aktörer?.hästNamn ?? "Hästen";
  skrivPress(spel, `${namn} passerade miljonen`,
    `${spel.stallnamn} har fostrat en miljonär.`, "bra");
  läggTrofé(spel, {
    typ: "miljonen", rubrik: "Miljonären", häst: namn,
    hästId: h.aktörer?.hästId, text: `${namn} passerade en miljon i insprunget.`,
  });
  spel.renommé = klamp(spel.renommé + 2);
});

påHändelse("rivalitet", (spel, h) => {
  const d = h.data ?? {};
  const namn = h.aktörer?.hästNamn ?? "Hästen";
  skrivPress(spel, `${namn} mot ${d.rival} — igen`,
    `Fjärde mötet på kort tid. Ställningen ${d.dinaSegrar}–${d.hansSegrar}.`, "neutral");
});

påHändelse("gårdsrekord", (spel, h) => {
  läggTrofé(spel, {
    typ: "rekord", rubrik: "Gårdsrekord",
    text: h.data?.text ?? "Nytt gårdsrekord.",
  });
});

/* ------------------------------------------------------------------ */
/* Ägaren — hen äger hästen och reagerar på dess liv                   */
/* ------------------------------------------------------------------ */

påHändelse("*", (spel, h) => {
  const ägare = h.aktörer?.ägare;
  if (!ägare || (h.betydelse ?? 0) < 50) return;
  const namn = h.aktörer?.hästNamn ?? "hästen";
  const text = h.typ === "storloppsseger"
    ? `»Jag har väntat hela livet på en sådan kväll. Tack för att du tog hand om ${namn}.«`
    : h.typ === "miljonen"
      ? `»En miljon. Vem hade trott det när vi köpte ${namn}.«`
      : h.typ === "första_seger"
        ? `»Första segern! Jag stod vid mållinjen och skrek.«`
        : null;
  if (text) spel.logg?.unshift(`<b>${ägare}</b> hörde av sig: ${text}`);
});

/* ------------------------------------------------------------------ */
/* Förstamannen — hen såg samma lopp som du                            */
/* ------------------------------------------------------------------ */

påHändelse("*", (spel, h) => {
  const fm = spel.förstaman;
  if (!fm || (h.betydelse ?? 0) < 55) return;
  const namn = h.aktörer?.hästNamn ?? "hästen";
  const d = h.data ?? {};
  let text = null;
  if (h.typ === "storloppsseger") {
    text = d.position1000 === "dödens"
      ? `»Utvändigt hela vägen och ändå starkast. Den där hästen har en tank jag inte visste om.«`
      : fm.profil === "fostrare"
        ? `»Nu tar vi ner ${namn} ett par veckor. Sådana kvällar kostar mer än de syns.«`
        : `»Vi tar nästa också. ${namn} är inte klar för säsongen.«`;
  } else if (h.typ === "första_seger") {
    text = `»Det där satt. ${namn} behövde få känna hur det är att vinna.«`;
  } else if (h.typ === "rivalitet") {
    text = `»${d.rival} dyker upp i vartenda lopp vi anmäler till. Vi får börja välja lopp efter var den INTE står.«`;
  }
  if (text) spel.logg?.unshift(`<b>${förnamn(fm.namn)}</b>: ${text}`);
});

/* ------------------------------------------------------------------ */
/* Pensioneringen — karriärens sista rubrik                            */
/* ------------------------------------------------------------------ */

påHändelse("pensionering", (spel, h) => {
  const d = h.data ?? {};
  const namn = h.aktörer?.hästNamn ?? "Hästen";
  if ((h.betydelse ?? 0) >= 55) {
    sättHuvudnyhet(spel, {
      betydelse: h.betydelse,
      etikett: "AVSKED",
      rubrik: `${namn.toUpperCase()} SLUTAR`,
      ingress: `${d.starter ?? 0} starter, ${d.segrar ?? 0} segrar och ${kr(d.intjänat ?? 0)} kr insprunget. `
        + `${d.gårdsveteran ? "Hen blir kvar på gården." : "Nu väntar lugnet."}`,
      fakta: [
        { etikett: "Ålder", värde: `${d.ålder ?? "?"} år` },
        { etikett: "Starter", värde: String(d.starter ?? 0) },
        { etikett: "Segrar", värde: String(d.segrar ?? 0) },
        { etikett: "Insprunget", värde: `${kr(d.intjänat ?? 0)} kr` },
      ],
      citat: d.segrar > 0
        ? "Den hästen gav oss allt den hade, varje gång vi bad om det."
        : "Alla hästar bär inte pokaler hem. Den här bar stallet.",
      citatVem: spel.stallnamn,
    });
    läggTrofé(spel, {
      typ: "veteran", rubrik: "Karriären", häst: namn, hästId: h.aktörer?.hästId,
      text: `${d.starter ?? 0} starter, ${d.segrar ?? 0} segrar, ${kr(d.intjänat ?? 0)} kr.`,
    });
  }
  skrivPress(spel, `${namn} avslutar karriären`,
    `${d.starter ?? 0} starter och ${d.segrar ?? 0} segrar för ${spel.stallnamn}.`,
    d.segrar > 0 ? "bra" : "neutral");
});

export const lyssnareInkopplade = true;
