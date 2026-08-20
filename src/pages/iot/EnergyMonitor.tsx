/**
 * Energy Monitor — Solar · Battery · Generator · Grid · Cost Analytics
 * Fully localStorage-based; no backend required.
 */
import React, { useState, useMemo } from 'react';
import {
  Zap, Sun, Battery, Fuel, Activity, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, Plus, X, RefreshCw, BarChart3,
  Thermometer, DollarSign, Settings2, Clock, Wind, Power,
} from 'lucide-react';
import { useOrg } from '@/store/orgStore';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SolarArray {
  id: string;
  name: string;
  enterpriseId: string;
  capacityKwp: number;         // peak capacity
  currentOutputKw: number;
  todayKwh: number;
  thisMonthKwh: number;
  panelCount: number;
  tiltDeg: number;
  azimuthDeg: number;
  efficiency: number;          // 0-1
  tempC: number;               // panel temp
  irradianceWm2: number;
  status: 'generating' | 'idle' | 'fault';
  addedAt: string;
}

interface BatteryBank {
  id: string;
  name: string;
  enterpriseId: string;
  capacityKwh: number;
  currentKwh: number;
  socPct: number;              // state of charge
  chargingKw: number;
  dischargingKw: number;
  cycleCount: number;
  tempC: number;
  chemistry: 'lithium_ion' | 'lifepo4' | 'lead_acid' | 'gel';
  status: 'charging' | 'discharging' | 'idle' | 'fault';
  addedAt: string;
}

interface Generator {
  id: string;
  name: string;
  enterpriseId: string;
  capacityKw: number;
  currentOutputKw: number;
  fuelType: 'diesel' | 'petrol' | 'gas' | 'biogas';
  fuelTankL: number;
  fuelUsedTodayL: number;
  fuelLevelPct: number;
  runtimeHoursTotal: number;
  runtimeHoursToday: number;
  lastServiceHrs: number;
  status: 'running' | 'standby' | 'fault' | 'off';
  addedAt: string;
}

interface EnergyLoad {
  id: string;
  name: string;
  category: 'irrigation' | 'poultry' | 'aquaculture' | 'processing' | 'cold_chain' | 'office' | 'lighting' | 'other';
  currentKw: number;
  todayKwh: number;
  priority: 'critical' | 'high' | 'low';
}

interface EnergyAlert {
  id: string;
  type: string;
  message: string;
  severity: 'warning' | 'critical';
  ts: string;
  resolved: boolean;
}

interface DailyEnergy {
  date: string;
  solarKwh: number;
  genKwh: number;
  gridKwh: number;
  consumedKwh: number;
  costUSD: number;
}

// ─── localStorage ──────────────────────────────────────────────────────────────
const LS = {
  SOLAR:  'agronexus_v2_em_solar',
  BATT:   'agronexus_v2_em_battery',
  GEN:    'agronexus_v2_em_generator',
  LOADS:  'agronexus_v2_em_loads',
  ALERTS: 'agronexus_v2_em_alerts',
  DAILY:  'agronexus_v2_em_daily',
};

// ─── Seed data ─────────────────────────────────────────────────────────────────

function mkSeeds(enterprises: {id:string}[]) {
  const eid = enterprises[0]?.id ?? '';

  const SOLAR: SolarArray[] = [
    { id:'sol-1', name:'Main Farm Array — Rooftop', enterpriseId:eid, capacityKwp:50, currentOutputKw:38.4, todayKwh:142, thisMonthKwh:3850, panelCount:200, tiltDeg:15, azimuthDeg:180, efficiency:0.91, tempC:48, irradianceWm2:820, status:'generating', addedAt:new Date().toISOString() },
    { id:'sol-2', name:'Poultry House Array', enterpriseId:eid, capacityKwp:30, currentOutputKw:22.1, todayKwh:84, thisMonthKwh:2300, panelCount:120, tiltDeg:10, azimuthDeg:175, efficiency:0.89, tempC:51, irradianceWm2:790, status:'generating', addedAt:new Date().toISOString() },
    { id:'sol-3', name:'Processing Unit Array', enterpriseId:eid, capacityKwp:20, currentOutputKw:0, todayKwh:56, thisMonthKwh:1450, panelCount:80, tiltDeg:12, azimuthDeg:185, efficiency:0, tempC:32, irradianceWm2:0, status:'idle', addedAt:new Date().toISOString() },
  ];

  const BATT: BatteryBank[] = [
    { id:'bat-1', name:'Main LFP Bank — 200kWh', enterpriseId:eid, capacityKwh:200, currentKwh:152, socPct:76, chargingKw:12.5, dischargingKw:0, cycleCount:312, tempC:28, chemistry:'lifepo4', status:'charging', addedAt:new Date().toISOString() },
    { id:'bat-2', name:'Backup Gel Bank — 48kWh', enterpriseId:eid, capacityKwh:48, currentKwh:14, socPct:29, chargingKw:0, dischargingKw:4.2, cycleCount:890, tempC:31, chemistry:'gel', status:'discharging', addedAt:new Date().toISOString() },
  ];

  const GEN: Generator[] = [
    { id:'gen-1', name:'Diesel Genset 60kVA', enterpriseId:eid, capacityKw:48, currentOutputKw:0, fuelType:'diesel', fuelTankL:500, fuelUsedTodayL:0, fuelLevelPct:68, runtimeHoursTotal:4218, runtimeHoursToday:0, lastServiceHrs:4000, status:'standby', addedAt:new Date().toISOString() },
    { id:'gen-2', name:'Backup Petrol Generator 10kVA', enterpriseId:eid, capacityKw:8, currentOutputKw:0, fuelType:'petrol', fuelTankL:80, fuelUsedTodayL:0, fuelLevelPct:45, runtimeHoursTotal:620, runtimeHoursToday:0, lastServiceHrs:500, status:'off', addedAt:new Date().toISOString() },
  ];

  const LOADS: EnergyLoad[] = [
    { id:'l-1', name:'Poultry House Fans & Heating',   category:'poultry',      currentKw:18.5, todayKwh:185, priority:'critical' },
    { id:'l-2', name:'Irrigation Pumps',               category:'irrigation',   currentKw:12.0, todayKwh:48,  priority:'high' },
    { id:'l-3', name:'Aquaculture Aerators',           category:'aquaculture',  currentKw:6.4,  todayKwh:77,  priority:'critical' },
    { id:'l-4', name:'Feed Processing Mill',           category:'processing',   currentKw:22.0, todayKwh:88,  priority:'high' },
    { id:'l-5', name:'Cold Storage Rooms',             category:'cold_chain',   currentKw:8.5,  todayKwh:102, priority:'critical' },
    { id:'l-6', name:'Office & Admin',                 category:'office',       currentKw:1.8,  todayKwh:18,  priority:'low' },
    { id:'l-7', name:'Security & Lighting',            category:'lighting',     currentKw:2.1,  todayKwh:25,  priority:'high' },
  ];

  const ALERTS: EnergyAlert[] = [
    { id:'ea-1', type:'Battery Low', message:'Backup Gel Bank at 29% SOC — charging suspended', severity:'warning', ts:new Date(Date.now()-2*3600000).toISOString(), resolved:false },
    { id:'ea-2', type:'Generator Service', message:'Diesel Genset 60kVA due for service (218 hrs overdue)', severity:'warning', ts:new Date(Date.now()-86400000).toISOString(), resolved:false },
  ];

  // 30-day history
  const DAILY: DailyEnergy[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    const s = 150 + Math.random() * 80;
    const g = Math.random() > 0.8 ? 30 + Math.random() * 60 : 0;
    const c = 220 + Math.random() * 60;
    const grid = Math.max(0, c - s - g);
    return {
      date: d.toISOString().slice(0, 10),
      solarKwh: parseFloat(s.toFixed(1)),
      genKwh: parseFloat(g.toFixed(1)),
      gridKwh: parseFloat(grid.toFixed(1)),
      consumedKwh: parseFloat(c.toFixed(1)),
      costUSD: parseFloat((grid * 0.12 + g * 0.35).toFixed(2)),
    };
  });

  return { SOLAR, BATT, GEN, LOADS, ALERTS, DAILY };
}

// ─── Utilities ─────────────────────────────────────────────────────────────────
function ls<T>(key: string, def: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : def; } catch { return def; }
}
function lsSet<T>(key: string, v: T) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }

function fmtTs(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

const CAT_COLOR: Record<string, string> = {
  poultry: 'bg-orange-400', irrigation: 'bg-blue-400', aquaculture: 'bg-cyan-400',
  processing: 'bg-purple-400', cold_chain: 'bg-indigo-400', office: 'bg-slate-300', lighting: 'bg-yellow-400',
};

const CHEM_LABEL: Record<string, string> = { lithium_ion:'Li-Ion', lifepo4:'LiFePO₄', lead_acid:'Lead-Acid', gel:'Gel' };

// ─── Battery ring ──────────────────────────────────────────────────────────────
function BatteryRing({ soc, size = 80 }: { soc: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const fill = circ * (soc / 100);
  const color = soc < 20 ? '#ef4444' : soc < 40 ? '#f59e0b' : '#22c55e';
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={10} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize={size > 60 ? 16 : 12} fontWeight="bold" fill={color}>{soc}%</text>
    </svg>
  );
}

// ─── Mini bar chart (30-day) ───────────────────────────────────────────────────
function MiniBarChart({ data, color = '#22c55e', label }: { data: number[]; color?: string; label: string }) {
  const max = Math.max(...data, 1);
  const W = 320, H = 60, barW = Math.floor(W / data.length) - 1;
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1 font-medium">{label}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 60 }}>
        {data.map((v, i) => {
          const bh = Math.max(2, (v / max) * (H - 4));
          return <rect key={i} x={i * (barW + 1)} y={H - bh} width={barW} height={bh} fill={color} rx={1} opacity={0.8} />;
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
        <span>30 days ago</span><span>Today</span>
      </div>
    </div>
  );
}

// ─── Flow diagram ──────────────────────────────────────────────────────────────
function EnergyFlowDiagram({ solarKw, battSocPct, battKw, genKw, loadKw, gridKw }: {
  solarKw: number; battSocPct: number; battKw: number; genKw: number; loadKw: number; gridKw: number;
}) {
  const netFlow = solarKw + genKw - loadKw;
  const surplus = netFlow > 0;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="font-semibold text-slate-800 mb-4 text-sm">Live Energy Flow</h3>
      <div className="flex items-center justify-center gap-0 overflow-x-auto">
        {/* Sources */}
        <div className="flex flex-col gap-3 flex-shrink-0">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-center w-28">
            <Sun className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
            <div className="text-xs font-bold text-yellow-700">{solarKw.toFixed(1)} kW</div>
            <div className="text-[10px] text-yellow-500">Solar</div>
          </div>
          <div className={`border rounded-xl px-4 py-3 text-center w-28 ${genKw > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
            <Fuel className="w-5 h-5 mx-auto mb-1 text-slate-400" />
            <div className="text-xs font-bold text-slate-700">{genKw.toFixed(1)} kW</div>
            <div className="text-[10px] text-slate-400">Generator</div>
          </div>
        </div>

        {/* Arrow to hub */}
        <div className="flex-1 flex items-center justify-center px-2">
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-12 h-0.5 bg-yellow-400" />
            <div className="w-12 h-0.5 bg-slate-300" />
          </div>
        </div>

        {/* Hub */}
        <div className="bg-slate-800 text-white rounded-xl px-5 py-4 text-center flex-shrink-0 w-28">
          <Zap className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
          <div className="text-[10px] text-slate-300">Energy Hub</div>
          <div className="text-xs font-bold mt-1">{(solarKw + genKw).toFixed(1)} kW in</div>
        </div>

        {/* Arrow to loads/battery */}
        <div className="flex-1 flex flex-col items-center gap-2 px-2">
          <div className="w-12 h-0.5 bg-green-400" />
          <div className={`w-12 h-0.5 ${surplus ? 'bg-blue-400' : 'bg-orange-400'}`} />
        </div>

        {/* Sinks */}
        <div className="flex flex-col gap-3 flex-shrink-0">
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center w-28">
            <Power className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="text-xs font-bold text-green-700">{loadKw.toFixed(1)} kW</div>
            <div className="text-[10px] text-green-500">Farm Load</div>
          </div>
          <div className={`border rounded-xl px-4 py-3 text-center w-28 ${battSocPct < 30 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
            <Battery className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <div className="text-xs font-bold text-blue-700">{battSocPct}%</div>
            <div className="text-[10px] text-blue-400">{battKw > 0 ? `+${battKw}kW` : battKw < 0 ? `${battKw}kW` : 'Idle'}</div>
          </div>
        </div>
      </div>
      {surplus && (
        <div className="mt-3 text-center text-xs text-green-600 bg-green-50 rounded-lg py-2">
          ✅ Surplus {netFlow.toFixed(1)} kW — battery charging
        </div>
      )}
      {!surplus && loadKw > 0 && (
        <div className="mt-3 text-center text-xs text-amber-600 bg-amber-50 rounded-lg py-2">
          ⚡ Drawing {Math.abs(netFlow).toFixed(1)} kW from battery / grid
        </div>
      )}
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────

export default function EnergyMonitor() {
  const { org } = useOrg();
  const enterprises = (org?.enterprises ?? []).map(e => ({ id: e.id, name: e.name }));
  const seeds = useMemo(() => mkSeeds(enterprises), []);

  const [solar,   setSolar]   = useState<SolarArray[]>(() => ls(LS.SOLAR, seeds.SOLAR));
  const [batt,    setBatt]    = useState<BatteryBank[]>(() => ls(LS.BATT, seeds.BATT));
  const [gen,     setGen]     = useState<Generator[]>(() => ls(LS.GEN, seeds.GEN));
  const [loads,   setLoads]   = useState<EnergyLoad[]>(() => ls(LS.LOADS, seeds.LOADS));
  const [alerts,  setAlerts]  = useState<EnergyAlert[]>(() => ls(LS.ALERTS, seeds.ALERTS));
  const [daily,   setDaily]   = useState<DailyEnergy[]>(() => ls(LS.DAILY, seeds.DAILY));

  const [tab, setTab] = useState<'overview'|'solar'|'battery'|'generator'|'loads'|'analytics'>('overview');

  function sv<T>(key: string, setter: React.Dispatch<React.SetStateAction<T>>, val: T) { setter(val); lsSet(key, val); }

  function toggleGenerator(id: string) {
    const n = gen.map(g => {
      if (g.id !== id) return g;
      const running = g.status !== 'running';
      return { ...g, status: running ? 'running' as const : 'standby' as const, currentOutputKw: running ? g.capacityKw * 0.75 : 0 };
    });
    sv(LS.GEN, setGen, n);
  }

  function simulateRefresh() {
    setSolar(prev => {
      const n = prev.map(s => ({
        ...s,
        currentOutputKw: s.status === 'fault' ? 0 : parseFloat(Math.max(0, Math.min(s.capacityKwp, s.currentOutputKw + (Math.random() - 0.5) * 3)).toFixed(1)),
        todayKwh: parseFloat((s.todayKwh + s.currentOutputKw * 0.05).toFixed(1)),
        efficiency: parseFloat(Math.max(0.7, Math.min(0.98, s.efficiency + (Math.random()-0.5)*0.02)).toFixed(2)),
      }));
      lsSet(LS.SOLAR, n);
      return n;
    });
    setBatt(prev => {
      const n = prev.map(b => {
        const newSoc = parseFloat(Math.max(0, Math.min(100, b.socPct + (b.chargingKw - b.dischargingKw) * 0.5)).toFixed(0));
        return { ...b, socPct: newSoc, currentKwh: parseFloat((b.capacityKwh * newSoc / 100).toFixed(1)) };
      });
      lsSet(LS.BATT, n);
      return n;
    });
  }

  function resolveAlert(id: string) {
    sv(LS.ALERTS, setAlerts, alerts.map(a => a.id === id ? { ...a, resolved: true } : a));
  }

  // Aggregates
  const totalSolarKw   = solar.reduce((s, x) => s + x.currentOutputKw, 0);
  const totalSolarToday = solar.reduce((s, x) => s + x.todayKwh, 0);
  const totalBattSoc   = batt.length > 0 ? Math.round(batt.reduce((s, x) => s + x.socPct, 0) / batt.length) : 0;
  const totalBattKwh   = batt.reduce((s, x) => s + x.currentKwh, 0);
  const totalBattCap   = batt.reduce((s, x) => s + x.capacityKwh, 0);
  const totalBattKw    = batt.reduce((s, x) => s + x.chargingKw - x.dischargingKw, 0);
  const totalGenKw     = gen.reduce((s, x) => s + x.currentOutputKw, 0);
  const totalLoadKw    = loads.reduce((s, x) => s + x.currentKw, 0);
  const totalLoadToday = loads.reduce((s, x) => s + x.todayKwh, 0);
  const selfSuffPct    = totalLoadKw > 0 ? Math.min(100, Math.round((totalSolarKw + totalGenKw) / totalLoadKw * 100)) : 0;

  const unresolved = alerts.filter(a => !a.resolved);
  const today = daily[daily.length - 1] ?? { solarKwh: 0, genKwh: 0, gridKwh: 0, consumedKwh: 0, costUSD: 0 };
  const monthCost = daily.reduce((s, d) => s + d.costUSD, 0);
  const monthSolar = daily.reduce((s, d) => s + d.solarKwh, 0);

  const TABS = [
    { id:'overview', label:'Overview' }, { id:'solar', label:'Solar Arrays' },
    { id:'battery', label:'Battery Banks' }, { id:'generator', label:'Generators' },
    { id:'loads', label:'Load Map' }, { id:'analytics', label:'Analytics' },
  ] as const;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Energy Monitor</h1>
            <p className="text-yellow-100 text-sm">Solar · Battery · Generator · Load analytics · Cost per kg</p>
          </div>
          <button onClick={simulateRefresh} className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label:'Solar Output', value:`${totalSolarKw.toFixed(1)} kW`, sub:`${totalSolarToday.toFixed(0)} kWh today` },
            { label:'Battery SOC', value:`${totalBattSoc}%`, sub:`${totalBattKwh.toFixed(0)}/${totalBattCap} kWh` },
            { label:'Generator', value: totalGenKw > 0 ? `${totalGenKw.toFixed(0)} kW` : 'Standby', sub:gen.filter(g=>g.status==='running').length > 0 ? 'Running' : 'Off' },
            { label:'Farm Load', value:`${totalLoadKw.toFixed(1)} kW`, sub:`${totalLoadToday.toFixed(0)} kWh today` },
            { label:'Self-Sufficiency', value:`${selfSuffPct}%`, sub:`Solar + Gen vs load`, hl: selfSuffPct < 50 },
          ].map(s => (
            <div key={s.label} className={`rounded-lg p-3 ${(s as any).hl ? 'bg-red-500/30' : 'bg-white/10'}`}>
              <div className="text-xs text-white/70 mb-1">{s.label}</div>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-[11px] text-white/60">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {unresolved.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-700 font-semibold">
            <AlertTriangle className="w-4 h-4" /> {unresolved.length} Energy Alert{unresolved.length > 1 ? 's' : ''}
          </div>
          {unresolved.map(a => (
            <div key={a.id} className="flex items-center gap-3 bg-white rounded-lg border border-amber-100 px-4 py-2.5">
              <div className="flex-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold mr-2 ${a.severity==='critical'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{a.type}</span>
                <span className="text-sm text-slate-700">{a.message}</span>
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0">{fmtTs(a.ts)}</span>
              <button onClick={() => resolveAlert(a.id)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1 flex-shrink-0"><CheckCircle className="w-3 h-3" /> OK</button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${tab===t.id ? 'bg-yellow-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-5">
          <EnergyFlowDiagram
            solarKw={totalSolarKw} battSocPct={totalBattSoc}
            battKw={parseFloat(totalBattKw.toFixed(1))}
            genKw={totalGenKw} loadKw={totalLoadKw} gridKw={0}
          />

          {/* Today summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:"Today's Solar", value:`${today.solarKwh} kWh`, icon:<Sun className="w-5 h-5 text-yellow-500" />, color:'yellow' },
              { label:"Today's Gen", value:`${today.genKwh} kWh`, icon:<Fuel className="w-5 h-5 text-red-400" />, color:'red' },
              { label:"Consumed Today", value:`${today.consumedKwh} kWh`, icon:<Zap className="w-5 h-5 text-blue-500" />, color:'blue' },
              { label:"Energy Cost Today", value:`$${today.costUSD.toFixed(2)}`, icon:<DollarSign className="w-5 h-5 text-green-600" />, color:'green' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3 items-center">
                <div className="flex-shrink-0">{s.icon}</div>
                <div>
                  <div className="text-xs text-slate-400">{s.label}</div>
                  <div className="text-lg font-bold text-slate-800">{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Battery SOC summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm">Battery Banks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batt.map(b => (
                <div key={b.id} className={`border rounded-xl p-4 flex items-center gap-4 ${b.socPct < 20 ? 'border-red-200 bg-red-50' : b.socPct < 40 ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
                  <BatteryRing soc={b.socPct} size={70} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 text-sm">{b.name}</div>
                    <div className="text-xs text-slate-500">{CHEM_LABEL[b.chemistry]} · {b.cycleCount} cycles</div>
                    <div className="text-xs text-slate-500 mt-1">{b.currentKwh.toFixed(0)} / {b.capacityKwh} kWh</div>
                    <div className={`text-xs font-medium mt-1 ${b.status==='charging'?'text-green-600':b.status==='discharging'?'text-orange-600':'text-slate-400'}`}>
                      {b.status === 'charging' ? `⬆ Charging +${b.chargingKw} kW` : b.status === 'discharging' ? `⬇ Discharging −${b.dischargingKw} kW` : 'Idle'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SOLAR */}
      {tab === 'solar' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {solar.map(s => (
              <div key={s.id} className={`bg-white border rounded-xl p-5 ${s.status==='fault'?'border-red-200':s.status==='generating'?'border-yellow-200':'border-slate-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${s.status==='generating'?'bg-yellow-100 text-yellow-700':s.status==='idle'?'bg-slate-100 text-slate-500':'bg-red-100 text-red-700'}`}>{s.status.toUpperCase()}</span>
                    </div>
                    <div className="font-semibold text-slate-800 text-sm">{s.name}</div>
                    <div className="text-xs text-slate-400">{s.panelCount} panels · {s.capacityKwp} kWp</div>
                  </div>
                  <Sun className={`w-6 h-6 flex-shrink-0 ${s.status==='generating'?'text-yellow-400':'text-slate-300'}`} />
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-500">Current output</span>
                      <span className="font-bold text-slate-800">{s.currentOutputKw} / {s.capacityKwp} kW</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-yellow-400" style={{ width:`${(s.currentOutputKw/s.capacityKwp)*100}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mt-2">
                    {[
                      { label:'Today', value:`${s.todayKwh} kWh` },
                      { label:'Efficiency', value:`${(s.efficiency*100).toFixed(0)}%` },
                      { label:'Irradiance', value:`${s.irradianceWm2} W/m²` },
                    ].map(x => (
                      <div key={x.label} className="bg-slate-50 rounded-lg py-2">
                        <div className="text-xs font-bold text-slate-800">{x.value}</div>
                        <div className="text-[10px] text-slate-400">{x.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-400 flex gap-3 mt-1">
                    <span>Panel temp: {s.tempC}°C</span>
                    <span>Tilt: {s.tiltDeg}°</span>
                    <span>Month: {s.thisMonthKwh} kWh</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BATTERY */}
      {tab === 'battery' && (
        <div className="space-y-4">
          {batt.map(b => (
            <div key={b.id} className={`bg-white border rounded-xl p-5 ${b.socPct < 20 ? 'border-red-200' : 'border-slate-200'}`}>
              <div className="flex items-center gap-5 flex-wrap">
                <BatteryRing soc={b.socPct} size={90} />
                <div className="flex-1 min-w-48">
                  <div className="font-semibold text-slate-800">{b.name}</div>
                  <div className="text-xs text-slate-400 mb-3">{CHEM_LABEL[b.chemistry]} · {b.cycleCount} charge cycles · {b.tempC}°C</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label:'Capacity', value:`${b.capacityKwh} kWh` },
                      { label:'Available', value:`${b.currentKwh.toFixed(0)} kWh` },
                      { label:'Charge rate', value:`${b.chargingKw} kW` },
                      { label:'Discharge', value:`${b.dischargingKw} kW` },
                    ].map(x => (
                      <div key={x.label} className="bg-slate-50 rounded-lg p-3 text-center">
                        <div className="text-sm font-bold text-slate-800">{x.value}</div>
                        <div className="text-[11px] text-slate-400">{x.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">State of Charge</span><span className="font-bold">{b.socPct}%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div className={`h-3 rounded-full transition-all ${b.socPct<20?'bg-red-500':b.socPct<40?'bg-amber-400':'bg-green-500'}`} style={{ width:`${b.socPct}%` }} />
                </div>
              </div>
              {b.tempC > 35 && <div className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Battery temperature elevated — check ventilation</div>}
            </div>
          ))}
        </div>
      )}

      {/* GENERATOR */}
      {tab === 'generator' && (
        <div className="space-y-4">
          {gen.map(g => {
            const serviceOverdue = g.runtimeHoursTotal - g.lastServiceHrs > 250;
            const fuelLow = g.fuelLevelPct < 25;
            return (
              <div key={g.id} className={`bg-white border rounded-xl p-5 ${g.status==='running'?'border-red-200 bg-red-50/30':serviceOverdue?'border-amber-200':'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${g.status==='running'?'bg-red-100 text-red-700':g.status==='standby'?'bg-blue-100 text-blue-700':g.status==='fault'?'bg-red-100 text-red-700':'bg-slate-100 text-slate-500'}`}>{g.status.toUpperCase()}</span>
                      {serviceOverdue && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">SERVICE OVERDUE</span>}
                      {fuelLow && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">FUEL LOW</span>}
                    </div>
                    <div className="font-semibold text-slate-800">{g.name}</div>
                    <div className="text-xs text-slate-400">{g.capacityKw} kW · {g.fuelType} · {g.runtimeHoursTotal.toLocaleString()} hrs total</div>
                  </div>
                  <button onClick={() => toggleGenerator(g.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${g.status==='running' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-700 text-white hover:bg-slate-800'}`}>
                    <Power className="w-4 h-4" /> {g.status === 'running' ? 'Stop' : 'Start'}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label:'Current Output', value: g.status==='running' ? `${g.currentOutputKw} kW` : '0 kW' },
                    { label:'Fuel Level', value:`${g.fuelLevelPct}%`, warn: fuelLow },
                    { label:'Fuel Tank', value:`${g.fuelTankL}L` },
                    { label:'Since Service', value:`${g.runtimeHoursTotal - g.lastServiceHrs} hrs`, warn: serviceOverdue },
                  ].map(x => (
                    <div key={x.label} className={`rounded-lg p-3 text-center ${(x as any).warn ? 'bg-red-50 border border-red-200' : 'bg-slate-50'}`}>
                      <div className={`text-sm font-bold ${(x as any).warn ? 'text-red-700' : 'text-slate-800'}`}>{x.value}</div>
                      <div className="text-[11px] text-slate-400">{x.label}</div>
                    </div>
                  ))}
                </div>
                {g.status === 'running' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">Output</span><span>{g.currentOutputKw} / {g.capacityKw} kW</span></div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-red-500" style={{ width:`${(g.currentOutputKw/g.capacityKw)*100}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* LOADS */}
      {tab === 'loads' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Farm Load Distribution</h3>
            <div className="space-y-3">
              {[...loads].sort((a, b) => b.currentKw - a.currentKw).map(l => {
                const pct = totalLoadKw > 0 ? (l.currentKw / totalLoadKw * 100) : 0;
                const bar = CAT_COLOR[l.category] ?? 'bg-slate-400';
                return (
                  <div key={l.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${bar}`} />
                        <span className="text-slate-700 font-medium">{l.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${l.priority==='critical'?'bg-red-100 text-red-700':l.priority==='high'?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-500'}`}>{l.priority}</span>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <span className="text-xs text-slate-400">{l.todayKwh} kWh today</span>
                        <span className="font-bold text-slate-800 tabular-nums">{l.currentKw} kW</span>
                        <span className="text-xs text-slate-400 w-8">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${bar}`} style={{ width:`${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-sm font-semibold">
              <span className="text-slate-600">Total Load</span>
              <span className="text-slate-800">{totalLoadKw.toFixed(1)} kW · {totalLoadToday.toFixed(0)} kWh today</span>
            </div>
          </div>
          {/* Cost per category */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Estimated Cost per Load (today · $0.12/kWh)</h3>
            <div className="space-y-2">
              {[...loads].sort((a,b)=>b.todayKwh-a.todayKwh).map(l => (
                <div key={l.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{l.name}</span>
                  <span className="font-bold text-slate-800">${(l.todayKwh * 0.12).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-slate-100 mt-2 pt-2 flex items-center justify-between font-semibold">
                <span className="text-slate-700">Total energy cost today</span>
                <span className="text-lg text-green-700">${(totalLoadToday * 0.12).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS */}
      {tab === 'analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:'Solar this month', value:`${monthSolar.toFixed(0)} kWh` },
              { label:'Energy cost (30d)', value:`$${monthCost.toFixed(2)}` },
              { label:'Avg daily solar', value:`${(monthSolar/30).toFixed(0)} kWh` },
              { label:'CO₂ offset est.', value:`${(monthSolar * 0.45).toFixed(0)} kg` },
            ].map(s => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                <div className="text-xs text-slate-400 mb-1">{s.label}</div>
                <div className="text-xl font-bold text-slate-800">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
            <MiniBarChart data={daily.map(d => d.solarKwh)} color="#eab308" label="Solar generation (kWh) — 30 days" />
            <MiniBarChart data={daily.map(d => d.consumedKwh)} color="#6366f1" label="Total consumption (kWh) — 30 days" />
            <MiniBarChart data={daily.map(d => d.costUSD)} color="#22c55e" label="Daily energy cost (USD) — 30 days" />
            <MiniBarChart data={daily.map(d => d.genKwh)} color="#ef4444" label="Generator use (kWh) — 30 days" />
          </div>
        </div>
      )}
    </div>
  );
}
