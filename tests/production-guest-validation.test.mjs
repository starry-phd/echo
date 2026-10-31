import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {expectedGuestCount,isNoStore,validateGuestList,validateCover,validateRefusal} from '../scripts/production-guest-validation.mjs';
const headers=(cache='no-store',type='image/jpeg')=>new Headers({'cache-control':cache,'content-type':type});
const list=()=>Array.from({length:expectedGuestCount},(_,i)=>({
 id:'guest-'+i,playable:false,description:null,coverUrl:'/api/v1/previews/guest-'+i+'/cover?policy=2'
}));
test('no-store allows header lists but not cacheable directives alone',()=>{
 assert.equal(isNoStore('private, no-store'),true);
 assert.equal(isNoStore('No-Store'),true);
 assert.equal(isNoStore('max-age=0'),false);
 assert.equal(isNoStore(null),false);
});
test('curated guest list passes, rejects wrong count / permission / URL / duplicate',()=>{
 const good=list();
 assert.equal(validateGuestList(200,headers(),{tracks:good}).length,28);
 assert.throws(()=>validateGuestList(200,headers(),{tracks:good.slice(1)}),/count/);
 assert.throws(()=>validateGuestList(200,headers('public, max-age=3600'),{tracks:good}),/no-store/);
 const playable=list();playable[0].playable=true;
 assert.throws(()=>validateGuestList(200,headers(),{tracks:playable}),/permission/);
 const unsafe=list();unsafe[0].coverUrl='https://other.example/media';
 assert.throws(()=>validateGuestList(200,headers(),{tracks:unsafe}),/cover URL/);
 const duplicate=list();duplicate[0].id=duplicate[1].id;
 assert.throws(()=>validateGuestList(200,headers(),{tracks:duplicate}),/duplicate/);
});
test('scoped images validate MIME, cache and byte bounds',()=>{
 assert.doesNotThrow(()=>validateCover(200,headers('no-store','image/png'),2045487));
 assert.throws(()=>validateCover(404,headers(),2000),/HTTP 404/);
 assert.throws(()=>validateCover(200,headers('no-store','audio/mp4'),2000),/MIME/);
 assert.throws(()=>validateCover(200,headers('max-age=0'),2000),/no-store/);
 assert.throws(()=>validateCover(200,headers(),0),/length/);
 assert.throws(()=>validateCover(200,headers(),5000001),/length/);
});
test('private stream and unlisted cover refuse access',()=>{
 assert.doesNotThrow(()=>validateRefusal(404,headers(),'private stream'));
 assert.throws(()=>validateRefusal(200,headers(),'private stream'),/allowed unexpectedly/);
 assert.throws(()=>validateRefusal(404,headers('public,max-age=60'),'unlisted cover'),/no-store/);
});

test('live smoke probes all 28 guest stream HEAD statuses without reading any audio body',()=>{
 const script=readFileSync(new URL('../scripts/check-production-guest.mjs',import.meta.url),'utf8');
 assert.equal((script.match(/for\(let index=0;index<tracks\.length;index\+\+\)/g)||[]).length,2);
 assert.match(script,/fetchPublic\(path,'HEAD'\)/);
 assert.match(script,/validateRefusal\(r\.status,r\.headers,'guest stream HEAD '/);
 assert.match(script,/Validated 28\/28 curated guest stream HEAD requests/);
 assert.doesNotMatch(script,/r\.arrayBuffer\(\).*stream|r\.text\(\).*stream/);
});
