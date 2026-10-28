/**
 * Mobile-first layout contract. The device VIEWPORT, not the window's design
 * screenshots, chooses each layout. Keep 320px phones usable before tablet
 * or desktop layout changes. Displayed content is always bounded by screen.
 */
export function viewportLayout(width:number){
 const safe=Number.isFinite(width)?Math.max(280,width):280;
 const phone=safe<600;
 const columns=safe>=900?2:1;
 const horizontalGutter=safe<375?10:12;
 const usable=Math.min(832,safe-horizontalGutter*2);
 const menuWidth=Math.max(248,Math.min(310,safe-20));
 const luckyWidth=phone?Math.min(125,Math.max(102,Math.round(usable*.34))):166;
 const searchMinWidth=Math.max(120,usable-luckyWidth-9);
 const fourButtonWidth=(usable-8-15)/4;
 return {phone,columns,usable,menuWidth,luckyWidth,searchMinWidth,
  filterFontSize:fourButtonWidth<76?10:fourButtonWidth<100?11:13,
  horizontalGutter,minimumTouchHeight:44};
}
