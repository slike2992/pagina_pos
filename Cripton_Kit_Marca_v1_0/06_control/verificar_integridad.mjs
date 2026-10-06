import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const digest = async (file) => createHash('sha256').update(await readFile(file)).digest('hex');
const entries = (await readFile(new URL('SHA256SUMS.txt', import.meta.url), 'utf8')).trim().split(/\r?\n/);
const failures = [];
const indexed = new Map();
for (const entry of entries) {
  const [hash, relative] = entry.split('  ');
  if (!/^[a-f0-9]{64}$/.test(hash) || !relative) throw Error('Invalid manifest entry');
  const target = path.resolve(root, relative);
  if (path.relative(root, target).startsWith('..')) throw Error('Path outside kit');
  try {
    if (await digest(target) !== hash) failures.push(relative);
  } catch { failures.push(relative); }
  indexed.set(path.basename(relative), hash);
}
let siteCopies = 0;
if (process.argv.includes('--web')) {
  const site = path.resolve(root, '../public/brand/v1.0');
  for (const file of await readdir(site, { withFileTypes: true })) {
    if (!file.isFile()) continue;
    if (await digest(path.join(site, file.name)) !== indexed.get(file.name)) failures.push('web/' + file.name);
    siteCopies++;
  }
}
if (failures.length) {
  console.error('Integrity failed:', failures);
  process.exitCode = 1;
} else {
  console.log(`OK: ${entries.length} kit files${siteCopies ? ` and ${siteCopies} website copies` : ''}.`);
}
