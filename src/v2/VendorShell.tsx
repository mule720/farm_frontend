// ─────────────────────────────────────────────────────────────────────────────
// AGRINUXES — VendorShell
// One shell for every non-farming business type. Every tab is backed by the
// vendor GraphQL schema (apps/market/vendor_schema.py); nothing is seeded.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useOrg } from '@/store/orgStore';
import { useAuth } from '@/contexts/AuthContext';
import DataSharingConsent from '@/pages/settings/DataSharingConsent';
import TeamPermissions from '@/pages/settings/TeamPermissions';
import { VendorProvider, SetTabProvider, useVendor, ClientsTab, InvoicesTab, RevenueTab, MarketplaceTab, SettingsTab, ServicesManager } from '@/pages/vendor/VendorCommon';
import { VetOverview, AppointmentsTab, PatientsTab, PrescriptionsTab } from '@/pages/vendor/VetTabs';
import { EquipmentOverview, FleetTab, BookingsTab, MaintenanceTab } from '@/pages/vendor/EquipmentTabs';
import { SalesOverview, CatalogTab, OrdersTab } from '@/pages/vendor/SalesTabs';
import { ServicesOverview, JobsTab } from '@/pages/vendor/JobsTab';
import { ProcessorOverview, BatchesTab } from '@/pages/vendor/ProcessorTabs';

type Tab = { id: string; icon: string; label: string; render: () => React.ReactNode };
const common = (opts: { servicesHeading?: string; servicesHint?: string } = {}): Tab[] => [
  { id: 'clients', icon: '👥', label: 'Clients', render: () => <ClientsTab /> },
  { id: 'invoices', icon: '🧾', label: 'Invoices', render: () => <InvoicesTab /> },
  { id: 'revenue', icon: '💰', label: 'Revenue', render: () => <RevenueTab /> },
  { id: 'marketplace', icon: '🛒', label: 'Marketplace Listing', render: () => <MarketplaceTab servicesHeading={opts.servicesHeading} servicesHint={opts.servicesHint} /> },
  { id: 'team', icon: '🔐', label: 'Users & Permissions', render: () => <div className="-m-6"><TeamPermissions accent="emerald" /></div> },
  { id: 'settings', icon: '⚙️', label: 'Settings', render: () => <><DataSharingConsent /><div className="mt-6"><SettingsTab /></div></> },
];

const CONFIG: Record<string, { icon: string; label: string; tabs: Tab[] }> = {
  vet_provider: { icon: '🩺', label: 'Vet Services', tabs: [
    { id: 'overview', icon: '📊', label: 'Overview', render: () => <VetOverview /> },
    { id: 'appointments', icon: '📅', label: 'Appointments', render: () => <AppointmentsTab /> },
    { id: 'patients', icon: '🐄', label: 'Patient Records', render: () => <PatientsTab /> },
    { id: 'prescriptions', icon: '💊', label: 'Prescriptions', render: () => <PrescriptionsTab /> },
    { id: 'services', icon: '🗂️', label: 'Services Catalog', render: () => <ServicesManager heading="Services & fees" hint="Consultations, vaccinations, farm visits, lab work — with pricing per head, per visit or per hour." /> },
    ...common({ servicesHeading: 'Services & fees' }),
  ] },
  equipment_hire: { icon: '🚜', label: 'Equipment Hire', tabs: [
    { id: 'overview', icon: '📊', label: 'Overview', render: () => <EquipmentOverview /> },
    { id: 'fleet', icon: '🚜', label: 'Fleet Management', render: () => <FleetTab /> },
    { id: 'bookings', icon: '📅', label: 'Bookings', render: () => <BookingsTab /> },
    { id: 'maintenance', icon: '🔧', label: 'Maintenance', render: () => <MaintenanceTab /> },
    ...common({ servicesHeading: 'Other services', servicesHint: 'Optional: land preparation packages, delivery, operator-only hire. Machines themselves are listed under Fleet.' }),
  ] },
  transport: { icon: '🚚', label: 'Transport & Logistics', tabs: [
    { id: 'overview', icon: '📊', label: 'Overview', render: () => <EquipmentOverview transport /> },
    { id: 'jobs', icon: '📋', label: 'Transport Jobs', render: () => <JobsTab transport /> },
    { id: 'fleet', icon: '🚚', label: 'Vehicles', render: () => <FleetTab transport /> },
    { id: 'maintenance', icon: '🔧', label: 'Maintenance', render: () => <MaintenanceTab /> },
    ...common({ servicesHeading: 'Routes & rates', servicesHint: 'Per-km, per-tonne or per-trip rates and standard routes buyers can book.' }),
  ] },
  agro_dealer: { icon: '🏪', label: 'Agro Dealer', tabs: [
    { id: 'overview', icon: '📊', label: 'Overview', render: () => <SalesOverview /> },
    { id: 'catalog', icon: '🗂️', label: 'Product Catalog', render: () => <CatalogTab mode="catalog" /> },
    { id: 'orders', icon: '📋', label: 'Orders', render: () => <OrdersTab /> },
    { id: 'stock', icon: '📦', label: 'Stock Management', render: () => <CatalogTab mode="stock" /> },
    ...common({ servicesHeading: 'Services offered', servicesHint: 'Delivery, spraying, soil testing or agronomy advice you offer alongside products.' }),
  ] },
  agrisupply_provider: { icon: '📦', label: 'AgriSupply', tabs: [
    { id: 'overview', icon: '📊', label: 'Overview', render: () => <SalesOverview /> },
    { id: 'catalog', icon: '📦', label: 'Supply Catalog', render: () => <CatalogTab mode="catalog" /> },
    { id: 'orders', icon: '📋', label: 'Purchase Orders', render: () => <OrdersTab /> },
    { id: 'stock', icon: '🗄️', label: 'Stock Management', render: () => <CatalogTab mode="stock" /> },
    { id: 'deliveries', icon: '🚚', label: 'Deliveries', render: () => <OrdersTab deliveries /> },
    ...common({ servicesHeading: 'Services offered' }),
  ] },
  agrifood_seller: { icon: '🥦', label: 'AgriFood Seller', tabs: [
    { id: 'overview', icon: '📊', label: 'Overview', render: () => <SalesOverview /> },
    { id: 'listings', icon: '🥦', label: 'Produce Listings', render: () => <CatalogTab mode="catalog" /> },
    { id: 'orders', icon: '📋', label: 'Buyer Orders', render: () => <OrdersTab /> },
    { id: 'pricing', icon: '🏷️', label: 'Pricing & Stock', render: () => <CatalogTab mode="pricing" /> },
    ...common({ servicesHeading: 'Services offered', servicesHint: 'Delivery, grading, packaging or aggregation services.' }),
  ] },
  agriservices_provider: { icon: '🔧', label: 'AgriServices', tabs: [
    { id: 'overview', icon: '📊', label: 'Overview', render: () => <ServicesOverview /> },
    { id: 'services', icon: '🗂️', label: 'Services Catalog', render: () => <ServicesManager heading="Services & rates" hint="Land preparation, irrigation installation, fencing, soil and water testing, consulting — priced per ha, per hour or per job." /> },
    { id: 'jobs', icon: '📋', label: 'Job Schedule', render: () => <JobsTab /> },
    ...common({ servicesHeading: 'Services & rates' }),
  ] },
  processor: { icon: '🏭', label: 'Agro Processor', tabs: [
    { id: 'overview', icon: '📊', label: 'Overview', render: () => <ProcessorOverview /> },
    { id: 'sourcing', icon: '🌾', label: 'Farm Sourcing', render: () => <BatchesTab mode="sourcing" /> },
    { id: 'processing', icon: '⚙️', label: 'Processing Logs', render: () => <BatchesTab mode="processing" /> },
    { id: 'inventory', icon: '📦', label: 'Inventory', render: () => <><BatchesTab mode="inventory" /><div className="mt-6"><CatalogTab mode="catalog" /></div></> },
    { id: 'traceability', icon: '🔍', label: 'Traceability', render: () => <BatchesTab mode="traceability" /> },
    { id: 'orders', icon: '📋', label: 'Orders', render: () => <OrdersTab /> },
    ...common({ servicesHeading: 'Processing services', servicesHint: 'Toll milling, drying, packaging or cold storage you offer to farmers.' }),
  ] },
};

export const VENDOR_TYPES = Object.keys(CONFIG);

class TabBoundary extends React.Component<{ tabId: string; children: React.ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(e: any) { return { error: e?.message ?? 'Something went wrong' }; }
  componentDidUpdate(prev: { tabId: string }) { if (prev.tabId !== this.props.tabId && this.state.error) this.setState({ error: null }); }
  render() { return this.state.error ? <div className="p-4 rounded-xl border border-red-800 bg-red-950 text-red-200 text-sm">This tab hit an error: {this.state.error}. Try another tab or reload.</div> : this.props.children; }
}

export default function VendorShell() {
  const { org } = useOrg();
  const { profile } = useAuth();
  const bt = (profile as any)?.businessType || org?.businessType || 'agro_dealer';
  const cfg = CONFIG[bt] ?? CONFIG.agro_dealer;
  const [activeTab, setActiveTab] = useState('overview');
  return (
    <VendorProvider businessType={bt}>
      <SetTabProvider value={setActiveTab}>
        <Shell cfg={cfg} activeTab={activeTab} setActiveTab={setActiveTab} orgName={org?.name ?? profile?.organization ?? ''} />
      </SetTabProvider>
    </VendorProvider>
  );
}

function Shell({ cfg, activeTab, setActiveTab, orgName }: { cfg: { icon: string; label: string; tabs: Tab[] }; activeTab: string; setActiveTab: (t: string) => void; orgName: string }) {
  const { signOut, hasPermission } = useAuth();
  const { loading, error, provider } = useVendor();
  const [open, setOpen] = useState(true);
  const tabs = cfg.tabs.filter(t => t.id !== 'team' || hasPermission('team'));
  const tab = tabs.find(t => t.id === activeTab) ?? tabs[0];
  return (
    <div className="min-h-screen bg-slate-950 flex">
      <aside className={`fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 z-40 transition-all duration-300 flex flex-col ${open ? 'w-56' : 'w-14'}`}>
        <div className="flex items-center gap-2 px-3 py-4 border-b border-slate-800">
          <button onClick={() => setOpen(o => !o)} className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white flex-shrink-0" aria-label="Toggle sidebar"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
          {open && <div className="min-w-0"><div className="text-white font-bold text-sm truncate">AGRINUXES</div><div className="text-slate-400 text-xs truncate">{cfg.icon} {provider?.name || orgName}</div></div>}
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {tabs.map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${tab.id === t.id ? 'bg-green-600/20 text-green-400 border-r-2 border-green-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}><span className="text-base flex-shrink-0">{t.icon}</span>{open && <span className="text-sm font-medium truncate">{t.label}</span>}</button>)}
        </nav>
        <div className="border-t border-slate-800 p-3"><button onClick={signOut} className="w-full flex items-center gap-3 px-2 py-2 text-slate-400 hover:text-red-400 text-left"><span className="text-base flex-shrink-0">🚪</span>{open && <span className="text-sm">Sign Out</span>}</button></div>
      </aside>
      <main className={`flex-1 transition-all duration-300 ${open ? 'ml-56' : 'ml-14'} text-white`}>
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between"><div className="text-sm text-slate-300">{cfg.icon} {cfg.label} <span className="text-slate-600">/</span> {tab.label}</div>{provider && <div className="text-xs text-slate-500">{provider.district || 'Set your district in Settings'}</div>}</div>
        <div className="p-6">
          {error && <div className="mb-4 p-3 rounded-xl border border-red-800 bg-red-950 text-red-200 text-sm">{error}</div>}
          {loading && !provider ? <p className="text-slate-500 text-sm">Setting up your business workspace…</p> : <TabBoundary tabId={tab.id}>{tab.render()}</TabBoundary>}
        </div>
      </main>
    </div>
  );
}
