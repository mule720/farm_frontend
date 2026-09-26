// Goods sellers (agro dealer, agri-supply, agrifood): catalogue = marketplace listings, orders, stock, deliveries.
import React, { useMemo, useState } from 'react';
import { gqlRequest } from '@/lib/api';
import { LISTINGS_Q, CREATE_LISTING, UPDATE_LISTING, ORDERS_Q, UPSERT_ORDER, DELETE_ORDER, lc, num, parseJson } from '@/graphql/vendorQueries';
import { Card, Modal, Table, F, Pill, inp, btnP, btnS, fmt, money, title, today, useList, useVendor, ClientPicker, clientVars, clientLabel, confirmDel, InvoiceForm, OverviewTab } from './VendorCommon';
import { StatCard } from './VendorWidgets';

const KIND: Record<string, { icon: string; heading: string; item: string; catalogHint: string }> = {
  agro_dealer: { icon: '🏪', heading: 'Agro dealer', item: 'product', catalogHint: 'Seeds, fertiliser, agro-chemicals, feed, tools. Listings are what farmers see and order in the marketplace; stock is what you hold.' },
  agrisupply_provider: { icon: '📦', heading: 'AgriSupply', item: 'supply item', catalogHint: 'Packaging, crates, irrigation kit, farm chemicals, storage. Buyers browse these in the marketplace.' },
  agrifood_seller: { icon: '🥦', heading: 'AgriFood seller', item: 'produce line', catalogHint: 'Fresh produce, grain, eggs, dairy, processed food. Listings appear to buyers, processors and exporters.' },
  processor: { icon: '🏭', heading: 'Agro processor', item: 'finished product', catalogHint: 'Finished goods offered for sale (mealie meal, oil, feed, packaged produce). Stock here is what buyers can order; lots under Processing track where it came from.' },
};

export function SalesOverview() {
  const { summary, businessType } = useVendor();
  const k = KIND[businessType] ?? KIND.agro_dealer;
  const { items: orders } = useList(ORDERS_Q, 'vendorOrders');
  const open = orders.filter((o: any) => ['new', 'confirmed', 'packed', 'out_for_delivery'].includes(lc(o.status)));
  return (
    <OverviewTab icon={k.icon} heading={k.heading} stats={[
      { icon: '🗂️', label: 'Active listings', value: summary?.listingsActive ?? 0, sub: `${summary?.lowStock ?? 0} low on stock` },
      { icon: '📋', label: 'Open orders', value: summary?.openOrders ?? 0, sub: `${open.filter((o: any) => lc(o.status) === 'new').length} new`, accent: 'text-amber-400' },
      { icon: '👥', label: 'Customers', value: summary?.clients ?? 0, accent: 'text-blue-400' },
      { icon: '💰', label: 'Received (30 d)', value: money(summary?.revenue30d), accent: 'text-green-400' },
    ]} quick={[{ icon: '📋', label: 'New order', tab: 'orders' }, { icon: '🗂️', label: 'Catalogue & prices', tab: 'catalog' }, { icon: '📦', label: 'Stock', tab: 'stock' }, { icon: '🧾', label: 'Invoices', tab: 'invoices' }]}>
      <Card title="Open orders"><Table head={['Ref', 'Customer', 'Items', 'Total', 'Delivery', 'Status']} empty="No open orders." rows={open.slice(0, 8).map((o: any) => [o.orderRef, clientLabel(o), (parseJson(o.items) ?? []).map((i: any) => `${i.name} × ${i.quantity}`).join(', '), money(o.total, o.currency), o.deliveryRequired ? (o.deliveryDate ?? 'to arrange') : 'collect', <Pill v={o.status} />])} /></Card>
    </OverviewTab>
  );
}

export function CatalogTab({ mode }: { mode: 'catalog' | 'stock' | 'pricing' }) {
  const { toast, reload: reloadHome, businessType } = useVendor();
  const k = KIND[businessType] ?? KIND.agro_dealer;
  const { items, reload } = useList(LISTINGS_Q, 'vendorListings');
  const [editing, setEditing] = useState<any | null | 'new'>(null);
  const [adjust, setAdjust] = useState<any>(null);
  const active = items.filter((l: any) => lc(l.status) === 'active');
  const low = active.filter((l: any) => num(l.quantityAvailable) <= 10);
  const value = active.reduce((a: number, l: any) => a + num(l.quantityAvailable) * num(l.askingPrice), 0);
  async function setStatus(l: any, status: string) { try { await gqlRequest(UPDATE_LISTING, { id: l.id, in: { status } }); reload(); reloadHome(); } catch (e: any) { toast(e.message, false); } }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🗂️" label="Listings" value={items.length} sub={`${active.length} live in marketplace`} />
        <StatCard icon="📦" label="Stock value (asking)" value={money(value)} accentColor="text-teal-400" />
        <StatCard icon="⚠️" label="Low stock (≤ 10)" value={low.length} accentColor={low.length ? 'text-amber-400' : 'text-slate-300'} />
        <StatCard icon="👁️" label="Marketplace views" value={fmt(items.reduce((a: number, l: any) => a + (l.viewsCount || 0), 0))} />
      </div>
      <Card title={mode === 'stock' ? 'Stock on hand' : mode === 'pricing' ? 'Prices & offers' : `Catalogue (${items.length})`} action={<button onClick={() => setEditing('new')} className={btnP}>+ Add {k.item}</button>}>
        <p className="text-xs text-slate-500 mb-3">{k.catalogHint}</p>
        <Table head={['Item', 'Stock', 'Unit', 'Price', 'Min order', 'Delivery', 'Status', '']} empty={`No ${k.item}s yet. Add your first one to appear in the marketplace.`}
          rows={items.map((l: any) => [<div><div className="font-medium text-white">{l.commodity}</div>{l.description && <div className="text-xs text-slate-500 max-w-xs">{l.description}</div>}</div>,
            <span className={`tabular-nums ${num(l.quantityAvailable) <= 10 ? 'text-amber-400' : ''}`}>{fmt(l.quantityAvailable, 2)} <button onClick={() => setAdjust(l)} className="text-xs text-teal-400 ml-1">adjust</button></span>, l.unit, <span className="tabular-nums">{money(l.askingPrice, l.currency)}</span>, fmt(l.minOrderQuantity, 2), l.deliveryAvailable ? '✓' : '—', <Pill v={l.status} />,
            <div className="flex gap-2 text-xs"><button onClick={() => setEditing(l)} className="text-slate-300">Edit</button>{lc(l.status) === 'active' ? <button onClick={() => setStatus(l, 'draft')} className="text-amber-400">Unlist</button> : ['draft', 'expired', 'sold'].includes(lc(l.status)) && <button onClick={() => setStatus(l, 'active')} className="text-green-400">List</button>}<button onClick={() => { if (confirmDel(l.commodity)) setStatus(l, 'cancelled'); }} className="text-red-400">Remove</button></div>])} />
      </Card>
      {editing && <ListingForm existing={editing === 'new' ? null : editing} itemLabel={k.item} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); reloadHome(); }} />}
      {adjust && <StockAdjust l={adjust} onClose={() => setAdjust(null)} onSaved={() => { setAdjust(null); reload(); reloadHome(); }} />}
    </div>
  );
}

function ListingForm({ existing, itemLabel, onClose, onSaved }: { existing: any | null; itemLabel: string; onClose: () => void; onSaved: () => void }) {
  const { toast } = useVendor();
  const [f, setF] = useState({ commodity: existing?.commodity ?? '', description: existing?.description ?? '', quantityAvailable: existing ? String(num(existing.quantityAvailable)) : '', unit: existing?.unit ?? 'kg', askingPrice: existing ? String(num(existing.askingPrice)) : '', minOrderQuantity: existing ? String(num(existing.minOrderQuantity)) : '0', deliveryAvailable: !!existing?.deliveryAvailable, location: existing?.location ?? '', availableUntil: existing?.availableUntil ?? '' });
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<any>) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      if (existing) await gqlRequest(UPDATE_LISTING, { id: existing.id, in: { commodity: f.commodity, description: f.description, quantityAvailable: Number(f.quantityAvailable), unit: f.unit, askingPrice: Number(f.askingPrice), minOrderQuantity: Number(f.minOrderQuantity || 0), deliveryAvailable: f.deliveryAvailable, location: f.location, availableUntil: f.availableUntil || null } });
      else {
        const r = await gqlRequest<{ createListing: { listing: { id: string } } }>(CREATE_LISTING, { c: f.commodity, q: Number(f.quantityAvailable), p: Number(f.askingPrice), u: f.unit, d: f.description, l: f.location, until: f.availableUntil || null });
        if (f.deliveryAvailable || Number(f.minOrderQuantity || 0) > 0) await gqlRequest(UPDATE_LISTING, { id: r.createListing.listing.id, in: { deliveryAvailable: f.deliveryAvailable, minOrderQuantity: Number(f.minOrderQuantity || 0) } });
      }
      toast('Saved.'); onSaved();
    } catch (err: any) { toast(err.message, false); } finally { setBusy(false); }
  }
  return (
    <Modal title={existing ? `Edit ${existing.commodity}` : `Add ${itemLabel}`} onClose={onClose}>
      <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
        <F label="Name *" span={2}><input value={f.commodity} onChange={set('commodity')} className={inp} required placeholder="e.g. Compound D fertiliser 50 kg" /></F>
        <F label="Description" span={2}><textarea value={f.description} onChange={set('description')} rows={2} className={inp} /></F>
        <F label="Quantity in stock *"><input type="number" step="any" min="0" value={f.quantityAvailable} onChange={set('quantityAvailable')} className={inp} required /></F>
        <F label="Unit"><select value={f.unit} onChange={set('unit')} className={inp}>{['kg', 'bag', 'litre', 'tonne', 'crate', 'tray', 'head', 'piece', 'box', 'bale'].map(u => <option key={u}>{u}</option>)}</select></F>
        <F label="Price per unit (ZMW) *"><input type="number" step="any" min="0" value={f.askingPrice} onChange={set('askingPrice')} className={inp} required /></F>
        <F label="Minimum order"><input type="number" step="any" min="0" value={f.minOrderQuantity} onChange={set('minOrderQuantity')} className={inp} /></F>
        <F label="Location / pick-up"><input value={f.location} onChange={set('location')} className={inp} /></F>
        <F label="Available until"><input type="date" value={f.availableUntil} onChange={set('availableUntil')} className={inp} /></F>
        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={f.deliveryAvailable} onChange={set('deliveryAvailable')} /> Delivery available</label>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={btnS}>Cancel</button><button type="submit" disabled={busy} className={btnP}>{busy ? 'Saving…' : 'Save'}</button></div>
      </form>
    </Modal>
  );
}

function StockAdjust({ l, onClose, onSaved }: { l: any; onClose: () => void; onSaved: () => void }) {
  const { toast } = useVendor();
  const [delta, setDelta] = useState('');
  const [busy, setBusy] = useState(false);
  const next = Math.max(0, num(l.quantityAvailable) + num(delta));
  return (
    <Modal title={`Adjust stock — ${l.commodity}`} onClose={onClose}>
      <p className="text-sm text-slate-300 mb-3">Current: <b>{fmt(l.quantityAvailable, 2)} {l.unit}</b>. Enter a positive number for stock received, negative for shrinkage or off-platform sales.</p>
      <input type="number" step="any" value={delta} onChange={e => setDelta(e.target.value)} className={inp} placeholder="+50 or -3" autoFocus />
      <div className="text-xs text-slate-400 mt-2">New level: {fmt(next, 2)} {l.unit}</div>
      <div className="flex justify-end gap-2 mt-4"><button onClick={onClose} className={btnS}>Cancel</button><button disabled={busy || delta === ''} onClick={async () => { setBusy(true); try { await gqlRequest(UPDATE_LISTING, { id: l.id, in: { quantityAvailable: next, status: next > 0 && lc(l.status) === 'sold' ? 'active' : undefined } }); toast('Stock updated.'); onSaved(); } catch (e: any) { toast(e.message, false); } finally { setBusy(false); } }} className={btnP}>Apply</button></div>
    </Modal>
  );
}

export function OrdersTab({ deliveries }: { deliveries?: boolean }) {
  const { toast, reload: reloadHome } = useVendor();
  const [filter, setFilter] = useState('');
  const { items, reload } = useList(ORDERS_Q, 'vendorOrders', filter ? { status: filter } : {});
  const [creating, setCreating] = useState(false);
  const [invoiceFor, setInvoiceFor] = useState<any>(null);
  const shown = deliveries ? items.filter((o: any) => o.deliveryRequired && !['cancelled'].includes(lc(o.status))) : items;
  const NEXT: Record<string, string[]> = { new: ['confirmed', 'cancelled'], confirmed: ['packed', 'out_for_delivery', 'delivered', 'cancelled'], packed: ['out_for_delivery', 'delivered'], out_for_delivery: ['delivered'], delivered: [], cancelled: [] };
  async function move(o: any, status: string) { try { await gqlRequest(UPSERT_ORDER, { id: o.id, in: { status } }); toast(`${o.orderRef} → ${title(status)}`); reload(); reloadHome(); } catch (e: any) { toast(e.message, false); } }
  async function paid(o: any) { try { await gqlRequest(UPSERT_ORDER, { id: o.id, in: { paid: true } }); toast(`${o.orderRef} marked paid.`); reload(); reloadHome(); } catch (e: any) { toast(e.message, false); } }
  return (
    <div className="space-y-4">
      <Card title={deliveries ? 'Deliveries' : 'Orders'} action={<div className="flex gap-2"><select value={filter} onChange={e => setFilter(e.target.value)} className={`${inp} w-44`}><option value="">All statuses</option>{['new', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{title(s)}</option>)}</select><button onClick={() => setCreating(true)} className={btnP}>+ Order</button></div>}>
        <Table head={['Ref / date', 'Customer', 'Items', 'Total', deliveries ? 'Deliver to' : 'Fulfilment', 'Paid', 'Status', '']} empty={deliveries ? 'No deliveries scheduled.' : 'No orders yet. Record counter sales here; confirming an order deducts stock from the linked listings.'}
          rows={shown.map((o: any) => [<div><div className="font-medium text-white">{o.orderRef}</div><div className="text-xs text-slate-500">{String(o.createdAt).slice(0, 10)} · {title(o.source)}</div></div>, <div>{clientLabel(o)}<div className="text-xs text-slate-500">{o.clientPhone}</div></div>,
            <div className="text-xs max-w-xs">{(parseJson(o.items) ?? []).map((i: any, k: number) => <div key={k}>{i.name} × {i.quantity} {i.unit} @ {fmt(i.unit_price, 2)}</div>)}</div>, <span className="tabular-nums font-semibold">{money(o.total, o.currency)}{num(o.discount) > 0 && <div className="text-[10px] text-slate-500">disc. {fmt(o.discount)}</div>}</span>,
            o.deliveryRequired ? <div className="text-xs">{o.deliveryAddress || 'address n/a'}<div className="text-slate-500">{o.deliveryDate ?? 'date to arrange'}</div></div> : 'Collection', o.paid ? '✓' : <button onClick={() => paid(o)} className="text-xs text-green-400">mark paid</button>, <Pill v={o.status} />,
            <div className="flex flex-col gap-1 text-xs">{(NEXT[lc(o.status)] ?? []).map(s => <button key={s} onClick={() => move(o, s)} className={`text-left ${s === 'cancelled' ? 'text-red-400' : 'text-teal-400'}`}>{title(s)}</button>)}{lc(o.status) === 'delivered' && !o.paid && <button onClick={() => setInvoiceFor(o)} className="text-slate-300 text-left">Invoice</button>}{lc(o.status) === 'new' && <button onClick={async () => { if (!confirmDel(o.orderRef)) return; try { await gqlRequest(DELETE_ORDER, { id: o.id }); reload(); } catch (e: any) { toast(e.message, false); } }} className="text-red-400 text-left">Delete</button>}</div>])} />
      </Card>
      {creating && <OrderForm onClose={() => setCreating(false)} onSaved={() => { setCreating(false); reload(); reloadHome(); }} />}
      {invoiceFor && <InvoiceForm existing={null} link={{ type: 'order', id: invoiceFor.id, label: invoiceFor.orderRef }} onClose={() => setInvoiceFor(null)} onSaved={() => { setInvoiceFor(null); reload(); reloadHome(); }} />}
    </div>
  );
}

function OrderForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { toast } = useVendor();
  const { items: listings } = useList(LISTINGS_Q, 'vendorListings');
  const live = useMemo(() => listings.filter((l: any) => lc(l.status) === 'active'), [listings]);
  const [client, setClient] = useState({ clientOrgId: null as string | null, clientName: '', clientPhone: '' });
  const [lines, setLines] = useState<{ listingId: string; name: string; quantity: string; unit: string; unitPrice: string }[]>([{ listingId: '', name: '', quantity: '1', unit: '', unitPrice: '' }]);
  const [f, setF] = useState({ source: 'walk_in', status: 'confirmed', discount: '0', deliveryRequired: false, deliveryAddress: '', deliveryDate: '', paid: false, notes: '' });
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<any>) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const pick = (i: number, id: string) => { const l = live.find((x: any) => x.id === id); setLines(x => x.map((y, j) => j === i ? { ...y, listingId: id, name: l ? l.commodity : y.name, unit: l ? l.unit : y.unit, unitPrice: l ? String(num(l.askingPrice)) : y.unitPrice } : y)); };
  const subtotal = lines.reduce((a, l) => a + num(l.quantity) * num(l.unitPrice), 0);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try { await gqlRequest(UPSERT_ORDER, { in: { ...clientVars(client), source: f.source, status: f.status, discount: num(f.discount), deliveryRequired: f.deliveryRequired, deliveryAddress: f.deliveryAddress, deliveryDate: f.deliveryDate || null, paid: f.paid, notes: f.notes, items: lines.filter(l => l.name.trim()).map(l => ({ listingId: l.listingId || null, name: l.name, quantity: num(l.quantity), unit: l.unit, unitPrice: num(l.unitPrice) })) } }); toast('Order recorded.'); onSaved(); } catch (err: any) { toast(err.message, false); } finally { setBusy(false); }
  }
  return (
    <Modal title="New order" onClose={onClose} wide>
      <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
        <ClientPicker value={client} onChange={setClient} />
        <div className="md:col-span-2 space-y-2">
          <div className="grid grid-cols-[1.2fr_1fr_70px_70px_100px_24px] gap-2 text-[11px] text-slate-500"><span>From catalogue</span><span>Item</span><span>Qty</span><span>Unit</span><span>Unit price</span><span /></div>
          {lines.map((l, i) => <div key={i} className="grid grid-cols-[1.2fr_1fr_70px_70px_100px_24px] gap-2"><select value={l.listingId} onChange={e => pick(i, e.target.value)} className={inp}><option value="">— custom item —</option>{live.map((x: any) => <option key={x.id} value={x.id}>{x.commodity} ({fmt(x.quantityAvailable)} {x.unit})</option>)}</select><input value={l.name} onChange={e => setLines(x => x.map((y, j) => j === i ? { ...y, name: e.target.value } : y))} className={inp} placeholder="Item" /><input type="number" step="any" value={l.quantity} onChange={e => setLines(x => x.map((y, j) => j === i ? { ...y, quantity: e.target.value } : y))} className={inp} /><input value={l.unit} onChange={e => setLines(x => x.map((y, j) => j === i ? { ...y, unit: e.target.value } : y))} className={inp} /><input type="number" step="any" value={l.unitPrice} onChange={e => setLines(x => x.map((y, j) => j === i ? { ...y, unitPrice: e.target.value } : y))} className={inp} /><button type="button" onClick={() => setLines(x => x.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400">×</button></div>)}
          <button type="button" onClick={() => setLines(x => [...x, { listingId: '', name: '', quantity: '1', unit: '', unitPrice: '' }])} className="text-xs text-teal-400">+ Add line</button>
        </div>
        <F label="Source"><select value={f.source} onChange={set('source')} className={inp}><option value="walk_in">Walk-in / phone</option><option value="marketplace">Marketplace</option><option value="voucher">Programme voucher</option></select></F>
        <F label="Status"><select value={f.status} onChange={set('status')} className={inp}>{['new', 'confirmed', 'packed', 'delivered'].map(s => <option key={s} value={s}>{title(s)}</option>)}</select></F>
        <F label="Discount (ZMW)"><input type="number" step="any" value={f.discount} onChange={set('discount')} className={inp} /></F>
        <label className="flex items-center gap-2 text-sm text-slate-300 self-end pb-2"><input type="checkbox" checked={f.deliveryRequired} onChange={set('deliveryRequired')} /> Delivery required</label>
        {f.deliveryRequired && <><F label="Delivery address"><input value={f.deliveryAddress} onChange={set('deliveryAddress')} className={inp} /></F><F label="Delivery date"><input type="date" value={f.deliveryDate} onChange={set('deliveryDate')} className={inp} /></F></>}
        <F label="Notes" span={2}><input value={f.notes} onChange={set('notes')} className={inp} /></F>
        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={f.paid} onChange={set('paid')} /> Paid</label>
        <div className="flex items-center justify-end gap-3"><span className="text-sm text-slate-300">Total <b className="text-teal-400">{money(Math.max(0, subtotal - num(f.discount)))}</b></span><button type="button" onClick={onClose} className={btnS}>Cancel</button><button type="submit" disabled={busy} className={btnP}>{busy ? 'Saving…' : 'Record order'}</button></div>
      </form>
    </Modal>
  );
}
