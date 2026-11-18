import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import test from 'node:test';
import sharp from 'sharp';
import config from '../astro.config.mjs';
import { PUBLIC_PATHS, SITE_URL, publicPageUrl, indexableSite } from '../src/lib/seo.ts';
import { commercialEvent, CONSENT_TTL, storedConsent } from '../src/lib/analytics.ts';

const root = new URL('../', import.meta.url);
const output = process.env.WEB_AUDIT_DIR ?? 'dist';
const enabled = process.env.PUBLIC_SITE_INDEXABLE === 'true';
const read = path => readFile(new URL(path, root), 'utf8');
const rendered = path => read(`${output}${path}index.html`);
const tags = (html, tag) => [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))].map(([text]) => Object.fromEntries([...text.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value])));
const markup = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '');
async function pages(directory = `${output}/`) {
  const children = await readdir(new URL(directory, root), { withFileTypes: true });
  return (await Promise.all(children.map(entry => entry.isDirectory() ? pages(`${directory}${entry.name}/`) : entry.name.endsWith('.html') ? [`${directory}${entry.name}`] : []))).flat();
}

test('preview requires explicit production indexation, canonical paths never contain tokens', () => {
  assert.equal(config.devToolbar.enabled, false);
  assert.equal(config.site, SITE_URL);
  for (const [production, setting, expected] of [[false, 'true', false], [true, undefined, false], [true, 'false', false], [true, 'true', true]]) assert.equal(indexableSite(production, setting), expected);
  assert.equal(publicPageUrl('/?token=secret#private'), `${SITE_URL}/`);
  for (const path of ['/registro', '/cuenta?session=secret', '/pago/resultado?token=secret', '/legal/borradores/terminos/', '//external.example/', 'https://external.example/']) assert.equal(publicPageUrl(path), null, path);
});

test('every rendered route has unique metadata, one main/H1, and the correct indexation policy', async () => {
  const titles = new Set(), descriptions = new Set(), publicRoutes = new Set();
  for (const file of await pages()) {
    const route = file.slice(output.length).replace(/index\.html$/, '');
    const html = await read(file);
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/)?.[1];
    assert.ok(head, file);
    const titleTags = [...head.matchAll(/<title>([^<]+)<\/title>/g)];
    assert.equal(titleTags.length, 1, file);
    assert.ok(!titles.has(titleTags[0][1]), `duplicate title: ${file}`); titles.add(titleTags[0][1]);
    const meta = tags(head, 'meta'), links = tags(head, 'link');
    const description = meta.filter(tag => tag.name === 'description');
    assert.equal(description.length, 1, file);
    assert.ok(description[0].content && !descriptions.has(description[0].content), `unique description: ${file}`); descriptions.add(description[0].content);
    const robots = meta.filter(tag => tag.name === 'robots');
    assert.equal(robots.length, 1, file);
    const canonical = publicPageUrl(route);
    assert.equal(links.filter(tag => tag.rel === 'canonical').length, canonical ? 1 : 0, file);
    if (canonical) {
      publicRoutes.add(route);
      assert.equal(links.find(tag => tag.rel === 'canonical').href, canonical, file);
      assert.equal(meta.find(tag => tag.property === 'og:url')?.content, canonical, file);
      assert.equal(robots[0].content, enabled ? 'index, follow' : 'noindex, follow', file);
      const image = meta.find(tag => tag.property === 'og:image')?.content;
      assert.equal(new URL(image).origin, SITE_URL);
      await access(new URL(`${output}${new URL(image).pathname}`, root));
    } else {
      assert.match(robots[0].content, /\bnoindex\b/, file);
      assert.ok(!meta.some(tag => tag.property === 'og:url'), file);
      assert.doesNotMatch(head, /application\/ld\+json/, file);
      assert.doesNotMatch(html, /id="analytics-preferences"|data-measurement-id=/, file);
    }
    if (canonical) assert.equal((markup(html).match(/<h1\b/g) ?? []).length, 1, file);
    assert.equal((markup(html).match(/<main\b/g) ?? []).length, 1, file);
    assert.doesNotMatch(html, /<astro-dev-toolbar\b/, file);
  }
  assert.deepEqual([...publicRoutes].sort(), [...PUBLIC_PATHS].sort());
});

test('sitemap is exact and previews cannot advertise an indexable release', async () => {
  const sitemap = await read(`${output}/sitemap.xml`);
  assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url), enabled ? PUBLIC_PATHS.map(publicPageUrl) : []);
  assert.doesNotMatch(sitemap, /token=|borradores|<lastmod>|<priority>|<changefreq>/);
  const robots = await read(`${output}/robots.txt`);
  assert.match(robots, /^Sitemap: https:\/\/cripton\.com\.co\/sitemap\.xml$/m);
  assert.doesNotMatch(robots, /^Disallow:\s*\S/m);
});

test('rendered navigation, assets and fragment targets resolve within the release', async () => {
  const all = await pages();
  const htmlByPath = new Map(await Promise.all(all.map(async file => [file.slice(output.length).replace(/index\.html$/, ''), await read(file)])));
  for (const [route, raw] of htmlByPath) {
    const html = markup(raw);
    for (const link of tags(html, 'a')) {
      if (!link.href || /^(mailto:|tel:|https?:)/.test(link.href)) continue;
      const target = new URL(link.href.replace(/&amp;/g, '&'), `${SITE_URL}${route}`);
      const path = target.pathname.replace(/\/+$/, '') + '/';
      const content = htmlByPath.get(path);
      assert.ok(content, `missing route ${link.href} from ${route}`);
      if (target.hash) assert.ok(tags(content, '[a-zA-Z][a-zA-Z0-9]*').some(tag => tag.id === decodeURIComponent(target.hash.slice(1))), `missing fragment ${link.href} from ${route}`);
    }
    for (const image of tags(html, 'img')) {
      assert.ok('alt' in image, `missing alt on ${route}`);
      if (image.src?.startsWith('/')) await access(new URL(`${output}${image.src}`, root));
    }
  }
});

test('plan prices match schema and annual saving is actual arithmetic, without invented popularity', async () => {
  const html = await rendered('/');
  const json = html.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  const graph = JSON.parse(json)['@graph'];
  assert.deepEqual(graph.map(entity => entity['@type']), ['Organization', 'WebSite', 'SoftwareApplication']);
  assert.equal(graph[0].email, 'ventas@cripton.com.co');
  assert.equal(graph[2].offers.length, 6);
  assert.doesNotMatch(json, /"(?:aggregateRating|review|awards?|hasCertification)"/);
  const cards = [...html.matchAll(/<article\b[^>]*class="[^"]*plan-card[^>]*>[\s\S]*?<\/article>/g)].map(([value]) => value);
  assert.equal(cards.length, 6);
  const annual = [499000, 799000, 1299000, 699000, 999000, 1599000];
  cards.forEach((card, index) => {
    const monthly = Number(graph[2].offers[index].price);
    assert.ok(card.includes(new Intl.NumberFormat('es-CO').format(monthly)));
    assert.ok(card.includes(new Intl.NumberFormat('es-CO').format(monthly * 12 - annual[index])), `saving mismatch in plan ${index}`);
  });
  assert.doesNotMatch(html, /Más elegido|150\.000/);
  assert.equal(tags(html, 'select').filter(tag => tag.id === 'plan').length, 1);
  assert.match(html, /<option value="Profesional FE"/);
});

test('accepted legal articles are unchanged and drafts cannot replace accepted versions', async () => {
  const baseline = JSON.parse(await read('scripts/legal-content-baseline.json'));
  for (const [slug, hash] of Object.entries(baseline.documents)) {
    const source = await read(`src/pages/legal/${slug}.astro`);
    const article = source.match(/<article class="legal-copy">[\s\S]*?<\/article>/)?.[0];
    assert.equal(createHash('sha256').update(article).digest('hex'), hash, slug);
    assert.match(source, /Versión 2026-09-01/);
  }
  const signup = await read('src/pages/registro/index.astro');
  assert.match(signup, /\/v1\/public\/legal-documents/);
  assert.doesNotMatch(signup, /borradores/);
  if (enabled) assert.ok(!(await pages()).some(file => file.includes('/borradores/')), 'drafts must not ship in public release');
});

test('analytics payload is allowlisted, cannot copy form fields, and consent expires safely', () => {
  assert.deepEqual(commercialEvent({ action: 'signup', location: 'plan', plan: 'professional-fe', email: 'private@example.invalid', token: 'secret' }), { action: 'signup', location: 'plan', plan: 'professional-fe' });
  assert.deepEqual(commercialEvent({ action: 'demo', location: 'contact', plan: 'private@example.invalid' }), { action: 'demo', location: 'contact' });
  assert.equal(commercialEvent({ action: 'private@example.invalid', location: 'content' }), null);
  const now = Date.now();
  assert.equal(storedConsent(JSON.stringify({ choice: 'granted', expiresAt: now + CONSENT_TTL }), now), 'granted');
  for (const raw of ['invalid', '{}', JSON.stringify({ choice: 'granted', expiresAt: now - 1 }), JSON.stringify({ choice: 'granted', expiresAt: now + CONSENT_TTL + 1 })]) assert.equal(storedConsent(raw, now), null);
});


const positiveLogo = 'brand/v1.0/cripton_horizontal_color_v1.0';
const positivePngSha = '90eaef34445c2344be5ae8900146c9b95d0b4f88d61c49049179ce1bfb154529';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

test('official positive PNG retains the official SVG identity, size, transparency and existing reverse asset', async () => {
  const svg = await readFile(new URL('public/' + positiveLogo + '.svg', root));
  const png = await readFile(new URL('public/' + positiveLogo + '.png', root));
  assert.equal(sha256(svg), 'dd240d31abb5c92d304904e94c305fe79cac0e8bcc55faef3121e68d0d9eec22');
  assert.equal(sha256(png), positivePngSha);
  const metadata = await sharp(png).metadata();
  assert.equal(metadata.format, 'png'); assert.equal(metadata.space, 'srgb');
  assert.equal(metadata.width, 738); assert.equal(metadata.height, 199); assert.equal(metadata.hasAlpha, true);
  assert.equal(metadata.hasProfile, true); assert.ok(metadata.icc?.length > 0, 'production PNG embeds its sRGB profile');
  assert.ok(Math.abs(metadata.width - metadata.height * (1517.039 / 409.226)) < 1, 'only integer-pixel rounding of the original aspect ratio');
  assert.equal(sha256(await readFile(new URL('public/brand/v1.0/cripton_horizontal_reverso_v1.0.png', root))),
    '7825a6629b3990e74ed3577249862ec965fa652688150b6be58dcc08c3a99035');
});

test('official positive PNG pixels preserve navy, cyan, negative space and the vector geometry', async () => {
  const svg = await readFile(new URL('public/' + positiveLogo + '.svg', root));
  const actual = await sharp(await readFile(new URL('public/' + positiveLogo + '.png', root))).ensureAlpha().raw().toBuffer();
  const reference = await sharp(svg, {density: 144}).resize({width: 738, height: 199, fit: 'contain',
    background: {r: 255, g: 255, b: 255, alpha: 0}}).toColourspace('srgb').ensureAlpha().raw().toBuffer();
  assert.equal(actual.length, reference.length);
  let navy = 0, cyan = 0, transparent = 0, difference = 0;
  for (let i = 0; i < actual.length; i++) difference += Math.abs(actual[i] - reference[i]);
  assert.ok(difference / actual.length <= 0.25, 'raster must match the official paths, allowing renderer rounding');
  for (let i = 0; i < actual.length; i += 4) {
    if (actual[i+3] === 0) transparent++;
    if (actual[i+3] === 255 && actual[i] === 5 && actual[i+1] === 24 && actual[i+2] === 40) navy++;
    if (actual[i+3] === 255 && actual[i] === 49 && actual[i+1] === 204 && actual[i+2] === 212) cyan++;
  }
  assert.ok(navy > 1000 && cyan > 100 && transparent > 1000);
  for (const pixel of [0, 737, 738 * 198, 738 * 199 - 1]) assert.equal(actual[pixel * 4 + 3], 0);
});

test('published positive PNG is byte-identical to the approved source at the stable email URL', async () => {
  const published = await readFile(new URL(output + '/' + positiveLogo + '.png', root));
  assert.equal(sha256(published), positivePngSha);
  assert.deepEqual(published, await readFile(new URL('public/' + positiveLogo + '.png', root)));
});
