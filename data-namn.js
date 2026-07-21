import { plock } from "./engine-util.js";

export const FÖRLED = ["Global","Zenit","Nordisk","Vinter","Ravel","Cyklon","Åsa","Trolle",
  "Mimer","Saga","Bore","Elden","Ymer","Vixen","Kajsa","Haga","Stjärn","Torp","Järva","Rimfrost"];
export const EFTERLED = ["Broline","Gift","Face","Boko","Sisu","Palema","Am","Diamant",
  "Hornline","Kronos","Tilly","Vinge","Ester","Rapid","Crown","Sund"];

export const nyttNamn = () => plock(FÖRLED) + " " + plock(EFTERLED);
