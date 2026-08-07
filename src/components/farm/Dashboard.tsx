import React, { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, Activity,
  Package, Target, Loader2, RefreshCw, ArrowRight, Leaf, X,
  ChevronRight, BarChart2, Layers, Clock, CheckCircle2, Circle,
  Flag, User, Building2, Bell,
} from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  loadActivities, getActivitiesForDate, getStatusOnDate, getTypeDef,
  markCompletion, PRIORITY_META,
} from '@/lib/activityData';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashData {
  enterprises: any[];
  activeBatches: any[];
  inventorySummary: any;
  lowStockItems: any[];
  recentRecords: any[];
}

type DrawerType = 'batches' | 'population' | 'inventory' | 'alerts' | 'activity' | 'enterprise';

interface DrawerState {
  type: DrawerType;
  title: string;
  subtitle?: string;
  data: any;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ageDays(startDate: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(startDate).getTime()) / 86_400_000));
}

const PROD_TYPE_TO_ROUTE: Record<string, string> = {
  broiler: 'poultry', village_chicken: 'village-chicken', pig: 'piggery',
  tilapia: 'fish', duck: 'duck', goat_sheep: 'goat-sheep', horticulture: 'horticulture',
};

const ENT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  poultry:     { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  livestock:   { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  aquaculture: { bg: 'bg-cyan-100',   text: 'text-cyan-700',   dot: 'bg-cyan-500'   },
  horticulture:{ bg: 'bg-emerald-100',text: 'text-emerald-700',dot: 'bg-emerald-500'},
};

function categoryColor(cat: string) {
  return ENT_COLORS[cat] ?? { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' };
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({ drawer, onClose, onNavigate }: { drawer: DrawerState; onClose: () => void; onNavigate: (v: string) => void }) {
  const { data } = drawer;

  return (
    <div className="fixed inset-0 z-40 flex" onClick={onClose}>
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" />

      {/* Panel */}
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer header */}
        <div className="px-5 py-4 border-b border-slate-200 flex-shrink-0 bg-slate-50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">{drawer.title}</h2>
              {drawer.subtitle && <p className="text-xs text-slate-500 mt-0.5">{drawer.subtitle}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg flex-shrink-0 transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {drawer.type === 'batches' && <BatchesDetail batches={data} onNavigate={onNavigate} onClose={onClose} />}
          {drawer.type === 'population' && <PopulationDetail batches={data.batches} enterprises={data.enterprises} />}
          {drawer.type === 'inventory' && <InventoryDetail summary={data.summary} items={data.items} onNavigate={onNavigate} onClose={onClose} />}
          {drawer.type === 'alerts' && <AlertsDetail lowStock={data.lowStock} onNavigate={onNavigate} onClose={onClose} />}
          {drawer.type === 'activity' && <ActivityDetail records={data} />}
          {drawer.type === 'enterprise' && <EnterpriseDetail ent={data.ent} batches={data.batches} onNavigate={onNavigate} onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}

// ─── Drawer content panels ────────────────────────────────────────────────────

function BatchesDetail({ batches, onNavigate, onClose }: { batches: any[]; onNavigate: (v: string) => void; onClose: () => void }) {
  const maxAge = Math.max(...batches.map(b => ageDays(b.startDate)), 1);
  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-2">
        <StatMini label="Total batches" value={batches.length} />
        <StatMini label="Total animals/units" value={batches.reduce((s, b) => s + (parseFloat(b.quantity) || 0), 0).toLocaleString()} />
      </div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">All active batches</div>
      <div className="space-y-2">
        {batches.length === 0 && <EmptyHint text="No active batches yet." />}
        {batches.map(b => {
          const age = ageDays(b.startDate);
          const route = PROD_TYPE_TO_ROUTE[b.enterprise?.productionType] || 'dashboard';
          const agePct = Math.min(100, Math.round((age / maxAge) * 100));
          return (
            <button key={b.id} onClick={() => { onNavigate(route); onClose(); }}
              className="w-full text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl p-3.5 transition-all group">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold text-slate-800 text-sm">{b.name}</span>
                  <span className="ml-2 text-xs text-slate-400">{b.enterprise?.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900">{parseFloat(b.quantity).toLocaleString()}</span>
                  <span className="text-xs text-slate-400 ml-1">{b.unit}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-500">Day {age}</span>
                <span className="text-xs text-slate-400">· started {b.startDate?.slice(0, 10)}</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${agePct}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Day 1</span><span className="group-hover:text-blue-500 flex items-center gap-0.5">Open module <ArrowRight className="w-2.5 h-2.5" /></span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function PopulationDetail({ batches, enterprises }: { batches: any[]; enterprises: any[] }) {
  const byEnt: Record<string, { name: string; category: string; total: number; unit: string }> = {};
  batches.forEach(b => {
    const id = b.enterprise?.id || 'unknown';
    if (!byEnt[id]) byEnt[id] = { name: b.enterprise?.name || '—', category: b.enterprise?.category || 'livestock', total: 0, unit: b.unit };
    byEnt[id].total += parseFloat(b.quantity) || 0;
  });
  const list = Object.values(byEnt).sort((a, b) => b.total - a.total);
  const max = list[0]?.total || 1;

  return (
    <>
      <StatMini label="Grand total" value={list.reduce((s, e) => s + e.total, 0).toLocaleString()} />
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4 mb-2">Population by enterprise</div>
      <div className="space-y-3">
        {list.length === 0 && <EmptyHint text="No population data yet." />}
        {list.map((e, i) => {
          const col = categoryColor(e.category);
          const pct = Math.round((e.total / max) * 100);
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="text-sm font-medium text-slate-700">{e.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${col.bg} ${col.text} font-medium`}>{e.category}</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{e.total.toLocaleString()} {e.unit}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${col.dot} opacity-70 transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-slate-50 rounded-xl">
        <div className="text-xs font-semibold text-slate-500 mb-2">By production type</div>
        {enterprises.map(e => {
          const count = batches.filter(b => b.enterprise?.id === e.id).reduce((s, b) => s + (parseFloat(b.quantity) || 0), 0);
          return (
            <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 text-sm">
              <span className="text-slate-600 capitalize">{e.productionType?.replace('_', ' ')}</span>
              <span className="font-semibold text-slate-800">{count > 0 ? count.toLocaleString() : '—'} {e.batchUnit}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

function InventoryDetail({ summary, items, onNavigate, onClose }: { summary: any; items: any[]; onNavigate: (v: string) => void; onClose: () => void }) {
  const byCategory: Record<string, { count: number; lowStock: number }> = {};
  items.forEach(item => {
    const cat = item.category || 'other';
    if (!byCategory[cat]) byCategory[cat] = { count: 0, lowStock: 0 };
    byCategory[cat].count++;
    if (item.currentStock <= item.reorderLevel) byCategory[cat].lowStock++;
  });

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <StatMini label="Total SKUs" value={summary?.totalItems ?? items.length} />
        <StatMini label="Stock value" value={summary?.totalValue > 0 ? `$${Number(summary.totalValue).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'} />
        <StatMini label="Low stock" value={summary?.lowStockCount ?? 0} accent="red" />
        <StatMini label="Categories" value={Object.keys(byCategory).length} />
      </div>

      {Object.keys(byCategory).length > 0 && (
        <>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2 mb-2">By category</div>
          <div className="space-y-1.5">
            {Object.entries(byCategory).map(([cat, info]) => (
              <div key={cat} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-sm text-slate-700 capitalize">{cat}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{info.count} items</span>
                  {info.lowStock > 0 && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">{info.lowStock} low</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {items.length > 0 && (
        <>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2 mb-2">Low stock items</div>
          <div className="space-y-2">
            {items.map(item => {
              const pct = item.reorderLevel > 0 ? Math.min(100, Math.round((item.currentStock / item.reorderLevel) * 100)) : 100;
              return (
                <div key={item.id} className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Low stock</span>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">
                    {item.currentStock} {item.unit} remaining · reorder at {item.reorderLevel} {item.unit}
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden border border-red-100">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <button onClick={() => { onNavigate('inventory'); onClose(); }}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors mt-2">
        Open Inventory Module <ArrowRight className="w-4 h-4" />
      </button>
    </>
  );
}

function AlertsDetail({ lowStock, onNavigate, onClose }: { lowStock: any[]; onNavigate: (v: string) => void; onClose: () => void }) {
  return (
    <>
      <StatMini label="Items below reorder level" value={lowStock.length} accent="red" />

      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2 mb-2">All low-stock items</div>
      {lowStock.length === 0 && (
        <div className="py-8 text-center text-slate-400">
          <CheckCircle2 className="w-8 h-8 mx-auto text-green-300 mb-2" />
          <div className="text-sm font-medium text-slate-500">All stock levels are healthy</div>
          <div className="text-xs mt-1">No items below reorder level.</div>
        </div>
      )}
      <div className="space-y-2">
        {lowStock.map(item => {
          const deficit = Math.max(0, item.reorderLevel - item.currentStock);
          const pct = item.reorderLevel > 0 ? Math.round((item.currentStock / (item.reorderLevel * 2)) * 100) : 50;
          return (
            <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-red-200 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{item.name}</div>
                  <div className="text-xs text-slate-400 capitalize mt-0.5">{item.category}</div>
                </div>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">−{deficit} {item.unit}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>Current: <strong className="text-red-600">{item.currentStock} {item.unit}</strong></span>
                <span>Reorder at: {item.reorderLevel} {item.unit}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {lowStock.length > 0 && (
        <button onClick={() => { onNavigate('inventory'); onClose(); }}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors">
          Manage Inventory <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </>
  );
}

function ActivityDetail({ records }: { records: any[] }) {
  const [filter, setFilter] = useState('all');
  const types = ['all', ...Array.from(new Set(records.map(r => r.recordType)))];
  const visible = filter === 'all' ? records : records.filter(r => r.recordType === filter);

  return (
    <>
      <div className="flex gap-1.5 flex-wrap mb-2">
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize transition-colors ${filter === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {visible.length === 0 && <EmptyHint text="No activity records yet." />}
        {visible.map((r: any) => {
          let d: any = {};
          try { d = typeof r.data === 'string' ? JSON.parse(r.data) : r.data; } catch {}
          return (
            <div key={r.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="font-semibold text-slate-800 text-sm">{r.batch?.name || r.enterprise?.name || '—'}</div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0">{r.recordType}</span>
              </div>
              <div className="text-xs text-slate-400 mb-1.5">{r.enterprise?.name} · {r.recordDate}</div>
              {d.mortality > 0 && <div className="text-xs text-red-600 font-medium">{d.mortality} mortality recorded</div>}
              {d.weight && <div className="text-xs text-slate-600">Avg weight: {d.weight} kg</div>}
              {d.notes && <div className="text-xs text-slate-500 italic mt-1">"{String(d.notes).slice(0, 80)}"</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}

function EnterpriseDetail({ ent, batches, onNavigate, onClose }: { ent: any; batches: any[]; onNavigate: (v: string) => void; onClose: () => void }) {
  const route = PROD_TYPE_TO_ROUTE[ent.productionType] || ent.productionType;
  const col = categoryColor(ent.category);
  const total = batches.reduce((s, b) => s + (parseFloat(b.quantity) || 0), 0);

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${col.bg}`}>
          <Leaf className={`w-6 h-6 ${col.text}`} />
        </div>
        <div>
          <div className="font-bold text-slate-900 text-lg">{ent.name}</div>
          <div className="text-xs text-slate-500 capitalize">{ent.productionType?.replace('_', ' ')} · {ent.category}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatMini label="Active batches" value={batches.length} />
        <StatMini label="Total population" value={total > 0 ? `${total.toLocaleString()} ${ent.batchUnit}` : '—'} />
      </div>

      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Batches</div>
      <div className="space-y-2">
        {batches.length === 0 && <EmptyHint text="No active batches in this enterprise." />}
        {batches.map(b => {
          const age = ageDays(b.startDate);
          return (
            <div key={b.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-800 text-sm">{b.name}</div>
                <div className="text-xs text-slate-400">Day {age} · started {b.startDate?.slice(0, 10)}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">{parseFloat(b.quantity).toLocaleString()}</div>
                <div className="text-[10px] text-slate-400">{b.unit}</div>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={() => { onNavigate(route); onClose(); }}
        className="w-full mt-4 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors">
        Open {ent.name} Module <ArrowRight className="w-4 h-4" />
      </button>
    </>
  );
}

// ─── Mini helpers ─────────────────────────────────────────────────────────────

function StatMini({ label, value, accent }: { label: string; value: string | number; accent?: 'red' | 'green' }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
      <div className="text-xs text-slate-500 mb-0.5">{label}</div>
      <div className={`text-xl font-bold ${accent === 'red' ? 'text-red-600' : accent === 'green' ? 'text-green-600' : 'text-slate-900'}`}>{value}</div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-slate-400 text-center py-6">{text}</p>;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, color, note, onClick, trend }: any) {
  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-transparent hover:-translate-y-0.5 transition-all text-left w-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs font-medium text-slate-600 mt-0.5">{label}</div>
      {note && <div className="text-[10px] text-slate-400 mt-0.5">{note}</div>}
    </button>
  );
}

// ─── My Tasks Today (worker view) ────────────────────────────────────────────

function toDateStr(d: Date) { return d.toISOString().split('T')[0]; }

function MyTasksToday({ profile, onNavigate }: { profile: any; onNavigate: (v: string) => void }) {
  const org = profile?.organization || 'demo';
  const userId = profile?.id || '';
  const dateStr = toDateStr(new Date());
  const [refresh, setRefresh] = useState(0);

  const allActivities = loadActivities(org);
  const assigned = allActivities.filter(a => a.assignedToId === userId);
  const todayItems = getActivitiesForDate(assigned, dateStr);

  if (todayItems.length === 0) return null;

  const done  = todayItems.filter(i => getStatusOnDate(i.activity, i.date) === 'done').length;
  const total = todayItems.length;
  const pct   = Math.round((done / total) * 100);

  // Group by enterprise
  const byEnt: Record<string, typeof todayItems> = {};
  for (const item of todayItems) {
    const key = item.activity.enterpriseId;
    if (!byEnt[key]) byEnt[key] = [];
    byEnt[key].push(item);
  }

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base">My Tasks Today</div>
            <div className="text-blue-200 text-xs">{done}/{total} completed · {pct}%</div>
          </div>
        </div>
        {/* Progress ring */}
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="19" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
            <circle cx="24" cy="24" r="19" fill="none" stroke="white" strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 19}`}
              strokeDashoffset={`${2 * Math.PI * 19 * (1 - pct / 100)}`}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">{pct}%</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/20 rounded-full mb-4 overflow-hidden">
        <div className="h-full bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>

      {/* Tasks grouped by enterprise */}
      <div className="space-y-3">
        {Object.entries(byEnt).map(([entId, items]) => {
          const entName = items[0].activity.enterpriseName;
          const route = PROD_TYPE_TO_ROUTE[items[0].activity.moduleType] || items[0].activity.moduleType;
          return (
            <div key={entId} className="bg-white/10 rounded-xl p-3">
              <button
                onClick={() => onNavigate(route)}
                className="flex items-center gap-2 mb-2 w-full text-left hover:text-white/80 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-200" />
                <span className="text-xs font-semibold text-blue-100 uppercase tracking-wide">{entName}</span>
                <ChevronRight className="w-3 h-3 text-blue-300 ml-auto" />
              </button>
              <div className="space-y-1.5">
                {items.map(({ activity, date }) => {
                  const status = getStatusOnDate(activity, date);
                  const td = getTypeDef(activity.type);
                  const pm = PRIORITY_META[activity.priority ?? 'medium'];
                  return (
                    <div key={`${activity.id}-${date}`}
                      className={`flex items-center gap-2.5 py-1.5 px-2 rounded-lg transition-all ${status === 'done' ? 'opacity-60' : 'hover:bg-white/10'}`}>
                      <button
                        onClick={() => {
                          markCompletion(org, activity.id, date, status === 'done' ? 'skipped' : 'done');
                          setRefresh(r => r + 1);
                        }}
                        className="flex-shrink-0"
                      >
                        {status === 'done'
                          ? <CheckCircle2 className="w-5 h-5 text-green-300" />
                          : <Circle className="w-5 h-5 text-white/40 hover:text-white/70 transition-colors" />
                        }
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${status === 'done' ? 'line-through text-white/50' : 'text-white'}`}>
                          {activity.title}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-blue-200 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />{activity.scheduledTime}
                          {activity.batchName && <span>· {activity.batchName}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-white/20 text-white`}>
                          {td.label}
                        </span>
                        {activity.priority === 'high' && (
                          <Flag className="w-3 h-3 text-red-300" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {pct === 100 && (
        <div className="mt-3 flex items-center gap-2 bg-green-500/30 rounded-xl px-3 py-2">
          <CheckCircle2 className="w-4 h-4 text-green-300" />
          <span className="text-sm font-semibold text-green-100">All tasks done for today! Great work.</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Dashboard({ onNavigate }: { onNavigate: (v: string) => void }) {
  const { profile, hasPermission } = useAuth();
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [entData, batchData, invData, recData] = await Promise.all([
        gqlRequest<{ enterprises: any[] }>(`query { enterprises(isActive: true) { id name category productionType batchUnit activeBatchCount } }`),
        gqlRequest<{ batches: any[] }>(`query { batches(status: "active") { id name quantity unit startDate enterprise { id name productionType category } } }`),
        gqlRequest<{ inventorySummary: any; inventoryItems: any[] }>(`query {
          inventorySummary { totalItems lowStockCount totalValue }
          inventoryItems(lowStockOnly: true) { id name currentStock reorderLevel unit category }
        }`),
        gqlRequest<{ productionRecords: any[] }>(`query { productionRecords(limit: 20) { id recordDate recordType data enterprise { name } batch { name } } }`),
      ]);

      setData({
        enterprises: entData.enterprises || [],
        activeBatches: batchData.batches || [],
        inventorySummary: invData.inventorySummary,
        lowStockItems: invData.inventoryItems || [],
        recentRecords: recData.productionRecords || [],
      });
    } catch (e: any) {
      setError(e.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-96 text-slate-400">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading dashboard…
    </div>
  );

  if (error) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-semibold text-red-800">Failed to load dashboard</div>
          <div className="text-sm text-red-600 mt-1">{error}</div>
          <button onClick={load} className="mt-3 px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700">Retry</button>
        </div>
      </div>
    </div>
  );

  const { enterprises, activeBatches, inventorySummary, lowStockItems, recentRecords } = data!;
  const totalPopulation = activeBatches.reduce((s, b) => s + (parseFloat(b.quantity) || 0), 0);
  const totalBatches = activeBatches.length;
  const lowStockCount = inventorySummary?.lowStockCount ?? lowStockItems.length;
  const inventoryValue = inventorySummary?.totalValue ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Drawer overlay */}
      {drawer && <DetailDrawer drawer={drawer} onClose={() => setDrawer(null)} onNavigate={onNavigate} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operations Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            {profile?.organization} · {enterprises.length} enterprise{enterprises.length !== 1 ? 's' : ''} · {totalBatches} active batch{totalBatches !== 1 ? 'es' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 hover:bg-slate-100 rounded-lg" title="Refresh">
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
          {hasPermission('planner') && (
            <button onClick={() => onNavigate('planner')} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
              View Daily Plan
            </button>
          )}
        </div>
      </div>

      {/* My Tasks Today — shown to workers with assigned activities */}
      <MyTasksToday profile={profile} onNavigate={onNavigate} />

      {/* KPI Cards — each opens a detail drawer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Target} label="Active Batches" color="bg-blue-600"
          value={totalBatches} note={`across ${enterprises.length} enterprises`}
          onClick={() => setDrawer({ type: 'batches', title: 'Active Batches', subtitle: `${totalBatches} batches across ${enterprises.length} enterprises`, data: activeBatches })}
        />
        <KpiCard
          icon={Activity} label="Total Population" color="bg-purple-600"
          value={totalPopulation > 0 ? totalPopulation.toLocaleString() : '—'} note="active livestock & crops"
          onClick={() => setDrawer({ type: 'population', title: 'Population Breakdown', subtitle: 'Animals & crops by enterprise', data: { batches: activeBatches, enterprises } })}
        />
        <KpiCard
          icon={Package} label="Inventory Value" color="bg-green-600"
          value={inventoryValue > 0 ? `$${inventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
          note={`${inventorySummary?.totalItems ?? 0} SKUs tracked`}
          onClick={() => setDrawer({ type: 'inventory', title: 'Inventory Summary', subtitle: 'Stock levels, value & low-stock alerts', data: { summary: inventorySummary, items: lowStockItems } })}
        />
        <KpiCard
          icon={AlertTriangle} label="Low Stock Alerts" color={lowStockCount > 0 ? 'bg-red-500' : 'bg-slate-400'}
          value={lowStockCount} note={lowStockCount > 0 ? 'items below reorder level' : 'all stock levels OK'}
          onClick={() => setDrawer({ type: 'alerts', title: 'Stock Alerts', subtitle: `${lowStockCount} item${lowStockCount !== 1 ? 's' : ''} below reorder level`, data: { lowStock: lowStockItems } })}
        />
      </div>

      {/* Enterprise cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900">Your Enterprises</h2>
          <span className="text-xs text-slate-400">Click for details</span>
        </div>
        {enterprises.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-10 text-center">
            <Leaf className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">No enterprises set up yet</p>
            <p className="text-xs text-slate-400 mt-1">Navigate to a production module to set up your first enterprise.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {enterprises.map(ent => {
              const col = categoryColor(ent.category);
              const entBatches = activeBatches.filter(b => b.enterprise?.id === ent.id);
              const population = entBatches.reduce((s, b) => s + (parseFloat(b.quantity) || 0), 0);
              return (
                <button
                  key={ent.id}
                  onClick={() => setDrawer({ type: 'enterprise', title: ent.name, subtitle: `${ent.category} · ${ent.productionType?.replace('_', ' ')}`, data: { ent, batches: entBatches } })}
                  className="group text-left bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-transparent hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${col.bg} ${col.text}`}>{ent.category}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">{ent.activeBatchCount ?? entBatches.length} batch{(ent.activeBatchCount ?? entBatches.length) !== 1 ? 'es' : ''}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900">{ent.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize">{ent.productionType?.replace('_', ' ')}</p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-slate-400">Population</div>
                      <div className="font-semibold text-slate-900">{population > 0 ? population.toLocaleString() : '—'} {ent.batchUnit}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active batches table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setDrawer({ type: 'batches', title: 'Active Batches', subtitle: `All ${activeBatches.length} batches`, data: activeBatches })}
            className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors text-left"
          >
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Active Batches
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{activeBatches.length} total</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
          <div className="p-4">
            {activeBatches.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No active batches yet.</p>
            ) : (
              <div className="space-y-1.5">
                {activeBatches.slice(0, 5).map(b => {
                  const age = ageDays(b.startDate);
                  const route = PROD_TYPE_TO_ROUTE[b.enterprise?.productionType] || 'dashboard';
                  const permitted = hasPermission(route);
                  return (
                    <button
                      key={b.id}
                      onClick={e => {
                        e.stopPropagation();
                        setDrawer({ type: 'batches', title: 'Active Batches', subtitle: `All ${activeBatches.length} batches`, data: activeBatches });
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors text-left group"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{b.name}</div>
                        <div className="text-xs text-slate-400">{b.enterprise?.name} · Day {age}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold text-slate-900">{parseFloat(b.quantity).toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">{b.unit}</div>
                      </div>
                    </button>
                  );
                })}
                {activeBatches.length > 5 && (
                  <button
                    onClick={() => setDrawer({ type: 'batches', title: 'Active Batches', subtitle: `All ${activeBatches.length} batches`, data: activeBatches })}
                    className="w-full text-xs text-blue-600 hover:text-blue-700 text-center py-2 font-medium"
                  >
                    View all {activeBatches.length} batches →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Alerts & activity */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center border-b border-slate-100">
            <button
              onClick={() => setDrawer({ type: 'alerts', title: 'Stock Alerts', subtitle: `${lowStockCount} items below reorder level`, data: { lowStock: lowStockItems } })}
              className="flex-1 flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left border-r border-slate-100"
            >
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Alerts
              </h3>
              <div className="flex items-center gap-1.5">
                {lowStockCount > 0 && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">{lowStockCount}</span>}
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </button>
            <button
              onClick={() => setDrawer({ type: 'activity', title: 'Recent Activity', subtitle: `${recentRecords.length} production records`, data: recentRecords })}
              className="flex-1 flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
            >
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                <BarChart2 className="w-4 h-4 text-blue-500" /> Activity
              </h3>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
          <div className="p-4 space-y-2">
            {lowStockItems.slice(0, 2).map(item => (
              <button key={item.id}
                onClick={() => setDrawer({ type: 'alerts', title: 'Stock Alerts', subtitle: `${lowStockCount} items below reorder level`, data: { lowStock: lowStockItems } })}
                className="w-full flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100 hover:border-red-300 text-left transition-colors">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900">Low Stock: {item.name}</div>
                  <div className="text-xs text-slate-500">{item.currentStock} {item.unit} · reorder at {item.reorderLevel} {item.unit}</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              </button>
            ))}
            {recentRecords.slice(0, lowStockItems.length > 0 ? 2 : 4).map((r: any) => {
              let d: any = {};
              try { d = typeof r.data === 'string' ? JSON.parse(r.data) : r.data; } catch {}
              return (
                <button key={r.id}
                  onClick={() => setDrawer({ type: 'activity', title: 'Recent Activity', subtitle: `${recentRecords.length} production records`, data: recentRecords })}
                  className="w-full flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-blue-50 text-left transition-colors">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900">{r.batch?.name || r.enterprise?.name} — {r.recordType}</div>
                    <div className="text-xs text-slate-400">{r.recordDate}{d.mortality > 0 ? ` · ${d.mortality} mortality` : ''}</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                </button>
              );
            })}
            {lowStockItems.length === 0 && recentRecords.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">No alerts or records yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Inventory bar */}
      {hasPermission('inventory') && (
        <button
          onClick={() => setDrawer({ type: 'inventory', title: 'Inventory Summary', subtitle: 'Stock levels, value & low-stock alerts', data: { summary: inventorySummary, items: lowStockItems } })}
          className="w-full bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between hover:border-green-300 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">Feed & Inventory</div>
              <div className="text-xs text-slate-500">{inventorySummary?.totalItems ?? 0} SKUs · value ${inventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lowStockCount > 0 && (
              <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">{lowStockCount} low stock</span>
            )}
            <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-slate-600">
              View details <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
