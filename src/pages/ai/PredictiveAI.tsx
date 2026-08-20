import React, { useState } from 'react';
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, Calendar, BarChart2,
  Leaf, Bird, ShoppingCart, Activity, CheckCircle, Clock, ChevronRight,
  Sprout, Zap,
} from 'lucide-react';

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

const DISEASE_ALERTS: Prediction[] = [
  { id: '1', type: 'disease', title: 'Newcastle Disease Risk — Poultry', risk: 'high', confidence: 87, value: '87% probability in 5 days', detail: 'Humidity 89% + temperature drop + flock age 21 days match outbreak pattern from 2024 cluster.', action: 'Administer ND vaccine booster today. Increase ventilation.', daysOut: 5 },
  { id: '2', type: 'disease', title: 'Late Blight — Tomato Tunnel 1', risk: 'medium', confidence: 64, value: '64% risk in 7 days', detail: 'Extended leaf wetness period >8h detected. VPD 0.6 kPa below threshold.', action: 'Apply preventive fungicide (Mancozeb). Reduce humidity below 80%.', daysOut: 7 },
  { id: '3', type: 'disease', title: 'ASF Biosecurity Alert', risk: 'low', confidence: 22, value: 'Low — regional monitoring', detail: 'ASF confirmed in Lusaka province. No on-farm indicators detected.', action: 'Maintain strict vehicle and visitor biosecurity protocols.', daysOut: 30 },
];

const YIELD_FORECASTS = [
  { crop: 'Broiler Flock A', metric: 'Avg Live Weight', forecast: '2.45 kg', actual: '2.38 kg', diff: '+3%', color: 'green', icon: Bird },
  { crop: 'Tomatoes — T1', metric: 'Yield this week', forecast: '1,240 kg', actual: '—', diff: 'Forecast', color: 'blue', icon: Leaf },
  { crop: 'Maize — Field A', metric: 'Harvest yield', forecast: '4.8 t/ha', actual: '—', diff: 'Forecast', color: 'amber', icon: Sprout },
  { crop: 'Lettuce — NFT', metric: 'Ready to harvest', forecast: '320 heads', actual: '—', diff: '5 days', color: 'green', icon: Leaf },
];

const FCR_DATA = [
  { flock: 'Broiler A (Day 28)', fcr: 1.72, target: 1.65, status: 'above', feed_kg: 3420, weight_gain_kg: 1988 },
  { flock: 'Broiler B (Day 14)', fcr: 1.51, target: 1.55, status: 'good', feed_kg: 1240, weight_gain_kg: 821 },
  { flock: 'Layer Flock (Wk 32)', fcr: 2.1, target: 2.0, status: 'above', feed_kg: 8400, weight_gain_kg: 4000 },
];

const MARKET_DEMAND = [
  { commodity: 'Live Broiler (2.0–2.2 kg)', demand: 'very_high', price_zmw: 62, trend: 'up', note: 'Pre-season demand spike. Sell this week.' },
  { commodity: 'Tomato (Grade A)', demand: 'high', price_zmw: 8.50, trend: 'up', note: 'Rains ended — market supply down 30%.' },
  { commodity: 'Lettuce (Head)', demand: 'medium', price_zmw: 14, trend: 'flat', note: 'Steady hotel/restaurant demand.' },
  { commodity: 'Maize (bulk, shelled)', demand: 'low', price_zmw: 3.20, trend: 'down', note: 'FISP glut — hold until July.' },
];

const CROP_CALENDAR = [
  { date: 'Jun 10', event: 'Transplant tomato seedlings — Tunnel 2', type: 'planting', status: 'upcoming' },
  { date: 'Jun 12', event: 'Apply NPK top-dressing — Maize Field A', type: 'inputs', status: 'upcoming' },
  { date: 'Jun 15', event: 'Broiler Flock A — expected slaughter weight', type: 'harvest', status: 'upcoming' },
  { date: 'Jun 18', event: 'Lettuce harvest — NFT Bay (325 heads)', type: 'harvest', status: 'upcoming' },
  { date: 'Jun 22', event: 'Fumigation — empty broiler house', type: 'biosecurity', status: 'upcoming' },
  { date: 'Jun 28', event: 'Payroll processing deadline', type: 'admin', status: 'upcoming' },
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
  const [tab, setTab] = useState<'disease' | 'yield' | 'fcr' | 'market' | 'calendar'>('disease');

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
      {DISEASE_ALERTS.filter(a => a.risk === 'high').length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-800">High-Priority Disease Alert</div>
            <div className="text-sm text-red-700 mt-0.5">{DISEASE_ALERTS.find(a => a.risk === 'high')?.title} — {DISEASE_ALERTS.find(a => a.risk === 'high')?.action}</div>
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
          {DISEASE_ALERTS.map(alert => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {YIELD_FORECASTS.map(item => {
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
          {FCR_DATA.map(item => (
            <div key={item.flock} className={`bg-white rounded-xl border p-5 ${item.status === 'above' ? 'border-amber-200' : 'border-green-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-slate-800">{item.flock}</div>
                <div className={`text-lg font-bold ${item.status === 'above' ? 'text-amber-700' : 'text-green-700'}`}>
                  FCR {item.fcr}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                  <div className="text-sm font-bold text-slate-700">{item.fcr}</div>
                  <div className="text-xs text-slate-400">Actual FCR</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                  <div className="text-sm font-bold text-slate-700">{item.target}</div>
                  <div className="text-xs text-slate-400">Target FCR</div>
                </div>
                <div className={`rounded-lg p-2.5 text-center ${item.status === 'above' ? 'bg-amber-50' : 'bg-green-50'}`}>
                  <div className={`text-sm font-bold ${item.status === 'above' ? 'text-amber-700' : 'text-green-700'}`}>{item.status === 'above' ? '+' + ((item.fcr - item.target) * 100).toFixed(0) + 'g/kg waste' : 'On target'}</div>
                  <div className="text-xs text-slate-400">vs Target</div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Feed consumed: {item.feed_kg.toLocaleString()} kg</span>
                <span>Weight gain: {item.weight_gain_kg.toLocaleString()} kg</span>
              </div>
              {item.status === 'above' && (
                <div className="mt-3 bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-800">
                  AI suggests: Review feed pellet quality, reduce heat stress, check feeder adjustment to minimize wastage.
                </div>
              )}
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
          <div className="text-sm text-slate-500">AI-generated farm activity calendar based on production cycles, growth stages, and historical schedules</div>
          {CROP_CALENDAR.map((ev, i) => (
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
                  <span className="text-[10px] text-slate-400">upcoming</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
