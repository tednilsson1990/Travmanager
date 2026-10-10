/**
 * PROV — KÖRLICENSEN (v137, 18.11: tränaren som kusk)
 *
 * Du själv som kusk: rätt form i väljaren (arvode noll, kuskandel
 * noll, lärlingsberättigad de första trettio), alltid bekräftad,
 * utvecklingen långsam mot ett ärligt tak — och världens tränare
 * kör sina egna, hash-avgjort och aldrig spelarens namn.
 */
import { säkraKörlicens, spelarKusk, bokförKörning, TRÄNARKUSKEN } from "./engine-korlicens.js";
import { kuskEfterNamn, lärlingsberättigad } from "./data-kuskar.js";
import { kuskbekräftelse } from "./engine-anmalan.js";
import { byggVärld, tränarkuskarna } from "./engine-varld.js";
import { sättRng, seedad } from "./engine-util.js";
import { nyHäst } from "./engine-hast.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: körlicensen\n");

{
  const spel = { stallnamn: "P" };
  säkraKörlicens(spel);
  const k = spelarKusk(spel);
  ok(k.arvode === 0 && k.andel === 0 && k.start === 38,
    "du kör gratis — men startförmågan är en nybörjares (38)");
  ok(k.lärling === true && lärlingsberättigad(k),
    "de första trettio körningarna räknas du som kårens återväxt");
  ok(kuskEfterNamn(TRÄNARKUSKEN, spel)?.tränarkusk === true,
    "uppslaget hittar dig när spelet skickas med");
  ok(kuskbekräftelse(spel, k, {}, [], {}).bekräftad === true,
    "ingen bekräftelse behövs — du svarar själv i luren");

  for (let i = 0; i < 40; i++) bokförKörning(spel, { plats: i % 4 === 0 ? 2 : 6 });
  const k2 = spelarKusk(spel);
  ok(k2.start > 48 && k2.start <= 62 && spel.körlicens.körda === 40,
    `fyrtio körningar senare: start ${k2.start} — bättre, aldrig Goop (tak 62)`);
  ok(k2.lärling === false, "efter trettio körningar är lärlingstiden över");
}

{
  sättRng(seedad(9));
  const spel = { stallnamn: "P", värld: byggVärld(20) };
  sättRng();
  const fält = spel.värld.hästar.slice(0, 60);
  tränarkuskarna(spel, fält);
  const egna = fält.filter((h) => h.kusk?.tränarkusk);
  ok(egna.length >= 8 && egna.length <= 32,
    `världens tränare kör egna i rimlig andel (${egna.length} av 60)`);
  ok(egna.every((h) => h.kusk.namn !== TRÄNARKUSKEN && h.kusk.start >= 40 && h.kusk.start <= 58),
    "AI-tränarkuskar bär sina egna namn och hyggliga, aldrig elit-attribut");
  const före = JSON.stringify(egna.map((h) => h.kusk.namn));
  const fält2 = spel.värld.hästar.slice(0, 60).map((h) => ({ ...h, kusk: undefined }));
  tränarkuskarna(spel, fält2);
  ok(JSON.stringify(fält2.filter((h) => h.kusk?.tränarkusk).map((h) => h.kusk.namn)) === före,
    "licenserna är hash-avgjorda — samma värld, samma körande tränare");
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
