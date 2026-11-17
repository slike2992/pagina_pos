export type PendingSignup = { id: string; email: string; expiry: string; resendAt: string };
const storageKey = "signup-verification";
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const isoTime = (value: unknown): value is string => typeof value === "string"
  && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value)
  && Number.isFinite(Date.parse(value));
const record = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;

export function clearPendingSignup(id?: string): void {
  try {
    if (id && JSON.parse(sessionStorage.getItem(storageKey) ?? "null")?.id !== id) return;
    sessionStorage.removeItem(storageKey);
  } catch { /* Storage is optional. */ }
}

export function savePendingSignup(pending: PendingSignup): void {
  try {
    // Explicit allowlist: never persist a token, URL, company, form or response body.
    const { id, email, expiry, resendAt } = pending;
    sessionStorage.setItem(storageKey, JSON.stringify({ id, email, expiry, resendAt }));
    for (const legacy of ["signup-draft", "signup-accepted-at", "signup-key", "signup-intent-id"]) sessionStorage.removeItem(legacy);
  } catch { /* The current screen and resend still work without storage. */ }
}

export function readPendingSignup(): PendingSignup | null {
  try {
    const value = record(JSON.parse(sessionStorage.getItem(storageKey) ?? "null"));
    if (value && typeof value.id === "string" && uuid.test(value.id)
      && typeof value.email === "string" && value.email.length <= 320 && /^[^\s@<>]+@[^\s@<>]+$/.test(value.email)
      && isoTime(value.expiry) && isoTime(value.resendAt)) {
      return { id: value.id, email: value.email, expiry: value.expiry, resendAt: value.resendAt };
    }
    // Upgrade an existing browser receipt without sending or recreating a signup.
    const id = sessionStorage.getItem("signup-intent-id");
    const draft = record(JSON.parse(sessionStorage.getItem("signup-draft") ?? "null"));
    const acceptedAt = sessionStorage.getItem("signup-accepted-at");
    if (id && uuid.test(id) && typeof draft?.email === "string" && draft.email.length <= 320
      && /^[^\s@<>]+@[^\s@<>]+$/.test(draft.email) && isoTime(acceptedAt)) {
      const pending = { id, email: draft.email, expiry: new Date(Date.parse(acceptedAt) + 86_400_000).toISOString(),
        resendAt: new Date(Date.now() + 60_000).toISOString() };
      savePendingSignup(pending);
      return pending;
    }
    clearPendingSignup();
  } catch { clearPendingSignup(); }
  return null;
}

// Use both server hints conservatively. Client time never overrides a later wait.
export function verificationResendAt(value: unknown, now = Date.now()): string | null {
  const timing = record(value);
  if (!timing || !isoTime(timing.resendAvailableAt) || typeof timing.retryAfterSeconds !== "number"
    || !Number.isSafeInteger(timing.retryAfterSeconds) || timing.retryAfterSeconds < 0
    || !Number.isFinite(now + timing.retryAfterSeconds * 1000)
    || now + timing.retryAfterSeconds * 1000 > 8.64e15) return null;
  return new Date(Math.max(Date.parse(timing.resendAvailableAt), now + timing.retryAfterSeconds * 1000)).toISOString();
}

export function createdPendingSignup(value: unknown): PendingSignup {
  const body = record(value);
  if (!body || typeof body.signupIntentId !== "string" || !uuid.test(body.signupIntentId)
    || body.status !== "email_pending" || body.nextAction !== "verify_email"
    || typeof body.email !== "string" || body.email.length > 320 || !/^[^\s@<>]+@[^\s@<>]+$/.test(body.email)
    || !isoTime(body.expiresAt)) throw new Error("Invalid signup response");
  const resendAt = body.verificationEmail === undefined
    ? new Date(Date.now() + 60_000).toISOString() : verificationResendAt(body.verificationEmail);
  if (!resendAt) throw new Error("Invalid verification timing");
  return { id: body.signupIntentId, email: body.email, expiry: body.expiresAt, resendAt };
}

export function showVerificationInbox(form: HTMLFormElement, apiUrl: string, pending: PendingSignup,
  developmentVerificationUrl?: string, moveFocus = true): void {
  const result = document.createElement("div");
  result.className = "result";
  result.style.gridColumn = "1 / -1";
  result.setAttribute("aria-labelledby", "verification-inbox-heading");
  const heading = document.createElement("h2");
  heading.id = "verification-inbox-heading";
  heading.tabIndex = -1;
  heading.textContent = "Revisa tu bandeja";
  const message = document.createElement("p");
  message.append("Solicitamos el enlace de verificación para ");
  const email = document.createElement("strong");
  email.textContent = pending.email;
  email.style.overflowWrap = "anywhere";
  message.append(email, ". Revisa también spam y correo no deseado. Continúa el registro desde el enlace del correo.");
  const help = document.createElement("p");
  help.textContent = "Si no lo encuentras, solicita otro enlace después de un minuto. No necesitas volver a crear la cuenta.";
  const actions = document.createElement("div");
  actions.className = "actions";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button secondary";
  button.textContent = "Reenviar correo";
  button.setAttribute("aria-describedby", "verification-resend-countdown verification-resend-status");
  const countdown = document.createElement("p");
  countdown.id = "verification-resend-countdown";
  countdown.className = "status";
  // Do not announce each second; the separate live region announces state changes.
  countdown.setAttribute("role", "timer");
  countdown.setAttribute("aria-live", "off");
  const status = document.createElement("p");
  status.id = "verification-resend-status";
  status.className = "status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.setAttribute("aria-atomic", "true");
  actions.append(button);
  result.append(heading, message, help, actions, countdown, status);
  let local = false;
  if (developmentVerificationUrl) {
    try {
      const url = new URL(developmentVerificationUrl);
      if (url.origin === location.origin && url.pathname === "/registro/verificar") {
        local = true;
        heading.textContent = "Registro creado · Modo local";
        help.textContent = "Continúa con la verificación local para probar el recorrido completo.";
        const link = document.createElement("a");
        link.className = "button";
        link.href = url.href;
        link.textContent = "Continuar verificación";
        actions.append(link);
      }
    } catch { /* Never render an untrusted verification URL. */ }
  }
  form.replaceChildren(result);
  if (moveFocus) heading.focus();
  let busy = false, disposed = false, readyAnnounced = false;
  // Stable across network failures and reloads, without storing another field.
  const keyFor = () => `verification:${pending.id}:${Date.parse(pending.resendAt)}`;
  let key = keyFor();
  const setStatus = (text: string, state = "") => { status.textContent = text; status.dataset.state = state; };
  const remaining = () => Math.max(0, Math.ceil((Date.parse(pending.resendAt) - Date.now()) / 1000));
  const expired = () => Date.parse(pending.expiry) <= Date.now();
  const tick = () => {
    if (disposed) return;
    button.disabled = local || busy || expired() || remaining() > 0;
    if (expired()) {
      countdown.textContent = "Este registro venció. Vuelve al registro para iniciar una solicitud nueva.";
      if (!busy) setStatus("El reenvío ya no está disponible para este registro.", "error");
    } else if (local) countdown.textContent = "Verificación local disponible.";
    else if (remaining() > 0) {
      const seconds = remaining();
      countdown.textContent = `Podrás reenviar en ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}.`;
      readyAnnounced = false;
    } else {
      countdown.textContent = "Ya puedes solicitar otro correo.";
      if (!busy && !readyAnnounced && status.dataset.state !== "error") {
        setStatus("Puedes reenviar el correo cuando lo necesites.");
        readyAnnounced = true;
      }
    }
  };
  const retry = document.createElement("a");
  retry.href = "/registro";
  retry.textContent = "Volver al registro cuando venza esta solicitud";
  retry.hidden = !expired();
  retry.addEventListener("click", (event) => {
    if (!expired() || busy) { event.preventDefault(); return; }
    clearPendingSignup();
  });
  const correct = document.createElement("a");
  correct.href = "/registro";
  correct.textContent = "Corregir correo o iniciar otro registro";
  correct.addEventListener("click", () => { clearPendingSignup(); });
  result.append(correct, retry);
  const update = () => { tick(); retry.hidden = !expired(); };
  update();
  const timer = window.setInterval(update, 1000);
  window.addEventListener("pagehide", () => { disposed = true; window.clearInterval(timer); }, { once: true });
  button.addEventListener("click", async () => {
    if (disposed || local || busy || expired() || remaining() > 0) return;
    busy = true;
    button.textContent = "Solicitando reenvío…";
    button.setAttribute("aria-busy", "true");
    setStatus("Solicitando otro enlace de verificación…");
    tick();
    try {
      const response = await fetch(`${apiUrl}/v1/signup-intents/${encodeURIComponent(pending.id)}/resend-verification`, {
        method: "POST", headers: { "content-type": "application/json", "idempotency-key": key },
        body: JSON.stringify({ email: pending.email })
      });
      const body = await response.json();
      if (disposed) return;
      if (response.status === 429) {
        const serverAt = verificationResendAt(body.error);
        const header = response.headers.get("Retry-After");
        const headerSeconds = header && /^\d+$/.test(header) ? Number(header) : 0;
        const headerAt = headerSeconds > 0 && Number.isSafeInteger(headerSeconds) && Date.now() + headerSeconds * 1000 <= 8.64e15
          ? Date.now() + headerSeconds * 1000 : (header ? Date.parse(header) : 0);
        const waitUntil = Math.max(serverAt ? Date.parse(serverAt) : 0, Number.isFinite(headerAt) ? headerAt : 0);
        pending.resendAt = new Date(waitUntil > Date.now() ? waitUntil : Date.now() + 60_000).toISOString();
        savePendingSignup(pending);
        setStatus("Espera el tiempo indicado antes de volver a solicitar el correo.", "error");
      } else {
        const nextAt = verificationResendAt(body);
        if (response.status !== 202 || body?.status !== "accepted" || !nextAt) {
          const apiMessage = typeof body?.error?.message === "string" ? body.error.message : "No pudimos confirmar el reenvío. Puedes reintentar.";
          throw new Error(apiMessage);
        }
        pending.resendAt = nextAt;
        savePendingSignup(pending);
        key = keyFor();
        setStatus("Solicitamos de nuevo el correo. Revisa tu bandeja y spam.", "success");
      }
    } catch (error) {
      if (!disposed) setStatus(error instanceof Error && error.message !== "Failed to fetch"
        ? `No pudimos confirmar el reenvío. ${error.message}`
        : "No pudimos confirmar el reenvío. Revisa tu conexión y reintenta.", "error");
    } finally {
      busy = false;
      if (!disposed) {
        button.textContent = "Reenviar correo";
        button.removeAttribute("aria-busy");
        update();
      }
    }
  });
}
