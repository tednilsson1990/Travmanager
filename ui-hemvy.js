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
import { gåraugifter } from "./engine-gard.js";
import { ARVODE_PER_VECKA } from "./data-agare.js";
import { långsiktigt } from "./engine-vagvisare.js";

export default function HemVy({ spel, gåTill }) {
  /* Huvudnyheten. Är veckans stora händelse registrerad i händelsemotorn
     (storloppsseger, avsked) bär den uppslaget med faktaruta och citat —
     annars faller vi tillbaka på senaste pressnotisen. En källa, ett
     uppslag: vyn hittar inte på något eget. */
  const fm = spel.förstaman;
  const drift = spel.stall.length * 3200 + gåraugifter(spel)
    - spel.stall.filter((h) => h.ägare).length * ARVODE_PER_VECKA;

  /* VÄGVISAREN (kap 16): uppgifterna härleds i engine-vagvisare —
     sorterade så att första raden alltid är veckans viktigaste. */
  const mål = långsiktigt(spel);

  return html`
    ${/* TIDNINGSKLIPPET. Ögonblicket har redan fått sin helskärm — det
        som ligger kvar på Hem är URKLIPPET man sparar: etikett, rubrik i
        klippstorlek, en rad. Före v69 låg hela uppslaget kvar i scen-
        storlek och såg ut som en dubblett av helskärmen den just var. */ ""}
    
    
    ${/* FÖRSTAMANNENS KOMMENTAR (plan 12.2): vardagsrösten på Hem.
        En rad, läst ur stalläget just nu — skador först (viktigast),
        sedan formtopp, sedan storloppsblick, sist lugnet. Profilen
        färgar orden precis som i träningsråden. */ ""}
    ${/* All kommunikation går genom inkorgen sedan v100 (Teds princip) —
        förstamannens repliker är sms där. */ ""}
    ${/* Storyn bor i Sfären sedan v98 (Teds princip: berättelser på
        egna sidor, inte insprängda bland vardagsbesluten). Hem är
        VAD GÖR JAG NU — tidningsklippet och berättelsetrådarna
        flyttade till Travbladet. Bågkortet stannar: det är en plan. */ ""}
    ${spel.båge && html`
      <h2>${spel.båge.veckorKvar === 0 ? "Storloppsvecka" : "På horisonten"}</h2>
      <div class="kort bågkort">
        <div class="namn">${spel.båge.lopp}</div>
        <div class="meta">${spel.båge.bana} · ${spel.båge.veckorKvar === 0 ? "körs i veckan"
          : spel.båge.veckorKvar === 1 ? "nästa vecka" : `om ${spel.båge.veckorKvar} veckor`}
          · förstapris ${kr(spel.båge.förstapris)} kr</div>
        ${spel.båge.kvalade.length > 0 && html`
          <div class="logg">Kvalade: <b>${spel.båge.kvalade.join(", ")}</b></div>`}
        ${spel.båge.nära.map((n) => html`
          <div key=${n.namn} class="logg">${n.namn} saknar <b>${kr(n.saknas)} kr</b> i startsumma</div>`)}
        ${spel.båge.kvalade.length === 0 && spel.båge.nära.length === 0 && html`
          <div class="logg">Ingen av dina hästar når propositionen den här gången.</div>`}
      </div>`}

    ${/* Nästa steg migrerade till inkorgen i v100 (kap 19 etapp B) —
        vägvisarens rader är förstamannens sms där, med genvägar. */ ""}
    <div class="kort">
    ${/* LÅNGSIKTIGT (kap 16.2): de två närmaste onådda milstolparna med
        verklig progress. Riktmärken, inte uppdrag. */ ""}
    ${mål.length > 0 && html`
      <div class="kort">
        <div class="meta">Längre fram</div>
        ${mål.map((k, i) => html`
          <div key=${i} class="relrad">
            <div>
              <div class="relnamn">${k.mål}</div>
              ${k.not && html`<div class="relmini">${k.not}</div>`}
            </div>
            <div class="relbar"><i style=${{ width: Math.round(k.andel * 100) + "%" }} /></div>
            <div class="svar">${k.kr ? Math.round(k.andel * 100) + " %" : `${Math.min(k.nu, k.av)}/${k.av}`}</div>
          </div>`)}
      </div>`}
    </div>

    ${/* Samtalskortet bor i inkorgen (v100). */ ""}

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
