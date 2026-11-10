import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const compile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const helperExports = {};
vm.runInNewContext(compile(await readFile(new URL('../src/lib/checkout-return.ts', import.meta.url), 'utf8')), {
  exports: helperExports, URL,
});
const { withCheckoutReturn } = helperExports;
const page = await readFile(new URL('../src/pages/registro/verificar.astro', import.meta.url), 'utf8');
const script = compile(page.match(/<script>([\s\S]*?)<\/script>/)[1].replaceAll('import.meta.env.DEV', 'false'));
const id = '00000000-0000-4000-8000-000000000001';
const origin = 'https://staging.example.invalid';
const checkout = new URL('https://checkout.wompi.co/p/');
for (const [key, value] of Object.entries({ reference: 'QA-RETURN', 'amount-in-cents': '7990000',
  currency: 'COP', 'signature:integrity': 'fixture', 'expiration-time': '2030-01-01T00:30:00Z',
  'redirect-url': origin + '/pago/resultado' })) checkout.searchParams.set(key, value);
const response = { checkoutSessionId: id, checkoutUrl: checkout.href,
  expiresAt: '2030-01-01T00:30:00Z', provider: 'wompi' };

async function run(responses, { initialStorage = [], blockedStorage = false } = {}) {
  const calls = [];
  const storage = new Map(initialStorage);
  const status = { textContent: '', dataset: {} };
  const actions = { hidden: true };
  const link = { href: '', textContent: '' };
  const renew = { hidden: true, addEventListener() {} };
  const root = { dataset: { apiUrl: 'https://api.staging.example.invalid' },
    querySelector: selector => ({ '.status': status, '.actions': actions,
      '#checkout-link': link, '#renew-local': renew })[selector] };
  vm.runInNewContext(script, {
    exports: {},
    document: { querySelector: () => root }, URL, URLSearchParams,
    location: { origin, search: '?signupIntentId=' + id + '&token=' + 'a'.repeat(64) },
    sessionStorage: {
      getItem: key => { if (blockedStorage) throw new Error('Storage denied'); return storage.get(key) ?? null; },
      setItem: (key, value) => { if (blockedStorage) throw new Error('Storage denied'); storage.set(key, value); }
    },
    require: name => name.includes('client-idempotency') ? { createIdempotencyKey: () => 'fixture-idempotency-key' }
      : name.includes('checkout-return') ? helperExports : assert.fail('Unexpected import'),
    fetch: async (url, options) => {
      calls.push({ url, options });
      const next = responses.shift();
      assert.ok(next, 'Unexpected HTTP call');
      return { ok: next.ok, status: next.status ?? (next.ok ? 200 : 400), json: async () => next.body };
    },
  });
  for (let i = 0; i < 5; i++) await new Promise(resolve => setImmediate(resolve));
  return { calls, status, actions, link };
}

test('a consumed email link resumes only the existing checkout without creating an order', async () => {
  const result = await run([
    { ok: false, body: { error: { code: 'invalid_or_expired_token' } } },
    { ok: true, body: response },
  ]);
  assert.equal(result.calls.length, 2);
  assert.match(result.calls[0].url, /\/verify-email$/);
  assert.match(result.calls[1].url, /\/resume-checkout$/);
  assert.ok(result.calls.every(call => !call.url.endsWith('/v1/checkout-sessions')));
  assert.equal(result.actions.hidden, false);
  const url = new URL(result.link.href);
  assert.equal(new URL(url.searchParams.get('redirect-url')).searchParams.get('checkoutSessionId'), id);
  for (const key of ['reference', 'amount-in-cents', 'currency', 'signature:integrity', 'expiration-time']) {
    assert.equal(url.searchParams.get(key), checkout.searchParams.get(key));
  }
});

test('invalid, expired or no-longer-pending email links cannot display a checkout', async () => {
  const result = await run([
    { ok: false, body: { error: { code: 'invalid_or_expired_token' } } },
    { ok: false, body: { error: { code: 'checkout_not_resumable', message: 'No es posible reanudar el checkout con este enlace.' } } },
  ]);
  assert.equal(result.actions.hidden, true);
  assert.equal(result.link.href, '');
  assert.equal(result.status.dataset.state, 'error');
  assert.equal(result.calls.length, 2);
});

test('a fresh verified signup creates one checkout and receives the same return protection', async () => {
  const result = await run([{ ok: true, body: { status: 'ready' } }, { ok: true, body: response }]);
  assert.equal(result.actions.hidden, false);
  assert.match(result.calls[1].url, /\/v1\/checkout-sessions$/);
  assert.equal(result.calls[1].options.headers['idempotency-key'], 'fixture-idempotency-key');
  assert.match(new URL(result.link.href).searchParams.get('redirect-url'), /checkoutSessionId=/);
});

test('cached verification cannot replay a fulfilled or expired checkout', async () => {
  for (const state of ['fulfilled', 'expired']) {
    const result = await run([
      { ok: false, body: { error: { code: 'invalid_or_expired_token' } } },
      { ok: false, body: { error: { code: 'checkout_not_resumable', message: state } } },
    ], { initialStorage: [[`verified-signup:${id}`, 'true'], [`checkout-key:${id}`, 'old-key']] });
    assert.equal(result.actions.hidden, true);
    assert.equal(result.link.href, '');
    assert.deepEqual(result.calls.map(call => call.url.split('/').at(-1)), ['verify-email', 'resume-checkout']);
  }
});

test('disabled session storage does not block fresh or resumed checkout', async () => {
  for (const verification of [{ ok: true, body: { status: 'ready' } },
    { ok: false, body: { error: { code: 'invalid_or_expired_token' } } }]) {
    const result = await run([verification, { ok: true, body: response }], { blockedStorage: true });
    assert.equal(result.actions.hidden, false);
    assert.match(new URL(result.link.href).searchParams.get('redirect-url'), /checkoutSessionId=/);
  }
});

test('return normalization rejects foreign destinations and mismatched or duplicated checkout ids', () => {
  for (const redirect of ['https://other.example.invalid/pago/resultado', origin + '/cuenta',
    origin + '/pago/resultado?checkoutSessionId=wrong',
    origin + '/pago/resultado?checkoutSessionId=' + id + '&checkoutSessionId=' + id]) {
    const altered = new URL(checkout);
    altered.searchParams.set('redirect-url', redirect);
    assert.throws(() => withCheckoutReturn(altered.href, id, origin));
  }
  const once = withCheckoutReturn(checkout.href, id, origin);
  assert.equal(withCheckoutReturn(once, id, origin), once);
});
