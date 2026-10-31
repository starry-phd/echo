/** Shared RN/Expo Web main-menu viewport sizing.
 * Retain the original header anchor but never overflow the lower viewport
 * on short native landscape screens. No DOM or private API dependencies. */
export function headerMenuMaxHeight(viewportHeight:number,menuTop:number):number{
 if(!Number.isFinite(viewportHeight)||!Number.isFinite(menuTop)
   ||viewportHeight<=0||menuTop<0)return 0;
 return Math.max(0,viewportHeight-menuTop-8);
}
