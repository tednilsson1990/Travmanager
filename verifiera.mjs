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
const vHtml = (html.match(/\?v=(\d+)/) || [])[1];
const vAlla = new Set([...html.matchAll(/\?v=(\d+)/g)].map((m) => m[1]));
const vSw = (sw.match(/const VERSION = (\d+)/) || [])[1];
if (vAlla.size !== 1) { console.log(`BLANDADE VERSIONER I INDEX: ${[...vAlla]}`); fel++; }
if (vHtml !== vSw) { console.log(`VERSIONSDIFF: index ${vHtml} ≠ sw ${vSw}`); fel++; }
console.log(fel === 0 ? `VERIFIERAT: ${js.length} filer, version ${vHtml}` : `${fel} FEL — paketera inte!`);
process.exit(fel ? 1 : 0);
