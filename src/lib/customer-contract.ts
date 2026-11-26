import { createIdempotencyKey } from "../scripts/client-idempotency";

export type ContractSubsection = { heading: string; paragraphs?: string[]; items?: string[] };
export type ContractSection = ContractSubsection & { id: string; subsections?: ContractSubsection[] };
export type ContractPackage = { version: string; documents: { slug: string; title: string; sections: ContractSection[] }[] };
export type ContractFeature = { code: string; display_name: string; enabled: boolean; limit_value?: number | null; text_value?: string | null };
export type ContractOffer = { features?: ContractFeature[]; taxBehavior?: string; implementationAmountMinor?: number; [key: string]: unknown; subscriptionId: string; priceId: string; planCode: string; planName: string; amountMinor: number; currency: "COP"; billingInterval: "monthly" | "annual"; automaticRenewal: false; periodRule: "trial_remainder_then_paid_or_payment_date" };
export type OperationalAccess = { schemaVersion: 1; required: boolean; accepted: boolean; packageVersion: string | null; contractId: string | null };
export type CustomerContract = { required: boolean; accepted: boolean; contractId: string | null; package: ContractPackage | null; packageSha256: string | null; offer: ContractOffer | null; offerSha256: string | null; verifiedEmail: string | null; identityMethod: "declared_and_verified_email"; canAccept: boolean; operationalAccess: OperationalAccess | null };
export type ContractContext = { accessToken: string; tenantId: string; subscriptionId: string; session: object; canContract: boolean };
export const contractDeclarations = ["serviceTerms", "dataProcessingAnnex", "ownDataAuthorization", "adultAndAuthorized", "truthfulDeclaredIdentity"] as const;
export const contractPartyLimits = { name: 240, address: 240, city: 100, phone: 24, documentNumber: 30, representativeName: 180, representativeDocumentNumber: 30 } as const;
const documentTypes = ["CC", "CE", "PASSPORT", "PPT"];
class ContractError extends Error {}
const contractMessage = (error: unknown, fallback: string) => error instanceof ContractError ? error.message : fallback;
const invalid = () => new ContractError("No pudimos verificar el contrato y la oferta. Actualiza el contrato antes de pagar.");
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw invalid();
  return value as Record<string, unknown>;
};
const text = (value: unknown): value is string => typeof value === "string" && Boolean(value.trim());
const hash = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
const uuid = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);

export function readContractPackage(value: unknown): ContractPackage {
  const row = record(value);
  if (!text(row.version) || !Array.isArray(row.documents) || row.documents.length !== 3) throw invalid();
  const slugs = new Set<string>();
  const documents = row.documents.map(value => {
    const doc = record(value);
    if (!text(doc.slug) || slugs.has(doc.slug) || !text(doc.title) || !Array.isArray(doc.sections) || !doc.sections.length) throw invalid();
    slugs.add(doc.slug);
    const ids = new Set<string>();
    const sections = doc.sections.map(value => {
      const section = record(value);
      if (!text(section.id) || ids.has(section.id) || !text(section.heading)) throw invalid();
      ids.add(section.id);
      for (const key of ["paragraphs", "items"]) {
        if (section[key] !== undefined && (!Array.isArray(section[key]) || !section[key].every(text))) throw invalid();
      }
      const subsections = section.subsections === undefined ? undefined : (() => {
        if (!Array.isArray(section.subsections)) throw invalid();
        return section.subsections.map(value => {
          const part = record(value);
          if (!text(part.heading)) throw invalid();
          for (const key of ["paragraphs", "items"]) {
            if (part[key] !== undefined && (!Array.isArray(part[key]) || !part[key].every(text))) throw invalid();
          }
          if (!(part.paragraphs as string[] | undefined)?.length && !(part.items as string[] | undefined)?.length) throw invalid();
          return { heading: part.heading,
            ...(part.paragraphs !== undefined ? { paragraphs: [...part.paragraphs as string[]] } : {}),
            ...(part.items !== undefined ? { items: [...part.items as string[]] } : {}) };
        });
      })();
      if (!(section.paragraphs as string[] | undefined)?.length && !(section.items as string[] | undefined)?.length && !subsections?.length) throw invalid();
      return { id: section.id, heading: section.heading,
        ...(section.paragraphs !== undefined ? { paragraphs: [...section.paragraphs as string[]] } : {}),
        ...(section.items !== undefined ? { items: [...section.items as string[]] } : {}),
        ...(subsections !== undefined ? { subsections } : {}) };
    });
    return { slug: doc.slug, title: doc.title, sections };
  });
  return { version: row.version, documents };
}

export function readContractOffer(value: unknown, subscriptionId: string): ContractOffer {
  const offer = record(value);
  if (!uuid(offer.subscriptionId) || offer.subscriptionId.toLowerCase() !== subscriptionId.toLowerCase()
    || !uuid(offer.priceId) || !text(offer.planCode) || !text(offer.planName)
    || !Number.isSafeInteger(offer.amountMinor) || Number(offer.amountMinor) <= 0 || offer.currency !== "COP"
    || !["monthly", "annual"].includes(offer.billingInterval as string) || offer.automaticRenewal !== false
    || offer.periodRule !== "trial_remainder_then_paid_or_payment_date"
    || (offer.taxBehavior !== undefined && !text(offer.taxBehavior))
    || (offer.implementationAmountMinor !== undefined && (!Number.isSafeInteger(offer.implementationAmountMinor) || Number(offer.implementationAmountMinor) < 0))) throw invalid();
  let features: ContractFeature[] | undefined;
  if (offer.features !== undefined) {
    if (!Array.isArray(offer.features)) throw invalid();
    features = offer.features.map(value => {
      const feature = record(value);
      if (!text(feature.code) || !text(feature.display_name) || typeof feature.enabled !== "boolean"
        || (feature.limit_value !== undefined && feature.limit_value !== null && (!Number.isSafeInteger(feature.limit_value) || Number(feature.limit_value) < 0))
        || (feature.text_value !== undefined && feature.text_value !== null && typeof feature.text_value !== "string")) throw invalid();
      return { ...feature } as ContractFeature;
    });
  }
  return { ...offer, ...(features ? { features } : {}) } as ContractOffer;
}

export function readCustomerContract(value: unknown, subscriptionId: string): CustomerContract {
  const row = record(value);
  let needsEvidence = row.required === true || row.accepted === true;
  let operationalAccess: OperationalAccess | null = null;
  if (row.operationalAccess !== undefined) {
    const access = record(row.operationalAccess);
    if (access.schemaVersion !== 1 || typeof access.required !== "boolean" || typeof access.accepted !== "boolean"
      || !(access.packageVersion === null || text(access.packageVersion))
      || (access.required && !text(access.packageVersion))
      || (access.accepted ? !uuid(access.contractId) || !text(access.packageVersion) : access.contractId !== null)
      || typeof row.canAccept !== "boolean") throw invalid();
    operationalAccess = { schemaVersion: 1, required: access.required, accepted: access.accepted,
      packageVersion: access.packageVersion as string | null, contractId: access.contractId as string | null };
    needsEvidence ||= access.required && !access.accepted && row.canAccept === true;
  }
  if (typeof row.required !== "boolean" || typeof row.accepted !== "boolean"
    || (row.accepted ? !uuid(row.contractId) : row.contractId !== null)
    || ![row.packageSha256, row.offerSha256].every(value => value === null || hash(value))
    || (row.verifiedEmail !== null && (!text(row.verifiedEmail) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.verifiedEmail)))
    || (needsEvidence && (!row.package || !row.offer || !hash(row.packageSha256) || !hash(row.offerSha256) || !text(row.verifiedEmail)))
    || row.identityMethod !== "declared_and_verified_email") throw invalid();
  return { required: row.required, accepted: row.accepted, contractId: row.contractId as string | null,
    package: row.package === null ? null : readContractPackage(row.package), packageSha256: row.packageSha256 as string | null,
    offer: row.offer === null ? null : readContractOffer(row.offer, subscriptionId), offerSha256: row.offerSha256 as string | null,
    verifiedEmail: row.verifiedEmail as string | null, identityMethod: "declared_and_verified_email",
    canAccept: typeof row.canAccept === "boolean" ? row.canAccept : operationalAccess === null,
    operationalAccess };
}

export function createContractAcceptance(contract: CustomerContract, data: FormData) {
  if (!contract.package || !contract.offer || !text(contract.verifiedEmail) || !hash(contract.packageSha256) || !hash(contract.offerSha256)) throw invalid();
  const field = (key: string, max: number) => {
    const value = String(data.get(key) ?? "").trim();
    if (!value || value.length > max) throw new ContractError("Completa los datos declarados del contratante y su representante.");
    return value;
  };
  const kind = field("kind", 10), documentType = field("documentType", 10);
  if (!["natural", "legal"].includes(kind) || !(kind === "legal" ? documentType === "NIT" : documentTypes.includes(documentType))) throw invalid();
  const name = field("name", contractPartyLimits.name), documentNumber = field("documentNumber", contractPartyLimits.documentNumber);
  const representativeName = kind === "natural" ? field("name", contractPartyLimits.representativeName) : field("representativeName", contractPartyLimits.representativeName);
  const representativeDocumentType = kind === "natural" ? documentType : field("representativeDocumentType", 10);
  const representativeDocumentNumber = kind === "natural" ? documentNumber : field("representativeDocumentNumber", contractPartyLimits.representativeDocumentNumber);
  if (!documentTypes.includes(representativeDocumentType)) throw invalid();
  if (!contractDeclarations.every(key => data.get(key) === "on")) throw new ContractError("Marca las cinco declaraciones para aceptar el contrato.");
  return { packageSha256: contract.packageSha256, offerSha256: contract.offerSha256,
    party: { kind, name, documentType, documentNumber, address: field("address", contractPartyLimits.address), city: field("city", contractPartyLimits.city), country: "CO",
      phone: field("phone", contractPartyLimits.phone), representativeName, representativeDocumentType, representativeDocumentNumber },
    declarations: Object.fromEntries(contractDeclarations.map(key => [key, true])) };
}

// API text is always inserted as text nodes, never interpreted as HTML or links.
export function renderContractDocuments(container: HTMLElement, pack: ContractPackage) {
  const doc = container.ownerDocument;
  const node = (tag: string, value: string) => { const element = doc.createElement(tag); element.textContent = value; return element; };
  const appendContent = (container: HTMLElement, section: ContractSubsection) => {
    for (const paragraph of section.paragraphs ?? []) container.appendChild(node("p", paragraph));
    if (section.items?.length) {
      const list = doc.createElement("ul");
      for (const item of section.items) list.appendChild(node("li", item));
      container.appendChild(list);
    }
  };
  container.replaceChildren(...pack.documents.map(document => {
    const details = doc.createElement("details");
    details.appendChild(node("summary", document.title));
    for (const section of document.sections) {
      details.appendChild(node("h3", section.heading));
      appendContent(details, section);
      for (const part of section.subsections ?? []) {
        details.appendChild(node("h4", part.heading));
        appendContent(details, part);
      }
    }
    return details;
  }));
}

export function renderContractOffer(container: HTMLElement, offer: ContractOffer | null) {
  container.replaceChildren();
  if (!offer) return;
  const doc = container.ownerDocument, dl = doc.createElement("dl");
  const amount = (value: number) => new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100) + " COP";
  const rows = [
    ["Plan", offer.planName + " (" + offer.planCode + ")"],
    ["Valor", amount(offer.amountMinor) + " / " + (offer.billingInterval === "annual" ? "año" : "mes")],
    ["Renovación automática", "No. No se autorizan débitos automáticos."],
    ["Período", "Si pagas durante la prueba, se conserva el tiempo restante y después comienza el período pagado. Si la prueba terminó, el período pagado comienza en la fecha del pago."],
  ];
  if (offer.taxBehavior !== undefined) rows.push(["Impuestos", ({ inclusive: "Incluidos en el valor", exclusive: "No incluidos en el valor", unspecified: "Sin especificar en la oferta" } as Record<string, string>)[offer.taxBehavior] ?? offer.taxBehavior]);
  if (offer.implementationAmountMinor !== undefined) rows.push(["Implementación", amount(offer.implementationAmountMinor)]);
  for (const [label, value] of rows) {
    const row = doc.createElement("div"), dt = doc.createElement("dt"), dd = doc.createElement("dd");
    dt.textContent = label!; dd.textContent = value!; row.appendChild(dt); row.appendChild(dd); dl.appendChild(row);
  }
  container.appendChild(dl);
  if (offer.features?.length) {
    const heading = doc.createElement("h3"), list = doc.createElement("ul");
    heading.textContent = "Funciones y límites de la oferta";
    for (const feature of offer.features) {
      const item = doc.createElement("li");
      item.textContent = feature.display_name + ": " + (feature.enabled ? "Incluido" : "No incluido")
        + (feature.limit_value == null ? "" : "; límite: " + new Intl.NumberFormat("es-CO").format(feature.limit_value))
        + (feature.text_value == null || feature.text_value === "" ? "" : "; " + feature.text_value);
      list.appendChild(item);
    }
    container.appendChild(heading); container.appendChild(list);
  }
}

export function readContractReceipt(value: unknown, context: Pick<ContractContext, "tenantId" | "subscriptionId">, contractId: string) {
  const row = record(value), evidence = record(row.evidence);
  if (!hash(row.evidenceSha256) || evidence.schemaVersion !== 1 || evidence.contractId !== contractId
    || typeof evidence.tenantId !== "string" || evidence.tenantId.toLowerCase() !== context.tenantId.toLowerCase()
    || !text(evidence.acceptedAt) || !Number.isFinite(Date.parse(evidence.acceptedAt))
    || !hash(evidence.packageSha256) || !hash(evidence.offerSha256)
    || evidence.identityMethod !== "declared_and_verified_email" || evidence.paymentConfirmed !== false || evidence.renewalAuthorized !== false) throw invalid();
  return { package: readContractPackage(evidence.package), offer: readContractOffer(evidence.offer, context.subscriptionId),
    packageSha256: evidence.packageSha256, offerSha256: evidence.offerSha256, acceptedAt: evidence.acceptedAt, evidenceSha256: row.evidenceSha256 };
}

export function bindCustomerContract(root: HTMLElement, options: {
  apiUrl: string; getContext: () => ContractContext | null;
  onUnauthorized: () => void; onContinue: () => Promise<void>; onOperate?: () => Promise<void>;
}) {
  const section = root.querySelector<HTMLElement>("[data-customer-contract]")!;
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => section.querySelector<T>(selector)!;
  const dialog = get<HTMLDialogElement>("[data-contract-dialog]");
  const form = get<HTMLFormElement>("[data-contract-form]");
  const status = get("[data-contract-status]"), dialogStatus = get("[data-contract-dialog-status]");
  const accept = get<HTMLButtonElement>("[data-contract-accept]");
  const receipt = get<HTMLButtonElement>("[data-contract-receipt]");
  const retry = get<HTMLButtonElement>("[data-contract-retry]");
  let generation = 0, state: CustomerContract | null = null, owner: ContractContext | null = null;
  let pending: Promise<CustomerContract | null> | null = null, busy = false;
  let intent: "payment" | "pos" | null = null;
  let attempt: { body: string; key: string } | null = null;
  const current = (context: ContractContext, version = generation) => {
    const now = options.getContext();
    return version === generation && now?.accessToken === context.accessToken && now.tenantId === context.tenantId
      && now.subscriptionId === context.subscriptionId && now.session === context.session;
  };
  const input = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement;
  const clearEvidence = () => {
    get("[data-contract-evidence]").textContent = "";
    get("[data-contract-acceptance]").textContent = "";
    get("[data-contract-evidence-section]").hidden = true;
  };
  const kindChanged = () => {
    const legal = input("kind").value === "legal";
    (input("name") as HTMLInputElement).maxLength = legal ? contractPartyLimits.name : contractPartyLimits.representativeName;
    const representative = get<HTMLFieldSetElement>("[data-contract-representative]");
    representative.hidden = !legal; representative.disabled = !legal;
    get("[data-contract-name-label]").textContent = legal ? "Razón social" : "Nombre completo";
    const type = input("documentType") as HTMLSelectElement;
    for (const option of Array.from(type.options)) {
      option.disabled = legal ? option.value !== "NIT" : option.value === "NIT";
      option.hidden = option.disabled;
    }
    type.value = legal ? "NIT" : type.value === "NIT" ? "CC" : type.value;
  };
  const reset = () => {
    generation++; state = null; owner = null; pending = null; busy = false; intent = null; attempt = null;
    dialog.close(); form.reset(); kindChanged(); clearEvidence();
    get("[data-contract-documents]").replaceChildren(); get("[data-contract-offer]").replaceChildren();
    get("[data-contract-email]").textContent = ""; get("[data-contract-version]").textContent = "";
    status.textContent = ""; dialogStatus.textContent = "";
    section.hidden = true; receipt.hidden = true; receipt.disabled = false; accept.disabled = true; retry.disabled = false;
    form.hidden = true;
  };
  const request = async (context: ContractContext, version: number, suffix = "", init: RequestInit = {}) => {
    const response = await fetch(`${options.apiUrl}/v1/me/customer-contract${suffix}`, { ...init,
      headers: { authorization: `Bearer ${context.accessToken}`, accept: "application/json", ...init.headers },
      credentials: "omit", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer" });
    if (!current(context, version)) return null;
    if (response.status === 401) { reset(); options.onUnauthorized(); return null; }
    if (!response.ok) {
      if (response.status === 409 || response.status === 412) {
        state = null; attempt = null; form.reset(); kindChanged(); form.hidden = true; accept.disabled = true;
        throw new ContractError("El contrato o la oferta cambiaron. Actualiza el contrato y revisa de nuevo antes de aceptar.");
      }
      throw new ContractError("No pudimos verificar o registrar el acuerdo. Reintenta desde Mi cuenta antes de abrir el POS o continuar al pago.");
    }
    const body: unknown = await response.json();
    return current(context, version) ? body : null;
  };
  const render = () => {
    if (!state) return;
    const representative = Boolean(state.canAccept && owner?.canContract);
    renderContractOffer(get("[data-contract-offer]"), representative ? state.offer : null);
    get("[data-contract-version]").textContent = representative && state.package
      ? `Versión consultada: ${state.package.version}. SHA-256 del paquete: ${state.packageSha256 ?? "no disponible"}. SHA-256 de la oferta: ${state.offerSha256 ?? "no disponible"}.`
      : state.operationalAccess?.packageVersion ? `Acuerdo operativo: ${state.operationalAccess.packageVersion}.` : "Aún no hay un paquete contractual adoptado para esta cuenta.";
    get("[data-contract-email]").textContent = representative ? state.verifiedEmail ?? "" : "";
    if (representative && state.package) renderContractDocuments(get("[data-contract-documents]"), state.package);
    else get("[data-contract-documents]").replaceChildren();
    receipt.hidden = !representative || !(state.accepted && state.contractId || state.operationalAccess?.accepted && state.operationalAccess.contractId);
    const needsAcceptance = intent === "pos" ? state.operationalAccess?.required && !state.operationalAccess.accepted : state.required && !state.accepted;
    form.hidden = !needsAcceptance || !state.canAccept || !owner?.canContract;
    accept.disabled = form.hidden || busy;
    accept.textContent = intent === "pos" ? "Aceptar acuerdo y abrir POS" : "Aceptar contrato y continuar al pago";
    get("#customer-contract-intro").textContent = intent === "pos"
      ? "Revisa el acuerdo de servicio y el encargo de datos antes de operar. Aceptarlo es gratuito y no exige tarjeta. No inicia un pago ni activa renovación automática."
      : "Para contratar, revisa la oferta y los tres documentos completos. La aceptación y el pago son pasos distintos; puedes comprar durante la prueba y conservar el tiempo gratis restante.";
    status.textContent = state.operationalAccess?.required && !state.operationalAccess.accepted
      ? state.canAccept && owner?.canContract
        ? "Acuerdo y encargo de datos pendientes antes de abrir el POS. Su aceptación es gratuita y no obliga a comprar."
        : "El representante habilitado de esta empresa debe aceptar el acuerdo y el encargo de datos desde Mi cuenta antes de que sus usuarios abran el POS."
      : state.operationalAccess?.accepted ? "Acuerdo operativo aceptado según el servidor. La compra y la renovación se autorizan por separado."
      : state.accepted ? "Contrato aceptado según el servidor. Puedes consultar su constancia privada."
      : state.required ? "Contrato pendiente para contratar un plan de pago. Revisa el acuerdo operativo antes de abrir el POS."
        : "El servidor no requiere una aceptación para esta cuenta. No hay una aceptación acreditada.";
  };
  const load = (): Promise<CustomerContract | null> => {
    if (pending) return pending;
    const context = options.getContext();
    if (!context) return Promise.resolve(null);
    const version = generation;
    owner = context; section.hidden = false; retry.disabled = true; state = null; receipt.hidden = true;
    form.hidden = true; accept.disabled = true; clearEvidence();
    status.textContent = "Consultando contrato y oferta…"; dialogStatus.textContent = "";
    const task = (async () => {
      try {
        const body = await request(context, version);
        if (body === null || !current(context, version)) return null;
        const next = readCustomerContract(body, context.subscriptionId);
        state = next; render(); return next;
      } catch (error) {
        if (current(context, version)) {
          state = null;
          status.textContent = contractMessage(error, "No pudimos consultar el acuerdo. Revisa tu conexión y vuelve a intentarlo desde Mi cuenta.");
          dialogStatus.textContent = status.textContent;
        }
        return null;
      } finally {
        if (current(context, version)) { pending = null; retry.disabled = false; }
      }
    })();
    pending = task;
    return task;
  };
  const refresh = () => { reset(); return load(); };
  const canContinue = () => Boolean(owner && current(owner) && options.getContext()?.canContract && state && (!state.required || state.accepted));
  const canOperate = () => Boolean(owner && current(owner) && state?.operationalAccess
    && (!state.operationalAccess.required || state.operationalAccess.accepted));
  const beforeOperation = async () => {
    if (!options.getContext() || busy || dialog.open) return false;
    const context = options.getContext()!, version = generation;
    intent = "pos";
    const contract = await load();
    if (!contract || !current(context, version)) return false;
    if (!contract.operationalAccess) {
      status.textContent = "No pudimos verificar el acuerdo de datos necesario para operar. Actualiza Mi cuenta antes de abrir el POS.";
      return false;
    }
    if (canOperate()) { intent = null; return true; }
    if (contract.canAccept && context.canContract) {
      form.reset(); kindChanged(); attempt = null; render(); dialog.showModal();
    }
    return false;
  };
  const beforeCheckout = async () => {
    if (!options.getContext()?.canContract || busy || dialog.open) return false;
    const context = options.getContext()!, version = generation;
    intent = "payment";
    const contract = await load();
    if (!contract || !current(context, version)) return false;
    if (contract.required && !contract.accepted) {
      if (!contract.canAccept) return false;
      form.reset(); kindChanged(); attempt = null; render();
      if (!dialog.open) dialog.showModal();
      return false;
    }
    intent = null;
    return canContinue();
  };
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const needsAcceptance = intent === "pos" ? state?.operationalAccess?.required && !state.operationalAccess.accepted : state?.required && !state.accepted;
    if (busy || pending || !state || !owner || !current(owner) || !options.getContext()?.canContract || !state.canAccept
      || !intent || !needsAcceptance || form.hidden || !dialog.open || !form.reportValidity()) return;
    const context = owner, version = generation;
    const submissionIntent = intent;
    let body: string;
    try { body = JSON.stringify(createContractAcceptance(state, new FormData(form))); }
    catch (error) { dialogStatus.textContent = contractMessage(error, invalid().message); return; }
    if (!attempt || attempt.body !== body) attempt = { body, key: createIdempotencyKey() };
    busy = true; accept.disabled = true; retry.disabled = true;
    dialogStatus.textContent = "Registrando la aceptación. No se ha ordenado ningún pago…";
    try {
      const result = await request(context, version, "", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": attempt.key }, body });
      if (result === null || !current(context, version)) return;
      const accepted = record(result);
      if (!uuid(accepted.contractId) || !hash(accepted.evidenceSha256) || !text(accepted.acceptedAt)
        || !/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(accepted.acceptedAt) || !Number.isFinite(Date.parse(accepted.acceptedAt))) throw invalid();
      state = { ...state!, accepted: true, contractId: accepted.contractId };
      if (submissionIntent === "pos") {
        const updated = await load();
        if (!current(context, version)) return;
        if (!updated || !canOperate()) throw new ContractError("La aceptación se registró, pero aún no pudimos confirmar el acceso operativo. Actualiza el acuerdo antes de abrir el POS.");
      }
      const continuation = intent === submissionIntent && dialog.open ? submissionIntent : null;
      form.reset(); kindChanged(); render(); intent = null;
      get("[data-contract-acceptance]").textContent = `Contrato ${accepted.contractId}. Aceptado: ${accepted.acceptedAt}. SHA-256 de evidencia: ${accepted.evidenceSha256}.`;
      status.textContent = "Contrato aceptado. El pago se confirma por separado en el checkout.";
      dialog.close();
      // Only this explicit submit can resume payment. Loading/retrying/receipts never do.
      if (continuation === "payment" && canContinue()) await options.onContinue();
      if (continuation === "pos" && canOperate()) await options.onOperate?.();
    } catch (error) {
      if (current(context, version)) {
        dialogStatus.textContent = contractMessage(error, "No pudimos confirmar si se registró la aceptación. Revisa tu conexión y actualiza el acuerdo desde Mi cuenta antes de continuar.");
        status.textContent = dialogStatus.textContent;
      }
    } finally {
      if (current(context, version)) { busy = false; accept.disabled = !state || state.accepted; retry.disabled = false; }
    }
  });
  receipt.addEventListener("click", async () => {
    const contractId = state?.operationalAccess?.accepted ? state.operationalAccess.contractId : state?.accepted ? state.contractId : null;
    if (busy || pending || !state?.canAccept || !options.getContext()?.canContract || !contractId || !owner || !current(owner)) return;
    const context = owner, version = generation;
    busy = true; receipt.disabled = true; clearEvidence(); form.hidden = true;
    dialogStatus.textContent = "Consultando constancia privada…";
    if (!dialog.open) dialog.showModal();
    try {
      const body = await request(context, version, `/${encodeURIComponent(contractId)}/receipt`);
      if (body === null || !current(context, version)) return;
      const saved = readContractReceipt(body, context, contractId);
      renderContractDocuments(get("[data-contract-documents]"), saved.package);
      renderContractOffer(get("[data-contract-offer]"), saved.offer);
      get("[data-contract-version]").textContent = `Versión aceptada: ${saved.package.version}. SHA-256 del paquete: ${saved.packageSha256}. SHA-256 de la oferta: ${saved.offerSha256}.`;
      get("[data-contract-acceptance]").textContent = `Contrato ${contractId}. Aceptado: ${saved.acceptedAt}. SHA-256 de evidencia: ${saved.evidenceSha256}. No acredita pago ni autoriza renovación.`;
      get("[data-contract-evidence]").textContent = JSON.stringify(body, null, 2);
      get("[data-contract-evidence-section]").hidden = false;
      dialogStatus.textContent = "";
    } catch (error) {
      if (current(context, version)) dialogStatus.textContent = contractMessage(error, "No pudimos consultar la constancia. Revisa tu conexión y vuelve a intentarlo desde Mi cuenta.");
    } finally {
      if (current(context, version)) { busy = false; receipt.disabled = false; }
    }
  });
  retry.addEventListener("click", () => { if (!busy && !pending) void refresh(); });
  input("kind").addEventListener("change", kindChanged);
  get("[data-contract-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    intent = null; form.reset(); kindChanged(); clearEvidence();
    if (!busy) attempt = null;
  });
  get("[data-contract-print]").addEventListener("click", () => {
    if (owner && current(owner) && !get("[data-contract-evidence-section]").hidden) {
      for (const detail of Array.from(get("[data-contract-documents]").children)) (detail as HTMLDetailsElement).open = true;
      window.print();
    }
  });
  reset();
  return { reset, refresh, beforeCheckout, canContinue, beforeOperation, canOperate };
}
