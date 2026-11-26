import packet from '../../contracts/legal/signup-minimum-qa-2026-11-25.json' with { type: 'json' };
import { SIGNUP_MINIMUM_QA_VERSION } from './registration-legal';
import { signupLegalDigest } from './signup-trial-legal';

if (packet.version !== SIGNUP_MINIMUM_QA_VERSION || packet.scope !== 'staging_trial_qa' || packet.documents.length !== 2
  || packet.documents[0]?.type !== 'terms' || packet.documents[0]?.slug !== 'terminos'
  || packet.documents[1]?.type !== 'privacy' || packet.documents[1]?.slug !== 'privacidad') {
  throw new Error('Fuente del registro mínimo incompatible.');
}
for (const document of packet.documents) {
  const ids = document.sections.map(section => section.id);
  if (!document.title.trim() || !ids.length || new Set(ids).size !== ids.length || document.sections.some(section =>
    !/^[a-z][a-z0-9-]*$/.test(section.id) || !section.heading.trim() || !section.paragraphs.length
    || section.paragraphs.some(paragraph => !paragraph.trim()))) throw new Error('Documento del registro mínimo incompleto.');
}

export const signupMinimumLegalPacket = packet;
export const signupMinimumLegalDocuments = packet.documents.map(document => Object.freeze({ ...document, sha256: signupLegalDigest(document) }));
export type SignupMinimumLegalDocument = typeof signupMinimumLegalDocuments[number];
