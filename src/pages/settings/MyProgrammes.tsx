// ─────────────────────────────────────────────────────────────────────────────
// Farmer-facing: programmes this farm is enrolled in and support received.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { Handshake } from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import { MY_PROGRAMMES_QUERY, type MyProgramme } from '@/graphql/partnerQueries';

const title = (s: string) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function MyProgrammes() {
  const [rows, setRows] = useState<MyProgramme[] | null>(null);
  useEffect(() => { gqlRequest<{ myProgrammes: MyProgramme[] }>(MY_PROGRAMMES_QUERY).then(r => setRows(r.myProgrammes)).catch(() => setRows([])); }, []);
  if (!rows || !rows.length) return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5" data-testid="my-programmes">
      <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Handshake className="w-4 h-4 text-sky-600" /> Development programmes</h3>
      <ul className="space-y-4">
        {rows.map(p => {
          const total = p.support.reduce((s, x) => s + Number(x.value || 0), 0);
          return (
            <li key={p.programmeId}>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-medium text-slate-900">{p.name}</span>
                <span className="text-sm text-slate-500">{p.partnerName}{p.funder && ` · funded by ${p.funder}`}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{title(p.status)}</span>
                {p.cohort && <span className="text-xs text-slate-500">{p.cohort}</span>}
              </div>
              {p.support.length > 0 && (
                <div className="mt-2">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Support received · {p.support[0].currency} {total.toLocaleString()}</div>
                  <ul className="divide-y divide-slate-100 text-sm">
                    {p.support.map(s => (
                      <li key={s.id} className="py-1.5 flex justify-between gap-3">
                        <span className="text-slate-800">{title(s.supportType)}: {s.description}{s.reference && <span className="text-slate-400"> · {s.reference}</span>}</span>
                        <span className="text-slate-500 whitespace-nowrap">{s.deliveredOn}{Number(s.value) > 0 && ` · ${s.currency} ${Number(s.value).toLocaleString()}`}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
