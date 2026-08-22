// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Staff & Labour Tracking
// Daily task allocation, time logs, and cost attribution per enterprise.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import { Plus, X, Users, Clock, DollarSign, CheckCircle2, Circle, ToggleLeft, ToggleRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useOrg } from '@/store/orgStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type StaffRole = 'farmhand' | 'supervisor' | 'driver' | 'vet_officer' | 'admin' | 'other';

interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  phone: string;
  dailyRate: number;
  active: boolean;
  hiredDate: string;
}

interface TimeLog {
  id: string;
  staffId: string;
  enterpriseId: string;
  date: string;
  task: string;
  hoursWorked: number;
  notes: string;
  approved: boolean;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const STAFF_KEY   = 'agronexus_v2_hr_staff';
const TIMELOG_KEY = 'agronexus_v2_hr_timelog';

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; }
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

function seedStaff(): StaffMember[] {
  return [
    { id: uuidv4(), name: 'Alice Banda',   role: 'farmhand',   phone: '+260971000001', dailyRate: 85,  active: true, hiredDate: '2023-03-15' },
    { id: uuidv4(), name: 'Bob Mwale',     role: 'supervisor', phone: '+260971000002', dailyRate: 150, active: true, hiredDate: '2022-07-01' },
    { id: uuidv4(), name: 'Carol Phiri',   role: 'driver',     phone: '+260971000003', dailyRate: 110, active: true, hiredDate: '2024-01-10' },
  ];
}

function seedTimeLogs(staff: StaffMember[], firstEnterpriseId: string): TimeLog[] {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const daysAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };

  const alice = staff.find(s => s.name === 'Alice Banda')!;
  const bob   = staff.find(s => s.name === 'Bob Mwale')!;
  const carol = staff.find(s => s.name === 'Carol Phiri')!;

  return [
    { id: uuidv4(), staffId: alice.id, enterpriseId: firstEnterpriseId, date: daysAgo(0), task: 'Feeding & watering birds', hoursWorked: 8, notes: '', approved: false },
    { id: uuidv4(), staffId: bob.id,   enterpriseId: firstEnterpriseId, date: daysAgo(0), task: 'Pen inspection & mortality count', hoursWorked: 6, notes: 'Pen 3 ventilation issue noted', approved: true },
    { id: uuidv4(), staffId: alice.id, enterpriseId: firstEnterpriseId, date: daysAgo(1), task: 'Litter management', hoursWorked: 8, notes: '', approved: true },
    { id: uuidv4(), staffId: carol.id, enterpriseId: firstEnterpriseId, date: daysAgo(2), task: 'Feed delivery run to mill', hoursWorked: 5, notes: 'Delivered 2 MT broiler grower', approved: true },
    { id: uuidv4(), staffId: bob.id,   enterpriseId: firstEnterpriseId, date: daysAgo(3), task: 'Weighing & grading – week 4', hoursWorked: 7, notes: 'Avg weight 1.85 kg', approved: true },
  ];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useHR(firstEnterpriseId: string | null) {
  const [staff, setStaff] = React.useState<StaffMember[]>(() => {
    const stored = load<StaffMember>(STAFF_KEY);
    if (stored.length > 0) return stored;
    const seeded = seedStaff();
    localStorage.setItem(STAFF_KEY, JSON.stringify(seeded));
    return seeded;
  });

  const [timeLogs, setTimeLogs] = React.useState<TimeLog[]>(() => {
    const stored = load<TimeLog>(TIMELOG_KEY);
    if (stored.length > 0) return stored;
    const currentStaff = load<StaffMember>(STAFF_KEY);
    if (currentStaff.length === 0 || !firstEnterpriseId) return [];
    const seeded = seedTimeLogs(currentStaff, firstEnterpriseId);
    localStorage.setItem(TIMELOG_KEY, JSON.stringify(seeded));
    return seeded;
  });

  React.useEffect(() => { localStorage.setItem(STAFF_KEY,   JSON.stringify(staff));    }, [staff]);
  React.useEffect(() => { localStorage.setItem(TIMELOG_KEY, JSON.stringify(timeLogs)); }, [timeLogs]);

  function toggleApproved(id: string) {
    setTimeLogs(prev => prev.map(l => l.id === id ? { ...l, approved: !l.approved } : l));
  }
  function toggleActive(id: string) {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  }

  return { staff, setStaff, timeLogs, setTimeLogs, toggleApproved, toggleActive };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<StaffRole, string> = {
  farmhand: 'Farm Hand', supervisor: 'Supervisor', driver: 'Driver',
  vet_officer: 'Vet Officer', admin: 'Admin', other: 'Other',
};

const ROLE_COLOURS: Record<StaffRole, string> = {
  farmhand:    'bg-green-100 text-green-700',
  supervisor:  'bg-blue-100 text-blue-700',
  driver:      'bg-orange-100 text-orange-700',
  vet_officer: 'bg-purple-100 text-purple-700',
  admin:       'bg-slate-100 text-slate-700',
  other:       'bg-gray-100 text-gray-700',
};

function getWeekBounds(offset = 0): { start: string; end: string } {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((dow + 6) % 7) + offset * 7);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(mon), end: fmt(sun) };
}

function labourCost(hours: number, dailyRate: number) {
  return (hours / 8) * dailyRate;
}

// ─── Small UI atoms ───────────────────────────────────────────────────────────

function Badge({ children, colour }: { children: React.ReactNode; colour: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colour}`}>
      {children}
    </span>
  );
}

function KPI({ label, value, sub, icon: Icon, colour }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; colour: string;
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

const inp = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400';
const sel = `${inp} bg-white`;

// ─── Staff Tab ────────────────────────────────────────────────────────────────

function StaffTab({
  staff, setStaff, toggleActive,
}: {
  staff: StaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  toggleActive: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const blank: Omit<StaffMember, 'id'> = {
    name: '', role: 'farmhand', phone: '', dailyRate: 0, active: true, hiredDate: '',
  };
  const [form, setForm] = useState(blank);

  function save() {
    if (!form.name) return;
    setStaff(prev => [...prev, { ...form, id: uuidv4() }]);
    setForm(blank);
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
            <tr>
              {['Name','Role','Phone','Daily Rate','Hired','Active'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No staff yet.</td></tr>
            )}
            {staff.map(s => (
              <tr key={s.id} className={`hover:bg-slate-50 ${!s.active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                <td className="px-4 py-3">
                  <Badge colour={ROLE_COLOURS[s.role]}>{ROLE_LABELS[s.role]}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-500">{s.phone}</td>
                <td className="px-4 py-3 text-slate-700">K {s.dailyRate}/day</td>
                <td className="px-4 py-3 text-slate-500">{s.hiredDate}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(s.id)} className="text-slate-400 hover:text-violet-600 transition-colors">
                    {s.active
                      ? <ToggleRight className="w-6 h-6 text-green-500" />
                      : <ToggleLeft className="w-6 h-6 text-slate-300" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title="Add Staff Member" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <Field label="Full Name">
              <input className={inp} placeholder="Alice Banda" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Role">
                <select className={sel} value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as StaffRole }))}>
                  {(Object.entries(ROLE_LABELS) as [StaffRole, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Phone">
                <input className={inp} placeholder="+260971000001" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Daily Rate (ZMW)">
                <input className={inp} type="number" min={0} value={form.dailyRate || ''}
                  onChange={e => setForm(f => ({ ...f, dailyRate: +e.target.value }))} />
              </Field>
              <Field label="Hired Date">
                <input className={inp} type="date" value={form.hiredDate}
                  onChange={e => setForm(f => ({ ...f, hiredDate: e.target.value }))} />
              </Field>
            </div>
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

// ─── Time Log Tab ─────────────────────────────────────────────────────────────

function TimeLogTab({
  timeLogs, setTimeLogs, toggleApproved, staff, enterprises, weekOffset, setWeekOffset,
}: {
  timeLogs: TimeLog[];
  setTimeLogs: React.Dispatch<React.SetStateAction<TimeLog[]>>;
  toggleApproved: (id: string) => void;
  staff: StaffMember[];
  enterprises: { id: string; name: string }[];
  weekOffset: number;
  setWeekOffset: React.Dispatch<React.SetStateAction<number>>;
}) {
  const [open, setOpen] = useState(false);
  const blank: Omit<TimeLog, 'id'> = {
    staffId: staff[0]?.id ?? '',
    enterpriseId: enterprises[0]?.id ?? '',
    date: new Date().toISOString().slice(0, 10),
    task: '', hoursWorked: 8, notes: '', approved: false,
  };
  const [form, setForm] = useState(blank);

  const { start, end } = getWeekBounds(weekOffset);
  const weekLogs = timeLogs.filter(l => l.date >= start && l.date <= end)
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalHours = weekLogs.reduce((s, l) => s + l.hoursWorked, 0);
  const totalCost  = weekLogs.reduce((s, l) => {
    const m = staff.find(s => s.id === l.staffId);
    return s + labourCost(l.hoursWorked, m?.dailyRate ?? 0);
  }, 0);

  function save() {
    if (!form.task || !form.date) return;
    setTimeLogs(prev => [...prev, { ...form, id: uuidv4() }]);
    setForm(blank);
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      {/* Week picker */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(o => o - 1)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">&#8249; Prev</button>
          <span className="text-sm font-medium text-slate-700">{start} — {end}</span>
          <button onClick={() => setWeekOffset(o => o + 1)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Next &#8250;</button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)}
              className="px-3 py-1.5 text-xs text-violet-600 hover:underline">This week</button>
          )}
        </div>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Time Log
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
            <tr>
              {['Date','Staff','Enterprise','Task','Hours','Approved','Notes'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {weekLogs.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No time logs for this week.</td></tr>
            )}
            {weekLogs.map(l => {
              const member = staff.find(s => s.id === l.staffId);
              const ent    = enterprises.find(e => e.id === l.enterpriseId);
              return (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{l.date}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{member?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{ent?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{l.task}</td>
                  <td className="px-4 py-3 text-slate-600 text-center">{l.hoursWorked}h</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleApproved(l.id)}>
                      {l.approved
                        ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                        : <Circle className="w-5 h-5 text-slate-300" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs max-w-[140px] truncate" title={l.notes}>{l.notes || '—'}</td>
                </tr>
              );
            })}
          </tbody>
          {weekLogs.length > 0 && (
            <tfoot className="bg-slate-50 font-medium text-sm text-slate-700">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right">Totals</td>
                <td className="px-4 py-3 text-center">{totalHours}h</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-slate-800">K {totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {open && (
        <Modal title="Add Time Log" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Staff Member">
                <select className={sel} value={form.staffId}
                  onChange={e => setForm(f => ({ ...f, staffId: e.target.value }))}>
                  {staff.filter(s => s.active).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Enterprise">
                <select className={sel} value={form.enterpriseId}
                  onChange={e => setForm(f => ({ ...f, enterpriseId: e.target.value }))}>
                  {enterprises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <input className={inp} type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </Field>
              <Field label="Hours Worked">
                <input className={inp} type="number" min={0} max={24} step={0.5} value={form.hoursWorked || ''}
                  onChange={e => setForm(f => ({ ...f, hoursWorked: +e.target.value }))} />
              </Field>
            </div>
            <Field label="Task Description">
              <input className={inp} placeholder="Feeding & watering birds" value={form.task}
                onChange={e => setForm(f => ({ ...f, task: e.target.value }))} />
            </Field>
            <Field label="Notes">
              <input className={inp} placeholder="Optional notes" value={form.notes}
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

// ─── Labour Cost Tab ──────────────────────────────────────────────────────────

function LabourCostTab({
  timeLogs, staff, enterprises, weekOffset,
}: {
  timeLogs: TimeLog[];
  staff: StaffMember[];
  enterprises: { id: string; name: string }[];
  weekOffset: number;
}) {
  const { start, end } = getWeekBounds(weekOffset);
  const weekLogs = timeLogs.filter(l => l.date >= start && l.date <= end);

  // Cost per enterprise
  const entCosts = useMemo(() => {
    return enterprises.map(ent => {
      const logs = weekLogs.filter(l => l.enterpriseId === ent.id);
      const hours = logs.reduce((s, l) => s + l.hoursWorked, 0);
      const cost  = logs.reduce((s, l) => {
        const m = staff.find(s => s.id === l.staffId);
        return s + labourCost(l.hoursWorked, m?.dailyRate ?? 0);
      }, 0);
      return { ...ent, hours, cost };
    }).filter(e => e.hours > 0);
  }, [weekLogs, enterprises, staff]);

  const totalCost  = entCosts.reduce((s, e) => s + e.cost, 0);
  const totalHours = entCosts.reduce((s, e) => s + e.hours, 0);
  const avgCostPerHour = totalHours > 0 ? totalCost / totalHours : 0;

  const maxCost = Math.max(...entCosts.map(e => e.cost), 1);

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KPI label="Total Labour Cost (Week)" value={`K ${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={DollarSign} colour="bg-violet-100 text-violet-600" />
        <KPI label="Total Hours (Week)" value={`${totalHours}h`}
          icon={Clock} colour="bg-blue-100 text-blue-600" />
        <KPI label="Avg Cost / Hour" value={`K ${avgCostPerHour.toFixed(2)}`}
          icon={Users} colour="bg-green-100 text-green-600" />
      </div>

      {/* Bar Chart (CSS-only) */}
      {entCosts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 text-sm mb-4">Labour Cost by Enterprise</h3>
          <div className="space-y-3">
            {entCosts.map(e => {
              const pct = (e.cost / maxCost) * 100;
              return (
                <div key={e.id} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span className="font-medium">{e.name}</span>
                    <span>K {e.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })} &bull; {e.hours}h</span>
                  </div>
                  <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enterprise breakdown table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">Enterprise Breakdown — week of {start}</h3>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
            <tr>
              {['Enterprise','Hours','Labour Cost','% of Total'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entCosts.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No labour logged for this week.</td></tr>
            )}
            {entCosts.map(e => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{e.name}</td>
                <td className="px-4 py-3 text-slate-600">{e.hours}h</td>
                <td className="px-4 py-3 text-slate-700">K {e.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="px-4 py-3 text-slate-500">
                  {totalCost > 0 ? ((e.cost / totalCost) * 100).toFixed(1) : '0'}%
                </td>
              </tr>
            ))}
            {entCosts.length > 0 && (
              <tr className="bg-slate-50 font-semibold text-slate-800">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3">{totalHours}h</td>
                <td className="px-4 py-3">K {totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="px-4 py-3">100%</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'staff' | 'timelog' | 'cost';
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'staff',   label: 'Staff',       icon: Users },
  { id: 'timelog', label: 'Time Log',    icon: Clock },
  { id: 'cost',    label: 'Labour Cost', icon: DollarSign },
];

export default function StaffLabour() {
  const { org } = useOrg();
  const enterprises = org?.enterprises ?? [];
  const firstId = enterprises[0]?.id ?? null;

  const { staff, setStaff, timeLogs, setTimeLogs, toggleApproved, toggleActive } = useHR(firstId);
  const [tab, setTab]           = useState<Tab>('staff');
  const [weekOffset, setWeekOffset] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-xl">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Staff &amp; Labour</h1>
          <p className="text-sm text-slate-500">Daily task allocation, time logs &amp; cost attribution</p>
        </div>
      </div>

      {enterprises.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          No enterprises configured. Add an enterprise in Onboarding to link time logs.
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
      {tab === 'staff' && (
        <StaffTab staff={staff} setStaff={setStaff} toggleActive={toggleActive} />
      )}
      {tab === 'timelog' && (
        <TimeLogTab
          timeLogs={timeLogs}
          setTimeLogs={setTimeLogs}
          toggleApproved={toggleApproved}
          staff={staff}
          enterprises={enterprises}
          weekOffset={weekOffset}
          setWeekOffset={setWeekOffset}
        />
      )}
      {tab === 'cost' && (
        <LabourCostTab
          timeLogs={timeLogs}
          staff={staff}
          enterprises={enterprises}
          weekOffset={weekOffset}
        />
      )}
    </div>
  );
}
