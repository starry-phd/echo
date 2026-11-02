import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chooseGuestNickname,loadGuestNickname,GUEST_NICKNAME_KEY,guestAnimals,guestAdjectives}
 from '../src/ui/echo/guestNickname.ts';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('positive-only exact original visitor word lists, without any member/device ID',()=>{
 assert.equal(guestAnimals.length,20);
 assert.equal(guestAdjectives.length,20);
 assert.deepEqual(guestAnimals.map(a=>a.name),[
  '海豚','獵鷹','貓頭鷹','老虎','獅子','白兔','狐狸','熊貓','無尾熊','長頸鹿',
  '大象','駿馬','刺蝟','企鵝','紅鶴','松鼠','海豹','野狼','梅花鹿','綠頭鴨'
 ]);
 assert.ok(guestAdjectives.includes('勇敢的'));
 assert.ok(guestAdjectives.includes('溫暖的'));
 assert.equal(chooseGuestNickname(null,()=>0).fullName,'爽朗的海豚');
 assert.deepEqual(chooseGuestNickname(null,()=>0),{fullName:'爽朗的海豚',emoji:'🐬'});
});

test('a new app load never repeats the previous nickname, even with identical random choices',()=>{
 const previous=chooseGuestNickname(null,()=>0);
 const next=chooseGuestNickname(previous.fullName,()=>0);
 assert.deepEqual(next,{fullName:'爽朗的獵鷹',emoji:'🦅'});
 const almostLast=()=>0.99999;
 const wrap=chooseGuestNickname('充滿好奇的綠頭鴨',almostLast);
 assert.deepEqual(wrap,{fullName:'充滿好奇的海豚',emoji:'🐬'});
});

test('untrusted stored text is never reflected in visible nickname',()=>{
 assert.deepEqual(chooseGuestNickname('<script>danger</script>',()=>0),{fullName:'爽朗的海豚',emoji:'🐬'});
 assert.deepEqual(chooseGuestNickname('private-member@domain.example',()=>0),{fullName:'爽朗的海豚',emoji:'🐬'});
 for(const invalid of [()=>Number.NaN,()=>Infinity,()=>-Infinity,()=>-1,()=>2]){
  const value=chooseGuestNickname(null,invalid);
  assert.ok(guestAdjectives.some(x=>value.fullName.startsWith(x)));
  assert.ok(guestAnimals.some(x=>value.fullName.endsWith(x.name)));
 }
});

test('previous display name, and no fingerprint or old login ID, is stored locally',async()=>{
 const storage=new Map();
 const writes=[];
 const api={getItem:async key=>storage.get(key)??null,
  setItem:async(key,value)=>{storage.set(key,value);writes.push([key,value]);}};
 const first=await loadGuestNickname(api,()=>0);
 const second=await loadGuestNickname(api,()=>0);
 assert.equal(first.fullName,'爽朗的海豚');
 assert.equal(second.fullName,'爽朗的獵鷹');
 assert.deepEqual(writes,[
  [GUEST_NICKNAME_KEY,'爽朗的海豚'],
  [GUEST_NICKNAME_KEY,'爽朗的獵鷹']
 ]);
 assert.equal(storage.size,1,'guest feature saves no other keys');
});

test('private-browsing storage failure still shows decorative name but never overwrites unknown prior data',async()=>{
 const writes=[];
 const inaccessible={getItem:async()=>{throw Error('unavailable');},
  setItem:async(k,v)=>{writes.push([k,v]);}};
 assert.deepEqual(await loadGuestNickname(inaccessible,()=>0),
  {fullName:'爽朗的海豚',emoji:'🐬'});
 assert.deepEqual(writes,[]);
 const readonly={getItem:async()=>null,setItem:async()=>{throw Error('readonly');}};
 assert.equal((await loadGuestNickname(readonly,()=>0)).fullName,'爽朗的海豚');
});

test('menu uses guest-only name and avatar without impersonating authenticated Starry ID',()=>{
 const ui=read('src/ui/echo/LegacyHeader.tsx');
 const nick=read('src/ui/echo/guestNickname.ts');
 assert.match(ui,/loadGuestNickname\(AsyncStorage\)/);
 assert.match(ui,/guestNickname\?\.emoji\?\?'♙'/);
 assert.match(ui,/guestNickname\?\.fullName\?\?'訪客'/);
 assert.match(ui,/訪客 · 本機暱稱，中央會員登入尚未開放/);
 assert.match(ui,/中央會員登入尚未開放"/);
 assert.doesNotMatch(nick,/sq_visitor_identity_v1|deviceId|localStorage|getCurrentUser|fetch\(|Authorization|\/api\/|D1|R2/);
 assert.doesNotMatch(ui,/router\.push\(['"]\/(?:admin|billing|private)/);
});
