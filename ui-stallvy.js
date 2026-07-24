import { html } from "htm/preact";
import { TRÄNING } from "./engine-hast.js";
import { körVecka } from "./engine-vecka.js";
import { nySäsong, säsongstext } from "./engine-sasong.js";
import { kr, klamp } from "./engine-util.js";
import { ARVODE_PER_VECKA } from "./data-agare.js";
import { Stapel, Rad, Form } from "./ui-delar.js";
import { träningsråd } from "./engine-forstaman.js";
import { Mentorkort } from "./ui-prolog.js";
import { säsongsHändelser } from "./engine-handelser.js";
import { BANOR } from "./data-namnpaket.js";

function Förstamankort({ spel, uppdatera }) {
  const fm = spel.förstaman;
  if (!fm) return null;
  const råd = spel.stall.map((h) => ({ häst: h, ...träningsråd(fm, h) }));
  const avviker = råd.filter((r) => r.häst.träning !== r.träning);
  return html`
    <div class="kort">
      <div class="meta">Förstaman · ${fm.profil}</div>
      <div class="namn">${fm.namn}</div>
      ${avviker.length === 0
        ? html`<div class="logg">»Träningen ligger som jag vill ha den. Bra vecka.«</div>`
        : html`
          ${avviker.slice(0, 3).map((r) => html`
            <div class="logg" key=${r.häst.id ?? r.häst.namn}>
              »<b>${r.häst.namn}</b>: ${r.motiv}«
            </div>`)}
          <button class="btn liten" onClick=${() => uppdatera((s) => {
            s.stall.forEach((h) => { h.träning = träningsråd(s.förstaman, h).träning; });
          })}>Låt ${fm.namn.split(" ")[0]} lägga träningen</button>`}
    </div>`;
}

function Banflytt({ spel, uppdatera }) {
  const e = spel.banerbjudande;
  if (!e) return null;
  const bana = BANOR[e.banaId];
  const hemma = BANOR[spel.hemmabana];
  return html`
    <div class="kort">
      <div class="meta">Erbjudande från ${bana.namn}</div>
      <div class="namn">Flytta stallet?</div>
      <div class="logg">${bana.karaktär}</div>
      <div class="logg">Större bana, större lopp på hemmaplan — och hemmapubliken följer med.
        Flyttkostnad <b>${kr(e.kostnad)} kr</b>. ${hemma ? `Ni lämnar ${hemma.namn}.` : ""}</div>
      <div class="rad-knappar">
        <button class="btn liten" disabled=${spel.kassa < e.kostnad} onClick=${() => uppdatera((s) => {
          s.kassa -= s.banerbjudande.kostnad;
          s.hemmabana = s.banerbjudande.banaId;
          s.renommé = klamp(s.renommé + 4);
          s.logg.unshift(`Stallet flyttar till <b>${BANOR[s.hemmabana].namn}</b>. Ett nytt kapitel.`);
          s.banerbjudande = null;
        })}>Flytta (${kr(e.kostnad)} kr)</button>
        <button class="btn liten sekundär" onClick=${() => uppdatera((s) => { s.banerbjudande = null; })}>
          Vi trivs där vi är
        </button>
      </div>
    </div>`;
}

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
      <div class="meta">
        <${Form} häst=${häst} />
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
      ${säsongsHändelser(spel, rad.säsong).slice(0, 3).map((h) => html`
        <div class="logg" key=${h.id}>· ${h.data?.text ?? h.typ.replaceAll("_", " ")}
          ${h.aktörer?.häst ? ` — ${h.aktörer.häst}` : ""} (v${h.vecka})</div>`)}
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
    <${Mentorkort} spel=${spel} />
    <${Banflytt} spel=${spel} uppdatera=${uppdatera} />
    <${Erbjudande} spel=${spel} uppdatera=${uppdatera} />
    <${Förstamankort} spel=${spel} uppdatera=${uppdatera} />
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
