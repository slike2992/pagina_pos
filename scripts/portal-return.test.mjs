import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { beginPortalReturn, readPortalReturn, validatePortalLogin } from '../src/lib/portal-return.ts';
const memory = () => { const values = new Map(); return { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k), values }; };
const start = new URL('https://staging.cripton.com.co/cuenta?from=pos&destination=plans');
const now = Date.parse('2026-11-17T16:00:00Z');
test('POS handoff creates PKCE, binds state/action and never stores an access token', async () => {
  const storage = memory(); const redirect = new URL(await beginPortalReturn(start, 'https://pos-staging.cripton.com.co', storage, webcrypto, now));
  assert.equal(redirect.origin, 'https://pos-staging.cripton.com.co'); assert.equal(redirect.pathname, '/auth/portal');
  assert.equal(redirect.searchParams.get('destination'), 'plans');
  assert.match(redirect.searchParams.get('codeChallenge'), /^[A-Za-z0-9_-]{43}$/);
  const raw = [...storage.values.values()][0]; const saved = JSON.parse(raw);
  assert.notEqual(saved.verifier, redirect.searchParams.get('codeChallenge'));
  assert.equal(saved.state, redirect.searchParams.get('state')); assert.equal(raw.includes('accessToken'), false);
  const callback = new URL(`https://staging.cripton.com.co/cuenta#portal-ticket=${'a'.repeat(43)}&state=${saved.state}`);
  const parsed = readPortalReturn(callback, storage, now+1);
  assert.equal(parsed.destination, 'plans'); assert.equal(parsed.codeVerifier, saved.verifier);
  assert.throws(() => readPortalReturn(callback, storage, now+2));
});
test('handoff rejects callback injection, expired state, replay and insecure POS', async () => {
  for (const age of [-1, 120000, 999999]) {
    const storage = memory(); const redirect = new URL(await beginPortalReturn(start, 'https://pos-staging.cripton.com.co', storage, webcrypto, now));
    const callback = new URL(`https://staging.cripton.com.co/cuenta#portal-ticket=${'a'.repeat(43)}&state=${redirect.searchParams.get('state')}`);
    assert.throws(() => readPortalReturn(callback, storage, now+age));
  }
  for (const suffix of ['&state=bad', '&next=https://evil.invalid']) {
    const storage = memory(); const redirect = new URL(await beginPortalReturn(start, 'https://pos-staging.cripton.com.co', storage, webcrypto, now));
    assert.throws(() => readPortalReturn(new URL(`https://staging.cripton.com.co/cuenta#portal-ticket=${'a'.repeat(43)}&state=${redirect.searchParams.get('state')}${suffix}`), storage, now));
  }
  await assert.rejects(beginPortalReturn(start, 'http://pos-staging.cripton.com.co', memory(), webcrypto, now));
  await assert.rejects(beginPortalReturn(new URL(start+'&destination=account'), 'https://pos-staging.cripton.com.co', memory(), webcrypto, now));
  assert.equal(await beginPortalReturn(new URL('https://staging.cripton.com.co/cuenta'), 'https://pos-staging.cripton.com.co', memory(), webcrypto, now), null);
});
test('portal response cannot substitute destination, authority or expired credentials', () => {
  const login = {destination:'plans',tokenType:'Bearer',accessToken:'aaa.bbb.ccc',expiresAt:new Date(now+900000).toISOString(),principal:{principalId:'11111111-1111-4111-8111-111111111111',displayName:'QA'},tenant:{tenantId:'22222222-2222-4222-8222-222222222222',role:'owner',status:'active',name:'QA'}};
  assert.equal(validatePortalLogin(login, 'plans', now), login);
  for (const bad of [{...login,destination:'fiscal'}, {...login,expiresAt:new Date(now).toISOString()}, {...login,expiresAt:new Date(now+3600001).toISOString()}, {...login,tenant:{...login.tenant,role:'platform_owner'}}, {...login,accessToken:'secret-in-url'}]) assert.throws(()=>validatePortalLogin(bad,'plans',now));
});
