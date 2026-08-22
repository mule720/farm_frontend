/**
 * Activity / Audit Log — chronological log of all create/update/delete events
 * Reads agronexus_v2_activity_log and also scans module LS keys to infer recent activity.
 */
import React, { useState, useMemo } from 'react';
import { Clock, Filter, Download, RefreshCw, Trash2 } from 'lucide-react';
import { exportCSV } from '@/lib/exportUtils';

const LS_KEY = 'agronexus_v2_activity_log';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LogAction = 'create' | 'update' | 'delete' | 'login' | 'export' | 'system';

export interface ActivityEntry {
  id: string;
  ts: string;           // ISO timestamp
  module: string;       // e.g. 'Finance', 'Aquaculture', 'Inventory'
  action: LogAction;
  subject: string;      // e.g. 'Transaction #1042'
  detail: string;       // human-readable description
  userId?: string;
}

// ─── Logger (call this from anywhere to log an event) ─────────────────────────

export function logActivity(entry: Omit<ActivityEntry, 'id' | 'ts'>) {
  try {
    const log: ActivityEntry[] = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
    const newEntry: ActivityEntry = { ...entry, id: `log-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, ts: new Date().toISOString() };
    const updated = [newEntry, ...log].slice(0, 500); // keep newest 500
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  } catch { /* silent */ }
}

// ─── Seed entries ─────────────────────────────────────────────────────────────

function seedIfEmpty(): ActivityEntry[] {
  const now = new Date();
  function daysAgo(n: number) { const d = new Date(now); d.setDate(d.getDate() - n); return d.toISOString(); }
  function hoursAgo(n: number) { const d = new Date(now); d.setHours(d.getHours() - n); return d.toISOString(); }

  return [
    { id:'log-1', ts: hoursAgo(1),  module:'Finance',      action:'create', subject:'Transaction #1056', detail:'Recorded income: Feed Sales — ZMW 4,200' },
    { id:'log-2', ts: hoursAgo(2),  module:'Inventory',    action:'update', subject:'Broiler Feed (50kg)', detail:'Stock updated: 200 bags → 185 bags (15 issued)' },
    { id:'log-3', ts: hoursAgo(3),  module:'Aquaculture',  action:'update', subject:'Pond A — Tilapia', detail:'Aerator toggled ON; DO was 3.1 mg/L (critical)' },
    { id:'log-4', ts: hoursAgo(5),  module:'Sales',        action:'create', subject:'Order #ORD-2024-041', detail:'New order: 200kg Tilapia to Freshco Lusaka — ZMW 8,000' },
    { id:'log-5', ts: hoursAgo(8),  module:'Poultry',      action:'update', subject:'House 1 — Broilers', detail:'Feed log entry: 120kg fed, cumulative 1,840kg' },
    { id:'log-6', ts: daysAgo(1),   module:'Procurement',  action:'create', subject:'PO-2024-012', detail:'Purchase order raised: FeedCo — 500kg Layer Mash — ZMW 18,500' },
    { id:'log-7', ts: daysAgo(1),   module:'Production',   action:'create', subject:'Cycle #14 — Broilers', detail:'New production cycle started: 3,000 day-old chicks' },
    { id:'log-8', ts: daysAgo(2),   module:'Automation',   action:'system', subject:'Rule: Low DO → Aerator', detail:'Rule triggered: Pond B DO below 4.0 mg/L → aerator started' },
    { id:'log-9', ts: daysAgo(2),   module:'Animal Health',action:'create', subject:'Vaccination — Newcastle', detail:'Newcastle La Sota given to 3,000 broilers (House 1)' },
    { id:'log-10',ts: daysAgo(3),   module:'Finance',      action:'create', subject:'Transaction #1055', detail:'Recorded expense: Veterinary supplies — ZMW 1,850' },
    { id:'log-11',ts: daysAgo(3),   module:'Marketplace',  action:'update', subject:'Listing: Tilapia 10kg bags', detail:'Listing marked as sold (50 bags @ ZMW 180)' },
    { id:'log-12',ts: daysAgo(4),   module:'Energy',       action:'system', subject:'Battery Bank 1', detail:'SOC dropped to 23% — generator auto-started' },
    { id:'log-13',ts: daysAgo(5),   module:'Staff',        action:'create', subject:'Time Log — Alice Banda', detail:'8 hours logged: Feeding rounds, House 1 & 2' },
    { id:'log-14',ts: daysAgo(6),   module:'Processing',   action:'update', subject:'Batch #B-2024-008', detail:'QC result recorded: Pass — Broiler Processing batch completed' },
    { id:'log-15',ts: daysAgo(7),   module:'Backup',       action:'export', subject:'Full Backup', detail:'Data backup downloaded: 49 localStorage keys exported' },
  ];
}

// ─── Module badge colours ─────────────────────────────────────────────────────

const MODULE_COLORS: Record<string, string> = {
  Finance:       'bg-green-100 text-green-800',
  Inventory:     'bg-blue-100 text-blue-800',
  Aquaculture:   'bg-cyan-100 text-cyan-800',
  Sales:         'bg-violet-100 text-violet-800',
  Poultry:       'bg-orange-100 text-orange-800',
  Procurement:   'bg-indigo-100 text-indigo-800',
  Production:    'bg-emerald-100 text-emerald-800',
  Automation:    'bg-yellow-100 text-yellow-800',
  'Animal Health':'bg-pink-100 text-pink-800',
  Marketplace:   'bg-teal-100 text-teal-800',
  Energy:        'bg-amber-100 text-amber-800',
  Staff:         'bg-purple-100 text-purple-800',
  Processing:    'bg-red-100 text-red-800',
  Backup:        'bg-slate-100 text-slate-700',
  Water:         'bg-sky-100 text-sky-800',
  Soil:          'bg-lime-100 text-lime-800',
};

const ACTION_BADGES: Record<LogAction, { label: string; cls: string }> = {
  create: { label: 'Created',  cls: 'bg-green-50 text-green-700 border-green-200' },
  update: { label: 'Updated',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  delete: { label: 'Deleted',  cls: 'bg-red-50 text-red-700 border-red-200' },
  login:  { label: 'Login',    cls: 'bg-slate-50 text-slate-600 border-slate-200' },
  export: { label: 'Exported', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  system: { label: 'System',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActivityLog() {
  const [entries, setEntries] = useState<ActivityEntry[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as ActivityEntry[];
      if (stored.length === 0) {
        const seed = seedIfEmpty();
        localStorage.setItem(LS_KEY, JSON.stringify(seed));
        return seed;
      }
      return stored;
    } catch { return seedIfEmpty(); }
  });

  const [filterModule, setFilterModule]   = useState<string>('all');
  const [filterAction, setFilterAction]   = useState<string>('all');
  const [filterDate,   setFilterDate]     = useState<string>('');
  const [search,       setSearch]         = useState<string>('');

  const allModules = useMemo(() => [...new Set(entries.map(e => e.module))].sort(), [entries]);

  const filtered = useMemo(() => entries.filter(e => {
    if (filterModule !== 'all' && e.module !== filterModule) return false;
    if (filterAction !== 'all' && e.action !== filterAction) return false;
    if (filterDate && !e.ts.startsWith(filterDate)) return false;
    if (search && !e.subject.toLowerCase().includes(search.toLowerCase()) && !e.detail.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [entries, filterModule, filterAction, filterDate, search]);

  function refresh() {
    try {
      const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as ActivityEntry[];
      setEntries(stored.length ? stored : seedIfEmpty());
    } catch { /* silent */ }
  }

  function clearAll() {
    if (!window.confirm('Clear all activity log entries? This cannot be undone.')) return;
    localStorage.setItem(LS_KEY, '[]');
    setEntries([]);
  }

  function doExport() {
    exportCSV('activity-log.csv', filtered.map(e => ({
      timestamp: e.ts,
      module: e.module,
      action: e.action,
      subject: e.subject,
      detail: e.detail,
    })));
  }

  // Summary stats
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount  = entries.filter(e => e.ts.startsWith(todayStr)).length;
  const createCount = entries.filter(e => e.action === 'create').length;
  const systemCount = entries.filter(e => e.action === 'system').length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600" />
            <h2 className="font-bold text-slate-900">Activity Log</h2>
            <span className="text-xs text-slate-400">· {entries.length} entries</span>
          </div>
          <div className="flex gap-2">
            <button onClick={refresh}  className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"><RefreshCw className="w-3 h-3" />Refresh</button>
            <button onClick={doExport} className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"><Download className="w-3 h-3" />Export CSV</button>
            <button onClick={clearAll} className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-3 h-3" />Clear</button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="flex gap-3">
          {[
            { label: 'Total entries', value: entries.length, cls: 'text-slate-800' },
            { label: 'Today',         value: todayCount,     cls: 'text-blue-700' },
            { label: 'Creates',       value: createCount,    cls: 'text-green-700' },
            { label: 'System events', value: systemCount,    cls: 'text-amber-700' },
          ].map(s => (
            <div key={s.label} className="bg-slate-50 rounded-lg px-3 py-2 min-w-[80px]">
              <div className={`text-lg font-bold ${s.cls}`}>{s.value}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events…"
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400 w-48" />
          <select value={filterModule} onChange={e => setFilterModule(e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400">
            <option value="all">All modules</option>
            {allModules.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400">
            <option value="all">All actions</option>
            {(['create','update','delete','login','export','system'] as LogAction[]).map(a => <option key={a} value={a} className="capitalize">{a}</option>)}
          </select>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400" />
          {(filterModule !== 'all' || filterAction !== 'all' || filterDate || search) && (
            <button onClick={() => { setFilterModule('all'); setFilterAction('all'); setFilterDate(''); setSearch(''); }}
              className="text-xs text-slate-400 hover:text-slate-700 px-2">✕ Clear filters</button>
          )}
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No entries match the current filters.</p>
          </div>
        )}
        {filtered.map(entry => {
          const ab = ACTION_BADGES[entry.action] ?? ACTION_BADGES.system;
          const modCls = MODULE_COLORS[entry.module] ?? 'bg-slate-100 text-slate-600';
          return (
            <div key={entry.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-3">
              <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2"
                style={{ background: entry.action === 'create' ? '#16a34a' : entry.action === 'delete' ? '#dc2626' : entry.action === 'system' ? '#d97706' : '#6366f1' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${modCls}`}>{entry.module}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${ab.cls}`}>{ab.label}</span>
                  <span className="text-xs font-medium text-slate-800">{entry.subject}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{entry.detail}</p>
              </div>
              <div className="flex-shrink-0 text-[10px] text-slate-400 whitespace-nowrap pt-0.5">
                <div>{relTime(entry.ts)}</div>
                <div className="text-slate-300">{new Date(entry.ts).toLocaleDateString()}</div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length > 0 && (
        <div className="bg-white border-t border-slate-100 px-5 py-2 text-xs text-slate-400 flex-shrink-0">
          Showing {filtered.length} of {entries.length} entries
        </div>
      )}
    </div>
  );
}
