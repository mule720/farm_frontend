// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Production Engine (full implementation)
// Handles: cycle management, daily records, events, stage advancement,
//          output routing, KPI tracking, and cycle completion.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import { useOrg } from '@/store/orgStore';
import { getTemplate } from '@/lib/templates';
import {
  Plus, ChevronRight, Clock, CheckCircle2, Circle, AlertTriangle,
  Activity, BarChart3, Calendar, ArrowRight, X, ChevronDown,
  TrendingUp, TrendingDown, Syringe, Leaf, Skull, Package,
  DollarSign, Clipboard, ChevronUp, Flag, Play, Pause,
} from 'lucide-react';
import {
  ProductionCycle, CycleStage, ProductionTemplate, OutputRouting,
  MeasurementConfig, StageTemplate,
} from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  enterpriseId?: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────
export default function ProductionEngine({ enterpriseId, onNavigate }: Props) {
  const { org, cycles, addCycle, getCyclesForEnterprise } = useOrg();
  const [showNewCycle, setShowNewCycle] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

  if (!org) return null;

  const enterprises = org.enterprises.filter(e => e.active && (!enterpriseId || e.id === enterpriseId));
  const visibleCycles = enterpriseId ? getCyclesForEnterprise(enterpriseId) : cycles;

  const grouped = {
    active:    visibleCycles.filter(c => c.status === 'active'),
    planning:  visibleCycles.filter(c => c.status === 'planning'),
    paused:    visibleCycles.filter(c => c.status === 'paused'),
    completed: visibleCycles.filter(c => c.status === 'completed'),
  };

  const selectedCycle = selectedCycleId ? visibleCycles.find(c => c.id === selectedCycleId) : null;

  return (
    <div className="flex h-full">
      {/* ── Left panel — cycle list ──────────────────────────────────────── */}
      <div className={`${selectedCycle ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 border-r border-slate-200 bg-white`}>
        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-slate-900">Production Engine</h2>
            <p className="text-xs text-slate-500">{visibleCycles.length} cycle{visibleCycles.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowNewCycle(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
          >
            <Plus className="w-3.5 h-3.5" /> New Cycle
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {grouped.active.length > 0 && <SectionLabel label="Active" count={grouped.active.length} color="green" />}
          {grouped.active.map(c => <CycleRow key={c.id} cycle={c} org={org} selected={selectedCycleId === c.id} onClick={() => setSelectedCycleId(c.id)} />)}

          {grouped.planning.length > 0 && <SectionLabel label="Planning" count={grouped.planning.length} color="blue" />}
          {grouped.planning.map(c => <CycleRow key={c.id} cycle={c} org={org} selected={selectedCycleId === c.id} onClick={() => setSelectedCycleId(c.id)} />)}

          {grouped.paused.length > 0 && <SectionLabel label="Paused" count={grouped.paused.length} color="amber" />}
          {grouped.paused.map(c => <CycleRow key={c.id} cycle={c} org={org} selected={selectedCycleId === c.id} onClick={() => setSelectedCycleId(c.id)} />)}

          {grouped.completed.length > 0 && <SectionLabel label="Completed" count={grouped.completed.length} color="slate" />}
          {grouped.completed.map(c => <CycleRow key={c.id} cycle={c} org={org} selected={selectedCycleId === c.id} onClick={() => setSelectedCycleId(c.id)} />)}

          {visibleCycles.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Activity className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No cycles yet.</p>
              <p className="text-xs mt-1">Start a new production cycle above.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel — cycle detail ───────────────────────────────────── */}
      <div className={`${selectedCycle ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-slate-50 min-w-0`}>
        {selectedCycle ? (
          <CycleDetail
            cycle={selectedCycle}
            org={org}
            onClose={() => setSelectedCycleId(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">Select a cycle to view details</p>
          </div>
        )}
      </div>

      {/* ── New Cycle Modal ──────────────────────────────────────────────── */}
      {showNewCycle && (
        <NewCycleModal
          enterprises={enterprises}
          defaultEnterpriseId={enterpriseId}
          onSave={(data) => { addCycle(data); setShowNewCycle(false); }}
          onClose={() => setShowNewCycle(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cycle Row (left panel)
// ─────────────────────────────────────────────────────────────────────────────
function CycleRow({ cycle, org, selected, onClick }: {
  cycle: ProductionCycle; org: any; selected: boolean; onClick: () => void;
}) {
  const enterprise  = org.enterprises.find((e: any) => e.id === cycle.enterpriseId);
  const template    = getTemplate(enterprise?.templateId ?? '');
  const currentStage = cycle.stages.find(s => s.id === cycle.currentStageId);
  const daysActive  = Math.floor((Date.now() - new Date(cycle.startDate).getTime()) / 86400000);
  const stagesDone  = cycle.stages.filter(s => s.status === 'completed').length;
  const pct         = cycle.stages.length ? Math.round((stagesDone / cycle.stages.length) * 100) : 0;

  const dot: Record<string, string> = {
    active: 'bg-green-500', planning: 'bg-blue-500',
    completed: 'bg-slate-400', paused: 'bg-amber-500', aborted: 'bg-red-400',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl transition-all ${selected ? 'bg-green-50 border border-green-200' : 'hover:bg-slate-50 border border-transparent'}`}
    >
      <div className="flex items-start gap-2.5">
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dot[cycle.status] ?? dot.planning}`} />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-slate-800 truncate">{cycle.name}</div>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            <span>{template?.icon} {enterprise?.name}</span>
            {cycle.status === 'active' && <span className="text-green-600">Day {daysActive}</span>}
          </div>
          {currentStage && cycle.status === 'active' && (
            <>
              <div className="text-xs text-slate-400 mt-1">{currentStage.name}</div>
              <div className="h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cycle Detail
// ─────────────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'stages' | 'daily-log' | 'events' | 'outputs' | 'close';

function CycleDetail({ cycle, org, onClose }: { cycle: ProductionCycle; org: any; onClose: () => void }) {
  const enterprise = org.enterprises.find((e: any) => e.id === cycle.enterpriseId);
  const template   = getTemplate(enterprise?.templateId ?? '');
  const [tab, setTab] = useState<Tab>('overview');
  const { updateCycle, advanceStage, completeCycle } = useOrg();

  const currentStage   = cycle.stages.find(s => s.id === cycle.currentStageId);
  const currentTplStage = template?.stages.find(s => s.id === currentStage?.templateId);
  const currentIdx     = cycle.stages.findIndex(s => s.id === cycle.currentStageId);
  const hasNextStage   = currentIdx < cycle.stages.length - 1;
  const isLastStage    = currentIdx === cycle.stages.length - 1;
  const daysActive     = Math.floor((Date.now() - new Date(cycle.startDate).getTime()) / 86400000);
  const stagesDone     = cycle.stages.filter(s => s.status === 'completed').length;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview',  label: 'Overview' },
    { id: 'stages',    label: 'Stages' },
    { id: 'daily-log', label: 'Daily Log' },
    { id: 'events',    label: 'Events' },
    { id: 'outputs',   label: 'Outputs' },
    ...(cycle.status === 'active' ? [{ id: 'close' as Tab, label: 'Close Cycle' }] : []),
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">{template?.icon ?? '🌱'}</span>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 truncate">{cycle.name}</h2>
              <div className="text-xs text-slate-500">{enterprise?.name} · {template?.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              cycle.status === 'active'    ? 'bg-green-100 text-green-700' :
              cycle.status === 'completed' ? 'bg-slate-100 text-slate-600' :
              cycle.status === 'paused'    ? 'bg-amber-100 text-amber-700' :
              'bg-blue-100 text-blue-700'
            }`}>{cycle.status}</span>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg lg:hidden"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Meta strip */}
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Started {new Date(cycle.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Day {daysActive}</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {stagesDone}/{cycle.stages.length} stages</span>
          {currentStage && cycle.status === 'active' && (
            <span className="flex items-center gap-1 text-green-600 font-medium">▶ {currentStage.name}</span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${cycle.stages.length ? (stagesDone / cycle.stages.length) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Advance stage bar (active cycles only) */}
        {cycle.status === 'active' && currentStage && hasNextStage && (
          <div className="mt-3 flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-xl text-sm">
            <div className="flex-1 text-green-800 text-xs">
              Currently in <strong>{currentStage.name}</strong>. Ready to move to <strong>{cycle.stages[currentIdx + 1].name}</strong>?
            </div>
            <button
              onClick={() => advanceStage(cycle.id)}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 flex-shrink-0"
            >
              <ChevronRight className="w-3.5 h-3.5" /> Advance
            </button>
          </div>
        )}
        {cycle.status === 'active' && isLastStage && (
          <div className="mt-3 flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm">
            <Flag className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div className="flex-1 text-amber-800 text-xs">You are on the final stage. When done, close the cycle.</div>
            <button onClick={() => setTab('close')} className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 flex-shrink-0">
              Close Cycle
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0.5 mt-4 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-lg transition-colors ${
                tab === t.id ? 'bg-green-600 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'overview'  && <OverviewTab  cycle={cycle} template={template} />}
        {tab === 'stages'    && <StagesTab    cycle={cycle} template={template} />}
        {tab === 'daily-log' && <DailyLogTab  cycle={cycle} template={template} currentStage={currentStage} currentTplStage={currentTplStage} />}
        {tab === 'events'    && <EventsTab    cycle={cycle} template={template} currentStage={currentStage} />}
        {tab === 'outputs'   && <OutputsTab   cycle={cycle} />}
        {tab === 'close'     && <CloseCycleTab cycle={cycle} template={template} onComplete={(date, notes) => completeCycle(cycle.id, date, notes)} />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview Tab — KPIs, production units, quick stats
// ─────────────────────────────────────────────────────────────────────────────
function OverviewTab({ cycle, template }: { cycle: ProductionCycle; template: ProductionTemplate | undefined }) {
  const allRecords = cycle.stages.flatMap(s => s.dailyRecords);
  const allEvents  = cycle.stages.flatMap(s => s.events);
  const allOutputs = cycle.stages.flatMap(s => s.events.flatMap(e => e.outputs ?? []));

  // Compute simple running KPIs
  const totalMortality = allEvents
    .filter(e => e.type === 'mortality')
    .reduce((sum, e) => sum + (e.measurements['count'] ?? 0), 0);
  const totalHarvested = allOutputs
    .filter(o => o.routing === 'sale' || o.routing === 'inventory')
    .reduce((sum, o) => sum + o.quantity, 0);
  const totalFeed = allRecords
    .reduce((sum, r) => sum + (r.measurements['daily_feed_intake'] ?? r.measurements['feed_kg'] ?? 0), 0);

  const initialCount = cycle.productionUnits.reduce((s, u) => s + u.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Production units */}
      <section>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Production Units</h3>
        {cycle.productionUnits.length === 0 ? (
          <p className="text-sm text-slate-400">No production units recorded.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {cycle.productionUnits.map(u => (
              <div key={u.id} className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="text-lg font-bold text-slate-900">{u.quantity.toLocaleString()}</div>
                <div className="text-xs text-slate-500">{u.unit}</div>
                <div className="text-xs font-medium text-slate-700 mt-1">{u.name}</div>
                {u.breed && <div className="text-[10px] text-slate-400">{u.breed}</div>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Running stats */}
      <section>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Running Statistics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Records" value={allRecords.length} icon="📋" />
          <StatCard label="Total Events"  value={allEvents.length}  icon="📌" />
          <StatCard label="Mortality"     value={totalMortality || '—'} icon="💀" highlight={totalMortality > 0 ? 'red' : undefined} />
          <StatCard label="Harvested"     value={totalHarvested ? `${totalHarvested.toFixed(1)} kg` : '—'} icon="📦" highlight="green" />
        </div>
      </section>

      {/* Template KPIs */}
      {template && template.kpis.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Production KPIs</h3>
          <div className="space-y-2">
            {template.kpis.map(kpi => (
              <div key={kpi.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-800">{kpi.name}</div>
                  {kpi.description && <div className="text-xs text-slate-400 mt-0.5">{kpi.description}</div>}
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Benchmark</div>
                  <div className="font-bold text-slate-900">{kpi.benchmark ?? '—'} <span className="text-xs font-normal text-slate-500">{kpi.unit}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Feed totals */}
      {totalFeed > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Feed Consumed</h3>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-900">{totalFeed.toFixed(1)} <span className="text-sm font-normal text-slate-400">kg</span></div>
            {initialCount > 0 && <div className="text-xs text-slate-500 mt-1">FCR estimate: {(totalFeed / Math.max(totalHarvested, 1)).toFixed(2)}</div>}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, highlight }: { label: string; value: string | number; icon: string; highlight?: 'red' | 'green' }) {
  return (
    <div className={`bg-white rounded-xl border p-3 ${highlight === 'red' ? 'border-red-200' : highlight === 'green' ? 'border-green-200' : 'border-slate-200'}`}>
      <div className="text-lg mb-1">{icon}</div>
      <div className={`text-lg font-bold ${highlight === 'red' ? 'text-red-600' : highlight === 'green' ? 'text-green-700' : 'text-slate-900'}`}>{value}</div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stages Tab
// ─────────────────────────────────────────────────────────────────────────────
function StagesTab({ cycle, template }: { cycle: ProductionCycle; template: ProductionTemplate | undefined }) {
  const [expandedId, setExpandedId] = useState<string | null>(cycle.currentStageId);

  return (
    <div className="space-y-2">
      {cycle.stages.map((stage, idx) => {
        const tplStage   = template?.stages.find(s => s.id === stage.templateId);
        const isCurrent  = stage.id === cycle.currentStageId;
        const expanded   = expandedId === stage.id;
        const daysDone   = stage.startDate && stage.endDate
          ? Math.ceil((new Date(stage.endDate).getTime() - new Date(stage.startDate).getTime()) / 86400000)
          : stage.startDate ? Math.ceil((Date.now() - new Date(stage.startDate).getTime()) / 86400000) : null;

        return (
          <div key={stage.id} className={`bg-white rounded-xl border transition-all ${
            isCurrent ? 'border-green-300 shadow-sm' :
            stage.status === 'completed' ? 'border-slate-200' : 'border-slate-100 opacity-60'
          }`}>
            <button
              className="w-full flex items-center gap-3 p-4 text-left"
              onClick={() => setExpandedId(expanded ? null : stage.id)}
            >
              {/* Status icon */}
              <div className="flex-shrink-0">
                {stage.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                  : isCurrent ? <div className="w-5 h-5 rounded-full border-2 border-green-500 flex items-center justify-center"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /></div>
                  : <Circle className="w-5 h-5 text-slate-200" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-slate-800">{stage.name}</span>
                  {isCurrent && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full font-medium">Current</span>}
                  {tplStage?.typicalDurationDays && <span className="text-[10px] text-slate-400">~{tplStage.typicalDurationDays}d</span>}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {stage.dailyRecords.length} records · {stage.events.length} events
                  {daysDone !== null && ` · ${daysDone}d`}
                </div>
              </div>
              {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
            </button>

            {expanded && tplStage && (
              <div className="border-t border-slate-100 p-4 space-y-4">
                {tplStage.description && <p className="text-xs text-slate-500">{tplStage.description}</p>}

                {/* Measurements grid */}
                {tplStage.measurements.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-600 mb-2">Measurements to track</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {tplStage.measurements.map(m => (
                        <div key={m.id} className="bg-slate-50 rounded-lg p-2.5">
                          <div className="text-xs text-slate-500">{m.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{m.unit} · {m.frequency}</div>
                          {m.benchmark?.target !== undefined && (
                            <div className="text-[10px] text-green-600 mt-0.5">Target: {m.benchmark.target}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activities */}
                {tplStage.activities.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-600 mb-2">Key activities</h4>
                    <ul className="space-y-1">
                      {tplStage.activities.map((a, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                          <span className="text-green-500 mt-0.5">•</span>{a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Alerts */}
                {tplStage.alerts && tplStage.alerts.length > 0 && (
                  <div className="space-y-1.5">
                    {tplStage.alerts.map((alert, i) => (
                      <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${
                        alert.severity === 'critical' ? 'bg-red-50 text-red-700' :
                        alert.severity === 'warning'  ? 'bg-amber-50 text-amber-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        {alert.message}
                      </div>
                    ))}
                  </div>
                )}

                {/* Outputs spec */}
                {tplStage.outputs.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-600 mb-2">Expected outputs</h4>
                    <div className="space-y-1">
                      {tplStage.outputs.map(o => (
                        <div key={o.id} className="text-xs text-slate-600 flex items-center gap-2">
                          <Package className="w-3 h-3 text-slate-400" />
                          {o.label} ({o.unit}) → {o.routingOptions.join(', ')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Daily Log Tab — form to record today's measurements
// ─────────────────────────────────────────────────────────────────────────────
function DailyLogTab({ cycle, template, currentStage, currentTplStage }: {
  cycle: ProductionCycle;
  template: ProductionTemplate | undefined;
  currentStage: CycleStage | undefined;
  currentTplStage: StageTemplate | undefined;
}) {
  const { addDailyRecord } = useOrg();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate]       = useState(today);
  const [values, setValues]   = useState<Record<string, string>>({});
  const [notes, setNotes]     = useState('');
  const [saved, setSaved]     = useState(false);
  const [stageId, setStageId] = useState(currentStage?.id ?? '');

  const activeStages = cycle.stages.filter(s => s.status === 'active' || s.status === 'completed');
  const selectedStage    = cycle.stages.find(s => s.id === stageId);
  const selectedTplStage = template?.stages.find(s => s.id === selectedStage?.templateId);
  const dailyMeasurements = selectedTplStage?.measurements.filter(m => m.frequency === 'daily') ?? [];

  function submit() {
    if (!stageId) return;
    const measurements: Record<string, number> = {};
    dailyMeasurements.forEach(m => {
      if (values[m.id] !== undefined && values[m.id] !== '') {
        measurements[m.id] = parseFloat(values[m.id]);
      }
    });
    addDailyRecord(cycle.id, stageId, {
      date,
      measurements,
      notes: notes || undefined,
      recordedBy: 'user',
    });
    setValues({});
    setNotes('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  // Recent records for this stage
  const recentRecords = (selectedStage?.dailyRecords ?? [])
    .slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  if (cycle.status === 'completed') {
    return <p className="text-sm text-slate-400 text-center py-12">This cycle is complete — no new records can be added.</p>;
  }

  return (
    <div className="space-y-5">
      {/* Stage + date selectors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Stage</label>
          <select value={stageId} onChange={e => { setStageId(e.target.value); setValues({}); }}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            {activeStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
      </div>

      {/* Measurement fields */}
      {dailyMeasurements.length === 0 ? (
        <p className="text-sm text-slate-400">No daily measurements defined for this stage.</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">Today's Measurements</h3>
          <div className="grid grid-cols-2 gap-3">
            {dailyMeasurements.map(m => (
              <div key={m.id}>
                <label className="block text-xs text-slate-600 mb-1">
                  {m.name}
                  {m.required && <span className="text-red-400 ml-0.5">*</span>}
                  {m.benchmark?.target !== undefined && (
                    <span className="text-slate-400 ml-1">(target: {m.benchmark.target})</span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="—"
                    value={values[m.id] ?? ''}
                    onChange={e => setValues(v => ({ ...v, [m.id]: e.target.value }))}
                    className="flex-1 border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-xs text-slate-400 w-10 flex-shrink-0">{m.unit}</span>
                </div>
                {/* Benchmark indicator */}
                {m.benchmark && values[m.id] !== undefined && values[m.id] !== '' && (
                  <BenchmarkIndicator value={parseFloat(values[m.id])} benchmark={m.benchmark} />
                )}
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Any observations for today..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>
          <button onClick={submit}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${saved ? 'bg-green-100 text-green-700' : 'bg-green-600 text-white hover:bg-green-700'}`}>
            {saved ? '✓ Record saved!' : 'Save Daily Record'}
          </button>
        </div>
      )}

      {/* Recent records */}
      {recentRecords.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Records</h3>
          <div className="space-y-2">
            {recentRecords.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-medium text-slate-700">{new Date(r.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span className="text-slate-400">{Object.keys(r.measurements).length} measurements</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.entries(r.measurements).map(([key, val]) => {
                    const mc = selectedTplStage?.measurements.find(m => m.id === key);
                    return (
                      <div key={key} className="bg-slate-50 rounded-lg p-1.5">
                        <div className="text-[10px] text-slate-400">{mc?.name ?? key}</div>
                        <div className="text-xs font-bold text-slate-800">{val} <span className="font-normal text-slate-400">{mc?.unit}</span></div>
                      </div>
                    );
                  })}
                </div>
                {r.notes && <p className="text-xs text-slate-500 mt-1.5">{r.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BenchmarkIndicator({ value, benchmark }: { value: number; benchmark: { min?: number; max?: number; target?: number } }) {
  const good = (benchmark.min === undefined || value >= benchmark.min) && (benchmark.max === undefined || value <= benchmark.max);
  return (
    <div className={`text-[10px] mt-0.5 ${good ? 'text-green-600' : 'text-red-500'}`}>
      {good ? '✓ In range' : '⚠ Out of range'}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Events Tab — log mortality, treatments, harvests, observations
// ─────────────────────────────────────────────────────────────────────────────
const EVENT_TYPES = [
  { id: 'mortality',    label: 'Mortality',     icon: '💀', color: 'bg-red-50 border-red-200 text-red-700' },
  { id: 'treatment',   label: 'Treatment',     icon: '💊', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'vaccination', label: 'Vaccination',   icon: '💉', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'harvest',     label: 'Harvest',       icon: '🌾', color: 'bg-green-50 border-green-200 text-green-700' },
  { id: 'purchase',    label: 'Input Purchase', icon: '🛒', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { id: 'transfer',    label: 'Transfer',      icon: '🔄', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { id: 'observation', label: 'Observation',   icon: '📝', color: 'bg-slate-50 border-slate-200 text-slate-700' },
  { id: 'sale',        label: 'Sale',          icon: '💵', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
];

const OUTPUT_ROUTING_OPTIONS: { id: OutputRouting; label: string }[] = [
  { id: 'sale',       label: 'Sale' },
  { id: 'inventory',  label: 'Inventory' },
  { id: 'processing', label: 'Processing' },
  { id: 'incubation', label: 'Incubation' },
  { id: 'hatchery',   label: 'Hatchery' },
  { id: 'transfer',   label: 'Transfer' },
  { id: 'waste',      label: 'Waste' },
  { id: 'own_use',    label: 'Own Use' },
];

function EventsTab({ cycle, template, currentStage }: {
  cycle: ProductionCycle;
  template: ProductionTemplate | undefined;
  currentStage: CycleStage | undefined;
}) {
  const { addEvent } = useOrg();
  const [showForm, setShowForm] = useState(false);
  const [eventType, setEventType] = useState('observation');
  const [stageId, setStageId]     = useState(currentStage?.id ?? cycle.stages[0]?.id ?? '');
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10));
  const [description, setDesc]    = useState('');
  const [count, setCount]         = useState('');
  const [cause, setCause]         = useState('');
  const [productName, setProd]    = useState('');
  const [dose, setDose]           = useState('');
  const [costAmt, setCost]        = useState('');
  const [saved, setSaved]         = useState(false);

  // For harvest/sale outputs
  const [outputs, setOutputs] = useState([{ id: uuidv4(), materialName: '', quantity: '', unit: 'kg', routing: 'inventory' as OutputRouting }]);

  const allEvents = cycle.stages.flatMap(s => s.events.map(e => ({ ...e, stageName: s.name })))
    .sort((a, b) => b.date.localeCompare(a.date));

  function save() {
    const measurements: Record<string, number> = {};
    if (count) measurements['count'] = parseFloat(count);
    if (dose)  measurements['dose']  = parseFloat(dose);
    if (costAmt) measurements['cost'] = parseFloat(costAmt);

    const eventOutputs = (eventType === 'harvest' || eventType === 'sale')
      ? outputs
          .filter(o => o.materialName && o.quantity)
          .map(o => ({
            id: uuidv4(),
            materialTypeId: o.materialName.toLowerCase().replace(/\s+/g, '_'),
            materialName: o.materialName,
            quantity: parseFloat(o.quantity),
            unit: o.unit as any,
            routing: o.routing,
          }))
      : [];

    addEvent(cycle.id, stageId, {
      type: eventType,
      date,
      description: description || undefined,
      measurements,
      outputs: eventOutputs.length > 0 ? eventOutputs : undefined,
      cost: costAmt ? parseFloat(costAmt) : undefined,
      notes: cause || productName ? `${productName ? 'Product: ' + productName : ''} ${cause ? '| Cause: ' + cause : ''}`.trim() : undefined,
      recordedBy: 'user',
    });

    // reset
    setDesc(''); setCount(''); setCause(''); setProd(''); setDose(''); setCost('');
    setOutputs([{ id: uuidv4(), materialName: '', quantity: '', unit: 'kg', routing: 'inventory' }]);
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); }, 1500);
  }

  const et = EVENT_TYPES.find(t => t.id === eventType);

  return (
    <div className="space-y-5">
      {cycle.status !== 'completed' && (
        <button onClick={() => setShowForm(f => !f)}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 w-full justify-center">
          <Plus className="w-4 h-4" /> Log Event
        </button>
      )}

      {/* Event form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
          {/* Type grid */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Event Type</label>
            <div className="grid grid-cols-4 gap-1.5">
              {EVENT_TYPES.map(t => (
                <button key={t.id} onClick={() => setEventType(t.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all ${eventType === t.id ? t.color + ' ring-1 ring-current' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  <span className="text-lg">{t.icon}</span>
                  <span className="leading-tight text-center">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stage + date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Stage</label>
              <select value={stageId} onChange={e => setStageId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                {cycle.stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          {/* Mortality fields */}
          {eventType === 'mortality' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Count *</label>
                <input type="number" min="1" value={count} onChange={e => setCount(e.target.value)} placeholder="0"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Cause</label>
                <input type="text" value={cause} onChange={e => setCause(e.target.value)} placeholder="e.g. heat stress"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
          )}

          {/* Treatment / Vaccination fields */}
          {(eventType === 'treatment' || eventType === 'vaccination') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Product / Vaccine</label>
                <input type="text" value={productName} onChange={e => setProd(e.target.value)} placeholder="e.g. Newcastle ND"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Dose / Rate</label>
                <input type="text" value={dose} onChange={e => setDose(e.target.value)} placeholder="e.g. 1ml/bird"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Cost</label>
                <input type="number" step="any" value={costAmt} onChange={e => setCost(e.target.value)} placeholder="0.00"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
          )}

          {/* Purchase fields */}
          {eventType === 'purchase' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Item</label>
                <input type="text" value={productName} onChange={e => setProd(e.target.value)} placeholder="e.g. Broiler starter feed"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Cost</label>
                <input type="number" step="any" value={costAmt} onChange={e => setCost(e.target.value)} placeholder="0.00"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
          )}

          {/* Harvest / Sale outputs */}
          {(eventType === 'harvest' || eventType === 'sale') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-600">Output Materials</label>
                <button onClick={() => setOutputs(o => [...o, { id: uuidv4(), materialName: '', quantity: '', unit: 'kg', routing: 'inventory' }])}
                  className="text-xs text-green-600 hover:underline flex items-center gap-0.5">
                  <Plus className="w-3 h-3" /> Add row
                </button>
              </div>
              <div className="space-y-2">
                {outputs.map((o, i) => (
                  <div key={o.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      {i === 0 && <label className="block text-[10px] text-slate-400 mb-1">Material</label>}
                      <input type="text" value={o.materialName}
                        onChange={e => setOutputs(outs => outs.map((x, j) => j === i ? { ...x, materialName: e.target.value } : x))}
                        placeholder="e.g. Live broilers"
                        className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <label className="block text-[10px] text-slate-400 mb-1">Qty</label>}
                      <input type="number" step="any" value={o.quantity}
                        onChange={e => setOutputs(outs => outs.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))}
                        placeholder="0"
                        className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <label className="block text-[10px] text-slate-400 mb-1">Unit</label>}
                      <select value={o.unit} onChange={e => setOutputs(outs => outs.map((x, j) => j === i ? { ...x, unit: e.target.value } : x))}
                        className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500">
                        {['kg', 'g', 'tonne', 'count', 'head', 'litre', 'crate', 'bag', 'box', 'tray'].map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      {i === 0 && <label className="block text-[10px] text-slate-400 mb-1">Route to</label>}
                      <select value={o.routing} onChange={e => setOutputs(outs => outs.map((x, j) => j === i ? { ...x, routing: e.target.value as OutputRouting } : x))}
                        className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500">
                        {OUTPUT_ROUTING_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                      </select>
                    </div>
                    <div className="col-span-1">
                      {outputs.length > 1 && (
                        <button onClick={() => setOutputs(outs => outs.filter((_, j) => j !== i))}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description / notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} rows={2}
              placeholder="Additional details..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={save}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${saved ? 'bg-green-100 text-green-700' : 'bg-green-600 text-white hover:bg-green-700'}`}>
              {saved ? '✓ Saved!' : `Save ${et?.label ?? 'Event'}`}
            </button>
          </div>
        </div>
      )}

      {/* Event history */}
      {allEvents.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <Clipboard className="w-8 h-8 mx-auto mb-3 opacity-25" />
          <p className="text-sm">No events recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Event History ({allEvents.length})</h3>
          {allEvents.map(event => {
            const et = EVENT_TYPES.find(t => t.id === event.type);
            return (
              <div key={event.id} className={`rounded-xl border p-3.5 ${et?.color ?? 'bg-white border-slate-200 text-slate-700'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{et?.icon ?? '📌'}</span>
                    <div>
                      <div className="text-sm font-medium">{et?.label ?? event.type}</div>
                      <div className="text-xs opacity-70">{new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {event.stageName}</div>
                    </div>
                  </div>
                  {event.measurements?.count !== undefined && (
                    <div className="font-bold text-sm">×{event.measurements.count}</div>
                  )}
                  {event.cost !== undefined && (
                    <div className="text-xs opacity-80 font-medium">Cost: {event.cost}</div>
                  )}
                </div>
                {event.notes && <p className="text-xs mt-1.5 opacity-80">{event.notes}</p>}
                {event.description && <p className="text-xs mt-1 opacity-70">{event.description}</p>}
                {event.outputs && event.outputs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {event.outputs.map(o => (
                      <span key={o.id} className="text-xs bg-white/60 rounded-full px-2 py-0.5">
                        {o.quantity} {o.unit} {o.materialName} → {o.routing}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Outputs Tab — routed production outputs summary
// ─────────────────────────────────────────────────────────────────────────────
function OutputsTab({ cycle }: { cycle: ProductionCycle }) {
  const allOutputs = cycle.stages.flatMap(s =>
    s.events.flatMap(e => (e.outputs ?? []).map(o => ({ ...o, date: e.date, stageName: s.name })))
  ).sort((a, b) => b.date.localeCompare(a.date));

  const byRouting = allOutputs.reduce<Record<string, typeof allOutputs>>((acc, o) => {
    acc[o.routing] = [...(acc[o.routing] ?? []), o];
    return acc;
  }, {});

  const routingConfig: Record<string, { label: string; color: string; icon: string }> = {
    sale:       { label: 'Sales',        color: 'bg-green-100 text-green-800',   icon: '💵' },
    inventory:  { label: 'Inventory',    color: 'bg-blue-100 text-blue-800',     icon: '📦' },
    processing: { label: 'Processing',   color: 'bg-purple-100 text-purple-800', icon: '⚙️' },
    incubation: { label: 'Incubation',   color: 'bg-amber-100 text-amber-800',   icon: '🥚' },
    hatchery:   { label: 'Hatchery',     color: 'bg-yellow-100 text-yellow-800', icon: '🐣' },
    transfer:   { label: 'Transfer',     color: 'bg-cyan-100 text-cyan-800',     icon: '🔄' },
    waste:      { label: 'Waste',        color: 'bg-red-100 text-red-800',       icon: '🗑️' },
    own_use:    { label: 'Own Use',      color: 'bg-slate-100 text-slate-700',   icon: '🏠' },
  };

  if (allOutputs.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Package className="w-8 h-8 mx-auto mb-3 opacity-25" />
        <p className="text-sm">No outputs recorded yet.</p>
        <p className="text-xs mt-1">Log a Harvest or Sale event to record outputs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary by routing */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Object.entries(byRouting).map(([routing, items]) => {
          const cfg = routingConfig[routing];
          const totalQty = items.reduce((s, o) => s + o.quantity, 0);
          return (
            <div key={routing} className={`rounded-xl p-3 ${cfg?.color ?? 'bg-slate-50 text-slate-700'}`}>
              <div className="text-lg mb-1">{cfg?.icon ?? '→'}</div>
              <div className="font-bold text-sm">{totalQty.toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-wide font-medium opacity-70">{cfg?.label ?? routing}</div>
            </div>
          );
        })}
      </div>

      {/* All outputs list */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">All Outputs</h3>
        {allOutputs.map((o, i) => {
          const cfg = routingConfig[o.routing];
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm text-slate-800">{o.materialName}</div>
                <div className="text-xs text-slate-400 mt-0.5">{new Date(o.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {o.stageName}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900 text-sm">{o.quantity.toLocaleString()} <span className="font-normal text-slate-400 text-xs">{o.unit}</span></div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg?.color ?? 'bg-slate-100 text-slate-600'}`}>
                  {cfg?.icon} {cfg?.label ?? o.routing}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Close Cycle Tab
// ─────────────────────────────────────────────────────────────────────────────
function CloseCycleTab({ cycle, template, onComplete }: {
  cycle: ProductionCycle;
  template: ProductionTemplate | undefined;
  onComplete: (date: string, notes?: string) => void;
}) {
  const [endDate, setEndDate]   = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes]       = useState('');
  const [confirmed, setConfirmed] = useState(false);

  if (cycle.status === 'completed') {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800">Cycle Completed</h3>
        <p className="text-sm text-slate-500 mt-1">Ended {cycle.endDate ? new Date(cycle.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</p>
        {cycle.notes && <p className="text-sm text-slate-400 mt-3 max-w-xs mx-auto">{cycle.notes}</p>}
      </div>
    );
  }

  // Summary stats
  const allRecords = cycle.stages.flatMap(s => s.dailyRecords);
  const allEvents  = cycle.stages.flatMap(s => s.events);
  const allOutputs = cycle.stages.flatMap(s => s.events.flatMap(e => e.outputs ?? []));
  const totalMortality = allEvents.filter(e => e.type === 'mortality').reduce((s, e) => s + (e.measurements['count'] ?? 0), 0);
  const totalHarvested = allOutputs.reduce((s, o) => s + o.quantity, 0);
  const daysActive = Math.ceil((new Date(endDate).getTime() - new Date(cycle.startDate).getTime()) / 86400000);

  return (
    <div className="space-y-5 max-w-lg">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>⚠ Closing a cycle is permanent.</strong> Make sure all records and outputs are logged before closing.
      </div>

      {/* Cycle summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 className="font-semibold text-slate-800">Cycle Summary</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-slate-400">Duration</div>
            <div className="font-bold text-slate-900">{daysActive} days</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-slate-400">Daily Records</div>
            <div className="font-bold text-slate-900">{allRecords.length}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-slate-400">Mortality Events</div>
            <div className={`font-bold ${totalMortality > 0 ? 'text-red-600' : 'text-slate-900'}`}>{totalMortality}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-slate-400">Total Output</div>
            <div className="font-bold text-green-700">{totalHarvested.toFixed(1)} kg</div>
          </div>
        </div>
      </div>

      {/* End date */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">End Date</label>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Closing Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder="Performance summary, lessons learned, final observations..."
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
      </div>

      {/* Confirm checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
          className="mt-0.5 rounded border-slate-300 text-green-600 focus:ring-green-500" />
        <span className="text-sm text-slate-700">I confirm all records and outputs have been entered for this cycle.</span>
      </label>

      <button
        disabled={!confirmed}
        onClick={() => onComplete(endDate, notes || undefined)}
        className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
      >
        Close & Complete Cycle
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New Cycle Modal — extended with production units
// ─────────────────────────────────────────────────────────────────────────────
function NewCycleModal({ enterprises, defaultEnterpriseId, onSave, onClose }: {
  enterprises: any[];
  defaultEnterpriseId?: string;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [enterpriseId, setEnterpriseId] = useState(defaultEnterpriseId ?? enterprises[0]?.id ?? '');
  const [name, setName]         = useState('');
  const [startDate, setStart]   = useState(new Date().toISOString().slice(0, 10));
  const [expectedEnd, setExpEnd] = useState('');
  const [notes, setNotes]       = useState('');

  // Production units
  const [units, setUnits] = useState([{ id: uuidv4(), name: 'Initial Stock', quantity: '', unit: 'count', breed: '', location: '' }]);

  const selectedEnt = enterprises.find(e => e.id === enterpriseId);
  const template    = getTemplate(selectedEnt?.templateId ?? '');

  React.useEffect(() => {
    if (template) {
      const month = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
      setName(`${template.shortName} ${month}`);

      // Default unit name based on category
      const unitLabel =
        template.category === 'poultry'     ? 'Flock (birds)' :
        template.category === 'livestock'   ? 'Herd (head)' :
        template.category === 'aquaculture' ? 'Pond stock' :
        template.category === 'crops'       ? 'Field area' :
        'Initial Stock';
      const unitOfMeasure =
        template.category === 'crops' || template.category === 'horticulture' ? 'ha' :
        template.category === 'livestock' ? 'head' : 'count';
      setUnits([{ id: uuidv4(), name: unitLabel, quantity: '', unit: unitOfMeasure, breed: '', location: '' }]);
    }
  }, [enterpriseId]);

  function save() {
    if (!enterpriseId || !name.trim()) return;
    const productionUnits = units
      .filter(u => u.quantity !== '' && parseFloat(u.quantity) > 0)
      .map(u => ({
        id: u.id,
        enterpriseId,
        name: u.name,
        type: 'initial',
        quantity: parseFloat(u.quantity),
        unit: u.unit as any,
        breed: u.breed || undefined,
        location: u.location || undefined,
        active: true,
      }));
    onSave({
      enterpriseId,
      name: name.trim(),
      startDate,
      expectedEndDate: expectedEnd || undefined,
      status: 'active' as const,
      currentStageId: '',
      productionUnits,
      notes: notes || undefined,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h3 className="font-bold text-slate-900">Start New Production Cycle</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Enterprise */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Enterprise</label>
            <select value={enterpriseId} onChange={e => setEnterpriseId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              {enterprises.map(e => {
                const tpl = getTemplate(e.templateId);
                return <option key={e.id} value={e.id}>{tpl?.icon} {e.name}</option>;
              })}
            </select>
          </div>

          {/* Template preview */}
          {template && (
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{template.icon}</span>
                <span className="font-medium text-sm text-slate-800">{template.name}</span>
              </div>
              <div className="text-xs text-slate-500">{template.stages.length} stages: {template.stages.map(s => s.name).join(' → ')}</div>
            </div>
          )}

          {/* Cycle name */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Cycle Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Broiler Batch 1"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStart(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Expected End Date <span className="text-slate-400">(optional)</span></label>
              <input type="date" value={expectedEnd} onChange={e => setExpEnd(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          {/* Production units */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600">Production Units (initial stock)</label>
              <button onClick={() => setUnits(u => [...u, { id: uuidv4(), name: '', quantity: '', unit: 'count', breed: '', location: '' }])}
                className="text-xs text-green-600 hover:underline flex items-center gap-0.5">
                <Plus className="w-3 h-3" /> Add unit
              </button>
            </div>
            <div className="space-y-2">
              {units.map((u, i) => (
                <div key={u.id} className="bg-slate-50 rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Name</label>
                      <input type="text" value={u.name}
                        onChange={e => setUnits(us => us.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                        placeholder="e.g. House A"
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Quantity</label>
                      <input type="number" min="0" value={u.quantity}
                        onChange={e => setUnits(us => us.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))}
                        placeholder="0"
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Unit</label>
                      <select value={u.unit} onChange={e => setUnits(us => us.map((x, j) => j === i ? { ...x, unit: e.target.value } : x))}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500">
                        {['count', 'head', 'flock', 'ha', 'acre', 'm2', 'hive', 'kg'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Breed (optional)</label>
                      <input type="text" value={u.breed}
                        onChange={e => setUnits(us => us.map((x, j) => j === i ? { ...x, breed: e.target.value } : x))}
                        placeholder="e.g. Ross 308"
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                  </div>
                  {units.length > 1 && (
                    <button onClick={() => setUnits(us => us.filter((_, j) => j !== i))}
                      className="text-xs text-red-500 hover:underline">Remove</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Notes <span className="text-slate-400">(optional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Supplier, source, any initial observations..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={!name.trim() || !enterpriseId}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            Start Cycle
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ label, count, color }: { label: string; count: number; color: string }) {
  const colors: Record<string, string> = {
    green: 'text-green-600', blue: 'text-blue-600', amber: 'text-amber-600', slate: 'text-slate-400',
  };
  return (
    <div className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider ${colors[color] ?? colors.slate} flex items-center gap-2`}>
      {label}
      <span className="bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5 text-[10px]">{count}</span>
    </div>
  );
}
