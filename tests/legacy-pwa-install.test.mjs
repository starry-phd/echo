import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {detectInstallPlatform,manualInstallHelp} from '../src/ui/echo/installGuide.ts';

const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');

test('original app name, icon assets and standalone scope are preserved without legacy cross-origin app links',()=>{
 const manifest=JSON.parse(read('public/manifest.webmanifest'));
 assert.equal(manifest.name,'繁星回聲');
 assert.equal(manifest.short_name,'繁星回聲');
 assert.equal(manifest.start_url,'/');
 assert.equal(manifest.scope,'/');
 assert.equal(manifest.id,'/');
 assert.equal(manifest.display,'standalone');
 assert.equal(manifest.lang,'zh-Hant-TW');
 assert.equal(manifest.prefer_related_applications,false);
 assert.equal(manifest.related_applications,undefined,'never associate this PWA with a legacy unreviewed origin');
 assert.deepEqual(manifest.icons.filter(x=>x.type==='image/png').map(x=>[x.src,x.sizes]),
  [['/icon-192.png','192x192'],['/icon-512.png','512x512']]);
 for(const file of ['public/icon-192.png','public/icon-512.png']){
  const bytes=readFileSync(new URL(file,root));
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',file+' must be a genuine PNG');
  assert.ok(bytes.length>1000);
 }
 for(const file of ['public/icon.svg','public/icon-monochrome.svg']){
  assert.match(read(file),/<svg/);
 }
});

test('Expo 58 static HTML includes manifest and original icons, not a private-data caching worker',()=>{
 const doc=read('app/+html.tsx');
 assert.match(doc,/useServerDocumentContext/);
 assert.match(doc,/<link rel="manifest" href="\/manifest\.webmanifest"\/>/);
 assert.match(doc,/<link rel="apple-touch-icon" href="\/icon-192\.png"\/>/);
 assert.match(doc,/<html lang="zh-Hant-TW"/);
 assert.doesNotMatch(doc,/serviceWorker\.register|\/sw\.js|workbox/);
});

test('iPadOS modern desktop user agent, Android, iPhone, desktop receive correct install guidance',()=>{
 assert.equal(detectInstallPlatform('Mozilla iPhone Safari','iPhone',0),'ios');
 assert.equal(detectInstallPlatform('Mozilla Macintosh Safari','MacIntel',5),'ios');
 assert.equal(detectInstallPlatform('Mozilla Android Chrome','Linux armv8l',5),'android');
 assert.equal(detectInstallPlatform('Mozilla Windows Chrome','Win32',0),'desktop');
 for(const info of Object.values(manualInstallHelp))assert.ok(info.length>30);
 assert.match(manualInstallHelp.ios,/Safari/);
 assert.match(manualInstallHelp.android,/Chrome/);
 assert.match(manualInstallHelp.desktop,/Edge/);
});

test('real web install button handles native browser install events and safe manual fallback',()=>{
 const button=read('src/ui/echo/InstallAppButton.tsx');
 const header=read('src/ui/echo/LegacyHeader.tsx');
 assert.match(button,/beforeinstallprompt/);
 assert.match(button,/appinstalled/);
 assert.match(button,/await current\.prompt\(\)/);
 assert.match(button,/await current\.userChoice/);
 assert.match(button,/display-mode: standalone/);
 assert.match(button,/manualInstallHelp\[device\]/);
 assert.match(button,/Platform\.OS!=='web'/);
 assert.match(button,/if\(Platform\.OS!=='web'\|\|isInstalled\)return null;/,'already installed standalone must not offer installation');
 assert.match(button,/不會開放尚未授權的音檔/);
 assert.doesNotMatch(button,/serviceWorker\.register|cache\.addAll|navigator\.serviceWorker/);
 assert.match(header,/import \{InstallAppButton\} from '\.\/InstallAppButton'/);
 assert.match(header,/<InstallAppButton earlyPrompt=\{earlyInstallPrompt\} onPromptConsumed=/);
});

test('Web PWA install prompt buffer is mounted with the Header, separate from menu click handling',()=>{
 const header=read('src/ui/echo/LegacyHeader.tsx');
 const hook=read('src/ui/echo/useEarlyInstallPrompt.ts');
 const button=read('src/ui/echo/InstallAppButton.tsx');
 const layout=read('app/_layout.tsx');
 assert.match(layout,/<LegacyHeader\/>/);
 assert.match(header,/const \{earlyInstallPrompt,installedInThisTab,consumeEarlyPrompt\}=useEarlyInstallPrompt\(\)/);
 assert.match(header,/<InstallAppButton earlyPrompt=\{earlyInstallPrompt\} onPromptConsumed=\{consumeEarlyPrompt\} installedInThisTab=\{installedInThisTab\}\/>/);
 assert.match(hook,/if\(Platform\.OS!=='web'\|\|typeof window==='undefined'\)return/);
 assert.match(hook,/window\.addEventListener\('beforeinstallprompt',capture\)/);
 assert.match(hook,/window\.removeEventListener\('beforeinstallprompt',capture\)/);
 assert.match(hook,/window\.addEventListener\('appinstalled',markInstalled\)/);
 assert.match(hook,/window\.removeEventListener\('appinstalled',markInstalled\)/);
 assert.match(hook,/event\.preventDefault\(\)/);
 assert.match(button,/const pendingPrompt=prompt\?\?earlyPrompt/);
 assert.match(button,/if\(!pendingPrompt\)\{setGuideOpen\(true\);return;\}/);
 assert.match(button,/const current=pendingPrompt/);
 assert.match(button,/onPromptConsumed\(\)/);
 assert.match(button,/await current\.prompt\(\)/);
 assert.match(button,/await current\.userChoice/);
 assert.match(button,/pendingPrompt\?'可安裝':'查看步驟'/);
 // Only the dedicated lifecycle hook may touch window events. Header's
 // backdrop/search dismissal remains cross-platform rather than DOM-wide.
 assert.doesNotMatch(header,/document\.addEventListener|window\.addEventListener/);
 assert.doesNotMatch(hook,/serviceWorker|R2\.get\(|\.prepare\(/);
 assert.doesNotMatch(button,/serviceWorker|R2\.get\(|\.prepare\(/);
});

test('legacy PWA installed/uninstalled browser lifecycle survives a closed menu',()=>{
 const hook=read('src/ui/echo/useEarlyInstallPrompt.ts');
 const header=read('src/ui/echo/LegacyHeader.tsx');
 const button=read('src/ui/echo/InstallAppButton.tsx');
 assert.match(hook,/const \[installedInThisTab,setInstalledInThisTab\]=useState\(false\)/);
 // The original module-level appinstalled updates the status even if menu was closed.
 assert.match(hook,/const markInstalled=\(\)=>\{\s*setEarlyInstallPrompt\(null\);\s*setInstalledInThisTab\(true\);/s);
 // The original capturePrompt resets installed=false after an uninstall offers a new prompt.
 assert.match(hook,/const capture=\(event:Event\)=>\{[\s\S]*?setInstalledInThisTab\(false\);[\s\S]*?setEarlyInstallPrompt\(event as InstallPromptEvent\);/);
 assert.match(header,/installedInThisTab=\{installedInThisTab\}/);
 assert.match(button,/const isInstalled=installed\|\|installedInThisTab/);
 assert.match(button,/if\(Platform\.OS!=='web'\|\|isInstalled\)return null/);
 assert.match(button,/setPrompt\(event as InstallPromptEvent\);\s*setInstalled\(false\)/);
 assert.match(button,/useEffect\(\(\)=>\{if\(earlyPrompt\)setInstalled\(false\);\},\[earlyPrompt\]\)/);
 assert.doesNotMatch(header,/document\.addEventListener|window\.addEventListener/);
 assert.doesNotMatch(hook,/localStorage|sessionStorage|serviceWorker|fetch\(|R2\.get\(/);
});

test('legacy installation action is near the top of the guest menu, before theme and shortcut editor',()=>{
 const header=read('src/ui/echo/LegacyHeader.tsx');
 const action='<InstallAppButton earlyPrompt={earlyInstallPrompt} onPromptConsumed={consumeEarlyPrompt} installedInThisTab={installedInThisTab}/>';
 const position=header.indexOf(action);
 assert.ok(position>0);
 assert.equal(header.indexOf(action,position+action.length),-1,'only one install entry');
 assert.ok(position>header.indexOf('⌂ 回首頁'),'original Navbar places install after the profile header shortcuts');
 assert.ok(position<header.indexOf('accessibilityState={{expanded:showColors}}'),'install precedes theme palette and pin editor');
 assert.ok(position<header.indexOf('quickEditorOrder.map'),'install should not hide under a long pinned-action editor');
 const installer=read('src/ui/echo/InstallAppButton.tsx');
 assert.match(installer,/Platform\.OS!=='web'\|\|isInstalled/,'already installed PWA stays hidden');
});
test('iOS install guide retains original four Safari steps and messenger escape path',()=>{
 const guide=manualInstallHelp.ios;
 assert.match(guide,/iPhone／iPad/);
 assert.match(guide,/通訊軟體/);
 assert.match(guide,/以 Safari 開啟/);
 assert.match(guide,/分享/);
 assert.match(guide,/向下捲動/);
 assert.match(guide,/加入主畫面/);
 assert.match(guide,/確認名稱/);
 assert.match(guide,/1\.[\s\S]*2\.[\s\S]*3\.[\s\S]*4\./);
 const installer=read('src/ui/echo/InstallAppButton.tsx');
 assert.match(installer,/manualInstallHelp\[device\]/);
 assert.doesNotMatch(installer,/serviceWorker|navigator\.serviceWorker|R2\.get\(/);
});
