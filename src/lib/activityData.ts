// ─── Activity Scheduling — shared types + localStorage engine ─────────────────

export type ActivityType =
  | 'feeding' | 'watering' | 'vaccination' | 'medication'
  | 'weighing' | 'cleaning' | 'mortality-check' | 'biosecurity'
  | 'harvest' | 'planting' | 'spraying' | 'fertilizing' | 'pruning'
  | 'inspection' | 'deworming' | 'breeding' | 'sorting' | 'other';

export type RecurrenceFreq = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type RecurrenceEnd  = 'never' | 'count' | 'date';
export type ReminderUnit   = 'hours' | 'days';
export type ActivityPriority = 'high' | 'medium' | 'low';

export interface ScheduledActivity {
  id: string;
  org: string;
  moduleType: string;       // 'poultry' | 'piggery' | 'fish' | 'horticulture' | etc.
  enterpriseId: string;
  enterpriseName: string;
  batchId?: string;
  batchName?: string;
  type: ActivityType;
  title: string;
  notes: string;
  scheduledDate: string;    // YYYY-MM-DD — first (or only) occurrence
  scheduledTime: string;    // HH:MM
  priority: ActivityPriority;
  // Assignment
  assignedToId?: string;
  assignedToName?: string;
  // Reminder
  reminderEnabled: boolean;
  reminderAmount: number;
  reminderUnit: ReminderUnit;
  // Recurrence
  recurring: boolean;
  recurrenceFreq: RecurrenceFreq | null;
  recurrenceEnd: RecurrenceEnd;
  recurrenceCount: number;  // used when recurrenceEnd === 'count'
  recurrenceEndDate: string;// used when recurrenceEnd === 'date'
  // Push to daily plan
  pushToDailyPlan: boolean;
  // Completion map: date → 'done' | 'skipped'
  completions: Record<string, 'done' | 'skipped'>;
  // Dismissed reminders: set of dates where reminder was dismissed
  dismissedReminders: string[];
  createdAt: string;
}

export const PRIORITY_META: Record<ActivityPriority, { label: string; color: string; dot: string }> = {
  high:   { label: 'High',   color: 'bg-red-100 text-red-700',    dot: 'bg-red-500'    },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  low:    { label: 'Low',    color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400'  },
};

// ─── Activity type metadata ───────────────────────────────────────────────────

export interface ActivityTypeDef {
  id: ActivityType;
  label: string;
  color: string;  // Tailwind bg+text classes
  modules: string[];  // which modules show this type; empty = all
}

export const ACTIVITY_TYPE_DEFS: ActivityTypeDef[] = [
  { id: 'feeding',        label: 'Feeding',         color: 'bg-green-100 text-green-700',   modules: [] },
  { id: 'watering',       label: 'Watering',        color: 'bg-blue-100 text-blue-700',     modules: [] },
  { id: 'vaccination',    label: 'Vaccination',     color: 'bg-purple-100 text-purple-700', modules: ['poultry','piggery','fish','duck','goat-sheep','village-chicken'] },
  { id: 'medication',     label: 'Medication',      color: 'bg-amber-100 text-amber-700',   modules: [] },
  { id: 'weighing',       label: 'Weighing',        color: 'bg-indigo-100 text-indigo-700', modules: [] },
  { id: 'cleaning',       label: 'House Cleaning',  color: 'bg-cyan-100 text-cyan-700',     modules: [] },
  { id: 'mortality-check',label: 'Mortality Check', color: 'bg-red-100 text-red-700',       modules: ['poultry','piggery','fish','duck','goat-sheep','village-chicken'] },
  { id: 'biosecurity',    label: 'Biosecurity',     color: 'bg-orange-100 text-orange-700', modules: [] },
  { id: 'inspection',     label: 'Inspection',      color: 'bg-slate-100 text-slate-700',   modules: [] },
  { id: 'deworming',      label: 'Deworming',       color: 'bg-rose-100 text-rose-700',     modules: ['piggery','goat-sheep','duck','village-chicken'] },
  { id: 'breeding',       label: 'Breeding',        color: 'bg-pink-100 text-pink-700',     modules: ['piggery','goat-sheep'] },
  { id: 'sorting',        label: 'Sorting',         color: 'bg-yellow-100 text-yellow-700', modules: [] },
  { id: 'harvest',        label: 'Harvest',         color: 'bg-emerald-100 text-emerald-700', modules: ['horticulture','fish'] },
  { id: 'planting',       label: 'Planting',        color: 'bg-lime-100 text-lime-700',     modules: ['horticulture'] },
  { id: 'spraying',       label: 'Spraying',        color: 'bg-teal-100 text-teal-700',     modules: ['horticulture'] },
  { id: 'fertilizing',    label: 'Fertilizing',     color: 'bg-amber-100 text-amber-800',   modules: ['horticulture'] },
  { id: 'pruning',        label: 'Pruning',         color: 'bg-green-100 text-green-800',   modules: ['horticulture'] },
  { id: 'other',          label: 'Other',           color: 'bg-slate-100 text-slate-600',   modules: [] },
];

export function getTypesForModule(moduleType: string): ActivityTypeDef[] {
  return ACTIVITY_TYPE_DEFS.filter(t => t.modules.length === 0 || t.modules.includes(moduleType));
}

export function getTypeDef(type: ActivityType): ActivityTypeDef {
  return ACTIVITY_TYPE_DEFS.find(t => t.id === type) ?? ACTIVITY_TYPE_DEFS[ACTIVITY_TYPE_DEFS.length - 1];
}

// ─── Storage ─────────────────────────────────────────────────────────────────

function storageKey(org: string) {
  return `fp_activities_${org.replace(/\s+/g, '_').toLowerCase()}`;
}

export function loadActivities(org: string): ScheduledActivity[] {
  try {
    const raw = localStorage.getItem(storageKey(org));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveActivities(org: string, activities: ScheduledActivity[]): void {
  try { localStorage.setItem(storageKey(org), JSON.stringify(activities)); } catch {}
}

export function addActivity(org: string, activity: ScheduledActivity): ScheduledActivity[] {
  const all = loadActivities(org);
  const updated = [...all, activity];
  saveActivities(org, updated);
  return updated;
}

export function updateActivity(org: string, id: string, patch: Partial<ScheduledActivity>): ScheduledActivity[] {
  const all = loadActivities(org).map(a => a.id === id ? { ...a, ...patch } : a);
  saveActivities(org, all);
  return all;
}

export function deleteActivity(org: string, id: string): ScheduledActivity[] {
  const all = loadActivities(org).filter(a => a.id !== id);
  saveActivities(org, all);
  return all;
}

export function markCompletion(
  org: string,
  id: string,
  date: string,
  status: 'done' | 'skipped',
): ScheduledActivity[] {
  const all = loadActivities(org);
  const updated = all.map(a => {
    if (a.id !== id) return a;
    return { ...a, completions: { ...a.completions, [date]: status } };
  });
  saveActivities(org, updated);
  return updated;
}

export function dismissReminder(org: string, id: string, date: string): ScheduledActivity[] {
  const all = loadActivities(org);
  const updated = all.map(a => {
    if (a.id !== id) return a;
    return { ...a, dismissedReminders: [...new Set([...a.dismissedReminders, date])] };
  });
  saveActivities(org, updated);
  return updated;
}

// ─── Recurrence engine ────────────────────────────────────────────────────────

function addDays(date: Date, n: number): Date {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}
function addMonths(date: Date, n: number): Date {
  const d = new Date(date); d.setMonth(d.getMonth() + n); return d;
}
function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Returns all dates (YYYY-MM-DD) this activity occurs in [fromDate, toDate] */
export function getOccurrences(
  activity: ScheduledActivity,
  fromDate: string,
  toDate: string,
): string[] {
  if (!activity.recurring || !activity.recurrenceFreq) {
    if (activity.scheduledDate >= fromDate && activity.scheduledDate <= toDate) {
      return [activity.scheduledDate];
    }
    return [];
  }

  const results: string[] = [];
  let current = new Date(activity.scheduledDate);
  const rangeEnd = new Date(toDate);

  // Determine hard end
  let hardEndDate: Date;
  if (activity.recurrenceEnd === 'date' && activity.recurrenceEndDate) {
    hardEndDate = new Date(activity.recurrenceEndDate) < rangeEnd
      ? new Date(activity.recurrenceEndDate)
      : rangeEnd;
  } else {
    hardEndDate = rangeEnd;
  }

  let count = 0;
  const maxCount = activity.recurrenceEnd === 'count' ? activity.recurrenceCount : Infinity;

  while (current <= hardEndDate && count < maxCount) {
    const ds = toDateStr(current);
    if (ds >= fromDate && ds <= toDate) results.push(ds);
    count++;
    switch (activity.recurrenceFreq) {
      case 'daily':    current = addDays(current, 1);  break;
      case 'weekly':   current = addDays(current, 7);  break;
      case 'biweekly': current = addDays(current, 14); break;
      case 'monthly':  current = addMonths(current, 1); break;
    }
  }
  return results;
}

/** Get status of an activity on a specific date */
export function getStatusOnDate(
  activity: ScheduledActivity,
  date: string,
): 'done' | 'skipped' | 'overdue' | 'pending' {
  const completion = activity.completions[date];
  if (completion) return completion;
  const today = toDateStr(new Date());
  if (date < today) return 'overdue';
  return 'pending';
}

/** Check if reminder is currently due for an activity on a given date */
export function isReminderDue(activity: ScheduledActivity, date: string): boolean {
  if (!activity.reminderEnabled) return false;
  if (activity.dismissedReminders.includes(date)) return false;
  const actTime = activity.scheduledTime || '08:00';
  const actDateTime = new Date(`${date}T${actTime}`);
  const now = new Date();
  const msUntil = actDateTime.getTime() - now.getTime();
  if (msUntil < 0) return false; // already past
  const reminderMs = activity.reminderUnit === 'hours'
    ? activity.reminderAmount * 3_600_000
    : activity.reminderAmount * 86_400_000;
  return msUntil <= reminderMs;
}

/** Get all activities with their occurrence date that are due for reminder */
export function getDueReminders(
  activities: ScheduledActivity[],
): { activity: ScheduledActivity; date: string }[] {
  const today = toDateStr(new Date());
  const in7days = toDateStr(addDays(new Date(), 7));
  const results: { activity: ScheduledActivity; date: string }[] = [];
  for (const a of activities) {
    const occurrences = getOccurrences(a, today, in7days);
    for (const date of occurrences) {
      if (isReminderDue(a, date)) {
        results.push({ activity: a, date });
      }
    }
  }
  return results;
}

/** All activities for today (from all modules) */
export function getTodayActivities(
  activities: ScheduledActivity[],
): { activity: ScheduledActivity; date: string }[] {
  const today = toDateStr(new Date());
  const results: { activity: ScheduledActivity; date: string }[] = [];
  for (const a of activities) {
    const occurrences = getOccurrences(a, today, today);
    if (occurrences.length) results.push({ activity: a, date: today });
  }
  return results;
}

/** Activities for a specific date */
export function getActivitiesForDate(
  activities: ScheduledActivity[],
  date: string,
): { activity: ScheduledActivity; date: string }[] {
  const results: { activity: ScheduledActivity; date: string }[] = [];
  for (const a of activities) {
    const occurrences = getOccurrences(a, date, date);
    if (occurrences.length) results.push({ activity: a, date });
  }
  return results;
}

/** Generate a new activity ID */
export function newActivityId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Default blank activity */
export function blankActivity(
  org: string,
  moduleType: string,
  enterpriseId: string,
  enterpriseName: string,
): ScheduledActivity {
  const today = toDateStr(new Date());
  return {
    id: newActivityId(),
    org,
    moduleType,
    enterpriseId,
    enterpriseName,
    batchId: '',
    batchName: '',
    type: 'feeding',
    title: '',
    notes: '',
    scheduledDate: today,
    scheduledTime: '08:00',
    priority: 'medium',
    assignedToId: '',
    assignedToName: '',
    reminderEnabled: false,
    reminderAmount: 1,
    reminderUnit: 'days',
    recurring: false,
    recurrenceFreq: 'daily',
    recurrenceEnd: 'never',
    recurrenceCount: 10,
    recurrenceEndDate: '',
    pushToDailyPlan: true,
    completions: {},
    dismissedReminders: [],
    createdAt: new Date().toISOString(),
  };
}

/** Get activities assigned to a specific user */
export function getActivitiesAssignedTo(
  activities: ScheduledActivity[],
  userId: string,
): ScheduledActivity[] {
  return activities.filter(a => a.assignedToId === userId);
}

export const FREQ_LABELS: Record<RecurrenceFreq, string> = {
  daily: 'Every day',
  weekly: 'Every week',
  biweekly: 'Every 2 weeks',
  monthly: 'Every month',
};
