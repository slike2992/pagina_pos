import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/customer-contract.ts', import.meta.url), 'utf8');
const markup = await readFile(new URL('../src/components/CustomerContract.astro', import.meta.url), 'utf8');
const accountPage = await readFile(new URL('../src/pages/cuenta.astro', import.meta.url), 'utf8');
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const modules = new Map(await Promise.all(['customer-contract', 'account-plans', 'subscription-trial', 'subscription-recovery', 'subscription-upgrade', 'checkout-return', 'portal-return'].map(async name => [name, compile(await readFile(new URL(`../src/lib/${name}.ts`, import.meta.url), 'utf8'))])));
const accountCode = compile(accountPage.match(/<script>([\s\S]*?)<\/script>/)[1]);
const id = n => `${String(n).padStart(8, '0')}-1111-4111-8111-111111111111`;
const plain = value => JSON.parse(JSON.stringify(value));
const reply = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const flush = () => new Promise(resolve => setImmediate(resolve));
const fixture = (extra = {}) => ({ required: true, accepted: false, contractId: null,
  canAccept: true, operationalAccess: { schemaVersion: 1, required: false, accepted: false, packageVersion: null, contractId: null },
  package: { version: 'qa-2026-11-25', documents: ['service-terms', 'data-processing-annex', 'own-data-authorization'].map(slug => ({ slug, title: `Documento ${slug}`, sections: [{ id: 'one', heading: 'Texto completo', paragraphs: ['Párrafo uno', 'Párrafo dos <img src=x onerror=alert(1)>'], items: ['Primer punto', 'Segundo punto'] }] })) },
  packageSha256: 'a'.repeat(64), offerSha256: 'b'.repeat(64),
  offer: { subscriptionId: id(1), priceId: id(2), planCode: 'professional', planName: 'Profesional', amountMinor: 1230017, currency: 'COP', billingInterval: 'monthly', automaticRenewal: false, periodRule: 'trial_remainder_then_paid_or_payment_date' },
  verifiedEmail: 'declarado@example.invalid', identityMethod: 'declared_and_verified_email', ...extra });
const acceptance = () => ({ contractId: id(3), acceptedAt: '2026-11-25T16:00:00.000Z', evidenceSha256: 'c'.repeat(64) });
const receiptFixture = (extra = {}) => ({ evidence: { schemaVersion: 1, contractId: id(3), tenantId: 'tenant-1', businessName: 'QA', principalId: id(8), email: fixture().verifiedEmail, emailVerifiedAt: '2026-11-24T00:00:00Z', identityMethod: 'declared_and_verified_email', party: { name: 'QA privado' }, declarations: {}, acceptedAt: acceptance().acceptedAt, package: fixture().package, packageSha256: fixture().packageSha256, offer: fixture().offer, offerSha256: fixture().offerSha256, paymentConfirmed: false, renewalAuthorized: false, ...extra }, evidenceSha256: acceptance().evidenceSha256 });
const checkout = () => ({ orderId: id(4), checkoutSessionId: id(5), provider: 'wompi', amountInCents: 1230017, currency: 'COP', expirationTime: '2099-01-01T00:00:00.000Z', checkoutUrl: `https://checkout.wompi.co/p/?reference=QA&redirect-url=${encodeURIComponent(`https://web.example.invalid/pago/resultado?checkoutSessionId=${id(5)}`)}` });

function browser(options = {}) {
  const elements = new Map(), calls = [], navigations = [], fields = new Map();
  let keys = 0, loginCount = 0, printed = 0, continued = 0, unauthorized = 0, context;
  const get = selector => { if (!elements.has(selector)) elements.set(selector, element()); return elements.get(selector); };
  const document = { querySelector: get, createElement: () => element() };
  function element() {
    const listeners = new Map(), attributes = new Map();
    return { value: '', checked: false, hidden: false, disabled: false, textContent: '', children: [], dataset: {}, open: false, ownerDocument: document,
      querySelector: get, focus() {}, reportValidity: () => true,
      addEventListener(name, callback) { const set = listeners.get(name) ?? []; set.push(callback); listeners.set(name, set); },
      async dispatch(name) { for (const callback of listeners.get(name) ?? []) await callback({ preventDefault() {} }); },
      setAttribute(key, value) { attributes.set(key, value); }, getAttribute: key => attributes.get(key) ?? null,
      removeAttribute(key) { attributes.delete(key); if (key === 'href') delete this.href; },
      appendChild(child) { this.children.push(child); }, replaceChildren(...children) { this.children = children; },
      showModal() { this.open = true; }, close() { const wasOpen = this.open; this.open = false; if (wasOpen) void this.dispatch('close'); }, reset() {},
    };
  }
  for (const name of ['kind', 'name', 'documentType', 'documentNumber', 'address', 'city', 'phone', 'representativeName', 'representativeDocumentType', 'representativeDocumentNumber', 'serviceTerms', 'dataProcessingAnnex', 'ownDataAuthorization', 'adultAndAuthorized', 'truthfulDeclaredIdentity']) fields.set(name, element());
  fields.get('documentType').options = ['CC', 'CE', 'NIT', 'PASSPORT', 'PPT'].map(value => ({ value }));
  const form = get('[data-contract-form]'); form.elements = { namedItem: name => fields.get(name) };
  form.reset = () => { for (const field of fields.values()) { field.value = ''; field.checked = false; } fields.get('kind').value = 'natural'; fields.get('documentType').value = 'CC'; fields.get('representativeDocumentType').value = 'CC'; };
  const root = get('#account'); root.dataset = { apiUrl: 'https://api.example.invalid', posUrl: 'https://pos.example.invalid' };
  let tenant = { tenantId: 'tenant-1', name: 'Empresa 1', role: options.role ?? 'owner', status: 'active' };
  const subscription = { subscriptionId: id(1), status: 'trialing', plan: { code: 'professional', name: 'Profesional' }, price: { amountMinor: 1230017, currency: 'COP', billingInterval: 'monthly' }, currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false,
    trial: { status: 'active', durationDays: 15, startsAt: '2026-11-20T00:00:00Z', endsAt: '2026-12-05T00:00:00Z', convertedAt: null, canConvert: true }, ...options.subscription };
  const sandbox = { URL, URLSearchParams, Date: options.now === undefined ? Date : class extends Date { constructor(...args) { super(...(args.length ? args : [options.now])); } static now() { return options.now; } }, Intl, Error, console, document,
    crypto: { randomUUID: () => `key-${++keys}` },
    window: { location: { href: 'https://web.example.invalid/cuenta', origin: 'https://web.example.invalid', assign: value => navigations.push(value) }, print() { printed++; } },
    sessionStorage: { setItem() { assert.fail('No contract credentials or PII in session storage'); }, getItem() { return null; } },
    localStorage: { setItem() { assert.fail('No contract data in local storage'); }, getItem() { assert.fail('No local storage'); } },
    Option: class { constructor(text, value) { this.text = text; this.value = value; } },
    FormData: class { constructor(form) { this.form = form; } get(name) { if (this.form === get('#login-form')) return { email: 'qa@example.invalid', password: 'synthetic' }[name] ?? null; const field = fields.get(name); return field ? (declarations.includes(name) ? field.checked ? 'on' : null : field.value) : null; } },
    async fetch(url, init = {}) {
      const call = { url, method: init.method ?? 'GET', ...plain(init) }; calls.push(call);
      const route = new URL(url).pathname;
      if (route === '/v1/auth/login') { loginCount++; tenant = { ...tenant, tenantId: `tenant-${loginCount}`, name: `Empresa ${loginCount}` }; return reply({ accessToken: `token-${loginCount}`, principal: { displayName: 'QA' }, tenant }); }
      if (route === '/v1/me/subscription') return options.readSubscription ? options.readSubscription(call, subscription) : reply(structuredClone(subscription));
      if (route === '/v1/me/tenants') return reply({ activeTenantId: tenant.tenantId, tenants: [tenant] });
      if (route === '/v1/public/plans') return reply({}, 503);
      if (route === '/v1/auth/pos-sso') return reply({ redirectUrl: 'https://pos.example.invalid/auth/sso?ticket=qa' });
      if (route === '/v1/me/subscription/trial-checkout') return options.checkout ? options.checkout(call) : reply(checkout());
      if (route.endsWith('/receipt')) return options.receipt ? options.receipt(call) : reply(receiptFixture());
      if (route === '/v1/me/customer-contract') return call.method === 'POST' ? options.post ? options.post(call) : reply(acceptance()) : options.contract ? options.contract(call, loginCount) : reply(fixture());
      throw new Error(`Unexpected request ${route}`);
    },
  };
  sandbox.location = sandbox.window.location;
  const vmContext = vm.createContext(sandbox), cache = new Map();
  const load = name => {
    if (name.endsWith('customer-support')) return { bindCustomerSupport: () => ({ reset() {}, refresh() {} }) };
    if (name.endsWith('client-idempotency')) return { createIdempotencyKey: () => `key-${++keys}` };
    const key = name.split('/').at(-1);
    if (key === 'wompi-client') return { prepareWompiSession() { assert.fail('No provider calls'); } };
    if (cache.has(key)) return cache.get(key);
    assert.ok(modules.has(key), name);
    const exports = {}; cache.set(key, exports);
    vm.runInContext(`(function(exports, require){${modules.get(key)}\n})`, vmContext)(exports, load);
    return exports;
  };
  const helper = load('customer-contract'), declarations = [...helper.contractDeclarations];
  let controller;
  if (options.account) vm.runInContext(`(function(exports,require){${accountCode}\n})`, vmContext)({}, load);
  else {
    context = { accessToken: 'token-1', tenantId: 'tenant-1', subscriptionId: id(1), session: {}, canContract: true };
    controller = helper.bindCustomerContract(root, { apiUrl: root.dataset.apiUrl, getContext: () => context,
      onContinue: async () => { continued++; }, onUnauthorized: () => { unauthorized++; context = null; } });
  }
  return { helper, controller, get, fields, calls, navigations, subscription,
    get continued() { return continued; }, get unauthorized() { return unauthorized; }, get printed() { return printed; },
    setContext(value) { context = value; },
    data() { return new sandbox.FormData(form); },
    fill(kind = 'natural') { form.reset(); for (const [name, value] of Object.entries({ kind, name: 'Persona QA', documentType: kind === 'legal' ? 'NIT' : 'CE', documentNumber: '123456', address: 'Calle QA', city: 'Bogotá', phone: '+570000000000', representativeName: 'Representante QA', representativeDocumentType: 'PPT', representativeDocumentNumber: '654321' })) fields.get(name).value = value; for (const name of declarations) fields.get(name).checked = true; },
    async login() { await get('#login-form').dispatch('submit'); await flush(); },
    async click(action) { await get(`[data-action='${action}']`).dispatch('click'); await flush(); },
    async submit() { await form.dispatch('submit'); await flush(); },
  };
}
const contractCalls = (h, method) => h.calls.filter(call => new URL(call.url).pathname === '/v1/me/customer-contract' && (!method || call.method === method));
const paymentCalls = h => h.calls.filter(call => new URL(call.url).pathname.endsWith('/trial-checkout'));
const treeText = node => [node.textContent, ...node.children.map(treeText)].join('\n');

test('three complete API documents render safely, and all five declarations start unchecked', async () => {
  const h = browser(); await h.controller.refresh();
  assert.equal(h.get('[data-contract-documents]').children.length, 3);
  const rendered = treeText(h.get('[data-contract-documents]'));
  for (const doc of fixture().package.documents) { assert.ok(rendered.includes(doc.title)); for (const section of doc.sections) for (const value of [section.heading, ...section.paragraphs, ...section.items]) assert.ok(rendered.includes(value)); }
  assert.ok(treeText(h.get('[data-contract-offer]')).includes('12.300,17 COP / mes'));
  assert.ok(treeText(h.get('[data-contract-offer]')).includes('fecha del pago'));
  assert.equal(/innerHTML|insertAdjacentHTML|localStorage|sessionStorage/.test(source), false);
  assert.equal((markup.match(/type="checkbox"/g) ?? []).length, 5);
  assert.equal(/type="file"|\bchecked(?:\s|=|\/|>)/.test(markup), false);
  assert.equal(h.continued, 0);
});

test('the minimum canonical service packet renders every section, provider subsection and list item', async () => {
  const pack = JSON.parse(await readFile(new URL('../contracts/legal/staging-minimum-2026-11-25.json', import.meta.url), 'utf8'));
  const h = browser({ contract: () => reply(fixture({ package: pack })) }); await h.controller.refresh();
  const rendered = treeText(h.get('[data-contract-documents]'));
  for (const document of pack.documents) {
    assert.ok(rendered.includes(document.title));
    for (const section of document.sections) for (const part of [section, ...(section.subsections ?? [])]) {
      assert.ok(rendered.includes(part.heading));
      for (const paragraph of [...(part.paragraphs ?? []), ...(part.items ?? [])]) assert.ok(rendered.includes(paragraph), part.heading);
    }
  }
  const malformed = fixture({ package: structuredClone(pack) });
  const section = malformed.package.documents.flatMap(document => document.sections).find(section => section.subsections?.length);
  assert.ok(section); section.subsections[0].paragraphs = '<script>';
  assert.throws(() => h.helper.readCustomerContract(malformed, id(1)));
});

for (const mutate of [r => r.accepted = 'true', r => r.package.documents.pop(), r => r.package.documents[1].slug = r.package.documents[0].slug,
  r => r.package.documents[0].sections[0].items = '<script>', r => r.package.documents[0].sections[0].paragraphs = [''],
  r => r.packageSha256 = null, r => r.offerSha256 = 'invalid', r => r.offer.automaticRenewal = true,
  r => r.offer.periodRule = 'automatic', r => r.offer.subscriptionId = id(9), r => r.offer.priceId = 'bad', r => r.offer.amountMinor = 1.5,
  r => r.offer.currency = 'USD', r => r.identityMethod = 'officially_verified', r => r.verifiedEmail = '', r => r.contractId = id(3),
  r => { r.accepted = true; r.contractId = null; }]) test(`invalid contract cannot authorize payment: ${mutate}`, () => {
  const h = browser(), raw = fixture(); mutate(raw);
  assert.throws(() => h.helper.readCustomerContract(raw, id(1)));
});

test('natural party is copied to representative and legal party requires NIT and separate representative', () => {
  const h = browser(); h.fill(); const natural = plain(h.helper.createContractAcceptance(fixture(), h.data()));
  assert.equal(natural.party.representativeName, natural.party.name);
  assert.equal(natural.party.representativeDocumentType, 'CE'); assert.equal(natural.party.representativeDocumentNumber, natural.party.documentNumber);
  assert.equal(natural.party.country, 'CO');
  assert.deepEqual(Object.values(natural.declarations), [true, true, true, true, true]);
  assert.deepEqual(Object.keys(natural).sort(), ['declarations', 'offerSha256', 'packageSha256', 'party']);
  h.fill('legal'); const legal = plain(h.helper.createContractAcceptance(fixture(), h.data()));
  assert.equal(legal.party.documentType, 'NIT'); assert.equal(legal.party.representativeName, 'Representante QA');
  assert.equal(legal.party.representativeDocumentType, 'PPT');
  h.fields.get('documentType').value = 'CC'; assert.throws(() => h.helper.createContractAcceptance(fixture(), h.data()));
  h.fill(); h.fields.get('documentType').value = 'NIT'; assert.throws(() => h.helper.createContractAcceptance(fixture(), h.data()));
});

for (const name of ['serviceTerms', 'dataProcessingAnnex', 'ownDataAuthorization', 'adultAndAuthorized', 'truthfulDeclaredIdentity']) test(`declaration ${name} is required independently`, () => {
  const h = browser(); h.fill(); h.fields.get(name).checked = false;
  assert.throws(() => h.helper.createContractAcceptance(fixture(), h.data()), /cinco declaraciones/);
});

test('real account trial button cannot bypass the contract, and explicit acceptance resumes exactly one checkout', async () => {
  const waiting = Promise.withResolvers();
  const h = browser({ account: true, post: () => waiting.promise }); await h.login();
  assert.equal(h.get('.account-panel').hidden, false); assert.equal(h.get("[data-action='open-pos']").getAttribute('aria-disabled'), null);
  assert.equal(paymentCalls(h).length, 0);
  await h.click('contract-trial');
  assert.equal(h.get('[data-contract-dialog]').open, true); assert.equal(paymentCalls(h).length, 0);
  h.fill(); h.fields.get('serviceTerms').checked = false; await h.submit(); assert.equal(contractCalls(h, 'POST').length, 0);
  h.fill(); const first = h.submit(), second = h.submit(); await flush();
  assert.equal(contractCalls(h, 'POST').length, 1); assert.equal(paymentCalls(h).length, 0);
  waiting.resolve(reply(acceptance())); await Promise.all([first, second]);
  assert.equal(paymentCalls(h).length, 1); assert.deepEqual(JSON.parse(paymentCalls(h)[0].body), { subscriptionId: id(1) });
  assert.deepEqual(h.navigations, [checkout().checkoutUrl]);
  const post = contractCalls(h, 'POST')[0]; assert.equal(post.headers.authorization, 'Bearer token-1'); assert.ok(post.headers['idempotency-key']);
  for (const call of contractCalls(h)) { assert.equal(call.cache, 'no-store'); assert.equal(call.credentials, 'omit'); assert.equal(call.redirect, 'error'); }
});

test('kind selection hides natural representative, constrains NIT and does not retain hidden personal data after reset', async () => {
  const h = browser(); await h.controller.refresh();
  assert.equal(h.get('[data-contract-representative]').disabled, true);
  h.fields.get('kind').value = 'legal'; await h.fields.get('kind').dispatch('change');
  assert.equal(h.fields.get('documentType').value, 'NIT'); assert.equal(h.get('[data-contract-representative]').disabled, false);
  assert.ok(h.fields.get('documentType').options.filter(option => option.value !== 'NIT').every(option => option.disabled));
  h.fill('legal'); h.controller.reset();
  assert.equal(h.fields.get('representativeName').value, ''); assert.equal(h.fields.get('name').value, '');
  assert.equal(h.get('[data-contract-documents]').children.length, 0); assert.equal(h.get('[data-contract-email]').textContent, '');
});

test('503 and malformed contract preserve account but fail closed for POS SSO and checkout', async () => {
  for (const contract of [() => reply({}, 503), () => reply(fixture({ packageSha256: null }))]) {
    const h = browser({ account: true, contract }); await h.login(); await h.click('contract-trial');
    assert.equal(h.get('.account-panel').hidden, false); assert.equal(h.get('[data-contract-receipt]').hidden, true);
    assert.equal(paymentCalls(h).length, 0); assert.equal(h.get('[data-contract-form]').hidden, true);
    assert.equal(h.get('[data-contract-status]').textContent.includes('Contrato aceptado'), false);
    await h.click('open-pos'); assert.equal(h.navigations.length, 0);
    assert.equal(h.calls.filter(call => call.url.endsWith('/auth/pos-sso')).length, 0);
  }
});

test('not required never means accepted and receipt is not invented; checkout still requires a click', async () => {
  const h = browser({ account: true, contract: () => reply(fixture({ required: false, packageSha256: null, offerSha256: null })) }); await h.login();
  assert.equal(paymentCalls(h).length, 0); assert.equal(h.get('[data-contract-receipt]').hidden, true);
  assert.ok(h.get('[data-contract-status]').textContent.includes('No hay una aceptación acreditada'));
  await h.click('contract-trial'); assert.equal(paymentCalls(h).length, 1); assert.equal(contractCalls(h, 'POST').length, 0);
});

test('member reads operational status but cannot accept or pay even through programmatic events', async () => {
  const h = browser({ account: true, role: 'member' }); await h.login(); await h.click('contract-trial'); h.fill(); await h.submit();
  assert.ok(contractCalls(h, 'GET').length >= 1); assert.equal(contractCalls(h, 'POST').length, 0); assert.equal(paymentCalls(h).length, 0);
  assert.equal(h.get('[data-contract-email]').textContent, ''); assert.equal(h.get('[data-contract-documents]').children.length, 0);
  await h.click('open-pos'); assert.equal(h.navigations.length, 1);
});

test('POST transport retry reuses the same key; a changed declared party gets a different key', async () => {
  const h = browser({ post: () => reply({}, 503) }); await h.controller.refresh(); await h.controller.beforeCheckout(); h.fill();
  await h.submit(); await h.submit();
  assert.equal(contractCalls(h, 'POST').length, 2);
  assert.equal(contractCalls(h, 'POST')[0].headers['idempotency-key'], contractCalls(h, 'POST')[1].headers['idempotency-key']);
  h.fields.get('name').value = 'Nombre corregido'; await h.submit();
  assert.notEqual(contractCalls(h, 'POST')[1].headers['idempotency-key'], contractCalls(h, 'POST')[2].headers['idempotency-key']);
  assert.equal(h.continued, 0);
});

test('a changed offer/hash conflict clears declarations and requires a new review, without payment', async () => {
  let changed = false;
  const h = browser({ contract: () => reply(fixture({ offerSha256: (changed ? 'd' : 'b').repeat(64) })), post: () => { changed = true; return reply({}, 409); } });
  await h.controller.refresh(); await h.controller.beforeCheckout(); h.fill(); await h.submit();
  assert.equal(h.controller.canContinue(), false); assert.equal(h.get('[data-contract-form]').hidden, true);
  assert.equal(h.fields.get('serviceTerms').checked, false); assert.equal(h.continued, 0);
  await h.get('[data-contract-retry]').dispatch('click'); await flush();
  assert.equal(h.get('[data-contract-dialog]').open, false); assert.equal(h.continued, 0);
  await h.controller.beforeCheckout(); h.fill(); await h.submit();
  assert.equal(JSON.parse(contractCalls(h, 'POST')[1].body).offerSha256, 'd'.repeat(64));
});

for (const method of ['GET', 'POST', 'receipt']) test(`late ${method} after logout/new tenant cannot restore or continue old state`, async () => {
  const waiting = Promise.withResolvers(); let delayed = false;
  const h = browser({ account: true,
    contract: (_call, login) => method === 'GET' && login === 1 ? waiting.promise : reply(fixture(method === 'receipt' ? { accepted: true, contractId: id(3) } : {})),
    post: () => { delayed = true; return waiting.promise; }, receipt: () => { delayed = true; return waiting.promise; } });
  await h.login();
  let action;
  if (method === 'POST') { await h.click('contract-trial'); h.fill(); action = h.submit(); }
  if (method === 'receipt') action = h.get('[data-contract-receipt]').dispatch('click');
  await flush(); if (method !== 'GET') assert.equal(delayed, true);
  await h.click('logout'); assert.equal(h.get('[data-contract-email]').textContent, '');
  await h.login();
  waiting.resolve(reply(method === 'GET' ? fixture({ verifiedEmail: 'old@example.invalid' }) : method === 'POST' ? acceptance() : { secret: 'old tenant' }));
  await action; await flush();
  assert.equal(h.get("[data-field='tenant-name']").textContent, 'Empresa 2');
  assert.equal(h.get('[data-contract-email]').textContent, 'declarado@example.invalid');
  assert.equal(h.get('[data-contract-evidence]').textContent, ''); assert.equal(paymentCalls(h).length, 0);
});

test('account refresh clears declared PII and pending acceptance and cannot continue an obsolete POST', async () => {
  const waiting = Promise.withResolvers(); const h = browser({ account: true, post: () => waiting.promise });
  await h.login(); await h.click('contract-trial'); h.fill(); const pending = h.submit(); await flush();
  await h.click('refresh-recovery');
  assert.equal(h.fields.get('name').value, ''); assert.equal(h.get('[data-contract-dialog]').open, false);
  waiting.resolve(reply(acceptance())); await pending;
  assert.equal(paymentCalls(h).length, 0); assert.equal(h.get('[data-contract-receipt]').hidden, true);
});

test('receipt uses authenticated no-store fetch and displays private full JSON safely, with print only after evidence loads', async () => {
  const h = browser({ contract: () => reply(fixture({ accepted: true, contractId: id(3) })) }); await h.controller.refresh();
  await h.get('[data-contract-print]').dispatch('click'); assert.equal(h.printed, 0);
  await h.get('[data-contract-receipt]').dispatch('click');
  const call = h.calls.find(call => call.url.endsWith(`/${id(3)}/receipt`)); assert.equal(call.headers.authorization, 'Bearer token-1'); assert.equal(call.cache, 'no-store');
  assert.equal(JSON.parse(h.get('[data-contract-evidence]').textContent).evidence.package.version, fixture().package.version);
  assert.ok(h.get('[data-contract-evidence]').textContent.includes('<img src=x onerror=alert(1)>'));
  await h.get('[data-contract-print]').dispatch('click'); assert.equal(h.printed, 1);
  assert.ok(h.get('[data-contract-documents]').children.every(detail => detail.open));
  assert.ok(markup.includes('@media print')); assert.ok(markup.includes('details > *'));
  h.controller.reset(); assert.equal(h.get('[data-contract-evidence]').textContent, ''); assert.equal(h.continued, 0);
});

test('contract 401 resets only its current account before reading JSON; 403 never elevates access', async () => {
  const h = browser({ contract: () => ({ status: 401, ok: false, json() { assert.fail('401 body must not be read'); } }) });
  await h.controller.refresh(); assert.equal(h.unauthorized, 1); assert.equal(h.get('[data-customer-contract]').hidden, true);
  const forbidden = browser({ account: true, contract: () => reply({}, 403) }); await forbidden.login(); await forbidden.click('contract-trial');
  assert.equal(paymentCalls(forbidden).length, 0); assert.equal(forbidden.get('.account-panel').hidden, false);
});

test('closing a review or retrying its GET never accepts or starts a payment', async () => {
  const h = browser(); await h.controller.refresh(); await h.controller.beforeCheckout(); h.fill();
  await h.get('[data-contract-close]').dispatch('click'); await h.submit();
  await h.get('[data-contract-retry]').dispatch('click'); await flush(); await h.submit();
  assert.equal(contractCalls(h, 'POST').length, 0); assert.equal(h.continued, 0);
});

test('closing while acceptance is pending records the explicit acceptance without continuing payment', async () => {
  const waiting = Promise.withResolvers();
  const h = browser({ post: () => waiting.promise }); await h.controller.refresh(); await h.controller.beforeCheckout(); h.fill();
  const pending = h.submit(); await flush();
  await h.get('[data-contract-close]').dispatch('click'); waiting.resolve(reply(acceptance())); await pending;
  assert.equal(h.continued, 0); assert.equal(h.get('[data-contract-receipt]').hidden, false);
});

test('acceptance with malformed evidence never enables checkout or a receipt', async () => {
  for (const result of [{ ...acceptance(), evidenceSha256: 'bad' }, { ...acceptance(), acceptedAt: 'bad' }, { ...acceptance(), contractId: null }]) {
    const h = browser({ post: () => reply(result) }); await h.controller.refresh(); await h.controller.beforeCheckout(); h.fill(); await h.submit();
    assert.equal(h.continued, 0); assert.equal(h.controller.canContinue(), false); assert.equal(h.get('[data-contract-receipt]').hidden, true);
  }
});

test('an existing accepted contract opens checkout only on trial click and does not POST another acceptance', async () => {
  const h = browser({ account: true, contract: () => reply(fixture({ accepted: true, contractId: id(3) })) }); await h.login();
  assert.equal(paymentCalls(h).length, 0); await h.click('contract-trial');
  assert.equal(contractCalls(h, 'POST').length, 0); assert.equal(paymentCalls(h).length, 1);
});

test('contract and offer are fetched again on the payment click rather than trusting an earlier accepted state', async () => {
  let reads = 0;
  const h = browser({ account: true, contract: () => reply(++reads === 1 ? fixture({ accepted: true, contractId: id(3) }) : fixture({ offerSha256: 'd'.repeat(64) })) });
  await h.login(); await h.click('contract-trial');
  assert.equal(h.get('[data-contract-dialog]').open, true); assert.equal(paymentCalls(h).length, 0);
  assert.equal(h.get('[data-contract-receipt]').hidden, true);
});

test('late unauthorized response from the old account cannot sign out the new account', async () => {
  const waiting = Promise.withResolvers();
  const h = browser({ account: true, contract: (_call, login) => login === 1 ? waiting.promise : reply(fixture()) });
  await h.login(); await h.click('logout'); await h.login();
  waiting.resolve({ ok: false, status: 401, json() { assert.fail('stale unauthorized body'); } }); await flush();
  assert.equal(h.get('.account-panel').hidden, false); assert.equal(h.get("[data-field='tenant-name']").textContent, 'Empresa 2');
});

test('inactive policy with null package and unverified email preserves legacy checkout without acceptance', async () => {
  const inactive = fixture({ required: false, accepted: false, package: null, packageSha256: null, verifiedEmail: null });
  const h = browser({ account: true, contract: () => reply(inactive) }); await h.login();
  assert.equal(h.get('[data-contract-documents]').children.length, 0);
  assert.equal(h.get('[data-contract-email]').textContent, ''); assert.equal(h.get('[data-contract-form]').hidden, true);
  assert.equal(h.get('[data-contract-receipt]').hidden, true); assert.equal(paymentCalls(h).length, 0);
  await h.click('contract-trial'); assert.equal(paymentCalls(h).length, 1); assert.equal(contractCalls(h, 'POST').length, 0);
});

for (const active of [{ required: true, accepted: false, contractId: null }, { required: false, accepted: true, contractId: id(3) }]) test(`active contract still requires complete evidence (${JSON.stringify(active)})`, () => {
  const h = browser();
  for (const missing of [{ package: null }, { packageSha256: null }, { offerSha256: null }, { verifiedEmail: null }, { offer: null }]) assert.throws(() => h.helper.readCustomerContract(fixture({ ...active, ...missing }), id(1)));
});

for (const [field, max] of Object.entries({ name: 240, documentNumber: 30, address: 240, phone: 24, representativeName: 180, representativeDocumentNumber: 30, city: 100 })) test(`party ${field} accepts backend maximum ${max} and rejects overflow`, () => {
  const h = browser(); h.fill('legal'); h.fields.get(field).value = '1'.repeat(max);
  assert.equal(h.helper.createContractAcceptance(fixture(), h.data()).party[field].length, max);
  h.fields.get(field).value += '1'; assert.throws(() => h.helper.createContractAcceptance(fixture(), h.data()));
  assert.ok(markup.includes(`maxlength={contractPartyLimits.${field}}`));
});

test('natural name respects representative limit without truncation or a duplicate input', async () => {
  const h = browser(); await h.controller.refresh(); h.fill(); h.fields.get('name').value = 'A'.repeat(180);
  const party = h.helper.createContractAcceptance(fixture(), h.data()).party;
  assert.equal(party.name, party.representativeName); assert.equal(h.fields.get('name').maxLength, 180);
  h.fields.get('name').value += 'A'; assert.throws(() => h.helper.createContractAcceptance(fixture(), h.data()));
});

test('optional offer features, tax and zero implementation survive parsing and render as safe readable text', async () => {
  const offer = { ...fixture().offer, taxBehavior: 'inclusive', implementationAmountMinor: 0, features: [
    { code: 'users', display_name: 'Usuarios', enabled: true, limit_value: 5 },
    { code: 'fe', display_name: 'Electrónica', enabled: false, limit_value: null, text_value: '<img src=x onerror=alert(1)>' },
  ], futureField: { retained: true } };
  const h = browser({ contract: () => reply(fixture({ offer })) }); await h.controller.refresh();
  const parsed = plain(h.helper.readCustomerContract(fixture({ offer }), id(1)));
  assert.deepEqual(parsed.offer, offer);
  const text = treeText(h.get('[data-contract-offer]'));
  for (const expected of ['Usuarios: Incluido; límite: 5', 'Electrónica: No incluido', '<img src=x onerror=alert(1)>', 'Incluidos en el valor', '0,00 COP']) assert.ok(text.includes(expected));
});

test('receipt renders its accepted historical package and full offer while preserving the original evidence JSON', async () => {
  const savedPackage = { ...fixture().package, version: 'accepted-historical-version' };
  const savedOffer = { ...fixture().offer, planName: 'Plan aceptado anteriormente', taxBehavior: 'inclusive', implementationAmountMinor: 0,
    features: [{ code: 'branches', display_name: 'Sucursales', enabled: true, limit_value: 2, text_value: 'Texto de la oferta aceptada' }] };
  const saved = receiptFixture({ package: savedPackage, offer: savedOffer });
  const h = browser({ contract: () => reply(fixture({ accepted: true, contractId: id(3) })), receipt: () => reply(saved) });
  await h.controller.refresh(); await h.get('[data-contract-receipt]').dispatch('click');
  assert.ok(h.get('[data-contract-version]').textContent.includes('accepted-historical-version'));
  assert.ok(treeText(h.get('[data-contract-offer]')).includes('Plan aceptado anteriormente'));
  assert.ok(treeText(h.get('[data-contract-offer]')).includes('Sucursales: Incluido; límite: 2; Texto de la oferta aceptada'));
  assert.deepEqual(JSON.parse(h.get('[data-contract-evidence]').textContent), saved);
  assert.ok(h.get('[data-contract-acceptance]').textContent.includes('No acredita pago ni autoriza renovación'));
});

test('a receipt for a different contract or tenant never exposes its private JSON', async () => {
  for (const mismatch of [{ contractId: id(99) }, { tenantId: 'tenant-foreign' }, { paymentConfirmed: true }, { renewalAuthorized: true }]) {
    const h = browser({ contract: () => reply(fixture({ accepted: true, contractId: id(3) })), receipt: () => reply(receiptFixture(mismatch)) });
    await h.controller.refresh(); await h.get('[data-contract-receipt]').dispatch('click');
    assert.equal(h.get('[data-contract-evidence]').textContent, ''); assert.equal(h.get('[data-contract-evidence-section]').hidden, true);
  }
});

const operational = (accepted = false) => ({ schemaVersion: 1, required: true, accepted,
  packageVersion: 'qa-2026-11-25', contractId: accepted ? id(3) : null });
const ssoCalls = h => h.calls.filter(call => call.url.endsWith('/auth/pos-sso'));

test('representative accepts for POS for free, refreshes operational evidence and opens exactly one SSO without checkout', async () => {
  let accepted = false;
  const waiting = Promise.withResolvers();
  const h = browser({ account: true, subscription: { trial: { status: 'active', durationDays: 15,
    startsAt: '2026-11-20T00:00:00Z', endsAt: '2026-12-05T00:00:00Z', convertedAt: null, canConvert: false } },
    contract: () => reply(fixture({ accepted, contractId: accepted ? id(3) : null, operationalAccess: operational(accepted) })),
    post: async () => { await waiting.promise; accepted = true; return reply(acceptance()); } });
  await h.login(); await h.click('open-pos');
  assert.equal(h.get('[data-contract-dialog]').open, true);
  assert.equal(h.get('[data-contract-accept]').textContent, 'Aceptar acuerdo y abrir POS');
  assert.equal(paymentCalls(h).length, 0); assert.equal(ssoCalls(h).length, 0);
  h.fill(); const first = h.submit(), second = h.submit(); await flush();
  assert.equal(contractCalls(h, 'POST').length, 1); assert.equal(ssoCalls(h).length, 0);
  waiting.resolve(); await Promise.all([first, second]);
  assert.equal(ssoCalls(h).length, 1); assert.equal(paymentCalls(h).length, 0);
  assert.deepEqual(h.navigations, ['https://pos.example.invalid/auth/sso?ticket=qa']);
  const postIndex = h.calls.findIndex(call => call.method === 'POST' && call.url.endsWith('/customer-contract'));
  const ssoIndex = h.calls.findIndex(call => call.url.endsWith('/auth/pos-sso'));
  assert.ok(h.calls.slice(postIndex + 1, ssoIndex).some(call => call.method === 'GET' && call.url.endsWith('/customer-contract') && call.cache === 'no-store'));
});

test('member receives representative guidance and only enters once a fresh tenant operational acceptance exists', async () => {
  let accepted = false;
  const h = browser({ account: true, role: 'member', contract: () => reply(fixture({
    required: false, accepted: false, contractId: null, canAccept: false, package: null, packageSha256: null,
    offer: null, offerSha256: null, verifiedEmail: null, operationalAccess: operational(accepted),
  })) });
  await h.login(); await h.click('open-pos'); h.fill(); await h.submit();
  assert.match(h.get('[data-contract-status]').textContent, /representante habilitado/);
  assert.equal(h.get('[data-contract-dialog]').open, false); assert.equal(ssoCalls(h).length, 0);
  assert.equal(contractCalls(h, 'POST').length, 0); assert.equal(paymentCalls(h).length, 0);
  assert.equal(h.get('[data-contract-email]').textContent, ''); assert.equal(h.get('[data-contract-documents]').children.length, 0);
  accepted = true; await h.click('open-pos');
  assert.equal(ssoCalls(h).length, 1); assert.equal(contractCalls(h, 'POST').length, 0);
});

for (const mutate of [row => delete row.operationalAccess, row => row.operationalAccess = null,
  row => row.operationalAccess.schemaVersion = 2, row => row.operationalAccess.accepted = 'true',
  row => row.operationalAccess.required = 'false', row => row.operationalAccess.packageVersion = null,
  row => { row.operationalAccess.accepted = true; row.operationalAccess.contractId = null; }, row => delete row.canAccept]) {
  test(`missing or malformed operational state cannot issue SSO: ${mutate}`, async () => {
    const row = fixture({ operationalAccess: operational() }); mutate(row);
    const h = browser({ account: true, contract: () => reply(row) }); await h.login(); await h.click('open-pos');
    assert.equal(ssoCalls(h).length, 0); assert.equal(paymentCalls(h).length, 0);
    assert.equal(h.get('.account-panel').hidden, false);
  });
}

test('a POST receipt alone or a failed verification GET cannot enable operational SSO', async () => {
  for (const unavailable of [false, true]) {
    let posted = false;
    const h = browser({ account: true, post: () => { posted = true; return reply(acceptance()); },
      contract: () => posted && unavailable ? reply({}, 503) : reply(fixture({ operationalAccess: operational() })) });
    await h.login(); await h.click('open-pos'); h.fill(); await h.submit();
    assert.equal(contractCalls(h, 'POST').length, 1); assert.equal(ssoCalls(h).length, 0); assert.equal(paymentCalls(h).length, 0);
  }
});

test('closing a pending operational acceptance never resumes POS or payment automatically', async () => {
  let accepted = false; const waiting = Promise.withResolvers();
  const h = browser({ account: true, contract: () => reply(fixture({ operationalAccess: operational(accepted) })),
    post: async () => { await waiting.promise; accepted = true; return reply(acceptance()); } });
  await h.login(); await h.click('open-pos'); h.fill(); const submitting = h.submit(); await flush();
  await h.get('[data-contract-close]').dispatch('click'); waiting.resolve(); await submitting;
  assert.equal(ssoCalls(h).length, 0); assert.equal(paymentCalls(h).length, 0);
  await h.click('open-pos'); assert.equal(ssoCalls(h).length, 1);
});

for (const stage of ['GET', 'POST']) test(`late operational ${stage} cannot issue SSO after logout and a different account`, async () => {
  const waiting = Promise.withResolvers();
  const h = browser({ account: true,
    contract: (_call, login) => stage === 'GET' && login === 1 ? waiting.promise : reply(fixture({ operationalAccess: operational() })),
    post: () => waiting.promise });
  await h.login();
  let pending;
  if (stage === 'GET') { pending = h.click('open-pos'); await flush(); }
  else { await h.click('open-pos'); h.fill(); pending = h.submit(); await flush(); }
  await h.click('logout'); await h.login();
  waiting.resolve(reply(stage === 'GET' ? fixture({ operationalAccess: operational(true) }) : acceptance()));
  await pending; await flush();
  assert.equal(ssoCalls(h).length, 0); assert.equal(paymentCalls(h).length, 0);
  assert.equal(h.get('[data-contract-email]').textContent, 'declarado@example.invalid');
  assert.equal(h.fields.get('name').value, '');
});

test('operational acceptance remains valid despite a different commercial offer requiring review', async () => {
  const h = browser({ account: true, contract: () => reply(fixture({ offerSha256: 'd'.repeat(64), operationalAccess: operational(true) })) });
  await h.login(); await h.click('open-pos');
  assert.equal(ssoCalls(h).length, 1); assert.equal(contractCalls(h, 'POST').length, 0);
  await h.click('contract-trial');
  assert.equal(h.get('[data-contract-dialog]').open, true); assert.equal(paymentCalls(h).length, 0);
  assert.equal(h.get('[data-contract-accept]').textContent, 'Aceptar contrato y continuar al pago');
});

for (const day of [0, 2, 4]) test(`an eligible trial can be purchased on day ${day} while preserving the free balance`, async () => {
  const startsAt = '2030-01-01T00:00:00Z', endsAt = '2030-01-16T00:00:00Z';
  const h = browser({ account: true, now: Date.parse(startsAt) + day * 86400000 + 60000,
    subscription: { trial: { status: 'active', durationDays: 15, startsAt, endsAt, convertedAt: null, canConvert: true } },
    contract: () => reply(fixture({ accepted: true, contractId: id(3), operationalAccess: operational(true) })) });
  await h.login(); await h.click('contract-trial');
  assert.equal(paymentCalls(h).length, 1); assert.equal(contractCalls(h, 'POST').length, 0);
  assert.ok(treeText(h.get('[data-contract-offer]')).includes('se conserva el tiempo restante'));
  assert.equal(h.subscription.trial.endsAt, endsAt); assert.equal(h.subscription.trial.convertedAt, null);
});

const transportFailures = [() => Promise.reject(new TypeError('Failed to fetch PRIVATE_TRANSPORT')),
  () => Promise.reject(new Error('PRIVATE_TRANSPORT https://internal.example.invalid')),
  () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('PRIVATE_JSON'); } })];

test('contract GET translates arbitrary transport and JSON errors while keeping operational access closed', async () => {
  for (const failure of transportFailures) {
    const h = browser({ contract: failure }); await h.controller.refresh();
    assert.match(h.get('[data-contract-status]').textContent, /No pudimos consultar el acuerdo.*conexión/);
    assert.doesNotMatch(h.get('[data-contract-status]').textContent, /PRIVATE_|Failed to fetch|internal\.example/);
    assert.equal(h.controller.canOperate(), false); assert.equal(h.controller.canContinue(), false);
    assert.equal(contractCalls(h).length, 1); assert.equal(h.continued, 0); assert.equal(h.navigations.length, 0);
  }
});

test('contract acceptance translates unconfirmed responses without replay and preserves the original retry key', async () => {
  for (const failure of transportFailures) {
    const h = browser({ post: failure }); await h.controller.beforeCheckout(); h.fill(); await h.submit();
    assert.match(h.get('[data-contract-dialog-status]').textContent, /No pudimos confirmar si se registró la aceptación/);
    assert.doesNotMatch(h.get('[data-contract-dialog-status]').textContent, /PRIVATE_|Failed to fetch|internal\.example/);
    assert.equal(contractCalls(h, 'POST').length, 1); assert.equal(h.continued, 0); assert.equal(paymentCalls(h).length, 0);
    const first = contractCalls(h, 'POST')[0]; await h.submit();
    assert.equal(contractCalls(h, 'POST')[1].headers['idempotency-key'], first.headers['idempotency-key']);
    assert.equal(contractCalls(h, 'POST')[1].body, first.body);
  }
});

test('receipt failures display a public connection message without exposing raw errors, evidence or automatic printing', async () => {
  for (const failure of transportFailures) {
    const h = browser({ contract: () => reply(fixture({ accepted: true, contractId: id(3) })), receipt: failure });
    await h.controller.refresh(); await h.get('[data-contract-receipt]').dispatch('click');
    assert.match(h.get('[data-contract-dialog-status]').textContent, /No pudimos consultar la constancia.*conexión/);
    assert.doesNotMatch(h.get('[data-contract-dialog-status]').textContent, /PRIVATE_|Failed to fetch|internal\.example/);
    assert.equal(h.get('[data-contract-evidence]').textContent, ''); assert.equal(h.get('[data-contract-evidence-section]').hidden, true);
    assert.equal(h.calls.filter(call => call.url.endsWith('/receipt')).length, 1); assert.equal(h.printed, 0); assert.equal(h.continued, 0);
  }
});

test('contract error translation preserves local field validation and explicit API conflict handling', async () => {
  const invalid = browser(); await invalid.controller.beforeCheckout(); invalid.fill(); invalid.fields.get('documentNumber').value = '';
  await invalid.submit();
  assert.equal(invalid.get('[data-contract-dialog-status]').textContent, 'Completa los datos declarados del contratante y su representante.');
  assert.equal(contractCalls(invalid, 'POST').length, 0);
  const conflict = browser({ post: () => reply({ error: { code: 'contract_changed' } }, 409) });
  await conflict.controller.beforeCheckout(); conflict.fill(); await conflict.submit();
  assert.match(conflict.get('[data-contract-dialog-status]').textContent, /El contrato o la oferta cambiaron/);
  assert.equal(conflict.continued, 0);
});

test('trial checkout translates uncertain responses without automatic navigation or changing the manual retry key', async () => {
  for (const failure of transportFailures) {
    const h = browser({ account: true, contract: () => reply(fixture({ accepted: true, contractId: id(3) })), checkout: failure });
    await h.login(); await h.click('contract-trial');
    assert.match(h.get('.account-status').textContent, /No pudimos confirmar la preparación del pago.*conexión.*Mi cuenta/);
    assert.doesNotMatch(h.get('.account-status').textContent, /PRIVATE_|Failed to fetch|internal\.example/);
    assert.equal(paymentCalls(h).length, 1); assert.equal(h.navigations.length, 0);
    const first = paymentCalls(h)[0]; await h.click('contract-trial');
    assert.equal(paymentCalls(h)[1].headers['idempotency-key'], first.headers['idempotency-key']);
    assert.equal(paymentCalls(h)[1].body, first.body); assert.equal(h.navigations.length, 0);
  }
});

test('trial checkout keeps explicit API rejection and its own response-validation message', async () => {
  for (const [checkoutResponse, expected] of [
    [reply({ error: { code: 'checkout_pending', message: 'Ya hay un pago pendiente para esta empresa.' } }, 409), 'Ya hay un pago pendiente para esta empresa.'],
    [reply({ ...checkout(), currency: 'USD' }), 'No pudimos verificar la prueba de tu suscripción. Actualiza Mi cuenta antes de continuar.'],
  ]) {
    const h = browser({ account: true, contract: () => reply(fixture({ accepted: true, contractId: id(3) })), checkout: () => checkoutResponse });
    await h.login(); await h.click('contract-trial');
    assert.equal(h.get('.account-status').textContent, expected); assert.equal(h.navigations.length, 0);
    assert.equal(paymentCalls(h).length, 1);
  }
});
