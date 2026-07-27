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
        Din karriär är sparad och ligger kvar. Skicka meddelandet ovan
        vidare — det räcker för att hitta felet.
      </div>
      <div class="fel-knappar">
        <button id="fel-omladdning" class="btn">Ladda om</button>
        <button id="fel-kopiera" class="btn sekundär">Kopiera felet</button>
        <button id="fel-exportera" class="btn sekundär">Exportera sparfil</button>
      </div>
    </div>`;
  /* Verktygen kopplas EFTER innerHTML — inline-onclick sväljs av vissa
     webbläsares säkerhetsläge, riktiga lyssnare gör det inte. */
  document.getElementById("fel-omladdning")?.addEventListener("click",
    () => location.reload());
  document.getElementById("fel-kopiera")?.addEventListener("click",
    () => navigator.clipboard?.writeText(text).catch(() => {}));
  document.getElementById("fel-exportera")?.addEventListener("click", () => {
    /* Sparfilen som nedladdningsbar fil: kraschfelsökningens guldgruva —
       med den kan exakt samma läge återskapas där felet uppstod. */
    try {
      const rå = localStorage.getItem("travmanager.sparfil.v1") ?? "{}";
      const blob = new Blob([rå], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "travmanager-sparfil.json";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { /* utan sparfil finns inget att exportera */ }
  });
}

window.addEventListener("error", (e) => visaFel(e.error || e));
window.addEventListener("unhandledrejection", (e) => visaFel(e.reason));

try {
  render(html`<${App} />`, document.getElementById("root"));
} catch (fel) {
  visaFel(fel);
}
