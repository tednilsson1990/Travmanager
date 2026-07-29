import { useEffect, useRef, useState } from "preact/hooks";
import { html } from "htm/preact";
import { TAKTIKER } from "./data-lopp.js";
import { veckansLopp, startförbud, kravText, inbjudningslopp, medInbjudningspengar } from "./data-kalender.js";
import { KUSKAR, villig, svar, uppbokad, uppbokadeI, kuskstatus } from "./data-kuskar.js";
import { veckansMinneslopp } from "./engine-mentor.js";
import { Bild } from "./ui-grafik.js";
import { BANOR } from "./data-namnpaket.js";
import { distanspassning } from "./engine-hast.js";
import { byggFält, rustaFält, bokför, välTaktik } from "./engine-varld.js";
import { beräknaStreck } from "./engine-streck.js";
import { simulera } from "./engine-simulera.js";
import { efterLopp, bokförStallkamrat } from "./engine-vecka.js";
import { resekostnad } from "./engine-sponsor.js";
import { loppanalys } from "./engine-analys.js";
import { pressfråga } from "./engine-travblad.js";
import { klassEtikett, loppläge, GRUPPNAMN, klassklättring, startpoäng, startpoängText, bedömningsnivå } from "./engine-proposition.js";
import { uttagning, alternativlopp, kuskbekräftelse } from "./engine-anmalan.js";
import { stoppFör, nästaStopp, hoppaFram } from "./engine-klocka.js";
import { minnenInförLopp } from "./engine-minnen.js";
import { kuskEfterNamn } from "./data-kuskar.js";
import { spårkaraktär, spårtrappa, framförSpår } from "./data-lopp.js";
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

function Anmälan({ spel, onStart, inskickade = [], draTillbaka }) {
  /* Kvittona (v101): inskickade anmälningar visas här — hästen är ur
     väljaren, beskedet väntar vid onsdagens stopp. Dra tillbaka är
     gratis: inget har kostat något ännu. */
  const startbara = spel.stall.filter(
    (h) => h.skada === 0 && h.senasteStartVecka !== spel.vecka
      && !inskickade.some((a) => a.hästId === h.id)
  );
  /* Inbjudningsloppet läggs överst de veckor en inbjudan gäller —
     arrangörens pengar och ett fält i högre klass. */
  /* Minnesloppet går sin bestämda vecka varje säsong och läggs överst —
     före till och med inbjudningsloppen. Vissa lopp väger mer. */
  const minne = veckansMinneslopp(spel);
  const veckans = veckansLoppFör(spel, minne);
  /* Kåren är stor — men väljaren visar BARA kuskar som går att boka
     (Teds v98-princip: otillgängliga rader skräpar inte i listor;
     orsaken finns nära i stället). Drömkuskarna blev en aspirationsrad
     under väljaren, de uppbokade syns ändå i startlistan sen. */
  const villiga = KUSKAR.filter((k) => villig(spel, k));
  const drömmar = KUSKAR.filter((k) => !villig(spel, k)).slice(0, 3);
  const valbara = villiga.slice(0, 28);
  const [hästId, sättHäst] = useState(startbara[0]?.id ?? null);
  const [loppIx, sättLopp] = useState(0);
  const [kuskNamn, sättKusk] = useState(villiga[0]?.namn ?? KUSKAR[KUSKAR.length - 1].namn);

  /* Byter spelaren häst kan det valda loppet vara stängt för den nya —
     då hoppar valet till första berättigade i stället för att stå på en
     låst rad (manualen 6.2: stängda lopp visas, men väljs inte). */
  useEffect(() => {
    const h = spel.stall.find((x) => x.id === hästId) || startbara[0];
    if (!h) return;
    const nu = veckans[Math.min(loppIx, veckans.length - 1)];
    if (nu && loppläge(h, nu).status !== "ej") return;
    const ix = veckans.findIndex((l) => loppläge(h, l).status !== "ej");
    if (ix >= 0) sättLopp(ix);
  }, [hästId]);

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
  /* Hemmaplan: ingen resa och hemmapubliken ger extra. Bortalopp kostar. */
  const hemmabana = spel.hemmabana && BANOR[spel.hemmabana];
  const hemma = hemmabana && lopp.banaNamn === hemmabana.namn;
  const resa = hemmabana && !hemma ? resekostnad(spel) : 0;
  const kanStarta = !förbud && villig(spel, kusk) && !bokad && spel.kassa >= kusk.arvode + resa;


  /* FÖRSTAMANNENS FÖRSLAG (v98, Teds guidningspunkt): vägvisaren pekar
     på Hem — här, där beslutet faktiskt fattas, föreslår förstamannen
     en färdig anmälan: hästen i bäst form med öppna lopp, det bäst
     bedömda loppet för den, och en kusk som bekräftar direkt. Ett
     tryck fyller i alla tre valen — spelaren kan alltid ändra. */
  const förslag = (() => {
    if (!spel.förstaman) return null;
    const nivå = bedömningsnivå(spel);
    for (const h of [...startbara].sort((a, b) => (b.form ?? 0) - (a.form ?? 0))) {
      const öppna = veckans
        .map((l, i2) => ({ l, i2, läge: loppläge(h, l, nivå) }))
        .filter((x) => x.läge.status !== "ej")
        .sort((a, b) => a.läge.ordning - b.läge.ordning);
      if (!öppna.length) continue;
      const k = villiga.find((k2) => !uppbokad(spel, k2, öppna[0].l)
        && kuskstatus(spel, k2, öppna[0].l).status === "bekräftar");
      if (!k) continue;
      return { h, ...öppna[0], k };
    }
    return null;
  })();

    return html`
    ${förslag && html`
      <div class="kort">
        <div class="meta">${spel.förstaman.namn.split(" ")[0]} föreslår</div>
        <div class="logg">»${förslag.h.namn} i ${förslag.l.kortnamn || förslag.l.namn} — ${förslag.läge.not}. ${förslag.k.namn} kör och bekräftar direkt.«</div>
        <button class="btn sekundär" onClick=${() => { sättHäst(förslag.h.id); sättLopp(förslag.i2); sättKusk(förslag.k.namn); }}>
          Använd förslaget
        </button>
      </div>`}
    <${Bild} id="lopp" alt="" klass="vytopp" fallback=${null} />
    <h2>Vecka ${spel.vecka} — anmälan</h2>
    ${spel.inbjudan?.vecka === spel.vecka && html`
      <div class="kort inbjudan">
        <div class="meta">Inbjudan · gäller bara denna vecka</div>
        <div class="logg">Efter <b>${spel.inbjudan.häst}</b>s seger vill arrangören ha stallet
          i sitt inbjudningslopp — förhöjda prispengar, men fältet håller klass. ✉-loppet i listan.</div>
      </div>`}
    ${/* Matchningskortet gick upp i förstamannens förslag (v98) — ETT
        guidningskort, inte två konkurrerande. */ ""}
    <div class="kort">
      <label class="fält" for="v-hast">Häst</label>
      <select id="v-hast" value=${hästId} onChange=${(e) => sättHäst(+e.target.value)}>
        ${startbara.map((h) => html`
          <option key=${h.id} value=${h.id}>
            ${h.namn} — form ${Math.round(h.form)} · energi ${Math.round(h.energi)} · bäst ${h.distans.optimal} m
          </option>`)}
      </select>

      <label class="fält" for="v-lopp">Lopp</label>
      ${/* LOPPVÄLJAREN I FYRA GRUPPER (tävlingsmanualen 6.2): varje lopp
          sorteras rekommenderat/möjligt/riskfyllt/ej berättigat för den
          VALDA hästen. Även stängda lopp visas — så spelaren förstår
          nästa karriärsteg — men går inte att välja. */ ""}
      <select id="v-lopp" value=${loppIx} onChange=${(e) => sättLopp(+e.target.value)}>
        ${(() => {
          /* Bedömningsnivån (manualen 6.3): utan förstaman finns ingen
             klassläsning — grupperna kollapsar ärligt till Berättigade. */
          const nivå = bedömningsnivå(spel);
          const lägen = veckans.map((l, i) => ({ l, i, läge: loppläge(häst, l, nivå) }));
          return ["rekommenderad", "möjlig", "riskfylld"].map((grupp) => {
            const rader = lägen.filter((x) => x.läge.status === grupp);
            if (!rader.length) return null;
            return html`<optgroup key=${grupp} label=${nivå === 0 && grupp === "möjlig" ? "Berättigade" : GRUPPNAMN[grupp]}>
              ${rader.map(({ l, i }) => html`
                <option key=${l.id} value=${i} disabled=${grupp === "ej"}>
                  ${l.minneslopp ? "❦ " : ""}${l.id.endsWith("-inbjudan") ? "✉ " : ""}${l.v85 ? "★ " : ""}${l.namn} · ${l.dist} m · ${kr(l.pris[0])} kr${spel.hemmabana && BANOR[spel.hemmabana]?.namn === l.banaNamn ? " · hemma" : ""}
                </option>`)}
            </optgroup>`;
          });
        })()}
      </select>
      ${/* Stängda lopp och aspirationer bor i Visa detaljer (v102). */ ""}

      <label class="fält" for="v-kusk">Kusk</label>
      <select id="v-kusk" value=${kusk.namn} onChange=${(e) => sättKusk(e.target.value)}>
        ${valbara.filter((k) => !uppbokad(spel, k, lopp)).map((k) => html`
          <option key=${k.namn} value=${k.namn}>
            ${k.namn} — ${k.stil} · st ${k.start}/av ${k.avslutning} · ${kuskstatus(spel, k, lopp).status === "preliminär" ? "preliminärt ja" : uppbokad(spel, k, lopp) ? "uppbokad i loppet" : svar(spel, k).t} · ${kr(k.arvode)}
          </option>`)}
      </select>
    </div>

    ${/* BANTAT (v102, Teds läsbarhetskrav): synligt är bara det som
        påverkar beslutet NU — kort bedömning, varningar, en samman-
        fattningsrad. Allt annat bor under Visa detaljer. */ ""}
    <div class="loppfakta">
      ${(() => {
        const ks = kuskstatus(spel, kusk, lopp);
        return ks.status === "preliminär" && html`<div class="dålig">
          <span>Kusken</span> preliminärt ja — bekräftas vid beskedet</div>`;
      })()}
      ${(() => {
        const nivå = bedömningsnivå(spel);
        const läge = loppläge(häst, lopp, nivå);
        const ord = { rekommenderad: "rekommenderat", möjlig: "möjligt", riskfylld: "riskfyllt", ej: "inte berättigad" };
        return html`<div class=${läge.status === "rekommenderad" || nivå === 0 ? "" : "dålig"}>
          <span>Bedömning</span> ${ord[läge.status]}${läge.status !== "rekommenderad" ? ` — ${läge.not.split(" — ")[0]}` : ""}</div>`;
      })()}
      ${passning.c === "dålig" && html`<div class="dålig"><span>Distansen</span> ${passning.t}</div>`}
      <div><span>Loppet</span> ${lopp.dist} m ${lopp.start === "volt" ? "volt" : "auto"} · ${lopp.banaNamn} · ${kr(lopp.förstapris)} kr i förstapris · insats ${kr(kusk.arvode + resa)} kr</div>
    </div>

    <details class="detaljer">
      <summary>Visa detaljer — proposition, klassläge, spår och insats</summary>
      <div class="loppfakta">
        <div><span>Proposition</span> ${kravText(lopp)}</div>
        ${(() => {
          const nivåE = klassEtikett(häst);
          const sp = startpoäng(häst);
          return html`<div><span>Din häst</span> ${nivåE.text} · startpoäng ${sp.poäng} (${startpoängText(sp)})</div>`;
        })()}
        ${(() => {
          const nivå = bedömningsnivå(spel);
          const läge = loppläge(häst, lopp, nivå);
          const gräns = nivå >= 2 ? spel.uttagningsgränser?.[lopp.kortnamn] : null;
          return html`${läge.not && html`<div><span>Klassläget</span> ${läge.not}${läge.siffra ? ` · ${läge.siffra}` : ""}${gräns ? ` · senaste gränsen: ${gräns}` : ""}</div>`}`;
        })()}
        <div><span>Bana</span> ${lopp.banaNamn}${lopp.openStretch ? " · open stretch" : ""} · ${lopp.startande} startande</div>
        <div><span>Prispengar</span> ${kr(lopp.förstapris)} kr till segraren · ${lopp.antalPris} pris · ${kr(lopp.garanterad)} kr garanterat</div>
        <div class=${passning.c}><span>Distans</span> ${passning.t}</div>
        ${resa > 0 && html`<div><span>Resa</span> Bortalopp — ${kr(resa)} kr${resa < 1200 ? " (halverad av transportavtalet)" : ""}</div>`}
        ${hemma && html`<div><span>Hemmaplan</span> Ingen resa, extra prispengar</div>`}
        ${(häst.kuskbekant?.[kusk.namn] ?? 0) > 0 && html`<div><span>Ekipaget</span>
          ${kusk.namn} har kört ${häst.namn} ${häst.kuskbekant[kusk.namn]} ${häst.kuskbekant[kusk.namn] === 1 ? "gång" : "gånger"}</div>`}
        ${lopp.v85 && html`<div class="v85"><span>V85</span> hela landet spelar på omgången</div>`}
        ${drömmar.length > 0 && html`<div><span>Kuskar utom räckhåll</span> ${drömmar.map((k) => k.namn).join(", ")} — kräver högre renommé</div>`}
        ${(() => {
          const nivå = bedömningsnivå(spel);
          const stängda = veckans
            .map((l) => ({ l, läge: loppläge(häst, l, nivå) }))
            .filter((x) => x.läge.status === "ej");
          return stängda.length === 0 ? "" : html`
            <div><span>Stängda lopp</span> ${stängda.map(({ l, läge }) =>
              `${l.kortnamn || l.namn} (${läge.not})`).join(" · ")}</div>`;
        })()}
      </div>
      <${InsatsOchRisk} spel=${spel} häst=${häst} lopp=${lopp} kusk=${kusk} resa=${resa} />
    </details>



    ${inskickade.length > 0 && html`
      <div class="kort">
        <div class="meta">Inskickade anmälningar</div>
        ${inskickade.map((a) => {
          const h = spel.stall.find((x) => x.id === a.hästId);
          return html`<div key=${a.hästId} class="prisrad">
            <span>${h?.namn} · ${a.loppId}${a.status === "med" ? " ✓ med" : a.status === "avstod" ? " · avstod" : ""}</span>
            ${!a.status && html`<button class="btn liten sekundär" onClick=${() => draTillbaka(a)}>Dra tillbaka</button>`}
          </div>`;
        })}
        <div class="hint">Uttagningsbeskeden kommer vid onsdagens stopp.</div>
      </div>`}
    <button class="btn" disabled=${!kanStarta} onClick=${() => onStart({ häst, lopp, kusk })}>
      Skicka anmälan — beskedet kommer onsdag
    </button>
    ${förbud && html`<div class="hint skada">${häst.namn} får inte starta: ${förbud.toLowerCase()}.</div>`}
    ${!förbud && !kanStarta && html`<div class="hint">
      ${!villig(spel, kusk) ? `${kusk.namn} tackar nej.`
        : bokad ? `${kusk.namn} kör för ett annat stall i det här loppet. Välj en annan kusk — eller ett annat lopp.`
        : "Kassan räcker inte till kuskarvodet."}
    </div>`}`;
}

/**
 * INSATS & RISK (v84). Varje anmälan är ett åtagande, och det ska synas
 * INNAN knappen trycks. Siffrorna hämtas ur samma formler som motorn och
 * veckomotorn använder — travsäkerheten är simuleringens, skaderisken är
 * efterLopps. Rutan hittar inget på: den läser vad spelet redan vet.
 */
function InsatsOchRisk({ spel, häst, lopp, kusk, resa }) {
  const insats = kusk.arvode + resa;
  /* Travsäkerheten — exakt simuleringens formel. */
  const travsäkerhet = klamp(
    0.902 + (häst.lynne / 100) * 0.088
    - (häst.ålder <= 4 ? 0.028 : häst.ålder === 5 ? 0.012 : 0)
    - (häst.starter < 8 ? 0.015 : 0),
    0.85, 0.995
  );
  const springspår = lopp.start === "volt";
  let galopp = travsäkerhet > 0.96 ? "låg" : travsäkerhet > 0.925 ? "märkbar" : "hög";
  if (springspår && galopp === "låg") galopp = "märkbar — voltstart";
  else if (springspår) galopp += " — och voltstart gör det värre";
  /* Skaderisken efter lopp — efterLopps trösklar: låg energi 18 %, annars 5 %. */
  const sliten = häst.energi < 32;
  const gammal = häst.ålder > 8;
  const skada = sliten ? "förhöjd — hästen är sliten"
    : gammal ? "något förhöjd — åldern tar ut sin rätt" : "normal";
  /* Ägarhästens krav: en start är också en förbrukad chans. */
  const kravKvar = häst.krav ? häst.krav.antal - häst.kravStarter : null;
  return html`
    <div class="loppfakta insats">
      <div><span>Insats</span>${kr(insats)} kr (arvode${resa ? " + resa" : ""}) — betalas oavsett resultat</div>
      <div><span>Krafter</span>Loppet kostar 14–24 energi · hästen har ${Math.round(häst.energi)}</div>
      <div><span>Uppsida</span>${kr(lopp.förstapris)} kr till segraren · ${kr(lopp.garanterad)} kr garanterat</div>
      <div class=${galopp.startsWith("låg") ? "" : "dålig"}><span>Galopprisk</span>${galopp}</div>
      <div class=${skada === "normal" ? "" : "dålig"}><span>Skaderisk</span>${skada}</div>
      ${(() => {
        /* KLASSKLÄTTRINGSVARNINGEN (manualen 3.2): segern som belöning
           OCH problem — sägs före anmälan, inte efter. */
        const kl = klassklättring(häst, lopp);
        return kl.stängs.length > 0 && html`
          <div class="dålig"><span>Klassklättring</span>
            En seger lyfter startsumman till ${kr(kl.ny)} kr — ${kl.stängs.join(" och ")} stängs</div>`;
      })()}
      ${kravKvar !== null && html`
        <div class=${kravKvar <= 2 ? "dålig" : ""}><span>Ägarens krav</span>
          ${häst.krav.text} · ${Math.max(0, kravKvar)} ${kravKvar === 1 ? "start" : "starter"} kvar${kravKvar <= 2 ? " — den här räknas" : ""}</div>`}
    </div>`;
}


/** Veckans fullständiga lopplista: minneslopp och inbjudan överst. */
function veckansLoppFör(spel, minne = veckansMinneslopp(spel)) {
  return [
    ...(minne ? [minne] : []),
    ...(spel.inbjudan?.vecka === spel.vecka
      ? [medInbjudningspengar(inbjudningslopp(spel.vecka))] : []),
    ...veckansLopp(spel.vecka),
  ];
}

/**
 * UTTAGNINGSBESKEDET (v93, manualen 6.6–7.1). Tävlingsdagens första
 * dramatik ligger numera FÖRE loppet: kom hästen med? Beskedet ger
 * alltid siffrorna (anmälda, platser, gränsen, din poäng) och vid
 * struken eller inställd anmälan föreslås alternativ — spelaren lämnas
 * aldrig i en återvändsgränd. Ingenting har kostat något ännu.
 */
function Uttagningsbesked({ spel, besked, onKlar, onAnnat, onAvstå, läge }) {
  const { häst, lopp, kusk } = besked;
  const veckans = veckansLoppFör(spel);
  const med = besked.utfall === "med";
  /* KUSKBEKRÄFTELSEN (kap 9): den preliminära bokningen prövas nu när
     fältet är känt. Deterministisk — samma besked varje gång. Vid
     avhopp väljs reserven här, och arvodet blir reservens. */
  const bekräftelse = med ? kuskbekräftelse(spel, kusk, häst, besked.fält, lopp) : { bekräftad: true };
  const [reservNamn, sättReserv] = useState(null);
  const reserver = !bekräftelse.bekräftad
    ? KUSKAR.filter((k) => k.namn !== kusk.namn && villig(spel, k)
        && !uppbokadeI(spel, lopp).some((u) => u.namn === k.namn)).slice(0, 6)
    : [];
  const körande = reservNamn ? KUSKAR.find((k) => k.namn === reservNamn) : kusk;
  const nivå = bedömningsnivå(spel);
  const alternativ = med ? [] : alternativlopp(veckans, lopp, häst, (h, l) => loppläge(h, l, nivå));
  return html`
    <h2>Uttagningen · ${lopp.kortnamn || lopp.namn}</h2>
    <div class=${"kort " + (med ? "" : "inbjudan")}>
      <div class="meta">${med ? (besked.delat ? `Loppet delas — avdelning ${besked.avdelning} av ${besked.antalAvdelningar}` : "Ni är med") : besked.utfall === "struken" ? "Struken i uttagningen" : "Loppet ställs in"}</div>
      <div class="logg">${besked.text}</div>
      ${besked.överanmält && html`
        <div class="prisrad"><span>Anmälda</span><span class="pris">${besked.antal} till ${besked.platser} platser</span></div>
        <div class="prisrad"><span>Poänggränsen</span><span class="pris">${besked.gräns}</span></div>
        ${besked.dinPoäng !== undefined && html`
          <div class="prisrad"><span>${häst.namn}s startpoäng</span>
            <span class=${"pris " + (med ? "upp" : "ner")}>${besked.företräde ? "företräde (ostartad)" : besked.dinPoäng}</span></div>`}`}
    </div>
    ${med && !bekräftelse.bekräftad && html`
      <div class="samtal">
        <div class="samtal-vem">${kusk.namn} · telefonen</div>
        <div class="samtal-text">${bekräftelse.text}</div>
      </div>
      <div class="hint">Reserv — vem tar körningen?</div>
      ${reserver.map((k) => html`
        <button key=${k.namn} class=${"val" + (k.namn === reservNamn ? " rek" : "")}
          onClick=${() => sättReserv(k.namn)}>
          <div class="val-rubrik">${k.namn} · ${kr(k.arvode)} kr</div>
          <div class="val-citat">${k.stil} · st ${k.start}/av ${k.avslutning} · ${kuskstatus(spel, k, lopp).not}</div>
        </button>`)}`}
    ${med
      ? html`<button class="btn" disabled=${!bekräftelse.bekräftad && !reservNamn}
          onClick=${() => onKlar(besked.fält, körande)}>${läge === "onsdag"
            ? `Bekräfta — ${körande.namn} kör i helgen`
            : `Till lottningen — ${körande.namn} kör`}</button>`
      : html`
        ${alternativ.length > 0 && html`<div class="hint">Berättigade alternativ samma vecka:</div>`}
        ${alternativ.map(({ l, läge }) => html`
          <button key=${l.id} class="val" onClick=${() => onAnnat(l)}>
            <div class="val-rubrik">${l.namn} · ${l.dist} m · ${kr(l.pris[0])} kr</div>
            <div class="val-citat">${läge.not}</div>
          </button>`)}
        <button class="btn sekundär" onClick=${onAvstå}>Avstå den här veckan</button>`}
    <div class="hint">${med ? (läge === "onsdag"
      ? `Arvode ${kr(körande.arvode)} kr dras på loppdagen.`
      : `Arvode ${kr(körande.arvode)} kr dras när ni går till lottningen.`)
      : "Struken anmälan kostar ingenting — kusken kördes aldrig."}</div>`;
}

/* ==================== Startlista ==================== */

/**
 * Startlistan i tävlingsprogrammets språk: spår, häst med ålder och kön,
 * kusk, meriter och streck. Varje rad bär den data motståndaranalysen
 * behöver — som ATG:s listor, anpassade för en tränares öga.
 */
/**
 * MARKNADENS SKÄL (plan 3.3): varför spelarna tror på hästen — läst ur
 * data som redan finns, aldrig ur den dolda sanningen. Max tre skäl,
 * viktigast först. Ett travprogram förklarar procenten; det gör vi med.
 */
function marknadensSkäl(h, fält) {
  const skäl = [];
  if (h.kusk?.ryktbarhet >= 78) skäl.push(`toppkusk (${h.kusk.namn})`);
  if ((h.spår ?? 9) <= 3) skäl.push("fint läge");
  if ((h.svit ?? 0) >= 2) skäl.push(`${h.svit} raka segrar`);
  if ((h.form ?? 50) > 66) skäl.push("stark form på träningen");
  if ((h.hype ?? 0) >= 55) skäl.push("medialt uppmärksammad");
  const snittform = fält.reduce((a, o) => a + (o.form ?? 50), 0) / fält.length;
  if ((h.form ?? 50) > 55 && snittform < 48) skäl.push("svag form hos motståndet");
  if (skäl.length === 0 && (h.streck ?? 0) < 4) skäl.push("marknaden ser hellre andra");
  return skäl.slice(0, 3);
}

function Startlista({ fält, favorit, visaStreck }) {
  return html`
    <div class="kort">
      <div class="meta" style="margin-bottom:6px">
        Startlista${visaStreck ? " och streckprocent" : ""} · tryck på en rad för detaljer
      </div>
      <div class="startlista atg">
        ${[...fält].sort((a, b) => a.spår - b.spår).map((h) => {
          const trend = visaStreck && h.öppningsstreck != null
            ? h.streck - h.öppningsstreck : 0;
          return html`
          <details key=${h.spår} class=${"atg-rad utfällbar" + (h.egen ? " din" : "") + (h === favorit ? " favorit" : "")}>
            <summary class="atg-summering">
              <${Täcke} nr=${h.spår} />
              <div class="atg-mitt">
                <div class="atg-namn">${h.namn}
                  <span class="atg-kön">${h.ålder} år · ${(h.kön ?? "h")[0]}</span></div>
                <div class="atg-data">${h.kusk.ryktbarhet >= 78 ? "★ " : ""}${h.kusk.namn}
                  · ${h.starter ?? 0} st ${h.segrar ?? 0} seg
                  · ${Math.round((h.intjänat ?? 0) / 1000)} tkr</div>
              </div>
              ${visaStreck && html`<span class="streckstapel">
                <span class="streck">${h.streck.toFixed(1)} %</span>
                ${Math.abs(trend) >= 0.8 && html`<span class=${"trend " + (trend > 0 ? "upp" : "ner")}>${trend > 0 ? "▲" : "▼"}${Math.abs(trend).toFixed(0)}</span>`}
              </span>`}
            </summary>
            <div class="atg-detalj">
              <div class="atg-detaljrad"><span>Tränare</span>${h.egen ? "Du" : h.stallNamn ?? "—"}</div>
              <div class="atg-detaljrad"><span>Vinstprocent</span>${h.starter ? Math.round(100 * (h.segrar ?? 0) / h.starter) + " %" : "debutant"}</div>
              ${visaStreck && h.öppningsstreck != null && html`
                <div class="atg-detaljrad"><span>Spelöppning</span>${h.öppningsstreck.toFixed(1)} % → ${h.streck.toFixed(1)} %</div>`}
              ${h.egen && (h.resultat ?? []).length > 0 && html`
                <div class="atg-detaljrad"><span>Senaste fem</span>
                  <span class="formrad">
                    ${h.resultat.slice(0, 5).map((r, i) => html`
                      <span key=${i} class=${"fp " + (r.plats === 1 ? "seger" : r.plats && r.plats <= 3 ? "pall" : r.plats ? "" : "ur")}>${r.plats ?? "d"}</span>`)}
                  </span></div>`}
              ${visaStreck && html`
                <div class="atg-detaljrad skäl"><span>Marknaden</span>${marknadensSkäl(h, fält).join(" · ") || "inga tydliga signaler"}</div>`}
            </div>
          </details>`; })}
      </div>
      ${favorit && visaStreck && html`<div class="meta" style="margin-top:8px">
        Favorit: ${favorit.spår} ${favorit.namn} (${favorit.streck.toFixed(0)} %)</div>`}
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

function Pressen({ spel, häst, lopp, fält, onVal }) {
  /* PRESSEN MINNS (kap 5.4): frågan väljs ur historiken — nedtoningar,
     brutna löften och gamla förstamän ger frågor med udd. Deterministiskt
     ur engine-travblad; ingen slump, inget påhitt. */
  const fråga = pressfråga(spel, häst, lopp, fält);
  return html`
    <h2>Pressen ringer</h2>
    <div class="samtal">
      <div class="samtal-vem">Travronden${fråga.typ !== "vanlig" ? " · med udd i rösten" : ""}</div>
      <div class="samtal-text">${fråga.text}</div>
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
  const [taktik, sättTaktik] = useState(null);
  const { råd, rekommenderad } = kuskensRåd(häst, lopp, kusk);
  const favorit = [...fält].sort((a, b) => b.streck - a.streck)[0];
  /* Kuskens tempoläsning är ÄRLIG: motståndarnas körorder är redan satta
     i rustaFält, så "tre vill till spets" är fältets verkliga plan — inte
     en gissning som vyn hittar på. Exakt utfall vet ingen förrän bilen
     släpper. */
  const spetsvilja = fält.filter((h) => !h.egen && h.taktik === "ledning").length;
  const tempoläsning = spetsvilja >= 4
    ? `Minst ${spetsvilja} vill till spets — det kan bli en stenhård öppning.`
    : spetsvilja >= 2
    ? `Ett par stycken laddar för spets. Räkna med tempo första varvet.`
    : `Ingen verkar het på att köra. Det kan bli billigt där framme.`;

  /* Slutordern: NÄR avgörandet sätts in. Rekommendationen läses ur
     hästen och kuskens stil — en spurtare med otålig kusk är en
     klassisk konflikt, och den ska synas i samtalet. */
  const spurtare = häst.fart >= 62 && häst.styrka < 58;
  const rekSlut = spurtare ? "vänta" : häst.styrka >= 62 ? "attack" : "kusken";
  const SLUTORDER = [
    { id: "attack", rubrik: "Gå på vid 500 kvar",
      citat: (kusk.tålamod ?? 50) < 45
        ? "Så kör jag helst. När jag går, går jag för fullt."
        : "Tidigt, men okej. Håller han hela vägen är loppet vårt.",
      följd: "Avgörandet sätts in ett halvvarv från mål — men kusken känner hästen: är tanken tom vid punkten går hen på känsla i stället." },
    { id: "vänta", rubrik: "Spara allt till upploppet",
      citat: (kusk.tålamod ?? 50) >= 55
        ? "Bra. Jag sitter still tills det öppnar sig — sen smäller det."
        : "Jag ska försöka sitta på händerna. Men lovar inget om luckan kommer tidigt.",
      följd: "Mer kvar i tanken sista 240 — men vägen fram måste öppna sig, och det gör den inte alltid." },
    { id: "kusken", rubrik: `${kusk.namn.split(" ")[0]} avgör`,
      citat: "Jag känner efter hur han svarar. Lita på mig.",
      följd: "Kuskens egen tajming — avslutningsförmågan avgör hur rätt den sitter." },
  ];

  if (!taktik) {
    return html`
      <h2>Körordern — ${kusk.namn}</h2>
      <div class="samtal">
        <div class="samtal-vem">${kusk.namn} läser loppet</div>
        <div class="samtal-text">
          Vi har spår ${häst.spår} — ${spårkaraktär(häst.spår, lopp).text}.${lopp.start === "bil" && framförSpår(häst.spår) ? ` Vi startar bakom ${fält.find((h) => h.spår === framförSpår(häst.spår))?.namn ?? "spår " + framförSpår(häst.spår)}.` : ""}
          ${favorit === häst
            ? " Vi är mest spelade, så de andra kommer att titta på oss."
            : ` ${favorit.namn} ser ut att bli favoritspelad.`}
          ${tempoläsning}
        </div>
      </div>
      <div class="hint">Din rekommendation för resan — kusken är den som sitter bakom hästen</div>
      ${råd.map((r) => html`
        <button key=${r.taktik} class=${"val" + (r.taktik === rekommenderad ? " rek" : "")}
          onClick=${() => sättTaktik(r.taktik)}>
          <div class="val-rubrik">
            ${TAKTIKER[r.taktik].namn}
            ${r.taktik === rekommenderad && html`<span class="rek-marke">kuskens förslag</span>`}
          </div>
          <div class="val-citat">”${r.text}”</div>
        </button>`)}`;
  }

  return html`
    <h2>Slutordern — ${kusk.namn}</h2>
    <div class="samtal">
      <div class="samtal-vem">${kusk.namn}</div>
      <div class="samtal-text">
        ${TAKTIKER[taktik].namn} alltså. Sista frågan innan jag sätter mig:
        när vill du se att jag går på? Jag lovar att väga in det — men där
        ute är det jag som känner honom. ${spurtare
          ? `${häst.namn} har en riktig avslutning — den ska användas rätt.`
          : häst.styrka >= 62
          ? `${häst.namn} orkar jobba länge. Det går att gå tidigt.`
          : "Han är ingen maskin — tajmingen avgör."}
      </div>
    </div>
    ${SLUTORDER.map((v) => html`
      <button key=${v.id} class=${"val" + (v.id === rekSlut ? " rek" : "")}
        onClick=${() => onVal({ taktik, slutorder: v.id === "kusken" ? null : v.id })}>
        <div class="val-rubrik">${v.rubrik}
          ${v.id === rekSlut && html`<span class="rek-marke">kuskens förslag</span>`}</div>
        <div class="val-citat">”${v.citat}”</div>
        <div class="val-följd">${v.följd}</div>
      </button>`)}
    <button class="tillbaka" onClick=${() => sättTaktik(null)}>‹ Ändra grundordern</button>`;
}

/* ==================== Loppet ==================== */

/**
 * TV-LÄGET (plan 13.1): stor bana, kommentatorn och de främsta — mindre
 * teknik. Bara tätgruppen och den egna hästen visas, som TV4:s tracking.
 */
function TVTopp({ bild }) {
  if (!bild) return null;
  const topp = bild.rader.slice(0, 4);
  const egen = bild.rader.find((r) => r.egen);
  const rader = egen && !topp.includes(egen) ? [...topp, egen] : topp;
  return html`
    <div class="track tv">
      <div class="tr-bana"><i style=${{ width: Math.min(100, (bild.meter / (bild.dist || 1)) * 100) + "%" }} /></div>
      ${rader.map((r) => {
        const i = bild.rader.indexOf(r);
        return html`
          <div key=${r.spår} class=${"tr-rad" + (r.egen ? " din" : "")}>
            <${Täcke} nr=${r.spår} />
            <span><span class="tr-namn">${r.namn}</span><br />
              <span class="tr-lage">${r.läge}</span></span>
            <span class="tr-avst">${i === 0 ? "led" : "+" + r.avst.toFixed(1) + " l"}</span>
          </div>`;
      })}
      ${bild.ur.map((r) => html`
        <div key=${"ur" + r.spår} class="tr-rad ur">
          <${Täcke} nr=${r.spår} /><span class="tr-namn">${r.namn}</span>
          <span class="tr-avst">bortkörd</span>
        </div>`)}
    </div>`;
}

/**
 * ANALYSLÄGET (plan 13.1): hela fältet, positioner, kraft, fart och
 * ryggkedjorna. Kolumnfärgen visar var i banan raden ligger — innerspår,
 * ytterrad eller tredjespår — så kedjorna framgår av tabellen själv.
 */
function Analystabell({ bild, dist }) {
  if (!bild) return null;
  return html`
    <div class="track analys">
      <div class="tr-bana"><i style=${{ width: Math.min(100, (bild.meter / dist) * 100) + "%" }} /></div>
      ${bild.rader.map((r, i) => {
        const lk = r.läge.includes("utvändigt") || r.läge.includes("spåret") ? "utv"
          : r.läge === "instängd" ? "instangd" : "";
        return html`
          <div key=${r.spår} class=${"tr-rad kol" + r.kol + (r.egen ? " din" : "")}>
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

/**
 * Segerartikeln — skissernas panel 3. Visas efter stora segrar och skrivs
 * av loppfakta: dödensresa, spets hela vägen, skräll, marginal. Samma
 * seger ger aldrig samma artikel som en annan, för loppen är olika.
 */
function Segerartikel({ körning, facit }) {
  const { sim, häst, kusk, lopp } = körning;
  const min = facit.min;
  if (min.ur || min.plats !== 1) return null;
  const stor = lopp.storlopp || (lopp.pris?.[0] ?? 0) >= 40000 || min.streck < 14
    || (häst.milstolpar ?? []).some((m) => m.typ === "första_seger" && m.vecka === min.vecka);
  if (!stor && (lopp.pris?.[0] ?? 0) < 25000) return null;

  const tvåa = sim.resultat.find((r) => r.plats === 2);
  const marginal = tvåa ? Math.max(0.1, (tvåa.sek - min.sek) * 5.5) : null;
  const dödens = (min.dödensTid ?? 0) > 22;
  const spets = min.läge === "ledningen";
  const skräll = min.streck < 12;

  const rubrik = dödens ? "KROSSADE MOTSTÅNDET"
    : skräll ? "SKRÄLLEN INGEN SÅG KOMMA"
    : spets ? "LEDDE FRÅN START TILL MÅL"
    : lopp.storlopp ? "STALLETS STÖRSTA KVÄLL"
    : "SEGERN SATT DÄR DEN SKULLE";
  const ingress = dödens
    ? `${häst.namn} vann från dödens — ${Math.round(min.dödensTid * 13)} meter utan rygg, och ändå starkast på upploppet.`
    : skräll ? `Bara ${min.streck.toFixed(0)} % av spelarna trodde på ${häst.namn}. ${kusk.namn} visste bättre.`
    : spets ? `${kusk.namn} tog kommandot direkt med ${häst.namn} och släppte det aldrig.`
    : `${häst.namn} och ${kusk.namn} gjorde jobbet när det räknades.`;

  return html`
    <div class="scen" style=${{ marginTop: "12px" }}>
      <${Bild} id="bana-kvall" alt="" fallback=${null} />
      <div class="scen-etikett">${lopp.banaNamn} · säsong ${min.säsong ?? ""} ${lopp.storlopp ? "· STORLOPP" : ""}</div>
      <div class="scen-rubrik" style=${{ fontSize: "32px" }}>${rubrik}</div>
      <div class="ingress">${ingress}</div>
      <div class="faktaruta">
        <div><span>Lopp</span>${lopp.kortnamn || lopp.namn}</div>
        <div><span>Distans</span>${lopp.dist} m ${lopp.start}</div>
        <div><span>Segertid</span>${kmtid(min.km)}</div>
        ${marginal && html`<div><span>Marginal</span>${marginal.toFixed(1).replace(".", ",")} längder</div>`}
        <div><span>Spelprocent</span>${min.streck.toFixed(0)} %</div>
        ${dödens && html`<div><span>Utan rygg</span>ca ${Math.round(min.dödensTid * 13)} m</div>`}
      </div>
      <div class="citat">»${dödens ? "Hon fick göra allt jobbet själv. Att hon ändå orkar hela vägen — det säger allt."
        : skräll ? "Vi visste mer än spelarna den här gången."
        : "Precis loppet vi ville ha."}«
        <span class="citat-vem">${spel_citat(körning)}</span></div>
    </div>`;
}
const spel_citat = (k) => k.kusk?.namn ? `${k.kusk.namn}, kusk` : "Stallet";

/**
 * EFTERLOPPSANALYSEN (kap 14) i tävlingsprogrammets språk: planen, resan
 * i siffror (plan 3.7), avgörandet, det hästen gjorde bra och förstamannens
 * nästa steg. Allt ur engine-analys — vyn hittar aldrig på.
 */
const SLUTORDERTEXT = { attack: "gå på vid 500 kvar", vänta: "spara till upploppet" };

function Efterloppsanalys({ analys, körning }) {
  if (!analys) return null;
  const { plan, pos, tempo } = analys;
  const p = (x) => x ? `${x.plats}:a — ${x.läge}` : "—";
  return html`
    <h2>Efter loppet</h2>
    <div class="kort analys-kort">
      <div class="meta">Planen</div>
      <div class="prisrad"><span>Grundorder</span><span class="pris">${TAKTIKER[plan.taktik]?.namn ?? plan.taktik} · ${plan.kusk}</span></div>
      <div class="prisrad"><span>Din rekommendation</span><span class="pris">${SLUTORDERTEXT[plan.slutorder] ?? "kuskens egen tajming"}</span></div>
      ${analys.utfall && html`<div class="prisrad"><span>Kuskens beslut</span>
        <span class="pris">${analys.utfall.beslut === "vägrade" ? "kände en tom häst — vägrade attackera" : "följde rekommendationen"}</span></div>`}

      <div class="meta" style=${{ marginTop: "10px" }}>Resan</div>
      ${pos.v1500 && html`<div class="prisrad"><span>1 500 kvar</span><span class="pris">${p(pos.v1500)}</span></div>`}
      <div class="prisrad"><span>1 000 kvar</span><span class="pris">${p(pos.v1000)}</span></div>
      <div class="prisrad"><span>500 kvar</span><span class="pris">${p(pos.v500)}</span></div>
      ${analys.attack && html`<div class="prisrad"><span>Gick ut</span>
        <span class="pris">${Math.round(analys.attack.kvar / 50) * 50} kvar — ${analys.attack.läge}</span></div>`}
      ${analys.mLedning > 60 && html`<div class="prisrad"><span>I ledningen</span><span class="pris">ca ${analys.mLedning} m</span></div>`}
      ${analys.mDödens > 40 && html`<div class="prisrad"><span>I dödens</span><span class="pris">ca ${analys.mDödens} m</span></div>`}
      ${analys.mUtanRygg > 40 && html`<div class="prisrad"><span>Utan rygg totalt</span><span class="pris">ca ${analys.mUtanRygg} m</span></div>`}
      ${analys.mTredje > 30 && html`<div class="prisrad"><span>I tredjespår</span><span class="pris">ca ${analys.mTredje} m</span></div>`}
      ${analys.extraVäg > 5 && html`<div class="prisrad"><span>Extra löpt väg</span><span class="pris">ca ${analys.extraVäg} m</span></div>`}
      ${analys.instängdSent > 20 && html`<div class="prisrad"><span>Instängd på upploppet</span><span class="pris">ca ${analys.instängdSent} m</span></div>`}
      ${tempo.öppning && tempo.avslutning && html`<div class="prisrad"><span>Tempo öppning → avslutning</span>
        <span class="pris">${tempo.öppning} → ${tempo.avslutning}</span></div>`}
      ${analys.kraftKvar !== null && html`<div class="prisrad"><span>Kraft kvar i mål</span><span class="pris">${analys.kraftKvar} %</span></div>`}

      <div class="avgorande">${analys.avgörande}</div>
      <div class="logg">Att ta med: ${analys.bra.join(" · ")}.</div>
    </div>
    <div class="samtal">
      <div class="samtal-vem">Nästa steg${analys.nästaStegAv ? ` · ${analys.nästaStegAv}` : ""}</div>
      <div class="samtal-text">»${analys.nästaSteg}«</div>
    </div>`;
}

function Facit({ körning, facit, onKlart }) {
  const { sim, häst, kusk } = körning;
  const min = facit.min;
  /* MÅLFOTOT SOM ÖGONBLICK. När tätduon skiljs av mindre än ~en halv
     längd OCH spelarens häst är en av dem hålls facit tillbaka en
     knapptryckning: domarna granskar bilden. Tröskeln räknas i sekunder
     ur km-tiderna (0,08 s ≈ en dryg halvlängd i travtempo). Rena
     UI-teatern — resultatet är redan avgjort, bara inte VISAT. */
  const [målfotoKvar, sättMålfotoKvar] = useState(() => {
    const [etta, tvåa] = (sim?.resultat ?? []).filter((r) => !r.ur);
    if (!etta || !tvåa || etta.km == null || tvåa.km == null) return false;
    const sek = (tvåa.km - etta.km) * ((körning.lopp?.dist ?? 2140) / 1000);
    const inblandad = !min.ur && (min.plats ?? 9) <= 2;
    return sek < 0.08 && inblandad;
  });
  if (målfotoKvar) {
    return html`
      <div class="malfoto-scen">
        <${Bild} id="malfoto" alt="" klass="vytopp" fallback=${null} />
        <div class="scen-etikett">Måldomarna</div>
        <div class="malfoto-rubrik">MÅLFOTO</div>
        <div class="ingress">Två hästar över linjen som en. Domarna lutar sig
          över bilden — hela läktaren står upp och väntar.</div>
        <button class="btn steg-vidare" onClick=${() => sättMålfotoKvar(false)}>
          Domarnas besked</button>
      </div>`;
  }
  return html`
    ${/* Målfotot — bilden domaren tittar på. Ligger överst i facit så
        att resultatlistan känns som just ett facit, inte en tabell. */ ""}
    <${Bild} id="malfoto" alt="" klass="vytopp" fallback=${null} />
    <${Segerartikel} körning=${körning} facit=${facit} />
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
      ${facit.publik > 0 && html`<div class="logg pris">Hemmapubliken: <b>+${kr(facit.publik)} kr</b></div>`}
      <div class="logg">
        Renommé ${facit.renΔ >= 0 ? "+" : ""}${facit.renΔ.toFixed(1)} ·
        spelförtroende ${facit.troΔ >= 0 ? "+" : ""}${facit.troΔ} ·
        relation ${kusk.namn} ${facit.relΔ >= 0 ? "+" : ""}${facit.relΔ}
      </div>
      ${facit.dagstext && html`<div class=${facit.dåligDag ? "skada" : "logg"}>${facit.dagstext}</div>`}
      ${facit.ägartext && html`<div class=${facit.ägartext.ton === "dålig" ? "skada" : "logg"}>${facit.ägartext.text}</div>`}
      ${facit.karriärminne && html`<div class="logg guldram">❧ ${facit.karriärminne}</div>`}
      ${(facit.kamratrader ?? []).map((k) => html`
        <div key=${k.namn} class="logg">Stallkamraten ${k.namn} (${k.kusk}): ${k.plats ? `${k.plats}:a` : "bortkörd"}${k.netto > 0 ? ` · ${kr(k.netto)} kr till kassan` : ""}</div>`)}
      ${häst.skada > 0 && html`<div class="skada">Kom ur loppet ömmande — ${häst.skada} vecka(or) vila.</div>`}
    </div>
    <${Efterloppsanalys} analys=${facit.analys} körning=${körning} />
    <button class="btn" onClick=${onKlart}>Klart</button>`;
}

/* ==================== Tävlingsdagen ==================== */

export default function LoppVy({ spel, uppdatera }) {
  const [steg, sättSteg] = useState("anmälan");
  const [körning, sättKörning] = useState(null);
  const [ruta, sättRuta] = useState(0);
  const [fart, sättFart] = useState(110);
  /* Två sätt att se loppet (plan 13.1): TV-läget berättar, analysläget
     visar hela fältet med positioner, fart och kraft. */
  const [visning, sättVisning] = useState("tv");
  const [facit, sättFacit] = useState(null);
  const timer = useRef(null);

  /* KLOCKAN (v101, 20.1): anmälan skickas på MÅNDAGEN och kostar
     inget; uttagningen körs först vid onsdagens stopp. Spänningen i
     beskedet bor i väntan — inte i samma knapptryck. */
  const stopp = stoppFör(spel);
  const skickaAnmälan = ({ häst, lopp, kusk }) => {
    uppdatera((s) => {
      s.anmälningar = [...(s.anmälningar ?? []), { hästId: häst.id, loppId: lopp.id, kuskNamn: kusk.namn }];
    });
  };
  const draTillbaka = (a) => uppdatera((s) => {
    s.anmälningar = (s.anmälningar ?? []).filter((x) => x !== a && x.hästId !== a.hästId);
  });

  /* Steg 1 → 2: platsen klar, spåren lottas */
  const anmäl = ({ häst, lopp, kusk, fält: uttagetFält, kamrater = [] }) => {
    /* Fältet är de UTTAGNA anmälda — samma individer som tävlar mot
       varandra de veckor du inte möter dem. Ett tunt fält förblir tunt:
       inga påhittade hästar fyller ut ett arrangörskört lopp. */
    const fält = uttagetFält ?? byggFält(spel.värld, lopp, spel.vecka, new Set(), häst);
    /* De uppbokade kuskarna sitter i det här fältet på riktigt — samma
       kuskar som anmälan nekade dig syns nu hos motståndarna. */
    const egnaKuskar = new Set([kusk.namn, ...kamrater.map((k) => k.kusk.namn)]);
    rustaFält(fält, lopp, kusk, "rygg", uppbokadeI(spel, lopp).filter((k) => !egnaKuskar.has(k.namn)));
    /* Stallkamraterna (v106): bokad kusk och kuskens taktikval — de körs
       av sina kuskar, spelaren styr bara den först anmälda. */
    kamrater.forEach(({ häst: kh, kusk: kk }) => {
      kh.kusk = kk;
      kh.taktik = välTaktik(kh, lopp, kk);
    });
    beräknaStreck(fält, spel, lopp);
    uppdatera((s) => {
      const hemmaB = s.hemmabana && BANOR[s.hemmabana];
      const resa = hemmaB && lopp.banaNamn !== hemmaB.namn ? resekostnad(s) : 0;
      s.kassa -= kusk.arvode + kamrater.reduce((a, k) => a + k.kusk.arvode, 0) + resa;
      if (s.inbjudan?.vecka === s.vecka && lopp.id.endsWith("-inbjudan")) s.inbjudan = null;
      s.startadeLopp = [...new Set([...(s.startadeLopp || []), lopp.id])];
      /* Körd per häst (v107): de egna hästarna i DEN HÄR avdelningen. */
      const kördaId = new Set([häst.id, ...kamrater.map((k) => k.häst.id)]);
      (s.anmälningar ?? []).forEach((a) => { if (kördaId.has(a.hästId)) a.körd = true; });
    });
    sättKörning({ häst, lopp, kusk, fält, kamrater });
    sättSteg("lottning");
  };

  /* Steg 3: pressen — uppmärksamheten ändras och därmed streckprocenten */
  const pressval = (val) => {
    /* Hästen i körningen ÄR samma objekt som i stallet, så ändringen får
       bara göras en gång — annars blev "tala upp" +28 i stället för +14. */
    uppdatera(() => {
      körning.häst.hype = klamp(körning.häst.hype + val.hype);
      /* Pressen minns: valet arkiveras med resultatet i efterLopp (5.4). */
      körning.häst.senastePressval = val.id;
    });
    beräknaStreck(körning.fält, spel, körning.lopp);
    sättKörning({ ...körning, pressval: val });
    sättSteg("kusk");
  };

  /* Steg 4: körorder vald — loppet körs */
  const kör = ({ taktik, slutorder }) => {
    const { fält, lopp, häst } = körning;
    häst.taktik = taktik;
    const favorit = [...fält].sort((a, b) => b.streck - a.streck)[0];
    sättRuta(0);
    sättFacit(null);
    /* Slutordern ur kusksamtalet följer med in i loppet: motorn lägger
       den på hästen när ~500 meter återstår (engine-simulera). Ingen
       radio finns i trav — allt är sagt innan bilen släpper. */
    const sim = simulera(fält, lopp, slutorder ? { vid: 500, order: slutorder } : null);
    sättKörning({ ...körning, taktik, slutorder, favorit, sim });
    sättSteg("lopp");
  };

  const avsluta = () => {
    if (!körning || !körning.sim || facit) return;
    const { sim, lopp, häst, kusk, favorit, pressval } = körning;
    /* v106: identiteten, inte egen-flaggan — med stallkamrater i fältet
       pekade egen-flaggan på bäst placerade egna häst, inte den styrda. */
    const min = sim.resultat.find((r) => r.häst === häst);
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
        /* Simuleringen följer med: händelsemotorn läser position vid
           1 000 m, meter utan rygg och marginal direkt ur loppet. */
        sim: körning.sim,
        varFavorit: favorit === häst,
        streckRang,
        förväntan: pressval ? pressval.förväntan : 0,
      });
      /* Stallkamraternas bokföring (v106): resultatrad, pengar, energi
         och form — den styrda hästen fick full behandling ovan. */
      sammanfattning.kamratrader = (körning.kamrater ?? []).map(({ häst: kh, kusk: kk }) => {
        const rad = körning.sim.resultat.find((r) => r.häst === kh);
        const bok = bokförStallkamrat(s, { häst: kh, kusk: kk, lopp,
          rad: rad ? { plats: rad.plats, km: rad.km, spår: rad.spår ?? kh.spår, läge: rad.läge, ur: rad.ur } : null });
        return { namn: kh.namn, kusk: kk.namn, plats: bok.plats, netto: bok.netto };
      });
    });
    /* Efterloppsanalysen (kap 14): läses ur simuleringen som redan körts,
       EFTER efterLopp så att nästa steg ser hästens verkliga läge —
       inklusive en skada loppet just gav. */
    const analys = loppanalys(körning.sim, lopp, {
      häst, kusk, taktik: körning.taktik, slutorder: körning.slutorder,
      förstaman: spel.förstaman,
    });
    sättFacit({ ...sammanfattning, min, analys });
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

  /* ---- ONSDAG: beskedskön. Uttagningen körs NU, en anmälan i taget;
     bekräfta, byt till alternativlopp eller avstå. Loppet körs på
     helgen — här sparas bara utfallet och körande kusk. ---- */
  if (!körning && stopp === "onsdag") {
    const obesvarad = (spel.anmälningar ?? []).find((a) => !a.status);
    if (obesvarad) {
      const veckans = veckansLoppFör(spel);
      const häst = spel.stall.find((h) => h.id === obesvarad.hästId);
      const lopp = veckans.find((l) => l.id === obesvarad.loppId);
      const kusk = kuskEfterNamn(obesvarad.kuskNamn) ?? KUSKAR[0];
      if (häst && lopp) {
        /* Stallets övriga anmälda i samma lopp konkurrerar på riktigt
           (v106) — symmetriskt oavsett vems besked som visas. */
        const medEgna = (spel.anmälningar ?? [])
          .filter((x) => x !== obesvarad && x.loppId === obesvarad.loppId && x.status !== "avstod")
          .map((x) => spel.stall.find((h) => h.id === x.hästId)).filter(Boolean);
        const besked = { ...uttagning(spel, lopp, häst, medEgna), häst, lopp, kusk };
        return html`<${Uttagningsbesked} spel=${spel} besked=${besked} läge="onsdag"
          onKlar=${(f, körandeKusk) => uppdatera((s) => {
            if (besked.gräns) (s.uttagningsgränser ??= {})[besked.lopp.kortnamn] = besked.gräns;
            const mål = (s.anmälningar ?? []).find((x) => x.hästId === obesvarad.hästId);
            if (mål) { mål.status = "med"; mål.kuskNamn = (körandeKusk ?? kusk).namn; }
          })}
          onAnnat=${(nyttLopp) => uppdatera((s) => {
            const mål = (s.anmälningar ?? []).find((x) => x.hästId === obesvarad.hästId);
            if (mål) mål.loppId = nyttLopp.id;
          })}
          onAvstå=${() => uppdatera((s) => {
            const mål = (s.anmälningar ?? []).find((x) => x.hästId === obesvarad.hästId);
            if (mål) mål.status = "avstod";
          })} />`;
      }
    }
    return html`
      <h2>Onsdag — beskeden</h2>
      <div class="kort"><div class="logg">${(spel.anmälningar ?? []).some((a) => a.status === "med")
        ? "Beskeden är klara. Loppen körs i helgen."
        : "Inga starter i helgen."}</div></div>
      <button class="btn" onClick=${() => uppdatera((s) => hoppaFram(s))}>${nästaStopp(spel).etikett}</button>`;
  }

  /* ---- HELG: loppdagarna. Beskedade anmälningar körs i tur och
     ordning genom det befintliga loppflödet. ---- */
  if (!körning && stopp === "helg") {
    /* v107: körd räknas PER HÄST — med verklighetens delning kan
       stallets hästar stå i olika avdelningar av samma lopp, och då är
       det två körningar. */
    const kvar = (spel.anmälningar ?? []).filter((a) => a.status === "med" && !a.körd);
    if (kvar.length === 0) {
      return html`
        <h2>Helgen</h2>
        <div class="kort"><div class="logg">Inga fler lopp i helgen.</div></div>
        <button class="btn" onClick=${() => uppdatera((s) => hoppaFram(s))}>${nästaStopp(spel).etikett}</button>`;
    }
    /* Grupperat per lopp (v106): flera egna i samma lopp körs i EN
       körning — spelaren styr den först anmälda, stallkamraterna körs
       av sina bokade kuskar i samma fält. */
    const veckans = veckansLoppFör(spel);
    const grupper = [];
    kvar.forEach((a) => {
      const g = grupper.find((x) => x.loppId === a.loppId);
      if (g) g.anmälningar.push(a); else grupper.push({ loppId: a.loppId, anmälningar: [a] });
    });
    const först = grupper[0];
    const primärA = först.anmälningar[0];
    const häst = spel.stall.find((h) => h.id === primärA.hästId);
    const loppGrund = veckans.find((l) => l.id === först.loppId);
    const kusk = kuskEfterNamn(primärA.kuskNamn) ?? KUSKAR[0];
    const kamratA = först.anmälningar.slice(1);
    return html`
      <h2>Loppdag</h2>
      ${grupper.map((g, i) => {
        const l2 = veckans.find((l) => l.id === g.loppId);
        return html`<div key=${g.loppId} class="kort">
          <div class="meta">${i === 0 ? "Nästa start" : "Senare i helgen"}</div>
          <div class="namn">${l2?.kortnamn || l2?.namn}</div>
          ${g.anmälningar.map((a2) => {
            const h2x = spel.stall.find((h) => h.id === a2.hästId);
            return html`<div key=${a2.hästId} class="meta">${h2x?.namn} · ${a2.kuskNamn} kör</div>`;
          })}
        </div>`;
      })}
      <button class="btn" onClick=${() => {
        const kamrater = kamratA.map((a2) => ({
          häst: spel.stall.find((h) => h.id === a2.hästId),
          kusk: kuskEfterNamn(a2.kuskNamn) ?? KUSKAR[1],
        })).filter((k) => k.häst);
        /* Deterministisk uttagning — samma fält som beskeden, med
           kamraterna inräknade. */
        const b = uttagning(spel, loppGrund, häst, kamrater.map((k) => k.häst));
        const lopp = b.delat
          ? { ...loppGrund, namn: `${loppGrund.namn} avd. ${b.avdelning}`,
              kortnamn: `${loppGrund.kortnamn || loppGrund.namn} avd. ${b.avdelning}` }
          : loppGrund;
        anmäl({ häst, lopp, kusk, fält: b.fält ?? undefined,
          kamrater: kamrater.filter((k) => (b.fält ?? []).includes(k.häst)) });
      }}>Kör loppet — ${[häst, ...kamratA.map((a2) => spel.stall.find((h) => h.id === a2.hästId))]
        .filter(Boolean).map((h) => h.namn).join(" och ")} i ${loppGrund?.kortnamn || loppGrund?.namn}</button>`;
  }

  /* ---- MÅNDAG: anmälningarna är öppna. ---- */
  if (steg === "anmälan" || !körning) {
    return html`<${Anmälan} spel=${spel} onStart=${skickaAnmälan}
      inskickade=${spel.anmälningar ?? []} draTillbaka=${draTillbaka} />`;
  }

  const { häst, lopp, kusk, fält } = körning;
  const favorit = körning.favorit || [...fält].sort((a, b) => b.streck - a.streck)[0];

  if (steg === "lottning") {
    /* SPÅRTRAPPAN (v94, manualen kap 8): motorn har alltid vetat vad
       spåren är värda — nu ser spelaren samma kunskap, läst ur exakt
       samma data som utlösningen räknar med. */
    const karaktär = spårkaraktär(häst.spår, lopp);
    const trappa = spårtrappa(lopp);
    const framför = lopp.start === "bil" ? framförSpår(häst.spår) : null;
    const framförHäst = framför && fält.find((h) => h.spår === framför);
    return html`
      <h2>Spårlottning — ${lopp.namn}</h2>
      <div class="lottning">
        <div class="lott-etikett">${häst.namn} fick</div>
        <div class="lott-spår"><${Täcke} nr=${häst.spår} /></div>
        <div class="lott-text">spår ${häst.spår}</div>
      </div>
      <div class=${"loppfakta " + (karaktär.klass === "guld" ? "insats" : "")}>
        <div class=${["andraled", "svår", "risk", "tillägg"].includes(karaktär.klass) ? "dålig" : ""}>
          <span>Spårläget</span> ${karaktär.text}${framförHäst ? ` — närmast framför står ${framförHäst.namn}` : ""}</div>
        <div><span>Spårtrappan</span> bäst i dag: ${trappa.bäst.join(" och ")} · svårast: ${trappa.svårast.join(" och ")}</div>
      </div>
      ${(() => {
        /* KONTINUITETSMINNET (v104, 20.2): det som hänt förut, precis
           där laddningen inför loppet byggs. Max tre rader. */
        const minnen = minnenInförLopp(spel, häst, lopp, fält);
        return minnen.length === 0 ? "" : html`
          <div class="kort trådar">
            <div class="meta">Minnet</div>
            ${minnen.map((m, i) => html`<div key=${i} class="tråd">❧ ${m}</div>`)}
          </div>`;
      })()}
      <${Startlista} fält=${fält} favorit=${favorit} visaStreck=${false} />
      <button class="btn" onClick=${() => sättSteg("press")}>Vidare</button>`;
  }

  if (steg === "press") {
    return html`<${Pressen} spel=${spel} häst=${häst} lopp=${lopp} fält=${fält} onVal=${pressval} />`;
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

    <div class="visning-växel">
      <button aria-pressed=${visning === "tv"} onClick=${() => sättVisning("tv")}>TV</button>
      <button aria-pressed=${visning === "analys"} onClick=${() => sättVisning("analys")}>Analys</button>
    </div>
    ${visning === "tv"
      ? html`<${TVTopp} bild=${bild && { ...bild, dist: lopp.dist }} />`
      : html`<${Analystabell} bild=${bild} dist=${lopp.dist} />`}

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
