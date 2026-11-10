import { withCheckoutReturn } from './checkout-return';

export type RecoveryPeriod = {
  subscriptionId: string;
  subscriptionPeriodId: string;
  periodStart: string;
  periodEnd: string;
  needsFurtherRecovery: boolean;
};
export type RecoveryCheckout = {
  checkoutSessionId: string;
  checkoutUrl: string;
  reference: string;
  amountInCents: number;
  currency: 'COP';
  expirationTime: string;
  recovery: RecoveryPeriod;
};
export type RecoveryStatus = RecoveryPeriod & {
  coveredThrough: string;
  subscriptionStatus: string;
  tenantStatus: string;
};
export type RecoveryOffer = {
  type: 'recovery';
  subscriptionId: string;
  status: 'available' | 'pending_payment' | 'blocked';
  blockReason: 'not_due' | 'cancellation' | 'payment_pending' | 'requires_review' | 'plan_change_pending' | null;
  periodStart: string;
  periodEnd: string;
  amountMinor: number;
  currency: 'COP';
  needsFurtherRecovery: boolean;
  orderId: string | null;
  checkoutSessionId: string | null;
  expiresAt: string | null;
};

export type RenewalIssue = {
  subscriptionPeriodId: string;
  status: 'failed';
  paymentStatus: 'declined';
  periodStart: string;
  periodEnd: string;
  amountMinor: number;
  currency: 'COP';
  reference: string;
  recordedAt: string;
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const utc = (value: unknown): value is string => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 19) === value.slice(0, 19);
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

export function readRenewalIssue(value: unknown): RenewalIssue | null {
  if (value === undefined || value === null) return null;
  if (!object(value) || Array.isArray(value)
      || typeof value.subscriptionPeriodId !== 'string' || !uuid.test(value.subscriptionPeriodId)
      || value.status !== 'failed' || value.paymentStatus !== 'declined'
      || !utc(value.periodStart) || !utc(value.periodEnd) || !utc(value.recordedAt)
      || Date.parse(value.periodEnd) <= Date.parse(value.periodStart)
      || !Number.isSafeInteger(value.amountMinor) || Number(value.amountMinor) <= 0 || value.currency !== 'COP'
      || typeof value.reference !== 'string' || !value.reference.trim()
      || value.reference !== value.reference.trim() || /[\u0000-\u001f\u007f]/.test(value.reference)) {
    throw new Error('No pudimos comprobar el detalle de la renovación rechazada. Actualiza Mi cuenta.');
  }
  return value as RenewalIssue;
}

export function readRecoveryOffer(value: unknown, subscriptionId: string): RecoveryOffer {
  if (!object(value) || value.type !== 'recovery' || typeof value.subscriptionId !== 'string'
      || !uuid.test(value.subscriptionId) || value.subscriptionId.toLowerCase() !== subscriptionId.toLowerCase()
      || typeof value.status !== 'string' || !['available', 'pending_payment', 'blocked'].includes(value.status)
      || !(value.blockReason === null || typeof value.blockReason === 'string' && ['not_due', 'cancellation', 'payment_pending', 'requires_review', 'plan_change_pending'].includes(value.blockReason))) {
    throw new Error('No pudimos comprobar la oferta de recuperación. Actualiza Mi cuenta.');
  }
  if (!utc(value.periodStart) || !utc(value.periodEnd)
      || Date.parse(value.periodEnd) <= Date.parse(value.periodStart) || value.currency !== 'COP'
      || !Number.isSafeInteger(value.amountMinor) || Number(value.amountMinor) <= 0
      || typeof value.needsFurtherRecovery !== 'boolean'
      || (value.status !== 'blocked' && value.blockReason !== null)
      || ![value.orderId, value.checkoutSessionId].every(id => id === null || typeof id === 'string' && uuid.test(id))
      || !(value.expiresAt === null || utc(value.expiresAt))) {
    throw new Error('No pudimos comprobar el importe o período de recuperación. Actualiza Mi cuenta.');
  }
  return value as RecoveryOffer;
}

export function readRecoveryPeriod(value: unknown): RecoveryPeriod {
  if (!object(value) || typeof value.subscriptionId !== 'string' || !uuid.test(value.subscriptionId)
      || typeof value.subscriptionPeriodId !== 'string' || !uuid.test(value.subscriptionPeriodId)
      || !utc(value.periodStart) || !utc(value.periodEnd) || Date.parse(value.periodEnd) <= Date.parse(value.periodStart)
      || typeof value.needsFurtherRecovery !== 'boolean') {
    throw new Error('No pudimos comprobar el período de recuperación. Actualiza Mi cuenta.');
  }
  return value as RecoveryPeriod;
}

export function readRecoveryCheckout(value: unknown, expected: { subscriptionId: string; expectedPeriodStart: string }, origin: string): RecoveryCheckout {
  if (!object(value) || typeof value.checkoutSessionId !== 'string' || !uuid.test(value.checkoutSessionId)
      || typeof value.checkoutUrl !== 'string' || typeof value.reference !== 'string' || !value.reference
      || !Number.isSafeInteger(value.amountInCents) || Number(value.amountInCents) <= 0 || value.currency !== 'COP'
      || !utc(value.expirationTime)) throw new Error('No pudimos comprobar la orden de recuperación. Actualiza Mi cuenta.');
  const recovery = readRecoveryPeriod(value.recovery);
  if (recovery.subscriptionId.toLowerCase() !== expected.subscriptionId.toLowerCase()
      || Date.parse(recovery.periodStart) !== Date.parse(expected.expectedPeriodStart)) {
    throw new Error('El período cambió. Actualiza Mi cuenta antes de continuar.');
  }
  const checkoutUrl = withCheckoutReturn(value.checkoutUrl, value.checkoutSessionId, origin);
  const parameters = new URL(checkoutUrl).searchParams;
  for (const [name, expectedValue] of Object.entries({ reference: value.reference,
    currency: value.currency, 'amount-in-cents': String(value.amountInCents), 'expiration-time': value.expirationTime })) {
    if (parameters.getAll(name).length !== 1 || parameters.get(name) !== expectedValue) {
      throw new Error('Los datos del checkout no coinciden con el período mostrado. Actualiza Mi cuenta.');
    }
  }
  return { ...value, checkoutUrl, recovery } as RecoveryCheckout;
}

export function readRecoveryStatus(value: unknown): RecoveryStatus {
  const period = readRecoveryPeriod(value);
  if (!object(value) || !utc(value.coveredThrough)
      || typeof value.subscriptionStatus !== 'string' || !['pending', 'active', 'past_due', 'grace', 'restricted', 'suspended', 'cancel_at_period_end', 'cancelled'].includes(value.subscriptionStatus)
      || typeof value.tenantStatus !== 'string' || !['pending', 'provisioning', 'active', 'restricted', 'suspended', 'failed'].includes(value.tenantStatus)) {
    throw new Error('No pudimos comprobar el estado de recuperación. Consulta Mi cuenta.');
  }
  return { ...period, coveredThrough: value.coveredThrough,
    subscriptionStatus: String(value.subscriptionStatus), tenantStatus: String(value.tenantStatus) };
}

export function recoveryDate(value: string): string {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'long', timeZone: 'UTC' }).format(new Date(value));
}

export function recoveryPeriodText(period: Pick<RecoveryPeriod, 'periodStart' | 'periodEnd'>): string {
  return `Desde ${recoveryDate(period.periodStart)} hasta ${recoveryDate(period.periodEnd)} (UTC).`;
}

export function recoveryAmount(amountInCents: number, currency: string): string {
  return `${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amountInCents / 100)} ${currency}`;
}

// A hint can only suppress the generic onboarding message. It never proves a
// payment, supplies receipt data, or enables access; the API remains authoritative.
export function rememberRecoveryCheckout(id: string, getStorage: () => Pick<Storage, 'setItem'>): void {
  if (!uuid.test(id)) return;
  try { getStorage().setItem(`cripton:recovery:${id.toLowerCase()}`, 'true'); } catch { /* Storage is optional. */ }
}

export function isKnownRecoveryCheckout(id: string, getStorage: () => Pick<Storage, 'getItem'>): boolean {
  if (!uuid.test(id)) return false;
  try { return getStorage().getItem(`cripton:recovery:${id.toLowerCase()}`) === 'true'; } catch { return false; }
}
