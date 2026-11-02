import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ECHO_ACCOUNT_ID,ECHO_WORKER,LEGACY_HOSTNAME,LEGACY_SERVICE,classifyLegacyDomain,
 latestDeployment,parseUploadedVersionId,validateLiveDeployment} from '../scripts/cloudflare-production-validation.mjs';

const V1='4b874d81-d9ae-4a1f-b979-c4d49c5158bc';
const V2='a1203e31-8f01-4c88-8e12-aca9255c04d9';
const D1='11111111-2222-4333-8444-555555555555';
const D2='66666666-7777-4888-9999-aaaaaaaaaaaa';
const dep=(id,created,versions)=>({id,created_on:created,source:'wrangler',strategy:'percentage',
 author_email:'someone@example.com',versions});
const ok=result=>({success:true,errors:[],result});

test('fixed production identity: Starry account, echo-starry Worker, legacy bridge domain',()=>{
 assert.equal(ECHO_ACCOUNT_ID,'9ff1b4c261141730ac2fe0683f730062');
 assert.equal(ECHO_WORKER,'echo-starry');
 assert.equal(LEGACY_HOSTNAME,'echo.starry.phd');
 assert.equal(LEGACY_SERVICE,'temp-starry-echo-bridge');
});

test('uploaded version is parsed once from the real wrangler 4 output format',()=>{
 const log='Uploaded echo-starry (5.08 sec)\nDeployed echo-starry triggers (0.31 sec)\n  https://echo-starry.starry-phd.workers.dev\nCurrent Version ID: '+V1+'\n';
 assert.equal(parseUploadedVersionId(log),V1);
 assert.throws(()=>parseUploadedVersionId('no upload happened'),/found 0/);
 assert.throws(()=>parseUploadedVersionId(log+log),/found 2/);
});

test('latest + exact deployment must be the uploaded version at 100%',()=>{
 const newest=dep(D2,'2026-11-02T10:19:20Z',[{version_id:V1,percentage:100}]);
 const older=dep(D1,'2026-11-02T09:42:00Z',[{version_id:V2,percentage:100}]);
 const latest=latestDeployment(200,ok({deployments:[older,newest]}));
 assert.equal(latest.id,D2);
 assert.deepEqual(validateLiveDeployment(latest,200,ok(newest),V1),
  {deploymentId:D2,versionId:V1,percentage:100,createdOn:'2026-11-02T10:19:20Z'});
});

test('stale, split, mismatched or failed Cloudflare responses fail closed',()=>{
 const live=dep(D2,'2026-11-02T10:19:20Z',[{version_id:V2,percentage:100}]);
 assert.throws(()=>validateLiveDeployment(live,200,ok(live),V1),/is not the uploaded version/);
 const split=dep(D2,'2026-11-02T10:19:20Z',[{version_id:V1,percentage:50},{version_id:V2,percentage:50}]);
 assert.throws(()=>validateLiveDeployment(split,200,ok(split),V1),/exactly one version/);
 const partial=dep(D2,'2026-11-02T10:19:20Z',[{version_id:V1,percentage:90}]);
 assert.throws(()=>validateLiveDeployment(partial,200,ok(partial),V1),/100% traffic/);
 const good=dep(D2,'2026-11-02T10:19:20Z',[{version_id:V1,percentage:100}]);
 assert.throws(()=>validateLiveDeployment(good,200,ok(dep(D1,good.created_on,good.versions)),V1),/exact deployment id differs/);
 assert.throws(()=>validateLiveDeployment(good,403,{success:false},V1),/exact deployment failed \(HTTP 403\)/);
 assert.throws(()=>latestDeployment(200,ok({deployments:[]})),/empty/);
 assert.throws(()=>latestDeployment(500,{success:false}),/deployment list failed/);
});

test('legacy domain: verified only when still on the bridge; moved to echo-starry or elsewhere fails',()=>{
 const domain=service=>ok([{id:'x',hostname:'echo.starry.phd',service,environment:'production',zone_name:'starry.phd'}]);
 assert.deepEqual(classifyLegacyDomain(200,domain('temp-starry-echo-bridge')),{state:'verified',service:'temp-starry-echo-bridge'});
 assert.throws(()=>classifyLegacyDomain(200,domain('echo-starry')),/without an approved cutover/);
 assert.throws(()=>classifyLegacyDomain(200,domain('something-else')),/unexpected service/);
 assert.throws(()=>classifyLegacyDomain(500,{success:false}),/custom domain lookup failed/);
});

test('missing domain scope or a domain outside this account is reported as UNVERIFIED, never as passed',()=>{
 assert.equal(classifyLegacyDomain(403,{success:false}).state,'unverified');
 assert.equal(classifyLegacyDomain(401,null).state,'unverified');
 const empty=classifyLegacyDomain(200,ok([]));
 assert.equal(empty.state,'unverified');
 assert.match(empty.reason,/not a Workers custom domain visible/);
});

test('verification script is GET-only and never prints the token or author e-mail',()=>{
 const script=readFileSync(new URL('../scripts/verify-cloudflare-production.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(script,/method:\s*['"](?:POST|PUT|PATCH|DELETE)/i);
 assert.doesNotMatch(script,/console\.log\([^)]*token/);
 assert.doesNotMatch(script,/author_email/);
 assert.match(script,/if\(account!==ECHO_ACCOUNT_ID\)throw/);
 assert.match(script,/::warning::Cloudflare custom domain/);
 const pure=readFileSync(new URL('../scripts/cloudflare-production-validation.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(pure,/fetch\(|process\.env/);
});
