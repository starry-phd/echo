/**
 * D-08 (approved) guard: native-first StyleSheet + Design Tokens +
 * versioned Starry-owned UI components. Legacy visuals are preserved at the
 * product layer, NOT by reverting the approved native technology.
 */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=(file)=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const pkg=JSON.parse(read('package.json'));
const ui=JSON.parse(read('packages/ui/package.json'));
const app=JSON.parse(read('app.json'));
const dep={...pkg.dependencies,...pkg.devDependencies};
assert.match(pkg.dependencies.expo,/^~58\./);
assert.equal(pkg.dependencies['react-native'],'0.88.0');
assert.ok(pkg.dependencies['expo-router']);
assert.ok(pkg.dependencies['@tanstack/react-query']);
assert.equal(ui.name,'@starry/ui');
assert.match(ui.version,/^0\.\d+\.\d+$/,'Custom UI library must have an explicit version');
for(const name of ['nativewind','tailwindcss','tamagui','@tamagui/core','@tamagui/animations-css','react-native-css-interop']){
  assert.equal(dep[name],undefined, 'D-08 does not permit unapproved UI framework: '+name);
}
for(const path of [
 'packages/ui/src/tokens.ts',
 'packages/ui/src/LegacyHeader.tsx',
 'packages/ui/src/LegacyFilterToolbar.tsx',
 'packages/ui/src/LegacyTrackCard.tsx',
 'packages/ui/src/legacyTheme.tsx',
 'src/ui/responsive.ts',
 'tests/responsive.test.mjs'
]) assert.ok(existsSync(new URL('../'+path,import.meta.url)), 'Missing D-08 component: '+path);
const uiFiles=['LegacyHeader.tsx','LegacyFilterToolbar.tsx','LegacyTrackCard.tsx'];
for(const file of uiFiles){
 const source=read('packages/ui/src/'+file);
 assert.match(source,/\bStyleSheet\.create\(/,'Custom UI must use RN StyleSheet: '+file);
 assert.doesNotMatch(source,/\bclassName\s*=/,'No Web-only className styling: '+file);
}
const home=read('app/index.tsx');
assert.match(home,/viewportLayout\(width\)/,'Mobile-first breakpoints must be used');
assert.match(home,/LegacyTrackCard/,'Preserve the original product-specific visual components');
assert.equal(app.expo.web?.output,'static','Existing Echo Web remains explicitly selected');
const monetization=JSON.parse(read('starry.app.json')).monetization;
assert.equal(monetization.adsProviderSelection,'google-admob-mediation');
assert.equal(monetization.adsEnabled,false);
assert.equal(monetization.adsSdkInitialized,false);
assert.equal(monetization.adRequestsEnabled,false);
console.log('D-08 UI v1.3 validated: Expo 58, StyleSheet, Tokens, @starry/ui v'+ui.version+', mobile-first layout, Ads OFF.');
