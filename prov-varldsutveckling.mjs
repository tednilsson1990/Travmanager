/**
 * PROV — VÄRLDENS UTVECKLING (v111, 20.8 etapp A)
 *
 * Efter tio säsonger ska världen vara en annan — deterministiskt.
 * Åldrandet ur namnet, pensioneringarna äldst först och högst två per
 * skifte, lärlingen in varje säsong och sökbar med spel, sponsortypen
 * ut varannan — och den aktiva kåren speglar alltihop.
 */
import { utvecklaVärlden, kuskålder, skiftaTränare, renoveraBana, tränarålder, skiftaJournalist, signaturen } from "./engine-varldsutveckling.js";
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


/* ---------------- Tränargenerationerna & banorna (v150, 20.8 B) ---------------- */
{
  const stall = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1, namn: `Stall ${i + 1}`, tränare: `Tränare Nummer${i + 1}`,
    filosofi: { id: "x" }, styrka: 0.6, insprunget: 0, starter: 0, segrar: 0,
  }));
  const spel = { säsong: 1, stallnamn: "P", hemmabana: "nordstad", press: [],
    värld: { stall, hästar: [] } };

  /* Över tjugo säsonger ska skiften ske — men aldrig fler än ett per år. */
  const skiften = [];
  let flera = 0;
  for (let s = 2; s <= 24; s++) {
    spel.säsong = s;
    const p = skiftaTränare(spel);
    if (p.length > 1) flera++;
    if (p.length) skiften.push({ s, rubrik: p[0].rubrik });
  }
  ok(flera === 0, "högst ett tränarskifte per säsong (23 säsonger provade)");
  ok(skiften.length >= 3 && skiften.length <= 12,
    `generationsväxling i verklig takt (${skiften.length} skiften på 23 säsonger)`);
  ok((spel.tränarvärld?.skiften ?? []).length === skiften.length
    && spel.tränarvärld.skiften.every((x) => x.avgående !== x.tillträdande),
    "skiftena bokförs — och arvtagaren är aldrig den avgående");
  const namn = spel.värld.stall.map((st) => st.tränare);
  ok(new Set(namn).size === namn.length, "inga namnkrockar i tränarkåren efter skiftena");
  ok(spel.värld.stall.every((st) => st.styrka >= 0.3 && st.styrka <= 1.0),
    "styrkejusteringen håller sig inom världens ramar");
  const först = spel.tränarvärld.skiften[0];
  ok(tränarålder(först.avgående, först.säsong) >= 64,
    `den som lämnar har åldern inne (${tränarålder(först.avgående, först.säsong)} år)`);

  /* Banorna: renoveringar kommer, bokförs, och samma bana vilar sedan. */
  const spel2 = { säsong: 1, hemmabana: "nordstad", press: [] };
  let renoveringar = 0;
  for (let s = 2; s <= 24; s++) { spel2.säsong = s; renoveringar += renoveraBana(spel2).length; }
  ok(renoveringar >= 2 && renoveringar <= 12,
    `banorna rustar i lagom takt (${renoveringar} ombyggen på 23 säsonger)`);
  ok(Object.keys(spel2.banvärld?.renoverade ?? {}).length > 0
    && Object.values(spel2.banvärld.renoverade).every((s) => s >= 2),
    "ombyggena bokförs med säsong");

  /* Determinism — hela 20.8 B-lagret. */
  const spelB = { säsong: 1, stallnamn: "P", hemmabana: "nordstad", press: [],
    värld: { stall: Array.from({ length: 12 }, (_, i) => ({
      id: i + 1, namn: `Stall ${i + 1}`, tränare: `Tränare Nummer${i + 1}`,
      filosofi: { id: "x" }, styrka: 0.6, insprunget: 0, starter: 0, segrar: 0 })), hästar: [] } };
  for (let s = 2; s <= 24; s++) { spelB.säsong = s; skiftaTränare(spelB); }
  ok(JSON.stringify(spelB.tränarvärld.skiften) === JSON.stringify(spel.tränarvärld.skiften),
    "hash-avgjort: samma värld, samma generationsväxling");
}


/* ---------------- Journalisterna (v152, 20.8 C) ---------------- */
{
  const spel = { säsong: 1, press: [] };
  ok(signaturen(spel, "krönikör") === "Cecilia Ramnek",
    "innan något byte: grundsignaturen håller pennan");
  let byten = 0;
  for (let s = 2; s <= 24; s++) { spel.säsong = s; byten += skiftaJournalist(spel).length; }
  ok(byten >= 2 && byten <= 9, `redaktionen omsätts i lagom takt (${byten} byten på 23 säsonger)`);
  const roller = ["krönikör", "siffror", "nyheter"];
  const nu = roller.map((r) => signaturen(spel, r));
  ok(new Set(nu).size === 3, "tre olika pennor — aldrig samma namn på två spalter");
  ok((spel.pressvärld.tidigare ?? []).length === byten
    && spel.pressvärld.tidigare.every((x) => !nu.includes(x.namn)),
    "de som lagt ner pennan skriver inte längre");

  const spelB = { säsong: 1, press: [] };
  for (let s = 2; s <= 24; s++) { spelB.säsong = s; skiftaJournalist(spelB); }
  ok(JSON.stringify(spelB.pressvärld?.journalister) === JSON.stringify(spel.pressvärld.journalister),
    "hash-avgjort: samma karriär, samma redaktion");
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV FÖLL\n`);
process.exit(fel === 0 ? 0 : 1);
