// Only public provider scripts. Card data and private keys never enter this module.
const allowedScripts = new Set([
  "https://checkout.wompi.co/widget.js",
  "https://wompijs.wompi.com/libs/js/v1.js",
  // Compatibility while an older API release is still serving its contract.
  "https://cdn.wompi.co/libs/js/v1.js"
]);
const pendingScripts = new Map<string, { attributes: string; promise: Promise<void> }>();

export function loadWompiScript(source: string, attributes: Record<string, string> = {}): Promise<void> {
  if (!allowedScripts.has(source) || Object.keys(attributes).some(key => key !== "data-public-key") ||
      (attributes["data-public-key"] !== undefined && !/^pub_(test|prod)_[A-Za-z0-9_-]+$/.test(attributes["data-public-key"]))) {
    return Promise.reject(new Error("La configuración pública de Wompi no es válida."));
  }
  const signature = JSON.stringify(attributes);
  const pending = pendingScripts.get(source);
  if (pending) return pending.attributes === signature ? pending.promise
    : Promise.reject(new Error("La configuración de Wompi cambió. Recarga la página."));
  const current = document.querySelector<HTMLScriptElement>(`script[src='${source}']`);
  if (current && Object.entries(attributes).some(([key, value]) => current.getAttribute(key) !== value)) {
    return Promise.reject(new Error("La configuración de Wompi cambió. Recarga la página."));
  }
  if (current?.dataset.loaded === "true") return Promise.resolve();
  const promise = new Promise<void>((resolve, reject) => {
    const script = current ?? document.createElement("script");
    if (!current) {
      script.dataset.criptonPaymentScript = "true";
      Object.entries(attributes).forEach(([key, value]) => script.setAttribute(key, value));
    }
    const cleanup = () => {
      window.clearTimeout(timeout);
      script.removeEventListener("load", loaded);
      script.removeEventListener("error", failed);
    };
    const loaded = () => { cleanup(); script.dataset.loaded = "true"; resolve(); };
    const failed = () => {
      cleanup();
      if (script.dataset.criptonPaymentScript === "true") script.remove();
      reject(new Error("No fue posible cargar Wompi. Puedes volver a intentarlo."));
    };
    const timeout = window.setTimeout(failed, 15000);
    script.addEventListener("load", loaded, { once: true });
    script.addEventListener("error", failed, { once: true });
    if (!current) { script.src = source; document.head.append(script); }
  });
  pendingScripts.set(source, { attributes: signature, promise });
  void promise.catch(() => {
    if (pendingScripts.get(source)?.promise === promise) pendingScripts.delete(source);
  });
  return promise;
}

type FraudLibrary = { initialize(callback: (data: { sessionId?: string } | null, error: unknown) => void): unknown };

export async function prepareWompiSession(config: {
  publicKey: string; widgetScriptUrl: string; fraudScriptUrl: string;
}): Promise<string> {
  await loadWompiScript(config.widgetScriptUrl);
  await loadWompiScript(config.fraudScriptUrl, { "data-public-key": config.publicKey });
  const fraud = (window as typeof window & { $wompi?: FraudLibrary }).$wompi;
  if (!fraud || typeof fraud.initialize !== "function") throw new Error("Wompi no quedó disponible. Vuelve a intentarlo.");
  return new Promise<string>((resolve, reject) => {
    const failed = () => {
      window.clearTimeout(timeout);
      reject(new Error("No fue posible iniciar la sesión segura de Wompi. Vuelve a intentarlo."));
    };
    const timeout = window.setTimeout(failed, 15000);
    try {
      const initialization = fraud.initialize((data, error) => {
        if (error || typeof data?.sessionId !== "string" || !/^\S{10,250}$/.test(data.sessionId)) { failed(); return; }
        window.clearTimeout(timeout);
        resolve(data.sessionId);
      });
      // Some provider versions reject a promise instead of invoking the callback.
      void Promise.resolve(initialization).catch(failed);
    } catch { failed(); }
  });
}
