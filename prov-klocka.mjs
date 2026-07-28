/**
 * PROV — KLOCKAN (v101, 20.1 etapp A)
 *
 * Stoppen ska slås ihop ärligt: en vecka utan anmälningar hoppar
 * direkt till nästa måndag, obesvarade anmälningar drar spelaren till
 * onsdagen, bekräftade till helgen — och hoppet som låter något
 * förfalla säger det PÅ KNAPPEN. Veckoväxlingen är injicerbar så att
 * övergångslogiken provas utan hela spelbygget.
 */
import { stoppFör, nästaStopp, hoppaFram, STOPPNAMN } from "./engine-klocka.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: klockan\n");

const spel = (extra = {}) => ({ vecka: 3, veckor: 18, stall: [], startadeLopp: [], anmälningar: [], ...extra });

/* ---------- Sammanslagning av tomma stopp ---------- */
{
  ok(nästaStopp(spel()).mål === "vecka",
    "vecka utan anmälningar: måndagen hoppar direkt till ny vecka");
  ok(stoppFör({}) === "måndag", "äldre sparfiler utan stoppfält läses som måndag");
  const s = spel({ anmälningar: [{ hästId: 1, loppId: "a" }] });
  ok(nästaStopp(s).mål === "onsdag", "obesvarad anmälan drar hoppet till onsdagen");
  const s2 = spel({ anmälningar: [{ hästId: 1, loppId: "a", status: "med" }], stopp: "måndag" });
  ok(nästaStopp(s2).mål === "helg", "bekräftad anmälan utan obesvarade: måndag hoppar direkt till helgen");
}

/* ---------- Övergångarna och förfallovarningen ---------- */
{
  const s = spel({ anmälningar: [{ hästId: 1, loppId: "a" }] });
  ok(hoppaFram(s, () => {}) === "onsdag" && s.stopp === "onsdag", "hoppet flyttar stoppet");
  /* Obesvarad kvar på onsdagen: nästa hopp är veckoväxling — med varning. */
  const steg = nästaStopp(s);
  ok(steg.mål === "vecka" && steg.etikett.includes("förfaller"),
    "hoppet förbi obesvarade besked varnar på knappen: " + steg.etikett);
  const s3 = spel({ stopp: "onsdag", anmälningar: [{ hästId: 1, loppId: "a", status: "med" }] });
  ok(nästaStopp(s3).mål === "helg", "bekräftad anmälan: onsdagen hoppar till helgen");
  s3.startadeLopp = ["a"];
  ok(nästaStopp(s3).mål === "vecka" && !nästaStopp(s3).etikett.includes("förfaller"),
    "kört lopp: helgen är klar, hoppet till ny vecka utan varning");
}

/* ---------- Veckoväxlingen ---------- */
{
  const s = spel({ stopp: "helg", anmälningar: [{ hästId: 1, loppId: "a", status: "med" }], startadeLopp: ["a"] });
  let kördes = 0;
  const mål = hoppaFram(s, () => { kördes++; });
  ok(mål === "vecka" && kördes === 1, "veckoväxlingen körs exakt en gång");
  ok(s.stopp === "måndag" && s.anmälningar.length === 0,
    "ny vecka: stoppet är måndag och anmälningslistan tömd");
  ok(Object.keys(STOPPNAMN).length === 3, "tre stopp — måndag, onsdag, helgen");
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
