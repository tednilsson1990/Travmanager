import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { TRÄNING } from "./engine-hast.js";
import { körVecka } from "./engine-vecka.js";
import { nySäsong, säsongstext } from "./engine-sasong.js";
import { kr, klamp } from "./engine-util.js";
import { ARVODE_PER_VECKA } from "./data-agare.js";
import { Stapel, Rad, Form } from "./ui-delar.js";
import { träningsråd, loppmatchning } from "./engine-forstaman.js";
import { veckansLopp } from "./data-kalender.js";
import { veckoslots, slotsAnvända, ärKrävande, läggPlanMedSlots } from "./engine-stallmote.js";
import { rivalerFör } from "./engine-handelser.js";
import { Mentorkort } from "./ui-prolog.js";
import { säsongsHändelser } from "./engine-handelser.js";
import { pälsnamnFör, Bild, HästEllerFoto, Häst } from "./ui-grafik.js";
import { BANOR } from "./data-namnpaket.js";

/**
 * Träningsplanen — skissernas panel 6, i ärlig veckoform. Ett rutnät över
 * hela stallet: figuren, vald träning, energi- och formläget, och
 * förstamannens invändning där den finns. Spelet är veckobaserat, så
 * planen visar veckan — inte ett påhittat dagsschema.
 */
/**
 * TRÄNINGSCHIPSEN, slot-medvetna (plan 4.1). Ett krävande pass går bara
 * att välja om veckan har en plats kvar — eller om hästen redan har en.
 * Samma komponent i hästkortet och på hästsidan, så regeln aldrig glider.
 */
function Träningschips({ häst, spel, uppdatera }) {
  const fulla = slotsAnvända(spel) >= veckoslots(spel);
  const harPlats = ärKrävande(häst.träning);
  return html`
    <div class="chips">
      ${Object.entries(TRÄNING).map(([nyckel, t]) => {
        const stängd = ärKrävande(nyckel) && fulla && !harPlats;
        return html`
          <button key=${nyckel} class="chip" aria-pressed=${häst.träning === nyckel}
            disabled=${stängd}
            title=${stängd ? "Veckans hårda pass är fullbokade — se stallmötet" : ""}
            onClick=${() => uppdatera((s) => {
              const h = s.stall.find((x) => x.id === häst.id);
              if (h) h.träning = nyckel;
            })}>${t.namn}</button>`;
      })}
      ${fulla && !harPlats && html`<span class="chips-hint">hårda pass fullbokade</span>`}
    </div>`;
}

function Träningsplan({ spel, uppdatera }) {
  const fm = spel.förstaman;
  if (!fm || !spel.stall.length) return null;
  const rader = spel.stall.map((h) => ({ häst: h, råd: träningsråd(fm, h) }));
  const avviker = rader.filter((r) => r.häst.skada === 0 && r.häst.träning !== r.råd.träning);
  const slots = veckoslots(spel);
  const använda = slotsAnvända(spel);
  const a = spel.anläggning ?? {};
  const källor = ["3 i grunden", a.rakbana && "rakbanan +1", a.backe && "backen +1",
    spel.förstaman && `${fm.namn.split(" ")[0]} +1`].filter(Boolean).join(" · ");
  return html`
    <div class="kort">
      <div class="meta">Stallmötet · vecka ${Math.min(spel.vecka, spel.veckor)}</div>
      <div class=${"slotsrad" + (använda > slots ? " över" : "")}>
        <span>Veckans hårda pass</span>
        <b>${använda} av ${slots}</b>
      </div>
      <div class="slotskälla">${källor}</div>
      ${använda > slots && html`<div class="hint skada">
        Fler hårda pass än veckan rymmer — överskottet blir lugnt jobb när veckan körs.</div>`}
      <div class="tplan">
        ${rader.map(({ häst, råd }) => html`
          <div class="tplan-rad" key=${häst.id}>
            <${HästEllerFoto} namn=${häst.namn} skifte=${pälsskifte(spel, häst)} dräkt=${spel.dräkt} storlek=${40} />
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
          /* Planen läggs inom veckans slots: lägst form prioriteras till
             de hårda passen, resten får lugnt jobb. */
          läggPlanMedSlots(s, träningsråd);
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
 * FORMKURVAN: hästens form vecka för vecka ur träningsdagboken, ritad som
 * en enkel tidningsgraf. Ingen dekoration — bara linjen och nolläget.
 */
function Formkurva({ dagbok }) {
  const punkter = (dagbok ?? []).slice(0, 20).reverse();
  if (punkter.length < 3) return null;
  const B = 280, H = 64;
  const x = (i) => 4 + (i / (punkter.length - 1)) * (B - 8);
  const y = (f) => H - 4 - (klamp(f) / 100) * (H - 8);
  const linje = punkter.map((p, i) => `${x(i).toFixed(1)},${y(p.form).toFixed(1)}`).join(" ");
  return html`
    <svg class="formkurva" viewBox=${`0 0 ${B} ${H}`} role="img" aria-label="Formens utveckling">
      <line x1="4" y1=${y(50)} x2=${B - 4} y2=${y(50)} class="fk-mitt" />
      <polyline points=${linje} class="fk-linje" />
      <circle cx=${x(punkter.length - 1)} cy=${y(punkter[punkter.length - 1].form)} r="3" class="fk-nu" />
    </svg>`;
}

/**
 * Hästsidan — designförslagets fem flikar. Det emotionella först: figuren,
 * namnet, statusen och förstamannens rapport. Sedan: Översikt (vem hästen
 * är just nu), Karriär (siffrorna och tidslinjen), Form (kurvan och
 * dagboken), Mål (nästa start och vägen framåt) och Relationer (människorna
 * kring hästen). Hästen ska kännas som en individ med en historia — inte
 * som en rad värden.
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
  /* Rekordet: snabbaste km-tiden i loppraden — det första en travmänniska
     letar efter. */
  const rekord = (häst.resultat ?? []).filter((r) => r.km).sort((a, b) => a.km - b.km)[0];
  const lynneText = häst.lynne >= 72 ? "kall som is — går att lita på i trafik"
    : häst.lynne >= 55 ? "stabil i sinnet"
    : häst.lynne >= 40 ? "har sina dagar" : "het och svårriden — allt kan hända";
  return html`
    <button class="tillbaka" onClick=${tillbaka}>‹ Stallet</button>
    <div class="kort">
      <div class="horse-topp">
        <${HästEllerFoto} namn=${häst.namn} skifte=${pälsskifte(spel, häst)} dräkt=${spel.dräkt} storlek=${92} />
        <div>
          <div class="namn">${häst.namn}</div>
          <div class="meta">${häst.ålder} år · ${häst.kön} · ${status}</div>
          <div class="meta">${häst.ägare ?? "Egen häst"}</div>
        </div>
      </div>
      <div class="flikar">
        ${["översikt", "karriär", "form", "mål", "relationer"].map((f) => html`
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
        <div class="prisrad"><span>Personlighet</span><span class="pris">${lynneText}</span></div>
        ${rekord && html`<div class="prisrad"><span>Rekord</span><span class="pris">${rekord.km.toFixed(1)} / ${rekord.dist ?? "?"} m</span></div>`}
        ${(häst.resultat ?? []).length > 0 && html`
          <div class="prisrad"><span>Senaste fem</span>
            <span class="formrad">
              ${häst.resultat.slice(0, 5).map((r, i) => html`
                <span key=${i} class=${"fp " + (r.plats === 1 ? "seger" : r.plats && r.plats <= 3 ? "pall" : r.plats ? "" : "ur")}>${r.plats ?? "d"}</span>`)}
            </span></div>`}
        ${häst.skada > 0
          ? html`<div class="skada">Skadad — ${häst.skada} vecka(or) kvar.</div>`
          : html`<${Träningschips} häst=${häst} spel=${spel} uppdatera=${uppdatera} />`}`}

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
            </tbody></table>`}
        ${(häst.milstolpar ?? []).length === 0
          ? html`<div class="tom">Berättelsen har inte börjat än. Den skrivs av loppen.</div>`
          : html`<div class="hint" style=${{ marginTop: "10px" }}>Karriärens ögonblick</div>
            <div class="tidslinje">
              ${häst.milstolpar.map((m, i) => html`
                <div class="tl-rad" key=${i}>
                  <span class="tl-när">Säsong ${m.säsong} · vecka ${m.vecka}</span>${m.text}
                </div>`)}
            </div>`}`}

      ${flik === "form" && html`
        <${Bild} id="traning" alt="" klass="vytopp" fallback=${null} />
        <${Formkurva} dagbok=${häst.dagbok} />
        <div class="hint">Veckans pass och vad hästen svarade. Nyast först.</div>
        ${(häst.dagbok ?? []).length === 0
          ? html`<div class="tom">Dagboken börjar nästa vecka du tränar.</div>`
          : html`<table>
              <thead><tr><th>S·V</th><th>Pass</th><th>Energi</th><th>Form</th></tr></thead>
              <tbody>${häst.dagbok.slice(0, 20).map((d, i) => {
                const före = häst.dagbok[i + 1];
                const Δ = före ? d.form - före.form : 0;
                return html`
                  <tr key=${i}>
                    <td>${d.säsong}·${d.vecka}</td>
                    <td>${TRÄNING[d.träning]?.namn ?? d.träning}</td>
                    <td>${d.energi}</td>
                    <td>${d.form}${före ? html` <span class=${Δ >= 0 ? "upp" : "ner"}>${Δ >= 0 ? "+" : ""}${Δ}</span>` : ""}</td>
                  </tr>`;
              })}</tbody>
            </table>`}`}

      ${flik === "mål" && html`<${HästMål} häst=${häst} spel=${spel} />`}

      ${flik === "relationer" && html`<${HästRelationer} häst=${häst} spel=${spel} />`}
    </div>`;
}

/**
 * MÅL-FLIKEN (designförslaget): nästa start, ägarens krav och nästa
 * naturliga milstolpe. Allt härlett ur spelläget — matchningen är
 * förstamannens riktiga råd, milstolpen är den närmaste som saknas.
 */
function HästMål({ häst, spel }) {
  const fm = spel.förstaman;
  const matchning = fm && häst.skada === 0
    ? loppmatchning(fm, häst, veckansLopp(Math.min(spel.vecka, spel.veckor))) : null;
  const milstolpe = häst.segrar === 0 ? "första segern"
    : häst.intjänat < 100000 ? "100 000 kr insprunget"
    : !(häst.milstolpar ?? []).some((m) => m.typ === "storloppsseger") ? "en storloppsseger"
    : häst.intjänat < 1000000 ? "miljonen" : "att skriva historia";
  const kvar = häst.krav ? häst.krav.antal - häst.kravStarter : null;
  return html`
    ${häst.skada > 0 && html`<div class="skada">Skadad — målet just nu är att bli frisk. ${häst.skada} vecka(or) kvar.</div>`}
    ${matchning && html`
      <div class="samtal">
        <div class="samtal-vem">Nästa start · ${fm.namn}</div>
        <div class="samtal-text">»${matchning.text}«</div>
      </div>`}
    ${häst.krav && html`
      <div class=${"förvänt" + (kvar <= 2 ? " varning" : "")}>
        Ägarens krav: <b>${häst.krav.text}</b> — ${Math.max(0, kvar)} ${kvar === 1 ? "start" : "starter"} kvar.
      </div>`}
    <div class="prisrad"><span>Nästa milstolpe</span><span class="pris">${milstolpe}</span></div>
    <div class="prisrad"><span>Bästa distans</span><span class="pris">${häst.distans?.optimal ?? 2140} m · ${häst.distans?.typ ?? "medel"}</span></div>
    <div class="prisrad"><span>Veckans träning</span><span class="pris">${häst.skada > 0 ? "vila" : TRÄNING[häst.träning]?.namn ?? häst.träning}</span></div>`;
}

/**
 * RELATIONER-FLIKEN (designförslaget): människorna kring hästen. Ägaren
 * med relationen ur ägarboken, kuskarna som lärt känna hästen, och
 * motståndarna den möter om och om igen.
 */
function HästRelationer({ häst, spel }) {
  const ägarrel = häst.ägare ? spel.ägarrelationer?.[häst.ägare] : null;
  const kuskar = Object.entries(häst.kuskbekant ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const rivaler = rivalerFör(spel, häst);
  return html`
    <div class="prisrad"><span>Ägare</span><span class="pris">${häst.ägare ?? "Egen häst — du är ägaren"}</span></div>
    ${ägarrel && html`
      <div class="prisrad"><span>Relationen</span>
        <span class="pris">${ägarrel.relation >= 75 ? "mycket god" : ägarrel.relation >= 55 ? "god"
          : ägarrel.relation >= 35 ? "ansträngd" : "nära bristning"} (${Math.round(ägarrel.relation)})</span></div>`}
    ${kuskar.length > 0 && html`
      <div class="hint" style=${{ marginTop: "10px" }}>Kuskar som kan hästen</div>
      ${kuskar.map(([namn, antal]) => html`
        <div key=${namn} class="prisrad">
          <span>${namn}</span>
          <span class="pris">${antal} ${antal === 1 ? "start" : "starter"}${antal >= 6 ? " · kan hästen utan och innan" : ""}</span>
        </div>`)}`}
    ${rivaler.length > 0 && html`
      <div class="hint" style=${{ marginTop: "10px" }}>Motståndare ni möter om och om igen</div>
      ${rivaler.slice(0, 4).map((r) => html`
        <div key=${r.rivalId} class="prisrad">
          <span>${r.rivalNamn}${r.utropad ? " · rival" : ""}</span>
          <span class="pris">${r.dinaSegrar}–${r.hansSegrar} på ${r.möten} möten</span>
        </div>`)}`}
    ${kuskar.length === 0 && rivaler.length === 0 && !häst.ägare && html`
      <div class="tom">Relationerna byggs av loppen — kuskar, ägare och rivaler kommer med starterna.</div>`}`;
}

function Hästkort({ häst, spel, uppdatera, dräkt, öppna }) {
  const kvar = häst.krav ? häst.krav.antal - häst.kravStarter : null;
  return html`
    <div class="horse">
      <button class="horse-topp" style=${{ background: "none", border: 0, padding: 0, width: "100%", cursor: "pointer", textAlign: "left", font: "inherit", color: "inherit" }}
        onClick=${öppna}>
        <${HästEllerFoto} namn=${häst.namn} dräkt=${dräkt} storlek=${76} />
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
        : html`<${Träningschips} häst=${häst} spel=${spel} uppdatera=${uppdatera} />`}
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
      <${Bild} id="sasong-slut" reserv="bana-kvall" alt="" klass="vytopp" fallback=${null} />
      <div class="scen-etikett">Säsong ${rad.säsong} · krönika</div>
      <div class="scen-rubrik" style=${{ fontSize: "31px" }}>${rubrik}</div>
      <div class="sasong-plats">${rad.plats}:a<span> av ${rad.avStall} stall i tränarligan</span></div>
      <div class="logg" style=${{ textAlign: "center" }}>${kr(rad.intjänat)} kr insprunget · ${rad.segrar} segrar på ${rad.starter} starter</div>

      ${rad.bästaHäst && html`
        <div class="kort" style=${{ textAlign: "left", marginTop: "12px" }}>
          <div class="meta">Säsongens häst</div>
          <div class="portrad">
            ${bästa && html`<${HästEllerFoto} namn=${bästa.namn} dräkt=${spel.dräkt} storlek=${64} />`}
            <div>
              <div class="namn" style=${{ fontSize: "20px" }}>${rad.bästaHäst}</div>
              <div class="meta">${kr(rad.bästaHästIntjänat)} kr i karriären</div>
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

      ${rad.krönika && html`
        <div class="kort" style=${{ textAlign: "left" }}>
          <div class="meta">Krönikan · ${rad.krönika.signatur}</div>
          ${rad.krönika.stycken.map((st, i) => html`<p key=${i} class="kronika-stycke">${st}</p>`)}
        </div>`}

      ${fmOrd && html`<div class="samtal" style=${{ textAlign: "left" }}>
        <div class="samtal-vem">Förstamannen har ordet · ${fm.namn}</div>
        <div class="samtal-text">${fmOrd}</div>
      </div>`}
      <button class="btn" onClick=${() => {
        /* Pensioneringarna behöver ingen alert-ruta längre: de trotjänare
           som förtjänar det får sina helskärmsscener direkt efter, och
           resten står i loggen och krönikan. */
        uppdatera((s) => { nySäsong(s); s.säsongAvslutad = null; });
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
    ${spel.stall.map((h) => html`<${Hästkort} key=${h.id} häst=${h} spel=${spel} uppdatera=${uppdatera} dräkt=${spel.dräkt}
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
