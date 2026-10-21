#!/usr/bin/env node
// vega-service-toast check <manifest.toml> <service-id>
import {readFileSync} from 'node:fs';
import {checkManifest} from '../dist/manifest.js';

const [cmd, file, serviceId] = process.argv.slice(2);
if (cmd !== 'check' || !file || !serviceId) {
  console.error('usage: vega-service-toast check <manifest.toml> <service-id>');
  process.exit(2);
}
const problems = checkManifest(readFileSync(file, 'utf8'), serviceId);
if (problems.length) {
  for (const p of problems) console.error(`missing: ${p}`);
  process.exit(1);
}
console.log(`${file}: service ${serviceId} carries the whole toast block`);
