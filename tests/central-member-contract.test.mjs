import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCentralMemberMe} from '../src/auth/centralMemberContract.ts';
import {getCentralMemberProfile} from '../src/auth/centralMember.ts';

const canonical=()=>({
 s_user_id:'starry_opaque_abc123',
 display_name:'測試會員',
 directory_opt_in:false,
 display_name_public:false,
 profile_revision:1
});

test('Starry member profile accepts exactly the canonical five verified-API DTO fields',()=>{
 const p=parseCentralMemberMe(canonical());
 assert.deepEqual(p,canonical());
 assert.equal(Object.isFrozen(p),true);
 assert.equal(p.directory_opt_in,false);
 assert.equal(p.display_name_public,false);
});

test('reject old Echo and H-Global member shapes, email keys and extra PII',()=>{
 const valid=canonical();
 for(const candidate of [
  {...valid,email:'user@example.test'},
  {...valid,phone:'0123456789'},
  {...valid,userId:valid.s_user_id},
  {...valid,s_user_id:'someone@example.test'},
  {...valid,s_user_id:' starry_opaque_abc123'},
  {...valid,profile_revision:0},
  {...valid,profile_revision:Number.MAX_SAFE_INTEGER},
  {...valid,profile_revision:1.5},
  {...valid,directory_opt_in:'true'},
  {...valid,display_name_public:1},
  {...valid,display_name:''},
  [],
  null,
  'test'
 ])assert.throws(()=>parseCentralMemberMe(candidate));
});

test('directory opt-in and public display flags are separate explicit privacy decisions',()=>{
 const p=parseCentralMemberMe({...canonical(),directory_opt_in:true,display_name_public:false,profile_revision:19});
 assert.equal(p.directory_opt_in,true);
 assert.equal(p.display_name_public,false);
 assert.equal(p.profile_revision,19);
});

test('no fake successful profile while central authority is not deployed',async()=>{
 await assert.rejects(getCentralMemberProfile(),/尚未正式發布/);
});
