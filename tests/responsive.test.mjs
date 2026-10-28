import test from 'node:test';
import assert from 'node:assert/strict';
import {viewportLayout} from '../src/ui/responsive.ts';
test('legacy UI remains one-column, thumb reachable on phone widths',()=>{
 for(const w of [320,360,375,390,414,430]){
  const v=viewportLayout(w);
  assert.equal(v.phone,true);
  assert.equal(v.columns,1);
  assert.ok(v.menuWidth<=w-20);
  assert.ok(v.luckyWidth+9+v.searchMinWidth<=v.usable+1);
  assert.ok(v.fourButtonWidth>54);
  assert.ok(v.filterFontSize>=10);
  assert.ok(v.minimumTouchHeight>=44);
 }
});
test('tablet is conservative one-column; desktop grows to two columns',()=>{
 for(const width of [600,768,820,899])assert.equal(viewportLayout(width).columns,1);
 for(const width of [900,1024,1440])assert.equal(viewportLayout(width).columns,2);
 assert.equal(viewportLayout(1440).usable,832);
});
test('tiny or invalid viewports stay bounded with no unbounded menu',()=>{
 for(const width of [0,NaN,280]){
  const v=viewportLayout(width);
  assert.ok(v.menuWidth<=Math.max(280,width||0)-20);
  assert.equal(v.columns,1);
 }
});
