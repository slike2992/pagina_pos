import packet from '../../contracts/legal/production-minimum-2026-11-28.json' with { type: 'json' };
import signup from '../../contracts/legal/signup-production-minimum-2026-11-28.json' with { type: 'json' };
import { readContractPackage } from './customer-contract';
import { MINIMUM_PRODUCTION_VERSION, SIGNUP_PRODUCTION_VERSION } from './registration-legal';
import { signupLegalDigest } from './signup-trial-legal';

readContractPackage(packet);
if (packet.version !== MINIMUM_PRODUCTION_VERSION || packet.scope !== 'production'
  || packet.documents.map(document => document.slug).join(',') !== 'terminos,privacidad,tratamiento-por-cuenta-del-cliente'
  || signup.version !== SIGNUP_PRODUCTION_VERSION || signup.scope !== 'production_signup'
  || signup.documents.length !== 2 || signup.documents[0]?.type !== 'terms' || signup.documents[0]?.slug !== 'terminos'
  || signup.documents[1]?.type !== 'privacy' || signup.documents[1]?.slug !== 'privacidad') {
  throw new Error('Fuentes legales productivas incompatibles.');
}
for (const document of signup.documents) {
  const ids = document.sections.map(section => section.id);
  if (!document.title.trim() || !ids.length || new Set(ids).size !== ids.length || document.sections.some(section =>
    !/^[a-z][a-z0-9-]*$/.test(section.id) || !section.heading.trim() || !section.paragraphs.length
    || section.paragraphs.some(paragraph => !paragraph.trim()))) throw new Error('Documento de registro productivo incompleto.');
}
export const productionLegalPacket = packet;
export const productionSignupPacket = signup;
export const productionLegalSha256 = signupLegalDigest(packet);
export const productionSignupSha256 = signupLegalDigest(signup);
if (productionLegalSha256 !== '4806a0616ec5499009b15c80e0d989b8ad5765fdfbc1677e5ea1e29710c3aaf9'
  || productionSignupSha256 !== '82dbf9d30a27dbf9448671ff50818f6da9b003b20de703eb664ac2e04df9c0b7') {
  throw new Error('Huellas legales productivas incompatibles.');
}
export const productionLegalDocuments = packet.documents.map(document => Object.freeze({ ...document, sha256: signupLegalDigest(document) }));
export const productionSignupDocuments = signup.documents.map(document => Object.freeze({ ...document, sha256: signupLegalDigest(document) }));
export type ProductionLegalDocument = typeof productionLegalDocuments[number];
export type ProductionSignupDocument = typeof productionSignupDocuments[number];
export const productionTerms = productionLegalDocuments[0];
export const productionSlaSections = productionTerms.sections.filter(section => section.id === 'soporte-y-continuidad' || section.id.startsWith('ans-'));
if (productionSlaSections.map(section => section.id).join(',') !==
  'soporte-y-continuidad,ans-alcance,ans-plazos,ans-prioridades,ans-resolucion,ans-mantenimiento,ans-derechos') {
  throw new Error('Secciones del ANS productivo incompletas.');
}
