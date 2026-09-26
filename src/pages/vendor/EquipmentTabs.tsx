// Equipment hire (and transport fleet): fleet catalogue, inbound + walk-in bookings, quotes, maintenance log.
import React, { useState } from 'react';
import { gqlRequest } from '@/lib/api';
import { EQUIPMENT_Q, UPSERT_EQUIPMENT, DELETE_EQUIPMENT, MAINT_Q, ADD_MAINT, DELETE_MAINT, BOOKINGS_Q, CREATE_BOOKING, UPDATE_BOOKING, lc, num } from '@/graphql/vendorQueries';
import { Card, Modal, Table, F, Pill, inp, btnP, btnS, fmt, money, title, today, useList, useVendor, ClientPicker, clientVars, clientLabel, confirmDel, InvoiceForm, OverviewTab, SimpleForm } from './VendorCommon';
import { StatCard } from './VendorWidgets';

const EQ_TYPES = [['tractor', 'Tractor'], ['plough', 'Plough / ridger'], ['planter', 'Planter'], ['harvester', 'Combine harvester'], ['sprayer', 'Sprayer'], ['drone', 'Agricultural drone'], ['irrigation', 'Irrigation system'], ['truck', 'Truck / transport'], ['generator', 'Generator'], ['storage', 'Storage equipment'], ['processing', 'Processing equipment'], ['other', 'Other']];
const eqIcon = (t: string) => ({ tractor: '🚜', plough: '⚙️', planter: '🌱', harvester: '🌾', sprayer: '💨', drone: '🛸', irrigation: '💧', truck: '🚚', generator: '🔌', storage: '🏬', processing: '🏭' } as any)[lc(t)] ?? '🔧';

export function EquipmentOverview({ transport }: { transport?: boolean }) {
  const { summary } = useVendor();
  const { items } = useList(BOOKINGS_Q, 'providerHireBookings');
  const open = items.filter((b: any) => ['enquiry', 'quoted', 'confirmed', 'active'].includes(lc(b.status)));
  return (
    <OverviewTab icon={transport ? '🚚' : '🚜'} heading={transport ? 'Transport & logistics' : 'Equipment hire'} stats={[
      { icon: '🚜', label: transport ? 'Vehicles' : 'Machines', value: `${summary?.equipmentAvailable ?? 0} / ${summary?.equipmentCount ?? 0}`, sub: 'available now' },
      transport ? { icon: '📋', label: 'Open jobs', value: summary?.openJobs ?? 0, sub: 'transport runs in progress or scheduled', accent: 'text-amber-400' } : { icon: '📅', label: 'Open bookings', value: summary?.openBookings ?? 0, sub: `${open.filter((b: any) => lc(b.status) === 'enquiry').length} new enquiries`, accent: 'text-amber-400' },
      { icon: '🔧', label: 'Service due (14 d)', value: summary?.maintenanceDue ?? 0, accent: (summary?.maintenanceDue ?? 0) > 0 ? 'text-red-400' : 'text-slate-300' },
      { icon: '💰', label: 'Received (30 d)', value: money(summary?.revenue30d), accent: 'text-green-400' },
    ]} quick={transport ? [{ icon: '📋', label: 'Jobs', tab: 'jobs' }, { icon: '🚚', label: 'Fleet', tab: 'fleet' }, { icon: '🧾', label: 'Invoices', tab: 'invoices' }, { icon: '🔧', label: 'Maintenance', tab: 'maintenance' }] : [{ icon: '📅', label: 'Bookings', tab: 'bookings' }, { icon: '🚜', label: 'Fleet', tab: 'fleet' }, { icon: '🧾', label: 'Invoices', tab: 'invoices' }, { icon: '🔧', label: 'Maintenance', tab: 'maintenance' }]}>
      {!transport && <Card title="Bookings needing action"><Table head={['Ref', 'Client', 'Equipment', 'Dates', 'Status', 'Amount']} empty="No open bookings." rows={open.slice(0, 8).map((b: any) => [b.bookingRef, clientLabel(b), b.equipment?.name ?? '—', `${b.startDate} → ${b.endDate}`, <Pill v={b.status} />, money(b.agreedAmount ?? b.quotedAmount, b.currency)])} /></Card>}
    </OverviewTab>
  );
}

export function FleetTab({ transport }: { transport?: boolean }) {
  const { toast, reload: reloadHome } = useVendor();
  const { items, reload } = useList(EQUIPMENT_Q, 'vendorEquipment');
  const [editing, setEditing] = useState<any | null | 'new'>(null);
  return (
    <Card title={`${transport ? 'Vehicles' : 'Fleet'} (${items.length})`} action={<button onClick={() => setEditing('new')} className={btnP}>+ Add {transport ? 'vehicle' : 'machine'}</button>}>
      <Table head={['Machine', 'Type', 'Capacity', 'Daily rate', 'Per ha', 'Operator / fuel', 'Available', '']} empty={`No ${transport ? 'vehicles' : 'machines'} listed. Everything here is visible to farmers on the marketplace and can be booked.`}
        rows={items.map((e: any) => [<div><div className="font-medium text-white">{eqIcon(e.equipmentType)} {e.name}</div><div className="text-xs text-slate-500">{[e.make, e.model, e.year].filter(Boolean).join(' ')}</div></div>, EQ_TYPES.find(t => t[0] === lc(e.equipmentType))?.[1], e.capacity || '—',
          e.dailyRate != null ? money(e.dailyRate, e.currency) : '—', e.perHaRate != null ? money(e.perHaRate, e.currency) : '—', `${e.operatorIncluded ? 'operator' : 'no operator'} · ${e.fuelIncluded ? 'fuel incl.' : 'fuel excl.'}`, e.isAvailable ? '✓' : <span className="text-amber-400">unavailable</span>,
          <div className="flex gap-2"><button onClick={() => setEditing(e)} className="text-xs text-slate-300">Edit</button><button onClick={async () => { if (!confirmDel(e.name)) return; try { await gqlRequest(DELETE_EQUIPMENT, { id: e.id }); reload(); reloadHome(); } catch (err: any) { toast(err.message, false); } }} className="text-xs text-red-400">Delete</button></div>])} />
      {editing && <SimpleForm title={editing === 'new' ? 'Add to fleet' : 'Edit'} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); reloadHome(); }} mutation={UPSERT_EQUIPMENT} id={editing === 'new' ? null : editing.id}
        fields={[['name', 'Name *', 'text'], ['equipmentType', 'Type', 'select', EQ_TYPES], ['make', 'Make', 'text'], ['model', 'Model', 'text'], ['year', 'Year', 'number'], ['capacity', 'Capacity (HP, tonnes, m)', 'text'], ['dailyRate', 'Daily rate (ZMW)', 'number'], ['perHaRate', 'Per-hectare / per-km rate (ZMW)', 'number'], ['minHireDays', 'Minimum hire days', 'number'], ['operatorIncluded', 'Operator / driver included', 'checkbox'], ['fuelIncluded', 'Fuel included', 'checkbox'], ['isAvailable', 'Available for hire', 'checkbox'], ['notes', 'Notes', 'textarea']]}
        initial={editing === 'new' ? { equipmentType: transport ? 'truck' : 'tractor', operatorIncluded: true, isAvailable: true, minHireDays: 1 } : { ...editing, equipmentType: lc(editing.equipmentType) }} />}
    </Card>
  );
}

export function BookingsTab() {
  const { toast, reload: reloadHome } = useVendor();
  const [filter, setFilter] = useState('');
  const { items, reload } = useList(BOOKINGS_Q, 'providerHireBookings', filter ? { status: filter } : {});
  const { items: fleet } = useList(EQUIPMENT_Q, 'vendorEquipment');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [invoiceFor, setInvoiceFor] = useState<any>(null);
  return (
    <div className="space-y-4">
      <Card title="Bookings" action={<div className="flex gap-2"><select value={filter} onChange={e => setFilter(e.target.value)} className={`${inp} w-40`}><option value="">All statuses</option>{['enquiry', 'quoted', 'confirmed', 'active', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{title(s)}</option>)}</select><button onClick={() => setCreating(true)} className={btnP}>+ Booking</button></div>}>
        <Table head={['Ref', 'Client', 'Equipment', 'Dates', 'Area', 'Quote / agreed', 'Paid', 'Status', '']} empty="No bookings yet. Farmers book from your marketplace listing; phone bookings go in here."
          rows={items.map((b: any) => [<div><div className="font-medium text-white">{b.bookingRef}</div><div className="text-xs text-slate-500">{b.organization ? 'marketplace' : 'walk-in'}</div></div>, <div>{clientLabel(b)}<div className="text-xs text-slate-500">{b.clientPhone || b.organization?.district || ''}</div></div>, b.equipment?.name ?? <span className="text-amber-400">unassigned</span>, `${b.startDate} → ${b.endDate}`, b.hectares ? `${fmt(b.hectares, 1)} ha` : '—',
            <span className="tabular-nums">{b.agreedAmount != null ? money(b.agreedAmount, b.currency) : b.quotedAmount != null ? <span className="text-slate-400">quote {money(b.quotedAmount, b.currency)}</span> : '—'}</span>, b.finalPaid ? '✓' : b.depositPaid ? 'deposit' : '—', <Pill v={b.status} />,
            <div className="flex flex-col gap-1 text-xs"><button onClick={() => setEditing(b)} className="text-teal-400 text-left">{lc(b.status) === 'enquiry' ? 'Quote' : 'Update'}</button>{lc(b.status) === 'completed' && !b.finalPaid && <button onClick={() => setInvoiceFor(b)} className="text-slate-300 text-left">Invoice</button>}</div>])} />
      </Card>
      {creating && <BookingForm fleet={fleet} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); reload(); reloadHome(); }} />}
      {editing && <BookingUpdate b={editing} fleet={fleet} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); reloadHome(); }} />}
      {invoiceFor && <InvoiceForm existing={null} link={{ type: 'hire', id: invoiceFor.id, label: invoiceFor.bookingRef }} onClose={() => setInvoiceFor(null)} onSaved={() => { setInvoiceFor(null); reload(); reloadHome(); }} />}
    </div>
  );
}

function BookingForm({ fleet, onClose, onSaved }: { fleet: any[]; onClose: () => void; onSaved: () => void }) {
  const { toast } = useVendor();
  const [client, setClient] = useState({ clientOrgId: null as string | null, clientName: '', clientPhone: '' });
  const [f, setF] = useState({ equipmentId: '', startDate: today(), endDate: today(), hectares: '', agreedAmount: '', status: 'confirmed', deliveryAddress: '', providerNotes: '' });
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<any>) => setF({ ...f, [k]: e.target.value });
  const eq = fleet.find(x => x.id === f.equipmentId);
  const days = Math.max(1, (new Date(f.endDate).getTime() - new Date(f.startDate).getTime()) / 86400000 + 1);
  const suggested = eq ? (f.hectares && eq.perHaRate ? num(f.hectares) * num(eq.perHaRate) : eq.dailyRate ? days * num(eq.dailyRate) : 0) : 0;
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try { await gqlRequest(CREATE_BOOKING, { in: { ...clientVars(client), equipmentId: f.equipmentId || null, startDate: f.startDate, endDate: f.endDate, hectares: f.hectares ? Number(f.hectares) : null, agreedAmount: f.agreedAmount ? Number(f.agreedAmount) : null, status: f.status, deliveryAddress: f.deliveryAddress, providerNotes: f.providerNotes } }); toast('Booking created.'); onSaved(); } catch (err: any) { toast(err.message, false); } finally { setBusy(false); }
  }
  return (
    <Modal title="New booking" onClose={onClose} wide>
      <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
        <ClientPicker value={client} onChange={setClient} />
        <F label="Equipment"><select value={f.equipmentId} onChange={set('equipmentId')} className={inp}><option value="">Choose later</option>{fleet.map(x => <option key={x.id} value={x.id}>{x.name}{x.isAvailable ? '' : ' (unavailable)'}</option>)}</select></F>
        <F label="Status"><select value={f.status} onChange={set('status')} className={inp}>{['enquiry', 'quoted', 'confirmed', 'active'].map(s => <option key={s} value={s}>{title(s)}</option>)}</select></F>
        <F label="Start *"><input type="date" value={f.startDate} onChange={set('startDate')} className={inp} required /></F>
        <F label="End *"><input type="date" value={f.endDate} onChange={set('endDate')} className={inp} required /></F>
        <F label="Hectares"><input type="number" step="any" value={f.hectares} onChange={set('hectares')} className={inp} /></F>
        <F label={`Agreed amount (ZMW)${suggested ? ` — suggested ${fmt(suggested)}` : ''}`}><input type="number" step="any" value={f.agreedAmount} onChange={set('agreedAmount')} className={inp} placeholder={suggested ? String(suggested) : ''} /></F>
        <F label="Site / delivery address" span={2}><input value={f.deliveryAddress} onChange={set('deliveryAddress')} className={inp} /></F>
        <F label="Notes" span={2}><input value={f.providerNotes} onChange={set('providerNotes')} className={inp} /></F>
        <div className="md:col-span-2 flex justify-end gap-2"><button type="button" onClick={onClose} className={btnS}>Cancel</button><button type="submit" disabled={busy} className={btnP}>{busy ? 'Saving…' : 'Create booking'}</button></div>
      </form>
    </Modal>
  );
}

function BookingUpdate({ b, fleet, onClose, onSaved }: { b: any; fleet: any[]; onClose: () => void; onSaved: () => void }) {
  const { toast } = useVendor();
  const [f, setF] = useState({ status: lc(b.status), equipmentId: b.equipment?.id ?? '', startDate: b.startDate, endDate: b.endDate, quotedAmount: b.quotedAmount != null ? String(num(b.quotedAmount)) : '', agreedAmount: b.agreedAmount != null ? String(num(b.agreedAmount)) : '', depositPaid: !!b.depositPaid, finalPaid: !!b.finalPaid, providerNotes: b.providerNotes ?? '' });
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<any>) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try { await gqlRequest(UPDATE_BOOKING, { id: b.id, in: { status: f.status, equipmentId: f.equipmentId || null, startDate: f.startDate, endDate: f.endDate, quotedAmount: f.quotedAmount === '' ? null : Number(f.quotedAmount), agreedAmount: f.agreedAmount === '' ? null : Number(f.agreedAmount), depositPaid: f.depositPaid, finalPaid: f.finalPaid, providerNotes: f.providerNotes } }); toast(`${b.bookingRef} updated.`); onSaved(); } catch (err: any) { toast(err.message, false); } finally { setBusy(false); }
  }
  return (
    <Modal title={`${b.bookingRef} — ${clientLabel(b)}`} onClose={onClose}>
      {b.notes && <p className="text-xs text-slate-400 mb-3">Customer note: {b.notes}</p>}
      <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
        <F label="Status"><select value={f.status} onChange={set('status')} className={inp}>{['enquiry', 'quoted', 'confirmed', 'active', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{title(s)}</option>)}</select></F>
        <F label="Equipment"><select value={f.equipmentId} onChange={set('equipmentId')} className={inp}><option value="">Unassigned</option>{fleet.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></F>
        <F label="Start"><input type="date" value={f.startDate} onChange={set('startDate')} className={inp} /></F>
        <F label="End"><input type="date" value={f.endDate} onChange={set('endDate')} className={inp} /></F>
        <F label="Quoted amount (ZMW)"><input type="number" step="any" value={f.quotedAmount} onChange={set('quotedAmount')} className={inp} /></F>
        <F label="Agreed amount (ZMW)"><input type="number" step="any" value={f.agreedAmount} onChange={set('agreedAmount')} className={inp} /></F>
        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={f.depositPaid} onChange={set('depositPaid')} /> Deposit paid</label>
        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={f.finalPaid} onChange={set('finalPaid')} /> Paid in full</label>
        <F label="Notes to customer" span={2}><textarea value={f.providerNotes} onChange={set('providerNotes')} rows={2} className={inp} placeholder="Includes operator, fuel extra, delivery ZMW…" /></F>
        <div className="md:col-span-2 flex justify-end gap-2"><button type="button" onClick={onClose} className={btnS}>Cancel</button><button type="submit" disabled={busy} className={btnP}>{busy ? 'Saving…' : 'Save'}</button></div>
      </form>
    </Modal>
  );
}

export function MaintenanceTab() {
  const { toast, reload: reloadHome } = useVendor();
  const { items: fleet } = useList(EQUIPMENT_Q, 'vendorEquipment');
  const { items, reload } = useList(MAINT_Q, 'vendorMaintenance');
  const [adding, setAdding] = useState(false);
  const due = items.filter((m: any) => m.nextDueDate && m.nextDueDate <= new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🔧" label="Service records" value={items.length} />
        <StatCard icon="⏰" label="Due within 14 days" value={due.length} accentColor={due.length ? 'text-red-400' : 'text-slate-300'} />
        <StatCard icon="💸" label="Maintenance cost (all)" value={money(items.reduce((a: number, m: any) => a + num(m.cost), 0))} accentColor="text-amber-400" />
        <StatCard icon="🛑" label="Downtime days" value={items.reduce((a: number, m: any) => a + (m.downtimeDays || 0), 0)} />
      </div>
      <Card title="Maintenance log" action={<button onClick={() => setAdding(true)} disabled={!fleet.length} className={btnP}>+ Log service</button>}>
        <Table head={['Date', 'Machine', 'Type', 'Work done', 'Cost', 'Hours', 'Next due', 'By', '']} empty={fleet.length ? 'No service records yet.' : 'Add machines to the fleet first.'}
          rows={items.map((m: any) => [m.date, <span className="text-white">{m.equipmentName}</span>, title(m.kind), m.description, money(m.cost, m.currency), m.hoursReading ?? '—', m.nextDueDate ? <span className={due.includes(m) ? 'text-red-400' : ''}>{m.nextDueDate}</span> : '—', m.performedBy || '—',
            <button onClick={async () => { if (!confirmDel('this record')) return; try { await gqlRequest(DELETE_MAINT, { id: m.id }); reload(); reloadHome(); } catch (e: any) { toast(e.message, false); } }} className="text-xs text-red-400">Delete</button>])} />
      </Card>
      {adding && <SimpleForm title="Log maintenance" onClose={() => setAdding(false)} onSaved={() => { setAdding(false); reload(); reloadHome(); }} mutation={ADD_MAINT} id={null}
        fields={[['equipmentId', 'Machine *', 'select', fleet.map((x: any) => [x.id, x.name])], ['kind', 'Type', 'select', [['service', 'Routine service'], ['repair', 'Repair'], ['inspection', 'Inspection'], ['tyres', 'Tyres / tracks'], ['other', 'Other']]], ['date', 'Date *', 'date'], ['description', 'Work done *', 'text'], ['cost', 'Cost (ZMW)', 'number'], ['hoursReading', 'Hour-meter reading', 'number'], ['downtimeDays', 'Downtime (days)', 'number'], ['nextDueDate', 'Next service due', 'date'], ['performedBy', 'Performed by', 'text'], ['notes', 'Notes', 'textarea']]}
        initial={{ equipmentId: fleet[0]?.id, kind: 'service', date: today() }} />}
    </div>
  );
}
