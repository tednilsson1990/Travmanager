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
  /* Huvudnyheten. Är veckans stora händelse registrerad i händelsemotorn
     (storloppsseger, avsked) bär den uppslaget med faktaruta och citat —
     annars faller vi tillbaka på senaste pressnotisen. En källa, ett
     uppslag: vyn hittar inte på något eget. */
  const stor = spel.huvudnyhet;
  const storFärsk = stor && stor.säsong === (spel.säsong ?? 1)
    && spel.vecka - stor.vecka <= 1;
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

    ${/* PÅGÅENDE BERÄTTELSER (plan 15): trådarna som redan lever i
        systemen, synliga på ett ställe. Ren läsning — varje rad pekar
        på tillstånd som andra motorer äger. Max fyra; ett flöde av
        allt vore brus, inte berättelse. */ ""}
    ${(() => {
      const trådar = [];
      if (spel.båge?.lopp) trådar.push(`Satsningen: ${spel.båge.lopp.kortnamn} om ${spel.båge.veckorKvar} v`);
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
        <div class="etikettrad" style=${{ marginTop: "14px" }}>Pågående berättelser</div>
        <div class="kort trådar">
          ${trådar.slice(0, 4).map((t, i) => html`<div key=${i} class="tråd">❧ ${t}</div>`)}
        </div>`;
    })()}

    ${storFärsk
      ? html`
        <div class="klipp" style=${{ marginTop: "12px" }}>
          <div class="klipp-etikett">Ur ${""}Travbladet · ${stor.etikett}</div>
          <div class="klipp-rubrik">${stor.rubrik}</div>
          <div class="klipp-rad">${stor.ingress}</div>
        </div>`
      : huvudnyhet && html`
        <div class="klipp" style=${{ marginTop: "12px" }}>
          <div class="klipp-etikett">Säsong ${spel.säsong} · vecka ${Math.min(spel.vecka, spel.veckor)}${spel.hemmabana ? ` · ${BANOR[spel.hemmabana]?.namn}` : ""}</div>
          <div class=${"klipp-rubrik" + (huvudnyhet.ton === "dålig" ? " tegel" : "")}>${huvudnyhet.rubrik}</div>
          <div class="klipp-rad">${huvudnyhet.byline}</div>
        </div>`}

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
