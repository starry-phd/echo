import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const repoRoot = new URL('../', import.meta.url);
const source = {
  guard: readFileSync(new URL('../scripts/check-release-safety.mjs', import.meta.url), 'utf8'),
  release: readFileSync(new URL('../.github/workflows/deploy-worker.yml', import.meta.url), 'utf8'),
  probe: readFileSync(new URL('../.github/workflows/probe-r2.yml', import.meta.url), 'utf8'),
  audit: readFileSync(new URL('../.github/workflows/audit-private-audio.yml', import.meta.url), 'utf8'),
  manifest: readFileSync(new URL('../starry.app.json', import.meta.url), 'utf8'),
};

function runGate(override = {}) {
  const temp = mkdtempSync(join(tmpdir(), 'echo-release-guard-'));
  try {
    mkdirSync(join(temp, 'scripts'), {recursive: true});
    mkdirSync(join(temp, '.github', 'workflows'), {recursive: true});
    writeFileSync(join(temp, 'scripts', 'check-release-safety.mjs'), source.guard);
    writeFileSync(join(temp, '.github', 'workflows', 'deploy-worker.yml'), override.release ?? source.release);
    writeFileSync(join(temp, '.github', 'workflows', 'probe-r2.yml'), override.probe ?? source.probe);
    writeFileSync(join(temp, '.github', 'workflows', 'audit-private-audio.yml'), override.audit ?? source.audit);
    writeFileSync(join(temp, 'starry.app.json'), override.manifest ?? source.manifest);
    return spawnSync(process.execPath, [join(temp, 'scripts', 'check-release-safety.mjs')], {
      encoding: 'utf8',
      timeout: 10000,
    });
  } finally {
    rmSync(temp, {recursive: true, force: true});
  }
}

test('production guard passes the approved, non-deploying workflow', () => {
  const result = runGate();
  assert.equal(result.status, 0, result.stderr || result.error?.message);
});

const cases = [
  ['reject automatic triggering of the full private audio audit', () => ({
    audit: source.audit.replace('  workflow_dispatch:\n','  push:\n  workflow_dispatch:\n'),
  })],
  ['reject uploading temporary private media instead of the aggregate report', () => ({
    audit: source.audit.replace('path: /tmp/echo-private-audio-audit-summary.json','path: /tmp/'),
  })],
  ['reject an automatic push deployment trigger', () => ({
    release: source.release.replace('  workflow_dispatch:\n', '  workflow_dispatch:\n  push:\n    branches: [main]\n'),
  })],
  ['reject an extra workflow_call entry point', () => ({
    release: source.release.replace('  workflow_dispatch:\n', '  workflow_dispatch:\n  workflow_call:\n'),
  })],
  ['reject automatic triggering of private R2 sampling', () => ({
    probe: source.probe.replace('  workflow_dispatch:\n', '  workflow_dispatch:\n  schedule:\n    - cron: "0 0 * * *"\n'),
  })],
  ['reject removal of the production Environment', () => ({
    release: source.release.replace('    environment: production\n', ''),
  })],
  ['reject removal of the lifecycle permission check', () => ({
    release: source.release.replace('productionAuthorized!==true', 'productionAuthorized!==false'),
  })],
  ['reject removal of the second, late remote-main SHA verification', () => ({
    release: source.release.replace('name: Revalidate current main against the approved SHA before upload', 'name: Skip the second SHA verification'),
  })],
  ['reject activation of advertising requests', () => {
    const manifest = JSON.parse(source.manifest);
    manifest.monetization.adRequestsEnabled = true;
    return {manifest: JSON.stringify(manifest)};
  }],
];

for (const [name, mutate] of cases) {
  test(name, () => {
    const result = runGate(mutate());
    assert.notEqual(result.status, 0, 'Unsafe release change was accepted by release:guard');
    assert.match(result.stderr || '', /AssertionError/);
  });
}
