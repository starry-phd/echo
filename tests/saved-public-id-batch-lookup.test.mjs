import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import workerModule from '../worker/index.ts';
import {createEchoPublicClient} from '../packages/echo-api-sdk/src/index.ts';
import {loadAuthorizedSavedPublicBatches} from '../src/ui/echo/authorizedSavedPublicBatches.ts';

const worker=typeof workerModule.fetch==='function'?workerModule:workerModule.default;
const base='https://echo-starry.starry-phd.workers.dev';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('verified-public batch lookup resolves favorites past 100 without revealing private or unverified IDs',async()=>{
 const db=new DatabaseSync(':memory:');
 try{
  db.exec('CREATE TABLE echo_tracks(id TEXT,title TEXT,speaker TEXT,description TEXT,duration_seconds INTEGER,category_labels_json TEXT,visibility TEXT,migration_status TEXT,updated_at TEXT)');
  const insert=db.prepare('INSERT INTO echo_tracks VALUES(?,?,?,?,?,?,?,?,?)');
  for(let i=0;i<125;i++)insert.run('p'+i,'公開作品'+i,'公開講師',null,180,'[]','public','verified','2026-10-31');
  insert.run('secret-1','保密作品','私密人物',null,180,'[]','private','copied','2026-11-01');
  insert.run('unverified-1','未驗證作品','未公開人物',null,180,'[]','public','copied','2026-11-01');
  const sql=[],params=[],media={reads:0,async get(){this.reads++;throw Error('Never read private audio')}};
  const env={DB:{prepare(statement){sql.push(statement);const p=db.prepare(statement);let bind=[];const query={bind(...args){bind=args;params.push(args);return query;},async all(){return {results:p.all(...bind)};},async first(){return p.get(...bind)??null;}};return query;}},MEDIA:media};
  const ids=['p124','p2','secret-1','unverified-1','not-found'];
  const url=new URL(base+'/api/v1/catalog');url.searchParams.set('ids',JSON.stringify(ids));
  const response=await worker.fetch(new Request(url),env);
  assert.equal(response.status,200);
  const {tracks}=await response.json();
  assert.deepEqual(tracks.map(t=>t.id).sort(),['p124','p2']);
  assert.ok(tracks.every(x=>x.playable===true));
  assert.equal(JSON.stringify(tracks).includes('私密人物'),false);
  assert.match(sql[0],/visibility\s*=\s*'public'/);
  assert.match(sql[0],/migration_status\s*=\s*'verified'/);
  assert.match(sql[0],/id IN \(SELECT value FROM json_each\(\?\)/);
  assert.deepEqual(params[0],[JSON.stringify(ids)]);
  assert.equal(media.reads,0);
  for(const invalid of ['not-json','[]',JSON.stringify(Array.from({length:17},(_,i)=>'i'+i)),JSON.stringify([''])]){
   const req=new URL(base+'/api/v1/catalog');req.searchParams.set('ids',invalid);
   const denied=await worker.fetch(new Request(req),env);
   assert.equal(denied.status,400,invalid.slice(0,20));
  }
  assert.equal(sql.length,1,'invalid input rejected before SQL');
  const attack=new URL(base+'/api/v1/catalog');
  attack.searchParams.set('ids',JSON.stringify(["p124' OR 1=1 --"]));
  const no=await worker.fetch(new Request(attack),env);
  assert.equal(no.status,200);
  assert.deepEqual((await no.json()).tracks,[]);
  assert.equal(sql[1].includes("p124' OR 1=1"),false);
  assert.deepEqual(params[1],[JSON.stringify(["p124' OR 1=1 --"])]);
 }finally{db.close();}
});

test('SDK serializes at most sixteen validated local identifiers without any write endpoint',async()=>{
 const requests=[];
 const client=createEchoPublicClient(base,async request=>{
  requests.push(request.url);
  return new Response(JSON.stringify({tracks:[]}),{status:200,headers:{'content-type':'application/json'}});
 });
 await client.listTracks(undefined,{ids:['p124','secret-1']});
 const url=new URL(requests[0]);
 assert.equal(url.pathname,'/api/v1/catalog');
 assert.deepEqual(JSON.parse(url.searchParams.get('ids')),['p124','secret-1']);
 await assert.rejects(()=>client.listTracks(undefined,{ids:[]}),/Invalid saved public ID batch/);
 await assert.rejects(()=>client.listTracks(undefined,{ids:Array.from({length:17},(_,i)=>'p'+i)}),/Invalid saved public ID batch/);
 assert.equal(requests.length,1);
});

test('saved IDs are deduplicated and resolved only in 16-ID batches',async()=>{
 const input=[...Array.from({length:35},(_,i)=>'p'+i),'p0','',null,'p1'];
 const batches=[];
 const result=await loadAuthorizedSavedPublicBatches(input,async ids=>{
  batches.push(ids);
  return ids.map(id=>({id}));
 });
 assert.deepEqual(batches.map(x=>x.length),[16,16,3]);
 assert.equal(new Set(result.map(x=>x.id)).size,35);
 assert.equal(result[0].id,'p0');
});

test('favorites revalidates only saved public IDs against current API and keeps guest curated',()=>{
 const view=read('app/favorites.tsx');
 const workerSrc=read('worker/index.ts');
 const spec=JSON.parse(read('openapi/echo-public.v1.json'));
 assert.match(view,/preferences\.favoriteIds,\.\.\.preferences\.dislikedIds/);
 assert.match(view,/loadAuthorizedSavedPublicBatches\(savedIds,/);
 assert.match(view,/ids=>getPublicTracks\(signal,\{ids\}\)/);
 assert.match(view,/mergeAuthorizedCards\(catalog\.data\?\?\[\],savedPublic\.data\?\?\[\]\)/);
 assert.match(view,/mergeAuthorizedCards\(publicCards,previews\.data\?\?\[\]\)/);
 assert.match(view,/restorableHiddenCards\(publicCards,previews\.data\?\?\[\],preferences\.dislikedIds\)/);
 assert.match(view,/!isSpeakerHidden\(track\.speaker,preferences\.hiddenSpeakers\)/);
 assert.match(view,/savedPublic\.isError/);
 assert.match(workerSrc,/requestedIds/);
 assert.equal(spec.paths['/api/v1/catalog'].get.parameters.some(x=>x.name==='ids'),true);
 assert.equal(spec.paths['/api/v1/previews'].get.parameters.some(x=>x.name==='ids'),false);
 assert.doesNotMatch(view,/R2\.get|\.MEDIA\.get|getPublicStreamUrl|legacyDb/);
});
