import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LEGACY_THEME_MOON_GLYPH,LEGACY_THEME_SUN_GLYPH,legacyThemeAction}
 from '../src/ui/echo/legacyThemeAction.ts';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const header=read('src/ui/echo/LegacyHeader.tsx');

test('original Navbar.tsx:223/431: light mode offers moon + 關燈, dark mode offers sun + 開燈',()=>{
 assert.deepEqual(legacyThemeAction(false),{glyph:'☾',menuLabel:'關燈',accessibilityLabel:'切換深色模式'});
 assert.deepEqual(legacyThemeAction(true),{glyph:'☀︎',menuLabel:'開燈',accessibilityLabel:'切換淺色模式'});
 assert.equal(LEGACY_THEME_MOON_GLYPH,'☾');
 // Text presentation selector: the sun must not become a colour emoji on iOS/Android.
 assert.equal(LEGACY_THEME_SUN_GLYPH.codePointAt(0),0x2600);
 assert.equal(LEGACY_THEME_SUN_GLYPH.codePointAt(1),0xFE0E);
});

test('main menu row uses the original moon/sun glyph and 關燈／開燈 wording, then still closes the menu',()=>{
 assert.match(header,/import \{legacyThemeAction\} from '\.\/legacyThemeAction';/);
 assert.match(header,/const themeAction=legacyThemeAction\(colors\.dark\);/);
 assert.match(header,/onPress=\{\(\)=>\{colors\.toggleDark\(\);closeMenu\(\);\}\} accessibilityLabel=\{themeAction\.menuLabel\}>/);
 assert.match(header,/\{themeAction\.glyph\}　\{themeAction\.menuLabel\}/);
 assert.doesNotMatch(header,/☾　\{colors\.dark\?'切換淺色模式':'切換深色模式'\}/);
 assert.doesNotMatch(header,/glyph:'◐'/);
});

test('pinned theme shortcut swaps moon/sun and announces the original toggle label; other shortcuts unchanged',()=>{
 assert.match(header,/theme:\{label:colors\.dark\?'淺色模式':'深色模式',glyph:themeAction\.glyph,run:colors\.toggleDark\}/);
 assert.match(header,/accessibilityLabel=\{id==='theme'\?themeAction\.accessibilityLabel:'快捷功能：'\+quickActions\[id\]\.label\}/);
 assert.match(header,/home:\{label:'首頁',glyph:'⌂',run:\(\)=>go\('\/'\)\}/);
 assert.match(header,/palette:\{label:'好心情',glyph:'✦',run:colors\.cyclePalette\}/);
 assert.match(header,/font:\{label:'字體',glyph:'A±',run:\(\)=>setOpen\(true\)\}/);
});

test('theme wording change is local UI only',()=>{
 const action=read('src/ui/echo/legacyThemeAction.ts');
 assert.doesNotMatch(action,/fetch\(|AsyncStorage|\/api\/|window\.|document\.|import /);
});
