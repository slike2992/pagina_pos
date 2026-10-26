export const SITE_URL = "https://cripton.com.co";

// Public, editorial routes only. Account, payment and token flows stay excluded.
export const PUBLIC_PATHS: readonly string[] = [
  "/",
  "/legal/privacidad/",
  "/legal/terminos/",
];

export function publicPageUrl(pathname: string): string | null {
  // Never derive metadata from a request origin, query string or fragment.
  const path = (pathname.split(/[?#]/, 1)[0] ?? "").replace(/\/+$/, "") + "/";
  return PUBLIC_PATHS.includes(path) ? new URL(path, SITE_URL).href : null;
}
