/**
 * PROV — VERKSAMHETEN (v84): stallmötet (plan 4.1), ägarsystemet (kap 7)
 * och sponsorerna (kap 8).
 *
 * Motorerna prövas fristående med ett minimalt spelobjekt — samma sätt
 * som de anropas från veckomotorn. skrivPress stubbas: proven bryr sig
 * om VAD som händer, inte om rubriksättningen.
 */
import { sättRng, seedad } from "./engine-util.js";
import { veckoslots, slotsAnvända, verkställVeckoslots, läggPlanMedSlots, ärKrävande }
  from "./engine-stallmote.js";
import { ägartyp, säkraÄgarprofil, ägarSport, ägarKontakt, ägarVecka, hållMöte, ägarlista }
  from "./engine-agare.js";
import { säkraSponsorer, sponsorVecka, teckna, sponsorEfterLopp, sponsorSäsongsskifte,
  kravläge, resekostnad, foderrabatt, SPONSORTYPER } from "./engine-sponsor.js";
import { ÄGARTYPER, SPONSORNAMN } from "./data-agare.js";

let fel = 0;
const ok = (villkor, text) => {
  if (villkor) console.log("  ✓ " + text);
  else { console.log("  ✗ " + text); fel++; }
};

const nyttSpel = () => ({
  säsong: 2, vecka: 5, veckor: 20, stallnamn: "Provstallet",
  kassa: 100000, renommé: 50, stall: [], logg: [], press: [],
  anläggning: { boxar: 8, rakbana: false, backe: false, vattenband: false },
  ägarrelationer: {}, hemmabana: null,
});
const nyHäst = (namn, träning = "lugnt", ägare = null) => ({
  id: Math.random(), namn, träning, skada: 0, form: 50, energi: 80, ägare,
  krav: ägare ? { text: "en seger inom sex starter", typ: "seger", antal: 6 } : null,
  kravStarter: 0,
});
const press = () => {};   // stubben — proven läser tillstånd, inte rubriker

console.log("PROV: verksamheten\n");

/* ---------- Stallmötet (plan 4.1) ---------- */
{
  const spel = nyttSpel();
  ok(veckoslots(spel) === 3, "grundorganisationen orkar 3 hårda pass");
  spel.anläggning.rakbana = true;
  spel.anläggning.backe = true;
  spel.förstaman = { namn: "Test Testsson", profil: "taktiker" };
  ok(veckoslots(spel) === 6, "rakbana, backe och förstaman ger 6");

  spel.anläggning.rakbana = false; spel.anläggning.backe = false; spel.förstaman = null;
  spel.stall = ["A", "B", "C", "D", "E"].map((n) => nyHäst(n, "kvalitet"));
  ok(slotsAnvända(spel) === 5, "fem snabbjobb räknas som fem slots");
  const utfall = verkställVeckoslots(spel);
  ok(utfall.nedflyttade.length === 2 && slotsAnvända(spel) === 3,
    "överskottet flyttas ned till lugnt jobb: " + utfall.nedflyttade.join(", "));
  ok(spel.stall[3].träning === "lugnt" && spel.stall[0].träning === "kvalitet",
    "stallordningen avgör vilka som får platserna");

  /* Förstamannens plan håller sig inom slotsen. */
  spel.förstaman = { namn: "Test Testsson", profil: "pådrivare" };
  spel.stall = Array.from({ length: 8 }, (_, i) => nyHäst("H" + i, "vila"));
  spel.stall.forEach((h, i) => { h.form = 30 + i * 5; h.energi = 80; });
  läggPlanMedSlots(spel, () => ({ träning: "kvalitet", motiv: "prov" }));
  ok(slotsAnvända(spel) <= veckoslots(spel),
    `planen ryms i veckan (${slotsAnvända(spel)}/${veckoslots(spel)})`);
  ok(ärKrävande(spel.stall[0].träning) && !ärKrävande(spel.stall[7].träning),
    "lägst form prioriteras till de hårda passen");
}

/* ---------- Ägarna (kap 7) ---------- */
{
  ok(ägartyp("Stall Vinterfrid") === ägartyp("Stall Vinterfrid"),
    "ägartypen är deterministisk — samma ägare är samma person");
  ok(Object.keys(ÄGARTYPER).length === 5, "fem ägartyper (kap 7.1)");

  const spel = nyttSpel();
  /* Migrering: gammal sparfil har bara relation + hästerbjudet. */
  spel.ägarrelationer["Gamla Ägaren"] = { relation: 72, hästerbjudet: false };
  const r = säkraÄgarprofil(spel, "Gamla Ägaren");
  ok(r.typ && r.sport === 72 && typeof r.komm === "number",
    "äldre sparfiler får typ och dimensioner utan att tappa relationen");

  /* Resultatkänslan: samma smäll ska svida olika. */
  const namnAv = (typ) => {
    /* leta upp ett namn som hashas till typen */
    for (const kandidat of ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T"]) {
      if (ägartyp(kandidat) === typ) return kandidat;
    }
    return null;
  };
  const hård = namnAv("storsatsare"), mjuk = namnAv("småägare");
  if (hård && mjuk) {
    const s2 = nyttSpel();
    säkraÄgarprofil(s2, hård).sport = 60;
    säkraÄgarprofil(s2, mjuk).sport = 60;
    ägarSport(s2, hård, -10);
    ägarSport(s2, mjuk, -10);
    ok(s2.ägarrelationer[hård].sport < s2.ägarrelationer[mjuk].sport,
      "storsatsaren tar en smäll hårdare än småägaren");
  } else ok(false, "hittade testnamn för båda ägartyperna");

  /* Tystnaden svalnar; mötet värmer. */
  const s3 = nyttSpel();
  s3.stall = [nyHäst("Provhästen", "lugnt", "Stall Kvarnbacken")];
  const r3 = säkraÄgarprofil(s3, "Stall Kvarnbacken");
  const kommFöre = r3.komm;
  sättRng(seedad(7));
  ägarVecka(s3, press);
  ok(r3.komm < kommFöre, "en tyst vecka svalnar kommunikationen");
  const svar = hållMöte(s3, "Stall Kvarnbacken", "lyssna");
  ok(r3.komm > kommFöre && !!svar.text, "mötet värmer — och ägaren svarar");

  /* Tålamod förlänger kravet, en gång. */
  const antalFöre = s3.stall[0].krav.antal;
  hållMöte(s3, "Stall Kvarnbacken", "tålamod");
  ok(s3.stall[0].krav.antal === antalFöre + 2, "be om tålamod ger två starter till");
  hållMöte(s3, "Stall Kvarnbacken", "tålamod");
  ok(s3.stall[0].krav.antal === antalFöre + 2, "— men bara en gång per krav");

  /* Riktig missnöjdhet: hästen flyttas. */
  const s4 = nyttSpel();
  s4.stall = [nyHäst("Olyckan", "lugnt", "Ulriksdals Invest")];
  const r4 = säkraÄgarprofil(s4, "Ulriksdals Invest");
  r4.sport = 5; r4.komm = 5; r4.relation = 5;
  sättRng(seedad(1));   // slump() < 0.5 vid första dragningen med det här fröet?
  let lämnade = [];
  for (let i = 0; i < 6 && lämnade.length === 0; i++) lämnade = ägarVecka(s4, press);
  ok(lämnade.length === 1 && lämnade[0].namn === "Olyckan",
    "en riktigt missnöjd ägare flyttar sin häst");

  /* Kontorets lista. */
  const s5 = nyttSpel();
  s5.stall = [nyHäst("Ett", "lugnt", "Team Solkatt"), nyHäst("Två", "lugnt", "Team Solkatt")];
  const lista = ägarlista(s5);
  ok(lista.length === 1 && lista[0].hästar.length === 2 && lista[0].typinfo,
    "ägarlistan grupperar hästar per ägare med typinfo");
}

/* ---------- Sponsorerna (kap 8) ---------- */
{
  ok(Object.keys(SPONSORTYPER).every((id) => (SPONSORNAMN[id] ?? []).length > 0),
    "varje sponsortyp har namn i datalagret (namnregeln)");

  const spel = nyttSpel();
  säkraSponsorer(spel);
  /* Teckna ett transportavtal och ett foderavtal direkt. */
  teckna(spel, { typId: "transport", typnamn: "Transportföretag", namn: "Provfrakt",
    perVecka: 1500, segerbonus: 2000, krav: { ...SPONSORTYPER.transport.krav },
    förmån: { typ: "transport", text: "halverad resekostnad" }, gällerTill: 9 });
  ok(resekostnad(spel) === 600, "transportförmånen halverar resekostnaden");
  spel.stall = [nyHäst("A"), nyHäst("B"), nyHäst("C")];
  teckna(spel, { typId: "foder", typnamn: "Foderleverantör", namn: "Provfoder",
    perVecka: 1200, segerbonus: 1500, krav: { ...SPONSORTYPER.foder.krav },
    förmån: { typ: "foder", text: "driften sänks" }, gällerTill: 9 });
  ok(foderrabatt(spel) === 1200, "foderförmånen sänker driften 400 kr per häst");

  const kassaFöre = spel.kassa;
  sättRng(seedad(3));
  sponsorVecka(spel);
  ok(spel.kassa === kassaFöre + 2700, "veckoersättningen betalas ut (1500 + 1200)");

  /* Bokföringen efter lopp: starter, hemmastarter, segerbonus. */
  spel.hemmabana = null;
  const rader = sponsorEfterLopp(spel, { lopp: { banaNamn: "Provbanan" }, vann: true });
  ok(spel.sponsorer[0].status.starter === 1 && spel.sponsorer[0].status.segrar === 1,
    "starter och segrar bokförs på avtalet");
  ok(rader.length === 2 && spel.kassa === kassaFöre + 2700 + 2000 + 1500,
    "segerbonusen betalas ut från båda avtalen");

  /* Säsongsskiftet: uppfyllt förnyar med bättre villkor, missat bryter. */
  spel.sponsorer[0].status = { starter: 12, hemmastarter: 0, segrar: 3 };   // krav: 12 starter ✓
  spel.sponsorer[1].status = { starter: 2, hemmastarter: 0, segrar: 0 };    // krav: 10 starter ✗
  const renomméFöre = spel.renommé;
  let pressrader = 0;
  sponsorSäsongsskifte(spel, () => { pressrader++; });
  ok(spel.sponsorer.length === 1 && spel.sponsorer[0].namn === "Provfrakt",
    "uppfyllt krav förnyar, missat bryter");
  ok(spel.sponsorer[0].perVecka === 1700, "förnyelsen ger tio procent bättre villkor (avrundat)");
  ok(spel.renommé === renomméFöre - 2 && pressrader === 2,
    "det brutna avtalet kostar renommé — och båda utfallen står i pressen");

  /* Erbjudandeflödet: rätt renommé krävs, och erbjudanden förfaller. */
  const s2 = nyttSpel();
  s2.renommé = 10;
  säkraSponsorer(s2);
  sättRng(seedad(11));
  for (let v = 1; v <= 30; v++) { s2.vecka = ((v - 1) % 20) + 1; sponsorVecka(s2); }
  ok(s2.sponsorerbjudanden.every((e) => SPONSORTYPER[e.typId].renommé <= 10),
    "lågt renommé får bara erbjudanden det kvalar till");
}

sättRng();
console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
