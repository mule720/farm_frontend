// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Care Plan tab
// What is due today (feed programme, vaccinations, sprays…), what is overdue,
// what is coming, and the whole guide — driven by the template the farmer
// chose or customised. Items are ticked off per day.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import { Check, Undo2, Settings2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useOrg } from '@/store/orgStore';
import { useAuth } from '@/contexts/AuthContext';
import { templateFamily } from '@/lib/templates';
import { inferVariant } from '@/lib/recordFields';
import {
  appliesTo, buildAgenda, careKindMeta, cycleDayOf, describeTiming,
  getCareSchedule, isStarterGuide, type CareOccurrence,
} from '@/lib/careSchedule';
import type { CareItem, ProductionCycle, ProductionTemplate } from '@/lib/types';
import TemplateEditor from './TemplateEditor';

interface Props {
  cycle: ProductionCycle;
  template: ProductionTemplate | undefined;
}

function Chip({ item }: { item: CareItem }) {
  const m = careKindMeta(item.kind);
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${m.tone}`}>{m.label}</span>;
}

function Detail({ item }: { item: CareItem }) {
  const bits = [item.product, item.dose, item.method].filter(Boolean);
  return (
    <>
      {bits.length > 0 && <div className="text-xs text-slate-600 mt-0.5">{bits.join(' · ')}</div>}
      {item.withdrawalDays ? <div className="text-xs text-amber-700 mt-0.5">Stop {item.withdrawalDays} day{item.withdrawalDays === 1 ? '' : 's'} before harvest / slaughter / milk use — check the label.</div> : null}
      {item.notes && <div className="text-xs text-slate-500 mt-0.5">{item.notes}</div>}
    </>
  );
}

export default function CarePlanTab({ cycle, template }: Props) {
  const { org, updateEnterprise, setCareDone } = useOrg();
  const { profile } = useAuth();
  const enterprise = org?.enterprises.find(e => e.id === cycle.enterpriseId);
  const [editor, setEditor] = useState<null | 'fields' | 'care'>(null);
  const [showAll, setShowAll] = useState(false);

  const variantId = template ? inferVariant(cycle, template.category) : '__default__';
  const items = useMemo(() => getCareSchedule(template), [template]);
  const cycleDay = cycleDayOf(cycle.startDate);
  const agenda = useMemo(
    () => buildAgenda(items, cycleDay, variantId, cycle.careLog),
    [items, cycleDay, variantId, cycle.careLog],
  );
  const family = template ? templateFamily(template) : [];
  const applicable = items.filter(i => appliesTo(i, variantId)).sort((a, b) => a.startDay - b.startDay);
  const active = cycle.status === 'active';

  if (!template || !enterprise) {
    return <p className="text-sm text-slate-400 text-center py-10">This cycle's enterprise is no longer in your workspace, so there is no care guide to show.</p>;
  }

  const mark = (o: CareOccurrence, done: boolean) => setCareDone(cycle.id, o.key, done, profile?.full_name);

  function Row({ o, tone }: { o: CareOccurrence; tone: 'due' | 'late' | 'soon' }) {
    const border = tone === 'late' ? 'border-red-200 bg-red-50/60' : tone === 'due' ? 'border-green-200 bg-green-50/60' : 'border-slate-200 bg-white';
    return (
      <div className={`flex items-start gap-3 border rounded-xl px-3 py-2.5 ${border} ${o.done ? 'opacity-60' : ''}`}>
        <Chip item={o.item} />
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-medium text-slate-800 ${o.done ? 'line-through' : ''}`}>{o.item.title}</div>
          <Detail item={o.item} />
          <div className="text-[11px] text-slate-400 mt-0.5">
            Day {o.day}{tone === 'late' ? ` · ${cycleDay - o.day} day${cycleDay - o.day === 1 ? '' : 's'} late` : tone === 'soon' ? ` · in ${o.day - cycleDay} day${o.day - cycleDay === 1 ? '' : 's'}` : ''}
            {o.done && cycle.careLog?.[o.key] && ` · done ${new Date(cycle.careLog[o.key].doneAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}${cycle.careLog[o.key].by ? ` by ${cycle.careLog[o.key].by}` : ''}`}
          </div>
        </div>
        {active && (o.done
          ? <button onClick={() => mark(o, false)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1"><Undo2 className="w-3.5 h-3.5" /> Undo</button>
          : <button onClick={() => mark(o, true)} className="flex items-center gap-1 text-xs font-semibold bg-green-600 text-white rounded-lg px-2.5 py-1.5 hover:bg-green-700"><Check className="w-3.5 h-3.5" /> Done</button>)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Template in use */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Template in use</div>
            <div className="text-sm font-semibold text-slate-800 truncate">
              {template.name}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-medium ${template.isCustom ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                {template.isCustom ? `My template · v${template.version ?? 1}` : 'Built-in'}
              </span>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {family.length > 1 && (
              <select value={enterprise.templateId}
                onChange={e => updateEnterprise(enterprise.id, { templateId: e.target.value })}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm bg-white">
                {family.map(t => <option key={t.id} value={t.id}>{t.isCustom ? `Mine: ${t.name}` : `Built-in: ${t.name}`}</option>)}
              </select>
            )}
            <button onClick={() => setEditor('care')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700">
              <Settings2 className="w-4 h-4" /> {template.isCustom ? 'Edit my standards' : 'Set my standards'}
            </button>
          </div>
        </div>
        {isStarterGuide(template) && (
          <div className="flex gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>This is a <b>starter guide</b> — typical practice, not a prescription. Review the products and doses with your vet or extension officer, then use <b>Set my standards</b> to adjust it to how you farm and save it as your template.</div>
          </div>
        )}
      </div>

      {items.length === 0 && (
        <div className="text-center py-10 border border-dashed border-slate-300 rounded-xl">
          <p className="text-sm font-medium text-slate-700">No care guide for {template.name} yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Add your own feeding programme, vaccinations, treatments or sprays with the day each one is due. They will appear here as reminders.</p>
          <button onClick={() => setEditor('care')} className="mt-3 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700">Build my care guide</button>
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="text-sm text-slate-600">
            {cycleDay < 0 ? `Cycle starts in ${-cycleDay} day${cycleDay === -1 ? '' : 's'}.` : <>Today is <b>day {cycleDay}</b> of this cycle.</>}
          </div>

          {agenda.phases.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">The programme right now</h4>
              <div className="space-y-2">
                {agenda.phases.map(p => (
                  <div key={p.id} className="flex items-start gap-3 border border-slate-200 bg-white rounded-xl px-3 py-2.5">
                    <Chip item={p} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-800">{p.title}</div>
                      <Detail item={p} />
                      <div className="text-[11px] text-slate-400 mt-0.5">{describeTiming(p)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {agenda.overdue.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-2">Overdue ({agenda.overdue.length})</h4>
              <div className="space-y-2">{agenda.overdue.slice(0, 20).map(o => <Row key={o.key} o={o} tone="late" />)}</div>
              {agenda.overdue.length > 20 && <p className="text-xs text-slate-400 mt-1">+ {agenda.overdue.length - 20} older</p>}
            </section>
          )}

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-2">Due today ({agenda.today.length})</h4>
            {agenda.today.length === 0
              ? <p className="text-sm text-slate-400">Nothing scheduled for today.</p>
              : <div className="space-y-2">{agenda.today.map(o => <Row key={o.key} o={o} tone="due" />)}</div>}
          </section>

          {agenda.upcoming.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Coming in the next 7 days ({agenda.upcoming.length})</h4>
              <div className="space-y-2">{agenda.upcoming.map(o => <Row key={o.key} o={o} tone="soon" />)}</div>
            </section>
          )}

          <section>
            <button onClick={() => setShowAll(v => !v)} className="flex items-center gap-1 text-sm font-medium text-slate-700">
              {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} Whole guide ({applicable.length} items)
            </button>
            {showAll && (
              <div className="mt-2 border border-slate-200 rounded-xl overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr><th className="px-3 py-2 text-left">When</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">What</th><th className="px-3 py-2 text-left">Product / dose</th></tr>
                  </thead>
                  <tbody>
                    {applicable.map(i => (
                      <tr key={i.id} className="border-t border-slate-100 align-top">
                        <td className="px-3 py-2 whitespace-nowrap text-slate-600">{describeTiming(i)}</td>
                        <td className="px-3 py-2"><Chip item={i} /></td>
                        <td className="px-3 py-2 text-slate-800">{i.title}</td>
                        <td className="px-3 py-2 text-slate-600">{[i.product, i.dose, i.method].filter(Boolean).join(' · ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {editor && (
        <TemplateEditor enterprise={enterprise} template={template} initialTab={editor} onClose={() => setEditor(null)} />
      )}
    </div>
  );
}
