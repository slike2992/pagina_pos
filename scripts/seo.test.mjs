import assert from 'node:assert/strict';
import { readFile, readdir, access, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import test from 'node:test';
import sharp from 'sharp';
import config from '../astro.config.mjs';
import { PUBLIC_PATHS, SITE_URL, publicPageUrl, indexableSite } from '../src/lib/seo.ts';
import { commercialEvent, CONSENT_TTL, consentRecord, storedConsent } from '../src/lib/analytics.ts';

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
      if (target.pathname.startsWith('/_astro/') && /\.(?:avif|webp|png|jpe?g)$/i.test(target.pathname)) {
        await access(new URL(`${output}${target.pathname}`, root));
        continue;
      }
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

test('public pages expose honest privacy preferences even without an active analytics provider', async () => {
  for (const route of ['/', '/soluciones/inventario/', '/legal/cookies/']) {
    const html = await rendered(route);
    assert.match(html, /id="analytics-preferences"/);
    assert.match(html, /data-privacy-settings[^>]*hidden/);
    assert.match(html, /Configurar cookies/);
    assert.match(html, /data-analytics-unavailable/);
    assert.match(html, /data-analytics-choice[^>]*disabled/);
    const choices = tags(html, 'button').filter(button => button['data-consent']);
    assert.equal(choices.length, 2);
    assert.equal(choices[0].class, choices[1].class, 'accept and reject have equal visual prominence');
    assert.doesNotMatch(html, /<script\b[^>]*src="https:\/\/(?:www\.)?(?:googletagmanager|google-analytics)\./);
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
  assert.equal(storedConsent(JSON.stringify(consentRecord('granted', 'G-LOCALQA123', now)), now, 'G-LOCALQA123'), 'granted');
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


const commercialPaths = PUBLIC_PATHS.filter(path => !path.startsWith('/legal/'));
const textContent = html => markup(html).replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const anchors = html => [...markup(html).matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(([tag]) => ({ ...tags(tag, 'a')[0], label: textContent(tag) }));

test('commercial HTML, metadata and structured data offer only 15 free days without a card, followed by a paid plan', async () => {
  for (const route of PUBLIC_PATHS) {
    const html = await rendered(route);
    const visible = textContent(html);
    const metadata = tags(html, 'meta').map(tag => tag.content ?? '').join(' ');
    const schema = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(([, json]) => JSON.stringify(JSON.parse(json))).join(' ');
    assert.doesNotMatch([visible, metadata, schema].join(' '), /\b(?:demo|demostraci[oó]n|demostraciones)\b|persona elegible|gratis para siempre|gratuit[oa] permanentemente/i, route);
    if (!commercialPaths.includes(route)) continue;
    assert.match(visible, /15 d[ií]as/i, route);
    assert.match(visible, /gratis|gratuita/i, route);
    assert.match(visible, /sin tarjeta|no necesitas tarjeta/i, route);
    assert.match(visible, /para continuar despu[eé]s[^.]*plan de pago/i, route);
  }
  assert.match(textContent(await rendered('/')), /una prueba por cuenta elegible/i);
  assert.doesNotMatch(textContent(await rendered('/')), /una prueba por persona|detecta(?:mos|r)?[^.]*alias/i);
});

test('trial CTAs resolve to registration with a valid plan, including all six cards and the FE solution', async () => {
  const plans = ['basic', 'professional', 'enterprise', 'basic-fe', 'professional-fe', 'enterprise-fe'];
  await rendered('/registro/');
  for (const route of commercialPaths) {
    const links = anchors(await rendered(route)).filter(link => link['data-track'] === 'signup');
    assert.ok(links.length > 0, route);
    for (const link of links) {
      assert.match(link.label, /(?:probar|prueba).*gratis.*15 d[ií]as/i, route);
      const target = new URL(link.href.replace(/&amp;/g, '&'), SITE_URL + route);
      assert.equal(target.origin, SITE_URL, route);
      assert.equal(target.pathname, '/registro', route);
      assert.ok(plans.includes(target.searchParams.get('plan')), link.href);
      assert.deepEqual([...target.searchParams.keys()], ['plan'], link.href);
      assert.equal(target.hash, '', link.href);
    }
  }
  const cards = anchors(await rendered('/')).filter(link => link['data-track-location'] === 'plan');
  assert.deepEqual(cards.map(link => new URL(link.href, SITE_URL).searchParams.get('plan')), plans);
  const fe = anchors(await rendered('/soluciones/facturacion-electronica/')).filter(link => link['data-track'] === 'signup' && link.label.includes('Profesional FE'));
  assert.equal(fe.length, 1);
  assert.equal(new URL(fe[0].href, SITE_URL).searchParams.get('plan'), 'professional-fe');
});

test('shared footer offers the trial even on legal pages while the local payment route stays private', async () => {
  for (const path of PUBLIC_PATHS) {
    const html = await rendered(path);
    const footer = html.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/)?.[0];
    assert.ok(footer, path);
    assert.doesNotMatch(textContent(footer), /demo|demostraci[oó]n/i, path);
    assert.ok(anchors(footer).some(link => link['data-track'] === 'signup' && link.label === 'Probar gratis 15 días'), path);
  }
  const local = await rendered('/pago/demo/');
  assert.equal(publicPageUrl('/pago/demo/'), null);
  assert.equal(tags(local, 'link').some(tag => tag.rel === 'canonical'), false);
  assert.match(tags(local, 'meta').find(tag => tag.name === 'robots').content, /noindex/);
  const refresh = tags(local, 'meta').find(tag => tag['http-equiv'] === 'refresh');
  assert.equal(refresh.content, '0;url=/registro?plan=professional');
  assert.deepEqual(anchors(local).map(link => link.href), ['/registro?plan=professional']);
  assert.doesNotMatch(local, /<script|demo-payment|data-api-url|development\/checkout|demostraci[oó]n/i);
  assert.equal(tags(local, 'meta').find(tag => tag.name === 'referrer').content, 'no-referrer');
  const home = await rendered('/');
  assert.equal(tags(home.match(/<button\b[^>]*data-contact-ready[^>]*>/)[0], 'button')[0].type, 'button');
});


test('production build hook replaces only the generated local payment page and never runs during dev', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'cripton-local-payment-'));
  t.after(() => rm(directory, {recursive: true, force: true}));
  await mkdir(path.join(directory, 'pago/demo'), {recursive: true});
  await writeFile(path.join(directory, 'pago/demo/index.html'), '<script>local payment controller</script>');
  await writeFile(path.join(directory, 'index.html'), 'home remains intact');
  const integration = config.integrations.find(item => item.name === 'cripton-public-local-payment');
  assert.ok(integration);
  assert.deepEqual(Object.keys(integration.hooks), ['astro:build:done']);
  await integration.hooks['astro:build:done']({dir: pathToFileURL(directory + path.sep)});
  const html = await readFile(path.join(directory, 'pago/demo/index.html'), 'utf8');
  assert.equal(tags(html, 'meta').find(tag => tag['http-equiv'] === 'refresh').content, '0;url=/registro?plan=professional');
  assert.deepEqual(anchors(html).map(link => new URL(link.href, SITE_URL).pathname), ['/registro']);
  assert.doesNotMatch(html, /<script|local payment controller|Demostraci[oó]n|checkoutSessionId/);
  assert.equal(await readFile(path.join(directory, 'index.html'), 'utf8'), 'home remains intact');
});


test('legal index guidance describes the trial and paid plans without changing accepted-document links or versions', async () => {
  const html = await rendered('/legal/');
  const main = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/)[0];
  const paragraph = [...main.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)].map(([value]) => value).find(value => anchors(value).some(link => link.href === 'mailto:ventas@cripton.com.co'));
  assert.ok(paragraph);
  assert.match(textContent(paragraph), /prueba gratis de 15 días sin tarjeta y los planes de pago/);
  assert.doesNotMatch(textContent(main), /\bdemo\b|demostraci[oó]n|demostraciones/i);
  assert.deepEqual(anchors(paragraph).map(link => link.href), ['mailto:servicioalcliente@cripton.com.co', 'mailto:ventas@cripton.com.co']);
  const documents = anchors(main).filter(link => ['Leer términos vigentes', 'Leer política vigente', 'Consultar cookies y preferencias'].includes(link.label));
  assert.deepEqual(documents.map(link => new URL(link.href, SITE_URL).pathname), ['/legal/terminos/', '/legal/privacidad/', '/legal/cookies/']);
  assert.equal((textContent(main).match(/Versión publicada: 2026-09-01/g) ?? []).length, 2);
});
