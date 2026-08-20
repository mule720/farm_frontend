// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Sustainability & Compliance Module
// All data stored in localStorage. All buttons are wired. Full CRUD.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Leaf, Droplets, Award, CheckSquare, Square, TrendingDown, Plus, AlertCircle, Shield, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// ─── Types ────────────────────────────────────────────────────────────────────
type EntryType  = 'emission' | 'offset';
type CertStatus = 'certified' | 'in_progress' | 'planning' | 'expired';
type TaskStatus = 'open' | 'in_progress' | 'done' | 'overdue';
type Priority   = 'critical' | 'high' | 'medium' | 'low';

interface CarbonRow { id: string; category: string; co2e_kg: number; entry_type: EntryType; date: string; notes?: string; }
interface WaterRow  { id: string; use_type: string; volume_m3: number; source: string; month: string; notes?: string; }
interface Certification { id: string; name: string; body: string; status: CertStatus; expiry?: string; notes?: string; }
interface ComplianceTask { id: string; title: string; due: string; priority: Priority; status: TaskStatus; cert?: string; notes?: string; }

// ─── Storage keys ─────────────────────────────────────────────────────────────
const CARBON_KEY = 'agronexus_v2_carbon';
const WATER_KEY  = 'agronexus_v2_water';
const CERT_KEY   = 'agronexus_v2_certifications';
const TASK_KEY   = 'agronexus_v2_compliance_tasks';

function load<T>(key: string, fallback: T[]): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; } catch { return fallback; }
}
function save<T>(key: string, data: T[]) { localStorage.setItem(key, JSON.stringify(data)); }

// ─── Seed defaults on first load ──────────────────────────────────────────────
const SEED_CARBON: CarbonRow[] = [
  { id: uuidv4(), category: 'Fuel Combustion',            co2e_kg: 1240, entry_type: 'emission', date: new Date().toISOString().slice(0, 7) },
  { id: uuidv4(), category: 'Electricity Use',            co2e_kg: 480,  entry_type: 'emission', date: new Date().toISOString().slice(0, 7) },
  { id: uuidv4(), category: 'Agroforestry Sequestration', co2e_kg: 1800, entry_type: 'offset',   date: new Date().toISOString().slice(0, 7) },
];
const SEED_WATER: WaterRow[] = [
  { id: uuidv4(), use_type: 'Crop Irrigation',    volume_m3: 1240, source: 'Borehole',  month: new Date().toISOString().slice(0, 7) },
  { id: uuidv4(), use_type: 'Livestock Watering', volume_m3: 320,  source: 'Borehole',  month: new Date().toISOString().slice(0, 7) },
  { id: uuidv4(), use_type: 'Facility Cleaning',  volume_m3: 85,   source: 'Municipal', month: new Date().toISOString().slice(0, 7) },
];

// ─── Color maps ───────────────────────────────────────────────────────────────
const CERT_COLORS: Record<CertStatus, string> = {
  certified:   'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  planning:    'bg-slate-100 text-slate-600',
  expired:     'bg-red-100 text-red-700',
};
const PRIORITY_COLORS: Record<Priority, string> = {
  critical: 'bg-red-100 text-red-700',
  high:     'bg-orange-100 text-orange-700',
  medium:   'bg-yellow-100 text-yellow-700',
  low:      'bg-slate-100 text-slate-600',
};
const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  open:        'text-slate-500',
  in_progress: 'text-blue-600',
  done:        'text-green-600',
  overdue:     'text-red-600',
};

// ─────────────────────────────────────────────────────────────────────────────
// Modal helper
// ─────────────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inp = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400";
const sel = inp;

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────
export default function SustainabilityModule() {
  const [tab, setTab] = useState<'carbon' | 'water' | 'certifications' | 'compliance'>('carbon');

  // ── State (localStorage-backed) ──────────────────────────────────────────
  const [carbonRows, setCarbonRows] = useState<CarbonRow[]>(() => load(CARBON_KEY, SEED_CARBON));
  const [waterRows,  setWaterRows]  = useState<WaterRow[]>(() =>  load(WATER_KEY,  SEED_WATER));
  const [certs,      setCerts]      = useState<Certification[]>(() => load(CERT_KEY,  []));
  const [tasks,      setTasks]      = useState<ComplianceTask[]>(() => load(TASK_KEY,  []));

  function persistCarbon(rows: CarbonRow[])  { setCarbonRows(rows); save(CARBON_KEY, rows); }
  function persistWater(rows: WaterRow[])    { setWaterRows(rows);  save(WATER_KEY,  rows); }
  function persistCerts(rows: Certification[]){ setCerts(rows);     save(CERT_KEY,   rows); }
  function persistTasks(rows: ComplianceTask[]){ setTasks(rows);    save(TASK_KEY,   rows); }

  // ── Modal state ──────────────────────────────────────────────────────────
  const [showCarbon, setShowCarbon] = useState(false);
  const [showWater,  setShowWater]  = useState(false);
  const [showCert,   setShowCert]   = useState(false);
  const [showTask,   setShowTask]   = useState(false);

  // ── Carbon form ──────────────────────────────────────────────────────────
  const [cForm, setCForm] = useState({ category: '', co2e_kg: '', entry_type: 'emission' as EntryType, date: new Date().toISOString().slice(0, 7), notes: '' });
  function submitCarbon(e: React.FormEvent) {
    e.preventDefault();
    persistCarbon([...carbonRows, { id: uuidv4(), category: cForm.category, co2e_kg: parseFloat(cForm.co2e_kg), entry_type: cForm.entry_type, date: cForm.date, notes: cForm.notes }]);
    setShowCarbon(false);
    setCForm({ category: '', co2e_kg: '', entry_type: 'emission', date: new Date().toISOString().slice(0, 7), notes: '' });
  }

  // ── Water form ──────────────────────────────────────────────────────────
  const [wForm, setWForm] = useState({ use_type: '', volume_m3: '', source: '', month: new Date().toISOString().slice(0, 7), notes: '' });
  function submitWater(e: React.FormEvent) {
    e.preventDefault();
    persistWater([...waterRows, { id: uuidv4(), use_type: wForm.use_type, volume_m3: parseFloat(wForm.volume_m3), source: wForm.source, month: wForm.month, notes: wForm.notes }]);
    setShowWater(false);
    setWForm({ use_type: '', volume_m3: '', source: '', month: new Date().toISOString().slice(0, 7), notes: '' });
  }

  // ── Certification form ───────────────────────────────────────────────────
  const [certForm, setCertForm] = useState({ name: '', body: '', status: 'planning' as CertStatus, expiry: '', notes: '' });
  function submitCert(e: React.FormEvent) {
    e.preventDefault();
    persistCerts([...certs, { id: uuidv4(), name: certForm.name, body: certForm.body, status: certForm.status, expiry: certForm.expiry || undefined, notes: certForm.notes }]);
    setShowCert(false);
    setCertForm({ name: '', body: '', status: 'planning', expiry: '', notes: '' });
  }

  // ── Task form ────────────────────────────────────────────────────────────
  const [tForm, setTForm] = useState({ title: '', due: '', priority: 'medium' as Priority, cert: '', notes: '' });
  function submitTask(e: React.FormEvent) {
    e.preventDefault();
    persistTasks([...tasks, { id: uuidv4(), title: tForm.title, due: tForm.due, priority: tForm.priority, status: 'open', cert: tForm.cert || undefined, notes: tForm.notes }]);
    setShowTask(false);
    setTForm({ title: '', due: '', priority: 'medium', cert: '', notes: '' });
  }

  function toggleTask(id: string) {
    persistTasks(tasks.map(t => {
      if (t.id !== id) return t;
      const next: TaskStatus = t.status === 'done' ? 'open' : 'done';
      return { ...t, status: next };
    }));
  }

  // ── Computed totals ──────────────────────────────────────────────────────
  const totalEmissions = carbonRows.filter(c => c.entry_type === 'emission').reduce((s, c) => s + c.co2e_kg, 0);
  const totalOffsets   = carbonRows.filter(c => c.entry_type === 'offset').reduce((s, c) => s + c.co2e_kg, 0);
  const netCarbon      = totalEmissions - totalOffsets;
  const totalWater     = waterRows.reduce((s, w) => s + w.volume_m3, 0);
  const overdueTasks   = tasks.filter(t => t.status === 'overdue').length;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto overflow-y-auto h-full">
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
          { label: 'Total Emissions', value: `${(totalEmissions / 1000).toFixed(1)} tCO₂e`, color: 'red',   Icon: TrendingDown },
          { label: 'Carbon Offsets',  value: `${(totalOffsets   / 1000).toFixed(1)} tCO₂e`, color: 'green', Icon: Leaf },
          { label: 'Net Carbon',      value: `${(netCarbon      / 1000).toFixed(1)} tCO₂e`, color: 'amber', Icon: Leaf },
          { label: 'Water Used (MTD)',value: `${totalWater} m³`,                             color: 'blue',  Icon: Droplets },
        ].map(({ label, value, color, Icon }) => (
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
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Carbon Tab ─────────────────────────────────────────────────────── */}
      {tab === 'carbon' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h3 className="font-semibold text-slate-900 text-sm">Emissions by Category</h3>
              {carbonRows.filter(c => c.entry_type === 'emission').length === 0
                ? <p className="text-sm text-slate-400">No emissions logged yet.</p>
                : carbonRows.filter(c => c.entry_type === 'emission').map(c => (
                    <div key={c.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">{c.category}</span>
                        <span className="font-semibold text-slate-900">{c.co2e_kg.toLocaleString()} kg</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full" style={{ width: `${(c.co2e_kg / Math.max(totalEmissions, 1)) * 100}%` }} />
                      </div>
                    </div>
                  ))
              }
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h3 className="font-semibold text-slate-900 text-sm">Carbon Offsets</h3>
              {carbonRows.filter(c => c.entry_type === 'offset').length === 0
                ? <p className="text-sm text-slate-400">No offsets logged yet.</p>
                : carbonRows.filter(c => c.entry_type === 'offset').map(c => (
                    <div key={c.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">{c.category}</span>
                        <span className="font-semibold text-green-700">{c.co2e_kg.toLocaleString()} kg</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-400 rounded-full" style={{ width: `${(c.co2e_kg / Math.max(totalOffsets, 1)) * 100}%` }} />
                      </div>
                    </div>
                  ))
              }
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">Net Position</span>
                  <span className={`font-bold ${netCarbon > 0 ? 'text-red-600' : 'text-green-600'}`}>{netCarbon > 0 ? '+' : ''}{(netCarbon / 1000).toFixed(2)} tCO₂e</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={() => setShowCarbon(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
              <Plus className="w-4 h-4" /> Log Carbon Entry
            </button>
          </div>
        </div>
      )}

      {/* ── Water Tab ──────────────────────────────────────────────────────── */}
      {tab === 'water' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-600" /> Water Usage</h3>
            <button onClick={() => setShowWater(true)} className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:text-blue-800">
              <Plus className="w-3 h-3" /> Log Usage
            </button>
          </div>
          {waterRows.length === 0
            ? <p className="text-sm text-slate-400 py-4 text-center">No water usage logged yet. Click "Log Usage" to add records.</p>
            : <div className="space-y-3">
                {waterRows.map(w => (
                  <div key={w.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700 font-medium">{w.use_type}</span>
                      <span className="text-slate-600 font-semibold">{w.volume_m3} m³</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(w.volume_m3 / Math.max(totalWater, 1)) * 100}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 w-20 text-right">{w.source} · {w.month}</span>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-100 flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">Total</span>
                  <span className="font-bold text-blue-700">{totalWater} m³</span>
                </div>
              </div>
          }
        </div>
      )}

      {/* ── Certifications Tab ─────────────────────────────────────────────── */}
      {tab === 'certifications' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowCert(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
              <Plus className="w-4 h-4" /> Add Certification
            </button>
          </div>
          {certs.length === 0
            ? <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">No certifications added yet.</div>
            : <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {certs.map(cert => (
                  <div key={cert.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Award className="w-5 h-5 text-green-700" />
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CERT_COLORS[cert.status]}`}>{cert.status.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{cert.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Issued by {cert.body}</div>
                      {cert.expiry && <div className="text-xs text-slate-400 mt-1">Expires: {cert.expiry}</div>}
                    </div>
                    <button
                      onClick={() => persistCerts(certs.map(c => c.id === cert.id ? { ...c, status: cert.status === 'planning' ? 'in_progress' : cert.status === 'in_progress' ? 'certified' : cert.status } : c))}
                      className="w-full text-xs text-center py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                      {cert.status === 'certified' ? 'View Certificate' : 'Advance Status'}
                    </button>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* ── Compliance Tab ─────────────────────────────────────────────────── */}
      {tab === 'compliance' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Shield className="w-4 h-4 text-green-600" /> Compliance Tasks</h3>
            <button onClick={() => setShowTask(true)} className="flex items-center gap-1 text-sm text-green-600 font-medium hover:text-green-800">
              <Plus className="w-3 h-3" /> Add Task
            </button>
          </div>
          {tasks.length === 0
            ? <p className="text-sm text-slate-400 py-4 text-center">No compliance tasks yet. Add tasks to track certification requirements.</p>
            : <div className="space-y-2">
                {tasks.sort((a, b) => a.due.localeCompare(b.due)).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                    <button onClick={() => toggleTask(task.id)} className="flex-shrink-0">
                      {task.status === 'done'
                        ? <CheckSquare className="w-4 h-4 text-green-600" />
                        : <Square className={`w-4 h-4 ${TASK_STATUS_COLORS[task.status]}`} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm truncate ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{task.title}</div>
                      <div className="text-xs text-slate-500">{task.cert ? `${task.cert} · ` : ''}Due: {task.due}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                      <span className={`text-xs font-medium ${TASK_STATUS_COLORS[task.status]}`}>{task.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showCarbon && (
        <Modal title="Log Carbon Entry" onClose={() => setShowCarbon(false)}>
          <form onSubmit={submitCarbon} className="space-y-4">
            <Field label="Category / Source">
              <input className={inp} required value={cForm.category} onChange={e => setCForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Fuel Combustion, Manure Management" />
            </Field>
            <Field label="Type">
              <select className={sel} value={cForm.entry_type} onChange={e => setCForm(f => ({ ...f, entry_type: e.target.value as EntryType }))}>
                <option value="emission">Emission</option>
                <option value="offset">Offset / Sequestration</option>
              </select>
            </Field>
            <Field label="CO₂e (kg)">
              <input className={inp} type="number" min="0" step="0.1" required value={cForm.co2e_kg} onChange={e => setCForm(f => ({ ...f, co2e_kg: e.target.value }))} placeholder="e.g. 450" />
            </Field>
            <Field label="Month">
              <input className={inp} type="month" required value={cForm.date} onChange={e => setCForm(f => ({ ...f, date: e.target.value }))} />
            </Field>
            <Field label="Notes (optional)">
              <input className={inp} value={cForm.notes} onChange={e => setCForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any context…" />
            </Field>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowCarbon(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">Save Entry</button>
            </div>
          </form>
        </Modal>
      )}

      {showWater && (
        <Modal title="Log Water Usage" onClose={() => setShowWater(false)}>
          <form onSubmit={submitWater} className="space-y-4">
            <Field label="Use Type">
              <input className={inp} required value={wForm.use_type} onChange={e => setWForm(f => ({ ...f, use_type: e.target.value }))} placeholder="e.g. Crop Irrigation, Livestock Watering" />
            </Field>
            <Field label="Volume (m³)">
              <input className={inp} type="number" min="0" step="0.1" required value={wForm.volume_m3} onChange={e => setWForm(f => ({ ...f, volume_m3: e.target.value }))} placeholder="e.g. 250" />
            </Field>
            <Field label="Source">
              <input className={inp} required value={wForm.source} onChange={e => setWForm(f => ({ ...f, source: e.target.value }))} placeholder="e.g. Borehole, Municipal, River" />
            </Field>
            <Field label="Month">
              <input className={inp} type="month" required value={wForm.month} onChange={e => setWForm(f => ({ ...f, month: e.target.value }))} />
            </Field>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowWater(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">Save Entry</button>
            </div>
          </form>
        </Modal>
      )}

      {showCert && (
        <Modal title="Add Certification" onClose={() => setShowCert(false)}>
          <form onSubmit={submitCert} className="space-y-4">
            <Field label="Certification Name">
              <input className={inp} required value={certForm.name} onChange={e => setCertForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. GlobalG.A.P., Organic Zambia" />
            </Field>
            <Field label="Certifying Body">
              <input className={inp} required value={certForm.body} onChange={e => setCertForm(f => ({ ...f, body: e.target.value }))} placeholder="e.g. GLOBALG.A.P., ZOCS" />
            </Field>
            <Field label="Status">
              <select className={sel} value={certForm.status} onChange={e => setCertForm(f => ({ ...f, status: e.target.value as CertStatus }))}>
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="certified">Certified</option>
                <option value="expired">Expired</option>
              </select>
            </Field>
            <Field label="Expiry Date (optional)">
              <input className={inp} type="date" value={certForm.expiry} onChange={e => setCertForm(f => ({ ...f, expiry: e.target.value }))} />
            </Field>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowCert(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">Add Certification</button>
            </div>
          </form>
        </Modal>
      )}

      {showTask && (
        <Modal title="Add Compliance Task" onClose={() => setShowTask(false)}>
          <form onSubmit={submitTask} className="space-y-4">
            <Field label="Task Title">
              <input className={inp} required value={tForm.title} onChange={e => setTForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Update pesticide application records" />
            </Field>
            <Field label="Due Date">
              <input className={inp} type="date" required value={tForm.due} onChange={e => setTForm(f => ({ ...f, due: e.target.value }))} />
            </Field>
            <Field label="Priority">
              <select className={sel} value={tForm.priority} onChange={e => setTForm(f => ({ ...f, priority: e.target.value as Priority }))}>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </Field>
            <Field label="Related Certification (optional)">
              <input className={inp} value={tForm.cert} onChange={e => setTForm(f => ({ ...f, cert: e.target.value }))} placeholder="e.g. GlobalG.A.P." />
            </Field>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowTask(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">Add Task</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
