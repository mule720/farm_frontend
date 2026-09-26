// Vet practice: appointments (inbound + walk-in), clinical outcome & prescription, patients, prescriptions register.
import React, { useMemo, useState } from 'react';
import { gqlRequest } from '@/lib/api';
import { APPTS_Q, PATIENTS_Q, CREATE_APPT, UPDATE_APPT, STAFF_Q, lc, num, parseJson } from '@/graphql/vendorQueries';
import { Card, Modal, Table, F, Pill, inp, btnP, btnS, fmt, money, title, today, useList, useVendor, ClientPicker, clientVars, clientLabel, InvoiceForm, OverviewTab } from './VendorCommon';
import { StatCard } from './VendorWidgets';

const TYPES = [['consultation', 'General consultation'], ['vaccination', 'Vaccination'], ['treatment', 'Treatment / procedure'], ['diagnosis', 'Diagnosis / lab'], ['deworming', 'Deworming'], ['pregnancy', 'Pregnancy check'], ['slaughter_cert', 'Pre-slaughter certification'], ['teleconsult', 'Teleconsultation'], ['other', 'Other']];
const SPECIES = ['Cattle', 'Goats', 'Sheep', 'Pigs', 'Broilers', 'Layers', 'Village chickens', 'Tilapia', 'Dogs', 'Other'];
const speciesIcon = (s: string) => /cattle|dairy/i.test(s) ? '🐄' : /goat/i.test(s) ? '🐐' : /sheep/i.test(s) ? '🐑' : /pig/i.test(s) ? '🐷' : /chick|broiler|layer|poultry/i.test(s) ? '🐔' : /tilapia|fish/i.test(s) ? '🐟' : '🐾';

export function VetOverview() {
  const { summary } = useVendor();
  const { items } = useList(APPTS_Q, 'providerVetAppointments', { upcoming: true });
  return (
    <OverviewTab icon="🩺" heading="Veterinary practice" stats={[
      { icon: '📅', label: 'Upcoming appointments', value: summary?.upcomingAppointments ?? 0, sub: `${items.filter((a: any) => a.apptDate === summary?.today).length} today` },
      { icon: '🔔', label: 'Follow-ups due (7 d)', value: summary?.followUpsDue ?? 0, accent: 'text-amber-400' },
      { icon: '👥', label: 'Clients', value: summary?.clients ?? 0, accent: 'text-blue-400' },
      { icon: '💰', label: 'Received (30 d)', value: money(summary?.revenue30d), sub: `${summary?.unpaidInvoices ?? 0} unpaid invoices`, accent: 'text-green-400' },
    ]} quick={[{ icon: '📅', label: 'New appointment', tab: 'appointments' }, { icon: '🐄', label: 'Patient records', tab: 'patients' }, { icon: '💊', label: 'Prescriptions', tab: 'prescriptions' }, { icon: '🧾', label: 'Invoices', tab: 'invoices' }]}>
      <Card title="Next appointments">
        <Table head={['Date', 'Client', 'Type', 'Animals', 'Officer', 'Status']} empty="Nothing scheduled. Farmers book you from the marketplace; walk-ins go in under Appointments."
          rows={items.slice(0, 8).map((a: any) => [<span className="text-teal-400">{a.apptDate}{a.apptTime && ` ${String(a.apptTime).slice(0, 5)}`}</span>, clientLabel(a), TYPES.find(t => t[0] === lc(a.apptType))?.[1], `${speciesIcon(a.species)} ${a.species || '—'}${a.animalCount ? ` × ${a.animalCount}` : ''}`, a.vetOfficer?.name ?? '—', <Pill v={a.status} />])} />
      </Card>
    </OverviewTab>
  );
}

export function AppointmentsTab() {
  const { toast, reload: reloadHome } = useVendor();
  const [filter, setFilter] = useState('');
  const { items, reload } = useList(APPTS_Q, 'providerVetAppointments', filter ? { status: filter } : {});
  const { items: staff } = useList(STAFF_Q, 'myStaff');
  const [creating, setCreating] = useState(false);
  const [outcome, setOutcome] = useState<any>(null);
  const [invoiceFor, setInvoiceFor] = useState<any>(null);
  async function quick(a: any, status: string) { try { await gqlRequest(UPDATE_APPT, { id: a.id, in: { status } }); toast(`${a.apptRef} ${title(status)}.`); reload(); reloadHome(); } catch (e: any) { toast(e.message, false); } }
  return (
    <div className="space-y-4">
      <Card title="Appointments" action={<div className="flex gap-2 items-center"><select value={filter} onChange={e => setFilter(e.target.value)} className={`${inp} w-40`}><option value="">All statuses</option>{['requested', 'confirmed', 'in_progress', 'completed', 'no_show', 'cancelled'].map(s => <option key={s} value={s}>{title(s)}</option>)}</select><button onClick={() => setCreating(true)} className={btnP}>+ Appointment</button></div>}>
        <Table head={['Ref / date', 'Client', 'Type & animals', 'Reason', 'Officer', 'Fee', 'Status', '']} empty="No appointments yet."
          rows={items.map((a: any) => [<div><div className="text-teal-400 font-medium">{a.apptDate}{a.apptTime && ` · ${String(a.apptTime).slice(0, 5)}`}</div><div className="text-xs text-slate-500">{a.apptRef}{a.organization ? ' · via marketplace' : ' · walk-in'}</div></div>,
            <div><div className="font-medium text-white">{clientLabel(a)}</div><div className="text-xs text-slate-500">{a.clientPhone || a.organization?.district || ''}</div></div>,
            <div>{TYPES.find(t => t[0] === lc(a.apptType))?.[1]}<div className="text-xs text-slate-400">{speciesIcon(a.species)} {a.species || '—'}{a.animalCount ? ` × ${a.animalCount}` : ''}</div></div>,
            <div className="max-w-[200px] text-xs text-slate-300">{a.symptoms || '—'}{a.diagnosis && <div className="text-teal-300 mt-0.5">Dx: {a.diagnosis}</div>}</div>, a.vetOfficer?.name ?? '—',
            <span className="tabular-nums">{a.totalAmount != null ? money(a.totalAmount, a.currency) : a.consultationFee != null ? money(a.consultationFee, a.currency) : '—'}{a.paid && <span className="text-green-400 text-xs"> paid</span>}</span>, <Pill v={a.status} />,
            <div className="flex flex-col gap-1 text-xs">
              {lc(a.status) === 'requested' && <button onClick={() => quick(a, 'confirmed')} className="text-sky-400 text-left">Confirm</button>}
              {['requested', 'confirmed'].includes(lc(a.status)) && <button onClick={() => quick(a, 'in_progress')} className="text-amber-400 text-left">Start</button>}
              {!['cancelled', 'no_show'].includes(lc(a.status)) && <button onClick={() => setOutcome(a)} className="text-teal-400 text-left">{lc(a.status) === 'completed' ? 'Edit record' : 'Record outcome'}</button>}
              {lc(a.status) === 'completed' && !a.paid && <button onClick={() => setInvoiceFor(a)} className="text-slate-300 text-left">Invoice</button>}
              {['requested', 'confirmed'].includes(lc(a.status)) && <button onClick={() => quick(a, 'cancelled')} className="text-red-400 text-left">Cancel</button>}
            </div>])} />
      </Card>
      {creating && <NewAppointment staff={staff} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); reload(); reloadHome(); }} />}
      {outcome && <OutcomeForm appt={outcome} staff={staff} onClose={() => setOutcome(null)} onSaved={() => { setOutcome(null); reload(); reloadHome(); }} />}
      {invoiceFor && <InvoiceForm existing={null} link={{ type: 'vet', id: invoiceFor.id, label: invoiceFor.apptRef }} onClose={() => setInvoiceFor(null)} onSaved={() => { setInvoiceFor(null); reload(); reloadHome(); }} />}
    </div>
  );
}

function NewAppointment({ staff, onClose, onSaved }: { staff: any[]; onClose: () => void; onSaved: () => void }) {
  const { toast } = useVendor();
  const [client, setClient] = useState({ clientOrgId: null as string | null, clientName: '', clientPhone: '' });
  const [f, setF] = useState({ apptType: 'consultation', apptDate: today(), apptTime: '09:00', vetOfficerId: '', species: 'Cattle', animalCount: '', symptoms: '', consultationFee: '', status: 'confirmed' });
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<any>) => setF({ ...f, [k]: e.target.value });
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try { await gqlRequest(CREATE_APPT, { in: { ...clientVars(client), apptType: f.apptType, apptDate: f.apptDate, apptTime: f.apptTime || null, vetOfficerId: f.vetOfficerId || null, species: f.species, animalCount: f.animalCount ? Number(f.animalCount) : 0, symptoms: f.symptoms, consultationFee: f.consultationFee ? Number(f.consultationFee) : null, status: f.status } }); toast('Appointment booked.'); onSaved(); } catch (err: any) { toast(err.message, false); } finally { setBusy(false); }
  }
  return (
    <Modal title="New appointment" onClose={onClose} wide>
      <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
        <ClientPicker value={client} onChange={setClient} />
        <F label="Type"><select value={f.apptType} onChange={set('apptType')} className={inp}>{TYPES.map(t => <option key={t[0]} value={t[0]}>{t[1]}</option>)}</select></F>
        <F label="Vet officer"><select value={f.vetOfficerId} onChange={set('vetOfficerId')} className={inp}><option value="">Unassigned</option>{staff.filter((s: any) => s.active).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></F>
        <F label="Date *"><input type="date" value={f.apptDate} onChange={set('apptDate')} className={inp} required /></F>
        <F label="Time"><input type="time" value={f.apptTime} onChange={set('apptTime')} className={inp} /></F>
        <F label="Species"><select value={f.species} onChange={set('species')} className={inp}>{SPECIES.map(s => <option key={s}>{s}</option>)}</select></F>
        <F label="Number of animals"><input type="number" min="0" value={f.animalCount} onChange={set('animalCount')} className={inp} /></F>
        <F label="Reason / symptoms" span={2}><input value={f.symptoms} onChange={set('symptoms')} className={inp} /></F>
        <F label="Consultation fee (ZMW)"><input type="number" step="any" value={f.consultationFee} onChange={set('consultationFee')} className={inp} /></F>
        <F label="Status"><select value={f.status} onChange={set('status')} className={inp}>{['requested', 'confirmed', 'in_progress'].map(s => <option key={s} value={s}>{title(s)}</option>)}</select></F>
        <div className="md:col-span-2 flex justify-end gap-2"><button type="button" onClick={onClose} className={btnS}>Cancel</button><button type="submit" disabled={busy} className={btnP}>{busy ? 'Saving…' : 'Book'}</button></div>
      </form>
    </Modal>
  );
}

function OutcomeForm({ appt, staff, onClose, onSaved }: { appt: any; staff: any[]; onClose: () => void; onSaved: () => void }) {
  const { toast } = useVendor();
  const meds0 = parseJson(appt.medications) ?? [];
  const [f, setF] = useState({ status: lc(appt.status) === 'completed' ? 'completed' : 'completed', vetOfficerId: appt.vetOfficer?.id ?? '', diagnosis: appt.diagnosis ?? '', treatmentGiven: appt.treatmentGiven ?? '', followUpDate: appt.followUpDate ?? '', outcomeNotes: appt.outcomeNotes ?? '', totalAmount: appt.totalAmount != null ? String(num(appt.totalAmount)) : appt.consultationFee != null ? String(num(appt.consultationFee)) : '', paid: !!appt.paid, animalCount: String(appt.animalCount ?? ''), species: appt.species ?? '' });
  const [meds, setMeds] = useState<any[]>(meds0.length ? meds0 : []);
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<any>) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const setMed = (i: number, k: string, v: any) => setMeds(m => m.map((x, j) => j === i ? { ...x, [k]: v } : x));
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      await gqlRequest(UPDATE_APPT, { id: appt.id, in: { status: f.status, vetOfficerId: f.vetOfficerId || null, diagnosis: f.diagnosis, treatmentGiven: f.treatmentGiven, followUpDate: f.followUpDate || null, outcomeNotes: f.outcomeNotes, totalAmount: f.totalAmount === '' ? null : Number(f.totalAmount), paid: f.paid, species: f.species, animalCount: f.animalCount ? Number(f.animalCount) : null,
        medications: meds.filter(m => m.name?.trim()).map(m => ({ name: m.name, dose: m.dose || '', route: m.route || '', days: m.days ? Number(m.days) : null, withdrawalDays: m.withdrawal_days != null && m.withdrawal_days !== '' ? Number(m.withdrawal_days) : null, notes: m.notes || '' })) } });
      toast('Clinical record saved.'); onSaved();
    } catch (err: any) { toast(err.message, false); } finally { setBusy(false); }
  }
  return (
    <Modal title={`${appt.apptRef} — ${clientLabel(appt)} · ${speciesIcon(appt.species)} ${appt.species || ''}`} onClose={onClose} wide>
      <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
        <F label="Status"><select value={f.status} onChange={set('status')} className={inp}>{['confirmed', 'in_progress', 'completed', 'no_show', 'cancelled'].map(s => <option key={s} value={s}>{title(s)}</option>)}</select></F>
        <F label="Vet officer"><select value={f.vetOfficerId} onChange={set('vetOfficerId')} className={inp}><option value="">Unassigned</option>{staff.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></F>
        <F label="Species"><input value={f.species} onChange={set('species')} className={inp} /></F>
        <F label="Animals seen"><input type="number" value={f.animalCount} onChange={set('animalCount')} className={inp} /></F>
        <F label="Diagnosis" span={2}><input value={f.diagnosis} onChange={set('diagnosis')} className={inp} placeholder="e.g. Newcastle disease (suspected), Mastitis (subclinical)" /></F>
        <F label="Treatment given" span={2}><textarea value={f.treatmentGiven} onChange={set('treatmentGiven')} rows={2} className={inp} /></F>
        <div className="md:col-span-2">
          <div className="text-xs text-slate-400 mb-1">Prescription / medications</div>
          <div className="grid grid-cols-[1.4fr_0.7fr_0.6fr_0.5fr_0.6fr_24px] gap-1 text-[10px] text-slate-500 mb-1"><span>Drug / vaccine</span><span>Dose</span><span>Route</span><span>Days</span><span>Withdrawal (d)</span><span /></div>
          {meds.map((m, i) => <div key={i} className="grid grid-cols-[1.4fr_0.7fr_0.6fr_0.5fr_0.6fr_24px] gap-1 mb-1"><input value={m.name ?? ''} onChange={e => setMed(i, 'name', e.target.value)} className={inp} placeholder="Oxytetracycline 20%" /><input value={m.dose ?? ''} onChange={e => setMed(i, 'dose', e.target.value)} className={inp} placeholder="1 ml/10 kg" /><select value={m.route ?? ''} onChange={e => setMed(i, 'route', e.target.value)} className={inp}><option value="">—</option>{['IM', 'SC', 'IV', 'Oral', 'Topical', 'In water', 'In feed'].map(r => <option key={r}>{r}</option>)}</select><input type="number" value={m.days ?? ''} onChange={e => setMed(i, 'days', e.target.value)} className={inp} /><input type="number" value={m.withdrawal_days ?? ''} onChange={e => setMed(i, 'withdrawal_days', e.target.value)} className={inp} /><button type="button" onClick={() => setMeds(x => x.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400">×</button></div>)}
          <button type="button" onClick={() => setMeds(x => [...x, { name: '', dose: '', route: '', days: '', withdrawal_days: '' }])} className="text-xs text-teal-400">+ Add medication</button>
        </div>
        <F label="Follow-up / next vaccination date"><input type="date" value={f.followUpDate} onChange={set('followUpDate')} className={inp} /></F>
        <F label="Total charge (ZMW)"><input type="number" step="any" value={f.totalAmount} onChange={set('totalAmount')} className={inp} /></F>
        <F label="Notes" span={2}><textarea value={f.outcomeNotes} onChange={set('outcomeNotes')} rows={2} className={inp} placeholder="Advice to farmer, biosecurity, withdrawal reminders…" /></F>
        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={f.paid} onChange={set('paid')} /> Paid in full</label>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={btnS}>Cancel</button><button type="submit" disabled={busy} className={btnP}>{busy ? 'Saving…' : 'Save record'}</button></div>
      </form>
    </Modal>
  );
}

export function PatientsTab() {
  const { items, loading } = useList(PATIENTS_Q, 'vetPatients');
  const [q, setQ] = useState('');
  const shown = useMemo(() => items.filter((p: any) => !q || `${p.clientName} ${p.species} ${p.conditions.join(' ')}`.toLowerCase().includes(q.toLowerCase())), [items, q]);
  const animals = items.reduce((a: number, p: any) => a + (p.animalCount || 0), 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🐄" label="Herds / flocks on record" value={items.length} />
        <StatCard icon="🔢" label="Animals under care" value={fmt(animals)} accentColor="text-blue-400" />
        <StatCard icon="🔔" label="Follow-ups scheduled" value={items.filter((p: any) => p.nextFollowUp).length} accentColor="text-amber-400" />
        <StatCard icon="💰" label="Outstanding fees" value={money(items.reduce((a: number, p: any) => a + num(p.outstanding), 0))} accentColor="text-red-400" />
      </div>
      <Card title="Patient records" action={<input value={q} onChange={e => setQ(e.target.value)} placeholder="Search client, species, condition" className={`${inp} w-64`} />}>
        {loading ? <p className="text-sm text-slate-500">Loading…</p> : !shown.length ? <p className="text-sm text-slate-500 text-center py-8">Patient records build up automatically from appointments: one card per client and species.</p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shown.map((p: any) => (
              <div key={p.key} className="bg-slate-800/60 rounded-xl border border-slate-800 p-4">
                <div className="flex items-start justify-between mb-2"><div><div className="font-semibold text-white">{p.clientName}</div><div className="text-xs text-slate-400">{speciesIcon(p.species)} {p.species}{p.clientPhone && ` · ${p.clientPhone}`}</div></div><div className="text-right"><div className="text-lg font-bold text-teal-400">{fmt(p.animalCount)}</div><div className="text-[10px] text-slate-500">head</div></div></div>
                <div className="text-xs text-slate-400">{p.visits} visit{p.visits === 1 ? '' : 's'} · last {p.lastVisit}{p.nextFollowUp && <span className="text-amber-400"> · follow-up {p.nextFollowUp}</span>}</div>
                {p.conditions.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{p.conditions.map((c: string) => <span key={c} className="text-[11px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full">{c}</span>)}</div>}
                {p.medications.length > 0 && <div className="text-[11px] text-slate-500 mt-2">💊 {p.medications.join(', ')}</div>}
                {num(p.outstanding) > 0 && <div className="text-[11px] text-red-400 mt-1">Owes {money(p.outstanding)}</div>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export function PrescriptionsTab() {
  const { items } = useList(APPTS_Q, 'providerVetAppointments', { meds: true });
  const rows: React.ReactNode[][] = [];
  for (const a of items) for (const m of parseJson(a.medications) ?? []) rows.push([a.apptDate, clientLabel(a), `${speciesIcon(a.species)} ${a.species || ''}${a.animalCount ? ` × ${a.animalCount}` : ''}`, <span className="font-medium text-white">{m.name}</span>, m.dose || '—', m.route || '—', m.days ?? '—', m.withdrawal_days != null && m.withdrawal_days !== '' ? `${m.withdrawal_days} d` : '—', a.vetOfficer?.name ?? '—']);
  return (
    <Card title={`Prescription register (${rows.length})`}>
      <p className="text-xs text-slate-500 mb-3">Every medication recorded on an appointment outcome, with dose, route, course and withdrawal period — the register a VRAZ inspection asks for.</p>
      <Table head={['Date', 'Client', 'Animals', 'Drug / vaccine', 'Dose', 'Route', 'Days', 'Withdrawal', 'Prescribed by']} empty="No prescriptions yet. Add medications when you record an appointment outcome." rows={rows} />
    </Card>
  );
}
