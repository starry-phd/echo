import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('native launch screen uses the brand icon on the app own light/dark backgrounds',()=>{
 const app=JSON.parse(read('app.json')).expo;
 const [name,config]=app.plugins.find(p=>Array.isArray(p)&&p[0]==='expo-splash-screen');
 assert.equal(name,'expo-splash-screen');
 assert.equal(config.image,'./assets/images/splash-icon.png');
 assert.equal(config.backgroundColor,'#fdf8f9');
 assert.equal(config.dark.backgroundColor,'#0d0f17');
 assert.equal(config.resizeMode,'contain');
 const theme=read('src/ui/echo/legacyTheme.tsx');
 assert.match(theme,/bg:dark\?'#0d0f17':'#fdf8f9'/);
 assert.equal(JSON.parse(read('public/manifest.webmanifest')).background_color,'#fdf8f9');
 assert.match(JSON.parse(read('package.json')).dependencies['expo-splash-screen'],/^~58\./);
});

test('splash image is the 1024 brand icon with transparent rounded corners',()=>{
 const b=readFileSync(new URL('../assets/images/splash-icon.png',import.meta.url));
 assert.equal(b.toString('latin1',1,4),'PNG');
 assert.deepEqual([b.readUInt32BE(16),b.readUInt32BE(20),b[25]],[1024,1024,6]);
});

test('Expo Router hides the splash itself; the app never blocks on a hidden splash',()=>{
 for(const file of ['app/_layout.tsx','app/index.tsx'])
  assert.doesNotMatch(read(file),/preventAutoHideAsync/);
});
