import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { hästStatistik, tränarStatistik } from "./engine-statistik.js";
import { kr } from "./engine-util.js";

/**
 * STATISTIKEN (v109, 20.3) — Travbladets tabellsidor. Tränarkortet
 * överst med karriärtotalerna (som bär helheten), sedan en häst i
 * taget: banor, startmetod, distanser, POSITIONERNA (ledningen,
 * dödens, rygg — Teds lista) och kuskarna. Radaggregaten gäller de
 * bevarade starterna, och det står ärligt i foten.
 */
const Tabell = ({ rubrik, rader, tom }) => rader.length === 0
  ? (tom ? html`<div class="hint">${tom}</div>` : "")
  : html`
    <div class="stat-tabell">
      <div class="stat-rubrik">${rubrik}</div>
      <div class="stat-rad stat-huvud"><span>—</span><span>St</span><span>Seg</span><span>Topp 3</span><span>%</span></div>
      ${rader.slice(0, 6).map((r) => html`
        <div key=${r.namn} class="stat-rad">
          <span>${r.namn}</span><span>${r.starter}</span><span>${r.segrar}</span><span>${r.topp3}</span><span>${r.segerprocent}</span>
        </div>`)}
    </div>`;

export default function StatistikVy({ spel }) {
  const [valdHästId, sättVald] = useState(spel.stall?.[0]?.id ?? null);
  const t = tränarStatistik(spel);
  const häst = (spel.stall ?? []).find((h) => h.id === valdHästId) ?? spel.stall?.[0];
  const hs = häst ? hästStatistik(häst) : null;

  return html`
    <h2>Statistiken</h2>

    <div class="kort">
      <div class="meta">Tränaren · hela karriären</div>
      <div class="prisrad"><span>Starter</span><span class="pris">${t.starter}</span></div>
      <div class="prisrad"><span>Segrar</span><span class="pris">${t.segrar} (${t.segerprocent} %)</span></div>
      <div class="prisrad"><span>Prispengar</span><span class="pris">${kr(t.prispengar)} kr</span></div>
      <div class="prisrad"><span>Snitt per start</span><span class="pris">${kr(t.snittintjäning)} kr</span></div>
      ${t.storloppssegrar > 0 && html`<div class="prisrad"><span>Storloppssegrar</span><span class="pris">${t.storloppssegrar}</span></div>`}
      ${t.bästaBana && html`<div class="prisrad"><span>Bästa bana</span><span class="pris">${t.bästaBana.namn} (${t.bästaBana.segrar} seg)</span></div>`}
      ${t.bästaKusk && html`<div class="prisrad"><span>Främsta kusk</span><span class="pris">${t.bästaKusk.namn} (${t.bästaKusk.segrar} seg)</span></div>`}
      <${Tabell} rubrik="Per säsong (bevarade starter)" rader=${t.säsonger} />
    </div>

    ${(spel.stall ?? []).length > 0 && html`
      <h2>Hästarna</h2>
      <select class="valfält" value=${valdHästId} onChange=${(e) => sättVald(Number(e.target.value) || e.target.value)}>
        ${spel.stall.map((h) => html`<option key=${h.id} value=${h.id}>${h.namn}</option>`)}
      </select>
      ${hs && html`
        <div class="kort">
          <div class="prisrad"><span>Bevarade starter</span><span class="pris">${hs.starter} · ${hs.segrar} seg (${hs.segerprocent} %) · topp 3: ${hs.platsprocent} %</span></div>
          ${hs.bästaKm && html`<div class="prisrad"><span>Bästa kilometertid</span><span class="pris">${hs.bästaKm.toFixed(1).replace(".", ",")}</span></div>`}
          <${Tabell} rubrik="Positionerna" rader=${hs.positioner}
            tom="Positionsdata saknas ännu — den sparas från och med varje ny start." />
          <${Tabell} rubrik="Banorna" rader=${hs.banor}
            tom="Banor sparas per start från och med nu — kör lopp så växer tabellen." />
          <${Tabell} rubrik="Startmetod" rader=${hs.startmetod} />
          <${Tabell} rubrik="Distanser" rader=${hs.distanser} />
          <${Tabell} rubrik="Kuskarna" rader=${hs.kuskar} />
        </div>`}`}
    <div class="hint">Tabellerna räknas på de bevarade resultatraderna (upp till 24 per häst) — karriärtotalerna överst bär helheten.</div>`;
}
