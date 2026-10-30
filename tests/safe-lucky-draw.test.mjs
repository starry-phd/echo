import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseSafeLuckyCard} from '../src/ui/echo/safeLuckyDraw.ts';

const guest=(id)=>({id,playable:false,legacySnapshot:true,
 description:null,coverUrl:'/api/v1/previews/'+id+'/cover?policy=2'});
const live=(id)=>({id,playable:true,legacySnapshot:false});
const privateTrack=(id)=>({id,playable:false,legacySnapshot:false,
 description:'private content',coverUrl:'/api/v1/previews/'+id+'/cover?policy=2'});

test('only explicitly eligible, already-visible verified playable recordings are drawn',()=>{
 const result=chooseSafeLuckyCard([guest('approved'),live('verified'),privateTrack('private')],null,()=>0.1);
 assert.equal(result.kind,'playable');
 assert.equal(result.track.id,'verified');
});

test('when no verified audio exists choose only metadata-only approved visitor card',()=>{
 const result=chooseSafeLuckyCard([
  privateTrack('no'),{...guest('spoofed'),coverUrl:'/api/v1/tracks/spoofed/stream'},
  {...guest('no-policy'),coverUrl:'/api/v1/previews/no-policy/cover'},
  {...guest('not-read-only'),description:'private'},
  {...guest('not-whitelisted'),legacySnapshot:false},
  guest('approved')
 ],null,()=>0.9);
 assert.equal(result.kind,'preview');
 assert.equal(result.track.id,'approved');
 assert.equal(result.track.playable,false);
});

test('no private audio or failed preview means NO random pick',()=>{
 assert.deepEqual(chooseSafeLuckyCard([privateTrack('private')]),{kind:'empty',track:null});
 assert.deepEqual(chooseSafeLuckyCard([]),{kind:'empty',track:null});
});

test('never repeat the same guest card if another is available',()=>{
 assert.equal(chooseSafeLuckyCard([guest('one'),guest('two')],'one',()=>0).track.id,'two');
 assert.equal(chooseSafeLuckyCard([guest('one')],'one',()=>0).track.id,'one');
});

test('draw is bounded and does not mutate the visible list',()=>{
 const cards=[guest('one'),guest('two'),guest('three')];
 const before=cards.slice();
 assert.equal(chooseSafeLuckyCard(cards,null,()=>1).track.id,'three');
 assert.equal(chooseSafeLuckyCard(cards,null,()=>Infinity).track.id,'one');
 assert.equal(chooseSafeLuckyCard(cards,null,()=>-4).track.id,'one');
 assert.deepEqual(cards,before);
});

test('never widen the candidate pool beyond caller-applied filters and dislikes',()=>{
 const onlyCurrentlyVisible=[guest('visible')];
 const result=chooseSafeLuckyCard(onlyCurrentlyVisible);
 assert.equal(result.track.id,'visible');
 assert.equal(onlyCurrentlyVisible.some(x=>x.id==='disliked'),false);
});
