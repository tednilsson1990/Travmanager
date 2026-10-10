/**
 * PROV — TRAVSÄLLSKAPET (v124, kap 24 etapp A)
 *
 * Invalet förtjänas (renommé + säsonger, avböjande gäller året),
 * motionen är deterministisk och en per säsong, rösten är EN av sju,
 * bifallen open stretch-motion ändrar hemmabanans ALLA lopp (dina
 * och världens via samma justering), breddpriserna höjer bara
 * breddloppen — och jävsflaggan sätts när egen vinning röstas igenom.
 */
import { invalsläge, säkraSällskap, säsongsmotion, rösta,
  justeraFörBanutveckling, MOTIONER } from "./engine-sallskap.js";
import { BANOR } from "./data-namnpaket.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: travsällskapet\n");

const banaUtanStretch = Object.keys(BANOR).find((k) => !BANOR[k].openStretch);
const nytt = () => ({ säsong: 3, vecka: 4, renommé: 50, hemmabana: banaUtanStretch,
  stallnamn: "Provgården", press: [], kassa: 100000 });

{
  const spel = nytt();
  ok(invalsläge(spel).kvalar, "renommé och säsonger räcker: valberedningen ringer");
  ok(!invalsläge({ ...spel, renommé: 20 }).kvalar, "utan renommé inget samtal — invalet förtjänas");
  const s = säkraSällskap(spel);
  s.avböjtSäsong = 3;
  ok(!invalsläge(spel).kvalar, "avböjt i år: valberedningen återkommer nästa säsong");
}

{
  const spel = nytt();
  säkraSällskap(spel).ledamot = true;
  const m1 = säsongsmotion(spel);
  const m2 = säsongsmotion(spel);
  ok(!!m1 && m1 === m2, "en motion per säsong — samma bord vid varje läsning");

  const före = JSON.stringify(m1.id);
  const spel2 = nytt(); säkraSällskap(spel2).ledamot = true;
  ok(JSON.stringify(säsongsmotion(spel2).id) === före,
    "motionsvalet är hash-avgjort: samma säsong och bana ger samma motion");

  const utfall = rösta(spel, m1.id, "ja");
  ok(utfall.motion.röster.ja + utfall.motion.röster.nej === 7,
    "rösterna är sju — din är en av dem");
  ok(rösta(spel, m1.id, "ja") === null, "avgjord motion röstas inte om");
}

{
  /* Open stretch-bifallet ändrar banans verkliga lopp. */
  const spel = nytt();
  säkraSällskap(spel).ledamot = true;
  spel.sällskap.motioner = [{ id: "openStretch", säsong: 3, utfall: null, dinRöst: null }];
  let r = null;
  for (let försök = 0; försök < 40 && (!r || r.motion.utfall !== "bifall"); försök++) {
    spel.sällskap.motioner[0].utfall = null;
    spel.hemmabana = banaUtanStretch; spel.säsong = 3 + försök;
    spel.sällskap.motioner[0].säsong = spel.säsong;
    r = rösta(spel, "openStretch", "ja");
  }
  ok(r?.motion.utfall === "bifall" && spel.banutveckling.openStretch === true,
    "bifallet skrivs till banutvecklingen");
  const hemma = BANOR[spel.hemmabana];
  const lopp = justeraFörBanutveckling(spel, { banaNamn: hemma.namn, nivå: 50, pris: [10000] });
  ok(lopp.openStretch === true, "hemmabanans lopp får öppet innerspår — dina och världens");
  ok(!justeraFörBanutveckling(spel, { banaNamn: "Annanstad", nivå: 50 }).openStretch,
    "andra banor rörs inte av sällskapets beslut");
  ok(r.jäv === true, "egen vinning som röstas igenom: jävsflaggan sätts");
}

{
  /* Breddpriserna höjer bara breddloppen. */
  const spel = nytt();
  spel.banutveckling = { breddpriser: true };
  const hemma = BANOR[spel.hemmabana];
  const bredd = justeraFörBanutveckling(spel, { banaNamn: hemma.namn, nivå: 40, pris: [20000, 10000], förstapris: 20000 });
  const elit = justeraFörBanutveckling(spel, { banaNamn: hemma.namn, nivå: 60, pris: [100000], förstapris: 100000 });
  ok(bredd.pris[0] === 22000 && bredd.förstapris === 22000,
    "breddloppets priser höjs tio procent");
  ok(elit.förstapris === 100000, "elitloppen lämnas orörda — det var breddens motion");
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
