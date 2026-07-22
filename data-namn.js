import { plock } from "./engine-util.js";
import { HÄST_FÖRLED, HÄST_EFTERLED } from "./data-namnpaket.js";

/* Hästnamnen byggs ur namnlagret. Efterleden är påhittade i stället för
   verkliga uppfödarsuffix, så att genererade namn inte krockar med
   existerande hästar. */
export const FÖRLED = HÄST_FÖRLED;
export const EFTERLED = HÄST_EFTERLED;

export const nyttNamn = () => plock(FÖRLED) + " " + plock(EFTERLED);
