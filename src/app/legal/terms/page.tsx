'use client';

import { LegalDocumentView } from '../../dev-en/_components/legal-document-view';
import { TERMS_SECTIONS, TERMS_LEDE } from '../../dev-en/_lib/legal-content';

export default function TermsPage() {
  return (
    <LegalDocumentView
      kind="terms"
      title="Terms of Service"
      zhTitle="服务条款"
      lede={TERMS_LEDE}
      sections={TERMS_SECTIONS}
    />
  );
}
