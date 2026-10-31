import test from 'node:test';
import assert from 'node:assert/strict';
import {cardMenuLayout,isCardMenuAnchorValid,canApplyCardMenuMeasurement} from '../src/ui/echo/cardMenuLayout.ts';
test('card menu stays in the viewport near each edge on phones and desktop',()=>{
 for(const width of [280,320,390,600,1440])for(const height of [320,844,900]){
  for(const x of [0,width-32])for(const y of [0,height-32]){
   const menu=cardMenuLayout({x,y,width:32,height:32},{width,height});
   assert.ok(menu.left>=0&&menu.left+menu.width<=width);
   assert.ok(menu.top>=0&&menu.top+menu.maxHeight<=height);
  }
 }
});
test('card menu chooses above a bottom anchor and below a top anchor',()=>{
 assert.ok(cardMenuLayout({x:300,y:780,width:32,height:32},{width:390,height:844}).top<780);
 assert.ok(cardMenuLayout({x:300,y:100,width:32,height:32},{width:390,height:844}).top>100);
});

test('native card menu discards invalid or unmounted anchor coordinates',()=>{
 const anchor={x:330,y:52,width:32,height:32};
 const context={sequence:9,trackId:'guest_approved_1',viewport:{width:390,height:844}};
 assert.equal(isCardMenuAnchorValid(anchor),true);
 assert.equal(canApplyCardMenuMeasurement(context,context,anchor),true);
 for(const bad of [
  {...anchor,x:Infinity},{...anchor,x:NaN},{...anchor,y:-Infinity},
  {...anchor,width:0},{...anchor,height:0},{...anchor,width:-20}
 ]){
  assert.equal(isCardMenuAnchorValid(bad),false);
  assert.equal(canApplyCardMenuMeasurement(context,context,bad),false);
 }
});

test('late measurement cannot reopen after a dismiss, rotation, card replacement or unmount',()=>{
 const anchor={x:330,y:52,width:32,height:32};
 const request={sequence:10,trackId:'guest_approved_1',viewport:{width:390,height:844}};
 const current={...request};
 assert.equal(canApplyCardMenuMeasurement(request,current,anchor),true);
 assert.equal(canApplyCardMenuMeasurement(request,{...current,sequence:11},anchor),false,
  'dismiss, new request, unmount, or effect cleanup increments generation');
 assert.equal(canApplyCardMenuMeasurement(request,{...current,trackId:'guest_approved_2'},anchor),false);
 assert.equal(canApplyCardMenuMeasurement(request,{...current,viewport:{width:844,height:390}},anchor),false);
 assert.equal(canApplyCardMenuMeasurement(request,{...current,viewport:{width:390,height:0}},anchor),false);
 assert.equal(canApplyCardMenuMeasurement(request,{...current,viewport:{width:Infinity,height:844}},anchor),false);
});
