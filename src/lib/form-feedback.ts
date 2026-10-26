type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type Feedback = { validate: () => boolean };

const bindings = new WeakMap<HTMLFormElement, Feedback>();
let nextMessageId = 0;

const isField = (element: Element): element is Field =>
  element instanceof HTMLInputElement
  || element instanceof HTMLSelectElement
  || element instanceof HTMLTextAreaElement;

function messageFor(field: Field): string {
  if (!field.willValidate) return "";
  const validity = field.validity;
  const checkable = field instanceof HTMLInputElement
    && (field.type === "checkbox" || field.type === "radio");
  const text = field instanceof HTMLTextAreaElement
    || (field instanceof HTMLInputElement && !checkable
      && !["number", "range", "date", "time", "month", "week", "datetime-local", "file", "color"].includes(field.type));

  if (validity.valueMissing || (text && field.required && !field.value.trim())) {
    return checkable ? "Marca esta casilla para continuar." : "Completa este campo.";
  }
  if (validity.typeMismatch) {
    return field instanceof HTMLInputElement && field.type === "email"
      ? "Escribe un correo electrónico válido." : "Escribe un valor válido.";
  }
  // Native length flags can remain false for values assigned by JavaScript.
  // Measure without changing the value used by FormData or the API payload.
  if (text) {
    const input = field as HTMLInputElement | HTMLTextAreaElement;
    if (input.value.length && input.minLength >= 0 && input.value.trim().length < input.minLength) {
      return `Usa al menos ${input.minLength} caracteres.`;
    }
    if (input.maxLength >= 0 && input.value.length > input.maxLength) {
      return `Usa como máximo ${input.maxLength} caracteres.`;
    }
  }
  if (validity.rangeOverflow && field instanceof HTMLInputElement) {
    return `El valor debe ser menor o igual a ${field.max}.`;
  }
  if (validity.rangeUnderflow && field instanceof HTMLInputElement) {
    return `El valor debe ser mayor o igual a ${field.min}.`;
  }
  return validity.valid ? "" : "Revisa este campo.";
}

/**
 * Enhances native constraints with Spanish inline feedback. Bind once (repeated
 * calls return the same controller). The caller prevents submit and calls
 * validate() before its own readiness checks and action; this helper never sends
 * data. Markup must keep native constraints and omit novalidate for the fallback.
 * Messages use .field-error[data-form-feedback]; existing descriptions survive.
 */
export function bindFormFeedback(form: HTMLFormElement): { validate: () => boolean } {
  const existing = bindings.get(form);
  if (existing) return existing;

  const messages = new Map<Field, HTMLParagraphElement>();
  const fields = () => Array.from(form.elements).filter(isField);
  const render = (field: Field, message: string) => {
    let node = messages.get(field);
    if (message && !node) {
      node = form.ownerDocument.createElement("p");
      do { node.id = `form-feedback-${++nextMessageId}`; }
      while (form.ownerDocument.getElementById(node.id));
      node.className = "field-error";
      node.style.gridColumn = "1 / -1";
      node.dataset.formFeedback = "";
      // Keep checkbox feedback outside a wrapping label and its flex layout.
      (field.closest("label") ?? field).after(node);
      messages.set(field, node);
    }
    if (!node) return;
    node.textContent = message;
    node.hidden = !message;
    const descriptions = (field.getAttribute("aria-describedby") ?? "")
      .split(/\s+/).filter(token => token && token !== node.id);
    if (message) {
      field.setAttribute("aria-invalid", "true");
      descriptions.push(node.id);
    } else {
      field.removeAttribute("aria-invalid");
    }
    if (descriptions.length) field.setAttribute("aria-describedby", descriptions.join(" "));
    else field.removeAttribute("aria-describedby");
  };

  const feedback = {
    validate: () => {
      let firstInvalid: Field | undefined;
      for (const field of fields()) {
        const message = messageFor(field);
        render(field, message);
        if (message && !firstInvalid) firstInvalid = field;
      }
      firstInvalid?.focus();
      return !firstInvalid;
    },
  };
  const correct = (event: Event) => {
    const field = event.target;
    if (field instanceof Element && isField(field) && messages.has(field)) {
      render(field, messageFor(field));
    }
  };
  form.addEventListener("input", correct);
  form.addEventListener("change", correct);
  form.addEventListener("reset", () => {
    for (const field of messages.keys()) render(field, "");
  });
  form.noValidate = true;
  bindings.set(form, feedback);
  return feedback;
}
