import { klamp, kr, int, plock, rnd, slump } from "./engine-util.js";
import { nyHäst, TRÄNING } from "./engine-hast.js";
import { KUSKAR } from "./data-kuskar.js";
import { ÄGARNAMN, ÄGARKRAV, ARVODE_PER_VECKA } from "./data-agare.js";
import { körVärldensVecka, skötVärlden, handelIVärlden } from "./engine-varld.js";
import { avslutaSäsong, säsongstext } from "./engine-sasong.js";
import { säkraFörstaman } from "./engine-forstaman.js";
import { säkraAnläggning, gårdseffekt, gåraugifter, läkning, boxplats } from "./engine-gard.js";
import { registreraHändelse, hästmilstolpar, säsongsHändelser, loppfakta,
         uppdateraRivalitet } from "./engine-handelser.js";
/* Sidoeffektsimport: att importera lyssnarna kopplar in dem på bussen.
   Måste ske innan något lopp körs — därför här, i veckomotorn. */
import "./engine-lyssnare.js";
import { körStorloppsbåge } from "./engine-storlopp.js";
import { uppdateraAmbition, prövaAvgång, gamlaBekanta, ägarrelation } from "./engine-personal.js";
import { verkställVeckoslots } from "./engine-stallmote.js";
import { ägarVecka, ägarSport, ägarEfterStart } from "./engine-agare.js";
import { sponsorVecka, sponsorEfterLopp, sponsorSäsongsskifte, foderrabatt } from "./engine-sponsor.js";
import { uppdateraRekordEfterLopp, skrivSäsongskrönika } from "./engine-rekord.js";
import { mentornsNärvaro, efterMinneslopp } from "./engine-mentor.js";
import { vidSkada, vidFavoritfall, vidFormsvacka } from "./engine-motgang.js";
import { världensRöst } from "./engine-varldsrost.js";
import { bildvariant } from "./data-bilder.js";
import { köScen } from "./engine-scener.js";
import { JOURNALISTER, BANOR } from "./data-namnpaket.js";

const DRIFT_PER_HÄST = 3200;

export function skrivPress(spel, rubrik, byline, ton, hästMål, hypeΔ, signatur) {
  spel.press.unshift({ rubrik, byline, ton, vecka: spel.vecka, signatur: signatur ?? null });
  spel.press = spel.press.slice(0, 20);
  if (hästMål) hästMål.hype = klamp(hästMål.hype + (hypeΔ || 0));
}

/** Travmedia plockar upp formkurvor — vilket driver hype, streck och förväntningar. */
function media(spel) {
  const h = [...spel.stall].filter((x) => x.skada === 0).sort((a, b) => b.form - a.form)[0];
  if (!h) return;
  if (slump() >= 0.28 + spel.renommé / 300) return;
  /* Poolerna finns för att en karriär är lång: samma rubrik varje månad
     gör tidningen till tapet. Varianterna säger samma sak med olika ord —
     hypeeffekten är identisk, bara språket varierar. */
  if (h.form > 66) {
    const [rubrik, byline] = plock([
      [`Formkurvan pekar rakt upp för ${h.namn}`, "Travmedia noterar jobben. Väntas bli hårt spelad."],
      [`${h.namn} flyger på träningen`, "Klockorna i jobben har fått spelarna att vässa pennorna."],
      [`Insidern: »${h.namn} är bättre än någonsin«`, "Stallbacken viskar, och strecket lär följa efter."],
      [`Håll ögonen på ${h.namn}`, "Formtoppen ser ut att pricka in nästa start."],
    ]);
    skrivPress(spel, rubrik, byline, "bra", h, 12, JOURNALISTER.siffror);
  } else if (h.form < 40) {
    const [rubrik, byline] = plock([
      [`Frågetecken kring ${h.namn}`, "Uteblivna resultat gör att spelarna tvekar."],
      [`Var är formen, ${h.namn}?`, "Jobben imponerar inte, och strecket sjunker."],
      [`Spelarna sviker ${h.namn}`, "Siffrorna ljuger sällan — och de pekar nedåt."],
    ]);
    skrivPress(spel, rubrik, byline, "dålig", h, -8, JOURNALISTER.siffror);
  }
}

/** Kör en vecka framåt: träning, skador, ekonomi, media, ägarförfrågningar, föl. */
export function körVecka(spel) {
  /* Äldre karriärer saknar förstaman — en dyker upp med en pressnotis. */
  säkraAnläggning(spel);
  if (säkraFörstaman(spel)) {
    skrivPress(spel, `${spel.förstaman.namn} ny förstaman hos ${spel.stallnamn}`,
      "Stallet förstärker", "positiv");
  }
  /* Passerad inbjudan förfaller. */
  if (spel.inbjudan && spel.inbjudan.vecka < spel.vecka) spel.inbjudan = null;
  /* UPPSTIGNINGEN. Med renommé och segrar hör de större banorna av sig.
     Erbjudandet ligger kvar tills spelaren bestämmer sig — men kommer
     bara en gång per storlekssteg. */
  const hemma = BANOR[spel.hemmabana];
  if (hemma && !spel.banerbjudande) {
    const nästaStorlek = (hemma.storlek ?? 1) + 1;
    const krav = nästaStorlek === 2 ? { renommé: 40, segrar: 6, kostnad: 60000 }
               : nästaStorlek === 3 ? { renommé: 62, segrar: 16, kostnad: 140000 }
               /* Kronvallen ringer bara den som redan är någon: högt
                  renommé, lång meritlista OCH minst en storloppsseger.
                  Samtalet ska kännas som karriärens sista dörr. */
               : nästaStorlek === 4 ? { renommé: 82, segrar: 30, kostnad: 320000,
                   kravStorlopp: true } : null;
    const harStorlopp = (spel.krönika ?? []).some((h) => h.typ === "storloppsseger");
    if (krav?.kravStorlopp && !harStorlopp) { /* dörren väntar */ }
    else
    if (krav && spel.renommé >= krav.renommé && (spel.segrarTotalt ?? 0) >= krav.segrar) {
      const kandidater = Object.entries(BANOR).filter(([, b]) => b.storlek === nästaStorlek);
      const [id, bana] = kandidater[Math.floor(slump() * kandidater.length)];
      spel.banerbjudande = { banaId: id, kostnad: krav.kostnad };
      skrivPress(spel, `${bana.namn} öppnar dörren för ${spel.stallnamn}`,
        "Banchefen bekräftar kontakten", "positiv");
      /* Uppstigningen är ett kapitelskifte — helskärm, inte ett kort i
         stallvyn. Kortet ligger kvar som reserv: räcker inte kassan i
         scenen väntar erbjudandet där tills spelaren bestämt sig. */
      köScen(spel, {
        slag: "banflytt", betydelse: 66,
        bild: bildvariant(`bana-${id}`, spel.säsong ?? 1), bildreserv: "bana-kvall",
        etikett: "TELEFONEN RINGER",
        rubrik: `${bana.namn.toUpperCase()} VILL HA ER`,
        ingress: `${bana.karaktär ?? "En större bana."} Större lopp på hemmaplan — och hemmapubliken följer med. Flyttkostnad ${Math.round(krav.kostnad / 1000)} tkr.`,
        fråga: "Flyttar stallet?",
        data: { banaId: id, kostnad: krav.kostnad },
        val: [
          { id: "flytta", effekt: "bana_flytta",
            text: `Vi flyttar till ${bana.namn}`, följd: `${Math.round(krav.kostnad / 1000)} tkr — och ett nytt kapitel` },
          { id: "stanna", effekt: "bana_stanna",
            text: "Vi trivs där vi är", följd: "Hemmapubliken jublar. Erbjudandet försvinner" },
        ],
      });
    }
  }
  spel.logg = [];

  /* STALLMÖTETS VERKLIGHET (plan 4.1): fler krävande pass än veckans
     slots verkställs inte — överskottet blir lugnt jobb, med besked. */
  const slotsUtfall = verkställVeckoslots(spel);
  if (slotsUtfall.nedflyttade.length) {
    spel.logg.push(`Veckan räckte inte till alla hårda pass — <b>${slotsUtfall.nedflyttade.join(", ")}</b> fick lugnt jobb i stället (${slotsUtfall.slots} platser).`);
  }

  spel.stall.forEach((h) => {
    h.hype = klamp(h.hype - 2.5);
    if (h.skada > 0) {
      h.skada--;
      h.energi = klamp(h.energi + 18);
      h.form = klamp(h.form - 4);
      if (h.skada === 0) { h.friskVecka = spel.vecka; spel.logg.push(`<b>${h.namn}</b> är friskförklarad.`); }
      return;
    }
    const t = TRÄNING[h.träning];
    /* Gården förbättrar utbytet — rakbanan lyfter snabbjobben, backen
       bygger ork, vattenbandet återhämtar och skonar. Aldrig loppmotorn. */
    const g = gårdseffekt(spel, h);
    h.energi = klamp(h.energi + t.energi + g.energi);
    h.form = klamp(h.form + t.form + g.form + (h.energi < 25 ? -6 : 0));
    h.start = klamp(h.start + t.start + g.start);
    if (g.styrka) h.styrka = klamp(h.styrka + g.styrka);
    /* TRÄNINGSDAGBOKEN. Veckans pass, och vad hästen svarade. Utan den är
       träningen ett val utan historia — man ser bara var man står, aldrig
       vad som förde en hit. Tjugo veckor räcker: en säsong bakåt. */
    h.dagbok = [{
      säsong: spel.säsong ?? 1, vecka: spel.vecka, träning: h.träning,
      energi: Math.round(h.energi), form: Math.round(h.form),
    }, ...(h.dagbok || [])].slice(0, 40);
    const risk = t.risk * g.riskfaktor * (h.energi < 30 ? 2.2 : 1) * (h.ålder > 8 ? 1.4 : 1);
    if (slump() < risk) {
      h.skada = läkning(spel, int(1, 3));
      h.form = klamp(h.form - 12);
      spel.logg.push(`<b>${h.namn}</b> kom ur jobbet ömmande. Borta ${h.skada} v.`);
      /* En vardagshäst stannar i loggen; en stjärna blir en nyhet. */
      vidSkada(spel, h, h.skada);
    }
  });

  const externa = spel.stall.filter((h) => h.ägare).length;
  const gård = gåraugifter(spel);
  /* Fodersponsorns förmån sänker driften — ekonomi, aldrig loppmotorn. */
  const rabatt = foderrabatt(spel);
  const kostnad = spel.stall.length * DRIFT_PER_HÄST - rabatt + gård;
  const intäkt = externa * ARVODE_PER_VECKA;
  spel.kassa += intäkt - kostnad;
  if (gård) spel.logg.push(`Anläggning och personal: <b>−${kr(gård)} kr</b>`);
  if (rabatt) spel.logg.push(`Foderavtalet sänkte driften: <b>+${kr(rabatt)} kr</b>`);

  /* Sponsorveckan: ersättningen betalas ut och nya erbjudanden kan komma. */
  sponsorVecka(spel).forEach((r) => spel.logg.push(r));

  /* Ägarnas vecka: tystnad svalnar, och en riktigt missnöjd ägare
     flyttar sin häst — med besked, aldrig i tysthet (kap 7.3). */
  const lämnade = ägarVecka(spel, skrivPress);
  if (lämnade.length) {
    spel.stall = spel.stall.filter((h) => !lämnade.includes(h));
    lämnade.forEach((h) => spel.logg.push(`<b>${h.namn}</b> hämtades av ${h.ägare}. Boxen står tom.`));
  }

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
  /* Ligan, sviterna, miljongränserna, uppstickaren — världens egna
     följetonger, hårt throttlade så att de sorlar utan att dränka. */
  världensRöst(spel, skrivPress);

  media(spel);

  /* Storloppsbågen: loppet som närmar sig kastar sin skugga i pressen och
     på Hem. Läser bara — rör aldrig fältbygget eller loppmotorn. */
  körStorloppsbåge(spel, skrivPress);

  /* Förstamannens egen kurva: ambitionen växer med stallets framgång,
     och en dag kommer samtalet. */
  uppdateraAmbition(spel);
  prövaAvgång(spel);

  /* Mentorns närvaro glesnar med åren — frånvaron ska hinna kännas. */
  mentornsNärvaro(spel);
  /* Minnesloppet påminner om sig veckan före. */
  if (spel.minneslopp && spel.vecka === spel.minneslopp.vecka - 1) {
    skrivPress(spel, `${spel.minneslopp.namn} körs nästa vecka`,
      `Kransen till den gamle tränarens ära delas ut på ${BANOR[spel.hemmabana]?.namn ?? "hemmabanan"}.`,
      "neutral");
  }

  if (!spel.erbjudande && boxplats(spel) > 0 && slump() < 0.1 + spel.renommé / 220) {
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
    /* Härstamningen följer med hästen. Utan den kan "dottern vann samma
       lopp som sin mamma" aldrig upptäckas — och det är den meningen hela
       generationsspelet byggs för. */
    h.morId = f.morId ?? null;
    h.mor = f.mor ?? null;
    h.far = f.far ?? null;
    h.form = 42;
    h.energi = 80;
    spel.stall.push(h);
    spel.logg.push(`<b>${h.namn}</b> är inkörd och redo att tävla.`);
    /* FÖLVISNINGEN: en stilla sida i hagen när gårdens egen uppfödning
       träder in i stallet. Förstamannen ger en FÖRSTA LEDTRÅD om
       temperamentet — läst ur den starkaste egenskapen, utan siffror.
       Det är så man lär känna en unghäst i verkligheten: på känn. */
    const bäst = h.start >= h.fart && h.start >= h.styrka ? "start"
      : h.fart >= h.styrka ? "fart" : "styrka";
    const ledtråd = bäst === "start"
      ? "Kvick ur vändningarna — den är med från första steget."
      : bäst === "fart" ? "Det finns en växel till där bak. Man ser det på travet redan."
      : "Stark som få. Den tröttnar inte — den blir sur på att andra gör det.";
    köScen(spel, {
      betydelse: 55, bild: bildvariant("hage", spel.säsong ?? 1),
      bildreserv: "hage",
      etikett: "HAGEN · GÅRDENS EGEN",
      rubrik: h.namn.toUpperCase(),
      ingress: `Uppfödd här${h.mor ? `, undan ${h.mor}` : ""}${h.far ? ` efter ${h.far}` : ""}. `
        + `I dag togs ${h.kön === "sto" ? "hon" : "han"} in från hagen för första gången med sele på riktigt.`,
      citat: ledtråd,
      citatVem: spel.förstaman?.namn ?? "Förstamannen",
    });
    return false;
  });

  spel.vecka++;

  /* Sista veckan avslutar säsongen: resultatet skrivs in i historiken och
     spelaren erbjuds att starta nästa år. */
  if (spel.vecka > spel.veckor && !spel.säsongAvslutad) {
    /* Säsong 0 är prologen — tre veckor bredvid mentorn. Den slutar inte
       i en ligatabell utan i övertagandet av gården. */
    if ((spel.säsong ?? 1) === 0) {
      spel.prolog.aktiv = false;
      spel.prolog.klar = true;
      return spel;
    }
    const rad = avslutaSäsong(spel);
    spel.säsongAvslutad = rad;
    /* Sponsorernas bokslut: uppfyllda krav förnyar avtalet med bonus,
       missade bryter det — med besked i pressen (kap 8). */
    sponsorSäsongsskifte(spel, skrivPress);
    /* Krönikörens bokslut skrivs NU, medan säsongens händelser ligger
       färska i krönikan — och sparas på historikraden så att texten går
       att läsa år senare i Stalljournalen. */
    skrivSäsongskrönika(spel, rad);
    skrivPress(spel, `Säsongen är slut — Björkhaga ${rad.plats}:a`, säsongstext(rad),
      rad.plats <= 3 ? "bra" : rad.plats > rad.avStall * 0.7 ? "dålig" : "neutral");
    spel.logg.push(`<b>Säsong ${rad.säsong} avslutad.</b> ${säsongstext(rad)}`);
    /* Gårdens gamla rekord är till för att slås. */
    const gh = spel.gårdshistoria;
    if (gh && rad.segrar > gh.rekordSegrarSäsong) {
      registreraHändelse(spel, { typ: "gårdsrekord", betydelse: 75,
        data: { text: `Nytt gårdsrekord: ${rad.segrar} segrar på en säsong`, gammaltÅr: gh.rekordÅr } });
      skrivPress(spel, `Nytt gårdsrekord: ${rad.segrar} segrar på en säsong`,
        `Den gamla noteringen (${gh.rekordSegrarSäsong}, från ${gh.rekordÅr}) är historia`, "bra");
      gh.rekordSegrarSäsong = rad.segrar; gh.rekordÅr = null;
    }
  }
  return spel;
}

/**
 * Efter ett lopp: pengar, form, och hela sfärens reaktion.
 * Returnerar en sammanfattning som UI:t kan visa.
 */
export function efterLopp(spel, { häst, kusk, lopp, min, varFavorit, streckRang, förväntan = 0, sim = null }) {
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
  if (vann) spel.segrarTotalt = (spel.segrarTotalt ?? 0) + 1;
  /* Loppets berättande fakta plockas ut EN gång och följer med in i
     händelsen — så att pressen, ägaren, förstamannen och krönikan läser
     samma siffror i stället för att räkna om dem var för sig. */
  const fakta = loppfakta(sim, { ...min, kusk }, lopp, häst);
  fakta.vannMot = vann;
  /* Hästens biografi och karriärens krönika skrivs av det som händer. */
  hästmilstolpar(spel, häst, lopp, min, brutto, fakta);
  /* Rivaliteter upptäcks ur data: samma motståndare, gång på gång. */
  if (!min.ur) uppdateraRivalitet(spel, häst, fakta);
  /* Stod en exförstamans häst i fältet? Pressen bevakar gamla bekanta. */
  gamlaBekanta(spel, sim?.resultat, häst, min.ur ? null : min.plats);
  /* Rekordtavlan: föll en notering? skrivPress följer med som argument
     så att rekordmodulen slipper importera veckomotorn tillbaka. */
  uppdateraRekordEfterLopp(spel, { häst, lopp, min, brutto, fakta, skrivPress });
  /* Minnesloppets krans väger mer än sitt förstapris. */
  efterMinneslopp(spel, lopp, häst, min);
  /* Motgången som berättelse: favoritfallet och formsvackan. */
  vidFavoritfall(spel, { häst, lopp, min, dåligDag });
  vidFormsvacka(spel, häst, min);
  /* Ägaren minns vad hens häst gör hos dig. Sporten skalas med ägar-
     typens resultatkänsla (kap 7); starten i sig är också en kontakt.
     ägarrelation(…, 0) behåller hästerbjudande-scenen vid ≥ 80. */
  if (häst.ägare) {
    ägarSport(spel, häst.ägare, min.ur ? -3 : vann ? 8 : pall ? 4 : -1);
    ägarEfterStart(spel, häst);
    ägarrelation(spel, häst.ägare, 0);
  }
  if ((spel.säsong ?? 1) === 0 && spel.prolog)
    spel.prolog.sistaResultat = { häst: häst.namn, plats: min.ur ? null : min.plats, ur: !!min.ur };
  /* Hemmapubliken. På hemmabanan går folk och man får del av entrén —
     ekonomiskt skäl att bygga sitt namn där man bor. */
  const hemmabana = spel.hemmabana && BANOR[spel.hemmabana];
  let publik = 0;
  if (hemmabana && lopp.banaNamn === hemmabana.namn) {
    publik = 1000 + Math.round(brutto * 0.08 / 100) * 100;
    spel.kassa += publik;
  }
  /* Vinst i ett fint lopp kan ge en INBJUDAN — arrangörer vill ha
     vinnare i sina fält. Gäller om två veckor, tackar man inte ja
     genom att starta förfaller den. */
  if (vann && (lopp.storlopp || (lopp.pris?.[0] ?? 0) >= 40000) && !spel.inbjudan && slump() < 0.55) {
    spel.inbjudan = { vecka: spel.vecka + 2, häst: häst.namn };
    skrivPress(spel, `${häst.namn} inbjuden till arrangörslopp`,
      `Segern i ${lopp.kortnamn || lopp.namn} öppnade dörren`, "positiv");
  }
  const skadaFöre = häst.skada;
  if (slump() < (häst.energi < 25 ? 0.18 : 0.05)) häst.skada = läkning(spel, int(1, 2));
  if (dåligDag && slump() < 0.35) häst.skada = Math.max(häst.skada, läkning(spel, int(1, 2)));
  if (häst.skada > 0 && skadaFöre === 0) vidSkada(spel, häst, häst.skada);

  /* Sponsorernas bokföring: kraven räknas och segerbonusen betalas ut. */
  sponsorEfterLopp(spel, { lopp, vann }).forEach((r) => spel.logg.push(r));

  /* PRESSENS MINNE (kap 5.4): vad du sa före loppet arkiveras med hur
     det gick — det är ur den historiken frågorna med udd ställs. */
  häst.presshistorik = [{
    val: häst.senastePressval ?? "neutral",
    plats: min.ur ? null : min.plats, ur: !!min.ur,
  }, ...(häst.presshistorik ?? [])].slice(0, 6);
  delete häst.senastePressval;

  /* FAVORITFACIT (kap 5.5): statistikern räknar, och krönikören slår
     till först när facit motiverar det — tre favoritmissar i följd är
     ett mönster, inte otur. En pallplats som favorit nollställer. */
  if (varFavorit) {
    spel.favoritfacit = [{ vann, plats: min.ur ? null : min.plats, ur: !!min.ur },
      ...(spel.favoritfacit ?? [])].slice(0, 8);
    if (pall) {
      spel.favoritkritikSkriven = false;
    } else if ((spel.favoritfacit.slice(0, 3).filter((f) => f.ur || (f.plats ?? 9) > 3).length >= 3)
        && !spel.favoritkritikSkriven) {
      spel.favoritkritikSkriven = true;
      skrivPress(spel, `Tre spelarförtroenden — tre magplask för ${spel.stallnamn}`,
        `Spelarna har gjort ${spel.stallnamn}s hästar till favoriter tre gånger i rad. Ingen av dem nådde pallen. Mönster har orsaker.`,
        "dålig", null, 0, JOURNALISTER.krönikör);
    }
  }

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
      if (!spel.erbjudande && boxplats(spel) > 0) {
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
  /* Kuskkännedom byggs per häst och kusk — sex starter ger full effekt i
     galopprisk och spurttajming. Följer med i sparfilen eftersom den bor
     på hästen. Äldre sparfiler saknar fältet; ?? {} initierar det. */
  häst.kuskbekant = häst.kuskbekant ?? {};
  häst.kuskbekant[kusk.namn] = (häst.kuskbekant[kusk.namn] ?? 0) + 1;
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
      ägarSport(spel, häst.ägare, 10);
      ägarrelation(spel, häst.ägare, 0);
      häst.krav = plock(ÄGARKRAV);
      häst.kravStarter = 0;
      spel.renommé = klamp(spel.renommé + 2);
      skrivPress(spel, `${häst.ägare} förlänger med Björkhaga`, `Ägaren nöjd med ${häst.namn}.`, "bra");
    } else if (häst.kravStarter >= k.antal) {
      ägartext = { ton: "dålig", text: `${häst.ägare} drar tillbaka ${häst.namn} — kravet missades.` };
      ägarSport(spel, häst.ägare, -18);
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

  return { brutto, kuskandel, netto, publik, renΔ, relΔ, hypeΔ, troΔ, ägartext, dagstext, dåligDag };
}
