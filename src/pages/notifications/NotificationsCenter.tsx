import React, { useState, useMemo, useCallback } from 'react';
import {
  Bell,
  BellOff,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Filter,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface UnifiedAlert {
  id: string;
  source: 'aquaculture' | 'water' | 'poultry' | 'energy' | 'soil' | 'devices';
  sourceLabel: string;
  sourceIcon: string;
  title: string;
  detail: string;
  severity: 'critical' | 'warning' | 'info';
  ts: string;
  resolved: boolean;
  rawKey: string;
}

type SeverityFilter = 'all' | 'critical' | 'warning' | 'info';
type SourceFilter = 'all' | 'aquaculture' | 'water' | 'poultry' | 'energy' | 'soil' | 'devices';
type StatusFilter = 'all' | 'unresolved' | 'resolved';

const LS_KEYS = {
  aquaculture: 'agronexus_v2_aqua_alerts',
  water: 'agronexus_v2_wm_alerts',
  poultry: 'agronexus_v2_ph_alerts',
  energy: 'agronexus_v2_em_alerts',
  soil: 'agronexus_v2_sd_alerts',
  devices: 'agronexus_v2_iot_device_alerts',
} as const;

const SOURCE_META: Record<UnifiedAlert['source'], { label: string; icon: string }> = {
  aquaculture: { label: 'Aquaculture', icon: '🐟' },
  water: { label: 'Water', icon: '💧' },
  poultry: { label: 'Poultry', icon: '🐔' },
  energy: { label: 'Energy', icon: '⚡' },
  soil: { label: 'Soil', icon: '🌱' },
  devices: { label: 'Devices', icon: '📡' },
};

function readLS<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLS(key: string, data: unknown[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

function normaliseAqua(raw: Record<string, unknown>[]): UnifiedAlert[] {
  return raw.map((a) => ({
    id: String(a.id ?? ''),
    source: 'aquaculture',
    sourceLabel: SOURCE_META.aquaculture.label,
    sourceIcon: SOURCE_META.aquaculture.icon,
    title: `${a.parameter ?? 'Parameter'} out of range on ${a.pondName ?? 'pond'}`,
    detail: `${a.value ?? ''} ${a.unit ?? ''} — ${a.threshold ?? ''}`,
    severity: (a.severity as UnifiedAlert['severity']) ?? 'warning',
    ts: String(a.ts ?? ''),
    resolved: Boolean(a.resolved),
    rawKey: LS_KEYS.aquaculture,
  }));
}

function normaliseWater(raw: Record<string, unknown>[]): UnifiedAlert[] {
  return raw.map((a) => ({
    id: String(a.id ?? ''),
    source: 'water',
    sourceLabel: SOURCE_META.water.label,
    sourceIcon: SOURCE_META.water.icon,
    title: `${a.type ?? 'Alert'} alert on ${a.tankName ?? 'tank'}`,
    detail: String(a.message ?? ''),
    severity: (a.severity as UnifiedAlert['severity']) ?? 'warning',
    ts: String(a.ts ?? ''),
    resolved: Boolean(a.resolved),
    rawKey: LS_KEYS.water,
  }));
}

function normalisePoultry(raw: Record<string, unknown>[]): UnifiedAlert[] {
  return raw.map((a) => ({
    id: String(a.id ?? ''),
    source: 'poultry',
    sourceLabel: SOURCE_META.poultry.label,
    sourceIcon: SOURCE_META.poultry.icon,
    title: `${a.type ?? 'Alert'} on ${a.houseName ?? 'house'}`,
    detail: String(a.message ?? ''),
    severity: (a.severity as UnifiedAlert['severity']) ?? 'warning',
    ts: String(a.ts ?? ''),
    resolved: Boolean(a.resolved),
    rawKey: LS_KEYS.poultry,
  }));
}

function normaliseEnergy(raw: Record<string, unknown>[]): UnifiedAlert[] {
  return raw.map((a) => ({
    id: String(a.id ?? ''),
    source: 'energy',
    sourceLabel: SOURCE_META.energy.label,
    sourceIcon: SOURCE_META.energy.icon,
    title: `${a.type ?? 'Alert'} on ${a.componentName ?? 'component'}`,
    detail: String(a.message ?? ''),
    severity: (a.severity as UnifiedAlert['severity']) ?? 'warning',
    ts: String(a.ts ?? ''),
    resolved: Boolean(a.resolved),
    rawKey: LS_KEYS.energy,
  }));
}

function normaliseSoil(raw: Record<string, unknown>[]): UnifiedAlert[] {
  return raw.map((a) => ({
    id: String(a.id ?? ''),
    source: 'soil',
    sourceLabel: SOURCE_META.soil.label,
    sourceIcon: SOURCE_META.soil.icon,
    title: `${a.parameter ?? 'Parameter'} threshold exceeded in ${a.zoneName ?? 'zone'}`,
    detail: `${a.value ?? ''} — threshold: ${a.threshold ?? ''}`,
    severity: (a.severity as UnifiedAlert['severity']) ?? 'warning',
    ts: String(a.ts ?? ''),
    resolved: Boolean(a.resolved),
    rawKey: LS_KEYS.soil,
  }));
}

function normaliseDevices(raw: Record<string, unknown>[]): UnifiedAlert[] {
  return raw.map((a) => ({
    id: String(a.id ?? ''),
    source: 'devices',
    sourceLabel: SOURCE_META.devices.label,
    sourceIcon: SOURCE_META.devices.icon,
    title: `${a.type ?? 'Alert'} on ${a.deviceName ?? 'device'}`,
    detail: String(a.message ?? ''),
    severity: (a.severity as UnifiedAlert['severity']) ?? 'info',
    ts: String(a.ts ?? ''),
    resolved: Boolean(a.resolved),
    rawKey: LS_KEYS.devices,
  }));
}

function loadAllAlerts(): UnifiedAlert[] {
  const aqua = normaliseAqua(readLS<Record<string, unknown>>(LS_KEYS.aquaculture));
  const water = normaliseWater(readLS<Record<string, unknown>>(LS_KEYS.water));
  const poultry = normalisePoultry(readLS<Record<string, unknown>>(LS_KEYS.poultry));
  const energy = normaliseEnergy(readLS<Record<string, unknown>>(LS_KEYS.energy));
  const soil = normaliseSoil(readLS<Record<string, unknown>>(LS_KEYS.soil));
  const devices = normaliseDevices(readLS<Record<string, unknown>>(LS_KEYS.devices));

  return [...aqua, ...water, ...poultry, ...energy, ...soil, ...devices].sort(
    (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime(),
  );
}

function relativeTime(ts: string): string {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  if (isNaN(diff)) return ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function isToday(ts: string): boolean {
  if (!ts) return false;
  const d = new Date(ts);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

const severityStyles: Record<UnifiedAlert['severity'], { card: string; badge: string; icon: React.ReactNode }> = {
  critical: {
    card: 'bg-red-50 border-l-4 border-l-red-500 border border-red-200',
    badge: 'bg-red-100 text-red-700',
    icon: <AlertOctagon className="w-4 h-4 text-red-500" />,
  },
  warning: {
    card: 'bg-amber-50 border-l-4 border-l-amber-400 border border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  },
  info: {
    card: 'bg-blue-50 border-l-4 border-l-blue-400 border border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    icon: <Bell className="w-4 h-4 text-blue-500" />,
  },
};

export default function NotificationsCenter() {
  const [alerts, setAlerts] = useState<UnifiedAlert[]>(() => loadAllAlerts());
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unresolved');

  const refresh = useCallback(() => {
    setAlerts(loadAllAlerts());
  }, []);

  const markResolved = useCallback((alert: UnifiedAlert) => {
    const raw = readLS<Record<string, unknown>>(alert.rawKey);
    const updated = raw.map((item) =>
      String(item.id) === alert.id ? { ...item, resolved: true } : item,
    );
    writeLS(alert.rawKey, updated);
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alert.id && a.rawKey === alert.rawKey ? { ...a, resolved: true } : a,
      ),
    );
  }, []);

  const clearAllResolved = useCallback(() => {
    (Object.values(LS_KEYS) as string[]).forEach((key) => {
      const raw = readLS<Record<string, unknown>>(key);
      writeLS(key, raw.filter((item) => !item.resolved));
    });
    setAlerts((prev) => prev.filter((a) => !a.resolved));
  }, []);

  const counts = useMemo(() => {
    const critical = alerts.filter((a) => a.severity === 'critical' && !a.resolved).length;
    const warning = alerts.filter((a) => a.severity === 'warning' && !a.resolved).length;
    const info = alerts.filter((a) => a.severity === 'info' && !a.resolved).length;
    const resolvedToday = alerts.filter((a) => a.resolved && isToday(a.ts)).length;
    return { critical, warning, info, resolvedToday };
  }, [alerts]);

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
      if (sourceFilter !== 'all' && a.source !== sourceFilter) return false;
      if (statusFilter === 'unresolved' && a.resolved) return false;
      if (statusFilter === 'resolved' && !a.resolved) return false;
      return true;
    });
  }, [alerts, severityFilter, sourceFilter, statusFilter]);

  const hasResolved = alerts.some((a) => a.resolved);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Bell className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Notifications Centre</h1>
                <p className="text-sm text-slate-500">Aggregated alerts from all IoT modules</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refresh}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              {hasResolved && (
                <button
                  onClick={clearAllResolved}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Resolved
                </button>
              )}
            </div>
          </div>

          {/* Summary strip */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => { setSeverityFilter('critical'); setStatusFilter('unresolved'); }}
              className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-100 hover:border-red-300 transition-colors text-left"
            >
              <AlertOctagon className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-xl font-bold text-red-600">{counts.critical}</p>
                <p className="text-xs text-red-500">Critical</p>
              </div>
            </button>
            <button
              onClick={() => { setSeverityFilter('warning'); setStatusFilter('unresolved'); }}
              className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100 hover:border-amber-300 transition-colors text-left"
            >
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-xl font-bold text-amber-600">{counts.warning}</p>
                <p className="text-xs text-amber-500">Warning</p>
              </div>
            </button>
            <button
              onClick={() => { setSeverityFilter('info'); setStatusFilter('unresolved'); }}
              className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100 hover:border-blue-300 transition-colors text-left"
            >
              <Bell className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-xl font-bold text-blue-600">{counts.info}</p>
                <p className="text-xs text-blue-500">Info</p>
              </div>
            </button>
            <button
              onClick={() => { setSeverityFilter('all'); setStatusFilter('resolved'); }}
              className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100 hover:border-green-300 transition-colors text-left"
            >
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-xl font-bold text-green-600">{counts.resolvedToday}</p>
                <p className="text-xs text-green-500">Resolved today</p>
              </div>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Filter</span>
            </div>

            {/* Severity buttons */}
            <div className="flex flex-wrap gap-2">
              {(['all', 'critical', 'warning', 'info'] as SeverityFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    severityFilter === s
                      ? s === 'all'
                        ? 'bg-slate-700 text-white'
                        : s === 'critical'
                        ? 'bg-red-500 text-white'
                        : s === 'warning'
                        ? 'bg-amber-400 text-white'
                        : 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap sm:flex-nowrap sm:ml-auto">
              {/* Source dropdown */}
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="all">All modules</option>
                <option value="aquaculture">🐟 Aquaculture</option>
                <option value="water">💧 Water</option>
                <option value="poultry">🐔 Poultry</option>
                <option value="energy">⚡ Energy</option>
                <option value="soil">🌱 Soil</option>
                <option value="devices">📡 Devices</option>
              </select>

              {/* Status dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="all">All statuses</option>
                <option value="unresolved">Unresolved</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alert list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center gap-3">
            <BellOff className="w-12 h-12 text-green-400" />
            <p className="text-lg font-semibold text-slate-600">All clear — no active alerts</p>
            <p className="text-sm text-slate-400">No alerts match the current filters.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((alert) => {
              const styles = severityStyles[alert.severity];
              return (
                <div
                  key={`${alert.rawKey}-${alert.id}`}
                  className={`rounded-xl p-4 transition-opacity ${styles.card} ${
                    alert.resolved ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Severity icon */}
                    <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {/* Source badge */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          <span>{alert.sourceIcon}</span>
                          {alert.sourceLabel}
                        </span>
                        {/* Severity badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${styles.badge}`}
                        >
                          {alert.severity}
                        </span>
                        {alert.resolved && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
                            Resolved
                          </span>
                        )}
                      </div>

                      <p className="font-semibold text-slate-800 text-sm leading-snug">
                        {alert.title}
                      </p>
                      {alert.detail && (
                        <p className="text-sm text-slate-500 mt-0.5 truncate">{alert.detail}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">{relativeTime(alert.ts)}</p>
                    </div>

                    {/* Action */}
                    {!alert.resolved && (
                      <button
                        onClick={() => markResolved(alert)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length > 0 && (
          <p className="text-center text-xs text-slate-400 pb-2">
            Showing {filtered.length} of {alerts.length} total alerts
          </p>
        )}
      </div>
    </div>
  );
}
