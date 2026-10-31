import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const eas=JSON.parse(read('eas.json'));
const manifest=JSON.parse(read('starry.app.json'));

test('internal iOS and Android native profiles embed approved new public Worker URL only',()=>{
 for(const profile of ['development','preview']){
  assert.equal(eas.build[profile].distribution,'internal');
  assert.equal(eas.build[profile].env.EXPO_PUBLIC_ECHO_API_BASE_URL,'https://echo-starry.starry-phd.workers.dev');
  assert.notEqual(eas.build[profile].env.EXPO_PUBLIC_ECHO_API_BASE_URL,'https://echo.starry.phd');
 }
 assert.equal(eas.build.production.env?.EXPO_PUBLIC_ECHO_API_BASE_URL,undefined);
 assert.equal(eas.build.production.channel,'production');
 assert.equal(manifest.lifecycle.storeSubmissionAuthorized,false);
 assert.equal(manifest.monetization.adsEnabled,false);
 assert.equal(manifest.monetization.billingSdkInitialized,false);
});

test('native client uses public build-time Expo variable and does not fall back to legacy production domain',()=>{
 const client=read('src/api/client.ts');
 assert.match(client,/process\.env\.EXPO_PUBLIC_ECHO_API_BASE_URL/);
 assert.match(client,/url\.protocol!=='https:'&&url\.hostname!=='localhost'/);
 assert.doesNotMatch(client,/echo\.starry\.phd|temp-starry-echo-bridge/);
 const ci=read('.github/workflows/ci.yml');
 assert.equal((ci.match(/EXPO_PUBLIC_ECHO_API_BASE_URL: https:\/\/echo-starry\.starry-phd\.workers\.dev/g)||[]).length,2);
});
