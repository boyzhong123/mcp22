import { AmbientBackdrop, BackToOverview, SiteFooter, TopNav } from '../_chrome';
import { ReasoningSection } from '../_reasoning-section';

export default function GlobalReasoningPage() {
  return (
    <div className="marketing-page relative">
      <AmbientBackdrop />
      <TopNav />
      <BackToOverview
        current="Voice Agent"
        containerClassName="container mx-auto px-6 max-w-7xl pt-6"
      />
      <ReasoningSection />
      <SiteFooter />
    </div>
  );
}
