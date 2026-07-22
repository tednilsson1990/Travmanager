import { html } from "htm/preact";
import { KUSKAR, relation, svar } from "./data-kuskar.js";
import { klamp, kr } from "./engine-util.js";
import { tränarliga } from "./engine-varld.js";
import { Tom } from "./ui-delar.js";

export default function SfarVy({ spel }) {
  const externa = spel.stall.filter((h) => h.ägare);
  const marknad = spel.marknadsbild ?? 0;
  const marknadsText = marknad > 0.25
    ? "Dina hästar har överträffat sina odds. Spelarna har noterat det — räkna med kortare odds."
    : marknad < -0.25
      ? "Dina hästar har underpresterat mot sina odds. Marknaden är skeptisk, vilket ger dig utrymme."
      : "Marknaden prissätter ditt stall ungefär rätt.";

  const liga = tränarliga(spel);
  const minPlats = liga.findIndex((r) => r.du) + 1;

  return html`
    <h2>Tränarligan</h2>
    <div class="kort">
      <div class="meta" style="margin-bottom:8px">
        Du ligger ${minPlats}:a av ${liga.length} stall, räknat på insprunget
      </div>
      <table class="liga">
        <thead><tr><th>#</th><th>Stall</th><th>Insprunget</th><th>Seg</th></tr></thead>
        <tbody>
          ${liga.slice(0, 12).map((r, i) => html`
            <tr key=${r.namn} class=${r.du ? "din" : ""}>
              <td>${i + 1}</td>
              <td>${r.namn}${r.filosofi ? html`<br /><span class="ligamini">${r.tränare} · ${r.filosofi}</span>` : ""}</td>
              <td>${kr(r.insprunget)}</td>
              <td>${r.segrar}</td>
            </tr>`)}
          ${minPlats > 12 && html`
            <tr class="din"><td>${minPlats}</td><td>${spel.stallnamn}</td>
              <td>${kr(spel.intjänat)}</td><td>—</td></tr>`}
        </tbody>
      </table>
    </div>

    <h2>Stallets ställning</h2>
    <div class="kort">
      <div class="relrad">
        <div>
          <div class="relnamn">Stallform</div>
          <div class="relmini">senaste tolv starterna · påverkar oddsen på alla dina hästar</div>
        </div>
        <div class="relbar"><i class=${(spel.stallform ?? 50) < 40 ? "kall" : ""}
          style=${{ width: klamp(spel.stallform ?? 50) + "%" }} /></div>
        <div class="svar">${Math.round(spel.stallform ?? 50)}</div>
      </div>
      <div class="logg" style="margin-top:8px">${marknadsText}</div>
    </div>

    <h2>Travmedia</h2>
    ${spel.press.length === 0
      ? html`<${Tom}>Ingen har skrivit om dig än.<//>`
      : spel.press.map((p, i) => html`
          <div key=${i} class=${"klipp " + (p.ton === "bra" ? "bra" : p.ton === "dålig" ? "dålig" : "")}>
            <div class="rubrik">${p.rubrik}</div>
            <div class="byline">Vecka ${p.vecka} · ${p.byline}</div>
          </div>`)}

    <h2>Kuskkåren</h2>
    <div class="hint">Kuskar du kört med, plus kårens mest ryktbara.</div>
    <div class="kort">
      ${[...KUSKAR]
        .filter((k) => spel.kuskrelation[k.namn] !== undefined || k.ryktbarhet > 62)
        .sort((a, b) => b.ryktbarhet - a.ryktbarhet)
        .slice(0, 24)
        .map((k) => {
        const r = relation(spel, k);
        const sv = svar(spel, k);
        return html`
          <div key=${k.namn} class="relrad">
            <div>
              <div class="relnamn">${k.namn}</div>
              <div class="relmini">
                ${k.stil} · rykte ${k.ryktbarhet} · st ${k.start}/av ${k.avslutning}/kyla ${k.kyla}
              </div>
            </div>
            <div class="relbar"><i class=${r < 35 ? "kall" : ""} style=${{ width: klamp(r) + "%" }} /></div>
            <div class=${"svar " + sv.c}>${sv.t}</div>
          </div>`;
      })}
    </div>

    <h2>Ägarna</h2>
    ${externa.length === 0
      ? html`<${Tom}>Du tränar bara egna hästar.<//>`
      : html`<div class="kort">
          ${externa.map((h) => html`
            <div key=${h.id} class="logg">
              <b>${h.ägare}</b> — ${h.namn} · ${h.krav.text} ·
              ${Math.max(0, h.krav.antal - h.kravStarter)} starter kvar
            </div>`)}
        </div>`}`;
}
