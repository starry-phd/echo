/**
 * Geometry for the original Echo first-run spotlight, restricted to visible
 * public controls. These pure functions do not inspect media or identities.
 */
export type TutorialRect={left:number;top:number;right:number;bottom:number};
export type TutorialViewport={width:number;height:number};
export type TutorialBox={left:number;top:number;width:number;height:number};
const clamp=(x:number,min:number,max:number)=>Math.min(Math.max(x,min),Math.max(min,max));

export function normalizeTutorialTarget(
 rect:TutorialRect,view:TutorialViewport,padding=6
):TutorialRect|null{
 const n=[rect.left,rect.top,rect.right,rect.bottom,view.width,view.height,padding];
 if(!n.every(Number.isFinite)||view.width<=0||view.height<=0||
  rect.right<=rect.left||rect.bottom<=rect.top||
  rect.right<=0||rect.left>=view.width||
  rect.bottom<=0||rect.top>=view.height)return null;
 const left=clamp(rect.left-padding,0,view.width);
 const top=clamp(rect.top-padding,0,view.height);
 const right=clamp(rect.right+padding,0,view.width);
 const bottom=clamp(rect.bottom+padding,0,view.height);
 if(right<=left||bottom<=top)return null;
 return {left,top,right,bottom};
}

/** The legacy logo highlighter surrounds the microphone and the four
 * brand characters, not its full flex-growing header button. Invalid or
 * disappearing pieces must not produce a misleading oversized outline. */
export function tutorialBrandBounds(icon:TutorialRect,label:TutorialRect):TutorialRect|null{
 const a=[icon.left,icon.top,icon.right,icon.bottom,label.left,label.top,label.right,label.bottom];
 if(!a.every(Number.isFinite)||icon.right<=icon.left||icon.bottom<=icon.top||
  label.right<=label.left||label.bottom<=label.top)return null;
 return {
  left:Math.min(icon.left,label.left),top:Math.min(icon.top,label.top),
  right:Math.max(icon.right,label.right),bottom:Math.max(icon.bottom,label.bottom)
 };
}

/** Four rectangles dim the viewport but never cover the actual highlighted box. */
export function tutorialSpotlightScrim(
 target:TutorialRect,view:TutorialViewport
):TutorialBox[]{
 return [
  {left:0,top:0,width:view.width,height:target.top},
  {left:0,top:target.bottom,width:view.width,height:Math.max(0,view.height-target.bottom)},
  {left:0,top:target.top,width:target.left,height:target.bottom-target.top},
  {left:target.right,top:target.top,width:Math.max(0,view.width-target.right),height:target.bottom-target.top},
 ].filter(box=>box.width>0&&box.height>0);
}

/** Keep the next/close controls visible on 320px phones and on landscape screens. */
export function tutorialCalloutPlacement(
 target:TutorialRect,view:TutorialViewport
):TutorialBox{
 const margin=12;
 const width=Math.max(1,Math.min(340,view.width-2*margin));
 const height=Math.min(260,Math.max(1,view.height-2*margin));
 const gap=14;
 const below=target.bottom+gap;
 const above=target.top-height-gap;
 const top=below+height<=view.height-margin
  ?below:above>=margin?above:clamp(below,margin,view.height-height-margin);
 return {left:clamp((target.left+target.right-width)/2,margin,view.width-width-margin),
  top,width,height};
}
