// ─────────────────────────────────────────────────────────────────────────────
// Supporting Partner Dashboard (FAO / donor / NGO)
// Programmes list → programme workspace: results, enrolled farms, support
// ledger, M&E indicators, notices.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Plus, RefreshCw, Search, Send, X, FileDown } from 'lucide-react';
import { mediaUrl } from '@/graphql/tradeQueries';
import { gqlRequest } from '@/lib/api';
import ProgrammeMap, { DistrictPicker } from '@/pages/partner/ProgrammeMap';
import Logframe, { ProfileModal } from '@/pages/partner/Logframe';
import { useAuth } from '@/contexts/AuthContext';
import {
  PARTNER_HOME_QUERY, PROGRAMME_QUERY, ELIGIBLE_QUERY, CREATE_PROGRAMME_MUTATION, UPDATE_PROGRAMME_MUTATION,
  ENROLL_FARM_MUTATION, UPDATE_ENROLLMENT_MUTATION, RECORD_SUPPORT_MUTATION, RECORD_READING_MUTATION, SEND_NOTICE_MUTATION, PROGRAMME_REPORT_MUTATION,
  type Programme, type PartnerOverview, type EnrolledFarm, type EligibleFarm, type Support, type SupportByType,
  type ProgrammeDistrict, type IndicatorReading,
} from '@/graphql/partnerQueries';

const title = (s: string) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const fmt = (n: number, d = 0) => Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: d });
const today = () => new Date().toISOString().slice(0, 10);
const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm';
const STATUS_CLS: Record<string, string> = { active: 'bg-green-100 text-green-700', planning: 'bg-sky-100 text-sky-700', closed: 'bg-slate-100 text-slate-600', suspended: 'bg-amber-100 text-amber-700', completed: 'bg-slate-100 text-slate-600', withdrawn: 'bg-red-100 text-red-700' };
const SUPPORT_TYPES = [['input_voucher', 'Input voucher'], ['seed', 'Seed / seedlings'], ['fertiliser', 'Fertiliser'], ['livestock', 'Livestock / fingerlings / chicks'], ['equipment', 'Equipment / tools'], ['cash_grant', 'Cash grant'], ['training', 'Training'], ['extension', 'Extension service'], ['market_link', 'Market linkage'], ['working_capital', 'Working capital / grant'], ['certification', 'Certification support'], ['digital_tools', 'Digital tools / devices'], ['cold_chain', 'Cold chain / storage'], ['other', 'Other']];
const CATEGORIES = ['crop', 'livestock', 'aquaculture', 'horticulture', 'dairy', 'apiculture', 'greenhouse', 'mixed'];
const PARTICIPANT_TYPES: [string, string][] = [['farmer', 'Farms'], ['cooperative', 'Cooperatives'], ['agro_dealer', 'Agro dealers'], ['vet_provider', 'Vets'], ['equipment_hire', 'Equipment hire'], ['agrifood_seller', 'AgriFood sellers'], ['agrisupply_provider', 'AgriSupply'], ['agriservices_provider', 'AgriServices'], ['processor', 'Processors'], ['transport', 'Transport']];
const ptLabel = (v: string) => PARTICIPANT_TYPES.find(([k]) => k === v)?.[1] ?? title(v);
const parseByType = (v: any): Record<string, number> => (typeof v === 'string' ? JSON.parse(v) : v) ?? {};

// ─── Shared ──────────────────────────────────────────────────────────────────

function Card({ title: t, children, className = '', action }: { title?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={`bg-white rounded-2xl border border-slate-200 p-5 ${className}`}>
      {(t || action) && <div className="flex items-center justify-between mb-4 gap-3"><h3 className="font-semibold text-slate-800">{t}</h3>{action}</div>}
      {children}
    </section>
  );
}
function Stat({ label, value, sub, tone = 'default' }: { label: string; value: string | number; sub?: string; tone?: 'default' | 'warn' | 'good' | 'bad' }) {
  const ring = { default: 'border-slate-200', warn: 'border-amber-300', good: 'border-green-300', bad: 'border-red-300' }[tone];
  return <div className={`bg-white rounded-2xl border ${ring} p-4`}><div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div><div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{value}</div>{sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}</div>;
}
function Pill({ v }: { v: string }) { return <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_CLS[v] ?? 'bg-slate-100 text-slate-600'}`}>{title(v)}</span>; }
function Progress({ pct, tone = 'sky' }: { pct: number; tone?: 'sky' | 'green' | 'amber' }) {
  const c = { sky: 'bg-sky-500', green: 'bg-green-500', amber: 'bg-amber-500' }[tone];
  return <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full ${c}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} /></div>;
}
function Msg({ m }: { m: { ok: boolean; text: string } | null }) {
  if (!m) return null;
  return <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${m.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{m.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {m.text}</div>;
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function PartnerDashboard() {
  const [overview, setOverview] = useState<PartnerOverview | null>(null);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const r = await gqlRequest<{ partnerOverview: PartnerOverview; partnerProgrammes: Programme[] }>(PARTNER_HOME_QUERY); setOverview(r.partnerOverview); setProgrammes(r.partnerProgrammes); }
    catch (e: any) { setError(e?.message ?? 'Failed to load'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 flex items-center gap-4">
        <div className="flex-1 min-w-0"><h1 className="text-lg font-bold text-slate-900">Programmes</h1><p className="text-xs text-slate-500">Enrol farms and vendors, deliver support, track results</p></div>
        {!selected && !creating && <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1 px-3 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700"><Plus className="w-4 h-4" /> New programme</button>}
        <button onClick={load} className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50" aria-label="Refresh"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </header>
      <main className="p-6 space-y-6">
        {error && <Msg m={{ ok: false, text: error }} />}
        {creating ? <ProgrammeForm onCancel={() => setCreating(false)} onSaved={id => { setCreating(false); load(); setSelected(id); }} />
          : selected ? <ProgrammeWorkspace id={selected} onBack={() => { setSelected(null); load(); }} />
          : <ProgrammeList overview={overview} programmes={programmes} onOpen={setSelected} />}
      </main>
    </div>
  );
}

// ─── List ────────────────────────────────────────────────────────────────────

function ProgrammeList({ overview, programmes, onOpen }: { overview: PartnerOverview | null; programmes: Programme[]; onOpen: (id: string) => void }) {
  return (
    <>
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Stat label="Programmes" value={overview.programmes} sub={`${overview.activeProgrammes} active`} />
          <Stat label="Participants enrolled" value={fmt(overview.farmsEnrolled)} tone="good" />
          <Stat label="Districts reached" value={overview.districtsReached} />
          <Stat label="Total budget" value={fmt(overview.totalBudget)} />
          <Stat label="Support delivered" value={fmt(overview.supportValue)} sub="value of all support records" />
          <Stat label="Budget used" value={overview.totalBudget ? `${fmt(overview.supportValue / overview.totalBudget * 100, 1)}%` : '—'} />
        </div>
      )}
      <Card title="Your programmes">
        {!programmes.length ? <p className="text-sm text-slate-400 text-center py-8">No programmes yet. Create one to start enrolling farms and vendors.</p> : (
          <div className="grid md:grid-cols-2 gap-4">
            {programmes.map(p => (
              <button key={p.id} onClick={() => onOpen(p.id)} className="text-left rounded-xl border border-slate-200 p-4 hover:border-sky-300 hover:bg-sky-50/40 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><div className="font-semibold text-slate-900 truncate">{p.name}</div><div className="text-xs text-slate-500">{p.funder && `${p.funder} · `}{p.code && `${p.code} · `}{p.startDate}{p.endDate && ` → ${p.endDate}`}</div></div>
                  <Pill v={p.status} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div><div className="text-slate-500">Enrolled</div><div className="font-semibold text-slate-900 tabular-nums">{p.results.farmsEnrolled}{p.targetFarms ? ` / ${p.targetFarms}` : ''}</div></div>
                  <div><div className="text-slate-500">Support</div><div className="font-semibold text-slate-900 tabular-nums">{p.currency} {fmt(p.results.supportValue)}</div></div>
                  <div><div className="text-slate-500">Budget used</div><div className="font-semibold text-slate-900 tabular-nums">{fmt(p.results.budgetUsedPct, 1)}%</div></div>
                </div>
                {p.targetFarms > 0 && <div className="mt-2"><Progress pct={p.results.enrolmentPct} tone="green" /></div>}
                <div className="mt-2 text-[11px] text-slate-500">{[...p.targetProvinces, ...p.targetDistricts].join(', ') || 'National'}{p.targetParticipantTypes.length ? ` · ${p.targetParticipantTypes.map(ptLabel).join(', ')}` : ' · any organisation'}{p.targetEnterpriseCategories.length ? ` · ${p.targetEnterpriseCategories.map(title).join(', ')}` : ''}</div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

// ─── Create / edit form ──────────────────────────────────────────────────────

function ProgrammeForm({ existing, onCancel, onSaved }: { existing?: Programme; onCancel: () => void; onSaved: (id: string) => void }) {
  const [f, setF] = useState({
    name: existing?.name ?? '', code: existing?.code ?? '', funder: existing?.funder ?? 'FAO', description: existing?.description ?? '',
    status: existing?.status ?? 'active', startDate: existing?.startDate ?? today(), endDate: existing?.endDate ?? '',
    budget: existing ? String(existing.budget) : '', currency: existing?.currency ?? 'USD', targetFarms: existing ? String(existing.targetFarms) : '',
    targetProvinces: existing?.targetProvinces.join(', ') ?? '', targetDistricts: existing?.targetDistricts.join(', ') ?? '',
    targetEnterpriseCategories: existing?.targetEnterpriseCategories ?? [] as string[],
    targetParticipantTypes: existing?.targetParticipantTypes ?? [] as string[],
    indicators: existing?.indicators.map(i => ({ ...i, target: i.target == null ? '' : String(i.target) })) ?? [{ key: 'farms_trained', label: 'Farmers trained', unit: 'farmers', target: '' }],
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [mapPick, setMapPick] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) => setF(x => ({ ...x, [k]: e.target.value }));
  const list = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);
  const setInd = (i: number, k: string, v: string) => setF(x => ({ ...x, indicators: x.indicators.map((it, j) => j === i ? { ...it, [k]: v } : it) }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const input = {
      name: f.name, code: f.code, funder: f.funder, description: f.description, status: f.status,
      startDate: f.startDate, endDate: f.endDate || null, budget: f.budget ? Number(f.budget) : 0, currency: f.currency,
      targetFarms: f.targetFarms ? Number(f.targetFarms) : 0, targetProvinces: list(f.targetProvinces), targetDistricts: list(f.targetDistricts),
      targetEnterpriseCategories: f.targetEnterpriseCategories, targetParticipantTypes: f.targetParticipantTypes,
      indicators: f.indicators.filter(i => i.key && i.label).map(i => ({ key: i.key.trim().toLowerCase().replace(/\s+/g, '_'), label: i.label, unit: i.unit, target: i.target === '' ? null : Number(i.target) })),
    };
    try {
      if (existing) { await gqlRequest(UPDATE_PROGRAMME_MUTATION, { id: existing.id, input }); onSaved(existing.id); }
      else { const r = await gqlRequest<{ createProgramme: { programme: { id: string } } }>(CREATE_PROGRAMME_MUTATION, { input }); onSaved(r.createProgramme.programme.id); }
    } catch (e: any) { setErr(e?.message ?? 'Failed'); } finally { setBusy(false); }
  }

  return (
    <Card title={existing ? 'Edit programme' : 'New programme'} action={<button onClick={onCancel} className="text-slate-500 hover:text-slate-800"><X className="w-4 h-4" /></button>}>
      <form onSubmit={submit} className="grid md:grid-cols-2 gap-3">
        <input value={f.name} onChange={set('name')} placeholder="Programme name (e.g. Hand-in-Hand Zambia)" className={`${inputCls} md:col-span-2`} required />
        <input value={f.funder} onChange={set('funder')} placeholder="Funder (e.g. FAO, EU)" className={inputCls} />
        <input value={f.code} onChange={set('code')} placeholder="Reference code (e.g. GCP/ZAM/123)" className={inputCls} />
        <textarea value={f.description} onChange={set('description')} placeholder="Objective / description" rows={2} className={`${inputCls} md:col-span-2`} />
        <label className="text-xs text-slate-500">Start<input type="date" value={f.startDate} onChange={set('startDate')} className={`${inputCls} mt-1`} required /></label>
        <label className="text-xs text-slate-500">End<input type="date" value={f.endDate} onChange={set('endDate')} className={`${inputCls} mt-1`} /></label>
        <div className="flex gap-2"><input type="number" min="0" value={f.budget} onChange={set('budget')} placeholder="Budget" className={inputCls} /><input value={f.currency} onChange={set('currency')} className={`${inputCls} w-24`} /></div>
        <div className="flex gap-2">
          <input type="number" min="0" value={f.targetFarms} onChange={set('targetFarms')} placeholder="Enrolment target (participants)" className={inputCls} />
          <select value={f.status} onChange={set('status')} className={`${inputCls} bg-white w-36`}>{['planning', 'active', 'suspended', 'closed'].map(s => <option key={s} value={s}>{title(s)}</option>)}</select>
        </div>
        <input value={f.targetProvinces} onChange={set('targetProvinces')} placeholder="Target provinces, comma-separated (blank = all)" className={inputCls} />
        <div className="flex gap-2"><input value={f.targetDistricts} onChange={set('targetDistricts')} placeholder="Target districts, comma-separated (blank = all)" className={inputCls} /><button type="button" onClick={() => setMapPick(v => !v)} className={`px-3 py-2 rounded-lg border text-xs whitespace-nowrap ${mapPick ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 text-slate-700'}`}>🗺️ Pick on map</button></div>
        {mapPick && <DistrictPicker value={list(f.targetDistricts)} onChange={ds => setF(x => ({ ...x, targetDistricts: ds.join(', ') }))} onClose={() => setMapPick(false)} />}
        <div className="md:col-span-2 flex flex-wrap gap-2">
          <span className="text-xs text-slate-500 self-center">Who can be enrolled (blank = any consenting organisation):</span>
          {PARTICIPANT_TYPES.map(([c, l]) => (
            <button type="button" key={c} onClick={() => setF(x => ({ ...x, targetParticipantTypes: x.targetParticipantTypes.includes(c) ? x.targetParticipantTypes.filter(y => y !== c) : [...x.targetParticipantTypes, c] }))}
              className={`px-2.5 py-1 rounded-full text-xs border ${f.targetParticipantTypes.includes(c) ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 text-slate-600'}`}>{l}</button>
          ))}
        </div>
        <div className="md:col-span-2 flex flex-wrap gap-2">
          <span className="text-xs text-slate-500 self-center">Target enterprise types (farms only):</span>
          {CATEGORIES.map(c => (
            <button type="button" key={c} onClick={() => setF(x => ({ ...x, targetEnterpriseCategories: x.targetEnterpriseCategories.includes(c) ? x.targetEnterpriseCategories.filter(y => y !== c) : [...x.targetEnterpriseCategories, c] }))}
              className={`px-2.5 py-1 rounded-full text-xs border ${f.targetEnterpriseCategories.includes(c) ? 'bg-sky-600 text-white border-sky-600' : 'border-slate-300 text-slate-600'}`}>{title(c)}</button>
          ))}
        </div>
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-1"><span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Results framework (indicators)</span>
            <button type="button" onClick={() => setF(x => ({ ...x, indicators: [...x.indicators, { key: '', label: '', unit: '', target: '' }] }))} className="text-xs text-sky-700 font-semibold">+ Add indicator</button></div>
          <div className="space-y-2">
            {f.indicators.map((i, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_2fr_1fr_1fr_auto] gap-2">
                <input value={i.key} onChange={e => setInd(idx, 'key', e.target.value)} placeholder="key" className={inputCls} />
                <input value={i.label} onChange={e => setInd(idx, 'label', e.target.value)} placeholder="Label (e.g. Maize yield)" className={inputCls} />
                <input value={i.unit} onChange={e => setInd(idx, 'unit', e.target.value)} placeholder="Unit" className={inputCls} />
                <input type="number" value={i.target} onChange={e => setInd(idx, 'target', e.target.value)} placeholder="Target" className={inputCls} />
                <button type="button" onClick={() => setF(x => ({ ...x, indicators: x.indicators.filter((_, j) => j !== idx) }))} className="text-slate-400 hover:text-red-600 px-1"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
        {err && <p className="text-sm text-red-700 md:col-span-2">{err}</p>}
        <div className="md:col-span-2 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-1 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} {existing ? 'Save changes' : 'Create programme'}</button>
        </div>
      </form>
    </Card>
  );
}

// ─── Programme workspace ─────────────────────────────────────────────────────

interface WS { partnerProgramme: Programme; programmeEnrolledFarms: EnrolledFarm[]; programmeSupport: Support[]; programmeSupportByType: SupportByType[]; programmeDistricts: ProgrammeDistrict[]; programmeIndicatorReadings: IndicatorReading[] }
type WsTab = 'results' | 'map' | 'farms' | 'support' | 'indicators' | 'notices';

function ProgrammeWorkspace({ id, onBack }: { id: string; onBack: () => void }) {
  const { canEdit } = useAuth();
  const canEditProgramme = canEdit('programmes');
  const [d, setD] = useState<WS | null>(null);
  const [tab, setTab] = useState<WsTab>('results');
  const [enrolDistrict, setEnrolDistrict] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const load = useCallback(() => gqlRequest<WS>(PROGRAMME_QUERY, { id }).then(setD).catch(e => setMsg({ ok: false, text: e?.message })), [id]);
  useEffect(() => { load(); }, [load]);
  if (!d) return <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading programme…</div>;
  const p = d.partnerProgramme, r = p.results;
  if (editing) return <ProgrammeForm existing={p} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); setMsg({ ok: true, text: 'Programme updated.' }); load(); }} />;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /> Programmes</button>
        <h2 className="text-xl font-bold text-slate-900">{p.name}</h2><Pill v={p.status} />
        <span className="text-sm text-slate-500">{p.funder && `${p.funder} · `}{p.startDate}{p.endDate && ` → ${p.endDate}`}</span>
        <div className="flex-1" />
        <ReportButtons programmeId={p.id} startDate={p.startDate} onMsg={setMsg} />
        <button onClick={() => setEditing(true)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-700 hover:bg-slate-50">Edit programme</button>
      </div>
      <Msg m={msg} />
      <div className="flex gap-1 border-b border-slate-200">
        {([['results', 'Results'], ['map', 'Map'], ['farms', `Participants (${r.farmsEnrolled})`], ['support', `Support ledger (${r.supportEvents})`], ['indicators', 'Results framework'], ['notices', 'Notices']] as [WsTab, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${tab === k ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{l}</button>
        ))}
      </div>
      {tab === 'results' && <ResultsTab p={p} districts={d.programmeDistricts} byType={d.programmeSupportByType} />}
      {tab === 'map' && <ProgrammeMap programmeId={p.id} programmeName={p.name} onEnrolFromDistrict={p.status === 'active' ? (dist) => { setEnrolDistrict(dist); setTab('farms'); } : undefined} />}
      {tab === 'farms' && <FarmsTab p={p} farms={d.programmeEnrolledFarms} initialDistrict={enrolDistrict} onChanged={(m) => { setMsg(m); load(); }} />}
      {tab === 'support' && <SupportTab p={p} farms={d.programmeEnrolledFarms} support={d.programmeSupport} onChanged={(m) => { setMsg(m); load(); }} />}
      {tab === 'indicators' && <><Logframe programmeId={p.id} canEdit={canEditProgramme} onMsg={setMsg} onChanged={load} /><ReadingHistory p={p} readings={d.programmeIndicatorReadings} /></>}
      {tab === 'notices' && <NoticesTab p={p} onSent={setMsg} />}
    </>
  );
}

function ResultsTab({ p, districts, byType }: { p: Programme; districts: ProgrammeDistrict[]; byType: SupportByType[] }) {
  const r = p.results;
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 md:col-span-2">
          <div className="flex justify-between text-[11px] uppercase tracking-wide text-slate-500"><span>Enrolment</span><span>{r.farmsEnrolled}{p.targetFarms ? ` / ${p.targetFarms}` : ''} participants</span></div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums my-1">{p.targetFarms ? `${fmt(r.enrolmentPct, 1)}%` : r.farmsEnrolled}</div>
          {p.targetFarms > 0 && <Progress pct={r.enrolmentPct} tone="green" />}
          <div className="text-xs text-slate-500 mt-1">{r.farmsActive} active · {r.districts} districts · {r.enterprises} enterprises · {r.activeBatches} active batches</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 md:col-span-2">
          <div className="flex justify-between text-[11px] uppercase tracking-wide text-slate-500"><span>Budget used</span><span>{p.currency} {fmt(r.supportValue)} / {fmt(p.budget)}</span></div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums my-1">{fmt(r.budgetUsedPct, 1)}%</div>
          <Progress pct={r.budgetUsedPct} tone={r.budgetUsedPct > 100 ? 'amber' : 'sky'} />
          <div className="text-xs text-slate-500 mt-1">{r.supportEvents} support records to {r.farmsSupported} farms</div>
        </div>
        <Stat label="Records since start" value={fmt(r.recordsSinceStart)} sub="farm production records" />
        <Stat label="Harvest logged" value={fmt(r.harvestQuantitySinceStart)} sub={`${r.harvestRecordsSinceStart} harvest records`} tone="good" />
        <Stat label="Market activity" value={fmt(r.marketListings)} sub={`active listings · ${r.contractsFulfilled} contracts fulfilled`} />
        <Stat label="Participants by type" value={Object.keys(parseByType(r.participantsByType)).length || '—'} sub={Object.entries(parseByType(r.participantsByType)).map(([k, v]) => `${ptLabel(k)} ${v}`).join(' · ') || 'none yet'} />
        <Stat label="Women · youth" value={`${fmt(r.participantsWomen)} · ${fmt(r.participantsYouth)}`} sub={`of ${r.farmsActive} active · ${fmt(r.householdsReached)} household members · ${r.participantsWithProfile} profiles`} tone={r.participantsWithProfile < r.farmsActive ? 'warn' : 'good'} />
        <Stat label="Reports resolved" value={fmt(r.reportsResolvedSinceStart)} sub="since programme start" />
        <Stat label="Reports open" value={fmt(r.reportsOpen)} tone={r.reportsOpen ? 'warn' : 'default'} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Support by type">
          {!byType.length ? <p className="text-sm text-slate-400">No support recorded yet.</p> : (
            <div className="h-56"><ResponsiveContainer><BarChart data={byType.map(b => ({ ...b, label: title(b.supportType) }))} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 11 }} /><Tooltip formatter={(v: number) => `${p.currency} ${fmt(v)}`} />
              <Bar isAnimationActive={false} dataKey="value" name="Value" radius={[0, 4, 4, 0]}>{byType.map((_, i) => <Cell key={i} fill={['#0284c7', '#16a34a', '#d97706', '#7c3aed', '#dc2626', '#0d9488', '#65a30d', '#9333ea', '#ea580c', '#4b5563'][i % 10]} />)}</Bar>
            </BarChart></ResponsiveContainer></div>
          )}
        </Card>
        <Card title="Indicator progress">
          {!p.indicatorStatus.length ? <p className="text-sm text-slate-400">No indicators defined.</p> : (
            <ul className="space-y-3">{p.indicatorStatus.map(i => (
              <li key={i.key}>
                <div className="flex justify-between text-sm"><span className="font-medium text-slate-800">{i.label}</span><span className="tabular-nums text-slate-600">{i.latestValue == null ? '—' : fmt(i.latestValue, 2)}{i.target != null && ` / ${fmt(i.target, 2)}`} {i.unit}</span></div>
                {i.progressPct != null && <div className="mt-1"><Progress pct={i.progressPct} tone={i.progressPct >= 100 ? 'green' : 'sky'} /></div>}
                {i.latestPeriod && <div className="text-[11px] text-slate-400 mt-0.5">as of {i.latestPeriod}</div>}
              </li>
            ))}</ul>
          )}
        </Card>
      </div>
      <Card title="Results by district">
        {!districts.length ? <p className="text-sm text-slate-400">No participants enrolled yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">{['Province', 'District', 'Farms', 'Records', 'Harvest', 'Support value'].map(h => <th key={h} className="py-2 pr-4 font-medium">{h}</th>)}</tr></thead>
            <tbody>{districts.map(x => <tr key={x.province + x.district} className="border-b border-slate-100 last:border-0"><td className="py-2 pr-4">{x.province}</td><td className="py-2 pr-4">{x.district}</td><td className="py-2 pr-4 tabular-nums">{x.farms}</td><td className="py-2 pr-4 tabular-nums">{x.recordsSinceStart}</td><td className="py-2 pr-4 tabular-nums">{fmt(x.harvestQuantitySinceStart)}</td><td className="py-2 pr-4 tabular-nums">{p.currency} {fmt(x.supportValue)}</td></tr>)}</tbody>
          </table></div>
        )}
      </Card>
    </>
  );
}

function FarmsTab({ p, farms, onChanged, initialDistrict }: { p: Programme; farms: EnrolledFarm[]; onChanged: (m: { ok: boolean; text: string }) => void; initialDistrict?: string | null }) {
  const [adding, setAdding] = useState(!!initialDistrict);
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState(initialDistrict ?? '');
  const [eligible, setEligible] = useState<EligibleFarm[]>([]);
  const [cohort, setCohort] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [profileFor, setProfileFor] = useState<EnrolledFarm | null>(null);
  const loadEligible = useCallback(() => gqlRequest<{ programmeEligibleFarms: EligibleFarm[] }>(ELIGIBLE_QUERY, { id: p.id, search: search || null, district: district || null }).then(r => setEligible(r.programmeEligibleFarms)).catch(() => {}), [p.id, search, district]);
  useEffect(() => { if (adding) { const t = setTimeout(loadEligible, 250); return () => clearTimeout(t); } }, [adding, loadEligible]);
  async function enroll(f: EligibleFarm) {
    setBusy(f.farmId);
    try { await gqlRequest(ENROLL_FARM_MUTATION, { p: p.id, f: f.farmId, c: cohort || null }); onChanged({ ok: true, text: `${f.name} enrolled — the organisation has been notified.` }); loadEligible(); }
    catch (e: any) { onChanged({ ok: false, text: e?.message }); } finally { setBusy(null); }
  }
  async function setStatus(e: EnrolledFarm, status: string) {
    try { await gqlRequest(UPDATE_ENROLLMENT_MUTATION, { e: e.enrollmentId, status }); onChanged({ ok: true, text: `${e.name} marked ${status}.` }); } catch (err: any) { onChanged({ ok: false, text: err?.message }); }
  }
  return (
    <>
      {adding && (
        <Card title="Eligible organisations (opted in to data sharing, matching targeting)" action={<button onClick={() => setAdding(false)} className="text-slate-500"><X className="w-4 h-4" /></button>}>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by farm name" className={`${inputCls} pl-9`} /></div>
            <input value={district} onChange={e => setDistrict(e.target.value)} placeholder="District (from the map)" className={`${inputCls} w-44`} aria-label="District filter" />
            <input value={cohort} onChange={e => setCohort(e.target.value)} placeholder="Cohort (optional, e.g. 2026 Season A)" className={`${inputCls} w-64`} />
          </div>
          {!eligible.length ? <p className="text-sm text-slate-400 text-center py-4">No eligible organisations left.</p> : (
            <ul className="divide-y divide-slate-100">{eligible.map(f => (
              <li key={f.farmId} className="py-2.5 flex items-center gap-4"><div className="flex-1"><div className="font-medium text-slate-900">{f.name}</div><div className="text-xs text-slate-500"><span className="font-medium text-slate-700">{ptLabel(f.businessType)}</span> · {f.district}, {f.province}{f.enterpriseCategories.length ? ` · ${f.enterpriseCategories.map(title).join(', ')}` : ''}</div></div>
                <button onClick={() => enroll(f)} disabled={busy === f.farmId} className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">{busy === f.farmId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Enrol</button></li>
            ))}</ul>
          )}
        </Card>
      )}
      <Card title="Enrolled participants" action={!adding && p.status === 'active' && <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-medium"><Plus className="w-3.5 h-3.5" /> Enrol participants</button>}>
        {!farms.length ? <p className="text-sm text-slate-400 text-center py-6">No participants enrolled yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">{['Participant', 'Type', 'Household', 'District', 'Cohort', 'Evidence', 'Support', 'Status', ''].map(h => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{farms.map(f => (
              <tr key={f.enrollmentId} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-3 font-medium text-slate-900">{f.name}</td><td className="py-2 pr-3 text-slate-600">{ptLabel(f.businessType)}</td><td className="py-2 pr-3 text-xs">{f.hasProfile ? <button onClick={() => setProfileFor(f)} className="text-slate-700 hover:underline">{f.headSex === 'F' ? 'Woman-headed' : f.headSex === 'M' ? 'Man-headed' : 'Head n/a'}{f.isYouth ? ' · youth' : ''}{f.householdSize ? ` · ${f.householdSize} members` : ''}</button> : <button onClick={() => setProfileFor(f)} className="text-amber-700 hover:underline">Add profile</button>}</td><td className="py-2 pr-3 text-slate-600">{f.district}</td><td className="py-2 pr-3 text-slate-600">{f.cohort || '—'}</td>
                <td className="py-2 pr-3 text-xs text-slate-600">{f.businessType === 'farmer' || f.businessType === 'cooperative' ? `${f.recordsSinceStart} records · ${fmt(f.harvestQuantitySinceStart)} harvest` : `${f.marketListings} listings · ${f.contractsFulfilled} contracts`}</td>
                <td className="py-2 pr-3 tabular-nums">{f.supportEvents} · {p.currency} {fmt(f.supportValue)}</td><td className="py-2 pr-3"><Pill v={f.status} /></td>
                <td className="py-2 text-xs whitespace-nowrap">{f.status === 'active' ? <><button onClick={() => setStatus(f, 'completed')} className="text-slate-600 hover:underline mr-2">Complete</button><button onClick={() => setStatus(f, 'withdrawn')} className="text-red-600 hover:underline">Withdraw</button></> : <button onClick={() => setStatus(f, 'active')} className="text-sky-700 hover:underline">Reactivate</button>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
      {profileFor && <ProfileModal organizationId={profileFor.farmId} name={profileFor.name} onClose={() => setProfileFor(null)} onSaved={() => onChanged({ ok: true, text: `Household profile saved for ${profileFor.name}.` })} />}
    </>
  );
}

function SupportTab({ p, farms, support, onChanged }: { p: Programme; farms: EnrolledFarm[]; support: Support[]; onChanged: (m: { ok: boolean; text: string }) => void }) {
  const active = farms.filter(f => f.status === 'active');
  const [f, setF] = useState({ farmId: active[0]?.farmId ?? '', supportType: 'input_voucher', description: '', quantity: '1', unit: '', value: '', currency: p.currency, deliveredOn: today(), reference: '', notifyFarm: true });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) => setF(x => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      await gqlRequest(RECORD_SUPPORT_MUTATION, { input: { programmeId: p.id, farmId: f.farmId, supportType: f.supportType, description: f.description, quantity: Number(f.quantity || 1), unit: f.unit, value: Number(f.value || 0), currency: f.currency, deliveredOn: f.deliveredOn, reference: f.reference, notifyFarm: f.notifyFarm } });
      onChanged({ ok: true, text: 'Support recorded' + (f.notifyFarm ? ' — the farm has been notified.' : '.') }); setF(x => ({ ...x, description: '', value: '', reference: '' }));
    } catch (err: any) { onChanged({ ok: false, text: err?.message }); } finally { setBusy(false); }
  }
  return (
    <>
      <Card title="Record support delivered">
        {!active.length ? <p className="text-sm text-slate-400">Enrol farms first.</p> : (
          <form onSubmit={submit} className="grid md:grid-cols-3 gap-3">
            <select value={f.farmId} onChange={set('farmId')} className={`${inputCls} bg-white`} required>{active.map(x => <option key={x.farmId} value={x.farmId}>{x.name} — {x.district}</option>)}</select>
            <select value={f.supportType} onChange={set('supportType')} className={`${inputCls} bg-white`}>{SUPPORT_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            <input type="date" value={f.deliveredOn} onChange={set('deliveredOn')} className={inputCls} required />
            <input value={f.description} onChange={set('description')} placeholder="Description (e.g. 50kg D-compound + 10kg SC627 seed)" className={`${inputCls} md:col-span-3`} required />
            <div className="flex gap-2"><input type="number" min="0" step="any" value={f.quantity} onChange={set('quantity')} placeholder="Qty" className={inputCls} /><input value={f.unit} onChange={set('unit')} placeholder="Unit" className={inputCls} /></div>
            <div className="flex gap-2"><input type="number" min="0" step="any" value={f.value} onChange={set('value')} placeholder="Value" className={inputCls} /><input value={f.currency} onChange={set('currency')} className={`${inputCls} w-24`} /></div>
            <input value={f.reference} onChange={set('reference')} placeholder="Voucher / GRN reference" className={inputCls} />
            <div className="md:col-span-3 flex items-center gap-3"><label className="text-xs text-slate-600 inline-flex items-center gap-1.5"><input type="checkbox" checked={f.notifyFarm} onChange={set('notifyFarm')} /> Notify farm</label><div className="flex-1" />
              <button type="submit" disabled={busy} className="inline-flex items-center gap-1 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Record</button></div>
          </form>
        )}
      </Card>
      <Card title="Support ledger">
        {!support.length ? <p className="text-sm text-slate-400 text-center py-6">Nothing recorded yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">{['Date', 'Farm', 'Type', 'Description', 'Qty', 'Value', 'Ref'].map(h => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{support.map(s => <tr key={s.id} className="border-b border-slate-100 last:border-0"><td className="py-2 pr-3 text-slate-600 whitespace-nowrap">{s.deliveredOn}</td><td className="py-2 pr-3 font-medium text-slate-900">{s.farmName}</td><td className="py-2 pr-3">{title(s.supportType)}</td><td className="py-2 pr-3 text-slate-700">{s.description}</td><td className="py-2 pr-3 tabular-nums">{fmt(s.quantity, 2)} {s.unit}</td><td className="py-2 pr-3 tabular-nums">{s.currency} {fmt(s.value)}</td><td className="py-2 pr-3 text-slate-500">{s.reference || '—'}</td></tr>)}</tbody>
          </table></div>
        )}
      </Card>
    </>
  );
}

function ReadingHistory({ p, readings }: { p: Programme; readings: IndicatorReading[] }) {
  if (!readings.length) return null;
  return (
    <Card title="Manual reading history">
      <ul className="divide-y divide-slate-100 text-sm">{readings.map(r => { const ind = p.indicators.find(i => i.key === r.indicatorKey); const bd = parseByType(r.disaggregation) as any; return (
        <li key={r.id} className="py-2 flex justify-between gap-3"><div><span className="font-medium text-slate-800">{ind?.label ?? r.indicatorKey}</span>{r.notes && <div className="text-xs text-slate-500">{r.notes}</div>}{Object.keys(bd).length > 0 && <div className="text-[11px] text-slate-500">{Object.entries(bd).map(([d, v]) => `${title(d)}: ${Object.entries(v as any).map(([k, n]) => `${k} ${n}`).join(', ')}`).join(' · ')}</div>}</div><div className="text-right whitespace-nowrap"><div className="tabular-nums text-slate-900">{fmt(r.value, 2)} {ind?.unit}</div><div className="text-[11px] text-slate-400">{r.period}{r.recordedByName && ` · ${r.recordedByName}`}</div></div></li>
      ); })}</ul>
    </Card>
  );
}

function NoticesTab({ p, onSent }: { p: Programme; onSent: (m: { ok: boolean; text: string }) => void }) {
  const [f, setF] = useState({ title: '', message: '', priority: 'info' });
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try { const r = await gqlRequest<{ sendProgrammeNotice: { farms: number; recipients: number } }>(SEND_NOTICE_MUTATION, { p: p.id, ...f }); onSent({ ok: true, text: `Notice sent to ${r.sendProgrammeNotice.farms} farms (${r.sendProgrammeNotice.recipients} people).` }); setF({ title: '', message: '', priority: 'info' }); }
    catch (err: any) { onSent({ ok: false, text: err?.message }); } finally { setBusy(false); }
  }
  return (
    <Card title="Send a notice to all actively enrolled farms" className="max-w-2xl">
      <form onSubmit={submit} className="space-y-3">
        <input value={f.title} onChange={e => setF(x => ({ ...x, title: e.target.value }))} placeholder="Title (e.g. Input collection this Friday)" className={inputCls} required />
        <textarea value={f.message} onChange={e => setF(x => ({ ...x, message: e.target.value }))} placeholder="Message" rows={4} className={inputCls} required />
        <div className="flex gap-2"><select value={f.priority} onChange={e => setF(x => ({ ...x, priority: e.target.value }))} className={`${inputCls} bg-white w-36`}><option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option></select>
          <button type="submit" disabled={busy} className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send notice</button></div>
      </form>
    </Card>
  );
}


// ─── Donor results report ────────────────────────────────────────────────────

function ReportButtons({ programmeId, startDate, onMsg }: { programmeId: string; startDate: string; onMsg: (m: { ok: boolean; text: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [range, setRange] = useState({ s: startDate, e: today() });
  async function gen(fmt: 'pdf' | 'xlsx') {
    setBusy(fmt);
    try {
      const r = await gqlRequest<{ generateProgrammeReport: { url: string } }>(PROGRAMME_REPORT_MUTATION, { p: programmeId, f: fmt, s: range.s || null, e: range.e || null });
      window.open(mediaUrl(r.generateProgrammeReport.url), '_blank');
      onMsg({ ok: true, text: `${fmt === 'pdf' ? 'PDF' : 'Excel'} results report generated for ${range.s} → ${range.e}.` });
      setOpen(false);
    } catch (e: any) { onMsg({ ok: false, text: e?.message }); } finally { setBusy(null); }
  }
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="inline-flex items-center gap-1 px-3 py-1.5 border border-sky-300 text-sky-700 rounded-lg text-xs font-medium hover:bg-sky-50"><FileDown className="w-3.5 h-3.5" /> Donor report</button>
      {open && (
        <div className="absolute left-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-20 space-y-2">
          <div className="text-xs font-semibold text-slate-700">Results report — reporting period</div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] text-slate-500">From<input type="date" value={range.s} onChange={e => setRange(x => ({ ...x, s: e.target.value }))} className={`${inputCls} mt-0.5`} /></label>
            <label className="text-[10px] text-slate-500">To<input type="date" value={range.e} onChange={e => setRange(x => ({ ...x, e: e.target.value }))} className={`${inputCls} mt-0.5`} /></label>
          </div>
          <p className="text-[11px] text-slate-500">Cover, summary KPIs, indicators vs targets with reading history, enrolment and harvest by district, support ledger, methodology.</p>
          <div className="flex gap-2">
            <button onClick={() => gen('pdf')} disabled={!!busy} className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-sky-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">{busy === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />} PDF</button>
            <button onClick={() => gen('xlsx')} disabled={!!busy} className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium disabled:opacity-50">{busy === 'xlsx' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />} Excel</button>
          </div>
        </div>
      )}
    </div>
  );
}
