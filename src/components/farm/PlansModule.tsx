import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar, Plus, X, ChevronDown, ChevronUp, Loader2, Save, Edit2,
  Trash2, CheckCircle, Clock, AlertCircle, DollarSign, Target,
  Megaphone, BarChart3, ClipboardList, Users, Leaf, TrendingUp,
  Package, RefreshCw, User, Bell, CheckCircle2, Circle, Flag, Building2,
} from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  loadActivities, markCompletion, addActivity, updateActivity,
  getActivitiesForDate, getStatusOnDate, getTypeDef, PRIORITY_META,
  blankActivity, newActivityId, ACTIVITY_TYPE_DEFS,
  type ScheduledActivity, type ActivityType, type ActivityPriority,
} from '@/lib/activityData';
import { ActivityModal, type EnterpriseOption, type MemberOption } from './ActivityScheduler';
import { getStageForAge, type EnterpriseId } from '@/lib/farmData';

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW', maximumFractionDigits: 2 }).format(n);

function today() {
  return new Date().toISOString().split('T')[0];
}

const TASK_TYPES = [
  { value: 'feeding', label: 'Feeding' },
  { value: 'health_check', label: 'Health Check' },
  { value: 'harvest', label: 'Harvesting' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'spraying', label: 'Spraying / Chemicals' },
  { value: 'weeding', label: 'Weeding' },
  { value: 'pruning', label: 'Pruning' },
  { value: 'planting', label: 'Planting / Transplanting' },
  { value: 'record_keeping', label: 'Record Keeping' },
  { value: 'cleaning', label: 'Cleaning / Sanitation' },
  { value: 'equipment', label: 'Equipment Maintenance' },
  { value: 'transport', label: 'Transport / Delivery' },
  { value: 'marketing', label: 'Marketing / Sales' },
  { value: 'other', label: 'Other' },
];

const BUDGET_CATEGORIES = [
  { value: 'labor', label: 'Labor' },
  { value: 'materials', label: 'Materials' },
  { value: 'equipment', label: 'Equipment / Tools' },
  { value: 'seeds_livestock', label: 'Seeds / Livestock' },
  { value: 'feeds', label: 'Feeds' },
  { value: 'chemicals', label: 'Chemicals / Pesticides' },
  { value: 'transport', label: 'Transport' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' },
];

const MARKETING_CHANNELS = [
  'Social Media', 'Local Market', 'Wholesale / Buyer', 'Retail',
  'Export', 'Direct Sale', 'Online Platform', 'Other',
];

// ─── Smart Suggest ────────────────────────────────────────────────────────────

interface SuggestedItem {
  id: string;
  title: string;
  type: ActivityType;
  priority: ActivityPriority;
  batchId?: string;
  batchName?: string;
  notes: string;
  reason: string;
}

function SmartSuggestModal({ org, selectedDate, selectedEnt, enterprises, memberOptions, onClose, onDone }: {
  org: string;
  selectedDate: string;
  selectedEnt: string;
  enterprises: any[];
  memberOptions: MemberOption[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<SuggestedItem[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const ent = enterprises.find(e => e.id === selectedEnt);
  const moduleType: EnterpriseId = (ent?.productionType || ent?.category || 'other') as EnterpriseId;

  useEffect(() => { generate(); }, []);

  async function generate() {
    setLoading(true);
    try {
      // Fetch active batches with age + count
      let activeBatches: any[] = [];
      try {
        const bd = await gqlRequest<{ batches: any[] }>(`
          query($eid: ID!) { batches(enterpriseId: $eid) { id name status ageDays currentCount } }
        `, { eid: selectedEnt });
        activeBatches = (bd.batches || []).filter((b: any) => b.status?.toLowerCase() === 'active');
      } catch {}

      // Load past activities for this enterprise
      const pastActivities = loadActivities(org).filter(a => a.enterpriseId === selectedEnt);
      const dayOfWeek = new Date(selectedDate).getDay();
      const weekdayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dayOfWeek];

      const items: SuggestedItem[] = [];

      // Per-batch feeding + watering
      for (const batch of activeBatches) {
        const ageDays = batch.ageDays ?? 0;
        const count = batch.currentCount ?? 0;
        const stage = getStageForAge(moduleType, ageDays);

        if (stage && count > 0) {
          const feedKg = ((stage.feedPerAnimalGrams * count) / 1000).toFixed(1);
          items.push({
            id: `feed-${batch.id}`,
            title: `Morning feeding — ${batch.name}: ${feedKg} kg`,
            type: 'feeding',
            priority: 'high',
            batchId: batch.id,
            batchName: batch.name,
            notes: `${stage.stage} (Day ${ageDays}) · ${stage.feedType} · ${stage.feedPerAnimalGrams} g/animal`,
            reason: 'Feeding schedule',
          });

          if (stage.waterPerAnimalMl > 0) {
            const waterL = ((stage.waterPerAnimalMl * count) / 1000).toFixed(0);
            items.push({
              id: `water-${batch.id}`,
              title: `Water check — ${batch.name}: ${waterL} L`,
              type: 'watering',
              priority: 'high',
              batchId: batch.id,
              batchName: batch.name,
              notes: `${stage.waterPerAnimalMl} ml/animal · ${count.toLocaleString()} animals`,
              reason: 'Feeding schedule',
            });
          }

          // Vaccination milestones (poultry at Day 7, 14, 21)
          if (['poultry', 'village-chicken'].includes(moduleType) && [7, 14, 21].includes(ageDays)) {
            items.push({
              id: `vax-${batch.id}-d${ageDays}`,
              title: `Vaccination — ${batch.name} (Day ${ageDays})`,
              type: 'vaccination',
              priority: 'high',
              batchId: batch.id,
              batchName: batch.name,
              notes: `Standard schedule: Day ${ageDays} vaccination`,
              reason: 'Vaccination milestone',
            });
          }

          // Weekly weighing
          if (ageDays > 0 && ageDays % 7 === 0) {
            items.push({
              id: `weigh-${batch.id}`,
              title: `Weekly weighing — ${batch.name}`,
              type: 'weighing',
              priority: 'medium',
              batchId: batch.id,
              batchName: batch.name,
              notes: `Day ${ageDays} — record average weight`,
              reason: 'Weekly routine',
            });
          }
        }
      }

      // Routine tasks when any active batches exist
      if (activeBatches.length > 0) {
        items.push({
          id: 'mortality-daily',
          title: `Mortality check — all ${activeBatches.length} batches`,
          type: 'mortality-check',
          priority: 'high',
          notes: `Daily record of deaths and sick animals`,
          reason: 'Daily routine',
        });
        items.push({
          id: 'biosecurity-daily',
          title: 'Biosecurity inspection',
          type: 'biosecurity',
          priority: 'medium',
          notes: 'Footbaths, entry log, perimeter check',
          reason: 'Daily routine',
        });
      }

      // Recurring patterns (same weekday, done 2+ times in past)
      const patternMap = new Map<string, { count: number; act: ScheduledActivity }>();
      for (const act of pastActivities) {
        if (new Date(act.scheduledDate).getDay() === dayOfWeek) {
          const key = `${act.type}||${act.title}`;
          const entry = patternMap.get(key);
          patternMap.set(key, { count: (entry?.count ?? 0) + 1, act });
        }
      }
      const alreadySuggested = new Set(items.map(i => i.title));
      for (const [, { count, act }] of patternMap.entries()) {
        if (count >= 2 && !alreadySuggested.has(act.title)) {
          items.push({
            id: `pattern-${act.id}`,
            title: act.title,
            type: act.type,
            priority: act.priority ?? 'medium',
            batchId: act.batchId,
            batchName: act.batchName,
            notes: `Usually done on ${weekdayName}s (${count}× in history)`,
            reason: 'Recurring pattern',
          });
          alreadySuggested.add(act.title);
        }
      }

      setSuggestions(items);
      setChecked(new Set(items.map(i => i.id)));
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setSaving(true);
    try {
      for (const s of suggestions.filter(s => checked.has(s.id))) {
        const act = blankActivity(org, moduleType, selectedEnt, ent?.name || '');
        act.id = newActivityId();
        act.title = s.title;
        act.type = s.type;
        act.priority = s.priority;
        act.scheduledDate = selectedDate;
        act.batchId = s.batchId || '';
        act.batchName = s.batchName || '';
        act.notes = s.notes;
        addActivity(org, act);
      }
      onDone();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <h2 className="font-semibold text-slate-900">Smart Auto-Suggest</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{ent?.name} · {selectedDate}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-green-500" />
              <span className="text-sm">Analysing batches, feeding schedules &amp; history…</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No suggestions available. Add active batches to this enterprise first.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
                <span>{checked.size} of {suggestions.length} selected</span>
                <div className="flex gap-3">
                  <button onClick={() => setChecked(new Set(suggestions.map(s => s.id)))} className="text-green-600 hover:text-green-700 font-medium">Select all</button>
                  <button onClick={() => setChecked(new Set())} className="text-slate-500 hover:text-slate-700">Clear</button>
                </div>
              </div>
              <div className="space-y-2">
                {suggestions.map(s => {
                  const td = ACTIVITY_TYPE_DEFS.find(t => t.id === s.type) ?? ACTIVITY_TYPE_DEFS[ACTIVITY_TYPE_DEFS.length - 1];
                  const pm = PRIORITY_META[s.priority];
                  const isChecked = checked.has(s.id);
                  return (
                    <label key={s.id}
                      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${isChecked ? 'border-green-200 bg-green-50' : 'border-slate-100 hover:bg-slate-50'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          const next = new Set(checked);
                          e.target.checked ? next.add(s.id) : next.delete(s.id);
                          setChecked(next);
                        }}
                        className="mt-0.5 accent-green-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800">{s.title}</div>
                        {s.notes && <div className="text-xs text-slate-400 mt-0.5">{s.notes}</div>}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${td.color}`}>{td.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${pm.color}`}>{pm.label}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{s.reason}</span>
                          {s.batchName && <span className="text-[10px] text-slate-400">· {s.batchName}</span>}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {!loading && suggestions.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-100 flex gap-3 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button
              onClick={handleConfirm}
              disabled={checked.size === 0 || saving}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add {checked.size} {checked.size === 1 ? 'Activity' : 'Activities'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── status badges ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    active: 'bg-blue-100 text-blue-700',
    published: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
    pending: 'bg-slate-100 text-slate-500',
    done: 'bg-green-100 text-green-700',
    skipped: 'bg-red-50 text-red-400',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${map[status] || 'bg-slate-100 text-slate-500'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function Tab({ id, active, icon: Icon, label, onClick }: {
  id: string; active: boolean; icon: React.ElementType; label: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active ? 'bg-green-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────

function Sel({ label, value, onChange, children, required }: {
  label: string; value: string; onChange: (v: string) => void;
  children: React.ReactNode; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}{required && ' *'}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
        required={required}
      >
        {children}
      </select>
    </div>
  );
}

function Inp({ label, value, onChange, type = 'text', placeholder, required }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}{required && ' *'}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
    </div>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────

export default function PlansModule() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'daily' | 'enterprise' | 'marketing' | 'budget'>('daily');

  // shared data
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isManager = ['director', 'production_manager', 'supervisor', 'saas_admin', 'finance_manager'].includes(profile?.role || '');

  const loadShared = useCallback(async () => {
    setLoading(true);
    try {
      const [entData, memData] = await Promise.all([
        gqlRequest<{ enterprises: any[] }>(`query { enterprises(isActive: true) { id name category productionType } }`),
        gqlRequest<{ members: any[] }>(`query { members { id fullName role email } }`),
      ]);
      setEnterprises(entData.enterprises || []);
      setMembers(memData.members || []);
    } catch { /* ignore, sub-tabs handle their own errors */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadShared(); }, [loadShared]);

  const tabs = [
    { id: 'daily', label: 'Daily Plans', icon: Calendar },
    { id: 'enterprise', label: 'Enterprise Plans', icon: ClipboardList },
    { id: 'marketing', label: 'Marketing Plans', icon: Megaphone },
    { id: 'budget', label: 'Budget Overview', icon: BarChart3 },
  ] as const;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <ClipboardList className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Plans & Budgets</h1>
        </div>
        <p className="text-green-100 text-sm">
          Create enterprise plans, daily schedules, marketing strategies, and auto-calculated budgets.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <Tab key={t.id} id={t.id} active={tab === t.id} icon={t.icon} label={t.label} onClick={() => setTab(t.id)} />
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 p-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          {tab === 'daily'      && <DailyPlansTab enterprises={enterprises} members={members} isManager={isManager} profile={profile} />}
          {tab === 'enterprise' && <EnterprisePlansTab enterprises={enterprises} members={members} isManager={isManager} />}
          {tab === 'marketing'  && <MarketingPlansTab enterprises={enterprises} isManager={isManager} />}
          {tab === 'budget'     && <BudgetOverviewTab enterprises={enterprises} />}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DAILY PLANS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function DailyPlansTab({ enterprises, members, isManager, profile }: {
  enterprises: any[]; members: any[]; isManager: boolean; profile: any;
}) {
  const [selectedDate, setSelectedDate] = useState(today());
  const [selectedEnt, setSelectedEnt] = useState('');
  const [dailyPlan, setDailyPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [saving, setSaving] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '', task_type: 'feeding', description: '',
    assigned_to_id: '', priority: 'medium',
    estimated_duration_hours: '1', estimated_cost: '0',
  });
  const [recentPlans, setRecentPlans] = useState<any[]>([]);
  const [actRefresh, setActRefresh] = useState(0);
  const [editingActivity, setEditingActivity] = useState<ScheduledActivity | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showSmartSuggest, setShowSmartSuggest] = useState(false);

  // derive EnterpriseOption list for ActivityModal
  const enterpriseOptions: EnterpriseOption[] = enterprises.map((e: any) => ({
    id: e.id,
    name: e.name,
    moduleType: e.productionType || e.moduleType || 'other',
  }));

  // derive MemberOption list for ActivityModal
  const memberOptions: MemberOption[] = members.map((m: any) => ({
    id: m.id,
    fullName: m.fullName,
    role: m.role,
  }));

  async function fetchBatchesForEnterprise(enterpriseId: string): Promise<{ id: string; name: string }[]> {
    try {
      const data = await gqlRequest<{ batches: any[] }>(`
        query($eid: ID!) { batches(enterpriseId: $eid) { id name status } }
      `, { eid: enterpriseId });
      return (data.batches || [])
        .filter((b: any) => (b.status as string).toLowerCase() === 'active')
        .map((b: any) => ({ id: b.id, name: b.name }));
    } catch { return []; }
  }

  useEffect(() => {
    if (enterprises.length && !selectedEnt) setSelectedEnt(enterprises[0]?.id || '');
  }, [enterprises]);

  const org = profile?.organization || 'demo';
  const scheduledActivities = useMemo(() => {
    const all = loadActivities(org);
    const forEnt = selectedEnt ? all.filter(a => a.enterpriseId === selectedEnt) : all;
    return getActivitiesForDate(forEnt, selectedDate);
  }, [org, selectedEnt, selectedDate, actRefresh]);

  const loadPlan = useCallback(async () => {
    if (!selectedEnt || !selectedDate) return;
    setLoading(true);
    try {
      const data = await gqlRequest<{ dailyPlanByDate: any }>(`
        query($eid: ID!, $date: Date!) {
          dailyPlanByDate(enterpriseId: $eid, planDate: $date) {
            id planDate title notes status supervisor { id fullName }
            estimatedCost completionRate
            tasks {
              id title taskType description status priority
              estimatedDurationHours estimatedCost actualCost
              completionNotes sortOrder
              assignedTo { id fullName }
            }
          }
        }
      `, { eid: selectedEnt, date: selectedDate });
      setDailyPlan(data.dailyPlanByDate);
    } catch { setDailyPlan(null); }
    finally { setLoading(false); }
  }, [selectedEnt, selectedDate]);

  const loadRecent = useCallback(async () => {
    if (!selectedEnt) return;
    try {
      const data = await gqlRequest<{ dailyPlans: any[] }>(`
        query($eid: ID!) {
          dailyPlans(enterpriseId: $eid) {
            id planDate status completionRate estimatedCost
          }
        }
      `, { eid: selectedEnt });
      setRecentPlans((data.dailyPlans || []).slice(0, 7));
    } catch { }
  }, [selectedEnt]);

  useEffect(() => { loadPlan(); loadRecent(); }, [loadPlan, loadRecent]);

  async function createPlan() {
    setSaving(true);
    try {
      const ent = enterprises.find(e => e.id === selectedEnt);
      const data = await gqlRequest<{ createDailyPlan: { dailyPlan: any } }>(`
        mutation($input: DailyPlanInput!) {
          createDailyPlan(input: $input) {
            dailyPlan { id planDate title notes status estimatedCost completionRate
              tasks { id title taskType status priority estimatedCost estimatedDurationHours assignedTo { id fullName } }
            }
          }
        }
      `, {
        input: {
          enterpriseId: selectedEnt,
          planDate: selectedDate,
          title: `${ent?.name || ''} — ${selectedDate}`,
          status: 'draft',
        },
      });
      setDailyPlan(data.createDailyPlan.dailyPlan);
      loadRecent();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function updatePlanStatus(status: string) {
    if (!dailyPlan) return;
    setSaving(true);
    try {
      const data = await gqlRequest<{ updateDailyPlan: { dailyPlan: any } }>(`
        mutation($id: ID!, $status: String!) {
          updateDailyPlan(id: $id, status: $status) { dailyPlan { id status } }
        }
      `, { id: dailyPlan.id, status });
      setDailyPlan((p: any) => ({ ...p, status }));
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!dailyPlan) return;
    setSaving(true);
    try {
      await gqlRequest(`
        mutation($input: DailyPlanTaskInput!) { createDailyPlanTask(input: $input) { task { id } } }
      `, {
        input: {
          dailyPlanId: dailyPlan.id,
          title: taskForm.title,
          taskType: taskForm.task_type,
          description: taskForm.description,
          assignedToId: taskForm.assigned_to_id || null,
          priority: taskForm.priority,
          estimatedDurationHours: parseFloat(taskForm.estimated_duration_hours) || 1,
          estimatedCost: parseFloat(taskForm.estimated_cost) || 0,
        },
      });
      setTaskForm({ title: '', task_type: 'feeding', description: '', assigned_to_id: '', priority: 'medium', estimated_duration_hours: '1', estimated_cost: '0' });
      setShowAddTask(false);
      await loadPlan();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function updateTaskStatus(taskId: string, status: string) {
    try {
      await gqlRequest(`
        mutation($id: ID!, $status: String!) { updateDailyPlanTask(id: $id, status: $status) { task { id status } } }
      `, { id: taskId, status });
      setDailyPlan((p: any) => ({
        ...p,
        tasks: p.tasks.map((t: any) => t.id === taskId ? { ...t, status } : t),
      }));
    } catch (e: any) { alert(e.message); }
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Delete this task?')) return;
    try {
      await gqlRequest(`mutation($id: ID!) { deleteDailyPlanTask(id: $id) { success } }`, { id: taskId });
      setDailyPlan((p: any) => ({ ...p, tasks: p.tasks.filter((t: any) => t.id !== taskId) }));
    } catch (e: any) { alert(e.message); }
  }

  const entName = enterprises.find(e => e.id === selectedEnt)?.name || '';

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-40">
          <label className="block text-xs text-slate-500 mb-1">Enterprise / Product</label>
          <select
            value={selectedEnt}
            onChange={e => setSelectedEnt(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            {enterprises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-36">
          <label className="block text-xs text-slate-500 mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
        </div>
        <button onClick={loadPlan} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Recent plans mini-calendar */}
      {recentPlans.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {recentPlans.map(rp => (
            <button
              key={rp.id}
              onClick={() => setSelectedDate(rp.planDate)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                selectedDate === rp.planDate
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {rp.planDate} · {rp.completionRate}%
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 bg-white rounded-xl border border-slate-200 p-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading plan…
        </div>
      ) : !dailyPlan ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm mb-1">No plan for <strong>{entName}</strong> on <strong>{selectedDate}</strong></p>
          {isManager && (
            <button
              onClick={createPlan}
              disabled={saving}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2 mx-auto disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Daily Plan
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Plan header card */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Top accent strip */}
            <div className={`h-1.5 w-full ${dailyPlan.status === 'completed' ? 'bg-green-500' : dailyPlan.status === 'in_progress' ? 'bg-amber-400' : dailyPlan.status === 'published' ? 'bg-blue-500' : 'bg-slate-300'}`} />

            <div className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                {/* Left: title + meta */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-5 h-5 text-green-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-slate-900 text-base">{entName}</h2>
                      <StatusBadge status={dailyPlan.status} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(selectedDate).toLocaleDateString('en-ZM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    {dailyPlan.supervisor && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-indigo-700">
                            {dailyPlan.supervisor.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">{dailyPlan.supervisor.fullName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: action buttons */}
                {isManager && (
                  <div className="flex gap-2 flex-wrap flex-shrink-0">
                    {dailyPlan.status === 'draft' && (
                      <button onClick={() => updatePlanStatus('published')} disabled={saving}
                        className="px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Publish Plan
                      </button>
                    )}
                    {dailyPlan.status === 'published' && (
                      <button onClick={() => updatePlanStatus('in_progress')} disabled={saving}
                        className="px-4 py-2 text-xs font-medium bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-60 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Start Work
                      </button>
                    )}
                    {dailyPlan.status === 'in_progress' && (
                      <button onClick={() => updatePlanStatus('completed')} disabled={saving}
                        className="px-4 py-2 text-xs font-medium bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-60 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Mark Complete
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Stats row */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-slate-800">{dailyPlan.completionRate || 0}%</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Completion</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-slate-800">{(dailyPlan.tasks || []).length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Tasks</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-slate-800">{fmt(dailyPlan.estimatedCost || 0)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Est. Cost</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Progress</span>
                  <span>{(dailyPlan.tasks || []).filter((t: any) => t.status === 'done').length} of {(dailyPlan.tasks || []).length} done</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${dailyPlan.completionRate >= 100 ? 'bg-green-500' : dailyPlan.completionRate >= 50 ? 'bg-blue-500' : 'bg-amber-400'}`}
                    style={{ width: `${dailyPlan.completionRate || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="font-medium text-sm">Tasks ({(dailyPlan.tasks || []).length})</span>
              {isManager && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSmartSuggest(true)}
                    disabled={!selectedEnt}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-60"
                    title="Smart suggestions based on batch ages, feeding stages &amp; history"
                  >
                    <TrendingUp className="w-3 h-3" />
                    Auto-suggest
                  </button>
                  <button
                    onClick={() => setShowActivityModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Plus className="w-3 h-3" /> Schedule Activity
                  </button>
                </div>
              )}
            </div>

            {(dailyPlan.tasks || []).length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">No tasks yet. Add tasks or use auto-suggest.</div>
            ) : (
              (dailyPlan.tasks || []).map((task: any) => (
                <DailyTaskRow
                  key={task.id}
                  task={task}
                  members={members}
                  isManager={isManager}
                  onStatusChange={updateTaskStatus}
                  onDelete={deleteTask}
                />
              ))
            )}

            {/* Totals */}
            {(dailyPlan.tasks || []).length > 0 && (
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between text-sm">
                <span className="text-slate-500">
                  {(dailyPlan.tasks || []).filter((t: any) => t.status === 'done').length} / {(dailyPlan.tasks || []).length} tasks done
                </span>
                <span className="font-semibold text-slate-700">
                  Est. total: {fmt((dailyPlan.tasks || []).reduce((s: number, t: any) => s + (t.estimatedCost || 0), 0))}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Scheduled activities section ─────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            <span className="font-medium text-sm">
              Scheduled Activities
              {scheduledActivities.length > 0 && (
                <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
                  {scheduledActivities.length}
                </span>
              )}
            </span>
            <span className="text-xs text-slate-400">across all enterprises for {selectedDate}</span>
          </div>
          <button
            onClick={() => setShowActivityModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            <Plus className="w-3 h-3" /> Schedule Activity
          </button>
        </div>

        {scheduledActivities.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-200" />
            No activities scheduled for {selectedDate}
            <button onClick={() => setShowActivityModal(true)} className="block mx-auto mt-2 text-green-600 hover:text-green-700 font-medium text-xs">
              Schedule one →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {scheduledActivities.map(({ activity, date }) => {
              const td = getTypeDef(activity.type);
              const status = getStatusOnDate(activity, date);
              const pm = PRIORITY_META[activity.priority ?? 'medium'];
              const priorityBorder = activity.priority === 'high' ? 'border-l-red-400' : activity.priority === 'medium' ? 'border-l-amber-300' : 'border-l-transparent';
              return (
                <div key={`${activity.id}-${date}`}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-l-4 ${priorityBorder}`}>
                  {/* Done toggle */}
                  <button
                    onClick={() => {
                      markCompletion(org, activity.id, date, status === 'done' ? 'skipped' : 'done');
                      setActRefresh(r => r + 1);
                    }}
                    className="flex-shrink-0"
                    title={status === 'done' ? 'Mark undone' : 'Mark done'}
                  >
                    {status === 'done'
                      ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                      : <Circle className="w-5 h-5 text-slate-300 hover:text-green-400 transition-colors" />
                    }
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {activity.title}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-slate-600">
                        <Building2 className="w-3 h-3" />{activity.enterpriseName}
                      </span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{activity.scheduledTime}</span>
                      {activity.batchName && <span className="text-slate-500">· {activity.batchName}</span>}
                      {activity.assignedToName && (
                        <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                          <User className="w-2.5 h-2.5" />{activity.assignedToName.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5 ${pm.color}`}>
                      <Flag className="w-2.5 h-2.5" />{pm.label}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${td.color}`}>{td.label}</span>
                    <button
                      onClick={() => setEditingActivity(activity)}
                      className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                      title="Edit activity"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Smart suggest modal */}
      {showSmartSuggest && selectedEnt && (
        <SmartSuggestModal
          org={org}
          selectedDate={selectedDate}
          selectedEnt={selectedEnt}
          enterprises={enterprises}
          memberOptions={memberOptions}
          onClose={() => setShowSmartSuggest(false)}
          onDone={() => setActRefresh(r => r + 1)}
        />
      )}

      {/* Create activity modal (from daily plan — enterprise selector enabled) */}
      {showActivityModal && (
        <ActivityModal
          initial={blankActivity(org, '', '', '')}
          moduleType=""
          enterpriseName=""
          batches={[]}
          enterprises={enterpriseOptions}
          members={memberOptions}
          onLoadBatches={fetchBatchesForEnterprise}
          onSave={a => {
            addActivity(org, a);
            setShowActivityModal(false);
            setActRefresh(r => r + 1);
          }}
          onClose={() => setShowActivityModal(false)}
        />
      )}

      {/* Edit activity modal */}
      {editingActivity && (
        <ActivityModal
          initial={editingActivity}
          moduleType={editingActivity.moduleType}
          enterpriseName={editingActivity.enterpriseName}
          batches={[]}
          enterprises={enterpriseOptions}
          members={memberOptions}
          onLoadBatches={fetchBatchesForEnterprise}
          onSave={a => {
            updateActivity(org, a.id, a);
            setEditingActivity(null);
            setActRefresh(r => r + 1);
          }}
          onClose={() => setEditingActivity(null)}
        />
      )}
    </div>
  );
}

function DailyTaskRow({ task, members, isManager, onStatusChange, onDelete }: {
  task: any; members: any[]; isManager: boolean;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const priorityColor: Record<string, string> = {
    high: 'border-l-red-400', medium: 'border-l-amber-400', low: 'border-l-slate-200',
  };

  return (
    <div className={`border-b border-slate-100 last:border-0 border-l-2 ${priorityColor[task.priority] || 'border-l-slate-200'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <input
          type="checkbox"
          checked={task.status === 'done'}
          onChange={e => onStatusChange(task.id, e.target.checked ? 'done' : 'pending')}
          className="w-4 h-4 text-green-600 rounded cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {task.title}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
            <span className="capitalize">{task.taskType?.replace('_', ' ')}</span>
            {task.assignedTo && <span className="flex items-center gap-0.5"><User className="w-3 h-3" />{task.assignedTo.fullName}</span>}
            <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{task.estimatedDurationHours}h</span>
            {task.estimatedCost > 0 && <span className="flex items-center gap-0.5"><DollarSign className="w-3 h-3" />{fmt(task.estimatedCost)}</span>}
          </div>
        </div>
        <StatusBadge status={task.status} />
        {isManager && (
          <div className="flex gap-1">
            <button onClick={() => setExpanded(v => !v)} className="p-1 text-slate-400 hover:text-slate-600">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button onClick={() => onDelete(task.id)} className="p-1 text-slate-300 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      {expanded && task.description && (
        <div className="px-10 pb-3 text-xs text-slate-500">{task.description}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENTERPRISE PLANS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function EnterprisePlansTab({ enterprises, members, isManager }: {
  enterprises: any[]; members: any[]; isManager: boolean;
}) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', enterprise_id: '', description: '',
    plan_type: 'enterprise_plan', start_date: today(), end_date: '',
    assigned_to_id: '', initiate_product: false,
  });
  const [filterEnt, setFilterEnt] = useState('');
  const [filterType, setFilterType] = useState('');

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await gqlRequest<{ plans: any[] }>(`
        query($type: String, $eid: ID) {
          plans(planType: $type, enterpriseId: $eid) {
            id title planType status startDate endDate initiateProduct
            estimatedTotalCost actualTotalCost
            enterprise { id name }
            assignedTo { id fullName }
            budgetItems { id category itemName quantity unit unitCost totalCost actualCost notes }
          }
        }
      `, {
        type: filterType || null,
        eid: filterEnt || null,
      });
      setPlans(data.plans || []);
    } catch { }
    finally { setLoading(false); }
  }, [filterEnt, filterType]);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await gqlRequest<{ createPlan: { plan: any } }>(`
        mutation($input: PlanInput!) {
          createPlan(input: $input) {
            plan { id title planType status startDate endDate estimatedTotalCost enterprise { id name } }
          }
        }
      `, {
        input: {
          title: form.title,
          planType: form.plan_type,
          description: form.description,
          enterpriseId: form.enterprise_id || null,
          startDate: form.start_date || null,
          endDate: form.end_date || null,
          assignedToId: form.assigned_to_id || null,
          initiateProduct: form.initiate_product,
        },
      });
      setPlans(p => [{ ...data.createPlan.plan, budgetItems: [] }, ...p]);
      setShowCreate(false);
      setForm({ title: '', enterprise_id: '', description: '', plan_type: 'enterprise_plan', start_date: today(), end_date: '', assigned_to_id: '', initiate_product: false });
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function deletePlan(id: string) {
    if (!confirm('Delete this plan and all its budget items?')) return;
    try {
      await gqlRequest(`mutation($id: ID!) { deletePlan(id: $id) { success } }`, { id });
      setPlans(p => p.filter(x => x.id !== id));
      if (selectedPlan?.id === id) setSelectedPlan(null);
    } catch (e: any) { alert(e.message); }
  }

  async function activatePlan(id: string) {
    try {
      await gqlRequest(`mutation($id: ID!, $input: PlanInput!) { updatePlan(id: $id, input: $input) { plan { id status } } }`,
        { id, input: { status: 'active', title: plans.find(p => p.id === id)?.title || '', planType: plans.find(p => p.id === id)?.planType || 'enterprise_plan' } });
      setPlans(p => p.map(x => x.id === id ? { ...x, status: 'active' } : x));
    } catch (e: any) { alert(e.message); }
  }

  return (
    <div className="space-y-4">
      {/* Filters + create */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-36">
          <label className="block text-xs text-slate-500 mb-1">Filter by Enterprise</label>
          <select value={filterEnt} onChange={e => setFilterEnt(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="">All enterprises</option>
            {enterprises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-36">
          <label className="block text-xs text-slate-500 mb-1">Filter by Type</label>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="">All types</option>
            <option value="enterprise_plan">Enterprise Plan</option>
            <option value="seasonal_plan">Seasonal Plan</option>
            <option value="budget_plan">Budget Plan</option>
          </select>
        </div>
        <button onClick={loadPlans} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
          <RefreshCw className="w-4 h-4" />
        </button>
        {isManager && (
          <button onClick={() => setShowCreate(v => !v)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
            <Plus className="w-4 h-4" /> New Plan
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white border border-green-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-slate-800">New Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="col-span-full">
              <Inp label="Plan Title *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} required placeholder="e.g. Q3 Broiler Production Plan" />
            </div>
            <Sel label="Plan Type" value={form.plan_type} onChange={v => setForm(f => ({ ...f, plan_type: v }))}>
              <option value="enterprise_plan">Enterprise Plan</option>
              <option value="seasonal_plan">Seasonal Plan</option>
              <option value="budget_plan">Budget Plan</option>
              <option value="daily_plan">Daily Plan Template</option>
            </Sel>
            <Sel label="Enterprise / Product" value={form.enterprise_id} onChange={v => setForm(f => ({ ...f, enterprise_id: v }))}>
              <option value="">— General / Cross-enterprise —</option>
              {enterprises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Sel>
            <Sel label="Assign To" value={form.assigned_to_id} onChange={v => setForm(f => ({ ...f, assigned_to_id: v }))}>
              <option value="">— Unassigned —</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.fullName} ({m.role})</option>)}
            </Sel>
            <Inp label="Start Date" type="date" value={form.start_date} onChange={v => setForm(f => ({ ...f, start_date: v }))} />
            <Inp label="End Date" type="date" value={form.end_date} onChange={v => setForm(f => ({ ...f, end_date: v }))} />
            <div className="flex items-center gap-2 pt-5">
              <input
                id="initiate"
                type="checkbox"
                checked={form.initiate_product}
                onChange={e => setForm(f => ({ ...f, initiate_product: e.target.checked }))}
                className="w-4 h-4 text-green-600 rounded"
              />
              <label htmlFor="initiate" className="text-sm text-slate-700">Initiate new product when activated</label>
            </div>
            <div className="col-span-full">
              <label className="block text-xs text-slate-500 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Objectives, scope, notes…"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-60 flex items-center gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Create Plan
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 bg-white rounded-xl border border-slate-200 p-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading plans…
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
          No plans yet. Create one to start budgeting.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isManager={isManager}
              selected={selectedPlan?.id === plan.id}
              onSelect={() => setSelectedPlan(selectedPlan?.id === plan.id ? null : plan)}
              onDelete={() => deletePlan(plan.id)}
              onActivate={() => activatePlan(plan.id)}
              onRefresh={loadPlans}
            />
          ))}
        </div>
      )}

      {/* Budget detail panel */}
      {selectedPlan && (
        <BudgetItemsPanel
          plan={selectedPlan}
          isManager={isManager}
          onRefresh={async () => {
            await loadPlans();
            // Re-find updated plan
            const data = await gqlRequest<{ plan: any }>(`
              query($id: ID!) {
                plan(id: $id) {
                  id title estimatedTotalCost actualTotalCost
                  budgetItems { id category itemName quantity unit unitCost totalCost actualCost notes }
                }
              }
            `, { id: selectedPlan.id });
            setSelectedPlan(data.plan);
          }}
        />
      )}
    </div>
  );
}

function PlanCard({ plan, isManager, selected, onSelect, onDelete, onActivate, onRefresh }: {
  plan: any; isManager: boolean; selected: boolean;
  onSelect: () => void; onDelete: () => void; onActivate: () => void; onRefresh: () => void;
}) {
  const coverageBar = plan.estimatedTotalCost > 0
    ? Math.min(100, (plan.actualTotalCost / plan.estimatedTotalCost) * 100)
    : 0;

  return (
    <div
      className={`bg-white border rounded-xl p-5 cursor-pointer transition-all ${
        selected ? 'border-green-400 ring-2 ring-green-100' : 'border-slate-200 hover:border-slate-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800 text-sm truncate">{plan.title}</span>
            <StatusBadge status={plan.status} />
            {plan.initiateProduct && (
              <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full">New Product</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5 flex gap-3 flex-wrap">
            {plan.enterprise && <span className="flex items-center gap-0.5"><Leaf className="w-3 h-3" />{plan.enterprise.name}</span>}
            {plan.startDate && <span>{plan.startDate}{plan.endDate ? ` → ${plan.endDate}` : ''}</span>}
            {plan.assignedTo && <span className="flex items-center gap-0.5"><User className="w-3 h-3" />{plan.assignedTo.fullName}</span>}
          </div>
        </div>
        {isManager && (
          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
            {plan.status === 'draft' && (
              <button onClick={onActivate} className="px-2 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">Activate</button>
            )}
            <button onClick={onDelete} className="p-1 text-slate-300 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-slate-500">Estimated Cost</div>
          <div className="font-semibold text-slate-800">{fmt(plan.estimatedTotalCost || 0)}</div>
        </div>
        <div>
          <div className="text-slate-500">Actual Cost</div>
          <div className="font-semibold text-slate-800">{fmt(plan.actualTotalCost || 0)}</div>
        </div>
      </div>
      {plan.estimatedTotalCost > 0 && (
        <div className="mt-3">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400" style={{ width: `${coverageBar}%` }} />
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{Math.round(coverageBar)}% of budget used</div>
        </div>
      )}
      <p className="text-[10px] text-green-600 mt-2">{selected ? 'Click to collapse budget' : 'Click to view / edit budget items'}</p>
    </div>
  );
}

function BudgetItemsPanel({ plan, isManager, onRefresh }: {
  plan: any; isManager: boolean; onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: 'labor', item_name: '', description: '',
    quantity: '1', unit: 'unit', unit_cost: '0', actual_cost: '0', notes: '',
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await gqlRequest(`
        mutation($input: PlanBudgetItemInput!) { createPlanBudgetItem(input: $input) { item { id } } }
      `, {
        input: {
          planId: plan.id,
          category: form.category,
          itemName: form.item_name,
          description: form.description,
          quantity: parseFloat(form.quantity) || 1,
          unit: form.unit,
          unitCost: parseFloat(form.unit_cost) || 0,
          actualCost: parseFloat(form.actual_cost) || 0,
          notes: form.notes,
        },
      });
      setForm({ category: 'labor', item_name: '', description: '', quantity: '1', unit: 'unit', unit_cost: '0', actual_cost: '0', notes: '' });
      setShowForm(false);
      onRefresh();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function deleteItem(id: string) {
    if (!confirm('Remove this budget item?')) return;
    try {
      await gqlRequest(`mutation($id: ID!) { deletePlanBudgetItem(id: $id) { success } }`, { id });
      onRefresh();
    } catch (e: any) { alert(e.message); }
  }

  const items: any[] = plan.budgetItems || [];
  const totalEst = items.reduce((s, i) => s + (i.totalCost || 0), 0);
  const totalAct = items.reduce((s, i) => s + (i.actualCost || 0), 0);

  // Group by category
  const byCategory = items.reduce<Record<string, any[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <span className="font-semibold text-slate-800">{plan.title} — Budget</span>
          <div className="text-xs text-slate-400 mt-0.5">
            Estimated: {fmt(totalEst)} · Actual: {fmt(totalAct)}
          </div>
        </div>
        {isManager && (
          <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Plus className="w-3 h-3" /> Add Line Item
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <Sel label="Category" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))}>
            {BUDGET_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Sel>
          <div className="col-span-2">
            <Inp label="Item Name *" value={form.item_name} onChange={v => setForm(f => ({ ...f, item_name: v }))} required placeholder="e.g. Day-old chicks, Labor (10 workers)" />
          </div>
          <Inp label="Quantity" type="number" value={form.quantity} onChange={v => setForm(f => ({ ...f, quantity: v }))} />
          <Inp label="Unit" value={form.unit} onChange={v => setForm(f => ({ ...f, unit: v }))} placeholder="kg / bag / head / day" />
          <Inp label="Unit Cost (ZMW)" type="number" value={form.unit_cost} onChange={v => setForm(f => ({ ...f, unit_cost: v }))} />
          <Inp label="Actual Cost (ZMW)" type="number" value={form.actual_cost} onChange={v => setForm(f => ({ ...f, actual_cost: v }))} />
          <div className="col-span-2 md:col-span-3 lg:col-span-4 flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-60 flex items-center gap-1.5">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Add
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="px-5 py-6 text-center text-slate-400 text-sm">No budget items. Add cost line items above.</div>
      ) : (
        <>
          {Object.entries(byCategory).map(([cat, catItems]) => (
            <div key={cat}>
              <div className="px-5 py-1.5 bg-slate-50 border-y border-slate-100 flex justify-between">
                <span className="text-xs font-semibold text-slate-500 capitalize">{cat.replace('_', ' ')}</span>
                <span className="text-xs text-slate-500">{fmt(catItems.reduce((s, i) => s + (i.totalCost || 0), 0))}</span>
              </div>
              {catItems.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-50 text-sm hover:bg-slate-50">
                  <div className="flex-1">
                    <span className="text-slate-800">{item.itemName}</span>
                    <span className="text-slate-400 ml-2 text-xs">{item.quantity} {item.unit} × {fmt(item.unitCost)}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-slate-800">{fmt(item.totalCost || 0)}</div>
                    {item.actualCost > 0 && <div className="text-xs text-amber-600">act: {fmt(item.actualCost)}</div>}
                  </div>
                  {isManager && (
                    <button onClick={() => deleteItem(item.id)} className="p-1 text-slate-300 hover:text-red-500 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
          <div className="px-5 py-3 bg-green-50 flex justify-between text-sm font-semibold">
            <span className="text-slate-700">Total Estimated</span>
            <span className="text-green-700">{fmt(totalEst)}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKETING PLANS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function MarketingPlansTab({ enterprises, isManager }: { enterprises: any[]; isManager: boolean }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({
    title: '', enterprise_id: '', start_date: today(), end_date: '',
    target_market: '', target_revenue: '0', expected_quantity: '0',
    expected_unit: 'kg', expected_unit_price: '0',
    channels: [] as string[], notes: '',
  });

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await gqlRequest<{ plans: any[] }>(`
        query { plans(planType: "marketing_plan") {
          id title status startDate endDate
          enterprise { id name }
          estimatedTotalCost
          budgetItems { id category itemName quantity unit unitCost totalCost actualCost }
          marketingDetail {
            targetMarket targetRevenue expectedQuantity expectedUnit expectedUnitPrice
            channels keyActivities notes
          }
        }}
      `);
      setPlans(data.plans || []);
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const planData = await gqlRequest<{ createPlan: { plan: any } }>(`
        mutation($input: PlanInput!) {
          createPlan(input: $input) { plan { id title } }
        }
      `, {
        input: {
          title: form.title,
          planType: 'marketing_plan',
          enterpriseId: form.enterprise_id || null,
          startDate: form.start_date || null,
          endDate: form.end_date || null,
        },
      });
      const planId = planData.createPlan.plan.id;
      await gqlRequest(`
        mutation($input: MarketingPlanInput!) { upsertMarketingPlan(input: $input) { marketingPlan { id } } }
      `, {
        input: {
          planId,
          targetMarket: form.target_market,
          targetRevenue: parseFloat(form.target_revenue) || 0,
          expectedQuantity: parseFloat(form.expected_quantity) || 0,
          expectedUnit: form.expected_unit,
          expectedUnitPrice: parseFloat(form.expected_unit_price) || 0,
          channels: form.channels,
          notes: form.notes,
        },
      });
      setShowCreate(false);
      setForm({ title: '', enterprise_id: '', start_date: today(), end_date: '', target_market: '', target_revenue: '0', expected_quantity: '0', expected_unit: 'kg', expected_unit_price: '0', channels: [], notes: '' });
      loadPlans();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  function toggleChannel(ch: string) {
    setForm(f => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch],
    }));
  }

  const estimatedRevenue = (parseFloat(form.expected_quantity) || 0) * (parseFloat(form.expected_unit_price) || 0);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center">
        <h3 className="font-medium text-slate-700">Marketing Plans</h3>
        <div className="flex gap-2">
          <button onClick={loadPlans} className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"><RefreshCw className="w-4 h-4" /></button>
          {isManager && (
            <button onClick={() => setShowCreate(v => !v)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
              <Plus className="w-4 h-4" /> New Marketing Plan
            </button>
          )}
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white border border-green-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-slate-800">New Marketing Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="col-span-full">
              <Inp label="Plan Title *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} required placeholder="e.g. Q3 Tomato Market Campaign" />
            </div>
            <Sel label="Enterprise / Product" value={form.enterprise_id} onChange={v => setForm(f => ({ ...f, enterprise_id: v }))}>
              <option value="">— All products —</option>
              {enterprises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Sel>
            <Inp label="Start Date" type="date" value={form.start_date} onChange={v => setForm(f => ({ ...f, start_date: v }))} />
            <Inp label="End Date" type="date" value={form.end_date} onChange={v => setForm(f => ({ ...f, end_date: v }))} />
            <Inp label="Target Market / Buyer" value={form.target_market} onChange={v => setForm(f => ({ ...f, target_market: v }))} placeholder="e.g. Local market — Kafue" />
            <Inp label="Expected Quantity" type="number" value={form.expected_quantity} onChange={v => setForm(f => ({ ...f, expected_quantity: v }))} />
            <Inp label="Unit" value={form.expected_unit} onChange={v => setForm(f => ({ ...f, expected_unit: v }))} placeholder="kg / crates / heads" />
            <Inp label="Unit Price (ZMW)" type="number" value={form.expected_unit_price} onChange={v => setForm(f => ({ ...f, expected_unit_price: v }))} />
            <div>
              <div className="text-xs text-slate-500 mb-1">Estimated Revenue</div>
              <div className="px-3 py-2 bg-green-50 border border-green-100 rounded-lg text-sm font-semibold text-green-700">{fmt(estimatedRevenue)}</div>
            </div>
            <Inp label="Target Revenue (ZMW)" type="number" value={form.target_revenue} onChange={v => setForm(f => ({ ...f, target_revenue: v }))} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-2">Marketing Channels</label>
            <div className="flex flex-wrap gap-2">
              {MARKETING_CHANNELS.map(ch => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => toggleChannel(ch)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    form.channels.includes(ch) ? 'bg-green-600 text-white border-green-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Campaign details, buyer contacts, logistics…" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-60 flex items-center gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Create
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 bg-white rounded-xl border border-slate-200 p-6"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : plans.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">No marketing plans yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map(plan => {
            const md = plan.marketingDetail;
            const estRev = md ? (md.expectedQuantity || 0) * (md.expectedUnitPrice || 0) : 0;
            const profit = estRev - (plan.estimatedTotalCost || 0);
            return (
              <div key={plan.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-sm">{plan.title}</span>
                      <StatusBadge status={plan.status} />
                    </div>
                    {plan.enterprise && <div className="text-xs text-slate-500 mt-0.5">{plan.enterprise.name}</div>}
                  </div>
                  <Megaphone className="w-5 h-5 text-green-500 flex-shrink-0" />
                </div>
                {md && (
                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div><div className="text-slate-500">Target Market</div><div className="font-medium">{md.targetMarket || '—'}</div></div>
                    <div><div className="text-slate-500">Target Revenue</div><div className="font-medium text-green-700">{fmt(md.targetRevenue || 0)}</div></div>
                    <div><div className="text-slate-500">Qty × Price</div><div className="font-medium">{md.expectedQuantity} {md.expectedUnit} × {fmt(md.expectedUnitPrice)}</div></div>
                    <div><div className="text-slate-500">Est. Revenue</div><div className="font-medium text-green-700">{fmt(estRev)}</div></div>
                    <div><div className="text-slate-500">Marketing Cost</div><div className="font-medium text-amber-600">{fmt(plan.estimatedTotalCost || 0)}</div></div>
                    <div><div className="text-slate-500">Est. Profit</div><div className={`font-semibold ${profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(profit)}</div></div>
                  </div>
                )}
                {md?.channels?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {md.channels.map((ch: string) => (
                      <span key={ch} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{ch}</span>
                    ))}
                  </div>
                )}
                <button onClick={() => setSelected(selected?.id === plan.id ? null : plan)} className="text-xs text-green-600 hover:underline">
                  {selected?.id === plan.id ? 'Hide' : 'View'} budget items
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <BudgetItemsPanel plan={selected} isManager={isManager} onRefresh={loadPlans} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUDGET OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════════════════════

function BudgetOverviewTab({ enterprises }: { enterprises: any[] }) {
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await gqlRequest<{ plans: any[] }>(`
        query {
          plans {
            id title planType status estimatedTotalCost actualTotalCost
            enterprise { id name }
            budgetItems { category totalCost actualCost }
          }
        }
      `);
      setAllPlans(data.plans || []);
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalEst = allPlans.reduce((s, p) => s + (p.estimatedTotalCost || 0), 0);
  const totalAct = allPlans.reduce((s, p) => s + (p.actualTotalCost || 0), 0);

  // Per enterprise totals
  const byEnterprise: Record<string, { name: string; est: number; act: number }> = {};
  allPlans.forEach(p => {
    const key = p.enterprise?.id || '__general';
    const name = p.enterprise?.name || 'General';
    if (!byEnterprise[key]) byEnterprise[key] = { name, est: 0, act: 0 };
    byEnterprise[key].est += p.estimatedTotalCost || 0;
    byEnterprise[key].act += p.actualTotalCost || 0;
  });

  // Per category totals
  const byCategory: Record<string, { est: number; act: number }> = {};
  allPlans.forEach(p => {
    (p.budgetItems || []).forEach((bi: any) => {
      if (!byCategory[bi.category]) byCategory[bi.category] = { est: 0, act: 0 };
      byCategory[bi.category].est += bi.totalCost || 0;
      byCategory[bi.category].act += bi.actualCost || 0;
    });
  });

  // Per type totals
  const byType: Record<string, { est: number; act: number; count: number }> = {};
  allPlans.forEach(p => {
    if (!byType[p.planType]) byType[p.planType] = { est: 0, act: 0, count: 0 };
    byType[p.planType].est += p.estimatedTotalCost || 0;
    byType[p.planType].act += p.actualTotalCost || 0;
    byType[p.planType].count += 1;
  });

  const typeLabels: Record<string, string> = {
    enterprise_plan: 'Enterprise Plans', daily_plan: 'Daily Plans',
    marketing_plan: 'Marketing Plans', budget_plan: 'Budget Plans', seasonal_plan: 'Seasonal Plans',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm text-slate-600 hover:bg-slate-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 bg-white rounded-xl border border-slate-200 p-6"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard label="Total Plans" value={allPlans.length.toString()} icon={ClipboardList} color="blue" />
            <SummaryCard label="Total Estimated" value={fmt(totalEst)} icon={DollarSign} color="green" />
            <SummaryCard label="Total Actual" value={fmt(totalAct)} icon={Package} color="amber" />
            <SummaryCard
              label="Budget Variance"
              value={fmt(Math.abs(totalEst - totalAct))}
              icon={TrendingUp}
              color={totalAct <= totalEst ? 'green' : 'red'}
              sub={totalAct <= totalEst ? 'Under budget' : 'Over budget'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By enterprise */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-sm text-slate-800">Budget by Enterprise</span>
              </div>
              {Object.entries(byEnterprise).length === 0 ? (
                <div className="px-5 py-4 text-slate-400 text-sm">No data</div>
              ) : (
                Object.entries(byEnterprise).map(([, ent]) => {
                  const pct = ent.est > 0 ? Math.min(100, (ent.act / ent.est) * 100) : 0;
                  return (
                    <div key={ent.name} className="px-5 py-3 border-b border-slate-50">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-700">{ent.name}</span>
                        <span className="font-medium text-slate-800">{fmt(ent.est)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${pct > 90 ? 'bg-red-400' : pct > 70 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{fmt(ent.act)} actual · {Math.round(pct)}% used</div>
                    </div>
                  );
                })
              )}
            </div>

            {/* By category */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-sm text-slate-800">Budget by Category</span>
              </div>
              {Object.entries(byCategory).length === 0 ? (
                <div className="px-5 py-4 text-slate-400 text-sm">No budget items</div>
              ) : (
                Object.entries(byCategory)
                  .sort((a, b) => b[1].est - a[1].est)
                  .map(([cat, vals]) => {
                    const pct = totalEst > 0 ? (vals.est / totalEst) * 100 : 0;
                    return (
                      <div key={cat} className="px-5 py-2.5 border-b border-slate-50 flex items-center gap-3">
                        <div className="w-20 text-[10px] text-slate-500 capitalize">{cat.replace('_', ' ')}</div>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-xs text-slate-700 font-medium w-24 text-right">{fmt(vals.est)}</div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* By plan type */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-800">Plans by Type</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-slate-100">
              {Object.entries(byType).map(([type, vals]) => (
                <div key={type} className="px-5 py-4 text-center">
                  <div className="text-xs text-slate-500 mb-1">{typeLabels[type] || type}</div>
                  <div className="font-bold text-slate-800">{vals.count}</div>
                  <div className="text-xs text-green-700">{fmt(vals.est)}</div>
                </div>
              ))}
              {Object.keys(byType).length === 0 && (
                <div className="col-span-5 px-5 py-4 text-slate-400 text-sm text-center">No plans yet</div>
              )}
            </div>
          </div>

          {/* All plans table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-800">All Plans</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="text-left px-5 py-2.5 font-medium">Title</th>
                    <th className="text-left px-3 py-2.5 font-medium">Type</th>
                    <th className="text-left px-3 py-2.5 font-medium">Enterprise</th>
                    <th className="text-left px-3 py-2.5 font-medium">Status</th>
                    <th className="text-right px-3 py-2.5 font-medium">Estimated</th>
                    <th className="text-right px-5 py-2.5 font-medium">Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {allPlans.map(p => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-2.5 font-medium text-slate-800">{p.title}</td>
                      <td className="px-3 py-2.5 text-slate-500 text-xs capitalize">{(p.planType || '').replace('_', ' ')}</td>
                      <td className="px-3 py-2.5 text-slate-500">{p.enterprise?.name || '—'}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={p.status} /></td>
                      <td className="px-3 py-2.5 text-right text-slate-700">{fmt(p.estimatedTotalCost || 0)}</td>
                      <td className="px-5 py-2.5 text-right font-medium text-slate-800">{fmt(p.actualTotalCost || 0)}</td>
                    </tr>
                  ))}
                  {allPlans.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-4 text-slate-400 text-center">No plans</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string; icon: React.ElementType; color: string; sub?: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600', red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-lg font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      {sub && <div className={`text-[10px] mt-0.5 ${colors[color]}`}>{sub}</div>}
    </div>
  );
}
