import { html } from "htm/preact";
import { klamp, täcke } from "./engine-util.js";

export function Täcke({ nr }) {
  const t = täcke(nr);
  return html`<span class="tacke" style=${{ background: t.bg, color: t.fg }}>${nr}</span>`;
}

export function Stapel({ etikett, värde, variant }) {
  return html`
    <div class="bar-row">
      <span>${etikett}</span>
      <span class=${"bar " + (variant || "")}><i style=${{ width: klamp(värde) + "%" }} /></span>
      <span class="val">${Math.round(värde)}</span>
    </div>`;
}

export const Tom = ({ children }) => html`<div class="tom">${children}</div>`;

/** Motorn levererar färdig text med <b>-taggar; den är vår egen, inte inmatad. */
export const Rad = ({ html: innehåll, klass }) =>
  html`<div class=${klass} dangerouslySetInnerHTML=${{ __html: innehåll }} />`;

/**
 * Formraden — de senaste starterna i travets eget skrivsätt: 1-3-d-2-5,
 * nyast först. Diskvalificerad skrivs d, oplacerad utanför prislistan som 0.
 * Det är det första en travmänniska läser om en häst.
 */
export function Form({ häst, antal = 6 }) {
  const rader = (häst.resultat || []).slice(0, antal);
  if (!rader.length) return html`<span class="formrad tom">inga starter</span>`;
  return html`
    <span class="formrad">
      ${rader.map((r, i) => html`
        <span key=${i} class=${"fp " + (r.plats === 1 ? "seger" : r.plats && r.plats <= 3 ? "pall" : r.plats ? "" : "ur")}>
          ${r.plats ? r.plats : "d"}
        </span>`)}
    </span>`;
}
