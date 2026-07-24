/**
 * SPELSTARTEN
 *
 * Tre val innan stalldörren öppnas: namn, dräkt och hemmabana. Bara de
 * små banorna har plats för en okänd tränare — de stora får man förtjäna.
 * Valen är på riktigt: dräkten följer stallet genom karriären och
 * hemmabanan avgör var man slipper resekostnader och får hemmapubliken.
 */
import { useState } from "preact/hooks";
import { html } from "htm/preact";
import { slump } from "./engine-util.js";
import { BANOR, DRÄKTER } from "./data-namnpaket.js";
import { skrivPress } from "./engine-vecka.js";
import { Dräkt, Bild, GårdIRegn, Porträtt } from "./ui-grafik.js";

const NAMNFÖRSLAG = [
  "Björkhaga", "Stall Norrsken", "Ekbackens Trav", "Stall Framåt",
  "Lyckans Stall", "Stall Vintersol", "Granlidens Trav", "Stall Fyrklövern",
  "Månskensstallet", "Stall Rimfrost",
];

export default function StartVy({ spel, uppdatera }) {
  const m = spel?.prolog?.mentor;
  /* ALLA hooks före första möjliga return — preact kräver samma
     hookordning i varje rendering, annars kraschar den. */
  const [anlänt, sättAnlänt] = useState(false);
  const [namn, sättNamn] = useState("Björkhaga");
  const [dräkt, sättDräkt] = useState(DRÄKTER[0].id);
  const [bana, sättBana] = useState(null);

  /* Pressuppslaget — spelet börjar som en berättelse, inte ett formulär. */
  if (!anlänt) {
    return html`
      <div class="scen" style=${{ marginTop: "16px" }}>
        <${Bild} id="gard-hero" alt="Gården i morgonregn"
          fallback=${html`<${GårdIRegn} namn=${spel?.stallnamn ?? ""} />`} />
        <div class="scen-etikett">Säsong 0 · vecka 18</div>
        <div class="scen-rubrik">En gård väntar på sin arvtagare</div>
        <div class="ingress">Efter mer än trettio år lämnar ${m?.namn ?? "gårdens tränare"} sporten.
          Under säsongens sista veckor ska du arbeta vid ${m?.namn?.includes("hild") || m?.namn?.includes("erit") ? "hennes" : "hans"} sida —
          innan ansvaret blir ditt.</div>
        <div class="portrad" style=${{ margin: "10px 0 2px" }}>
          <${Porträtt} id="mentor" namn=${m?.namn} färg="#6B4E1D" storlek=${52} />
        </div>
        <div class="citat">»Jag trodde länge att allt skulle behöva säljas.«
          <span class="citat-vem">${m?.namn}, ${m?.ålder} · ${m?.filosofitext}</span></div>
        <div class="meta">${spel?.stallnamn}, grundat ${spel?.gårdshistoria?.grundad} ·
          största seger: ${spel?.gårdshistoria?.störstaSeger} med ${spel?.gårdshistoria?.bästaHäst}</div>
        <button class="btn" onClick=${() => sättAnlänt(true)}>Anländ till gården</button>
      </div>`;
  }
  const små = Object.entries(BANOR).filter(([, b]) => b.storlek === 1);

  const öppna = () => uppdatera((s) => {
    s.stallnamn = namn.trim() || "Björkhaga";
    s.dräkt = DRÄKTER.find((d) => d.id === dräkt) ?? DRÄKTER[0];
    s.hemmabana = bana;
    s.uppstartKlar = true;
    skrivPress(s, `${s.prolog.mentor.namn} går i pension — förstamannen tar över ${s.stallnamn}`,
      "Travbladet om generationsskiftet vid " + BANOR[bana].namn, "neutral");
  });

  return html`
    <div class="startvy">
      ${m && html`
        <div class="kort mentor">
          <div class="logg">Regnet ligger tunt över gårdsplanen när du svänger in mellan de
            gamla stallbyggnaderna. Ovanför kontoret sitter en blekt skylt: <b>${spel.stallnamn}</b>,
            grundat ${spel.gårdshistoria?.grundad}. En äldre tränare står vid stalldörren.</div>
          <div class="logg">»Du hittade hit«, säger <b>${m.namn}</b>. »Jag har bestämt mig — det här blir
            min sista säsong. Jag trodde gården skulle behöva säljas. Jag är glad att det blev du i stället.
            Tre veckor går du bredvid mig. Sedan är nyckelknippan din.«</div>
          <div class="meta">Bästa häst genom åren: ${spel.gårdshistoria?.bästaHäst} ·
            största seger: ${spel.gårdshistoria?.störstaSeger} ·
            säsongsrekord: ${spel.gårdshistoria?.rekordSegrarSäsong} segrar (${spel.gårdshistoria?.rekordÅr})</div>
        </div>`}
      <div class="kort">
        <div class="meta">Ditt framtida stallnamn — gården heter vad den heter tills du tar över</div>
        <div class="namn">Vad ska det heta?</div>
        <input class="startfält" value=${namn} maxlength="24"
          onInput=${(e) => sättNamn(e.target.value)} />
        <button class="btn liten sekundär" onClick=${() =>
          sättNamn(NAMNFÖRSLAG[Math.floor(slump() * NAMNFÖRSLAG.length)])}>Slumpa</button>
      </div>

      <div class="kort">
        <div class="meta">Stallets färger</div>
        <div class="namn">Dräkten</div>
        <div class="draktrad">
          ${DRÄKTER.map((d) => html`
            <button key=${d.id} class=${"drakt" + (dräkt === d.id ? " vald" : "")}
              aria-label=${d.namn} title=${d.namn}
              onClick=${() => sättDräkt(d.id)}><${Dräkt} dräkt=${d} storlek=${38} /></button>`)}
        </div>
        <div class="meta">${DRÄKTER.find((d) => d.id === dräkt)?.namn}</div>
      </div>

      <div class="kort">
        <div class="meta">Bara de små banorna har plats för en okänd tränare</div>
        <div class="namn">Hemmabana</div>
        ${små.map(([id, b]) => html`
          <button key=${id} class=${"banval" + (bana === id ? " vald" : "")}
            onClick=${() => sättBana(id)}>
            <div class="namn">${b.namn}</div>
            <div class="meta">${b.karaktär}</div>
            <div class="meta">Upplopp ${b.upplopp} m${b.openStretch ? " · öppet innerspår" : ""}</div>
          </button>`)}
        <div class="logg">Hemma slipper du resekostnader och hemmapubliken ger extra
          prispengar. Med renommé kommer erbjudanden från de större banorna.</div>
      </div>

      <button class="btn" disabled=${!bana} onClick=${öppna}>Öppna stallet</button>
    </div>`;
}
