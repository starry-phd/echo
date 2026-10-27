import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.mjs';

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
