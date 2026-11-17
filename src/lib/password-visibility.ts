export function bindPasswordVisibility(root: Document) {
  root.querySelectorAll<HTMLInputElement>('input[type="password"]').forEach((input, index) => {
    if (input.dataset.passwordToggleBound) return;
    input.dataset.passwordToggleBound = "true";
    if (!input.id) input.id = `password-field-${index}`;
    const wrapper = root.createElement("span"); wrapper.className = "password-control";
    const button = root.createElement("button"); button.type = "button";
    button.setAttribute("aria-controls", input.id); button.setAttribute("aria-pressed", "false"); button.setAttribute("aria-label", "Mostrar contraseña");
    button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
    input.before(wrapper); wrapper.append(input, button);
    const hide = () => { input.type = "password"; button.setAttribute("aria-label", "Mostrar contraseña"); button.setAttribute("aria-pressed", "false"); };
    button.addEventListener("click", () => {
      const reveal = input.type === "password"; input.type = reveal ? "text" : "password";
      button.setAttribute("aria-label", reveal ? "Ocultar contraseña" : "Mostrar contraseña"); button.setAttribute("aria-pressed", String(reveal));
      input.focus({ preventScroll: true });
    });
    input.form?.addEventListener("submit", hide); input.form?.addEventListener("reset", hide);
    root.addEventListener("visibilitychange", () => { if (root.hidden) hide(); });
  });
}
