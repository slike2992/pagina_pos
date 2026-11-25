export const SIGNUP_TRIAL_QA_VERSION = '2026-11-25-prueba-qa';
export const LEGACY_REGISTRATION_LEGAL_VERSION = '2026-09-01';

type LegalEnvironment = Readonly<{
  PUBLIC_SITE_URL?: string;
  PUBLIC_REGISTRATION_LEGAL_VERSION?: string;
}>;

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
  if (version !== SIGNUP_TRIAL_QA_VERSION) throw new Error('Versión de registro legal no admitida.');
  if (!isSignupTrialQaSite(environment.PUBLIC_SITE_URL)) {
    throw new Error('La versión legal de prueba QA solo puede seleccionarse en https://staging.cripton.com.co.');
  }
  const prefix = `/legal/versiones/${SIGNUP_TRIAL_QA_VERSION}`;
  return Object.freeze({ version: SIGNUP_TRIAL_QA_VERSION, stagingTrialQa: true,
    termsHref: `${prefix}/terminos/`, privacyHref: `${prefix}/privacidad/` });
}
