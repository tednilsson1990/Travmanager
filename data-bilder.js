/**
 * BILDREGISTRET — vilka motiv som finns i flera varianter
 *
 * Datalager, inte UI: både scenskaparna i motorn och vyerna behöver
 * kunna välja variant, och motorn får aldrig importera UI. Registret är
 * den enda plats som vet hur många foton varje motiv har — fyller Ted
 * på med en tredje segerbild är det EN siffra som ändras.
 *
 * Valet är DETERMINISTISKT av ett frö (säsong·100+vecka för scener,
 * hästnamnets hash för huvuden): samma händelse visar alltid samma
 * bild, hur många gånger sidan än ritas om, och scenen som sparats i
 * en sparfil bär sin upplösta bildsträng — rotationen sker vid
 * skapandet, aldrig vid visningen.
 */

/** Scenmotiv med flera varianter: motiv → antal foton (grundfil + -2, -3...). */
export const BILDVARIANTER = {
  "bana-kronvallen": 3,
  "seger": 2,
  "seger-storlopp": 2,
  "comeback": 2,
  "stall-morgon": 2,
  "facit": 2,
  "hage": 3,
};

/** Hästhuvuden per päls: päls → antal foton. */
export const HÄSTVARIANTER = {
  brun: 3, morkbrun: 3, fux: 2, svart: 2, skimmel: 1, ljusbrun: 1,
};

/**
 * Variantnamnet för ett motiv: "seger" eller "seger-2", valt av fröet.
 * Okända motiv returneras orörda — allt behöver inte varianter.
 */
export function bildvariant(id, frö = 0) {
  const antal = BILDVARIANTER[id] ?? 1;
  if (antal <= 1) return id;
  const n = (Math.abs(Math.trunc(frö)) % antal) + 1;
  return n === 1 ? id : `${id}-${n}`;
}
