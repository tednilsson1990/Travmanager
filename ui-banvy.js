import { useEffect, useMemo, useRef } from "preact/hooks";
import { html } from "htm/preact";
import { täcke, tidText } from "./engine-util.js";

const MITT = { x: 180, y: 100 };
const HALV_RAK = 110;
const RADIE = 66;
const BANBREDD = 26;
const INNERSPÅR = -9;
const SPÅRBREDD = 7.5;

/* Närbilden: fältet från sidan, som på en tv-bild. */
const NB = {
  bredd: 360, höjd: 128,
  vänster: 42, höger: 344,   // plats för radetiketterna till vänster
  fönster: 40,               // meter bakom ledaren som ryms i bilden
  rad: { 0: 92, 1: 64, 2: 36 },
};

function banaPunkter(radie = RADIE, halvRak = HALV_RAK, bågsteg = 60) {
  const p = [];
  const V = MITT.x - halvRak, H = MITT.x + halvRak;
  const övre = MITT.y - radie, undre = MITT.y + radie;
  p.push([MITT.x, övre]);
  p.push([V, övre]);
  for (let i = 1; i <= bågsteg; i++) {
    const t = -Math.PI / 2 - (Math.PI * i) / bågsteg;
    p.push([V + radie * Math.cos(t), MITT.y + radie * Math.sin(t)]);
  }
  p.push([H, undre]);
  for (let i = 1; i <= bågsteg; i++) {
    const t = Math.PI / 2 - (Math.PI * i) / bågsteg;
    p.push([H + radie * Math.cos(t), MITT.y + radie * Math.sin(t)]);
  }
  p.push([MITT.x, övre]);
  return p;
}
const banaD = (radie, halvRak) =>
  banaPunkter(radie, halvRak)
    .map(([x, y], i) => (i ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2))
    .join(" ");

export default function BanVy({ lopp, fält, bild }) {
  const refPath = useRef(null);
  const pucks = useRef({});
  const nära = useRef({});
  const d = useMemo(() => banaD(RADIE, HALV_RAK), []);
  const dStaket = useMemo(() => banaD(RADIE - BANBREDD / 2, HALV_RAK), []);

  useEffect(() => {
    const path = refPath.current;
    if (!path || !bild) return;
    const L = path.getTotalLength();

    /* --- Ovalen: var på banan hästarna befinner sig --- */
    bild.pos.forEach((p) => {
      const g = pucks.current[p.spår];
      if (!g) return;
      g.setAttribute("opacity", p.ur ? "0.25" : "1");
      const kvarTillMål = lopp.dist - p.d;
      const varvPos = ((lopp.bana - (kvarTillMål % lopp.bana)) % lopp.bana) / lopp.bana;
      const s = varvPos * L;
      const pt = path.getPointAtLength(s);
      const pt2 = path.getPointAtLength((s + 2) % L);
      let nx = -(pt2.y - pt.y), ny = pt2.x - pt.x;
      const len = Math.hypot(nx, ny) || 1;
      nx /= len; ny /= len;
      if ((pt.x - MITT.x) * nx + (pt.y - MITT.y) * ny < 0) { nx = -nx; ny = -ny; }
      const ut = INNERSPÅR + p.lane * SPÅRBREDD;
      g.setAttribute("transform",
        `translate(${(pt.x + nx * ut).toFixed(2)},${(pt.y + ny * ut).toFixed(2)})`);
    });

    /* --- Närbilden: hur de ligger mot varandra --- */
    const ledare = bild.pos.filter((p) => !p.ur).reduce((a, b) => (b.d > a.d ? b : a), bild.pos[0]);
    const skala = (NB.höger - NB.vänster) / NB.fönster;
    bild.pos.forEach((p) => {
      const g = nära.current[p.spår];
      if (!g) return;
      const efter = ledare.d - p.d;              // meter bakom ledaren
      const utanför = efter > NB.fönster;
      g.setAttribute("opacity", p.ur ? "0.2" : utanför ? "0.3" : "1");
      const x = NB.höger - Math.min(efter, NB.fönster) * skala;
      const y = NB.rad[Math.min(p.lane, 2)];
      g.setAttribute("transform", `translate(${x.toFixed(1)},${y})`);
    });
  }, [bild, lopp]);

  const ledarD = bild ? bild.pos.filter((p) => !p.ur).reduce((a, b) => Math.max(a, b.d), 0) : 0;

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
              <g key=${"o" + h.spår} ref=${(n) => { pucks.current[h.spår] = n; }}>
                <circle r="8" fill=${t.bg}
                  stroke=${h.egen ? "#F2B134" : "rgba(0,0,0,.5)"}
                  stroke-width=${h.egen ? 2.5 : 1} />
                <text text-anchor="middle" y="3.2" fill=${t.fg} font-size="9.5"
                  font-weight="700" font-family="'Roboto Mono',monospace">${h.spår}</text>
              </g>`;
          })}
        </g>
      </svg>

      <div class="nb-rubrik">
        <span>Närbild — fältet uppifrån</span>
        <span>ledaren till höger</span>
      </div>

      <svg viewBox=${`0 0 ${NB.bredd} ${NB.höjd}`} class="narbild">
        <!-- banunderlag och innerstaket -->
        <rect x="0" y="20" width=${NB.bredd} height="90" fill="#2A1D12" />
        <line x1="0" y1="107" x2=${NB.bredd} y2="107" stroke="rgba(233,230,223,.4)" stroke-width="2.5" />
        <!-- avståndsmarkeringar var tionde meter -->
        ${[10, 20, 30, 40].map((m) => {
          const x = NB.höger - m * ((NB.höger - NB.vänster) / NB.fönster);
          return html`
            <g key=${"m" + m}>
              <line x1=${x} y1="22" x2=${x} y2="107" stroke="rgba(233,230,223,.10)" stroke-width="1" />
              <text x=${x} y="122" fill="#6C7B8A" font-size="9" text-anchor="middle"
                font-family="'Roboto Mono',monospace">${m} m</text>
            </g>`;
        })}
        <text x=${NB.höger} y="122" fill="#F2B134" font-size="9"
          font-family="'Roboto Mono',monospace" text-anchor="middle">mål ▶</text>
        <!-- spårledernas etiketter -->
        <text x="4" y=${NB.rad[0] + 4} fill="#8FA0B0" font-size="9"
          font-family="'Roboto Mono',monospace">INNE</text>
        <text x="4" y=${NB.rad[1] + 4} fill="#8FA0B0" font-size="9"
          font-family="'Roboto Mono',monospace">UTV</text>
        <text x="4" y=${NB.rad[2] + 4} fill="#8FA0B0" font-size="9"
          font-family="'Roboto Mono',monospace">3:E</text>
        <g>
          ${fält.map((h) => {
            const t = täcke(h.spår);
            return html`
              <g key=${"n" + h.spår} ref=${(n) => { nära.current[h.spår] = n; }}>
                <circle r="10.5" fill=${t.bg}
                  stroke=${h.egen ? "#F2B134" : "rgba(0,0,0,.55)"}
                  stroke-width=${h.egen ? 3 : 1} />
                <text text-anchor="middle" y="4" fill=${t.fg} font-size="12"
                  font-weight="700" font-family="'Roboto Mono',monospace">${h.spår}</text>
              </g>`;
          })}
        </g>
      </svg>
    </div>`;
}
