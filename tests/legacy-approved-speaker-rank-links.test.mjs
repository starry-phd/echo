import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {speakerRankFromRoute,approvedGuestSpeakerRank} from '../src/ui/echo/publicSpeakerRankNavigation.ts';
import {matchesCardFilters} from '../src/ui/echo/cardFilters.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('speaker rank route validates URLs and normalizes original GAR/創辦人 ranks',()=>{
 assert.equal(speakerRankFromRoute(' GAR 創辦人雙鑽石 '),'雙鑽石');
 assert.equal(speakerRankFromRoute('白金'),'白金');
 assert.equal(speakerRankFromRoute(' 創辦人白金 '),'白金');
 for(const input of [undefined,null,[],['白金'],'', ' ', '<private>','a/b','a?b','a#b','a%b','a\\b','a\nb','x'.repeat(81),'GAR 創辦人']){
  assert.equal(speakerRankFromRoute(input),null,String(input));
 }
});
test('only approved metadata-only guest rank may create navigation; private/public inferred rank never does',()=>{
 const guest={id:'guest',playable:false,legacySnapshot:true,speakerRank:'創辦人白金'};
 assert.equal(approvedGuestSpeakerRank(guest),'白金');
 assert.equal(approvedGuestSpeakerRank({...guest,legacySnapshot:false}),null);
 assert.equal(approvedGuestSpeakerRank({...guest,playable:true}),null);
 assert.equal(approvedGuestSpeakerRank({...guest,speakerRank:null}),null);
 assert.equal(approvedGuestSpeakerRank(null),null);
});
test('rank link selects only matching already-authorized cards, not an open private catalog',()=>{
 const target=speakerRankFromRoute('創辦人白金');
 const first={title:'甲',speaker:'講師甲',speakerRank:'創辦人白金',categories:['新人']};
 const second={title:'乙',speaker:'講師乙',speakerRank:'鑽石',categories:['新人']};
 assert.equal(matchesCardFilters(first,{speakerRank:target}),true);
 assert.equal(matchesCardFilters(second,{speakerRank:target}),false);
 const home=read('app/index.tsx');
 assert.match(home,/rank:linkedSpeakerRank/);
 assert.match(home,/speakerRankFromRoute\(linkedSpeakerRank\)/);
 assert.match(home,/setSpeakerRank\(linkedRank\)/);
 assert.match(home,/setCategory\(linkedRank\?null:categoryFromRoute\(linkedCategory\)\)/);
 assert.match(home,/if\(linkedRank\)setAdvanced\(true\)/);
 assert.match(home,/matchesCardFilters\(t,/);
 assert.match(home,/getGuestPreviewTracks\(signal\)/);
 assert.match(home,/getPublicTracks\(signal,/);
});
test('shared cards and preview details have real accessible speaker rank links',()=>{
 for(const path of ['src/ui/echo/LegacyTrackCard.tsx','app/preview/[id].tsx']){
  const src=read(path);
  assert.match(src,/approvedGuestSpeakerRank\(track\)/);
  assert.match(src,/accessibilityRole="link"/);
  assert.match(src,/onPress=\{\(\)=>router\.push\(\{pathname:'\/',params:\{rank:approvedRankLink\}\}\)\}/);
  assert.match(src,/minHeight:44/);
 }
 const card=read('src/ui/echo/LegacyTrackCard.tsx');
 assert.match(card,/approvedRankLink\?<Pressable/);
 const preview=read('app/preview/[id].tsx');
 assert.match(preview,/approvedRankLink\?<Pressable/);
 assert.doesNotMatch(preview,/getPublicStreamUrl|AudioPlayback|useAudioPlayer|Share\.share|downloadPublicInfoCardPng/);
});
