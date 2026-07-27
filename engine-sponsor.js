/**
 * SPONSRINGSSYSTEMET (v84, kap 8)
 *
 * Sponsring ska ge pengar — men också relationer, krav och strategiska
 * val. Varje avtal är en avvägning: fast veckoersättning och förmåner
 * mot krav som styr hur stallet får tävla.
 *
 * KONFLIKTEN (8.3) är inbyggd i kravtyperna: den lokala partnern vill se
 * stallet på hemmabanan, den nationella vill se starter och segrar var
 * de än sker. Två avtal kan alltså dra åt olika håll — det är meningen.
 *
 * FÖRMÅNERNA är verkliga, inte kosmetiska: transportsponsorn halverar
 * resekostnaden (läses av anmälan via resekostnad()), fodersponsorn
 * sänker driften per häst (läses av körVecka via foderrabatt()).
 *
 * UTVÄRDERINGEN sker vid säsongsskiftet: uppfyllda krav ger bonus och
 * ett förnyat avtal med bättre villkor; missade bryter avtalet med
 * besked i pressen. Ingenting händer i tysthet.
 *
 * DESIGNGRÄNSEN från v51 gäller: sponsorerna påverkar EKONOMIN och
 * VECKAN — aldrig loppmotorn. Kalibreringen kan inte se vem som
 * sponsrar stallet.
 */
import { klamp, plock, slump, int, kr } from "./engine-util.js";
import { BANOR } from "./data-namnpaket.js";
import { SPONSORNAMN } from "./data-agare.js";

export const SPONSORTYPER = {
  lokal: {
    namn: "Lokal företagspartner", renommé: 0,
    perVecka: [1500, 2600], segerbonus: [2000, 4000],
    krav: { typ: "hemmastarter", antal: 6, text: "sex starter på hemmabanan under säsongen" },
    förmån: null,
  },
  foder: {
    namn: "Foderleverantör", renommé: 20,
    perVecka: [1000, 1800], segerbonus: [1500, 3000],
    krav: { typ: "starter", antal: 10, text: "tio starter under säsongen" },
    förmån: { typ: "foder", text: "driften sänks 400 kr per häst och vecka" },
  },
  transport: {
    namn: "Transportföretag", renommé: 30,
    perVecka: [1200, 2000], segerbonus: [1500, 3000],
    krav: { typ: "starter", antal: 12, text: "tolv starter under säsongen" },
    förmån: { typ: "transport", text: "halverad resekostnad till bortalopp" },
  },
  bilhandlare: {
    namn: "Bilhandlare", renommé: 40,
    perVecka: [2200, 3400], segerbonus: [3000, 6000],
    krav: { typ: "segrar", antal: 6, text: "sex segrar under säsongen" },
    förmån: null,
  },
  regional: {
    namn: "Regionalt varumärke", renommé: 55,
    perVecka: [3200, 4800], segerbonus: [4000, 8000],
    krav: { typ: "segrar", antal: 9, text: "nio segrar under säsongen" },
    förmån: null,
  },
  nationell: {
    namn: "Nationell huvudsponsor", renommé: 72,
    perVecka: [6000, 9000], segerbonus: [8000, 15000],
    krav: { typ: "segrar", antal: 14, text: "fjorton segrar under säsongen" },
    förmån: { typ: "foder", text: "driften sänks 400 kr per häst och vecka" },
  },
};

const MAX_AVTAL = (spel) => (spel.renommé >= 55 ? 2 : 1);

export function säkraSponsorer(spel) {
  spel.sponsorer = spel.sponsorer ?? [];
  spel.sponsorerbjudanden = spel.sponsorerbjudanden ?? [];
}

/** Förmånsläsarna — det enda andra moduler behöver känna till. */
export const harFörmån = (spel, typ) =>
  (spel.sponsorer ?? []).some((a) => a.förmån?.typ === typ);
export const resekostnad = (spel, grund = 1200) =>
  harFörmån(spel, "transport") ? Math.round(grund / 2) : grund;
export const foderrabatt = (spel) =>
  harFörmån(spel, "foder") ? 400 * spel.stall.length : 0;

/**
 * Veckans sponsorliv: ersättningen betalas ut, och har stallet plats för
 * ett avtal till kan ett erbjudande dyka upp. Ett erbjudande ligger kvar
 * tre veckor — sponsorer väntar inte för evigt.
 * Returnerar loggrader; körVecka skriver dem.
 */
export function sponsorVecka(spel) {
  säkraSponsorer(spel);
  const rader = [];
  const summa = spel.sponsorer.reduce((a, s) => a + s.perVecka, 0);
  if (summa > 0) {
    spel.kassa += summa;
    rader.push(`Sponsorersättning: <b>+${kr(summa)} kr</b>`);
  }
  /* Erbjudanden förfaller. */
  spel.sponsorerbjudanden = spel.sponsorerbjudanden.filter((e) => {
    if (spel.vecka <= e.gällerTill) return true;
    rader.push(`Erbjudandet från <b>${e.namn}</b> förföll obesvarat.`);
    return false;
  });
  /* Nya erbjudanden: rätt renommé, ledig plats, och lite tur. */
  if (spel.sponsorer.length + spel.sponsorerbjudanden.length < MAX_AVTAL(spel)
      && slump() < 0.12 + spel.renommé / 400) {
    const val = Object.entries(SPONSORTYPER).filter(([id, t]) =>
      spel.renommé >= t.renommé
      && !spel.sponsorer.some((a) => a.typId === id)
      && !spel.sponsorerbjudanden.some((e) => e.typId === id));
    if (val.length) {
      /* Den bästa nivån stallet kvalar till väger tyngst — men inte
         alltid: även etablerade stall får lokala förfrågningar. */
      const [typId, t] = val[slump() < 0.7 ? val.length - 1 : Math.floor(slump() * val.length)];
      const erbjudande = {
        typId, typnamn: t.namn,
        namn: plock(SPONSORNAMN[typId]),
        perVecka: Math.round(int(t.perVecka[0], t.perVecka[1]) / 100) * 100,
        segerbonus: Math.round(int(t.segerbonus[0], t.segerbonus[1]) / 100) * 100,
        krav: { ...t.krav },
        förmån: t.förmån ? { ...t.förmån } : null,
        gällerTill: spel.vecka + 3,
      };
      spel.sponsorerbjudanden.push(erbjudande);
      rader.push(`<b>${erbjudande.namn}</b> vill sponsra stallet — se Kontoret.`);
    }
  }
  return rader;
}

/** Kontorets knapp: skriv på. Avtalet gäller säsongen ut. */
export function teckna(spel, erbjudande) {
  säkraSponsorer(spel);
  spel.sponsorerbjudanden = spel.sponsorerbjudanden.filter((e) => e !== erbjudande);
  spel.sponsorer.push({
    ...erbjudande,
    tecknadSäsong: spel.säsong ?? 1,
    status: { starter: 0, hemmastarter: 0, segrar: 0 },
  });
}
export function tackaNej(spel, erbjudande) {
  säkraSponsorer(spel);
  spel.sponsorerbjudanden = spel.sponsorerbjudanden.filter((e) => e !== erbjudande);
}

/**
 * Efter varje lopp: kraven bokförs och segerbonusen betalas ut.
 * Returnerar loggrader.
 */
export function sponsorEfterLopp(spel, { lopp, vann }) {
  säkraSponsorer(spel);
  const rader = [];
  const hemma = spel.hemmabana && BANOR[spel.hemmabana]?.namn === lopp.banaNamn;
  spel.sponsorer.forEach((a) => {
    a.status.starter++;
    if (hemma) a.status.hemmastarter++;
    if (vann) {
      a.status.segrar++;
      spel.kassa += a.segerbonus;
      rader.push(`Segerbonus från <b>${a.namn}</b>: <b>+${kr(a.segerbonus)} kr</b>`);
    }
  });
  return rader;
}

/** Kravläget för kontorsvyn. */
export function kravläge(avtal) {
  const k = avtal.krav;
  const nu = avtal.status[k.typ] ?? 0;
  return { nu, mål: k.antal, klar: nu >= k.antal, text: k.text };
}

/**
 * Säsongsutvärderingen. Uppfyllt krav: bonus (fyra veckoersättningar)
 * och förnyat avtal med tio procent bättre villkor. Missat: avtalet
 * bryts, med presskritik och en renomméknäpp. skrivPress som argument,
 * samma mönster som rekordmodulen.
 */
export function sponsorSäsongsskifte(spel, skrivPress) {
  säkraSponsorer(spel);
  const kvar = [];
  spel.sponsorer.forEach((a) => {
    const läge = kravläge(a);
    if (läge.klar) {
      const bonus = a.perVecka * 4;
      spel.kassa += bonus;
      a.perVecka = Math.round(a.perVecka * 1.1 / 100) * 100;
      a.segerbonus = Math.round(a.segerbonus * 1.1 / 100) * 100;
      a.status = { starter: 0, hemmastarter: 0, segrar: 0 };
      a.tecknadSäsong = (spel.säsong ?? 1);
      kvar.push(a);
      skrivPress(spel, `${a.namn} förlänger med ${spel.stallnamn}`,
        `Kraven uppfylldes med råge. Säsongsbonus ${kr(bonus)} kr — och bättre villkor nästa år.`, "positiv");
    } else {
      spel.renommé = klamp(spel.renommé - 2);
      skrivPress(spel, `${a.namn} lämnar ${spel.stallnamn}`,
        `Avtalet krävde ${läge.text} — det blev ${läge.nu}. Sponsorn drar sig ur.`, "dålig");
    }
  });
  spel.sponsorer = kvar;
  spel.sponsorerbjudanden = [];
}
