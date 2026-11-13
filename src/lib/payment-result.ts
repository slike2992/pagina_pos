export type CheckoutPurpose = "signup" | "plan_change" | "renewal" | "unknown";
export type CheckoutResult = {
  status: "pending" | "approved" | "declined" | "expired" | "cancelled" | "fulfilled" | "refunded";
  reference: string;
  amountInCents: number;
  currency: "COP";
  purpose: CheckoutPurpose;
  planChange?: { status: string };
  recovery?: unknown;
};

const states = new Set(["pending", "approved", "declined", "expired", "cancelled", "fulfilled", "refunded"]);
const changeStates = new Set(["requested", "quoted", "pending_payment", "scheduled", "applied", "cancelled", "failed"]);
const invalid = () => new Error("No pudimos validar el contexto del pago. Consulta el estado en Mi cuenta.");

// Only the server identifies the operation. Neither query parameters nor local
// storage may turn a payment result into signup or proof of an applied upgrade.
export function readCheckoutResult(value: unknown, previous: CheckoutPurpose = "unknown"): CheckoutResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw invalid();
  const row = value as Record<string, unknown>;
  if (typeof row.status !== "string" || !states.has(row.status)
    || typeof row.reference !== "string" || !row.reference.trim()
    || row.currency !== "COP" || !Number.isSafeInteger(row.amountInCents) || Number(row.amountInCents) < 0) throw invalid();
  const purpose = row.purpose === undefined
    ? row.recovery === undefined ? "unknown" : "renewal"
    : row.purpose;
  if (!["signup", "plan_change", "renewal", "unknown"].includes(purpose as string)
    || (previous !== "unknown" && purpose !== previous)
    || (purpose === "renewal" && row.recovery === undefined)
    || (purpose !== "renewal" && row.recovery !== undefined)
    || (purpose !== "plan_change" && row.planChange !== undefined)) throw invalid();
  let planChange: { status: string } | undefined;
  if (purpose === "plan_change") {
    const change = row.planChange;
    if (!change || typeof change !== "object" || Array.isArray(change)
      || !("status" in change) || typeof change.status !== "string" || !changeStates.has(change.status)) throw invalid();
    planChange = { status: change.status };
  }
  return { status: row.status as CheckoutResult["status"], reference: row.reference,
    amountInCents: row.amountInCents as number, currency: "COP", purpose: purpose as CheckoutPurpose,
    ...(planChange ? { planChange } : {}), ...(row.recovery !== undefined ? { recovery: row.recovery } : {}) };
}

export function accountPaymentResult(result: CheckoutResult): { heading: string; status: string; detail: string; state: string; poll: boolean } {
  const upgrade = result.purpose === "plan_change";
  const labels: Record<string, string> = { declined: "Pago rechazado", expired: "Orden vencida", cancelled: "Pago cancelado", refunded: "Pago reembolsado" };
  const detail = upgrade
    ? "Revisa el cambio pendiente en Mi cuenta para conocer su estado y las opciones de recuperación. Consultar de nuevo sólo actualiza el estado; no realiza un cobro."
    : "Consulta Mi cuenta para revisar la operación y sus opciones de recuperación. Este resultado no confirma activación, acceso ni aplicación de un cambio de plan.";
  if (upgrade && result.status === "fulfilled" && result.planChange?.status === "applied") return {
    heading: "Cambio de plan aplicado", status: "El servidor confirmó la aplicación de este cambio de plan.",
    detail: "Revisa tu plan y acceso actuales en Mi cuenta. Este resultado no confirma la configuración ni la activación de facturación electrónica.", state: "success", poll: false,
  };
  if (["approved", "fulfilled"].includes(result.status)) {
    const review = upgrade && ["failed", "cancelled"].includes(result.planChange!.status);
    return { heading: upgrade ? review ? "Pago confirmado; cambio requiere revisión" : "Pago confirmado; cambio pendiente de aplicar" : "Pago confirmado",
      status: upgrade ? "El pago no acredita por sí solo la aplicación del cambio de plan." : "El servidor confirmó el pago. Revisa su aplicación en Mi cuenta.",
      detail, state: "", poll: upgrade ? !review : result.status !== "fulfilled" };
  }
  if (result.status === "pending") return { heading: "Estamos confirmando este pago",
    status: "El servidor todavía no ha confirmado el pago.", detail, state: "", poll: true };
  return { heading: labels[result.status], status: upgrade
    ? "Este resultado no confirma la aplicación del cambio de plan."
    : "Este resultado no confirma la aplicación del pago.", detail, state: "error", poll: false };
}
