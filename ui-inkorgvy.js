import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { synligInkorg, verkställBeslut } from "./engine-inkorg.js";

/**
 * INKORGSVYN (v100, kap 19 etapp B+C — Teds princip fullt ut: ALL
 * kommunikation går genom inkorgen, och man AGERAR i notisen).
 *
 * Trycket på en rad expanderar den på plats: hela texten, detaljrader
 * och — för beslutshändelser — valknapparna direkt i raden. Genvägen
 * finns kvar men som sekundär "Öppna →"-knapp för den som vill se
 * sammanhanget. Aldrig tvingad vidare, aldrig en återvändsgränd.
 *
 * Travbladets estetik: typografiska etiketter i trycksvärta, tegelkant
 * på beslut, guldkant på förslag.
 */
const TYPETIKETT = { sms: "SMS", samtal: "TEL", mejl: "BREV", rapport: "RAPPORT", nyhet: "NYTT" };
const FLIKNAMN = { hem: "Hem", stall: "Stallet", lopp: "Loppfliken", sfar: "Sfären", kontor: "Kontoret", "gård": "Gården", mer: "Mer" };

export default function InkorgVy({ spel, uppdatera, gåTill }) {
  const händelser = synligInkorg(spel);
  const lästa = new Set(spel.inkorgLästa ?? []);
  const [öppenId, sättÖppen] = useState(null);

  const växla = (h) => {
    sättÖppen(öppenId === h.id ? null : h.id);
    if (!lästa.has(h.id)) {
      uppdatera((s) => {
        s.inkorgLästa = [...new Set([...(s.inkorgLästa ?? []), h.id])].slice(-120);
      });
    }
  };

  return html`
    <h2>Inkorgen</h2>
    <div class="meta" style=${{ marginBottom: "10px" }}>
      Vecka ${Math.min(spel.vecka, spel.veckor)} · ${händelser.filter((h) => !lästa.has(h.id)).length} olästa
    </div>
    ${händelser.length === 0 && html`
      <div class="kort"><div class="logg">Inget nytt. Lugn vecka i stallet.</div></div>`}
    ${händelser.map((h) => {
      const öppen = öppenId === h.id;
      return html`
      <div key=${h.id} class=${"val inkorgsrad" + (lästa.has(h.id) && !öppen ? " läst" : "")
          + (h.prioritet === "beslut" ? " tegel-kant" : h.prioritet === "rekommendation" ? " guld-kant" : "")}>
        <button class="inkorgs-knapp" onClick=${() => växla(h)}>
          <div class="inkorgs-topp">
            <span class="inkorgs-typ">${TYPETIKETT[h.typ]}</span>
            <span class="inkorgs-avsändare">${h.avsändare}</span>
            ${h.prioritet === "beslut" && html`<span class="inkorgs-märke tegel">Beslut</span>`}
            ${h.prioritet === "rekommendation" && html`<span class="inkorgs-märke">Förslag</span>`}
          </div>
          <div class="val-rubrik">${h.rubrik}</div>
          ${!öppen && html`<div class="val-citat rad-klipp">${h.text}</div>`}
        </button>
        ${öppen && html`
          <div class="inkorgs-kropp">
            <div class="logg">${h.text}</div>
            ${(h.detaljer ?? []).map((d) => html`
              <div key=${d.namn} class="prisrad"><span>${d.namn}</span><span class="pris">${d.värde}</span></div>`)}
            <div class="rad-knappar">
              ${h.beslut && h.beslut.alternativ.map((a) => html`
                <button key=${a.id} class=${"btn liten" + (a.sekundär ? " sekundär" : "")}
                  onClick=${() => { uppdatera((s) => verkställBeslut(s, h, a.id)); sättÖppen(null); }}>
                  ${a.etikett}
                </button>`)}
              ${!h.beslut && html`
                <button class="btn liten sekundär" onClick=${() => gåTill(h.flik)}>
                  Öppna ${FLIKNAMN[h.flik] ?? h.flik} →
                </button>`}
            </div>
          </div>`}
      </div>`;
    })}
    <div class="hint">Tryck på ett meddelande — läs, besluta och agera direkt i raden.</div>`;
}
