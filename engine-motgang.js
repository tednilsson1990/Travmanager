/**
 * MOTGÅNGEN — den halva av karriären som också ska berättas
 *
 * Fram till v65 tändes nästan all berättelse av framgång: segrar,
 * rekord, arv. Men slutmålets karriär ("den osäkra unghästen blev
 * stallets första miljonär") är en berättelse om motgångar som
 * ÖVERVANNS — och då måste motgångarna först få finnas. Fyra bågar:
 *
 *   STJÄRNANS SKADA    en häst som betyder något går sönder → nyhet
 *   FAVORITFALLET      storfavorit som föll i storlopp → nyhet
 *   FORMSVACKAN        tre raka utanför pall för en hypad häst → fråga
 *   COMEBACKEN         stjärnan som vinner direkt efter skadan → nyhet
 *
 * Trösklarna är höga med flit: en vardagshäst som ömmar en vecka är en
 * loggrad, inte en tidningssida. Motgången blir nyhet först när hästen
 * hunnit BETYDA något — annars devalveras både sidorna och sorgen.
 *
 * DESIGNGRÄNS: allt här LÄSER vad som redan hänt (skadan är satt,
 * loppet är kört). Ingen slump som påverkar spelet, aldrig loppmotorn.
 */
import { klamp } from "./engine-util.js";
import { registreraHändelse, påHändelse } from "./engine-handelser.js";
import { köScen, registreraValeffekt } from "./engine-scener.js";
import { JOURNALISTER, TIDNINGSNAMN } from "./data-namnpaket.js";
import { bildvariant } from "./data-bilder.js";

/** Betyder hästen något för läsarna? Meriterna eller hypen avgör. */
const ärStjärna = (h) =>
  (h.segrar || 0) >= 4 || (h.intjänat || 0) >= 500000 || (h.hype || 0) >= 55
  || (h.milstolpar || []).some((m) => m.typ === "storloppsseger");

/* ------------------------------------------------------------------ */
/* Stjärnans skada                                                     */
/* ------------------------------------------------------------------ */

/**
 * Anropas när en skada just satts (tränings- eller loppskada). Vanliga
 * hästar stannar i loggen; en stjärna blir händelse — och vid lång
 * frånvaro en tidningssida med förstamannens plan. Comeback-bågen
 * armeras här: hästen minns att frånvaron var en nyhet, så att
 * återkomsten kan bli en.
 */
export function vidSkada(spel, häst, veckor) {
  if (!ärStjärna(häst)) return;
  /* HÖGST EN SKADEFÖRSTASIDA PER SÄSONG. Genomkörningen visade varför:
     ett hårt tränat stall med bara meriterade hästar gav 65 skadesidor
     på sex säsonger — och en förstasida i veckan är ingen förstasida.
     Säsongens första långa stjärnfrånvaro får sidan; resten blir
     pressnotiser. Comebackscenen kräver att skadan VAR en förstasida —
     cirkeln som sluts måste ha öppnats. */
  const scen = veckor >= 2 && spel.skadescenSäsong !== (spel.säsong ?? 1);
  if (scen) spel.skadescenSäsong = spel.säsong ?? 1;
  häst.skadenyhet = { säsong: spel.säsong ?? 1, vecka: spel.vecka, veckor, blevScen: scen };
  registreraHändelse(spel, {
    typ: "stjärnskada", betydelse: scen ? 66 : 48,
    aktörer: { hästId: häst.id, hästNamn: häst.namn, ägare: häst.ägare ?? null },
    data: { veckor, hype: Math.round(häst.hype || 0), scen },
  });
}

påHändelse("stjärnskada", (spel, h) => {
  const d = h.data ?? {};
  const namn = h.aktörer?.hästNamn ?? "Stjärnan";
  const fm = spel.förstaman;
  if (d.scen) {
    köScen(spel, {
      betydelse: h.betydelse, stil: "tidning", bild: "skada",
      bildreserv: bildvariant("stall-morgon", (spel.säsong ?? 1) * 100 + spel.vecka),
      signatur: JOURNALISTER.nyheter,
      etikett: "SKADEALARM",
      rubrik: `${namn.toUpperCase()} BORTA ${d.veckor} VECKOR`,
      ingress: `Beskedet kom efter morgonens veterinärbesök: ${namn} är skadad och missar ${d.veckor} veckors tävlande. `
        + `För ${spel.stallnamn} är det tungt — få hästar bär så mycket av stallets hopp.`,
      brödtext: [
        fm ? (fm.profil === "fostrare"
          ? `»Vi forcerar ingenting«, säger förstamannen ${fm.namn}. »Hästen får den tid den behöver — och en dag till.«`
          : `»Planen är redan lagd«, säger förstamannen ${fm.namn}. »Skritt, sedan lugna jobb. ${namn} kommer tillbaka.«`)
          : `Stallet håller planen för comeback öppen.`,
      ],
      citat: "Skador är travets skatt på framgång. Man betalar den, och man kommer igen.",
      citatVem: fm?.namn ?? spel.stallnamn,
    });
  }
  spel.press?.unshift({ rubrik: `${namn} skadad — borta ${d.veckor} v`,
    byline: "Stallet bekräftar efter veterinärbesök.", ton: "dålig",
    vecka: spel.vecka, signatur: JOURNALISTER.nyheter });
});

/* ------------------------------------------------------------------ */
/* Comebacken                                                          */
/* ------------------------------------------------------------------ */

/**
 * Kroken på comeback_-milstolpen (finns sedan v59): vann hästen direkt i
 * comebacken OCH var frånvaron en nyhet, då är återkomsten det också.
 * Cirkeln sluts: skadesidan lovade en comeback, den här sidan levererar.
 */
påHändelse("*", (spel, h) => {
  if (!String(h.typ).startsWith("comeback")) return;
  const häst = (spel.stall || []).find((x) => x.id === h.aktörer?.hästId);
  if (!häst?.skadenyhet) return;
  const varFörstasida = häst.skadenyhet.blevScen;
  delete häst.skadenyhet;
  if (!varFörstasida) {
    spel.press?.unshift({ rubrik: `${häst.namn} vann direkt i comebacken`,
      byline: "Skadan är ett minne blott.", ton: "bra",
      vecka: spel.vecka, signatur: JOURNALISTER.siffror });
    return;
  }
  köScen(spel, {
    betydelse: 72, stil: "tidning",
    bild: bildvariant("comeback", (spel.säsong ?? 1) * 100 + spel.vecka), bildreserv: "seger",
    signatur: JOURNALISTER.krönikör,
    etikett: "COMEBACKEN",
    rubrik: "TILLBAKA — OCH FÖRBI ALLA",
    ingress: `${häst.namn} vann direkt i comebacken efter skadan. Veckorna i skrittmaskinen `
      + `och de lugna jobben på rakbanan betalade sig på en gång.`,
    citat: "Den som väntat längst springer fortast. Det ligger något i det gamla talesättet.",
    citatVem: spel.förstaman?.namn ?? spel.stallnamn,
  });
});

/* ------------------------------------------------------------------ */
/* Favoritfallet                                                       */
/* ------------------------------------------------------------------ */

/**
 * Anropas efter lopp där spelarens häst var TUNG favorit (streck ≥ 35)
 * och slutade utanför pallen. I vardagslopp blir det press; i storlopp
 * en tidningssida — det är där fallhöjden finns. Dagsformen mildrar
 * tonen: en häst som inte var sig själv döms inte som en bluff.
 */
export function vidFavoritfall(spel, { häst, lopp, min, dåligDag }) {
  if (min.ur || (min.streck ?? 0) < 35 || (min.plats ?? 99) <= 3) return;
  registreraHändelse(spel, {
    typ: "favoritfall", betydelse: lopp.storlopp ? 64 : 42,
    aktörer: { hästId: häst.id, hästNamn: häst.namn },
    data: { lopp: lopp.kortnamn || lopp.namn, streck: Math.round(min.streck),
            plats: min.plats, storlopp: !!lopp.storlopp, dåligDag: !!dåligDag },
  });
}

påHändelse("favoritfall", (spel, h) => {
  const d = h.data ?? {};
  const namn = h.aktörer?.hästNamn ?? "Favoriten";
  if (d.storlopp) {
    köScen(spel, {
      betydelse: h.betydelse, stil: "tidning",
      bild: bildvariant("facit", (spel.säsong ?? 1) * 100 + spel.vecka), bildreserv: "bana-kvall",
      signatur: JOURNALISTER.nyheter,
      etikett: "STORLOPPSFACIT",
      rubrik: d.dåligDag ? `${namn.toUpperCase()} VAR INTE SIG SJÄLV` : "FAVORITFALLET",
      ingress: `${Math.round(d.streck)} % av spelarna hade ${namn} som segrare i ${d.lopp}. `
        + `Det slutade som ${d.plats}:a — och ${TIDNINGSNAMN}s telefonväxel gick varm.`,
      brödtext: [
        d.dåligDag
          ? `I stallet är tonen sansad: hästen kändes inte som vanligt redan i defileringen. Sådana dagar finns, och de förklarar mer än taktiken.`
          : `Loppet bjöd inga ursäkter — position, tempo och lägen fanns där. Frågorna får stallet bära in i nästa vecka.`,
      ],
      fråga: `${TIDNINGSNAMN} sträcker fram mikrofonen även åt förloraren. Vad säger du?`,
      data: { hästId: h.aktörer?.hästId },
      val: [
        { id: "dagen", effekt: "förlust_dagen",
          text: "»Hästen var inte sig själv i dag.«",
          följd: "Skyddar hästens rykte — spelarna köper det halvt" },
        { id: "ansvar", effekt: "förlust_ansvar",
          text: "»Vi var inte bra nog. Det är hela analysen.«",
          följd: "Rakryggat — spelarna och pressen respekterar det" },
        { id: "försvar", effekt: "förlust_försvar",
          text: "»Döm inte den här hästen på ett lopp.«",
          följd: "Eldar hästens läger — men låter som en bortförklaring" },
      ],
    });
  } else {
    spel.press?.unshift({ rubrik: `${namn} föll som ${d.streck}-procentare`,
      byline: `${d.plats}:a i ${d.lopp}. Spelarna muttrar.`, ton: "dålig",
      vecka: spel.vecka, signatur: JOURNALISTER.siffror });
  }
  spel.spelförtroende = klamp(spel.spelförtroende - (d.storlopp ? 4 : 2));
});

/* ------------------------------------------------------------------ */
/* Formsvackan                                                         */
/* ------------------------------------------------------------------ */

/**
 * Anropas efter varje lopp: tre raka utanför pallen för en häst som
 * betytt något väcker frågan i pressen — EN gång per svacka. Nästa
 * pallplats nollställer räknaren och stänger frågan; svackan som bryts
 * blir en egen god nyhet om frågan hann ställas.
 */
export function vidFormsvacka(spel, häst, min) {
  if (min.ur) { /* diskning räknas som miss */ }
  const pall = !min.ur && (min.plats ?? 99) <= 3;
  if (pall) {
    if (häst.svackafråga) {
      delete häst.svackafråga;
      spel.press?.unshift({ rubrik: `Svackan bruten — ${häst.namn} tillbaka på pallen`,
        byline: `Frågetecknen rätas ut.`, ton: "bra",
        vecka: spel.vecka, signatur: JOURNALISTER.siffror });
    }
    häst.rakaMissar = 0;
    return;
  }
  häst.rakaMissar = (häst.rakaMissar || 0) + 1;
  if (häst.rakaMissar === 3 && ärStjärna(häst) && !häst.svackafråga) {
    häst.svackafråga = true;
    registreraHändelse(spel, {
      typ: "formsvacka", betydelse: 46,
      aktörer: { hästId: häst.id, hästNamn: häst.namn },
      data: { missar: häst.rakaMissar },
    });
    spel.press?.unshift({ rubrik: `Vad är det med ${häst.namn}?`,
      byline: `Tre raka lopp utanför pallen. ${TIDNINGSNAMN} har frågat — stallet har inga bortförklaringar.`,
      ton: "dålig", vecka: spel.vecka, signatur: JOURNALISTER.nyheter });
    häst.hype = klamp((häst.hype || 0) - 10);
  }
}

/* Förlorarintervjuns effekter. Den starkaste intervjun i sporten är den
   efter förlusten — och vad man säger i den ska betyda något. */
const intervjuHäst = (spel, scen) =>
  (spel.stall || []).find((h) => h.id === scen?.data?.hästId);

registreraValeffekt("förlust_dagen", (spel, scen) => {
  const h = intervjuHäst(spel, scen);
  if (h) h.hype = klamp((h.hype || 0) + 3);
  spel.spelförtroende = klamp(spel.spelförtroende - 1);
  spel.logg?.unshift("Citatet trycks. Spelarna köper det — halvt.");
});
registreraValeffekt("förlust_ansvar", (spel, scen) => {
  const h = intervjuHäst(spel, scen);
  if (h) h.hype = klamp((h.hype || 0) - 4);
  spel.spelförtroende = klamp(spel.spelförtroende + 3);
  spel.renommé = klamp(spel.renommé + 1);
  spel.logg?.unshift("Rakryggat. Pressen noterar att stallet inte gömmer sig.");
});
registreraValeffekt("förlust_försvar", (spel, scen) => {
  const h = intervjuHäst(spel, scen);
  if (h) h.hype = klamp((h.hype || 0) + 6);
  spel.spelförtroende = klamp(spel.spelförtroende - 2);
  spel.logg?.unshift("Hästens läger eldas. Spelarkollektivet himlar med ögonen.");
});

export const motgångInkopplad = true;
