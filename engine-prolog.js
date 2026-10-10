/**
 * PROLOGEN — säsong 0, vecka 18–20
 *
 * Karriären börjar inte med ett tomt formulär utan i regnet på en gårdsplan:
 * spelaren är förstaman hos en äldre tränare som ska gå i pension efter
 * säsongen. Tre veckor sida vid sida, sedan nyckelknippan.
 *
 * Mentorn är en person, inte en tutorial: namn, filosofi, gamla meriter,
 * åsikter om hästarna — och hen finns kvar efter pensionen och hör av sig
 * vid karriärens stora ögonblick (se engine-handelser.js).
 */
import { slump, int } from "./engine-util.js";
import { nyHäst } from "./engine-hast.js";
import { HÄST_FÖRLED } from "./data-namnpaket.js";

const MENTORNAMN = [
  { namn: "Evert Sandelius", ålder: 71 }, { namn: "Gunhild Wramner", ålder: 68 },
  { namn: "Åke Trulsson", ålder: 74 }, { namn: "Berit Lodén", ålder: 69 },
];
const FILOSOFIER = [
  { id: "försiktig", text: "varm men försiktig",
    motto: "Det största loppet är inte alltid det rätta loppet. Först måste hästen lära sig att tävla.",
    profil: "fostrare" },
  { id: "offensiv", text: "krävande och rakt på sak",
    motto: "Du får inte veta hur bra hon är genom att gömma henne för motståndet.",
    profil: "pådrivare" },
  { id: "unghäst", text: "tålmodig unghästmänniska",
    motto: "Treåringar är inte små femåringar. De är löften man inte får bryta.",
    profil: "fostrare" },
];

export function nyMentor() {
  const m = MENTORNAMN[Math.floor(slump() * MENTORNAMN.length)];
  const f = FILOSOFIER[Math.floor(slump() * FILOSOFIER.length)];
  const stjärna = HÄST_FÖRLED[Math.floor(slump() * HÄST_FÖRLED.length)] + " " +
                  ["Kavat", "Briljant", "Kometen", "Löftet"][Math.floor(slump() * 4)];
  return { ...m, filosofi: f.id, filosofitext: f.text, motto: f.motto,
    rådsprofil: f.profil, stjärnhäst: stjärna,
    störstaSeger: `Guldsjuan ${2004 + Math.floor(slump() * 10)}` };
}

/** Gårdens historia — det arv spelaren tar över och så småningom slår. */
export function nyGårdshistoria(mentor) {
  const grundad = 1988 + Math.floor(slump() * 8);
  return {
    grundad,
    bästaHäst: mentor.stjärnhäst,
    störstaSeger: mentor.störstaSeger,
    rekordSegrarSäsong: 7 + Math.floor(slump() * 5),
    rekordÅr: grundad + 8 + Math.floor(slump() * 12),
  };
}

/**
 * Prologens fyra hästar — roller, inte kloner. Egenskaperna varierar
 * mellan karriärer men rollen styr spannet:
 *   trotjänaren  — gammal, travsäker, långsam; mentorns hjärta
 *   unghästen    — talang med galopp i benen
 *   vardagshästen — pålitlig brödföda
 *   arvtagaren   — den som kan bli spelarens första profil
 */
export function prologhästar() {
  const sätt = (h, roll, just) => { h.roll = roll; Object.assign(h, just(h)); return h; };
  return [
    sätt(nyHäst({ ålder: 10 }), "trotjänaren", (h) => ({
      fart: Math.min(h.fart, 46 + int(0, 5)), travsäkerhet: Math.max(h.travsäkerhet, 0.93),
      lynne: Math.max(h.lynne, 70) })),
    sätt(nyHäst({ ålder: 3 }), "unghästen", (h) => ({
      fart: Math.max(h.fart, 58 + int(0, 8)), travsäkerhet: Math.min(h.travsäkerhet, 0.82),
      form: Math.min(h.form, 45) })),
    sätt(nyHäst({ ålder: 6 }), "vardagshästen", (h) => ({
      fart: 50 + int(-3, 3), travsäkerhet: Math.max(h.travsäkerhet, 0.88) })),
  ];
}

/**
 * STARTERVALET (v115, Pokémon-inspirationen 21.1): arvtagaren väljs.
 * Mentorns sista gåva — tre unghästar hos uppfödaren, EN följer med
 * gården. Tydligt olika profiler där ÅLDERN är taket: spetsaren är
 * färdig nu (få växtår kvar), talangen har åren framför sig.
 * Nivå 0-ärligt: korten talar i ord, aldrig siffror.
 */
export function startervalskandidater() {
  const sätt = (h, profil, just) => { h.roll = "arvtagaren"; h.starterprofil = profil;
    Object.assign(h, just(h)); return h; };
  return [
    sätt(nyHäst({ ålder: 5 }), "spetsaren", (h) => ({
      start: Math.max(h.start, 66 + int(0, 6)), fart: Math.max(h.fart, 60 + int(0, 5)),
      styrka: Math.min(h.styrka, 52), travsäkerhet: Math.max(h.travsäkerhet ?? 0.85, 0.9),
      form: 55 })),
    sätt(nyHäst({ ålder: 6 }), "stayern", (h) => ({
      styrka: Math.max(h.styrka, 66 + int(0, 6)), fart: Math.min(Math.max(h.fart, 52), 58),
      start: Math.min(h.start, 50), distans: "lång",
      travsäkerhet: Math.max(h.travsäkerhet ?? 0.85, 0.88), lynne: Math.max(h.lynne, 60) })),
    sätt(nyHäst({ ålder: 3 }), "talangen", (h) => ({
      start: Math.min(h.start, 48), fart: Math.min(Math.max(h.fart, 44), 52),
      styrka: Math.min(h.styrka, 50), travsäkerhet: Math.min(h.travsäkerhet ?? 0.85, 0.8),
      hype: 24, form: 42 })),
  ];
}

export const STARTERTEXT = {
  spetsaren: { namn: "Spetsaren", ord: "Snabb ut, säker i benen och redo att vinna nu. Uppfödaren säger det rakt ut: det här är den färdigaste femåring han haft — men fråga inte var taket sitter, för det är inte långt bort." },
  stayern: { namn: "Stayern", ord: "Maler ner fält på styrka och vill ha långt. Ingen raket från bilen, ingen rubrikhäst — men den sortens häst som står och håller när de andra viker sig." },
  talangen: { namn: "Talangen", ord: "Tre år, gänglig och grön — galopperar när det stressar. Men uppfödaren sänker rösten när han pratar om henne: »Jag har fött upp hästar i fyrtio år. Sånt här steg har jag sett två gånger.«" },
};

export const ROLLTEXT = {
  trotjänaren: "stallets gamla trotjänare",
  unghästen: "den osäkra unghästen",
  vardagshästen: "den pålitliga vardagshästen",
  arvtagaren: "den möjliga arvtagaren",
};

/** Mentorns veckotext under prologen. */
export function mentorOmVeckan(spel) {
  const m = spel.prolog?.mentor;
  if (!m) return null;
  const v = spel.vecka;
  if (v === 18) return `»Du hittade hit. Jag började här med två hästar och lånade pengar till den tredje — det var över trettio år sedan. Säsongen är nästan slut. Du går bredvid mig de här veckorna, sedan är det du som bestämmer. ${m.motto}«`;
  if (v === 19) return `»Den här veckan lägger du träningen och väljer lopp. Jag säger vad jag tycker — men jag rättar inte. Man lär sig mer av ett eget misstag än av tio av mina.«`;
  if (v === 20) return `»Sista tävlingsveckan för min del. ${spel.stall.find((h) => h.roll === "trotjänaren")?.namn ?? "Den gamle"} och jag har gjort vårt sista lopp ihop förr eller senare — kanske blir det nu. Gör det till en bra dag, oavsett resultat.«`;
  return null;
}

/** Mentorns reaktion på spelarens träningsval vecka 19–20. */
export function mentorOmTräning(spel, häst) {
  const m = spel.prolog?.mentor;
  if (!m || spel.vecka < 19) return null;
  if (häst.energi < 40 && häst.träning !== "vila")
    return `»Jag förstår tanken med ${häst.namn}, men kom ihåg att orken bara är ${Math.round(häst.energi)}.«`;
  if (häst.roll === "unghästen" && (häst.träning === "kvalitet"))
    return m.filosofi === "offensiv"
      ? `»Hårt jobb för en treåring — men ibland måste man våga för att komma någonstans.«`
      : `»Snabbjobb med en treåring? Jag hade väntat. Löften ska inte forceras.«`;
  return null;
}

/** Mentorns avsked — texten skrivs av det som faktiskt hände. */
export function avskedstext(spel) {
  const m = spel.prolog?.mentor;
  const sista = spel.prolog?.sistaResultat;
  const resultat = !sista ? `Vi hann aldrig göra det där sista loppet. Kanske var det lika bra.`
    : sista.plats === 1 ? `Jag kunde inte ha fått ett bättre avslut än ${sista.häst}s seger.`
    : sista.ur ? `Galoppen i sista loppet? Så har travet alltid varit. Det slutar sällan som en saga.`
    : `${sista.häst}s ${sista.plats}:e-plats var inget sagoslut. Men det har travet sällan varit.`;
  return `Stallet är tystare än vanligt. ${m.namn} står kvar i stallgången medan hästarna kvällsfodras. »Jag trodde att det skulle kännas värre. ${resultat} Den här gården behöver någon som fortfarande har saker kvar att bevisa.« Stalljournalen läggs på bordet. På första tomma sidan står: Säsong 1, vecka 1. »Nu är den din.«`;
}
