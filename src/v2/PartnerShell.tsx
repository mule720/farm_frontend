// ─────────────────────────────────────────────────────────────────────────────
// AGRINUXES — PartnerShell
// App shell for supporting partners (FAO, donors, NGOs; role: partner_manager).
// Programme management + M&E, plus the same de-identified district
// dashboards a government viewer gets.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PartnerDashboard from '@/pages/partner/PartnerDashboard';
import EcosystemDashboard from '@/pages/government/EcosystemDashboard';
import NationalMap from '@/pages/government/NationalMap';
import GovernmentDashboard from '@/pages/government/GovernmentDashboard';
import TeamPermissions from '@/pages/settings/TeamPermissions';
import type { GovTab } from '@/v2/GovernmentShell';

const TABS = [
  { id: 'programmes',  icon: '📂', label: 'Programmes',            section: 'Programmes' },
  { id: 'gov:overview',       icon: '🏛️', label: 'National Overview',     section: 'District data' },
  { id: 'gov:ecosystem',      icon: '🌐', label: 'Ecosystem',             section: 'District data' },
  { id: 'gov:map',            icon: '🗺️', label: 'National Map',          section: 'District data' },
  { id: 'gov:production',     icon: '🌾', label: 'Production',            section: 'District data' },
  { id: 'gov:markets',        icon: '📈', label: 'Markets & Prices',      section: 'District data' },
  { id: 'gov:health',         icon: '🦠', label: 'Disease & Alerts',      section: 'District data' },
  { id: 'gov:sustainability', icon: '🌍', label: 'Climate & Sustainability', section: 'District data' },
  { id: 'gov:registry',       icon: '🗺️', label: 'District Registry',     section: 'District data' },
  { id: 'gov:advisories',     icon: '📣', label: 'Advisories',            section: 'District data' },
  { id: 'team',               icon: '👥', label: 'Team & Branches',       section: 'Admin' },
] as const;

const TAB_MODULE: Record<string, string> = { programmes: 'programmes', 'gov:overview': 'gov-dashboards', 'gov:ecosystem': 'gov-dashboards', 'gov:map': 'gov-dashboards', 'gov:production': 'gov-dashboards', 'gov:markets': 'gov-dashboards', 'gov:health': 'gov-dashboards', 'gov:sustainability': 'gov-dashboards', 'gov:registry': 'registry', 'gov:advisories': 'advisories', team: 'team' };

export default function PartnerShell() {
  const { profile, signOut, hasPermission } = useAuth();
  const [active, setActive] = useState<string>('programmes');
  const [preset, setPreset] = useState<{ province: string; district: string } | null>(null);
  const [open, setOpen] = useState(true);
  const tabs = TABS.filter(t => hasPermission(TAB_MODULE[t.id]));
  const sections = [...new Set(tabs.map(t => t.section))];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className={`fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 z-40 transition-all duration-300 flex flex-col ${open ? 'w-60' : 'w-14'}`}>
        <div className="flex items-center gap-2 px-3 py-4 border-b border-slate-800">
          <button onClick={() => setOpen(o => !o)} aria-label="Toggle sidebar"
            className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          {open && (
            <div className="min-w-0">
              <div className="text-white font-bold text-sm truncate">AGRINUXES</div>
              <div className="text-sky-400 text-xs truncate">🤝 {profile?.organization}</div>
            </div>
          )}
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {sections.map(sec => (
            <div key={sec} className="mb-2">
              {open && <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-slate-500">{sec}</div>}
              {tabs.filter(t => t.section === sec).map(tab => (
                <button key={tab.id} onClick={() => setActive(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${
                    active === tab.id ? 'bg-sky-500/15 text-sky-300 border-r-2 border-sky-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                  <span className="text-base flex-shrink-0">{tab.icon}</span>
                  {open && <span className="text-sm font-medium truncate">{tab.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-3 space-y-2">
          {open && <p className="text-[10px] leading-snug text-slate-500 px-1">Enrolled farms are visible by name; everything else is de-identified and consent-gated.</p>}
          <button onClick={signOut} className="w-full flex items-center gap-3 px-2 py-2 text-slate-400 hover:text-red-400 transition-colors text-left">
            <span className="text-base flex-shrink-0">🚪</span>{open && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>
      <div className={`flex-1 transition-all duration-300 ${open ? 'ml-60' : 'ml-14'}`}>
        {active === 'team' ? <TeamPermissions accent="sky" /> : active === 'programmes'
          ? <PartnerDashboard />
          : active === 'gov:ecosystem' ? <EcosystemDashboard />
          : active === 'gov:map' ? <NationalMap onOpenDistrict={(province, district) => { setPreset({ province, district }); setActive('gov:overview'); }} />
          : <GovernmentDashboard activeTab={active.slice(4) as GovTab} setActiveTab={t => setActive('gov:' + t)} preset={preset} />}
      </div>
    </div>
  );
}
