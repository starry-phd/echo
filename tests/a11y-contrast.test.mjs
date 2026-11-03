import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {AA_TEXT,MUTED_LIGHT,accentSurfaces,accessibleAccent,contrastRatio,composite} from '../src/ui/echo/contrast.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const palettes=[...read('src/ui/echo/legacyTheme.tsx').matchAll(/\['([a-z-]+)','[^']+','(#[0-9a-f]{6})','(#[0-9a-f]{6})'\]/gi)].map(m=>({id:m[1],primary:m[2]}));

test('contrast math matches WCAG reference values',()=>{
 assert.equal(contrastRatio('#000000','#ffffff').toFixed(2),'21.00');
 assert.equal(contrastRatio('#777777','#ffffff').toFixed(2),'4.48');
 assert.equal(composite('#c13f6f',0.1,'#ffffff'),'#f9ecf1'); // the pill colour axe measured in Production
 const measured=contrastRatio('#c13f6f','#f9ecf1'); // axe reported 4.34 for the failing A＋
 assert.ok(measured>4.3&&measured<AA_TEXT,String(measured));
});

test('accent text reaches AA on every themed surface for all 24 palettes, light and dark',()=>{
 assert.equal(palettes.length,24);
 for(const {id,primary} of palettes)for(const dark of [false,true]){
  const accent=accessibleAccent(primary,dark);
  for(const surface of accentSurfaces(primary,dark))
   assert.ok(contrastRatio(accent,surface)>=AA_TEXT,id+(dark?' dark':' light')+' '+accent+' on '+surface);
 }
 assert.equal(accessibleAccent('#5552b5',false),'#5552b5','already-compliant palettes are unchanged');
});

test('muted text and the amber advanced-filter hint reach AA',()=>{
 for(const {primary} of palettes)for(const s of accentSurfaces(primary,false))assert.ok(contrastRatio(MUTED_LIGHT,s)>=AA_TEXT);
 for(const {primary} of palettes)for(const s of accentSurfaces(primary,true))assert.ok(contrastRatio('#94a3b8',s)>=AA_TEXT);
 assert.ok(contrastRatio(accessibleAccent('#b47a08',false),'#fdf8f9')>=AA_TEXT);
 assert.ok(contrastRatio(accessibleAccent('#b47a08',true),'#0d0f17')>=AA_TEXT);
 assert.match(read('app/index.tsx'),/\{color:accessibleAccent\('#b47a08',theme\.dark\)\}/);
});

test('no text colour uses the raw brand fill; pending filter chips are outlined, not faded',()=>{
 const walk=d=>readdirSync(new URL('../'+d,import.meta.url),{withFileTypes:true}).flatMap(e=>
  e.isDirectory()?walk(d+e.name+'/'):e.name.endsWith('.tsx')?[d+e.name]:[]);
 for(const file of [...walk('app/'),...walk('src/')]){
  const src=read(file);
  assert.doesNotMatch(src,/[{,]color:[^,}]*palette\.primary/,file+' uses palette.primary as a text colour');
 }
 const theme=read('src/ui/echo/legacyTheme.tsx');
 assert.match(theme,/accentText:accessibleAccent\(current\.primary,dark\)/);
 assert.match(theme,/muted:dark\?'#94a3b8':MUTED_LIGHT/);
 assert.match(read('src/ui/echo/LegacyHeader.tsx'),/const activeColor=colors\.accentText;/);
 const toolbar=read('src/ui/echo/LegacyFilterToolbar.tsx');
 assert.doesNotMatch(toolbar,/opacity:unavailable/);
 assert.match(toolbar,/backgroundColor:t\.lightPill,borderColor:t\.accentText,borderStyle:'dashed'/);
});
