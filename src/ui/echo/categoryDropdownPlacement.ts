/** Window-space placement shared by RN native and Expo Web; no DOM access. */
export type CategoryMenuAnchor={x:number;y:number;width:number;height:number};
export type CategoryMenuViewport={width:number;height:number};

export function isCategoryMenuAnchorValid(anchor:CategoryMenuAnchor):boolean{
 return [anchor.x,anchor.y,anchor.width,anchor.height].every(Number.isFinite)
  &&anchor.width>0&&anchor.height>0;
}

/** Keep the trigger right edge aligned, avoid horizontal overflow, and place the
 * scrollable menu above when there is insufficient space below. The final 44px
 * is reserved for the always-available explicit close control. */
export function categoryMenuPlacement(anchor:CategoryMenuAnchor,viewport:CategoryMenuViewport){
 const edge=8,gap=6,maxHeight=315;
 const width=Math.min(180,Math.max(0,viewport.width-2*edge));
 const left=Math.max(edge,Math.min(anchor.x+anchor.width-width,viewport.width-edge-width));
 const belowTop=anchor.y+anchor.height+gap;
 const below=Math.max(0,viewport.height-edge-belowTop);
 const above=Math.max(0,anchor.y-edge-gap);
 const opensAbove=below<200&&above>below;
 const available=opensAbove?above:below;
 const menuMaxHeight=Math.min(maxHeight,available);
 return {
  left,top:opensAbove?Math.max(edge,anchor.y-gap-menuMaxHeight):Math.max(edge,belowTop),
  width,maxHeight:menuMaxHeight,scrollMaxHeight:Math.max(0,menuMaxHeight-44),opensAbove
 };
}
