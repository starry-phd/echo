import test from 'node:test';
import assert from 'node:assert/strict';
import workerModule from '../worker/index.ts';
// Node 22 + tsx may interop with TypeScript modules as CJS depending on package type.
const worker = typeof workerModule.fetch === 'function' ? workerModule : workerModule.default;

const origin = 'https://echo-starry.starry-phd.workers.dev';
const headers = {'Origin': origin};

function envWithDb(overrides = {}) {
  const sqlSeen = [];
  const bindings = [];
  const db = {
    prepare(sql) {
      sqlSeen.push(sql);
      const statement = {
        async all() {
          if (overrides.allRows) return { results: overrides.allRows };
          return { results: sql.includes('echo_categories') ? [{name: '學習'}] : [
            { id: 'safe-1', title: '測試講座', speaker: '講師', description: null,
              duration_seconds: 100, category_labels_json: '["學習"]' }
          ]};
        },
        bind(...values) {
          bindings.push(values);
          return statement;
        },
        async first() { return overrides.firstRow ?? null; }
      };
      return statement;
    }
  };
  return {
    sqlSeen,
    bindings,
    env: {
      DB: db,
      MEDIA: overrides.MEDIA ?? { async get() { return null; } },
      ASSETS: overrides.ASSETS ?? {async fetch() {return new Response('SPA', {status:200,headers:{'content-type':'text/html'}})}},
    }
  };
}

test('revoked guest cover fails closed without reading R2, response not cacheable',async()=>{
 let objectReads=0;
 const {env}=envWithDb({firstRow:null,MEDIA:{async get(){objectReads++;return null;}}});
 const response=await worker.fetch(new Request(origin+'/api/v1/previews/revoked/cover?policy=2'),env);
 assert.equal(response.status,404);
 assert.equal(response.headers.get('cache-control'),'no-store');
 assert.equal(objectReads,0);
});
test('guest metadata cover version changes path to bypass older hour-long browser caches',async()=>{
 const {env}=envWithDb({allRows:[{
  id:'safe-1',title:'合規資訊卡',speaker:'講者',description:null,duration_seconds:60,
  category_labels_json:'[]',cover_key:'cover/approved.jpg'
 }]});
 const response=await worker.fetch(new Request(origin+'/api/v1/previews'),env);
 assert.equal(response.status,200);
 assert.equal(response.headers.get('cache-control'),'no-store');
 const {tracks}=await response.json();
 assert.equal(tracks[0].coverUrl,'/api/v1/previews/safe-1/cover?policy=2');
 assert.equal(tracks[0].playable,false);
});

test('guest image endpoint reads R2 only for allowlisted metadata',async()=>{
 const reads=[];
 const {env,sqlSeen,bindings}=envWithDb({firstRow:{cover_key:'cover/guest.jpg'},MEDIA:{
  async get(key){reads.push(key);return {size:4,body:new Uint8Array([0xff,0xd8,0xff,0xd9]),httpMetadata:{contentType:'image/jpeg'}};}
 }});
 const r=await worker.fetch(new Request(origin+'/api/v1/previews/guest-1/cover'),env);
 assert.equal(r.status,200);
 assert.equal(r.headers.get('content-type'),'image/jpeg');
 assert.equal(r.headers.get('cache-control'),'no-store');
 assert.equal(r.headers.get('x-content-type-options'),'nosniff');
 assert.deepEqual(reads,['cover/guest.jpg']);
 assert.deepEqual(bindings[0],['guest-1']);
 assert.match(sqlSeen[0],/INNER JOIN echo_guest_previews/);
 assert.match(sqlSeen[0],/INNER JOIN echo_guest_card_media/);
 assert.match(sqlSeen[0],/visibility='private'/);
 assert.match(sqlSeen[0],/migration_status='copied'/);
});
test('legacy guest cover slightly above 2MB remains eligible but oversized media is refused',async()=>{
 const {env}=envWithDb({firstRow:{cover_key:'cover/large.png'},MEDIA:{
  async get(){return {size:2045487,body:new Uint8Array([137,80,78,71]),httpMetadata:{contentType:'image/png'}};}
 }});
 const r=await worker.fetch(new Request(origin+'/api/v1/previews/legacy-large-cover/cover'),env);
 assert.equal(r.status,200);
 assert.equal(r.headers.get('content-type'),'image/png');
 const blocked=envWithDb({firstRow:{cover_key:'cover/too-large.png'},MEDIA:{
  async get(){return {size:6000000,body:new Uint8Array([1])};}
 }});
 const no=await worker.fetch(new Request(origin+'/api/v1/previews/too-large/cover'),blocked.env);
 assert.equal(no.status,404);
});
test('guest image endpoint denies unlisted, untrusted paths and avoids R2',async()=>{
 for(const cover_key of [null,'private/audio.mp3','cover/../../secret.jpg','cover/not-an-image.svg']){
  let reads=0;
  const {env}=envWithDb({firstRow:cover_key?{cover_key}:null,MEDIA:{async get(){reads++;return null;}}});
  const r=await worker.fetch(new Request(origin+'/api/v1/previews/blocked/cover'),env);
  assert.equal(r.status,404);
  assert.equal(reads,0);
 }
});
test('metadata-only guest previews require explicit whitelist and cannot stream',async()=>{
 const row={id:'guest-1',title:'講座資訊',speaker:'演講者',description:'MUST_NOT_LEAK',
   audio_key:'private/sensitive.mp3',duration_seconds:160,category_labels_json:'["學習"]',
   cover_key:'cover/guest.jpg',speaker_rank:'鑽石',rating:4.5,rating_count:5,
   comments_count:2,likes:8,upload_date:'2026-10-10'};
 const {env,sqlSeen}=envWithDb({allRows:[row]});
 const r=await worker.fetch(new Request(origin+'/api/v1/previews'),env);
 assert.equal(r.status,200);
 assert.deepEqual((await r.json()).tracks,[{id:'guest-1',title:'講座資訊',speaker:'演講者',
   description:null,durationSeconds:160,categories:['學習'],playable:false,
   coverUrl:'/api/v1/previews/guest-1/cover?policy=2',speakerRank:'鑽石',
   rating:4.5,ratingCount:5,commentsCount:2,likes:8,
   uploadDate:'2026-10-10',legacySnapshot:true}]);
 assert.match(sqlSeen[0],/INNER JOIN echo_guest_previews/);
 assert.match(sqlSeen[0],/p\.track_id=t\.id/);
 assert.match(sqlSeen[0],/visibility='private'/);
 assert.match(sqlSeen[0],/migration_status='copied'/);
 assert.doesNotMatch(sqlSeen[0],/audio_key/);
});
test('guest previews search binds dangerous input, never grants media access',async()=>{
 const {env,sqlSeen,bindings}=envWithDb({allRows:[],firstRow:null});
 const attack="x' OR 1=1 --";
 const r=await worker.fetch(new Request(origin+'/api/v1/previews?q='+encodeURIComponent(attack)),env);
 assert.equal(r.status,200);
 assert.deepEqual((await r.json()).tracks,[]);
 assert.equal(sqlSeen[0].includes(attack),false);
 assert.deepEqual(bindings[0],[JSON.stringify(attack.split(/\s+/))]);
 const stream=await worker.fetch(new Request(origin+'/api/v1/tracks/guest-1/stream'),env);
 assert.equal(stream.status,404);
});
test('guest preview rejects invalid filter before querying DB',async()=>{
 const {env,sqlSeen}=envWithDb();
 const r=await worker.fetch(new Request(origin+'/api/v1/previews?q='+('x'.repeat(101))),env);
 assert.equal(r.status,400);
 assert.equal(sqlSeen.length,0);
});

test('health reports a pending central membership API without personal data', async () => {
  const {env}=envWithDb();
  const r=await worker.fetch(new Request(origin+'/api/health'),env);
  assert.equal(r.status,200);
  const body=await r.json();
  assert.equal(body.centralMemberApi,'pending');
  assert.equal(body.service,'echo-starry');
  assert.equal(JSON.stringify(body).includes('email'),false);
});

test('health reads the migration status from D1 but never implies public authorization', async()=>{
 const {env,sqlSeen}=envWithDb({firstRow:{status:'copied'}});
 const r=await worker.fetch(new Request(origin+'/api/v1/health'),env);
 assert.equal(r.status,200);
 const body=await r.json();
 assert.equal(body.legacyMediaMigration,'copied');
 assert.equal(body.centralMemberApi,'pending');
 assert.match(sqlSeen[0],/echo_migrations/);
 assert.equal(JSON.stringify(body).includes('audio_key'),false);
});
test('unrecognized migration status fails closed to pending', async()=>{
 const {env}=envWithDb({firstRow:{status:'public'}});
 const r=await worker.fetch(new Request(origin+'/api/v1/health'),env);
 assert.equal((await r.json()).legacyMediaMigration,'pending');
});

test('catalog SQL must require both public visibility and verified media', async () => {
  const {env,sqlSeen}=envWithDb();
  const r=await worker.fetch(new Request(origin+'/api/catalog'),env);
  assert.equal(r.status,200);
  const data=await r.json();
  assert.equal(data.tracks[0].id,'safe-1');
  assert.deepEqual(data.tracks[0].categories,['學習']);
  assert.match(sqlSeen[0],/visibility\s*=\s*'public'/);
  assert.match(sqlSeen[0],/migration_status\s*=\s*'verified'/);
  assert.equal(JSON.stringify(data).includes('central_user_id'),false);
});

test('stream endpoint denies an unverified or missing track', async () => {
  const {env,sqlSeen,bindings}=envWithDb();
  const r=await worker.fetch(new Request(origin+'/api/tracks/legacy-01/stream'),env);
  assert.equal(r.status,404);
  assert.equal((await r.json()).code,'NOT_FOUND');
  assert.match(sqlSeen[0],/migration_status\s*=\s*'verified'/);
  assert.match(sqlSeen[0],/id\s*=\s*\?/);
  assert.deepEqual(bindings[0],['legacy-01']);
});

test('web routes are delivered by Worker Static Assets, not Pages', async () => {
  const {env}=envWithDb();
  const r=await worker.fetch(new Request(origin+'/profile'),env);
  assert.equal(r.status,200);
  assert.equal(await r.text(),'SPA');
});

test('unknown API never returns the web SPA', async () => {
  const {env}=envWithDb();
  const r=await worker.fetch(new Request(origin+'/api/member/basic-profile'),env);
  assert.equal(r.status,404);
  assert.equal((await r.json()).code,'NOT_FOUND');
});

test('unapproved cross-origin preflight is rejected', async () => {
  const {env}=envWithDb();
  const r=await worker.fetch(new Request(origin+'/api/catalog',{method:'OPTIONS',headers:{origin:'https://evil.invalid'}}),env);
  assert.equal(r.status,403);
});

test('search is parameterized, without expanding public visibility', async () => {
  const {env,sqlSeen,bindings}=envWithDb();
  const value="abc' OR 1=1 --";
  const url=new URL(origin+'/api/catalog');
  url.searchParams.set('q',value);
  url.searchParams.set('category','學習');
  const r=await worker.fetch(new Request(url),env);
  assert.equal(r.status,200);
  assert.match(sqlSeen[0],/migration_status\s*=\s*'verified'/);
  assert.match(sqlSeen[0],/json_each/);
  assert.equal(sqlSeen[0].includes(value),false);
  assert.deepEqual(bindings[0],[JSON.stringify(value.split(/\s+/)),'學習']);
});

test('categories endpoint never reads central user profile storage', async () => {
  const {env,sqlSeen}=envWithDb();
  const r=await worker.fetch(new Request(origin+'/api/categories'),env);
  assert.equal(r.status,200);
  assert.deepEqual((await r.json()).categories,['學習']);
  assert.match(sqlSeen[0],/echo_categories/);
});

test('categories are derived only from actually published and verified tracks',async()=>{
 const {env,sqlSeen}=envWithDb({allRows:[]});
 const response=await worker.fetch(new Request(origin+'/api/v1/categories'),env);
 assert.equal(response.status,200);
 assert.deepEqual((await response.json()).categories,[]);
 assert.match(sqlSeen[0],/visibility\s*=\s*'public'/);
 assert.match(sqlSeen[0],/migration_status\s*=\s*'verified'/);
 assert.match(sqlSeen[0],/json_each/);
 assert.match(sqlSeen[0],/EXISTS/);
});

test('eligible audio supports byte ranges for seeking', async () => {
  let seen;
  const {env}=envWithDb({
    firstRow:{audio_key:'safe/audio.mp3'},
    MEDIA: {
      async get(key,options) {
        seen={key,range:options?.range?.get('Range')};
        return {
          size:1000,
          range:{offset:100,length:200},
          httpMetadata:{contentType:'audio/mpeg'},
          body:new Uint8Array(200),
        };
      }
    }
  });
  const r=await worker.fetch(new Request(origin+'/api/tracks/safe-1/stream',{headers:{Range:'bytes=100-299'}}),env);
  assert.equal(r.status,206);
  assert.equal(r.headers.get('content-range'),'bytes 100-299/1000');
  assert.equal(r.headers.get('accept-ranges'),'bytes');
  assert.equal(r.headers.get('cache-control'),'no-store');
  assert.deepEqual(seen,{key:'safe/audio.mp3',range:'bytes=100-299'});
});

test('legacy audio without R2 MIME is served using the real media container',async()=>{
 for(const [key,mime] of [
  ['uploads/one.m4a','audio/mp4'],
  ['uploads/old-aac-file.aac','audio/mp4'],
  ['uploads/one.mp3','audio/mpeg'],
  ['uploads/unsupported.bin','application/octet-stream']
 ]){
  const {env}=envWithDb({
   firstRow:{audio_key:key},
   MEDIA:{async get(){return {size:16,body:new Uint8Array(16)};}}
  });
  const r=await worker.fetch(new Request(origin+'/api/v1/tracks/safe-1/stream'),env);
  assert.equal(r.status,200);
  assert.equal(r.headers.get('content-type'),mime,key);
  assert.equal(r.headers.get('cache-control'),'no-store',key);
  assert.equal(r.headers.get('x-content-type-options'),'nosniff');
 }
});
test('explicit safe audio metadata takes priority for future genuine ADTS AAC',async()=>{
 const {env}=envWithDb({
  firstRow:{audio_key:'uploads/new.aac'},
  MEDIA:{async get(){return {size:16,httpMetadata:{contentType:'audio/aac'},body:new Uint8Array(16)};}}
 });
 const r=await worker.fetch(new Request(origin+'/api/v1/tracks/safe-1/stream'),env);
 assert.equal(r.headers.get('content-type'),'audio/aac');
});

test('invalid multi-range requests are rejected rather than ignored', async () => {
  const {env}=envWithDb({firstRow:{audio_key:'safe/audio.mp3'}});
  const r=await worker.fetch(new Request(origin+'/api/tracks/safe-1/stream',{headers:{Range:'bytes=0-5,12-22'}}),env);
  assert.equal(r.status,416);
});


test('canonical v1 catalog requires public plus verified access', async () => {
  const {env,sqlSeen}=envWithDb();
  const r=await worker.fetch(new Request(origin+'/api/v1/catalog?q=test'),env);
  assert.equal(r.status,200);
  assert.match(sqlSeen[0],/visibility\s*=\s*'public'/);
  assert.match(sqlSeen[0],/migration_status\s*=\s*'verified'/);
});
test('canonical v1 health reports pending member API', async () => {
  const {env}=envWithDb();
  const r=await worker.fetch(new Request(origin+'/api/v1/health'),env);
  const data=await r.json();
  assert.equal(data.apiVersion,'v1');
  assert.equal(data.centralMemberApi,'pending');
});


test('single track details return sanitized public metadata from a bound id',async()=>{
 const row={id:'safe-101',title:'公開演講',speaker:'講師',description:'介紹',
  duration_seconds:300,category_labels_json:'["營養"]',
  audio_key:'private/should-not-be-exposed.mp3',central_user_id:'must-never-leak'};
 const {env,bindings,sqlSeen}=envWithDb({firstRow:row});
 const r=await worker.fetch(new Request(origin+'/api/v1/tracks/safe-101'),env);
 assert.equal(r.status,200);
 const d=await r.json();
 assert.deepEqual(d.track,{id:'safe-101',title:'公開演講',speaker:'講師',description:'介紹',
  durationSeconds:300,categories:['營養'],playable:true});
 assert.equal(JSON.stringify(d).includes('audio_key'),false);
 assert.equal(JSON.stringify(d).includes('central_user_id'),false);
 assert.deepEqual(bindings[0],['safe-101']);
 assert.match(sqlSeen[0],/visibility\s*=\s*'public'/);
 assert.match(sqlSeen[0],/migration_status\s*=\s*'verified'/);
});
test('single track details fail closed for pending/private or absent tracks',async()=>{
 const {env}=envWithDb();
 const r=await worker.fetch(new Request(origin+'/api/v1/tracks/unverified-1'),env);
 assert.equal(r.status,404);
 assert.equal((await r.json()).code,'NOT_FOUND');
});
test('single track route rejects unreasonable identifiers before a database query',async()=>{
 const {env,sqlSeen}=envWithDb();
 const r=await worker.fetch(new Request(origin+'/api/v1/tracks/'+('a'.repeat(201))),env);
 assert.equal(r.status,400);
 assert.equal(sqlSeen.length,0);
});


test('speaker directory never queries pending or private tracks',async()=>{
 const {env,sqlSeen}=envWithDb({allRows:[{name:'講師甲',trackCount:2}]});
 const r=await worker.fetch(new Request(origin+'/api/v1/speakers'),env);
 assert.equal(r.status,200);
 assert.deepEqual((await r.json()).speakers,[{name:'講師甲',trackCount:2}]);
 assert.match(sqlSeen[0],/visibility\s*=\s*'public'/);
 assert.match(sqlSeen[0],/migration_status\s*=\s*'verified'/);
});
test('speaker filter always uses bound SQL parameters alongside public access checks',async()=>{
 const value="a' OR 1=1 --";
 const {env,sqlSeen,bindings}=envWithDb();
 const url=new URL(origin+'/api/v1/catalog');url.searchParams.set('speaker',value);
 const r=await worker.fetch(new Request(url),env);
 assert.equal(r.status,200);
 assert.match(sqlSeen[0],/instr\(/);
 assert.match(sqlSeen[0],/replace\(/);
 assert.match(sqlSeen[0],/\?/);
 assert.match(sqlSeen[0],/visibility\s*=\s*'public'/);
 assert.match(sqlSeen[0],/migration_status\s*=\s*'verified'/);
 assert.equal(sqlSeen[0].includes(value),false);
 assert.deepEqual(bindings[0],[value]);
});

test('all 28 synthetic guest stream HEAD probes fail closed without reading any R2 media',async()=>{
 let mediaReads=0;
 const {env,sqlSeen,bindings}=envWithDb({
  firstRow:null,
  MEDIA:{async get(){mediaReads++;throw new Error('MUST_NOT_READ_PRIVATE_MEDIA');}}
 });
 const ids=Array.from({length:28},(_,i)=>'guest-'+(i+1));
 for(const id of ids){
  const r=await worker.fetch(new Request(origin+'/api/v1/tracks/'+id+'/stream',{method:'HEAD'}),env);
  assert.equal(r.status,404,id);
  assert.equal(r.headers.get('cache-control'),'no-store',id);
 }
 assert.equal(mediaReads,0);
 assert.equal(sqlSeen.length,28);
 assert.deepEqual(bindings.map(values=>values[0]),ids);
 for(const sql of sqlSeen){
  assert.match(sql,/visibility\s*=\s*'public'/);
  assert.match(sql,/migration_status\s*=\s*'verified'/);
 }
});
