/**
 * GRAFIKEN
 *
 * Spelets bildspråk, helt i SVG — inga bildfiler, inga nätberoenden,
 * fungerar offline och skalar skarpt på alla skärmar.
 *
 *   Häst        travhäst med sulky i sidoprofil; pälsfärgen härleds
 *               deterministiskt ur namnet, kusken bär stallets dräkt
 *   Dräkt       tävlingströjan — stallets färger som plagg, inte ruta
 *   Gårdskarta  gården som växer: varje bygge syns när det är byggt
 */
import { html } from "htm/preact";

/* Deterministisk 0–1 ur text — samma häst har samma päls varje gång. */
function hash01(text) {
  let h = 2166136261;
  for (const t of String(text)) { h ^= t.codePointAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967296;
}

/* Travets pälsfärger: brun, mörkbrun, fux, svart, skimmel. */
const PÄLSAR = [
  { kropp: "#6B4A2F", man: "#3A2817" }, { kropp: "#4A3220", man: "#241708" },
  { kropp: "#9C5B33", man: "#6E3D1E" }, { kropp: "#26221F", man: "#0E0C0A" },
  { kropp: "#A8A6A2", man: "#7C7A76" }, { kropp: "#7E5236", man: "#4A2E1B" },
];
export const pälsFör = (namn) => PÄLSAR[Math.floor(hash01(namn ?? "") * PÄLSAR.length)];

/**
 * Travhäst i flygande trav med sulky och kusk, sidoprofil åt höger.
 * Stiliserad silhuett — läsbar i 40 px, värdig i 120.
 */
export function Häst({ namn, dräkt, storlek = 64 }) {
  const p = pälsFör(namn);
  const d = dräkt ?? { bg: "#3d434b", fg: "#c9ccd1" };
  return html`
    <svg class="hast-figur" width=${storlek} height=${Math.round(storlek * 0.62)}
      viewBox="0 0 160 100" aria-hidden="true">
      <ellipse cx="80" cy="94" rx="70" ry="4" fill="#000" opacity="0.35" />
      <!-- sulky -->
      <circle cx="34" cy="76" r="15" fill="none" stroke="#20272F" stroke-width="3.5" />
      <circle cx="34" cy="76" r="3.5" fill="#20272F" />
      <path d="M34 76 L62 62 L96 60" fill="none" stroke="#20272F" stroke-width="3" stroke-linecap="round" />
      <!-- kusk i stallets dräkt -->
      <path d="M46 62 q4 -14 12 -15 l6 1 q2 8 -3 15 l-8 4 z" fill=${d.bg} />
      <path d="M56 49 l10 6 l-2 4 l-10 -4 z" fill=${d.bg} />
      <circle cx="62" cy="43" r="5.5" fill="#C69A72" />
      <path d="M56 40 a6.5 6.5 0 0 1 12 1 l-12 0.5 z" fill=${d.fg} />
      <path d="M44 66 l14 -3 l2 4 l-13 5 z" fill="#20272F" />
      <!-- häst i flygande trav -->
      <path d="M84 55
        q-5 -12 6 -16 q14 -5 28 -2
        q4 -8 10 -12 q5 -3 9 -1 l7 6 q3 3 1 6 l-5 3 q-3 6 -9 7 l-4 1
        q4 8 0 14 q-5 8 -17 9 q-13 1 -21 -4 q-6 -4 -5 -11z" fill=${p.kropp} />
      <path d="M118 25 q6 -4 9 -1 l7 6 q-8 3 -16 -5z" fill=${p.man} />
      <path d="M104 37 q10 -8 16 -6 l-2 8 q-8 0 -14 -2z" fill=${p.man} />
      <path d="M86 42 q-9 -2 -13 4 q-3 6 3 9 l6 -2 q-2 -6 4 -11z" fill=${p.man} />
      <!-- ben i travdiagonal -->
      <path d="M95 68 l-12 16 l-5 -2 l11 -18z" fill=${p.kropp} />
      <path d="M112 70 l4 20 l5 -1 l-2 -20z" fill=${p.kropp} />
      <path d="M120 64 l18 10 l-2 5 l-19 -8z" fill=${p.kropp} />
      <path d="M100 70 l-2 20 l-5 0 l0 -19z" fill=${p.man} />
      <path d="M137 26 l6 8 l-3 2 l-6 -7z" fill=${p.kropp} />
    </svg>`;
}

/** Tävlingströjan — dräkten som plagg med ärmar, bröstrand och hjälm. */
export function Dräkt({ dräkt, storlek = 34 }) {
  const d = dräkt ?? { bg: "#3d434b", fg: "#c9ccd1" };
  return html`
    <svg width=${storlek} height=${storlek} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 4 a6 6 0 0 1 6 6 l-12 0 a6 6 0 0 1 6 -6z" fill=${d.fg} />
      <rect x="14" y="10" width="12" height="3" rx="1" fill="#1B222B" />
      <path d="M12 15 l16 0 l5 6 l-4 4 l-2 -3 l0 14 l-14 0 l0 -14 l-2 3 l-4 -4z" fill=${d.bg} />
      <rect x="13" y="22" width="14" height="4" fill=${d.fg} />
    </svg>`;
}

/**
 * Gårdskartan — spelets signatur. En kvällsscen där varje bygge dyker upp
 * när det är byggt: stallängan visar exakt så många boxdörrar som gården
 * har, rakbanan läggs bakom stallet, backen reser sig till höger,
 * vattenbandet får sitt eget hus. Framgång ska SYNAS från gårdsplanen.
 */
export function Gårdskarta({ spel }) {
  const a = spel.anläggning ?? { boxar: 4 };
  const dörrar = Math.min(a.boxar ?? 4, 14);
  const veteran = spel.gårdsveteran;
  return html`
    <svg class="gardskarta" viewBox="0 0 340 150" role="img"
      aria-label=${`Gården: ${a.boxar} boxar${a.rakbana ? ", rakbana" : ""}${a.backe ? ", backe" : ""}${a.vattenband ? ", vattenband" : ""}`}>
      <defs>
        <linearGradient id="g-himmel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#101B29" /><stop offset="1" stop-color="#1B2733" />
        </linearGradient>
        <radialGradient id="g-ljus" cx="0.5" cy="0" r="1">
          <stop offset="0" stop-color="#F2B134" stop-opacity="0.35" />
          <stop offset="0.55" stop-color="#F2B134" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="340" height="150" fill="url(#g-himmel)" />
      <rect width="340" height="46" y="0" fill="url(#g-ljus)" />
      <circle cx="296" cy="22" r="9" fill="#E9E6DF" opacity="0.85" />
      <rect y="112" width="340" height="38" fill="#182230" />
      ${a.backe && html`
        <path d="M250 112 L340 62 L340 112 Z" fill="#20303F" />
        <path d="M258 108 L332 68" stroke="#2C3A48" stroke-width="2" stroke-dasharray="4 5" fill="none" />
        <text x="300" y="104" class="gk-etikett">backen</text>`}
      ${a.rakbana && html`
        <rect x="8" y="58" width="200" height="7" rx="3" fill="#3B3226" />
        <rect x="8" y="60.5" width="200" height="2" fill="#F2B134" opacity="0.5" />
        <text x="14" y="54" class="gk-etikett">rakbanan</text>`}
      <!-- stallängan: en dörr per boxpar -->
      <g>
        <rect x="24" y="76" width=${28 + dörrar * 13} height="36" fill="#2A2118" />
        <path d=${`M20 76 L${24 + (28 + dörrar * 13) / 2} 58 L${28 + 28 + dörrar * 13} 76 Z`} fill="#40372A" />
        <rect x="30" y="82" width="14" height="30" fill="#151E28" />
        ${Array.from({ length: dörrar }, (_, i) => html`
          <rect key=${i} x=${50 + i * 13} y="90" width="8" height="22" rx="1"
            fill=${i * 1 < 99 ? "#0F1720" : "#0F1720"} stroke="#3A2F22" stroke-width="1" />`)}
      </g>
      ${a.vattenband && html`
        <g>
          <rect x="252" y="86" width="44" height="26" fill="#22303C" />
          <path d="M248 86 L274 74 L300 86 Z" fill="#2E4050" />
          <path d="M258 100 q5 -4 10 0 q5 4 10 0 q5 -4 10 0" stroke="#5B8FC7" stroke-width="2" fill="none" />
        </g>`}
      ${veteran && html`
        <g opacity="0.9">
          <path d="M310 104 q3 -6 8 -6 q6 0 8 5 l2 6 l-3 0 l-1 -4 l-9 0 l-1 4 l-3 0 z" fill="#4A3220" />
          <circle cx="326" cy="99" r="2.6" fill="#4A3220" />
          <title>${veteran} vid staketet</title>
        </g>`}
      <path d="M0 112 L340 112" stroke="#2C3A48" stroke-width="1" />
      <path d="M304 112 l0 -8 M312 112 l0 -8 M320 112 l0 -8 M328 112 l0 -8 M300 106 l32 0"
        stroke="#3B4A59" stroke-width="1.5" />
    </svg>`;
}
