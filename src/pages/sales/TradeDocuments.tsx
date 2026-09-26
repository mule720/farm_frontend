// ─────────────────────────────────────────────────────────────────────────────
// Trade & Export Documents
// Buyers → trade contracts → export document pack (invoice, packing list,
// phytosanitary / veterinary certificate, certificate of origin, customs).
// PDFs are generated server-side (reportlab) and served from /media.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, Plus, Download, RefreshCw, Loader2, CheckCircle2, AlertTriangle, Ship, Users, Trash2, X, ArrowLeft, FileCheck2 } from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import {
  TRADE_HOME_QUERY, CHECKLIST_QUERY, CREATE_BUYER_MUTATION, CREATE_CONTRACT_MUTATION, UPDATE_CONTRACT_STATUS_MUTATION,
  UPDATE_CONTRACT_MUTATION, CONTRACT_PDF_MUTATION, CREATE_DOC_MUTATION, UPDATE_DOC_MUTATION, DOC_PDF_MUTATION,
  EXPORT_PACK_MUTATION, DELETE_DOC_MUTATION, mediaUrl,
  type Buyer, type Contract, type ExportDoc, type ChecklistItem,
} from '@/graphql/tradeQueries';

const title = (s: string) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const fmt = (n: number | string, d = 2) => Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400';
const STATUS_CLS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600', offered: 'bg-sky-100 text-sky-700', accepted: 'bg-emerald-100 text-emerald-700', in_progress: 'bg-amber-100 text-amber-700',
  fulfilled: 'bg-green-100 text-green-700', disputed: 'bg-red-100 text-red-700', cancelled: 'bg-slate-100 text-slate-500',
  submitted: 'bg-sky-100 text-sky-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
};
const DOC_TYPES = [['invoice', 'Commercial invoice'], ['packing_list', 'Packing list'], ['phytosanitary', 'Phytosanitary certificate'], ['coo', 'Certificate of origin'], ['health_cert', 'Veterinary health certificate'], ['fumigation', 'Fumigation certificate'], ['customs', 'Customs declaration'], ['other', 'Other']];
const BUYER_TYPES = ['company', 'exporter', 'processor', 'supermarket', 'trader', 'ngo', 'government', 'individual'];
const Pill = ({ v }: { v: string }) => <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_CLS[v] ?? 'bg-slate-100 text-slate-600'}`}>{title(v)}</span>;

function Msg({ m }: { m: { ok: boolean; text: string } | null }) {
  if (!m) return null;
  return <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${m.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{m.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {m.text}</div>;
}

export default function TradeDocuments() {
  const [tab, setTab] = useState<'contracts' | 'documents' | 'buyers'>('contracts');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [docs, setDocs] = useState<ExportDoc[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await gqlRequest<{ tradeContracts: Contract[]; buyerProfiles: Buyer[]; exportDocuments: ExportDoc[] }>(TRADE_HOME_QUERY); setContracts(r.tradeContracts); setBuyers(r.buyerProfiles); setDocs(r.exportDocuments); }
    catch (e: any) { setMsg({ ok: false, text: e?.message ?? 'Failed to load' }); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => ({
    open: contracts.filter(c => !['fulfilled', 'cancelled'].includes(c.status)).length,
    value: contracts.filter(c => !['cancelled'].includes(c.status)).reduce((s, c) => s + Number(c.totalValue || 0), 0),
    exportContracts: contracts.filter(c => c.buyer && c.buyer.country && c.buyer.country.toLowerCase() !== 'zambia').length,
    docsIssued: docs.filter(d => d.status === 'approved').length,
    docsDraft: docs.filter(d => d.status !== 'approved').length,
  }), [contracts, docs]);

  const selectedContract = contracts.find(c => c.id === selected) ?? null;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Ship className="w-6 h-6 text-emerald-600" /> Trade & Export Documents</h1>
          <p className="text-sm text-slate-500 mt-1">Buyer contracts, commercial invoices, packing lists, phytosanitary / veterinary certificates, certificates of origin and customs declarations — generated as PDFs</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50" aria-label="Refresh"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>
      <Msg m={msg} />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[['Open contracts', totals.open], ['Contract value', `ZMW ${fmt(totals.value, 0)}`], ['Export contracts', totals.exportContracts], ['Documents issued', totals.docsIssued], ['Documents in draft', totals.docsDraft]].map(([l, v]) => (
          <div key={String(l)} className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-[11px] uppercase tracking-wide text-slate-500">{l}</div><div className="text-xl font-bold text-slate-900 tabular-nums mt-1">{v}</div></div>
        ))}
      </div>

      {selectedContract ? (
        <ContractWorkspace contract={selectedContract} allDocs={docs.filter(d => d.contractId === selectedContract.id)} buyers={buyers}
          onBack={() => { setSelected(null); load(); }} onChanged={(m) => { setMsg(m); load(); }} />
      ) : (
        <>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {([['contracts', 'Contracts'], ['documents', 'All documents'], ['buyers', 'Buyers']] as const).map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{l}</button>
            ))}
          </div>
          {tab === 'contracts' && <ContractsTab contracts={contracts} buyers={buyers} docs={docs} onOpen={setSelected} onChanged={(m) => { setMsg(m); load(); }} />}
          {tab === 'documents' && <DocumentsTable docs={docs} contracts={contracts} onChanged={(m) => { setMsg(m); load(); }} />}
          {tab === 'buyers' && <BuyersTab buyers={buyers} onChanged={(m) => { setMsg(m); load(); }} />}
        </>
      )}
    </div>
  );
}

// ─── Contracts ───────────────────────────────────────────────────────────────

function ContractsTab({ contracts, buyers, docs, onOpen, onChanged }: { contracts: Contract[]; buyers: Buyer[]; docs: ExportDoc[]; onOpen: (id: string) => void; onChanged: (m: { ok: boolean; text: string }) => void }) {
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ commodity: '', qty: '', unit: 'kg', price: '', buyerId: buyers[0]?.id ?? '', deliveryDate: '', paymentTerms: '', depositPct: '' });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) => setF(x => ({ ...x, [k]: e.target.value }));
  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      await gqlRequest(CREATE_CONTRACT_MUTATION, { commodity: f.commodity, qty: Number(f.qty), price: Number(f.price), buyerId: f.buyerId || null, unit: f.unit, deliveryDate: f.deliveryDate || null, paymentTerms: f.paymentTerms, depositPct: f.depositPct ? Number(f.depositPct) : 0 });
      setAdding(false); setF(x => ({ ...x, commodity: '', qty: '', price: '' })); onChanged({ ok: true, text: 'Contract created.' });
    } catch (err: any) { onChanged({ ok: false, text: err?.message }); } finally { setBusy(false); }
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2"><FileText className="w-4 h-4" /> Trade contracts</h3>
        <button onClick={() => setAdding(a => !a)} className="inline-flex items-center gap-1 text-sm text-emerald-700 font-medium"><Plus className="w-4 h-4" /> New contract</button>
      </div>
      {adding && (
        <form onSubmit={create} className="grid md:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-xl">
          <input value={f.commodity} onChange={set('commodity')} placeholder="Commodity (e.g. Soya beans, Grade A)" className={`${inputCls} md:col-span-2`} required />
          <select value={f.buyerId} onChange={set('buyerId')} className={`${inputCls} bg-white md:col-span-2`}><option value="">No buyer yet</option>{buyers.map(b => <option key={b.id} value={b.id}>{b.name} — {b.town || b.country}</option>)}</select>
          <input type="number" step="any" min="0" value={f.qty} onChange={set('qty')} placeholder="Quantity" className={inputCls} required />
          <input value={f.unit} onChange={set('unit')} placeholder="Unit" className={inputCls} />
          <input type="number" step="any" min="0" value={f.price} onChange={set('price')} placeholder="Price per unit (ZMW)" className={inputCls} required />
          <input type="number" min="0" max="100" value={f.depositPct} onChange={set('depositPct')} placeholder="Deposit %" className={inputCls} />
          <input type="date" value={f.deliveryDate} onChange={set('deliveryDate')} className={inputCls} />
          <input value={f.paymentTerms} onChange={set('paymentTerms')} placeholder="Payment terms (e.g. 50% deposit, balance on delivery)" className={`${inputCls} md:col-span-2`} />
          <button type="submit" disabled={busy} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{busy ? 'Saving…' : 'Create contract'}</button>
        </form>
      )}
      {!contracts.length ? <p className="text-sm text-slate-400 text-center py-6">No contracts yet. Add a buyer, then create a contract to generate its document pack.</p> : (
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">{['Commodity', 'Buyer', 'Quantity', 'Value', 'Delivery', 'Status', 'Docs', ''].map(h => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{contracts.map(c => {
            const n = docs.filter(d => d.contractId === c.id);
            return (
              <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => onOpen(c.id)}>
                <td className="py-2.5 pr-3 font-medium text-slate-900">{c.commodity}</td>
                <td className="py-2.5 pr-3 text-slate-700">{c.buyer ? <>{c.buyer.name}<div className="text-xs text-slate-400">{c.buyer.town && `${c.buyer.town}, `}{c.buyer.country}</div></> : <span className="text-slate-400">—</span>}</td>
                <td className="py-2.5 pr-3 tabular-nums">{fmt(c.quantityAgreed, 0)} {c.unit}</td>
                <td className="py-2.5 pr-3 tabular-nums">{c.currency} {fmt(c.totalValue, 0)}</td>
                <td className="py-2.5 pr-3 text-slate-600">{c.deliveryDate ?? '—'}</td>
                <td className="py-2.5 pr-3"><Pill v={c.status} /></td>
                <td className="py-2.5 pr-3 tabular-nums text-slate-600">{n.filter(d => d.status === 'approved').length}/{n.length}</td>
                <td className="py-2.5 text-emerald-700 text-xs font-semibold whitespace-nowrap">Open →</td>
              </tr>
            );
          })}</tbody>
        </table></div>
      )}
    </div>
  );
}

// ─── Contract workspace ──────────────────────────────────────────────────────

function ContractWorkspace({ contract, allDocs, buyers, onBack, onChanged }: { contract: Contract; allDocs: ExportDoc[]; buyers: Buyer[]; onBack: () => void; onChanged: (m: { ok: boolean; text: string }) => void }) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [addType, setAddType] = useState('');
  const [editing, setEditing] = useState<ExportDoc | null>(null);
  const c = contract;
  const isExport = !!(c.buyer && c.buyer.country && c.buyer.country.toLowerCase() !== 'zambia');

  const loadChecklist = useCallback(() => gqlRequest<{ exportChecklist: ChecklistItem[] }>(CHECKLIST_QUERY, { id: c.id }).then(r => setChecklist(r.exportChecklist)).catch(() => {}), [c.id]);
  useEffect(() => { loadChecklist(); }, [loadChecklist, allDocs]);

  async function run(key: string, fn: () => Promise<string>) {
    setBusy(key);
    try { const text = await fn(); onChanged({ ok: true, text }); loadChecklist(); } catch (e: any) { onChanged({ ok: false, text: e?.message }); } finally { setBusy(null); }
  }
  const contractPdf = () => run('contract', async () => { const r = await gqlRequest<{ generateContractPdf: { url: string } }>(CONTRACT_PDF_MUTATION, { id: c.id }); window.open(mediaUrl(r.generateContractPdf.url), '_blank'); return 'Contract PDF generated.'; });
  const pack = () => run('pack', async () => { const r = await gqlRequest<{ generateExportPack: { created: number; documents: ExportDoc[] } }>(EXPORT_PACK_MUTATION, { id: c.id }); return `Document pack ready: ${r.generateExportPack.documents.length} PDFs (${r.generateExportPack.created} newly created).`; });
  const createDoc = (docType: string) => run('new:' + docType, async () => { await gqlRequest(CREATE_DOC_MUTATION, { input: { contractId: c.id, docType }, generate: true }); return `${title(docType)} created and rendered.`; });
  const regen = (d: ExportDoc) => run('pdf:' + d.id, async () => { const r = await gqlRequest<{ generateExportDocumentPdf: { url: string } }>(DOC_PDF_MUTATION, { id: d.id }); window.open(mediaUrl(r.generateExportDocumentPdf.url), '_blank'); return `${d.docNumber} regenerated.`; });
  const remove = (d: ExportDoc) => { if (!confirm(`Delete ${d.docNumber}?`)) return; run('del:' + d.id, async () => { await gqlRequest(DELETE_DOC_MUTATION, { id: d.id }); return `${d.docNumber} deleted.`; }); };
  const setStatus = (status: string, extra: Record<string, any> = {}) => run('status', async () => { await gqlRequest(UPDATE_CONTRACT_STATUS_MUTATION, { id: c.id, status, ...extra }); return `Contract marked ${title(status)}.`; });

  const missing = checklist.filter(i => i.required && !i.document);
  const nextStatus: Record<string, string[]> = { draft: ['offered'], offered: ['accepted', 'cancelled'], accepted: ['in_progress', 'cancelled'], in_progress: ['fulfilled', 'disputed'], disputed: ['fulfilled', 'cancelled'] };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /> Contracts</button>
        <h2 className="text-xl font-bold text-slate-900">{c.commodity}</h2><Pill v={c.status} />
        {isExport ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">EXPORT → {c.buyer!.country}</span> : <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">DOMESTIC</span>}
        <div className="flex-1" />
        <button onClick={contractPdf} disabled={busy === 'contract'} className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50">{busy === 'contract' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Contract PDF</button>
        <button onClick={pack} disabled={busy === 'pack'} className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50">{busy === 'pack' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck2 className="w-3.5 h-3.5" />} Generate document pack</button>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 md:col-span-2">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Buyer</div>
          {c.buyer ? <><div className="font-semibold text-slate-900">{c.buyer.name}</div><div className="text-xs text-slate-500">{c.buyer.contactPerson && `${c.buyer.contactPerson} · `}{c.buyer.address && `${c.buyer.address}, `}{c.buyer.town && `${c.buyer.town}, `}{c.buyer.country}{c.buyer.phone && ` · ${c.buyer.phone}`}</div></> : <div className="text-sm text-slate-400">No buyer assigned</div>}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-[11px] uppercase tracking-wide text-slate-500">Quantity · price</div><div className="font-semibold text-slate-900 tabular-nums">{fmt(c.quantityAgreed, 0)} {c.unit} × {c.currency} {fmt(c.agreedPrice)}</div><div className="text-xs text-slate-500">Delivered {fmt(c.quantityDelivered, 0)} {c.unit}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-[11px] uppercase tracking-wide text-slate-500">Value · payment</div><div className="font-semibold text-slate-900 tabular-nums">{c.currency} {fmt(c.totalValue, 0)}</div><div className="text-xs text-slate-500">{c.depositPct ? `${c.depositPct}% deposit ${c.depositPaid ? 'paid' : 'due'} · ` : ''}{c.finalPaid ? 'fully paid' : 'balance outstanding'}{c.deliveryDate && ` · delivery ${c.deliveryDate}`}</div></div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500">Move contract to:</span>
        {(nextStatus[c.status] ?? []).map(s => <button key={s} onClick={() => setStatus(s)} disabled={busy === 'status'} className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50">{title(s)}</button>)}
        {c.depositPct > 0 && !c.depositPaid && <button onClick={() => setStatus(c.status, { depositPaid: true })} className="px-2.5 py-1 rounded-lg border border-emerald-300 text-emerald-700">Mark deposit paid</button>}
        {!c.finalPaid && <button onClick={() => setStatus(c.status, { finalPaid: true })} className="px-2.5 py-1 rounded-lg border border-emerald-300 text-emerald-700">Mark fully paid</button>}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900">Document checklist</h3>
          <span className={`text-xs font-semibold ${missing.length ? 'text-amber-700' : 'text-green-700'}`}>{missing.length ? `${missing.length} required document${missing.length === 1 ? '' : 's'} missing` : 'All required documents present'}</span>
        </div>
        <ul className="divide-y divide-slate-100">
          {checklist.map(item => {
            const d = item.document;
            return (
              <li key={item.docType} className="py-3 flex flex-wrap items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${!d ? 'bg-slate-300' : d.status === 'approved' ? 'bg-green-500' : d.status === 'rejected' ? 'bg-red-500' : 'bg-amber-400'}`} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900">{item.label}{!item.required && <span className="ml-2 text-[10px] uppercase text-slate-400">optional</span>}</div>
                  {d ? <div className="text-xs text-slate-500">{d.docNumber} · <Pill v={d.status} />{d.issueDate && ` · issued ${d.issueDate}`}{d.expiryDate && ` · expires ${d.expiryDate}`}{d.issuingAuthority && ` · ${d.issuingAuthority}`}</div> : <div className="text-xs text-slate-400">Not created</div>}
                </div>
                {d ? (
                  <div className="flex items-center gap-1.5">
                    {d.documentUrl && <a href={mediaUrl(d.documentUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 text-white rounded-lg text-xs"><Download className="w-3.5 h-3.5" /> PDF</a>}
                    <button onClick={() => regen(d)} disabled={busy === 'pdf:' + d.id} title="Regenerate PDF" className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-emerald-700 disabled:opacity-50">{busy === 'pdf:' + d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}</button>
                    <button onClick={() => setEditing(d)} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700">Details</button>
                    <button onClick={() => remove(d)} className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => createDoc(item.docType)} disabled={busy === 'new:' + item.docType} className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-emerald-300 text-emerald-700 rounded-lg text-xs disabled:opacity-50">{busy === 'new:' + item.docType ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Create & render</button>
                )}
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <select value={addType} onChange={e => setAddType(e.target.value)} className={`${inputCls} bg-white w-auto`}><option value="">Add another document type…</option>{DOC_TYPES.filter(([v]) => !checklist.some(i => i.docType === v)).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <button onClick={() => { if (addType) { createDoc(addType); setAddType(''); } }} disabled={!addType} className="px-3 py-2 bg-slate-800 text-white rounded-lg text-xs disabled:opacity-40">Create</button>
        </div>
      </div>

      {editing && <DocEditor doc={editing} onClose={() => setEditing(null)} onSaved={(m) => { setEditing(null); onChanged(m); loadChecklist(); }} />}
    </div>
  );
}

// ─── Document editor ─────────────────────────────────────────────────────────

function DocEditor({ doc, onClose, onSaved }: { doc: ExportDoc; onClose: () => void; onSaved: (m: { ok: boolean; text: string }) => void }) {
  const [f, setF] = useState({ docNumber: doc.docNumber, issuingAuthority: doc.issuingAuthority, commodity: doc.commodity, quantity: String(doc.quantity), unit: doc.unit, destinationCountry: doc.destinationCountry, status: doc.status, issueDate: doc.issueDate ?? '', expiryDate: doc.expiryDate ?? '', notes: doc.notes });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) => setF(x => ({ ...x, [k]: e.target.value }));
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      await gqlRequest(UPDATE_DOC_MUTATION, { id: doc.id, regenerate: true, input: { ...f, quantity: Number(f.quantity), issueDate: f.issueDate || null, expiryDate: f.expiryDate || null } });
      onSaved({ ok: true, text: `${f.docNumber} saved and PDF regenerated.` });
    } catch (err: any) { onSaved({ ok: false, text: err?.message }); } finally { setBusy(false); }
  }
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <form onSubmit={save} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-900">{doc.docTypeDisplay} — {doc.docNumber}</h3><button type="button" onClick={onClose}><X className="w-4 h-4 text-slate-500" /></button></div>
        <div className="grid md:grid-cols-2 gap-2">
          <label className="text-xs text-slate-500">Document number<input value={f.docNumber} onChange={set('docNumber')} className={`${inputCls} mt-1`} /></label>
          <label className="text-xs text-slate-500">Status<select value={f.status} onChange={set('status')} className={`${inputCls} mt-1 bg-white`}>{['draft', 'submitted', 'approved', 'rejected'].map(s => <option key={s} value={s}>{title(s)}</option>)}</select></label>
          <label className="text-xs text-slate-500 md:col-span-2">Issuing authority<input value={f.issuingAuthority} onChange={set('issuingAuthority')} className={`${inputCls} mt-1`} /></label>
          <label className="text-xs text-slate-500">Commodity<input value={f.commodity} onChange={set('commodity')} className={`${inputCls} mt-1`} /></label>
          <div className="grid grid-cols-2 gap-2"><label className="text-xs text-slate-500">Quantity<input type="number" step="any" value={f.quantity} onChange={set('quantity')} className={`${inputCls} mt-1`} /></label><label className="text-xs text-slate-500">Unit<input value={f.unit} onChange={set('unit')} className={`${inputCls} mt-1`} /></label></div>
          <label className="text-xs text-slate-500">Destination country<input value={f.destinationCountry} onChange={set('destinationCountry')} className={`${inputCls} mt-1`} /></label>
          <div className="grid grid-cols-2 gap-2"><label className="text-xs text-slate-500">Issue date<input type="date" value={f.issueDate} onChange={set('issueDate')} className={`${inputCls} mt-1`} /></label><label className="text-xs text-slate-500">Expiry<input type="date" value={f.expiryDate} onChange={set('expiryDate')} className={`${inputCls} mt-1`} /></label></div>
          <label className="text-xs text-slate-500 md:col-span-2">Additional declaration / notes (printed on the document)<textarea value={f.notes} onChange={set('notes')} rows={3} className={`${inputCls} mt-1`} /></label>
        </div>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button><button type="submit" disabled={busy} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{busy ? 'Saving…' : 'Save & regenerate PDF'}</button></div>
      </form>
    </div>
  );
}

// ─── All documents ───────────────────────────────────────────────────────────

function DocumentsTable({ docs, contracts, onChanged }: { docs: ExportDoc[]; contracts: Contract[]; onChanged: (m: { ok: boolean; text: string }) => void }) {
  const byContract = Object.fromEntries(contracts.map(c => [c.id, c]));
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-4">All export & trade documents</h3>
      {!docs.length ? <p className="text-sm text-slate-400 text-center py-6">No documents yet — open a contract and generate its document pack.</p> : (
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">{['Number', 'Type', 'Contract', 'Destination', 'Status', 'Issued', 'Expires', ''].map(h => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{docs.map(d => (
            <tr key={d.id} className="border-b border-slate-100 last:border-0">
              <td className="py-2 pr-3 font-mono text-xs text-slate-900">{d.docNumber}</td><td className="py-2 pr-3">{d.docTypeDisplay}</td>
              <td className="py-2 pr-3 text-slate-600">{d.contractId && byContract[d.contractId] ? `${byContract[d.contractId].commodity} → ${byContract[d.contractId].buyer?.name ?? '—'}` : d.commodity}</td>
              <td className="py-2 pr-3 text-slate-600">{d.destinationCountry || '—'}</td><td className="py-2 pr-3"><Pill v={d.status} /></td>
              <td className="py-2 pr-3 text-slate-600">{d.issueDate ?? '—'}</td><td className="py-2 pr-3 text-slate-600">{d.expiryDate ?? '—'}</td>
              <td className="py-2">{d.documentUrl ? <a href={mediaUrl(d.documentUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold"><Download className="w-3.5 h-3.5" /> PDF</a> : <span className="text-xs text-slate-400">not rendered</span>}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  );
}

// ─── Buyers ──────────────────────────────────────────────────────────────────

function BuyersTab({ buyers, onChanged }: { buyers: Buyer[]; onChanged: (m: { ok: boolean; text: string }) => void }) {
  const [adding, setAdding] = useState(buyers.length === 0);
  const [f, setF] = useState({ name: '', buyerType: 'exporter', contactPerson: '', phone: '', email: '', address: '', town: '', country: 'Zambia', paymentTerms: '' });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) => setF(x => ({ ...x, [k]: e.target.value }));
  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try { await gqlRequest(CREATE_BUYER_MUTATION, f); setAdding(false); setF(x => ({ ...x, name: '', contactPerson: '', phone: '', email: '', address: '', town: '' })); onChanged({ ok: true, text: 'Buyer added.' }); }
    catch (err: any) { onChanged({ ok: false, text: err?.message }); } finally { setBusy(false); }
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-900 flex items-center gap-2"><Users className="w-4 h-4" /> Buyers</h3><button onClick={() => setAdding(a => !a)} className="inline-flex items-center gap-1 text-sm text-emerald-700 font-medium"><Plus className="w-4 h-4" /> Add buyer</button></div>
      {adding && (
        <form onSubmit={create} className="grid md:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-xl">
          <input value={f.name} onChange={set('name')} placeholder="Buyer / company name" className={`${inputCls} md:col-span-2`} required />
          <select value={f.buyerType} onChange={set('buyerType')} className={`${inputCls} bg-white`}>{BUYER_TYPES.map(t => <option key={t} value={t}>{title(t)}</option>)}</select>
          <input value={f.contactPerson} onChange={set('contactPerson')} placeholder="Contact person" className={inputCls} />
          <input value={f.phone} onChange={set('phone')} placeholder="Phone" className={inputCls} />
          <input type="email" value={f.email} onChange={set('email')} placeholder="Email" className={inputCls} />
          <input value={f.address} onChange={set('address')} placeholder="Street address" className={`${inputCls} md:col-span-2`} />
          <input value={f.town} onChange={set('town')} placeholder="Town / city" className={inputCls} />
          <input value={f.country} onChange={set('country')} placeholder="Country" className={inputCls} required />
          <input value={f.paymentTerms} onChange={set('paymentTerms')} placeholder="Payment terms" className={`${inputCls} md:col-span-2`} />
          <button type="submit" disabled={busy} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{busy ? 'Saving…' : 'Save buyer'}</button>
          <p className="md:col-span-4 text-[11px] text-slate-500">Buyers outside Zambia make a contract an export: it gets the full certificate checklist (phytosanitary or veterinary, origin, customs). Domestic buyers get invoice + packing list.</p>
        </form>
      )}
      {!buyers.length && !adding ? <p className="text-sm text-slate-400 text-center py-6">No buyers yet.</p> : (
        <ul className="divide-y divide-slate-100">{buyers.map(b => (
          <li key={b.id} className="py-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-medium text-slate-900">{b.name}</span><span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{title(b.buyerType)}</span>
            <span className="text-slate-500">{b.town && `${b.town}, `}{b.country}</span>{b.contactPerson && <span className="text-slate-500">{b.contactPerson}</span>}{b.phone && <span className="text-slate-500">{b.phone}</span>}{b.paymentTerms && <span className="text-xs text-slate-400">{b.paymentTerms}</span>}
            {b.isVerified && <span className="text-[11px] text-green-700 font-semibold">Verified</span>}
          </li>
        ))}</ul>
      )}
    </div>
  );
}
