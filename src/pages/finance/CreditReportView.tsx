// ─────────────────────────────────────────────────────────────────────────────
// Credit summary presentation — shared by the farmer's Credit Profile page and
// the public lender view. Pure render of a CreditSummary.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { CreditSummary } from '@/graphql/creditQueries';

const fmt = (n: number | null | undefined, d = 0) => n == null ? '—' : Number(n).toLocaleString(undefined, { maximumFractionDigits: d });
const title = (s: string) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const BAND_CLS: Record<string, string> = { A: 'bg-green-600', B: 'bg-emerald-500', C: 'bg-amber-500', D: 'bg-orange-500', E: 'bg-slate-400' };

export function ScoreGauge({ score, band }: { score: number; band: string }) {
  const r = 54, c = 2 * Math.PI * r, pct = Math.max(0, Math.min(100, score)) / 100;
  const color = { A: '#16a34a', B: '#10b981', C: '#f59e0b', D: '#f97316', E: '#94a3b8' }[band] ?? '#94a3b8';
  return (
    <svg viewBox="0 0 140 140" className="w-36 h-36">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 70 70)" />
      <text x="70" y="66" textAnchor="middle" fontSize="30" fontWeight="700" fill="#0f172a">{score}</text>
      <text x="70" y="88" textAnchor="middle" fontSize="11" fill="#64748b">out of 100</text>
    </svg>
  );
}

export default function CreditReportView({ s }: { s: CreditSummary }) {
  const f = s.financials, t = s.trading, v = s.verification, r = s.records;
  const Card = ({ title: h, children }: { title: string; children: React.ReactNode }) => <section className="bg-white rounded-xl border border-slate-200 p-5"><h3 className="font-semibold text-slate-900 mb-3">{h}</h3>{children}</section>;
  const KV = ({ rows }: { rows: [string, React.ReactNode][] }) => <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">{rows.map(([k, val]) => <React.Fragment key={k}><dt className="text-slate-500">{k}</dt><dd className="text-slate-900 font-medium tabular-nums text-right">{val}</dd></React.Fragment>)}</dl>;
  const Flag = ({ on, label }: { on: boolean; label: string }) => <li className="flex items-center gap-2 text-sm">{on ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-slate-300" />}<span className={on ? 'text-slate-800' : 'text-slate-400'}>{label}</span></li>;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-wrap items-center gap-6">
        <ScoreGauge score={s.score} band={s.band} />
        <div className="flex-1 min-w-[240px]">
          <div className="flex items-center gap-3"><span className={`text-white text-2xl font-bold w-12 h-12 rounded-xl flex items-center justify-center ${BAND_CLS[s.band]}`}>{s.band}</span><div><div className="font-semibold text-slate-900">{s.band_label}</div><div className="text-xs text-slate-500">{s.farm.name} · {s.farm.district && `${s.farm.district}, `}{s.farm.province} · as of {s.as_of}</div></div></div>
          {s.thin_file && <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">Thin file: fewer than 3 months of records. The score becomes reliable as the farm keeps records.</p>}
          <ul className="mt-3 space-y-2">
            {s.factors.map(x => (
              <li key={x.key}>
                <div className="flex justify-between text-xs"><span className="font-medium text-slate-700">{x.label}</span><span className="tabular-nums text-slate-600">{x.score} / {x.weight}</span></div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-0.5"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(x.score / x.weight) * 100}%` }} /></div>
                <div className="text-[11px] text-slate-500 mt-0.5">{x.evidence}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Farm">
          <KV rows={[['Member since', `${s.farm.member_since} (${s.farm.tenure_months} months)`], ['Enterprises', s.farm.enterprises.map(title).join(', ') || '—'], ['Registered area', `${fmt(s.farm.area_ha, 1)} ha`], ['Batches completed', `${r.batches_completed} of ${r.batches_total}`], ['Records (12 m)', `${r.records_12m} in ${r.active_months_12} months`], ['Last record', r.days_since_last_record == null ? 'never' : `${r.days_since_last_record} days ago`]]} />
        </Card>
        <Card title="Financial performance (batch financials)">
          <KV rows={[['Revenue, 12 m', `ZMW ${fmt(f.revenue_12m)}`], ['Costs, 12 m', `ZMW ${fmt(f.costs_12m)}`], ['Gross profit, 12 m', <span className={f.profit_12m < 0 ? 'text-red-600' : 'text-green-700'}>ZMW {fmt(f.profit_12m)}</span>], ['ROI / margin', f.roi_pct_12m == null ? '—' : `${fmt(f.roi_pct_12m)}% / ${fmt(f.margin_pct_12m)}%`], [f.basis === 'ledger' ? 'Profitable months' : 'Profitable batches', `${f.profitable_batches} of ${f.scored_batches}`], ['Lifetime revenue', `ZMW ${fmt(f.revenue_lifetime)}`], ['Revenue trend (H2 vs H1)', f.revenue_trend_pct == null ? '—' : `${f.revenue_trend_pct > 0 ? '+' : ''}${fmt(f.revenue_trend_pct)}%`]]} />
        </Card>
      </div>

      <Card title="Monthly revenue, last 12 months">
        {f.monthly_revenue.every(m => !m.revenue) ? <p className="text-sm text-slate-400">No revenue entries in the last 12 months.</p> : (
          <div className="h-48"><ResponsiveContainer><BarChart data={f.monthly_revenue}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip formatter={(val: number) => `ZMW ${fmt(val)}`} /><Bar isAnimationActive={false} dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Trading history">
          <KV rows={[['Contracts fulfilled', `${t.contracts_fulfilled} (ZMW ${fmt(t.fulfilled_value)})`], ['Fulfilment rate', t.fulfilment_rate_pct == null ? '—' : `${t.fulfilment_rate_pct}%`], ['Open contracts', t.contracts_open], ['Disputed / cancelled', t.contracts_disputed], ['Verified buyers', t.verified_buyers], ['Active listings', t.active_listings]]} />
        </Card>
        <Card title="Verification & support network">
          <ul className="space-y-1.5">
            <Flag on={v.data_sharing_consent} label="Data-sharing consent (government / partner aggregates)" />
            <Flag on={v.extension_officer} label={`Extension officer assigned${v.extension_officer ? ` · ${v.extension_visits_12m} visits in 12 m` : ''}`} />
            <Flag on={v.programmes.length > 0} label={v.programmes.length ? `Programmes: ${v.programmes.map(p => `${p.name} (${p.partner})`).join('; ')}` : 'No development programme enrolment'} />
            <Flag on={v.certifications.length > 0} label={v.certifications.length ? `Certified: ${v.certifications.join(', ')}` : 'No certifications'} />
            <Flag on={v.insurance_active} label="Insurance on record" />
            <Flag on={v.loans.some(l => l.status === 'repaid')} label={v.loans.length ? `Loan history: ${v.loans.map(l => `${l.lender} — ${title(l.status)}`).join('; ')}` : 'No prior loans on record'} />
          </ul>
          {v.support_value > 0 && <p className="text-xs text-slate-500 mt-2">Programme support received: ZMW {fmt(v.support_value)}</p>}
        </Card>
      </div>
      <p className="text-[11px] text-slate-400">Generated {new Date(s.generated_at).toLocaleString()} from records kept in AGRINUXES. Decision support only — verify against your own KYC. Methodology: five weighted rule-based factors (25 / 25 / 20 / 15 / 15).</p>
    </div>
  );
}
