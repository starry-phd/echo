import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const header=read('src/ui/echo/LegacyHeader.tsx');

test('original menu closes after ordinary theme toggle but preserves font and palette exceptions',()=>{
 assert.match(header,/<Pressable accessibilityRole="button" style=\{styles\.menuItem\}\s*onPress=\{\(\)=>\{colors\.toggleDark\(\);closeMenu\(\);\}\}>/);
 assert.match(header,/const closeMenu=\(\)=>\{setOpen\(false\);setDraggingQuickId\(null\);\}/);
 assert.match(header,/onPress=\{colors\.cyclePalette\}/);
 assert.match(header,/onPress=\{\(\)=>colors\.setPalette\(p\.id\)\}/);
 assert.match(header,/accessibilityLabel="縮小字體" onPress=\{decrease\}/);
 assert.match(header,/accessibilityLabel="放大字體" onPress=\{increase\}/);
 assert.match(header,/disabled=\{!quick\.ready\} onPress=\{\(\)=>togglePin\(id\)\}/);
});

test('normal menu navigation, close button and outside backdrop remain independent of theme toggle',()=>{
 assert.match(header,/onPress=\{closeMenu\} style=\{styles\.menuBackdrop\}/);
 assert.match(header,/accessibilityLabel="關閉主選單"\s*onPress=\{closeMenu\}/);
 assert.match(header,/onRequestClose=\{closeMenu\}/);
 assert.match(header,/buttons\.map\(\(\[label,fn\]\)=><Pressable key=\{label\}/);
 assert.match(header,/theme:\{label:colors\.dark\?'淺色模式':'深色模式',glyph:'◐',run:colors\.toggleDark\}/);
 assert.doesNotMatch(header,/document\.addEventListener|window\.addEventListener/);
});
