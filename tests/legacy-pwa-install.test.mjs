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
 assert.match(button,/if\(Platform\.OS!=='web'\|\|installed\)return null;/,'already installed standalone must not offer installation');
 assert.match(button,/不會開放尚未授權的音檔/);
 assert.doesNotMatch(button,/serviceWorker\.register|cache\.addAll|navigator\.serviceWorker/);
 assert.match(header,/import \{InstallAppButton\} from '\.\/InstallAppButton'/);
 assert.match(header,/<InstallAppButton\/>/);
});
