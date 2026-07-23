import { useState } from "preact/hooks";
import { html } from "htm/preact";
import { marknaden, värdera, omdöme, köp, sälj } from "./engine-marknad.js";
import { kr } from "./engine-util.js";
import { Stapel, Tom, Form } from "./ui-delar.js";

/**
 * Marknaden.
 *
 * Spelaren ser vad en travköpare ser: ålder, meriter, form och ett omdöme —
 * aldrig hästens sanna värden. Det är först när den springer du vet vad du
 * köpt, och det är själva poängen.
 */
export default function MarknadVy({ spel, uppdatera }) {
  const [besked, sättBesked] = useState(null);
  const utbud = marknaden(spel);

  const genomför = (post) => {
    let fel = null;
    uppdatera((s) => { fel = köp(s, post); });
    sättBesked(fel
      ? { ton: "fel", text: fel }
      : { ton: "bra", text: `${post.häst.namn} är köpt för ${kr(post.pris)} kr.` });
  };

  const avyttra = (häst) => {
    if (!confirm(`Sälja ${häst.namn}? Värdering ${kr(värdera(häst))} kr.`)) return;
    let svar = null;
    uppdatera((s) => {
      const h = s.stall.find((x) => x.id === häst.id) || häst;
      svar = sälj(s, h);
    });
    sättBesked(typeof svar === "string"
      ? { ton: "fel", text: svar }
      : { ton: "bra", text: `${häst.namn} är såld för ${kr(svar.pris)} kr.` });
  };

  return html`
    <h2>Till salu — vecka ${spel.vecka}</h2>
    ${besked && html`<div class=${"besked " + besked.ton}>${besked.text}</div>`}
    <div class="hint">Utbudet byts när veckan körs. Du ser samma sak som en köpare
      ser — ålder, meriter och ett omdöme, aldrig hästens sanna värden.</div>

    ${utbud.length === 0
      ? html`<${Tom}>Inget till salu den här veckan.<//>`
      : utbud.map((post) => {
        const h = post.häst;
        const råd = spel.kassa < post.pris;
        return html`
          <div class="horse" key=${h.namn + post.pris}>
            <div class="namn">${h.namn}</div>
            <div class="meta">
              ${h.ålder} år · ${h.kön} · ${h.starter} st · ${h.segrar} seg · ${kr(h.intjänat)} kr
            </div>
            <div class="meta"><${Form} häst=${h} /></div>
            <div class="taggar">
              <span class="tagg">${post.ursprung}</span>
              <span class="tagg">${omdöme(h)}</span>
              <span class="tagg">${h.distans?.optimal ?? 2140} m</span>
            </div>
            <div class="bars">
              <${Stapel} etikett="Form" värde=${h.form} variant="form" />
              <${Stapel} etikett="Energi" värde=${h.energi} variant="energi" />
            </div>
            <div class="prisrad">
              <span class="pris">${kr(post.pris)} kr</span>
              <button class="btn liten" disabled=${råd} onClick=${() => genomför(post)}>
                ${råd ? "För dyr" : "Köp"}
              </button>
            </div>
          </div>`;
      })}

    <h2>Ditt stall</h2>
    <div class="hint">Försäljning ger något under värderingen. Hästen hamnar i ett
      annat stall och kan möta dig igen.</div>
    ${spel.stall.map((h) => html`
      <div class="kort" key=${h.id}>
        <div class="prisrad">
          <div>
            <div class="namn">${h.namn}</div>
            <div class="meta">${h.ålder} år · ${kr(h.intjänat)} kr insprunget
              ${h.ägare ? html` · ägs av ${h.ägare}` : ""}</div>
          </div>
          <div style="text-align:right">
            <div class="pris">${kr(värdera(h))} kr</div>
            <button class="btn liten sekundär" disabled=${!!h.ägare}
              onClick=${() => avyttra(h)}>${h.ägare ? "Ägd" : "Sälj"}</button>
          </div>
        </div>
      </div>`)}`;
}
