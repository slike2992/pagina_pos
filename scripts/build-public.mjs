import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { rm } from 'node:fs/promises';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
if (process.env.PUBLIC_LEGAL_DRAFT_PREVIEW === 'true') throw new Error('Un release público no puede incluir borradores legales. Desactiva PUBLIC_LEGAL_DRAFT_PREVIEW.');
const env = { ...process.env, PUBLIC_SITE_INDEXABLE: 'true', PUBLIC_LEGAL_DRAFT_PREVIEW: 'false' };
for (const args of [
  ['node_modules/astro/bin/astro.mjs', 'check'],
  ['node_modules/astro/bin/astro.mjs', 'build'],
]) {
  const result = spawnSync(process.execPath, args, { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
// Only generated copies of known design experiments are excluded. The original
// public/ assets and every other worktree remain untouched.
const output = path.resolve(root, 'dist');
for (const relative of ['logo-options', 'images/criptón-logo-concepto.jpeg']) {
  const target = path.resolve(output, relative);
  if (!target.startsWith(output + path.sep)) throw new Error('Unsafe release exclusion path.');
  await rm(target, { recursive: true, force: true });
}
const audit = spawnSync(process.execPath, ['--test', 'scripts/seo.test.mjs', 'scripts/consent.test.mjs'], { cwd: root, env, stdio: 'inherit' });
if (audit.error) throw audit.error;
if (audit.status !== 0) process.exit(audit.status ?? 1);
console.log('Artefacto público validado. Esto no despliega ni acredita DNS, TLS, indexación o aprobación legal.');
