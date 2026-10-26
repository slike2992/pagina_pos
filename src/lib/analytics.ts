// Only fixed commercial categories can leave the page. Never accept text fields,
// email addresses, customer IDs, tokens, URLs, amounts or arbitrary labels.
export const CONSENT_KEY = "cripton.analytics-consent.v1";
export const CONSENT_TTL = 180 * 24 * 60 * 60 * 1000;
const actions = ["signup", "plans", "demo", "contact", "solution"] as const;
const locations = ["header", "hero", "plan", "content", "contact", "footer"] as const;
const plans = ["basic", "professional", "enterprise", "basic-fe", "professional-fe", "enterprise-fe"] as const;
type Action = typeof actions[number];
type Location = typeof locations[number];
type Plan = typeof plans[number];
export type CommercialEvent = { action: Action; location: Location; plan?: Plan };
export function commercialEvent(input: { action?: string; location?: string; plan?: string }): CommercialEvent | null {
  if (!actions.includes(input.action as Action) || !locations.includes(input.location as Location)) return null;
  return { action: input.action as Action, location: input.location as Location,
    ...(plans.includes(input.plan as Plan) ? { plan: input.plan as Plan } : {}),
  };
}
export function storedConsent(raw: string | null, now = Date.now()): "granted" | "denied" | null {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (!value || typeof value !== "object") return null;
    const { choice, expiresAt } = value as { choice?: unknown; expiresAt?: unknown };
    if ((choice !== "granted" && choice !== "denied") || typeof expiresAt !== "number"
      || !Number.isFinite(expiresAt) || expiresAt <= now || expiresAt > now + CONSENT_TTL) return null;
    return choice;
  } catch { return null; }
}

export function analyticsVisitAllowed(origin: string, query: string, canonical: string): boolean {
  try { return query === "" && origin === "https://cripton.com.co" && new URL(canonical).origin === origin; }
  catch { return false; }
}