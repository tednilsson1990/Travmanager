export const LOPP = [
  { id: "solvalla-vardag", namn: "Vardagslopp, Solvalla", dist: 1640, bana: 1000, start: "bil",
    nivå: 42, prestige: 1, storlopp: false, pris: [25000, 12000, 7000, 4000, 2500, 0, 0, 0] },
  { id: "aby-klass2", namn: "Klass II, Åby", dist: 2140, bana: 1000, start: "volt",
    nivå: 54, prestige: 2, storlopp: false, pris: [60000, 30000, 15000, 9000, 6000, 0, 0, 0] },
  { id: "bergsaker-guldstoet", namn: "Guldstoet, Bergsåker", dist: 2140, bana: 1000, start: "volt",
    nivå: 66, prestige: 4, storlopp: true, pris: [150000, 75000, 38000, 22000, 15000, 0, 0, 0] },
];

export const TAKTIKER = {
  ledning: { namn: "Till ledningen", info: "Kräver startsnabbhet. Misslyckas den hamnar du utvändigt." },
  rygg: { namn: "Rygg ledaren", info: "Billigast läget — om du löser ut tillräckligt snabbt." },
  skydd: { namn: "Sitta i skydd", info: "Spara maximalt. Risk att bli instängd på upploppet." },
  utv: { namn: "Ut och pressa", info: "Fri väg direkt. Utan rygg kostar varje meter." },
  spurt: { namn: "Vänta och spurta", info: "Ligg bakåt, gå ut sent. Kräver riktig avslutningsfart." },
};

/** Innerspår är bäst; volt straffar andra ledet hårt. */
export const spårfördel = (s, typ) =>
  typ === "bil" ? (8 - s) * 1.4 : s <= 4 ? (5 - s) * 2.6 : -6 - (s - 5) * 1.8;
