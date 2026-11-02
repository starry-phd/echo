/** Original source of truth: yukidu/Echo-Starry@82cbf4f
 *  - src/components/TwinklingStars.tsx (deterministic star field, 18/28/42 stars)
 *  - src/index.css lines 241-293 (starTwinkleSlow/Medium/Fast keyframes, 4s/2.8s/1.8s ease-in-out)
 *  - src/components/Navbar.tsx:549, DetailView.tsx:700 and :998 (placements and opacities)
 * Pure data and math only: no network, storage, audio, member or device identity.
 */
export type LegacyTwinkleDensity='subtle'|'normal'|'dense';
export type LegacyTwinkleShape='sparkle'|'dot'|'cross';
export type LegacyTwinkleSpeedId='slow'|'medium'|'fast';
export type LegacyTwinklePlacement='header'|'detailHero'|'detailNotes';

export type LegacyTwinkleStar={
 id:number;
 top:number;
 left:number;
 size:number;
 type:LegacyTwinkleShape;
 color:string;
 speed:LegacyTwinkleSpeedId;
 delaySeconds:number;
 opacity:number;
};

export type LegacyTwinkleKeyframe={opacity:number;scale:number};
export type LegacyTwinkleSpeed={id:LegacyTwinkleSpeedId;durationMs:number;edge:LegacyTwinkleKeyframe;middle:LegacyTwinkleKeyframe};

export const LEGACY_TWINKLE_COUNTS:Readonly<Record<LegacyTwinkleDensity,number>>={subtle:18,normal:28,dense:42};
export const LEGACY_TWINKLE_COLORS=['#f59e0b','#fbbf24','#f43f5e','#ec4899','#38bdf8','#ffffff','#c084fc'] as const;
/** index.css: 0%/100% is `edge`, 50% is `middle`; each half uses CSS ease-in-out. */
export const LEGACY_TWINKLE_SPEEDS:readonly LegacyTwinkleSpeed[]=[
 {id:'slow',durationMs:4000,edge:{opacity:.15,scale:.75},middle:{opacity:1,scale:1.25}},
 {id:'medium',durationMs:2800,edge:{opacity:.85,scale:1.15},middle:{opacity:.2,scale:.7}},
 {id:'fast',durationMs:1800,edge:{opacity:.25,scale:.85},middle:{opacity:.95,scale:1.3}}
];
/** Container opacity classes from the three original mount points (light/dark). */
export const LEGACY_TWINKLE_PLACEMENTS:Readonly<Record<LegacyTwinklePlacement,{density:LegacyTwinkleDensity;light:number;dark:number}>>={
 header:{density:'subtle',light:.75,dark:.9},
 detailHero:{density:'normal',light:.8,dark:.95},
 detailNotes:{density:'subtle',light:.4,dark:.6}
};
/** Half-width of each rhombus as a fraction of the star radius, derived from the
 * original SVG paths: sparkle inner vertices (10,9)/(14,15) on a 24 box → 0.2;
 * cross inner vertices (6,6)/(10,10) on a 16 box → 1/3. Two crossing rhombi
 * with this waist reproduce the original four-point polygon exactly. */
export const LEGACY_TWINKLE_STAR_WAIST:Readonly<Record<Exclude<LegacyTwinkleShape,'dot'>,number>>={sparkle:.2,cross:1/3};
export const LEGACY_TWINKLE_CROSS_OPACITY=.9;
export const LEGACY_TWINKLE_STEPS=32;
export const legacyTwinkleInputRange=Array.from({length:LEGACY_TWINKLE_STEPS+1},(_,i)=>i/LEGACY_TWINKLE_STEPS);

const SPEED_ORDER=['slow','medium','fast'] as const satisfies readonly LegacyTwinkleSpeedId[];

/** Same pseudo-random sequence and rounding as the original useMemo. */
export function legacyTwinklingStars(density:LegacyTwinkleDensity='normal'):LegacyTwinkleStar[]{
 const count=LEGACY_TWINKLE_COUNTS[density];
 if(count===undefined)throw Error('Invalid twinkle density');
 const items:LegacyTwinkleStar[]=[];
 for(let i=0;i<count;i++){
  const seed=(i*9301+49297)%233280;
  const rnd1=seed/233280;
  const rnd2=((seed*9301+49297)%233280)/233280;
  const rnd3=((seed*1337+7919)%233280)/233280;
  let type:LegacyTwinkleShape='dot';
  let size:number;
  if(rnd3>.75){type='sparkle';size=Math.round(rnd1*6+8);}
  else if(rnd3>.45){type='cross';size=Math.round(rnd1*4+5);}
  else size=Math.round(rnd1*2.5+1.5);
  items.push({
   id:i,
   top:Math.round(rnd1*94+3),
   left:Math.round(rnd2*96+2),
   size,type,
   color:LEGACY_TWINKLE_COLORS[i%LEGACY_TWINKLE_COLORS.length]??LEGACY_TWINKLE_COLORS[0],
   speed:SPEED_ORDER[i%SPEED_ORDER.length]??SPEED_ORDER[0],
   delaySeconds:(i*.35)%3.5,
   opacity:Math.min(.9,Math.max(.35,rnd3))
  });
 }
 return items;
}

export function legacyTwinkleSpeed(id:LegacyTwinkleSpeedId):LegacyTwinkleSpeed{
 const speed=LEGACY_TWINKLE_SPEEDS.find(item=>item.id===id);
 if(!speed)throw Error('Invalid twinkle speed');
 return speed;
}

/** CSS `ease-in-out` = cubic-bezier(.42,0,.58,1), solved by bisection. */
export function legacyCssEaseInOut(x:number):number{
 if(!Number.isFinite(x))throw Error('Invalid easing input');
 if(x<=0)return 0;
 if(x>=1)return 1;
 const bezier=(t:number,p1:number,p2:number)=>3*(1-t)*(1-t)*t*p1+3*(1-t)*t*t*p2+t*t*t;
 let low=0,high=1;
 for(let i=0;i<50;i++){
  const mid=(low+high)/2;
  if(bezier(mid,.42,.58)<x)low=mid;else high=mid;
 }
 return bezier((low+high)/2,0,1);
}

/** Value of one original keyframe animation at cycle progress u∈[0,1). */
export function legacyTwinkleKeyframe(speed:LegacyTwinkleSpeed,u:number):LegacyTwinkleKeyframe{
 if(!Number.isFinite(u))throw Error('Invalid twinkle progress');
 const p=((u%1)+1)%1;
 const rising=p<.5;
 const from=rising?speed.edge:speed.middle;
 const to=rising?speed.middle:speed.edge;
 const k=legacyCssEaseInOut(rising?p/.5:(p-.5)/.5);
 return {opacity:from.opacity+(to.opacity-from.opacity)*k,scale:from.scale+(to.scale-from.scale)*k};
}

/** Frames against one shared linear clock per speed. The original per-star
 * animation-delay becomes a phase lag, so steady-state timing matches CSS. */
export function legacyTwinkleFrames(star:Pick<LegacyTwinkleStar,'speed'|'delaySeconds'>):{opacity:number[];scale:number[]}{
 const speed=legacyTwinkleSpeed(star.speed);
 if(!Number.isFinite(star.delaySeconds)||star.delaySeconds<0)throw Error('Invalid twinkle delay');
 const lag=(star.delaySeconds*1000%speed.durationMs)/speed.durationMs;
 const values=legacyTwinkleInputRange.map(p=>legacyTwinkleKeyframe(speed,p-lag));
 return {opacity:values.map(v=>v.opacity),scale:values.map(v=>v.scale)};
}

export function legacyTwinkleFieldOpacity(placement:LegacyTwinklePlacement,dark:boolean):number{
 const preset=LEGACY_TWINKLE_PLACEMENTS[placement];
 if(!preset)throw Error('Invalid twinkle placement');
 return dark?preset.dark:preset.light;
}
