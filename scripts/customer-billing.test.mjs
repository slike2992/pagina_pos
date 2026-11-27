import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/customer-billing.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const tenant = '11111111-1111-4111-8111-111111111111';
const foreign = '22222222-2222-4222-8222-222222222222';
const payment = '33333333-3333-4333-8333-333333333333';
const accessToken = 'synthetic-access-token-for-header-only';
const receipt = (overrides = {}) => ({ paymentId: payment, tenantId: tenant, reference: 'QA-APPROVED-001',
  approvedAt: '2030-01-01T12:00:00.000Z', amountMinor: 4990000, currency: 'COP', status: 'paid',
  environment: 'test', availability: 'available', ...overrides });
const page = (receipts = [], nextBefore = null) => ({ receipts, nextBefore });
const preferences = (overrides = {}) => ({ version: 7, emailEnabled: true, whatsappConsent: false,
  preferredChannel: 'email', whatsappNumber: null, ...overrides });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const settle = async () => { for (let n = 0; n < 4; n++) await new Promise(resolve => setImmediate(resolve)); };

function harness(transport = () => { throw new Error('Unexpected transport'); }, options = {}) {
  const calls = [], clicked = [], created = [], revoked = [], events = [];
  let context = { tenantId: tenant, accessToken, session: {} }, unauthorized = 0;
  class Element {
    children = []; events = {}; hidden = false; disabled = false; textContent = ''; checked = false; value = '';
    constructor(tag = 'div') { this.tagName = tag; }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = [...nodes]; this.textContent = ''; }
    addEventListener(name, callback) { this.events[name] = callback; }
    async emit(name = 'click') { const event = { prevented: false, preventDefault() { this.prevented = true; } };
      await this.events[name]?.(event); await settle(); return event; }
    click() { clicked.push(this); }
  }
  const root = new Element(), panel = new Element(), status = new Element('p'), list = new Element();
  const more = new Element('button'), refresh = new Element('button'), form = new Element('form'), submit = new Element('button');
  const controls = Object.fromEntries(['emailEnabled', 'whatsappConsent', 'whatsappNumber', 'preferredChannel'].map(name => [name, new Element('input')]));
  form.elements = { namedItem: name => controls[name] };
  form.querySelector = selector => selector === '[type=submit]' ? submit : null;
  form.reset = () => { for (const control of Object.values(controls)) { control.checked = false; control.value = ''; } };
  root.querySelector = selector => selector === '[data-customer-billing]' ? panel : null;
  panel.querySelector = selector => ({ '[data-billing-status]': status, '[data-billing-receipts]': list,
    '[data-billing-more]': more, '[data-billing-preferences]': form, '[data-billing-refresh]': refresh })[selector] ?? null;
  const URLFacade = { createObjectURL: blob => { const url = 'blob:qa-' + (created.length + 1); created.push({ blob, url }); return url; },
    revokeObjectURL: url => { revoked.push(url); } };
  const exports = {};
  vm.runInNewContext(compiled, { exports, document: { createElement: tag => new Element(tag) }, URL: URLFacade,
    Intl, Date, fetch: async (url, options) => { calls.push({ url, options }); return transport(url, options, calls.length); } });
  const binding = exports.bindCustomerBilling(root, { apiUrl: 'https://api.example.invalid/', requestedPaymentId: options.requestedPaymentId, getContext: () => context,
    onUnauthorized: () => { unauthorized++; events.push('unauthorized'); context = null; binding.reset(); } });
  return { exports, binding, root, panel, list, status, more, refresh, form, submit, controls, calls, clicked, created, revoked, events,
    setContext(value) { context = value; }, getContext: () => context, unauthorized: () => unauthorized,
    buttons: () => {
      const descendants = node => [node, ...(node.children ?? []).flatMap(descendants)];
      return list.children.flatMap(descendants).filter(node => node.tagName === 'button');
    },
    text: () => list.children.flatMap(article => article.children).map(node => node.textContent).join(' ') };
}
function response(body, status = 200, extra = {}) {
  return { ok: status >= 200 && status < 300, status, headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body, blob: async () => { throw new Error('Not a PDF'); }, ...extra };
}
const defaultTransport = (receipts, prefs = preferences()) => url => response(url.endsWith('/communication-preferences') ? prefs : page(receipts));

test('receipt parser accepts only the selected tenant, including a whole-page foreign-row rejection', () => {
  const { exports } = harness();
  assert.equal(exports.readBillingReceipts(page([receipt({ tenantId: tenant.toUpperCase() })]), tenant).receipts.length, 1);
  for (const rows of [[receipt({ tenantId: foreign })], [receipt(), receipt({ tenantId: foreign })]])
    assert.throws(() => exports.readBillingReceipts(page(rows), tenant));
});

for (const state of ['pending', 'approved', 'declined', 'rejected', 'error', 'cancelled']) {
  test(`${state} is not a paid receipt: parser rejects it and UI cannot offer a PDF`, async () => {
    const b = harness(defaultTransport([receipt({ status: state })]));
    assert.throws(() => b.exports.readBillingReceipts(page([receipt({ status: state })]), tenant));
    await b.binding.refresh(); assert.equal(b.buttons().length, 0); assert.equal(b.list.children.length, 0);
    assert.match(b.status.textContent, /No pudimos completar/);
    assert.ok(b.calls.every(call => !call.url.endsWith('/pdf')));
  });
}

test('malformed amounts, dates, cursor, UUID, currency and oversized pages fail closed', () => {
  const { exports } = harness();
  for (const overrides of [{ paymentId: '../payment' }, { amountMinor: -1 }, { amountMinor: 1.5 },
    { amountMinor: Number.MAX_SAFE_INTEGER + 1 }, { approvedAt: 'not-a-date' }, { currency: 'USD' },
    { availability: 'pending' }, { environment: 'live' }, { reference: '' }])
    assert.throws(() => exports.readBillingReceipts(page([receipt(overrides)]), tenant));
  assert.throws(() => exports.readBillingReceipts(page(Array.from({ length: 51 }, () => receipt())), tenant));
  for (const cursor of ['', 'https://foreign.invalid/path', 'bad&token=private', {}, 42])
    assert.throws(() => exports.readBillingReceipts(page([], cursor), tenant));
});

test('foreign-tenant receipts never reach DOM even if mixed after a valid row', async () => {
  const b = harness(defaultTransport([receipt(), receipt({ tenantId: foreign, reference: 'FOREIGN-PRIVATE' })]));
  await b.binding.refresh(); assert.equal(b.list.children.length, 0); assert.equal(b.buttons().length, 0);
  assert.ok(!b.text().includes('FOREIGN-PRIVATE'));
});

test('historical unavailable receipt explains its limitation and has no PDF request or buttons', async () => {
  const b = harness(defaultTransport([receipt({ availability: 'unavailable' })]));
  await b.binding.refresh(); assert.equal(b.buttons().length, 0); assert.match(b.text(), /faltan datos verificables/);
  assert.ok(b.calls.every(call => !call.url.endsWith('/pdf')));
});

test('approved receipt displays Colombia/Sandbox details and obtains PDF using Authorization header only', async () => {
  const b = harness((url, options) => url.endsWith('/pdf')
    ? response(null, 200, { headers: new Headers({ 'content-type': 'application/pdf' }), blob: async () => ({ type: 'application/pdf' }) })
    : defaultTransport([receipt()])(url, options));
  await b.binding.refresh(); assert.equal(b.buttons().length, 2);
  assert.match(b.text(), /2030-01-01 07:00:00/); assert.match(b.text(), /Sandbox/);
  await b.buttons()[0].emit(); await b.buttons()[1].emit();
  assert.equal(b.clicked.length, 2); assert.equal(b.clicked[0].target, '_blank'); assert.equal(b.clicked[0].rel, 'noopener');
  assert.equal(b.clicked[1].download, `Soporte-${payment}.pdf`);
  for (const call of b.calls) {
    assert.equal(call.options.headers.Authorization, `Bearer ${accessToken}`); assert.equal(call.options.cache, 'no-store');
    const url = new URL(call.url); assert.equal(url.origin, 'https://api.example.invalid');
    assert.ok(!url.href.includes(accessToken)); assert.ok(!url.searchParams.has('token')); assert.ok(!url.searchParams.has('access_token'));
  }
  assert.ok(b.clicked.every(link => link.href.startsWith('blob:qa-')));
  b.binding.reset(); assert.equal(b.revoked.length, 2); assert.equal(b.panel.hidden, true);
});

test('JSON/HTML pretending to be PDF is rejected before reading blob or creating a URL', async () => {
  for (const contentType of ['application/json', 'text/html']) {
    let blobs = 0;
    const b = harness(url => url.endsWith('/pdf') ? response(null, 200, { headers: new Headers({ 'content-type': contentType }),
      blob: async () => { blobs++; return {}; } }) : defaultTransport([receipt()])(url));
    await b.binding.refresh(); await b.buttons()[0].emit();
    assert.equal(blobs, 0); assert.equal(b.created.length, 0); assert.equal(b.clicked.length, 0); assert.match(b.status.textContent, /No pudimos completar/);
  }
});

for (const changed of ['token', 'tenant', 'session', 'reset']) {
  test(`late 401 after ${changed} change cannot log out a new context or parse private body`, async () => {
    const pending = deferred(); let reads = 0;
    const b = harness(url => url.endsWith('/payment-receipts') ? pending.promise : response(preferences()));
    const loading = b.binding.refresh(); await settle(); const old = b.getContext();
    if (changed === 'reset') b.binding.reset();
    else b.setContext({ ...old, ...(changed === 'token' ? { accessToken: 'another-access-token' }
      : changed === 'tenant' ? { tenantId: foreign } : { session: {} }) });
    pending.resolve(response(null, 401, { json: async () => { reads++; throw new Error('private'); } }));
    await loading; assert.equal(reads, 0); assert.equal(b.unauthorized(), 0); assert.equal(b.list.children.length, 0);
  });
}

test('current 401 triggers unauthorized once, clears UI and never reads the private body', async () => {
  let reads = 0;
  const b = harness(() => response(null, 401, { json: async () => { reads++; return { private: accessToken }; } }));
  await b.binding.refresh(); assert.equal(b.unauthorized(), 1); assert.equal(reads, 0); assert.equal(b.panel.hidden, true);
  assert.equal(b.list.children.length, 0); assert.equal(b.status.textContent, '');
});

test('a PDF blob delayed past tenant switch cannot be opened, downloaded or retained', async () => {
  const pending = deferred();
  const b = harness(url => url.endsWith('/pdf') ? response(null, 200, { headers: new Headers({ 'content-type': 'application/pdf' }),
    blob: () => pending.promise }) : defaultTransport([receipt()])(url));
  await b.binding.refresh(); const opening = b.buttons()[0].emit(); await settle();
  b.setContext({ tenantId: foreign, accessToken: 'foreign-token', session: {} }); b.binding.reset();
  pending.resolve({ type: 'application/pdf' }); await opening;
  assert.equal(b.created.length, 0); assert.equal(b.clicked.length, 0); assert.equal(b.status.textContent, '');
});

test('preferences require the exact server version, keep WhatsApp opt-in separate, and rotate only to returned version', async () => {
  let writes = 0;
  const b = harness((url, options) => options?.method === 'PUT'
    ? response(preferences({ version: 8 + writes++ })) : defaultTransport([])(url));
  await b.binding.refresh();
  assert.equal(b.controls.whatsappConsent.checked, false); assert.equal(b.controls.whatsappNumber.value, '');
  assert.equal((await b.form.emit('submit')).prevented, true);
  let write = b.calls.find(call => call.options.method === 'PUT');
  assert.deepEqual(JSON.parse(write.options.body), { expectedVersion: 7, emailEnabled: true, preferredChannel: 'email', whatsappConsent: false, whatsappNumber: null });
  b.controls.whatsappConsent.checked = true; b.controls.whatsappNumber.value = '+573215550123'; b.controls.preferredChannel.value = 'whatsapp';
  await b.form.emit('submit'); write = b.calls.filter(call => call.options.method === 'PUT').at(-1);
  assert.deepEqual(JSON.parse(write.options.body), { expectedVersion: 8, emailEnabled: true, preferredChannel: 'whatsapp', whatsappConsent: true, whatsappNumber: '+573215550123' });
  assert.equal(write.options.headers.Authorization, `Bearer ${accessToken}`); assert.equal(write.options.headers['Content-Type'], 'application/json');
  assert.ok(!write.url.includes(accessToken) && !write.url.includes('573215550123'));
  assert.match(b.status.textContent, /Preferencias guardadas/);
});

test('no preferences write before version is loaded or after reset; malformed versions never enable a write', async () => {
  const b = harness(defaultTransport([])); await b.form.emit('submit'); assert.equal(b.calls.length, 0);
  await b.binding.refresh(); b.binding.reset(); await b.form.emit('submit'); assert.equal(b.calls.filter(call => call.options.method === 'PUT').length, 0);
  for (const version of [-1, 0.5, '7', Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => b.exports.readBillingPreferences(preferences({ version })));
  assert.equal(b.exports.readBillingPreferences(preferences({ version: 0 })).version, 0);
});

test('unconsented WhatsApp and invalid numbers are rejected locally without PUT or implicit opt-in', async () => {
  const b = harness(defaultTransport([])); await b.binding.refresh();
  b.controls.preferredChannel.value = 'whatsapp'; await b.form.emit('submit');
  assert.equal(b.controls.whatsappConsent.checked, false); assert.match(b.status.textContent, /Autoriza WhatsApp/);
  b.controls.whatsappConsent.checked = true; b.controls.whatsappNumber.value = '3215550123'; await b.form.emit('submit');
  assert.equal(b.calls.filter(call => call.options.method === 'PUT').length, 0); assert.equal(b.submit.disabled, false);
});

test('late preferences success/401 after a new session cannot publish success or clear its authentication', async () => {
  for (const httpStatus of [200, 401]) {
    const pending = deferred();
    const b = harness((url, options) => options?.method === 'PUT' ? pending.promise : defaultTransport([])(url));
    await b.binding.refresh(); const saving = b.form.emit('submit'); await settle();
    b.setContext({ tenantId: foreign, accessToken: 'new-token', session: {} }); b.binding.reset();
    pending.resolve(response(preferences({ version: 99 }), httpStatus)); await saving;
    assert.equal(b.unauthorized(), 0); assert.equal(b.status.textContent, ''); assert.equal(b.panel.hidden, true);
  }
});

test('pagination deduplicates receipts and transmits only the opaque cursor, never tenant/token URLs', async () => {
  const b = harness(url => url.includes('?before=') ? response(page([receipt(), receipt({ paymentId: foreign, reference: 'QA-SECOND' })]))
    : url.endsWith('/communication-preferences') ? response(preferences()) : response(page([receipt()], 'opaque_cursor-2')));
  await b.binding.refresh(); assert.equal(b.more.hidden, false); await b.more.emit();
  assert.equal(b.list.children.length, 2); assert.equal(b.more.hidden, true);
  const call = b.calls.find(call => call.url.includes('?before=')); assert.equal(new URL(call.url).search, '?before=opaque_cursor-2');
  assert.equal(call.options.headers.Authorization, `Bearer ${accessToken}`); assert.ok(!call.url.includes(tenant) && !call.url.includes(accessToken));
});

const olderPayment = '44444444-4444-4444-8444-444444444444';
const olderReceipt = overrides => receipt({ paymentId: olderPayment, reference: 'QA-OLDER-RECEIPT', approvedAt: '2029-11-01T12:00:00Z', ...overrides });
const olderPath = '/v1/me/payment-receipts/' + olderPayment;

test('email link fetches an older receipt absent from page one without scanning pages or auto-fetching PDF', async () => {
  const b = harness(url => url.endsWith('/communication-preferences') ? response(preferences())
    : url.endsWith(olderPath) ? response(olderReceipt())
    : url.includes('?before=') ? response(page([olderReceipt()]))
    : response(page([receipt()], 'older_cursor')), { requestedPaymentId: olderPayment });
  await b.binding.refresh();
  assert.equal(b.list.children.length, 2); assert.match(b.text(), /QA-OLDER-RECEIPT/); assert.match(b.text(), /2029-11-01 07:00:00/);
  assert.equal(b.calls.filter(call => call.url.endsWith(olderPath)).length, 1);
  assert.ok(b.calls.every(call => !call.url.includes('?before=') && !call.url.endsWith('/pdf')));
  const request = b.calls.find(call => call.url.endsWith(olderPath));
  assert.equal(request.options.headers.Authorization, `Bearer ${accessToken}`); assert.equal(request.options.cache, 'no-store');
  assert.ok(!request.url.includes(accessToken) && !request.url.includes(tenant));
  assert.equal(b.more.hidden, false); await b.more.emit();
  assert.equal(new URL(b.calls.at(-1).url).search, '?before=older_cursor');
  assert.equal(b.list.children.length, 2, 'pagination must not duplicate the directly loaded receipt');
});

test('an already visible requested receipt needs no detail request; invalid IDs never enter a request path', async () => {
  for (const requestedPaymentId of [payment, '../payment', olderPayment + '?token=private', 'not-a-uuid']) {
    const b = harness(defaultTransport([receipt()]), { requestedPaymentId }); await b.binding.refresh();
    assert.equal(b.calls.length, 2); assert.equal(b.list.children.length, 1);
    assert.ok(b.calls.every(call => call.url.endsWith('/payment-receipts') || call.url.endsWith('/communication-preferences')));
  }
});

test('older detail from a foreign tenant cannot render its text or PDF controls', async () => {
  const b = harness(url => url.endsWith(olderPath) ? response(olderReceipt({ tenantId: foreign, reference: 'FOREIGN-OLDER-PRIVATE' }))
    : defaultTransport([receipt()])(url), { requestedPaymentId: olderPayment });
  await b.binding.refresh(); assert.equal(b.list.children.length, 1); assert.equal(b.buttons().length, 2);
  assert.ok(!b.text().includes('FOREIGN-OLDER-PRIVATE')); assert.match(b.status.textContent, /No pudimos completar/);
  assert.ok(b.calls.every(call => !call.url.endsWith('/pdf')));
});

test('older detail must match the requested payment ID even when the response tenant matches', async () => {
  const b = harness(url => url.endsWith(olderPath) ? response(receipt({ paymentId: foreign, reference: 'WRONG-PAYMENT-DETAIL' }))
    : defaultTransport([receipt()])(url), { requestedPaymentId: olderPayment });
  await b.binding.refresh(); assert.equal(b.list.children.length, 1);
  assert.ok(!b.text().includes('WRONG-PAYMENT-DETAIL')); assert.match(b.status.textContent, /No pudimos completar/);
});

test('empty first page followed by a valid linked older receipt does not retain the no-payments message', async () => {
  const b = harness(url => url.endsWith(olderPath) ? response(olderReceipt()) : defaultTransport([])(url), { requestedPaymentId: olderPayment });
  await b.binding.refresh(); assert.equal(b.list.children.length, 1); assert.match(b.text(), /QA-OLDER-RECEIPT/);
  assert.doesNotMatch(b.list.textContent, /Aún no hay pagos/);
});

test('unavailable or missing linked older receipts never trigger PDF and preserve the current tenant list', async () => {
  for (const status of [200, 404]) {
    const b = harness(url => url.endsWith(olderPath) ? response(olderReceipt({ availability: 'unavailable' }), status)
      : defaultTransport([receipt()])(url), { requestedPaymentId: olderPayment });
    await b.binding.refresh(); assert.equal(b.buttons().length, 2);
    assert.ok(b.calls.every(call => !call.url.endsWith('/pdf')));
    if (status === 200) assert.match(b.text(), /faltan datos verificables/);
    else { assert.equal(b.list.children.length, 1); assert.match(b.status.textContent, /No pudimos completar/); }
  }
});

test('late linked detail 401 or JSON after switching tenant cannot log out or repopulate the new account', async () => {
  for (const phase of ['response', 'json']) {
    const pending = deferred(); let detailReads = 0;
    const b = harness(url => url.endsWith(olderPath)
      ? phase === 'response' ? pending.promise : response(null, 200, { json: () => pending.promise })
      : defaultTransport([receipt()])(url), { requestedPaymentId: olderPayment });
    const loading = b.binding.refresh(); await settle();
    assert.equal(b.calls.filter(call => call.url.endsWith(olderPath)).length, 1);
    b.setContext({ tenantId: foreign, accessToken: 'replacement-token', session: {} }); b.binding.reset();
    pending.resolve(phase === 'response' ? response(null, 401, { json: async () => { detailReads++; return olderReceipt(); } }) : olderReceipt());
    await loading; assert.equal(detailReads, 0); assert.equal(b.unauthorized(), 0);
    assert.equal(b.list.children.length, 0); assert.equal(b.status.textContent, ''); assert.equal(b.panel.hidden, true);
  }
});

// Execute the real account login callback in isolation. The API returns its
// explicit selection challenge; the fixture neither authenticates nor invents
// an account merely because the email URL contains a tenant hint.
const accountSource = await readFile(new URL('../src/pages/cuenta.astro', import.meta.url), 'utf8');
const accountScript = accountSource.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const accountAst = ts.createSourceFile('cuenta.ts', accountScript, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
let loginCallback;
const visit = node => {
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
    && node.expression.expression.getText(accountAst) === 'loginForm' && node.expression.name.text === 'addEventListener'
    && node.arguments[0]?.text === 'submit') loginCallback = node.arguments[1];
  ts.forEachChild(node, visit);
};
visit(accountAst); assert.ok(loginCallback, 'account login callback must be found');
const loginCode = ts.transpileModule('let loginGeneration = 0; export const login = ' + loginCallback.getText(accountAst) + ';',
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
async function loginHint(query, explicitTenant) {
  const calls = [], exports = {}, field = { hidden: explicitTenant === undefined }, choices = [];
  const data = { email: 'owner@example.invalid', password: 'Synthetic-Password-Only-123', tenantId: explicitTenant ?? '' };
  const context = { exports, apiUrl: 'https://api.example.invalid', legalLink: new URLSearchParams(query),
    customerContract: { reset() {} }, customerSupport: { reset() {} }, customerBilling: { reset() {} },
    loginForm: { querySelector: () => ({ disabled: false }) }, loginStatus: { textContent: '', dataset: {} },
    tenantField: field, tenantSelect: { replaceChildren: (...options) => choices.push(...options) },
    FormData: class { get(key) { return data[key] ?? null; } }, Option: class { constructor(label, value) { this.label = label; this.value = value; } },
    requestResult: operation => operation(), fetch: async (url, options) => {
      calls.push({ url, options }); return response({ error: { code: 'tenant_selection_required' }, tenants: [{ tenantId: tenant, name: 'Own tenant' }] }, 409);
    }
  };
  vm.runInNewContext(loginCode, context); await exports.login({ preventDefault() {} });
  assert.equal(calls.length, 1); assert.equal(calls[0].url, 'https://api.example.invalid/v1/auth/login');
  assert.equal(field.hidden, false); assert.equal(choices[0].value, tenant);
  return JSON.parse(calls[0].options.body);
}

test('a single valid email tenant hint enters login JSON only and still requires the API membership challenge', async () => {
  const body = await loginHint(`paymentReceipt=${olderPayment}&tenantId=${tenant}`);
  assert.equal(body.tenantId, tenant); assert.equal(body.email, 'owner@example.invalid');
  assert.equal(body.password, 'Synthetic-Password-Only-123'); assert.ok(!('paymentReceipt' in body));
});

test('duplicate or malformed tenant hints are ignored; account credentials cannot be injected from the URL', async () => {
  for (const query of [`tenantId=${tenant}&tenantId=${foreign}`, 'tenantId=../other', 'tenantId=', `paymentReceipt=${olderPayment}`,
    'tenantId=invalid&email=foreign@example.invalid&password=URL-injected']) {
    const body = await loginHint(query); assert.ok(!('tenantId' in body));
    assert.equal(body.email, 'owner@example.invalid'); assert.equal(body.password, 'Synthetic-Password-Only-123');
  }
});

test('the explicitly selected company takes precedence over a different email tenant hint', async () => {
  const body = await loginHint(`paymentReceipt=${olderPayment}&tenantId=${foreign}`, tenant);
  assert.equal(body.tenantId, tenant);
});
