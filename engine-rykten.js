/**
 * RYKTENA (v139, plan 20.6 — kap 26 C-d: "rykten — inte alltid sanna,
 * precis som verkligheten")
 *
 * FM lever på rykten, och det som gör dem bra är att de IBLAND
 * stämmer. Här förankras de i världens verkliga motor: ett sant
 * pensionsrykte pekar på en kusk som FAKTISKT står på tur i
 * generationsmaskinen (kuskålder, v111) — ett falskt pekar på en som
 * inte gör det. Spelaren kan inte se skillnaden förrän facit kommer:
 * vid säsongsskiftet bekräftar pressen de sanna ("Ryktet stämde")
 * och de falska dementeras av kusken själv ("Jag kör vidare").
 *
 * Hash-avgjort ur vecka och säsong — samma karriär, samma rykten.
 * Högst ett nytt vartannat–var tredje vecka, tak åtta levande.
 */
import { KUSKAR, aktivaKuskar } from "./data-kuskar.js";
import { kuskålder } from "./engine-varldsutveckling.js";

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const PENSIONSÅLDER = 58;

/** Väcks i veckoskiftet. Muterar spel.rykten; ingen slump — bara hash. */
export function väckRykten(spel) {
  spel.rykten = spel.rykten ?? [];
  const nyckel = `rykte:${spel.säsong ?? 1}:${spel.vecka}`;
  if (hash(nyckel) % 100 >= 38) return;                     /* de flesta veckor är tysta */
  if (spel.rykten.filter((r) => !r.avgjort).length >= 8) return;

  const kår = aktivaKuskar(spel).filter((k) => !k.lärling && !k.tränarkusk);
  const sant = hash(nyckel + ":sanning") % 100 < 55;        /* lite oftare sant än inte */
  const nästaSäsong = (spel.säsong ?? 1) + 1;
  /* Sant = de som generationsmaskinen FAKTISKT pensionerar nästa
     skifte: äldst först, högst två (exakt v111:s regel). Falskt =
     tryggt utanför. */
  const pensionskön = kår
    .filter((k) => kuskålder(k.namn, nästaSäsong) >= PENSIONSÅLDER)
    .sort((a, b) => kuskålder(b.namn, nästaSäsong) - kuskålder(a.namn, nästaSäsong))
    .slice(0, 2);
  const kandidater = sant
    ? pensionskön
    : kår.filter((k) => kuskålder(k.namn, nästaSäsong) < PENSIONSÅLDER - 4);
  if (!kandidater.length) return;
  const kusk = kandidater[hash(nyckel + ":vem") % kandidater.length];
  if (spel.rykten.some((r) => r.namn === kusk.namn && !r.avgjort)) return;

  spel.rykten.push({
    id: nyckel, typ: "pension", namn: kusk.namn, sant,
    vecka: spel.vecka, säsong: spel.säsong ?? 1, avgjort: false,
    text: `Det ryktas att ${kusk.namn} kör sin sista säsong. ${kusk.ryktbarhet >= 70 ? "En av sportens största — om det stämmer är det slutet på en epok." : "Inget är bekräftat, och kusken själv har inte svarat på frågan."}`,
  });
  spel.rykten = spel.rykten.slice(-16);
}

/**
 * Facit vid säsongsskiftet: generationsmaskinens VERKLIGA pensioner
 * avgör. Returnerar pressraderna — säsongsmotorn skriver dem.
 */
export function avgörRykten(spel) {
  const press = [];
  const pensionerade = new Set(spel.kuskvärld?.pensionerade ?? []);
  (spel.rykten ?? []).forEach((r) => {
    if (r.avgjort || r.typ !== "pension") return;
    r.avgjort = true;
    r.utfall = pensionerade.has(r.namn) ? "stämde" : "dementi";
    press.push(r.utfall === "stämde"
      ? { rubrik: `Ryktet stämde: ${r.namn} slutar`,
          byline: `Travbladet skrev det i våras — nu är det bekräftat. Sulkyn hängs upp.`, ton: "neutral" }
      : { rubrik: `${r.namn}: »Jag kör vidare«`,
          byline: `Pensionsryktet dementeras av kusken själv. »Man ska inte tro på allt som står.«`, ton: "neutral" });
  });
  spel.rykten = (spel.rykten ?? []).filter((r) => !r.avgjort).slice(-16);
  return press;
}
