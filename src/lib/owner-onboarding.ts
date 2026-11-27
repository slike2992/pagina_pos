export type OnboardingProof = { token: string; signupIntentId?: string };
export type OnboardingTiming = { serverTime: string; resendAvailableAt: string; retryAfterSeconds: number };
export type OnboardingState = { status: "provisioning" | "setup_required" | "existing_access" | "failed";
  serverTime: string; pollAfterSeconds: number; passwordEmail?: OnboardingTiming };
const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const iso = (value: unknown): value is string => typeof value === "string"
  && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value));
export function readOnboardingTiming(input: unknown): OnboardingTiming {
  const value = record(input);
  if (!value || !iso(value.serverTime) || !iso(value.resendAvailableAt)
    || typeof value.retryAfterSeconds !== "number" || !Number.isSafeInteger(value.retryAfterSeconds)
    || value.retryAfterSeconds < 0 || value.retryAfterSeconds > 900) throw new Error("Invalid onboarding timing");
  return { serverTime: value.serverTime, resendAvailableAt: value.resendAvailableAt, retryAfterSeconds: value.retryAfterSeconds };
}
export function readOnboardingState(input: unknown): OnboardingState {
  const value = record(input);
  if (!value || !["provisioning","setup_required","existing_access","failed"].includes(String(value.status))
    || !iso(value.serverTime) || !Number.isInteger(value.pollAfterSeconds)
    || Number(value.pollAfterSeconds) < 0 || Number(value.pollAfterSeconds) > 30
    || (value.status === "provisioning" && Number(value.pollAfterSeconds) < 1)) throw new Error("Invalid onboarding state");
  return { status: value.status as OnboardingState["status"], serverTime: value.serverTime,
    pollAfterSeconds: value.pollAfterSeconds as number,
    ...(value.status === "setup_required" ? { passwordEmail: readOnboardingTiming(value.passwordEmail) } : {}) };
}
// Relative to the response's server clock, not the computer's wall clock/zone.
export function onboardingWait(timing: OnboardingTiming): number {
  return Math.max(timing.retryAfterSeconds * 1000, Date.parse(timing.resendAvailableAt) - Date.parse(timing.serverTime), 0);
}

/** The credential stays in this page's memory; never URL/storage/status output. */
export function showOwnerOnboarding(root: HTMLElement, apiUrl: string, proof: OnboardingProof,
  onState?: (state: OnboardingState) => void, mode: "verification" | "password_form" = "verification") {
  const heading = document.createElement("h2"), message = document.createElement("p"), status = document.createElement("p");
  const actions = document.createElement("div"), retry = document.createElement("button"), resend = document.createElement("button"), account = document.createElement("a");
  const countdown = document.createElement("p");
  heading.textContent = "Correo confirmado";
  message.textContent = "Consultando la preparación de tu empresa…";
  actions.className = "actions";
  retry.type = resend.type = "button"; retry.className = resend.className = "button secondary";
  retry.textContent = "Actualizar estado"; resend.textContent = "Reenviar configuración de contraseña"; resend.hidden = true;
  account.href = "/cuenta"; account.className = "button"; account.textContent = "Ir a Mi cuenta"; account.hidden = true;
  status.className = countdown.className = "status"; status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
  countdown.setAttribute("role", "timer"); countdown.setAttribute("aria-live", "off");
  actions.append(retry, resend, account); root.replaceChildren(heading, message, actions, countdown, status);
  let disposed = false, reading = false, sending = false, state: OnboardingState | null = null;
  let nextAt = 0, polls = 0, timer: number | undefined, key: string | null = null;
  const controller = new AbortController();
  const tick = () => {
    if (disposed) return;
    const seconds = Math.max(0, Math.ceil((nextAt - Date.now()) / 1000));
    resend.disabled = sending || seconds > 0;
    countdown.textContent = !resend.hidden && seconds > 0 ? `Podrás solicitar otro correo en ${seconds} segundos.` : "";
  };
  const applyTiming = (timing: OnboardingTiming) => { nextAt = Date.now() + onboardingWait(timing); tick(); };
  const refresh = async () => {
    if (disposed || reading || sending) return;
    if (timer !== undefined) window.clearTimeout(timer);
    reading = true; retry.disabled = true;
    try {
      const response = await fetch(`${apiUrl}/v1/owner-onboarding/status`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(proof), cache: "no-store", signal: controller.signal
      });
      const body: unknown = await response.json();
      if (disposed) return;
      if (!response.ok) {
        if (response.status === 400) {
          // Password reset is an explicit, separate flow. Its token need not
          // be an initial owner/signup credential; the canonical form decides.
          if (mode === "password_form") { root.hidden = true; return; }
          status.textContent = "El enlace ya no permite consultar este registro. Si ya tienes contraseña, entra a Mi cuenta; si aún no la creaste, contacta a servicioalcliente@cripton.com.co.";
          status.dataset.state = "error"; resend.hidden = true; account.hidden = false;
          return;
        }
        throw new Error("Unavailable");
      }
      state = readOnboardingState(body);
      onState?.(state);
      status.textContent = ""; status.dataset.state = "";
      resend.hidden = state.status !== "setup_required"; account.hidden = state.status !== "existing_access";
      if (state.status === "provisioning") {
        heading.textContent = "Paso 2: preparando tu POS";
        message.textContent = "Tu correo está confirmado. Espera mientras preparamos tu empresa. Los 15 días comienzan cuando esté lista. No necesitas volver a registrarte ni pagar para activar la prueba.";
        if (++polls < 100) timer = window.setTimeout(() => { void refresh(); }, state.pollAfterSeconds * 1000);
        else status.textContent = "La preparación está tardando. Puedes actualizar el estado o contactar a servicioalcliente@cripton.com.co.";
      } else if (state.status === "setup_required") {
        heading.textContent = "Paso 3: crea tu contraseña";
        message.textContent = mode === "password_form"
          ? "Tu empresa está lista. Completa el formulario para crear tu contraseña inicial. Este paso es distinto de verificar el correo. Puedes solicitar otro enlace de configuración si lo necesitas."
          : "Tu empresa está lista. Revisa el correo de configuración de contraseña: es diferente del correo de verificación. Abre su enlace para crear tu acceso. Revisa también spam; si no llega, solicita de nuevo ese correo aquí.";
        applyTiming(state.passwordEmail!);
      } else if (state.status === "existing_access") {
        heading.textContent = "Tu acceso está listo";
        message.textContent = "Ya tienes contraseña. Entra a Mi cuenta con tu acceso habitual; este registro no cambia tu contraseña.";
      } else {
        heading.textContent = "Preparación pendiente";
        message.textContent = "No pudimos completar la preparación de tu empresa. Puedes actualizar el estado o contactar a servicioalcliente@cripton.com.co. No crees otro registro.";
        status.dataset.state = "error";
      }
    } catch {
      if (!disposed) {
        status.textContent = "No pudimos consultar la preparación. Revisa tu conexión y usa Actualizar estado para reintentar.";
        status.dataset.state = "error";
      }
    } finally { reading = false; if (!disposed) retry.disabled = false; }
  };
  retry.addEventListener("click", () => { polls = 0; void refresh(); });
  resend.addEventListener("click", async () => {
    if (disposed || sending || reading || state?.status !== "setup_required" || nextAt > Date.now()) return;
    sending = true; tick(); status.textContent = "Solicitando el correo de configuración inicial…";
    key ??= `owner-setup:${crypto.randomUUID()}`;
    try {
      const response = await fetch(`${apiUrl}/v1/owner-onboarding/resend-password-setup`, { method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": key },
        body: JSON.stringify(proof), cache: "no-store", signal: controller.signal });
      const body = record(await response.json());
      if (disposed) return;
      if (response.status === 429) {
        try { applyTiming(readOnboardingTiming(body?.error)); }
        catch {
          const retryAfter = response.headers.get("Retry-After");
          const seconds = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) : 60;
          nextAt = Date.now() + Math.min(900, Math.max(1, seconds)) * 1000;
          tick();
        }
        status.textContent = "Espera el tiempo indicado antes de solicitar otro correo.";
      } else {
        if (response.status !== 202 || body?.status !== "accepted") throw new Error("Unavailable");
        applyTiming(readOnboardingTiming(body)); key = null;
        status.textContent = "Solicitamos el correo de configuración inicial. Revisa tu bandeja y spam. La solicitud no confirma su recepción.";
      }
      status.dataset.state = response.status === 429 ? "error" : "success";
    } catch {
      if (!disposed) { status.textContent = "No pudimos confirmar el reenvío. Revisa tu conexión y reintenta; no cambies tu contraseña por este error."; status.dataset.state = "error"; }
    } finally { sending = false; tick(); }
  });
  const interval = window.setInterval(tick, 1000);
  const dispose = () => { disposed = true; controller.abort(); window.clearInterval(interval); if (timer !== undefined) window.clearTimeout(timer); };
  window.addEventListener("pagehide", dispose, { once: true });
  void refresh();
  return { refresh, dispose };
}
