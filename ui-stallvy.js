import { html } from "htm/preact";
import { TRÄNING } from "./engine-hast.js";
import { körVecka } from "./engine-vecka.js";
import { nySäsong, säsongstext } from "./engine-sasong.js";
import { kr, klamp } from "./engine-util.js";
import { ARVODE_PER_VECKA } from "./data-agare.js";
import { Stapel, Rad } from "./ui-delar.js";

function Erbjudande({ spel, uppdatera }) {
  const h = spel.erbjudande;
  if (!h) return null;
  return html`
    <div class="kort">
      <div class="meta">Förfrågan från ägare</div>
      <div class="namn">${h.namn}</div>
      <div class="meta">${h.ägare} · ${h.ålder} år</div>
      <div class="bars">
        <${Stapel} etikett="Startsnabbhet" värde=${h.start} />
        <${Stapel} etikett="Toppfart" värde=${h.fart} />
        <${Stapel} etikett="Ork" värde=${h.styrka} />
      </div>
      <div class="förvänt">Ägarens krav: <b>${h.krav.text}</b>.</div>
      <div class="logg">Träningsarvode <b>${kr(ARVODE_PER_VECKA)} kr/vecka</b>.</div>
      <div class="rad-knappar">
        <button class="btn liten" onClick=${() => uppdatera((s) => {
          s.stall.push(s.erbjudande); s.erbjudande = null; s.renommé = klamp(s.renommé + 1);
        })}>Ta in</button>
        <button class="btn liten sekundär" onClick=${() => uppdatera((s) => { s.erbjudande = null; })}>
          Tacka nej
        </button>
      </div>
    </div>`;
}

function Hästkort({ häst, uppdatera }) {
  const kvar = häst.krav ? häst.krav.antal - häst.kravStarter : null;
  return html`
    <div class="horse">
      <div class="namn">${häst.namn}</div>
      <div class="meta">
        ${häst.ålder} år · ${häst.kön} · ${häst.starter} st · ${häst.segrar} seg · ${kr(häst.intjänat)} kr
      </div>
      <div class="taggar">
        <span class="tagg">${häst.distans?.optimal ?? 2140} m · ${häst.distans?.typ ?? "medeldistans"}</span>
        ${häst.ägare
          ? html`<span class="tagg ext">${häst.ägare}</span>
                 <span class=${"tagg" + (kvar <= 1 ? " varning" : "")}>
                   ${häst.krav.text} · ${Math.max(0, kvar)} kvar
                 </span>`
          : html`<span class="tagg">Egen häst</span>`}
      </div>
      <div class="bars">
        <${Stapel} etikett="Startsnabbhet" värde=${häst.start} />
        <${Stapel} etikett="Toppfart" värde=${häst.fart} />
        <${Stapel} etikett="Ork" värde=${häst.styrka} />
        <${Stapel} etikett="Lynne" värde=${häst.lynne} variant="lynne" />
        <${Stapel} etikett="Form" värde=${häst.form} variant="form" />
        <${Stapel} etikett="Energi" värde=${häst.energi} variant="energi" />
        <${Stapel} etikett="Uppmärksamhet" värde=${häst.hype} variant="hype" />
      </div>
      ${häst.skada > 0
        ? html`<div class="skada">Skadad — ${häst.skada} vecka(or) kvar.</div>`
        : html`<div class="chips">
            ${Object.entries(TRÄNING).map(([nyckel, t]) => html`
              <button key=${nyckel} class="chip" aria-pressed=${häst.träning === nyckel}
                onClick=${() => uppdatera((s) => {
                  const h = s.stall.find((x) => x.id === häst.id);
                  if (h) h.träning = nyckel;
                })}>${t.namn}</button>`)}
          </div>`}
    </div>`;
}

function Säsongsavslut({ spel, uppdatera }) {
  const rad = spel.säsongAvslutad;
  if (!rad) return null;
  return html`
    <div class="sasong">
      <div class="sasong-rubrik">Säsong ${rad.säsong} avslutad</div>
      <div class="sasong-plats">${rad.plats}:a<span> av ${rad.avStall} stall</span></div>
      <div class="logg">${kr(rad.intjänat)} kr insprunget · ${rad.segrar} segrar på ${rad.starter} starter</div>
      ${rad.bästaHäst && html`<div class="logg">Stallets bästa: <b>${rad.bästaHäst}</b>,
        ${kr(rad.bästaHästIntjänat)} kr</div>`}
      <button class="btn" onClick=${() => {
        let resultat;
        uppdatera((s) => { resultat = nySäsong(s); s.säsongAvslutad = null; });
        if (resultat && resultat.pensionerade.length) {
          alert("Pensionerade: " + resultat.pensionerade.map((h) => h.namn).join(", "));
        }
        window.scrollTo({ top: 0 });
      }}>Starta säsong ${rad.säsong + 1}</button>
    </div>`;
}

export default function StallVy({ spel, uppdatera, nystart }) {
  const slut = spel.vecka > spel.veckor;
  if (slut && spel.säsongAvslutad) {
    return html`<${Säsongsavslut} spel=${spel} uppdatera=${uppdatera} />`;
  }
  return html`
    <${Erbjudande} spel=${spel} uppdatera=${uppdatera} />
    <h2>Veckans jobb</h2>
    ${spel.stall.map((h) => html`<${Hästkort} key=${h.id} häst=${h} uppdatera=${uppdatera} />`)}
    <button class="btn" disabled=${slut} onClick=${() => {
      uppdatera((s) => { körVecka(s); });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }}>${slut ? "Säsongen är slut" : "Kör veckan"}</button>

    ${spel.logg.length > 0 && html`
      <h2>Rapport</h2>
      <div class="kort">
        ${spel.logg.map((r, i) => html`<${Rad} key=${i} klass="logg" html=${r} />`)}
      </div>`}

    <button class="btn sekundär" onClick=${() => {
      if (confirm("Starta om karriären? Sparfilen raderas.")) nystart();
    }}>Ny karriär</button>`;
}
