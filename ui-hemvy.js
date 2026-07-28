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
import { träningsråd } from "./engine-forstaman.js";
import { ARVODE_PER_VECKA } from "./data-agare.js";
import { nästaSteg, långsiktigt } from "./engine-vagvisare.js";

export default function HemVy({ spel, gåTill }) {
  /* Huvudnyheten. Är veckans stora händelse registrerad i händelsemotorn
     (storloppsseger, avsked) bär den uppslaget med faktaruta och citat —
     annars faller vi tillbaka på senaste pressnotisen. En källa, ett
     uppslag: vyn hittar inte på något eget. */
  const fm = spel.förstaman;
  /* Förstamansradens fakta (v98-lagningen: v90-flytten till vägvisaren
     tog variablerna men lämnade repliken — "Can't find variable: avviker"). */
  const startklara = spel.stall.filter((h) => h.skada === 0 && h.senasteStartVecka !== spel.vecka).length;
  const avviker = fm ? spel.stall.filter((h) => h.skada === 0 &&
    h.träning !== träningsråd(fm, h).träning).length : 0;
  const drift = spel.stall.length * 3200 + gåraugifter(spel)
    - spel.stall.filter((h) => h.ägare).length * ARVODE_PER_VECKA;

  /* VÄGVISAREN (kap 16): uppgifterna härleds i engine-vagvisare —
     sorterade så att första raden alltid är veckans viktigaste. */
  const uppgifter = nästaSteg(spel);
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
    ${spel.förstaman && (() => {
      const fm = spel.förstaman;
      const skadade = (spel.stall ?? []).filter((h) => h.skada > 0);
      const topp = [...(spel.stall ?? [])].filter((h) => h.skada === 0)
        .sort((a, b) => (b.form ?? 0) - (a.form ?? 0))[0];
      const rad = skadade.length >= 2
        ? `${skadade.length} hästar på boxvila. ${fm.profil === "pådrivare" ? "Vi tappar tempo — jag gillar det inte." : "Vi låter dem läka klart. Tålamod nu."}`
        : skadade.length === 1
          ? `${skadade[0].namn} är ${skadade[0].skada} v från comeback. Resten jobbar på.`
          : topp && (topp.form ?? 0) > 68
            ? `${topp.namn} känns ${fm.profil === "taktiker" ? "klar för rätt proposition — jag tittar i programmen" : "bättre än på länge. Dags att visa det"}.`
            : spel.båge?.lopp
              ? `Allt handlar om ${spel.båge.lopp.kortnamn} nu. ${spel.båge.veckorKvar} veckor.`
              : `Lugn vecka i stallet. ${fm.profil === "fostrare" ? "Det är då man bygger." : "För lugn, om du frågar mig."}`;
      return html`
        <div class="fm-rad">
          <span class="fm-namn">${fm.namn.split(" ")[0]}:</span> »${rad}«
        </div>`;
    })()}

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

    <h2>Nästa steg</h2>
    <div class="kort">
      ${uppgifter.length === 0
        ? html`<div class="logg">Inga beslut väntar. En bra dag att kika på träningen — eller på marknaden.</div>`
        : html`<div class="idag">
            ${uppgifter.map((u, i) => html`
              <button key=${i} class="idag-rad" style=${{ background: "none", border: "none", borderBottom: "1px dotted var(--linje-mörk)", cursor: "pointer", textAlign: "left", font: "inherit", color: "inherit", width: "100%" }}
                onClick=${() => gåTill(u.flik)}>
                <span class=${"idag-punkt" + (u.akut ? "" : u.ton === "gul" ? " gul" : " lugn")} />${u.text}
              </button>`)}
          </div>`}

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
