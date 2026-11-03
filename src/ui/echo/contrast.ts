/**
 * WCAG 2.1 contrast helpers for theme-derived TEXT colours.
 * The palette `primary` stays the brand fill colour (buttons keep white text);
 * `accessibleAccent` derives a text colour that reaches AA (4.5:1) on every
 * surface the app draws primary-coloured text on, in light and dark mode.
 */
type Rgb=[number,number,number];

export function parseHex(hex:string):Rgb{
 const m=/^#([0-9a-f]{6})$/i.exec(hex.trim());
 if(!m)throw new Error('Expected #rrggbb, got '+hex);
 const n=parseInt(m[1],16);
 return [(n>>16)&255,(n>>8)&255,n&255];
}
export function toHex([r,g,b]:Rgb):string{
 return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
}
/** `fg` at `alpha` over opaque `bg` (how `${primary}1a` pills render). */
export function composite(fg:string,alpha:number,bg:string):string{
 const f=parseHex(fg),b=parseHex(bg);
 return toHex([0,1,2].map(i=>f[i]*alpha+b[i]*(1-alpha)) as Rgb);
}
function channel(v:number):number{
 const s=v/255;
 return s<=0.03928?s/12.92:((s+0.055)/1.055)**2.4;
}
export function luminance(hex:string):number{
 const [r,g,b]=parseHex(hex);
 return 0.2126*channel(r)+0.7152*channel(g)+0.0722*channel(b);
}
export function contrastRatio(a:string,b:string):number{
 const la=luminance(a),lb=luminance(b);
 return (Math.max(la,lb)+0.05)/(Math.min(la,lb)+0.05);
}
function mix(a:string,b:string,t:number):string{
 const x=parseHex(a),y=parseHex(b);
 return toHex([0,1,2].map(i=>x[i]+(y[i]-x[i])*t) as Rgb);
}

export const AA_TEXT=4.5;
// Target slightly above AA so rounding in browsers never drops below 4.5.
const TARGET=4.6;

/** Light/dark surfaces that carry primary-coloured text (bg, card, tinted pills and panels). */
export function accentSurfaces(primary:string,dark:boolean):string[]{
 return dark
  ?['#0d0f17','#181c28','#1a1e2b','#23293b',composite(primary,0.16,'#181c28')]
  :['#fdf8f9','#ffffff',composite(primary,0.1,'#ffffff'),composite(primary,0.1,'#fdf8f9'),composite(primary,0.16,'#fdf8f9')];
}

/** Smallest shift of `primary` toward black (light) or white (dark) that reaches the target on all surfaces. */
export function accessibleAccent(primary:string,dark:boolean,target=TARGET):string{
 const surfaces=accentSurfaces(primary,dark);
 const toward=dark?'#ffffff':'#000000';
 for(let step=0;step<=100;step++){
  const candidate=mix(primary,toward,step/100);
  if(surfaces.every(s=>contrastRatio(candidate,s)>=target))return candidate;
 }
 return dark?'#ffffff':'#000000';
}

/** Muted (secondary) text colour that keeps AA on the same surfaces for every palette. */
export const MUTED_LIGHT='#525d6e';
export const MUTED_DARK='#a3b0c2';
