/**
 * PROV — VÄRLDENS UTVECKLING (v111, 20.8 etapp A)
 *
 * Efter tio säsonger ska världen vara en annan — deterministiskt.
 * Åldrandet ur namnet, pensioneringarna äldst först och högst två per
 * skifte, lärlingen in varje säsong och sökbar med spel, sponsortypen
 * ut varannan — och den aktiva kåren speglar alltihop.
 */
import { utvecklaVärlden, kuskålder } from "./engine-varldsutveckling.js";
import { KUSKAR, aktivaKuskar, kuskEfterNamn } from "./data-kuskar.js";

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: världens utveckling\n");

const nyttSpel = () => ({ säsong: 1, stallnamn: "Provstallet",
  sponsorer: [], press: [], kuskvärld: undefined, sponsorvärld: undefined });

/* ---------- Åldrandet ---------- */
{
  const k = KUSKAR[0].namn;
  ok(kuskålder(k, 1) >= 24 && kuskålder(k, 1) <= 49, `grundåldern ligger i spannet (${kuskålder(k, 1)} år)`);
  ok(kuskålder(k, 5) === kuskålder(k, 1) + 4, "åldern stiger en per säsong");
}

/* ---------- Tio säsonger ---------- */
{
  const spel = nyttSpel();
  const pressTotal = [];
  for (let s = 2; s <= 10; s++) {
    spel.säsong = s;
    pressTotal.push(...utvecklaVärlden(spel));
  }
  const kv = spel.kuskvärld;
  ok(kv.pensionerade.length >= 4, `kåren glesnar: ${kv.pensionerade.length} pensionerade på nio skiften`);
  ok(kv.pensionerade.every((namn) => kuskålder(namn, 11) >= 58),
    "ingen tvingas bort i förtid — alla pensionärer är 58+");
  ok(kv.lärlingar.length === 9, `en lärling per säsong: ${kv.lärlingar.length} debuterade`);
  const aktiva = aktivaKuskar(spel);
  ok(!aktiva.some((k) => kv.pensionerade.includes(k.namn))
    && kv.lärlingar.every((l) => aktiva.some((k) => k.namn === l.namn)),
    "aktiva kåren: pensionerade ute, lärlingarna inne");
  ok(kuskEfterNamn(kv.lärlingar[0].namn, spel)?.lärling === true,
    "lärlingen hittas med kuskEfterNamn när spelet skickas med");
  ok((spel.sponsorvärld.borta ?? []).length >= 3,
    `sponsorsfären omsätts: ${spel.sponsorvärld.borta.length} typer har lämnat`);
  ok(pressTotal.length >= kv.pensionerade.length + kv.lärlingar.length,
    "pressen berättar om varje förändring");

  /* Determinism: samma karriär ger samma värld. */
  const spel2 = nyttSpel();
  for (let s = 2; s <= 10; s++) { spel2.säsong = s; utvecklaVärlden(spel2); }
  ok(JSON.stringify(spel2.kuskvärld.pensionerade) === JSON.stringify(kv.pensionerade)
    && JSON.stringify(spel2.sponsorvärld.borta) === JSON.stringify(spel.sponsorvärld.borta),
    "hash-avgjort: samma karriär ger samma värld");
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
