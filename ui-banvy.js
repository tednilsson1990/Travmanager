import { useEffect, useMemo, useRef } from "preact/hooks";
import { html } from "htm/preact";
import { täcke, tidText } from "./engine-util.js";

const MITT = { x: 180, y: 100 };
const HALV_RAK = 110;
const RADIE = 66;
const BANBREDD = 26;          // banans bredd i pixlar
const INNERSPÅR = -9;         // lane 0 ligger vid innerstaketet
const SPÅRBREDD = 7.5;        // varje led utåt

/**
 * Banan byggs som en polylinje istället för SVG-bågar, av tre skäl:
 * startpunkten blir exakt mållinjen, riktningen blir vänstervarv, och
 * getPointAtLength följer då samma varv som hästarna faktiskt springer.
 */
function banaPunkter(radie = RADIE, halvRak = HALV_RAK, bågsteg = 60) {
  const p = [];
  const V = MITT.x - halvRak, H = MITT.x + halvRak;
  const övre = MITT.y - radie, undre = MITT.y + radie;

  p.push([MITT.x, övre]);                     // mållinjen, överst i mitten
  p.push([V, övre]);                          // vänsterut längs övre rakan
  for (let i = 1; i <= bågsteg; i++) {        // vänsterkurvan
    const t = -Math.PI / 2 - (Math.PI * i) / bågsteg;
    p.push([V + radie * Math.cos(t), MITT.y + radie * Math.sin(t)]);
  }
  p.push([H, undre]);                         // högerut längs undre rakan
  for (let i = 1; i <= bågsteg; i++) {        // högerkurvan
    const t = Math.PI / 2 - (Math.PI * i) / bågsteg;
    p.push([H + radie * Math.cos(t), MITT.y + radie * Math.sin(t)]);
  }
  p.push([MITT.x, övre]);                     // tillbaka till mål
  return p;
}
const banaD = (radie, halvRak) =>
  banaPunkter(radie, halvRak)
    .map(([x, y], i) => (i ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2))
    .join(" ");

export default function BanVy({ lopp, fält, bild }) {
  const refPath = useRef(null);
  const pucks = useRef({});
  const d = useMemo(() => banaD(RADIE, HALV_RAK), []);
  const dStaket = useMemo(() => banaD(RADIE - BANBREDD / 2, HALV_RAK), []);

  useEffect(() => {
    const path = refPath.current;
    if (!path || !bild) return;
    const L = path.getTotalLength();

    bild.pos.forEach((p) => {
      const g = pucks.current[p.spår];
      if (!g) return;
      g.setAttribute("opacity", p.ur ? "0.25" : "1");

      // Målet ligger vid varvets slut, alltså i pathens startpunkt.
      const kvarTillMål = lopp.dist - p.d;
      const varvPos = ((lopp.bana - (kvarTillMål % lopp.bana)) % lopp.bana) / lopp.bana;
      const s = varvPos * L;
      const pt = path.getPointAtLength(s);
      const pt2 = path.getPointAtLength((s + 2) % L);

      let nx = -(pt2.y - pt.y);
      let ny = pt2.x - pt.x;
      const len = Math.hypot(nx, ny) || 1;
      nx /= len; ny /= len;
      // Se till att normalen pekar utåt, bort från banans mitt
      if ((pt.x - MITT.x) * nx + (pt.y - MITT.y) * ny < 0) { nx = -nx; ny = -ny; }

      // Innerspår ligger vid staketet; varje led utvändigt skjuts utåt
      const ut = INNERSPÅR + p.lane * SPÅRBREDD;
      g.setAttribute("transform",
        `translate(${(pt.x + nx * ut).toFixed(2)},${(pt.y + ny * ut).toFixed(2)})`);
    });
  }, [bild, lopp]);

  return html`
    <div class="banvy">
      <div class="bv-topp">
        <span class="stor">${tidText(bild ? bild.tid : 0)}</span>
        <span>${bild ? bild.meter : 0} / ${lopp.dist} m</span>
      </div>
      <svg viewBox="0 0 360 200">
        <path d=${d} fill="none" stroke="#4A331F" stroke-width=${BANBREDD} stroke-linejoin="round" />
        <path d=${d} fill="none" stroke="#2A1D12" stroke-width=${BANBREDD - 2} stroke-linejoin="round" />
        <path ref=${refPath} d=${d} fill="none" stroke="none" />
        <path d=${dStaket} fill="none" stroke="rgba(233,230,223,.22)" stroke-width="1" />
        <line x1="180" y1="20" x2="180" y2="48" stroke="#E9E6DF" stroke-width="2" stroke-dasharray="3 3" />
        <text x="186" y="17" fill="#8FA0B0" font-size="9" font-family="'Roboto Mono',monospace">MÅL</text>
        <text x="150" y="17" fill="#8FA0B0" font-size="10" font-family="'Roboto Mono',monospace">◀</text>
        <g>
          ${fält.map((h) => {
            const t = täcke(h.spår);
            return html`
              <g key=${h.spår} ref=${(n) => { pucks.current[h.spår] = n; }}>
                <circle r="8" fill=${t.bg}
                  stroke=${h.egen ? "#F2B134" : "rgba(0,0,0,.5)"}
                  stroke-width=${h.egen ? 2.5 : 1} />
                <text text-anchor="middle" y="3.2" fill=${t.fg} font-size="9.5"
                  font-weight="700" font-family="'Roboto Mono',monospace">${h.spår}</text>
              </g>`;
          })}
        </g>
      </svg>
    </div>`;
}
