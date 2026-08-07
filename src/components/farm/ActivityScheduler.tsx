import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, X, Bell, BellOff, RefreshCw, Clock, CheckCircle2, AlertTriangle,
  Circle, Trash2, RotateCcw, Calendar, SkipForward, Filter, Edit2,
  User, ChevronDown, Building2, Flag,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  type ScheduledActivity, type ActivityType, type RecurrenceFreq, type ActivityPriority,
  ACTIVITY_TYPE_DEFS, FREQ_LABELS, PRIORITY_META,
  getTypesForModule, getTypeDef,
  loadActivities, addActivity, updateActivity, deleteActivity,
  markCompletion, dismissReminder,
  getOccurrences, getStatusOnDate, getDueReminders,
  blankActivity,
} from '@/lib/activityData';

// ─── Exported types for consumers ────────────────────────────────────────────

export interface EnterpriseOption {
  id: string;
  name: string;
  moduleType: string;   // productionType e.g. 'poultry', 'horticulture'
}

export interface MemberOption {
  id: string;
  fullName: string;
  role: string;
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface Batch { id: string; name: string; }

interface Props {
  moduleType: string;
  enterpriseId: string;
  enterpriseName: string;
  batches?: Batch[];
  members?: MemberOption[];
}

type TabId = 'today' | 'upcoming' | 'overdue' | 'all';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateStr(d: Date) { return d.toISOString().split('T')[0]; }
function today() { return toDateStr(new Date()); }
function in90() { const d = new Date(); d.setDate(d.getDate() + 90); return toDateStr(d); }
function past90() { const d = new Date(); d.setDate(d.getDate() - 90); return toDateStr(d); }

function formatDate(ds: string) {
  const d = new Date(ds + 'T00:00');
  const t = today();
  if (ds === t) return 'Today';
  const tom = new Date(); tom.setDate(tom.getDate() + 1);
  if (ds === toDateStr(tom)) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(ds: string): number {
  const d = new Date(ds + 'T00:00');
  const t = new Date(today() + 'T00:00');
  return Math.round((d.getTime() - t.getTime()) / 86_400_000);
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Reminder Alert Banner ────────────────────────────────────────────────────

function ReminderBanner({ reminders, onDismiss }: {
  reminders: { activity: ScheduledActivity; date: string }[];
  onDismiss: (id: string, date: string) => void;
}) {
  if (!reminders.length) return null;
  return (
    <div className="space-y-2 mb-4">
      {reminders.map(({ activity: a, date }) => {
        const td = getTypeDef(a.type);
        const du = daysUntil(date);
        const timeLabel = du === 0 ? `today at ${a.scheduledTime}` : du === 1 ? 'tomorrow' : `in ${du} days`;
        return (
          <div key={`${a.id}-${date}`} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Bell className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-amber-900 text-sm">{a.title}</span>
              <span className="text-amber-700 text-xs ml-2">due {timeLabel} — {a.enterpriseName}</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${td.color}`}>{td.label}</span>
            <button onClick={() => onDismiss(a.id, date)} className="p-1 hover:bg-amber-100 rounded-lg">
              <X className="w-3.5 h-3.5 text-amber-600" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Activity Card ────────────────────────────────────────────────────────────

function ActivityCard({ activity, date, onDone, onSkip, onDelete, onUndone, onEdit }: {
  activity: ScheduledActivity;
  date: string;
  onDone: () => void;
  onSkip: () => void;
  onDelete: () => void;
  onUndone: () => void;
  onEdit: () => void;
}) {
  const td = getTypeDef(activity.type);
  const status = getStatusOnDate(activity, date);
  const du = daysUntil(date);
  const pm = PRIORITY_META[activity.priority ?? 'medium'];

  const priorityBorder = activity.priority === 'high'
    ? 'border-l-red-400' : activity.priority === 'medium'
    ? 'border-l-amber-300' : 'border-l-slate-200';

  return (
    <div className={`bg-white border border-l-4 ${priorityBorder} rounded-xl p-4 transition-all ${
      status === 'done'    ? 'border-green-200 bg-green-50/40 opacity-80' :
      status === 'skipped' ? 'border-slate-200 opacity-60' :
      status === 'overdue' ? 'border-red-200 bg-red-50/30' :
                             'border-slate-200 hover:border-slate-300 hover:shadow-sm'
    }`}>
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <button onClick={status === 'done' || status === 'skipped' ? onUndone : onDone}
          className="mt-0.5 flex-shrink-0" title={status === 'done' ? 'Mark undone' : 'Mark done'}>
          {status === 'done'    ? <CheckCircle2 className="w-5 h-5 text-green-500" />
          : status === 'skipped' ? <SkipForward className="w-5 h-5 text-slate-400" />
          : status === 'overdue' ? <AlertTriangle className="w-5 h-5 text-red-400" />
          : <Circle className="w-5 h-5 text-slate-300 hover:text-green-400 transition-colors" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`font-semibold text-sm ${status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
              {activity.title}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${td.color}`}>{td.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5 ${pm.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${pm.dot}`} />{pm.label}
            </span>
            {activity.recurring && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 font-medium flex items-center gap-0.5">
                <RefreshCw className="w-2.5 h-2.5" />{FREQ_LABELS[activity.recurrenceFreq!] ?? 'Recurring'}
              </span>
            )}
            {activity.reminderEnabled && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 font-medium flex items-center gap-0.5">
                <Bell className="w-2.5 h-2.5" />{activity.reminderAmount}{activity.reminderUnit === 'hours' ? 'h' : 'd'} before
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{activity.scheduledTime}</span>
            {activity.batchName && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{activity.batchName}</span>}
            {activity.assignedToName && (
              <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {initials(activity.assignedToName)}
                </span>
                {activity.assignedToName.split(' ')[0]}
              </span>
            )}
            {activity.notes && <span className="italic truncate max-w-40">"{activity.notes}"</span>}
            {activity.pushToDailyPlan && <span className="text-blue-500">→ Daily Plan</span>}
          </div>

          {status === 'overdue' && (
            <div className="text-xs text-red-500 font-medium mt-1">
              {Math.abs(du)} day{Math.abs(du) !== 1 ? 's' : ''} overdue
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onEdit} title="Edit"
            className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          {status === 'pending' || status === 'overdue' ? (
            <>
              <button onClick={onDone} title="Mark done"
                className="p-1.5 hover:bg-green-100 rounded-lg text-slate-400 hover:text-green-600 transition-colors">
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button onClick={onSkip} title="Skip"
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                <SkipForward className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button onClick={onUndone} title="Undo"
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button onClick={onDelete} title="Delete"
            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Activity Modal ───────────────────────────────────────────────────────────

export function ActivityModal({
  initial, moduleType: initialModuleType, enterpriseName: initialEntName,
  batches: initialBatches, onSave, onClose,
  enterprises, members, onLoadBatches,
}: {
  initial: ScheduledActivity;
  moduleType: string;
  enterpriseName: string;
  batches: Batch[];
  onSave: (a: ScheduledActivity) => void;
  onClose: () => void;
  // optional: when creating from a cross-enterprise context (dashboard)
  enterprises?: EnterpriseOption[];
  members?: MemberOption[];
  onLoadBatches?: (enterpriseId: string) => Promise<Batch[]>;
}) {
  const [form, setForm] = useState<ScheduledActivity>({
    ...initial,
    priority: initial.priority ?? 'medium',
    assignedToId: initial.assignedToId ?? '',
    assignedToName: initial.assignedToName ?? '',
  });
  const [availableBatches, setAvailableBatches] = useState<Batch[]>(initialBatches);
  const [currentModuleType, setCurrentModuleType] = useState(initialModuleType);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // When enterprises prop is present and initial has no enterprise yet → user must pick one
  const isEnterpriseSelectable = !!enterprises && enterprises.length > 0 && !initial.enterpriseId;

  const set = <K extends keyof ScheduledActivity>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));
  const toggle = <K extends keyof ScheduledActivity>(k: K) => () =>
    setForm(f => ({ ...f, [k]: !f[k] }));

  async function handleEnterpriseChange(entId: string) {
    const ent = enterprises?.find(e => e.id === entId);
    if (!ent) return;
    setCurrentModuleType(ent.moduleType);
    setForm(f => ({
      ...f,
      enterpriseId: ent.id,
      enterpriseName: ent.name,
      moduleType: ent.moduleType,
      batchId: '',
      batchName: '',
      type: 'feeding',
    }));
    if (onLoadBatches) {
      setLoadingBatches(true);
      try {
        const b = await onLoadBatches(ent.id);
        setAvailableBatches(b);
      } catch { setAvailableBatches([]); }
      finally { setLoadingBatches(false); }
    }
  }

  const types = getTypesForModule(currentModuleType);
  const isValid = form.title.trim().length > 0 && form.scheduledDate.length > 0 && form.enterpriseId.length > 0;

  const displayEnterpriseName = enterprises?.find(e => e.id === form.enterpriseId)?.name
    || form.enterpriseName || initialEntName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">{initial.id && initial.title ? 'Edit Activity' : 'Schedule Activity'}</h2>
              <p className="text-green-100 text-xs mt-0.5">
                {displayEnterpriseName || (isEnterpriseSelectable ? 'Select an enterprise below' : '—')}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── Enterprise selector (only when creating from dashboard) ────── */}
          {isEnterpriseSelectable && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                Enterprise *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={form.enterpriseId}
                  onChange={e => handleEnterpriseChange(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 appearance-none bg-white"
                >
                  <option value="">— Select enterprise —</option>
                  {enterprises!.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* When enterprise is fixed (editing or from enterprise module): show static badge */}
          {!isEnterpriseSelectable && form.enterpriseId && enterprises && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
              <Building2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-green-800">{displayEnterpriseName}</span>
              <span className="text-xs text-green-500 ml-auto">Enterprise locked</span>
            </div>
          )}

          {/* ── Activity type grid ─────────────────────────────────────────── */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Activity Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {types.map(t => (
                <button key={t.id} onClick={() => setForm(f => ({ ...f, type: t.id }))}
                  className={`px-2 py-2 rounded-xl text-xs font-medium border-2 transition-all text-center ${
                    form.type === t.id ? `${t.color} border-current` : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Title + Priority ───────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Title *</label>
              <input value={form.title} onChange={set('title')}
                placeholder={`e.g. Morning ${getTypeDef(form.type).label}`}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Priority</label>
              <div className="flex flex-col gap-1">
                {(['high', 'medium', 'low'] as ActivityPriority[]).map(p => {
                  const pm = PRIORITY_META[p];
                  return (
                    <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        form.priority === p ? `${pm.color} border-current` : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}>
                      <Flag className="w-3 h-3" />{pm.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Date + Time ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Date *</label>
              <input type="date" value={form.scheduledDate} onChange={set('scheduledDate')}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Time</label>
              <input type="time" value={form.scheduledTime} onChange={set('scheduledTime')}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>

          {/* ── Assign to ──────────────────────────────────────────────────── */}
          {members && members.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                Assign To
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={form.assignedToId}
                  onChange={e => {
                    const m = members.find(m => m.id === e.target.value);
                    setForm(f => ({ ...f, assignedToId: e.target.value, assignedToName: m?.fullName ?? '' }));
                  }}
                  className="w-full text-sm border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 appearance-none bg-white"
                >
                  <option value="">— Unassigned —</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName} ({m.role})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {form.assignedToName && (
                <div className="mt-1.5 flex items-center gap-2 text-xs text-blue-600">
                  <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {initials(form.assignedToName)}
                  </span>
                  <span>Assigned to <strong>{form.assignedToName}</strong> — they will see this in their task list</span>
                </div>
              )}
            </div>
          )}

          {/* ── Batch selector ─────────────────────────────────────────────── */}
          {(availableBatches.length > 0 || loadingBatches) && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                Product / Batch {loadingBatches && <span className="text-slate-400 font-normal">(loading…)</span>}
              </label>
              <select
                value={form.batchId}
                disabled={loadingBatches}
                onChange={e => setForm(f => ({
                  ...f, batchId: e.target.value,
                  batchName: availableBatches.find(b => b.id === e.target.value)?.name ?? '',
                }))}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-slate-50"
              >
                <option value="">— All products / batches —</option>
                {availableBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          {/* ── Notes ─────────────────────────────────────────────────────── */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Optional details…"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
          </div>

          {/* ── Reminder ───────────────────────────────────────────────────── */}
          <div className={`rounded-xl border p-4 transition-all ${form.reminderEnabled ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {form.reminderEnabled ? <Bell className="w-4 h-4 text-amber-500" /> : <BellOff className="w-4 h-4 text-slate-400" />}
                <span className="text-sm font-semibold text-slate-700">Reminder</span>
              </div>
              <button onClick={toggle('reminderEnabled')}
                className={`w-10 h-5 rounded-full transition-colors flex items-center ${form.reminderEnabled ? 'bg-amber-500' : 'bg-slate-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-all mx-0.5 ${form.reminderEnabled ? 'ml-5' : 'ml-0.5'}`} />
              </button>
            </div>
            {form.reminderEnabled && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 flex-shrink-0">Remind me</span>
                <input type="number" min={1} max={999} value={form.reminderAmount}
                  onChange={e => setForm(f => ({ ...f, reminderAmount: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-16 text-sm border border-amber-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-center font-semibold" />
                <select value={form.reminderUnit} onChange={set('reminderUnit')}
                  className="flex-1 text-sm border border-amber-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                  <option value="hours">hours before</option>
                  <option value="days">days before</option>
                </select>
              </div>
            )}
          </div>

          {/* ── Recurring ──────────────────────────────────────────────────── */}
          <div className={`rounded-xl border p-4 transition-all ${form.recurring ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${form.recurring ? 'text-indigo-500' : 'text-slate-400'}`} />
                <span className="text-sm font-semibold text-slate-700">Recurring</span>
              </div>
              <button onClick={toggle('recurring')}
                className={`w-10 h-5 rounded-full transition-colors flex items-center ${form.recurring ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-all mx-0.5 ${form.recurring ? 'ml-5' : 'ml-0.5'}`} />
              </button>
            </div>
            {form.recurring && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1.5">Repeat frequency</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(FREQ_LABELS) as [RecurrenceFreq, string][]).map(([freq, label]) => (
                      <button key={freq} onClick={() => setForm(f => ({ ...f, recurrenceFreq: freq }))}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          form.recurrenceFreq === freq ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 text-slate-600 hover:border-indigo-300 bg-white'
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1.5">Ends</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="recEnd" value="never" checked={form.recurrenceEnd === 'never'}
                        onChange={() => setForm(f => ({ ...f, recurrenceEnd: 'never' }))} className="accent-indigo-600" />
                      <span className="text-sm text-slate-700">Never</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="recEnd" value="count" checked={form.recurrenceEnd === 'count'}
                        onChange={() => setForm(f => ({ ...f, recurrenceEnd: 'count' }))} className="accent-indigo-600" />
                      <span className="text-sm text-slate-700">After</span>
                      <input type="number" min={1} max={999} value={form.recurrenceCount}
                        onFocus={() => setForm(f => ({ ...f, recurrenceEnd: 'count' }))}
                        onChange={e => setForm(f => ({ ...f, recurrenceCount: Math.max(1, parseInt(e.target.value) || 1), recurrenceEnd: 'count' }))}
                        className="w-16 text-sm border border-indigo-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-center font-semibold" />
                      <span className="text-sm text-slate-700">occurrences</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="recEnd" value="date" checked={form.recurrenceEnd === 'date'}
                        onChange={() => setForm(f => ({ ...f, recurrenceEnd: 'date' }))} className="accent-indigo-600" />
                      <span className="text-sm text-slate-700">On date</span>
                      <input type="date" value={form.recurrenceEndDate}
                        onFocus={() => setForm(f => ({ ...f, recurrenceEnd: 'date' }))}
                        onChange={e => setForm(f => ({ ...f, recurrenceEndDate: e.target.value, recurrenceEnd: 'date' }))}
                        className="flex-1 text-sm border border-indigo-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Push to daily plan ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-sm font-semibold text-slate-700">Add to Daily Plan</div>
                <div className="text-xs text-slate-400">Shows in the daily plan on the scheduled day</div>
              </div>
            </div>
            <button onClick={toggle('pushToDailyPlan')}
              className={`w-10 h-5 rounded-full transition-colors flex items-center ${form.pushToDailyPlan ? 'bg-blue-500' : 'bg-slate-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-all mx-0.5 ${form.pushToDailyPlan ? 'ml-5' : 'ml-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 flex gap-3 border-t border-slate-100 flex-shrink-0">
          <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl text-sm font-medium transition-colors">
            Cancel
          </button>
          <button onClick={() => isValid && onSave(form)} disabled={!isValid}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
            {initial.title === '' ? 'Schedule Activity' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ActivityScheduler ───────────────────────────────────────────────────

export default function ActivityScheduler({ moduleType, enterpriseId, enterpriseName, batches = [], members }: Props) {
  const { profile } = useAuth();
  const org = profile?.organization || 'demo';
  const currentUserId = (profile as any)?.id || '';

  const [activities, setActivities] = useState<ScheduledActivity[]>([]);
  const [tab, setTab] = useState<TabId>('today');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [mineOnly, setMineOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editActivity, setEditActivity] = useState<ScheduledActivity | null>(null);

  const reload = useCallback(() => {
    const all = loadActivities(org);
    setActivities(all.filter(a => a.enterpriseId === enterpriseId));
  }, [org, enterpriseId]);

  useEffect(() => { reload(); }, [reload]);

  const allOrg = loadActivities(org).filter(a => a.enterpriseId === enterpriseId);
  const dueReminders = getDueReminders(allOrg);

  function handleDismissReminder(id: string, date: string) {
    dismissReminder(org, id, date);
    reload();
  }

  const t = today();

  interface OccurrenceItem {
    activity: ScheduledActivity;
    date: string;
    status: ReturnType<typeof getStatusOnDate>;
  }

  function buildList(from: string, to: string, filterFn?: (item: OccurrenceItem) => boolean): OccurrenceItem[] {
    const items: OccurrenceItem[] = [];
    const source = mineOnly ? activities.filter(a => a.assignedToId === currentUserId) : activities;
    for (const a of source) {
      const dates = getOccurrences(a, from, to);
      for (const date of dates) {
        const status = getStatusOnDate(a, date);
        const item = { activity: a, date, status };
        if (!filterFn || filterFn(item)) items.push(item);
      }
    }
    return items.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const pa = priorityOrder[a.activity.priority ?? 'medium'];
      const pb = priorityOrder[b.activity.priority ?? 'medium'];
      return a.date.localeCompare(b.date) || pa - pb || a.activity.scheduledTime.localeCompare(b.activity.scheduledTime);
    });
  }

  const todayItems    = buildList(t, t);
  const upcomingItems = buildList(t, in90(), i => i.status === 'pending' && i.date > t);
  const overdueItems  = buildList(past90(), t, i => i.status === 'overdue');
  const allItems      = buildList(past90(), in90());

  const tabItems: Record<TabId, OccurrenceItem[]> = {
    today: todayItems, upcoming: upcomingItems, overdue: overdueItems, all: allItems,
  };

  const visible = typeFilter === 'all' ? tabItems[tab] : tabItems[tab].filter(i => i.activity.type === typeFilter);

  function handleSave(a: ScheduledActivity) {
    const all = loadActivities(org);
    if (all.find(x => x.id === a.id)) updateActivity(org, a.id, a);
    else addActivity(org, a);
    reload();
    setShowModal(false);
    setEditActivity(null);
  }

  function handleDone(id: string, date: string) { markCompletion(org, id, date, 'done'); reload(); }
  function handleSkip(id: string, date: string) { markCompletion(org, id, date, 'skipped'); reload(); }

  function handleUndone(id: string, date: string) {
    const all = loadActivities(org).map(a => {
      if (a.id !== id) return a;
      const { [date]: _, ...rest } = a.completions;
      return { ...a, completions: rest };
    });
    import('@/lib/activityData').then(m => m.saveActivities(org, all));
    reload();
  }

  function handleDelete(id: string) { deleteActivity(org, id); reload(); }

  const usedTypes = Array.from(new Set(activities.map(a => a.type)));
  const hasMine = currentUserId && activities.some(a => a.assignedToId === currentUserId);

  return (
    <div className="space-y-4">
      <ReminderBanner reminders={dueReminders} onDismiss={handleDismissReminder} />

      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 flex-wrap items-center">
          {([
            { id: 'today',    label: 'Today',   count: todayItems.length    },
            { id: 'upcoming', label: 'Upcoming', count: upcomingItems.length },
            { id: 'overdue',  label: 'Overdue',  count: overdueItems.length  },
            { id: 'all',      label: 'All',      count: null                 },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                tab === t.id
                  ? t.id === 'overdue' ? 'bg-red-100 text-red-700'
                  : t.id === 'today'   ? 'bg-green-100 text-green-700'
                  : 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}>
              {t.label}
              {t.count !== null && t.count > 0 && (
                <span className={`text-[10px] font-bold px-1 rounded-full ${
                  tab === t.id ? 'bg-white/30' : t.id === 'overdue' ? 'bg-red-200 text-red-700' : 'bg-slate-300 text-slate-600'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
          {hasMine && (
            <button onClick={() => setMineOnly(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all border ${
                mineOnly ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}>
              <User className="w-3 h-3" /> Mine
            </button>
          )}
        </div>
        <button onClick={() => { setEditActivity(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Schedule Activity
        </button>
      </div>

      {/* Type filter */}
      {usedTypes.length > 1 && (
        <div className="flex gap-1.5 flex-wrap items-center">
          <Filter className="w-3 h-3 text-slate-400" />
          <button onClick={() => setTypeFilter('all')}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${typeFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            All types
          </button>
          {usedTypes.map(type => {
            const td = getTypeDef(type as ActivityType);
            return (
              <button key={type} onClick={() => setTypeFilter(type)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${typeFilter === type ? td.color + ' ring-2 ring-current' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {td.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Activity list */}
      {visible.length === 0 ? (
        <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
          {tab === 'overdue' ? <CheckCircle2 className="w-10 h-10 text-green-200" /> : <Calendar className="w-10 h-10 text-slate-200" />}
          <div className="text-center">
            <div className="font-medium text-slate-500">
              {tab === 'today'    ? 'No activities scheduled for today'
              : tab === 'overdue' ? 'No overdue activities — great job!'
              : tab === 'upcoming'? 'No upcoming activities scheduled'
              : 'No activities yet'}
            </div>
            <button onClick={() => setShowModal(true)} className="text-sm text-green-600 hover:text-green-700 mt-1 font-medium">
              Schedule the first one →
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {tab === 'today'
            ? visible.map(item => (
                <ActivityCard key={`${item.activity.id}-${item.date}`}
                  activity={item.activity} date={item.date}
                  onDone={() => handleDone(item.activity.id, item.date)}
                  onSkip={() => handleSkip(item.activity.id, item.date)}
                  onUndone={() => handleUndone(item.activity.id, item.date)}
                  onDelete={() => handleDelete(item.activity.id)}
                  onEdit={() => { setEditActivity(item.activity); setShowModal(true); }}
                />
              ))
            : (() => {
                const grouped: Record<string, OccurrenceItem[]> = {};
                visible.forEach(item => {
                  if (!grouped[item.date]) grouped[item.date] = [];
                  grouped[item.date].push(item);
                });
                return Object.entries(grouped).map(([date, items]) => (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-1.5 mt-3 first:mt-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        date < t ? 'bg-red-100 text-red-600' : date === t ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}>{formatDate(date)}</span>
                      <div className="flex-1 h-px bg-slate-100" />
                    </div>
                    {items.map(item => (
                      <ActivityCard key={`${item.activity.id}-${item.date}`}
                        activity={item.activity} date={item.date}
                        onDone={() => handleDone(item.activity.id, item.date)}
                        onSkip={() => handleSkip(item.activity.id, item.date)}
                        onUndone={() => handleUndone(item.activity.id, item.date)}
                        onDelete={() => handleDelete(item.activity.id)}
                        onEdit={() => { setEditActivity(item.activity); setShowModal(true); }}
                      />
                    ))}
                  </div>
                ));
              })()
          }
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ActivityModal
          initial={editActivity ?? blankActivity(org, moduleType, enterpriseId, enterpriseName)}
          moduleType={moduleType}
          enterpriseName={enterpriseName}
          batches={batches}
          members={members}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditActivity(null); }}
        />
      )}
    </div>
  );
}
