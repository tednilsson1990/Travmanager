import { render } from "preact";
import { html } from "htm/preact";
import App from "./ui-app.js";

/**
 * Felgräns.
 *
 * Utan den räcker ett kastat fel i en modul för att hela sidan ska bli svart
 * — det har hänt två gånger under utvecklingen, och då syns inte ens VILKET
 * fel det var. Nu visas meddelandet på skärmen, och sparfilen ligger kvar så
 * att karriären överlever en trasig version.
 */
function visaFel(fel) {
  const rot = document.getElementById("root");
  if (!rot) return;
  const text = (fel && (fel.message || fel.reason?.message || String(fel))) || "okänt fel";
  rot.innerHTML = `
    <div class="felruta">
      <div class="fel-rubrik">Något gick fel</div>
      <div class="fel-text">${text.replace(/</g, "&lt;")}</div>
      <div class="fel-hjalp">
        Din karriär är sparad och ligger kvar. Ladda om sidan — eller skicka
        meddelandet ovan vidare, det räcker för att hitta felet.
      </div>
    </div>`;
}

window.addEventListener("error", (e) => visaFel(e.error || e));
window.addEventListener("unhandledrejection", (e) => visaFel(e.reason));

try {
  render(html`<${App} />`, document.getElementById("root"));
} catch (fel) {
  visaFel(fel);
}
