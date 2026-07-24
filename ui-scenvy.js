/**
 * SCENVYN — helskärmsögonblicket
 *
 * Två stilar, två världar:
 *
 * TIDNINGEN (stil: "tidning") — nyheten som en helsida ur Travbladet:
 * tidningshuvud, datumrad, jätterubrik, serifingress med anfang,
 * faktaruta som spalt, citat som utdrag, signatur. Papper, linjer,
 * trycksvärta. Det är så ett storlopp KÄNNS dagen efter — i tidningen.
 *
 * KVÄLLEN (standard) — banan under strålkastare, för ögonblicken som
 * inte är nyheter utan upplevelser: samtalet på stallkontoret,
 * telefonen som ringer.
 *
 * Vyn är dum: den ritar det scenen säger och rapporterar valet till
 * engine-scener. Ingen text hittas på här.
 */
import { html } from "htm/preact";
import { Bild } from "./ui-grafik.js";
import { görVal, stängScen } from "./engine-scener.js";
import { TIDNINGSNAMN, JOURNALISTER } from "./data-namnpaket.js";
import { Porträtt } from "./ui-grafik.js";

/* Journalistens bylinebild — id ur namnet, så att bildmappen kan fyllas
   per person: journalist-cecilia-ramnek.jpg osv. Saknas den: initialer. */
const journalistId = (namn) => "journalist-" + String(namn || "").toLowerCase()
  .replace(/[åä]/g, "a").replace(/ö/g, "o").replace(/[^a-z]+/g, "-");

function Val({ spel, scen, uppdatera, klassKnapp, klassVidare, vidareText }) {
  return (scen.val ?? []).length > 0
    ? html`<div class="helscen-val">
        ${scen.val.map((v) => html`
          <button key=${v.id} class=${"btn " + klassKnapp}
            onClick=${() => uppdatera((s) => görVal(s, 0, v.id))}>
            <span class="scenval-text">${v.text}</span>
            ${v.följd && html`<span class="scenval-följd">${v.följd}</span>`}
          </button>`)}
      </div>`
    : html`<button class=${"btn " + klassVidare}
        onClick=${() => uppdatera((s) => stängScen(s, 0))}>${vidareText}</button>`;
}

export default function ScenVy({ spel, uppdatera }) {
  const scen = (spel.scener ?? [])[0];
  if (!scen) return null;
  const fler = (spel.scener ?? []).length - 1;

  /* ---- Helsidan ur Travbladet ---- */
  if (scen.stil === "tidning") {
    return html`
      <div class="helscen tidning">
        <div class="helscen-inre">
          <div class="tidning-huvud">
            <div class="tidning-namn">${TIDNINGSNAMN}</div>
            <div class="tidning-datum">
              <span>Säsong ${scen.säsong} · vecka ${scen.vecka}</span>
              <span>Nr ${scen.vecka} · Pris 25 kr</span>
            </div>
          </div>
          ${scen.etikett && html`<div class="tidning-avdelning">${scen.etikett}</div>`}
          <div class="tidning-rubrik">${scen.rubrik}</div>
          ${scen.bild && html`<${Bild} id=${scen.bild} reserv=${scen.bildreserv} alt="" klass="tidning-bild" fallback=${null} />`}
          ${scen.ingress && html`<div class="tidning-ingress">${scen.ingress}</div>`}
          ${scen.brödtext && scen.brödtext.map((st, i) => html`
            <p key=${i} class="tidning-text">${st}</p>`)}

          ${(scen.fakta ?? []).length > 0 && html`
            <div class="tidning-fakta">
              <div class="tidning-fakta-rubrik">Fakta</div>
              ${scen.fakta.map((f, i) => html`
                <div key=${i}><span>${f.etikett}</span>${f.värde}</div>`)}
            </div>`}

          ${scen.citat && html`
            <div class="tidning-citat">»${scen.citat}«
              <span class="citat-vem">${scen.citatVem}</span></div>`}
          ${scen.signatur && html`
            <div class="tidning-signatur med-bild">
              <${Porträtt} id=${journalistId(scen.signatur)} namn=${scen.signatur}
                färg="#3A444F" storlek=${26} />
              <span>Text: ${scen.signatur}</span>
            </div>`}

          ${scen.fråga && html`<div class="tidning-fråga">${scen.fråga}</div>`}
          <${Val} spel=${spel} scen=${scen} uppdatera=${uppdatera}
            klassKnapp="tidningsval" klassVidare="tidning-vänd" vidareText="Vänd sida" />
          ${fler > 0 && html`<div class="helscen-fler mörk">+ ${fler} till väntar</div>`}
        </div>
      </div>`;
  }

  /* ---- Kvällen ---- */
  return html`
    <div class="helscen">
      <div class="helscen-inre">
        ${scen.bild && html`<${Bild} id=${scen.bild} reserv=${scen.bildreserv} alt="" klass="helscen-bild" fallback=${null} />`}
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
        <${Val} spel=${spel} scen=${scen} uppdatera=${uppdatera}
          klassKnapp="scenval" klassVidare="scen-vidare" vidareText="Vidare" />
        ${fler > 0 && html`<div class="helscen-fler">+ ${fler} till väntar</div>`}
      </div>
    </div>`;
}
