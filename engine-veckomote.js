/**
 * VECKOMÖTET (v105, utvecklingsplanen 20.4 — FM-punkt 6)
 *
 * Teds dokument: "Detta saknar nästan alla managerspel. Varje vecka
 * säger förstamannen: veckans genomgång — ekonomi, form, kommande
 * starter, personal, sponsorer, problem, rekommendationer. Precis som
 * i ett riktigt stall."
 *
 * Genomgången är måndagens FÄSTA rapport i inkorgen, skriven i
 * förstamannens egen röst (profilen färgar inledningen: fostraren,
 * pådrivaren, taktikern) med RIKTIGA siffror ur samma motorer som
 * resten av spelet läser — vägvisarens netto, propositionsmotorns
 * loppläge, sponsormotorns avtal. Långtexten är byggd för v103:s
 * förhand och helskärm: styckad prosa, en sektion per ämne, bara
 * sektioner med något att säga.
 *
 * Ren derivation — mötet ljuger aldrig om spelet, för det ÄR spelet.
 */
import { kr } from "./engine-util.js";
import { veckonetto } from "./engine-vagvisare.js";
import { loppläge, bedömningsnivå } from "./engine-proposition.js";
import { veckansLopp } from "./data-kalender.js";

const INLEDNING = {
  fostrare: "Kaffet är i, hästarna är ute. Lugnt och metodiskt nu — här är läget.",
  pådrivare: "Ingen lång sittning i dag — det finns jobb att göra. Läget:",
  taktiker: "Jag har läst propositionerna två gånger och räknat en tredje. Läget:",
};

/**
 * Veckans genomgång som inkorgshändelsens innehåll:
 * { rubrik, text (ingress), lång (styckad prosa) }.
 */
export function veckansGenomgång(spel) {
  const fm = spel.förstaman;
  if (!fm) return null;
  const stycken = [];
  const vecka = Math.min(spel.vecka, spel.veckor);

  stycken.push(INLEDNING[fm.profil] ?? INLEDNING.fostrare);

  /* Ekonomin — kassan, nettot, och räckvidden när det lutar fel. */
  const n = veckonetto(spel);
  if (n.netto < 0) {
    const veckor = Math.floor((spel.kassa ?? 0) / -n.netto);
    stycken.push(`EKONOMI\nKassan står i ${kr(spel.kassa ?? 0)} kr och veckan går ${kr(-n.netto)} kr back. I den takten räcker pengarna ${veckor} ${veckor === 1 ? "vecka" : "veckor"} — ${veckor < 5 ? "det behöver vändas nu, inte sen" : "inte akut, men håll ögonen på det"}.`);
  } else {
    stycken.push(`EKONOMI\nKassan står i ${kr(spel.kassa ?? 0)} kr och veckan går ${kr(n.netto)} kr plus. Inga larm från mig.`);
  }

  /* Formen — bäst, sämst och de som står stilla. */
  const friska = (spel.stall ?? []).filter((h) => h.skada === 0);
  const skadade = (spel.stall ?? []).filter((h) => h.skada > 0);
  if (friska.length > 0) {
    const iForm = [...friska].sort((a, b) => (b.form ?? 0) - (a.form ?? 0));
    const bäst = iForm[0], sämst = iForm[iForm.length - 1];
    let rad = `FORMEN\n${bäst.namn} är stallets vassaste just nu (form ${bäst.form}).`;
    if (friska.length > 1 && (sämst.form ?? 0) < 45) {
      rad += ` ${sämst.namn} hänger inte med (${sämst.form}) — vila eller nytt upplägg, vi tar det på stallmötet.`;
    }
    stycken.push(rad);
  }

  /* Veckans starter — anmälningsläget och det bästa öppna läget. */
  const startklara = friska.filter((h) => h.senasteStartVecka !== spel.vecka);
  const anmälda = (spel.anmälningar ?? []).length;
  if (startklara.length > 0) {
    const nivå = bedömningsnivå(spel);
    const veckans = veckansLopp(spel.vecka);
    let bästa = null;
    startklara.forEach((h) => veckans.forEach((l) => {
      const läge = loppläge(h, l, nivå);
      if (läge.status === "rekommenderad" && (!bästa || (h.form ?? 0) > (bästa.h.form ?? 0)))
        bästa = { h, l };
    }));
    let rad = anmälda > 0
      ? `STARTERNA\n${anmälda} ${anmälda === 1 ? "anmälan är inne" : "anmälningar är inne"} — beskeden kommer onsdag.`
      : `STARTERNA\nInget inskickat ännu.`;
    if (bästa && anmälda === 0) {
      rad += ` Mitt förslag står i loppfliken: ${bästa.h.namn} i ${bästa.l.kortnamn || bästa.l.namn} — hon ligger rätt i klassen.`;
    }
    stycken.push(rad);
  }

  /* Sponsorläget — kraven och klockan. */
  (spel.sponsorer ?? []).forEach((a) => {
    if (a.krav && a.veckorKvar !== undefined && a.veckorKvar <= 4) {
      stycken.push(`SPONSORN\n${a.namn} utvärderar om ${a.veckorKvar} ${a.veckorKvar === 1 ? "vecka" : "veckor"} — kravet står på ${a.krav.text}, läget är ${a.krav.nu ?? 0} av ${a.krav.mål}.`);
    }
  });

  /* Problemen — det som inte får glömmas. */
  const problem = [];
  if (skadade.length > 0) problem.push(`${skadade.map((h) => `${h.namn} (${h.skada} v)`).join(", ")} på skadelistan`);
  const suraÄgare = (spel.ägare ?? []).filter((ä) => (ä.relation ?? 50) < 30);
  if (suraÄgare.length > 0) problem.push(`${suraÄgare.length} ${suraÄgare.length === 1 ? "hästägare" : "hästägare"} som behöver ett samtal`);
  if (problem.length > 0) stycken.push(`ATT HÅLLA I HUVUDET\n${problem.join(" · ")}.`);

  return {
    rubrik: `Veckans genomgång — vecka ${vecka}`,
    text: stycken[1] ?? stycken[0],
    lång: stycken.join("\n\n"),
  };
}
