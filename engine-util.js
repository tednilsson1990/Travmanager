export const rnd = (a, b) => a + Math.random() * (b - a);
export const int = (a, b) => Math.floor(rnd(a, b + 1));
export const plock = (a) => a[Math.floor(Math.random() * a.length)];
export const klamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
export const kr = (n) => Math.round(n).toLocaleString("sv-SE");
export const blanda = (a) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = int(0, i);
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

/** Meter per hästlängd. */
export const LÄNGD = 2.8;

export const kmtid = (s) => {
  const m = Math.floor(s / 60);
  return m + "," + (s - m * 60).toFixed(1).padStart(4, "0").replace(".", ",");
};
export const tidText = (s) => {
  const m = Math.floor(s / 60);
  return m + ":" + (s - m * 60).toFixed(1).replace(".", ",");
};

/** Nummertäckets färger, ordnade efter startspår. */
/* Nummertäcken 1–15. De åtta första följer svensk standard; 9–15 är
   valda för att gå att skilja åt på en mobilskärm, inte för att vara exakta. */
export const TÄCKEN = [
  { bg: "#E9E6DF", fg: "#10161D" }, { bg: "#2B5FA8", fg: "#E9E6DF" },
  { bg: "#B23230", fg: "#E9E6DF" }, { bg: "#E4C33A", fg: "#10161D" },
  { bg: "#3D8C56", fg: "#E9E6DF" }, { bg: "#16191C", fg: "#E9E6DF" },
  { bg: "#D98BA8", fg: "#10161D" }, { bg: "#39A6A6", fg: "#10161D" },
  { bg: "#8A8F96", fg: "#10161D" }, { bg: "#7A4B28", fg: "#E9E6DF" },
  { bg: "#8FC6E8", fg: "#10161D" }, { bg: "#1E5B3A", fg: "#E9E6DF" },
  { bg: "#7A4FA3", fg: "#E9E6DF" }, { bg: "#C3D94E", fg: "#10161D" },
  { bg: "#D9C7A3", fg: "#10161D" },
];
export const täcke = (n) => TÄCKEN[(n - 1) % TÄCKEN.length];
