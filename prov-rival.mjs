/**
 * PROV — RIVALEN OCH MENTORN (v118, storyarkitekturen 21.6 etapp A)
 *
 * Gary-draget: rivalen föds ur startervalet, tar den kaxigaste
 * kandidaten du lämnade, får ett eget stall i världen — och hästen
 * finns där PÅ RIKTIGT med nollmeriter. Rösterna: hälsnings-sms:et
 * tidigt, måndagsrösten efter rivalhästens start, mentorbrevet vid
 * genombrottet — och tystnaden när mentorn gått bort.
 */
import { sättRng, seedad } from "./engine-util.js";
import { byggVärld, föddRival } from "./engine-varld.js";
import { startervalskandidater } from "./engine-prolog.js";
import { byggInkorg } from "./engine-inkorg.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: rivalen och mentorn\n");

const nyttSpel = () => {
  sättRng(seedad(21));
  const spel = {
    säsong: 1, vecka: 19, veckor: 20, stallnamn: "Provgården", kassa: 40000,
    värld: byggVärld(8), stall: [], anmälningar: [], press: [], logg: [],
    karriär: { starter: 0, segrar: 0, prispengar: 0, storloppssegrar: 0 },
    förstaman: { namn: "Ulla Prov", profil: "taktiker" },
    prolog: { aktiv: false, mentor: { namn: "Gunnar Lidén", motto: "Hästen först.", borta: false } },
    sponsorer: [], kuskrelation: {}, ägarrelationer: {}, inkorgLästa: [],
    stopp: "måndag", huvudnyhet: null,
  };
  sättRng();
  return spel;
};

/* ---------- Födelsen ---------- */
{
  const spel = nyttSpel();
  sättRng(seedad(4));
  const val = startervalskandidater();
  sättRng();
  const min = val[1];                       /* du tar stayern */
  spel.stall.push(min);
  const stallFöre = spel.värld.stall.length;
  const rival = föddRival(spel, val.filter((h) => h !== min));
  ok(!!rival && rival.profil === "talangen",
    "rivalen tar den kaxigaste du lämnade — talangen före spetsaren");
  ok(spel.värld.stall.length === stallFöre + 1
    && spel.värld.stall.at(-1).rival === true,
    "rivalstallet står i världen, märkt som rivalens");
  const rh = spel.värld.hästar.find((h) => h.id === rival.hästId);
  ok(!!rh && rh.starter === 0 && rh.intjänat === 0 && rh.egen === false,
    "rivalhästen finns i världen med nollmeriter — jämbördig start");
  ok(föddRival(spel, val) === null, "rivalen föds bara en gång");

  /* Hälsnings-sms:et. */
  const sms = byggInkorg(spel).find((h) => h.roll === "Rivaltränare");
  ok(!!sms && sms.text.includes(rival.hästNamn),
    "hälsnings-sms:et nämner hästen han tog");

  /* Måndagsrösten efter rivalhästens helgstart. */
  rh.senasteStartVecka = spel.vecka - 1; rh.segrar = 2;
  const skryt = byggInkorg(spel).filter((h) => h.roll === "Rivaltränare");
  ok(skryt.some((h) => h.text.includes("seger nummer 2")),
    "måndagsrösten bygger på världens verkliga siffror");
}

/* ---------- Mentorbrevet ---------- */
{
  const spel = nyttSpel();
  spel.karriär.starter = 12;
  spel.stall.push({ id: 900, namn: "Provstjärnan", ålder: 4,
    genombrott: { säsong: 1, vecka: 18, lopp: "Vårfavoriten" }, resultat: [] });
  const brev = byggInkorg(spel).find((h) => h.roll === "Mentor");
  ok(!!brev && brev.typ === "mejl" && brev.lång.includes("Provstjärnan")
    && brev.lång.includes("Hästen först."),
    "mentorbrevet efter genombrottet — i mentorns röst, med hans motto");

  spel.prolog.mentor.borta = true;
  ok(!byggInkorg(spel).some((h) => h.roll === "Mentor"),
    "tystnaden är också berättelse: ingen skriver när mentorn är borta");
}

/* ---------- Mötet (v132, 21.6 B) ---------- */
{
  const spel = nyttSpel();
  spel.rival = { tränare: "Rival Rivalsson", stallnamn: "Stall Rivalsson",
    hästNamn: "Rivalhästen", hästId: 777, profil: "talangen" };
  spel.karriär.starter = 12;   /* förbi hälsningsfasen — mötet ska stå ensamt */
  spel.rivalmöte = { läge: "väntar", vecka: spel.vecka, säsong: spel.säsong, lopp: "Bronsserien" };
  ok(byggInkorg(spel).some((h) => h.roll === "Rivaltränare" && h.rubrik === "Samma lopp i helgen"),
    "startlistan satt: rivalen sms:ar före mötet");

  spel.rivalmöte = { läge: "avgjort", vecka: spel.vecka - 1, säsong: spel.säsong,
    lopp: "Bronsserien", minPlats: 1, rivalPlats: 4 };
  const efter = byggInkorg(spel).filter((h) => h.roll === "Rivaltränare");
  ok(efter.some((h) => h.text.includes("Grattis till segern")),
    "du vann mötet: rivalen gratulerar — nästan");
  ok(efter.length === 1, "mötesreaktionen tystar måndagsrösten — en röst, inte två");

  spel.rivalmöte = { läge: "avgjort", vecka: spel.vecka - 1, säsong: spel.säsong,
    lopp: "Bronsserien", minPlats: 5, rivalPlats: 1 };
  ok(byggInkorg(spel).some((h) => h.text.includes("tänker inte låtsas")),
    "rivalen vann: segerglädjen är torr men äkta");
}


/* ---------------- Rivaljakten (v172, 31:2) ---------------- */
{
  const { anmälningsläge } = await import("./engine-anmalan.js");
  const { veckansLopp } = await import("./data-kalender.js");
  const { sättRng, seedad } = await import("./engine-util.js");
  const { nyHäst } = await import("./engine-hast.js");
  sättRng(seedad(7));
  const hästar = Array.from({ length: 40 }, (_, i) => {
    const h = nyHäst({ ålder: 5 }); h.egen = false; h.stallId = 1 + (i % 6); return h;
  });
  sättRng();
  const rivalhäst = hästar[0];
  const egen = { id: 999, namn: "Egen", egen: true, ålder: 5, start: 55, fart: 55, styrka: 55,
    intjänat: 100000, starter: 10, segrar: 2, skada: 0, senasteStartVecka: 0,
    distans: { optimal: 2140, tolerans: 520 } };
  const grund = { säsong: 2, veckor: 18, stall: [egen],
    värld: { stall: [{ id: 1, namn: "Rivalstallet", filosofi: { vilaTröskel: 0, startvilja: 1 } }], hästar },
    rival: { hästId: rivalhäst.id, hästNamn: rivalhäst.namn, tränare: "Motståndaren", stallnamn: "Rivalstallet" } };
  let träffar = 0, körda = 0;
  for (let v = 1; v <= 18; v++) {
    for (const lopp of veckansLopp(v).slice(0, 2)) {
      const läge = anmälningsläge({ ...grund, vecka: v }, lopp, egen, []);
      körda++;
      if (läge.anmälda.some((h) => h.id === rivalhäst.id)) träffar++;
    }
  }
  ok(träffar >= 4 && träffar < körda * 0.6,
    `rivalen söker upp spelarens lopp i lagom takt (${träffar} av ${körda} uttagningar)`);
  /* Skadad rival jagar inte. */
  rivalhäst.skada = 3;
  let skadadeTräffar = 0;
  for (let v = 1; v <= 18; v++) {
    const lopp = veckansLopp(v)[0];
    if (anmälningsläge({ ...grund, vecka: v }, lopp, egen, []).anmälda.some((h) => h.id === rivalhäst.id)) skadadeTräffar++;
  }
  rivalhäst.skada = 0;
  ok(skadadeTräffar === 0, "en skadad rival stannar hemma");
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
