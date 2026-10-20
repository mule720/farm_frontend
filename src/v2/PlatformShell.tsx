// ─────────────────────────────────────────────────
// AGRINUXES — Platform admin portal
// For accounts with the platform-admin role (saas_admin). They belong to no farm or business.
//   Overview · Organisations · AI settings (paste the Claude API key) · User guide
// ─────────────────────────────────────────────────
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { gqlRequest } from '@/lib/api';

type Tab = 'overview' | 'orgs' | 'ai' | 'guide';
const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'overview', icon: '📊', label: 'Overview' },
  { id: 'orgs', icon: '🏢', label: 'Organisations' },
  { id: 'ai', icon: '✨', label: 'AI settings' },
  { id: 'guide', icon: '📘', label: 'User guide' },
];

const TYPE_LABEL: Record<string, string> = {
  farmer: 'Farm', cooperative: 'Cooperative', agro_dealer: 'Agro dealer', vet_provider: 'Vet', equipment_hire: 'Equipment hire',
  agrifood_seller: 'AgriFood seller', agrisupply_provider: 'AgriSupply', agriservices_provider: 'AgriServices', processor: 'Processor',
  transport: 'Transport', government: 'Government', ngo: 'NGO', donor: 'Donor',
};
const label = (t: string) => TYPE_LABEL[t] ?? t;
const parse = (s: any) => (typeof s === 'string' ? JSON.parse(s) : s);

const card = 'bg-white rounded-2xl border border-slate-200 p-5';

function Stat({ title, value, hint }: { title: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className={card}>
      <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">{title}</div>
      <div className="text-3xl font-bold text-slate-900 mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}

function Overview() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    gqlRequest<any>('{ platformOverview }').then(r => setD(parse(r.platformOverview))).catch(e => setErr(e.message));
  }, []);
  if (err) return <p className="text-red-600 text-sm">{err}</p>;
  if (!d) return <p className="text-slate-500 text-sm">Loading…</p>;
  const types = Object.entries(d.byBusinessType as Record<string, number>).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...types.map(t => t[1]));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat title="Organisations" value={d.organisations} hint={`${d.newOrganisations7d} new in 7 days`} />
        <Stat title="People with accounts" value={d.users} hint={`${d.newUsers7d} new in 7 days`} />
        <Stat title="Farms and cooperatives" value={(d.byBusinessType.farmer ?? 0) + (d.byBusinessType.cooperative ?? 0)} />
        <Stat title="Government, NGO, donor" value={(d.byKind.government ?? 0) + (d.byKind.ngo ?? 0) + (d.byKind.donor ?? 0)} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className={card}>
          <h3 className="font-semibold text-slate-800 mb-3">Businesses by type</h3>
          <div className="space-y-2">
            {types.map(([t, n]) => (
              <div key={t} className="flex items-center gap-3 text-sm">
                <div className="w-32 text-slate-600 truncate">{label(t)}</div>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${(n / max) * 100}%` }} /></div>
                <div className="w-8 text-right font-semibold text-slate-700">{n}</div>
              </div>
            ))}
            {types.length === 0 && <p className="text-sm text-slate-400">No businesses yet.</p>}
          </div>
        </div>
        <div className={card}>
          <h3 className="font-semibold text-slate-800 mb-3">Newest organisations</h3>
          <ul className="divide-y divide-slate-100 text-sm">
            {d.recent.map((o: any, i: number) => (
              <li key={i} className="py-2 flex justify-between gap-3">
                <span className="font-medium text-slate-800 truncate">{o.name}</span>
                <span className="text-slate-500 flex-shrink-0">{label(o.type)} · {new Date(o.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Organisations() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const load = useCallback((s: string) => {
    gqlRequest<any>('query($s:String){ platformOrganisations(search:$s, limit:300) }', { s }).then(r => setRows(parse(r.platformOrganisations))).catch(e => setErr(e.message));
  }, []);
  useEffect(() => { const t = setTimeout(() => load(q), 250); return () => clearTimeout(t); }, [q, load]);
  return (
    <div className="space-y-4">
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name…" className="w-full max-w-sm border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <div className={`${card} p-0 overflow-x-auto`}>
        <table className="w-full text-sm min-w-[640px]">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
            <th className="px-4 py-3">Name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Country</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3 text-right">People</th><th className="px-4 py-3">Joined</th>
          </tr></thead>
          <tbody>
            {(rows ?? []).map(o => (
              <tr key={o.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-2.5 font-medium text-slate-800">{o.name}{!o.active && <span className="ml-2 text-[10px] bg-slate-200 rounded px-1.5 py-0.5">inactive</span>}</td>
                <td className="px-4 py-2.5 text-slate-600">{label(o.orgType === 'farm' ? o.businessType : o.orgType)}</td>
                <td className="px-4 py-2.5 text-slate-600">{o.country || '—'}</td>
                <td className="px-4 py-2.5 text-slate-600 capitalize">{o.plan}</td>
                <td className="px-4 py-2.5 text-right text-slate-600">{o.users ?? '—'}</td>
                <td className="px-4 py-2.5 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {rows && rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Nothing found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AiSettings() {
  const [s, setS] = useState<any>(null);
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const load = useCallback(() => { gqlRequest<any>('{ platformAiSettings }').then(r => setS(parse(r.platformAiSettings))).catch(e => setMsg({ ok: false, text: e.message })); }, []);
  useEffect(load, [load]);

  async function save() {
    setBusy(true); setMsg(null);
    try {
      await gqlRequest('mutation($k:String!){ savePlatformAiKey(apiKey:$k){ ok } }', { k: key });
      setKey(''); setMsg({ ok: true, text: 'Key saved. The AI guide now answers with the model.' }); load();
    } catch (e: any) { setMsg({ ok: false, text: e.message }); } finally { setBusy(false); }
  }
  async function clear() {
    setBusy(true); setMsg(null);
    try { await gqlRequest('mutation{ clearPlatformAiKey{ ok } }'); setMsg({ ok: true, text: 'Key removed.' }); load(); }
    catch (e: any) { setMsg({ ok: false, text: e.message }); } finally { setBusy(false); }
  }
  if (!s) return <p className="text-slate-500 text-sm">{msg?.text ?? 'Loading…'}</p>;
  return (
    <div className="max-w-2xl space-y-5">
      <div className={card}>
        <div className="flex items-center gap-3">
          <span className={`inline-block w-3 h-3 rounded-full ${s.usingModel ? 'bg-emerald-500' : 'bg-amber-400'}`} />
          <div>
            <div className="font-semibold text-slate-900">{s.usingModel ? 'The AI guide is using the model' : 'The AI guide is in guide mode'}</div>
            <div className="text-sm text-slate-500">
              {s.usingModel
                ? `Answers come from ${s.model}${s.fromEnvironment ? ' (key from the server settings)' : ''}.`
                : 'No key is set, so answers are excerpts from the user guide. Paste a key below to switch on real AI replies.'}
            </div>
          </div>
        </div>
      </div>
      <div className={card}>
        <h3 className="font-semibold text-slate-800">Claude API key</h3>
        <p className="text-sm text-slate-500 mt-1">It powers the AI guide and the image analysis. It is stored encrypted and is never shown again after you save it.</p>
        {s.hasSavedKey && (
          <p className="text-sm mt-3 text-slate-700">Saved key: <code className="bg-slate-100 rounded px-1.5 py-0.5">{s.maskedKey}</code>
            {s.updatedBy && <span className="text-slate-400"> · set by {s.updatedBy}</span>}
            {!s.active && <span className="ml-2 text-amber-700">(switched off)</span>}</p>
        )}
        <div className="mt-3 flex gap-2">
          <input type="password" autoComplete="new-password" value={key} onChange={e => setKey(e.target.value)} placeholder="Paste the key (starts with sk-ant-)"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <button onClick={save} disabled={busy || key.trim().length < 20} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold px-4">{s.hasSavedKey ? 'Replace key' : 'Save key'}</button>
        </div>
        {s.hasSavedKey && <button onClick={clear} disabled={busy} className="mt-3 text-sm text-red-600 hover:underline">Remove the saved key</button>}
        {msg && <p className={`mt-3 text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</p>}
      </div>
    </div>
  );
}

function Guide() {
  const [html, setHtml] = useState<string | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { gqlRequest<any>('{ platformGuide }').then(r => setHtml(r.platformGuide || '')).catch(e => setErr(e.message)); }, []);
  if (err) return <p className="text-red-600 text-sm">{err}</p>;
  if (html === null) return <p className="text-slate-500 text-sm">Loading the guide…</p>;
  if (!html) return <p className="text-slate-500 text-sm">The guide file is not on the server.</p>;
  return <iframe title="AGRINUXES user guide" srcDoc={html} sandbox="allow-scripts" className="w-full rounded-2xl border border-slate-200 bg-white" style={{ height: 'calc(100vh - 150px)' }} />;
}

export default function PlatformShell() {
  const { profile, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [open, setOpen] = useState(true);
  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className={`fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 z-40 transition-all duration-300 flex flex-col ${open ? 'w-60' : 'w-14'}`}>
        <div className="flex items-center gap-2 px-3 py-4 border-b border-slate-800">
          <button onClick={() => setOpen(o => !o)} aria-label="Toggle sidebar" className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white flex-shrink-0">☰</button>
          {open && <div className="min-w-0"><div className="text-white font-bold text-sm">AGRINUXES</div><div className="text-emerald-400 text-xs truncate">Platform admin</div><div className="text-slate-500 text-[11px] truncate">{profile?.email}</div></div>}
        </div>
        <nav className="flex-1 py-3">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${tab === t.id ? 'bg-emerald-500/15 text-emerald-300 border-r-2 border-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
              <span className="text-base flex-shrink-0">{t.icon}</span>{open && <span className="text-sm font-medium">{t.label}</span>}
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-3">
          <button onClick={signOut} className="w-full flex items-center gap-3 px-2 py-2 text-slate-400 hover:text-red-400 text-left"><span>🚪</span>{open && <span className="text-sm">Sign Out</span>}</button>
        </div>
      </aside>
      <main className={`flex-1 transition-all duration-300 ${open ? 'ml-60' : 'ml-14'}`}>
        <div className="p-6 max-w-6xl">
          <h1 className="text-xl font-bold text-slate-900 mb-5">{TABS.find(t => t.id === tab)?.label}</h1>
          {tab === 'overview' && <Overview />}
          {tab === 'orgs' && <Organisations />}
          {tab === 'ai' && <AiSettings />}
          {tab === 'guide' && <Guide />}
        </div>
      </main>
    </div>
  );
}
