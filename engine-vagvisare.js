/**
 * VÄGVISAREN (v90, kap 16)
 *
 * Öppen värld med tydlig riktning: spelaren ska aldrig känna sig låst,
 * men heller aldrig övergiven. Två frågor ska alltid gå att besvara —
 * VAD KAN JAG GÖRA? och VAD BÖR JAG GÖRA HÄRNÄST? Den här modulen är
 * svaret på den andra: rekommendationer och milstolpar, härledda ur
 * spelläget, aldrig påhittade — och aldrig tvingande. Öppna mål, inte
 * uppdrag: inget här ger belöning för att "bockas av".
 *
 * NÄSTA STEG (16.1, 16.5): veckans naturliga handlingar, sorterade
 * efter angelägenhet (akut → uppmärksamma → lugnt) så att den första
 * raden alltid ÄR veckans viktigaste. Logiken bodde tidigare i hemvyn;
 * hit flyttad för att kunna växa och provas — vyer renderar, motorer
 * härleder.
 *
 * LÅNGSIKTIGT (16.2): de två-tre NÄRMASTE onådda milstolparna med
 * verklig progress ur spelets siffror. Naturliga riktmärken över
 * säsonger — tio hästar i träning, miljonen, huvudsponsorn — inte en
 * kravlista.
 */
import { träningsråd } from "./engine-forstaman.js";
import { gåraugifter, boxplats } from "./engine-gard.js";
import { ARVODE_PER_VECKA } from "./data-agare.js";
import { kravläge } from "./engine-sponsor.js";
import { BANOR } from "./data-namnpaket.js";

const DRIFT_PER_HÄST = 3200;

/**
 * Veckans förutsägbara netto — samma poster som körVecka bokför.
 * Hemmet, Kontoret och vägvisaren läser alla härifrån (flyttad från
 * ui-kontorvy i v90: ekonomiläsning är motorarbete, inte vyarbete).
 */
export function veckonetto(spel) {
  const externa = spel.stall.filter((h) => h.ägare).length;
  const sponsor = (spel.sponsorer ?? []).reduce((a, s) => a + s.perVecka, 0);
  const rabatt = (spel.sponsorer ?? []).some((a) => a.förmån?.typ === "foder")
    ? 400 * spel.stall.length : 0;
  const intäkter = externa * ARVODE_PER_VECKA + sponsor;
  const kostnader = spel.stall.length * DRIFT_PER_HÄST - rabatt + gåraugifter(spel);
  return { intäkter, kostnader, netto: intäkter - kostnader, sponsor };
}

/**
 * NÄSTA STEG. Varje rad: { text, flik, akut?, ton? }. Sorteras akut
 * först, sedan gul, sedan lugnt — första raden är veckans viktigaste.
 */
export function nästaSteg(spel) {
  const fm = spel.förstaman;
  const startklara = spel.stall.filter((h) => h.skada === 0 && h.senasteStartVecka !== spel.vecka).length;
  const skadade = spel.stall.filter((h) => h.skada > 0).length;
  const avviker = fm ? spel.stall.filter((h) => h.skada === 0 &&
    h.träning !== träningsråd(fm, h).träning).length : 0;
  const n = veckonetto(spel);
  const kassaveckor = n.netto < 0 ? Math.floor(spel.kassa / -n.netto) : 99;
  const surÄgare = Object.entries(spel.ägarrelationer ?? {})
    .find(([namn, r]) => r.relation < 35 && spel.stall.some((h) => h.ägare === namn));
  const löstSponsorkrav = spel.vecka >= spel.veckor - 4
    ? (spel.sponsorer ?? []).find((a) => !kravläge(a).klar) : null;
  const toppform = [...spel.stall].filter((h) => h.skada === 0 && h.form >= 66
    && h.senasteStartVecka !== spel.vecka).sort((a, b) => b.form - a.form)[0];

  const rader = [
    spel.prolog?.övertagen && !fm &&
      { text: "Rekrytera din förstaman", akut: true, flik: "stall" },
    spel.banerbjudande &&
      { text: `${BANOR[spel.banerbjudande.banaId]?.namn} vill ha stallet — svara på erbjudandet`, akut: true, flik: "stall" },
    spel.erbjudande &&
      { text: `${spel.erbjudande.ägare} vill lämna ${spel.erbjudande.namn} i träning`, akut: true, flik: "stall" },
    spel.inbjudan?.vecka === spel.vecka &&
      { text: "Inbjudningsloppet gäller bara denna vecka", akut: true, flik: "lopp" },
    surÄgare &&
      { text: `${surÄgare[0]} är missnöjd — boka ett möte på Kontoret`, akut: true, flik: "mer" },
    kassaveckor < 8 &&
      { text: `Kassan räcker ${kassaveckor} veckor — fler externa hästar skulle förbättra kassaflödet`,
        akut: kassaveckor < 4, ton: kassaveckor < 4 ? undefined : "gul", flik: "mer" },
    (spel.sponsorerbjudanden ?? []).length > 0 &&
      { text: `${spel.sponsorerbjudanden[0].namn} vill sponsra stallet — svara på Kontoret`, ton: "gul", flik: "mer" },
    löstSponsorkrav && (() => {
      const l = kravläge(löstSponsorkrav);
      return { text: `Sponsorkravet hänger löst: ${l.text} — ${l.mål - l.nu} kvar`, ton: "gul", flik: "lopp" };
    })(),
    avviker > 0 &&
      { text: `${fm.namn.split(" ")[0]} vill ändra träningen för ${avviker} ${avviker === 1 ? "häst" : "hästar"}`, ton: "gul", flik: "stall" },
    toppform &&
      { text: `${toppform.namn} är i form (${Math.round(toppform.form)}) — planera nästa start`, flik: "lopp" },
    startklara > 0 && !toppform &&
      { text: `${startklara} ${startklara === 1 ? "häst är" : "hästar är"} startklara — veckans anmälan väntar`, flik: "lopp" },
    skadade > 0 &&
      { text: `${skadade} ${skadade === 1 ? "häst" : "hästar"} på skadelistan`, flik: "stall" },
    boxplats(spel) === 0 &&
      { text: "Stallet är fullt — det kan vara dags att bygga ut", flik: "mer" },
  ].filter(Boolean);
  /* Angelägnast först — så första raden alltid är veckans viktigaste. */
  const vikt = (u) => (u.akut ? 0 : u.ton === "gul" ? 1 : 2);
  return rader.sort((a, b) => vikt(a) - vikt(b));
}

/**
 * LÅNGSIKTIGT (16.2). Milstolparna prövas i stigande svårighet; de två
 * närmaste ONÅDDA visas, med progress ur verkliga siffror. Uppnådda
 * försvinner tyst — riktmärken, inte troféer (troférummet finns redan).
 */
export function långsiktigt(spel) {
  const relationer = Object.values(spel.ägarrelationer ?? {});
  const nöjda = relationer.filter((r) => r.relation >= 75).length;
  const harHuvudsponsor = (spel.sponsorer ?? []).some((a) => a.typId === "nationell" || a.typId === "regional");
  const kandidater = [
    { mål: "Sex hästar i träning", nu: spel.stall.length, av: 6 },
    { mål: "En halv miljon insprunget", nu: spel.intjänat, av: 500000, kr: true },
    { mål: "Tio hästar i träning", nu: spel.stall.length, av: 10 },
    { mål: "Teckna en större sponsor", nu: harHuvudsponsor ? 1 : Math.min(spel.renommé / 55, 0.95), av: 1,
      not: "renommét öppnar dörren" },
    { mål: "Miljonen insprunget", nu: spel.intjänat, av: 1000000, kr: true },
    { mål: "Tre ägare med högsta förtroende", nu: nöjda, av: 3 },
    { mål: "Fem miljoner insprunget", nu: spel.intjänat, av: 5000000, kr: true },
  ];
  return kandidater
    .filter((k) => k.nu < k.av)
    .slice(0, 2)
    .map((k) => ({ ...k, andel: Math.max(0, Math.min(1, k.nu / k.av)) }));
}
