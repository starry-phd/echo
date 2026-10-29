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
