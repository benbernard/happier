import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

test('apps/stack package.json routes package aliases through their canonical entrypoints', async () => {
  const scriptsDir = dirname(fileURLToPath(import.meta.url));
  const packageRoot = dirname(scriptsDir);

  const raw = await readFile(join(packageRoot, 'package.json'), 'utf-8');
  const pkg = JSON.parse(raw);
  const scripts = pkg?.scripts ?? {};

  for (const key of ['ui:tauri', 'tauri:dev', 'mobile:ios', 'mobile:ios:release', 'mobile:ios:profile', 'mobile:install']) {
    assert.equal(typeof scripts[key], 'string', `${key} should remain defined`);
    assert.match(scripts[key], /android-only-build-guard/, `${key} should be disabled`);
  }
  assert.match(scripts['ui:tauri'], /tauri_dev\.mjs/);
  assert.match(scripts['mobile:ios'], /mobile\.mjs --run-ios/);
  assert.match(scripts['mobile:prebuild'], /--platform=android/);
  assert.equal(scripts.happier, 'node ./bin/happier.mjs');
  assert.equal(scripts.stack, 'node ./bin/hstack.mjs stack');
});
