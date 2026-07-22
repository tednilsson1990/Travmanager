import { useState } from "preact/hooks";
import { html } from "htm/preact";
import { HINGSTAR } from "./data-hingstar.js";
import { nyttNamn } from "./data-namn.js";
import { skrivPress } from "./engine-vecka.js";
import { kr, klamp, rnd, slump } from "./engine-util.js";
import { Tom } from "./ui-delar.js";

const ärv = (a, b) => klamp(Math.round((a + b) / 2 + rnd(-13, 17)));

export default function AvelVy({ spel, uppdatera }) {
  const ston = spel.stall.filter((h) => h.kön === "sto" && h.ålder >= 4 && !h.ägare);
  const [stoId, sättSto] = useState(ston[0]?.id ?? null);
  const [hingstIx, sättHingst] = useState(0);
  const hingst = HINGSTAR[hingstIx];

  const betäck = () => uppdatera((s) => {
    const sto = s.stall.find((h) => h.id === stoId);
    if (!sto || s.kassa < hingst.avgift) return;
    s.kassa -= hingst.avgift;
    s.föl.push({
      namn: nyttNamn(),
      kön: slump() < 0.5 ? "sto" : "hingst",
      start: ärv(sto.start, hingst.start),
      fart: ärv(sto.fart, hingst.fart),
      styrka: ärv(sto.styrka, hingst.styrka),
      veckorKvar: 6, mor: sto.namn, far: hingst.namn,
    });
    skrivPress(s, `Björkhaga satsar på ${hingst.namn}`, `Stallet betäcker ${sto.namn}.`, "neutral");
  });

  return html`
    <h2>Betäckning</h2>
    ${ston.length === 0
      ? html`<${Tom}>Inget eget sto i rätt ålder.<//>`
      : html`
        <div class="kort">
          <label class="fält" for="a-sto">Sto</label>
          <select id="a-sto" value=${stoId} onChange=${(e) => sättSto(+e.target.value)}>
            ${ston.map((h) => html`<option key=${h.id} value=${h.id}>${h.namn} (${h.ålder} år)</option>`)}
          </select>
          <label class="fält" for="a-hingst">Hingst</label>
          <select id="a-hingst" value=${hingstIx} onChange=${(e) => sättHingst(+e.target.value)}>
            ${HINGSTAR.map((h, i) => html`
              <option key=${h.namn} value=${i}>
                ${h.namn} — st ${h.start}/fa ${h.fart}/ork ${h.styrka} · ${kr(h.avgift)} kr
              </option>`)}
          </select>
        </div>
        <button class="btn" disabled=${spel.kassa < hingst.avgift} onClick=${betäck}>Betäck</button>
        ${spel.kassa < hingst.avgift && html`<div class="hint">Kassan räcker inte till betäckningsavgiften.</div>`}`}

    <h2>Uppfödning</h2>
    ${spel.föl.length === 0
      ? html`<${Tom}>Inga föl på gång.<//>`
      : spel.föl.map((f, i) => html`
          <div key=${i} class="kort">
            <div class="namn">${f.namn}</div>
            <div class="meta">e. ${f.far} — u. ${f.mor} · ${f.kön}</div>
            <div class="logg">Inkörning klar om <b>${f.veckorKvar} veckor</b></div>
          </div>`)}`;
}
