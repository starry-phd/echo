import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {extractVisualScreenshots} from '../scripts/extract-visual-screenshots.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const workflow=read('.github/workflows/visual-check.yml');
const script=read('scripts/visual-check-production.mjs');

test('visual check runs only after a successful main Production deploy, read-only, without secrets',()=>{
 assert.match(workflow,/on:\n  workflow_run:\n    workflows: \[Deploy Echo public Web shell to Cloudflare Workers\]\n    types: \[completed\]\npermissions:/);
 assert.match(workflow,/permissions:\n  contents: read\n/);
 assert.match(workflow,/github\.event\.workflow_run\.conclusion == 'success'/);
 assert.match(workflow,/github\.event\.workflow_run\.head_branch == 'main'/);
 assert.match(workflow,/github\.event\.workflow_run\.head_repository\.full_name == github\.repository/);
 assert.match(workflow,/persist-credentials: false/);
 assert.doesNotMatch(workflow,/secrets\.|environment:|wrangler|eas (build|submit|update)|:\s*write\b/i);
 assert.doesNotMatch(workflow,/EXPO_TOKEN|CLOUDFLARE_API_TOKEN|GITHUB_TOKEN/);
 assert.match(workflow,/playwright@\d+\.\d+\.\d+/,'Playwright version must be pinned');
 const deploy=read('.github/workflows/deploy-worker.yml');
 assert.match(deploy,/^name: Deploy Echo public Web shell to Cloudflare Workers$/m);
});

test('screenshot script: pinned production origin, GET page loads only, no stored member data',()=>{
 assert.match(script,/const PRODUCTION='https:\/\/echo-starry\.starry-phd\.workers\.dev';/);
 assert.match(script,/throw Error\('Unexpected visual-check origin'\)/);
 assert.doesNotMatch(script,/method:\s*['"](POST|PUT|PATCH|DELETE)/i);
 assert.doesNotMatch(script,/\/stream|STARRY_ID|refresh|token/i);
 for(const key of ['echostars_guest_safe_tutorial_never_remind_v1','sq_light_palette_v1','echo-ui-dark'])assert.ok(script.includes(key),key);
 assert.match(read('src/ui/echo/legacyGuestTutorialPolicy.ts'),/GUEST_TUTORIAL_KEY='echostars_guest_safe_tutorial_never_remind_v1'/);
 assert.match(read('src/ui/echo/themePreferenceStore.ts'),/THEME_PALETTE_KEY='sq_light_palette_v1'/);
 assert.match(read('src/ui/echo/LegacyHeader.tsx'),/nativeID="echo-tutorial-visitor-menu"/);
 assert.match(script,/if\(shotFailures>0\|\|uncaught>0\|\|thirdParty\.length>0\)process\.exitCode=1;/);
});

test('log extractor rebuilds chunked JPEGs exactly, ignoring timestamps and noise',()=>{
 const jpeg=Buffer.concat([Buffer.from([0xff,0xd8,0xff,0xe0]),Buffer.alloc(9000,7)]);
 const b64=jpeg.toString('base64');
 const parts=[b64.slice(0,6000),b64.slice(6000)];
 const log=['2026-11-03T08:30:00.1Z noise line',
  ...parts.map((p,i)=>'2026-11-03T08:30:00.'+i+'Z VISUALSHOT|02-home|'+(i+1)+'|2|'+p).reverse(),
  'VISUALSHOT|bad name|1|1|xx'].join('\n');
 const shots=extractVisualScreenshots(log);
 assert.deepEqual([...shots.keys()],['02-home']);
 assert.ok(shots.get('02-home').equals(jpeg));
 assert.throws(()=>extractVisualScreenshots('VISUALSHOT|a|1|2|'+parts[0]),/1 of 2/);
 assert.throws(()=>extractVisualScreenshots('VISUALSHOT|a|1|1|'+Buffer.from('not jpeg').toString('base64')),/not a JPEG/);
});
