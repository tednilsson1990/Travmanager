import { useState } from "preact/hooks";
import { html } from "htm/preact";
import { HINGSTAR } from "./data-hingstar.js";
import { nyttNamn } from "./data-namn.js";
import { skrivPress } from "./engine-vecka.js";
import { kr, klamp, rnd, slump } from "./engine-util.js";
import { Tom } from "./ui-delar.js";
import { Bild } from "./ui-grafik.js";

const ärv = (a, b) => klamp(Math.round((a + b) / 2 + rnd(-13, 17)));

export default function AvelVy({ spel, uppdatera }) {
  /* Ett sto kan bara bära ett föl i taget. Utan den spärren kunde samma sto
     betäckas varje vecka så länge kassan räckte, och aveln blev en
     hästautomat i stället för ett långsiktigt beslut. */
  const dräktig = (h) => (spel.föl || []).some((f) => f.morId === h.id);
  /* Två sorters ston: de som fortfarande tävlar, och stjärnorna i
     avelshagen — pensionerade med meriter. Hagen är generationsspelets
     nav: det är därifrån "dottern som vann samma lopp som sin mamma"
     kommer. */
  const aktiva = spel.stall.filter((h) => h.kön === "sto" && h.ålder >= 4 && !h.ägare);
  const hagen = (spel.avelsston || []).map((m) => ({ ...m, kön: "sto", urHagen: true }));
  const ston = [...aktiva, ...hagen];
  const lediga = ston.filter((h) => !dräktig(h));
  const [stoId, sättSto] = useState(null);
  const [hingstIx, sättHingst] = useState(0);
  const hingst = HINGSTAR[hingstIx];
  /* Valt sto måste finnas och vara ledigt — annars faller valet tillbaka på
     det första lediga, så att knappen aldrig pekar på ett dräktigt sto. */
  const valtSto = lediga.find((h) => h.id === stoId) || lediga[0] || null;

  const betäck = () => uppdatera((s) => {
    const id = valtSto ? valtSto.id : stoId;
    const sto = s.stall.find((h) => h.id === id)
      ?? (s.avelsston || []).find((m) => m.id === id);
    if (!sto || s.kassa < hingst.avgift) return;
    if ((s.föl || []).some((f) => f.morId === sto.id)) return;   // redan dräktig
    s.kassa -= hingst.avgift;
    s.föl.push({
      namn: nyttNamn(),
      kön: slump() < 0.5 ? "sto" : "hingst",
      start: ärv(sto.start, hingst.start),
      fart: ärv(sto.fart, hingst.fart),
      styrka: ärv(sto.styrka, hingst.styrka),
      veckorKvar: 10, morId: sto.id, mor: sto.namn, far: hingst.namn,
    });
    skrivPress(s, `Björkhaga satsar på ${hingst.namn}`, `Stallet betäcker ${sto.namn}.`, "neutral");
  });

  return html`
    <${Bild} id="hage" reserv="gard-hero" alt="" klass="vytopp" fallback=${null} />
    <h2>Betäckning</h2>
    ${ston.length === 0
      ? html`<${Tom}>Inget eget sto i rätt ålder.<//>`
      : lediga.length === 0
      ? html`<${Tom}>
          ${ston.length === 1 ? "Ditt sto" : "Alla dina ston"} är dräktiga.
          Ett sto kan bara bära ett föl i taget.
        <//>`
      : html`
        <div class="kort">
          <label class="fält" for="a-sto">Sto</label>
          <select id="a-sto" value=${valtSto ? valtSto.id : ""} onChange=${(e) => sättSto(+e.target.value)}>
            ${lediga.map((h) => html`<option key=${h.id} value=${h.id}>${h.namn} (${h.ålder} år${h.urHagen ? ", avelshagen" : ""})</option>`)}
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

    ${hagen.length > 0 && html`
      <h2>Avelshagen</h2>
      <div class="hint">Pensionerade stjärnor. Egenskaperna frystes vid pensionen — det är dem de nedärver.</div>
      <div class="kort">
        ${hagen.map((m) => html`
          <div key=${m.id} class="prisrad">
            <span>${m.namn}, ${m.ålder} år${dräktig(m) ? " · dräktig" : ""}</span>
            <span class="pris">${m.segrar} seg · ${kr(m.intjänat)} kr</span>
          </div>`)}
      </div>`}

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
