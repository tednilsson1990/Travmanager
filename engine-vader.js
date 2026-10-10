/**
 * VÄDRET (v154, plan 20.3 — väderdata i raderna)
 *
 * Travet körs utomhus året om, och varje travmänniska vet att det
 * spelar roll: tung bana i regn, vinterbanans krav på skor, en solig
 * eftermiddag med snabba förhållanden. Statistiklagret (20.3) har
 * väntat på den här datan — "regn/sol kräver väderdata i raderna".
 *
 * ETAPP A ÄR DATAN, INTE EFFEKTEN: vädret hashas deterministiskt ur
 * säsong och vecka, visas på telefonens hemskärm och i loppfakta, och
 * stämplas på varje resultatrad så statistiken kan svara på "är hon
 * en regnhäst?". Loppmotorn rörs INTE — tidspåverkan och galopprisk i
 * väta är en motorändring som byggs med Ted vaken (antecknad i 20.3).
 * Vinterfönstret (v138) styr redan barfota-förbudet; snövädret här
 * följer samma veckor, så berättelsen och regeln pekar åt samma håll.
 */
import { vinterbana } from "./engine-utrustning.js";

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export const VÄDER = {
  sol: { namn: "Sol", glyf: "☀", text: "Fin bana och snabba förhållanden." },
  mulet: { namn: "Mulet", glyf: "☁", text: "Grått men torrt — en vanlig travdag." },
  regn: { namn: "Regn", glyf: "☂", text: "Tung bana i dag. Paraplyer på läktaren." },
  snö: { namn: "Snöväder", glyf: "❄", text: "Vinterbana på riktigt. Skor på, enligt reglerna." },
};

/** Veckans väder — hash-avgjort, samma karriär ger samma himmel. */
export function veckansVäder(spel) {
  const h = hash(`väder:${spel.säsong ?? 1}:${spel.vecka ?? 1}`) % 100;
  if (vinterbana(spel)) return h < 45 ? "snö" : h < 80 ? "mulet" : "sol";
  return h < 40 ? "sol" : h < 75 ? "mulet" : "regn";
}

/** Hela paketet för vyerna: id, namn, glyf och raden. */
export function väderläge(spel) {
  const id = veckansVäder(spel);
  return { id, ...VÄDER[id] };
}
