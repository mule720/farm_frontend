// ─────────────────────────────────────────────────────────────────────────────
// Government & Partner Dashboard
// De-identified, aggregated view across consenting farms. Filterable by
// province / district. Advisory tab broadcasts to farms in scope.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { AlertTriangle, RefreshCw, Send, ShieldCheck, Loader2 } from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { GovTab } from '@/v2/GovernmentShell';
import {
  GOV_DASHBOARD_QUERY, GOV_FILTERS_QUERY, GOV_ADVISORIES_QUERY, ISSUE_ADVISORY_MUTATION,
  type GovDashboardData, type GovFilters, type Advisory,
} from '@/graphql/governmentQueries';

interface Props { activeTab: GovTab; setActiveTab: (t: GovTab) => void; preset?: { province: string; district: string } | null }

const CATEGORY_COLORS = ['#16a34a', '#d97706', '#2563eb', '#7c3aed', '#dc2626', '#0891b2', '#65a30d', '#9333ea', '#ea580c', '#0d9488', '#4b5563', '#be123c'];
const SEVERITY_COLORS: Record<string, string> = { none: '#16a34a', low: '#84cc16', medium: '#f59e0b', high: '#ea580c', critical: '#dc2626' };

const fmt = (n: number, d = 0) => (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: d });
const title = (s: string) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function GovernmentDashboard({ activeTab, preset }: Props) {
  const { profile } = useAuth();
  const [filters, setFilters] = useState<GovFilters | null>(null);
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [data, setData] = useState<GovDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  useEffect(() => { if (preset) { setProvince(preset.province); setDistrict(preset.district); } }, [preset]);

  const seq = useRef(0);
  const load = useCallback(async () => {
    const mine = ++seq.current;  // drop responses from superseded scopes (e.g. national load racing a map drill-down)
    setLoading(true); setError('');
    try {
      const d = await gqlRequest<GovDashboardData>(GOV_DASHBOARD_QUERY, {
        province: province || null, district: district || null,
      });
      if (mine !== seq.current) return;
      setData(d); setUpdatedAt(new Date());
    } catch (e: any) { if (mine === seq.current) setError(e?.message ?? 'Failed to load'); }
    finally { if (mine === seq.current) setLoading(false); }
  }, [province, district]);

  useEffect(() => { gqlRequest<{ govFilters: GovFilters }>(GOV_FILTERS_QUERY).then(r => setFilters(r.govFilters)).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  const districtOptions = useMemo(
    () => (filters?.districts ?? []).filter(d => !province || d.province === province),
    [filters, province],
  );
  const scopeLabel = district || province || 'National';

  return (
    <div className="min-h-screen">
      {/* Header + scope filter */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-slate-900 truncate">{profile?.organization}</h1>
            <p className="text-xs text-slate-500">
              Scope: <span className="font-semibold text-slate-700">{scopeLabel}</span>
              {updatedAt && <> · updated {updatedAt.toLocaleTimeString()}</>}
            </p>
          </div>
          <select value={province} onChange={e => { setProvince(e.target.value); setDistrict(''); }}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white" aria-label="Province">
            <option value="">All provinces</option>
            {(filters?.provinces ?? []).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={district} onChange={e => setDistrict(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white" aria-label="District">
            <option value="">All districts</option>
            {districtOptions.map(d => <option key={`${d.province}/${d.district}`} value={d.district}>{d.district} ({d.farms})</option>)}
          </select>
          <button onClick={load} className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50" aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}
        {activeTab === 'advisories'
          ? <AdvisoriesTab filters={filters} />
          : !data
            ? <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading aggregates…</div>
            : <>
                {activeTab === 'overview'       && <OverviewTab d={data} />}
                {activeTab === 'production'     && <ProductionTab d={data} />}
                {activeTab === 'markets'        && <MarketsTab d={data} />}
                {activeTab === 'health'         && <HealthTab d={data} />}
                {activeTab === 'sustainability' && <SustainabilityTab d={data} />}
                {activeTab === 'registry'       && <RegistryTab d={data} />}
              </>
        }
      </main>
    </div>
  );
}

// ─── Shared bits ─────────────────────────────────────────────────────────────

function Card({ title: t, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-white rounded-2xl border border-slate-200 p-5 ${className}`}>
      {t && <h3 className="font-semibold text-slate-800 mb-4">{t}</h3>}
      {children}
    </section>
  );
}

function Stat({ label, value, sub, tone = 'default' }: { label: string; value: string; sub?: string; tone?: 'default' | 'warn' | 'bad' | 'good' }) {
  const ring = { default: 'border-slate-200', warn: 'border-amber-300', bad: 'border-red-300', good: 'border-green-300' }[tone];
  return (
    <div className={`bg-white rounded-2xl border ${ring} p-4`}>
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <p className="text-sm text-slate-400 text-center py-6">{msg}</p>;
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  if (!rows.length) return <Empty msg="No data in this scope yet." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
          {head.map(h => <th key={h} className="py-2 pr-4 font-medium">{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0">
              {r.map((c, j) => <td key={j} className="py-2 pr-4 tabular-nums">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

function OverviewTab({ d }: { d: GovDashboardData }) {
  const o = d.govOverview;
  const coverage = o.farmsEligible ? Math.round((o.farmsReporting / o.farmsEligible) * 100) : 0;
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Farms reporting" value={fmt(o.farmsReporting)} sub={`${coverage}% of ${fmt(o.farmsEligible)} farms opted in`} tone="good" />
        <Stat label="Districts covered" value={fmt(o.districtsCovered)} sub={`${o.provincesCovered} province${o.provincesCovered === 1 ? '' : 's'}`} />
        <Stat label="Active enterprises" value={fmt(o.totalEnterprises)} sub={`${fmt(o.activeBatches)} active batches / cycles`} />
        <Stat label="Records (30 days)" value={fmt(o.records30d)} sub={`${fmt(o.harvestRecords30d)} harvests · ${fmt(o.harvestQuantity30d)} units`} />
        <Stat label="Unresolved farmer reports" value={fmt(o.unresolvedReports)} tone={o.unresolvedReports ? 'warn' : 'default'} />
        <Stat label="Critical alerts open" value={fmt(o.openCriticalAlerts)} tone={o.openCriticalAlerts ? 'bad' : 'default'} />
        <Stat label="Active market listings" value={fmt(o.activeListings)} />
        <Stat label="Carbon offsets logged" value={`${fmt(d.govSustainability.carbonOffsetsKg)} kg`} sub="CO₂e" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Weekly activity (12 weeks)"><TrendChart d={d} /></Card>
        <Card title="Enterprise mix"><MixChart d={d} /></Card>
      </div>
      <Card title="Top disease & pest hotspots (90 days)">
        <Table head={['District', 'Province', 'Issue', 'Reports', 'Farms']}
          rows={d.govHotspots.slice(0, 8).map(h => [h.district, h.province, title(h.category), h.reports, h.farms])} />
      </Card>
    </>
  );
}

function TrendChart({ d }: { d: GovDashboardData }) {
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <AreaChart data={d.govProductionTrend}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Area isAnimationActive={false} type="monotone" dataKey="records" name="Production records" stroke="#16a34a" fill="#16a34a" fillOpacity={0.15} />
          <Area isAnimationActive={false} type="monotone" dataKey="harvestRecords" name="Harvests" stroke="#d97706" fill="#d97706" fillOpacity={0.15} />
          <Area isAnimationActive={false} type="monotone" dataKey="reports" name="Farmer reports" stroke="#dc2626" fill="#dc2626" fillOpacity={0.1} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MixChart({ d }: { d: GovDashboardData }) {
  if (!d.govEnterpriseMix.length) return <Empty msg="No enterprises in scope." />;
  // Fixed-size chart: a Pie inside ResponsiveContainer measures 0 on first
  // paint inside a grid cell and never recomputes its radius.
  const total = d.govEnterpriseMix.reduce((s, m) => s + m.enterprises, 0);
  return (
    <div className="flex flex-wrap items-center gap-6">
      <PieChart width={240} height={240}>
        <Pie data={d.govEnterpriseMix} dataKey="enterprises" nameKey="category" cx="50%" cy="50%" innerRadius={55} outerRadius={105} isAnimationActive={false}>
          {d.govEnterpriseMix.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v: number, _n, p: any) => [`${v} enterprises · ${p.payload.farms} farms`, title(p.payload.category)]} />
      </PieChart>
      <ul className="flex-1 min-w-[160px] space-y-1.5 text-sm">
        {d.govEnterpriseMix.map((m, i) => (
          <li key={m.category} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
            <span className="flex-1 text-slate-700">{title(m.category)}</span>
            <span className="tabular-nums text-slate-900 font-medium">{m.enterprises}</span>
            <span className="tabular-nums text-slate-400 w-10 text-right">{total ? Math.round((m.enterprises / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProductionTab({ d }: { d: GovDashboardData }) {
  return (
    <>
      <Card title="Harvest volume by week (units, as recorded)">
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={d.govProductionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar isAnimationActive={false} dataKey="harvestQuantity" name="Harvest quantity" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Enterprise mix"><MixChart d={d} /></Card>
        <Card title="Enterprises by category">
          <Table head={['Category', 'Enterprises', 'Active batches', 'Farms']}
            rows={d.govEnterpriseMix.map(m => [title(m.category), m.enterprises, m.activeBatches, m.farms])} />
        </Card>
      </div>
    </>
  );
}

function MarketsTab({ d }: { d: GovDashboardData }) {
  return (
    <>
      <Card title="Commodity prices reported by farms">
        <Table head={['Commodity', 'Latest', 'As of', '30-day avg', 'Range (30d)', 'Samples']}
          rows={d.govCommodityPrices.map(p => [
            <span className="font-medium">{p.commodity} <span className="text-slate-400">/ {p.unit}</span></span>,
            `${p.currency} ${fmt(p.latestPrice, 2)}`, p.latestDate ?? '—',
            p.samples30d ? `${p.currency} ${fmt(p.avgPrice30d, 2)}` : '—',
            p.samples30d ? `${fmt(p.minPrice30d, 2)} – ${fmt(p.maxPrice30d, 2)}` : '—', p.samples30d,
          ])} />
      </Card>
      <Card title="Marketplace supply (active listings)">
        <Table head={['Commodity', 'Listings', 'Farms', 'Quantity available', 'Avg asking price']}
          rows={d.govMarketSupply.map(s => [
            <span className="font-medium">{s.commodity}</span>, s.listings, s.farms,
            `${fmt(s.quantityAvailable, 1)} ${s.unit}`, fmt(s.avgAskingPrice, 2),
          ])} />
      </Card>
    </>
  );
}

function HealthTab({ d }: { d: GovDashboardData }) {
  const bySeverity = useMemo(() => {
    const m: Record<string, number> = {};
    d.govDiagnosisSeverity.forEach(s => { m[s.severity] = (m[s.severity] ?? 0) + s.count; });
    return ['none', 'low', 'medium', 'high', 'critical'].filter(k => m[k]).map(k => ({ severity: k, count: m[k] }));
  }, [d]);
  const byIssue = useMemo(() => {
    const m: Record<string, number> = {};
    d.govHotspots.forEach(h => { m[h.category] = (m[h.category] ?? 0) + h.reports; });
    return Object.entries(m).map(([category, reports]) => ({ category: title(category), reports })).sort((a, b) => b.reports - a.reports);
  }, [d]);
  return (
    <>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="AI diagnosis severity (90 days)">
          {!bySeverity.length ? <Empty msg="No AI diagnoses in scope." /> : (
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={bySeverity} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="severity" tick={{ fontSize: 11 }} tickFormatter={title} width={70} />
                  <Tooltip />
                  <Bar isAnimationActive={false} dataKey="count" name="Diagnoses" radius={[0, 4, 4, 0]}>
                    {bySeverity.map(s => <Cell key={s.severity} fill={SEVERITY_COLORS[s.severity]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <Card title="Farmer-reported issues by type (90 days)">
          {!byIssue.length ? <Empty msg="No farmer reports in scope." /> : (
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={byIssue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar isAnimationActive={false} dataKey="reports" name="Reports" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
      <Card title="Hotspots by district">
        <Table head={['District', 'Province', 'Issue', 'Reports', 'Farms affected']}
          rows={d.govHotspots.map(h => [h.district, h.province, title(h.category), h.reports, h.farms])} />
      </Card>
      <Card title="Diagnoses by analysis type">
        <Table head={['Analysis', 'Severity', 'Count']}
          rows={d.govDiagnosisSeverity.map(s => [title(s.analysisType),
            <span className="px-2 py-0.5 rounded text-xs font-medium text-white" style={{ background: SEVERITY_COLORS[s.severity] }}>{title(s.severity)}</span>, s.count])} />
      </Card>
    </>
  );
}

function SustainabilityTab({ d }: { d: GovDashboardData }) {
  const s = d.govSustainability;
  const net = s.carbonEmissionsKg - s.carbonOffsetsKg;
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="CO₂e emissions logged" value={`${fmt(s.carbonEmissionsKg)} kg`} sub={`${s.carbonEntries} entries`} />
        <Stat label="CO₂e offsets logged" value={`${fmt(s.carbonOffsetsKg)} kg`} tone="good" />
        <Stat label="Net CO₂e" value={`${fmt(net)} kg`} tone={net > 0 ? 'warn' : 'good'} />
        <Stat label="Water used" value={`${fmt(s.waterVolumeM3, 1)} m³`} sub={`${s.waterEntries} entries`} />
        <Stat label="Farms certified" value={fmt(s.farmsWithCertifications)} sub={`${s.activeCertifications} active certifications`} />
      </div>
      <Card>
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p>Figures are farmer-recorded totals across consenting farms in the selected scope. They are suitable for indicative NDC / climate-smart agriculture reporting and programme targeting, not for verified carbon accounting.</p>
        </div>
      </Card>
    </>
  );
}

function RegistryTab({ d }: { d: GovDashboardData }) {
  return (
    <Card title="Farmer & enterprise registry — aggregated by district">
      <p className="text-xs text-slate-500 mb-4">A continuously updated substitute for periodic census: counts per district of consenting farms. Individual farms are not identified.</p>
      <Table head={['Province', 'District', 'Farms', 'Enterprises', 'Active batches', 'Records (30d)', 'Open alerts', 'Unresolved reports']}
        rows={d.govDistrictSummary.map(r => [r.province, r.district, r.farms, r.enterprises, r.activeBatches, r.records30d,
          <span className={r.openAlerts ? 'text-red-600 font-semibold' : ''}>{r.openAlerts}</span>,
          <span className={r.unresolvedReports ? 'text-amber-600 font-semibold' : ''}>{r.unresolvedReports}</span>])} />
    </Card>
  );
}

// ─── Advisories ──────────────────────────────────────────────────────────────

const ADVISORY_CATEGORIES = [['weather', 'Weather warning'], ['disease', 'Disease / pest alert'], ['market', 'Market / price notice'], ['programme', 'Programme / subsidy'], ['general', 'General advisory']];
const ENTERPRISE_CATEGORIES = ['crop', 'livestock', 'aquaculture', 'horticulture', 'dairy', 'apiculture', 'greenhouse', 'mixed'];

function AdvisoriesTab({ filters }: { filters: GovFilters | null }) {
  const [list, setList] = useState<Advisory[]>([]);
  const [form, setForm] = useState({ title: '', message: '', category: 'general', priority: 'info', province: '', district: '', enterpriseCategory: '' });
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const refresh = useCallback(() => gqlRequest<{ govAdvisories: Advisory[] }>(GOV_ADVISORIES_QUERY).then(r => setList(r.govAdvisories)).catch(() => {}), []);
  useEffect(() => { refresh(); }, [refresh]);

  const districtOptions = (filters?.districts ?? []).filter(d => !form.province || d.province === form.province);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value, ...(k === 'province' ? { district: '' } : {}) }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSending(true); setMsg(null);
    try {
      const r = await gqlRequest<{ issueAdvisory: { advisory: Advisory } }>(ISSUE_ADVISORY_MUTATION, { input: form });
      const a = r.issueAdvisory.advisory;
      setMsg({ ok: true, text: `Sent to ${a.farmsReached} farm${a.farmsReached === 1 ? '' : 's'} (${a.recipientsReached} people).` });
      setForm(f => ({ ...f, title: '', message: '' }));
      refresh();
    } catch (err: any) { setMsg({ ok: false, text: err?.message ?? 'Failed to send' }); }
    finally { setSending(false); }
  }

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <Card title="Issue an advisory" className="lg:col-span-2">
        <form onSubmit={submit} className="space-y-3">
          <input value={form.title} onChange={set('title')} placeholder="Title" required maxLength={200}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <textarea value={form.message} onChange={set('message')} placeholder="Message to farmers" required rows={4}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.category} onChange={set('category')} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
              {ADVISORY_CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={form.priority} onChange={set('priority')} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
              <option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option>
            </select>
            <select value={form.province} onChange={set('province')} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
              <option value="">All provinces</option>
              {(filters?.provinces ?? []).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={form.district} onChange={set('district')} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
              <option value="">All districts</option>
              {districtOptions.map(d => <option key={`${d.province}/${d.district}`} value={d.district}>{d.district}</option>)}
            </select>
            <select value={form.enterpriseCategory} onChange={set('enterpriseCategory')} className="col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
              <option value="">All enterprise types</option>
              {ENTERPRISE_CATEGORIES.map(c => <option key={c} value={c}>{title(c)} farms only</option>)}
            </select>
          </div>
          {msg && <p className={`text-sm ${msg.ok ? 'text-green-700' : 'text-red-700'}`}>{msg.text}</p>}
          <button type="submit" disabled={sending}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg disabled:opacity-50">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send advisory
          </button>
          <p className="text-[11px] text-slate-500">Delivered as an in-app notification to every member of every consenting farm in scope.</p>
        </form>
      </Card>
      <Card title="Advisories issued" className="lg:col-span-3">
        {!list.length ? <Empty msg="No advisories issued yet." /> : (
          <ul className="divide-y divide-slate-100">
            {list.map(a => (
              <li key={a.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900">{a.title}</div>
                    <div className="text-sm text-slate-600 whitespace-pre-wrap">{a.message}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold flex-shrink-0 ${
                    a.priority === 'critical' ? 'bg-red-100 text-red-700' : a.priority === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {title(a.priority)}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {title(a.category)} · {a.district || a.province || 'National'}{a.enterpriseCategory && ` · ${title(a.enterpriseCategory)}`}
                  {' · '}{a.farmsReached} farms / {a.recipientsReached} people · {new Date(a.createdAt).toLocaleString()}
                  {a.issuedByName && ` · ${a.issuedByName}`}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
