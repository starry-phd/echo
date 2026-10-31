import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import workerModule from '../worker/index.ts';
import {authorizedSpeakerProfileTracks} from '../src/ui/echo/authorizedSpeakerProfile.ts';
const worker=typeof workerModule.fetch==='function'?workerModule:workerModule.default;
const origin='https://echo-starry.starry-phd.workers.dev';

test('public speaker page searches only verified public candidates and exact normalized co-speaker names',()=>{
 const page=readFileSync(new URL('../app/speaker/[name].tsx',import.meta.url),'utf8');
 assert.match(page,/getPublicTracks\(signal,\{speaker:speaker!\}\)/);
 assert.doesNotMatch(page,/getPublicTracks\(signal,\{query:speaker!\}\)/);
 assert.match(page,/authorizedSpeakerProfileTracks\(speaker,/);
 assert.match(page,/mergeAuthorizedCards\(q\.data\?\?\[\],p\.data\?\?\[\]\)/);
 assert.doesNotMatch(page,/\/api\/speaker-profiles\/view|getPublicStreamUrl|R2\.get/);
});

test('actual SQLite public catalog finds & and ＆ co-presenters without showing similar-name or private entries',async()=>{
 const db=new DatabaseSync(':memory:');
 try{
  db.exec('CREATE TABLE echo_tracks(id TEXT,title TEXT,speaker TEXT,description TEXT,duration_seconds INTEGER,category_labels_json TEXT,visibility TEXT,migration_status TEXT,updated_at TEXT)');
  const insert=db.prepare('INSERT INTO echo_tracks VALUES(?,?,?,?,?,?,?,?,?)');
  insert.run('duo','共創故事','王小明 & 林美麗',null,360,'[]','public','verified','2026-10-31');
  insert.run('fullwidth','雙人故事','王小明 ＆ 陳美香',null,360,'[]','public','verified','2026-10-30');
  insert.run('solo','人生故事','王小明',null,360,'[]','public','verified','2026-10-29');
  insert.run('similar','不相同的人','王小明老師',null,360,'[]','public','verified','2026-10-28');
  insert.run('title-only','王小明的故事','另一位講者',null,360,'[]','public','verified','2026-10-27');
  insert.run('private','不得出現','王小明 & 林美麗',null,360,'[]','private','copied','2026-10-26');
  insert.run('unverified','不得出現','王小明',null,360,'[]','public','copied','2026-10-25');
  // Broad q= search would fill its 100-row cap with these similarly named speakers.
  for(let i=0;i<105;i++)insert.run('near-'+i,'王小明精彩講座','王小明老師',null,100,'[]','public','verified','2026-11-01');
  const allSql=[],allBinds=[];
  const env={DB:{prepare(sql){allSql.push(sql);const p=db.prepare(sql);let params=[];const stmt={bind(...args){params=args;allBinds.push(args);return stmt;},async all(){return {results:p.all(...params)};},async first(){return p.get(...params)??null;}};return stmt;}},MEDIA:{async get(){throw Error('audio never read');}}};
  const url=new URL(origin+'/api/v1/catalog');url.searchParams.set('speaker','王小明');
  const response=await worker.fetch(new Request(url),env);
  assert.equal(response.status,200);
  const {tracks}=await response.json();
  const approved=authorizedSpeakerProfileTracks('王小明',tracks,[],[]);
  assert.deepEqual(approved.map(x=>x.id),['duo','fullwidth','solo']);
  assert.deepEqual(tracks.map(x=>x.id),['duo','fullwidth','solo']);
  assert.equal(tracks.some(x=>x.id==='private'||x.id==='unverified'||x.id.startsWith('near-')),false);
  assert.match(allSql[0],/instr\(/);
  assert.match(allSql[0],/replace\(/);
  assert.match(allSql[0],/visibility\s*=\s*'public'/);
  assert.match(allSql[0],/migration_status\s*=\s*'verified'/);
  assert.equal(allSql[0].includes('王小明'),false);
  assert.deepEqual(allBinds[0],['王小明']);
  assert.deepEqual(authorizedSpeakerProfileTracks('林美麗',tracks,[],[]).map(x=>x.id),['duo']);
  const attacker=new URL(origin+'/api/v1/catalog');
  attacker.searchParams.set('speaker',"王小明' OR 1=1 --");
  const denied=await worker.fetch(new Request(attacker),env);
  assert.equal(denied.status,200);
  assert.deepEqual((await denied.json()).tracks,[]);
  assert.deepEqual(allBinds[1],["王小明' OR 1=1 --"]);
 }finally{db.close();}
});
