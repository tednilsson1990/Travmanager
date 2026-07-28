/**
 * KONTORET — verksamhetens vy (v84, kap 6–8 + designförslagets 6/7/8)
 *
 * Stallkontoret i dagsljus: här bor relationerna och pengarna. Tre
 * avdelningar på samma papper:
 *
 *   EKONOMIN — inte bara en totalsumma utan konsekvenserna: veckans
 *   netto, hur många veckor kassan räcker och vad de tomma boxarna
 *   kostar. Spelaren ska fatta verksamhetsbeslut, inte läsa en siffra.
 *
 *   ÄGARNA — varje ägare är en person med typ, två nöjdhetsdimensioner
 *   (sport och kommunikation — man kan vara nöjd med den ena och trött
 *   på den andra) och en mötesknapp. Mötet är kontorets viktigaste
 *   handling: det är så relationer vårdas i verkligheten.
 *
 *   SPONSORERNA — aktiva avtal med kravläget synligt, och erbjudanden
 *   med hela avvägningen på bordet: pengar och förmåner mot krav som
 *   styr hur stallet får tävla.
 *
 * Vyn hittar aldrig på: allt som visas läses ur ägar- och sponsor-
 * motorerna, och varje handling går genom dem.
 */
import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { kr } from "./engine-util.js";
import { ARVODE_PER_VECKA, ÄGARTYPER } from "./data-agare.js";
import { boxplats } from "./engine-gard.js";
import { veckonetto } from "./engine-vagvisare.js";
import { ägarlista, hållMöte, MÖTESVAL } from "./engine-agare.js";
import { säkraSponsorer, teckna, tackaNej, kravläge } from "./engine-sponsor.js";
import { Stapel } from "./ui-delar.js";
import { Bild } from "./ui-grafik.js";



function Ekonomi({ spel }) {
  const { intäkter, kostnader, netto, sponsor } = veckonetto(spel);
  const veckorKvar = netto < 0 ? Math.floor(spel.kassa / -netto) : null;
  const tomma = boxplats(spel);
  return html`
    <div class="kort">
      <div class="meta">Ekonomin · fasta veckoposter</div>
      <div class="prisrad"><span>Kassa</span><span class="pris">${kr(spel.kassa)} kr</span></div>
      <div class="prisrad"><span>Träningsarvoden</span><span class="pris">+${kr(intäkter - sponsor)} kr/v</span></div>
      ${sponsor > 0 && html`<div class="prisrad"><span>Sponsorer</span><span class="pris">+${kr(sponsor)} kr/v</span></div>`}
      <div class="prisrad"><span>Drift och anläggning</span><span class="pris">−${kr(kostnader)} kr/v</span></div>
      <div class="prisrad"><span>Fast netto</span>
        <span class=${"pris " + (netto >= 0 ? "" : "ner")}>${netto >= 0 ? "+" : "−"}${kr(Math.abs(netto))} kr/v</span></div>
      ${veckorKvar !== null && html`
        <div class=${"förvänt" + (veckorKvar < 8 ? " varning" : "")}>
          Utan prispengar räcker kassan <b>${veckorKvar} veckor</b>.
        </div>`}
      ${tomma > 0 && html`<div class="logg">
        ${tomma} tom${tomma === 1 ? "" : "ma"} box${tomma === 1 ? "" : "ar"} — varje extern häst där vore
        <b>+${kr(ARVODE_PER_VECKA)} kr/v</b> i arvode.</div>`}
    </div>`;
}

/* ------------------------------------------------------------------ */

function Ägarkort({ rad, spel, uppdatera }) {
  const [svar, sättSvar] = useState(null);
  const t = rad.typinfo ?? ÄGARTYPER[rad.typ] ?? {};
  const senast = rad.senastMöte;
  const möt = (valId) => uppdatera((s) => { sättSvar(hållMöte(s, rad.namn, valId)); });
  return html`
    <div class="kort agarkort">
      <div class="namn" style=${{ fontSize: "18px" }}>${rad.namn}</div>
      <div class="meta">${t.namn ?? rad.typ} · vill ${t.vill ?? "se sin häst lyckas"}</div>
      <div class="logg">${t.beskrivning ?? ""}</div>
      <div class="bars">
        <${Stapel} etikett="Sportsligt" värde=${Math.round(rad.sport ?? rad.relation)} variant="form" />
        <${Stapel} etikett="Kommunikation" värde=${Math.round(rad.komm ?? 55)} />
      </div>
      <div class="prisrad"><span>Hästar hos dig</span>
        <span class="pris">${rad.hästar.map((h) => h.namn).join(", ")}</span></div>
      <div class="prisrad"><span>Senaste mötet</span>
        <span class="pris">${senast ? `säsong ${senast.säsong}, vecka ${senast.vecka}` : "aldrig"}</span></div>
      ${svar
        ? html`<div class="samtal"><div class="samtal-vem">${rad.namn}</div>
            <div class="samtal-text">${svar.text}</div></div>`
        : html`<div class="rad-knappar">
            ${MÖTESVAL.map((v) => html`
              <button key=${v.id} class="btn liten sekundär" title=${v.följd}
                onClick=${() => möt(v.id)}>${v.rubrik}</button>`)}
          </div>`}
    </div>`;
}

function Ägare({ spel, uppdatera }) {
  const lista = ägarlista(spel);
  return html`
    <h2>Hästägarna</h2>
    ${lista.length === 0
      ? html`<div class="tom">Inga externa ägare ännu. De hör av sig när renommét växer —
          och en extern häst är ${kr(ARVODE_PER_VECKA)} kr i veckan.</div>`
      : lista.map((rad) => html`<${Ägarkort} key=${rad.namn} rad=${rad} spel=${spel} uppdatera=${uppdatera} />`)}`;
}

/* ------------------------------------------------------------------ */

function Sponsoravtal({ avtal }) {
  const läge = kravläge(avtal);
  return html`
    <div class="kort">
      <div class="namn" style=${{ fontSize: "18px" }}>${avtal.namn}</div>
      <div class="meta">${avtal.typnamn} · ${kr(avtal.perVecka)} kr/v · segerbonus ${kr(avtal.segerbonus)} kr</div>
      ${avtal.förmån && html`<div class="logg">Förmån: ${avtal.förmån.text}.</div>`}
      <div class=${"prisrad" + (läge.klar ? "" : "")}><span>Kravet</span>
        <span class=${"pris " + (läge.klar ? "upp" : "")}>${läge.text} · ${läge.nu}/${läge.mål}${läge.klar ? " ✓" : ""}</span></div>
      <div class="logg">Utvärderas vid säsongens slut: uppfyllt ger bonus och bättre villkor —
        missat bryter avtalet offentligt.</div>
    </div>`;
}

function Sponsorerbjudande({ e, spel, uppdatera }) {
  return html`
    <div class="kort inbjudan">
      <div class="meta">Sponsorerbjudande · svar senast vecka ${e.gällerTill}</div>
      <div class="namn" style=${{ fontSize: "18px" }}>${e.namn}</div>
      <div class="meta">${e.typnamn}</div>
      <div class="prisrad"><span>Ersättning</span><span class="pris">${kr(e.perVecka)} kr/v + ${kr(e.segerbonus)} kr per seger</span></div>
      ${e.förmån && html`<div class="prisrad"><span>Förmån</span><span class="pris">${e.förmån.text}</span></div>`}
      <div class="prisrad"><span>Kravet</span><span class="pris">${e.krav.text}</span></div>
      <div class="rad-knappar">
        <button class="btn liten" onClick=${() => uppdatera((s) => {
          const mål = (s.sponsorerbjudanden ?? []).find((x) => x.namn === e.namn && x.typId === e.typId);
          if (mål) teckna(s, mål);
        })}>Skriv på</button>
        <button class="btn liten sekundär" onClick=${() => uppdatera((s) => {
          const mål = (s.sponsorerbjudanden ?? []).find((x) => x.namn === e.namn && x.typId === e.typId);
          if (mål) tackaNej(s, mål);
        })}>Tacka nej</button>
      </div>
    </div>`;
}

function Sponsorer({ spel, uppdatera }) {
  säkraSponsorer(spel);
  return html`
    <h2>Sponsorerna</h2>
    ${spel.sponsorerbjudanden.map((e, i) => html`
      <${Sponsorerbjudande} key=${i} e=${e} spel=${spel} uppdatera=${uppdatera} />`)}
    ${spel.sponsorer.length === 0 && spel.sponsorerbjudanden.length === 0
      ? html`<div class="tom">Inga avtal ännu. Sponsorerna hittar stall som syns —
          tävla, vinn och bygg renommé så ringer telefonen.</div>`
      : spel.sponsorer.map((a, i) => html`<${Sponsoravtal} key=${i} avtal=${a} />`)}`;
}

/* ------------------------------------------------------------------ */

export default function KontorVy({ spel, uppdatera }) {
  return html`
    <${Bild} id="kontor" reserv="stall-morgon" alt="" klass="vytopp" fallback=${null} />
    <h2>Stallkontoret</h2>
    <${Ekonomi} spel=${spel} />
    <${Ägare} spel=${spel} uppdatera=${uppdatera} />
    <${Sponsorer} spel=${spel} uppdatera=${uppdatera} />`;
}
