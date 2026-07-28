import { html } from "htm/preact";
import { byggInkorg } from "./engine-inkorg.js";

/**
 * INKORGSVYN (v99, kap 19 etapp A). Ett EGET rum enligt Teds
 * v98-princip — och i Travbladets estetik: typografiska etiketter i
 * trycksvärta, inte emojiikoner. Tre saker per rad: vem, vad, vart.
 *
 * Prioritetsmärkena är dokumentets tre nivåer: BESLUT (tegel),
 * REKOMMENDATION (guldkant), info (omärkt). Varje rad är en genväg —
 * trycket markerar läst OCH tar spelaren till vyn där man agerar.
 * Aldrig en återvändsgränd.
 */
const TYPETIKETT = { sms: "SMS", samtal: "TEL", mejl: "BREV", rapport: "RAPPORT", nyhet: "NYTT" };

export default function InkorgVy({ spel, uppdatera, gåTill }) {
  const händelser = byggInkorg(spel);
  const lästa = new Set(spel.inkorgLästa ?? []);

  const öppna = (h) => {
    uppdatera((s) => {
      s.inkorgLästa = [...new Set([...(s.inkorgLästa ?? []), h.id])].slice(-120);
    });
    gåTill(h.flik);
  };

  return html`
    <h2>Inkorgen</h2>
    <div class="meta" style=${{ marginBottom: "10px" }}>
      Vecka ${Math.min(spel.vecka, spel.veckor)} · ${händelser.filter((h) => !lästa.has(h.id)).length} olästa
    </div>
    ${händelser.length === 0 && html`
      <div class="kort"><div class="logg">Inget nytt. Lugn vecka i stallet.</div></div>`}
    ${händelser.map((h) => html`
      <button key=${h.id} class=${"val inkorgsrad" + (lästa.has(h.id) ? " läst" : "")
          + (h.prioritet === "beslut" ? " tegel-kant" : h.prioritet === "rekommendation" ? " guld-kant" : "")}
        onClick=${() => öppna(h)}>
        <div class="inkorgs-topp">
          <span class="inkorgs-typ">${TYPETIKETT[h.typ]}</span>
          <span class="inkorgs-avsändare">${h.avsändare}</span>
          ${h.prioritet === "beslut" && html`<span class="inkorgs-märke tegel">Beslut</span>`}
          ${h.prioritet === "rekommendation" && html`<span class="inkorgs-märke">Förslag</span>`}
        </div>
        <div class="val-rubrik">${h.rubrik}</div>
        <div class="val-citat">${h.text}</div>
      </button>`)}
    <div class="hint">Tryck på ett meddelande för att gå dit det pekar.</div>`;
}
