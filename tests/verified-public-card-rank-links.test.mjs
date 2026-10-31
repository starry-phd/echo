import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {approvedGuestSpeakerRank,approvedVerifiedSpeakerRank} from '../src/ui/echo/publicSpeakerRankNavigation.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('rank navigation is derived only from approved guest or verified-public cards',()=>{
 const guest={playable:false,legacySnapshot:true,speakerRank:'GAR 創辦人白金'};
 const verified={playable:true,legacySnapshot:false,speakerRank:'創辦人雙鑽石'};
 assert.equal(approvedGuestSpeakerRank(guest)??approvedVerifiedSpeakerRank(guest),'白金');
 assert.equal(approvedGuestSpeakerRank(verified)??approvedVerifiedSpeakerRank(verified),'雙鑽石');
 assert.equal(approvedGuestSpeakerRank({...guest,legacySnapshot:false})??approvedVerifiedSpeakerRank({...guest,legacySnapshot:false}),null);
 assert.equal(approvedGuestSpeakerRank({...verified,speakerRank:'bad?rank'})??approvedVerifiedSpeakerRank({...verified,speakerRank:'bad?rank'}),null);
 assert.equal(approvedGuestSpeakerRank(null)??approvedVerifiedSpeakerRank(null),null);
});

test('public list cards re-use existing safe rank filter; playback and guest preview gates stay independent',()=>{
 const card=read('src/ui/echo/LegacyTrackCard.tsx');
 const home=read('app/index.tsx');
 const stats=read('app/stats.tsx');
 const favorites=read('app/favorites.tsx');
 assert.match(card,/const approvedRankLink=approvedGuestSpeakerRank\(track\)\?\?approvedVerifiedSpeakerRank\(track\)/);
 assert.match(card,/approvedRankLink\?<Pressable accessibilityRole="link"/);
 assert.match(card,/onPress=\{\(\)=>router\.push\(\{pathname:'\/',params:\{rank:approvedRankLink\}\}\)\}/);
 assert.match(card,/track\.playable\)\{router\.push\(\{pathname:'\/track\/\[id\]'/);
 assert.match(card,/if\(!track\.playable\)/);
 for(const src of [home,stats,favorites])assert.match(src,/mergeAuthorizedCards\(/);
 assert.match(home,/getGuestPreviewTracks\(signal\)/);
 assert.match(home,/getPublicTracks\(signal,/);
 assert.doesNotMatch(card,/getPublicStreamUrl|R2\.get|\/api\/member\//);
});
