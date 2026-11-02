/** Read-only Cloudflare release evidence for the public Echo Worker.
 * Pure assertions only (no network): the caller fetches with the existing
 * deploy token. Never logs the token or deployment author e-mail.
 */
export const ECHO_ACCOUNT_ID='9ff1b4c261141730ac2fe0683f730062';
export const ECHO_WORKER='echo-starry';
export const LEGACY_HOSTNAME='echo.starry.phd';
export const LEGACY_SERVICE='temp-starry-echo-bridge';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Wrangler 4 prints exactly one `Current Version ID: <uuid>` after upload. */
export function parseUploadedVersionId(log){
 const ids=[...String(log??'').matchAll(/Current Version ID:\s*([0-9a-f-]{36})/g)].map(m=>m[1]);
 if(ids.length!==1)throw Error('expected exactly one uploaded Version ID in wrangler output, found '+ids.length);
 if(!UUID.test(ids[0]))throw Error('uploaded Version ID is not a UUID');
 return ids[0];
}

function apiResult(status,payload,label){
 if(status!==200||payload?.success!==true)throw Error(label+' failed (HTTP '+status+')');
 return payload.result;
}

function singleFullVersion(deployment,label){
 const versions=deployment?.versions;
 if(!Array.isArray(versions)||versions.length!==1)
  throw Error(label+' must route to exactly one version, found '+(Array.isArray(versions)?versions.length:'none'));
 const [only]=versions;
 if(!UUID.test(String(only?.version_id))||only.percentage!==100)
  throw Error(label+' is not a single version at 100% traffic');
 return only.version_id;
}

/** Newest deployment from GET .../workers/scripts/echo-starry/deployments. */
export function latestDeployment(status,payload){
 const list=apiResult(status,payload,'deployment list')?.deployments;
 if(!Array.isArray(list)||!list.length)throw Error('deployment list is empty');
 const newest=[...list].sort((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
 if(!UUID.test(String(newest?.id))||!Number.isFinite(Date.parse(newest.created_on)))
  throw Error('latest deployment has no valid id/created_on');
 return newest;
}

/** latest + exact GET must agree on one deployment serving the uploaded version at 100%. */
export function validateLiveDeployment(latest,exactStatus,exactPayload,uploadedVersionId){
 const exact=apiResult(exactStatus,exactPayload,'exact deployment');
 if(exact?.id!==latest.id)throw Error('exact deployment id differs from latest');
 const latestVersion=singleFullVersion(latest,'latest deployment');
 const exactVersion=singleFullVersion(exact,'exact deployment');
 if(latestVersion!==exactVersion)throw Error('latest and exact deployment disagree on version');
 if(exactVersion!==uploadedVersionId)throw Error('live version '+exactVersion+' is not the uploaded version '+uploadedVersionId);
 return {deploymentId:exact.id,versionId:exactVersion,percentage:100,createdOn:String(exact.created_on)};
}

/** echo.starry.phd must never move to echo-starry and must stay on the legacy
 * bridge. A token without domain-read scope or a hostname managed outside this
 * account is reported as UNVERIFIED (never as passed). */
export function classifyLegacyDomain(status,payload){
 if(status===401||status===403)return {state:'unverified',reason:'token cannot read Workers custom domains (HTTP '+status+')'};
 const result=apiResult(status,payload,'custom domain lookup');
 if(!Array.isArray(result))throw Error('custom domain lookup returned no list');
 const matches=result.filter(d=>String(d?.hostname).toLowerCase()===LEGACY_HOSTNAME);
 if(!matches.length)return {state:'unverified',reason:LEGACY_HOSTNAME+' is not a Workers custom domain visible to this account'};
 for(const d of matches){
  if(d.service===ECHO_WORKER)throw Error(LEGACY_HOSTNAME+' is bound to '+ECHO_WORKER+' without an approved cutover');
  if(d.service!==LEGACY_SERVICE)throw Error(LEGACY_HOSTNAME+' moved to unexpected service '+String(d.service));
 }
 return {state:'verified',service:LEGACY_SERVICE};
}
