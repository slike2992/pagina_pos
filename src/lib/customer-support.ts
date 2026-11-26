import { createIdempotencyKey } from "../scripts/client-idempotency";

export type SupportKind = "support" | "data_query" | "data_claim";
export type SupportContext = { accessToken: string; tenantId: string; principalId: string; session: object };
export type SupportReceipt = { caseId: string; tenantId: string; principalId: string; kind: SupportKind; receivedAt: string; firstResponseDueAt: string; initialDueAt: string | null; maximumDueAt: string | null; calendar: string; timeZone: "America/Bogota" };
export type SupportClaimCompletion = { state: "required" | "completed" | "closed_incomplete"; requiredAt: string; requirementDueAt: string; completionDeadlineExclusiveAt: string; completedAt: string | null; closedAt: string | null; initialDueAt: string | null; maximumDueAt: string | null };
export type SupportSummary = { claimCompletion?: SupportClaimCompletion; receipt: SupportReceipt; version: number; status: "received" | "in_progress" | "resolved"; assignedTo: string | null; dueAt: string | null; extendedAt: string | null; firstResponseAt: string | null; resolvedAt: string | null };
export type SupportNotificationProof = { type: "operator_declaration"; notificationAt: string; notificationEvidence: string; declaredByPrincipalId: string; declaredAt: string; closureNotBeforeAt: string };
export type SupportEvent = { notificationProof?: SupportNotificationProof; eventId: string; type: "received" | "started" | "replied" | "extended" | "resolved" | "completion_required" | "claim_completed" | "closed_incomplete" | "transferred" | "claim_annotated"; occurredAt: string; actorPrincipalId: string; message: string | null; dueAt: string | null };
export type SupportDetail = SupportSummary & { content: string; events: SupportEvent[] };
const kinds: Record<SupportKind, string> = { support: "Soporte del servicio", data_query: "Consulta sobre mis datos", data_claim: "Reclamo sobre mis datos" };
const statuses: Record<SupportSummary["status"], string> = { received: "Recibida", in_progress: "En trámite", resolved: "Resuelta" };
const eventLabels: Record<SupportEvent["type"], string> = { received: "Recibida", started: "Trámite iniciado", replied: "Respuesta", extended: "Prórroga informada", resolved: "Resuelta", completion_required: "Aclaración requerida", claim_completed: "Aclaración recibida", closed_incomplete: "Cierre por información incompleta", transferred: "Declaración de traslado registrada", claim_annotated: "Declaración de anotación registrada" };
class SupportError extends Error {}
const supportMessage = (error: unknown, fallback: string) => error instanceof SupportError ? error.message : fallback;
const invalid = () => new SupportError("No pudimos verificar tus solicitudes. Actualiza la consulta o utiliza los correos de contacto.");
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
    throw new SupportError("Selecciona el tipo y escribe una descripción de entre 8 y 8.000 caracteres.");
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
export function readClaimCompletion(value: unknown): SupportClaimCompletion | undefined {
  if (value === undefined) return undefined;
  const row = record(value);
  if (!["required", "completed", "closed_incomplete"].includes(row.state as string)
    || ![row.requiredAt, row.requirementDueAt, row.completionDeadlineExclusiveAt].every(date)
    || ![row.completedAt, row.closedAt, row.initialDueAt, row.maximumDueAt].every(nullableDate)) throw invalid();
  if (row.state === "completed"
    ? !date(row.completedAt) || row.closedAt !== null || !date(row.initialDueAt) || !date(row.maximumDueAt)
    : row.completedAt !== null || row.initialDueAt !== null || row.maximumDueAt !== null
      || (row.state === "required" ? row.closedAt !== null : !date(row.closedAt))) throw invalid();
  return { ...row } as SupportClaimCompletion;
}
export function createClaimCompletion(content: unknown, expectedVersion: number) {
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1) throw invalid();
  if (typeof content !== "string" || content.trim().length < 8 || content.trim().length > 8000) throw new SupportError("Escribe una aclaración de entre 8 y 8.000 caracteres.");
  return { content: content.trim(), expectedVersion };
}
const completionLabel = (summary: SupportSummary) => summary.claimCompletion?.state === "closed_incomplete"
  ? "Cerrado por información incompleta; sin decisión de fondo" : summary.claimCompletion?.state === "required"
    ? "Aclaración requerida" : summary.claimCompletion?.state === "completed" ? "Aclaración recibida" : "";
class SupportRequestError extends SupportError {
  constructor(readonly status: number, code: unknown) { super(errorMessage(code)); }
}

export function readSupportSummary(value: unknown, context: Pick<SupportContext, "tenantId" | "principalId">): SupportSummary {
  const row = record(value), receipt = readSupportReceipt(row.receipt, context);
  if (!Number.isSafeInteger(row.version) || Number(row.version) < 1 || !known(statuses, row.status)
    || !(row.assignedTo === null || uuid(row.assignedTo))
    || ![row.dueAt, row.extendedAt, row.firstResponseAt, row.resolvedAt].every(nullableDate)) throw invalid();
  const claimCompletion = readClaimCompletion(row.claimCompletion);
  if (claimCompletion && (receipt.kind !== "data_claim"
    || (claimCompletion.state === "required" && (row.status !== "in_progress" || row.dueAt !== null))
    || (claimCompletion.state === "closed_incomplete" && row.status !== "resolved"))) throw invalid();
  return { ...row, receipt, ...(claimCompletion ? { claimCompletion } : {}) } as SupportSummary;
}
export function readSupportPage(value: unknown, context: Pick<SupportContext, "tenantId" | "principalId">) {
  const row = record(value);
  if (!Array.isArray(row.items) || row.items.length > 25 || !(row.nextBefore === null || uuid(row.nextBefore))) throw invalid();
  const items = row.items.map(value => readSupportSummary(value, context));
  if (new Set(items.map(item => item.receipt.caseId.toLowerCase())).size !== items.length
    || (row.nextBefore !== null && !items.length)) throw invalid();
  return { items, nextBefore: row.nextBefore as string | null };
}
export function readNotificationProof(value: unknown): SupportNotificationProof | undefined {
  if (value === undefined) return undefined;
  const row = record(value);
  const utcDate = (value: unknown): value is string => date(value) && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(value);
  if (row.type !== "operator_declaration" || !uuid(row.declaredByPrincipalId)
    || !utcDate(row.notificationAt) || !utcDate(row.declaredAt) || !utcDate(row.closureNotBeforeAt)
    || typeof row.notificationEvidence !== "string" || row.notificationEvidence.trim().length < 8 || row.notificationEvidence.trim().length > 500
    || /[\r\n\u0000-\u001f\u007f]/.test(row.notificationEvidence)
    || /\bBearer\s+\S+|\b(?:password|contraseña|access[_-]?token|refresh[_-]?token|client[_-]?secret)\s*[:=]|https?:\/\/[^\s/]+@|https?:\/\/\S*[?#]/i.test(row.notificationEvidence)) throw invalid();
  return { type: "operator_declaration", notificationAt: row.notificationAt, notificationEvidence: row.notificationEvidence,
    declaredByPrincipalId: row.declaredByPrincipalId, declaredAt: row.declaredAt, closureNotBeforeAt: row.closureNotBeforeAt };
}

export function readSupportDetail(value: unknown, context: Pick<SupportContext, "tenantId" | "principalId">, caseId: string): SupportDetail {
  const row = record(value), summary = readSupportSummary(row, context);
  if (summary.receipt.caseId.toLowerCase() !== caseId.toLowerCase() || typeof row.content !== "string" || !Array.isArray(row.events)) throw invalid();
  const events = row.events.map(value => {
    const event = record(value);
    if (!uuid(event.eventId) || !known(eventLabels, event.type) || !date(event.occurredAt) || !uuid(event.actorPrincipalId)
      || !(event.message === null || typeof event.message === "string" && event.message.length <= 8000) || !nullableDate(event.dueAt)) throw invalid();
    const notificationProof = readNotificationProof(event.notificationProof);
    if (notificationProof && event.type !== "closed_incomplete") throw invalid();
    return { eventId: event.eventId, type: event.type, occurredAt: event.occurredAt,
      actorPrincipalId: event.actorPrincipalId, message: event.message, dueAt: event.dueAt,
      ...(notificationProof ? { notificationProof } : {}) } as SupportEvent;
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
    legal_support_version_conflict: "El reclamo cambió. Revisa su estado antes de volver a enviar la aclaración.",
    legal_support_completion_conflict: "El reclamo ya no admite esta aclaración. Consulta su estado actualizado.",
    legal_support_idempotency_conflict: "La solicitud anterior tenía otro contenido. Revisa la descripción antes de volver a enviarla.",
  };
  return typeof code === "string" && Object.hasOwn(messages, code) ? messages[code]! : "No pudimos completar la solicitud. Reintenta o utiliza los correos de contacto.";
}

export function bindCustomerSupport(root: HTMLElement, options: {
  apiUrl: string; getContext: () => SupportContext | null; onUnauthorized: () => void; requestedCaseId?: string;
}) {
  const section = root.querySelector<HTMLElement>("[data-customer-support]")!;
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => section.querySelector<T>(selector)!;
  const form = get<HTMLFormElement>("[data-support-form]"), status = get("[data-support-status]");
  const fields = get<HTMLFieldSetElement>("[data-support-fields]");
  const refreshButton = get<HTMLButtonElement>("[data-support-refresh]"), more = get<HTMLButtonElement>("[data-support-more]");
  const detail = get("[data-support-detail]"), list = get("[data-support-list]");
  const kind = form.elements.namedItem("kind") as HTMLSelectElement, content = form.elements.namedItem("content") as HTMLTextAreaElement;
  const completionForm = get<HTMLFormElement>("[data-support-completion-form]");
  const completionFields = get<HTMLFieldSetElement>("[data-support-completion-fields]");
  const completionContent = completionForm.elements.namedItem("content") as HTMLTextAreaElement;
  const completionSend = get<HTMLButtonElement>("[data-support-completion-send]");
  const detailRefresh = get<HTMLButtonElement>("[data-support-detail-refresh]");
  const completionStatus = get("[data-support-completion-status]");
  const drafts = new Map<string, { content: string; attempts: Map<string, string> }>();
  let selected: SupportDetail | null = null, selectedOwner: SupportContext | null = null, detailConfirmed = false;
  let generation = 0, detailGeneration = 0, busy = false, ready = false, nextBefore: string | null = null;
  let summaries: SupportSummary[] = [], attempt: { body: string; key: string } | null = null;
  let requestedCaseId = uuid(options.requestedCaseId) ? options.requestedCaseId.toLowerCase() : null;
  const current = (context: SupportContext, version: number) => {
    const now = options.getContext();
    return version === generation && now?.accessToken === context.accessToken && now.tenantId === context.tenantId
      && now.principalId === context.principalId && now.session === context.session;
  };
  const canComplete = () => Boolean(selected && selectedOwner && current(selectedOwner, generation) && detailConfirmed
    && selected.receipt.kind === "data_claim" && selected.status === "in_progress" && selected.claimCompletion?.state === "required");
  const completionControls = () => {
    const eligible = canComplete();
    completionFields.disabled = busy || !detailConfirmed;
    completionContent.readOnly = !eligible;
    completionSend.disabled = busy || !eligible;
    completionForm.hidden = !eligible && !completionContent.value;
    detailRefresh.disabled = busy || !selected;
  };
  const keepDraft = () => {
    if (!selected || !selectedOwner || !current(selectedOwner, generation)) return;
    const existing = drafts.get(selected.receipt.caseId);
    if (completionContent.value || existing) drafts.set(selected.receipt.caseId,
      { content: completionContent.value, attempts: existing?.attempts ?? new Map() });
  };
  const setBusy = (value: boolean) => {
    busy = value; fields.disabled = value || !ready; refreshButton.disabled = value; more.disabled = value;
    get<HTMLButtonElement>("[data-support-create]").disabled = fields.disabled;
    section.setAttribute("aria-busy", String(value));
    completionControls();
  };
  const message = (value: string, error = false) => { status.textContent = value; status.dataset.state = error ? "error" : ""; };
  const closeDetail = (preserve = true) => {
    if (preserve) keepDraft();
    detailGeneration++; selected = null; selectedOwner = null; detailConfirmed = false;
    completionForm.reset(); completionContent.value = ""; completionStatus.textContent = "";
    completionForm.hidden = true; completionFields.disabled = true; completionSend.disabled = true; detailRefresh.disabled = true;
    detail.hidden = true; get("[data-support-detail-content]").replaceChildren();
  };
  const reset = () => {
    closeDetail(false); generation++; drafts.clear(); ready = false; nextBefore = null; summaries = []; attempt = null;
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
    const body: unknown = await response.json().catch(error => { if (response.ok) throw error; return null; });
    if (!current(context, version)) return null;
    if (!response.ok) throw new SupportRequestError(response.status, body && typeof body === "object" && "code" in body ? body.code : response.status === 503 ? "legal_support_unavailable" : null);
    if (body === null) throw invalid();
    return body;
  };
  const renderDetail = (value: SupportDetail) => {
    selected = value; detailConfirmed = true;
    const container = get("[data-support-detail-content]"), doc = container.ownerDocument;
    renderSupportReceipt(container, value.receipt);
    for (const text of [`Estado: ${statuses[value.status]}. Versión: ${value.version}.`, `Plazo vigente: ${supportDate(value.dueAt)}.`,
      `Prórroga registrada: ${supportDate(value.extendedAt)}.`, `Primera respuesta: ${supportDate(value.firstResponseAt)}.`, `Resuelta: ${supportDate(value.resolvedAt)}.`, "Descripción original (se conserva sin reemplazarla):", value.content]) {
      const p = doc.createElement("p"); p.textContent = text; container.appendChild(p);
    }
    if (value.claimCompletion) {
      const completion = value.claimCompletion;
      const lines = [completionLabel(value),
        "El registro, recibo y texto originales se conservan; la aclaración se añade al historial.",
        "Requerimiento registrado: " + supportDate(completion.requiredAt) + ".",
        "Límite para registrar el requerimiento: " + supportDate(completion.requirementDueAt) + ".",
        "El plazo para aportar lo solicitado es de dos meses de calendario desde la notificación del requerimiento. Registrar el requerimiento no prueba su notificación ni fija por sí solo la fecha definitiva para responder."];
      if (completion.state === "required") lines.push("Mientras no haya cierre administrativo, puedes aportar la aclaración incluso de forma tardía. Consulta el motivo y lo solicitado en el historial.");
      if (completion.state === "completed") lines.push("Aclaración recibida: " + supportDate(completion.completedAt) + ".", "Plazo inicial efectivo: " + supportDate(completion.initialDueAt) + ".", "Plazo máximo efectivo: " + supportDate(completion.maximumDueAt) + ". No se calculan ni reinician plazos en el navegador.");
      if (completion.state === "closed_incomplete") lines.push("Cierre registrado: " + supportDate(completion.closedAt) + ". Este cierre no resuelve de fondo ni borra datos. Puedes abrir un nuevo reclamo desde Nueva solicitud.");
      for (const line of lines) { const p = doc.createElement("p"); p.textContent = line; container.appendChild(p); }
    }
    const heading = doc.createElement("h5"), events = doc.createElement("ol"); heading.textContent = "Seguimiento y respuestas";
    for (const event of value.events) {
      const item = doc.createElement("li");
      item.textContent = `${eventLabels[event.type]} · ${supportDate(event.occurredAt)}${event.message === null ? "" : "\n" + event.message}${event.dueAt === null || event.type === "completion_required" ? "" : "\nPlazo informado: " + supportDate(event.dueAt)}`;
      if (event.notificationProof) {
        const proof = event.notificationProof;
        for (const line of ["Notificación declarada por operador",
          "Fecha de notificación declarada: " + supportDate(proof.notificationAt),
          "Referencia declarada: " + proof.notificationEvidence,
          "Declaración registrada: " + supportDate(proof.declaredAt),
          "Cierre no antes de (según servidor): " + supportDate(proof.closureNotBeforeAt)]) {
          const p = doc.createElement("p"); p.textContent = line; item.appendChild(p);
        }
      }
      events.appendChild(item);
    }
    container.appendChild(heading); container.appendChild(events);
    completionContent.value = drafts.get(value.receipt.caseId)?.content ?? ""; completionControls();
    detail.hidden = false; detail.focus();
  };
  const readSelected = async (context: SupportContext, version: number, caseId: string, view: number, minimumVersion = 1) => {
    const body = await request(context, version, `/${encodeURIComponent(caseId)}`);
    if (body === null || !current(context, version) || view !== detailGeneration) return false;
    const next = readSupportDetail(body, context, caseId);
    if (next.version < minimumVersion) throw invalid();
    selectedOwner = context; renderDetail(next);
    summaries = summaries.map(value => value.receipt.caseId === caseId ? next : value); renderList();
    return true;
  };
  const openDetail = async (caseId: string, fromLink = false) => {
    const context = options.getContext();
    if (busy || !context || !uuid(caseId) || (!fromLink && !summaries.some(item => item.receipt.caseId === caseId))) return false;
    closeDetail(); const detailVersion = detailGeneration, version = generation;
    setBusy(true); message("Consultando tu solicitud…");
    try { if (await readSelected(context, version, caseId, detailVersion)) { message(""); return true; } }
    catch (error) {
      if (current(context, version) && detailVersion === detailGeneration) message(supportMessage(error, "No pudimos consultar esta solicitud. Revisa tu conexión o utiliza los correos de contacto."), true);
    } finally { if (current(context, version)) setBusy(false); }
    return false;
  };
  const renderList = () => {
    const doc = list.ownerDocument;
    list.replaceChildren(...summaries.map(value => {
      const item = doc.createElement("li"), button = doc.createElement("button"), summary = doc.createElement("p");
      button.type = "button"; button.className = "button secondary";
      button.textContent = `${kinds[value.receipt.kind]} · ${value.receipt.caseId}`;
      button.addEventListener("click", () => { void openDetail(value.receipt.caseId); });
      summary.textContent = `${completionLabel(value) || statuses[value.status]} · Recibida: ${supportDate(value.receipt.receivedAt)} · Primera respuesta hasta: ${supportDate(value.receipt.firstResponseDueAt)} · Plazo vigente: ${supportDate(value.dueAt)}`;
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
    catch (error) { if (current(context, version)) message(supportMessage(error, "No pudimos consultar tus solicitudes. Revisa tu conexión o utiliza los correos de contacto."), true); }
    finally { if (current(context, version)) setBusy(false); }
  };
  const refresh = async () => {
    reset(); const context = options.getContext(), version = generation;
    await load();
    if (context && current(context, version) && ready && requestedCaseId
      && await openDetail(requestedCaseId, true) && current(context, version)) requestedCaseId = null;
  };
  form.addEventListener("submit", async event => {
    event.preventDefault(); const context = options.getContext();
    if (busy || !context || section.hidden || !ready || !form.reportValidity()) return;
    let body: string;
    try { body = JSON.stringify(createSupportRequest(kind.value, content.value)); }
    catch (error) { message(supportMessage(error, invalid().message), true); return; }
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
      if (current(context, version)) message(supportMessage(error, "No pudimos confirmar la recepción. Revisa tu conexión; conservamos tu texto para reintentar el mismo contenido."), true);
    } finally { if (current(context, version)) setBusy(false); }
  });
  completionForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (busy || !selected || !selectedOwner || detail.hidden || !canComplete() || !completionForm.reportValidity()) return;
    const reviewed = selected, context = selectedOwner, version = generation, view = detailGeneration;
    let body: string;
    try { body = JSON.stringify(createClaimCompletion(completionContent.value, reviewed.version)); }
    catch (error) { completionStatus.textContent = supportMessage(error, invalid().message); return; }
    keepDraft();
    const draft = drafts.get(reviewed.receipt.caseId)!;
    if (!draft.attempts.has(body)) draft.attempts.set(body, createIdempotencyKey());
    const isCurrentView = () => current(context, version) && view === detailGeneration;
    setBusy(true); completionStatus.textContent = "Enviando tu aclaración…";
    try {
      const result = await request(context, version, `/${encodeURIComponent(reviewed.receipt.caseId)}/completion`, {
        method: "POST", headers: { "content-type": "application/json", "idempotency-key": draft.attempts.get(body)! }, body,
      });
      if (result === null || !isCurrentView()) return;
      const next = readSupportSummary(result, context);
      if (next.receipt.caseId !== reviewed.receipt.caseId || next.claimCompletion?.state !== "completed"
        || next.version <= reviewed.version || next.claimCompletion.requiredAt !== reviewed.claimCompletion!.requiredAt
        || next.claimCompletion.completionDeadlineExclusiveAt !== reviewed.claimCompletion!.completionDeadlineExclusiveAt) throw invalid();
      drafts.delete(reviewed.receipt.caseId);
      renderDetail({ ...reviewed, ...next });
      summaries = summaries.map(value => value.receipt.caseId === next.receipt.caseId ? next : value); renderList();
      completionStatus.textContent = "Aclaración registrada. Los plazos son los confirmados por el servidor.";
      try { await readSelected(context, version, next.receipt.caseId, view, next.version); }
      catch { if (isCurrentView()) completionStatus.textContent = "Aclaración registrada. Actualiza este reclamo para consultar el historial más reciente."; }
    } catch (error) {
      if (!isCurrentView()) return;
      if (error instanceof SupportRequestError && error.status === 409) {
        detailConfirmed = false; completionControls();
        try {
          if (await readSelected(context, version, reviewed.receipt.caseId, view, reviewed.version)) {
            completionStatus.textContent = canComplete()
              ? "El reclamo cambió. Conservamos tu borrador; revisa el historial y los plazos antes de volver a enviarlo."
              : "El reclamo cambió y no admite otra aclaración. Conservamos tu texto para que puedas copiarlo.";
          }
        } catch {
          if (isCurrentView()) completionStatus.textContent = "No pudimos actualizar el reclamo tras el conflicto. Conservamos tu borrador; actualiza este reclamo antes de reintentar.";
        }
      } else completionStatus.textContent = supportMessage(error, "No pudimos confirmar la aclaración. Revisa tu conexión; conservamos tu texto para reintentar el mismo contenido.");
    } finally { if (current(context, version)) setBusy(false); }
  });
  detailRefresh.addEventListener("click", async () => {
    if (busy || !selected || !selectedOwner || !current(selectedOwner, generation) || detail.hidden) return;
    keepDraft(); const context = selectedOwner, version = generation, view = detailGeneration, caseId = selected.receipt.caseId;
    detailConfirmed = false; setBusy(true); completionStatus.textContent = "Actualizando este reclamo…";
    try { if (await readSelected(context, version, caseId, view)) completionStatus.textContent = "Estado actualizado. Revisa el historial y los plazos antes de enviar."; }
    catch (error) { if (current(context, version) && view === detailGeneration) completionStatus.textContent = supportMessage(error, "No pudimos actualizar esta solicitud. Revisa tu conexión o utiliza los correos de contacto."); }
    finally { if (current(context, version)) setBusy(false); }
  });
  refreshButton.addEventListener("click", () => { if (!busy) void refresh(); });
  more.addEventListener("click", () => { if (!busy && nextBefore) void load(nextBefore); });
  get("[data-support-close]").addEventListener("click", () => closeDetail());
  reset();
  return { reset, refresh };
}
