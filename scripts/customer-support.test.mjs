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
  const document = { querySelector: get, createElement: tag => element(tag) };
  function element(tag = "div") {
    const listeners = new Map(), attrs = new Map();
    return { tagName: tag.toUpperCase(), textContent: '', value: '', checked: false, hidden: false, disabled: false, children: [], dataset: {}, ownerDocument: document,
      querySelector: get, reportValidity: () => true, reset() {}, focus() {}, showModal() {}, close() {},
      addEventListener(name, callback) { const callbacks = listeners.get(name) ?? []; callbacks.push(callback); listeners.set(name, callbacks); },
      async dispatch(name) { for (const callback of listeners.get(name) ?? []) await callback({ preventDefault() {} }); },
      setAttribute(key, value) { attrs.set(key, value); }, getAttribute: key => attrs.get(key) ?? null, removeAttribute(key) { attrs.delete(key); if (key === 'href') delete this.href; },
      replaceChildren(...nodes) { this.children = nodes; }, appendChild(node) { this.children.push(node); },
    };
  }
  const kind = element(), content = element(), form = get('[data-support-form]');
  form.elements = { namedItem: name => ({ kind, content })[name] }; form.reset = () => { kind.value = ''; content.value = ''; };
  const completionContent = element(), completionForm = get('[data-support-completion-form]');
  completionForm.elements = { namedItem: name => name === 'content' ? completionContent : null };
  completionForm.reset = () => { completionContent.value = ''; };
  get('#account').dataset = { apiUrl: 'https://api.example.invalid', posUrl: 'https://pos.example.invalid' };
  let context = { accessToken: 'token-1', ...scope, session: {} }, keys = 0, logins = 0, unauthorized = 0;
  let tenant = { tenantId: id(1), name: 'Empresa 1', role: options.role ?? 'owner', status: 'active' };
  const subscription = { subscriptionId: id(7), status: 'trialing', plan: { code: 'professional', name: 'Profesional' }, price: { amountMinor: 100000, currency: 'COP', billingInterval: 'monthly' }, currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false,
    trial: { status: 'active', durationDays: 15, startsAt: '2026-11-20T00:00:00Z', endsAt: '2026-12-05T00:00:00Z', convertedAt: null, canConvert: true } };
  const sandbox = { URL, URLSearchParams, Date, Intl, Error, console, document,
    crypto: { randomUUID: () => id(100 + ++keys) },
    window: { location: { href: 'https://web.example.invalid/cuenta/' + (options.query ?? ''), origin: 'https://web.example.invalid', assign: url => navigations.push(url) } },
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
      if (route.endsWith('/completion')) {
        assert.equal(call.method, 'POST');
        return options.completion ? options.completion(call, logins) : assert.fail('Unexpected claim completion');
      }
      if (route.startsWith('/v1/me/legal-support/cases/')) return options.detail ? options.detail(call, logins) : reply(detail());
      assert.fail(`Unexpected request ${route}`);
    },
  };
  sandbox.location = sandbox.window.location;
  const vmContext = vm.createContext(sandbox), cache = new Map();
  const load = name => {
    const key = name.split('/').at(-1);
    if (key === 'customer-contract') return { bindCustomerContract: () => ({ reset() {}, refresh() {}, beforeCheckout: async () => true, canContinue: () => true, beforeOperation: async () => true, canOperate: () => true }) };
    if (key === 'client-idempotency') return { createIdempotencyKey: () => sandbox.crypto.randomUUID() };
    if (key === 'wompi-client') return { prepareWompiSession() { assert.fail('No provider calls'); } };
    if (cache.has(key)) return cache.get(key); assert.ok(modules.has(key), name);
    const exports = {}; cache.set(key, exports); vm.runInContext(`(function(exports,require){${modules.get(key)}\n})`, vmContext)(exports, load); return exports;
  };
  const helper = load('customer-support'); let controller;
  if (options.account) vm.runInContext(`(function(exports,require){${accountCode}\n})`, vmContext)({}, load);
  else controller = helper.bindCustomerSupport(get('#account'), { apiUrl: 'https://api.example.invalid', getContext: () => context, onUnauthorized: () => { unauthorized++; context = null; } });
  return { helper, controller, calls, navigations, get, kind, content, completionContent, get unauthorized() { return unauthorized; },
    setContext(value) { context = value; }, fill(type = 'support', value = 'Necesito ayuda con esta cuenta.') { kind.value = type; content.value = value; },
    async login() { await get('#login-form').dispatch('submit'); await flush(); },
    async complete(value) { if (value !== undefined) completionContent.value = value; await completionForm.dispatch('submit'); await flush(); },
    async submit() { await form.dispatch('submit'); await flush(); },
    async click(action) { await get(`[data-action='${action}']`).dispatch('click'); await flush(); },
    async open(index = 0) { await get('[data-support-list]').children[index].children[0].dispatch('click'); await flush(); },
  };
}
const writes = h => h.calls.filter(call => call.method === 'POST' && call.url.endsWith('/legal-support/cases'));
const text = node => [node.textContent, ...node.children.map(text)].join('\n');

const linkedDetails = h => h.calls.filter(call => new URL(call.url).pathname.startsWith('/v1/me/legal-support/cases/'));
test('case email link opens the scoped detail after login even outside the first page, only once', async () => {
  const h = browser({ account: true, query: `?case=${id(3).toUpperCase()}` });
  assert.equal(linkedDetails(h).length, 0);
  await h.login();
  assert.equal(linkedDetails(h).length, 1);
  assert.ok(linkedDetails(h)[0].url.endsWith('/' + id(3)));
  assert.equal(linkedDetails(h)[0].headers.authorization, 'Bearer token-1');
  assert.equal(h.get('[data-support-detail]').hidden, false);
  assert.ok(text(h.get('[data-support-detail-content]')).includes('Contenido privado'));
  await h.get('[data-support-close]').dispatch('click');
  await h.get('[data-support-refresh]').dispatch('click'); await flush();
  assert.equal(linkedDetails(h).length, 1);
  assert.equal(h.get('[data-support-detail]').hidden, true);
  assert.deepEqual(h.calls.filter(call => call.method !== 'GET').map(call => new URL(call.url).pathname), ['/v1/auth/login']);
  assert.equal(h.navigations.length, 0);
});
for (const query of ['?case=bad', '?case=', `?case=${id(3)}&case=${id(3)}`, `?case=${id(3)}&contract=${id(4)}`, '?case=%2F..%2Fprivate']) {
  test(`invalid or ambiguous case link does not read a detail: ${query}`, async () => {
    const h = browser({ account: true, query }); await h.login();
    assert.equal(linkedDetails(h).length, 0);
    assert.equal(h.get('[data-support-detail]').hidden, true);
  });
}
for (const mismatch of [{ tenantId: id(10) }, { principalId: id(10) }, { caseId: id(10) }]) {
  test(`case link rejects a successful response outside the requested scope: ${JSON.stringify(mismatch)}`, async () => {
    const h = browser({ account: true, query: `?case=${id(3)}`, detail: () => reply(detail({ receipt: receipt(mismatch) })) });
    await h.login();
    assert.equal(h.get('[data-support-detail]').hidden, true);
    assert.equal(text(h.get('[data-support-detail-content]')).includes('Contenido privado'), false);
  });
}
test('unavailable case link is retried only by explicit refresh or login in the correct tenant', async () => {
  let fail = true;
  const h = browser({ account: true, query: `?case=${id(3)}`, detail: (_call, login) => fail
    ? reply({ error: { code: 'legal_support_not_found' } }, 404)
    : reply(detail({ receipt: receipt({ tenantId: login === 1 ? id(1) : id(10) }) })) });
  await h.login(); assert.equal(linkedDetails(h).length, 1);
  await flush(); assert.equal(linkedDetails(h).length, 1);
  await h.click('logout'); fail = false; await h.login();
  assert.equal(linkedDetails(h).length, 2);
  assert.equal(linkedDetails(h)[1].headers.authorization, 'Bearer token-2');
  assert.equal(h.get('[data-support-detail]').hidden, false);
  assert.equal(h.calls.filter(call => new URL(call.url).pathname === '/v1/auth/login').length, 2);
});
test('late linked case response cannot display or consume the target in another authenticated tenant', async () => {
  const waiting = Promise.withResolvers(); let reads = 0;
  const h = browser({ account: true, query: `?case=${id(3)}`, detail: () => ++reads === 1 ? waiting.promise
    : reply(detail({ receipt: receipt({ tenantId: id(10) }) })) });
  await h.login(); await h.click('logout');
  waiting.resolve(reply(detail())); await flush();
  assert.equal(h.get('[data-support-detail]').hidden, true);
  await h.login();
  assert.equal(reads, 2); assert.equal(h.get('[data-support-detail]').hidden, false);
});

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

const claimCompletion = (extra = {}) => ({ state: 'required', requiredAt: '2026-12-31T15:00:00Z', requirementDueAt: '2026-12-31T23:00:00Z', completionDeadlineExclusiveAt: '2027-03-02T05:00:00Z', completedAt: null, closedAt: null, initialDueAt: null, maximumDueAt: null, ...extra });
const claim = (extra = {}) => summary({ receipt: receipt({ kind: 'data_claim', initialDueAt: '2027-01-25T23:00:00Z', maximumDueAt: '2027-02-04T23:00:00Z' }), status: 'in_progress', version: 2, claimCompletion: claimCompletion(), ...extra });
const claimDetail = (extra = {}) => detail({ ...claim(), events: [
  detail().events[0], { eventId: id(20), type: 'completion_required', occurredAt: claimCompletion().requiredAt, actorPrincipalId: id(6), message: 'Indica el dato concreto que necesitas corregir <img onerror=alert(1)>', dueAt: claimCompletion().completionDeadlineExclusiveAt },
], ...extra });
const completed = (extra = {}) => claim({ version: 3, dueAt: '2027-04-05T23:00:00Z', claimCompletion: claimCompletion({ state: 'completed', completedAt: '2027-03-12T15:00:00Z', initialDueAt: '2027-04-05T23:00:00Z', maximumDueAt: '2027-04-15T23:00:00Z' }), ...extra });
const completedDetail = (extra = {}) => claimDetail({ ...completed(), events: [...claimDetail().events,
  { eventId: id(21), type: 'claim_completed', occurredAt: completed().claimCompletion.completedAt, actorPrincipalId: id(2), message: 'Aclaración presentada una sola vez', dueAt: completed().dueAt }], ...extra });
const closed = () => claim({ status: 'resolved', version: 3, resolvedAt: '2027-03-03T15:00:00Z', claimCompletion: claimCompletion({ state: 'closed_incomplete', closedAt: '2027-03-03T15:00:00Z' }) });
const completions = h => h.calls.filter(call => call.url.endsWith('/completion'));

// Both nullable terminal timestamps and absent metadata on historical cases are intentional.
test('038 parses all three completion states while retaining legacy statuses and immutable receipt dates', () => {
  const h = browser();
  assert.equal(h.helper.readSupportSummary(summary(), scope).claimCompletion, undefined);
  for (const value of [claim(), completed(), closed()]) {
    const parsed = plain(h.helper.readSupportSummary(value, scope)); assert.deepEqual(parsed, value);
    assert.deepEqual(parsed.receipt, claim().receipt);
  }
  for (const bad of [null, {}, claimCompletion({ state: 'invented' }), claimCompletion({ requiredAt: 'bad' }), claimCompletion({ completionDeadlineExclusiveAt: null }), claimCompletion({ completedAt: '2027-01-01T00:00:00Z' }), claimCompletion({ state: 'completed' }), claimCompletion({ state: 'closed_incomplete' })]) assert.throws(() => h.helper.readSupportSummary(claim({ claimCompletion: bad }), scope));
  assert.throws(() => h.helper.readSupportSummary(summary({ claimCompletion: claimCompletion() }), scope));
});

test('required detail shows notification-based two-month rule and original reason without treating registration as a final deadline', async () => {
  const h = browser({ items: [claim()], detail: () => reply(claimDetail()) }); await h.controller.refresh(); await h.open();
  assert.equal(h.get('[data-support-completion-form]').hidden, false); assert.equal(h.get('[data-support-completion-send]').disabled, false);
  const output = text(h.get('[data-support-detail-content]'));
  for (const expected of ['dos meses de calendario desde la notificación', 'ni fija por sí solo la fecha definitiva', 'Requerimiento registrado', '31 de diciembre de 2026', 'El registro, recibo y texto originales se conservan', 'Indica el dato concreto', '<img onerror=alert(1)>', 'Contenido privado']) assert.ok(output.includes(expected), expected);
  assert.equal(completions(h).length, 0);
  const formMarkup = markup.match(/<form data-support-completion-form[\s\S]*?<\/form>/)[0];
  for (const expected of ['minlength="8"', 'maxlength="8000"', 'documentos de identidad', 'contraseñas', 'tokens', 'No se admiten adjuntos']) assert.ok(formMarkup.includes(expected));
  assert.equal(/Date\.now|setMonth|setDate|setInterval/.test(source), false);
});

test('explicit completion sends only content and expectedVersion to /completion and replaces UI only with server data', async () => {
  let applied = false;
  const h = browser({ items: [claim()], detail: () => reply(applied ? completedDetail() : claimDetail()), completion: () => { applied = true; return reply(completed()); } });
  await h.controller.refresh(); await h.open(); await h.complete('  Quiero corregir el dato indicado.  ');
  const call = completions(h)[0]; assert.ok(call.url.endsWith(`/${id(3)}/completion`));
  assert.deepEqual(JSON.parse(call.body), { content: 'Quiero corregir el dato indicado.', expectedVersion: 2 });
  assert.equal(call.headers.authorization, 'Bearer token-1'); assert.ok(call.headers['idempotency-key'].length >= 16);
  assert.equal(call.cache, 'no-store'); assert.equal(call.credentials, 'omit');
  assert.equal(h.get('[data-support-completion-form]').hidden, true); assert.equal(h.completionContent.value, '');
  const output = text(h.get('[data-support-detail-content]'));
  assert.ok(output.includes('Aclaración recibida')); assert.ok(output.includes('5 de abril de 2027')); assert.ok(output.includes('15 de abril de 2027'));
  assert.ok(output.includes('25 de enero de 2027')); assert.ok(output.includes('Contenido privado'));
  assert.equal((output.match(/Aclaración presentada una sola vez/g) ?? []).length, 1);
  assert.equal(h.calls.some(call => call.url.endsWith('/complete')), false);
});

for (const input of ['', '       ', '1234567', 'a'.repeat(8001)]) test(`invalid completion length ${input.length} never sends a request`, async () => {
  const h = browser({ items: [claim()], detail: () => reply(claimDetail()) }); await h.controller.refresh(); await h.open(); await h.complete(input); assert.equal(completions(h).length, 0);
});

test('completion accepts 8 and 8000 trimmed characters and rejects invalid expectedVersion before HTTP', () => {
  const h = browser();
  for (const length of [8, 8000]) assert.deepEqual(plain(h.helper.createClaimCompletion('  ' + 'a'.repeat(length) + '  ', 2)), { content: 'a'.repeat(length), expectedVersion: 2 });
  for (const version of [0, -1, 1.5, '2', NaN]) assert.throws(() => h.helper.createClaimCompletion('Texto válido', version));
});

test('late completion is allowed while the server still reports required, without a client-time cutoff', async () => {
  const old = claimCompletion({ requiredAt: '2000-01-01T15:00:00Z', requirementDueAt: '2000-01-03T23:00:00Z', completionDeadlineExclusiveAt: '2000-03-02T05:00:00Z' });
  const h = browser({ items: [claim({ claimCompletion: old })], detail: () => reply(claimDetail({ claimCompletion: old })), completion: () => reply({}, 503) });
  await h.controller.refresh(); await h.open(); await h.complete('Aclaración posterior al plazo.');
  assert.equal(completions(h).length, 1); assert.ok(text(h.get('[data-support-detail-content]')).includes('incluso de forma tardía'));
});

test('ambiguous completion retry keeps the exact body/key, is single flight, and replay creates no duplicate history or new deadline', async () => {
  const waiting = Promise.withResolvers(); let attempts = 0, applied = false;
  const h = browser({ items: [claim()], detail: () => reply(applied ? completedDetail() : claimDetail()), completion: () => ++attempts === 1 ? waiting.promise : reply(completed()) });
  await h.controller.refresh(); await h.open();
  const first = h.complete('Datos complementarios del reclamo'), second = h.complete(); await flush(); assert.equal(completions(h).length, 1);
  applied = true; waiting.resolve(reply({ code: 'legal_support_unavailable' }, 503)); await Promise.all([first, second]);
  assert.equal(h.completionContent.value, 'Datos complementarios del reclamo'); await h.complete();
  assert.equal(completions(h).length, 2); assert.equal(completions(h)[0].body, completions(h)[1].body);
  assert.equal(completions(h)[0].headers['idempotency-key'], completions(h)[1].headers['idempotency-key']);
  const output = text(h.get('[data-support-detail-content]')); assert.equal((output.match(/Aclaración presentada una sola vez/g) ?? []).length, 1);
  assert.equal(/\b2 de marzo de 2027\b/.test(output), false); assert.ok(output.includes('5 de abril de 2027'));
  assert.equal(h.helper.readSupportSummary(completed(), scope).claimCompletion.completionDeadlineExclusiveAt, claimCompletion().completionDeadlineExclusiveAt);
  await h.complete('Otro intento no debe enviarse'); assert.equal(completions(h).length, 2);
});

test('409 refreshes the detail without automatic POST and retains draft/attempts until an explicit submission at the new version', async () => {
  let version = 2, reads = 0;
  const h = browser({ items: [claim()], detail: () => { reads++; return reply(claimDetail({ version })); }, completion: () => { version = 3; return reply({ code: 'legal_support_version_conflict' }, 409); } });
  await h.controller.refresh(); await h.open(); await h.complete('Conserva mi aclaración al actualizar.');
  assert.equal(reads, 2); assert.equal(completions(h).length, 1); assert.equal(h.completionContent.value, 'Conserva mi aclaración al actualizar.');
  assert.ok(h.get('[data-support-completion-status]').textContent.includes('Conservamos tu borrador')); assert.equal(h.get('[data-support-completion-send]').disabled, false);
  await h.complete(); assert.equal(completions(h).length, 2); assert.equal(JSON.parse(completions(h)[1].body).expectedVersion, 3);
  assert.notEqual(completions(h)[0].headers['idempotency-key'], completions(h)[1].headers['idempotency-key']);
  await h.complete(); assert.equal(completions(h)[1].headers['idempotency-key'], completions(h)[2].headers['idempotency-key']);
});

for (const terminal of [completed(), closed()]) test(`409 terminal ${terminal.claimCompletion.state} preserves a read-only draft and cannot resubmit`, async () => {
  let conflict = false;
  const h = browser({ items: [claim()], detail: () => reply(conflict ? claimDetail({ ...terminal }) : claimDetail()), completion: () => { conflict = true; return reply({ code: 'legal_support_completion_conflict' }, 409); } });
  await h.controller.refresh(); await h.open(); await h.complete('Texto conservado después del conflicto.');
  assert.equal(h.completionContent.value, 'Texto conservado después del conflicto.'); assert.equal(h.completionContent.readOnly, true);
  assert.equal(h.get('[data-support-completion-send]').disabled, true); await h.complete(); assert.equal(completions(h).length, 1);
  if (terminal.claimCompletion.state === 'closed_incomplete') assert.ok(text(h.get('[data-support-detail-content]')).includes('Puedes abrir un nuevo reclamo'));
});

test('failed 409 refresh disables stale submission, preserving the draft and key until explicit detail refresh recovers', async () => {
  let reads = 0;
  const h = browser({ items: [claim()], detail: () => ++reads === 2 ? reply({ code: 'legal_support_unavailable' }, 503) : reply(claimDetail()), completion: () => reply({ code: 'legal_support_version_conflict' }, 409) });
  await h.controller.refresh(); await h.open(); await h.complete('Mantén este texto mientras recupero el caso.');
  assert.equal(h.get('[data-support-completion-send]').disabled, true); assert.equal(h.completionContent.value, 'Mantén este texto mientras recupero el caso.');
  await h.complete(); assert.equal(completions(h).length, 1);
  await h.get('[data-support-detail-refresh]').dispatch('click'); await flush(); assert.equal(h.get('[data-support-completion-send]').disabled, false);
  await h.complete(); assert.equal(completions(h).length, 2); assert.equal(completions(h)[0].headers['idempotency-key'], completions(h)[1].headers['idempotency-key']);
});

for (const value of [summary(), summary({ receipt: receipt({ kind: 'data_query' }) }), completed(), closed()]) test(`only a required own data_claim can POST completion (${value.receipt.kind}/${value.claimCompletion?.state ?? 'legacy'})`, async () => {
  const h = browser({ items: [value], detail: () => reply(detail({ ...value })) }); await h.controller.refresh(); await h.open();
  assert.equal(h.get('[data-support-completion-form]').hidden, true); await h.complete('Forzar envío no permitido'); assert.equal(completions(h).length, 0);
});

test('closed incomplete is procedural closure, preserves history and original text, and permits a separate new claim', async () => {
  const value = claimDetail({ ...closed(), events: [...claimDetail().events, { eventId: id(22), type: 'closed_incomplete', occurredAt: closed().resolvedAt, actorPrincipalId: id(6), message: 'Decisión motivada sobre lo faltante', dueAt: null }] });
  const h = browser({ items: [closed()], detail: () => reply(value) }); await h.controller.refresh(); await h.open();
  const output = text(h.get('[data-support-detail-content]'));
  for (const expected of ['sin decisión de fondo', 'no resuelve de fondo ni borra datos', 'Puedes abrir un nuevo reclamo', 'Contenido privado', 'Decisión motivada sobre lo faltante']) assert.ok(output.includes(expected));
  h.fill('data_claim', 'Nuevo reclamo por una solicitud independiente'); await h.submit(); assert.equal(writes(h).length, 1); assert.equal(completions(h).length, 0);
});

for (const response of ['success', '409', '401']) test(`late completion ${response} after logout/new tenant cannot restore draft, state or perform an extra GET`, async () => {
  const waiting = Promise.withResolvers();
  const h = browser({ account: true, list: (_call, login) => reply({ items: login === 1 ? [claim()] : [], nextBefore: null }), detail: () => reply(claimDetail()), completion: () => waiting.promise });
  await h.login(); await h.open(); const pending = h.complete('Aclaración privada del tenant anterior'); await flush();
  await h.click('logout'); await h.login(); const count = h.calls.length;
  waiting.resolve(response === 'success' ? reply(completed()) : { status: Number(response), ok: false, json() { assert.fail('Do not read stale response'); } }); await pending;
  assert.equal(h.calls.length, count); assert.equal(h.completionContent.value, ''); assert.equal(h.get('[data-support-detail]').hidden, true);
  assert.equal(h.get("[data-field='tenant-name']").textContent, 'Empresa 2'); assert.equal(h.get('.account-panel').hidden, false);
});

test('account refresh invalidates pending completion and a new login never reuses the old draft or key', async () => {
  const waiting = Promise.withResolvers();
  const h = browser({ account: true, items: [claim()], detail: () => reply(claimDetail()), completion: () => waiting.promise }); await h.login(); await h.open();
  const pending = h.complete('Borrador anterior a la actualización'); await flush(); await h.click('refresh-recovery'); waiting.resolve(reply(completed())); await pending;
  assert.equal(h.completionContent.value, ''); assert.equal(h.get('[data-support-detail]').hidden, true);
  await h.open(); assert.equal(h.completionContent.value, '');
});

test('closing and reopening a case retains only its own draft and retry key, while reset erases both', async () => {
  const h = browser({ items: [claim(), claim({ receipt: { ...claim().receipt, caseId: id(30) } })], detail: call => reply(claimDetail({ receipt: { ...claim().receipt, caseId: new URL(call.url).pathname.split('/').at(-1) } })), completion: () => reply({}, 503) });
  await h.controller.refresh(); await h.open(); await h.complete('Borrador privado del primer caso');
  await h.get('[data-support-close]').dispatch('click'); await h.open(1); assert.equal(h.completionContent.value, '');
  await h.get('[data-support-close]').dispatch('click'); await h.open(); assert.equal(h.completionContent.value, 'Borrador privado del primer caso');
  await h.complete(); assert.equal(completions(h)[0].headers['idempotency-key'], completions(h)[1].headers['idempotency-key']);
  h.controller.reset(); await h.controller.refresh(); await h.open(); assert.equal(h.completionContent.value, ''); await h.complete('Borrador privado del primer caso');
  assert.notEqual(completions(h)[1].headers['idempotency-key'], completions(h)[2].headers['idempotency-key']);
});

test('foreign details and foreign completion summaries never authorize or expose another account', async () => {
  for (const mismatch of [{ tenantId: id(88) }, { principalId: id(88) }]) {
    const h = browser({ items: [claim()], detail: () => reply(claimDetail({ receipt: { ...claim().receipt, ...mismatch } })) }); await h.controller.refresh(); await h.open();
    await h.complete('Datos que no se deben enviar'); assert.equal(completions(h).length, 0);
    const response = browser({ items: [claim()], detail: () => reply(claimDetail()), completion: () => reply(completed({ receipt: { ...claim().receipt, ...mismatch } })) });
    await response.controller.refresh(); await response.open(); await response.complete('Aclaración sólo para mi propio reclamo');
    assert.equal(response.calls.filter(call => call.method === 'GET' && new URL(call.url).pathname.endsWith(id(3))).length, 1);
    assert.equal(response.completionContent.value, 'Aclaración sólo para mi propio reclamo');
  }
});

test('replayed completion refreshes a later server version without resetting its extended deadline', async () => {
  let submitted = false;
  const later = completedDetail({ version: 4, dueAt: '2027-04-09T23:00:00Z', extendedAt: '2027-04-01T15:00:00Z' });
  const h = browser({ items: [claim()], detail: () => reply(submitted ? later : claimDetail()), completion: () => { submitted = true; return reply(completed()); } });
  await h.controller.refresh(); await h.open(); await h.complete('Aclaración cuyo recibo original se recupera');
  const output = text(h.get('[data-support-detail-content]'));
  assert.ok(output.includes('Versión: 4')); assert.ok(output.includes('9 de abril de 2027')); assert.ok(output.includes('5 de abril de 2027'));
  assert.equal(/\b2 de marzo de 2027\b/.test(output), false); assert.equal(completions(h).length, 1);
  await h.complete('No debe haber otra entrega'); assert.equal(completions(h).length, 1);
});

test('closing the detail during completion prevents a late response from reopening it or adding another request', async () => {
  const waiting = Promise.withResolvers();
  const h = browser({ items: [claim()], detail: () => reply(claimDetail()), completion: () => waiting.promise });
  await h.controller.refresh(); await h.open(); const pending = h.complete('Texto de una entrega cuyo detalle cierro'); await flush();
  await h.get('[data-support-close]').dispatch('click'); const count = h.calls.length;
  waiting.resolve(reply(completed())); await pending;
  assert.equal(h.calls.length, count); assert.equal(h.get('[data-support-detail]').hidden, true); assert.equal(h.completionContent.value, '');
});

test('current completion 401 clears the account and draft before JSON; foreign or changed-boundary responses cannot mark completion', async () => {
  const h = browser({ account: true, items: [claim()], detail: () => reply(claimDetail()), completion: () => ({ ok: false, status: 401, json() { assert.fail('401 body is private'); } }) });
  await h.login(); await h.open(); await h.complete('Aclaración de una sesión expirada');
  assert.equal(h.get('.account-panel').hidden, true); assert.equal(h.completionContent.value, '');
  for (const response of [completed({ receipt: { ...claim().receipt, caseId: id(98) } }), completed({ claimCompletion: { ...completed().claimCompletion, completionDeadlineExclusiveAt: '2099-01-01T00:00:00Z' } })]) {
    const bad = browser({ items: [claim()], detail: () => reply(claimDetail()), completion: () => reply(response) }); await bad.controller.refresh(); await bad.open(); await bad.complete('Datos que no deben reemplazar la ventana original');
    assert.equal(bad.completionContent.value, 'Datos que no deben reemplazar la ventana original'); assert.ok(bad.get('[data-support-completion-status]').textContent.includes('No pudimos verificar'));
  }
});

const notificationProof = (extra = {}) => ({ type: 'operator_declaration', notificationAt: '2027-01-01T15:00:00.000Z', notificationEvidence: 'Radicado QA-038 del canal de atención', declaredByPrincipalId: id(6), declaredAt: '2027-03-03T15:00:00.000Z', closureNotBeforeAt: '2027-03-02T05:00:00.000Z', ...extra });
const notifiedClosure = (proof = notificationProof()) => claimDetail({ ...closed(), events: [...claimDetail().events,
  { eventId: id(23), type: 'closed_incomplete', occurredAt: closed().resolvedAt, actorPrincipalId: id(6), message: 'Motivo limpio del cierre por falta de información', dueAt: null, ...(proof === undefined ? {} : { notificationProof: proof }) }] });

test('operator notification is optional on historical closure, never inferred from occurrence or requirement dates', async () => {
  const legacy = claimDetail({ ...closed(), events: [{ eventId: id(23), type: 'closed_incomplete', occurredAt: closed().resolvedAt, actorPrincipalId: id(6), message: 'Cierre histórico con motivo limpio', dueAt: null }] });
  const h = browser({ items: [closed()], detail: () => reply(legacy) }); await h.controller.refresh(); await h.open();
  assert.equal(h.helper.readNotificationProof(undefined), undefined);
  assert.equal(text(h.get('[data-support-detail-content]')).includes('Notificación declarada por operador'), false);
  assert.ok(text(h.get('[data-support-detail-content]')).includes('Cierre histórico con motivo limpio'));
});

test('notification proof renders operator declaration, Bogota dates and a literal reference without automatic links or client inputs', async () => {
  const reference = 'https://notificaciones.example.invalid/QA-038 <img src=x onerror=alert(1)>';
  const value = notifiedClosure(notificationProof({ notificationEvidence: reference }));
  const h = browser({ items: [closed()], detail: () => reply(value) }); await h.controller.refresh(); await h.open();
  const parsed = plain(h.helper.readSupportDetail(value, scope, id(3)));
  assert.deepEqual(parsed.events.at(-1).notificationProof, value.events.at(-1).notificationProof);
  assert.equal(parsed.events.at(-1).message, 'Motivo limpio del cierre por falta de información');
  const output = text(h.get('[data-support-detail-content]'));
  for (const expected of ['Notificación declarada por operador', 'Fecha de notificación declarada', '1 de enero de 2027', '10:00 (Bogotá)', 'Referencia declarada: ' + reference, 'Declaración registrada', 'Cierre no antes de (según servidor)', '2 de marzo de 2027', 'no resuelve de fondo ni borra datos', 'desde la notificación del requerimiento', 'Registrar el requerimiento no prueba su notificación']) assert.ok(output.includes(expected), expected);
  assert.equal(/entrega verificada|delivery verificada|notificación verificada/i.test(output), false);
  const nodes = node => [node, ...node.children.flatMap(nodes)];
  assert.ok(nodes(h.get('[data-support-detail-content]')).every(node => node.tagName !== 'A' && !Object.hasOwn(node, 'href')));
  assert.equal(markup.includes('name="notification'), false); assert.equal(markup.includes('name="declared'), false); assert.equal(completions(h).length, 0);
});

for (const length of [8, 500]) test(`notification reference length ${length} is accepted without changing the original text`, () => {
  const h = browser(); const proof = notificationProof({ notificationEvidence: 'R'.repeat(length) });
  assert.deepEqual(plain(h.helper.readNotificationProof(proof)), proof);
});

for (const bad of [null, {}, notificationProof({ type: 'delivery_verified' }), notificationProof({ notificationAt: 'invalid' }), notificationProof({ notificationAt: null }), notificationProof({ declaredAt: '2027-03-03T10:00:00-05:00' }), notificationProof({ closureNotBeforeAt: '2027-03-02' }), notificationProof({ declaredByPrincipalId: 'invalid' }), notificationProof({ notificationEvidence: '1234567' }), notificationProof({ notificationEvidence: 'R'.repeat(501) }), notificationProof({ notificationEvidence: '   ' }), notificationProof({ notificationEvidence: 'Referencia\ncon salto' }), notificationProof({ notificationEvidence: 'Bearer private-secret' }), notificationProof({ notificationEvidence: 'password=private-secret' }), notificationProof({ notificationEvidence: 'https://example.invalid/reference?token=secret' })]) test(`malformed operator proof never enters the detail (${JSON.stringify(bad).slice(0, 110)})`, async () => {
  const h = browser({ items: [closed()], detail: () => reply(notifiedClosure(bad)) });
  assert.throws(() => h.helper.readSupportDetail(notifiedClosure(bad), scope, id(3)));
  await h.controller.refresh(); await h.open();
  assert.equal(h.get('[data-support-detail]').hidden, true); assert.equal(h.get('[data-support-detail-content]').children.length, 0);
});

test('an operator proof on a non-closure event is rejected and a late private notification cannot restore another tenant', async () => {
  const h = browser();
  assert.throws(() => h.helper.readSupportDetail(claimDetail({ events: [{ ...detail().events[0], notificationProof: notificationProof() }] }), scope, id(3)));
  const waiting = Promise.withResolvers();
  const late = browser({ account: true, list: (_call, login) => reply({ items: login === 1 ? [closed()] : [], nextBefore: null }), detail: () => waiting.promise });
  await late.login(); const pending = late.open(); await flush(); await late.click('logout'); await late.login();
  waiting.resolve(reply(notifiedClosure())); await pending;
  assert.equal(late.get('[data-support-detail]').hidden, true); assert.equal(late.get('[data-support-detail-content]').children.length, 0);
  assert.equal(late.get("[data-field='tenant-name']").textContent, 'Empresa 2');
});

test('an old requiredAt and its internal closure boundary never become the customer final deadline in rendered detail or history', async () => {
  const completion = claimCompletion({ requiredAt: '2000-01-10T15:00:00Z', requirementDueAt: '2000-01-11T23:00:00Z', completionDeadlineExclusiveAt: '2000-03-11T05:00:00Z' });
  const value = claimDetail({ claimCompletion: completion, events: [{ ...claimDetail().events.at(-1), occurredAt: completion.requiredAt, dueAt: completion.completionDeadlineExclusiveAt }] });
  const h = browser({ items: [claim({ claimCompletion: completion })], detail: () => reply(value), completion: () => reply({}, 503) });
  await h.controller.refresh(); await h.open();
  const output = text(h.get('[data-support-detail-content]'));
  assert.ok(output.includes('10 de enero de 2000')); assert.ok(output.includes('Indica el dato concreto'));
  assert.ok(output.includes('dos meses de calendario desde la notificación')); assert.ok(output.includes('ni fija por sí solo la fecha definitiva'));
  assert.equal(output.includes('11 de marzo de 2000'), false); assert.equal(output.includes(completion.completionDeadlineExclusiveAt), false);
  assert.equal(/fecha límite exclusiva|antes de este instante/i.test(output), false);
  assert.equal(h.get('[data-support-completion-send]').disabled, false);
  const parsed = plain(h.helper.readSupportDetail(value, scope, id(3)));
  assert.equal(parsed.claimCompletion.requiredAt, completion.requiredAt);
  assert.equal(parsed.claimCompletion.completionDeadlineExclusiveAt, completion.completionDeadlineExclusiveAt);
  assert.equal(parsed.events.at(-1).dueAt, completion.completionDeadlineExclusiveAt);
  await h.complete('Aclaración pese a una referencia interna antigua'); assert.equal(completions(h).length, 1);
});

const procedureDetail = () => {
  const occurredAt = '2026-11-26T15:00:00.000Z', performedAt = '2026-11-26T14:00:00.000Z';
  const commonProof = { type: 'operator_declaration', ...scope, declaredByPrincipalId: id(6), recordedAt: occurredAt, performedAt };
  return detail({ receipt: receipt({ kind: 'data_claim', initialDueAt: '2026-12-16T23:00:00Z', maximumDueAt: '2026-12-29T23:00:00Z' }),
    version: 3, status: 'in_progress', dueAt: '2026-12-16T23:00:00Z',
    claimProcedure: { transfer: { eventId: id(31), recordedAt: occurredAt, performedAt, notificationAt: performedAt },
      annotation: { eventId: id(32), recordedAt: occurredAt, performedAt, completeAt: receipt().receivedAt, dataScope: 'external' },
      transferDueAt: '2026-11-27T23:00:00Z', annotationDueAt: '2026-11-27T23:00:00Z' },
    events: [detail().events[0],
      { eventId: id(31), type: 'transferred', occurredAt, actorPrincipalId: id(6), message: 'Motivo del traslado declarado.', dueAt: null,
        procedureProof: { ...commonProof, kind: 'transfer', competentRecipient: 'PRIVATE040_RECIPIENT', transferEvidence: 'PRIVATE040_TRANSFER',
          notificationAt: performedAt, notificationEvidence: 'PRIVATE040_NOTIFICATION' } },
      { eventId: id(32), type: 'claim_annotated', occurredAt, actorPrincipalId: id(6), message: 'Motivo de la anotación declarada.', dueAt: null,
        procedureProof: { ...commonProof, kind: 'annotation', annotationEvidence: 'PRIVATE040_ANNOTATION',
          affectedData: { scope: 'external', reference: 'PRIVATE040_EXTERNAL' } } },
    ] });
};

test('040 transfer and annotation detail is accepted and rendered as declarations without exposing private operator proof', async () => {
  const value = procedureDetail();
  const h = browser({ items: [value], detail: () => reply(value) }); await h.controller.refresh(); await h.open();
  const parsed = plain(h.helper.readSupportDetail(value, scope, id(3)));
  assert.deepEqual(parsed.events.map(event => event.type), ['received', 'transferred', 'claim_annotated']);
  assert.ok(parsed.events.every(event => !Object.hasOwn(event, 'procedureProof')));
  const output = text(h.get('[data-support-detail-content]'));
  assert.ok(output.includes('Declaración de traslado registrada')); assert.ok(output.includes('Declaración de anotación registrada'));
  assert.ok(output.includes('Motivo del traslado declarado.')); assert.ok(output.includes('Motivo de la anotación declarada.'));
  assert.doesNotMatch(output, /PRIVATE040_|ejecutad[ao] automáticamente|entrega verificada/);
  assert.ok(h.calls.every(call => call.method === 'GET'));
});

test('040 event support still rejects unknown event codes, oversized messages and malformed event identity', () => {
  const h = browser();
  for (const mutate of [event => event.type = 'transferred_v2', event => event.type = 'automatically_resolved',
    event => event.type = 'toString', event => event.message = 'x'.repeat(8001), event => event.eventId = 'not-a-uuid',
    event => event.occurredAt = 'not-a-date', event => event.actorPrincipalId = null]) {
    const value = procedureDetail(); mutate(value.events[1]);
    assert.throws(() => h.helper.readSupportDetail(value, scope, id(3)));
  }
});

test('040 event detail keeps tenant, principal and requested-case scope guards', async () => {
  for (const mismatch of [{ tenantId: id(90) }, { principalId: id(91) }, { caseId: id(92) }]) {
    const value = procedureDetail(), foreign = { ...value, receipt: { ...value.receipt, ...mismatch } };
    const h = browser({ items: [value], detail: () => reply(foreign) });
    assert.throws(() => h.helper.readSupportDetail(foreign, scope, id(3)));
    await h.controller.refresh(); await h.open();
    assert.doesNotMatch(text(h.get('[data-support-detail-content]')), /Contenido privado|PRIVATE040_|Declaración de traslado registrada/);
    assert.equal(writes(h).length, 0);
  }
});

const supportTransportFailures = [() => Promise.reject(new TypeError('Failed to fetch PRIVATE_SUPPORT')),
  () => Promise.reject(new Error('PRIVATE_SUPPORT https://internal.example.invalid')),
  () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('PRIVATE_SUPPORT_JSON'); } })];

test('support list, detail and detail refresh translate network and JSON errors without automatic writes', async () => {
  for (const stage of ['list', 'detail', 'detail-refresh']) for (const failure of supportTransportFailures) {
    let failRefresh = false;
    const h = browser({ items: [claim()], list: () => stage === 'list' ? failure() : reply({ items: [claim()], nextBefore: null }),
      detail: () => stage === 'detail' || failRefresh ? failure() : reply(claimDetail()) });
    await h.controller.refresh();
    if (stage !== 'list') await h.open();
    if (stage === 'detail-refresh') { failRefresh = true; await h.get('[data-support-detail-refresh]').dispatch('click'); await flush(); }
    const output = h.get(stage === 'detail-refresh' ? '[data-support-completion-status]' : '[data-support-status]').textContent;
    assert.match(output, /No pudimos (?:consultar|actualizar).*conexión/);
    assert.doesNotMatch(output, /PRIVATE_SUPPORT|Failed to fetch|internal\.example/);
    assert.ok(h.calls.every(call => call.method === 'GET'));
    assert.equal(h.calls.length, stage === 'list' ? 1 : stage === 'detail' ? 2 : 3);
  }
});

test('uncertain support creation preserves text and idempotency key without claiming receipt or resending', async () => {
  for (const failure of supportTransportFailures) {
    const h = browser({ post: failure }); await h.controller.refresh(); h.fill('support', 'Solicitud conservada mientras se confirma.'); await h.submit();
    const output = h.get('[data-support-status]').textContent;
    assert.match(output, /No pudimos confirmar la recepción.*conexión/);
    assert.doesNotMatch(output, /PRIVATE_SUPPORT|Failed to fetch|internal\.example/);
    assert.equal(h.content.value, 'Solicitud conservada mientras se confirma.');
    assert.equal(h.get('[data-support-created]').hidden, true); assert.equal(writes(h).length, 1);
    assert.equal(h.calls.length, 2);
    const first = writes(h)[0]; await h.submit();
    assert.equal(writes(h)[1].headers['idempotency-key'], first.headers['idempotency-key']);
    assert.equal(writes(h)[1].body, first.body);
  }
});

test('uncertain claim completion preserves its draft and retry key without claiming completion or performing an extra GET', async () => {
  for (const failure of supportTransportFailures) {
    const h = browser({ items: [claim()], detail: () => reply(claimDetail()), completion: failure });
    await h.controller.refresh(); await h.open(); await h.complete('Aclaración conservada para reintento manual.');
    const output = h.get('[data-support-completion-status]').textContent;
    assert.match(output, /No pudimos confirmar la aclaración.*conexión/);
    assert.doesNotMatch(output, /PRIVATE_SUPPORT|Failed to fetch|internal\.example/);
    assert.equal(h.completionContent.value, 'Aclaración conservada para reintento manual.');
    assert.equal(completions(h).length, 1); assert.equal(h.calls.length, 3);
    const first = completions(h)[0]; await h.complete();
    assert.equal(completions(h)[1].headers['idempotency-key'], first.headers['idempotency-key']);
    assert.equal(completions(h)[1].body, first.body);
  }
});

test('support error translation keeps known API codes and local validation, ignoring arbitrary API message text', async () => {
  const unavailable = browser({ list: () => reply({ code: 'legal_support_unavailable', message: 'PRIVATE_SERVER_MESSAGE' }, 503) });
  await unavailable.controller.refresh();
  assert.match(unavailable.get('[data-support-status]').textContent, /El formulario no está disponible/);
  assert.doesNotMatch(unavailable.get('[data-support-status]').textContent, /PRIVATE_SERVER_MESSAGE/);
  const invalid = browser({ items: [claim()], detail: () => reply(claimDetail()) }); await invalid.controller.refresh();
  invalid.fill('invalid-kind', 'Contenido de prueba suficiente'); await invalid.submit();
  assert.match(invalid.get('[data-support-status]').textContent, /Selecciona el tipo y escribe una descripción/);
  assert.equal(writes(invalid).length, 0);
  await invalid.open(); await invalid.complete('corto');
  assert.equal(invalid.get('[data-support-completion-status]').textContent, 'Escribe una aclaración de entre 8 y 8.000 caracteres.');
  assert.equal(completions(invalid).length, 0);
});
