import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const script=read('scripts/a11y-audit-production.mjs');
const workflow=read('.github/workflows/visual-check.yml');

test('a11y audit: pinned production origin, read-only, axe only in its own CSP-bypassing test context',()=>{
 assert.match(script,/const PRODUCTION='https:\/\/echo\.starry\.phd';/);
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

test('first a11y baseline fixes: page title, aria-checked checkboxes, slider values, focusable privacy scroll',()=>{
 assert.match(read('app/+html.tsx'),/<title>繁星回聲｜演講資訊與知識收藏<\/title>/);
 const header=read('src/ui/echo/LegacyHeader.tsx');
 assert.match(header,/accessibilityRole="checkbox"[\s\S]{0,260}aria-checked=\{chosenQuickActions\.includes\(id\)\}/);
 const tutorial=read('src/ui/echo/LegacyGuestTutorial.tsx');
 assert.equal((tutorial.match(/aria-checked=\{neverAgain\}/g)||[]).length,2);
 assert.equal((tutorial.match(/accessibilityRole="checkbox"/g)||[]).length,2);
 const timeline=read('src/ui/echo/LegacyPlaybackTimeline.tsx');
 assert.match(timeline,/aria-valuemin=\{0\} aria-valuemax=\{Math\.ceil\(safeDuration\)\} aria-valuenow=\{Math\.floor\(shown\)\}/);
 assert.match(read('app/privacy.tsx'),/<ScrollView focusable accessibilityLabel="隱私權政策全文"/);
 // Every checkbox in the app exposes aria-checked for react-native-web 0.21+.
 for(const file of ['src/ui/echo/LegacyHeader.tsx','src/ui/echo/LegacyGuestTutorial.tsx']){
  const src=read(file);
  assert.equal((src.match(/accessibilityRole="checkbox"/g)||[]).length,(src.match(/aria-checked=/g)||[]).length,file);
 }
});

test('contrast details are summarised for targeted colour fixes',async()=>{
 const {summarizeViolations}=await import('../scripts/a11y-summary.mjs');
 const [v]=summarizeViolations([{id:'color-contrast',impact:'serious',help:'',nodes:[{target:['#x'],html:'A＋',
  contrast:{fg:'#c13f6f',bg:'#f9ebf0',ratio:4.35,expected:'4.5:1',size:'9.0pt (12px)',weight:'bold'}}]}]);
 assert.deepEqual(v.contrast,['"A＋" #c13f6f on #f9ebf0 = 4.35 (needs 4.5:1, 9.0pt (12px) bold)']);
});
