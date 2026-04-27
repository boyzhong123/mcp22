'use client';

import { AmbientBackdrop, BackToOverview, ContactSection, SiteFooter, TopNav } from '../_chrome';
import { ReasoningSection } from '../_reasoning-section';

export default function GlobalReasoningPage() {
  return (
    <div className="relative">
      <AmbientBackdrop />
      <TopNav />
      <BackToOverview containerClassName="container mx-auto px-6 max-w-7xl pt-5" />
      <ReasoningSection />
      <ContactSection />
      <SiteFooter />
    </div>
  );
}
