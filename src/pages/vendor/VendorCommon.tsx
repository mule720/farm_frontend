// ─────────────────────────────────────────────────────────────────────────────
// Shared vendor building blocks: data hook, dark-theme form controls, client
// picker, and the tabs every vendor type has (overview, clients, invoices,
// revenue, marketplace profile, settings).
// ─────────────────────────────────────────────────────────────────────────────
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { gqlRequest } from '@/lib/api';
import {
  ENSURE_PROVIDER, VENDOR_HOME, UPDATE_PROVIDER, STAFF_Q, UPSERT_STAFF, DELETE_STAFF, SERVICES_Q, UPSERT_SERVICE, DELETE_SERVICE, CERTS_Q, UPSERT_CERT, DELETE_CERT, REVIEWS_Q,
  INVOICES_Q, UPSERT_INVOICE, SET_INVOICE_STATUS, DELETE_INVOICE, CLIENTS_Q, CLIENT_SEARCH, PROVIDER_TYPES, lc, num, parseJson, arr,
} from '@/graphql/vendorQueries';
import { StatCard, RevenueChart } from './VendorWidgets';

// ─── context ─────────────────────────────────────────────────────────────────

export interface VendorCtx { provider: any; summary: any; loading: boolean; error: string; reload: () => Promise<void>; toast: (m: string, ok?: boolean) => void; businessType: string }
const Ctx = createContext<VendorCtx | null>(null);
export const useVendor = () => useContext(Ctx)!;

export function VendorProvider({ businessType, children }: { businessType: string; children: React.ReactNode }) {
  const [provider, setProvider] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const reload = useCallback(async () => {
    try {
      const r = await gqlRequest<{ myProvider: any; vendorSummary: any }>(VENDOR_HOME);
      if (!r.myProvider) { const e = await gqlRequest<{ ensureMyProvider: { provider: any } }>(ENSURE_PROVIDER); setProvider(e.ensureMyProvider.provider); const r2 = await gqlRequest<{ vendorSummary: any }>(VENDOR_HOME); setSummary(r2.vendorSummary); }
      else { setProvider(r.myProvider); setSummary(r.vendorSummary); }
      setError('');
    } catch (e: any) { setError(e?.message ?? 'Failed to load'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  const toast = useCallback((text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3500); }, []);
  return (
    <Ctx.Provider value={{ provider, summary, loading, error, reload, toast, businessType }}>
      {children}
      {msg && <div className={`fixed bottom-4 right-4 z-[60] px-4 py-2.5 rounded-xl text-sm shadow-lg border ${msg.ok ? 'bg-emerald-900 border-emerald-700 text-emerald-100' : 'bg-red-900 border-red-700 text-red-100'}`}>{msg.text}</div>}
    </Ctx.Provider>
  );
}

// ─── primitives ──────────────────────────────────────────────────────────────

export const inp = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 disabled:opacity-50';
export const btnP = 'px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-1';
export const btnS = 'px-3 py-2 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg text-sm';
export const fmt = (n: any, d = 0) => num(n).toLocaleString(undefined, { maximumFractionDigits: d });
export const money = (n: any, cur = 'ZMW') => `${cur} ${fmt(n, 2)}`;
export const title = (s: any) => String(s ?? '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
export const today = () => new Date().toISOString().slice(0, 10);
const STATUS_CLS: Record<string, string> = {
  new: 'bg-sky-900 text-sky-300', requested: 'bg-sky-900 text-sky-300', enquiry: 'bg-sky-900 text-sky-300', draft: 'bg-slate-800 text-slate-300', received: 'bg-sky-900 text-sky-300',
  quoted: 'bg-indigo-900 text-indigo-300', sent: 'bg-indigo-900 text-indigo-300', confirmed: 'bg-blue-900 text-blue-300', scheduled: 'bg-blue-900 text-blue-300', packed: 'bg-blue-900 text-blue-300',
  active: 'bg-amber-900 text-amber-300', in_progress: 'bg-amber-900 text-amber-300', processing: 'bg-amber-900 text-amber-300', out_for_delivery: 'bg-amber-900 text-amber-300', overdue: 'bg-red-900 text-red-300', pending: 'bg-amber-900 text-amber-300',
  completed: 'bg-green-900 text-green-300', delivered: 'bg-green-900 text-green-300', paid: 'bg-green-900 text-green-300', valid: 'bg-green-900 text-green-300',
  cancelled: 'bg-red-900 text-red-300', no_show: 'bg-red-900 text-red-300', void: 'bg-red-900 text-red-300', rejected: 'bg-red-900 text-red-300', expired: 'bg-red-900 text-red-300', sold_out: 'bg-slate-800 text-slate-300', suspended: 'bg-red-900 text-red-300', inactive: 'bg-slate-800 text-slate-300',
};
export const Pill = ({ v }: { v: any }) => <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[lc(v)] ?? 'bg-slate-800 text-slate-300'}`}>{title(lc(v))}</span>;

export function Card({ title: t, action, children, className = '' }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`bg-slate-900 rounded-xl border border-slate-800 p-5 ${className}`}>{(t || action) && <div className="flex items-center justify-between gap-3 mb-4"><h3 className="text-sm font-semibold text-slate-300">{t}</h3>{action}</div>}{children}</section>;
}
export function Modal({ title: t, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-slate-900 rounded-2xl border border-slate-700 p-6 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-white">{t}</h3><button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none" aria-label="Close">×</button></div>
        {children}
      </div>
    </div>
  );
}
export function F({ label, children, span }: { label: string; children: React.ReactNode; span?: number }) {
  return <label className={`text-xs text-slate-400 ${span ? `md:col-span-${span}` : ''}`}>{label}<div className="mt-1">{children}</div></label>;
}
export function Table({ head, rows, empty }: { head: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-slate-500 text-center py-8">{empty}</p>;
  return (
    <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead><tr className="border-b border-slate-800">{head.map(h => <th key={h} className="text-left px-3 py-2 text-slate-400 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-slate-800/70 hover:bg-slate-800/40">{r.map((c, j) => <td key={j} className="px-3 py-2.5 text-slate-200 align-top">{c}</td>)}</tr>)}</tbody>
    </table></div>
  );
}
export function useList<T = any>(query: string, key: string, vars: any = {}) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const v = JSON.stringify(vars);
  const reload = useCallback(async () => { setLoading(true); try { const r = await gqlRequest<any>(query, JSON.parse(v)); setItems(r[key] ?? []); } catch { /* toast elsewhere */ } finally { setLoading(false); } }, [query, key, v]);
  useEffect(() => { reload(); }, [reload]);
  return { items, loading, reload, setItems };
}
export function confirmDel(what: string) { return window.confirm(`Delete ${what}? This cannot be undone.`); }

/** Client picker: a platform organisation (search) or a walk-in name + phone. Returns {clientOrgId, clientName, clientPhone}. */
export function ClientPicker({ value, onChange }: { value: { clientOrgId?: string | null; clientName: string; clientPhone: string }; onChange: (v: { clientOrgId?: string | null; clientName: string; clientPhone: string }) => void }) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<any[]>([]);
  useEffect(() => { if (q.trim().length < 2) { setHits([]); return; } const t = setTimeout(() => gqlRequest<{ vendorClientSearch: any[] }>(CLIENT_SEARCH, { s: q }).then(r => setHits(r.vendorClientSearch)).catch(() => {}), 250); return () => clearTimeout(t); }, [q]);
  return (
    <div className="grid md:grid-cols-2 gap-2 md:col-span-2">
      <div className="relative">
        <input value={value.clientOrgId ? value.clientName : q} onChange={e => { setQ(e.target.value); if (value.clientOrgId) onChange({ ...value, clientOrgId: null, clientName: '' }); }} placeholder="Search platform client (farm / coop)…" className={inp} />
        {value.clientOrgId && <button type="button" onClick={() => { onChange({ clientOrgId: null, clientName: '', clientPhone: value.clientPhone }); setQ(''); }} className="absolute right-2 top-2 text-xs text-slate-400">clear</button>}
        {hits.length > 0 && !value.clientOrgId && <ul className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg max-h-40 overflow-y-auto">{hits.map(h => <li key={h.id}><button type="button" onClick={() => { onChange({ clientOrgId: h.id, clientName: h.name, clientPhone: value.clientPhone }); setHits([]); }} className="w-full text-left px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700">{h.name} <span className="text-slate-500 text-xs">{h.district}{h.businessType && ` · ${title(h.businessType)}`}</span></button></li>)}</ul>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input value={value.clientOrgId ? '' : value.clientName} disabled={!!value.clientOrgId} onChange={e => onChange({ ...value, clientName: e.target.value })} placeholder={value.clientOrgId ? 'Platform client selected' : 'or walk-in name *'} className={inp} />
        <input value={value.clientPhone} onChange={e => onChange({ ...value, clientPhone: e.target.value })} placeholder="Phone" className={inp} />
      </div>
    </div>
  );
}
export const clientVars = (c: { clientOrgId?: string | null; clientName: string; clientPhone: string }) => ({ clientOrgId: c.clientOrgId || null, clientName: c.clientName || null, clientPhone: c.clientPhone || null });
export const clientLabel = (r: any) => r.organization?.name ?? r.clientOrgName ?? r.clientName ?? 'Walk-in';

// ─── Overview ────────────────────────────────────────────────────────────────

export function OverviewTab({ icon, heading, stats, quick, children }: { icon: string; heading: string; stats: { icon: string; label: string; value: string | number; sub?: string; accent?: string }[]; quick: { icon: string; label: string; tab: string }[]; children?: React.ReactNode }) {
  const { provider, summary, businessType } = useVendor();
  const series: [string, number][] = parseJson(summary?.revenueSeries) ?? [];
  const byKind: Record<string, number> = parseJson(summary?.revenueByKind) ?? {};
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-bold text-white">{icon} {heading}</h1><p className="text-slate-400 text-sm">{provider?.name} · {provider?.district || 'District not set'} · {title(businessType)}{provider?.isVerified ? ' · ✓ verified' : ''}</p></div>
        <div className="flex items-center gap-2 text-xs"><Pill v={provider?.status} />{summary?.reviewCount > 0 && <span className="text-amber-400">★ {num(summary.avgRating).toFixed(1)} ({summary.reviewCount})</span>}</div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} sub={s.sub} accentColor={s.accent ?? 'text-teal-400'} />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card title="Revenue received (last 6 months)" className="lg:col-span-2" action={<div className="text-right"><div className="text-lg font-bold text-teal-400">{money(summary?.revenueYtd)}</div><div className="text-xs text-slate-400">year to date · {money(summary?.revenue30d)} last 30 days</div></div>}>
          {series.some(s => s[1] > 0) ? <RevenueChart data={series.map(s => s[1])} months={series.map(s => s[0].slice(5))} color="#14b8a6" /> : <p className="text-sm text-slate-500 py-6 text-center">No paid invoices, bookings or orders yet. Revenue appears here as payments are recorded.</p>}
          {Object.keys(byKind).length > 0 && <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-400">{Object.entries(byKind).map(([k, v]) => <span key={k}>{title(k)}: <span className="text-slate-200">{money(v)}</span></span>)}</div>}
        </Card>
        <Card title="Quick actions"><QuickGrid quick={quick} />
          <div className="mt-4 text-xs text-slate-400 space-y-1">
            {summary?.unpaidInvoices > 0 && <div>🧾 {summary.unpaidInvoices} unpaid invoice(s) · {money(summary.unpaidAmount)}</div>}
            {summary?.followUpsDue > 0 && <div>🔔 {summary.followUpsDue} follow-up(s) due within 7 days</div>}
            {summary?.maintenanceDue > 0 && <div>🔧 {summary.maintenanceDue} machine(s) due for service</div>}
            {summary?.lowStock > 0 && <div>📦 {summary.lowStock} listing(s) low on stock</div>}
            {!provider?.phone && <div>☎️ Add a phone number in Settings so customers can reach you</div>}
          </div>
        </Card>
      </div>
      {children}
    </div>
  );
}
const TabCtx = createContext<(t: string) => void>(() => {});
export const SetTabProvider = TabCtx.Provider;
function QuickGrid({ quick }: { quick: { icon: string; label: string; tab: string }[] }) {
  const setTab = useContext(TabCtx);
  return <div className="grid grid-cols-2 gap-2">{quick.map(q => <button key={q.label} onClick={() => setTab(q.tab)} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-left text-sm text-slate-200"><span>{q.icon}</span>{q.label}</button>)}</div>;
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export function ClientsTab() {
  const { items, loading } = useList(CLIENTS_Q, 'vendorClients');
  return (
    <Card title={`Clients (${items.length})`}>
      {loading ? <p className="text-sm text-slate-500">Loading…</p> : (
        <Table head={['Client', 'Type', 'District', 'Interactions', 'Last', 'Total value', 'Outstanding']} empty="No clients yet — they appear as you record bookings, appointments, jobs, orders or supplies."
          rows={items.map((c: any) => [<div><div className="font-medium text-white">{c.name}</div><div className="text-xs text-slate-500">{c.phone || (c.orgId ? 'platform account' : 'walk-in')}</div></div>, c.businessType ? title(c.businessType) : '—', c.district || '—',
            <span>{c.interactions} <span className="text-xs text-slate-500">{c.kinds.join(', ')}</span></span>, c.lastDate ?? '—', <span className="tabular-nums">{money(c.totalValue)}</span>, <span className={`tabular-nums ${c.outstanding > 0 ? 'text-amber-400' : 'text-slate-500'}`}>{money(c.outstanding)}</span>])} />
      )}
    </Card>
  );
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export function InvoicesTab() {
  const { toast, reload: reloadHome, provider } = useVendor();
  const { items, reload } = useList(INVOICES_Q, 'vendorInvoices');
  const [editing, setEditing] = useState<any | null | 'new'>(null);
  const [view, setView] = useState<any>(null);
  const cur = provider?.currency ?? 'ZMW';
  const [paying, setPaying] = useState<{ id: string; method: string } | null>(null);
  async function setStatus(inv: any, s: string, m: string | null = null) {
    try { await gqlRequest(SET_INVOICE_STATUS, { id: inv.id, s, m }); toast(`Invoice ${inv.invoiceRef} marked ${s}.`); setPaying(null); reload(); reloadHome(); } catch (e: any) { toast(e.message, false); }
  }
  const unpaid = items.filter((i: any) => ['sent', 'overdue'].includes(i.status));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🧾" label="Invoices" value={items.length} />
        <StatCard icon="⏳" label="Awaiting payment" value={unpaid.length} sub={money(unpaid.reduce((a: number, i: any) => a + num(i.total), 0), cur)} accentColor="text-amber-400" />
        <StatCard icon="⚠️" label="Overdue" value={items.filter((i: any) => i.status === 'overdue').length} accentColor="text-red-400" />
        <StatCard icon="✅" label="Paid" value={items.filter((i: any) => i.status === 'paid').length} sub={money(items.filter((i: any) => i.status === 'paid').reduce((a: number, i: any) => a + num(i.total), 0), cur)} accentColor="text-green-400" />
      </div>
      <Card title="Invoices" action={<button onClick={() => setEditing('new')} className={btnP}>+ New invoice</button>}>
        <Table head={['Ref', 'Client', 'Issued', 'Due', 'For', 'Total', 'Status', '']} empty="No invoices yet. Create one here, or from a booking, appointment, job or order."
          rows={items.map((i: any) => [<button onClick={() => setView(i)} className="text-teal-400 hover:underline">{i.invoiceRef}</button>, clientLabel(i), i.issuedOn, i.dueOn ?? '—', i.linkRef || '—', <span className="tabular-nums font-semibold">{money(i.total, i.currency)}</span>, <Pill v={i.status} />,
            <div className="flex gap-1 flex-wrap">
              {i.status === 'draft' && <><button onClick={() => setStatus(i, 'sent')} className="text-xs text-sky-400">Send</button><button onClick={() => setEditing(i)} className="text-xs text-slate-300">Edit</button><button onClick={async () => { if (!confirmDel(i.invoiceRef)) return; try { await gqlRequest(DELETE_INVOICE, { id: i.id }); reload(); } catch (e: any) { toast(e.message, false); } }} className="text-xs text-red-400">Delete</button></>}
              {['sent', 'overdue'].includes(i.status) && (paying?.id === i.id
                ? <><select value={paying.method} onChange={e => setPaying({ id: i.id, method: e.target.value })} className={`${inp} w-32 py-1`} aria-label="Payment method">{['cash', 'mobile_money', 'bank', 'card', 'voucher'].map(m => <option key={m} value={m}>{title(m)}</option>)}</select><button onClick={() => setStatus(i, 'paid', paying.method)} className="text-xs text-green-400">Confirm paid</button><button onClick={() => setPaying(null)} className="text-xs text-slate-400">Cancel</button></>
                : <><button onClick={() => setPaying({ id: i.id, method: 'cash' })} className="text-xs text-green-400">Mark paid</button><button onClick={() => setStatus(i, 'void')} className="text-xs text-red-400">Void</button></>)}
            </div>])} />
      </Card>
      {editing && <InvoiceForm existing={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); reloadHome(); }} />}
      {view && <InvoiceView inv={view} providerName={provider?.name} onClose={() => setView(null)} />}
    </div>
  );
}
export function InvoiceForm({ existing, link, onClose, onSaved }: { existing: any | null; link?: { type: string; id: string; label: string }; onClose: () => void; onSaved: () => void }) {
  const { toast } = useVendor();
  const [client, setClient] = useState({ clientOrgId: existing?.clientOrg?.id ?? null, clientName: existing?.clientName ?? '', clientPhone: existing?.clientPhone ?? '' });
  const [items, setItems] = useState<{ description: string; quantity: string; unit_price: string }[]>(existing ? (parseJson(existing.items) ?? []).map((i: any) => ({ description: i.description, quantity: String(i.quantity), unit_price: String(i.unit_price) })) : link ? [] : [{ description: '', quantity: '1', unit_price: '' }]);
  const [tax, setTax] = useState(existing ? String(num(existing.tax)) : '0');
  const [due, setDue] = useState(existing?.dueOn ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [busy, setBusy] = useState(false);
  const subtotal = items.reduce((a, i) => a + num(i.quantity) * num(i.unit_price), 0);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const inItems = items.filter(i => i.description.trim()).map(i => ({ description: i.description, quantity: num(i.quantity), unitPrice: num(i.unit_price) }));
      await gqlRequest(UPSERT_INVOICE, { id: existing?.id ?? null, in: { ...clientVars(client), items: link && !inItems.length ? null : inItems, tax: num(tax), dueOn: due || null, notes, linkType: link?.type ?? null, linkId: link?.id ?? null } });
      toast('Invoice saved.'); onSaved();
    } catch (err: any) { toast(err.message, false); } finally { setBusy(false); }
  }
  return (
    <Modal title={existing ? `Edit ${existing.invoiceRef}` : link ? `Invoice for ${link.label}` : 'New invoice'} onClose={onClose} wide>
      <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
        {!link && <ClientPicker value={client} onChange={setClient} />}
        {link && <p className="md:col-span-2 text-xs text-slate-400">Client and lines are taken from {link.label}. Add lines below only to override.</p>}
        <div className="md:col-span-2 space-y-2">
          <div className="grid grid-cols-[1fr_80px_110px_24px] gap-2 text-[11px] text-slate-500"><span>Description</span><span>Qty</span><span>Unit price</span><span /></div>
          {items.map((it, i) => <div key={i} className="grid grid-cols-[1fr_80px_110px_24px] gap-2"><input value={it.description} onChange={e => setItems(x => x.map((y, j) => j === i ? { ...y, description: e.target.value } : y))} className={inp} placeholder="Line description" /><input type="number" step="any" value={it.quantity} onChange={e => setItems(x => x.map((y, j) => j === i ? { ...y, quantity: e.target.value } : y))} className={inp} /><input type="number" step="any" value={it.unit_price} onChange={e => setItems(x => x.map((y, j) => j === i ? { ...y, unit_price: e.target.value } : y))} className={inp} /><button type="button" onClick={() => setItems(x => x.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400">×</button></div>)}
          <button type="button" onClick={() => setItems(x => [...x, { description: '', quantity: '1', unit_price: '' }])} className="text-xs text-teal-400">+ Add line</button>
        </div>
        <F label="Tax / VAT amount"><input type="number" step="any" value={tax} onChange={e => setTax(e.target.value)} className={inp} /></F>
        <F label="Due date"><input type="date" value={due} onChange={e => setDue(e.target.value)} className={inp} /></F>
        <F label="Notes / payment details" span={2}><input value={notes} onChange={e => setNotes(e.target.value)} className={inp} placeholder="e.g. Pay to MTN MoMo 097… or bank details" /></F>
        <div className="md:col-span-2 flex items-center justify-between"><div className="text-sm text-slate-300">Subtotal <span className="font-semibold text-white">{money(subtotal)}</span> · Total <span className="font-semibold text-teal-400">{money(subtotal + num(tax))}</span></div><div className="flex gap-2"><button type="button" onClick={onClose} className={btnS}>Cancel</button><button type="submit" disabled={busy} className={btnP}>{busy ? 'Saving…' : 'Save draft'}</button></div></div>
      </form>
    </Modal>
  );
}
function InvoiceView({ inv, providerName, onClose }: { inv: any; providerName: string; onClose: () => void }) {
  const items = parseJson(inv.items) ?? [];
  return (
    <Modal title={inv.invoiceRef} onClose={onClose}>
      <div className="text-sm text-slate-300 space-y-3">
        <div className="flex justify-between"><div><div className="text-white font-semibold">{providerName}</div><div className="text-xs text-slate-500">Invoice to</div><div>{clientLabel(inv)}</div>{inv.clientPhone && <div className="text-xs text-slate-500">{inv.clientPhone}</div>}</div><div className="text-right text-xs text-slate-400"><div>Issued {inv.issuedOn}</div><div>Due {inv.dueOn ?? '—'}</div><div className="mt-1"><Pill v={inv.status} /></div>{inv.linkRef && <div className="mt-1">Ref {inv.linkRef}</div>}</div></div>
        <table className="w-full text-xs"><thead><tr className="text-slate-500 border-b border-slate-800"><th className="text-left py-1">Description</th><th className="text-right">Qty</th><th className="text-right">Unit</th><th className="text-right">Line</th></tr></thead><tbody>{items.map((i: any, k: number) => <tr key={k} className="border-b border-slate-800/60"><td className="py-1.5">{i.description}</td><td className="text-right">{i.quantity}</td><td className="text-right">{fmt(i.unit_price, 2)}</td><td className="text-right">{fmt(i.line_total ?? i.quantity * i.unit_price, 2)}</td></tr>)}</tbody></table>
        <div className="text-right space-y-0.5"><div>Subtotal {money(inv.subtotal, inv.currency)}</div><div>Tax {money(inv.tax, inv.currency)}</div><div className="text-white font-bold text-base">Total {money(inv.total, inv.currency)}</div>{inv.paidOn && <div className="text-green-400 text-xs">Paid {inv.paidOn} · {title(inv.paymentMethod)}</div>}</div>
        {inv.notes && <p className="text-xs text-slate-400 border-t border-slate-800 pt-2">{inv.notes}</p>}
        <div className="flex justify-end gap-2"><button onClick={() => window.print()} className={btnS}>Print</button><button onClick={onClose} className={btnP}>Close</button></div>
      </div>
    </Modal>
  );
}

// ─── Revenue ─────────────────────────────────────────────────────────────────

export function RevenueTab() {
  const { summary, provider } = useVendor();
  const { items: invoices } = useList(INVOICES_Q, 'vendorInvoices');
  const series: [string, number][] = parseJson(summary?.revenueSeries) ?? [];
  const byKind: Record<string, number> = parseJson(summary?.revenueByKind) ?? {};
  const paid = invoices.filter((i: any) => i.status === 'paid');
  const cur = 'ZMW';
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💰" label="Last 30 days" value={money(summary?.revenue30d, cur)} accentColor="text-teal-400" />
        <StatCard icon="📈" label="Year to date" value={money(summary?.revenueYtd, cur)} accentColor="text-green-400" />
        <StatCard icon="⏳" label="Outstanding" value={money(summary?.unpaidAmount, cur)} sub={`${summary?.unpaidInvoices ?? 0} invoices`} accentColor="text-amber-400" />
        <StatCard icon="👥" label="Paying clients" value={summary?.clients ?? 0} />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card title="Monthly revenue received" className="lg:col-span-2">{series.some(s => s[1] > 0) ? <RevenueChart data={series.map(s => s[1])} months={series.map(s => s[0].slice(5))} color="#14b8a6" /> : <p className="text-sm text-slate-500 py-6 text-center">Nothing received yet.</p>}
          <table className="w-full text-xs mt-3"><tbody>{series.map(s => <tr key={s[0]} className="border-t border-slate-800"><td className="py-1 text-slate-400">{s[0]}</td><td className="py-1 text-right tabular-nums text-slate-200">{money(s[1], cur)}</td></tr>)}</tbody></table></Card>
        <Card title="By source">{Object.keys(byKind).length ? <ul className="space-y-2 text-sm">{Object.entries(byKind).sort((a, b) => b[1] - a[1]).map(([k, v]) => <li key={k} className="flex justify-between"><span className="text-slate-300">{title(k)}</span><span className="tabular-nums text-white">{money(v, cur)}</span></li>)}</ul> : <p className="text-sm text-slate-500">—</p>}
          <p className="text-[11px] text-slate-500 mt-4">Revenue counts money actually received: paid invoices, plus paid appointments, completed-and-paid hire, paid jobs and paid orders that were not invoiced separately.</p></Card>
      </div>
      <Card title="Recent payments"><Table head={['Date', 'Invoice', 'Client', 'Method', 'Amount']} empty="No payments recorded yet." rows={paid.slice(0, 20).map((i: any) => [i.paidOn, i.invoiceRef, clientLabel(i), title(i.paymentMethod), <span className="tabular-nums">{money(i.total, i.currency)}</span>])} /></Card>
    </div>
  );
}

// ─── Marketplace profile: services, staff, certifications, reviews ───────────

export function ServicesManager({ heading = 'Services & prices', hint }: { heading?: string; hint?: string }) {
  const { toast } = useVendor();
  const { items, reload } = useList(SERVICES_Q, 'myServices');
  const [editing, setEditing] = useState<any | null | 'new'>(null);
  const PM = [['fixed', 'Fixed price'], ['per_unit', 'Per unit'], ['per_ha', 'Per hectare'], ['per_head', 'Per head / animal'], ['per_hour', 'Per hour'], ['per_day', 'Per day'], ['per_km', 'Per km'], ['negotiable', 'Negotiable / quote'], ['free', 'Free']];
  return (
    <Card title={`${heading} (${items.length})`} action={<button onClick={() => setEditing('new')} className={btnP}>+ Add</button>}>
      {hint && <p className="text-xs text-slate-500 mb-3">{hint}</p>}
      <Table head={['Service / product', 'Category', 'Pricing', 'Lead time', 'Available', '']} empty="Nothing listed yet. What you add here is shown on your public marketplace profile."
        rows={items.map((s: any) => [<div><div className="font-medium text-white">{s.name}</div>{s.description && <div className="text-xs text-slate-500 max-w-md">{s.description}</div>}</div>, s.category || '—',
          <span>{s.price != null ? `${s.currency} ${fmt(s.price, 2)}${s.priceMax ? ` – ${fmt(s.priceMax, 2)}` : ''} ` : ''}<span className="text-xs text-slate-400">{PM.find(p => p[0] === lc(s.pricingModel))?.[1]}{s.unitLabel && ` · ${s.unitLabel}`}</span></span>, s.leadTimeDays ? `${s.leadTimeDays} d` : 'Immediate', s.isAvailable ? '✓' : '—',
          <div className="flex gap-2"><button onClick={() => setEditing(s)} className="text-xs text-slate-300">Edit</button><button onClick={async () => { if (!confirmDel(s.name)) return; try { await gqlRequest(DELETE_SERVICE, { id: s.id }); reload(); } catch (e: any) { toast(e.message, false); } }} className="text-xs text-red-400">Delete</button></div>])} />
      {editing && <SimpleForm title={editing === 'new' ? 'Add service / product' : 'Edit'} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} mutation={UPSERT_SERVICE} id={editing === 'new' ? null : editing.id}
        fields={[['name', 'Name *', 'text'], ['category', 'Category', 'text'], ['pricingModel', 'Pricing model', 'select', PM], ['price', 'Price', 'number'], ['priceMax', 'Price max (range)', 'number'], ['unitLabel', 'Unit label (e.g. 50 kg bag)', 'text'], ['leadTimeDays', 'Lead time (days)', 'number'], ['isAvailable', 'Available', 'checkbox'], ['description', 'Description', 'textarea']]}
        initial={editing === 'new' ? { pricingModel: 'negotiable', isAvailable: true } : { ...editing, pricingModel: lc(editing.pricingModel) }} />}
    </Card>
  );
}
export function StaffManager() {
  const { toast } = useVendor();
  const { items, reload } = useList(STAFF_Q, 'myStaff');
  const [editing, setEditing] = useState<any | null | 'new'>(null);
  const ROLES = [['owner', 'Owner / Director'], ['manager', 'Branch Manager'], ['vet_officer', 'Veterinary Officer'], ['agronomist', 'Agronomist'], ['sales_rep', 'Sales Representative'], ['technician', 'Technician'], ['driver', 'Driver / Operator'], ['other', 'Other']];
  return (
    <Card title={`Team (${items.length})`} action={<button onClick={() => setEditing('new')} className={btnP}>+ Add person</button>}>
      <Table head={['Name', 'Role', 'Phone', 'Licence', 'Active', '']} empty="No team members yet. Vet officers, operators and drivers added here can be assigned to appointments and jobs."
        rows={items.map((s: any) => [<span className="font-medium text-white">{s.name}</span>, ROLES.find(r => r[0] === lc(s.role))?.[1] ?? title(lc(s.role)), s.phone || '—', s.licenceNo || '—', s.active ? '✓' : '—',
          <div className="flex gap-2"><button onClick={() => setEditing(s)} className="text-xs text-slate-300">Edit</button><button onClick={async () => { if (!confirmDel(s.name)) return; try { await gqlRequest(DELETE_STAFF, { id: s.id }); reload(); } catch (e: any) { toast(e.message, false); } }} className="text-xs text-red-400">Remove</button></div>])} />
      {editing && <SimpleForm title={editing === 'new' ? 'Add team member' : 'Edit team member'} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} mutation={UPSERT_STAFF} id={editing === 'new' ? null : editing.id}
        fields={[['name', 'Full name *', 'text'], ['role', 'Role', 'select', ROLES], ['phone', 'Phone', 'text'], ['email', 'Email', 'text'], ['licenceNo', 'Licence / registration no.', 'text'], ['active', 'Active', 'checkbox'], ['bio', 'Bio', 'textarea']]}
        initial={editing === 'new' ? { role: 'technician', active: true } : { ...editing, role: lc(editing.role) }} />}
    </Card>
  );
}
export function CertificationsManager() {
  const { toast } = useVendor();
  const { items, reload } = useList(CERTS_Q, 'myCertifications');
  const [editing, setEditing] = useState<any | null | 'new'>(null);
  return (
    <Card title={`Certifications & licences (${items.length})`} action={<button onClick={() => setEditing('new')} className={btnP}>+ Add</button>}>
      <Table head={['Certificate', 'Issued by', 'Number', 'Expires', 'Status', 'Verified', '']} empty="Add SCCI, ZABS, VRAZ, ZEMA or other licences — buyers and programmes look for them."
        rows={items.map((c: any) => [<span className="font-medium text-white">{c.name}</span>, c.issuingBody || '—', c.certNumber || '—', c.expiryDate ?? '—', <Pill v={c.status} />, c.verified ? '✓ platform' : '—',
          <div className="flex gap-2"><button onClick={() => setEditing(c)} className="text-xs text-slate-300">Edit</button><button onClick={async () => { if (!confirmDel(c.name)) return; try { await gqlRequest(DELETE_CERT, { id: c.id }); reload(); } catch (e: any) { toast(e.message, false); } }} className="text-xs text-red-400">Delete</button></div>])} />
      {editing && <SimpleForm title="Certification" onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} mutation={UPSERT_CERT} id={editing === 'new' ? null : editing.id}
        fields={[['name', 'Certificate name *', 'text'], ['issuingBody', 'Issuing body', 'text'], ['certNumber', 'Certificate number', 'text'], ['issuedDate', 'Issued', 'date'], ['expiryDate', 'Expires', 'date'], ['documentUrl', 'Document link', 'text']]}
        initial={editing === 'new' ? {} : editing} />}
    </Card>
  );
}
export function ReviewsPanel() {
  const { items } = useList(REVIEWS_Q, 'myProviderReviews');
  return (
    <Card title={`Customer reviews (${items.length})`}>
      {!items.length ? <p className="text-sm text-slate-500">No reviews yet. Customers can review you after a booking or appointment; reviews are published after platform moderation.</p> : (
        <ul className="divide-y divide-slate-800 text-sm">{items.map((r: any) => <li key={r.id} className="py-2"><div className="flex justify-between"><span className="text-amber-400">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} <span className="text-white ml-1">{r.title}</span></span><span className="text-xs text-slate-500">{r.organization?.name} · {String(r.createdAt).slice(0, 10)} · {r.approved ? 'published' : 'awaiting moderation'}</span></div>{r.body && <p className="text-slate-300 text-xs mt-1">{r.body}</p>}</li>)}</ul>
      )}
    </Card>
  );
}
export function MarketplaceTab({ servicesHeading, servicesHint, extra }: { servicesHeading?: string; servicesHint?: string; extra?: React.ReactNode }) {
  const { provider } = useVendor();
  return (
    <div className="space-y-6">
      <Card title="Public marketplace profile">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1 min-w-[240px]"><div className="text-lg font-bold text-white">{provider?.name}</div><div className="text-sm text-slate-300">{provider?.tagline || <span className="text-slate-500">No tagline yet — add one in Settings</span>}</div><div className="text-xs text-slate-500 mt-1">{title(lc(provider?.providerType))} · {provider?.district || 'no district'} · serves {arr(provider?.coverageDistricts).join(', ') || '—'}{provider?.mobileService && ' · comes to the farm'}{provider?.emergencyAvailable && ' · emergency calls'}</div>{provider?.description && <p className="text-sm text-slate-400 mt-2 max-w-2xl">{provider.description}</p>}</div>
          <div className="text-right text-xs text-slate-400"><Pill v={provider?.status} /><div className="mt-1">{provider?.isVerified ? '✓ Verified by AGRINUXES' : 'Not yet verified — verification is done by platform admins after checking certifications'}</div><div>★ {num(provider?.avgRating).toFixed(1)} · {provider?.reviewCount ?? 0} reviews · {provider?.bookingCount ?? 0} bookings</div></div>
        </div>
        <p className="text-[11px] text-slate-500 mt-3">Farmers and buyers find you in the marketplace directory by type, district and search. Everything below is public.</p>
      </Card>
      <ServicesManager heading={servicesHeading} hint={servicesHint} />
      {extra}
      <CertificationsManager />
      <ReviewsPanel />
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function SettingsTab() {
  const { provider, reload, toast } = useVendor();
  const [types, setTypes] = useState<[string, string][]>([]);
  const [f, setF] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { gqlRequest<{ providerTypeChoices: any }>(PROVIDER_TYPES).then(r => setTypes(parseJson(r.providerTypeChoices))).catch(() => {}); }, []);
  useEffect(() => { if (provider && !f) setF({ name: provider.name ?? '', providerType: lc(provider.providerType), tagline: provider.tagline ?? '', description: provider.description ?? '', phone: provider.phone ?? '', whatsapp: provider.whatsapp ?? '', email: provider.email ?? '', website: provider.website ?? '', district: provider.district ?? '', town: provider.town ?? '', address: provider.address ?? '', coverage: arr(provider.coverageDistricts).join(', '), serviceHours: provider.serviceHours ?? '', mobileService: !!provider.mobileService, emergencyAvailable: !!provider.emergencyAvailable, specialties: arr(provider.specialties).join(', '), yearEstablished: provider.yearEstablished ?? '', businessRegNo: provider.businessRegNo ?? '', taxId: provider.taxId ?? '' }); }, [provider, f]);
  if (!f) return null;
  const set = (k: string) => (e: React.ChangeEvent<any>) => setF((x: any) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const list = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try { await gqlRequest(UPDATE_PROVIDER, { in: { ...f, coverage: undefined, coverageDistricts: list(f.coverage), specialties: list(f.specialties), yearEstablished: f.yearEstablished ? Number(f.yearEstablished) : null } }); toast('Business profile saved.'); reload(); } catch (err: any) { toast(err.message, false); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-6">
      <Card title="Business profile">
        <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
          <F label="Business name *"><input value={f.name} onChange={set('name')} className={inp} required /></F>
          <F label="Marketplace category"><select value={f.providerType} onChange={set('providerType')} className={inp}>{types.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></F>
          <F label="Tagline" span={2}><input value={f.tagline} onChange={set('tagline')} className={inp} placeholder="One line customers see first" /></F>
          <F label="Description" span={2}><textarea value={f.description} onChange={set('description')} rows={3} className={inp} /></F>
          <F label="Phone"><input value={f.phone} onChange={set('phone')} className={inp} /></F><F label="WhatsApp"><input value={f.whatsapp} onChange={set('whatsapp')} className={inp} /></F>
          <F label="Email"><input value={f.email} onChange={set('email')} className={inp} /></F><F label="Website"><input value={f.website} onChange={set('website')} className={inp} /></F>
          <F label="District"><input value={f.district} onChange={set('district')} className={inp} /></F><F label="Town"><input value={f.town} onChange={set('town')} className={inp} /></F>
          <F label="Address" span={2}><input value={f.address} onChange={set('address')} className={inp} /></F>
          <F label="Districts served (comma-separated)" span={2}><input value={f.coverage} onChange={set('coverage')} className={inp} placeholder="Chongwe, Kafue, Chilanga" /></F>
          <F label="Specialties (comma-separated)" span={2}><input value={f.specialties} onChange={set('specialties')} className={inp} placeholder="Poultry, dairy, maize seed…" /></F>
          <F label="Service hours"><input value={f.serviceHours} onChange={set('serviceHours')} className={inp} placeholder="Mon-Fri 08:00-17:00" /></F><F label="Year established"><input type="number" value={f.yearEstablished} onChange={set('yearEstablished')} className={inp} /></F>
          <F label="Business registration no."><input value={f.businessRegNo} onChange={set('businessRegNo')} className={inp} /></F><F label="TPIN / tax id"><input value={f.taxId} onChange={set('taxId')} className={inp} /></F>
          <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={f.mobileService} onChange={set('mobileService')} /> We travel to the farm</label>
          <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={f.emergencyAvailable} onChange={set('emergencyAvailable')} /> Emergency call-outs available</label>
          <div className="md:col-span-2 flex justify-end"><button type="submit" disabled={busy} className={btnP}>{busy ? 'Saving…' : 'Save profile'}</button></div>
        </form>
      </Card>
      <StaffManager />
    </div>
  );
}

// ─── Generic small form ──────────────────────────────────────────────────────

type FieldDef = [string, string, 'text' | 'number' | 'date' | 'time' | 'select' | 'checkbox' | 'textarea', string[][]?];
export function SimpleForm({ title: t, fields, initial, mutation, id, onClose, onSaved, extraVars, wide }: { title: string; fields: FieldDef[]; initial: any; mutation: string; id: string | null; onClose: () => void; onSaved: () => void; extraVars?: any; wide?: boolean }) {
  const { toast } = useVendor();
  const [f, setF] = useState<any>(() => Object.fromEntries(fields.map(([k, , type]) => [k, initial?.[k] ?? (type === 'checkbox' ? false : '')])));
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const input: any = {};
    for (const [k, , type] of fields) { const v = f[k]; input[k] = type === 'number' ? (v === '' || v == null ? null : Number(v)) : type === 'checkbox' ? !!v : (v === '' ? null : v); }
    try { await gqlRequest(mutation, { id, in: { ...input, ...(extraVars ?? {}) } }); toast('Saved.'); onSaved(); } catch (err: any) { toast(err.message, false); } finally { setBusy(false); }
  }
  return (
    <Modal title={t} onClose={onClose} wide={wide}>
      <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
        {fields.map(([k, label, type, opts]) => type === 'checkbox' ? <label key={k} className="flex items-center gap-2 text-sm text-slate-300 self-end pb-2"><input type="checkbox" checked={!!f[k]} onChange={e => setF({ ...f, [k]: e.target.checked })} /> {label}</label>
          : <F key={k} label={label} span={type === 'textarea' ? 2 : undefined}>{type === 'select' ? <select value={f[k] ?? ''} onChange={e => setF({ ...f, [k]: e.target.value })} className={inp}>{(opts ?? []).map(o => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>
            : type === 'textarea' ? <textarea value={f[k] ?? ''} onChange={e => setF({ ...f, [k]: e.target.value })} rows={2} className={inp} />
            : <input type={type} step={type === 'number' ? 'any' : undefined} value={f[k] ?? ''} onChange={e => setF({ ...f, [k]: e.target.value })} className={inp} required={label.endsWith('*')} />}</F>)}
        <div className="md:col-span-2 flex justify-end gap-2"><button type="button" onClick={onClose} className={btnS}>Cancel</button><button type="submit" disabled={busy} className={btnP}>{busy ? 'Saving…' : 'Save'}</button></div>
      </form>
    </Modal>
  );
}
