import React from 'react';

// ─── StatCard ────────────────────────────────────────────────────────────────
export interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  accentColor?: string;
}

export function StatCard({ icon, label, value, sub, trend, accentColor = 'text-green-400' }: StatCardProps) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-2xl">{icon}</span>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <span>{trend >= 0 ? '▲' : '▼'}</span>
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold ${accentColor}`}>{value}</div>
      <div className="text-slate-400 text-sm">{label}</div>
      {sub && <div className="text-slate-500 text-xs mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── MiniBarChart ─────────────────────────────────────────────────────────────
export function MiniBarChart({ data, color = '#22c55e', height = 40, labels }: { data: number[]; color?: string; height?: number; labels?: string[] }) {
  const max = Math.max(...data, 1);
  const w = 100 / data.length;
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none">
      {data.map((v, i) => {
        const barH = (v / max) * (height - 4);
        return (
          <g key={i}>
            <rect
              x={i * w + 1}
              y={height - barH - 2}
              width={w - 2}
              height={barH}
              rx="1"
              fill={color}
              opacity="0.85"
            />
          </g>
        );
      })}
    </svg>
  );
}

// ─── MiniLineChart ────────────────────────────────────────────────────────────
export function MiniLineChart({ data, color = '#22c55e', height = 40 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');
  const areaEnd = `100,${height} 0,${height}`;
  const last = data[data.length - 1];
  const lastX = 100;
  const lastY = height - ((last - min) / range) * (height - 8) - 4;
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={`${pts} ${areaEnd}`} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
}

// ─── AlertPanel ───────────────────────────────────────────────────────────────
export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  action?: string;
}

export function AlertPanel({ alerts }: { alerts: Alert[] }) {
  const colors = {
    critical: { bg: 'bg-red-950 border-red-800', text: 'text-red-400', icon: '🚨' },
    warning:  { bg: 'bg-amber-950 border-amber-800', text: 'text-amber-400', icon: '⚠️' },
    info:     { bg: 'bg-blue-950 border-blue-800', text: 'text-blue-400', icon: 'ℹ️' },
  };
  if (!alerts.length) return null;
  return (
    <div className="space-y-2">
      {alerts.map(a => {
        const c = colors[a.severity];
        return (
          <div key={a.id} className={`flex items-start gap-3 p-3 rounded-lg border ${c.bg}`}>
            <span className="text-base flex-shrink-0">{c.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${c.text}`}>{a.message}</p>
              {a.action && <p className="text-xs text-slate-500 mt-0.5">{a.action}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── QuickActions ─────────────────────────────────────────────────────────────
export interface QuickAction {
  icon: string;
  label: string;
  color: string;
  onClick?: () => void;
}

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map(a => (
        <button
          key={a.label}
          onClick={a.onClick}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl ${a.color} hover:opacity-90 transition-opacity text-white`}
        >
          <span className="text-2xl">{a.icon}</span>
          <span className="text-xs font-semibold text-center leading-tight">{a.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color = 'bg-green-500', label, sublabel }: { value: number; max: number; color?: string; label: string; sublabel?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-sm font-semibold text-white">{Math.round(pct)}%</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {sublabel && <div className="text-xs text-slate-500 mt-1">{sublabel}</div>}
    </div>
  );
}

// ─── RevenueChart ─────────────────────────────────────────────────────────────
export function RevenueChart({ data, months, color = '#22c55e' }: { data: number[]; months: string[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div>
      <div className="flex items-end gap-1 h-24 mb-2">
        {data.map((v, i) => {
          const h = Math.max(4, (v / max) * 96);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-sm transition-all" style={{ height: `${h}px`, backgroundColor: color, opacity: i === data.length - 1 ? 1 : 0.5 }} />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1">
        {months.map((m, i) => (
          <div key={i} className="flex-1 text-center text-xs text-slate-500">{m}</div>
        ))}
      </div>
    </div>
  );
}

// ─── KpiRing ─────────────────────────────────────────────────────────────────
export function KpiRing({ pct, label, value, color = '#22c55e' }: { pct: number; label: string; value: string; color?: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct, 100) / 100;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 36 36)" />
        <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="bold" fill="white">{Math.round(pct)}%</text>
      </svg>
      <div className="text-xs font-semibold text-white text-center">{value}</div>
      <div className="text-xs text-slate-400 text-center">{label}</div>
    </div>
  );
}

// ─── TopItemsTable ────────────────────────────────────────────────────────────
export function TopItemsTable({ title, items }: { title: string; items: Array<{ name: string; value: string; trend?: number; badge?: string; badgeColor?: string }> }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-300 mb-3">{title}</h4>
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 font-bold flex-shrink-0">{i + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">{item.name}</div>
            </div>
            {item.badge && (
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${item.badgeColor ?? 'bg-slate-700 text-slate-300'}`}>{item.badge}</span>
            )}
            {item.trend !== undefined && (
              <span className={`text-xs flex-shrink-0 ${item.trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>{item.trend >= 0 ? '▲' : '▼'}{Math.abs(item.trend)}%</span>
            )}
            <div className="text-sm font-semibold text-white flex-shrink-0">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
