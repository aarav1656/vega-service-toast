import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildToast, MENU_TOAST, SIMPLE_TOAST, TOAST_TEMPLATES, startService, serviceUri, registerService, entryPointNames} from '../dist/index.js';

// Stand-ins for the SDK classes: what matters is which are built and with what.
class ToastKind {}
class AppLaunchTarget {
  constructor(appUri, title, iconUri) {
    Object.assign(this, {appUri, title, iconUri});
  }
}
const sdk = {ToastKind, AppLaunchTarget};

test('a toast with a launch target uses the menu template and carries the target', () => {
  const t = buildToast({title: 'T', description: 'D', iconUri: 'https://x/i.png', launchUri: 'pkg://a.b.main', launchTitle: 'Open'}, sdk);
  assert.equal(t.mChannel.name, MENU_TOAST);
  assert.equal(t.mChannel.name, 'MenuToastRenderTemplate');
  assert.ok(t.mChannel.kind instanceof ToastKind);
  assert.equal(t.mLaunchTargets.length, 1);
  assert.deepEqual({...t.mLaunchTargets[0]}, {appUri: 'pkg://a.b.main', title: 'Open', iconUri: 'not_used'});
  assert.equal(t.mTimeout, 8);
});

test('a toast without a launch target uses the simple template and no targets', () => {
  const t = buildToast({title: 'T', description: 'D', iconUri: 'https://x/i.png', seconds: 5}, sdk);
  assert.equal(t.mChannel.name, SIMPLE_TOAST);
  assert.equal(t.mChannel.name, 'SimpleToastRenderTemplate');
  assert.deepEqual(t.mLaunchTargets, []);
  assert.equal(t.mTimeout, 5);
});

test('the default channel is always a render template name, and a forced name is passed through untouched', () => {
  for (const o of [{}, {launchUri: 'pkg://a'}]) {
    assert.ok(TOAST_TEMPLATES.includes(buildToast({title: 't', description: 'd', iconUri: 'u', ...o}, sdk).mChannel.name));
  }
  assert.equal(buildToast({title: 't', description: 'd', iconUri: 'u', channel: 'NotATemplate'}, sdk).mChannel.name, 'NotATemplate');
  assert.ok(!TOAST_TEMPLATES.includes('NotATemplate'));
});

test('startService opens the service by its pkg:// URI', async () => {
  const opened = [];
  await startService('com.example.toast.service', {openURL: async u => opened.push(u)});
  assert.deepEqual(opened, ['pkg://com.example.toast.service']);
  assert.equal(serviceUri('a.b'), 'pkg://a.b');
});

test('registerService registers the two entry point names the runtime looks up, each returning its handler', async () => {
  const reg = new Map();
  const calls = [];
  registerService('com.example.toast.service', {onStart: async () => calls.push('start'), onStop: async () => calls.push('stop')}, {registerHeadlessEntryPoint2: (n, f) => reg.set(n, f)});
  assert.deepEqual([...reg.keys()].sort(), ['com.example.toast.service::onStartService', 'com.example.toast.service::onStopService']);
  assert.deepEqual(entryPointNames('x.y'), {start: 'x.y::onStartService', stop: 'x.y::onStopService'});
  await reg.get('com.example.toast.service::onStartService')()();
  await reg.get('com.example.toast.service::onStopService')()();
  assert.deepEqual(calls, ['start', 'stop']);
});
