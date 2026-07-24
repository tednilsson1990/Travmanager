/**
 * BYGGVERIFIERING — körs före varje paketering: `node verifiera.mjs`
 *
 * Född ur ett tyst fel: en textersättning som missade sitt ankare no-opade
 * utan besked, tre filer hamnade aldrig i importmappen, och uppdateringen
 * gav svart skärm. Kontrollerar att varje JS-fil finns i importmappen och
 * i service workerns precachelista, att versionsnumren stämmer överens,
 * och att alla import/export matchar.
 */
import fs from "fs";
let fel = 0;
const js = fs.readdirSync(".").filter((f) => f.endsWith(".js") && f !== "sw.js")
  .filter((f) => !f.endsWith(".mjs"));
const html = fs.readFileSync("index.html", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");

for (const f of js) {
  if (f !== "main.js" && !html.includes(`"./${f}"`)) { console.log(`SAKNAS I IMPORTMAP: ${f}`); fel++; }
  if (!sw.includes(`./${f}?v=`)) { console.log(`SAKNAS I SW-PRECACHE: ${f}`); fel++; }
}
/* IMPORTGRAFEN. Dokumentationen har alltid påstått att den kontrolleras
   här; till v59 gjorde den inte det. Ett felstavat namn i en import ger
   annars svart skärm först i mobilen — och det är precis den sortens
   tysta fel den här filen finns för. */
const exporter = {};
for (const f of js) {
  const s = fs.readFileSync(f, "utf8");
  const e = new Set();
  for (const m of s.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-zÅÄÖåäö_$][\w$ÅÄÖåäö]*)/g)) e.add(m[1]);
  for (const m of s.matchAll(/export\s*\{([^}]+)\}/g))
    m[1].split(",").forEach((x) => e.add(x.split(" as ").pop().trim()));
  if (/export\s+default/.test(s)) e.add("default");
  exporter[f] = e;
}
for (const f of js) {
  const s = fs.readFileSync(f, "utf8");
  for (const m of s.matchAll(/import\s+([^;]+?)\s+from\s+["'](\.\/[^"']+)["']/g)) {
    const mål = m[2].replace("./", "");
    if (!exporter[mål]) { console.log(`${f}: importerar okänd fil ${m[2]}`); fel++; continue; }
    const namn = [];
    if (/^([A-Za-zÅÄÖåäö_$][\w$ÅÄÖåäö]*)\s*(,|$)/.test(m[1].trim())) namn.push("default");
    const kl = m[1].match(/\{([^}]+)\}/);
    if (kl) kl[1].split(",").forEach((x) => { const n = x.split(" as ")[0].trim(); if (n) namn.push(n); });
    for (const n of namn)
      if (!exporter[mål].has(n)) { console.log(`${f}: ${m[2]} exporterar inte "${n}"`); fel++; }
  }
}

const vHtml = (html.match(/\?v=(\d+)/) || [])[1];
const vAlla = new Set([...html.matchAll(/\?v=(\d+)/g)].map((m) => m[1]));
const vSw = (sw.match(/const VERSION = (\d+)/) || [])[1];
if (vAlla.size !== 1) { console.log(`BLANDADE VERSIONER I INDEX: ${[...vAlla]}`); fel++; }
if (vHtml !== vSw) { console.log(`VERSIONSDIFF: index ${vHtml} ≠ sw ${vSw}`); fel++; }
console.log(fel === 0 ? `VERIFIERAT: ${js.length} filer, version ${vHtml}` : `${fel} FEL — paketera inte!`);
process.exit(fel ? 1 : 0);
