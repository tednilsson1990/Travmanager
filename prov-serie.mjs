/**
 * PROV — SERIERNA SOM GYM-TRAPPA (v120, plan 18.10 + 20.5, kap 22 prio 1)
 *
 * Poängen bokförs ur körda lopp (rätt skala, avdelningar till samma
 * serie, bortkörda utan poäng), tabellen sorterar på poäng och
 * effektivitet, korningen stämplar den AVSLUTADE säsongen, egen
 * mästare ger märket i troférummet — och trappan nollas till ny säsong.
 */
import { bokförSeriepoäng, serietabell, koraSeriemästare, serienyckel, SERIEPOÄNG,
  finalkandidater, finallopp, finalfält, registreraFinalresultat } from "./engine-serie.js";
import { uttagning, delaFält } from "./engine-anmalan.js";
import { lärlingsberättigad, KUSKAR } from "./data-kuskar.js";
import { rustaFält } from "./engine-varld.js";
import { sättRng, seedad } from "./engine-util.js";
import { nyHäst } from "./engine-hast.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: serierna som gym-trappa\n");

const rad = (namn, plats, egen = false) => ({ häst: { namn, egen }, plats, ur: false });

{
  ok(serienyckel({ kortnamn: "Bronsserien avd 2" }) === "Bronsserien"
    && serienyckel({ kortnamn: "Vårfavoriten" }) === null,
    "avdelningarna hör till sin serie — och engångslopp är ingen serie");

  const spel = { säsong: 1, veckor: 18, stallnamn: "Björkhaga", press: [] };
  const lopp = { kortnamn: "Bronsserien avd 1" };
  bokförSeriepoäng(spel, lopp, [
    rad("Kometen", 1), rad("Blixten", 2), rad("Vinden", 3),
    { häst: { namn: "Oturen" }, plats: null, ur: true },
  ]);
  bokförSeriepoäng(spel, { kortnamn: "Bronsserien avd 2" }, [
    rad("Blixten", 1), rad("Egna Stjärnan", 2, true),
  ]);
  const t = serietabell(spel, "Bronsserien");
  ok(t[0].namn === "Blixten" && t[0].poäng === SERIEPOÄNG[1] + SERIEPOÄNG[0],
    `tabelltoppen räknar över deltävlingarna: ${t[0].poäng} p`);
  ok(t.find((r) => r.namn === "Egna Stjärnan")?.egen === true,
    "din häst bär egen-markeringen i tabellen");
  ok(!t.some((r) => r.namn === "Oturen"), "bortkörd ger inga poäng");
  ok(t[0].poäng === 27 && t[1].namn === "Kometen",
    "sorteringen: poäng först, färre starter bryter lika");

  /* Korningen — som i säsongsskiftet: EFTER säsongsräknaren. */
  spel.seriepoäng["Bronsserien"]["Egna Stjärnan"].poäng = 99;
  spel.säsong = 2;
  const korning = koraSeriemästare(spel, 1);
  ok(spel.seriemästare[0].häst === "Egna Stjärnan" && spel.seriemästare[0].säsong === 1,
    "mästaren stämplas med den AVSLUTADE säsongen");
  ok(korning.troféer.length === 1 && korning.troféer[0].typ === "seriemästare"
    && korning.troféer[0].text.includes("säsong 1"),
    "egen mästare: märket till troférummet, rätt säsong i texten");
  ok(korning.press.some((p) => p.byline.includes("troférum")),
    "pressen skriver — och vet att märket är ditt");
  ok(Object.keys(spel.seriepoäng).length === 0,
    "trappan nollas: ny säsong, nya deltävlingar");

  /* Utan segernivå ingen mästare — tunn tabell korar ingen. */
  bokförSeriepoäng(spel, { kortnamn: "Stoserien avd 1" }, [rad("Ensamma", 4)]);
  const tom = koraSeriemästare(spel, 2);
  ok(tom.press.length === 0, "en fyra på hela säsongen gör ingen till mästare");
}

/* ---------- Finalveckan (v130, 18.10 B) ---------- */
{
  const spel = { säsong: 1, vecka: 10, veckor: 18, stallnamn: "Björkhaga",
    press: [], stall: [], värld: { hästar: [], stall: [] } };
  /* Tio poängsatta hästar i Bronsserien — nian och tian ska utanför. */
  for (let i = 1; i <= 10; i++) {
    const namn = `Finalist ${i}`;
    bokförSeriepoäng(spel, { kortnamn: "Bronsserien avd 1" },
      Array.from({ length: i }, () => rad(namn, 1, i === 3)).map((r, j) =>
        ({ ...r, plats: 1 })));
  }
  ok(finallopp(spel).length === 0, "före sista veckan finns inga finallopp");

  spel.vecka = 18;
  const finaler = finallopp(spel);
  const bronsfinal = finaler.find((l) => l.serie === "Bronsserien");
  ok(!!bronsfinal && bronsfinal.final === true && bronsfinal.startande === 8,
    "sista veckan: Bronsseriens final finns, åtta platser");
  ok(bronsfinal.finalnamn.length === 8 && bronsfinal.finalnamn[0] === "Finalist 10"
    && !bronsfinal.finalnamn.includes("Finalist 1"),
    "fältet är seriens åtta främsta i poängordning — ettan och tvåan i poäng hamnar utanför");
  ok(bronsfinal.förstapris > 0 && bronsfinal.dist > 0 && bronsfinal.banaNamn,
    "finalen ärver seriens proposition med förhöjda pengar");

  /* Poängen stängda: finalresultat ger inga seriepoäng. */
  const poängFöre = serietabell(spel, "Bronsserien")[0].poäng;
  bokförSeriepoäng(spel, bronsfinal, [rad("Finalist 10", 1)]);
  ok(serietabell(spel, "Bronsserien")[0].poäng === poängFöre,
    "finalen ger titeln — aldrig poäng");

  /* Uttagningen: kvalad in, okvalad ut. */
  spel.stall = [{ id: 1, namn: "Finalist 3", skada: 0 }, { id: 2, namn: "Okvalad", skada: 0 }];
  spel.värld.hästar = bronsfinal.finalnamn.filter((n) => n !== "Finalist 3")
    .map((n, i) => ({ id: 100 + i, namn: n }));
  const med = uttagning(spel, bronsfinal, spel.stall[0], []);
  ok(med.utfall === "med" && med.final === true && med.fält.includes(spel.stall[0]),
    "kvalad häst: uttagen, och fältet bär hennes identitet");
  ok(uttagning(spel, bronsfinal, spel.stall[1], []).utfall === "ej med",
    "okvalad häst: finalen är stängd");
  ok(med.fält[0].spår === 1 && med.fält[0].namn === "Finalist 10",
    "spåren efter poängordningen — seriesegraren innerst");

  /* Korningen föredrar finalen och nollar den. */
  registreraFinalresultat(spel, "Bronsserien", "Finalist 3", true);
  spel.säsong = 2;
  const korning = koraSeriemästare(spel, 1);
  const mästare = spel.seriemästare.find((m) => m.serie === "Bronsserien");
  ok(mästare?.häst === "Finalist 3" && mästare.viaFinal === true && mästare.egen === true,
    "finalvinnaren koras — före poängtoppen");
  ok(korning.troféer.some((t) => t.text.includes("finalseger")),
    "egen finalseger: märket säger att det var finalen");
  ok(Object.keys(spel.finalresultat ?? {}).length === 0,
    "finalresultaten nollas med trappan");
}

/* ---------- Seedad delning (v140, 18.10) ---------- */
{
  /* 24 anmälda till 12 platser i ett serielopp: två avdelningar,
     seedarna slingras, stallkamrater sprids. */
  const anmälda = Array.from({ length: 24 }, (_, i) => ({
    namn: `Seedad ${i + 1}`, intjänat: (24 - i) * 10000,
    stallId: Math.floor(i / 2) + 1,       /* par av stallkamrater */
    resultat: [],
  }));
  const avd = delaFält(anmälda, { kortnamn: "Silverserien avd", startande: 12, id: "s" }, 4);
  ok(avd.length === 2 && Math.abs(avd[0].length - avd[1].length) <= 1,
    "serielopp delas i jämna avdelningar");
  const ettansAvd = avd.findIndex((a) => a.some((h) => h.namn === "Seedad 1"));
  const tvåansAvd = avd.findIndex((a) => a.some((h) => h.namn === "Seedad 2"));
  ok(ettansAvd !== tvåansAvd, "seedningen slingrar: ettan och tvåan i olika avdelningar");
  const krockar = avd.reduce((n, a) => {
    const räkna = {};
    a.forEach((h) => { räkna[h.stallId] = (räkna[h.stallId] ?? 0) + 1; });
    return n + Object.values(räkna).filter((x) => x > 1).length;
  }, 0);
  ok(krockar <= 2, `tränarspridningen håller: ${krockar} stallkrockar av tolv par`);

  /* Vanliga lopp rörs inte: hash-lottningen består. */
  const vanligt = delaFält(anmälda.map((h) => ({ ...h })), { kortnamn: "Vardagslopp", startande: 12, id: "v" }, 4);
  ok(vanligt.length === 2, "vanliga lopp delas som förut — seedningen läcker inte");
}

/* ---------- Lärlingsregeln (v134, 18.6) ---------- */
{
  const berättigade = KUSKAR.filter(lärlingsberättigad);
  ok(berättigade.length >= 15 && berättigade.length <= 30,
    `kårens återväxt är lagom stor (${berättigade.length} licensierade)`);

  sättRng(seedad(5));
  const fält = Array.from({ length: 10 }, (_, i) => {
    const h = nyHäst({ ålder: 5 }); h.spår = i + 1; return h;
  });
  rustaFält(fält, { kortnamn: "Lärlingsserien avd 1", id: "l1", dist: 2140 });
  sättRng();
  ok(fält.every((h) => !h.kusk || lärlingsberättigad(h.kusk)),
    "världens lärlingslopp rustas uteslutande med licensierade");

  sättRng(seedad(5));
  const fält2 = Array.from({ length: 10 }, (_, i) => {
    const h = nyHäst({ ålder: 5 }); h.spår = i + 1; return h;
  });
  rustaFält(fält2, { kortnamn: "Bronsserien avd 1", id: "b1", dist: 2140 });
  sättRng();
  ok(fält2.some((h) => h.kusk && !lärlingsberättigad(h.kusk)),
    "övriga serier rustas som förut — regeln läcker inte");
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
