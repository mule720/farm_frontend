import React, { useState, useEffect, createContext, useContext } from 'react';
import Landing from './farm/Landing';
import AppShell from './farm/AppShell';
import AdminDashboard from './farm/AdminDashboard';
import AuthModal from './farm/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionProvider, useSubscription, UpgradeModal } from '@/contexts/SubscriptionContext';
import { Loader2, X, Zap, AlertTriangle } from 'lucide-react';

type AppView = 'landing' | 'app' | 'admin';

interface AgroNexusContextType {
  view: AppView;
  setView: (v: AppView) => void;
  openUpgrade: (moduleId: string) => void;
}

const AgroNexusContext = createContext<AgroNexusContextType | null>(null);

export function useAgroNexus() {
  const ctx = useContext(AgroNexusContext);
  if (!ctx) throw new Error('useAgroNexus must be inside AgroNexusProvider');
  return ctx;
}

/** @deprecated use useAgroNexus */
export const useFarmPulse = useAgroNexus;

// ─── Trial banner ─────────────────────────────────────────────────────────────

function TrialBanner({ onUpgrade }: { onUpgrade: () => void }) {
  const { trialDaysRemaining, isTrialExpired, planName } = useSubscription();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  if (trialDaysRemaining === null) return null; // not on trial

  if (isTrialExpired) {
    return (
      <div className="bg-red-600 text-white px-4 py-2.5 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">Your 14-day free trial has expired.</span>
          <span className="text-red-200 hidden sm:inline">Choose a plan to continue using AgroNexus.</span>
        </div>
        <button onClick={onUpgrade} className="ml-4 px-3 py-1 bg-white text-red-700 rounded-lg text-xs font-semibold hover:bg-red-50 flex-shrink-0">
          Choose Plan →
        </button>
      </div>
    );
  }

  const urgent = trialDaysRemaining <= 3;
  return (
    <div className={`${urgent ? 'bg-amber-500' : 'bg-indigo-600'} text-white px-4 py-2 flex items-center justify-between text-sm`}>
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 flex-shrink-0" />
        <span>
          <span className="font-semibold">{trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left</span>
          {' '}on your free trial.
          <span className="hidden sm:inline text-indigo-200"> Upgrade now to keep your data and all features.</span>
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        <button onClick={onUpgrade} className="px-3 py-1 bg-white text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-50">
          Upgrade
        </button>
        {!urgent && (
          <button onClick={() => setDismissed(true)} className="p-1 hover:bg-white/10 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Inner layout (has access to SubscriptionContext) ────────────────────────

function InnerLayout() {
  const [view, setView] = useState<AppView>('landing');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [upgradeModule, setUpgradeModule] = useState<string | null>(null);
  const { user, profile, loading, hasRole, signOut } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user && view === 'landing') {
      setAuthOpen(false);
      setView(profile?.role === 'saas_admin' ? 'admin' : 'app');
    }
    if (!user && (view === 'app' || view === 'admin')) {
      setView('landing');
    }
  }, [user, profile, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading AgroNexus...
        </div>
      </div>
    );
  }

  function requireAuth(targetView: AppView, mode: 'signin' | 'signup' = 'signin') {
    if (!user) { setAuthMode(mode); setAuthOpen(true); return; }
    if (targetView === 'admin' && profile?.role !== 'saas_admin') return;
    setView(targetView);
  }

  async function handleLogout() { await signOut(); setView('landing'); }

  if (view === 'admin' && user) {
    if (!hasRole('saas_admin')) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-md text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-sm text-slate-600 mb-4">Platform Admin is restricted to AgroNexus staff only.</p>
            <button onClick={() => setView('landing')} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">← Back</button>
          </div>
        </div>
      );
    }
    return (
      <AgroNexusContext.Provider value={{ view, setView, openUpgrade: setUpgradeModule }}>
        <AdminDashboard onBack={() => setView('landing')} />
      </AgroNexusContext.Provider>
    );
  }

  return (
    <AgroNexusContext.Provider value={{ view, setView, openUpgrade: setUpgradeModule }}>
      <div className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen flex flex-col">
        {view === 'landing' && (
          <Landing
            onLaunchApp={() => requireAuth('app', 'signup')}
            onAdminLogin={() => requireAuth('admin', 'signin')}
            onSignIn={() => { setAuthMode('signin'); setAuthOpen(true); }}
            onSignUp={() => { setAuthMode('signup'); setAuthOpen(true); }}
            isAuthed={!!user}
            userName={profile?.full_name}
          />
        )}
        {view === 'app' && user && (
          <div className="flex flex-col flex-1">
            <TrialBanner onUpgrade={() => setUpgradeModule('__all__')} />
            <AppShell onAdminClick={() => requireAuth('admin')} onLogout={handleLogout} />
          </div>
        )}
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
        {upgradeModule && <UpgradeModal moduleId={upgradeModule} onClose={() => setUpgradeModule(null)} />}
      </div>
    </AgroNexusContext.Provider>
  );
}

const AppLayout: React.FC = () => (
  <SubscriptionProvider>
    <InnerLayout />
  </SubscriptionProvider>
);

export default AppLayout;
