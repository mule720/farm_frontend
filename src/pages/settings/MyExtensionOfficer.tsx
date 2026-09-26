// ─────────────────────────────────────────────────────────────────────────────
// Farmer-facing: assigned extension officer(s) and visit history.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { Phone, Mail, ClipboardList } from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import { MY_EXTENSION_QUERY, type Officer, type ExtVisit } from '@/graphql/extensionQueries';

export default function MyExtensionOfficer() {
  const [officers, setOfficers] = useState<Officer[] | null>(null);
  const [visits, setVisits] = useState<ExtVisit[]>([]);

  useEffect(() => {
    gqlRequest<{ myExtensionOfficers: Officer[]; myExtensionVisits: ExtVisit[] }>(MY_EXTENSION_QUERY)
      .then(r => { setOfficers(r.myExtensionOfficers); setVisits(r.myExtensionVisits); })
      .catch(() => setOfficers([]));
  }, []);

  if (officers === null) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5" data-testid="my-extension-officer">
      <h3 className="font-semibold text-slate-800 mb-1">Your extension officer</h3>
      {!officers.length ? (
        <p className="text-xs text-slate-500">No extension officer is assigned yet. Officers in your district can add your farm once data sharing is enabled and your province / district are set.</p>
      ) : (
        <ul className="space-y-2 mt-2">
          {officers.map(o => (
            <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-medium text-slate-900">{o.fullName}</span>
              <span className="text-slate-500">{o.organizationName}</span>
              {o.phone && <a href={`tel:${o.phone}`} className="inline-flex items-center gap-1 text-emerald-700"><Phone className="w-3.5 h-3.5" />{o.phone}</a>}
              {o.email && <a href={`mailto:${o.email}`} className="inline-flex items-center gap-1 text-emerald-700"><Mail className="w-3.5 h-3.5" />{o.email}</a>}
            </li>
          ))}
        </ul>
      )}
      {visits.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2"><ClipboardList className="w-3.5 h-3.5" /> Visit log</div>
          <ul className="divide-y divide-slate-100">
            {visits.slice(0, 10).map(v => (
              <li key={v.id} className="py-2 text-sm">
                <div className="flex justify-between gap-3"><span className="font-medium text-slate-800">{v.purpose}</span><span className="text-xs text-slate-500 whitespace-nowrap">{v.visitDate} · {v.officerName}</span></div>
                {v.findings && <div className="text-xs text-slate-600 mt-0.5"><span className="text-slate-400">Findings:</span> {v.findings}</div>}
                {v.recommendations && <div className="text-xs text-slate-700 mt-0.5"><span className="text-slate-400">Advice:</span> {v.recommendations}</div>}
                {v.followUpDate && !v.followUpDone && <div className="text-[11px] text-amber-700 mt-0.5">Follow-up planned {v.followUpDate}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
