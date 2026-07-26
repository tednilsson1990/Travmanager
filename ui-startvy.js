/**
 * SPELSTARTEN — berättelsen får ta plats
 *
 * Fyra helskärmssteg i stället för en lång rullande blankett: ANKOMSTEN
 * (regnet, Evert, gårdens historia — bara berättelse, inga formulär),
 * NAMNET, DRÄKTEN och HEMMABANAN. Ett beslut per skärm, storyn runt
 * varje beslut. Sist trycks generationsskiftet som Travbladets
 * förstasida — spelarens första tidningssida av många.
 *
 * Stegen är LJUSA helskärmar (.helscen.ljus): prologen utspelas en regnig
 * förmiddag, inte under strålkastare. Kvällsmörkret sparas till loppen —
 * kontrasten är designsystemets bärande idé.
 *
 * Valen är på riktigt: dräkten följer stallet genom karriären och
 * hemmabanan avgör var man slipper resekostnader och får hemmapubliken.
 */
import { useState } from "preact/hooks";
import { html } from "htm/preact";
import { slump } from "./engine-util.js";
import { BANOR, DRÄKTER, JOURNALISTER, TIDNINGSNAMN, könAvFörnamn } from "./data-namnpaket.js";
import { skrivPress } from "./engine-vecka.js";
import { köScen } from "./engine-scener.js";
import { Dräkt, DräktIllustration, Bild, GårdIRegn, Porträtt } from "./ui-grafik.js";
import { FÖRSTAMANSNAMN } from "./data-namnpaket.js";

const NAMNFÖRSLAG = [
  "Björkhaga", "Stall Norrsken", "Ekbackens Trav", "Stall Framåt",
  "Lyckans Stall", "Stall Vintersol", "Granlidens Trav", "Stall Fyrklövern",
  "Månskensstallet", "Stall Rimfrost",
];

/** Gemensam ram för stegen: ljus helskärm, tillbakapil, etikett, rubrik. */
function Steg({ etikett, rubrik, barn, knapp, kan = true, påNästa, påTillbaka, sekundär }) {
  return html`
    <div class="helscen ljus">
      <div class="helscen-inre">
        ${påTillbaka && html`
          <button class="steg-tillbaka" aria-label="Tillbaka" onClick=${påTillbaka}>‹</button>`}
        <div class="scen-etikett">${etikett}</div>
        <div class="helscen-rubrik mörk">${rubrik}</div>
        ${barn}
        <button class="btn steg-vidare" disabled=${!kan} onClick=${påNästa}>${knapp}</button>
        ${sekundär}
      </div>
    </div>`;
}

export default function StartVy({ spel, uppdatera }) {
  const m = spel?.prolog?.mentor;
  /* ALLA hooks före första möjliga return — preact kräver samma
     hookordning i varje rendering, annars kraschar den. */
  const [steg, sättSteg] = useState(0);
  const [tränarnamn, sättTränarnamn] = useState("");
  const [namn, sättNamn] = useState("Björkhaga");
  const [dräkt, sättDräkt] = useState(DRÄKTER[0].id);
  const [bana, sättBana] = useState(null);
  const gå = (n) => { sättSteg(n); window.scrollTo({ top: 0 }); };

  /* STEG 0 — pressuppslaget: spelet börjar som en berättelse. */
  if (steg === 0) {
    return html`
      <div class="helscen ljus">
        <div class="helscen-inre">
          <${Bild} id="gard-hero" alt="Gården i morgonregn" klass="helscen-bild"
            fallback=${html`<${GårdIRegn} namn=${spel?.stallnamn ?? ""} />`} />
          <div class="scen-etikett">Säsong 0 · vecka 18</div>
          <div class="helscen-rubrik mörk">En gård väntar på sin arvtagare</div>
          <div class="helscen-ingress mörk">Efter mer än trettio år lämnar ${m?.namn ?? "gårdens tränare"} sporten.
            Under säsongens sista veckor ska du arbeta vid ${m?.namn?.includes("hild") || m?.namn?.includes("erit") ? "hennes" : "hans"} sida —
            innan ansvaret blir ditt.</div>
          <div class="citat">»Jag trodde länge att allt skulle behöva säljas.«
            <span class="citat-vem">${m?.namn}, ${m?.ålder} · ${m?.filosofitext}</span></div>
          <div class="meta">${spel?.stallnamn}, grundat ${spel?.gårdshistoria?.grundad} ·
            största seger: ${spel?.gårdshistoria?.störstaSeger} med ${spel?.gårdshistoria?.bästaHäst}</div>
          <button class="btn steg-vidare" onClick=${() => gå(1)}>Anländ till gården</button>
        </div>
      </div>`;
  }

  /* STEG 1 — ankomsten. Bara berättelse: regnet, mötet, arvet i siffror.
     Inget att fylla i. Storyn får rummet för sig själv. */
  if (steg === 1) {
    return html`
      <div class="helscen ljus">
        <div class="helscen-inre">
          <div class="scen-etikett">Gårdsplanen · förmiddag</div>
          <div class="helscen-rubrik mörk">Regnet över ${spel.stallnamn}</div>
          <div class="berättelse">
            <p>Regnet ligger tunt över gårdsplanen när du svänger in mellan de gamla
              stallbyggnaderna. Ovanför kontoret sitter en blekt skylt:
              <b> ${spel.stallnamn}</b>, grundat ${spel.gårdshistoria?.grundad}.
              En äldre tränare står vid stalldörren och ser dig komma.</p>
            <p>»Du hittade hit«, säger <b>${m?.namn}</b> och räcker fram en hand som
              hållit i tömmar i ett halvt liv. »Jag har bestämt mig — det här blir min
              sista säsong. Jag trodde gården skulle behöva säljas. Jag är glad att det
              blev du i stället.</p>
            <p>Tre veckor går du bredvid mig. Sedan är nyckelknippan din.«</p>
          </div>
          <div class="portrad" style=${{ margin: "6px 0" }}>
            <${Porträtt} id=${"mentor-" + könAvFörnamn(m?.namn)} reserv="mentor" namn=${m?.namn} färg="#6B4E1D" storlek=${52} />
            <div class="meta">${m?.namn}, ${m?.ålder} · ${m?.filosofitext}</div>
          </div>
          <div class="faktaruta">
            <div><span>Bästa häst</span>${spel.gårdshistoria?.bästaHäst}</div>
            <div><span>Största seger</span>${spel.gårdshistoria?.störstaSeger}</div>
            <div><span>Säsongsrekord</span>${spel.gårdshistoria?.rekordSegrarSäsong} segrar (${spel.gårdshistoria?.rekordÅr})</div>
          </div>
          <button class="btn steg-vidare" onClick=${() => gå(2)}>Ta i hand</button>
        </div>
      </div>`;
  }

  /* STEG 2 — DITT namn. Karriären är någons; pressen ska kunna citera
     dig, ligan lista dig och mentorn tilltala dig. */
  if (steg === 2) {
    return html`<${Steg}
      etikett="Beslut 1 av 4"
      rubrik="Vad heter du?"
      kan=${!!tränarnamn.trim()}
      knapp="Det är jag"
      påNästa=${() => gå(3)}
      påTillbaka=${() => gå(1)}
      barn=${html`
        <div class="helscen-ingress mörk">Namnet som ska stå i tränarligan,
          i ${TIDNINGSNAMN}s citat och en dag — kanske — på ett minneslopp.</div>
        <input class="startfält stor" value=${tränarnamn} maxlength="30"
          placeholder="För- och efternamn"
          onInput=${(e) => sättTränarnamn(e.target.value)} />
        <button class="btn liten sekundär" onClick=${() =>
          sättTränarnamn(FÖRSTAMANSNAMN[Math.floor(slump() * FÖRSTAMANSNAMN.length)])}>Slumpa</button>`}
    />`;
  }

  /* STEG 3 — stallnamnet. */
  if (steg === 3) {
    return html`<${Steg}
      etikett="Beslut 2 av 4"
      rubrik="Vad ska stallet heta?"
      kan=${!!namn.trim()}
      knapp="Så ska det heta"
      påNästa=${() => gå(4)}
      påTillbaka=${() => gå(2)}
      barn=${html`
        <div class="helscen-ingress mörk">Gården heter vad den heter tills du tar över.
          Men på kuskarnas anmälningar, i programbladen och en dag — kanske — i
          ${TIDNINGSNAMN}s rubriker: vad ska det stå?</div>
        <input class="startfält stor" value=${namn} maxlength="24"
          onInput=${(e) => sättNamn(e.target.value)} />
        <button class="btn liten sekundär" onClick=${() =>
          sättNamn(NAMNFÖRSLAG[Math.floor(slump() * NAMNFÖRSLAG.length)])}>Slumpa</button>`}
    />`;
  }

  /* STEG 4 — DRÄKTEN. Onboardingens identitetsmoment: en stor halvkropps-
     illustration som byts mjukt när man väljer, tumnaglar i samma stil
     under, och färgkombinationen som namn. Dräkten är det publiken känner
     igen på upploppet — valet ska kännas som att välja klubbfärger, inte
     som att bocka i en ikon. */
  if (steg === 4) {
    const vald = DRÄKTER.find((d) => d.id === dräkt) ?? DRÄKTER[0];
    return html`<${Steg}
      etikett="Beslut 3 av 4"
      rubrik="Stallets färger"
      knapp="Sy upp dräkten ›"
      påNästa=${() => gå(5)}
      påTillbaka=${() => gå(3)}
      barn=${html`
        <div class="helscen-ingress mörk">Dräkten följer stallet genom hela
          karriären. Den är det publiken känner igen på upploppet.</div>
        <div class="draktscen" key=${vald.id}>
          <${DräktIllustration} dräkt=${vald} storlek=${260} />
        </div>
        <div class="draktnamn">${vald.namn.replace("/", " / ").toUpperCase()}</div>
        <div class="färgstreck" aria-hidden="true">
          <span style=${{ background: vald.bg }} />
          <span style=${{ background: vald.fg }} />
        </div>
        <div class="draktrad premium">
          ${DRÄKTER.map((d) => html`
            <button key=${d.id} class=${"draktval" + (dräkt === d.id ? " vald" : "")}
              aria-label=${d.namn} title=${d.namn}
              onClick=${() => sättDräkt(d.id)}>
              <${DräktIllustration} dräkt=${d} storlek=${64} />
              ${dräkt === d.id && html`<span class="draktbock" aria-hidden="true">✓</span>`}
            </button>`)}
        </div>
        <div class="startnotis">Din stallfärg syns överallt i spelet och
          representerar ditt stall i varje lopp.</div>`}
    />`;
  }

  /* STEG 4 — hemmabanan, och dörren öppnas. */
  const små = Object.entries(BANOR).filter(([, b]) => b.storlek === 1);
  const öppna = () => uppdatera((s) => {
    s.stallnamn = namn.trim() || "Björkhaga";
    s.tränarnamn = tränarnamn.trim() || "Tränaren";
    s.dräkt = DRÄKTER.find((d) => d.id === dräkt) ?? DRÄKTER[0];
    s.hemmabana = bana;
    s.uppstartKlar = true;
    skrivPress(s, `${s.prolog.mentor.namn} går i pension — förstamannen tar över ${s.stallnamn}`,
      `${TIDNINGSNAMN} om generationsskiftet vid ` + BANOR[bana].namn, "neutral");
    /* Generationsskiftet som Travbladets förstasida — spelarens första
       tidningssida av många. Den möter en direkt innanför dörren. */
    köScen(s, {
      betydelse: 80, stil: "tidning", bild: "gard-hero",
      signatur: JOURNALISTER.krönikör,
      etikett: `${BANOR[bana].namn} · GENERATIONSSKIFTE`,
      rubrik: `${s.prolog.mentor.namn.toUpperCase()} GÅR I PENSION`,
      ingress: `Efter mer än trettio år vid tömmarna lämnar ${s.prolog.mentor.namn} travsporten. `
        + `${s.stallnamn} vid ${BANOR[bana].namn} tas över av gårdens förstaman — en okänd i tabellerna, `
        + `men den gamle tränaren är trygg i valet.`,
      brödtext: [
        `»Jag trodde länge att allt skulle behöva säljas«, säger ${s.prolog.mentor.namn}. `
          + `»Nu vet jag att stallet lever vidare. Det är mer än jag vågade hoppas.«`,
        `Tre veckor återstår av säsongen. Sedan byter nyckelknippan hand.`,
      ],
      fakta: [
        { etikett: "Gården", värde: s.stallnamn },
        { etikett: "Grundad", värde: String(s.gårdshistoria?.grundad ?? "") },
        { etikett: "Största seger", värde: s.gårdshistoria?.störstaSeger ?? "" },
        { etikett: "Hemmabana", värde: BANOR[bana].namn },
      ],
      citat: "Tre veckor går du bredvid mig. Sedan är nyckelknippan din.",
      citatVem: s.prolog.mentor.namn,
    });
  });

  return html`<${Steg}
    etikett="Beslut 4 av 4"
    rubrik="Hemmabanan"
    kan=${!!bana}
    knapp="Öppna stallet"
    påNästa=${öppna}
    påTillbaka=${() => gå(4)}
    barn=${html`
      <div class="helscen-ingress mörk">Bara de små banorna har plats för en okänd
        tränare — de stora får man förtjäna. Hemma slipper du resekostnader och
        hemmapubliken ger extra prispengar.</div>
      ${små.map(([id, b]) => html`
        <button key=${id} class=${"banval" + (bana === id ? " vald" : "")}
          onClick=${() => sättBana(id)}>
          <${Bild} id=${"bana-" + id} reserv="bana-kvall" alt="" klass="banval-bild" fallback=${null} />
          <div class="namn">${b.namn}</div>
          <div class="meta">${b.karaktär}</div>
          <div class="meta">Upplopp ${b.upplopp} m${b.openStretch ? " · öppet innerspår" : ""}</div>
        </button>`)}`}
  />`;
}
