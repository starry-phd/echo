import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {legacyDetailHeroSizing} from '../src/ui/echo/legacyDetailHeroSizing.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('original DetailView round portrait is 144px mobile and 176px at 640px',()=>{
 assert.deepEqual(legacyDetailHeroSizing(390),{portrait:144,titleFont:20});
 assert.deepEqual(legacyDetailHeroSizing(639),{portrait:144,titleFont:20});
 assert.deepEqual(legacyDetailHeroSizing(640),{portrait:176,titleFont:24});
 assert.deepEqual(legacyDetailHeroSizing(1440),{portrait:176,titleFont:24});
 assert.deepEqual(legacyDetailHeroSizing(Number.NaN),{portrait:144,titleFont:20});
});

test('shared round portrait uses approved API cover only and cannot play metadata-only records',()=>{
 const source=read('src/ui/echo/LegacyDetailSpeakerPortrait.tsx');
 assert.match(source,/legacyDetailHeroSizing\(viewport\.width\)\.portrait/);
 assert.match(source,/borderRadius:999/);
 assert.match(source,/resizeMode="cover"/);
 assert.match(source,/path\.startsWith\('\/'\)&&!path\.startsWith\('\/\/'\)/);
 assert.match(source,/if\(track\.playable&&onPress\)return <Pressable/);
 assert.match(source,/const fallbackLabel=track\.playable/);
 assert.match(source,/播放器準備中/);
 assert.match(source,/音檔尚未開放播放/);
 assert.doesNotMatch(source,/useAudioPlayer|fetch\(|\/api\/members|R2|D1|AsyncStorage/);
});

test('guest metadata preview restores original centered second-level photo, categories, title and name',()=>{
 const source=read('app/preview/[id].tsx');
 assert.match(source,/getGuestPreviewTracks\(signal\)/);
 assert.match(source,/<LegacyDetailSpeakerPortrait track=\{track\}\/>/);
 assert.match(source,/legacyDetailHeroSizing\(viewport\.width\)/);
 assert.ok(source.indexOf('<LegacyDetailSpeakerPortrait')<source.indexOf('styles.heroTags'));
 assert.ok(source.indexOf('styles.heroTags')<source.indexOf('styles.title'));
 assert.ok(source.indexOf('styles.title')<source.indexOf('styles.heroSpeakers'));
 assert.match(source,/fontSize:fontSize\(hero\.titleFont\)/);
 assert.match(source,/錄音播放未開放；照片僅供瀏覽/);
 assert.doesNotMatch(source,/useAudioPlayer|getPublicStreamUrl|LegacyPlaybackTimeline|setPlaybackRate|AudioPlayback|LegacyVerifiedTrackShare/);
});

test('verified-public detail restores the original photo-first hero while preserving the public playback gate',()=>{
 const source=read('app/track/[id].tsx');
 assert.ok(source.includes('getPublicTrack(trackId!,signal)'));
 assert.ok(source.includes('const available=track.playable&&Boolean(source)'));
 assert.ok(source.includes('if(!available||!source)return;'));
 assert.ok(source.includes('toggleRef.current=toggle'));
 assert.ok(source.includes('onToggleReady(invokeToggle)'));
 assert.ok(source.includes('<LegacyDetailSpeakerPortrait track={track} onPress={portraitToggle??undefined}/>'));
 assert.ok(source.includes('<AudioPlayback track={track} onToggleReady={onToggleReady}/>'));
 const hero=source.indexOf('<View style={styles.hero}>');
 const portrait=source.indexOf('<LegacyDetailSpeakerPortrait track={track}',hero);
 const tags=source.indexOf('<View style={styles.tags}>',hero);
 const title=source.indexOf('<Text style={[styles.title',hero);
 const speakers=source.indexOf('<View style={styles.heroSpeakers}>',hero);
 const nav=source.indexOf('<LegacyDetailSectionNavigation',hero);
 const player=source.indexOf('<AudioPlayback track={track}',hero);
 assert.ok(portrait>hero&&portrait<tags&&tags<title&&title<speakers&&speakers<nav&&nav<player);
 assert.equal(source.includes('speakerAvatar'),false);
 assert.equal(source.includes('speakerInitial'),false);
 assert.equal(source.includes('LegacyDetailSpeakerPortrait track={track} onPress={toggle}'),false);
 assert.ok(source.includes('LegacyDetailSectionNavigation showPlayback={track.playable}'));
 assert.equal(read('app/preview/[id].tsx').includes('onPress={toggle}'),false);
});
