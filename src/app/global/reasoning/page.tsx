import { AmbientBackdrop, BackToOverview, SiteFooter, TopNav } from '../_chrome';
import { ReasoningSection } from '../_reasoning-section';

export default function GlobalReasoningPage() {
  return (
    <div className="marketing-page relative">
      <AmbientBackdrop />
      <TopNav />
      <BackToOverview containerClassName="container mx-auto px-6 max-w-7xl pt-5" />
      <ReasoningSection />
      <SiteFooter />
    </div>
  );
}
