import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseStarryMe} from '../src/auth/starryId/member.ts';
import {memberPublicUrl,memberInviteUrl} from '../src/auth/starryId/memberLinks.ts';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/starry-id/me.200.json',import.meta.url),'utf8'));
test('2026-11-07.18 GET /v1/me uses central initials, mutable member_no and a signed avatar',()=>{
 const me=parseStarryMe({...fixture,member_no:'TW0123456',profile:{...fixture.profile,initials:'小星',avatar_url:'/v1/me/avatar/signed.webp?exp=123&sig=test'}});
 assert.equal(me.memberNo,'TW0123456');
 assert.equal(me.initials,'小星');
 assert.equal(me.avatarUrl,'/v1/me/avatar/signed.webp?exp=123&sig=test');
 assert.equal(me.avatarPath,me.avatarUrl);
 assert.equal(memberPublicUrl(me.memberNo),'https://id.starry.phd/TW0123456');
 assert.equal(memberInviteUrl(me.memberNo),'https://id.starry.phd/Invite/TW0123456');
 assert.notEqual(me.memberNo,me.userId,'member number is not the immutable identity');
 assert.equal(Object.isFrozen(me),true);
});
test('changing member_no updates only public/invite URLs, preserving user_id and variable digit lengths',()=>{
 for(const digits of ['0123456','01234567','012345678','0123456789']){
  const num='TW'+digits;
  const changed=parseStarryMe({...fixture,member_no:num,profile:{...fixture.profile,initials:'AB'}});
  assert.equal(changed.userId,fixture.user_id);
  assert.equal(changed.memberNo,num);
  assert.equal(memberInviteUrl(changed.memberNo),'https://id.starry.phd/Invite/'+num);
 }
 for(const invalid of ['886-0123456','TW123456','tw0123456','TW12345678901','TW01234/../',fixture.user_id]){
  assert.equal(memberPublicUrl(invalid),null);
  assert.equal(memberInviteUrl(invalid),null);
  assert.equal(parseStarryMe({...fixture,member_no:invalid}).memberNo,null);
 }
});
test('avatar is never loaded from untrusted domains, credentials or fragments; never infer server initials',()=>{
 for(const url of ['https://evil.example/photo','//evil.example/photo','https://id.starry.phd.evil.example/photo',
  'http://id.starry.phd/photo','https://name:password@id.starry.phd/photo',
  'https://id.starry.phd/photo#malicious']){
  const me=parseStarryMe({...fixture,profile:{...fixture.profile,avatar_url:url,initials:'姓字'}});
  assert.equal(me.avatarUrl,null,url);
  assert.equal(me.avatarPath,null,url);
  assert.equal(me.initials,'姓字');
 }
 const legacy=parseStarryMe({...fixture,profile:{...fixture.profile,initials:undefined}});
 assert.equal(legacy.initials,'','do not guess the first initial from the name');
 assert.equal(legacy.memberNo,null,'do not guess member numbers');
 const full=parseStarryMe({...fixture,profile:{...fixture.profile,
  avatar_url:'https://id.starry.phd/v1/avatars/signed.webp?sig=abc',initials:'星'}});
 assert.equal(full.avatarUrl,'https://id.starry.phd/v1/avatars/signed.webp?sig=abc');
});
test('member numbers are never used as a key or filename in the Echo member UI',()=>{
 const source=readFileSync(new URL('../src/ui/echo/StarryMemberPanel.tsx',import.meta.url),'utf8');
 assert.doesNotMatch(source,/\bkey=\{member\.memberNo\}/);
 const provider=readFileSync(new URL('../src/auth/starryId/StarryIdProvider.tsx',import.meta.url),'utf8');
 assert.match(provider,/getFreshMemberNo/);
});

test('public preview, member UI and Battery errors keep fixed icon vocabulary',()=>{
 const paths=['worker/echoPreview.ts','worker/echoBatterySettings.ts','src/ui/echo/StarryMemberPanel.tsx','src/ui/echo/LegacyFilterToolbar.tsx'];
 const all=paths.map(path=>readFileSync(new URL('../'+path,import.meta.url),'utf8')).join('\n');
 assert.match(all,/🔋 普通電池/);
 assert.match(all,/⚛️ 量子電池/);
 assert.match(all,/🔋 繁星電池艙/);
 assert.match(all,/🔋 檢查繁星電池艙餘額/);
});

test('2026-11-08.3 shows only central shown_name and falls back to central initials',()=>{
 const shared={...fixture,profile:{...fixture.profile,display_name:'不公開的姓名',nickname:'不公開的暱稱',shown_name:'中央指定顯示名稱',initials:'周子'}};
 const me=parseStarryMe(shared);
 assert.equal(me.displayName,'中央指定顯示名稱');
 assert.equal(me.hasDisplayName,true);
 const hidden=parseStarryMe({...shared,profile:{...shared.profile,shown_name:null}});
 assert.equal(hidden.displayName,'周子');
 assert.equal(hidden.hasDisplayName,false);
 const missing=parseStarryMe({...shared,profile:{...shared.profile,shown_name:null,initials:''}});
 assert.equal(missing.displayName,'繁星會員');
 assert.throws(()=>parseStarryMe({...shared,profile:{...shared.profile,shown_name:5}}),/shown_name/);
});
test('2026-11-08.3 avatar cache uses image pathname, not expiring signatures or user ID',async()=>{
 const {starryAvatarCacheKey}=await import('../src/auth/starryId/avatarCache.ts');
 const original='/v1/avatars/x/photo-one.webp?exp=123&sig=a';
 const refresh='/v1/avatars/x/photo-one.webp?exp=456&sig=b';
 const changed='/v1/avatars/x/photo-two.webp?exp=789&sig=c';
 assert.equal(starryAvatarCacheKey(original),'/v1/avatars/x/photo-one.webp');
 assert.equal(starryAvatarCacheKey(refresh),starryAvatarCacheKey(original));
 assert.notEqual(starryAvatarCacheKey(changed),starryAvatarCacheKey(original));
 assert.equal(starryAvatarCacheKey('https://id.starry.phd/v1/avatars/abc.webp?sig=x'),'/v1/avatars/abc.webp');
 assert.equal(starryAvatarCacheKey('https://evil.example/abc.webp?sig=x'),null);
 const panel=readFileSync(new URL('../src/ui/echo/StarryMemberPanel.tsx',import.meta.url),'utf8');
 assert.match(panel,/from 'expo-image'/);
 assert.match(panel,/cacheKey:starryAvatarCacheKey\(member\.avatarUrl\)/);
 assert.match(panel,/key=\{starryAvatarCacheKey\(member\.avatarUrl\)\}/);
 assert.doesNotMatch(panel,/cacheKey:member\.userId/);
});
test('2026-11-08.3 battery bonus remains central: Echo reads actual API allowance without recalculating bonuses',()=>{
 const panel=readFileSync(new URL('../src/ui/echo/StarryMemberPanel.tsx',import.meta.url),'utf8');
 const provider=readFileSync(new URL('../src/auth/starryId/StarryIdProvider.tsx',import.meta.url),'utf8');
 assert.match(panel,/b\.allowance/);
 assert.match(panel,/b\.remaining/);
 assert.match(provider,/sdk\.getBatteryBalance\(\)/);
 assert.doesNotMatch(panel,/bonusMultiplier|visibilityMultiplier|publicFieldsBonus/);
 assert.doesNotMatch(provider,/bonusMultiplier|visibilityMultiplier|publicFieldsBonus/);
});

test('2026-11-08.3 a returning screen re-fetches the one-hour signed avatar, even when the route stays mounted',()=>{
 const panel=readFileSync(new URL('../src/ui/echo/StarryMemberPanel.tsx',import.meta.url),'utf8');
 const provider=readFileSync(new URL('../src/auth/starryId/StarryIdProvider.tsx',import.meta.url),'utf8');
 assert.match(panel,/useFocusEffect\(useCallback\(\(\)=>\{/);
 assert.match(panel,/current\.refreshMember\(\)/);
 assert.match(provider,/if\(next==='active'\)void refresh\(\)/);
 assert.doesNotMatch(panel,/refreshedOnEntry/);
});
