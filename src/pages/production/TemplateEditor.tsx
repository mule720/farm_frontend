// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Template editor
// Lets a farmer set their own standards for an enterprise: which things are
// recorded every day (feed type, water, medicine…) and the care guide
// (feeding programme, vaccinations, sprays) — then save them as "my template"
// to reuse on the next cycle.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useOrg } from '@/store/orgStore';
import { baseTemplateOf } from '@/lib/templates';
import { CATEGORY_DAILY_FIELDS, getRecordFields } from '@/lib/recordFields';
import { CARE_DEFAULTS, CARE_KINDS, careKindMeta, getCareSchedule } from '@/lib/careSchedule';
import type { CareItem, CareKind, EnterpriseConfig, ProductionTemplate, RecordFieldDef } from '@/lib/types';

interface Props {
  enterprise: EnterpriseConfig;
  template: ProductionTemplate;
  initialTab?: 'fields' | 'care';
  onClose: () => void;
}

const inputCls = 'w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500';
const labelCls = 'block text-[11px] font-medium text-slate-500 mb-0.5';

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const num = (v: string): number | undefined => (v.trim() === '' || isNaN(Number(v)) ? undefined : Number(v));
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || 'field';

export default function TemplateEditor({ enterprise, template, initialTab = 'fields', onClose }: Props) {
  const { saveCustomTemplate, deleteCustomTemplate } = useOrg();
  const base = baseTemplateOf(template);
  const [tab, setTab] = useState<'fields' | 'care'>(initialTab);
  const [name, setName] = useState(template.isCustom ? template.name : `My ${template.name}`);
  const [fields, setFields] = useState<RecordFieldDef[]>(() => clone(getRecordFields(template)));
  const [care, setCare] = useState<CareItem[]>(() => clone(getCareSchedule(template)));
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ── field helpers ──────────────────────────────────────────────────────────
  const patchField = (i: number, p: Partial<RecordFieldDef>) =>
    setFields(prev => prev.map((f, idx) => idx === i ? { ...f, ...p } : f));
  const moveField = (i: number, d: -1 | 1) => setFields(prev => {
    const j = i + d; if (j < 0 || j >= prev.length) return prev;
    const next = [...prev]; [next[i], next[j]] = [next[j], next[i]]; return next;
  });
  function addField() {
    setFields(prev => {
      let id = 'custom_field', n = 1;
      while (prev.some(f => f.id === id)) id = `custom_field_${++n}`;
      return [...prev, { id, label: '', type: 'number' }];
    });
  }
  function setFieldType(i: number, type: RecordFieldDef['type']) {
    patchField(i, {
      type,
      options: type === 'select' ? (fields[i].options?.length ? fields[i].options : ['Yes', 'No']) : undefined,
      unit: type === 'number' ? fields[i].unit : undefined,
      benchmark: type === 'number' ? fields[i].benchmark : undefined,
    });
  }

  // ── care helpers ───────────────────────────────────────────────────────────
  const patchCare = (i: number, p: Partial<CareItem>) =>
    setCare(prev => prev.map((c, idx) => idx === i ? { ...c, ...p } : c));
  const addCare = (kind: CareKind) =>
    setCare(prev => [...prev, { id: `c_${uuidv4().slice(0, 8)}`, kind, title: '', startDay: 0 }]);

  function resetToDefaults() {
    setFields(clone(CATEGORY_DAILY_FIELDS[base.category] ?? []));
    setCare(clone(CARE_DEFAULTS[base.id] ?? []));
  }

  function validate(): string {
    for (const f of fields) {
      if (!f.label.trim()) return 'Every record field needs a name.';
      if (f.type === 'select' && (f.options ?? []).filter(o => o.trim()).length < 2)
        return `"${f.label}" is a choice field — give it at least two options.`;
    }
    for (const c of care) {
      if (!c.title.trim()) return 'Every care-guide item needs a title.';
      if (c.endDay !== undefined && c.endDay < c.startDay) return `"${c.title}": the end day is before the start day.`;
      if (c.repeatEveryDays !== undefined && c.repeatEveryDays < 1) return `"${c.title}": repeat every must be 1 day or more.`;
    }
    return '';
  }

  function save(asNew: boolean) {
    const msg = validate();
    if (msg) { setError(msg); return; }
    if (!name.trim()) { setError('Give your template a name.'); return; }
    const cleanFields = fields.map(f => ({
      ...f, label: f.label.trim(),
      options: f.type === 'select' ? (f.options ?? []).map(o => o.trim()).filter(Boolean) : undefined,
    }));
    const reuse = template.isCustom && !asNew;
    const saved: ProductionTemplate = {
      ...template,
      id: reuse ? template.id : `custom_${uuidv4()}`,
      name: name.trim(),
      shortName: name.trim(),
      baseTemplateId: base.id,
      isCustom: true,
      version: reuse ? (template.version ?? 1) + 1 : 1,
      recordFields: cleanFields,
      careSchedule: care,
    };
    saveCustomTemplate(saved, enterprise.id);
    onClose();
  }

  const stat = useMemo(() => ({ f: fields.length, c: care.length }), [fields.length, care.length]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-4xl max-h-[94vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-800">Set your standards — {enterprise.name}</h3>
            <p className="text-xs text-slate-500">
              Based on {base.name}. Change what you record each day and your feeding, vaccination and spray guide, then save it as your own template.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 flex-shrink-0"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        {/* tabs */}
        <div className="flex items-center gap-1 px-5 pt-3">
          {([['fields', `Daily record fields (${stat.f})`], ['care', `Care guide (${stat.c})`]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === id ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {label}
            </button>
          ))}
          <button onClick={() => { if (window.confirm('Replace everything here with the built-in defaults?')) resetToDefaults(); }}
            className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Back to built-in defaults
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3">
          {tab === 'fields' && (
            <>
              <p className="text-xs text-slate-500">These are the boxes on the Daily Log. Add anything you want to record — type of feed, water treatment, medicine given — and mark what is required.</p>
              {fields.map((f, i) => (
                <div key={f.id + i} className={`border rounded-xl p-3 ${f.type === 'computed' ? 'bg-slate-50 border-slate-200' : 'border-slate-200'}`}>
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-12 sm:col-span-5">
                      <label className={labelCls}>Name</label>
                      <input className={inputCls} value={f.label} placeholder="e.g. Type of feed"
                        onChange={e => patchField(i, { label: e.target.value })} />
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <label className={labelCls}>Kind</label>
                      {f.type === 'computed'
                        ? <div className="text-xs text-slate-500 py-2">Calculated automatically</div>
                        : <select className={inputCls} value={f.type} onChange={e => setFieldType(i, e.target.value as RecordFieldDef['type'])}>
                            <option value="number">Number</option>
                            <option value="select">Choice from a list</option>
                            <option value="text">Free text</option>
                          </select>}
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      {f.type === 'number' && (<>
                        <label className={labelCls}>Unit</label>
                        <input className={inputCls} value={f.unit ?? ''} placeholder="kg, L…" onChange={e => patchField(i, { unit: e.target.value || undefined })} />
                      </>)}
                    </div>
                    <div className="col-span-8 sm:col-span-1 flex items-center gap-1.5 pb-1.5">
                      {f.type !== 'computed' && (
                        <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                          <input type="checkbox" checked={!!f.required} onChange={e => patchField(i, { required: e.target.checked })} /> Required
                        </label>
                      )}
                    </div>
                    <div className="col-span-4 sm:col-span-1 flex items-center justify-end gap-0.5 pb-1">
                      <button title="Move up" onClick={() => moveField(i, -1)} className="p-1 rounded hover:bg-slate-100"><ArrowUp className="w-3.5 h-3.5 text-slate-500" /></button>
                      <button title="Move down" onClick={() => moveField(i, 1)} className="p-1 rounded hover:bg-slate-100"><ArrowDown className="w-3.5 h-3.5 text-slate-500" /></button>
                      <button title="Remove" onClick={() => setFields(prev => prev.filter((_, idx) => idx !== i))} className="p-1 rounded hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                    </div>
                  </div>

                  {f.type === 'select' && (
                    <div className="mt-2">
                      <label className={labelCls}>Options — one per line</label>
                      <textarea className={inputCls} rows={Math.min(6, Math.max(2, (f.options ?? []).length))}
                        value={(f.options ?? []).join('\n')}
                        onChange={e => patchField(i, { options: e.target.value.split('\n') })} />
                    </div>
                  )}
                  {f.type === 'number' && (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <div><label className={labelCls}>Normal minimum</label>
                        <input type="number" className={inputCls} value={f.benchmark?.min ?? ''}
                          onChange={e => patchField(i, { benchmark: { ...f.benchmark, min: num(e.target.value) } })} /></div>
                      <div><label className={labelCls}>Normal maximum</label>
                        <input type="number" className={inputCls} value={f.benchmark?.max ?? ''}
                          onChange={e => patchField(i, { benchmark: { ...f.benchmark, max: num(e.target.value) } })} /></div>
                      <div><label className={labelCls}>Target</label>
                        <input type="number" className={inputCls} value={f.benchmark?.target ?? ''}
                          onChange={e => patchField(i, { benchmark: { ...f.benchmark, target: num(e.target.value) } })} /></div>
                    </div>
                  )}
                  {f.type !== 'computed' && (
                    <div className="mt-2">
                      <label className={labelCls}>Hint shown under the box (optional)</label>
                      <input className={inputCls} value={f.hint ?? ''} onChange={e => patchField(i, { hint: e.target.value || undefined })} />
                    </div>
                  )}
                  {f.visibleFor && (
                    <p className="mt-1.5 text-[11px] text-slate-400">Shown only for some cycle types of this enterprise.</p>
                  )}
                </div>
              ))}
              <button onClick={addField} className="flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800">
                <Plus className="w-4 h-4" /> Add a record field
              </button>
            </>
          )}

          {tab === 'care' && (
            <>
              <p className="text-xs text-slate-500">
                Days count from the start of the cycle (day 0). A single day is a one-off task; add a repeat to make it recur; give an end day without a repeat to cover a whole phase (such as “Starter feed, day 0–13”).
                Check every dose and product with your vet or extension officer.
              </p>
              {care.map((c, i) => (
                <div key={c.id} className="border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5 sm:col-span-3">
                      <label className={labelCls}>Type</label>
                      <select className={inputCls} value={c.kind} onChange={e => patchCare(i, { kind: e.target.value as CareKind })}>
                        {CARE_KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
                      </select>
                    </div>
                    <div className="col-span-7 sm:col-span-8">
                      <label className={labelCls}>What</label>
                      <input className={inputCls} value={c.title} placeholder="e.g. Gumboro vaccine" onChange={e => patchCare(i, { title: e.target.value })} />
                    </div>
                    <div className="col-span-12 sm:col-span-1 flex justify-end pb-1">
                      <button title="Remove" onClick={() => setCare(prev => prev.filter((_, idx) => idx !== i))} className="p-1 rounded hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div><label className={labelCls}>Product / feed type</label>
                      <input className={inputCls} value={c.product ?? ''} onChange={e => patchCare(i, { product: e.target.value || undefined })} /></div>
                    <div><label className={labelCls}>Dose / amount</label>
                      <input className={inputCls} value={c.dose ?? ''} onChange={e => patchCare(i, { dose: e.target.value || undefined })} /></div>
                    <div><label className={labelCls}>How (route / method)</label>
                      <input className={inputCls} value={c.method ?? ''} onChange={e => patchCare(i, { method: e.target.value || undefined })} /></div>
                    <div><label className={labelCls}>Withdrawal (days)</label>
                      <input type="number" min={0} className={inputCls} value={c.withdrawalDays ?? ''} onChange={e => patchCare(i, { withdrawalDays: num(e.target.value) })} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className={labelCls}>Starts on day</label>
                      <input type="number" min={0} className={inputCls} value={c.startDay} onChange={e => patchCare(i, { startDay: num(e.target.value) ?? 0 })} /></div>
                    <div><label className={labelCls}>Repeat every (days)</label>
                      <input type="number" min={1} className={inputCls} value={c.repeatEveryDays ?? ''} placeholder="no repeat" onChange={e => patchCare(i, { repeatEveryDays: num(e.target.value) })} /></div>
                    <div><label className={labelCls}>Until day</label>
                      <input type="number" min={0} className={inputCls} value={c.endDay ?? ''} placeholder="same day" onChange={e => patchCare(i, { endDay: num(e.target.value) })} /></div>
                  </div>
                  <div><label className={labelCls}>Notes</label>
                    <input className={inputCls} value={c.notes ?? ''} onChange={e => patchCare(i, { notes: e.target.value || undefined })} /></div>
                  {c.visibleFor && <p className="text-[11px] text-slate-400">Applies only to some cycle types of this enterprise.</p>}
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">Add:</span>
                {CARE_KINDS.map(k => (
                  <button key={k.id} onClick={() => addCare(k.id)}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${k.tone} hover:opacity-80`}>+ {k.label}</button>
                ))}
                <button onClick={() => setCare(prev => [...prev].sort((a, b) => a.startDay - b.startDay))}
                  className="ml-auto text-xs text-slate-500 underline">Sort by day</button>
              </div>
              <p className="text-[11px] text-slate-400">{care.length} item{care.length === 1 ? '' : 's'}; types are colour-coded: {CARE_KINDS.map(k => careKindMeta(k.id).label).join(', ')}.</p>
            </>
          )}
        </div>

        {/* footer */}
        <div className="px-5 py-4 border-t border-slate-200 space-y-2">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <label className={labelCls}>Template name</label>
              <input className={inputCls} value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              {template.isCustom && !confirmDelete && (
                <button onClick={() => setConfirmDelete(true)} className="px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50">Delete template</button>
              )}
              {confirmDelete && (
                <button onClick={() => { deleteCustomTemplate(template.id); onClose(); }}
                  className="px-3 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700">Confirm delete (back to built-in)</button>
              )}
              <button onClick={onClose} className="px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              {template.isCustom && (
                <button onClick={() => save(true)} className="px-3 py-2 rounded-lg text-sm border border-slate-300 text-slate-700 hover:bg-slate-50">Save as new copy</button>
              )}
              <button onClick={() => save(false)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700">
                {template.isCustom ? 'Save changes' : 'Save as my template'}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">Saved templates are shared with everyone in your company and can be chosen for your next cycle.</p>
        </div>
      </div>
    </div>
  );
}
