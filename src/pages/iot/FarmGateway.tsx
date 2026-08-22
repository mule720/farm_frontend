// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Farm Gateway: Offline-First Sync Indicator & Connectivity Dashboard
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wifi, WifiOff, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle,
  Settings, List, History, Activity, Save, ChevronRight,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface QueuedItem {
  id: string;
  module: 'aquaculture' | 'water' | 'poultry' | 'energy' | 'soil';
  action: 'create' | 'update' | 'delete';
  payload: string;
  queuedAt: string;
  retries: number;
  status: 'pending' | 'failed';
}

interface SyncRecord {
  id: string;
  module: string;
  itemCount: number;
  syncedAt: string;
  durationMs: number;
  success: boolean;
  errorMsg?: string;
}

interface GatewayConfig {
  gatewayName: string;
  location: string;
  firmwareVersion: string;
  lastHeartbeat: string;
  uptime: string;
  mqttBroker: string;
  mqttPort: number;
  syncIntervalMin: number;
  connectedDevices: number;
  offlineMode: boolean;
}

// ─── LS Keys ───────────────────────────────────────────────────────────────────
const LS_QUEUED  = 'agronexus_v2_gw_queued';
const LS_HISTORY = 'agronexus_v2_gw_history';
const LS_CONFIG  = 'agronexus_v2_gw_config';

// ─── Seed data ─────────────────────────────────────────────────────────────────
const DEFAULT_CONFIG: GatewayConfig = {
  gatewayName: 'Farm Gateway Alpha',
  location: 'Main Farm — Block A',
  firmwareVersion: 'v2.4.1',
  lastHeartbeat: new Date().toISOString(),
  uptime: '14d 6h 22m',
  mqttBroker: 'mqtt://broker.agronexus.local',
  mqttPort: 1883,
  syncIntervalMin: 5,
  connectedDevices: 12,
  offlineMode: false,
};

const DEFAULT_QUEUE: QueuedItem[] = [
  { id: 'q1', module: 'aquaculture', action: 'update', payload: '{"pondId":"pond-3","do_mgl":4.8}', queuedAt: new Date(Date.now() - 3600000).toISOString(), retries: 2, status: 'failed' },
  { id: 'q2', module: 'water',       action: 'create', payload: '{"readingId":"wq-99","ph":7.2,"turbidity":12}', queuedAt: new Date(Date.now() - 1800000).toISOString(), retries: 0, status: 'pending' },
  { id: 'q3', module: 'poultry',     action: 'update', payload: '{"houseId":"h1","temp":29.5,"humidity":68}', queuedAt: new Date(Date.now() - 900000).toISOString(), retries: 0, status: 'pending' },
];

function seedHistoryEntries(): SyncRecord[] {
  const modules: string[] = ['aquaculture', 'water', 'poultry', 'energy', 'soil'];
  return Array.from({ length: 10 }, (_, i) => ({
    id: `hr-${i}`,
    module: modules[i % modules.length],
    itemCount: Math.floor(Math.random() * 15) + 1,
    syncedAt: new Date(Date.now() - (i + 1) * 1800000).toISOString(),
    durationMs: Math.floor(Math.random() * 800) + 200,
    success: i !== 3,
    errorMsg: i === 3 ? 'Connection timeout after 30s' : undefined,
  }));
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function readLS<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; } catch { return fallback; }
}
function writeLS(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val));
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffS = Math.floor(diffMs / 1000);
  if (diffS < 60) return `${diffS}s ago`;
  const diffM = Math.floor(diffS / 60);
  if (diffM < 60) return `${diffM}m ago`;
  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

const MODULE_ICONS: Record<string, string> = {
  aquaculture: '🐟', water: '💧', poultry: '🐔', energy: '⚡', soil: '🌱',
};
const MODULE_LABELS: Record<string, string> = {
  aquaculture: 'Aquaculture', water: 'Water Quality', poultry: 'Poultry', energy: 'Energy', soil: 'Soil',
};
const ALL_MODULES = ['aquaculture', 'water', 'poultry', 'energy', 'soil'];

// ─── Connection Diagram ────────────────────────────────────────────────────────
function ConnectionDiagram({ queue }: { queue: QueuedItem[] }) {
  const pendingModules = new Set(queue.filter(q => q.status !== 'failed').map(q => q.module));
  const cols = [
    { id: 'aquaculture', label: 'Aquaculture', icon: '🐟', x: 50,  y: 170 },
    { id: 'water',       label: 'Water',       icon: '💧', x: 50,  y: 260 },
    { id: 'poultry',     label: 'Poultry',     icon: '🐔', x: 370, y: 170 },
    { id: 'energy',      label: 'Energy',      icon: '⚡', x: 370, y: 260 },
    { id: 'soil',        label: 'Soil',         icon: '🌱', x: 210, y: 310 },
  ];
  const gwX = 175; const gwY = 195;
  return (
    <svg viewBox="0 0 470 370" className="w-full max-w-md mx-auto">
      {/* Gateway box */}
      <rect x={gwX} y={gwY} width={110} height={50} rx="10" fill="#3b82f6" />
      <text x={gwX + 55} y={gwY + 20} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Gateway</text>
      <text x={gwX + 55} y={gwY + 36} textAnchor="middle" fill="#bfdbfe" fontSize="9">Farm Gateway Alpha</text>
      {cols.map(m => {
        const hasPending = pendingModules.has(m.id as any);
        const color = hasPending ? '#f59e0b' : '#22c55e';
        const gx = gwX + 55; const gy = gwY + 25;
        const tx = m.x + 45; const ty = m.y + 20;
        return (
          <g key={m.id}>
            <line x1={gx} y1={gy} x2={tx} y2={ty} stroke={color} strokeWidth="2" strokeDasharray={hasPending ? '5,3' : undefined} />
            <rect x={m.x} y={m.y} width="90" height="40" rx="8" fill={hasPending ? '#fef3c7' : '#f0fdf4'} stroke={color} strokeWidth="1.5" />
            <text x={m.x + 16} y={m.y + 25} fontSize="14">{m.icon}</text>
            <text x={m.x + 34} y={m.y + 25} fontSize="10" fill="#374151">{m.label}</text>
            {hasPending && <circle cx={m.x + 82} cy={m.y + 8} r="5" fill="#f59e0b" />}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Module sync status row ────────────────────────────────────────────────────
function ModuleStatusRow({ module, queue, lastSync }: { module: string; queue: QueuedItem[]; lastSync?: SyncRecord }) {
  const pending = queue.filter(q => q.module === module && q.status === 'pending').length;
  const failed  = queue.filter(q => q.module === module && q.status === 'failed').length;
  const ok = pending === 0 && failed === 0;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-xl">{MODULE_ICONS[module]}</span>
        <span className="text-sm font-medium text-slate-700">{MODULE_LABELS[module]}</span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        {pending > 0 && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{pending} pending</span>}
        {failed  > 0 && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{failed} failed</span>}
        <span className="text-slate-400">{lastSync ? relativeTime(lastSync.syncedAt) : 'never'}</span>
        <div className={`w-2.5 h-2.5 rounded-full ${ok ? 'bg-green-400' : failed > 0 ? 'bg-red-400' : 'bg-amber-400'}`} />
      </div>
    </div>
  );
}

// ─── Module badge ──────────────────────────────────────────────────────────────
function ModuleBadge({ module }: { module: string }) {
  const colors: Record<string, string> = {
    aquaculture: 'bg-blue-100 text-blue-700',
    water: 'bg-cyan-100 text-cyan-700',
    poultry: 'bg-amber-100 text-amber-700',
    energy: 'bg-yellow-100 text-yellow-700',
    soil: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[module] ?? 'bg-slate-100 text-slate-600'}`}>
      {MODULE_ICONS[module]} {MODULE_LABELS[module]}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FarmGateway() {
  const [tab, setTab] = useState<'status' | 'queue' | 'history' | 'config'>('status');
  const [queue,   setQueue]   = useState<QueuedItem[]>(() => {
    const stored = readLS<QueuedItem[] | null>(LS_QUEUED, null);
    if (!stored) { writeLS(LS_QUEUED, DEFAULT_QUEUE); return DEFAULT_QUEUE; }
    return stored;
  });
  const [history, setHistory] = useState<SyncRecord[]>(() => {
    const stored = readLS<SyncRecord[] | null>(LS_HISTORY, null);
    if (!stored) { const h = seedHistoryEntries(); writeLS(LS_HISTORY, h); return h; }
    return stored;
  });
  const [config, setConfig]   = useState<GatewayConfig>(() => {
    const stored = readLS<GatewayConfig | null>(LS_CONFIG, null);
    if (!stored) { writeLS(LS_CONFIG, DEFAULT_CONFIG); return DEFAULT_CONFIG; }
    return stored;
  });
  const [now, setNow] = useState(Date.now());
  const [configForm, setConfigForm] = useState({ ...config });
  const [saveFlash, setSaveFlash] = useState(false);

  // Heartbeat ticker
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);

  const pendingCount = queue.filter(q => q.status === 'pending').length;
  const failedCount  = queue.filter(q => q.status === 'failed').length;

  // Last sync per module
  const lastSyncByModule = useMemo(() => {
    const m: Record<string, SyncRecord> = {};
    [...history].sort((a, b) => new Date(b.syncedAt).getTime() - new Date(a.syncedAt).getTime())
      .forEach(r => { if (!m[r.module]) m[r.module] = r; });
    return m;
  }, [history]);

  // Force sync all pending
  const forceSyncAll = useCallback(() => {
    const toSync = queue.filter(q => q.status === 'pending');
    if (toSync.length === 0) return;
    const newRecords: SyncRecord[] = toSync.map(q => ({
      id: `hr-${Date.now()}-${q.id}`,
      module: q.module,
      itemCount: 1,
      syncedAt: new Date().toISOString(),
      durationMs: Math.floor(Math.random() * 400) + 100,
      success: true,
    }));
    const newQueue = queue.filter(q => q.status !== 'pending');
    const newHistory = [...newRecords, ...history];
    setQueue(newQueue);
    setHistory(newHistory);
    writeLS(LS_QUEUED, newQueue);
    writeLS(LS_HISTORY, newHistory);
  }, [queue, history]);

  // Retry failed
  const retryItem = useCallback((id: string) => {
    const next = queue.map(q => q.id === id ? { ...q, status: 'pending' as const, retries: q.retries + 1 } : q);
    setQueue(next);
    writeLS(LS_QUEUED, next);
  }, [queue]);

  // Clear resolved (none actually, but remove failed with retries > 3)
  const clearResolved = useCallback(() => {
    const next = queue.filter(q => !(q.status === 'failed' && q.retries > 3));
    setQueue(next);
    writeLS(LS_QUEUED, next);
  }, [queue]);

  // Toggle offline
  const toggleOffline = useCallback(() => {
    const updated = { ...config, offlineMode: !config.offlineMode };
    setConfig(updated);
    setConfigForm(updated);
    writeLS(LS_CONFIG, updated);
  }, [config]);

  // Save config form
  const saveConfig = useCallback(() => {
    const updated: GatewayConfig = { ...config, ...configForm };
    setConfig(updated);
    writeLS(LS_CONFIG, updated);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2000);
  }, [config, configForm]);

  const todayHistory = history.filter(r => {
    const d = new Date(r.syncedAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });
  const successRate = history.length > 0 ? Math.round((history.filter(r => r.success).length / history.length) * 100) : 100;

  const tabs = [
    { key: 'status',  label: 'Status',       Icon: Activity },
    { key: 'queue',   label: 'Sync Queue',   Icon: List },
    { key: 'history', label: 'Sync History', Icon: History },
    { key: 'config',  label: 'Configuration',Icon: Settings },
  ] as const;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            {config.offlineMode ? <WifiOff className="w-6 h-6 text-amber-500" /> : <Wifi className="w-6 h-6 text-green-500" />}
            Farm Gateway
          </h1>
          <p className="text-sm text-slate-500 mt-1">{config.gatewayName} · {config.location}</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.offlineMode ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
          <div className={`w-2 h-2 rounded-full ${config.offlineMode ? 'bg-amber-500' : 'bg-green-500 animate-pulse'}`} />
          {config.offlineMode ? 'OFFLINE MODE' : 'Online'}
        </div>
      </div>

      {/* Offline banner */}
      {config.offlineMode && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-800 font-medium">OFFLINE MODE — changes queued locally and will sync when connection is restored.</span>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* ── Status tab ── */}
      {tab === 'status' && (
        <div className="space-y-6">
          {/* Gateway status card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">{config.gatewayName}</h3>
                <p className="text-sm text-slate-500">{config.location}</p>
              </div>
              <button onClick={toggleOffline}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${config.offlineMode ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                {config.offlineMode ? 'Go Online' : 'Go Offline'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Firmware', value: config.firmwareVersion },
                { label: 'Uptime',   value: config.uptime },
                { label: 'Last Heartbeat', value: relativeTime(config.lastHeartbeat) },
                { label: 'Devices', value: `${config.connectedDevices} connected` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">{label}</div>
                  <div className="text-sm font-semibold text-slate-800">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Queue summary strip */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Pending', count: pendingCount, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
              { label: 'Failed',  count: failedCount,  color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200' },
              { label: 'Total',   count: queue.length, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
            ].map(({ label, count, color, bg, border }) => (
              <div key={label} className={`rounded-xl border p-4 text-center ${bg} ${border}`}>
                <div className={`text-2xl font-bold ${color}`}>{count}</div>
                <div className="text-xs text-slate-500 mt-0.5">{label} items</div>
              </div>
            ))}
          </div>

          {/* Force sync button */}
          <div className="flex justify-end">
            <button onClick={forceSyncAll} disabled={pendingCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors">
              <RefreshCw className="w-4 h-4" /> Force Sync All ({pendingCount})
            </button>
          </div>

          {/* Module sync status */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Module Sync Status</h3>
            {ALL_MODULES.map(m => (
              <ModuleStatusRow key={m} module={m} queue={queue} lastSync={lastSyncByModule[m]} />
            ))}
          </div>

          {/* Connection diagram */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Connection Diagram</h3>
            <p className="text-xs text-slate-400 mb-3">Dashed amber = pending items · Solid green = synced · Amber dot = items queued</p>
            <ConnectionDiagram queue={queue} />
          </div>
        </div>
      )}

      {/* ── Sync Queue tab ── */}
      {tab === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Sync Queue ({queue.length} items)</h3>
            <button onClick={clearResolved} className="text-xs text-slate-500 hover:text-slate-700 underline">Clear All Resolved</button>
          </div>
          {queue.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">Queue is empty — all data synced</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                    <tr>
                      <th className="text-left px-4 py-3">Module</th>
                      <th className="text-left px-4 py-3">Action</th>
                      <th className="text-left px-4 py-3">Payload</th>
                      <th className="text-left px-4 py-3">Queued</th>
                      <th className="text-center px-4 py-3">Retries</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map(item => (
                      <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3"><ModuleBadge module={item.module} /></td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${item.action === 'create' ? 'bg-blue-50 text-blue-700' : item.action === 'update' ? 'bg-purple-50 text-purple-700' : 'bg-red-50 text-red-700'}`}>
                            {item.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 font-mono max-w-xs truncate">{item.payload}</td>
                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{relativeTime(item.queuedAt)}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{item.retries}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${item.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {item.status === 'failed' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {item.status === 'failed' && (
                            <button onClick={() => retryItem(item.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                              <RefreshCw className="w-3 h-3" /> Retry
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Sync History tab ── */}
      {tab === 'history' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Success Rate', value: `${successRate}%`, color: successRate >= 90 ? 'text-green-600' : 'text-amber-600' },
              { label: 'Total Synced Today', value: todayHistory.reduce((s, r) => s + r.itemCount, 0).toString(), color: 'text-blue-600' },
              { label: 'Total Records',      value: history.length.toString(), color: 'text-slate-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">Time</th>
                    <th className="text-left px-4 py-3">Module</th>
                    <th className="text-right px-4 py-3">Items</th>
                    <th className="text-right px-4 py-3">Duration</th>
                    <th className="text-left px-4 py-3">Result</th>
                    <th className="text-left px-4 py-3">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(r => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{relativeTime(r.syncedAt)}</td>
                      <td className="px-4 py-3"><ModuleBadge module={r.module} /></td>
                      <td className="px-4 py-3 text-right text-slate-700 font-medium">{r.itemCount}</td>
                      <td className="px-4 py-3 text-right text-slate-500 text-xs">{r.durationMs}ms</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${r.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {r.success ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {r.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-red-500">{r.errorMsg ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Configuration tab ── */}
      {tab === 'config' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <h3 className="font-semibold text-slate-900">Gateway Settings</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Gateway Name', key: 'gatewayName' as const, type: 'text' },
                { label: 'Location',     key: 'location'    as const, type: 'text' },
                { label: 'MQTT Broker',  key: 'mqttBroker'  as const, type: 'text' },
                { label: 'MQTT Port',    key: 'mqttPort'    as const, type: 'number' },
                { label: 'Sync Interval (minutes)', key: 'syncIntervalMin' as const, type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input type={type} value={configForm[key] as string | number}
                    onChange={e => setConfigForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              ))}
            </div>

            {/* Offline mode toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="text-sm font-medium text-slate-800">Offline Mode</div>
                <div className="text-xs text-slate-500 mt-0.5">When enabled, all changes are queued locally until reconnected.</div>
              </div>
              <button onClick={() => { setConfigForm(f => ({ ...f, offlineMode: !f.offlineMode })); toggleOffline(); }}
                className={`relative w-12 h-6 rounded-full transition-colors ${configForm.offlineMode ? 'bg-amber-400' : 'bg-slate-300'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${configForm.offlineMode ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Firmware info */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="text-xs font-medium text-slate-500 uppercase mb-2">Firmware Information</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-slate-500">Version</div>
                <div className="font-mono font-medium text-slate-800">{config.firmwareVersion}</div>
                <div className="text-slate-500">Uptime</div>
                <div className="font-mono font-medium text-slate-800">{config.uptime}</div>
                <div className="text-slate-500">Connected Devices</div>
                <div className="font-mono font-medium text-slate-800">{config.connectedDevices}</div>
              </div>
            </div>

            <button onClick={saveConfig}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${saveFlash ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {saveFlash ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saveFlash ? 'Saved!' : 'Save Configuration'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
