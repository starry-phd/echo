/** Original DetailView public-player UI constants; not an audio access grant. */
export const LEGACY_SKIP_SECONDS=[-30,-10,10,30] as const;
export const LEGACY_PLAYBACK_RATES=[0.7,1,1.25,1.5,2,2.3] as const;

/** The original scrubber only allows dragging from within 28px of its thumb. */
export function canBeginPlaybackScrub(
 touchX:number,currentTime:number,duration:number,width:number,radius=28
):boolean{
 if(!Number.isFinite(touchX)||!Number.isFinite(currentTime)||!Number.isFinite(duration)
  ||!Number.isFinite(width)||!Number.isFinite(radius)||duration<=0||width<=0||radius<0)return false;
 if(touchX<0||touchX>width)return false;
 const thumbX=width*Math.max(0,Math.min(duration,currentTime))/duration;
 return Math.abs(touchX-thumbX)<=radius;
}
/** Relative thumb drag: never seek outside a verified loaded stream. */
export function scrubTimeFromDelta(
 startTime:number,deltaX:number,duration:number,width:number
):number{
 if(!Number.isFinite(startTime)||!Number.isFinite(deltaX)
  ||!Number.isFinite(duration)||!Number.isFinite(width)||duration<=0||width<=0)return 0;
 return Math.min(duration,Math.max(0,startTime+deltaX/width*duration));
}
