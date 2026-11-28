import packet from '../../contracts/legal/signup-minimum-qa-2026-11-28.json' with { type: 'json' };
import { SIGNUP_MINIMUM_SLA_QA_VERSION } from './registration-legal';
import { signupLegalDigest } from './signup-trial-legal';

if (packet.version !== SIGNUP_MINIMUM_SLA_QA_VERSION || packet.scope !== 'staging_trial_qa' || packet.documents.length !== 2
  || packet.documents[0]?.type !== 'terms' || packet.documents[0]?.slug !== 'terminos'
  || packet.documents[1]?.type !== 'privacy' || packet.documents[1]?.slug !== 'privacidad') {
  throw new Error('Fuente del registro mínimo con ANS incompatible.');
}
for (const document of packet.documents) {
  const ids = document.sections.map(section => section.id);
  if (!document.title.trim() || !ids.length || new Set(ids).size !== ids.length || document.sections.some(section =>
    !/^[a-z][a-z0-9-]*$/.test(section.id) || !section.heading.trim() || !section.paragraphs.length
    || section.paragraphs.some(paragraph => !paragraph.trim()))) throw new Error('Documento del registro mínimo incompleto.');
}

export const signupMinimumSlaLegalPacket = packet;
export const signupMinimumSlaLegalSha256 = signupLegalDigest(packet);
if (signupMinimumSlaLegalSha256 !== '69364980e64abaa00d281f7f4ce9d04828ea5b433c037620c5981201a5627467') {
  throw new Error('Huella del registro mínimo con ANS incompatible.');
}
export const signupMinimumSlaLegalDocuments = packet.documents.map(document => Object.freeze({ ...document, sha256: signupLegalDigest(document) }));
export type SignupMinimumSlaLegalDocument = typeof signupMinimumSlaLegalDocuments[number];
