// ─────────────────────────────────────────────────────────────────────────────
// Public lender view — opened from a farm-issued share link (/?credit=TOKEN).
// No account needed; the token is the credential. Read-only.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { Landmark, Loader2, ShieldAlert, Printer } from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import { LENDER_REPORT_QUERY, parseSummary, type CreditSummary } from '@/graphql/creditQueries';
import CreditReportView from './CreditReportView';

export default function LenderReport({ token }: { token: string }) {
  const [s, setS] = useState<CreditSummary | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    gqlRequest<{ lenderCreditReport: { summary: any } }>(LENDER_REPORT_QUERY, { t: token }, null)
      .then(r => setS(parseSummary(r.lenderCreditReport.summary))).catch(e => setErr(e?.message ?? 'Could not open this report'));
  }, [token]);
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center gap-3">
        <Landmark className="w-5 h-5 text-emerald-400" />
        <div className="flex-1"><div className="font-bold">AGRINUXES — Farm credit summary</div><div className="text-xs text-slate-400">Shared by the farm for credit assessment · read-only</div></div>
        {s && <button onClick={() => window.print()} className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-600 rounded-lg text-xs text-slate-200 hover:bg-slate-800"><Printer className="w-3.5 h-3.5" /> Print</button>}
      </header>
      <main className="max-w-5xl mx-auto p-6 space-y-4">
        {err ? (
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center"><ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-3" /><div className="font-semibold text-slate-900">{err}</div><p className="text-sm text-slate-500 mt-1">Ask the farm to issue a new share link from their Credit Profile.</p></div>
        ) : !s ? <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Opening report…</div> : (
          <>
            {s.shared_with && <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-600">Prepared for <strong className="text-slate-900">{s.shared_with.lender}</strong>{s.shared_with.purpose && <> · {s.shared_with.purpose}</>} · link valid until {new Date(s.shared_with.expires_at).toLocaleDateString()}</div>}
            <CreditReportView s={s} />
          </>
        )}
      </main>
    </div>
  );
}
