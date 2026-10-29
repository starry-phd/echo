import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reviewLegacyStaging,assertNoLegacyStagingReference} from '../scripts/legacy-staging-reconciliation.mjs';
const snapshot=JSON.parse(readFileSync(new URL('../database/legacy-staging-status.json',import.meta.url),'utf8'));
const clone=()=>structuredClone(snapshot);
test('current quarantined snapshot is accurately marked incomplete/unknown, never verified',()=>{
 const status=reviewLegacyStaging(snapshot);
 assert.equal(status.sourceDatabase,'echoes_db');
 assert.equal(status.destinationDatabase,'echo-starry');
 assert.equal(status.complete,false);
 assert.equal(status.totals.listedStagingTables,10);
 assert.equal(status.totals.sourceApplicationTables,50);
 assert.equal(status.totals.incomplete,2);
 assert.equal(status.totals.sourceCountUnknown,7);
 assert.equal(status.totals.countMatchedOnly,1);
 assert.deepEqual(status.tables.filter(t=>t.state==='incomplete').map(t=>[t.table,t.targetRows,t.sourceRows]),
  [['legacy_ai_story_facts',70,264],['legacy_tracks',28,112]]);
});
test('count equality cannot be mistaken for verified authorization',()=>{
 const input=clone();
 input.staging=[{table:'legacy_categories',sourceRows:8,targetRows:8}];
 const value=reviewLegacyStaging(input);
 assert.equal(value.complete,false);
 assert.equal(value.tables[0].state,'row-count-match-only');
});
test('reject duplicate/overwritten/bad staging counts',()=>{
 for(const modify of [
  x=>x.staging.push({...x.staging[0]}),
  x=>{x.staging[0].targetRows=9;},
  x=>{x.staging[0].targetRows=-1;},
  x=>{x.staging[0].sourceRows=undefined;},
  x=>{x.destination.existingOfficialTablesMustRemainUnmodified=false;},
  x=>{x.destination.database='echo-starry-copy';},
  x=>{x.staging[0].table='echo_tracks';}
 ]){
  const input=clone();modify(input);
  assert.throws(()=>reviewLegacyStaging(input));
 }
});
test('legacy auth/session/member source is hard-excluded',()=>{
 for(const name of ['legacy_auth_sessions','legacy_users','legacy_external_app_auth_codes','legacy_vip_share_access','legacy_passwords']){
  const input=clone();
  input.staging=[{table:name,sourceRows:null,targetRows:0}];
  assert.throws(()=>reviewLegacyStaging(input),/must not be staged/);
 }
 const input=clone();
 input.forbiddenSourceTables=['users'];
 assert.throws(()=>reviewLegacyStaging(input),/exclusions missing/);
});
test('public Worker and client must not reference quarantined legacy_* tables',()=>{
 assert.doesNotThrow(()=>assertNoLegacyStagingReference("SELECT * FROM echo_tracks WHERE visibility='public'"));
 for(const query of ['SELECT * FROM legacy_tracks','JOIN legacy_users','legacy_auth_sessions','legacy_ai_story_facts']){
  assert.throws(()=>assertNoLegacyStagingReference(query,'worker/index.ts'),/quarantined/);
 }
});
