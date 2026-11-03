import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CSP_DIRECTIVES,FIXED_HEADERS,INLINE_SCRIPT_HASHES,WEB_CSP_MODE,headersFileRules,parseCsp,validateSecurityHeaders} from '../scripts/web-security-headers.mjs';
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
 assert.match(smoke,/validateSecurityHeaders\(name=>r\.headers\.get\(name\),WEB_CSP_MODE\)/);
 const visual=read('scripts/visual-check-production.mjs');
 assert.match(visual,/securitypolicyviolation/);
 assert.match(visual,/CSP violations='\+cspViolations/);
});

test('Starry ID sign-in cannot be switched on while the CSP would block Google/Apple login scripts',()=>{
 const configured=['.github/workflows/ci.yml','.github/workflows/deploy-worker.yml','eas.json']
  .some(file=>read(file).includes('EXPO_PUBLIC_STARRY_ID_API_BASE_URL'));
 const script=parseCsp(all.get('content-security-policy-report-only')??all.get('content-security-policy')).get('script-src');
 if(configured)assert.ok(script.includes('https://accounts.google.com')&&script.includes('https://appleid.cdn-apple.com'),
  'add the Google/Apple login origins to the CSP before enabling Starry ID');
 else assert.deepEqual(script,["'self'",...INLINE_SCRIPT_HASHES]);
});

test('inline script scanner: only executable inline scripts count; Expo hydration flag hash is exact',()=>{
 const html='<script src="/_expo/a.js" defer></script><script type="application/json">{"x":1}</script>'
  +'<script>globalThis.__EXPO_ROUTER_HYDRATE__=true;</script><script type="module">import "/b.js"</script>';
 assert.deepEqual(extractInlineScripts(html),['globalThis.__EXPO_ROUTER_HYDRATE__=true;','import "/b.js"']);
 assert.equal(cspScriptHash('globalThis.__EXPO_ROUTER_HYDRATE__=true;'),INLINE_SCRIPT_HASHES[0]);
 assert.equal(INLINE_SCRIPT_HASHES.length,1);
 const ci=read('.github/workflows/ci.yml');
 assert.ok(ci.indexOf('run: node scripts/check-inline-scripts.mjs dist')>ci.indexOf('run: npm run build:web'));
});
