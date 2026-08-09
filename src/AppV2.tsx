// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Root entry point
// Routes: Landing → Onboarding Wizard (first-time) → App Shell
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { OrgProvider, useOrg } from '@/store/orgStore';
import OnboardingWizard from '@/pages/onboarding/OnboardingWizard';
import AppShellV2 from '@/v2/AppShellV2';
import LandingV2 from '@/v2/LandingV2';

// ─── Inner router — has access to org state ───────────────────────────────────

function AppRouter() {
  const { org, loading } = useOrg();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm">Loading AgroNexus…</p>
        </div>
      </div>
    );
  }

  // No org yet — show landing / sign-up page
  if (!org) return <LandingV2 />;

  // Org exists but onboarding not finished — continue wizard
  if (!org.onboardingComplete) return <OnboardingWizard />;

  // Fully configured — show the main application
  return <AppShellV2 />;
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function AppV2() {
  return (
    <OrgProvider>
      <AppRouter />
    </OrgProvider>
  );
}
