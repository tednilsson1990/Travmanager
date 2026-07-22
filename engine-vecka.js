import { klamp, kr, int, plock, rnd } from "./engine-util.js";
import { nyHäst, TRÄNING } from "./engine-hast.js";
import { KUSKAR } from "./data-kuskar.js";
import { ÄGARNAMN, ÄGARKRAV, ARVODE_PER_VECKA } from "./data-agare.js";

const DRIFT_PER_HÄST = 4200;

export function skrivPress(spel, rubrik, byline, ton, hästMål, hypeΔ) {
  spel.press.unshift({ rubrik, byline, ton, vecka: spel.vecka });
  spel.press = spel.press.slice(0, 20);
  if (hästMål) hästMål.hype = klamp(hästMål.hype + (hypeΔ || 0));
}

/** Travmedia plockar upp formkurvor — vilket driver hype, streck och förväntningar. */
function media(spel) {
  const h = [...spel.stall].filter((x) => x.skada === 0).sort((a, b) => b.form - a.form)[0];
  if (!h) return;
  if (Math.random() >= 0.28 + spel.renommé / 300) return;
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
    if (Math.random() < risk) {
      h.skada = int(1, 3);
      h.form = klamp(h.form - 12);
      spel.logg.push(`<b>${h.namn}</b> kom ur jobbet ömmande. Borta ${h.skada} v.`);
    }
  });

  const externa = spel.stall.filter((h) => h.ägare).length;
  const kostnad = spel.stall.length * DRIFT_PER_HÄST;
  const intäkt = externa * ARVODE_PER_VECKA;
  spel.kassa += intäkt - kostnad;
  spel.logg.push(`Drift ${spel.stall.length} hästar: <b>−${kr(kostnad)} kr</b>`);
  if (externa) spel.logg.push(`Träningsarvoden: <b>+${kr(intäkt)} kr</b>`);

  // Renommé och relationer svalnar av tystnad
  spel.renommé = klamp(spel.renommé - 0.6);
  spel.spelförtroende = klamp(spel.spelförtroende + (spel.spelförtroende < 40 ? 0.5 : -0.3));
  KUSKAR.forEach((k) => {
    const r = spel.kuskrelation[k.namn] ?? k.startrelation;
    spel.kuskrelation[k.namn] = klamp(r - 0.4);
  });

  media(spel);

  if (!spel.erbjudande && spel.stall.length < 8 && Math.random() < 0.1 + spel.renommé / 220) {
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
  return spel;
}

/**
 * Efter ett lopp: pengar, form, och hela sfärens reaktion.
 * Returnerar en sammanfattning som UI:t kan visa.
 */
export function efterLopp(spel, { häst, kusk, lopp, min, varFavorit }) {
  /* Dold dagsform. En häst som inte var bra den dagen presterar under sin
     kapacitet — och då är ett dåligt resultat inte ett misslyckande utan
     en upplysning. Pressen och ägarna dömer mildare, men hästen kan
     behöva vila. */
  const dåligDag = min.dagsform !== undefined && min.dagsform < 0.945;
  const toppdag = min.dagsform !== undefined && min.dagsform > 1.02;
  const brutto = min.ur ? 0 : lopp.pris[min.plats - 1] || 0;
  const kuskandel = Math.round(brutto * kusk.andel);
  const netto = brutto - kuskandel;
  const vann = !min.ur && min.plats === 1;
  const pall = !min.ur && min.plats <= 3;

  häst.starter++;
  häst.intjänat += netto;
  if (vann) häst.segrar++;
  if (pall) häst.pallplatser++;
  häst.energi = klamp(häst.energi - int(14, 24));
  häst.form = klamp(häst.form + (pall ? 4 : -2));
  spel.kassa += netto;
  spel.intjänat += netto;
  if (Math.random() < (häst.energi < 25 ? 0.18 : 0.05)) häst.skada = int(1, 2);
  if (dåligDag && Math.random() < 0.35) häst.skada = Math.max(häst.skada, int(1, 2));

  let renΔ = 0, relΔ = 0, hypeΔ = 0, troΔ = 0;
  const kortnamn = lopp.namn.split(",")[0].toLowerCase();

  if (vann) {
    renΔ = 2.5 * lopp.prestige; relΔ = 9; hypeΔ = 14 + lopp.prestige * 5;
    troΔ = varFavorit ? 2 : 5;
    if (!varFavorit) renΔ += 2;
    skrivPress(spel, `${häst.namn} vinner ${kortnamn}`,
      `${kusk.namn} körde. ${varFavorit ? "Favoritskapet infriades."
        : `Skrällen var ett faktum — bara ${min.streck.toFixed(0)} % streck.`}`, "bra");
  } else if (pall) {
    renΔ = 0.8 * lopp.prestige; relΔ = 4; hypeΔ = 6; troΔ = varFavorit ? -2 : 1;
    skrivPress(spel, `${häst.namn} ${min.plats}:a i ${kortnamn}`,
      "Stallet levererar utan att ta rubrikerna.", "neutral");
  } else {
    relΔ = -3; hypeΔ = -5;
    if (varFavorit) {
      renΔ = -3; relΔ = -5; troΔ = -7;
      skrivPress(spel, `Storfavoriten föll — ${häst.namn} ${min.ur ? "bortkörd" : `bara ${min.plats}:a`}`,
        `${min.streck.toFixed(0)} % av spelarna hade satsat.`, "dålig");
    } else if (min.ur) {
      renΔ = -1; troΔ = -2;
      skrivPress(spel, `Galopp för ${häst.namn}`, `Ingen lugn resa för ${kusk.namn}.`, "dålig");
    } else troΔ = -1;
  }
  // Att offra en kusk i dödens utan resultat kostar relation
  if (!min.ur && min.utanSkydd > 50 && min.plats > 4) relΔ -= 2;

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
  return { brutto, kuskandel, netto, renΔ, relΔ, hypeΔ, troΔ, ägartext, dagstext, dåligDag };
}
