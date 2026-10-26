import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const helperSource = await readFile(new URL('../src/lib/form-feedback.ts', import.meta.url), 'utf8');
const registration = await readFile(new URL('../src/pages/registro/index.astro', import.meta.url), 'utf8');
const compile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const helperCode = compile(helperSource);

// Only deterministic DOM/transport boundaries: no server or real signup request.
function browser(specs = []) {
  const document = { activeElement: null };
  class Element {
    constructor(tag = 'div') {
      this.tagName = tag.toUpperCase(); this.children = []; this.attributes = new Map();
      this.listeners = {}; this.dataset = {}; this.style = {}; this.hidden = false;
      this.disabled = false; this.textContent = ''; this.id = ''; this.className = '';
      this.ownerDocument = document;
    }
    append(...children) {
      for (const child of children) {
        if (typeof child !== 'string') child.parentElement = this;
        this.children.push(child);
      }
    }
    after(node) {
      node.parentElement = this.parentElement;
      this.parentElement.children.splice(this.parentElement.children.indexOf(this) + 1, 0, node);
    }
    closest(selector) {
      for (let node = this; node; node = node.parentElement) {
        if (selector === 'label' && node.tagName === 'LABEL') return node;
      }
      return null;
    }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    setAttribute(name, value) { this.attributes.set(name, value); }
    removeAttribute(name) { this.attributes.delete(name); }
    addEventListener(type, listener) { (this.listeners[type] ??= []).push(listener); }
    async emit(type, target = this) {
      const event = { target, prevented: false, preventDefault() { this.prevented = true; } };
      for (const listener of this.listeners[type] ?? []) await listener(event);
      return event;
    }
    focus() { document.activeElement = this; }
    querySelector(selector) {
      return walk(this).find(node => selector.startsWith('#') ? node.id === selector.slice(1)
        : selector === '.status' ? node.className === 'status'
        : selector === 'button[type="submit"]' ? node.tagName === 'BUTTON' && node.type === 'submit'
        : false) ?? null;
    }
  }
  class Input extends Element {
    constructor(spec = {}) {
      super('input');
      Object.assign(this, {
        name: '', type: 'text', value: '', required: false, checked: false,
        readOnly: false, minLength: -1, maxLength: -1, min: '', max: '', flags: {},
      }, spec);
    }
    get willValidate() { return !this.disabled && !this.readOnly && this.type !== 'hidden'; }
    get validity() {
      const valueMissing = this.required && (['checkbox', 'radio'].includes(this.type) ? !this.checked : !this.value);
      const typeMismatch = this.type === 'email' && !!this.value && !/^[^\s@]+@[^\s@]+$/.test(this.value);
      // Length flags intentionally remain false for script-assigned values.
      const flags = { valueMissing, typeMismatch, tooShort: false, tooLong: false, ...this.flags };
      return { ...flags, valid: !Object.values(flags).some(Boolean) };
    }
    checkValidity() { throw new Error('Use validity without native invalid events'); }
    reportValidity() { throw new Error('Native tooltips are forbidden'); }
  }
  class Select extends Input { constructor(spec) { super(spec); this.tagName = 'SELECT'; } }
  class Textarea extends Input { constructor(spec) { super(spec); this.tagName = 'TEXTAREA'; } }
  class Form extends Element {
    constructor() { super('form'); this.elements = []; this.noValidate = false; }
    add(spec) {
      const Field = spec.tag === 'textarea' ? Textarea : spec.tag === 'select' ? Select : Input;
      const field = new Field(spec);
      const wrapper = new Element(spec.wrapLabel ? 'label' : 'div');
      wrapper.append(field); this.append(wrapper); this.elements.push(field);
      return field;
    }
  }
  function walk(root) {
    return root.children.flatMap(node => typeof node === 'string' ? [] : [node, ...walk(node)]);
  }
  const form = new Form();
  const fields = specs.map(spec => form.add(spec));
  document.createElement = tag => new Element(tag);
  document.getElementById = id => walk(form).find(node => node.id === id) ?? null;
  document.querySelector = selector => selector === '#signup-form' ? form : form.querySelector(selector);
  const context = {
    exports: {}, document, Element, HTMLElement: Element, HTMLInputElement: Input,
    HTMLSelectElement: Select, HTMLTextAreaElement: Textarea,
  };
  vm.createContext(context);
  vm.runInContext(helperCode, context);
  return { form, fields, document, context, Element, bind: context.exports.bindFormFeedback,
    messages: () => walk(form).filter(node => 'formFeedback' in node.dataset) };
}

test('binding enables noValidate only in JS, is repeatable, and has no submit action', () => {
  const page = browser([{ required: true }]);
  assert.equal(page.form.noValidate, false);
  const feedback = page.bind(page.form);
  assert.equal(page.form.noValidate, true);
  assert.equal(page.bind(page.form), feedback);
  assert.equal(page.form.listeners.input.length, 1);
  assert.equal(page.form.listeners.submit, undefined);
  assert.equal(page.messages().length, 0);
});

test('required and whitespace-only fields show Spanish inline errors and focus the first invalid', () => {
  const page = browser([
    { name: 'contactName', required: true, minLength: 2, value: ' \t\n' },
    { name: 'companyName', required: true, minLength: 2, value: '   ' },
    { tag: 'textarea', name: 'message', required: true, value: '  ' },
    { tag: 'select', required: true, value: '' },
  ]);
  const feedback = page.bind(page.form);
  assert.equal(feedback.validate(), false);
  assert.equal(page.document.activeElement, page.fields[0]);
  assert.equal(page.messages().length, 4);
  for (const [index, field] of page.fields.entries()) {
    assert.equal(field.getAttribute('aria-invalid'), 'true');
    assert.equal(field.getAttribute('aria-describedby'), page.messages()[index].id);
    assert.equal(page.messages()[index].textContent, 'Completa este campo.');
  }
  assert.equal(page.fields[0].value, ' \t\n');
});

test('all required checkboxes stay invalid until checked; legal error is outside the label on a full grid row', async () => {
  const page = browser([{ id: 'legal', type: 'checkbox', required: true, wrapLabel: true }]);
  const feedback = page.bind(page.form);
  assert.equal(feedback.validate(), false);
  const message = page.messages()[0];
  assert.equal(message.textContent, 'Marca esta casilla para continuar.');
  assert.equal(message.parentElement, page.form);
  assert.equal(message.className, 'field-error');
  assert.equal(message.style.gridColumn, '1 / -1');
  page.fields[0].checked = true;
  await page.form.emit('change', page.fields[0]);
  assert.equal(message.hidden, true);
  assert.equal(page.fields[0].getAttribute('aria-invalid'), null);
  assert.equal(feedback.validate(), true);
});

test('native email validity is used, errors update on input and clear without moving focus', async () => {
  const page = browser([{ type: 'email', required: true, value: 'invalid' }]);
  const feedback = page.bind(page.form);
  assert.equal(feedback.validate(), false);
  assert.equal(page.messages()[0].textContent, 'Escribe un correo electrónico válido.');
  page.fields[0].value = '';
  await page.form.emit('input', page.fields[0]);
  assert.equal(page.messages()[0].textContent, 'Completa este campo.');
  page.document.activeElement = page.form;
  page.fields[0].value = 'ana@example.invalid';
  await page.form.emit('input', page.fields[0]);
  assert.equal(page.messages()[0].textContent, '');
  assert.equal(page.messages()[0].hidden, true);
  assert.equal(page.fields[0].getAttribute('aria-describedby'), null);
  assert.equal(page.document.activeElement, page.form);
  assert.equal(feedback.validate(), true);
});

test('minlength counts meaningful characters and maxlength handles script values without mutating payload', () => {
  const page = browser([
    { name: 'contactName', required: true, minLength: 2, value: ' A ' },
    { name: 'companyName', required: true, maxLength: 4, value: 'ABCDE' },
    { tag: 'textarea', maxLength: 4, value: '12345' },
  ]);
  assert.equal(page.bind(page.form).validate(), false);
  assert.deepEqual(page.messages().map(node => node.textContent),
    ['Usa al menos 2 caracteres.', 'Usa como máximo 4 caracteres.', 'Usa como máximo 4 caracteres.']);
  assert.deepEqual(page.fields.map(field => field.value), [' A ', 'ABCDE', '12345']);
});

test('optional empty fields, exact length boundaries, and disabled/read-only controls do not block', () => {
  const page = browser([
    { type: 'tel', minLength: 5, maxLength: 40, value: '' },
    { minLength: 2, maxLength: 2, value: 'AB' },
    { required: true, disabled: true },
    { required: true, readOnly: true },
    { required: true, type: 'hidden' },
  ]);
  assert.equal(page.bind(page.form).validate(), true);
  assert.equal(page.messages().length, 0);
});

test('number max/min and other native invalid states use inline feedback', () => {
  const page = browser([
    { type: 'number', max: '10', value: '11', flags: { rangeOverflow: true } },
    { type: 'number', min: '1', value: '0', flags: { rangeUnderflow: true } },
    { flags: { patternMismatch: true } },
  ]);
  assert.equal(page.bind(page.form).validate(), false);
  assert.deepEqual(page.messages().map(node => node.textContent), [
    'El valor debe ser menor o igual a 10.', 'El valor debe ser mayor o igual a 1.', 'Revisa este campo.',
  ]);
});

test('existing and later descriptions survive repeated validation, correction, and reset', async () => {
  const page = browser([{ required: true }]);
  const [field] = page.fields;
  field.setAttribute('aria-describedby', 'hint');
  const feedback = page.bind(page.form);
  feedback.validate(); feedback.validate();
  const message = page.messages()[0];
  assert.equal(page.messages().length, 1);
  assert.equal(field.getAttribute('aria-describedby'), 'hint ' + message.id);
  field.setAttribute('aria-describedby', field.getAttribute('aria-describedby') + ' later-hint');
  field.value = 'Correcto';
  await page.form.emit('input', field);
  assert.equal(field.getAttribute('aria-describedby'), 'hint later-hint');
  field.value = '';
  feedback.validate();
  await page.form.emit('reset');
  assert.equal(message.hidden, true);
  assert.equal(field.getAttribute('aria-describedby'), 'hint later-hint');
  assert.equal(field.getAttribute('aria-invalid'), null);
});

test('message ids avoid document collisions and newly added fields are validated', () => {
  const page = browser([{ required: true }]);
  const collision = new page.Element('p'); collision.id = 'form-feedback-1'; page.form.append(collision);
  const feedback = page.bind(page.form);
  feedback.validate();
  assert.notEqual(page.messages()[0].id, collision.id);
  page.fields[0].value = 'Correcto';
  const added = page.form.add({ required: true });
  assert.equal(feedback.validate(), false);
  assert.equal(page.document.activeElement, added);
});

test('disabling an invalid control clears its feedback on validation', () => {
  const page = browser([{ required: true }]);
  const feedback = page.bind(page.form);
  feedback.validate();
  page.fields[0].disabled = true;
  assert.equal(feedback.validate(), true);
  assert.equal(page.messages()[0].hidden, true);
  assert.equal(page.fields[0].getAttribute('aria-invalid'), null);
});

async function signup({ ready = true, documents = [
  { type: 'terms', version: '2026-09-01', contentUrl: '/legal/terminos' },
  { type: 'privacy', version: '2026-09-01', contentUrl: '/legal/privacidad' },
] } = {}) {
  const page = browser([
    { id: 'contactName', name: 'contactName', required: true, minLength: 2, maxLength: 180, value: ' Ana ' },
    { id: 'email', name: 'email', type: 'email', required: true, maxLength: 320, value: 'ana@example.invalid' },
    { id: 'companyName', name: 'companyName', required: true, minLength: 2, maxLength: 200, value: ' Tienda ' },
    { id: 'phone', name: 'phone', type: 'tel', minLength: 5, maxLength: 40, value: '' },
    { id: 'priceCode', name: 'priceCode', tag: 'select', required: true, value: 'professional' },
    { id: 'legal', type: 'checkbox', required: true, checked: false, disabled: true, wrapLabel: true },
  ]);
  page.form.dataset.apiUrl = 'https://api.example.invalid';
  page.form.id = 'signup-form';
  const status = new page.Element('p'); status.className = 'status';
  const submit = new page.Element('button'); submit.type = 'submit'; submit.disabled = true;
  const terms = new page.Element('a'); terms.id = 'terms-link';
  const privacy = new page.Element('a'); privacy.id = 'privacy-link';
  page.form.append(status, submit, terms, privacy);
  const storage = new Map(), calls = [];
  let sequence = 0;
  Object.assign(page.context, {
    bindFormFeedback: page.bind, URL, URLSearchParams,
    location: { origin: 'https://web.example.invalid', search: '' },
    sessionStorage: { getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    createIdempotencyKey: () => 'local-test-key-' + (++sequence).toString().padStart(4, '0'),
    FormData: class {
      constructor(form) { this.form = form; }
      get(name) { return this.form.elements.find(field => field.name === name && !field.disabled)?.value ?? null; }
    },
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (!options) return ready
        ? { ok: true, json: async () => ({ documents }) }
        : Promise.reject(new Error('offline fixture'));
      // Local stub only. Retain the failed attempt to verify retry idempotency.
      return { ok: false, json: async () => ({ error: { code: 'test_failure', message: 'Fallo simulado' } }) };
    },
  });
  const script = registration.match(/<script>\s*([\s\S]*?)<\/script>/)[1]
    .replace(/^\s*import[^;]+;/gm, '');
  vm.runInContext(compile(script), page.context);
  await new Promise(resolve => setImmediate(resolve));
  return { ...page, storage, calls, status, submit, legal: page.fields[5],
    posts: () => calls.filter(call => call.options?.method === 'POST') };
}

test('registration fallback retains constraints and required labels, without static novalidate', () => {
  const markup = registration.split('<script>')[0];
  assert.doesNotMatch(markup, /novalidate/i);
  for (const id of ['contactName', 'email', 'companyName', 'priceCode']) {
    assert.match(markup, new RegExp('<label for="' + id + '">[^<]+\\(obligatorio\\)</label>'));
  }
  assert.match(markup, /id="legal"[^>]*required disabled/);
  assert.match(markup, /vigentes\. \(obligatorio\)/);
});

test('registration never reaches the signup transport or storage on invalid values or unchecked legal', async () => {
  for (const [index, value] of [[0, '   '], [1, 'invalid'], [2, '   '], [3, '123'], [5, false]]) {
    const page = await signup();
    page.legal.checked = true;
    if (index === 5) page.legal.checked = value;
    else page.fields[index].value = value;
    assert.equal((await page.form.emit('submit')).prevented, true);
    assert.equal(page.posts().length, 0);
    assert.equal(page.storage.size, 0);
    assert.equal(page.document.activeElement, page.fields[index]);
  }
});

test('registration readiness blocks a programmatic submit before legal loads, on failure, or with disabled legal', async () => {
  const loading = await signup({ ready: false });
  loading.legal.checked = true;
  loading.submit.disabled = false; // Even a programmatic/UI bypass cannot skip legal readiness.
  await loading.form.emit('submit');
  assert.equal(loading.posts().length, 0);
  assert.equal(loading.storage.size, 0);

  const missing = await signup({ documents: [{ type: 'terms' }, { type: 'terms' }] });
  missing.legal.checked = true;
  await missing.form.emit('submit');
  assert.equal(missing.posts().length, 0);
  assert.equal(missing.storage.size, 0);

  const disabled = await signup();
  disabled.legal.checked = true; disabled.legal.disabled = true;
  await disabled.form.emit('submit');
  assert.equal(disabled.posts().length, 0);
});

test('valid local transport stub preserves raw payload, versions, acceptedAt, and retry idempotency', async () => {
  const page = await signup();
  assert.equal(page.legal.disabled, false);
  assert.equal(page.submit.disabled, false);
  page.legal.checked = true;
  await page.form.emit('submit');
  const first = page.posts()[0];
  const payload = JSON.parse(first.options.body);
  assert.equal(first.url, 'https://api.example.invalid/v1/signup-intents');
  assert.deepEqual(payload, {
    contactName: ' Ana ', email: 'ana@example.invalid', companyName: ' Tienda ', priceCode: 'professional',
    legalAcceptance: { termsVersion: '2026-09-01', privacyVersion: '2026-09-01',
      acceptedAt: page.storage.get('signup-accepted-at') },
  });
  assert.ok(payload.legalAcceptance.acceptedAt);
  assert.equal(first.options.headers['content-type'], 'application/json');
  assert.equal(first.options.headers['idempotency-key'], page.storage.get('signup-key'));
  await page.form.emit('submit');
  assert.equal(page.posts()[1].options.headers['idempotency-key'], first.options.headers['idempotency-key']);
  assert.equal(page.posts()[1].options.body, first.options.body);
});

test('disabled submit blocks duplicate programmatic submission without changing the current attempt', async () => {
  const page = await signup();
  page.legal.checked = true; page.submit.disabled = true;
  await page.form.emit('submit');
  assert.equal(page.posts().length, 0);
  assert.equal(page.storage.size, 0);
});
