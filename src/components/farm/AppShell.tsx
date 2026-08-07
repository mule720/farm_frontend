import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Dashboard from './Dashboard';
import SmartEngine from './SmartEngine';
import EnterpriseModule from './EnterpriseModule';
import HorticultureModule from './HorticultureModule';
import {
  InventoryModule, SalesModule, FinanceModule, HRModule, ProcurementModule,
  BiosecurityModule, ReportsModule, ExportModule, AssetsModule, MobileModule,
  SettingsModule
} from './OperationalModules';
import PlansModule from './PlansModule';
import SmartVisionModule from './SmartVisionModule';
import IrrigationModule from './IrrigationModule';
import EquipmentModule from './EquipmentModule';
import AnimalTrackingModule from './AnimalTrackingModule';
import MarketplaceModule from './MarketplaceModule';
import WeatherModule from './WeatherModule';
import SustainabilityModule from './SustainabilityModule';
import FinancialAIModule from './FinancialAIModule';
import GreenhouseModule from './GreenhouseModule';
import LaborModule from './LaborModule';
import PredictiveAIModule from './PredictiveAIModule';
import IntegrationsModule from './IntegrationsModule';
import { EnterpriseId } from '@/lib/farmData';
import { useAuth } from '@/contexts/AuthContext';
import { Lock } from 'lucide-react';

interface Props {
  onAdminClick: () => void;
  onLogout: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  saas_admin: 'SaaS Administrator', director: 'Director',
  production_manager: 'Production Manager', finance_manager: 'Finance Manager',
  sales_manager: 'Sales Manager', supervisor: 'Supervisor',
  farmhand: 'Farmhand', vet_officer: 'Vet Officer', driver: 'Driver',
};

const enterpriseIds: EnterpriseId[] = ['poultry', 'village-chicken', 'piggery', 'fish', 'duck', 'goat-sheep'];

export default function AppShell({ onAdminClick, onLogout }: Props) {
  const [view, setView] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const { profile, hasPermission } = useAuth();

  function navigate(targetView: string) {
    if (!hasPermission(targetView)) {
      // Don't navigate — the sidebar already hides blocked items,
      // but protect against direct URL / programmatic calls too
      return;
    }
    setView(targetView);
  }

  function renderView() {
    // If the current view was previously accessible but permissions changed, show denied
    if (!hasPermission(view) && view !== 'dashboard') {
      return <AccessDenied moduleId={view} role={profile?.role} />;
    }

    if (view === 'dashboard')       return <Dashboard onNavigate={navigate} />;
    if (view === 'smart-engine')    return <SmartEngine />;
    if (view === 'planner')         return <PlansModule />;
    if (view === 'smart-vision')    return <SmartVisionModule />;
    if (view === 'irrigation')      return <IrrigationModule />;
    if (view === 'equipment')       return <EquipmentModule />;
    if (view === 'tracking')        return <AnimalTrackingModule />;
    if (view === 'marketplace')     return <MarketplaceModule />;
    if (view === 'weather')         return <WeatherModule />;
    if (view === 'sustainability')  return <SustainabilityModule />;
    if (view === 'financial-ai')    return <FinancialAIModule />;
    if (view === 'greenhouse')      return <GreenhouseModule />;
    if (view === 'labor')           return <LaborModule />;
    if (view === 'predictive-ai')   return <PredictiveAIModule />;
    if (view === 'integrations')    return <IntegrationsModule />;
    if (view === 'horticulture')    return <HorticultureModule />;
    if (enterpriseIds.includes(view as EnterpriseId)) return <EnterpriseModule enterpriseId={view as EnterpriseId} />;
    if (view === 'inventory')       return <InventoryModule />;
    if (view === 'sales')           return <SalesModule />;
    if (view === 'finance')         return <FinanceModule />;
    if (view === 'hr')              return <HRModule />;
    if (view === 'procurement')     return <ProcurementModule />;
    if (view === 'biosecurity')     return <BiosecurityModule />;
    if (view === 'reports')         return <ReportsModule />;
    if (view === 'export')          return <ExportModule />;
    if (view === 'assets')          return <AssetsModule />;
    if (view === 'mobile')          return <MobileModule />;
    if (view === 'settings')        return <SettingsModule />;
    return <Dashboard onNavigate={navigate} />;
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar currentView={view} onNavigate={navigate} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          onAdminClick={onAdminClick}
          onLogout={onLogout}
          userName={profile?.full_name || 'User'}
          userRole={ROLE_LABELS[profile?.role || 'farmhand'] || profile?.role || 'Farmhand'}
          organization={profile?.organization || 'My Farm'}
        />
        <main className="flex-1 overflow-x-hidden">{renderView()}</main>
      </div>
    </div>
  );
}

function AccessDenied({ moduleId, role }: { moduleId: string; role?: string }) {
  return (
    <div className="flex items-center justify-center min-h-96 p-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-10 max-w-md text-center shadow-sm">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-500 mb-1">
          You don't have permission to view <strong>{moduleId}</strong>.
        </p>
        {role && (
          <p className="text-xs text-slate-400">
            Your role: <span className="font-medium">{ROLE_LABELS[role] || role}</span>. Contact your director to request access.
          </p>
        )}
      </div>
    </div>
  );
}
