/**
 * Device Gateway — Universal IoT Device Hub
 * localStorage-based; no backend required.
 */
import React, { useState, useMemo } from 'react';
import {
  Cpu, Wifi, WifiOff, AlertTriangle, CheckCircle, Plus, X,
  RefreshCw, Battery, BatteryLow, Clock, ChevronDown, ChevronUp,
  Filter, Activity,
} from 'lucide-react';
import { useOrg } from '@/store/orgStore';

// ─── Types ─────────────────────────────────────────────────────────────────────

type DeviceFamily =
  | 'soil_sensor' | 'weather_station' | 'water_sensor' | 'camera'
  | 'aerator' | 'pump' | 'valve' | 'energy_meter' | 'cold_sensor'
  | 'gps_tracker' | 'custom';

interface IoTDevice {
  id: string;
  name: string;
  family: DeviceFamily;
  model: string;
  location: string;
  enterpriseId: string;
  status: 'online' | 'offline' | 'fault' | 'low_battery';
  batteryPct: number;
  lastSeenAt: string;
  readings: Record<string, number>;
  firmwareVersion: string;
  addedAt: string;
}

interface IoTAlert {
  id: string;
  deviceId: string;
  deviceName: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  ts: string;
  resolved: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const LS_DEVICES = 'agronexus_v2_iot_devices';
const LS_ALERTS  = 'agronexus_v2_iot_device_alerts';

const FAMILY_ICON: Record<DeviceFamily, string> = {
  soil_sensor: '🌡', weather_station: '☁', water_sensor: '💧',
  camera: '📷', aerator: '💨', pump: '⚙', valve: '🔧',
  energy_meter: '⚡', cold_sensor: '❄', gps_tracker: '📍', custom: '🔌',
};

const FAMILY_LABEL: Record<DeviceFamily, string> = {
  soil_sensor: 'Soil Sensor', weather_station: 'Weather Station',
  water_sensor: 'Water Sensor', camera: 'Camera', aerator: 'Aerator',
  pump: 'Pump', valve: 'Valve', energy_meter: 'Energy Meter',
  cold_sensor: 'Cold Sensor', gps_tracker: 'GPS Tracker', custom: 'Custom',
};

const ALL_FAMILIES: DeviceFamily[] = [
  'soil_sensor','weather_station','water_sensor','camera','aerator',
  'pump','valve','energy_meter','cold_sensor','gps_tracker','custom',
];

// ─── Seed ──────────────────────────────────────────────────────────────────────

function mkSeeds(eid: string) {
  const now = new Date().toISOString();
  const ago = (m: number) => new Date(Date.now() - m * 60000).toISOString();

  const DEVICES: IoTDevice[] = [
    { id:'d-1',  name:'Field A Soil Sensor',      family:'soil_sensor',     model:'SoilPro 300',  location:'Field A', enterpriseId:eid, status:'online',      batteryPct:82, lastSeenAt:ago(2),    readings:{ moisture_pct:63, temp_c:24.5, ph:6.8, nitrogen_ppm:42 }, firmwareVersion:'2.1.4', addedAt:now },
    { id:'d-2',  name:'Field B Soil Sensor',      family:'soil_sensor',     model:'SoilPro 300',  location:'Field B', enterpriseId:eid, status:'low_battery', batteryPct:12, lastSeenAt:ago(5),    readings:{ moisture_pct:41, temp_c:25.1, ph:7.1, nitrogen_ppm:38 }, firmwareVersion:'2.1.4', addedAt:now },
    { id:'d-3',  name:'North Weather Station',    family:'weather_station', model:'MeteoNode X2', location:'North Hill', enterpriseId:eid, status:'online',   batteryPct:-1, lastSeenAt:ago(1),    readings:{ temp_c:28.3, humidity_pct:72, wind_kmh:14, rain_mm:0 }, firmwareVersion:'3.0.1', addedAt:now },
    { id:'d-4',  name:'South Weather Station',    family:'weather_station', model:'MeteoNode X2', location:'South Field', enterpriseId:eid, status:'fault',  batteryPct:-1, lastSeenAt:ago(180),  readings:{ temp_c:29.1, humidity_pct:68, wind_kmh:0, rain_mm:0 }, firmwareVersion:'3.0.0', addedAt:now },
    { id:'d-5',  name:'Pond A Water Sensor',      family:'water_sensor',    model:'AquaProbe V3', location:'Pond A', enterpriseId:eid, status:'online',      batteryPct:77, lastSeenAt:ago(3),    readings:{ ph:7.2, do_mgl:6.8, temp_c:26.4, turbidity_ntu:12 }, firmwareVersion:'1.8.2', addedAt:now },
    { id:'d-6',  name:'Reservoir Water Sensor',   family:'water_sensor',    model:'AquaProbe V3', location:'Main Reservoir', enterpriseId:eid, status:'online', batteryPct:55, lastSeenAt:ago(4), readings:{ ph:7.0, do_mgl:7.1, temp_c:25.9, turbidity_ntu:8 }, firmwareVersion:'1.8.2', addedAt:now },
    { id:'d-7',  name:'Entrance CCTV Camera',     family:'camera',          model:'AgriCam 4K',   location:'Farm Entrance', enterpriseId:eid, status:'online', batteryPct:-1, lastSeenAt:ago(1),  readings:{ motion_events:3, uptime_h:720 }, firmwareVersion:'4.2.0', addedAt:now },
    { id:'d-8',  name:'Poultry House Camera',     family:'camera',          model:'AgriCam 4K',   location:'Poultry House 1', enterpriseId:eid, status:'offline', batteryPct:-1, lastSeenAt:ago(360), readings:{ motion_events:0, uptime_h:0 }, firmwareVersion:'4.1.9', addedAt:now },
    { id:'d-9',  name:'Pond A Aerator Controller',family:'aerator',         model:'AeroCtrl 5',   location:'Pond A', enterpriseId:eid, status:'online',      batteryPct:-1, lastSeenAt:ago(2),    readings:{ rpm:1200, power_w:450, runtime_h:18 }, firmwareVersion:'1.2.0', addedAt:now },
    { id:'d-10', name:'Pond B Aerator Controller',family:'aerator',         model:'AeroCtrl 5',   location:'Pond B', enterpriseId:eid, status:'online',      batteryPct:-1, lastSeenAt:ago(2),    readings:{ rpm:1100, power_w:420, runtime_h:16 }, firmwareVersion:'1.2.0', addedAt:now },
    { id:'d-11', name:'Irrigation Main Pump',     family:'pump',            model:'IrrigaPump X', location:'Pump House', enterpriseId:eid, status:'online',   batteryPct:-1, lastSeenAt:ago(1),    readings:{ flow_lpm:240, pressure_bar:3.2, power_w:2200 }, firmwareVersion:'2.0.5', addedAt:now },
    { id:'d-12', name:'Delivery Truck GPS',       family:'gps_tracker',     model:'TrackR Pro',   location:'Truck #1', enterpriseId:eid, status:'online',    batteryPct:91, lastSeenAt:ago(8),    readings:{ lat:1524, lng:2814, speed_kmh:65, altitude_m:1190 }, firmwareVersion:'1.5.3', addedAt:now },
  ];

  const ALERTS: IoTAlert[] = [
    { id:'a-1', deviceId:'d-2',  deviceName:'Field B Soil Sensor',   type:'Low Battery',    severity:'warning',  message:'Battery at 12% — replace soon',                    ts:new Date(Date.now()-3600000).toISOString(),   resolved:false },
    { id:'a-2', deviceId:'d-4',  deviceName:'South Weather Station',  type:'Device Fault',   severity:'critical', message:'No readings in 3 hours — possible hardware fault',  ts:new Date(Date.now()-10800000).toISOString(),  resolved:false },
    { id:'a-3', deviceId:'d-8',  deviceName:'Poultry House Camera',   type:'Device Offline', severity:'warning',  message:'Camera offline for 6+ hours',                       ts:new Date(Date.now()-21600000).toISOString(),  resolved:true  },
    { id:'a-4', deviceId:'d-5',  deviceName:'Pond A Water Sensor',    type:'Low DO',         severity:'info',     message:'Dissolved oxygen dropped below 7 mg/L',             ts:new Date(Date.now()-7200000).toISOString(),   resolved:true  },
  ];

  return { DEVICES, ALERTS };
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function ls<T>(key: string, def: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : def; } catch { return def; }
}
function lsSet<T>(key: string, v: T) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }

function fmtTs(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function statusColor(s: IoTDevice['status']) {
  return s === 'online' ? 'bg-green-100 text-green-700'
    : s === 'offline' ? 'bg-red-100 text-red-700'
    : s === 'fault' ? 'bg-orange-100 text-orange-700'
    : 'bg-amber-100 text-amber-700';
}

function statusDot(s: IoTDevice['status']) {
  return s === 'online' ? 'bg-green-500'
    : s === 'offline' ? 'bg-red-500'
    : s === 'fault' ? 'bg-orange-500'
    : 'bg-amber-500';
}

function sevColor(sev: IoTAlert['severity']) {
  return sev === 'critical' ? 'bg-red-100 text-red-700'
    : sev === 'warning' ? 'bg-amber-100 text-amber-700'
    : 'bg-blue-100 text-blue-700';
}

function firstReading(r: Record<string, number>): string {
  const [k, v] = Object.entries(r)[0] ?? [];
  if (!k) return '—';
  return `${k.replace(/_/g, ' ')}: ${v}`;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function BatteryBadge({ pct }: { pct: number }) {
  if (pct === -1) return <span className="text-xs text-slate-400">Wired</span>;
  const col = pct < 20 ? 'text-red-600' : pct < 40 ? 'text-amber-600' : 'text-green-600';
  return <span className={`text-xs font-medium ${col}`}><BatteryLow className="inline w-3 h-3 mr-0.5" />{pct}%</span>;
}

function ConnectivityBar({ devices }: { devices: IoTDevice[] }) {
  const online = devices.filter(d => d.status === 'online').length;
  const pct = devices.length ? Math.round((online / devices.length) * 100) : 0;
  const barCol = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-500">Connectivity</span>
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barCol}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-slate-700">{pct}% online</span>
    </div>
  );
}

// ─── Add Device Form ───────────────────────────────────────────────────────────

interface AddForm { name:string; family:DeviceFamily; model:string; location:string; enterprise:string; batteryPct:string; }
const BLANK_FORM: AddForm = { name:'', family:'soil_sensor', model:'', location:'', enterprise:'', batteryPct:'' };

// ─── Main Component ────────────────────────────────────────────────────────────

type Tab = 'overview' | 'devices' | 'alerts' | 'add';

export default function DeviceGateway() {
  const { enterprises } = useOrg();
  const eid = enterprises[0]?.id ?? '';

  // Init localStorage once
  const [devices, setDevicesRaw] = useState<IoTDevice[]>(() => {
    const stored = ls<IoTDevice[]>(LS_DEVICES, []);
    if (stored.length) return stored;
    const { DEVICES, ALERTS } = mkSeeds(eid);
    lsSet(LS_ALERTS, ALERTS);
    lsSet(LS_DEVICES, DEVICES);
    return DEVICES;
  });

  const [alerts, setAlertsRaw] = useState<IoTAlert[]>(() => ls<IoTAlert[]>(LS_ALERTS, []));

  function setDevices(d: IoTDevice[]) { setDevicesRaw(d); lsSet(LS_DEVICES, d); }
  function setAlerts(a: IoTAlert[])   { setAlertsRaw(a); lsSet(LS_ALERTS, a);   }

  const [tab, setTab] = useState<Tab>('overview');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterFamily, setFilterFamily] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [form, setForm] = useState<AddForm>(BLANK_FORM);

  // Stats
  const onlineCount   = devices.filter(d => d.status === 'online').length;
  const offlineCount  = devices.filter(d => d.status === 'offline').length;
  const faultCount    = devices.filter(d => d.status === 'fault').length;
  const lowBattCount  = devices.filter(d => d.status === 'low_battery').length;
  const activeAlerts  = alerts.filter(a => !a.resolved);

  // Family groups
  const familyGroups = useMemo(() => {
    const map: Partial<Record<DeviceFamily, IoTDevice[]>> = {};
    for (const d of devices) {
      if (!map[d.family]) map[d.family] = [];
      map[d.family]!.push(d);
    }
    return map;
  }, [devices]);

  // Filtered devices
  const filtered = useMemo(() => devices.filter(d =>
    (filterFamily === 'all' || d.family === filterFamily) &&
    (filterStatus === 'all' || d.status === filterStatus)
  ), [devices, filterFamily, filterStatus]);

  function resolveAlert(id: string) {
    setAlerts(alerts.map(a => a.id === id ? { ...a, resolved: true } : a));
  }

  function submitDevice(e: React.FormEvent) {
    e.preventDefault();
    const batPct = form.batteryPct.toLowerCase() === 'wired' ? -1 : parseInt(form.batteryPct) || -1;
    const newDev: IoTDevice = {
      id: `d-${Date.now()}`, name: form.name, family: form.family as DeviceFamily,
      model: form.model, location: form.location, enterpriseId: form.enterprise || eid,
      status: 'online', batteryPct: batPct, lastSeenAt: new Date().toISOString(),
      readings: {}, firmwareVersion: '1.0.0', addedAt: new Date().toISOString(),
    };
    setDevices([...devices, newDev]);
    setForm(BLANK_FORM);
    setTab('devices');
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'devices',  label: 'All Devices' },
    { id: 'alerts',   label: `Alerts${activeAlerts.length ? ` (${activeAlerts.length})` : ''}` },
    { id: 'add',      label: 'Add Device' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Cpu className="w-7 h-7 text-indigo-600" /> Device Gateway
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Universal IoT device hub — {devices.length} devices registered</p>
        </div>
        <button onClick={() => setTab('add')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Device
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Total Devices', value: devices.length, color: 'text-slate-800', bg: 'bg-white' },
              { label: 'Online', value: onlineCount, color: 'text-green-700', bg: 'bg-green-50' },
              { label: 'Offline', value: offlineCount, color: 'text-red-700', bg: 'bg-red-50' },
              { label: 'Low Battery', value: lowBattCount + faultCount, color: 'text-amber-700', bg: 'bg-amber-50' },
              { label: 'Active Alerts', value: activeAlerts.length, color: 'text-orange-700', bg: 'bg-orange-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-slate-100 shadow-sm`}>
                <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Connectivity bar */}
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <ConnectivityBar devices={devices} />
          </div>

          {/* Family cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.entries(familyGroups) as [DeviceFamily, IoTDevice[]][]).map(([family, devs]) => {
              const onl = devs.filter(d => d.status === 'online').length;
              const sample = devs[0];
              const reading = sample ? firstReading(sample.readings) : '—';
              const allOnline = onl === devs.length;
              const anyFault = devs.some(d => d.status === 'fault');
              return (
                <div key={family} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-start gap-4">
                  <div className="text-3xl">{FAMILY_ICON[family]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{FAMILY_LABEL[family]}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${anyFault ? 'bg-orange-500' : allOnline ? 'bg-green-500' : 'bg-amber-500'}`} />
                    </div>
                    <div className="text-sm text-slate-500 mt-0.5">{devs.length} device{devs.length !== 1 ? 's' : ''} · {onl} online</div>
                    <div className="text-xs text-slate-400 mt-1 truncate">{reading}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ALL DEVICES TAB ── */}
      {tab === 'devices' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select value={filterFamily} onChange={e => setFilterFamily(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="all">All Families</option>
                {ALL_FAMILIES.map(f => <option key={f} value={f}>{FAMILY_LABEL[f]}</option>)}
              </select>
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option value="all">All Statuses</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="fault">Fault</option>
              <option value="low_battery">Low Battery</option>
            </select>
            <span className="text-sm text-slate-400 self-center">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Name', 'Family', 'Location', 'Status', 'Battery', 'Last Reading', 'Last Seen', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(d => (
                    <React.Fragment key={d.id}>
                      <tr className="hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}>
                        <td className="px-4 py-3 font-medium text-slate-800">{d.name}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                            {FAMILY_ICON[d.family]} {FAMILY_LABEL[d.family]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{d.location}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(d.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDot(d.status)}`} />
                            {d.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3"><BatteryBadge pct={d.batteryPct} /></td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{firstReading(d.readings)}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />{fmtTs(d.lastSeenAt)}
                        </td>
                        <td className="px-4 py-3">
                          {expandedId === d.id
                            ? <ChevronUp className="w-4 h-4 text-slate-400" />
                            : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </td>
                      </tr>
                      {expandedId === d.id && (
                        <tr className="bg-indigo-50/40">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                              <div className="col-span-full text-xs font-semibold text-indigo-700 mb-1">
                                All Readings — {d.model} · FW {d.firmwareVersion}
                              </div>
                              {Object.entries(d.readings).map(([k, v]) => (
                                <div key={k} className="bg-white rounded-lg px-3 py-2 border border-indigo-100">
                                  <div className="text-xs text-slate-500 capitalize">{k.replace(/_/g, ' ')}</div>
                                  <div className="text-sm font-semibold text-slate-800">{v}</div>
                                </div>
                              ))}
                              {Object.keys(d.readings).length === 0 && (
                                <div className="text-xs text-slate-400">No readings yet</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No devices match filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ALERTS TAB ── */}
      {tab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-700">Device Alerts</h2>
            <button onClick={() => setAlertsRaw(ls<IoTAlert[]>(LS_ALERTS, []))}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 bg-white transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="space-y-3">
            {[...alerts].sort((a, b) => b.ts.localeCompare(a.ts)).map(a => (
              <div key={a.id} className={`bg-white rounded-xl p-4 border shadow-sm flex items-start gap-4 ${a.resolved ? 'opacity-60' : 'border-slate-100'}`}>
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${a.severity === 'critical' ? 'text-red-500' : a.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sevColor(a.severity)}`}>{a.severity}</span>
                    <span className="text-xs font-medium text-slate-600">{a.type}</span>
                    <span className="text-xs text-slate-400">· {a.deviceName}</span>
                    {a.resolved && <span className="text-xs text-green-600 font-medium">✓ Resolved</span>}
                  </div>
                  <p className="text-sm text-slate-700 mt-1">{a.message}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{fmtTs(a.ts)}</p>
                </div>
                {!a.resolved && (
                  <button onClick={() => resolveAlert(a.id)}
                    className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-100 transition-colors flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" /> Resolve
                  </button>
                )}
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center text-slate-400 py-12">No alerts recorded</div>
            )}
          </div>
        </div>
      )}

      {/* ── ADD DEVICE TAB ── */}
      {tab === 'add' && (
        <div className="max-w-xl">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" /> Register New Device
            </h2>
            <form onSubmit={submitDevice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Device Name *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Field C Soil Sensor"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Device Family *</label>
                <select required value={form.family} onChange={e => setForm({ ...form, family: e.target.value as DeviceFamily })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                  {ALL_FAMILIES.map(f => (
                    <option key={f} value={f}>{FAMILY_ICON[f]} {FAMILY_LABEL[f]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Model</label>
                <input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })}
                  placeholder="e.g. SoilPro 300"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Location *</label>
                <input required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Field D"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Enterprise ID</label>
                <input value={form.enterprise} onChange={e => setForm({ ...form, enterprise: e.target.value })}
                  placeholder={eid || 'enterprise-id'}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Battery % (or type "Wired")</label>
                <input value={form.batteryPct} onChange={e => setForm({ ...form, batteryPct: e.target.value })}
                  placeholder="e.g. 85 or Wired"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit"
                  className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-indigo-700 transition-colors">
                  Register Device
                </button>
                <button type="button" onClick={() => setForm(BLANK_FORM)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
