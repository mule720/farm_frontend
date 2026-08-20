/**
 * Poultry House Dashboard — Climate · Egg Counter · Feed & Water · Mortality · Controls
 * Fully localStorage-based; no backend required.
 */
import React, { useState, useMemo } from 'react';
import {
  ThermometerSun, Wind, Droplets, Activity, AlertTriangle, CheckCircle,
  Plus, Trash2, X, RefreshCw, Egg, Skull, BarChart3, Settings2,
  ChevronDown, ChevronUp, Beef, Zap, Clock, TrendingUp, TrendingDown,
} from 'lucide-react';
import { useOrg } from '@/store/orgStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type HouseType = 'broiler' | 'layer' | 'breeder' | 'pullet' | 'turkey';
type HouseStatus = 'optimal' | 'good' | 'warning' | 'critical';

interface PoultryHouse {
  id: string;
  name: string;
  enterpriseId: string;
  type: HouseType;
  capacity: number;
  currentBirds: number;
  ageWeeks: number;
  breed: string;
  // Climate
  tempC: number;
  humidityPct: number;
  co2Ppm: number;
  nh3Ppm: number;
  lightLux: number;
  // Controls
  fanOn: boolean;
  heaterOn: boolean;
  ventilationPct: number;  // 0-100
  lightOn: boolean;
  // Production (layers)
  eggsToday: number;
  eggsThisWeek: number;
  eggsThisCycle: number;
  // Feed & Water
  feedConsumedKgToday: number;
  feedBudgetKgPerDay: number;
  waterLitresToday: number;
  waterBudgetLPerDay: number;
  // Mortality
  mortalityThisCycle: number;
  status: HouseStatus;
  addedAt: string;
}

interface EggCollectionLog {
  id: string;
  houseId: string;
  count: number;
  brokenCount: number;
  notes: string;
  collectedAt: string;
}

interface FeedRecord {
  id: string;
  houseId: string;
  feedKg: number;
  feedType: string;
  notes: string;
  recordedAt: string;
}

interface MortalityRecord {
  id: string;
  houseId: string;
  count: number;
  avgWeightG: number;
  cause: string;
  loggedAt: string;
}

interface PoultryAlert {
  id: string;
  houseId: string;
  houseName: string;
  parameter: string;
  value: number;
  unit: string;
  severity: 'warning' | 'critical';
  ts: string;
  resolved: boolean;
}

// ─── localStorage ─────────────────────────────────────────────────────────────
const LS = {
  HOUSES: 'agronexus_v2_ph_houses',
  EGGS:   'agronexus_v2_ph_eggs',
  FEED:   'agronexus_v2_ph_feed',
  MORT:   'agronexus_v2_ph_mort',
  ALERTS: 'agronexus_v2_ph_alerts',
};

// ─── Seed data ────────────────────────────────────────────────────────────────

function mkSeeds(enterprises: {id:string}[]) {
  const eid = enterprises[0]?.id ?? '';
  const HOUSES: PoultryHouse[] = [
    {
      id:'h-1', name:'Broiler House 1 — Cobb 500', enterpriseId:eid,
      type:'broiler', capacity:20000, currentBirds:19450, ageWeeks:5, breed:'Cobb 500',
      tempC:28.5, humidityPct:62, co2Ppm:1800, nh3Ppm:15, lightLux:20,
      fanOn:true, heaterOn:false, ventilationPct:70, lightOn:true,
      eggsToday:0, eggsThisWeek:0, eggsThisCycle:0,
      feedConsumedKgToday:1640, feedBudgetKgPerDay:1750,
      waterLitresToday:3800, waterBudgetLPerDay:4000,
      mortalityThisCycle:550, status:'good', addedAt:new Date().toISOString(),
    },
    {
      id:'h-2', name:'Layer House A — Lohmann Brown', enterpriseId:eid,
      type:'layer', capacity:15000, currentBirds:14800, ageWeeks:36, breed:'Lohmann Brown',
      tempC:32.1, humidityPct:78, co2Ppm:2400, nh3Ppm:28, lightLux:15,
      fanOn:false, heaterOn:false, ventilationPct:40, lightOn:true,
      eggsToday:12600, eggsThisWeek:86400, eggsThisCycle:420000,
      feedConsumedKgToday:1560, feedBudgetKgPerDay:1540,
      waterLitresToday:2800, waterBudgetLPerDay:3000,
      mortalityThisCycle:200, status:'critical', addedAt:new Date().toISOString(),
    },
    {
      id:'h-3', name:'Layer House B — Novogen White', enterpriseId:eid,
      type:'layer', capacity:10000, currentBirds:9850, ageWeeks:22, breed:'Novogen White',
      tempC:27.2, humidityPct:58, co2Ppm:1650, nh3Ppm:10, lightLux:18,
      fanOn:true, heaterOn:false, ventilationPct:60, lightOn:true,
      eggsToday:8800, eggsThisWeek:59200, eggsThisCycle:180000,
      feedConsumedKgToday:980, feedBudgetKgPerDay:1000,
      waterLitresToday:1950, waterBudgetLPerDay:2000,
      mortalityThisCycle:150, status:'optimal', addedAt:new Date().toISOString(),
    },
  ];

  const EGGS: EggCollectionLog[] = [
    { id:'e-1', houseId:'h-2', count:6300, brokenCount:45, notes:'Morning collection, hot day', collectedAt:new Date(Date.now()-5*3600000).toISOString() },
    { id:'e-2', houseId:'h-2', count:6300, brokenCount:38, notes:'Afternoon collection', collectedAt:new Date(Date.now()-1*3600000).toISOString() },
    { id:'e-3', houseId:'h-3', count:8800, brokenCount:22, notes:'Good production today', collectedAt:new Date(Date.now()-2*3600000).toISOString() },
    { id:'e-4', houseId:'h-2', count:12100, brokenCount:80, notes:'Yesterday total', collectedAt:new Date(Date.now()-26*3600000).toISOString() },
  ];

  const FEED: FeedRecord[] = [
    { id:'fr-1', houseId:'h-1', feedKg:850, feedType:'Broiler Finisher 3', notes:'Morning allocation', recordedAt:new Date(Date.now()-6*3600000).toISOString() },
    { id:'fr-2', houseId:'h-1', feedKg:790, feedType:'Broiler Finisher 3', notes:'Afternoon', recordedAt:new Date(Date.now()-2*3600000).toISOString() },
    { id:'fr-3', houseId:'h-2', feedKg:1560, feedType:'Layer Mash 16%', notes:'Full day', recordedAt:new Date(Date.now()-3*3600000).toISOString() },
  ];

  const MORT: MortalityRecord[] = [
    { id:'m-1', houseId:'h-2', count:8, avgWeightG:1800, cause:'Heat stress (high NH₃ + high temp)', loggedAt:new Date(Date.now()-2*3600000).toISOString() },
    { id:'m-2', houseId:'h-1', count:3, avgWeightG:2100, cause:'Unknown — submitted to lab', loggedAt:new Date(Date.now()-86400000).toISOString() },
  ];

  const ALERTS: PoultryAlert[] = [
    { id:'a-1', houseId:'h-2', houseName:'Layer House A', parameter:'Temperature', value:32.1, unit:'°C', severity:'critical', ts:new Date(Date.now()-40*60000).toISOString(), resolved:false },
    { id:'a-2', houseId:'h-2', houseName:'Layer House A', parameter:'Ammonia (NH₃)', value:28, unit:'ppm', severity:'critical', ts:new Date(Date.now()-45*60000).toISOString(), resolved:false },
    { id:'a-3', houseId:'h-2', houseName:'Layer House A', parameter:'CO₂', value:2400, unit:'ppm', severity:'warning', ts:new Date(Date.now()-50*60000).toISOString(), resolved:false },
    { id:'a-4', houseId:'h-2', houseName:'Layer House A', parameter:'Humidity', value:78, unit:'%', severity:'warning', ts:new Date(Date.now()-35*60000).toISOString(), resolved:false },
  ];

  return { HOUSES, EGGS, FEED, MORT, ALERTS };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function ls<T>(key: string, def: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : def; } catch { return def; }
}
function lsSet<T>(key: string, v: T) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }
function uid() { return Math.random().toString(36).slice(2, 10); }
function fmtTs(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── Climate parameter config ──────────────────────────────────────────────────

type ClimateParam = { label:string; unit:string; warn:[number,number]; crit:[number,number]; target:string; icon:React.ReactNode };
const BROILER_CLIMATE: Record<string, ClimateParam> = {
  tempC:       { label:'Temperature', unit:'°C',  warn:[29,31], crit:[32,99], target:'26–30°C', icon:<ThermometerSun className="w-4 h-4" /> },
  humidityPct: { label:'Humidity',    unit:'%',   warn:[70,80], crit:[80,100], target:'50–70%', icon:<Droplets className="w-4 h-4" /> },
  co2Ppm:      { label:'CO₂',         unit:'ppm', warn:[2000,2500], crit:[2500,9999], target:'< 2000 ppm', icon:<Wind className="w-4 h-4" /> },
  nh3Ppm:      { label:'NH₃',         unit:'ppm', warn:[20,25], crit:[25,99], target:'< 20 ppm', icon:<Activity className="w-4 h-4" /> },
};
const LAYER_CLIMATE: Record<string, ClimateParam> = {
  tempC:       { label:'Temperature', unit:'°C',  warn:[28,30], crit:[30,99], target:'21–28°C', icon:<ThermometerSun className="w-4 h-4" /> },
  humidityPct: { label:'Humidity',    unit:'%',   warn:[70,80], crit:[80,100], target:'50–70%', icon:<Droplets className="w-4 h-4" /> },
  co2Ppm:      { label:'CO₂',         unit:'ppm', warn:[2000,2500], crit:[2500,9999], target:'< 2000 ppm', icon:<Wind className="w-4 h-4" /> },
  nh3Ppm:      { label:'NH₃',         unit:'ppm', warn:[15,20], crit:[20,99], target:'< 15 ppm', icon:<Activity className="w-4 h-4" /> },
};

function climateStatus(val: number, cfg: ClimateParam): 'ok'|'warning'|'critical' {
  if (val >= cfg.crit[0] && val <= cfg.crit[1]) return 'critical';
  if (val >= cfg.warn[0] && val <= cfg.warn[1]) return 'warning';
  return 'ok';
}

// ─── Climate Gauge ────────────────────────────────────────────────────────────

function ClimateCard({ label, value, unit, status, target, icon }: {
  label:string; value:number; unit:string; status:'ok'|'warning'|'critical'; target:string; icon:React.ReactNode;
}) {
  const colors = { ok:'bg-green-50 border-green-200 text-green-700', warning:'bg-amber-50 border-amber-200 text-amber-700', critical:'bg-red-50 border-red-200 text-red-700 animate-pulse' }[status];
  const dot = { ok:'bg-green-400', warning:'bg-amber-400', critical:'bg-red-500' }[status];
  return (
    <div className={`border rounded-xl p-4 flex flex-col gap-2 ${colors}`}>
      <div className="flex items-center gap-2 text-sm font-medium opacity-80">
        {icon} {label}
        <span className={`ml-auto w-2 h-2 rounded-full ${dot} ${status==='critical'?'animate-ping':''}`} />
      </div>
      <div className="text-3xl font-bold tabular-nums">{value}<span className="text-sm font-normal ml-1 opacity-70">{unit}</span></div>
      <div className="text-[11px] opacity-60">Target: {target}</div>
    </div>
  );
}

// ─── House Status Badge ───────────────────────────────────────────────────────

const HS_CFG: Record<HouseStatus, { label:string; bg:string; text:string; border:string }> = {
  optimal:  { label:'Optimal',  bg:'bg-green-100', text:'text-green-700', border:'border-green-200' },
  good:     { label:'Good',     bg:'bg-emerald-100', text:'text-emerald-700', border:'border-emerald-200' },
  warning:  { label:'Warning',  bg:'bg-amber-100', text:'text-amber-700', border:'border-amber-200' },
  critical: { label:'Critical', bg:'bg-red-100', text:'text-red-700', border:'border-red-200' },
};
function HStatusBadge({ status }: { status: HouseStatus }) {
  const c = HS_CFG[status];
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${c.bg} ${c.text} ${c.border}`}>{c.label}</span>;
}

// ─── House Selector Card ──────────────────────────────────────────────────────

function HouseCard({ house, selected, onClick }: { house:PoultryHouse; selected:boolean; onClick:()=>void }) {
  const mortality_rate = house.currentBirds > 0 ? ((house.mortalityThisCycle / (house.currentBirds + house.mortalityThisCycle)) * 100).toFixed(1) : '0';
  const prodRate = house.type === 'layer' ? ((house.eggsToday / house.currentBirds) * 100).toFixed(1) : null;
  const feedUtil = house.feedBudgetKgPerDay > 0 ? ((house.feedConsumedKgToday / house.feedBudgetKgPerDay) * 100).toFixed(0) : '0';
  return (
    <div onClick={onClick} className={`bg-white rounded-xl border-2 cursor-pointer transition-all p-4 hover:shadow-md ${selected ? 'border-orange-500 shadow-md' : house.status==='critical' ? 'border-red-200' : house.status==='warning' ? 'border-amber-200' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <HStatusBadge status={house.status} />
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize">{house.type}</span>
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">{house.name}</h3>
          <p className="text-[10px] text-slate-400">{house.breed} · Age: {house.ageWeeks}wk</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="text-center bg-slate-50 rounded-lg py-2">
          <div className="text-xs font-bold text-slate-800">{house.currentBirds.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400">Birds</div>
        </div>
        <div className={`text-center rounded-lg py-2 ${house.tempC > 31 ? 'bg-red-50' : 'bg-slate-50'}`}>
          <div className={`text-xs font-bold ${house.tempC > 31 ? 'text-red-700' : 'text-slate-800'}`}>{house.tempC}°C</div>
          <div className="text-[10px] text-slate-400">Temp</div>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {house.type === 'layer' && prodRate !== null && (
          <span className={`text-[10px] px-2 py-1 rounded-lg font-medium ${parseFloat(prodRate) < 75 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
            <Egg className="w-3 h-3 inline mr-0.5" />{house.eggsToday.toLocaleString()} eggs · {prodRate}% HDA
          </span>
        )}
        <span className={`text-[10px] px-2 py-1 rounded-lg font-medium ${parseFloat(feedUtil) > 105 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
          🌾 Feed: {feedUtil}%
        </span>
        <span className={`text-[10px] px-2 py-1 rounded-lg ${parseFloat(mortality_rate) > 3 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'} font-medium`}>
          Mort: {mortality_rate}%
        </span>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function PoultryHouseDashboard() {
  const { org } = useOrg();
  const enterprises = (org?.enterprises ?? []).map(e => ({ id:e.id, name:e.name }));
  const seeds = useMemo(() => mkSeeds(enterprises), []);

  const [houses,  setHouses]  = useState<PoultryHouse[]>(() => ls(LS.HOUSES, seeds.HOUSES));
  const [eggs,    setEggs]    = useState<EggCollectionLog[]>(() => ls(LS.EGGS, seeds.EGGS));
  const [feedLog, setFeedLog] = useState<FeedRecord[]>(() => ls(LS.FEED, seeds.FEED));
  const [mort,    setMort]    = useState<MortalityRecord[]>(() => ls(LS.MORT, seeds.MORT));
  const [alerts,  setAlerts]  = useState<PoultryAlert[]>(() => ls(LS.ALERTS, seeds.ALERTS));

  const [tab, setTab]         = useState<'overview'|'climate'|'production'|'feeding'|'records'>('overview');
  const [selectedId, setSelected] = useState<string>(houses[0]?.id ?? '');

  // Modals
  const [showEggForm, setEggForm] = useState(false);
  const [eggF, setEggF] = useState({ houseId:'', count:'', brokenCount:'', notes:'' });
  const [showFeedForm, setFeedForm] = useState(false);
  const [feedF, setFeedF] = useState({ houseId:'', feedKg:'', feedType:'', notes:'' });
  const [showMortForm, setMortForm] = useState(false);
  const [mortF, setMortF] = useState({ houseId:'', count:'', avgWeightG:'', cause:'' });
  const [showAddHouse, setAddHouse] = useState(false);

  function sv<T>(key: string, setter: React.Dispatch<React.SetStateAction<T>>, val: T) { setter(val); lsSet(key, val); }

  function toggleControl(hid: string, ctrl: 'fanOn'|'heaterOn'|'lightOn') {
    const n = houses.map(h => {
      if (h.id !== hid) return h;
      const updated = { ...h, [ctrl]: !h[ctrl] };
      // Toggling fan reduces temp/CO2/NH3
      if (ctrl === 'fanOn' && updated.fanOn) {
        updated.tempC = parseFloat(Math.max(20, updated.tempC - 1.2).toFixed(1));
        updated.co2Ppm = Math.max(1000, updated.co2Ppm - 200);
        updated.nh3Ppm = Math.max(5, updated.nh3Ppm - 3);
        updated.humidityPct = Math.max(40, updated.humidityPct - 5);
      }
      // Determine status
      const isCrit = updated.tempC > 31 || updated.nh3Ppm > (updated.type==='layer'?20:25) || updated.co2Ppm > 2500;
      const isWarn = updated.tempC > 29 || updated.nh3Ppm > 15 || updated.humidityPct > 70;
      updated.status = isCrit ? 'critical' : isWarn ? 'warning' : 'good';
      return updated;
    });
    sv(LS.HOUSES, setHouses, n);
  }

  function simulateUpdate(hid: string) {
    const n = houses.map(h => {
      if (h.id !== hid) return h;
      const tempDelta = h.fanOn ? -0.3 : 0.2;
      const newTemp = parseFloat(Math.max(20, Math.min(38, h.tempC + tempDelta + (Math.random()-0.5)*0.5)).toFixed(1));
      const newHum  = parseFloat(Math.max(40, Math.min(95, h.humidityPct + (Math.random()-0.5)*2)).toFixed(0));
      const newCO2  = Math.round(Math.max(800, Math.min(3500, h.co2Ppm + (h.fanOn ? -50 : 80) + (Math.random()-0.5)*100)));
      const newNH3  = parseFloat(Math.max(2, Math.min(50, h.nh3Ppm + (h.fanOn ? -0.5 : 0.8) + (Math.random()-0.5)*1)).toFixed(1));
      const isCrit = newTemp > 31 || newNH3 > (h.type==='layer'?20:25) || newCO2 > 2500;
      const isWarn = newTemp > 29 || newNH3 > 15 || newHum > 70;
      return { ...h, tempC:newTemp, humidityPct:newHum, co2Ppm:newCO2, nh3Ppm:newNH3, status: isCrit?'critical':isWarn?'warning':h.status==='optimal'?'optimal':'good' };
    });
    sv(LS.HOUSES, setHouses, n);
  }

  function resolveAlert(id: string) {
    sv(LS.ALERTS, setAlerts, alerts.map(a => a.id===id ? {...a, resolved:true} : a));
  }

  const selected = houses.find(h => h.id === selectedId) ?? houses[0];
  const unresolved = alerts.filter(a => !a.resolved);
  const CLIMATE = selected ? (selected.type === 'layer' ? LAYER_CLIMATE : BROILER_CLIMATE) : BROILER_CLIMATE;

  const totalBirds = houses.reduce((s, h) => s + h.currentBirds, 0);
  const totalEggsToday = houses.reduce((s, h) => s + h.eggsToday, 0);
  const criticalHouses = houses.filter(h => h.status === 'critical').length;
  const avgHDA = houses.filter(h => h.type === 'layer' && h.currentBirds > 0).map(h => (h.eggsToday / h.currentBirds * 100));
  const hdaAvg = avgHDA.length > 0 ? (avgHDA.reduce((a, b) => a + b, 0) / avgHDA.length).toFixed(1) : '—';

  const TABS = [
    { id:'overview', label:'Overview' }, { id:'climate', label:'Climate & Controls' },
    { id:'production', label:'Production' }, { id:'feeding', label:'Feed & Water' },
    { id:'records', label:'Records' },
  ] as const;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-2xl">🐔</div>
          <div>
            <h1 className="text-2xl font-bold">Poultry House Dashboard</h1>
            <p className="text-orange-100 text-sm">Climate control · egg production · feeding · mortality records</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'Houses', value: houses.length },
            { label:'Total Birds', value: totalBirds.toLocaleString() },
            { label:'Eggs Today', value: totalEggsToday.toLocaleString() },
            { label:'Critical Houses', value: criticalHouses, hl: criticalHouses > 0 },
          ].map(s => (
            <div key={s.label} className={`rounded-lg p-3 ${s.hl ? 'bg-red-500/30 border border-red-400/40' : 'bg-white/10'}`}>
              <div className="text-xs text-white/70 mb-1">{s.label}</div>
              <div className="text-2xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {unresolved.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-700 font-semibold">
            <AlertTriangle className="w-4 h-4" />{unresolved.length} House Alert{unresolved.length>1?'s':''} — Action Required
          </div>
          {unresolved.map(a => (
            <div key={a.id} className="flex items-start gap-3 bg-white rounded-lg border border-red-100 px-4 py-2.5">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-800">{a.houseName}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${a.severity==='critical'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{a.severity.toUpperCase()}</span>
                </div>
                <div className="text-xs text-slate-600">{a.parameter}: <strong>{a.value} {a.unit}</strong> · {fmtTs(a.ts)}</div>
              </div>
              <button onClick={() => resolveAlert(a.id)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1 flex-shrink-0">
                <CheckCircle className="w-3 h-3" /> Resolve
              </button>
            </div>
          ))}
        </div>
      )}

      {/* House selector + tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {houses.map(h => (
          <HouseCard key={h.id} house={h} selected={selectedId===h.id} onClick={() => setSelected(h.id)} />
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${tab===t.id ? 'bg-orange-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex gap-2 flex-wrap">
          {(selected?.type==='layer'||selected?.type==='breeder') && <button onClick={() => setEggForm(v=>!v)} className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600"><Egg className="w-4 h-4" /> Collect Eggs</button>}
          <button onClick={() => setFeedForm(v=>!v)} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">🌾 Feed Record</button>
          <button onClick={() => setMortForm(v=>!v)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-700"><Skull className="w-4 h-4" /> Mortality</button>
        </div>
      </div>

      {/* Quick forms */}
      {showEggForm && (
        <form onSubmit={e => { e.preventDefault(); if(!eggF.houseId||!eggF.count) return; const ev: EggCollectionLog={id:`e-${uid()}`,houseId:eggF.houseId,count:parseInt(eggF.count),brokenCount:parseInt(eggF.brokenCount)||0,notes:eggF.notes,collectedAt:new Date().toISOString()}; sv(LS.EGGS,setEggs,[...eggs,ev]); setEggForm(false); setEggF({houseId:'',count:'',brokenCount:'',notes:''}); }} className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold">Log Egg Collection</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="block text-xs text-slate-500 mb-1">House *</label><select required value={eggF.houseId} onChange={e=>setEggF(f=>({...f,houseId:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"><option value="">Select…</option>{houses.filter(h=>h.type==='layer'||h.type==='breeder').map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
            <div><label className="block text-xs text-slate-500 mb-1">Egg Count *</label><input required type="number" value={eggF.count} onChange={e=>setEggF(f=>({...f,count:e.target.value}))} placeholder="6500" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Broken</label><input type="number" value={eggF.brokenCount} onChange={e=>setEggF(f=>({...f,brokenCount:e.target.value}))} placeholder="20" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Notes</label><input value={eggF.notes} onChange={e=>setEggF(f=>({...f,notes:e.target.value}))} placeholder="Good shells…" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 flex items-center gap-1.5"><Egg className="w-4 h-4" /> Save</button>
            <button type="button" onClick={() => setEggForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {showFeedForm && (
        <form onSubmit={e => { e.preventDefault(); if(!feedF.houseId||!feedF.feedKg) return; const fr: FeedRecord={id:`fr-${uid()}`,houseId:feedF.houseId,feedKg:parseFloat(feedF.feedKg),feedType:feedF.feedType||'Layer Mash',notes:feedF.notes,recordedAt:new Date().toISOString()}; sv(LS.FEED,setFeedLog,[...feedLog,fr]); setFeedForm(false); setFeedF({houseId:'',feedKg:'',feedType:'',notes:''}); }} className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold">Log Feed</h3>
          <div className="grid grid-cols-4 gap-3">
            <div><label className="block text-xs text-slate-500 mb-1">House *</label><select required value={feedF.houseId} onChange={e=>setFeedF(f=>({...f,houseId:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"><option value="">Select…</option>{houses.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
            <div><label className="block text-xs text-slate-500 mb-1">Feed (kg) *</label><input required type="number" value={feedF.feedKg} onChange={e=>setFeedF(f=>({...f,feedKg:e.target.value}))} placeholder="800" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Feed Type</label><input value={feedF.feedType} onChange={e=>setFeedF(f=>({...f,feedType:e.target.value}))} placeholder="Layer Mash 16%" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Notes</label><input value={feedF.notes} onChange={e=>setFeedF(f=>({...f,notes:e.target.value}))} placeholder="Afternoon allocation" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Save</button>
            <button type="button" onClick={() => setFeedForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {showMortForm && (
        <form onSubmit={e => { e.preventDefault(); if(!mortF.houseId||!mortF.count) return; const m: MortalityRecord={id:`m-${uid()}`,houseId:mortF.houseId,count:parseInt(mortF.count),avgWeightG:parseInt(mortF.avgWeightG)||0,cause:mortF.cause,loggedAt:new Date().toISOString()}; sv(LS.MORT,setMort,[...mort,m]); setMortForm(false); setMortF({houseId:'',count:'',avgWeightG:'',cause:''}); }} className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold">Log Mortality</h3>
          <div className="grid grid-cols-4 gap-3">
            <div><label className="block text-xs text-slate-500 mb-1">House *</label><select required value={mortF.houseId} onChange={e=>setMortF(f=>({...f,houseId:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"><option value="">Select…</option>{houses.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
            <div><label className="block text-xs text-slate-500 mb-1">Count *</label><input required type="number" value={mortF.count} onChange={e=>setMortF(f=>({...f,count:e.target.value}))} placeholder="5" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Avg Weight (g)</label><input type="number" value={mortF.avgWeightG} onChange={e=>setMortF(f=>({...f,avgWeightG:e.target.value}))} placeholder="1800" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Cause</label><input value={mortF.cause} onChange={e=>setMortF(f=>({...f,cause:e.target.value}))} placeholder="Heat stress / unknown" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Log</button>
            <button type="button" onClick={() => setMortForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* OVERVIEW */}
      {tab === 'overview' && selected && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:'Current Birds', value: selected.currentBirds.toLocaleString(), sub: `of ${selected.capacity.toLocaleString()} capacity`, icon:'🐔' },
              { label:'Mortality Rate', value: `${((selected.mortalityThisCycle/(selected.currentBirds+selected.mortalityThisCycle))*100).toFixed(1)}%`, sub:`${selected.mortalityThisCycle} total losses`, icon:'📊', warn: selected.mortalityThisCycle/(selected.currentBirds+selected.mortalityThisCycle) > 0.04 },
              ...(selected.type === 'layer' ? [
                { label:'Eggs Today', value:selected.eggsToday.toLocaleString(), sub:`${((selected.eggsToday/selected.currentBirds)*100).toFixed(1)}% HDA`, icon:'🥚' },
                { label:'Eggs This Week', value:selected.eggsThisWeek.toLocaleString(), sub:`${Math.round(selected.eggsThisWeek/7)} avg/day`, icon:'📦' },
              ] : [
                { label:'Live Weight', value:`${(selected.currentBirds * 2.1 / 1000).toFixed(0)} t`, sub:`~2.1kg avg at ${selected.ageWeeks}wk`, icon:'⚖️' },
                { label:'FCR (est.)', value:'1.85', sub:'Target: < 1.90', icon:'📊' },
              ]),
            ].map((s: any) => (
              <div key={s.label} className={`bg-white rounded-xl border p-4 ${s.warn ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-xs text-slate-400 mb-1">{s.label}</div>
                <div className={`text-xl font-bold ${s.warn ? 'text-red-700' : 'text-slate-800'}`}>{s.value}</div>
                <div className="text-[11px] text-slate-400">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Climate summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-slate-800">Climate — {selected.name}</h3>
              <button onClick={() => simulateUpdate(selected.id)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(CLIMATE).map(([key, cfg]) => {
                const val = (selected as any)[key] as number;
                const st = climateStatus(val, cfg);
                return <ClimateCard key={key} label={cfg.label} value={val} unit={cfg.unit} status={st} target={cfg.target} icon={cfg.icon} />;
              })}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="font-semibold text-sm text-slate-800 mb-3">House Controls — {selected.name}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {([['fanOn','Fan / Ventilation','💨'], ['heaterOn','Heater','🔥'], ['lightOn','Lighting','💡']] as const).map(([ctrl, label, emoji]) => (
                <div key={ctrl} className="border border-slate-200 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">{emoji}</div>
                  <div className="text-xs text-slate-500 mb-2">{label}</div>
                  <button onClick={() => toggleControl(selected.id, ctrl)}
                    className={`w-full py-1.5 rounded-lg text-sm font-medium transition-colors ${selected[ctrl] ? 'bg-orange-500 text-white hover:bg-orange-600' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    {selected[ctrl] ? 'ON' : 'OFF'}
                  </button>
                </div>
              ))}
              {/* Ventilation slider */}
              <div className="border border-slate-200 rounded-xl p-4">
                <div className="text-2xl mb-1">🌀</div>
                <div className="text-xs text-slate-500 mb-2">Ventilation</div>
                <div className="flex items-center gap-2">
                  <input type="range" min="0" max="100" value={selected.ventilationPct}
                    onChange={e => {
                      const v = parseInt(e.target.value);
                      const n = houses.map(h => h.id===selected.id ? {...h, ventilationPct:v} : h);
                      sv(LS.HOUSES, setHouses, n);
                    }}
                    className="flex-1 accent-orange-500" />
                  <span className="text-sm font-bold text-slate-700 w-8 text-right">{selected.ventilationPct}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLIMATE tab */}
      {tab === 'climate' && (
        <div className="space-y-5">
          {houses.map(h => {
            const climate = h.type === 'layer' ? LAYER_CLIMATE : BROILER_CLIMATE;
            return (
              <div key={h.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <HStatusBadge status={h.status} />
                    <h3 className="font-semibold text-slate-800">{h.name}</h3>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {([['fanOn','Fan','💨'], ['heaterOn','Heat','🔥'], ['lightOn','Light','💡']] as const).map(([ctrl,label,emoji]) => (
                      <button key={ctrl} onClick={() => toggleControl(h.id, ctrl)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors ${h[ctrl] ? 'bg-orange-500 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        {emoji} {label}: {h[ctrl] ? 'ON' : 'OFF'}
                      </button>
                    ))}
                    <button onClick={() => simulateUpdate(h.id)} className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(climate).map(([key, cfg]) => {
                    const val = (h as any)[key] as number;
                    return <ClimateCard key={key} label={cfg.label} value={val} unit={cfg.unit} status={climateStatus(val, cfg)} target={cfg.target} icon={cfg.icon} />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PRODUCTION tab */}
      {tab === 'production' && (
        <div className="space-y-5">
          {/* Egg collection records */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Egg className="w-4 h-4 text-yellow-500" /> Egg Collection Log</h3>
                <div className="text-sm text-slate-500">
                  Today: <strong className="text-slate-800">{totalEggsToday.toLocaleString()}</strong> eggs ·
                  Avg HDA: <strong className="text-slate-800">{hdaAvg}%</strong>
                </div>
              </div>
            </div>
            {eggs.length === 0 ? <div className="px-5 py-8 text-slate-400 text-sm text-center">No egg records yet.</div> : (
              [...eggs].sort((a,b)=>new Date(b.collectedAt).getTime()-new Date(a.collectedAt).getTime()).map(e => {
                const h = houses.find(x=>x.id===e.houseId);
                const brokenPct = e.count > 0 ? ((e.brokenCount/e.count)*100).toFixed(1) : '0';
                return (
                  <div key={e.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0">
                    <Egg className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-800">{h?.name ?? 'Unknown'}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                        <span><strong>{e.count.toLocaleString()}</strong> eggs</span>
                        {e.brokenCount > 0 && <span className="text-red-500">{e.brokenCount} broken ({brokenPct}%)</span>}
                        {e.notes && <span>{e.notes}</span>}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">{fmtTs(e.collectedAt)}</div>
                  </div>
                );
              })
            )}
          </div>

          {/* HDA per house */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Hen Day Average (HDA) — Layer Houses</h3>
            {houses.filter(h=>h.type==='layer').map(h => {
              const hda = h.currentBirds > 0 ? ((h.eggsToday/h.currentBirds)*100) : 0;
              const bar = Math.min(100, hda);
              const color = hda >= 85 ? 'bg-green-500' : hda >= 75 ? 'bg-amber-400' : 'bg-red-500';
              return (
                <div key={h.id} className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{h.name}</span>
                    <span className={`font-bold ${hda < 75 ? 'text-red-600' : hda < 85 ? 'text-amber-600' : 'text-green-600'}`}>{hda.toFixed(1)}% HDA</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div className={`h-3 rounded-full transition-all ${color}`} style={{ width:`${bar}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-0.5">
                    <span>0%</span><span>75%</span><span>85%</span><span>100%</span>
                  </div>
                </div>
              );
            })}
            {houses.filter(h=>h.type==='layer').length === 0 && <div className="text-slate-400 text-sm py-4 text-center">No layer houses.</div>}
          </div>
        </div>
      )}

      {/* FEEDING tab */}
      {tab === 'feeding' && (
        <div className="space-y-4">
          {/* Feed utilization */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {houses.map(h => {
              const util = h.feedBudgetKgPerDay > 0 ? (h.feedConsumedKgToday / h.feedBudgetKgPerDay * 100) : 0;
              const overBudget = util > 105;
              return (
                <div key={h.id} className={`bg-white border rounded-xl p-4 ${overBudget ? 'border-amber-200 bg-amber-50' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-slate-800 truncate mr-2">{h.name.split(' — ')[0]}</div>
                    <span className={`text-xs font-bold ${overBudget?'text-amber-700':'text-green-700'}`}>{util.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-end justify-between text-xs text-slate-500 mb-2">
                    <span>{h.feedConsumedKgToday} kg consumed</span>
                    <span>budget: {h.feedBudgetKgPerDay} kg</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${overBudget ? 'bg-amber-400' : 'bg-green-500'}`} style={{ width:`${Math.min(100, util)}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-slate-500">
                    <span>💧 Water: {h.waterLitresToday}L / {h.waterBudgetLPerDay}L</span>
                    <span>{((h.waterLitresToday/h.waterBudgetLPerDay)*100).toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feed log */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 font-semibold text-sm text-slate-800">Feed Records</div>
            {feedLog.length === 0 ? <div className="px-5 py-8 text-slate-400 text-sm text-center">No feed records.</div> : (
              [...feedLog].sort((a,b)=>new Date(b.recordedAt).getTime()-new Date(a.recordedAt).getTime()).map(f => {
                const h = houses.find(x=>x.id===f.houseId);
                return (
                  <div key={f.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0">
                    <span className="text-lg flex-shrink-0">🌾</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-800">{h?.name ?? 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{f.feedKg} kg · {f.feedType}{f.notes ? ` · ${f.notes}` : ''}</div>
                    </div>
                    <div className="text-xs text-slate-400 flex-shrink-0">{fmtTs(f.recordedAt)}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* RECORDS tab */}
      {tab === 'records' && (
        <div className="space-y-4">
          {/* Mortality records */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Skull className="w-4 h-4 text-slate-500" /> Mortality Records</h3>
                <div className="text-sm text-slate-500">
                  Today: <strong>{mort.filter(m=>new Date(m.loggedAt).toDateString()===new Date().toDateString()).reduce((s,m)=>s+m.count,0)}</strong> birds
                </div>
              </div>
            </div>
            {mort.length === 0 ? <div className="px-5 py-8 text-slate-400 text-sm text-center">No mortality records.</div> : (
              [...mort].sort((a,b)=>new Date(b.loggedAt).getTime()-new Date(a.loggedAt).getTime()).map(m => {
                const h = houses.find(x=>x.id===m.houseId);
                return (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0">
                    <Skull className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-800">{h?.name ?? 'Unknown'}</div>
                      <div className="text-xs text-slate-500">
                        {m.count} birds{m.avgWeightG > 0 ? ` · avg ${m.avgWeightG}g · ${(m.count*m.avgWeightG/1000).toFixed(2)}kg lost` : ''} · {m.cause||'Cause unknown'}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 flex-shrink-0">{fmtTs(m.loggedAt)}</div>
                  </div>
                );
              })
            )}
          </div>

          {/* Per-house cumulative */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Mortality Summary by House</h3>
            <div className="space-y-3">
              {houses.map(h => {
                const mortRate = ((h.mortalityThisCycle / (h.currentBirds + h.mortalityThisCycle)) * 100);
                const acceptable = h.type === 'broiler' ? 4 : 2;
                const overLimit = mortRate > acceptable;
                return (
                  <div key={h.id} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="text-slate-700 truncate">{h.name}</span>
                        <span className={`font-bold ml-2 flex-shrink-0 ${overLimit ? 'text-red-600' : 'text-green-600'}`}>{mortRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${overLimit ? 'bg-red-500' : 'bg-green-500'}`} style={{ width:`${Math.min(100, mortRate*10)}%` }} />
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 flex-shrink-0 w-24 text-right">{h.mortalityThisCycle} of {(h.currentBirds+h.mortalityThisCycle).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
