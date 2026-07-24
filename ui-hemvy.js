/**
 * HEM — dagens uppslag
 *
 * Karriärens redaktionella nav: huvudnyheten överst, sedan dagens
 * uppgifter härledda ur spelläget, förstamannens rad, nästa steg och
 * ekonomin. Designprincipen: visa inte bara information — förklara vad
 * den betyder i spelarens karriär.
 */
import { html } from "htm/preact";
import { kr } from "./engine-util.js";
import { BANOR } from "./data-namnpaket.js";
import { träningsråd } from "./engine-forstaman.js";
import { gåraugifter, boxplats } from "./engine-gard.js";
import { ARVODE_PER_VECKA } from "./data-agare.js";

export default function HemVy({ spel, gåTill }) {
  const huvudnyhet = spel.press?.[0];
  const startklara = spel.stall.filter((h) => h.skada === 0 && h.senasteStartVecka !== spel.vecka).length;
  const skadade = spel.stall.filter((h) => h.skada > 0).length;
  const fm = spel.förstaman;
  const avviker = fm ? spel.stall.filter((h) => h.skada === 0 &&
    h.träning !== träningsråd(fm, h).träning).length : 0;
  const drift = spel.stall.length * 3200 + gåraugifter(spel)
    - spel.stall.filter((h) => h.ägare).length * ARVODE_PER_VECKA;

  const uppgifter = [
    spel.prolog?.övertagen && !fm &&
      { text: "Rekrytera din förstaman", akut: true, flik: "stall" },
    spel.banerbjudande &&
      { text: `${BANOR[spel.banerbjudande.banaId]?.namn} vill ha stallet — svara på erbjudandet`, akut: true, flik: "stall" },
    spel.erbjudande &&
      { text: `${spel.erbjudande.ägare} vill lämna ${spel.erbjudande.namn} i träning`, akut: true, flik: "stall" },
    spel.inbjudan?.vecka === spel.vecka &&
      { text: "Inbjudningsloppet gäller bara denna vecka", akut: true, flik: "lopp" },
    startklara > 0 &&
      { text: `${startklara} ${startklara === 1 ? "häst är" : "hästar är"} startklara — veckans anmälan väntar`, flik: "lopp" },
    avviker > 0 &&
      { text: `${fm.namn.split(" ")[0]} vill ändra träningen för ${avviker} ${avviker === 1 ? "häst" : "hästar"}`, flik: "stall" },
    skadade > 0 &&
      { text: `${skadade} ${skadade === 1 ? "häst" : "hästar"} på skadelistan`, flik: "stall" },
    boxplats(spel) === 0 &&
      { text: "Stallet är fullt — inga nya ägarförfrågningar kommer", flik: "mer" },
  ].filter(Boolean);

  return html`
    ${huvudnyhet && html`
      <div class="scen" style=${{ marginTop: "12px" }}>
        <div class="scen-etikett">Säsong ${spel.säsong} · vecka ${Math.min(spel.vecka, spel.veckor)}${spel.hemmabana ? ` · ${BANOR[spel.hemmabana]?.namn}` : ""}</div>
        <div class=${"scen-rubrik" + (huvudnyhet.ton === "dålig" ? " tegel" : "")}>${huvudnyhet.rubrik}</div>
        <div class="ingress">${huvudnyhet.byline}</div>
      </div>`}

    <h2>I dag</h2>
    <div class="kort">
      ${uppgifter.length === 0
        ? html`<div class="logg">Inga beslut väntar. En bra dag att kika på träningen — eller på marknaden.</div>`
        : html`<div class="idag">
            ${uppgifter.map((u, i) => html`
              <button key=${i} class="idag-rad" style=${{ background: "none", border: "none", borderBottom: "1px dotted var(--linje-mörk)", cursor: "pointer", textAlign: "left", font: "inherit", color: "inherit", width: "100%" }}
                onClick=${() => gåTill(u.flik)}>
                <span class=${"idag-punkt" + (u.akut ? "" : " lugn")} />${u.text}
              </button>`)}
          </div>`}
    </div>

    ${fm && html`
      <div class="samtal">
        <div class="samtal-vem">Förstaman · ${fm.namn}</div>
        <div class="samtal-text">${avviker > 0
          ? `»Jag har gått igenom stallet. ${startklara > 0 ? `${startklara} känns aktuella för start, men` : "Ingen behöver starta, och"} träningen behöver justeras för ${avviker} av hästarna — titta i stallet.«`
          : startklara > 0
            ? `»Träningen ligger rätt. ${startklara === 1 ? "En häst" : `${startklara} hästar`} kan anmälas i veckan — jag har åsikter om vilket lopp.«`
            : `»Lugn vecka. Vi bygger form och sparar krutet.«`}</div>
      </div>`}

    <h2>Ekonomin</h2>
    <div class="kort">
      <div class="prisrad"><span>Kassan</span><span class="pris">${kr(spel.kassa)} kr</span></div>
      <div class="prisrad"><span>Veckans netto (drift, löner, arvoden)</span>
        <span class="pris" style=${drift > 0 ? { color: "var(--tegel)" } : {}}>${drift > 0 ? "−" : "+"}${kr(Math.abs(drift))} kr</span></div>
      <div class="prisrad"><span>Insprunget i år</span><span class="pris">${kr(spel.intjänat)} kr</span></div>
    </div>

    ${(spel.press ?? []).length > 1 && html`
      <h2>Ur pressen</h2>
      <div class="kort">
        ${spel.press.slice(1, 4).map((p, i) => html`
          <div key=${i} class="notis"><b>${p.rubrik}</b> — ${p.byline}</div>`)}
      </div>`}`;
}
