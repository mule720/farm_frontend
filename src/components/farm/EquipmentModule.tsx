import React, { useState } from 'react';
import { Tractor, Wrench, AlertTriangle, MapPin, Fuel, Clock, Plus, Zap } from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  equipment_type: string;
  autonomous_level: string;
  status: string;
  engine_hours: number;
  service_interval_hours: number;
  last_service_hours: number;
  current_fuel_pct: number;
  current_latitude: number | null;
  current_longitude: number | null;
  manufacturer: string;
  model_number: string;
  year_manufactured: number;
}

const MOCK_EQUIPMENT: Equipment[] = [
  { id: '1', name: 'JD 5075E Tractor', equipment_type: 'tractor', autonomous_level: 'semi_auto', status: 'in_use', engine_hours: 1248, service_interval_hours: 250, last_service_hours: 1060, current_fuel_pct: 72, current_latitude: -15.416, current_longitude: 28.283, manufacturer: 'John Deere', model_number: '5075E', year_manufactured: 2021 },
  { id: '2', name: 'New Holland Harvester', equipment_type: 'harvester', autonomous_level: 'manual', status: 'operational', engine_hours: 567, service_interval_hours: 250, last_service_hours: 440, current_fuel_pct: 85, current_latitude: null, current_longitude: null, manufacturer: 'New Holland', model_number: 'CR7.90', year_manufactured: 2020 },
  { id: '3', name: 'Irrigation Pump #1', equipment_type: 'pump', autonomous_level: 'full_auto', status: 'operational', engine_hours: 3420, service_interval_hours: 500, last_service_hours: 3200, current_fuel_pct: 100, current_latitude: null, current_longitude: null, manufacturer: 'Grundfos', model_number: 'CM5-5', year_manufactured: 2019 },
  { id: '4', name: 'Delivery Truck', equipment_type: 'truck', autonomous_level: 'manual', status: 'maintenance', engine_hours: 0, service_interval_hours: 10000, last_service_hours: 0, current_fuel_pct: 45, current_latitude: null, current_longitude: null, manufacturer: 'Isuzu', model_number: 'NPS300', year_manufactured: 2018 },
  { id: '5', name: 'AgriBot Sprayer Drone', equipment_type: 'drone', autonomous_level: 'full_auto', status: 'operational', engine_hours: 124, service_interval_hours: 50, last_service_hours: 98, current_fuel_pct: 0, current_latitude: null, current_longitude: null, manufacturer: 'DJI', model_number: 'Agras T40', year_manufactured: 2023 },
];

const STATUS_COLORS: Record<string, string> = {
  operational: 'bg-green-100 text-green-700',
  in_use: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-orange-100 text-orange-700',
  repair: 'bg-red-100 text-red-700',
  retired: 'bg-slate-100 text-slate-600',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  tractor: <Tractor className="w-5 h-5" />,
  harvester: <Tractor className="w-5 h-5" />,
  pump: <Zap className="w-5 h-5" />,
  truck: <Tractor className="w-5 h-5" />,
  drone: <Zap className="w-5 h-5" />,
};

function hoursUntilService(eq: Equipment) {
  return Math.max(0, eq.service_interval_hours - (eq.engine_hours - eq.last_service_hours));
}

function EquipmentCard({ eq, onView }: { eq: Equipment; onView: (id: string) => void }) {
  const hrs = hoursUntilService(eq);
  const serviceSoon = hrs < 20;
  const fuelLow = eq.current_fuel_pct < 25;
  return (
    <div className={`bg-white rounded-xl border p-4 space-y-3 ${serviceSoon || fuelLow ? 'border-orange-200' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${eq.status === 'in_use' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
            {TYPE_ICONS[eq.equipment_type] ?? <Tractor className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-sm">{eq.name}</div>
            <div className="text-xs text-slate-500">{eq.manufacturer} {eq.model_number} · {eq.year_manufactured}</div>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[eq.status] || 'bg-slate-100 text-slate-600'}`}>
          {eq.status.replace('_', ' ')}
        </span>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-xs text-slate-500">Engine hrs</div>
          <div className="font-bold text-slate-800">{eq.engine_hours.toLocaleString()}</div>
        </div>
        <div className={`rounded-lg p-2 ${serviceSoon ? 'bg-orange-50' : 'bg-slate-50'}`}>
          <div className="text-xs text-slate-500">To service</div>
          <div className={`font-bold ${serviceSoon ? 'text-orange-600' : 'text-slate-800'}`}>{hrs.toFixed(0)} h</div>
        </div>
        <div className={`rounded-lg p-2 ${fuelLow ? 'bg-red-50' : 'bg-slate-50'}`}>
          <div className="text-xs text-slate-500">Fuel</div>
          <div className={`font-bold ${fuelLow ? 'text-red-600' : 'text-slate-800'}`}>{eq.current_fuel_pct}%</div>
        </div>
      </div>

      {/* Alerts */}
      {(serviceSoon || fuelLow) && (
        <div className="flex flex-wrap gap-1.5">
          {serviceSoon && <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full"><Wrench className="w-3 h-3" /> Service due soon</span>}
          {fuelLow && <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full"><Fuel className="w-3 h-3" /> Low fuel</span>}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <div className="text-xs text-slate-400">
          {eq.autonomous_level !== 'manual' && (
            <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
              {eq.autonomous_level.replace('_', ' ')}
            </span>
          )}
          {eq.current_latitude && (
            <span className="flex items-center gap-0.5 ml-2 text-slate-400">
              <MapPin className="w-3 h-3" /> GPS live
            </span>
          )}
        </div>
        <button onClick={() => onView(eq.id)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">View →</button>
      </div>
    </div>
  );
}

function MaintenanceLogForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <h3 className="font-semibold text-slate-900">Log Maintenance</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Equipment</label>
          <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
            {MOCK_EQUIPMENT.map(e => <option key={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
          <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
            {['service','repair','inspection','oil','filter','tyre','other'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Service Date</label>
          <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Labour Cost (ZMW)</label>
          <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="0.00" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Parts Cost (ZMW)</label>
          <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="0.00" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
          <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm h-20 resize-none" placeholder="What was done..." />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
        <button className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">Save Record</button>
      </div>
    </div>
  );
}

export default function EquipmentModule() {
  const [tab, setTab] = useState<'fleet' | 'maintenance' | 'operations'>('fleet');
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const serviceDue = MOCK_EQUIPMENT.filter(e => hoursUntilService(e) < 20);
  const activeCount = MOCK_EQUIPMENT.filter(e => e.status === 'in_use').length;
  const maintenanceCount = MOCK_EQUIPMENT.filter(e => e.status === 'maintenance').length;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Tractor className="w-6 h-6 text-orange-600" /> Smart Equipment Fleet
          </h1>
          <p className="text-sm text-slate-500 mt-1">GPS tracking, telemetry & maintenance management</p>
        </div>
        <button onClick={() => setShowMaintForm(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700">
          <Plus className="w-4 h-4" /> Log Maintenance
        </button>
      </div>

      {serviceDue.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-orange-800 text-sm">Service due soon</div>
            <div className="text-xs text-orange-600 mt-0.5">{serviceDue.map(e => e.name).join(', ')}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Fleet', value: MOCK_EQUIPMENT.length, color: 'slate' },
          { label: 'In Use', value: activeCount, color: 'blue' },
          { label: 'Under Maintenance', value: maintenanceCount, color: 'orange' },
          { label: 'Service Alerts', value: serviceDue.length, color: 'red' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['fleet', 'maintenance', 'operations'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t}</button>
        ))}
      </div>

      {tab === 'fleet' && (
        <div className="space-y-4">
          {showMaintForm && <MaintenanceLogForm onClose={() => setShowMaintForm(false)} />}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {MOCK_EQUIPMENT.map(eq => <EquipmentCard key={eq.id} eq={eq} onView={setSelectedId} />)}
          </div>
        </div>
      )}

      {tab === 'maintenance' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Wrench className="w-4 h-4" /> Maintenance History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 text-xs text-slate-500 uppercase">
                <th className="text-left py-2 font-medium">Equipment</th>
                <th className="text-left py-2 font-medium">Type</th>
                <th className="text-left py-2 font-medium">Date</th>
                <th className="text-left py-2 font-medium">Labour</th>
                <th className="text-left py-2 font-medium">Parts</th>
                <th className="text-left py-2 font-medium">Total</th>
              </tr></thead>
              <tbody>
                {[
                  { eq: 'JD 5075E Tractor', type: 'Oil Change', date: '2026-05-15', labour: 'K450', parts: 'K1,200', total: 'K1,650' },
                  { eq: 'New Holland Harvester', type: 'Inspection', date: '2026-04-28', labour: 'K600', parts: 'K340', total: 'K940' },
                  { eq: 'Irrigation Pump #1', type: 'Filter Replacement', date: '2026-04-10', labour: 'K200', parts: 'K180', total: 'K380' },
                  { eq: 'Delivery Truck', type: 'Repair', date: '2026-06-01', labour: 'K800', parts: 'K2,400', total: 'K3,200' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2.5 font-medium text-slate-800">{row.eq}</td>
                    <td className="py-2.5 text-slate-600">{row.type}</td>
                    <td className="py-2.5 text-slate-500 text-xs">{row.date}</td>
                    <td className="py-2.5 text-slate-600">{row.labour}</td>
                    <td className="py-2.5 text-slate-600">{row.parts}</td>
                    <td className="py-2.5 font-semibold text-slate-900">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'operations' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Clock className="w-4 h-4" /> Field Operations</h3>
            <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"><Plus className="w-3 h-3" /> New Operation</button>
          </div>
          <div className="space-y-2">
            {[
              { op: 'Ploughing — Field A', equipment: 'JD 5075E Tractor', date: '2026-06-03', area: '2.5 ha', status: 'completed', cost: 'K850' },
              { op: 'Spraying — Field B', equipment: 'AgriBot Sprayer Drone', date: '2026-06-04', area: '1.2 ha', status: 'completed', cost: 'K320' },
              { op: 'Planting — Field C', equipment: 'JD 5075E Tractor', date: '2026-06-06', area: '3.0 ha', status: 'planned', cost: '—' },
              { op: 'Harvesting — Field A', equipment: 'New Holland Harvester', date: '2026-07-15', area: '2.5 ha', status: 'planned', cost: '—' },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm text-slate-900">{row.op}</div>
                  <div className="text-xs text-slate-500">{row.equipment} · {row.date} · {row.area}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-800">{row.cost}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${row.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{row.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
