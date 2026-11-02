import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {publicReleaseHistory,PUBLIC_RELEASE_HISTORY_AS_OF}
 from '../src/ui/echo/publicReleaseHistory.ts';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('legacy footer has a reachable accessible release-history button',()=>{
 const home=read('app/index.tsx'),component=read('src/ui/echo/LegacyPublicReleaseHistory.tsx');
 assert.match(home,/import \{LegacyPublicReleaseHistory\}/);
 assert.match(home,/<View style=\{styles\.footerHistoryRow\}>/);
 assert.match(home,/<LegacyPublicReleaseHistory\/>/);
 assert.match(component,/accessibilityLabel="查看版本改版紀錄"/);
 assert.match(component,/onPress=\{\(\)=>setOpen\(true\)\}/);
 assert.match(component,/<Modal visible=\{open\} transparent animationType="fade" onRequestClose=\{close\}>/);
 assert.match(component,/accessibilityLabel="關閉版本改版紀錄"/);
 assert.match(component,/onPress=\{close\}/);
});

test('public-only history is an audited static excerpt and not an old private v3.x feed',()=>{
 assert.equal(PUBLIC_RELEASE_HISTORY_AS_OF,'2026/11/02');
 assert.equal(publicReleaseHistory.length,5);
 assert.deepEqual(publicReleaseHistory.map(x=>x.id),[
  'PR #139','PR #137–#138','PR #135–#136','PR #132–#134','公開訪客基座'
 ]);
 assert.deepEqual([...new Set(publicReleaseHistory.map(x=>x.id))].length,
  publicReleaseHistory.length);
 for(const item of publicReleaseHistory){
  assert.match(item.date,/^2026\/(?:10|11)\/\d{2}$/);
  assert.ok(item.title.length>2);
  assert.ok(item.changes.length>=2);
 }
 const data=read('src/ui/echo/publicReleaseHistory.ts');
 assert.doesNotMatch(data,/version: 'v3|DEFAULT_CHANGELOG_DATA|\/api\/|fetch\(|queryClient|sessionStorage|deviceId/);
});

test('private audio, billing and member features are not described as unlocked',()=>{
 const component=read('src/ui/echo/LegacyPublicReleaseHistory.tsx');
 assert.match(component,/僅節錄新版已完成驗收的公開訪客功能/);
 assert.match(component,/不是舊網站的完整版本紀錄/);
 assert.match(component,/中央會員登入、付費與私人媒體功能尚未開放/);
 assert.match(component,/公開封面及資訊卡不代表錄音有播放授權/);
 assert.doesNotMatch(component,/fetch\(|R2\.get|D1\.prepare|\/api\/|userEmail|isAdmin|onSave/);
 assert.doesNotMatch(read('src/ui/echo/publicReleaseHistory.ts'),/開放私秘|可播放私人|已完成登入|已上架|廣告已啟用/);
});

test('long history is scrollable with visible close, touch target and accessibility escape',()=>{
 const c=read('src/ui/echo/LegacyPublicReleaseHistory.tsx');
 assert.match(c,/<ScrollView style=\{styles\.historyScroll\}/);
 assert.match(c,/accessibilityViewIsModal onAccessibilityEscape=\{close\}/);
 assert.match(c,/minHeight:48/);
 assert.match(c,/maxHeight:'88%'/);
 assert.match(c,/publicReleaseHistory\.map\(item=>/);
 assert.match(c,/item\.changes\.map\(\(change,index\)=>/);
 assert.match(c,/const \{fontSize\}=useFontZoom\(\)/);
});
