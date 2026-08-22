/**
 * Water Management — Tanks · Pumps · Valves · Irrigation Rules
 * Fully localStorage-based; no backend required.
 */
import React, { useState, useMemo } from 'react';
import {
  Droplets, Zap, Settings2, ArrowRight, Plus, Trash2, X,
  AlertTriangle, CheckCircle, Activity, TrendingDown, TrendingUp,
  Play, Square, Clock, Sliders, Waves, Gauge, RotateCcw, Bell,
  ChevronDown, ChevronUp, Flame, Thermometer,
} from 'lucide-react';
import { useOrg } from '@/store/orgStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type TankType = 'water' | 'borehole' | 'rainwater' | 'chemical' | 'nutrient' | 'fuel';
type PumpStatus = 'on' | 'off' | 'fault' | 'auto';
type ValveStatus = 'open' | 'closed' | 'auto';

interface Tank {
  id: string;
  name: string;
  enterpriseId: string;
  type: TankType;
  capacityL: number;
  currentL: number;
  location: string;
  alertLowPct: number;
  lastRefilled?: string;
  addedAt: string;
}

interface Pump {
  id: string;
  name: string;
  enterpriseId: string;
  linkedTankId: string;
  status: PumpStatus;
  flowLpm: number;
  powerW: number;
  runtimeHrs: number;
  totalLitresPumped: number;
  faultReason?: string;
  addedAt: string;
}

interface Valve {
  id: string;
  name: string;
  zone: string;
  enterpriseId: string;
  linkedPumpId: string;
  status: ValveStatus;
  addedAt: string;
}

type TriggerType = 'manual' | 'time_of_day' | 'soil_moisture_below' | 'tank_level_above';
type ActionType = 'open_valve' | 'start_pump' | 'open_valve_and_pump' | 'notify';

interface IrrigationRule {
  id: string;
  name: string;
  enabled: boolean;
  triggerType: TriggerType;
  triggerValue: string;           // "06:30" | "30" (pct) | "70" (pct)
  triggerDeviceId?: string;       // linked tank/soil sensor id
  action: ActionType;
  valveId?: string;
  pumpId?: string;
  durationMin: number;
  lastRunAt?: string;
  runCount: number;
}

interface WaterAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  detail: string;
  ts: string;
  resolved: boolean;
}

interface IrrigationLog {
  id: string;
  ruleId: string;
  ruleName: string;
  startedAt: string;
  durationMin: number;
  litresEstimate: number;
  valveName: string;
  triggeredBy: string;
}

// ─── localStorage ─────────────────────────────────────────────────────────────

const LS = {
  TANKS:   'agronexus_v2_wm_tanks',
  PUMPS:   'agronexus_v2_wm_pumps',
  VALVES:  'agronexus_v2_wm_valves',
  RULES:   'agronexus_v2_wm_rules',
  ALERTS:  'agronexus_v2_wm_alerts',
  LOG:     'agronexus_v2_wm_log',
};

// ─── Seed data ────────────────────────────────────────────────────────────────

function mkSeeds(enterprises: {id:string}[]) {
  const eid = enterprises[0]?.id ?? '';
  const TANKS: Tank[] = [
    { id: 'tk-1', name: 'Main Borehole Tank', enterpriseId: eid, type: 'borehole', capacityL: 50000, currentL: 38400, location: 'North compound', alertLowPct: 20, addedAt: new Date().toISOString() },
    { id: 'tk-2', name: 'Field Reservoir A', enterpriseId: eid, type: 'water', capacityL: 20000, currentL: 4200, location: 'East field', alertLowPct: 25, addedAt: new Date().toISOString() },
    { id: 'tk-3', name: 'Broiler Drinking Tank', enterpriseId: eid, type: 'water', capacityL: 5000, currentL: 3750, location: 'Poultry house 1', alertLowPct: 30, addedAt: new Date().toISOString() },
    { id: 'tk-4', name: 'Fish Pond A Supply', enterpriseId: eid, type: 'water', capacityL: 80000, currentL: 71200, location: 'Aquaculture zone', alertLowPct: 15, addedAt: new Date().toISOString() },
  ];
  const PUMPS: Pump[] = [
    { id: 'pm-1', name: 'Borehole Pump', enterpriseId: eid, linkedTankId: 'tk-1', status: 'off', flowLpm: 120, powerW: 2200, runtimeHrs: 342, totalLitresPumped: 2460000, addedAt: new Date().toISOString() },
    { id: 'pm-2', name: 'Field Irrigation Pump', enterpriseId: eid, linkedTankId: 'tk-2', status: 'on', flowLpm: 80, powerW: 1500, runtimeHrs: 178, totalLitresPumped: 852000, addedAt: new Date().toISOString() },
    { id: 'pm-3', name: 'Fish Pond Circulation', enterpriseId: eid, linkedTankId: 'tk-4', status: 'on', flowLpm: 200, powerW: 3700, runtimeHrs: 1204, totalLitresPumped: 14448000, addedAt: new Date().toISOString() },
  ];
  const VALVES: Valve[] = [
    { id: 'vl-1', name: 'Zone 1 — Maize Field', zone: 'Field 1', enterpriseId: eid, linkedPumpId: 'pm-2', status: 'open', addedAt: new Date().toISOString() },
    { id: 'vl-2', name: 'Zone 2 — Vegetable Garden', zone: 'Garden', enterpriseId: eid, linkedPumpId: 'pm-2', status: 'closed', addedAt: new Date().toISOString() },
    { id: 'vl-3', name: 'Poultry Drinker Line', zone: 'Poultry House', enterpriseId: eid, linkedPumpId: 'pm-1', status: 'auto', addedAt: new Date().toISOString() },
    { id: 'vl-4', name: 'Pond Inlet Valve', zone: 'Aquaculture', enterpriseId: eid, linkedPumpId: 'pm-3', status: 'open', addedAt: new Date().toISOString() },
  ];
  const RULES: IrrigationRule[] = [
    { id: 'rl-1', name: 'Morning Irrigation — Maize', enabled: true, triggerType: 'time_of_day', triggerValue: '05:30', action: 'open_valve_and_pump', valveId: 'vl-1', pumpId: 'pm-2', durationMin: 45, runCount: 14, lastRunAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'rl-2', name: 'Emergency Refill — Field Reservoir', enabled: true, triggerType: 'tank_level_above', triggerValue: '70', triggerDeviceId: 'tk-1', action: 'open_valve_and_pump', valveId: 'vl-1', pumpId: 'pm-1', durationMin: 120, runCount: 3, lastRunAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: 'rl-3', name: 'Evening Vegetables', enabled: false, triggerType: 'time_of_day', triggerValue: '17:00', action: 'open_valve_and_pump', valveId: 'vl-2', pumpId: 'pm-2', durationMin: 20, runCount: 0 },
  ];
  const ALERTS: WaterAlert[] = [
    { id: 'wa-1', severity: 'high', title: 'Field Reservoir A — Low Level (21%)', detail: 'Tank is below 25% alert threshold. Refill via borehole pump or rainfall. Estimated 0.9 days of irrigation remaining at current usage.', ts: new Date(Date.now() - 3600000).toISOString(), resolved: false },
    { id: 'wa-2', severity: 'medium', title: 'Field Irrigation Pump — Running > 8 hours continuously', detail: 'Pump has been running for 9.2 hours. Check for blocked valve or unusually high demand. Overheating risk.', ts: new Date(Date.now() - 7200000).toISOString(), resolved: false },
  ];
  return { TANKS, PUMPS, VALVES, RULES, ALERTS };
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
function fmtL(l: number) { return l >= 1000 ? `${(l/1000).toFixed(1)} kL` : `${l} L`; }

const TANK_TYPE_COLORS: Record<TankType, string> = {
  water: 'text-blue-600 bg-blue-50 border-blue-200',
  borehole: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  rainwater: 'text-sky-600 bg-sky-50 border-sky-200',
  chemical: 'text-orange-600 bg-orange-50 border-orange-200',
  nutrient: 'text-green-600 bg-green-50 border-green-200',
  fuel: 'text-amber-600 bg-amber-50 border-amber-200',
};

const TANK_ICONS: Record<TankType, React.ReactNode> = {
  water:     <Droplets className="w-4 h-4" />,
  borehole:  <Waves className="w-4 h-4" />,
  rainwater: <Droplets className="w-4 h-4" />,
  chemical:  <Flame className="w-4 h-4" />,
  nutrient:  <Activity className="w-4 h-4" />,
  fuel:      <Thermometer className="w-4 h-4" />,
};

// ─── Tank Level Gauge ─────────────────────────────────────────────────────────

function TankGauge({ tank, onPumpStart }: { tank: Tank; onPumpStart?: () => void }) {
  const pct = Math.min(100, Math.round((tank.currentL / tank.capacityL) * 100));
  const isLow = pct <= tank.alertLowPct;
  const color = pct > 60 ? 'bg-blue-500' : pct > 30 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = pct > 60 ? 'text-blue-600' : pct > 30 ? 'text-amber-600' : 'text-red-600';
  const typeClasses = TANK_TYPE_COLORS[tank.type];

  return (
    <div className={`bg-white border rounded-xl p-4 ${isLow ? 'border-red-200 bg-red-50/20' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border capitalize flex items-center gap-1 ${typeClasses}`}>
              {TANK_ICONS[tank.type]}{tank.type}
            </span>
            {isLow && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold animate-pulse">LOW</span>}
          </div>
          <h3 className="font-semibold text-slate-800 text-sm leading-tight">{tank.name}</h3>
          <p className="text-[10px] text-slate-400">{tank.location}</p>
        </div>
        <div className={`text-2xl font-bold flex-shrink-0 ${textColor}`}>{pct}%</div>
      </div>

      {/* Vertical gauge */}
      <div className="flex gap-3 items-end mb-3">
        <div className="w-8 h-20 border-2 border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex flex-col justify-end flex-shrink-0">
          <div className={`${color} transition-all duration-700 rounded-sm`} style={{ height: `${pct}%` }} />
        </div>
        <div className="flex-1">
          <div className="text-base font-bold text-slate-800">{fmtL(tank.currentL)}</div>
          <div className="text-xs text-slate-400">of {fmtL(tank.capacityL)} total</div>
          <div className="mt-1">
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className={`${color} rounded-full h-1.5 transition-all`} style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Alert threshold: {tank.alertLowPct}%</div>
        </div>
      </div>
      {tank.lastRefilled && <div className="text-[10px] text-slate-400">Last refilled: {fmtTs(tank.lastRefilled)}</div>}
      {onPumpStart && (
        <button onClick={onPumpStart} className="mt-2 w-full text-xs py-1.5 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-1">
          <Play className="w-3 h-3" /> Start Refill Pump
        </button>
      )}
    </div>
  );
}

// ─── Pump Card ────────────────────────────────────────────────────────────────

function PumpCard({ pump, tanks, onToggle }: { pump: Pump; tanks: Tank[]; onToggle: (id: string) => void }) {
  const tank = tanks.find(t => t.id === pump.linkedTankId);
  const statusCfg = {
    on:   { label: 'Running', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500 animate-pulse' },
    off:  { label: 'Stopped', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-300' },
    fault:{ label: 'Fault', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500 animate-pulse' },
    auto: { label: 'Auto', bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500 animate-pulse' },
  }[pump.status];

  return (
    <div className={`bg-white border rounded-xl p-4 ${pump.status === 'fault' ? 'border-red-200' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusCfg.dot}`} />
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusCfg.bg} ${statusCfg.text}`}>{statusCfg.label}</span>
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">{pump.name}</h3>
          {tank && <p className="text-[10px] text-slate-400">Draws from: {tank.name}</p>}
        </div>
        <button
          onClick={() => onToggle(pump.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${pump.status === 'on' || pump.status === 'auto' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
          {pump.status === 'on' || pump.status === 'auto' ? <><Square className="w-3 h-3" /> Stop</> : <><Play className="w-3 h-3" /> Start</>}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-50 rounded-lg py-2">
          <div className="text-base font-bold text-slate-800">{pump.flowLpm}</div>
          <div className="text-[10px] text-slate-400">L/min</div>
        </div>
        <div className="bg-slate-50 rounded-lg py-2">
          <div className="text-base font-bold text-slate-800">{(pump.powerW/1000).toFixed(1)}</div>
          <div className="text-[10px] text-slate-400">kW</div>
        </div>
        <div className="bg-slate-50 rounded-lg py-2">
          <div className="text-base font-bold text-slate-800">{pump.runtimeHrs}</div>
          <div className="text-[10px] text-slate-400">hrs total</div>
        </div>
      </div>
      {pump.faultReason && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg p-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{pump.faultReason}
        </div>
      )}
    </div>
  );
}

// ─── Valve card ───────────────────────────────────────────────────────────────

function ValveCard({ valve, pumps, onToggle }: { valve: Valve; pumps: Pump[]; onToggle: (id: string) => void }) {
  const pump = pumps.find(p => p.id === valve.linkedPumpId);
  const cfg = {
    open:   { label: 'Open', bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-300' },
    closed: { label: 'Closed', bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-slate-200' },
    auto:   { label: 'Auto', bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-300' },
  }[valve.status];

  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3`}>
      {/* Visual valve indicator */}
      <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center flex-shrink-0 ring-4 transition-all ${cfg.ring} ${valve.status === 'open' ? 'bg-blue-500 border-blue-700' : valve.status === 'auto' ? 'bg-violet-500 border-violet-700' : 'bg-slate-200 border-slate-300'}`}>
        <Gauge className={`w-5 h-5 ${valve.status !== 'closed' ? 'text-white' : 'text-slate-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
          <span className="text-[10px] text-slate-400">{valve.zone}</span>
        </div>
        <div className="font-semibold text-slate-800 text-sm truncate">{valve.name}</div>
        {pump && <div className="text-[10px] text-slate-400">Pump: {pump.name} ({pump.status})</div>}
      </div>
      <button onClick={() => onToggle(valve.id)}
        className={`flex-shrink-0 px-2 py-1.5 rounded-lg text-xs border font-medium transition-colors ${valve.status === 'closed' ? 'border-blue-200 text-blue-700 hover:bg-blue-50' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
        {valve.status === 'open' ? 'Close' : valve.status === 'closed' ? 'Open' : 'Manual'}
      </button>
    </div>
  );
}

// ─── Add Tank Modal ───────────────────────────────────────────────────────────

function AddTankModal({ enterprises, onSave, onClose }: {
  enterprises: {id:string;name:string}[];
  onSave: (t: Tank) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState({ name:'', enterpriseId: enterprises[0]?.id ?? '', type:'water' as TankType, capacityL:'', location:'', alertLowPct:'20' });
  function save(e: React.FormEvent) {
    e.preventDefault();
    onSave({ id:`tk-${uid()}`, name:f.name, enterpriseId:f.enterpriseId, type:f.type, capacityL:parseInt(f.capacityL)||1000, currentL:parseInt(f.capacityL)||1000, location:f.location, alertLowPct:parseInt(f.alertLowPct)||20, addedAt:new Date().toISOString() });
    onClose();
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-bold">Add Tank / Reservoir</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={save} className="p-5 space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Tank Name *</label>
            <input required value={f.name} onChange={e => setF(p => ({...p, name:e.target.value}))} placeholder="e.g. Main Borehole Tank" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Type</label>
              <select value={f.type} onChange={e => setF(p => ({...p, type:e.target.value as TankType}))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                <option value="water">Water</option><option value="borehole">Borehole</option>
                <option value="rainwater">Rainwater</option><option value="chemical">Chemical</option>
                <option value="nutrient">Nutrient</option><option value="fuel">Fuel</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Enterprise</label>
              <select value={f.enterpriseId} onChange={e => setF(p => ({...p, enterpriseId:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                <option value="">General</option>
                {enterprises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Capacity (Litres) *</label>
              <input required type="number" value={f.capacityL} onChange={e => setF(p => ({...p, capacityL:e.target.value}))} placeholder="e.g. 50000" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Alert Below (%)</label>
              <input type="number" value={f.alertLowPct} onChange={e => setF(p => ({...p, alertLowPct:e.target.value}))} placeholder="20" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Location</label>
            <input value={f.location} onChange={e => setF(p => ({...p, location:e.target.value}))} placeholder="e.g. North compound" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700">Add Tank</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Rule Modal ───────────────────────────────────────────────────────────

function AddRuleModal({ valves, pumps, onSave, onClose }: {
  valves: Valve[]; pumps: Pump[];
  onSave: (r: IrrigationRule) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState({ name:'', triggerType:'time_of_day' as TriggerType, triggerValue:'06:00', action:'open_valve_and_pump' as ActionType, valveId: valves[0]?.id ?? '', pumpId: pumps[0]?.id ?? '', durationMin:'30' });
  function save(e: React.FormEvent) {
    e.preventDefault();
    onSave({ id:`rl-${uid()}`, enabled:true, runCount:0, name:f.name, triggerType:f.triggerType, triggerValue:f.triggerValue, action:f.action, valveId:f.valveId||undefined, pumpId:f.pumpId||undefined, durationMin:parseInt(f.durationMin)||30 });
    onClose();
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-bold">Add Irrigation Rule</h3>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={save} className="p-5 space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Rule Name *</label>
            <input required value={f.name} onChange={e => setF(p=>({...p,name:e.target.value}))} placeholder="e.g. Morning Maize Irrigation" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Trigger Type</label>
              <select value={f.triggerType} onChange={e => setF(p=>({...p,triggerType:e.target.value as TriggerType}))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                <option value="time_of_day">Time of day</option>
                <option value="soil_moisture_below">Soil moisture below %</option>
                <option value="tank_level_above">Tank level above %</option>
                <option value="manual">Manual only</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{f.triggerType === 'time_of_day' ? 'Time' : f.triggerType === 'manual' ? '(none)' : 'Threshold %'}</label>
              <input type={f.triggerType === 'time_of_day' ? 'time' : 'number'} value={f.triggerValue} onChange={e => setF(p=>({...p,triggerValue:e.target.value}))} disabled={f.triggerType==='manual'} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm disabled:bg-slate-50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Valve</label>
              <select value={f.valveId} onChange={e => setF(p=>({...p,valveId:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                {valves.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Pump</label>
              <select value={f.pumpId} onChange={e => setF(p=>({...p,pumpId:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                <option value="">None</option>
                {pumps.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Duration (minutes)</label>
            <input type="number" value={f.durationMin} onChange={e => setF(p=>({...p,durationMin:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700">Add Rule</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function WaterManagement() {
  const { org } = useOrg();
  const enterprises = (org?.enterprises ?? []).map(e => ({ id: e.id, name: e.name }));
  const seeds = useMemo(() => mkSeeds(enterprises), []);

  const [tab, setTab] = useState<'overview'|'tanks'|'pumps'|'valves'|'rules'>('overview');
  const [tanks,  setTanks]  = useState<Tank[]>(() => ls(LS.TANKS, seeds.TANKS));
  const [pumps,  setPumps]  = useState<Pump[]>(() => ls(LS.PUMPS, seeds.PUMPS));
  const [valves, setValves] = useState<Valve[]>(() => ls(LS.VALVES, seeds.VALVES));
  const [rules,  setRules]  = useState<IrrigationRule[]>(() => ls(LS.RULES, seeds.RULES));
  const [alerts, setAlerts] = useState<WaterAlert[]>(() => ls(LS.ALERTS, seeds.ALERTS));
  const [log,    setLog]    = useState<IrrigationLog[]>(() => ls(LS.LOG, []));

  const [showAddTank,  setAddTank]  = useState(false);
  const [showAddRule,  setAddRule]  = useState(false);
  const [editingTankId, setEditingTankId] = useState<string | null>(null);
  const [editLitres, setEditLitres] = useState('');
  const [addPumpForm,  setAddPumpForm]  = useState(false);
  const [addValveForm, setAddValveForm] = useState(false);
  const [pumpF, setPumpF] = useState({ name:'', linkedTankId:'', flowLpm:'80', powerW:'1500' });
  const [valveF, setValveF] = useState({ name:'', zone:'', linkedPumpId:'' });

  function save<T>(key: string, setter: React.Dispatch<React.SetStateAction<T>>, val: T) { setter(val); lsSet(key, val); }

  function togglePump(id: string) {
    const next = pumps.map(p => p.id === id ? {...p, status: (p.status === 'on' || p.status === 'auto') ? 'off' as PumpStatus : 'on' as PumpStatus} : p);
    save(LS.PUMPS, setPumps, next);
  }

  function toggleValve(id: string) {
    const next = valves.map(v => v.id === id ? {...v, status: v.status === 'closed' ? 'open' as ValveStatus : 'closed' as ValveStatus} : v);
    save(LS.VALVES, setValves, next);
  }

  function runRule(rule: IrrigationRule) {
    // Simulate running the rule
    const valve = valves.find(v => v.id === rule.valveId);
    const pump = pumps.find(p => p.id === rule.pumpId);
    if (valve) {
      const vNext = valves.map(v => v.id === valve.id ? {...v, status:'open' as ValveStatus} : v);
      save(LS.VALVES, setValves, vNext);
    }
    if (pump) {
      const pNext = pumps.map(p => p.id === pump.id ? {...p, status:'on' as PumpStatus} : p);
      save(LS.PUMPS, setPumps, pNext);
    }
    const rNext = rules.map(r => r.id === rule.id ? {...r, lastRunAt: new Date().toISOString(), runCount: r.runCount + 1} : r);
    save(LS.RULES, setRules, rNext);
    const litresEst = (pump?.flowLpm ?? 60) * rule.durationMin;
    const entry: IrrigationLog = { id:`lg-${uid()}`, ruleId:rule.id, ruleName:rule.name, startedAt:new Date().toISOString(), durationMin:rule.durationMin, litresEstimate:litresEst, valveName: valve?.name ?? '—', triggeredBy:'Manual' };
    const lNext = [...log, entry];
    save(LS.LOG, setLog, lNext);
  }

  const unresolvedAlerts = alerts.filter(a => !a.resolved);
  const totalCapacity = tanks.reduce((s, t) => s + t.capacityL, 0);
  const totalCurrent = tanks.reduce((s, t) => s + t.currentL, 0);
  const activePumps = pumps.filter(p => p.status === 'on' || p.status === 'auto').length;
  const openValves = valves.filter(v => v.status === 'open').length;

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Droplets },
    { id: 'tanks',    label: `Tanks (${tanks.length})`, icon: Waves },
    { id: 'pumps',    label: `Pumps (${pumps.length})`, icon: Zap },
    { id: 'valves',   label: `Valves (${valves.length})`, icon: Gauge },
    { id: 'rules',    label: `Rules (${rules.length})`, icon: Settings2 },
  ] as const;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Water Management</h1>
            <p className="text-blue-100 text-sm">Tanks · Pumps · Valves · Irrigation automation</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Capacity', value: fmtL(totalCapacity), icon: Waves },
            { label: 'Current Volume', value: fmtL(totalCurrent), icon: Droplets },
            { label: 'Active Pumps', value: activePumps, icon: Zap, hl: activePumps > 0 },
            { label: 'Open Valves', value: openValves, icon: Gauge },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`rounded-lg p-3 ${s.hl ? 'bg-white/25' : 'bg-white/10'}`}>
                <div className="flex items-center gap-1.5 mb-1"><Icon className="w-3.5 h-3.5 text-white/70" /><span className="text-xs text-white/70">{s.label}</span></div>
                <div className="text-xl font-bold">{s.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerts */}
      {unresolvedAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-700 font-semibold"><AlertTriangle className="w-4 h-4" />{unresolvedAlerts.length} Water Alert{unresolvedAlerts.length > 1 ? 's' : ''}</div>
          {unresolvedAlerts.map(a => (
            <div key={a.id} className="flex items-start gap-3 bg-white rounded-lg border border-red-100 px-4 py-2.5">
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-800">{a.title}</div>
                <div className="text-xs text-slate-500">{a.detail}</div>
              </div>
              <button onClick={() => { const n = alerts.map(al => al.id===a.id ? {...al,resolved:true} : al); save(LS.ALERTS, setAlerts, n); }} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1 flex-shrink-0">
                <CheckCircle className="w-3 h-3" /> Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors ${tab === t.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Icon className="w-4 h-4" />{t.label}
            </button>
          );
        })}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Tank gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tanks.map(t => <TankGauge key={t.id} tank={t} />)}
          </div>

          {/* System flow diagram */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><ArrowRight className="w-4 h-4 text-blue-600" /> Water Flow — Current State</h3>
            <div className="overflow-x-auto">
              <div className="flex items-center gap-2 min-w-max text-sm">
                {pumps.map((pump, i) => {
                  const tank = tanks.find(t => t.id === pump.linkedTankId);
                  const pumpValves = valves.filter(v => v.linkedPumpId === pump.id);
                  return (
                    <React.Fragment key={pump.id}>
                      {i > 0 && <div className="w-4 h-px bg-slate-300" />}
                      <div className="flex flex-col items-center gap-1.5">
                        {tank && (
                          <div className={`text-xs px-3 py-1.5 rounded-lg border text-center ${tank.currentL / tank.capacityL < 0.25 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                            <div className="font-semibold">{tank.name}</div>
                            <div>{Math.round(tank.currentL/tank.capacityL*100)}%</div>
                          </div>
                        )}
                        <div className="w-px h-4 bg-slate-300" />
                        <div className={`text-xs px-3 py-1.5 rounded-lg border text-center ${pump.status==='on'||pump.status==='auto' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                          <div className="font-medium">{pump.name}</div>
                          <div className="capitalize">{pump.status}</div>
                        </div>
                        {pumpValves.length > 0 && (
                          <>
                            <div className="w-px h-4 bg-slate-300" />
                            <div className="flex gap-1">
                              {pumpValves.map(v => (
                                <div key={v.id} className={`text-[10px] px-2 py-1 rounded border text-center ${v.status==='open' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                  {v.zone}<br/><span className="font-medium capitalize">{v.status}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent irrigation log */}
          {log.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 font-semibold text-sm text-slate-800">Recent Irrigation Events</div>
              {log.slice().reverse().slice(0, 6).map(entry => (
                <div key={entry.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0">
                  <Droplets className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800">{entry.ruleName}</div>
                    <div className="text-xs text-slate-500">{entry.valveName} · {entry.durationMin} min · ~{fmtL(entry.litresEstimate)} · {entry.triggeredBy}</div>
                  </div>
                  <div className="text-xs text-slate-400 flex-shrink-0">{fmtTs(entry.startedAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TANKS */}
      {tab === 'tanks' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setAddTank(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Add Tank
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tanks.map(t => (
              <div key={t.id}>
                <TankGauge tank={t} />
                {editingTankId === t.id ? (
                  <div className="flex gap-1 mt-1.5">
                    <input type="number" value={editLitres} onChange={e => setEditLitres(e.target.value)}
                      className="flex-1 text-xs border border-blue-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      placeholder={`0–${t.capacityL}`} min={0} max={t.capacityL} autoFocus />
                    <button onClick={() => {
                      const litres = parseInt(editLitres) || 0;
                      if (litres >= 0) { const n = tanks.map(tk => tk.id===t.id ? {...tk, currentL: Math.min(litres, tk.capacityL), lastRefilled: new Date().toISOString()} : tk); save(LS.TANKS, setTanks, n); }
                      setEditingTankId(null); setEditLitres('');
                    }} className="text-xs px-2 py-1.5 bg-blue-600 text-white rounded-lg">✓</button>
                    <button onClick={() => { setEditingTankId(null); setEditLitres(''); }} className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg">✕</button>
                  </div>
                ) : (
                  <div className="flex gap-1 mt-1.5">
                    <button onClick={() => { setEditingTankId(t.id); setEditLitres(String(t.currentL)); }}
                      className="flex-1 text-xs border border-slate-200 rounded-lg py-1.5 hover:bg-slate-50 text-slate-600">Update Level</button>
                    <button onClick={() => { if(window.confirm(`Delete "${t.name}"?`)) { const n = tanks.filter(tk => tk.id !== t.id); save(LS.TANKS, setTanks, n); } }} className="p-1.5 text-slate-300 hover:text-red-500 border border-slate-200 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {showAddTank && <AddTankModal enterprises={enterprises} onSave={t => { const n=[...tanks,t]; save(LS.TANKS, setTanks, n); }} onClose={() => setAddTank(false)} />}
        </div>
      )}

      {/* PUMPS */}
      {tab === 'pumps' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setAddPumpForm(v => !v)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><Plus className="w-4 h-4" /> Add Pump</button>
          </div>
          {addPumpForm && (
            <div className="bg-white border border-blue-200 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-slate-800">New Pump</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><label className="block text-xs text-slate-500 mb-1">Name</label><input value={pumpF.name} onChange={e => setPumpF(p=>({...p,name:e.target.value}))} placeholder="e.g. Submersible #2" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs text-slate-500 mb-1">Linked Tank</label>
                  <select value={pumpF.linkedTankId} onChange={e => setPumpF(p=>({...p,linkedTankId:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                    <option value="">None</option>{tanks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs text-slate-500 mb-1">Flow (L/min)</label><input type="number" value={pumpF.flowLpm} onChange={e => setPumpF(p=>({...p,flowLpm:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs text-slate-500 mb-1">Power (W)</label><input type="number" value={pumpF.powerW} onChange={e => setPumpF(p=>({...p,powerW:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { if(!pumpF.name) return; const pm: Pump = {id:`pm-${uid()}`, name:pumpF.name, enterpriseId:'', linkedTankId:pumpF.linkedTankId, status:'off', flowLpm:parseInt(pumpF.flowLpm)||80, powerW:parseInt(pumpF.powerW)||1500, runtimeHrs:0, totalLitresPumped:0, addedAt:new Date().toISOString()}; const n=[...pumps,pm]; save(LS.PUMPS, setPumps, n); setAddPumpForm(false); setPumpF({name:'',linkedTankId:'',flowLpm:'80',powerW:'1500'}); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1.5"><Plus className="w-4 h-4" /> Save</button>
                <button onClick={() => setAddPumpForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">Cancel</button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pumps.map(p => <PumpCard key={p.id} pump={p} tanks={tanks} onToggle={togglePump} />)}
          </div>
        </div>
      )}

      {/* VALVES */}
      {tab === 'valves' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setAddValveForm(v => !v)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><Plus className="w-4 h-4" /> Add Valve</button>
          </div>
          {addValveForm && (
            <div className="bg-white border border-blue-200 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-slate-800">New Valve</h3>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs text-slate-500 mb-1">Name</label><input value={valveF.name} onChange={e => setValveF(p=>({...p,name:e.target.value}))} placeholder="Zone 3 Valve" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs text-slate-500 mb-1">Zone</label><input value={valveF.zone} onChange={e => setValveF(p=>({...p,zone:e.target.value}))} placeholder="e.g. Field 3" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs text-slate-500 mb-1">Linked Pump</label>
                  <select value={valveF.linkedPumpId} onChange={e => setValveF(p=>({...p,linkedPumpId:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                    <option value="">None</option>{pumps.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { if(!valveF.name) return; const vl: Valve = {id:`vl-${uid()}`, name:valveF.name, zone:valveF.zone, enterpriseId:'', linkedPumpId:valveF.linkedPumpId, status:'closed', addedAt:new Date().toISOString()}; const n=[...valves,vl]; save(LS.VALVES, setValves, n); setAddValveForm(false); setValveF({name:'',zone:'',linkedPumpId:''}); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1.5"><Plus className="w-4 h-4" /> Save</button>
                <button onClick={() => setAddValveForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">Cancel</button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {valves.map(v => <ValveCard key={v.id} valve={v} pumps={pumps} onToggle={toggleValve} />)}
          </div>
        </div>
      )}

      {/* RULES */}
      {tab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-slate-600">Automation rules run on schedule or trigger. Press <strong>Run now</strong> to execute manually.</p>
            <button onClick={() => setAddRule(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><Plus className="w-4 h-4" /> Add Rule</button>
          </div>
          <div className="space-y-3">
            {rules.map(rule => {
              const valve = valves.find(v => v.id === rule.valveId);
              const pump = pumps.find(p => p.id === rule.pumpId);
              const triggerLabel = rule.triggerType === 'time_of_day' ? `Every day at ${rule.triggerValue}` : rule.triggerType === 'soil_moisture_below' ? `Soil moisture < ${rule.triggerValue}%` : rule.triggerType === 'tank_level_above' ? `Tank level > ${rule.triggerValue}%` : 'Manual only';
              return (
                <div key={rule.id} className={`bg-white border rounded-xl p-4 ${!rule.enabled ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-slate-800 text-sm">{rule.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${rule.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{rule.enabled ? 'Enabled' : 'Disabled'}</span>
                        {rule.runCount > 0 && <span className="text-[10px] text-slate-400">{rule.runCount} runs</span>}
                      </div>
                      <div className="text-xs text-slate-600 space-y-0.5">
                        <div className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-slate-400" /><strong>IF</strong> {triggerLabel}</div>
                        <div className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-slate-400" /><strong>THEN</strong> {valve?.name ?? 'valve'} → open · {pump?.name ?? ''} {pump ? '→ on' : ''} for <strong>{rule.durationMin} min</strong></div>
                        {rule.lastRunAt && <div className="flex items-center gap-1.5 text-slate-400"><RotateCcw className="w-3 h-3" /> Last run: {fmtTs(rule.lastRunAt)}</div>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => runRule(rule)} className="text-xs px-2 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-1"><Play className="w-3 h-3" /> Run</button>
                      <button onClick={() => { const n = rules.map(r => r.id===rule.id ? {...r, enabled:!r.enabled} : r); save(LS.RULES, setRules, n); }} className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">{rule.enabled ? 'Disable' : 'Enable'}</button>
                      <button onClick={() => { if(confirm(`Delete rule "${rule.name}"?`)) { const n = rules.filter(r => r.id!==rule.id); save(LS.RULES, setRules, n); } }} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
            {rules.length === 0 && <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 text-sm">No irrigation rules configured yet.</div>}
          </div>
          {showAddRule && <AddRuleModal valves={valves} pumps={pumps} onSave={r => { const n=[...rules,r]; save(LS.RULES, setRules, n); }} onClose={() => setAddRule(false)} />}
        </div>
      )}
    </div>
  );
}
