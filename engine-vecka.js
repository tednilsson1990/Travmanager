import { klamp, kr, int, plock, rnd, slump } from "./engine-util.js";
import { nyHäst, TRÄNING } from "./engine-hast.js";
import { KUSKAR } from "./data-kuskar.js";
import { ÄGARNAMN, ÄGARKRAV, ARVODE_PER_VECKA } from "./data-agare.js";
import { körVärldensVecka, skötVärlden, handelIVärlden } from "./engine-varld.js";
import { avslutaSäsong, säsongstext } from "./engine-sasong.js";

const DRIFT_PER_HÄST = 3200;

export function skrivPress(spel, rubrik, byline, ton, hästMål, hypeΔ) {
  spel.press.unshift({ rubrik, byline, ton, vecka: spel.vecka });
  spel.press = spel.press.slice(0, 20);
  if (hästMål) hästMål.hype = klamp(hästMål.hype + (hypeΔ || 0));
}

/** Travmedia plockar upp formkurvor — vilket driver hype, streck och förväntningar. */
function media(spel) {
  const h = [...spel.stall].filter((x) => x.skada === 0).sort((a, b) => b.form - a.form)[0];
  if (!h) return;
  if (slump() >= 0.28 + spel.renommé / 300) return;
  if (h.form > 66) {
    skrivPress(spel, `Formkurvan pekar rakt upp för ${h.namn}`,
      "Travmedia noterar jobben. Väntas bli hårt spelad.", "bra", h, 12);
  } else if (h.form < 40) {
    skrivPress(spel, `Frågetecken kring ${h.namn}`,
      "Uteblivna resultat gör att spelarna tvekar.", "dålig", h, -8);
  }
}

/** Kör en vecka framåt: träning, skador, ekonomi, media, ägarförfrågningar, föl. */
export function körVecka(spel) {
  spel.logg = [];

  spel.stall.forEach((h) => {
    h.hype = klamp(h.hype - 2.5);
    if (h.skada > 0) {
      h.skada--;
      h.energi = klamp(h.energi + 18);
      h.form = klamp(h.form - 4);
      if (h.skada === 0) spel.logg.push(`<b>${h.namn}</b> är friskförklarad.`);
      return;
    }
    const t = TRÄNING[h.träning];
    h.energi = klamp(h.energi + t.energi);
    h.form = klamp(h.form + t.form + (h.energi < 25 ? -6 : 0));
    h.start = klamp(h.start + t.start);
    const risk = t.risk * (h.energi < 30 ? 2.2 : 1) * (h.ålder > 8 ? 1.4 : 1);
    if (slump() < risk) {
      h.skada = int(1, 3);
      h.form = klamp(h.form - 12);
      spel.logg.push(`<b>${h.namn}</b> kom ur jobbet ömmande. Borta ${h.skada} v.`);
    }
  });

  const externa = spel.stall.filter((h) => h.ägare).length;
  const kostnad = spel.stall.length * DRIFT_PER_HÄST;
  const intäkt = externa * ARVODE_PER_VECKA;
  spel.kassa += intäkt - kostnad;

  /* Kassagolv. Utan det kan stallet driva hur långt som helst under noll
     utan att spelet säger något — och en karriär som tyst blivit omöjlig är
     värre än en som tar slut med besked. */
  if (spel.kassa < 0) {
    spel.kassa = 0;
    spel.iKris = (spel.iKris || 0) + 1;
    spel.logg.push("<b>Kassan är tom.</b> Sälj en häst eller sänk kostnaderna.");
    if (spel.iKris >= 3 && spel.stall.length > 1) {
      /* Tredje veckan i rad utan pengar: banken tvingar fram en försäljning. */
      const offer = [...spel.stall].filter((h) => !h.ägare)
        .sort((a, b) => (a.intjänat || 0) - (b.intjänat || 0))[0];
      if (offer) {
        spel.stall = spel.stall.filter((h) => h.id !== offer.id);
        spel.kassa += 40000;
        spel.iKris = 0;
        skrivPress(spel, `${offer.namn} såld i tvångsförsäljning`,
          "Björkhaga tvingas göra sig av med en häst för att klara driften.", "dålig");
        spel.logg.push(`<b>${offer.namn}</b> tvångssåld för 40 000 kr.`);
      }
    }
  } else if (spel.kassa > 60000) {
    spel.iKris = 0;
  }
  spel.logg.push(`Drift ${spel.stall.length} hästar: <b>−${kr(kostnad)} kr</b>`);
  if (externa) spel.logg.push(`Träningsarvoden: <b>+${kr(intäkt)} kr</b>`);

  // Renommé och relationer svalnar av tystnad
  /* Renommét sjunker av sig självt, men får inte kollapsa till noll av
     ordinärt tävlande — vid noll tackar alla kuskar nej och inga ägare hör
     av sig, och då är karriären permanent låst. Golvet följer stallets
     faktiska verksamhet: den som tävlar och tjänar pengar behåller ett
     grundanseende även under en svag period. */
  const golv = klamp(
    6 + Math.min(spel.stall.length, 8) * 1.5 + Math.min(spel.intjänat / 60000, 12),
    5, 34
  );
  spel.renommé = Math.max(golv, klamp(spel.renommé - 0.6));
  spel.spelförtroende = klamp(spel.spelförtroende + (spel.spelförtroende < 40 ? 0.5 : -0.3));
  KUSKAR.forEach((k) => {
    const r = spel.kuskrelation[k.namn] ?? k.startrelation;
    spel.kuskrelation[k.namn] = klamp(r - 0.4);
  });

  /* Världen lever vidare oavsett vad du gör. AI-stallen kör sina lopp,
     deras hästar tjänar pengar och flyttas mellan klasserna. */
  const världensNyheter = körVärldensVecka(spel);
  skötVärlden(spel.värld);
  handelIVärlden(spel.värld).forEach((a) => {
    if (slump() < 0.4) {
      skrivPress(spel, `${a.häst} byter stall`,
        `${a.från} säljer till ${a.till}.`, "neutral");
    }
  });
  spel.startadeLopp = [];
  världensNyheter.forEach((n) => skrivPress(spel, n.rubrik, n.byline, "neutral"));

  media(spel);

  if (!spel.erbjudande && spel.stall.length < 8 && slump() < 0.1 + spel.renommé / 220) {
    const nivå = 30 + spel.renommé * 0.55;
    const h = nyHäst({
      start: klamp(Math.round(rnd(nivå - 12, nivå + 14))),
      fart: klamp(Math.round(rnd(nivå - 12, nivå + 14))),
      styrka: klamp(Math.round(rnd(nivå - 12, nivå + 14))),
      ålder: int(3, 7),
      ägare: plock(ÄGARNAMN),
    });
    h.hype = klamp(10 + spel.renommé * 0.2);
    h.krav = plock(ÄGARKRAV);
    spel.erbjudande = h;
  }

  spel.föl = spel.föl.filter((f) => {
    f.veckorKvar--;
    if (f.veckorKvar > 0) return true;
    const h = nyHäst({ namn: f.namn, ålder: 3, kön: f.kön, start: f.start, fart: f.fart, styrka: f.styrka });
    h.form = 42;
    h.energi = 80;
    spel.stall.push(h);
    spel.logg.push(`<b>${h.namn}</b> är inkörd och redo att tävla.`);
    return false;
  });

  spel.vecka++;

  /* Sista veckan avslutar säsongen: resultatet skrivs in i historiken och
     spelaren erbjuds att starta nästa år. */
  if (spel.vecka > spel.veckor && !spel.säsongAvslutad) {
    const rad = avslutaSäsong(spel);
    spel.säsongAvslutad = rad;
    skrivPress(spel, `Säsongen är slut — Björkhaga ${rad.plats}:a`, säsongstext(rad),
      rad.plats <= 3 ? "bra" : rad.plats > rad.avStall * 0.7 ? "dålig" : "neutral");
    spel.logg.push(`<b>Säsong ${rad.säsong} avslutad.</b> ${säsongstext(rad)}`);
  }
  return spel;
}

/**
 * Efter ett lopp: pengar, form, och hela sfärens reaktion.
 * Returnerar en sammanfattning som UI:t kan visa.
 */
export function efterLopp(spel, { häst, kusk, lopp, min, varFavorit, streckRang, förväntan = 0 }) {
  /* Dold dagsform. En häst som inte var bra den dagen presterar under sin
     kapacitet — och då är ett dåligt resultat inte ett misslyckande utan
     en upplysning. Pressen och ägarna dömer mildare, men hästen kan
     behöva vila. */
  const dåligDag = min.dagsform !== undefined && min.dagsform < 0.945;
  const toppdag = min.dagsform !== undefined && min.dagsform > 1.02;
  /* Alla startande får normalt en garanterad prispeng — även oplacerade
     och diskvalificerade. Och eftersom startsumman avgör vilka lopp hästen
     får starta i flyttar även en femteplats hästens karriär. */
  const brutto = min.ur
    ? (lopp.garanterad || 0)
    : (lopp.pris[min.plats - 1] ?? lopp.garanterad ?? 0);
  const kuskandel = Math.round(brutto * kusk.andel);
  const netto = brutto - kuskandel;
  const vann = !min.ur && min.plats === 1;
  const pall = !min.ur && min.plats <= 3;

  häst.starter++;
  /* Loppraden. Det första en travmänniska läser om en häst är dess senaste
     starter — inte totalsiffror. Utan den ser hästarna likadana ut. */
  häst.resultat = [{
    säsong: spel.säsong || 1, vecka: spel.vecka,
    lopp: lopp.kortnamn || lopp.namn, dist: lopp.dist, start: lopp.start,
    plats: min.ur ? null : min.plats, startande: lopp.startande,
    km: min.ur ? null : min.km, läge: min.läge, spår: min.spår,
    kusk: kusk.namn, pris: brutto,
  }, ...(häst.resultat || [])].slice(0, 20);
  /* Startsumman är hästens OFFICIELLA insprungna och avgör vilka lopp den
     får starta i — den räknas brutto, precis som för världens hästar.
     Kuskens andel dras från kassan, inte från hästens merit. */
  häst.intjänat += brutto;
  if (vann) häst.segrar++;
  if (pall) häst.pallplatser++;
  häst.energi = klamp(häst.energi - int(14, 24));
  häst.form = klamp(häst.form + (pall ? 4 : -2));
  spel.kassa += netto;
  spel.intjänat += netto;
  if (slump() < (häst.energi < 25 ? 0.18 : 0.05)) häst.skada = int(1, 2);
  if (dåligDag && slump() < 0.35) häst.skada = Math.max(häst.skada, int(1, 2));

  let renΔ = 0, relΔ = 0, hypeΔ = 0, troΔ = 0;
  const kortnamn = lopp.kortnamn || lopp.namn.split(",")[0];

  /* En V85-avdelning ses av hela landet. Allt väger tyngre där. */
  const v85 = !!lopp.v85;
  const vikt = v85 ? 1.6 : 1;

  if (vann) {
    renΔ = 2.5 * lopp.prestige * vikt; relΔ = 9; hypeΔ = (14 + lopp.prestige * 5) * vikt;

    /* En seger i ett storlopp ska märkas i mer än kassan. Ägare hör av sig,
       och stallet får ett lyft som håller i sig — det är så ett litet stall
       tar sig uppåt på riktigt. */
    if (lopp.storlopp || v85) {
      spel.spelförtroende = klamp(spel.spelförtroende + 6);
      if (!spel.erbjudande && spel.stall.length < 9) {
        const nivå = 42 + spel.renommé * 0.6 + lopp.prestige * 4;
        const ny = nyHäst({
          ålder: int(4, 7),
          start: klamp(Math.round(rnd(nivå - 8, nivå + 12))),
          fart: klamp(Math.round(rnd(nivå - 8, nivå + 12))),
          styrka: klamp(Math.round(rnd(nivå - 8, nivå + 12))),
        });
        ny.ägare = plock(ÄGARNAMN);
        ny.krav = plock(ÄGARKRAV);
        ny.hype = klamp(24 + spel.renommé * 0.2);
        spel.erbjudande = ny;
        spel.logg.push(
          `<b>${ny.ägare}</b> hörde av sig efter segern och vill placera <b>${ny.namn}</b> hos dig.`
        );
      }
    }
    troΔ = varFavorit ? 2 : 5;
    if (!varFavorit) renΔ += 2;
    skrivPress(spel, v85 ? `${häst.namn} vinner V85-avdelningen` : `${häst.namn} vinner ${kortnamn}`,
      `${kusk.namn} körde. ${varFavorit ? "Favoritskapet infriades."
        : `Skrällen var ett faktum — bara ${min.streck.toFixed(0)} % streck.`}`, "bra");
  } else if (pall) {
    renΔ = 0.8 * lopp.prestige; relΔ = 4; hypeΔ = 6; troΔ = varFavorit ? -2 : 1;
    skrivPress(spel, `${häst.namn} ${min.plats}:a i ${kortnamn}`,
      "Stallet levererar utan att ta rubrikerna.", "neutral");
  } else {
    relΔ = -3; hypeΔ = -5;
    if (varFavorit) {
      renΔ = -3 * vikt; relΔ = -5; troΔ = -7 * vikt;
      const spikad = v85 && min.streck > 40;
      skrivPress(spel,
        spikad
          ? `Spiken sprack — ${häst.namn} ${min.ur ? "bortkörd" : `bara ${min.plats}:a`} i V85`
          : `Storfavoriten föll — ${häst.namn} ${min.ur ? "bortkörd" : `bara ${min.plats}:a`}`,
        spikad
          ? `${min.streck.toFixed(0)} % hade spikat ekipaget. Systemen sprack över hela landet.`
          : `${min.streck.toFixed(0)} % av spelarna hade satsat.`, "dålig");
    } else if (min.ur) {
      renΔ = -1; troΔ = -2;
      skrivPress(spel, `Galopp för ${häst.namn}`, `Ingen lugn resa för ${kusk.namn}.`, "dålig");
    } else troΔ = -1;
  }
  // Att offra en kusk i dödens utan resultat kostar relation
  if (!min.ur && min.utanSkydd > 50 && min.plats > 4) relΔ -= 2;

  /* Vad du sa till pressen före loppet får följder. Talade du upp hästen
     har du satt din trovärdighet i pant; tonade du ner den blir fallet
     mjukare, men ägarna ville synas. */
  if (förväntan > 0) {
    if (vann) { renΔ += 1.5; hypeΔ += 6; }
    else {
      renΔ -= 2; troΔ -= 2;
      skrivPress(spel, `Stora ord, tunt resultat för ${häst.namn}`,
        "Björkhaga lovade rakt inför loppet. Så blev det inte.", "dålig");
    }
  } else if (förväntan < 0) {
    if (vann) {
      renΔ += 1;
      skrivPress(spel, `${häst.namn} vann — trots att tränaren tonade ner`,
        "Antingen blygsamhet eller taktik. Spelarna noterade i alla fall oddset.", "bra");
    } else { renΔ *= 0.7; troΔ *= 0.7; }
    if (häst.ägare) häst.tålamod -= 1;
  }

  // Ett svagt lopp med en häst som inte var bra döms mildare
  if (dåligDag && renΔ < 0) { renΔ *= 0.5; troΔ *= 0.5; }
  spel.renommé = klamp(spel.renommé + renΔ);
  spel.spelförtroende = klamp(spel.spelförtroende + troΔ);
  spel.kuskrelation[kusk.namn] = klamp((spel.kuskrelation[kusk.namn] ?? kusk.startrelation) + relΔ + 1);
  häst.hype = klamp(häst.hype + hypeΔ);

  let ägartext = null;
  if (häst.ägare) {
    häst.kravStarter++;
    const k = häst.krav;
    const uppfyllt =
      (k.typ === "topp3" && pall) ||
      (k.typ === "seger" && vann) ||
      (k.typ === "pall3" && häst.pallplatser >= 3) ||
      (k.typ === "storlopp" && lopp.storlopp);

    if (uppfyllt) {
      ägartext = { ton: "bra", text: `${häst.ägare} är nöjd — kravet "${k.text}" är uppfyllt.` };
      häst.krav = plock(ÄGARKRAV);
      häst.kravStarter = 0;
      spel.renommé = klamp(spel.renommé + 2);
      skrivPress(spel, `${häst.ägare} förlänger med Björkhaga`, `Ägaren nöjd med ${häst.namn}.`, "bra");
    } else if (häst.kravStarter >= k.antal) {
      ägartext = { ton: "dålig", text: `${häst.ägare} drar tillbaka ${häst.namn} — kravet missades.` };
      skrivPress(spel, `${häst.ägare} lämnar Björkhaga`, `Kravet på ${häst.namn} infriades aldrig.`, "dålig");
      spel.renommé = klamp(spel.renommé - 4);
      spel.stall = spel.stall.filter((x) => x !== häst);
    } else {
      ägartext = { ton: "neutral", text: `${häst.ägare}: ${k.antal - häst.kravStarter} starter kvar på kravet.` };
    }
  }

  const dagstext = min.dagsformText
    ? (dåligDag
        ? `${häst.namn} ${min.dagsformText} idag${häst.skada > 0 ? " och behöver vila" : ""}.`
        : toppdag ? `${häst.namn} ${min.dagsformText}.` : `${häst.namn} ${min.dagsformText}.`)
    : null;
  if (dåligDag) {
    skrivPress(spel, `Svagt av ${häst.namn}`,
      `Björkhaga uppger att hästen inte var i slag.`, "neutral");
  }
  /* ---------- Stallform och marknadens bild av dig ----------
     Stallformen är offentlig och påverkar oddsen på ALLA dina hästar. En
     usel månad gör även din bästa häst underspelad — vilket blir din chans.
     Marknadsbilden mäter om dina hästar brukar överträffa sina odds. Gör de
     det blir de hårdare spelade, och kanten äts upp. */
  if (!min.ur && min.plats) {
    const startande = lopp.startande || 12;
    /* Överprestation mäts mot spelarnas RANGORDNING, inte mot procenttalet.
       Var hästen tredje mest spelad och slutade tvåa har den överträffat
       förväntan med en placering. Jämför man i stället placering mot
       streckprocent blir även en vinnande favorit "underpresterande",
       eftersom procenttalet kan vara högre än vad någon placering kan matcha. */
    const rang = streckRang || Math.ceil(startande / 2);
    const prestation = (1 - (min.plats - 1) / Math.max(1, startande - 1)) / 0.5;
    const överprestation = (rang - min.plats) / Math.max(1, startande - 1);
    spel.resultathistorik = [
      { prestation, överprestation },
      ...(spel.resultathistorik || []),
    ].slice(0, 12);
  }
  const hist = spel.resultathistorik || [];
  if (hist.length) {
    const snittPrestation = hist.reduce((a, b) => a + b.prestation, 0) / hist.length;
    const snittÖver = hist.reduce((a, b) => a + b.överprestation, 0) / hist.length;
    spel.stallform = klamp(50 + (snittPrestation - 1) * 45);
    spel.marknadsbild = klamp(snittÖver * 2.2, -1.2, 1.2);
  }

  return { brutto, kuskandel, netto, renΔ, relΔ, hypeΔ, troΔ, ägartext, dagstext, dåligDag };
}
