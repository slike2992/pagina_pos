export const SIGNUP_TRIAL_QA_VERSION = '2026-11-25-prueba-qa';
export const SIGNUP_MINIMUM_QA_VERSION = '2026-11-25-prueba-minima-qa';
export const SIGNUP_MINIMUM_ADDRESS_QA_VERSION = '2026-11-27-prueba-minima-qa';
export const SIGNUP_MINIMUM_SLA_QA_VERSION = '2026-11-28-prueba-minima-qa';
export const MINIMUM_SLA_QA_VERSION = '2026-11-28-minimo-qa';
export const MINIMUM_SLA_QA_HREF = `/legal/versiones/${MINIMUM_SLA_QA_VERSION}/sla/`;
export const SIGNUP_PRODUCTION_VERSION = '2026-11-28-registro-prod';
export const MINIMUM_PRODUCTION_VERSION = '2026-11-28-minimo-prod';
export const MINIMUM_PRODUCTION_SLA_HREF = `/legal/versiones/${MINIMUM_PRODUCTION_VERSION}/sla/`;
export const LEGACY_REGISTRATION_LEGAL_VERSION = '2026-09-01';

type LegalEnvironment = Readonly<{
  PUBLIC_SITE_URL?: string;
  PUBLIC_REGISTRATION_LEGAL_VERSION?: string;
  PUBLIC_SAAS_API_URL?: string;
  PUBLIC_POS_URL?: string;
}>;

export function isProductionLegalSite(siteUrl?: string): boolean {
  if (!siteUrl) return false;
  try {
    const url = new URL(siteUrl);
    return ['https://cripton.com.co', 'https://www.cripton.com.co'].includes(url.origin)
      && url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password;
  } catch { return false; }
}

export function assertProductionLegalConfiguration(environment: LegalEnvironment): void {
  if (environment.PUBLIC_REGISTRATION_LEGAL_VERSION !== SIGNUP_PRODUCTION_VERSION) return;
  registrationLegalLinks(environment);
  if (environment.PUBLIC_SAAS_API_URL !== 'https://api.cripton.com.co'
    || environment.PUBLIC_POS_URL !== 'https://pos.cripton.com.co') {
    throw new Error('La selección legal productiva requiere API y POS productivos explícitos y concordantes.');
  }
}

// API remains the acceptance authority. A production build must not accept a
// QA/legacy catalog, even if a proxy or endpoint was configured incorrectly.
export function readProductionRegistrationDocuments(value: unknown, siteOrigin: string) {
  if (!isProductionLegalSite(siteOrigin) || !Array.isArray(value) || value.length !== 2) {
    throw new Error('Catálogo legal productivo incompatible.');
  }
  return (['terms', 'privacy'] as const).map(type => {
    const matches = value.filter(item => item && typeof item === 'object' && item.type === type);
    const item = matches[0];
    if (matches.length !== 1 || item.version !== SIGNUP_PRODUCTION_VERSION || typeof item.contentUrl !== 'string') {
      throw new Error('Catálogo legal productivo incompatible.');
    }
    const url = new URL(item.contentUrl, siteOrigin);
    if (!isProductionLegalSite(url.origin) || url.username || url.password || url.search || url.hash
      || url.pathname !== `/legal/versiones/${SIGNUP_PRODUCTION_VERSION}/${type === 'terms' ? 'terminos' : 'privacidad'}/`) {
      throw new Error('Enlace legal productivo incompatible.');
    }
    return { type, version: SIGNUP_PRODUCTION_VERSION, contentUrl: url.href };
  });
}

export function isSignupTrialQaSite(siteUrl?: string): boolean {
  if (!siteUrl) return false;
  try {
    const url = new URL(siteUrl);
    return url.protocol === 'https:' && url.host === 'staging.cripton.com.co'
      && !url.username && !url.password;
  } catch { return false; }
}

// This is build-time link selection only. Signup acceptance/version authority
// remains with the API; no browser storage, inferred host or draft fallback.
export function registrationLegalLinks(environment: LegalEnvironment) {
  const version = environment.PUBLIC_REGISTRATION_LEGAL_VERSION;
  if (version === undefined || version === '') {
    return Object.freeze({ version: LEGACY_REGISTRATION_LEGAL_VERSION, stagingTrialQa: false,
      termsHref: '/legal/terminos/', privacyHref: '/legal/privacidad/' });
  }
  if (version === SIGNUP_PRODUCTION_VERSION) {
    if (!isProductionLegalSite(environment.PUBLIC_SITE_URL)) {
      throw new Error('La versión legal productiva solo puede seleccionarse en https://cripton.com.co o https://www.cripton.com.co.');
    }
    const prefix = `/legal/versiones/${version}`;
    return Object.freeze({ version, stagingTrialQa: false, production: true,
      termsHref: `${prefix}/terminos/`, privacyHref: `${prefix}/privacidad/`, slaHref: MINIMUM_PRODUCTION_SLA_HREF });
  }
  if (version !== SIGNUP_TRIAL_QA_VERSION && version !== SIGNUP_MINIMUM_QA_VERSION
    && version !== SIGNUP_MINIMUM_ADDRESS_QA_VERSION
    && version !== SIGNUP_MINIMUM_SLA_QA_VERSION) throw new Error('Versión de registro legal no admitida.');
  if (!isSignupTrialQaSite(environment.PUBLIC_SITE_URL)) {
    throw new Error('La versión legal de prueba QA solo puede seleccionarse en https://staging.cripton.com.co.');
  }
  const prefix = `/legal/versiones/${version}`;
  return Object.freeze({ version, stagingTrialQa: true,
    ...(version === SIGNUP_MINIMUM_SLA_QA_VERSION ? { slaHref: MINIMUM_SLA_QA_HREF } : {}),
    termsHref: `${prefix}/terminos/`, privacyHref: `${prefix}/privacidad/` });
}
