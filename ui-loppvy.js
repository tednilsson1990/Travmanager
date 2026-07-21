import { useEffect, useRef, useState } from "preact/hooks";
import { html } from "htm/preact";
import { LOPP, TAKTIKER } from "./data-lopp.js";
import { KUSKAR, villig, svar } from "./data-kuskar.js";
import { motståndare } from "./engine-hast.js";
import { beräknaStreck } from "./engine-streck.js";
import { simulera } from "./engine-simulera.js";
import { efterLopp } from "./engine-vecka.js";
import { blanda, klamp, kr, kmtid, tidText, plock } from "./engine-util.js";
import { Täcke, Tom, Rad } from "./ui-delar.js";
import BanVy from "./ui-banvy.js";

/* ---------- Anmälan ---------- */
function Anmälan({ spel, onStart }) {
  const startbara = spel.stall.filter((h) => h.skada === 0);
  const förstaVilliga = Math.max(0, KUSKAR.findIndex((k) => villig(spel, k)));
  const [hästId, sättHäst] = useState(startbara[0]?.id ?? null);
  const [loppIx, sättLopp] = useState(0);
  const [kuskIx, sättKusk] = useState(förstaVilliga);
  const [taktik, sättTaktik] = useState("rygg");

  if (!startbara.length) return html`<${Tom}>Ingen häst är startklar.<//>`;

  const kusk = KUSKAR[kuskIx];
  const kanStarta = villig(spel, kusk) && spel.kassa >= kusk.arvode;

  return html`
    <h2>Anmälan</h2>
    <div class="kort">
      <label class="fält" for="v-hast">Häst</label>
      <select id="v-hast" value=${hästId} onChange=${(e) => sättHäst(+e.target.value)}>
        ${startbara.map((h) => html`
          <option key=${h.id} value=${h.id}>
            ${h.namn} — st ${Math.round(h.start)} / fa ${h.fart} / form ${Math.round(h.form)}
          </option>`)}
      </select>

      <label class="fält" for="v-lopp">Lopp</label>
      <select id="v-lopp" value=${loppIx} onChange=${(e) => sättLopp(+e.target.value)}>
        ${LOPP.map((l, i) => html`
          <option key=${l.id} value=${i}>
            ${l.namn} · ${l.dist} m · ${l.start === "volt" ? "volt" : "bil"} · ${kr(l.pris[0])} kr
          </option>`)}
      </select>

      <label class="fält" for="v-kusk">Kusk</label>
      <select id="v-kusk" value=${kuskIx} onChange=${(e) => sättKusk(+e.target.value)}>
        ${KUSKAR.map((k, i) => html`
          <option key=${k.namn} value=${i} disabled=${!villig(spel, k)}>
            ${k.namn} — ${svar(spel, k).t} · st ${k.start}/ta ${k.taktik}/av ${k.avslutning}
            · ${kr(k.arvode)} + ${Math.round(k.andel * 100)} %
          </option>`)}
      </select>

      <label class="fält" for="v-taktik">Körorder</label>
      <select id="v-taktik" value=${taktik} onChange=${(e) => sättTaktik(e.target.value)}>
        ${Object.entries(TAKTIKER).map(([k, t]) => html`<option key=${k} value=${k}>${t.namn}</option>`)}
      </select>
    </div>
    <div class="hint">${TAKTIKER[taktik].info}</div>
    <button class="btn" disabled=${!kanStarta} onClick=${() => onStart({
      häst: spel.stall.find((h) => h.id === hästId), lopp: LOPP[loppIx], kusk, taktik,
    })}>Lotta spår och kör</button>
    ${!kanStarta && html`<div class="hint">
      ${villig(spel, kusk) ? "Kassan räcker inte till kuskarvodet." : `${kusk.namn} tackar nej till uppdraget.`}
    </div>`}`;
}

/* ---------- Tracking-listan ---------- */
function Tracking({ bild, dist }) {
  if (!bild) return null;
  return html`
    <div class="track">
      <div class="tr-bana"><i style=${{ width: Math.min(100, (bild.meter / dist) * 100) + "%" }} /></div>
      ${bild.rader.map((r, i) => {
        const lk = r.läge === "utvändigt" || r.läge === "tredje utv" ? "utv"
          : r.läge === "instängd" ? "instangd" : "";
        return html`
          <div key=${r.spår} class=${"tr-rad" + (r.egen ? " din" : "")}>
            <${Täcke} nr=${r.spår} />
            <span>
              <span class="tr-namn">${r.namn}</span><br />
              <span class=${"tr-lage " + lk}>${r.läge}</span>
            </span>
            <span class="tr-avst">${i === 0 ? "led" : "+" + r.avst.toFixed(1) + " l"}</span>
            <span class="tr-fart">${r.fart.toFixed(1)} km/h</span>
            <span class="tr-kraft"><i class=${r.kraft < 25 ? "låg" : ""} style=${{ width: klamp(r.kraft) + "%" }} /></span>
          </div>`;
      })}
      ${bild.ur.map((r) => html`
        <div key=${"ur" + r.spår} class="tr-rad ur">
          <${Täcke} nr=${r.spår} /><span class="tr-namn">${r.namn}</span>
          <span class="tr-avst">ur</span><span /><span />
        </div>`)}
    </div>`;
}

/* ---------- Resultat ---------- */
function Facit({ körning, facit, onKlart }) {
  const { sim, häst, kusk } = körning;
  const min = facit.min;
  return html`
    <table>
      <thead><tr><th>Pl</th><th>Sp</th><th>Häst</th><th>Kusk</th><th>%</th><th>Km</th><th>S400</th></tr></thead>
      <tbody>
        ${sim.resultat.map((r) => html`
          <tr key=${r.spår} class=${r.häst.egen ? "din" : ""}>
            <td class=${r.ur ? "ur" : ""}>${r.ur ? "g" : r.plats}</td>
            <td>${r.spår}</td><td>${r.häst.namn}</td><td>${r.kusk.namn}</td>
            <td>${r.streck.toFixed(0)}</td>
            <td>${r.ur ? "—" : kmtid(r.km)}</td>
            <td>${r.ur || !r.sista400 ? "—" : r.sista400.toFixed(1)}</td>
          </tr>`)}
      </tbody>
    </table>

    <div class="kort">
      <div class="logg">
        ${min.ur
          ? html`<b>${häst.namn}</b> blev bortkörd.`
          : html`<b>${häst.namn}</b> blev ${min.plats}:a från spår ${min.spår}, gick ${min.läge}.
                 Tid ${tidText(min.sek)}, sista 800 ${min.sista800 ? min.sista800.toFixed(1) : "—"} s.`}
      </div>
      <div class="logg pris">
        Prispengar ${kr(facit.brutto)} − kuskandel ${kr(facit.kuskandel)} =
        <b>${kr(facit.netto)} kr</b> (arvode −${kr(kusk.arvode)})
      </div>
      <div class="logg">
        Renommé ${facit.renΔ >= 0 ? "+" : ""}${facit.renΔ.toFixed(1)} ·
        spelförtroende ${facit.troΔ >= 0 ? "+" : ""}${facit.troΔ} ·
        relation ${kusk.namn} ${facit.relΔ >= 0 ? "+" : ""}${facit.relΔ}
      </div>
      ${facit.ägartext && html`<div class=${facit.ägartext.ton === "dålig" ? "skada" : "logg"}>${facit.ägartext.text}</div>`}
      ${häst.skada > 0 && html`<div class="skada">Kom ur loppet ömmande — ${häst.skada} vecka(or) vila.</div>`}
    </div>
    <button class="btn" onClick=${onKlart}>Klart</button>`;
}

/* ---------- Loppet ---------- */
export default function LoppVy({ spel, uppdatera }) {
  const [körning, sättKörning] = useState(null);
  const [ruta, sättRuta] = useState(0);
  const [fart, sättFart] = useState(110);
  const [facit, sättFacit] = useState(null);
  const timer = useRef(null);

  const starta = ({ häst, lopp, kusk, taktik }) => {
    const fält = [häst, ...motståndare(lopp.nivå, 7)];
    const spårnr = blanda([1, 2, 3, 4, 5, 6, 7, 8]);
    // Kuskarna lottas utan återläggning — ingen kör två hästar i samma lopp
    const övriga = blanda(KUSKAR.filter((k) => k.namn !== kusk.namn)).slice(0, 7);
    let n = 0;
    fält.forEach((h, i) => {
      h.spår = spårnr[i];
      h.kusk = h.egen ? kusk : övriga[n++];
      h.taktik = h.egen ? taktik : plock(Object.keys(TAKTIKER));
    });
    beräknaStreck(fält, spel.spelförtroende);
    const favorit = [...fält].sort((a, b) => b.streck - a.streck)[0];
    uppdatera((s) => { s.kassa -= kusk.arvode; });
    sättFacit(null);
    sättRuta(0);
    sättKörning({ fält, lopp, häst, kusk, favorit, sim: simulera(fält, lopp) });
  };

  const avsluta = () => {
    if (!körning || facit) return;
    const { sim, lopp, häst, kusk, favorit } = körning;
    const min = sim.resultat.find((r) => r.häst.egen);
    let sammanfattning;
    uppdatera((s) => {
      sammanfattning = efterLopp(s, { häst, kusk, lopp, min, varFavorit: favorit === häst });
    });
    sättFacit({ ...sammanfattning, min });
  };

  useEffect(() => {
    if (!körning || facit) return;
    if (ruta >= körning.sim.bild.length) { avsluta(); return; }
    timer.current = setTimeout(() => sättRuta((r) => r + 1), fart);
    return () => clearTimeout(timer.current);
  }, [körning, ruta, fart, facit]);

  if (!körning) return html`<${Anmälan} spel=${spel} onStart=${starta} />`;

  const { fält, lopp, sim, häst, favorit } = körning;
  const bild = sim.bild[Math.min(ruta, sim.bild.length - 1)];
  const kommentarer = sim.bild.slice(0, ruta + 1).flatMap((b) => b.text);

  return html`
    <h2>${lopp.namn} · ${lopp.dist} m · ${lopp.start === "volt" ? "voltstart" : "bilstart"}</h2>

    ${favorit === häst && html`
      <div class="förvänt">
        <b>${häst.namn} är loppets mest spelade häst (${häst.streck.toFixed(1)} %).</b>
        Motståndarnas kuskar utmanar dig mer sällan — men spelarna förväntar sig seger.
      </div>`}

    <div class="kort">
      <div class="meta" style="margin-bottom:6px">Startlista och streckprocent</div>
      <div class="startlista">
        ${[...fält].sort((a, b) => a.spår - b.spår).map((h) => html`
          <div key=${h.spår} class=${"sl-rad" + (h.egen ? " din" : "") + (h === favorit ? " favorit" : "")}>
            <${Täcke} nr=${h.spår} /> ${h.namn} — ${h.kusk.namn}
            <span class="streck">${h.streck.toFixed(1)} %</span>
          </div>`)}
      </div>
    </div>

    <${BanVy} lopp=${lopp} fält=${fält} bild=${bild} />
    <${Tracking} bild=${bild} dist=${lopp.dist} />

    ${!facit && html`
      <div class="bv-knappar">
        <button class="bv-knapp" aria-pressed=${fart === 110} onClick=${() => sättFart(110)}>1×</button>
        <button class="bv-knapp" aria-pressed=${fart === 38} onClick=${() => sättFart(38)}>3×</button>
        <button class="bv-knapp" onClick=${() => { clearTimeout(timer.current); sättRuta(sim.bild.length - 1); avsluta(); }}>Till mål</button>
      </div>`}

    <div class="kommentar">
      ${kommentarer.map((k, i) => html`<${Rad} key=${i} klass=${"k-rad " + (k.k || "")} html=${k.t} />`)}
    </div>

    ${facit && html`<${Facit} körning=${körning} facit=${facit}
      onKlart=${() => { sättKörning(null); sättFacit(null); }} />`}`;
}
