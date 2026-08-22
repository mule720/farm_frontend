import React, { useState, useMemo } from 'react';
import { Plus, X, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, Package, AlertTriangle, FileText, Truck, RefreshCw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useOrg } from '@/store/orgStore';
import { exportCSV } from '@/lib/exportUtils';

type ReqStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled';
type ReqPriority = 'low' | 'normal' | 'urgent';
type ReqCategory = 'feed' | 'medicine' | 'equipment' | 'seeds' | 'fingerlings' | 'packaging' | 'other';

interface ReqLine {
  id: string;
  itemName: string;
  description: string;
  qty: number;
  unit: string;
  estimatedUnitCost: number;
}

interface Requisition {
  id: string;
  reqNumber: string;
  requestedBy: string;
  enterpriseId: string;
  date: string;
  priority: ReqPriority;
  category: ReqCategory;
  status: ReqStatus;
  lines: ReqLine[];
  justification: string;
  reviewedBy?: string;
  reviewNote?: string;
  reviewedAt?: string;
  linkedPoId?: string;
  fulfilledAt?: string;
}

const LS_KEY = 'agronexus_v2_requisitions';

function seedRequisitions(enterpriseId: string): Requisition[] {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const dAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };
  return [
    {
      id: uuidv4(), reqNumber: 'REQ-2024-001', requestedBy: 'Bob Mwale', enterpriseId,
      date: dAgo(5), priority: 'urgent', category: 'feed', status: 'fulfilled',
      justification: 'Running low on broiler grower — 3 days supply left',
      lines: [
        { id: uuidv4(), itemName: 'Broiler Grower 50kg', description: 'Tiger Brand', qty: 40, unit: 'bags', estimatedUnitCost: 320 },
        { id: uuidv4(), itemName: 'Broiler Finisher 50kg', description: 'Tiger Brand', qty: 20, unit: 'bags', estimatedUnitCost: 300 },
      ],
      reviewedBy: 'Carol Phiri', reviewNote: 'Approved — urgent. Convert to PO immediately.', reviewedAt: dAgo(4), linkedPoId: 'PO-2024-010', fulfilledAt: dAgo(2),
    },
    {
      id: uuidv4(), reqNumber: 'REQ-2024-002', requestedBy: 'Alice Banda', enterpriseId,
      date: dAgo(2), priority: 'normal', category: 'medicine', status: 'approved',
      justification: 'Upcoming Newcastle booster vaccination week 3',
      lines: [
        { id: uuidv4(), itemName: 'Newcastle La Sota Vaccine', description: '1000-dose vial × 3', qty: 3, unit: 'vials', estimatedUnitCost: 180 },
        { id: uuidv4(), itemName: 'Syringes 5ml', description: 'Disposable', qty: 50, unit: 'pcs', estimatedUnitCost: 3 },
      ],
      reviewedBy: 'Carol Phiri', reviewNote: 'Approved. Order from AgriVet Zambia.', reviewedAt: dAgo(1),
    },
    {
      id: uuidv4(), reqNumber: 'REQ-2024-003', requestedBy: 'Bob Mwale', enterpriseId,
      date: dAgo(1), priority: 'normal', category: 'equipment', status: 'submitted',
      justification: 'Water nipple drinkers in House 2 are leaking — need replacement set',
      lines: [
        { id: uuidv4(), itemName: 'Nipple Drinker System', description: '360° nipple, 100-bird set', qty: 2, unit: 'sets', estimatedUnitCost: 850 },
      ],
    },
    {
      id: uuidv4(), reqNumber: 'REQ-2024-004', requestedBy: 'Alice Banda', enterpriseId,
      date: fmt(today), priority: 'low', category: 'packaging', status: 'draft',
      justification: 'Need cartons and bags for upcoming broiler sales batch',
      lines: [
        { id: uuidv4(), itemName: 'Cardboard cartons', description: 'Standard broiler export box', qty: 200, unit: 'pcs', estimatedUnitCost: 12 },
        { id: uuidv4(), itemName: 'Plastic bags 2kg', description: 'Branded with farm logo', qty: 500, unit: 'pcs', estimatedUnitCost: 2.5 },
      ],
    },
  ];
}

function nextReqNumber(existing: Requisition[]): string {
  const year = new Date().getFullYear();
  const nums = existing.map(r => parseInt(r.reqNumber.split('-')[2] ?? '0')).filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `REQ-${year}-${String(next).padStart(3, '0')}`;
}

const STATUS_STYLES: Record<ReqStatus, string> = {
  draft:     'bg-slate-100 text-slate-600',
  submitted: 'bg-amber-100 text-amber-800',
  approved:  'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-700',
  fulfilled: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-slate-100 text-slate-400',
};

const PRIORITY_STYLES: Record<ReqPriority, string> = {
  low:    'bg-slate-50 text-slate-500 border border-slate-200',
  normal: 'bg-amber-50 text-amber-700 border border-amber-200',
  urgent: 'bg-red-50 text-red-700 border border-red-200',
};

function lineTotal(lines: ReqLine[]): number {
  return lines.reduce((s, l) => s + l.qty * l.estimatedUnitCost, 0);
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function Requisitions() {
  const { org } = useOrg();

  const [reqs, setReqs] = useState<Requisition[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw) as Requisition[];
    } catch { /* ignore */ }
    const eid = org?.enterprises[0]?.id ?? 'default';
    const seed = seedRequisitions(eid);
    localStorage.setItem(LS_KEY, JSON.stringify(seed));
    return seed;
  });

  const [tab, setTab] = useState<'all' | 'pending' | 'approved' | 'history'>('all');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ReqStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<ReqCategory | 'all'>('all');

  // form state
  const [formReqBy, setFormReqBy] = useState('');
  const [formEntId, setFormEntId] = useState(org?.enterprises[0]?.id ?? '');
  const [formPriority, setFormPriority] = useState<ReqPriority>('normal');
  const [formCategory, setFormCategory] = useState<ReqCategory>('feed');
  const [formJustification, setFormJustification] = useState('');
  const [formLines, setFormLines] = useState<ReqLine[]>([
    { id: uuidv4(), itemName: '', description: '', qty: 1, unit: '', estimatedUnitCost: 0 },
  ]);

  // review state
  const [reviewNote, setReviewNote] = useState('');
  const [reviewedBy, setReviewedBy] = useState('');

  function saveReqs(list: Requisition[]) {
    setReqs(list);
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  }

  function submitReq(id: string) {
    saveReqs(reqs.map(r => r.id === id ? { ...r, status: 'submitted' as ReqStatus } : r));
  }

  function approveReq(id: string) {
    saveReqs(reqs.map(r => r.id === id ? {
      ...r, status: 'approved' as ReqStatus,
      reviewedBy, reviewNote, reviewedAt: new Date().toISOString().slice(0, 10),
    } : r));
    setReviewingId(null);
    setReviewNote('');
    setReviewedBy('');
  }

  function rejectReq(id: string) {
    saveReqs(reqs.map(r => r.id === id ? {
      ...r, status: 'rejected' as ReqStatus,
      reviewedBy, reviewNote, reviewedAt: new Date().toISOString().slice(0, 10),
    } : r));
    setReviewingId(null);
    setReviewNote('');
    setReviewedBy('');
  }

  function fulfillReq(id: string) {
    saveReqs(reqs.map(r => r.id === id ? {
      ...r, status: 'fulfilled' as ReqStatus,
      fulfilledAt: new Date().toISOString().slice(0, 10),
    } : r));
  }

  function cancelReq(id: string) {
    saveReqs(reqs.map(r => r.id === id ? { ...r, status: 'cancelled' as ReqStatus } : r));
  }

  function resetForm() {
    setFormReqBy('');
    setFormEntId(org?.enterprises[0]?.id ?? '');
    setFormPriority('normal');
    setFormCategory('feed');
    setFormJustification('');
    setFormLines([{ id: uuidv4(), itemName: '', description: '', qty: 1, unit: '', estimatedUnitCost: 0 }]);
  }

  function saveForm(submitNow: boolean) {
    if (!formReqBy.trim() || formLines.some(l => !l.itemName.trim())) return;
    const newReq: Requisition = {
      id: uuidv4(),
      reqNumber: nextReqNumber(reqs),
      requestedBy: formReqBy.trim(),
      enterpriseId: formEntId,
      date: new Date().toISOString().slice(0, 10),
      priority: formPriority,
      category: formCategory,
      justification: formJustification,
      status: submitNow ? 'submitted' : 'draft',
      lines: formLines,
    };
    saveReqs([...reqs, newReq]);
    setShowForm(false);
    resetForm();
  }

  function updateLine(idx: number, patch: Partial<ReqLine>) {
    setFormLines(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));
  }

  function addLine() {
    setFormLines(prev => [...prev, { id: uuidv4(), itemName: '', description: '', qty: 1, unit: '', estimatedUnitCost: 0 }]);
  }

  function removeLine(idx: number) {
    if (formLines.length === 1) return;
    setFormLines(prev => prev.filter((_, i) => i !== idx));
  }

  const filtered = useMemo(() => {
    let list = reqs;
    if (tab === 'pending') list = list.filter(r => r.status === 'submitted');
    else if (tab === 'approved') list = list.filter(r => r.status === 'approved');
    else if (tab === 'history') list = list.filter(r => ['fulfilled', 'rejected', 'cancelled'].includes(r.status));
    else {
      if (filterStatus !== 'all') list = list.filter(r => r.status === filterStatus);
      if (filterCategory !== 'all') list = list.filter(r => r.category === filterCategory);
    }
    return list.slice().reverse();
  }, [reqs, tab, filterStatus, filterCategory]);

  const kpiSubmitted = reqs.filter(r => r.status === 'submitted').length;
  const kpiApproved  = reqs.filter(r => r.status === 'approved').length;
  const kpiFulfill   = reqs.filter(r => r.status === 'approved').length; // pending fulfillment

  function handleExport() {
    const rows = filtered.map(r => ({
      Number: r.reqNumber,
      RequestedBy: r.requestedBy,
      Date: r.date,
      Priority: r.priority,
      Category: r.category,
      Status: r.status,
      Items: r.lines.length,
      EstTotal: lineTotal(r.lines),
      Justification: r.justification,
      ReviewedBy: r.reviewedBy ?? '',
      ReviewNote: r.reviewNote ?? '',
    }));
    exportCSV(rows, 'requisitions');
  }

  const entName = (eid: string) => org?.enterprises.find((e: any) => e.id === eid)?.name ?? eid;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-600" />
            <h1 className="text-lg font-bold text-slate-900">Requisitions</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">{reqs.length} total</span>
            {kpiSubmitted > 0 && (
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">{kpiSubmitted} submitted</span>
            )}
            <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">{kpiApproved} approved</span>
            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{kpiFulfill} pending fulfillment</span>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> New Request
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {(['all', 'pending', 'approved', 'history'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                tab === t ? 'bg-violet-100 text-violet-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              {t === 'pending' ? 'Pending Review' : t}
            </button>
          ))}
        </div>

        {/* Filters */}
        {tab === 'all' && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as ReqStatus | 'all')}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option value="all">All Statuses</option>
              {(['draft','submitted','approved','rejected','fulfilled','cancelled'] as ReqStatus[]).map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value as ReqCategory | 'all')}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option value="all">All Categories</option>
              {(['feed','medicine','equipment','seeds','fingerlings','packaging','other'] as ReqCategory[]).map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <button
              onClick={handleExport}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No requisitions found</p>
          </div>
        )}

        {filtered.map(req => {
          const isExpanded = expandedId === req.id;
          const isReviewing = reviewingId === req.id;
          const total = lineTotal(req.lines);
          const ent = entName(req.enterpriseId);

          return (
            <div key={req.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              {/* Card top */}
              <div className="p-4">
                <div className="flex items-start gap-2 flex-wrap">
                  <span className="font-mono text-sm font-bold text-slate-800">{req.reqNumber}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${PRIORITY_STYLES[req.priority]}`}>{req.priority}</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium capitalize">{req.category}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${STATUS_STYLES[req.status]}`}>{req.status}</span>
                  <span className="ml-auto text-xs text-slate-400">{req.date}</span>
                </div>

                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  <span>👤 {req.requestedBy}</span>
                  <span>🏢 {ent}</span>
                </div>

                <p className="mt-1.5 text-xs text-slate-600 line-clamp-1">{req.justification}</p>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {req.lines.length} item{req.lines.length !== 1 ? 's' : ''} — est. ZMW {fmt(total)}
                  </span>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
                  {/* Lines table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100">
                          <th className="text-left pb-1 font-medium">Item</th>
                          <th className="text-right pb-1 font-medium">Qty</th>
                          <th className="text-left pb-1 font-medium pl-2">Unit</th>
                          <th className="text-right pb-1 font-medium">Cost/Unit</th>
                          <th className="text-right pb-1 font-medium">Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {req.lines.map(l => (
                          <tr key={l.id} className="border-b border-slate-50">
                            <td className="py-1 pr-2">
                              <div className="font-medium text-slate-800">{l.itemName}</div>
                              {l.description && <div className="text-slate-400">{l.description}</div>}
                            </td>
                            <td className="text-right py-1">{l.qty}</td>
                            <td className="py-1 pl-2 text-slate-500">{l.unit}</td>
                            <td className="text-right py-1">ZMW {fmt(l.estimatedUnitCost)}</td>
                            <td className="text-right py-1 font-medium">ZMW {fmt(l.qty * l.estimatedUnitCost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Review info */}
                  {req.reviewedBy && (
                    <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-0.5">
                      <div><span className="font-medium">Reviewed by:</span> {req.reviewedBy} {req.reviewedAt ? `(${req.reviewedAt})` : ''}</div>
                      {req.reviewNote && <div><span className="font-medium">Note:</span> {req.reviewNote}</div>}
                    </div>
                  )}

                  {/* Linked PO */}
                  {req.linkedPoId && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-medium">
                      <Truck className="w-3.5 h-3.5" /> → PO: {req.linkedPoId}
                    </div>
                  )}

                  {/* Fulfilled date */}
                  {req.fulfilledAt && (
                    <div className="text-xs text-blue-600">Fulfilled: {req.fulfilledAt}</div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap pt-1">
                    {req.status === 'draft' && (
                      <>
                        <button
                          onClick={() => submitReq(req.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Submit for Approval
                        </button>
                        <button
                          onClick={() => cancelReq(req.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </>
                    )}
                    {req.status === 'submitted' && (
                      <>
                        <button
                          onClick={() => { setReviewingId(req.id); setReviewNote(''); setReviewedBy(''); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => { setReviewingId(req.id); setReviewNote(''); setReviewedBy(''); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {req.status === 'approved' && (
                      <>
                        <button
                          onClick={() => fulfillReq(req.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Mark as Fulfilled
                        </button>
                        <button
                          onClick={() => cancelReq(req.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </>
                    )}
                  </div>

                  {/* Inline review panel */}
                  {isReviewing && (
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                      <h4 className="text-sm font-semibold text-slate-700">Review Decision</h4>
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Reviewed by</label>
                        <input
                          type="text"
                          value={reviewedBy}
                          onChange={e => setReviewedBy(e.target.value)}
                          placeholder="Your name"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Note</label>
                        <textarea
                          value={reviewNote}
                          onChange={e => setReviewNote(e.target.value)}
                          placeholder="Optional note..."
                          rows={2}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveReq(req.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Confirm Approve
                        </button>
                        <button
                          onClick={() => rejectReq(req.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Confirm Reject
                        </button>
                        <button
                          onClick={() => setReviewingId(null)}
                          className="px-3 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New Request Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
              <h2 className="font-bold text-slate-900">New Stock Request</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Requested by */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Requested By *</label>
                  <input
                    type="text"
                    value={formReqBy}
                    onChange={e => setFormReqBy(e.target.value)}
                    placeholder="Employee name"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Enterprise</label>
                  <select
                    value={formEntId}
                    onChange={e => setFormEntId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {(org?.enterprises ?? []).map((e: any) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Priority</label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value as ReqPriority)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Category</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as ReqCategory)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {(['feed','medicine','equipment','seeds','fingerlings','packaging','other'] as ReqCategory[]).map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Justification</label>
                <textarea
                  value={formJustification}
                  onChange={e => setFormJustification(e.target.value)}
                  placeholder="Why is this needed?"
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              {/* Line items */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Line Items *</label>
                <div className="space-y-2">
                  {formLines.map((line, idx) => (
                    <div key={line.id} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        className="col-span-3 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
                        placeholder="Item name *"
                        value={line.itemName}
                        onChange={e => updateLine(idx, { itemName: e.target.value })}
                      />
                      <input
                        className="col-span-2 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
                        placeholder="Description"
                        value={line.description}
                        onChange={e => updateLine(idx, { description: e.target.value })}
                      />
                      <input
                        type="number"
                        min={1}
                        className="col-span-2 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
                        placeholder="Qty"
                        value={line.qty}
                        onChange={e => updateLine(idx, { qty: Number(e.target.value) })}
                      />
                      <input
                        className="col-span-2 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
                        placeholder="Unit"
                        value={line.unit}
                        onChange={e => updateLine(idx, { unit: e.target.value })}
                      />
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className="col-span-2 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
                        placeholder="Cost/unit"
                        value={line.estimatedUnitCost}
                        onChange={e => updateLine(idx, { estimatedUnitCost: Number(e.target.value) })}
                      />
                      <button
                        onClick={() => removeLine(idx)}
                        disabled={formLines.length === 1}
                        className="col-span-1 flex items-center justify-center text-slate-300 hover:text-red-500 disabled:opacity-20"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addLine}
                  className="mt-2 flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Line
                </button>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 flex-shrink-0 bg-slate-50 rounded-b-2xl">
              <div className="text-sm text-slate-600 font-medium">
                Est. Total: <span className="text-slate-900">ZMW {fmt(lineTotal(formLines))}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveForm(false)}
                  disabled={!formReqBy.trim() || formLines.some(l => !l.itemName.trim())}
                  className="px-4 py-2 border border-violet-300 text-violet-700 rounded-xl text-sm font-medium hover:bg-violet-50 disabled:opacity-40"
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => saveForm(true)}
                  disabled={!formReqBy.trim() || formLines.some(l => !l.itemName.trim())}
                  className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-40"
                >
                  Submit Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
