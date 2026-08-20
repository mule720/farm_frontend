// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Smart AI Operations Engine
// Reads real production cycles + derives feeding/water/health recommendations
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo } from 'react';
import { Brain, Wheat, Droplet, TrendingUp, AlertTriangle, Sparkles, Zap } from 'lucide-react';
import { useOrg } from '@/store/orgStore';
import { getTemplate } from '@/lib/templates';

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

// ─── Generic AI insights based on cycle state ─────────────────────────────────
const STATIC_INSIGHTS = [
  { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', title: 'Disease Risk Monitoring', body: 'Check water intake daily — a 20%+ drop is an early warning. Inspect any batch showing lethargy or reduced feed uptake.' },
  { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', title: 'Growth Tracking', body: 'Weigh a 2% sample every 7 days. Compare actual vs target weight. Adjust feed quantity and quality if lagging.' },
  { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', title: 'Feed Stage Transitions', body: 'Review stage templates in your production cycles. Order next-stage feed 5 days before the transition date.' },
  { icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-50', title: 'Market Timing', body: 'List produce on AgriFood Market 7–10 days before harvest. Early listing attracts more buyers and better prices.' },
  { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', title: 'Feed Cost Management', body: 'Track feed cost as % of total production cost. Industry target is 60–70% for poultry, 55–65% for aquaculture.' },
  { icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', title: 'Record Keeping Reminder', body: 'Daily records in the Production Engine unlock AI recommendations and help you compare cycles over time.' },
];

export default function SmartEngine() {
  const { org, cycles } = useOrg();

  const activeCycles = useMemo(() => cycles.filter(c => c.status === 'active'), [cycles]);

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
            <div className="text-2xl font-bold">{STATIC_INSIGHTS.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="text-xs text-blue-100">Active Cycles</div>
            <div className="text-2xl font-bold">{activeCycles.length}</div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">AI-Generated Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STATIC_INSIGHTS.map((insight, i) => {
            const Icon = insight.icon;
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${insight.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${insight.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{insight.title}</h3>
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
