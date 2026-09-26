// ─────────────────────────────────────────────────────────────────────────────
// AGRINUXES — GovernmentShell
// App shell for government ministries, district offices, NGOs and donor
// programmes (role: gov_viewer). Read-only, de-identified aggregates across
// farms that have opted in to data sharing, plus district advisory broadcast.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import GovernmentDashboard from '@/pages/government/GovernmentDashboard';
import TeamPermissions from '@/pages/settings/TeamPermissions';
import EcosystemDashboard from '@/pages/government/EcosystemDashboard';
import NationalMap from '@/pages/government/NationalMap';
import PartnerDashboard from '@/pages/partner/PartnerDashboard';

export const GOV_TABS = [
  { id: 'overview',       icon: '🏛️', label: 'National Overview' },
  { id: 'ecosystem',      icon: '🌐', label: 'Ecosystem' },
  { id: 'map',            icon: '🗺️', label: 'National Map' },
  { id: 'production',     icon: '🌾', label: 'Production' },
  { id: 'markets',        icon: '📈', label: 'Markets & Prices' },
  { id: 'health',         icon: '🦠', label: 'Disease & Alerts' },
  { id: 'sustainability', icon: '🌍', label: 'Climate & Sustainability' },
  { id: 'registry',       icon: '🗺️', label: 'District Registry' },
  { id: 'advisories',     icon: '📣', label: 'Advisories' },
  { id: 'programmes',     icon: '📂', label: 'Programmes' },
  { id: 'team',           icon: '👥', label: 'Team & Branches' },
] as const;

const TAB_MODULE: Record<string, string> = { overview: 'gov-dashboards', ecosystem: 'gov-dashboards', map: 'gov-dashboards', production: 'gov-dashboards', markets: 'gov-dashboards', health: 'gov-dashboards', sustainability: 'gov-dashboards', registry: 'registry', advisories: 'advisories', programmes: 'programmes', team: 'team' };

export type GovTab = typeof GOV_TABS[number]['id'];

export default function GovernmentShell() {
  const { profile, signOut, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<GovTab>('overview');
  const [preset, setPreset] = useState<{ province: string; district: string } | null>(null);
  const tabs = GOV_TABS.filter(t => hasPermission(TAB_MODULE[t.id]));
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
              <div className="text-amber-400 text-xs truncate">🏛️ {profile?.organization}</div>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${
                activeTab === tab.id
                  ? 'bg-amber-500/15 text-amber-300 border-r-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}>
              <span className="text-base flex-shrink-0">{tab.icon}</span>
              {open && <span className="text-sm font-medium truncate">{tab.label}</span>}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-3 space-y-2">
          {open && (
            <p className="text-[10px] leading-snug text-slate-500 px-1">
              Read-only aggregates. Farms appear only after opting in; individual farms are never identified.
            </p>
          )}
          <button onClick={signOut}
            className="w-full flex items-center gap-3 px-2 py-2 text-slate-400 hover:text-red-400 transition-colors text-left">
            <span className="text-base flex-shrink-0">🚪</span>
            {open && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className={`flex-1 transition-all duration-300 ${open ? 'ml-60' : 'ml-14'}`}>
        {activeTab === 'team' ? <TeamPermissions accent="amber" /> : activeTab === 'programmes' ? <PartnerDashboard /> : activeTab === 'ecosystem' ? <EcosystemDashboard /> : activeTab === 'map' ? <NationalMap onOpenDistrict={(province, district) => { setPreset({ province, district }); setActiveTab('overview'); }} /> : <GovernmentDashboard activeTab={activeTab} setActiveTab={setActiveTab} preset={preset} />}
      </div>
    </div>
  );
}
