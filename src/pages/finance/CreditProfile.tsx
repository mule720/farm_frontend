// ─────────────────────────────────────────────────────────────────────────────
// Credit Profile — the farm's own view of its lender-ready summary, plus
// consent-based sharing (tokenised links) and PDF export.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useState } from 'react';
import { Landmark, Link2, Download, Loader2, RefreshCw, Copy, Ban, CheckCircle2, AlertTriangle } from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { mediaUrl } from '@/graphql/tradeQueries';
import { MY_CREDIT_QUERY, CREATE_SHARE_MUTATION, REVOKE_SHARE_MUTATION, CREDIT_PDF_MUTATION, parseSummary, type CreditSummary, type ShareGrant } from '@/graphql/creditQueries';
import CreditReportView from './CreditReportView';

const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400';

export default function CreditProfile() {
  const { profile } = useAuth();
  const canShare = profile?.role === 'director' || profile?.role === 'finance_manager';
  const [summary, setSummary] = useState<CreditSummary | null>(null);
  const [grants, setGrants] = useState<ShareGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState({ n: '', c: '', p: 'Seasonal input loan application', d: '30' });
  const [busy, setBusy] = useState<string | null>(null);
  const [lastLink, setLastLink] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await gqlRequest<{ myCreditSummary: { summary: any }; creditShareGrants: ShareGrant[] }>(MY_CREDIT_QUERY); setSummary(parseSummary(r.myCreditSummary.summary)); setGrants(r.creditShareGrants); }
    catch (e: any) { setMsg({ ok: false, text: e?.message ?? 'Failed to load' }); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function share(e: React.FormEvent) {
    e.preventDefault(); setBusy('share'); setMsg(null);
    try {
      const r = await gqlRequest<{ createCreditShareGrant: { grant: ShareGrant } }>(CREATE_SHARE_MUTATION, { n: f.n, c: f.c, p: f.p, d: Number(f.d) });
      const link = window.location.origin + r.createCreditShareGrant.grant.shareUrlPath;
      setLastLink(link); setMsg({ ok: true, text: `Share link created for ${f.n}. It expires in ${f.d} days and can be revoked any time.` }); setF(x => ({ ...x, n: '', c: '' })); load();
    } catch (err: any) { setMsg({ ok: false, text: err?.message }); } finally { setBusy(null); }
  }
  async function revoke(g: ShareGrant) {
    if (!confirm(`Revoke ${g.lenderName}'s access?`)) return;
    setBusy(g.id); try { await gqlRequest(REVOKE_SHARE_MUTATION, { id: g.id }); setMsg({ ok: true, text: `Access for ${g.lenderName} revoked.` }); load(); } catch (err: any) { setMsg({ ok: false, text: err?.message }); } finally { setBusy(null); }
  }
  async function pdf() {
    setBusy('pdf'); try { const r = await gqlRequest<{ generateCreditSummaryPdf: { url: string } }>(CREDIT_PDF_MUTATION, {}); window.open(mediaUrl(r.generateCreditSummaryPdf.url), '_blank'); setMsg({ ok: true, text: 'PDF generated.' }); } catch (err: any) { setMsg({ ok: false, text: err?.message }); } finally { setBusy(null); }
  }
  function copy(link: string) { navigator.clipboard?.writeText(link).then(() => setMsg({ ok: true, text: 'Link copied.' })).catch(() => setMsg({ ok: false, text: 'Copy failed — select the link and copy it manually.' })); }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Landmark className="w-6 h-6 text-emerald-600" /> Credit Profile</h1>
          <p className="text-sm text-slate-500 mt-1">A lender-ready summary built from your own records — production consistency, profitability, trading history and verification. Share it with a bank or MFI when you apply for a loan.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={pdf} disabled={busy === 'pdf' || !summary} className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">{busy === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF</button>
          <button onClick={load} className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50" aria-label="Refresh"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>
      {msg && <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${msg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{msg.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {msg.text}</div>}
      {lastLink && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm">
          <div className="font-semibold text-emerald-900 mb-1">Send this link to the lender</div>
          <div className="flex items-center gap-2"><code className="flex-1 text-xs bg-white border border-emerald-200 rounded-lg px-3 py-2 break-all">{lastLink}</code><button onClick={() => copy(lastLink)} className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs"><Copy className="w-3.5 h-3.5" /> Copy</button></div>
        </div>
      )}

      {!summary ? <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Computing your credit summary…</div> : <CreditReportView s={summary} />}

      <div className="grid lg:grid-cols-5 gap-5">
        <section className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2"><Link2 className="w-4 h-4" /> Share with a lender</h3>
          <p className="text-xs text-slate-500 mb-3">Creates a private, read-only link. The lender sees this summary without an account. You choose how long it lasts and can revoke it at any time.</p>
          {!canShare ? <p className="text-sm text-slate-400">Only a director or finance manager can share the credit summary.</p> : (
            <form onSubmit={share} className="space-y-2">
              <input value={f.n} onChange={e => setF(x => ({ ...x, n: e.target.value }))} placeholder="Lender (e.g. Zanaco, NATSAVE, FINCA, Vision Fund)" className={inputCls} required />
              <input value={f.c} onChange={e => setF(x => ({ ...x, c: e.target.value }))} placeholder="Credit officer email / phone (optional)" className={inputCls} />
              <input value={f.p} onChange={e => setF(x => ({ ...x, p: e.target.value }))} placeholder="Purpose" className={inputCls} />
              <div className="flex gap-2"><select value={f.d} onChange={e => setF(x => ({ ...x, d: e.target.value }))} className={`${inputCls} bg-white w-36`}>{['7', '14', '30', '60', '90'].map(d => <option key={d} value={d}>{d} days</option>)}</select>
                <button type="submit" disabled={busy === 'share'} className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{busy === 'share' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />} Create share link</button></div>
            </form>
          )}
        </section>
        <section className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-3">
          <h3 className="font-semibold text-slate-900 mb-3">Who has access</h3>
          {!grants.length ? <p className="text-sm text-slate-400">No lender has been given access.</p> : (
            <ul className="divide-y divide-slate-100">{grants.map(g => (
              <li key={g.id} className="py-2.5 flex flex-wrap items-center gap-3 text-sm">
                <div className="flex-1 min-w-0"><div className="font-medium text-slate-900">{g.lenderName}{g.lenderContact && <span className="text-slate-500 font-normal"> · {g.lenderContact}</span>}</div><div className="text-xs text-slate-500">{g.purpose && `${g.purpose} · `}created {new Date(g.createdAt).toLocaleDateString()} · expires {new Date(g.expiresAt).toLocaleDateString()} · opened {g.accessCount}×{g.lastAccessedAt && `, last ${new Date(g.lastAccessedAt).toLocaleString()}`}</div></div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${g.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{g.isRevoked ? 'Revoked' : g.isActive ? 'Active' : 'Expired'}</span>
                {g.isActive && <><button onClick={() => copy(window.location.origin + g.shareUrlPath)} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-emerald-700" title="Copy link"><Copy className="w-4 h-4" /></button>
                  {canShare && <button onClick={() => revoke(g)} disabled={busy === g.id} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 disabled:opacity-50" title="Revoke"><Ban className="w-4 h-4" /></button>}</>}
              </li>
            ))}</ul>
          )}
        </section>
      </div>
    </div>
  );
}
