import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { synligInkorg, verkställBeslut } from "./engine-inkorg.js";
import { nästaStopp, hoppaFram, stoppFör, STOPPNAMN } from "./engine-klocka.js";
import { arkiveraTelefonen } from "./engine-inkorg.js";

/**
 * TELEFONEN (v131 — Teds riktning: "travtränarens smartphone").
 * Inkorgen ÄR tränarens mobil, och MEDIET BÄR BRÅDSKAN: ett samtal
 * betyder att det är viktigt (skadan, journalisten), ett sms är
 * personligt och snabbt, ett mejl är formellt (arrangören, avtalen),
 * tidningen är omvärlden. Fyra appar med olästmärken:
 *
 *   MEDDELANDEN — trådar per person. Chatten med förstamannen är en
 *     RELATION med historia (telefonloggen), inte veckans lösa
 *     lappar. Beslut besvaras som svarschips, och svaret står kvar
 *     som din utgående bubbla.
 *   SAMTAL — samtalsloggen: "väntar på svar" är ett missat samtal i
 *     tegel. Samtalet öppnas som replikväxling.
 *   MEJL — brev, rapporter och veckans genomgång (fäst överst).
 *   TRAVBLADET — tidningen, som förut.
 *
 * Läsvyn (FM-anatomin från v108) behålls för samtal/mejl/nyheter.
 * BUGGFIX på köpet: rollklass låg efter läsvyn i filen (temporal
 * dead zone) — att öppna ett meddelande har kastat ReferenceError
 * sedan v121. Nu ligger hjälparna först.
 */
const AVSÄNDARINITIAL = (namn) => (namn || "?").trim()[0]?.toUpperCase() ?? "?";
const TYPRUBRIK = { sms: "SMS", samtal: "Telefonsamtal", mejl: "Brev", rapport: "Rapport", nyhet: "Ur Travbladet" };
const FLIKNAMN = { hem: "Hem", stall: "Stallet", lopp: "Loppfliken", sfar: "Sfären", kontor: "Kontoret", "gård": "Gården", mer: "Mer" };

const rollklass = (roll) => ({
  "Förstaman": "roll-forstaman", "Hästskötare": "roll-skotare",
  "Kusk": "roll-kusk", "Hästägare": "roll-agare",
  "Stallveterinär": "roll-vet", "Mentor": "roll-mentor",
  "Rivaltränare": "roll-rival", "Sponsor": "roll-sponsor",
  "Tidningen": "roll-tidning", "Tävlingsledningen": "roll-arrangor",
}[roll] ?? "roll-ovrig");

const APP_AV_TYP = (h) =>
  h.typ === "sms" ? "meddelanden"
  : h.typ === "samtal" ? "samtal"
  : h.typ === "nyhet" ? "nyheter" : "mejl";

const APPAR = [
  { id: "meddelanden", namn: "Meddelanden", glyf: "❞" },
  { id: "samtal", namn: "Samtal", glyf: "✆" },
  { id: "mejl", namn: "Mejl", glyf: "✉" },
  { id: "nyheter", namn: "Travbladet", glyf: "¶" },
];

export default function InkorgVy({ spel, uppdatera, gåTill }) {
  const händelser = synligInkorg(spel);
  const lästa = new Set(spel.inkorgLästa ?? []);
  const [läsId, sättLäs] = useState(null);
  const [app, sättApp] = useState("meddelanden");
  const [trådNamn, sättTråd] = useState(null);

  const perApp = (id) => händelser.filter((h) => APP_AV_TYP(h) === id);
  const olästaI = (lista) => lista.filter((h) => !lästa.has(h.id));
  const badge = (id) => olästaI(perApp(id)).length;

  const markeraLäst = (h) => {
    if (!lästa.has(h.id)) {
      uppdatera((s) => {
        s.inkorgLästa = [...new Set([...(s.inkorgLästa ?? []), h.id])].slice(-120);
      });
    }
  };
  const öppna = (h) => {
    markeraLäst(h);
    if (APP_AV_TYP(h) === "meddelanden") { sättApp("meddelanden"); sättTråd(h.avsändare); sättLäs(null); }
    else sättLäs(h.id);
  };
  const nästaOläst = () => {
    const ordning = ["meddelanden", "samtal", "mejl", "nyheter"];
    const kö = [...olästaI(perApp(app)), ...ordning.filter((a) => a !== app).flatMap((a) => olästaI(perApp(a)))];
    const nästa = kö.find((h) => h.id !== läsId);
    if (nästa) { sättApp(APP_AV_TYP(nästa)); öppna(nästa); }
    else { sättLäs(null); sättTråd(null); }
  };
  const besvara = (h, altId) => { uppdatera((s) => verkställBeslut(s, h, altId)); };

  const statusrad = html`
    <div class="telefon-status">
      <span class="telefon-nät">✆ TRAVNET</span>
      <span>Telefonen</span>
      <span>v ${Math.min(spel.vecka, spel.veckor)} · ${STOPPNAMN[stoppFör(spel)]}</span>
    </div>`;

  /* ==================== TRÅDVYN (Meddelanden) ==================== */
  if (app === "meddelanden" && trådNamn) {
    const nu = perApp("meddelanden").filter((h) => h.avsändare === trådNamn);
    nu.forEach(markeraLäst);
    const roll = nu[0]?.roll ?? (spel.telefonlogg ?? []).findLast((r) => r.avsändare === trådNamn)?.roll;
    const historik = (spel.telefonlogg ?? [])
      .filter((r) => r.avsändare === trådNamn && (r.typ === "sms" || r.typ === "svar"))
      .slice(-14);
    const nuNycklar = new Set(nu.map((h) => `${spel.säsong ?? 1}:${spel.vecka}:${h.id}`));
    const bubblor = [
      ...historik.filter((r) => !nuNycklar.has(r.nyckel))
        .map((r) => ({ ut: r.typ === "svar", text: r.text, vecka: r.vecka, säsong: r.säsong })),
      ...nu.map((h) => ({ ut: false, text: h.lång ?? h.text, vecka: spel.vecka, säsong: spel.säsong ?? 1, händelse: h })),
    ];
    const sistaBeslut = [...nu].reverse().find((h) => h.beslut);
    return html`
      ${statusrad}
      <div class="läsvy chatt-vy">
        <div class="läs-topp">
          <button class="ikonknapp" onClick=${() => sättTråd(null)}>‹ Meddelanden</button>
          <span class="inkorgs-typ">SMS</span>
        </div>
        <div class="läs-huvud">
          <div class=${"sms-initial stor " + rollklass(roll)}>${AVSÄNDARINITIAL(trådNamn)}</div>
          <div>
            <div class="läs-avsändare">${trådNamn}</div>
            ${roll && html`<div class="läs-roll">${roll}</div>`}
          </div>
        </div>
        <div class="chatt">
          ${bubblor.length === 0 && html`<div class="hint">Inga meddelanden i tråden ännu.</div>`}
          ${bubblor.map((b, i) => html`
            <div key=${i} class=${"bubbelrad" + (b.ut ? " ut" : "")}>
              <div class=${"bubbla " + (b.ut ? "bubbla-ut" : "bubbla-in " + rollklass(roll))}>
                <div class="bubbla-text">${b.text}</div>
                <div class="bubbla-tid">v ${b.vecka}${b.säsong !== (spel.säsong ?? 1) ? ` s${b.säsong}` : ""}</div>
              </div>
            </div>`)}
        </div>
        <div class="läs-botten">
          ${sistaBeslut && sistaBeslut.beslut.alternativ.map((a) => html`
            <button key=${a.id} class=${"svarschip" + (a.sekundär ? " sekundär" : "")}
              onClick=${() => besvara(sistaBeslut, a.id)}>${a.etikett}</button>`)}
          ${!sistaBeslut && html`
            <button class="btn liten" style=${{ marginLeft: "auto" }} onClick=${nästaOläst}>Nästa olästa →</button>`}
        </div>
      </div>`;
  }

  /* ==================== LÄSVYN (samtal, mejl, nyheter) ==================== */
  const läser = händelser.find((h) => h.id === läsId);
  if (läser) {
    const h = läser;
    const kvarOlästa = olästaI(händelser).filter((x) => x.id !== h.id).length;
    const ärSamtal = h.typ === "samtal";
    return html`
      ${statusrad}
      <div class=${"läsvy" + (ärSamtal ? " samtalsvy" : "")}>
        <div class="läs-topp">
          <button class="ikonknapp" onClick=${() => sättLäs(null)}>‹ ${APPAR.find((a) => a.id === app)?.namn ?? "Telefonen"}</button>
          <span class="inkorgs-typ">${TYPRUBRIK[h.typ]}</span>
          <span class="läs-vecka">v ${Math.min(spel.vecka, spel.veckor)}</span>
        </div>
        <div class="läs-huvud">
          <div class=${"sms-initial stor " + rollklass(h.roll)}>${AVSÄNDARINITIAL(h.avsändare)}</div>
          <div>
            <div class="läs-avsändare">${h.avsändare}</div>
            ${h.roll && html`<div class="läs-roll">${h.roll}${h.tråd ? html` · <span class=${"trådtext " + rollklass(h.roll)}>${h.tråd}</span>` : ""}</div>`}
          </div>
          ${ärSamtal && html`<span class=${"samtals-puls " + (h.prioritet === "beslut" ? "tegel" : "")}>✆</span>`}
          ${!ärSamtal && h.prioritet === "beslut" && html`<span class="inkorgs-märke tegel">Kräver beslut</span>`}
        </div>
        <div class="läs-inre">
          ${h.typ === "nyhet" && html`<div class="klipp-etikett">${h.etikett ?? "Travbladet"}</div>`}
          <h1 class="helskärm-rubrik">${h.rubrik}</h1>
          <div class=${"förhand-text" + (ärSamtal ? " replikväxling" : "")}>${(h.lång ?? h.text).split("\n\n").map((stycke, i) =>
            html`<p key=${i}>${stycke}</p>`)}</div>
          ${(h.detaljer ?? []).length > 0 && html`
            <div class="läs-tabell">
              ${h.detaljer.map((d) => html`
                <div key=${d.namn} class="prisrad"><span>${d.namn}</span><span class="pris">${d.värde}</span></div>`)}
            </div>`}
        </div>
        <div class="läs-botten">
          ${h.beslut && h.beslut.alternativ.map((a) => html`
            <button key=${a.id} class=${"btn" + (a.sekundär ? " sekundär liten" : "")}
              onClick=${() => { besvara(h, a.id); nästaOläst(); }}>
              ${a.etikett}
            </button>`)}
          ${!h.beslut && h.flik && html`
            <button class="btn liten sekundär" onClick=${() => gåTill(h.flik)}>
              Öppna ${FLIKNAMN[h.flik] ?? h.flik} →
            </button>`}
          <button class="btn liten" style=${{ marginLeft: "auto" }} onClick=${nästaOläst}>
            ${kvarOlästa > 0 ? `Nästa olästa (${kvarOlästa}) →` : "Till telefonen →"}
          </button>
        </div>
      </div>`;
  }

  /* ==================== APPARNAS LISTOR ==================== */
  const nyckelvärde = (h) => h.detaljer?.[0]?.värde ?? null;
  const alltOläst = olästaI(händelser).length;

  const meddelanden = perApp("meddelanden");
  const trådar = [...new Set(meddelanden.map((h) => h.avsändare))].map((namn) => {
    const mina = meddelanden.filter((h) => h.avsändare === namn);
    const senaste = mina[mina.length - 1];
    return { namn, roll: senaste.roll, senaste, olästa: olästaI(mina).length,
      beslut: mina.some((h) => h.beslut) };
  });

  const samtalen = perApp("samtal");
  const mejlen = perApp("mejl");
  const fästa = mejlen.filter((h) => h.fäst);
  const nyheterna = perApp("nyheter");

  const innehåll = {
    meddelanden: html`
      ${trådar.length === 0 && html`<div class="kort"><div class="logg">Inga meddelanden. Lugnt i luren.</div></div>`}
      ${trådar.map((t) => html`
        <div key=${t.namn} class=${"post-rad tråd-rad" + (t.olästa ? "" : " läst")}
          onClick=${() => sättTråd(t.namn)}>
          <div class=${"sms-initial " + rollklass(t.roll)}>${AVSÄNDARINITIAL(t.namn)}</div>
          <div class="tråd-mitt">
            <div class="sms-vem">${t.olästa > 0 && html`<span class="ny-punkt">●</span>`}${t.namn}
              ${t.beslut && html`<span class="inkorgs-märke tegel liten-märke">svara</span>`}</div>
            <div class="rad-klipp">${t.senaste.text}</div>
          </div>
          ${t.olästa > 0 && html`<span class="tråd-badge">${t.olästa}</span>`}
        </div>`)}`,
    samtal: html`
      ${samtalen.length === 0 && html`<div class="kort"><div class="logg">Inga samtal. Luren är tyst.</div></div>`}
      ${samtalen.map((h) => {
        const oläst = !lästa.has(h.id);
        const missat = h.prioritet === "beslut";
        return html`
          <div key=${h.id} class=${"post-rad samtalsrad" + (missat ? " missat" : "") + (oläst ? "" : " läst")}
            onClick=${() => öppna(h)}>
            <span class=${"tel-ikon " + rollklass(h.roll)}>✆</span>
            <div class="tråd-mitt">
              <div class="sms-vem">${oläst && html`<span class="ny-punkt">●</span>`}${h.avsändare}</div>
              <div class="samtals-etikett">${missat ? "Missat samtal — ring upp" : "Inkommande samtal"} · ${h.rubrik}</div>
            </div>
            ${nyckelvärde(h) && html`<span class="rad-nyckel">${nyckelvärde(h)}</span>`}
          </div>`;
      })}`,
    mejl: html`
      ${mejlen.length === 0 && html`<div class="kort"><div class="logg">Tom inkorg. Skönt, eller?</div></div>`}
      ${fästa.map((h) => html`
        <div key=${h.id} class=${"möteskort" + (lästa.has(h.id) ? " läst" : "")} onClick=${() => öppna(h)}>
          <div class="mötes-etikett">Veckans genomgång</div>
          <div class="mötes-vem">${h.avsändare} · måndag</div>
          <div class="rad-klipp mötes-ingress">${h.text}</div>
        </div>`)}
      ${mejlen.filter((h) => !h.fäst).map((h) => {
        const oläst = !lästa.has(h.id);
        const kant = h.prioritet === "beslut" ? " tegel-kant" : h.prioritet === "rekommendation" ? " guld-kant" : "";
        if (h.typ === "rapport") {
          return html`
            <div key=${h.id} class=${"post-rad rapport-kort kompakt" + kant + (oläst ? "" : " läst")} onClick=${() => öppna(h)}>
              <div class="rapport-etikett">${oläst && html`<span class="ny-punkt">●</span>`}Rapport · ${h.avsändare}</div>
              <div class="val-rubrik">${h.rubrik}</div>
            </div>`;
        }
        return html`
          <div key=${h.id} class=${"post-rad brev-kort kompakt" + kant + (oläst ? "" : " läst")} onClick=${() => öppna(h)}>
            <div class="brev-rad"><span>Från</span> ${h.avsändare}${h.roll ? ` · ${h.roll}` : ""}</div>
            <div class="brev-rad ämne"><span>Ämne</span> ${oläst && html`<span class="ny-punkt">●</span>`}${h.rubrik}
              ${nyckelvärde(h) && html`<span class="rad-nyckel">${nyckelvärde(h)}</span>`}</div>
          </div>`;
      })}`,
    nyheter: html`
      ${nyheterna.length === 0 && html`<div class="kort"><div class="logg">Inga nyheter i veckan.</div></div>`}
      ${nyheterna.map((h) => {
        const oläst = !lästa.has(h.id);
        return html`
          <div key=${h.id} class=${"post-rad klipp inkorgs-klipp kompakt" + (oläst ? "" : " läst")} onClick=${() => öppna(h)}>
            <div class="klipp-etikett">${oläst && html`<span class="ny-punkt">●</span>`}${h.etikett ?? "Travbladet"}</div>
            <div class="klipp-rubrik">${h.rubrik}</div>
            <div class="klipp-rad rad-klipp">${h.text}</div>
          </div>`;
      })}`,
  }[app];

  return html`
    ${statusrad}
    <div class="app-rad">
      ${APPAR.map((a) => html`
        <button key=${a.id} class=${"app-knapp" + (app === a.id ? " aktiv" : "")}
          onClick=${() => { sättApp(a.id); sättTråd(null); }}>
          <span class="app-glyf">${a.glyf}</span>${a.namn}
          ${badge(a.id) > 0 && html`<span class="app-badge">${badge(a.id)}</span>`}
        </button>`)}
    </div>
    ${alltOläst > 0 && html`
      <button class="btn liten" style=${{ marginBottom: "10px" }} onClick=${nästaOläst}>
        Läs nästa olästa (${alltOläst}) →</button>`}
    ${innehåll}
    <button class="btn" style=${{ marginTop: "12px" }} onClick=${() => {
      let mål;
      uppdatera((s) => { arkiveraTelefonen(s); mål = hoppaFram(s); });
      sättLäs(null); sättTråd(null);
      if (mål !== "vecka") gåTill("lopp");
    }}>${nästaStopp(spel).etikett}</button>`;
}
