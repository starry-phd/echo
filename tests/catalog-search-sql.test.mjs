import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import workerModule from '../worker/index.ts';
const worker=typeof workerModule.fetch==='function'?workerModule:workerModule.default;
const origin='https://echo-starry.starry-phd.workers.dev';

test('actual SQLite search intersects terms, searches safe metadata and never expands the whitelist',async()=>{
 const db=new DatabaseSync(':memory:');
 try{
  db.exec(`CREATE TABLE echo_tracks(id TEXT,title TEXT,speaker TEXT,description TEXT,duration_seconds INTEGER,category_labels_json TEXT,visibility TEXT,migration_status TEXT,updated_at TEXT,audio_key TEXT);
   CREATE TABLE echo_guest_previews(track_id TEXT);
   CREATE TABLE echo_guest_card_media(track_id TEXT,cover_key TEXT,speaker_rank TEXT,rating REAL,rating_count INTEGER,comments_count INTEGER,likes INTEGER,upload_date TEXT);`);
  const insert=db.prepare('INSERT INTO echo_tracks(id,title,speaker,description,duration_seconds,category_labels_json,visibility,migration_status,updated_at) VALUES(?,?,?,?,?,?,?,?,?)');
  insert.run('allowed','成功之路','Mary',null,300,'["新人"]','private','copied','2026-10-01');
  insert.run('secret','成功之路','Mary','private description',300,'["新人"]','private','copied','2026-10-02');
  insert.run('public','成功之路','Mary',null,300,'["新人"]','public','verified','2026-10-03');
  db.exec(`INSERT INTO echo_guest_previews VALUES('allowed');INSERT INTO echo_guest_card_media(track_id,speaker_rank,upload_date) VALUES('allowed','GAR創辦人皇冠大使','2026-10-01');`);
  const env={DB:{prepare(sql){const prepared=db.prepare(sql);let values=[];const statement={bind(...args){values=args;return statement;},async all(){return {results:prepared.all(...values)};},async first(){return prepared.get(...values)??null;}};return statement;}},MEDIA:{async get(){return null;}}};
  const request=async(path,query)=>{
   const response=await worker.fetch(new Request(origin+path+'?q='+encodeURIComponent(query)),env);
   assert.equal(response.status,200);return (await response.json()).tracks;
  };
  assert.deepEqual((await request('/api/v1/previews','成功 Mary 新人 皇冠')).map(t=>t.id),['allowed']);
  assert.deepEqual((await request('/api/v1/catalog','成功 Mary 新人')).map(t=>t.id),['public']);
  assert.deepEqual(await request('/api/v1/previews',"x' OR 1=1 --"),[]);
  assert.deepEqual(await request('/api/v1/previews','成功 不存在'),[]);
  const refused=await worker.fetch(new Request(origin+'/api/v1/tracks/allowed/stream'),env);
  assert.equal(refused.status,404);
 }finally{db.close();}
});
