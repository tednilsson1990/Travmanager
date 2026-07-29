/**
 * HÄNDELSEMOTORN — spelets strukturerade minne och dess buss
 *
 * Allt som betyder något registreras här: typ, betydelse (0–100), aktörer
 * och data. Krönikan (spel.krönika) överlever veckorna — till skillnad
 * från loggen som rensas — och är grunden för säsongskrönikor, mentorns
 * reaktioner, gårdshistorien och framtida berättelsetrådar.
 *
 * Principen: EN registrering, flera reaktioner. Pressen, mentorn, ägarna,
 * troférummet och historiken LYSSNAR på samma händelse i stället för att
 * varje vy hittar på egna texter.
 *
 * DESIGNGRÄNS: den här filen känner inte till någon annan modul. Den vet
 * inte vad press är, inte vad en mentor är. Reaktionerna bor i
 * engine-lyssnare.js och registrerar sig med påHändelse(). Utan den gränsen
 * växer motorn tillbaka till den hårdkodade klump den var i v58, och varje
 * ny berättelse kräver en ändring mitt i registreringen.
 *
 * AKTÖRER ÄR ID:N. `aktörer: { hästId, kuskNamn, ägare, förstamanId }`.
 * Namn duger till text men inte till minne: en häst kan säljas, en kusk
 * byta stall, och fas 4–5 (rivaliteter, avkommor, återkommande personer)
 * kräver att aktören går att slå upp år senare. Visningsnamnet följer med
 * som `aktörer.hästNamn` så att gamla texter inte behöver en uppslagning.
 */

let nästaHändelseId = 1;
export const sättHändelseRäknare = (n) => { nästaHändelseId = n; };
export const händelseRäknare = () => nästaHändelseId;

/* ------------------------------------------------------------------ */
/* Bussen                                                              */
/* ------------------------------------------------------------------ */

const lyssnare = new Map();

/**
 * Registrera en reaktion. `typ` är händelsetypen eller "*" för alla.
 * Hanteraren körs synkront i registreringsordning med (spel, händelse).
 *
 * Ett fel i en lyssnare får aldrig stoppa de andra eller fälla loppet som
 * pågår — då blir en trasig pressrubrik till svart skärm. Felet loggas i
 * spel.logg så att det syns i stället för att försvinna.
 */
export function påHändelse(typ, hanterare) {
  if (!lyssnare.has(typ)) lyssnare.set(typ, []);
  lyssnare.get(typ).push(hanterare);
  return () => {
    const lista = lyssnare.get(typ) || [];
    const i = lista.indexOf(hanterare);
    if (i >= 0) lista.splice(i, 1);
  };
}

/** Bara för tester: töm bussen. */
export const nollställLyssnare = () => lyssnare.clear();

function sänd(spel, post) {
  const träffar = [...(lyssnare.get(post.typ) || []), ...(lyssnare.get("*") || [])];
  for (const h of träffar) {
    try { h(spel, post); }
    catch (fel) {
      spel.logg?.push(`<b>Fel i reaktion på ${post.typ}:</b> ${fel?.message || fel}`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Registrering                                                        */
/* ------------------------------------------------------------------ */

/**
 * Normaliserar aktörerna. Äldre anrop skickade `{ häst: "Namnet" }`; de
 * fortsätter fungera och får hästNamn ifyllt. Nya anrop skickar id:n.
 */
function normaliseraAktörer(spel, a = {}) {
  const ut = { ...a };
  if (typeof ut.häst === "string" && !ut.hästNamn) ut.hästNamn = ut.häst;
  if (ut.hästId != null && !ut.hästNamn) {
    const h = slåUppHäst(spel, ut.hästId);
    if (h) ut.hästNamn = h.namn;
  }
  delete ut.häst;
  if (ut.förstamanId == null && spel.förstaman) ut.förstamanId = spel.förstaman.namn;
  return ut;
}

export function registreraHändelse(spel, händelse) {
  spel.krönika = spel.krönika ?? [];
  const post = {
    id: `h${nästaHändelseId++}`,
    säsong: spel.säsong ?? 1,
    vecka: spel.vecka,
    betydelse: 50,
    ...händelse,
    aktörer: normaliseraAktörer(spel, händelse.aktörer),
  };
  spel.krönika.push(post);
  if (spel.krönika.length > 400) spel.krönika = spel.krönika.slice(-400);
  sänd(spel, post);
  return post;
}

/* ------------------------------------------------------------------ */
/* Uppslagning                                                         */
/* ------------------------------------------------------------------ */

/** Hästen med det id:t — i stallet först, sedan i världen. Kan vara borta. */
export function slåUppHäst(spel, id) {
  if (id == null) return null;
  return (spel.stall || []).find((h) => h.id === id)
    ?? (spel.värld?.hästar || []).find((h) => h.id === id)
    ?? null;
}

/** Händelser där en viss aktör medverkar — grunden för biografier. */
export const händelserOm = (spel, nyckel, värde) =>
  (spel.krönika ?? []).filter((h) => h.aktörer?.[nyckel] === värde);

/** Säsongens viktigaste händelser, för krönikan vid säsongsslut. */
export const säsongsHändelser = (spel, säsong) =>
  (spel.krönika ?? []).filter((h) => h.säsong === säsong)
    .sort((a, b) => b.betydelse - a.betydelse);

/* ------------------------------------------------------------------ */
/* Loppfakta                                                           */
/* ------------------------------------------------------------------ */

/**
 * Plockar ut loppets berättande fakta ur simuleringen EN gång, så att alla
 * lyssnare läser samma siffror. Före v59 räknade segerartikeln ut marginal
 * och meter utan rygg på egen hand, och ingen annan kom åt dem.
 *
 * `position1000` läses ur bildrutan närmast 1 000 meter kvar — samma mått
 * som källmaterialet och kalibreringen använder. Funktionen rör aldrig
 * simuleringen och drar aldrig slump: kalibreringen påverkas inte.
 */
export function loppfakta(sim, min, lopp, häst) {
  const fakta = {
    favorit: null, position1000: null, meterUtanRygg: null,
    marginal: null, segertid: null, streck: min?.streck ?? null,
    rivalId: null, rivalNamn: null, möten: [],
  };
  if (!sim || !min) return fakta;

  /* Var favoriten den mest streckade, och var det du? */
  const alla = sim.resultat || [];
  const mestStreckad = [...alla].sort((a, b) => (b.streck ?? 0) - (a.streck ?? 0))[0];
  fakta.favorit = !!(mestStreckad && häst && mestStreckad.häst?.namn === häst.namn);

  if (!min.ur) {
    fakta.segertid = min.km ?? null;
    const bakom = alla.find((r) => r.plats === (min.plats ?? 0) + 1);
    if (bakom && bakom.sek != null && min.sek != null)
      fakta.marginal = Math.max(0.1, (bakom.sek - min.sek) * 5.5);
    /* Meter utan rygg: tiden i dödens gånger fältets ungefärliga marschfart
       (13 m/s). Grovt men konsekvent — samma tal överallt i spelet. */
    if (min.dödensTid != null) fakta.meterUtanRygg = Math.round(min.dödensTid * 13);
  }

  /* Position 1 000 meter från mål, ur bildrutan närmast den punkten. */
  const bild = sim.bild || [];
  if (bild.length && lopp?.dist && häst) {
    const målMeter = lopp.dist - 1000;
    let bästa = null, bästaDiff = Infinity;
    for (const b of bild) {
      const diff = Math.abs((b.meter ?? 0) - målMeter);
      if (diff < bästaDiff) { bästaDiff = diff; bästa = b; }
    }
    const rad = bästa?.rader?.find((r) => r.namn === häst.namn);
    if (rad) fakta.position1000 = rad.läge === "leder" ? "ledningen" : rad.läge;
  }

  /* MÖTEN. En rivalitet föds inte ur ett lopp utan ur att samma häst dyker
     upp gång på gång, och att det brukar avgöras er emellan. Därför räknas
     ALLA motståndare som slutade inom två placeringar — inte bara den
     närmaste. Med bara den närmaste blev varje lopp ett nytt par: 51 par
     på 62 lopp i genomkörningen, och ingen rivalitet uppstod någonsin.

     Den närmaste behålls separat som loppets rival, för texterna. */
  if (!min.ur && min.plats) {
    fakta.möten = alla
      .filter((r) => !r.ur && r.häst && !r.häst.egen && r.plats !== min.plats
        && Math.abs(r.plats - min.plats) <= 2)
      .map((r) => ({ id: r.häst.id, namn: r.häst.namn, dinSeger: r.plats > min.plats }));
    const granne = alla.find((r) => r.plats === min.plats - 1)
      ?? alla.find((r) => r.plats === min.plats + 1);
    if (granne && !granne.häst?.egen) {
      fakta.rivalId = granne.häst?.id ?? null;
      fakta.rivalNamn = granne.häst?.namn ?? null;
    }
  }
  return fakta;
}

/* ------------------------------------------------------------------ */
/* Rivaliteter (fas 4)                                                 */
/* ------------------------------------------------------------------ */

const RIVALTRÖSKEL = 5;

/**
 * Rivaliteter UPPTÄCKS ur data — de skrivs inte in i förväg. Två hästar som
 * gång på gång skiljs av en placering blir varandras måttstock, precis som
 * i verkligheten. Räknaren bor i spel.rivaliteter och överlever säsonger.
 *
 * Först vid fjärde mötet registreras händelsen, och då bara en gång: en
 * rivalitet som utropas vid första mötet är ingen rivalitet.
 */
export function uppdateraRivalitet(spel, häst, fakta) {
  if (!häst || !fakta) return null;
  spel.rivaliteter = spel.rivaliteter ?? {};

  /* Bakåtkompatibelt: äldre anrop skickade bara en rival. */
  const möten = (fakta.möten?.length ? fakta.möten
    : fakta.rivalId ? [{ id: fakta.rivalId, namn: fakta.rivalNamn, dinSeger: !!fakta.vannMot }]
    : []);
  if (!möten.length) return null;

  let utropad = null;
  for (const m of möten) {
    if (m.id == null) continue;
    const nyckel = `${häst.id}:${m.id}`;
    const r = spel.rivaliteter[nyckel] ?? {
      hästId: häst.id, hästNamn: häst.namn,
      rivalId: m.id, rivalNamn: m.namn,
      möten: 0, dinaSegrar: 0, hansSegrar: 0, utropad: false, senast: null,
    };
    r.möten++;
    r.rivalNamn = m.namn ?? r.rivalNamn;
    r.senast = { säsong: spel.säsong ?? 1, vecka: spel.vecka };
    if (m.dinSeger) r.dinaSegrar++; else r.hansSegrar++;
    /* Kontinuitetsminnet (v104): vem som vann SENAST — det är den
       raden man minns inför nästa möte. */
    r.senastVann = m.dinSeger ? "du" : "rival";
    spel.rivaliteter[nyckel] = r;

    /* Bara EN rivalitet utropas per lopp, och bara den hårdaste. Två
       rubriker samma vecka om två olika motståndare gör ingen av dem stor. */
    if (!r.utropad && r.möten >= RIVALTRÖSKEL && !utropad) {
      r.utropad = true;
      utropad = registreraHändelse(spel, {
        typ: "rivalitet",
        betydelse: 62,
        aktörer: { hästId: häst.id, hästNamn: häst.namn, rivalId: r.rivalId },
        data: {
          rival: r.rivalNamn, möten: r.möten,
          dinaSegrar: r.dinaSegrar, hansSegrar: r.hansSegrar,
        },
      });
    }
  }
  return utropad;
}

/** Rivaliteter för en häst, hårdast först. */
export const rivalerFör = (spel, häst) =>
  Object.values(spel.rivaliteter ?? {})
    .filter((r) => r.hästId === häst?.id && r.möten >= 2)
    .sort((a, b) => b.möten - a.möten);

/* ------------------------------------------------------------------ */
/* Hästbiografier                                                      */
/* ------------------------------------------------------------------ */

/**
 * Hästmilstolpar. Anropas efter varje lopp; upptäcker och registrerar
 * första start, första prispeng, första seger, storloppsseger, miljonen
 * och comeback. Milstolparna sparas även på hästen — dess biografi.
 *
 * Sedan v59 följer loppfakta med in i händelsen, så att segerartikeln,
 * ägarreaktionen och krönikan läser samma siffror.
 */
export function hästmilstolpar(spel, häst, lopp, min, brutto, fakta = {}) {
  häst.milstolpar = häst.milstolpar ?? [];
  const lägg = (typ, betydelse, text, data = {}) => {
    häst.milstolpar.push({ typ, säsong: spel.säsong ?? 1, vecka: spel.vecka, text });
    registreraHändelse(spel, {
      typ, betydelse,
      aktörer: {
        hästId: häst.id, hästNamn: häst.namn,
        kuskNamn: min?.kusk?.namn ?? null,
        ägare: häst.ägare ?? null,
      },
      loppId: lopp.id ?? lopp.kortnamn ?? lopp.namn,
      data: {
        lopp: lopp.kortnamn || lopp.namn, bana: lopp.banaNamn,
        storlopp: !!lopp.storlopp,
        favorit: fakta.favorit ?? undefined,
        position1000: fakta.position1000 ?? undefined,
        meterUtanRygg: fakta.meterUtanRygg ?? undefined,
        marginal: fakta.marginal ?? undefined,
        segertid: fakta.segertid ?? undefined,
        streck: fakta.streck ?? undefined,
        rivalId: fakta.rivalId ?? undefined,
        ...data,
      },
    });
  };
  const har = (typ) => häst.milstolpar.some((m) => m.typ === typ);
  const vann = !min.ur && min.plats === 1;

  if (häst.starter === 1 && !har("första_start"))
    lägg("första_start", 15, `Första starten, ${lopp.kortnamn || lopp.namn}.`);
  if (brutto > 0 && !har("första_prispeng"))
    lägg("första_prispeng", 12, `Första prispengen: ${brutto.toLocaleString("sv-SE")} kr.`);
  if (vann && !har("första_seger"))
    lägg("första_seger", 55, `Första segern, i ${lopp.kortnamn || lopp.namn}.`);
  if (vann && lopp.storlopp && !har("storloppsseger")) {
    lägg("storloppsseger", 92, `Storloppsseger i ${lopp.kortnamn || lopp.namn}!`);
    /* ARVET — slutmålets mening: "den första stjärnhästens dotter vann
       samma lopp som sin mamma." Mamman kan vara såld, pensionerad eller
       död; därför söks hon i KRÖNIKAN, inte i stallet. Krönikan är spelets
       minne, och det är exakt det här den finns för. */
    if (häst.morId != null) {
      const loppnamn = lopp.kortnamn || lopp.namn;
      const mammas = (spel.krönika ?? []).find((h) =>
        h.typ === "storloppsseger" && h.aktörer?.hästId === häst.morId
        && h.data?.lopp === loppnamn);
      if (mammas) {
        lägg("arvet", 96, `Vann ${loppnamn} — samma lopp som sin mor ${häst.mor ?? ""}.`,
          { mor: häst.mor, morId: häst.morId, morSäsong: mammas.säsong });
      }
    }
  }
  if (häst.intjänat >= 1000000 && !har("miljonen"))
    lägg("miljonen", 70, `Passerade miljonen i insprunget.`);
  if (vann && häst.friskVecka != null && spel.vecka - häst.friskVecka <= 3 && !har("comeback_" + häst.friskVecka))
    lägg("comeback_" + häst.friskVecka, 45, `Vann direkt i comebacken efter skadan.`);
}
