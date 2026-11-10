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

async function run(status, { query = '?checkoutSessionId=00000000-0000-4000-8000-000000000001&id=wompi-test', blockedStorage = false } = {}) {
  const calls = [];
  const elements = new Map();
  for (const selector of ['#result-heading', '.status', '[data-detail]', 'dl',
    "[data-field='reference']", "[data-field='amount']", '#retry-payment', '#password-link']) {
    elements.set(selector, { textContent: '', hidden: true, disabled: false, dataset: {}, addEventListener() {} });
  }
  const root = { dataset: { apiUrl: 'https://api.staging.example.invalid' }, querySelector: selector => elements.get(selector) };
  const sandbox = {
    document: { querySelector: () => root },
    location: { search: query }, URLSearchParams, Intl,
    sessionStorage: { getItem: () => { if (blockedStorage) throw new Error('storage unavailable'); return null; } },
    window: { addEventListener() {}, setTimeout() {} },
    fetch: async url => {
      calls.push(url);
      return { ok: true, json: async () => ({ status, reference: 'QA-RESULT', currency: 'COP', amountInCents: 7990000 }) };
    },
  };
  vm.runInNewContext(code, sandbox);
  await new Promise(resolve => setImmediate(resolve));
  return { calls, elements };
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

test('pending and declined payments cannot expose account activation or password setup', async () => {
  for (const status of ['pending', 'declined']) {
    const { calls, elements } = await run(status);
    assert.equal(calls.length, 1);
    assert.equal(elements.get('#password-link').hidden, true);
    assert.notEqual(elements.get('#result-heading').textContent, 'Tu empresa está lista');
  }
});

test('missing checkout context does not query the provider transaction id as an application checkout', async () => {
  const { calls, elements } = await run('fulfilled', { query: '?id=wompi-test' });
  assert.equal(calls.length, 0);
  assert.equal(elements.get('#result-heading').textContent, 'No encontramos la orden');
});
