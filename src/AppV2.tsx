// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Root entry point
// Routes:
//   No session  → LandingV2  (public marketplace + auth modal)
//   Individual  → CustomerDashboard (browse, save, profile)
//   Business    → OnboardingWizard → AppShellV2 (full farm platform)
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { OrgProvider, useOrg } from '@/store/orgStore';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import OnboardingWizard from '@/pages/onboarding/OnboardingWizard';
import AppShellV2 from '@/v2/AppShellV2';
import VendorShell from '@/v2/VendorShell';
import LandingV2 from '@/v2/LandingV2';
import CustomerDashboard from '@/pages/customer/CustomerDashboard';
import GovernmentShell from '@/v2/GovernmentShell';
import ExtensionShell from '@/v2/ExtensionShell';
import PartnerShell from '@/v2/PartnerShell';
import LenderReport from '@/pages/finance/LenderReport';

// ─── Inner router — has access to both org + auth state ──────────────────────

function AppRouter() {
  const { org, loading: orgLoading } = useOrg();
  const { profile, loading: authLoading, signOut } = useAuth();

  // ── Lender share link (/?credit=TOKEN) — public, read-only, no session needed ──
  const creditToken = new URLSearchParams(window.location.search).get('credit');
  if (creditToken) return <LenderReport token={creditToken} />;

  if (orgLoading || authLoading) {
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

  // ── Not logged in → public landing + marketplace ──────────────────────────
  if (!profile) return <LandingV2 />;

  // ── Government / partner account ──────────────────────────────────────────
  // Read-only, de-identified aggregates across consenting farms. No org
  // onboarding — a gov org holds no farm data of its own.
  if (['gov_viewer', 'gov_admin'].includes(profile.role)) return <GovernmentShell />;
  if (['extension_officer', 'extension_supervisor'].includes(profile.role)) return <ExtensionShell />;
  if (['partner_manager', 'partner_admin', 'partner_me_officer', 'partner_observer'].includes(profile.role)) return <PartnerShell />;

  // ── Individual / customer account ─────────────────────────────────────────
  // "individual" is stored as the organizationName when the user registers
  // as an individual (no org onboarding needed).
  if (profile.organization === 'individual') {
    return <CustomerDashboard onSignOut={signOut} />;
  }

  // ── Business account: no org set up yet → onboarding wizard ───────────────
  if (!org) return <OnboardingWizard />;

  // ── Business account: onboarding in progress ──────────────────────────────
  if (!org.onboardingComplete) return <OnboardingWizard />;

  // ── Business account: fully configured ────────────────────────────────────
  // Non-farmer vendors get their own shell with role-appropriate dashboards
  const bt = (profile as any)?.businessType || org.businessType;
  if (bt && bt !== 'farmer' && bt !== 'cooperative') return <VendorShell />;

  return <AppShellV2 />;
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function AppV2() {
  return (
    <AuthProvider>
      <OrgProvider>
        <AppRouter />
      </OrgProvider>
    </AuthProvider>
  );
}
