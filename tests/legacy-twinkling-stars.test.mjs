import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {LEGACY_TWINKLE_COLORS,LEGACY_TWINKLE_COUNTS,LEGACY_TWINKLE_CROSS_OPACITY,
 LEGACY_TWINKLE_PLACEMENTS,LEGACY_TWINKLE_SPEEDS,LEGACY_TWINKLE_STAR_WAIST,LEGACY_TWINKLE_STEPS,
 legacyCssEaseInOut,legacyTwinkleFieldOpacity,legacyTwinkleFrames,legacyTwinkleInputRange,
 legacyTwinkleKeyframe,legacyTwinkleSpeed,legacyTwinklingStars}
 from '../src/ui/echo/legacyTwinklingStars.ts';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const approx=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<e,`not equal: ${a} vs ${b}`);
const fingerprint=stars=>createHash('sha256').update(stars.map(s=>
 [s.id,s.top,s.left,s.size,s.type,s.color,s.speed,s.delaySeconds+'s',s.opacity].join('|')).join('\n')).digest('hex');

test('original TwinklingStars.tsx constants: 18/28/42 stars, seven colours, three CSS speeds',()=>{
 assert.deepEqual(LEGACY_TWINKLE_COUNTS,{subtle:18,normal:28,dense:42});
 assert.deepEqual([...LEGACY_TWINKLE_COLORS],['#f59e0b','#fbbf24','#f43f5e','#ec4899','#38bdf8','#ffffff','#c084fc']);
 // yukidu/Echo-Starry src/index.css 241-293
 assert.deepEqual(LEGACY_TWINKLE_SPEEDS.map(s=>[s.id,s.durationMs,s.edge.opacity,s.edge.scale,s.middle.opacity,s.middle.scale]),[
  ['slow',4000,.15,.75,1,1.25],['medium',2800,.85,1.15,.2,.7],['fast',1800,.25,.85,.95,1.3]]);
 // Navbar.tsx:549 subtle .75/.90, DetailView.tsx:700 normal .80/.95, :998 subtle .40/.60
 assert.deepEqual(LEGACY_TWINKLE_PLACEMENTS,{
  header:{density:'subtle',light:.75,dark:.9},
  detailHero:{density:'normal',light:.8,dark:.95},
  detailNotes:{density:'subtle',light:.4,dark:.6}});
 assert.equal(legacyTwinkleFieldOpacity('header',false),.75);
 assert.equal(legacyTwinkleFieldOpacity('detailNotes',true),.6);
 assert.throws(()=>legacyTwinkleFieldOpacity('player',false),/Invalid twinkle placement/);
});

test('star fields are byte-for-byte the original deterministic sequence (fingerprints from legacy source run)',()=>{
 // Computed by executing the loop in yukidu/Echo-Starry@82cbf4f src/components/TwinklingStars.tsx.
 assert.equal(fingerprint(legacyTwinklingStars('subtle')),'dedb43a39dff9b9168d7f07ef23b08973db8b23246602050654f2941d52625e0');
 assert.equal(fingerprint(legacyTwinklingStars('normal')),'f8964382789cb5fb686d707eb1067f284ebbd7047fdaa2365d17801f19e697be');
 assert.equal(fingerprint(legacyTwinklingStars('dense')),'a9b5c8ac4bf638d0d84ef67d4d567a6890206fd6e6567b1cf98b935acec52224');
 assert.deepEqual(legacyTwinklingStars(),legacyTwinklingStars('normal'));
 assert.deepEqual(legacyTwinklingStars('normal')[1],{id:1,top:27,left:54,size:10,type:'sparkle',
  color:'#fbbf24',speed:'medium',delaySeconds:.35,opacity:0.8772505144032922});
 assert.throws(()=>legacyTwinklingStars('galaxy'),/Invalid twinkle density/);
});

test('every star stays within the original bounds for position, size, opacity and delay',()=>{
 for(const density of ['subtle','normal','dense']){
  for(const s of legacyTwinklingStars(density)){
   assert.ok(s.top>=3&&s.top<=97&&s.left>=2&&s.left<=98);
   const [min,max]={sparkle:[8,14],cross:[5,9],dot:[2,4]}[s.type];
   assert.ok(Number.isInteger(s.size)&&s.size>=min&&s.size<=max,`${s.type} size ${s.size}`);
   assert.ok(s.opacity>=.35&&s.opacity<=.9);
   assert.ok(s.delaySeconds>=0&&s.delaySeconds<3.5);
  }
 }
});

test('CSS ease-in-out keyframes: symmetric easing, exact 0/50/100% values, seamless loop',()=>{
 assert.equal(legacyCssEaseInOut(0),0);
 assert.equal(legacyCssEaseInOut(1),1);
 approx(legacyCssEaseInOut(.5),.5);
 approx(legacyCssEaseInOut(.25),0.129161931,1e-8);
 for(const x of [.1,.2,.3,.4]) approx(legacyCssEaseInOut(x)+legacyCssEaseInOut(1-x),1,1e-9);
 assert.throws(()=>legacyCssEaseInOut(NaN),/Invalid easing input/);
 for(const speed of LEGACY_TWINKLE_SPEEDS){
  approx(legacyTwinkleKeyframe(speed,0).opacity,speed.edge.opacity);
  approx(legacyTwinkleKeyframe(speed,.5).opacity,speed.middle.opacity);
  approx(legacyTwinkleKeyframe(speed,.5).scale,speed.middle.scale);
  approx(legacyTwinkleKeyframe(speed,1).scale,speed.edge.scale);
 }
 assert.throws(()=>legacyTwinkleKeyframe(LEGACY_TWINKLE_SPEEDS[0],Infinity),/Invalid twinkle progress/);
 assert.throws(()=>legacyTwinkleSpeed('warp'),/Invalid twinkle speed/);
});

test('per-star frames are bounded, seamless and phase-shifted by the original animation-delay',()=>{
 assert.equal(LEGACY_TWINKLE_STEPS,32);
 assert.deepEqual(legacyTwinkleInputRange,[...Array(33)].map((_,i)=>i/32));
 for(const star of legacyTwinklingStars('dense')){
  const speed=legacyTwinkleSpeed(star.speed);
  const {opacity,scale}=legacyTwinkleFrames(star);
  assert.equal(opacity.length,33);
  approx(opacity[0],opacity[32]);
  approx(scale[0],scale[32]);
  const lo=Math.min(speed.edge.opacity,speed.middle.opacity),hi=Math.max(speed.edge.opacity,speed.middle.opacity);
  assert.ok(opacity.every(v=>v>=lo-1e-9&&v<=hi+1e-9));
  const slo=Math.min(speed.edge.scale,speed.middle.scale),shi=Math.max(speed.edge.scale,speed.middle.scale);
  assert.ok(scale.every(v=>v>=slo-1e-9&&v<=shi+1e-9));
 }
 const first=legacyTwinkleFrames({speed:'slow',delaySeconds:0});
 approx(first.opacity[0],.15);
 approx(first.opacity[16],1);
 // 1s delay on the 4s slow loop = quarter-cycle lag: the 50% peak moves from step 16 to 24.
 const lagged=legacyTwinkleFrames({speed:'slow',delaySeconds:1});
 approx(lagged.opacity[24],1);
 approx(lagged.opacity[8],.15);
 assert.throws(()=>legacyTwinkleFrames({speed:'slow',delaySeconds:-1}),/Invalid twinkle delay/);
});

test('two crossing rhombi reproduce the original SVG four-point stars',()=>{
 // sparkle path M12 0 L14 9 L23 12 ... (24 box, radius 12, inner vertex offset 2)
 // cross polygon 8,0 10,6 16,8 ... (16 box, radius 8, inner vertex offset 2)
 const waist=(radius,inner)=>inner/(radius-inner);
 approx(LEGACY_TWINKLE_STAR_WAIST.sparkle,waist(12,2));
 approx(LEGACY_TWINKLE_STAR_WAIST.cross,waist(8,2));
 assert.equal(LEGACY_TWINKLE_CROSS_OPACITY,.9);
 const component=read('src/ui/echo/LegacyTwinklingStars.tsx');
 assert.match(component,/transform:\[\{scaleX:waist\}\]/);
 assert.match(component,/transform:\[\{scaleY:waist\}\]/);
 assert.match(component,/rotate:'45deg'/);
 assert.match(component,/boxShadow:`0 0 \$\{star\.size\*2\}px \$\{star\.color\}`/);
 assert.match(component,/sparkleGlow:\{boxShadow:'0 0 3px rgba\(255,255,255,0\.7\)'\}/);
});

test('decorative layer honours reduced motion, stays out of a11y and touch, and has no data or audio access',()=>{
 const c=read('src/ui/echo/LegacyTwinklingStars.tsx');
 assert.match(c,/useState\(false\)/);
 assert.match(c,/AccessibilityInfo\.isReduceMotionEnabled\(\)/);
 assert.match(c,/reduceMotionChanged/);
 assert.match(c,/subscription\?\.remove\(\)/);
 assert.match(c,/if\(!allowMotion\)\{reset\(\);return;\}/);
 assert.match(c,/loops\.forEach\(loop=>loop\.stop\(\)\)/);
 assert.match(c,/useNativeDriver:Platform\.OS!=='web'/);
 assert.match(c,/marginLeft:-star\.size\/2,marginTop:-star\.size\/2,opacity:star\.opacity/);
 assert.match(c,/importantForAccessibility="no-hide-descendants"/);
 assert.match(c,/accessibilityElementsHidden/);
 assert.match(c,/overflow:'hidden',pointerEvents:'none'/);
 for(const source of [c,read('src/ui/echo/legacyTwinklingStars.ts')]){
  assert.doesNotMatch(source,/fetch\(|AsyncStorage|\/api\/|window\.|document\.|setInterval\(|Math\.random|expo-audio|useAudioPlayer|getPublicStreamUrl|\bR2\b|\bD1\b/);
 }
});

test('mounted at the three original places only, behind content, without disturbing the tutorial brand',()=>{
 const header=read('src/ui/echo/LegacyHeader.tsx');
 const outer=header.indexOf('return <View style={[styles.outer');
 assert.ok(outer>0);
 assert.ok(header.indexOf('<LegacyTwinklingStars placement="header"/>',outer)>outer);
 assert.ok(header.indexOf('<LegacyTwinklingStars placement="header"/>')<header.indexOf('<View style={styles.main}>'));
 const brandStart=header.indexOf('<Pressable nativeID="echo-tutorial-home-logo"');
 const brand=header.slice(brandStart,header.indexOf('</Pressable>',brandStart));
 assert.equal(brand.includes('LegacyTwinklingStars'),false);
 for(const path of ['app/preview/[id].tsx','app/track/[id].tsx']){
  const page=read(path);
  const hero=page.indexOf('<View style={styles.hero}>');
  const stars=page.indexOf('<LegacyTwinklingStars placement="detailHero"/>');
  const portrait=page.indexOf('<LegacyDetailSpeakerPortrait',hero);
  assert.ok(hero>0&&stars>hero&&stars<portrait,path);
 }
 const notes=read('src/ui/echo/LegacyLectureNotes.tsx');
 assert.ok(notes.indexOf('<LegacyTwinklingStars placement="detailNotes"/>')<notes.indexOf('演講資訊與備註</Text>'));
 assert.match(notes,/card:\{borderRadius:17,borderWidth:1,padding:15,gap:10,overflow:'hidden'\}/);
 assert.equal(read('app/index.tsx').includes('LegacyTwinklingStars'),false);
});
