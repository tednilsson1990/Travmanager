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
import { invalsläge, INVALSKRAV, MOTIONER } from "./engine-sallskap.js";
import { useState } from "preact/hooks";
import { kr } from "./engine-util.js";
import { ARVODE_PER_VECKA, ÄGARTYPER } from "./data-agare.js";
import { boxplats } from "./engine-gard.js";
import { veckonetto, långsiktigt } from "./engine-vagvisare.js";
import { gåraugifter } from "./engine-gard.js";
import { ägarlista, hållMöte, MÖTESVAL, styrelsemått, förtroendetext } from "./engine-agare.js";
import { säkraSponsorer, teckna, tackaNej, kravläge } from "./engine-sponsor.js";
import { Stapel, Kurvan } from "./ui-delar.js";
import { importeraSparfil, listaBackuper, återställBackup } from "./state-spel.js";
import { licensläge } from "./engine-licens.js";
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
  /* STYRELSEMÅTTET (v151, 20.7): ägarkretsens samlade förtroende —
     tränarens riktiga styrelse. Fyra delmått ur siffror som redan
     levs; högt förtroende ger fler och bättre hästerbjudanden. */
  const styrelsen = styrelsemått(spel);
  return html`
    <h2>Ägarkretsen</h2>
    <div class="kort">
      <div class="prisrad"><span><b>Förtroendet</b></span><span class="pris">${styrelsen.total} / 100</span></div>
      <div class="logg">${förtroendetext(styrelsen.total)}</div>
      <div class="bars">
        <${Stapel} etikett="Resultat" värde=${styrelsen.resultat} />
        <${Stapel} etikett="Ekonomi" värde=${styrelsen.ekonomi} />
        <${Stapel} etikett="Kommunikation" värde=${styrelsen.kommunikation} />
        <${Stapel} etikett="Utveckling" värde=${styrelsen.utveckling} />
      </div>
      <div class="hint">Kretsens förtroende styr hur ofta nya hästägare hör av sig —
        och hur bra hästar de vågar skicka hit.</div>
    </div>

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
    <${Sponsorer} spel=${spel} uppdatera=${uppdatera} />
    <h2>Travsällskapet</h2>
    <div class="kort">
      ${(() => {
        /* SÄLLSKAPSSIDAN (v145, 24-resten): styrelsearbetet synligt
           mellan mejlen — status, bordets motion, historiken. */
        const sk = spel.sällskap;
        const läge = invalsläge(spel);
        if (!sk?.ledamot) {
          return html`
            <div class="logg">${läge.kvalar
              ? "Valberedningen har hört av sig — svaret väntar i Telefonen."
              : `Styrelseplats förtjänas: renommé ${INVALSKRAV.renommé}+ och ${INVALSKRAV.säsonger} fulla säsonger på banan. Du står på ${Math.round(spel.renommé ?? 0)} efter ${Math.max(0, (spel.säsong ?? 1) - 1)}.`}</div>`;
        }
        const motion = (sk.motioner ?? []).find((m) => m.säsong === (spel.säsong ?? 1) && !m.utfall);
        const historik = (sk.motioner ?? []).filter((m) => m.utfall).slice(-5).reverse();
        return html`
          <div class="prisrad"><span>Uppdraget</span><span class="pris">Ledamot sedan säsong ${sk.invaldSäsong ?? "?"}</span></div>
          ${motion
            ? html`<div class="logg">På bordet: <b>${MOTIONER[motion.id]?.rubrik ?? motion.id}</b> — din röst väntar i Telefonen.</div>`
            : html`<div class="logg">Inga motioner på bordet just nu.</div>`}
          ${historik.length > 0 && html`
            <div class="stat-rubrik" style=${{ marginTop: "10px" }}>Protokollet</div>
            ${historik.map((m) => html`
              <div key=${m.id + m.säsong} class="prisrad">
                <span>s${m.säsong} · ${MOTIONER[m.id]?.rubrik ?? m.id}${m.dinRöst ? ` · du röstade ${m.dinRöst}` : ""}</span>
                <span class="pris">${m.utfall === "bifall" ? `bifall ${m.röster?.ja ?? "?"}–${m.röster?.nej ?? "?"}` : `avslag ${m.röster?.nej ?? "?"}–${m.röster?.ja ?? "?"}`}</span>
              </div>`)}`}`;
      })()}
    </div>

    ${(() => {
      /* HEMS ARV (v170, 32.2 ②): ekonomiöversikten och riktmärkena
         flyttade hit när Hem avvecklades — Kontoret är deras hem. */
      const drift = spel.stall.length * 3200 + gåraugifter(spel)
        - spel.stall.filter((h) => h.ägare).length * ARVODE_PER_VECKA;
      const mål = långsiktigt(spel);
      return html`
        <h2>Tränarlicensen</h2>
        <div class="kort">
          ${(() => {
            const läge = licensläge(spel);
            return html`
              <div class="prisrad"><span><b>${läge.nuvarande.namn}</b></span>
                <span class="pris">${läge.nuvarande.text}</span></div>
              ${läge.nästa ? html`
                <div class="hint">Nästa steg: <b>${läge.nästa.namn}</b> — ${läge.nästa.kravtext}.</div>
                ${läge.progress.map((p, i) => html`
                  <div key=${i} class="relrad">
                    <div class="relnamn">${p.namn}</div>
                    <div class="relbar"><i style=${{ width: Math.min(100, Math.round(100 * p.nu / p.mål)) + "%" }} /></div>
                    <div class="svar">${p.kr ? Math.round(p.nu / 1000) + "/" + Math.round(p.mål / 1000) + " tkr" : `${Math.min(p.nu, p.mål)}/${p.mål}`}</div>
                  </div>`)}`
              : html`<div class="hint">Elitlicensen — det finns inget steg ovanför. Nu försvaras den.</div>`}`;
          })()}
        </div>

        <h2>Ekonomin</h2>
        <div class="kort">
          <div class="prisrad"><span>Kassan</span><span class="pris">${kr(spel.kassa)} kr</span></div>
          <div class="prisrad"><span>Veckans drift (löner, foder, arvoden)</span>
            <span class="pris">${drift > 0 ? "−" : "+"}${kr(Math.abs(drift))} kr</span></div>
          <div class="prisrad"><span>Insprunget i år</span><span class="pris">${kr(spel.intjänat)} kr</span></div>
          ${(spel.historik ?? []).length >= 2 && html`
            <div class="meta" style=${{ marginTop: "10px" }}>Insprunget per säsong</div>
            <${Kurvan} rader=${(spel.historik ?? []).slice(-10).map((r) => ({
              etikett: "S" + r.säsong, värde: Math.round((r.intjänat ?? 0) / 1000) }))} enhet="tkr per säsong · tryck på en stapel" />`}
        </div>
        ${mål.length > 0 && html`
          <h2>Längre fram</h2>
          <div class="kort">
            ${mål.map((k, i) => html`
              <div key=${i} class="relrad">
                <div><div class="relnamn">${k.mål}</div>
                  ${k.not && html`<div class="relmini">${k.not}</div>`}</div>
                <div class="relbar"><i style=${{ width: Math.round(k.andel * 100) + "%" }} /></div>
                <div class="svar">${k.kr ? Math.round(k.andel * 100) + " %" : `${Math.min(k.nu, k.av)}/${k.av}`}</div>
              </div>`)}
          </div>`}`;
    })()}

    <h2>Felsökning</h2>
    <div class="kort">
      <div class="logg">Om något beter sig konstigt: exportera sparfilen och skicka den —
        med den kan exakt samma läge återskapas.</div>
      <button class="btn liten sekundär" onClick=${() => {
        try {
          const rå = localStorage.getItem("travmanager.sparfil.v1") ?? "{}";
          const blob = new Blob([rå], { type: "application/json" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "travmanager-sparfil.json";
          a.click();
          URL.revokeObjectURL(a.href);
        } catch { /* inget att exportera */ }
      }}>Exportera sparfilen</button>
      <button class="btn liten sekundär" onClick=${() => {
        /* IMPORTEN (v149): valideras hårt i importeraSparfil — den
           liggande karriären röres inte förrän filen bevisat sig. */
        const input = document.createElement("input");
        input.type = "file"; input.accept = ".json,application/json";
        input.onchange = async () => {
          const fil = input.files?.[0];
          if (!fil) return;
          try {
            importeraSparfil(await fil.text());
            location.reload();
          } catch (e) { alert(`Importen avbröts: ${e.message ?? "filen gick inte att läsa."}`); }
        };
        input.click();
      }}>Importera sparfil</button>
    </div>

    ${(() => {
      /* SÄKERHETSKOPIORNA (v149, kap 26 G): tre rullande generationer,
         tagna automatiskt inför varje ny vecka. En trasig vecka är
         aldrig värre än "återställ förra veckan". */
      const backuper = listaBackuper();
      return html`
        <h2>Säkerhetskopior</h2>
        <div class="kort">
          <div class="logg">Tas automatiskt inför varje ny vecka — läget som det var
            INNAN veckan kördes. Tre generationer sparas.</div>
          ${backuper.length === 0
            ? html`<div class="tom">Inga säkerhetskopior än. Den första tas när nästa vecka körs.</div>`
            : backuper.map((b) => html`
              <div key=${b.nyckel} class="prisrad">
                <span>Säsong ${b.säsong}, vecka ${b.vecka}
                  <div class="relmini">${b.stallnamn} · ${kr(b.kassa)} kr i kassan</div></span>
                <button class="btn liten sekundär" onClick=${() => {
                  if (!confirm(`Återställa karriären till säsong ${b.säsong}, vecka ${b.vecka}? Nuvarande läge skrivs över.`)) return;
                  try { återställBackup(b.nyckel); location.reload(); }
                  catch (e) { alert(`Återställningen avbröts: ${e.message}`); }
                }}>Återställ</button>
              </div>`)}
        </div>`;
    })()}`;
}
