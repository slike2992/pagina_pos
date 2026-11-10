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
  const timers = new Map();
  const elements = new Map();
  let clock = 0, nextTimer = 0, nextKey = 0;
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
      removeAttribute(name) { attributes.delete(name); },
      remove() { this.removed = true; },
      focus() {}, showModal() { this.hidden = false; }, close() { this.hidden = true; },
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
    location: { assign() { assert.fail('unexpected navigation'); } },
  };
  const sandbox = {
    document, window, URL, Intl, Error, Uint8Array,
    crypto: { randomUUID: () => `00000000-0000-4000-8000-${String(++nextKey).padStart(12, '0')}` },
    fetch() { assert.fail('unmodelled HTTP request'); },
    sessionStorage: { setItem() { assert.fail('unexpected storage write'); } },
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
    ...helper, document, window, sandbox, context, module, elements, scripts, appended, timers, element,
    keys: () => nextKey,
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
    "[data-acceptance='recurring']", "button[type='submit']", "[data-action='logout']", '#email',
    ...['tenant-name', 'principal-name', 'tenant-status', 'plan', 'price', 'subscription-status', 'period-end',
      'cancel-date', 'payment-source-current', 'wompi-terms', 'wompi-personal-data', 'recurring-consent',
      'target-plan-name', 'plan-change-copy'].map(name => `[data-field='${name}']`)];
  for (const selector of selectors) h.elements.set(selector, h.element());
  const get = selector => h.elements.get(selector);
  const loginForm = get('#login-form');
  loginForm.reset = () => { loginForm.values = []; };
  get('#tenant-field').hidden = true;
  get('.account-panel').hidden = true;
  const button = get("[data-action='add-payment-source']");
  button.disabled = true;
  const status = get('.payment-source-status');
  const terms = get("[data-acceptance='terms']");
  const data = get("[data-acceptance='personal-data']");
  const recurring = get("[data-acceptance='recurring']");
  const calls = [], widgets = [];
  let loginCount = 0, initCount = 0;
  const subscription = { status: 'active', plan: { code: 'basic', name: 'Básico' },
    price: { amountMinor: 7990000, currency: 'COP', billingInterval: 'monthly' },
    currentPeriodEnd: '2030-02-01T00:00:00Z', cancelAtPeriodEnd: false };
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
      return reply({ accessToken: `synthetic-auth-${loginCount}`, principal: { displayName: 'QA' },
        tenant: { tenantId: `synthetic-tenant-${loginCount}`, name: 'QA', role: options.role ?? 'owner', status: 'active' } });
    }
    if (path === '/v1/me/subscription') return reply(subscription);
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
  h.module(accountCode, name => {
    if (name === '../scripts/client-idempotency') return idempotency;
    if (name === '../lib/wompi-client') return { prepareWompiSession: h.prepareWompiSession };
    assert.fail(`unexpected controller import: ${name}`);
  });
  return Object.assign(h, {
    get, button, status, terms, data, recurring, calls, widgets, Widget,
    initCount: () => initCount,
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
