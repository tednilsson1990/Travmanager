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
