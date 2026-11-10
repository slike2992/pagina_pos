import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const page = await readFile(new URL('../src/pages/pago/resultado.astro', import.meta.url), 'utf8');
const script = page.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const code = ts.transpileModule(script.replaceAll('import.meta.env.DEV', 'false'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const returnExports = {}, recoveryExports = {};
const compile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
vm.runInNewContext(compile(await readFile(new URL('../src/lib/checkout-return.ts', import.meta.url), 'utf8')), { exports: returnExports, URL });
vm.runInNewContext(compile(await readFile(new URL('../src/lib/subscription-recovery.ts', import.meta.url), 'utf8')), {
  exports: recoveryExports, URL, Intl, require: name => name === './checkout-return' ? returnExports : assert.fail(`unexpected helper import: ${name}`),
});

const flush = () => new Promise(resolve => setImmediate(resolve));

async function run(responses, { query = '?checkoutSessionId=00000000-0000-4000-8000-000000000001&id=wompi-test', blockedStorage = false, development = false, knownRecovery = false, storageGetterBlocked = false } = {}) {
  const calls = [];
  const queue = Array.isArray(responses) ? [...responses] : [responses];
  const timers = new Map();
  const events = new Map();
  let clock = 0;
  let timerId = 0;
  const elements = new Map();
  for (const selector of ['#result-heading', '.status', '[data-detail]', 'dl',
    "[data-field='reference']", "[data-field='amount']", '#retry-payment', '#password-link']) {
    const listeners = new Map();
    elements.set(selector, { textContent: '', hidden: true, disabled: false, dataset: {},
      addEventListener: (event, listener) => listeners.set(event, listener), listeners });
  }
  const root = { dataset: { apiUrl: 'https://api.staging.example.invalid' }, querySelector: selector => elements.get(selector) };
  const sandbox = {
    exports: {}, require: name => name === '../../lib/subscription-recovery' ? recoveryExports : assert.fail(`unexpected controller import: ${name}`),
    document: { querySelector: () => root },
    location: { search: query }, URLSearchParams, Intl,
    sessionStorage: { getItem: key => { if (blockedStorage) throw new Error('storage unavailable'); return key.startsWith('cripton:recovery:') && knownRecovery ? 'true' : null; } },
    window: {
      addEventListener: (event, listener) => events.set(event, listener),
      setTimeout: (callback, delay) => { const id = ++timerId; timers.set(id, { callback, due: clock + delay }); return id; },
      clearTimeout: id => timers.delete(id),
    },
    fetch: async url => {
      calls.push(url);
      assert.ok(queue.length, 'unexpected extra request');
      const response = queue.length > 1 ? queue.shift() : queue[0];
      if (response instanceof Error) throw response;
      if (typeof response === 'function') return response();
      const httpStatus = typeof response === 'string' ? 200 : response.httpStatus;
      return { ok: httpStatus >= 200 && httpStatus < 300, status: httpStatus, json: async () => {
        if (response.invalidJson) throw new SyntaxError('not JSON');
        return typeof response === 'string'
          ? { status: response, reference: 'QA-RESULT', currency: 'COP', amountInCents: 7990000 }
          : response.body ?? { error: { message: 'No disponible' } };
      } };
    },
  };
  if (storageGetterBlocked) Object.defineProperty(sandbox, 'sessionStorage', { get() { throw new Error('Synthetic storage denied'); } });
  vm.runInNewContext(development ? compile(script.replaceAll('import.meta.env.DEV', 'true')) : code, sandbox);
  await flush();
  return { calls, elements, timers,
    async advance(milliseconds) {
      const target = clock + milliseconds;
      while (true) {
        const next = [...timers].sort((a, b) => a[1].due - b[1].due)[0];
        if (!next || next[1].due > target) break;
        const [id, { callback, due }] = next;
        clock = due;
        timers.delete(id);
        callback();
        await flush();
      }
      clock = target;
    },
    async clickRetry() {
      const button = elements.get('#retry-payment');
      assert.equal(button.hidden, false);
      assert.equal(button.disabled, false);
      button.listeners.get('click')();
      await flush();
    },
    pagehide() { events.get('pagehide')(); },
  };
}

test('fulfilled staging checkout uses email guidance and account link without a development endpoint', async () => {
  const { calls, elements } = await run('fulfilled', { blockedStorage: true });
  assert.equal(calls.length, 1);
  assert.match(calls[0], /\/v1\/checkout-sessions\/00000000-/);
  assert.ok(calls.every(url => !url.includes('/development/')));
  assert.equal(elements.get('#result-heading').textContent, 'Tu empresa está lista');
  assert.match(elements.get('[data-detail]').textContent, /correo/);
  assert.equal(elements.get('#password-link').href, '/cuenta');
  assert.equal(elements.get('#password-link').hidden, false);
});

test('unfulfilled payments cannot expose account activation or password setup', async () => {
  for (const status of ['pending', 'approved', 'declined', 'expired', 'cancelled', 'refunded']) {
    const { calls, elements, timers } = await run(status);
    assert.equal(calls.length, 1);
    assert.equal(elements.get('#password-link').hidden, true);
    assert.notEqual(elements.get('#result-heading').textContent, 'Tu empresa está lista');
    assert.equal(timers.size, ['pending', 'approved'].includes(status) ? 1 : 0);
    assert.equal(elements.get('#retry-payment').hidden, status !== 'declined');
  }
});

test('missing checkout context does not query the provider transaction id as an application checkout', async () => {
  const { calls, elements } = await run('fulfilled', { query: '?id=wompi-test' });
  assert.equal(calls.length, 0);
  assert.equal(elements.get('#result-heading').textContent, 'No encontramos la orden');
});

for (const [label, response] of [
  ['rejected network request', new TypeError('Failed to fetch')],
  ['HTTP 503 with a non-JSON body', { httpStatus: 503, invalidJson: true }],
  ['HTTP 429', { httpStatus: 429 }],
]) {
  test(`${label} retries the same checkout after three seconds and stops at fulfilled`, async () => {
    const result = await run([response, 'fulfilled']);
    assert.equal(result.calls.length, 1);
    assert.equal(result.elements.get('#password-link').hidden, true);
    assert.equal(result.elements.get('#retry-payment').hidden, true);
    assert.equal(result.elements.get('#result-heading').textContent, 'Estamos consultando tu pago');
    assert.equal(result.elements.get('.status').textContent, 'La conexión no está disponible temporalmente. Reintentando…');
    assert.equal(result.elements.get('.status').dataset.state, '');
    assert.equal(result.timers.size, 1);
    await result.advance(2999);
    assert.equal(result.calls.length, 1);
    await result.advance(1);
    assert.equal(result.calls.length, 2);
    assert.equal(new Set(result.calls).size, 1);
    assert.equal(result.elements.get('#result-heading').textContent, 'Tu empresa está lista');
    assert.equal(result.elements.get('.status').dataset.state, 'success');
    assert.equal(result.elements.get('#password-link').hidden, false);
    assert.equal(result.elements.get('#password-link').href, '/cuenta');
    assert.equal(result.elements.get('#retry-payment').hidden, true);
    assert.equal(result.timers.size, 0);
    await result.advance(60000);
    assert.equal(result.calls.length, 2);
  });
}

test('definitive HTTP 4xx responses never retry automatically, including non-JSON 404', async () => {
  for (const response of [400, 401, 403, 404, 410, 422].map(httpStatus => ({ httpStatus }))
    .concat({ httpStatus: 404, invalidJson: true })) {
    const result = await run(response);
    assert.equal(result.calls.length, 1);
    assert.equal(result.timers.size, 0);
    assert.equal(result.elements.get('#password-link').hidden, true);
    assert.equal(result.elements.get('#password-link').href, undefined);
    assert.equal(result.elements.get('.status').dataset.state, 'error');
    assert.equal(result.elements.get('#result-heading').textContent, 'No pudimos consultar el pago');
    assert.equal(result.elements.get('#retry-payment').hidden, false);
    assert.equal(result.elements.get('#retry-payment').disabled, false);
    await result.advance(60000);
    assert.equal(result.calls.length, 1);
  }
});

test('failed requests exhaust ten total attempts and retain manual retry for the same checkout', async () => {
  const failures = Array.from({ length: 10 }, (_, index) => index % 2
    ? { httpStatus: 503, invalidJson: true } : new TypeError('Failed to fetch'));
  const result = await run([...failures, 'fulfilled']);
  await result.advance(27000);
  assert.equal(result.calls.length, 10);
  assert.equal(result.timers.size, 0);
  assert.equal(result.elements.get('#password-link').hidden, true);
  assert.equal(result.elements.get('#password-link').href, undefined);
  assert.equal(result.elements.get('.status').dataset.state, 'error');
  assert.equal(result.elements.get('#result-heading').textContent, 'No pudimos consultar el pago');
  assert.equal(result.elements.get('#retry-payment').hidden, false);
  assert.equal(result.elements.get('#retry-payment').disabled, false);
  assert.match(result.elements.get('[data-detail]').textContent, /consulta automática terminó/);
  await result.advance(60000);
  assert.equal(result.calls.length, 10);
  await result.clickRetry();
  assert.equal(result.calls.length, 11);
  assert.equal(new Set(result.calls).size, 1);
  assert.equal(result.elements.get('#password-link').hidden, false);
  assert.equal(result.timers.size, 0);
});

test('pending responses and network failures share one ten-attempt budget', async () => {
  const result = await run(['pending', new TypeError('Failed to fetch'), 'approved']);
  await result.advance(27000);
  assert.equal(result.calls.length, 10);
  assert.equal(result.timers.size, 0);
  assert.equal(result.elements.get('#password-link').hidden, true);
  assert.equal(result.elements.get('#retry-payment').hidden, false);
  assert.equal(result.elements.get('.status').dataset.state, 'success');
});

test('manual retry starts a new bounded cycle with one scheduled request at a time', async () => {
  const result = await run(new TypeError('Failed to fetch'));
  await result.advance(27000);
  await result.clickRetry();
  assert.equal(result.calls.length, 11);
  assert.equal(result.elements.get('#retry-payment').hidden, true);
  assert.equal(result.timers.size, 1);
  await result.advance(27000);
  assert.equal(result.calls.length, 20);
  assert.equal(result.timers.size, 0);
  await result.advance(60000);
  assert.equal(result.calls.length, 20);
});

test('pagehide cancels a scheduled retry and prevents further requests', async () => {
  const result = await run(new TypeError('Failed to fetch'));
  assert.equal(result.timers.size, 1);
  result.pagehide();
  assert.equal(result.timers.size, 0);
  await result.advance(60000);
  assert.equal(result.calls.length, 1);
});

test('an in-flight request cannot overlap or schedule retries after pagehide', async () => {
  let reject;
  const result = await run(() => new Promise((_resolve, rejectRequest) => { reject = rejectRequest; }));
  assert.equal(result.elements.get('#retry-payment').disabled, true);
  result.elements.get('#retry-payment').listeners.get('click')();
  assert.equal(result.calls.length, 1);
  result.pagehide();
  reject(new TypeError('Failed to fetch'));
  await flush();
  assert.equal(result.timers.size, 0);
  await result.advance(60000);
  assert.equal(result.calls.length, 1);
});

const historicalRecovery = {
  subscriptionId: '11111111-1111-4111-8111-111111111111',
  subscriptionPeriodId: '22222222-2222-4222-8222-222222222222',
  periodStart: '2020-01-01T00:00:00.000Z', periodEnd: '2020-02-01T00:00:00.000Z',
  needsFurtherRecovery: true, coveredThrough: '2020-02-01T00:00:00.000Z',
  subscriptionStatus: 'suspended', tenantStatus: 'suspended',
};
const recoveryResponse = (status, recovery = historicalRecovery) => ({ httpStatus: 200,
  body: { status, reference: 'QA-RECOVERY', amountInCents: 7990017, currency: 'COP', recovery } });

test('fulfilled historical recovery shows exact receipt and remaining debt without claiming active access', async () => {
  const h = await run(recoveryResponse('fulfilled'), { blockedStorage: true });
  assert.equal(h.calls.length, 1); assert.equal(h.timers.size, 0);
  assert.equal(h.elements.get('#result-heading').textContent, 'Período recuperado; quedan períodos pendientes');
  assert.equal(h.elements.get("[data-field='amount']").textContent, '79.900,17 COP');
  assert.match(h.elements.get('[data-detail]').textContent, /enero.*2020.*febrero.*2020.*UTC/);
  assert.match(h.elements.get('[data-detail]').textContent, /todavía está vencida/);
  assert.doesNotMatch(h.elements.get('[data-detail]').textContent, /empresa está lista|crear.*contraseña/);
  assert.equal(h.elements.get('#password-link').href, '/cuenta');
  assert.match(h.elements.get('#password-link').textContent, /siguiente período/);
  assert.equal(h.elements.get('#password-link').hidden, false);
  assert.ok(h.calls.every(call => !/development|pos-sso/.test(call)));
});

test('fulfilled recovery with future coverage only invites review in account and never creates a login', async () => {
  const h = await run(recoveryResponse('fulfilled', { ...historicalRecovery,
    needsFurtherRecovery: false, coveredThrough: '2035-01-01T00:00:00.000Z', subscriptionStatus: 'active', tenantStatus: 'active' }));
  assert.equal(h.elements.get('#result-heading').textContent, 'Período recuperado');
  assert.match(h.elements.get('[data-detail]').textContent, /Revisa tu suscripción y acceso en Mi cuenta/);
  assert.doesNotMatch(h.elements.get('[data-detail]').textContent, /empresa está lista|crear.*contraseña/);
  assert.equal(h.elements.get('#password-link').href, '/cuenta'); assert.equal(h.calls.length, 1);
});

test('an old paid period uses current server coveredThrough rather than assuming the account is still overdue', async () => {
  const h = await run(recoveryResponse('fulfilled', { ...historicalRecovery,
    needsFurtherRecovery: false, coveredThrough: '2035-01-01T00:00:00.000Z', subscriptionStatus: 'active', tenantStatus: 'active' }));
  assert.match(h.elements.get('.status').textContent, /2035/);
  assert.match(h.elements.get('[data-detail]').textContent, /2020/);
  assert.doesNotMatch(h.elements.get('#result-heading').textContent, /pendientes/);
});

test('past coverage remains overdue even if the flag was false when the result was generated', async () => {
  const h = await run(recoveryResponse('fulfilled', { ...historicalRecovery, needsFurtherRecovery: false }));
  assert.match(h.elements.get('#result-heading').textContent, /períodos pendientes/);
  assert.match(h.elements.get('[data-detail]').textContent, /no.*habilita acceso/);
});

test('pending and approved recovery wait for fulfilled under the existing bounded polling', async () => {
  const h = await run([recoveryResponse('pending'), recoveryResponse('approved'), recoveryResponse('fulfilled')],
    { query: '?checkoutSessionId=00000000-0000-4000-8000-000000000001&status=fulfilled&id=untrusted-provider-id' });
  assert.equal(h.elements.get('#password-link').hidden, true); assert.equal(h.timers.size, 1);
  await h.advance(3000); assert.equal(h.calls.length, 2);
  assert.equal(h.elements.get('#result-heading').textContent, 'Pago confirmado; aplicando el período');
  assert.equal(h.elements.get('#password-link').hidden, true);
  await h.advance(3000); assert.equal(h.calls.length, 3); assert.equal(h.timers.size, 0);
  assert.equal(h.elements.get('#password-link').hidden, false);
  assert.equal(new Set(h.calls).size, 1);
});

test('approved recovery never becomes ready when its ten-query polling budget expires', async () => {
  const h = await run(recoveryResponse('approved')); await h.advance(27000);
  assert.equal(h.calls.length, 10); assert.equal(h.timers.size, 0);
  assert.equal(h.elements.get('#password-link').hidden, true);
  assert.equal(h.elements.get('#retry-payment').hidden, false);
  assert.doesNotMatch(h.elements.get('#result-heading').textContent, /empresa.*lista/);
});

test('declined, expired, cancelled and refunded recovery do not claim a period or grant an account action', async () => {
  for (const state of ['declined', 'expired', 'cancelled', 'refunded']) {
    const h = await run(recoveryResponse(state));
    assert.equal(h.elements.get('#password-link').hidden, true); assert.equal(h.timers.size, 0);
    assert.match(h.elements.get('.status').textContent, /no confirma la recuperación/);
    assert.doesNotMatch(h.elements.get('.status').textContent, /empresa.*activada/);
  }
});

test('incomplete or malformed recovery metadata cannot fall back to generic company-ready messaging', async () => {
  for (const recovery of [null, {}, { ...historicalRecovery, coveredThrough: null },
    { ...historicalRecovery, tenantStatus: 'unknown' }, { ...historicalRecovery, periodEnd: 'bad-date' }]) {
    const h = await run(recoveryResponse('fulfilled', recovery));
    assert.equal(h.elements.get('#password-link').hidden, true);
    assert.doesNotMatch(h.elements.get('#result-heading').textContent, /empresa.*lista/);
    assert.equal(h.elements.get('.status').dataset.state, 'error');
  }
});

test('development recovery never calls the initial-password endpoint even at fulfilled', async () => {
  const h = await run(recoveryResponse('fulfilled'), { development: true, blockedStorage: true });
  assert.equal(h.calls.length, 1); assert.ok(h.calls.every(call => !call.includes('/development/')));
  assert.equal(h.elements.get('#password-link').href, '/cuenta');
  assert.match(h.elements.get('#password-link').textContent, /siguiente período/);
});

test('a known recovery missing public metadata cannot fall back to onboarding or treat storage as payment proof', async () => {
  const h = await run('fulfilled', { knownRecovery: true });
  assert.equal(h.elements.get('#password-link').hidden, true);
  assert.doesNotMatch(h.elements.get('#result-heading').textContent, /empresa.*lista/);
  assert.equal(h.elements.get('.status').dataset.state, 'error');
  assert.equal(h.calls.length, 1);
});

test('recovery metadata cannot disappear between pending and fulfilled and restore generic readiness', async () => {
  const h = await run([recoveryResponse('pending'), 'fulfilled']); await h.advance(3000);
  assert.equal(h.calls.length, 2); assert.equal(h.elements.get('#password-link').hidden, true);
  assert.doesNotMatch(h.elements.get('#result-heading').textContent, /empresa.*lista/);
});

test('a new tab without checkout context and blocked storage renders an error without querying anything', async () => {
  const h = await run('fulfilled', { blockedStorage: true, query: '?id=provider-only' });
  assert.equal(h.calls.length, 0); assert.equal(h.elements.get('#password-link').hidden, true);
  assert.equal(h.elements.get('#result-heading').textContent, 'No encontramos la orden');
});

test('denying the sessionStorage property itself cannot break a recovery identified in the URL', async () => {
  const h = await run(recoveryResponse('fulfilled'), { storageGetterBlocked: true });
  assert.equal(h.calls.length, 1); assert.match(h.elements.get('#result-heading').textContent, /Período recuperado/);
  assert.equal(h.elements.get('#password-link').href, '/cuenta');
});
