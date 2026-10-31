import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const canonical='https://echo.starry.phd';
const technical='https://echo-starry.starry-phd.workers.dev';

test('Wrangler provisions the user-approved custom domain without replacing the original Worker',()=>{
 const config=read('wrangler.toml');
 assert.match(config,/name = "echo-starry"/);
 assert.match(config,/\[\[routes\]\][\s\S]*?pattern = "echo\.starry\.phd"[\s\S]*?custom_domain = true/);
 assert.match(config,/\[assets\]/);
 assert.match(config,/binding = "DB"/);
 assert.match(config,/binding = "MEDIA"/);
});

test('production workflow and guest smoke verify only the canonical domain',()=>{
 const workflow=read('.github/workflows/deploy-worker.yml');
 const guest=read('scripts/check-production-guest.mjs');
 assert.ok(workflow.includes('ECHO_URL: '+canonical));
 assert.equal(workflow.includes('ECHO_URL: '+technical),false);
 assert.ok(guest.includes("const allowed='"+canonical+"'"));
 assert.ok(guest.includes("process.env.ECHO_URL||'"+canonical+"'"));
 assert.equal(guest.includes(technical),false);
 assert.match(workflow,/HTTP smoke test - homepage, API and private-media refusal/);
 assert.match(workflow,/HTTP smoke test - 28 guest portraits are nonplayable/);
 assert.match(guest,/validateRefusal\(r.status,r.headers,'listed guest private stream'\)/);
});

test('Web shares current same-origin public pages and Worker permits the canonical origin',()=>{
 const client=read('src/api/client.ts');
 const worker=read('worker/index.ts');
 assert.match(client,/window\.location\.origin/);
 assert.ok(worker.includes(canonical));
 assert.ok(read('tests/legacy-verified-detail-sharing.test.mjs').includes(canonical+'/track/'));
 assert.ok(read('tests/legacy-approved-public-png-export.test.mjs').includes(canonical+'/track/'));
 assert.ok(read('docs/AI_HANDOFF.md').includes('正式唯一主網址'));
});
