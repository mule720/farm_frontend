// Work orders: service providers (installs, soil tests, spraying, consulting) and transporters (haulage runs).
import React, { useState } from 'react';
import { gqlRequest } from '@/lib/api';
import { JOBS_Q, UPSERT_JOB, DELETE_JOB, SERVICES_Q, STAFF_Q, EQUIPMENT_Q, lc, num } from '@/graphql/vendorQueries';
import { Card, Modal, Table, F, Pill, inp, btnP, btnS, fmt, money, title, today, useList, useVendor, ClientPicker, clientVars, clientLabel, confirmDel, InvoiceForm, OverviewTab } from './VendorCommon';
import { StatCard } from './VendorWidgets';

const KINDS = [['service', 'Service job'], ['installation', 'Installation'], ['consulting', 'Consulting / advisory'], ['transport', 'Transport / haulage'], ['delivery', 'Delivery'], ['other', 'Other']];

export function ServicesOverview() {
  const { summary } = useVendor();
  const { items } = useList(JOBS_Q, 'vendorWorkOrders');
  const open = items.filter((j: any) => ['requested', 'quoted', 'scheduled', 'in_progress'].includes(lc(j.status)));
  return (
    <OverviewTab icon="🔧" heading="AgriServices" stats={[
      { icon: '📋', label: 'Open jobs', value: summary?.openJobs ?? 0, sub: `${open.filter((j: any) => lc(j.status) === 'requested').length} new requests`, accent: 'text-amber-400' },
      { icon: '✅', label: 'Completed (all time)', value: items.filter((j: any) => lc(j.status) === 'completed').length, accent: 'text-green-400' },
      { icon: '👥', label: 'Clients', value: summary?.clients ?? 0, accent: 'text-blue-400' },
      { icon: '💰', label: 'Received (30 d)', value: money(summary?.revenue30d), accent: 'text-teal-400' },
    ]} quick={[{ icon: '📋', label: 'New job', tab: 'jobs' }, { icon: '🗂️', label: 'Services & prices', tab: 'services' }, { icon: '👥', label: 'Clients', tab: 'clients' }, { icon: '🧾', label: 'Invoices', tab: 'invoices' }]}>
      <Card title="Upcoming jobs"><Table head={['Date', 'Job', 'Client', 'Site', 'Assigned', 'Status']} empty="Nothing scheduled." rows={open.sort((a: any, b: any) => (a.scheduledDate ?? '9') < (b.scheduledDate ?? '9') ? -1 : 1).slice(0, 8).map((j: any) => [j.scheduledDate ?? 'TBC', j.title, clientLabel(j), j.location || '—', j.staffName ?? '—', <Pill v={j.status} />])} /></Card>
    </OverviewTab>
  );
}

export function JobsTab({ transport }: { transport?: boolean }) {
  const { toast, reload: reloadHome } = useVendor();
  const [filter, setFilter] = useState('');
  const { items, reload } = useList(JOBS_Q, 'vendorWorkOrders', filter ? { status: filter } : {});
  const { items: services } = useList(SERVICES_Q, 'myServices');
  const { items: staff } = useList(STAFF_Q, 'myStaff');
  const { items: fleet } = useList(EQUIPMENT_Q, 'vendorEquipment');
  const [editing, setEditing] = useState<any | null | 'new'>(null);
  const [invoiceFor, setInvoiceFor] = useState<any>(null);
  async function move(j: any, status: string) { try { await gqlRequest(UPSERT_JOB, { id: j.id, in: { title: j.title, status } }); toast(`${j.jobRef} → ${title(status)}`); reload(); reloadHome(); } catch (e: any) { toast(e.message, false); } }
  const NEXT: Record<string, string[]> = { requested: ['quoted', 'scheduled', 'cancelled'], quoted: ['scheduled', 'cancelled'], scheduled: ['in_progress', 'cancelled'], in_progress: ['completed'], completed: [], cancelled: [] };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📋" label="Jobs" value={items.length} />
        <StatCard icon="🗓️" label="Scheduled" value={items.filter((j: any) => lc(j.status) === 'scheduled').length} accentColor="text-blue-400" />
        <StatCard icon="⚙️" label="In progress" value={items.filter((j: any) => lc(j.status) === 'in_progress').length} accentColor="text-amber-400" />
        <StatCard icon="💰" label="Unpaid completed" value={money(items.filter((j: any) => lc(j.status) === 'completed' && !j.paid).reduce((a: number, j: any) => a + num(j.agreedAmount), 0))} accentColor="text-red-400" />
      </div>
      <Card title={transport ? 'Transport jobs' : 'Job schedule'} action={<div className="flex gap-2"><select value={filter} onChange={e => setFilter(e.target.value)} className={`${inp} w-40`}><option value="">All statuses</option>{['requested', 'quoted', 'scheduled', 'in_progress', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{title(s)}</option>)}</select><button onClick={() => setEditing('new')} className={btnP}>+ Job</button></div>}>
        <Table head={['Ref / date', 'Job', 'Client', transport ? 'Route' : 'Site', 'Qty', 'Assigned', 'Amount', 'Status', '']} empty="No jobs yet."
          rows={items.map((j: any) => [<div><div className="text-teal-400 font-medium">{j.scheduledDate ?? 'TBC'}{j.scheduledTime && ` ${String(j.scheduledTime).slice(0, 5)}`}</div><div className="text-xs text-slate-500">{j.jobRef} · {title(j.kind)}</div></div>, <div><div className="font-medium text-white">{j.title}</div>{j.serviceName && <div className="text-xs text-slate-500">{j.serviceName}</div>}</div>, <div>{clientLabel(j)}<div className="text-xs text-slate-500">{j.clientPhone}</div></div>,
            <div className="text-xs">{j.location || '—'}{j.destination && <div>→ {j.destination}</div>}{j.distanceKm && <div className="text-slate-500">{fmt(j.distanceKm, 1)} km</div>}</div>, j.quantity ? `${fmt(j.quantity, 2)} ${j.unit}` : '—', <div className="text-xs">{j.staffName ?? '—'}{j.equipmentName && <div className="text-slate-500">{j.equipmentName}</div>}</div>,
            <span className="tabular-nums">{j.agreedAmount != null ? money(j.agreedAmount, j.currency) : j.quotedAmount != null ? <span className="text-slate-400">quote {money(j.quotedAmount, j.currency)}</span> : '—'}{j.paid && <span className="text-green-400 text-xs"> paid</span>}</span>, <Pill v={j.status} />,
            <div className="flex flex-col gap-1 text-xs"><button onClick={() => setEditing(j)} className="text-slate-300 text-left">Edit</button>{(NEXT[lc(j.status)] ?? []).map(s => <button key={s} onClick={() => move(j, s)} className={`text-left ${s === 'cancelled' ? 'text-red-400' : 'text-teal-400'}`}>{title(s)}</button>)}{lc(j.status) === 'completed' && !j.paid && <button onClick={() => setInvoiceFor(j)} className="text-slate-300 text-left">Invoice</button>}{['requested', 'cancelled'].includes(lc(j.status)) && <button onClick={async () => { if (!confirmDel(j.jobRef)) return; try { await gqlRequest(DELETE_JOB, { id: j.id }); reload(); } catch (e: any) { toast(e.message, false); } }} className="text-red-400 text-left">Delete</button>}</div>])} />
      </Card>
      {editing && <JobForm existing={editing === 'new' ? null : editing} transport={!!transport} services={services} staff={staff} fleet={fleet} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); reloadHome(); }} />}
      {invoiceFor && <InvoiceForm existing={null} link={{ type: 'job', id: invoiceFor.id, label: invoiceFor.jobRef }} onClose={() => setInvoiceFor(null)} onSaved={() => { setInvoiceFor(null); reload(); reloadHome(); }} />}
    </div>
  );
}

function JobForm({ existing, transport, services, staff, fleet, onClose, onSaved }: { existing: any | null; transport: boolean; services: any[]; staff: any[]; fleet: any[]; onClose: () => void; onSaved: () => void }) {
  const { toast } = useVendor();
  const [client, setClient] = useState({ clientOrgId: existing?.clientOrg?.id ?? null, clientName: existing?.clientName ?? '', clientPhone: existing?.clientPhone ?? '' });
  const [f, setF] = useState({ kind: existing?.kind ?? (transport ? 'transport' : 'service'), serviceId: existing?.service?.id ?? '', title: existing?.title ?? '', description: existing?.description ?? '', location: existing?.location ?? '', destination: existing?.destination ?? '', district: existing?.district ?? '', distanceKm: existing?.distanceKm != null ? String(num(existing.distanceKm)) : '', quantity: existing?.quantity != null ? String(num(existing.quantity)) : '', unit: existing?.unit ?? (transport ? 'tonnes' : 'ha'), scheduledDate: existing?.scheduledDate ?? today(), scheduledTime: existing?.scheduledTime ? String(existing.scheduledTime).slice(0, 5) : '', assignedStaffId: existing?.assignedStaff?.id ?? '', equipmentId: existing?.equipment?.id ?? '', status: existing ? lc(existing.status) : 'scheduled', quotedAmount: existing?.quotedAmount != null ? String(num(existing.quotedAmount)) : '', agreedAmount: existing?.agreedAmount != null ? String(num(existing.agreedAmount)) : '', paid: !!existing?.paid, completionNotes: existing?.completionNotes ?? '', notes: existing?.notes ?? '' });
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<any>) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const pickService = (id: string) => { const s = services.find(x => x.id === id); setF(x => ({ ...x, serviceId: id, title: x.title || (s?.name ?? ''), quotedAmount: x.quotedAmount || (s?.price != null ? String(num(s.price)) : '') })); };
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const n = (v: string) => (v === '' ? null : Number(v));
    try { await gqlRequest(UPSERT_JOB, { id: existing?.id ?? null, in: { ...clientVars(client), kind: f.kind, serviceId: f.serviceId || null, title: f.title, description: f.description, location: f.location, destination: f.destination, district: f.district, distanceKm: n(f.distanceKm), quantity: n(f.quantity), unit: f.unit, scheduledDate: f.scheduledDate || null, scheduledTime: f.scheduledTime || null, assignedStaffId: f.assignedStaffId || null, equipmentId: f.equipmentId || null, status: f.status, quotedAmount: n(f.quotedAmount), agreedAmount: n(f.agreedAmount), paid: f.paid, completionNotes: f.completionNotes, notes: f.notes } }); toast('Job saved.'); onSaved(); } catch (err: any) { toast(err.message, false); } finally { setBusy(false); }
  }
  return (
    <Modal title={existing ? `Edit ${existing.jobRef}` : transport ? 'New transport job' : 'New job'} onClose={onClose} wide>
      <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
        <ClientPicker value={client} onChange={setClient} />
        <F label="Kind"><select value={f.kind} onChange={set('kind')} className={inp}>{KINDS.map(k => <option key={k[0]} value={k[0]}>{k[1]}</option>)}</select></F>
        {!transport && <F label="Service from catalogue"><select value={f.serviceId} onChange={e => pickService(e.target.value)} className={inp}><option value="">—</option>{services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></F>}
        <F label="Job title *" span={transport ? 1 : 2}><input value={f.title} onChange={set('title')} className={inp} required placeholder={transport ? 'e.g. Maize to FRA depot' : 'e.g. Drip irrigation, 2 ha block'} /></F>
        <F label={transport ? 'Pick-up' : 'Site / location'}><input value={f.location} onChange={set('location')} className={inp} /></F>
        {(transport || f.kind === 'transport' || f.kind === 'delivery') && <F label="Drop-off / destination"><input value={f.destination} onChange={set('destination')} className={inp} /></F>}
        <F label="District"><input value={f.district} onChange={set('district')} className={inp} /></F>
        {(transport || f.kind === 'transport' || f.kind === 'delivery') && <F label="Distance (km)"><input type="number" step="any" value={f.distanceKm} onChange={set('distanceKm')} className={inp} /></F>}
        <F label="Quantity"><input type="number" step="any" value={f.quantity} onChange={set('quantity')} className={inp} /></F>
        <F label="Unit"><input value={f.unit} onChange={set('unit')} className={inp} placeholder="ha, tonnes, trips, hours" /></F>
        <F label="Date"><input type="date" value={f.scheduledDate} onChange={set('scheduledDate')} className={inp} /></F>
        <F label="Time"><input type="time" value={f.scheduledTime} onChange={set('scheduledTime')} className={inp} /></F>
        <F label="Assigned to"><select value={f.assignedStaffId} onChange={set('assignedStaffId')} className={inp}><option value="">Unassigned</option>{staff.filter((s: any) => s.active).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></F>
        <F label={transport ? 'Vehicle' : 'Equipment'}><select value={f.equipmentId} onChange={set('equipmentId')} className={inp}><option value="">—</option>{fleet.map((x: any) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></F>
        <F label="Status"><select value={f.status} onChange={set('status')} className={inp}>{['requested', 'quoted', 'scheduled', 'in_progress', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{title(s)}</option>)}</select></F>
        <F label="Quoted (ZMW)"><input type="number" step="any" value={f.quotedAmount} onChange={set('quotedAmount')} className={inp} /></F>
        <F label="Agreed (ZMW)"><input type="number" step="any" value={f.agreedAmount} onChange={set('agreedAmount')} className={inp} /></F>
        <label className="flex items-center gap-2 text-sm text-slate-300 self-end pb-2"><input type="checkbox" checked={f.paid} onChange={set('paid')} /> Paid</label>
        <F label="Description / scope" span={2}><textarea value={f.description} onChange={set('description')} rows={2} className={inp} /></F>
        {f.status === 'completed' && <F label="Completion notes" span={2}><textarea value={f.completionNotes} onChange={set('completionNotes')} rows={2} className={inp} /></F>}
        <div className="md:col-span-2 flex justify-end gap-2"><button type="button" onClick={onClose} className={btnS}>Cancel</button><button type="submit" disabled={busy} className={btnP}>{busy ? 'Saving…' : 'Save job'}</button></div>
      </form>
    </Modal>
  );
}
