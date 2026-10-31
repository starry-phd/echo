import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('PR/main CI validates both native platform bundles before web production checks',()=>{
 const ci=readFileSync(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8');
 const ios=ci.indexOf('npx expo export --platform ios --output-dir /tmp/echo-native-ios');
 const android=ci.indexOf('npx expo export --platform android --output-dir /tmp/echo-native-android');
 const web=ci.indexOf('run: npm run build:web');
 assert.ok(ios>=0 && android>ios && web>android,'Both unsigned native exports precede Web build');
 assert.match(ci,/Verify iOS Hermes bundle export \(no signing\)/);
 assert.match(ci,/Verify Android Hermes bundle export \(no signing\)/);
 assert.match(ci,/find \/tmp\/echo-native-ios -type f -print -quit/);
 assert.match(ci,/find \/tmp\/echo-native-android -type f -print -quit/);
 assert.match(ci,/name: echo-starry-web-dist/);
 assert.match(ci,/path: dist\//);
 assert.doesNotMatch(ci,/eas (?:build|submit|update)|fastlane|xcodebuild|gradlew.*assembleRelease/);
});

test('production deploy still deploys the web-only worker with private media and native submission locked',()=>{
 const deploy=readFileSync(new URL('../.github/workflows/deploy-worker.yml',import.meta.url),'utf8');
 const manifest=JSON.parse(readFileSync(new URL('../starry.app.json',import.meta.url),'utf8'));
 assert.equal(manifest.lifecycle.storeSubmissionAuthorized,false);
 assert.equal(manifest.identity.apiContract,'pending');
 assert.equal(manifest.monetization.adsEnabled,false);
 assert.equal(manifest.monetization.billingSdkInitialized,false);
 assert.match(deploy,/workflow_run:/);
 assert.match(deploy,/node scripts\/check-production-guest\.mjs/);
 assert.doesNotMatch(deploy,/expo export --platform (?:ios|android)|eas (?:build|submit)/);
});
