/**
 * Crop Rotation Planner — field history, rotation schedule, recommendations
 * Fully localStorage-based; no backend required.
 */
import React, { useState, useMemo } from 'react';
import { Sprout, Calendar, Plus, X, AlertTriangle, CheckCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { useOrg } from '@/store/orgStore';
import { v4 as uuidv4 } from 'uuid';

// ─── Types ────────────────────────────────────────────────────────────────────

type CropFamily = 'legume' | 'cereal' | 'brassica' | 'solanaceae' | 'cucurbit' | 'root' | 'leafy' | 'tree' | 'fallow';

interface FieldRecord {
  id: string;
  fieldName: string;
  areaHa: number;
  crop: string;
  cropFamily: CropFamily;
  season: string;        // e.g. '2024-A', '2025-B'
  startDate: string;
  endDate: string;
  yieldKgPerHa?: number;
  notes: string;
  enterpriseId: string;
}

interface Field {
  id: string;
  name: string;
  areaHa: number;
  soilType: string;
  location: string;
  enterpriseId: string;
}

// Rotation rules: which crop families should NOT follow which
const BAD_SUCCESSIONS: Record<CropFamily, CropFamily[]> = {
  cereal:      ['cereal'],                          // monocrop depletes N
  solanaceae:  ['solanaceae', 'brassica'],          // disease carry-over
  brassica:    ['brassica', 'solanaceae'],
  root:        ['root'],
  cucurbit:    ['cucurbit'],
  legume:      [],                                  // legumes fix N — generally safe
  leafy:       ['leafy'],
  tree:        [],
  fallow:      [],
};

const GOOD_AFTER: Record<CropFamily, string> = {
  legume:      'Excellent nitrogen fixer — great before cereals',
  fallow:      'Soil rest improves structure; weed suppression',
  cereal:      'Light residue; follow with legume to restore N',
  brassica:    'Biofumigation properties — reduces soil pathogens',
  root:        'Improves drainage; good before brassicas',
  solanaceae:  'Ensure 3-year gap before repeating',
  cucurbit:    'Leave at least 2 years before repeating',
  leafy:       'Quick cycle; rotate with deeper-rooted crops',
  tree:        'Permanent — plan annuals around canopy',
};

const FAMILY_COLORS: Record<CropFamily, string> = {
  legume:     'bg-green-100 text-green-800',
  cereal:     'bg-amber-100 text-amber-800',
  brassica:   'bg-lime-100 text-lime-800',
  solanaceae: 'bg-red-100 text-red-800',
  cucurbit:   'bg-orange-100 text-orange-800',
  root:       'bg-yellow-100 text-yellow-800',
  leafy:      'bg-emerald-100 text-emerald-800',
  tree:       'bg-teal-100 text-teal-800',
  fallow:     'bg-slate-100 text-slate-600',
};

const LS_FIELDS   = 'agronexus_v2_cr_fields';
const LS_HISTORY  = 'agronexus_v2_cr_history';

function seedFields(eid: string): Field[] {
  return [
    { id:'f-1', name:'Field A — North', areaHa:2.5, soilType:'Sandy loam', location:'North paddock', enterpriseId:eid },
    { id:'f-2', name:'Field B — South', areaHa:1.8, soilType:'Clay loam',  location:'South paddock', enterpriseId:eid },
    { id:'f-3', name:'Field C — East',  areaHa:3.2, soilType:'Loam',       location:'East block',    enterpriseId:eid },
  ];
}

function seedHistory(fields: Field[]): FieldRecord[] {
  if (!fields.length) return [];
  const [f1, f2, f3] = fields;
  return [
    { id:'r-1', fieldName:f1.name, areaHa:f1.areaHa, crop:'Maize',    cropFamily:'cereal',     season:'2023-A', startDate:'2023-01-10', endDate:'2023-06-20', yieldKgPerHa:5200, notes:'Good yield, used hybrid seed', enterpriseId:f1.enterpriseId },
    { id:'r-2', fieldName:f1.name, areaHa:f1.areaHa, crop:'Soybeans', cropFamily:'legume',     season:'2023-B', startDate:'2023-08-01', endDate:'2023-12-10', yieldKgPerHa:2100, notes:'N-fixation benefit planned for 2024', enterpriseId:f1.enterpriseId },
    { id:'r-3', fieldName:f1.name, areaHa:f1.areaHa, crop:'Maize',    cropFamily:'cereal',     season:'2024-A', startDate:'2024-01-15', endDate:'2024-06-25', yieldKgPerHa:5800, notes:'Post-legume yield boost confirmed', enterpriseId:f1.enterpriseId },
    { id:'r-4', fieldName:f2?.name??'', areaHa:f2?.areaHa??0, crop:'Tomatoes',  cropFamily:'solanaceae', season:'2023-A', startDate:'2023-02-01', endDate:'2023-05-30', yieldKgPerHa:18000, notes:'', enterpriseId:f2?.enterpriseId??'' },
    { id:'r-5', fieldName:f2?.name??'', areaHa:f2?.areaHa??0, crop:'Tomatoes',  cropFamily:'solanaceae', season:'2023-B', startDate:'2023-08-15', endDate:'2023-11-30', yieldKgPerHa:14000, notes:'Blight noticed — needs rotation', enterpriseId:f2?.enterpriseId??'' },
    { id:'r-6', fieldName:f2?.name??'', areaHa:f2?.areaHa??0, crop:'Groundnuts',cropFamily:'legume',     season:'2024-A', startDate:'2024-01-20', endDate:'2024-06-10', yieldKgPerHa:1800, notes:'Breaking solanaceae cycle', enterpriseId:f2?.enterpriseId??'' },
    { id:'r-7', fieldName:f3?.name??'', areaHa:f3?.areaHa??0, crop:'Fallow',    cropFamily:'fallow',     season:'2023-A', startDate:'2023-01-01', endDate:'2023-06-30', yieldKgPerHa:0, notes:'Cover crop (tithonia) planted', enterpriseId:f3?.enterpriseId??'' },
    { id:'r-8', fieldName:f3?.name??'', areaHa:f3?.areaHa??0, crop:'Cabbage',   cropFamily:'brassica',   season:'2023-B', startDate:'2023-07-15', endDate:'2023-11-15', yieldKgPerHa:22000, notes:'', enterpriseId:f3?.enterpriseId??'' },
    { id:'r-9', fieldName:f3?.name??'', areaHa:f3?.areaHa??0, crop:'Maize',     cropFamily:'cereal',     season:'2024-A', startDate:'2024-01-10', endDate:'2024-06-20', yieldKgPerHa:4900, notes:'After brassica biofumigation', enterpriseId:f3?.enterpriseId??'' },
  ].filter(r => r.fieldName);
}

function ls<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; } catch { return fallback; }
}

// ─── Rotation recommendation ──────────────────────────────────────────────────

interface Recommendation {
  fieldName: string;
  lastCrop: string;
  lastFamily: CropFamily;
  warning: string | null;
  suggestions: string[];
}

function recommend(fieldName: string, records: FieldRecord[]): Recommendation | null {
  const fieldRecs = records.filter(r => r.fieldName === fieldName).sort((a, b) => b.startDate.localeCompare(a.startDate));
  if (!fieldRecs.length) return null;
  const last = fieldRecs[0];
  const prev = fieldRecs[1];
  const bad = BAD_SUCCESSIONS[last.cropFamily];
  let warning: string | null = null;
  if (prev && bad.includes(prev.cropFamily)) {
    warning = `"${last.crop}" follows "${prev.crop}" — same family (${last.cropFamily}). Disease and pest pressure risk is elevated.`;
  }
  const avoid = [last.cropFamily, ...(bad)];
  const allFamilies: CropFamily[] = ['legume','cereal','brassica','solanaceae','cucurbit','root','leafy','fallow'];
  const good = allFamilies.filter(f => !avoid.includes(f));
  const suggestions = good.map(f => {
    const example: Record<CropFamily, string> = { legume:'Soybeans / Groundnuts / Cowpeas', cereal:'Maize / Sorghum / Wheat', brassica:'Cabbage / Kale / Broccoli', solanaceae:'Tomatoes / Peppers / Potatoes', cucurbit:'Pumpkin / Butternut / Cucumber', root:'Carrots / Beetroot / Sweet potato', leafy:'Spinach / Lettuce / Rape', tree:'Fruit trees (permanent)', fallow:'Cover crop / Tithonia fallow' };
    return `${example[f]} (${f})`;
  });
  return { fieldName, lastCrop: last.crop, lastFamily: last.cropFamily, warning, suggestions };
}

// ─── Components ───────────────────────────────────────────────────────────────

export default function CropRotation() {
  const { org, enterprises } = useOrg();
  const eid = enterprises[0]?.id ?? '';

  const [fields, setFields] = useState<Field[]>(() => {
    const stored = ls<Field[]>(LS_FIELDS, []);
    if (stored.length) return stored;
    const seed = seedFields(eid);
    localStorage.setItem(LS_FIELDS, JSON.stringify(seed));
    return seed;
  });

  const [history, setHistory] = useState<FieldRecord[]>(() => {
    const stored = ls<FieldRecord[]>(LS_HISTORY, []);
    if (stored.length) return stored;
    const seed = seedHistory(fields);
    localStorage.setItem(LS_HISTORY, JSON.stringify(seed));
    return seed;
  });

  const [tab, setTab] = useState<'overview' | 'fields' | 'history' | 'planner'>('overview');
  const [showAddField, setShowAddField] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [newField, setNewField] = useState<Partial<Field>>({ enterpriseId: eid });
  const [newRecord, setNewRecord] = useState<Partial<FieldRecord>>({ enterpriseId: eid, cropFamily: 'cereal' });

  function saveFields(f: Field[]) { setFields(f); localStorage.setItem(LS_FIELDS, JSON.stringify(f)); }
  function saveHistory(h: FieldRecord[]) { setHistory(h); localStorage.setItem(LS_HISTORY, JSON.stringify(h)); }

  const recommendations = useMemo(() =>
    fields.map(f => recommend(f.name, history)).filter(Boolean) as Recommendation[],
  [fields, history]);

  const fieldNames = [...new Set(history.map(r => r.fieldName))];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-slate-900">Crop Rotation Planner</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddField(true)} className="flex items-center gap-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"><Plus className="w-3 h-3" />Add Field</button>
            <button onClick={() => setShowAddRecord(true)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"><Plus className="w-3 h-3" />Log Season</button>
          </div>
        </div>
        <div className="flex gap-1">
          {(['overview','fields','history','planner'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize ${tab===t ? 'bg-green-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-5 max-w-3xl">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-2xl font-bold text-slate-900">{fields.length}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">Registered Fields</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-2xl font-bold text-slate-900">{history.length}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">Season Records</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-2xl font-bold text-amber-600">{recommendations.filter(r => r.warning).length}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">Rotation Warnings</div>
              </div>
            </div>

            {/* Warnings */}
            {recommendations.filter(r => r.warning).map(r => (
              <div key={r.fieldName} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-900 text-sm">{r.fieldName}</div>
                  <div className="text-xs text-amber-800 mt-0.5">{r.warning}</div>
                </div>
              </div>
            ))}

            {/* Recommendations per field */}
            {recommendations.map(r => (
              <div key={r.fieldName} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Sprout className="w-4 h-4 text-green-600" />
                  <h3 className="font-semibold text-slate-800">{r.fieldName}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${FAMILY_COLORS[r.lastFamily]}`}>{r.lastCrop}</span>
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                  <span className="text-xs text-slate-500">Next season — recommended crops:</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {r.suggestions.slice(0, 4).map((s, i) => (
                    <div key={i} className="flex items-start gap-2 bg-green-50 rounded-lg p-2.5">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-green-800">{s}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-slate-400 bg-slate-50 rounded-lg p-2">
                  {GOOD_AFTER[r.lastFamily]}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── FIELDS ── */}
        {tab === 'fields' && (
          <div className="max-w-2xl space-y-3">
            {fields.length === 0 && (
              <div className="text-center py-16 text-slate-400 text-sm">No fields registered yet. Add your first field.</div>
            )}
            {fields.map(f => {
              const fHistory = history.filter(r => r.fieldName === f.name).sort((a,b) => b.startDate.localeCompare(a.startDate));
              const lastCrop = fHistory[0];
              return (
                <div key={f.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{f.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{f.areaHa} ha · {f.soilType} · {f.location}</div>
                    </div>
                    <div className="flex gap-2 items-center">
                      {lastCrop && <span className={`text-[10px] px-2 py-0.5 rounded-full ${FAMILY_COLORS[lastCrop.cropFamily]}`}>{lastCrop.crop} ({lastCrop.season})</span>}
                      <button onClick={() => saveFields(fields.filter(x => x.id !== f.id))} className="text-slate-300 hover:text-red-400 text-xs">✕</button>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
                    {fHistory.slice(0, 6).reverse().map((r, i) => (
                      <div key={i} className={`flex-shrink-0 text-[10px] px-2 py-1 rounded ${FAMILY_COLORS[r.cropFamily]}`}>
                        {r.season}: {r.crop}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab === 'history' && (
          <div className="max-w-3xl bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 text-slate-500">
                  <th className="text-left px-4 py-2.5">Field</th>
                  <th className="text-left px-4 py-2.5">Season</th>
                  <th className="text-left px-4 py-2.5">Crop</th>
                  <th className="text-left px-4 py-2.5">Family</th>
                  <th className="text-right px-4 py-2.5">Yield (kg/ha)</th>
                  <th className="text-left px-4 py-2.5">Notes</th>
                  <th className="px-4 py-2.5"></th>
                </tr></thead>
                <tbody>
                  {history.slice().sort((a,b) => b.startDate.localeCompare(a.startDate)).map(r => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{r.fieldName}</td>
                      <td className="px-4 py-2.5 text-slate-600">{r.season}</td>
                      <td className="px-4 py-2.5 text-slate-700">{r.crop}</td>
                      <td className="px-4 py-2.5"><span className={`text-[10px] px-1.5 py-0.5 rounded-full ${FAMILY_COLORS[r.cropFamily]}`}>{r.cropFamily}</span></td>
                      <td className="px-4 py-2.5 text-right text-slate-600">{r.yieldKgPerHa ? r.yieldKgPerHa.toLocaleString() : '—'}</td>
                      <td className="px-4 py-2.5 text-slate-400 max-w-[200px] truncate">{r.notes || '—'}</td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => saveHistory(history.filter(x => x.id !== r.id))} className="text-slate-300 hover:text-red-400">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {history.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">No season records yet. Log a season to start tracking.</div>
              )}
            </div>
          </div>
        )}

        {/* ── PLANNER ── */}
        {tab === 'planner' && (
          <div className="max-w-3xl space-y-4">
            <div className="text-sm text-slate-500 mb-2">Visual rotation timeline per field — each block is one season.</div>
            {fields.map(f => {
              const fHistory = history.filter(r => r.fieldName === f.name).sort((a,b) => a.startDate.localeCompare(b.startDate));
              return (
                <div key={f.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-semibold text-sm text-slate-900">{f.name}</span>
                    <span className="text-xs text-slate-400">{f.areaHa} ha</span>
                  </div>
                  {fHistory.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">No seasons logged for this field.</div>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {fHistory.map((r, i) => (
                        <div key={r.id} className="flex-shrink-0 text-center">
                          <div className="text-[10px] text-slate-400 mb-1">{r.season}</div>
                          <div className={`px-3 py-2 rounded-xl text-xs font-medium min-w-[80px] ${FAMILY_COLORS[r.cropFamily]}`}>
                            {r.crop}
                          </div>
                          {r.yieldKgPerHa ? <div className="text-[10px] text-slate-400 mt-1">{r.yieldKgPerHa.toLocaleString()} kg/ha</div> : null}
                          {i < fHistory.length - 1 && (
                            <div className="flex justify-center mt-1"><ArrowRight className="w-3 h-3 text-slate-300" /></div>
                          )}
                        </div>
                      ))}
                      {/* Next season placeholder */}
                      <div className="flex-shrink-0 text-center opacity-50">
                        <div className="text-[10px] text-slate-400 mb-1">Next →</div>
                        <div className="px-3 py-2 rounded-xl text-xs border-2 border-dashed border-slate-300 text-slate-400 min-w-[80px]">Plan</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Field Modal ── */}
      {showAddField && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Add Field</h3>
            {[
              { label:'Field Name', key:'name', placeholder:'e.g. Field A — North Block' },
              { label:'Area (ha)', key:'areaHa', placeholder:'2.5', type:'number' },
              { label:'Soil Type', key:'soilType', placeholder:'e.g. Sandy loam' },
              { label:'Location', key:'location', placeholder:'e.g. North paddock' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                <input type={f.type ?? 'text'} value={(newField as any)[f.key] ?? ''}
                  onChange={e => setNewField(p => ({ ...p, [f.key]: f.type === 'number' ? parseFloat(e.target.value)||0 : e.target.value }))}
                  placeholder={f.placeholder} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowAddField(false); setNewField({ enterpriseId: eid }); }} className="flex-1 py-2 border border-slate-300 rounded-xl text-sm text-slate-600">Cancel</button>
              <button onClick={() => {
                if (!newField.name) return;
                const f: Field = { id:`f-${uuidv4()}`, name:newField.name!, areaHa:newField.areaHa??1, soilType:newField.soilType??'', location:newField.location??'', enterpriseId:eid };
                saveFields([...fields, f]);
                setShowAddField(false); setNewField({ enterpriseId: eid });
              }} className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">Add Field</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Season Record Modal ── */}
      {showAddRecord && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Log Season Record</h3>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Field</label>
              <select value={newRecord.fieldName ?? ''} onChange={e => setNewRecord(p => ({ ...p, fieldName: e.target.value, areaHa: fields.find(f=>f.name===e.target.value)?.areaHa??1 }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                <option value="">Select field…</option>
                {fields.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            {[
              { label:'Crop', key:'crop', placeholder:'e.g. Maize' },
              { label:'Season', key:'season', placeholder:'e.g. 2025-A' },
              { label:'Start Date', key:'startDate', type:'date' },
              { label:'End Date', key:'endDate', type:'date' },
              { label:'Yield (kg/ha)', key:'yieldKgPerHa', type:'number', placeholder:'0' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                <input type={f.type ?? 'text'} value={(newRecord as any)[f.key] ?? ''}
                  onChange={e => setNewRecord(p => ({ ...p, [f.key]: f.type === 'number' ? parseFloat(e.target.value)||0 : e.target.value }))}
                  placeholder={f.placeholder} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Crop Family</label>
              <select value={newRecord.cropFamily ?? 'cereal'} onChange={e => setNewRecord(p => ({ ...p, cropFamily: e.target.value as CropFamily }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                {(['legume','cereal','brassica','solanaceae','cucurbit','root','leafy','fallow'] as CropFamily[]).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowAddRecord(false); setNewRecord({ enterpriseId: eid, cropFamily:'cereal' }); }} className="flex-1 py-2 border border-slate-300 rounded-xl text-sm text-slate-600">Cancel</button>
              <button onClick={() => {
                if (!newRecord.fieldName || !newRecord.crop || !newRecord.season) return;
                const r: FieldRecord = { id:`r-${uuidv4()}`, fieldName:newRecord.fieldName!, areaHa:newRecord.areaHa??1, crop:newRecord.crop!, cropFamily:newRecord.cropFamily??'cereal', season:newRecord.season!, startDate:newRecord.startDate??new Date().toISOString().slice(0,10), endDate:newRecord.endDate??'', yieldKgPerHa:newRecord.yieldKgPerHa, notes:newRecord.notes??'', enterpriseId:eid };
                saveHistory([...history, r]);
                setShowAddRecord(false); setNewRecord({ enterpriseId: eid, cropFamily:'cereal' });
              }} className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">Save Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
