import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';

test('Starry ID client types are generated from the checked-in official OpenAPI 3.1',()=>{
 const spec=JSON.parse(readFileSync(new URL('../openapi/starry-id.v1.json',import.meta.url),'utf8'));
 assert.equal(spec.openapi,'3.1.0');
 assert.ok(spec.paths['/v1/auth/nonce']);
 assert.ok(spec.paths['/v1/me/battery']);
 assert.ok(spec.paths['/v1/battery/reservations']);
 const path=new URL('../packages/starry-id-sdk/src/generated.ts',import.meta.url);
 assert.equal(existsSync(path),true,'Run npm install (postinstall codegen) before tests');
 const source=readFileSync(path,'utf8');
 assert.match(source,/export interface paths/);
 assert.match(source,/\/v1\/me\/battery/);
 assert.match(source,/\/v1\/battery\/reservations/);
 assert.match(readFileSync(new URL('../scripts/run-isolated-openapi-generator.mjs',import.meta.url),'utf8'),/openapi\/starry-id\.v1\.json/);
});
