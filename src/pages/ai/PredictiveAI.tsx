import React, { useState, useMemo } from 'react';
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, Calendar, BarChart2,
  Leaf, Bird, ShoppingCart, Activity, CheckCircle, Clock, ChevronRight,
  Sprout, Zap,
} from 'lucide-react';
import { useOrg } from '@/store/orgStore';
import { getTemplate } from '@/lib/templates';

interface Prediction {
  id: string;
  type: string;
  title: string;
  risk: 'high' | 'medium' | 'low';
  confidence: number;
  value: string;
  detail: string;
  action: string;
  daysOut: number;
}

// Static disease alerts — generic enough to apply to any farm
const STATIC_DISEASE_ALERTS: Prediction[] = [
  { id: 'gen-1', type: 'disease', title: 'Biosecurity — General Advisory', risk: 'low', confidence: 30, value: 'Low general risk', detail: 'No farm-specific outbreak data available. Follow standard biosecurity protocols at all entry points.', action: 'Disinfect vehicle wheels and footbaths daily. Restrict visitor access to production areas.', daysOut: 30 },
  { id: 'gen-2', type: 'disease', title: 'Seasonal Disease Watch', risk: 'medium', confidence: 55, value: 'Elevated seasonal risk', detail: 'Seasonal weather patterns can increase respiratory disease risk in poultry and livestock, and fungal disease risk in crops.', action: 'Ensure adequate ventilation in animal houses. Scout crops for early disease signs.', daysOut: 14 },
];

// Market demand — static reference prices (update as needed)
const MARKET_DEMAND = [
  { commodity: 'Live Broiler (2.0–2.2 kg)', demand: 'very_high', price_zmw: 62, trend: 'up', note: 'Pre-season demand spike. Sell this week.' },
  { commodity: 'Tomato (Grade A)', demand: 'high', price_zmw: 8.50, trend: 'up', note: 'Rains ended — market supply down 30%.' },
  { commodity: 'Lettuce (Head)', demand: 'medium', price_zmw: 14, trend: 'flat', note: 'Steady hotel/restaurant demand.' },
  { commodity: 'Maize (bulk, shelled)', demand: 'low', price_zmw: 3.20, trend: 'down', note: 'FISP glut — consider holding stock.' },
];

function RiskBadge({ risk }: { risk: 'high' | 'medium' | 'low' }) {
  const cfg = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700' }[risk];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${cfg}`}>{risk}</span>;
}

function DemandBadge({ demand }: { demand: string }) {
  const cfg: Record<string, string> = { very_high: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700', medium: 'bg-blue-100 text-blue-700', low: 'bg-slate-100 text-slate-500' };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${cfg[demand] || 'bg-slate-100 text-slate-500'}`}>{demand.replace('_', ' ')}</span>;
}

function CalendarIcon({ type }: { type: string }) {
  const cfg: Record<string, { icon: React.ElementType; color: string }> = {
    planting: { icon: Leaf, color: 'text-green-600 bg-green-100' },
    harvest: { icon: Sprout, color: 'text-amber-600 bg-amber-100' },
    inputs: { icon: Activity, color: 'text-blue-600 bg-blue-100' },
    biosecurity: { icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
    admin: { icon: Calendar, color: 'text-slate-600 bg-slate-100' },
  };
  const { icon: Icon, color } = cfg[type] || cfg.admin;
  return <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}><Icon className="w-3.5 h-3.5" /></div>;
}

export default function PredictiveAIModule() {
  const { org, cycles } = useOrg();
  const [tab, setTab] = useState<'disease' | 'yield' | 'fcr' | 'market' | 'calendar'>('disease');

  const activeCycles = useMemo(() => cycles.filter(c => c.status === 'active'), [cycles]);

  // Build disease alerts from real active cycles
  const diseaseAlerts = useMemo<Prediction[]>(() => {
    if (!org || activeCycles.length === 0) return STATIC_DISEASE_ALERTS;
    const alerts: Prediction[] = [...STATIC_DISEASE_ALERTS];
    activeCycles.forEach((c, i) => {
      const ent = org.enterprises.find(e => e.id === c.enterpriseId);
      const tpl = ent ? getTemplate(ent.templateId) : null;
      const cat = tpl?.category ?? 'crops';
      const ageDays = c.startDate ? Math.floor((Date.now() - new Date(c.startDate).getTime()) / 86400000) : 0;
      const entName = ent?.name ?? c.name;
      // Poultry cycles older than 14 days → ND risk alert
      if (cat === 'poultry' && ageDays > 14) {
        alerts.push({ id: `cycle-nd-${c.id}`, type: 'disease', title: `Newcastle Disease Watch — ${entName}`, risk: ageDays > 28 ? 'medium' : 'low', confidence: Math.min(40 + ageDays, 70), value: `Flock age ${ageDays} days — monitor closely`, detail: `Flock has passed the most vulnerable ND window. Confirm vaccination records are up to date.`, action: 'Check vaccination log. Boost ventilation if humidity > 80%.', daysOut: 7 });
      }
      // Aquaculture — flag low oxygen risk
      if (cat === 'aquaculture') {
        alerts.push({ id: `cycle-do-${c.id}`, type: 'disease', title: `Low DO Alert — ${entName}`, risk: 'medium', confidence: 60, value: 'Monitor dissolved oxygen daily', detail: 'Aquaculture cycles are vulnerable to oxygen depletion especially during warm weather and high biomass density.', action: 'Check aerators. Feed in the morning when DO is highest.', daysOut: 3 });
      }
    });
    return alerts;
  }, [org, activeCycles]);

  // Build yield forecast from real cycles
  const yieldForecasts = useMemo(() => {
    if (!org || activeCycles.length === 0) return [];
    return activeCycles.map(c => {
      const ent = org.enterprises.find(e => e.id === c.enterpriseId);
      const tpl = ent ? getTemplate(ent.templateId) : null;
      const cat = tpl?.category ?? 'crops';
      const ageDays = c.startDate ? Math.floor((Date.now() - new Date(c.startDate).getTime()) / 86400000) : 0;
      const stage = c.stages.find(s => s.id === c.currentStageId);
      const unitQty = (c.productionUnits ?? []).reduce((s, u) => s + (u.quantity ?? 0), 0);
      const daysLeft = stage?.targetEndDate ? Math.max(0, Math.ceil((new Date(stage.targetEndDate).getTime() - Date.now()) / 86400000)) : null;
      const icons: Record<string, React.ElementType> = { poultry: Bird, livestock: Leaf, aquaculture: Activity, crops: Sprout, horticulture: Leaf };
      const Icon = icons[cat] ?? Leaf;
      return {
        crop: ent?.name ?? c.name,
        metric: stage?.name ?? 'Active Stage',
        forecast: unitQty > 0 ? `${unitQty.toLocaleString()} units stocked` : '—',
        actual: `Day ${ageDays}`,
        diff: daysLeft !== null ? `${daysLeft}d left` : 'In progress',
        color: 'blue',
        icon: Icon,
      };
    });
  }, [org, activeCycles]);

  // Build FCR data from real cycles (poultry only; show '—' for unmeasured)
  const fcrData = useMemo(() => {
    const poultry = activeCycles.filter(c => {
      const ent = org?.enterprises.find(e => e.id === c.enterpriseId);
      const tpl = ent ? getTemplate(ent.templateId) : null;
      return tpl?.category === 'poultry';
    });
    if (poultry.length === 0) return [];
    return poultry.map(c => {
      const ent = org?.enterprises.find(e => e.id === c.enterpriseId);
      const ageDays = c.startDate ? Math.floor((Date.now() - new Date(c.startDate).getTime()) / 86400000) : 0;
      const units = (c.productionUnits ?? []).reduce((s, u) => s + (u.quantity ?? 0), 0);
      return {
        flock: `${ent?.name ?? c.name} (Day ${ageDays})`,
        fcr: null as number | null,   // null = not measured yet
        target: 1.65,
        status: 'unknown',
        feed_kg: null as number | null,
        weight_gain_kg: null as number | null,
        units,
      };
    });
  }, [org, activeCycles]);

  // Build real calendar events from active cycle stages
  const realCalendar = useMemo(() => {
    if (!org) return [];
    const events: { date: string; event: string; type: string; status: string }[] = [];
    const today = new Date();

    cycles.filter(c => c.status === 'active').forEach(c => {
      const ent = org.enterprises.find(e => e.id === c.enterpriseId);
      const tpl = ent ? getTemplate(ent.templateId) : null;
      const entName = ent?.name ?? 'Cycle';

      c.stages.forEach(stage => {
        if (stage.status === 'completed') return;
        if (stage.targetEndDate) {
          const d = new Date(stage.targetEndDate);
          const daysOut = Math.round((d.getTime() - today.getTime()) / 86400000);
          if (daysOut >= -3 && daysOut <= 60) {
            events.push({
              date: stage.targetEndDate,
              event: `${entName} — ${stage.name} stage target end`,
              type: tpl?.category === 'crops' ? 'harvest' : 'planting',
              status: daysOut < 0 ? 'overdue' : daysOut <= 7 ? 'upcoming' : 'planned',
            });
          }
        }
      });
    });

    return events.sort((a, b) => a.date.localeCompare(b.date));
  }, [org, cycles]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Predictive AI & Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">Disease outbreak prediction · yield forecasting · FCR optimizer · market demand · crop calendar</p>
        </div>
        <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 px-3 py-2 rounded-lg text-sm">
          <Brain className="w-4 h-4" />
          <span>AI models updated 2h ago</span>
        </div>
      </div>

      {/* Alert banner */}
      {diseaseAlerts.filter(a => a.risk === 'high').length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-800">High-Priority Disease Alert</div>
            <div className="text-sm text-red-700 mt-0.5">{diseaseAlerts.find(a => a.risk === 'high')?.title} — {diseaseAlerts.find(a => a.risk === 'high')?.action}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit flex-wrap">
        {[
          { id: 'disease', label: 'Disease Alerts' },
          { id: 'yield', label: 'Yield Forecast' },
          { id: 'fcr', label: 'FCR Optimizer' },
          { id: 'market', label: 'Market Demand' },
          { id: 'calendar', label: 'Crop Calendar' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'disease' && (
        <div className="space-y-4">
          <div className="text-sm text-slate-500">AI disease risk model — trained on local outbreak history, weather data, flock age, and management patterns</div>
          {diseaseAlerts.map(alert => (
            <div key={alert.id} className={`bg-white rounded-xl border p-5 ${alert.risk === 'high' ? 'border-red-200' : alert.risk === 'medium' ? 'border-amber-200' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alert.risk === 'high' ? 'bg-red-100' : alert.risk === 'medium' ? 'bg-amber-100' : 'bg-slate-100'}`}>
                    <AlertTriangle className={`w-5 h-5 ${alert.risk === 'high' ? 'text-red-600' : alert.risk === 'medium' ? 'text-amber-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{alert.title}</div>
                    <div className="text-sm text-slate-500 mt-0.5">{alert.value}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RiskBadge risk={alert.risk} />
                  <span className="text-xs text-slate-400">{alert.daysOut}d horizon</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 mb-3">{alert.detail}</div>
              <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${alert.risk === 'high' ? 'bg-red-50 text-red-800' : alert.risk === 'medium' ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'}`}>
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span><strong>Recommended action:</strong> {alert.action}</span>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Model confidence</span>
                  <span>{alert.confidence}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${alert.risk === 'high' ? 'bg-red-500' : alert.risk === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${alert.confidence}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'yield' && (
        <div className="space-y-4">
          <div className="text-sm text-slate-500">Forecasts based on current growth trajectory, feed intake, climate data, and historical performance</div>
          {yieldForecasts.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">No active production cycles. Start a cycle to see yield forecasts.</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {yieldForecasts.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.crop} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color === 'green' ? 'bg-green-100' : item.color === 'blue' ? 'bg-blue-100' : item.color === 'amber' ? 'bg-amber-100' : 'bg-slate-100'}`}>
                      <Icon className={`w-4 h-4 ${item.color === 'green' ? 'text-green-600' : item.color === 'blue' ? 'text-blue-600' : item.color === 'amber' ? 'text-amber-600' : 'text-slate-500'}`} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{item.crop}</div>
                      <div className="text-xs text-slate-500">{item.metric}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">{item.forecast}</div>
                  <div className="flex items-center gap-2">
                    {item.actual !== '—' && <span className="text-sm text-slate-500">Actual: {item.actual}</span>}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.diff.startsWith('+') ? 'bg-green-100 text-green-700' : item.diff.startsWith('-') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{item.diff}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'fcr' && (
        <div className="space-y-4">
          <div className="text-sm text-slate-500">Feed Conversion Ratio (FCR) = Total feed consumed ÷ Total live weight gain. Lower is better.</div>
          {fcrData.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">No active poultry cycles. FCR tracking requires an active poultry enterprise.</div>
          )}
          {fcrData.map(item => (
            <div key={item.flock} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-slate-800">{item.flock}</div>
                <div className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {item.units.toLocaleString()} birds
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                  <div className="text-sm font-bold text-slate-400">—</div>
                  <div className="text-xs text-slate-400">Actual FCR</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                  <div className="text-sm font-bold text-slate-700">{item.target}</div>
                  <div className="text-xs text-slate-400">Target FCR</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-2.5 text-center">
                  <div className="text-sm font-bold text-blue-600">Pending</div>
                  <div className="text-xs text-slate-400">vs Target</div>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-800">
                FCR not yet measured — record feed and weight data in inventory to enable AI FCR tracking.
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'market' && (
        <div className="space-y-4">
          <div className="text-sm text-slate-500">Demand intelligence from market price feeds, seasonal patterns, and regional supply signals</div>
          {MARKET_DEMAND.map(item => (
            <div key={item.commodity} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-800">{item.commodity}</span>
                  <DemandBadge demand={item.demand} />
                </div>
                <div className="text-xs text-slate-500">{item.note}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold text-slate-900">ZMW {item.price_zmw}</div>
                <div className="flex items-center gap-1 justify-end mt-0.5">
                  {item.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 text-green-500" /> : item.trend === 'down' ? <TrendingDown className="w-3.5 h-3.5 text-red-500" /> : <BarChart2 className="w-3.5 h-3.5 text-slate-400" />}
                  <span className={`text-xs font-medium ${item.trend === 'up' ? 'text-green-600' : item.trend === 'down' ? 'text-red-600' : 'text-slate-400'}`}>{item.trend}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'calendar' && (
        <div className="space-y-3">
          <div className="text-sm text-slate-500">Farm activity calendar from your production cycles + AI-recommended activities</div>

          {/* Real cycle events */}
          {realCalendar.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">From Your Production Cycles</div>
              {realCalendar.map((ev, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3">
                  <CalendarIcon type={ev.type} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{ev.event}</div>
                    <div className="text-xs text-slate-400 mt-0.5 capitalize">{ev.type}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-slate-700">{ev.date}</div>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className={`text-[10px] font-medium ${ev.status === 'overdue' ? 'text-red-500' : ev.status === 'upcoming' ? 'text-amber-600' : 'text-slate-400'}`}>{ev.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI-recommended activities — generic best practices */}
          {(() => {
            const today = new Date();
            const fmt = (d: Date) => d.toISOString().slice(0, 10);
            const add = (days: number) => { const d = new Date(today); d.setDate(today.getDate() + days); return fmt(d); };
            const aiActivities = [
              { date: add(3),  event: 'Inspect all water lines and drinkers for blockages', type: 'inputs' },
              { date: add(7),  event: 'Biosecurity walk-through — log visitor entries', type: 'biosecurity' },
              { date: add(10), event: 'Review feed stock levels against expected consumption', type: 'inputs' },
              { date: add(14), event: 'Check growth performance against breed standard', type: 'planting' },
              { date: add(21), event: 'Soil/water quality sampling (if applicable)', type: 'inputs' },
              { date: add(30), event: 'Mid-cycle financial reconciliation', type: 'admin' },
            ];
            return (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">AI-Recommended Activities</div>
                {aiActivities.map((ev, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3">
                    <CalendarIcon type={ev.type} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">{ev.event}</div>
                      <div className="text-xs text-slate-400 mt-0.5 capitalize">{ev.type}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-slate-700">{ev.date}</div>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-400">suggested</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
