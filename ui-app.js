import { useState } from "preact/hooks";
import { html } from "htm/preact";
import { useSpel } from "./state-spel.js";
import { kr } from "./engine-util.js";
import StallVy from "./ui-stallvy.js";
import LoppVy from "./ui-loppvy.js";
import SfarVy from "./ui-sfarvy.js";
import AvelVy from "./ui-avelvy.js";
import MarknadVy from "./ui-marknadvy.js";
import StartVy from "./ui-startvy.js";
import GårdVy from "./ui-gardvy.js";
import { ÖvertagandeVy, FörstamansvalVy } from "./ui-prolog.js";
import { Dräkt } from "./ui-grafik.js";
import HemVy from "./ui-hemvy.js";

const FLIKAR = [
  { id: "hem", namn: "Hem" },
  { id: "stall", namn: "Stall" },
  { id: "lopp", namn: "Lopp" },
  { id: "sfar", namn: "Sfären" },
  { id: "mer", namn: "Mer" },
];
const MER = [
  { id: "gård", namn: "Gård" },
  { id: "marknad", namn: "Marknad" },
  { id: "avel", namn: "Avel" },
];

export default function App() {
  const { spel, uppdatera, nystart } = useSpel();
  const [flik, sättFlik] = useState("hem");
  const [merFlik, sättMerFlik] = useState("gård");

  /* Nya karriärer går genom uppstarten. Äldre sparfiler (fältet saknas)
     släpps rakt in — deras val är redan gjorda av historien. */
  if (spel.uppstartKlar === false) {
    return html`
      <header><div class="brand">Stallet<span>·</span>säsong 0</div></header>
      <div class="wrap"><${StartVy} spel=${spel} uppdatera=${uppdatera} /></div>`;
  }
  /* Prologens final och säsong 1:s första beslut har egna scener. */
  if (spel.prolog?.klar && !spel.prolog.övertagen) {
    return html`
      <header><div class="brand">Stallet<span>·</span>${spel.stallnamn}</div></header>
      <div class="wrap"><${ÖvertagandeVy} spel=${spel} uppdatera=${uppdatera} /></div>`;
  }
  if (spel.prolog?.övertagen && !spel.förstaman) {
    return html`
      <header><div class="brand">Stallet<span>·</span>${spel.stallnamn}</div></header>
      <div class="wrap"><${FörstamansvalVy} spel=${spel} uppdatera=${uppdatera} /></div>`;
  }

  return html`
    <header>
      <div class="brand">
        ${spel.dräkt && html`<${Dräkt} dräkt=${spel.dräkt} storlek=${30} />`}
        Stallet<span>·</span>${spel.stallnamn}</div>
      <div class="status">
        <div>Säsong<b>${spel.säsong ?? 1}</b></div>
        <div>Vecka<b>${Math.min(spel.vecka, spel.veckor)}/${spel.veckor}</b></div>
        <div>Kassa<b>${kr(spel.kassa)}</b></div>
        <div>Renommé<b>${Math.round(spel.renommé)}</b></div>
        <div>Spelarna<b>${Math.round(spel.spelförtroende)}</b></div>
        <div>Hästar<b>${spel.stall.length}</b></div>
      </div>
    </header>

    <div class="wrap">
      ${flik === "hem" && html`<${HemVy} spel=${spel} gåTill=${(f) => sättFlik(f)} />`}
      ${flik === "stall" && html`<${StallVy} spel=${spel} uppdatera=${uppdatera} nystart=${nystart} />`}
      ${flik === "lopp" && html`<${LoppVy} spel=${spel} uppdatera=${uppdatera} />`}
      ${flik === "sfar" && html`<${SfarVy} spel=${spel} />`}
      ${flik === "mer" && html`
        <div class="mer-meny">
          ${MER.map((m) => html`<button key=${m.id} aria-pressed=${merFlik === m.id}
            onClick=${() => sättMerFlik(m.id)}>${m.namn}</button>`)}
        </div>
        ${merFlik === "gård" && html`<${GårdVy} spel=${spel} uppdatera=${uppdatera} />`}
        ${merFlik === "marknad" && html`<${MarknadVy} spel=${spel} uppdatera=${uppdatera} />`}
        ${merFlik === "avel" && html`<${AvelVy} spel=${spel} uppdatera=${uppdatera} />`}`}
    </div>

    <nav role="tablist">
      ${FLIKAR.map((f) => html`
        <button key=${f.id} role="tab" aria-selected=${flik === f.id}
          onClick=${() => sättFlik(f.id)}>${f.namn}</button>`)}
    </nav>`;
}
