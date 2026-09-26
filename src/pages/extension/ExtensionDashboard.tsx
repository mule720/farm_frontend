// ─────────────────────────────────────────────────────────────────────────────
// Extension Officer Dashboard
// Caseload (prioritised) → farm drill-down → visit log / advice / resolve.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Phone, Plus, RefreshCw, Search, Send, Trash2 } from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import type { ExtTab } from '@/v2/ExtensionShell';
import {
  EXT_HOME_QUERY, EXT_AVAILABLE_QUERY, EXT_FARM_DETAIL_QUERY, EXT_VISITS_QUERY,
  ASSIGN_FARM_MUTATION, REMOVE_FARM_MUTATION, LOG_VISIT_MUTATION, COMPLETE_FOLLOW_UP_MUTATION,
  RESOLVE_REPORT_MUTATION, SEND_ADVICE_MUTATION,
  type CaseloadFarm, type AvailableFarm, type FarmDetail, type ExtVisit, type ExtOverview,
} from '@/graphql/extensionQueries';

interface Props { activeTab: ExtTab; setActiveTab: (t: ExtTab) => void }

const title = (s: string) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const SEV: Record<string, string> = { none: 'bg-green-100 text-green-700', low: 'bg-lime-100 text-lime-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700', warning: 'bg-amber-100 text-amber-700', info: 'bg-slate-100 text-slate-600' };
const today = () => new Date().toISOString().slice(0, 10);

export default function ExtensionDashboard({ activeTab, setActiveTab }: Props) {
  const [overview, setOverview] = useState<ExtOverview | null>(null);
  const [caseload, setCaseload] = useState<CaseloadFarm[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await gqlRequest<{ extensionOverview: ExtOverview; extensionCaseload: CaseloadFarm[] }>(EXT_HOME_QUERY);
      setOverview(r.extensionOverview); setCaseload(r.extensionCaseload);
    } catch (e: any) { setError(e?.message ?? 'Failed to load'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (activeTab !== 'caseload') setSelected(null); }, [activeTab]);

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-slate-900">Extension caseload</h1>
          <p className="text-xs text-slate-500">Working area: <span className="font-semibold text-slate-700">{overview?.workingArea ?? '…'}</span></p>
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50" aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>
      <main className="p-6 space-y-6">
        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"><AlertTriangle className="w-4 h-4" /> {error}</div>}
        {activeTab === 'caseload' && (selected
          ? <FarmDetailView farmId={selected} onBack={() => { setSelected(null); load(); }} />
          : <CaseloadView overview={overview} caseload={caseload} onOpen={setSelected} onAdd={() => setActiveTab('add')} />)}
        {activeTab === 'visits' && <VisitsView caseload={caseload} onChanged={load} />}
        {activeTab === 'add' && <AddFarmsView onChanged={load} />}
      </main>
    </div>
  );
}

// ─── Shared ──────────────────────────────────────────────────────────────────

function Card({ title: t, children, className = '', action }: { title?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={`bg-white rounded-2xl border border-slate-200 p-5 ${className}`}>
      {(t || action) && <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-slate-800">{t}</h3>{action}</div>}
      {children}
    </section>
  );
}
function Stat({ label, value, tone = 'default' }: { label: string; value: number | string; tone?: 'default' | 'warn' | 'bad' | 'good' }) {
  const ring = { default: 'border-slate-200', warn: 'border-amber-300', bad: 'border-red-300', good: 'border-green-300' }[tone];
  return <div className={`bg-white rounded-2xl border ${ring} p-4`}><div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div><div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{value}</div></div>;
}
function Pill({ v }: { v: string }) { return <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${SEV[v] ?? 'bg-slate-100 text-slate-600'}`}>{title(v)}</span>; }
function PriorityBadge({ score }: { score: number }) {
  const cls = score >= 8 ? 'bg-red-600' : score >= 3 ? 'bg-amber-500' : 'bg-slate-400';
  return <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-white text-xs font-bold tabular-nums ${cls}`} title="Priority score">{score}</span>;
}
const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm';

// ─── Caseload ────────────────────────────────────────────────────────────────

function CaseloadView({ overview, caseload, onOpen, onAdd }: { overview: ExtOverview | null; caseload: CaseloadFarm[]; onOpen: (id: string) => void; onAdd: () => void }) {
  return (
    <>
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <Stat label="Farms on caseload" value={overview.caseloadSize} />
          <Stat label="Need attention" value={overview.farmsNeedingAttention} tone={overview.farmsNeedingAttention ? 'warn' : 'default'} />
          <Stat label="Unresolved reports" value={overview.unresolvedReports} tone={overview.unresolvedReports ? 'warn' : 'default'} />
          <Stat label="Follow-ups overdue" value={overview.followUpsOverdue} tone={overview.followUpsOverdue ? 'bad' : 'default'} />
          <Stat label="Follow-ups this week" value={overview.followUpsThisWeek} />
          <Stat label="Visits (30 days)" value={overview.visits30d} tone="good" />
          <Stat label="Farms available" value={overview.farmsAvailable} />
        </div>
      )}
      <Card title="Caseload — highest priority first"
        action={<button onClick={onAdd} className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700"><Plus className="w-3.5 h-3.5" /> Add farms</button>}>
        {!caseload.length ? (
          <p className="text-sm text-slate-400 text-center py-8">No farms on your caseload yet. Use <strong>Add farms</strong> to pick consenting farms in your area.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
                {['Priority', 'Farm', 'Enterprises', 'Alerts', 'Reports', 'Severe AI dx', 'Last visit', 'Follow-up', ''].map(h => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}
              </tr></thead>
              <tbody>
                {caseload.map(f => (
                  <tr key={f.farmId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => onOpen(f.farmId)}>
                    <td className="py-2.5 pr-3"><PriorityBadge score={f.priorityScore} /></td>
                    <td className="py-2.5 pr-3"><div className="font-medium text-slate-900">{f.name}</div><div className="text-xs text-slate-500">{f.district} · {f.directorName ?? '—'}</div></td>
                    <td className="py-2.5 pr-3 text-slate-700">{f.enterprises} <span className="text-xs text-slate-400">{f.enterpriseCategories.map(title).join(', ')}</span></td>
                    <td className={`py-2.5 pr-3 tabular-nums ${f.criticalAlerts ? 'text-red-600 font-semibold' : f.openAlerts ? 'text-amber-600' : 'text-slate-500'}`}>{f.openAlerts}{f.criticalAlerts ? ` (${f.criticalAlerts} critical)` : ''}</td>
                    <td className={`py-2.5 pr-3 tabular-nums ${f.unresolvedReports ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}>{f.unresolvedReports}</td>
                    <td className={`py-2.5 pr-3 tabular-nums ${f.severeDiagnoses30d ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>{f.severeDiagnoses30d}</td>
                    <td className="py-2.5 pr-3 text-slate-600">{f.lastVisitDate ?? <span className="text-slate-400">never</span>}</td>
                    <td className="py-2.5 pr-3">{f.nextFollowUp ? <span className={f.followUpOverdue ? 'text-red-600 font-semibold' : 'text-slate-600'}>{f.nextFollowUp}{f.followUpOverdue ? ' · overdue' : ''}</span> : <span className="text-slate-400">—</span>}</td>
                    <td className="py-2.5 text-emerald-700 text-xs font-semibold whitespace-nowrap">Open →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

// ─── Farm detail ─────────────────────────────────────────────────────────────

function FarmDetailView({ farmId, onBack }: { farmId: string; onBack: () => void }) {
  const [d, setD] = useState<FarmDetail | null>(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [resolving, setResolving] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [advice, setAdvice] = useState({ title: '', message: '', priority: 'info' });
  const [showVisit, setShowVisit] = useState(false);

  const load = useCallback(() => gqlRequest<{ extensionFarmDetail: FarmDetail }>(EXT_FARM_DETAIL_QUERY, { id: farmId })
    .then(r => setD(r.extensionFarmDetail)).catch(e => setErr(e?.message ?? 'Failed')), [farmId]);
  useEffect(() => { load(); }, [load]);

  async function resolve(id: string) {
    try { await gqlRequest(RESOLVE_REPORT_MUTATION, { id, notes }); setResolving(null); setNotes(''); setMsg('Report resolved — farmer notified.'); load(); }
    catch (e: any) { setErr(e?.message); }
  }
  async function sendAdvice(e: React.FormEvent) {
    e.preventDefault();
    try { const r = await gqlRequest<{ sendFarmAdvice: { recipients: number } }>(SEND_ADVICE_MUTATION, { id: farmId, ...advice }); setMsg(`Advice sent to ${r.sendFarmAdvice.recipients} people.`); setAdvice({ title: '', message: '', priority: 'info' }); }
    catch (e: any) { setErr(e?.message); }
  }
  async function remove() {
    if (!confirm('Remove this farm from your caseload?')) return;
    try { await gqlRequest(REMOVE_FARM_MUTATION, { id: farmId }); onBack(); } catch (e: any) { setErr(e?.message); }
  }

  if (err) return <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{err}</div>;
  if (!d) return <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading farm…</div>;
  const s = d.summary;
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /> Caseload</button>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">{s.name} <PriorityBadge score={s.priorityScore} /></h2>
        <span className="text-sm text-slate-500">{s.district}, {s.province}</span>
        {s.directorPhone && <a href={`tel:${s.directorPhone}`} className="inline-flex items-center gap-1 text-sm text-emerald-700"><Phone className="w-3.5 h-3.5" />{s.directorName} · {s.directorPhone}</a>}
        <div className="flex-1" />
        <button onClick={() => setShowVisit(v => !v)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700"><Plus className="w-3.5 h-3.5" /> Log visit</button>
        <button onClick={remove} className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg text-xs hover:bg-slate-50"><Trash2 className="w-3.5 h-3.5" /> Remove</button>
      </div>
      {msg && <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700"><CheckCircle2 className="w-4 h-4" /> {msg}</div>}
      {showVisit && <VisitForm farmId={farmId} farms={[s]} onDone={() => { setShowVisit(false); setMsg('Visit logged.'); load(); }} reports={d.reports.filter(r => !r.isResolved)} />}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Enterprises" value={s.enterprises} />
        <Stat label="Active batches" value={s.activeBatches} />
        <Stat label="Open alerts" value={s.openAlerts} tone={s.criticalAlerts ? 'bad' : s.openAlerts ? 'warn' : 'default'} />
        <Stat label="Unresolved reports" value={s.unresolvedReports} tone={s.unresolvedReports ? 'warn' : 'default'} />
        <Stat label="Records (30d)" value={s.records30d} tone="good" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Farmer reports">
          {!d.reports.length ? <p className="text-sm text-slate-400">No reports.</p> : (
            <ul className="divide-y divide-slate-100">
              {d.reports.map(r => (
                <li key={r.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900">{r.title} <span className="text-xs text-slate-500">· {title(r.category)}{r.cropOrAnimal && ` · ${r.cropOrAnimal}`}</span></div>
                      {r.description && <div className="text-sm text-slate-600">{r.description}</div>}
                      {r.diagnosis && <div className="text-xs text-slate-600 mt-0.5">AI: {r.diagnosis}</div>}
                      <div className="text-[11px] text-slate-400 mt-0.5">{new Date(r.createdAt).toLocaleDateString()}</div>
                      {r.isResolved && r.resolutionNotes && <div className="text-xs text-green-700 mt-1 whitespace-pre-wrap">{r.resolutionNotes}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {r.severity && <Pill v={r.severity} />}
                      {r.isResolved ? <span className="text-[11px] text-green-700 font-semibold">Resolved</span>
                        : <button onClick={() => { setResolving(r.id); setNotes(''); }} className="text-[11px] text-emerald-700 font-semibold hover:underline">Resolve</button>}
                    </div>
                  </div>
                  {resolving === r.id && (
                    <div className="mt-2 flex gap-2">
                      <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="What was done / advised" className={inputCls} autoFocus />
                      <button onClick={() => resolve(r.id)} disabled={!notes.trim()} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium disabled:opacity-40">Save</button>
                      <button onClick={() => setResolving(null)} className="px-3 py-2 border border-slate-300 rounded-lg text-xs">Cancel</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="space-y-6">
          <Card title="Send advice to this farm">
            <form onSubmit={sendAdvice} className="space-y-2">
              <input value={advice.title} onChange={e => setAdvice(a => ({ ...a, title: e.target.value }))} placeholder="Title" required className={inputCls} />
              <textarea value={advice.message} onChange={e => setAdvice(a => ({ ...a, message: e.target.value }))} placeholder="Message" required rows={3} className={inputCls} />
              <div className="flex gap-2">
                <select value={advice.priority} onChange={e => setAdvice(a => ({ ...a, priority: e.target.value }))} className={`${inputCls} bg-white w-auto`}>
                  <option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option>
                </select>
                <button type="submit" className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium"><Send className="w-4 h-4" /> Send</button>
              </div>
            </form>
          </Card>
          <Card title="Recent AI diagnoses">
            {!d.diagnoses.length ? <p className="text-sm text-slate-400">None.</p> : (
              <ul className="space-y-1.5 text-sm">{d.diagnoses.slice(0, 8).map(x => (
                <li key={x.id} className="flex items-center gap-2"><Pill v={x.severity} /><span className="text-slate-800">{title(x.analysisType)}</span><span className="text-slate-500 truncate">{x.diagnosis}</span><span className="ml-auto text-[11px] text-slate-400 whitespace-nowrap">{new Date(x.createdAt).toLocaleDateString()}</span></li>
              ))}</ul>
            )}
          </Card>
          <Card title="Alerts">
            {!d.alerts.length ? <p className="text-sm text-slate-400">None.</p> : (
              <ul className="space-y-1.5 text-sm">{d.alerts.slice(0, 8).map(a => (
                <li key={a.id} className="flex items-center gap-2"><Pill v={a.severity} /><span className={a.isResolved ? 'line-through text-slate-400' : 'text-slate-800'}>{a.title}</span><span className="ml-auto text-[11px] text-slate-400">{title(a.source)}</span></li>
              ))}</ul>
            )}
          </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Enterprises">
          <ul className="divide-y divide-slate-100 text-sm">{d.enterprises.map(e => (
            <li key={e.id} className="py-2 flex justify-between"><span className="font-medium text-slate-800">{e.name}</span><span className="text-slate-500">{title(e.category)} · {e.productionType} · {e.activeBatches} active</span></li>
          ))}</ul>
        </Card>
        <Card title="Visit history"><VisitList visits={d.visits} /></Card>
      </div>
    </>
  );
}

// ─── Visits ──────────────────────────────────────────────────────────────────

function VisitForm({ farmId, farms, reports, onDone }: { farmId?: string; farms: { farmId: string; name: string }[]; reports?: { id: string; title: string }[]; onDone: () => void }) {
  const [f, setF] = useState({ farmId: farmId ?? farms[0]?.farmId ?? '', visitDate: today(), visitType: 'field_visit', purpose: '', findings: '', recommendations: '', followUpDate: '', farmerReportId: '', notifyFarm: true });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) => setF(x => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      await gqlRequest(LOG_VISIT_MUTATION, { input: { ...f, followUpDate: f.followUpDate || null, farmerReportId: f.farmerReportId || null } });
      onDone();
    } catch (e: any) { setErr(e?.message ?? 'Failed'); } finally { setBusy(false); }
  }
  return (
    <Card title="Log a visit">
      <form onSubmit={submit} className="grid md:grid-cols-2 gap-3">
        {!farmId && <select value={f.farmId} onChange={set('farmId')} className={`${inputCls} bg-white`} required>{farms.map(x => <option key={x.farmId} value={x.farmId}>{x.name}</option>)}</select>}
        <input type="date" value={f.visitDate} onChange={set('visitDate')} className={inputCls} required />
        <select value={f.visitType} onChange={set('visitType')} className={`${inputCls} bg-white`}>
          {[['field_visit', 'Field visit'], ['phone', 'Phone consultation'], ['video', 'Video consultation'], ['training', 'Training / field day'], ['follow_up', 'Follow-up']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input value={f.purpose} onChange={set('purpose')} placeholder="Purpose (e.g. Armyworm scouting)" className={`${inputCls} md:col-span-2`} required />
        <textarea value={f.findings} onChange={set('findings')} placeholder="Findings" rows={3} className={inputCls} />
        <textarea value={f.recommendations} onChange={set('recommendations')} placeholder="Recommendations (sent to the farm as a notification)" rows={3} className={inputCls} />
        <label className="text-xs text-slate-500">Follow-up date<input type="date" value={f.followUpDate} onChange={set('followUpDate')} className={`${inputCls} mt-1`} /></label>
        {reports && reports.length > 0 && (
          <label className="text-xs text-slate-500">Related farmer report
            <select value={f.farmerReportId} onChange={set('farmerReportId')} className={`${inputCls} mt-1 bg-white`}><option value="">—</option>{reports.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}</select>
          </label>
        )}
        {err && <p className="text-sm text-red-700 md:col-span-2">{err}</p>}
        <div className="md:col-span-2 flex items-center gap-3">
          <label className="text-xs text-slate-600 inline-flex items-center gap-1.5"><input type="checkbox" checked={f.notifyFarm} onChange={set('notifyFarm')} /> Notify farm of recommendations</label>
          <div className="flex-1" />
          <button type="submit" disabled={busy} className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save visit</button>
        </div>
      </form>
    </Card>
  );
}

function VisitList({ visits, onFollowUpDone }: { visits: ExtVisit[]; onFollowUpDone?: (id: string) => void }) {
  if (!visits.length) return <p className="text-sm text-slate-400">No visits logged.</p>;
  const t = today();
  return (
    <ul className="divide-y divide-slate-100">
      {visits.map(v => (
        <li key={v.id} className="py-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium text-slate-900">{v.purpose} <span className="text-xs text-slate-500">· {title(v.visitType)} · {v.farmName}</span></div>
              {v.findings && <div className="text-slate-600 mt-0.5"><span className="text-slate-400 text-xs">Findings:</span> {v.findings}</div>}
              {v.recommendations && <div className="text-slate-700 mt-0.5"><span className="text-slate-400 text-xs">Advice:</span> {v.recommendations}</div>}
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-slate-500">{v.visitDate}</div>
              {v.followUpDate && (v.followUpDone
                ? <div className="text-[11px] text-green-700">Follow-up done</div>
                : <div className={`text-[11px] ${v.followUpDate < t ? 'text-red-600 font-semibold' : 'text-amber-700'}`}>Follow-up {v.followUpDate}{v.followUpDate < t && ' · overdue'}
                    {onFollowUpDone && <button onClick={() => onFollowUpDone(v.id)} className="ml-2 text-emerald-700 underline">mark done</button>}
                  </div>)}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function VisitsView({ caseload, onChanged }: { caseload: CaseloadFarm[]; onChanged: () => void }) {
  const [visits, setVisits] = useState<ExtVisit[]>([]);
  const [pendingOnly, setPendingOnly] = useState(false);
  const [msg, setMsg] = useState('');
  const load = useCallback(() => gqlRequest<{ extensionVisits: ExtVisit[] }>(EXT_VISITS_QUERY, { pending: pendingOnly || null }).then(r => setVisits(r.extensionVisits)).catch(() => {}), [pendingOnly]);
  useEffect(() => { load(); }, [load]);
  async function done(id: string) { await gqlRequest(COMPLETE_FOLLOW_UP_MUTATION, { id }); load(); onChanged(); }
  return (
    <>
      {caseload.length ? <VisitForm farms={caseload} onDone={() => { setMsg('Visit logged.'); load(); onChanged(); }} />
        : <p className="text-sm text-slate-500">Add farms to your caseload before logging visits.</p>}
      {msg && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">{msg}</div>}
      <Card title={pendingOnly ? 'Pending follow-ups' : 'All visits'}
        action={<label className="text-xs text-slate-600 inline-flex items-center gap-1.5"><input type="checkbox" checked={pendingOnly} onChange={e => setPendingOnly(e.target.checked)} /> Pending follow-ups only</label>}>
        <VisitList visits={visits} onFollowUpDone={done} />
      </Card>
    </>
  );
}

// ─── Add farms ───────────────────────────────────────────────────────────────

function AddFarmsView({ onChanged }: { onChanged: () => void }) {
  const [search, setSearch] = useState('');
  const [farms, setFarms] = useState<AvailableFarm[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const load = useCallback(() => gqlRequest<{ extensionAvailableFarms: AvailableFarm[] }>(EXT_AVAILABLE_QUERY, { search: search || null }).then(r => setFarms(r.extensionAvailableFarms)).catch(() => {}), [search]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  async function add(id: string, name: string) {
    setBusy(id);
    try { await gqlRequest(ASSIGN_FARM_MUTATION, { id }); setMsg(`${name} added to your caseload — the farm has been notified.`); load(); onChanged(); }
    catch (e: any) { setMsg(e?.message ?? 'Failed'); } finally { setBusy(null); }
  }
  return (
    <Card title="Farms in your area that opted in to data sharing">
      <div className="relative mb-4"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by farm name" className={`${inputCls} pl-9`} /></div>
      {msg && <p className="text-sm text-emerald-700 mb-3">{msg}</p>}
      {!farms.length ? <p className="text-sm text-slate-400 text-center py-6">No more farms available in your working area.</p> : (
        <ul className="divide-y divide-slate-100">
          {farms.map(f => (
            <li key={f.farmId} className="py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0"><div className="font-medium text-slate-900">{f.name}</div><div className="text-xs text-slate-500">{f.district}, {f.province} · {f.enterprises} enterprises{f.unresolvedReports ? ` · ${f.unresolvedReports} open reports` : ''}</div></div>
              <button onClick={() => add(f.farmId, f.name)} disabled={busy === f.farmId} className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">{busy === f.farmId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add to caseload</button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
