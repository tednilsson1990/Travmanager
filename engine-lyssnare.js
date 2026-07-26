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
import { klamp, kr, plock } from "./engine-util.js";
import { köScen } from "./engine-scener.js";
import { JOURNALISTER, TIDNINGSNAMN } from "./data-namnpaket.js";

/* ------------------------------------------------------------------ */
/* Hjälpare                                                            */
/* ------------------------------------------------------------------ */

const förnamn = (n) => (n || "").split(" ")[0];
const längder = (m) => (m == null ? null : m.toFixed(1).replace(".", ","));

/** Mentorn finns efter pensionen, så länge hen lever. Under prologen står
    hen bredvid dig; efter bortgången bärs rösten av minnet i stället. */
const mentorn = (spel) =>
  (spel.prolog?.mentor && !spel.prolog?.aktiv && !spel.prolog?.mentor?.borta)
    ? spel.prolog.mentor : null;

/**
 * Huvudnyheten på Hem. Sedan v61 är den EFTERKLANGEN: ögonblicket visas
 * först som helskärmsscen (engine-scener), och när spelaren gått vidare
 * ligger samma uppslag kvar på Hem som veckans stora rubrik. En källa,
 * två visningar. Den skrivs bara av det som verkligen bär ett uppslag;
 * får allt en stor rubrik känns ingenting stort.
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
  spel.logg?.unshift(plock([
    `<b>${m.namn}</b> ringde på kvällen. »Jag såg loppet. Första segern glömmer man aldrig — min kom också på ${h.data?.bana ?? "hemmabanan"}.«`,
    `<b>${m.namn}</b> ringde. »Nu börjar det. Skriv upp datumet någonstans — du kommer vilja minnas det.«`,
    `<b>${m.namn}</b> lämnade ett meddelande: »Såg det på skärmen. Gården har vunnit lopp igen. Tack.«`,
  ]));
});

påHändelse("storloppsseger", (spel, h) => {
  const m = mentorn(spel);
  if (!m) return;
  skrivPress(spel, `${m.namn}: »Nu är gården i bättre händer än mina«`,
    `Den gamle tränaren om ${h.aktörer?.hästNamn ?? "stallets"} triumf`, "positiv",
    null, 0, JOURNALISTER.krönikör);
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
    rubrik: dödens ? plock(["KROSSADE MOTSTÅNDET", "STARKAST NÄR DET KOSTADE", "VANN UTAN RYGG — VANN ÄNDÅ"])
      : skräll ? plock(["SKRÄLLEN INGEN SÅG KOMMA", "SPELARNA FICK FEL — REJÄLT", "OUTSIDERN SOM VISSTE BÄST"])
      : spets ? plock(["LEDDE FRÅN START TILL MÅL", "SPETS, LUGN OCH SEDAN AVGÖRANDE", "INGEN KOM ENS NÄRA"])
      : plock(["STALLETS STÖRSTA KVÄLL", "KVÄLLEN ALLT FÖLL PÅ PLATS", "SEGERN SOM BYGGDES I ÅR AV JOBB"]),
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
    citat: dödens ? plock([
        "Hon fick göra allt jobbet själv. Att hon ändå orkar hela vägen — det säger allt.",
        "Utvändigt varvet runt. Det finns hästar som inte vet vad det kostar. Det här är en av dem.",
      ])
      : skräll ? plock([
        "Vi visste mer än spelarna den här gången.",
        "Ingen trodde på oss. Vi behövde inte fler än oss själva.",
      ])
      : plock(["Precis loppet vi ville ha.", "Allt satt. Sådana kvällar tackar man för."]),
    citatVem: h.aktörer?.kuskNamn ? `${h.aktörer.kuskNamn}, kusk` : "Stallet",
  });

  /* Framgång föder ambition: förstamannen ser vad hen är med och bygger. */
  if (spel.förstaman && !spel.förstaman.delägare)
    spel.förstaman.ambition = klamp((spel.förstaman.ambition ?? 20) + 8);
  läggTrofé(spel, {
    typ: "storlopp", rubrik: d.lopp ?? "Storlopp",
    häst: namn, hästId: h.aktörer?.hästId, bana: d.bana,
    text: `Vann ${d.lopp ?? "storloppet"}${d.bana ? ` på ${d.bana}` : ""}.`,
  });
  spel.renommé = klamp(spel.renommé + 3);

  /* Helskärmsscenen — med segerintervjun som val. Samma text som
     uppslaget: en källa, två visningar. */
  köScen(spel, {
    betydelse: h.betydelse, bild: "seger-storlopp", bildreserv: "seger", stil: "tidning",
    signatur: JOURNALISTER.krönikör,
    etikett: spel.huvudnyhet.etikett, rubrik: spel.huvudnyhet.rubrik,
    ingress: spel.huvudnyhet.ingress, fakta: spel.huvudnyhet.fakta,
    citat: spel.huvudnyhet.citat, citatVem: spel.huvudnyhet.citatVem,
    fråga: `${TIDNINGSNAMN} sträcker fram mikrofonen. Vad säger du?`,
    data: { hästId: h.aktörer?.hästId, kuskNamn: h.aktörer?.kuskNamn },
    val: [
      { id: "upp", effekt: "intervju_tala_upp",
        text: "»Det här är bara början.«", följd: "Hypen stiger — och förväntningarna" },
      { id: "lugn", effekt: "intervju_ödmjuk",
        text: "»En bra dag. Vi tar nästa lopp när det kommer.«", följd: "Spelarna uppskattar måttfullheten" },
      { id: "kusk", effekt: "intervju_hylla_kusken",
        text: `»Segern är ${h.aktörer?.kuskNamn ?? "kuskens"}.«`, följd: "Relationen till kusken stärks" },
    ],
  });
});

påHändelse("miljonen", (spel, h) => {
  const namn = h.aktörer?.hästNamn ?? "Hästen";
  skrivPress(spel, `${namn} passerade miljonen`,
    `${spel.stallnamn} har fostrat en miljonär.`, "bra", null, 0, JOURNALISTER.siffror);
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
    `Femte mötet på kort tid. Ställningen ${d.dinaSegrar}–${d.hansSegrar}.`, "neutral",
    null, 0, JOURNALISTER.nyheter);
});

påHändelse("gårdsrekord", (spel, h) => {
  läggTrofé(spel, {
    typ: "rekord", rubrik: "Gårdsrekord",
    text: h.data?.text ?? "Nytt gårdsrekord.",
  });
  /* Rekordet som faller är gårdens historia som skrivs om — en scen,
     med mentorns ord som citat. Inga val: vissa ögonblick ska bara få
     vara. */
  köScen(spel, {
    betydelse: h.betydelse, bild: "rekord", bildreserv: "gard-hero", stil: "tidning",
    signatur: JOURNALISTER.siffror,
    etikett: "GÅRDENS HISTORIA",
    rubrik: "REKORDET FALLER",
    ingress: h.data?.text ?? "Ett gårdsrekord har fallit.",
    citat: `${h.data?.text ?? "Rekordet"}. Jag hade det i ${h.data?.gammaltÅr ?? "många"} år. Det är rätt att det faller.`,
    citatVem: mentorn(spel)?.namn ?? spel.stallnamn,
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
    ? plock([
        `»Jag har väntat hela livet på en sådan kväll. Tack för att du tog hand om ${namn}.«`,
        `»Jag grät på upploppet. Skäms inte ett dugg. ${namn}!«`,
        `»Farsan köpte sin första häst 1974. Han hade älskat det här.«`,
      ])
    : h.typ === "miljonen"
      ? plock([
          `»En miljon. Vem hade trott det när vi köpte ${namn}.«`,
          `»Jag har ramen till miljondiplomet klar sedan i våras. Nu åker det upp.«`,
        ])
      : h.typ === "första_seger"
        ? plock([
            `»Första segern! Jag stod vid mållinjen och skrek.«`,
            `»Nu vet ${namn} hur det känns. Det ändrar allt, sa alltid min far.«`,
          ])
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
    /* Står stoet i avelshagen finns ett verkligt val: behåll för avel —
       och chansen till arvet — eller sälj till ett bud som växer med
       meriterna. Pengar nu mot generationer sen. */
    const iHagen = (spel.avelsston ?? []).some((m) => m.id === h.aktörer?.hästId);
    const bud = iHagen
      ? Math.round((80000 + (d.segrar ?? 0) * 25000 + (d.intjänat ?? 0) * 0.1) / 5000) * 5000
      : 0;
    köScen(spel, {
      betydelse: h.betydelse, bild: "avsked", bildreserv: "gard-hero", stil: "tidning",
      signatur: JOURNALISTER.krönikör,
      etikett: "AVSKED",
      rubrik: `${namn.toUpperCase()} SLUTAR`,
      ingress: `${d.starter ?? 0} starter, ${d.segrar ?? 0} segrar och ${kr(d.intjänat ?? 0)} kr insprunget.`,
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
      ...(iHagen ? {
        fråga: `En uppfödare har hört av sig med ett bud på ${kr(bud)} kr. Vad gör du?`,
        data: { hästId: h.aktörer?.hästId, hästNamn: namn, bud },
        val: [
          { id: "behåll", effekt: "pension_behåll",
            text: "Hon stannar i avelshagen", följd: "Avkommorna — och kanske arvet" },
          { id: "sälj", effekt: "pension_sälj",
            text: `Sälj för ${kr(bud)} kr`, följd: "Pengar nu, men blodslinjen lämnar gården" },
        ],
      } : {}),
    });
  }
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
    d.segrar > 0 ? "bra" : "neutral", null, 0, JOURNALISTER.krönikör);
});

/* ------------------------------------------------------------------ */
/* Arvet — designdokumentets slutscen                                  */
/* ------------------------------------------------------------------ */

påHändelse("arvet", (spel, h) => {
  const d = h.data ?? {};
  const namn = h.aktörer?.hästNamn ?? "Dottern";
  sättHuvudnyhet(spel, {
    betydelse: h.betydelse,
    etikett: `${d.bana ?? ""} · ARVET`,
    rubrik: "SOM SIN MOR",
    ingress: `${namn} vann ${d.lopp} — samma lopp som ${d.mor ?? "hennes mor"} vann säsong ${d.morSäsong}. Två generationer, en gård, ett lopp.`,
    fakta: [
      { etikett: "Lopp", värde: d.lopp ?? "" },
      { etikett: "Modern vann", värde: `säsong ${d.morSäsong}` },
      d.marginal && { etikett: "Marginal", värde: `${längder(d.marginal)} längder` },
      d.streck != null && { etikett: "Spelprocent", värde: `${Math.round(d.streck)} %` },
    ].filter(Boolean),
    citat: "Jag stod på läktaren när mamman vann. Nu stod jag här igen. Vissa cirklar sluts.",
    citatVem: mentorn(spel)?.namn ?? spel.stallnamn,
  });
  läggTrofé(spel, {
    typ: "arvet", rubrik: "Arvet", häst: namn, hästId: h.aktörer?.hästId,
    text: `${namn} vann ${d.lopp}, samma lopp som sin mor ${d.mor ?? ""}.`,
  });
  /* Mentorn på läktaren — slutmålets bild. Registrerad i loggen så att
     den finns kvar i veckans berättelse, inte bara i en rubrik. */
  const m = mentorn(spel);
  if (m) spel.logg?.unshift(
    `<b>${m.namn}</b> stod på läktaren. Efteråt sa hen bara: »Jag såg ${d.mor ?? "modern"} vinna det här. Nu såg jag dottern. Tack.«`);
  else if (spel.prolog?.mentor?.borta) spel.logg?.unshift(
    `På läktaren saknades en. Men ${spel.prolog.mentor.namn} såg ${d.mor ?? "modern"} vinna det här en gång — och i dag bar loppet vidare det hen byggde.`);
  spel.renommé = klamp(spel.renommé + 5);

  köScen(spel, {
    betydelse: h.betydelse, bild: "arv", bildreserv: "seger", stil: "tidning",
    signatur: JOURNALISTER.krönikör,
    etikett: spel.huvudnyhet.etikett, rubrik: spel.huvudnyhet.rubrik,
    ingress: spel.huvudnyhet.ingress, fakta: spel.huvudnyhet.fakta,
    citat: spel.huvudnyhet.citat, citatVem: spel.huvudnyhet.citatVem,
    brödtext: [
      `Det var på ${d.bana ?? "banan"} modern en gång gjorde det. I går kväll gjorde dottern om det — samma lopp, samma gård, en generation senare.`,
      `På läktaren stod gårdens gamle tränare. Efteråt sa hen bara ett ord: tack.`,
    ],
  });
});

/* Laddningen inför ett storlopp: förstamannen har en åsikt om upplägget. */
påHändelse("storloppsladdning", (spel, h) => {
  const fm = spel.förstaman;
  if (!fm) return;
  const namn = h.aktörer?.hästNamn ?? "hästen";
  const d = h.data ?? {};
  spel.logg?.unshift(`<b>${förnamn(fm.namn)}</b>: ${fm.profil === "fostrare"
    ? `»En vecka till ${d.lopp}. Jag vill se ${namn} på lugna jobb — formen finns, den ska inte slösas på träningsbanan.«`
    : fm.profil === "taktiker"
      ? `»${d.motståndare ? d.motståndare + " är hästen att slå i " + d.lopp : "Fältet i " + d.lopp + " tar form"}. Jag har börjat titta på spårstatistiken.«`
      : `»${d.lopp} nästa vecka. Ett vasst jobb till, sedan är ${namn} redo.«`}`);
});

/* ------------------------------------------------------------------ */
/* Eleven slog mästaren — rivalitetens födelse                          */
/* ------------------------------------------------------------------ */

påHändelse("eleven_slog_mästaren", (spel, h) => {
  const d = h.data ?? {};
  sättHuvudnyhet(spel, {
    betydelse: h.betydelse,
    etikett: "GAMLA BEKANTA",
    rubrik: "ELEVEN SLOG MÄSTAREN",
    ingress: `${d.tränare} vann med ${d.häst} — före sitt gamla stall. Den som en gång krattade din rakbana står nu överst på din prispall.`,
    citat: "Allt jag kan har jag lärt mig där. Det är därför jag visste hur jag skulle slå dem.",
    citatVem: d.tränare,
  });
  köScen(spel, {
    betydelse: h.betydelse, bild: "rivaler", bildreserv: "bana-kvall", stil: "tidning",
    signatur: JOURNALISTER.nyheter,
    etikett: "GAMLA BEKANTA",
    rubrik: "ELEVEN SLOG MÄSTAREN",
    ingress: `${d.tränare} vann med ${d.häst} — före sitt gamla stall. Ni skildes som vänner. Ni möts som konkurrenter.`,
    citat: "Allt jag kan har jag lärt mig där. Det är därför jag visste hur jag skulle slå dem.",
    citatVem: d.tränare,
  });
  const m = mentorn(spel);
  if (m) spel.logg?.unshift(
    `<b>${m.namn}</b> ringde, road: »Så känns det. Jag minns när DU först slog MIG. Cirkeln har inga ändar.«`);
});

export const lyssnareInkopplade = true;
