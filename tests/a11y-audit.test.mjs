import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const script=read('scripts/a11y-audit-production.mjs');
const workflow=read('.github/workflows/visual-check.yml');

test('a11y audit: pinned production origin, read-only, axe only in its own CSP-bypassing test context',()=>{
 assert.match(script,/const PRODUCTION='https:\/\/echo-starry\.starry-phd\.workers\.dev';/);
 assert.match(script,/throw Error\('Unexpected a11y-audit origin'\)/);
 assert.match(script,/bypassCSP:true/);
 assert.match(script,/values:\['wcag2a','wcag2aa','wcag21a','wcag21aa'\]/);
 assert.doesNotMatch(script,/method:\s*['"](POST|PUT|PATCH|DELETE)/i);
 assert.doesNotMatch(script,/\/stream|token/i);
 for(const p of ["'/profile'","'/privacy'","'/stats'","'/favorites'","'/notifications'","'menu-open'","'home-dark'"])assert.ok(script.includes(p),p);
});

test('workflow installs pinned axe-core next to Playwright and runs the audit with an explicit fail threshold',()=>{
 assert.match(workflow,/npm install --no-audit --no-fund playwright@\d+\.\d+\.\d+ axe-core@\d+\.\d+\.\d+/);
 assert.match(workflow,/run: node a11y-audit-production\.mjs/);
 assert.match(workflow,/cp scripts\/visual-check-production\.mjs scripts\/a11y-audit-production\.mjs scripts\/a11y-summary\.mjs \/tmp\/echo-visual\//);
 assert.match(workflow,/ECHO_A11Y_FAIL_ON: (none|minor|moderate|serious|critical)\n/);
 assert.doesNotMatch(workflow,/:\s*write\b/);
});

test('threshold logic',async()=>{
 const {summarizeViolations,failsThreshold}=await import('../scripts/a11y-summary.mjs');
 const s=summarizeViolations([{id:'b',impact:'moderate',help:'',nodes:[{target:['x']}]},{id:'a',impact:'critical',help:'',nodes:[]}]);
 assert.deepEqual(s.map(v=>v.id),['a','b']);
 assert.equal(failsThreshold(s,'none'),false);
 assert.equal(failsThreshold(s,'critical'),true);
 assert.equal(failsThreshold(summarizeViolations([{id:'b',impact:'moderate',help:'',nodes:[]}]),'serious'),false);
 assert.throws(()=>failsThreshold(s,'loud'));
});
