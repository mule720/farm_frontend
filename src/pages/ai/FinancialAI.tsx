// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Financial AI & P&L
// Reads real data from Finance Engine + Production cycles localStorage
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3,
  Calculator, CreditCard, Plus, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useOrg } from '@/store/orgStore';
import { getTemplate } from '@/lib/templates';

// ─── Break-Even Calculator (interactive) ──────────────────────────────────────
function BreakEvenCalculator({ currency }: { currency: string }) {
  const [fc, setFc] = useState('48000');
  const [vc, setVc] = useState('42');
  const [sp, setSp] = useState('75');
  const [units, setUnits] = useState('1500');

  const fixedCosts = parseFloat(fc) || 0;
  const vcPerUnit = parseFloat(vc) || 0;
  const spPerUnit = parseFloat(sp) || 0;
  const expectedUnits = parseFloat(units) || 0;
  const cm = spPerUnit - vcPerUnit;
  const beUnits = cm > 0 ? fixedCosts / cm : 0;
  const beRevenue = beUnits * spPerUnit;
  const mos = expectedUnits - beUnits;
  const mosPct = expectedUnits > 0 ? (mos / expectedUnits) * 100 : 0;
  const projectedProfit = (expectedUnits * spPerUnit) - (expectedUnits * vcPerUnit) - fixedCosts;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
        <Calculator className="w-4 h-4 text-blue-600" /> Break-Even Calculator
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: `Fixed Costs (${currency})`, val: fc, set: setFc },
          { label: `Variable Cost / Unit (${currency})`, val: vc, set: setVc },
          { label: `Selling Price / Unit (${currency})`, val: sp, set: setSp },
          { label: 'Expected Units to Sell', val: units, set: setUnits },
        ].map(({ label, val, set }) => (
          <div key={label}>
            <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
            <input
              type="number" value={val}
              onChange={e => set(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        ))}
      </div>
      {cm > 0 && (
        <div className="grid grid-cols-2 gap-3 pt-2">
          {[
            { label: 'Contribution Margin', value: `${currency} ${cm.toFixed(2)}/unit`, highlight: false },
            { label: 'Break-Even Units', value: `${beUnits.toFixed(0)} units`, highlight: false },
            { label: 'Break-Even Revenue', value: `${currency} ${beRevenue.toLocaleString('en', { maximumFractionDigits: 0 })}`, highlight: false },
            { label: 'Margin of Safety', value: `${mos.toFixed(0)} units (${mosPct.toFixed(1)}%)`, highlight: false },
            { label: 'Projected Profit', value: `${currency} ${projectedProfit.toLocaleString('en', { maximumFractionDigits: 0 })}`, highlight: true },
          ].map(({ label, value, highlight }) => (
            <div key={label} className={`rounded-lg p-3 ${highlight ? (projectedProfit >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200') : 'bg-slate-50'}`}>
              <div className="text-xs text-slate-500">{label}</div>
              <div className={`font-bold text-sm ${highlight ? (projectedProfit >= 0 ? 'text-green-700' : 'text-red-700') : 'text-slate-900'}`}>{value}</div>
            </div>
          ))}
        </div>
      )}
      {cm <= 0 && <p className="text-xs text-red-500">Selling price must be greater than variable cost.</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FinancialAIModule() {
  const { org, cycles } = useOrg();
  const currency = org?.currency ?? 'ZMW';

  const [tab, setTab] = useState<'pl' | 'costs' | 'breakeven' | 'loans'>('pl');
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');

  // ── Pull real data from Finance Engine localStorage ───────────────────────
  const txs: any[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('agronexus_v2_transactions') ?? '[]'); } catch { return []; }
  }, []);
  const orders: any[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('agronexus_v2_orders') ?? '[]'); } catch { return []; }
  }, []);

  const totalIncome  = txs.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0)
                     + orders.filter((o: any) => o.status !== 'cancelled').reduce((s: number, o: any) => s + o.total, 0);
  const totalExpense = txs.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
  const netProfit    = totalIncome - totalExpense;

  // ── Cycle P&L (income/expense txs tagged with cycleRef) ──────────────────
  const cyclePL = useMemo(() => {
    return cycles.map(c => {
      const tpl  = getTemplate(c.enterpriseId ? org?.enterprises.find(e => e.id === c.enterpriseId)?.templateId ?? '' : '');
      const rev  = txs.filter((t: any) => t.type === 'income'  && t.cycleRef === c.id).reduce((s: number, t: any) => s + t.amount, 0);
      const cost = txs.filter((t: any) => t.type === 'expense' && t.cycleRef === c.id).reduce((s: number, t: any) => s + t.amount, 0);
      return { ...c, rev, cost, profit: rev - cost, enterprise: tpl?.name ?? c.enterpriseId ?? '' };
    });
  }, [cycles, txs, org]);

  const selectedCycle = cyclePL.find(c => c.id === selectedCycleId) ?? cyclePL[0];

  // ── Cost breakdown from txs ───────────────────────────────────────────────
  const costBreakdown = useMemo(() => {
    const byCategory: Record<string, number> = {};
    txs.filter((t: any) => t.type === 'expense').forEach((t: any) => {
      byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
    });
    const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
    return Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => ({ category: cat.replace(/_/g, ' '), amount: amt, pct: total > 0 ? (amt / total) * 100 : 0 }));
  }, [txs]);

  const hasCycles = cycles.length > 0;
  const hasFinanceData = txs.length > 0 || orders.length > 0;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" /> Financial AI & P&amp;L
          </h1>
          <p className="text-sm text-slate-500 mt-1">Real-time P&L per cycle, cost breakdown & break-even analysis</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: hasFinanceData ? `${currency} ${totalIncome.toLocaleString()}` : '—', Icon: TrendingUp, positive: true },
          { label: 'Total Costs', value: hasFinanceData ? `${currency} ${totalExpense.toLocaleString()}` : '—', Icon: TrendingDown, positive: false },
          { label: 'Net Profit', value: hasFinanceData ? `${currency} ${Math.abs(netProfit).toLocaleString()}` : '—', Icon: DollarSign, positive: netProfit >= 0 },
          { label: 'Active Cycles', value: cycles.filter(c => c.status === 'active').length, Icon: BarChart3, positive: true },
        ].map(({ label, value, Icon, positive }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${positive ? 'bg-green-50' : 'bg-red-50'}`}>
              <Icon className={`w-5 h-5 ${positive ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className="font-bold text-slate-900 text-lg">{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['pl', 'costs', 'breakeven', 'loans'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'pl' ? 'P&L' : t === 'breakeven' ? 'Break-Even' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* P&L tab */}
      {tab === 'pl' && (
        <div className="space-y-4">
          {!hasCycles ? (
            <EmptyPrompt icon="📊" message="Start a production cycle to see P&L data here." />
          ) : (
            <>
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-600 font-medium">Cycle:</label>
                <select value={selectedCycleId || selectedCycle?.id} onChange={e => setSelectedCycleId(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
                  {cyclePL.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {selectedCycle && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">{selectedCycle.name}</h3>
                    <span className="text-xs text-slate-400">{selectedCycle.startDate} → {selectedCycle.endDate || 'Ongoing'}</span>
                  </div>
                  {selectedCycle.rev === 0 && selectedCycle.cost === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">No transactions tagged to this cycle yet. Record income/expenses in Finance and link them to this cycle.</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-xl p-4 text-center">
                          <div className="text-xs text-slate-500 mb-1">Revenue</div>
                          <div className="text-xl font-bold text-blue-700">{currency} {selectedCycle.rev.toLocaleString()}</div>
                        </div>
                        <div className="bg-red-50 rounded-xl p-4 text-center">
                          <div className="text-xs text-slate-500 mb-1">Costs</div>
                          <div className="text-xl font-bold text-red-600">{currency} {selectedCycle.cost.toLocaleString()}</div>
                        </div>
                        <div className={`rounded-xl p-4 text-center ${selectedCycle.profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                          <div className="text-xs text-slate-500 mb-1">Profit</div>
                          <div className={`text-xl font-bold ${selectedCycle.profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {selectedCycle.profit >= 0 ? '' : '-'}{currency} {Math.abs(selectedCycle.profit).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedCycle.rev > 0 && (
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm text-slate-600">Profit Margin</span>
                            <span className={`font-bold ${selectedCycle.profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                              {((selectedCycle.profit / selectedCycle.rev) * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                        {selectedCycle.cost > 0 && (
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm text-slate-600">ROI</span>
                            <span className={`font-bold ${selectedCycle.profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                              {((selectedCycle.profit / selectedCycle.cost) * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* All cycles table */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">All Cycles</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 text-xs text-slate-500 uppercase">
                      <th className="text-left py-2 font-medium">Cycle</th>
                      <th className="text-right py-2 font-medium">Revenue</th>
                      <th className="text-right py-2 font-medium">Costs</th>
                      <th className="text-right py-2 font-medium">Profit</th>
                      <th className="text-left py-2 font-medium">Status</th>
                    </tr></thead>
                    <tbody>
                      {cyclePL.map(c => (
                        <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => { setSelectedCycleId(c.id); setTab('pl'); }}>
                          <td className="py-2.5">
                            <div className="font-medium text-slate-800">{c.name}</div>
                            <div className="text-xs text-slate-400">{c.enterprise}</div>
                          </td>
                          <td className="py-2.5 text-right text-slate-700">{c.rev > 0 ? `${currency} ${c.rev.toLocaleString()}` : '—'}</td>
                          <td className="py-2.5 text-right text-slate-700">{c.cost > 0 ? `${currency} ${c.cost.toLocaleString()}` : '—'}</td>
                          <td className={`py-2.5 text-right font-semibold ${c.profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {c.rev > 0 || c.cost > 0 ? (
                              <span className="flex items-center justify-end gap-1">
                                {c.profit >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {currency} {Math.abs(c.profit).toLocaleString()}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'completed' ? 'bg-slate-100 text-slate-600' : c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Costs tab */}
      {tab === 'costs' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Cost Breakdown (All Time)</h3>
          {costBreakdown.length === 0 ? (
            <EmptyPrompt icon="💸" message="Record expenses in the Finance engine to see your cost breakdown here." />
          ) : (
            <div className="space-y-3">
              {costBreakdown.map((c, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700 font-medium capitalize">{c.category}</span>
                    <span className="font-semibold text-slate-900">
                      {currency} {c.amount.toLocaleString()} <span className="text-xs text-slate-400">({c.pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100 flex justify-between font-semibold text-sm">
                <span>Total</span>
                <span className="text-blue-700">{currency} {totalExpense.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Break-even tab */}
      {tab === 'breakeven' && <BreakEvenCalculator currency={currency} />}

      {/* Loans tab */}
      {tab === 'loans' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-80 mb-1">AI Credit Score</div>
                <div className="text-6xl font-bold">{hasFinanceData ? Math.min(850, 600 + Math.floor(netProfit / 1000)) : '—'}</div>
                <div className="text-sm mt-2 opacity-90">
                  {hasFinanceData
                    ? netProfit > 0 ? 'Good standing — Eligible for seasonal & equipment finance' : 'Build your score by recording profitable cycles'
                    : 'Add finance records to generate your credit score'}
                </div>
              </div>
              <CreditCard className="w-12 h-12 opacity-60 ml-auto" />
            </div>
            {hasFinanceData && (
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Max Loan', value: `${currency} ${Math.max(0, netProfit * 3).toLocaleString()}` },
                  { label: 'Best Rate', value: '12.5% pa' },
                  { label: 'Max Term', value: '36 months' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white bg-opacity-20 rounded-xl p-3">
                    <div className="text-xs opacity-70">{label}</div>
                    <div className="font-bold text-sm">{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-sm text-slate-500 text-center">Loan applications coming soon. Your financial data helps generate your eligibility profile.</p>
        </div>
      )}
    </div>
  );
}

function EmptyPrompt({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-slate-500 text-sm max-w-xs">{message}</p>
    </div>
  );
}
