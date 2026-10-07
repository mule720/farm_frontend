// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Smart AI Operations Engine
// Reads real production cycles + derives feeding/water/health recommendations
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo } from 'react';
import { Brain, Wheat, Droplet, TrendingUp, AlertTriangle, Sparkles, Zap, RefreshCw } from 'lucide-react';
import { useOrg } from '@/store/orgStore';
import { getTemplate } from '@/lib/templates';
import { useTransactions } from '@/lib/financeStore';

// ─── Per-category feeding norms (g/animal/day, ml/animal/day) ─────────────────
const FEEDING_NORMS: Record<string, { feedG: number; waterMl: number; feedType: string; notes: string }> = {
  poultry: { feedG: 120, waterMl: 250, feedType: 'Broiler Grower', notes: 'Check feeder levels twice daily. Adjust for ambient temp.' },
  livestock: { feedG: 8000, waterMl: 30000, feedType: 'TMR / Silage Mix', notes: 'Monitor BCS weekly. Supplement minerals.' },
  aquaculture: { feedG: 30, waterMl: 0, feedType: 'Floating Pellets', notes: 'Feed 3–4x daily. Monitor DO before each feed.' },
  crops: { feedG: 0, waterMl: 2000, feedType: 'N/A', notes: 'Irrigate based on crop stage and soil moisture.' },
  horticulture: { feedG: 0, waterMl: 1500, feedType: 'Fertigation', notes: 'Apply fertigation 2× weekly.' },
  greenhouse: { feedG: 0, waterMl: 1200, feedType: 'Drip fertigation', notes: 'Maintain humidity 65–75%. Check CO₂ levels.' },
  processing: { feedG: 0, waterMl: 0, feedType: 'N/A', notes: 'Run equipment checks before each shift.' },
  services: { feedG: 0, waterMl: 0, feedType: 'N/A', notes: 'Confirm job schedule with clients daily.' },
};

function getNorm(cat: string) {
  return FEEDING_NORMS[cat] ?? FEEDING_NORMS.crops;
}

// ─── Live insights from localStorage ─────────────────────────────────────────
interface Insight {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'critical';
}

function generateInsights(txs: any[]): Insight[] {
  const insights: Insight[] = [];

  // 1. Aquaculture — low DO + aerator off
  try {
    const ponds: any[] = JSON.parse(localStorage.getItem('agronexus_v2_aqua_ponds') ?? '[]');
    ponds.forEach(p => {
      if ((p.do_mgl ?? 99) < 5 && p.aeratorOn === false) {
        insights.push({
          icon: AlertTriangle, severity: 'critical',
          color: 'text-red-600', bg: 'bg-red-50',
          title: `Low DO in ${p.name ?? 'pond'} — aerator off`,
          body: `Dissolved oxygen is ${p.do_mgl} mg/L, which is below the 5 mg/L threshold. Turn on the aerator immediately to prevent fish stress or mortality.`,
        });
      }
    });
  } catch {}

  // 2. Poultry — temperature outside 18–30°C
  try {
    const houses: any[] = JSON.parse(localStorage.getItem('agronexus_v2_ph_houses') ?? '[]');
    houses.forEach(h => {
      const t = h.temp ?? h.temperature;
      if (t !== undefined && (t < 18 || t > 30)) {
        insights.push({
          icon: AlertTriangle, severity: 'warning',
          color: 'text-amber-600', bg: 'bg-amber-50',
          title: `Temperature alert in ${h.name ?? 'house'}`,
          body: `Current temperature is ${t}°C, outside the optimal 18–30°C range. Adjust ventilation or heating to prevent performance loss.`,
        });
      }
    });
  } catch {}

  // 3. Inventory below reorder point
  try {
    const items: any[] = JSON.parse(localStorage.getItem('agronexus_v2_inventory_items') ?? '[]');
    const low = items.filter(i => (i.currentQty ?? i.quantity ?? 0) <= (i.minStockLevel ?? i.reorderPoint ?? 0));
    if (low.length > 0) {
      insights.push({
        icon: Zap, severity: 'warning',
        color: 'text-amber-600', bg: 'bg-amber-50',
        title: `${low.length} inventory item${low.length > 1 ? 's' : ''} below reorder point`,
        body: `Items: ${low.slice(0, 3).map((i: any) => i.name ?? i.itemName ?? 'Unknown').join(', ')}${low.length > 3 ? ` +${low.length - 3} more` : ''}. Restock to avoid disruptions.`,
      });
    }
  } catch {}

  // 4. Finance — this month P&L
  try {
    const now = new Date();
    const monthTxs = txs.filter(t => {
      const d = new Date(t.date ?? t.createdAt ?? '');
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const income  = monthTxs.filter(t => t.type === 'income').reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
    const expense = monthTxs.filter(t => t.type === 'expense').reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
    const net = income - expense;
    if (monthTxs.length > 0) {
      insights.push({
        icon: TrendingUp, severity: 'info',
        color: net >= 0 ? 'text-green-600' : 'text-red-600',
        bg: net >= 0 ? 'bg-green-50' : 'bg-red-50',
        title: `This month: ZMW ${income.toLocaleString()} income, ZMW ${expense.toLocaleString()} expenses`,
        body: `Net ${net >= 0 ? 'profit' : 'loss'}: ZMW ${Math.abs(net).toLocaleString()} for ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}.`,
      });
    }
  } catch {}

  // 5. Energy — battery critically low
  try {
    const batteries: any[] = JSON.parse(localStorage.getItem('agronexus_v2_em_battery') ?? '[]');
    batteries.forEach(b => {
      const soc = b.soc ?? b.stateOfCharge ?? b.chargeLevel;
      if (soc !== undefined && soc < 20) {
        insights.push({
          icon: Zap, severity: 'critical',
          color: 'text-red-600', bg: 'bg-red-50',
          title: `${b.name ?? 'Battery'} critically low at ${soc}%`,
          body: `Battery state of charge is ${soc}%. Charge immediately or switch to grid power to avoid system outages.`,
        });
      }
    });
  } catch {}

  // 6. Soil — critical zones
  try {
    const zones: any[] = JSON.parse(localStorage.getItem('agronexus_v2_sd_zones') ?? '[]');
    zones.filter(z => z.status === 'critical').forEach(z => {
      insights.push({
        icon: AlertTriangle, severity: 'critical',
        color: 'text-red-600', bg: 'bg-red-50',
        title: `Soil moisture critical in ${z.name ?? 'zone'}`,
        body: `Zone ${z.name ?? ''} is reporting critical soil moisture. Irrigate immediately to prevent crop stress and yield loss.`,
      });
    });
  } catch {}

  // 7. Filler if fewer than 3
  if (insights.length < 3) {
    insights.push({
      icon: Sparkles, severity: 'info',
      color: 'text-blue-600', bg: 'bg-blue-50',
      title: 'All systems normal — no issues detected',
      body: 'Your farm sensors and modules are reporting normal readings. Keep recording daily data to improve AI recommendations.',
    });
  }

  return insights.slice(0, 6);
}

export default function SmartEngine() {
  const { org, cycles } = useOrg();
  const [refreshKey, setRefreshKey] = React.useState(0);

  const activeCycles = useMemo(() => cycles.filter(c => c.status === 'active'), [cycles]);

  // Computed insights from live localStorage data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ledger = useTransactions();
  const insights = useMemo(() => generateInsights(ledger), [refreshKey, ledger]);

  // Build today's feeding plan from real cycles
  const todayPlan = useMemo(() => {
    if (!org) return [];
    return activeCycles.map(c => {
      const enterprise = org.enterprises.find(e => e.id === c.enterpriseId);
      const tpl = enterprise ? getTemplate(enterprise.templateId) : null;
      const cat = tpl?.category ?? 'crops';
      const norm = getNorm(cat);

      // Sum quantity from all production units (birds, animals, fish, area, etc.)
      const initialCount = c.productionUnits && c.productionUnits.length > 0
        ? c.productionUnits.reduce((s, u) => s + (u.quantity ?? 0), 0)
        : 100;
      const daysSince = c.startDate
        ? Math.floor((Date.now() - new Date(c.startDate).getTime()) / 86400000)
        : 0;

      // Current stage
      const currentStage = c.stages.find(s => s.id === c.currentStageId) ?? c.stages[0];

      const feedKg = norm.feedG > 0 ? (norm.feedG * initialCount) / 1000 : 0;
      const waterL = norm.waterMl > 0 ? (norm.waterMl * initialCount) / 1000 : 0;

      return {
        id: c.id,
        name: enterprise?.name ?? c.name,
        enterprise: tpl?.name ?? cat,
        icon: tpl?.icon ?? '🌱',
        ageDays: daysSince,
        initialCount,
        stage: currentStage?.name ?? 'Active',
        feedType: norm.feedType,
        feedKg,
        waterL,
        notes: norm.notes,
      };
    });
  }, [activeCycles, org]);

  const totalFeedKg = todayPlan.reduce((s, p) => s + p.feedKg, 0);
  const totalWaterL = todayPlan.reduce((s, p) => s + p.waterL, 0);
  const currency = org?.currency ?? 'ZMW';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full">
      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <Brain className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Smart AI Operations Engine</h1>
            <p className="text-sm text-blue-100">Predictive analytics, smart feeding, and operational guidance — running 24/7</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="text-xs text-blue-100">Today's Total Feed Need</div>
            <div className="text-2xl font-bold">{totalFeedKg > 0 ? `${totalFeedKg.toFixed(0)} kg` : '—'}</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="text-xs text-blue-100">Today's Total Water</div>
            <div className="text-2xl font-bold">{totalWaterL > 0 ? `${totalWaterL.toFixed(0)} L` : '—'}</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="text-xs text-blue-100">AI Insights</div>
            <div className="text-2xl font-bold">{insights.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="text-xs text-blue-100">Active Cycles</div>
            <div className="text-2xl font-bold">{activeCycles.length}</div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">AI-Generated Insights</h2>
          <button onClick={() => setRefreshKey(k => k + 1)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, i) => {
            const Icon = insight.icon;
            return (
              <div key={i} className={`bg-white border rounded-xl p-5 ${insight.severity === 'critical' ? 'border-red-200' : insight.severity === 'warning' ? 'border-amber-200' : 'border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${insight.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${insight.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{insight.title}</h3>
                      {insight.severity !== 'info' && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${insight.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {insight.severity}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{insight.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-cycle daily plan */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          Per-Cycle Smart Recommendations (Today)
        </h2>
        {todayPlan.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <div className="text-4xl mb-3">🌱</div>
            <p className="text-slate-500 text-sm">No active production cycles. Start a cycle in the Production module to see daily recommendations.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">Enterprise / Cycle</th>
                    <th className="text-left px-4 py-3">Stage</th>
                    <th className="text-left px-4 py-3">Feed Type</th>
                    <th className="text-right px-4 py-3"><Wheat className="inline w-3.5 h-3.5 mr-0.5" />Feed (kg)</th>
                    <th className="text-right px-4 py-3"><Droplet className="inline w-3.5 h-3.5 mr-0.5" />Water (L)</th>
                    <th className="text-left px-4 py-3">Smart Note</th>
                  </tr>
                </thead>
                <tbody>
                  {todayPlan.map(p => (
                    <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{p.icon}</span>
                          <div>
                            <div className="font-medium text-slate-900">{p.name}</div>
                            <div className="text-xs text-slate-400">Day {p.ageDays} · {p.enterprise}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{p.stage}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{p.feedType || '—'}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                        {p.feedKg > 0 ? p.feedKg.toFixed(1) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                        {p.waterL > 0 ? p.waterL.toFixed(0) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-xs">{p.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Forecast cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Feed Forecast — Next 7 Days</h3>
          {totalFeedKg > 0 ? (
            <>
              <div className="text-3xl font-bold text-green-600 mb-1">{(totalFeedKg * 7 * 1.05).toFixed(0)} kg</div>
              <div className="text-xs text-slate-500">Estimated for all active cycles</div>
            </>
          ) : (
            <p className="text-sm text-slate-400">Start a production cycle to see feed forecasts.</p>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Active Cycles at a Glance</h3>
          {activeCycles.length === 0 ? (
            <p className="text-sm text-slate-400">No active cycles yet.</p>
          ) : (
            <div className="space-y-1.5">
              {activeCycles.slice(0, 4).map(c => {
                const ent = org?.enterprises.find(e => e.id === c.enterpriseId);
                const days = c.startDate ? Math.floor((Date.now() - new Date(c.startDate).getTime()) / 86400000) : 0;
                return (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium truncate">{ent?.name ?? c.name}</span>
                    <span className="text-slate-400 ml-2 flex-shrink-0">Day {days}</span>
                  </div>
                );
              })}
              {activeCycles.length > 4 && <div className="text-xs text-slate-400">+{activeCycles.length - 4} more</div>}
            </div>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Tip of the Day</h3>
          <p className="text-sm text-slate-600">Record daily data consistently — even on weekends. Gaps in records make it impossible to diagnose problems accurately later.</p>
        </div>
      </div>
    </div>
  );
}
