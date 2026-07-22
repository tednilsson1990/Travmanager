/**
 * NAMNLAGRET
 *
 * All identitet — banor, lopp, kuskar, hästnamn — ligger samlat här och
 * ingenstans annars. Motorn känner bara till EGENSKAPER: banlängd,
 * upploppets längd, open stretch, kuskens startsnabbhet och så vidare.
 *
 * Det betyder att ett licensierat namnpaket kan läggas in senare genom att
 * byta den här filen, utan att röra en rad i simuleringen. Bygg aldrig in
 * ett namn någon annanstans.
 *
 * Namnen nedan är påhittade med flit. Verkliga banor, lopp, hästar, kuskar
 * och uppfödarsuffix kan omfattas av varumärkes- och namnskydd, och den
 * frågan är inget jag kan bedöma — men konstruktionen håller valet öppet.
 */

/* ==================== Banor ====================
   Egenskaperna är det som betyder något i simuleringen. Namnen är utbytbara.
   upplopp  = meter från sista kurvans utgång till mål
   openStretch = extra innerspår öppnas på upploppet
   karaktär = kort beskrivning till spelaren                              */
export const BANOR = {
  nordstad:   { namn: "Nordstad",     bana: 1000, upplopp: 190, openStretch: false,
                karaktär: "Snabb bana med kort upplopp — spetsen är svårslagen." },
  kvarnbacken:{ namn: "Kvarnbacken",  bana: 1000, upplopp: 240, openStretch: true,
                karaktär: "Långt upplopp och öppet innerspår. Vinnarhålet finns här." },
  bjorkeby:   { namn: "Björkeby",     bana: 1000, upplopp: 205, openStretch: true,
                karaktär: "Öppet innerspår, men trång före sista kurvan." },
  storangen:  { namn: "Storängen",    bana: 1000, upplopp: 230, openStretch: false,
                karaktär: "Rymlig bana där ytterspår kostar mindre än vanligt." },
  vinterviken:{ namn: "Vinterviken",  bana: 1000, upplopp: 175, openStretch: false,
                karaktär: "Kort upplopp och tunga vinterförhållanden." },
  sundtravet: { namn: "Sundtravet",   bana: 1000, upplopp: 215, openStretch: true,
                karaktär: "Jämn bana, öppet innerspår, ofta höga tempon." },
  ekhaga:     { namn: "Ekhaga",       bana: 1000, upplopp: 250, openStretch: false,
                karaktär: "Landets längsta upplopp. Spurtare får sin chans." },
  sorgarden:  { namn: "Sörgården",    bana: 1000, upplopp: 195, openStretch: false,
                karaktär: "Liten bana med snäva kurvor — innerspåret är guld." },
};

/* ==================== Hästnamn ====================
   Efterleden är påhittade i stället för verkliga uppfödarsuffix, så att
   genererade namn inte sammanfaller med existerande hästar.            */
export const HÄST_FÖRLED = [
  "Vinter", "Zenit", "Nordan", "Ravel", "Cyklon", "Mimer", "Saga", "Bore",
  "Elden", "Ymer", "Vixen", "Haga", "Stjärn", "Torp", "Järva", "Rimfrost",
  "Kastanj", "Vindil", "Fenrir", "Ulvhild", "Björnbär", "Klarälv", "Sävsjö",
  "Malmvik", "Rosenlund", "Tindra", "Vargön", "Alvhem", "Solgläntan", "Frost",
];
export const HÄST_EFTERLED = [
  "Vinge", "Sund", "Kvarn", "Backa", "Ström", "Hage", "Vall", "Fager",
  "Lykke", "Rimma", "Skimmer", "Tind", "Bris", "Rönn", "Salt", "Ljung",
  "Fjäll", "Vidd", "Bragd", "Ekborg",
];

/* ==================== Kuskkåren ====================
   En stor kår gör att spelaren själv lär sig vilka som är bra, i stället
   för att få det serverat. Namnen är vanliga svenska namndelar satta i
   kombinationer som inte pekar ut någon verklig person.                */
const FÖRNAMN = [
  "Erik", "Johan", "Lina", "Mats", "Anders", "Karin", "Petter", "Sofia",
  "Tobias", "Hanna", "Nils", "Elin", "Gustav", "Maja", "Rickard", "Klara",
  "Fredrik", "Ida", "Olle", "Sara", "Björn", "Emma", "Håkan", "Tove",
  "Simon", "Agnes", "Viktor", "Nora", "Daniel", "Frida", "Robin", "Ellen",
];
const EFTERNAMN = [
  "Lund", "Berg", "Falk", "Ström", "Hedman", "Kvist", "Ryd", "Norell",
  "Vestlund", "Åkerman", "Holt", "Sandin", "Frisk", "Bergvall", "Malm",
  "Storm", "Ahl", "Öberg", "Toivonen", "Ekvall", "Bjur", "Halling",
  "Rune", "Sjövall", "Torstensson", "Wik", "Almgren", "Dalin", "Näslund",
  "Ferm", "Gyllen", "Hovmark", "Iversen", "Jerner", "Kraft", "Lo", "Mörk",
];

/** Enkel deterministisk slump så att kuskkåren ser likadan ut varje gång. */
function frö(n) {
  let x = (n * 1103515245 + 12345) % 2147483648;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

/**
 * Bygger kuskkåren. Varje kusk har egna värden, och de bästa kräver att du
 * har ett renommé värt namnet. Efter några timmar vet spelaren själv vilka
 * som löser ut bäst och vilka som är kalla nog för en het häst.
 */
export function byggKuskkår(antal = 90) {
  const r = frö(7);
  const kår = [];
  const använda = new Set();

  for (let i = 0; i < antal; i++) {
    let namn;
    let försök = 0;
    do {
      const f = FÖRNAMN[Math.floor(r() * FÖRNAMN.length)];
      const e = EFTERNAMN[Math.floor(r() * EFTERNAMN.length)];
      namn = `${f[0]}. ${e}`;
      försök++;
    } while (använda.has(namn) && försök < 40);
    använda.add(namn);

    /* Klassen avgör spannet. Ett fåtal elitkuskar, en bred mellanskikt och
       en svans av oerfarna — ungefär som en verklig kuskkår. */
    const klass = i < antal * 0.08 ? "elit" : i < antal * 0.35 ? "etablerad" : "bred";
    const bas = klass === "elit" ? 74 : klass === "etablerad" ? 58 : 44;
    const spann = klass === "elit" ? 18 : 20;
    const v = () => Math.round(bas + r() * spann - spann * 0.35);

    const ryktbarhet = Math.round(
      klass === "elit" ? 78 + r() * 20 : klass === "etablerad" ? 45 + r() * 30 : 14 + r() * 30
    );
    kår.push({
      namn,
      start: Math.max(20, Math.min(96, v())),
      taktik: Math.max(20, Math.min(96, v())),
      avslutning: Math.max(20, Math.min(96, v())),
      kyla: Math.max(20, Math.min(96, v())),
      ryktbarhet,
      arvode: Math.round(500 + ryktbarhet * 38),
      andel: 0.05 + Math.round(ryktbarhet / 33) * 0.01,
      krav: Math.max(0, Math.round((ryktbarhet - 34) * 0.95)),
      startrelation: Math.round(62 - ryktbarhet * 0.45),
    });
  }
  return kår.sort((a, b) => b.ryktbarhet - a.ryktbarhet);
}

/* ==================== Loppserier ====================
   De stora loppen ger karriären långsiktiga mål. Vecka och krav är det som
   betyder något; namnen är utbytbara.                                   */
export const STORLOPPSMALLAR = [
  { vecka: 5,  namn: "Vinterpokalen",   dist: 2140, minInsprunget: 250000,
    pris: [150000, 75000, 38000, 22000, 15000], prestige: 4 },
  { vecka: 9,  namn: "Stochampionatet", dist: 2140, kön: "sto", minInsprunget: 180000,
    pris: [160000, 80000, 40000, 24000, 16000], prestige: 4 },
  { vecka: 12, namn: "Unghästkriteriet", dist: 2140, maxÅlder: 5,
    pris: [180000, 90000, 45000, 27000, 18000], prestige: 4 },
  { vecka: 15, namn: "Sprinterkronan",  dist: 1640, minInsprunget: 350000,
    pris: [200000, 100000, 50000, 30000, 20000], prestige: 5 },
  { vecka: 18, namn: "Stayerpriset",    dist: 3140, minInsprunget: 300000,
    pris: [180000, 90000, 45000, 27000, 18000], prestige: 4 },
  { vecka: 20, namn: "Kungsloppet",     dist: 2140, minInsprunget: 600000,
    pris: [500000, 250000, 125000, 75000, 50000], prestige: 5 },
];

/** Vardagsloppens seriennamn. Klassen bestäms av propositionen, inte namnet. */
export const KLASSNAMN = {
  lärling: "Lärlingsserien",
  klass3: "Bronsserien",
  klass2: "Silverserien",
  klass1: "Guldserien",
  sto: "Stoserien",
  ung: "Unghästserien",
};

/** Storspelsomgången — motsvarigheten till lördagens stora spelform. */
export const STORSPEL = { namn: "Guldsjuan", avdelningar: 8, intervall: 4 };
