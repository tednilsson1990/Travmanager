export const LOPP = [
  { id: "solvalla-vardag", namn: "Vardagslopp, Solvalla", dist: 1640, bana: 1000, start: "bil",
    nivå: 42, prestige: 1, storlopp: false, openStretch: false, startande: 15, pris: [25000, 12000, 7000, 4000, 2500, 0, 0, 0] },
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


