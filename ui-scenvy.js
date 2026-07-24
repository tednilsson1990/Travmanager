/**
 * SCENVYN — helskärmsögonblicket
 *
 * Samma visuella språk som loppet: kvällsmörker, strålkastare, stor
 * rubrik. Det är kontrasten mot dagens papper som gör att ögonblicket
 * känns — designsystemets tes sedan v55.
 *
 * Vyn är dum: den ritar det scenen säger och rapporterar valet till
 * engine-scener. Ingen text hittas på här.
 */
import { html } from "htm/preact";
import { Bild } from "./ui-grafik.js";
import { görVal, stängScen } from "./engine-scener.js";

export default function ScenVy({ spel, uppdatera }) {
  const scen = (spel.scener ?? [])[0];
  if (!scen) return null;

  return html`
    <div class="helscen">
      <div class="helscen-inre">
        ${scen.bild && html`<${Bild} id=${scen.bild} alt="" klass="helscen-bild" fallback=${null} />`}
        <div class="scen-etikett ljus">${scen.etikett ?? ""}</div>
        <div class="helscen-rubrik">${scen.rubrik}</div>
        ${scen.ingress && html`<div class="helscen-ingress">${scen.ingress}</div>`}

        ${(scen.fakta ?? []).length > 0 && html`
          <div class="faktaruta natt">
            ${scen.fakta.map((f, i) => html`
              <div key=${i}><span>${f.etikett}</span>${f.värde}</div>`)}
          </div>`}

        ${scen.citat && html`
          <div class="citat ljus">»${scen.citat}«
            <span class="citat-vem">${scen.citatVem}</span></div>`}

        ${scen.fråga && html`<div class="helscen-fråga">${scen.fråga}</div>`}

        ${(scen.val ?? []).length > 0
          ? html`<div class="helscen-val">
              ${scen.val.map((v) => html`
                <button key=${v.id} class="btn scenval"
                  onClick=${() => uppdatera((s) => görVal(s, 0, v.id))}>
                  <span class="scenval-text">${v.text}</span>
                  ${v.följd && html`<span class="scenval-följd">${v.följd}</span>`}
                </button>`)}
            </div>`
          : html`<button class="btn scen-vidare"
              onClick=${() => uppdatera((s) => stängScen(s, 0))}>Vidare</button>`}

        ${(spel.scener ?? []).length > 1 && html`
          <div class="helscen-fler">+ ${spel.scener.length - 1} till väntar</div>`}
      </div>
    </div>`;
}
