import { permanentRedirect } from 'next/navigation';

export default function LegacyVoiceAgentPage() {
  permanentRedirect('/solutions/voice-agent');
}
