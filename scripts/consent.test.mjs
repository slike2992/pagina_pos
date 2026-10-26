import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import { commercialEvent, CONSENT_KEY, CONSENT_TTL, storedConsent, analyticsVisitAllowed } from '../src/lib/analytics.ts';

const source = await readFile(new URL('../src/components/ConsentPanel.astro', import.meta.url), 'utf8');
const script = source.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/import\s+\{[^}]+\}\s+from\s+"[^"]+";/, '');
const compiled = ts.transpileModule(script, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;

// Runs the shipped client logic against a deterministic browser boundary. No
// external Google script is executed and no real property receives test events.
function browser({ privacySignal = false, saved = null, privatePage = false, storageFails = false, origin = "https://cripton.com.co", query = "" } = {}) {
  class Element {
    dataset = {}; hidden = false; disabled = false; listeners = {};
    addEventListener(name, callback) { this.listeners[name] = callback; }
    focus() { document.activeElement = this; }
    remove() { if (tracker === this) tracker = null; }
    click() { if (!this.disabled) this.listeners.click?.({ target: this }); }
  }
  let tracker = null;
  const consent = new Element(), privacy = new Element(), title = new Element(), grant = new Element(), deny = new Element(), settings = new Element(), main = new Element();
  consent.hidden = true;
  consent.dataset = { measurementId: 'G-LOCALQA123', canonical: 'https://cripton.com.co/' };
  grant.dataset.consent = 'granted'; deny.dataset.consent = 'denied';
  consent.querySelector = selector => ({ '[data-privacy-signal]': privacy, '[data-consent="granted"]': grant, '#analytics-title': title }[selector]);
  consent.querySelectorAll = () => [deny, grant];
  const storage = new Map(saved ? [[CONSENT_KEY, saved]] : []);
  const cookiesRemoved = [];
  const document = {
    title: 'Cripton', activeElement: null, listeners: {},
    querySelector: selector => selector === '#analytics-preferences' ? (privatePage ? null : consent) : selector === "main" ? main : tracker,
    querySelectorAll: () => [settings],
    createElement: () => new Element(),
    addEventListener(name, callback) { this.listeners[name] = callback; },
    head: { append(script) { tracker = script; } },
    get cookie() { return '_ga=fixture; unrelated=keep'; },
    set cookie(value) { cookiesRemoved.push(value); },
  };
  const window = { listeners: {}, addEventListener(name, callback) { this.listeners[name] = callback; } };
  const localStorage = {
    getItem(key) { if (storageFails) throw new Error('blocked'); return storage.get(key) ?? null; },
    setItem(key, value) { if (storageFails) throw new Error('blocked'); storage.set(key, value); },
  };
  const context = { window, document, localStorage, navigator: { globalPrivacyControl: privacySignal }, location: { hostname: 'cripton.com.co', origin, search: query }, Element, HTMLElement: Element, commercialEvent, CONSENT_KEY, CONSENT_TTL, storedConsent, analyticsVisitAllowed };
  vm.runInNewContext(compiled, context);
  return { window, document, consent, grant, deny, settings, storage, cookiesRemoved, main, tracker: () => tracker,
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
  page.storage.set(CONSENT_KEY, JSON.stringify({ choice: 'denied', expiresAt: Date.now() + CONSENT_TTL }));
  page.window.listeners.storage({ key: CONSENT_KEY });
  assert.equal(page.window['ga-disable-G-LOCALQA123'], true);
});

test('private routes and browser privacy signals cannot initialize analytics', () => {
  const saved = JSON.stringify({ choice: 'granted', expiresAt: Date.now() + CONSENT_TTL });
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
    assert.equal(page.settings.hidden, true);
  }
});