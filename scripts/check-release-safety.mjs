import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const release=readFileSync(new URL('../.github/workflows/deploy-worker.yml',import.meta.url),'utf8');
const probe=readFileSync(new URL('../.github/workflows/probe-r2.yml',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('../starry.app.json',import.meta.url),'utf8'));
function triggers(yaml){
 const start=yaml.indexOf('\non:\n');
 const offset=start>=0?start+1:yaml.indexOf('on:\n');
 assert.ok(offset>=0,'Workflow trigger definition missing');
 const remaining=yaml.slice(offset);
 const end=remaining.search(/\n(?:permissions|concurrency|jobs):/);
 assert.ok(end>0,'Workflow trigger boundary not found');
 return remaining.slice(0,end);
}
for(const [name,yaml] of [['production',release],['private-r2-probe',probe]]){
 const block=triggers(yaml);
 const configuredEvents=[...block.matchAll(/^  ([A-Za-z_][A-Za-z0-9_-]*):/gm)].map(m=>m[1]);
 assert.deepEqual(configuredEvents,['workflow_dispatch'],name+' must expose exactly one manual trigger');
 assert.match(block,/^on:\s*\n\s{2}workflow_dispatch:/);
 assert.doesNotMatch(block,/^\s{2}(?:push|pull_request|schedule|workflow_run):/m,name+' must be manual-only');
}
for(const marker of [
 "github.event_name == 'workflow_dispatch'",
 'refs/heads/main',
 'DEPLOY-ECHO-STARRY-PRODUCTION',
 'approved_commit',
 'git rev-parse HEAD',
 'productionAuthorized!==true',
 'environment: production',
 'CLOUDFLARE_API_TOKEN',
 'wrangler@4 deploy'
])assert.ok(release.includes(marker),'Missing production guard: '+marker);
assert.equal(manifest.brandId,'starry');
assert.equal(manifest.appId,'echo-starry');
assert.equal(manifest.monetization.adsEnabled,false);
assert.equal(manifest.monetization.adsSdkInitialized,false);
assert.deepEqual(manifest.monetization.adsAppIds,[]);
assert.deepEqual(manifest.monetization.adsUnitIds,[]);
assert.ok(release.includes('git ls-remote --exit-code origin refs/heads/main'),'Missing live main SHA guard');
// The second remote HEAD guard must be after validation/build and immediately before upload.
const dryRun=release.indexOf('run: npx --yes wrangler@4 deploy --dry-run');
const lateGuard=release.indexOf('name: Revalidate current main against the approved SHA before upload');
const upload=release.indexOf('name: Deploy Worker and complete Expo Web assets together');
assert.ok(dryRun>=0 && lateGuard>dryRun && upload>lateGuard,'A fresh main SHA check is required after the dry-run and before upload');
const finalGate=release.slice(lateGuard,upload);
assert.match(finalGate,/git ls-remote --exit-code origin refs\/heads\/main/);
assert.match(finalGate,/remote_main.*RELEASE_COMMIT_SHA/);
assert.match(finalGate,/actual.*GITHUB_SHA/);
assert.equal(manifest.monetization.adRequestsEnabled,false);
console.log('Manual-only production/R2 triggers and release safety guards validated.');
