import React, { useState } from 'react';
import { useOrg } from '@/store/orgStore';
import { getTemplate } from '@/lib/templates';
import {
  LayoutDashboard, Activity, Package, ShoppingCart, DollarSign,
  Settings, Store, ChevronLeft, ChevronRight, Sprout, LogOut,
  BarChart3, Truck, Cpu, Menu, X,
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

type Page = 'dashboard' | 'production' | 'inventory' | 'sales' | 'marketplace-food'
           | 'marketplace-supply' | 'marketplace-services' | 'finance' | 'reports'
           | 'config' | 'enterprise' | 'cycle' | 'new-cycle' | 'processing';

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
  { id: 'config',      label: 'Settings',    icon: <Settings className="w-4 h-4" />,         section: 'bottom' },
];

export default function AppShellV2() {
  const { org } = useOrg();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [pageParams, setPageParams] = useState<Record<string, string>>({});
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!org) return null;

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
        </nav>

        {/* Bottom */}
        <div className="border-t border-slate-800 p-2 space-y-0.5">
          {bottomItems.map(item => (
            <NavLink key={item.id} item={item} active={currentPage === item.id} collapsed={collapsed} onClick={() => navigate(item.id)} />
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
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
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
          <button onClick={() => onNavigate('dashboard')} className="text-xs text-green-600 hover:underline">+ Add</button>
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
                </div>
                <div className={`w-2 h-2 rounded-full ${e.active ? 'bg-green-500' : 'bg-slate-300'}`} />
              </div>
            );
          })}
        </div>
      </div>

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
    </div>
  );
}
