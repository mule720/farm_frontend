// ─────────────────────────────────────────────────────────────────────────────
// Ecosystem — everything in the agricultural economy, not only farms.
// Organisations by participant type × district, marketplace providers,
// service-coverage gaps, programme coverage across all partners, market
// activity. Counts only; no organisation is named.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Globe2, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { gqlRequest } from '@/lib/api';

const TYPE_LABEL: Record<string, string> = { farmer: 'Farms', cooperative: 'Cooperatives', agro_dealer: 'Agro dealers', vet_provider: 'Vets', equipment_hire: 'Equipment hire', agrifood_seller: 'AgriFood sellers', agrisupply_provider: 'AgriSupply', agriservices_provider: 'AgriServices', processor: 'Processors', transport: 'Transport' };
const TYPE_COLOR: Record<string, string> = { farmer: '#16a34a', cooperative: '#65a30d', agro_dealer: '#d97706', vet_provider: '#0284c7', equipment_hire: '#ea580c', agrifood_seller: '#059669', agrisupply_provider: '#7c3aed', agriservices_provider: '#0891b2', processor: '#9333ea', transport: '#4b5563' };
const fmt = (n: number | null | undefined, d = 0) => n == null ? '—' : Number(n).toLocaleString(undefined, { maximumFractionDigits: d });
const parse = (v: any) => (typeof v === 'string' ? JSON.parse(v) : v) ?? {};

const QUERY = `query Eco($p: String, $d: String) {
  ecoOverview(province: $p, district: $d) { organisations farms vendors consenting consentPct districtsCovered provincesCovered marketplaceProviders verifiedProviders activeListings hireBookings90d vetAppointments90d programmesActive programmeParticipants programmeSupportValue byType { businessType label total consenting districts } }
  ecoParticipantsByDistrict(province: $p, district: $d) { province district total consenting farms vendors counts }
  ecoProviders(province: $p, district: $d) { providerType label providers verified districts avgRating services }
  ecoServiceCoverage(province: $p, district: $d) { province district farms vets dealers equipmentHire processors transport gaps coverageScore }
  ecoProgrammeCoverage(province: $p, district: $d) { province district programmes participants supportValue partners }
  ecoProgrammes(province: $p, district: $d) { name partner partnerType status participants districts supportValue targetParticipantTypes }
  ecoMarketActivity(province: $p, district: $d) { periodDays hireBookings hireCompleted hireValue vetAppointments vetCompleted listingsActive listingsByCommodity contractsFulfilled contractsValue }
}`;

interface Props { province?: string; district?: string }

export default function EcosystemDashboard({ province, district }: Props) {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try { setD(await gqlRequest(QUERY, { p: province || null, d: district || null })); } catch (e: any) { setErr(e?.message ?? 'Failed to load'); } finally { setLoading(false); }
  }, [province, district]);
  useEffect(() => { load(); }, [load]);

  if (err) return <div className="p-6"><div className="flex items-center gap-2 p-3 rounded-xl text-sm border bg-red-50 border-red-200 text-red-700"><AlertTriangle className="w-4 h-4" /> {err}</div></div>;
  if (!d) return <div className="p-6 flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading ecosystem statistics…</div>;
  const o = d.ecoOverview, m = d.ecoMarketActivity;
  const types = (o.byType as any[]).map(t => t.businessType);
  const districtChart = (d.ecoParticipantsByDistrict as any[]).map(r => ({ name: r.district, ...parse(r.counts) }));
  const Card = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => <section className={`bg-white rounded-2xl border border-slate-200 p-5 ${className}`}><h3 className="font-semibold text-slate-800 mb-3">{title}</h3>{children}</section>;
  const Stat = ({ l, v, s }: { l: string; v: React.ReactNode; s?: string }) => <div className="bg-white rounded-2xl border border-slate-200 p-4"><div className="text-[11px] uppercase tracking-wide text-slate-500">{l}</div><div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{v}</div>{s && <div className="text-xs text-slate-500 mt-0.5">{s}</div>}</div>;
  const th = 'py-2 pr-3 font-medium text-left text-[11px] uppercase tracking-wide text-slate-500';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Globe2 className="w-5 h-5 text-amber-500" /> Ecosystem</h2><p className="text-xs text-slate-500">Every organisation type in {district || province || 'the country'} — farms, cooperatives and all vendors. Counts only; no organisation is named.</p></div>
        <button onClick={load} className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50" aria-label="Refresh"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Stat l="Organisations" v={fmt(o.organisations)} s={`${fmt(o.farms)} farms · ${fmt(o.vendors)} ${o.vendors === 1 ? "vendor" : "vendors"}`} />
        <Stat l="Sharing data" v={`${fmt(o.consentPct, 0)}%`} s={`${fmt(o.consenting)} opted in`} />
        <Stat l="Districts" v={fmt(o.districtsCovered)} s={`${o.provincesCovered} provinces`} />
        <Stat l="Marketplace providers" v={fmt(o.marketplaceProviders)} s={`${o.verifiedProviders} verified`} />
        <Stat l="Market activity (90 d)" v={fmt(o.hireBookings90d + o.vetAppointments90d)} s={`${o.hireBookings90d} hire bookings · ${o.vetAppointments90d} vet visits · ${o.activeListings} listings`} />
        <Stat l="Programmes" v={fmt(o.programmesActive)} s={`${o.programmeParticipants} participants · ZMW ${fmt(o.programmeSupportValue)} support`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card title="Organisations by type">
          <table className="w-full text-sm"><thead><tr><th className={th}>Type</th><th className={`${th} text-right`}>Total</th><th className={`${th} text-right`}>Sharing</th><th className={`${th} text-right`}>Districts</th></tr></thead>
            <tbody>{o.byType.map((t: any) => <tr key={t.businessType} className="border-t border-slate-100"><td className="py-1.5 pr-3 text-slate-800"><span className="inline-block w-2.5 h-2.5 rounded-sm mr-2" style={{ background: TYPE_COLOR[t.businessType] ?? '#94a3b8' }} />{TYPE_LABEL[t.businessType] ?? t.label}</td><td className="py-1.5 pr-3 text-right tabular-nums">{t.total}</td><td className="py-1.5 pr-3 text-right tabular-nums text-slate-500">{t.consenting}</td><td className="py-1.5 text-right tabular-nums text-slate-500">{t.districts}</td></tr>)}</tbody></table>
        </Card>
        <Card title="Participants by district" className="lg:col-span-2">
          {!districtChart.length ? <p className="text-sm text-slate-400">No organisations in scope.</p> : (
            <div className="h-64"><ResponsiveContainer><BarChart data={districtChart}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} formatter={(v: string) => TYPE_LABEL[v] ?? v} />
              {types.map(t => <Bar key={t} isAnimationActive={false} dataKey={t} stackId="a" fill={TYPE_COLOR[t] ?? '#94a3b8'} />)}
            </BarChart></ResponsiveContainer></div>
          )}
        </Card>
      </div>

      <Card title="Service coverage by district — where farms lack a vet, dealer, hire, buyer or transport">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{['Province', 'District', 'Farms', 'Vets', 'Dealers', 'Hire', 'Processors', 'Transport', 'Score', 'Gaps'].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody>{d.ecoServiceCoverage.map((r: any) => (
            <tr key={r.province + r.district} className="border-t border-slate-100">
              <td className="py-1.5 pr-3">{r.province}</td><td className="py-1.5 pr-3 font-medium">{r.district}</td>
              {[r.farms, r.vets, r.dealers, r.equipmentHire, r.processors, r.transport].map((v, i) => <td key={i} className={`py-1.5 pr-3 tabular-nums ${i > 0 && v === 0 && r.farms > 0 ? 'text-red-600 font-semibold' : ''}`}>{v}</td>)}
              <td className="py-1.5 pr-3"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${r.coverageScore >= 4 ? 'bg-green-100 text-green-700' : r.coverageScore >= 2 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{r.coverageScore} / 5</span></td>
              <td className="py-1.5 text-xs text-slate-600">{r.gaps.join(' · ') || <span className="text-green-700">Fully served</span>}</td>
            </tr>
          ))}</tbody></table></div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Marketplace providers (public profiles)">
          {!d.ecoProviders.length ? <p className="text-sm text-slate-400">No marketplace provider profiles in scope yet.</p> : (
            <table className="w-full text-sm"><thead><tr><th className={th}>Type</th><th className={`${th} text-right`}>Providers</th><th className={`${th} text-right`}>Verified</th><th className={`${th} text-right`}>Districts</th><th className={`${th} text-right`}>Rating</th><th className={`${th} text-right`}>Services</th></tr></thead>
              <tbody>{d.ecoProviders.map((p: any) => <tr key={p.providerType} className="border-t border-slate-100"><td className="py-1.5 pr-3">{p.label}</td><td className="py-1.5 pr-3 text-right tabular-nums">{p.providers}</td><td className="py-1.5 pr-3 text-right tabular-nums">{p.verified}</td><td className="py-1.5 pr-3 text-right tabular-nums">{p.districts}</td><td className="py-1.5 pr-3 text-right tabular-nums">{p.avgRating ? p.avgRating.toFixed(1) : '—'}</td><td className="py-1.5 text-right tabular-nums">{p.services}</td></tr>)}</tbody></table>
          )}
        </Card>
        <Card title={`Market activity (last ${m.periodDays} days)`}>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-slate-500">Equipment-hire bookings</dt><dd className="text-right tabular-nums font-medium">{m.hireBookings} <span className="text-slate-400 font-normal">({m.hireCompleted} completed · ZMW {fmt(m.hireValue)})</span></dd>
            <dt className="text-slate-500">Vet appointments</dt><dd className="text-right tabular-nums font-medium">{m.vetAppointments} <span className="text-slate-400 font-normal">({m.vetCompleted} completed)</span></dd>
            <dt className="text-slate-500">Active listings</dt><dd className="text-right tabular-nums font-medium">{m.listingsActive}</dd>
            <dt className="text-slate-500">Contracts fulfilled</dt><dd className="text-right tabular-nums font-medium">{m.contractsFulfilled} <span className="text-slate-400 font-normal">(ZMW {fmt(m.contractsValue)})</span></dd>
          </dl>
          {Object.keys(parse(m.listingsByCommodity)).length > 0 && <div className="mt-3 text-xs text-slate-500">Listings: {Object.entries(parse(m.listingsByCommodity)).map(([k, v]) => `${k} ${v}`).join(' · ')}</div>}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Programme coverage by district (all partners)">
          {!d.ecoProgrammeCoverage.length ? <p className="text-sm text-slate-400">No programme participants in scope.</p> : (
            <table className="w-full text-sm"><thead><tr><th className={th}>District</th><th className={`${th} text-right`}>Programmes</th><th className={`${th} text-right`}>Participants</th><th className={`${th} text-right`}>Support</th><th className={th}>Partners</th></tr></thead>
              <tbody>{d.ecoProgrammeCoverage.map((r: any) => <tr key={r.province + r.district} className="border-t border-slate-100"><td className="py-1.5 pr-3 font-medium">{r.district}<span className="text-slate-400 font-normal"> · {r.province}</span></td><td className="py-1.5 pr-3 text-right tabular-nums">{r.programmes}</td><td className="py-1.5 pr-3 text-right tabular-nums">{r.participants}</td><td className="py-1.5 pr-3 text-right tabular-nums">{fmt(r.supportValue)}</td><td className="py-1.5 text-xs text-slate-600">{r.partners.join(', ')}</td></tr>)}</tbody></table>
          )}
        </Card>
        <Card title="Programmes running in scope">
          {!d.ecoProgrammes.length ? <p className="text-sm text-slate-400">None.</p> : (
            <ul className="divide-y divide-slate-100 text-sm">{d.ecoProgrammes.map((p: any) => (
              <li key={p.name + p.partner} className="py-2 flex flex-wrap items-baseline gap-x-3"><span className="font-medium text-slate-900">{p.name}</span><span className="text-slate-500">{p.partner} ({p.partnerType})</span><span className="text-xs text-slate-500 ml-auto tabular-nums">{p.participants} participants · {p.districts} districts · ZMW {fmt(p.supportValue)}</span>{p.targetParticipantTypes.length > 0 && <span className="w-full text-[11px] text-slate-400">Targets: {p.targetParticipantTypes.map((t: string) => TYPE_LABEL[t] ?? t).join(', ')}</span>}</li>
            ))}</ul>
          )}
        </Card>
      </div>
    </div>
  );
}
