/** Formatting only; neither ownership verification nor WhatsApp consent. */
export function normalizeSignupPhone(value: string): string | null {
  if (value.length > 40 || !/^[+\d\s().-]+$/.test(value)) return null;
  let compact = value.replace(/[\s().-]/g, "");
  if (compact.startsWith("00")) compact = "+" + compact.slice(2);
  if (/^(?:3\d{9}|60[1-8]\d{7})$/.test(compact)) compact = "+57" + compact;
  else if (/^57(?:3\d{9}|60[1-8]\d{7})$/.test(compact)) compact = "+" + compact;
  if (!/^\+[1-9]\d{7,14}$/.test(compact)) return null;
  if (compact.startsWith("+57") && !/^\+57(?:3\d{9}|60[1-8]\d{7})$/.test(compact)) return null;
  return compact;
}
