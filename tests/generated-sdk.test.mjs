import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
test('OpenAPI client is actually generated from the checked in v1.0 spec',()=>{
 const file=new URL('../packages/echo-api-sdk/src/generated.ts',import.meta.url);
 assert.equal(existsSync(file),true);
 const generated=readFileSync(file,'utf8');
 assert.match(generated,/export interface paths/);
 assert.match(generated,/\/api\/v1\/catalog/);
 assert.match(generated,/\/api\/v1\/health/);
 assert.match(generated,/\/api\/v1\/speakers/);
 assert.match(generated,/\/api\/v1\/tracks\/\{id\}/);
});
