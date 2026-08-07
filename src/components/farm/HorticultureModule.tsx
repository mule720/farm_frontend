import React, { useState, useEffect, useCallback } from 'react';
import {
  Sprout, Droplet, Calendar, Plus, X, Loader2, RefreshCw, CheckCircle2,
  AlertTriangle, Edit2, Trash2, Leaf
} from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ActivityScheduler from './ActivityScheduler';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVITY_META: Record<string, { label: string; color: string; dot: string }> = {
  fertilizer:  { label: 'Fertilizer',  color: 'bg-amber-100 text-amber-800',   dot: 'bg-amber-500' },
  compost:     { label: 'Compost',     color: 'bg-yellow-100 text-yellow-800',  dot: 'bg-yellow-500' },
  spraying:    { label: 'Spraying',    color: 'bg-purple-100 text-purple-800',  dot: 'bg-purple-500' },
  irrigation:  { label: 'Irrigation',  color: 'bg-cyan-100 text-cyan-800',      dot: 'bg-cyan-500' },
  weeding:     { label: 'Weeding',     color: 'bg-green-100 text-green-800',    dot: 'bg-green-500' },
  pruning:     { label: 'Pruning',     color: 'bg-slate-100 text-slate-700',    dot: 'bg-slate-400' },
  harvest:     { label: 'Harvest',     color: 'bg-red-100 text-red-800',        dot: 'bg-red-500' },
  other:       { label: 'Other',       color: 'bg-gray-100 text-gray-700',      dot: 'bg-gray-400' },
};

const CROP_STAGES = ['Germination', 'Seedling', 'Transplanting', 'Vegetative', 'Flowering',
                     'Fruiting', 'Bulbing', 'Pod Formation', 'Maturation', 'Harvest Ready', 'Harvested'];

const STATUS_META: Record<string, string> = {
  healthy:              'bg-green-100 text-green-700',
  'pest-warning':       'bg-red-100 text-red-700',
  'disease-alert':      'bg-red-100 text-red-700',
  'irrigation-due':     'bg-amber-100 text-amber-700',
  'nutrient-deficiency':'bg-orange-100 text-orange-700',
  'harvest-ready':      'bg-blue-100 text-blue-700',
};

const RECORD_TYPE_LABELS: Record<string, string> = {
  daily: 'Daily Observation', feed: 'Fertilizer / Compost',
  health: 'Pest / Disease / Spray', custom: 'Other',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function today() { return new Date().toISOString().slice(0, 10); }
function ageDays(startDate: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(startDate).getTime()) / 86_400_000));
}
function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}
function uuid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

// ─── Component ───────────────────────────────────────────────────────────────

export default function HorticultureModule() {
  const { canCreate, canEdit } = useAuth();
  const [enterprise, setEnterprise] = useState<any>(null);
  const [plots, setPlots] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'plots' | 'planner' | 'records' | 'analytics'>('plots');

  // Modals
  const [showAddPlot, setShowAddPlot] = useState(false);
  const [showActivity, setShowActivity] = useState<{ plotId: string } | null>(null);
  const [showRecord, setShowRecord] = useState(false);

  // Plot form
  const [plotForm, setPlotForm] = useState({ name: '', crop: '', variety: '', area: '', irrigationMethod: 'drip', plantedDate: today(), harvestDate: '', stage: 'Germination', status: 'healthy', notes: '' });
  const [plotSubmitting, setPlotSubmitting] = useState(false);
  const [plotError, setPlotError] = useState<string | null>(null);

  // Activity form
  const [actForm, setActForm] = useState({ type: 'fertilizer', name: '', date: today(), product: '', quantity: '', notes: '' });
  const [actSubmitting, setActSubmitting] = useState(false);
  const [actError, setActError] = useState<string | null>(null);

  // Record form
  const [recForm, setRecForm] = useState({ plotId: '', date: today(), type: 'daily', observation: '', quantity: '', product: '', notes: '' });
  const [recSubmitting, setRecSubmitting] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [recSaved, setRecSaved] = useState(false);

  // Activity filter
  const [actFilter, setActFilter] = useState<string>('all');

  // ─── Data loading ───────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await gqlRequest<{ enterprises: any[] }>(`
        query { enterprises(isActive: true) { id name productionType batchUnit settings } }
      `);
      const ent = (data.enterprises || []).find((e: any) => e.productionType === 'horticulture');
      setEnterprise(ent || null);
      if (ent) {
        const [bd, rd] = await Promise.all([
          gqlRequest<{ batches: any[] }>(`
            query($eid: ID!) { batches(enterpriseId: $eid) { id name quantity unit startDate expectedEndDate status metadata notes } }
          `, { eid: ent.id }),
          gqlRequest<{ productionRecords: any[] }>(`
            query($eid: ID!) { productionRecords(enterpriseId: $eid, limit: 50) { id recordDate recordType data batch { id name } } }
          `, { eid: ent.id }),
        ]);
        const batchList = (bd.batches || []).map((b: any) => normalisePlot(b));
        setPlots(batchList);
        setRecords(rd.productionRecords || []);
        if (batchList.length > 0) setRecForm(f => ({ ...f, plotId: batchList[0].id }));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function normalisePlot(b: any) {
    const meta = (typeof b.metadata === 'string' ? JSON.parse(b.metadata) : b.metadata) || {};
    return { ...b, status: (b.status as string).toLowerCase(), metadata: meta };
  }

  // ─── Setup enterprise ───────────────────────────────────────────────────────

  async function setupEnterprise() {
    setCreating(true);
    try {
      const data = await gqlRequest<{ createEnterprise: { enterprise: any } }>(`
        mutation CreateEnt($input: CreateEnterpriseInput!) { createEnterprise(input: $input) { enterprise { id name productionType batchUnit settings } } }
      `, { input: { name: 'Horticulture', category: 'horticulture', productionType: 'horticulture', batchUnit: 'ha', description: 'Crop and vegetable production' } });
      setEnterprise(data.createEnterprise.enterprise);
    } catch (e: any) { alert('Setup failed: ' + e.message); }
    finally { setCreating(false); }
  }

  // ─── Add plot ───────────────────────────────────────────────────────────────

  async function handleAddPlot(e: React.FormEvent) {
    e.preventDefault(); setPlotError(null); setPlotSubmitting(true);
    try {
      const meta = { crop: plotForm.crop, variety: plotForm.variety, irrigationMethod: plotForm.irrigationMethod, stage: plotForm.stage, status: plotForm.status, activities: [] };
      const data = await gqlRequest<{ createBatch: { batch: any } }>(`
        mutation CreateBatch($input: CreateBatchInput!) { createBatch(input: $input) { batch { id name quantity unit startDate expectedEndDate status metadata notes } } }
      `, { input: { enterpriseId: enterprise.id, name: plotForm.name, quantity: parseFloat(plotForm.area) || 0, unit: 'ha', startDate: plotForm.plantedDate, expectedEndDate: plotForm.harvestDate || null, notes: plotForm.notes, metadata: JSON.stringify(meta) } });
      const nb = normalisePlot(data.createBatch.batch);
      setPlots(prev => [nb, ...prev]);
      if (plots.length === 0) setRecForm(f => ({ ...f, plotId: nb.id }));
      setShowAddPlot(false);
      setPlotForm({ name: '', crop: '', variety: '', area: '', irrigationMethod: 'drip', plantedDate: today(), harvestDate: '', stage: 'Germination', status: 'healthy', notes: '' });
    } catch (e: any) { setPlotError(e.message); }
    finally { setPlotSubmitting(false); }
  }

  // ─── Update plot metadata (stage, status) ───────────────────────────────────

  async function updatePlotMeta(plotId: string, changes: Partial<any>) {
    const plot = plots.find(p => p.id === plotId);
    if (!plot) return;
    const newMeta = { ...plot.metadata, ...changes };
    try {
      await gqlRequest(`
        mutation UpdateBatch($id: ID!, $metadata: JSONString) { updateBatch(id: $id, metadata: $metadata) { batch { id } } }
      `, { id: plotId, metadata: JSON.stringify(newMeta) });
      setPlots(prev => prev.map(p => p.id === plotId ? { ...p, metadata: newMeta } : p));
    } catch (e: any) { alert(e.message); }
  }

  // ─── Schedule activity ──────────────────────────────────────────────────────

  async function handleScheduleActivity(e: React.FormEvent) {
    e.preventDefault(); setActError(null); setActSubmitting(true);
    if (!showActivity) return;
    const plotId = showActivity.plotId;
    const plot = plots.find(p => p.id === plotId);
    if (!plot) { setActSubmitting(false); return; }
    const newActivity = { id: uuid(), type: actForm.type, name: actForm.name, date: actForm.date, product: actForm.product, quantity: actForm.quantity, notes: actForm.notes, done: false };
    const updatedActivities = [...(plot.metadata.activities || []), newActivity];
    try {
      await gqlRequest(`
        mutation UpdateBatch($id: ID!, $metadata: JSONString) { updateBatch(id: $id, metadata: $metadata) { batch { id } } }
      `, { id: plotId, metadata: JSON.stringify({ ...plot.metadata, activities: updatedActivities }) });
      setPlots(prev => prev.map(p => p.id === plotId ? { ...p, metadata: { ...p.metadata, activities: updatedActivities } } : p));
      setShowActivity(null);
      setActForm({ type: 'fertilizer', name: '', date: today(), product: '', quantity: '', notes: '' });
    } catch (e: any) { setActError(e.message); }
    finally { setActSubmitting(false); }
  }

  async function toggleActivity(plotId: string, actId: string) {
    const plot = plots.find(p => p.id === plotId);
    if (!plot) return;
    const updatedActivities = (plot.metadata.activities || []).map((a: any) =>
      a.id === actId ? { ...a, done: !a.done } : a
    );
    try {
      await gqlRequest(`
        mutation UpdateBatch($id: ID!, $metadata: JSONString) { updateBatch(id: $id, metadata: $metadata) { batch { id } } }
      `, { id: plotId, metadata: JSON.stringify({ ...plot.metadata, activities: updatedActivities }) });
      setPlots(prev => prev.map(p => p.id === plotId ? { ...p, metadata: { ...p.metadata, activities: updatedActivities } } : p));
    } catch (e: any) { alert(e.message); }
  }

  async function deleteActivity(plotId: string, actId: string) {
    const plot = plots.find(p => p.id === plotId);
    if (!plot) return;
    const updatedActivities = (plot.metadata.activities || []).filter((a: any) => a.id !== actId);
    try {
      await gqlRequest(`
        mutation UpdateBatch($id: ID!, $metadata: JSONString) { updateBatch(id: $id, metadata: $metadata) { batch { id } } }
      `, { id: plotId, metadata: JSON.stringify({ ...plot.metadata, activities: updatedActivities }) });
      setPlots(prev => prev.map(p => p.id === plotId ? { ...p, metadata: { ...p.metadata, activities: updatedActivities } } : p));
    } catch (e: any) { alert(e.message); }
  }

  // ─── Log record ─────────────────────────────────────────────────────────────

  async function handleLogRecord(e: React.FormEvent) {
    e.preventDefault(); setRecError(null); setRecSubmitting(true);
    try {
      const rec = await gqlRequest<{ createProductionRecord: { record: any } }>(`
        mutation CreateRec($input: ProductionRecordInput!) { createProductionRecord(input: $input) { record { id recordDate recordType data batch { id name } } } }
      `, { input: {
        enterpriseId: enterprise.id,
        batchId: recForm.plotId || null,
        recordDate: recForm.date,
        recordType: recForm.type,
        data: JSON.stringify({ observation: recForm.observation, quantity: recForm.quantity, product: recForm.product, notes: recForm.notes }),
      }});
      setRecords(prev => [rec.createProductionRecord.record, ...prev]);
      setRecSaved(true); setTimeout(() => setRecSaved(false), 3000);
      setRecForm(f => ({ ...f, observation: '', quantity: '', product: '', notes: '' }));
      setShowRecord(false);
    } catch (e: any) { setRecError(e.message); }
    finally { setRecSubmitting(false); }
  }

  // ─── Computed ────────────────────────────────────────────────────────────────

  // Flatten all activities across plots
  const allActivities = plots.flatMap(p =>
    (p.metadata.activities || []).map((a: any) => ({ ...a, plotId: p.id, plotName: p.name, crop: p.metadata.crop }))
  ).sort((a: any, b: any) => a.date.localeCompare(b.date));

  const filteredActivities = actFilter === 'all' ? allActivities : allActivities.filter((a: any) => a.type === actFilter);
  const overdueActs = filteredActivities.filter((a: any) => !a.done && daysUntil(a.date) < 0);
  const todayActs = filteredActivities.filter((a: any) => !a.done && daysUntil(a.date) === 0);
  const upcomingActs = filteredActivities.filter((a: any) => !a.done && daysUntil(a.date) > 0);
  const doneActs = filteredActivities.filter((a: any) => a.done).slice(0, 5);

  const activePlots = plots.filter(p => p.status !== 'harvested');
  const totalArea = plots.reduce((s, p) => s + (parseFloat(p.quantity) || 0), 0);
  const alertPlots = plots.filter(p => p.metadata.status && p.metadata.status !== 'healthy');
  const upcomingHarvests = plots.filter(p => p.expectedEndDate && daysUntil(p.expectedEndDate) <= 30 && daysUntil(p.expectedEndDate) >= 0);

  // ─── Loading / Setup ─────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center min-h-64 text-slate-400">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading Horticulture…
    </div>
  );

  if (!enterprise) return (
    <div className="p-6 flex items-center justify-center min-h-96">
      <div className="bg-white rounded-2xl border border-slate-200 p-10 max-w-md text-center shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🌿</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Horticulture Management</h2>
        <p className="text-sm text-slate-500 mb-6">Manage crop plots, schedule fertilizer, compost, spraying, irrigation, and track harvests.</p>
        <button onClick={setupEnterprise} disabled={creating} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2 mx-auto">
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Set Up Horticulture
        </button>
      </div>
    </div>
  );

  // ─── Main UI ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center"><Sprout className="w-6 h-6 text-emerald-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Horticulture Management</h1>
            <p className="text-sm text-slate-500">{activePlots.length} plots · {totalArea.toFixed(2)} ha · {allActivities.filter((a: any) => !a.done).length} pending activities</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 hover:bg-slate-100 rounded-lg"><RefreshCw className="w-4 h-4 text-slate-500" /></button>
          {canCreate('horticulture') && (
            <button onClick={() => { setShowRecord(true); setRecError(null); }} className="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm">
              + Log Record
            </button>
          )}
          {canCreate('horticulture') && (
            <button onClick={() => { setShowAddPlot(true); setPlotError(null); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Crop Plot
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Plots', value: plots.length },
          { label: 'Total Area (ha)', value: totalArea.toFixed(2) },
          { label: 'Crop Varieties', value: new Set(plots.map(p => p.metadata.crop).filter(Boolean)).size },
          { label: 'Alerts', value: alertPlots.length, amber: alertPlots.length > 0 },
          { label: 'Upcoming Harvest', value: upcomingHarvests.length, blue: true },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className={`text-2xl font-bold ${s.amber ? 'text-amber-600' : s.blue ? 'text-blue-600' : 'text-slate-900'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          {(['plots', 'planner', 'records', 'analytics'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === t ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t === 'planner' ? 'Activity Planner' : t}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════ PLOTS TAB ═══════════════════════════════════════════════ */}
      {activeTab === 'plots' && (
        <div className="space-y-4">
          {plots.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center">
              <Leaf className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 font-medium">No crop plots yet</p>
              <p className="text-xs text-slate-400 mt-1">Click "Add Crop Plot" to register your first plot</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">Plot / Crop</th>
                    <th className="text-right px-4 py-3">Area (ha)</th>
                    <th className="text-left px-4 py-3">Planted</th>
                    <th className="text-center px-4 py-3">Age</th>
                    <th className="text-left px-4 py-3">Stage</th>
                    <th className="text-left px-4 py-3">Harvest</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Irrigation</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plots.map(p => {
                    const age = ageDays(p.startDate);
                    const harvestDays = p.expectedEndDate ? daysUntil(p.expectedEndDate) : null;
                    const status = p.metadata.status || 'healthy';
                    return (
                      <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-500">{p.metadata.crop}{p.metadata.variety ? ` · ${p.metadata.variety}` : ''}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{parseFloat(p.quantity).toFixed(2)}</td>
                        <td className="px-4 py-3 text-slate-600">{p.startDate}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs font-medium text-slate-700">{age}d</span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={p.metadata.stage || 'Germination'}
                            onChange={e => updatePlotMeta(p.id, { stage: e.target.value })}
                            className="text-xs px-2 py-1 border border-slate-200 rounded-md bg-blue-50 text-blue-700 focus:outline-none"
                          >
                            {CROP_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {p.expectedEndDate ? (
                            <div>
                              <div className="text-xs">{p.expectedEndDate}</div>
                              <div className={`text-[10px] font-medium ${harvestDays !== null && harvestDays <= 7 ? 'text-red-600' : harvestDays !== null && harvestDays <= 30 ? 'text-amber-600' : 'text-slate-400'}`}>
                                {harvestDays !== null ? (harvestDays < 0 ? `${Math.abs(harvestDays)}d overdue` : harvestDays === 0 ? 'Today!' : `in ${harvestDays}d`) : ''}
                              </div>
                            </div>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={status}
                            onChange={e => updatePlotMeta(p.id, { status: e.target.value })}
                            className={`text-xs px-2 py-1 rounded-md border-0 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${STATUS_META[status] || 'bg-green-100 text-green-700'}`}
                          >
                            {Object.keys(STATUS_META).map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 capitalize">{p.metadata.irrigationMethod || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => { setShowActivity({ plotId: p.id }); setActError(null); }} className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100">
                            + Activity
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ ACTIVITY PLANNER TAB ════════════════════════════════════ */}
      {activeTab === 'planner' && enterprise && (
        <ActivityScheduler
          moduleType="horticulture"
          enterpriseId={enterprise.id}
          enterpriseName={enterprise.name}
          batches={plots.map((p: any) => ({ id: p.id, name: p.name + (p.metadata.crop ? ` — ${p.metadata.crop}` : '') }))}
        />
      )}

      {/* ═══════════ RECORDS TAB ═════════════════════════════════════════════ */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Log Field Record</h3>
            {recSaved && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">✓ Record saved.</div>}
            {recError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{recError}</div>}
            {plots.length === 0 ? (
              <p className="text-sm text-slate-500">Add a crop plot first to log field records.</p>
            ) : (
              <form onSubmit={handleLogRecord} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Plot *</label>
                  <select value={recForm.plotId} onChange={e => setRecForm(f => ({ ...f, plotId: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    {plots.map(p => <option key={p.id} value={p.id}>{p.name}{p.metadata.crop ? ` — ${p.metadata.crop}` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date *</label>
                  <input type="date" value={recForm.date} onChange={e => setRecForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Record Type</label>
                  <select value={recForm.type} onChange={e => setRecForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    {Object.entries(RECORD_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Product / Input Used</label>
                  <input value={recForm.product} onChange={e => setRecForm(f => ({ ...f, product: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="e.g. NPK 10:10:10, Mancozeb" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Quantity / Amount</label>
                  <input value={recForm.quantity} onChange={e => setRecForm(f => ({ ...f, quantity: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="e.g. 50kg, 2000L, 3hr" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Observation</label>
                  <input value={recForm.observation} onChange={e => setRecForm(f => ({ ...f, observation: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Plant condition, pest signs…" />
                </div>
                <div className="col-span-2 md:col-span-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                  <input value={recForm.notes} onChange={e => setRecForm(f => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Any additional observations…" />
                </div>
                <div className="col-span-2 md:col-span-3">
                  <button type="submit" disabled={recSubmitting} className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-2">
                    {recSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Save Record
                  </button>
                </div>
              </form>
            )}
          </div>

          {records.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Field Records</h3>
                <p className="text-xs text-slate-500">Last {records.length} entries</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
                  <tr>
                    <th className="text-left px-4 py-2.5">Date</th>
                    <th className="text-left px-4 py-2.5">Plot</th>
                    <th className="text-left px-4 py-2.5">Type</th>
                    <th className="text-left px-4 py-2.5">Product / Input</th>
                    <th className="text-left px-4 py-2.5">Qty / Amount</th>
                    <th className="text-left px-4 py-2.5">Observation</th>
                    <th className="text-left px-4 py-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r: any) => {
                    let d: any = {};
                    try { d = typeof r.data === 'string' ? JSON.parse(r.data) : r.data; } catch {}
                    return (
                      <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-medium">{r.recordDate}</td>
                        <td className="px-4 py-2.5 text-slate-600">{r.batch?.name || '—'}</td>
                        <td className="px-4 py-2.5"><span className="text-xs px-2 py-0.5 bg-slate-100 rounded capitalize">{RECORD_TYPE_LABELS[r.recordType] || r.recordType}</span></td>
                        <td className="px-4 py-2.5 text-slate-600">{d.product || '—'}</td>
                        <td className="px-4 py-2.5">{d.quantity || '—'}</td>
                        <td className="px-4 py-2.5 text-slate-600">{d.observation || '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{d.notes || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ ANALYTICS TAB ═══════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plots by stage */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold mb-4">Plots by Growth Stage</h3>
              <div className="space-y-2">
                {CROP_STAGES.filter(s => plots.some(p => p.metadata.stage === s)).map(s => {
                  const count = plots.filter(p => p.metadata.stage === s).length;
                  const pct = Math.round((count / Math.max(plots.length, 1)) * 100);
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <div className="w-28 text-xs text-slate-600 truncate">{s}</div>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-xs font-medium text-slate-700 w-6 text-right">{count}</div>
                    </div>
                  );
                })}
                {plots.length === 0 && <p className="text-sm text-slate-400">No plots yet.</p>}
              </div>
            </div>

            {/* Upcoming harvests */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold mb-4">Upcoming Harvests (30 days)</h3>
              {upcomingHarvests.length === 0 ? (
                <p className="text-sm text-slate-400">No harvests in the next 30 days.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingHarvests.sort((a, b) => a.expectedEndDate.localeCompare(b.expectedEndDate)).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.metadata.crop}{p.metadata.variety ? ` · ${p.metadata.variety}` : ''}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-blue-700">{p.expectedEndDate}</div>
                        <div className="text-xs text-slate-500">in {daysUntil(p.expectedEndDate)} days</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold mb-4">Activity Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Pending', value: allActivities.filter((a: any) => !a.done).length, color: 'text-slate-900' },
                  { label: 'Overdue', value: overdueActs.length, color: 'text-red-600' },
                  { label: 'Due Today', value: todayActs.length, color: 'text-amber-600' },
                  { label: 'Completed', value: allActivities.filter((a: any) => a.done).length, color: 'text-green-600' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500">{s.label}</div>
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plot health */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold mb-4">Plot Health Overview</h3>
              <div className="space-y-2">
                {plots.map(p => {
                  const status = p.metadata.status || 'healthy';
                  return (
                    <div key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                      <div>
                        <span className="text-sm font-medium">{p.name}</span>
                        <span className="text-xs text-slate-500 ml-2">{p.metadata.crop}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_META[status] || 'bg-green-100 text-green-700'}`}>{status.replace('-', ' ')}</span>
                    </div>
                  );
                })}
                {plots.length === 0 && <p className="text-sm text-slate-400">No plots yet.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ ADD PLOT MODAL ═══════════════════════════════════════════ */}
      {showAddPlot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div><h2 className="font-bold text-slate-900">Add Crop Plot</h2><p className="text-xs text-slate-500">Register a new crop plot or field</p></div>
              <button onClick={() => setShowAddPlot(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddPlot} className="p-5 space-y-3">
              {plotError && <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{plotError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><F label="Plot Name *" required value={plotForm.name} onChange={v => setPlotForm(f => ({ ...f, name: v }))} placeholder="e.g. Plot A — Tomatoes" /></div>
                <F label="Crop *" required value={plotForm.crop} onChange={v => setPlotForm(f => ({ ...f, crop: v }))} placeholder="Tomatoes, Maize, Onions…" />
                <F label="Variety" value={plotForm.variety} onChange={v => setPlotForm(f => ({ ...f, variety: v }))} placeholder="Roma F1, SC 627…" />
                <F label="Area (ha) *" required type="number" step="0.01" min="0.001" value={plotForm.area} onChange={v => setPlotForm(f => ({ ...f, area: v }))} placeholder="0.25" />
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Irrigation Method</label>
                  <select value={plotForm.irrigationMethod} onChange={e => setPlotForm(f => ({ ...f, irrigationMethod: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    {['drip', 'sprinkler', 'furrow', 'flood', 'manual', 'rain-fed'].map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
                  </select>
                </div>
                <F label="Planting Date *" required type="date" value={plotForm.plantedDate} onChange={v => setPlotForm(f => ({ ...f, plantedDate: v }))} />
                <F label="Expected Harvest Date" type="date" value={plotForm.harvestDate} onChange={v => setPlotForm(f => ({ ...f, harvestDate: v }))} />
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Current Growth Stage</label>
                  <select value={plotForm.stage} onChange={e => setPlotForm(f => ({ ...f, stage: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    {CROP_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Initial Status</label>
                  <select value={plotForm.status} onChange={e => setPlotForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    {Object.keys(STATUS_META).map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
                  </select>
                </div>
                <div className="col-span-2"><F label="Notes" value={plotForm.notes} onChange={v => setPlotForm(f => ({ ...f, notes: v }))} placeholder="Soil type, bed layout, source of seedlings…" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddPlot(false)} className="flex-1 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={plotSubmitting} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                  {plotSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Add Plot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════ SCHEDULE ACTIVITY MODAL ═════════════════════════════════ */}
      {showActivity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div><h2 className="font-bold text-slate-900">Schedule Activity</h2>
                <p className="text-xs text-slate-500">
                  {plots.find(p => p.id === showActivity.plotId)?.name || 'Select plot below'}
                </p>
              </div>
              <button onClick={() => setShowActivity(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleScheduleActivity} className="p-5 space-y-3">
              {actError && <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{actError}</div>}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Plot *</label>
                <select value={showActivity.plotId} onChange={e => setShowActivity({ plotId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  {plots.map(p => <option key={p.id} value={p.id}>{p.name}{p.metadata.crop ? ` — ${p.metadata.crop}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Activity Type *</label>
                <select value={actForm.type} onChange={e => setActForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  {Object.entries(ACTIVITY_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
                </select>
              </div>
              <F label="Activity Name *" required value={actForm.name} onChange={v => setActForm(f => ({ ...f, name: v }))} placeholder="e.g. NPK top-dressing, Fungicide spray…" />
              <F label="Scheduled Date *" required type="date" value={actForm.date} onChange={v => setActForm(f => ({ ...f, date: v }))} />
              <div className="grid grid-cols-2 gap-3">
                <F label="Product / Chemical" value={actForm.product} onChange={v => setActForm(f => ({ ...f, product: v }))} placeholder="NPK 10:10:10, Mancozeb…" />
                <F label="Quantity / Rate" value={actForm.quantity} onChange={v => setActForm(f => ({ ...f, quantity: v }))} placeholder="50kg/ha, 2g/L…" />
              </div>
              <F label="Notes" value={actForm.notes} onChange={v => setActForm(f => ({ ...f, notes: v }))} placeholder="Additional instructions…" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowActivity(null)} className="flex-1 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={actSubmitting} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                  {actSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════ QUICK LOG RECORD MODAL ══════════════════════════════════ */}
      {showRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div><h2 className="font-bold text-slate-900">Log Field Record</h2><p className="text-xs text-slate-500">Quick entry</p></div>
              <button onClick={() => setShowRecord(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={async (e) => { await handleLogRecord(e); if (!recError) setShowRecord(false); }} className="p-5 space-y-3">
              {recError && <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{recError}</div>}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Plot *</label>
                <select value={recForm.plotId} onChange={e => setRecForm(f => ({ ...f, plotId: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  {plots.map(p => <option key={p.id} value={p.id}>{p.name}{p.metadata.crop ? ` — ${p.metadata.crop}` : ''}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Date *" required type="date" value={recForm.date} onChange={v => setRecForm(f => ({ ...f, date: v }))} />
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
                  <select value={recForm.type} onChange={e => setRecForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    {Object.entries(RECORD_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <F label="Product / Input" value={recForm.product} onChange={v => setRecForm(f => ({ ...f, product: v }))} placeholder="NPK 10:10:10, Mancozeb…" />
              <F label="Quantity / Amount" value={recForm.quantity} onChange={v => setRecForm(f => ({ ...f, quantity: v }))} placeholder="50kg, 2000L, 3hr…" />
              <F label="Observation / Notes" value={recForm.notes} onChange={v => setRecForm(f => ({ ...f, notes: v }))} placeholder="Plant condition, pest signs, weather…" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRecord(false)} className="flex-1 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={recSubmitting} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                  {recSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActivitySection({ title, titleColor, bg, activities, plots, onToggle, onDelete }: any) {
  return (
    <div>
      <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${titleColor}`}>{title} ({activities.length})</div>
      <div className={`border rounded-xl overflow-hidden ${bg}`}>
        {activities.map((a: any, i: number) => (
          <div key={a.id} className={`${i > 0 ? 'border-t border-slate-100' : ''}`}>
            <ActivityRow activity={a} onToggle={() => onToggle(a.plotId, a.id)} onDelete={() => onDelete(a.plotId, a.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityRow({ activity: a, done = false, onToggle, onDelete }: any) {
  const meta = ACTIVITY_META[a.type] || ACTIVITY_META.other;
  const d = daysUntil(a.date);
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${done ? 'opacity-50' : ''}`}>
      <button onClick={onToggle} className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${done ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-green-500'}`}>
        {done && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
      </button>
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${done ? 'line-through text-slate-400' : 'text-slate-900'}`}>{a.name}</div>
        <div className="text-xs text-slate-500 flex gap-2 flex-wrap">
          <span>{a.plotName}</span>
          {a.crop && <span>· {a.crop}</span>}
          {a.product && <span>· {a.product}</span>}
          {a.quantity && <span>· {a.quantity}</span>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-xs font-medium text-slate-700">{a.date}</div>
        {!done && (
          <div className={`text-[10px] ${d < 0 ? 'text-red-600 font-semibold' : d === 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
            {d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? 'Today' : `in ${d}d`}
          </div>
        )}
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full ${meta.color} flex-shrink-0`}>{meta.label}</span>
      <button onClick={onDelete} className="text-slate-300 hover:text-red-500 ml-1 flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
  );
}

function F({ label, value, onChange, type = 'text', required, placeholder, step, min }: any) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      <input type={type} required={required} value={value} step={step} min={min} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
    </div>
  );
}
