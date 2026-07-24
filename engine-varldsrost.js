/**
 * VÄRLDENS RÖST — Sfären som handlar om fler än dig
 *
 * En tidning som bara skriver om ett stall är ett medlemsblad. Världens
 * lopp körs redan (körVärldensVecka) och handeln pågår — men ligan,
 * segersviterna, miljongränserna och uppstickarna gick tysta förbi.
 * Här får de sina notiser, så att Sfären känns som en sport där du är
 * EN aktör, inte solen allt kretsar kring.
 *
 * Allt throttlas hårt: en ligarubrik per säsong, sviter från fyra raka,
 * miljonnotiser en gång per häst. Världen ska sorla i bakgrunden, inte
 * dränka spelarens egna nyheter.
 *
 * DESIGNGRÄNS: ren läsning av världen som redan simulerats. Ingen slump
 * som påverkar lopp, aldrig loppmotorn.
 */
import { plock } from "./engine-util.js";
import { tränarliga } from "./engine-varld.js";
import { JOURNALISTER } from "./data-namnpaket.js";

export function världensRöst(spel, skrivPress) {
  const värld = spel.värld;
  if (!värld) return;

  /* LIGAN. Efter halva säsongen, en gång per säsong: leder någon stort,
     eller är det dött lopp i toppen? Spelaren själv lämnas åt sina egna
     rubriker — det här är världens. */
  if (spel.vecka >= 10 && spel.ligarubrikSäsong !== spel.säsong) {
    const liga = tränarliga(spel).filter((r) => !r.du);
    if (liga.length >= 2 && liga[0].insprunget > 0) {
      spel.ligarubrikSäsong = spel.säsong;
      const [etta, tvåa] = liga;
      if (etta.insprunget > tvåa.insprunget * 1.5) {
        skrivPress(spel, plock([
          `${etta.namn} drar ifrån i tränarligan`,
          `Ointagligt? ${etta.namn} rycker i ligatoppen`,
        ]), `${etta.tränare} har halva fältet bakom sig redan i vecka ${spel.vecka}.`,
          "neutral", null, 0, JOURNALISTER.siffror);
      } else if (etta.insprunget < tvåa.insprunget * 1.15) {
        skrivPress(spel, `Rysare i ligatoppen: ${etta.namn} mot ${tvåa.namn}`,
          `Marginalerna är hårfina inför säsongens avslutning.`,
          "neutral", null, 0, JOURNALISTER.siffror);
      }
    }
  }

  /* SEGERSVITEN. I en värld som kör sex lopp i veckan är fyra raka
     vanligare än det låter — första mätningen gav en svitnotis varannan
     vecka, och då är sviten ingen följetong utan brus. FEM raka är
     tröskeln, och högst en världsföljetong var tredje vecka (delas med
     miljonen nedan). */
  const global = spel.vecka + (spel.säsong ?? 1) * 100;
  const fårFöljetong = (spel.världsföljetong ?? -9) <= global - 3;
  const svithäst = fårFöljetong ? värld.hästar
    .filter((h) => (h.svit || 0) >= 5 && h.svit !== h.svitNoterad)
    .sort((a, b) => (b.svit || 0) - (a.svit || 0))[0] : null;
  if (svithäst) {
    spel.världsföljetong = global;
    svithäst.svitNoterad = svithäst.svit;
    const st = värld.stall.find((x) => x.id === svithäst.stallId);
    skrivPress(spel, plock([
      `${svithäst.namn} tog ${ordning(svithäst.svit)} raka`,
      `Ostoppbar? ${svithäst.namn} vann igen — ${svithäst.svit} i följd`,
    ]), st ? `${st.namn} har hittat något alldeles särskilt.` : `Sviten talar sitt eget språk.`,
      "neutral", null, 0, JOURNALISTER.nyheter);
  }

  /* MILJONEN. Världens hästar passerar den i strid ström — meriterna
     byggs ju bakåt redan vid världsskapandet. EN miljonnotis per säsong
     räcker: den första, resten markeras tyst så kön inte växer. */
  värld.hästar.forEach((h) => {
    if ((h.intjänat || 0) >= 1000000 && !h.miljonNoterad && spel.miljonrubrikSäsong === spel.säsong)
      h.miljonNoterad = true;   // tyst — säsongens rubrik är tagen
  });
  const miljonär = spel.miljonrubrikSäsong !== spel.säsong && fårFöljetong
    ? värld.hästar.find((h) => (h.intjänat || 0) >= 1000000 && !h.miljonNoterad) : null;
  if (miljonär) {
    miljonär.miljonNoterad = true;
    spel.miljonrubrikSäsong = spel.säsong;
    spel.världsföljetong = global;
    const st = värld.stall.find((x) => x.id === miljonär.stallId);
    skrivPress(spel, `${miljonär.namn} ny miljonär`,
      `${st?.namn ?? "Stallet"} fostrar sin ${st?.exFörstaman ? "första" : "senaste"} miljonhäst.`,
      "neutral", null, 0, JOURNALISTER.siffror);
  }

  /* UPPSTICKAREN. Exförstamansstallets frammarsch är en följetong med
     personlig udd — men bara vid verkliga kliv (var femte seger). */
  for (const st of värld.stall.filter((x) => x.exFörstaman)) {
    if ((st.segrar || 0) >= 5 && st.segrar % 5 === 0 && st.segrarNoterade !== st.segrar) {
      st.segrarNoterade = st.segrar;
      skrivPress(spel, `${st.namn} vinner igen — uppstickaren växer`,
        `${st.tränare} har tagit ${st.segrar} segrar i år. Alla vet var hen lärde sig.`,
        "neutral", null, 0, JOURNALISTER.nyheter);
    }
  }
}

const ordning = (n) => ({ 4: "fjärde", 5: "femte", 6: "sjätte", 7: "sjunde",
  8: "åttonde", 9: "nionde", 10: "tionde" }[n] ?? `${n}:e`);
