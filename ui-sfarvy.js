import { html } from "htm/preact";
import { Bild } from "./ui-grafik.js";
import { KUSKAR, relation, svar } from "./data-kuskar.js";
import { klamp, kr } from "./engine-util.js";
import { tränarliga } from "./engine-varld.js";
import { Tom } from "./ui-delar.js";
import { förstasidan, statistikern, krönikan } from "./engine-travblad.js";

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

  const historik = spel.historik || [];

  return html`
    ${historik.length > 0 && html`
      <h2>Karriären</h2>
      <div class="kort">
        <table class="karriar">
          <thead><tr><th>Säsong</th><th>Placering</th><th>Insprunget</th><th>Seg</th></tr></thead>
          <tbody>
            ${historik.map((r) => html`
              <tr key=${r.säsong}>
                <td>${r.säsong}</td>
                <td>${r.plats}:a av ${r.avStall}</td>
                <td>${kr(r.intjänat)}</td>
                <td>${r.segrar}</td>
              </tr>`)}
          </tbody>
        </table>
      </div>`}

    <h2>Tränarligan</h2>
    <div class="kort">
      <div class="meta" style="margin-bottom:8px">
        Du ligger ${minPlats}:a av ${liga.length} stall, räknat på insprunget
      </div>
      <table class="liga">
        <thead><tr><th>#</th><th>Stall</th><th>Insprunget</th><th>Per häst</th><th>Seg</th></tr></thead>
        <tbody>
          ${liga.slice(0, 12).map((r, i) => html`
            <tr key=${r.namn} class=${r.du ? "din" : ""}>
              <td>${i + 1}</td>
              <td>${r.namn}${r.filosofi ? html`<br /><span class="ligamini">${r.tränare} · ${r.filosofi}</span>` : ""}</td>
              <td>${kr(r.insprunget)}</td>
              <td>${kr(r.perHäst ?? 0)}</td>
              <td>${r.segrar}</td>
            </tr>`)}
          ${minPlats > 12 && html`
            <tr class="din"><td>${minPlats}</td><td>${spel.stallnamn}</td>
              <td>${kr(spel.intjänat)}</td>
              <td>${kr(Math.round(spel.intjänat / Math.max(1, spel.stall.length)))}</td>
              <td>—</td></tr>`}
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

    ${(() => {
      /* TRAVBLADET (kap 5): en riktig förstasida med nyhetsvärdering —
         uppslaget är veckans tyngsta händelse, artiklarna pressens
         laddade rubriker, notiserna resten. Statistikern räknar och
         krönikören läser läget. Allt ur engine-travblad — vyn hittar
         aldrig på. */
      const sida = förstasidan(spel);
      const stat = statistikern(spel);
      const spalt = krönikan(spel);
      return html`
        <div class="travblad-huvud">TRAVBLADET<span> · säsong ${spel.säsong ?? 1} · vecka ${Math.min(spel.vecka, spel.veckor)}</span></div>
        ${sida.uppslag && html`
          <div class="klipp" style=${{ marginTop: "8px" }}>
            <div class="klipp-etikett">${sida.uppslag.etikett}</div>
            <div class="klipp-rubrik">${sida.uppslag.rubrik}</div>
          </div>`}
        ${sida.artiklar.map((p, i) => html`
          <div key=${"a" + i} class=${"artikel " + (p.ton === "bra" ? "bra" : p.ton === "dålig" ? "dålig" : "")}>
            <div class="artikel-rubrik">${p.rubrik}</div>
            <div class="byline">Vecka ${p.vecka} · ${p.byline}${p.signatur ? ` · Text: ${p.signatur}` : ""}</div>
          </div>`)}
        ${spel.båge && html`<div class="notis"><b>Kommande storlopp:</b> ${spel.båge.lopp} på ${spel.båge.bana} — ${spel.båge.veckorKvar === 0 ? "i veckan" : `om ${spel.båge.veckorKvar} v`}.</div>`}
        ${sida.notiser.length > 0 && html`
          <div class="kort" style=${{ marginTop: "10px" }}>
            ${sida.notiser.map((p, i) => html`
              <div key=${"n" + i} class="notis"><b>${p.rubrik}</b> — ${p.byline} <span class="signatur">(v${p.vecka})</span></div>`)}
          </div>`}
        ${sida.uppslag === null && sida.artiklar.length === 0 && sida.notiser.length === 0 && html`
          <${Tom}>Ingen har skrivit om dig än.<//>`}
        <div class="kort spalt">
          <div class="meta">Siffrorna · ${stat.signatur}</div>
          ${stat.rader.map((r, i) => html`<div key=${i} class="logg">${r}</div>`)}
        </div>
        ${(() => {
          /* PÅGÅENDE BERÄTTELSER — hitflyttade från Hem i v98 (Teds
             princip: story på egna sidor). Ren läsning av tillstånd som
             andra motorer äger; max fyra, ett flöde vore brus. */
          const trådar = [];
          if (spel.båge?.lopp) trådar.push(`Satsningen: ${spel.båge.lopp} om ${spel.båge.veckorKvar} v`);
          const comeback = (spel.stall ?? []).find((h) => h.skadenyhet && h.skada > 0);
          if (comeback) trådar.push(`Comebacken: ${comeback.namn} åter om ${comeback.skada} v`);
          const svacka = (spel.stall ?? []).find((h) => h.svackafråga);
          if (svacka) trådar.push(`Frågetecknet: vad är det med ${svacka.namn}?`);
          if ((spel.förstaman?.ambition ?? 0) >= 70 && !spel.förstaman.delägare)
            trådar.push(`${spel.förstaman.namn.split(" ")[0]} funderar på framtiden`);
          const rival = Object.values(spel.rivaliteter ?? {}).find((r) => (r.möten ?? 0) === 4);
          if (rival) trådar.push(`Rivalitet på väg: ett möte kvar`);
          const tf = (spel.tidigareFörstamän ?? []).find((f) => !f.segerMotDig && f.mötenMotDig > 0);
          if (tf) trådar.push(`Eleven jagar: ${tf.namn} har ännu inte slagit dig`);
          return trådar.length === 0 ? "" : html`
            <div class="kort trådar">
              <div class="meta">Pågående berättelser</div>
              ${trådar.slice(0, 4).map((t, i) => html`<div key=${i} class="tråd">❧ ${t}</div>`)}
            </div>`;
        })()}
        <div class="kort spalt kronika">
          <div class="meta">Krönikan · ${spalt.signatur}</div>
          <div class="kronika-stycke">${spalt.text}</div>
        </div>`;
    })()}

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
