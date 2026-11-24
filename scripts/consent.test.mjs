import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import { commercialEvent, CONSENT_KEY, CONSENT_TTL, CONSENT_VERSION, consentRecord, storedConsent, analyticsVisitAllowed } from '../src/lib/analytics.ts';

const source = await readFile(new URL('../src/components/ConsentPanel.astro', import.meta.url), 'utf8');
const script = source.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/import\s+\{[^}]+\}\s+from\s+"[^"]+";/, '');
const compiled = ts.transpileModule(script, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;

// Runs the shipped client logic against a deterministic browser boundary. No
// external Google script is executed and no real property receives test events.
function browser({ privacySignal = false, saved = null, privatePage = false, storageFails = false, cookiesFail = false, origin = "https://cripton.com.co", query = "", measurementId = 'G-LOCALQA123' } = {}) {
  class Element {
    dataset = {}; hidden = false; disabled = false; listeners = {};
    addEventListener(name, callback) { this.listeners[name] = callback; }
    focus() { document.activeElement = this; }
    remove() { if (tracker === this) tracker = null; }
    click() { if (!this.disabled) this.listeners.click?.({ target: this }); }
  }
  let tracker = null;
  const consent = new Element(), privacy = new Element(), title = new Element(), grant = new Element(), deny = new Element(), settings = new Element(), main = new Element(), checkbox = new Element(), save = new Element(), available = new Element(), unavailable = new Element();
  consent.hidden = true;
  consent.dataset = { measurementId, canonical: 'https://cripton.com.co/' };
  grant.dataset.consent = 'granted'; deny.dataset.consent = 'denied';
  consent.querySelector = selector => ({ '[data-privacy-signal]': privacy, '[data-consent="granted"]': grant, '#analytics-title': title, '[data-analytics-choice]': checkbox, '[data-consent-save]': save }[selector]);
  consent.querySelectorAll = selector => ({ '[data-consent]': [deny, grant], '[data-analytics-available]': [available], '[data-analytics-unavailable]': [unavailable] }[selector] ?? []);
  const storage = new Map(saved ? [[CONSENT_KEY, saved]] : []);
  const cookiesRemoved = [];
  const document = {
    title: 'Cripton', activeElement: null, listeners: {},
    querySelector: selector => selector === '#analytics-preferences' ? (privatePage ? null : consent) : selector === "main" ? main : tracker,
    querySelectorAll: () => [settings],
    createElement: () => new Element(),
    addEventListener(name, callback) { this.listeners[name] = callback; },
    head: { append(script) { tracker = script; } },
    get cookie() { if (cookiesFail) throw new Error('cookies blocked'); return '_ga=fixture; unrelated=keep'; },
    set cookie(value) { cookiesRemoved.push(value); },
  };
  const window = { listeners: {}, addEventListener(name, callback) { this.listeners[name] = callback; } };
  const localStorage = {
    getItem(key) { if (storageFails) throw new Error('blocked'); return storage.get(key) ?? null; },
    setItem(key, value) { if (storageFails) throw new Error('blocked'); storage.set(key, value); },
  };
  const context = { window, document, localStorage, navigator: { globalPrivacyControl: privacySignal }, location: { hostname: 'cripton.com.co', origin, search: query }, Element, HTMLElement: Element, commercialEvent, CONSENT_KEY, CONSENT_TTL, consentRecord, storedConsent, analyticsVisitAllowed };
  vm.runInNewContext(compiled, context);
  return { window, document, consent, grant, deny, settings, storage, cookiesRemoved, main, checkbox, save, available, unavailable, tracker: () => tracker,
    commands: () => (window.dataLayer ?? []).map(value => Array.from(value)) };
}

test('no provider loads before consent and rejection remains functional', () => {
  const page = browser();
  assert.equal(page.tracker(), null);
  assert.equal(page.consent.hidden, false);
  page.deny.click();
  assert.equal(page.tracker(), null);
  assert.equal(page.consent.hidden, true);
  assert.equal(page.document.activeElement, page.main);
  assert.equal(JSON.parse(page.storage.get(CONSENT_KEY)).choice, 'denied');
  page.settings.click();
  assert.equal(page.consent.hidden, false);
});

test('grant loads exactly one provider with fixed canonical and no advertising permissions', () => {
  const page = browser();
  page.grant.click();
  assert.match(page.tracker().src, /^https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-LOCALQA123$/);
  const configuration = page.commands().find(command => command[0] === 'config')[2];
  assert.equal(configuration.send_page_view, false);
  assert.equal(configuration.page_location, 'https://cripton.com.co/');
  assert.equal(configuration.page_referrer, '');
  assert.equal(configuration.allow_google_signals, false);
  assert.equal(configuration.allow_ad_personalization_signals, false);
  page.grant.click();
  assert.equal(page.commands().filter(command => command[0] === 'event' && command[1] === 'page_view').length, 1);
});

test('withdrawal before the tag loads cancels queued events and allows a later choice', () => {
  const page = browser();
  page.grant.click();
  page.deny.click();
  assert.equal(page.tracker(), null);
  assert.equal(page.window['ga-disable-G-LOCALQA123'], true);
  assert.equal(page.commands().length, 0);
  assert.ok(page.cookiesRemoved.every(cookie => !cookie.startsWith('unrelated=')));
  page.grant.click();
  assert.ok(page.tracker());
  assert.equal(page.window['ga-disable-G-LOCALQA123'], false);
});

test('withdrawal after load disables future events and cross-tab rejection also applies', () => {
  const page = browser();
  page.grant.click();
  page.tracker().listeners.load();
  page.deny.click();
  assert.equal(page.window['ga-disable-G-LOCALQA123'], true);
  assert.ok(page.commands().some(command => command[0] === 'consent' && command[2].analytics_storage === 'denied'));
  page.grant.click();
  assert.equal(page.commands().filter(command => command[0] === 'event' && command[1] === 'page_view').length, 1);
  page.storage.set(CONSENT_KEY, JSON.stringify(consentRecord('denied', 'G-LOCALQA123')));
  page.window.listeners.storage({ key: CONSENT_KEY });
  assert.equal(page.window['ga-disable-G-LOCALQA123'], true);
});

test('private routes and browser privacy signals cannot initialize analytics', () => {
  const saved = JSON.stringify(consentRecord('granted', 'G-LOCALQA123'));
  const privatePage = browser({ privatePage: true, saved });
  assert.equal(privatePage.tracker(), null);
  assert.equal(privatePage.commands().length, 0);
  const signaled = browser({ privacySignal: true, saved });
  assert.equal(signaled.tracker(), null);
  assert.equal(signaled.grant.disabled, true);
  signaled.grant.click();
  assert.equal(signaled.tracker(), null);
});

test('blocked browser storage does not break the visitor choice', () => {
  const page = browser({ storageFails: true });
  assert.equal(page.consent.hidden, false);
  page.deny.click();
  assert.equal(page.consent.hidden, true);
  assert.equal(page.tracker(), null);
});

test('public HTML reused on a preview origin or sensitive query cannot start analytics', () => {
  for (const input of [{ origin: 'http://localhost:4324' }, { origin: 'https://preview.cripton.com.co' }, { query: '?email=private@example.invalid' }]) {
    const page = browser(input);
    assert.equal(page.tracker(), null);
    assert.equal(page.commands().length, 0);
    assert.equal(page.settings.hidden, false, 'transparency remains accessible even when analytics is prohibited');
    assert.equal(page.grant.hidden, true);
    assert.equal(page.checkbox.disabled, true);
  }
});

test('without a provider the notice is informative and cannot grant analytics', () => {
  const page = browser({ measurementId: '', origin: 'https://staging.cripton.com.co' });
  assert.equal(page.consent.hidden, false);
  assert.equal(page.grant.hidden, true);
  assert.equal(page.checkbox.disabled, true);
  assert.equal(page.unavailable.hidden, false);
  assert.equal(page.available.hidden, true);
  page.grant.click();
  assert.equal(page.tracker(), null);
  page.checkbox.checked = true; // Even a direct scripted invocation fails closed.
  page.save.click();
  assert.equal(page.consent.hidden, true);
  const receipt = JSON.parse(page.storage.get(CONSENT_KEY));
  assert.equal(receipt.scope, 'necessary-only');
  assert.equal(receipt.choice, 'denied');
  assert.equal(receipt.version, CONSENT_VERSION);
  assert.equal(receipt.expiresAt - receipt.decidedAt, CONSENT_TTL);
  page.settings.click();
  assert.equal(page.consent.hidden, false);
  assert.equal(page.checkbox.checked, false);
});

test('saved choices are scoped to the policy and provider, never inherited from old notices', () => {
  const saved = JSON.stringify(consentRecord('granted', 'G-LOCALQA123'));
  const revisit = browser({ saved });
  assert.ok(revisit.tracker());
  assert.equal(revisit.consent.hidden, true);
  for (const receipt of [consentRecord('granted', 'G-OTHERQA123'), consentRecord('denied'),
    { choice: 'granted', expiresAt: Date.now() + CONSENT_TTL },
    { ...consentRecord('granted', 'G-LOCALQA123'), version: 'old' },
    consentRecord('granted', 'G-LOCALQA123', Date.now() - CONSENT_TTL - 1)]) {
    const page = browser({ saved: JSON.stringify(receipt) });
    assert.equal(page.tracker(), null);
    assert.equal(page.consent.hidden, false);
  }
});

test('configuration saves only the category chosen and can withdraw an existing grant', () => {
  const page = browser();
  assert.ok(!page.checkbox.checked);
  page.checkbox.checked = true;
  page.save.click();
  assert.ok(page.tracker());
  page.settings.click();
  assert.equal(page.checkbox.checked, true);
  page.checkbox.checked = false;
  page.save.click();
  assert.equal(page.tracker(), null);
  assert.equal(JSON.parse(page.storage.get(CONSENT_KEY)).choice, 'denied');
});

test('clearing preferences in another tab stops tracking and requests a new decision', () => {
  const page = browser();
  page.grant.click();
  page.storage.clear();
  page.window.listeners.storage({ key: null });
  assert.equal(page.tracker(), null);
  assert.equal(page.window['ga-disable-G-LOCALQA123'], true);
  assert.equal(page.consent.hidden, false);
  assert.equal(page.checkbox.checked, false);
});

test('receipts reject future, malformed and excessively long consent', () => {
  const now = Date.now();
  const receipt = consentRecord('granted', 'G-LOCALQA123', now);
  assert.equal(storedConsent(JSON.stringify(receipt), now, 'G-LOCALQA123'), 'granted');
  for (const invalid of [{...receipt, decidedAt: now+1}, {...receipt, expiresAt: now+CONSENT_TTL+1}, {...receipt, choice:'yes'}, {...receipt, scope:'other'}]) {
    assert.equal(storedConsent(JSON.stringify(invalid), now, 'G-LOCALQA123'), null);
  }
});

test('a browser blocking both cookies and storage can still reject and reopen preferences', () => {
  const page = browser({ cookiesFail: true, storageFails: true });
  assert.equal(page.consent.hidden, false);
  page.deny.click();
  assert.equal(page.tracker(), null);
  assert.equal(page.consent.hidden, true);
  page.settings.click();
  assert.equal(page.consent.hidden, false);
});
