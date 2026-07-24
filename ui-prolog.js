/**
 * PROLOGENS SCENER
 *
 * Mentorkortet följer spelaren genom säsong 0. Övertagandet är prologens
 * final — gårdsnamnet, trotjänaren, ekonomin — och rekryteringen av egen
 * förstaman är säsong 1:s första stora beslut. Scenerna skrivs av det som
 * hände: samma text finns inte i två karriärer.
 */
import { useState } from "preact/hooks";
import { html } from "htm/preact";
import { kr, klamp } from "./engine-util.js";
import { mentorOmVeckan, mentorOmTräning, avskedstext, ROLLTEXT } from "./engine-prolog.js";
import { förstamanskandidater } from "./engine-forstaman.js";
import { registreraHändelse } from "./engine-handelser.js";
import { Rad } from "./ui-delar.js";

/** Mentorns kort i stallet under säsong 0. */
export function Mentorkort({ spel }) {
  if (!spel.prolog?.aktiv) return null;
  const m = spel.prolog.mentor;
  const vecko = mentorOmVeckan(spel);
  const träningsrepliker = spel.stall.map((h) => mentorOmTräning(spel, h)).filter(Boolean);
  return html`
    <div class="kort mentor">
      <div class="meta">${m.namn}, ${m.ålder} · ${m.filosofitext} · går i pension efter säsongen</div>
      <div class="meta">Största seger: ${m.störstaSeger} med ${m.stjärnhäst}</div>
      ${vecko && html`<div class="logg">${vecko}</div>`}
      ${träningsrepliker.slice(0, 2).map((t, i) => html`<div class="logg" key=${i}>${t}</div>`)}
      <div class="logg">Hästarna: ${spel.stall.map((h) => `${h.namn} — ${ROLLTEXT[h.roll] ?? "häst i träning"}`).join(" · ")}</div>
    </div>`;
}

/** Övertagandet — prologens final med val som följer med in i karriären. */
export function ÖvertagandeVy({ spel, uppdatera }) {
  const [namnval, sättNamnval] = useState("behåll");
  const [nyttNamn, sättNyttNamn] = useState("");
  const [trotjänare, sättTrotjänare] = useState("stannar");
  const trot = spel.stall.find((h) => h.roll === "trotjänaren");
  const vardaghäst = spel.stall.find((h) => h.roll === "vardagshästen");
  const [sälj, sättSälj] = useState(false);

  const taÖver = () => uppdatera((s) => {
    if (namnval === "nytt" && nyttNamn.trim()) s.stallnamn = nyttNamn.trim();
    if (namnval === "kombinera" && nyttNamn.trim()) s.stallnamn = `${s.stallnamn} & ${nyttNamn.trim()}`;
    const t = s.stall.find((h) => h.roll === "trotjänaren");
    if (t && trotjänare === "pension") {
      s.stall = s.stall.filter((h) => h !== t);
      s.gårdsveteran = t.namn;
      registreraHändelse(s, { typ: "pensionering", betydelse: 40,
        aktörer: { häst: t.namn }, data: { text: `${t.namn} pensioneras och stannar på gården.` } });
    }
    const v = s.stall.find((h) => h.roll === "vardagshästen");
    if (v && sälj) { s.stall = s.stall.filter((h) => h !== v); s.kassa += 60000; }
    s.säsong = 1; s.vecka = 1; s.säsongAvslutad = null;
    s.prolog.övertagen = true;
    registreraHändelse(s, { typ: "övertagande", betydelse: 80,
      data: { text: `Tog över gården efter ${s.prolog.mentor.namn}.` } });
  });

  return html`
    <div class="sasong">
      <div class="scen-etikett">Säsong 0 är slut</div>
      <div class="scen-rubrik" style=${{ fontSize: "34px" }}>Ett nytt kapitel</div>
      <div class="kort mentor" style=${{ textAlign: "left" }}><div class="logg">${avskedstext(spel)}</div></div>

      <div class="kort">
        <div class="namn">Gårdens namn</div>
        <div class="meta">Förvalta arvet eller bygga något eget?</div>
        <div class="chips">
          ${[["behåll", `Behåll ${spel.stallnamn}`], ["nytt", "Döp om"], ["kombinera", "Kombinera"]].map(([id, t]) => html`
            <button key=${id} class="chip" aria-pressed=${namnval === id} onClick=${() => sättNamnval(id)}>${t}</button>`)}
        </div>
        ${namnval !== "behåll" && html`<input class="startfält" placeholder="Nytt namn"
          value=${nyttNamn} maxlength="24" onInput=${(e) => sättNyttNamn(e.target.value)} />`}
      </div>

      ${trot && html`
        <div class="kort">
          <div class="namn">${trot.namn}, ${trot.ålder} år</div>
          <div class="meta">${ROLLTEXT.trotjänaren} — ${spel.prolog.mentor.namn}s hjärta</div>
          <div class="chips">
            <button class="chip" aria-pressed=${trotjänare === "stannar"} onClick=${() => sättTrotjänare("stannar")}>En säsong till</button>
            <button class="chip" aria-pressed=${trotjänare === "pension"} onClick=${() => sättTrotjänare("pension")}>Pensionera — stannar på gården</button>
          </div>
        </div>`}

      ${vardaghäst && html`
        <div class="kort">
          <div class="namn">Ekonomin</div>
          <div class="meta">Kassan: ${kr(spel.kassa)} kr. En köpare finns till ${vardaghäst.namn}.</div>
          <div class="chips">
            <button class="chip" aria-pressed=${!sälj} onClick=${() => sättSälj(false)}>Behåll hästen</button>
            <button class="chip" aria-pressed=${sälj} onClick=${() => sättSälj(true)}>Sälj för 60 000 kr</button>
          </div>
        </div>`}

      <button class="btn" onClick=${taÖver}>Ta över gården</button>
    </div>`;
}

/** Rekryteringen av egen förstaman — säsong 1:s första beslut. */
export function FörstamansvalVy({ spel, uppdatera }) {
  const [kandidater] = useState(() => förstamanskandidater());
  const [vald, sättVald] = useState(null);
  return html`
    <div class="sasong">
      <div class="scen-etikett">Säsong 1 · vecka 1</div>
      <div class="scen-rubrik" style=${{ fontSize: "30px" }}>Vem ska bygga stallet med dig?</div>
      <div class="kort"><div class="logg">Gården är din — men ingen driver ett travstall ensam.
        Tre har sökt jobbet. Valet färgar råden genom hela karriären.</div></div>
      ${kandidater.map((k) => html`
        <button key=${k.profil} class=${"banval" + (vald === k.profil ? " vald" : "")}
          onClick=${() => sättVald(k.profil)}>
          <div class="namn">${k.namn}, ${k.ålder}</div>
          <div class="meta">${k.profil} — ${k.profiltext} · ${kr(k.lön)} kr/vecka</div>
          <div class="meta">${k.pitch}</div>
        </button>`)}
      <button class="btn" disabled=${!vald} onClick=${() => uppdatera((s) => {
        const k = kandidater.find((x) => x.profil === vald);
        s.förstaman = { namn: k.namn, profil: k.profil, profiltext: k.profiltext, lön: k.lön };
        registreraHändelse(s, { typ: "förstaman_anställd", betydelse: 45,
          aktörer: { förstaman: k.namn }, data: { profil: k.profil } });
      })}>Anställ</button>
    </div>`;
}
