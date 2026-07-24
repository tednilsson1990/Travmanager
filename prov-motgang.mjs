/**
 * PROV — motgången som berättelse: `node prov-motgang.mjs`
 *
 * Trösklarna ÄR designen: en vardagshäst som ömmar ska stanna i loggen,
 * en stjärna ska bli en nyhet, comebacken ska sluta cirkeln, favoriten
 * ska falla med rätt fallhöjd, och svackans fråga ska ställas en gång
 * och stängas av nästa pallplats.
 */
import { vidSkada, vidFavoritfall, vidFormsvacka } from "./engine-motgang.js";
import "./engine-lyssnare.js";

let fel = 0;
const prov = (namn, villkor) => {
  console.log(`${villkor ? "  ok  " : "  FEL "} ${namn}`);
  if (!villkor) fel++;
};
const nyttProvspel = () => ({ säsong: 4, vecka: 8, stallnamn: "Björkhaga",
  krönika: [], press: [], logg: [], scener: [], troférum: [], rivaliteter: {},
  huvudnyhet: null, spelförtroende: 50, renommé: 50, kuskrelation: {},
  förstaman: { namn: "Elin Ranstad", profil: "fostrare" },
  prolog: { aktiv: false, mentor: { namn: "Gunnar Falk" } },
  stall: [], värld: { hästar: [] } });
const stjärna = (extra = {}) => ({ id: 1, namn: "Vindarnas Ö", segrar: 6,
  intjänat: 900000, hype: 60, milstolpar: [], ...extra });
const vardaghäst = () => ({ id: 2, namn: "Trygge", segrar: 1, intjänat: 80000,
  hype: 15, milstolpar: [] });

console.log("\nPROV 1 — skadan: stjärnan blir nyhet, vardagshästen inte");
{
  const spel = nyttProvspel();
  vidSkada(spel, vardaghäst(), 2);
  prov("vardagshästen stannar i loggen", spel.krönika.length === 0 && spel.scener.length === 0);
  const h = stjärna(); spel.stall = [h];
  vidSkada(spel, h, 3);
  prov("stjärnskadan registrerades", spel.krönika.some((x) => x.typ === "stjärnskada"));
  prov("lång frånvaro blev tidningssida",
    spel.scener.some((s) => s.stil === "tidning" && s.rubrik.includes("BORTA 3 VECKOR")));
  prov("förstamannens plan i brödtexten",
    spel.scener[0].brödtext.some((t) => t.includes("Elin Ranstad")));
  prov("comeback-bågen armerades", !!h.skadenyhet);

  const spel2 = nyttProvspel();
  vidSkada(spel2, stjärna(), 1);
  prov("kort frånvaro blir press, inte scen",
    spel2.press.length > 0 && spel2.scener.length === 0);

  const spel3 = nyttProvspel();
  const h3a = stjärna(), h3b = stjärna({ id: 9, namn: "Nummer Två" });
  spel3.stall = [h3a, h3b];
  vidSkada(spel3, h3a, 3);
  vidSkada(spel3, h3b, 3);
  prov("högst en skadeförstasida per säsong",
    spel3.scener.filter((s) => s.etikett === "SKADEALARM").length === 1);
  prov("den andra blev pressnotis ändå",
    spel3.press.filter((p) => p.rubrik.includes("skadad")).length === 2);
  prov("bara förstasidans häst bär comeback-bågen",
    h3a.skadenyhet.blevScen === true && h3b.skadenyhet.blevScen === false);
}

console.log("\nPROV 2 — comebacken sluter cirkeln");
{
  const spel = nyttProvspel();
  const h = stjärna({ skadenyhet: { säsong: 4, vecka: 5, veckor: 3, blevScen: true }, friskVecka: 7, starter: 20 });
  spel.stall = [h];
  const { registreraHändelse } = await import("./engine-handelser.js");
  registreraHändelse(spel, { typ: "comeback_7", betydelse: 45,
    aktörer: { hästId: 1, hästNamn: h.namn }, data: {} });
  prov("comebackscenen köades", spel.scener.some((s) => s.rubrik === "TILLBAKA — OCH FÖRBI ALLA"));
  prov("och bågen avväpnades", !h.skadenyhet);
  registreraHändelse(spel, { typ: "comeback_9", betydelse: 45,
    aktörer: { hästId: 1, hästNamn: h.namn }, data: {} });
  prov("utan armerad båge: ingen scen till",
    spel.scener.filter((s) => s.rubrik === "TILLBAKA — OCH FÖRBI ALLA").length === 1);
}

console.log("\nPROV 3 — favoritfallet: fallhöjden avgör");
{
  const spel = nyttProvspel();
  const h = stjärna(); spel.stall = [h];
  vidFavoritfall(spel, { häst: h, lopp: { kortnamn: "Bronsserien" },
    min: { ur: false, plats: 5, streck: 30 } });
  prov("30 % är ingen tung favorit — inget fall", spel.krönika.length === 0);
  vidFavoritfall(spel, { häst: h, lopp: { kortnamn: "Bronsserien" },
    min: { ur: false, plats: 2, streck: 45 } });
  prov("pallplats är inget fall", spel.krönika.length === 0);
  vidFavoritfall(spel, { häst: h, lopp: { kortnamn: "Bronsserien" },
    min: { ur: false, plats: 5, streck: 45 } });
  prov("vardagsfallet blev press, inte scen",
    spel.krönika.some((x) => x.typ === "favoritfall") && spel.scener.length === 0);
  const troFöre = spel.spelförtroende;
  vidFavoritfall(spel, { häst: h, lopp: { kortnamn: "Kungsloppet", storlopp: true },
    min: { ur: false, plats: 6, streck: 52 }, dåligDag: true });
  prov("storloppsfallet blev tidningssida",
    spel.scener.some((s) => s.etikett === "STORLOPPSFACIT"));
  prov("dagsformen mildrar rubriken",
    spel.scener[0].rubrik.includes("INTE SIG SJÄLV"));
  prov("spelförtroendet tog stryk", spel.spelförtroende < troFöre);
}

console.log("\nPROV 4 — formsvackan: frågan ställs en gång och stängs av pallen");
{
  const spel = nyttProvspel();
  const h = stjärna(); spel.stall = [h];
  vidFormsvacka(spel, h, { ur: false, plats: 6 });
  vidFormsvacka(spel, h, { ur: true });
  prov("två missar: ingen fråga än", !spel.press.some((p) => p.rubrik.startsWith("Vad är det med")));
  vidFormsvacka(spel, h, { ur: false, plats: 8 });
  prov("tredje missen väcker frågan",
    spel.press.some((p) => p.rubrik === "Vad är det med Vindarnas Ö?")
    && spel.krönika.some((x) => x.typ === "formsvacka"));
  vidFormsvacka(spel, h, { ur: false, plats: 9 });
  prov("fjärde missen upprepar den inte",
    spel.press.filter((p) => p.rubrik.startsWith("Vad är det med")).length === 1);
  vidFormsvacka(spel, h, { ur: false, plats: 2 });
  prov("pallen bryter svackan med en god nyhet",
    spel.press.some((p) => p.rubrik.includes("Svackan bruten")) && !h.svackafråga && h.rakaMissar === 0);

  const spel2 = nyttProvspel();
  const t = vardaghäst(); spel2.stall = [t];
  for (let i = 0; i < 5; i++) vidFormsvacka(spel2, t, { ur: false, plats: 7 });
  prov("vardagshästens svacka är ingen nyhet", spel2.press.length === 0);
}

console.log(fel === 0 ? "\nALLA PROV OK\n" : `\n${fel} PROV MISSLYCKADES\n`);
process.exit(fel ? 1 : 0);
