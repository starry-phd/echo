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

test('production guard permits only green main CI auto-release or explicit manual dispatch', () => {
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
  ['reject auto release triggered by PR CI instead of a main push', () => ({
    release: source.release.replace("github.event.workflow_run.event == 'push'", "github.event.workflow_run.event == 'pull_request'"),
  })],
  ['reject auto release without successful CI', () => ({
    release: source.release.replace("github.event.workflow_run.conclusion == 'success'", "github.event.workflow_run.conclusion != 'failure'"),
  })],
  ['reject auto release from non-main branches', () => ({
    release: source.release.replace("github.event.workflow_run.head_branch == 'main'", "github.event.workflow_run.head_branch != 'blocked'"),
  })],
  ['reject untrusted cross-repo CI as a deploy trigger', () => ({
    release: source.release.replace("github.event.workflow_run.head_repository.full_name == github.repository", "github.event.workflow_run.head_repository.full_name != github.repository"),
  })],
  ['reject floating main checkout instead of tested SHA pin', () => ({
    release: source.release.replace('ref: ${{ env.RELEASE_COMMIT_SHA }}', 'ref: main'),
  })],
  ['reject skipping the main CI source repository guard in the job', () => ({
    release: source.release.replace('[ "$RELEASE_CI_REPOSITORY" != "$GITHUB_REPOSITORY" ]', '[ "$RELEASE_CI_REPOSITORY" != "unrelated" ]'),
  })],
  ['reject removing mandatory public media 404 smoke test', () => ({
    release: source.release.replace('node scripts/check-production-guest.mjs', 'echo skipped'),
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
    release: source.release.replace('name: Revalidate current main against the tested or approved SHA before upload', 'name: Skip the second SHA verification'),
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
