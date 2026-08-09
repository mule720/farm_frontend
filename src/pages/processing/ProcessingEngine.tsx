// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Processing Engine
// Handles: processing batches, recipes, yield tracking, finished goods routing
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useOrg } from '@/store/orgStore';
import {
  Plus, X, ChevronRight, CheckCircle2, Clock, Package,
  BarChart3, TrendingUp, Cpu, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { ProcessingBatch, ProcessingRecipe, OutputRouting } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// ─── Built-in recipe templates ────────────────────────────────────────────────
const DEFAULT_RECIPES: ProcessingRecipe[] = [
  {
    id: 'maize_milling',
    orgId: '',
    name: 'Maize Milling',
    description: 'Dry maize grain → maize meal + bran + germ',
    inputs: [
      { materialTypeId: 'maize_grain', materialName: 'Maize Grain', quantityPer100kg: 100, unit: 'kg' },
    ],
    outputs: [
      { materialTypeId: 'maize_meal',  materialName: 'Maize Meal',  expectedYieldPct: 68, unit: 'kg', type: 'main' },
      { materialTypeId: 'maize_bran',  materialName: 'Maize Bran',  expectedYieldPct: 22, unit: 'kg', type: 'byproduct' },
      { materialTypeId: 'maize_germ',  materialName: 'Maize Germ',  expectedYieldPct: 6,  unit: 'kg', type: 'byproduct' },
      { materialTypeId: 'waste',       materialName: 'Waste/Dust',  expectedYieldPct: 4,  unit: 'kg', type: 'waste' },
    ],
    steps: ['Clean & de-stone grain', 'Mill to required fineness', 'Sieve and grade', 'Bag finished product'],
    laborHoursPerBatch: 4,
    equipment: ['Hammer mill', 'Sieve', 'Bagging scale'],
    active: true,
  },
  {
    id: 'dairy_pasteurisation',
    orgId: '',
    name: 'Milk Pasteurisation',
    description: 'Raw milk → pasteurised milk',
    inputs: [
      { materialTypeId: 'raw_milk', materialName: 'Raw Milk', quantityPer100kg: 100, unit: 'litre' },
    ],
    outputs: [
      { materialTypeId: 'pasteurised_milk', materialName: 'Pasteurised Milk', expectedYieldPct: 97, unit: 'litre', type: 'main' },
      { materialTypeId: 'cream',             materialName: 'Cream',             expectedYieldPct: 2,  unit: 'litre', type: 'byproduct' },
      { materialTypeId: 'waste_milk',        materialName: 'Waste',             expectedYieldPct: 1,  unit: 'litre', type: 'waste' },
    ],
    steps: ['Receive & test raw milk', 'Pasteurise at 72°C for 15s', 'Cool to 4°C', 'Package & label'],
    laborHoursPerBatch: 2,
    equipment: ['Pasteuriser', 'Cooling tank', 'Packaging machine'],
    active: true,
  },
  {
    id: 'yoghurt',
    orgId: '',
    name: 'Yoghurt Production',
    description: 'Pasteurised milk → natural yoghurt',
    inputs: [
      { materialTypeId: 'pasteurised_milk', materialName: 'Pasteurised Milk', quantityPer100kg: 100, unit: 'litre' },
      { materialTypeId: 'starter_culture',   materialName: 'Starter Culture',  quantityPer100kg: 2,   unit: 'g' },
      { materialTypeId: 'sugar',             materialName: 'Sugar (opt.)',      quantityPer100kg: 5,   unit: 'kg' },
    ],
    outputs: [
      { materialTypeId: 'yoghurt', materialName: 'Yoghurt', expectedYieldPct: 95, unit: 'litre', type: 'main' },
      { materialTypeId: 'whey',    materialName: 'Whey',    expectedYieldPct: 5,  unit: 'litre', type: 'byproduct' },
    ],
    steps: ['Heat milk to 85°C', 'Cool to 42°C', 'Add starter culture', 'Incubate 4–6 hrs', 'Cool & package'],
    laborHoursPerBatch: 6,
    active: true,
  },
  {
    id: 'broiler_processing',
    orgId: '',
    name: 'Broiler Processing',
    description: 'Live broilers → whole birds / cuts / offal',
    inputs: [
      { materialTypeId: 'live_broiler', materialName: 'Live Broilers', quantityPer100kg: 100, unit: 'kg' },
    ],
    outputs: [
      { materialTypeId: 'whole_bird',   materialName: 'Whole Dressed Bird', expectedYieldPct: 70, unit: 'kg', type: 'main' },
      { materialTypeId: 'offal',        materialName: 'Offal (liver/giz.)', expectedYieldPct: 8,  unit: 'kg', type: 'byproduct' },
      { materialTypeId: 'feathers',     materialName: 'Feathers',           expectedYieldPct: 8,  unit: 'kg', type: 'byproduct' },
      { materialTypeId: 'blood_bone',   materialName: 'Blood & Bone',       expectedYieldPct: 14, unit: 'kg', type: 'waste' },
    ],
    steps: ['Slaughter & bleed', 'Scald & defeather', 'Eviscerate', 'Wash & chill', 'Grade & pack'],
    laborHoursPerBatch: 3,
    equipment: ['Scalder', 'Defeathering machine', 'Chiller'],
    active: true,
  },
  {
    id: 'tomato_sauce',
    orgId: '',
    name: 'Tomato Sauce / Passata',
    description: 'Fresh tomatoes → tomato sauce or paste',
    inputs: [
      { materialTypeId: 'fresh_tomato', materialName: 'Fresh Tomatoes', quantityPer100kg: 100, unit: 'kg' },
      { materialTypeId: 'salt',         materialName: 'Salt',           quantityPer100kg: 1.5, unit: 'kg' },
    ],
    outputs: [
      { materialTypeId: 'tomato_sauce', materialName: 'Tomato Sauce',  expectedYieldPct: 55, unit: 'kg', type: 'main' },
      { materialTypeId: 'tomato_skin',  materialName: 'Skin & Seeds',  expectedYieldPct: 12, unit: 'kg', type: 'byproduct' },
      { materialTypeId: 'evaporation',  materialName: 'Water Loss',    expectedYieldPct: 33, unit: 'kg', type: 'waste' },
    ],
    steps: ['Wash & sort', 'Crush & heat', 'Pass through sieve', 'Cook down', 'Fill & seal jars'],
    laborHoursPerBatch: 5,
    active: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Store extension for processing (localStorage-backed)
// ─────────────────────────────────────────────────────────────────────────────
const BATCH_KEY = 'agronexus_v2_batches';
const RECIPE_KEY = 'agronexus_v2_recipes';

function useBatches() {
  const [batches, setBatches] = React.useState<ProcessingBatch[]>(() => {
    try { return JSON.parse(localStorage.getItem(BATCH_KEY) ?? '[]'); } catch { return []; }
  });
  const [recipes, setRecipes] = React.useState<ProcessingRecipe[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RECIPE_KEY) ?? '[]') as ProcessingRecipe[];
      // Merge defaults (only add if id not already saved)
      const savedIds = new Set(saved.map(r => r.id));
      return [...saved, ...DEFAULT_RECIPES.filter(r => !savedIds.has(r.id))];
    } catch { return DEFAULT_RECIPES; }
  });

  React.useEffect(() => { localStorage.setItem(BATCH_KEY, JSON.stringify(batches)); }, [batches]);
  React.useEffect(() => {
    const custom = recipes.filter(r => !DEFAULT_RECIPES.find(d => d.id === r.id));
    localStorage.setItem(RECIPE_KEY, JSON.stringify(custom));
  }, [recipes]);

  function addBatch(batch: Omit<ProcessingBatch, 'id'>) {
    const b = { ...batch, id: uuidv4() };
    setBatches(prev => [...prev, b]);
    return b;
  }
  function updateBatch(id: string, patch: Partial<ProcessingBatch>) {
    setBatches(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  }
  function addRecipe(recipe: Omit<ProcessingRecipe, 'id'>) {
    const r = { ...recipe, id: uuidv4() };
    setRecipes(prev => [...prev, r]);
    return r;
  }

  return { batches, recipes, addBatch, updateBatch, addRecipe };
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────
export default function ProcessingEngine() {
  const { batches, recipes, addBatch, updateBatch } = useBatches();
  const [tab, setTab] = useState<'batches' | 'recipes'>('batches');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [showNewBatch, setShowNewBatch] = useState(false);

  const grouped = {
    active:    batches.filter(b => b.status === 'in_progress'),
    planned:   batches.filter(b => b.status === 'planned'),
    completed: batches.filter(b => b.status === 'completed'),
    failed:    batches.filter(b => b.status === 'failed'),
  };
  const selectedBatch = selectedBatchId ? batches.find(b => b.id === selectedBatchId) : null;
  const selectedRecipe = selectedBatch ? recipes.find(r => r.id === selectedBatch.recipeId) : null;

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className={`${selectedBatch ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 border-r border-slate-200 bg-white`}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-slate-900">Processing Engine</h2>
              <p className="text-xs text-slate-500">{batches.length} batch{batches.length !== 1 ? 'es' : ''}</p>
            </div>
            <button onClick={() => setShowNewBatch(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700">
              <Plus className="w-3.5 h-3.5" /> New Batch
            </button>
          </div>
          {/* Sub-tabs */}
          <div className="flex gap-1">
            {(['batches', 'recipes'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${tab === t ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {tab === 'batches' ? (
            <>
              {grouped.active.length > 0   && <SLabel label="In Progress" count={grouped.active.length}   color="purple" />}
              {grouped.active.map(b   => <BatchRow key={b.id} batch={b} selected={selectedBatchId === b.id} onClick={() => setSelectedBatchId(b.id)} />)}
              {grouped.planned.length > 0  && <SLabel label="Planned"     count={grouped.planned.length}  color="blue" />}
              {grouped.planned.map(b  => <BatchRow key={b.id} batch={b} selected={selectedBatchId === b.id} onClick={() => setSelectedBatchId(b.id)} />)}
              {grouped.completed.length > 0 && <SLabel label="Completed"  count={grouped.completed.length} color="slate" />}
              {grouped.completed.map(b => <BatchRow key={b.id} batch={b} selected={selectedBatchId === b.id} onClick={() => setSelectedBatchId(b.id)} />)}
              {grouped.failed.length > 0   && <SLabel label="Failed"      count={grouped.failed.length}    color="red" />}
              {grouped.failed.map(b   => <BatchRow key={b.id} batch={b} selected={selectedBatchId === b.id} onClick={() => setSelectedBatchId(b.id)} />)}
              {batches.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Cpu className="w-8 h-8 mx-auto mb-3 opacity-25" />
                  <p className="text-sm">No batches yet.</p>
                  <p className="text-xs mt-1">Start your first processing batch.</p>
                </div>
              )}
            </>
          ) : (
            <RecipeList recipes={recipes} onStartBatch={r => { setTab('batches'); setShowNewBatch(true); }} />
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className={`${selectedBatch ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-slate-50 min-w-0`}>
        {selectedBatch ? (
          <BatchDetail
            batch={selectedBatch}
            recipe={selectedRecipe}
            onClose={() => setSelectedBatchId(null)}
            onUpdate={(patch) => updateBatch(selectedBatch.id, patch)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">Select a batch to view details</p>
          </div>
        )}
      </div>

      {showNewBatch && (
        <NewBatchModal
          recipes={recipes}
          onSave={(data) => { const b = addBatch(data); setSelectedBatchId(b.id); setShowNewBatch(false); }}
          onClose={() => setShowNewBatch(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Batch Row
// ─────────────────────────────────────────────────────────────────────────────
function BatchRow({ batch, selected, onClick }: { batch: ProcessingBatch; selected: boolean; onClick: () => void }) {
  const statusColors: Record<string, string> = {
    planned: 'bg-blue-400', in_progress: 'bg-purple-500', completed: 'bg-green-500', failed: 'bg-red-400',
  };
  const yieldColor = batch.actualYieldPct
    ? batch.actualYieldPct >= 90 ? 'text-green-600' : batch.actualYieldPct >= 75 ? 'text-amber-600' : 'text-red-500'
    : 'text-slate-400';

  return (
    <button onClick={onClick}
      className={`w-full text-left p-3 rounded-xl transition-all ${selected ? 'bg-purple-50 border border-purple-200' : 'hover:bg-slate-50 border border-transparent'}`}>
      <div className="flex items-start gap-2.5">
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${statusColors[batch.status] ?? 'bg-slate-400'}`} />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-slate-800 truncate">{batch.batchNumber}</div>
          <div className="text-xs text-slate-500 mt-0.5 truncate">{batch.recipeName}</div>
          <div className="text-xs mt-1 flex items-center gap-3">
            <span className="text-slate-400">{new Date(batch.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
            {batch.actualYieldPct !== undefined && (
              <span className={`font-semibold ${yieldColor}`}>{batch.actualYieldPct.toFixed(1)}% yield</span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Recipe List
// ─────────────────────────────────────────────────────────────────────────────
function RecipeList({ recipes, onStartBatch }: { recipes: ProcessingRecipe[]; onStartBatch: (r: ProcessingRecipe) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      {recipes.map(r => {
        const expanded = expandedId === r.id;
        return (
          <div key={r.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button onClick={() => setExpandedId(expanded ? null : r.id)}
              className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-slate-50">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-slate-800">{r.name}</div>
                {r.description && <div className="text-xs text-slate-400 mt-0.5">{r.description}</div>}
              </div>
              {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {expanded && (
              <div className="border-t border-slate-100 p-3.5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">Inputs</div>
                    {r.inputs.map((inp, i) => (
                      <div key={i} className="text-xs text-slate-700">{inp.quantityPer100kg} {inp.unit} {inp.materialName}</div>
                    ))}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">Outputs</div>
                    {r.outputs.map((out, i) => (
                      <div key={i} className={`text-xs ${out.type === 'waste' ? 'text-slate-400' : out.type === 'byproduct' ? 'text-amber-700' : 'text-green-700'}`}>
                        {out.expectedYieldPct}% → {out.materialName}
                      </div>
                    ))}
                  </div>
                </div>
                {r.steps.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Steps</div>
                    <ol className="list-decimal list-inside space-y-0.5">
                      {r.steps.map((s, i) => <li key={i} className="text-xs text-slate-600">{s}</li>)}
                    </ol>
                  </div>
                )}
                <button onClick={() => onStartBatch(r)}
                  className="w-full py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700">
                  Start batch with this recipe
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Batch Detail
// ─────────────────────────────────────────────────────────────────────────────
type BTab = 'summary' | 'inputs' | 'outputs' | 'quality' | 'costs';

function BatchDetail({ batch, recipe, onClose, onUpdate }: {
  batch: ProcessingBatch;
  recipe: ProcessingRecipe | undefined;
  onClose: () => void;
  onUpdate: (patch: Partial<ProcessingBatch>) => void;
}) {
  const [tab, setTab] = useState<BTab>('summary');

  const statusConfig: Record<string, { label: string; color: string }> = {
    planned:     { label: 'Planned',     color: 'bg-blue-100 text-blue-700' },
    in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-700' },
    completed:   { label: 'Completed',   color: 'bg-green-100 text-green-700' },
    failed:      { label: 'Failed',      color: 'bg-red-100 text-red-700' },
  };
  const sc = statusConfig[batch.status];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900">{batch.batchNumber}</h2>
            <div className="text-xs text-slate-500 mt-0.5">{batch.recipeName}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc?.color ?? ''}`}>{sc?.label}</span>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg lg:hidden"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Started {new Date(batch.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          {batch.endDate && <span>Ended {new Date(batch.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
          {batch.actualYieldPct !== undefined && (
            <span className={`font-semibold ${batch.actualYieldPct >= 90 ? 'text-green-600' : batch.actualYieldPct >= 75 ? 'text-amber-600' : 'text-red-500'}`}>
              Yield: {batch.actualYieldPct.toFixed(1)}%
            </span>
          )}
          {batch.qualityStatus && (
            <span className={`font-medium ${batch.qualityStatus === 'pass' ? 'text-green-600' : batch.qualityStatus === 'fail' ? 'text-red-500' : 'text-amber-600'}`}>
              QC: {batch.qualityStatus}
            </span>
          )}
        </div>

        {/* Status actions */}
        {batch.status === 'planned' && (
          <button onClick={() => onUpdate({ status: 'in_progress', startDate: new Date().toISOString().slice(0, 10) })}
            className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700">
            ▶ Start Processing
          </button>
        )}

        {/* Tabs */}
        <div className="flex gap-0.5 mt-4 overflow-x-auto">
          {(['summary', 'inputs', 'outputs', 'quality', 'costs'] as BTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-lg capitalize transition-colors ${tab === t ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'summary'  && <SummaryTab  batch={batch} recipe={recipe} onUpdate={onUpdate} />}
        {tab === 'inputs'   && <InputsTab   batch={batch} recipe={recipe} onUpdate={onUpdate} />}
        {tab === 'outputs'  && <OutputsTab  batch={batch} recipe={recipe} onUpdate={onUpdate} />}
        {tab === 'quality'  && <QualityTab  batch={batch} onUpdate={onUpdate} />}
        {tab === 'costs'    && <CostsTab    batch={batch} onUpdate={onUpdate} />}
      </div>
    </div>
  );
}

// ─── Summary Tab ──────────────────────────────────────────────────────────────
function SummaryTab({ batch, recipe, onUpdate }: { batch: ProcessingBatch; recipe?: ProcessingRecipe; onUpdate: (p: Partial<ProcessingBatch>) => void }) {
  const totalInput   = batch.actualInputs.reduce((s, i) => s + (i.actualQty ?? 0), 0);
  const totalOutput  = batch.actualOutputs.reduce((s, o) => s + (o.actualQty ?? 0), 0);
  const mainOutput   = batch.actualOutputs.filter(o => o.type === 'main').reduce((s, o) => s + (o.actualQty ?? 0), 0);
  const yieldPct     = totalInput > 0 ? (totalOutput / totalInput) * 100 : undefined;
  const mainYieldPct = totalInput > 0 ? (mainOutput / totalInput) * 100 : undefined;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard2 label="Total Input"  value={`${totalInput.toFixed(1)} ${batch.actualInputs[0]?.unit ?? 'kg'}`} icon="📥" />
        <StatCard2 label="Total Output" value={`${totalOutput.toFixed(1)} ${batch.actualOutputs[0]?.unit ?? 'kg'}`} icon="📦" />
        <StatCard2 label="Overall Yield" value={yieldPct !== undefined ? `${yieldPct.toFixed(1)}%` : '—'}
          icon="📊" highlight={yieldPct !== undefined ? (yieldPct >= 90 ? 'green' : yieldPct >= 75 ? 'amber' : 'red') : undefined} />
        <StatCard2 label="Main Product Yield" value={mainYieldPct !== undefined ? `${mainYieldPct.toFixed(1)}%` : '—'}
          icon="🎯" highlight={mainYieldPct !== undefined ? (mainYieldPct >= 65 ? 'green' : 'amber') : undefined} />
      </div>

      {recipe && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Recipe: {recipe.name}</h3>
          {recipe.description && <p className="text-xs text-slate-500 mb-3">{recipe.description}</p>}
          <div className="space-y-1">
            {recipe.steps.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                <span className="w-5 h-5 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                {s}
              </div>
            ))}
          </div>
          {recipe.laborHoursPerBatch && <div className="text-xs text-slate-400 mt-3">Est. labour: {recipe.laborHoursPerBatch} hrs/batch</div>}
        </div>
      )}

      {/* Complete batch */}
      {batch.status === 'in_progress' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">Complete Batch</h3>
          <p className="text-xs text-slate-500">Fill in actual inputs and outputs on those tabs, then complete the batch.</p>
          <div className="flex gap-2">
            <button onClick={() => onUpdate({ status: 'completed', endDate: new Date().toISOString().slice(0, 10), actualYieldPct: yieldPct, qualityStatus: 'pending' })}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              ✓ Mark Completed
            </button>
            <button onClick={() => onUpdate({ status: 'failed', endDate: new Date().toISOString().slice(0, 10) })}
              className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">
              ✗ Mark Failed
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inputs Tab ───────────────────────────────────────────────────────────────
function InputsTab({ batch, recipe, onUpdate }: { batch: ProcessingBatch; recipe?: ProcessingRecipe; onUpdate: (p: Partial<ProcessingBatch>) => void }) {
  const [inputs, setInputs] = useState(
    batch.actualInputs.length > 0
      ? batch.actualInputs
      : (recipe?.inputs ?? []).map(i => ({ ...i, actualQty: 0 }))
  );

  function save() {
    onUpdate({ actualInputs: inputs });
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">Actual Inputs</h3>
        <div className="space-y-2">
          {inputs.map((inp, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5 text-sm text-slate-700">{inp.materialName}</div>
              <div className="col-span-4">
                <input type="number" step="any" value={inp.actualQty || ''}
                  onChange={e => setInputs(ins => ins.map((x, j) => j === i ? { ...x, actualQty: parseFloat(e.target.value) || 0 } : x))}
                  placeholder="0"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="col-span-3 text-xs text-slate-400">{inp.unit}</div>
            </div>
          ))}
        </div>
        <button onClick={save} className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
          Save Inputs
        </button>
      </div>
    </div>
  );
}

// ─── Outputs Tab ──────────────────────────────────────────────────────────────
function OutputsTab({ batch, recipe, onUpdate }: { batch: ProcessingBatch; recipe?: ProcessingRecipe; onUpdate: (p: Partial<ProcessingBatch>) => void }) {
  const [outputs, setOutputs] = useState(
    batch.actualOutputs.length > 0
      ? batch.actualOutputs
      : (recipe?.outputs ?? []).map(o => ({ ...o, actualQty: 0 }))
  );
  const totalInput = batch.actualInputs.reduce((s, i) => s + (i.actualQty ?? 0), 0);

  function save() {
    const totalOut = outputs.reduce((s, o) => s + (o.actualQty ?? 0), 0);
    const yieldPct = totalInput > 0 ? (totalOut / totalInput) * 100 : undefined;
    onUpdate({ actualOutputs: outputs, actualYieldPct: yieldPct });
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">Actual Outputs</h3>
        {totalInput === 0 && (
          <div className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Enter actual inputs first to calculate yield.</div>
        )}
        <div className="space-y-2">
          {outputs.map((out, i) => {
            const expectedQty = totalInput > 0 ? (out.expectedYieldPct / 100) * totalInput : null;
            const actual = out.actualQty ?? 0;
            const diff = expectedQty !== null && actual > 0 ? ((actual - expectedQty) / expectedQty) * 100 : null;
            return (
              <div key={i} className="space-y-1">
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <div className="text-sm text-slate-700">{out.materialName}</div>
                    <div className={`text-[10px] ${out.type === 'main' ? 'text-green-600' : out.type === 'byproduct' ? 'text-amber-600' : 'text-slate-400'}`}>
                      {out.type} · target {out.expectedYieldPct}%{expectedQty ? ` (${expectedQty.toFixed(1)} ${out.unit})` : ''}
                    </div>
                  </div>
                  <div className="col-span-4">
                    <input type="number" step="any" value={actual || ''}
                      onChange={e => setOutputs(outs => outs.map((x, j) => j === i ? { ...x, actualQty: parseFloat(e.target.value) || 0 } : x))}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div className="col-span-2 text-xs text-slate-400">{out.unit}</div>
                  <div className="col-span-2 text-xs text-right">
                    {diff !== null && actual > 0 && (
                      <span className={diff >= 0 ? 'text-green-600' : 'text-red-500'}>{diff >= 0 ? '+' : ''}{diff.toFixed(1)}%</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={save} className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
          Save Outputs & Calculate Yield
        </button>
      </div>
    </div>
  );
}

// ─── Quality Tab ──────────────────────────────────────────────────────────────
function QualityTab({ batch, onUpdate }: { batch: ProcessingBatch; onUpdate: (p: Partial<ProcessingBatch>) => void }) {
  const [status, setStatus] = useState<'pass' | 'fail' | 'pending'>(batch.qualityStatus ?? 'pending');
  const [notes, setNotes] = useState('');

  return (
    <div className="space-y-4 max-w-md">
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Quality Control</h3>
        <div className="grid grid-cols-3 gap-2">
          {(['pass', 'pending', 'fail'] as const).map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`py-2.5 rounded-xl text-sm font-medium capitalize border transition-all ${
                status === s
                  ? s === 'pass'    ? 'bg-green-600 text-white border-green-600'
                    : s === 'fail'  ? 'bg-red-600 text-white border-red-600'
                    : 'bg-amber-500 text-white border-amber-500'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>{s}</button>
          ))}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">QC Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Colour, texture, taste, lab results, certifications..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
        </div>
        <button onClick={() => onUpdate({ qualityStatus: status })}
          className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700">
          Save QC Result
        </button>
      </div>
    </div>
  );
}

// ─── Costs Tab ────────────────────────────────────────────────────────────────
function CostsTab({ batch, onUpdate }: { batch: ProcessingBatch; onUpdate: (p: Partial<ProcessingBatch>) => void }) {
  const [inputCost,  setInputCost]  = useState(String(batch.totalInputCost  ?? ''));
  const [laborCost,  setLaborCost]  = useState(String(batch.laborCost       ?? ''));
  const [overhead,   setOverhead]   = useState(String(batch.overheadCost    ?? ''));

  const totalIn   = parseFloat(inputCost)  || 0;
  const totalLab  = parseFloat(laborCost)  || 0;
  const totalOver = parseFloat(overhead)   || 0;
  const totalCost = totalIn + totalLab + totalOver;

  const totalOutput = batch.actualOutputs
    .filter(o => o.type === 'main')
    .reduce((s, o) => s + (o.actualQty ?? 0), 0);
  const costPerUnit = totalOutput > 0 ? totalCost / totalOutput : undefined;

  function save() {
    onUpdate({
      totalInputCost: totalIn || undefined,
      laborCost:  totalLab  || undefined,
      overheadCost: totalOver || undefined,
      totalCost:  totalCost || undefined,
      costPerUnit,
    });
  }

  return (
    <div className="space-y-4 max-w-md">
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Batch Costs</h3>
        <div className="space-y-3">
          {[
            { label: 'Raw Material Cost', value: inputCost, set: setInputCost },
            { label: 'Labour Cost', value: laborCost, set: setLaborCost },
            { label: 'Overhead / Utilities', value: overhead, set: setOverhead },
          ].map(({ label, value, set }) => (
            <div key={label} className="flex items-center gap-3">
              <label className="text-sm text-slate-700 w-40 flex-shrink-0">{label}</label>
              <input type="number" step="any" value={value} onChange={e => set(e.target.value)}
                placeholder="0.00"
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          ))}
        </div>
        {totalCost > 0 && (
          <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total Cost</span>
              <span className="font-bold text-slate-900">{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {costPerUnit !== undefined && totalOutput > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Cost per {batch.actualOutputs[0]?.unit ?? 'unit'} (main)</span>
                <span className="font-bold text-slate-900">{costPerUnit.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
        <button onClick={save} className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700">
          Save Costs
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New Batch Modal
// ─────────────────────────────────────────────────────────────────────────────
function NewBatchModal({ recipes, onSave, onClose }: {
  recipes: ProcessingRecipe[];
  onSave: (data: Omit<ProcessingBatch, 'id'>) => void;
  onClose: () => void;
}) {
  const [recipeId, setRecipeId] = useState(recipes[0]?.id ?? '');
  const [batchNum, setBatchNum] = useState(() => `BATCH-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Math.floor(Math.random() * 900) + 100)}`);
  const [startDate, setStart]  = useState(new Date().toISOString().slice(0, 10));

  const recipe = recipes.find(r => r.id === recipeId);

  function save() {
    if (!recipeId || !batchNum.trim()) return;
    onSave({
      recipeId,
      recipeName: recipe?.name ?? '',
      batchNumber: batchNum.trim(),
      startDate,
      status: 'in_progress',
      actualInputs:  (recipe?.inputs  ?? []).map(i => ({ ...i, actualQty: 0 })),
      actualOutputs: (recipe?.outputs ?? []).map(o => ({ ...o, actualQty: 0 })),
      qualityStatus: 'pending',
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Start New Processing Batch</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Recipe</label>
            <select value={recipeId} onChange={e => setRecipeId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          {recipe && (
            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
              <div className="font-medium text-slate-800 mb-1">{recipe.name}</div>
              <div className="text-slate-500">{recipe.description}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {recipe.outputs.map((o, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded-full ${o.type === 'main' ? 'bg-green-100 text-green-700' : o.type === 'byproduct' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {o.expectedYieldPct}% {o.materialName}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Batch Number</label>
            <input type="text" value={batchNum} onChange={e => setBatchNum(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStart(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={!recipeId || !batchNum.trim()}
            className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
            Start Batch
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function StatCard2({ label, value, icon, highlight }: { label: string; value: string; icon: string; highlight?: 'green' | 'amber' | 'red' }) {
  return (
    <div className={`bg-white rounded-xl border p-3 ${highlight === 'green' ? 'border-green-200' : highlight === 'red' ? 'border-red-200' : highlight === 'amber' ? 'border-amber-200' : 'border-slate-200'}`}>
      <div className="text-lg mb-1">{icon}</div>
      <div className={`font-bold text-sm ${highlight === 'green' ? 'text-green-700' : highlight === 'red' ? 'text-red-600' : highlight === 'amber' ? 'text-amber-700' : 'text-slate-900'}`}>{value}</div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

function SLabel({ label, count, color }: { label: string; count: number; color: string }) {
  const c: Record<string, string> = { purple: 'text-purple-600', blue: 'text-blue-600', slate: 'text-slate-400', red: 'text-red-500', amber: 'text-amber-600' };
  return (
    <div className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider ${c[color] ?? c.slate} flex items-center gap-2`}>
      {label}<span className="bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5 text-[10px]">{count}</span>
    </div>
  );
}
