/**
 * SPELSTARTEN
 *
 * Tre val innan stalldörren öppnas: namn, dräkt och hemmabana. Bara de
 * små banorna har plats för en okänd tränare — de stora får man förtjäna.
 * Valen är på riktigt: dräkten följer stallet genom karriären och
 * hemmabanan avgör var man slipper resekostnader och får hemmapubliken.
 */
import { useState } from "preact/hooks";
import { html } from "htm/preact";
import { slump } from "./engine-util.js";
import { BANOR, DRÄKTER } from "./data-namnpaket.js";
import { nyFörstaman, hälsning } from "./engine-forstaman.js";
import { skrivPress } from "./engine-vecka.js";

const NAMNFÖRSLAG = [
  "Björkhaga", "Stall Norrsken", "Ekbackens Trav", "Stall Framåt",
  "Lyckans Stall", "Stall Vintersol", "Granlidens Trav", "Stall Fyrklövern",
  "Månskensstallet", "Stall Rimfrost",
];

export default function StartVy({ uppdatera }) {
  const [namn, sättNamn] = useState("Björkhaga");
  const [dräkt, sättDräkt] = useState(DRÄKTER[0].id);
  const [bana, sättBana] = useState(null);
  const små = Object.entries(BANOR).filter(([, b]) => b.storlek === 1);

  const öppna = () => uppdatera((s) => {
    s.stallnamn = namn.trim() || "Björkhaga";
    s.dräkt = DRÄKTER.find((d) => d.id === dräkt) ?? DRÄKTER[0];
    s.hemmabana = bana;
    s.förstaman = nyFörstaman();
    s.uppstartKlar = true;
    skrivPress(s, `${s.stallnamn} ny tränaradress på ${BANOR[bana].namn}`,
      "Travbladet följer nykomlingen", "neutral");
    s.logg.unshift(`<b>${s.förstaman.namn}</b>, ${s.förstaman.profiltext}, börjar som förstaman. »${hälsning(s.förstaman, bana)}«`);
  });

  return html`
    <div class="startvy">
      <div class="kort">
        <div class="meta">Ett stall att bygga</div>
        <div class="namn">Vad ska det heta?</div>
        <input class="startfält" value=${namn} maxlength="24"
          onInput=${(e) => sättNamn(e.target.value)} />
        <button class="btn liten sekundär" onClick=${() =>
          sättNamn(NAMNFÖRSLAG[Math.floor(slump() * NAMNFÖRSLAG.length)])}>Slumpa</button>
      </div>

      <div class="kort">
        <div class="meta">Stallets färger</div>
        <div class="namn">Dräkten</div>
        <div class="draktrad">
          ${DRÄKTER.map((d) => html`
            <button key=${d.id} class=${"drakt" + (dräkt === d.id ? " vald" : "")}
              style=${{ background: d.bg, color: d.fg }}
              aria-label=${d.namn} title=${d.namn}
              onClick=${() => sättDräkt(d.id)}>▮▮</button>`)}
        </div>
        <div class="meta">${DRÄKTER.find((d) => d.id === dräkt)?.namn}</div>
      </div>

      <div class="kort">
        <div class="meta">Bara de små banorna har plats för en okänd tränare</div>
        <div class="namn">Hemmabana</div>
        ${små.map(([id, b]) => html`
          <button key=${id} class=${"banval" + (bana === id ? " vald" : "")}
            onClick=${() => sättBana(id)}>
            <div class="namn">${b.namn}</div>
            <div class="meta">${b.karaktär}</div>
            <div class="meta">Upplopp ${b.upplopp} m${b.openStretch ? " · öppet innerspår" : ""}</div>
          </button>`)}
        <div class="logg">Hemma slipper du resekostnader och hemmapubliken ger extra
          prispengar. Med renommé kommer erbjudanden från de större banorna.</div>
      </div>

      <button class="btn" disabled=${!bana} onClick=${öppna}>Öppna stallet</button>
    </div>`;
}
