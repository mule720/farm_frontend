import React, { useState } from 'react';
import { Leaf, Droplets, Award, CheckSquare, TrendingDown, Plus, AlertCircle, Shield } from 'lucide-react';

interface CarbonRow { category: string; co2e_kg: number; entry_type: 'emission' | 'offset'; date: string; }

const CARBON_DATA: CarbonRow[] = [
  { category: 'Fuel Combustion', co2e_kg: 1240, entry_type: 'emission', date: '2026-05' },
  { category: 'Enteric Fermentation', co2e_kg: 3200, entry_type: 'emission', date: '2026-05' },
  { category: 'Electricity Use', co2e_kg: 480, entry_type: 'emission', date: '2026-05' },
  { category: 'Synthetic Fertilizer', co2e_kg: 890, entry_type: 'emission', date: '2026-05' },
  { category: 'Agroforestry Sequestration', co2e_kg: 1800, entry_type: 'offset', date: '2026-05' },
  { category: 'Biogas from Manure', co2e_kg: 420, entry_type: 'offset', date: '2026-05' },
];

const WATER_DATA = [
  { use_type: 'Crop Irrigation', volume_m3: 1240, source: 'Borehole', month: 'May 2026' },
  { use_type: 'Livestock Watering', volume_m3: 320, source: 'Borehole', month: 'May 2026' },
  { use_type: 'Facility Cleaning', volume_m3: 85, source: 'Municipal', month: 'May 2026' },
  { use_type: 'Domestic / Staff', volume_m3: 45, source: 'Municipal', month: 'May 2026' },
];

const CERTIFICATIONS = [
  { name: 'GlobalG.A.P.', body: 'GLOBALG.A.P.', status: 'certified', expiry: '2027-03-31', score: null },
  { name: 'Organic Zambia', body: 'ZOCS', status: 'in_progress', expiry: null, score: null },
  { name: 'Rainforest Alliance', body: 'SAN', status: 'planning', expiry: null, score: null },
];

const COMPLIANCE_TASKS = [
  { title: 'Update pesticide application records', due: '2026-06-10', priority: 'high', status: 'open', cert: 'GlobalG.A.P.' },
  { title: 'Water quality test — borehole', due: '2026-06-15', priority: 'medium', status: 'in_progress', cert: 'GlobalG.A.P.' },
  { title: 'Submit monthly chemical register', due: '2026-06-30', priority: 'medium', status: 'open', cert: 'GlobalG.A.P.' },
  { title: 'Compost inputs audit', due: '2026-07-01', priority: 'low', status: 'open', cert: 'Organic Zambia' },
  { title: 'Worker health & safety training', due: '2026-05-31', priority: 'critical', status: 'overdue', cert: 'GlobalG.A.P.' },
];

const CERT_STATUS: Record<string, string> = {
  certified: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  planning: 'bg-slate-100 text-slate-600',
  expired: 'bg-red-100 text-red-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-slate-100 text-slate-600',
};

const TASK_STATUS_COLORS: Record<string, string> = {
  open: 'text-slate-500',
  in_progress: 'text-blue-600',
  done: 'text-green-600',
  overdue: 'text-red-600',
};

export default function SustainabilityModule() {
  const [tab, setTab] = useState<'carbon' | 'water' | 'certifications' | 'compliance'>('carbon');

  const totalEmissions = CARBON_DATA.filter(c => c.entry_type === 'emission').reduce((s, c) => s + c.co2e_kg, 0);
  const totalOffsets = CARBON_DATA.filter(c => c.entry_type === 'offset').reduce((s, c) => s + c.co2e_kg, 0);
  const netCarbon = totalEmissions - totalOffsets;
  const totalWater = WATER_DATA.reduce((s, w) => s + w.volume_m3, 0);
  const overdueTasks = COMPLIANCE_TASKS.filter(t => t.status === 'overdue').length;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-600" /> Sustainability & Compliance
          </h1>
          <p className="text-sm text-slate-500 mt-1">Carbon footprint, water usage, certifications & compliance tracking</p>
        </div>
      </div>

      {overdueTasks > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-800 text-sm">{overdueTasks} overdue compliance task{overdueTasks > 1 ? 's' : ''}</div>
            <div className="text-xs text-red-600 mt-0.5">These must be resolved to maintain certification status.</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Emissions', value: `${(totalEmissions / 1000).toFixed(1)} tCO₂e`, color: 'red', icon: TrendingDown },
          { label: 'Carbon Offsets', value: `${(totalOffsets / 1000).toFixed(1)} tCO₂e`, color: 'green', icon: Leaf },
          { label: 'Net Carbon', value: `${(netCarbon / 1000).toFixed(1)} tCO₂e`, color: 'amber', icon: Leaf },
          { label: 'Water Used (MTD)', value: `${totalWater} m³`, color: 'blue', icon: Droplets },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-9 h-9 bg-${color}-50 rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <div className="font-bold text-slate-900">{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['carbon', 'water', 'certifications', 'compliance'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t}</button>
        ))}
      </div>

      {tab === 'carbon' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h3 className="font-semibold text-slate-900 text-sm">Emissions by Category</h3>
              {CARBON_DATA.filter(c => c.entry_type === 'emission').map((c, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">{c.category}</span>
                    <span className="font-semibold text-slate-900">{c.co2e_kg.toLocaleString()} kg</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${(c.co2e_kg / totalEmissions) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h3 className="font-semibold text-slate-900 text-sm">Carbon Offsets</h3>
              {CARBON_DATA.filter(c => c.entry_type === 'offset').map((c, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">{c.category}</span>
                    <span className="font-semibold text-green-700">{c.co2e_kg.toLocaleString()} kg</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 rounded-full" style={{ width: `${(c.co2e_kg / totalOffsets) * 100}%` }} />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">Net Position</span>
                  <span className={`font-bold ${netCarbon > 0 ? 'text-red-600' : 'text-green-600'}`}>{netCarbon > 0 ? '+' : ''}{(netCarbon / 1000).toFixed(2)} tCO₂e</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
              <Plus className="w-4 h-4" /> Log Carbon Entry
            </button>
          </div>
        </div>
      )}

      {tab === 'water' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-600" /> Water Usage — May 2026</h3>
            <button className="flex items-center gap-1 text-sm text-blue-600 font-medium"><Plus className="w-3 h-3" /> Log Usage</button>
          </div>
          <div className="space-y-3">
            {WATER_DATA.map((w, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700 font-medium">{w.use_type}</span>
                  <span className="text-slate-600 font-semibold">{w.volume_m3} m³</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(w.volume_m3 / totalWater) * 100}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 w-16 text-right">{w.source}</span>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-100 flex justify-between text-sm">
              <span className="font-semibold text-slate-700">Total</span>
              <span className="font-bold text-blue-700">{totalWater} m³</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'certifications' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
              <Plus className="w-4 h-4" /> Add Certification
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CERTIFICATIONS.map((cert, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-green-700" />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CERT_STATUS[cert.status]}`}>{cert.status.replace('_', ' ')}</span>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{cert.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Issued by {cert.body}</div>
                  {cert.expiry && <div className="text-xs text-slate-400 mt-1">Expires: {cert.expiry}</div>}
                </div>
                <button className="w-full text-xs text-center py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                  {cert.status === 'certified' ? 'View Certificate' : 'Track Progress'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'compliance' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Shield className="w-4 h-4 text-green-600" /> Compliance Tasks</h3>
            <button className="flex items-center gap-1 text-sm text-green-600 font-medium"><Plus className="w-3 h-3" /> Add Task</button>
          </div>
          <div className="space-y-2">
            {COMPLIANCE_TASKS.map((task, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                <CheckSquare className={`w-4 h-4 flex-shrink-0 ${TASK_STATUS_COLORS[task.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-900 truncate">{task.title}</div>
                  <div className="text-xs text-slate-500">{task.cert} · Due: {task.due}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                  <span className={`text-xs font-medium ${TASK_STATUS_COLORS[task.status]}`}>{task.status.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
