export type PlanChange = {
  subscriptionChangeId: string;
  changeType: "upgrade" | "downgrade";
  status: "requested" | "quoted" | "pending_payment" | "scheduled" | "failed";
  toPlan: { code: string; name: string };
  quote: { amountMinor: number; currency: "COP"; expiresAt: string | null };
  effectiveAt: string;
  nextAction: "checkout" | "wait_for_payment" | "wait_for_activation" | "requote" | "wait_for_period_end" | "review";
};
export type PendingPlanChange = PlanChange & {
  orderId: string | null;
  checkoutSessionId: string | null;
  orderStatus: "pending_payment" | "paid" | "fulfilled" | "expired" | "cancelled" | null;
};
export class UpgradeValidationError extends Error {}
const invalid = () => new UpgradeValidationError("No pudimos validar el cambio pendiente. Actualiza Mi cuenta o contacta a soporte antes de pagar.");
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw invalid();
  return value as Record<string, unknown>;
};
const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const date = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value));
const plans = new Set(["basic", "professional", "enterprise", "basic-fe", "professional-fe", "enterprise-fe"]);
export function readPlanChange(value: unknown): PlanChange {
  const row = object(value), plan = object(row.toPlan), quote = object(row.quote);
  if (!uuid(row.subscriptionChangeId) || !["upgrade", "downgrade"].includes(row.changeType as string)
    || !["requested", "quoted", "pending_payment", "scheduled", "failed"].includes(row.status as string)
    || typeof plan.code !== "string" || !plans.has(plan.code) || typeof plan.name !== "string" || !plan.name.trim()
    || !Number.isSafeInteger(quote.amountMinor) || Number(quote.amountMinor) < 0 || quote.currency !== "COP"
    || !(quote.expiresAt === null || date(quote.expiresAt)) || !date(row.effectiveAt)
    || !["checkout", "wait_for_payment", "wait_for_activation", "requote", "wait_for_period_end", "review"].includes(row.nextAction as string)) throw invalid();
  if ((["requested", "quoted"].includes(row.status as string) && row.nextAction !== "review")
    || (["checkout", "requote", "wait_for_payment", "wait_for_activation"].includes(row.nextAction as string) && row.changeType !== "upgrade")
    || (row.nextAction === "checkout" && (row.status !== "pending_payment" || quote.amountMinor === 0 || quote.expiresAt === null))
    || (row.nextAction === "wait_for_period_end" && (row.changeType !== "downgrade" || row.status !== "scheduled"))) throw invalid();
  return { subscriptionChangeId: row.subscriptionChangeId, changeType: row.changeType as PlanChange["changeType"],
    status: row.status as PlanChange["status"], toPlan: { code: plan.code, name: plan.name },
    quote: { amountMinor: quote.amountMinor as number, currency: "COP", expiresAt: quote.expiresAt as string | null },
    effectiveAt: row.effectiveAt, nextAction: row.nextAction as PlanChange["nextAction"] };
}
export function readPendingPlanChange(value: unknown): PendingPlanChange | null {
  if (value === undefined || value === null) return null;
  const row = object(value), change = readPlanChange(row);
  if (!(row.orderId === null || uuid(row.orderId)) || !(row.checkoutSessionId === null || uuid(row.checkoutSessionId))
    || !(row.orderStatus === null || ["pending_payment", "paid", "fulfilled", "expired", "cancelled"].includes(row.orderStatus as string))
    || (row.checkoutSessionId !== null && row.orderId === null)
    || (change.nextAction === "checkout" && row.orderStatus !== null && row.orderStatus !== "pending_payment")) throw invalid();
  return { ...change, orderId: row.orderId as string | null, checkoutSessionId: row.checkoutSessionId as string | null,
    orderStatus: row.orderStatus as PendingPlanChange["orderStatus"] };
}
export function readUpgradeCheckout(value: unknown, change: PlanChange, origin: string): { checkoutSessionId: string; checkoutUrl: string } {
  const row = object(value);
  if (!uuid(row.checkoutSessionId) || !uuid(row.orderId) || typeof row.checkoutUrl !== "string"
    || row.amountInCents !== change.quote.amountMinor || row.currency !== change.quote.currency
    || !date(row.expirationTime) || Date.parse(row.expirationTime) <= Date.now()) throw invalid();
  const expected = change as Partial<PendingPlanChange>;
  if ((expected.orderId && row.orderId.toLowerCase() !== expected.orderId.toLowerCase())
    || (expected.checkoutSessionId && row.checkoutSessionId.toLowerCase() !== expected.checkoutSessionId.toLowerCase())) throw invalid();
  const url = new URL(row.checkoutUrl);
  if (url.origin !== "https://checkout.wompi.co" || url.pathname !== "/p/" || url.username || url.password || url.hash) throw invalid();
  const returns = url.searchParams.getAll("redirect-url");
  if (returns.length !== 1) throw invalid();
  const target = new URL(returns[0]!);
  const ids = target.searchParams.getAll("checkoutSessionId");
  if (target.origin !== origin || target.pathname.replace(/\/$/, "") !== "/pago/resultado" || target.hash
    || ids.length !== 1 || ids[0] !== row.checkoutSessionId) throw invalid();
  return { checkoutSessionId: row.checkoutSessionId, checkoutUrl: row.checkoutUrl };
}
