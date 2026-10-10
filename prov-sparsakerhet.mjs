/**
 * PROV — SPARSÄKERHETEN (v149, kap 26 G)
 *
 * Autobackupen: tre rullande generationer, tagna inför varje NY vecka
 * — läget innan veckan kördes. Importen och återställningen: hård
 * validering, den liggande karriären röres aldrig förrän ersättaren
 * bevisat sig parsbar. localStorage mockas — motorn ska fungera mot
 * vilket lagringsskikt som helst.
 */

/* Mocken FÖRE importen — state-spel läser localStorage i funktioner. */
const lager = new Map();
globalThis.localStorage = {
  getItem: (k) => (lager.has(k) ? lager.get(k) : null),
  setItem: (k, v) => lager.set(k, String(v)),
  removeItem: (k) => lager.delete(k),
};

const { spara, ladda, importeraSparfil, listaBackuper, återställBackup, nyttSpel }
  = await import("./state-spel.js");

let fel = 0;
const ok = (v, t) => { if (v) console.log("  ✓ " + t); else { console.log("  ✗ " + t); fel++; } };

console.log("PROV: sparsäkerheten\n");

/* ---------------- Autobackupen: rullande, en per vecka ---------------- */
{
  const spel = nyttSpel();
  spel.säsong = 1; spel.vecka = 1; spel.uppstartKlar = true;
  spara(spel);
  ok(listaBackuper().length === 0, "första sparningen: inget att säkerhetskopiera än");

  spara(spel);                                     /* samma vecka igen */
  ok(listaBackuper().length === 0, "samma vecka sparas om utan ny backup");

  spel.vecka = 2; spel.kassa = 111000; spara(spel);
  let b = listaBackuper();
  ok(b.length === 1 && b[0].vecka === 1,
    "ny vecka: läget INNAN veckan lades överst i kedjan");

  spel.vecka = 3; spara(spel);
  spel.vecka = 4; spara(spel);
  spel.vecka = 5; spara(spel);
  b = listaBackuper();
  ok(b.length === 3 && b[0].vecka === 4 && b[1].vecka === 3 && b[2].vecka === 2,
    `tre generationer, nyast först (veckorna ${b.map((x) => x.vecka).join(", ")}) — äldre rullar ut`);
}

/* ---------------- Återställningen: hård och hel ---------------- */
{
  const innan = JSON.parse(lager.get("travmanager.sparfil.v1"));
  ok(innan.vecka === 5, "huvudsparfilen står på vecka 5");
  återställBackup("travmanager.backup.1");
  const efter = ladda();
  ok(efter.vecka === 4, "återställningen tar karriären tillbaka en vecka");

  let kast = null;
  try { återställBackup("travmanager.hittepå"); } catch (e) { kast = e; }
  ok(kast != null, "okänd backupnyckel vägras");
}

/* ---------------- Importen: trasigt släpps aldrig in ---------------- */
{
  const före = lager.get("travmanager.sparfil.v1");
  let kast = null;
  try { importeraSparfil("{inte json"); } catch (e) { kast = e; }
  ok(kast != null && lager.get("travmanager.sparfil.v1") === före,
    "trasig JSON: importen kastar och den liggande karriären röres inte");
  kast = null;
  try { importeraSparfil(JSON.stringify({ hej: 1 })); } catch (e) { kast = e; }
  ok(kast != null && lager.get("travmanager.sparfil.v1") === före,
    "fel form (inget stall): importen kastar och karriären röres inte");
  const giltig = JSON.stringify({ ...nyttSpel(), säsong: 3, vecka: 9, version: 2 });
  importeraSparfil(giltig);
  ok(ladda()?.säsong === 3, "giltig fil importeras och laddas");
}

console.log(fel === 0 ? "\nALLT GRÖNT" : `\n${fel} FEL`);
process.exit(fel === 0 ? 0 : 1);
