/**
 * GÅRDEN — vyn
 *
 * Anläggningen i ett svep: boxarna och beläggningen, det som är byggt,
 * det som går att bygga, och personalen. Varje kort säger vad saken GÖR
 * innan den säger vad den kostar — spelaren ska köpa en effekt, inte
 * en ikon.
 */
import { html } from "htm/preact";
import { kr } from "./engine-util.js";
import { BYGGEN, ANSTÄLLDA, bygg, anställ, sägUpp, gåraugifter, boxplats } from "./engine-gard.js";
import { Tom } from "./ui-delar.js";
import { Gårdskarta } from "./ui-grafik.js";

export default function GårdVy({ spel, uppdatera }) {
  const a = spel.anläggning;
  if (!a) return html`<${Tom}>Gården dyker upp efter nästa vecka.<//>`;
  const lediga = boxplats(spel);
  const drift = gåraugifter(spel);

  return html`
    <h2>Gården</h2>
    <${Gårdskarta} spel=${spel} />
    <div class="kort">
      <div class="meta">Kapacitet</div>
      <div class="namn">${a.boxar} boxar · ${spel.stall.length} hästar</div>
      <div class="logg">${lediga > 0
        ? `${lediga} lediga — ägarförfrågningar kan komma.`
        : `Fullt i stallet. Inga nya hästar förrän det byggs ut eller säljs.`}</div>
      ${drift > 0 && html`<div class="logg">Anläggning och personal kostar <b>${kr(drift)} kr/vecka</b>.</div>`}
    </div>

    <h2>Bygga</h2>
    ${Object.entries(BYGGEN).map(([id, b]) => {
      const byggd = id !== "boxar2" && a[id];
      return html`
        <div class="kort" key=${id}>
          <div class="meta">${byggd ? "Byggt" : kr(b.pris) + " kr" + (b.drift ? ` · ${kr(b.drift)} kr/v` : "")}</div>
          <div class="namn">${b.namn}</div>
          <div class="logg">${b.text}</div>
          ${!byggd && html`
            <button class="btn liten" disabled=${spel.kassa < b.pris}
              onClick=${() => uppdatera((s) => bygg(s, id))}>
              ${id === "boxar2" ? `Bygg (${kr(b.pris)} kr)` : `Bygg`}
            </button>`}
        </div>`;
    })}

    <h2>Personal</h2>
    <div class="kort">
      <div class="meta">Förstaman</div>
      <div class="namn">${spel.förstaman?.namn ?? "—"}</div>
      <div class="logg">${spel.förstaman ? spel.förstaman.profiltext : "En förstaman ansluter inom kort."}</div>
    </div>
    ${Object.entries(ANSTÄLLDA).map(([id, p]) => html`
      <div class="kort" key=${id}>
        <div class="meta">${kr(p.lön)} kr/vecka</div>
        <div class="namn">${p.namn}</div>
        <div class="logg">${p.text}</div>
        ${a[id]
          ? html`<button class="btn liten sekundär" onClick=${() => uppdatera((s) => sägUpp(s, id))}>Säg upp</button>`
          : html`<button class="btn liten" onClick=${() => uppdatera((s) => anställ(s, id))}>Anställ</button>`}
      </div>`)}`;
}
