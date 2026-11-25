/** Review only: never import into signup or the active legal catalog. */
import review from './legal-review-2026-11-24.json';

export const legalDraftVersion = review.version;
export const legalDraftNotice = review.notice;

export type LegalDraftSlug = 'terminos' | 'privacidad' | 'tratamiento-por-cuenta-del-cliente';
export type LegalDraftSection = {
  id: string;
  heading: string;
  paragraphs: readonly string[];
  items?: readonly string[];
  subsections?: readonly { heading: string; paragraphs: readonly string[] }[];
};
export type LegalDraft = {
  slug: LegalDraftSlug;
  title: string;
  description: string;
  lead: string;
  pending: readonly string[];
  sections: readonly LegalDraftSection[];
};

function documentSlug(value: string): LegalDraftSlug {
  if (value !== 'terminos' && value !== 'privacidad' && value !== 'tratamiento-por-cuenta-del-cliente') {
    throw new Error('Documento de revisión jurídica desconocido.');
  }
  return value;
}

export const legalDrafts: readonly LegalDraft[] = review.documents.map(document => ({
  ...document, slug: documentSlug(document.slug),
}));
