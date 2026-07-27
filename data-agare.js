export const ÄGARNAMN = ["Stall Vinterfrid","Hägglunds Åkeri","Team Solkatt","Stall Nyberg & Co",
  "Bergslagens Hästägare","Stall Kvarnbacken","Ulriksdals Invest","Stall Tre Kronor"];

/**
 * ÄGARTYPERNA (kap 7.1). resultatkänsla skalar hur hårt loppen väger,
 * kommvikt hur mycket av relationen som är dialog, tålamod om "be om
 * tålamod" tas emot med en nick eller en suck.
 */
export const ÄGARTYPER = {
  småägare: { namn: "Småägaren", tålamod: 1.4, resultatkänsla: 0.65, kommvikt: 0.45,
    vill: "vara med — höra hur hästen mår och stå i vinnarcirkeln en gång",
    beskrivning: "En häst och hela hjärtat i den. Tål motgång — men vill höra av dig." },
  uppfödare: { namn: "Uppfödaren", tålamod: 1.5, resultatkänsla: 0.8, kommvikt: 0.35,
    vill: "utveckla sin stam — tänker i generationer, inte i säsonger",
    beskrivning: "Tänker långsiktigt och dömer dig på hästens utveckling, inte på en placering." },
  företagare: { namn: "Företagaren", tålamod: 0.9, resultatkänsla: 1.0, kommvikt: 0.35,
    vill: "synlighet — hästen är representation och ska synas i rätt sammanhang",
    beskrivning: "Hästen är ett skyltfönster. Starter, press och vinnarcirkel räknas." },
  storsatsare: { namn: "Storsatsaren", tålamod: 0.55, resultatkänsla: 1.6, kommvikt: 0.15,
    vill: "resultat — köpte dyrt och förväntar sig därefter",
    beskrivning: "Köper dyrt och kräver resultat. Glömmer aldrig en floppad favorit." },
  travfamilj: { namn: "Travfamiljen", tålamod: 1.2, resultatkänsla: 0.9, kommvikt: 0.45,
    vill: "göra det ordentligt — traditioner, kontakter och tydliga åsikter",
    beskrivning: "Tredje generationen i sporten. Har åsikter om kuskval — och minns allt." },
};

export const ÄGARKRAV = [
  { text: "topp 3 inom fyra starter", typ: "topp3", antal: 4 },
  { text: "en seger inom sex starter", typ: "seger", antal: 6 },
  { text: "tre pallplatser under säsongen", typ: "pall3", antal: 3 },
  { text: "start i ett storlopp inom fem starter", typ: "storlopp", antal: 5 },
];

export const ARVODE_PER_VECKA = 9800;

/**
 * SPONSORNAMNEN (kap 8). Namn bor i datalagret, aldrig i motorn —
 * engine-sponsor.js läser poolerna härifrån. Nycklarna matchar
 * SPONSORTYPER i engine-sponsor.js.
 */
export const SPONSORNAMN = {
  lokal: ["Bygg & Ställning i Dalarna", "Kvarnbackens Måleri", "Städpartner Mitt",
    "Åsbergs El", "Länna Grus & Schakt"],
  foder: ["Bergslagens Foder", "Hälsinge Havre", "Stallfoder Direkt"],
  transport: ["Hägglunds Åkeri", "Dalatransport", "Norrfrakt"],
  bilhandlare: ["Björkmans Bil", "Silverdalens Motor", "Wallins Bilhall"],
  regional: ["Bergslagsmejeriet", "Siljansbryggeriet", "Dalasparbanken"],
  nationell: ["Nordkraft Energi", "Svea Försäkring", "Trippel Sport"],
};
