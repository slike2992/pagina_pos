import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, mkdtemp, rm, access, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { registrationLegalLinks, isSignupTrialQaSite, SIGNUP_TRIAL_QA_VERSION } from '../src/lib/registration-legal.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = relative => readFile(path.join(root, relative));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceHash = 'be97e5efb921c9436532e9cf483d7d151d19693f1a8ba4b6c6f43ae28e6cc1df';
const packet = JSON.parse(await read('src/content/signup-trial-qa-2026-11-25.json'));
const prefix = `/legal/versiones/${SIGNUP_TRIAL_QA_VERSION}`;
const canonicalJson = value => value === null || typeof value !== 'object' ? JSON.stringify(value)
  : Array.isArray(value) ? `[${value.map(canonicalJson).join(',')}]`
  : `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
const text = markup => markup.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '')
  .replace(/&(?:amp|lt|gt|quot|apos|#39|#x27);/g, value => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&#39;': "'", '&#x27;': "'" })[value])
  .replace(/\s+/g, ' ').trim();
const preserved = ['src/pages/legal/terminos.astro', 'src/pages/legal/privacidad.astro',
  'src/components/Brand.astro', 'src/pages/pago/demo.astro'];
let temporary, defaultOutput, qaOutput;
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
    assert.equal((selected.match(new RegExp(`href="${prefix}/${route}/"`, 'g')) ?? []).length, 2, `${route}: legal center and footer`);
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
  const denied = await build(path.join(temporary, 'rejected-production'), { PUBLIC_SITE_URL: 'https://cripton.com.co', PUBLIC_REGISTRATION_LEGAL_VERSION: SIGNUP_TRIAL_QA_VERSION });
  assert.notEqual(denied.code, 0); assert.match(denied.log, /solo puede seleccionarse en https:\/\/staging\.cripton\.com\.co/);
});
