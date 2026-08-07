import React, { useState } from 'react';
import { Tag, Heart, Scale, Thermometer, Plus, AlertTriangle, Baby } from 'lucide-react';

interface Animal {
  id: string;
  tag_number: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  current_weight_kg: number;
  target_weight_kg: number;
  is_pregnant: boolean;
  status: string;
  current_pen: string;
  date_of_birth: string;
  last_health_event: string;
  health_status: 'good' | 'watch' | 'sick';
}

const MOCK_ANIMALS: Animal[] = [
  { id: '1', tag_number: 'C-001', name: 'Daisy', species: 'cattle', breed: 'Brahman Cross', sex: 'female', current_weight_kg: 320, target_weight_kg: 450, is_pregnant: true, status: 'active', current_pen: 'Pen A', date_of_birth: '2022-03-15', last_health_event: 'Checkup — 2026-05-20', health_status: 'good' },
  { id: '2', tag_number: 'C-002', name: 'Max', species: 'cattle', breed: 'Brahman', sex: 'castrated', current_weight_kg: 390, target_weight_kg: 450, is_pregnant: false, status: 'active', current_pen: 'Pen A', date_of_birth: '2021-11-08', last_health_event: 'Deworming — 2026-04-10', health_status: 'good' },
  { id: '3', tag_number: 'G-014', name: '', species: 'goat', breed: 'Boer', sex: 'female', current_weight_kg: 42, target_weight_kg: 55, is_pregnant: false, status: 'active', current_pen: 'Pen B', date_of_birth: '2023-06-20', last_health_event: 'Treatment — 2026-05-30', health_status: 'watch' },
  { id: '4', tag_number: 'P-007', name: '', species: 'pig', breed: 'Large White', sex: 'female', current_weight_kg: 95, target_weight_kg: 120, is_pregnant: true, status: 'active', current_pen: 'Pen C', date_of_birth: '2024-02-01', last_health_event: 'Vaccination — 2026-05-01', health_status: 'good' },
  { id: '5', tag_number: 'C-003', name: 'Bella', species: 'cattle', breed: 'Nguni', sex: 'female', current_weight_kg: 180, target_weight_kg: 320, is_pregnant: false, status: 'active', current_pen: 'Pen A', date_of_birth: '2024-09-10', last_health_event: 'Sick — 2026-06-01', health_status: 'sick' },
];

const SPECIES_COLORS: Record<string, string> = {
  cattle: 'bg-amber-100 text-amber-800',
  goat: 'bg-green-100 text-green-800',
  pig: 'bg-pink-100 text-pink-800',
  sheep: 'bg-blue-100 text-blue-800',
  chicken: 'bg-orange-100 text-orange-800',
};

const HEALTH_COLORS: Record<string, string> = {
  good: 'text-green-600',
  watch: 'text-orange-600',
  sick: 'text-red-600',
};

function WeightProgress({ animal }: { animal: Animal }) {
  const pct = Math.min(100, (animal.current_weight_kg / animal.target_weight_kg) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>Weight</span>
        <span className="font-semibold text-slate-700">{animal.current_weight_kg} kg / {animal.target_weight_kg} kg</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function AnimalCard({ animal }: { animal: Animal }) {
  return (
    <div className={`bg-white rounded-xl border p-4 space-y-3 ${animal.health_status === 'sick' ? 'border-red-200' : animal.health_status === 'watch' ? 'border-orange-200' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
            <Tag className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-sm">{animal.tag_number}{animal.name ? ` — ${animal.name}` : ''}</div>
            <div className="text-xs text-slate-500">{animal.breed} · {animal.sex} · {animal.current_pen}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SPECIES_COLORS[animal.species] || 'bg-slate-100 text-slate-600'}`}>{animal.species}</span>
          {animal.is_pregnant && <span className="flex items-center gap-0.5 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium"><Baby className="w-3 h-3" /> Pregnant</span>}
        </div>
      </div>

      <WeightProgress animal={animal} />

      <div className="flex items-center gap-1.5">
        <Heart className={`w-3.5 h-3.5 ${HEALTH_COLORS[animal.health_status]}`} />
        <span className={`text-xs font-medium ${HEALTH_COLORS[animal.health_status]}`}>
          {animal.health_status === 'good' ? 'Healthy' : animal.health_status === 'watch' ? 'Monitor' : 'Needs attention'}
        </span>
        <span className="text-xs text-slate-400 ml-auto">{animal.last_health_event}</span>
      </div>
    </div>
  );
}

function AddAnimalForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ tag_number: '', species: 'cattle', breed: '', sex: 'female', current_pen: '', current_weight_kg: '', target_weight_kg: '', date_of_birth: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <h3 className="font-semibold text-slate-900">Register Animal</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Tag / Ear Number *</label>
          <input value={form.tag_number} onChange={e => set('tag_number', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="C-101" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Species *</label>
          <select value={form.species} onChange={e => set('species', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
            {['cattle','sheep','goat','pig','chicken','duck','other'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Breed</label>
          <input value={form.breed} onChange={e => set('breed', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Brahman" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Sex</label>
          <select value={form.sex} onChange={e => set('sex', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="castrated">Castrated</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Current Weight (kg)</label>
          <input type="number" value={form.current_weight_kg} onChange={e => set('current_weight_kg', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Target Weight (kg)</label>
          <input type="number" value={form.target_weight_kg} onChange={e => set('target_weight_kg', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Date of Birth</label>
          <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Current Pen</label>
          <input value={form.current_pen} onChange={e => set('current_pen', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Pen A" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
        <button className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">Register</button>
      </div>
    </div>
  );
}

function WeightLogForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Scale className="w-4 h-4" /> Log Weight</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Animal</label>
          <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
            {MOCK_ANIMALS.map(a => <option key={a.id}>{a.tag_number}{a.name ? ` — ${a.name}` : ''}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Weight (kg)</label>
          <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Weigh Date</label>
          <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
        <button className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">Save</button>
      </div>
    </div>
  );
}

export default function AnimalTrackingModule() {
  const [tab, setTab] = useState<'herd' | 'health' | 'weights' | 'breeding'>('herd');
  const [showAdd, setShowAdd] = useState(false);
  const [showWeight, setShowWeight] = useState(false);
  const [filterSpecies, setFilterSpecies] = useState('all');

  const sickAnimals = MOCK_ANIMALS.filter(a => a.health_status === 'sick');
  const pregnant = MOCK_ANIMALS.filter(a => a.is_pregnant);
  const species = ['all', ...Array.from(new Set(MOCK_ANIMALS.map(a => a.species)))];
  const filtered = filterSpecies === 'all' ? MOCK_ANIMALS : MOCK_ANIMALS.filter(a => a.species === filterSpecies);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-amber-600" /> RFID Animal Tracking
          </h1>
          <p className="text-sm text-slate-500 mt-1">Individual animal profiles, health records & weight tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowWeight(true)} className="flex items-center gap-2 px-4 py-2 border border-amber-300 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-50">
            <Scale className="w-4 h-4" /> Log Weight
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700">
            <Plus className="w-4 h-4" /> Register Animal
          </button>
        </div>
      </div>

      {sickAnimals.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-800 text-sm">Animals need attention</div>
            <div className="text-xs text-red-600 mt-0.5">{sickAnimals.map(a => `${a.tag_number}${a.name ? ` (${a.name})` : ''}`).join(', ')}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Animals', value: MOCK_ANIMALS.length, color: 'amber' },
          { label: 'Pregnant', value: pregnant.length, color: 'purple' },
          { label: 'Need Attention', value: sickAnimals.length, color: 'red' },
          { label: 'Monitoring', value: MOCK_ANIMALS.filter(a => a.health_status === 'watch').length, color: 'orange' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['herd', 'health', 'weights', 'breeding'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t}</button>
        ))}
      </div>

      {tab === 'herd' && (
        <div className="space-y-4">
          {(showAdd || showWeight) && (
            showAdd
              ? <AddAnimalForm onClose={() => setShowAdd(false)} />
              : <WeightLogForm onClose={() => setShowWeight(false)} />
          )}
          <div className="flex gap-2">
            {species.map(s => (
              <button key={s} onClick={() => setFilterSpecies(s)} className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${filterSpecies === s ? 'bg-amber-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{s}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(a => <AnimalCard key={a.id} animal={a} />)}
          </div>
        </div>
      )}

      {tab === 'health' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /> Health Records</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 text-xs text-slate-500 uppercase">
                <th className="text-left py-2 font-medium">Animal</th>
                <th className="text-left py-2 font-medium">Event</th>
                <th className="text-left py-2 font-medium">Diagnosis</th>
                <th className="text-left py-2 font-medium">Treatment</th>
                <th className="text-left py-2 font-medium">Date</th>
                <th className="text-left py-2 font-medium">Cost</th>
              </tr></thead>
              <tbody>
                {[
                  { animal: 'C-001 Daisy', event: 'checkup', diag: 'Healthy — pregnant', treat: 'Mineral supplement', date: '2026-05-20', cost: 'K150' },
                  { animal: 'G-014', event: 'treatment', diag: 'Respiratory infection', treat: 'Oxytetracycline 3 days', date: '2026-05-30', cost: 'K280' },
                  { animal: 'C-003 Bella', event: 'diagnosis', diag: 'Foot rot', treat: 'Zinc sulphate bath', date: '2026-06-01', cost: 'K190' },
                  { animal: 'P-007', event: 'vaccination', diag: 'Routine FMD vax', treat: 'FMD vaccine dose', date: '2026-05-01', cost: 'K85' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2.5 font-medium text-slate-800">{row.animal}</td>
                    <td className="py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full ${row.event === 'treatment' || row.event === 'diagnosis' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{row.event}</span></td>
                    <td className="py-2.5 text-slate-600">{row.diag}</td>
                    <td className="py-2.5 text-slate-600">{row.treat}</td>
                    <td className="py-2.5 text-slate-500 text-xs">{row.date}</td>
                    <td className="py-2.5 font-semibold text-slate-900">{row.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'weights' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Scale className="w-4 h-4" /> Weight Progress</h3>
          <div className="space-y-4">
            {MOCK_ANIMALS.filter(a => a.species === 'cattle').map(animal => (
              <div key={animal.id} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium text-slate-800 flex-shrink-0">{animal.tag_number}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Current: {animal.current_weight_kg} kg</span>
                    <span>Target: {animal.target_weight_kg} kg</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (animal.current_weight_kg / animal.target_weight_kg) * 100)}%` }} />
                  </div>
                </div>
                <div className="w-12 text-right text-xs font-semibold text-slate-700">
                  {Math.round((animal.current_weight_kg / animal.target_weight_kg) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'breeding' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Baby className="w-4 h-4 text-purple-500" /> Breeding & Reproduction</h3>
          <div className="space-y-3">
            {pregnant.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div>
                  <div className="font-medium text-sm text-slate-900">{a.tag_number}{a.name ? ` — ${a.name}` : ''}</div>
                  <div className="text-xs text-slate-500">{a.breed} · {a.current_pen}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-purple-700">Pregnant</div>
                  <div className="text-xs text-slate-500">Expected: Aug 2026</div>
                </div>
              </div>
            ))}
            {[
              { tag: 'C-002 Max', event: 'Semen collection', date: '2026-05-12', status: 'completed' },
              { tag: 'G-014', event: 'Heat detected', date: '2026-06-01', status: 'served' },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm text-slate-900">{row.tag}</div>
                  <div className="text-xs text-slate-500">{row.event} — {row.date}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${row.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{row.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
