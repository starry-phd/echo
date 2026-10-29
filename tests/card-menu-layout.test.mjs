import test from 'node:test';
import assert from 'node:assert/strict';
import {cardMenuLayout} from '../src/ui/echo/cardMenuLayout.ts';
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
