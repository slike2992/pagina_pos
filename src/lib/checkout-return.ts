/** Presentation adapter for pending links created before the API return-id fix.
 * It never changes reference, amount, currency, expiration or integrity signature.
 */
export function withCheckoutReturn(checkoutUrl: string, checkoutSessionId: string, origin: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(checkoutSessionId)) {
    throw new Error("No pudimos identificar la orden de pago.");
  }
  const url = new URL(checkoutUrl);
  if (url.origin !== "https://checkout.wompi.co" || url.pathname !== "/p/" || url.username || url.password || url.hash) {
    throw new Error("El destino de pago no es válido.");
  }
  const returns = url.searchParams.getAll("redirect-url");
  if (returns.length !== 1) throw new Error("El retorno de pago no es válido.");
  const result = new URL(returns[0]!);
  if (result.origin !== origin || result.pathname.replace(/\/$/, "") !== "/pago/resultado" || result.hash) {
    throw new Error("El retorno de pago no corresponde a este sitio.");
  }
  const ids = result.searchParams.getAll("checkoutSessionId");
  if (ids.length > 1 || (ids.length === 1 && ids[0] !== checkoutSessionId)) {
    throw new Error("El retorno de pago no corresponde a esta orden.");
  }
  if (ids.length === 1) return checkoutUrl;
  result.searchParams.set("checkoutSessionId", checkoutSessionId);
  url.searchParams.set("redirect-url", result.href);
  return url.href;
}
