/** Coordinates for a native Modal, outside the card grid's stacking contexts. */
export function cardMenuLayout(anchor:{x:number;y:number;width:number;height:number},viewport:{width:number;height:number}){
 const screenWidth=Math.max(1,viewport.width),screenHeight=Math.max(1,viewport.height);
 const padding=Math.min(8,screenWidth/4,screenHeight/4);
 const width=Math.min(200,screenWidth-padding*2);
 const maxHeight=Math.min(234,screenHeight-padding*2);
 const left=Math.max(padding,Math.min(screenWidth-padding-width,anchor.x+anchor.width-width));
 const below=anchor.y+anchor.height+5;
 const preferred=below+maxHeight<=screenHeight-padding?below:anchor.y-maxHeight-5;
 const top=Math.max(padding,Math.min(screenHeight-padding-maxHeight,preferred));
 return {left,top,width,maxHeight};
}

/** The native measureInWindow callback is asynchronous and can arrive after
 * a card is replaced, hidden, viewport resized, menu dismissed, or unmounted.
 * Checking only geometry is not enough; match the original request context. */
export type CardMenuMeasureSnapshot={
 sequence:number;trackId:string;viewport:{width:number;height:number};
};
export function isCardMenuAnchorValid(anchor:{x:number;y:number;width:number;height:number}):boolean{
 return [anchor.x,anchor.y,anchor.width,anchor.height].every(Number.isFinite)
  &&anchor.width>0&&anchor.height>0;
}
export function canApplyCardMenuMeasurement(
 requested:CardMenuMeasureSnapshot,
 current:CardMenuMeasureSnapshot,
 anchor:{x:number;y:number;width:number;height:number}
):boolean{
 return requested.sequence===current.sequence
  &&requested.trackId===current.trackId
  &&requested.viewport.width===current.viewport.width
  &&requested.viewport.height===current.viewport.height
  &&Number.isFinite(current.viewport.width)&&current.viewport.width>0
  &&Number.isFinite(current.viewport.height)&&current.viewport.height>0
  &&isCardMenuAnchorValid(anchor);
}
