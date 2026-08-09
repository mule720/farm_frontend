// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Inventory Engine
// Universal materials management: stock levels, movements, locations, batches
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import {
  Plus, X, Package, ArrowDown, ArrowUp, ArrowLeftRight,
  Search, ChevronRight, BarChart3, MapPin, Filter,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// ─── Types ───────────────────────────────────────────────────────────────────
type MaterialCategory = 'feed' | 'medicine' | 'seed' | 'fertiliser' | 'chemical' | 'equipment' | 'packaging' | 'produce' | 'processed' | 'other';
type MovementType = 'in' | 'out' | 'adjustment' | 'transfer';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: MaterialCategory;
  unit: string;
  currentQty: number;
  minStockLevel: number;
  costPerUnit?: number;
  location?: string;
  supplier?: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
}

interface StockMovement {
  id: string;
  itemId: string;
  type: MovementType;
  qty: number;
  date: string;
  reference?: string;       // batch #, cycle #, PO #
  destination?: string;     // for transfers
  unitCost?: number;
  notes?: string;
  createdAt: string;
}

// ─── Storage ─────────────────────────────────────────────────────────────────
const ITEMS_KEY = 'agronexus_v2_inventory_items';
const MOVES_KEY = 'agronexus_v2_inventory_moves';

function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(ITEMS_KEY) ?? '[]'); } catch { return []; }
  });
  const [movements, setMovements] = useState<StockMovement[]>(() => {
    try { return JSON.parse(localStorage.getItem(MOVES_KEY) ?? '[]'); } catch { return []; }
  });

  React.useEffect(() => { localStorage.setItem(ITEMS_KEY, JSON.stringify(items)); }, [items]);
  React.useEffect(() => { localStorage.setItem(MOVES_KEY, JSON.stringify(movements)); }, [movements]);

  function addItem(item: Omit<InventoryItem, 'id' | 'createdAt'>) {
    const newItem = { ...item, id: uuidv4(), createdAt: new Date().toISOString() };
    setItems(prev => [...prev, newItem]);
    return newItem;
  }
  function updateItem(id: string, patch: Partial<InventoryItem>) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  }
  function deleteItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }
  function recordMovement(move: Omit<StockMovement, 'id' | 'createdAt'>) {
    const m = { ...move, id: uuidv4(), createdAt: new Date().toISOString() };
    setMovements(prev => [...prev, m]);
    // Update currentQty
    setItems(prev => prev.map(item => {
      if (item.id !== move.itemId) return item;
      const delta = move.type === 'in' ? move.qty : move.type === 'out' ? -move.qty : move.type === 'adjustment' ? move.qty : -move.qty;
      return { ...item, currentQty: Math.max(0, item.currentQty + delta) };
    }));
    return m;
  }
  function getItemMovements(itemId: string) {
    return movements.filter(m => m.itemId === itemId).sort((a, b) => b.date.localeCompare(a.date));
  }

  return { items, movements, addItem, updateItem, deleteItem, recordMovement, getItemMovements };
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  feed: 'Feed & Fodder', medicine: 'Medicines', seed: 'Seeds', fertiliser: 'Fertiliser',
  chemical: 'Chemicals', equipment: 'Equipment', packaging: 'Packaging',
  produce: 'Produce', processed: 'Processed Goods', other: 'Other',
};
const CATEGORY_ICONS: Record<MaterialCategory, string> = {
  feed: '🌾', medicine: '💊', seed: '🌱', fertiliser: '🧪', chemical: '⚗️',
  equipment: '🔧', packaging: '📦', produce: '🥬', processed: '🏭', other: '📋',
};

export default function InventoryEngine() {
  const { items, addItem, updateItem, deleteItem, recordMovement, getItemMovements } = useInventory();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<MaterialCategory | 'all'>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'ok'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showMovement, setShowMovement] = useState<{ itemId: string; type: MovementType } | null>(null);

  const filtered = useMemo(() => {
    return items.filter(i => {
      const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === 'all' || i.category === filterCat;
      const matchStock = filterStock === 'all' || (filterStock === 'low' ? i.currentQty <= i.minStockLevel : i.currentQty > i.minStockLevel);
      return matchSearch && matchCat && matchStock;
    });
  }, [items, search, filterCat, filterStock]);

  const selected = selectedId ? items.find(i => i.id === selectedId) : null;
  const lowStockCount = items.filter(i => i.currentQty <= i.minStockLevel).length;

  // Stats
  const totalValue = items.reduce((s, i) => s + (i.currentQty * (i.costPerUnit ?? 0)), 0);

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 border-r border-slate-200 bg-white`}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-100 flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Inventory</h2>
              <p className="text-xs text-slate-500">{items.length} items · {lowStockCount > 0 && <span className="text-red-500">{lowStockCount} low</span>}</p>
            </div>
            <button onClick={() => setShowAddItem(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…"
              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          {/* Filters */}
          <div className="flex gap-1.5 flex-wrap">
            <select value={filterCat} onChange={e => setFilterCat(e.target.value as any)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="all">All Categories</option>
              {(Object.keys(CATEGORY_LABELS) as MaterialCategory[]).map(c => (
                <option key={c} value={c}>{CATEGORY_ICONS[c]} {CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
              {(['all', 'ok', 'low'] as const).map(s => (
                <button key={s} onClick={() => setFilterStock(s)}
                  className={`px-2.5 py-1 capitalize ${filterStock === s ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                  {s === 'all' ? 'All' : s === 'ok' ? '✓ OK' : '⚠ Low'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Package className="w-8 h-8 mx-auto mb-3 opacity-25" />
              <p className="text-sm">{items.length === 0 ? 'No items yet.' : 'No matching items.'}</p>
            </div>
          )}
          {filtered.map(item => (
            <ItemRow key={item.id} item={item} selected={selectedId === item.id} onClick={() => setSelectedId(item.id)} />
          ))}
        </div>

        {/* Footer stats */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500 flex justify-between">
            <span>{items.length} items</span>
            {totalValue > 0 && <span>Total value: <span className="font-semibold text-slate-700">{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></span>}
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className={`${selected ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-slate-50 min-w-0`}>
        {selected ? (
          <ItemDetail
            item={selected}
            movements={getItemMovements(selected.id).slice(0, 50)}
            onClose={() => setSelectedId(null)}
            onUpdate={patch => updateItem(selected.id, patch)}
            onDelete={() => { deleteItem(selected.id); setSelectedId(null); }}
            onRecordMovement={(type) => setShowMovement({ itemId: selected.id, type })}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <AddItemModal
          onSave={data => { addItem(data); setShowAddItem(false); }}
          onClose={() => setShowAddItem(false)}
        />
      )}

      {/* Movement Modal */}
      {showMovement && (
        <MovementModal
          item={items.find(i => i.id === showMovement.itemId)!}
          type={showMovement.type}
          onSave={move => { recordMovement(move); setShowMovement(null); }}
          onClose={() => setShowMovement(null)}
        />
      )}
    </div>
  );
}

// ─── Item Row ─────────────────────────────────────────────────────────────────
function ItemRow({ item, selected, onClick }: { item: InventoryItem; selected: boolean; onClick: () => void }) {
  const isLow = item.currentQty <= item.minStockLevel;
  return (
    <button onClick={onClick}
      className={`w-full text-left p-3 rounded-xl transition-all ${selected ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'}`}>
      <div className="flex items-center gap-2.5">
        <span className="text-lg">{CATEGORY_ICONS[item.category]}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-slate-800 truncate">{item.name}</div>
          <div className="text-xs text-slate-400 truncate">{item.sku} · {CATEGORY_LABELS[item.category]}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-sm font-bold ${isLow ? 'text-red-500' : 'text-slate-700'}`}>
            {item.currentQty.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400">{item.unit}</div>
        </div>
        {isLow && <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" title="Low stock" />}
      </div>
    </button>
  );
}

// ─── Item Detail ──────────────────────────────────────────────────────────────
type ITab = 'overview' | 'movements' | 'edit';

function ItemDetail({ item, movements, onClose, onUpdate, onDelete, onRecordMovement }: {
  item: InventoryItem;
  movements: StockMovement[];
  onClose: () => void;
  onUpdate: (patch: Partial<InventoryItem>) => void;
  onDelete: () => void;
  onRecordMovement: (type: MovementType) => void;
}) {
  const [tab, setTab] = useState<ITab>('overview');
  const isLow = item.currentQty <= item.minStockLevel;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{CATEGORY_ICONS[item.category]}</span>
            <div>
              <h2 className="font-bold text-slate-900">{item.name}</h2>
              <div className="text-xs text-slate-400">{item.sku} · {CATEGORY_LABELS[item.category]}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg lg:hidden"><X className="w-4 h-4" /></button>
        </div>

        {/* Stock summary */}
        <div className="flex items-center gap-4 mt-3">
          <div>
            <div className={`text-2xl font-bold ${isLow ? 'text-red-500' : 'text-slate-900'}`}>
              {item.currentQty.toLocaleString()}
              <span className="text-sm font-normal text-slate-400 ml-1">{item.unit}</span>
            </div>
            {isLow && <div className="text-xs text-red-500">⚠ Low stock (min: {item.minStockLevel} {item.unit})</div>}
          </div>
          {item.costPerUnit && (
            <div className="text-xs text-slate-500">
              @ {item.costPerUnit}/{item.unit} · value:{' '}
              <span className="font-semibold text-slate-700">{(item.currentQty * item.costPerUnit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mt-3">
          <button onClick={() => onRecordMovement('in')}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-100 text-green-700 rounded-xl text-xs font-medium hover:bg-green-200">
            <ArrowDown className="w-3.5 h-3.5" /> Stock In
          </button>
          <button onClick={() => onRecordMovement('out')}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-600 rounded-xl text-xs font-medium hover:bg-red-200">
            <ArrowUp className="w-3.5 h-3.5" /> Stock Out
          </button>
          <button onClick={() => onRecordMovement('adjustment')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-200">
            <ArrowLeftRight className="w-3.5 h-3.5" /> Adjust
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 mt-4">
          {(['overview', 'movements', 'edit'] as ITab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize ${tab === t ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'overview'   && <OverviewTab   item={item} />}
        {tab === 'movements'  && <MovementsTab  movements={movements} item={item} />}
        {tab === 'edit'       && <EditTab       item={item} onSave={onUpdate} onDelete={onDelete} />}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ item }: { item: InventoryItem }) {
  return (
    <div className="space-y-4 max-w-md">
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">Item Details</h3>
        {[
          ['Name',          item.name],
          ['SKU',           item.sku],
          ['Category',      CATEGORY_LABELS[item.category]],
          ['Unit',          item.unit],
          ['Min Stock',     `${item.minStockLevel} ${item.unit}`],
          ['Cost/Unit',     item.costPerUnit ? String(item.costPerUnit) : '—'],
          ['Location',      item.location ?? '—'],
          ['Supplier',      item.supplier ?? '—'],
          ['Expiry Date',   item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '—'],
          ['Notes',         item.notes ?? '—'],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-3">
            <dt className="text-xs text-slate-400 w-24 flex-shrink-0 pt-0.5">{k}</dt>
            <dd className="text-sm text-slate-700 flex-1">{v}</dd>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Movements Tab ────────────────────────────────────────────────────────────
const MOV_CONFIG: Record<MovementType, { label: string; color: string; icon: React.ReactNode }> = {
  in:         { label: 'Stock In',    color: 'text-green-600',  icon: <ArrowDown  className="w-3.5 h-3.5" /> },
  out:        { label: 'Stock Out',   color: 'text-red-500',    icon: <ArrowUp    className="w-3.5 h-3.5" /> },
  adjustment: { label: 'Adjustment',  color: 'text-amber-600',  icon: <ArrowLeftRight className="w-3.5 h-3.5" /> },
  transfer:   { label: 'Transfer',    color: 'text-blue-500',   icon: <ArrowLeftRight className="w-3.5 h-3.5" /> },
};

function MovementsTab({ movements, item }: { movements: StockMovement[]; item: InventoryItem }) {
  return (
    <div className="space-y-2">
      {movements.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">No movements recorded yet.</div>
      )}
      {movements.map(m => {
        const cfg = MOV_CONFIG[m.type];
        const sign = m.type === 'in' ? '+' : m.type === 'out' ? '-' : '±';
        return (
          <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.type === 'in' ? 'bg-green-100 text-green-600' : m.type === 'out' ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-600'}`}>
              {cfg.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-700">{cfg.label}</span>
                {m.reference && <span className="text-xs text-slate-400">ref: {m.reference}</span>}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                {m.notes && ` · ${m.notes}`}
              </div>
            </div>
            <div className={`text-sm font-bold flex-shrink-0 ${cfg.color}`}>{sign}{m.qty} {item.unit}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Edit Tab ─────────────────────────────────────────────────────────────────
function EditTab({ item, onSave, onDelete }: { item: InventoryItem; onSave: (p: Partial<InventoryItem>) => void; onDelete: () => void }) {
  const [form, setForm] = useState({ ...item });
  const [confirmDelete, setConfirmDelete] = useState(false);

  function set(key: keyof InventoryItem, value: any) { setForm(f => ({ ...f, [key]: value })); }

  return (
    <div className="space-y-4 max-w-md">
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">Edit Item</h3>
        <Field label="Name"><input className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} /></Field>
        <Field label="SKU"><input className={INPUT} value={form.sku} onChange={e => set('sku', e.target.value)} /></Field>
        <Field label="Category">
          <select className={INPUT} value={form.category} onChange={e => set('category', e.target.value)}>
            {(Object.keys(CATEGORY_LABELS) as MaterialCategory[]).map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </Field>
        <Field label="Unit"><input className={INPUT} value={form.unit} onChange={e => set('unit', e.target.value)} /></Field>
        <Field label="Min Stock Level"><input type="number" className={INPUT} value={form.minStockLevel} onChange={e => set('minStockLevel', parseFloat(e.target.value) || 0)} /></Field>
        <Field label="Cost per Unit"><input type="number" step="any" className={INPUT} value={form.costPerUnit ?? ''} onChange={e => set('costPerUnit', parseFloat(e.target.value) || undefined)} /></Field>
        <Field label="Location"><input className={INPUT} value={form.location ?? ''} onChange={e => set('location', e.target.value || undefined)} /></Field>
        <Field label="Supplier"><input className={INPUT} value={form.supplier ?? ''} onChange={e => set('supplier', e.target.value || undefined)} /></Field>
        <Field label="Expiry Date"><input type="date" className={INPUT} value={form.expiryDate ?? ''} onChange={e => set('expiryDate', e.target.value || undefined)} /></Field>
        <Field label="Notes"><textarea className={INPUT + ' resize-none'} rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value || undefined)} /></Field>
        <button onClick={() => onSave(form)} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Save Changes</button>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-red-800">Danger Zone</h3>
        {confirmDelete ? (
          <div className="space-y-2">
            <p className="text-xs text-red-700">This will permanently delete this item and all its movement history.</p>
            <div className="flex gap-2">
              <button onClick={onDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium">Yes, Delete</button>
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="text-xs text-red-600 hover:underline">Delete this item</button>
        )}
      </div>
    </div>
  );
}

// ─── Add Item Modal ────────────────────────────────────────────────────────────
function AddItemModal({ onSave, onClose }: { onSave: (d: Omit<InventoryItem, 'id' | 'createdAt'>) => void; onClose: () => void }) {
  const [form, setForm] = useState<Omit<InventoryItem, 'id' | 'createdAt'>>({
    name: '', sku: '', category: 'other', unit: 'kg', currentQty: 0, minStockLevel: 0,
  });
  function set(key: keyof typeof form, value: any) { setForm(f => ({ ...f, [key]: value })); }

  const autoSku = () => {
    const prefix = form.name.split(' ').map(w => w[0]?.toUpperCase()).join('').slice(0, 4);
    set('sku', prefix + '-' + Math.floor(Math.random() * 9000 + 1000));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="font-bold text-slate-900">Add Inventory Item</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <Field label="Item Name *"><input className={INPUT} placeholder="e.g. Broiler Starter Feed" value={form.name} onChange={e => set('name', e.target.value)} /></Field>
          <Field label="SKU / Code">
            <div className="flex gap-2">
              <input className={INPUT + ' flex-1'} placeholder="SKU-001" value={form.sku} onChange={e => set('sku', e.target.value)} />
              <button onClick={autoSku} className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 whitespace-nowrap">Auto</button>
            </div>
          </Field>
          <Field label="Category">
            <select className={INPUT} value={form.category} onChange={e => set('category', e.target.value)}>
              {(Object.keys(CATEGORY_LABELS) as MaterialCategory[]).map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {CATEGORY_LABELS[c]}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit"><input className={INPUT} placeholder="kg / litre / bag" value={form.unit} onChange={e => set('unit', e.target.value)} /></Field>
            <Field label="Opening Stock"><input type="number" className={INPUT} value={form.currentQty || ''} onChange={e => set('currentQty', parseFloat(e.target.value) || 0)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min Stock Level"><input type="number" className={INPUT} value={form.minStockLevel || ''} onChange={e => set('minStockLevel', parseFloat(e.target.value) || 0)} /></Field>
            <Field label="Cost per Unit"><input type="number" step="any" className={INPUT} placeholder="0.00" value={form.costPerUnit ?? ''} onChange={e => set('costPerUnit', parseFloat(e.target.value) || undefined)} /></Field>
          </div>
          <Field label="Location"><input className={INPUT} placeholder="e.g. Feed Store A" value={form.location ?? ''} onChange={e => set('location', e.target.value || undefined)} /></Field>
          <Field label="Supplier"><input className={INPUT} placeholder="e.g. ABC Feeds Ltd" value={form.supplier ?? ''} onChange={e => set('supplier', e.target.value || undefined)} /></Field>
          <Field label="Notes"><textarea className={INPUT + ' resize-none'} rows={2} placeholder="Any additional notes" value={form.notes ?? ''} onChange={e => set('notes', e.target.value || undefined)} /></Field>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.name.trim()}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Movement Modal ────────────────────────────────────────────────────────────
const MOV_LABELS: Record<MovementType, string> = {
  in: 'Stock In (Receive)', out: 'Stock Out (Dispatch)', adjustment: 'Stock Adjustment', transfer: 'Transfer Location',
};

function MovementModal({ item, type, onSave, onClose }: {
  item: InventoryItem;
  type: MovementType;
  onSave: (m: Omit<StockMovement, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [qty, setQty] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [ref, setRef] = useState('');
  const [notes, setNotes] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [movType, setMovType] = useState<MovementType>(type);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">{MOV_LABELS[movType]}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
            <span className="font-medium text-slate-700">{item.name}</span> · current: <span className="font-bold">{item.currentQty} {item.unit}</span>
          </div>
          <Field label="Movement Type">
            <select className={INPUT} value={movType} onChange={e => setMovType(e.target.value as MovementType)}>
              {(Object.keys(MOV_LABELS) as MovementType[]).map(t => <option key={t} value={t}>{MOV_LABELS[t]}</option>)}
            </select>
          </Field>
          <Field label={`Quantity (${item.unit}) *`}>
            <input type="number" step="any" className={INPUT} placeholder="0" value={qty} onChange={e => setQty(e.target.value)} />
          </Field>
          <Field label="Date">
            <input type="date" className={INPUT} value={date} onChange={e => setDate(e.target.value)} />
          </Field>
          <Field label="Reference (PO#, Batch#, etc.)">
            <input className={INPUT} placeholder="optional" value={ref} onChange={e => setRef(e.target.value)} />
          </Field>
          {movType === 'in' && (
            <Field label="Unit Cost (optional)">
              <input type="number" step="any" className={INPUT} placeholder="0.00" value={unitCost} onChange={e => setUnitCost(e.target.value)} />
            </Field>
          )}
          <Field label="Notes">
            <input className={INPUT} placeholder="optional" value={notes} onChange={e => setNotes(e.target.value)} />
          </Field>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            onClick={() => onSave({ itemId: item.id, type: movType, qty: parseFloat(qty) || 0, date, reference: ref || undefined, unitCost: parseFloat(unitCost) || undefined, notes: notes || undefined })}
            disabled={!qty || parseFloat(qty) <= 0}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            Record Movement
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const INPUT = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
      <Package className="w-12 h-12 mb-4 opacity-20" />
      <p className="text-sm">Select an item to view details</p>
    </div>
  );
}
