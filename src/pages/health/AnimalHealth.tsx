// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Animal Health Records
// Vaccination, treatment, and vet visit logs per animal group / enterprise.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Plus, X, Syringe, Pill, Stethoscope, AlertTriangle, Calendar, BarChart3 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useOrg } from '@/store/orgStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VaccinationRecord {
  id: string;
  enterpriseId: string;
  vaccine: string;
  batchNumber: string;
  dateGiven: string;
  nextDueDate: string;
  headCount: number;
  givenBy: string;
  notes: string;
}

interface TreatmentRecord {
  id: string;
  enterpriseId: string;
  condition: string;
  drug: string;
  dose: string;
  route: 'oral' | 'injection' | 'topical' | 'water';
  startDate: string;
  endDate: string;
  headCount: number;
  treatedBy: string;
  withdrawalDays: number;
  notes: string;
}

interface VetVisit {
  id: string;
  enterpriseId: string;
  vetName: string;
  clinic: string;
  visitDate: string;
  purpose: string;
  findings: string;
  recommendations: string;
  followUpDate: string;
  cost: number;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const VACC_KEY  = 'agronexus_v2_health_vaccinations';
const TREAT_KEY = 'agronexus_v2_health_treatments';
const VET_KEY   = 'agronexus_v2_health_vet_visits';

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; }
}

// ─── Seed helper ──────────────────────────────────────────────────────────────

function seedData(firstEnterpriseId: string) {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

  const vaccinations: VaccinationRecord[] = [
    {
      id: uuidv4(), enterpriseId: firstEnterpriseId,
      vaccine: 'Newcastle Disease (La Sota)', batchNumber: 'ND-2024-071',
      dateGiven: fmt(addDays(today, -30)), nextDueDate: fmt(addDays(today, 60)),
      headCount: 500, givenBy: 'Dr. Mwansa', notes: 'Drinking water administration',
    },
    {
      id: uuidv4(), enterpriseId: firstEnterpriseId,
      vaccine: 'Gumboro (IBD) Classic', batchNumber: 'IBD-2024-034',
      dateGiven: fmt(addDays(today, -14)), nextDueDate: fmt(addDays(today, 21)),
      headCount: 500, givenBy: 'Farm Staff', notes: 'Day 14 booster',
    },
  ];

  const today0h = new Date(today); today0h.setHours(0,0,0,0);
  const treatments: TreatmentRecord[] = [
    {
      id: uuidv4(), enterpriseId: firstEnterpriseId,
      condition: 'E. coli (Colibacillosis)', drug: 'Enrofloxacin 10%', dose: '1 ml / litre water',
      route: 'water',
      startDate: fmt(addDays(today, -3)), endDate: fmt(addDays(today, 2)),
      headCount: 500, treatedBy: 'Dr. Mwansa', withdrawalDays: 7,
      notes: '5-day course. Monitor mortality daily.',
    },
  ];

  const vetVisits: VetVisit[] = [
    {
      id: uuidv4(), enterpriseId: firstEnterpriseId,
      vetName: 'Dr. Mwansa Bwalya', clinic: 'AgriVet Zambia',
      visitDate: fmt(addDays(today, -30)),
      purpose: 'Routine flock health check & vaccination programme review',
      findings: 'Flock in good condition. Slight respiratory challenge in pen 3.',
      recommendations: 'Improve ventilation in pen 3. Maintain vaccination schedule.',
      followUpDate: fmt(addDays(today, 30)),
      cost: 450,
    },
  ];

  localStorage.setItem(VACC_KEY,  JSON.stringify(vaccinations));
  localStorage.setItem(TREAT_KEY, JSON.stringify(treatments));
  localStorage.setItem(VET_KEY,   JSON.stringify(vetVisits));
  return { vaccinations, treatments, vetVisits };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useHealthRecords(firstEnterpriseId: string | null) {
  // Seed once if all three stores are empty
  const seeded = React.useRef(false);
  if (!seeded.current && firstEnterpriseId) {
    const hasVacc  = load<VaccinationRecord>(VACC_KEY).length  > 0;
    const hasTreat = load<TreatmentRecord>(TREAT_KEY).length   > 0;
    const hasVet   = load<VetVisit>(VET_KEY).length            > 0;
    if (!hasVacc && !hasTreat && !hasVet) seedData(firstEnterpriseId);
    seeded.current = true;
  }

  const [vaccinations, setVaccinations] = React.useState<VaccinationRecord[]>(
    () => load<VaccinationRecord>(VACC_KEY),
  );
  const [treatments, setTreatments] = React.useState<TreatmentRecord[]>(
    () => load<TreatmentRecord>(TREAT_KEY),
  );
  const [vetVisits, setVetVisits] = React.useState<VetVisit[]>(() => load<VetVisit>(VET_KEY));

  // Persist
  React.useEffect(() => { localStorage.setItem(VACC_KEY,  JSON.stringify(vaccinations)); }, [vaccinations]);
  React.useEffect(() => { localStorage.setItem(TREAT_KEY, JSON.stringify(treatments));   }, [treatments]);
  React.useEffect(() => { localStorage.setItem(VET_KEY,   JSON.stringify(vetVisits));    }, [vetVisits]);

  return {
    vaccinations, setVaccinations,
    treatments,   setTreatments,
    vetVisits,    setVetVisits,
  };
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

const ROUTE_LABELS: Record<TreatmentRecord['route'], string> = {
  oral: 'Oral', injection: 'Injection', topical: 'Topical', water: 'Water',
};

function Badge({ children, colour }: { children: React.ReactNode; colour: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colour}`}>
      {children}
    </span>
  );
}

function KPI({ label, value, sub, icon: Icon, colour }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; colour: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg ${colour}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

const input = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400';
const select = `${input} bg-white`;
const textarea = `${input} resize-none`;

// ─── Vaccination Tab ──────────────────────────────────────────────────────────

function VaccinationsTab({
  vaccinations, setVaccinations, enterprises,
}: {
  vaccinations: VaccinationRecord[];
  setVaccinations: React.Dispatch<React.SetStateAction<VaccinationRecord[]>>;
  enterprises: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const blank: Omit<VaccinationRecord, 'id'> = {
    enterpriseId: enterprises[0]?.id ?? '',
    vaccine: '', batchNumber: '', dateGiven: '', nextDueDate: '',
    headCount: 0, givenBy: '', notes: '',
  };
  const [form, setForm] = useState(blank);

  function save() {
    if (!form.vaccine || !form.dateGiven) return;
    setVaccinations(prev => [...prev, { ...form, id: uuidv4() }]);
    setForm(blank);
    setOpen(false);
  }

  const sortedVacc = [...vaccinations].sort((a, b) => b.dateGiven.localeCompare(a.dateGiven));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Vaccination
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
            <tr>
              {['Enterprise','Vaccine','Batch #','Date Given','Next Due','Head Count','Given By'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedVacc.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No vaccination records yet.</td></tr>
            )}
            {sortedVacc.map(v => {
              const ent = enterprises.find(e => e.id === v.enterpriseId);
              const overdue = v.nextDueDate && v.nextDueDate < new Date().toISOString().slice(0,10);
              return (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{ent?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{v.vaccine}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{v.batchNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{v.dateGiven}</td>
                  <td className="px-4 py-3">
                    <span className={overdue ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                      {v.nextDueDate || '—'}
                    </span>
                    {overdue && <span className="ml-1 text-xs text-red-500">Overdue</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{v.headCount}</td>
                  <td className="px-4 py-3 text-slate-500">{v.givenBy}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title="Add Vaccination Record" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <Field label="Enterprise">
              <select className={select} value={form.enterpriseId}
                onChange={e => setForm(f => ({ ...f, enterpriseId: e.target.value }))}>
                {enterprises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </Field>
            <Field label="Vaccine Name">
              <input className={input} placeholder="e.g. Newcastle La Sota" value={form.vaccine}
                onChange={e => setForm(f => ({ ...f, vaccine: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Batch Number">
                <input className={input} placeholder="Batch #" value={form.batchNumber}
                  onChange={e => setForm(f => ({ ...f, batchNumber: e.target.value }))} />
              </Field>
              <Field label="Head Count">
                <input className={input} type="number" min={0} value={form.headCount || ''}
                  onChange={e => setForm(f => ({ ...f, headCount: +e.target.value }))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date Given">
                <input className={input} type="date" value={form.dateGiven}
                  onChange={e => setForm(f => ({ ...f, dateGiven: e.target.value }))} />
              </Field>
              <Field label="Next Due Date">
                <input className={input} type="date" value={form.nextDueDate}
                  onChange={e => setForm(f => ({ ...f, nextDueDate: e.target.value }))} />
              </Field>
            </div>
            <Field label="Given By">
              <input className={input} placeholder="Vet or staff name" value={form.givenBy}
                onChange={e => setForm(f => ({ ...f, givenBy: e.target.value }))} />
            </Field>
            <Field label="Notes">
              <textarea className={textarea} rows={2} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
              <button onClick={save}
                className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium">
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Treatments Tab ───────────────────────────────────────────────────────────

function TreatmentsTab({
  treatments, setTreatments, enterprises,
}: {
  treatments: TreatmentRecord[];
  setTreatments: React.Dispatch<React.SetStateAction<TreatmentRecord[]>>;
  enterprises: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const blank: Omit<TreatmentRecord, 'id'> = {
    enterpriseId: enterprises[0]?.id ?? '',
    condition: '', drug: '', dose: '', route: 'water',
    startDate: '', endDate: '', headCount: 0, treatedBy: '', withdrawalDays: 0, notes: '',
  };
  const [form, setForm] = useState(blank);

  function save() {
    if (!form.condition || !form.startDate) return;
    setTreatments(prev => [...prev, { ...form, id: uuidv4() }]);
    setForm(blank);
    setOpen(false);
  }

  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...treatments].sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Treatment
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
            <tr>
              {['Enterprise','Condition','Drug','Route','Start','End','Withdrawal','By'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No treatment records yet.</td></tr>
            )}
            {sorted.map(t => {
              const ent = enterprises.find(e => e.id === t.enterpriseId);
              const active = t.endDate >= today;
              return (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{ent?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{t.condition}</td>
                  <td className="px-4 py-3 text-slate-600">{t.drug}<br /><span className="text-xs text-slate-400">{t.dose}</span></td>
                  <td className="px-4 py-3">
                    <Badge colour="bg-blue-100 text-blue-700">{ROUTE_LABELS[t.route]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.startDate}</td>
                  <td className="px-4 py-3 text-slate-600">{t.endDate}</td>
                  <td className="px-4 py-3">
                    {t.withdrawalDays > 0
                      ? <Badge colour="bg-amber-100 text-amber-700">{t.withdrawalDays} days</Badge>
                      : <span className="text-slate-400 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{t.treatedBy}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title="Add Treatment Record" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <Field label="Enterprise">
              <select className={select} value={form.enterpriseId}
                onChange={e => setForm(f => ({ ...f, enterpriseId: e.target.value }))}>
                {enterprises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </Field>
            <Field label="Condition / Disease">
              <input className={input} placeholder="e.g. E. coli / Colibacillosis" value={form.condition}
                onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Drug / Product">
                <input className={input} placeholder="Drug name" value={form.drug}
                  onChange={e => setForm(f => ({ ...f, drug: e.target.value }))} />
              </Field>
              <Field label="Dose">
                <input className={input} placeholder="e.g. 1 ml / L" value={form.dose}
                  onChange={e => setForm(f => ({ ...f, dose: e.target.value }))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Route">
                <select className={select} value={form.route}
                  onChange={e => setForm(f => ({ ...f, route: e.target.value as TreatmentRecord['route'] }))}>
                  {(Object.entries(ROUTE_LABELS) as [TreatmentRecord['route'], string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Head Count">
                <input className={input} type="number" min={0} value={form.headCount || ''}
                  onChange={e => setForm(f => ({ ...f, headCount: +e.target.value }))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Date">
                <input className={input} type="date" value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </Field>
              <Field label="End Date">
                <input className={input} type="date" value={form.endDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Withdrawal Period (days)">
                <input className={input} type="number" min={0} value={form.withdrawalDays || ''}
                  onChange={e => setForm(f => ({ ...f, withdrawalDays: +e.target.value }))} />
              </Field>
              <Field label="Treated By">
                <input className={input} placeholder="Vet or staff name" value={form.treatedBy}
                  onChange={e => setForm(f => ({ ...f, treatedBy: e.target.value }))} />
              </Field>
            </div>
            {form.withdrawalDays > 0 && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  <strong>Withdrawal period: {form.withdrawalDays} days.</strong> Do not slaughter or sell
                  produce from treated animals until the withdrawal period has elapsed after the end date.
                </p>
              </div>
            )}
            <Field label="Notes">
              <textarea className={textarea} rows={2} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
              <button onClick={save}
                className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium">
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Vet Visits Tab ───────────────────────────────────────────────────────────

function VetVisitsTab({
  vetVisits, setVetVisits, enterprises,
}: {
  vetVisits: VetVisit[];
  setVetVisits: React.Dispatch<React.SetStateAction<VetVisit[]>>;
  enterprises: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const blank: Omit<VetVisit, 'id'> = {
    enterpriseId: enterprises[0]?.id ?? '',
    vetName: '', clinic: '', visitDate: '', purpose: '',
    findings: '', recommendations: '', followUpDate: '', cost: 0,
  };
  const [form, setForm] = useState(blank);

  function save() {
    if (!form.vetName || !form.visitDate) return;
    setVetVisits(prev => [...prev, { ...form, id: uuidv4() }]);
    setForm(blank);
    setOpen(false);
  }

  const sorted = [...vetVisits].sort((a, b) => b.visitDate.localeCompare(a.visitDate));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Vet Visit
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
            <tr>
              {['Enterprise','Vet / Clinic','Date','Purpose','Findings','Follow-up','Cost'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No vet visit records yet.</td></tr>
            )}
            {sorted.map(v => {
              const ent = enterprises.find(e => e.id === v.enterpriseId);
              return (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{ent?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{v.vetName}<br />
                    <span className="text-xs text-slate-400">{v.clinic}</span></td>
                  <td className="px-4 py-3 text-slate-600">{v.visitDate}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate" title={v.purpose}>{v.purpose}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate" title={v.findings}>{v.findings}</td>
                  <td className="px-4 py-3 text-slate-600">{v.followUpDate || '—'}</td>
                  <td className="px-4 py-3 text-slate-700 font-medium">K {v.cost.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title="Add Vet Visit" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <Field label="Enterprise">
              <select className={select} value={form.enterpriseId}
                onChange={e => setForm(f => ({ ...f, enterpriseId: e.target.value }))}>
                {enterprises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Vet Name">
                <input className={input} placeholder="Dr. Bwalya" value={form.vetName}
                  onChange={e => setForm(f => ({ ...f, vetName: e.target.value }))} />
              </Field>
              <Field label="Clinic / Practice">
                <input className={input} placeholder="AgriVet Zambia" value={form.clinic}
                  onChange={e => setForm(f => ({ ...f, clinic: e.target.value }))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Visit Date">
                <input className={input} type="date" value={form.visitDate}
                  onChange={e => setForm(f => ({ ...f, visitDate: e.target.value }))} />
              </Field>
              <Field label="Follow-up Date">
                <input className={input} type="date" value={form.followUpDate}
                  onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))} />
              </Field>
            </div>
            <Field label="Purpose of Visit">
              <input className={input} placeholder="Routine check, disease investigation…" value={form.purpose}
                onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} />
            </Field>
            <Field label="Findings">
              <textarea className={textarea} rows={2} value={form.findings}
                onChange={e => setForm(f => ({ ...f, findings: e.target.value }))} />
            </Field>
            <Field label="Recommendations">
              <textarea className={textarea} rows={2} value={form.recommendations}
                onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))} />
            </Field>
            <Field label="Cost (ZMW)">
              <input className={input} type="number" min={0} value={form.cost || ''}
                onChange={e => setForm(f => ({ ...f, cost: +e.target.value }))} />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
              <button onClick={save}
                className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium">
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  vaccinations, treatments, vetVisits, enterprises,
}: {
  vaccinations: VaccinationRecord[];
  treatments: TreatmentRecord[];
  vetVisits: VetVisit[];
  enterprises: { id: string; name: string }[];
}) {
  const today = new Date().toISOString().slice(0, 10);

  const activeTreatments = treatments.filter(t => t.endDate >= today);

  const soonestVacc = [...vaccinations]
    .filter(v => v.nextDueDate)
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))[0];

  const upcomingVaccinations = [...vaccinations]
    .filter(v => v.nextDueDate)
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
    .slice(0, 5);

  // Active withdrawal alert: treatments where today < endDate + withdrawalDays
  const activeWithdrawals = treatments.filter(t => {
    if (t.withdrawalDays === 0) return false;
    const endPlus = new Date(t.endDate);
    endPlus.setDate(endPlus.getDate() + t.withdrawalDays);
    return today <= endPlus.toISOString().slice(0, 10);
  });

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Total Vaccinations" value={vaccinations.length}
          icon={Syringe} colour="bg-green-100 text-green-600" />
        <KPI label="Active Treatments" value={activeTreatments.length}
          icon={Pill} colour="bg-blue-100 text-blue-600" />
        <KPI label="Next Vaccination Due" value={soonestVacc?.nextDueDate ?? 'None'}
          sub={soonestVacc?.vaccine} icon={Calendar} colour="bg-amber-100 text-amber-600" />
        <KPI label="Total Vet Visits" value={vetVisits.length}
          icon={Stethoscope} colour="bg-violet-100 text-violet-600" />
      </div>

      {/* Active Withdrawal Banners */}
      {activeWithdrawals.length > 0 && (
        <div className="space-y-2">
          {activeWithdrawals.map(t => {
            const ent = enterprises.find(e => e.id === t.enterpriseId);
            const endPlus = new Date(t.endDate);
            endPlus.setDate(endPlus.getDate() + t.withdrawalDays);
            return (
              <div key={t.id}
                className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Withdrawal period active — {ent?.name ?? 'Unknown enterprise'}
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    <strong>{t.drug}</strong> used for <em>{t.condition}</em>.
                    Do not slaughter / sell produce until <strong>{endPlus.toISOString().slice(0,10)}</strong>
                    &nbsp;({t.withdrawalDays}-day withdrawal from {t.endDate}).
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upcoming Vaccinations Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">Upcoming Vaccinations</h3>
          <p className="text-xs text-slate-400 mt-0.5">Next 5 due dates, ascending</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                {['Enterprise','Vaccine','Next Due','Head Count','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {upcomingVaccinations.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No upcoming vaccinations scheduled.</td></tr>
              )}
              {upcomingVaccinations.map(v => {
                const ent = enterprises.find(e => e.id === v.enterpriseId);
                const overdue = v.nextDueDate < today;
                const daysLeft = Math.ceil(
                  (new Date(v.nextDueDate).getTime() - new Date(today).getTime()) / 86400000
                );
                return (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{ent?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{v.vaccine}</td>
                    <td className="px-4 py-3 text-slate-600">{v.nextDueDate}</td>
                    <td className="px-4 py-3 text-slate-600">{v.headCount}</td>
                    <td className="px-4 py-3">
                      {overdue
                        ? <Badge colour="bg-red-100 text-red-700">Overdue</Badge>
                        : daysLeft <= 7
                          ? <Badge colour="bg-amber-100 text-amber-700">Due in {daysLeft}d</Badge>
                          : <Badge colour="bg-green-100 text-green-700">In {daysLeft}d</Badge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'vaccinations' | 'treatments' | 'vet-visits';
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview',      label: 'Overview',     icon: BarChart3 },
  { id: 'vaccinations',  label: 'Vaccinations', icon: Syringe },
  { id: 'treatments',    label: 'Treatments',   icon: Pill },
  { id: 'vet-visits',    label: 'Vet Visits',   icon: Stethoscope },
];

export default function AnimalHealth() {
  const { org } = useOrg();
  const enterprises = org?.enterprises ?? [];
  const firstId = enterprises[0]?.id ?? null;

  const { vaccinations, setVaccinations, treatments, setTreatments, vetVisits, setVetVisits }
    = useHealthRecords(firstId);

  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-xl">
          <Syringe className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Animal Health Records</h1>
          <p className="text-sm text-slate-500">Vaccination, treatment &amp; vet visit logs</p>
        </div>
      </div>

      {enterprises.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          No enterprises configured yet. Add an enterprise in the Onboarding / Settings section to link records.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${tab === t.id ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <OverviewTab
          vaccinations={vaccinations}
          treatments={treatments}
          vetVisits={vetVisits}
          enterprises={enterprises}
        />
      )}
      {tab === 'vaccinations' && (
        <VaccinationsTab
          vaccinations={vaccinations}
          setVaccinations={setVaccinations}
          enterprises={enterprises}
        />
      )}
      {tab === 'treatments' && (
        <TreatmentsTab
          treatments={treatments}
          setTreatments={setTreatments}
          enterprises={enterprises}
        />
      )}
      {tab === 'vet-visits' && (
        <VetVisitsTab
          vetVisits={vetVisits}
          setVetVisits={setVetVisits}
          enterprises={enterprises}
        />
      )}
    </div>
  );
}
