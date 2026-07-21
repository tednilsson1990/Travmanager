import { useEffect, useRef } from "preact/hooks";
import { html } from "htm/preact";
import { täcke, tidText } from "./engine-util.js";

const BANPATH = "M 70 34 H 290 A 66 66 0 0 1 290 166 H 70 A 66 66 0 0 1 70 34 Z";
const STAKET = "M 70 46 H 290 A 54 54 0 0 1 290 154 H 70 A 54 54 0 0 1 70 46 Z";
const MITT = { x: 180, y: 100 };
const SPÅRBREDD = 7.5; // pixlar utåt per spårled

/**
 * Grafisk banvy. Hästarna placeras längs banans mittlinje med
 * getPointAtLength och skjuts utåt längs normalen efter spårläge —
 * samma princip som tv-grafiken bygger på.
 */
export default function BanVy({ lopp, fält, bild }) {
  const refPath = useRef(null);
  const pucks = useRef({});

  useEffect(() => {
    const path = refPath.current;
    if (!path || !bild) return;
    const L = path.getTotalLength();

    bild.pos.forEach((p) => {
      const g = pucks.current[p.spår];
      if (!g) return;
      g.setAttribute("opacity", p.ur ? "0.25" : "1");

      const kvarTillMål = lopp.dist - p.d;
      const varvPos = ((lopp.bana - (kvarTillMål % lopp.bana)) % lopp.bana) / lopp.bana;
      const s = varvPos * L;
      const pt = path.getPointAtLength(s);
      const pt2 = path.getPointAtLength((s + 2) % L);

      let nx = -(pt2.y - pt.y);
      let ny = pt2.x - pt.x;
      const len = Math.hypot(nx, ny) || 1;
      nx /= len; ny /= len;
      if ((pt.x - MITT.x) * nx + (pt.y - MITT.y) * ny < 0) { nx = -nx; ny = -ny; }

      const ut = p.lane * SPÅRBREDD;
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
        <path d=${BANPATH} fill="none" stroke="#4A331F" stroke-width="26" />
        <path d=${BANPATH} fill="none" stroke="#2A1D12" stroke-width="24" />
        <path ref=${refPath} d=${BANPATH} fill="none" stroke="none" />
        <path d=${STAKET} fill="none" stroke="rgba(233,230,223,.18)" stroke-width="1" />
        <line x1="180" y1="20" x2="180" y2="48" stroke="#E9E6DF" stroke-width="2" stroke-dasharray="3 3" />
        <text x="186" y="18" fill="#8FA0B0" font-size="9" font-family="'Roboto Mono',monospace">MÅL</text>
        <g>
          ${fält.map((h) => {
            const t = täcke(h.spår);
            return html`
              <g key=${h.spår} ref=${(n) => { pucks.current[h.spår] = n; }}>
                <circle r="8.5" fill=${t.bg}
                  stroke=${h.egen ? "#F2B134" : "rgba(0,0,0,.5)"}
                  stroke-width=${h.egen ? 2.5 : 1} />
                <text text-anchor="middle" y="3.4" fill=${t.fg} font-size="10"
                  font-weight="700" font-family="'Roboto Mono',monospace">${h.spår}</text>
              </g>`;
          })}
        </g>
      </svg>
    </div>`;
}
