import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PRIVACY_CONTACT_EMAIL,PRIVACY_POLICY_PATH,PRIVACY_POLICY_SECTIONS,PRIVACY_POLICY_UPDATED}
 from '../src/legal/privacyPolicy.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pngSize=path=>{const b=readFileSync(new URL('../'+path,import.meta.url));
 assert.equal(b.toString('latin1',1,4),'PNG');return [b.readUInt32BE(16),b.readUInt32BE(20),b[25]];};

test('privacy policy is served at /privacy and linked from the main menu',()=>{
 assert.equal(PRIVACY_POLICY_PATH,'/privacy');
 assert.match(read('app/privacy.tsx'),/policy\.sections\.map/);
 assert.match(read('app/_layout.tsx'),/<Stack\.Screen name="privacy" \/>/);
 const header=read('src/ui/echo/LegacyHeader.tsx');
 assert.match(header,/accessibilityLabel="隱私權政策" onPress=\{\(\)=>go\('\/privacy'\)\}/);
});

test('policy covers what stores require: contact, date, children, rights, third parties, English',()=>{
 const text=PRIVACY_POLICY_SECTIONS.flatMap(s=>[s.heading,...s.paragraphs]).join('\n');
 assert.match(PRIVACY_POLICY_UPDATED,/^\d{4}-\d{2}-\d{2}$/);
 assert.ok(text.includes(PRIVACY_CONTACT_EMAIL));
 for(const must of ['不需要註冊或登入','只存在你的裝置上','Cloudflare','不放廣告','不使用分析或追蹤工具',
  '13 歲以下','個人資料保護法','English summary'])assert.ok(text.includes(must),must);
});

// The policy's factual claims must stay true. If any of these fail, the app's
// data behaviour changed: update src/legal/privacyPolicy.ts before release.
test('policy claims match the code: no ads/analytics SDK, no foreign hosts, server only reads',()=>{
 const pkg=JSON.parse(read('package.json'));
 const deps=Object.keys({...pkg.dependencies,...pkg.devDependencies}).join(' ');
 assert.doesNotMatch(deps,/analytics|firebase|sentry|amplitude|mixpanel|segment|admob|google-mobile-ads|facebook|tracking|revenuecat|purchases/i);
 const manifest=JSON.parse(read('starry.app.json')).monetization;
 assert.equal(manifest.adsEnabled,false);assert.equal(manifest.billingSdkInitialized,false);
 const worker=read('worker/index.ts');
 assert.doesNotMatch(worker,/\bINSERT\b|\bUPDATE\b|\.put\(|console\.log|cf-connecting-ip/i);
 assert.doesNotMatch(worker,/app\.(post|put|patch|delete)\(/);
 const app=JSON.parse(read('app.json')).expo;
 assert.equal(app.ios.infoPlist.NSLocationWhenInUseUsageDescription,undefined);
 assert.equal(app.android.permissions,undefined);
});

test('store icons: 1024 opaque iOS icon and Android adaptive layers from the original brand icon',()=>{
 const app=JSON.parse(read('app.json')).expo;
 assert.equal(app.icon,'./assets/images/icon.png');
 const [w,h,colorType]=pngSize('assets/images/icon.png');
 assert.deepEqual([w,h],[1024,1024]);
 assert.equal(colorType,2,'App Store icon must be RGB without alpha');
 const adaptive=app.android.adaptiveIcon;
 for(const key of ['foregroundImage','backgroundImage','monochromeImage']){
  const [aw,ah]=pngSize(adaptive[key].replace('./',''));
  assert.deepEqual([aw,ah],[1024,1024],key);
 }
 assert.equal(pngSize('assets/images/adaptive-foreground.png')[2],6,'foreground needs alpha');
 assert.match(adaptive.backgroundColor,/^#[0-9A-F]{6}$/);
});
