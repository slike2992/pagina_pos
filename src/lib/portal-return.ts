export type PortalDestination = "account" | "plans" | "fiscal";
const opaque = /^[A-Za-z0-9_-]{43}$/;
const storageKey = "cripton.portal.return.v1";
const destinations = new Set(["account", "plans", "fiscal"]);
const invalid = () => new Error("El acceso a Mi cuenta no es válido o expiró. Abre de nuevo Mi cuenta desde el POS.");
const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
type Handshake = { verifier: string; state: string; destination: PortalDestination; createdAt: number };
export async function beginPortalReturn(url: URL, posUrl: string, storage: Storage, cryptography: Crypto = crypto, now = Date.now()): Promise<string | null> {
  if (!url.searchParams.has("from")) return null;
  if (url.searchParams.getAll("from").length !== 1 || url.searchParams.get("from") !== "pos" ||
      url.searchParams.getAll("destination").length !== 1 || !destinations.has(url.searchParams.get("destination") || "")) throw invalid();
  const destination = url.searchParams.get("destination") as PortalDestination;
  const pos = new URL("/auth/portal", posUrl);
  if (!["https:", "http:"].includes(pos.protocol) || pos.username || pos.password ||
      (url.protocol === "https:" && pos.protocol !== "https:")) throw invalid();
  const verifier = base64url(cryptography.getRandomValues(new Uint8Array(32)));
  const state = base64url(cryptography.getRandomValues(new Uint8Array(32)));
  const challenge = base64url(new Uint8Array(await cryptography.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  storage.setItem(storageKey, JSON.stringify({ verifier, state, destination, createdAt: now }));
  pos.search = new URLSearchParams({ codeChallenge: challenge, state, destination }).toString();
  return pos.toString();
}
export function readPortalReturn(url: URL, storage: Storage, now = Date.now()): { ticket: string; codeVerifier: string; state: string; destination: PortalDestination } | null {
  const hash = new URLSearchParams(url.hash.slice(1));
  if (!hash.has("portal-ticket")) return null;
  let saved: Handshake | null = null;
  try { saved = JSON.parse(storage.getItem(storageKey) || "null"); } catch { /* invalid stored handshake */ }
  storage.removeItem(storageKey);
  if (url.search || hash.getAll("portal-ticket").length !== 1 || hash.getAll("state").length !== 1 ||
      [...hash.keys()].some(key => !["portal-ticket", "state"].includes(key)) ||
      !opaque.test(hash.get("portal-ticket") || "") || !opaque.test(hash.get("state") || "") ||
      !saved || !opaque.test(saved.verifier) || saved.state !== hash.get("state") || !destinations.has(saved.destination) ||
      !Number.isFinite(saved.createdAt) || saved.createdAt > now || now - saved.createdAt >= 120000) throw invalid();
  return { ticket: hash.get("portal-ticket")!, codeVerifier: saved.verifier, state: saved.state, destination: saved.destination };
}
export function validatePortalLogin(value: unknown, expectedDestination: PortalDestination, now = Date.now()) {
  if (!value || typeof value !== "object") throw invalid();
  const row = value as Record<string, any>;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (row.destination !== expectedDestination || row.tokenType !== "Bearer" || typeof row.accessToken !== "string" ||
      !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(row.accessToken) ||
      typeof row.expiresAt !== "string" || !Number.isFinite(Date.parse(row.expiresAt)) || Date.parse(row.expiresAt) <= now ||
      Date.parse(row.expiresAt) > now + 3600000 || !uuid.test(row.principal?.principalId || "") ||
      typeof row.principal?.displayName !== "string" || !uuid.test(row.tenant?.tenantId || "") ||
      !["owner", "admin", "billing", "member"].includes(row.tenant?.role) || typeof row.tenant?.name !== "string" ||
      !["active", "restricted"].includes(row.tenant?.status)) throw invalid();
  return row;
}
