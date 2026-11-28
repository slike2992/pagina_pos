import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, mkdtemp, rm, access, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { registrationLegalLinks, isSignupTrialQaSite, SIGNUP_TRIAL_QA_VERSION, SIGNUP_MINIMUM_QA_VERSION, SIGNUP_MINIMUM_ADDRESS_QA_VERSION } from '../src/lib/registration-legal.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = relative => readFile(path.join(root, relative));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceHash = 'be97e5efb921c9436532e9cf483d7d151d19693f1a8ba4b6c6f43ae28e6cc1df';
const packet = JSON.parse(await read('src/content/signup-trial-qa-2026-11-25.json'));
const minimumPacket = JSON.parse(await read('contracts/legal/signup-minimum-qa-2026-11-25.json'));
const servicePacket = JSON.parse(await read('contracts/legal/staging-minimum-2026-11-25.json'));
const addressPacket = JSON.parse(await read('contracts/legal/signup-minimum-qa-2026-11-27.json'));
const addressServicePacket = JSON.parse(await read('contracts/legal/staging-minimum-2026-11-27.json'));
const prefix = `/legal/versiones/${SIGNUP_TRIAL_QA_VERSION}`;
const canonicalJson = value => value === null || typeof value !== 'object' ? JSON.stringify(value)
  : Array.isArray(value) ? `[${value.map(canonicalJson).join(',')}]`
  : `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
const text = markup => markup.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '')
  .replace(/&(?:amp|lt|gt|quot|apos|#39|#x27);/g, value => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&#39;': "'", '&#x27;': "'" })[value])
  .replace(/\s+/g, ' ').trim();
const preserved = ['src/pages/legal/terminos.astro', 'src/pages/legal/privacidad.astro',
  'src/components/Brand.astro', 'src/pages/pago/demo.astro', 'src/content/signup-trial-qa-2026-11-25.json',
  'src/pages/legal/versiones/2026-11-25-prueba-qa/[document].astro',
  'src/pages/legal/versiones/2026-11-25-prueba-minima-qa/[document].astro',
  'src/lib/signup-minimum-legal.ts', 'contracts/legal/signup-minimum-qa-2026-11-25.json',
  'contracts/legal/staging-minimum-2026-11-25.json'];
let temporary, defaultOutput, qaOutput, minimumOutput, addressOutput;
const beforeBytes = new Map();

function build(output, overrides) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, PUBLIC_SITE_URL: 'https://staging.cripton.com.co', PUBLIC_SITE_INDEXABLE: 'false',
      PUBLIC_LEGAL_DRAFT_PREVIEW: 'false', PUBLIC_ANALYTICS_REVIEWED: 'false', PUBLIC_GA_MEASUREMENT_ID: '',
      PUBLIC_REGISTRATION_LEGAL_VERSION: '', ...overrides };
    const child = spawn(process.execPath, [path.join(root, 'node_modules/astro/bin/astro.mjs'), 'build', '--outDir', output],
      { cwd: root, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '';
    for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { log = (log + chunk).slice(-50000); });
    child.on('error', reject); child.on('close', code => resolve({ code, log }));
  });
}
before(async () => {
  for (const file of preserved) beforeBytes.set(file, await read(file));
  const artifacts = path.join(root, 'artifacts'); await mkdir(artifacts, { recursive: true });
  temporary = await mkdtemp(path.join(artifacts, 'signup-trial-qa-test-'));
  defaultOutput = path.join(temporary, 'default'); qaOutput = path.join(temporary, 'qa');
  const defaults = await build(defaultOutput, {}); assert.equal(defaults.code, 0, defaults.log);
  const qa = await build(qaOutput, { PUBLIC_REGISTRATION_LEGAL_VERSION: SIGNUP_TRIAL_QA_VERSION });
  assert.equal(qa.code, 0, qa.log);
  minimumOutput = path.join(temporary, 'minimum');
  const minimum = await build(minimumOutput, { PUBLIC_REGISTRATION_LEGAL_VERSION: SIGNUP_MINIMUM_QA_VERSION });
  assert.equal(minimum.code, 0, minimum.log);
  addressOutput = path.join(temporary, 'address');
  const address = await build(addressOutput, { PUBLIC_REGISTRATION_LEGAL_VERSION: SIGNUP_MINIMUM_ADDRESS_QA_VERSION });
  assert.equal(address.code, 0, address.log);
});
after(async () => {
  for (const [file, bytes] of beforeBytes) assert.deepEqual(await read(file), bytes, `${file}: bytes changed during builds`);
  if (temporary) {
    const actual = await realpath(temporary), intended = await realpath(path.join(root, 'artifacts'));
    assert.ok(actual.startsWith(intended + path.sep) && path.basename(actual).startsWith('signup-trial-qa-test-'));
    await rm(actual, { recursive: true, force: true });
  }
});
const rendered = (output, route) => readFile(path.join(output, route, 'index.html'), 'utf8');

test('no selection preserves exact09-01 default links, including staging', () => {
  for (const site of [undefined, 'https://cripton.com.co', 'https://staging.cripton.com.co']) {
    assert.deepEqual(registrationLegalLinks({ PUBLIC_SITE_URL: site }), { version: '2026-09-01', stagingTrialQa: false,
      termsHref: '/legal/terminos/', privacyHref: '/legal/privacidad/' });
  }
});
test('QA selection requires exact explicit version and HTTPS staging origin; production and lookalikes fail closed', () => {
  assert.equal(isSignupTrialQaSite('https://staging.cripton.com.co'), true);
  const selected = registrationLegalLinks({ PUBLIC_SITE_URL: 'https://staging.cripton.com.co', PUBLIC_REGISTRATION_LEGAL_VERSION: SIGNUP_TRIAL_QA_VERSION });
  assert.equal(selected.termsHref, `${prefix}/terminos/`); assert.equal(selected.privacyHref, `${prefix}/privacidad/`);
  for (const site of [undefined, '', 'invalid', 'https://cripton.com.co', 'https://www.cripton.com.co',
    'https://staging.cripton.com.co.example.invalid', 'https://staging.cripton.com.co@cripton.com.co',
    'https://user:secret@staging.cripton.com.co', 'http://staging.cripton.com.co', 'https://staging.cripton.com.co:444']) {
    assert.throws(() => registrationLegalLinks({ PUBLIC_SITE_URL: site, PUBLIC_REGISTRATION_LEGAL_VERSION: SIGNUP_TRIAL_QA_VERSION }));
  }
  for (const version of ['2026-11-24', '2026-09-01', 'true', ` ${SIGNUP_TRIAL_QA_VERSION}`]) {
    assert.throws(() => registrationLegalLinks({ PUBLIC_SITE_URL: 'https://staging.cripton.com.co', PUBLIC_REGISTRATION_LEGAL_VERSION: version }));
  }
});
test('canonical packet and immutable archives retain exact bytes;09-01 sources match across checkout EOL', async () => {
  assert.equal(hash(await read('src/content/signup-trial-qa-2026-11-25.json')), sourceHash);
  assert.equal(packet.scope, 'staging_trial_qa'); assert.equal(packet.version, SIGNUP_TRIAL_QA_VERSION);
  assert.deepEqual(packet.documents.map(doc => [doc.type, doc.slug]), [['terms', 'terminos'], ['privacy', 'privacidad']]);
  const history = JSON.parse(await read('docs/legal/history/manifest.json'));
  for (const file of history.files) {
    assert.equal(hash(await read(`docs/legal/history/${file.path}`)), file.sha256);
    if (file.path.startsWith('2026-09-01/')) {
      // Match the existing legal-review check: archives pin raw bytes, while
      // Git may convert normal source EOL between Windows and Linux checkouts.
      const archived = (await read(`docs/legal/history/${file.path}`)).toString('utf8');
      assert.equal((await read(file.source)).toString('utf8').replace(/\r\n/g, '\n'), archived.replace(/\r\n/g, '\n'), file.source);
    }
  }
});
test('default rendered legal center and footer retain historical hrefs/version; QA build switches only explicit legal pointers', async () => {
  const defaults = await rendered(defaultOutput, 'legal');
  assert.match(defaults, /href="\/legal\/terminos\/"/); assert.match(defaults, /href="\/legal\/privacidad\/"/);
  assert.equal((text(defaults).match(/Versión publicada: 2026-09-01/g) ?? []).length, 2);
  assert.ok(!defaults.includes(prefix));
  const selected = await rendered(qaOutput, 'legal');
  for (const route of ['terminos', 'privacidad']) {
    assert.equal((selected.match(new RegExp(`href="${prefix}/${route}/"`, 'g')) ?? []).length, route === 'privacidad' ? 3 : 2, `${route}: legal center, footer and privacy consent link`);
  }
  assert.equal((text(selected).match(/Versión para prueba en staging: 2026-11-25-prueba-qa/g) ?? []).length, 2);
  assert.match(selected, /href="\/legal\/cookies\/"/); assert.match(selected, /mailto:legal@cripton.com.co/);
});
test('both static QA documents exactly render source sections/paragraphs and canonical SHA, including15d and query rights', async () => {
  for (const document of packet.documents) {
    const html = await rendered(qaOutput, `legal/versiones/${packet.version}/${document.slug}`);
    const article = html.match(/<article\b[^>]*data-registration-legal-copy[^>]*>([\s\S]*?)<\/article>/)?.[1];
    assert.ok(article); const actual = [...article.matchAll(/<(h2|p)\b[^>]*>([\s\S]*?)<\/\1>/g)].map(match => text(match[2]));
    assert.deepEqual(actual, document.sections.flatMap(section => [section.heading, ...section.paragraphs]).map(text));
    const digest = html.match(/<code\b[^>]*data-legal-document-sha256[^>]*>\s*([a-f0-9]{64})\s*<\/code>/)?.[1];
    assert.equal(digest, hash(canonicalJson(document)));
    assert.match(html, /name="robots" content="noindex, follow"/); assert.doesNotMatch(html, /rel="canonical"|application\/ld\+json/);
    for (const section of document.sections) assert.ok(html.includes(`id="${section.id}"`));
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    assert.match(html, /href="\/legal\/terminos\/"/); assert.match(html, /href="\/legal\/privacidad\/"/);
    const retained = await rendered(defaultOutput, `legal/versiones/${packet.version}/${document.slug}`);
    assert.ok(retained.includes(digest), 'removing the current-registration selector must retain immutable staging URLs');
    if (document.type === 'terms') { assert.match(text(article), /prueba gratuita de 15 días/); assert.match(text(article), /No se exige tarjeta/); }
    else { assert.match(text(article), /consult|consulta/i); assert.match(text(article), /legal@cripton.com.co/); }
  }
  await assert.rejects(access(path.join(qaOutput, 'legal/versiones', packet.version, 'desconocido/index.html')));
});
test('actual production-origin build rejects QA selection rather than publishing links outside staging', async () => {
  for (const version of [SIGNUP_TRIAL_QA_VERSION, SIGNUP_MINIMUM_ADDRESS_QA_VERSION]) {
    const denied = await build(path.join(temporary, `rejected-production-${version}`), { PUBLIC_SITE_URL: 'https://cripton.com.co', PUBLIC_REGISTRATION_LEGAL_VERSION: version });
    assert.notEqual(denied.code, 0); assert.match(denied.log, /solo puede seleccionarse en https:\/\/staging\.cripton\.com\.co/);
  }
});

test('minimum registration selector is explicit, staging-only, and preserves the previous QA selector', () => {
  const selected = registrationLegalLinks({ PUBLIC_SITE_URL: 'https://staging.cripton.com.co', PUBLIC_REGISTRATION_LEGAL_VERSION: SIGNUP_MINIMUM_QA_VERSION });
  assert.equal(selected.version, minimumPacket.version);
  assert.equal(selected.privacyHref, `/legal/versiones/${SIGNUP_MINIMUM_QA_VERSION}/privacidad/`);
  for (const site of ['https://cripton.com.co', 'http://staging.cripton.com.co', undefined]) {
    assert.throws(() => registrationLegalLinks({ PUBLIC_SITE_URL: site, PUBLIC_REGISTRATION_LEGAL_VERSION: SIGNUP_MINIMUM_QA_VERSION }));
  }
  assert.equal(registrationLegalLinks({ PUBLIC_SITE_URL: 'https://staging.cripton.com.co', PUBLIC_REGISTRATION_LEGAL_VERSION: SIGNUP_TRIAL_QA_VERSION }).version, SIGNUP_TRIAL_QA_VERSION);
});

test('minimum documents render the exact canonical packet while every previous staging URL remains available', async () => {
  assert.equal(minimumPacket.version, SIGNUP_MINIMUM_QA_VERSION); assert.equal(minimumPacket.scope, 'staging_trial_qa');
  assert.equal(servicePacket.version, '2026-11-25-minimo-qa'); assert.equal(servicePacket.scope, 'staging_qa');
  assert.equal(servicePacket.documents.length, 3);
  for (const document of minimumPacket.documents) {
    const route = `legal/versiones/${minimumPacket.version}/${document.slug}`;
    const html = await rendered(minimumOutput, route);
    const article = html.match(/<article\b[^>]*data-registration-legal-copy[^>]*>([\s\S]*?)<\/article>/)?.[1];
    assert.ok(article);
    assert.deepEqual([...article.matchAll(/<(h2|p)\b[^>]*>([\s\S]*?)<\/\1>/g)].map(match => text(match[2])),
      document.sections.flatMap(section => [section.heading, ...section.paragraphs]).map(text));
    const digest = hash(canonicalJson(document));
    assert.ok(html.includes(digest)); assert.ok((await rendered(defaultOutput, route)).includes(digest));
    assert.match(html, /name="robots" content="noindex, follow"/); assert.doesNotMatch(html, /rel="canonical"/);
    assert.ok((await rendered(minimumOutput, `legal/versiones/${packet.version}/${document.slug}`)).includes(hash(canonicalJson(packet.documents.find(item => item.slug === document.slug)))));
  }
});

test('footer, legal center, cookie notice and consent panel point to the same selected registration privacy', async () => {
  for (const [output, version] of [[defaultOutput, '2026-09-01'], [qaOutput, packet.version], [minimumOutput, minimumPacket.version], [addressOutput, addressPacket.version]]) {
    const links = registrationLegalLinks({ PUBLIC_SITE_URL: 'https://staging.cripton.com.co', PUBLIC_REGISTRATION_LEGAL_VERSION: version === '2026-09-01' ? '' : version });
    for (const route of ['legal', 'legal/cookies']) {
      const html = await rendered(output, route);
      assert.ok(html.includes(`href="${links.privacyHref}"`));
      const panel = html.match(/<section\b[^>]*id="analytics-preferences"[^>]*>([\s\S]*?)<\/section>/)?.[1];
      assert.ok(panel); assert.ok(panel.includes(`href="${links.privacyHref}"`));
      assert.ok(text(panel).includes('Cookies: aviso 2026-11-23'));
      assert.ok(text(panel).includes(`Privacidad del registro: versión ${version}`));
    }
    const cookies = await rendered(output, 'legal/cookies');
    assert.match(text(cookies), /Versión de este aviso de cookies: 2026-11-23/);
    assert.match(text(cookies), /privacidad 2026-09-01/);
    assert.doesNotMatch(cookies, /href="\/legal\/privacidad\/">política de privacidad vigente/);
  }
});

test('27 November packets retain exact SaaS bytes and change only the address and internal version/date references', async () => {
  const files = [
    ['signup-minimum-qa', 'bf5fad10b5b1b845b4a01de19efd07796f6853f5febc08e2c3e18e81ee87379a', 'f99b8565b692c92eec515c8c8935f86c7f3aec37a5da2e47b9c1333ac63b2179'],
    ['staging-minimum', 'b5c69ad10f804c640d80317173a7d0022b86918f12677eea835488ae6d616ac8', '5fd87a5b8ad7e337ad1edc9fd8f60a3074ddd13cc5f598a5c4742e9e5004ce30'],
  ];
  for (const [name, oldHash, newHash] of files) {
    const oldBytes = await read(`contracts/legal/${name}-2026-11-25.json`);
    const newBytes = await read(`contracts/legal/${name}-2026-11-27.json`);
    assert.equal(hash(oldBytes), oldHash, 'published25 packet must remain byte-identical');
    assert.equal(hash(newBytes), newHash, 'new packet must be the exact supplied SaaS file');
    assert.deepEqual(JSON.parse(newBytes), JSON.parse(oldBytes.toString('utf8')
      .replaceAll('CL 78 C 130 55 T 4 507', 'Cl 78 C 130 55').replaceAll('2026-11-25', '2026-11-27')));
  }
  assert.equal(addressPacket.version, SIGNUP_MINIMUM_ADDRESS_QA_VERSION);
  assert.equal(addressServicePacket.version, '2026-11-27-minimo-qa');
  assert.equal(hash(canonicalJson(addressServicePacket)), '855b1dbb49e3ee6d15bd52d4d39f5fb5d97f7074d4b9ec13ffb4b7abfd7a1bb8');
});

test('27 November selector preserves every earlier selector and rejects production, lookalikes and unknown versions', () => {
  for (const version of [SIGNUP_TRIAL_QA_VERSION, SIGNUP_MINIMUM_QA_VERSION, SIGNUP_MINIMUM_ADDRESS_QA_VERSION]) {
    const selected = registrationLegalLinks({ PUBLIC_SITE_URL: 'https://staging.cripton.com.co', PUBLIC_REGISTRATION_LEGAL_VERSION: version });
    assert.equal(selected.version, version);
    assert.equal(selected.termsHref, `/legal/versiones/${version}/terminos/`);
    assert.equal(selected.privacyHref, `/legal/versiones/${version}/privacidad/`);
  }
  for (const site of [undefined, 'https://cripton.com.co', 'http://staging.cripton.com.co',
    'https://staging.cripton.com.co.evil.example', 'https://staging.cripton.com.co:4321', 'https://user@staging.cripton.com.co']) {
    assert.throws(() => registrationLegalLinks({ PUBLIC_SITE_URL: site, PUBLIC_REGISTRATION_LEGAL_VERSION: SIGNUP_MINIMUM_ADDRESS_QA_VERSION }));
  }
  for (const version of ['2026-11-27', '2026-11-27-minimo-qa', ` ${SIGNUP_MINIMUM_ADDRESS_QA_VERSION}`]) {
    assert.throws(() => registrationLegalLinks({ PUBLIC_SITE_URL: 'https://staging.cripton.com.co', PUBLIC_REGISTRATION_LEGAL_VERSION: version }));
  }
});

test('27 November HTML renders exact paragraphs and canonical hashes, keeps old documents and survives selector removal', async () => {
  for (const sourcePacket of [packet, minimumPacket, addressPacket]) {
    for (const document of sourcePacket.documents) {
      const route = `legal/versiones/${sourcePacket.version}/${document.slug}`;
      const html = await rendered(addressOutput, route);
      const article = html.match(/<article\b[^>]*data-registration-legal-copy[^>]*>([\s\S]*?)<\/article>/)?.[1];
      assert.ok(article);
      assert.deepEqual([...article.matchAll(/<(h2|p)\b[^>]*>([\s\S]*?)<\/\1>/g)].map(match => text(match[2])),
        document.sections.flatMap(section => [section.heading, ...section.paragraphs]).map(text));
      const digest = hash(canonicalJson(document));
      assert.ok(html.includes(digest));
      assert.ok((await rendered(defaultOutput, route)).includes(digest));
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      assert.match(html, /name="robots" content="noindex, follow"/);
      assert.doesNotMatch(html, /rel="canonical"|application\/ld\+json/);
      if (sourcePacket === addressPacket) {
        assert.match(text(article), /Cl 78 C 130 55, Bogotá D.C., Colombia/);
        assert.doesNotMatch(text(article), /T 4 507/);
        for (const earlier of [packet, minimumPacket]) for (const oldDocument of earlier.documents) {
          assert.ok(html.includes(`href="/legal/versiones/${earlier.version}/${oldDocument.slug}/"`));
        }
      } else assert.match(text(article), /CL 78 C 130 55 T 4 507/);
    }
  }
  await assert.rejects(access(path.join(addressOutput, 'legal/versiones', addressPacket.version, 'desconocido/index.html')));
});

test('production-origin build without a selector omits every staging-only legal version', async () => {
  const output = path.join(temporary, 'production-default');
  const production = await build(output, { PUBLIC_SITE_URL: 'https://cripton.com.co' });
  assert.equal(production.code, 0, production.log);
  for (const sourcePacket of [packet, minimumPacket, addressPacket]) {
    await assert.rejects(access(path.join(output, 'legal/versiones', sourcePacket.version)));
  }
  const center = await rendered(output, 'legal');
  assert.match(center, /href="\/legal\/terminos\/"/);
  assert.match(center, /href="\/legal\/privacidad\/"/);
});

test('minimum source distinguishes free operational acceptance, early purchase, termination deadlines and conditional SQL backup rotation', () => {
  const source = canonicalJson(minimumPacket);
  assert.ok(source.includes('antes del acceso operativo'));
  assert.ok(source.includes('primer minuto')); assert.ok(source.includes('distinto de comprar'));
  assert.ok(source.includes('fecha de terminación registrada'));
  assert.ok(source.includes('30 días calendario')); assert.ok(source.includes('90 días calendario'));
  assert.ok(source.includes('objetivo de rotación de siete días')); assert.ok(source.includes('no es un plazo máximo universal'));
  assert.ok(source.includes('dos días hábiles')); assert.ok(source.includes('no reemplaza ejecutar la actuación'));
  assert.doesNotMatch(source, /Versión 2026-11-25-prueba-qa\./);
  assert.doesNotMatch(canonicalJson(servicePacket), /revisión preparada el 2026-11-24, sin entrada en vigor|borrador de privacidad/);
});
