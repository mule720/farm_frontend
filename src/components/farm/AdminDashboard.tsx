import React, { useState } from 'react';
import {
  Users, DollarSign, TrendingUp, Globe, ShieldCheck, Search, MoreVertical,
  ArrowLeft, CheckCircle2, XCircle, Clock, Sparkles, Activity, MessageSquare,
  ChevronRight, ChevronDown, AlertTriangle, Zap, ToggleLeft, ToggleRight,
  UserCheck, CreditCard, FileText, Building2, Eye, Send, Ban, RotateCcw,
  Plus, Mail, Phone, MapPin, Calendar, BarChart2, CheckCircle, Circle,
  Lock, Unlock, RefreshCw, Download, ExternalLink, Star, Wifi, WifiOff,
  TrendingDown, Package, Settings2,
} from 'lucide-react';
import { sampleSubscribers, Subscriber } from '@/lib/farmData';
import { MODULE_CATALOG, PLAN_BUNDLES, calcPrice, PLATFORM_ROLES, PLATFORM_PERMISSIONS, type PlatformStaffRole } from '@/lib/subscriptionData';

// ─── Extended mock data per company ──────────────────────────────────────────

interface CompanyUser {
  id: string;
  name: string;
  role: string;
  email: string;
  lastLogin: string;
  status: 'active' | 'inactive';
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'void';
  period: string;
}

interface ModuleAccess {
  id: string;
  label: string;
  enabled: boolean;
  group: string;
}

interface OnboardingStep {
  label: string;
  done: boolean;
}

interface CompanyDetail {
  healthScore: number;
  lastActive: string;
  avgDailyLogins: number;
  apiCalls7d: number;
  storageUsedMb: number;
  notes: string;
  onboarding: OnboardingStep[];
  modules: ModuleAccess[];
  users: CompanyUser[];
  invoices: Invoice[];
  enterprises: string[];
}

const ALL_MODULES: { id: string; label: string; group: string }[] = [
  // Smart Farm
  { id: 'irrigation',     label: 'Smart Irrigation',   group: 'Smart Farm' },
  { id: 'equipment',      label: 'Fleet & Equipment',  group: 'Smart Farm' },
  { id: 'tracking',       label: 'Animal Tracking',    group: 'Smart Farm' },
  { id: 'greenhouse',     label: 'Greenhouse',         group: 'Smart Farm' },
  { id: 'labor',          label: 'Labor & HR',         group: 'Smart Farm' },
  // Intelligence
  { id: 'smart-engine',   label: 'AI Smart Engine',    group: 'Intelligence' },
  { id: 'smart-vision',   label: 'Vision & AI',        group: 'Intelligence' },
  { id: 'predictive-ai',  label: 'Predictive AI',      group: 'Intelligence' },
  { id: 'weather',        label: 'Weather & NDVI',     group: 'Intelligence' },
  // Operations
  { id: 'inventory',      label: 'Feed & Inventory',   group: 'Operations' },
  { id: 'sales',          label: 'Sales & Customers',  group: 'Operations' },
  { id: 'finance',        label: 'Financial Mgmt',     group: 'Operations' },
  { id: 'financial-ai',   label: 'P&L & Financial AI', group: 'Operations' },
  { id: 'hr',             label: 'Human Resources',    group: 'Operations' },
  { id: 'biosecurity',    label: 'Biosecurity & Vet',  group: 'Operations' },
  { id: 'sustainability', label: 'Sustainability',     group: 'Operations' },
  // Markets & Strategy
  { id: 'marketplace',    label: 'Commodity Market',  group: 'Markets' },
  { id: 'planner',        label: 'Plans & Budgets',    group: 'Strategy' },
  { id: 'integrations',   label: 'Integrations',       group: 'Strategy' },
  { id: 'reports',        label: 'Reports & BI',       group: 'Strategy' },
  { id: 'export',         label: 'Export & Logistics', group: 'Strategy' },
];

function buildModules(enabledIds: string[]): ModuleAccess[] {
  return ALL_MODULES.map(m => ({ ...m, enabled: enabledIds.includes(m.id) }));
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  { label: 'Account created & email verified', done: true },
  { label: 'Organization profile completed', done: true },
  { label: 'First enterprise configured', done: true },
  { label: 'First batch / production cycle created', done: true },
  { label: 'Inventory items added', done: false },
  { label: 'At least one user invited', done: false },
  { label: 'First IoT device connected', done: false },
  { label: 'WhatsApp / SMS alerts configured', done: false },
];

const COMPANY_DETAILS: Record<string, CompanyDetail> = {
  'SUB-001': {
    healthScore: 92, lastActive: '5 min ago', avgDailyLogins: 18, apiCalls7d: 4820, storageUsedMb: 1240,
    notes: 'Key Zambia account. Director Joseph prefers WhatsApp updates. Renewal due Sept 2026.',
    onboarding: ONBOARDING_STEPS.map((s, i) => ({ ...s, done: i < 7 })),
    modules: buildModules(['irrigation','equipment','tracking','greenhouse','labor','smart-engine','smart-vision','predictive-ai','weather','inventory','sales','finance','financial-ai','hr','biosecurity','sustainability','marketplace','planner','integrations','reports','export']),
    users: [
      { id: '1', name: 'Joseph Mwansa', role: 'director', email: 'joseph@afrivera.zm', lastLogin: '5 min ago', status: 'active' },
      { id: '2', name: 'Sarah Banda', role: 'production_manager', email: 'sarah@afrivera.zm', lastLogin: '2h ago', status: 'active' },
      { id: '3', name: 'Grace Tembo', role: 'finance_manager', email: 'grace@afrivera.zm', lastLogin: '1d ago', status: 'active' },
    ],
    invoices: [
      { id: 'INV-2026-05', date: 'Jun 1, 2026', amount: 499, status: 'paid', period: 'Jun 2026' },
      { id: 'INV-2026-04', date: 'May 1, 2026', amount: 499, status: 'paid', period: 'May 2026' },
      { id: 'INV-2026-03', date: 'Apr 1, 2026', amount: 499, status: 'paid', period: 'Apr 2026' },
    ],
    enterprises: ['Broiler Poultry', 'Piggery', 'Fish Farming', 'Horticulture'],
  },
  'SUB-002': {
    healthScore: 97, lastActive: '12 min ago', avgDailyLogins: 45, apiCalls7d: 12400, storageUsedMb: 8200,
    notes: 'Largest account by MRR. Requires dedicated support SLA. Contact Mary for billing.',
    onboarding: ONBOARDING_STEPS.map(s => ({ ...s, done: true })),
    modules: buildModules(ALL_MODULES.map(m => m.id)),
    users: [
      { id: '1', name: 'Mary Chanda', role: 'director', email: 'm.chanda@zambeef.zm', lastLogin: '12 min ago', status: 'active' },
      { id: '2', name: 'Kaunda Phiri', role: 'production_manager', email: 'kaunda@zambeef.zm', lastLogin: '1h ago', status: 'active' },
      { id: '3', name: 'Bwalya Mutale', role: 'finance_manager', email: 'bwalya@zambeef.zm', lastLogin: '3h ago', status: 'active' },
      { id: '4', name: 'Nsama Mwila', role: 'supervisor', email: 'nsama@zambeef.zm', lastLogin: '2d ago', status: 'active' },
    ],
    invoices: [
      { id: 'INV-2026-05', date: 'Jun 1, 2026', amount: 999, status: 'paid', period: 'Jun 2026' },
      { id: 'INV-2026-04', date: 'May 1, 2026', amount: 999, status: 'paid', period: 'May 2026' },
    ],
    enterprises: ['Broiler Poultry', 'Piggery', 'Cattle'],
  },
  'SUB-005': {
    healthScore: 34, lastActive: '8 days ago', avgDailyLogins: 1, apiCalls7d: 42, storageUsedMb: 28,
    notes: 'Trial started April 25. Minimal engagement — needs onboarding call. Robert mentioned WhatsApp preferred.',
    onboarding: ONBOARDING_STEPS.map((s, i) => ({ ...s, done: i < 2 })),
    modules: buildModules(['smart-engine','inventory','sales']),
    users: [
      { id: '1', name: 'Robert Okello', role: 'director', email: 'robert@sunriseagro.ug', lastLogin: '8 days ago', status: 'active' },
    ],
    invoices: [],
    enterprises: ['Broiler Poultry'],
  },
  'SUB-010': {
    healthScore: 0, lastActive: '45 days ago', avgDailyLogins: 0, apiCalls7d: 0, storageUsedMb: 12,
    notes: 'Suspended May 2026 — 2 failed payment attempts. Contact Chimwemwe to resolve.',
    onboarding: ONBOARDING_STEPS.map((s, i) => ({ ...s, done: i < 3 })),
    modules: buildModules(['inventory','sales','hr']),
    users: [
      { id: '1', name: 'Chimwemwe Banda', role: 'director', email: 'chimwe@malawiml.mw', lastLogin: '45 days ago', status: 'inactive' },
    ],
    invoices: [
      { id: 'INV-2026-04', date: 'May 1, 2026', amount: 49, status: 'overdue', period: 'May 2026' },
      { id: 'INV-2026-03', date: 'Apr 1, 2026', amount: 49, status: 'overdue', period: 'Apr 2026' },
    ],
    enterprises: ['Broiler Poultry', 'Goats & Sheep'],
  },
};

function getDetail(id: string): CompanyDetail {
  if (COMPANY_DETAILS[id]) return COMPANY_DETAILS[id];
  // Generate defaults for companies without specific detail
  const sub = sampleSubscribers.find(s => s.id === id)!;
  const enabledCount = sub.plan === 'enterprise' ? 20 : sub.plan === 'professional' ? 13 : 6;
  return {
    healthScore: sub.status === 'active' ? 75 : sub.status === 'trial' ? 45 : 10,
    lastActive: sub.status === 'active' ? '2h ago' : sub.status === 'trial' ? '3d ago' : '30d ago',
    avgDailyLogins: sub.status === 'active' ? Math.max(1, sub.totalUsers * 0.4) : 1,
    apiCalls7d: sub.status === 'active' ? sub.totalUsers * 120 : 50,
    storageUsedMb: sub.totalUsers * 80,
    notes: '',
    onboarding: ONBOARDING_STEPS.map((s, i) => ({ ...s, done: sub.status === 'active' ? i < 6 : i < 3 })),
    modules: buildModules(ALL_MODULES.slice(0, enabledCount).map(m => m.id)),
    users: [{ id: '1', name: sub.contactPerson, role: 'director', email: sub.email, lastLogin: sub.status === 'active' ? '2h ago' : '5d ago', status: sub.status === 'suspended' ? 'inactive' : 'active' }],
    invoices: sub.status === 'active' ? [
      { id: 'INV-1', date: 'Jun 1, 2026', amount: sub.monthlyRevenue, status: 'paid', period: 'Jun 2026' },
      { id: 'INV-2', date: 'May 1, 2026', amount: sub.monthlyRevenue, status: 'paid', period: 'May 2026' },
    ] : [],
    enterprises: sub.enterpriseTypes,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function HealthScore({ score }: { score: number }) {
  const color = score >= 75 ? 'text-green-600' : score >= 45 ? 'text-amber-600' : 'text-red-600';
  const ring = score >= 75 ? 'stroke-green-500' : score >= 45 ? 'stroke-amber-500' : 'stroke-red-500';
  const r = 16, circ = 2 * Math.PI * r;
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <circle cx="20" cy="20" r={r} fill="none" className={ring} strokeWidth="4" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)} />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${color}`}>{score}</div>
    </div>
  );
}

const planColors: Record<string, string> = {
  starter: 'bg-slate-100 text-slate-700',
  professional: 'bg-blue-100 text-blue-700',
  enterprise: 'bg-purple-100 text-purple-700',
};
const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  trial: 'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
  churned: 'bg-slate-100 text-slate-500',
};
const invoiceColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
  void: 'bg-slate-100 text-slate-500',
};
const ROLE_LABELS: Record<string, string> = {
  saas_admin: 'SaaS Admin', director: 'Director', production_manager: 'Prod. Manager',
  finance_manager: 'Finance Mgr', sales_manager: 'Sales Mgr', supervisor: 'Supervisor',
  farmhand: 'Farmhand', vet_officer: 'Vet Officer',
};

function OnboardingProgress({ steps }: { steps: OnboardingStep[] }) {
  const done = steps.filter(s => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-slate-700">Onboarding</span>
        <span className="text-sm font-semibold text-slate-900">{done}/{steps.length} steps</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="space-y-1.5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            {step.done
              ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              : <Circle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
            }
            <span className={`text-xs ${step.done ? 'text-slate-600' : 'text-slate-400'}`}>{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Company Detail Panel ────────────────────────────────────────────────────

function CompanyPanel({ sub, onClose }: { sub: Subscriber; onClose: () => void }) {
  const [tab, setTab] = useState<'overview' | 'modules' | 'users' | 'billing' | 'notes'>('overview');
  const [detail, setDetail] = useState(() => getDetail(sub.id));
  const [note, setNote] = useState(detail.notes);

  function toggleModule(moduleId: string) {
    setDetail(prev => ({
      ...prev,
      modules: prev.modules.map(m => m.id === moduleId ? { ...m, enabled: !m.enabled } : m),
    }));
  }

  const enabledCount = detail.modules.filter(m => m.enabled).length;
  const moduleGroups = Array.from(new Set(ALL_MODULES.map(m => m.group)));

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="px-5 py-4 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <HealthScore score={detail.healthScore} />
            <div>
              <h2 className="font-bold text-slate-900 text-base leading-tight">{sub.companyName}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${planColors[sub.plan]}`}>{sub.plan}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[sub.status]}`}>{sub.status}</span>
                <span className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{sub.country}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><XCircle className="w-5 h-5" /></button>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <button className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg font-medium">
            <Send className="w-3 h-3" />Message
          </button>
          <button className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-medium">
            <Eye className="w-3 h-3" />Login as User
          </button>
          {sub.status === 'active' || sub.status === 'trial' ? (
            <button className="flex items-center gap-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-700 px-2.5 py-1.5 rounded-lg font-medium">
              <Ban className="w-3 h-3" />Suspend
            </button>
          ) : (
            <button className="flex items-center gap-1.5 text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg font-medium">
              <RotateCcw className="w-3 h-3" />Reactivate
            </button>
          )}
          <button className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-medium">
            <Download className="w-3 h-3" />Export Data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-5 flex-shrink-0 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'modules', label: `Modules (${enabledCount})` },
          { id: 'users', label: `Users (${detail.users.length})` },
          { id: 'billing', label: 'Billing' },
          { id: 'notes', label: 'Notes' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)} className={`text-sm font-medium px-3 py-2.5 border-b-2 whitespace-nowrap transition-colors ${tab === t.id ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {tab === 'overview' && (
          <>
            {/* Engagement stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Last Active', value: detail.lastActive, icon: Clock, color: 'slate' },
                { label: 'Daily Logins', value: Math.round(detail.avgDailyLogins).toString(), icon: Users, color: 'blue' },
                { label: 'API Calls (7d)', value: detail.apiCalls7d.toLocaleString(), icon: Activity, color: 'purple' },
                { label: 'Storage', value: `${detail.storageUsedMb > 999 ? (detail.storageUsedMb / 1024).toFixed(1) + ' GB' : detail.storageUsedMb + ' MB'}`, icon: Package, color: 'green' },
              ].map(stat => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">{stat.label}</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{stat.value}</div>
                  </div>
                );
              })}
            </div>

            {/* Contact info */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Contact</div>
              <div className="flex items-center gap-2 text-sm"><Users className="w-3.5 h-3.5 text-slate-400" /><span className="font-medium">{sub.contactPerson}</span></div>
              <div className="flex items-center gap-2 text-sm text-slate-600"><Mail className="w-3.5 h-3.5 text-slate-400" />{sub.email}</div>
              <div className="flex items-center gap-2 text-sm text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" />{sub.phone}</div>
              <div className="flex items-center gap-2 text-sm text-slate-600"><Calendar className="w-3.5 h-3.5 text-slate-400" />Joined {sub.startDate}</div>
            </div>

            {/* Enterprises */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Farm Enterprises ({detail.enterprises.length})</div>
              <div className="flex flex-wrap gap-2">
                {detail.enterprises.map(e => (
                  <span key={e} className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full">{e}</span>
                ))}
              </div>
            </div>

            {/* Onboarding */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <OnboardingProgress steps={detail.onboarding} />
            </div>

            {/* MRR */}
            <div className={`rounded-xl p-4 flex items-center justify-between ${sub.status === 'suspended' ? 'bg-red-50 border border-red-100' : 'bg-purple-50 border border-purple-100'}`}>
              <div>
                <div className="text-xs text-purple-700 font-medium">Monthly Revenue</div>
                <div className={`text-2xl font-bold mt-0.5 ${sub.status === 'suspended' ? 'text-red-700' : 'text-purple-800'}`}>
                  ${sub.monthlyRevenue > 0 ? sub.monthlyRevenue.toLocaleString() : '0'}
                </div>
                {sub.status === 'suspended' && <div className="text-xs text-red-600 mt-0.5">Account suspended — revenue paused</div>}
              </div>
              <DollarSign className="w-8 h-8 text-purple-200" />
            </div>
          </>
        )}

        {tab === 'modules' && (
          <>
            {/* Quick plan presets */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quick Plan Preset</div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {PLAN_BUNDLES.map(bundle => {
                  const bundleMods = new Set(bundle.modules);
                  const isCurrent = bundle.modules.every(id => detail.modules.find(m => m.id === id)?.enabled) &&
                    detail.modules.filter(m => m.enabled).length === bundle.modules.length;
                  return (
                    <button key={bundle.id} onClick={() => {
                      setDetail(d => ({ ...d, modules: d.modules.map(m => ({ ...m, enabled: bundle.modules.includes(m.id) })) }));
                    }} className={`px-2 py-2 rounded-lg border text-xs font-medium transition-all ${isCurrent ? 'bg-purple-100 border-purple-400 text-purple-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                      {bundle.name}<br /><span className="font-normal text-slate-400">${bundle.flatPrice}/mo</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Live price display */}
            <div className="bg-slate-900 text-white rounded-xl px-4 py-3 flex items-center justify-between mb-2">
              <div>
                <div className="text-xs text-slate-400">Monthly subscription value</div>
                <div className="text-2xl font-bold">${calcPrice(detail.modules.filter(m => m.enabled && !MODULE_CATALOG.find(c => c.id === m.id)?.isCore).map(m => m.id))}/mo</div>
              </div>
              <div className="text-right text-xs text-slate-400">
                {detail.modules.filter(m => m.enabled).length} modules enabled
              </div>
            </div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-400">Toggle modules to update what this customer can access</p>
              <div className="flex gap-2">
                <button onClick={() => setDetail(d => ({ ...d, modules: d.modules.map(m => ({ ...m, enabled: true })) }))} className="text-xs text-blue-600 hover:text-blue-700 font-medium">All on</button>
                <span className="text-slate-300">·</span>
                <button onClick={() => setDetail(d => ({ ...d, modules: d.modules.map(m => ({ ...m, enabled: MODULE_CATALOG.find(c => c.id === m.id)?.isCore ?? false })) }))} className="text-xs text-slate-500 hover:text-slate-700 font-medium">Core only</button>
              </div>
            </div>
            {moduleGroups.map(group => (
              <div key={group}>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{group}</div>
                <div className="space-y-1">
                  {detail.modules.filter(m => m.group === group).map(mod => {
                    const catalog = MODULE_CATALOG.find(c => c.id === mod.id);
                    return (
                      <div key={mod.id} className={`flex items-center justify-between rounded-lg px-3 py-2 border transition-all ${mod.enabled ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {mod.enabled ? <Unlock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" /> : <Lock className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
                          <span className={`text-sm font-medium truncate ${mod.enabled ? 'text-blue-800' : 'text-slate-500'}`}>{mod.label}</span>
                          {catalog && !catalog.isCore && <span className="text-xs text-slate-400 flex-shrink-0">${catalog.price}/mo</span>}
                          {catalog?.isCore && <span className="text-xs text-green-500 flex-shrink-0">Free</span>}
                        </div>
                        <button onClick={() => toggleModule(mod.id)} disabled={catalog?.isCore} className={`w-9 h-5 rounded-full transition-colors flex items-center flex-shrink-0 ml-2 ${mod.enabled ? 'bg-blue-500' : 'bg-slate-200'} ${catalog?.isCore ? 'opacity-40 cursor-not-allowed' : ''}`}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow transition-all mx-0.5 ${mod.enabled ? 'ml-4' : 'ml-0.5'}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold mt-2">
              Save & Apply to Customer Account
            </button>
          </>
        )}

        {tab === 'users' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{detail.users.length} user{detail.users.length !== 1 ? 's' : ''} in this organisation</p>
              <button className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg font-medium">
                <Plus className="w-3 h-3" />Invite User
              </button>
            </div>
            <div className="space-y-2">
              {detail.users.map(user => (
                <div key={user.id} className={`bg-white rounded-xl border p-3.5 ${user.status === 'inactive' ? 'border-red-100 opacity-70' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${user.status === 'active' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-slate-300'}`}>
                        {user.label.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{user.label}</div>
                        <div className="text-xs text-slate-500">{ROLE_LABELS[user.role] || user.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.status === 'active' ? <Wifi className="w-3.5 h-3.5 text-green-500" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
                      <button className="p-1 hover:bg-slate-100 rounded text-slate-400"><MoreVertical className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>{user.email}</span>
                    <span>Last login: {user.lastLogin}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 text-center">
              Max users: {sub.plan === 'starter' ? 5 : sub.plan === 'professional' ? 20 : 'Unlimited'} · Plan: <span className="font-medium capitalize">{sub.plan}</span>
            </div>
          </>
        )}

        {tab === 'billing' && (
          <>
            {/* Status banner */}
            <div className={`rounded-xl p-4 border ${sub.status === 'suspended' ? 'bg-red-50 border-red-200' : sub.status === 'trial' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Current Plan</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5 capitalize">{sub.plan}</div>
                  <div className={`text-xs mt-0.5 capitalize font-semibold ${sub.status === 'suspended' ? 'text-red-700' : sub.status === 'trial' ? 'text-amber-700' : 'text-green-700'}`}>
                    {sub.status}{sub.status === 'trial' ? ' — 14 day free trial' : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">${sub.monthlyRevenue}<span className="text-sm font-normal text-slate-400">/mo</span></div>
                  <div className="text-xs text-slate-400">{detail.modules.filter(m => m.enabled).length} modules</div>
                </div>
              </div>
            </div>

            {/* Plan switcher */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Change Subscription Plan</div>
              <div className="space-y-2">
                {PLAN_BUNDLES.map(bundle => {
                  const isCurrent = sub.plan === bundle.id;
                  return (
                    <button key={bundle.id} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${isCurrent ? 'border-purple-400 bg-purple-50' : 'border-slate-200 hover:border-purple-300 bg-white'}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 text-sm">{bundle.name}</span>
                          {bundle.popular && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Popular</span>}
                          {isCurrent && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">Current</span>}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{bundle.description}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{bundle.modules.length} modules · {bundle.maxUsers === -1 ? 'Unlimited users' : bundle.maxUsers + ' users max'}</div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <div className="font-bold text-slate-900">${bundle.flatPrice}/mo</div>
                        {isCurrent ? (
                          <div className="text-[10px] text-purple-600 mt-0.5">Active</div>
                        ) : (
                          <div className="text-[10px] text-blue-600 mt-0.5 font-medium">Switch →</div>
                        )}
                      </div>
                    </button>
                  );
                })}
                <button className="w-full text-xs text-center text-slate-400 hover:text-slate-600 py-1">
                  Custom module selection → go to Modules tab
                </button>
              </div>
            </div>

            {/* Trial conversion */}
            {sub.status === 'trial' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="font-semibold text-amber-900 text-sm mb-1">Trial Account — Convert Now</div>
                <p className="text-xs text-amber-700 mb-3">Started {sub.startDate}. No billing until trial converts. Send a conversion email to {sub.contactPerson} to prompt upgrade.</p>
                <div className="flex gap-2">
                  <button className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-medium">Send Conversion Email</button>
                  <button className="text-xs bg-white border border-amber-300 text-amber-700 px-3 py-1.5 rounded-lg font-medium hover:bg-amber-50">Extend Trial +7 days</button>
                </div>
              </div>
            )}

            {/* Suspension controls */}
            {sub.status === 'suspended' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="font-semibold text-red-900 text-sm mb-1">Account Suspended</div>
                <p className="text-xs text-red-700 mb-3">Access to all modules (except Dashboard) is blocked. Resolve payment to reactivate.</p>
                <div className="flex gap-2">
                  <button className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"><RotateCcw className="w-3 h-3" />Reactivate Account</button>
                  <button className="text-xs bg-white border border-red-300 text-red-700 px-3 py-1.5 rounded-lg font-medium hover:bg-red-50">Mark as Churned</button>
                </div>
              </div>
            )}

            {/* Invoice history */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-slate-700">Invoice History</div>
                <button className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"><Plus className="w-3 h-3" />Generate Invoice</button>
              </div>
              {detail.invoices.length === 0 ? (
                <div className="text-center text-sm text-slate-400 py-6 bg-slate-50 rounded-xl">No invoices yet</div>
              ) : (
                <div className="space-y-2">
                  {detail.invoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-3.5 py-3">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <div>
                          <div className="text-sm font-medium text-slate-800">{inv.id}</div>
                          <div className="text-xs text-slate-400">{inv.period} · {inv.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-800">${inv.amount}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${invoiceColors[inv.status]}`}>{inv.status}</span>
                        {inv.status === 'overdue' && (
                          <button className="text-xs text-blue-600 hover:text-blue-700">Retry</button>
                        )}
                        <button className="text-slate-400 hover:text-slate-600"><Download className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'notes' && (
          <>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Internal Admin Notes</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={5}
                placeholder="Add notes about this account — renewal reminders, calls, issues, preferences..."
                className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
              <button className="mt-2 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-medium">Save Note</button>
            </div>

            {/* Admin activity log */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Activity Log</div>
              <div className="space-y-2">
                {[
                  { action: 'Invoice paid', detail: '$' + sub.monthlyRevenue + ' — ' + sub.plan + ' plan', time: '1 Jun 2026', icon: DollarSign, color: 'green' },
                  { action: 'User login', detail: sub.contactPerson + ' logged in', time: '2 Jun 2026', icon: UserCheck, color: 'blue' },
                  { action: 'Module accessed', detail: 'Smart AI Engine · Irrigation · Tracking', time: '3 Jun 2026', icon: Activity, color: 'purple' },
                  { action: 'Support ticket closed', detail: 'Onboarding question resolved', time: '28 May 2026', icon: CheckCircle2, color: 'green' },
                ].map((ev, i) => {
                  const Icon = ev.icon;
                  return (
                    <div key={i} className="flex items-start gap-2.5 py-2 border-b border-slate-50 last:border-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${ev.color === 'green' ? 'bg-green-100' : ev.color === 'blue' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                        <Icon className={`w-3 h-3 ${ev.color === 'green' ? 'text-green-600' : ev.color === 'blue' ? 'text-blue-600' : 'text-purple-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800">{ev.action}</div>
                        <div className="text-xs text-slate-500 truncate">{ev.detail}</div>
                      </div>
                      <div className="text-[10px] text-slate-400 flex-shrink-0">{ev.time}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Platform Staff Panel ────────────────────────────────────────────────────

interface PlatformStaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  status: 'active' | 'inactive';
  lastLogin: string;
  addedDate: string;
}

const MOCK_STAFF: PlatformStaffMember[] = [
  { id: 'S1', name: 'Chanda Mwila', email: 'chanda@farmpulse.io', role: 'platform_admin', permissions: ['companies','subscriptions','staff','billing','modules','impersonate','support','analytics'], status: 'active', lastLogin: '2 min ago', addedDate: 'Jan 2026' },
  { id: 'S2', name: 'Grace Tembo', email: 'grace@farmpulse.io', role: 'billing', permissions: ['billing','subscriptions','analytics'], status: 'active', lastLogin: '1h ago', addedDate: 'Mar 2026' },
  { id: 'S3', name: 'James Banda', email: 'james@farmpulse.io', role: 'support', permissions: ['companies','support'], status: 'active', lastLogin: '3h ago', addedDate: 'Apr 2026' },
  { id: 'S4', name: 'Nsama Phiri', email: 'nsama@farmpulse.io', role: 'account_manager', permissions: ['companies','subscriptions','modules','support'], status: 'active', lastLogin: '2d ago', addedDate: 'May 2026' },
  { id: 'S5', name: 'Mulemba Zulu', email: 'mulemba@farmpulse.io', role: 'developer', permissions: ['analytics','modules'], status: 'inactive', lastLogin: '30d ago', addedDate: 'Feb 2026' },
];

const ROLE_COLOR: Record<string, string> = {
  platform_admin: 'bg-purple-100 text-purple-700',
  billing: 'bg-blue-100 text-blue-700',
  support: 'bg-green-100 text-green-700',
  account_manager: 'bg-amber-100 text-amber-700',
  developer: 'bg-slate-100 text-slate-600',
};

function PlatformStaffPanel() {
  const [staff, setStaff] = useState<PlatformStaffMember[]>(MOCK_STAFF);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('support');
  const [newPerms, setNewPerms] = useState<string[]>([]);

  function togglePerm(p: string) {
    setNewPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  function addStaff() {
    if (!newName || !newEmail) return;
    const member: PlatformStaffMember = {
      id: 'S' + Date.now(),
      name: newName, email: newEmail, role: newRole,
      permissions: newPerms, status: 'active',
      lastLogin: 'Never', addedDate: 'Jun 2026',
    };
    setStaff(prev => [member, ...prev]);
    setAdding(false);
    setNewName(''); setNewEmail(''); setNewRole('support'); setNewPerms([]);
  }

  function deactivate(id: string) {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s));
  }

  const editing = editId ? staff.find(s => s.id === editId) : null;

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-slate-800">Platform Staff</div>
          <div className="text-xs text-slate-400">FarmPulse internal team members with admin access</div>
        </div>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-medium">
          <Plus className="w-3 h-3" />Add Staff Member
        </button>
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-1.5">
        {PLATFORM_ROLES.map(r => (
          <span key={r.id} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[r.id] || 'bg-slate-100 text-slate-600'}`}>{r.label}</span>
        ))}
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
          <div className="font-semibold text-purple-900 text-sm">New Staff Member</div>
          <div className="grid grid-cols-2 gap-3">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name" className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400" />
            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email address" className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">Role</label>
            <select value={newRole} onChange={e => setNewRole(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400">
              {PLATFORM_ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">Permissions</label>
            <div className="grid grid-cols-2 gap-1.5">
              {PLATFORM_PERMISSIONS.map(p => (
                <label key={p.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer text-xs transition-all ${newPerms.includes(p.id) ? 'bg-purple-100 border-purple-300 text-purple-800' : 'bg-white border-slate-200 text-slate-600'}`}>
                  <input type="checkbox" checked={newPerms.includes(p.id)} onChange={() => togglePerm(p.id)} className="w-3 h-3 accent-purple-600" />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addStaff} className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg font-medium">Add Member</button>
            <button onClick={() => setAdding(false)} className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {/* Staff list */}
      <div className="space-y-2">
        {staff.map(member => {
          const isEditing = editId === member.id;
          return (
            <div key={member.id} className={`bg-white rounded-xl border ${member.status === 'inactive' ? 'border-slate-100 opacity-60' : 'border-slate-200'} overflow-hidden`}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${member.status === 'active' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-slate-300'}`}>
                  {member.label.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">{member.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLOR[member.role] || 'bg-slate-100 text-slate-600'}`}>
                      {PLATFORM_ROLES.find(r => r.id === member.role)?.name || member.role}
                    </span>
                    {member.status === 'inactive' && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">Deactivated</span>}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{member.email} · Last login: {member.lastLogin}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setEditId(isEditing ? null : member.id)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deactivate(member.id)} className={`p-1.5 rounded-lg ${member.status === 'active' ? 'hover:bg-red-50 text-slate-400 hover:text-red-600' : 'hover:bg-green-50 text-slate-400 hover:text-green-600'}`}>
                    {member.status === 'active' ? <Ban className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Permissions chips */}
              {!isEditing && member.permissions.length > 0 && (
                <div className="flex flex-wrap gap-1 px-4 pb-3">
                  {member.permissions.map(p => {
                    const pDef = PLATFORM_PERMISSIONS.find(x => x.id === p);
                    return <span key={p} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{pDef?.label || p}</span>;
                  })}
                </div>
              )}

              {/* Edit permissions inline */}
              {isEditing && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                  <div className="text-xs font-medium text-slate-600 mb-2">Edit Permissions</div>
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {PLATFORM_PERMISSIONS.map(p => {
                      const active = member.permissions.includes(p.id);
                      return (
                        <label key={p.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer text-xs transition-all ${active ? 'bg-purple-100 border-purple-300 text-purple-800' : 'bg-white border-slate-200 text-slate-500'}`}>
                          <input type="checkbox" checked={active} onChange={() => {
                            setStaff(prev => prev.map(s => s.id === member.id ? {
                              ...s, permissions: active ? s.permissions.filter(x => x !== p.id) : [...s.permissions, p.id]
                            } : s));
                          }} className="w-3 h-3 accent-purple-600" />
                          {p.label}
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditId(null)} className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-medium">Save Changes</button>
                    <button onClick={() => setEditId(null)} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Onboard Company Modal ───────────────────────────────────────────────────

function OnboardModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', contact: '', email: '', phone: '', country: 'Zambia', plan: 'professional' });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const steps = ['Company Info', 'Plan', 'Review'];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Onboard New Company</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg"><XCircle className="w-5 h-5" /></button>
          </div>
          <div className="flex gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i <= step ? 'bg-white text-purple-700' : 'bg-white/20 text-white/70'}`}>{i + 1}</div>
                <span className={`text-sm ${i === step ? 'text-white font-medium' : 'text-white/60'}`}>{s}</span>
                {i < steps.length - 1 && <div className={`h-px w-8 ${i < step ? 'bg-white' : 'bg-white/20'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="p-6 space-y-4">
          {step === 0 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600 block mb-1">Company Name *</label>
                  <input value={form.name} onChange={set('name')} placeholder="e.g. Sunrise Agro Ltd" className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Contact Person *</label>
                  <input value={form.contact} onChange={set('contact')} placeholder="Full name" className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Country</label>
                  <select value={form.country} onChange={set('country')} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400">
                    {['Zambia','Zimbabwe','Kenya','Tanzania','Uganda','Malawi','Mozambique','Rwanda','Ghana','Nigeria','South Africa'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Email</label>
                  <input value={form.email} onChange={set('email')} type="email" placeholder="contact@company.com" className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Phone</label>
                  <input value={form.phone} onChange={set('phone')} placeholder="+260 977..." className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
              </div>
            </>
          )}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Select a starting plan. You can change this at any time.</p>
              {PLAN_BUNDLES.map(b => (
                <label key={b.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.plan === b.id ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="plan" value={b.id} checked={form.plan === b.id} onChange={set('plan')} className="accent-purple-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{b.name}</span>
                      {b.popular && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Popular</span>}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{b.description} · {b.modules.length} modules</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">${b.flatPrice}/mo</div>
                    <div className="text-[10px] text-slate-400">after 14-day trial</div>
                  </div>
                </label>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Company</span><span className="font-medium">{form.name || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Contact</span><span className="font-medium">{form.contact || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-medium">{form.email || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Country</span><span className="font-medium">{form.country}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-2 mt-2"><span className="text-slate-500">Plan</span><span className="font-semibold text-purple-700">{PLAN_BUNDLES.find(b => b.id === form.plan)?.name} — ${PLAN_BUNDLES.find(b => b.id === form.plan)?.flatPrice}/mo</span></div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                A 14-day free trial will start immediately. An onboarding email will be sent to {form.email || 'the contact email'}.
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : onClose()} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100">
            {step > 0 ? '← Back' : 'Cancel'}
          </button>
          <button onClick={() => { if (step < 2) setStep(s => s + 1); else onClose(); }} className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl font-medium">
            {step === 2 ? 'Create Account & Send Invite' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main AdminDashboard ─────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: Props) {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<'companies' | 'pipeline' | 'revenue' | 'staff'>('companies');
  const [onboardOpen, setOnboardOpen] = useState(false);

  const filtered = sampleSubscribers.filter(s => {
    if (atRiskOnly && getDetail(s.id).healthScore >= 50) return false;
    if (planFilter !== 'all' && s.plan !== planFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (search && !s.companyName.toLowerCase().includes(search.toLowerCase()) && !s.country.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selected = selectedId ? sampleSubscribers.find(s => s.id === selectedId) : null;

  const totalMRR = sampleSubscribers.filter(s => s.status === 'active').reduce((sum, s) => sum + s.monthlyRevenue, 0);
  const activeCount = sampleSubscribers.filter(s => s.status === 'active').length;
  const trialCount = sampleSubscribers.filter(s => s.status === 'trial').length;
  const suspendedCount = sampleSubscribers.filter(s => s.status === 'suspended').length;
  const countries = new Set(sampleSubscribers.map(s => s.country)).size;
  const atRiskCount = sampleSubscribers.filter(s => getDetail(s.id).healthScore < 50 && s.status !== 'churned').length;

  const pipelineCompanies = sampleSubscribers.filter(s => s.status === 'trial' || (s.status === 'active' && getDetail(s.id).onboarding.filter(o => o.done).length < 6));

  function filterKpi(action: () => void) {
    setAtRiskOnly(false);
    setSearch('');
    action();
  }

  const kpis = [
    {
      label: 'MRR', value: `$${totalMRR.toLocaleString()}`, sub: '+18% MoM',
      icon: DollarSign, color: 'from-purple-500 to-indigo-600', active: adminTab === 'revenue',
      onClick: () => filterKpi(() => { setAdminTab('revenue'); setSelectedId(null); }),
    },
    {
      label: 'Active', value: activeCount, sub: 'paying customers',
      icon: CheckCircle2, color: 'from-green-500 to-emerald-600', active: adminTab === 'companies' && statusFilter === 'active',
      onClick: () => filterKpi(() => { setAdminTab('companies'); setStatusFilter('active'); setPlanFilter('all'); setSelectedId(null); }),
    },
    {
      label: 'Trials', value: trialCount, sub: 'in onboarding',
      icon: Clock, color: 'from-amber-500 to-orange-500', active: adminTab === 'pipeline',
      onClick: () => filterKpi(() => { setAdminTab('pipeline'); setSelectedId(null); }),
    },
    {
      label: 'Suspended', value: suspendedCount, sub: 'needs action',
      icon: Ban, color: 'from-red-500 to-rose-600', active: adminTab === 'companies' && statusFilter === 'suspended',
      onClick: () => filterKpi(() => { setAdminTab('companies'); setStatusFilter('suspended'); setPlanFilter('all'); setSelectedId(null); }),
    },
    {
      label: 'At Risk', value: atRiskCount, sub: 'health < 50',
      icon: AlertTriangle, color: 'from-orange-500 to-amber-600', active: atRiskOnly,
      onClick: () => { setAtRiskOnly(true); setAdminTab('companies'); setStatusFilter('all'); setPlanFilter('all'); setSelectedId(null); setSearch(''); },
    },
    {
      label: 'Countries', value: countries, sub: 'markets',
      icon: Globe, color: 'from-blue-500 to-cyan-500', active: false,
      onClick: () => filterKpi(() => { setAdminTab('companies'); setStatusFilter('all'); setPlanFilter('all'); setSelectedId(null); }),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {onboardOpen && <OnboardModal onClose={() => setOnboardOpen(false)} />}

      {/* Header */}
      <header className="bg-slate-900 text-white flex-shrink-0">
        <div className="px-6 pt-5 pb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg flex-shrink-0 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-white text-base leading-tight">FarmPulse Platform</h1>
              <p className="text-xs text-slate-400 truncate">Admin console · subscriber management · billing · onboarding</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-[10px] font-bold">A</div>
              <span className="text-xs text-slate-300">Operations Team</span>
            </div>
            <button onClick={() => setOnboardOpen(true)} className="flex items-center gap-2 text-sm bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl font-medium transition-colors">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Onboard Company</span>
              <span className="sm:hidden">+ Add</span>
            </button>
          </div>
        </div>

        {/* KPI row */}
        <div className="px-6 pb-5 grid grid-cols-3 md:grid-cols-6 gap-2">
          {kpis.map(kpi => {
            const Icon = kpi.icon;
            return (
              <button
                key={kpi.label}
                onClick={kpi.onClick}
                className={`group relative rounded-xl p-3 text-left transition-all outline-none
                  ${kpi.active
                    ? `bg-gradient-to-br ${kpi.color} shadow-lg ring-2 ring-white/30`
                    : 'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10'
                  }`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className={`w-3.5 h-3.5 ${kpi.active ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} />
                  <span className={`text-[11px] font-medium ${kpi.active ? 'text-white/90' : 'text-slate-400 group-hover:text-slate-300'}`}>{kpi.label}</span>
                </div>
                <div className={`text-xl font-bold ${kpi.active ? 'text-white' : 'text-white'}`}>{kpi.value}</div>
                <div className={`text-[10px] mt-0.5 ${kpi.active ? 'text-white/70' : 'text-slate-500'}`}>{kpi.sub}</div>
                {kpi.active && (
                  <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-white rounded-full opacity-80" />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left panel */}
        <div className={`flex flex-col flex-shrink-0 ${selected ? 'w-[400px]' : 'flex-1'} bg-white border-r border-slate-200 overflow-hidden`}>
          {/* Tabs + filters */}
          <div className="px-4 pt-3 pb-0 border-b border-slate-100 bg-white flex-shrink-0">
            <div className="flex gap-0.5 mb-3">
              {([
                { id: 'companies', label: 'Companies', count: sampleSubscribers.length },
                { id: 'pipeline', label: 'Pipeline', count: pipelineCompanies.length },
                { id: 'revenue', label: 'Revenue', count: null },
                { id: 'staff', label: 'Staff', count: null },
              ] as const).map(t => (
                <button key={t.id} onClick={() => { setAdminTab(t.id); setSelectedId(null); setAtRiskOnly(false); }}
                  className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-t-lg transition-colors border-b-2 ${adminTab === t.id ? 'border-purple-600 text-purple-700 bg-purple-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                  {t.label}
                  {t.count !== null && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${adminTab === t.id ? 'bg-purple-200 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>

            {adminTab === 'companies' && (
              <div className="flex gap-2 pb-3 flex-wrap">
                <div className="relative flex-1 min-w-28">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input value={search} onChange={e => { setSearch(e.target.value); setAtRiskOnly(false); }} placeholder="Search companies..." className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50" />
                </div>
                <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50">
                  <option value="all">All Plans</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setAtRiskOnly(false); }} className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspended</option>
                  <option value="churned">Churned</option>
                </select>
                {(atRiskOnly || statusFilter !== 'all' || planFilter !== 'all') && (
                  <button onClick={() => { setAtRiskOnly(false); setStatusFilter('all'); setPlanFilter('all'); setSearch(''); }} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50">
                    <XCircle className="w-3 h-3" />Clear
                  </button>
                )}
              </div>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {adminTab === 'companies' && (
              <div>
                {/* Active filter banner */}
                {atRiskOnly && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border-b border-orange-100">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs text-orange-700 font-medium">Showing {filtered.length} at-risk companies (health score &lt; 50)</span>
                  </div>
                )}
                <div className="divide-y divide-slate-100">
                  {filtered.map(sub => {
                    const det = getDetail(sub.id);
                    const isSelected = selectedId === sub.id;
                    return (
                      <button key={sub.id} onClick={() => setSelectedId(isSelected ? null : sub.id)}
                        className={`w-full text-left px-4 py-3 transition-colors ${isSelected ? 'bg-purple-50 border-l-[3px] border-purple-500 pl-3.5' : 'hover:bg-slate-50 border-l-[3px] border-transparent'}`}>
                        <div className="flex items-center gap-3">
                          <HealthScore score={det.healthScore} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 text-sm truncate">{sub.companyName}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${statusColors[sub.status]}`}>{sub.status}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                              <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{sub.country}</span>
                              <span>·</span>
                              <span className={`capitalize font-medium ${planColors[sub.plan].split(' ')[1]}`}>{sub.plan}</span>
                              <span>·</span>
                              <span>{sub.totalUsers} users</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${det.healthScore >= 75 ? 'bg-green-400' : det.healthScore >= 45 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${det.healthScore}%` }} />
                              </div>
                              <span className="text-[11px] font-semibold text-slate-600 flex-shrink-0">${sub.monthlyRevenue}/mo</span>
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${isSelected ? 'rotate-90 text-purple-500' : 'text-slate-300'}`} />
                        </div>
                      </button>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div className="py-16 flex flex-col items-center gap-2 text-slate-400">
                      <Search className="w-8 h-8 text-slate-200" />
                      <div className="text-sm font-medium">No companies match</div>
                      <button onClick={() => { setAtRiskOnly(false); setStatusFilter('all'); setPlanFilter('all'); setSearch(''); }} className="text-xs text-purple-600 hover:text-purple-700">Clear filters</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {adminTab === 'pipeline' && (
              <div className="p-5 space-y-3">
                <div className="text-sm text-slate-500 mb-2">Companies needing onboarding attention ({pipelineCompanies.length})</div>
                {pipelineCompanies.map(sub => {
                  const det = getDetail(sub.id);
                  const done = det.onboarding.filter(o => o.done).length;
                  const pct = Math.round((done / det.onboarding.length) * 100);
                  return (
                    <button key={sub.id} onClick={() => { setAdminTab('companies'); setSelectedId(sub.id); }} className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-purple-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-slate-800 text-sm">{sub.companyName}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[sub.status]}`}>{sub.status}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span>{sub.contactPerson} · {sub.country}</span>
                        <span className="font-medium">{done}/{det.onboarding.length} steps</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 75 ? 'bg-green-400' : pct >= 40 ? 'bg-blue-400' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Last active: {det.lastActive}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {adminTab === 'revenue' && (
              <div className="p-5 space-y-3">
                <div className="text-sm text-slate-500 mb-2">Revenue by company</div>
                {sampleSubscribers.filter(s => s.status === 'active').sort((a, b) => b.monthlyRevenue - a.monthlyRevenue).map(sub => (
                  <button key={sub.id} onClick={() => { setAdminTab('companies'); setSelectedId(sub.id); }} className="w-full text-left bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-purple-300 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800 text-sm">{sub.companyName}</span>
                      <span className="font-bold text-purple-700">${sub.monthlyRevenue}/mo</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-400 rounded-full" style={{ width: `${(sub.monthlyRevenue / 999) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span className="capitalize">{sub.plan} · {sub.country}</span>
                      <span>{sub.totalUsers} users</span>
                    </div>
                  </button>
                ))}
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-800">${totalMRR.toLocaleString()}</div>
                  <div className="text-sm text-purple-600">Total MRR · {activeCount} paying accounts</div>
                  <div className="text-xs text-purple-500 mt-1">ARR: ${(totalMRR * 12).toLocaleString()}</div>
                </div>
              </div>
            )}

            {adminTab === 'staff' && <PlatformStaffPanel />}
          </div>
        </div>

        {/* Right: detail panel */}
        {selected && (
          <div className="flex-1 bg-white overflow-hidden flex flex-col min-w-0">
            <CompanyPanel sub={selected} onClose={() => setSelectedId(null)} />
          </div>
        )}

        {/* Empty state: only show on companies/pipeline/revenue tabs when nothing selected */}
        {!selected && adminTab !== 'staff' && (
          <div className="hidden lg:flex flex-col items-center justify-center flex-1 bg-slate-50 gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-sm">
              <Building2 className="w-7 h-7 text-slate-300" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-slate-500">No company selected</div>
              <div className="text-sm text-slate-400 mt-1 max-w-xs">Click any company on the left to view details, manage modules, users, and billing.</div>
            </div>
            <button onClick={() => setOnboardOpen(true)} className="flex items-center gap-2 text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-colors">
              <Plus className="w-4 h-4" />Onboard a Company
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
