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
const verificationCode = compile(await readFile(new URL('../src/lib/signup-verification.ts', import.meta.url), 'utf8'));

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
    replaceChildren(...children) { this.children = []; this.append(...children); }
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
      const event = { target, prevented: false, propagationStopped: false, preventDefault() { this.prevented = true; }, stopPropagation() { this.propagationStopped = true; } };
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

async function signup({ ready = true, initialStorage = [], blockedStorage = false, transport, catalog, dev = false, documents = [
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
  const storage = new Map(initialStorage), calls = [], timers = new Map(), windowListeners = {};
  let now = Date.parse('2030-01-01T00:00:00Z');
  let sequence = 0;
  Object.assign(page.context, {
    bindFormFeedback: page.bind, URL, URLSearchParams,
    location: { origin: 'https://web.example.invalid', search: '' },
    Date: class extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } },
    window: {
      setInterval: callback => { timers.set(timers.size + 1, callback); return timers.size; },
      clearInterval: id => timers.delete(id),
      addEventListener: (name, callback) => { (windowListeners[name] ??= []).push(callback); },
    },
    sessionStorage: { getItem: key => { if (blockedStorage) throw Error('Storage denied'); return storage.get(key) ?? null; },
      setItem: (key, value) => { if (blockedStorage) throw Error('Storage denied'); storage.set(key, value); },
      removeItem: key => { if (blockedStorage) throw Error('Storage denied'); storage.delete(key); } },
    createIdempotencyKey: () => 'local-test-key-' + (++sequence).toString().padStart(4, '0'),
    FormData: class {
      constructor(form) { this.form = form; }
      get(name) { return this.form.elements.find(field => field.name === name && !field.disabled)?.value ?? null; }
    },
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith('/v1/public/legal-documents')) return catalog ? catalog(url, options) : ready
        ? { ok: true, json: async () => ({ documents }) }
        : Promise.reject(new Error('offline fixture'));
      if (transport && (options || url.includes('/development/'))) return transport(url, options);
      // Local stub only. Retain the failed attempt to verify retry idempotency.
      return { ok: false, json: async () => ({ error: { code: 'test_failure', message: 'Fallo simulado' } }) };
    },
  });
  const script = registration.match(/<script>\s*([\s\S]*?)<\/script>/)[1]
    .replace(/^\s*import[^;]+;/gm, '').replaceAll('import.meta.env.DEV', String(dev));
  vm.runInContext(verificationCode, page.context);
  Object.assign(page.context, page.context.exports);
  vm.runInContext(compile(script), page.context);
  await new Promise(resolve => setImmediate(resolve));
  return { ...page, storage, calls, status, submit, legal: page.fields[5],
    timers, windowListeners,
    advance: seconds => { now += seconds * 1000; for (const callback of timers.values()) callback(); },
    nodes: () => { const walk = root => root.children.flatMap(child => typeof child === 'string' ? [] : [child, ...walk(child)]); return walk(page.form); },
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
      acceptedAt: payload.legalAcceptance.acceptedAt },
  });
  assert.ok(payload.legalAcceptance.acceptedAt);
  assert.equal(first.options.headers['content-type'], 'application/json');
  assert.ok(first.options.headers['idempotency-key'].length >= 16);
  assert.equal(page.storage.size, 3, 'Creation retains its original retry key until confirmed');
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

const verificationFixture = {
  signupIntentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', status: 'email_pending', nextAction: 'verify_email',
  email: 'ana@example.invalid', expiresAt: '2030-01-02T00:00:00.000Z',
  verificationEmail: { resendAvailableAt: '2030-01-01T00:01:00.000Z', retryAfterSeconds: 60 }
};
const reply = (status, body, retryAfter = null) => ({ ok: status >= 200 && status < 300, status, headers: { get: name => name.toLowerCase() === 'retry-after' ? retryAfter : null }, json: async () => body });
const receiptButton = page => page.nodes().find(node => node.tagName === 'BUTTON' && node.textContent === 'Reenviar correo');
const receiptStatus = page => page.nodes().find(node => node.id === 'verification-resend-status');
async function registered(transport, extra = {}) {
  const page = await signup({ ...extra, transport: (url, options) => url.endsWith('/v1/signup-intents')
    ? Promise.resolve(reply(201, verificationFixture)) : transport(url, options) });
  page.legal.checked = true; await page.form.emit('submit'); return page;
}

test('verification receipt waits sixty seconds and resends only the existing registration', async () => {
  const page = await registered(async () => reply(202, { status: 'accepted', resendAvailableAt: '2030-01-01T00:02:00.000Z', retryAfterSeconds: 60 }));
  const button = receiptButton(page); assert.ok(button); assert.equal(button.disabled, true);
  await button.emit('click'); assert.equal(page.posts().length, 1);
  page.advance(59); assert.equal(button.disabled, true);
  page.advance(1); assert.equal(button.disabled, false); await button.emit('click');
  const post = page.posts()[1]; assert.match(post.url, new RegExp('/' + verificationFixture.signupIntentId + '/resend-verification$'));
  assert.deepEqual(JSON.parse(post.options.body), { email: verificationFixture.email });
  assert.equal(button.disabled, true); assert.match(receiptStatus(page).textContent, /Solicitamos de nuevo/);
  const stored = JSON.parse(page.storage.get('signup-verification'));
  assert.deepEqual(Object.keys(stored).sort(), ['email','expiry','id','resendAt']);
  assert.equal(page.storage.size, 1); assert.equal(page.posts().filter(p => p.url.endsWith('/v1/signup-intents')).length, 1);
});

test('lost resend response retains its key and reload never automatically sends', async () => {
  let attempts = 0;
  const page = await registered(async () => { if (++attempts === 1) throw Error('Failed to fetch'); return reply(202, {status:'accepted',resendAvailableAt:'2030-01-01T00:02:00.000Z',retryAfterSeconds:60}); });
  page.advance(60); const button=receiptButton(page); await button.emit('click');
  assert.equal(button.disabled,false); assert.match(receiptStatus(page).textContent,/conexión/);
  await button.emit('click'); assert.equal(page.posts()[1].options.headers['idempotency-key'],page.posts()[2].options.headers['idempotency-key']);
  const reload=await signup({initialStorage:[...page.storage],transport:async()=>assert.fail('Reload must not send')});
  assert.equal(reload.posts().length,0); assert.ok(receiptButton(reload));
});

test('in-flight resend blocks rapid clicks until the response arrives', async () => {
  let release; const page=await registered(()=>new Promise(resolve=>{release=resolve;}));
  page.advance(60); const button=receiptButton(page),first=button.emit('click');
  await button.emit('click'); assert.equal(page.posts().length,2);
  release(reply(202,{status:'accepted',resendAvailableAt:'2030-01-01T00:02:00.000Z',retryAfterSeconds:60})); await first;
  assert.equal(button.disabled,true);
});

test('server cooldown and IP limits are respected even if the local timer elapsed', async () => {
  for(const code of ['verification_resend_too_soon','rate_limit_exceeded']){
    const page=await registered(async()=>reply(429,{error:{code,retryAfterSeconds:90,resendAvailableAt:'2030-01-01T00:02:30.000Z'}},'90'));
    page.advance(60);const button=receiptButton(page);await button.emit('click');assert.equal(button.disabled,true);
    page.advance(89);assert.equal(button.disabled,true);page.advance(1);assert.equal(button.disabled,false);
  }
});

test('unavailable recipient keeps the form and never announces a queued verification', async () => {
  const page=await signup({transport:async()=>reply(503,{error:{code:'email_delivery_unavailable',message:'El envío no está habilitado.'}})});
  page.legal.checked=true;await page.form.emit('submit');
  assert.equal(page.fields[1].value,'ana@example.invalid');assert.equal(page.submit.disabled,false);
  assert.match(page.status.textContent,/El envío no está habilitado/);assert.equal(receiptButton(page),undefined);
  assert.equal(page.storage.has('signup-verification'),false);
});

test('old pending browser receipt upgrades without sending or retaining the full form', async () => {
  const page=await signup({initialStorage:[['signup-intent-id',verificationFixture.signupIntentId],['signup-draft',JSON.stringify({email:verificationFixture.email,companyName:'Sensitive draft'})],['signup-accepted-at','2030-01-01T00:00:00.000Z'],['signup-key','old-valid-idempotency-key']],transport:async()=>assert.fail('Restore must not send')});
  assert.ok(receiptButton(page));assert.equal(page.posts().length,0);assert.equal(page.storage.size,1);
  assert.doesNotMatch(page.storage.get('signup-verification'),/Sensitive draft|token|old-valid/);
});

test('expired receipt cannot resend and offers a way to start a new registration', async () => {
  const page=await signup({initialStorage:[['signup-verification',JSON.stringify({id:verificationFixture.signupIntentId,email:verificationFixture.email,expiry:'2029-12-31T23:59:59.000Z',resendAt:'2029-12-31T23:59:00.000Z'})]]});
  const button=receiptButton(page);assert.equal(button.disabled,true);await button.emit('click');assert.equal(page.posts().length,0);
  const correct=page.nodes().find(n=>n.tagName==='A'&&n.textContent==='Corregir correo o iniciar otro registro');assert.ok(correct);
  await correct.emit('click');assert.equal(page.storage.has('signup-verification'),false);
});

test('resend remains usable when browser storage is blocked', async () => {
  const page=await registered(async()=>reply(202,{status:'accepted',resendAvailableAt:'2030-01-01T00:02:00.000Z',retryAfterSeconds:60}),{blockedStorage:true});
  page.advance(60);await receiptButton(page).emit('click');assert.equal(page.posts().length,2);assert.match(receiptStatus(page).textContent,/Solicitamos de nuevo/);
});
test('creation retry preserves its key and legal acceptance after a lost response and reload', async () => {
  const first=await signup({transport:async()=>{throw Error('Failed to fetch');}});first.legal.checked=true;await first.form.emit('submit');
  const post=first.posts()[0];assert.equal(first.storage.size,3);
  const reloaded=await signup({initialStorage:[...first.storage],transport:async()=>reply(201,verificationFixture)});
  reloaded.legal.checked=true;await reloaded.form.emit('submit');
  assert.equal(reloaded.posts()[0].options.headers['idempotency-key'],post.options.headers['idempotency-key']);
  assert.equal(reloaded.posts()[0].options.body,post.options.body);assert.equal(reloaded.storage.size,1);
});

test('stale legal acceptance clears a restored attempt, refreshes uncached documents, and requires manual acceptance', async () => {
  const original = {
    contactName: ' Ana ', email: 'ana@example.invalid', companyName: ' Tienda ', priceCode: 'professional',
    legalAcceptance: { termsVersion: '2026-09-01', privacyVersion: '2026-09-01' },
  };
  const oldKey = 'restored-key-before-stale', oldTime = '2029-12-31T23:00:00.000Z';
  const nextDocuments = ['terms', 'privacy'].map((type, index) => ({ type, version: '2026-11-25-prueba-qa',
    contentUrl: `/legal/versiones/2026-11-25-prueba-qa/${index ? 'privacidad' : 'terminos'}/` }));
  let reads = 0, posts = 0, release;
  const page = await signup({ initialStorage: [['signup-draft', JSON.stringify(original)], ['signup-key', oldKey], ['signup-accepted-at', oldTime]],
    catalog: () => ++reads === 1 ? reply(200, { documents: [
      { type: 'terms', version: '2026-09-01', contentUrl: '/legal/terminos' },
      { type: 'privacy', version: '2026-09-01', contentUrl: '/legal/privacidad' },
    ] }) : new Promise(resolve => { release = resolve; }),
    transport: async () => ++posts === 1 ? reply(409, { error: { code: 'signup_legal_acceptance_stale' } }) : reply(503, {}),
  });
  const values = page.fields.map(field => field.value);
  page.legal.checked = true;
  const submitting = page.form.emit('submit');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(page.posts()[0].options.headers['idempotency-key'], oldKey);
  assert.equal(JSON.parse(page.posts()[0].options.body).legalAcceptance.acceptedAt, oldTime);
  assert.equal(page.storage.size, 0);
  assert.equal(page.legal.checked, false); assert.equal(page.legal.disabled, true); assert.equal(page.submit.disabled, true);
  await page.form.emit('submit'); assert.equal(page.posts().length, 1);
  release(reply(200, { documents: nextDocuments })); await submitting;
  assert.deepEqual(page.fields.map(field => field.value), values);
  assert.equal(page.legal.checked, false); assert.equal(page.legal.disabled, false);
  assert.match(page.status.textContent, /vuelve a aceptarlas/);
  assert.equal(page.form.querySelector('#terms-link').href, 'https://web.example.invalid' + nextDocuments[0].contentUrl);
  assert.equal(page.form.querySelector('#privacy-link').href, 'https://web.example.invalid' + nextDocuments[1].contentUrl);
  assert.equal(reads, 2);
  assert.ok(page.calls.filter(call => call.url.endsWith('/legal-documents')).every(call => call.options?.cache === 'no-store'));
  await page.form.emit('submit'); assert.equal(page.posts().length, 1, 'No automatic submission or acceptance');
  page.advance(30); page.legal.checked = true; await page.form.emit('submit');
  const renewed = page.posts()[1];
  assert.notEqual(renewed.options.headers['idempotency-key'], oldKey);
  assert.deepEqual(JSON.parse(renewed.options.body), { ...original, legalAcceptance: {
    termsVersion: nextDocuments[0].version, privacyVersion: nextDocuments[1].version, acceptedAt: '2030-01-01T00:00:30.000Z',
  } });
});

test('clock-expired acceptance renews its key and timestamp even with unchanged documents or blocked storage', async () => {
  for (const blockedStorage of [false, true]) {
    let posts = 0;
    const clockMessage = 'Revisa la fecha y hora de tu equipo y vuelve a aceptar las condiciones vigentes. <b>Texto del servidor</b>';
    const page = await signup({ blockedStorage, transport: async () => ++posts === 2
      ? reply(409, { error: { code: 'signup_legal_acceptance_stale', message: clockMessage } }) : Promise.reject(new Error('lost response')) });
    page.legal.checked = true; await page.form.emit('submit');
    page.advance(600); await page.form.emit('submit');
    assert.equal(page.posts()[1].options.body, page.posts()[0].options.body);
    assert.equal(page.posts()[1].options.headers['idempotency-key'], page.posts()[0].options.headers['idempotency-key']);
    assert.equal(page.legal.checked, false); assert.equal(page.storage.size, 0);
    assert.ok(page.status.textContent.includes(clockMessage));
    assert.equal(page.status.children.length, 0, 'Server diagnostics remain plain text');
    page.advance(1); page.legal.checked = true; await page.form.emit('submit');
    assert.notEqual(page.posts()[2].options.headers['idempotency-key'], page.posts()[0].options.headers['idempotency-key']);
    assert.equal(JSON.parse(page.posts()[2].options.body).legalAcceptance.acceptedAt, '2030-01-01T00:10:01.000Z');
  }
});

test('failed or incomplete catalog refresh leaves stale acceptance disabled and keeps entered fields', async () => {
  for (const refresh of [() => Promise.reject(new Error('offline')), () => reply(503, {}),
    () => reply(200, { documents: [] }), () => reply(200, { documents: null })]) {
    let reads = 0;
    const page = await signup({ catalog: () => ++reads === 1 ? reply(200, { documents: [
      { type: 'terms', version: '2026-09-01', contentUrl: '/legal/terminos' },
      { type: 'privacy', version: '2026-09-01', contentUrl: '/legal/privacidad' },
    ] }) : refresh(), transport: async () => reply(409, { error: { code: 'signup_legal_acceptance_stale' } }) });
    page.fields[3].value = '3000000000'; const values = page.fields.map(field => field.value);
    page.legal.checked = true; await page.form.emit('submit');
    assert.equal(page.legal.checked, false); assert.equal(page.legal.disabled, true); assert.equal(page.submit.disabled, true);
    assert.equal(page.storage.size, 0); assert.match(page.status.textContent, /Conservamos tus datos/);
    assert.deepEqual(page.fields.map(field => field.value), values);
    page.legal.checked = true; page.submit.disabled = false;
    await page.form.emit('submit'); assert.equal(page.posts().length, 1);
  }
});

test('ambiguous creation errors and unrelated conflicts preserve the original key, acceptance, and catalog', async () => {
  for (const failure of [() => Promise.reject(new Error('network')), () => reply(503, { error: { code: 'unavailable' } }),
    () => reply(409, { error: { code: 'idempotency_conflict' } }),
    () => reply(400, { error: { code: 'signup_legal_acceptance_stale' } }),
    () => ({ ok: false, status: 502, json: async () => { throw Error('invalid JSON'); } })]) {
    const page = await signup({ transport: failure });
    page.legal.checked = true; await page.form.emit('submit'); page.advance(600); await page.form.emit('submit');
    assert.equal(page.posts()[1].options.headers['idempotency-key'], page.posts()[0].options.headers['idempotency-key']);
    assert.equal(page.posts()[1].options.body, page.posts()[0].options.body);
    assert.equal(page.calls.filter(call => call.url.endsWith('/legal-documents')).length, 1);
    assert.equal(page.legal.checked, true); assert.equal(page.storage.size, 3);
  }
});

const landing = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
function contact(whatsappNumber = '') {
  const page = browser([
    { id: 'name', name: 'name', required: true, minLength: 2, maxLength: 120, value: ' Ana ', disabled: true },
    { id: 'phone', name: 'phone', type: 'tel', maxLength: 40, value: '3000000000', disabled: true },
    { id: 'plan', name: 'plan', tag: 'select', value: 'Profesional FE', disabled: true },
    { id: 'message', name: 'message', tag: 'textarea', maxLength: 1500, value: 'Inventario y caja', disabled: true },
  ]);
  page.form.id = 'lead-form';
  page.form.dataset.whatsappNumber = whatsappNumber;
  const status = new page.Element('p'); status.className = 'form-status';
  const ready = new page.Element('button'); ready.type = 'button'; ready.hidden = true;
  const submit = new page.Element('button'); submit.type = 'submit'; submit.disabled = true;
  page.form.append(status, ready, submit);
  const originalQuery = page.form.querySelector.bind(page.form);
  page.form.querySelector = selector => selector === '[data-contact-ready]' ? ready : selector === '.form-status' ? status : originalQuery(selector);
  page.form.querySelectorAll = selector => {
    assert.equal(selector, 'input, select, textarea, button');
    return [...page.fields, ready, submit];
  };
  page.document.querySelector = selector => selector === '#lead-form' ? page.form : null;
  const opened = [];
  Object.assign(page.context, {
    bindFormFeedback: page.bind,
    window: { open: (...args) => opened.push(args) },
    fetch: () => { throw Error('Contact must not send network requests'); },
    localStorage: new Proxy({}, { get() { throw Error('Contact must not persist data'); } }),
    sessionStorage: new Proxy({}, { get() { throw Error('Contact must not persist data'); } }),
    FormData: class {
      constructor(form) { this.form = form; }
      get(name) { return this.form.elements.find(field => field.name === name && !field.disabled)?.value ?? null; }
    },
  });
  const code = landing.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/^\s*import[^;]+;/gm, '');
  vm.runInContext(compile(code), page.context);
  return { ...page, ready, status, submit, opened };
}

for (const [channel, number] of [['WhatsApp', '573000000000'], ['email', '']]) {
  test('contact prepares the 15-day trial inquiry for ' + channel + ' and opens only after explicit confirmation', async () => {
    const page = contact(number);
    assert.ok(page.fields.every(field => !field.disabled));
    assert.equal(page.submit.disabled, false);
    const event = await page.form.emit('submit');
    assert.equal(event.prevented, true);
    assert.equal(page.ready.hidden, false);
    assert.equal(page.document.activeElement, page.ready);
    assert.equal(page.opened.length, 0);
    const click = await page.ready.emit('click');
    assert.equal(click.propagationStopped, true);
    assert.equal(page.opened.length, 1);
    const [href, target, features] = page.opened[0];
    assert.equal(target, '_blank'); assert.equal(features, 'noopener,noreferrer');
    const url = new URL(href);
    assert.equal(url.protocol, number ? 'https:' : 'mailto:');
    if (number) { assert.equal(url.hostname, 'wa.me'); assert.equal(url.pathname, '/' + number); }
    else { assert.equal(url.pathname, 'ventas@cripton.com.co'); assert.equal(url.searchParams.get('subject'), 'Prueba gratis de 15 días de Cripton POS'); }
    const message = url.searchParams.get(number ? 'text' : 'body');
    assert.match(message, /prueba gratis de 15 días.*sin tarjeta/);
    assert.match(message, /Para continuar después se requiere un plan de pago/);
    assert.doesNotMatch(message, /demo|demostraci[oó]n/i);
    assert.match(message, /Nombre: Ana\nTeléfono: 3000000000\nPlan de interés: Profesional FE\nNecesidad: Inventario y caja/);
  });
}

test('contact validates before preparing and invalidates a prepared message when inputs change', async () => {
  const page = contact('573000000000');
  page.fields[0].value = '  ';
  await page.form.emit('submit');
  assert.equal(page.ready.hidden, true);
  assert.equal(page.document.activeElement, page.fields[0]);
  assert.equal(page.fields[0].getAttribute('aria-invalid'), 'true');
  await page.ready.emit('click');
  assert.equal(page.opened.length, 0);
  page.fields[0].value = 'Ana';
  await page.form.emit('input', page.fields[0]);
  await page.form.emit('submit');
  assert.equal(page.ready.hidden, false);
  page.fields[3].value = 'Otra consulta';
  await page.form.emit('input', page.fields[3]);
  assert.equal(page.ready.hidden, true);
  assert.match(page.status.textContent, /Vuelve a preparar el mensaje/);
  await page.ready.emit('click');
  assert.equal(page.opened.length, 0, 'a stale prepared URL cannot be reused');
});
