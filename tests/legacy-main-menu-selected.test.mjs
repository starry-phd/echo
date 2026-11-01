import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isSelectedPublicMenu} from '../src/ui/echo/mainMenuSelection.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('original main menu selected styles follow current public page and never claims member scope',()=>{
 const labels={'首頁':'/','排行榜':'/stats','通知中心':'/notifications','我的收藏（本裝置）':'/favorites','個人資料／登入':'/profile'};
 for(const [label,pathname] of Object.entries(labels)){
  assert.equal(isSelectedPublicMenu(label,pathname),true,label+' route');
  for(const otherPath of Object.values(labels).filter(x=>x!==pathname))
   assert.equal(isSelectedPublicMenu(label,otherPath),false);
 }
 assert.equal(isSelectedPublicMenu('我的貼紙','/stickers'),false);
 assert.equal(isSelectedPublicMenu('音檔管理','/upload'),false);
 assert.equal(isSelectedPublicMenu('後台管理','/admin'),false);
 assert.equal(isSelectedPublicMenu('通知中心','/private'),false);
 assert.equal(isSelectedPublicMenu('個人資料／登入','/preview/guest'),false);
 assert.equal(isSelectedPublicMenu('foo','foo'),false);
 assert.equal(isSelectedPublicMenu('首頁','/track/id'),false);
});
test('actual Header wires current page selection into guest menu while preserving approved navigation',()=>{
 const header=read('src/ui/echo/LegacyHeader.tsx');
 const helper=read('src/ui/echo/mainMenuSelection.ts');
 assert.match(header,/import \{isSelectedPublicMenu\} from '\.\/mainMenuSelection'/);
 assert.match(header,/const pathname=usePathname\(\)/);
 assert.match(header,/accessibilityState=\{\{selected:isSelectedPublicMenu\(label,pathname\)\}\}/);
 assert.match(header,/styles\.menuItem,isSelectedPublicMenu\(label,pathname\)&&\{backgroundColor:colors\.lightPill,borderRadius:11\}/);
 assert.match(header,/color:isSelectedPublicMenu\(label,pathname\)\?activeColor:colors\.ink/);
 assert.match(header,/\['通知中心',\(\)=>go\('\/notifications'\)\]/);
 assert.match(header,/\['個人資料／登入',\(\)=>go\('\/profile'\)\]/);
 assert.match(header,/<InstallAppButton earlyPrompt=\{earlyInstallPrompt\}/);
 assert.doesNotMatch(helper,/fetch\(|AsyncStorage|SELECT|R2|token|session|localStorage|\/api\//);
 assert.doesNotMatch(helper,/['"]\/(?:admin|billing|upload|private)/);
 assert.doesNotMatch(header,/router\.(?:push|replace)\(['"]\/(?:admin|billing|private)/);
});
