/**
 * Cold Chain Monitor — Cold Rooms · Grain Silos · Refrigerated Trucks
 * localStorage-based; no backend required.
 */
import React, { useState } from 'react';
import {
  Snowflake, Thermometer, Droplets, Wind, AlertTriangle, CheckCircle,
  Plus, X, RefreshCw, Truck, Package, ArrowRight, Activity, Lock,
  DoorOpen, Power, BarChart3,
} from 'lucide-react';
import { useOrg } from '@/store/orgStore';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ColdRoom {
  id: string;
  name: string;
  enterpriseId: string;
  targetTempC: number;
  currentTempC: number;
  humidityPct: number;
  doorOpen: boolean;
  compressorOn: boolean;
  capacity: number;
  occupancy: number;
  lastChecked: string;
  products: string[];
  alertThresholdC: number;
  addedAt: string;
}

interface GrainSilo {
  id: string;
  name: string;
  enterpriseId: string;
  grain: string;
  capacityTonnes: number;
  currentTonnes: number;
  topTempC: number;
  midTempC: number;
  botTempC: number;
  moisturePct: number;
  co2Ppm: number;
  fumigationActive: boolean;
  lastFumigated: string;
  addedAt: string;
}

interface RefrigTruck {
  id: string;
  name: string;
  plateNumber: string;
  driverName: string;
  cargo: string;
  originLocation: string;
  destinationLocation: string;
  currentTempC: number;
  targetTempC: number;
  departureTime: string;
  estimatedArrival: string;
  status: 'loading' | 'in_transit' | 'delivered' | 'idle';
  gpsLat: number;
  gpsLng: number;
  addedAt: string;
}

interface ColdChainAlert {
  id: string;
  sourceType: 'room' | 'silo' | 'truck';
  sourceId: string;
  sourceName: string;
  type: string;
  severity: 'warning' | 'critical';
  message: string;
  ts: string;
  resolved: boolean;
}

// ─── LS Keys ───────────────────────────────────────────────────────────────────

const LS = {
  ROOMS:  'agronexus_v2_cc_rooms',
  SILOS:  'agronexus_v2_cc_silos',
  TRUCKS: 'agronexus_v2_cc_trucks',
  ALERTS: 'agronexus_v2_cc_alerts',
};

// ─── Seed ──────────────────────────────────────────────────────────────────────

function mkSeeds(eid: string) {
  const now = new Date().toISOString();
  const hAgo = (h: number) => new Date(Date.now() - h * 3600000).toISOString();

  const ROOMS: ColdRoom[] = [
    {
      id: 'cr-1', name: 'Cold Room A — Produce', enterpriseId: eid,
      targetTempC: 4, currentTempC: 4.8, humidityPct: 88,
      doorOpen: false, compressorOn: true,
      capacity: 500, occupancy: 320,
      lastChecked: hAgo(0.5), products: ['Tomatoes', 'Lettuce', 'Bell Peppers'],
      alertThresholdC: 8, addedAt: now,
    },
    {
      id: 'cr-2', name: 'Cold Room B — Dairy & Eggs', enterpriseId: eid,
      targetTempC: 2, currentTempC: 7.5, humidityPct: 82,
      doorOpen: true, compressorOn: true,
      capacity: 300, occupancy: 180,
      lastChecked: hAgo(0.2), products: ['Milk', 'Eggs', 'Butter'],
      alertThresholdC: 6, addedAt: now,
    },
  ];

  const SILOS: GrainSilo[] = [
    {
      id: 'gs-1', name: 'Silo 1 — Maize', enterpriseId: eid,
      grain: 'Maize', capacityTonnes: 500, currentTonnes: 312,
      topTempC: 24, midTempC: 26, botTempC: 27,
      moisturePct: 13.2, co2Ppm: 420, fumigationActive: false,
      lastFumigated: hAgo(720), addedAt: now,
    },
    {
      id: 'gs-2', name: 'Silo 2 — Soya Bean', enterpriseId: eid,
      grain: 'Soya Bean', capacityTonnes: 300, currentTonnes: 278,
      topTempC: 28, midTempC: 31, botTempC: 33,
      moisturePct: 15.8, co2Ppm: 680, fumigationActive: true,
      lastFumigated: hAgo(2), addedAt: now,
    },
  ];

  const TRUCKS: RefrigTruck[] = [
    {
      id: 'rt-1', name: 'Truck Alpha', plateNumber: 'AAA 4521', driverName: 'James Mwale',
      cargo: 'Fresh Tomatoes (2 tonnes)', originLocation: 'Main Farm', destinationLocation: 'Lusaka Market',
      currentTempC: 5.2, targetTempC: 5,
      departureTime: hAgo(3), estimatedArrival: new Date(Date.now() + 2 * 3600000).toISOString(),
      status: 'in_transit', gpsLat: -15.42, gpsLng: 28.28, addedAt: now,
    },
    {
      id: 'rt-2', name: 'Truck Beta', plateNumber: 'ABX 8830', driverName: 'Grace Banda',
      cargo: 'Dairy Products (1.5 tonnes)', originLocation: 'Main Farm', destinationLocation: 'Ndola Distribution',
      currentTempC: 3.8, targetTempC: 2,
      departureTime: hAgo(1), estimatedArrival: new Date(Date.now() + 5 * 3600000).toISOString(),
      status: 'loading', gpsLat: -15.38, gpsLng: 28.31, addedAt: now,
    },
  ];

  const ALERTS: ColdChainAlert[] = [
    {
      id: 'ca-1', sourceType: 'room', sourceId: 'cr-2', sourceName: 'Cold Room B — Dairy & Eggs',
      type: 'Temperature Deviation', severity: 'critical',
      message: 'Temperature 7.5°C exceeds alert threshold of 6°C — door may be open',
      ts: hAgo(0.3), resolved: false,
    },
    {
      id: 'ca-2', sourceType: 'silo', sourceId: 'gs-2', sourceName: 'Silo 2 — Soya Bean',
      type: 'High Moisture', severity: 'warning',
      message: 'Soya bean moisture at 15.8% — exceeds safe storage limit of 14%',
      ts: hAgo(2), resolved: false,
    },
    {
      id: 'ca-3', sourceType: 'silo', sourceId: 'gs-2', sourceName: 'Silo 2 — Soya Bean',
      type: 'Elevated CO₂', severity: 'warning',
      message: 'CO₂ at 680 ppm — fumigation in progress, ensure ventilation before entry',
      ts: hAgo(1.8), resolved: false,
    },
  ];

  return { ROOMS, SILOS, TRUCKS, ALERTS };
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function ls<T>(key: string, def: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : def; } catch { return def; }
}
function lsSet<T>(key: string, v: T) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }

function fmtDt(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

function tempDevColor(current: number, target: number): string {
  const diff = Math.abs(current - target);
  if (diff <= 2) return 'text-green-600';
  if (diff <= 5) return 'text-amber-600';
  return 'text-red-600';
}

function tempDevBg(current: number, target: number): string {
  const diff = Math.abs(current - target);
  if (diff <= 2) return 'bg-green-50 border-green-200';
  if (diff <= 5) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

function zoneTempColor(t: number): string {
  if (t < 25) return 'bg-green-400';
  if (t <= 30) return 'bg-amber-400';
  return 'bg-red-500';
}

function moistureColor(pct: number, grain: string): string {
  const threshold = grain.toLowerCase().includes('maize') ? 14 : 14;
  if (pct > threshold) return 'text-red-600 bg-red-50';
  if (pct > threshold - 1) return 'text-amber-600 bg-amber-50';
  return 'text-green-600 bg-green-50';
}

function truckStatusColor(s: RefrigTruck['status']): string {
  return s === 'in_transit' ? 'bg-blue-100 text-blue-700'
    : s === 'delivered' ? 'bg-green-100 text-green-700'
    : s === 'loading' ? 'bg-amber-100 text-amber-700'
    : 'bg-slate-100 text-slate-600';
}

// ─── Inline SVG Thermometer ────────────────────────────────────────────────────

function ThermoBar({ current, target, min = -5, max = 40 }: { current: number; target: number; min?: number; max?: number }) {
  const range = max - min;
  const pct = Math.min(100, Math.max(0, ((current - min) / range) * 100));
  const devCol = tempDevColor(current, target);
  const barCol = devCol.replace('text-', 'bg-');
  return (
    <div className="flex items-center gap-3">
      <svg width={16} height={60} viewBox="0 0 16 60">
        <rect x={5} y={4} width={6} height={44} rx={3} fill="#e2e8f0" />
        <rect x={5} y={4 + 44 * (1 - pct / 100)} width={6} height={44 * (pct / 100)} rx={3}
          fill={devCol === 'text-green-600' ? '#22c55e' : devCol === 'text-amber-600' ? '#f59e0b' : '#ef4444'} />
        <circle cx={8} cy={52} r={5} fill={devCol === 'text-green-600' ? '#22c55e' : devCol === 'text-amber-600' ? '#f59e0b' : '#ef4444'} />
      </svg>
      <div>
        <div className={`text-xl font-bold ${devCol}`}>{current}°C</div>
        <div className="text-xs text-slate-400">target {target}°C</div>
      </div>
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      <input {...props} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300" />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

type Tab = 'overview' | 'rooms' | 'silos' | 'trucks';

export default function ColdChain() {
  const { enterprises } = useOrg();
  const eid = enterprises[0]?.id ?? '';

  const initData = (() => {
    const r = ls<ColdRoom[]>(LS.ROOMS, []);
    if (r.length) return null; // already seeded
    return mkSeeds(eid);
  })();

  const [rooms, setRoomsRaw] = useState<ColdRoom[]>(() => {
    if (initData) { lsSet(LS.ROOMS, initData.ROOMS); return initData.ROOMS; }
    return ls<ColdRoom[]>(LS.ROOMS, []);
  });
  const [silos, setSilosRaw] = useState<GrainSilo[]>(() => {
    if (initData) { lsSet(LS.SILOS, initData.SILOS); return initData.SILOS; }
    return ls<GrainSilo[]>(LS.SILOS, []);
  });
  const [trucks, setTrucksRaw] = useState<RefrigTruck[]>(() => {
    if (initData) { lsSet(LS.TRUCKS, initData.TRUCKS); return initData.TRUCKS; }
    return ls<RefrigTruck[]>(LS.TRUCKS, []);
  });
  const [alerts, setAlertsRaw] = useState<ColdChainAlert[]>(() => {
    if (initData) { lsSet(LS.ALERTS, initData.ALERTS); return initData.ALERTS; }
    return ls<ColdChainAlert[]>(LS.ALERTS, []);
  });

  function setRooms(d: ColdRoom[])         { setRoomsRaw(d);  lsSet(LS.ROOMS, d);  }
  function setSilos(d: GrainSilo[])        { setSilosRaw(d);  lsSet(LS.SILOS, d);  }
  function setTrucks(d: RefrigTruck[])     { setTrucksRaw(d); lsSet(LS.TRUCKS, d); }
  function setAlerts(d: ColdChainAlert[])  { setAlertsRaw(d); lsSet(LS.ALERTS, d); }

  const [tab, setTab] = useState<Tab>('overview');

  // Modals
  const [addRoomOpen, setAddRoomOpen]   = useState(false);
  const [addSiloOpen, setAddSiloOpen]   = useState(false);
  const [addTruckOpen, setAddTruckOpen] = useState(false);
  const [logSiloId, setLogSiloId]       = useState<string | null>(null);
  const [updTruckId, setUpdTruckId]     = useState<string | null>(null);

  // Forms
  const [roomForm, setRoomForm]   = useState({ name:'', targetTempC:'', capacity:'', alertThresholdC:'', products:'' });
  const [siloForm, setSiloForm]   = useState({ name:'', grain:'', capacityTonnes:'', currentTonnes:'' });
  const [truckForm, setTruckForm] = useState({ name:'', plateNumber:'', driverName:'', cargo:'', originLocation:'', destinationLocation:'', targetTempC:'', estimatedArrival:'' });
  const [logForm, setLogForm]     = useState({ topTempC:'', midTempC:'', botTempC:'', moisturePct:'', co2Ppm:'' });
  const [updTruckForm, setUpdTruckForm] = useState({ currentTempC:'', status:'' as RefrigTruck['status'] });

  const activeAlerts = alerts.filter(a => !a.resolved);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');

  // ── Room actions ──
  function toggleCompressor(id: string) {
    setRooms(rooms.map(r => r.id === id ? { ...r, compressorOn: !r.compressorOn } : r));
  }
  function toggleDoor(id: string) {
    setRooms(rooms.map(r => r.id === id ? { ...r, doorOpen: !r.doorOpen } : r));
  }
  function submitRoom(e: React.FormEvent) {
    e.preventDefault();
    const r: ColdRoom = {
      id: `cr-${Date.now()}`, name: roomForm.name, enterpriseId: eid,
      targetTempC: parseFloat(roomForm.targetTempC) || 4,
      currentTempC: parseFloat(roomForm.targetTempC) || 4,
      humidityPct: 80, doorOpen: false, compressorOn: true,
      capacity: parseInt(roomForm.capacity) || 100,
      occupancy: 0,
      lastChecked: new Date().toISOString(),
      products: roomForm.products.split(',').map(s => s.trim()).filter(Boolean),
      alertThresholdC: parseFloat(roomForm.alertThresholdC) || 8,
      addedAt: new Date().toISOString(),
    };
    setRooms([...rooms, r]);
    setRoomForm({ name:'', targetTempC:'', capacity:'', alertThresholdC:'', products:'' });
    setAddRoomOpen(false);
  }

  // ── Silo actions ──
  function toggleFumigation(id: string) {
    setSilos(silos.map(s => s.id === id ? { ...s, fumigationActive: !s.fumigationActive, lastFumigated: !s.fumigationActive ? new Date().toISOString() : s.lastFumigated } : s));
  }
  function submitLogReading(e: React.FormEvent) {
    e.preventDefault();
    if (!logSiloId) return;
    setSilos(silos.map(s => s.id === logSiloId ? {
      ...s,
      topTempC: parseFloat(logForm.topTempC) || s.topTempC,
      midTempC: parseFloat(logForm.midTempC) || s.midTempC,
      botTempC: parseFloat(logForm.botTempC) || s.botTempC,
      moisturePct: parseFloat(logForm.moisturePct) || s.moisturePct,
      co2Ppm: parseFloat(logForm.co2Ppm) || s.co2Ppm,
    } : s));
    setLogForm({ topTempC:'', midTempC:'', botTempC:'', moisturePct:'', co2Ppm:'' });
    setLogSiloId(null);
  }
  function submitSilo(e: React.FormEvent) {
    e.preventDefault();
    const s: GrainSilo = {
      id: `gs-${Date.now()}`, name: siloForm.name, enterpriseId: eid,
      grain: siloForm.grain, capacityTonnes: parseFloat(siloForm.capacityTonnes) || 100,
      currentTonnes: parseFloat(siloForm.currentTonnes) || 0,
      topTempC: 25, midTempC: 25, botTempC: 25,
      moisturePct: 13, co2Ppm: 400, fumigationActive: false,
      lastFumigated: new Date().toISOString(), addedAt: new Date().toISOString(),
    };
    setSilos([...silos, s]);
    setSiloForm({ name:'', grain:'', capacityTonnes:'', currentTonnes:'' });
    setAddSiloOpen(false);
  }

  // ── Truck actions ──
  function submitUpdTruck(e: React.FormEvent) {
    e.preventDefault();
    if (!updTruckId) return;
    setTrucks(trucks.map(t => t.id === updTruckId ? {
      ...t,
      currentTempC: parseFloat(updTruckForm.currentTempC) || t.currentTempC,
      status: updTruckForm.status || t.status,
    } : t));
    setUpdTruckId(null);
  }
  function submitTruck(e: React.FormEvent) {
    e.preventDefault();
    const t: RefrigTruck = {
      id: `rt-${Date.now()}`, name: truckForm.name, plateNumber: truckForm.plateNumber,
      driverName: truckForm.driverName, cargo: truckForm.cargo,
      originLocation: truckForm.originLocation, destinationLocation: truckForm.destinationLocation,
      currentTempC: parseFloat(truckForm.targetTempC) || 5,
      targetTempC: parseFloat(truckForm.targetTempC) || 5,
      departureTime: new Date().toISOString(),
      estimatedArrival: truckForm.estimatedArrival || new Date(Date.now() + 8 * 3600000).toISOString(),
      status: 'loading', gpsLat: 0, gpsLng: 0,
      addedAt: new Date().toISOString(),
    };
    setTrucks([...trucks, t]);
    setTruckForm({ name:'', plateNumber:'', driverName:'', cargo:'', originLocation:'', destinationLocation:'', targetTempC:'', estimatedArrival:'' });
    setAddTruckOpen(false);
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'rooms', label: `Cold Rooms (${rooms.length})` },
    { id: 'silos', label: `Grain Silos (${silos.length})` },
    { id: 'trucks', label: `Refrigerated Trucks (${trucks.length})` },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Snowflake className="w-7 h-7 text-cyan-600" /> Cold Chain Monitor
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Cold rooms · Grain silos · Refrigerated trucks</p>
        </div>
        {criticalAlerts.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" /> {criticalAlerts.length} critical alert{criticalAlerts.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Active alerts banner */}
          {activeAlerts.length > 0 && (
            <div className={`rounded-xl p-4 border flex items-start gap-3 ${criticalAlerts.length ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
              <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${criticalAlerts.length ? 'text-red-600' : 'text-amber-600'}`} />
              <div>
                <div className={`font-semibold text-sm ${criticalAlerts.length ? 'text-red-700' : 'text-amber-700'}`}>
                  {activeAlerts.length} Active Alert{activeAlerts.length !== 1 ? 's' : ''}
                </div>
                {activeAlerts.slice(0, 2).map(a => (
                  <div key={a.id} className="text-sm text-slate-600 mt-0.5">· {a.message}</div>
                ))}
              </div>
            </div>
          )}

          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Cold Rooms', value: rooms.length, sub: `${rooms.filter(r => r.compressorOn).length} compressors on`, icon: <Snowflake className="w-5 h-5 text-cyan-500" />, bg: 'bg-cyan-50' },
              { label: 'Grain Silos', value: silos.length, sub: `${silos.filter(s => s.fumigationActive).length} fumigating`, icon: <Package className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50' },
              { label: 'Trucks', value: trucks.length, sub: `${trucks.filter(t => t.status === 'in_transit').length} in transit`, icon: <Truck className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-5 border border-slate-100 shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-slate-800">{s.value}</div>
                  {s.icon}
                </div>
                <div className="text-sm font-medium text-slate-600 mt-1">{s.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Cold room temp gauges */}
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Cold Room Temperatures</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {rooms.map(r => (
                <div key={r.id} className={`p-4 rounded-xl border ${tempDevBg(r.currentTempC, r.targetTempC)}`}>
                  <div className="font-medium text-slate-700 mb-3 text-sm">{r.name}</div>
                  <ThermoBar current={r.currentTempC} target={r.targetTempC} />
                  <div className="text-xs text-slate-400 mt-2">Humidity {r.humidityPct}% · {r.doorOpen ? '🔓 Door open' : '🔒 Door closed'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Silo overview */}
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Grain Silo Conditions</h3>
            <div className="space-y-4">
              {silos.map(s => (
                <div key={s.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-slate-700 text-sm">{s.name} — {s.grain}</span>
                    <span className="text-xs text-slate-500">{s.currentTonnes}/{s.capacityTonnes}t</span>
                  </div>
                  <div className="flex gap-2 mb-3">
                    {[['Top', s.topTempC], ['Mid', s.midTempC], ['Bot', s.botTempC]].map(([z, t]) => (
                      <div key={z as string} className={`flex-1 rounded-lg py-2 px-2 text-center text-white text-xs font-medium ${zoneTempColor(t as number)}`}>
                        <div>{z}</div>
                        <div className="font-bold">{t}°C</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500">Moisture {s.moisturePct}% · CO₂ {s.co2Ppm}ppm {s.fumigationActive ? '· 🟡 Fumigating' : ''}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Truck list */}
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Truck Status</h3>
            <div className="space-y-3">
              {trucks.map(t => (
                <div key={t.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Truck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="font-medium text-slate-700">{t.name}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{t.originLocation}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-500">{t.destinationLocation}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{t.cargo} · {t.driverName}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-xs font-medium ${tempDevColor(t.currentTempC, t.targetTempC)}`}>{t.currentTempC}°C</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${truckStatusColor(t.status)}`}>{t.status.replace('_',' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── COLD ROOMS TAB ── */}
      {tab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setAddRoomOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors">
              <Plus className="w-4 h-4" /> Add Cold Room
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {rooms.map(r => {
              const occPct = r.capacity ? Math.round((r.occupancy / r.capacity) * 100) : 0;
              return (
                <div key={r.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${r.doorOpen ? 'border-red-200' : 'border-slate-100'}`}>
                  {r.doorOpen && (
                    <div className="bg-red-50 border-b border-red-200 px-5 py-2 flex items-center gap-2 text-red-700 text-sm font-medium">
                      <DoorOpen className="w-4 h-4" /> Door is open — temperature may rise
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-slate-800">{r.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Last checked {fmtDt(r.lastChecked)}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.compressorOn ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-500'}`}>
                        {r.compressorOn ? '❄ Compressor ON' : '⏸ Compressor OFF'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Temperature</p>
                        <ThermoBar current={r.currentTempC} target={r.targetTempC} min={-10} max={25} />
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-slate-400">Humidity</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-400 rounded-full" style={{ width: `${r.humidityPct}%` }} />
                            </div>
                            <span className="text-sm font-semibold text-blue-700">{r.humidityPct}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Occupancy</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${occPct > 85 ? 'bg-red-400' : occPct > 60 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${occPct}%` }} />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{occPct}%</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{r.occupancy}/{r.capacity} units</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Door</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {r.doorOpen
                              ? <><DoorOpen className="w-4 h-4 text-red-500" /><span className="text-sm text-red-600 font-medium">Open</span></>
                              : <><Lock className="w-4 h-4 text-green-500" /><span className="text-sm text-green-600 font-medium">Closed</span></>
                            }
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {r.products.map(p => (
                        <span key={p} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">{p}</span>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => toggleCompressor(r.id)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${r.compressorOn ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' : 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100'}`}>
                        <Power className="w-3.5 h-3.5" />
                        {r.compressorOn ? 'Stop Compressor' : 'Start Compressor'}
                      </button>
                      <button onClick={() => toggleDoor(r.id)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${r.doorOpen ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'}`}>
                        {r.doorOpen ? <><Lock className="w-3.5 h-3.5" /> Close Door</> : <><DoorOpen className="w-3.5 h-3.5" /> Open Door</>}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── GRAIN SILOS TAB ── */}
      {tab === 'silos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setAddSiloOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
              <Plus className="w-4 h-4" /> Add Silo
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {silos.map(s => {
              const fillPct = s.capacityTonnes ? Math.round((s.currentTonnes / s.capacityTonnes) * 100) : 0;
              const mcol = moistureColor(s.moisturePct, s.grain);
              return (
                <div key={s.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-800">{s.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Grain: {s.grain}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.fumigationActive ? 'bg-yellow-100 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                      {s.fumigationActive ? '🟡 Fumigating' : '✅ Clear'}
                    </span>
                  </div>

                  {/* Fill level */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Fill Level</span>
                      <span>{s.currentTonnes}t / {s.capacityTonnes}t ({fillPct}%)</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${fillPct > 90 ? 'bg-red-500' : fillPct > 70 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${fillPct}%` }} />
                    </div>
                  </div>

                  {/* 3-zone temps */}
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Temperature Zones</p>
                    <div className="flex gap-2">
                      {[['Top', s.topTempC], ['Middle', s.midTempC], ['Bottom', s.botTempC]].map(([z, t]) => (
                        <div key={z as string} className={`flex-1 rounded-xl py-3 px-2 text-center text-white ${zoneTempColor(t as number)}`}>
                          <div className="text-xs opacity-80">{z}</div>
                          <div className="text-lg font-bold">{t}°C</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className={`text-sm font-bold px-2 py-0.5 rounded-full ${mcol}`}>{s.moisturePct}%</div>
                      <div className="text-xs text-slate-400 mt-0.5">Moisture</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className={`text-sm font-bold ${s.co2Ppm > 600 ? 'text-red-600' : s.co2Ppm > 500 ? 'text-amber-600' : 'text-green-600'}`}>{s.co2Ppm}</div>
                      <div className="text-xs text-slate-400 mt-0.5">CO₂ ppm</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className="text-xs text-slate-500 font-medium">Last fumed</div>
                      <div className="text-xs text-slate-400 mt-0.5">{fmtDt(s.lastFumigated)}</div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => toggleFumigation(s.id)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${s.fumigationActive ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' : 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'}`}>
                      <Wind className="w-3.5 h-3.5" />
                      {s.fumigationActive ? 'Stop Fumigation' : 'Start Fumigation'}
                    </button>
                    <button onClick={() => { setLogSiloId(s.id); setLogForm({ topTempC: String(s.topTempC), midTempC: String(s.midTempC), botTempC: String(s.botTempC), moisturePct: String(s.moisturePct), co2Ppm: String(s.co2Ppm) }); }}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors font-medium">
                      <Activity className="w-3.5 h-3.5" /> Log Reading
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TRUCKS TAB ── */}
      {tab === 'trucks' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setAddTruckOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" /> Add Truck
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {trucks.map(t => (
              <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-indigo-500" /> {t.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{t.plateNumber} · {t.driverName}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${truckStatusColor(t.status)}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Route */}
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3">
                  <span className="text-sm text-slate-700 font-medium">{t.originLocation}</span>
                  <ArrowRight className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">{t.destinationLocation}</span>
                </div>

                <div className="text-sm text-slate-500">{t.cargo}</div>

                {/* Temp */}
                <div className={`p-4 rounded-xl border ${tempDevBg(t.currentTempC, t.targetTempC)}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Cargo Temperature</p>
                      <p className={`text-2xl font-bold mt-0.5 ${tempDevColor(t.currentTempC, t.targetTempC)}`}>{t.currentTempC}°C</p>
                      <p className="text-xs text-slate-400">Target: {t.targetTempC}°C</p>
                    </div>
                    <ThermoBar current={t.currentTempC} target={t.targetTempC} min={-5} max={20} />
                  </div>
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-slate-400">Departed</p>
                    <p className="font-medium text-slate-700 mt-0.5">{fmtDt(t.departureTime)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-slate-400">Est. Arrival</p>
                    <p className="font-medium text-slate-700 mt-0.5">{fmtDt(t.estimatedArrival)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 col-span-2">
                    <p className="text-slate-400">GPS Position</p>
                    <p className="font-medium text-slate-700 mt-0.5">{t.gpsLat}°, {t.gpsLng}°</p>
                  </div>
                </div>

                <button onClick={() => { setUpdTruckId(t.id); setUpdTruckForm({ currentTempC: String(t.currentTempC), status: t.status }); }}
                  className="w-full text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg py-2 font-medium hover:bg-indigo-100 transition-colors">
                  Update Temp & Status
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ MODALS ═══ */}

      {/* Add Cold Room */}
      {addRoomOpen && (
        <Modal title="Add Cold Room" onClose={() => setAddRoomOpen(false)}>
          <form onSubmit={submitRoom} className="space-y-4">
            <Input label="Room Name *" required value={roomForm.name} onChange={e => setRoomForm({ ...roomForm, name: e.target.value })} placeholder="e.g. Cold Room C" />
            <Input label="Target Temp (°C) *" required type="number" value={roomForm.targetTempC} onChange={e => setRoomForm({ ...roomForm, targetTempC: e.target.value })} placeholder="4" />
            <Input label="Alert Threshold (°C) *" required type="number" value={roomForm.alertThresholdC} onChange={e => setRoomForm({ ...roomForm, alertThresholdC: e.target.value })} placeholder="8" />
            <Input label="Capacity (units)" type="number" value={roomForm.capacity} onChange={e => setRoomForm({ ...roomForm, capacity: e.target.value })} placeholder="200" />
            <Input label="Products (comma-separated)" value={roomForm.products} onChange={e => setRoomForm({ ...roomForm, products: e.target.value })} placeholder="Tomatoes, Peppers" />
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-cyan-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-cyan-700 transition-colors">Add Room</button>
              <button type="button" onClick={() => setAddRoomOpen(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Silo */}
      {addSiloOpen && (
        <Modal title="Add Grain Silo" onClose={() => setAddSiloOpen(false)}>
          <form onSubmit={submitSilo} className="space-y-4">
            <Input label="Silo Name *" required value={siloForm.name} onChange={e => setSiloForm({ ...siloForm, name: e.target.value })} placeholder="e.g. Silo 3 — Wheat" />
            <Input label="Grain Type *" required value={siloForm.grain} onChange={e => setSiloForm({ ...siloForm, grain: e.target.value })} placeholder="e.g. Maize" />
            <Input label="Capacity (tonnes)" type="number" value={siloForm.capacityTonnes} onChange={e => setSiloForm({ ...siloForm, capacityTonnes: e.target.value })} placeholder="400" />
            <Input label="Current Stock (tonnes)" type="number" value={siloForm.currentTonnes} onChange={e => setSiloForm({ ...siloForm, currentTonnes: e.target.value })} placeholder="200" />
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-amber-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-amber-700 transition-colors">Add Silo</button>
              <button type="button" onClick={() => setAddSiloOpen(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Log Silo Reading */}
      {logSiloId && (
        <Modal title="Log Silo Reading" onClose={() => setLogSiloId(null)}>
          <form onSubmit={submitLogReading} className="space-y-4">
            <Input label="Top Zone Temp (°C)" type="number" step="0.1" value={logForm.topTempC} onChange={e => setLogForm({ ...logForm, topTempC: e.target.value })} placeholder="25" />
            <Input label="Middle Zone Temp (°C)" type="number" step="0.1" value={logForm.midTempC} onChange={e => setLogForm({ ...logForm, midTempC: e.target.value })} placeholder="26" />
            <Input label="Bottom Zone Temp (°C)" type="number" step="0.1" value={logForm.botTempC} onChange={e => setLogForm({ ...logForm, botTempC: e.target.value })} placeholder="27" />
            <Input label="Moisture (%)" type="number" step="0.1" value={logForm.moisturePct} onChange={e => setLogForm({ ...logForm, moisturePct: e.target.value })} placeholder="13.5" />
            <Input label="CO₂ (ppm)" type="number" value={logForm.co2Ppm} onChange={e => setLogForm({ ...logForm, co2Ppm: e.target.value })} placeholder="420" />
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-slate-800 text-white rounded-lg py-2 text-sm font-semibold hover:bg-slate-900 transition-colors">Save Reading</button>
              <button type="button" onClick={() => setLogSiloId(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Truck */}
      {addTruckOpen && (
        <Modal title="Add Refrigerated Truck" onClose={() => setAddTruckOpen(false)}>
          <form onSubmit={submitTruck} className="space-y-4">
            <Input label="Truck Name *" required value={truckForm.name} onChange={e => setTruckForm({ ...truckForm, name: e.target.value })} placeholder="Truck Gamma" />
            <Input label="Plate Number *" required value={truckForm.plateNumber} onChange={e => setTruckForm({ ...truckForm, plateNumber: e.target.value })} placeholder="ACD 1234" />
            <Input label="Driver Name" value={truckForm.driverName} onChange={e => setTruckForm({ ...truckForm, driverName: e.target.value })} placeholder="John Daka" />
            <Input label="Cargo Description" value={truckForm.cargo} onChange={e => setTruckForm({ ...truckForm, cargo: e.target.value })} placeholder="Fresh produce 2t" />
            <Input label="Origin" value={truckForm.originLocation} onChange={e => setTruckForm({ ...truckForm, originLocation: e.target.value })} placeholder="Main Farm" />
            <Input label="Destination" value={truckForm.destinationLocation} onChange={e => setTruckForm({ ...truckForm, destinationLocation: e.target.value })} placeholder="Lusaka Market" />
            <Input label="Target Temp (°C)" type="number" step="0.5" value={truckForm.targetTempC} onChange={e => setTruckForm({ ...truckForm, targetTempC: e.target.value })} placeholder="5" />
            <Input label="Est. Arrival (datetime-local)" type="datetime-local" value={truckForm.estimatedArrival} onChange={e => setTruckForm({ ...truckForm, estimatedArrival: e.target.value })} />
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-indigo-700 transition-colors">Add Truck</button>
              <button type="button" onClick={() => setAddTruckOpen(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Update Truck */}
      {updTruckId && (
        <Modal title="Update Truck Temp & Status" onClose={() => setUpdTruckId(null)}>
          <form onSubmit={submitUpdTruck} className="space-y-4">
            <Input label="Current Temp (°C)" type="number" step="0.1" value={updTruckForm.currentTempC} onChange={e => setUpdTruckForm({ ...updTruckForm, currentTempC: e.target.value })} placeholder="5.0" />
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
              <select value={updTruckForm.status} onChange={e => setUpdTruckForm({ ...updTruckForm, status: e.target.value as RefrigTruck['status'] })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-white">
                <option value="loading">Loading</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="idle">Idle</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-indigo-700 transition-colors">Update</button>
              <button type="button" onClick={() => setUpdTruckId(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
