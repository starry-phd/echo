import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const PID='e124ab5b-1a32-4a5b-8553-327f11946909';

test('app is linked to the owner Expo account starryphd and EAS project',()=>{
 const app=JSON.parse(read('app.json')).expo;
 assert.equal(app.owner,'starryphd');
 assert.equal(app.slug,'echo-starry');
 assert.equal(app.extra.eas.projectId,PID);
});

test('OTA updates are served only from this EAS project; runtime pinned to the app version',()=>{
 const app=JSON.parse(read('app.json')).expo;
 assert.equal(app.updates.url,'https://u.expo.dev/'+PID);
 assert.deepEqual(app.runtimeVersion,{policy:'appVersion'});
 assert.match(JSON.parse(read('package.json')).dependencies['expo-updates'],/^~58\./);
 const eas=JSON.parse(read('eas.json'));
 assert.equal(eas.cli.appVersionSource,'remote');
 for(const profile of ['development','preview','production'])assert.ok(eas.build[profile].channel,profile);
});

test('linking the project does not authorize store submission, ads or billing, and CI never builds or submits',()=>{
 const manifest=JSON.parse(read('starry.app.json'));
 assert.equal(manifest.lifecycle.storeSubmissionAuthorized,false);
 assert.equal(manifest.monetization.adsEnabled,false);
 assert.equal(manifest.monetization.billingSdkInitialized,false);
 for(const wf of ['ci.yml','deploy-worker.yml'])
  assert.doesNotMatch(read('.github/workflows/'+wf),/eas (build|submit|update)|EXPO_TOKEN/);
});
