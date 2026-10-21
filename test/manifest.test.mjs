import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {checkManifest} from '../dist/index.js';

const good = readFileSync(new URL('../example/manifest.toml', import.meta.url), 'utf8');
const ID = 'com.example.toast.service';

test('the example manifest carries the whole block', () => {
  assert.deepEqual(checkManifest(good, ID), []);
});

test('the template block, filled in, passes too', () => {
  const t = readFileSync(new URL('../templates/manifest-service.toml', import.meta.url), 'utf8');
  assert.deepEqual(checkManifest(t, 'com.example.app.toast.service'), []);
});

// Every piece, removed on its own, must be reported: a checker that passes a broken manifest proves nothing.
const cut = [
  ['component', /\[\[components\.service\]\][\s\S]*?launch-type = "singleton"\n\n/, '[[components.service]]'],
  ['wants.service', /\[\[wants\.service\]\]\nid = "[^"]+"\n\n/, '[[wants.service]]'],
  ['offers.service', /\[offers\]\n\[\[offers\.service\]\]\nid = "[^"]+"\n\n/, '[[offers.service]]'],
  ['post privilege', /\[\[wants\.privilege\]\]\nid = "[^"]+"\n\n/, 'notification.privilege.post'],
  ['headless module', /\[\[needs\.module\]\]\nid = "\/com\.amazon\.kepler\.headless_task_manager_1@[^"]+"\n\n/, 'headless task manager'],
  ['process group', /\[\[processes\.group\]\]\nid = "toast_service"\ncomponent-ids = \["[^"]+"\]\n\n/, 'processes.group'],
];
for (const [name, rx, expect] of cut) {
  test(`reports a manifest without the ${name}`, () => {
    assert.match(good, rx, 'the cut must match the example, else this test proves nothing');
    const problems = checkManifest(good.replace(rx, ''), ID);
    assert.ok(problems.length >= 1, `nothing reported for ${name}`);
    assert.ok(problems.some(p => p.includes(expect)), `${name}: got ${JSON.stringify(problems)}`);
  });
}

test('a service id that is not in the manifest is reported, never silently accepted', () => {
  assert.ok(checkManifest(good, 'com.example.other.service').length >= 4);
});

test('the CLI exits 0 on the example and 1 with the missing pieces named on a broken manifest', () => {
  const bin = new URL('../bin/vega-service-toast.mjs', import.meta.url).pathname;
  const ok = spawnSync('node', [bin, 'check', new URL('../example/manifest.toml', import.meta.url).pathname, ID], {encoding: 'utf8'});
  assert.equal(ok.status, 0, ok.stderr);
  const broken = join(mkdtempSync(join(tmpdir(), 'vst-')), 'manifest.toml');
  writeFileSync(broken, good.replace(/\[\[wants\.privilege\]\]\nid = "[^"]+"\n\n/, ''));
  const bad = spawnSync('node', [bin, 'check', broken, ID], {encoding: 'utf8'});
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /com\.amazon\.notification\.privilege\.post/);
});
