import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import workerModule from '../worker/index.ts';
import {readHistoricalEngagement} from '../src/ui/echo/legacyEngagementSnapshot.ts';

const worker=typeof workerModule.fetch==='function'?workerModule:workerModule.default;
const origin='https://echo-starry.starry-phd.workers.dev';
const base={
 id:'approved-guest',title:'核准訪客資訊卡',speaker:'已核准講者',
 description:'PRIVATE_DESCRIPTION_SHOULD_NOT_LEAK',duration_seconds:90,
 category_labels_json:'["學習"]',cover_key:null,speaker_rank:'白金',
 upload_date:'2026-10-31'
};
const metadata=async(row)=>{
 const sqlSeen=[];
 let reads=0;
 const env={DB:{prepare(sql){
  sqlSeen.push(sql);
  return {async all(){return {results:[row]};},bind(){return this;}};
 }},MEDIA:{async get(){reads++;throw Error('private audio must not be accessed');}}};
 const response=await worker.fetch(new Request(origin+'/api/v1/previews'),env);
 assert.equal(response.status,200);
 assert.equal(response.headers.get('cache-control'),'no-store');
 assert.equal(response.headers.get('x-content-type-options'),'nosniff');
 assert.equal(reads,0);
 assert.match(sqlSeen[0],/INNER JOIN echo_guest_previews/);
 assert.match(sqlSeen[0],/visibility='private'/);
 assert.match(sqlSeen[0],/migration_status='copied'/);
 assert.doesNotMatch(sqlSeen[0],/audio_key|private\/audio/);
 const body=await response.json();
 assert.equal(body.tracks.length,1);
 const track=body.tracks[0];
 assert.equal(track.playable,false);
 assert.equal(track.legacySnapshot,true);
 assert.equal(track.description,null);
 return track;
};

test('missing allowed guest history is omitted from JSON and remains unknown in the client',async()=>{
 const t=await metadata({...base,rating:null,rating_count:null,comments_count:null,likes:null});
 for(const field of ['rating','ratingCount','commentsCount','likes'])
  assert.equal(Object.hasOwn(t,field),false,field+' must not fabricate 0');
 assert.deepEqual(readHistoricalEngagement(t),{
  rating:null,ratingCount:null,commentsCount:null,likes:null
 });
});

test('real recorded guest zeros are preserved as numeric zeros, never dropped',async()=>{
 const t=await metadata({...base,rating:0,rating_count:0,comments_count:0,likes:0});
 for(const field of ['rating','ratingCount','commentsCount','likes'])
  assert.equal(t[field],0,field+' is a recorded zero');
 assert.deepEqual(readHistoricalEngagement(t),{
  rating:0,ratingCount:0,commentsCount:0,likes:0
 });
});

test('invalid numeric guest history is not clamped or fabricated into public observations',async()=>{
 const t=await metadata({...base,rating:5.9,rating_count:-2,comments_count:0.4,likes:Infinity});
 for(const field of ['rating','ratingCount','commentsCount','likes'])
  assert.equal(Object.hasOwn(t,field),false);
 const mixed=await metadata({...base,rating:4.5,rating_count:null,comments_count:2,likes:0});
 assert.deepEqual(readHistoricalEngagement(mixed),{
  rating:4.5,ratingCount:null,commentsCount:2,likes:0
 });
});

test('omission matches the existing optional-numeric OpenAPI Track contract',()=>{
 const schema=JSON.parse(readFileSync(new URL('../openapi/echo-public.v1.json',import.meta.url),'utf8'));
 const track=schema.components.schemas.Track;
 for(const field of ['rating','ratingCount','commentsCount','likes']){
  assert.equal(track.required.includes(field),false);
  assert.equal(track.properties[field].type,'number');
 }
 const source=readFileSync(new URL('../worker/index.ts',import.meta.url),'utf8');
 assert.match(source,/rating:approvedHistoricalRating\(row\.rating\)/);
 assert.match(source,/likes:approvedHistoricalCount\(row\.likes\)/);
 assert.doesNotMatch(source,/rating:Math\.max\(0,Math\.min\(5,Number\(row\.rating\)\|\|0\)\)/);
});
