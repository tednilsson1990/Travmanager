import { useState } from "preact/hooks";
import { html } from "htm/preact";
import { useSpel } from "./state-spel.js";
import { kr } from "./engine-util.js";
import StallVy from "./ui-stallvy.js";
import LoppVy from "./ui-loppvy.js";
import SfarVy from "./ui-sfarvy.js";
import AvelVy from "./ui-avelvy.js";

const FLIKAR = [
  { id: "stall", namn: "Stall" },
  { id: "lopp", namn: "Lopp" },
  { id: "sfar", namn: "Sfären" },
  { id: "avel", namn: "Avel" },
];

export default function App() {
  const { spel, uppdatera, nystart } = useSpel();
  const [flik, sättFlik] = useState("stall");

  return html`
    <header>
      <div class="brand">Stallet<span>·</span>${spel.stallnamn}</div>
      <div class="status">
        <div>Vecka<b>${Math.min(spel.vecka, spel.veckor)}/${spel.veckor}</b></div>
        <div>Kassa<b>${kr(spel.kassa)}</b></div>
        <div>Renommé<b>${Math.round(spel.renommé)}</b></div>
        <div>Spelarna<b>${Math.round(spel.spelförtroende)}</b></div>
        <div>Hästar<b>${spel.stall.length}</b></div>
      </div>
    </header>

    <div class="wrap">
      ${flik === "stall" && html`<${StallVy} spel=${spel} uppdatera=${uppdatera} nystart=${nystart} />`}
      ${flik === "lopp" && html`<${LoppVy} spel=${spel} uppdatera=${uppdatera} />`}
      ${flik === "sfar" && html`<${SfarVy} spel=${spel} />`}
      ${flik === "avel" && html`<${AvelVy} spel=${spel} uppdatera=${uppdatera} />`}
    </div>

    <nav role="tablist">
      ${FLIKAR.map((f) => html`
        <button key=${f.id} role="tab" aria-selected=${flik === f.id}
          onClick=${() => sättFlik(f.id)}>${f.namn}</button>`)}
    </nav>`;
}
