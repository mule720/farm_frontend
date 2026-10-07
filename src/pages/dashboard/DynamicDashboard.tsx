import React, { useMemo, useState } from 'react';
import { useOrg } from '@/store/orgStore';
import { useTransactions } from '@/lib/financeStore';
import { getTemplate } from '@/lib/templates';
import {
  TrendingUp, TrendingDown, AlertTriangle, Plus, Activity,
  BarChart3, Package, ShoppingCart, ArrowRight, Calendar,
  Zap, Target, Clock, Droplets, Thermometer, Sun, Wind,
  Heart, Leaf, DollarSign, Users, Bug, Scale, Egg,
  RefreshCw, Wifi, Battery, Truck, CheckCircle,
} from 'lucide-react';
import { EnterpriseConfig, ProductionCycle, ProductionCategory } from '@/lib/types';

// ─── LS read helper ───────────────────────────────────────────────────────────
function lsGet<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]; } catch { return []; }
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface Tx { id: string; type: 'income' | 'expense'; amount: number; date: string; category: string; cycleId?: string; }
interface Order { id: string; status: string; total: number; date: string; customerId: string; }
interface InvItem { id: string; name: string; currentQty: number; minStockLevel: number; costPerUnit: number; category: string; }
interface AquaPond { id: string; name: string; dissolvedOxygenMgL: number; temperatureC: number; phLevel: number; aeratorOn: boolean; currentBiomassKg: number; }
interface PhHouse { id: string; name: string; currentBirds: number; temperatureC: number; humidityPct: number; fanSpeedPct: number; heaterOn: boolean; }
interface WmTank { id: string; name: string; currentLitres: number; capacityLitres: number; }
interface EmBattery { id: string; name: string; socPct: number; chargingStatus: string; }
interface HrStaff { id: string; name: string; active: boolean; }
interface HrTimelog { id: string; staffId: string; hoursWorked: number; date: string; approved: boolean; enterpriseId: string; }
interface ProcOrder { id: string; status: string; lines: { unitCost: number; qty: number }[]; expectedDelivery: string; }
interface ActivityLog { id: string; ts: string; module: string; action: string; subject: string; detail: string; }
interface Alert { resolved?: boolean; }

// ─── Category KPI definitions ─────────────────────────────────────────────────
interface CategoryKPI {
  key: string; label: string; unit: string; icon: React.ReactNode;
  realValue: (cycle: ProductionCycle | undefined) => string | number; color: string;
}

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
  return Math.max(0, Math.ceil((new Date(stage.targetEndDate).getTime() - Date.now()) / 86400000));
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysSince(dateStr?: string): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}
function colorToHex(cls: string): string {
  const map: Record<string, string> = {
    'bg-amber-500': '#f59e0b', 'bg-blue-500': '#3b82f6', 'bg-green-500': '#22c55e',
    'bg-purple-500': '#a855f7', 'bg-red-500': '#ef4444', 'bg-orange-500': '#f97316',
    'bg-cyan-500': '#06b6d4', 'bg-pink-500': '#ec4899',
  };
  return map[cls] ?? '#22c55e';
}
function timeAgo(ts: string): string {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function fmtMoney(n: number): string { return n.toLocaleString(undefined, { maximumFractionDigits: 0 }); }

const MODULE_COLORS: Record<string, string> = {
  finance: 'bg-green-100 text-green-700', inventory: 'bg-blue-100 text-blue-700',
  production: 'bg-amber-100 text-amber-700', sales: 'bg-purple-100 text-purple-700',
  procurement: 'bg-orange-100 text-orange-700', hr: 'bg-pink-100 text-pink-700',
  aqua: 'bg-cyan-100 text-cyan-700', poultry: 'bg-yellow-100 text-yellow-700',
  water: 'bg-sky-100 text-sky-700', energy: 'bg-lime-100 text-lime-700',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DynamicDashboard({ onNavigate }: { onNavigate: (page: string, params?: Record<string, string>) => void }) {
  const { org, cycles, getCyclesForEnterprise } = useOrg();
  const [activityKey, setActivityKey] = useState(0);

  // ── LS reads — all at top level with [] deps ──────────────────────────────
  const txs         = useTransactions() as unknown as Tx[];
  const orders      = useMemo(() => lsGet<Order>('agronexus_v2_orders'), []);
  const invItems    = useMemo(() => lsGet<InvItem>('agronexus_v2_inventory_items'), []);
  const aquaPonds   = useMemo(() => lsGet<AquaPond>('agronexus_v2_aqua_ponds'), []);
  const phHouses    = useMemo(() => lsGet<PhHouse>('agronexus_v2_ph_houses'), []);
  const wmTanks     = useMemo(() => lsGet<WmTank>('agronexus_v2_wm_tanks'), []);
  const emBattery   = useMemo(() => lsGet<EmBattery>('agronexus_v2_em_battery'), []);
  const hrStaff     = useMemo(() => lsGet<HrStaff>('agronexus_v2_hr_staff'), []);
  const hrTimelog   = useMemo(() => lsGet<HrTimelog>('agronexus_v2_hr_timelog'), []);
  const procOrders  = useMemo(() => lsGet<ProcOrder>('agronexus_v2_procurement_orders'), []);
  const activityLog = useMemo(() => lsGet<ActivityLog>('agronexus_v2_activity_log'), [activityKey]);

  const allAlerts = useMemo(() => [
    ...lsGet<Alert>('agronexus_v2_aqua_alerts'),
    ...lsGet<Alert>('agronexus_v2_wm_alerts'),
    ...lsGet<Alert>('agronexus_v2_ph_alerts'),
    ...lsGet<Alert>('agronexus_v2_em_alerts'),
    ...lsGet<Alert>('agronexus_v2_sd_alerts'),
    ...lsGet<Alert>('agronexus_v2_iot_device_alerts'),
  ], []);

  if (!org) return null;

  const currency = org?.currency ?? 'ZMW';
  const activeEnterprises = org.enterprises.filter(e => e.active);
  const totalActiveCycles = cycles.filter(c => c.status === 'active').length;

  // ── Financial KPIs ────────────────────────────────────────────────────────
  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    + orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // ── Inventory KPIs ────────────────────────────────────────────────────────
  const lowStockCount = invItems.filter(i => i.currentQty <= i.minStockLevel).length;

  // ── Alerts ────────────────────────────────────────────────────────────────
  const unresolvedAlerts = allAlerts.filter(a => !a.resolved).length;

  // ── Active staff ──────────────────────────────────────────────────────────
  const activeStaff = hrStaff.filter(s => s.active).length;

  // ── Monthly P&L (last 6 months) ───────────────────────────────────────────
  const monthlyPL = useMemo(() => {
    const now = new Date();
    const months: { label: string; key: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString(undefined, { month: 'short' });
      months.push({ label, key, income: 0, expense: 0 });
    }
    txs.forEach(t => {
      const key = t.date?.slice(0, 7);
      const m = months.find(m => m.key === key);
      if (!m) return;
      if (t.type === 'income') m.income += t.amount;
      else m.expense += t.amount;
    });
    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      const key = o.date?.slice(0, 7);
      const m = months.find(m => m.key === key);
      if (m) m.income += o.total;
    });
    return months;
  }, [txs, orders]);

  const maxBarVal = Math.max(...monthlyPL.flatMap(m => [m.income, m.expense]), 1);

  // ── This month financials ─────────────────────────────────────────────────
  const thisMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const thisMonth = monthlyPL.find(m => m.key === thisMonthKey) ?? { income: 0, expense: 0 };
  const thisMonthProfit = thisMonth.income - thisMonth.expense;

  // ── Live readings ─────────────────────────────────────────────────────────
  const firstBattery = emBattery[0];
  const fullTanks = wmTanks.filter(t => t.capacityLitres > 0 && t.currentLitres / t.capacityLitres > 0.8).length;
  const avgDO = aquaPonds.length > 0 ? aquaPonds.reduce((s, p) => s + p.dissolvedOxygenMgL, 0) / aquaPonds.length : null;
  const avgPoultryTemp = phHouses.length > 0 ? phHouses.reduce((s, h) => s + h.temperatureC, 0) / phHouses.length : null;

  // ── Recent activity feed ──────────────────────────────────────────────────
  const recentActivity = [...activityLog].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 8);

  // ── Procurement ───────────────────────────────────────────────────────────
  const pendingPOs = procOrders.filter(o => o.status === 'pending' || o.status === 'ordered');
  const pendingSpend = pendingPOs.reduce((s, o) => s + o.lines.reduce((ls, l) => ls + l.unitCost * l.qty, 0), 0);
  const nextDelivery = pendingPOs
    .map(o => o.expectedDelivery).filter(Boolean)
    .sort()[0] ?? null;
  const poByCounts = {
    pending: procOrders.filter(o => o.status === 'pending').length,
    delivered: procOrders.filter(o => o.status === 'delivered').length,
    paid: procOrders.filter(o => o.status === 'paid').length,
  };

  // ── HR / Labour ───────────────────────────────────────────────────────────
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const weekTimelogs = hrTimelog.filter(t => t.date >= sevenDaysAgo);
  const totalHoursWeek = weekTimelogs.reduce((s, t) => s + t.hoursWorked, 0);
  const approvedHours = weekTimelogs.filter(t => t.approved).reduce((s, t) => s + t.hoursWorked, 0);
  const pendingHours = totalHoursWeek - approvedHours;

  // ── Inventory snapshot ────────────────────────────────────────────────────
  const totalInvValue = invItems.reduce((s, i) => s + i.currentQty * i.costPerUnit, 0);
  const top3ByValue = [...invItems].sort((a, b) => b.currentQty * b.costPerUnit - a.currentQty * a.costPerUnit).slice(0, 3);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 overflow-y-auto h-full">

      {/* ── 1. Hero Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {activeEnterprises.length} enterprise{activeEnterprises.length !== 1 ? 's' : ''} ·{' '}
            {totalActiveCycles} active cycle{totalActiveCycles !== 1 ? 's' : ''} ·{' '}
            {activeStaff} staff
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onNavigate('production')}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
            <Plus className="w-4 h-4" /> New Cycle
          </button>
          <button onClick={() => onNavigate('reports')}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">
            <BarChart3 className="w-4 h-4" /> View Reports
          </button>
        </div>
      </div>

      {/* ── 2. Command Strip — 8 KPI cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <CommandKPI label="Total Revenue" value={`${currency} ${fmtMoney(totalIncome)}`}
          subtitle="Income + orders" accent="border-green-500"
          trend={totalIncome > 0 ? 'up' : null} />
        <CommandKPI label="Total Expenses" value={`${currency} ${fmtMoney(totalExpense)}`}
          subtitle="All recorded costs" accent="border-red-400"
          trend={totalExpense > 0 ? 'down' : null} />
        <CommandKPI label="Net Profit" value={`${currency} ${fmtMoney(Math.abs(netProfit))}`}
          subtitle={netProfit >= 0 ? 'Surplus' : 'Deficit'}
          accent={netProfit >= 0 ? 'border-emerald-500' : 'border-red-500'}
          valueColor={netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}
          trend={netProfit >= 0 ? 'up' : 'down'} />
        <CommandKPI label="Profit Margin"
          value={totalIncome > 0 ? `${profitMargin.toFixed(1)}%` : '—'}
          subtitle="Revenue margin"
          accent={profitMargin >= 20 ? 'border-green-500' : profitMargin >= 0 ? 'border-amber-400' : 'border-red-400'}
          trend={profitMargin >= 0 ? 'up' : 'down'} />
        <CommandKPI label="Active Cycles" value={String(totalActiveCycles)}
          subtitle={`${activeEnterprises.length} enterprises`} accent="border-blue-500" trend={null} />
        <CommandKPI label="Inventory Items" value={String(invItems.length)}
          subtitle={lowStockCount > 0 ? `${lowStockCount} low stock` : 'All stocked'}
          accent={lowStockCount > 0 ? 'border-orange-500' : 'border-slate-300'}
          badge={lowStockCount > 0 ? { label: `${lowStockCount} low`, color: 'bg-orange-100 text-orange-700' } : undefined} />
        <CommandKPI label="Unresolved Alerts" value={String(unresolvedAlerts)}
          subtitle="Across all modules"
          accent={unresolvedAlerts > 0 ? 'border-red-500' : 'border-slate-300'}
          valueColor={unresolvedAlerts > 0 ? 'text-red-600' : undefined}
          trend={null} />
        <CommandKPI label="Active Staff" value={String(activeStaff)}
          subtitle={`${hrStaff.length} total registered`} accent="border-violet-500" trend={null} />
      </div>

      {/* ── 3. Three-column analysis row ────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-4">
        {/* Col A — Financial Trend */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-sm font-semibold text-slate-800 mb-3">Revenue vs Expenses</div>
          <div className="flex items-end gap-2 h-20">
            {monthlyPL.map((m) => {
              const incH = Math.round((m.income / maxBarVal) * 80);
              const expH = Math.round((m.expense / maxBarVal) * 80);
              const net = m.income - m.expense;
              return (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="text-[9px] text-slate-400 font-medium" style={{ height: 14 }}>
                    {(m.income > 0 || m.expense > 0) ? (net >= 0 ? `+${fmtMoney(net / 1000)}k` : `-${fmtMoney(Math.abs(net) / 1000)}k`) : ''}
                  </div>
                  <div className="flex items-end gap-0.5 flex-1">
                    <div className="w-3 bg-green-400 rounded-t" style={{ height: Math.max(incH, 2) }} title={`Income: ${fmtMoney(m.income)}`} />
                    <div className="w-3 bg-red-400 rounded-t" style={{ height: Math.max(expH, 2) }} title={`Expense: ${fmtMoney(m.expense)}`} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 mt-1">
            {monthlyPL.map(m => (
              <div key={m.key} className="flex-1 text-center text-[9px] text-slate-400">{m.label}</div>
            ))}
          </div>
          <div className="flex gap-2 mt-1 mb-3">
            <span className="flex items-center gap-1 text-[10px] text-green-600"><span className="w-2 h-2 bg-green-400 rounded-sm inline-block" /> Income</span>
            <span className="flex items-center gap-1 text-[10px] text-red-500"><span className="w-2 h-2 bg-red-400 rounded-sm inline-block" /> Expense</span>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
            <div className="text-center">
              <div className="text-[10px] text-slate-400">This Month Income</div>
              <div className="text-xs font-bold text-green-600">{currency} {fmtMoney(thisMonth.income)}</div>
            </div>
            <div className="text-center border-x border-slate-100">
              <div className="text-[10px] text-slate-400">This Month Expense</div>
              <div className="text-xs font-bold text-red-500">{currency} {fmtMoney(thisMonth.expense)}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-slate-400">This Month Profit</div>
              <div className={`text-xs font-bold ${thisMonthProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {currency} {fmtMoney(Math.abs(thisMonthProfit))}
              </div>
            </div>
          </div>
        </div>

        {/* Col B — Live Farm Status */}
        <div className="col-span-1 bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-slate-800">Live Readings</span>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <div className="space-y-3">
            {/* Battery */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Battery className="w-3.5 h-3.5 text-slate-400" />
                <span>Battery</span>
              </div>
              {firstBattery ? (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${firstBattery.socPct >= 60 ? 'bg-green-100 text-green-700' : firstBattery.socPct >= 30 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                  {firstBattery.socPct}%
                </span>
              ) : <span className="text-xs text-slate-300">—</span>}
            </div>
            {/* Water tanks */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Droplets className="w-3.5 h-3.5 text-slate-400" />
                <span>Water Tanks</span>
              </div>
              {wmTanks.length > 0 ? (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700">
                  {fullTanks}/{wmTanks.length} full
                </span>
              ) : <span className="text-xs text-slate-300">—</span>}
            </div>
            {/* Aqua DO */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Wind className="w-3.5 h-3.5 text-slate-400" />
                <span>Aqua DO</span>
              </div>
              {avgDO !== null ? (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${avgDO >= 5 ? 'bg-green-100 text-green-700' : avgDO >= 4 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                  {avgDO.toFixed(1)} mg/L
                </span>
              ) : <span className="text-xs text-slate-300">—</span>}
            </div>
            {/* Poultry temp */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Thermometer className="w-3.5 h-3.5 text-slate-400" />
                <span>Poultry Temp</span>
              </div>
              {avgPoultryTemp !== null ? (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${avgPoultryTemp >= 24 && avgPoultryTemp <= 32 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {avgPoultryTemp.toFixed(1)}°C
                </span>
              ) : <span className="text-xs text-slate-300">—</span>}
            </div>
          </div>
        </div>

        {/* Col C — Activity Feed */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-800">Activity Feed</span>
            <button onClick={() => setActivityKey(k => k + 1)}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {recentActivity.length === 0 ? (
              <div className="text-xs text-slate-300 text-center py-8">No activity recorded yet</div>
            ) : recentActivity.map(entry => (
              <div key={entry.id} className="flex items-start gap-2">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${MODULE_COLORS[entry.module?.toLowerCase()] ?? 'bg-slate-100 text-slate-600'}`}>
                  {entry.module}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-700 font-medium">{entry.subject}</span>
                  {entry.detail && <span className="text-[10px] text-slate-400 ml-1">{entry.detail}</span>}
                </div>
                <span className="text-[10px] text-slate-300 shrink-0">{timeAgo(entry.ts)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. Enterprise Cards ─────────────────────────────────────────────── */}
      {activeEnterprises.length === 0 ? (
        <EmptyState onNavigate={onNavigate} />
      ) : (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-slate-800">Your Enterprises</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeEnterprises.map(enterprise => (
              <EnterpriseCard
                key={enterprise.id}
                enterprise={enterprise}
                cycles={getCyclesForEnterprise(enterprise.id)}
                txs={txs}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Bottom operational panels ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Procurement Pipeline */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-slate-800">Procurement Pipeline</span>
          </div>
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Pending POs</span>
              <span className="font-semibold text-amber-600">{poByCounts.pending}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Delivered</span>
              <span className="font-semibold text-green-600">{poByCounts.delivered}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Paid</span>
              <span className="font-semibold text-slate-600">{poByCounts.paid}</span>
            </div>
            {nextDelivery && (
              <div className="flex justify-between text-xs border-t border-slate-100 pt-1.5 mt-1.5">
                <span className="text-slate-500">Next delivery</span>
                <span className="font-semibold text-blue-600">{nextDelivery}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Pending spend</span>
              <span className="font-semibold text-red-600">{currency} {fmtMoney(pendingSpend)}</span>
            </div>
          </div>
          <button onClick={() => onNavigate('procurement')}
            className="w-full text-xs py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-1">
            View Procurement <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Staff & Labour */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-semibold text-slate-800">Staff &amp; Labour</span>
          </div>
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Active staff</span>
              <span className="font-semibold text-violet-600">{activeStaff}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Hours this week</span>
              <span className="font-semibold text-slate-700">{totalHoursWeek.toFixed(1)} hrs</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Approved hours</span>
              <span className="font-semibold text-green-600">{approvedHours.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Pending approval</span>
              <span className={`font-semibold ${pendingHours > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{pendingHours.toFixed(1)}</span>
            </div>
          </div>
          <button onClick={() => onNavigate('staff')}
            className="w-full text-xs py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-1">
            View Staff <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Inventory Snapshot */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-slate-800">Inventory Snapshot</span>
          </div>
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Total value</span>
              <span className="font-semibold text-slate-700">{currency} {fmtMoney(totalInvValue)}</span>
            </div>
            {lowStockCount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Low stock items</span>
                <span className="font-semibold text-red-600 px-1.5 py-0.5 bg-red-50 rounded-full">{lowStockCount}</span>
              </div>
            )}
            {top3ByValue.map(item => (
              <div key={item.id} className="flex justify-between text-xs border-t border-slate-100 pt-1">
                <span className="text-slate-500 truncate max-w-[120px]">{item.name}</span>
                <span className="font-semibold text-slate-600">{currency} {fmtMoney(item.currentQty * item.costPerUnit)}</span>
              </div>
            ))}
          </div>
          <button onClick={() => onNavigate('inventory')}
            className="w-full text-xs py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-1">
            View Inventory <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Command KPI Card ─────────────────────────────────────────────────────────
function CommandKPI({ label, value, subtitle, accent, valueColor, trend, badge }: {
  label: string; value: string; subtitle?: string; accent: string;
  valueColor?: string; trend?: 'up' | 'down' | null;
  badge?: { label: string; color: string };
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 border-l-4 ${accent}`}>
      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-xl font-bold ${valueColor ?? 'text-slate-900'} flex items-center gap-1`}>
        {value}
        {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
        {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        {subtitle && <div className="text-[10px] text-slate-400">{subtitle}</div>}
        {badge && <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>}
      </div>
    </div>
  );
}

// ─── Enterprise Card ──────────────────────────────────────────────────────────
function EnterpriseCard({
  enterprise, cycles, txs, onNavigate,
}: {
  enterprise: EnterpriseConfig; cycles: ProductionCycle[]; txs: Tx[];
  onNavigate: (p: string, params?: Record<string, string>) => void;
}) {
  const template = getTemplate(enterprise.templateId);
  const activeCycle = cycles.find(c => c.status === 'active');
  const completedCycles = cycles.filter(c => c.status === 'completed').length;
  const currentStage = activeCycle?.stages.find(s => s.id === activeCycle.currentStageId);
  const stagesTotal = activeCycle?.stages.length ?? 0;
  const stagesDone = activeCycle?.stages.filter(s => s.status === 'completed').length ?? 0;
  const progressPct = stagesTotal > 0 ? Math.round((stagesDone / stagesTotal) * 100) : 0;
  const cat = template?.category ?? 'crops';
  const catKpis = CATEGORY_KPIS[cat] ?? CATEGORY_KPIS.crops;

  // Mini financial strip — filter txs by cycleIds for this enterprise
  const entCycleIds = new Set(cycles.map(c => c.id));
  const entTxs = txs.filter(t => t.cycleId && entCycleIds.has(t.cycleId));
  const entRevenue = entTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const entExpense = entTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const currency = 'ZMW';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:shadow-md transition-shadow overflow-hidden">
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
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/70 text-slate-500 border border-slate-200 capitalize">{cat}</span>
          <button onClick={() => onNavigate('enterprise', { id: enterprise.id })} className="p-2 hover:bg-white/50 rounded-lg">
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {activeCycle && (
        <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
          {catKpis.map(kpi => <CategoryKPICell key={kpi.key} kpi={kpi} cycle={activeCycle} />)}
        </div>
      )}

      <div className="px-5 py-4">
        {activeCycle ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-medium text-slate-800">{activeCycle.name}</span>
              </div>
              <span className="text-slate-400 text-xs">
                <Clock className="inline w-3 h-3 mr-0.5" />Day {daysSince(activeCycle.startDate)}
              </span>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Stage: <strong className="text-slate-700">{currentStage?.name ?? '—'}</strong></span>
                <span>{stagesDone}/{stagesTotal} complete</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="text-right text-[10px] text-slate-400 mt-0.5">{progressPct}%</div>
            </div>
            {/* Mini financial strip */}
            <div className="grid grid-cols-2 gap-2 border border-slate-100 rounded-lg px-3 py-2">
              <div>
                <div className="text-[10px] text-slate-400">Revenue</div>
                <div className="text-xs font-semibold text-green-600">{currency} {fmtMoney(entRevenue)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Expenses</div>
                <div className="text-xs font-semibold text-red-500">{currency} {fmtMoney(entExpense)}</div>
              </div>
            </div>
            <button onClick={() => onNavigate('cycle', { id: activeCycle.id })}
              className="w-full py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1">
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
            <button onClick={() => onNavigate('new-cycle', { enterpriseId: enterprise.id })}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1.5 mx-auto">
              <Plus className="w-4 h-4" /> Start cycle
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 px-5 py-3 flex gap-4 text-xs text-slate-500">
        <span>{cycles.length} total</span>
        <span>{completedCycles} completed</span>
        <span className="ml-auto flex items-center gap-1"><Calendar className="w-3 h-3" />{template?.category}</span>
      </div>
    </div>
  );
}

// ─── Category KPI Cell ────────────────────────────────────────────────────────
function CategoryKPICell({ kpi, cycle }: { kpi: CategoryKPI; cycle: ProductionCycle | undefined }) {
  const colorMap: Record<string, string> = {
    amber: 'text-amber-600', yellow: 'text-yellow-600', red: 'text-red-500',
    blue: 'text-blue-600', green: 'text-green-600', cyan: 'text-cyan-600',
    teal: 'text-teal-600', orange: 'text-orange-500', emerald: 'text-emerald-600',
    pink: 'text-pink-600', slate: 'text-slate-500', violet: 'text-violet-600', stone: 'text-stone-600',
  };
  const val = kpi.realValue(cycle);
  return (
    <div className="px-2 py-2.5 text-center">
      <div className={`flex justify-center mb-1 ${colorMap[kpi.color] ?? 'text-slate-500'}`}>{kpi.icon}</div>
      <div className="text-[11px] font-bold text-slate-800 leading-tight">
        {typeof val === 'number' ? val.toLocaleString() : val}
        {kpi.unit && <span className="font-normal text-slate-400"> {kpi.unit}</span>}
      </div>
      <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">{kpi.label}</div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
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
