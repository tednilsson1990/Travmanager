import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { TRÄNING } from "./engine-hast.js";
import { körVecka } from "./engine-vecka.js";
import { nySäsong, säsongstext } from "./engine-sasong.js";
import { kr, klamp } from "./engine-util.js";
import { ARVODE_PER_VECKA } from "./data-agare.js";
import { Stapel, Rad, Form } from "./ui-delar.js";
import { träningsråd } from "./engine-forstaman.js";
import { Mentorkort } from "./ui-prolog.js";
import { säsongsHändelser } from "./engine-handelser.js";
import { Häst } from "./ui-grafik.js";
import { BANOR } from "./data-namnpaket.js";

/**
 * Träningsplanen — skissernas panel 6, i ärlig veckoform. Ett rutnät över
 * hela stallet: figuren, vald träning, energi- och formläget, och
 * förstamannens invändning där den finns. Spelet är veckobaserat, så
 * planen visar veckan — inte ett påhittat dagsschema.
 */
function Träningsplan({ spel, uppdatera }) {
  const fm = spel.förstaman;
  if (!fm || !spel.stall.length) return null;
  const rader = spel.stall.map((h) => ({ häst: h, råd: träningsråd(fm, h) }));
  const avviker = rader.filter((r) => r.häst.skada === 0 && r.häst.träning !== r.råd.träning);
  return html`
    <div class="kort">
      <div class="meta">Veckans träningsplan · vecka ${Math.min(spel.vecka, spel.veckor)}</div>
      <div class="tplan">
        ${rader.map(({ häst, råd }) => html`
          <div class="tplan-rad" key=${häst.id}>
            <${Häst} namn=${häst.namn} dräkt=${spel.dräkt} storlek=${40} />
            <div class="tplan-mitt">
              <div class="tplan-namn">${häst.namn}</div>
              <div class="tplan-mini">E ${Math.round(häst.energi)} · F ${Math.round(häst.form)}</div>
            </div>
            ${häst.skada > 0
              ? html`<span class="tplan-pass skadad">skadad ${häst.skada} v</span>`
              : html`<span class=${"tplan-pass " + häst.träning}>${TRÄNING[häst.träning].namn}</span>`}
            ${häst.skada === 0 && häst.träning !== råd.träning &&
              html`<span class="tplan-flagga" title=${råd.motiv}>${fm.namn.split(" ")[0]}: ${TRÄNING[råd.träning].namn}</span>`}
          </div>`)}
      </div>
      ${avviker.length > 0 && html`
        <div class="logg" style=${{ marginTop: "8px" }}>»${avviker[0].råd.motiv}«${avviker.length > 1 ? ` — och ${avviker.length - 1} till.` : ""}</div>
        <button class="btn liten" onClick=${() => uppdatera((s) => {
          s.stall.forEach((h) => { if (h.skada === 0) h.träning = träningsråd(s.förstaman, h).träning; });
        })}>Låt ${fm.namn.split(" ")[0]} lägga planen</button>`}
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

/**
 * Hästsidan — skissernas panel 5. Det emotionella först: figuren, namnet,
 * statusen och förstamannens rapport. Sedan flikarna: Översikt (läget nu),
 * Karriär (siffrorna) och Berättelse (tidslinjen ur händelsemotorn).
 */
function HästSida({ häst, spel, uppdatera, tillbaka }) {
  const [flik, sättFlik] = useState("översikt");
  const fm = spel.förstaman;
  const råd = fm ? träningsråd(fm, häst) : null;
  const status = häst.starter === 0 ? "oprövad"
    : häst.segrar >= 8 ? "stallets affischnamn"
    : häst.intjänat > 400000 ? "etablerad"
    : häst.segrar >= 2 ? "på väg upp"
    : häst.ålder >= 9 ? "veteran" : "lovande";
  return html`
    <button class="tillbaka" onClick=${tillbaka}>‹ Stallet</button>
    <div class="kort">
      <div class="horse-topp">
        <${Häst} namn=${häst.namn} dräkt=${spel.dräkt} storlek=${92} />
        <div>
          <div class="namn">${häst.namn}</div>
          <div class="meta">${häst.ålder} år · ${häst.kön} · ${status}</div>
          <div class="meta">${häst.ägare ?? "Egen häst"}</div>
        </div>
      </div>
      <div class="flikar">
        ${["översikt", "karriär", "berättelse"].map((f) => html`
          <button key=${f} class="flik" aria-selected=${flik === f}
            onClick=${() => sättFlik(f)}>${f}</button>`)}
      </div>

      ${flik === "översikt" && html`
        ${råd && html`<div class="samtal">
          <div class="samtal-vem">Förstaman · ${fm.namn}</div>
          <div class="samtal-text">»${råd.motiv}«</div>
        </div>`}
        <div class="bars">
          <${Stapel} etikett="Startsnabbhet" värde=${häst.start} />
          <${Stapel} etikett="Toppfart" värde=${häst.fart} />
          <${Stapel} etikett="Ork" värde=${häst.styrka} />
          <${Stapel} etikett="Lynne" värde=${häst.lynne} variant="lynne" />
          <${Stapel} etikett="Form" värde=${häst.form} variant="form" />
          <${Stapel} etikett="Energi" värde=${häst.energi} variant="energi" />
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
            </div>`}`}

      ${flik === "karriär" && html`
        <div class="prisrad"><span>Starter</span><span class="pris">${häst.starter}</span></div>
        <div class="prisrad"><span>Segrar · pallplatser</span><span class="pris">${häst.segrar} · ${häst.pallplatser}</span></div>
        <div class="prisrad"><span>Insprunget</span><span class="pris">${kr(häst.intjänat)} kr</span></div>
        <div class="prisrad"><span>Distans</span><span class="pris">${häst.distans?.optimal ?? 2140} m · ${häst.distans?.typ ?? "medel"}</span></div>
        ${(häst.resultat ?? []).length > 0 && html`
          <table><thead><tr><th>S·V</th><th>Lopp</th><th>Pl</th><th>Km</th><th>Kusk</th></tr></thead>
            <tbody>${häst.resultat.slice(0, 8).map((r, i) => html`
              <tr key=${i}><td>${r.säsong}·${r.vecka}</td><td>${r.lopp}</td>
                <td class=${r.plats ? "" : "ur"}>${r.plats ?? "d"}</td>
                <td>${r.km ? r.km.toFixed(1) : "—"}</td><td>${r.kusk}</td></tr>`)}
            </tbody></table>`}`}

      ${flik === "berättelse" && html`
        ${(häst.milstolpar ?? []).length === 0
          ? html`<div class="tom">Berättelsen har inte börjat än. Den skrivs av loppen.</div>`
          : html`<div class="tidslinje">
              ${häst.milstolpar.map((m, i) => html`
                <div class="tl-rad" key=${i}>
                  <span class="tl-när">Säsong ${m.säsong} · vecka ${m.vecka}</span>${m.text}
                </div>`)}
            </div>`}`}
    </div>`;
}

function Hästkort({ häst, uppdatera, dräkt, öppna }) {
  const kvar = häst.krav ? häst.krav.antal - häst.kravStarter : null;
  return html`
    <div class="horse">
      <button class="horse-topp" style=${{ background: "none", border: 0, padding: 0, width: "100%", cursor: "pointer", textAlign: "left", font: "inherit", color: "inherit" }}
        onClick=${öppna}>
        <${Häst} namn=${häst.namn} dräkt=${dräkt} storlek=${76} />
        <div style=${{ flex: 1 }}>
          <div class="namn">${häst.namn}</div>
          <div class="meta">Öppna hästsidan ›</div>
        </div>
      </button>
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
      ${(häst.milstolpar ?? []).length > 0 && html`
        <div class="tidslinje">
          ${häst.milstolpar.slice(-4).map((m, i) => html`
            <div class="tl-rad" key=${i}>
              <span class="tl-när">Säsong ${m.säsong} · vecka ${m.vecka}</span>${m.text}
            </div>`)}
        </div>`}
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

/**
 * Säsongskrönikan — skissernas panel 9. Rubriken skrivs av utfallet,
 * säsongens häst får sin egen ruta, höjdpunkterna hämtas ur
 * händelsemotorn och förstamannen får sista ordet, färgat av profilen.
 */
function Säsongsavslut({ spel, uppdatera }) {
  const rad = spel.säsongAvslutad;
  if (!rad) return null;
  const topp = rad.plats <= 3, botten = rad.plats > rad.avStall * 0.7;
  const rubrik = rad.säsong === 1
    ? (topp ? "EN FÖRSTA SÄSONG ATT MINNAS" : botten ? "EN TUFF START — MEN GRUNDEN ÄR LAGD" : "EN STARK FÖRSTA SÄSONG")
    : topp ? `ÅRET DÅ ${spel.stallnamn.toUpperCase()} TOG STEGET`
    : botten ? "ETT ÅR ATT LÄGGA BAKOM SIG" : "STEG FÖR STEG ÅT RÄTT HÅLL";
  const bästa = rad.bästaHäst && spel.stall.find((h) => h.namn === rad.bästaHäst);
  const fm = spel.förstaman;
  const fmOrd = !fm ? null
    : fm.profil === "taktiker"
      ? `»${rad.segrar} segrar på ${rad.starter} starter — matchningen bär. Nästa år väljer vi loppen ännu hårdare.«`
    : fm.profil === "pådrivare"
      ? `»Vi lämnade segrar på bordet. Mer jobb i backen, fler starter — nästa säsong tar vi dem.«`
      : `»Hästarna gick helare genom året än de flesta stall kan säga. Det är så man bygger något som håller.«`;
  return html`
    <div class="sasong">
      <div class="scen-etikett">Säsong ${rad.säsong} · krönika</div>
      <div class="scen-rubrik" style=${{ fontSize: "31px" }}>${rubrik}</div>
      <div class="sasong-plats">${rad.plats}:a<span> av ${rad.avStall} stall i tränarligan</span></div>
      <div class="logg" style=${{ textAlign: "center" }}>${kr(rad.intjänat)} kr insprunget · ${rad.segrar} segrar på ${rad.starter} starter</div>

      ${rad.bästaHäst && html`
        <div class="kort" style=${{ textAlign: "left", marginTop: "12px" }}>
          <div class="meta">Säsongens häst</div>
          <div class="portrad">
            ${bästa && html`<${Häst} namn=${bästa.namn} dräkt=${spel.dräkt} storlek=${64} />`}
            <div>
              <div class="namn" style=${{ fontSize: "20px" }}>${rad.bästaHäst}</div>
              <div class="meta">${kr(rad.bästaHästIntjänat)} kr insprunget i år</div>
            </div>
          </div>
        </div>`}

      <div class="kort" style=${{ textAlign: "left" }}>
        <div class="meta">Säsongens höjdpunkter</div>
        ${säsongsHändelser(spel, rad.säsong).slice(0, 4).map((h) => html`
          <div class="notis" key=${h.id}><b>${h.data?.text ?? h.typ.replaceAll("_", " ")}</b>${h.aktörer?.häst ? ` — ${h.aktörer.häst}` : ""} · v${h.vecka}</div>`)}
        ${säsongsHändelser(spel, rad.säsong).length === 0 && html`
          <div class="logg">Ett år utan rubriker. De kommer.</div>`}
      </div>

      ${fmOrd && html`<div class="samtal" style=${{ textAlign: "left" }}>
        <div class="samtal-vem">Förstamannen har ordet · ${fm.namn}</div>
        <div class="samtal-text">${fmOrd}</div>
      </div>`}
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
  const [valdHästId, sättValdHäst] = useState(null);
  const slut = spel.vecka > spel.veckor;
  if (slut && spel.säsongAvslutad) {
    return html`<${Säsongsavslut} spel=${spel} uppdatera=${uppdatera} />`;
  }
  const valdHäst = valdHästId && spel.stall.find((h) => h.id === valdHästId);
  if (valdHäst) {
    return html`<${HästSida} häst=${valdHäst} spel=${spel} uppdatera=${uppdatera}
      tillbaka=${() => sättValdHäst(null)} />`;
  }
  return html`
    <${Mentorkort} spel=${spel} />
    <${Banflytt} spel=${spel} uppdatera=${uppdatera} />
    <${Erbjudande} spel=${spel} uppdatera=${uppdatera} />
    <${Träningsplan} spel=${spel} uppdatera=${uppdatera} />
    <h2>Veckans jobb</h2>
    ${spel.stall.map((h) => html`<${Hästkort} key=${h.id} häst=${h} uppdatera=${uppdatera} dräkt=${spel.dräkt}
      öppna=${() => sättValdHäst(h.id)} />`)}
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
