import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('private audio audit detects corruption, constrains destinations and redacts failures',()=>{
 const result=spawnSync('python3',['-m','unittest','discover','-s','tests','-p','private_audio_audit_test.py'],{
  cwd:new URL('../',import.meta.url),encoding:'utf8',timeout:30_000
 });
 assert.equal(result.status,0,result.stderr||result.error?.message);
});
