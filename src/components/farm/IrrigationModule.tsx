import React, { useState } from 'react';
import { Droplets, Thermometer, Plus, Play, Square, AlertTriangle, Clock, Zap } from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  zone_type: string;
  water_source: string;
  area_ha: number;
  is_active: boolean;
  is_watering: boolean;
  moisture_min_pct: number;
  moisture_max_pct: number;
  current_moisture_pct: number | null;
  crop_type: string;
}

interface MockReading {
  zone_id: string;
  moisture_pct: number;
  temperature_c: number;
  recorded_at: string;
}

const MOCK_ZONES: Zone[] = [
  { id: '1', name: 'Field A — Maize', zone_type: 'drip', water_source: 'borehole', area_ha: 2.5, is_active: true, is_watering: true, moisture_min_pct: 35, moisture_max_pct: 70, current_moisture_pct: 28, crop_type: 'Maize' },
  { id: '2', name: 'Field B — Tomatoes', zone_type: 'sprinkler', water_source: 'dam', area_ha: 1.2, is_active: true, is_watering: false, moisture_min_pct: 45, moisture_max_pct: 80, current_moisture_pct: 62, crop_type: 'Tomatoes' },
  { id: '3', name: 'Nursery Beds', zone_type: 'drip', water_source: 'borehole', area_ha: 0.3, is_active: true, is_watering: false, moisture_min_pct: 55, moisture_max_pct: 85, current_moisture_pct: 41, crop_type: 'Seedlings' },
  { id: '4', name: 'Orchard Block', zone_type: 'flood', water_source: 'river', area_ha: 3.8, is_active: false, is_watering: false, moisture_min_pct: 30, moisture_max_pct: 65, current_moisture_pct: 55, crop_type: 'Citrus' },
];

function getMoistureStatus(zone: Zone): 'low' | 'ok' | 'high' {
  if (!zone.current_moisture_pct) return 'ok';
  if (zone.current_moisture_pct < zone.moisture_min_pct) return 'low';
  if (zone.current_moisture_pct > zone.moisture_max_pct) return 'high';
  return 'ok';
}

function MoistureBar({ zone }: { zone: Zone }) {
  const pct = zone.current_moisture_pct ?? 0;
  const status = getMoistureStatus(zone);
  const color = status === 'low' ? 'bg-red-500' : status === 'high' ? 'bg-blue-500' : 'bg-green-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>Soil Moisture</span>
        <span className={`font-semibold ${status === 'low' ? 'text-red-600' : status === 'high' ? 'text-blue-600' : 'text-green-600'}`}>{pct}%</span>
      </div>
      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
        {/* min threshold marker */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10" style={{ left: `${zone.moisture_min_pct}%` }} />
        {/* max threshold marker */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10" style={{ left: `${zone.moisture_max_pct}%` }} />
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>Min {zone.moisture_min_pct}%</span>
        <span>Max {zone.moisture_max_pct}%</span>
      </div>
    </div>
  );
}

function ZoneCard({ zone, onToggle }: { zone: Zone; onToggle: (id: string) => void }) {
  const status = getMoistureStatus(zone);
  return (
    <div className={`bg-white rounded-xl border p-4 space-y-3 ${!zone.is_active ? 'opacity-60' : ''} ${zone.is_watering ? 'border-blue-300 shadow-blue-100 shadow-md' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-slate-900 text-sm">{zone.name}</div>
          <div className="text-xs text-slate-500 mt-0.5">{zone.area_ha} ha · {zone.zone_type} · {zone.water_source}</div>
        </div>
        <div className="flex items-center gap-2">
          {status === 'low' && <AlertTriangle className="w-4 h-4 text-red-500" />}
          {zone.is_watering && (
            <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium animate-pulse">
              <Droplets className="w-3 h-3" /> Watering
            </span>
          )}
        </div>
      </div>
      <MoistureBar zone={zone} />
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onToggle(zone.id)}
          disabled={!zone.is_active}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            zone.is_watering
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {zone.is_watering ? <><Square className="w-3 h-3" /> Stop</> : <><Play className="w-3 h-3" /> Start</>}
        </button>
        <div className={`text-xs px-2 py-1 rounded-full ${zone.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          {zone.is_active ? 'Active' : 'Inactive'}
        </div>
      </div>
    </div>
  );
}

function AddZoneForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: '', zone_type: 'drip', water_source: 'borehole', area_ha: '', crop_type: '', moisture_min_pct: '35', moisture_max_pct: '70' });
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <h3 className="font-semibold text-slate-900">New Irrigation Zone</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Zone Name</label>
          <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Field A — Maize" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
          <select value={form.zone_type} onChange={e => setForm(f => ({...f, zone_type: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
            {['drip','sprinkler','flood','centre_pivot','manual'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Water Source</label>
          <select value={form.water_source} onChange={e => setForm(f => ({...f, water_source: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
            {['borehole','river','dam','municipal','rainwater','other'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Area (ha)</label>
          <input type="number" value={form.area_ha} onChange={e => setForm(f => ({...f, area_ha: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="2.5" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Crop Type</label>
          <input value={form.crop_type} onChange={e => setForm(f => ({...f, crop_type: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Maize" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Min Moisture %</label>
          <input type="number" value={form.moisture_min_pct} onChange={e => setForm(f => ({...f, moisture_min_pct: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Max Moisture %</label>
          <input type="number" value={form.moisture_max_pct} onChange={e => setForm(f => ({...f, moisture_max_pct: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
        <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Zone</button>
      </div>
    </div>
  );
}

export default function IrrigationModule() {
  const [zones, setZones] = useState<Zone[]>(MOCK_ZONES);
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState<'zones' | 'schedule' | 'history'>('zones');

  const alertZones = zones.filter(z => getMoistureStatus(z) === 'low' && z.is_active);
  const wateringZones = zones.filter(z => z.is_watering);

  function toggleWatering(id: string) {
    setZones(z => z.map(zone => zone.id === id ? { ...zone, is_watering: !zone.is_watering } : zone));
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Droplets className="w-6 h-6 text-blue-600" /> Smart Irrigation
          </h1>
          <p className="text-sm text-slate-500 mt-1">Soil moisture monitoring & automated zone control</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Zone
        </button>
      </div>

      {/* Alert banner */}
      {alertZones.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-800 text-sm">Low moisture alert</div>
            <div className="text-xs text-red-600 mt-0.5">{alertZones.map(z => z.name).join(', ')} — below minimum threshold. Consider activating irrigation.</div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Zones', value: zones.length, icon: Droplets, color: 'blue' },
          { label: 'Currently Watering', value: wateringZones.length, icon: Play, color: 'green' },
          { label: 'Low Moisture Alerts', value: alertZones.length, icon: AlertTriangle, color: 'red' },
          { label: 'Inactive Zones', value: zones.filter(z => !z.is_active).length, icon: Square, color: 'slate' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-9 h-9 bg-${color}-50 rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['zones', 'schedule', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t}</button>
        ))}
      </div>

      {tab === 'zones' && (
        <div className="space-y-4">
          {showAdd && <AddZoneForm onClose={() => setShowAdd(false)} />}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {zones.map(zone => <ZoneCard key={zone.id} zone={zone} onToggle={toggleWatering} />)}
          </div>
        </div>
      )}

      {tab === 'schedule' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-slate-500" />
            <h3 className="font-semibold text-slate-900">Irrigation Schedules</h3>
          </div>
          <div className="space-y-3">
            {[
              { zone: 'Field A — Maize', time: '06:00', duration: '45 min', frequency: 'Daily', trigger: 'Sensor' },
              { zone: 'Field B — Tomatoes', time: '05:30 & 17:00', duration: '30 min', frequency: 'Every other day', trigger: 'Scheduled' },
              { zone: 'Nursery Beds', time: '07:00', duration: '20 min', frequency: 'Daily', trigger: 'Scheduled' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm text-slate-900">{s.zone}</div>
                  <div className="text-xs text-slate-500">{s.frequency} at {s.time} for {s.duration}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.trigger === 'Sensor' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{s.trigger}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-slate-500" />
            <h3 className="font-semibold text-slate-900">Recent Events</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 text-xs text-slate-500 uppercase">
                <th className="text-left py-2 font-medium">Zone</th>
                <th className="text-left py-2 font-medium">Trigger</th>
                <th className="text-left py-2 font-medium">Duration</th>
                <th className="text-left py-2 font-medium">Volume (L)</th>
                <th className="text-left py-2 font-medium">Date</th>
              </tr></thead>
              <tbody>
                {[
                  { zone: 'Field A — Maize', trigger: 'Sensor', duration: '42 min', volume: '1,260', date: 'Today 06:00' },
                  { zone: 'Field B — Tomatoes', trigger: 'Scheduled', duration: '30 min', volume: '540', date: 'Today 05:30' },
                  { zone: 'Nursery Beds', trigger: 'Manual', duration: '15 min', volume: '90', date: 'Yesterday 14:00' },
                  { zone: 'Field A — Maize', trigger: 'Sensor', duration: '38 min', volume: '1,140', date: 'Yesterday 06:00' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2.5 font-medium text-slate-800">{row.zone}</td>
                    <td className="py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full ${row.trigger === 'Sensor' ? 'bg-purple-100 text-purple-700' : row.trigger === 'Manual' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{row.trigger}</span></td>
                    <td className="py-2.5 text-slate-600">{row.duration}</td>
                    <td className="py-2.5 text-slate-600">{row.volume}</td>
                    <td className="py-2.5 text-slate-500 text-xs">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
