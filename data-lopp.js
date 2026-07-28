export const LOPP = [
  { id: "solvalla-vardag", namn: "Vardagslopp, Solvalla", dist: 1640, bana: 1000, start: "bil",
    nivå: 42, prestige: 1, storlopp: false, openStretch: false, startande: 12, pris: [25000, 12000, 7000, 4000, 2500, 0, 0, 0] },
  { id: "aby-klass2", namn: "Klass II, Åby", dist: 2140, bana: 1000, start: "volt",
    nivå: 54, prestige: 2, storlopp: false, openStretch: true, startande: 15, förstaVolt: 12, tillägg: 20, pris: [60000, 30000, 15000, 9000, 6000, 0, 0, 0] },
  { id: "bergsaker-guldstoet", namn: "Guldstoet, Bergsåker", dist: 2140, bana: 1000, start: "volt",
    nivå: 66, prestige: 4, storlopp: true, openStretch: true, startande: 10, förstaVolt: 12, tillägg: 20, pris: [150000, 75000, 38000, 22000, 15000, 0, 0, 0] },
];

export const TAKTIKER = {
  ledning: { namn: "Till ledningen", info: "Kräver startsnabbhet. Misslyckas den hamnar du utvändigt." },
  rygg: { namn: "Rygg ledaren", info: "Billigast läget — om du löser ut tillräckligt snabbt." },
  skydd: { namn: "Sitta i skydd", info: "Spara maximalt. Risk att bli instängd på upploppet." },
  utv: { namn: "Ut och pressa", info: "Fri väg direkt. Utan rygg kostar varje meter." },
  spurt: { namn: "Vänta och spurta", info: "Ligg bakåt, gå ut sent. Kräver riktig avslutningsfart." },
};

/**
 * Spårets värde vid utlösningen.
 *
 * Autostart: spår 1–8 i första ledet, 9–15 i andra ledet bakom spår 1–7.
 * Andra ledet straffas hårt eftersom man inte styr sin egen start — man
 * följer hästen framför.
 *
 * Volt: innerspåren i första volten är klart bäst.
 */
export const spårfördel = (s, typ) =>
  typ === "bil"
    ? bilSpår(s)
    : voltSpår(s);

/**
 * Autostartens spår är INTE en fallande skala från spår 1.
 * Svensk Travsports statistik över 33 958 lopp visar en puckel: spår 4–5
 * vinner mest (13–14 %), spår 1 bara 10 %. Innerspår ger kortast väg men
 * också störst risk att bli överflyglad och sitta fast bakom fältet.
 * Andra ledet vinner runt 5–7 %, alltså långt ifrån chanslöst.
 */
function bilSpår(s) {
  const första = [3.0, 4.6, 5.6, 6.6, 6.6, 4.2, 2.6, 1.0];
  if (s <= 8) return första[s - 1];
  return -5.5 - (s - 9) * 0.7;
}

/**
 * Voltstartens spår är inte en fallande skala.
 * 1–5 är vanliga startspår, innerst bäst.
 * 6–7 är SPRINGSPÅR: hästen kommer in i starten med högre fart och kan
 * köra sig direkt till ledningen — men tajmingen är svårare och
 * galopprisken högre. Det hanteras separat i simuleringen.
 * 8 och bakåt hamnar i bakre ledet.
 */
function voltSpår(s) {
  if (s <= 5) return (6 - s) * 2.2;      // 1:a bäst, fallande till spår 5
  if (s === 6) return 6.5;               // springspår
  if (s === 7) return 5.0;               // springspår
  return -9 - (s - 8) * 1.6;             // bakre ledet
}

/** Springspåren i volt — hög ingångsfart, men svårare att lyckas med. */
export const ärSpringspår = (s, typ) => typ === "volt" && (s === 6 || s === 7);

/**
 * Autostart har två led. Spår 1–8 fram, 9–15 bak, och bakspåren följer
 * hästen rakt framför: 9 bakom 1, 10 bakom 2 ... 15 bakom 7.
 * Bakspårshästen styr alltså inte sin egen start.
 */
export const framförSpår = (s) => (s >= 9 && s <= 15 ? s - 8 : null);




/**
 * FASTSTÄLLDA STARTREGLER (Teds tävlingsmanual kap 16, v92). Centrala
 * valideringsgränser — allt annat (belopp, klassgränser) är säsongsdata,
 * men taken här ändras aldrig av en proposition: autostart högst 12
 * (spår 1–8 i första ledet, 9–12 i andra, ALDRIG tredje led), voltstart
 * högst 15 totalt varav högst 12 från samma distans (13–15 startar på
 * 20 m tillägg — motorn har logiken sedan tidigare), monté auto högst 10.
 */
export const STARTREGLER = { bilMax: 12, voltMax: 15, voltPerDistans: 12, monteMax: 10 };


/**
 * SPÅRTRAPPAN (v94, manualen kap 8 — transparensen). Motorn har hela
 * tiden vetat vad spåren är värda (spårfördel bygger på Svensk
 * Travsports statistik över 33 958 lopp) — nu får spelaren se samma
 * kunskap. Karaktären läses ur SAMMA data som utlösningen använder, så
 * trappan kan aldrig ljuga om motorn.
 */
export function spårkaraktär(spår, lopp) {
  if (lopp.start === "volt") {
    if (lopp.förstaVolt && spår > lopp.förstaVolt)
      return { klass: "tillägg", text: `tillägg 20 m — längre väg till samma mållinje` };
    if (spår >= 6 && spår <= 7)
      return { klass: "springspår", text: "springspår — fart in i starten, men tajmingen är svår och galopprisken högre" };
    if (spår >= 8) return { klass: "andraled",
      text: "andra volten — startar bakom första och får söka luckorna därifrån" };
    if (spår <= 3) return { klass: "guld", text: "innerspår i första volten — kortaste vägen och bäst kontroll" };
    return { klass: "ok", text: "första volten — hyggligt utgångsläge" };
  }
  /* Autostart: puckeln, inte en fallande skala. */
  if (spår >= 9) return { klass: "andraled",
    text: "andra ledet — du styr inte din egen start utan följer hästen framför; loppet får tas bakifrån" };
  if (spår === 8) return { klass: "svår", text: "åttan — ytterst i första ledet, långt till både ledning och lucka" };
  if (spår >= 4 && spår <= 5) return { klass: "guld", text: "statistikens guldläge — fart ut och fria val" };
  if (spår <= 2) return { klass: "risk", text: "innerspår — kortast väg men störst risk att bli överflyglad och fast" };
  return { klass: "bra", text: "bra läge i första ledet" };
}

/** Trappans sammanfattning för ett lopp — bästa och svåraste spåren. */
export function spårtrappa(lopp) {
  const antal = lopp.startande || 12;
  const rader = [];
  for (let s = 1; s <= antal; s++) rader.push({ spår: s, fördel: spårfördel(s, lopp.start), ...spårkaraktär(s, lopp) });
  const ordnade = [...rader].sort((a, b) => b.fördel - a.fördel);
  return { rader, bäst: ordnade.slice(0, 2).map((r) => r.spår), svårast: ordnade.slice(-2).map((r) => r.spår).reverse() };
}
