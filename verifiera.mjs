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

/* MODULLADDNINGEN. Importgrafen ovan är statisk text — den ser inte fel
   som uppstår när modulkroppen KÖRS: TDZ i importcirklar, anrop av något
   som inte finns, syntaxfel htm sväljer. Därför importeras varje modul
   på riktigt, med preact/htm utbytta mot stubbar (spelet självt kör dem
   via importmap som node inte läser). Registerläxan i v62 — TDZ-kraschen
   som fem provsviter missade — är skälet till att det här steget finns. */
{
  const os = await import("node:os");
  const path = await import("node:path");
  const stub = fs.mkdtempSync(path.join(os.tmpdir(), "tm-verif-"));
  const nm = path.join(stub, "node_modules");
  fs.mkdirSync(path.join(nm, "preact/hooks"), { recursive: true });
  fs.mkdirSync(path.join(nm, "htm/preact"), { recursive: true });
  fs.writeFileSync(path.join(nm, "preact/package.json"),
    JSON.stringify({ name: "preact", exports: { ".": "./index.mjs", "./hooks": "./hooks/index.mjs" } }));
  fs.writeFileSync(path.join(nm, "preact/index.mjs"),
    "export const h=()=>{};export const render=()=>{};export const Component=class{};export const Fragment=()=>{};");
  fs.writeFileSync(path.join(nm, "preact/hooks/index.mjs"),
    "export const useState=(v)=>[typeof v==='function'?v():v,()=>{}];export const useEffect=()=>{};" +
    "export const useMemo=(f)=>f();export const useRef=()=>({current:null});" +
    "export const useCallback=(f)=>f;export const useReducer=(r,v)=>[v,()=>{}];");
  fs.writeFileSync(path.join(nm, "htm/package.json"),
    JSON.stringify({ name: "htm", exports: { ".": "./index.mjs", "./preact": "./preact/index.mjs" } }));
  fs.writeFileSync(path.join(nm, "htm/preact/index.mjs"), "export const html=()=>null;");
  for (const f of js) fs.copyFileSync(f, path.join(stub, f));
  /* main.js monterar appen och kräver ett fönster — en global stub
     räcker, det är modulLADDNINGEN som provas, inte renderingen. */
  globalThis.window ??= { addEventListener: () => {}, storage: undefined,
    location: { reload: () => {} }, scrollTo: () => {} };
  globalThis.document ??= { getElementById: () => null, addEventListener: () => {},
    createElement: () => ({ style: {} }), body: {} };
  globalThis.navigator ??= {};
  globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  for (const f of js) {
    try { await import(path.join(stub, f)); }
    catch (e) { console.log(`${f}: laddar inte — ${String(e.message).split("\n")[0]}`); fel++; }
  }
  fs.rmSync(stub, { recursive: true, force: true });
}

const vHtml = (html.match(/\?v=(\d+)/) || [])[1];
const vAlla = new Set([...html.matchAll(/\?v=(\d+)/g)].map((m) => m[1]));
const vSw = (sw.match(/const VERSION = (\d+)/) || [])[1];
if (vAlla.size !== 1) { console.log(`BLANDADE VERSIONER I INDEX: ${[...vAlla]}`); fel++; }
if (vHtml !== vSw) { console.log(`VERSIONSDIFF: index ${vHtml} ≠ sw ${vSw}`); fel++; }
console.log(fel === 0 ? `VERIFIERAT: ${js.length} filer, version ${vHtml}` : `${fel} FEL — paketera inte!`);
process.exit(fel ? 1 : 0);
