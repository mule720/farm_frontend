// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Production Engine (full implementation)
// Handles: cycle management, daily records, events, stage advancement,
//          output routing, KPI tracking, and cycle completion.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo, useEffect } from 'react';
import { useOrg } from '@/store/orgStore';
import { getTemplate } from '@/lib/templates';
import { getEventTypesForCategory, type EventTypeConfig, type EventField } from '@/lib/events';
import {
  Plus, ChevronRight, Clock, CheckCircle2, Circle, AlertTriangle,
  Activity, BarChart3, Calendar, ArrowRight, X, ChevronDown,
  Package, Clipboard, ChevronUp, Flag, Trash2, Layers, Pencil,
} from 'lucide-react';
import {
  ProductionCycle, CycleStage, ProductionTemplate,
  MeasurementConfig, StageTemplate, TransferRecord,
  DailyRecord, ProductionEvent,
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
  const { org, cycles, addCycle, getCyclesForEnterprise, deleteCycle } = useOrg();
  const [showNewCycle, setShowNewCycle] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());

  // Listen for "Open Phase" button events fired from CycleDetail
  useEffect(() => {
    function handleSelectCycle(e: Event) {
      const cycleId = (e as CustomEvent<string>).detail;
      if (!cycleId) return;
      setSelectedCycleId(cycleId);
      // Auto-expand the program containing this cycle
      const targetCycle = cycles.find(c => c.id === cycleId);
      if (targetCycle?.programId) {
        setExpandedPrograms(prev => new Set([...prev, targetCycle.programId!]));
      }
    }
    document.addEventListener('agronexus:select-cycle', handleSelectCycle);
    return () => document.removeEventListener('agronexus:select-cycle', handleSelectCycle);
  }, [cycles]);

  if (!org) return null;

  const enterprises = org.enterprises.filter(e => e.active && (!enterpriseId || e.id === enterpriseId));
  const visibleCycles = enterpriseId ? getCyclesForEnterprise(enterpriseId) : cycles;

  const openCycles = visibleCycles.filter(c => c.status === 'active' || c.status === 'planning' || c.status === 'paused');
  const closedCycles = visibleCycles.filter(c => c.status === 'completed' || c.status === 'aborted');

  // ── Group cycles into programs + standalones ──────────────────────────────
  const programMap = new Map<string, { name: string; phases: ProductionCycle[] }>();
  const standaloneOpen: ProductionCycle[]   = [];
  const standaloneClosed: ProductionCycle[] = [];

  for (const c of visibleCycles) {
    if (c.programId) {
      const existing = programMap.get(c.programId);
      if (existing) {
        existing.phases.push(c);
      } else {
        programMap.set(c.programId, { name: c.programName ?? 'Production Program', phases: [c] });
      }
    } else {
      const isOpen = c.status === 'active' || c.status === 'planning' || c.status === 'paused';
      if (isOpen) standaloneOpen.push(c); else standaloneClosed.push(c);
    }
  }

  // Sort phases within each program by programPhase
  for (const prog of programMap.values()) {
    prog.phases.sort((a, b) => (a.programPhase ?? 99) - (b.programPhase ?? 99));
  }

  // Programs with at least one open phase → "open" programs; all-closed → "closed" programs
  const openPrograms: Array<{ id: string; name: string; phases: ProductionCycle[] }> = [];
  const closedPrograms: Array<{ id: string; name: string; phases: ProductionCycle[] }> = [];
  for (const [id, prog] of programMap.entries()) {
    const hasOpen = prog.phases.some(c => c.status === 'active' || c.status === 'planning' || c.status === 'paused');
    (hasOpen ? openPrograms : closedPrograms).push({ id, ...prog });
  }

  const openGrouped = {
    active:   standaloneOpen.filter(c => c.status === 'active'),
    planning: standaloneOpen.filter(c => c.status === 'planning'),
    paused:   standaloneOpen.filter(c => c.status === 'paused'),
  };

  const totalOpen   = openCycles.length;
  const totalClosed = closedCycles.length;

  function toggleProgram(id: string) {
    setExpandedPrograms(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const selectedCycle = selectedCycleId ? visibleCycles.find(c => c.id === selectedCycleId) : null;

  function handleDelete(cycleId: string) {
    deleteCycle(cycleId);
    if (selectedCycleId === cycleId) setSelectedCycleId(null);
    setConfirmDeleteId(null);
  }

  return (
    <div className="flex h-full">
      {/* ── Left panel — cycle list ──────────────────────────────────────── */}
      <div className={`${selectedCycle ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 border-r border-slate-200 bg-white`}>
        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-slate-900">Production Engine</h2>
            <p className="text-xs text-slate-500">
              {openCycles.length} open · {closedCycles.length} closed
            </p>
          </div>
          <button
            onClick={() => setShowNewCycle(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
          >
            <Plus className="w-3.5 h-3.5" /> New Cycle
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">

          {/* ── OPEN section header ── */}
          {(totalOpen > 0 || openPrograms.length > 0) && (
            <div className="px-2 py-1.5 text-[10px] font-bold text-green-700 uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
              Open — {totalOpen}
            </div>
          )}

          {/* ── Open Programs (grouped) ── */}
          {openPrograms.map(prog => (
            <ProgramCard
              key={prog.id}
              programId={prog.id}
              programName={prog.name}
              phases={prog.phases}
              org={org}
              expanded={expandedPrograms.has(prog.id)}
              onToggle={() => toggleProgram(prog.id)}
              selectedCycleId={selectedCycleId}
              onSelectCycle={id => setSelectedCycleId(id)}
              onDeleteCycle={id => setConfirmDeleteId(id)}
            />
          ))}

          {/* ── Standalone open cycles ── */}
          {openPrograms.length > 0 && standaloneOpen.length > 0 && (
            <MiniSectionLabel label="Individual Cycles" />
          )}
          {openGrouped.active.map(c => (
            <CycleRow key={c.id} cycle={c} org={org}
              selected={selectedCycleId === c.id}
              onClick={() => setSelectedCycleId(c.id)}
              onDelete={() => setConfirmDeleteId(c.id)}
            />
          ))}
          {openGrouped.planning.length > 0 && <MiniSectionLabel label="Planning" />}
          {openGrouped.planning.map(c => (
            <CycleRow key={c.id} cycle={c} org={org}
              selected={selectedCycleId === c.id}
              onClick={() => setSelectedCycleId(c.id)}
              onDelete={() => setConfirmDeleteId(c.id)}
            />
          ))}
          {openGrouped.paused.length > 0 && <MiniSectionLabel label="Paused" />}
          {openGrouped.paused.map(c => (
            <CycleRow key={c.id} cycle={c} org={org}
              selected={selectedCycleId === c.id}
              onClick={() => setSelectedCycleId(c.id)}
              onDelete={() => setConfirmDeleteId(c.id)}
            />
          ))}

          {/* ── DIVIDER ── */}
          {(totalOpen > 0 || openPrograms.length > 0) && (totalClosed > 0 || closedPrograms.length > 0) && (
            <div className="border-t border-slate-200 my-2" />
          )}

          {/* ── CLOSED toggle ── */}
          {(totalClosed > 0 || closedPrograms.length > 0) && (
            <button
              onClick={() => setShowClosed(s => !s)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600"
            >
              <span>Closed / Completed — {totalClosed}</span>
              {showClosed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
          {showClosed && closedPrograms.map(prog => (
            <ProgramCard
              key={prog.id}
              programId={prog.id}
              programName={prog.name}
              phases={prog.phases}
              org={org}
              expanded={expandedPrograms.has(prog.id)}
              onToggle={() => toggleProgram(prog.id)}
              selectedCycleId={selectedCycleId}
              onSelectCycle={id => setSelectedCycleId(id)}
              onDeleteCycle={id => setConfirmDeleteId(id)}
            />
          ))}
          {showClosed && standaloneClosed.map(c => (
            <CycleRow key={c.id} cycle={c} org={org}
              selected={selectedCycleId === c.id}
              onClick={() => setSelectedCycleId(c.id)}
              onDelete={() => setConfirmDeleteId(c.id)}
            />
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

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      {confirmDeleteId && (() => {
        const c = visibleCycles.find(x => x.id === confirmDeleteId);
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Delete cycle?</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    <span className="font-medium text-slate-700">"{c?.name}"</span> and all its daily records, events, and logs will be permanently removed. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="flex-1 py-2 bg-red-600 rounded-xl text-sm font-medium text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function MiniSectionLabel({ label }: { label: string }) {
  return <div className="px-2 pt-2 pb-0.5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">{label}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Program Card — groups all phases of one Production Program
// ─────────────────────────────────────────────────────────────────────────────
function ProgramCard({ programId, programName, phases, org, expanded, onToggle,
  selectedCycleId, onSelectCycle, onDeleteCycle }: {
  programId: string; programName: string; phases: ProductionCycle[];
  org: any; expanded: boolean; onToggle: () => void;
  selectedCycleId: string | null;
  onSelectCycle: (id: string) => void;
  onDeleteCycle: (id: string) => void;
}) {
  const activeCount    = phases.filter(c => c.status === 'active').length;
  const completedCount = phases.filter(c => c.status === 'completed').length;
  const anySelected    = phases.some(c => c.id === selectedCycleId);

  const dot: Record<string, string> = {
    active: 'bg-green-500', planning: 'bg-blue-400',
    completed: 'bg-slate-300', paused: 'bg-amber-400', aborted: 'bg-red-300',
  };

  return (
    <div className={`rounded-xl border transition-all mb-1 overflow-hidden ${
      anySelected ? 'border-green-200 bg-green-50/50' : 'border-slate-200 bg-white'
    }`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
      >
        <Layers className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-slate-800 truncate">{programName}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {phases.length} phases · {activeCount > 0 ? `${activeCount} active` : `${completedCount} completed`}
          </div>
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
      </button>

      {/* Phase list */}
      {expanded && (
        <div className="border-t border-slate-100">
          {phases.map((c, idx) => {
            const enterprise = org.enterprises.find((e: any) => e.id === c.enterpriseId);
            const template   = getTemplate(enterprise?.templateId ?? '');
            const isSelected = c.id === selectedCycleId;
            const isLast     = idx === phases.length - 1;
            return (
              <div
                key={c.id}
                className={`group relative flex items-center gap-2 px-3 py-2 transition-colors cursor-pointer ${
                  isSelected ? 'bg-green-100' : 'hover:bg-slate-50'
                } ${!isLast ? 'border-b border-slate-100' : ''}`}
                onClick={() => onSelectCycle(c.id)}
              >
                {/* Phase connector line */}
                <div className="flex flex-col items-center gap-0.5 flex-shrink-0 self-stretch">
                  <div className={`w-2 h-2 rounded-full mt-1 ${dot[c.status] ?? 'bg-slate-300'}`} />
                  {!isLast && <div className="w-px flex-1 bg-slate-200 mt-0.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-700 truncate">
                    {c.programPhaseLabel ?? `Phase ${idx + 1}`}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{template?.icon} {c.name}</div>
                </div>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  c.status === 'active'    ? 'bg-green-100 text-green-700' :
                  c.status === 'completed' ? 'bg-slate-100 text-slate-500' :
                  c.status === 'planning'  ? 'bg-blue-50 text-blue-600' :
                  'bg-amber-50 text-amber-600'
                }`}>{c.status}</span>
                {/* Trash */}
                <button
                  onClick={e => { e.stopPropagation(); onDeleteCycle(c.id); }}
                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-red-600 text-slate-400 p-0.5 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cycle Row (left panel)
// ─────────────────────────────────────────────────────────────────────────────
function CycleRow({ cycle, org, selected, onClick, onDelete }: {
  cycle: ProductionCycle; org: any; selected: boolean;
  onClick: () => void; onDelete: () => void;
}) {
  const enterprise  = org.enterprises.find((e: any) => e.id === cycle.enterpriseId);
  const template    = getTemplate(enterprise?.templateId ?? '');
  const currentStage = cycle.stages.find(s => s.id === cycle.currentStageId);
  const daysActive  = Math.floor((Date.now() - new Date(cycle.startDate).getTime()) / 86400000);
  const stagesDone  = cycle.stages.filter(s => s.status === 'completed').length;
  const pct         = cycle.stages.length ? Math.round((stagesDone / cycle.stages.length) * 100) : 0;
  const isOrphaned  = !enterprise;

  const dot: Record<string, string> = {
    active: 'bg-green-500', planning: 'bg-blue-500',
    completed: 'bg-slate-400', paused: 'bg-amber-500', aborted: 'bg-red-400',
  };

  return (
    <div className={`group relative rounded-xl transition-all border ${
      selected ? 'bg-green-50 border-green-200' : 'hover:bg-slate-50 border-transparent hover:border-slate-100'
    } ${isOrphaned ? 'border-amber-200 bg-amber-50/40' : ''}`}>
      <button onClick={onClick} className="w-full text-left p-3 pr-8">
        <div className="flex items-start gap-2.5">
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${isOrphaned ? 'bg-amber-400' : (dot[cycle.status] ?? dot.planning)}`} />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-slate-800 truncate">{cycle.name}</div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              {isOrphaned
                ? <span className="text-amber-600 text-[10px]">⚠ Enterprise removed</span>
                : <span>{template?.icon} {enterprise?.name}</span>
              }
              {cycle.status === 'active' && !isOrphaned && <span className="text-green-600">Day {daysActive}</span>}
              {cycle.status === 'completed' && <span className="text-slate-400">Closed</span>}
            </div>
            {currentStage && cycle.status === 'active' && (
              <>
                <div className="text-xs text-slate-400 mt-1 truncate">{currentStage.name}</div>
                <div className="h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </>
            )}
            {cycle.status === 'completed' && (
              <div className="h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-slate-300 rounded-full w-full" />
              </div>
            )}
          </div>
        </div>
      </button>

      {/* Delete button — visible on hover or when selected */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        title="Delete cycle"
        className={`absolute right-2 top-2.5 p-1 rounded-lg transition-all ${
          selected
            ? 'opacity-60 hover:opacity-100 hover:bg-red-100 hover:text-red-600 text-slate-400'
            : 'opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-red-100 hover:text-red-600 text-slate-400'
        }`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const { updateCycle, advanceStage, completeCycle, deleteCycle, cycles: allCycles } = useOrg();

  const currentStage   = cycle.stages.find(s => s.id === cycle.currentStageId);
  const currentTplStage = template?.stages.find(s => s.id === currentStage?.templateId);
  const currentIdx     = cycle.stages.findIndex(s => s.id === cycle.currentStageId);
  const hasNextStage   = currentIdx < cycle.stages.length - 1;
  const isLastStage    = currentIdx === cycle.stages.length - 1;
  const daysActive     = Math.floor((Date.now() - new Date(cycle.startDate).getTime()) / 86400000);
  const stagesDone     = cycle.stages.filter(s => s.status === 'completed').length;

  // ── Production Program: find sibling phases ────────────────────────────────
  const programPhases = cycle.programId
    ? allCycles
        .filter(c => c.programId === cycle.programId)
        .sort((a, b) => (a.programPhase ?? 99) - (b.programPhase ?? 99))
    : [];
  const thisPhaseIdx  = programPhases.findIndex(c => c.id === cycle.id);
  const nextPhase     = thisPhaseIdx >= 0 ? programPhases[thisPhaseIdx + 1] : undefined;
  const prevPhase     = thisPhaseIdx > 0  ? programPhases[thisPhaseIdx - 1] : undefined;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview',  label: 'Overview' },
    { id: 'stages',    label: 'Stages' },
    { id: 'daily-log', label: 'Daily Log' },
    { id: 'events',    label: 'Events' },
    { id: 'outputs',   label: 'Outputs' },
    ...(cycle.status === 'active' ? [{ id: 'close' as Tab, label: 'Close Cycle' }] : []),
  ];

  return (
    <div className="flex flex-col h-full relative">
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
            <button
              onClick={() => setConfirmDelete(true)}
              title="Delete cycle"
              className="p-1.5 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
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

        {/* ── Production Program Transfer banner ─────────────────────────── */}
        {cycle.programId && programPhases.length > 1 && (
          <div className="mt-3 p-2.5 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">{cycle.programName}</span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {programPhases.map((ph, i) => (
                <React.Fragment key={ph.id}>
                  <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                    ph.id === cycle.id
                      ? 'bg-purple-600 text-white'
                      : ph.status === 'completed'
                        ? 'bg-slate-100 text-slate-500 line-through'
                        : 'bg-white border border-purple-200 text-purple-600'
                  }`}>
                    <span>{ph.programPhaseLabel ?? `Phase ${i + 1}`}</span>
                  </div>
                  {i < programPhases.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-purple-300 flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {nextPhase && (
                <div className="flex-1 text-[10px] text-purple-700 min-w-0">
                  Next: <strong>{nextPhase.programPhaseLabel ?? `Phase ${thisPhaseIdx + 2}`}</strong>
                  {nextPhase.status === 'planning' && ' — planning'}
                </div>
              )}
              {!nextPhase && (
                <div className="flex-1 text-[10px] text-purple-500 italic">Final phase of the program</div>
              )}
              <button
                onClick={() => setShowTransfer(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-semibold hover:bg-purple-700 flex-shrink-0"
              >
                <ArrowRight className="w-3 h-3" /> Transfer Output
              </button>
              {nextPhase && (
                <button
                  onClick={() => {
                    const ev = new CustomEvent('agronexus:select-cycle', { detail: nextPhase.id, bubbles: true });
                    document.dispatchEvent(ev);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 border border-purple-300 text-purple-700 rounded-lg text-[10px] font-medium hover:bg-purple-50 flex-shrink-0"
                >
                  Open Phase →
                </button>
              )}
            </div>
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
        {tab === 'daily-log' && <DailyLogTab  cycle={cycle} template={template} currentStage={currentStage} />}
        {tab === 'events'    && <EventsTab    cycle={cycle} template={template} currentStage={currentStage} />}
        {tab === 'outputs'   && <OutputsTab   cycle={cycle} />}
        {tab === 'close'     && <CloseCycleTab cycle={cycle} template={template} onComplete={(date, notes) => completeCycle(cycle.id, date, notes)} />}
      </div>

      {/* Transfer Output Modal */}
      {showTransfer && (
        <TransferOutputModal
          sourceCycle={cycle}
          org={org}
          programPhases={programPhases}
          onClose={() => setShowTransfer(false)}
          onTransferComplete={(newCycleId) => {
            setShowTransfer(false);
            if (newCycleId) {
              // jump to the newly created cycle
              const ev = new CustomEvent('agronexus:select-cycle', { detail: newCycleId, bubbles: true });
              document.dispatchEvent(ev);
            }
          }}
        />
      )}

      {/* Delete confirmation overlay */}
      {confirmDelete && (
        <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Delete this cycle?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  All daily records, events, and logs for <span className="font-medium text-slate-700">"{cycle.name}"</span> will be permanently removed.
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { deleteCycle(cycle.id); onClose(); }}
                className="flex-1 py-2.5 bg-red-600 rounded-xl text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
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
// CATEGORY_DAILY_FIELDS — what to log every day, per enterprise category.
// visibleFor: array of variantIds where field appears; undefined = always show.
// type: 'number' | 'select' | 'text' | 'computed'
// computed fields are auto-derived from other numeric fields (listed in computedFrom[])
// ─────────────────────────────────────────────────────────────────────────────

interface DailyField {
  id: string;
  label: string;
  type: 'number' | 'select' | 'text' | 'computed';
  unit?: string;
  required?: boolean;
  options?: string[];
  benchmark?: { min?: number; max?: number; target?: number };
  hint?: string;
  visibleFor?: string[];       // variant IDs; undefined = always visible
  computedFrom?: string[];     // field IDs to sum for computed type
  goodDirection?: 'up' | 'down';
}

// Helper: infer variantId from cycle when it wasn't stored
function inferVariant(cycle: ProductionCycle, category: string): string {
  if (cycle.variantId) return cycle.variantId;
  if (category === 'poultry') {
    const hasEggUnit = cycle.productionUnits.some(u => u.unit === 'eggs');
    if (hasEggUnit) return 'incubation';
    const hasEggRouting = cycle.notes?.toLowerCase().includes('egg');
    return hasEggRouting ? 'layer_from_pol' : 'broiler_grow_out';
  }
  return '__default__';
}

const CATEGORY_DAILY_FIELDS: Record<string, DailyField[]> = {

  // ── POULTRY ────────────────────────────────────────────────────────────────
  poultry: [
    // Layer / breeder fields
    { id: 'eggs_collected',  label: 'Eggs Collected',      type: 'number', unit: 'eggs',  required: true,
      goodDirection: 'up',
      visibleFor: ['layer_from_chicks','layer_from_pol','layer_continuing','breeder_flock','quail_cycle','duck_cycle'] },
    { id: 'cracked_eggs',    label: 'Cracked / Broken',    type: 'number', unit: 'eggs',
      visibleFor: ['layer_from_chicks','layer_from_pol','layer_continuing','breeder_flock','quail_cycle','duck_cycle'] },
    { id: 'egg_trays',       label: 'Trays Collected',     type: 'number', unit: 'trays',
      hint: '30 eggs per tray',
      visibleFor: ['layer_from_chicks','layer_from_pol','layer_continuing','breeder_flock'] },
    { id: 'eggs_to_incubation', label: 'Eggs Set for Incubation', type: 'number', unit: 'eggs',
      hint: 'Fertile eggs transferred to setter today',
      visibleFor: ['breeder_flock'] },

    // Incubation fields
    { id: 'setter_temp',     label: 'Setter Temperature',  type: 'number', unit: '°C',    required: true,
      benchmark: { min: 37.2, max: 37.8, target: 37.5 }, goodDirection: 'neutral',
      visibleFor: ['incubation'] },
    { id: 'setter_humidity', label: 'Setter Humidity',     type: 'number', unit: '%RH',   required: true,
      benchmark: { min: 55, max: 65, target: 60 }, goodDirection: 'neutral',
      visibleFor: ['incubation'] },
    { id: 'hatcher_temp',    label: 'Hatcher Temperature', type: 'number', unit: '°C',
      benchmark: { min: 36.9, max: 37.2, target: 37.0 }, goodDirection: 'neutral',
      visibleFor: ['incubation'] },
    { id: 'hatcher_humidity',label: 'Hatcher Humidity',    type: 'number', unit: '%RH',
      benchmark: { min: 70, max: 80, target: 75 }, goodDirection: 'neutral',
      visibleFor: ['incubation'] },
    { id: 'turner_status',   label: 'Turner / Auto-Turn',  type: 'select',
      options: ['Running OK','Manual turn done','Off — check immediately'],
      visibleFor: ['incubation'] },
    { id: 'candle_rejects',  label: 'Candle Rejects Removed', type: 'number', unit: 'eggs',
      hint: 'Infertile / dead eggs removed after candling',
      visibleFor: ['incubation'] },
    { id: 'chicks_hatched',  label: 'Chicks Hatched',      type: 'number', unit: 'chicks',
      goodDirection: 'up', visibleFor: ['incubation'] },
    { id: 'chicks_culled',   label: 'Chicks Culled / Weak',type: 'number', unit: 'chicks',
      goodDirection: 'down', visibleFor: ['incubation'] },

    // Universal poultry — all except incubation
    { id: 'feed_kg',         label: 'Feed Consumed',       type: 'number', unit: 'kg',    required: true,
      goodDirection: 'neutral',
      visibleFor: ['broiler_grow_out','layer_from_chicks','layer_from_pol','layer_continuing',
                   'breeder_flock','turkey_grow_out','duck_cycle','quail_cycle'] },
    { id: 'water_litres',    label: 'Water Consumed',      type: 'number', unit: 'L',
      visibleFor: ['broiler_grow_out','layer_from_chicks','layer_from_pol','layer_continuing',
                   'breeder_flock','turkey_grow_out','duck_cycle','quail_cycle'] },
    { id: 'mortality_count', label: 'Mortality Count',     type: 'number', unit: 'birds', goodDirection: 'down',
      visibleFor: ['broiler_grow_out','layer_from_chicks','layer_from_pol','layer_continuing',
                   'breeder_flock','turkey_grow_out','duck_cycle','quail_cycle'] },
    { id: 'mortality_reason',label: 'Mortality Reason',    type: 'select',
      options: ['Unknown','Disease','Injury','Predator','Heat stress','Cold stress','Culled','Other'],
      visibleFor: ['broiler_grow_out','layer_from_chicks','layer_from_pol','layer_continuing',
                   'breeder_flock','turkey_grow_out','duck_cycle','quail_cycle'] },
    { id: 'avg_body_weight', label: 'Avg Body Weight Sample', type: 'number', unit: 'g',
      hint: 'Sample 10–20 birds and enter average',
      visibleFor: ['broiler_grow_out','layer_from_chicks','turkey_grow_out','duck_cycle','quail_cycle'] },
    { id: 'litter_condition',label: 'Litter Condition',    type: 'select',
      options: ['Dry & crumbly (excellent)','Slightly damp (acceptable)','Wet / caked (action needed)','Very wet (critical)'],
      visibleFor: ['broiler_grow_out','turkey_grow_out'] },
    { id: 'house_temp',      label: 'House Temperature',   type: 'number', unit: '°C',
      benchmark: { min: 18, max: 32 }, goodDirection: 'neutral',
      visibleFor: ['broiler_grow_out','layer_from_chicks','layer_from_pol','layer_continuing',
                   'breeder_flock','turkey_grow_out','duck_cycle','quail_cycle'] },
    { id: 'live_bird_count', label: 'Live Bird Count',     type: 'number', unit: 'birds',
      hint: 'Current total — subtract mortalities daily',
      visibleFor: ['broiler_grow_out','layer_from_chicks','layer_from_pol','layer_continuing',
                   'breeder_flock','turkey_grow_out','duck_cycle','quail_cycle'] },
  ],

  // ── LIVESTOCK ──────────────────────────────────────────────────────────────
  livestock: [
    { id: 'milk_morning',    label: 'Morning Milk',        type: 'number', unit: 'L',     required: true, goodDirection: 'up' },
    { id: 'milk_afternoon',  label: 'Afternoon Milk',      type: 'number', unit: 'L',                    goodDirection: 'up' },
    { id: 'milk_evening',    label: 'Evening Milk',        type: 'number', unit: 'L',                    goodDirection: 'up' },
    { id: 'milk_total',      label: 'Total Milk Yield',    type: 'computed', unit: 'L',
      computedFrom: ['milk_morning','milk_afternoon','milk_evening'], goodDirection: 'up' },
    { id: 'milking_animals', label: 'Animals Milked',      type: 'number', unit: 'head' },
    { id: 'concentrate_kg',  label: 'Concentrate Feed',    type: 'number', unit: 'kg' },
    { id: 'fodder_kg',       label: 'Fodder / Roughage',   type: 'number', unit: 'kg' },
    { id: 'water_litres',    label: 'Water Consumed',      type: 'number', unit: 'L' },
    { id: 'mortality_count', label: 'Deaths / Culls',      type: 'number', unit: 'head',  goodDirection: 'down' },
    { id: 'calvings',        label: 'Births / Calvings',   type: 'number', unit: 'head',  goodDirection: 'up' },
    { id: 'health_flag',     label: 'Health Status',       type: 'select',
      options: ['All healthy','Monitor 1–2 animals','Sick animal(s) — see notes','Emergency — vet called'] },
    { id: 'avg_body_weight', label: 'Avg Body Weight Sample', type: 'number', unit: 'kg',
      hint: 'Weigh 3–5 animals and average' },
  ],

  // ── AQUACULTURE ────────────────────────────────────────────────────────────
  aquaculture: [
    { id: 'feed_kg',         label: 'Feed Given',          type: 'number', unit: 'kg',    required: true, goodDirection: 'neutral' },
    { id: 'water_temp',      label: 'Water Temperature',   type: 'number', unit: '°C',    required: true,
      benchmark: { min: 25, max: 32, target: 28 }, goodDirection: 'neutral' },
    { id: 'dissolved_o2',    label: 'Dissolved Oxygen',    type: 'number', unit: 'mg/L',  required: true,
      benchmark: { min: 5, max: 10, target: 7 }, goodDirection: 'up' },
    { id: 'ph',              label: 'pH Level',            type: 'number', unit: 'pH',
      benchmark: { min: 6.5, max: 8.5, target: 7.5 }, goodDirection: 'neutral' },
    { id: 'ammonia',         label: 'Ammonia (NH₃)',       type: 'number', unit: 'mg/L',
      benchmark: { max: 0.02 }, goodDirection: 'down' },
    { id: 'turbidity',       label: 'Turbidity / Secchi',  type: 'number', unit: 'cm' },
    { id: 'mortality_count', label: 'Mortality Count',     type: 'number', unit: 'fish',  goodDirection: 'down' },
    { id: 'water_change_pct',label: 'Water Change',        type: 'number', unit: '%' },
    { id: 'avg_weight_g',    label: 'Avg Weight Sample',   type: 'number', unit: 'g',
      hint: 'Weigh 10–20 fish from a single pond/tank', goodDirection: 'up' },
    { id: 'feeding_response',label: 'Feeding Response',    type: 'select',
      options: ['Vigorous — all food consumed','Good — consumed within 30min','Poor — leftover feed','Very poor — not feeding'] },
  ],

  // ── CROPS ──────────────────────────────────────────────────────────────────
  crops: [
    { id: 'irrigation_mm',   label: 'Irrigation Applied',  type: 'number', unit: 'mm' },
    { id: 'fertilizer_kg',   label: 'Fertilizer Applied',  type: 'number', unit: 'kg/ha' },
    { id: 'pest_pressure',   label: 'Pest Pressure',       type: 'select',
      options: ['None observed','Low — monitor','Moderate — spray threshold','High — immediate action'] },
    { id: 'disease_pressure',label: 'Disease Pressure',    type: 'select',
      options: ['None observed','Low — monitor','Moderate — treat','High — severe'] },
    { id: 'growth_stage',    label: 'Growth Stage',        type: 'select',
      options: ['Germination','Seedling','Vegetative','Flowering','Grain fill','Maturity','Harvest ready'] },
    { id: 'harvest_kg',      label: 'Harvest Collected',   type: 'number', unit: 'kg',  goodDirection: 'up' },
    { id: 'spray_product',   label: 'Spray Applied',       type: 'text',   hint: 'Product name + rate' },
    { id: 'rain_mm',         label: 'Rainfall',            type: 'number', unit: 'mm' },
  ],

  // ── HORTICULTURE ───────────────────────────────────────────────────────────
  horticulture: [
    { id: 'harvest_kg',      label: 'Harvest Weight',      type: 'number', unit: 'kg',    required: true, goodDirection: 'up' },
    { id: 'harvest_units',   label: 'Units Harvested',     type: 'number', unit: 'units', goodDirection: 'up' },
    { id: 'grade_a_kg',      label: 'Grade A',             type: 'number', unit: 'kg',    goodDirection: 'up' },
    { id: 'grade_b_kg',      label: 'Grade B / Seconds',   type: 'number', unit: 'kg' },
    { id: 'rejects_kg',      label: 'Rejects / Waste',     type: 'number', unit: 'kg',    goodDirection: 'down' },
    { id: 'irrigation_mm',   label: 'Irrigation Applied',  type: 'number', unit: 'mm' },
    { id: 'pest_disease',    label: 'Pest / Disease Flag',  type: 'select',
      options: ['None','Aphids','Spider mite','Whitefly','Botrytis','Downy mildew','Other — see notes'] },
    { id: 'plant_health',    label: 'Plant Health',        type: 'select',
      options: ['Excellent','Good','Fair — monitor','Concern — action needed'] },
  ],

  // ── GREENHOUSE ─────────────────────────────────────────────────────────────
  greenhouse: [
    { id: 'ec',              label: 'Nutrient Solution EC', type: 'number', unit: 'mS/cm', required: true,
      benchmark: { min: 1.2, max: 2.5, target: 1.8 }, goodDirection: 'neutral' },
    { id: 'ph',              label: 'Nutrient Solution pH', type: 'number', unit: 'pH',    required: true,
      benchmark: { min: 5.5, max: 6.5, target: 6.0 }, goodDirection: 'neutral' },
    { id: 'air_temp',        label: 'Air Temperature',     type: 'number', unit: '°C',
      benchmark: { min: 18, max: 28 }, goodDirection: 'neutral' },
    { id: 'humidity',        label: 'Humidity',            type: 'number', unit: '%',
      benchmark: { min: 60, max: 80 }, goodDirection: 'neutral' },
    { id: 'nutrient_topup_l',label: 'Nutrient Top-Up',     type: 'number', unit: 'L' },
    { id: 'harvest_kg',      label: 'Harvest Weight',      type: 'number', unit: 'kg',    goodDirection: 'up' },
    { id: 'harvest_units',   label: 'Plants Harvested',    type: 'number', unit: 'plants',goodDirection: 'up' },
    { id: 'plant_health',    label: 'Plant Health',        type: 'select',
      options: ['Excellent','Good','Yellowing — check nutrients','Wilting — check roots','Disease spotted'] },
    { id: 'pest_flag',       label: 'Pest Observation',    type: 'select',
      options: ['None','Aphids','Spider mite','Fungus gnats','Thrips','Other'] },
  ],

  // ── ORCHARD ────────────────────────────────────────────────────────────────
  orchard: [
    { id: 'irrigation_hours',label: 'Irrigation Duration', type: 'number', unit: 'hours' },
    { id: 'irrigation_mm',   label: 'Irrigation Amount',   type: 'number', unit: 'mm' },
    { id: 'spray_product',   label: 'Spray Applied',       type: 'text',   hint: 'Product, concentration, and target (fungicide / insecticide / foliar)' },
    { id: 'pest_pressure',   label: 'Pest / Disease Scouting', type: 'select',
      options: ['None detected','Low — continue monitoring','Moderate — schedule spray','High — immediate action'] },
    { id: 'fruit_thinned',   label: 'Fruit Thinned',       type: 'number', unit: 'fruits',
      hint: 'Hand-thinning count to improve sizing' },
    { id: 'harvest_kg',      label: 'Harvest Collected',   type: 'number', unit: 'kg',    goodDirection: 'up' },
    { id: 'fruit_grade_a_kg',label: 'Grade A Fruit',       type: 'number', unit: 'kg',    goodDirection: 'up' },
    { id: 'fruit_rejects_kg',label: 'Rejects / Drops',     type: 'number', unit: 'kg',    goodDirection: 'down' },
    { id: 'tree_health',     label: 'Tree Health Status',  type: 'select',
      options: ['All healthy','Minor yellowing — monitor','Suspected disease — isolate','Confirmed disease — action'] },
    { id: 'rain_mm',         label: 'Rainfall',            type: 'number', unit: 'mm' },
  ],

  // ── APIARY ─────────────────────────────────────────────────────────────────
  apiary: [
    { id: 'hives_inspected', label: 'Hives Inspected',     type: 'number', unit: 'hives' },
    { id: 'hive_status',     label: 'General Hive Status', type: 'select',
      options: ['All healthy & queenright','1–2 hives weak — monitor','Queenless hive detected','Swarming activity','Disease signs (varroa/EFB/AFB)'] },
    { id: 'honey_super_kg',  label: 'Honey Super Weight',  type: 'number', unit: 'kg',    goodDirection: 'up',
      hint: 'Total weight of honey supers across all hives' },
    { id: 'honey_harvested_kg', label: 'Honey Harvested',  type: 'number', unit: 'kg',    goodDirection: 'up' },
    { id: 'mite_count',      label: 'Varroa Mite Count',   type: 'number', unit: 'mites/100 bees',
      benchmark: { max: 3 }, goodDirection: 'down' },
    { id: 'treatment',       label: 'Treatment Applied',   type: 'text',   hint: 'Product name + dose (oxalic, formic, etc.)' },
    { id: 'feed_syrup_l',    label: 'Syrup Fed',           type: 'number', unit: 'L' },
  ],

  // ── MUSHROOM ───────────────────────────────────────────────────────────────
  mushroom: [
    { id: 'air_temp',        label: 'Air Temperature',     type: 'number', unit: '°C',
      benchmark: { min: 16, max: 24, target: 20 }, goodDirection: 'neutral' },
    { id: 'humidity',        label: 'Humidity',            type: 'number', unit: '%',
      benchmark: { min: 80, max: 95, target: 90 }, goodDirection: 'neutral' },
    { id: 'co2_ppm',         label: 'CO₂ Level',           type: 'number', unit: 'ppm',
      benchmark: { max: 1000 }, goodDirection: 'down' },
    { id: 'pinning_count',   label: 'Pinning Count',       type: 'number', unit: 'fruiting bodies', goodDirection: 'up' },
    { id: 'harvest_kg',      label: 'Harvest Weight',      type: 'number', unit: 'kg',    goodDirection: 'up' },
    { id: 'substrate_moisture', label: 'Substrate Moisture', type: 'select',
      options: ['Optimal (60–70%)','Too dry — mist','Too wet — air out','Contamination visible'] },
    { id: 'contamination',   label: 'Contamination',       type: 'select',
      options: ['None','Slight — isolated','Moderate — quarantine block','Severe — dispose'] },
    { id: 'misting_done',    label: 'Misting Done',        type: 'select',  options: ['Yes','No','Partial'] },
  ],

  // ── PROCESSING ─────────────────────────────────────────────────────────────
  processing: [
    { id: 'input_kg',        label: 'Raw Input Received',  type: 'number', unit: 'kg',    required: true },
    { id: 'output_kg',       label: 'Finished Output',     type: 'number', unit: 'kg',    required: true, goodDirection: 'up' },
    { id: 'waste_kg',        label: 'Waste / Loss',        type: 'number', unit: 'kg',    goodDirection: 'down' },
    { id: 'yield_pct',       label: 'Processing Yield',    type: 'computed', unit: '%',
      computedFrom: ['output_kg','input_kg'], goodDirection: 'up',
      hint: 'Auto-calculated: output ÷ input × 100' },
    { id: 'batches',         label: 'Batches Processed',   type: 'number', unit: 'batches' },
    { id: 'downtime_hours',  label: 'Downtime',            type: 'number', unit: 'hours',  goodDirection: 'down' },
    { id: 'quality_pass',    label: 'Quality Check Result',type: 'select',
      options: ['Pass — all within spec','Minor deviation — acceptable','Fail — hold batch','Critical failure — destroy'] },
  ],

  // ── SERVICES ───────────────────────────────────────────────────────────────
  services: [
    { id: 'clients_served',  label: 'Clients Served',      type: 'number', unit: 'clients', goodDirection: 'up' },
    { id: 'hours_worked',    label: 'Hours Worked',        type: 'number', unit: 'hours' },
    { id: 'revenue_today',   label: 'Revenue Collected',   type: 'number', unit: 'currency', goodDirection: 'up' },
    { id: 'pending_invoices',label: 'Pending Invoices',    type: 'number', unit: 'invoices', goodDirection: 'down' },
    { id: 'service_type',    label: 'Service Type',        type: 'select',
      options: ['Consultation','Field visit','Training','Lab test','Advisory call','Other'] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Daily Log Tab — fully category-aware daily record entry
// ─────────────────────────────────────────────────────────────────────────────
function DailyLogTab({ cycle, template, currentStage }: {
  cycle: ProductionCycle;
  template: ProductionTemplate | undefined;
  currentStage: CycleStage | undefined;
  currentTplStage?: StageTemplate | undefined;
}) {
  const { addDailyRecord } = useOrg();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate]       = useState(today);
  const [values, setValues]   = useState<Record<string, string>>({});
  const [notes, setNotes]     = useState('');
  const [saved, setSaved]     = useState(false);
  const [stageId, setStageId] = useState(currentStage?.id ?? cycle.stages[0]?.id ?? '');

  // If the enterprise no longer exists in the org, template will be undefined.
  // Guard here so we never show wrong-category fields.
  const enterpriseMissing = !template;

  const category = template?.category ?? null;
  const variantId = category ? inferVariant(cycle, category) : '';
  const allFields = category ? (CATEGORY_DAILY_FIELDS[category] ?? []) : [];

  // Filter by variant: show field if no visibleFor restriction, or variant is in the list
  const fields = allFields.filter(f =>
    !f.visibleFor || f.visibleFor.includes(variantId)
  );

  // Auto-compute derived fields whenever source fields change
  function handleChange(id: string, val: string) {
    setValues(prev => {
      const next = { ...prev, [id]: val };
      // Re-compute any computed fields that depend on this field
      fields.forEach(f => {
        if (f.type !== 'computed' || !f.computedFrom) return;
        const all = f.computedFrom.every(src => next[src] !== undefined && next[src] !== '');
        if (!all) return;
        if (f.id === 'milk_total') {
          const sum = f.computedFrom.reduce((s, src) => s + (parseFloat(next[src] ?? '0') || 0), 0);
          next[f.id] = sum.toFixed(1);
        } else if (f.id === 'yield_pct') {
          const out = parseFloat(next['output_kg'] ?? '0') || 0;
          const inp = parseFloat(next['input_kg'] ?? '0') || 1;
          next[f.id] = ((out / inp) * 100).toFixed(1);
        }
      });
      return next;
    });
  }

  function submit() {
    if (!stageId) return;
    const measurements: Record<string, number> = {};
    const data: Record<string, string> = {};
    fields.forEach(f => {
      const v = values[f.id];
      if (!v || v === '') return;
      if (f.type === 'number' || f.type === 'computed') {
        const n = parseFloat(v);
        if (!isNaN(n)) measurements[f.id] = n;
      } else {
        data[f.id] = v;
      }
    });
    addDailyRecord(cycle.id, stageId, {
      date,
      measurements,
      data: Object.keys(data).length ? data : undefined,
      notes: notes || undefined,
      recordedBy: 'user',
    });
    setValues({});
    setNotes('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const selectedStage = cycle.stages.find(s => s.id === stageId);
  const allStages = cycle.stages.filter(s => s.status !== 'pending');
  // All records for this stage, newest first
  const recentRecords = (selectedStage?.dailyRecords ?? [])
    .slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);

  if (enterpriseMissing) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="text-4xl">⚠️</div>
        <p className="text-sm font-semibold text-slate-700">Enterprise no longer found</p>
        <p className="text-xs text-slate-400 max-w-xs">
          The enterprise this cycle was linked to has been removed from your workspace.
          Daily log fields cannot be shown because the production category is unknown.
          Historical records are preserved in storage.
        </p>
        {(cycle.stages.flatMap(s => s.dailyRecords).length > 0) && (
          <div className="mt-2 w-full max-w-sm">
            <RecordsHistory records={cycle.stages.flatMap(s => s.dailyRecords).sort((a,b) => b.date.localeCompare(a.date)).slice(0,5)} fields={[]} cycleId={cycle.id} />
          </div>
        )}
      </div>
    );
  }

  if (cycle.status === 'completed') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-400 text-center py-8">Cycle complete — viewing historical records only.</p>
        {recentRecords.length > 0 && <RecordsHistory records={recentRecords} fields={fields} cycleId={cycle.id} stageId={selectedStage?.id} />}
      </div>
    );
  }

  const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';

  // Split into required/key fields and optional fields for layout
  const requiredFields = fields.filter(f => f.required && f.type !== 'computed');
  const computedFields = fields.filter(f => f.type === 'computed');
  const selectFields   = fields.filter(f => f.type === 'select');
  const optionalNumber = fields.filter(f => f.type === 'number' && !f.required);
  const textFields     = fields.filter(f => f.type === 'text');

  return (
    <div className="space-y-5">
      {/* Stage + date row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Stage</label>
          <select value={stageId} onChange={e => setStageId(e.target.value)} className={inputCls}>
            {allStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Key / required numeric fields */}
      {requiredFields.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Key Measurements *</h3>
          <div className="grid grid-cols-2 gap-3">
            {requiredFields.map(f => (
              <NumericField key={f.id} field={f} value={values[f.id] ?? ''} onChange={v => handleChange(f.id, v)} />
            ))}
          </div>
        </div>
      )}

      {/* Computed / auto-derived */}
      {computedFields.length > 0 && computedFields.some(f => values[f.id]) && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <h3 className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">Auto-Calculated</h3>
          <div className="grid grid-cols-2 gap-3">
            {computedFields.filter(f => values[f.id]).map(f => (
              <div key={f.id} className="bg-white rounded-lg p-3">
                <div className="text-xs text-slate-500">{f.label}</div>
                <div className="text-xl font-bold text-green-700">{values[f.id]} <span className="text-xs font-normal text-slate-400">{f.unit}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status / select fields */}
      {selectFields.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status & Condition</h3>
          {selectFields.map(f => (
            <div key={f.id}>
              <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
              <select value={values[f.id] ?? ''} onChange={e => handleChange(f.id, e.target.value)} className={inputCls}>
                <option value="">— select —</option>
                {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Optional numeric fields */}
      {optionalNumber.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Additional Measurements</h3>
          <div className="grid grid-cols-2 gap-3">
            {optionalNumber.map(f => (
              <NumericField key={f.id} field={f} value={values[f.id] ?? ''} onChange={v => handleChange(f.id, v)} />
            ))}
          </div>
        </div>
      )}

      {/* Text fields */}
      {textFields.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Activity Log</h3>
          {textFields.map(f => (
            <div key={f.id}>
              <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}{f.hint && <span className="text-slate-400 ml-1">· {f.hint}</span>}</label>
              <input type="text" value={values[f.id] ?? ''} onChange={e => handleChange(f.id, e.target.value)}
                placeholder={f.hint ?? ''} className={inputCls} />
            </div>
          ))}
        </div>
      )}

      {/* Notes + Save */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <label className="block text-xs font-medium text-slate-600">Notes / Observations</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          placeholder="Any observations, incidents, or tasks completed today…"
          className={`${inputCls} resize-none`} />
        <button onClick={submit}
          disabled={fields.length === 0}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            saved ? 'bg-green-100 text-green-700' : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-40'
          }`}>
          {saved ? '✓ Record saved!' : '📝 Save Daily Record'}
        </button>
      </div>

      {/* History */}
      {recentRecords.length > 0 && <RecordsHistory records={recentRecords} fields={fields} cycleId={cycle.id} stageId={stageId} />}
    </div>
  );
}

// ── Numeric Field sub-component ───────────────────────────────────────────────
function NumericField({ field, value, onChange }: { field: DailyField; value: string; onChange: (v: string) => void }) {
  const hasVal = value !== '';
  const numVal = hasVal ? parseFloat(value) : NaN;
  let inRange: boolean | null = null;
  if (field.benchmark && hasVal && !isNaN(numVal)) {
    const { min, max } = field.benchmark;
    inRange = (min === undefined || numVal >= min) && (max === undefined || numVal <= max);
  }

  return (
    <div>
      <label className="block text-xs text-slate-600 mb-1 leading-tight">
        {field.label}
        {field.required && <span className="text-red-400 ml-0.5">*</span>}
        {field.benchmark?.target !== undefined && (
          <span className="text-slate-400 ml-1">· target {field.benchmark.target}</span>
        )}
      </label>
      <div className="flex items-center gap-1.5">
        <input
          type="number" step="any" value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="—"
          className={`flex-1 border rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
            inRange === false ? 'border-red-300 bg-red-50' :
            inRange === true  ? 'border-green-300' : 'border-slate-300'
          }`}
        />
        {field.unit && <span className="text-xs text-slate-400 flex-shrink-0 w-12 text-right">{field.unit}</span>}
      </div>
      {field.hint && <p className="text-[10px] text-slate-400 mt-0.5">{field.hint}</p>}
      {inRange === false && field.benchmark && (
        <p className="text-[10px] text-red-500 mt-0.5">
          ⚠ {field.benchmark.min !== undefined && numVal < field.benchmark.min ? `Below min (${field.benchmark.min})` : `Above max (${field.benchmark.max})`}
        </p>
      )}
    </div>
  );
}

// ── Edit Record Modal ──────────────────────────────────────────────────────────
function EditRecordModal({ record, cycleId, stageId, onClose }: {
  record: DailyRecord;
  cycleId: string;
  stageId: string;
  onClose: () => void;
}) {
  const { submitEdit, org } = useOrg();
  const approvalOn = org?.editApproval?.enabled ?? false;
  const userName   = org?.editApproval?.currentUserName ?? 'Staff';

  // Editable copies of measurements and notes
  const [measurements, setMeasurements] = useState<Record<string, number>>(
    Object.fromEntries(Object.entries(record.measurements))
  );
  const [notes, setNotes] = useState(record.notes ?? '');
  const [reason, setReason] = useState('');
  const requireReason = org?.editApproval?.requireReason ?? false;

  function save() {
    const patch: Partial<DailyRecord> = { measurements, notes: notes || undefined };
    const payload = JSON.stringify({
      action: 'update_record',
      cycleId,
      stageId,
      entityId: record.id,
      patch,
    });
    submitEdit({
      entityType: 'daily_record',
      entityId: record.id,
      cycleId,
      stageId,
      entityLabel: `Daily Record ${record.date}`,
      fieldLabel: 'measurements & notes',
      oldValueDisplay: JSON.stringify(record.measurements),
      newValueDisplay: JSON.stringify(measurements),
      applyPayload: payload,
      reason: reason || undefined,
      requestedBy: userName,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-slate-800">Edit Record — {record.date}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X size={16}/></button>
        </div>
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {Object.entries(measurements).map(([key, val]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-600 mb-1">{key.replace(/_/g, ' ')}</label>
              <input
                type="number"
                value={val}
                onChange={e => setMeasurements(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>
          {(approvalOn || requireReason) && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Reason for edit {requireReason && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Why is this being changed?"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}
          {approvalOn && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
              ⏳ This edit will be sent for approval before applying.
            </p>
          )}
        </div>
        <div className="flex gap-2 p-4 border-t">
          <button onClick={onClose} className="flex-1 border border-slate-300 rounded-lg py-2 text-sm hover:bg-slate-50">Cancel</button>
          <button
            onClick={save}
            disabled={requireReason && !reason}
            className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm hover:bg-green-700 disabled:opacity-40"
          >
            {approvalOn ? 'Submit for Approval' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Event Modal ───────────────────────────────────────────────────────────
function EditEventModal({ event, cycleId, stageId, onClose }: {
  event: ProductionEvent;
  cycleId: string;
  stageId: string;
  onClose: () => void;
}) {
  const { submitEdit, org } = useOrg();
  const approvalOn  = org?.editApproval?.enabled ?? false;
  const userName    = org?.editApproval?.currentUserName ?? 'Staff';
  const requireReason = org?.editApproval?.requireReason ?? false;

  const [date, setDate]         = useState(event.date as string);
  const [desc, setDesc]         = useState(event.description ?? '');
  const [reason, setReason]     = useState('');

  function save() {
    const patch: Partial<ProductionEvent> = { date, description: desc };
    const payload = JSON.stringify({
      action: 'update_event',
      cycleId,
      stageId,
      entityId: event.id,
      patch,
    });
    submitEdit({
      entityType: 'event',
      entityId: event.id,
      cycleId,
      stageId,
      entityLabel: `Event — ${event.type}`,
      fieldLabel: 'date & description',
      oldValueDisplay: `${event.date}: ${event.description}`,
      newValueDisplay: `${date}: ${desc}`,
      applyPayload: payload,
      reason: reason || undefined,
      requestedBy: userName,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-slate-800">Edit Event</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X size={16}/></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <input
              type="text"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {(approvalOn || requireReason) && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Reason {requireReason && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Why is this being changed?"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}
          {approvalOn && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
              ⏳ This edit will be sent for approval before applying.
            </p>
          )}
        </div>
        <div className="flex gap-2 p-4 border-t">
          <button onClick={onClose} className="flex-1 border border-slate-300 rounded-lg py-2 text-sm hover:bg-slate-50">Cancel</button>
          <button
            onClick={save}
            disabled={requireReason && !reason}
            className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm hover:bg-green-700 disabled:opacity-40"
          >
            {approvalOn ? 'Submit for Approval' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Records History sub-component ─────────────────────────────────────────────
function RecordsHistory({ records, fields, cycleId, stageId }: {
  records: DailyRecord[];
  fields: DailyField[];
  cycleId?: string;
  stageId?: string;
}) {
  const { submitEdit, deleteDailyRecord, org } = useOrg();
  const approvalOn = org?.editApproval?.enabled ?? false;
  const userName   = org?.editApproval?.currentUserName ?? 'Staff';
  const requireReason = org?.editApproval?.requireReason ?? false;
  const [editRecord, setEditRecord] = useState<DailyRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; date: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  const fieldMap = Object.fromEntries(fields.map(f => [f.id, f]));

  function handleDelete(record: DailyRecord) {
    if (!cycleId || !stageId) return;
    if (approvalOn) {
      submitEdit({
        entityType: 'daily_record',
        entityId: record.id,
        cycleId,
        stageId,
        entityLabel: `Daily Record ${record.date}`,
        fieldLabel: 'DELETE',
        oldValueDisplay: JSON.stringify(record.measurements),
        newValueDisplay: '(deleted)',
        applyPayload: JSON.stringify({ action: 'delete_record', cycleId, stageId, entityId: record.id }),
        reason: deleteReason || undefined,
        requestedBy: userName,
      });
    } else {
      deleteDailyRecord(cycleId, stageId, record.id);
    }
    setDeleteTarget(null);
    setDeleteReason('');
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Records</h3>
      <div className="space-y-2">
        {records.map(r => {
          const numEntries  = Object.entries(r.measurements);
          const textEntries = Object.entries(r.data ?? {});
          return (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-3">
              <div className="flex justify-between text-xs mb-2">
                <span className="font-semibold text-slate-700">
                  {new Date(r.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{numEntries.length + textEntries.length} fields</span>
                  {cycleId && stageId && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditRecord(r)}
                        title="Edit record"
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-green-600"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: r.id, date: r.date })}
                        title="Delete record"
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {numEntries.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                  {numEntries.map(([key, val]) => {
                    const f = fieldMap[key];
                    const bm = f?.benchmark;
                    const bad = bm && ((bm.min !== undefined && val < bm.min) || (bm.max !== undefined && val > bm.max));
                    return (
                      <div key={key} className={`rounded-lg p-1.5 ${bad ? 'bg-red-50 border border-red-100' : 'bg-slate-50'}`}>
                        <div className="text-[10px] text-slate-400 leading-tight">{f?.label ?? key}</div>
                        <div className={`text-xs font-bold ${bad ? 'text-red-600' : 'text-slate-800'}`}>
                          {typeof val === 'number' ? val.toLocaleString() : val}
                          {f?.unit && <span className="font-normal text-slate-400 ml-0.5">{f.unit}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {textEntries.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {textEntries.map(([key, val]) => (
                    <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full text-[10px] text-slate-600">
                      <span className="text-slate-400">{fieldMap[key]?.label ?? key}:</span> {val}
                    </span>
                  ))}
                </div>
              )}
              {r.notes && <p className="text-xs text-slate-500 mt-1.5 border-t border-slate-100 pt-1.5">{r.notes}</p>}
            </div>
          );
        })}
      </div>

      {/* Edit record modal */}
      {editRecord && cycleId && stageId && (
        <EditRecordModal
          record={editRecord}
          cycleId={cycleId}
          stageId={stageId}
          onClose={() => setEditRecord(null)}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-800">Delete Record?</h3>
            <p className="text-sm text-slate-600">
              Remove record for <strong>{deleteTarget.date}</strong>?
              {approvalOn && ' This will be submitted for approval.'}
            </p>
            {(approvalOn || requireReason) && (
              <input
                type="text"
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="Reason for deletion"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            )}
            <div className="flex gap-2">
              <button onClick={() => { setDeleteTarget(null); setDeleteReason(''); }} className="flex-1 border border-slate-300 rounded-lg py-2 text-sm hover:bg-slate-50">Cancel</button>
              <button
                onClick={() => {
                  const rec = records.find(r => r.id === deleteTarget.id);
                  if (rec) handleDelete(rec);
                }}
                className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm hover:bg-red-700"
              >
                {approvalOn ? 'Submit Deletion' : 'Delete'}
              </button>
            </div>
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
// Events Tab — universal, category-aware event logging
// ─────────────────────────────────────────────────────────────────────────────

function EventsTab({ cycle, template, currentStage }: {
  cycle: ProductionCycle;
  template: ProductionTemplate | undefined;
  currentStage: CycleStage | undefined;
}) {
  const { addEvent } = useOrg();

  // Get event types for this template's category
  const category = template?.category ?? 'crops';
  const availableEvents = useMemo(() => getEventTypesForCategory(category), [category]);

  const { submitEdit, deleteEvent: deleteEventStore, org } = useOrg();
  const approvalOn = org?.editApproval?.enabled ?? false;
  const userName   = org?.editApproval?.currentUserName ?? 'Staff';
  const requireReason = org?.editApproval?.requireReason ?? false;

  const [showForm, setShowForm]   = useState(false);
  const [eventType, setEventType] = useState(availableEvents[0]?.type ?? 'observation');
  const [stageId, setStageId]     = useState(currentStage?.id ?? cycle.stages[0]?.id ?? '');
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10));
  // Dynamic field values: key = field.id, value = string
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [saved, setSaved]         = useState(false);
  const [editEvent, setEditEvent] = useState<{ event: ProductionEvent; stageId: string } | null>(null);
  const [deleteEvTarget, setDeleteEvTarget] = useState<{ event: ProductionEvent; stageId: string } | null>(null);
  const [deleteEvReason, setDeleteEvReason] = useState('');

  const selectedEventCfg = availableEvents.find(e => e.type === eventType) ?? availableEvents[0];

  function handleDeleteEvent(ev: ProductionEvent, sid: string) {
    if (approvalOn) {
      submitEdit({
        entityType: 'event',
        entityId: ev.id,
        cycleId: cycle.id,
        stageId: sid,
        entityLabel: `Event — ${ev.type}`,
        fieldLabel: 'DELETE',
        oldValueDisplay: `${ev.date}: ${ev.description}`,
        newValueDisplay: '(deleted)',
        applyPayload: JSON.stringify({ action: 'delete_event', cycleId: cycle.id, stageId: sid, entityId: ev.id }),
        reason: deleteEvReason || undefined,
        requestedBy: userName,
      });
    } else {
      deleteEventStore(cycle.id, sid, ev.id);
    }
    setDeleteEvTarget(null);
    setDeleteEvReason('');
  }

  function setField(id: string, val: string) {
    setFieldValues(prev => {
      const next = { ...prev, [id]: val };
      // Auto-compute derived fields
      if (id === 'unit_cost' || id === 'quantity') {
        const uc = parseFloat(next['unit_cost'] ?? '0') || 0;
        const q  = parseFloat(next['quantity'] ?? '0') || 0;
        if (uc && q) next['total_cost'] = String((uc * q).toFixed(2));
      }
      if (id === 'morning_litres' || id === 'afternoon_litres' || id === 'evening_litres') {
        const tot = (parseFloat(next['morning_litres'] ?? '0') || 0)
          + (parseFloat(next['afternoon_litres'] ?? '0') || 0)
          + (parseFloat(next['evening_litres'] ?? '0') || 0);
        if (tot > 0) next['total_litres'] = String(tot);
      }
      if (id === 'unit_price' || id === 'quantity') {
        const up = parseFloat(next['unit_price'] ?? '0') || 0;
        const q  = parseFloat(next['quantity'] ?? '0') || 0;
        if (up && q) next['total_value'] = String((up * q).toFixed(2));
      }
      return next;
    });
  }

  function save() {
    if (!selectedEventCfg) return;
    addEvent(cycle.id, stageId, {
      type: selectedEventCfg.type,
      date,
      description: fieldValues['subject'] || fieldValues['product'] || fieldValues['item'] || selectedEventCfg.label,
      data: { ...fieldValues },
      recordedBy: 'user',
    });
    setFieldValues({});
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); }, 1500);
  }

  const allEvents = cycle.stages.flatMap(s => s.events.map(e => ({ ...e, stageName: s.name, stageId: s.id })))
    .sort((a: any, b: any) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-5">
      {cycle.status !== 'completed' && (
        <button onClick={() => setShowForm(f => !f)}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 w-full justify-center">
          <Plus className="w-4 h-4" /> {showForm ? 'Hide Form' : 'Log Event'}
        </button>
      )}

      {/* Universal event form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">

          {/* Event type picker — scrollable chips */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Event Type <span className="text-slate-400 font-normal">({availableEvents.length} for {category})</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableEvents.map(t => (
                <button key={t.type}
                  onClick={() => { setEventType(t.type); setFieldValues({}); }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    eventType === t.type
                      ? `${t.color} ring-1 ring-current`
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}>
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedEventCfg && (
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{selectedEventCfg.description}</p>
          )}

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

          {/* Dynamic fields from EventTypeConfig */}
          {selectedEventCfg && (
            <UniversalEventForm
              fields={selectedEventCfg.fields}
              values={fieldValues}
              onChange={setField}
            />
          )}

          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={save}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${saved ? 'bg-green-100 text-green-700' : 'bg-green-600 text-white hover:bg-green-700'}`}>
              {saved ? '✓ Saved!' : `Save ${selectedEventCfg?.label ?? 'Event'}`}
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
          {allEvents.map((event: any) => {
            const cfg = availableEvents.find(t => t.type === event.type);
            return (
              <div key={event.id} className={`rounded-xl border p-3.5 ${cfg?.color ?? 'bg-white border-slate-200 text-slate-700'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cfg?.icon ?? '📌'}</span>
                    <div>
                      <div className="text-sm font-medium">{cfg?.label ?? event.type}</div>
                      <div className="text-xs opacity-70">
                        {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {event.stageName}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Show key data fields as chips */}
                    {event.data && (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {['count', 'total_collected', 'honey_kg', 'total_litres', 'quantity', 'total_weight'].map(key => (
                          event.data[key] ? (
                            <span key={key} className="text-xs bg-white/60 rounded-full px-2 py-0.5 font-medium">
                              {event.data[key]}
                            </span>
                          ) : null
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setEditEvent({ event, stageId: event.stageId ?? cycle.stages[0]?.id ?? '' })}
                      title="Edit event"
                      className="p-1 rounded hover:bg-white/40 opacity-60 hover:opacity-100"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => setDeleteEvTarget({ event, stageId: event.stageId ?? cycle.stages[0]?.id ?? '' })}
                      title="Delete event"
                      className="p-1 rounded hover:bg-white/40 opacity-60 hover:opacity-100 text-red-600"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                {event.description && event.description !== (cfg?.label) && (
                  <p className="text-xs mt-1.5 opacity-80">{event.description}</p>
                )}
                {/* Show key field values compactly */}
                {event.data && Object.keys(event.data).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(event.data)
                      .filter(([k, v]) => v && !['add_to_inventory', 'routing'].includes(k))
                      .slice(0, 6)
                      .map(([k, v]) => {
                        const fieldCfg = cfg?.fields.find(f => f.id === k);
                        return (
                          <span key={k} className="text-[10px] bg-white/50 rounded px-1.5 py-0.5 text-current opacity-80">
                            {fieldCfg?.label ?? k.replace(/_/g, ' ')}: <strong>{String(v)}</strong>
                            {fieldCfg?.unit && fieldCfg.unit !== 'currency' ? ` ${fieldCfg.unit}` : ''}
                          </span>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit event modal */}
      {editEvent && (
        <EditEventModal
          event={editEvent.event}
          cycleId={cycle.id}
          stageId={editEvent.stageId}
          onClose={() => setEditEvent(null)}
        />
      )}

      {/* Delete event confirmation */}
      {deleteEvTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-800">Delete Event?</h3>
            <p className="text-sm text-slate-600">
              Remove this <strong>{deleteEvTarget.event.type}</strong> event?
              {approvalOn && ' This will be submitted for approval.'}
            </p>
            {(approvalOn || requireReason) && (
              <input
                type="text"
                value={deleteEvReason}
                onChange={e => setDeleteEvReason(e.target.value)}
                placeholder="Reason for deletion"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            )}
            <div className="flex gap-2">
              <button onClick={() => { setDeleteEvTarget(null); setDeleteEvReason(''); }} className="flex-1 border border-slate-300 rounded-lg py-2 text-sm hover:bg-slate-50">Cancel</button>
              <button
                onClick={() => handleDeleteEvent(deleteEvTarget.event, deleteEvTarget.stageId)}
                className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm hover:bg-red-700"
              >
                {approvalOn ? 'Submit Deletion' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Universal Event Form ──────────────────────────────────────────────────────

function UniversalEventForm({ fields, values, onChange }: {
  fields: EventField[];
  values: Record<string, string>;
  onChange: (id: string, val: string) => void;
}) {
  const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';

  // Group fields: put boolean and textarea at end
  const mainFields = fields.filter(f => f.type !== 'textarea' && f.type !== 'boolean');
  const textareas  = fields.filter(f => f.type === 'textarea');
  const booleans   = fields.filter(f => f.type === 'boolean');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {mainFields.map(field => (
          <div key={field.id} className={field.computed ? 'opacity-60' : ''}>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {field.label}
              {field.required && <span className="text-red-400 ml-0.5">*</span>}
              {field.unit && field.unit !== 'currency' && (
                <span className="text-slate-400 font-normal ml-1">({field.unit})</span>
              )}
              {field.unit === 'currency' && (
                <span className="text-slate-400 font-normal ml-1">(cost)</span>
              )}
            </label>
            {field.type === 'select' ? (
              <select value={values[field.id] ?? ''} onChange={e => onChange(field.id, e.target.value)}
                className={inputCls}>
                <option value="">— select —</option>
                {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : field.type === 'date' ? (
              <input type="date" value={values[field.id] ?? ''} onChange={e => onChange(field.id, e.target.value)}
                className={inputCls} readOnly={field.computed} />
            ) : (
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                step={field.type === 'number' ? 'any' : undefined}
                value={values[field.id] ?? ''}
                onChange={e => onChange(field.id, e.target.value)}
                placeholder={field.placeholder ?? ''}
                readOnly={field.computed}
                className={inputCls}
              />
            )}
          </div>
        ))}
      </div>

      {booleans.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {booleans.map(field => (
            <label key={field.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox"
                checked={values[field.id] === 'true'}
                onChange={e => onChange(field.id, String(e.target.checked))}
                className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
              />
              {field.label}
            </label>
          ))}
        </div>
      )}

      {textareas.map(field => (
        <div key={field.id}>
          <label className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
          <textarea value={values[field.id] ?? ''} onChange={e => onChange(field.id, e.target.value)}
            placeholder={field.placeholder ?? ''}
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
        </div>
      ))}
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

  const transfers = cycle.transferHistory ?? [];
  const hasAnything = allOutputs.length > 0 || transfers.length > 0;

  if (!hasAnything) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Package className="w-8 h-8 mx-auto mb-3 opacity-25" />
        <p className="text-sm">No outputs recorded yet.</p>
        <p className="text-xs mt-1">Log a Harvest or Sale event, or use Transfer Output to record decisions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Transfer History ── */}
      {transfers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <span className="text-base">🔄</span> Transfer Decisions
          </h3>
          {transfers.map((tr, i) => (
            <div key={i} className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-sm text-purple-900">{tr.outputType}</div>
                  <div className="text-[10px] text-purple-500 mt-0.5">{new Date(tr.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div className="text-xs font-bold text-slate-700">{tr.totalQuantity.toLocaleString()} {tr.unit} total</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {tr.soldQuantity > 0 && (
                  <div className="flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs px-2.5 py-1.5 rounded-lg font-medium">
                    <span>💰</span>
                    <span>{tr.soldQuantity} {tr.unit} sold</span>
                    {tr.soldRevenue != null && tr.soldRevenue > 0 && (
                      <span className="text-amber-600">· {tr.soldRevenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                    )}
                  </div>
                )}
                {tr.transferredQuantity > 0 && (
                  <div className="flex items-center gap-1.5 bg-purple-100 text-purple-800 text-xs px-2.5 py-1.5 rounded-lg font-medium">
                    <span>{tr.newCycleCreated ? '✨' : '→'}</span>
                    <span>{tr.transferredQuantity} {tr.unit} → {tr.destinationCycleName ?? 'next cycle'}</span>
                    {tr.newCycleCreated && <span className="text-purple-500 font-normal">(new cycle)</span>}
                  </div>
                )}
              </div>
              {tr.notes && <p className="text-xs text-slate-500 italic">{tr.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ── Event-based outputs ── */}
      {allOutputs.length > 0 && (
        <>
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

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">All Logged Outputs</h3>
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
        </>
      )}
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
// Cycle Variant definitions — category → list of specific cycle types
// ─────────────────────────────────────────────────────────────────────────────
interface CycleVariant {
  id: string;
  label: string;
  description: string;
  icon: string;
  defaultDays: number;
}

const CYCLE_VARIANTS: Record<string, CycleVariant[]> = {
  poultry: [
    { id: 'broiler_grow_out',   label: 'Broiler Grow-Out',         icon: '🍗', description: 'Day-old chicks → live weight / slaughter. Typically 35–45 days.',       defaultDays: 42  },
    { id: 'layer_from_chicks',  label: 'Layer — from Day-Old',     icon: '🐥', description: 'Day-old chicks → pullets → full lay. Includes brooding & growing phases.', defaultDays: 500 },
    { id: 'layer_from_pol',     label: 'Layer — from Point-of-Lay',icon: '🥚', description: 'Start with 18-week+ pullets ready to lay.',                              defaultDays: 380 },
    { id: 'layer_continuing',   label: 'Layer — Continuing Flock', icon: '🐓', description: 'Already-laying flock, tracking ongoing production season.',              defaultDays: 90  },
    { id: 'incubation',         label: 'Egg Incubation & Hatch',   icon: '🥚→🐣', description: 'Set fertile eggs → candle → lock-down → hatch → chick grading.',    defaultDays: 22  },
    { id: 'breeder_flock',      label: 'Breeder Flock',            icon: '💑', description: 'Roosters + hens managed for fertile egg production.',                    defaultDays: 365 },
    { id: 'turkey_grow_out',    label: 'Turkey Grow-Out',          icon: '🦃', description: 'Poults → market weight. Typically 16–20 weeks.',                         defaultDays: 120 },
    { id: 'duck_cycle',         label: 'Duck Cycle',               icon: '🦆', description: 'Ducklings → meat or layer production.',                                  defaultDays: 60  },
    { id: 'quail_cycle',        label: 'Quail Cycle',              icon: '🐦', description: 'Quail chicks → eggs or meat.',                                           defaultDays: 90  },
  ],
  livestock: [
    { id: 'dairy_season',       label: 'Dairy Production Season',  icon: '🥛', description: 'Track lactation, milk yield, breeding and dry-off for a dairy herd.',    defaultDays: 305 },
    { id: 'beef_grow_out',      label: 'Beef Grow-Out',            icon: '🥩', description: 'Weaners / stockers → slaughter weight.',                                 defaultDays: 180 },
    { id: 'pig_grow_out',       label: 'Pig Grow-Out',             icon: '🐖', description: 'Weaners → market weight. Typically 16–20 weeks post-weaning.',          defaultDays: 120 },
    { id: 'sow_farrowing',      label: 'Sow Farrowing Cycle',     icon: '🐷', description: 'Pregnancy → farrowing → weaning for a sow or group of sows.',           defaultDays: 90  },
    { id: 'goat_season',        label: 'Goat Production Season',   icon: '🐐', description: 'Dairy or meat goats — kidding, milking, or grow-out.',                  defaultDays: 180 },
    { id: 'sheep_season',       label: 'Sheep Season',             icon: '🐑', description: 'Lambing or meat lamb grow-out.',                                          defaultDays: 120 },
    { id: 'rabbit_batch',       label: 'Rabbit Batch',             icon: '🐇', description: 'Kits at weaning → market weight. Typically 70–90 days.',                defaultDays: 80  },
  ],
  aquaculture: [
    { id: 'pond_grow_out',      label: 'Pond Grow-Out',            icon: '🏊', description: 'Fingerlings stocked into pond → harvest weight.',                        defaultDays: 180 },
    { id: 'cage_culture',       label: 'Cage Culture',             icon: '🐟', description: 'Fish in floating cages in a lake or dam.',                               defaultDays: 150 },
    { id: 'tank_rearing',       label: 'Tank / RAS System',       icon: '🚰', description: 'Recirculating aquaculture system — controlled indoor environment.',       defaultDays: 120 },
    { id: 'shrimp_pond',        label: 'Shrimp Pond Cycle',        icon: '🦐', description: 'Post-larvae stocking → harvest. Typically 90–120 days.',                defaultDays: 100 },
    { id: 'aquaponics_cycle',   label: 'Aquaponics Cycle',         icon: '🌿', description: 'Fish + plants in a closed-loop system.',                                 defaultDays: 120 },
    { id: 'hatchery_cycle',     label: 'Hatchery / Nursery Cycle', icon: '🐣', description: 'Broodstock conditioning → spawning → larvae rearing → fingerlings.',   defaultDays: 45  },
  ],
  crops: [
    { id: 'rain_fed_season',    label: 'Rain-Fed Season',          icon: '🌧️', description: 'Single rainy-season crop — maize, sorghum, groundnuts etc.',            defaultDays: 120 },
    { id: 'irrigated_season',   label: 'Irrigated Season',         icon: '💧', description: 'Irrigated crop — can span any calendar period.',                         defaultDays: 90  },
    { id: 'nursery_seedbed',    label: 'Nursery / Seedbed',        icon: '🌱', description: 'Seed germination and seedling raising before transplanting.',            defaultDays: 30  },
    { id: 'ratoon_crop',        label: 'Ratoon Crop',              icon: '🎋', description: 'Second harvest from the same root system (sugarcane, banana).',          defaultDays: 180 },
  ],
  horticulture: [
    { id: 'transplant_cycle',   label: 'Transplant Cycle',         icon: '🌿', description: 'Seedling transplant → harvest. For tomato, cabbage, kale, pepper.',     defaultDays: 90  },
    { id: 'direct_sown',        label: 'Direct-Sown Crop',         icon: '🌾', description: 'Seed direct in field — carrot, beetroot, onion, watermelon.',           defaultDays: 75  },
    { id: 'perennial_season',   label: 'Perennial Season',         icon: '🔄', description: 'Track a growing season on a perennial vegetable (chilli, eggplant).',   defaultDays: 120 },
  ],
  greenhouse: [
    { id: 'hydroponic_cycle',   label: 'Hydroponic Cycle',         icon: '💧', description: 'NFT, DWC, or drip lettuce / herbs / spinach cycle.',                    defaultDays: 35  },
    { id: 'greenhouse_tomato',  label: 'Greenhouse Tomato',        icon: '🍅', description: 'Transplant to first pick to end-of-season for greenhouse tomato.',       defaultDays: 180 },
    { id: 'cut_flower_cycle',   label: 'Cut Flower Production',    icon: '🌹', description: 'Planting to first cut and repeat cycles for roses, carnations.',        defaultDays: 90  },
    { id: 'strawberry_cycle',   label: 'Strawberry Cycle',         icon: '🍓', description: 'Transplant to first harvest and peak production window.',               defaultDays: 75  },
  ],
  orchard: [
    { id: 'orchard_season',     label: 'Annual Production Season', icon: '📅', description: 'Track flowering → fruit set → harvest → post-harvest for one year.',    defaultDays: 365 },
    { id: 'new_planting',       label: 'New Orchard Planting',     icon: '🌳', description: 'Land prep → planting → establishment phase for new trees.',             defaultDays: 180 },
    { id: 'harvest_window',     label: 'Harvest Window',           icon: '🛒', description: 'Focus on the active harvest period only.',                               defaultDays: 45  },
  ],
  apiary: [
    { id: 'honey_season',       label: 'Honey Production Season',  icon: '🍯', description: 'Colony build-up → main flow → extraction → post-harvest assessment.',   defaultDays: 120 },
    { id: 'colony_buildup',     label: 'Colony Build-Up',          icon: '🐝', description: 'Package or nuc → full colony establishment.',                           defaultDays: 60  },
    { id: 'queen_rearing',      label: 'Queen Rearing Cycle',      icon: '👑', description: 'Cell grafting → capping → emergence → mating → laying.',               defaultDays: 30  },
  ],
  mushroom: [
    { id: 'block_cycle',        label: 'Spawn Block Cycle',        icon: '🍄', description: 'Inoculation → colonisation → pinning → fruiting → end-of-life.',        defaultDays: 60  },
    { id: 'bag_spawn',          label: 'Bag Spawn Cycle',          icon: '🛍️', description: 'Substrate bags inoculated and cycled through fruiting.',                defaultDays: 45  },
  ],
  processing: [
    { id: 'processing_batch',   label: 'Processing Batch',         icon: '⚙️', description: 'A defined batch of raw material through the processing line.',          defaultDays: 7   },
    { id: 'processing_month',   label: 'Monthly Operation',        icon: '📆', description: 'Track one calendar month of processing activity.',                      defaultDays: 30  },
  ],
  services: [
    { id: 'service_contract',   label: 'Service Contract',         icon: '📋', description: 'A defined service engagement — consulting, training, vet rounds.',      defaultDays: 30  },
    { id: 'equipment_hire',     label: 'Equipment Hire Period',    icon: '🚜', description: 'Track utilisation and returns for hired equipment.',                    defaultDays: 14  },
  ],
};

// Category-specific setup fields
interface SetupField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  options?: string[];
  unit?: string;
  placeholder?: string;
  required?: boolean;
  visibleFor?: string[];  // cycle variant IDs where this field appears; undefined = always
  hint?: string;
}

const CATEGORY_SETUP_FIELDS: Record<string, SetupField[]> = {
  poultry: [
    { id: 'bird_count',      label: 'Number of Birds',           type: 'number', unit: 'birds',   required: true, placeholder: '500', visibleFor: ['broiler_grow_out','layer_from_chicks','layer_from_pol','layer_continuing','breeder_flock','turkey_grow_out','duck_cycle','quail_cycle'] },
    { id: 'egg_count',       label: 'Eggs Set',                  type: 'number', unit: 'eggs',    required: true, placeholder: '1000', visibleFor: ['incubation'] },
    { id: 'breed',           label: 'Breed / Strain',            type: 'text',   placeholder: 'e.g. Ross 308, Lohmann Brown', required: false },
    { id: 'house_pen',       label: 'House / Pen ID',            type: 'text',   placeholder: 'e.g. House A, Pen 3', required: false },
    { id: 'chick_source',    label: 'Chick / Egg Source',        type: 'text',   placeholder: 'Hatchery or farm name', required: false },
    { id: 'target_age_days', label: 'Target Slaughter Age',      type: 'number', unit: 'days',    required: false, placeholder: '42', visibleFor: ['broiler_grow_out','turkey_grow_out'] },
    { id: 'starting_age',    label: 'Starting Age',              type: 'number', unit: 'weeks',   required: false, placeholder: '18', visibleFor: ['layer_from_pol','layer_continuing'] },
    { id: 'egg_routing',     label: 'Egg Routing Intent',        type: 'select', options: ['Table eggs → market','Fertile eggs → incubation (in-house)','Fertile eggs → sale','Mixed (split between uses)'], visibleFor: ['layer_from_chicks','layer_from_pol','layer_continuing','breeder_flock'], hint: 'What will you do with collected eggs?' },
    { id: 'setter_id',       label: 'Setter / Incubator ID',     type: 'text',   placeholder: 'e.g. Cabinet 1', visibleFor: ['incubation'] },
    { id: 'expected_hatch',  label: 'Expected Hatch Date',       type: 'text',   placeholder: 'YYYY-MM-DD', visibleFor: ['incubation'] },
    { id: 'housing_type',    label: 'Housing System',            type: 'select', options: ['Deep litter','Cages (battery)','Free range','Semi-intensive','Aviary'] },
  ],
  livestock: [
    { id: 'head_count',      label: 'Number of Animals',         type: 'number', unit: 'head',    required: true,  placeholder: '20' },
    { id: 'breed',           label: 'Breed',                     type: 'text',   placeholder: 'e.g. Friesian, Boer' },
    { id: 'age_months',      label: 'Average Age',               type: 'number', unit: 'months',  placeholder: '6' },
    { id: 'sex_breakdown',   label: 'Sex Breakdown',             type: 'text',   placeholder: 'e.g. 10 cows, 1 bull', visibleFor: ['dairy_season','goat_season','breeder_flock'] },
    { id: 'purpose',         label: 'Primary Purpose',           type: 'select', options: ['Dairy','Beef / Meat','Breeding','Mixed'] },
    { id: 'pen_location',    label: 'Pen / Paddock',             type: 'text',   placeholder: 'e.g. Paddock B' },
    { id: 'avg_weight_kg',   label: 'Average Starting Weight',   type: 'number', unit: 'kg',      placeholder: '120' },
    { id: 'feeding_system',  label: 'Feeding System',            type: 'select', options: ['Zero-grazing (cut & carry)','Grazing (pasture)','Mixed grazing + supplement','Feedlot (total confinement)'] },
  ],
  aquaculture: [
    { id: 'pond_count',      label: 'Number of Ponds / Tanks',   type: 'number', unit: 'units',   required: true,  placeholder: '4' },
    { id: 'pond_area_m2',    label: 'Pond Area per Unit',        type: 'number', unit: 'm²',      placeholder: '500' },
    { id: 'fingerlings',     label: 'Fingerlings Stocked',       type: 'number', unit: 'fish',    required: true,  placeholder: '5000' },
    { id: 'stocking_density',label: 'Stocking Density',          type: 'number', unit: 'fish/m²', placeholder: '5' },
    { id: 'species_variant', label: 'Species / Strain',          type: 'text',   placeholder: 'e.g. Nile Tilapia, African Catfish' },
    { id: 'avg_fingerling_g',label: 'Avg Fingerling Weight',     type: 'number', unit: 'g',       placeholder: '5' },
    { id: 'water_source',    label: 'Water Source',              type: 'select', options: ['Borehole','River / stream','Municipal','Rainwater harvested','Recirculating (RAS)'] },
    { id: 'feed_type',       label: 'Primary Feed Type',         type: 'select', options: ['Commercial pellets','Farm-made feed','Natural (algae/plankton)','Mixed'] },
    { id: 'target_weight_g', label: 'Target Harvest Weight',     type: 'number', unit: 'g',       placeholder: '500' },
  ],
  crops: [
    { id: 'field_id',        label: 'Field / Plot Name',         type: 'text',   required: true,  placeholder: 'e.g. Plot A1, North Field' },
    { id: 'area_ha',         label: 'Area',                      type: 'number', unit: 'ha',      required: true,  placeholder: '2.5' },
    { id: 'variety',         label: 'Variety / Cultivar',        type: 'text',   placeholder: 'e.g. SC403, DK8031' },
    { id: 'irrigation',      label: 'Irrigation System',         type: 'select', options: ['Rain-fed (no irrigation)','Drip irrigation','Flood / furrow','Centre pivot','Sprinkler','Manual watering'] },
    { id: 'soil_type',       label: 'Soil Type',                 type: 'select', options: ['Sandy loam','Clay loam','Sandy','Clay','Silt loam','Not assessed'] },
    { id: 'expected_yield',  label: 'Expected Yield',            type: 'number', unit: 'bags/ha', placeholder: '50' },
    { id: 'seed_rate_kg_ha', label: 'Seed Rate',                 type: 'number', unit: 'kg/ha',   placeholder: '25' },
  ],
  horticulture: [
    { id: 'field_id',        label: 'Field / Bed Name',          type: 'text',   required: true,  placeholder: 'e.g. Bed 1, Tunnel A' },
    { id: 'area_ha',         label: 'Area',                      type: 'number', unit: 'ha',      required: true,  placeholder: '0.5' },
    { id: 'variety',         label: 'Variety / Cultivar',        type: 'text',   placeholder: 'e.g. Roma, Nuru F1' },
    { id: 'transplant_date', label: 'Transplant / Sowing Date',  type: 'text',   placeholder: 'YYYY-MM-DD' },
    { id: 'plant_count',     label: 'Plant Count',               type: 'number', unit: 'plants',  placeholder: '5000' },
    { id: 'irrigation',      label: 'Irrigation',                type: 'select', options: ['Drip','Furrow','Sprinkler','Manual','Rain-fed'] },
    { id: 'expected_yield',  label: 'Expected Yield',            type: 'number', unit: 'kg/ha',   placeholder: '15000' },
  ],
  greenhouse: [
    { id: 'structure_name',  label: 'Greenhouse / Tunnel Name',  type: 'text',   required: true,  placeholder: 'e.g. Greenhouse 1, Tunnel B' },
    { id: 'growing_area_m2', label: 'Growing Area',              type: 'number', unit: 'm²',      required: true,  placeholder: '500' },
    { id: 'growing_system',  label: 'Growing System',            type: 'select', options: ['Soil (raised beds)','Drip to soil','NFT Hydroponics','DWC Hydroponics','Coco coir / substrate','Aeroponics'] },
    { id: 'plant_count',     label: 'Plant Count',               type: 'number', unit: 'plants',  placeholder: '2000' },
    { id: 'variety',         label: 'Variety / Cultivar',        type: 'text',   placeholder: 'e.g. Elegance Rose, Lollo Rossa' },
    { id: 'lighting',        label: 'Lighting',                  type: 'select', options: ['Natural light only','Supplemental LED','Full artificial lighting'] },
    { id: 'climate_control', label: 'Climate Control',           type: 'select', options: ['None (passive)','Shade nets','Evaporative cooling','Full HVAC'] },
  ],
  orchard: [
    { id: 'plot_name',       label: 'Plot / Block Name',         type: 'text',   required: true,  placeholder: 'e.g. Block A, Mango Section' },
    { id: 'tree_count',      label: 'Number of Trees',           type: 'number', unit: 'trees',   required: true,  placeholder: '200' },
    { id: 'plot_area_ha',    label: 'Plot Area',                 type: 'number', unit: 'ha',      placeholder: '5' },
    { id: 'tree_age_years',  label: 'Tree Age',                  type: 'number', unit: 'years',   placeholder: '4' },
    { id: 'variety',         label: 'Variety / Cultivar',        type: 'text',   placeholder: 'e.g. Tommy Atkins, Hass' },
    { id: 'spacing',         label: 'Tree Spacing',              type: 'text',   placeholder: 'e.g. 5m × 5m' },
    { id: 'irrigation',      label: 'Irrigation',                type: 'select', options: ['Rain-fed','Drip','Micro-jets','Flood / furrow'] },
    { id: 'expected_yield_t',label: 'Expected Yield',            type: 'number', unit: 'tonnes',  placeholder: '10' },
  ],
  apiary: [
    { id: 'hive_count',      label: 'Number of Hives',           type: 'number', unit: 'hives',   required: true,  placeholder: '20' },
    { id: 'hive_type',       label: 'Hive Type',                 type: 'select', options: ['Langstroth','Kenya Top Bar (KTBH)','Top Bar (other)','Warré','Log hive (traditional)'] },
    { id: 'apiary_location', label: 'Apiary Location / Name',    type: 'text',   placeholder: 'e.g. Forest apiary, Orchard site' },
    { id: 'colony_strength', label: 'Average Colony Strength',   type: 'select', options: ['Weak (< 3 frames brood)','Medium (3–5 frames)','Strong (5+ frames)'] },
    { id: 'expected_honey_kg',label: 'Expected Honey Yield',     type: 'number', unit: 'kg/hive', placeholder: '15' },
  ],
  mushroom: [
    { id: 'block_count',     label: 'Number of Growing Blocks / Bags', type: 'number', unit: 'blocks', required: true, placeholder: '200' },
    { id: 'substrate',       label: 'Substrate Type',            type: 'select', options: ['Sawdust (hardwood)','Rice straw','Wheat straw','Coffee grounds','Cotton waste','Compost (button mushroom)'] },
    { id: 'growing_room',    label: 'Growing Room / Shed',       type: 'text',   placeholder: 'e.g. Room A' },
    { id: 'target_yield_kg', label: 'Target Yield',              type: 'number', unit: 'kg',      placeholder: '300' },
    { id: 'inoculation_date',label: 'Inoculation Date',          type: 'text',   placeholder: 'YYYY-MM-DD' },
  ],
  processing: [
    { id: 'raw_material_kg', label: 'Raw Material Quantity',     type: 'number', unit: 'kg',      required: true,  placeholder: '5000' },
    { id: 'raw_material_name',label: 'Raw Material',             type: 'text',   required: true,  placeholder: 'e.g. Maize, Cassava, Milk' },
    { id: 'expected_output_kg',label: 'Expected Finished Output',type: 'number', unit: 'kg',      placeholder: '4500' },
    { id: 'processing_line', label: 'Line / Machine',            type: 'text',   placeholder: 'e.g. Mill 1, Line B' },
  ],
  services: [
    { id: 'client_name',     label: 'Client / Customer Name',    type: 'text',   required: true,  placeholder: 'Farm or individual name' },
    { id: 'service_scope',   label: 'Service Scope',             type: 'text',   placeholder: 'Brief description of service' },
    { id: 'service_location',label: 'Location',                  type: 'text',   placeholder: 'District / GPS' },
    { id: 'contracted_value',label: 'Contracted Value',          type: 'number', unit: 'ZMW',     placeholder: '5000' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Transfer Output Modal
// Lets the farmer decide: sell some, transfer some → spawn or link a new cycle
// ─────────────────────────────────────────────────────────────────────────────
const OUTPUT_TYPE_OPTIONS: Record<string, { label: string; unit: string; nextSuggestion: string }[]> = {
  poultry: [
    { label: 'Live Birds',   unit: 'birds', nextSuggestion: 'Grow-Out / Layer Cycle' },
    { label: 'Hatched Keets / Chicks', unit: 'chicks', nextSuggestion: 'Grow-Out Cycle' },
    { label: 'Hatching Eggs', unit: 'eggs', nextSuggestion: 'Incubation Cycle' },
    { label: 'Table Eggs',   unit: 'eggs', nextSuggestion: 'Inventory / Sale' },
  ],
  livestock: [
    { label: 'Live Animals', unit: 'head', nextSuggestion: 'Fattening / Breeding Cycle' },
    { label: 'Weaners',      unit: 'head', nextSuggestion: 'Grow-Out Cycle' },
    { label: 'Milk',         unit: 'litres', nextSuggestion: 'Dairy Processing' },
  ],
  aquaculture: [
    { label: 'Fingerlings',  unit: 'count', nextSuggestion: 'Grow-Out Cycle' },
    { label: 'Harvest Fish', unit: 'kg',    nextSuggestion: 'Processing / Sale' },
  ],
  crops: [
    { label: 'Harvested Crop', unit: 'kg', nextSuggestion: 'Processing Cycle' },
    { label: 'Seed Stock',     unit: 'kg', nextSuggestion: 'Next Planting Cycle' },
  ],
};

function TransferOutputModal({ sourceCycle, org, programPhases, onClose, onTransferComplete }: {
  sourceCycle: ProductionCycle;
  org: any;
  programPhases: ProductionCycle[];  // all phases in same program, sorted by phase #
  onClose: () => void;
  onTransferComplete: (newCycleId?: string) => void;
}) {
  const { addCycle, updateCycle } = useOrg();
  const enterprise = org.enterprises.find((e: any) => e.id === sourceCycle.enterpriseId);
  const template   = getTemplate(enterprise?.templateId ?? '');
  const category   = template?.category ?? 'poultry';

  const outputOptions = OUTPUT_TYPE_OPTIONS[category] ?? OUTPUT_TYPE_OPTIONS.poultry;

  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 — what are you transferring
  const [outputType, setOutputType] = useState(outputOptions[0]);
  const [totalQty,   setTotalQty]   = useState('');

  // Step 2 — quantities
  const [sellQty,      setSellQty]      = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [transferQty,  setTransferQty]  = useState('');

  // Step 3 — where to transfer
  const [dest, setDest] = useState<'existing' | 'new'>('new');
  const [existingCycleId, setExistingCycleId] = useState('');
  // New cycle fields
  const [newCycleName,       setNewCycleName]       = useState('');
  const [newCycleEnterpriseId, setNewCycleEnterpriseId] = useState(sourceCycle.enterpriseId);
  const [newPhaseLabel,      setNewPhaseLabel]      = useState('');
  const [transferNotes,      setTransferNotes]      = useState('');

  const total    = parseFloat(totalQty) || 0;
  const sell     = parseFloat(sellQty)  || 0;
  const transfer = parseFloat(transferQty) || 0;
  const revenue  = sell * (parseFloat(pricePerUnit) || 0);

  // Planning cycles in the same program (possible existing destinations)
  const siblingsPlanning = programPhases.filter(c =>
    c.id !== sourceCycle.id && (c.status === 'planning' || c.status === 'active')
  );

  // Suggest next phase number & label
  const thisPhaseIdx = programPhases.findIndex(c => c.id === sourceCycle.id);
  const maxPhase = programPhases.reduce((m, c) => Math.max(m, c.programPhase ?? 0), 0);
  const suggestedPhaseNum = maxPhase + 1;
  const suggestedLabel = `Phase ${suggestedPhaseNum}: ${outputType.nextSuggestion}`;

  // Validate per step
  const step1Valid = totalQty !== '' && total > 0;
  // At least one of sell or transfer must be > 0, and together they can't exceed total
  const step2Valid = (sell > 0 || transfer > 0) && (sell + transfer) <= total + 0.01;
  const step3Valid = transfer <= 0 || (
    dest === 'existing'
      ? existingCycleId !== ''
      : newCycleName.trim() !== '' && newCycleEnterpriseId !== ''
  );

  const currency = org.currency ?? 'ZMW';

  function handleConfirm() {
    const today = new Date().toISOString().slice(0, 10);
    let newCycleId: string | undefined;

    // ── Create new cycle if needed ───────────────────────────────────────────
    if (transfer > 0 && dest === 'new' && newCycleName.trim()) {
      const destEnterprise = org.enterprises.find((e: any) => e.id === newCycleEnterpriseId);
      const newCycle = addCycle({
        enterpriseId: newCycleEnterpriseId,
        name: newCycleName.trim(),
        status: 'planning' as const,
        startDate: today,
        currentStageId: '',
        stages: [],
        productionUnits: [{
          id: uuidv4(),
          enterpriseId: newCycleEnterpriseId,
          name: `${outputType.label} from ${sourceCycle.name}`,
          type: category === 'poultry' ? 'flock' : category === 'livestock' ? 'herd' : 'batch',
          quantity: transfer,
          unit: outputType.unit as any,
          active: true,
        }],
        programId: sourceCycle.programId,
        programName: sourceCycle.programName,
        programPhase: suggestedPhaseNum,
        programPhaseLabel: newPhaseLabel.trim() || suggestedLabel,
        sourceRef: sourceCycle.id,
        notes: transferNotes.trim() || `Transferred ${transfer} ${outputType.unit} from ${sourceCycle.name}`,
      });
      newCycleId = newCycle.id;
    }

    // ── Record transfer history on source cycle ──────────────────────────────
    const record: TransferRecord = {
      id: uuidv4(),
      date: today,
      outputType: outputType.label,
      totalQuantity: total,
      unit: outputType.unit,
      soldQuantity: sell,
      soldPricePerUnit: parseFloat(pricePerUnit) || undefined,
      soldRevenue: revenue > 0 ? revenue : undefined,
      transferredQuantity: transfer,
      destinationCycleId: dest === 'existing' ? existingCycleId : newCycleId,
      destinationCycleName: dest === 'existing'
        ? programPhases.find(c => c.id === existingCycleId)?.name
        : newCycleName.trim(),
      newCycleCreated: dest === 'new' && !!newCycleId,
      notes: transferNotes.trim() || undefined,
    };

    updateCycle(sourceCycle.id, {
      transferHistory: [...(sourceCycle.transferHistory ?? []), record],
    });

    // ── If linking to existing planning cycle, pre-populate its units ────────
    if (transfer > 0 && dest === 'existing' && existingCycleId) {
      const existingCycle = programPhases.find(c => c.id === existingCycleId);
      if (existingCycle) {
        updateCycle(existingCycleId, {
          sourceRef: sourceCycle.id,
          productionUnits: [
            ...existingCycle.productionUnits,
            {
              id: uuidv4(),
              enterpriseId: existingCycle.enterpriseId,
              name: `${outputType.label} from ${sourceCycle.name}`,
              type: category === 'poultry' ? 'flock' : 'batch',
              quantity: transfer,
              unit: outputType.unit as any,
              active: true,
            },
          ],
        });
      }
    }

    onTransferComplete(newCycleId);
  }

  const phaseIcon = template?.icon ?? '🌱';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-lg">{phaseIcon}</span>
              <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Transfer Output</span>
            </div>
            <h2 className="font-bold text-slate-900 text-sm leading-snug">{sourceCycle.programPhaseLabel ?? sourceCycle.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Decide what to sell and what moves to the next cycle</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg mt-0.5">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-6 pt-4 pb-2 flex-shrink-0">
          {(['What', 'How to split', 'Where to transfer'] as const).map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === i + 1 ? 'bg-purple-600 text-white' :
                  step > i + 1  ? 'bg-green-500 text-white' :
                  'bg-slate-100 text-slate-400'
                }`}>{step > i + 1 ? '✓' : i + 1}</div>
                <span className={`text-[10px] font-medium ${step === i + 1 ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
              </div>
              {i < 2 && <div className="flex-1 h-px bg-slate-200 mx-2" />}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* ── STEP 1: What output are you transferring? ── */}
          {step === 1 && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-2">Output type</label>
                <div className="grid grid-cols-2 gap-2">
                  {outputOptions.map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => setOutputType(opt)}
                      className={`text-left p-3 rounded-xl border text-sm transition-all ${
                        outputType.label === opt.label
                          ? 'border-purple-500 bg-purple-50 text-purple-800'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">→ {opt.nextSuggestion}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
                  Total available ({outputType.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalQty}
                  onChange={e => setTotalQty(e.target.value)}
                  placeholder={`How many ${outputType.unit} are ready?`}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Enter the total you have ready to decide on — you'll split them in the next step.</p>
              </div>
            </>
          )}

          {/* ── STEP 2: How much to sell / transfer ── */}
          {step === 2 && (
            <>
              {/* Available bar */}
              <div className="flex items-center justify-between p-3 bg-slate-100 rounded-xl">
                <span className="text-xs text-slate-500">Available</span>
                <span className="font-bold text-slate-800">{total.toLocaleString()} <span className="font-normal text-slate-400 text-xs">{outputType.unit}</span></span>
              </div>

              <p className="text-xs text-slate-500 -mt-1">
                Enter any combination — you can sell all, transfer all, or split between the two. Leave either at 0 to skip it.
              </p>

              {/* Sell block */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <div className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                  💰 Sell
                  <button
                    onClick={() => { setSellQty(String(total)); setTransferQty('0'); }}
                    className="ml-auto text-[10px] text-amber-600 hover:text-amber-800 underline font-normal"
                  >
                    Sell all {total}
                  </button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 block mb-1">Qty to sell</label>
                    <input
                      type="number"
                      min="0"
                      max={total}
                      value={sellQty}
                      onChange={e => setSellQty(e.target.value)}
                      placeholder="0"
                      className="w-full border border-amber-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 block mb-1">Price per {outputType.unit} ({currency})</label>
                    <input
                      type="number"
                      min="0"
                      value={pricePerUnit}
                      onChange={e => setPricePerUnit(e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-amber-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
                {sell > 0 && (
                  <div className="text-xs text-amber-700 font-semibold">
                    = {currency} {revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} revenue
                  </div>
                )}
              </div>

              {/* Transfer block */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-3">
                <div className="text-xs font-semibold text-purple-800 flex items-center gap-1.5">
                  🔄 Transfer to next cycle
                  <button
                    onClick={() => { setTransferQty(String(total)); setSellQty('0'); }}
                    className="ml-auto text-[10px] text-purple-600 hover:text-purple-800 underline font-normal"
                  >
                    Transfer all {total}
                  </button>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Qty to transfer</label>
                  <input
                    type="number"
                    min="0"
                    max={total}
                    value={transferQty}
                    onChange={e => setTransferQty(e.target.value)}
                    placeholder="0"
                    className="w-full border border-purple-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              {/* Live balance */}
              {(sellQty !== '' || transferQty !== '') && (
                <div className={`text-xs px-3 py-2.5 rounded-xl flex items-center justify-between ${
                  sell + transfer > total + 0.01
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : sell + transfer === 0
                      ? 'bg-slate-50 text-slate-400 border border-slate-200'
                      : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  <span>
                    {sell > 0 && `${sell} sold`}
                    {sell > 0 && transfer > 0 && ' + '}
                    {transfer > 0 && `${transfer} transferred`}
                    {sell === 0 && transfer === 0 && 'Nothing allocated yet'}
                  </span>
                  <span className="font-semibold">
                    {sell + transfer > total + 0.01
                      ? `Exceeds ${total}!`
                      : total - sell - transfer > 0.01
                        ? `${(total - sell - transfer).toFixed(0)} unallocated`
                        : '✓ All accounted for'}
                  </span>
                </div>
              )}
            </>
          )}

          {/* ── STEP 3: Where does the transfer go? ── */}
          {step === 3 && (
            <>
              {transfer > 0 ? (
                <>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-sm">
                    Transferring <strong>{transfer} {outputType.unit}</strong> of <strong>{outputType.label}</strong>
                    {sell > 0 && <span className="text-slate-500"> · selling {sell} {outputType.unit}{revenue > 0 ? ` for ${currency} ${revenue.toLocaleString()}` : ''}</span>}
                  </div>

                  {/* Existing or new cycle */}
                  {siblingsPlanning.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDest('existing')}
                        className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                          dest === 'existing' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        📋 Add to existing cycle
                      </button>
                      <button
                        onClick={() => setDest('new')}
                        className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                          dest === 'new' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        ✨ Create new cycle
                      </button>
                    </div>
                  )}

                  {dest === 'existing' && siblingsPlanning.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block">Select destination cycle</label>
                      {siblingsPlanning.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setExistingCycleId(c.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            existingCycleId === c.id ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-sm font-medium text-slate-800">{c.programPhaseLabel ?? c.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{c.name} · {c.status}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {dest === 'new' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">New cycle name *</label>
                        <input
                          type="text"
                          value={newCycleName}
                          onChange={e => setNewCycleName(e.target.value)}
                          placeholder={`e.g. ${outputType.nextSuggestion} — ${new Date().getFullYear()}`}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">Phase label (optional)</label>
                        <input
                          type="text"
                          value={newPhaseLabel}
                          onChange={e => setNewPhaseLabel(e.target.value)}
                          placeholder={suggestedLabel}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Leave blank to use: "{suggestedLabel}"</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">Enterprise</label>
                        <select
                          value={newCycleEnterpriseId}
                          onChange={e => setNewCycleEnterpriseId(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          {org.enterprises.filter((e: any) => e.active).map((e: any) => {
                            const t = getTemplate(e.templateId);
                            return <option key={e.id} value={e.id}>{t?.icon} {e.name}</option>;
                          })}
                        </select>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                        <div className="font-semibold text-slate-700">New cycle will start with:</div>
                        <div>• <strong>{transfer} {outputType.unit}</strong> of {outputType.label}</div>
                        <div>• Linked to <strong>{sourceCycle.programName}</strong> as Phase {suggestedPhaseNum}</div>
                        <div>• Status: <em>Planning</em> — activate when ready</div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">Notes (optional)</label>
                    <textarea
                      value={transferNotes}
                      onChange={e => setTransferNotes(e.target.value)}
                      rows={2}
                      placeholder="Any notes about this transfer decision…"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                  </div>
                </>
              ) : (
                /* Sell-only confirmation */
                <div className="space-y-3">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-sm">
                    <div className="font-semibold text-amber-800">Sale summary</div>
                    <div className="flex justify-between"><span className="text-slate-600">Output</span><span className="font-medium">{outputType.label}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Quantity</span><span className="font-medium">{sell} {outputType.unit}</span></div>
                    {pricePerUnit && <div className="flex justify-between"><span className="text-slate-600">Price per unit</span><span className="font-medium">{currency} {parseFloat(pricePerUnit).toLocaleString()}</span></div>}
                    {revenue > 0 && <div className="flex justify-between border-t border-amber-200 pt-2"><span className="font-semibold text-amber-800">Total revenue</span><span className="font-bold text-amber-900">{currency} {revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">Notes (optional)</label>
                    <textarea
                      value={transferNotes}
                      onChange={e => setTransferNotes(e.target.value)}
                      rows={2}
                      placeholder="Buyer name, delivery notes…"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex-shrink-0">
          <button
            onClick={() => step > 1 ? setStep((step - 1) as 1 | 2 | 3) : onClose()}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-white"
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep((step + 1) as 2 | 3)}
              disabled={step === 1 ? !step1Valid : !step2Valid}
              className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={!step3Valid}
              className="px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ✓ Confirm Transfer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New Cycle Wizard — 3-step, fully category-aware
// ─────────────────────────────────────────────────────────────────────────────
function NewCycleModal({ enterprises, defaultEnterpriseId, onSave, onClose }: {
  enterprises: any[];
  defaultEnterpriseId?: string;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  // ── Wizard state ─────────────────────────────────────────────────────────────
  const [step, setStep]             = useState<1 | 2 | 3>(1);
  const [enterpriseId, setEnterpriseId] = useState(defaultEnterpriseId ?? enterprises[0]?.id ?? '');
  const [variantId, setVariantId]   = useState('');
  const [cycleName, setCycleName]   = useState('');
  const [startDate, setStart]       = useState(new Date().toISOString().slice(0, 10));
  const [expectedEnd, setExpEnd]    = useState('');
  const [notes, setNotes]           = useState('');
  const [setupValues, setSetupValues] = useState<Record<string, string>>({});

  const selectedEnt = enterprises.find((e: any) => e.id === enterpriseId);
  const template    = getTemplate(selectedEnt?.templateId ?? '');
  const category    = template?.category ?? 'crops';

  const variants    = CYCLE_VARIANTS[category] ?? CYCLE_VARIANTS.crops;
  const selectedVariant = variants.find(v => v.id === variantId) ?? variants[0];
  const setupFields = (CATEGORY_SETUP_FIELDS[category] ?? []).filter(f =>
    !f.visibleFor || f.visibleFor.includes(selectedVariant?.id ?? '')
  );

  // Auto-set defaults when enterprise or variant changes
  React.useEffect(() => {
    if (!template) return;
    const v = variants[0];
    setVariantId(v.id);
    const month = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
    setCycleName(`${template.shortName ?? template.name} ${month}`);
    // Auto-set expected end based on variant duration
    const end = new Date(startDate);
    end.setDate(end.getDate() + (v?.defaultDays ?? 90));
    setExpEnd(end.toISOString().slice(0, 10));
    setSetupValues({});
  }, [enterpriseId]);

  React.useEffect(() => {
    if (!selectedVariant) return;
    const end = new Date(startDate);
    end.setDate(end.getDate() + selectedVariant.defaultDays);
    setExpEnd(end.toISOString().slice(0, 10));
  }, [variantId, startDate]);

  function setSetup(id: string, val: string) {
    setSetupValues(prev => ({ ...prev, [id]: val }));
  }

  function buildProductionUnits() {
    // Build production units from setup values
    const units: any[] = [];

    if (category === 'poultry') {
      const isIncubation = selectedVariant?.id === 'incubation';
      const qty = parseFloat(setupValues[isIncubation ? 'egg_count' : 'bird_count'] ?? '0');
      if (qty > 0) {
        units.push({
          id: uuidv4(), enterpriseId,
          name: isIncubation ? 'Eggs Set' : `Flock — ${selectedVariant?.label}`,
          type: 'initial',
          quantity: qty,
          unit: isIncubation ? 'eggs' : 'birds',
          breed: setupValues['breed'] || undefined,
          location: setupValues['house_pen'] || undefined,
          active: true,
        });
      }
    } else if (category === 'livestock') {
      const qty = parseFloat(setupValues['head_count'] ?? '0');
      if (qty > 0) units.push({ id: uuidv4(), enterpriseId, name: `Herd — ${selectedVariant?.label}`, type: 'initial', quantity: qty, unit: 'head', breed: setupValues['breed'] || undefined, location: setupValues['pen_location'] || undefined, active: true });
    } else if (category === 'aquaculture') {
      const qty = parseFloat(setupValues['fingerlings'] ?? '0');
      if (qty > 0) units.push({ id: uuidv4(), enterpriseId, name: `Stock — ${setupValues['species_variant'] || 'Fingerlings'}`, type: 'initial', quantity: qty, unit: 'fish', location: `${setupValues['pond_count'] ?? '?'} ponds`, active: true });
    } else if (category === 'crops' || category === 'horticulture') {
      const qty = parseFloat(setupValues['area_ha'] ?? '0');
      if (qty > 0) units.push({ id: uuidv4(), enterpriseId, name: setupValues['field_id'] || 'Field', type: 'initial', quantity: qty, unit: 'ha', breed: setupValues['variety'] || undefined, active: true });
    } else if (category === 'greenhouse') {
      const qty = parseFloat(setupValues['growing_area_m2'] ?? '0');
      if (qty > 0) units.push({ id: uuidv4(), enterpriseId, name: setupValues['structure_name'] || 'Greenhouse', type: 'initial', quantity: qty, unit: 'm2', breed: setupValues['variety'] || undefined, active: true });
    } else if (category === 'orchard') {
      const qty = parseFloat(setupValues['tree_count'] ?? '0');
      if (qty > 0) units.push({ id: uuidv4(), enterpriseId, name: setupValues['plot_name'] || 'Orchard Plot', type: 'initial', quantity: qty, unit: 'trees', breed: setupValues['variety'] || undefined, active: true });
    } else if (category === 'apiary') {
      const qty = parseFloat(setupValues['hive_count'] ?? '0');
      if (qty > 0) units.push({ id: uuidv4(), enterpriseId, name: setupValues['apiary_location'] || 'Apiary', type: 'initial', quantity: qty, unit: 'hives', active: true });
    } else if (category === 'mushroom') {
      const qty = parseFloat(setupValues['block_count'] ?? '0');
      if (qty > 0) units.push({ id: uuidv4(), enterpriseId, name: `${setupValues['substrate'] || 'Substrate'} Blocks`, type: 'initial', quantity: qty, unit: 'blocks', location: setupValues['growing_room'] || undefined, active: true });
    } else if (category === 'processing') {
      const qty = parseFloat(setupValues['raw_material_kg'] ?? '0');
      if (qty > 0) units.push({ id: uuidv4(), enterpriseId, name: setupValues['raw_material_name'] || 'Raw Material', type: 'initial', quantity: qty, unit: 'kg', location: setupValues['processing_line'] || undefined, active: true });
    } else if (category === 'services') {
      units.push({ id: uuidv4(), enterpriseId, name: setupValues['client_name'] || 'Client', type: 'initial', quantity: 1, unit: 'contract', active: true });
    }

    return units;
  }

  function save() {
    const productionUnits = buildProductionUnits();
    // Build notes from setup values + user notes
    const configSummary = Object.entries(setupValues)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
      .join(', ');
    onSave({
      enterpriseId,
      name: cycleName.trim() || `${template?.shortName ?? 'Cycle'} 1`,
      variantId: variantId || variants[0]?.id,
      setupValues,
      startDate,
      expectedEndDate: expectedEnd || undefined,
      status: 'active' as const,
      currentStageId: '',
      productionUnits,
      notes: [notes, configSummary ? `Config: ${configSummary}` : '', `Cycle type: ${selectedVariant?.label}`].filter(Boolean).join('\n') || undefined,
    });
  }

  const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';

  const step1Valid = !!enterpriseId && !!variantId;
  const step2Valid = true; // optional fields only; required validation is visual only
  const step3Valid = !!cycleName.trim() && !!startDate;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 className="font-bold text-slate-900">New Production Cycle</h3>
            <div className="flex items-center gap-2 mt-1">
              {[1,2,3].map(s => (
                <div key={s} className={`h-1.5 rounded-full transition-all ${s === step ? 'w-8 bg-green-500' : s < step ? 'w-4 bg-green-300' : 'w-4 bg-slate-200'}`} />
              ))}
              <span className="text-xs text-slate-400 ml-1">Step {step} of 3</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── STEP 1: Enterprise + Cycle Variant ─────────────────────────── */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Which enterprise?</label>
                <div className="space-y-1.5">
                  {enterprises.map((e: any) => {
                    const tpl = getTemplate(e.templateId);
                    const isSelected = e.id === enterpriseId;
                    return (
                      <button key={e.id} onClick={() => setEnterpriseId(e.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSelected ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <span className="text-2xl">{tpl?.icon ?? '🌱'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-slate-800">{e.name}</div>
                          <div className="text-xs text-slate-400 truncate">{tpl?.name}</div>
                        </div>
                        {isSelected && <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"><span className="text-white text-[10px]">✓</span></div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {template && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">What type of cycle?</label>
                  <div className="space-y-2">
                    {variants.map(v => {
                      const isSelected = (variantId || variants[0].id) === v.id;
                      return (
                        <button key={v.id} onClick={() => setVariantId(v.id)}
                          className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${isSelected ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                          <span className="text-xl flex-shrink-0 mt-0.5">{v.icon}</span>
                          <div className="flex-1">
                            <div className={`font-medium text-sm ${isSelected ? 'text-green-800' : 'text-slate-800'}`}>{v.label}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{v.description}</div>
                            <div className="text-[10px] text-slate-400 mt-1">~{v.defaultDays} days</div>
                          </div>
                          {isSelected && <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-white text-[10px]">✓</span></div>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Template stages preview */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-2">Stages from template</div>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {template.stages.map((s, i) => (
                        <React.Fragment key={s.id}>
                          <span className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700">{s.name}</span>
                          {i < template.stages.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── STEP 2: Category-specific setup ────────────────────────────── */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <span className="text-2xl">{template?.icon}</span>
                <div>
                  <div className="font-semibold text-sm text-slate-800">{selectedVariant?.label}</div>
                  <div className="text-xs text-slate-500">{selectedEnt?.name}</div>
                </div>
              </div>

              {setupFields.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No additional setup required for this cycle type. Continue to step 3.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {setupFields.map(field => (
                    <div key={field.id} className={field.type === 'boolean' ? 'col-span-2' : (field.id === 'egg_routing' || field.id === 'feeding_system' || field.id === 'irrigation' || field.id === 'service_scope' || field.id === 'growing_system' ? 'col-span-2' : '')}>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-400 ml-0.5">*</span>}
                        {field.unit && <span className="text-slate-400 font-normal ml-1">({field.unit})</span>}
                      </label>
                      {field.hint && <p className="text-[10px] text-slate-400 mb-1">{field.hint}</p>}
                      {field.type === 'select' ? (
                        <select value={setupValues[field.id] ?? ''} onChange={e => setSetup(field.id, e.target.value)} className={inputCls}>
                          <option value="">— select —</option>
                          {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : field.type === 'boolean' ? (
                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                          <input type="checkbox" checked={setupValues[field.id] === 'true'} onChange={e => setSetup(field.id, String(e.target.checked))} className="w-4 h-4 rounded border-slate-300 text-green-600" />
                          {field.label}
                        </label>
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : 'text'}
                          step={field.type === 'number' ? 'any' : undefined}
                          placeholder={field.placeholder ?? ''}
                          value={setupValues[field.id] ?? ''}
                          onChange={e => setSetup(field.id, e.target.value)}
                          className={inputCls}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── STEP 3: Name, dates, notes, confirm ────────────────────────── */}
          {step === 3 && (
            <>
              {/* Summary of what was set up */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{template?.icon}</span>
                  <div>
                    <div className="font-semibold text-sm text-green-900">{selectedVariant?.label}</div>
                    <div className="text-xs text-green-700">{selectedEnt?.name} · {template?.name}</div>
                  </div>
                </div>
                {Object.entries(setupValues).filter(([,v]) => v).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(setupValues).filter(([,v]) => v).slice(0, 6).map(([k, v]) => (
                      <span key={k} className="text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                        {k.replace(/_/g, ' ')}: {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Cycle name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Cycle Name *</label>
                <input type="text" value={cycleName} onChange={e => setCycleName(e.target.value)}
                  placeholder="e.g. Broiler Batch 1 — Aug 2026"
                  className={inputCls} />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Date *</label>
                  <input type="date" value={startDate} onChange={e => setStart(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Expected End <span className="font-normal text-slate-400">(auto)</span></label>
                  <input type="date" value={expectedEnd} onChange={e => setExpEnd(e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Notes <span className="font-normal text-slate-400">(optional)</span></label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  placeholder="Supplier, source, any initial observations, special instructions..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
            </>
          )}
        </div>

        {/* Footer nav */}
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
          {step > 1 ? (
            <button onClick={() => setStep(s => (s - 1) as 1|2|3)}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
              ← Back
            </button>
          ) : (
            <button onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(s => (s + 1) as 1|2|3)}
              disabled={step === 1 && !step1Valid}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-40">
              Next →
            </button>
          ) : (
            <button
              onClick={save}
              disabled={!step3Valid}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-40">
              🚀 Start Cycle
            </button>
          )}
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
