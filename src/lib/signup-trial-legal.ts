import { createHash } from 'node:crypto';
import packet from '../content/signup-trial-qa-2026-11-25.json' with { type: 'json' };
import { SIGNUP_TRIAL_QA_VERSION } from './registration-legal';

// Same JSON canonicalization as SaaS contractDigest. Arrays retain source order;
// only object keys are sorted. Never hash a rendered article or an augmented doc.
export function canonicalLegalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    const encoded = JSON.stringify(value);
    if (encoded === undefined) throw new TypeError('Valor canónico inválido.');
    return encoded;
  }
  if (Array.isArray(value)) return `[${value.map(canonicalLegalJson).join(',')}]`;
  return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalLegalJson(entry)}`).join(',')}}`;
}
export function signupLegalDigest(value: unknown): string {
  return createHash('sha256').update(canonicalLegalJson(value)).digest('hex');
}

if (packet.version !== SIGNUP_TRIAL_QA_VERSION || packet.scope !== 'staging_trial_qa' || packet.documents.length !== 2
  || packet.documents[0]?.type !== 'terms' || packet.documents[0]?.slug !== 'terminos'
  || packet.documents[1]?.type !== 'privacy' || packet.documents[1]?.slug !== 'privacidad') {
  throw new Error('Fuente de registro legal QA incompatible.');
}
for (const document of packet.documents) {
  const ids = document.sections.map(section => section.id);
  if (!document.title.trim() || !ids.length || new Set(ids).size !== ids.length || document.sections.some(section =>
    !/^[a-z][a-z0-9-]*$/.test(section.id) || !section.heading.trim() || !section.paragraphs.length
    || section.paragraphs.some(paragraph => !paragraph.trim()))) throw new Error('Documento legal QA incompleto.');
}

export const signupTrialLegalPacket = packet;
export const signupTrialLegalDocuments = packet.documents.map(document => Object.freeze({ ...document, sha256: signupLegalDigest(document) }));
export type SignupTrialLegalDocument = typeof signupTrialLegalDocuments[number];
