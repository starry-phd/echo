/**
 * Offline-only readback reconciliation. No Cloudflare API, credentials, data rows,
 * secrets or private audio are read or written by this module.
 * Source counts marked null are unknown; a matching row count is not permission
 * to expose media or to use legacy identity credentials.
 */
const sensitive=/^(?:legacy_)?(?:users|auth_sessions|external_app_auth_codes|vip_share_access|(?:.*_)?(?:passwords?|session_tokens?|otp_secrets?|credentials?))$/i;
const tablePattern=/^legacy_[a-z][a-z0-9_]*$/;
function validCount(value){return Number.isSafeInteger(value)&&value>=0;}
export function reviewLegacyStaging(snapshot){
 if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot))throw new Error('Manifest must be an object');
 if(snapshot.schemaVersion!==1)throw new Error('Unsupported manifest schema');
 if(snapshot.source?.database!=='echoes_db'||snapshot.destination?.database!=='echo-starry')
  throw new Error('Only the existing Echo source and destination are supported');
 if(snapshot.destination.existingOfficialTablesMustRemainUnmodified!==true)
  throw new Error('Protected echo_* tables must not be overwritten');
 if(!validCount(snapshot.source.applicationTableCount)||!validCount(snapshot.source.applicationRowCount))
  throw new Error('Invalid source inventory counts');
 if(!Array.isArray(snapshot.forbiddenSourceTables)||!['users','auth_sessions','external_app_auth_codes','vip_share_access'].every(x=>snapshot.forbiddenSourceTables.includes(x)))
  throw new Error('Mandatory legacy identity/secret exclusions missing');
 if(!Array.isArray(snapshot.staging)||snapshot.staging.length===0)throw new Error('Staging snapshot missing');
 if(snapshot.staging.length>snapshot.source.applicationTableCount)throw new Error('Staging snapshot contains more tables than source inventory');
 const seen=new Set();
 const tables=snapshot.staging.map(entry=>{
  if(!entry||typeof entry!=='object'||!tablePattern.test(entry.table||''))
   throw new Error('Only quarantined legacy_* staging identifiers are permitted');
  if(sensitive.test(entry.table)||snapshot.forbiddenSourceTables.includes(entry.table.slice(7)))
   throw new Error('Legacy credentials and central-member source must not be staged');
  if(seen.has(entry.table))throw new Error('Duplicate staging table identifier');
  seen.add(entry.table);
  if(!validCount(entry.targetRows)||!(entry.sourceRows===null||validCount(entry.sourceRows)))
   throw new Error('Invalid row counts: use explicit null for unknown source');
  if(entry.sourceRows!==null&&entry.targetRows>entry.sourceRows)
   throw new Error('Staging count exceeds known source count; stop and reconcile');
  const state=entry.sourceRows===null?'source-count-unknown':
   entry.targetRows===entry.sourceRows?'row-count-match-only':'incomplete';
  return {table:entry.table,sourceRows:entry.sourceRows,targetRows:entry.targetRows,state};
 });
 const totals={
  listedStagingTables:tables.length,
  sourceApplicationTables:snapshot.source.applicationTableCount,
  rowsInListedStagingTables:tables.reduce((s,x)=>s+x.targetRows,0),
  countMatchedOnly:tables.filter(x=>x.state==='row-count-match-only').length,
  incomplete:tables.filter(x=>x.state==='incomplete').length,
  sourceCountUnknown:tables.filter(x=>x.state==='source-count-unknown').length
 };
 return {observedDate:snapshot.observedDate,sourceDatabase:'echoes_db',destinationDatabase:'echo-starry',totals,tables,
  complete:false,note:'Static counts only. No row-level identity, private-media or entitlement validation; never promote legacy_* to public API.'};
}
/** Static fail-closed gate: a public API must not query quarantined legacy_* tables.
 * Escaping/indirection cannot be established with regex: every new API still
 * requires normal review, tests and protected CI.
 */
export function assertNoLegacyStagingReference(source,path='public API'){
 if(typeof source!=='string')throw new Error('API source must be text');
 const matches=source.match(/\blegacy_[a-z][a-z0-9_]*\b/gi);
 if(matches?.length)throw new Error(path+': legacy_* staging identifier found (quarantined)');
}
