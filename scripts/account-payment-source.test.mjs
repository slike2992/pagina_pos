import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

// Run the production TypeScript and entire account controller. No provider code,
// HTTP request, real timer, local configuration, or payment data is used here.
const compile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const helperCode = compile(await readFile(new URL('../src/lib/wompi-client.ts', import.meta.url), 'utf8'));
const idempotencyCode = compile(await readFile(new URL('../src/scripts/client-idempotency.ts', import.meta.url), 'utf8'));
const returnCode = compile(await readFile(new URL('../src/lib/checkout-return.ts', import.meta.url), 'utf8'));
const recoveryCode = compile(await readFile(new URL('../src/lib/subscription-recovery.ts', import.meta.url), 'utf8'));
const page = await readFile(new URL('../src/pages/cuenta.astro', import.meta.url), 'utf8');
const accountScript = page.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(accountScript, 'account controller must exist');
const accountCode = compile(accountScript);
const widgetUrl = 'https://checkout.wompi.co/widget.js';
const fraudUrl = 'https://wompijs.wompi.com/libs/js/v1.js';
const legacyFraudUrl = 'https://cdn.wompi.co/libs/js/v1.js';
const publicKey = 'pub_test_QA123';
const sessionId = 'synthetic-session-123456';
const config = {
  publicKey, widgetScriptUrl: widgetUrl, fraudScriptUrl: fraudUrl,
  acceptance: { token: 'synthetic-terms', permalink: 'https://contracts.example.invalid/terms' },
  personalDataAuthorization: { token: 'synthetic-data', permalink: 'https://contracts.example.invalid/data' },
};
const source = { payment_source: { token: 'synthetic-tokenized-card', type: 'CARD' } };
const flush = () => new Promise(resolve => setImmediate(resolve));
const plain = value => JSON.parse(JSON.stringify(value));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const reply = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

function browser() {
  const scripts = [];
  const appended = [];
  const storage = new Map();
  const timers = new Map();
  const elements = new Map();
  let clock = 0, nextTimer = 0, nextKey = 0, now = Date.UTC(2026, 10, 10);
  function element() {
    const listeners = new Map();
    const attributes = new Map();
    return {
      textContent: '', hidden: false, disabled: false, checked: false, value: '', dataset: {},
      listeners, attributes, removed: false,
      addEventListener(name, callback) {
        const set = listeners.get(name) ?? new Set(); set.add(callback); listeners.set(name, set);
      },
      removeEventListener(name, callback) { listeners.get(name)?.delete(callback); },
      async dispatch(name, event = { preventDefault() {} }) {
        for (const callback of [...(listeners.get(name) ?? [])]) await callback(event);
      },
      setAttribute(name, value) { attributes.set(name, value); },
      getAttribute(name) { return attributes.get(name) ?? null; },
      removeAttribute(name) { attributes.delete(name); if (name === 'href') delete this.href; },
      remove() { this.removed = true; },
      focus() { this.focused = true; }, showModal() { this.hidden = false; }, close() { this.hidden = true; },
      replaceChildren(...children) { this.children = children; },
      querySelector(selector) {
        assert.ok(elements.has(selector), `unmodelled DOM selector: ${selector}`);
        return elements.get(selector);
      },
    };
  }
  const document = {
    querySelector(selector) {
      const scriptSource = selector.match(/^script\[src='([^']+)'\]$/)?.[1];
      if (scriptSource) return scripts.find(script => !script.removed && script.src === scriptSource) ?? null;
      assert.equal(selector, '#account');
      return root;
    },
    createElement(tag) { assert.equal(tag, 'script'); return element(); },
    head: { append(script) { scripts.push(script); appended.push({ script, attributes: Object.fromEntries(script.attributes) }); } },
  };
  const root = element();
  root.dataset = { apiUrl: 'https://api.example.invalid/', posUrl: 'https://pos.example.invalid/' };
  const window = {
    setTimeout(callback, delay) { const id = ++nextTimer; timers.set(id, { callback, due: clock + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    location: { origin: 'https://staging.example.invalid', assign() { assert.fail('unexpected navigation'); } },
  };
  const sandbox = {
    document, window, URL, Intl, Error, Uint8Array,
    Date: class extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } },
    crypto: { randomUUID: () => `00000000-0000-4000-8000-${String(++nextKey).padStart(12, '0')}` },
    fetch() { assert.fail('unmodelled HTTP request'); },
    sessionStorage: { setItem(key, value) { storage.set(key, value); }, getItem: key => storage.get(key) ?? null },
    location: window.location,
    FormData: class { constructor(form) { this.values = new Map(form.values); } get(key) { return this.values.get(key) ?? null; } },
    Option: class { constructor(text, value) { this.text = text; this.value = value; } },
  };
  const context = vm.createContext(sandbox);
  function module(code, require = name => assert.fail(`unexpected import: ${name}`)) {
    const exports = {};
    vm.runInContext(`(function(exports, require) {\n${code}\n})`, context)(exports, require);
    return exports;
  }
  const helper = module(helperCode);
  return {
    ...helper, document, window, sandbox, context, module, elements, scripts, appended, timers, element, storage,
    keys: () => nextKey,
    setNow(value) { now = value; },
    activeScripts: () => scripts.filter(script => !script.removed),
    foreign(url, { loaded = false, attributes = {} } = {}) {
      const script = element(); script.src = url;
      if (loaded) script.dataset.loaded = 'true';
      for (const [key, value] of Object.entries(attributes)) script.setAttribute(key, value);
      scripts.push(script); return script;
    },
    async advance(milliseconds) {
      const target = clock + milliseconds;
      while (true) {
        const next = [...timers].sort((a, b) => a[1].due - b[1].due)[0];
        if (!next || next[1].due > target) break;
        const [id, timer] = next; clock = timer.due; timers.delete(id); timer.callback(); await flush();
      }
      clock = target;
    },
    async loadAll() {
      for (let guard = 0; guard < 4; guard++) {
        await flush();
        const script = scripts.find(candidate => !candidate.removed && candidate.dataset.loaded !== 'true');
        if (!script) return;
        await script.dispatch('load');
      }
      assert.fail('unexpected script loading loop');
    },
  };
}

function prepared(initialize = callback => callback({ sessionId }, null)) {
  const h = browser();
  h.foreign(widgetUrl, { loaded: true });
  h.foreign(fraudUrl, { loaded: true, attributes: { 'data-public-key': publicKey } });
  h.window.$wompi = { initialize };
  return h;
}

async function account(options = {}) {
  const h = browser();
  const selectors = ['#login-form', '.status', '#tenant-field', '#tenant', '.account-panel', '.account-status',
    "[data-action='open-pos']", "[data-action='cancel']", "[data-action='reactivate']", '#cancel-dialog',
    '#confirm-cancel', "[data-section='plan-management']", '#target-plan', "[data-action='change-plan']",
    '#plan-dialog', '#confirm-plan-change', "[data-section='payment-source']", "[data-action='add-payment-source']",
    '.payment-source-status', "[data-acceptance='terms']", "[data-acceptance='personal-data']",
    "[data-section='recovery']", '[data-recovery-summary]', '.recovery-status',
    "[data-action='prepare-recovery']", "[data-action='pay-recovery']", "[data-action='recovery-result']", "[data-action='refresh-recovery']",
    "[data-acceptance='recurring']", "button[type='submit']", "[data-action='logout']", '#email',
    ...['tenant-name', 'principal-name', 'tenant-status', 'plan', 'price', 'subscription-status', 'period-end',
      'cancel-date', 'payment-source-current', 'wompi-terms', 'wompi-personal-data', 'recurring-consent',
      'target-plan-name', 'plan-change-copy', 'recovery-amount', 'recovery-period', 'recovery-guidance', 'access-guidance'].map(name => `[data-field='${name}']`)];
  for (const selector of selectors) h.elements.set(selector, h.element());
  const get = selector => h.elements.get(selector);
  const loginForm = get('#login-form');
  loginForm.reset = () => { loginForm.values = []; };
  get('#tenant-field').hidden = true;
  get('.account-panel').hidden = true;
  get('#cancel-dialog').hidden = true;
  const button = get("[data-action='add-payment-source']");
  button.disabled = true;
  const status = get('.payment-source-status');
  const terms = get("[data-acceptance='terms']");
  const data = get("[data-acceptance='personal-data']");
  const recurring = get("[data-acceptance='recurring']");
  const calls = [], widgets = [], navigations = [];
  h.window.location.assign = url => navigations.push(url);
  let loginCount = 0, initCount = 0;
  let tenant = { tenantId: 'synthetic-tenant-1', name: 'QA', role: options.role ?? 'owner', status: options.tenantStatus ?? 'active' };
  let subscription = { subscriptionId: '11111111-1111-4111-8111-111111111111', status: 'active', plan: { code: 'basic', name: 'Básico' },
    price: { amountMinor: 7990000, currency: 'COP', billingInterval: 'monthly' },
    currentPeriodStart: '2026-11-01T00:00:00.000Z', currentPeriodEnd: '2030-02-01T00:00:00Z', cancelAtPeriodEnd: false, ...options.subscription };
  const Widget = class {
    constructor(value) { this.config = plain(value); widgets.push(this); }
    open(callback) {
      this.callback = callback;
      if (options.open) return options.open(this);
    }
  };
  h.window.WidgetCheckout = Widget;
  h.window.$wompi = { initialize(callback) {
    initCount++;
    return options.initialize ? options.initialize(callback, initCount) : callback({ sessionId }, null);
  } };
  h.sandbox.fetch = async (url, init = {}) => {
    const call = { url, ...plain(init), method: init.method ?? 'GET' }; calls.push(call);
    const path = new URL(url).pathname;
    assert.equal(new URL(url).origin, 'https://api.example.invalid');
    if (path === '/v1/auth/login') {
      loginCount++;
      tenant = { ...tenant, tenantId: `synthetic-tenant-${loginCount}` };
      return reply({ accessToken: `synthetic-auth-${loginCount}`, principal: { displayName: 'QA' },
        tenant: { ...tenant } });
    }
    if (path === '/v1/me/subscription') return options.readSubscription ? options.readSubscription(call, subscription) : reply(subscription);
    if (path === '/v1/me/tenants') return options.tenants ? options.tenants(call)
      : reply({ activeTenantId: tenant.tenantId, tenants: [{ ...tenant }] });
    if (path === '/v1/auth/pos-sso') return options.sso ? options.sso(call)
      : reply({ redirectUrl: 'https://pos.example.invalid/auth/sso?ticket=synthetic-ticket' }, 201);
    if (path === '/v1/me/subscription/cancel') return options.cancel ? options.cancel(call)
      : reply({ ...subscription, cancelAtPeriodEnd: true });
    if (path === '/v1/me/subscription/reactivate') return options.reactivate ? options.reactivate(call)
      : reply({ ...subscription, cancelAtPeriodEnd: false, status: 'active' });
    if (path === '/v1/me/subscription/recovery') return options.recovery ? options.recovery(call)
      : reply({ type: 'recovery', subscriptionId: subscription.subscriptionId, status: 'blocked', blockReason: 'requires_review',
        periodStart: '2020-01-01T00:00:00.000Z', periodEnd: '2020-02-01T00:00:00.000Z',
        amountMinor: 7990000, currency: 'COP', needsFurtherRecovery: true, orderId: null, checkoutSessionId: null, expiresAt: null });
    if (path === '/v1/me/billing/checkout-sessions' && call.method === 'POST' && options.checkout) return options.checkout(call);
    if (path === '/v1/me/billing/payment-sources' && call.method === 'GET') {
      return options.current ? options.current(call) : reply({ paymentSource: null });
    }
    if (path === '/v1/public/payment-source-config') return options.metadata ? options.metadata(call) : reply(config);
    if (path === '/v1/me/billing/payment-sources' && call.method === 'POST') {
      return options.post ? options.post(call) : reply({ displayHint: 'Visa QA • 4242' });
    }
    assert.fail(`unexpected HTTP route: ${call.method} ${path}`);
  };
  const idempotency = h.module(idempotencyCode);
  const checkoutReturn = h.module(returnCode);
  const recovery = h.module(recoveryCode, name => name === './checkout-return' ? checkoutReturn : assert.fail(`unexpected recovery import: ${name}`));
  h.module(accountCode, name => {
    if (name === '../scripts/client-idempotency') return idempotency;
    if (name === '../lib/wompi-client') return { prepareWompiSession: h.prepareWompiSession };
    if (name === '../lib/subscription-recovery') return recovery;
    assert.fail(`unexpected controller import: ${name}`);
  });
  return Object.assign(h, {
    get, button, status, terms, data, recurring, calls, widgets, Widget, navigations,
    initCount: () => initCount,
    setSubscription(value) { subscription = { ...subscription, ...value }; },
    setTenant(value) { tenant = { ...tenant, ...value }; },
    posts: () => calls.filter(call => call.method === 'POST' && call.url.endsWith('/payment-sources')),
    consent(a = true, b = true, c = true) { terms.checked = a; data.checked = b; recurring.checked = c; },
    async login() {
      loginForm.values = [['email', 'qa@example.invalid'], ['password', 'synthetic-password']];
      await loginForm.dispatch('submit'); await flush();
    },
    logout: () => get("[data-action='logout']").dispatch('click'),
    click: () => button.dispatch('click'),
    async openWidget() { const click = button.dispatch('click'); await h.loadAll(); await click; await flush(); },
  });
}

test('loader deduplicates pending and completed loads and cleans its listeners', async () => {
  const h = browser();
  const first = h.loadWompiScript(widgetUrl);
  assert.equal(h.loadWompiScript(widgetUrl), first);
  assert.equal(h.appended.length, 1);
  const script = h.scripts[0];
  assert.equal(script.listeners.get('load').size, 1);
  await script.dispatch('load'); await first;
  await h.loadWompiScript(widgetUrl);
  assert.equal(h.appended.length, 1);
  assert.equal(h.timers.size, 0);
  assert.equal(script.listeners.get('load').size, 0);
  assert.equal(script.listeners.get('error').size, 0);
});

test('loader accepts only the three explicit current and compatibility URLs', async () => {
  for (const url of [widgetUrl, fraudUrl, legacyFraudUrl]) {
    const h = browser(); const pending = h.loadWompiScript(url);
    assert.equal(h.scripts[0].src, url);
    await h.scripts[0].dispatch('load'); await pending;
  }
});

test('loader rejects protocol, host, path and query lookalikes before inserting scripts', async () => {
  const h = browser();
  for (const url of ['http://checkout.wompi.co/widget.js', '//checkout.wompi.co/widget.js',
    widgetUrl + '?key=x', widgetUrl + '#x', 'https://checkout.wompi.co.evil.invalid/widget.js',
    'https://evil.invalid/widget.js', 'javascript:alert(1)', 'data:text/javascript,1']) {
    await assert.rejects(h.loadWompiScript(url), /configuración pública/);
  }
  assert.equal(h.appended.length, 0); assert.equal(h.timers.size, 0);
});

test('loader rejects arbitrary attributes and event handlers without side effects', async () => {
  const h = browser();
  for (const name of ['src', 'onload', 'onerror', 'integrity', 'data-private-key']) {
    await assert.rejects(h.loadWompiScript(fraudUrl, { [name]: 'synthetic' }), /configuración pública/);
  }
  assert.equal(h.appended.length, 0);
});

test('loader rejects private, empty, malformed and injected public keys', async () => {
  const h = browser();
  for (const key of ['', 'prv_test_QA123', 'pub_dev_QA123', 'pub_test_', 'pub_test_a b',
    'pub_test_a\n', 'pub_test_<script>', 'pub_test_a?b']) {
    await assert.rejects(h.loadWompiScript(fraudUrl, { 'data-public-key': key }), /configuración pública/);
  }
  assert.equal(h.appended.length, 0);
});

test('loader installs allowed test/prod keys including underscores and hyphens before append', async () => {
  for (const key of ['pub_test_QA_123-abc', 'pub_prod_QA_123-abc']) {
    const h = browser(); const pending = h.loadWompiScript(fraudUrl, { 'data-public-key': key });
    assert.deepEqual(h.appended[0].attributes, { 'data-public-key': key });
    assert.equal(h.scripts[0].dataset.criptonPaymentScript, 'true');
    await h.scripts[0].dispatch('load'); await pending;
  }
});

test('a pending key mismatch cannot replace or poison the original load', async () => {
  const h = browser(); const pending = h.loadWompiScript(fraudUrl, { 'data-public-key': publicKey });
  await assert.rejects(h.loadWompiScript(fraudUrl, { 'data-public-key': 'pub_test_other' }), /cambió/);
  assert.equal(h.appended.length, 1);
  assert.equal(h.scripts[0].getAttribute('data-public-key'), publicKey);
  await h.scripts[0].dispatch('load'); await pending;
  await h.loadWompiScript(fraudUrl, { 'data-public-key': publicKey });
});

test('an existing loaded script with another key is rejected without modifying it', async () => {
  const h = browser(); const foreign = h.foreign(fraudUrl, { loaded: true, attributes: { 'data-public-key': 'pub_test_other' } });
  await assert.rejects(h.loadWompiScript(fraudUrl, { 'data-public-key': publicKey }), /cambió/);
  assert.equal(foreign.removed, false); assert.equal(h.appended.length, 0); assert.equal(h.timers.size, 0);
});

test('an existing matching loaded script is reused without listeners or timeout', async () => {
  const h = prepared();
  await h.loadWompiScript(fraudUrl, { 'data-public-key': publicKey });
  assert.equal(h.appended.length, 0); assert.equal(h.timers.size, 0);
  assert.equal(h.scripts[1].listeners.size, 0);
});

test('own script error removes only that script and retry inserts a new deduplicated load', async () => {
  const h = browser(); const foreign = h.foreign(legacyFraudUrl, { loaded: true });
  const first = h.loadWompiScript(widgetUrl); const rejected = assert.rejects(first, /cargar Wompi/);
  const failed = h.scripts[1]; await failed.dispatch('error'); await rejected;
  assert.equal(failed.removed, true); assert.equal(foreign.removed, false); assert.equal(h.timers.size, 0);
  const retry = h.loadWompiScript(widgetUrl);
  assert.equal(h.loadWompiScript(widgetUrl), retry); assert.equal(h.appended.length, 2);
  await h.scripts[2].dispatch('load'); await retry;
});

test('own script times out at fifteen seconds and a later retry can load', async () => {
  const h = browser(); const first = h.loadWompiScript(widgetUrl);
  const rejected = assert.rejects(first, /cargar Wompi/);
  await h.advance(14999); assert.equal(h.scripts[0].removed, false);
  await h.advance(1); await rejected;
  assert.equal(h.scripts[0].removed, true); assert.equal(h.timers.size, 0);
  const retry = h.loadWompiScript(widgetUrl); await h.scripts[1].dispatch('load'); await retry;
});

test('foreign script error retains the element and retry attaches fresh listeners', async () => {
  const h = browser(); const foreign = h.foreign(widgetUrl);
  const first = h.loadWompiScript(widgetUrl); const rejected = assert.rejects(first, /cargar Wompi/);
  await foreign.dispatch('error'); await rejected;
  assert.equal(foreign.removed, false); assert.equal(foreign.listeners.get('load').size, 0);
  const retry = h.loadWompiScript(widgetUrl); await foreign.dispatch('load'); await retry;
  assert.equal(h.appended.length, 0);
});

test('foreign script timeout never deletes the element and remains retryable', async () => {
  const h = browser(); const foreign = h.foreign(widgetUrl);
  const rejected = assert.rejects(h.loadWompiScript(widgetUrl), /cargar Wompi/);
  await h.advance(15000); await rejected; assert.equal(foreign.removed, false);
  const retry = h.loadWompiScript(widgetUrl); await foreign.dispatch('load'); await retry;
  assert.equal(h.timers.size, 0); assert.equal(h.appended.length, 0);
});

test('loaded key scope remains fixed while the widget and fraud URLs stay independent', async () => {
  const h = browser(); const widget = h.loadWompiScript(widgetUrl);
  const fraud = h.loadWompiScript(fraudUrl, { 'data-public-key': publicKey });
  await h.scripts[0].dispatch('load'); await h.scripts[1].dispatch('load'); await Promise.all([widget, fraud]);
  await assert.rejects(h.loadWompiScript(fraudUrl, { 'data-public-key': 'pub_test_changed' }), /cambió/);
  await assert.rejects(h.loadWompiScript(fraudUrl), /cambió/);
  assert.equal(h.scripts[0].getAttribute('data-public-key'), null);
  assert.equal(h.appended.length, 2);
});

test('session preparation loads the widget then fraud with its key before initializing', async () => {
  const h = browser(); let initialized = 0;
  h.window.$wompi = { initialize(callback) { initialized++; callback({ sessionId }, null); } };
  const session = h.prepareWompiSession(config);
  assert.deepEqual(h.activeScripts().map(script => script.src), [widgetUrl]);
  assert.equal(initialized, 0);
  await h.scripts[0].dispatch('load'); await flush();
  assert.equal(h.scripts[1].src, fraudUrl);
  assert.equal(h.scripts[1].getAttribute('data-public-key'), publicKey);
  assert.equal(initialized, 0);
  await h.scripts[1].dispatch('load'); assert.equal(await session, sessionId);
  assert.equal(initialized, 1); assert.equal(h.timers.size, 0);
});

test('initialize callback returns its session and cancels the initialization timeout', async () => {
  let callback;
  const h = prepared(value => { callback = value; }); const session = h.prepareWompiSession(config);
  await flush(); assert.equal(h.timers.size, 1);
  callback({ sessionId }, null); assert.equal(await session, sessionId);
  await h.advance(30000); assert.equal(h.timers.size, 0);
});

test('initialize rejects callback errors and absent, short, whitespace or oversized sessions', async () => {
  for (const [data, error] of [[{ sessionId }, new Error('synthetic')], [null, null], [{}, null],
    [{ sessionId: 123 }, null], [{ sessionId: 'short' }, null], [{ sessionId: 'contains space' }, null],
    [{ sessionId: 'x'.repeat(251) }, null]]) {
    const h = prepared(callback => callback(data, error));
    await assert.rejects(h.prepareWompiSession(config), /iniciar la sesión/); assert.equal(h.timers.size, 0);
  }
});

test('initialize observes a rejected provider promise without leaking its error', async () => {
  const h = prepared(() => Promise.reject(new Error('synthetic-provider-detail')));
  await assert.rejects(h.prepareWompiSession(config), error => {
    assert.match(error.message, /iniciar la sesión/); assert.doesNotMatch(error.message, /provider-detail/); return true;
  });
  assert.equal(h.timers.size, 0);
});

test('initialize synchronous throw is a retryable sanitized failure', async () => {
  const h = prepared(() => { throw new Error('synthetic-provider-detail'); });
  await assert.rejects(h.prepareWompiSession(config), /iniciar la sesión/);
  h.window.$wompi.initialize = callback => callback({ sessionId }, null);
  assert.equal(await h.prepareWompiSession(config), sessionId); assert.equal(h.timers.size, 0);
});

test('initialize timeout settles once and ignores a late success callback', async () => {
  let callback;
  const h = prepared(value => { callback = value; });
  const rejected = assert.rejects(h.prepareWompiSession(config), /iniciar la sesión/);
  await flush(); await h.advance(15000); await rejected;
  callback({ sessionId }, null); assert.equal(h.timers.size, 0);
});

test('a missing or malformed fraud SDK fails after loading without starting a session', async () => {
  for (const fraud of [undefined, {}, { initialize: true }]) {
    const h = prepared(); h.window.$wompi = fraud;
    await assert.rejects(h.prepareWompiSession(config), /no quedó disponible/);
    assert.equal(h.timers.size, 0);
  }
});

test('a resolved initialize promise cannot replace the required callback session', async () => {
  const h = prepared(() => Promise.resolve({ sessionId }));
  const rejected = assert.rejects(h.prepareWompiSession(config), /iniciar la sesión/);
  await flush(); assert.equal(h.timers.size, 1); await h.advance(15000); await rejected;
});

test('account boot and unauthenticated clicks never fetch metadata or load a provider', async () => {
  const h = await account(); await h.click();
  assert.equal(h.calls.length, 0); assert.equal(h.appended.length, 0); assert.equal(h.initCount(), 0);
});

test('login prepares metadata and contract links before consent without loading SDK scripts', async () => {
  const h = await account(); await h.login();
  assert.deepEqual(h.calls.map(call => new URL(call.url).pathname), [
    '/v1/auth/login', '/v1/me/subscription', '/v1/me/billing/payment-sources', '/v1/public/payment-source-config']);
  assert.equal(h.calls[2].headers.authorization, 'Bearer synthetic-auth-1');
  assert.equal(h.get("[data-field='wompi-terms']").getAttribute('href'), config.acceptance.permalink);
  assert.equal(h.get("[data-field='wompi-personal-data']").getAttribute('href'), config.personalDataAuthorization.permalink);
  assert.equal(h.terms.checked, false); assert.equal(h.data.checked, false); assert.equal(h.recurring.checked, false);
  assert.equal(h.appended.length, 0); assert.equal(h.initCount(), 0); assert.equal(h.button.disabled, false);
});

test('each missing consent including recurring blocks SDK and POST even on a direct click', async () => {
  const h = await account(); await h.login();
  for (const consent of [[false, false, false], [false, true, true], [true, false, true], [true, true, false]]) {
    h.consent(...consent); await h.click();
    assert.equal(h.status.dataset.state, 'error'); assert.equal(h.appended.length, 0);
    assert.equal(h.initCount(), 0); assert.equal(h.posts().length, 0); assert.equal(h.keys(), 0);
  }
});

test('successful tokenization submits once with recurring consent and one idempotency key despite duplicate callbacks', async () => {
  const response = deferred(); const h = await account({ post: () => response.promise });
  await h.login(); h.consent(); await h.openWidget();
  assert.deepEqual(h.widgets[0].config, { publicKey, widgetOperation: 'tokenize', bootstrapTransport: 'postmessage' });
  const callback = h.widgets[0].callback; const first = callback(source);
  await flush(); await callback(source); await h.click();
  assert.equal(h.posts().length, 1); assert.equal(h.button.disabled, true); assert.equal(h.widgets.length, 1);
  const post = h.posts()[0];
  assert.equal(post.headers.authorization, 'Bearer synthetic-auth-1');
  assert.equal(post.headers['idempotency-key'], '00000000-0000-4000-8000-000000000001');
  assert.deepEqual(JSON.parse(post.body), { type: 'CARD', paymentMethodToken: source.payment_source.token,
    sessionId, acceptanceToken: config.acceptance.token,
    personalDataAuthToken: config.personalDataAuthorization.token, recurringConsent: true });
  response.resolve(reply({ displayHint: 'Visa QA • 4242' })); await first; await callback(source);
  assert.equal(h.posts().length, 1); assert.equal(h.keys(), 1); assert.equal(h.timers.size, 0);
  assert.equal(h.status.dataset.state, 'success'); assert.equal(h.button.disabled, false);
  assert.equal(h.button.textContent, 'Cambiar tarjeta');
  assert.equal(h.terms.checked, false); assert.equal(h.data.checked, false); assert.equal(h.recurring.checked, false);
});

test('success requires renewed consents before a new attempt and uses a fresh idempotency key', async () => {
  const h = await account(); await h.login(); h.consent(); await h.openWidget();
  await h.widgets[0].callback(source); await h.click();
  assert.equal(h.widgets.length, 1); assert.equal(h.posts().length, 1);
  h.consent(); await h.openWidget(); await h.widgets[1].callback(source);
  assert.equal(h.posts().length, 2);
  assert.notEqual(h.posts()[0].headers['idempotency-key'], h.posts()[1].headers['idempotency-key']);
  assert.equal(h.appended.length, 2); assert.equal(h.button.disabled, false);
});

test('logout invalidates an open widget callback without submitting or restoring account UI', async () => {
  const h = await account(); await h.login(); h.consent(); await h.openWidget();
  await h.logout(); await h.widgets[0].callback(source);
  assert.equal(h.posts().length, 0); assert.equal(h.status.textContent, '');
  assert.equal(h.get('.account-panel').hidden, true); assert.equal(h.button.disabled, true);
  assert.equal(h.recurring.checked, false);
});

test('a callback from an earlier login cannot submit under the new authentication context', async () => {
  const h = await account(); await h.login(); h.consent(); await h.openWidget();
  const old = h.widgets[0].callback;
  await h.logout(); await h.login(); await old(source); assert.equal(h.posts().length, 0);
  h.consent(); await h.openWidget(); await h.widgets[1].callback(source);
  assert.equal(h.posts().length, 1); assert.equal(h.posts()[0].headers.authorization, 'Bearer synthetic-auth-2');
});

test('authentication changes while SDK loads prevent widget creation and submission', async () => {
  const h = await account(); await h.login(); h.consent(); const click = h.click();
  await flush(); await h.logout(); await h.loadAll(); await click;
  assert.equal(h.widgets.length, 0); assert.equal(h.posts().length, 0); assert.equal(h.button.disabled, true);
});

test('an old in-flight POST response cannot overwrite a newly logged-in account', async () => {
  const response = deferred(); const h = await account({ post: () => response.promise });
  await h.login(); h.consent(); await h.openWidget(); const pending = h.widgets[0].callback(source);
  await flush(); await h.logout(); await h.login();
  response.resolve(reply({ displayHint: 'STALE CARD' })); await pending;
  assert.equal(h.posts().length, 1); assert.equal(h.status.textContent, '');
  assert.equal(h.get("[data-field='payment-source-current']").textContent, 'Sin medio de pago registrado');
  assert.equal(h.button.textContent, 'Agregar tarjeta'); assert.equal(h.button.disabled, false);
});

test('a script load failure releases the button and retry removes only its failed own script', async () => {
  const h = await account(); await h.login(); h.consent(); const first = h.click(); await flush();
  await h.scripts[0].dispatch('error'); await first;
  assert.equal(h.scripts[0].removed, true); assert.equal(h.button.disabled, false);
  assert.equal(h.status.dataset.state, 'error'); assert.equal(h.posts().length, 0);
  await h.openWidget(); await h.widgets[0].callback(source);
  assert.equal(h.posts().length, 1); assert.equal(h.appended.length, 3); assert.equal(h.button.disabled, false);
});

test('initialization promise failure permits retry with the loaded scripts and a new attempt', async () => {
  const h = await account({ initialize: (callback, count) => count === 1
    ? Promise.reject(new Error('synthetic SDK failure')) : callback({ sessionId }, null) });
  await h.login(); h.consent(); await h.openWidget();
  assert.equal(h.button.disabled, false); assert.equal(h.status.dataset.state, 'error');
  assert.equal(h.widgets.length, 0); assert.equal(h.posts().length, 0);
  await h.openWidget(); await h.widgets[0].callback(source);
  assert.equal(h.posts().length, 1); assert.equal(h.keys(), 2); assert.equal(h.appended.length, 2);
});

test('missing widget constructor is recoverable without submitting or reloading scripts', async () => {
  const h = await account(); delete h.window.WidgetCheckout;
  await h.login(); h.consent(); await h.openWidget();
  assert.equal(h.status.dataset.state, 'error'); assert.equal(h.button.disabled, false); assert.equal(h.posts().length, 0);
  h.window.WidgetCheckout = h.Widget; await h.openWidget(); await h.widgets[0].callback(source);
  assert.equal(h.posts().length, 1); assert.equal(h.appended.length, 2);
});

test('a synchronous widget open failure releases the button for a later opening', async () => {
  let fail = true;
  const h = await account({ open() { if (fail) throw new Error('synthetic widget failure'); } });
  await h.login(); h.consent(); await h.openWidget();
  assert.equal(h.button.disabled, false); assert.equal(h.status.dataset.state, 'error'); assert.equal(h.posts().length, 0);
  fail = false; await h.openWidget(); await h.widgets[1].callback(source); assert.equal(h.posts().length, 1);
});

test('closing without a callback permits reopening and supersedes the abandoned widget', async () => {
  const h = await account(); await h.login(); h.consent(); await h.openWidget();
  assert.equal(h.button.disabled, false); assert.equal(h.posts().length, 0);
  await h.openWidget(); assert.equal(h.widgets.length, 2);
  await h.widgets[0].callback(source); assert.equal(h.posts().length, 0);
  await h.widgets[1].callback(source); await h.widgets[1].callback(source);
  assert.equal(h.posts().length, 1);
  assert.equal(h.posts()[0].headers['idempotency-key'], '00000000-0000-4000-8000-000000000002');
});

test('malformed widget callbacks do not submit and leave a valid callback possible', async () => {
  const h = await account(); await h.login(); h.consent(); await h.openWidget();
  for (const value of [undefined, {}, { payment_source: {} }, { payment_source: { token: 1, type: 'CARD' } },
    { payment_source: { token: 'synthetic', type: 'UNKNOWN' } }]) {
    await h.widgets[0].callback(value);
    assert.equal(h.posts().length, 0); assert.equal(h.button.disabled, false); assert.equal(h.status.dataset.state, 'error');
  }
  await h.widgets[0].callback(source); assert.equal(h.posts().length, 1);
});

test('metadata failure has a preparation retry that cannot load the SDK before consent', async () => {
  let reads = 0;
  const h = await account({ current: () => ++reads === 1
    ? reply({ error: { message: 'Synthetic temporary failure' } }, 503) : reply({ paymentSource: null }) });
  await h.login(); assert.equal(h.status.dataset.state, 'error'); assert.equal(h.button.disabled, false);
  await h.click(); assert.equal(reads, 2); assert.equal(h.status.textContent, '');
  assert.equal(h.appended.length, 0); assert.equal(h.posts().length, 0);
  h.consent(); await h.openWidget(); assert.equal(h.widgets.length, 1);
});

test('failed or insecure contract metadata cannot load the SDK and is recoverable', async () => {
  for (const bad of [reply({ error: { message: 'Synthetic unavailable config' } }, 503),
    reply({ ...config, acceptance: { ...config.acceptance, permalink: 'http://contracts.example.invalid/terms' } })]) {
    let failed = true;
    const h = await account({ metadata: () => failed ? bad : reply(config) });
    await h.login(); assert.equal(h.status.dataset.state, 'error'); assert.equal(h.appended.length, 0);
    failed = false; await h.click();
    assert.equal(h.terms.disabled, false); assert.equal(h.data.disabled, false); assert.equal(h.recurring.disabled, false);
    assert.equal(h.appended.length, 0); h.consent(); await h.openWidget(); assert.equal(h.widgets.length, 1);
  }
});

test('provider rejection permits a fresh attempt while ambiguous POST failures block automatic resubmission', async () => {
  for (const [failure, retryable] of [
    [() => reply({ error: { code: 'payment_source_provider_rejected', message: 'Synthetic rejection' } }, 422), true],
    [() => reply({ error: { code: 'payment_source_conflict', message: 'Synthetic conflict' } }, 409), false],
    [() => { throw new TypeError('Synthetic network failure'); }, false],
  ]) {
    let fail = true;
    const h = await account({ post: () => fail ? failure() : reply({ displayHint: 'Visa QA • 4242' }) });
    await h.login(); h.consent(); await h.openWidget(); await h.widgets[0].callback(source);
    await h.widgets[0].callback(source);
    assert.equal(h.posts().length, 1); assert.equal(h.status.dataset.state, 'error');
    assert.equal(h.button.disabled, !retryable);
    if (retryable) {
      fail = false; await h.openWidget(); await h.widgets[1].callback(source);
      assert.equal(h.posts().length, 2);
      assert.notEqual(h.posts()[0].headers['idempotency-key'], h.posts()[1].headers['idempotency-key']);
      assert.equal(h.button.disabled, false);
    }
  }
});

test('overdue states supported by the API retain explicit three-part card consent without activating access', async () => {
  for (const state of ['past_due', 'grace', 'restricted', 'suspended']) {
    const h = await account({ subscription: { status: state, currentPeriodEnd: '2020-01-01T00:00:00Z' } });
    await h.login();
    assert.equal(h.get("[data-section='payment-source']").hidden, false);
    assert.equal(h.get("[data-section='plan-management']").hidden, true);
    h.consent(true, true, false); await h.click();
    assert.equal(h.appended.length, 0); assert.equal(h.posts().length, 0);
    h.consent(); await h.openWidget(); await h.widgets[0].callback(source);
    assert.equal(JSON.parse(h.posts()[0].body).recurringConsent, true);
    assert.notEqual(h.get("[data-field='subscription-status']").textContent, 'Activo');
  }
});

test('members, cancelled subscriptions and scheduled cancellations cannot manage payment sources', async () => {
  for (const options of [{ role: 'member' }, { subscription: { status: 'cancelled' } },
    { subscription: { cancelAtPeriodEnd: true } }, { subscription: { status: 'cancel_at_period_end' } }]) {
    const h = await account(options); await h.login();
    assert.equal(h.get("[data-section='payment-source']").hidden, true);
    assert.equal(h.calls.filter(call => call.url.endsWith('/payment-sources')).length, 0);
    assert.equal(h.appended.length, 0);
  }
});

const recoverySubscriptionId = '11111111-1111-4111-8111-111111111111';
const recoverySessionId = '22222222-2222-4222-8222-222222222222';
const historicalStart = '2020-01-01T00:00:00.000Z';
const historicalEnd = '2020-02-01T00:00:00.000Z';
const recoveryOfferFixture = (changes = {}) => ({ type: 'recovery', subscriptionId: recoverySubscriptionId,
  status: 'available', blockReason: null, periodStart: historicalStart, periodEnd: historicalEnd,
  amountMinor: 7990017, currency: 'COP', needsFurtherRecovery: true,
  orderId: null, checkoutSessionId: null, expiresAt: null, ...changes });
function recoveryCheckoutFixture(offer = recoveryOfferFixture(), changes = {}) {
  const checkout = { checkoutSessionId: recoverySessionId, reference: 'QA-RECOVERY',
    amountInCents: offer.amountMinor, currency: offer.currency, expirationTime: '2035-01-01T00:00:00.000Z',
    recovery: { subscriptionId: offer.subscriptionId, subscriptionPeriodId: '33333333-3333-4333-8333-333333333333',
      periodStart: offer.periodStart, periodEnd: offer.periodEnd, needsFurtherRecovery: offer.needsFurtherRecovery }, ...changes };
  const url = new URL('https://checkout.wompi.co/p/');
  for (const [key, value] of Object.entries({ reference: checkout.reference, 'amount-in-cents': String(checkout.amountInCents),
    currency: checkout.currency, 'expiration-time': checkout.expirationTime, 'signature:integrity': 'synthetic-integrity',
    'redirect-url': `https://staging.example.invalid/pago/resultado?checkoutSessionId=${checkout.checkoutSessionId}` })) url.searchParams.set(key, value);
  return { ...checkout, checkoutUrl: url.href };
}
const recoveryAccount = (options = {}) => account({
  subscription: { status: 'suspended', currentPeriodStart: '2019-12-01T00:00:00.000Z', currentPeriodEnd: historicalStart },
  recovery: () => reply(recoveryOfferFixture()), checkout: () => reply(recoveryCheckoutFixture()), ...options,
});
const recoveryControl = (h, action) => h.get(`[data-action='${action}']`);
const recoveryClick = async (h, action = 'prepare-recovery') => { await recoveryControl(h, action).dispatch('click'); await flush(); };
const recoveryPosts = h => h.calls.filter(call => call.method === 'POST' && call.url.endsWith('/billing/checkout-sessions'));

test('recovery reads an authenticated server offer without creating a checkout or loading SDKs', async () => {
  const h = await recoveryAccount(); await h.login();
  const calls = h.calls.filter(call => call.url.endsWith('/subscription/recovery'));
  assert.equal(calls.length, 1); assert.equal(calls[0].method, 'GET');
  assert.equal(calls[0].headers.authorization, 'Bearer synthetic-auth-1');
  assert.equal(h.get("[data-section='recovery']").hidden, false);
  assert.equal(h.get('[data-recovery-summary]').hidden, false);
  assert.equal(h.get("[data-field='recovery-amount']").textContent, '79.900,17 COP');
  assert.match(h.get("[data-field='recovery-period']").textContent, /enero.*2020.*febrero.*2020.*UTC/);
  assert.match(h.get("[data-field='recovery-guidance']").textContent, /pasado/);
  assert.equal(recoveryPosts(h).length, 0); assert.equal(h.appended.length, 0); assert.equal(h.initCount(), 0);
});

test('manual recovery uses the exact server snapshot and displays checkout without navigating or granting access', async () => {
  const h = await recoveryAccount(); await h.login(); await recoveryClick(h);
  const posts = recoveryPosts(h); assert.equal(posts.length, 1);
  assert.deepEqual(JSON.parse(posts[0].body), { type: 'recovery', subscriptionId: recoverySubscriptionId, expectedPeriodStart: historicalStart });
  assert.equal(posts[0].headers.authorization, 'Bearer synthetic-auth-1');
  assert.equal(posts[0].headers['idempotency-key'], '00000000-0000-4000-8000-000000000001');
  assert.equal(recoveryControl(h, 'pay-recovery').hidden, false);
  const url = new URL(recoveryControl(h, 'pay-recovery').href);
  assert.equal(url.searchParams.get('amount-in-cents'), '7990017');
  assert.equal(url.searchParams.get('signature:integrity'), 'synthetic-integrity');
  assert.equal(new URL(url.searchParams.get('redirect-url')).searchParams.get('checkoutSessionId'), recoverySessionId);
  assert.equal(recoveryControl(h, 'recovery-result').href, '/pago/resultado?checkoutSessionId=' + recoverySessionId);
  assert.deepEqual([...h.storage], [[`cripton:recovery:${recoverySessionId}`, 'true']]);
  assert.notEqual(h.get("[data-field='subscription-status']").textContent, 'Activo');
  assert.ok(h.calls.every(call => !call.url.includes('/pos-sso'))); assert.equal(h.appended.length, 0);
});

test('recovery ignores duplicate preparation both during the request and after a checkout is ready', async () => {
  const response = deferred(); const h = await recoveryAccount({ checkout: () => response.promise });
  await h.login(); const pending = recoveryClick(h); await flush(); await recoveryClick(h);
  assert.equal(recoveryPosts(h).length, 1); assert.equal(recoveryControl(h, 'prepare-recovery').disabled, true);
  response.resolve(reply(recoveryCheckoutFixture())); await pending; await recoveryClick(h);
  assert.equal(recoveryPosts(h).length, 1); assert.equal(h.keys(), 1);
});

test('an ambiguous recovery request retries only the same payload and idempotency key', async () => {
  let requests = 0;
  const h = await recoveryAccount({ checkout() { if (++requests === 1) throw new TypeError('Synthetic network failure'); return reply(recoveryCheckoutFixture()); } });
  await h.login(); await recoveryClick(h); assert.equal(recoveryControl(h, 'pay-recovery').hidden, true);
  assert.equal(recoveryControl(h, 'prepare-recovery').disabled, false);
  await recoveryClick(h);
  assert.equal(recoveryPosts(h).length, 2); assert.equal(h.keys(), 1);
  assert.equal(recoveryPosts(h)[0].body, recoveryPosts(h)[1].body);
  assert.equal(recoveryPosts(h)[0].headers['idempotency-key'], recoveryPosts(h)[1].headers['idempotency-key']);
});

test('refreshing an existing pending period preserves the attempt and reuses its checkout', async () => {
  const offer = recoveryOfferFixture({ status: 'pending_payment', orderId: '44444444-4444-4444-8444-444444444444',
    checkoutSessionId: recoverySessionId, expiresAt: '2035-01-01T00:00:00.000Z' });
  const h = await recoveryAccount({ recovery: () => reply(offer), checkout: () => reply(recoveryCheckoutFixture(offer)) });
  await h.login(); assert.match(recoveryControl(h, 'prepare-recovery').textContent, /pendiente/);
  await recoveryClick(h); await recoveryClick(h, 'refresh-recovery'); await recoveryClick(h);
  assert.equal(recoveryPosts(h).length, 2);
  assert.equal(recoveryPosts(h)[0].headers['idempotency-key'], recoveryPosts(h)[1].headers['idempotency-key']);
  assert.equal(new URL(recoveryControl(h, 'pay-recovery').href).searchParams.get('reference'), 'QA-RECOVERY');
});

test('a stale recovery snapshot conflict exposes no checkout and never silently advances the period', async () => {
  const h = await recoveryAccount({ checkout: () => reply({ error: { code: 'checkout_conflict', message: 'Actualiza Mi cuenta.' } }, 409) });
  await h.login(); await recoveryClick(h); await recoveryClick(h);
  assert.equal(h.get('.recovery-status').dataset.state, 'error'); assert.equal(recoveryControl(h, 'pay-recovery').hidden, true);
  assert.ok(recoveryPosts(h).every(call => JSON.parse(call.body).expectedPeriodStart === historicalStart));
  assert.equal(new Set(recoveryPosts(h).map(call => call.headers['idempotency-key'])).size, 1);
});

test('the next historical period requires refreshed server coverage and gets a new serial attempt', async () => {
  let applied = false;
  const next = recoveryOfferFixture({ periodStart: historicalEnd, periodEnd: '2020-03-01T00:00:00.000Z' });
  const h = await recoveryAccount({ recovery: () => reply(applied ? next : recoveryOfferFixture()),
    checkout: () => reply(recoveryCheckoutFixture(applied ? next : recoveryOfferFixture())) });
  await h.login(); await recoveryClick(h);
  const oldKey = recoveryPosts(h)[0].headers['idempotency-key'];
  await recoveryClick(h, 'refresh-recovery'); await recoveryClick(h);
  assert.equal(recoveryPosts(h)[1].headers['idempotency-key'], oldKey);
  assert.equal(JSON.parse(recoveryPosts(h)[1].body).expectedPeriodStart, historicalStart);
  applied = true; h.setSubscription({ currentPeriodEnd: historicalEnd, status: 'suspended' });
  await recoveryClick(h, 'refresh-recovery'); await recoveryClick(h);
  assert.equal(JSON.parse(recoveryPosts(h)[2].body).expectedPeriodStart, historicalEnd);
  assert.notEqual(recoveryPosts(h)[2].headers['idempotency-key'], oldKey);
  assert.equal(h.get("[data-field='subscription-status']").textContent, 'Suspendido');
  assert.match(h.get("[data-field='recovery-guidance']").textContent, /pasado/);
});

test('every server block reason prevents new checkout while allowing consultation of an existing payment', async () => {
  for (const reason of ['not_due', 'cancellation', 'payment_pending', 'requires_review', 'plan_change_pending']) {
    const h = await recoveryAccount({ recovery: () => reply(recoveryOfferFixture({ status: 'blocked', blockReason: reason,
      checkoutSessionId: reason === 'payment_pending' ? recoverySessionId : null })) });
    await h.login(); await recoveryClick(h);
    assert.equal(recoveryControl(h, 'prepare-recovery').disabled, true); assert.equal(recoveryPosts(h).length, 0);
    assert.equal(h.get('[data-recovery-summary]').hidden, true);
    assert.ok(h.get('.recovery-status').textContent.length > 0);
    assert.equal(recoveryControl(h, 'recovery-result').hidden, reason !== 'payment_pending');
  }
});

test('malformed, foreign or incomplete recovery offers fail closed before any checkout', async () => {
  for (const changes of [{ subscriptionId: recoverySessionId }, { type: 'upgrade' }, { status: ['available'] },
    { periodStart: 'not-a-date' }, { periodStart: '2020-02-31T00:00:00.000Z' }, { periodEnd: historicalStart },
    { amountMinor: -1 }, { amountMinor: 1.25 }, { currency: 'USD' }, { needsFurtherRecovery: 'false' },
    { checkoutSessionId: 'not-an-id' }, { periodEnd: undefined }]) {
    const h = await recoveryAccount({ recovery: () => reply(recoveryOfferFixture(changes)) });
    await h.login(); await recoveryClick(h);
    assert.equal(h.get('.recovery-status').dataset.state, 'error'); assert.equal(recoveryPosts(h).length, 0);
    assert.equal(recoveryControl(h, 'pay-recovery').hidden, true);
  }
});

test('checkout differences in subscription, period or quoted amount never produce a payment link', async () => {
  for (const changes of [{ amountInCents: 7990000 }, { currency: 'USD' },
    { recovery: { ...recoveryCheckoutFixture().recovery, subscriptionId: recoverySessionId } },
    { recovery: { ...recoveryCheckoutFixture().recovery, periodStart: '2020-01-02T00:00:00.000Z' } },
    { recovery: { ...recoveryCheckoutFixture().recovery, periodEnd: '2020-03-01T00:00:00.000Z' } }]) {
    const h = await recoveryAccount({ checkout: () => reply(recoveryCheckoutFixture(recoveryOfferFixture(), changes)) });
    await h.login(); await recoveryClick(h);
    assert.equal(h.get('.recovery-status').dataset.state, 'error'); assert.equal(recoveryControl(h, 'pay-recovery').hidden, true);
    assert.equal(recoveryControl(h, 'recovery-result').hidden, true);
  }
});

test('foreign, tampered and mismatched-return checkout URLs are rejected before navigation', async () => {
  const original = recoveryCheckoutFixture();
  for (const mutate of [url => { url.hostname = 'evil.example.invalid'; },
    url => url.searchParams.set('amount-in-cents', '1'), url => url.searchParams.append('reference', 'DUPLICATE'),
    url => url.searchParams.set('redirect-url', 'https://evil.example.invalid/pago/resultado'),
    url => url.searchParams.set('redirect-url', `https://staging.example.invalid/pago/resultado?checkoutSessionId=${recoverySubscriptionId}`)]) {
    const url = new URL(original.checkoutUrl); mutate(url);
    const h = await recoveryAccount({ checkout: () => reply({ ...original, checkoutUrl: url.href }) });
    await h.login(); await recoveryClick(h);
    assert.equal(h.get('.recovery-status').dataset.state, 'error'); assert.equal(recoveryControl(h, 'pay-recovery').hidden, true);
  }
});

test('an expired checkout cannot be opened even if it expires after being displayed', async () => {
  const checkout = recoveryCheckoutFixture(recoveryOfferFixture(), { expirationTime: '2026-11-10T00:01:00.000Z' });
  const h = await recoveryAccount({ checkout: () => reply(checkout) }); await h.login(); await recoveryClick(h);
  assert.equal(recoveryControl(h, 'pay-recovery').hidden, false);
  h.setNow(Date.parse(checkout.expirationTime)); let prevented = false;
  await recoveryControl(h, 'pay-recovery').dispatch('click', { preventDefault() { prevented = true; } });
  assert.equal(prevented, true); assert.equal(recoveryControl(h, 'pay-recovery').hidden, true);
  assert.equal(recoveryControl(h, 'pay-recovery').href, undefined);
});

test('logout invalidates an in-flight checkout response and removes its payment links', async () => {
  const response = deferred(); const h = await recoveryAccount({ checkout: () => response.promise });
  await h.login(); const pending = recoveryClick(h); await flush(); await h.logout();
  response.resolve(reply(recoveryCheckoutFixture())); await pending;
  assert.equal(h.get("[data-section='recovery']").hidden, true);
  assert.equal(recoveryControl(h, 'pay-recovery').hidden, true); assert.equal(h.get('.recovery-status').textContent, '');
});

test('a stale recovery offer cannot overwrite the next authenticated session', async () => {
  const response = deferred(); let reads = 0;
  const h = await recoveryAccount({ recovery: () => ++reads === 1 ? response.promise
    : reply(recoveryOfferFixture({ status: 'blocked', blockReason: 'requires_review' })) });
  await h.login(); await h.logout(); await h.login();
  response.resolve(reply(recoveryOfferFixture())); await flush();
  assert.equal(recoveryControl(h, 'prepare-recovery').disabled, true);
  assert.match(h.get('.recovery-status').textContent, /revisión/); assert.equal(recoveryPosts(h).length, 0);
});

test('recovery endpoint failures remain retryable through authenticated refresh without creating an order', async () => {
  let failed = true;
  const h = await recoveryAccount({ recovery: () => failed ? reply({ error: { message: 'Synthetic unavailable offer' } }, 503)
    : reply(recoveryOfferFixture()) });
  await h.login(); assert.equal(h.get('.recovery-status').dataset.state, 'error');
  assert.equal(recoveryControl(h, 'prepare-recovery').disabled, true);
  failed = false; await recoveryClick(h, 'refresh-recovery');
  assert.equal(recoveryControl(h, 'prepare-recovery').disabled, false); assert.equal(recoveryPosts(h).length, 0);
  assert.equal(h.appended.length, 0);
});

test('non-managing roles and unexpired active subscriptions cannot prepare manual recovery', async () => {
  for (const options of [{ role: 'member' }, { subscription: { status: 'active', currentPeriodEnd: '2035-01-01T00:00:00.000Z' } },
    { subscription: { status: 'cancelled', currentPeriodEnd: historicalStart } }]) {
    const h = await recoveryAccount(options); await h.login(); await recoveryClick(h);
    assert.equal(h.get("[data-section='recovery']").hidden, true); assert.equal(recoveryPosts(h).length, 0);
    assert.equal(h.calls.filter(call => call.url.endsWith('/subscription/recovery')).length, 0);
  }
});

test('a refreshed future subscription hides recovery without inferring access from the previous checkout', async () => {
  const h = await recoveryAccount(); await h.login(); await recoveryClick(h);
  h.setSubscription({ status: 'active', currentPeriodEnd: '2035-01-01T00:00:00.000Z' });
  await recoveryClick(h, 'refresh-recovery');
  assert.equal(h.get("[data-section='recovery']").hidden, true); assert.equal(recoveryControl(h, 'pay-recovery').hidden, true);
  assert.ok(h.calls.every(call => !call.url.includes('/pos-sso'))); assert.equal(recoveryPosts(h).length, 1);
});

test('denied storage access or writes cannot prevent a validated manual checkout', async () => {
  for (const deny of [h => Object.defineProperty(h.sandbox, 'sessionStorage', { get() { throw new Error('Synthetic storage denied'); } }),
    h => { h.sandbox.sessionStorage.setItem = () => { throw new Error('Synthetic quota failure'); }; }]) {
    const h = await recoveryAccount(); deny(h); await h.login(); await recoveryClick(h);
    assert.equal(recoveryControl(h, 'pay-recovery').hidden, false); assert.equal(recoveryPosts(h).length, 1);
  }
});

const accountAction = (h, action) => h.get(`[data-action='${action}']`);
const ssoCalls = h => h.calls.filter(call => call.url.endsWith('/auth/pos-sso'));
const renewalCalls = h => h.calls.filter(call => /\/subscription\/(cancel|reactivate)$/.test(call.url));

test('suspended, pending and other unavailable tenants cannot open POS even through programmatic events', async () => {
  for (const tenantStatus of ['suspended', 'pending', 'provisioning', 'failed', 'unknown']) {
    const h = await account({ tenantStatus }); await h.login();
    const link = accountAction(h, 'open-pos');
    assert.equal(link.getAttribute('aria-disabled'), 'true'); assert.equal(link.getAttribute('tabindex'), '-1');
    assert.equal(link.href, undefined);
    await link.dispatch('click');
    link.removeAttribute('aria-disabled'); await link.dispatch('click');
    assert.equal(ssoCalls(h).length, 0); assert.equal(h.navigations.length, 0);
    assert.match(h.get("[data-field='access-guidance']").textContent, /POS/);
  }
});

test('grace and restricted preserve server-authorized POS access for every existing membership role', async () => {
  for (const role of ['owner', 'admin', 'member', 'billing']) {
    for (const tenantStatus of ['active', 'restricted']) {
      const h = await account({ role, tenantStatus, subscription: { status: tenantStatus === 'restricted' ? 'restricted' : 'grace',
        currentPeriodStart: '2026-09-01T00:00:00.000Z', currentPeriodEnd: '2026-10-01T00:00:00.000Z' } });
      await h.login(); const link = accountAction(h, 'open-pos');
      assert.equal(link.getAttribute('aria-disabled'), null); assert.equal(link.href, 'https://pos.example.invalid');
      await link.dispatch('click');
      assert.equal(ssoCalls(h).length, 1); assert.equal(h.navigations.length, 1);
      assert.match(h.navigations[0], /^https:\/\/pos\.example\.invalid\/auth\/sso\?/);
    }
  }
});

test('ARIA-disabled and unknown-role POS links cannot issue SSO; an in-flight request cannot duplicate', async () => {
  const response = deferred(); const h = await account({ sso: () => response.promise }); await h.login();
  const link = accountAction(h, 'open-pos'); link.setAttribute('aria-disabled', 'true');
  await link.dispatch('click'); assert.equal(ssoCalls(h).length, 0);
  link.removeAttribute('aria-disabled'); const pending = link.dispatch('click'); await flush(); await link.dispatch('click');
  assert.equal(ssoCalls(h).length, 1);
  response.resolve(reply({ redirectUrl: 'https://pos.example.invalid/auth/sso?ticket=synthetic-ticket' }, 201)); await pending;
  assert.equal(link.getAttribute('aria-disabled'), 'true'); assert.equal(h.navigations.length, 1);
  const unknown = await account({ role: 'unknown' }); await unknown.login();
  await accountAction(unknown, 'open-pos').dispatch('click'); assert.equal(ssoCalls(unknown).length, 0);
});

test('expired recovery hides renewal toggles and explains debt without sending cancellation or reactivation', async () => {
  for (const cancelAtPeriodEnd of [false, true]) {
    const h = await recoveryAccount({ tenantStatus: 'suspended', subscription: { status: 'suspended',
      currentPeriodStart: '2026-09-01T00:00:00.000Z', currentPeriodEnd: '2026-10-01T00:00:00.000Z', cancelAtPeriodEnd } });
    await h.login();
    assert.equal(accountAction(h, 'cancel').hidden, true); assert.equal(accountAction(h, 'cancel').disabled, true);
    assert.equal(accountAction(h, 'reactivate').hidden, true); assert.equal(accountAction(h, 'reactivate').disabled, true);
    assert.match(h.get("[data-field='access-guidance']").textContent, /atraso.*recuperación.*suspendido/);
    await accountAction(h, 'cancel').dispatch('click'); assert.equal(h.get('#cancel-dialog').hidden, true);
    await h.get('#confirm-cancel').dispatch('click'); await accountAction(h, 'reactivate').dispatch('click');
    assert.equal(renewalCalls(h).length, 0); assert.equal(ssoCalls(h).length, 0);
  }
});

test('missing, invalid, reversed and empty intervals disable renewal toggles without breaking rendering', async () => {
  for (const period of [{ currentPeriodStart: null }, { currentPeriodEnd: null }, { currentPeriodEnd: 'not-a-date' },
    { currentPeriodStart: 'not-a-date' }, { currentPeriodStart: '2031-01-01T00:00:00.000Z' },
    { currentPeriodStart: '2030-02-01T00:00:00.000Z' }]) {
    for (const cancelAtPeriodEnd of [false, true]) {
      const h = await account({ subscription: { ...period, cancelAtPeriodEnd } }); await h.login();
      assert.equal(h.get('.account-panel').hidden, false);
      assert.equal(accountAction(h, 'cancel').hidden, true); assert.equal(accountAction(h, 'reactivate').hidden, true);
      await h.get('#confirm-cancel').dispatch('click'); await accountAction(h, 'reactivate').dispatch('click');
      assert.equal(renewalCalls(h).length, 0);
      assert.match(h.get("[data-field='access-guidance']").textContent, /período/);
    }
  }
});

test('current-period owner/admin/billing retain cancellation and reactivation while members cannot manage', async () => {
  for (const role of ['owner', 'admin', 'billing', 'member']) {
    const h = await account({ role }); await h.login();
    assert.equal(accountAction(h, 'cancel').hidden, role === 'member');
    await accountAction(h, 'cancel').dispatch('click'); await h.get('#confirm-cancel').dispatch('click');
    if (role === 'member') { assert.equal(renewalCalls(h).length, 0); continue; }
    assert.equal(renewalCalls(h).length, 1); assert.equal(accountAction(h, 'cancel').hidden, true);
    assert.equal(accountAction(h, 'reactivate').hidden, false);
    await accountAction(h, 'reactivate').dispatch('click');
    assert.equal(renewalCalls(h).length, 2); assert.equal(accountAction(h, 'cancel').hidden, false);
    assert.equal(accountAction(h, 'reactivate').hidden, true);
    assert.ok(renewalCalls(h).every(call => call.headers.authorization === 'Bearer synthetic-auth-1'));
  }
});

test('renewal controls expire before an already open modal can submit', async () => {
  const end = '2026-11-10T00:01:00.000Z';
  const h = await account({ subscription: { currentPeriodStart: '2026-11-10T00:00:00.000Z', currentPeriodEnd: end } });
  await h.login(); assert.equal(accountAction(h, 'cancel').hidden, false);
  await accountAction(h, 'cancel').dispatch('click'); assert.equal(h.get('#cancel-dialog').hidden, false);
  h.setNow(Date.parse(end)); await h.get('#confirm-cancel').dispatch('click');
  assert.equal(renewalCalls(h).length, 0); assert.equal(h.get('#cancel-dialog').hidden, true);
  assert.equal(accountAction(h, 'cancel').hidden, true); assert.match(h.get("[data-field='access-guidance']").textContent, /atraso/);
});

test('early paid renewal with start in two hours permits cancel/reactivate by flag until the end expires', async () => {
  const period = { currentPeriodStart: '2026-11-10T02:00:00.000Z', currentPeriodEnd: '2026-12-10T02:00:00.000Z' };
  for (const role of ['owner', 'admin', 'billing']) {
    for (const cancelAtPeriodEnd of [false, true]) {
      const h = await account({ role, subscription: { ...period, cancelAtPeriodEnd } }); await h.login();
      assert.equal(accountAction(h, 'cancel').hidden, cancelAtPeriodEnd);
      assert.equal(accountAction(h, 'reactivate').hidden, !cancelAtPeriodEnd);
      assert.equal(accountAction(h, cancelAtPeriodEnd ? 'reactivate' : 'cancel').disabled, false);
      assert.doesNotMatch(h.get("[data-field='access-guidance']").textContent, /no comenzó|no está disponible|atraso/);
      if (cancelAtPeriodEnd) await accountAction(h, 'reactivate').dispatch('click');
      else { await accountAction(h, 'cancel').dispatch('click'); await h.get('#confirm-cancel').dispatch('click'); }
      assert.equal(renewalCalls(h).length, 1);
      assert.ok(renewalCalls(h)[0].url.endsWith(cancelAtPeriodEnd ? '/reactivate' : '/cancel'));
      assert.equal(renewalCalls(h)[0].headers.authorization, 'Bearer synthetic-auth-1');
      assert.equal(accountAction(h, 'cancel').hidden, !cancelAtPeriodEnd);
      assert.equal(accountAction(h, 'reactivate').hidden, cancelAtPeriodEnd);
      assert.equal(accountAction(h, 'open-pos').getAttribute('aria-disabled'), null);
      h.setNow(Date.parse(period.currentPeriodEnd));
      await accountAction(h, 'cancel').dispatch('click'); await h.get('#confirm-cancel').dispatch('click');
      await accountAction(h, 'reactivate').dispatch('click');
      assert.equal(renewalCalls(h).length, 1);
      assert.equal(accountAction(h, 'cancel').hidden, true); assert.equal(accountAction(h, 'reactivate').hidden, true);
    }
  }
});

test('a stale SSO response cannot navigate or re-enable POS after another login is suspended', async () => {
  for (const reject of [false, true]) {
    const response = deferred(); const h = await account({ sso: () => response.promise }); await h.login();
    const pending = accountAction(h, 'open-pos').dispatch('click'); await flush();
    await h.logout(); h.setTenant({ status: 'suspended' }); await h.login();
    if (reject) response.reject(new TypeError('Synthetic stale failure'));
    else response.resolve(reply({ redirectUrl: 'https://pos.example.invalid/auth/sso?ticket=synthetic-ticket' }, 201));
    await pending;
    assert.equal(h.navigations.length, 0); assert.equal(accountAction(h, 'open-pos').getAttribute('aria-disabled'), 'true');
    assert.equal(accountAction(h, 'open-pos').href, undefined); assert.equal(h.get('.account-status').textContent, '');
  }
});

test('late renewal responses cannot overwrite a subsequent member session', async () => {
  for (const scheduled of [false, true]) {
    const response = deferred(); const h = await account({ subscription: { cancelAtPeriodEnd: scheduled },
      cancel: () => response.promise, reactivate: () => response.promise });
    await h.login();
    const pending = scheduled ? accountAction(h, 'reactivate').dispatch('click') : h.get('#confirm-cancel').dispatch('click');
    await flush(); await h.logout(); h.setTenant({ role: 'member' }); await h.login();
    const currentMessage = h.get('.account-status').textContent;
    response.resolve(reply({ status: 'active', currentPeriodStart: '2026-11-01T00:00:00.000Z',
      currentPeriodEnd: '2030-02-01T00:00:00Z', cancelAtPeriodEnd: !scheduled })); await pending;
    assert.match(h.get("[data-field='principal-name']").textContent, /member/);
    assert.equal(accountAction(h, 'cancel').hidden, true); assert.equal(accountAction(h, 'reactivate').hidden, true);
    assert.equal(h.get('.account-status').textContent, currentMessage);
  }
});

test('recovery refresh uses current tenant state and role along with updated coverage', async () => {
  const h = await recoveryAccount({ tenantStatus: 'suspended' }); await h.login();
  assert.equal(accountAction(h, 'open-pos').getAttribute('aria-disabled'), 'true');
  h.setSubscription({ status: 'active', currentPeriodStart: '2026-11-01T00:00:00.000Z', currentPeriodEnd: '2035-01-01T00:00:00.000Z' });
  h.setTenant({ status: 'restricted', role: 'member' }); await recoveryClick(h, 'refresh-recovery');
  assert.equal(h.get("[data-field='tenant-status']").textContent, 'Solo lectura');
  assert.equal(accountAction(h, 'open-pos').getAttribute('aria-disabled'), null);
  assert.equal(accountAction(h, 'cancel').hidden, true); assert.equal(accountAction(h, 'reactivate').hidden, true);
  const read = h.calls.find(call => call.url.endsWith('/v1/me/tenants'));
  assert.equal(read.headers.authorization, 'Bearer synthetic-auth-1');
  assert.equal(h.navigations.length, 0); assert.equal(ssoCalls(h).length, 0);
});

test('a foreign tenant in a recovery refresh cannot re-enable suspended access', async () => {
  const h = await recoveryAccount({ tenantStatus: 'suspended', tenants: () => reply({ activeTenantId: 'another-tenant',
    tenants: [{ tenantId: 'another-tenant', status: 'active', role: 'owner' }] }) });
  await h.login(); h.setSubscription({ status: 'active', currentPeriodEnd: '2035-01-01T00:00:00.000Z' });
  await recoveryClick(h, 'refresh-recovery');
  assert.equal(accountAction(h, 'open-pos').getAttribute('aria-disabled'), 'true');
  assert.equal(h.get("[data-field='tenant-status']").textContent, 'Suspendido');
  assert.equal(h.get('.recovery-status').dataset.state, 'error');
});

const unauthorized = () => ({ ok: false, status: 401, json() { assert.fail('a 401 body must not be read before resetting auth'); } });
const tenantResponse = () => reply({ activeTenantId: 'synthetic-tenant-1',
  tenants: [{ tenantId: 'synthetic-tenant-1', name: 'QA', role: 'owner', status: 'suspended' }] });

test('a current-session 401 at either refresh step or offer resets the whole account and stops the request chain', async () => {
  for (const phase of ['subscription', 'tenants', 'offer']) {
    let expired = false;
    const h = await recoveryAccount({ tenantStatus: 'suspended',
      readSubscription: (_call, view) => expired && phase === 'subscription' ? unauthorized() : reply(view),
      tenants: () => expired && phase === 'tenants' ? unauthorized() : tenantResponse(),
      recovery: () => expired && phase === 'offer' ? unauthorized() : reply(recoveryOfferFixture()),
    });
    await h.login(); await recoveryClick(h); h.consent();
    assert.equal(recoveryControl(h, 'pay-recovery').hidden, false);
    const before = h.calls.length; expired = true; await recoveryClick(h, 'refresh-recovery');
    const paths = ['/v1/me/subscription', '/v1/me/tenants', '/v1/me/subscription/recovery'];
    assert.deepEqual(h.calls.slice(before).map(call => new URL(call.url).pathname), paths.slice(0, paths.indexOf(
      phase === 'subscription' ? paths[0] : phase === 'tenants' ? paths[1] : paths[2]) + 1));
    assert.equal(h.get('.account-panel').hidden, true); assert.equal(h.get('#login-form').hidden, false);
    assert.match(h.get('.status').textContent, /sesión.*expiró.*iniciar sesión/);
    assert.equal(h.get('.status').dataset.state, 'error'); assert.equal(h.get('#email').focused, true);
    assert.equal(h.get("button[type='submit']").disabled, false);
    assert.equal(h.get('[data-recovery-summary]').hidden, true);
    assert.equal(h.get("[data-field='recovery-amount']").textContent, '');
    assert.equal(h.get("[data-field='recovery-period']").textContent, '');
    assert.equal(h.get('.recovery-status').textContent, ''); assert.equal(h.get('.account-status').textContent, '');
    assert.equal(recoveryControl(h, 'pay-recovery').hidden, true); assert.equal(recoveryControl(h, 'pay-recovery').href, undefined);
    assert.equal(recoveryControl(h, 'recovery-result').hidden, true);
    assert.equal(recoveryControl(h, 'prepare-recovery').disabled, true);
    assert.equal(accountAction(h, 'open-pos').getAttribute('aria-disabled'), 'true');
    assert.equal(accountAction(h, 'cancel').hidden, true); assert.equal(accountAction(h, 'reactivate').hidden, true);
    assert.equal(h.button.disabled, true); assert.equal(h.terms.checked, false); assert.equal(h.data.checked, false); assert.equal(h.recurring.checked, false);
    const after = h.calls.length;
    await h.click(); await recoveryClick(h); await accountAction(h, 'open-pos').dispatch('click');
    assert.equal(h.calls.length, after, 'the reset must remove the old authentication context');
    assert.ok([...h.storage].every(([key, value]) => key.startsWith('cripton:recovery:') && value === 'true'));
    expired = false; await h.login();
    assert.equal(h.get('.account-panel').hidden, false); assert.equal(h.get('#login-form').hidden, true);
    await h.logout(); assert.equal(h.get('.status').textContent, ''); assert.equal(h.get('.status').dataset.state, '');
  }
});

test('a late 401 from either refresh step cannot close or alter a later login', async () => {
  for (const phase of ['subscription', 'tenants']) {
    const response = deferred(); let hold = false;
    const h = await recoveryAccount({
      readSubscription: (_call, view) => hold && phase === 'subscription' ? response.promise : reply(view),
      tenants: () => hold && phase === 'tenants' ? response.promise : tenantResponse(),
    });
    await h.login(); hold = true; await recoveryClick(h, 'refresh-recovery');
    await h.logout(); hold = false; await h.login();
    const status = h.get('.recovery-status').textContent;
    response.resolve(unauthorized()); await flush();
    assert.equal(h.get('.account-panel').hidden, false); assert.equal(h.get('#login-form').hidden, true);
    assert.equal(h.get('.recovery-status').textContent, status);
    assert.doesNotMatch(h.get('.status').textContent, /expiró/);
    assert.equal(recoveryControl(h, 'prepare-recovery').disabled, false);
    await recoveryClick(h);
    assert.equal(recoveryPosts(h).at(-1).headers.authorization, 'Bearer synthetic-auth-2');
  }
});

test('a late initial offer 401 cannot reset a newer authenticated account', async () => {
  const response = deferred(); let first = true;
  const h = await recoveryAccount({ recovery: () => {
    if (first) { first = false; return response.promise; }
    return reply(recoveryOfferFixture());
  } });
  await h.login(); await h.logout(); await h.login();
  response.resolve(unauthorized()); await flush();
  assert.equal(h.get('.account-panel').hidden, false); assert.equal(recoveryControl(h, 'prepare-recovery').disabled, false);
  assert.doesNotMatch(h.get('.status').textContent, /expiró/);
});

test('403 and temporary recovery failures do not sign out the current session', async () => {
  for (const status of [403, 503]) {
    for (const phase of ['subscription', 'tenants']) {
      let fail = false;
      const failure = () => reply({ error: { message: 'Synthetic non-auth failure' } }, status);
      const h = await recoveryAccount({
        readSubscription: (_call, view) => fail && phase === 'subscription' ? failure() : reply(view),
        tenants: () => fail && phase === 'tenants' ? failure() : tenantResponse(),
      });
      await h.login(); fail = true; await recoveryClick(h, 'refresh-recovery');
      assert.equal(h.get('.account-panel').hidden, false); assert.equal(h.get('#login-form').hidden, true);
      assert.equal(h.get('.recovery-status').dataset.state, 'error');
      assert.match(h.get('.recovery-status').textContent, /Synthetic non-auth failure/);
      assert.doesNotMatch(h.get('.status').textContent, /expiró/);
    }
  }
});

test('recovery checkout 401 uses the same canonical reset and cannot sign out a subsequent login', async () => {
  for (const stale of [false, true]) {
    const response = deferred(); const h = await recoveryAccount({ checkout: () => response.promise });
    await h.login(); const pending = recoveryClick(h); await flush();
    if (stale) { await h.logout(); await h.login(); }
    response.resolve(unauthorized()); await pending;
    assert.equal(h.get('.account-panel').hidden, !stale); assert.equal(h.get('#login-form').hidden, stale);
    if (!stale) assert.match(h.get('.status').textContent, /expiró/);
    else assert.doesNotMatch(h.get('.status').textContent, /expiró/);
    assert.equal(recoveryControl(h, 'pay-recovery').hidden, true); assert.equal(recoveryPosts(h).length, 1);
  }
});
