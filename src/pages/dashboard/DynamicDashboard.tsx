import React from 'react';
import { useOrg } from '@/store/orgStore';
import { getTemplate } from '@/lib/templates';
import {
  TrendingUp, TrendingDown, AlertTriangle, Plus, Activity,
  BarChart3, Package, ShoppingCart, ArrowRight, Calendar,
  Zap, Target, Clock,
} from 'lucide-react';
import { EnterpriseConfig, ProductionCycle } from '@/lib/types';

interface DashboardProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function DynamicDashboard({ onNavigate }: DashboardProps) {
  const { org, cycles, getCyclesForEnterprise } = useOrg();
  if (!org) return null;

  const activeEnterprises = org.enterprises.filter(e => e.active);
  const totalActiveCycles = cycles.filter(c => c.status === 'active').length;
  const totalEnterprises  = activeEnterprises.length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Welcome bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {totalEnterprises} enterprise{totalEnterprises !== 1 ? 's' : ''} · {totalActiveCycles} active cycle{totalActiveCycles !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate('production')}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            <Plus className="w-4 h-4" /> New Cycle
          </button>
        </div>
      </div>

      {/* Platform KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          label="Active Enterprises"
          value={totalEnterprises}
          icon={<Target className="w-4 h-4" />}
          color="green"
        />
        <KPICard
          label="Active Cycles"
          value={totalActiveCycles}
          icon={<Activity className="w-4 h-4" />}
          color="blue"
        />
        <KPICard
          label="Completed This Month"
          value={cycles.filter(c => c.status === 'completed' && isThisMonth(c.endDate)).length}
          icon={<BarChart3 className="w-4 h-4" />}
          color="amber"
        />
        <KPICard
          label="Inventory Items"
          value="—"
          icon={<Package className="w-4 h-4" />}
          color="slate"
          subtitle="Coming soon"
        />
      </div>

      {/* Enterprise cards */}
      {activeEnterprises.length === 0 ? (
        <EmptyState onNavigate={onNavigate} />
      ) : (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-800">Your Enterprises</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeEnterprises.map(enterprise => (
              <EnterpriseCard
                key={enterprise.id}
                enterprise={enterprise}
                cycles={getCyclesForEnterprise(enterprise.id)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickAction
          icon={<Activity className="w-5 h-5 text-blue-600" />}
          title="Record Daily Data"
          description="Log today's measurements for active cycles"
          bg="bg-blue-50"
          onClick={() => onNavigate('production')}
        />
        <QuickAction
          icon={<ShoppingCart className="w-5 h-5 text-green-600" />}
          title="Record a Sale"
          description="Create a sales order for a customer"
          bg="bg-green-50"
          onClick={() => onNavigate('sales')}
        />
        <QuickAction
          icon={<Zap className="w-5 h-5 text-amber-600" />}
          title="AgriFood Market"
          description="Browse buyers or list your produce"
          bg="bg-amber-50"
          onClick={() => onNavigate('marketplace-food')}
        />
      </div>
    </div>
  );
}

// ─── Enterprise Card ──────────────────────────────────────────────────────────

function EnterpriseCard({
  enterprise, cycles, onNavigate,
}: { enterprise: EnterpriseConfig; cycles: ProductionCycle[]; onNavigate: (p: string, params?: Record<string, string>) => void }) {
  const template = getTemplate(enterprise.templateId);
  const activeCycle = cycles.find(c => c.status === 'active');
  const completedCycles = cycles.filter(c => c.status === 'completed').length;

  const currentStage = activeCycle?.stages.find(s => s.id === activeCycle.currentStageId);
  const stagesTotal  = activeCycle?.stages.length ?? 0;
  const stagesDone   = activeCycle?.stages.filter(s => s.status === 'completed').length ?? 0;
  const progressPct  = stagesTotal > 0 ? Math.round((stagesDone / stagesTotal) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:shadow-md transition-shadow overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-4 flex items-center justify-between ${enterprise.color} bg-opacity-10`}
        style={{ background: `linear-gradient(135deg, ${colorToHex(enterprise.color)}15, ${colorToHex(enterprise.color)}05)` }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{template?.icon ?? '🌱'}</span>
          <div>
            <div className="font-bold text-slate-900">{enterprise.name}</div>
            <div className="text-xs text-slate-500">{template?.name ?? enterprise.templateId}</div>
          </div>
        </div>
        <button
          onClick={() => onNavigate('enterprise', { id: enterprise.id })}
          className="p-2 hover:bg-white/50 rounded-lg"
        >
          <ArrowRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {activeCycle ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-medium text-slate-800">{activeCycle.name}</span>
              </div>
              <span className="text-slate-400 text-xs">
                <Clock className="inline w-3 h-3 mr-0.5" />
                {daysSince(activeCycle.startDate)}d
              </span>
            </div>

            {/* Stage progress */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Stage: <strong className="text-slate-700">{currentStage?.name ?? '—'}</strong></span>
                <span>{stagesDone}/{stagesTotal} stages</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Stage KPIs from template */}
            {template?.kpis.slice(0, 3).map(kpi => (
              <div key={kpi.id} className="flex justify-between text-sm">
                <span className="text-slate-500">{kpi.name}</span>
                <span className="font-semibold text-slate-700">— {kpi.unit}</span>
              </div>
            ))}

            <button
              onClick={() => onNavigate('cycle', { id: activeCycle.id })}
              className="w-full mt-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1"
            >
              View cycle <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-slate-400 text-sm mb-3">
              {completedCycles > 0
                ? `${completedCycles} completed cycle${completedCycles !== 1 ? 's' : ''}. Start a new one.`
                : 'No active cycle. Start your first production cycle.'}
            </div>
            <button
              onClick={() => onNavigate('new-cycle', { enterpriseId: enterprise.id })}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1.5 mx-auto"
            >
              <Plus className="w-4 h-4" /> Start cycle
            </button>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="border-t border-slate-100 px-5 py-3 flex gap-4 text-xs text-slate-500">
        <span>{cycles.length} total cycle{cycles.length !== 1 ? 's' : ''}</span>
        <span>{completedCycles} completed</span>
        <span className="ml-auto flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {template?.category}
        </span>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ label, value, icon, color, subtitle, change }: {
  label: string; value: string | number; icon: React.ReactNode;
  color: string; subtitle?: string; change?: number;
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 text-green-600',
    blue:  'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-500',
    red:   'bg-red-50 text-red-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <div className={`p-1.5 rounded-lg ${colorMap[color] ?? colorMap.slate}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
      {change !== undefined && (
        <div className={`text-xs mt-1 flex items-center gap-0.5 ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(change)}% vs last period
        </div>
      )}
    </div>
  );
}

// ─── Quick Action ─────────────────────────────────────────────────────────────

function QuickAction({ icon, title, description, bg, onClick }: {
  icon: React.ReactNode; title: string; description: string; bg: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`${bg} rounded-xl p-4 text-left hover:shadow-md transition-shadow border border-transparent hover:border-slate-200 w-full`}>
      <div className="mb-3">{icon}</div>
      <div className="font-semibold text-slate-800 text-sm">{title}</div>
      <div className="text-xs text-slate-500 mt-0.5">{description}</div>
    </button>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
      <div className="text-5xl mb-4">🌱</div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">No enterprises yet</h3>
      <p className="text-slate-500 text-sm mb-6">Add your first enterprise to start tracking production.</p>
      <button onClick={() => onNavigate('config')}
        className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
        Add enterprise
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(dateStr?: string): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function isThisMonth(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

function colorToHex(cls: string): string {
  const map: Record<string, string> = {
    'bg-amber-500': '#f59e0b',
    'bg-blue-500':  '#3b82f6',
    'bg-green-500': '#22c55e',
    'bg-purple-500':'#a855f7',
    'bg-red-500':   '#ef4444',
    'bg-orange-500':'#f97316',
    'bg-cyan-500':  '#06b6d4',
    'bg-pink-500':  '#ec4899',
  };
  return map[cls] ?? '#22c55e';
}
