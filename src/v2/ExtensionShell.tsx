// ─────────────────────────────────────────────────────────────────────────────
// AGRINUXES — ExtensionShell
// App shell for extension officers (role: extension_officer). A caseload of
// consenting farms in the officer's camp / district, visit logging, and the
// same aggregated district dashboards a gov viewer sees.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import TeamPermissions from '@/pages/settings/TeamPermissions';
import PartnerDashboard from '@/pages/partner/PartnerDashboard';
import ExtensionDashboard from '@/pages/extension/ExtensionDashboard';

export const EXT_TABS = [
  { id: 'caseload',  icon: '🧑‍🌾', label: 'My Caseload' },
  { id: 'visits',    icon: '📝', label: 'Visits & Follow-ups' },
  { id: 'add',       icon: '➕', label: 'Add Farms' },
  { id: 'programmes', icon: '📂', label: 'Programmes' },
  { id: 'team',      icon: '👥', label: 'Team & Branches' },
] as const;

const TAB_MODULE: Record<string, [string, 'view' | 'create']> = { caseload: ['caseload', 'view'], visits: ['visits', 'view'], add: ['caseload', 'create'], programmes: ['programmes', 'view'], team: ['team', 'view'] };

export type ExtTab = typeof EXT_TABS[number]['id'];

export default function ExtensionShell() {
  const { profile, signOut, hasPermission, canCreate } = useAuth();
  const [activeTab, setActiveTab] = useState<ExtTab>('caseload');
  const tabs = EXT_TABS.filter(t => { const [m, a] = TAB_MODULE[t.id]; return a === 'create' ? canCreate(m) : hasPermission(m); });
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className={`fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 z-40 transition-all duration-300 flex flex-col ${open ? 'w-60' : 'w-14'}`}>
        <div className="flex items-center gap-2 px-3 py-4 border-b border-slate-800">
          <button onClick={() => setOpen(o => !o)} aria-label="Toggle sidebar"
            className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {open && (
            <div className="min-w-0">
              <div className="text-white font-bold text-sm truncate">AGRINUXES</div>
              <div className="text-emerald-400 text-xs truncate">🧑‍🌾 {profile?.full_name}</div>
              <div className="text-slate-500 text-[11px] truncate">{profile?.organization}</div>
            </div>
          )}
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${
                activeTab === tab.id ? 'bg-emerald-500/15 text-emerald-300 border-r-2 border-emerald-400'
                                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
              <span className="text-base flex-shrink-0">{tab.icon}</span>
              {open && <span className="text-sm font-medium truncate">{tab.label}</span>}
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-3 space-y-2">
          {open && <p className="text-[10px] leading-snug text-slate-500 px-1">Only farms that opted in to data sharing in your area can be added to your caseload.</p>}
          <button onClick={signOut} className="w-full flex items-center gap-3 px-2 py-2 text-slate-400 hover:text-red-400 transition-colors text-left">
            <span className="text-base flex-shrink-0">🚪</span>
            {open && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>
      <div className={`flex-1 transition-all duration-300 ${open ? 'ml-60' : 'ml-14'}`}>
        {activeTab === 'team' ? <TeamPermissions accent="emerald" /> : activeTab === 'programmes' ? <PartnerDashboard /> : <ExtensionDashboard activeTab={activeTab as Exclude<ExtTab, 'team' | 'programmes'>} setActiveTab={setActiveTab} />}
      </div>
    </div>
  );
}
