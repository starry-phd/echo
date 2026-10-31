import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {categoryMenuPlacement,isCategoryMenuAnchorValid} from '../src/ui/echo/categoryDropdownPlacement.ts';
const toolbar=readFileSync(new URL('../src/ui/echo/LegacyFilterToolbar.tsx',import.meta.url),'utf8');

test('original outside click closes category dropdown; cross-platform modal preserves it without a DOM listener',()=>{
 assert.match(toolbar,/\bModal visible transparent animationType="none"/);
 assert.match(toolbar,/onRequestClose=\{dismissCategory\}/);
 assert.match(toolbar,/onAccessibilityEscape=\{dismissCategory\}/);
 assert.match(toolbar,/onPress=\{dismissCategory\} style=\{styles\.backdrop\}/);
 assert.match(toolbar,/backdrop:\{position:'absolute',top:0,bottom:0,left:0,right:0\}/);
 assert.doesNotMatch(toolbar,/document\.addEventListener|window\.addEventListener|pointerEvents="none"/);
});

test('backdrop is a sibling BEFORE the menu so option taps cannot hit the backdrop',()=>{
 const backdrop=toolbar.indexOf('onPress={dismissCategory} style={styles.backdrop}');
 const menu=toolbar.indexOf('<View style={[styles.menu');
 const option=toolbar.indexOf('onPress={()=>{onInteract?.();onCategory(value);setCategoryOpen(false);}');
 assert.ok(backdrop>0&&menu>backdrop&&option>menu);
 assert.match(toolbar,/keyboardShouldPersistTaps="always"/);
 assert.match(toolbar,/\[null,\.\.\.categories\]\.map\(value=>/);
 assert.match(toolbar,/accessibilityLabel=\{'選擇分類：'\+\(value\?\?'全部'\)\}/);
 assert.match(toolbar,/accessibilityLabel="關閉分類選單"/);
});

test('category anchor uses native measureInWindow, discards stale callbacks on resize and dismount',()=>{
 assert.match(toolbar,/categoryButtonRef\.current\?\.measureInWindow/);
 assert.match(toolbar,/generation!==measureGeneration\.current/);
 assert.match(toolbar,/useEffect\(\(\)=>\{measureGeneration\.current\+\+;setCategoryOpen\(false\);\},\[width,height\]\)/);
 assert.match(toolbar,/useEffect\(\(\)=>\(\)=>\{measureGeneration\.current\+\+;\},\[\]\)/);
 assert.equal(isCategoryMenuAnchorValid({x:350,y:25,width:45,height:46}),true);
 assert.equal(isCategoryMenuAnchorValid({x:0,y:0,width:0,height:46}),false);
 assert.equal(isCategoryMenuAnchorValid({x:Infinity,y:0,width:45,height:46}),false);
});

test('menu stays in horizontal viewport, opens below when possible and above near the bottom',()=>{
 let p=categoryMenuPlacement({x:344,y:120,width:44,height:46},{width:390,height:844});
 assert.equal(p.opensAbove,false);
 assert.equal(p.width,180);
 assert.equal(p.left,208);
 assert.equal(p.top,172);
 assert.equal(p.maxHeight,315);
 assert.equal(p.scrollMaxHeight,271);
 p=categoryMenuPlacement({x:340,y:730,width:44,height:46},{width:390,height:844});
 assert.equal(p.opensAbove,true);
 assert.ok(p.top>=8);
 assert.ok(p.top+p.maxHeight<=730);
 assert.equal(p.maxHeight,315);
});

test('small native/web viewports clamp the menu rather than hide the close control',()=>{
 const p=categoryMenuPlacement({x:256,y:270,width:42,height:46},{width:300,height:400});
 assert.equal(p.opensAbove,true);
 assert.ok(p.left>=8&&p.left+p.width<=292);
 assert.ok(p.top>=8&&p.top+p.maxHeight<=270);
 assert.equal(p.scrollMaxHeight,p.maxHeight-44);
 const q=categoryMenuPlacement({x:5,y:8,width:40,height:46},{width:320,height:568});
 assert.equal(q.opensAbove,false);
 assert.equal(q.left,8);
 assert.ok(q.top+q.maxHeight<=560);
});
