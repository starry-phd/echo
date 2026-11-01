import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {headerMenuMaxHeight} from '../src/ui/echo/headerMenuPlacement.ts';
const header=readFileSync(new URL('../src/ui/echo/LegacyHeader.tsx',import.meta.url),'utf8');

test('original Navbar outside-click dismissal is restored across native and Expo Web',()=>{
 assert.match(header,/<Modal visible=\{open\} transparent animationType="none" onRequestClose=\{closeMenu\}>/);
 assert.match(header,/onAccessibilityEscape=\{closeMenu\}/);
 assert.match(header,/accessibilityLabel="點選主選單外側關閉"/);
 assert.match(header,/onPress=\{closeMenu\} style=\{styles\.menuBackdrop\}/);
 assert.match(header,/menuBackdrop:\{position:'absolute',top:0,bottom:0,left:0,right:0,/);
 assert.match(header,/accessibilityLabel="關閉主選單"/);
 assert.doesNotMatch(header,/document\.addEventListener|window\.addEventListener/);
});

test('backdrop occurs before the actual panel to preserve inner menu actions and drag',()=>{
 const backdrop=header.indexOf('onPress={closeMenu} style={styles.menuBackdrop}');
 const panel=header.indexOf('styles.menuPanel,');
 const inner=header.indexOf('<ScrollView scrollEnabled={draggingQuickId===null}');
 assert.ok(backdrop>=0&&panel>backdrop&&inner>panel);
 assert.match(header,/quickEditorOrder\.map\(id=><View/);
 assert.match(header,/<QuickDragHandle id=\{id\}/);
 assert.match(header,/quick\.reorderPinned\(quickDevice,dragId,target\)/);
 assert.match(header,/onPress=\{colors\.cyclePalette\}/);
 assert.match(header,/onPress=\{\(\)=>colors\.setPalette\(p\.id\)\}/);
 assert.match(header,/onPress=\{\(\)=>\{colors\.toggleDark\(\);closeMenu\(\);\}\}/);
 assert.match(header,/scrollEnabled=\{draggingQuickId===null\}/);
});

test('screen orientation invalidates current menu and releases drag state',()=>{
 assert.match(header,/const closeMenu=\(\)=>\{setOpen\(false\);setDraggingQuickId\(null\);\}/);
 assert.match(header,/useEffect\(\(\)=>\{setOpen\(false\);setDraggingQuickId\(null\);\},\[width,height\]\)/);
 assert.match(header,/const go=\(path:.*?\)=>\{\s*requestDismissSearch\(\);\s*closeMenu\(\)/s);
 assert.match(header,/const menuTop=visualMetrics\.headerHeight\+visualMetrics\.headerActionsHeight/);
 assert.match(header,/maxHeight:headerMenuMaxHeight\(height,menuTop\)/);
});

test('landscape/compact viewports keep the panel inside the visible screen',()=>{
 assert.equal(headerMenuMaxHeight(844,104),732);
 assert.equal(headerMenuMaxHeight(320,104),208);
 assert.equal(headerMenuMaxHeight(136,104),24);
 assert.equal(headerMenuMaxHeight(108,104),0);
 assert.equal(headerMenuMaxHeight(Infinity,104),0);
 assert.equal(headerMenuMaxHeight(844,NaN),0);
});


test('hamburger announces the correct open or close action as expanded state changes',()=>{
 assert.match(header,/accessibilityLabel=\{open\?'關閉主選單':'開啟主選單'\}/);
 assert.match(header,/accessibilityState=\{\{expanded:open\}\}/);
 assert.match(header,/onPress=\{\(\)=>\{requestDismissSearch\(\);setOpen\(x=>!x\);\}\}/);
});
