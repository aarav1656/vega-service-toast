// Break the recipe's guards one at a time on the built output, confirm the tests go red, restore, confirm green.
import {readFileSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const mutations = [
  ['dist/toast.js', 'menu template name wrong', "'MenuToastRenderTemplate'", "'MenuToast'"],
  ['dist/toast.js', 'simple template name wrong', "'SimpleToastRenderTemplate'", "'SimpleToast'"],
  ['dist/toast.js', 'launch target dropped', 'menu ? [new sdk.AppLaunchTarget', 'false ? [new sdk.AppLaunchTarget'],
  ['dist/toast.js', 'forced channel ignored', 'opts.channel ?? (menu', '(menu'],
  ['dist/service.js', 'service uri scheme wrong', '`pkg://${serviceId}`', '`app://${serviceId}`'],
  ['dist/service.js', 'stop entry point never registered', 'registry.registerHeadlessEntryPoint2(names.stop, () => handlers.onStop);', ''],
  ['dist/service.js', 'entry point suffix wrong', 'start: `${serviceId}::onStartService`', 'start: `${serviceId}::onStart`'],
  ['dist/manifest.js', 'wants.service unchecked', "if (!ids(m.wants?.service).includes(serviceId))", 'if (false)'],
  ['dist/manifest.js', 'privilege unchecked', 'if (!ids(m.wants?.privilege).includes(POST_PRIVILEGE))', 'if (false)'],
  ['dist/manifest.js', 'headless module unchecked', 'if (!ids(m.needs?.module).some(id => id.startsWith(HEADLESS_MODULE_PREFIX)))', 'if (false)'],
  ['dist/manifest.js', 'process group unchecked', 'if (!grouped)', 'if (false)'],
  ['dist/manifest.js', 'component unchecked', 'if (!ids(m.components?.service).includes(serviceId))', 'if (false)'],
  ['dist/manifest.js', 'offers unchecked', 'if (!ids(m.offers?.service).includes(serviceId))', 'if (false)'],
];
const run = () => spawnSync('node', ['--test', '--test-timeout=15000', 'test/toast.test.mjs', 'test/manifest.test.mjs'], {cwd: root, encoding: 'utf8', timeout: 60000}).status;
const originals = new Map();
const restore = () => { for (const [p, s] of originals) writeFileSync(p, s); };
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { restore(); process.exit(130); });
let bad = 0;
try {
  console.log('baseline', run() === 0 ? 'green' : 'RED');
  for (const [file, name, from, to] of mutations) {
    const path = root + file;
    if (!originals.has(path)) originals.set(path, readFileSync(path, 'utf8'));
    const src = originals.get(path);
    if (!src.includes(from)) throw new Error(`mutation "${name}" no longer matches ${file}`);
    writeFileSync(path, src.replace(from, to));
    const red = run() !== 0;
    writeFileSync(path, src);
    console.log(`${name}: ${red ? 'red (caught)' : 'GREEN (missed)'}`);
    if (!red) bad++;
  }
} finally {
  restore();
}
console.log('restored', run() === 0 ? 'green' : 'RED');
process.exit(bad ? 1 : 0);
