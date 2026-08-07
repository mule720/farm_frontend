import React, { useState } from 'react';
import {
  Leaf, Thermometer, Droplets, Wind, Sun, AlertTriangle,
  Activity, Plus, Settings, Zap, ChevronRight, CloudRain,
} from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  zone_type: string;
  area_m2: number;
  crop_type: string;
  is_active: boolean;
  climate: { temp_c: number; humidity_pct: number; co2_ppm: number; vpd: number; is_alert: boolean };
  target: { temp_min_c: number; temp_max_c: number; humidity_min_pct: number; humidity_max_pct: number; co2_min_ppm: number; co2_max_ppm: number };
  hydro?: { ec_ms_cm: number; ph: number; tank_level_pct: number };
}

const MOCK_ZONES: Zone[] = [
  {
    id: '1', name: 'Tunnel 1 — Tomatoes', zone_type: 'polytunnel', area_m2: 500,
    crop_type: 'Tomato', is_active: true,
    climate: { temp_c: 28.4, humidity_pct: 74, co2_ppm: 412, vpd: 1.2, is_alert: false },
    target: { temp_min_c: 18, temp_max_c: 28, humidity_min_pct: 65, humidity_max_pct: 85, co2_min_ppm: 400, co2_max_ppm: 1200 },
  },
  {
    id: '2', name: 'NFT Hydroponic Bay', zone_type: 'hydroponic', area_m2: 200,
    crop_type: 'Lettuce', is_active: true,
    climate: { temp_c: 22.1, humidity_pct: 68, co2_ppm: 450, vpd: 0.9, is_alert: false },
    target: { temp_min_c: 18, temp_max_c: 26, humidity_min_pct: 60, humidity_max_pct: 80, co2_min_ppm: 400, co2_max_ppm: 1000 },
    hydro: { ec_ms_cm: 1.8, ph: 6.2, tank_level_pct: 72 },
  },
  {
    id: '3', name: 'Mushroom House', zone_type: 'mushroom', area_m2: 80,
    crop_type: 'Oyster Mushroom', is_active: true,
    climate: { temp_c: 24.5, humidity_pct: 92, co2_ppm: 880, vpd: 0.3, is_alert: true },
    target: { temp_min_c: 20, temp_max_c: 24, humidity_min_pct: 85, humidity_max_pct: 95, co2_min_ppm: 500, co2_max_ppm: 800 },
  },
  {
    id: '4', name: 'Seedling Nursery', zone_type: 'nursery', area_m2: 120,
    crop_type: 'Mixed', is_active: true,
    climate: { temp_c: 26.0, humidity_pct: 70, co2_ppm: 420, vpd: 1.1, is_alert: false },
    target: { temp_min_c: 20, temp_max_c: 30, humidity_min_pct: 60, humidity_max_pct: 80, co2_min_ppm: 380, co2_max_ppm: 1000 },
  },
];

const ACTUATORS = [
  { id: 'fan', label: 'Circulation Fan', icon: Wind, state: true, color: 'blue' },
  { id: 'mister', label: 'Misting System', icon: CloudRain, state: false, color: 'cyan' },
  { id: 'grow_light', label: 'Grow Lights', icon: Sun, state: true, color: 'yellow' },
  { id: 'co2_injector', label: 'CO₂ Injector', icon: Activity, state: false, color: 'purple' },
];

const FERTIGATION_EVENTS = [
  { time: '06:00', volume_l: 80, ec_before: 1.2, ec_after: 1.9, ph_before: 7.1, ph_after: 6.1 },
  { time: '12:00', volume_l: 60, ec_before: 1.4, ec_after: 1.8, ph_before: 7.0, ph_after: 6.2 },
  { time: '16:30', volume_l: 90, ec_before: 1.3, ec_after: 2.0, ph_before: 7.2, ph_after: 6.0 },
];

function ClimateGauge({ label, value, min, max, unit, icon: Icon }: {
  label: string; value: number; min: number; max: number; unit: string; icon: React.ElementType;
}) {
  const pct = Math.min(100, Math.max(0, ((value - (min - (max - min) * 0.1)) / ((max + (max - min) * 0.1) - (min - (max - min) * 0.1))) * 100));
  const inRange = value >= min && value <= max;
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div className={`text-xl font-bold mb-1.5 ${inRange ? 'text-green-700' : 'text-red-600'}`}>
        {value}{unit}
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${inRange ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

function ZoneCard({ zone, onClick, active }: { zone: Zone; onClick: () => void; active: boolean }) {
  const typeLabels: Record<string, string> = {
    polytunnel: 'Polytunnel', greenhouse: 'Greenhouse', hydroponic: 'Hydroponic',
    mushroom: 'Mushroom House', nursery: 'Nursery', shade_house: 'Shade House',
  };
  return (
    <button onClick={onClick} className={`w-full text-left rounded-xl border p-4 transition-all ${active ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${zone.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
            <span className="font-semibold text-slate-800 text-sm">{zone.name}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{typeLabels[zone.zone_type] || zone.zone_type} · {zone.area_m2} m²</div>
        </div>
        {zone.climate.is_alert && (
          <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" /> Alert
          </span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center"><div className="text-sm font-bold text-slate-800">{zone.climate.temp_c}°</div><div className="text-[10px] text-slate-400">Temp °C</div></div>
        <div className="text-center"><div className="text-sm font-bold text-slate-800">{zone.climate.humidity_pct}%</div><div className="text-[10px] text-slate-400">Humidity</div></div>
        <div className="text-center"><div className="text-sm font-bold text-slate-800">{zone.climate.co2_ppm}</div><div className="text-[10px] text-slate-400">CO₂ ppm</div></div>
        <div className="text-center"><div className="text-sm font-bold text-slate-800">{zone.climate.vpd.toFixed(1)}</div><div className="text-[10px] text-slate-400">VPD kPa</div></div>
      </div>
      {zone.hydro && (
        <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-3 gap-2">
          <div className="text-center"><div className="text-xs font-bold text-blue-700">{zone.hydro.ec_ms_cm}</div><div className="text-[10px] text-slate-400">EC mS/cm</div></div>
          <div className="text-center"><div className="text-xs font-bold text-blue-700">{zone.hydro.ph}</div><div className="text-[10px] text-slate-400">pH</div></div>
          <div className="text-center"><div className="text-xs font-bold text-blue-700">{zone.hydro.tank_level_pct}%</div><div className="text-[10px] text-slate-400">Tank</div></div>
        </div>
      )}
    </button>
  );
}

export default function GreenhouseModule() {
  const [selectedZone, setSelectedZone] = useState(MOCK_ZONES[0]);
  const [actuators, setActuators] = useState(ACTUATORS.map(a => ({ ...a })));
  const [activeTab, setActiveTab] = useState<'climate' | 'fertigation' | 'lights'>('climate');

  function toggleActuator(id: string) {
    setActuators(prev => prev.map(a => a.id === id ? { ...a, state: !a.state } : a));
  }

  const alertZones = MOCK_ZONES.filter(z => z.climate.is_alert);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Greenhouse & Climate Control</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time environment monitoring · fertigation · hydroponics · grow lights</p>
        </div>
        <div className="flex gap-2">
          {alertZones.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              <AlertTriangle className="w-4 h-4" />
              {alertZones.length} zone{alertZones.length > 1 ? 's' : ''} out of range
            </div>
          )}
          <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Zone
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone List */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Zones ({MOCK_ZONES.length})</div>
          {MOCK_ZONES.map(z => (
            <ZoneCard key={z.id} zone={z} onClick={() => setSelectedZone(z)} active={selectedZone.id === z.id} />
          ))}
        </div>

        {/* Zone Detail */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedZone.name}</h2>
                <p className="text-sm text-slate-500">{selectedZone.crop_type} · {selectedZone.area_m2} m²</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg"><Settings className="w-4 h-4" /></button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg w-fit">
              {(['climate', 'fertigation', 'lights'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'climate' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ClimateGauge label="Temperature" value={selectedZone.climate.temp_c} min={selectedZone.target.temp_min_c} max={selectedZone.target.temp_max_c} unit="°C" icon={Thermometer} />
                  <ClimateGauge label="Humidity" value={selectedZone.climate.humidity_pct} min={selectedZone.target.humidity_min_pct} max={selectedZone.target.humidity_max_pct} unit="%" icon={Droplets} />
                  <ClimateGauge label="CO₂" value={selectedZone.climate.co2_ppm} min={selectedZone.target.co2_min_ppm} max={selectedZone.target.co2_max_ppm} unit=" ppm" icon={Activity} />
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2"><Leaf className="w-3.5 h-3.5 text-slate-500" /><span className="text-xs text-slate-500">VPD</span></div>
                    <div className={`text-xl font-bold mb-1.5 ${selectedZone.climate.vpd >= 0.8 && selectedZone.climate.vpd <= 1.2 ? 'text-green-700' : 'text-amber-600'}`}>{selectedZone.climate.vpd} kPa</div>
                    <div className="text-[10px] text-slate-400">Ideal 0.8–1.2 kPa</div>
                  </div>
                </div>

                {/* Actuators */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Actuators</div>
                  <div className="grid grid-cols-2 gap-2">
                    {actuators.map(act => {
                      const Icon = act.icon;
                      return (
                        <button key={act.id} onClick={() => toggleActuator(act.id)} className={`flex items-center justify-between rounded-lg px-3 py-2.5 border transition-all text-sm font-medium ${act.state ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                          <div className="flex items-center gap-2"><Icon className="w-4 h-4" />{act.label}</div>
                          <div className={`w-8 h-4 rounded-full transition-colors ${act.state ? 'bg-blue-500' : 'bg-slate-300'}`}>
                            <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-all shadow ${act.state ? 'ml-4' : 'ml-0.5'}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'fertigation' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-slate-700">Today's Fertigation Events</div>
                  <button className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"><Plus className="w-3 h-3" />Manual Dose</button>
                </div>
                <div className="space-y-2">
                  {FERTIGATION_EVENTS.map((ev, i) => (
                    <div key={i} className="bg-slate-50 rounded-lg px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        <div>
                          <div className="text-sm font-medium text-slate-800">{ev.time} — {ev.volume_l} L</div>
                          <div className="text-xs text-slate-500">EC {ev.ec_before}→{ev.ec_after} mS/cm · pH {ev.ph_before}→{ev.ph_after}</div>
                        </div>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Done</span>
                    </div>
                  ))}
                </div>
                {selectedZone.hydro && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="text-sm font-semibold text-blue-800 mb-2">Hydroponic Tank Status</div>
                    <div className="grid grid-cols-3 gap-4">
                      <div><div className="text-xl font-bold text-blue-700">{selectedZone.hydro.ec_ms_cm}</div><div className="text-xs text-blue-600">EC mS/cm</div></div>
                      <div><div className="text-xl font-bold text-blue-700">{selectedZone.hydro.ph}</div><div className="text-xs text-blue-600">pH</div></div>
                      <div><div className="text-xl font-bold text-blue-700">{selectedZone.hydro.tank_level_pct}%</div><div className="text-xs text-blue-600">Tank Level</div></div>
                    </div>
                    <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${selectedZone.hydro.tank_level_pct}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'lights' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Sun className="w-5 h-5 text-amber-500" />
                    <div className="font-semibold text-amber-900">Active Grow Light Schedule</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><div className="text-lg font-bold text-amber-800">06:00</div><div className="text-xs text-amber-600">Lights ON</div></div>
                    <div><div className="text-lg font-bold text-amber-800">20:00</div><div className="text-xs text-amber-600">Lights OFF</div></div>
                    <div><div className="text-lg font-bold text-amber-800">85%</div><div className="text-xs text-amber-600">Intensity</div></div>
                  </div>
                  <div className="mt-3 text-xs text-amber-700 bg-amber-100 rounded px-3 py-1.5">
                    Spectrum: Full — Vegetative Stage · 14 h photoperiod
                  </div>
                </div>
                <div className="text-xs text-slate-500 text-center">Photosynthetically active — DLI target: 17 mol/m²/day</div>
                <div className="flex justify-center">
                  <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    <Settings className="w-4 h-4" /> Edit Schedule
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Zones', value: MOCK_ZONES.filter(z => z.is_active).length, sub: 'of 4 total', color: 'green' },
          { label: 'Alerts', value: alertZones.length, sub: 'zones out of range', color: alertZones.length > 0 ? 'red' : 'green' },
          { label: 'Fertigation Today', value: '230 L', sub: '3 doses delivered', color: 'blue' },
          { label: 'Avg Temp', value: `${(MOCK_ZONES.reduce((s, z) => s + z.climate.temp_c, 0) / MOCK_ZONES.length).toFixed(1)}°C`, sub: 'across all zones', color: 'amber' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-sm font-medium text-slate-700 mt-1">{stat.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
