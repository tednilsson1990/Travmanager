/**
 * STALLJOURNALEN — karriärens minne, läsbart
 *
 * Händelsemotorn har alltid samlat allt som hänt; fram till v59 fanns det
 * ingenstans att LÄSA det. Journalen är den vyn: krönikan i omvänd
 * kronologi, troférummet, och rivaliteterna som spelet upptäckt ur data.
 *
 * Vyn hittar aldrig på text. Allt som visas är registrerade händelser —
 * det är hela poängen med en händelsemotor. Ser något fel ut här är felet
 * i registreringen, inte i vyn.
 */
import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { kr } from "./engine-util.js";
import { Tom } from "./ui-delar.js";

/* Hur en händelsetyp skrivs för ett mänskligt öga. Okända typer visas med
   sitt eget namn i stället för att döljas — då syns det när något nytt
   registreras utan att ha fått en text. */
const TYPTEXT = {
  första_start: "Första start", första_prispeng: "Första prispengen",
  första_seger: "Första segern", storloppsseger: "Storloppsseger",
  miljonen: "Miljonen", gårdsrekord: "Gårdsrekord", rivalitet: "Rivalitet",
  pensionering: "Pensionering", övertagande: "Övertagandet",
  förstaman_anställd: "Ny förstaman", comeback: "Comeback",
};
const typtext = (t) => TYPTEXT[t] ?? TYPTEXT[String(t).split("_")[0]] ?? t;

/** Betydelsen avgör vikten i flödet — inte allt ska ha stor rubrik. */
const klassAv = (b) => (b >= 80 ? "hög" : b >= 50 ? "mellan" : "låg");

function radtext(h) {
  const d = h.data ?? {};
  const namn = h.aktörer?.hästNamn;
  switch (h.typ) {
    case "storloppsseger":
      return `${namn} vann ${d.lopp}${d.bana ? ` på ${d.bana}` : ""}`
        + (d.position1000 ? `, ${d.position1000} vid 1 000 m` : "") + ".";
    case "första_seger":
      return `${namn} tog sin första seger i ${d.lopp}.`;
    case "första_start":
      return `${namn} debuterade i ${d.lopp}.`;
    case "första_prispeng":
      return `${namn} tjänade sina första kronor.`;
    case "miljonen":
      return `${namn} passerade en miljon i insprunget.`;
    case "rivalitet":
      return `${namn} och ${d.rival} har mötts ${d.möten} gånger — ${d.dinaSegrar}–${d.hansSegrar}.`;
    case "pensionering":
      return `${namn} pensionerades ${d.ålder} år gammal: ${d.starter} starter, `
        + `${d.segrar} segrar, ${kr(d.intjänat ?? 0)} kr.`;
    case "gårdsrekord":
      return d.text ?? "Nytt gårdsrekord.";
    default:
      return d.text ?? `${namn ?? ""} — ${typtext(h.typ)}`.trim();
  }
}

export default function JournalVy({ spel }) {
  const [flik, sättFlik] = useState("krönika");
  const [bara, sättBara] = useState("allt");

  const krönika = [...(spel.krönika ?? [])].reverse();
  const filtrerad = bara === "allt" ? krönika
    : bara === "stort" ? krönika.filter((h) => (h.betydelse ?? 0) >= 55)
    : krönika.filter((h) => h.säsong === (spel.säsong ?? 1));

  const troféer = spel.troférum ?? [];
  const rivaler = Object.values(spel.rivaliteter ?? {})
    .filter((r) => r.möten >= 2)
    .sort((a, b) => b.möten - a.möten);

  return html`
    <div class="flikar">
      ${["krönika", "troférum", "rivaler"].map((f) => html`
        <button key=${f} class="flik" aria-selected=${flik === f}
          onClick=${() => sättFlik(f)}>${f}</button>`)}
    </div>

    ${flik === "krönika" && html`
      <div class="hint">Allt spelet minns om din karriär, senast först.</div>
      <div class="chips" style=${{ marginBottom: "10px" }}>
        ${[["allt", "Allt"], ["stort", "Bara det stora"], ["säsong", "Denna säsong"]].map(([id, t]) => html`
          <button key=${id} class="chip" aria-pressed=${bara === id}
            onClick=${() => sättBara(id)}>${t}</button>`)}
      </div>
      ${filtrerad.length === 0
        ? html`<${Tom}>Krönikan är tom än. Den skrivs av det som händer.<//>`
        : html`<div class="kort">
            ${filtrerad.map((h) => html`
              <div key=${h.id} class=${"journalrad " + klassAv(h.betydelse ?? 0)}>
                <div class="jr-när">S${h.säsong} · v${h.vecka}</div>
                <div class="jr-text">
                  <b>${typtext(h.typ)}</b>
                  <div>${radtext(h)}</div>
                </div>
              </div>`)}
          </div>`}`}

    ${flik === "troférum" && html`
      <div class="hint">Gårdens fysiska minne. Det som står kvar när säsongen är slut.</div>
      ${troféer.length === 0
        ? html`<${Tom}>Skåpet är tomt. Vinn ett storlopp så fylls det.<//>`
        : html`<div class="kort">
            ${troféer.map((t, i) => html`
              <div key=${i} class="trofe">
                <div class=${"trofe-ikon " + t.typ} aria-hidden="true" />
                <div>
                  <div class="trofe-rubrik">${t.rubrik}</div>
                  <div class="meta">${t.häst ? t.häst + " · " : ""}säsong ${t.säsong}</div>
                  <div class="logg">${t.text}</div>
                </div>
              </div>`)}
          </div>`}`}

    ${flik === "rivaler" && html`
      <div class="hint">
        Rivaliteter utropas inte — de upptäcks. Möter ni varandra om och om
        igen räknar spelet mötena och skriver om det.
      </div>
      ${rivaler.length === 0
        ? html`<${Tom}>Ingen motståndare har hunnit bli en rival än.<//>`
        : html`<div class="kort">
            ${rivaler.map((r) => html`
              <div key=${r.hästId + ":" + r.rivalId} class="relrad">
                <div>
                  <div class="relnamn">${r.hästNamn} mot ${r.rivalNamn}</div>
                  <div class="relmini">
                    ${r.möten} möten · senast säsong ${r.senast?.säsong} vecka ${r.senast?.vecka}
                    ${r.utropad ? " · omskriven" : ""}
                  </div>
                </div>
                <div class="svar ${r.dinaSegrar > r.hansSegrar ? "bra" : r.dinaSegrar < r.hansSegrar ? "dålig" : ""}">
                  ${r.dinaSegrar}–${r.hansSegrar}
                </div>
              </div>`)}
          </div>`}`}`;
}
