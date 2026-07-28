import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { synligInkorg, verkställBeslut } from "./engine-inkorg.js";
import { nästaStopp, hoppaFram, stoppFör, STOPPNAMN } from "./engine-klocka.js";

/**
 * INKORGSVYN (v103 — förhandsfönstret och helskärmen, Teds riktning:
 * "viktigt med ett stort förhandsvisningsfönster för valt meddelande
 * och möjlighet att öppna upp helskärm — meddelanden kan vara långa
 * och storyn blir bättre").
 *
 * TRE LÄGEN:
 *   Listan    — kompakta rader per typ (sms-bubbla, samtalskort, brev,
 *               rapport, urklipp), en rad text, snabbt att skumma.
 *   Förhandet — valt meddelande öppnas STORT överst: hela texten i
 *               typens formspråk, detaljrader, besluten, och knappen
 *               till helskärmen.
 *   Helskärm  — hela skärmen blir meddelandet: tidningssida för
 *               nyheter, samtal i fullformat, långläsning med luft.
 *               Besluten följer med — man kan skriva på ett
 *               sponsoravtal från helskärmen.
 *
 * Långa texter: händelser kan bära ett längre fält (lång) som förhand
 * och helskärm visar — listraden nöjer sig med text.
 */
const AVSÄNDARINITIAL = (namn) => (namn || "?").trim()[0]?.toUpperCase() ?? "?";
const TYPRUBRIK = { sms: "SMS", samtal: "Telefonsamtal", mejl: "Brev", rapport: "Rapport", nyhet: "Ur Travbladet" };

export default function InkorgVy({ spel, uppdatera, gåTill }) {
  const händelser = synligInkorg(spel);
  const lästa = new Set(spel.inkorgLästa ?? []);
  const [valdId, sättVald] = useState(null);
  const [helskärm, sättHelskärm] = useState(false);
  const vald = händelser.find((h) => h.id === valdId) ?? null;

  const välj = (h) => {
    sättVald(h.id === valdId ? null : h.id);
    sättHelskärm(false);
    if (!lästa.has(h.id)) {
      uppdatera((s) => {
        s.inkorgLästa = [...new Set([...(s.inkorgLästa ?? []), h.id])].slice(-120);
      });
    }
  };

  const besluta = (h, a) => {
    uppdatera((s) => verkställBeslut(s, h, a.id));
    sättVald(null); sättHelskärm(false);
  };

  const Åtgärder = ({ h }) => html`
    <div class="rad-knappar">
      ${h.beslut && h.beslut.alternativ.map((a) => html`
        <button key=${a.id} class=${"btn liten" + (a.sekundär ? " sekundär" : "")}
          onClick=${(e) => { e.stopPropagation(); besluta(h, a); }}>${a.etikett}</button>`)}
      ${!h.beslut && html`
        <button class="btn liten sekundär" onClick=${(e) => { e.stopPropagation(); gåTill(h.flik); }}>Öppna →</button>`}
    </div>`;

  const Innehåll = ({ h }) => html`
    <div class="förhand-text">${(h.lång ?? h.text).split("\n\n").map((stycke, i) =>
      html`<p key=${i}>${stycke}</p>`)}</div>
    ${(h.detaljer ?? []).map((d) => html`
      <div key=${d.namn} class="prisrad"><span>${d.namn}</span><span class="pris">${d.värde}</span></div>`)}
    <${Åtgärder} h=${h} />`;

  /* ---------- Kompakta listrader per typ ---------- */
  const rad = (h) => {
    const vald2 = h.id === valdId;
    const kant = h.prioritet === "beslut" ? " tegel-kant" : h.prioritet === "rekommendation" ? " guld-kant" : "";
    const dämpad = lästa.has(h.id) && !vald2 ? " läst" : "";
    if (h.typ === "sms") {
      return html`
        <div key=${h.id} class=${"sms-rad kompakt" + dämpad + (vald2 ? " vald" : "")} onClick=${() => välj(h)}>
          <div class="sms-initial">${AVSÄNDARINITIAL(h.avsändare)}</div>
          <div class=${"sms-bubbla" + kant}>
            <div class="sms-vem">${h.avsändare}</div>
            <div class="rad-klipp">${h.text}</div>
          </div>
        </div>`;
    }
    if (h.typ === "samtal") {
      return html`
        <div key=${h.id} class=${"tel-kort kompakt" + kant + dämpad + (vald2 ? " vald" : "")} onClick=${() => välj(h)}>
          <div class="tel-topp"><span class="tel-ikon">✆</span> ${h.avsändare}${h.prioritet === "beslut" ? " · väntar på svar" : ""}</div>
          <div class="rad-klipp tel-citat">${h.text}</div>
        </div>`;
    }
    if (h.typ === "nyhet") {
      return html`
        <div key=${h.id} class=${"klipp inkorgs-klipp kompakt" + dämpad + (vald2 ? " vald" : "")} onClick=${() => välj(h)}>
          <div class="klipp-etikett">${h.etikett ?? "Travbladet"}</div>
          <div class="klipp-rubrik">${h.rubrik}</div>
        </div>`;
    }
    if (h.typ === "rapport") {
      return html`
        <div key=${h.id} class=${"rapport-kort kompakt" + kant + dämpad + (vald2 ? " vald" : "")} onClick=${() => välj(h)}>
          <div class="rapport-etikett">Rapport · ${h.avsändare}</div>
          <div class="val-rubrik">${h.rubrik}</div>
        </div>`;
    }
    return html`
      <div key=${h.id} class=${"brev-kort kompakt" + kant + dämpad + (vald2 ? " vald" : "")} onClick=${() => välj(h)}>
        <div class="brev-rad"><span>Från</span> ${h.avsändare}</div>
        <div class="brev-rad ämne"><span>Ämne</span> ${h.rubrik}</div>
      </div>`;
  };

  /* ---------- Förhandsfönstret — stort, i typens formspråk ---------- */
  const Förhand = ({ h }) => html`
    <div class=${"förhand" + (h.typ === "nyhet" ? " klipp" : "")}>
      <div class="förhand-topp">
        <span class="inkorgs-typ">${TYPRUBRIK[h.typ]}</span>
        <span class="förhand-vem">${h.typ === "nyhet" ? (h.etikett ?? "Travbladet") : h.avsändare}</span>
        <span class="förhand-knappar">
          <button class="ikonknapp" title="Helskärm" onClick=${() => sättHelskärm(true)}>⛶</button>
          <button class="ikonknapp" title="Stäng" onClick=${() => sättVald(null)}>×</button>
        </span>
      </div>
      <div class=${h.typ === "nyhet" ? "klipp-rubrik stor-rubrik" : "förhand-rubrik"}>${h.rubrik}</div>
      <${Innehåll} h=${h} />
    </div>`;

  /* ---------- Helskärmen — hela sidan blir meddelandet ---------- */
  const Helskärm = ({ h }) => html`
    <div class="helskärm">
      <div class="helskärm-topp">
        <span class="inkorgs-typ">${TYPRUBRIK[h.typ]}</span>
        <button class="ikonknapp" onClick=${() => sättHelskärm(false)}>× Stäng</button>
      </div>
      <div class="helskärm-inre">
        ${h.typ === "nyhet"
          ? html`<div class="klipp-etikett">${h.etikett ?? "Travbladet"} · vecka ${Math.min(spel.vecka, spel.veckor)}</div>`
          : html`<div class="förhand-vem stor">${h.avsändare}</div>`}
        <h1 class="helskärm-rubrik">${h.rubrik}</h1>
        <${Innehåll} h=${h} />
      </div>
    </div>`;

  return html`
    ${helskärm && vald && html`<${Helskärm} h=${vald} />`}
    <h2>Inkorgen</h2>
    <div class="meta" style=${{ marginBottom: "10px" }}>
      Vecka ${Math.min(spel.vecka, spel.veckor)} · ${STOPPNAMN[stoppFör(spel)]} · ${händelser.filter((h) => !lästa.has(h.id)).length} olästa
    </div>
    ${vald && html`<${Förhand} h=${vald} />`}
    ${händelser.length === 0 && html`
      <div class="kort"><div class="logg">Inget nytt. Lugn vecka i stallet.</div></div>`}
    ${händelser.map(rad)}
    <button class="btn" style=${{ marginTop: "12px" }} onClick=${() => {
      let mål;
      uppdatera((s) => { mål = hoppaFram(s); });
      sättVald(null); sättHelskärm(false);
      if (mål !== "vecka") gåTill("lopp");
    }}>${nästaStopp(spel).etikett}</button>`;
}
