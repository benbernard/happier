import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(here);

function readScripts(relativePackagePath) {
  return JSON.parse(readFileSync(join(repoRoot, relativePackagePath), 'utf8')).scripts ?? {};
}

function assertDisabled(scripts, key) {
  assert.equal(typeof scripts[key], 'string', `${key} should remain defined`);
  assert.match(scripts[key], /android-only-build-guard/, `${key} should be disabled`);
}

test('the Android-only guard exits non-zero with a clear message', () => {
  const result = spawnSync(process.execPath, [join(repoRoot, 'scripts', 'android-only-build-guard.mjs'), 'docs-build'], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /docs-build/);
  assert.match(result.stderr, /only Android phone builds/i);
});

test('iOS and desktop app scripts remain defined but disabled', () => {
  const ui = readScripts('apps/ui/package.json');
  for (const key of ['ios', 'ios:dev', 'ios:preview', 'ios:production', 'submit', 'tauri:build:production', 'tauri:prepare:dev']) {
    assertDisabled(ui, key);
  }
  assert.equal(ui.android.includes('android-only-build-guard'), false);

  const stack = readScripts('apps/stack/package.json');
  for (const key of ['mobile:ios', 'mobile:install', 'ui:tauri', 'tauri:dev']) {
    assertDisabled(stack, key);
  }
  assert.equal(stack['mobile:prebuild'].includes('--platform=android'), true);
});

test('CLI, server, and docs builds remain defined but disabled', () => {
  assertDisabled(readScripts('apps/cli/package.json'), 'build');
  assertDisabled(readScripts('apps/server/package.json'), 'build');
  assertDisabled(readScripts('apps/server/package.json'), 'build:runtime');
  assertDisabled(readScripts('apps/docs/package.json'), 'build');
});

test('website, stack, and bootstrap builds remain defined but disabled', () => {
  const website = readScripts('apps/website/package.json');
  for (const key of ['build', 'build:client', 'build:server', 'prerender']) {
    assertDisabled(website, key);
  }

  assertDisabled(readScripts('apps/stack/package.json'), 'build');

  const bootstrap = readScripts('apps/bootstrap/package.json');
  for (const key of ['build', 'build:binary']) {
    assertDisabled(bootstrap, key);
  }
});
