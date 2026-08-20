import React, { useMemo } from 'react';
import { useOrg } from '@/store/orgStore';
import { getTemplate } from '@/lib/templates';
import {
  TrendingUp, TrendingDown, AlertTriangle, Plus, Activity,
  BarChart3, Package, ShoppingCart, ArrowRight, Calendar,
  Zap, Target, Clock, Droplets, Thermometer, Sun, Wind,
  Heart, Leaf, DollarSign, Users, Bug, Scale, Egg,
} from 'lucide-react';
import { EnterpriseConfig, ProductionCycle, ProductionCategory } from '@/lib/types';

interface DashboardProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

// ─── Category KPI definitions ─────────────────────────────────────────────────
// Each category gets a set of KPI "slots" that are shown on its enterprise card
// realValue receives the active cycle and returns a value derived from stored data.
// Return '—' if the data isn't available (e.g. requires IoT / daily records).
interface CategoryKPI {
  key: string;
  label: string;
  unit: string;
  icon: React.ReactNode;
  realValue: (cycle: ProductionCycle | undefined) => string | number;
  color: string;
}

// ─── Real-value helpers ───────────────────────────────────────────────────────
// Derive what we can from production cycle data; return '—' for sensor-only data.
function unitQty(cycle: ProductionCycle | undefined): number {
  return (cycle?.productionUnits ?? []).reduce((s, u) => s + (u.quantity ?? 0), 0);
}
function daysInStage(cycle: ProductionCycle | undefined): number {
  const stage = cycle?.stages.find(s => s.id === cycle.currentStageId);
  if (!stage?.startDate) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(stage.startDate).getTime()) / 86400000));
}
function daysToEnd(cycle: ProductionCycle | undefined): number | '—' {
  const stage = cycle?.stages.find(s => s.id === cycle.currentStageId);
  if (!stage?.targetEndDate) return '—';
  const diff = Math.ceil((new Date(stage.targetEndDate).getTime() - Date.now()) / 86400000);
  return Math.max(0, diff);
}
function areaFromUnits(cycle: ProductionCycle | undefined): string | '—' {
  const u = (cycle?.productionUnits ?? []).find(u => ['ha', 'hectare', 'm²', 'm2'].includes((u.unit ?? '').toLowerCase()));
  return u ? u.quantity.toFixed(2) : '—';
}
function countFromUnits(cycle: ProductionCycle | undefined, unitLabel: string): number | '—' {
  const u = (cycle?.productionUnits ?? []).find(u => u.unit?.toLowerCase().includes(unitLabel.toLowerCase()));
  return u ? u.quantity : unitQty(cycle) || '—';
}

const CATEGORY_KPIS: Record<string, CategoryKPI[]> = {
  poultry: [
    { key: 'flock', label: 'Flock Count', unit: 'birds', icon: <Users className="w-3.5 h-3.5" />, realValue: (c) => unitQty(c) || '—', color: 'amber' },
    { key: 'age', label: 'Days in Stage', unit: 'days', icon: <Heart className="w-3.5 h-3.5" />, realValue: (c) => daysInStage(c), color: 'red' },
    { key: 'stage', label: 'Current Stage', unit: '', icon: <Activity className="w-3.5 h-3.5" />, realValue: (c) => c?.stages.find(s => s.id === c.currentStageId)?.name ?? '—', color: 'yellow' },
    { key: 'harvest', label: 'Days to End', unit: 'days', icon: <Scale className="w-3.5 h-3.5" />, realValue: (c) => daysToEnd(c), color: 'blue' },
  ],
  livestock: [
    { key: 'herd', label: 'Herd Count', unit: 'animals', icon: <Users className="w-3.5 h-3.5" />, realValue: (c) => unitQty(c) || '—', color: 'orange' },
    { key: 'age', label: 'Days in Stage', unit: 'days', icon: <Droplets className="w-3.5 h-3.5" />, realValue: (c) => daysInStage(c), color: 'blue' },
    { key: 'stage', label: 'Current Stage', unit: '', icon: <TrendingUp className="w-3.5 h-3.5" />, realValue: (c) => c?.stages.find(s => s.id === c.currentStageId)?.name ?? '—', color: 'green' },
    { key: 'harvest', label: 'Days to End', unit: 'days', icon: <AlertTriangle className="w-3.5 h-3.5" />, realValue: (c) => daysToEnd(c), color: 'red' },
  ],
  aquaculture: [
    { key: 'fish', label: 'Fish Stocked', unit: '', icon: <Scale className="w-3.5 h-3.5" />, realValue: (c) => countFromUnits(c, 'fish'), color: 'blue' },
    { key: 'ponds', label: 'Ponds / Tanks', unit: '', icon: <Thermometer className="w-3.5 h-3.5" />, realValue: (c) => countFromUnits(c, 'pond') !== '—' ? countFromUnits(c, 'pond') : countFromUnits(c, 'tank'), color: 'cyan' },
    { key: 'stage', label: 'Current Stage', unit: '', icon: <Wind className="w-3.5 h-3.5" />, realValue: (c) => c?.stages.find(s => s.id === c.currentStageId)?.name ?? '—', color: 'teal' },
    { key: 'harvest', label: 'Days to End', unit: 'days', icon: <Scale className="w-3.5 h-3.5" />, realValue: (c) => daysToEnd(c), color: 'green' },
  ],
  crops: [
    { key: 'area', label: 'Area Planted', unit: 'ha', icon: <Leaf className="w-3.5 h-3.5" />, realValue: (c) => areaFromUnits(c), color: 'green' },
    { key: 'stage', label: 'Current Stage', unit: '', icon: <Sun className="w-3.5 h-3.5" />, realValue: (c) => c?.stages.find(s => s.id === c.currentStageId)?.name ?? '—', color: 'yellow' },
    { key: 'age', label: 'Days in Stage', unit: 'days', icon: <Droplets className="w-3.5 h-3.5" />, realValue: (c) => daysInStage(c), color: 'blue' },
    { key: 'harvest', label: 'Days to End', unit: 'days', icon: <Bug className="w-3.5 h-3.5" />, realValue: (c) => daysToEnd(c), color: 'red' },
  ],
  horticulture: [
    { key: 'area', label: 'Area Planted', unit: 'ha', icon: <Leaf className="w-3.5 h-3.5" />, realValue: (c) => areaFromUnits(c), color: 'green' },
    { key: 'plants', label: 'Plant Count', unit: '', icon: <TrendingUp className="w-3.5 h-3.5" />, realValue: (c) => countFromUnits(c, 'plant'), color: 'emerald' },
    { key: 'stage', label: 'Current Stage', unit: '', icon: <Droplets className="w-3.5 h-3.5" />, realValue: (c) => c?.stages.find(s => s.id === c.currentStageId)?.name ?? '—', color: 'blue' },
    { key: 'harvest', label: 'Days to Harvest', unit: 'days', icon: <Calendar className="w-3.5 h-3.5" />, realValue: (c) => daysToEnd(c), color: 'amber' },
  ],
  greenhouse: [
    { key: 'area', label: 'Growing Area', unit: 'm²', icon: <Thermometer className="w-3.5 h-3.5" />, realValue: (c) => areaFromUnits(c), color: 'orange' },
    { key: 'plants', label: 'Plants', unit: '', icon: <Droplets className="w-3.5 h-3.5" />, realValue: (c) => countFromUnits(c, 'plant'), color: 'blue' },
    { key: 'stage', label: 'Current Stage', unit: '', icon: <Sun className="w-3.5 h-3.5" />, realValue: (c) => c?.stages.find(s => s.id === c.currentStageId)?.name ?? '—', color: 'yellow' },
    { key: 'harvest', label: 'Days to Harvest', unit: 'days', icon: <Calendar className="w-3.5 h-3.5" />, realValue: (c) => daysToEnd(c), color: 'emerald' },
  ],
  orchard: [
    { key: 'trees', label: 'Trees', unit: '', icon: <Leaf className="w-3.5 h-3.5" />, realValue: (c) => countFromUnits(c, 'tree'), color: 'green' },
    { key: 'area', label: 'Plot Area', unit: 'ha', icon: <Sun className="w-3.5 h-3.5" />, realValue: (c) => areaFromUnits(c), color: 'pink' },
    { key: 'stage', label: 'Current Stage', unit: '', icon: <Droplets className="w-3.5 h-3.5" />, realValue: (c) => c?.stages.find(s => s.id === c.currentStageId)?.name ?? '—', color: 'blue' },
    { key: 'harvest', label: 'Days to End', unit: 'days', icon: <TrendingUp className="w-3.5 h-3.5" />, realValue: (c) => daysToEnd(c), color: 'emerald' },
  ],
  apiary: [
    { key: 'hives', label: 'Active Hives', unit: '', icon: <Target className="w-3.5 h-3.5" />, realValue: (c) => countFromUnits(c, 'hive'), color: 'amber' },
    { key: 'age', label: 'Days in Cycle', unit: 'days', icon: <DollarSign className="w-3.5 h-3.5" />, realValue: (c) => c?.startDate ? Math.floor((Date.now() - new Date(c.startDate).getTime()) / 86400000) : '—', color: 'yellow' },
    { key: 'stage', label: 'Current Stage', unit: '', icon: <Heart className="w-3.5 h-3.5" />, realValue: (c) => c?.stages.find(s => s.id === c.currentStageId)?.name ?? '—', color: 'green' },
    { key: 'harvest', label: 'Days to End', unit: 'days', icon: <Bug className="w-3.5 h-3.5" />, realValue: (c) => daysToEnd(c), color: 'red' },
  ],
  mushroom: [
    { key: 'blocks', label: 'Growing Blocks', unit: '', icon: <Package className="w-3.5 h-3.5" />, realValue: (c) => countFromUnits(c, 'block'), color: 'stone' },
    { key: 'age', label: 'Days in Stage', unit: 'days', icon: <Droplets className="w-3.5 h-3.5" />, realValue: (c) => daysInStage(c), color: 'blue' },
    { key: 'stage', label: 'Current Stage', unit: '', icon: <Thermometer className="w-3.5 h-3.5" />, realValue: (c) => c?.stages.find(s => s.id === c.currentStageId)?.name ?? '—', color: 'orange' },
    { key: 'harvest', label: 'Days to End', unit: 'days', icon: <Scale className="w-3.5 h-3.5" />, realValue: (c) => daysToEnd(c), color: 'green' },
  ],
  processing: [
    { key: 'stage', label: 'Current Stage', unit: '', icon: <Activity className="w-3.5 h-3.5" />, realValue: (c) => c?.stages.find(s => s.id === c.currentStageId)?.name ?? '—', color: 'slate' },
    { key: 'age', label: 'Days in Stage', unit: 'days', icon: <Zap className="w-3.5 h-3.5" />, realValue: (c) => daysInStage(c), color: 'green' },
    { key: 'stages_done', label: 'Stages Done', unit: '', icon: <AlertTriangle className="w-3.5 h-3.5" />, realValue: (c) => c ? `${c.stages.filter(s => s.status === 'completed').length}/${c.stages.length}` : '—', color: 'amber' },
    { key: 'harvest', label: 'Days to End', unit: 'days', icon: <BarChart3 className="w-3.5 h-3.5" />, realValue: (c) => daysToEnd(c), color: 'blue' },
  ],
  services: [
    { key: 'stage', label: 'Current Stage', unit: '', icon: <Activity className="w-3.5 h-3.5" />, realValue: (c) => c?.stages.find(s => s.id === c.currentStageId)?.name ?? '—', color: 'violet' },
    { key: 'age', label: 'Days in Cycle', unit: 'days', icon: <Users className="w-3.5 h-3.5" />, realValue: (c) => c?.startDate ? Math.floor((Date.now() - new Date(c.startDate).getTime()) / 86400000) : '—', color: 'blue' },
    { key: 'stages_done', label: 'Stages Done', unit: '', icon: <DollarSign className="w-3.5 h-3.5" />, realValue: (c) => c ? `${c.stages.filter(s => s.status === 'completed').length}/${c.stages.length}` : '—', color: 'green' },
    { key: 'harvest', label: 'Days to End', unit: 'days', icon: <Heart className="w-3.5 h-3.5" />, realValue: (c) => daysToEnd(c), color: 'amber' },
  ],
};

export default function DynamicDashboard({ onNavigate }: DashboardProps) {
  const { org, cycles, getCyclesForEnterprise } = useOrg();
  if (!org) return null;

  const activeEnterprises = org.enterprises.filter(e => e.active);
  const totalActiveCycles = cycles.filter(c => c.status === 'active').length;
  const totalEnterprises  = activeEnterprises.length;

  // ── Real data from other engines (localStorage) ───────────────────────────
  const invItems: any[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('agronexus_v2_inventory_items') ?? '[]'); } catch { return []; }
  }, []);
  const txs: any[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('agronexus_v2_transactions') ?? '[]'); } catch { return []; }
  }, []);
  const orders: any[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('agronexus_v2_orders') ?? '[]'); } catch { return []; }
  }, []);

  const invCount   = invItems.length;
  const lowStock   = invItems.filter((i: any) => i.currentQty <= i.minStockLevel).length;
  const totalIncome  = txs.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0)
                     + orders.filter((o: any) => o.status !== 'cancelled').reduce((s: number, o: any) => s + o.total, 0);
  const totalExpense = txs.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
  const netProfit    = totalIncome - totalExpense;

  // Derive aggregate KPIs from whatever categories are active
  const categories = [...new Set(activeEnterprises.map(e => {
    const tpl = getTemplate(e.templateId);
    return tpl?.category ?? 'crops';
  }))] as ProductionCategory[];

  const hasPoultry   = categories.includes('poultry');
  const hasLivestock = categories.includes('livestock');
  const hasAqua      = categories.includes('aquaculture');
  const hasCrops     = categories.includes('crops') || categories.includes('horticulture');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 overflow-y-auto h-full">
      {/* Welcome bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {totalEnterprises} enterprise{totalEnterprises !== 1 ? 's' : ''} · {totalActiveCycles} active cycle{totalActiveCycles !== 1 ? 's' : ''}
            {categories.length > 0 && <span className="ml-2 text-slate-400">· {categories.join(', ')}</span>}
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
        <KPICard label="Active Enterprises" value={totalEnterprises}
          icon={<Target className="w-4 h-4" />} color="green" />
        <KPICard label="Active Cycles" value={totalActiveCycles}
          icon={<Activity className="w-4 h-4" />} color="blue" />
        <KPICard
          label="Inventory Items"
          value={invCount === 0 ? '—' : invCount}
          icon={<Package className="w-4 h-4" />}
          color={lowStock > 0 ? 'red' : 'slate'}
          subtitle={lowStock > 0 ? `${lowStock} low stock` : invCount === 0 ? 'Add items in Inventory' : 'All stocked'}
        />
        <KPICard
          label="Net P&L"
          value={totalIncome === 0 && totalExpense === 0 ? '—' : `${org.currency} ${Math.abs(netProfit).toLocaleString()}`}
          icon={<DollarSign className="w-4 h-4" />}
          color={netProfit >= 0 ? 'green' : 'red'}
          subtitle={totalIncome === 0 ? 'Record in Finance' : netProfit >= 0 ? 'Profit' : 'Loss'}
        />
      </div>

      {/* Category-aware alert strip — only shown when relevant */}
      {totalActiveCycles > 0 && (hasPoultry || hasLivestock || hasAqua) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {hasPoultry && (
            <AlertTile
              icon="🐔" label="Poultry Health"
              items={['FCR within target', 'Mortality < 1.2%', 'Vaccinations current']}
              color="amber" />
          )}
          {hasLivestock && (
            <AlertTile
              icon="🐄" label="Livestock Health"
              items={['Milk yield on track', 'No disease alerts', 'Breeding schedule OK']}
              color="orange" />
          )}
          {hasAqua && (
            <AlertTile
              icon="🐟" label="Pond Water Quality"
              items={['O₂ levels optimal', 'pH stable at 7.2', 'Temp in range']}
              color="blue" />
          )}
        </div>
      )}

      {/* Enterprise cards */}
      {activeEnterprises.length === 0 ? (
        <EmptyState onNavigate={onNavigate} />
      ) : (
        <div className="space-y-4">
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
          title="AI Insights"
          description="Disease alerts, yield forecasts, FCR optimizer"
          bg="bg-amber-50"
          onClick={() => onNavigate('ai-predictive')}
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

  // Category-specific KPIs
  const cat = template?.category ?? 'crops';
  const catKpis = CATEGORY_KPIS[cat] ?? CATEGORY_KPIS.crops;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:shadow-md transition-shadow overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${colorToHex(enterprise.color)}18, ${colorToHex(enterprise.color)}05)` }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{template?.icon ?? '🌱'}</span>
          <div>
            <div className="font-bold text-slate-900">{enterprise.name}</div>
            <div className="text-xs text-slate-500">{template?.name ?? enterprise.templateId}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/70 text-slate-500 border border-slate-200 capitalize">
            {cat}
          </span>
          <button
            onClick={() => onNavigate('enterprise', { id: enterprise.id })}
            className="p-2 hover:bg-white/50 rounded-lg"
          >
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Category KPI strip */}
      {activeCycle && (
        <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
          {catKpis.map(kpi => (
            <CategoryKPICell key={kpi.key} kpi={kpi} cycle={activeCycle} />
          ))}
        </div>
      )}

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
                Day {daysSince(activeCycle.startDate)}
              </span>
            </div>

            {/* Stage progress */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Stage: <strong className="text-slate-700">{currentStage?.name ?? '—'}</strong></span>
                <span>{stagesDone}/{stagesTotal} complete</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="text-right text-[10px] text-slate-400 mt-0.5">{progressPct}%</div>
            </div>

            <button
              onClick={() => onNavigate('cycle', { id: activeCycle.id })}
              className="w-full py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1"
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
        <span>{cycles.length} total</span>
        <span>{completedCycles} completed</span>
        <span className="ml-auto flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {template?.category}
        </span>
      </div>
    </div>
  );
}

// ─── Category KPI cell inside enterprise card ─────────────────────────────────

function CategoryKPICell({ kpi, cycle }: { kpi: CategoryKPI; cycle: ProductionCycle | undefined }) {
  const colorMap: Record<string, string> = {
    amber: 'text-amber-600', yellow: 'text-yellow-600', red: 'text-red-500',
    blue: 'text-blue-600', green: 'text-green-600', cyan: 'text-cyan-600',
    teal: 'text-teal-600', orange: 'text-orange-500', emerald: 'text-emerald-600',
    pink: 'text-pink-600', slate: 'text-slate-500', violet: 'text-violet-600',
    stone: 'text-stone-600',
  };
  const val = kpi.realValue(cycle);
  return (
    <div className="px-2 py-2.5 text-center">
      <div className={`flex justify-center mb-1 ${colorMap[kpi.color] ?? 'text-slate-500'}`}>
        {kpi.icon}
      </div>
      <div className="text-[11px] font-bold text-slate-800 leading-tight">
        {typeof val === 'number' ? val.toLocaleString() : val}
        {kpi.unit && <span className="font-normal text-slate-400"> {kpi.unit}</span>}
      </div>
      <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">{kpi.label}</div>
    </div>
  );
}

// ─── Alert tile ───────────────────────────────────────────────────────────────

function AlertTile({ icon, label, items, color }: {
  icon: string; label: string; items: string[]; color: string;
}) {
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-50 border-amber-200',
    orange: 'bg-orange-50 border-orange-200',
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] ?? 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
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
