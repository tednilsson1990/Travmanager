import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { synligInkorg, verkställBeslut } from "./engine-inkorg.js";
import { nästaStopp, hoppaFram, stoppFör, STOPPNAMN } from "./engine-klocka.js";

/**
 * INKORGSVYN (v108 — Football Managers anatomi, mobilanpassad efter
 * Teds skärmbild). FM på PC: lista till vänster, stor läsyta till
 * höger med avsändare + roll i huvudet, strukturerat innehåll och
 * åtgärdsknapparna i botten, plus NEXT UNREAD som bär en genom posten.
 *
 * På mobil blir spalterna LÄGEN:
 *   LISTAN — segmenterad i Post och Nyheter (FM skiljer Inbox från
 *            News), sektionerad efter prioritet, typformade rader
 *            (bubblor, samtalskort, brev, trycksaker, urklipp) med
 *            olästpunkt och nyckelvärde. »Läs nästa olästa →« överst.
 *   LÄSVYN — hela ytan blir meddelandet: huvud med initial, avsändare
 *            och ROLL ("Ulla · Förstaman"), rubrik i läsningstypografi,
 *            styckad brödtext, detaljtabellen — och åtgärdsraden
 *            KLISTRAD I BOTTEN som i FM: besluten som primär/sekundär
 *            knapp, »Nästa olästa →« alltid till höger. Tillbakapilen
 *            uppe till vänster.
 *
 * Läsvyn ersätter både v103:s förhand och helskärm — på en telefon ÄR
 * läsvyn helskärmen.
 */
const AVSÄNDARINITIAL = (namn) => (namn || "?").trim()[0]?.toUpperCase() ?? "?";
const TYPRUBRIK = { sms: "SMS", samtal: "Telefonsamtal", mejl: "Brev", rapport: "Rapport", nyhet: "Ur Travbladet" };
const FLIKNAMN = { hem: "Hem", stall: "Stallet", lopp: "Loppfliken", sfar: "Sfären", kontor: "Kontoret", "gård": "Gården", mer: "Mer" };
const ÄR_NYHET = (h) => h.typ === "nyhet";

export default function InkorgVy({ spel, uppdatera, gåTill }) {
  const händelser = synligInkorg(spel);
  const lästa = new Set(spel.inkorgLästa ?? []);
  const [läsId, sättLäs] = useState(null);
  const [segment, sättSegment] = useState("post");

  const post = händelser.filter((h) => !ÄR_NYHET(h));
  const nyheter = händelser.filter(ÄR_NYHET);
  const aktiva = segment === "post" ? post : nyheter;
  const olästaI = (lista) => lista.filter((h) => !lästa.has(h.id));

  const markeraLäst = (h) => {
    if (!lästa.has(h.id)) {
      uppdatera((s) => {
        s.inkorgLästa = [...new Set([...(s.inkorgLästa ?? []), h.id])].slice(-120);
      });
    }
  };
  const öppna = (h) => { markeraLäst(h); sättLäs(h.id); };
  const nästaOläst = () => {
    const kö = [...olästaI(aktiva), ...olästaI(segment === "post" ? nyheter : post)];
    const nästa = kö.find((h) => h.id !== läsId);
    if (nästa) { if (ÄR_NYHET(nästa) !== (segment === "nyheter")) sättSegment(ÄR_NYHET(nästa) ? "nyheter" : "post"); öppna(nästa); }
    else sättLäs(null);
  };

  /* ==================== LÄSVYN ==================== */
  const läser = händelser.find((h) => h.id === läsId);
  if (läser) {
    const h = läser;
    const kvarOlästa = olästaI(händelser).filter((x) => x.id !== h.id).length;
    return html`
      <div class="läsvy">
        <div class="läs-topp">
          <button class="ikonknapp" onClick=${() => sättLäs(null)}>‹ Inkorgen</button>
          <span class="inkorgs-typ">${TYPRUBRIK[h.typ]}</span>
          <span class="läs-vecka">v ${Math.min(spel.vecka, spel.veckor)} · ${STOPPNAMN[stoppFör(spel)]}</span>
        </div>
        <div class="läs-huvud">
          <div class="sms-initial stor">${AVSÄNDARINITIAL(h.avsändare)}</div>
          <div>
            <div class="läs-avsändare">${h.avsändare}</div>
            ${h.roll && html`<div class="läs-roll">${h.roll}</div>`}
          </div>
          ${h.prioritet === "beslut" && html`<span class="inkorgs-märke tegel">Kräver beslut</span>`}
        </div>
        <div class="läs-inre">
          ${ÄR_NYHET(h) && html`<div class="klipp-etikett">${h.etikett ?? "Travbladet"}</div>`}
          <h1 class="helskärm-rubrik">${h.rubrik}</h1>
          <div class="förhand-text">${(h.lång ?? h.text).split("\n\n").map((stycke, i) =>
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
              onClick=${() => { uppdatera((s) => verkställBeslut(s, h, a.id)); nästaOläst(); }}>
              ${a.etikett}
            </button>`)}
          ${!h.beslut && h.flik && html`
            <button class="btn liten sekundär" onClick=${() => gåTill(h.flik)}>
              Öppna ${FLIKNAMN[h.flik] ?? h.flik} →
            </button>`}
          <button class="btn liten" style=${{ marginLeft: "auto" }} onClick=${nästaOläst}>
            ${kvarOlästa > 0 ? `Nästa olästa (${kvarOlästa}) →` : "Till listan →"}
          </button>
        </div>
      </div>`;
  }

  /* ==================== LISTAN ==================== */
  const nyckelvärde = (h) => h.detaljer?.[0]?.värde ?? null;

  const rad = (h) => {
    const oläst = !lästa.has(h.id);
    const kant = h.prioritet === "beslut" ? " tegel-kant" : h.prioritet === "rekommendation" ? " guld-kant" : "";
    const dämpad = oläst ? "" : " läst";
    if (h.typ === "sms") {
      return html`
        <div key=${h.id} class=${"post-rad sms-rad kompakt" + dämpad} onClick=${() => öppna(h)}>
          <div class="sms-initial">${AVSÄNDARINITIAL(h.avsändare)}</div>
          <div class=${"sms-bubbla" + kant}>
            <div class="sms-vem">${oläst && html`<span class="ny-punkt">●</span>`}${h.avsändare}</div>
            <div class="rad-klipp">${h.text}</div>
          </div>
        </div>`;
    }
    if (h.typ === "samtal") {
      return html`
        <div key=${h.id} class=${"post-rad tel-kort kompakt" + kant + dämpad} onClick=${() => öppna(h)}>
          <div class="tel-topp"><span class="tel-ikon">✆</span> ${oläst && html`<span class="ny-punkt">●</span>`}${h.avsändare}${h.prioritet === "beslut" ? " · väntar på svar" : ""}
            ${nyckelvärde(h) && html`<span class="rad-nyckel">${nyckelvärde(h)}</span>`}</div>
          <div class="rad-klipp tel-citat">${h.text}</div>
        </div>`;
    }
    if (h.typ === "nyhet") {
      return html`
        <div key=${h.id} class=${"post-rad klipp inkorgs-klipp kompakt" + dämpad} onClick=${() => öppna(h)}>
          <div class="klipp-etikett">${oläst && html`<span class="ny-punkt">●</span>`}${h.etikett ?? "Travbladet"}</div>
          <div class="klipp-rubrik">${h.rubrik}</div>
          <div class="klipp-rad rad-klipp">${h.text}</div>
        </div>`;
    }
    if (h.typ === "rapport") {
      return html`
        <div key=${h.id} class=${"post-rad rapport-kort kompakt" + kant + dämpad} onClick=${() => öppna(h)}>
          <div class="rapport-etikett">${oläst && html`<span class="ny-punkt">●</span>`}Rapport · ${h.avsändare}</div>
          <div class="val-rubrik">${h.rubrik}</div>
        </div>`;
    }
    return html`
      <div key=${h.id} class=${"post-rad brev-kort kompakt" + kant + dämpad} onClick=${() => öppna(h)}>
        <div class="brev-rad"><span>Från</span> ${h.avsändare}${h.roll ? ` · ${h.roll}` : ""}</div>
        <div class="brev-rad ämne"><span>Ämne</span> ${oläst && html`<span class="ny-punkt">●</span>`}${h.rubrik}
          ${nyckelvärde(h) && html`<span class="rad-nyckel">${nyckelvärde(h)}</span>`}</div>
      </div>`;
  };

  const fästa = post.filter((h) => h.fäst);
  const sektioner = [
    { rubrik: "Kräver beslut", rader: post.filter((h) => !h.fäst && h.prioritet === "beslut") },
    { rubrik: "Förslag", rader: post.filter((h) => !h.fäst && h.prioritet === "rekommendation") },
    { rubrik: "Att läsa", rader: post.filter((h) => !h.fäst && h.prioritet === "info") },
  ].map((sek) => ({ ...sek, olästa: olästaI(sek.rader).length }));
  const alltOläst = olästaI(händelser).length;

  return html`
    <div class="inkorg-topp">
      <h2 style=${{ margin: 0 }}>Inkorgen</h2>
      ${alltOläst > 0 && html`
        <button class="btn liten" onClick=${nästaOläst}>Läs nästa olästa (${alltOläst}) →</button>`}
    </div>
    <div class="segment">
      <button class=${segment === "post" ? "aktiv" : ""} onClick=${() => sättSegment("post")}>
        Post${olästaI(post).length > 0 ? ` · ${olästaI(post).length}` : ""}</button>
      <button class=${segment === "nyheter" ? "aktiv" : ""} onClick=${() => sättSegment("nyheter")}>
        Nyheter${olästaI(nyheter).length > 0 ? ` · ${olästaI(nyheter).length}` : ""}</button>
    </div>
    ${segment === "post" && html`
      ${post.length === 0 && html`<div class="kort"><div class="logg">Ingen post. Lugn vecka i stallet.</div></div>`}
      ${fästa.map((h) => html`
        <div key=${h.id} class=${"möteskort" + (lästa.has(h.id) ? " läst" : "")} onClick=${() => öppna(h)}>
          <div class="mötes-etikett">Veckans genomgång</div>
          <div class="mötes-vem">${h.avsändare} · måndag</div>
          <div class="rad-klipp mötes-ingress">${h.text}</div>
        </div>`)}
      ${sektioner.map((sek) => sek.rader.length === 0 ? "" : html`
        <div key=${sek.rubrik} class="post-sektion">
          <div class="post-rubrik">${sek.rubrik}
            <span class="post-antal">${sek.rader.length}${sek.olästa > 0 ? ` · ${sek.olästa} ${sek.olästa === 1 ? "oläst" : "olästa"}` : ""}</span></div>
          ${sek.rader.map(rad)}
        </div>`)}`}
    ${segment === "nyheter" && html`
      ${nyheter.length === 0 && html`<div class="kort"><div class="logg">Inga nyheter i veckan.</div></div>`}
      ${nyheter.map(rad)}`}
    <button class="btn" style=${{ marginTop: "12px" }} onClick=${() => {
      let mål;
      uppdatera((s) => { mål = hoppaFram(s); });
      sättLäs(null);
      if (mål !== "vecka") gåTill("lopp");
    }}>${nästaStopp(spel).etikett}</button>`;
}
