import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('original Navbar explicit menu home button refreshes public catalog unlike logo reset',()=>{
 const h=read('src/ui/echo/LegacyHeader.tsx');
 const layout=read('app/_layout.tsx');
 const home=read('app/index.tsx');
 assert.ok(layout.includes('<QueryClientProvider client={queryClient}>'));
 assert.ok(h.includes("import {useQueryClient} from '@tanstack/react-query';"));
 assert.ok(h.includes('const queryClient=useQueryClient();'));
 assert.ok(h.includes('const refreshApprovedHome=()=>{'));
 assert.match(h,/accessibilityLabel="回首頁並重新整理公開清單"/);
 assert.match(h,/onPress=\{refreshApprovedHome\}/);
 assert.match(h,/onPress=\{\(\)=>go\('\/'\)\} style=\{styles\.brand\}/);
 assert.match(h,/home:\{label:'首頁',glyph:'⌂',run:\(\)=>go\('\/'\)\}/);
 assert.match(home,/queryKey:\['echo','public-tracks',debouncedQuery,category\]/);
 assert.match(home,/queryKey:\['echo','guest-previews'\]/);
 assert.match(home,/queryKey:\['echo','public-health'\]/);
 assert.match(home,/queryKey:\['echo','categories'\]/);
});

test('refresh path invalidates only the four existing approved-public query families',()=>{
 const src=read('src/ui/echo/LegacyHeader.tsx');
 const start=src.indexOf(' const refreshApprovedHome=()=>{');
 const end=src.indexOf(' const activeColor=',start);
 assert.ok(start>0&&end>start);
 const refresh=src.slice(start,end);
 assert.match(refresh,/go\('\/'\);/);
 assert.match(refresh,/for\(const name of \['public-tracks','guest-previews','categories','public-health'\] as const\)/);
 assert.match(refresh,/queryClient\.invalidateQueries\(\{queryKey:\['echo',name\],refetchType:'active'\}\)/);
 assert.doesNotMatch(refresh,/queryClient\.clear|resetQueries|removeQueries|window\.location|document\./);
 for(const privateKey of ['private','member','audio','starry-id','billing','entitlement','revenuecat','admin']){
  assert.ok(!refresh.includes(privateKey),privateKey);
 }
});

test('refreshing from a detail route still uses protected home reset and removes stale deep-link params',()=>{
 const src=read('src/ui/echo/LegacyHeader.tsx');
 const go=src.slice(src.indexOf(" const go=(path:'/'"),src.indexOf(' const refreshApprovedHome'));
 assert.ok(go.includes('requestDismissSearch();'));
 assert.ok(go.includes('closeMenu();'));
 assert.ok(go.includes('requestReset();'));
 assert.ok(go.includes("router.replace('/');"));
 const refresh=src.slice(src.indexOf(' const refreshApprovedHome'),src.indexOf(' const activeColor'));
 assert.ok(refresh.indexOf("go('/');")<refresh.indexOf('queryClient.invalidateQueries('));
});
