import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const code = compile(await readFile(new URL('../src/lib/owner-onboarding.ts', import.meta.url),'utf8'));
const phone = {};
vm.runInNewContext(compile(await readFile(new URL('../src/lib/signup-phone.ts', import.meta.url),'utf8')), {exports:phone});
const id = '11111111-1111-4111-8111-111111111111', token = 'fixture-proof-not-for-storage'.repeat(3);
const initial = Date.parse('2030-01-01T12:00:00Z');
const timing = (seconds=60,at=initial) => ({ serverTime:new Date(at).toISOString(),resendAvailableAt:new Date(at+seconds*1000).toISOString(),retryAfterSeconds:seconds });
const state = (status,at=initial) => ({ status,serverTime:new Date(at).toISOString(),pollAfterSeconds:status==='provisioning'?3:0,
  ...(status==='setup_required'?{passwordEmail:timing(60,at)}:{}) });
const settle = async () => { for(let n=0;n<4;n++)await new Promise(resolve=>setImmediate(resolve)); };

async function browser(replies, { skew=0 }={}) {
  let now=initial+skew,sequence=0;
  const calls=[],timeouts=new Map(),intervals=new Map(),listeners={},exports={};
  class Element {
    children=[];dataset={};attributes={};hidden=false;disabled=false;textContent='';
    constructor(tag){this.tag=tag;this.events={};}
    append(...nodes){this.children.push(...nodes);}
    replaceChildren(...nodes){this.children=[...nodes];}
    setAttribute(key,value){this.attributes[key]=value;}
    addEventListener(type,fn){this.events[type]=fn;}
    async click(){this.events.click?.();await settle();}
  }
  const root=new Element('div');
  const context={exports,AbortController,crypto:{randomUUID:()=> 'fixture-owner-key-'+(++sequence)},
    Date:class extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}},
    document:{createElement:tag=>new Element(tag)},
    window:{setInterval:fn=>{const id=++sequence;intervals.set(id,fn);return id;},clearInterval:id=>intervals.delete(id),
      setTimeout:(fn,ms)=>{const id=++sequence;timeouts.set(id,{fn,at:now+ms});return id;},clearTimeout:id=>timeouts.delete(id),
      addEventListener:(name,fn)=>{listeners[name]=fn;}},
    fetch:async(url,options)=>{
      calls.push({url,options});const next=replies.shift();assert.ok(next,'unexpected network call');
      if(next instanceof Error)throw next;
      if(typeof next==='function')return next();
      return {ok:(next.status??200)<400,status:next.status??200,headers:new Headers(next.headers??{}),json:async()=>next.body};
    },
    sessionStorage:{setItem(){throw new Error('Credential storage forbidden');}},
    localStorage:{setItem(){throw new Error('Credential storage forbidden');}}
  };
  vm.runInNewContext(code,context);
  const panel=exports.showOwnerOnboarding(root,'https://api.example.invalid',{token,signupIntentId:id});await settle();
  const walk=()=>root.children.flatMap(node=>[node,...(node.children??[])]);
  return {root,panel,exports,calls,timeouts,intervals,listeners,
    button:text=>walk().find(node=>node.tag==='button'&&node.textContent===text),
    content:()=>walk().map(node=>node.textContent).join(' '),
    advance:async seconds=>{now+=seconds*1000;for(const fn of intervals.values())fn();
      for(const [id,timer]of[...timeouts])if(timer.at<=now){timeouts.delete(id);timer.fn();}await settle();}}
}

test('phone is required, normalized identically and does not imply WhatsApp',async()=>{
  for(const input of ['321 555 0123','+57 (321)555-0123','00573215550123'])assert.equal(phone.normalizeSignupPhone(input),'+573215550123');
  for(const input of ['','123','+570000000000','321 ext123','++573215550123'])assert.equal(phone.normalizeSignupPhone(input),null);
  assert.equal(phone.normalizeSignupPhone('+1 2025550123'),'+12025550123');
  const page=await readFile(new URL('../src/pages/registro/index.astro',import.meta.url),'utf8');
  assert.match(page,/id="phone"[^>]*required/);assert.match(page,/no autoriza mensajes por WhatsApp/);
});

test('preparation polls with proof until ready; no payment/reset or private data persisted',async()=>{
  const b=await browser([{body:state('provisioning')},{body:state('setup_required',initial+3000)}]);
  assert.match(b.content(),/preparando tu POS/);assert.equal(b.timeouts.size,1);
  await b.advance(3);
  assert.match(b.content(),/Paso 3: crea tu contraseña/);assert.equal(b.timeouts.size,0);
  for(const call of b.calls){assert.match(call.url,/owner-onboarding\/status$/);assert.deepEqual(JSON.parse(call.options.body),{token,signupIntentId:id});}
  assert.ok(!b.content().includes(token));b.panel.dispose();
});

test('existing access offers Mi cuenta without setup, reset or polling',async()=>{
  const b=await browser([{body:state('existing_access')}]);
  assert.match(b.content(),/Ya tienes contraseña/);assert.equal(b.timeouts.size,0);
  assert.equal(b.button('Reenviar configuración de contraseña').hidden,true);
  assert.equal(b.calls.length,1);b.panel.dispose();
});

test('resend uses initial setup purpose and sixty seconds relative to server despite computer skew',async()=>{
  const b=await browser([{body:state('setup_required')},{status:202,body:{status:'accepted',...timing(60,initial+60000)}}],{skew:86400_000});
  const button=b.button('Reenviar configuración de contraseña');assert.equal(button.disabled,true);
  await b.advance(59);assert.equal(button.disabled,true);await b.advance(1);assert.equal(button.disabled,false);
  await button.click();assert.equal(b.calls.length,2);
  assert.match(b.calls[1].url,/\/resend-password-setup$/);assert.equal(button.disabled,true);
  assert.match(b.content(),/no confirma su recepción/);await b.advance(60);assert.equal(button.disabled,false);b.panel.dispose();
});

test('network failure preserves idempotency and explicit error while countdown runs; success rotates key',async()=>{
  const b=await browser([{body:state('setup_required')},new TypeError('Failed to fetch'),
    {status:202,body:{status:'accepted',...timing(60,initial+60000)}},{status:202,body:{status:'accepted',...timing(60,initial+120000)}}]);
  await b.advance(60);const button=b.button('Reenviar configuración de contraseña');await button.click();
  assert.match(b.content(),/No pudimos confirmar el reenvío/);assert.doesNotMatch(b.content(),/Failed to fetch/);
  await b.advance(1);assert.match(b.content(),/No pudimos confirmar el reenvío/);
  await button.click();assert.equal(b.calls[1].options.headers['idempotency-key'],b.calls[2].options.headers['idempotency-key']);
  await b.advance(60);await button.click();assert.notEqual(b.calls[2].options.headers['idempotency-key'],b.calls[3].options.headers['idempotency-key']);b.panel.dispose();
});

test('429 refreshes cooldown from the current server response, then permits a manual retry',async()=>{
  const b=await browser([{body:state('setup_required')},{status:429,body:{error:{...timing(30,initial+60000)}}}]);
  await b.advance(60);const button=b.button('Reenviar configuración de contraseña');await button.click();
  assert.equal(button.disabled,true);assert.match(b.content(),/Espera el tiempo indicado/);
  await b.advance(29);assert.equal(button.disabled,true);await b.advance(1);assert.equal(button.disabled,false);b.panel.dispose();
});

test('network/status failure stops automatic polling, retains an actionable Spanish error and retries only manually',async()=>{
  const b=await browser([new TypeError('Failed to fetch'),{body:state('existing_access')}]);
  assert.match(b.content(),/Revisa tu conexión/);assert.equal(b.timeouts.size,0);
  await b.advance(120);assert.equal(b.calls.length,1);assert.match(b.content(),/Revisa tu conexión/);
  await b.button('Actualizar estado').click();assert.equal(b.calls.length,2);assert.match(b.content(),/Ya tienes contraseña/);b.panel.dispose();
});

test('expired or foreign proofs never enable resend or expose server-supplied diagnostics',async()=>{
  const b=await browser([{status:400,body:{error:{message:token+' private diagnostic'}}}]);
  assert.match(b.content(),/El enlace ya no permite/);assert.ok(!b.content().includes(token));
  assert.equal(b.button('Reenviar configuración de contraseña').hidden,true);b.panel.dispose();
});

test('disposed page aborts and ignores delayed status without another poll',async()=>{
  let finish;
  const b=await browser([()=>new Promise(resolve=>{finish=resolve;})]);const before=b.content();b.panel.dispose();
  finish({ok:true,json:async()=>state('setup_required')});await settle();
  assert.equal(b.content(),before);assert.equal(b.intervals.size,0);assert.equal(b.timeouts.size,0);
});

test('malformed status and timing fail closed without rendering any source secrets',async()=>{
  for(const body of [{status:'ready'}, {...state('provisioning'),pollAfterSeconds:0},
    {...state('setup_required'),passwordEmail:{...timing(),retryAfterSeconds:-1}}]){
    const b=await browser([{body}]);assert.match(b.content(),/No pudimos consultar/);assert.equal(b.timeouts.size,0);b.panel.dispose();
  }
});
