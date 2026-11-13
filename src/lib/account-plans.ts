export type BillingInterval = "monthly" | "annual";
export type AccountPlan = Readonly<{
  code: string;
  name: string;
  electronicInvoicing: boolean;
  amountMinor: number;
  currency: "COP";
  billingInterval: BillingInterval;
}>;
export type AccountPlanMarket = Readonly<{ country: string; currency: string; billingInterval: string }>;
export type AccountPlanCatalog = Readonly<{
  country: "CO"; currency: "COP"; billingInterval: BillingInterval; plans: readonly AccountPlan[];
}>;

const publicCodes = new Set(["basic", "professional", "enterprise", "basic-fe", "professional-fe", "enterprise-fe"]);
const invalid = () => new Error("No se pudo validar el catálogo publicado para el país, moneda y período de tu suscripción. Reintenta la consulta.");
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw invalid();
  return value as Record<string, unknown>;
};
function market(value: AccountPlanMarket): asserts value is { country: "CO"; currency: "COP"; billingInterval: BillingInterval } {
  if (value.country !== "CO" || value.currency !== "COP" || !["monthly", "annual"].includes(value.billingInterval)) throw invalid();
}

// The public API publishes monthly/annual prices; it does not publish quote or
// authorization data. A plan change still sends only the selected plan code.
export function readAccountPlans(payload: unknown, context: AccountPlanMarket): AccountPlanCatalog {
  market(context);
  const data = object(payload);
  if (data.country !== context.country || data.currency !== context.currency || !Array.isArray(data.plans)
    || data.plans.length === 0 || data.plans.length > publicCodes.size) throw invalid();
  const seen = new Set<string>();
  const plans = data.plans.map(value => {
    const row = object(value);
    if (typeof row.code !== "string" || !publicCodes.has(row.code) || seen.has(row.code)
      || typeof row.name !== "string" || !row.name.trim() || row.name.length > 200
      || typeof row.electronicInvoicing !== "boolean" || row.electronicInvoicing !== row.code.endsWith("-fe")) throw invalid();
    seen.add(row.code);
    for (const key of ["monthly", "annual", "implementation"]) {
      const price = object(row[key]);
      if (price.currency !== context.currency || !Number.isSafeInteger(price.amountMinor) || Number(price.amountMinor) < 0) throw invalid();
    }
    const price = object(row[context.billingInterval]);
    return { code: row.code, name: row.name.trim(), electronicInvoicing: row.electronicInvoicing,
      amountMinor: price.amountMinor as number, currency: context.currency, billingInterval: context.billingInterval };
  });
  return { country: context.country, currency: context.currency, billingInterval: context.billingInterval, plans };
}

export async function loadAccountPlans(apiUrl: string, context: AccountPlanMarket, fetcher: typeof fetch = fetch): Promise<AccountPlanCatalog> {
  market(context);
  const query = new URLSearchParams({ country: context.country, currency: context.currency });
  const response = await fetcher(`${apiUrl.replace(/\/$/, "")}/v1/public/plans?${query}`, { headers: { accept: "application/json" } })
    .catch(() => { throw new Error("No fue posible consultar los planes publicados. Reintenta la consulta para cambiar de plan."); });
  if (!response.ok || response.redirected) throw new Error("No fue posible consultar los planes publicados. Reintenta la consulta para cambiar de plan.");
  return readAccountPlans(await response.json().catch(() => { throw invalid(); }), context);
}

export function selectAccountPlan(catalog: AccountPlanCatalog, currentCode: string, preferredCode = currentCode): string {
  if (!catalog.plans.some(plan => plan.code === currentCode)) throw new Error("El plan actual no está disponible en el catálogo publicado. Actualiza la consulta o contacta a soporte antes de cambiarlo.");
  return catalog.plans.some(plan => plan.code === preferredCode) ? preferredCode : currentCode;
}

export function accountPlanLabel(plan: AccountPlan): string {
  return `${plan.name} · ${new Intl.NumberFormat("es-CO", { style: "currency", currency: plan.currency, maximumFractionDigits: 2 }).format(plan.amountMinor / 100)} / ${plan.billingInterval === "annual" ? "año" : "mes"}`;
}

export function renderAccountPlans(select: HTMLSelectElement, catalog: AccountPlanCatalog, selected: string): void {
  const groups = [
    { label: "Sin facturación electrónica", electronic: false },
    { label: "Con facturación electrónica", electronic: true },
  ].flatMap(group => {
    const plans = catalog.plans.filter(plan => plan.electronicInvoicing === group.electronic);
    if (!plans.length) return [];
    const element = document.createElement("optgroup");
    element.label = group.label;
    for (const plan of plans) element.appendChild(new Option(accountPlanLabel(plan), plan.code));
    return [element];
  });
  select.replaceChildren(...groups);
  select.value = selected;
}
