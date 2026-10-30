import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {splitSpeakerNames} from '../src/ui/echo/speakerNames.ts';
import {publicSpeakerRouteName} from '../src/ui/echo/authorizedSpeakerProfile.ts';

test('a verified public two-presenter track creates individually valid destinations',()=>{
 const whole='王小明 & 林美麗';
 assert.equal(publicSpeakerRouteName(whole),null);
 const individuals=splitSpeakerNames(whole);
 assert.deepEqual(individuals,['王小明','林美麗']);
 for(const name of individuals)assert.equal(publicSpeakerRouteName(name),name);
});

test('legacy fullwidth ampersand and duplicate presenters map to unique individual destinations',()=>{
 assert.deepEqual(splitSpeakerNames('王小明 ＆ 林美麗'),['王小明','林美麗']);
 assert.deepEqual(splitSpeakerNames('王小明 & 王小明'),['王小明']);
 assert.deepEqual(splitSpeakerNames('王 小明＆林美麗'),['王 小明','林美麗']);
});

test('public-track detail has separately accessible linked names, not whole-group URL',()=>{
 const src=readFileSync(new URL('../app/track/[id].tsx',import.meta.url),'utf8');
 assert.match(src,/import \{splitSpeakerNames\} from '\.\.\/\.\.\/src\/ui\/echo\/speakerNames'/);
 assert.match(src,/const speakerNames=splitSpeakerNames\(track\?\.speaker\)/);
 assert.match(src,/speakerNames\.map\(\(name,i\)=>/);
 assert.match(src,/accessibilityRole="link" accessibilityLabel=\{'查看'\+name\+'的演講者資料'\}/);
 assert.match(src,/params:\{name\}\}\)/);
 assert.doesNotMatch(src,/params:\{name:track\.speaker\}/);
 assert.match(src,/speakerLink:\{minHeight:44/);
});

test('speaker link change does not affect public media authorization or player mount guard',()=>{
 const src=readFileSync(new URL('../app/track/[id].tsx',import.meta.url),'utf8');
 assert.match(src,/queryFn:\(\{signal\}\)=>getPublicTrack\(trackId!,signal\)/);
 assert.match(src,/const hidden=isLocallyHiddenCard\(track,preferences\.dislikedIds,preferences\.hiddenSpeakers\)/);
 assert.match(src,/\{hydrated\?<AudioPlayback track=\{track\}/);
 assert.match(src,/const available=track\.playable&&Boolean\(source\)/);
});
