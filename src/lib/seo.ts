export const SITE_URL = "https://cripton.com.co";

// Explicit editorial allowlist: account, payment, tokens and legal drafts never
// gain a canonical or a sitemap entry merely because a new page was created.
export const PUBLIC_PATHS: readonly string[] = [
  "/", "/soluciones/", "/soluciones/ventas-y-caja/", "/soluciones/inventario/",
  "/soluciones/reportes/", "/soluciones/facturacion-electronica/",
  "/guias/elegir-un-pos/", "/confianza/", "/legal/", "/legal/cookies/",
  "/legal/privacidad/", "/legal/terminos/",
];
export function publicPageUrl(pathname: string): string | null {
  const path = (pathname.split(/[?#]/, 1)[0] ?? "").replace(/\/+$/, "") + "/";
  return PUBLIC_PATHS.includes(path) ? new URL(path, SITE_URL).href : null;
}
export function indexableSite(production: boolean, setting?: string): boolean {
  // Publishing requires an explicit build setting; dev and previews default safe.
  return production && setting === "true";
}
