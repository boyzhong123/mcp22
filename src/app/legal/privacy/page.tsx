'use client';

import { LegalDocumentView } from '../../dev-en/_components/legal-document-view';
import { PRIVACY_SECTIONS, PRIVACY_LEDE } from '../../dev-en/_lib/legal-content';

export default function PrivacyPage() {
  return (
    <LegalDocumentView
      kind="privacy"
      title="Privacy Policy"
      zhTitle="隐私政策"
      lede={PRIVACY_LEDE}
      sections={PRIVACY_SECTIONS}
    />
  );
}
