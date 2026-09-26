// ─────────────────────────────────────────────────────────────────────────────
// Results framework (logframe) tab — goal → outcomes → outputs → activities,
// indicators with baseline / target / MoV / disaggregation, auto-computed
// indicators, disaggregated manual readings. Also exports the participant
// household profile form used by the Participants tab and by farm settings.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, Loader2, CheckCircle2, X, Zap, ChevronRight } from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import {
  LOGFRAME_QUERY, UPSERT_RESULT_MUTATION, DELETE_RESULT_MUTATION, UPSERT_INDICATOR_MUTATION, DELETE_INDICATOR_MUTATION, RECORD_READING_MUTATION, SET_PROFILE_MUTATION,
  type ResultNode, type LogframeIndicator, type ParticipantProfile,
} from '@/graphql/partnerQueries';

const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm';
const fmt = (n: number | null | undefined, d = 2) => n == null ? '—' : Number(n).toLocaleString(undefined, { maximumFractionDigits: d });
const today = () => new Date().toISOString().slice(0, 10);
const parse = (v: any): Record<string, Record<string, number>> => (typeof v === 'string' ? JSON.parse(v) : v) ?? {};
const LEVELS: [ResultNode['level'], string, string][] = [['goal', 'Goal / impact', 'bg-slate-800 text-white'], ['outcome', 'Outcome', 'bg-violet-100 text-violet-800'], ['output', 'Output', 'bg-sky-100 text-sky-800'], ['activity', 'Activity', 'bg-emerald-100 text-emerald-800']];
const CHILD: Record<string, ResultNode['level'] | null> = { goal: 'outcome', outcome: 'output', output: 'activity', activity: null };
const DIMS: [string, string][] = [['sex', 'Sex'], ['age', 'Age (youth ≤ 35)'], ['participant_type', 'Participant type'], ['district', 'District']];
const CAT_LABEL: Record<string, string> = { F: 'Women', M: 'Men', X: 'Other', unknown: 'Not recorded', youth: 'Youth', adult: 'Adult', senior: 'Senior', farmer: 'Farms', cooperative: 'Cooperatives', agro_dealer: 'Agro dealers', vet_provider: 'Vets', equipment_hire: 'Equipment hire', agrifood_seller: 'AgriFood sellers', agrisupply_provider: 'AgriSupply', agriservices_provider: 'AgriServices', processor: 'Processors', transport: 'Transport' };
const cat = (k: string) => CAT_LABEL[k] ?? k;
type Msg = { ok: boolean; text: string };

function Breakdown({ bd }: { bd: any }) {
  const b = parse(bd);
  const dims = Object.keys(b).filter(d => Object.keys(b[d]).length);
  if (!dims.length) return null;
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
      {dims.map(d => <span key={d} className="text-[11px] text-slate-600"><span className="text-slate-400 uppercase tracking-wide mr-1">{DIMS.find(x => x[0] === d)?.[1] ?? d}</span>{Object.entries(b[d]).map(([k, v]) => `${cat(k)} ${fmt(v as number, 1)}`).join(' · ')}</span>)}
    </div>
  );
}

function Progress({ pct }: { pct: number | null }) {
  if (pct == null) return null;
  return <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1"><div className={`h-full ${pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-sky-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} /></div>;
}

// ─── Result node form ────────────────────────────────────────────────────────

function ResultForm({ programmeId, level, parentId, existing, onDone, onCancel }: { programmeId: string; level: ResultNode['level']; parentId: string | null; existing?: ResultNode; onDone: (m: Msg) => void; onCancel: () => void }) {
  const [f, setF] = useState({ code: existing?.code ?? '', statement: existing?.statement ?? '', assumptions: existing?.assumptions ?? '' });
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try { await gqlRequest(UPSERT_RESULT_MUTATION, { p: programmeId, id: existing?.id ?? null, in: { level, parentId, code: f.code, statement: f.statement, assumptions: f.assumptions } }); onDone({ ok: true, text: `${LEVELS.find(l => l[0] === level)?.[1]} saved.` }); }
    catch (err: any) { onDone({ ok: false, text: err?.message }); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="grid md:grid-cols-[90px_1fr] gap-2 bg-slate-50 rounded-xl p-3 border border-slate-200">
      <input value={f.code} onChange={e => setF({ ...f, code: e.target.value })} placeholder="Code 1.1" className={inputCls} />
      <input value={f.statement} onChange={e => setF({ ...f, statement: e.target.value })} placeholder={`${LEVELS.find(l => l[0] === level)?.[1]} statement`} className={inputCls} required autoFocus />
      <input value={f.assumptions} onChange={e => setF({ ...f, assumptions: e.target.value })} placeholder="Assumptions / risks (optional)" className={`${inputCls} md:col-span-2`} />
      <div className="md:col-span-2 flex gap-2 justify-end"><button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button><button type="submit" disabled={busy} className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}</button></div>
    </form>
  );
}

// ─── Indicator form ──────────────────────────────────────────────────────────

function IndicatorForm({ programmeId, resultId, results, autoSources, existing, onDone, onCancel }: { programmeId: string; resultId: string | null; results: ResultNode[]; autoSources: [string, string][]; existing?: LogframeIndicator; onDone: (m: Msg) => void; onCancel: () => void }) {
  const [f, setF] = useState({
    label: existing?.label ?? '', unit: existing?.unit ?? '', resultId: existing?.resultId ?? resultId ?? '', baseline: existing?.baseline == null ? '' : String(existing.baseline), baselineDate: existing?.baselineDate ?? '',
    target: existing?.target == null ? '' : String(existing.target), targetDate: existing?.targetDate ?? '', meansOfVerification: existing?.meansOfVerification ?? '', dataSource: existing?.dataSource ?? '',
    disaggregations: existing?.disaggregations ?? ['sex', 'age'], autoSource: existing?.autoSource ?? '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) => setF(x => ({ ...x, [k]: e.target.value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      await gqlRequest(UPSERT_INDICATOR_MUTATION, { p: programmeId, id: existing?.id ?? null, in: {
        key: existing?.key, label: f.label, unit: f.unit, resultId: f.resultId || null, baseline: f.baseline === '' ? null : Number(f.baseline), baselineDate: f.baselineDate || null,
        target: f.target === '' ? null : Number(f.target), targetDate: f.targetDate || null, meansOfVerification: f.meansOfVerification, dataSource: f.dataSource, disaggregations: f.disaggregations, autoSource: f.autoSource } });
      onDone({ ok: true, text: 'Indicator saved.' });
    } catch (err: any) { onDone({ ok: false, text: err?.message }); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="grid md:grid-cols-4 gap-2 bg-amber-50/60 rounded-xl p-3 border border-amber-200">
      <input value={f.label} onChange={set('label')} placeholder="Indicator (e.g. Farmers trained in GAP)" className={`${inputCls} md:col-span-3`} required autoFocus />
      <input value={f.unit} onChange={set('unit')} placeholder="Unit" className={inputCls} />
      <select value={f.resultId} onChange={set('resultId')} className={`${inputCls} bg-white md:col-span-2`}><option value="">Not linked to a result</option>{results.map(r => <option key={r.id} value={r.id}>{LEVELS.find(l => l[0] === r.level)?.[1]} {r.code} — {r.statement}</option>)}</select>
      <select value={f.autoSource} onChange={set('autoSource')} className={`${inputCls} bg-white md:col-span-2`}><option value="">Manual readings</option>{autoSources.map(([k, l]) => <option key={k} value={k}>⚡ Computed: {l}</option>)}</select>
      <label className="text-[11px] text-slate-500">Baseline<input type="number" step="any" value={f.baseline} onChange={set('baseline')} className={`${inputCls} mt-0.5`} /></label>
      <label className="text-[11px] text-slate-500">Baseline date<input type="date" value={f.baselineDate} onChange={set('baselineDate')} className={`${inputCls} mt-0.5`} /></label>
      <label className="text-[11px] text-slate-500">Target<input type="number" step="any" value={f.target} onChange={set('target')} className={`${inputCls} mt-0.5`} /></label>
      <label className="text-[11px] text-slate-500">Target date<input type="date" value={f.targetDate} onChange={set('targetDate')} className={`${inputCls} mt-0.5`} /></label>
      <input value={f.meansOfVerification} onChange={set('meansOfVerification')} placeholder="Means of verification (e.g. training registers)" className={`${inputCls} md:col-span-2`} />
      <input value={f.dataSource} onChange={set('dataSource')} placeholder="Data source / responsible" className={`${inputCls} md:col-span-2`} />
      <div className="md:col-span-4 flex flex-wrap items-center gap-2 text-xs"><span className="text-slate-500">Disaggregate by:</span>
        {DIMS.map(([k, l]) => <button type="button" key={k} onClick={() => setF(x => ({ ...x, disaggregations: x.disaggregations.includes(k) ? x.disaggregations.filter(d => d !== k) : [...x.disaggregations, k] }))} className={`px-2.5 py-1 rounded-full border ${f.disaggregations.includes(k) ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-300 text-slate-600'}`}>{l}</button>)}
        <div className="flex-1" /><button type="button" onClick={onCancel} className="px-3 py-1.5 text-slate-600">Cancel</button><button type="submit" disabled={busy} className="px-3 py-1.5 bg-sky-600 text-white rounded-lg font-medium disabled:opacity-50">{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save indicator'}</button></div>
    </form>
  );
}

// ─── Reading form (with disaggregation) ──────────────────────────────────────

function ReadingForm({ programmeId, ind, onDone, onCancel }: { programmeId: string; ind: LogframeIndicator; onDone: (m: Msg) => void; onCancel: () => void }) {
  const [period, setPeriod] = useState(today());
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [bd, setBd] = useState<Record<string, Record<string, string>>>(() => Object.fromEntries(ind.disaggregations.map(d => [d, {}])));
  const [busy, setBusy] = useState(false);
  const cats: Record<string, string[]> = { sex: ['F', 'M', 'X'], age: ['youth', 'adult', 'senior'], participant_type: ['farmer', 'cooperative', 'agro_dealer', 'vet_provider', 'equipment_hire', 'processor', 'transport'], district: [] };
  const sum = (d: string) => Object.values(bd[d] ?? {}).reduce((a, v) => a + (Number(v) || 0), 0);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const dis: Record<string, Record<string, number>> = {};
    for (const d of Object.keys(bd)) { const o: Record<string, number> = {}; for (const [k, v] of Object.entries(bd[d])) if (v !== '' && k) o[k] = Number(v); if (Object.keys(o).length) dis[d] = o; }
    try { await gqlRequest(RECORD_READING_MUTATION, { p: programmeId, k: ind.key, d: period, v: Number(value), n: notes, dis: Object.keys(dis).length ? JSON.stringify(dis) : null }); onDone({ ok: true, text: 'Reading recorded.' }); }
    catch (err: any) { onDone({ ok: false, text: err?.message }); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="bg-white rounded-xl p-3 border border-sky-200 space-y-2">
      <div className="text-sm font-medium text-slate-800">Record reading — {ind.label}{ind.unit && <span className="text-slate-400"> ({ind.unit})</span>}</div>
      <div className="grid md:grid-cols-3 gap-2">
        <label className="text-[11px] text-slate-500">Period end<input type="date" value={period} onChange={e => setPeriod(e.target.value)} className={`${inputCls} mt-0.5`} required /></label>
        <label className="text-[11px] text-slate-500">Total value<input type="number" step="any" value={value} onChange={e => setValue(e.target.value)} className={`${inputCls} mt-0.5`} required /></label>
        <label className="text-[11px] text-slate-500">Source / notes<input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. crop-cut survey, 40 plots" className={`${inputCls} mt-0.5`} /></label>
      </div>
      {ind.disaggregations.map(d => (
        <div key={d} className="flex flex-wrap items-end gap-2 text-xs">
          <span className="text-slate-500 w-28">{DIMS.find(x => x[0] === d)?.[1]}</span>
          {(cats[d].length ? cats[d] : Object.keys(bd[d] ?? {})).map(c => <label key={c} className="text-[11px] text-slate-500">{cat(c)}<input type="number" step="any" value={bd[d]?.[c] ?? ''} onChange={e => setBd(x => ({ ...x, [d]: { ...x[d], [c]: e.target.value } }))} className={`${inputCls} w-24 mt-0.5`} /></label>)}
          {d === 'district' && <input placeholder="District name" className={`${inputCls} w-36`} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = (e.target as HTMLInputElement).value.trim(); if (v) { setBd(x => ({ ...x, district: { ...x.district, [v]: '' } })); (e.target as HTMLInputElement).value = ''; } } }} />}
          {(d === 'sex' || d === 'age') && value !== '' && sum(d) > 0 && <span className={`text-[11px] ${Math.abs(sum(d) - Number(value)) < 0.01 ? 'text-green-700' : 'text-red-600'}`}>= {fmt(sum(d))} of {fmt(Number(value))}</span>}
        </div>
      ))}
      <div className="flex gap-2 justify-end"><button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button><button type="submit" disabled={busy} className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Record</button></div>
    </form>
  );
}

// ─── Indicator row ───────────────────────────────────────────────────────────

function IndicatorRow({ ind, programmeId, results, autoSources, canEdit, onMsg, onChanged }: { ind: LogframeIndicator; programmeId: string; results: ResultNode[]; autoSources: [string, string][]; canEdit: boolean; onMsg: (m: Msg) => void; onChanged: () => void }) {
  const [mode, setMode] = useState<'view' | 'edit' | 'reading'>('view');
  if (mode === 'edit') return <IndicatorForm programmeId={programmeId} resultId={ind.resultId} results={results} autoSources={autoSources} existing={ind} onDone={m => { onMsg(m); if (m.ok) { setMode('view'); onChanged(); } }} onCancel={() => setMode('view')} />;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm"><span className="font-medium text-slate-900">{ind.label}</span>{ind.autoSource && <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><Zap className="w-3 h-3" /> computed</span>}{ind.meansOfVerification && <span className="text-[11px] text-slate-400">MoV: {ind.meansOfVerification}</span>}</div>
          <div className="text-xs text-slate-500 mt-0.5 tabular-nums">Baseline {fmt(ind.baseline)}{ind.baselineDate && ` (${ind.baselineDate})`} → Target {fmt(ind.target)}{ind.targetDate && ` by ${ind.targetDate}`} · <span className="font-semibold text-slate-800">Achieved {fmt(ind.value)}</span> {ind.unit}{ind.period && ` as of ${ind.period}`}{ind.progressPct != null && ` · ${fmt(ind.progressPct, 0)}%`}</div>
          <Progress pct={ind.progressPct} />
          <Breakdown bd={ind.breakdown} />
        </div>
        {canEdit && <div className="flex items-center gap-1 flex-shrink-0">
          {!ind.autoSource && <button onClick={() => setMode('reading')} className="px-2 py-1 rounded-lg bg-sky-600 text-white text-[11px] font-medium">+ Reading</button>}
          <button onClick={() => setMode('edit')} className="p-1.5 rounded hover:bg-slate-100" aria-label="Edit indicator"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
          <button onClick={async () => { if (!confirm(`Delete indicator "${ind.label}" and its readings?`)) return; try { await gqlRequest(DELETE_INDICATOR_MUTATION, { id: ind.id }); onChanged(); } catch (e: any) { onMsg({ ok: false, text: e?.message }); } }} className="p-1.5 rounded hover:bg-red-50" aria-label="Delete indicator"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
        </div>}
      </div>
      {mode === 'reading' && <div className="mt-2"><ReadingForm programmeId={programmeId} ind={ind} onDone={m => { onMsg(m); if (m.ok) { setMode('view'); onChanged(); } }} onCancel={() => setMode('view')} /></div>}
    </div>
  );
}

// ─── Tree ────────────────────────────────────────────────────────────────────

function Node({ node, all, indicators, programmeId, autoSources, canEdit, onMsg, onChanged, depth }: { node: ResultNode; all: ResultNode[]; indicators: LogframeIndicator[]; programmeId: string; autoSources: [string, string][]; canEdit: boolean; onMsg: (m: Msg) => void; onChanged: () => void; depth: number }) {
  const [adding, setAdding] = useState<'child' | 'indicator' | 'edit' | null>(null);
  const children = all.filter(r => r.parentId === node.id);
  const mine = indicators.filter(i => i.resultId === node.id);
  const lv = LEVELS.find(l => l[0] === node.level)!;
  const childLevel = CHILD[node.level];
  return (
    <div className={depth ? 'ml-5 pl-4 border-l-2 border-slate-200' : ''}>
      {adding === 'edit' ? <ResultForm programmeId={programmeId} level={node.level} parentId={node.parentId} existing={node} onDone={m => { onMsg(m); if (m.ok) { setAdding(null); onChanged(); } }} onCancel={() => setAdding(null)} /> : (
        <div className="flex items-start gap-2 py-1.5 group">
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${lv[2]} mt-0.5 whitespace-nowrap`}>{lv[1]}{node.code && ` ${node.code}`}</span>
          <div className="flex-1 min-w-0"><div className="text-sm text-slate-900">{node.statement}</div>{node.assumptions && <div className="text-[11px] text-slate-500 italic">Assumptions: {node.assumptions}</div>}</div>
          {canEdit && <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100">
            <button onClick={() => setAdding('indicator')} className="text-[11px] px-2 py-1 rounded-lg border border-amber-300 text-amber-800 bg-amber-50 whitespace-nowrap">+ Indicator</button>
            {childLevel && <button onClick={() => setAdding('child')} className="text-[11px] px-2 py-1 rounded-lg border border-slate-300 text-slate-700 whitespace-nowrap">+ {LEVELS.find(l => l[0] === childLevel)?.[1]}</button>}
            <button onClick={() => setAdding('edit')} className="p-1.5 rounded hover:bg-slate-100" aria-label="Edit result"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
            <button onClick={async () => { if (!confirm(`Delete this ${node.level} and everything under it?`)) return; try { await gqlRequest(DELETE_RESULT_MUTATION, { id: node.id }); onChanged(); } catch (e: any) { onMsg({ ok: false, text: e?.message }); } }} className="p-1.5 rounded hover:bg-red-50" aria-label="Delete result"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
          </div>}
        </div>
      )}
      {mine.length > 0 && <div className="ml-2 space-y-2 mb-2">{mine.map(i => <IndicatorRow key={i.id} ind={i} programmeId={programmeId} results={all} autoSources={autoSources} canEdit={canEdit} onMsg={onMsg} onChanged={onChanged} />)}</div>}
      {adding === 'indicator' && <div className="ml-2 mb-2"><IndicatorForm programmeId={programmeId} resultId={node.id} results={all} autoSources={autoSources} onDone={m => { onMsg(m); if (m.ok) { setAdding(null); onChanged(); } }} onCancel={() => setAdding(null)} /></div>}
      {adding === 'child' && childLevel && <div className="ml-5 mb-2"><ResultForm programmeId={programmeId} level={childLevel} parentId={node.id} onDone={m => { onMsg(m); if (m.ok) { setAdding(null); onChanged(); } }} onCancel={() => setAdding(null)} /></div>}
      {children.map(c => <Node key={c.id} node={c} all={all} indicators={indicators} programmeId={programmeId} autoSources={autoSources} canEdit={canEdit} onMsg={onMsg} onChanged={onChanged} depth={depth + 1} />)}
    </div>
  );
}

// ─── Tab ─────────────────────────────────────────────────────────────────────

export default function Logframe({ programmeId, canEdit, onMsg, onChanged }: { programmeId: string; canEdit: boolean; onMsg: (m: Msg) => void; onChanged?: () => void }) {
  const [data, setData] = useState<{ results: ResultNode[]; indicators: LogframeIndicator[]; autoSources: [string, string][] } | null>(null);
  const [adding, setAdding] = useState<'goal' | 'outcome' | 'indicator' | null>(null);
  const load = useCallback(() => gqlRequest<{ programmeLogframe: any }>(LOGFRAME_QUERY, { p: programmeId }).then(r => setData({ ...r.programmeLogframe, autoSources: parse(r.programmeLogframe.autoSources) as any })).catch(e => onMsg({ ok: false, text: e?.message })), [programmeId, onMsg]);
  useEffect(() => { load(); }, [load]);
  const changed = () => { load(); onChanged?.(); };
  const roots = useMemo(() => (data?.results ?? []).filter(r => !r.parentId), [data]);
  const unlinked = useMemo(() => (data?.indicators ?? []).filter(i => !i.resultId), [data]);
  if (!data) return <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading results framework…</div>;
  const women = data.indicators.find(i => i.autoSource === 'participants_women');
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0"><h3 className="font-semibold text-slate-800">Results framework</h3><p className="text-xs text-slate-500">Goal → outcomes → outputs → activities, each with indicators (baseline, target, means of verification). Computed indicators update themselves from participants’ platform records, broken down by sex, age, participant type and district.</p></div>
        {canEdit && <div className="flex gap-2">
          {!roots.some(r => r.level === 'goal') && <button onClick={() => setAdding('goal')} className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium"><Plus className="w-3.5 h-3.5" /> Goal</button>}
          <button onClick={() => setAdding('outcome')} className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"><Plus className="w-3.5 h-3.5" /> Outcome</button>
          <button onClick={() => setAdding('indicator')} className="inline-flex items-center gap-1 px-3 py-1.5 border border-amber-300 bg-amber-50 text-amber-800 rounded-lg text-xs font-medium"><Plus className="w-3.5 h-3.5" /> Indicator</button>
        </div>}
      </div>
      {adding === 'goal' && <ResultForm programmeId={programmeId} level="goal" parentId={null} onDone={m => { onMsg(m); if (m.ok) { setAdding(null); changed(); } }} onCancel={() => setAdding(null)} />}
      {adding === 'outcome' && <ResultForm programmeId={programmeId} level="outcome" parentId={roots.find(r => r.level === 'goal')?.id ?? null} onDone={m => { onMsg(m); if (m.ok) { setAdding(null); changed(); } }} onCancel={() => setAdding(null)} />}
      {adding === 'indicator' && <IndicatorForm programmeId={programmeId} resultId={null} results={data.results} autoSources={data.autoSources} onDone={m => { onMsg(m); if (m.ok) { setAdding(null); changed(); } }} onCancel={() => setAdding(null)} />}
      {!roots.length && !data.indicators.length && <p className="text-sm text-slate-400 py-4 text-center">No results framework yet. Start with the goal, add outcomes and outputs, then attach indicators — or add a computed indicator such as “Participants enrolled” straight away.</p>}
      <div className="space-y-1">{roots.map(r => <Node key={r.id} node={r} all={data.results} indicators={data.indicators} programmeId={programmeId} autoSources={data.autoSources} canEdit={canEdit} onMsg={onMsg} onChanged={changed} depth={0} />)}</div>
      {unlinked.length > 0 && <div><div className="text-[11px] uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1"><ChevronRight className="w-3 h-3" /> Indicators not linked to a result</div><div className="space-y-2">{unlinked.map(i => <IndicatorRow key={i.id} ind={i} programmeId={programmeId} results={data.results} autoSources={data.autoSources} canEdit={canEdit} onMsg={onMsg} onChanged={changed} />)}</div></div>}
      {!women && canEdit && data.indicators.length > 0 && <p className="text-[11px] text-slate-400">Tip: add computed indicators “Women-headed participants” and “Youth-headed participants” — donors ask for both.</p>}
    </section>
  );
}

// ─── Participant household profile form ──────────────────────────────────────

export function ParticipantProfileForm({ organizationId, existing, onSaved, onCancel, compact }: { organizationId?: string; existing?: ParticipantProfile | null; onSaved: (p: ParticipantProfile) => void; onCancel?: () => void; compact?: boolean }) {
  const [f, setF] = useState({ headSex: existing?.headSex ?? '', headBirthYear: existing?.headBirthYear ? String(existing.headBirthYear) : '', householdSize: existing?.householdSize ? String(existing.householdSize) : '', femaleMembers: existing?.femaleMembers ? String(existing.femaleMembers) : '', maleMembers: existing?.maleMembers ? String(existing.maleMembers) : '', disability: existing?.disability ?? false, landHa: existing?.landHa ? String(existing.landHa) : '', nationalId: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) => setF(x => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const num = (v: string) => v === '' ? null : Number(v);
    try {
      const r = await gqlRequest<{ setParticipantProfile: { profile: ParticipantProfile } }>(SET_PROFILE_MUTATION, { o: organizationId ?? null, in: { headSex: f.headSex, headBirthYear: num(f.headBirthYear), householdSize: num(f.householdSize), femaleMembers: num(f.femaleMembers), maleMembers: num(f.maleMembers), disability: f.disability, landHa: num(f.landHa), nationalId: f.nationalId || null } });
      onSaved(r.setParticipantProfile.profile);
    } catch (e: any) { setErr(e?.message ?? 'Failed'); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-2 text-xs`}>
      <label className="text-slate-500">Head of household<select value={f.headSex} onChange={set('headSex')} className={`${inputCls} mt-0.5 bg-white`}><option value="">Sex — not recorded</option><option value="F">Female</option><option value="M">Male</option><option value="X">Other / prefer not to say</option></select></label>
      <label className="text-slate-500">Year of birth<input type="number" value={f.headBirthYear} onChange={set('headBirthYear')} placeholder="e.g. 1990" className={`${inputCls} mt-0.5`} /></label>
      <label className="text-slate-500">Household size<input type="number" min="0" value={f.householdSize} onChange={set('householdSize')} className={`${inputCls} mt-0.5`} /></label>
      <label className="text-slate-500">Land (ha)<input type="number" step="any" min="0" value={f.landHa} onChange={set('landHa')} className={`${inputCls} mt-0.5`} /></label>
      <label className="text-slate-500">Female members<input type="number" min="0" value={f.femaleMembers} onChange={set('femaleMembers')} className={`${inputCls} mt-0.5`} /></label>
      <label className="text-slate-500">Male members<input type="number" min="0" value={f.maleMembers} onChange={set('maleMembers')} className={`${inputCls} mt-0.5`} /></label>
      <label className="text-slate-500">National ID (stored hashed)<input value={f.nationalId} onChange={set('nationalId')} placeholder={existing?.hasNationalId ? 'On file — enter to replace' : 'Optional, for de-duplication'} className={`${inputCls} mt-0.5`} /></label>
      <label className="flex items-center gap-2 text-slate-700 self-end pb-2"><input type="checkbox" checked={f.disability} onChange={set('disability')} className="accent-sky-600" /> Household includes a person with a disability</label>
      {err && <div className="col-span-full text-red-600">{err}</div>}
      <div className="col-span-full flex justify-end gap-2">{onCancel && <button type="button" onClick={onCancel} className="px-3 py-1.5 text-slate-600">Cancel</button>}<button type="submit" disabled={busy} className="px-3 py-1.5 bg-sky-600 text-white rounded-lg font-medium disabled:opacity-50">{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save profile'}</button></div>
    </form>
  );
}

export function ProfileModal({ organizationId, name, onClose, onSaved }: { organizationId: string; name: string; onClose: () => void; onSaved: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-slate-800">Household profile — {name}</h3><button onClick={onClose} className="p-1 rounded hover:bg-slate-100" aria-label="Close"><X className="w-4 h-4 text-slate-500" /></button></div>
        <p className="text-xs text-slate-500 mb-3">Used only for disaggregated programme results (women, youth, household members reached). The participant can also fill this in from their own settings.</p>
        <ParticipantProfileForm organizationId={organizationId} onSaved={() => { onSaved(); onClose(); }} onCancel={onClose} />
      </div>
    </div>
  );
}
