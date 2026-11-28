import packet from '../../contracts/legal/staging-minimum-2026-11-28.json' with { type: 'json' };
import { readContractPackage } from './customer-contract';
import { MINIMUM_SLA_QA_VERSION } from './registration-legal';
import { signupLegalDigest } from './signup-trial-legal';

// Reuse the account validator; hashes always cover the original canonical source.
readContractPackage(packet);
if (packet.version !== MINIMUM_SLA_QA_VERSION || packet.scope !== 'staging_qa'
  || packet.documents.map(document => document.slug).join(',') !== 'terminos,privacidad,tratamiento-por-cuenta-del-cliente') {
  throw new Error('Fuente contractual con ANS incompatible.');
}
export const minimumSlaLegalPacket = packet;
export const minimumSlaLegalSha256 = signupLegalDigest(packet);
if (minimumSlaLegalSha256 !== '9190257110fcc6112dbf9d7cec992ec1faf815dfd4733b0040824d71f0e4abfb') {
  throw new Error('Huella contractual con ANS incompatible.');
}
export const minimumSlaLegalDocuments = packet.documents.map(document => Object.freeze({ ...document, sha256: signupLegalDigest(document) }));
export type MinimumSlaLegalDocument = typeof minimumSlaLegalDocuments[number];
export const minimumSlaTerms = minimumSlaLegalDocuments[0];
// This is a view of the terms, never a fourth contractual document or acceptance.
export const minimumSlaSections = minimumSlaTerms.sections.filter(section =>
  section.id === 'soporte-y-continuidad' || section.id.startsWith('ans-'));
if (minimumSlaSections.map(section => section.id).join(',') !==
  'soporte-y-continuidad,ans-alcance,ans-plazos,ans-prioridades,ans-resolucion,ans-mantenimiento,ans-derechos') {
  throw new Error('Secciones del ANS incompletas.');
}
