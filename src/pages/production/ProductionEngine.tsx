import React, { useState } from 'react';
import { useOrg } from '@/store/orgStore';
import { getTemplate } from '@/lib/templates';
import {
  Plus, ChevronRight, Clock, CheckCircle2, Circle, Pause,
  Activity, BarChart3, Calendar, ArrowRight, X, AlertTriangle,
} from 'lucide-react';
import { ProductionCycle, CycleStage } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  enterpriseId?: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function ProductionEngine({ enterpriseId, onNavigate }: Props) {
  const { org, cycles, addCycle, getCyclesForEnterprise } = useOrg();
  const [showNewCycle, setShowNewCycle] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

  if (!org) return null;

  const enterprises = org.enterprises.filter(e => e.active && (!enterpriseId || e.id === enterpriseId));

  // All cycles across selected enterprises (or all)
  const visibleCycles = enterpriseId
    ? getCyclesForEnterprise(enterpriseId)
    : cycles;

  const activeCycles    = visibleCycles.filter(c => c.status === 'active');
  const completedCycles = visibleCycles.filter(c => c.status === 'completed');
  const plannedCycles   = visibleCycles.filter(c => c.status === 'planning');

  const selectedCycle = selectedCycleId ? visibleCycles.find(c => c.id === selectedCycleId) : null;

  return (
    <div className="flex h-full">
      {/* Left panel — cycle list */}
      <div className={`${selectedCycle ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 border-r border-slate-200 bg-white`}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
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
          {/* Active */}
          {activeCycles.length > 0 && (
            <SectionLabel label="Active" count={activeCycles.length} color="green" />
          )}
          {activeCycles.map(c => (
            <CycleRow key={c.id} cycle={c} org={org} selected={selectedCycleId === c.id} onClick={() => setSelectedCycleId(c.id)} />
          ))}

          {/* Planning */}
          {plannedCycles.length > 0 && (
            <SectionLabel label="Planning" count={plannedCycles.length} color="blue" />
          )}
          {plannedCycles.map(c => (
            <CycleRow key={c.id} cycle={c} org={org} selected={selectedCycleId === c.id} onClick={() => setSelectedCycleId(c.id)} />
          ))}

          {/* Completed */}
          {completedCycles.length > 0 && (
            <SectionLabel label="Completed" count={completedCycles.length} color="slate" />
          )}
          {completedCycles.map(c => (
            <CycleRow key={c.id} cycle={c} org={org} selected={selectedCycleId === c.id} onClick={() => setSelectedCycleId(c.id)} />
          ))}

          {visibleCycles.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Activity className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No cycles yet.</p>
              <p className="text-xs mt-1">Start a new production cycle above.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right panel — cycle detail */}
      <div className={`${selectedCycle ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-slate-50`}>
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

      {/* New Cycle Modal */}
      {showNewCycle && (
        <NewCycleModal
          enterprises={enterprises}
          defaultEnterpriseId={enterpriseId}
          onSave={(data) => {
            addCycle(data);
            setShowNewCycle(false);
          }}
          onClose={() => setShowNewCycle(false)}
        />
      )}
    </div>
  );
}

// ─── Cycle Row ────────────────────────────────────────────────────────────────

function CycleRow({ cycle, org, selected, onClick }: {
  cycle: ProductionCycle;
  org: any;
  selected: boolean;
  onClick: () => void;
}) {
  const enterprise = org.enterprises.find((e: any) => e.id === cycle.enterpriseId);
  const template   = getTemplate(enterprise?.templateId ?? '');
  const currentStage = cycle.stages.find(s => s.id === cycle.currentStageId);
  const daysActive = Math.floor((Date.now() - new Date(cycle.startDate).getTime()) / 86400000);

  const statusColor = {
    active: 'bg-green-500',
    planning: 'bg-blue-500',
    completed: 'bg-slate-400',
    paused: 'bg-amber-500',
    aborted: 'bg-red-400',
  }[cycle.status] ?? 'bg-slate-400';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl transition-all ${
        selected ? 'bg-green-50 border border-green-200' : 'hover:bg-slate-50 border border-transparent'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${statusColor}`} />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-slate-800 truncate">{cycle.name}</div>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            <span>{template?.icon} {enterprise?.name}</span>
            {cycle.status === 'active' && <span className="text-green-600">{daysActive}d</span>}
          </div>
          {currentStage && cycle.status === 'active' && (
            <div className="text-xs text-slate-400 mt-1">Stage: {currentStage.name}</div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
      </div>
    </button>
  );
}

// ─── Cycle Detail ─────────────────────────────────────────────────────────────

function CycleDetail({ cycle, org, onClose }: { cycle: ProductionCycle; org: any; onClose: () => void }) {
  const enterprise = org.enterprises.find((e: any) => e.id === cycle.enterpriseId);
  const template   = getTemplate(enterprise?.templateId ?? '');
  const [activeTab, setActiveTab] = useState<'stages' | 'records' | 'outputs'>('stages');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{template?.icon ?? '🌱'}</span>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">{cycle.name}</h2>
              <div className="text-sm text-slate-500">{enterprise?.name} · {template?.name}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg lg:hidden">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cycle meta */}
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" /> Started {new Date(cycle.startDate).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {Math.floor((Date.now() - new Date(cycle.startDate).getTime()) / 86400000)} days
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            cycle.status === 'active' ? 'bg-green-100 text-green-700' :
            cycle.status === 'completed' ? 'bg-slate-100 text-slate-600' :
            'bg-amber-100 text-amber-700'
          }`}>
            {cycle.status}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 border-b border-slate-100">
          {(['stages', 'records', 'outputs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm font-medium capitalize rounded-t-lg transition-colors ${
                activeTab === tab
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'stages' && (
          <StagesTab cycle={cycle} template={template} />
        )}
        {activeTab === 'records' && (
          <RecordsTab cycle={cycle} />
        )}
        {activeTab === 'outputs' && (
          <OutputsTab cycle={cycle} />
        )}
      </div>
    </div>
  );
}

// ─── Stages Tab ──────────────────────────────────────────────────────────────

function StagesTab({ cycle, template }: { cycle: ProductionCycle; template: any }) {
  return (
    <div className="space-y-3">
      {cycle.stages.map((stage, idx) => {
        const tplStage = template?.stages.find((s: any) => s.id === stage.templateId);
        const isCurrent = stage.id === cycle.currentStageId;
        const eventCount = stage.events.length;
        const recordCount = stage.dailyRecords.length;

        return (
          <div key={stage.id} className={`bg-white rounded-xl border p-4 ${
            isCurrent ? 'border-green-300 shadow-sm' :
            stage.status === 'completed' ? 'border-slate-200 opacity-80' : 'border-slate-100'
          }`}>
            <div className="flex items-start gap-3">
              {/* Stage status icon */}
              <div className="mt-0.5 flex-shrink-0">
                {stage.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full border-2 border-green-500 flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                ) : (
                  <Circle className="w-5 h-5 text-slate-300" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800 text-sm">{stage.name}</span>
                  {isCurrent && (
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Current</span>
                  )}
                  {tplStage?.typicalDurationDays && (
                    <span className="text-xs text-slate-400">~{tplStage.typicalDurationDays} days</span>
                  )}
                </div>

                {tplStage?.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{tplStage.description}</p>
                )}

                {/* Stage metrics */}
                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                  <span>{recordCount} daily record{recordCount !== 1 ? 's' : ''}</span>
                  <span>{eventCount} event{eventCount !== 1 ? 's' : ''}</span>
                  {stage.startDate && <span>Started {new Date(stage.startDate).toLocaleDateString()}</span>}
                </div>

                {/* Measurements for this stage */}
                {isCurrent && tplStage?.measurements && tplStage.measurements.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {tplStage.measurements.slice(0, 4).map((m: any) => (
                      <div key={m.id} className="bg-slate-50 rounded-lg p-2.5">
                        <div className="text-xs text-slate-500">{m.name}</div>
                        <div className="text-sm font-bold text-slate-800 mt-0.5">— <span className="text-xs font-normal text-slate-400">{m.unit}</span></div>
                        {m.benchmark?.target && (
                          <div className="text-[10px] text-slate-400">Target: {m.benchmark.target}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Alerts */}
              {tplStage?.alerts && tplStage.alerts.length > 0 && isCurrent && (
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Records Tab ─────────────────────────────────────────────────────────────

function RecordsTab({ cycle }: { cycle: ProductionCycle }) {
  const allRecords = cycle.stages.flatMap(s =>
    s.dailyRecords.map(r => ({ ...r, stageName: s.name }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      {allRecords.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Activity className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No records yet.</p>
          <p className="text-xs mt-1">Use the "Log today" button to add daily measurements.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allRecords.slice(0, 30).map(record => (
            <div key={record.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-800">
                  {new Date(record.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
                <span className="text-xs text-slate-400">{record.stageName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(record.measurements).map(([key, val]) => (
                  <div key={key} className="bg-slate-50 rounded-lg p-2">
                    <div className="text-[10px] text-slate-400 capitalize">{key.replace(/_/g, ' ')}</div>
                    <div className="text-sm font-bold text-slate-800">{val}</div>
                  </div>
                ))}
              </div>
              {record.notes && <p className="text-xs text-slate-500 mt-2">{record.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Outputs Tab ─────────────────────────────────────────────────────────────

function OutputsTab({ cycle }: { cycle: ProductionCycle }) {
  const allOutputs = cycle.stages.flatMap(s =>
    s.events.flatMap(e => (e.outputs ?? []).map(o => ({ ...o, date: e.date, stageName: s.name })))
  );

  const routingColors: Record<string, string> = {
    sale: 'bg-green-100 text-green-700',
    inventory: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    incubation: 'bg-amber-100 text-amber-700',
    waste: 'bg-red-100 text-red-700',
    own_use: 'bg-slate-100 text-slate-600',
  };

  return (
    <div>
      {allOutputs.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <ArrowRight className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No outputs recorded yet.</p>
          <p className="text-xs mt-1">Outputs are recorded when you log harvest or sale events.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allOutputs.map(output => (
            <div key={output.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm text-slate-800">{output.materialName}</div>
                <div className="text-xs text-slate-500">{new Date(output.date).toLocaleDateString()} · {output.stageName}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">{output.quantity} {output.unit}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${routingColors[output.routing] ?? routingColors.inventory}`}>
                  → {output.routing}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section Label ───────────────────────────────────────────────────────────

function SectionLabel({ label, count, color }: { label: string; count: number; color: string }) {
  const colors: Record<string, string> = {
    green: 'text-green-600',
    blue:  'text-blue-600',
    slate: 'text-slate-400',
  };
  return (
    <div className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider ${colors[color] ?? colors.slate} flex items-center gap-2`}>
      {label}
      <span className="bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5 text-[10px]">{count}</span>
    </div>
  );
}

// ─── New Cycle Modal ──────────────────────────────────────────────────────────

function NewCycleModal({ enterprises, defaultEnterpriseId, onSave, onClose }: {
  enterprises: any[];
  defaultEnterpriseId?: string;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [enterpriseId, setEnterpriseId] = useState(defaultEnterpriseId ?? enterprises[0]?.id ?? '');
  const [name, setName]         = useState('');
  const [startDate, setStart]   = useState(new Date().toISOString().slice(0, 10));

  const selectedEnt = enterprises.find(e => e.id === enterpriseId);
  const template    = getTemplate(selectedEnt?.templateId ?? '');

  // Auto-generate cycle name
  React.useEffect(() => {
    if (selectedEnt && template) {
      const prefix = template.shortName;
      const date   = new Date().toISOString().slice(0, 7); // YYYY-MM
      setName(`${prefix} ${date}`);
    }
  }, [enterpriseId]);

  function save() {
    if (!enterpriseId || !name.trim()) return;
    onSave({
      enterpriseId,
      name: name.trim(),
      startDate,
      status: 'active' as const,
      currentStageId: '',
      productionUnits: [],
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Start New Cycle</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Enterprise selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Enterprise</label>
            <select
              value={enterpriseId}
              onChange={e => setEnterpriseId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {enterprises.map(e => {
                const tpl = getTemplate(e.templateId);
                return <option key={e.id} value={e.id}>{tpl?.icon} {e.name}</option>;
              })}
            </select>
          </div>

          {/* Template info */}
          {template && (
            <div className="bg-slate-50 rounded-xl p-3 text-sm">
              <div className="font-medium text-slate-800">{template.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">{template.stages.length} stages: {template.stages.map(s => s.name).join(' → ')}</div>
            </div>
          )}

          {/* Cycle name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cycle Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Broiler Aug 2026"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Start date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStart(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button
            onClick={save}
            disabled={!name.trim() || !enterpriseId}
            className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Start Cycle
          </button>
        </div>
      </div>
    </div>
  );
}
