import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
const source = await readFile(new URL('../src/lib/customer-support.ts', import.meta.url), 'utf8');
const markup = await readFile(new URL('../src/components/CustomerSupport.astro', import.meta.url), 'utf8');
const account = await readFile(new URL('../src/pages/cuenta.astro', import.meta.url), 'utf8');
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const modules = new Map(await Promise.all(['customer-support', 'account-plans', 'subscription-trial', 'subscription-upgrade', 'subscription-recovery', 'checkout-return', 'portal-return'].map(async name => [name, compile(await readFile(new URL(`../src/lib/${name}.ts`, import.meta.url), 'utf8'))])));
const accountCode = compile(account.match(/<script>([\s\S]*?)<\/script>/)[1]);
const id = n => `${String(n).padStart(8, '0')}-1111-4111-8111-111111111111`;
const scope = { tenantId: id(1), principalId: id(2) };
const receipt = (extra = {}) => ({ caseId: id(3), ...scope, kind: 'support', receivedAt: '2026-11-25T15:00:00.000Z', firstResponseDueAt: '2026-11-27T15:00:00.000Z', initialDueAt: null, maximumDueAt: null, calendar: 'CO-test-calendar-v1', timeZone: 'America/Bogota', ...extra });
const summary = (extra = {}) => ({ receipt: receipt(), version: 1, status: 'received', assignedTo: null, dueAt: null, extendedAt: null, firstResponseAt: null, resolvedAt: null, ...extra });
const detail = (extra = {}) => ({ ...summary(), content: 'Contenido privado <img src=x onerror=alert(1)>', events: [{ eventId: id(4), type: 'received', occurredAt: receipt().receivedAt, actorPrincipalId: id(2), message: null, dueAt: null }], ...extra });
const reply = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const flush = () => new Promise(resolve => setImmediate(resolve));
const plain = value => JSON.parse(JSON.stringify(value));
function browser(options = {}) {
  const elements = new Map(), calls = [], navigations = [];
  const get = selector => { if (!elements.has(selector)) elements.set(selector, element()); return elements.get(selector); };
  const document = { querySelector: get, createElement: () => element() };
  function element() {
    const listeners = new Map(), attrs = new Map();
    return { textContent: '', value: '', checked: false, hidden: false, disabled: false, children: [], dataset: {}, ownerDocument: document,
      querySelector: get, reportValidity: () => true, reset() {}, focus() {}, showModal() {}, close() {},
      addEventListener(name, callback) { const callbacks = listeners.get(name) ?? []; callbacks.push(callback); listeners.set(name, callbacks); },
      async dispatch(name) { for (const callback of listeners.get(name) ?? []) await callback({ preventDefault() {} }); },
      setAttribute(key, value) { attrs.set(key, value); }, getAttribute: key => attrs.get(key) ?? null, removeAttribute(key) { attrs.delete(key); if (key === 'href') delete this.href; },
      replaceChildren(...nodes) { this.children = nodes; }, appendChild(node) { this.children.push(node); },
    };
  }
  const kind = element(), content = element(), form = get('[data-support-form]');
  form.elements = { namedItem: name => ({ kind, content })[name] }; form.reset = () => { kind.value = ''; content.value = ''; };
  get('#account').dataset = { apiUrl: 'https://api.example.invalid', posUrl: 'https://pos.example.invalid' };
  let context = { accessToken: 'token-1', ...scope, session: {} }, keys = 0, logins = 0, unauthorized = 0;
  let tenant = { tenantId: id(1), name: 'Empresa 1', role: options.role ?? 'owner', status: 'active' };
  const subscription = { subscriptionId: id(7), status: 'trialing', plan: { code: 'professional', name: 'Profesional' }, price: { amountMinor: 100000, currency: 'COP', billingInterval: 'monthly' }, currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false,
    trial: { status: 'active', durationDays: 15, startsAt: '2026-11-20T00:00:00Z', endsAt: '2026-12-05T00:00:00Z', convertedAt: null, canConvert: true } };
  const sandbox = { URL, URLSearchParams, Date, Intl, Error, console, document,
    crypto: { randomUUID: () => id(100 + ++keys) },
    window: { location: { href: 'https://web.example.invalid/cuenta', origin: 'https://web.example.invalid', assign: url => navigations.push(url) } },
    FormData: class { get(name) { return { email: 'qa@example.invalid', password: 'synthetic' }[name] ?? null; } },
    Option: class { constructor(text, value) { this.text = text; this.value = value; } },
    localStorage: { getItem() { assert.fail('No persistent support data'); }, setItem() { assert.fail('No PII storage'); } },
    sessionStorage: { getItem() { assert.fail('No support session storage'); }, setItem() { assert.fail('No support session storage'); } },
    async fetch(url, init = {}) {
      const call = { url, method: init.method ?? 'GET', ...plain(init) }; calls.push(call); const route = new URL(url).pathname;
      if (route === '/v1/auth/login') { logins++; tenant = { ...tenant, tenantId: logins === 1 ? id(1) : id(10), name: `Empresa ${logins}` }; return reply({ accessToken: `token-${logins}`, principal: { principalId: id(2), displayName: 'QA' }, tenant }); }
      if (route === '/v1/me/subscription') return reply(structuredClone(subscription));
      if (route === '/v1/me/tenants') return reply({ activeTenantId: tenant.tenantId, tenants: [tenant] });
      if (route === '/v1/public/plans') return reply({}, 503);
      if (route === '/v1/auth/pos-sso') return reply({ redirectUrl: 'https://pos.example.invalid/auth/sso?ticket=qa' });
      if (route === '/v1/me/subscription/trial-checkout') return reply({ orderId: id(8), checkoutSessionId: id(9), provider: 'wompi', amountInCents: 100000, currency: 'COP', expirationTime: '2099-01-01T00:00:00Z', checkoutUrl: `https://checkout.wompi.co/p/?reference=QA&redirect-url=${encodeURIComponent(`https://web.example.invalid/pago/resultado?checkoutSessionId=${id(9)}`)}` });
      if (route === '/v1/me/legal-support/cases') {
        if (call.method === 'POST') return options.post ? options.post(call, logins) : reply(receipt({ kind: JSON.parse(call.body).kind }));
        return options.list ? options.list(call, logins) : reply({ items: options.items ?? [], nextBefore: null });
      }
      if (route.startsWith('/v1/me/legal-support/cases/')) return options.detail ? options.detail(call, logins) : reply(detail());
      assert.fail(`Unexpected request ${route}`);
    },
  };
  sandbox.location = sandbox.window.location;
  const vmContext = vm.createContext(sandbox), cache = new Map();
  const load = name => {
    const key = name.split('/').at(-1);
    if (key === 'customer-contract') return { bindCustomerContract: () => ({ reset() {}, refresh() {}, beforeCheckout: async () => true, canContinue: () => true }) };
    if (key === 'client-idempotency') return { createIdempotencyKey: () => sandbox.crypto.randomUUID() };
    if (key === 'wompi-client') return { prepareWompiSession() { assert.fail('No provider calls'); } };
    if (cache.has(key)) return cache.get(key); assert.ok(modules.has(key), name);
    const exports = {}; cache.set(key, exports); vm.runInContext(`(function(exports,require){${modules.get(key)}\n})`, vmContext)(exports, load); return exports;
  };
  const helper = load('customer-support'); let controller;
  if (options.account) vm.runInContext(`(function(exports,require){${accountCode}\n})`, vmContext)({}, load);
  else controller = helper.bindCustomerSupport(get('#account'), { apiUrl: 'https://api.example.invalid', getContext: () => context, onUnauthorized: () => { unauthorized++; context = null; } });
  return { helper, controller, calls, navigations, get, kind, content, get unauthorized() { return unauthorized; },
    setContext(value) { context = value; }, fill(type = 'support', value = 'Necesito ayuda con esta cuenta.') { kind.value = type; content.value = value; },
    async login() { await get('#login-form').dispatch('submit'); await flush(); },
    async submit() { await form.dispatch('submit'); await flush(); },
    async click(action) { await get(`[data-action='${action}']`).dispatch('click'); await flush(); },
    async open(index = 0) { await get('[data-support-list]').children[index].children[0].dispatch('click'); await flush(); },
  };
}
const writes = h => h.calls.filter(call => call.method === 'POST' && call.url.endsWith('/legal-support/cases'));
const text = node => [node.textContent, ...node.children.map(text)].join('\n');

test('form exposes three kinds, content minimum/maximum, privacy warning, and both published fallback emails', () => {
  assert.equal(/innerHTML|insertAdjacentHTML|localStorage|sessionStorage|Date\.now|setInterval/.test(source), false);
  for (const expected of ['value="support"', 'value="data_query"', 'value="data_claim"', 'minlength="8"', 'maxlength="8000"', 'tokens', 'documentos de identidad', 'mailto:legal@cripton.com.co', 'mailto:servicioalcliente@cripton.com.co']) assert.ok(markup.includes(expected));
  assert.equal(/type="file"|type="checkbox"/.test(markup), false);
});

for (const kind of ['support', 'data_query', 'data_claim']) test(`explicit ${kind} submit sends only kind/content and shows the server receipt`, async () => {
  const h = browser(); assert.equal(h.calls.length, 0); await h.controller.refresh(); assert.equal(writes(h).length, 0);
  h.fill(kind, '  Descripción necesaria  '); await h.submit();
  assert.deepEqual(JSON.parse(writes(h)[0].body), { kind, content: 'Descripción necesaria' });
  assert.equal(writes(h)[0].headers.authorization, 'Bearer token-1'); assert.ok(writes(h)[0].headers['idempotency-key'].length >= 16);
  assert.equal(h.get('[data-support-created]').hidden, false); assert.ok(text(h.get('[data-support-created-receipt]')).includes(id(3)));
  assert.match(text(h.get('[data-support-created-receipt]')), /27 de noviembre de 2026.*10:00 \(Bogotá\)/);
  assert.equal(h.content.value, ''); assert.equal(h.kind.value, '');
  for (const call of h.calls) { assert.equal(call.cache, 'no-store'); assert.equal(call.credentials, 'omit'); assert.equal(call.redirect, 'error'); }
});

test('content limits apply to trimmed input and invalid kinds never POST', async () => {
  const h = browser(); await h.controller.refresh();
  for (const [kind, content] of [['', 'contenido válido'], ['forged', 'contenido válido'], ['support', '       '], ['support', '1234567'], ['support', 'a'.repeat(8001)]]) { h.fill(kind, content); await h.submit(); }
  assert.equal(writes(h).length, 0);
  assert.equal(h.helper.createSupportRequest('support', ' a'.repeat(4000)).content.length, 7999);
  assert.equal(h.helper.createSupportRequest('support', 'a'.repeat(8000)).content.length, 8000);
});

test('deadlines remain exactly the supplied instants in Bogota, including extension, responses and null final deadline', async () => {
  const r = receipt({ kind: 'data_claim', initialDueAt: '2026-12-10T15:00:00Z', maximumDueAt: '2026-12-20T15:00:00Z' });
  const d = detail({ receipt: r, status: 'in_progress', version: 3, dueAt: '2026-12-18T15:00:00Z', extendedAt: '2026-12-01T15:00:00Z', firstResponseAt: '2026-11-26T15:00:00Z', events: [
    { eventId: id(5), type: 'extended', occurredAt: '2026-12-01T15:00:00Z', actorPrincipalId: id(6), message: 'Motivo de prórroga del servidor', dueAt: '2026-12-18T15:00:00Z' },
    { eventId: id(6), type: 'replied', occurredAt: '2026-12-02T15:00:00Z', actorPrincipalId: id(6), message: 'Respuesta <script>alert(1)</script>', dueAt: null },
  ] });
  const h = browser({ items: [summary({ receipt: r })], detail: () => reply(d) }); await h.controller.refresh(); await h.open();
  const output = text(h.get('[data-support-detail-content]'));
  for (const expected of ['18 de diciembre de 2026', '20 de diciembre de 2026', '10:00 (Bogotá)', 'Motivo de prórroga del servidor', 'Respuesta <script>alert(1)</script>', 'Contenido privado <img src=x onerror=alert(1)>', 'En trámite', 'Versión: 3']) assert.ok(output.includes(expected));
  assert.equal(h.helper.supportDate(null), 'No informado por el servidor');
});

test('pagination uses only the server cursor and prevents duplicate in-flight loads', async () => {
  const waiting = Promise.withResolvers(); let reads = 0;
  const h = browser({ list: () => ++reads === 1 ? reply({ items: [summary()], nextBefore: id(3) }) : waiting.promise }); await h.controller.refresh();
  const first = h.get('[data-support-more]').dispatch('click'), second = h.get('[data-support-more]').dispatch('click'); await flush();
  assert.equal(reads, 2); assert.ok(h.calls[1].url.endsWith(`?limit=25&before=${id(3)}`));
  waiting.resolve(reply({ items: [summary({ receipt: receipt({ caseId: id(7) }) })], nextBefore: null })); await Promise.all([first, second]); await flush();
  assert.equal(h.get('[data-support-list]').children.length, 2); assert.equal(h.get('[data-support-more]').hidden, true);
});

for (const role of ['owner', 'member']) test(`real ${role} account sees only own cases without management routes or forged principal/tenant filters`, async () => {
  const h = browser({ account: true, role, items: [summary()] }); await h.login(); await h.open();
  assert.equal(h.get('[data-customer-support]').hidden, false); assert.equal(h.get('[data-support-detail]').hidden, false);
  for (const call of h.calls.filter(call => call.url.includes('legal-support'))) {
    assert.ok(call.url.includes('/v1/me/legal-support/cases')); assert.equal(new URL(call.url).searchParams.has('principalId'), false); assert.equal(new URL(call.url).searchParams.has('tenantId'), false);
  }
  await h.click('open-pos'); assert.equal(h.navigations[0], 'https://pos.example.invalid/auth/sso?ticket=qa');
});

for (const mismatch of [{ tenantId: id(50) }, { principalId: id(50) }]) test(`foreign case data is rejected instead of filtering or rendering it: ${JSON.stringify(mismatch)}`, async () => {
  const h = browser({ items: [summary({ receipt: receipt(mismatch) })] }); await h.controller.refresh();
  assert.equal(h.get('[data-support-list]').children.length, 0); assert.ok(h.get('[data-support-status]').textContent.includes('No pudimos verificar'));
  assert.throws(() => h.helper.readSupportDetail(detail({ receipt: receipt(mismatch) }), scope, id(3)));
});

test('support 503 with top-level error shows fallback guidance and cannot block the real trial checkout or POS', async () => {
  const h = browser({ account: true, list: () => reply({ code: 'legal_support_unavailable' }, 503) }); await h.login();
  assert.ok(h.get('[data-support-status]').textContent.includes('correos de soporte o legal'));
  assert.equal(h.get('.account-panel').hidden, false); await h.click('contract-trial');
  assert.equal(h.calls.filter(call => call.url.endsWith('/trial-checkout')).length, 1); assert.equal(h.navigations.length, 1);
  const pos = browser({ account: true, list: () => reply({ code: 'legal_support_unavailable' }, 503) }); await pos.login(); await pos.click('open-pos'); assert.equal(pos.navigations.length, 1);
});

test('POST is single-flight and retries identical content with the same idempotency key after an ambiguous failure', async () => {
  const waiting = Promise.withResolvers(); let attempts = 0;
  const h = browser({ post: () => ++attempts === 1 ? waiting.promise : reply({}, 503) }); await h.controller.refresh(); h.fill();
  const first = h.submit(), second = h.submit(); await flush(); assert.equal(writes(h).length, 1);
  waiting.resolve(reply({ code: 'legal_support_unavailable' }, 503)); await Promise.all([first, second]);
  await h.submit(); assert.equal(writes(h)[0].headers['idempotency-key'], writes(h)[1].headers['idempotency-key']);
  h.content.value = 'Descripción corregida para atenderme.'; await h.submit();
  assert.notEqual(writes(h)[1].headers['idempotency-key'], writes(h)[2].headers['idempotency-key']);
  assert.equal(h.get('[data-support-created]').hidden, true);
});

for (const [code, expected, status] of [['legal_support_invalid_request', '8 y 8.000', 400], ['legal_support_not_found', 'no está disponible para esta cuenta', 404], ['legal_support_forbidden', 'No tienes permiso', 403], ['legal_support_idempotency_conflict', 'otro contenido', 409]]) test(`top-level ${code} is handled without trusting arbitrary server messages`, async () => {
  const h = browser({ post: () => reply({ code, message: 'sensitive server data' }, status) }); await h.controller.refresh(); h.fill(); await h.submit();
  assert.ok(h.get('[data-support-status]').textContent.includes(expected)); assert.equal(h.get('[data-support-status]').textContent.includes('sensitive'), false);
});

for (const method of ['list', 'detail', 'POST']) test(`late ${method} after logout and another tenant cannot restore private text or receipts`, async () => {
  const waiting = Promise.withResolvers();
  const h = browser({ account: true, list: (_call, login) => method === 'list' && login === 1 ? waiting.promise : reply({ items: login === 1 ? [summary()] : [], nextBefore: null }), detail: () => waiting.promise, post: () => waiting.promise });
  await h.login(); let pending;
  if (method === 'detail') pending = h.open();
  if (method === 'POST') { h.fill(); pending = h.submit(); }
  await flush(); await h.click('logout'); assert.equal(h.content.value, ''); assert.equal(h.get('[data-support-list]').children.length, 0);
  await h.login(); waiting.resolve(reply(method === 'list' ? { items: [summary()], nextBefore: null } : method === 'detail' ? detail() : receipt()));
  await pending; await flush();
  assert.equal(h.get("[data-field='tenant-name']").textContent, 'Empresa 2'); assert.equal(h.get('[data-support-list]').children.length, 0);
  assert.equal(h.get('[data-support-detail-content]').children.length, 0); assert.equal(h.get('[data-support-created]').hidden, true);
});

test('refresh invalidates pending POST and clears form/private detail without adding browser state', async () => {
  const waiting = Promise.withResolvers(); const h = browser({ account: true, items: [summary()], post: () => waiting.promise });
  await h.login(); h.fill('data_query', 'Datos privados declarados'); const pending = h.submit(); await flush();
  await h.click('refresh-recovery'); assert.equal(h.content.value, '');
  waiting.resolve(reply(receipt({ kind: 'data_query' }))); await pending;
  assert.equal(h.get('[data-support-created]').hidden, true); assert.equal(h.get('[data-support-detail-content]').children.length, 0);
});

test('401 signs out only the matching session before reading JSON; a stale 401 cannot sign out a new account', async () => {
  const h = browser({ list: () => ({ ok: false, status: 401, json() { assert.fail('401 JSON'); } }) }); await h.controller.refresh();
  assert.equal(h.unauthorized, 1); assert.equal(h.get('[data-customer-support]').hidden, true);
  const waiting = Promise.withResolvers(); const current = browser({ account: true, list: (_call, login) => login === 1 ? waiting.promise : reply({ items: [], nextBefore: null }) });
  await current.login(); await current.click('logout'); await current.login();
  waiting.resolve({ ok: false, status: 401, json() { assert.fail('stale JSON'); } }); await flush();
  assert.equal(current.get('.account-panel').hidden, false);
});

test('malformed DTOs, wrong detail id and foreign creation receipt never expose receipt/content', async () => {
  const h = browser();
  for (const bad of [{ items: [summary({ version: 0 })], nextBefore: null }, { items: [summary({ receipt: receipt({ timeZone: 'UTC' }) })], nextBefore: null }, { items: [], nextBefore: 'forged' }, { items: [summary({ dueAt: 'invalid' })], nextBefore: null }]) assert.throws(() => h.helper.readSupportPage(bad, scope));
  assert.throws(() => h.helper.readSupportDetail(detail(), scope, id(99)));
  const foreign = browser({ post: () => reply(receipt({ principalId: id(99) })) }); await foreign.controller.refresh(); foreign.fill(); await foreign.submit();
  assert.equal(foreign.get('[data-support-created]').hidden, true);
});

test('a malformed successful JSON response is reported and never leaves a fictitious loading or receipt state', async () => {
  const h = browser({ list: () => reply(null) }); await h.controller.refresh();
  assert.ok(h.get('[data-support-status]').textContent.includes('No pudimos verificar'));
  assert.equal(h.get('[data-support-fields]').disabled, true); assert.equal(h.get('[data-support-refresh]').disabled, false);
  assert.equal(h.get('[data-support-created]').hidden, true);
});
