import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Droplet, Wheat, Heart, AlertCircle, Loader2, X, RefreshCw, Edit2, Save, ChevronDown } from 'lucide-react';
import { EnterpriseId, getFeedingTable, getStageForAge, FeedingStage } from '@/lib/farmData';
import { gqlRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ActivityScheduler from './ActivityScheduler';

interface Props { enterpriseId: EnterpriseId }

const ENTERPRISE_META: Record<EnterpriseId, { name: string; category: string; productionType: string; unit: string; description: string }> = {
  'poultry':         { name: 'Poultry (Broilers)',  category: 'poultry',     productionType: 'broiler',         unit: 'birds',   description: 'Commercial broiler chicken production' },
  'village-chicken': { name: 'Village Chicken',      category: 'poultry',     productionType: 'village_chicken', unit: 'birds',   description: 'Free-range village chicken management' },
  'piggery':         { name: 'Piggery',              category: 'livestock',   productionType: 'pig',             unit: 'pigs',    description: 'Pig farming and pork production' },
  'fish':            { name: 'Fish Farming',          category: 'aquaculture', productionType: 'tilapia',         unit: 'fish',    description: 'Tilapia and aquaculture management' },
  'duck':            { name: 'Duck Farming',          category: 'poultry',     productionType: 'duck',            unit: 'ducks',   description: 'Duck production and egg management' },
  'goat-sheep':      { name: 'Goat & Sheep',          category: 'livestock',   productionType: 'goat_sheep',      unit: 'animals', description: 'Small ruminant livestock management' },
};

const BATCH_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700', completed: 'bg-slate-100 text-slate-600',
  paused: 'bg-amber-100 text-amber-700', cancelled: 'bg-red-100 text-red-700',
};

function getBatchAgeDays(startDate: string): number {
  return Math.floor((Date.now() - new Date(startDate).getTime()) / 86_400_000);
}

export default function EnterpriseModule({ enterpriseId }: Props) {
  const { canCreate, canEdit } = useAuth();
  const meta = ENTERPRISE_META[enterpriseId];
  const defaultFeedingTable = getFeedingTable(enterpriseId);

  const [enterprise, setEnterprise] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'batches' | 'feeding' | 'health' | 'records' | 'activities'>('batches');

  // Batch modal
  const [showNewBatch, setShowNewBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({ name: '', quantity: '', startDate: new Date().toISOString().slice(0, 10), expectedEndDate: '', notes: '' });
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  // Daily record form
  const [recForm, setRecForm] = useState({ batchId: '', recordDate: new Date().toISOString().slice(0, 10), mortality: '0', feedKg: '', waterL: '', avgWeight: '', notes: '' });
  const [recSubmitting, setRecSubmitting] = useState(false);
  const [recSaved, setRecSaved] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);

  // Edit record modal
  const [editRec, setEditRec] = useState<any>(null);
  const [editForm, setEditForm] = useState({ mortality: '0', feedKg: '', waterL: '', avgWeight: '', notes: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  function openEditRec(r: any) {
    let d: any = {};
    try { d = typeof r.data === 'string' ? JSON.parse(r.data) : (r.data ?? {}); } catch {}
    setEditForm({
      mortality:   d.mortality   != null ? String(d.mortality)   : '0',
      feedKg:      d.feedKg      != null ? String(d.feedKg)      : '',
      waterL:      d.waterL      != null ? String(d.waterL)      : '',
      avgWeight:   d.avgWeightKg != null ? String(d.avgWeightKg) : '',
      notes:       d.notes       ?? '',
    });
    setEditError(null);
    setEditRec(r);
  }

  async function handleUpdateRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!editRec) return;
    setEditError(null); setEditSubmitting(true);
    try {
      const data: any = { mortality: parseFloat(editForm.mortality) || 0 };
      if (editForm.feedKg)    data.feedKg      = parseFloat(editForm.feedKg);
      if (editForm.waterL)    data.waterL       = parseFloat(editForm.waterL);
      if (editForm.avgWeight) data.avgWeightKg  = parseFloat(editForm.avgWeight);
      if (editForm.notes)     data.notes        = editForm.notes;
      await gqlRequest(`
        mutation UpdRec($id: ID!, $data: JSONString!) { updateProductionRecord(id: $id, data: $data) { record { id recordDate data batch { id name } } } }
      `, { id: editRec.id, data: JSON.stringify(data) });
      setRecords(prev => prev.map(r => r.id === editRec.id ? { ...r, data } : r));
      setEditRec(null);
    } catch (err: any) {
      setEditError(err.message ?? 'Update failed');
    } finally {
      setEditSubmitting(false);
    }
  }

  // Feeding standards editing
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [feedingSchedule, setFeedingSchedule] = useState<FeedingStage[]>([]);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await gqlRequest<{ enterprises: any[] }>(`
        query { enterprises(isActive: true) { id name category productionType batchUnit isActive settings activeBatchCount } }
      `);
      const ent = (data.enterprises || []).find((e: any) => e.productionType === meta.productionType);
      setEnterprise(ent || null);
      if (ent) {
        // Load feeding schedule from settings or fall back to defaults
        const saved = ent.settings?.feedingSchedule;
        setFeedingSchedule(saved?.length ? saved : defaultFeedingTable);

        const bd = await gqlRequest<{ batches: any[] }>(`
          query($eid: ID!) { batches(enterpriseId: $eid) { id name batchNumber quantity unit startDate expectedEndDate status notes currentStage { id name } } }
        `, { eid: ent.id });

        const batchList = (bd.batches || []).map((b: any) => ({
          ...b,
          status: (b.status as string).toLowerCase(),
        }));
        setBatches(batchList);
        const firstActive = batchList.find((b: any) => b.status === 'active');
        if (firstActive) setRecForm(f => ({ ...f, batchId: firstActive.id }));

        // Records load independently — a failure here must not block batch/enterprise display
        gqlRequest<{ productionRecords: any[] }>(`
          query($eid: ID!) { productionRecords(enterpriseId: $eid, limit: 20) { id recordDate recordType data batch { id name } } }
        `, { eid: ent.id })
          .then(rd => setRecords(rd.productionRecords || []))
          .catch(err => { console.warn('Records load failed:', err); setRecords([]); });
      }
    } catch (e: any) {
      console.error(e);
      setLoadError(e.message || 'Failed to load enterprise data');
    }
    finally { setLoading(false); }
  }, [enterpriseId]);

  useEffect(() => { load(); }, [load]);

  async function setupEnterprise() {
    setCreating(true);
    try {
      const data = await gqlRequest<{ createEnterprise: { enterprise: any } }>(`
        mutation CreateEnt($input: CreateEnterpriseInput!) { createEnterprise(input: $input) { enterprise { id name category productionType batchUnit isActive settings activeBatchCount } } }
      `, { input: { name: meta.name, category: meta.category, productionType: meta.productionType, batchUnit: meta.unit, description: meta.description } });
      const ent = data.createEnterprise.enterprise;
      setEnterprise(ent);
      setFeedingSchedule(defaultFeedingTable);
    } catch (e: any) { alert('Setup failed: ' + e.message); }
    finally { setCreating(false); }
  }

  async function handleCreateBatch(e: React.FormEvent) {
    e.preventDefault(); setBatchError(null); setBatchSubmitting(true);
    try {
      const data = await gqlRequest<{ createBatch: { batch: any } }>(`
        mutation CreateBatch($input: CreateBatchInput!) { createBatch(input: $input) { batch { id name batchNumber quantity unit startDate expectedEndDate status notes currentStage { id name } } } }
      `, { input: { enterpriseId: enterprise.id, name: batchForm.name, quantity: parseFloat(batchForm.quantity), unit: enterprise.batchUnit, startDate: batchForm.startDate, expectedEndDate: batchForm.expectedEndDate || null, notes: batchForm.notes } });
      const nb = { ...data.createBatch.batch, status: (data.createBatch.batch.status as string).toLowerCase() };
      setBatches(prev => [nb, ...prev]);
      if (!recForm.batchId && nb.status === 'active') setRecForm(f => ({ ...f, batchId: nb.id }));
      setShowNewBatch(false);
      setBatchForm({ name: '', quantity: '', startDate: new Date().toISOString().slice(0, 10), expectedEndDate: '', notes: '' });
    } catch (e: any) { setBatchError(e.message); }
    finally { setBatchSubmitting(false); }
  }

  async function advanceBatch(batchId: string) {
    try {
      const data = await gqlRequest<{ advanceBatchStage: { batch: any; message: string } }>(`
        mutation($batchId: ID!) { advanceBatchStage(batchId: $batchId) { message batch { id status currentStage { id name } } } }
      `, { batchId });
      const updated = { ...data.advanceBatchStage.batch, status: (data.advanceBatchStage.batch.status as string).toLowerCase() };
      setBatches(prev => prev.map(b => b.id === batchId ? { ...b, ...updated } : b));
      alert(data.advanceBatchStage.message);
    } catch (e: any) { alert(e.message); }
  }

  async function handleSaveRecord(e: React.FormEvent) {
    e.preventDefault(); setRecError(null); setRecSubmitting(true);
    try {
      const rec = await gqlRequest<{ createProductionRecord: { record: any } }>(`
        mutation CreateRec($input: ProductionRecordInput!) { createProductionRecord(input: $input) { record { id recordDate recordType data batch { id name } } } }
      `, { input: {
        enterpriseId: enterprise.id,
        batchId: recForm.batchId || null,
        recordDate: recForm.recordDate,
        recordType: 'daily',
        data: JSON.stringify({
          mortality: parseInt(recForm.mortality) || 0,
          feedKg: parseFloat(recForm.feedKg) || 0,
          waterL: parseFloat(recForm.waterL) || 0,
          avgWeightKg: recForm.avgWeight ? parseFloat(recForm.avgWeight) : null,
          notes: recForm.notes,
        }),
      }});
      setRecords(prev => [rec.createProductionRecord.record, ...prev]);
      setRecSaved(true);
      setTimeout(() => setRecSaved(false), 4000);
      setRecForm(f => ({ ...f, mortality: '0', feedKg: '', waterL: '', avgWeight: '', notes: '' }));
    } catch (e: any) { setRecError(e.message); }
    finally { setRecSubmitting(false); }
  }

  async function handleSaveSchedule() {
    setSavingSchedule(true);
    try {
      await gqlRequest(`
        mutation UpdateEnt($id: ID!, $input: UpdateEnterpriseInput!) { updateEnterprise(id: $id, input: $input) { enterprise { id settings } } }
      `, { id: enterprise.id, input: { settings: JSON.stringify({ ...enterprise.settings, feedingSchedule }) } });
      setEnterprise((e: any) => ({ ...e, settings: { ...e.settings, feedingSchedule } }));
      setEditingSchedule(false);
    } catch (e: any) { alert('Could not save schedule: ' + e.message); }
    finally { setSavingSchedule(false); }
  }

  function autoFillFromBatch() {
    if (!recForm.batchId) return;
    const batch = batches.find(b => b.id === recForm.batchId);
    if (!batch) return;
    const age = getBatchAgeDays(batch.startDate);
    const stage = getStageForAge(enterpriseId, age);
    if (!stage) return;
    const qty = parseFloat(batch.quantity) || 0;
    const feedKg = ((stage.feedPerAnimalGrams * qty) / 1000).toFixed(1);
    const waterL = ((stage.waterPerAnimalMl * qty) / 1000).toFixed(0);
    setRecForm(f => ({ ...f, feedKg, waterL }));
  }

  // ─── Loading / setup screens ────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-64 text-slate-400">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading {meta.name}…
    </div>
  );

  if (loadError) return (
    <div className="p-6 flex items-center justify-center min-h-64">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-red-800">Could not load enterprise data</div>
            <div className="text-sm text-red-600 mt-1">{loadError}</div>
            <button onClick={() => load()} className="mt-3 px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700">
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!enterprise) return (
    <div className="p-6 flex items-center justify-center min-h-96">
      <div className="bg-white rounded-2xl border border-slate-200 p-10 max-w-md text-center shadow-sm">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🌱</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">{meta.name}</h2>
        <p className="text-sm text-slate-500 mb-6">{meta.description}.<br />Set up this enterprise to start tracking batches, feeding, and records.</p>
        <button onClick={setupEnterprise} disabled={creating} className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2 mx-auto">
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Set Up {meta.name}
        </button>
      </div>
    </div>
  );

  const activeBatches = batches.filter(b => b.status === 'active');

  // ─── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">🌿</div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{enterprise.name}</h1>
            <p className="text-sm text-slate-500">{batches.length} batch{batches.length !== 1 ? 'es' : ''} · {activeBatches.length} active</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 hover:bg-slate-100 rounded-lg" title="Refresh"><RefreshCw className="w-4 h-4 text-slate-500" /></button>
          {canCreate(enterpriseId) && (
            <button onClick={() => { setShowNewBatch(true); setBatchError(null); }} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> New Batch
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Batches', value: batches.length },
          { label: 'Active', value: activeBatches.length, green: true },
          { label: `Active ${enterprise.batchUnit || 'units'}`, value: activeBatches.reduce((s: number, b: any) => s + (parseFloat(b.quantity) || 0), 0).toLocaleString() },
          { label: 'Records logged', value: records.length },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.green ? 'text-green-600' : 'text-slate-900'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          {(['batches', 'feeding', 'health', 'records', 'activities'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t ? 'border-green-600 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t === 'batches' ? 'Batches' : t === 'feeding' ? 'Feeding Guide' : t === 'health' ? 'Health' : t === 'records' ? 'Daily Records' : 'Activities'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── BATCHES TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'batches' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
              <tr>
                <th className="text-left px-4 py-3">Batch</th>
                <th className="text-right px-4 py-3">Qty</th>
                <th className="text-left px-4 py-3">Age</th>
                <th className="text-left px-4 py-3">Start → End</th>
                <th className="text-left px-4 py-3">Stage</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No batches yet — click "New Batch" to get started.</td></tr>
              ) : batches.map(b => {
                const age = getBatchAgeDays(b.startDate);
                const stage = getStageForAge(enterpriseId, age);
                return (
                  <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{b.name}</div>
                      {b.batchNumber && <div className="text-xs text-slate-400">{b.batchNumber}</div>}
                    </td>
                    <td className="px-4 py-3 text-right">{parseFloat(b.quantity).toLocaleString()} {b.unit}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">Day {age}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{b.startDate} → {b.expectedEndDate || '—'}</td>
                    <td className="px-4 py-3">
                      {stage
                        ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{stage.stage}</span>
                        : b.currentStage
                          ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{b.currentStage.name}</span>
                          : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${BATCH_STATUS_COLORS[b.status] || ''}`}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {b.status === 'active' && canEdit(enterpriseId) && (
                        <button onClick={() => advanceBatch(b.id)} className="text-xs px-3 py-1 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600">
                          Advance →
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── FEEDING GUIDE TAB ───────────────────────────────────────────────── */}
      {activeTab === 'feeding' && (
        <div className="space-y-6">
          {/* Today's per-batch recommendations */}
          {activeBatches.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Wheat className="w-4 h-4 text-green-600" /> Today's Feeding Plan
                <span className="text-xs font-normal text-slate-500">(auto-calculated from batch age × quantity)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeBatches.map(b => {
                  const age = getBatchAgeDays(b.startDate);
                  const stage = getStageForAge(enterpriseId, age);
                  const qty = parseFloat(b.quantity) || 0;
                  const customStage = feedingSchedule[0] && stage
                    ? feedingSchedule.find(s => s.stage === stage.stage) || stage
                    : stage;
                  if (!customStage) return (
                    <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-5">
                      <div className="font-medium mb-1">{b.name}</div>
                      <p className="text-xs text-slate-500">Day {age} — no feeding guide for this stage.</p>
                    </div>
                  );
                  const totalFeed = ((customStage.feedPerAnimalGrams * qty) / 1000).toFixed(1);
                  const totalWater = ((customStage.waterPerAnimalMl * qty) / 1000).toFixed(0);
                  return (
                    <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="font-semibold text-slate-900">{b.name}</div>
                          <div className="text-xs text-slate-500">Day {age} · {qty.toLocaleString()} {b.unit} · <span className="font-medium text-blue-700">{customStage.stage}</span></div>
                        </div>
                        <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded font-semibold">{customStage.feedType}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <div className="flex items-center gap-1 text-xs text-amber-700 mb-1"><Wheat className="w-3 h-3" /> Feed Today</div>
                          <div className="text-xl font-bold text-slate-900">{totalFeed} kg</div>
                          <div className="text-[10px] text-slate-500">{customStage.feedPerAnimalGrams}g per {b.unit.slice(0, -1) || 'animal'}</div>
                        </div>
                        <div className="p-3 bg-cyan-50 rounded-lg">
                          <div className="flex items-center gap-1 text-xs text-cyan-700 mb-1"><Droplet className="w-3 h-3" /> Water Today</div>
                          <div className="text-xl font-bold text-slate-900">{parseInt(totalWater) > 0 ? `${totalWater} L` : 'N/A'}</div>
                          <div className="text-[10px] text-slate-500">{customStage.waterPerAnimalMl > 0 ? `${customStage.waterPerAnimalMl}ml per ${b.unit.slice(0, -1) || 'animal'}` : 'Aquatic species'}</div>
                        </div>
                      </div>
                      {customStage.notes && (
                        <p className="text-xs text-slate-600 italic border-l-2 border-green-500 pl-2">{customStage.notes}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeBatches.length === 0 && (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500">
              <Wheat className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">Create an active batch to see today's per-batch feeding plan.</p>
            </div>
          )}

          {/* Feeding standards table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Feeding & Water Standards</h3>
                <p className="text-xs text-slate-500">Per-animal daily amounts used for all calculations. Customise to match your breed / conditions.</p>
              </div>
              {!editingSchedule ? (
                <button onClick={() => setEditingSchedule(true)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <Edit2 className="w-3 h-3" /> Edit Standards
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { setEditingSchedule(false); setFeedingSchedule(enterprise.settings?.feedingSchedule || defaultFeedingTable); }} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50">
                    Cancel
                  </button>
                  <button onClick={handleSaveSchedule} disabled={savingSchedule} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60">
                    {savingSchedule ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save Standards
                  </button>
                </div>
              )}
            </div>
            {feedingSchedule.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No feeding standards defined for this enterprise type.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
                  <tr>
                    <th className="text-left px-4 py-2.5">Stage</th>
                    <th className="text-left px-4 py-2.5">Age Range</th>
                    <th className="text-left px-4 py-2.5">Feed Type</th>
                    <th className="text-right px-4 py-2.5">Feed/animal/day</th>
                    <th className="text-right px-4 py-2.5">Water/animal/day</th>
                    <th className="text-left px-4 py-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {feedingSchedule.map((s, i) => (
                    <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{s.stage}</td>
                      <td className="px-4 py-3 text-slate-600">{s.ageRange}</td>
                      <td className="px-4 py-3">
                        {editingSchedule
                          ? <input value={s.feedType} onChange={e => setFeedingSchedule(prev => prev.map((r, j) => j === i ? { ...r, feedType: e.target.value } : r))} className="w-full px-2 py-1 border border-slate-200 rounded text-xs" />
                          : <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">{s.feedType}</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingSchedule
                          ? (
                            <div className="flex items-center justify-end gap-1">
                              <input type="number" step="1" min="0" value={s.feedPerAnimalGrams} onChange={e => setFeedingSchedule(prev => prev.map((r, j) => j === i ? { ...r, feedPerAnimalGrams: +e.target.value } : r))} className="w-20 px-2 py-1 border border-slate-200 rounded text-xs text-right" />
                              <span className="text-xs text-slate-500">g</span>
                            </div>
                          )
                          : <span className="font-mono">{s.feedPerAnimalGrams >= 1000 ? `${(s.feedPerAnimalGrams / 1000).toFixed(1)}kg` : `${s.feedPerAnimalGrams}g`}</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingSchedule
                          ? (
                            <div className="flex items-center justify-end gap-1">
                              <input type="number" step="1" min="0" value={s.waterPerAnimalMl} onChange={e => setFeedingSchedule(prev => prev.map((r, j) => j === i ? { ...r, waterPerAnimalMl: +e.target.value } : r))} className="w-20 px-2 py-1 border border-slate-200 rounded text-xs text-right" />
                              <span className="text-xs text-slate-500">ml</span>
                            </div>
                          )
                          : <span className="font-mono">{s.waterPerAnimalMl === 0 ? 'N/A' : s.waterPerAnimalMl >= 1000 ? `${(s.waterPerAnimalMl / 1000).toFixed(1)}L` : `${s.waterPerAnimalMl}ml`}</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {editingSchedule
                          ? <input value={s.notes} onChange={e => setFeedingSchedule(prev => prev.map((r, j) => j === i ? { ...r, notes: e.target.value } : r))} className="w-full px-2 py-1 border border-slate-200 rounded text-xs" />
                          : s.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── HEALTH TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4"><Heart className="w-4 h-4 text-red-500" /> Vaccination Schedule</h3>
            <p className="text-sm text-slate-500 mb-3">Configure enterprise stages with health checks to enable automatic vaccine reminders per batch age.</p>
            {activeBatches.map(b => {
              const age = getBatchAgeDays(b.startDate);
              return (
                <div key={b.id} className="mb-3 p-3 bg-slate-50 rounded-lg">
                  <div className="font-medium text-sm mb-1">{b.name} — Day {age}</div>
                  <div className="text-xs text-slate-500">Use the "Advance Stage" button on the Batches tab to track progress through health checkpoints.</div>
                </div>
              );
            })}
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4"><AlertCircle className="w-4 h-4 text-amber-500" /> Daily Biosecurity Checklist</h3>
            <div className="space-y-2 text-sm">
              {['Footbath disinfectant changed', 'House / pen cleaning logged', 'Pest control inspection', 'Visitor log updated', 'Equipment sterilisation', 'Mortality disposal protocol', 'Water quality check', 'Feed storage inspection'].map((item, i) => (
                <label key={i} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-green-600 rounded" />
                  <span className="text-slate-700">{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── DAILY RECORDS TAB ───────────────────────────────────────────────── */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          {/* Input form */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900">Log Daily Record</h3>
                <p className="text-xs text-slate-500">Record mortality, feed issued, water consumed, and weight</p>
              </div>
              {recForm.batchId && (
                <button type="button" onClick={autoFillFromBatch} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-green-200 text-green-700 rounded-lg hover:bg-green-50">
                  <Wheat className="w-3 h-3" /> Auto-fill from feeding guide
                </button>
              )}
            </div>
            {recSaved && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">✓ Record saved successfully.</div>}
            {recError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{recError}</div>}
            {activeBatches.length === 0 ? (
              <p className="text-sm text-slate-500">No active batches. Create a batch first to log daily records.</p>
            ) : (
              <form onSubmit={handleSaveRecord} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Batch *</label>
                  <select value={recForm.batchId} onChange={e => setRecForm(f => ({ ...f, batchId: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    {activeBatches.map((b: any) => <option key={b.id} value={b.id}>{b.name} (Day {getBatchAgeDays(b.startDate)})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Record Date *</label>
                  <input type="date" value={recForm.recordDate} onChange={e => setRecForm(f => ({ ...f, recordDate: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mortality (deaths today)</label>
                  <input type="number" min="0" value={recForm.mortality} onChange={e => setRecForm(f => ({ ...f, mortality: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Feed Issued (kg) *</label>
                  <input required type="number" step="0.1" min="0" value={recForm.feedKg} onChange={e => setRecForm(f => ({ ...f, feedKg: e.target.value }))} placeholder="e.g. 120.5" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Water Consumed (L)</label>
                  <input type="number" step="1" min="0" value={recForm.waterL} onChange={e => setRecForm(f => ({ ...f, waterL: e.target.value }))} placeholder="e.g. 250" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Avg Weight (kg)</label>
                  <input type="number" step="0.01" min="0" value={recForm.avgWeight} onChange={e => setRecForm(f => ({ ...f, avgWeight: e.target.value }))} placeholder="e.g. 1.45" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div className="col-span-2 md:col-span-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Observations / Notes</label>
                  <input type="text" value={recForm.notes} onChange={e => setRecForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any observations, abnormal behaviour, health issues…" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div className="col-span-2 md:col-span-3">
                  {canCreate(enterpriseId) ? (
                    <button type="submit" disabled={recSubmitting} className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-60 flex items-center gap-2">
                      {recSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Save Record
                    </button>
                  ) : (
                    <p className="text-xs text-slate-400 italic">View-only access — contact your director to enable data entry.</p>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Recent records */}
          {records.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Recent Records</h3>
                <p className="text-xs text-slate-500">Last {records.length} entries for this enterprise</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
                  <tr>
                    <th className="text-left px-4 py-2.5">Date</th>
                    <th className="text-left px-4 py-2.5">Batch</th>
                    <th className="text-right px-4 py-2.5">Mortality</th>
                    <th className="text-right px-4 py-2.5">Feed (kg)</th>
                    <th className="text-right px-4 py-2.5">Water (L)</th>
                    <th className="text-right px-4 py-2.5">Avg Wt (kg)</th>
                    <th className="text-left px-4 py-2.5">Notes</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r: any) => {
                    let d: any = {};
                    try { d = typeof r.data === 'string' ? JSON.parse(r.data) : r.data; } catch {}
                    return (
                      <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50 group">
                        <td className="px-4 py-2.5 font-medium">{r.recordDate}</td>
                        <td className="px-4 py-2.5 text-slate-600">{r.batch?.name || '—'}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={d.mortality > 0 ? 'text-red-600 font-medium' : ''}>{d.mortality ?? '—'}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right">{d.feedKg ?? '—'}</td>
                        <td className="px-4 py-2.5 text-right">{d.waterL ?? '—'}</td>
                        <td className="px-4 py-2.5 text-right">{d.avgWeightKg ?? '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{d.notes || '—'}</td>
                        <td className="px-4 py-2.5">
                          <button
                            onClick={() => openEditRec(r)}
                            title="Edit record"
                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
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

      {/* ─── ACTIVITIES TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'activities' && enterprise && (
        <ActivityScheduler
          moduleType={enterpriseId}
          enterpriseId={enterprise.id}
          enterpriseName={enterprise.name}
          batches={batches.map((b: any) => ({ id: b.id, name: b.name }))}
        />
      )}

      {/* ─── EDIT RECORD MODAL ───────────────────────────────────────────────── */}
      {editRec && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900">Edit Record</h2>
                <p className="text-xs text-slate-500">{editRec.recordDate} · {editRec.batch?.name || 'No batch'}</p>
              </div>
              <button onClick={() => setEditRec(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleUpdateRecord} className="p-5 space-y-4">
              {editError && <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{editError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mortality (deaths)</label>
                  <input type="number" min="0" step="1" value={editForm.mortality}
                    onChange={e => setEditForm(f => ({ ...f, mortality: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Feed Issued (kg)</label>
                  <input type="number" min="0" step="0.1" value={editForm.feedKg}
                    onChange={e => setEditForm(f => ({ ...f, feedKg: e.target.value }))}
                    placeholder="e.g. 120.5"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Water Consumed (L)</label>
                  <input type="number" min="0" step="0.1" value={editForm.waterL}
                    onChange={e => setEditForm(f => ({ ...f, waterL: e.target.value }))}
                    placeholder="e.g. 250"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Avg Weight (kg)</label>
                  <input type="number" min="0" step="0.01" value={editForm.avgWeight}
                    onChange={e => setEditForm(f => ({ ...f, avgWeight: e.target.value }))}
                    placeholder="e.g. 1.45"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Observations / Notes</label>
                <textarea rows={2} value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any observations..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditRec(null)}
                  className="flex-1 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={editSubmitting}
                  className="flex-1 py-2 bg-green-600 rounded-xl text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
                  {editSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── NEW BATCH MODAL ─────────────────────────────────────────────────── */}
      {showNewBatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div><h2 className="font-bold text-slate-900">New Batch</h2><p className="text-xs text-slate-500">{enterprise.name}</p></div>
              <button onClick={() => setShowNewBatch(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateBatch} className="p-5 space-y-3">
              {batchError && <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{batchError}</div>}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Batch Name *</label>
                <input required value={batchForm.name} onChange={e => setBatchForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="e.g. Broiler Batch A — June 2026" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Initial Count ({enterprise.batchUnit}) *</label>
                <input required type="number" min="1" step="1" value={batchForm.quantity} onChange={e => setBatchForm(f => ({ ...f, quantity: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Date *</label>
                  <input required type="date" value={batchForm.startDate} onChange={e => setBatchForm(f => ({ ...f, startDate: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Expected End Date</label>
                  <input type="date" value={batchForm.expectedEndDate} onChange={e => setBatchForm(f => ({ ...f, expectedEndDate: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                <input value={batchForm.notes} onChange={e => setBatchForm(f => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="House/pen, breed, supplier…" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewBatch(false)} className="flex-1 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={batchSubmitting} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                  {batchSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
