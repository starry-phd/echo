import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const home=read('app/index.tsx');
const preview=read('app/preview/[id].tsx');
const control=read('src/ui/echo/LegacyBackToTop.tsx');

test('original Echo App floating arrow returns both public catalog and metadata-only detail to top',()=>{
 assert.match(home,/<View style=\{styles\.screen\}><ScrollView ref=\{homeScrollRef\}/);
 assert.match(home,/<LegacyBackToTop onPress=\{\(\)=>\{/);
 assert.match(home,/homeScrollRef\.current\?\.scrollTo\(\{y:0,animated:true\}\)/);
 assert.match(preview,/<View style=\{styles\.screen\}><ScrollView ref=\{sections\.scrollRef\}/);
 assert.match(preview,/LegacyBackToTop onPress=\{\(\)=>sections\.scrollRef\.current\?\.scrollTo\(\{y:0,animated:true\}\)\}/);
 assert.match(home,/screen:\{flex:1\}/);
 assert.match(preview,/screen:\{flex:1\}/);
});

test('floating action is a visible, accessible, non-obstructive overlay and never dereferences private media',()=>{
 assert.match(control,/accessibilityRole="button"/);
 assert.match(control,/accessibilityLabel="回到頁面最前面"/);
 assert.match(control,/onPress=\{onPress\}/);
 assert.match(control,/position:'absolute'/);
 assert.match(control,/backgroundColor:theme\.dark\?/);
 assert.match(control,/width:58,height:58/);
 for(const source of [control,home.slice(home.lastIndexOf('<LegacyBackToTop'),home.lastIndexOf('</View>;'))]){
  assert.doesNotMatch(source,/fetch\(|Audio\.|\.play\(|R2|localStorage|\.get\(/);
 }
});

test('home return-to-top closes hints/keyboard but never resets search filters or navigation',()=>{
 const start=home.lastIndexOf('<LegacyBackToTop onPress=');
 const end=home.indexOf('/>',start);
 assert.ok(start>0&&end>start);
 const action=home.slice(start,end);
 assert.match(action,/searchSuggestionBlurGuard\.dismiss\(\)/);
 assert.match(action,/Keyboard\.dismiss\(\)/);
 assert.match(action,/homeScrollRef\.current\?\.scrollTo\(\{y:0,animated:true\}\)/);
 assert.doesNotMatch(action,/setQuery\(|setCategory\(|setOrder\(|router\.|getPublicTracks|\/api\//);
});
