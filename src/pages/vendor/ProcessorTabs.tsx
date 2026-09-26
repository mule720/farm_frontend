// Agro processor: sourcing intakes, processing lots, finished-goods inventory, traceability, plus sales orders.
import React, { useMemo, useState } from 'react';
import { gqlRequest } from '@/lib/api';
import { BATCHES_Q, UPSERT_BATCH, DELETE_BATCH, ORDERS_Q, lc, num, parseJson } from '@/graphql/vendorQueries';
import { Card, Modal, Table, F, Pill, inp, btnP, btnS, fmt, money, title, today, useList, useVendor, confirmDel, OverviewTab, clientLabel } from './VendorCommon';
import { StatCard } from './VendorWidgets';
import { gqlRequest as gql } from '@/lib/api';
import { CLIENT_SEARCH } from '@/graphql/vendorQueries';

export function ProcessorOverview() {
  const { summary } = useVendor();
  const { items } = useList(BATCHES_Q, 'vendorBatches');
  const { items: orders } = useList(ORDERS_Q, 'vendorOrders');
  return (
    <OverviewTab icon="🏭" heading="Agro processing" stats={[
      { icon: '🌾', label: 'Lots in process', value: summary?.batchesInProcess ?? 0, sub: `${items.length} lots total`, accent: 'text-amber-400' },
      { icon: '📦', label: 'Finished stock', value: fmt(summary?.finishedStock), sub: 'units unsold across completed lots' },
      { icon: '📋', label: 'Open orders', value: summary?.openOrders ?? 0, sub: `${orders.length} orders total`, accent: 'text-blue-400' },
      { icon: '💰', label: 'Received (30 d)', value: money(summary?.revenue30d), accent: 'text-green-400' },
    ]} quick={[{ icon: '🌾', label: 'Record intake', tab: 'sourcing' }, { icon: '⚙️', label: 'Processing', tab: 'processing' }, { icon: '📦', label: 'Inventory', tab: 'inventory' }, { icon: '📋', label: 'Orders', tab: 'orders' }]}>
      <Card title="Recent lots"><Table head={['Lot', 'Source', 'Input', 'Product', 'Yield', 'Status']} empty="No lots yet. Record raw-material intake under Farm Sourcing." rows={items.slice(0, 8).map((b: any) => [b.lotCode, b.sourceOrgName ?? b.sourceName, `${fmt(b.inputQuantity)} ${b.inputUnit} ${b.inputCommodity}`, b.product ? `${fmt(b.outputQuantity)} ${b.outputUnit} ${b.product}` : '—', b.yieldPct != null ? `${b.yieldPct}%` : '—', <Pill v={b.status} />])} /></Card>
    </OverviewTab>
  );
}

export function BatchesTab({ mode }: { mode: 'sourcing' | 'processing' | 'inventory' | 'traceability' }) {
  const { toast, reload: reloadHome } = useVendor();
  const { items, reload } = useList(BATCHES_Q, 'vendorBatches');
  const [editing, setEditing] = useState<any | null | 'new'>(null);
  const [q, setQ] = useState('');
  const shown = useMemo(() => {
    let s = items;
    if (mode === 'processing') s = items.filter((b: any) => ['received', 'processing'].includes(lc(b.status)));
    if (mode === 'inventory') s = items.filter((b: any) => lc(b.status) === 'completed' && num(b.quantityRemaining) > 0);
    if (q) s = s.filter((b: any) => `${b.lotCode} ${b.sourceName} ${b.sourceOrgName ?? ''} ${b.product} ${b.inputCommodity}`.toLowerCase().includes(q.toLowerCase()));
    return s;
  }, [items, mode, q]);
  const bySource = useMemo(() => { const m: Record<string, { name: string; district: string; lots: number; qty: number; paid: number; last: string }> = {}; for (const b of items) { const k = b.sourceOrgName ?? b.sourceName ?? 'Unknown'; const e = m[k] ??= { name: k, district: b.sourceDistrict, lots: 0, qty: 0, paid: 0, last: '' }; e.lots++; e.qty += num(b.inputQuantity); e.paid += num(b.pricePaid); if (b.receivedOn > e.last) e.last = b.receivedOn; } return Object.values(m).sort((a, b) => b.qty - a.qty); }, [items]);
  const heading = { sourcing: 'Farm sourcing — raw material intake', processing: 'Processing — lots in progress', inventory: 'Finished-goods inventory', traceability: 'Traceability — lot lookup' }[mode];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🌾" label="Raw material received" value={fmt(items.reduce((a: number, b: any) => a + num(b.inputQuantity), 0))} sub="all lots (input units)" />
        <StatCard icon="👩🏾‍🌾" label="Suppliers" value={bySource.length} accentColor="text-blue-400" />
        <StatCard icon="⚙️" label="In process" value={items.filter((b: any) => ['received', 'processing'].includes(lc(b.status))).length} accentColor="text-amber-400" />
        <StatCard icon="💸" label="Paid to farmers" value={money(items.reduce((a: number, b: any) => a + num(b.pricePaid), 0))} accentColor="text-teal-400" />
      </div>
      {mode === 'sourcing' && <Card title="Suppliers"><Table head={['Supplier', 'District', 'Lots', 'Quantity supplied', 'Paid', 'Last delivery']} empty="No suppliers yet." rows={bySource.map(s => [<span className="text-white font-medium">{s.name}</span>, s.district || '—', s.lots, fmt(s.qty), money(s.paid), s.last])} /></Card>}
      <Card title={heading} action={<div className="flex gap-2"><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search lot, supplier, product" className={`${inp} w-56`} />{mode !== 'inventory' && <button onClick={() => setEditing('new')} className={btnP}>+ Record intake</button>}</div>}>
        {mode === 'traceability' && <p className="text-xs text-slate-500 mb-3">Every lot code links finished product back to the farm it came from, the day it was received, QC result and expiry. Print the lot code on packaging.</p>}
        <Table head={['Lot', 'Received', 'Source', 'Input', 'Product / output', 'Yield', 'Remaining', 'QC', 'Status', '']} empty={mode === 'inventory' ? 'No finished stock. Complete a lot with an output quantity to see it here.' : 'No lots yet.'}
          rows={shown.map((b: any) => [<div><div className="font-mono text-teal-400">{b.lotCode}</div>{b.expiryDate && <div className="text-[10px] text-slate-500">exp {b.expiryDate}</div>}</div>, b.receivedOn, <div>{b.sourceOrgName ?? b.sourceName ?? '—'}<div className="text-xs text-slate-500">{b.sourceDistrict}</div></div>, `${fmt(b.inputQuantity, 2)} ${b.inputUnit} ${b.inputCommodity}`, b.product ? `${fmt(b.outputQuantity, 2)} ${b.outputUnit} ${b.product}` : <span className="text-slate-500">—</span>, b.yieldPct != null ? `${b.yieldPct}%` : '—', b.quantityRemaining != null ? `${fmt(b.quantityRemaining, 2)} ${b.outputUnit}` : '—', b.qcPassed == null ? '—' : b.qcPassed ? <span className="text-green-400">pass</span> : <span className="text-red-400">fail</span>, <Pill v={b.status} />,
            <div className="flex gap-2 text-xs"><button onClick={() => setEditing(b)} className="text-slate-300">{['received', 'processing'].includes(lc(b.status)) ? 'Update' : 'Edit'}</button>{lc(b.status) === 'received' && <button onClick={async () => { try { await gqlRequest(UPSERT_BATCH, { id: b.id, in: { inputCommodity: b.inputCommodity, inputQuantity: num(b.inputQuantity), receivedOn: b.receivedOn, status: 'processing' } }); reload(); reloadHome(); } catch (e: any) { toast(e.message, false); } }} className="text-amber-400">Start</button>}<button onClick={async () => { if (!confirmDel(b.lotCode)) return; try { await gqlRequest(DELETE_BATCH, { id: b.id }); reload(); reloadHome(); } catch (e: any) { toast(e.message, false); } }} className="text-red-400">Delete</button></div>])} />
      </Card>
      {editing && <BatchForm existing={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); reloadHome(); }} />}
    </div>
  );
}

function BatchForm({ existing, onClose, onSaved }: { existing: any | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useVendor();
  const [src, setSrc] = useState<{ id: string | null; name: string }>({ id: existing?.sourceOrg?.id ?? null, name: existing?.sourceName ?? '' });
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<any[]>([]);
  const [f, setF] = useState({ sourceDistrict: existing?.sourceDistrict ?? '', inputCommodity: existing?.inputCommodity ?? '', inputQuantity: existing ? String(num(existing.inputQuantity)) : '', inputUnit: existing?.inputUnit ?? 'kg', pricePaid: existing?.pricePaid != null ? String(num(existing.pricePaid)) : '', receivedOn: existing?.receivedOn ?? today(), product: existing?.product ?? '', outputQuantity: existing?.outputQuantity != null ? String(num(existing.outputQuantity)) : '', outputUnit: existing?.outputUnit ?? '', quantitySold: existing ? String(num(existing.quantitySold)) : '0', completedOn: existing?.completedOn ?? '', expiryDate: existing?.expiryDate ?? '', status: existing ? lc(existing.status) : 'received', qcPassed: existing?.qcPassed ?? null, qcNotes: existing?.qcNotes ?? '', notes: existing?.notes ?? '' });
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<any>) => setF({ ...f, [k]: e.target.value });
  React.useEffect(() => { if (q.trim().length < 2) { setHits([]); return; } const t = setTimeout(() => gql<{ vendorClientSearch: any[] }>(CLIENT_SEARCH, { s: q }).then(r => setHits(r.vendorClientSearch)).catch(() => {}), 250); return () => clearTimeout(t); }, [q]);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const n = (v: string) => (v === '' ? null : Number(v));
    try { await gqlRequest(UPSERT_BATCH, { id: existing?.id ?? null, in: { sourceOrgId: src.id, sourceName: src.name || null, sourceDistrict: f.sourceDistrict, inputCommodity: f.inputCommodity, inputQuantity: Number(f.inputQuantity), inputUnit: f.inputUnit, pricePaid: n(f.pricePaid), receivedOn: f.receivedOn, product: f.product, outputQuantity: n(f.outputQuantity), outputUnit: f.outputUnit, quantitySold: n(f.quantitySold), completedOn: f.completedOn || null, expiryDate: f.expiryDate || null, status: f.status, qcPassed: f.qcPassed, qcNotes: f.qcNotes, notes: f.notes } }); toast('Lot saved.'); onSaved(); } catch (err: any) { toast(err.message, false); } finally { setBusy(false); }
  }
  return (
    <Modal title={existing ? `Lot ${existing.lotCode}` : 'Record raw-material intake'} onClose={onClose} wide>
      <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
        <div className="relative"><F label="Source farm (platform)"><input value={src.id ? src.name : q} onChange={e => { setQ(e.target.value); if (src.id) setSrc({ id: null, name: '' }); }} className={inp} placeholder="Search farm / cooperative…" /></F>
          {hits.length > 0 && !src.id && <ul className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg max-h-40 overflow-y-auto">{hits.map(h => <li key={h.id}><button type="button" onClick={() => { setSrc({ id: h.id, name: h.name }); setF(x => ({ ...x, sourceDistrict: h.district || x.sourceDistrict })); setHits([]); }} className="w-full text-left px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700">{h.name} <span className="text-slate-500 text-xs">{h.district}</span></button></li>)}</ul>}</div>
        <F label="or supplier name (off-platform)"><input value={src.id ? '' : src.name} disabled={!!src.id} onChange={e => setSrc({ id: null, name: e.target.value })} className={inp} /></F>
        <F label="Source district"><input value={f.sourceDistrict} onChange={set('sourceDistrict')} className={inp} /></F>
        <F label="Received on *"><input type="date" value={f.receivedOn} onChange={set('receivedOn')} className={inp} required /></F>
        <F label="Raw material *"><input value={f.inputCommodity} onChange={set('inputCommodity')} className={inp} required placeholder="Maize grain, soya beans, raw milk…" /></F>
        <div className="grid grid-cols-2 gap-2"><F label="Quantity *"><input type="number" step="any" min="0" value={f.inputQuantity} onChange={set('inputQuantity')} className={inp} required /></F><F label="Unit"><select value={f.inputUnit} onChange={set('inputUnit')} className={inp}>{['kg', 'tonne', 'litre', 'bag', 'crate', 'head'].map(u => <option key={u}>{u}</option>)}</select></F></div>
        <F label="Price paid to source (ZMW)"><input type="number" step="any" value={f.pricePaid} onChange={set('pricePaid')} className={inp} /></F>
        <F label="Status"><select value={f.status} onChange={set('status')} className={inp}>{['received', 'processing', 'completed', 'sold_out', 'rejected'].map(s => <option key={s} value={s}>{title(s)}</option>)}</select></F>
        <div className="md:col-span-2 border-t border-slate-800 pt-3 text-xs text-slate-400">Output (fill when processing completes)</div>
        <F label="Finished product"><input value={f.product} onChange={set('product')} className={inp} placeholder="Breakfast mealie meal 25 kg" /></F>
        <div className="grid grid-cols-2 gap-2"><F label="Output quantity"><input type="number" step="any" value={f.outputQuantity} onChange={set('outputQuantity')} className={inp} /></F><F label="Unit"><input value={f.outputUnit} onChange={set('outputUnit')} className={inp} placeholder="bags" /></F></div>
        <F label="Quantity sold"><input type="number" step="any" value={f.quantitySold} onChange={set('quantitySold')} className={inp} /></F>
        <F label="Expiry / best before"><input type="date" value={f.expiryDate} onChange={set('expiryDate')} className={inp} /></F>
        <F label="QC result"><select value={f.qcPassed == null ? '' : f.qcPassed ? 'pass' : 'fail'} onChange={e => setF({ ...f, qcPassed: e.target.value === '' ? null : e.target.value === 'pass' })} className={inp}><option value="">Not tested</option><option value="pass">Pass</option><option value="fail">Fail</option></select></F>
        <F label="QC notes"><input value={f.qcNotes} onChange={set('qcNotes')} className={inp} placeholder="Moisture 12.5 %, aflatoxin < 10 ppb" /></F>
        <F label="Notes" span={2}><input value={f.notes} onChange={set('notes')} className={inp} /></F>
        <div className="md:col-span-2 flex justify-end gap-2"><button type="button" onClick={onClose} className={btnS}>Cancel</button><button type="submit" disabled={busy} className={btnP}>{busy ? 'Saving…' : 'Save lot'}</button></div>
      </form>
    </Modal>
  );
}

export function ProcessorOrdersHint() {
  const { items } = useList(ORDERS_Q, 'vendorOrders');
  const recent = items.slice(0, 5);
  if (!recent.length) return null;
  return <Card title="Recent product orders"><Table head={['Ref', 'Buyer', 'Items', 'Total', 'Status']} empty="" rows={recent.map((o: any) => [o.orderRef, clientLabel(o), (parseJson(o.items) ?? []).map((i: any) => `${i.name} × ${i.quantity}`).join(', '), money(o.total, o.currency), <Pill v={o.status} />])} /></Card>;
}
