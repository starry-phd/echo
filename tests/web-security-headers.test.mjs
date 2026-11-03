import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CSP_DIRECTIVES,FIXED_HEADERS,INLINE_SCRIPT_HASHES,STARRY_ID_ORIGINS,WEB_CSP_MODE,cspDirectivesFor,headersFileFor,headersFileRules,parseCsp,resolveStarryOrigin,validateSecurityHeaders} from '../scripts/web-security-headers.mjs';
import {cspScriptHash,extractInlineScripts} from '../scripts/check-inline-scripts.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const rules=headersFileRules(read('public/_headers'));
const all=rules.get('/*');

test('_headers ships one /* block whose values pass the same validator the Production smoke uses',()=>{
 assert.deepEqual([...rules.keys()],['/*']);
 assert.deepEqual(validateSecurityHeaders(name=>all.get(name)??null,WEB_CSP_MODE),{mode:WEB_CSP_MODE,directives:14});
 const cspHeader=WEB_CSP_MODE==='enforce'?'content-security-policy':'content-security-policy-report-only';
 assert.ok(all.has(cspHeader));
});

test('CSP allows only this origin for scripts, data and frames; no third-party, no eval, no embedding',()=>{
 const csp=parseCsp(all.get('content-security-policy-report-only')??all.get('content-security-policy'));
 assert.deepEqual(csp.get('script-src'),["'self'",...INLINE_SCRIPT_HASHES]);
 assert.ok(INLINE_SCRIPT_HASHES.every(h=>/^'sha256-[A-Za-z0-9+/]{43}='$/.test(h)));
 assert.deepEqual(csp.get('connect-src'),["'self'"]);
 assert.deepEqual(csp.get('frame-ancestors'),["'none'"]);
 assert.deepEqual(csp.get('object-src'),["'none'"]);
 const text=[...csp.values()].flat().join(' ');
 assert.doesNotMatch(text,/unsafe-eval|https?:|\*/);
 assert.equal(FIXED_HEADERS['x-frame-options'],'DENY');
 assert.equal(Object.keys(CSP_DIRECTIVES).length,14);
});

test('validator rejects missing, weakened, duplicated or wrong-mode headers',()=>{
 const get=(over={})=>name=>(name in over?over[name]:all.get(name))??null;
 const cspName=WEB_CSP_MODE==='enforce'?'content-security-policy':'content-security-policy-report-only';
 const otherName=WEB_CSP_MODE==='enforce'?'content-security-policy-report-only':'content-security-policy';
 assert.throws(()=>validateSecurityHeaders(get({[cspName]:null}),WEB_CSP_MODE),/Missing/);
 assert.throws(()=>validateSecurityHeaders(get({[cspName]:all.get(cspName).replace("script-src 'self'","script-src 'self' https://evil.example")}),WEB_CSP_MODE),/script-src/);
 assert.throws(()=>validateSecurityHeaders(get({[cspName]:all.get(cspName)+"; script-src 'self'"}),WEB_CSP_MODE),/Duplicate/);
 assert.throws(()=>validateSecurityHeaders(get({[cspName]:all.get(cspName)+"; report-uri https://x"}),WEB_CSP_MODE),/Unexpected CSP directive/);
 assert.throws(()=>validateSecurityHeaders(get({[otherName]:'default-src *'}),WEB_CSP_MODE),/Unexpected/);
 assert.throws(()=>validateSecurityHeaders(get({'x-content-type-options':null}),WEB_CSP_MODE),/nosniff/);
 assert.throws(()=>validateSecurityHeaders(get({'x-frame-options':'SAMEORIGIN'}),WEB_CSP_MODE),/DENY/);
});

test('shipping is verified: CI compares dist/_headers, Production smoke checks / and /privacy, visual check reports violations',()=>{
 const ci=read('.github/workflows/ci.yml');
 assert.ok(ci.indexOf('run: cmp public/_headers dist/_headers')>ci.indexOf('run: npm run build:web'));
 const smoke=read('scripts/check-production-guest.mjs');
 assert.match(smoke,/for\(const path of \['\/','\/privacy'\]\)/);
 assert.match(smoke,/validateSecurityHeaders\(name=>r\.headers\.get\(name\),WEB_CSP_MODE,resolveStarryOrigin\(process\.env\.EXPO_PUBLIC_STARRY_ID_API_BASE_URL\)\)/);
 const visual=read('scripts/visual-check-production.mjs');
 assert.match(visual,/securitypolicyviolation/);
 assert.match(visual,/CSP violations='\+cspViolations/);
});

test('public/_headers is exactly the generated guest file; build:web regenerates dist/_headers for the build',()=>{
 assert.equal(read('public/_headers'),headersFileFor(null));
 assert.match(JSON.parse(read('package.json')).scripts['build:web'],/^expo export --platform web && node scripts\/write-web-headers\.mjs dist$/);
 const env=read('src/auth/starryId/env.ts');
 for(const origin of STARRY_ID_ORIGINS)assert.ok(env.includes("baseUrl:'"+origin+"'"),origin);
 assert.equal(STARRY_ID_ORIGINS.length,2);
});

test('sign-in build adds only Google/Apple login and Starry ID sources; anything else fails the build',()=>{
 assert.equal(resolveStarryOrigin(undefined),null);
 assert.equal(resolveStarryOrigin(''),null);
 assert.equal(resolveStarryOrigin('https://id.starry.phd/'),'https://id.starry.phd');
 for(const bad of ['https://evil.example','http://id.starry.phd','https://echo.starry.phd'])assert.throws(()=>resolveStarryOrigin(bad),/allow-listed/);
 const d=cspDirectivesFor('https://id.starry.phd');
 assert.deepEqual(d['script-src'],["'self'",...INLINE_SCRIPT_HASHES,'https://accounts.google.com/gsi/client','https://appleid.cdn-apple.com']);
 assert.deepEqual(d['frame-src'],['https://accounts.google.com/gsi/']);
 assert.deepEqual(d['connect-src'],["'self'",'https://accounts.google.com/gsi/','https://id.starry.phd']);
 assert.deepEqual(d['img-src'],["'self'",'data:','blob:','https://id.starry.phd']);
 assert.deepEqual(d['frame-ancestors'],["'none'"]);
 assert.deepEqual(cspDirectivesFor(null),CSP_DIRECTIVES,'guest build unchanged');
 const rules=headersFileRules(headersFileFor('https://id.starry.phd')).get('/*');
 assert.deepEqual(validateSecurityHeaders(n=>rules.get(n)??null,'enforce','https://id.starry.phd'),{mode:'enforce',directives:14});
 assert.throws(()=>validateSecurityHeaders(n=>rules.get(n)??null,'enforce',null),/script-src/,'guest validator rejects the login CSP');
 const smoke=read('scripts/check-production-guest.mjs');
 assert.match(smoke,/resolveStarryOrigin\(process\.env\.EXPO_PUBLIC_STARRY_ID_API_BASE_URL\)/);
});
