import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { readAccountPlans, loadAccountPlans, selectAccountPlan, accountPlanLabel } from '../src/lib/account-plans.ts';
import { readPendingPlanChange, readUpgradeCheckout } from '../src/lib/subscription-upgrade.ts';

const codes = ['basic', 'professional', 'enterprise', 'basic-fe', 'professional-fe', 'enterprise-fe'];
const published = () => ({ country: 'CO', currency: 'COP', plans: codes.map((code, index) => ({
  code, name: `Publicado ${code}`, monthly: { amountMinor: 123451 + index, currency: 'COP' },
  annual: { amountMinor: 987651 + index, currency: 'COP' }, implementation: { amountMinor: 0, currency: 'COP' },
  electronicInvoicing: code.endsWith('-fe'), highlighted: false,
})) });
const context = { country: 'CO', currency: 'COP', billingInterval: 'monthly' };
const reply = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const flush = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => Promise.withResolvers();
const plain = value => JSON.parse(JSON.stringify(value));

test('actual public schema exposes six plans, FE flags, names and only the current published period price', () => {
  for (const billingInterval of ['monthly', 'annual']) {
    const raw = published(), catalog = readAccountPlans(raw, { ...context, billingInterval });
    assert.deepEqual(catalog.plans.map(plan => plan.code), codes);
    assert.equal(catalog.plans.filter(plan => plan.electronicInvoicing).length, 3);
    for (let index = 0; index < codes.length; index++) {
      assert.equal(catalog.plans[index].amountMinor, raw.plans[index][billingInterval].amountMinor);
      assert.equal(catalog.plans[index].name, raw.plans[index].name);
      assert.ok(accountPlanLabel(catalog.plans[index]).includes(billingInterval === 'annual' ? '/ año' : '/ mes'));
    }
    assert.equal(selectAccountPlan(catalog, 'professional-fe'), 'professional-fe');
    assert.equal(selectAccountPlan(catalog, 'professional-fe', 'not-published'), 'professional-fe');
  }
});

for (const mutate of [
  raw => { raw.country = 'US'; }, raw => { raw.currency = 'USD'; }, raw => { raw.plans = []; },
  raw => { raw.plans[0].monthly.amountMinor = -1; }, raw => { raw.plans[0].annual.amountMinor = 2.5; },
  raw => { raw.plans[0].annual.currency = 'USD'; }, raw => { delete raw.plans[0].monthly; },
  raw => { raw.plans[3].electronicInvoicing = false; }, raw => { raw.plans[1].code = raw.plans[0].code; },
  raw => { raw.plans[0].code = 'unpublished'; }, raw => { raw.plans[0].name = ''; },
]) test(`malformed catalogue fails closed (${mutate.toString()})`, () => {
  const raw = published(); mutate(raw);
  assert.throws(() => readAccountPlans(raw, context), /catálogo publicado/);
});

test('unsupported currency/period and missing current plan never fall back to basic/monthly', async () => {
  for (const market of [{ ...context, currency: 'USD' }, { ...context, country: 'US' }, { ...context, billingInterval: 'weekly' }]) {
    let calls = 0;
    await assert.rejects(loadAccountPlans('https://api.example.invalid', market, async () => { calls++; return reply(published()); }));
    assert.equal(calls, 0);
  }
  const raw = published(); raw.plans = raw.plans.filter(plan => plan.code !== 'professional-fe');
  assert.throws(() => selectAccountPlan(readAccountPlans(raw, context), 'professional-fe'), /plan actual/);
});

test('catalogue fetch uses only the existing public endpoint and does not send account authorization', async () => {
  const calls = [];
  await loadAccountPlans('https://api.example.invalid/', context, async (...args) => { calls.push(args); return reply(published()); });
  assert.equal(calls[0][0], 'https://api.example.invalid/v1/public/plans?country=CO&currency=COP');
  assert.deepEqual(calls[0][1], { headers: { accept: 'application/json' } });
});

const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const page = await readFile(new URL('../src/pages/cuenta.astro', import.meta.url), 'utf8');
const accountCode = compile(page.match(/<script>([\s\S]*?)<\/script>/)[1]);
const plansCode = compile(await readFile(new URL('../src/lib/account-plans.ts', import.meta.url), 'utf8'));
const recoveryCode = compile(await readFile(new URL('../src/lib/subscription-recovery.ts', import.meta.url), 'utf8'));
const returnCode = compile(await readFile(new URL('../src/lib/checkout-return.ts', import.meta.url), 'utf8'));
const upgradeCode = compile(await readFile(new URL('../src/lib/subscription-upgrade.ts', import.meta.url), 'utf8'));

function browser(options = {}) {
  const elements = new Map(), calls = [], navigations = [];
  const get = selector => {
    if (!elements.has(selector)) elements.set(selector, element());
    return elements.get(selector);
  };
  function element() {
    const attrs = new Map(), listeners = new Map();
    return { value: '', textContent: '', children: [], hidden: false, disabled: false, dataset: {}, checked: false,
      querySelector: get, focus() {}, reset() {}, showModal() { this.hidden = false; }, close() { this.hidden = true; },
      addEventListener(name, callback) { listeners.set(name, callback); },
      async dispatch(name) { return listeners.get(name)?.({ preventDefault() {} }); },
      setAttribute: (key, value) => attrs.set(key, value), getAttribute: key => attrs.get(key) ?? null,
      removeAttribute(key) { attrs.delete(key); if (key === 'href') delete this.href; },
      replaceChildren(...children) { this.children = children; }, appendChild(child) { this.children.push(child); },
    };
  }
  const root = get('#account'); root.dataset = { apiUrl: 'https://api.example.invalid', posUrl: 'https://pos.example.invalid' };
  let loginCount = 0, key = 0;
  const model = { subscriptionId: '11111111-1111-4111-8111-111111111111', status: 'active', plan: { code: options.planCode || 'professional-fe', name: 'Suscripción confirmada FE' },
    price: { amountMinor: 123451, currency: 'COP', billingInterval: options.period || 'monthly' },
    currentPeriodStart: '2020-01-01T00:00:00Z', currentPeriodEnd: '2099-01-01T00:00:00Z', cancelAtPeriodEnd: false,
    ...(options.pendingChange !== undefined ? { pendingChange: options.pendingChange } : {}) };
  let tenant;
  const sandbox = { URL, URLSearchParams, Intl, Error, Date, console,
    document: { querySelector: get, createElement: element },
    window: { location: { origin: 'https://web.example.invalid', search: '?targetPlanCode=basic', assign: url => navigations.push(url) } },
    sessionStorage: { setItem() { assert.fail('Upgrade must not persist hidden checkout data'); }, getItem() { return null; } },
    crypto: { randomUUID: () => `synthetic-${++key}` },
    Option: class { constructor(text, value) { this.text = text; this.value = value; } },
    FormData: class { get(name) { return name === 'email' ? 'qa@example.invalid' : name === 'password' ? 'synthetic' : null; } },
    async fetch(url, init = {}) {
      const call = { url, method: init.method || 'GET', ...plain(init) }; calls.push(call);
      const route = new URL(url).pathname;
      if (route === '/v1/auth/login') { loginCount++; tenant = { tenantId: `tenant-${loginCount}`, tenantKey: `qa-${loginCount}`, name: `Empresa ${loginCount}`, role: options.role || 'owner', status: 'active' };
        return reply({ accessToken: `synthetic-${loginCount}`, principal: { displayName: 'QA' }, tenant }); }
      if (route === '/v1/me/subscription') return options.readSubscription ? options.readSubscription(call, model, loginCount) : reply(structuredClone(model));
      if (route === '/v1/me/tenants') return reply({ activeTenantId: tenant.tenantId, tenants: [tenant] });
      if (route === '/v1/public/plans') return options.catalog ? options.catalog(call, loginCount) : reply(published());
      if (route === '/v1/me/billing/payment-sources') return reply({ paymentSource: null });
      if (route === '/v1/public/payment-source-config') return reply({ error: { message: 'Proveedor simulado no configurado' } }, 503);
      if (route === '/v1/auth/pos-sso') return options.sso ? options.sso(call) : reply({ redirectUrl: 'https://pos.example.invalid/auth/sso?ticket=synthetic' });
      if (route === '/v1/me/subscription/cancel') { model.cancelAtPeriodEnd = true; return reply(structuredClone(model)); }
      if (route === '/v1/me/subscription/reactivate') { model.cancelAtPeriodEnd = false; return reply(structuredClone(model)); }
      if (route === '/v1/me/subscription/change') return options.change ? options.change(call) : reply({ subscriptionChangeId: '33333333-3333-4333-8333-333333333333', changeType: 'downgrade', status: 'scheduled',
        toPlan: { code: 'enterprise-fe', name: 'Plan publicado' }, quote: { amountMinor: 0, currency: 'COP', expiresAt: null }, effectiveAt: model.currentPeriodEnd, nextAction: 'wait_for_period_end' });
      if (route === '/v1/me/billing/checkout-sessions') return options.checkout ? options.checkout(call) : assert.fail('Unexpected checkout');
      assert.fail(`unexpected request ${route}`);
    },
  };
  sandbox.location = sandbox.window.location;
  const context = vm.createContext(sandbox);
  const run = (code, require = name => assert.fail(`Unexpected import ${name}`)) => {
    const exports = {}; vm.runInContext(`(function(exports,require){${code}\n})`, context)(exports, require); return exports;
  };
  const checkoutReturn = run(returnCode);
  const recovery = run(recoveryCode, name => name === './checkout-return' ? checkoutReturn : assert.fail(name));
  run(accountCode, name => {
    if (name === '../lib/account-plans') return run(plansCode);
    if (name === '../lib/subscription-upgrade') return run(upgradeCode);
    if (name === '../lib/subscription-recovery') return recovery;
    if (name === '../scripts/client-idempotency') return { createIdempotencyKey: () => `key-${++key}` };
    if (name === '../lib/wompi-client') return { prepareWompiSession() { assert.fail('No provider calls allowed'); } };
    assert.fail(name);
  });
  return { get, calls, navigations, model,
    async login() { await get('#login-form').dispatch('submit'); await flush(); },
    async click(action) { await get(`[data-action='${action}']`).dispatch('click'); await flush(); },
    async confirm() { await get('#confirm-plan-change').dispatch('click'); await flush(); },
  };
}
const changes = h => h.calls.filter(call => new URL(call.url).pathname === '/v1/me/subscription/change');

test('real account groups six published options, keeps current FE, and confirms only the reviewed published code', async () => {
  const h = browser(); await h.login();
  const select = h.get('#target-plan');
  assert.equal(select.value, 'professional-fe');
  assert.deepEqual(select.children.map(group => group.label), ['Sin facturación electrónica', 'Con facturación electrónica']);
  assert.equal(select.children.flatMap(group => group.children).length, 6);
  assert.equal(h.get("[data-field='plan']").textContent, 'Publicado professional-fe');
  select.value = 'enterprise-fe'; await select.dispatch('change');
  await h.click('change-plan');
  assert.equal(h.get("[data-field='target-plan-name']").textContent, 'Publicado enterprise-fe');
  await h.confirm();
  assert.deepEqual(JSON.parse(changes(h)[0].body), { targetPlanCode: 'enterprise-fe' });
  assert.ok(changes(h)[0].headers.authorization);
});

test('annual account displays only annual catalogue amounts and keeps FE after refresh', async () => {
  const h = browser({ period: 'annual' }); await h.login();
  const select = h.get('#target-plan');
  assert.ok(select.children.flatMap(group => group.children).every(option => option.text.endsWith('/ año')));
  await h.click('refresh-recovery');
  assert.equal(select.value, 'professional-fe');
  assert.equal(select.disabled, false);
});

for (const failure of ['http', 'shape']) test(`catalogue ${failure} disables only plan changes, allows POS/renewal, and retries`, async () => {
  let fail = true;
  const h = browser({ catalog: () => fail ? reply(failure === 'shape' ? { plans: [] } : {}, failure === 'http' ? 503 : 200) : reply(published()) });
  await h.login();
  assert.equal(h.get('#target-plan').disabled, true);
  assert.equal(h.get("[data-action='change-plan']").disabled, true);
  assert.equal(h.get("[data-action='retry-plans']").hidden, false);
  assert.equal(h.get("[data-action='open-pos']").getAttribute('aria-disabled'), null);
  assert.equal(h.get("[data-action='cancel']").disabled, false);
  await h.click('open-pos'); assert.equal(h.navigations.length, 1);
  await h.click('cancel'); await h.get('#confirm-cancel').dispatch('click'); await flush();
  assert.equal(h.model.cancelAtPeriodEnd, true);
  await h.click('reactivate');
  fail = false; await h.click('retry-plans');
  assert.equal(h.get('#target-plan').disabled, false);
  assert.equal(h.get('#target-plan').value, 'professional-fe');
});

test('late catalogue responses after logout or a new tenant login cannot restore old controls/names', async () => {
  const first = deferred();
  const h = browser({ catalog: (_call, login) => login === 1 ? first.promise : reply(published()) });
  await h.login(); await h.click('logout'); await h.login();
  assert.equal(h.get("[data-field='tenant-name']").textContent, 'Empresa 2');
  const old = published(); old.plans.forEach(plan => { plan.name = 'RESPUESTA ANTIGUA'; });
  first.resolve(reply(old)); await flush();
  assert.equal(h.get("[data-field='plan']").textContent, 'Publicado professional-fe');
  assert.equal(h.get('#target-plan').value, 'professional-fe');
  assert.equal(changes(h).length, 0);
});

test('an unpublished DOM target or a changed review cannot authorize a plan change', async () => {
  const h = browser(); await h.login();
  const select = h.get('#target-plan');
  select.value = 'forged'; await h.click('change-plan'); await h.confirm();
  assert.equal(changes(h).length, 0);
  select.value = 'enterprise-fe'; await select.dispatch('change'); await h.click('change-plan');
  select.value = 'basic'; await h.confirm();
  assert.equal(changes(h).length, 0);
});

test('member cannot acquire plan-management controls or send a change through programmatic clicks', async () => {
  const h = browser({ role: 'member' }); await h.login();
  assert.equal(h.get("[data-section='plan-management']").hidden, true);
  h.get('#target-plan').value = 'enterprise-fe'; await h.click('change-plan'); await h.confirm();
  assert.equal(changes(h).length, 0);
  assert.equal(h.calls.some(call => new URL(call.url).pathname === '/v1/public/plans'), false);
});

const pendingFixture = (nextAction = 'checkout') => ({
  subscriptionChangeId: '33333333-3333-4333-8333-333333333333', changeType: 'upgrade', status: 'pending_payment',
  toPlan: { code: 'basic-fe', name: 'Básico FE publicado' },
  quote: { amountMinor: 1230017, currency: 'COP', expiresAt: '2099-01-01T00:00:00.000Z' },
  effectiveAt: '2026-11-13T00:00:00.000Z',
  orderId: '44444444-4444-4444-8444-444444444444', checkoutSessionId: '55555555-5555-4555-8555-555555555555',
  orderStatus: 'pending_payment', nextAction,
});
const upgradeCheckout = (change = pendingFixture()) => ({ orderId: change.orderId, checkoutSessionId: change.checkoutSessionId,
  amountInCents: change.quote.amountMinor, currency: 'COP', expirationTime: '2099-01-01T00:00:00.000Z',
  checkoutUrl: `https://checkout.wompi.co/p/?reference=QA-SAME-ORDER&redirect-url=${encodeURIComponent(`https://web.example.invalid/pago/resultado?checkoutSessionId=${change.checkoutSessionId}`)}` });
const checkoutCalls = h => h.calls.filter(call => new URL(call.url).pathname === '/v1/me/billing/checkout-sessions');

test('fresh login discovers pending upgrade, keeps Basic, and explicitly resumes the same server checkout without another change', async () => {
  const expected = upgradeCheckout();
  const h = browser({ planCode: 'basic', pendingChange: pendingFixture(), checkout: () => reply(expected) });
  await h.login();
  assert.equal(h.get("[data-field='plan']").textContent, 'Publicado basic');
  assert.equal(h.get('#target-plan').value, 'basic'); assert.equal(h.get('#target-plan').disabled, true);
  assert.match(h.get("[data-field='pending-plan-summary']").textContent, /Básico FE.*misma orden vigente/);
  assert.equal(checkoutCalls(h).length, 0);
  await h.click('change-plan');
  assert.equal(checkoutCalls(h).length, 1); assert.equal(changes(h).length, 0);
  assert.deepEqual(JSON.parse(checkoutCalls(h)[0].body), { subscriptionChangeId: pendingFixture().subscriptionChangeId });
  assert.equal(h.navigations[0], expected.checkoutUrl);
  assert.equal(h.get("[data-field='plan']").textContent, 'Publicado basic');
});

for (const nextAction of ['wait_for_payment', 'wait_for_activation', 'wait_for_period_end', 'review']) test(`pending ${nextAction} never offers or submits another payment`, async () => {
  const change = pendingFixture(nextAction);
  if (nextAction === 'wait_for_period_end') { change.changeType = 'downgrade'; change.status = 'scheduled'; }
  const h = browser({ planCode: 'basic', pendingChange: change }); await h.login();
  assert.equal(h.get("[data-action='change-plan']").disabled, true);
  assert.equal(h.get("[data-section='pending-plan-change']").hidden, false);
  await h.click('change-plan'); await h.confirm();
  assert.equal(checkoutCalls(h).length, 0); assert.equal(changes(h).length, 0);
  assert.equal(h.get("[data-action='open-pos']").getAttribute('aria-disabled'), null);
});

test('expired quote requires explicit review and server requote, then uses the returned change for checkout', async () => {
  const expired = pendingFixture('requote'); expired.quote.expiresAt = '2020-01-01T00:00:00.000Z'; expired.orderStatus = 'expired';
  const fresh = { ...pendingFixture(), subscriptionChangeId: '66666666-6666-4666-8666-666666666666', orderId: null, checkoutSessionId: null, orderStatus: null };
  const h = browser({ planCode: 'basic', pendingChange: expired, change: () => reply(fresh), checkout: () => reply(upgradeCheckout()) });
  await h.login(); assert.equal(changes(h).length, 0); assert.equal(checkoutCalls(h).length, 0);
  h.get('#target-plan').value = 'enterprise';
  await h.click('change-plan'); assert.equal(changes(h).length, 0);
  assert.match(h.get("[data-field='plan-change-copy']").textContent, /cotización anterior venció/);
  await h.confirm();
  assert.equal(changes(h).length, 1); assert.deepEqual(JSON.parse(changes(h)[0].body), { targetPlanCode: 'basic-fe' });
  assert.ok(changes(h)[0].headers['idempotency-key']);
  assert.deepEqual(JSON.parse(checkoutCalls(h)[0].body), { subscriptionChangeId: fresh.subscriptionChangeId });
  assert.equal(h.navigations[0], upgradeCheckout().checkoutUrl);
  assert.equal(h.get("[data-field='plan']").textContent, 'Publicado basic');
});

test('resume synchronous guard blocks double click and fast confirmation; transport failure allows retry with same key', async () => {
  const first = deferred(); let calls = 0;
  const h = browser({ planCode: 'basic', pendingChange: pendingFixture(), checkout: () => ++calls === 1 ? first.promise : reply(upgradeCheckout()) });
  await h.login();
  const opening = h.click('change-plan'); await flush();
  await h.click('change-plan'); await h.confirm(); await h.click('refresh-plan-change');
  assert.equal(checkoutCalls(h).length, 1);
  first.reject(new Error('Synthetic transport failure')); await opening;
  assert.equal(h.navigations.length, 0); assert.equal(h.get("[data-action='change-plan']").disabled, false);
  await h.click('change-plan');
  assert.equal(checkoutCalls(h).length, 2);
  assert.equal(checkoutCalls(h)[0].headers['idempotency-key'], checkoutCalls(h)[1].headers['idempotency-key']);
  assert.equal(h.navigations.length, 1);
  await h.click('change-plan');
  assert.equal(checkoutCalls(h).length, 2, 'navigation locks the current view against another checkout POST');
});

test('late checkout after logout/new login cannot navigate or replace the new tenant', async () => {
  const first = deferred();
  const h = browser({ pendingChange: pendingFixture(), checkout: () => first.promise });
  await h.login(); const opening = h.click('change-plan'); await flush();
  await h.click('logout'); delete h.model.pendingChange; await h.login();
  first.resolve(reply(upgradeCheckout())); await opening;
  assert.equal(h.navigations.length, 0);
  assert.equal(h.get("[data-field='tenant-name']").textContent, 'Empresa 2');
  assert.equal(h.get("[data-section='pending-plan-change']").hidden, true);
});

test('refresh confirms applied plan and clears pending UI only from the new server subscription', async () => {
  const h = browser({ planCode: 'basic', pendingChange: pendingFixture('wait_for_activation') }); await h.login();
  assert.equal(h.get('#target-plan').value, 'basic');
  h.model.pendingChange = null; h.model.plan = { code: 'basic-fe', name: 'Básico FE servidor' };
  await h.click('refresh-plan-change');
  assert.equal(h.get('#target-plan').value, 'basic-fe');
  assert.equal(h.get("[data-section='pending-plan-change']").hidden, true);
  assert.equal(h.get("[data-field='plan']").textContent, 'Publicado basic-fe');
  assert.equal(checkoutCalls(h).length, 0); assert.equal(changes(h).length, 0);
});

test('malformed pending metadata blocks only plan writes and preserves SSO/renewal', async () => {
  for (const extra of [{ nextAction: 'forged' }, { orderId: null }, { quote: { amountMinor: -1, currency: 'COP', expiresAt: null } }]) {
    const h = browser({ planCode: 'basic', pendingChange: { ...pendingFixture(), ...extra } }); await h.login();
    assert.equal(h.get("[data-action='change-plan']").disabled, true);
    assert.equal(h.get("[data-action='cancel']").disabled, false);
    assert.equal(h.get("[data-action='open-pos']").getAttribute('aria-disabled'), null);
    await h.click('change-plan'); await h.confirm(); assert.equal(changes(h).length, 0); assert.equal(checkoutCalls(h).length, 0);
  }
});

test('member cannot consume hidden pending metadata or execute its checkout/requote', async () => {
  const h = browser({ role: 'member', pendingChange: pendingFixture() }); await h.login();
  assert.equal(h.get("[data-section='pending-plan-change']").hidden, true);
  await h.click('change-plan'); await h.confirm();
  assert.equal(changes(h).length, 0); assert.equal(checkoutCalls(h).length, 0);
});

test('checkout validation preserves signed URL and rejects foreign URLs, expired receipts or a different order', () => {
  const change = readPendingPlanChange(pendingFixture()), valid = upgradeCheckout();
  assert.equal(readUpgradeCheckout(valid, change, 'https://web.example.invalid').checkoutUrl, valid.checkoutUrl);
  for (const extra of [{ orderId: '77777777-7777-4777-8777-777777777777' },
    { checkoutSessionId: '77777777-7777-4777-8777-777777777777' }, { expirationTime: '2020-01-01T00:00:00.000Z' },
    { amountInCents: 1 }, { currency: 'USD' }, { checkoutUrl: 'https://foreign.example.invalid/p/' },
    { checkoutUrl: valid.checkoutUrl.replace('web.example.invalid', 'other.example.invalid') }]) {
    assert.throws(() => readUpgradeCheckout({ ...valid, ...extra }, change, 'https://web.example.invalid'));
  }
});

test('requote response requesting payment wait cannot trigger checkout automatically', async () => {
  const h = browser({ pendingChange: pendingFixture('requote'), change: () => reply(pendingFixture('wait_for_payment')) });
  await h.login(); await h.click('change-plan'); await h.confirm();
  assert.equal(changes(h).length, 1); assert.equal(checkoutCalls(h).length, 0);
  assert.match(h.get("[data-field='pending-plan-summary']").textContent, /pago pendiente de confirmación/);
  assert.equal(h.get("[data-action='change-plan']").disabled, true);
});

test('requote returning another plan never opens a checkout for the unreviewed target', async () => {
  const other = pendingFixture(); other.toPlan = { code: 'enterprise', name: 'Otro plan' };
  const h = browser({ pendingChange: pendingFixture('requote'), change: () => reply(other) });
  await h.login(); await h.click('change-plan'); await h.confirm();
  assert.equal(checkoutCalls(h).length, 0); assert.equal(h.navigations.length, 0);
  assert.match(h.get('.account-status').textContent, /otro plan/);
});

test('requote double confirmation is single flight and a failed request retries the same idempotency key', async () => {
  const first = deferred(); let count = 0;
  const h = browser({ pendingChange: pendingFixture('requote'), change: () => ++count === 1 ? first.promise : reply(pendingFixture('review')) });
  await h.login(); await h.click('change-plan'); const confirming = h.confirm(); await flush();
  await h.confirm(); await h.click('change-plan');
  assert.equal(changes(h).length, 1);
  first.resolve(reply({ error: { message: 'Temporary requote failure' } }, 503)); await confirming;
  await h.click('change-plan'); await h.confirm();
  assert.equal(changes(h).length, 2);
  assert.equal(changes(h)[0].headers['idempotency-key'], changes(h)[1].headers['idempotency-key']);
  assert.equal(checkoutCalls(h).length, 0);
});

test('requested and quoted private changes are review-only and cannot enable checkout or requote', async () => {
  for (const status of ['requested', 'quoted']) {
    const pending = { ...pendingFixture('review'), status };
    assert.equal(readPendingPlanChange(pending).status, status);
    for (const nextAction of ['checkout', 'requote', 'wait_for_payment', 'wait_for_activation']) {
      assert.throws(() => readPendingPlanChange({ ...pending, nextAction }));
    }
    const h = browser({ pendingChange: pending }); await h.login();
    assert.equal(h.get("[data-action='change-plan']").disabled, true);
    await h.click('change-plan'); await h.confirm();
    assert.equal(checkoutCalls(h).length, 0); assert.equal(changes(h).length, 0);
  }
});

test('server prorated quote 1989780 keeps 19.897,80 COP in payment status and pending caption', async () => {
  const first = deferred(), change = pendingFixture(); change.quote.amountMinor = 1989780;
  const h = browser({ planCode: 'basic', change: () => reply(change), checkout: () => first.promise });
  await h.login(); h.get('#target-plan').value = 'basic-fe'; await h.click('change-plan');
  const confirming = h.confirm(); await flush();
  assert.match(h.get('.account-status').textContent, /Prorrateo confirmado: 19\.897,80 COP/);
  first.resolve(reply({ error: { message: 'Synthetic payment opening failure' } }, 503)); await confirming;
  assert.match(h.get("[data-field='pending-plan-summary']").textContent, /Importe cotizado: 19\.897,80 COP/);
  assert.equal(JSON.parse(checkoutCalls(h)[0].body).amountMinor, undefined, 'the UI sends no calculated amount');
});


test('commercial onboarding follows the current published FE flag and refreshes after an applied plan change', async () => {
  const h = browser({ planCode: 'basic' }); await h.login();
  assert.equal(h.get("[data-section='fiscal-onboarding']").hidden, false);
  assert.match(h.get("[data-field='fiscal-plan-guidance']").textContent, /no incluye/);
  assert.equal(h.get("[data-field='fiscal-setup-steps']").hidden, true);
  assert.equal(h.get("[data-action='configure-fiscal']").hidden, true);
  h.model.plan.code = 'basic-fe';
  await h.click('refresh-recovery');
  assert.match(h.get("[data-field='fiscal-plan-guidance']").textContent, /incluye electrónica/);
  assert.equal(h.get("[data-field='fiscal-setup-steps']").hidden, false);
  assert.equal(h.get("[data-action='configure-fiscal']").disabled, false);
});

test('fiscal setup reuses authenticated SSO with a named destination while ordinary entry stays unchanged', async () => {
  const h = browser(); await h.login(); await h.click('configure-fiscal');
  const target = new URL(h.navigations[0]);
  assert.equal(target.origin, 'https://pos.example.invalid');
  assert.equal(target.pathname, '/auth/sso');
  assert.equal(target.searchParams.get('destination'), 'fiscal-setup');
  assert.equal(h.calls.filter(c => new URL(c.url).pathname === '/v1/auth/pos-sso').length, 1);
  const ordinary = browser(); await ordinary.login(); await ordinary.click('open-pos');
  assert.equal(new URL(ordinary.navigations[0]).searchParams.has('destination'), false);
});

for (const role of ['billing', 'member']) test(`fiscal setup does not offer administration to ${role}`, async () => {
  const h = browser({ role }); await h.login();
  assert.equal(h.get("[data-action='configure-fiscal']").hidden, true);
  await h.click('configure-fiscal');
  assert.equal(h.navigations.length, 0);
  assert.equal(h.calls.filter(c => new URL(c.url).pathname === '/v1/auth/pos-sso').length, 0);
});

test('late SSO configuration response cannot navigate after logout, and onboarding is cleared', async () => {
  const pending = deferred();
  const h = browser({ sso: () => pending.promise }); await h.login();
  const opening = h.click('configure-fiscal'); await flush();
  await h.click('logout');
  pending.resolve(reply({ redirectUrl: 'https://pos.example.invalid/auth/sso?ticket=synthetic' })); await opening;
  assert.equal(h.navigations.length, 0);
  assert.equal(h.get("[data-section='fiscal-onboarding']").hidden, true);
  assert.equal(h.get("[data-field='fiscal-plan-guidance']").textContent, '');
});
