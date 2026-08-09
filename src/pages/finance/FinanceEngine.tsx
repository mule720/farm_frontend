// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Finance Engine
// Cost records, income, profitability per cycle, P&L dashboard
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import {
  Plus, X, DollarSign, TrendingUp, TrendingDown, BarChart3,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// ─── Types ───────────────────────────────────────────────────────────────────
type TxCategory = 'feed' | 'medicine' | 'seed' | 'fertiliser' | 'labour' | 'equipment' | 'transport' | 'utilities' | 'marketing' | 'repairs' | 'other_cost' | 'sale_income' | 'grant' | 'other_income';
type TxType = 'income' | 'expense';

interface Transaction {
  id: string;
  type: TxType;
  category: TxCategory;
  description: string;
  amount: number;
  date: string;
  cycleRef?: string;    // link to a production cycle / batch
  reference?: string;   // receipt #, invoice #
  notes?: string;
  createdAt: string;
}

// ─── Storage ─────────────────────────────────────────────────────────────────
const TX_KEY = 'agronexus_v2_transactions';

function useFinance() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try { return JSON.parse(localStorage.getItem(TX_KEY) ?? '[]'); } catch { return []; }
  });
  React.useEffect(() => { localStorage.setItem(TX_KEY, JSON.stringify(transactions)); }, [transactions]);

  function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>) {
    const t = { ...tx, id: uuidv4(), createdAt: new Date().toISOString() };
    setTransactions(prev => [...prev, t]);
    return t;
  }
  function deleteTransaction(id: string) {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }

  return { transactions, addTransaction, deleteTransaction };
}

// ─── Category metadata ────────────────────────────────────────────────────────
const EXPENSE_CATS: { key: TxCategory; label: string; icon: string }[] = [
  { key: 'feed',        label: 'Feed & Fodder',   icon: '🌾' },
  { key: 'medicine',    label: 'Medicines',        icon: '💊' },
  { key: 'seed',        label: 'Seeds',            icon: '🌱' },
  { key: 'fertiliser',  label: 'Fertiliser',       icon: '🧪' },
  { key: 'labour',      label: 'Labour',           icon: '👷' },
  { key: 'equipment',   label: 'Equipment',        icon: '🔧' },
  { key: 'transport',   label: 'Transport',        icon: '🚛' },
  { key: 'utilities',   label: 'Utilities',        icon: '⚡' },
  { key: 'marketing',   label: 'Marketing',        icon: '📢' },
  { key: 'repairs',     label: 'Repairs',          icon: '🛠️' },
  { key: 'other_cost',  label: 'Other Cost',       icon: '💸' },
];
const INCOME_CATS: { key: TxCategory; label: string; icon: string }[] = [
  { key: 'sale_income',   label: 'Sales Income',  icon: '💰' },
  { key: 'grant',         label: 'Grant / Subsidy', icon: '🏦' },
  { key: 'other_income',  label: 'Other Income',  icon: '📥' },
];
const ALL_CATS = [...EXPENSE_CATS, ...INCOME_CATS];
const catLabel = (k: TxCategory) => ALL_CATS.find(c => c.key === k)?.label ?? k;
const catIcon  = (k: TxCategory) => ALL_CATS.find(c => c.key === k)?.icon  ?? '📋';

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────
type FTab = 'dashboard' | 'income' | 'expenses' | 'all';

export default function FinanceEngine() {
  const { transactions, addTransaction, deleteTransaction } = useFinance();
  const [tab, setTab] = useState<FTab>('dashboard');
  const [showAdd, setShowAdd] = useState<TxType | null>(null);
  const [periodMonths, setPeriodMonths] = useState(3);

  // Period filter
  const since = useMemo(() => {
    const d = new Date(); d.setMonth(d.getMonth() - periodMonths);
    return d.toISOString().slice(0, 10);
  }, [periodMonths]);

  const inPeriod = useMemo(() => transactions.filter(t => t.date >= since), [transactions, since]);
  const totalIncome  = inPeriod.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = inPeriod.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const profit = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="font-bold text-slate-900">Finance</h2>
            <p className="text-xs text-slate-500">{transactions.length} transactions</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={periodMonths} onChange={e => setPeriodMonths(+e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-yellow-400">
              <option value={1}>Last month</option>
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
              <option value={999}>All time</option>
            </select>
            <button onClick={() => setShowAdd('income')}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
              <Plus className="w-3.5 h-3.5" /> Income
            </button>
            <button onClick={() => setShowAdd('expense')}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700">
              <Plus className="w-3.5 h-3.5" /> Expense
            </button>
          </div>
        </div>
        <div className="flex gap-0.5">
          {(['dashboard', 'income', 'expenses', 'all'] as FTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize ${tab === t ? 'bg-yellow-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'dashboard' && (
          <Dashboard
            totalIncome={totalIncome} totalExpense={totalExpense} profit={profit} margin={margin}
            transactions={inPeriod} periodMonths={periodMonths}
          />
        )}
        {tab === 'income' && (
          <TxList
            transactions={inPeriod.filter(t => t.type === 'income').sort((a, b) => b.date.localeCompare(a.date))}
            onDelete={deleteTransaction}
          />
        )}
        {tab === 'expenses' && (
          <TxList
            transactions={inPeriod.filter(t => t.type === 'expense').sort((a, b) => b.date.localeCompare(a.date))}
            onDelete={deleteTransaction}
          />
        )}
        {tab === 'all' && (
          <TxList
            transactions={[...inPeriod].sort((a, b) => b.date.localeCompare(a.date))}
            onDelete={deleteTransaction}
          />
        )}
      </div>

      {showAdd && (
        <AddTransactionModal
          type={showAdd}
          onSave={tx => { addTransaction(tx); setShowAdd(null); }}
          onClose={() => setShowAdd(null)}
        />
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ totalIncome, totalExpense, profit, margin, transactions, periodMonths }: {
  totalIncome: number; totalExpense: number; profit: number; margin: number;
  transactions: Transaction[]; periodMonths: number;
}) {
  // Expense breakdown by category
  const expByCategory: Record<string, number> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    expByCategory[t.category] = (expByCategory[t.category] ?? 0) + t.amount;
  });
  const expSorted = Object.entries(expByCategory).sort((a, b) => b[1] - a[1]);

  // Monthly breakdown (last 6 months)
  const monthlyData: Record<string, { income: number; expense: number }> = {};
  transactions.forEach(t => {
    const m = t.date.slice(0, 7);
    if (!monthlyData[m]) monthlyData[m] = { income: 0, expense: 0 };
    if (t.type === 'income') monthlyData[m].income += t.amount;
    else monthlyData[m].expense += t.amount;
  });
  const months = Object.keys(monthlyData).sort().slice(-6);

  return (
    <div className="space-y-5 max-w-2xl">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total Income"  value={totalIncome}  icon={<TrendingUp  className="w-4 h-4" />} color="green" />
        <KpiCard label="Total Expenses" value={totalExpense} icon={<TrendingDown className="w-4 h-4" />} color="red" />
        <KpiCard label="Net Profit"    value={profit}       icon={<DollarSign  className="w-4 h-4" />} color={profit >= 0 ? 'green' : 'red'} />
        <div className="bg-white rounded-xl border border-slate-200 p-3.5">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-wide">Margin</span>
          </div>
          <div className={`text-xl font-bold ${margin >= 0 ? 'text-green-700' : 'text-red-600'}`}>{margin.toFixed(1)}%</div>
        </div>
      </div>

      {/* Monthly chart (simple bar) */}
      {months.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Monthly Overview</h3>
          <div className="space-y-2">
            {months.map(m => {
              const { income, expense } = monthlyData[m];
              const maxVal = Math.max(...months.map(x => Math.max(monthlyData[x].income, monthlyData[x].expense)));
              return (
                <div key={m} className="flex items-center gap-3 text-xs">
                  <span className="w-16 text-slate-400 flex-shrink-0">{m.slice(5)} {m.slice(0, 4)}</span>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-1">
                      <div className="bg-green-400 rounded-full h-2" style={{ width: `${Math.max(2, (income / maxVal) * 100)}%` }} />
                      <span className="text-green-700 font-medium">{income.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="bg-red-400 rounded-full h-2" style={{ width: `${Math.max(2, (expense / maxVal) * 100)}%` }} />
                      <span className="text-red-500 font-medium">{expense.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                  <span className={`w-14 text-right font-semibold flex-shrink-0 ${income - expense >= 0 ? 'text-green-700' : 'text-red-500'}`}>
                    {income - expense >= 0 ? '+' : ''}{(income - expense).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-[10px] text-slate-400">
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-green-400 rounded-full" />Income</div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-red-400 rounded-full" />Expense</div>
          </div>
        </div>
      )}

      {/* Expense breakdown */}
      {expSorted.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Expense Breakdown</h3>
          <div className="space-y-2">
            {expSorted.slice(0, 8).map(([cat, amount]) => (
              <div key={cat} className="flex items-center gap-3 text-sm">
                <span className="text-base">{catIcon(cat as TxCategory)}</span>
                <span className="flex-1 text-slate-700 text-xs">{catLabel(cat as TxCategory)}</span>
                <div className="flex-1 mx-2">
                  <div className="bg-red-100 rounded-full h-1.5">
                    <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${(amount / totalExpense) * 100}%` }} />
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-600 w-20 text-right">{amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <span className="text-[10px] text-slate-400 w-8 text-right">{((amount / totalExpense) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {transactions.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No transactions yet.</p>
          <p className="text-xs mt-1">Click + Income or + Expense to get started.</p>
        </div>
      )}
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const c: Record<string, string> = { green: 'text-green-700 bg-green-50', red: 'text-red-600 bg-red-50', slate: 'text-slate-500 bg-slate-50' };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5">
      <div className={`flex items-center gap-2 mb-1 ${color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-500' : 'text-slate-400'}`}>
        {icon}<span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-xl font-bold ${color === 'green' ? 'text-green-700' : color === 'red' ? 'text-red-600' : 'text-slate-700'}`}>
        {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </div>
    </div>
  );
}

// ─── Transaction List ──────────────────────────────────────────────────────────
function TxList({ transactions, onDelete }: { transactions: Transaction[]; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (transactions.length === 0) {
    return <div className="text-center py-16 text-slate-400 text-sm">No transactions in this period.</div>;
  }

  return (
    <div className="max-w-lg space-y-2">
      {transactions.map(t => {
        const isOpen = expanded === t.id;
        return (
          <div key={t.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button onClick={() => setExpanded(isOpen ? null : t.id)}
              className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-slate-50">
              <span className="text-lg">{catIcon(t.category)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">{t.description}</div>
                <div className="text-xs text-slate-400">{catLabel(t.category)} · {new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
              <div className={`text-sm font-bold flex-shrink-0 ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
            </button>
            {isOpen && (
              <div className="border-t border-slate-100 px-4 py-3 space-y-2">
                {t.cycleRef  && <div className="text-xs text-slate-500">Cycle ref: {t.cycleRef}</div>}
                {t.reference && <div className="text-xs text-slate-500">Reference: {t.reference}</div>}
                {t.notes     && <div className="text-xs text-slate-600">{t.notes}</div>}
                <button onClick={() => onDelete(t.id)} className="text-xs text-red-400 hover:text-red-600 hover:underline">Delete</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Add Transaction Modal ────────────────────────────────────────────────────
function AddTransactionModal({ type, onSave, onClose }: {
  type: TxType;
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const cats = type === 'income' ? INCOME_CATS : EXPENSE_CATS;
  const [form, setForm] = useState<Omit<Transaction, 'id' | 'createdAt'>>({
    type,
    category: cats[0].key,
    description: '',
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
  });
  function set(k: keyof typeof form, v: any) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Add {type === 'income' ? 'Income' : 'Expense'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Category</label>
            <select className={INP} value={form.category} onChange={e => set('category', e.target.value)}>
              {cats.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Description *</label>
            <input className={INP} placeholder="e.g. Starter feed – 50 bags" value={form.description} onChange={e => set('description', e.target.value)} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Amount *</label>
            <input type="number" step="any" className={INP} placeholder="0.00" value={form.amount || ''} onChange={e => set('amount', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Date</label>
            <input type="date" className={INP} value={form.date} onChange={e => set('date', e.target.value)} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Cycle Reference (opt.)</label>
            <input className={INP} placeholder="e.g. Cycle 3 / Batch #2" value={form.cycleRef ?? ''} onChange={e => set('cycleRef', e.target.value || undefined)} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Reference # (opt.)</label>
            <input className={INP} placeholder="Receipt / Invoice #" value={form.reference ?? ''} onChange={e => set('reference', e.target.value || undefined)} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Notes</label>
            <textarea className={INP + ' resize-none'} rows={2} value={form.notes ?? ''} onChange={e => set('notes', e.target.value || undefined)} /></div>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600">Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.description.trim() || form.amount <= 0}
            className={`flex-1 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-50 ${type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

const INP = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400';
