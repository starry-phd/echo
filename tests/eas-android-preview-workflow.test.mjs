import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const wf=read('.github/workflows/eas-android-preview.yml');

test('Android preview build is manual-only, main-only, read-only and needs an exact typed confirmation',()=>{
 const on=wf.slice(wf.indexOf('\non:\n'),wf.indexOf('\npermissions:'));
 assert.deepEqual([...on.matchAll(/^  ([a-z_]+):/gm)].map(m=>m[1]),['workflow_dispatch']);
 assert.match(wf,/permissions:\n  contents: read\n/);
 assert.match(wf,/if: github\.ref == 'refs\/heads\/main'/);
 assert.match(wf,/\[ "\$CONFIRMATION" != "BUILD-ANDROID-INTERNAL-PREVIEW" \]/);
 assert.match(wf,/\[ -z "\$EXPO_TOKEN" \]/);
 assert.match(wf,/persist-credentials: false/);
 assert.doesNotMatch(wf,/:\s*write\b/);
});

test('it only queues an internal Android APK: no store submit, no OTA update, no iOS, no production profile',()=>{
 assert.match(wf,/eas-cli@latest build --platform android --profile preview --non-interactive --no-wait/);
 assert.doesNotMatch(wf,/eas-cli@[^ ]+ (submit|update)|--auto-submit|--profile production|--platform (ios|all)/);
 assert.deepEqual([...wf.matchAll(/secrets\.([A-Z_]+)/g)].map(m=>m[1]).filter((v,i,a)=>a.indexOf(v)===i),['EXPO_TOKEN']);
 const eas=JSON.parse(read('eas.json'));
 assert.equal(eas.build.preview.distribution,'internal');
 assert.deepEqual(eas.build.preview.android,{buildType:'apk'});
 assert.equal(eas.build.preview.env.EXPO_PUBLIC_ECHO_API_BASE_URL,'https://echo.starry.phd');
 assert.equal(JSON.parse(read('starry.app.json')).lifecycle.storeSubmissionAuthorized,false);
 for(const other of ['ci.yml','deploy-worker.yml','visual-check.yml'])
  assert.doesNotMatch(read('.github/workflows/'+other),/eas-cli|eas build|EXPO_TOKEN/,other);
});
