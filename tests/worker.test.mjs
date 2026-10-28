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

test('health reports a pending central membership API without personal data', async () => {
  const {env}=envWithDb();
  const r=await worker.fetch(new Request(origin+'/api/health'),env);
  assert.equal(r.status,200);
  const body=await r.json();
  assert.equal(body.centralMemberApi,'pending');
  assert.equal(body.service,'echo-starry');
  assert.equal(JSON.stringify(body).includes('email'),false);
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
  assert.deepEqual(bindings[0],[value,value,'學習']);
});

test('categories endpoint never reads central user profile storage', async () => {
  const {env,sqlSeen}=envWithDb();
  const r=await worker.fetch(new Request(origin+'/api/categories'),env);
  assert.equal(r.status,200);
  assert.deepEqual((await r.json()).categories,['學習']);
  assert.match(sqlSeen[0],/echo_categories/);
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
  assert.deepEqual(seen,{key:'safe/audio.mp3',range:'bytes=100-299'});
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
