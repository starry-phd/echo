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
assert.equal(manifest.monetization.adRequestsEnabled,false);
console.log('Manual-only production/R2 triggers and release safety guards validated.');
