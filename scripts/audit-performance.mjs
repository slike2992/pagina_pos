import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(root, process.env.WEB_AUDIT_DIR ?? 'dist');
const html = await readFile(path.join(output, 'index.html'), 'utf8');
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value]));
async function asset(url) {
  assert.ok(url.startsWith('/_astro/'), `Expected local build asset: ${url}`);
  const target = path.resolve(output, '.' + url);
  assert.ok(target.startsWith(output + path.sep));
  const bytes = await readFile(target);
  return { url, bytes: bytes.length, gzipBytes: gzipSync(bytes).length };
}
const styles = [...html.matchAll(/<link\b[^>]*>/g)].map(([tag]) => attrs(tag)).filter(tag => tag.rel === 'stylesheet');
const css = await Promise.all(styles.map(tag => asset(tag.href)));
const picture = html.match(/<picture\b[^>]*>[\s\S]*?class="hero-image"[\s\S]*?<\/picture>/)?.[0];
assert.ok(picture, 'Hero must preserve responsive picture');
const sources = [...picture.matchAll(/<source\b[^>]*>/g)].map(([tag]) => attrs(tag));
const avif = sources.find(source => source.type === 'image/avif');
assert.ok(avif, 'AVIF source with WebP fallback is required');
const hero = await Promise.all(avif.srcset.split(',').map(async candidate => {
  const [url, width] = candidate.trim().split(/\s+/);
  return { width: Number(width.replace('w', '')), ...await asset(url) };
}));
const fallback = attrs(picture.match(/<img\b[^>]*>/)[0]);
assert.match(fallback.src, /\.webp$/);
assert.equal(fallback.fetchpriority, 'high');
assert.equal(fallback.loading, 'eager');
assert.ok(Number(fallback.width) && Number(fallback.height));
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(([,a])=>!a.includes('application/ld+json'));
const inlineScriptBytes = scripts.reduce((sum, [, , body]) => sum + Buffer.byteLength(body), 0);
const externalJs = await Promise.all(scripts.map(([, a]) => attrs(a).src).filter(Boolean).map(asset));
const report = {
  kind: 'static-build-budget-not-lighthouse-or-field-vitals',
  html: { bytes: Buffer.byteLength(html), gzipBytes: gzipSync(html).length },
  css, inlineScriptBytes, externalJs, hero,
};
assert.ok(report.html.gzipBytes <= 16 * 1024, 'HTML exceeds 16 KiB gzip budget');
assert.ok(css.reduce((n, x) => n + x.gzipBytes, 0) <= 12 * 1024, 'CSS exceeds 12 KiB gzip budget');
assert.ok(inlineScriptBytes + externalJs.reduce((n, x) => n + x.bytes, 0) <= 24 * 1024, 'Executable JavaScript exceeds 24 KiB budget');
for (const image of hero) assert.ok(image.bytes <= 80 * 1024, 'Hero variant exceeds 80 KiB');
console.log(JSON.stringify(report, null, 2));
