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

/**
 * KURVAN (v175, 32.2 ⑨ — efter dataviz-metoden): en serie, staplar i
 * en hue, inga legender, selektiva etiketter (första, sista, högsta),
 * text i texttoken. Tapp på en stapel visar värdet — mobilens hover.
 */
import { useState } from "preact/hooks";
export function Kurvan({ rader, enhet = "tkr" }) {
  const [vald, sättVald] = useState(null);
  if (!rader || rader.length < 2) return null;
  const max = Math.max(...rader.map((r) => r.värde), 1);
  const maxIx = rader.findIndex((r) => r.värde === max);
  const B = 100 / rader.length;
  return html`
    <svg class="kurvan" viewBox="0 0 100 46" preserveAspectRatio="none" role="img">
      ${rader.map((r, i) => {
        const h = Math.max(1.5, (r.värde / max) * 34);
        const etikett = vald === i || (vald === null && (i === 0 || i === rader.length - 1 || i === maxIx));
        return html`
          <g key=${i} onClick=${() => sättVald(vald === i ? null : i)} style=${{ cursor: "pointer" }}>
            <rect x=${i * B + B * 0.18} y=${40 - h} width=${B * 0.64} height=${h}
              rx="1.2" class=${"kurva-stapel" + (vald === i ? " vald" : "")} />
            ${etikett && html`<text x=${i * B + B * 0.5} y=${40 - h - 2.4} text-anchor="middle"
              class="kurva-värde">${r.värde}</text>`}
            <text x=${i * B + B * 0.5} y="45" text-anchor="middle" class="kurva-etikett">${r.etikett}</text>
          </g>`;
      })}
    </svg>
    <div class="kurva-enhet">${enhet}</div>`;
}
