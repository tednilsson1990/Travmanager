/**
 * VÄRLDENS UTVECKLING (v111, utvecklingsplanen 20.8 — Teds viktigaste
 * punkt: "när du spelar tio säsonger ska världen vara helt annorlunda")
 *
 * Hästarna åldras och pensioneras redan i säsongsskiftet. Nu även
 * MÄNNISKORNA — etapp A: kuskkåren och sponsorsfären.
 *
 * KUSKARNA ÅLDRAS deterministiskt: grundåldern hashas ur namnet
 * (24–49 år vid karriärstart) och stiger med säsongerna. Vid 58+
 * hänger de äldsta upp sulkyn — högst två per säsongsskifte, äldst
 * först, så kåren glesnar i verklig takt i stället för att kollapsa.
 * Varje säsong DEBUTERAR en lärling ur namnpaketet: lågt arvode, låga
 * krav, ingen ryktbarhet — men hungrig relation. Efter tio säsonger
 * är kuskkåren en annan än den du började med.
 *
 * SPONSORSFÄREN omsätts: varannan säsong lämnar en sponsortyp sporten
 * (hash-vald bland dem du inte har avtal med) och syns inte i
 * erbjudandeflödet igen. Pressen berättar om alltihop — och därmed
 * inkorgen.
 *
 * Allt är hash-avgjort ur säsong och namn: ingen slump i motorflödet,
 * samma karriär ger samma värld.
 */
import { KUSKAR } from "./data-kuskar.js";
import { byggLärling } from "./data-namnpaket.js";
import { SPONSORTYPER } from "./engine-sponsor.js";

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Kuskens ålder en given säsong — grundåldern bor i namnet (24–55:
 * en verklig kår har veteraner nära pension redan dag ett). */
export const kuskålder = (namn, säsong) => 24 + (hash(namn) % 32) + (säsong - 1);

const PENSIONSÅLDER = 58;

/**
 * Generationsfasen — anropas ur nySäsong, EFTER säsongsräknaren höjts.
 * Returnerar pressraderna så säsongsmotorn kan skriva dem med sin
 * egen skrivPress (ingen presskoppling härifrån).
 */
export function utvecklaVärlden(spel) {
  const press = [];
  spel.kuskvärld = spel.kuskvärld ?? { pensionerade: [], lärlingar: [] };
  const kv = spel.kuskvärld;

  /* ---- Pensioneringarna: äldst först, högst två per säsong. ---- */
  const borta = new Set(kv.pensionerade);
  const kandidater = KUSKAR
    .filter((k) => !borta.has(k.namn) && kuskålder(k.namn, spel.säsong) >= PENSIONSÅLDER)
    .sort((a, b) => kuskålder(b.namn, spel.säsong) - kuskålder(a.namn, spel.säsong))
    .slice(0, 2);
  kandidater.forEach((k) => {
    kv.pensionerade.push(k.namn);
    const ålder = kuskålder(k.namn, spel.säsong);
    press.push({
      rubrik: `${k.namn} hänger upp sulkyn`,
      byline: k.ryktbarhet >= 70
        ? `En av sportens största lämnar vid ${ålder}. Banorna blir sig inte lika.`
        : `${ålder} år och tusentals lopp senare säger en trotjänare tack.`,
      ton: "neutral",
    });
  });

  /* ---- Lärlingsdebuten: en per säsong, från säsong 2. ---- */
  if ((spel.säsong ?? 1) >= 2) {
    /* Namnkrocken med 90-mannakåren är vanlig (initial + efternamn) —
       löpnumret stegas deterministiskt tills namnet är ledigt. */
    let lärling = null;
    for (let steg = 0; steg < 12 && !lärling; steg++) {
      const kandidat = byggLärling((kv.lärlingar.length + 1) + steg * 100);
      const upptaget = KUSKAR.some((k) => k.namn === kandidat.namn)
        || kv.lärlingar.some((k) => k.namn === kandidat.namn)
        || kv.pensionerade.includes(kandidat.namn);
      if (!upptaget) lärling = kandidat;
    }
    if (lärling) {
      lärling.debutSäsong = spel.säsong;
      kv.lärlingar.push(lärling);
      press.push({
        rubrik: `Lärlingen ${lärling.namn} tar licens`,
        byline: `Nytt namn i kuskkåren. Lågt arvode, ingen ryktbarhet — och allt att bevisa.`,
        ton: "positiv",
      });
    }
  }

  /* ---- Sponsoromsättningen: varannan säsong lämnar en typ sporten. ---- */
  spel.sponsorvärld = spel.sponsorvärld ?? { borta: [] };
  if ((spel.säsong ?? 1) % 2 === 0) {
    const kvar = Object.entries(SPONSORTYPER).filter(([id]) =>
      !spel.sponsorvärld.borta.includes(id)
      && !(spel.sponsorer ?? []).some((a) => a.typId === id));
    if (kvar.length > 2) {
      const [id, t] = kvar[hash(`sponsor:${spel.säsong}:${spel.stallnamn ?? ""}`) % kvar.length];
      spel.sponsorvärld.borta.push(id);
      press.push({
        rubrik: `${t.namn}-pengarna lämnar traven`,
        byline: `Sponsorkartan ritas om — en dörr som stod öppen är stängd.`,
        ton: "negativ",
      });
    }
  }

  return press;
}
