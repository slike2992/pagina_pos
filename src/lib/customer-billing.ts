type Context = { accessToken: string; tenantId: string; session: object };
type Options = { apiUrl: string; getContext: () => Context | null; onUnauthorized: () => void; requestedPaymentId?: string };
type Receipt = { paymentId: string; tenantId: string; reference: string; approvedAt: string;
  amountMinor: number; environment: 'test' | 'prod'; availability: 'available' | 'unavailable' };
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Respuesta inválida');
  return value as Record<string, unknown>;
};
export function readBillingReceipts(value: unknown, tenantId: string) {
  const body = record(value);
  if (!Array.isArray(body.receipts) || body.receipts.length > 50 || !(body.nextBefore === null
    || typeof body.nextBefore === 'string' && /^[A-Za-z0-9_-]{1,240}$/.test(body.nextBefore))) throw new Error('Respuesta inválida');
  return { nextBefore: body.nextBefore as string | null, receipts: body.receipts.map(value => {
    const row = record(value);
    if (!uuid(row.paymentId) || !uuid(row.tenantId) || row.tenantId.toLowerCase() !== tenantId.toLowerCase()
      || typeof row.reference !== 'string' || !row.reference || row.reference.length > 80
      || typeof row.approvedAt !== 'string' || !Number.isFinite(Date.parse(row.approvedAt))
      || !Number.isSafeInteger(row.amountMinor) || (row.amountMinor as number) < 0
      || row.currency !== 'COP' || row.status !== 'paid' || !['test', 'prod'].includes(String(row.environment))
      || !['available', 'unavailable'].includes(String(row.availability))) throw new Error('Respuesta inválida');
    return row as unknown as Receipt;
  }) };
}
export function readBillingPreferences(value: unknown) {
  const row = record(value);
  if (!Number.isSafeInteger(row.version) || (row.version as number) < 0 || typeof row.emailEnabled !== 'boolean'
    || typeof row.whatsappConsent !== 'boolean' || !['email', 'whatsapp'].includes(String(row.preferredChannel))
    || !(row.whatsappNumber === null || typeof row.whatsappNumber === 'string' && /^\+[1-9]\d{7,14}$/.test(row.whatsappNumber))) throw new Error('Respuesta inválida');
  return row as { version: number; emailEnabled: boolean; whatsappConsent: boolean; preferredChannel: string; whatsappNumber: string | null };
}
export function bindCustomerBilling(root: HTMLElement, options: Options) {
  const panel = root.querySelector<HTMLElement>('[data-customer-billing]');
  if (!panel) return { refresh: async () => {}, reset: () => {} };
  const status = panel.querySelector<HTMLElement>('[data-billing-status]')!;
  const list = panel.querySelector<HTMLElement>('[data-billing-receipts]')!;
  const more = panel.querySelector<HTMLButtonElement>('[data-billing-more]')!;
  const form = panel.querySelector<HTMLFormElement>('[data-billing-preferences]')!;
  let generation = 0, cursor: string | null = null, preferenceVersion: number | null = null;
  const seen = new Set<string>(), urls = new Set<string>();
  const isCurrent = (context: Context, version: number) => {
    const now = options.getContext();
    return version === generation && now?.accessToken === context.accessToken
      && now.tenantId === context.tenantId && now.session === context.session;
  };
  const fail = () => { status.textContent = 'No pudimos completar la consulta. Actualiza los pagos e intenta de nuevo.'; };
  async function request(context: Context, version: number, path: string, init: RequestInit = {}) {
    const response = await fetch(options.apiUrl.replace(/\/$/, '') + path, { ...init, cache: 'no-store',
      headers: { Authorization: `Bearer ${context.accessToken}`, ...init.headers } });
    if (!isCurrent(context, version)) return null;
    if (response.status === 401) { options.onUnauthorized(); return null; }
    if (!response.ok) throw new Error('No disponible');
    return response;
  }
  const control = <T extends HTMLInputElement | HTMLSelectElement>(name: string) => form.elements.namedItem(name) as T;
  async function loadReceipts(context: Context, version: number, before?: string, paymentId?: string) {
    const response = await request(context, version, '/v1/me/payment-receipts' + (paymentId ? '/' + paymentId : before ? '?before=' + encodeURIComponent(before) : ''));
    if (!response) return;
    const value = await response.json();
    const page = readBillingReceipts(paymentId ? { receipts: [value], nextBefore: cursor } : value, context.tenantId);
    if (paymentId && page.receipts[0]?.paymentId.toLowerCase() !== paymentId.toLowerCase()) throw new Error('Pago distinto del solicitado');
    if (!isCurrent(context, version)) return;
    for (const receipt of page.receipts) {
      if (seen.has(receipt.paymentId)) continue;
      if (!seen.size) list.replaceChildren();
      seen.add(receipt.paymentId);
      const item = document.createElement('article');
      const title = document.createElement('p');
      const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date(receipt.approvedAt));
      title.textContent = receipt.reference + ' · ' + new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(receipt.amountMinor / 100)
        + ' · ' + date + (receipt.environment === 'test' ? ' · Sandbox' : '');
      item.append(title);
      if (receipt.availability === 'available') {
        const actions = document.createElement('div'); actions.className = 'actions'; item.append(actions);
        for (const download of [false, true]) {
          const button = document.createElement('button'); button.type = 'button'; button.className = 'button secondary';
          button.textContent = download ? 'Descargar soporte PDF' : 'Ver e imprimir soporte';
          button.addEventListener('click', async () => {
            button.disabled = true;
            try {
              const response = await request(context, version, '/v1/me/payment-receipts/' + receipt.paymentId + '/pdf');
              if (!response || !response.headers.get('content-type')?.startsWith('application/pdf')) throw new Error('PDF no disponible');
              const blob = await response.blob();
              if (!isCurrent(context, version)) return;
              const url = URL.createObjectURL(blob); urls.add(url);
              const link = document.createElement('a'); link.href = url;
              if (download) link.download = 'Soporte-' + receipt.paymentId + '.pdf';
              else { link.target = '_blank'; link.rel = 'noopener'; }
              link.click();
              status.textContent = 'Soporte disponible. Puedes imprimirlo desde el visor PDF.';
            } catch { if (isCurrent(context, version)) fail(); }
            finally { if (isCurrent(context, version)) button.disabled = false; }
          }); actions.append(button);
        }
      } else {
        const note = document.createElement('p'); note.textContent = 'Pago aprobado histórico: faltan datos verificables para generar su cuenta de cobro.'; item.append(note);
      }
      list.append(item);
    }
    cursor = page.nextBefore; more.hidden = !cursor;
    if (!seen.size) list.textContent = 'Aún no hay pagos aprobados para esta empresa.';
  }
  async function loadPreferences(context: Context, version: number) {
    const response = await request(context, version, '/v1/me/communication-preferences');
    if (!response) return;
    const prefs = readBillingPreferences(await response.json());
    if (!isCurrent(context, version)) return;
    preferenceVersion = prefs.version;
    form.querySelector<HTMLButtonElement>('[type=submit]')!.disabled = false;
    control<HTMLInputElement>('emailEnabled').checked = prefs.emailEnabled;
    control<HTMLInputElement>('whatsappConsent').checked = prefs.whatsappConsent;
    control<HTMLInputElement>('whatsappNumber').value = prefs.whatsappNumber ?? '';
    control<HTMLSelectElement>('preferredChannel').value = prefs.preferredChannel;
  }
  function reset() { generation++; panel!.hidden = true; list.replaceChildren(); seen.clear(); cursor = null;
    preferenceVersion = null; status.textContent = ''; form.reset(); more.hidden = true; more.disabled = false;
    form.querySelector<HTMLButtonElement>('[type=submit]')!.disabled = true;
    for (const url of urls) URL.revokeObjectURL(url); urls.clear(); }
  async function refresh() {
    reset(); const context = options.getContext(), version = generation; if (!context) return;
    panel!.hidden = false; status.textContent = 'Consultando pagos y preferencias…';
    const receipts = async () => {
      await loadReceipts(context, version);
      if (isCurrent(context, version) && uuid(options.requestedPaymentId) && !seen.has(options.requestedPaymentId)) {
        await loadReceipts(context, version, undefined, options.requestedPaymentId);
      }
    };
    const results = await Promise.allSettled([receipts(), loadPreferences(context, version)]);
    if (isCurrent(context, version)) { if (results.some(result => result.status === 'rejected')) fail(); else status.textContent = 'Consulta actualizada.'; }
  }
  panel.querySelector('[data-billing-refresh]')!.addEventListener('click', () => { void refresh(); });
  more.addEventListener('click', async () => { const context = options.getContext(), version = generation; if (!context || !cursor) return;
    more.disabled = true; try { await loadReceipts(context, version, cursor); } catch { if (isCurrent(context, version)) fail(); }
    finally { if (isCurrent(context, version)) more.disabled = false; } });
  form.addEventListener('submit', async event => {
    event.preventDefault(); const context = options.getContext(), version = generation;
    if (!context || preferenceVersion === null) return;
    const button = form.querySelector<HTMLButtonElement>('[type=submit]')!; button.disabled = true;
    const consent = control<HTMLInputElement>('whatsappConsent').checked;
    const body = { expectedVersion: preferenceVersion, emailEnabled: control<HTMLInputElement>('emailEnabled').checked,
      preferredChannel: control<HTMLSelectElement>('preferredChannel').value, whatsappConsent: consent,
      whatsappNumber: consent ? control<HTMLInputElement>('whatsappNumber').value.trim() : null };
    if (consent && !/^\+[1-9]\d{7,14}$/.test(body.whatsappNumber ?? '') || body.preferredChannel === 'whatsapp' && !consent) {
      status.textContent = 'Autoriza WhatsApp y escribe un número con indicativo, o elige correo.'; button.disabled = false; return;
    }
    try { const response = await request(context, version, '/v1/me/communication-preferences', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response) return; const prefs = readBillingPreferences(await response.json());
      if (isCurrent(context, version)) { preferenceVersion = prefs.version; status.textContent = 'Preferencias guardadas.'; }
    } catch { if (isCurrent(context, version)) status.textContent = 'No pudimos guardar. Actualiza las preferencias antes de reintentar.'; }
    finally { if (isCurrent(context, version)) button.disabled = false; }
  });
  return { refresh, reset };
}
