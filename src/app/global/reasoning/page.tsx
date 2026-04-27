'use client';

import { AmbientBackdrop, BackToOverview, ContactSection, SiteFooter, TopNav } from '../_chrome';
import { ReasoningSection } from '../_reasoning-section';

export default function GlobalReasoningPage() {
  return (
    <div className="relative">
      <AmbientBackdrop />
      <TopNav />
      <BackToOverview />
      <ReasoningSection />
      <ContactSection />
      <SiteFooter />
    </div>
  );
}
