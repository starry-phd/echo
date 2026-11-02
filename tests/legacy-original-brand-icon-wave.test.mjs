import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {LEGACY_BRAND_WAVE_BAR_COUNT,LEGACY_BRAND_WAVE_DURATION_MS,
 LEGACY_BRAND_WAVE_STAGGER_MS,LEGACY_BRAND_WAVE_STEPS,
 legacyBrandWaveFrames,legacyBrandWaveInputRange}
 from '../src/ui/echo/legacyBrandWaveMotion.ts';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const approx=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`not equal: ${a} vs ${b}`);

test('latest original v124 CSS overrides obsolete ping and animates four staggered 1.15s mini bars',()=>{
 assert.equal(LEGACY_BRAND_WAVE_BAR_COUNT,4);
 assert.equal(LEGACY_BRAND_WAVE_DURATION_MS,1150);
 assert.equal(LEGACY_BRAND_WAVE_STAGGER_MS,140);
 assert.equal(LEGACY_BRAND_WAVE_STEPS,16);
 assert.deepEqual(legacyBrandWaveInputRange,[...Array(17)].map((_,i)=>i/16));
});

test('all wave frames are bounded and seamless at the looping seam',()=>{
 for(let i=0;i<LEGACY_BRAND_WAVE_BAR_COUNT;i++){
  const {scale,opacity}=legacyBrandWaveFrames(i);
  assert.equal(scale.length,17);
  assert.equal(opacity.length,17);
  approx(scale[0],scale[16]);
  approx(opacity[0],opacity[16]);
  assert.ok(scale.every(v=>Number.isFinite(v)&&v>=4/14-1e-8&&v<=1+1e-8));
  assert.ok(opacity.every(v=>Number.isFinite(v)&&v>=.52-1e-8&&v<=1+1e-8));
 }
});

test('four waves peak at increasing offsets and invalid indices are rejected',()=>{
 const peaks=Array.from({length:4},(_,i)=>{
  const frames=legacyBrandWaveFrames(i).scale;
  const maximum=Math.max(...frames);
  return frames.indexOf(maximum);
 });
 assert.deepEqual(peaks,[8,10,12,14]);
 for(const invalid of [-1,4,1.2,NaN,Infinity]){
  assert.throws(()=>legacyBrandWaveFrames(invalid),/Invalid brand wave index/);
 }
});

test('restore exact original icon from already committed shared PWA asset without alteration',()=>{
 const logo=readFileSync(new URL('../public/icon-192.png',import.meta.url));
 const gitBlobSha=createHash('sha1').update(`blob ${logo.length}\0`).update(logo).digest('hex');
 assert.equal(logo.length,8915);
 assert.equal(gitBlobSha,'f3a703a8c0850062a396fd7025a09a6e8055a946');
 const header=read('src/ui/echo/LegacyHeader.tsx');
 assert.match(header,/import legacyAppIcon from '\.\.\/\.\.\/\.\.\/public\/icon-192\.png';/);
 assert.match(header,/source=\{legacyAppIcon\}/);
 assert.match(read('src/types/static-image-assets.d.ts'),/declare module '\*\.png'/);
 assert.match(header,/style=\{styles\.brandImage\} resizeMode="cover"/);
 assert.doesNotMatch(header,/<Text style=\{styles\.mic\}>🎙<\/Text>/);
});

test('logo remains first DOM child and brand title second for current precise tutorial spotlight',()=>{
 const header=read('src/ui/echo/LegacyHeader.tsx');
 const brand=header.slice(header.indexOf('<Pressable nativeID="echo-tutorial-home-logo"'),
  header.indexOf('!chosenQuickActions.includes'));
 assert.ok(brand.indexOf('<View style={[styles.brandIcon')<
  brand.indexOf('>繁星回聲</Text>'));
 assert.ok(brand.indexOf('>繁星回聲</Text>')<
  brand.indexOf('<LegacyBrandWave color={activeColor}/>'));
 assert.match(header,/nativeID="echo-tutorial-home-logo"/);
 assert.match(header,/onPress=\{\(\)=>go\('\/'\)\}/);
 const tutorial=read('src/ui/echo/LegacyGuestTutorial.tsx');
 assert.match(tutorial,/echo-tutorial-home-logo/);
});

test('equalizer honors reduced motion, holds still before accessibility query and cleans up on unmount',()=>{
 const wave=read('src/ui/echo/LegacyBrandWave.tsx');
 assert.match(wave,/useState\(false\)/);
 assert.match(wave,/AccessibilityInfo\.isReduceMotionEnabled\(\)/);
 assert.match(wave,/reduceMotionChanged/);
 assert.match(wave,/subscription\?\.remove\(\)/);
 assert.match(wave,/if\(!allowMotion\)/);
 assert.match(wave,/staticBar:\{width:3,height:4/);
 assert.match(wave,/Animated\.loop\(Animated\.timing\(progress/);
 assert.match(wave,/loop\.stop\(\)/);
 assert.match(wave,/useNativeDriver:Platform\.OS!=='web'/);
 assert.match(wave,/no-hide-descendants/);
 assert.doesNotMatch(wave,/window\.|document\.|setInterval\(|fetch\(|\/api\/|audio\.play\(/);
});
