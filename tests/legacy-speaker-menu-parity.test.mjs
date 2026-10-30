import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {allowedQuickActions,normalizeQuickChoices} from '../src/ui/echo/quickActionStore.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('original navbar has no standalone speaker directory and this menu no longer invents it',()=>{
 const header=read('src/ui/echo/LegacyHeader.tsx');
 assert.doesNotMatch(header,/講師作品|go\('\/speaker'\)|speakers:\{label:/);
 assert.ok(!allowedQuickActions.includes('speakers'));
 const directSpeakerPage=read('app/speaker/index.tsx');
 assert.ok(directSpeakerPage.includes('<Redirect href="/" />'));
 assert.doesNotMatch(directSpeakerPage,/FlatList|visibleSpeakerDirectory|getPublicSpeakers/);
 const choices=normalizeQuickChoices({
  mobile:['speakers','theme','home'],
  tablet:['speakers','stats'],
  desktop:['speakers','palette']
 });
 assert.deepEqual(choices.mobile,['theme','home']);
 assert.deepEqual(choices.tablet,['stats']);
 assert.deepEqual(choices.desktop,['palette']);
});

test('old speaker-name interaction remains reachable through existing approved name links',()=>{
 for(const path of ['src/ui/echo/LegacyTrackCard.tsx','app/preview/[id].tsx','app/track/[id].tsx']){
  const src=read(path);
  assert.match(src,/pathname:'\/speaker\/\[name\]'/);
  assert.match(src,/accessibilityRole="link"/);
 }
 const page=read('app/speaker/[name].tsx');
 assert.match(page,/publicSpeakerRouteName\(name\)/);
 assert.match(page,/authorizedSpeakerProfileTracks\(speaker,/);
 assert.match(page,/showBio=ready&&display==='ready'&&!speakerHidden/);
 assert.doesNotMatch(page,/getPublicStreamUrl|R2\.get|privateAudio/);
});
