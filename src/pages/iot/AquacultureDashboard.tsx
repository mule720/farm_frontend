/**
 * Aquaculture Dashboard — Ponds · Parameters · Aeration · Feeding · Water Quality
 * Fully localStorage-based; no backend required.
 */
import React, { useState, useMemo } from 'react';
import {
  Waves, Droplets, Thermometer, Activity, AlertTriangle, CheckCircle,
  Plus, Trash2, X, Play, Square, Clock, RefreshCw, TrendingDown,
  TrendingUp, Minus, ChevronDown, ChevronUp, Bell, Fish, Wind,
  BarChart3, Zap, Settings2, Calendar,
} from 'lucide-react';
import { useOrg } from '@/store/orgStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type PondStatus = 'excellent' | 'good' | 'fair' | 'critical';

interface Pond {
  id: string;
  name: string;
  enterpriseId: string;
  type: 'earthen' | 'concrete' | 'cage' | 'raceway' | 'biofloc' | 'rас';
  species: string;
  stockingDensity: number;   // fish/m³
  volumeM3: number;
  currentBiomassKg: number;
  stockedCount: number;
  ageWeeks: number;
  targetWeightG: number;
  status: PondStatus;
  aeratorOn: boolean;
  // Live parameters
  do_mgl: number;           // dissolved oxygen
  ph: number;
  tempC: number;
  ammoniaMgl: number;
  turbidityNtu: number;
  levelPct: number;
  addedAt: string;
}

interface FeedingEvent {
  id: string;
  pondId: string;
  feedKg: number;
  feedType: string;
  method: 'manual' | 'auto';
  notes: string;
  fedAt: string;
}

interface WaterChangeLog {
  id: string;
  pondId: string;
  pctChanged: number;
  reason: string;
  performedAt: string;
}

interface MortalityLog {
  id: string;
  pondId: string;
  count: number;
  estimatedWeightG: number;
  cause: string;
  loggedAt: string;
}

interface AquaAlert {
  id: string;
  pondId: string;
  pondName: string;
  parameter: string;
  value: number;
  unit: string;
  threshold: string;
  severity: 'warning' | 'critical';
  ts: string;
  resolved: boolean;
}

// ─── localStorage ─────────────────────────────────────────────────────────────
const LS = {
  PONDS:    'agronexus_v2_aqua_ponds',
  FEEDING:  'agronexus_v2_aqua_feeding',
  WATER:    'agronexus_v2_aqua_water',
  MORT:     'agronexus_v2_aqua_mortality',
  ALERTS:   'agronexus_v2_aqua_alerts',
};

// ─── Seed data ────────────────────────────────────────────────────────────────

function mkSeeds(enterprises: {id:string}[]) {
  const eid = enterprises[0]?.id ?? '';
  const PONDS: Pond[] = [
    { id:'pond-1', name:'Pond A — Tilapia Grow-out', enterpriseId:eid, type:'earthen', species:'Nile Tilapia', stockingDensity:3.2, volumeM3:1200, currentBiomassKg:480, stockedCount:2000, ageWeeks:12, targetWeightG:500, status:'good', aeratorOn:true, do_mgl:6.8, ph:7.4, tempC:27.2, ammoniaMgl:0.04, turbidityNtu:12, levelPct:88, addedAt:new Date().toISOString() },
    { id:'pond-2', name:'Pond B — Catfish Juveniles', enterpriseId:eid, type:'earthen', species:'African Catfish', stockingDensity:5.1, volumeM3:800, currentBiomassKg:120, stockedCount:3000, ageWeeks:5, targetWeightG:800, status:'critical', aeratorOn:false, do_mgl:3.1, ph:7.8, tempC:28.6, ammoniaMgl:0.18, turbidityNtu:35, levelPct:91, addedAt:new Date().toISOString() },
    { id:'pond-3', name:'Tank C — Fingerling Nursery', enterpriseId:eid, type:'concrete', species:'Tilapia Fingerlings', stockingDensity:12.0, volumeM3:50, currentBiomassKg:8, stockedCount:2500, ageWeeks:2, targetWeightG:30, status:'excellent', aeratorOn:true, do_mgl:7.6, ph:7.1, tempC:26.8, ammoniaMgl:0.02, turbidityNtu:6, levelPct:95, addedAt:new Date().toISOString() },
    { id:'pond-4', name:'Cage D — Lake Cage, Tilapia', enterpriseId:eid, type:'cage', species:'Nile Tilapia', stockingDensity:20.0, volumeM3:27, currentBiomassKg:210, stockedCount:400, ageWeeks:18, targetWeightG:600, status:'fair', aeratorOn:false, do_mgl:5.2, ph:8.1, tempC:29.0, ammoniaMgl:0.08, turbidityNtu:22, levelPct:100, addedAt:new Date().toISOString() },
  ];

  const FEEDING: FeedingEvent[] = [
    { id:'f-1', pondId:'pond-1', feedKg:12.0, feedType:'Coppens 3mm Grower', method:'manual', notes:'Morning feed, good appetite', fedAt:new Date(Date.now()-3*3600000).toISOString() },
    { id:'f-2', pondId:'pond-2', feedKg:8.5, feedType:'Coppens Starter 2mm', method:'manual', notes:'Reduced feed — fish not eating well', fedAt:new Date(Date.now()-4*3600000).toISOString() },
    { id:'f-3', pondId:'pond-1', feedKg:11.5, feedType:'Coppens 3mm Grower', method:'manual', notes:'Evening feed', fedAt:new Date(Date.now()-86400000).toISOString() },
  ];

  const WATER: WaterChangeLog[] = [
    { id:'wc-1', pondId:'pond-2', pctChanged:30, reason:'High ammonia — emergency water change', performedAt:new Date(Date.now()-2*3600000).toISOString() },
    { id:'wc-2', pondId:'pond-1', pctChanged:15, reason:'Routine weekly water exchange', performedAt:new Date(Date.now()-3*86400000).toISOString() },
  ];

  const MORT: MortalityLog[] = [
    { id:'m-1', pondId:'pond-2', count:28, estimatedWeightG:35, cause:'Low DO / stress', loggedAt:new Date(Date.now()-5*3600000).toISOString() },
    { id:'m-2', pondId:'pond-1', count:3, estimatedWeightG:180, cause:'Unknown', loggedAt:new Date(Date.now()-2*86400000).toISOString() },
  ];

  const ALERTS: AquaAlert[] = [
    { id:'al-1', pondId:'pond-2', pondName:'Pond B — Catfish Juveniles', parameter:'Dissolved Oxygen', value:3.1, unit:'mg/L', threshold:'< 5 mg/L', severity:'critical', ts:new Date(Date.now()-30*60000).toISOString(), resolved:false },
    { id:'al-2', pondId:'pond-2', pondName:'Pond B — Catfish Juveniles', parameter:'Ammonia', value:0.18, unit:'mg/L', threshold:'> 0.1 mg/L', severity:'critical', ts:new Date(Date.now()-45*60000).toISOString(), resolved:false },
    { id:'al-3', pondId:'pond-4', pondName:'Cage D — Lake Cage, Tilapia', parameter:'Dissolved Oxygen', value:5.2, unit:'mg/L', threshold:'< 6 mg/L', severity:'warning', ts:new Date(Date.now()-90*60000).toISOString(), resolved:false },
  ];

  return { PONDS, FEEDING, WATER, MORT, ALERTS };
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

// ─── Parameter chip ───────────────────────────────────────────────────────────

type ParamCfg = { label: string; unit: string; good: [number,number]; warn: [number,number] };
const PARAMS: Record<string, ParamCfg> = {
  do_mgl:       { label:'DO',        unit:'mg/L', good:[6,10],     warn:[4,5.9]  },
  ph:           { label:'pH',        unit:'pH',   good:[6.5,8.5],  warn:[6,6.4]  },
  tempC:        { label:'Temp',      unit:'°C',   good:[22,30],    warn:[18,21]  },
  ammoniaMgl:   { label:'NH₃',       unit:'mg/L', good:[0,0.05],   warn:[0.05,0.1] },
  turbidityNtu: { label:'Turbidity', unit:'NTU',  good:[0,20],     warn:[20,40]  },
  levelPct:     { label:'Level',     unit:'%',    good:[60,100],   warn:[30,59]  },
};

function paramStatus(key: string, val: number): 'critical'|'warning'|'ok' {
  const cfg = PARAMS[key];
  if (!cfg) return 'ok';
  const [gMin, gMax] = cfg.good;
  if (val >= gMin && val <= gMax) return 'ok';
  const [wMin, wMax] = cfg.warn;
  if (val >= wMin && val <= wMax) return 'warning';
  return 'critical';
}

function ParamChip({ label, value, unit, status }: { label:string; value:number|null; unit:string; status:'ok'|'warning'|'critical' }) {
  const cls = { ok:'bg-green-50 border-green-200 text-green-700', warning:'bg-amber-50 border-amber-200 text-amber-700', critical:'bg-red-50 border-red-200 text-red-700' }[status];
  return (
    <div className={`border rounded-lg px-3 py-2 text-center flex-1 min-w-[70px] ${cls}`}>
      <div className="text-[10px] font-medium opacity-70">{label}</div>
      <div className="text-sm font-bold tabular-nums">{value === null ? '—' : value}</div>
      <div className="text-[10px] opacity-60">{unit}</div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<PondStatus, { label:string; bg:string; text:string; border:string }> = {
  excellent: { label:'Excellent', bg:'bg-green-100', text:'text-green-700', border:'border-green-200' },
  good:      { label:'Good',      bg:'bg-emerald-100', text:'text-emerald-700', border:'border-emerald-200' },
  fair:      { label:'Fair',      bg:'bg-amber-100', text:'text-amber-700', border:'border-amber-200' },
  critical:  { label:'Critical',  bg:'bg-red-100', text:'text-red-700', border:'border-red-200' },
};

function StatusBadge({ status }: { status: PondStatus }) {
  const c = STATUS_CFG[status];
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${c.bg} ${c.text} ${c.border}`}>{c.label}</span>;
}

// ─── Pond Card ────────────────────────────────────────────────────────────────

function PondCard({ pond, onAerator, onSelect, selected }: {
  pond: Pond; selected: boolean;
  onAerator: (id:string) => void;
  onSelect: (id:string) => void;
}) {
  const cfg = STATUS_CFG[pond.status];
  const doSt = paramStatus('do_mgl', pond.do_mgl);
  const nhSt = paramStatus('ammoniaMgl', pond.ammoniaMgl);
  let fcr: string;
  if (pond.currentBiomassKg > 0 && pond.ageWeeks > 0) {
    const estimatedFeedKg = pond.currentBiomassKg * 0.03 * pond.ageWeeks * 7;
    const weightGainKg = Math.max(0.1, pond.currentBiomassKg - pond.stockedCount * 0.005);
    fcr = (estimatedFeedKg / weightGainKg).toFixed(2);
  } else {
    fcr = '—';
  }
  const survivalPct = pond.stockedCount > 0
    ? Math.min(100, Math.round((pond.currentBiomassKg * 1000 / pond.targetWeightG / pond.stockedCount) * 100)).toFixed(0)
    : '—';
  const dailyFeedKg = (pond.currentBiomassKg * 0.03).toFixed(1);

  return (
    <div onClick={() => onSelect(pond.id)}
      className={`bg-white rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${selected ? 'border-cyan-500 shadow-md' : pond.status==='critical' ? 'border-red-200' : pond.status==='fair' ? 'border-amber-200' : 'border-slate-200'}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <StatusBadge status={pond.status} />
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize">{pond.type}</span>
              {pond.aeratorOn && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-0.5"><Wind className="w-2.5 h-2.5" />Aerating</span>}
            </div>
            <h3 className="font-semibold text-slate-800 text-sm leading-tight">{pond.name}</h3>
            <p className="text-[10px] text-slate-400">{pond.species} · Age: {pond.ageWeeks}wk · {pond.volumeM3}m³</p>
          </div>
          <button onClick={e => { e.stopPropagation(); onAerator(pond.id); }}
            className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg flex-shrink-0 transition-colors ${pond.aeratorOn ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-blue-200 text-blue-700 hover:bg-blue-50'}`}>
            <Wind className="w-3 h-3" />
            {pond.aeratorOn ? 'On' : 'Off'}
          </button>
        </div>

        {/* Parameters row */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
          <ParamChip label="DO"       value={pond.do_mgl}        unit="mg/L" status={paramStatus('do_mgl', pond.do_mgl)} />
          <ParamChip label="pH"       value={pond.ph}            unit="pH"   status={paramStatus('ph', pond.ph)} />
          <ParamChip label="Temp"     value={pond.tempC}         unit="°C"   status={paramStatus('tempC', pond.tempC)} />
          <ParamChip label="NH₃"      value={pond.ammoniaMgl}    unit="mg/L" status={paramStatus('ammoniaMgl', pond.ammoniaMgl)} />
          <ParamChip label="Turbidity"value={pond.turbidityNtu}  unit="NTU"  status={paramStatus('turbidityNtu', pond.turbidityNtu)} />
        </div>

        {/* Production metrics */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-50 rounded-lg py-2">
            <div className="font-bold text-slate-800">{pond.stockedCount.toLocaleString()}</div>
            <div className="text-slate-400">Fish stocked</div>
          </div>
          <div className="bg-slate-50 rounded-lg py-2">
            <div className="font-bold text-slate-800">{pond.currentBiomassKg} kg</div>
            <div className="text-slate-400">Biomass</div>
          </div>
          <div className="bg-slate-50 rounded-lg py-2">
            <div className="font-bold text-slate-800">{dailyFeedKg} kg</div>
            <div className="text-slate-400">Feed/day</div>
          </div>
        </div>

        {/* DO critical action */}
        {pond.do_mgl < 5 && !pond.aeratorOn && (
          <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-xs text-red-700 font-medium">Critical DO — start aerator immediately</span>
            </div>
            <button onClick={e => { e.stopPropagation(); onAerator(pond.id); }}
              className="text-[10px] px-2 py-1 bg-red-600 text-white rounded font-bold hover:bg-red-700 flex-shrink-0">
              Start
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DO Trend chart (simulated 24h sparkline) ─────────────────────────────────

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function DOTrendChart({ pond }: { pond: Pond }) {
  const points = useMemo(() => {
    const base = pond.do_mgl;
    return Array.from({ length: 24 }, (_, i) => {
      const h = i;
      const nightBoost = (h < 6 || h > 20) ? -0.5 : 0.3;
      const v = Math.max(1, Math.min(12, base + nightBoost + (seededRand(i * 137 + pond.do_mgl * 100) - 0.5) * 1.2));
      return parseFloat(v.toFixed(2));
    });
  }, [pond.id, pond.do_mgl]);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const W = 320, H = 60;
  const xs = points.map((_, i) => (i / 23) * W);
  const ys = points.map(v => H - ((v - min) / range) * (H - 8) - 4);
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  const fill = `${path} L ${W} ${H} L 0 ${H} Z`;
  const dangerY = H - ((5 - min) / range) * (H - 8) - 4;
  const current = points[points.length - 1];
  const isCrit = current < 5;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-800">DO Trend — 24h</span>
        <span className={`text-sm font-bold ${isCrit ? 'text-red-600' : current < 6 ? 'text-amber-600' : 'text-green-600'}`}>{current} mg/L</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 60 }}>
        <defs>
          <linearGradient id="doGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isCrit ? '#ef4444' : '#06b6d4'} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isCrit ? '#ef4444' : '#06b6d4'} stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {/* danger line at 5 mg/L */}
        {dangerY > 0 && dangerY < H && (
          <line x1="0" y1={dangerY} x2={W} y2={dangerY} stroke="#ef4444" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
        )}
        <path d={fill} fill="url(#doGrad)" />
        <path d={path} fill="none" stroke={isCrit ? '#ef4444' : '#06b6d4'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>Now</span>
      </div>
      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
        <span className="w-4 h-px border-dashed border border-red-400 inline-block" /> DO minimum threshold: 5 mg/L
      </div>
    </div>
  );
}

// ─── Add Pond Modal ───────────────────────────────────────────────────────────

function AddPondModal({ enterprises, onSave, onClose }: {
  enterprises:{id:string;name:string}[];
  onSave: (p:Pond) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState({
    name:'', enterpriseId:enterprises[0]?.id??'', type:'earthen' as Pond['type'],
    species:'Nile Tilapia', stockedCount:'1000', volumeM3:'500', targetWeightG:'500',
  });
  function save(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id:`pond-${uid()}`, name:f.name, enterpriseId:f.enterpriseId,
      type:f.type, species:f.species,
      stockingDensity: parseInt(f.stockedCount)/(parseInt(f.volumeM3)||1),
      volumeM3:parseInt(f.volumeM3)||500,
      currentBiomassKg: Math.round(parseInt(f.stockedCount) * 0.05),
      stockedCount:parseInt(f.stockedCount)||1000,
      ageWeeks:0, targetWeightG:parseInt(f.targetWeightG)||500,
      status:'good', aeratorOn:false,
      do_mgl:7.0, ph:7.2, tempC:27.0, ammoniaMgl:0.02, turbidityNtu:10, levelPct:90,
      addedAt:new Date().toISOString(),
    });
    onClose();
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-bold">Add Pond / Tank</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={save} className="p-5 space-y-3">
          <div><label className="block text-xs text-slate-500 mb-1">Name *</label>
            <input required value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))} placeholder="e.g. Pond E — Catfish" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-slate-500 mb-1">Type</label>
              <select value={f.type} onChange={e=>setF(p=>({...p,type:e.target.value as Pond['type']}))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                <option value="earthen">Earthen</option><option value="concrete">Concrete</option>
                <option value="cage">Cage</option><option value="raceway">Raceway</option>
                <option value="biofloc">Biofloc</option>
              </select></div>
            <div><label className="block text-xs text-slate-500 mb-1">Enterprise</label>
              <select value={f.enterpriseId} onChange={e=>setF(p=>({...p,enterpriseId:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                <option value="">General</option>{enterprises.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs text-slate-500 mb-1">Species</label>
              <input value={f.species} onChange={e=>setF(p=>({...p,species:e.target.value}))} placeholder="Tilapia" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Stocked (#)</label>
              <input type="number" value={f.stockedCount} onChange={e=>setF(p=>({...p,stockedCount:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Volume (m³)</label>
              <input type="number" value={f.volumeM3} onChange={e=>setF(p=>({...p,volumeM3:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 bg-cyan-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-cyan-700">Add Pond</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function AquacultureDashboard() {
  const { org, cycles } = useOrg();
  const enterprises = (org?.enterprises ?? []).map(e => ({ id:e.id, name:e.name }));
  const seeds = useMemo(() => mkSeeds(enterprises), []);

  const [ponds,    setPonds]   = useState<Pond[]>(() => ls(LS.PONDS, seeds.PONDS));
  const [feeding,  setFeeding] = useState<FeedingEvent[]>(() => ls(LS.FEEDING, seeds.FEEDING));
  const [water,    setWater]   = useState<WaterChangeLog[]>(() => ls(LS.WATER, seeds.WATER));
  const [mort,     setMort]    = useState<MortalityLog[]>(() => ls(LS.MORT, seeds.MORT));
  const [alerts,   setAlerts]  = useState<AquaAlert[]>(() => ls(LS.ALERTS, seeds.ALERTS));

  const [tab, setTab]           = useState<'overview'|'ponds'|'feeding'|'quality'|'log'>('overview');
  const [selectedId, setSelected] = useState<string>(ponds[0]?.id ?? '');
  const [showAddPond, setAddPond] = useState(false);
  const [showFeedForm, setFeedForm] = useState(false);
  const [feedF, setFeedF] = useState({ pondId:'', feedKg:'', feedType:'Coppens 3mm', notes:'' });
  const [showWaterForm, setWaterForm] = useState(false);
  const [waterF, setWaterF] = useState({ pondId:'', pctChanged:'', reason:'' });
  const [showMortForm, setMortForm] = useState(false);
  const [mortF, setMortF] = useState({ pondId:'', count:'', estimatedWeightG:'', cause:'' });

  function sv<T>(key: string, setter: React.Dispatch<React.SetStateAction<T>>, val: T) { setter(val); lsSet(key, val); }

  function toggleAerator(id: string) {
    const n = ponds.map(p => {
      if (p.id !== id) return p;
      const on = !p.aeratorOn;
      const newDo = on ? Math.min(10, p.do_mgl + 1.5) : p.do_mgl;
      const newStatus: PondStatus = newDo < 4 ? 'critical' : newDo < 6 ? 'fair' : p.ph > 9 || p.ammoniaMgl > 0.2 ? 'fair' : 'good';
      return { ...p, aeratorOn: on, do_mgl: parseFloat(newDo.toFixed(1)), status: newStatus };
    });
    sv(LS.PONDS, setPonds, n);
  }

  function resolveAlert(id: string) {
    sv(LS.ALERTS, setAlerts, alerts.map(a => a.id===id ? {...a, resolved:true} : a));
  }

  function simulateUpdate(id: string) {
    const n = ponds.map(p => {
      if (p.id !== id) return p;
      const doVar = p.aeratorOn ? 0.3 : -0.4;
      const newDo = parseFloat(Math.max(1, Math.min(12, p.do_mgl + doVar + (Math.random()-0.5)*0.5)).toFixed(1));
      const newPh = parseFloat((p.ph + (Math.random()-0.5)*0.1).toFixed(2));
      const newTemp = parseFloat((p.tempC + (Math.random()-0.5)*0.3).toFixed(1));
      const newNH3 = parseFloat(Math.max(0, p.ammoniaMgl + (Math.random()-0.5)*0.02).toFixed(3));
      const newStatus: PondStatus = newDo < 4 || newNH3 > 0.2 ? 'critical' : newDo < 6 || newNH3 > 0.1 ? 'fair' : 'good';
      return { ...p, do_mgl:newDo, ph:newPh, tempC:newTemp, ammoniaMgl:newNH3, status:newStatus };
    });
    sv(LS.PONDS, setPonds, n);
  }

  const selected = ponds.find(p => p.id === selectedId) ?? ponds[0];
  const unresolvedAlerts = alerts.filter(a => !a.resolved);

  const totalBiomass = ponds.reduce((s, p) => s + p.currentBiomassKg, 0);
  const totalFish = ponds.reduce((s, p) => s + p.stockedCount, 0);
  const criticalPonds = ponds.filter(p => p.status === 'critical').length;
  const todayFeed = feeding.filter(f => new Date(f.fedAt).toDateString() === new Date().toDateString()).reduce((s, f) => s + f.feedKg, 0);

  const TABS = [
    { id:'overview', label:'Overview' }, { id:'ponds', label:'All Ponds' },
    { id:'feeding', label:'Feeding Log' }, { id:'quality', label:'Water Quality' },
    { id:'log', label:'Records' },
  ] as const;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Fish className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Aquaculture Dashboard</h1>
            <p className="text-cyan-100 text-sm">Real-time pond monitoring · aeration · feeding · water quality</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'Ponds / Tanks', value: ponds.length },
            { label:'Total Fish', value: totalFish.toLocaleString() },
            { label:'Total Biomass', value: `${totalBiomass} kg` },
            { label:'Critical Ponds', value: criticalPonds, hl: criticalPonds > 0 },
          ].map(s => (
            <div key={s.label} className={`rounded-lg p-3 ${s.hl ? 'bg-red-500/30 border border-red-400/40' : 'bg-white/10'}`}>
              <div className="text-xs text-white/70 mb-1">{s.label}</div>
              <div className="text-2xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {unresolvedAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-700 font-semibold">
            <AlertTriangle className="w-4 h-4" />{unresolvedAlerts.length} Pond Alert{unresolvedAlerts.length>1?'s':''} — Needs Attention
          </div>
          {unresolvedAlerts.map(a => (
            <div key={a.id} className="flex items-start gap-3 bg-white rounded-lg border border-red-100 px-4 py-2.5">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-800">{a.pondName}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${a.severity==='critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{a.severity.toUpperCase()}</span>
                </div>
                <div className="text-xs text-slate-600">{a.parameter}: <strong>{a.value} {a.unit}</strong> (threshold: {a.threshold}) · {fmtTs(a.ts)}</div>
              </div>
              <button onClick={() => resolveAlert(a.id)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                <CheckCircle className="w-3 h-3" /> Resolve
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${tab===t.id ? 'bg-cyan-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={() => setFeedForm(v=>!v)} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"><Fish className="w-4 h-4" /> Feed</button>
          <button onClick={() => setAddPond(true)} className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700"><Plus className="w-4 h-4" /> Add Pond</button>
        </div>
      </div>

      {/* Feed form */}
      {showFeedForm && (
        <form onSubmit={e => { e.preventDefault(); if(!feedF.pondId||!feedF.feedKg) return; const ev: FeedingEvent = {id:`f-${uid()}`,pondId:feedF.pondId,feedKg:parseFloat(feedF.feedKg),feedType:feedF.feedType,method:'manual',notes:feedF.notes,fedAt:new Date().toISOString()}; sv(LS.FEEDING,setFeeding,[...feeding,ev]); setFeedForm(false); setFeedF({pondId:'',feedKg:'',feedType:'Coppens 3mm',notes:''}); }} className="bg-white border border-green-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-slate-800">Log Feeding</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="block text-xs text-slate-500 mb-1">Pond *</label>
              <select required value={feedF.pondId} onChange={e=>setFeedF(f=>({...f,pondId:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Select…</option>{ponds.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="block text-xs text-slate-500 mb-1">Feed (kg) *</label>
              <input required type="number" value={feedF.feedKg} onChange={e=>setFeedF(f=>({...f,feedKg:e.target.value}))} placeholder="12.5" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Feed Type</label>
              <input value={feedF.feedType} onChange={e=>setFeedF(f=>({...f,feedType:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Notes</label>
              <input value={feedF.notes} onChange={e=>setFeedF(f=>({...f,notes:e.target.value}))} placeholder="Good appetite…" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Log Feed</button>
            <button type="button" onClick={() => setFeedForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">Cancel</button>
          </div>
        </form>
      )}

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Pond grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ponds.map(p => (
              <PondCard key={p.id} pond={p} selected={selectedId===p.id} onAerator={toggleAerator} onSelect={setSelected} />
            ))}
          </div>

          {/* Selected pond detail */}
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-slate-800">{selected.name} — Detail View</h3>
                <button onClick={() => simulateUpdate(selected.id)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Readings
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DOTrendChart pond={selected} />
                {/* Parameter details */}
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <h4 className="font-medium text-slate-800 mb-3 text-sm">All Parameters</h4>
                  <div className="space-y-2">
                    {[
                      { key:'do_mgl', label:'Dissolved Oxygen', val:selected.do_mgl, unit:'mg/L', range:'Optimal: 6–10 mg/L' },
                      { key:'ph', label:'pH', val:selected.ph, unit:'pH', range:'Optimal: 6.5–8.5' },
                      { key:'tempC', label:'Water Temperature', val:selected.tempC, unit:'°C', range:'Optimal: 22–30°C' },
                      { key:'ammoniaMgl', label:'Ammonia (NH₃-N)', val:selected.ammoniaMgl, unit:'mg/L', range:'Safe: < 0.05 mg/L' },
                      { key:'turbidityNtu', label:'Turbidity', val:selected.turbidityNtu, unit:'NTU', range:'Good: < 20 NTU' },
                      { key:'levelPct', label:'Water Level', val:selected.levelPct, unit:'%', range:'Keep: > 80%' },
                    ].map(row => {
                      const st = paramStatus(row.key, row.val);
                      const bar = Math.min(100, Math.max(0, row.key === 'do_mgl' ? (row.val/12)*100 : row.key === 'ph' ? (row.val/14)*100 : row.key === 'tempC' ? ((row.val-15)/25)*100 : row.key === 'ammoniaMgl' ? Math.max(0,100-(row.val/0.3)*100) : row.key === 'turbidityNtu' ? Math.max(0,100-(row.val/50)*100) : row.val));
                      return (
                        <div key={row.key}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs text-slate-600">{row.label}</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-bold tabular-nums ${st==='critical'?'text-red-600':st==='warning'?'text-amber-600':'text-green-600'}`}>{row.val} {row.unit}</span>
                              <span className="text-[9px] text-slate-400">({row.range})</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full transition-all ${st==='critical'?'bg-red-500':st==='warning'?'bg-amber-400':'bg-green-500'}`} style={{ width:`${bar}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ALL PONDS */}
      {tab === 'ponds' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ponds.map(p => (
              <div key={p.id}>
                <PondCard pond={p} selected={false} onAerator={toggleAerator} onSelect={() => { setSelected(p.id); setTab('overview'); }} />
                <button onClick={() => { if(confirm(`Delete "${p.name}"?`)) sv(LS.PONDS, setPonds, ponds.filter(x=>x.id!==p.id)); }} className="mt-1 text-xs text-red-400 hover:text-red-600 flex items-center gap-1 px-2"><Trash2 className="w-3 h-3" /> Remove</button>
              </div>
            ))}
          </div>
          {showAddPond && <AddPondModal enterprises={enterprises} onSave={p => { sv(LS.PONDS,setPonds,[...ponds,p]); }} onClose={() => setAddPond(false)} />}
        </div>
      )}

      {/* FEEDING LOG */}
      {tab === 'feeding' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:"Today's Feed", value:`${todayFeed.toFixed(1)} kg` },
              { label:'Feed Events (total)', value: feeding.length },
              { label:'Most Recent', value: feeding.length > 0 ? fmtTs([...feeding].sort((a,b)=>new Date(b.fedAt).getTime()-new Date(a.fedAt).getTime())[0].fedAt) : '—' },
              { label:'Ponds Fed Today', value: new Set(feeding.filter(f=>new Date(f.fedAt).toDateString()===new Date().toDateString()).map(f=>f.pondId)).size },
            ].map(s => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-400 mb-1">{s.label}</div>
                <div className="text-xl font-bold text-slate-800">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 font-semibold text-sm text-slate-800">Feeding Log</div>
            {feeding.length === 0 ? <div className="px-5 py-8 text-slate-400 text-sm text-center">No feeding events logged.</div> : (
              [...feeding].sort((a,b)=>new Date(b.fedAt).getTime()-new Date(a.fedAt).getTime()).map(f => {
                const pond = ponds.find(p=>p.id===f.pondId);
                return (
                  <div key={f.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0">
                    <Fish className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800">{pond?.name ?? 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{f.feedKg} kg · {f.feedType} · {f.method}{f.notes ? ` · ${f.notes}` : ''}</div>
                    </div>
                    <div className="text-xs text-slate-400 flex-shrink-0">{fmtTs(f.fedAt)}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* WATER QUALITY */}
      {tab === 'quality' && (
        <div className="space-y-4">
          <div className="flex gap-2 justify-end">
            <button onClick={() => setWaterForm(v=>!v)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"><Droplets className="w-4 h-4" /> Log Water Change</button>
          </div>
          {showWaterForm && (
            <form onSubmit={e => { e.preventDefault(); if(!waterF.pondId||!waterF.pctChanged) return; const wc: WaterChangeLog = {id:`wc-${uid()}`,pondId:waterF.pondId,pctChanged:parseInt(waterF.pctChanged),reason:waterF.reason,performedAt:new Date().toISOString()}; sv(LS.WATER,setWater,[...water,wc]); setWaterForm(false); setWaterF({pondId:'',pctChanged:'',reason:''}); }} className="bg-white border border-blue-200 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold">Log Water Change</h3>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs text-slate-500 mb-1">Pond</label>
                  <select required value={waterF.pondId} onChange={e=>setWaterF(f=>({...f,pondId:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select…</option>{ponds.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div><label className="block text-xs text-slate-500 mb-1">% Changed</label>
                  <input required type="number" value={waterF.pctChanged} onChange={e=>setWaterF(f=>({...f,pctChanged:e.target.value}))} placeholder="30" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs text-slate-500 mb-1">Reason</label>
                  <input value={waterF.reason} onChange={e=>setWaterF(f=>({...f,reason:e.target.value}))} placeholder="High ammonia / routine" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save</button>
                <button type="button" onClick={() => setWaterForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">Cancel</button>
              </div>
            </form>
          )}
          {/* Parameter summary table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 font-semibold text-sm text-slate-800">Current Parameters — All Ponds</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-2 text-left">Pond</th>
                  <th className="px-3 py-2">DO (mg/L)</th><th className="px-3 py-2">pH</th>
                  <th className="px-3 py-2">Temp (°C)</th><th className="px-3 py-2">NH₃ (mg/L)</th>
                  <th className="px-3 py-2">Turbidity</th><th className="px-3 py-2">Status</th>
                </tr></thead>
                <tbody>
                  {ponds.map(p => (
                    <tr key={p.id} className={`border-t border-slate-50 ${p.status==='critical' ? 'bg-red-50' : p.status==='fair' ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-4 py-2.5 font-medium text-slate-800 text-xs">{p.name}</td>
                      {[
                        { key:'do_mgl', val:p.do_mgl },
                        { key:'ph', val:p.ph },
                        { key:'tempC', val:p.tempC },
                        { key:'ammoniaMgl', val:p.ammoniaMgl },
                        { key:'turbidityNtu', val:p.turbidityNtu },
                      ].map(row => {
                        const st = paramStatus(row.key, row.val);
                        return (
                          <td key={row.key} className={`px-3 py-2.5 text-center tabular-nums text-xs font-medium ${st==='critical'?'text-red-600':st==='warning'?'text-amber-600':'text-green-700'}`}>
                            {row.val}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-center"><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Water change log */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 font-semibold text-sm text-slate-800">Water Change Log</div>
            {water.length === 0 ? <div className="px-5 py-6 text-slate-400 text-sm text-center">No water changes recorded.</div> : (
              [...water].sort((a,b)=>new Date(b.performedAt).getTime()-new Date(a.performedAt).getTime()).map(wc => (
                <div key={wc.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0">
                  <Droplets className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800">{ponds.find(p=>p.id===wc.pondId)?.name ?? 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{wc.pctChanged}% water exchanged{wc.reason ? ` — ${wc.reason}` : ''}</div>
                  </div>
                  <div className="text-xs text-slate-400 flex-shrink-0">{fmtTs(wc.performedAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* RECORDS */}
      {tab === 'log' && (
        <div className="space-y-4">
          <div className="flex gap-2 justify-end">
            <button onClick={() => setMortForm(v=>!v)} className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"><AlertTriangle className="w-4 h-4" /> Log Mortality</button>
          </div>
          {showMortForm && (
            <form onSubmit={e => { e.preventDefault(); if(!mortF.pondId||!mortF.count) return; const m: MortalityLog = {id:`m-${uid()}`,pondId:mortF.pondId,count:parseInt(mortF.count),estimatedWeightG:parseInt(mortF.estimatedWeightG)||0,cause:mortF.cause,loggedAt:new Date().toISOString()}; sv(LS.MORT,setMort,[...mort,m]); setMortForm(false); setMortF({pondId:'',count:'',estimatedWeightG:'',cause:''}); }} className="bg-white border border-red-200 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold">Log Mortality</h3>
              <div className="grid grid-cols-4 gap-3">
                <div><label className="block text-xs text-slate-500 mb-1">Pond</label>
                  <select required value={mortF.pondId} onChange={e=>setMortF(f=>({...f,pondId:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"><option value="">Select…</option>{ponds.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div><label className="block text-xs text-slate-500 mb-1">Count</label>
                  <input required type="number" value={mortF.count} onChange={e=>setMortF(f=>({...f,count:e.target.value}))} placeholder="5" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs text-slate-500 mb-1">Avg Weight (g)</label>
                  <input type="number" value={mortF.estimatedWeightG} onChange={e=>setMortF(f=>({...f,estimatedWeightG:e.target.value}))} placeholder="200" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs text-slate-500 mb-1">Cause</label>
                  <input value={mortF.cause} onChange={e=>setMortF(f=>({...f,cause:e.target.value}))} placeholder="Low DO / unknown" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Log</button>
                <button type="button" onClick={() => setMortForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          )}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 font-semibold text-sm text-slate-800">Mortality Records</div>
            {mort.length === 0 ? <div className="px-5 py-6 text-slate-400 text-sm text-center">No mortality records.</div> : (
              [...mort].sort((a,b)=>new Date(b.loggedAt).getTime()-new Date(a.loggedAt).getTime()).map(m => (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-800">{ponds.find(p=>p.id===m.pondId)?.name ?? 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{m.count} fish dead · {m.estimatedWeightG > 0 ? `avg ${m.estimatedWeightG}g · ${(m.count*m.estimatedWeightG/1000).toFixed(2)}kg lost` : ''} · {m.cause||'Cause unknown'}</div>
                  </div>
                  <div className="text-xs text-slate-400 flex-shrink-0">{fmtTs(m.loggedAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showAddPond && tab !== 'ponds' && <AddPondModal enterprises={enterprises} onSave={p => { sv(LS.PONDS,setPonds,[...ponds,p]); setAddPond(false); }} onClose={() => setAddPond(false)} />}
    </div>
  );
}
