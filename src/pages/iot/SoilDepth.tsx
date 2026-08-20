/**
 * Soil Depth Profiling — 4-depth moisture/temperature profiles per zone
 * Fully localStorage-based; no backend required.
 */
import React, { useState, useMemo } from 'react';
import {
  Layers, Droplets, Thermometer, AlertTriangle, CheckCircle,
  Plus, X, RefreshCw, BarChart3, TrendingDown, TrendingUp,
  MapPin, Clock, Activity,
} from 'lucide-react';
import { useOrg } from '@/store/orgStore';

// ─── Types ─────────────────────────────────────────────────────────────────────

type SoilTextureType = 'sandy' | 'loam' | 'clay_loam' | 'clay' | 'silt_loam' | 'sandy_loam';
type CropType = 'maize' | 'wheat' | 'soybean' | 'cassava' | 'tomato' | 'lettuce' | 'rice' | 'sorghum' | 'pasture' | 'fallow';

interface SoilDepthReading {
  depth_cm: 10 | 30 | 60 | 90;
  moisturePct: number;   // volumetric water content %
  tempC: number;
  ecDs: number;          // electrical conductivity dS/m
}

interface SoilZone {
  id: string;
  name: string;
  enterpriseId: string;
  location: string;
  areaHa: number;
  texture: SoilTextureType;
  crop: CropType;
  cropStage: string;
  irrigationActive: boolean;
  // 4-depth profile (10, 30, 60, 90 cm)
  depths: SoilDepthReading[];
  // Derived
  avgMoisturePct: number;
  depletionPct: number;   // % of plant-available water depleted
  irrigationNeededMm: number;
  lastIrrigated: string | null;
  status: 'optimal' | 'adequate' | 'stress' | 'critical';
  addedAt: string;
}

interface IrrigationEvent {
  id: string;
  zoneId: string;
  depthMm: number;
  durationMin: number;
  method: 'drip' | 'sprinkler' | 'furrow' | 'flood';
  triggeredBy: 'manual' | 'rule' | 'schedule';
  performedAt: string;
}

interface SoilAlert {
  id: string;
  zoneId: string;
  zoneName: string;
  type: string;
  severity: 'warning' | 'critical';
  message: string;
  ts: string;
  resolved: boolean;
}

// ─── Soil texture properties ────────────────────────────────────────────────────
const TEXTURE_PROPS: Record<SoilTextureType, { fc: number; pwp: number; label: string }> = {
  sandy:      { fc: 12, pwp: 4,  label: 'Sandy' },
  sandy_loam: { fc: 18, pwp: 6,  label: 'Sandy Loam' },
  loam:       { fc: 28, pwp: 12, label: 'Loam' },
  silt_loam:  { fc: 32, pwp: 14, label: 'Silt Loam' },
  clay_loam:  { fc: 36, pwp: 18, label: 'Clay Loam' },
  clay:       { fc: 42, pwp: 22, label: 'Clay' },
};

const CROP_LABELS: Record<CropType, string> = {
  maize:'Maize', wheat:'Wheat', soybean:'Soybean', cassava:'Cassava',
  tomato:'Tomato', lettuce:'Lettuce', rice:'Rice', sorghum:'Sorghum', pasture:'Pasture', fallow:'Fallow',
};

// ─── localStorage ──────────────────────────────────────────────────────────────
const LS = {
  ZONES:  'agronexus_v2_sd_zones',
  IRRIG:  'agronexus_v2_sd_irrigation',
  ALERTS: 'agronexus_v2_sd_alerts',
};

// ─── Seed data ─────────────────────────────────────────────────────────────────

function buildZone(overrides: Partial<SoilZone> & { id:string; name:string; texture:SoilTextureType }): SoilZone {
  const tex = TEXTURE_PROPS[overrides.texture];
  const depths: SoilDepthReading[] = [
    { depth_cm:10, moisturePct: overrides.depths?.[0]?.moisturePct ?? tex.fc * 0.85, tempC: overrides.depths?.[0]?.tempC ?? 26, ecDs: 0.4 },
    { depth_cm:30, moisturePct: overrides.depths?.[1]?.moisturePct ?? tex.fc * 0.80, tempC: overrides.depths?.[1]?.tempC ?? 24, ecDs: 0.5 },
    { depth_cm:60, moisturePct: overrides.depths?.[2]?.moisturePct ?? tex.fc * 0.75, tempC: overrides.depths?.[2]?.tempC ?? 22, ecDs: 0.6 },
    { depth_cm:90, moisturePct: overrides.depths?.[3]?.moisturePct ?? tex.fc * 0.70, tempC: overrides.depths?.[3]?.tempC ?? 20, ecDs: 0.7 },
  ];
  const avgM = depths.reduce((s, d) => s + d.moisturePct, 0) / 4;
  const paw = tex.fc - tex.pwp;
  const depletion = paw > 0 ? Math.max(0, Math.min(100, ((tex.fc - avgM) / paw) * 100)) : 0;
  const irrNeeded = depletion > 50 ? parseFloat(((depletion / 100) * paw * 10).toFixed(1)) : 0;
  const status: SoilZone['status'] = depletion > 75 ? 'critical' : depletion > 50 ? 'stress' : depletion > 25 ? 'adequate' : 'optimal';
  return {
    enterpriseId:'', location:'', areaHa:1, crop:'maize', cropStage:'',
    irrigationActive:false, avgMoisturePct:parseFloat(avgM.toFixed(1)),
    depletionPct:parseFloat(depletion.toFixed(0)),
    irrigationNeededMm:irrNeeded,
    lastIrrigated:null, status, addedAt:new Date().toISOString(),
    ...overrides, depths,
  };
}

function mkSeeds(enterprises: {id:string}[]) {
  const eid = enterprises[0]?.id ?? '';
  const ZONES: SoilZone[] = [
    buildZone({ id:'z-1', name:'Field A — Maize Block', enterpriseId:eid, location:'North quadrant', areaHa:12, texture:'loam', crop:'maize', cropStage:'Vegetative V6', irrigationActive:false, lastIrrigated:new Date(Date.now()-3*86400000).toISOString(),
      depths:[{depth_cm:10,moisturePct:14,tempC:28,ecDs:0.4},{depth_cm:30,moisturePct:18,tempC:25,ecDs:0.5},{depth_cm:60,moisturePct:22,tempC:22,ecDs:0.6},{depth_cm:90,moisturePct:24,tempC:20,ecDs:0.7}] }),
    buildZone({ id:'z-2', name:'Field B — Tomato Rows', enterpriseId:eid, location:'East wing', areaHa:3, texture:'sandy_loam', crop:'tomato', cropStage:'Flowering', irrigationActive:true, lastIrrigated:new Date(Date.now()-86400000).toISOString(),
      depths:[{depth_cm:10,moisturePct:9,tempC:30,ecDs:0.6},{depth_cm:30,moisturePct:11,tempC:27,ecDs:0.7},{depth_cm:60,moisturePct:13,tempC:24,ecDs:0.8},{depth_cm:90,moisturePct:15,tempC:21,ecDs:0.9}] }),
    buildZone({ id:'z-3', name:'Pasture Block — Kikuyu', enterpriseId:eid, location:'South paddock', areaHa:20, texture:'clay_loam', crop:'pasture', cropStage:'Active growth', irrigationActive:false, lastIrrigated:null,
      depths:[{depth_cm:10,moisturePct:30,tempC:26,ecDs:0.3},{depth_cm:30,moisturePct:34,tempC:23,ecDs:0.4},{depth_cm:60,moisturePct:35,tempC:20,ecDs:0.5},{depth_cm:90,moisturePct:36,tempC:18,ecDs:0.6}] }),
    buildZone({ id:'z-4', name:'Field C — Soybean Plot', enterpriseId:eid, location:'West block', areaHa:8, texture:'clay', crop:'soybean', cropStage:'Podding R4', irrigationActive:false, lastIrrigated:new Date(Date.now()-5*86400000).toISOString(),
      depths:[{depth_cm:10,moisturePct:8,tempC:32,ecDs:0.5},{depth_cm:30,moisturePct:10,tempC:28,ecDs:0.6},{depth_cm:60,moisturePct:14,tempC:24,ecDs:0.7},{depth_cm:90,moisturePct:18,tempC:20,ecDs:0.8}] }),
  ];

  const IRRIG: IrrigationEvent[] = [
    { id:'ir-1', zoneId:'z-2', depthMm:25, durationMin:90, method:'drip', triggeredBy:'rule', performedAt:new Date(Date.now()-86400000).toISOString() },
    { id:'ir-2', zoneId:'z-1', depthMm:30, durationMin:120, method:'sprinkler', triggeredBy:'manual', performedAt:new Date(Date.now()-3*86400000).toISOString() },
    { id:'ir-3', zoneId:'z-4', depthMm:40, durationMin:180, method:'furrow', triggeredBy:'manual', performedAt:new Date(Date.now()-5*86400000).toISOString() },
  ];

  const ALERTS: SoilAlert[] = [
    { id:'sa-1', zoneId:'z-4', zoneName:'Field C — Soybean Plot', type:'Critical Moisture', severity:'critical', message:'All 4 depths below permanent wilting point. Irrigation urgently required.', ts:new Date(Date.now()-3*3600000).toISOString(), resolved:false },
    { id:'sa-2', zoneId:'z-1', zoneName:'Field A — Maize Block', type:'Moisture Stress', severity:'warning', message:'Root zone (10–30cm) moisture below 50% of plant-available water.', ts:new Date(Date.now()-6*3600000).toISOString(), resolved:false },
  ];

  return { ZONES, IRRIG, ALERTS };
}

// ─── Utilities ─────────────────────────────────────────────────────────────────
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
  if (diff < 7*86400) return `${Math.floor(diff/86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── Depth Profile Chart ────────────────────────────────────────────────────────

function DepthProfileChart({ zone }: { zone: SoilZone }) {
  const tex = TEXTURE_PROPS[zone.texture];
  const depths = zone.depths;
  const maxM = Math.max(tex.fc + 5, ...depths.map(d => d.moisturePct));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 text-sm">Soil Moisture Profile</h3>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block border-dashed border border-blue-400" /> FC</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-400 inline-block border-dashed border border-red-400" /> PWP</span>
        </div>
      </div>
      <div className="flex gap-6">
        {/* Vertical depth axis */}
        <div className="flex flex-col justify-between text-[11px] text-slate-400 font-mono py-1" style={{ height: 200 }}>
          {depths.map(d => <span key={d.depth_cm}>{d.depth_cm}cm</span>)}
        </div>
        {/* Chart area */}
        <div className="flex-1 relative" style={{ height: 200 }}>
          <svg viewBox={`0 0 300 200`} className="w-full h-full">
            {/* FC and PWP reference lines */}
            <line x1={tex.fc / maxM * 280 + 10} y1={0} x2={tex.fc / maxM * 280 + 10} y2={200} stroke="#60a5fa" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
            <line x1={tex.pwp / maxM * 280 + 10} y1={0} x2={tex.pwp / maxM * 280 + 10} y2={200} stroke="#f87171" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
            {/* Horizontal guide lines */}
            {depths.map((d, i) => (
              <line key={i} x1={0} y1={i * (200/3)} x2={300} y2={i * (200/3)} stroke="#e2e8f0" strokeWidth={0.5} />
            ))}
            {/* PAW fill zones */}
            {depths.map((d, i) => {
              const y = i * (200/3);
              const h = 200/3 - 4;
              const pw = Math.max(4, (d.moisturePct / maxM) * 280 + 10);
              const paw = tex.fc - tex.pwp;
              const depletedPct = paw > 0 ? Math.max(0, (tex.fc - d.moisturePct) / paw) : 0;
              const color = depletedPct > 0.75 ? '#ef4444' : depletedPct > 0.5 ? '#f59e0b' : '#22c55e';
              return (
                <g key={i}>
                  <rect x={10} y={y + 2} width={pw - 10} height={h} fill={color} opacity={0.15} rx={2} />
                  <rect x={10} y={y + 2} width={pw - 10} height={h} fill="none" stroke={color} strokeWidth={1.5} rx={2} />
                  <text x={pw + 4} y={y + h/2 + 5} fontSize={10} fill={color} fontWeight="bold">{d.moisturePct}%</text>
                  <text x={pw + 32} y={y + h/2 + 5} fontSize={9} fill="#94a3b8">{d.tempC}°C</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      {/* PAW Legend */}
      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[10px]">
        {depths.map(d => {
          const paw = tex.fc - tex.pwp;
          const dep = paw > 0 ? Math.max(0, Math.min(100, ((tex.fc - d.moisturePct) / paw) * 100)) : 0;
          const color = dep > 75 ? 'text-red-600' : dep > 50 ? 'text-amber-600' : 'text-green-600';
          return (
            <div key={d.depth_cm} className="bg-slate-50 rounded-lg py-1.5">
              <div className="text-slate-400 mb-0.5">{d.depth_cm}cm</div>
              <div className={`font-bold ${color}`}>{dep.toFixed(0)}% depleted</div>
              <div className="text-slate-400">EC: {d.ecDs} dS/m</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Zone Card ──────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<SoilZone['status'], { label:string; bg:string; text:string; border:string; barColor:string }> = {
  optimal:  { label:'Optimal',  bg:'bg-green-100',   text:'text-green-700',   border:'border-green-200',  barColor:'bg-green-500' },
  adequate: { label:'Adequate', bg:'bg-blue-100',    text:'text-blue-700',    border:'border-blue-200',   barColor:'bg-blue-500' },
  stress:   { label:'Stress',   bg:'bg-amber-100',   text:'text-amber-700',   border:'border-amber-200',  barColor:'bg-amber-400' },
  critical: { label:'Critical', bg:'bg-red-100',     text:'text-red-700',     border:'border-red-200',    barColor:'bg-red-500' },
};

function ZoneCard({ zone, selected, onClick }: { zone: SoilZone; selected: boolean; onClick: () => void }) {
  const cfg = STATUS_CFG[zone.status];
  const tex = TEXTURE_PROPS[zone.texture];
  const paw = tex.fc - tex.pwp;
  return (
    <div onClick={onClick} className={`bg-white rounded-xl border-2 cursor-pointer transition-all hover:shadow-md p-4 ${selected ? 'border-green-500 shadow-md' : zone.status==='critical'?'border-red-200':zone.status==='stress'?'border-amber-200':'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{cfg.label}</span>
            {zone.irrigationActive && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-0.5"><Droplets className="w-2.5 h-2.5" />Irrigating</span>}
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">{zone.name}</h3>
          <p className="text-[10px] text-slate-400">{zone.areaHa}ha · {CROP_LABELS[zone.crop]} · {TEXTURE_PROPS[zone.texture].label}</p>
        </div>
        <Layers className="w-5 h-5 text-slate-300 flex-shrink-0" />
      </div>
      {/* Depletion bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-0.5">
          <span className="text-slate-500">PAW Depletion</span>
          <span className={`font-bold ${cfg.text}`}>{zone.depletionPct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5">
          <div className={`h-2.5 rounded-full ${cfg.barColor}`} style={{ width:`${zone.depletionPct}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
          <span>FC: {tex.fc}%</span><span>PWP: {tex.pwp}%</span>
        </div>
      </div>
      {/* Depth moisture chips */}
      <div className="flex gap-1 overflow-x-auto">
        {zone.depths.map(d => {
          const dep = paw > 0 ? ((tex.fc - d.moisturePct) / paw) : 0;
          const chipColor = dep > 0.75 ? 'bg-red-50 border-red-200 text-red-700' : dep > 0.5 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-green-50 border-green-200 text-green-700';
          return (
            <div key={d.depth_cm} className={`border rounded-lg px-2 py-1 text-center flex-shrink-0 ${chipColor}`}>
              <div className="text-[9px] font-medium opacity-70">{d.depth_cm}cm</div>
              <div className="text-xs font-bold">{d.moisturePct}%</div>
            </div>
          );
        })}
      </div>
      {zone.irrigationNeededMm > 0 && (
        <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
          <Droplets className="w-3 h-3" /> Irrigation needed: ~{zone.irrigationNeededMm}mm
        </div>
      )}
      {zone.lastIrrigated && (
        <div className="mt-1.5 text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Last irrigated: {fmtTs(zone.lastIrrigated)}</div>
      )}
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────

export default function SoilDepth() {
  const { org } = useOrg();
  const enterprises = (org?.enterprises ?? []).map(e => ({ id: e.id, name: e.name }));
  const seeds = useMemo(() => mkSeeds(enterprises), []);

  const [zones,   setZones]   = useState<SoilZone[]>(() => ls(LS.ZONES, seeds.ZONES));
  const [irrig,   setIrrig]   = useState<IrrigationEvent[]>(() => ls(LS.IRRIG, seeds.IRRIG));
  const [alerts,  setAlerts]  = useState<SoilAlert[]>(() => ls(LS.ALERTS, seeds.ALERTS));

  const [tab, setTab]         = useState<'overview'|'profiles'|'irrigation'|'analysis'>('overview');
  const [selectedId, setSelected] = useState<string>(zones[0]?.id ?? '');

  const [showIrrigForm, setIrrigForm] = useState(false);
  const [irrigF, setIrrigF]     = useState({ zoneId:'', depthMm:'', method:'drip' as IrrigationEvent['method'], durationMin:'', notes:'' });
  const [showAddZone, setAddZone] = useState(false);
  const [newZone, setNewZone]   = useState({ name:'', texture:'loam' as SoilTextureType, crop:'maize' as CropType, areaHa:'', location:'' });

  function sv<T>(key: string, setter: React.Dispatch<React.SetStateAction<T>>, val: T) { setter(val); lsSet(key, val); }

  function simulateReadings(id: string) {
    const n = zones.map(z => {
      if (z.id !== id) return z;
      const tex = TEXTURE_PROPS[z.texture];
      const delta = z.irrigationActive ? 1.5 : -0.8;
      const newDepths = z.depths.map(d => ({
        ...d,
        moisturePct: parseFloat(Math.max(tex.pwp * 0.5, Math.min(tex.fc, d.moisturePct + delta + (Math.random()-0.5)*0.8)).toFixed(1)),
        tempC: parseFloat((d.tempC + (Math.random()-0.5)*0.5).toFixed(1)),
      }));
      const avgM = newDepths.reduce((s, d) => s + d.moisturePct, 0) / 4;
      const paw = tex.fc - tex.pwp;
      const dep = paw > 0 ? Math.max(0, Math.min(100, ((tex.fc - avgM) / paw) * 100)) : 0;
      const irrNeeded = dep > 50 ? parseFloat(((dep / 100) * paw * 10).toFixed(1)) : 0;
      const status: SoilZone['status'] = dep > 75 ? 'critical' : dep > 50 ? 'stress' : dep > 25 ? 'adequate' : 'optimal';
      return { ...z, depths: newDepths as SoilZone['depths'], avgMoisturePct: parseFloat(avgM.toFixed(1)), depletionPct: parseFloat(dep.toFixed(0)), irrigationNeededMm: irrNeeded, status };
    });
    sv(LS.ZONES, setZones, n);
  }

  function logIrrigation(e: React.FormEvent) {
    e.preventDefault();
    if (!irrigF.zoneId || !irrigF.depthMm) return;
    const ev: IrrigationEvent = {
      id: `ir-${uid()}`, zoneId: irrigF.zoneId, depthMm: parseInt(irrigF.depthMm),
      durationMin: parseInt(irrigF.durationMin) || 60, method: irrigF.method,
      triggeredBy: 'manual', performedAt: new Date().toISOString(),
    };
    sv(LS.IRRIG, setIrrig, [...irrig, ev]);
    // Update zone last irrigated
    const n = zones.map(z => z.id === irrigF.zoneId ? { ...z, lastIrrigated: new Date().toISOString(), irrigationActive: false } : z);
    sv(LS.ZONES, setZones, n);
    setIrrigForm(false);
    setIrrigF({ zoneId:'', depthMm:'', method:'drip', durationMin:'', notes:'' });
  }

  function addZone(e: React.FormEvent) {
    e.preventDefault();
    const z = buildZone({
      id: `z-${uid()}`, name: newZone.name, enterpriseId: enterprises[0]?.id ?? '',
      texture: newZone.texture, crop: newZone.crop,
      areaHa: parseFloat(newZone.areaHa) || 1, location: newZone.location,
    });
    sv(LS.ZONES, setZones, [...zones, z]);
    setAddZone(false);
    setNewZone({ name:'', texture:'loam', crop:'maize', areaHa:'', location:'' });
  }

  function resolveAlert(id: string) {
    sv(LS.ALERTS, setAlerts, alerts.map(a => a.id === id ? { ...a, resolved: true } : a));
  }

  const selected = zones.find(z => z.id === selectedId) ?? zones[0];
  const unresolved = alerts.filter(a => !a.resolved);
  const critZones = zones.filter(z => z.status === 'critical').length;
  const stressZones = zones.filter(z => z.status === 'stress').length;
  const totalHa = zones.reduce((s, z) => s + z.areaHa, 0);
  const avgDepletion = zones.length > 0 ? Math.round(zones.reduce((s, z) => s + z.depletionPct, 0) / zones.length) : 0;

  const TABS = [
    { id:'overview', label:'Overview' }, { id:'profiles', label:'Depth Profiles' },
    { id:'irrigation', label:'Irrigation Log' }, { id:'analysis', label:'Analysis' },
  ] as const;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Soil Depth Profiling</h1>
            <p className="text-amber-100 text-sm">4-depth moisture · temperature · EC · plant-available water depletion</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'Monitored Zones', value: zones.length },
            { label:'Total Area', value:`${totalHa} ha` },
            { label:'Avg PAW Depletion', value:`${avgDepletion}%`, hl: avgDepletion > 50 },
            { label:'Zones Needing Water', value: critZones + stressZones, hl: critZones + stressZones > 0 },
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
            <AlertTriangle className="w-4 h-4" /> {unresolved.length} Soil Alert{unresolved.length>1?'s':''}
          </div>
          {unresolved.map(a => (
            <div key={a.id} className="flex items-start gap-3 bg-white rounded-lg border border-red-100 px-4 py-2.5">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-800">{a.zoneName}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${a.severity==='critical'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{a.severity.toUpperCase()}</span>
                </div>
                <div className="text-xs text-slate-600">{a.message}</div>
              </div>
              <button onClick={() => resolveAlert(a.id)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1 flex-shrink-0">
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
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${tab===t.id ? 'bg-amber-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={() => setIrrigForm(v=>!v)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"><Droplets className="w-4 h-4" /> Log Irrigation</button>
          <button onClick={() => setAddZone(v=>!v)} className="flex items-center gap-1.5 px-3 py-2 bg-amber-700 text-white text-sm rounded-lg hover:bg-amber-800"><Plus className="w-4 h-4" /> Add Zone</button>
        </div>
      </div>

      {/* Quick forms */}
      {showIrrigForm && (
        <form onSubmit={logIrrigation} className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-slate-800">Log Irrigation Event</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="block text-xs text-slate-500 mb-1">Zone *</label><select required value={irrigF.zoneId} onChange={e=>setIrrigF(f=>({...f,zoneId:e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"><option value="">Select…</option>{zones.map(z=><option key={z.id} value={z.id}>{z.name}</option>)}</select></div>
            <div><label className="block text-xs text-slate-500 mb-1">Depth (mm) *</label><input required type="number" value={irrigF.depthMm} onChange={e=>setIrrigF(f=>({...f,depthMm:e.target.value}))} placeholder="25" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Method</label><select value={irrigF.method} onChange={e=>setIrrigF(f=>({...f,method:e.target.value as any}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"><option value="drip">Drip</option><option value="sprinkler">Sprinkler</option><option value="furrow">Furrow</option><option value="flood">Flood</option></select></div>
            <div><label className="block text-xs text-slate-500 mb-1">Duration (min)</label><input type="number" value={irrigF.durationMin} onChange={e=>setIrrigF(f=>({...f,durationMin:e.target.value}))} placeholder="90" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Save</button>
            <button type="button" onClick={() => setIrrigForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">Cancel</button>
          </div>
        </form>
      )}

      {showAddZone && (
        <form onSubmit={addZone} className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-slate-800">Add Monitoring Zone</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="col-span-2"><label className="block text-xs text-slate-500 mb-1">Zone Name *</label><input required value={newZone.name} onChange={e=>setNewZone(f=>({...f,name:e.target.value}))} placeholder="Field D — Maize Block" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Texture</label><select value={newZone.texture} onChange={e=>setNewZone(f=>({...f,texture:e.target.value as any}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">{Object.entries(TEXTURE_PROPS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></div>
            <div><label className="block text-xs text-slate-500 mb-1">Crop</label><select value={newZone.crop} onChange={e=>setNewZone(f=>({...f,crop:e.target.value as any}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">{Object.entries(CROP_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
            <div><label className="block text-xs text-slate-500 mb-1">Area (ha)</label><input type="number" value={newZone.areaHa} onChange={e=>setNewZone(f=>({...f,areaHa:e.target.value}))} placeholder="5" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-amber-700 text-white rounded-lg text-sm hover:bg-amber-800">Add Zone</button>
            <button type="button" onClick={() => setAddZone(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">Cancel</button>
          </div>
        </form>
      )}

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {zones.map(z => (
            <ZoneCard key={z.id} zone={z} selected={selectedId===z.id} onClick={() => { setSelected(z.id); setTab('profiles'); }} />
          ))}
        </div>
      )}

      {/* PROFILES */}
      {tab === 'profiles' && (
        <div className="space-y-5">
          {/* Zone selector */}
          <div className="flex gap-2 flex-wrap">
            {zones.map(z => (
              <button key={z.id} onClick={() => setSelected(z.id)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedId===z.id ? 'bg-amber-700 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {z.name.split(' — ')[0]}
              </button>
            ))}
          </div>

          {selected && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold text-slate-800">{selected.name}</h3>
                  <p className="text-xs text-slate-400">{selected.areaHa}ha · {CROP_LABELS[selected.crop]} ({selected.cropStage}) · {TEXTURE_PROPS[selected.texture].label} soil</p>
                </div>
                <button onClick={() => simulateReadings(selected.id)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Readings
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DepthProfileChart zone={selected} />

                {/* Detail table */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h4 className="font-medium text-sm text-slate-800 mb-4">Depth-by-Depth Analysis</h4>
                  {(() => {
                    const tex = TEXTURE_PROPS[selected.texture];
                    const paw = tex.fc - tex.pwp;
                    return (
                      <div className="space-y-4">
                        {selected.depths.map(d => {
                          const dep = paw > 0 ? Math.max(0, Math.min(100, ((tex.fc - d.moisturePct) / paw) * 100)) : 0;
                          const status = dep > 75 ? 'critical' : dep > 50 ? 'stress' : dep > 25 ? 'adequate' : 'optimal';
                          const cfgS = STATUS_CFG[status];
                          return (
                            <div key={d.depth_cm} className={`border rounded-xl p-3 ${cfgS.border} ${cfgS.bg}/30`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-slate-800">{d.depth_cm} cm depth</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${cfgS.bg} ${cfgS.text} border ${cfgS.border}`}>{cfgS.label}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div><div className="font-bold text-slate-800">{d.moisturePct}%</div><div className="text-slate-400">Moisture</div></div>
                                <div><div className="font-bold text-slate-800">{d.tempC}°C</div><div className="text-slate-400">Temp</div></div>
                                <div><div className="font-bold text-slate-800">{d.ecDs} dS/m</div><div className="text-slate-400">EC</div></div>
                              </div>
                              <div className="mt-2">
                                <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                                  <span>PWP {tex.pwp}%</span><span>{dep.toFixed(0)}% depleted</span><span>FC {tex.fc}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                  <div className={`h-1.5 rounded-full ${cfgS.barColor}`} style={{ width:`${Math.min(100, (d.moisturePct/tex.fc)*100)}%` }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Irrigation recommendation */}
              {selected.irrigationNeededMm > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Droplets className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-blue-800 mb-1">Irrigation Recommendation</div>
                      <div className="text-sm text-blue-700">Apply approximately <strong>{selected.irrigationNeededMm}mm</strong> to restore plant-available water to 70% field capacity.</div>
                      <div className="text-xs text-blue-600 mt-1">Recommended method: drip or sprinkler to minimize surface evaporation.</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* IRRIGATION LOG */}
      {tab === 'irrigation' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 font-semibold text-sm text-slate-800">Irrigation History</div>
          {irrig.length === 0 ? <div className="px-5 py-8 text-slate-400 text-sm text-center">No irrigation events logged.</div> : (
            [...irrig].sort((a,b)=>new Date(b.performedAt).getTime()-new Date(a.performedAt).getTime()).map(ev => {
              const z = zones.find(x=>x.id===ev.zoneId);
              return (
                <div key={ev.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0">
                  <Droplets className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-800">{z?.name ?? 'Unknown zone'}</div>
                    <div className="text-xs text-slate-500">{ev.depthMm}mm applied · {ev.method} · {ev.durationMin}min · {ev.triggeredBy}</div>
                  </div>
                  <div className="text-xs text-slate-400 flex-shrink-0">{fmtTs(ev.performedAt)}</div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ANALYSIS */}
      {tab === 'analysis' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 font-semibold text-sm text-slate-800">Zone Comparison — All Fields</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-2 text-left">Zone</th><th className="px-3 py-2">10cm</th><th className="px-3 py-2">30cm</th><th className="px-3 py-2">60cm</th><th className="px-3 py-2">90cm</th><th className="px-3 py-2">Avg</th><th className="px-3 py-2">Depletion</th><th className="px-3 py-2">Status</th>
                </tr></thead>
                <tbody>
                  {zones.map(z => {
                    const cfg = STATUS_CFG[z.status];
                    return (
                      <tr key={z.id} className={`border-t border-slate-50 ${z.status==='critical'?'bg-red-50':z.status==='stress'?'bg-amber-50/40':''}`}>
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-slate-800 text-xs">{z.name}</div>
                          <div className="text-[10px] text-slate-400">{CROP_LABELS[z.crop]} · {TEXTURE_PROPS[z.texture].label}</div>
                        </td>
                        {z.depths.map(d => {
                          const tex = TEXTURE_PROPS[z.texture];
                          const paw = tex.fc - tex.pwp;
                          const dep = paw > 0 ? (tex.fc - d.moisturePct) / paw : 0;
                          const color = dep > 0.75 ? 'text-red-600' : dep > 0.5 ? 'text-amber-600' : 'text-green-700';
                          return <td key={d.depth_cm} className={`px-3 py-2.5 text-center text-xs font-medium tabular-nums ${color}`}>{d.moisturePct}%</td>;
                        })}
                        <td className="px-3 py-2.5 text-center text-xs font-bold text-slate-700">{z.avgMoisturePct}%</td>
                        <td className={`px-3 py-2.5 text-center text-xs font-bold ${cfg.text}`}>{z.depletionPct}%</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>{cfg.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {/* Field-average depletion visual */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm">PAW Depletion by Zone</h3>
            {zones.map(z => {
              const cfg = STATUS_CFG[z.status];
              return (
                <div key={z.id} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 truncate mr-2">{z.name}</span>
                    <span className={`font-bold flex-shrink-0 ${cfg.text}`}>{z.depletionPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div className={`h-3 rounded-full ${cfg.barColor}`} style={{ width:`${z.depletionPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
