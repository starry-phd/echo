import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const c=JSON.parse(readFileSync(new URL('../openapi/echo-public.v1.json',import.meta.url),'utf8'));
const expected=['/api/v1/health','/api/v1/categories','/api/v1/catalog','/api/v1/tracks/{id}','/api/v1/tracks/{id}/stream'];
assert.match(c.openapi,/^3\.[01]\./);
assert.equal(c.info.version,'1.0.0');
assert.deepEqual(Object.keys(c.paths).sort(),expected.sort());
for(const route of expected){assert.ok(c.paths[route].get.operationId);assert.deepEqual(c.paths[route].get.security,[]);assert.ok(c.paths[route].get.responses['200']);}
console.log('OpenAPI validated for 4 versioned public endpoints.');
