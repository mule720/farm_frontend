// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Reports Engine  (7-tab MIS suite)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Activity, Package, DollarSign,
  Download, Users, Truck, Leaf, RefreshCw, Filter, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, Clock,
} from 'lucide-react';
import { useOrg } from '@/store/orgStore';
import { getTemplate } from '@/lib/templates';
import { exportCSV, backupAll } from '@/lib/exportUtils';

// ─── Tab definition ──────────────────────────────────────────────────────────
const TABS = ['overview', 'finance', 'production', 'inventory', 'staff', 'procurement', 'export'] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  finance: 'Finance',
  production: 'Production',
  inventory: 'Inventory',
  staff: 'Staff & Labour',
  procurement: 'Procurement',
  export: 'Export',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number, currency: string): string {
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString(undefined, { month: 'short', year: '2-digit' });
}

function last6Months(): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return result;
}

function last12Months(): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return result;
}

function weekStart(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return ymd(d);
}

function last8WeekStarts(): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay() - i * 7);
    result.push(ymd(d));
  }
  return result;
}

function starRating(rating: number): string {
  const full = Math.floor(rating ?? 0);
  const half = (rating ?? 0) - full >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'green' | 'red' | 'amber' | 'violet' | 'default';
  badge?: number;
  icon?: React.ReactNode;
}

function KpiCard({ label, value, sub, accent = 'default', badge, icon }: KpiCardProps) {
  const accentClass: Record<string, string> = {
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    amber: 'text-amber-600 dark:text-amber-400',
    violet: 'text-violet-600 dark:text-violet-400',
    default: 'text-gray-900 dark:text-white',
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
        <span className="text-gray-400 dark:text-gray-500">{icon}</span>
      </div>
      <div className={`text-2xl font-bold ${accentClass[accent]}`}>
        {value}
        {badge !== undefined && badge > 0 && (
          <span className="ml-2 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-2 py-0.5 rounded-full">{badge}</span>
        )}
      </div>
      {sub && <div className="text-xs text-gray-400 dark:text-gray-500">{sub}</div>}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{title}</h3>
      {action}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    ordered: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    delivered: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    paid: 'bg-green-100 text-green-700',
    unpaid: 'bg-red-100 text-red-700',
    ok: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    low: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    overdue: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    due_soon: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    up_to_date: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  };
  const key = (status ?? '').toLowerCase().replace(/ /g, '_');
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[key] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
      {status}
    </span>
  );
}

// ─── CSS bar chart helper ─────────────────────────────────────────────────────
function CssBar({ value, maxValue, color = 'bg-violet-500', width = false }: {
  value: number; maxValue: number; color?: string; width?: boolean;
}) {
  const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
  if (width) {
    return (
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    );
  }
  const px = Math.max(4, Math.round((value / Math.max(maxValue, 1)) * 100));
  return (
    <div className="flex items-end" style={{ height: '100px' }}>
      <div className={`${color} rounded-t w-full`} style={{ height: `${px}px` }} />
    </div>
  );
}

// ─── Date range filter ────────────────────────────────────────────────────────
function DateRangeFilter({
  from, to, onFrom, onTo,
}: { from: string; to: string; onFrom: (v: string) => void; onTo: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3 flex-wrap mb-4">
      <Filter className="w-4 h-4 text-gray-400" />
      <label className="text-sm text-gray-600 dark:text-gray-400">From</label>
      <input type="date" value={from} onChange={e => onFrom(e.target.value)}
        className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
      <label className="text-sm text-gray-600 dark:text-gray-400">To</label>
      <input type="date" value={to} onChange={e => onTo(e.target.value)}
        className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
      {(from || to) && (
        <button onClick={() => { onFrom(''); onTo(''); }}
          className="text-xs text-violet-600 dark:text-violet-400 hover:underline">Clear</button>
      )}
    </div>
  );
}

// ─── Export button ────────────────────────────────────────────────────────────
function ExportBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg transition-colors">
      <Download className="w-3.5 h-3.5" /> Export CSV
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ReportsEngine() {
  const { org, cycles } = useOrg();
  const currency = org?.currency ?? 'ZMW';

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedPO, setExpandedPO] = useState<string | null>(null);

  // ── LS reads (all at top, useMemo with [] deps) ──────────────────────────
  const txs = useMemo<any[]>(() => { try { return JSON.parse(localStorage.getItem('agronexus_v2_transactions') ?? '[]') as any[]; } catch { return []; } }, []);
  const orders = useMemo<any[]>(() => { try { return JSON.parse(localStorage.getItem('agronexus_v2_orders') ?? '[]') as any[]; } catch { return []; } }, []);
  const invItems = useMemo<any[]>(() => { try { return JSON.parse(localStorage.getItem('agronexus_v2_inventory_items') ?? '[]') as any[]; } catch { return []; } }, []);
  const batches = useMemo<any[]>(() => { try { return JSON.parse(localStorage.getItem('agronexus_v2_batches') ?? '[]') as any[]; } catch { return []; } }, []);
  const hrStaff = useMemo<any[]>(() => { try { return JSON.parse(localStorage.getItem('agronexus_v2_hr_staff') ?? '[]') as any[]; } catch { return []; } }, []);
  const hrTimelog = useMemo<any[]>(() => { try { return JSON.parse(localStorage.getItem('agronexus_v2_hr_timelog') ?? '[]') as any[]; } catch { return []; } }, []);
  const procOrders = useMemo<any[]>(() => { try { return JSON.parse(localStorage.getItem('agronexus_v2_procurement_orders') ?? '[]') as any[]; } catch { return []; } }, []);
  const procSuppliers = useMemo<any[]>(() => { try { return JSON.parse(localStorage.getItem('agronexus_v2_procurement_suppliers') ?? '[]') as any[]; } catch { return []; } }, []);
  const crFields = useMemo<any[]>(() => { try { return JSON.parse(localStorage.getItem('agronexus_v2_cr_fields') ?? '[]') as any[]; } catch { return []; } }, []);
  const crHistory = useMemo<any[]>(() => { try { return JSON.parse(localStorage.getItem('agronexus_v2_cr_history') ?? '[]') as any[]; } catch { return []; } }, []);
  const vaccinations = useMemo<any[]>(() => { try { return JSON.parse(localStorage.getItem('agronexus_v2_health_vaccinations') ?? '[]') as any[]; } catch { return []; } }, []);
  const treatments = useMemo<any[]>(() => { try { return JSON.parse(localStorage.getItem('agronexus_v2_health_treatments') ?? '[]') as any[]; } catch { return []; } }, []);
  const activityLog = useMemo<any[]>(() => { try { return JSON.parse(localStorage.getItem('agronexus_v2_activity_log') ?? '[]') as any[]; } catch { return []; } }, []);
  const lastBackup = useMemo<string>(() => localStorage.getItem('agronexus_v2_last_backup') ?? 'Never', []);

  // ── Filtered txs ──────────────────────────────────────────────────────────
  const filteredTxs = useMemo(() => txs.filter(t => {
    if (dateFrom && t.date < dateFrom) return false;
    if (dateTo && t.date > dateTo) return false;
    return true;
  }), [txs, dateFrom, dateTo]);

  // ── Top-level aggregates ──────────────────────────────────────────────────
  const totalIncome = useMemo(() => filteredTxs.filter(t => t.type === 'income').reduce((s: number, t: any) => s + (t.amount ?? 0), 0), [filteredTxs]);
  const totalExpense = useMemo(() => filteredTxs.filter(t => t.type === 'expense').reduce((s: number, t: any) => s + (t.amount ?? 0), 0), [filteredTxs]);
  const netProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
  const invValue = useMemo(() => invItems.reduce((s: number, i: any) => s + (i.currentQty ?? 0) * (i.costPerUnit ?? 0), 0), [invItems]);
  const lowStockCount = useMemo(() => invItems.filter((i: any) => (i.currentQty ?? 0) <= (i.minStockLevel ?? 0)).length, [invItems]);
  const activeCycles = useMemo(() => cycles.filter((c: any) => c.status === 'active'), [cycles]);
  const completedCycles = useMemo(() => cycles.filter((c: any) => c.status === 'completed'), [cycles]);

  // ─────────────────────────────────────────────────────────────────────────
  // TAB: OVERVIEW
  // ─────────────────────────────────────────────────────────────────────────
  const months6 = useMemo(() => last6Months(), []);

  const monthlyIncome6 = useMemo(() => {
    const map: Record<string, number> = {};
    txs.forEach((t: any) => {
      const ym = (t.date ?? '').slice(0, 7);
      if (t.type === 'income' && months6.includes(ym)) map[ym] = (map[ym] ?? 0) + (t.amount ?? 0);
    });
    return months6.map(m => map[m] ?? 0);
  }, [txs, months6]);

  const monthlyExpense6 = useMemo(() => {
    const map: Record<string, number> = {};
    txs.forEach((t: any) => {
      const ym = (t.date ?? '').slice(0, 7);
      if (t.type === 'expense' && months6.includes(ym)) map[ym] = (map[ym] ?? 0) + (t.amount ?? 0);
    });
    return months6.map(m => map[m] ?? 0);
  }, [txs, months6]);

  const topExpenseCategories = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTxs.filter(t => t.type === 'expense').forEach((t: any) => {
      map[t.category ?? 'Uncategorized'] = (map[t.category ?? 'Uncategorized'] ?? 0) + (t.amount ?? 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filteredTxs]);

  const topIncomeCategories = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTxs.filter(t => t.type === 'income').forEach((t: any) => {
      map[t.category ?? 'Uncategorized'] = (map[t.category ?? 'Uncategorized'] ?? 0) + (t.amount ?? 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filteredTxs]);

  const enterpriseRevenue = useMemo(() => {
    if (!org?.enterprises) return [];
    return org.enterprises.map((ent: any) => {
      const total = filteredTxs.filter((t: any) => t.cycleId && t.type === 'income' && cycles.some((c: any) => c.id === t.cycleId && c.enterpriseId === ent.id))
        .reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
      return { name: ent.name, color: ent.color ?? '#7c3aed', total };
    }).filter(e => e.total > 0);
  }, [filteredTxs, org, cycles]);

  const maxBarIncome = Math.max(...monthlyIncome6, 1);
  const maxBarExpense = Math.max(...monthlyExpense6, 1);
  const maxBar = Math.max(maxBarIncome, maxBarExpense, 1);
  const maxExpenseCat = topExpenseCategories[0]?.[1] ?? 1;
  const maxIncomeCat = topIncomeCategories[0]?.[1] ?? 1;
  const maxEntRev = Math.max(...enterpriseRevenue.map(e => e.total), 1);

  // ─────────────────────────────────────────────────────────────────────────
  // TAB: FINANCE
  // ─────────────────────────────────────────────────────────────────────────
  const months12 = useMemo(() => last12Months(), []);

  const monthlyPL = useMemo(() => months12.map(ym => {
    const inc = txs.filter((t: any) => t.type === 'income' && (t.date ?? '').startsWith(ym)).reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
    const exp = txs.filter((t: any) => t.type === 'expense' && (t.date ?? '').startsWith(ym)).reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
    const net = inc - exp;
    const margin = inc > 0 ? (net / inc) * 100 : 0;
    return { ym, inc, exp, net, margin };
  }), [txs, months12]);

  const incomeByCat = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};
    filteredTxs.filter(t => t.type === 'income').forEach((t: any) => {
      const k = t.category ?? 'Uncategorized';
      if (!map[k]) map[k] = { amount: 0, count: 0 };
      map[k].amount += t.amount ?? 0;
      map[k].count += 1;
    });
    const total = Object.values(map).reduce((s, v) => s + v.amount, 0) || 1;
    return Object.entries(map).sort((a, b) => b[1].amount - a[1].amount).map(([cat, v]) => ({ cat, ...v, pct: (v.amount / total * 100).toFixed(1) }));
  }, [filteredTxs]);

  const expenseByCat = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};
    filteredTxs.filter(t => t.type === 'expense').forEach((t: any) => {
      const k = t.category ?? 'Uncategorized';
      if (!map[k]) map[k] = { amount: 0, count: 0 };
      map[k].amount += t.amount ?? 0;
      map[k].count += 1;
    });
    const total = Object.values(map).reduce((s, v) => s + v.amount, 0) || 1;
    return Object.entries(map).sort((a, b) => b[1].amount - a[1].amount).map(([cat, v]) => ({ cat, ...v, pct: (v.amount / total * 100).toFixed(1) }));
  }, [filteredTxs]);

  const cashFlow = useMemo(() => {
    const sorted = [...filteredTxs].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')).slice(0, 50);
    let bal = 0;
    return sorted.map((t: any) => {
      bal += t.type === 'income' ? (t.amount ?? 0) : -(t.amount ?? 0);
      return { ...t, balance: bal };
    });
  }, [filteredTxs]);

  const orderSummary = useMemo(() => {
    const valid = orders.filter((o: any) => o.status !== 'cancelled');
    const total = valid.reduce((s: number, o: any) => s + (o.total ?? 0), 0);
    const avg = valid.length ? total / valid.length : 0;
    return { total, count: valid.length, avg };
  }, [orders]);

  // ─────────────────────────────────────────────────────────────────────────
  // TAB: PRODUCTION
  // ─────────────────────────────────────────────────────────────────────────
  const cycleStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { active: 0, completed: 0, failed: 0, paused: 0 };
    cycles.forEach((c: any) => { if (counts[c.status] !== undefined) counts[c.status]++; });
    return counts;
  }, [cycles]);

  const cyclesTableData = useMemo(() => cycles.map((c: any) => {
    const ent = org?.enterprises?.find((e: any) => e.id === c.enterpriseId);
    const template = ent ? getTemplate(ent.type) : null;
    const totalStages = template?.stages?.length ?? 0;
    const doneStages = c.stages?.filter((s: any) => s.status === 'completed').length ?? 0;
    const eventCount = c.stages?.flatMap((s: any) => s.events ?? []).length ?? 0;
    const recordCount = c.dailyRecords?.length ?? 0;
    const startDate = c.startDate ?? c.createdAt ?? '';
    const durationDays = startDate ? Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000) : 0;
    return { id: c.id, num: c.cycleNumber ?? c.id, enterprise: ent?.name ?? '—', status: c.status, startDate, durationDays, doneStages, totalStages, eventCount, recordCount };
  }), [cycles, org]);

  const stageHeatmap = useMemo(() => {
    if (!org?.enterprises) return [];
    return org.enterprises.map((ent: any) => {
      const template = getTemplate(ent.type);
      const entCycles = cycles.filter((c: any) => c.enterpriseId === ent.id);
      const stages = (template?.stages ?? []).map((st: any) => {
        const completedCount = entCycles.filter((c: any) => c.stages?.some((s: any) => s.stageId === st.id && s.status === 'completed')).length;
        const inProgressCount = entCycles.filter((c: any) => c.stages?.some((s: any) => s.stageId === st.id && s.status === 'in_progress')).length;
        const status = completedCount > 0 ? 'completed' : inProgressCount > 0 ? 'in_progress' : 'pending';
        return { name: st.name ?? st.id, status };
      });
      return { enterprise: ent.name, stages };
    });
  }, [org, cycles]);

  const eventTypeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    cycles.forEach((c: any) => {
      c.stages?.forEach((s: any) => {
        s.events?.forEach((e: any) => {
          const k = e.type ?? 'unknown';
          map[k] = (map[k] ?? 0) + 1;
        });
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [cycles]);

  const mortalityAnalysis = useMemo(() => cycles.map((c: any) => {
    const ent = org?.enterprises?.find((e: any) => e.id === c.enterpriseId);
    const events = c.stages?.flatMap((s: any) => (s.events ?? []).filter((e: any) => e.type === 'mortality')) ?? [];
    const totalMort = events.reduce((s: number, e: any) => s + (e.data?.count ?? 0), 0);
    const starting = c.productionUnits ?? 0;
    const rate = starting > 0 ? (totalMort / starting * 100).toFixed(1) : '—';
    return { id: c.id, num: c.cycleNumber ?? c.id, enterprise: ent?.name ?? '—', mortality: totalMort, starting, rate };
  }).filter(c => c.mortality > 0), [cycles, org]);

  // ─────────────────────────────────────────────────────────────────────────
  // TAB: INVENTORY
  // ─────────────────────────────────────────────────────────────────────────
  const invByCategory = useMemo(() => {
    const map: Record<string, { count: number; value: number; totalCost: number }> = {};
    invItems.forEach((i: any) => {
      const k = i.category ?? 'Uncategorized';
      if (!map[k]) map[k] = { count: 0, value: 0, totalCost: 0 };
      map[k].count++;
      map[k].value += (i.currentQty ?? 0) * (i.costPerUnit ?? 0);
      map[k].totalCost += i.costPerUnit ?? 0;
    });
    return Object.entries(map).sort((a, b) => b[1].value - a[1].value).map(([cat, v]) => ({
      cat, count: v.count, totalValue: v.value, avgCostPerUnit: v.count > 0 ? v.totalCost / v.count : 0,
    }));
  }, [invItems]);

  const lowStockItems = useMemo(() => invItems
    .filter((i: any) => (i.currentQty ?? 0) <= (i.minStockLevel ?? 0))
    .map((i: any) => {
      const deficit = (i.minStockLevel ?? 0) - (i.currentQty ?? 0);
      return { ...i, deficit, reorderCost: deficit * (i.costPerUnit ?? 0) };
    }), [invItems]);

  const processingStats = useMemo(() => {
    const completed = batches.filter((b: any) => b.status === 'completed');
    const passed = batches.filter((b: any) => b.qualityStatus === 'passed');
    const totalIn = batches.reduce((s: number, b: any) => s + (b.inputWeightKg ?? 0), 0);
    const totalOut = batches.reduce((s: number, b: any) => s + (b.outputWeightKg ?? 0), 0);
    const yieldRatio = totalIn > 0 ? (totalOut / totalIn * 100).toFixed(1) : '0.0';
    const passRate = batches.length > 0 ? (passed.length / batches.length * 100).toFixed(1) : '0.0';
    const inProgress = batches.filter((b: any) => b.status === 'in_progress').length;
    return { completed: completed.length, inProgress, yieldRatio, passRate };
  }, [batches]);

  const invTableData = useMemo(() => invItems.map((i: any) => {
    const totalVal = (i.currentQty ?? 0) * (i.costPerUnit ?? 0);
    const ratio = (i.currentQty ?? 0) / Math.max(i.minStockLevel ?? 1, 1);
    const status = ratio <= 0 ? 'CRITICAL' : ratio <= 1 ? 'LOW' : 'OK';
    return { ...i, totalVal, status };
  }), [invItems]);

  const maxCatValue = invByCategory[0]?.totalValue ?? 1;

  // ─────────────────────────────────────────────────────────────────────────
  // TAB: STAFF
  // ─────────────────────────────────────────────────────────────────────────
  const today = useMemo(() => ymd(new Date()), []);
  const weekAgo = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 7); return ymd(d); }, []);

  const thisWeekLogs = useMemo(() => hrTimelog.filter((t: any) => (t.date ?? '') >= weekAgo), [hrTimelog, weekAgo]);
  const thisWeekHours = useMemo(() => thisWeekLogs.reduce((s: number, t: any) => s + (t.hoursWorked ?? 0), 0), [thisWeekLogs]);
  const approvedHours = useMemo(() => thisWeekLogs.filter((t: any) => t.approved).reduce((s: number, t: any) => s + (t.hoursWorked ?? 0), 0), [thisWeekLogs]);
  const pendingHours = thisWeekHours - approvedHours;

  const weekCost = useMemo(() => thisWeekLogs.filter((t: any) => t.approved).reduce((s: number, log: any) => {
    const staff = hrStaff.find((st: any) => st.id === log.staffId);
    return s + (log.hoursWorked ?? 0) * ((staff?.dailyRate ?? 0) / 8);
  }, 0), [thisWeekLogs, hrStaff]);

  const weeks8 = useMemo(() => last8WeekStarts(), []);

  const weeklyHours = useMemo(() => weeks8.map(ws => {
    const we = ymd(new Date(new Date(ws).getTime() + 7 * 86400000));
    const total = hrTimelog.filter((t: any) => (t.date ?? '') >= ws && (t.date ?? '') < we)
      .reduce((s: number, t: any) => s + (t.hoursWorked ?? 0), 0);
    const label = `W${ws.slice(5, 7)}`;
    return { ws, label, total };
  }), [hrTimelog, weeks8]);

  const maxWeekHours = Math.max(...weeklyHours.map(w => w.total), 1);

  const staffPerf = useMemo(() => hrStaff.map((st: any) => {
    const logs = thisWeekLogs.filter((t: any) => t.staffId === st.id);
    const hours = logs.reduce((s: number, t: any) => s + (t.hoursWorked ?? 0), 0);
    const approved = logs.filter((t: any) => t.approved).reduce((s: number, t: any) => s + (t.hoursWorked ?? 0), 0);
    const cost = approved * ((st.dailyRate ?? 0) / 8);
    return { id: st.id, name: st.name, role: st.role, dailyRate: st.dailyRate, hours, approved, cost };
  }), [hrStaff, thisWeekLogs]);

  const labourByEnterprise = useMemo(() => {
    const map: Record<string, { hours: number; cost: number }> = {};
    hrTimelog.filter((t: any) => (t.date ?? '') >= weekAgo).forEach((log: any) => {
      const k = log.enterpriseId ?? 'unassigned';
      if (!map[k]) map[k] = { hours: 0, cost: 0 };
      map[k].hours += log.hoursWorked ?? 0;
      const staff = hrStaff.find((s: any) => s.id === log.staffId);
      map[k].cost += (log.hoursWorked ?? 0) * ((staff?.dailyRate ?? 0) / 8);
    });
    const total = Object.values(map).reduce((s, v) => s + v.cost, 0) || 1;
    return Object.entries(map).map(([entId, v]) => {
      const ent = org?.enterprises?.find((e: any) => e.id === entId);
      return { name: ent?.name ?? entId, ...v, pct: (v.cost / total * 100).toFixed(1) };
    }).sort((a, b) => b.cost - a.cost);
  }, [hrTimelog, hrStaff, org, weekAgo]);

  const maxLabourCost = Math.max(...labourByEnterprise.map(l => l.cost), 1);

  const pendingApprovals = useMemo(() => hrTimelog.filter((t: any) => !t.approved && (t.date ?? '') >= weekAgo).map((log: any) => {
    const staff = hrStaff.find((s: any) => s.id === log.staffId);
    return { ...log, staffName: staff?.name ?? log.staffId };
  }), [hrTimelog, hrStaff, weekAgo]);

  const vaccDue = useMemo(() => vaccinations.filter((v: any) => {
    if (!v.nextDueDate) return false;
    const diff = (new Date(v.nextDueDate).getTime() - Date.now()) / 86400000;
    return diff <= 14;
  }).map((v: any) => {
    const diff = Math.ceil((new Date(v.nextDueDate).getTime() - Date.now()) / 86400000);
    return { ...v, daysUntil: diff, overdue: diff < 0 };
  }), [vaccinations]);

  const activeWithdrawal = useMemo(() => treatments.filter((t: any) => {
    if (!t.startDate || !t.withdrawalDays) return false;
    const end = new Date(t.startDate);
    end.setDate(end.getDate() + (t.withdrawalDays ?? 0));
    return end >= new Date();
  }).map((t: any) => {
    const end = new Date(t.startDate);
    end.setDate(end.getDate() + (t.withdrawalDays ?? 0));
    const remaining = Math.ceil((end.getTime() - Date.now()) / 86400000);
    return { ...t, remaining };
  }), [treatments]);

  // ─────────────────────────────────────────────────────────────────────────
  // TAB: PROCUREMENT
  // ─────────────────────────────────────────────────────────────────────────
  const poValue = (po: any) => (po.lines ?? []).reduce((s: number, l: any) => s + (l.qty ?? 0) * (l.unitCost ?? 0), 0);

  const procStats = useMemo(() => {
    const total = procOrders.length;
    const pending = procOrders.filter((p: any) => p.status === 'pending').length;
    const ordered = procOrders.filter((p: any) => p.status === 'ordered').length;
    const delivered = procOrders.filter((p: any) => p.status === 'delivered').length;
    const totalSpend = procOrders.reduce((s: number, p: any) => s + poValue(p), 0);
    const pendingSpend = procOrders.filter((p: any) => !['delivered', 'cancelled'].includes(p.status)).reduce((s: number, p: any) => s + poValue(p), 0);
    const overdue = procOrders.filter((p: any) => p.expectedDelivery < today && !['delivered', 'cancelled'].includes(p.status)).length;
    return { total, pending, ordered, delivered, totalSpend, pendingSpend, overdue };
  }, [procOrders, today]);

  const poStatusBreakdown = useMemo(() => {
    const map: Record<string, number> = { pending: 0, ordered: 0, delivered: 0, cancelled: 0 };
    procOrders.forEach((p: any) => { if (map[p.status] !== undefined) map[p.status]++; });
    const total = procOrders.length || 1;
    return Object.entries(map).map(([s, c]) => ({ status: s, count: c, pct: Math.round(c / total * 100) }));
  }, [procOrders]);

  const spendBySupplier = useMemo(() => {
    const map: Record<string, { spend: number; count: number; last: string }> = {};
    procOrders.forEach((po: any) => {
      const k = po.supplierId ?? 'unknown';
      if (!map[k]) map[k] = { spend: 0, count: 0, last: '' };
      map[k].spend += poValue(po);
      map[k].count++;
      if ((po.expectedDelivery ?? '') > map[k].last) map[k].last = po.expectedDelivery ?? '';
    });
    return Object.entries(map).sort((a, b) => b[1].spend - a[1].spend).map(([suppId, v]) => {
      const sup = procSuppliers.find((s: any) => s.id === suppId);
      return { name: sup?.name ?? suppId, ...v };
    });
  }, [procOrders, procSuppliers]);

  const overduePOs = useMemo(() => procOrders.filter((p: any) => p.expectedDelivery < today && !['delivered', 'cancelled'].includes(p.status)).map((p: any) => {
    const sup = procSuppliers.find((s: any) => s.id === p.supplierId);
    const daysOverdue = Math.floor((Date.now() - new Date(p.expectedDelivery).getTime()) / 86400000);
    return { id: p.id, supplier: sup?.name ?? p.supplierId, expectedDate: p.expectedDelivery, daysOverdue, value: poValue(p) };
  }), [procOrders, procSuppliers, today]);

  const poColors: Record<string, string> = { pending: 'bg-amber-400', ordered: 'bg-blue-400', delivered: 'bg-green-400', cancelled: 'bg-red-400' };

  const supplierRatings = useMemo(() => procSuppliers.map((s: any) => {
    const pos = procOrders.filter((p: any) => p.supplierId === s.id);
    const spend = pos.reduce((sum: number, p: any) => sum + poValue(p), 0);
    return { ...s, poCount: pos.length, spend };
  }).sort((a, b) => b.spend - a.spend), [procSuppliers, procOrders]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* ── Tab bar ── */}
      <div className="flex-none bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 pt-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-none px-4 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}>
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">

        {/* ════════════════════════════════════════════════════════ OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            <DateRangeFilter from={dateFrom} to={dateTo} onFrom={setDateFrom} onTo={setDateTo} />

            {/* KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Total Revenue" value={fmt(totalIncome, currency)} accent="green" icon={<TrendingUp className="w-4 h-4" />} />
              <KpiCard label="Total Expenses" value={fmt(totalExpense, currency)} accent="red" icon={<TrendingDown className="w-4 h-4" />} />
              <KpiCard label="Net Profit" value={fmt(netProfit, currency)} accent={netProfit >= 0 ? 'green' : 'red'} icon={<DollarSign className="w-4 h-4" />} />
              <KpiCard label="Profit Margin" value={`${profitMargin.toFixed(1)}%`} accent={profitMargin > 20 ? 'green' : profitMargin > 0 ? 'amber' : 'red'} icon={<Activity className="w-4 h-4" />} />
              <KpiCard label="Active Cycles" value={activeCycles.length} accent="violet" icon={<Leaf className="w-4 h-4" />} />
              <KpiCard label="Completed Cycles" value={completedCycles.length} icon={<CheckCircle className="w-4 h-4" />} />
              <KpiCard label="Inventory Value" value={fmt(invValue, currency)} icon={<Package className="w-4 h-4" />} />
              <KpiCard label="Low Stock Items" value={lowStockCount} accent={lowStockCount > 0 ? 'red' : 'green'} badge={lowStockCount > 0 ? lowStockCount : undefined} icon={<AlertTriangle className="w-4 h-4" />} />
            </div>

            {/* 6-month bar chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="Financial Trend — Last 6 Months" />
              <div className="flex items-end gap-3 overflow-x-auto pb-2">
                {months6.map((ym, i) => {
                  const inc = monthlyIncome6[i];
                  const exp = monthlyExpense6[i];
                  const net = inc - exp;
                  return (
                    <div key={ym} className="flex flex-col items-center gap-1 min-w-[64px]">
                      <span className={`text-xs font-medium ${net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {net >= 0 ? '+' : ''}{Math.round(net / 1000)}k
                      </span>
                      <div className="flex items-end gap-1" style={{ height: '100px' }}>
                        <div className="w-6 bg-green-400 dark:bg-green-500 rounded-t" style={{ height: `${Math.max(2, Math.round(inc / maxBar * 100))}px` }} title={`Income: ${fmt(inc, currency)}`} />
                        <div className="w-6 bg-red-400 dark:bg-red-500 rounded-t" style={{ height: `${Math.max(2, Math.round(exp / maxBar * 100))}px` }} title={`Expense: ${fmt(exp, currency)}`} />
                      </div>
                      <span className="text-xs text-gray-500">{monthLabel(ym)}</span>
                    </div>
                  );
                })}
                <div className="flex items-center gap-3 ml-4 self-center">
                  <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-3 h-3 bg-green-400 rounded-sm inline-block" /> Income</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-3 h-3 bg-red-400 rounded-sm inline-block" /> Expense</span>
                </div>
              </div>
            </div>

            {/* Top categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <SectionHeader title="Top 5 Expense Categories" />
                <div className="space-y-3">
                  {topExpenseCategories.length === 0 && <p className="text-sm text-gray-400">No data</p>}
                  {topExpenseCategories.map(([cat, amt]) => (
                    <div key={cat} className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300 w-28 truncate" title={cat}>{cat}</span>
                      <div className="flex-1">
                        <CssBar value={amt} maxValue={maxExpenseCat} color="bg-red-400" width />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-28 text-right">{fmt(amt, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <SectionHeader title="Top 5 Income Sources" />
                <div className="space-y-3">
                  {topIncomeCategories.length === 0 && <p className="text-sm text-gray-400">No data</p>}
                  {topIncomeCategories.map(([cat, amt]) => (
                    <div key={cat} className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300 w-28 truncate" title={cat}>{cat}</span>
                      <div className="flex-1">
                        <CssBar value={amt} maxValue={maxIncomeCat} color="bg-green-400" width />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-28 text-right">{fmt(amt, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Enterprise revenue share */}
            {enterpriseRevenue.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <SectionHeader title="Enterprise Revenue Share" />
                <div className="space-y-3">
                  {enterpriseRevenue.map(e => (
                    <div key={e.name} className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300 w-32 truncate">{e.name}</span>
                      <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.round(e.total / maxEntRev * 100)}%`, backgroundColor: e.color }} />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32 text-right">{fmt(e.total, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════ FINANCE */}
        {activeTab === 'finance' && (
          <>
            <DateRangeFilter from={dateFrom} to={dateTo} onFrom={setDateFrom} onTo={setDateTo} />

            {/* Monthly P&L */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="Monthly P&L — Last 12 Months"
                action={<ExportBtn onClick={() => exportCSV('monthly_pl.csv', monthlyPL.map(r => ({ Month: r.ym, Income: r.inc, Expenses: r.exp, Net: r.net, 'Margin%': r.margin.toFixed(1) })))} />} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Month</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">Income</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">Expenses</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">Net</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">Margin</th>
                  </tr></thead>
                  <tbody>{monthlyPL.map(row => (
                    <tr key={row.ym} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{monthLabel(row.ym)}</td>
                      <td className="py-2 px-2 text-right text-green-600 dark:text-green-400">{fmt(row.inc, currency)}</td>
                      <td className="py-2 px-2 text-right text-red-500 dark:text-red-400">{fmt(row.exp, currency)}</td>
                      <td className={`py-2 px-2 text-right font-medium ${row.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(row.net, currency)}</td>
                      <td className={`py-2 px-2 text-right font-medium ${row.margin > 20 ? 'text-green-600' : row.margin > 0 ? 'text-amber-600' : 'text-red-500'}`}>{row.margin.toFixed(1)}%</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[{ title: 'Income by Category', data: incomeByCat, color: 'text-green-600' }, { title: 'Expense by Category', data: expenseByCat, color: 'text-red-500' }].map(({ title, data, color }) => (
                <div key={title} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <SectionHeader title={title} />
                  {data.length === 0 ? <p className="text-sm text-gray-400">No data</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-100 dark:border-gray-700">
                          <th className="text-left py-1.5 text-gray-500 font-medium">Category</th>
                          <th className={`text-right py-1.5 ${color} font-medium`}>Amount</th>
                          <th className="text-right py-1.5 text-gray-500 font-medium">%</th>
                          <th className="text-right py-1.5 text-gray-500 font-medium">Txs</th>
                        </tr></thead>
                        <tbody>{data.map(row => (
                          <tr key={row.cat} className="border-b border-gray-50 dark:border-gray-700">
                            <td className="py-1.5 text-gray-700 dark:text-gray-300">{row.cat}</td>
                            <td className={`py-1.5 text-right font-medium ${color}`}>{fmt(row.amount, currency)}</td>
                            <td className="py-1.5 text-right text-gray-500">{row.pct}%</td>
                            <td className="py-1.5 text-right text-gray-400">{row.count}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Cash flow */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="Cash Flow Statement (chronological, first 50)"
                action={<ExportBtn onClick={() => exportCSV('cash_flow.csv', cashFlow.map(r => ({ Date: r.date, Type: r.type, Category: r.category, Amount: r.amount, Balance: r.balance })))} />} />
              {cashFlow.length === 0 ? <p className="text-sm text-gray-400">No transactions in range.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-2 text-gray-500 font-medium">Date</th>
                      <th className="text-left py-2 px-2 text-gray-500 font-medium">Type</th>
                      <th className="text-left py-2 px-2 text-gray-500 font-medium">Category</th>
                      <th className="text-right py-2 px-2 text-gray-500 font-medium">Amount</th>
                      <th className="text-right py-2 px-2 text-gray-500 font-medium">Balance</th>
                    </tr></thead>
                    <tbody>{cashFlow.map((r, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-700">
                        <td className="py-1.5 px-2 text-gray-600 dark:text-gray-400">{r.date}</td>
                        <td className="py-1.5 px-2"><StatusBadge status={r.type} /></td>
                        <td className="py-1.5 px-2 text-gray-600 dark:text-gray-400">{r.category ?? '—'}</td>
                        <td className={`py-1.5 px-2 text-right font-medium ${r.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>{fmt(r.amount ?? 0, currency)}</td>
                        <td className={`py-1.5 px-2 text-right font-medium ${r.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(r.balance, currency)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Sales orders */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="Sales Orders"
                action={<ExportBtn onClick={() => exportCSV('sales_orders.csv', orders.map((o: any) => ({ ID: o.id, Date: o.date, Customer: o.customerName, Total: o.total, Status: o.status })))} />} />
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center"><div className="text-xl font-bold text-gray-900 dark:text-white">{fmt(orderSummary.total, currency)}</div><div className="text-xs text-gray-500">Total Revenue</div></div>
                <div className="text-center"><div className="text-xl font-bold text-gray-900 dark:text-white">{orderSummary.count}</div><div className="text-xs text-gray-500">Orders</div></div>
                <div className="text-center"><div className="text-xl font-bold text-gray-900 dark:text-white">{fmt(orderSummary.avg, currency)}</div><div className="text-xs text-gray-500">Avg Order</div></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Customer</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Total</th>
                    <th className="text-left py-2 pl-2 text-gray-500 font-medium">Status</th>
                  </tr></thead>
                  <tbody>{orders.slice(0, 30).map((o: any) => (
                    <tr key={o.id} className="border-b border-gray-50 dark:border-gray-700">
                      <td className="py-1.5 text-gray-600 dark:text-gray-400">{o.date}</td>
                      <td className="py-1.5 text-gray-700 dark:text-gray-300">{o.customerName}</td>
                      <td className="py-1.5 text-right font-medium text-gray-900 dark:text-white">{fmt(o.total ?? 0, currency)}</td>
                      <td className="py-1.5 pl-2"><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════ PRODUCTION */}
        {activeTab === 'production' && (
          <>
            {/* Status chips */}
            <div className="flex gap-3 flex-wrap">
              {Object.entries(cycleStatusCounts).map(([status, count]) => (
                <div key={status} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 flex items-center gap-2">
                  <StatusBadge status={status} />
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>

            {/* Cycles table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="All Cycles"
                action={<ExportBtn onClick={() => exportCSV('cycles.csv', cyclesTableData.map(r => ({ Cycle: r.num, Enterprise: r.enterprise, Status: r.status, StartDate: r.startDate, DurationDays: r.durationDays, StagesDone: r.doneStages, TotalStages: r.totalStages, Events: r.eventCount, DailyRecords: r.recordCount })))} />} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-1 text-gray-500 font-medium">Cycle #</th>
                    <th className="text-left py-2 px-1 text-gray-500 font-medium">Enterprise</th>
                    <th className="text-left py-2 px-1 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-2 px-1 text-gray-500 font-medium">Start</th>
                    <th className="text-right py-2 px-1 text-gray-500 font-medium">Days</th>
                    <th className="text-right py-2 px-1 text-gray-500 font-medium">Stages</th>
                    <th className="text-right py-2 px-1 text-gray-500 font-medium">Events</th>
                    <th className="text-right py-2 px-1 text-gray-500 font-medium">Records</th>
                  </tr></thead>
                  <tbody>{cyclesTableData.map(row => (
                    <tr key={row.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="py-1.5 px-1 font-mono text-gray-700 dark:text-gray-300">{row.num}</td>
                      <td className="py-1.5 px-1 text-gray-700 dark:text-gray-300">{row.enterprise}</td>
                      <td className="py-1.5 px-1"><StatusBadge status={row.status} /></td>
                      <td className="py-1.5 px-1 text-gray-500">{row.startDate}</td>
                      <td className="py-1.5 px-1 text-right text-gray-600 dark:text-gray-400">{row.durationDays}</td>
                      <td className="py-1.5 px-1 text-right text-gray-600 dark:text-gray-400">{row.doneStages}/{row.totalStages}</td>
                      <td className="py-1.5 px-1 text-right text-gray-600 dark:text-gray-400">{row.eventCount}</td>
                      <td className="py-1.5 px-1 text-right text-gray-600 dark:text-gray-400">{row.recordCount}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>

            {/* Stage heatmap */}
            {stageHeatmap.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <SectionHeader title="Stage Completion Heatmap" />
                <div className="space-y-3">
                  {stageHeatmap.map(row => (
                    <div key={row.enterprise} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300 w-28 truncate">{row.enterprise}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {row.stages.map((st, i) => (
                          <div key={i} title={st.name}
                            className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold cursor-default ${
                              st.status === 'completed' ? 'bg-green-400' : st.status === 'in_progress' ? 'bg-amber-400' : 'bg-slate-300 dark:bg-slate-600'
                            }`}>{i + 1}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-3 mt-2">
                    {[['bg-green-400', 'Completed'], ['bg-amber-400', 'In Progress'], ['bg-slate-300', 'Pending']].map(([c, l]) => (
                      <span key={l} className="flex items-center gap-1 text-xs text-gray-500">
                        <span className={`w-3 h-3 rounded ${c} inline-block`} />{l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Event type breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="Event Type Breakdown" />
              {eventTypeCounts.length === 0 ? <p className="text-sm text-gray-400">No events recorded.</p> : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {eventTypeCounts.map(([type, count]) => (
                    <div key={type} className="bg-gray-50 dark:bg-gray-750 rounded-lg p-3 text-center border border-gray-100 dark:border-gray-700">
                      <div className="text-xl font-bold text-violet-600 dark:text-violet-400">{count}</div>
                      <div className="text-xs text-gray-500 capitalize">{type.replace(/_/g, ' ')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mortality analysis */}
            {mortalityAnalysis.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <SectionHeader title="Mortality Analysis" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-gray-500 font-medium">Cycle #</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Enterprise</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Mortality</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Starting</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Rate %</th>
                    </tr></thead>
                    <tbody>{mortalityAnalysis.map(row => (
                      <tr key={row.id} className="border-b border-gray-50 dark:border-gray-700">
                        <td className="py-1.5 font-mono text-gray-700 dark:text-gray-300">{row.num}</td>
                        <td className="py-1.5 text-gray-700 dark:text-gray-300">{row.enterprise}</td>
                        <td className="py-1.5 text-right font-medium text-red-500">{row.mortality}</td>
                        <td className="py-1.5 text-right text-gray-500">{row.starting || '—'}</td>
                        <td className={`py-1.5 text-right font-medium ${Number(row.rate) > 5 ? 'text-red-500' : 'text-amber-600'}`}>{row.rate}%</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════ INVENTORY */}
        {activeTab === 'inventory' && (
          <>
            {/* KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Total Items" value={invItems.length} icon={<Package className="w-4 h-4" />} />
              <KpiCard label="Total Value" value={fmt(invValue, currency)} accent="violet" icon={<DollarSign className="w-4 h-4" />} />
              <KpiCard label="Low Stock" value={lowStockCount} accent={lowStockCount > 0 ? 'red' : 'green'} badge={lowStockCount > 0 ? lowStockCount : undefined} icon={<AlertTriangle className="w-4 h-4" />} />
              <KpiCard label="Categories" value={invByCategory.length} icon={<BarChart3 className="w-4 h-4" />} />
            </div>

            {/* Stock by category */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="Stock by Category" />
              <div className="space-y-3">
                {invByCategory.map(cat => (
                  <div key={cat.cat} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 dark:text-gray-300 w-28 truncate">{cat.cat}</span>
                    <div className="flex-1">
                      <CssBar value={cat.totalValue} maxValue={maxCatValue} color="bg-violet-400" width />
                    </div>
                    <div className="text-right w-40 text-xs text-gray-500">
                      {cat.count} items · {fmt(cat.totalValue, currency)}
                    </div>
                    <div className="text-right w-28 text-xs text-gray-400">{fmt(cat.avgCostPerUnit, currency)}/u avg</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Low stock alert */}
            {lowStockItems.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 p-4">
                <SectionHeader title={`⚠ Low Stock Alert (${lowStockItems.length})`}
                  action={<ExportBtn onClick={() => exportCSV('low_stock.csv', lowStockItems.map((i: any) => ({ Name: i.name, Unit: i.unit, CurrentQty: i.currentQty, MinLevel: i.minStockLevel, Deficit: i.deficit, ReorderCost: i.reorderCost })))} />} />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-gray-500 font-medium">Item</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Unit</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Current</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Min</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Deficit</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Reorder Cost</th>
                    </tr></thead>
                    <tbody>{lowStockItems.map((i: any) => (
                      <tr key={i.id} className="border-b border-gray-50 dark:border-gray-700">
                        <td className="py-1.5 text-gray-700 dark:text-gray-300">{i.name}</td>
                        <td className="py-1.5 text-gray-500">{i.unit}</td>
                        <td className="py-1.5 text-right font-medium text-red-500">{i.currentQty}</td>
                        <td className="py-1.5 text-right text-gray-500">{i.minStockLevel}</td>
                        <td className="py-1.5 text-right text-amber-600 font-medium">{i.deficit}</td>
                        <td className="py-1.5 text-right text-gray-700 dark:text-gray-300">{fmt(i.reorderCost, currency)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Processing efficiency */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="Processing Efficiency" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center"><div className="text-2xl font-bold text-green-600">{processingStats.yieldRatio}%</div><div className="text-xs text-gray-500">Avg Yield Ratio</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-blue-600">{processingStats.passRate}%</div><div className="text-xs text-gray-500">Quality Pass Rate</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-gray-900 dark:text-white">{processingStats.completed}</div><div className="text-xs text-gray-500">Batches Completed</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-amber-600">{processingStats.inProgress}</div><div className="text-xs text-gray-500">In Progress</div></div>
              </div>
            </div>

            {/* Full inventory table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="Full Inventory"
                action={<ExportBtn onClick={() => exportCSV('inventory.csv', invTableData.map((i: any) => ({ Name: i.name, Category: i.category, Qty: i.currentQty, Unit: i.unit, CostPerUnit: i.costPerUnit, TotalValue: i.totalVal, Status: i.status })))} />} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-gray-500 font-medium">Name</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Category</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Qty</th>
                    <th className="text-left py-2 pl-2 text-gray-500 font-medium">Unit</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Cost/Unit</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Total Value</th>
                    <th className="text-left py-2 pl-2 text-gray-500 font-medium">Status</th>
                  </tr></thead>
                  <tbody>{invTableData.map((i: any) => (
                    <tr key={i.id} className="border-b border-gray-50 dark:border-gray-700">
                      <td className="py-1.5 text-gray-700 dark:text-gray-300">{i.name}</td>
                      <td className="py-1.5 text-gray-500">{i.category}</td>
                      <td className="py-1.5 text-right text-gray-700 dark:text-gray-300">{i.currentQty}</td>
                      <td className="py-1.5 pl-2 text-gray-500">{i.unit}</td>
                      <td className="py-1.5 text-right text-gray-600 dark:text-gray-400">{fmt(i.costPerUnit ?? 0, currency)}</td>
                      <td className="py-1.5 text-right font-medium text-gray-900 dark:text-white">{fmt(i.totalVal, currency)}</td>
                      <td className="py-1.5 pl-2"><StatusBadge status={i.status} /></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════ STAFF */}
        {activeTab === 'staff' && (
          <>
            {/* KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <KpiCard label="Total Staff" value={hrStaff.length} icon={<Users className="w-4 h-4" />} />
              <KpiCard label="Active Staff" value={hrStaff.filter((s: any) => s.active).length} accent="green" icon={<CheckCircle className="w-4 h-4" />} />
              <KpiCard label="This Week Hours" value={`${thisWeekHours.toFixed(1)}h`} icon={<Clock className="w-4 h-4" />} />
              <KpiCard label="Approved Hours" value={`${approvedHours.toFixed(1)}h`} accent="green" icon={<CheckCircle className="w-4 h-4" />} />
              <KpiCard label="Pending Hours" value={`${pendingHours.toFixed(1)}h`} accent={pendingHours > 0 ? 'amber' : 'default'} icon={<Clock className="w-4 h-4" />} />
              <KpiCard label="Est. Week Cost" value={fmt(weekCost, currency)} accent="violet" icon={<DollarSign className="w-4 h-4" />} />
            </div>

            {/* Hours bar chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="Hours by Week — Last 8 Weeks" />
              <div className="flex items-end gap-3 overflow-x-auto pb-2">
                {weeklyHours.map(w => (
                  <div key={w.ws} className="flex flex-col items-center gap-1 min-w-[44px]">
                    <span className="text-xs text-gray-500">{w.total.toFixed(0)}h</span>
                    <div className="w-8 bg-violet-400 dark:bg-violet-500 rounded-t" style={{ height: `${Math.max(2, Math.round(w.total / maxWeekHours * 100))}px` }} title={`${w.total.toFixed(1)} hours`} />
                    <span className="text-xs text-gray-400">{w.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff performance */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="Staff Performance This Week"
                action={<ExportBtn onClick={() => exportCSV('staff_performance.csv', staffPerf.map(s => ({ Name: s.name, Role: s.role, DailyRate: s.dailyRate, WeekHours: s.hours, ApprovedHours: s.approved, WeekCost: s.cost })))} />} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-gray-500 font-medium">Name</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Role</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Daily Rate</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Hours</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Approved</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Week Cost</th>
                  </tr></thead>
                  <tbody>{staffPerf.map(s => (
                    <tr key={s.id} className="border-b border-gray-50 dark:border-gray-700">
                      <td className="py-1.5 text-gray-700 dark:text-gray-300">{s.name}</td>
                      <td className="py-1.5 text-gray-500 capitalize">{s.role}</td>
                      <td className="py-1.5 text-right text-gray-600 dark:text-gray-400">{fmt(s.dailyRate ?? 0, currency)}</td>
                      <td className="py-1.5 text-right text-gray-700 dark:text-gray-300">{s.hours.toFixed(1)}</td>
                      <td className="py-1.5 text-right text-green-600">{s.approved.toFixed(1)}</td>
                      <td className="py-1.5 text-right font-medium text-gray-900 dark:text-white">{fmt(s.cost, currency)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>

            {/* Labour cost by enterprise */}
            {labourByEnterprise.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <SectionHeader title="Labour Cost by Enterprise (This Week)" />
                <div className="space-y-3">
                  {labourByEnterprise.map(row => (
                    <div key={row.name} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300 w-28 truncate">{row.name}</span>
                      <div className="flex-1">
                        <CssBar value={row.cost} maxValue={maxLabourCost} color="bg-violet-400" width />
                      </div>
                      <span className="text-sm text-gray-500 w-16 text-right">{row.hours.toFixed(0)}h</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-28 text-right">{fmt(row.cost, currency)}</span>
                      <span className="text-xs text-gray-400 w-10 text-right">{row.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending approvals */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title={`Pending Approvals${pendingApprovals.length > 0 ? ` (${pendingApprovals.length})` : ''}`} />
              {pendingApprovals.length === 0 ? (
                <p className="text-sm text-green-600 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> All timelog entries are approved.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Staff</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Hours</th>
                      <th className="text-left py-2 pl-2 text-gray-500 font-medium">Enterprise</th>
                    </tr></thead>
                    <tbody>{pendingApprovals.map((log: any) => (
                      <tr key={log.id} className="border-b border-gray-50 dark:border-gray-700">
                        <td className="py-1.5 text-gray-600 dark:text-gray-400">{log.date}</td>
                        <td className="py-1.5 text-gray-700 dark:text-gray-300">{log.staffName}</td>
                        <td className="py-1.5 text-right text-amber-600 font-medium">{log.hoursWorked}</td>
                        <td className="py-1.5 pl-2 text-gray-500">{log.enterpriseId ?? '—'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Health compliance */}
            {(vaccDue.length > 0 || activeWithdrawal.length > 0) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <SectionHeader title="Animal Health Compliance" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vaccDue.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Vaccinations Due (14 days)</div>
                      <div className="space-y-1">
                        {vaccDue.map((v: any) => (
                          <div key={v.id} className={`flex items-center justify-between p-2 rounded ${v.overdue ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800'}`}>
                            <span className="text-sm text-gray-700 dark:text-gray-300">{v.animalGroup}</span>
                            <span className={`text-xs font-medium ${v.overdue ? 'text-red-600' : 'text-amber-600'}`}>{v.overdue ? `${Math.abs(v.daysUntil)}d overdue` : `in ${v.daysUntil}d`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeWithdrawal.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Active Withdrawal Periods</div>
                      <div className="space-y-1">
                        {activeWithdrawal.map((t: any) => (
                          <div key={t.id} className="flex items-center justify-between p-2 rounded bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                            <div>
                              <div className="text-sm text-gray-700 dark:text-gray-300">{t.animalGroup}</div>
                              <div className="text-xs text-gray-500">{t.diagnosis}</div>
                            </div>
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{t.remaining}d remaining</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════ PROCUREMENT */}
        {activeTab === 'procurement' && (
          <>
            {/* KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <KpiCard label="Total POs" value={procStats.total} icon={<Truck className="w-4 h-4" />} />
              <KpiCard label="Pending / Ordered" value={`${procStats.pending} / ${procStats.ordered}`} accent="amber" icon={<Clock className="w-4 h-4" />} />
              <KpiCard label="Delivered" value={procStats.delivered} accent="green" icon={<CheckCircle className="w-4 h-4" />} />
              <KpiCard label="Total Spend" value={fmt(procStats.totalSpend, currency)} accent="violet" icon={<DollarSign className="w-4 h-4" />} />
              <KpiCard label="Pending Spend" value={fmt(procStats.pendingSpend, currency)} accent="amber" icon={<DollarSign className="w-4 h-4" />} />
              <KpiCard label="Overdue" value={procStats.overdue} accent={procStats.overdue > 0 ? 'red' : 'green'} badge={procStats.overdue > 0 ? procStats.overdue : undefined} icon={<AlertTriangle className="w-4 h-4" />} />
            </div>

            {/* PO status donut-style bar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="PO Status Breakdown" />
              <div className="flex rounded-full overflow-hidden h-6 w-full">
                {poStatusBreakdown.filter(s => s.count > 0).map(s => (
                  <div key={s.status} className={`${poColors[s.status] ?? 'bg-gray-300'} flex items-center justify-center text-white text-xs font-medium`} style={{ width: `${s.pct}%` }} title={`${s.status}: ${s.count} (${s.pct}%)`}>
                    {s.pct > 10 ? `${s.pct}%` : ''}
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-2 flex-wrap">
                {poStatusBreakdown.map(s => (
                  <span key={s.status} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className={`w-3 h-3 rounded-full ${poColors[s.status] ?? 'bg-gray-300'}`} />
                    {s.status} ({s.count})
                  </span>
                ))}
              </div>
            </div>

            {/* Overdue deliveries */}
            {overduePOs.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950 rounded-xl border border-red-200 dark:border-red-800 p-4">
                <SectionHeader title={`🚨 Overdue Deliveries (${overduePOs.length})`}
                  action={<ExportBtn onClick={() => exportCSV('overdue_pos.csv', overduePOs.map(p => ({ PO: p.id, Supplier: p.supplier, ExpectedDate: p.expectedDate, DaysOverdue: p.daysOverdue, Value: p.value })))} />} />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-red-200 dark:border-red-800">
                      <th className="text-left py-2 text-red-700 dark:text-red-400 font-medium">PO #</th>
                      <th className="text-left py-2 text-red-700 dark:text-red-400 font-medium">Supplier</th>
                      <th className="text-left py-2 text-red-700 dark:text-red-400 font-medium">Expected</th>
                      <th className="text-right py-2 text-red-700 dark:text-red-400 font-medium">Days Overdue</th>
                      <th className="text-right py-2 text-red-700 dark:text-red-400 font-medium">Value</th>
                    </tr></thead>
                    <tbody>{overduePOs.map(p => (
                      <tr key={p.id} className="border-b border-red-100 dark:border-red-900">
                        <td className="py-1.5 font-mono text-gray-700 dark:text-gray-300">{p.id}</td>
                        <td className="py-1.5 text-gray-700 dark:text-gray-300">{p.supplier}</td>
                        <td className="py-1.5 text-gray-500">{p.expectedDate}</td>
                        <td className="py-1.5 text-right font-medium text-red-600">{p.daysOverdue}</td>
                        <td className="py-1.5 text-right text-gray-700 dark:text-gray-300">{fmt(p.value, currency)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Spend by supplier */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="Spend by Supplier" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-gray-500 font-medium">Supplier</th>
                    <th className="text-right py-2 text-gray-500 font-medium">POs</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Total Spend</th>
                    <th className="text-left py-2 pl-2 text-gray-500 font-medium">Last Order</th>
                  </tr></thead>
                  <tbody>{spendBySupplier.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-700">
                      <td className="py-1.5 text-gray-700 dark:text-gray-300">{row.name}</td>
                      <td className="py-1.5 text-right text-gray-500">{row.count}</td>
                      <td className="py-1.5 text-right font-medium text-gray-900 dark:text-white">{fmt(row.spend, currency)}</td>
                      <td className="py-1.5 pl-2 text-gray-400 text-xs">{row.last || '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>

            {/* All POs table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="All Purchase Orders"
                action={<ExportBtn onClick={() => exportCSV('purchase_orders.csv', procOrders.map((p: any) => { const sup = procSuppliers.find((s: any) => s.id === p.supplierId); return { PO: p.id, Supplier: sup?.name ?? p.supplierId, Lines: (p.lines ?? []).length, TotalValue: poValue(p), ExpectedDelivery: p.expectedDelivery, Status: p.status, PaymentStatus: p.paymentStatus }; }))} />} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-1 text-gray-500 font-medium">PO #</th>
                    <th className="text-left py-2 px-1 text-gray-500 font-medium">Supplier</th>
                    <th className="text-right py-2 px-1 text-gray-500 font-medium">Lines</th>
                    <th className="text-right py-2 px-1 text-gray-500 font-medium">Value</th>
                    <th className="text-left py-2 px-1 text-gray-500 font-medium">Delivery</th>
                    <th className="text-left py-2 px-1 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-2 px-1 text-gray-500 font-medium">Payment</th>
                    <th className="py-2 px-1" />
                  </tr></thead>
                  <tbody>{procOrders.map((po: any) => {
                    const sup = procSuppliers.find((s: any) => s.id === po.supplierId);
                    const val = poValue(po);
                    const expanded = expandedPO === po.id;
                    return (
                      <React.Fragment key={po.id}>
                        <tr className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                          <td className="py-1.5 px-1 font-mono text-gray-700 dark:text-gray-300">{po.id}</td>
                          <td className="py-1.5 px-1 text-gray-700 dark:text-gray-300">{sup?.name ?? po.supplierId ?? '—'}</td>
                          <td className="py-1.5 px-1 text-right text-gray-500">{(po.lines ?? []).length}</td>
                          <td className="py-1.5 px-1 text-right font-medium text-gray-900 dark:text-white">{fmt(val, currency)}</td>
                          <td className="py-1.5 px-1 text-gray-500 text-xs">{po.expectedDelivery ?? '—'}</td>
                          <td className="py-1.5 px-1"><StatusBadge status={po.status} /></td>
                          <td className="py-1.5 px-1"><StatusBadge status={po.paymentStatus ?? 'unpaid'} /></td>
                          <td className="py-1.5 px-1">
                            <button onClick={() => setExpandedPO(expanded ? null : po.id)} className="text-gray-400 hover:text-gray-600">
                              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                        {expanded && (po.lines ?? []).map((line: any, li: number) => (
                          <tr key={li} className="bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700">
                            <td colSpan={2} className="py-1 px-4 text-xs text-gray-500 pl-8">↳ {line.description}</td>
                            <td className="py-1 text-right text-xs text-gray-500">{line.qty}</td>
                            <td className="py-1 text-right text-xs text-gray-500">{fmt(line.unitCost ?? 0, currency)}/u</td>
                            <td colSpan={4} className="py-1 px-1 text-right text-xs font-medium text-gray-700 dark:text-gray-300">{fmt((line.qty ?? 0) * (line.unitCost ?? 0), currency)}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}</tbody>
                </table>
              </div>
            </div>

            {/* Supplier ratings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="Supplier Ratings" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-gray-500 font-medium">Supplier</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Category</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Rating</th>
                    <th className="text-right py-2 text-gray-500 font-medium">POs</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Total Spend</th>
                  </tr></thead>
                  <tbody>{supplierRatings.map((s: any) => (
                    <tr key={s.id} className="border-b border-gray-50 dark:border-gray-700">
                      <td className="py-1.5 text-gray-700 dark:text-gray-300">{s.name}</td>
                      <td className="py-1.5 text-gray-500">{s.category ?? '—'}</td>
                      <td className="py-1.5 text-amber-500 tracking-tight">{starRating(s.rating ?? 0)}</td>
                      <td className="py-1.5 text-right text-gray-500">{s.poCount}</td>
                      <td className="py-1.5 text-right font-medium text-gray-900 dark:text-white">{fmt(s.spend, currency)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════ EXPORT */}
        {activeTab === 'export' && (
          <>
            <div className="bg-violet-50 dark:bg-violet-950 border border-violet-200 dark:border-violet-800 rounded-xl p-4 mb-2">
              <div className="flex items-center gap-2 mb-1">
                <Download className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">Export Centre</span>
              </div>
              <p className="text-sm text-violet-600 dark:text-violet-400">Download any report as CSV or JSON. Data reflects current state of your farm.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: <DollarSign className="w-5 h-5" />, title: 'All Transactions', desc: 'Full income & expense ledger',
                  fn: () => exportCSV('transactions.csv', txs.map((t: any) => ({ ID: t.id, Type: t.type, Amount: t.amount, Date: t.date, Category: t.category, CycleID: t.cycleId ?? '', Description: t.description ?? '' }))),
                },
                {
                  icon: <CheckCircle className="w-5 h-5" />, title: 'Completed Cycles', desc: 'All finished production cycles',
                  fn: () => exportCSV('completed_cycles.csv', completedCycles.map((c: any) => ({ ID: c.id, Cycle: c.cycleNumber, Enterprise: c.enterpriseId, Status: c.status, StartDate: c.startDate ?? '' }))),
                },
                {
                  icon: <Package className="w-5 h-5" />, title: 'Inventory Items', desc: 'Current stock levels & costs',
                  fn: () => exportCSV('inventory_items.csv', invItems.map((i: any) => ({ ID: i.id, Name: i.name, Category: i.category, Qty: i.currentQty, Unit: i.unit, MinLevel: i.minStockLevel, CostPerUnit: i.costPerUnit }))),
                },
                {
                  icon: <Users className="w-5 h-5" />, title: 'Staff & Time Logs', desc: 'Staff list combined with timelog entries',
                  fn: () => exportCSV('staff_timelogs.csv', hrTimelog.map((log: any) => { const st = hrStaff.find((s: any) => s.id === log.staffId); return { LogID: log.id, StaffName: st?.name ?? log.staffId, Role: st?.role ?? '', DailyRate: st?.dailyRate ?? '', Date: log.date, HoursWorked: log.hoursWorked, Approved: log.approved, Enterprise: log.enterpriseId ?? '' }; })),
                },
                {
                  icon: <Truck className="w-5 h-5" />, title: 'Purchase Orders', desc: 'All procurement orders and lines',
                  fn: () => exportCSV('purchase_orders.csv', procOrders.map((p: any) => { const sup = procSuppliers.find((s: any) => s.id === p.supplierId); return { PO: p.id, Supplier: sup?.name ?? p.supplierId, Items: (p.lines ?? []).length, TotalValue: poValue(p), ExpectedDelivery: p.expectedDelivery ?? '', Status: p.status, PaymentStatus: p.paymentStatus ?? '' }; })),
                },
                {
                  icon: <Users className="w-5 h-5" />, title: 'Supplier Directory', desc: 'All registered suppliers with ratings',
                  fn: () => exportCSV('suppliers.csv', procSuppliers.map((s: any) => ({ ID: s.id, Name: s.name, Category: s.category ?? '', Rating: s.rating ?? '' }))),
                },
                {
                  icon: <DollarSign className="w-5 h-5" />, title: 'Sales Orders', desc: 'Customer orders and statuses',
                  fn: () => exportCSV('sales_orders.csv', orders.map((o: any) => ({ ID: o.id, Date: o.date, Customer: o.customerName, Total: o.total, Status: o.status }))),
                },
                {
                  icon: <Activity className="w-5 h-5" />, title: 'Activity Log', desc: 'Full system activity history',
                  fn: () => exportCSV('activity_log.csv', activityLog.map((e: any) => ({ ID: e.id, Type: e.type ?? '', User: e.user ?? '', Timestamp: e.timestamp ?? e.date ?? '', Description: e.description ?? '' }))),
                },
                {
                  icon: <Package className="w-5 h-5" />, title: 'Processing Batches', desc: 'Batch processing records & yield data',
                  fn: () => exportCSV('batches.csv', batches.map((b: any) => ({ ID: b.id, Status: b.status, InputKg: b.inputWeightKg, OutputKg: b.outputWeightKg, QualityStatus: b.qualityStatus }))),
                },
                {
                  icon: <Leaf className="w-5 h-5" />, title: 'Crop Rotation History', desc: 'Field crop rotation records by season',
                  fn: () => exportCSV('crop_history.csv', crHistory.map((r: any) => { const field = crFields.find((f: any) => f.id === r.fieldId); return { ID: r.id, Field: field?.name ?? r.fieldId, AreaHa: field?.areaHa ?? '', Crop: r.crop, Season: r.season, YieldKgPerHa: r.yieldKgPerHa }; })),
                },
                {
                  icon: <Activity className="w-5 h-5" />, title: 'Animal Health Records', desc: 'Vaccination schedules & treatment logs',
                  fn: () => {
                    exportCSV('vaccinations.csv', vaccinations.map((v: any) => ({ ID: v.id, AnimalGroup: v.animalGroup, NextDue: v.nextDueDate, Status: v.status })));
                    exportCSV('treatments.csv', treatments.map((t: any) => ({ ID: t.id, AnimalGroup: t.animalGroup, Diagnosis: t.diagnosis, WithdrawalDays: t.withdrawalDays, StartDate: t.startDate })));
                  },
                },
                {
                  icon: <RefreshCw className="w-5 h-5" />, title: 'Full Backup', desc: 'Download all AgroNexus data as a JSON backup file',
                  fn: () => { backupAll(); localStorage.setItem('agronexus_v2_last_backup', new Date().toISOString()); },
                  accent: true,
                },
              ].map(card => (
                <div key={card.title} className={`bg-white dark:bg-gray-800 rounded-xl border p-4 flex flex-col gap-3 ${card.accent ? 'border-violet-300 dark:border-violet-700' : 'border-gray-200 dark:border-gray-700'}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.accent ? 'bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                    {card.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{card.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.desc}</div>
                  </div>
                  <button onClick={card.fn}
                    className={`mt-auto flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors ${card.accent ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>
                    <Download className="w-3.5 h-3.5" />
                    {card.title === 'Full Backup' ? 'Download Backup' : 'Download CSV'}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mt-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Last backup: {lastBackup === 'Never' ? 'Never' : new Date(lastBackup).toLocaleString()}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
