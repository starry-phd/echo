import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ECHO_APP_TITLE,LEGACY_DEFAULT_ARTWORK_PATH,NATIVE_AUDIO_MODE,NATIVE_LOCK_SCREEN_OPTIONS,
 nativeLockScreenMetadata} from '../src/media/nativeAudioSession.ts';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const O='https://echo.starry.phd';

test('lecture audio plays with the silent switch on, keeps playing in background, pauses other apps',()=>{
 assert.deepEqual({...NATIVE_AUDIO_MODE},{playsInSilentMode:true,shouldPlayInBackground:true,interruptionMode:'doNotMix'});
 assert.deepEqual({...NATIVE_LOCK_SCREEN_OPTIONS},{showSeekBackward:true,showSeekForward:true});
 const app=JSON.parse(read('app.json'));
 assert.deepEqual(app.expo.plugins.find(p=>Array.isArray(p)&&p[0]==='expo-audio')[1],{enableBackgroundPlayback:true});
});

test('lock screen mirrors legacy Media Session: title, speaker, 繁星回聲, portrait else app icon',()=>{
 assert.deepEqual(nativeLockScreenMetadata({title:' 講題 ',speaker:'王老師',coverUrl:'/api/public/covers/a.jpg'},O),
  {title:'講題',artist:'王老師',albumTitle:ECHO_APP_TITLE,artworkUrl:O+'/api/public/covers/a.jpg'});
 assert.deepEqual(nativeLockScreenMetadata({title:'',speaker:'',coverUrl:null},O),
  {title:'繁星回聲',albumTitle:'繁星回聲',artworkUrl:O+LEGACY_DEFAULT_ARTWORK_PATH});
});

test('artwork never points to a foreign or protocol-relative URL, and is omitted without an API origin',()=>{
 for(const bad of ['//evil.example/x.jpg','https://evil.example/x.jpg','javascript:alert(1)'])
  assert.equal(nativeLockScreenMetadata({title:'t',speaker:'s',coverUrl:bad},O).artworkUrl,O+'/icon-512.png');
 assert.equal(nativeLockScreenMetadata({title:'t',speaker:'s',coverUrl:'/a.jpg'},null).artworkUrl,undefined);
});

test('session is configured only on native, only after a user tap on a verified playable track',()=>{
 const screen=read('app/track/[id].tsx');
 const toggle=screen.slice(screen.indexOf(' const toggle=()=>{'),screen.indexOf(' const toggleRef='));
 assert.ok(toggle.indexOf('if(!available||!source)return;')<toggle.indexOf('setAudioModeAsync(NATIVE_AUDIO_MODE)'));
 assert.match(toggle,/if\(native\)\{[\s\S]*setAudioModeAsync\(NATIVE_AUDIO_MODE\)[\s\S]*setActiveForLockScreen\(true,nativeLockScreenMetadata\(track,getApiBaseUrl\(\)\),NATIVE_LOCK_SCREEN_OPTIONS\)/);
 assert.match(screen,/const native=Platform\.OS!=='web';/);
 assert.match(screen,/player\.setActiveForLockScreen\(false\)/);
 assert.doesNotMatch(screen.slice(0,screen.indexOf(' const toggle=()=>{')),/setAudioModeAsync\(/);
});

test('iOS export compliance: HTTPS only, no proprietary encryption',()=>{
 assert.equal(JSON.parse(read('app.json')).expo.ios.infoPlist.ITSAppUsesNonExemptEncryption,false);
});
