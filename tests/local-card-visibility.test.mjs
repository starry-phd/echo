import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isLocallyHiddenCard} from '../src/ui/echo/localCardVisibility.ts';

const guest={id:'approved-guest',speaker:'王小明 & 林美麗',playable:false,legacySnapshot:true};
const publicTrack={id:'verified-public',speaker:'王小明',playable:true};

test('a saved track dislike applies to direct guest preview URLs',()=>{
 assert.equal(isLocallyHiddenCard(guest,['approved-guest'],[]),true);
 assert.equal(isLocallyHiddenCard(guest,['unrelated'],[]),false);
 assert.equal(isLocallyHiddenCard(null,['approved-guest'],[]),false);
});
test('speaker-wide device hide also applies on deep-linked public player and co-speaker previews',()=>{
 assert.equal(isLocallyHiddenCard(publicTrack,[],['王小明']),true);
 assert.equal(isLocallyHiddenCard(guest,[],['林美麗']),true);
 assert.equal(isLocallyHiddenCard(guest,[],['李小華']),false);
 assert.equal(isLocallyHiddenCard({id:'other',speaker:'王小明老師'},[],['王小明']),false);
});
test('local hidden preference is independent of public media permission flag',()=>{
 assert.equal(isLocallyHiddenCard({...publicTrack,playable:false},['verified-public'],[]),true);
 assert.equal(isLocallyHiddenCard({...guest,playable:true},[],['林美麗']),true);
});
test('both detail screens guard rendering after authorized fetch and before artwork/player',()=>{
 const preview=readFileSync(new URL('../app/preview/[id].tsx',import.meta.url),'utf8');
 const player=readFileSync(new URL('../app/track/[id].tsx',import.meta.url),'utf8');
 for(const route of [preview,player]){
  assert.match(route,/isLocallyHiddenCard\(track,preferences\.dislikedIds,preferences\.hiddenSpeakers\)/);
  assert.match(route,/!preferences\.ready\?/);
  assert.match(route,/hidden\?<View/);
  assert.match(route,/router\.push\('\/favorites'\)/);
 }
 assert.ok(preview.indexOf('hidden?<View')<preview.indexOf('<LegacyDetailSpeakerPortrait track={track}/>'));
 assert.match(preview,/LegacyDetailSpeakerPortrait track=\{track\}\/>/);
 assert.ok(player.indexOf('hidden?<View')<player.indexOf('<AudioPlayback track={track}/>'));
});
