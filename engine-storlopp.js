/**
 * STORLOPPSBÅGEN — loppet som kastar skugga före sig
 *
 * Ett storlopp ska inte vara ett vardagslopp med större prischeck den
 * vecka det råkar ligga. I verkligheten börjar det veckor tidigare:
 * pressen börjar räkna kandidater, tränare talar om vad de sparar
 * hästarna till, och den som saknar startsumma jagar den i småloppen.
 * Det sista är bågen som spelmekanik — kvalgränsen förvandlar en
 * fjärdeplats i Silverserien från tröstpris till ett steg mot Kungsloppet.
 *
 * Bågen är HÄRLEDD, inte lagrad: kalendern är deterministisk, så vilket
 * storlopp som närmar sig och vilka hästar som kvalar räknas fram ur
 * spelläget varje vecka. Det enda som sparas är vilka pressetapper som
 * redan skrivits (spel.bågeSkrivet), så att samma rubrik inte kommer två
 * gånger. DESIGNGRÄNS: filen läser världen och skriver press/händelser —
 * den rör aldrig loppmotorn eller fältbygget. Skuggan är berättelse och
 * mål, inte en hand på tärningen.
 */
import { veckansLopp, startförbud } from "./data-kalender.js";
import { registreraHändelse } from "./engine-handelser.js";

/** Hur många veckor i förväg bågen börjar synas. */
export const BÅGHORISONT = 4;

/**
 * Nästa storlopp inom horisonten, med veckor kvar. Kalendern frågas
 * direkt — inget dubbellagrat schema som kan glida ur synk.
 */
export function nästaStorlopp(spel, horisont = BÅGHORISONT) {
  for (let om = 0; om <= horisont; om++) {
    const v = spel.vecka + om;
    if (v > spel.veckor) break;
    const stor = veckansLopp(v).find((l) => l.storlopp);
    if (stor) return { lopp: stor, veckorKvar: om, vecka: v };
  }
  return null;
}

/**
 * Stallets läge inför ett storlopp: vilka är kvalade, och vilka är NÄRA —
 * med exakt vad som saknas. Närheten är bågens motor: "38 000 kr från
 * Kungsloppet" gör varje vardagsstart till en del av något större.
 */
export function kvalläge(spel, lopp) {
  const kvalade = [], nära = [];
  for (const h of spel.stall) {
    const förbud = startförbud(h, lopp);
    if (!förbud) { kvalade.push(h); continue; }
    const min = lopp.krav?.minInsprunget;
    if (min && h.intjänat < min) {
      const saknas = min - h.intjänat;
      /* "Nära" är relativt: en tredjedel av gränsen kvar räknas, mer inte.
         Annars kallas en häst med 20 av 600 tkr för en kandidat. */
      if (saknas <= min / 3 && !(lopp.krav?.kön && h.kön !== lopp.krav.kön)
          && !(lopp.krav?.maxÅlder && h.ålder > lopp.krav.maxÅlder)) {
        nära.push({ häst: h, saknas });
      }
    }
  }
  kvalade.sort((a, b) => (b.intjänat || 0) - (a.intjänat || 0));
  nära.sort((a, b) => a.saknas - b.saknas);
  return { kvalade, nära };
}

/**
 * Världens troliga favorit: bästa kvalade hästen i AI-stallen, mätt på
 * publika meriter (insprunget) — samma sak pressen skulle titta på.
 * Ren läsning, ingen slump: favoriten i texten är inte favoriten i
 * loppet förrän strecken räknas på riktigt.
 */
export function världensKandidat(spel, lopp) {
  const kandidater = (spel.värld?.hästar ?? [])
    .filter((h) => !startförbud(h, lopp))
    .sort((a, b) => (b.intjänat || 0) - (a.intjänat || 0));
  const h = kandidater[0];
  if (!h) return null;
  const stall = (spel.värld?.stall ?? []).find((s) => s.id === h.stallId);
  return { häst: h, stall: stall?.namn ?? null };
}

/**
 * Veckans etapp i bågen. Anropas från körVecka; skriver press och
 * registrerar händelser i rätt skede och exakt en gång per skede.
 * Returnerar bågens läge så att Hem kan visa det utan att räkna om.
 */
export function körStorloppsbåge(spel, skrivPress) {
  const nästa = nästaStorlopp(spel);
  spel.båge = null;
  if (!nästa) return null;

  const { lopp, veckorKvar } = nästa;
  const { kvalade, nära } = kvalläge(spel, lopp);
  spel.båge = {
    lopp: lopp.kortnamn, bana: lopp.banaNamn, vecka: nästa.vecka, veckorKvar,
    förstapris: lopp.pris?.[0] ?? 0,
    kvalade: kvalade.map((h) => h.namn),
    nära: nära.map((n) => ({ namn: n.häst.namn, saknas: n.saknas })),
  };

  spel.bågeSkrivet = spel.bågeSkrivet ?? {};
  const nyckel = (skede) => `${spel.säsong ?? 1}:${lopp.kortnamn}:${skede}`;
  const enGång = (skede, fn) => {
    if (spel.bågeSkrivet[nyckel(skede)]) return;
    spel.bågeSkrivet[nyckel(skede)] = true;
    fn();
  };
  /* Skriptet får inte växa i sparfilen för evigt — allt äldre än
     innevarande säsong är förbrukat. */
  for (const k of Object.keys(spel.bågeSkrivet)) {
    if (!k.startsWith(`${spel.säsong ?? 1}:`)) delete spel.bågeSkrivet[k];
  }

  const tkr = (n) => `${Math.round(n / 1000)} tkr`;

  /* SKEDE 1, fyra–tre veckor kvar: loppet nämns, kandidaterna räknas. */
  if (veckorKvar >= 3) enGång("upptakt", () => {
    const kand = världensKandidat(spel, lopp);
    if (kvalade.length) {
      skrivPress(spel, `${lopp.kortnamn} närmar sig — ${kvalade[0].namn} bland de kvalade`,
        `Om ${veckorKvar} veckor på ${lopp.banaNamn}. Förstapris ${tkr(lopp.pris[0])}.`, "neutral");
    } else if (kand) {
      skrivPress(spel, `${kand.häst.namn} storfavorit inför ${lopp.kortnamn}`,
        `${kand.stall ? kand.stall + " laddar. " : ""}Om ${veckorKvar} veckor på ${lopp.banaNamn}.`, "neutral");
    }
  });

  /* SKEDE 2, två veckor kvar: jakten på startsumman blir en rubrik. */
  if (veckorKvar === 2 && nära.length) enGång("jakt", () => {
    const n = nära[0];
    skrivPress(spel, `${n.häst.namn} jagar startsumman till ${lopp.kortnamn}`,
      `${tkr(n.saknas)} saknas — och två veckor kvar att springa in dem.`, "neutral");
  });

  /* SKEDE 3, en vecka kvar: förväntan sätts, och den registreras som
     händelse — pressen minns vad de skrev när loppet väl är kört. */
  if (veckorKvar === 1 && kvalade.length) enGång("laddning", () => {
    const h = kvalade[0];
    const kand = världensKandidat(spel, lopp);
    skrivPress(spel, `Nästa vecka: ${lopp.kortnamn}. Kan ${h.namn} utmana?`,
      kand ? `${kand.häst.namn} pekas ut som hästen att slå.` : `Fältet tar form på ${lopp.banaNamn}.`,
      "neutral", h, 8);
    registreraHändelse(spel, {
      typ: "storloppsladdning", betydelse: 35,
      aktörer: { hästId: h.id, hästNamn: h.namn },
      data: { lopp: lopp.kortnamn, bana: lopp.banaNamn,
              motståndare: kand?.häst?.namn ?? null },
    });
  });

  return spel.båge;
}
