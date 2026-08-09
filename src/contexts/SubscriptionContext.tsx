import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MODULE_CATALOG, PLAN_BUNDLES, TRIAL_DAYS, calcPrice } from '@/lib/subscriptionData';
import { useAuth } from './AuthContext';

export interface SubscriptionState {
  planId: string;
  planName: string;
  enabledModules: string[];
  monthlyAmount: number;
  trialDaysRemaining: number | null;   // null = not on trial
  trialStartDate: string | null;
  isTrialExpired: boolean;
  maxUsers: number;
  isModuleEnabled: (moduleId: string) => boolean;
  setPlan: (planId: string, modules?: string[]) => void;
}

const SubscriptionContext = createContext<SubscriptionState | null>(null);

// Simulate per-org subscription stored in localStorage (keyed by org name)
function storageKey(org: string) { return `fp_sub_${org.replace(/\s+/g, '_').toLowerCase()}`; }

interface StoredSub { planId: string; modules: string[]; trialStart: string }

function loadStored(org: string): StoredSub | null {
  try {
    const raw = localStorage.getItem(storageKey(org));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSub(org: string, data: StoredSub) {
  try { localStorage.setItem(storageKey(org), JSON.stringify(data)); } catch {}
}

const CORE_IDS = MODULE_CATALOG.filter(m => m.isCore).map(m => m.id);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [planId, setPlanId] = useState('professional');
  const [enabledModules, setEnabledModules] = useState<string[]>(PLAN_BUNDLES.find(p => p.id === 'professional')!.modules);
  const [trialStart, setTrialStart] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    // saas_admin gets all modules, no trial
    if (profile.role === 'saas_admin') {
      setPlanId('enterprise');
      setEnabledModules(MODULE_CATALOG.map(m => m.id));
      setTrialStart(null);
      return;
    }
    const stored = loadStored(profile.organization || 'demo');
    if (stored) {
      setPlanId(stored.planId);
      setEnabledModules([...new Set([...CORE_IDS, ...stored.modules])]);
      setTrialStart(stored.trialStart);
    } else {
      // Default: 14-day trial on professional plan (demo: started 5 days ago)
      const demoTrialStart = new Date();
      demoTrialStart.setDate(demoTrialStart.getDate() - 5);
      const ts = demoTrialStart.toISOString().split('T')[0];
      const prof = PLAN_BUNDLES.find(p => p.id === 'professional')!;
      setPlanId('trial');
      setEnabledModules([...new Set([...CORE_IDS, ...prof.modules])]);
      setTrialStart(ts);
      saveSub(profile.organization || 'demo', { planId: 'trial', modules: prof.modules, trialStart: ts });
    }
  }, [profile?.organization, profile?.role]);

  function setPlan(newPlanId: string, customModules?: string[]) {
    let mods: string[];
    if (customModules) {
      mods = [...new Set([...CORE_IDS, ...customModules])];
    } else {
      const bundle = PLAN_BUNDLES.find(p => p.id === newPlanId);
      mods = bundle ? [...new Set([...CORE_IDS, ...bundle.modules])] : CORE_IDS;
    }
    setPlanId(newPlanId);
    setEnabledModules(mods);
    if (newPlanId !== 'trial') setTrialStart(null);
    if (profile?.organization) {
      saveSub(profile.organization, { planId: newPlanId, modules: mods, trialStart: trialStart ?? '' });
    }
  }

  const trialDaysRemaining: number | null = (() => {
    if (planId !== 'trial' || !trialStart) return null;
    const started = new Date(trialStart);
    const now = new Date();
    const daysUsed = Math.floor((now.getTime() - started.getTime()) / 86400000);
    return Math.max(0, TRIAL_DAYS - daysUsed);
  })();

  const isTrialExpired = planId === 'trial' && trialDaysRemaining === 0;
  const bundle = PLAN_BUNDLES.find(p => p.id === planId);
  const monthlyAmount = calcPrice(enabledModules.filter(id => {
    const m = MODULE_CATALOG.find(m => m.id === id);
    return m && !m.isCore;
  }));

  const isModuleEnabled = (moduleId: string): boolean => {
    if (profile?.role === 'saas_admin') return true;
    if (planId === 'suspended') return moduleId === 'dashboard' || moduleId === 'settings';
    return enabledModules.includes(moduleId);
  };

  return (
    <SubscriptionContext.Provider value={{
      planId, planName: planId === 'trial' ? 'Free Trial' : (bundle?.name ?? 'Custom'),
      enabledModules, monthlyAmount, trialDaysRemaining, trialStartDate: trialStart,
      isTrialExpired, maxUsers: bundle?.maxUsers ?? -1, isModuleEnabled, setPlan,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be inside SubscriptionProvider');
  return ctx;
}

// ─── Shared upgrade modal (rendered once at AppLayout level) ─────────────────

interface UpgradeModalProps {
  moduleId: string;   // '__all__' = general upgrade; any other = module-specific locked
  onClose: () => void;
}

const PLAN_FEATURES: Record<string, string[]> = {
  starter:      ['5 users max', '6 production modules', 'AI Smart Engine', 'Basic reports', 'Email support'],
  professional: ['20 users max', '15+ modules', 'Predictive AI & Vision', 'Weather & NDVI', 'WhatsApp alerts', 'Priority support'],
  enterprise:   ['Unlimited users', 'All 30+ modules', 'Full AI suite', 'LoRaWAN / IoT', 'Custom integrations', '24/7 dedicated support'],
};

export function UpgradeModal({ moduleId, onClose }: UpgradeModalProps) {
  const { setPlan, planId: currentPlanId, trialDaysRemaining } = useSubscription();
  const isGeneral = moduleId === '__all__';
  const mod = isGeneral ? null : MODULE_CATALOG.find(m => m.id === moduleId);

  // Plans that include this module, or all plans for general upgrade
  const eligiblePlans = isGeneral
    ? PLAN_BUNDLES
    : (PLAN_BUNDLES.filter(p => p.modules.includes(moduleId)).length > 0
        ? PLAN_BUNDLES.filter(p => p.modules.includes(moduleId))
        : PLAN_BUNDLES);

  const defaultPlan = eligiblePlans.find(p => p.popular)?.id ?? eligiblePlans[0]?.id ?? 'professional';
  const [selected, setSelected] = useState<string>(defaultPlan);

  function confirmUpgrade() {
    setPlan(selected);
    onClose();
  }

  const chosenPlan = eligiblePlans.find(p => p.id === selected) ?? eligiblePlans[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-br from-purple-700 to-indigo-700 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              {isGeneral ? (
                <>
                  <div className="text-xs font-semibold text-purple-200 uppercase tracking-wider mb-1">Upgrade Your Plan</div>
                  <h2 className="text-xl font-bold">Unlock the full AgroNexus suite</h2>
                  {trialDaysRemaining !== null && (
                    <p className="text-sm text-purple-100 mt-1">
                      {trialDaysRemaining > 0
                        ? `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} left on your free trial`
                        : 'Your free trial has ended'}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="text-xs font-semibold text-purple-200 uppercase tracking-wider mb-1">Module Locked</div>
                  <h2 className="text-xl font-bold">{mod?.label || 'This module'} requires an upgrade</h2>
                  <p className="text-sm text-purple-100 mt-1">Not included in your current plan. Choose a plan that unlocks it.</p>
                </>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg flex-shrink-0 transition-colors">
              <span className="text-white/70 text-lg leading-none">✕</span>
            </button>
          </div>
        </div>

        {/* Plan selector */}
        <div className="p-5 space-y-2">
          {eligiblePlans.map(plan => {
            const isSelected = selected === plan.id;
            const isCurrent = plan.id === currentPlanId;
            return (
              <button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {/* Radio dot */}
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSelected ? 'border-purple-600' : 'border-slate-300'}`}>
                  {isSelected && <div className="w-2 h-2 bg-purple-600 rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">{plan.name}</span>
                    {plan.popular && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Most popular</span>}
                    {isCurrent && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-medium">Current</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{plan.description} · {plan.modules.length} modules</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-slate-900">${plan.flatPrice}<span className="font-normal text-slate-400 text-xs">/mo</span></div>
                  <div className="text-[10px] text-slate-400">{plan.maxUsers === -1 ? 'Unlimited users' : `${plan.maxUsers} users`}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Feature list for selected plan */}
        {chosenPlan && PLAN_FEATURES[chosenPlan.id] && (
          <div className="px-5 pb-2">
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs font-semibold text-slate-500 mb-2">{chosenPlan.name} includes:</div>
              <div className="grid grid-cols-2 gap-1">
                {PLAN_FEATURES[chosenPlan.id].map(f => (
                  <div key={f} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="text-green-500 font-bold">✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 pb-5 pt-3 flex items-center gap-3">
          <button
            onClick={confirmUpgrade}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            Activate {chosenPlan?.name} Plan
          </button>
          <button onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors">
            Maybe later
          </button>
        </div>

        <div className="px-5 pb-4 text-center text-[10px] text-slate-400">
          No credit card required now. Plans activate after your 14-day trial ends.
        </div>
      </div>
    </div>
  );
}
