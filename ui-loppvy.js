import { useEffect, useRef, useState } from "preact/hooks";
import { html } from "htm/preact";
import { TAKTIKER } from "./data-lopp.js";
import { veckansLopp, startförbud, kravText } from "./data-kalender.js";
import { KUSKAR, villig, svar, uppbokad, uppbokadeI } from "./data-kuskar.js";
import { distanspassning } from "./engine-hast.js";
import { byggFält, rustaFält, bokför } from "./engine-varld.js";
import { beräknaStreck } from "./engine-streck.js";
import { simulera } from "./engine-simulera.js";
import { efterLopp } from "./engine-vecka.js";
import { blanda, klamp, kr, kmtid, tidText, plock, slump } from "./engine-util.js";
import { Täcke, Tom, Rad } from "./ui-delar.js";
import BanVy from "./ui-banvy.js";

/* ==================== Steg 1: anmälan ==================== */

function passningsText(häst, lopp) {
  const p = distanspassning(häst, lopp.dist);
  if (p > 0.75) return { t: "distansen passar", c: "bra" };
  if (p > 0.4) return { t: "distansen går an", c: "" };
  return {
    t: häst.distans.optimal < lopp.dist ? "för långt för hästen" : "för kort för hästen",
    c: "dålig",
  };
}

function Anmälan({ spel, onStart }) {
  const startbara = spel.stall.filter(
    (h) => h.skada === 0 && h.senasteStartVecka !== spel.vecka
  );
  const veckans = veckansLopp(spel.vecka);
  /* Kåren är stor. Visa dem som tackar ja, plus några snäpp över för att
     visa vad du kan sikta på när renommét stiger. */
  const villiga = KUSKAR.filter((k) => villig(spel, k));
  const drömmar = KUSKAR.filter((k) => !villig(spel, k)).slice(0, 5);
  const valbara = [...villiga.slice(0, 28), ...drömmar];
  const [hästId, sättHäst] = useState(startbara[0]?.id ?? null);
  const [loppIx, sättLopp] = useState(0);
  const [kuskNamn, sättKusk] = useState(villiga[0]?.namn ?? KUSKAR[KUSKAR.length - 1].namn);

  if (!startbara.length) {
    return html`<${Tom}>
      Alla startklara hästar har redan startat den här veckan. Kör veckan i Stall.
    <//>`;
  }

  const häst = spel.stall.find((h) => h.id === hästId) || startbara[0];
  const lopp = veckans[Math.min(loppIx, veckans.length - 1)];
  const förbud = startförbud(häst, lopp);
  const passning = passningsText(häst, lopp);
  const kusk = KUSKAR.find((k) => k.namn === kuskNamn) || villiga[0] || KUSKAR[KUSKAR.length - 1];
  /* Uppbokad gäller PER LOPP — byter man lopp kan samma kusk vara ledig. */
  const bokad = uppbokad(spel, kusk, lopp);
  const kanStarta = !förbud && villig(spel, kusk) && !bokad && spel.kassa >= kusk.arvode;

  return html`
    <h2>Vecka ${spel.vecka} — anmälan</h2>
    <div class="kort">
      <label class="fält" for="v-hast">Häst</label>
      <select id="v-hast" value=${hästId} onChange=${(e) => sättHäst(+e.target.value)}>
        ${startbara.map((h) => html`
          <option key=${h.id} value=${h.id}>
            ${h.namn} — form ${Math.round(h.form)} · energi ${Math.round(h.energi)} · bäst ${h.distans.optimal} m
          </option>`)}
      </select>

      <label class="fält" for="v-lopp">Lopp</label>
      <select id="v-lopp" value=${loppIx} onChange=${(e) => sättLopp(+e.target.value)}>
        ${veckans.map((l, i) => html`
          <option key=${l.id} value=${i}>
            ${l.v85 ? "★ " : ""}${l.namn} · ${l.dist} m · ${kr(l.pris[0])} kr
          </option>`)}
      </select>

      <label class="fält" for="v-kusk">Kusk</label>
      <select id="v-kusk" value=${kusk.namn} onChange=${(e) => sättKusk(e.target.value)}>
        ${valbara.map((k) => html`
          <option key=${k.namn} value=${k.namn} disabled=${!villig(spel, k) || uppbokad(spel, k, lopp)}>
            ${k.namn} — ${k.stil} · st ${k.start}/av ${k.avslutning} · ${uppbokad(spel, k, lopp) ? "uppbokad i loppet" : svar(spel, k).t} · ${kr(k.arvode)}
          </option>`)}
      </select>
    </div>

    <div class="loppfakta">
      <div><span>Proposition</span> ${kravText(lopp)}</div>
      <div><span>Bana</span> ${lopp.banaNamn}${lopp.openStretch ? " · open stretch" : ""} · ${lopp.startande} startande</div>
      <div><span>Prispengar</span> ${kr(lopp.förstapris)} kr till segraren · ${lopp.antalPris} pris · ${kr(lopp.garanterad)} kr garanterat</div>
      <div><span>Start</span> ${lopp.start === "volt" ? "voltstart" : "autostart"}</div>
      <div class=${passning.c}><span>Distans</span> ${passning.t}</div>
      ${(häst.kuskbekant?.[kusk.namn] ?? 0) > 0 && html`<div><span>Ekipaget</span>
        ${kusk.namn} har kört ${häst.namn} ${häst.kuskbekant[kusk.namn]} ${häst.kuskbekant[kusk.namn] === 1 ? "gång" : "gånger"}
        — ${häst.kuskbekant[kusk.namn] >= 6 ? "kan hästen utan och innan" : "kännedomen växer för varje start"}</div>`}
      ${lopp.v85 && html`<div class="v85"><span>V85</span> hela landet spelar på omgången</div>`}
    </div>

    <button class="btn" disabled=${!kanStarta} onClick=${() => onStart({ häst, lopp, kusk })}>
      Anmäl till lopp
    </button>
    ${förbud && html`<div class="hint skada">${häst.namn} får inte starta: ${förbud.toLowerCase()}.</div>`}
    ${!förbud && !kanStarta && html`<div class="hint">
      ${!villig(spel, kusk) ? `${kusk.namn} tackar nej.`
        : bokad ? `${kusk.namn} kör för ett annat stall i det här loppet. Välj en annan kusk — eller ett annat lopp.`
        : "Kassan räcker inte till kuskarvodet."}
    </div>`}`;
}

/* ==================== Startlista ==================== */

function Startlista({ fält, favorit, visaStreck }) {
  return html`
    <div class="kort">
      <div class="meta" style="margin-bottom:6px">
        Startlista${visaStreck ? " och streckprocent" : ""}
      </div>
      <div class="startlista">
        ${[...fält].sort((a, b) => a.spår - b.spår).map((h) => html`
          <div key=${h.spår} class=${"sl-rad" + (h.egen ? " din" : "") + (h === favorit ? " favorit" : "")}>
            <${Täcke} nr=${h.spår} /> ${h.namn} — ${h.kusk.ryktbarhet >= 78 ? "★ " : ""}${h.kusk.namn}
            ${visaStreck && html`<span class="streck">${h.streck.toFixed(1)} %</span>`}
          </div>`)}
      </div>
    </div>`;
}

/* ==================== Steg 3: pressen ==================== */

const PRESSVAL = [
  { id: "upp", rubrik: "Tala upp hästen",
    citat: "Han är i sitt livs form. Vi åker dit för att vinna.",
    följd: "Uppmärksamheten stiger och hästen blir hårdare spelad. Misslyckas ni kostar det mer.",
    hype: 14, förväntan: 1 },
  { id: "neutral", rubrik: "Hålla det sakligt",
    citat: "Vi får se hur det utvecklar sig. Hästen känns bra hemma.",
    följd: "Ingen påverkan på spelet.",
    hype: 0, förväntan: 0 },
  { id: "ner", rubrik: "Tona ner",
    citat: "Det här är mest ett träningslopp, vi siktar längre fram.",
    följd: "Oddsen hålls uppe och pressen blir mildare — men ägare vill synas.",
    hype: -11, förväntan: -1 },
];

function Pressen({ häst, lopp, onVal }) {
  return html`
    <h2>Pressen ringer</h2>
    <div class="samtal">
      <div class="samtal-vem">Travronden</div>
      <div class="samtal-text">
        Vi skriver inför ${lopp.kortnamn || lopp.namn}. ${häst.namn} fick spår ${häst.spår} —
        hur ser du på chansen?
      </div>
    </div>
    ${PRESSVAL.map((v) => html`
      <button key=${v.id} class="val" onClick=${() => onVal(v)}>
        <div class="val-rubrik">${v.rubrik}</div>
        <div class="val-citat">”${v.citat}”</div>
        <div class="val-följd">${v.följd}</div>
      </button>`)}`;
}

/* ==================== Steg 4: kusksamtal ==================== */

/**
 * Kuskens läsning av loppet, given spåret. Rådet bygger på hästens
 * egenskaper och startspåret — och kusken har inte alltid rätt. En skicklig
 * kusk pekar oftare på det bästa alternativet.
 */
function kuskensRåd(häst, lopp, kusk) {
  const spår = häst.spår;
  const bakspår = lopp.start === "bil" ? spår >= 9 : spår >= 8;
  const springspår = lopp.start === "volt" && (spår === 6 || spår === 7);
  const snabbUt = häst.start >= 60;
  const stark = häst.styrka >= 60;
  const spurtare = häst.fart >= 62 && häst.start < 58;

  const råd = [];
  if (!bakspår && (snabbUt || springspår)) {
    råd.push({ taktik: "ledning", text: springspår
      ? "Från springspåret kommer vi ut med fart. Jag tror vi kan köra oss till spets."
      : "Han är snabb från start och vi har spåret. Jag kör mot ledningen." });
  }
  if (!bakspår) {
    råd.push({ taktik: "rygg",
      text: "Jag löser ut och tar rygg på ledaren om jag kan. Billigaste resan — men vi måste få lucka." });
  }
  if (stark) {
    råd.push({ taktik: "utv",
      text: "Han orkar jobba. Går det trögt inne går jag ut och pressar, även om det kostar." });
  }
  if (bakspår || !snabbUt) {
    råd.push({ taktik: "skydd", text: bakspår
      ? "Från bakspår styr vi inte starten. Jag lägger mig i skydd och tar det som kommer."
      : "Han är inte snabb nog ut. Jag sparar honom inne och hoppas på en lucka." });
  }
  if (spurtare) {
    råd.push({ taktik: "spurt",
      text: "Han har en riktig avslutning. Jag avvaktar och fäller ut sent." });
  }

  const unika = [];
  råd.forEach((r) => { if (!unika.some((u) => u.taktik === r.taktik)) unika.push(r); });
  const lista = unika.slice(0, 4);
  const rekommenderad = slump() < 0.4 + kusk.taktik / 260
    ? lista[0].taktik
    : plock(lista).taktik;
  return { råd: lista, rekommenderad };
}

function Kusksamtal({ häst, lopp, kusk, fält, onVal }) {
  const { råd, rekommenderad } = kuskensRåd(häst, lopp, kusk);
  const favorit = [...fält].sort((a, b) => b.streck - a.streck)[0];
  return html`
    <h2>Samtal med ${kusk.namn}</h2>
    <div class="samtal">
      <div class="samtal-vem">${kusk.namn}</div>
      <div class="samtal-text">
        Vi har spår ${häst.spår}${lopp.start === "volt" ? " i volten" : ""}.
        ${favorit === häst
          ? " Vi är mest spelade, så de andra kommer att titta på oss."
          : ` ${favorit.namn} ser ut att bli favoritspelad.`}
        Hur vill du att jag kör?
      </div>
    </div>
    ${råd.map((r) => html`
      <button key=${r.taktik} class=${"val" + (r.taktik === rekommenderad ? " rek" : "")}
        onClick=${() => onVal(r.taktik)}>
        <div class="val-rubrik">
          ${TAKTIKER[r.taktik].namn}
          ${r.taktik === rekommenderad && html`<span class="rek-marke">kuskens förslag</span>`}
        </div>
        <div class="val-citat">”${r.text}”</div>
      </button>`)}`;
}

/* ==================== Loppet ==================== */

function Tracking({ bild, dist }) {
  if (!bild) return null;
  return html`
    <div class="track">
      <div class="tr-bana"><i style=${{ width: Math.min(100, (bild.meter / dist) * 100) + "%" }} /></div>
      ${bild.rader.map((r, i) => {
        const lk = r.läge.includes("utvändigt") || r.läge.includes("spåret") ? "utv"
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
      ${facit.dagstext && html`<div class=${facit.dåligDag ? "skada" : "logg"}>${facit.dagstext}</div>`}
      ${facit.ägartext && html`<div class=${facit.ägartext.ton === "dålig" ? "skada" : "logg"}>${facit.ägartext.text}</div>`}
      ${häst.skada > 0 && html`<div class="skada">Kom ur loppet ömmande — ${häst.skada} vecka(or) vila.</div>`}
    </div>
    <button class="btn" onClick=${onKlart}>Klart</button>`;
}

/* ==================== Tävlingsdagen ==================== */

export default function LoppVy({ spel, uppdatera }) {
  const [steg, sättSteg] = useState("anmälan");
  const [körning, sättKörning] = useState(null);
  const [ruta, sättRuta] = useState(0);
  const [fart, sättFart] = useState(110);
  const [facit, sättFacit] = useState(null);
  const timer = useRef(null);

  /* Steg 1 → 2: anmälan klar, spåren lottas */
  const anmäl = ({ häst, lopp, kusk }) => {
    /* Motståndarna hämtas ur världen — samma individer som tävlar mot
       varandra de veckor du inte möter dem. */
    const fält = byggFält(spel.värld, lopp, spel.vecka, new Set(), häst);
    /* De uppbokade kuskarna sitter i det här fältet på riktigt — samma
       kuskar som anmälan nekade dig syns nu hos motståndarna. */
    rustaFält(fält, lopp, kusk, "rygg", uppbokadeI(spel, lopp).filter((k) => k.namn !== kusk.namn));
    beräknaStreck(fält, spel, lopp);
    uppdatera((s) => {
      s.kassa -= kusk.arvode;
      s.startadeLopp = [...(s.startadeLopp || []), lopp.id];
    });
    sättKörning({ häst, lopp, kusk, fält });
    sättSteg("lottning");
  };

  /* Steg 3: pressen — uppmärksamheten ändras och därmed streckprocenten */
  const pressval = (val) => {
    /* Hästen i körningen ÄR samma objekt som i stallet, så ändringen får
       bara göras en gång — annars blev "tala upp" +28 i stället för +14. */
    uppdatera(() => { körning.häst.hype = klamp(körning.häst.hype + val.hype); });
    beräknaStreck(körning.fält, spel, körning.lopp);
    sättKörning({ ...körning, pressval: val });
    sättSteg("kusk");
  };

  /* Steg 4: körorder vald — loppet körs */
  const kör = (taktik) => {
    const { fält, lopp, häst } = körning;
    häst.taktik = taktik;
    const favorit = [...fält].sort((a, b) => b.streck - a.streck)[0];
    sättRuta(0);
    sättFacit(null);
    sättKörning({ ...körning, taktik, favorit, sim: simulera(fält, lopp) });
    sättSteg("lopp");
  };

  const avsluta = () => {
    if (!körning || !körning.sim || facit) return;
    const { sim, lopp, häst, kusk, favorit, pressval } = körning;
    const min = sim.resultat.find((r) => r.häst.egen);
    const streckRang = [...sim.resultat].sort((a, b) => b.streck - a.streck)
      .findIndex((r) => r.häst.egen) + 1;
    let sammanfattning;
    uppdatera((s) => {
      const h = s.stall.find((x) => x.id === häst.id) || häst;
      h.senasteStartVecka = s.vecka;
      // Motståndarnas meriter och prispengar bokförs i världen
      bokför(s.värld, lopp, sim.resultat, s.vecka);
      sammanfattning = efterLopp(s, {
        häst: h, kusk, lopp, min,
        varFavorit: favorit === häst,
        streckRang,
        förväntan: pressval ? pressval.förväntan : 0,
      });
    });
    sättFacit({ ...sammanfattning, min });
    sättSteg("facit");
  };

  useEffect(() => {
    if (steg !== "lopp" || !körning || !körning.sim) return;
    if (ruta >= körning.sim.bild.length) { avsluta(); return; }
    timer.current = setTimeout(() => sättRuta((r) => r + 1), fart);
    return () => clearTimeout(timer.current);
  }, [steg, ruta, fart, körning]);

  const nollställ = () => {
    sättKörning(null); sättFacit(null); sättRuta(0); sättSteg("anmälan");
  };

  if (steg === "anmälan" || !körning) {
    return html`<${Anmälan} spel=${spel} onStart=${anmäl} />`;
  }

  const { häst, lopp, kusk, fält } = körning;
  const favorit = körning.favorit || [...fält].sort((a, b) => b.streck - a.streck)[0];

  if (steg === "lottning") {
    const andraLedet = lopp.start === "bil" && häst.spår >= 9;
    const springspår = lopp.start === "volt" && (häst.spår === 6 || häst.spår === 7);
    return html`
      <h2>Spårlottning — ${lopp.namn}</h2>
      <div class="lottning">
        <div class="lott-etikett">${häst.namn} fick</div>
        <div class="lott-spår"><${Täcke} nr=${häst.spår} /></div>
        <div class="lott-text">
          spår ${häst.spår}${andraLedet ? " — andra ledet" : ""}${springspår ? " — springspår" : ""}
        </div>
      </div>
      <${Startlista} fält=${fält} favorit=${favorit} visaStreck=${false} />
      <button class="btn" onClick=${() => sättSteg("press")}>Vidare</button>`;
  }

  if (steg === "press") {
    return html`<${Pressen} häst=${häst} lopp=${lopp} onVal=${pressval} />`;
  }

  if (steg === "kusk") {
    return html`
      <${Startlista} fält=${fält} favorit=${favorit} visaStreck=${true} />
      <${Kusksamtal} häst=${häst} lopp=${lopp} kusk=${kusk} fält=${fält} onVal=${kör} />`;
  }

  const bild = körning.sim.bild[Math.min(ruta, körning.sim.bild.length - 1)];
  const kommentarer = körning.sim.bild.slice(0, ruta + 1).flatMap((b) => b.text);

  return html`
    <h2>${lopp.namn} · ${lopp.dist} m · ${lopp.start === "volt" ? "voltstart" : "autostart"}</h2>

    ${favorit === häst && steg === "lopp" && html`
      <div class="förvänt">
        <b>${häst.namn} är loppets mest spelade häst (${häst.streck.toFixed(1)} %).</b>
        Motståndarnas kuskar utmanar dig mer sällan — men spelarna förväntar sig seger.
      </div>`}

    <${BanVy} lopp=${lopp} fält=${fält} bild=${bild} />
    <${Tracking} bild=${bild} dist=${lopp.dist} />

    ${steg === "lopp" && html`
      <div class="bv-knappar">
        <button class="bv-knapp" aria-pressed=${fart === 110} onClick=${() => sättFart(110)}>1×</button>
        <button class="bv-knapp" aria-pressed=${fart === 38} onClick=${() => sättFart(38)}>3×</button>
        <button class="bv-knapp" onClick=${() => {
          clearTimeout(timer.current);
          sättRuta(körning.sim.bild.length - 1);
          avsluta();
        }}>Till mål</button>
      </div>`}

    <div class="kommentar">
      ${kommentarer.map((k, i) => html`<${Rad} key=${i} klass=${"k-rad " + (k.k || "")} html=${k.t} />`)}
    </div>

    ${facit && html`<${Facit} körning=${körning} facit=${facit} onKlart=${nollställ} />`}`;
}
