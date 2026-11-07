import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('isolated staging checks the public Echo Android, iOS and Web Passkey associations without identity writes',()=>{
 const workflow=read('.github/workflows/echo-staging-preview.yml');
 assert.match(workflow,/Verify Starry ID published Echo Passkey links \(GET only, no login or keys\)/);
 assert.match(workflow,/\/\.well-known|base='https:\/\/id\.starry\.phd\/\.well-known'/);
 assert.match(workflow,/assetlinks\.json/);
 assert.match(workflow,/apple-app-site-association/);
 assert.match(workflow,/\/webauthn/);
 assert.match(workflow,/delegate_permission\/common\.get_login_creds/);
 assert.match(workflow,/phd\.starry\.echo/);
 assert.match(workflow,/4W7QRTXN5Y\.phd\.starry\.echo/);
 assert.match(workflow,/04:10:CC:35:A5:79:A9:CF:EF:4E:33:1C:F1:06:AE:70:64:00:6B:11:01:4A:FA:FB:B4:FB:51:36:A6:AD:AC:6C/);
 assert.match(workflow,/Echo signed Android APK, iOS association and two WebAuthn origins/);
 const cfg=JSON.parse(read('app.json'));
 assert.equal(cfg.expo.android.package,'phd.starry.echo');
 assert.equal(cfg.expo.scheme,'echostarry');
 assert.ok(cfg.expo.ios.associatedDomains.includes('webcredentials:id.starry.phd'));
 const documentation=read('docs/20261107-v5-passkey-owner-checklist.md');
 assert.match(documentation,/Android SHA-256 指紋：已由業主登記並唯讀查證成功/);
 assert.match(documentation,/2026-11-03/);
 assert.match(documentation,/只允許 \`main\` 手動觸發/);
});
