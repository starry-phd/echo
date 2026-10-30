/** Original yukidu/Echo-Starry DetailView.tsx: w-36 h-36 sm:w-44 sm:h-44;
 * centered text-xl sm:text-2xl heading, with Tailwind sm=640px.
 * Pure layout; never conveys a playback right. */
export function legacyDetailHeroSizing(width:number){
 const sm=Number.isFinite(width)&&width>=640;
 return {portrait:sm?176:144,titleFont:sm?24:20};
}
