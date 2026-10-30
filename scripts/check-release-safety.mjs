import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const release=readFileSync(new URL('../.github/workflows/deploy-worker.yml',import.meta.url),'utf8');
const probe=readFileSync(new URL('../.github/workflows/probe-r2.yml',import.meta.url),'utf8');
const audit=readFileSync(new URL('../.github/workflows/audit-private-audio.yml',import.meta.url),'utf8');
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
// Public Web shell can auto-release ONLY after a trusted successful main-push
// CI workflow. Private media audit and R2 sampling must remain manual-only.
const releaseEvents=[...triggers(release).matchAll(/^  ([A-Za-z_][A-Za-z0-9_-]*):/gm)].map(m=>m[1]);
assert.deepEqual(releaseEvents,['workflow_run','workflow_dispatch'],'Public release must permit only CI-completed and explicit manual dispatch');
assert.match(triggers(release),/workflows: \[Echo App checks\]/);
assert.match(triggers(release),/types: \[completed\]/);
for(const [name,yaml] of [['private-r2-probe',probe],['private-audio-audit',audit]]){
 const block=triggers(yaml);
 const configuredEvents=[...block.matchAll(/^  ([A-Za-z_][A-Za-z0-9_-]*):/gm)].map(m=>m[1]);
 assert.deepEqual(configuredEvents,['workflow_dispatch'],name+' must remain manual-only');
 assert.doesNotMatch(block,/^\s{2}(?:push|pull_request|schedule|workflow_run|workflow_call):/m,name+' cannot auto-trigger');
}
for(const marker of [
 "github.event_name == 'workflow_dispatch'",
 "github.event_name == 'workflow_run'",
 "github.event.workflow_run.conclusion == 'success'",
 "github.event.workflow_run.event == 'push'",
 "github.event.workflow_run.head_branch == 'main'",
 "github.event.workflow_run.head_repository.full_name == github.repository",
 "ref: ${{ env.RELEASE_COMMIT_SHA }}",
 'RELEASE_CI_EVENT',
 'RELEASE_CI_CONCLUSION',
 'RELEASE_CI_BRANCH',
 'RELEASE_CI_REPOSITORY',
 'GITHUB_REPOSITORY',
 'refs/heads/main',
 'DEPLOY-ECHO-STARRY-PRODUCTION',
 'approved_commit',
 'git rev-parse HEAD',
 'productionAuthorized!==true',
 'environment: production',
 'CLOUDFLARE_API_TOKEN',
 'wrangler@4 deploy',
 'node scripts/check-production-guest.mjs'
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
const lateGuard=release.indexOf('name: Revalidate current main against the tested or approved SHA before upload');
const upload=release.indexOf('name: Deploy Worker and complete Expo Web assets together');
assert.ok(dryRun>=0 && lateGuard>dryRun && upload>lateGuard,'A fresh main SHA check is required after the dry-run and before upload');
const finalGate=release.slice(lateGuard,upload);
assert.match(finalGate,/git ls-remote --exit-code origin refs\/heads\/main/);
assert.match(finalGate,/remote_main.*RELEASE_COMMIT_SHA/);
assert.match(finalGate,/\$GITHUB_EVENT_NAME.*workflow_dispatch/);
assert.match(finalGate,/actual.*GITHUB_SHA/);
assert.match(release,/\[ \"\$RELEASE_CI_EVENT\" != \"push\" \]/);
assert.match(release,/\[ \"\$RELEASE_CI_CONCLUSION\" != \"success\" \]/);
assert.match(release,/\[ \"\$RELEASE_CI_BRANCH\" != \"main\" \]/);
assert.match(release,/\[ \"\$RELEASE_CI_REPOSITORY\" != \"\$GITHUB_REPOSITORY\" \]/);
assert.equal(manifest.monetization.adRequestsEnabled,false);
for(const marker of ["github.ref == 'refs/heads/main'",'AUDIT-PRIVATE-ECHO-AUDIO-NO-PUBLICATION',
 'git ls-remote --exit-code origin refs/heads/main','environment: migration'])
 assert.ok(audit.includes(marker),'Missing private audit guard: '+marker);
assert.match(audit,/path: \/tmp\/echo-private-audio-audit-summary\.json\s*\n/,'Only the aggregate report may be uploaded');
console.log('Guarded auto-release (green trusted main CI only), manual private/R2, and production safety validated.');
