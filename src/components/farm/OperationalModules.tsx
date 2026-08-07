import React, { useState, useEffect } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { MODULE_CATALOG, PLAN_BUNDLES } from '@/lib/subscriptionData';
import { useFarmPulse } from '@/components/AppLayout';
import {
  Package, AlertTriangle, ShoppingCart, DollarSign, Users, Truck, Stethoscope,
  BarChart3, Plane, Wrench, Smartphone, Calendar, Leaf, CheckCircle2, Plus, Search, Loader2, X
} from 'lucide-react';
import {
  sampleCustomers, monthlyRevenueData
} from '@/lib/farmData';
import { useAuth } from '@/contexts/AuthContext';
import { gqlRequest } from '@/lib/api';
import { ALL_MODULES, MODULE_GROUPS, ROLE_DEFAULT_MATRIX, ACTIONS, resolveMatrix, type PermMatrix, type Action } from '@/lib/permissions';


// =============== INVENTORY ===============
export function InventoryModule() {
  const { canCreate, canEdit, canDelete } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [txTarget, setTxTarget] = useState<{ item: any; type: 'in' | 'out' } | null>(null);
  const [form, setForm] = useState({ name: '', category: 'feed', unit: 'kg', currentStock: '', reorderLevel: '', unitCost: '', supplier: '', notes: '' });
  const [txForm, setTxForm] = useState({ quantity: '', reference: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function fetchItems() {
    try {
      const data = await gqlRequest<{ inventoryItems: any[]; inventorySummary: any }>(`
        query {
          inventoryItems { id name category sku unit currentStock reorderLevel unitCost supplier isLowStock stockValue }
          inventorySummary { totalItems lowStockCount totalValue categories }
        }
      `);
      setItems(data.inventoryItems || []);
      setSummary(data.inventorySummary);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchItems(); }, []);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const data = await gqlRequest<{ createInventoryItem: { item: any } }>(`
        mutation CreateItem($input: InventoryItemInput!) {
          createInventoryItem(input: $input) {
            item { id name category unit currentStock reorderLevel unitCost supplier isLowStock stockValue }
          }
        }
      `, { input: { name: form.name, category: form.category, unit: form.unit, currentStock: parseFloat(form.currentStock) || 0, reorderLevel: parseFloat(form.reorderLevel) || 0, unitCost: form.unitCost ? parseFloat(form.unitCost) : null, supplier: form.supplier, notes: form.notes } });
      setItems(prev => [...prev, data.createInventoryItem.item]);
      setShowAdd(false);
      setForm({ name: '', category: 'feed', unit: 'kg', currentStock: '', reorderLevel: '', unitCost: '', supplier: '', notes: '' });
    } catch (e: any) { setFormError(e.message); }
    finally { setSubmitting(false); }
  }

  async function handleTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!txTarget) return;
    setFormError(null);
    setSubmitting(true);
    try {
      await gqlRequest(`
        mutation RecordTx($input: TransactionInput!) {
          recordTransaction(input: $input) { transaction { id } }
        }
      `, { input: { itemId: txTarget.item.id, transactionType: txTarget.type, quantity: parseFloat(txForm.quantity), reference: txForm.reference, notes: txForm.notes } });
      setTxTarget(null);
      setTxForm({ quantity: '', reference: '', notes: '' });
      fetchItems();
    } catch (e: any) { setFormError(e.message); }
    finally { setSubmitting(false); }
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter);
  const lowStockItems = items.filter(i => i.isLowStock);
  const cats = ['all', ...Array.from(new Set(items.map((i: any) => i.category as string)))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Feed & Inventory Management</h1>
          <p className="text-sm text-slate-500">Real-time stock tracking across all categories</p>
        </div>
        {canCreate('inventory') && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        )}
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-800 font-semibold mb-2">
            <AlertTriangle className="w-4 h-4" /> {lowStockItems.length} items below reorder level
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((i: any) => <span key={i.id} className="text-xs px-2 py-1 bg-white rounded-md border border-amber-200">{i.name} ({i.currentStock} {i.unit})</span>)}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total SKUs', value: summary?.totalItems ?? items.length },
          { label: 'Stock Value', value: `$${(summary?.totalValue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
          { label: 'Low Stock', value: summary?.lowStockCount ?? lowStockItems.length, red: true },
          { label: 'Suppliers', value: new Set(items.map((i: any) => i.supplier).filter(Boolean)).size },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className={`text-2xl font-bold ${s.red && Number(s.value) > 0 ? 'text-red-600' : ''}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 text-xs rounded-lg capitalize ${filter === c ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}>{c}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading inventory...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
              <tr>
                <th className="text-left px-4 py-3">Item</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-right px-4 py-3">In Stock</th>
                <th className="text-right px-4 py-3">Reorder At</th>
                <th className="text-right px-4 py-3">Unit Cost</th>
                <th className="text-right px-4 py-3">Value</th>
                <th className="text-left px-4 py-3">Supplier</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">No items yet. Add your first inventory item.</td></tr>
              ) : filtered.map((item: any) => (
                <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 bg-slate-100 rounded capitalize">{item.category}</span></td>
                  <td className="px-4 py-3 text-right">{item.currentStock} {item.unit}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{item.reorderLevel} {item.unit}</td>
                  <td className="px-4 py-3 text-right">{item.unitCost != null ? `$${parseFloat(item.unitCost).toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{item.stockValue != null ? `$${parseFloat(item.stockValue).toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{item.supplier || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.isLowStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {item.isLowStock ? 'Low Stock' : 'OK'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {canCreate('inventory') && (
                        <button onClick={() => { setTxTarget({ item, type: 'in' }); setFormError(null); }} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">+ In</button>
                      )}
                      {canEdit('inventory') && (
                        <button onClick={() => { setTxTarget({ item, type: 'out' }); setFormError(null); }} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">- Out</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Item Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Add Inventory Item</h2>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddItem} className="p-5 space-y-3">
              {formError && <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{formError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="block text-xs font-medium text-slate-700 mb-1">Item Name *</label><input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Layer Starter Feed" /></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    {['feed', 'medication', 'vaccine', 'tool', 'packaging', 'seed', 'fertilizer', 'fuel', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Unit</label><input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="kg, bags, litres…" /></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Current Stock</label><input type="number" step="0.01" value={form.currentStock} onChange={e => setForm(f => ({ ...f, currentStock: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="0" /></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Reorder Level</label><input type="number" step="0.01" value={form.reorderLevel} onChange={e => setForm(f => ({ ...f, reorderLevel: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="0" /></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Unit Cost ($)</label><input type="number" step="0.01" value={form.unitCost} onChange={e => setForm(f => ({ ...f, unitCost: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="0.00" /></div>
                <div><label className="block text-xs font-medium text-slate-700 mb-1">Supplier</label><input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Supplier name" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock In / Out Modal */}
      {txTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900">Stock {txTarget.type === 'in' ? 'In ↑' : 'Out ↓'}</h2>
                <p className="text-xs text-slate-500">{txTarget.item.name}</p>
              </div>
              <button onClick={() => setTxTarget(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleTransaction} className="p-5 space-y-3">
              {formError && <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{formError}</div>}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Quantity ({txTarget.item.unit}) *</label>
                <input required type="number" step="0.01" min="0.01" value={txForm.quantity} onChange={e => setTxForm(f => ({ ...f, quantity: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reference / PO #</label>
                <input value={txForm.reference} onChange={e => setTxForm(f => ({ ...f, reference: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                <input value={txForm.notes} onChange={e => setTxForm(f => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Optional" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setTxTarget(null)} className="flex-1 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className={`flex-1 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2 ${txTarget.type === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}>
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =============== SALES ===============
export function SalesModule() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales & Customer Management</h1>
          <p className="text-sm text-slate-500">Customers, orders, and distribution</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm"><Plus className="w-4 h-4" /> New Order</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500">Total Customers</div><div className="text-2xl font-bold">{sampleCustomers.length}</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500">Total Sales (YTD)</div><div className="text-2xl font-bold">${sampleCustomers.reduce((s,c) => s+c.totalPurchases, 0).toLocaleString()}</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500">Outstanding</div><div className="text-2xl font-bold text-amber-600">${sampleCustomers.reduce((s,c) => s+c.outstandingBalance, 0).toLocaleString()}</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500">Export Customers</div><div className="text-2xl font-bold">{sampleCustomers.filter(c => c.type === 'export').length}</div></div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 font-semibold">Customer Database</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
            <tr>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Location</th>
              <th className="text-left px-4 py-3">Contact</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="text-right px-4 py-3">Outstanding</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {sampleCustomers.map(c => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 bg-slate-100 rounded capitalize">{c.type}</span></td>
                <td className="px-4 py-3 text-xs">{c.location}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{c.email}</td>
                <td className="px-4 py-3 text-right font-semibold">${c.totalPurchases.toLocaleString()}</td>
                <td className={`px-4 py-3 text-right ${c.outstandingBalance > 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>${c.outstandingBalance.toLocaleString()}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============== FINANCE ===============
export function FinanceModule() {
  const totalRev = monthlyRevenueData.reduce((s, m) => s + m.revenue, 0);
  const totalCost = monthlyRevenueData.reduce((s, m) => s + m.costs, 0);
  const totalProfit = totalRev - totalCost;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Financial Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="text-xs text-green-100">Revenue (7mo)</div>
          <div className="text-3xl font-bold mt-1">${(totalRev/1000).toFixed(0)}K</div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-5 text-white">
          <div className="text-xs text-red-100">Costs (7mo)</div>
          <div className="text-3xl font-bold mt-1">${(totalCost/1000).toFixed(0)}K</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white">
          <div className="text-xs text-blue-100">Net Profit</div>
          <div className="text-3xl font-bold mt-1">${(totalProfit/1000).toFixed(0)}K</div>
          <div className="text-xs text-blue-100 mt-1">Margin: {((totalProfit/totalRev)*100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold mb-4">Profit & Loss Statement (Monthly)</h3>
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-600 uppercase border-b border-slate-200">
            <tr>
              <th className="text-left py-2">Month</th>
              <th className="text-right py-2">Revenue</th>
              <th className="text-right py-2">Costs</th>
              <th className="text-right py-2">Profit</th>
              <th className="text-right py-2">Margin</th>
            </tr>
          </thead>
          <tbody>
            {monthlyRevenueData.map(m => (
              <tr key={m.month} className="border-b border-slate-100">
                <td className="py-2 font-medium">{m.month}</td>
                <td className="py-2 text-right">${m.revenue.toLocaleString()}</td>
                <td className="py-2 text-right text-red-600">${m.costs.toLocaleString()}</td>
                <td className="py-2 text-right text-green-600 font-semibold">${m.profit.toLocaleString()}</td>
                <td className="py-2 text-right">{((m.profit/m.revenue)*100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold mb-3">Cash Flow Summary</h3>
          {[
            { label: 'Operating Cash Flow', amount: 195000, type: 'in' },
            { label: 'Investing (Equipment)', amount: -42000, type: 'out' },
            { label: 'Financing (Loan repay)', amount: -18000, type: 'out' },
            { label: 'Net Cash Position', amount: 135000, type: 'in' },
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="text-sm">{c.label}</span>
              <span className={`font-semibold ${c.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(c.amount).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold mb-3">Tax & Compliance</h3>
          {[
            { label: 'PAYE Tax (Monthly)', amount: 4200, status: 'Paid' },
            { label: 'NAPSA Contributions', amount: 2800, status: 'Paid' },
            { label: 'NHIMA Contributions', amount: 950, status: 'Pending' },
            { label: 'VAT (Quarterly)', amount: 12500, status: 'Due May 30' },
          ].map((t, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div>
                <div className="text-sm font-medium">{t.label}</div>
                <div className="text-xs text-slate-500">${t.amount.toLocaleString()}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{t.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============== HR / TEAM MANAGEMENT ===============
const ROLE_LABELS: Record<string, string> = {
  saas_admin: 'SaaS Admin', director: 'Director', production_manager: 'Production Manager',
  finance_manager: 'Finance Manager', sales_manager: 'Sales Manager',
  supervisor: 'Supervisor', farmhand: 'Farmhand', vet_officer: 'Vet Officer', driver: 'Driver',
};
const ROLE_COLORS: Record<string, string> = {
  director: 'bg-purple-100 text-purple-700', saas_admin: 'bg-red-100 text-red-700',
  production_manager: 'bg-blue-100 text-blue-700', finance_manager: 'bg-green-100 text-green-700',
  sales_manager: 'bg-amber-100 text-amber-700', supervisor: 'bg-cyan-100 text-cyan-700',
  farmhand: 'bg-slate-100 text-slate-700', vet_officer: 'bg-teal-100 text-teal-700', driver: 'bg-orange-100 text-orange-700',
};

export function HRModule() {
  const { profile, hasRole } = useAuth();
  const isDirector = hasRole(['director', 'saas_admin']);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newCreds, setNewCreds] = useState<{ name: string; email: string; password: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', role: 'farmhand', phone: '', password: '' });
  const [formError, setFormError] = useState<string | null>(null);

  // Permissions editor
  const [permTarget, setPermTarget] = useState<any | null>(null);
  const [permMatrix, setPermMatrix] = useState<PermMatrix>({});
  const [permSaving, setPermSaving] = useState(false);

  async function fetchMembers() {
    try {
      const data = await gqlRequest<{ members: any[] }>(`query { members { id email fullName role isActive phone preferences } }`);
      setMembers((data.members || []).map((m: any) => ({ ...m, role: (m.role as string).toLowerCase() })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchMembers(); }, []);

  function openPermissions(m: any) {
    const rawPerms = m.preferences?.permissions;
    setPermMatrix(resolveMatrix(m.role, rawPerms));
    setPermTarget(m);
  }

  function toggleAction(moduleId: string, action: Action) {
    setPermMatrix(prev => {
      const current = prev[moduleId] ?? [];
      const hasAction = current.includes(action);
      let updated: Action[];
      if (hasAction) {
        updated = current.filter(a => a !== action);
        // removing 'view' also removes all other actions
        if (action === 'view') updated = [];
      } else {
        updated = [...current, action];
        // adding any action also adds 'view'
        if (action !== 'view' && !updated.includes('view')) updated = ['view', ...updated];
      }
      return { ...prev, [moduleId]: updated };
    });
  }

  function setModulePreset(moduleId: string, preset: 'full' | 'rw' | 'view' | 'none') {
    const map: Record<string, Action[]> = {
      full: ['view', 'create', 'edit', 'delete'],
      rw:   ['view', 'create', 'edit'],
      view: ['view'],
      none: [],
    };
    setPermMatrix(prev => ({ ...prev, [moduleId]: map[preset] }));
  }

  function setColumnAll(action: Action, value: boolean) {
    setPermMatrix(prev => {
      const next = { ...prev };
      ALL_MODULES.forEach(m => {
        const cur = prev[m.id] ?? [];
        if (value) {
          if (!cur.includes(action)) {
            const updated = [...cur, action];
            if (action !== 'view' && !updated.includes('view')) updated.unshift('view');
            next[m.id] = updated as Action[];
          }
        } else {
          next[m.id] = (action === 'view' ? [] : cur.filter(a => a !== action)) as Action[];
        }
      });
      return next;
    });
  }

  function resetToRoleDefaults() {
    if (permTarget) setPermMatrix(ROLE_DEFAULT_MATRIX[permTarget.role] ?? {});
  }

  async function savePermissions() {
    if (!permTarget) return;
    setPermSaving(true);
    try {
      await gqlRequest(`
        mutation SetPerms($userId: ID!, $permissions: JSONString!) {
          setMemberPermissions(userId: $userId, permissions: $permissions) { profile { id preferences } }
        }
      `, { userId: permTarget.id, permissions: JSON.stringify(permMatrix) });
      setMembers(prev => prev.map(m => m.id === permTarget.id
        ? { ...m, preferences: { ...(m.preferences || {}), permissions: permMatrix } }
        : m));
      setPermTarget(null);
    } catch (e: any) { alert(e.message); }
    finally { setPermSaving(false); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const data = await gqlRequest<{ inviteUser: { profile: any; tempPassword: string } }>(`
        mutation InviteUser($input: InviteUserInput!) {
          inviteUser(input: $input) {
            tempPassword
            profile { id email fullName role isActive }
          }
        }
      `, { input: { email: form.email, fullName: form.fullName, role: form.role, phone: form.phone, password: form.password || null } });
      const p = data.inviteUser.profile;
      setMembers(prev => [...prev, { ...p, role: (p.role as string).toLowerCase() }]);
      setNewCreds({ name: form.fullName, email: form.email, password: data.inviteUser.tempPassword });
      setShowAdd(false);
      setForm({ fullName: '', email: '', role: 'farmhand', phone: '', password: '' });
    } catch (e: any) { setFormError(e.message); }
    finally { setSubmitting(false); }
  }

  async function toggleActive(id: string, active: boolean) {
    try {
      await gqlRequest(active
        ? `mutation { deactivateUser(userId: "${id}") { success } }`
        : `mutation { activateUser(userId: "${id}") { success } }`);
      setMembers(prev => prev.map(m => m.id === id ? { ...m, isActive: !active } : m));
    } catch (e: any) { alert(e.message); }
  }

  async function changeRole(id: string, role: string) {
    try {
      await gqlRequest(`
        mutation UpdateRole($userId: ID!, $role: String!) {
          updateMemberRole(userId: $userId, role: $role) { profile { id role } }
        }
      `, { userId: id, role });
      setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
    } catch (e: any) { alert(e.message); }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Management</h1>
          <p className="text-sm text-slate-500">{profile?.organization} · Manage your team and permissions</p>
        </div>
        {isDirector && hasRole(['director', 'saas_admin']) && (
          <button onClick={() => { setShowAdd(true); setFormError(null); }} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500">Total Members</div><div className="text-2xl font-bold">{members.length}</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500">Active</div><div className="text-2xl font-bold text-green-600">{members.filter(m => m.isActive).length}</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500">Directors</div><div className="text-2xl font-bold text-purple-600">{members.filter(m => m.role === 'director' || m.role === 'saas_admin').length}</div></div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading team...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
              <tr>
                <th className="text-left px-4 py-3">Member</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Contact</th>
                <th className="text-left px-4 py-3">Status</th>
                {isDirector && <th className="text-right px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr><td colSpan={isDirector ? 5 : 4} className="px-4 py-12 text-center text-slate-400">No team members yet. Add your first employee.</td></tr>
              ) : members.map(m => (
                <tr key={m.id} className={`border-t border-slate-100 hover:bg-slate-50 ${!m.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">{m.fullName?.charAt(0) || '?'}</div>
                      <div><div className="font-medium">{m.fullName}</div><div className="text-xs text-slate-500">{m.email}</div></div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isDirector && m.id !== profile?.id ? (
                      <select value={m.role} onChange={e => changeRole(m.id, e.target.value)} className="text-xs px-2 py-1 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500">
                        {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'saas_admin').map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[m.role] || 'bg-slate-100 text-slate-700'}`}>{ROLE_LABELS[m.role] || m.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{m.phone || '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${m.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{m.isActive ? 'Active' : 'Inactive'}</span></td>
                  {isDirector && (
                    <td className="px-4 py-3 text-right">
                      {m.id !== profile?.id && (
                        <div className="flex gap-1.5 justify-end">
                          <button onClick={() => openPermissions(m)} className="text-xs px-3 py-1 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50">
                            Permissions
                          </button>
                          <button onClick={() => toggleActive(m.id, m.isActive)} className={`text-xs px-3 py-1 rounded-md border ${m.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                            {m.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-5 text-white rounded-t-2xl flex items-center justify-between">
              <div><h2 className="text-lg font-bold">Add Employee</h2><p className="text-xs text-green-100 mt-0.5">A temporary password will be generated</p></div>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 opacity-70 hover:opacity-100" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-3">
              {formError && <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{formError}</div>}
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label><input required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Jane Mwale" /></div>
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Email Address *</label><input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="jane@farm.com" /></div>
              <div><label className="block text-xs font-medium text-slate-700 mb-1">Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="+260 97…" /></div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Initial Password</label>
                <input type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" placeholder="Leave blank to auto-generate" />
                <p className="text-[10px] text-slate-400 mt-1">Leave blank to auto-generate a secure password. Min 6 characters if you set one.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Role & Permissions *</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value="director">Director (Full Access)</option>
                  <option value="production_manager">Production Manager</option>
                  <option value="finance_manager">Finance Manager</option>
                  <option value="sales_manager">Sales Manager</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="farmhand">Farmhand</option>
                  <option value="vet_officer">Vet Officer</option>
                  <option value="driver">Driver</option>
                </select>
                {form.role === 'director' && <p className="text-xs text-amber-600 mt-1">⚠ Director has full access including adding other employees.</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Editor Modal — action grid */}
      {permTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900">Module Permissions</h2>
                <p className="text-xs text-slate-500">
                  {permTarget.fullName} · <span className="capitalize">{ROLE_LABELS[permTarget.role] || permTarget.role}</span>
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <button onClick={resetToRoleDefaults} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50">
                  Reset to role defaults
                </button>
                <button onClick={() => setPermTarget(null)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
            </div>

            {/* Legend */}
            <div className="px-5 pt-3 pb-1 flex gap-4 text-xs text-slate-500 flex-wrap">
              <span><strong className="text-slate-700">View</strong> — can open the module and see data</span>
              <span><strong className="text-slate-700">Create</strong> — can add new records / batches / items</span>
              <span><strong className="text-slate-700">Edit</strong> — can update existing records</span>
              <span><strong className="text-slate-700">Delete</strong> — can remove records</span>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-slate-700">Module</th>
                    {ACTIONS.map(action => (
                      <th key={action} className="px-3 py-3 text-center w-20">
                        <div className="capitalize font-semibold text-slate-700">{action}</div>
                        <div className="flex gap-1 justify-center mt-1">
                          <button onClick={() => setColumnAll(action, true)} className="text-[10px] text-green-600 hover:underline">All</button>
                          <span className="text-slate-300">|</span>
                          <button onClick={() => setColumnAll(action, false)} className="text-[10px] text-slate-400 hover:underline">None</button>
                        </div>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center text-slate-500 font-normal text-xs w-24">Quick set</th>
                  </tr>
                </thead>
                <tbody>
                  {MODULE_GROUPS.map(group => {
                    const groupMods = ALL_MODULES.filter(m => m.group === group);
                    return (
                      <React.Fragment key={group}>
                        <tr className="bg-slate-50/80">
                          <td colSpan={6} className="px-5 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{group}</td>
                        </tr>
                        {groupMods.map(mod => {
                          const actions = permMatrix[mod.id] ?? [];
                          const hasView = actions.includes('view');
                          return (
                            <tr key={mod.id} className={`border-t border-slate-100 hover:bg-slate-50 ${!hasView ? 'opacity-50' : ''}`}>
                              <td className="px-5 py-2.5 font-medium text-slate-800">{mod.label}</td>
                              {ACTIONS.map(action => {
                                const checked = actions.includes(action);
                                const disabled = action !== 'view' && !hasView;
                                return (
                                  <td key={action} className="px-3 py-2.5 text-center">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      disabled={disabled}
                                      onChange={() => toggleAction(mod.id, action)}
                                      className="w-4 h-4 text-green-600 rounded cursor-pointer disabled:cursor-not-allowed"
                                    />
                                  </td>
                                );
                              })}
                              <td className="px-3 py-2.5">
                                <select
                                  value={
                                    !hasView ? 'none'
                                    : actions.includes('delete') ? 'full'
                                    : actions.includes('edit') ? 'rw'
                                    : 'view'
                                  }
                                  onChange={e => setModulePreset(mod.id, e.target.value as any)}
                                  className="text-[10px] px-1.5 py-1 border border-slate-200 rounded bg-white text-slate-600 w-full"
                                >
                                  <option value="none">No access</option>
                                  <option value="view">View only</option>
                                  <option value="rw">View+Create+Edit</option>
                                  <option value="full">Full access</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 flex items-center gap-3">
              <div className="flex-1 text-xs text-slate-400">
                {Object.values(permMatrix).filter(a => a.includes('view')).length} of {ALL_MODULES.length} modules visible
              </div>
              <button onClick={() => setPermTarget(null)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm">Cancel</button>
              <button onClick={savePermissions} disabled={permSaving} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 flex items-center gap-2">
                {permSaving && <Loader2 className="w-4 h-4 animate-spin" />} Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Dialog */}
      {newCreds && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
              <div>
                <h2 className="font-bold text-slate-900">Employee Account Created</h2>
                <p className="text-xs text-slate-500">Send these login details to the employee</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Email */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="text-xs font-medium text-slate-500 mb-1">LOGIN EMAIL</div>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-sm text-slate-900 flex-1 select-all">{newCreds.email}</div>
                  <button onClick={() => navigator.clipboard.writeText(newCreds.email)} className="text-xs px-2 py-1 bg-slate-200 rounded hover:bg-slate-300">Copy</button>
                </div>
              </div>

              {/* Password — large, clear display */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="text-xs font-medium text-green-700 mb-2">PASSWORD</div>
                <div className="flex items-center gap-3">
                  <input
                    readOnly
                    value={newCreds.password}
                    onFocus={e => e.target.select()}
                    className="font-mono text-xl font-bold tracking-widest text-slate-900 bg-transparent flex-1 outline-none select-all cursor-text"
                  />
                  <button
                    onClick={() => { navigator.clipboard.writeText(newCreds.password); }}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium flex-shrink-0"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-[10px] text-green-600 mt-2">Click the password to select all, then copy — or use the Copy button</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700 font-medium">⚠ Save this password now — it will not be shown again.</p>
              <p className="text-xs text-amber-600 mt-1">The employee uses their email + this password to sign in. They can change it later in Settings.</p>
            </div>

            <button onClick={() => setNewCreds(null)} className="w-full mt-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              Done — I've saved the password
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============== PROCUREMENT ===============
export function ProcurementModule() {
  const orders = [
    { id: 'PO-2026-001', supplier: 'Novatek Animal Feeds', items: 'Broiler Starter Feed', qty: '5,000kg', amount: 3900, status: 'Delivered', date: '2026-05-02' },
    { id: 'PO-2026-002', supplier: 'VetSupply Zambia', items: 'Newcastle + Gumboro vaccines', qty: '40 vials', amount: 530, status: 'In Transit', date: '2026-05-05' },
    { id: 'PO-2026-003', supplier: 'Aquafeed Solutions', items: 'Tilapia Grower Feed', qty: '2,000kg', amount: 2400, status: 'Pending', date: '2026-05-07' },
    { id: 'PO-2026-004', supplier: 'TotalEnergies', items: 'Diesel Fuel', qty: '500L', amount: 725, status: 'Delivered', date: '2026-05-04' },
    { id: 'PO-2026-005', supplier: 'SeedCo', items: 'Vegetable Seeds Mixed', qty: '20kg', amount: 700, status: 'Pending', date: '2026-05-06' },
    { id: 'PO-2026-006', supplier: 'AgriPharm', items: 'Amprolium 20%', qty: '50kg', amount: 1100, status: 'Approved', date: '2026-05-07' },
  ];
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Procurement & Suppliers</h1>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="font-semibold">Purchase Orders</div>
          <button className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs">+ New PO</button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
            <tr>
              <th className="text-left px-4 py-3">PO #</th>
              <th className="text-left px-4 py-3">Supplier</th>
              <th className="text-left px-4 py-3">Items</th>
              <th className="text-right px-4 py-3">Qty</th>
              <th className="text-right px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono text-xs">{o.id}</td>
                <td className="px-4 py-3 font-medium">{o.supplier}</td>
                <td className="px-4 py-3 text-xs">{o.items}</td>
                <td className="px-4 py-3 text-right">{o.qty}</td>
                <td className="px-4 py-3 text-right font-semibold">${o.amount}</td>
                <td className="px-4 py-3 text-xs">{o.date}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    o.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                    o.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                    o.status === 'Approved' ? 'bg-purple-100 text-purple-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{o.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============== BIOSECURITY ===============
export function BiosecurityModule() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Biosecurity & Veterinary</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold mb-4">Upcoming Vaccinations</h3>
          {[
            { batch: 'Broiler 102', vaccine: 'Gumboro', date: 'Tomorrow', priority: 'high' },
            { batch: 'Broiler 103', vaccine: 'Newcastle 1', date: 'May 10', priority: 'high' },
            { batch: 'Pigs Pen 3', vaccine: 'Foot & Mouth', date: 'May 12', priority: 'med' },
            { batch: 'Village Flock 1', vaccine: 'Newcastle Booster', date: 'May 14', priority: 'med' },
            { batch: 'Goats Adult', vaccine: 'PPR Vaccine', date: 'May 18', priority: 'low' },
          ].map((v, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
              <div>
                <div className="text-sm font-medium">{v.batch}</div>
                <div className="text-xs text-slate-500">{v.vaccine}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{v.date}</div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  v.priority === 'high' ? 'bg-red-100 text-red-700' :
                  v.priority === 'med' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                }`}>{v.priority}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold mb-4">Disease Incident Log</h3>
          {[
            { date: 'May 5', incident: 'Suspected Coccidiosis - House A1', action: 'Amprolium administered', status: 'Resolved' },
            { date: 'Apr 28', incident: 'Lameness - Pig Pen 2', action: 'Vet visit, anti-inflammatory', status: 'Resolved' },
            { date: 'Apr 22', incident: 'Reduced lay - Layer flock', action: 'Calcium supplement increase', status: 'Monitoring' },
            { date: 'Apr 18', incident: 'Fish mortality spike Pond 2', action: 'Water quality test, oxygen boost', status: 'Resolved' },
          ].map((d, i) => (
            <div key={i} className="py-3 border-b border-slate-100 last:border-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">{d.date}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${d.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{d.status}</span>
              </div>
              <div className="text-sm font-medium">{d.incident}</div>
              <div className="text-xs text-slate-600">→ {d.action}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============== REPORTS ===============
export function ReportsModule() {
  const reports = [
    { name: 'Daily Production Report', desc: 'Mortality, feed, water across all enterprises', period: 'Today' },
    { name: 'Weekly Operations Report', desc: 'Performance vs targets, variance analysis', period: 'This Week' },
    { name: 'Monthly Management Report', desc: 'Executive summary with P&L per enterprise', period: 'May 2026' },
    { name: 'Mortality Analysis', desc: 'Trends, root causes, and recommendations', period: 'Last 30 days' },
    { name: 'Feed Efficiency Report', desc: 'FCR by batch, cost per kg gained', period: 'Quarter to date' },
    { name: 'Enterprise Profitability', desc: 'P&L comparison across 7 enterprises', period: 'YTD' },
    { name: 'Market Performance', desc: 'Sales by customer, region, product', period: 'Last 90 days' },
    { name: 'DRC Export Report', desc: 'Cross-border volumes, revenue, FX', period: 'YTD' },
    { name: 'Inventory Aging Report', desc: 'Slow-moving stock, expiry tracking', period: 'Current' },
    { name: 'Predictive Forecast', desc: 'AI-generated 90-day projections', period: 'Next 90 days' },
  ];
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Reports & Business Intelligence</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-green-300 transition-all">
            <div className="flex items-start justify-between mb-3">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded">{r.period}</span>
            </div>
            <h3 className="font-semibold text-slate-900">{r.name}</h3>
            <p className="text-xs text-slate-500 mt-1 mb-3">{r.desc}</p>
            <div className="flex gap-2">
              <button className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded font-medium hover:bg-green-100">View</button>
              <button className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded font-medium hover:bg-slate-200">Export PDF</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============== EXPORT MODULE ===============
export function ExportModule() {
  const shipments = [
    { id: 'EXP-2026-014', customer: 'Kinshasa Foods Ltd', destination: 'Kinshasa, DRC', product: 'Frozen Chicken (3,200kg)', value: 12800, status: 'In Transit', eta: 'May 9' },
    { id: 'EXP-2026-013', customer: 'Lubumbashi Meat Co', destination: 'Lubumbashi, DRC', product: 'Pork Carcass (1,800kg)', value: 9000, status: 'Delivered', eta: 'May 3' },
    { id: 'EXP-2026-012', customer: 'Kinshasa Foods Ltd', destination: 'Kinshasa, DRC', product: 'Frozen Chicken (2,500kg)', value: 10000, status: 'Delivered', eta: 'Apr 26' },
    { id: 'EXP-2026-011', customer: 'Lubumbashi Meat Co', destination: 'Lubumbashi, DRC', product: 'Eggs (12,000)', value: 1800, status: 'Delivered', eta: 'Apr 22' },
  ];
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">DRC Export & Logistics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500">YTD Export Revenue</div><div className="text-2xl font-bold">$148K</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500">Active Shipments</div><div className="text-2xl font-bold">2</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500">FX Position (USD)</div><div className="text-2xl font-bold">$32K</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500">COMESA Permits</div><div className="text-2xl font-bold text-green-600">Active</div></div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 font-semibold">Recent Shipments</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
            <tr>
              <th className="text-left px-4 py-3">Export #</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Destination</th>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-right px-4 py-3">Value (USD)</th>
              <th className="text-left px-4 py-3">ETA</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map(s => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono text-xs">{s.id}</td>
                <td className="px-4 py-3 font-medium">{s.customer}</td>
                <td className="px-4 py-3 text-xs">{s.destination}</td>
                <td className="px-4 py-3 text-xs">{s.product}</td>
                <td className="px-4 py-3 text-right font-semibold">${s.value.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs">{s.eta}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{s.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============== ASSETS ===============
export function AssetsModule() {
  const assets = [
    { name: 'Cold Room A', type: 'Cold Storage', value: 28000, condition: 'Excellent', maintenance: 'Jun 1, 2026' },
    { name: 'Borehole 1 Pump', type: 'Water System', value: 4500, condition: 'Good', maintenance: 'May 20, 2026' },
    { name: 'Solar Array (15kW)', type: 'Energy', value: 32000, condition: 'Excellent', maintenance: 'Jul 10, 2026' },
    { name: 'Toyota Hilux 2022', type: 'Vehicle', value: 22000, condition: 'Good', maintenance: 'May 25, 2026' },
    { name: 'Tractor MF 240', type: 'Vehicle', value: 18500, condition: 'Fair', maintenance: 'May 15, 2026' },
    { name: 'Feed Mill', type: 'Equipment', value: 15000, condition: 'Good', maintenance: 'Jun 5, 2026' },
    { name: 'Fish Pond 1-3', type: 'Infrastructure', value: 12000, condition: 'Excellent', maintenance: 'Aug 1, 2026' },
    { name: 'Incubator (5000-egg)', type: 'Equipment', value: 4800, condition: 'Excellent', maintenance: 'Jul 1, 2026' },
  ];
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Farm Assets & Infrastructure</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500">Total Assets</div><div className="text-2xl font-bold">{assets.length}</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500">Total Value</div><div className="text-2xl font-bold">${assets.reduce((s,a) => s+a.value, 0).toLocaleString()}</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500">Due Maintenance</div><div className="text-2xl font-bold text-amber-600">3</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500">In Excellent Cond.</div><div className="text-2xl font-bold text-green-600">{assets.filter(a => a.condition === 'Excellent').length}</div></div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
            <tr>
              <th className="text-left px-4 py-3">Asset</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-right px-4 py-3">Value</th>
              <th className="text-left px-4 py-3">Condition</th>
              <th className="text-left px-4 py-3">Next Maintenance</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{a.name}</td>
                <td className="px-4 py-3 text-xs">{a.type}</td>
                <td className="px-4 py-3 text-right font-semibold">${a.value.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    a.condition === 'Excellent' ? 'bg-green-100 text-green-700' :
                    a.condition === 'Good' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                  }`}>{a.condition}</span>
                </td>
                <td className="px-4 py-3 text-xs">{a.maintenance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============== MOBILE APP PREVIEW ===============
export function MobileModule() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Mobile App & Offline Capture</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl p-8 text-white">
          <Smartphone className="w-12 h-12 mb-4" />
          <h2 className="text-xl font-bold mb-2">FarmPulse Mobile</h2>
          <p className="text-sm text-slate-300 mb-6">Field workers capture data even without internet. Auto-syncs when back online.</p>
          <ul className="space-y-2 text-sm">
            {[
              'Offline data capture (mortality, feed, water)',
              'Photo uploads for incidents',
              'GPS-tagged farm patrols',
              'Daily task assignments',
              'Vaccination reminders',
              'Push notifications for alerts',
              'Voice notes for low-literacy workers',
              'Multi-language support (EN, FR, SW)',
            ].map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mt-6">
            <button className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-medium">Download iOS</button>
            <button className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-medium">Download Android</button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Worker Activity Today</h3>
          {[
            { worker: 'James Mulenga', task: 'Logged morning feed for House A1', time: '6:42 AM', synced: true },
            { worker: 'Peter Zulu', task: 'Recorded 2 mortalities Pen 3', time: '7:15 AM', synced: true },
            { worker: 'Linda Kasonde', task: 'Photo: pest damage on tomatoes', time: '8:30 AM', synced: true },
            { worker: 'James Mulenga', task: 'Water meter reading House A2', time: '11:05 AM', synced: false },
            { worker: 'Peter Zulu', task: 'Weighing batch sample (12 pigs)', time: '12:20 PM', synced: false },
          ].map((a, i) => (
            <div key={i} className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-semibold">{a.worker.charAt(0)}</div>
              <div className="flex-1">
                <div className="text-sm font-medium">{a.worker}</div>
                <div className="text-xs text-slate-600">{a.task}</div>
                <div className="text-[10px] text-slate-400">{a.time} • {a.synced ? '✓ Synced' : '⏳ Pending sync'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============== DAILY PLANNER ===============
export function DailyPlanner() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const tasks = [
    { time: '5:30 AM', task: 'Open broiler houses, check temp & ventilation', assignee: 'James M.', module: 'Poultry', done: true },
    { time: '6:00 AM', task: 'Issue morning feed: 320kg starter, 580kg grower', assignee: 'James M.', module: 'Poultry', done: true },
    { time: '6:30 AM', task: 'Record overnight mortality across all houses', assignee: 'James M.', module: 'Poultry', done: true },
    { time: '7:00 AM', task: 'Feed pigs Pen 1-4 (2.8kg/sow, 1.8kg/grower)', assignee: 'Peter Z.', module: 'Piggery', done: true },
    { time: '8:00 AM', task: 'Test pond water quality (DO, pH, temp)', assignee: 'Peter Z.', module: 'Fish', done: false },
    { time: '9:00 AM', task: 'Vaccinate Batch 102 — Gumboro (in water)', assignee: 'David P. (Vet)', module: 'Poultry', done: false },
    { time: '10:00 AM', task: 'Inspect tomato plot — log pest activity', assignee: 'Linda K.', module: 'Horticulture', done: false },
    { time: '12:00 PM', task: 'Weigh 5% sample of broilers Batch 101', assignee: 'Sarah B.', module: 'Poultry', done: false },
    { time: '2:00 PM', task: 'Afternoon feed round (all enterprises)', assignee: 'James M., Peter Z.', module: 'All', done: false },
    { time: '3:00 PM', task: 'Cold room temperature check', assignee: 'Sarah B.', module: 'Assets', done: false },
    { time: '4:30 PM', task: 'Pack DRC export shipment (Kinshasa Foods)', assignee: 'Mary C.', module: 'Export', done: false },
    { time: '5:30 PM', task: 'Evening lock-down, biosecurity walk', assignee: 'Sarah B.', module: 'All', done: false },
  ];
  const completed = tasks.filter(t => t.done).length;

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-green-700 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Daily Operations Planner</h1>
        </div>
        <p className="text-sm text-green-100">{today} • Auto-generated by smart engine • {completed}/{tasks.length} completed</p>
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white" style={{ width: `${(completed/tasks.length)*100}%` }} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {tasks.map((t, i) => (
          <div key={i} className={`flex items-center gap-4 px-5 py-3 border-b border-slate-100 last:border-0 ${t.done ? 'bg-slate-50' : ''}`}>
            <input type="checkbox" defaultChecked={t.done} className="w-4 h-4 text-green-600 rounded" />
            <div className="w-20 text-xs font-mono text-slate-500">{t.time}</div>
            <div className="flex-1">
              <div className={`text-sm ${t.done ? 'line-through text-slate-400' : 'font-medium text-slate-900'}`}>{t.task}</div>
              <div className="text-xs text-slate-500">{t.assignee}</div>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full">{t.module}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============== SETTINGS ===============
function PlanBillingCard() {
  const { planName, planId, enabledModules, monthlyAmount, trialDaysRemaining, isTrialExpired, maxUsers } = useSubscription();
  const { openUpgrade } = useFarmPulse();
  const [showModules, setShowModules] = useState(false);
  const bundle = PLAN_BUNDLES.find(p => p.id === planId);
  const paidModules = enabledModules.filter(id => !MODULE_CATALOG.find(m => m.id === id)?.isCore);

  const bannerClass = isTrialExpired
    ? 'from-red-600 to-red-700'
    : planId === 'trial'
    ? 'from-amber-500 to-orange-600'
    : planId === 'enterprise' ? 'from-purple-600 to-indigo-700'
    : planId === 'professional' ? 'from-blue-600 to-indigo-600'
    : 'from-slate-600 to-slate-700';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold">Plan & Subscription</h3>

      <div className={`bg-gradient-to-br ${bannerClass} text-white rounded-xl p-4`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-white/70 font-medium uppercase tracking-wide">Current Plan</div>
            <div className="text-2xl font-bold mt-0.5">{planName}</div>
            {trialDaysRemaining !== null && !isTrialExpired && (
              <div className="text-xs text-white/80 mt-1">{trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining in free trial</div>
            )}
            {isTrialExpired && <div className="text-xs text-red-100 mt-1 font-semibold">Trial expired — upgrade to continue</div>}
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">${monthlyAmount}<span className="text-sm font-normal text-white/70">/mo</span></div>
            <div className="text-xs text-white/60 mt-0.5">{maxUsers === -1 ? 'Unlimited users' : `Up to ${maxUsers} users`}</div>
          </div>
        </div>
      </div>

      {/* Module summary */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-slate-700">{paidModules.length} paid modules enabled</div>
          <button onClick={() => setShowModules(v => !v)} className="text-xs text-blue-600 hover:text-blue-700">{showModules ? 'Hide' : 'Show all'}</button>
        </div>
        {showModules && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {enabledModules.map(id => {
              const cat = MODULE_CATALOG.find(m => m.id === id);
              return (
                <span key={id} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cat?.isCore ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {cat?.label || id}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Upgrade prompt */}
      <div className="border-t border-slate-100 pt-3">
        {isTrialExpired ? (
          <div className="space-y-2">
            <div className="text-sm text-red-600 font-medium">Your trial has expired — choose a plan to keep your data.</div>
            <button
              onClick={() => openUpgrade('__all__')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              Choose a Plan →
            </button>
          </div>
        ) : planId !== 'enterprise' ? (
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">Need more modules or users?</div>
            <button
              onClick={() => openUpgrade('__all__')}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              Upgrade Plan
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-400">You are on the Enterprise plan. Contact support for custom pricing.</div>
        )}
      </div>
    </div>
  );
}

export function SettingsModule() {
  const { profile, updateProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [organization, setOrganization] = useState(profile?.organization || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const { error } = await updateProfile({ full_name: fullName, organization, phone });
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert('Failed to save: ' + error);
    }
  }

  const SETTINGS_ROLE_LABELS: Record<string, string> = {
    saas_admin: 'SaaS Administrator', director: 'Director', production_manager: 'Production Manager',
    finance_manager: 'Finance Manager', sales_manager: 'Sales Manager', supervisor: 'Supervisor',
    farmhand: 'Farmhand', vet_officer: 'Vet Officer', driver: 'Driver',
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold mb-2">My Profile</h3>
          {saved && <div className="px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">✓ Profile saved</div>}
          <div>
            <label className="block text-xs text-slate-500 mb-1">Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Email</label>
            <input value={profile?.email || ''} disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="+260 977 ..." />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Organization</label>
            <input value={organization} onChange={(e) => setOrganization(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Role</label>
            <input value={SETTINGS_ROLE_LABELS[profile?.role || 'farmhand'] || profile?.role || ''} disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500" />
            <p className="text-[10px] text-slate-400 mt-1">Contact your administrator to change your role.</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-60 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
            <button type="button" onClick={() => signOut()} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">
              Sign Out
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <PlanBillingCard />

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold mb-3">Security</h3>
            <div className="text-xs text-slate-500 mb-3">Account ID: <span className="font-mono">{profile?.id?.slice(0, 8)}...</span></div>
            <button className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 text-left">
              Change password
            </button>
            <button className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 text-left">
              Enable two-factor authentication
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
