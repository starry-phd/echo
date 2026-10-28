/** Pure UI helpers for public audio playback. No auth, progress, or storage side effects. */
export function clampSeekTime(position:number,duration:number):number {
 if(!Number.isFinite(position)||!Number.isFinite(duration)||duration<=0)return 0;
 return Math.min(duration,Math.max(0,position));
}
export function formatAudioTime(seconds:number):string {
 if(!Number.isFinite(seconds)||seconds<0)return '0:00';
 const value=Math.floor(seconds);
 const minutes=Math.floor(value/60);
 const remaining=String(value%60).padStart(2,'0');
 return minutes+':'+remaining;
}
