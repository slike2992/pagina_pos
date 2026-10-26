import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import config from '../astro.config.mjs';
import { PUBLIC_PATHS, SITE_URL, publicPageUrl } from '../src/lib/seo.ts';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const publicUrls = PUBLIC_PATHS.map((path) => `${SITE_URL}${path}`);
const tags = (head, tag) => [...head.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))]
  .map(([text]) => Object.fromEntries([...text.matchAll(/([\w:-]+)="([^"]*)"/g)]
    .map(([, key, value]) => [key, value])));

async function astroPages(directory = 'src/pages/') {
  const entries = await readdir(new URL(directory, root), { withFileTypes: true });
  const pages = await Promise.all(entries.map((entry) => entry.isDirectory()
    ? astroPages(`${directory}${entry.name}/`)
    : entry.name.endsWith('.astro') ? [`${directory}${entry.name}`] : []));
  return pages.flat();
}

// This suite inspects the actual static release. Run Astro build first.
test('official toolbar setting and canonical origin are configured', () => {
  assert.equal(config.devToolbar.enabled, false);
  assert.equal(config.site, SITE_URL);
});

test('metadata URLs cannot include tokens, fragments or request origins', () => {
  assert.equal(publicPageUrl('/?token=private-fixture#secret'), `${SITE_URL}/`);
  assert.equal(publicPageUrl('/legal/privacidad?token=private-fixture'), `${SITE_URL}/legal/privacidad/`);
  for (const path of ['/registro', '/registro/verificar?token=private-fixture',
    '/registro/configurar-clave?token=private-fixture', '/recuperar-clave',
    '/cuenta?session=private-fixture', '/pago/resultado?transaction=private-fixture',
    '/pago/demo', '/plataforma', '//other.example/', 'https://other.example/']) {
    assert.equal(publicPageUrl(path), null, path);
  }
});

test('all Astro HTML pages keep public metadata and private noindex separated', async () => {
  const titles = new Set();
  const descriptions = new Set();
  let publicCount = 0;
  let privateCount = 0;
  for (const source of await astroPages()) {
    const slug = source.replace(/^src\/pages\//, '').replace(/\.astro$/, '').replace(/(^|\/)index$/, '');
    const route = slug ? `/${slug.replace(/\/$/, '')}/` : '/';
    const html = await read(`dist${route}index.html`);
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/)?.[1];
    assert.ok(head, source);
    assert.equal((head.match(/<title\b/g) ?? []).length, 1, source);
    const title = head.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title && !titles.has(title), `unique title: ${source}`);
    titles.add(title);
    const meta = tags(head, 'meta');
    const links = tags(head, 'link');
    const descriptionsForPage = meta.filter((tag) => tag.name === 'description');
    assert.equal(descriptionsForPage.length, 1, source);
    assert.ok(descriptionsForPage[0].content && !descriptions.has(descriptionsForPage[0].content), source);
    descriptions.add(descriptionsForPage[0].content);
    const robots = meta.filter((tag) => tag.name === 'robots');
    assert.equal(robots.length, 1, source);
    const canonicals = links.filter((tag) => tag.rel === 'canonical');
    const canonical = publicPageUrl(route);
    if (canonical) {
      publicCount++;
      assert.equal(robots[0].content, 'index, follow', source);
      assert.deepEqual(canonicals.map((tag) => tag.href), [canonical], source);
      assert.equal(meta.find((tag) => tag.property === 'og:url')?.content, canonical, source);
      assert.equal(meta.find((tag) => tag.property === 'og:title')?.content, title, source);
      assert.equal(meta.find((tag) => tag.property === 'og:description')?.content, descriptionsForPage[0].content, source);
      const image = meta.find((tag) => tag.property === 'og:image')?.content;
      assert.equal(new URL(image).origin, SITE_URL);
      await readFile(fileURLToPath(new URL(`dist${new URL(image).pathname}`, root)));
    } else {
      privateCount++;
      assert.match(robots[0].content, /\bnoindex\b/, source);
      assert.equal(canonicals.length, 0, source);
      assert.equal(meta.filter((tag) => tag.property === 'og:url').length, 0, source);
      assert.doesNotMatch(head, /application\/ld\+json/, source);
    }
    assert.doesNotMatch(html, /<astro-dev-toolbar\b/, source);
  }
  assert.equal(publicCount, 3);
  assert.equal(privateCount, 8);
});

test('sitemap includes only the three public canonical URLs, with robots discovery', async () => {
  const sitemap = await read('dist/sitemap.xml');
  assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url), publicUrls);
  assert.doesNotMatch(sitemap, /<lastmod>|<priority>|<changefreq>/);
  const robots = await read('dist/robots.txt');
  assert.match(robots, /^Sitemap: https:\/\/cripton\.com\.co\/sitemap\.xml$/m);
  assert.doesNotMatch(robots, /^Disallow:\s*\S/m);
});

test('homepage describes the real application without invented ratings or certifications', async () => {
  const html = await read('dist/index.html');
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /<h1[^>]*>Software POS para comercios en Colombia\.<\/h1>/);
  const json = html.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(json);
  const schema = JSON.parse(json);
  assert.equal(schema['@context'], 'https://schema.org');
  assert.deepEqual(schema['@graph'].map((entity) => entity['@type']), ['Organization', 'SoftwareApplication']);
  const [organization, software] = schema['@graph'];
  assert.equal(software.publisher['@id'], organization['@id']);
  assert.equal(organization.url, `${SITE_URL}/`);
  assert.equal(organization.email, 'ventas@cripton.com.co');
  assert.deepEqual(organization.contactPoint, {
    '@type': 'ContactPoint', contactType: 'sales', email: 'ventas@cripton.com.co',
  });
  assert.match(html, /href="mailto:ventas@cripton\.com\.co"/);
  await readFile(fileURLToPath(new URL(`dist${new URL(organization.logo).pathname}`, root)));
  assert.equal(software.offers.length, 6);
  for (const offer of software.offers) {
    assert.equal(offer.priceCurrency, 'COP');
    assert.match(offer.name, /mensual$/);
    assert.ok(html.includes(new Intl.NumberFormat('es-CO').format(Number(offer.price))));
  }
  assert.doesNotMatch(json, /"(?:aggregateRating|review|awards?|hasCertification)"/);
});


test('public legal pages expose the confirmed legal alias without changing indexation', async () => {
  for (const path of ['privacidad', 'terminos']) {
    const html = await read(`dist/legal/${path}/index.html`);
    assert.match(html, /href="mailto:legal@cripton\.com\.co"/);
    assert.match(html, /content="index, follow"/);
  }
});
