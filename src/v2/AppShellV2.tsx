import React, { useState } from 'react';
import { useOrg } from '@/store/orgStore';
import { getTemplate } from '@/lib/templates';
import { ALL_TEMPLATES } from '@/lib/templates';
import {
  LayoutDashboard, Activity, Package, ShoppingCart, DollarSign,
  Settings, Store, ChevronLeft, ChevronRight, Sprout, LogOut,
  BarChart3, Truck, Cpu, Menu, X, Brain, TrendingUp,
  Zap, Eye, Cloud, Leaf, Search, Plus, Check, Shield, Pencil,
  Clock, CheckCircle2, XCircle, Radio,
} from 'lucide-react';
import DynamicDashboard from '@/pages/dashboard/DynamicDashboard';
import ProductionEngine from '@/pages/production/ProductionEngine';
import ProcessingEngine from '@/pages/processing/ProcessingEngine';
import InventoryEngine from '@/pages/inventory/InventoryEngine';
import SalesEngine from '@/pages/sales/SalesEngine';
import FinanceEngine from '@/pages/finance/FinanceEngine';
import AgriFood from '@/pages/marketplace/AgriFood';
import AgriSupply from '@/pages/marketplace/AgriSupply';
import AgriServices from '@/pages/marketplace/AgriServices';
import ReportsEngine from '@/pages/reports/ReportsEngine';
import PredictiveAI from '@/pages/ai/PredictiveAI';
import FinancialAI from '@/pages/ai/FinancialAI';
import SmartEngine from '@/pages/ai/SmartEngine';
import SmartVision from '@/pages/ai/SmartVision';
import WeatherModule from '@/pages/ai/WeatherModule';
import SustainabilityModule from '@/pages/ai/SustainabilityModule';
import SmartDevices from '@/pages/ai/SmartDevices';
import WaterManagement from '@/pages/iot/WaterManagement';
import AquacultureDashboard from '@/pages/iot/AquacultureDashboard';
import PoultryHouseDashboard from '@/pages/iot/PoultryHouse';
import EnergyMonitor from '@/pages/iot/EnergyMonitor';
import SoilDepth from '@/pages/iot/SoilDepth';
import AutomationRules from '@/pages/iot/AutomationRules';
import NotificationsCenter from '@/pages/notifications/NotificationsCenter';
import AnimalHealth from '@/pages/health/AnimalHealth';
import StaffLabour from '@/pages/hr/StaffLabour';
import Procurement from '@/pages/procurement/Procurement';
import BackupRestore from '@/pages/settings/BackupRestore';

type Page = 'dashboard' | 'production' | 'inventory' | 'sales' | 'marketplace-food'
           | 'marketplace-supply' | 'marketplace-services' | 'finance' | 'reports'
           | 'config' | 'enterprise' | 'cycle' | 'new-cycle' | 'processing'
           | 'ai-predictive' | 'ai-financial' | 'ai-smart' | 'ai-vision'
           | 'ai-weather' | 'ai-sustainability' | 'ai-devices' | 'iot-water'
           | 'iot-aquaculture' | 'iot-poultry'
           | 'iot-energy' | 'iot-soil' | 'iot-automation'
           | 'notifications' | 'animal-health' | 'staff-labour' | 'procurement' | 'backup';

interface NavItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',   label: 'Dashboard',   icon: <LayoutDashboard className="w-4 h-4" />, section: 'main' },
  { id: 'production',  label: 'Production',  icon: <Activity className="w-4 h-4" />,        section: 'main' },
  { id: 'processing',  label: 'Processing',  icon: <Cpu className="w-4 h-4" />,              section: 'main' },
  { id: 'inventory',   label: 'Inventory',   icon: <Package className="w-4 h-4" />,          section: 'main' },
  { id: 'sales',       label: 'Sales',       icon: <ShoppingCart className="w-4 h-4" />,     section: 'main' },
  { id: 'finance',     label: 'Finance',     icon: <DollarSign className="w-4 h-4" />,       section: 'main' },
  { id: 'reports',     label: 'Reports',     icon: <BarChart3 className="w-4 h-4" />,        section: 'main' },
  { id: 'marketplace-food',     label: 'AgriFood Market',    icon: <Store className="w-4 h-4" />,  section: 'markets' },
  { id: 'marketplace-supply',   label: 'AgriSupply',         icon: <Truck className="w-4 h-4" />,  section: 'markets' },
  { id: 'marketplace-services', label: 'AgriServices',       icon: <Settings className="w-4 h-4" />, section: 'markets' },
  { id: 'ai-smart',       label: 'Smart Engine',   icon: <Zap className="w-4 h-4" />,        section: 'ai' },
  { id: 'ai-predictive', label: 'AI Insights',    icon: <Brain className="w-4 h-4" />,      section: 'ai' },
  { id: 'ai-financial',  label: 'Financial AI',   icon: <TrendingUp className="w-4 h-4" />, section: 'ai' },
  { id: 'ai-vision',     label: 'Smart Vision',   icon: <Eye className="w-4 h-4" />,        section: 'ai' },
  { id: 'ai-weather',    label: 'Weather',         icon: <Cloud className="w-4 h-4" />,      section: 'ai' },
  { id: 'ai-sustainability', label: 'Sustainability', icon: <Leaf className="w-4 h-4" />,   section: 'ai' },
  { id: 'ai-devices',       label: 'Smart Devices',  icon: <Radio className="w-4 h-4" />,   section: 'ai' },
  { id: 'iot-water',        label: 'Water Mgmt',     icon: <Zap className="w-4 h-4" />,      section: 'ai' },
  { id: 'iot-aquaculture',  label: 'Aquaculture',    icon: <Activity className="w-4 h-4" />,   section: 'ai' },
  { id: 'iot-poultry',      label: 'Poultry Houses', icon: <Activity className="w-4 h-4" />,   section: 'ai' },
  { id: 'iot-energy',       label: 'Energy',         icon: <Zap className="w-4 h-4" />,        section: 'ai' },
  { id: 'iot-soil',         label: 'Soil Depth',     icon: <Activity className="w-4 h-4" />,   section: 'ai' },
  { id: 'iot-automation',   label: 'Automation',     icon: <Zap className="w-4 h-4" />,        section: 'ai' },
  { id: 'notifications',  label: 'Notifications',  icon: <Bell className="w-4 h-4" />,       section: 'ops' },
  { id: 'animal-health',  label: 'Animal Health',  icon: <Activity className="w-4 h-4" />,   section: 'ops' },
  { id: 'staff-labour',   label: 'Staff & Labour', icon: <Check className="w-4 h-4" />,      section: 'ops' },
  { id: 'procurement',    label: 'Procurement',    icon: <Truck className="w-4 h-4" />,      section: 'ops' },
  { id: 'config',        label: 'Settings',       icon: <Settings className="w-4 h-4" />,   section: 'bottom' },
  { id: 'backup',        label: 'Backup & Restore', icon: <Search className="w-4 h-4" />,   section: 'bottom' },
];

/** Count unresolved alerts across all IoT LS keys */
function countAlerts(): number {
  const keys = [
    'agronexus_v2_aqua_alerts', 'agronexus_v2_wm_alerts', 'agronexus_v2_ph_alerts',
    'agronexus_v2_em_alerts', 'agronexus_v2_sd_alerts', 'agronexus_v2_iot_device_alerts',
  ];
  return keys.reduce((n, k) => {
    try { return n + (JSON.parse(localStorage.getItem(k) ?? '[]') as any[]).filter(a => !a.resolved).length; }
    catch { return n; }
  }, 0);
}

export default function AppShellV2() {
  const { org, editRequests } = useOrg();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [pageParams, setPageParams] = useState<Record<string, string>>({});
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(() => countAlerts());

  // Refresh alert count whenever page changes (covers IoT pages that may create alerts)
  React.useEffect(() => { setAlertCount(countAlerts()); }, [currentPage]);

  if (!org) return null;

  const pendingEditCount = editRequests.filter((r: any) => r.status === 'pending').length;

  function navigate(page: string, params?: Record<string, string>) {
    setCurrentPage(page as Page);
    setPageParams(params ?? {});
    setMobileOpen(false);
  }

  function renderPage() {
    switch (currentPage) {
      case 'dashboard':
        return <DynamicDashboard onNavigate={navigate} />;
      case 'production':
        return <ProductionEngine enterpriseId={pageParams.enterpriseId} onNavigate={navigate} />;
      case 'enterprise':
        return <ProductionEngine enterpriseId={pageParams.id} onNavigate={navigate} />;
      case 'new-cycle':
        return <ProductionEngine enterpriseId={pageParams.enterpriseId} onNavigate={navigate} />;
      case 'cycle':
        return <ProductionEngine onNavigate={navigate} />;
      case 'processing':
        return <ProcessingEngine />;
      case 'inventory':
        return <InventoryEngine />;
      case 'sales':
        return <SalesEngine />;
      case 'finance':
        return <FinanceEngine />;
      case 'reports':
        return <ReportsEngine />;
      case 'ai-smart':
        return <SmartEngine />;
      case 'ai-predictive':
        return <PredictiveAI />;
      case 'ai-financial':
        return <FinancialAI />;
      case 'ai-vision':
        return <SmartVision />;
      case 'ai-weather':
        return <WeatherModule />;
      case 'ai-sustainability':
        return <SustainabilityModule />;
      case 'ai-devices':
        return <SmartDevices />;
      case 'iot-water':
        return <WaterManagement />;
      case 'iot-aquaculture':
        return <AquacultureDashboard />;
      case 'iot-poultry':
        return <PoultryHouseDashboard />;
      case 'iot-energy':
        return <EnergyMonitor />;
      case 'iot-soil':
        return <SoilDepth />;
      case 'iot-automation':
        return <AutomationRules />;
      case 'notifications':
        return <NotificationsCenter />;
      case 'animal-health':
        return <AnimalHealth />;
      case 'staff-labour':
        return <StaffLabour />;
      case 'procurement':
        return <Procurement />;
      case 'backup':
        return <BackupRestore />;
      case 'marketplace-food':
        return <AgriFood />;
      case 'marketplace-supply':
        return <AgriSupply />;
      case 'marketplace-services':
        return <AgriServices />;
      case 'config':
        return <ConfigPage org={org} onNavigate={navigate} />;
      default:
        return <DynamicDashboard onNavigate={navigate} />;
    }
  }

  const mainItems   = NAV_ITEMS.filter(n => n.section === 'main');
  const marketItems = NAV_ITEMS.filter(n => n.section === 'markets');
  const aiItems     = NAV_ITEMS.filter(n => n.section === 'ai');
  const opsItems    = NAV_ITEMS.filter(n => n.section === 'ops');
  const bottomItems = NAV_ITEMS.filter(n => n.section === 'bottom');

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={[
        'fixed lg:relative inset-y-0 left-0 z-50 flex flex-col bg-slate-900 transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
        // Mobile: slide in/out. Desktop (lg): always visible via lg:translate-x-0
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      ].join(' ')}>
        {/* Logo */}
        <div className={`h-14 flex items-center border-b border-slate-800 ${collapsed ? 'justify-center px-2' : 'px-4 gap-2'}`}>
          <div className="w-7 h-7 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sprout className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="font-bold text-white text-sm">AgroNexus</div>
              <div className="text-[10px] text-slate-400 leading-none truncate max-w-[140px]">{org.name}</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {!collapsed && <NavSection label="Operations" />}
          {mainItems.map(item => (
            <NavLink key={item.id} item={item} active={currentPage === item.id} collapsed={collapsed} onClick={() => navigate(item.id)} />
          ))}

          {!collapsed && <NavSection label="Marketplaces" />}
          {marketItems.map(item => (
            <NavLink key={item.id} item={item} active={currentPage === item.id} collapsed={collapsed} onClick={() => navigate(item.id)} />
          ))}

          {!collapsed && <NavSection label="AI & Intelligence" />}
          {aiItems.map(item => (
            <NavLink key={item.id} item={item} active={currentPage === item.id} collapsed={collapsed} onClick={() => navigate(item.id)} />
          ))}

          {!collapsed && <NavSection label="Farm Management" />}
          {opsItems.map(item => (
            <NavLink key={item.id}
              item={item.id === 'notifications' && alertCount > 0 ? { ...item, badge: alertCount } : item}
              active={currentPage === item.id} collapsed={collapsed}
              onClick={() => { navigate(item.id); if (item.id === 'notifications') setAlertCount(countAlerts()); }} />
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-slate-800 p-2 space-y-0.5">
          {bottomItems.map(item => (
            <NavLink
              key={item.id}
              item={{ ...item, badge: item.id === 'config' && pendingEditCount > 0 ? pendingEditCount : item.badge }}
              active={currentPage === item.id}
              collapsed={collapsed}
              onClick={() => navigate(item.id)}
            />
          ))}

          {/* Collapse toggle (desktop) */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden lg:flex w-full items-center gap-2 px-2 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm transition-colors"
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4 mx-auto" />
              : <><ChevronLeft className="w-4 h-4" /><span className="text-xs">Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(m => !m)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex-1">
            <h1 className="font-semibold text-slate-800 text-sm capitalize">
              {NAV_ITEMS.find(n => n.id === currentPage)?.label ?? 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => navigate('notifications')} className="relative p-2 hover:bg-slate-100 rounded-lg" title="Notifications">
              <Bell className="w-4 h-4 text-slate-500" />
              {alertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </button>
            <div className="text-xs text-slate-500 hidden sm:block">{org.currency}</div>
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {org.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-hidden">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

// ─── Nav helpers ──────────────────────────────────────────────────────────────

function NavSection({ label }: { label: string }) {
  return (
    <div className="px-2 pt-3 pb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
  );
}

function NavLink({ item, active, collapsed, onClick }: {
  item: NavItem; active: boolean; collapsed: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-green-600 text-white'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      {item.icon}
      {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
      {!collapsed && item.badge && (
        <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">{item.badge}</span>
      )}
    </button>
  );
}

// ─── Coming Soon ─────────────────────────────────────────────────────────────

function ComingSoon({ title, icon, desc }: { title: string; icon: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="text-6xl mb-6">{icon}</div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
      <p className="text-slate-500 max-w-sm text-sm mb-6">{desc}</p>
      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Building on v2 branch</span>
    </div>
  );
}

// ─── Config Page ──────────────────────────────────────────────────────────────

function ConfigPage({ org, onNavigate }: { org: any; onNavigate: (p: string) => void }) {
  const [showAddEnterprise, setShowAddEnterprise] = useState(false);
  const { updateOrg, editRequests, approveEdit, rejectEdit, dismissEdit } = useOrg();

  const approval = org.editApproval ?? { enabled: false, approverName: '', currentUserName: '', requireReason: false };
  const pendingEdits = editRequests.filter((r: any) => r.status === 'pending');
  const resolvedEdits = editRequests.filter((r: any) => r.status !== 'pending').slice(-10).reverse();

  function setApproval(patch: Record<string, unknown>) {
    updateOrg({ editApproval: { ...approval, ...patch } });
  }

  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 overflow-y-auto h-full">
      <h2 className="text-xl font-bold text-slate-900">Platform Settings</h2>

      {/* Org info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Business Profile</h3>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-slate-400 text-xs">Name</dt><dd className="font-medium">{org.name}</dd></div>
          <div><dt className="text-slate-400 text-xs">Country</dt><dd className="font-medium">{org.country}</dd></div>
          <div><dt className="text-slate-400 text-xs">Currency</dt><dd className="font-medium">{org.currency}</dd></div>
          <div><dt className="text-slate-400 text-xs">Timezone</dt><dd className="font-medium">{org.timezone}</dd></div>
        </dl>
      </div>

      {/* Enterprises */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Enterprises ({org.enterprises.length})</h3>
          <button
            onClick={() => setShowAddEnterprise(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
          >
            <Plus className="w-3.5 h-3.5" /> Add Enterprise
          </button>
        </div>
        <div className="space-y-2">
          {org.enterprises.map((e: any) => {
            const tpl = getTemplate(e.templateId);
            return (
              <div key={e.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <span className="text-xl">{tpl?.icon ?? '🌱'}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-800">{e.name}</div>
                  <div className="text-xs text-slate-400">{tpl?.name}</div>
                  {e.location && <div className="text-xs text-slate-400">{e.location}</div>}
                </div>
                <div className={`w-2 h-2 rounded-full ${e.active ? 'bg-green-500' : 'bg-slate-300'}`} />
              </div>
            );
          })}
          {org.enterprises.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No enterprises yet. Add one above.</p>
          )}
        </div>
      </div>

      {/* ── Edit Approval ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-slate-500" />
          <h3 className="font-semibold text-slate-800">Edit &amp; Approval Control</h3>
          {pendingEdits.length > 0 && (
            <span className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
              <Clock className="w-3 h-3" /> {pendingEdits.length} pending
            </span>
          )}
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-700">Require approval for edits</div>
            <div className="text-xs text-slate-400">When enabled, changes go to an approver before applying</div>
          </div>
          <button
            onClick={() => setApproval({ enabled: !approval.enabled })}
            className={`relative w-11 h-6 rounded-full transition-colors ${approval.enabled ? 'bg-green-500' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${approval.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Names */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Your name / Staff member</label>
            <input
              type="text"
              value={approval.currentUserName}
              onChange={e => setApproval({ currentUserName: e.target.value })}
              placeholder="e.g. John Banda"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Approver name</label>
            <input
              type="text"
              value={approval.approverName}
              onChange={e => setApproval({ approverName: e.target.value })}
              placeholder="e.g. Farm Manager"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Require reason */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={approval.requireReason}
            onChange={e => setApproval({ requireReason: e.target.checked })}
            className="w-4 h-4 rounded border-slate-300 accent-green-600"
          />
          <span className="text-sm text-slate-700">Require a reason for every edit or deletion</span>
        </label>

        {/* Pending edits */}
        {pendingEdits.length > 0 && (
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Pending Edits ({pendingEdits.length})</h4>
            {pendingEdits.map((r: any) => (
              <div key={r.id} className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{r.entityLabel}</div>
                    <div className="text-xs text-slate-500">{r.fieldLabel} — by <strong>{r.requestedBy}</strong></div>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded-full uppercase">
                    {r.entityType.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-slate-600 bg-white/70 rounded-lg p-2 space-y-0.5">
                  <div><span className="text-slate-400">Before:</span> {r.oldValueDisplay.slice(0, 80)}</div>
                  <div><span className="text-slate-400">After:</span> {r.newValueDisplay.slice(0, 80)}</div>
                  {r.reason && <div><span className="text-slate-400">Reason:</span> {r.reason}</div>}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => approveEdit(r.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => { setRejectTarget(r.id); setRejectNote(''); }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resolved edits */}
        {resolvedEdits.length > 0 && (
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Recent Decisions</h4>
            {resolvedEdits.map((r: any) => (
              <div key={r.id} className={`rounded-xl border p-3 flex items-start gap-3 ${r.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                {r.status === 'approved'
                  ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-700">{r.entityLabel}</div>
                  <div className="text-[10px] text-slate-400">{r.fieldLabel} · {r.requestedBy} → {r.reviewedBy}</div>
                  {r.rejectionNote && <div className="text-[10px] text-red-600 mt-0.5">"{r.rejectionNote}"</div>}
                </div>
                <button onClick={() => dismissEdit(r.id)} className="p-1 text-slate-300 hover:text-slate-500">
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-800">Reject Edit</h3>
            <input
              type="text"
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-2">
              <button onClick={() => setRejectTarget(null)} className="flex-1 border border-slate-300 rounded-lg py-2 text-sm">Cancel</button>
              <button
                onClick={() => { rejectEdit(rejectTarget, rejectNote); setRejectTarget(null); }}
                className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm hover:bg-red-700"
              >Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Data reset (dev) */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
        <h3 className="font-semibold text-red-800 mb-2">Developer</h3>
        <button
          onClick={() => {
            localStorage.removeItem('agronexus_v2_org');
            localStorage.removeItem('agronexus_v2_cycles');
            window.location.reload();
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
        >
          Reset workspace (re-run onboarding)
        </button>
      </div>

      {showAddEnterprise && (
        <AddEnterpriseModal onClose={() => setShowAddEnterprise(false)} />
      )}
    </div>
  );
}

// ─── Add Enterprise Modal ─────────────────────────────────────────────────────

type CategoryFilter = 'all' | 'poultry' | 'livestock' | 'aquaculture' | 'crops' | 'horticulture' | 'greenhouse' | 'orchard' | 'apiary' | 'mushroom' | 'processing' | 'services';

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All', poultry: '🐓 Poultry & Birds', livestock: '🐄 Livestock',
  aquaculture: '🐟 Aquaculture', crops: '🌽 Crops', horticulture: '🥦 Horticulture',
  greenhouse: '🏡 Greenhouse', orchard: '🍋 Orchard', apiary: '🍯 Apiary',
  mushroom: '🍄 Mushroom', processing: '⚙️ Processing', services: '🛠 Services',
};

function AddEnterpriseModal({ onClose }: { onClose: () => void }) {
  const { addEnterprise } = useOrg();
  const [name, setName]         = useState('');
  const [templateId, setTemplate] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes]       = useState('');
  const [search, setSearch]     = useState('');
  const [catFilter, setCatFilter] = useState<CategoryFilter>('all');
  const [saved, setSaved]       = useState(false);

  const filtered = ALL_TEMPLATES.filter(t => {
    const matchCat = catFilter === 'all' || t.category === catFilter;
    const matchQ   = search === '' || t.name.toLowerCase().includes(search.toLowerCase()) || (t.species ?? '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  const selectedTpl = ALL_TEMPLATES.find(t => t.id === templateId);

  function handleSave() {
    if (!name.trim() || !templateId) return;
    addEnterprise({
      name: name.trim(),
      templateId,
      color: selectedTpl?.color ?? 'green',
      active: true,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setSaved(true);
    setTimeout(onClose, 900);
  }

  const categories = ['all', 'poultry', 'livestock', 'aquaculture', 'crops', 'horticulture', 'greenhouse', 'orchard', 'apiary', 'mushroom', 'processing', 'services'] as const;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="font-bold text-slate-900">Add Enterprise</h2>
            <p className="text-xs text-slate-500 mt-0.5">Choose a template and name your operation</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">Enterprise Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sunrise Poultry Farm, Mpongwe Fish Ponds…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Template picker */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">Production Template *</label>

            {/* Category filter tabs */}
            <div className="flex gap-1 flex-wrap mb-3">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                    catFilter === cat ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search templates…"
                className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
              {filtered.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`relative flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
                    templateId === t.id
                      ? 'border-green-500 bg-green-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {templateId === t.id && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-2 h-2 text-white" />
                    </span>
                  )}
                  <span className="text-xl">{t.icon}</span>
                  <span className="text-[10px] font-medium text-slate-700 leading-tight">{t.shortName ?? t.name}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-4 text-center py-6 text-slate-400 text-xs">No templates match your search</div>
              )}
            </div>
          </div>

          {/* Location (optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">Location (optional)</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Plot 5, Kabwe Road"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any notes…"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 flex-shrink-0 bg-slate-50 rounded-b-2xl">
          {selectedTpl ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="text-xl">{selectedTpl.icon}</span>
              <span className="font-medium">{selectedTpl.name}</span>
              <span className="text-slate-400">· {selectedTpl.category}</span>
            </div>
          ) : (
            <span className="text-sm text-slate-400">No template selected</span>
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || !templateId || saved}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Plus className="w-4 h-4" /> Add Enterprise</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
