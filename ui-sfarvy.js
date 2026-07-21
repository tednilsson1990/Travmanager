import { html } from "htm/preact";
import { KUSKAR, relation, svar } from "./data-kuskar.js";
import { klamp } from "./engine-util.js";
import { Tom } from "./ui-delar.js";

export default function SfarVy({ spel }) {
  const externa = spel.stall.filter((h) => h.ägare);
  return html`
    <h2>Travmedia</h2>
    ${spel.press.length === 0
      ? html`<${Tom}>Ingen har skrivit om dig än.<//>`
      : spel.press.map((p, i) => html`
          <div key=${i} class=${"klipp " + (p.ton === "bra" ? "bra" : p.ton === "dålig" ? "dålig" : "")}>
            <div class="rubrik">${p.rubrik}</div>
            <div class="byline">Vecka ${p.vecka} · ${p.byline}</div>
          </div>`)}

    <h2>Kuskkåren</h2>
    <div class="kort">
      ${[...KUSKAR].sort((a, b) => b.ryktbarhet - a.ryktbarhet).map((k) => {
        const r = relation(spel, k);
        const sv = svar(spel, k);
        return html`
          <div key=${k.namn} class="relrad">
            <div>
              <div class="relnamn">${k.namn}</div>
              <div class="relmini">
                rykte ${k.ryktbarhet} · st ${k.start}/ta ${k.taktik}/av ${k.avslutning}/kyla ${k.kyla}
              </div>
            </div>
            <div class="relbar"><i class=${r < 35 ? "kall" : ""} style=${{ width: klamp(r) + "%" }} /></div>
            <div class=${"svar " + sv.c}>${sv.t}</div>
          </div>`;
      })}
    </div>

    <h2>Ägarna</h2>
    ${externa.length === 0
      ? html`<${Tom}>Du tränar bara egna hästar.<//>`
      : html`<div class="kort">
          ${externa.map((h) => html`
            <div key=${h.id} class="logg">
              <b>${h.ägare}</b> — ${h.namn} · ${h.krav.text} ·
              ${Math.max(0, h.krav.antal - h.kravStarter)} starter kvar
            </div>`)}
        </div>`}`;
}
