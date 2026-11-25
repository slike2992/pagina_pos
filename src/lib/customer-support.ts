import { createIdempotencyKey } from "../scripts/client-idempotency";

export type SupportKind = "support" | "data_query" | "data_claim";
export type SupportContext = { accessToken: string; tenantId: string; principalId: string; session: object };
export type SupportReceipt = { caseId: string; tenantId: string; principalId: string; kind: SupportKind; receivedAt: string; firstResponseDueAt: string; initialDueAt: string | null; maximumDueAt: string | null; calendar: string; timeZone: "America/Bogota" };
export type SupportSummary = { receipt: SupportReceipt; version: number; status: "received" | "in_progress" | "resolved"; assignedTo: string | null; dueAt: string | null; extendedAt: string | null; firstResponseAt: string | null; resolvedAt: string | null };
export type SupportEvent = { eventId: string; type: "received" | "started" | "replied" | "extended" | "resolved"; occurredAt: string; actorPrincipalId: string; message: string | null; dueAt: string | null };
export type SupportDetail = SupportSummary & { content: string; events: SupportEvent[] };
const kinds: Record<SupportKind, string> = { support: "Soporte del servicio", data_query: "Consulta sobre mis datos", data_claim: "Reclamo sobre mis datos" };
const statuses: Record<SupportSummary["status"], string> = { received: "Recibida", in_progress: "En trámite", resolved: "Resuelta" };
const eventLabels: Record<SupportEvent["type"], string> = { received: "Recibida", started: "Trámite iniciado", replied: "Respuesta", extended: "Prórroga informada", resolved: "Resuelta" };
const invalid = () => new Error("No pudimos verificar tus solicitudes. Actualiza la consulta o utiliza los correos de contacto.");
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw invalid();
  return value as Record<string, unknown>;
};
const uuid = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
const date = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value));
const nullableDate = (value: unknown) => value === null || date(value);
const known = (object: object, value: unknown): value is string => typeof value === "string" && Object.hasOwn(object, value);

export function createSupportRequest(kind: unknown, content: unknown): { kind: SupportKind; content: string } {
  if (!known(kinds, kind) || typeof content !== "string" || content.trim().length < 8 || content.trim().length > 8000) {
    throw new Error("Selecciona el tipo y escribe una descripción de entre 8 y 8.000 caracteres.");
  }
  return { kind: kind as SupportKind, content: content.trim() };
}
export function readSupportReceipt(value: unknown, context: Pick<SupportContext, "tenantId" | "principalId">): SupportReceipt {
  const row = record(value);
  if (!uuid(row.caseId) || !uuid(row.tenantId) || !uuid(row.principalId)
    || row.tenantId.toLowerCase() !== context.tenantId.toLowerCase() || row.principalId.toLowerCase() !== context.principalId.toLowerCase()
    || !known(kinds, row.kind) || !date(row.receivedAt) || !date(row.firstResponseDueAt)
    || !nullableDate(row.initialDueAt) || !nullableDate(row.maximumDueAt)
    || typeof row.calendar !== "string" || !row.calendar.trim() || row.timeZone !== "America/Bogota") throw invalid();
  return { ...row } as SupportReceipt;
}
export function readSupportSummary(value: unknown, context: Pick<SupportContext, "tenantId" | "principalId">): SupportSummary {
  const row = record(value), receipt = readSupportReceipt(row.receipt, context);
  if (!Number.isSafeInteger(row.version) || Number(row.version) < 1 || !known(statuses, row.status)
    || !(row.assignedTo === null || uuid(row.assignedTo))
    || ![row.dueAt, row.extendedAt, row.firstResponseAt, row.resolvedAt].every(nullableDate)) throw invalid();
  return { ...row, receipt } as SupportSummary;
}
export function readSupportPage(value: unknown, context: Pick<SupportContext, "tenantId" | "principalId">) {
  const row = record(value);
  if (!Array.isArray(row.items) || row.items.length > 25 || !(row.nextBefore === null || uuid(row.nextBefore))) throw invalid();
  const items = row.items.map(value => readSupportSummary(value, context));
  if (new Set(items.map(item => item.receipt.caseId.toLowerCase())).size !== items.length
    || (row.nextBefore !== null && !items.length)) throw invalid();
  return { items, nextBefore: row.nextBefore as string | null };
}
export function readSupportDetail(value: unknown, context: Pick<SupportContext, "tenantId" | "principalId">, caseId: string): SupportDetail {
  const row = record(value), summary = readSupportSummary(row, context);
  if (summary.receipt.caseId.toLowerCase() !== caseId.toLowerCase() || typeof row.content !== "string" || !Array.isArray(row.events)) throw invalid();
  const events = row.events.map(value => {
    const event = record(value);
    if (!uuid(event.eventId) || !known(eventLabels, event.type) || !date(event.occurredAt) || !uuid(event.actorPrincipalId)
      || !(event.message === null || typeof event.message === "string") || !nullableDate(event.dueAt)) throw invalid();
    return { ...event } as SupportEvent;
  });
  return { ...summary, content: row.content, events };
}
export function supportDate(value: string | null): string {
  return value === null ? "No informado por el servidor" : new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota", dateStyle: "long", timeStyle: "short", hourCycle: "h23",
  }).format(new Date(value)) + " (Bogotá)";
}
export function renderSupportReceipt(container: HTMLElement, receipt: SupportReceipt) {
  const doc = container.ownerDocument, dl = doc.createElement("dl");
  const rows = [["Número de solicitud", receipt.caseId], ["Tipo", kinds[receipt.kind]],
    ["Recibida", supportDate(receipt.receivedAt)], ["Primera respuesta hasta", supportDate(receipt.firstResponseDueAt)],
    ["Plazo inicial", supportDate(receipt.initialDueAt)], ["Plazo máximo", supportDate(receipt.maximumDueAt)],
    ["Calendario del servidor", receipt.calendar]];
  for (const [label, value] of rows) {
    const row = doc.createElement("div"), dt = doc.createElement("dt"), dd = doc.createElement("dd");
    dt.textContent = label!; dd.textContent = value!; row.appendChild(dt); row.appendChild(dd); dl.appendChild(row);
  }
  container.replaceChildren(dl);
}
function errorMessage(code: unknown) {
  const messages: Record<string, string> = {
    legal_support_invalid_request: "Revisa el tipo y la descripción: deben tener entre 8 y 8.000 caracteres.",
    legal_support_unavailable: "El formulario no está disponible. Puedes escribir a los correos de soporte o legal indicados arriba y reintentar más tarde.",
    legal_support_forbidden: "No tienes permiso para consultar esta solicitud.",
    legal_support_not_found: "La solicitud no está disponible para esta cuenta y empresa.",
    legal_support_idempotency_conflict: "La solicitud anterior tenía otro contenido. Revisa la descripción antes de volver a enviarla.",
  };
  return typeof code === "string" && Object.hasOwn(messages, code) ? messages[code]! : "No pudimos completar la solicitud. Reintenta o utiliza los correos de contacto.";
}

export function bindCustomerSupport(root: HTMLElement, options: {
  apiUrl: string; getContext: () => SupportContext | null; onUnauthorized: () => void;
}) {
  const section = root.querySelector<HTMLElement>("[data-customer-support]")!;
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => section.querySelector<T>(selector)!;
  const form = get<HTMLFormElement>("[data-support-form]"), status = get("[data-support-status]");
  const fields = get<HTMLFieldSetElement>("[data-support-fields]");
  const refreshButton = get<HTMLButtonElement>("[data-support-refresh]"), more = get<HTMLButtonElement>("[data-support-more]");
  const detail = get("[data-support-detail]"), list = get("[data-support-list]");
  const kind = form.elements.namedItem("kind") as HTMLSelectElement, content = form.elements.namedItem("content") as HTMLTextAreaElement;
  let generation = 0, detailGeneration = 0, busy = false, ready = false, nextBefore: string | null = null;
  let summaries: SupportSummary[] = [], attempt: { body: string; key: string } | null = null;
  const current = (context: SupportContext, version: number) => {
    const now = options.getContext();
    return version === generation && now?.accessToken === context.accessToken && now.tenantId === context.tenantId
      && now.principalId === context.principalId && now.session === context.session;
  };
  const setBusy = (value: boolean) => {
    busy = value; fields.disabled = value || !ready; refreshButton.disabled = value; more.disabled = value;
    get<HTMLButtonElement>("[data-support-create]").disabled = fields.disabled;
    section.setAttribute("aria-busy", String(value));
  };
  const message = (value: string, error = false) => { status.textContent = value; status.dataset.state = error ? "error" : ""; };
  const closeDetail = () => { detailGeneration++; detail.hidden = true; get("[data-support-detail-content]").replaceChildren(); };
  const reset = () => {
    generation++; closeDetail(); ready = false; nextBefore = null; summaries = []; attempt = null;
    form.reset(); kind.value = ""; content.value = ""; list.replaceChildren();
    get("[data-support-created-receipt]").replaceChildren(); get("[data-support-created]").hidden = true;
    get("[data-support-empty]").hidden = true; more.hidden = true; message(""); setBusy(false); section.hidden = true;
  };
  const request = async (context: SupportContext, version: number, suffix: string, init: RequestInit = {}) => {
    const response = await fetch(`${options.apiUrl}/v1/me/legal-support/cases${suffix}`, { ...init,
      headers: { authorization: `Bearer ${context.accessToken}`, accept: "application/json", ...init.headers },
      credentials: "omit", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer" });
    if (!current(context, version)) return null;
    if (response.status === 401) { reset(); options.onUnauthorized(); return null; }
    const body: unknown = await response.json().catch(() => null);
    if (!current(context, version)) return null;
    if (!response.ok) throw new Error(errorMessage(body && typeof body === "object" && "code" in body ? body.code : response.status === 503 ? "legal_support_unavailable" : null));
    if (body === null) throw invalid();
    return body;
  };
  const renderDetail = (value: SupportDetail) => {
    const container = get("[data-support-detail-content]"), doc = container.ownerDocument;
    renderSupportReceipt(container, value.receipt);
    for (const text of [`Estado: ${statuses[value.status]}. Versión: ${value.version}.`, `Plazo vigente: ${supportDate(value.dueAt)}.`,
      `Prórroga registrada: ${supportDate(value.extendedAt)}.`, `Primera respuesta: ${supportDate(value.firstResponseAt)}.`, `Resuelta: ${supportDate(value.resolvedAt)}.`, value.content]) {
      const p = doc.createElement("p"); p.textContent = text; container.appendChild(p);
    }
    const heading = doc.createElement("h5"), events = doc.createElement("ol"); heading.textContent = "Seguimiento y respuestas";
    for (const event of value.events) {
      const item = doc.createElement("li");
      item.textContent = `${eventLabels[event.type]} · ${supportDate(event.occurredAt)}${event.message === null ? "" : "\n" + event.message}${event.dueAt === null ? "" : "\nPlazo informado: " + supportDate(event.dueAt)}`;
      events.appendChild(item);
    }
    container.appendChild(heading); container.appendChild(events); detail.hidden = false; detail.focus();
  };
  const openDetail = async (caseId: string) => {
    const context = options.getContext();
    if (busy || !context || !summaries.some(item => item.receipt.caseId === caseId)) return;
    closeDetail(); const detailVersion = detailGeneration, version = generation;
    setBusy(true); message("Consultando tu solicitud…");
    try {
      const body = await request(context, version, `/${encodeURIComponent(caseId)}`);
      if (body === null || !current(context, version) || detailVersion !== detailGeneration) return;
      renderDetail(readSupportDetail(body, context, caseId)); message("");
    } catch (error) {
      if (current(context, version) && detailVersion === detailGeneration) message(error instanceof Error ? error.message : invalid().message, true);
    } finally { if (current(context, version)) setBusy(false); }
  };
  const renderList = () => {
    const doc = list.ownerDocument;
    list.replaceChildren(...summaries.map(value => {
      const item = doc.createElement("li"), button = doc.createElement("button"), summary = doc.createElement("p");
      button.type = "button"; button.className = "button secondary";
      button.textContent = `${kinds[value.receipt.kind]} · ${value.receipt.caseId}`;
      button.addEventListener("click", () => { void openDetail(value.receipt.caseId); });
      summary.textContent = `${statuses[value.status]} · Recibida: ${supportDate(value.receipt.receivedAt)} · Primera respuesta hasta: ${supportDate(value.receipt.firstResponseDueAt)} · Plazo vigente: ${supportDate(value.dueAt)}`;
      item.appendChild(button); item.appendChild(summary); return item;
    }));
    get("[data-support-empty]").hidden = summaries.length !== 0; more.hidden = nextBefore === null;
  };
  const loadList = async (context: SupportContext, version: number, before: string | null) => {
    const body = await request(context, version, `?limit=25${before === null ? "" : "&before=" + encodeURIComponent(before)}`);
    if (body === null || !current(context, version)) return false;
    const page = readSupportPage(body, context);
    if (before !== null && page.nextBefore === before) throw invalid();
    const combined = before === null ? page.items : [...summaries, ...page.items];
    summaries = [...new Map(combined.map(item => [item.receipt.caseId, item])).values()];
    nextBefore = page.nextBefore; ready = true; renderList(); return true;
  };
  const load = async (before: string | null = null) => {
    const context = options.getContext(); if (busy || !context) return;
    const version = generation; section.hidden = false; setBusy(true); message("Consultando mis solicitudes…");
    try { if (await loadList(context, version, before)) message(""); }
    catch (error) { if (current(context, version)) message(error instanceof Error ? error.message : invalid().message, true); }
    finally { if (current(context, version)) setBusy(false); }
  };
  const refresh = () => { reset(); return load(); };
  form.addEventListener("submit", async event => {
    event.preventDefault(); const context = options.getContext();
    if (busy || !context || section.hidden || !ready || !form.reportValidity()) return;
    let body: string;
    try { body = JSON.stringify(createSupportRequest(kind.value, content.value)); }
    catch (error) { message(error instanceof Error ? error.message : invalid().message, true); return; }
    if (!attempt || attempt.body !== body) attempt = { body, key: createIdempotencyKey() };
    const version = generation; setBusy(true); closeDetail(); message("Enviando tu solicitud…");
    try {
      const value = await request(context, version, "", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": attempt.key }, body });
      if (value === null || !current(context, version)) return;
      const receipt = readSupportReceipt(value, context);
      if (receipt.kind !== JSON.parse(body).kind) throw invalid();
      renderSupportReceipt(get("[data-support-created-receipt]"), receipt); get("[data-support-created]").hidden = false;
      form.reset(); kind.value = ""; content.value = ""; attempt = null; message("Solicitud recibida. Conserva el número y los plazos del recibo.");
      try { await loadList(context, version, null); }
      catch { if (current(context, version)) message("Solicitud recibida. El recibo está disponible; actualiza la lista para consultar su seguimiento."); }
    } catch (error) {
      if (current(context, version)) message(error instanceof Error ? error.message : "No pudimos confirmar la recepción. Puedes reintentar el mismo contenido.", true);
    } finally { if (current(context, version)) setBusy(false); }
  });
  refreshButton.addEventListener("click", () => { if (!busy) void refresh(); });
  more.addEventListener("click", () => { if (!busy && nextBefore) void load(nextBefore); });
  get("[data-support-close]").addEventListener("click", closeDetail);
  reset();
  return { reset, refresh };
}
