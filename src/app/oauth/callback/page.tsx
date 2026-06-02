'use client';

// Doc-specified OAuth callback route: <frontend-origin>/oauth/callback.
// Re-exports the shared handler so both /oauth/callback and the legacy
// /auth/callback resolve identically.
import OAuthCallbackPage from '../../auth/callback/page';

export default OAuthCallbackPage;
