import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const manifest=JSON.parse(readFileSync(new URL('../starry.app.json',import.meta.url),'utf8'));
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const app=JSON.parse(readFileSync(new URL('../app.json',import.meta.url),'utf8'));
assert.equal(manifest.schemaVersion,1);
assert.equal(manifest.appId,app.expo.slug);
assert.equal(manifest.brandId,'starry');
assert.equal(manifest.ios.bundleId,app.expo.ios.bundleIdentifier);
assert.equal(manifest.android.applicationId,app.expo.android.package);
assert.equal(manifest.urlScheme,app.expo.scheme);
assert.equal(manifest.tech.expoSdk,58);
assert.match(pkg.dependencies.expo,/^~58\./);
assert.equal(pkg.dependencies['react-native'],'0.88.0');
assert.equal(manifest.identity.plannedCentralD1,'id-starry');
assert.equal(manifest.monetization.billingProviderSelection,'revenuecat');
assert.deepEqual(manifest.monetization.allowedProductTypes,[
 'non-consumable','auto-renewable-monthly','auto-renewable-yearly'
]);
assert.equal(manifest.monetization.adsProviderSelection,'google-admob-mediation');
for(const name of ['adsEnabled','adsSdkInitialized','adRequestsEnabled']){
 assert.equal(manifest.monetization[name],false, 'Ads OFF requires '+name+'=false');
}
assert.deepEqual(manifest.monetization.adsAppIds,[]);
assert.deepEqual(manifest.monetization.adsUnitIds,[]);
// Production may be enabled only for the explicitly scoped owner-approved Web shell release.
if(manifest.lifecycle.productionAuthorized===true){
 assert.equal(manifest.lifecycle.stage,'web-shell-release-approved');
 assert.equal(manifest.lifecycle.storeSubmissionAuthorized,false);
 assert.equal(manifest.identity.apiContract,'pending');
 assert.equal(manifest.battery.apiContract,'pending');
 assert.equal(manifest.monetization.billingSdkInitialized,false);
 assert.equal(manifest.monetization.adRequestsEnabled,false);
}else{
 assert.equal(manifest.lifecycle.productionAuthorized,false);
}
const forbidden=['react-native-google-mobile-ads','expo-ads-admob','react-native-purchases','react-native-applovin-max'];
for(const name of forbidden){
 assert.equal(pkg.dependencies[name],undefined, 'SDK '+name+' requires separate approval');
}
console.log('v1.3 guardrails: Expo 58, AdMob chosen/Ads OFF, no real IAP/Ads native SDK, Starry ID isolated.');
