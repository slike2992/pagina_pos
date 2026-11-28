import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

test('legal history is immutable and active accepted articles retain their baseline', async () => {
  const manifest = JSON.parse(await read('docs/legal/history/manifest.json'));
  for (const file of manifest.files) {
    const archived = await readFile(new URL(`docs/legal/history/${file.path}`, root));
    assert.equal(hash(archived), file.sha256, file.path);
    if (file.source !== 'src/content/legal-drafts.ts') {
      // The archive preserves original bytes; a normal source checkout may
      // change EOL on Windows/Linux without changing the accepted document.
      assert.equal(archived.toString('utf8').replace(/\r\n/g, '\n'),
        (await read(file.source)).replace(/\r\n/g, '\n'), file.source);
    }
  }
  const baseline = JSON.parse(await read('scripts/legal-content-baseline.json'));
  for (const [slug, digest] of Object.entries(baseline.documents)) {
    const source = await read(`src/pages/legal/${slug}.astro`);
    const article = source.match(/<article class="legal-copy">[\s\S]*?<\/article>/)?.[0];
    assert(article); assert.equal(hash(article), digest, slug);
  }
});

test('review bundle has three separately identified documents and complete section anchors', async () => {
  const bundle = JSON.parse(await read('src/content/legal-review-2026-11-24.json'));
  assert.equal(bundle.status, 'review-only');
  assert.equal(bundle.version, '2026-11-24');
  assert.deepEqual(bundle.documents.map(doc => doc.slug), ['terminos', 'privacidad', 'tratamiento-por-cuenta-del-cliente']);
  assert.equal(bundle.provider.kind, 'Persona natural');
  assert.equal(bundle.provider.address, 'Cl 78 C 130 55, Bogotá D.C., Colombia');
  assert.doesNotMatch(JSON.stringify(bundle), /CL 78 C 130 55 T 4 507/);
  for (const doc of bundle.documents) {
    const ids = doc.sections.map(section => section.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(ids.length, 13);
    assert(doc.pending.length > 0, 'adoption dependencies must remain visible');
    for (const section of doc.sections) {
      assert(section.heading.trim()); assert(section.paragraphs.length > 0);
      assert(section.paragraphs.every(text => typeof text === 'string' && text.trim()));
    }
  }
});

test('PDF manifest binds the exact canonical source and all delivered review bytes', async () => {
  const manifest = JSON.parse(await read('docs/legal/reviews/2026-11-24/manifest.json'));
  const source = await readFile(new URL('src/content/legal-review-2026-11-24.json', root));
  assert.equal(hash(source), manifest.sourceSha256);
  assert(!source.includes(13), 'canonical JSON must retain LF on Windows and Linux');
  assert.equal(manifest.files.length, 3);
  for (const file of manifest.files) {
    assert.match(file.name, /^0[123]-[A-Za-z0-9-]+\.pdf$/);
    assert.equal(hash(await readFile(new URL(`docs/legal/reviews/2026-11-24/${file.name}`, root))), file.sha256);
    assert(file.pages > 0);
  }
});

test('new review cannot silently enter signup or an indexable public release', async () => {
  const source = await read('src/pages/legal/borradores/[document].astro');
  assert.match(source, /indexableRelease && preview/);
  assert.match(source, /noindex=\{true\}/);
  assert.match(source, /no recoge aceptaciones/);
  const signup = await read('src/pages/registro/index.astro');
  assert.doesNotMatch(signup, /legal-review|legalDraft|borradores/);
});
