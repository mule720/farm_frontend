import React, { useState, useMemo, useCallback } from 'react';
import {
  Wifi, WifiOff, Radio, Thermometer, Droplets, Wind, Scale, MapPin,
  Battery, BatteryLow, BatteryMedium, AlertTriangle, CheckCircle,
  Plus, Trash2, Settings, Bell, BellOff, RefreshCw, Activity,
  MessageCircle, Phone, Cloud, Zap, ChevronDown, ChevronUp,
  X, Gauge, Eye, Navigation, Signal, SignalHigh, SignalLow,
} from 'lucide-react';
import { useOrg } from '@/store/orgStore';
import { getTemplate } from '@/lib/templates';

// ─── Types ────────────────────────────────────────────────────────────────────

type DeviceType =
  | 'soil_moisture' | 'temperature' | 'humidity' | 'water_level'
  | 'weight_scale'  | 'gas_detector'| 'gps_tracker'| 'ph_sensor'
  | 'do_sensor'     | 'light_sensor'| 'wind_speed' | 'rain_gauge';

type Connectivity = 'lora' | 'nbiot' | 'wifi' | 'bluetooth';
type DeviceStatus = 'online' | 'offline' | 'warning' | 'critical';

interface Device {
  id: string;
  name: string;
  type: DeviceType;
  enterpriseId: string;
  location: string;
  connectivity: Connectivity;
  status: DeviceStatus;
  battery: number;           // 0–100
  lastSeen: string;          // ISO date-time string
  reading: number | null;    // current reading value
  unit: string;
  alertEnabled: boolean;
  alertMin?: number;
  alertMax?: number;
}

interface AutomationRule {
  id: string;
  name: string;
  deviceId: string;
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  action: string;
  enabled: boolean;
  lastTriggered?: string;
}

interface AlertLog {
  id: string;
  ts: string;
  deviceName: string;
  message: string;
  channel: 'whatsapp' | 'sms' | 'app';
  severity: 'info' | 'warning' | 'critical';
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LS_DEVICES    = 'agronexus_v2_iot_devices';
const LS_RULES      = 'agronexus_v2_iot_rules';
const LS_ALERTS     = 'agronexus_v2_iot_alerts';

const DEVICE_TYPE_DEFS: Record<DeviceType, { label: string; icon: React.ElementType; unit: string; min: number; max: number; color: string }> = {
  soil_moisture: { label: 'Soil Moisture',    icon: Droplets,    unit: '%',     min: 0,   max: 100,  color: 'blue'   },
  temperature:   { label: 'Temperature',      icon: Thermometer, unit: '°C',    min: -10, max: 60,   color: 'orange' },
  humidity:      { label: 'Humidity',         icon: Wind,        unit: '%',     min: 0,   max: 100,  color: 'cyan'   },
  water_level:   { label: 'Water Level',      icon: Droplets,    unit: '%',     min: 0,   max: 100,  color: 'blue'   },
  weight_scale:  { label: 'Weight Scale',     icon: Scale,       unit: 'kg',    min: 0,   max: 5000, color: 'slate'  },
  gas_detector:  { label: 'Gas Detector',     icon: Wind,        unit: 'ppm',   min: 0,   max: 1000, color: 'red'    },
  gps_tracker:   { label: 'GPS Tracker',      icon: MapPin,      unit: 'loc',   min: 0,   max: 1,    color: 'green'  },
  ph_sensor:     { label: 'pH Sensor',        icon: Droplets,    unit: 'pH',    min: 0,   max: 14,   color: 'purple' },
  do_sensor:     { label: 'Dissolved O₂',     icon: Activity,    unit: 'mg/L',  min: 0,   max: 20,   color: 'teal'   },
  light_sensor:  { label: 'Light Intensity',  icon: Zap,         unit: 'lux',   min: 0,   max: 100000, color: 'yellow'},
  wind_speed:    { label: 'Wind Speed',       icon: Wind,        unit: 'km/h',  min: 0,   max: 200,  color: 'slate'  },
  rain_gauge:    { label: 'Rainfall',         icon: Cloud,       unit: 'mm',    min: 0,   max: 300,  color: 'blue'   },
};

const CONNECTIVITY_DEFS: Record<Connectivity, { label: string; icon: React.ElementType; color: string }> = {
  lora:      { label: 'LoRaWAN',   icon: Radio,    color: 'purple' },
  nbiot:     { label: 'NB-IoT',    icon: Signal,   color: 'blue'   },
  wifi:      { label: 'Wi-Fi',     icon: Wifi,     color: 'green'  },
  bluetooth: { label: 'Bluetooth', icon: Activity, color: 'indigo' },
};

const SEED_DEVICES: Device[] = [
  {
    id: 'dev-1', name: 'Broiler House 1 — Temp', type: 'temperature', enterpriseId: '', location: 'Broiler House 1',
    connectivity: 'lora', status: 'online', battery: 87, lastSeen: new Date().toISOString(),
    reading: 28.4, unit: '°C', alertEnabled: true, alertMin: 15, alertMax: 35,
  },
  {
    id: 'dev-2', name: 'Broiler House 1 — Humidity', type: 'humidity', enterpriseId: '', location: 'Broiler House 1',
    connectivity: 'lora', status: 'warning', battery: 45, lastSeen: new Date().toISOString(),
    reading: 82, unit: '%', alertEnabled: true, alertMax: 80,
  },
  {
    id: 'dev-3', name: 'Borehole 1 — Water Level', type: 'water_level', enterpriseId: '', location: 'Borehole 1',
    connectivity: 'nbiot', status: 'online', battery: 91, lastSeen: new Date().toISOString(),
    reading: 61, unit: '%', alertEnabled: true, alertMin: 20,
  },
  {
    id: 'dev-4', name: 'Fish Pond A — pH', type: 'ph_sensor', enterpriseId: '', location: 'Fish Pond A',
    connectivity: 'nbiot', status: 'online', battery: 72, lastSeen: new Date().toISOString(),
    reading: 7.2, unit: 'pH', alertEnabled: true, alertMin: 6.5, alertMax: 8.5,
  },
  {
    id: 'dev-5', name: 'Fish Pond A — DO', type: 'do_sensor', enterpriseId: '', location: 'Fish Pond A',
    connectivity: 'nbiot', status: 'critical', battery: 18, lastSeen: new Date().toISOString(),
    reading: 3.1, unit: 'mg/L', alertEnabled: true, alertMin: 5,
  },
  {
    id: 'dev-6', name: 'Cattle GPS Tracker', type: 'gps_tracker', enterpriseId: '', location: 'Pasture Block C',
    connectivity: 'nbiot', status: 'online', battery: 64, lastSeen: new Date().toISOString(),
    reading: null, unit: 'loc', alertEnabled: false,
  },
];

const SEED_RULES: AutomationRule[] = [
  { id: 'rule-1', name: 'Low DO Alert', deviceId: 'dev-5', condition: 'below', threshold: 5, action: 'Send WhatsApp alert + trigger aerator relay', enabled: true, lastTriggered: new Date().toISOString() },
  { id: 'rule-2', name: 'High Humidity Warning', deviceId: 'dev-2', condition: 'above', threshold: 80, action: 'Send SMS alert to farm manager', enabled: true },
  { id: 'rule-3', name: 'Low Water Level Pump', deviceId: 'dev-3', condition: 'below', threshold: 25, action: 'Auto-start submersible pump', enabled: false },
];

const SEED_ALERTS: AlertLog[] = [
  { id: 'al-1', ts: new Date(Date.now() - 3 * 60000).toISOString(), deviceName: 'Fish Pond A — DO', message: 'Critical: dissolved oxygen 3.1 mg/L — below minimum 5 mg/L. Aerator auto-triggered.', channel: 'whatsapp', severity: 'critical' },
  { id: 'al-2', ts: new Date(Date.now() - 18 * 60000).toISOString(), deviceName: 'Broiler House 1 — Humidity', message: 'Warning: humidity 82% — exceeds max 80%. Increase ventilation.', channel: 'sms', severity: 'warning' },
  { id: 'al-3', ts: new Date(Date.now() - 2 * 3600000).toISOString(), deviceName: 'Borehole 1 — Water Level', message: 'Info: water level recovered to 61% after pump cycle.', channel: 'app', severity: 'info' },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function ls<T>(key: string, seed: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : seed;
  } catch { return seed; }
}
function lsSet<T>(key: string, val: T) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function uid() { return Math.random().toString(36).slice(2, 10); }
function fmtTs(iso: string) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

function useIoT() {
  const [devices,   setDevices]   = useState<Device[]>(() => ls(LS_DEVICES, SEED_DEVICES));
  const [rules,     setRules]     = useState<AutomationRule[]>(() => ls(LS_RULES, SEED_RULES));
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>(() => ls(LS_ALERTS, SEED_ALERTS));

  const saveDevices = useCallback((d: Device[])  => { setDevices(d);   lsSet(LS_DEVICES, d); }, []);
  const saveRules   = useCallback((r: AutomationRule[]) => { setRules(r); lsSet(LS_RULES, r); }, []);
  const saveLogs    = useCallback((l: AlertLog[]) => { setAlertLogs(l); lsSet(LS_ALERTS, l); }, []);

  const addDevice    = (d: Device)  => saveDevices([...devices, d]);
  const updateDevice = (id: string, patch: Partial<Device>) =>
    saveDevices(devices.map(d => d.id === id ? { ...d, ...patch } : d));
  const deleteDevice = (id: string) => saveDevices(devices.filter(d => d.id !== id));

  const addRule    = (r: AutomationRule) => saveRules([...rules, r]);
  const toggleRule = (id: string) => saveRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const deleteRule = (id: string) => saveRules(rules.filter(r => r.id !== id));

  return { devices, rules, alertLogs, addDevice, updateDevice, deleteDevice, addRule, toggleRule, deleteRule, saveLogs };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusDot({ status }: { status: DeviceStatus }) {
  const cfg: Record<DeviceStatus, string> = {
    online: 'bg-green-500', warning: 'bg-amber-400', critical: 'bg-red-500', offline: 'bg-slate-300',
  };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg[status]}`} />;
}

function BatteryIcon({ pct }: { pct: number }) {
  if (pct <= 20) return <BatteryLow className="w-4 h-4 text-red-500" />;
  if (pct <= 50) return <BatteryMedium className="w-4 h-4 text-amber-500" />;
  return <Battery className="w-4 h-4 text-green-500" />;
}

function ConnTag({ connectivity }: { connectivity: Connectivity }) {
  const def = CONNECTIVITY_DEFS[connectivity];
  const Icon = def.icon;
  const colors: Record<string, string> = {
    purple: 'bg-purple-100 text-purple-700', blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700', indigo: 'bg-indigo-100 text-indigo-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${colors[def.color]}`}>
      <Icon className="w-3 h-3" />{def.label}
    </span>
  );
}

function ReadingValue({ device }: { device: Device }) {
  if (device.type === 'gps_tracker') {
    return <span className="text-sm font-semibold text-slate-700 flex items-center gap-1"><Navigation className="w-3.5 h-3.5 text-green-600" /> Live</span>;
  }
  if (device.reading === null) return <span className="text-slate-400 text-sm">—</span>;
  const isAbove = device.alertMax !== undefined && device.reading > device.alertMax;
  const isBelow = device.alertMin !== undefined && device.reading < device.alertMin;
  const color = isAbove || isBelow ? 'text-red-600 font-bold' : 'text-slate-900 font-semibold';
  return (
    <span className={`text-lg ${color} tabular-nums`}>
      {device.reading}
      <span className="text-xs font-normal text-slate-400 ml-0.5">{device.unit}</span>
    </span>
  );
}

// ─── Add Device Modal ─────────────────────────────────────────────────────────

function AddDeviceModal({ enterprises, onSave, onClose }: {
  enterprises: { id: string; name: string }[];
  onSave: (d: Device) => void;
  onClose: () => void;
}) {
  const [name,          setName]         = useState('');
  const [type,          setType]         = useState<DeviceType>('temperature');
  const [enterpriseId,  setEnterpriseId] = useState(enterprises[0]?.id ?? '');
  const [location,      setLocation]     = useState('');
  const [connectivity,  setConn]         = useState<Connectivity>('lora');
  const [alertEnabled,  setAlert]        = useState(true);
  const [alertMin,      setAlertMin]     = useState('');
  const [alertMax,      setAlertMax]     = useState('');

  const def = DEVICE_TYPE_DEFS[type];

  function save() {
    if (!name.trim()) return;
    onSave({
      id: `dev-${uid()}`,
      name: name.trim(),
      type,
      enterpriseId,
      location: location.trim(),
      connectivity,
      status: 'offline',
      battery: 100,
      lastSeen: new Date().toISOString(),
      reading: null,
      unit: def.unit,
      alertEnabled,
      alertMin: alertMin !== '' ? parseFloat(alertMin) : undefined,
      alertMax: alertMax !== '' ? parseFloat(alertMax) : undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">Add Smart Device</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Device Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Greenhouse Temp Sensor" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Sensor Type *</label>
              <select value={type} onChange={e => setType(e.target.value as DeviceType)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                {(Object.entries(DEVICE_TYPE_DEFS) as [DeviceType, typeof DEVICE_TYPE_DEFS[DeviceType]][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Connectivity</label>
              <select value={connectivity} onChange={e => setConn(e.target.value as Connectivity)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                {(Object.entries(CONNECTIVITY_DEFS) as [Connectivity, typeof CONNECTIVITY_DEFS[Connectivity]][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Enterprise</label>
              <select value={enterpriseId} onChange={e => setEnterpriseId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">— none —</option>
                {enterprises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Location / Zone</label>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. House 2, Pond A" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={alertEnabled} onChange={e => setAlert(e.target.checked)} className="w-4 h-4 rounded accent-green-600" />
              <span className="text-sm text-slate-700">Enable threshold alerts</span>
            </label>
          </div>
          {alertEnabled && (
            <div className="grid grid-cols-2 gap-3 pl-6">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Min ({def.unit})</label>
                <input type="number" value={alertMin} onChange={e => setAlertMin(e.target.value)} placeholder="—" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Max ({def.unit})</label>
                <input type="number" value={alertMax} onChange={e => setAlertMax(e.target.value)} placeholder="—" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={!name.trim()} className="flex-1 bg-green-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-40">Add Device</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Rule Modal ────────────────────────────────────────────────────────────

function AddRuleModal({ devices, onSave, onClose }: {
  devices: Device[];
  onSave: (r: AutomationRule) => void;
  onClose: () => void;
}) {
  const [name,      setName]      = useState('');
  const [deviceId,  setDeviceId]  = useState(devices[0]?.id ?? '');
  const [condition, setCondition] = useState<'above' | 'below' | 'equals'>('below');
  const [threshold, setThreshold] = useState('');
  const [action,    setAction]    = useState('');

  const selectedDevice = devices.find(d => d.id === deviceId);

  function save() {
    if (!name.trim() || !threshold || !action.trim()) return;
    onSave({
      id: `rule-${uid()}`,
      name: name.trim(),
      deviceId,
      condition,
      threshold: parseFloat(threshold),
      action: action.trim(),
      enabled: true,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">New Automation Rule</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Rule Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Low DO Emergency Alert" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Trigger Device *</label>
            <select value={deviceId} onChange={e => setDeviceId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Condition</label>
              <select value={condition} onChange={e => setCondition(e.target.value as typeof condition)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="above">Goes above</option>
                <option value="below">Falls below</option>
                <option value="equals">Equals</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Threshold {selectedDevice?.unit ? `(${selectedDevice.unit})` : ''}</label>
              <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} placeholder="e.g. 5" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Action / Response *</label>
            <input value={action} onChange={e => setAction(e.target.value)} placeholder="e.g. Send WhatsApp alert + trigger pump relay" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={!name.trim() || !threshold || !action.trim()} className="flex-1 bg-green-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-40">Create Rule</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SmartDevicesModule() {
  const { org } = useOrg();
  const { devices, rules, alertLogs, addDevice, updateDevice, deleteDevice, addRule, toggleRule, deleteRule } = useIoT();
  const [tab, setTab] = useState<'dashboard' | 'devices' | 'rules' | 'alerts' | 'connectivity'>('dashboard');
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showAddRule,   setShowAddRule]   = useState(false);
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);

  const enterprises = (org?.enterprises ?? []).map(e => ({ id: e.id, name: e.name }));

  const stats = useMemo(() => ({
    total:    devices.length,
    online:   devices.filter(d => d.status === 'online').length,
    warning:  devices.filter(d => d.status === 'warning').length,
    critical: devices.filter(d => d.status === 'critical').length,
    offline:  devices.filter(d => d.status === 'offline').length,
    rules:    rules.filter(r => r.enabled).length,
  }), [devices, rules]);

  // AI insights derived from device readings
  const aiInsights = useMemo(() => {
    const insights: { icon: React.ElementType; color: string; bg: string; title: string; body: string }[] = [];
    devices.forEach(d => {
      if (d.type === 'do_sensor' && d.reading !== null && d.reading < 5) {
        insights.push({ icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', title: `Critical DO — ${d.name}`, body: `Dissolved oxygen at ${d.reading} mg/L — fish will stress below 5 mg/L. Aerators should already be running. Check for equipment failure.` });
      }
      if (d.type === 'humidity' && d.reading !== null && d.reading > 80) {
        insights.push({ icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', title: `High Humidity — ${d.name}`, body: `${d.reading}% humidity increases respiratory disease risk in poultry. Open side curtains and check exhaust fan operation.` });
      }
      if (d.type === 'water_level' && d.reading !== null && d.reading < 30) {
        insights.push({ icon: AlertTriangle, color: 'text-blue-600', bg: 'bg-blue-50', title: `Low Water — ${d.name}`, body: `Tank at ${d.reading}%. With current consumption rates, you have approximately ${Math.round(d.reading / 5)} hours of water remaining.` });
      }
      if (d.battery <= 20) {
        insights.push({ icon: BatteryLow, color: 'text-orange-600', bg: 'bg-orange-50', title: `Low Battery — ${d.name}`, body: `Battery at ${d.battery}%. Replace or recharge within 24 hours to avoid data gaps.` });
      }
    });
    if (insights.length === 0) {
      insights.push({ icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', title: 'All Systems Normal', body: 'No AI alerts at this time. All sensor readings are within configured thresholds.' });
    }
    return insights;
  }, [devices]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Smart Devices & IoT</h1>
          <p className="text-sm text-slate-500 mt-1">Sensors · automation rules · AI alerts · LoRaWAN · NB-IoT · GPS tracking</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border font-medium ${stats.critical > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            {stats.critical > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {stats.critical > 0 ? `${stats.critical} critical` : `${stats.online} online`}
          </span>
          <button onClick={() => setShowAddDevice(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium">
            <Plus className="w-4 h-4" /> Add Device
          </button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Devices',  value: stats.total,    color: 'text-slate-700' },
          { label: 'Online',         value: stats.online,   color: 'text-green-600' },
          { label: 'Warning',        value: stats.warning,  color: 'text-amber-600' },
          { label: 'Critical',       value: stats.critical, color: 'text-red-600'   },
          { label: 'Active Rules',   value: stats.rules,    color: 'text-blue-600'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit flex-wrap">
        {[
          { id: 'dashboard',    label: 'AI Dashboard' },
          { id: 'devices',      label: 'Devices' },
          { id: 'rules',        label: 'Automation' },
          { id: 'alerts',       label: 'Alert Log' },
          { id: 'connectivity', label: 'Connectivity' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── AI Dashboard ─────────────────────────────────────────────────────── */}
      {tab === 'dashboard' && (
        <div className="space-y-5">
          <div className="text-sm text-slate-500">AI analysis of live sensor readings against your production cycle context</div>

          {/* Critical devices first */}
          {devices.filter(d => d.status === 'critical' || d.status === 'warning').length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Devices Needing Attention</div>
              {devices.filter(d => d.status === 'critical' || d.status === 'warning').map(d => {
                const def = DEVICE_TYPE_DEFS[d.type];
                const Icon = def.icon;
                const isCrit = d.status === 'critical';
                return (
                  <div key={d.id} className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${isCrit ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                    <StatusDot status={d.status} />
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isCrit ? 'text-red-500' : 'text-amber-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${isCrit ? 'text-red-800' : 'text-amber-800'}`}>{d.name}</div>
                      <div className="text-xs text-slate-500">{d.location} · {fmtTs(d.lastSeen)}</div>
                    </div>
                    <ReadingValue device={d} />
                    <BatteryIcon pct={d.battery} />
                  </div>
                );
              })}
            </div>
          )}

          {/* AI insights */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">AI Insights</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiInsights.map((ins, i) => {
                const Icon = ins.icon;
                return (
                  <div key={i} className={`bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3`}>
                    <div className={`w-9 h-9 rounded-lg ${ins.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${ins.color}`} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{ins.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{ins.body}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All devices mini-grid */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">All Device Readings</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {devices.map(d => {
                const def = DEVICE_TYPE_DEFS[d.type];
                const Icon = def.icon;
                return (
                  <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StatusDot status={d.status} />
                        <span className="text-xs text-slate-500">{def.label}</span>
                      </div>
                      <BatteryIcon pct={d.battery} />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-700 truncate">{d.name}</span>
                    </div>
                    <ReadingValue device={d} />
                    <div className="text-[10px] text-slate-400 mt-1">{d.location} · {fmtTs(d.lastSeen)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Devices Tab ──────────────────────────────────────────────────────── */}
      {tab === 'devices' && (
        <div className="space-y-3">
          {devices.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Radio className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No devices registered. Add your first sensor above.</p>
            </div>
          )}
          {devices.map(d => {
            const def = DEVICE_TYPE_DEFS[d.type];
            const Icon = def.icon;
            const expanded = expandedDevice === d.id;
            const isAbove = d.alertMax !== undefined && d.reading !== null && d.reading > d.alertMax;
            const isBelow = d.alertMin !== undefined && d.reading !== null && d.reading < d.alertMin;
            return (
              <div key={d.id} className={`bg-white rounded-xl border ${d.status === 'critical' ? 'border-red-200' : d.status === 'warning' ? 'border-amber-200' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <StatusDot status={d.status} />
                  <div className={`w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">{d.name}</span>
                      <ConnTag connectivity={d.connectivity} />
                      {(isAbove || isBelow) && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                          {isBelow ? 'Below min' : 'Above max'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{d.location} · {fmtTs(d.lastSeen)}</div>
                  </div>
                  <ReadingValue device={d} />
                  <BatteryIcon pct={d.battery} />
                  <span className="text-xs text-slate-400 w-8 text-right tabular-nums">{d.battery}%</span>
                  <button onClick={() => setExpandedDevice(expanded ? null : d.id)} className="p-1.5 hover:bg-slate-100 rounded-lg ml-1">
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>

                {expanded && (
                  <div className="border-t border-slate-100 px-4 py-4 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div><span className="text-slate-400">Type</span><br /><span className="font-medium">{def.label}</span></div>
                      <div><span className="text-slate-400">Unit</span><br /><span className="font-medium">{d.unit}</span></div>
                      <div><span className="text-slate-400">Alert Min</span><br /><span className="font-medium">{d.alertMin ?? '—'}</span></div>
                      <div><span className="text-slate-400">Alert Max</span><br /><span className="font-medium">{d.alertMax ?? '—'}</span></div>
                    </div>
                    {/* Simulate reading */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const typeDef = DEVICE_TYPE_DEFS[d.type];
                          const range = typeDef.max - typeDef.min;
                          const reading = parseFloat((typeDef.min + Math.random() * range).toFixed(2));
                          const isA = d.alertMax !== undefined && reading > d.alertMax;
                          const isB = d.alertMin !== undefined && reading < d.alertMin;
                          const status: DeviceStatus = isA || isB ? (Math.random() > 0.5 ? 'critical' : 'warning') : 'online';
                          updateDevice(d.id, { reading, status, lastSeen: new Date().toISOString() });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Simulate Reading
                      </button>
                      <button
                        onClick={() => updateDevice(d.id, { alertEnabled: !d.alertEnabled })}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-xs rounded-lg text-slate-600 hover:bg-slate-50"
                      >
                        {d.alertEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                        {d.alertEnabled ? 'Alerts On' : 'Alerts Off'}
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete "${d.name}"?`)) deleteDevice(d.id); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-xs rounded-lg text-red-600 hover:bg-red-50 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Automation Rules ──────────────────────────────────────────────────── */}
      {tab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">IF/THEN rules that trigger actions automatically when sensor thresholds are crossed</p>
            <button onClick={() => setShowAddRule(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium">
              <Plus className="w-4 h-4" /> New Rule
            </button>
          </div>
          {rules.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">No automation rules yet. Add one above.</div>
          )}
          {rules.map(r => {
            const device = devices.find(d => d.id === r.deviceId);
            return (
              <div key={r.id} className={`bg-white rounded-xl border p-4 ${r.enabled ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${r.enabled ? 'bg-blue-100' : 'bg-slate-100'}`}>
                    <Zap className={`w-5 h-5 ${r.enabled ? 'text-blue-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-slate-800 text-sm">{r.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {r.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 space-y-0.5">
                      <div><span className="font-medium text-slate-600">IF</span> {device?.name ?? 'Unknown device'} {r.condition} {r.threshold} {device?.unit}</div>
                      <div><span className="font-medium text-slate-600">THEN</span> {r.action}</div>
                      {r.lastTriggered && <div className="text-slate-400">Last triggered: {fmtTs(r.lastTriggered)}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleRule(r.id)} className={`relative w-10 h-5 rounded-full transition-colors ${r.enabled ? 'bg-green-500' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${r.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <button onClick={() => { if (confirm(`Delete rule "${r.name}"?`)) deleteRule(r.id); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Alert Log ─────────────────────────────────────────────────────────── */}
      {tab === 'alerts' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">History of alerts sent via WhatsApp, SMS, and in-app notifications</p>
          {alertLogs.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">No alert history yet.</div>
          )}
          {alertLogs.map(log => {
            const channelIcon = log.channel === 'whatsapp' ? MessageCircle : log.channel === 'sms' ? Phone : Bell;
            const Icon = channelIcon;
            const sevCfg: Record<string, string> = {
              critical: 'border-red-200 bg-red-50',
              warning:  'border-amber-200 bg-amber-50',
              info:     'border-slate-200 bg-white',
            };
            const iconCfg: Record<string, string> = {
              critical: 'bg-red-100 text-red-600',
              warning:  'bg-amber-100 text-amber-600',
              info:     'bg-slate-100 text-slate-500',
            };
            return (
              <div key={log.id} className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${sevCfg[log.severity]}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconCfg[log.severity]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-semibold text-slate-700">{log.deviceName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${sevCfg[log.severity]}`}>{log.severity}</span>
                    <span className="text-[10px] text-slate-400 uppercase">{log.channel}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-snug">{log.message}</p>
                </div>
                <div className="text-[10px] text-slate-400 flex-shrink-0 mt-0.5">{fmtTs(log.ts)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Connectivity ──────────────────────────────────────────────────────── */}
      {tab === 'connectivity' && (
        <div className="space-y-5">
          <p className="text-sm text-slate-500">Network technologies in use across your IoT device fleet</p>

          {/* Protocol summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.entries(CONNECTIVITY_DEFS) as [Connectivity, typeof CONNECTIVITY_DEFS[Connectivity]][]).map(([key, def]) => {
              const Icon = def.icon;
              const count = devices.filter(d => d.connectivity === key).length;
              const onlineCount = devices.filter(d => d.connectivity === key && d.status === 'online').length;
              const colors: Record<string, string> = {
                purple: 'from-purple-500 to-purple-700',
                blue:   'from-blue-500 to-blue-700',
                green:  'from-green-500 to-green-700',
                indigo: 'from-indigo-500 to-indigo-700',
              };
              return (
                <div key={key} className={`rounded-xl bg-gradient-to-br ${colors[def.color]} p-4 text-white`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5 opacity-80" />
                    <span className="text-sm font-bold">{def.label}</span>
                  </div>
                  <div className="text-3xl font-bold mb-0.5">{count}</div>
                  <div className="text-xs opacity-70">{onlineCount} online</div>
                </div>
              );
            })}
          </div>

          {/* WhatsApp bot simulation */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">WhatsApp Alert Bot</div>
                <div className="text-xs text-green-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Connected</div>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { time: '06:15', msg: '⚠️ CRITICAL DO: Fish Pond A — DO at 3.1 mg/L. Aerator triggered automatically.', type: 'critical' },
                { time: '07:02', msg: '⚠️ HIGH HUMIDITY: Broiler House 1 at 82%. Increase ventilation.', type: 'warning' },
                { time: '08:30', msg: '✅ WATER LEVEL: Borehole 1 recovered to 61% after pump cycle.', type: 'info' },
                { time: '—',     msg: '📋 PENDING: Battery low on Fish Pond A — DO sensor (18%). Replace within 24h.', type: 'pending' },
              ].map((m, i) => {
                const cfg = m.type === 'critical' ? 'border-red-200 bg-red-50 text-red-700' : m.type === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-700' : m.type === 'info' ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-50 text-slate-500';
                return (
                  <div key={i} className={`flex items-start gap-3 rounded-lg border px-3 py-2 ${cfg}`}>
                    <span className="text-[10px] font-mono flex-shrink-0 mt-0.5 w-8">{m.time}</span>
                    <span className="text-xs leading-snug">{m.msg}</span>
                    {m.time !== '—' && <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 opacity-60" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SMS fallback */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                <Phone className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-800">SMS Fallback (Airtel/MTN)</div>
                <div className="text-xs text-slate-500">Low-bandwidth alert channel when internet is unavailable</div>
              </div>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">Connected</span>
            </div>
          </div>

          {/* NDVI */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center">
                <Cloud className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-800">Sentinel-2 NDVI Feed</div>
                <div className="text-xs text-slate-500">Weekly satellite crop health imagery · last update 2 days ago</div>
              </div>
              <span className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded-full font-medium">Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddDevice && (
        <AddDeviceModal
          enterprises={enterprises}
          onSave={d => { addDevice(d); setShowAddDevice(false); }}
          onClose={() => setShowAddDevice(false)}
        />
      )}
      {showAddRule && (
        <AddRuleModal
          devices={devices}
          onSave={r => { addRule(r); setShowAddRule(false); }}
          onClose={() => setShowAddRule(false)}
        />
      )}
    </div>
  );
}
