import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import workerModule from '../worker/index.ts';
import {createEchoPublicClient} from '../packages/echo-api-sdk/src/index.ts';
const worker=typeof workerModule.fetch==='function'?workerModule:workerModule.default;
const base='https://echo-starry.starry-phd.workers.dev';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('verified-public catalog uses stable and bound 100-row pages; private and near-names remain denied',async()=>{
 const db=new DatabaseSync(':memory:');
 try{
  db.exec('CREATE TABLE echo_tracks(id TEXT,title TEXT,speaker TEXT,description TEXT,duration_seconds INTEGER,category_labels_json TEXT,visibility TEXT,migration_status TEXT,updated_at TEXT)');
  const insert=db.prepare('INSERT INTO echo_tracks VALUES(?,?,?,?,?,?,?,?,?)');
  for(let i=0;i<205;i++)insert.run('p'+String(i).padStart(3,'0'),'公開演講'+i,'王小明 & 林美麗',null,240,'[]','public','verified','2026-10-31');
  for(let i=0;i<30;i++)insert.run('private'+i,'私人','王小明',null,240,'[]','private','copied','2026-11-02');
  for(let i=0;i<120;i++)insert.run('near'+i,'相似姓名','王小明老師',null,240,'[]','public','verified','2026-11-01');
  const seen=[],bound=[];
  const env={DB:{prepare(sql){seen.push(sql);const prepared=db.prepare(sql);let args=[];const s={bind(...a){args=a;bound.push(a);return s;},async all(){return {results:prepared.all(...args)};},async first(){return prepared.get(...args)??null;}};return s;}},MEDIA:{async get(){throw Error('private media cannot be read');}}};
  async function page(offset){
   const response=await worker.fetch(new Request(base+'/api/v1/catalog?speaker='+encodeURIComponent('王小明')+'&offset='+offset),env);
   assert.equal(response.status,200);
   return (await response.json()).tracks;
  }
  const p0=await page(0),p1=await page(100),p2=await page(200);
  assert.equal(p0.length,100);
  assert.equal(p1.length,100);
  assert.equal(p2.length,5);
  assert.equal(p0[0].id,'p000');
  assert.equal(p1[0].id,'p100');
  assert.equal(p2[4].id,'p204');
  assert.equal(new Set([...p0,...p1,...p2].map(t=>t.id)).size,205);
  assert.ok([...p0,...p1,...p2].every(t=>t.playable&&t.speaker==='王小明 & 林美麗'));
  assert.match(seen[0],/visibility\s*=\s*'public'/);
  assert.match(seen[0],/migration_status\s*=\s*'verified'/);
  assert.match(seen[0],/ORDER BY updated_at DESC, id ASC LIMIT 100 OFFSET \?/);
  assert.deepEqual(bound[0],['王小明',0]);
  assert.deepEqual(bound[1],['王小明',100]);
  assert.deepEqual(bound[2],['王小明',200]);
  for(const invalid of ['-1','abc','1.5','0001','1000000']){
   const result=await worker.fetch(new Request(base+'/api/v1/catalog?offset='+invalid),env);
   assert.equal(result.status,400,invalid);
  }
  assert.equal(seen.length,3,'invalid offsets rejected without DB queries');
 }finally{db.close();}
});

test('SDK forwards only optional numeric offset to versioned verified catalog',async()=>{
 const calls=[];
 const fake=async request=>{calls.push(request.url);return new Response(JSON.stringify({tracks:[]}),{status:200});};
 const sdk=createEchoPublicClient(base,fake);
 await sdk.listTracks(undefined,{speaker:'王小明',offset:100});
 const url=new URL(calls[0]);
 assert.equal(url.pathname,'/api/v1/catalog');
 assert.equal(url.searchParams.get('speaker'),'王小明');
 assert.equal(url.searchParams.get('offset'),'100');
});

test('speaker profile paginates only verified-public source, preserving current guest policy and exact name checks',()=>{
 const page=read('app/speaker/[name].tsx');
 const worker=read('worker/index.ts');
 const sdk=read('packages/echo-api-sdk/src/index.ts');
 const api=JSON.parse(read('openapi/echo-public.v1.json'));
 assert.match(page,/useInfiniteQuery\(/);
 assert.match(page,/getPublicTracks\(signal,\{speaker:speaker!,offset:pageParam\}\)/);
 assert.match(page,/initialPageParam:0/);
 assert.match(page,/getNextPageParam:\(lastPage,allPages\)=>lastPage\.length===100\?allPages\.length\*100:undefined/);
 assert.match(page,/q\.data\?\.pages\.flat\(\)\?\?\[\]/);
 assert.match(page,/mergeAuthorizedCards\(publicTracks,p\.data\?\?\[\]\)/);
 assert.match(page,/authorizedSpeakerProfileTracks\(speaker,/);
 assert.match(page,/q\.fetchNextPage\(\)/);
 assert.match(page,/q\.isFetchNextPageError/);
 assert.match(sdk,/offset:filters\.offset/);
 assert.match(worker,/publicCatalogFilterSchema/);
 assert.equal(api.paths['/api/v1/catalog'].get.parameters.find(p=>p.name==='offset').schema.maximum,999999);
 assert.equal(api.paths['/api/v1/previews'].get.parameters.some(p=>p.name==='offset'),false);
 assert.doesNotMatch(page,/R2\.get|getPublicStreamUrl|\/api\/speaker-profiles\/view/);
});
