export type TrialPayment = Readonly<{
  checkoutSessionId: string; reference: string;
  status: "pending" | "approved" | "declined" | "expired" | "cancelled" | "fulfilled" | "refunded";
  expiresAt: string;
}>;
export type SubscriptionTrial = Readonly<{
  status: "provisioning" | "active" | "expired" | "converted";
  durationDays: 15;
  startsAt: string | null;
  endsAt: string | null;
  convertedAt: string | null;
  canConvert: boolean;
  payment?: TrialPayment | null;
}>;
const invalid = () => new Error("No pudimos verificar la prueba de tu suscripción. Actualiza Mi cuenta antes de continuar.");
const date = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(v) && Number.isFinite(Date.parse(v));
const uuid = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);

// Absence/null preserves paid customers. The server owns eligibility and dates;
// the browser never starts or extends a trial and never creates a paid period.
export function readSubscriptionTrial(value: unknown): SubscriptionTrial | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) throw invalid();
  const row = value as Record<string, unknown>;
  if (!["provisioning", "active", "expired", "converted"].includes(row.status as string)
    || row.durationDays !== 15 || typeof row.canConvert !== "boolean"
    || ![row.startsAt, row.endsAt, row.convertedAt].every(v => v === null || date(v))) throw invalid();
  if ((row.startsAt === null) !== (row.endsAt === null)
    || (row.startsAt !== null && Date.parse(row.endsAt as string) - Date.parse(row.startsAt as string) !== 15 * 24 * 60 * 60 * 1000)
    || (row.status === "provisioning" && (row.startsAt !== null || row.convertedAt !== null || row.canConvert))
    || (["active", "expired", "converted"].includes(row.status as string) && row.startsAt === null)
    || (row.status === "converted" ? row.convertedAt === null || row.canConvert : row.convertedAt !== null)) throw invalid();
  let payment: TrialPayment | null | undefined;
  if (row.payment === null) payment = null;
  else if (row.payment !== undefined) {
    if (!row.payment || typeof row.payment !== "object" || Array.isArray(row.payment)) throw invalid();
    const value = row.payment as Record<string, unknown>;
    if (!uuid(value.checkoutSessionId) || typeof value.reference !== "string" || !value.reference.trim()
      || value.reference.length > 80 || !date(value.expiresAt)
      || !["pending", "approved", "declined", "expired", "cancelled", "fulfilled", "refunded"].includes(value.status as string)) throw invalid();
    payment = { checkoutSessionId: value.checkoutSessionId, reference: value.reference,
      status: value.status as TrialPayment["status"], expiresAt: value.expiresAt };
  }
  return { status: row.status as SubscriptionTrial["status"], durationDays: 15,
    startsAt: row.startsAt as string | null, endsAt: row.endsAt as string | null,
    convertedAt: row.convertedAt as string | null, canConvert: row.canConvert,
    ...(payment !== undefined ? { payment } : {}) };
}

// Presentation only: every opening is authorized again under the billing locks.
export function trialPaymentPresentation(payment?: TrialPayment | null) {
  if (!payment) return { label: "Contratar plan", detail: "", resultHref: null };
  const resultHref = `/pago/resultado/?checkoutSessionId=${encodeURIComponent(payment.checkoutSessionId)}`;
  if (payment.status === "declined") return { label: "Reintentar pago en Wompi",
    detail: `El intento de pago ${payment.reference} no se completó. Puedes volver a Wompi y elegir Nequi u otro medio. Antes de abrirlo, el servidor comprobará que no haya otro pago pendiente o aprobado.`, resultHref };
  if (payment.status === "expired") return { label: "Generar nuevo enlace de pago",
    detail: `El enlace de pago ${payment.reference} venció. Puedes preparar otro enlace para la misma contratación; el servidor verificará el historial para evitar pagos duplicados.`, resultHref };
  if (payment.status === "pending") return { label: "Continuar pago en Wompi",
    detail: `Referencia ${payment.reference}. Si cerraste Wompi antes de autorizar el pago, puedes continuar. Si ya lo autorizaste, consulta su estado y espera la confirmación antes de intentar pagar de nuevo.`, resultHref };
  if (payment.status === "approved" || payment.status === "fulfilled") return { label: "Consultar contratación",
    detail: `El pago ${payment.reference} fue confirmado. Actualiza el estado para comprobar su aplicación; no realices otro pago.`, resultHref };
  return { label: "Revisar contratación", detail: `Consulta el estado del pago ${payment.reference} antes de continuar.`, resultHref };
}

export function readTrialCheckout(value: unknown, origin: string): { checkoutSessionId: string; checkoutUrl: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw invalid();
  const row = value as Record<string, unknown>;
  if (!uuid(row.checkoutSessionId) || !uuid(row.orderId) || row.provider !== "wompi"
    || !Number.isSafeInteger(row.amountInCents) || Number(row.amountInCents) <= 0 || row.currency !== "COP"
    || !date(row.expirationTime) || Date.parse(row.expirationTime) <= Date.now() || typeof row.checkoutUrl !== "string") throw invalid();
  const url = new URL(row.checkoutUrl);
  if (url.origin !== "https://checkout.wompi.co" || url.pathname !== "/p/" || url.username || url.password || url.hash) throw invalid();
  const redirects = url.searchParams.getAll("redirect-url");
  if (redirects.length !== 1) throw invalid();
  const redirect = new URL(redirects[0]!);
  const ids = redirect.searchParams.getAll("checkoutSessionId");
  if (redirect.origin !== origin || redirect.pathname.replace(/\/$/, "") !== "/pago/resultado"
    || redirect.username || redirect.password || redirect.hash || ids.length !== 1 || ids[0] !== row.checkoutSessionId) throw invalid();
  return { checkoutSessionId: row.checkoutSessionId, checkoutUrl: row.checkoutUrl };
}
