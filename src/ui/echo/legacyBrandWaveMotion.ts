/** Original source of truth: yukidu/Echo-Starry/src/components/Navbar.v124.css.
 * Its last CSS overrides (lines 163-181) take precedence over the older
 * animate-ping/tailwind header markup: FOUR bars, 1.15s loop, stagger 0.14s.
 * Keep the math pure so CI can check phase continuity and reduced-motion.
 */
export const LEGACY_BRAND_WAVE_DURATION_MS=1150;
export const LEGACY_BRAND_WAVE_STAGGER_MS=140;
export const LEGACY_BRAND_WAVE_BAR_COUNT=4;
export const LEGACY_BRAND_WAVE_STEPS=16;
export const legacyBrandWaveInputRange=Array.from({length:LEGACY_BRAND_WAVE_STEPS+1},(_,i)=>i/LEGACY_BRAND_WAVE_STEPS);

export function legacyBrandWaveFrames(barIndex:number):{scale:number[];opacity:number[]}{
 if(!Number.isInteger(barIndex)||barIndex<0||barIndex>=LEGACY_BRAND_WAVE_BAR_COUNT)throw Error('Invalid brand wave index');
 const lag=barIndex*LEGACY_BRAND_WAVE_STAGGER_MS/LEGACY_BRAND_WAVE_DURATION_MS;
 const phase=(p:number)=>(p-lag+1)%1;
 // Old CSS: 0/100% height 4px, opacity .52; 50% height 14px, opacity 1.
 // Keep 14px geometry, animate scaleY so we can use the RN native driver.
 const strength=(p:number)=>(1-Math.cos(phase(p)*2*Math.PI))/2;
 const scales=legacyBrandWaveInputRange.map(p=>4/14+(1-4/14)*strength(p));
 const opacity=legacyBrandWaveInputRange.map(p=>.52+.48*strength(p));
 return {scale:scales,opacity};
}
