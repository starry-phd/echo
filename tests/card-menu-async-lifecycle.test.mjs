import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const card=readFileSync(new URL('../src/ui/echo/LegacyTrackCard.tsx',import.meta.url),'utf8');

test('card menu checks exact request and live context before applying an async measurement',()=>{
 assert.match(card,/const menuSequence=useRef\(0\)/);
 assert.match(card,/latestMenuContext\.current=\{trackId:track\.id,viewport:/);
 assert.match(card,/const requested=\{sequence:\+\+menuSequence\.current,trackId:track\.id,/);
 assert.match(card,/moreAnchor\.current\?\.measureInWindow\(\(x,y,width,height\)=>\{/);
 assert.match(card,/const current=\{sequence:menuSequence\.current,\.\.\.latestMenuContext\.current\}/);
 const begin=card.indexOf('moreAnchor.current?.measureInWindow');
 const guard=card.indexOf('if(!canApplyCardMenuMeasurement(requested,current,anchor))return;');
 const apply=card.indexOf('setMenuPosition(cardMenuLayout(anchor,requested.viewport));');
 assert.ok(begin>=0&&guard>begin&&apply>guard,'never show stale measurement');
 assert.match(card,/useEffect\(\(\)=>\{menuSequence\.current\+\+;setOpen\(false\);\},\[track\.id,viewport\.width,viewport\.height\]\)/);
 assert.match(card,/useEffect\(\(\)=>\(\)=>\{menuSequence\.current\+\+;\},\[\]\)/);
});

test('all card menu exits invalidate any pending measurement, including Android back and screenreader escape',()=>{
 assert.match(card,/const dismissMenu=\(\)=>\{menuSequence\.current\+\+;setOpen\(false\);\}/);
 assert.match(card,/onRequestClose=\{dismissMenu\}/);
 assert.match(card,/onAccessibilityEscape=\{dismissMenu\}/);
 assert.match(card,/onPress=\{dismissMenu\} style=\{\[StyleSheet\.absoluteFill,styles\.menuBackdrop\]\}/);
 assert.match(card,/accessibilityLabel="關閉音檔選單" style=\{styles\.popupRow\} onPress=\{dismissMenu\}/);
 for(const name of ['toggleFavorite','toggleDetails','playFromPhoto','share','hideOneSpeaker']){
  assert.match(card,new RegExp('const '+name+'.*?=>\\{\\s*dismissMenu\\(\\);','s'),name);
 }
 assert.match(card,/const noLike=\(\)=>\{dismissMenu\(\);onDislike\(track\.id\);\}/);
 // No web-only document/window listener; nothing bypasses public permission gates.
 assert.doesNotMatch(card,/document\.addEventListener|window\.addEventListener/);
 assert.match(card,/if\(!publicShareMessage\)/);
 assert.match(card,/if\(!track\.playable\)/);
});
