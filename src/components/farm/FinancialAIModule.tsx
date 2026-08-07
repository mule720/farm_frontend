import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Calculator, CreditCard, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface BatchPL {
  id: string;
  name: string;
  enterprise: string;
  total_costs: number;
  total_revenue: number;
  start_date: string;
  end_date: string | null;
}

const MOCK_BATCHES: BatchPL[] = [
  { id: '1', name: 'Broiler Batch #12', enterprise: 'Poultry', total_costs: 48200, total_revenue: 67500, start_date: '2026-04-01', end_date: '2026-05-28' },
  { id: '2', name: 'Tomato Season 2026', enterprise: 'Horticulture', total_costs: 22400, total_revenue: 31800, start_date: '2026-01-15', end_date: null },
  { id: '3', name: 'Piggery Cycle #5', enterprise: 'Piggery', total_costs: 85000, total_revenue: 112000, start_date: '2025-10-01', end_date: '2026-04-15' },
  { id: '4', name: 'Broiler Batch #13', enterprise: 'Poultry', total_costs: 51000, total_revenue: 38000, start_date: '2026-05-01', end_date: null },
];

const COST_BREAKDOWN = [
  { category: 'Feed & Nutrition', amount: 28400, pct: 55.7 },
  { category: 'Stock Purchase', amount: 8200, pct: 16.1 },
  { category: 'Veterinary', amount: 3100, pct: 6.1 },
  { category: 'Labour', amount: 5600, pct: 11.0 },
  { category: 'Fuel & Energy', amount: 2400, pct: 4.7 },
  { category: 'Overheads', amount: 1500, pct: 2.9 },
  { category: 'Other', amount: 2000, pct: 3.9 },
];

function BreakEvenCalculator() {
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
      <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Calculator className="w-4 h-4 text-blue-600" /> Break-Even Calculator</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Fixed Costs (ZMW)</label>
          <input type="number" value={fc} onChange={e => setFc(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Variable Cost / Unit (ZMW)</label>
          <input type="number" value={vc} onChange={e => setVc(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Selling Price / Unit (ZMW)</label>
          <input type="number" value={sp} onChange={e => setSp(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Expected Units to Sell</label>
          <input type="number" value={units} onChange={e => setUnits(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      {cm > 0 && (
        <div className="grid grid-cols-2 gap-3 pt-2">
          {[
            { label: 'Contribution Margin', value: `ZMW ${cm.toFixed(2)}/unit`, highlight: false },
            { label: 'Break-Even Units', value: `${beUnits.toFixed(0)} units`, highlight: false },
            { label: 'Break-Even Revenue', value: `ZMW ${beRevenue.toLocaleString('en', { maximumFractionDigits: 0 })}`, highlight: false },
            { label: 'Margin of Safety', value: `${mos.toFixed(0)} units (${mosPct.toFixed(1)}%)`, highlight: false },
            { label: 'Projected Profit', value: `ZMW ${projectedProfit.toLocaleString('en', { maximumFractionDigits: 0 })}`, highlight: true },
          ].map(({ label, value, highlight }) => (
            <div key={label} className={`rounded-lg p-3 ${highlight ? (projectedProfit >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200') : 'bg-slate-50'}`}>
              <div className="text-xs text-slate-500">{label}</div>
              <div className={`font-bold ${highlight ? (projectedProfit >= 0 ? 'text-green-700' : 'text-red-700') : 'text-slate-900'}`}>{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FinancialAIModule() {
  const [tab, setTab] = useState<'pl' | 'costs' | 'breakeven' | 'loans'>('pl');
  const [selectedBatchId, setSelectedBatchId] = useState('1');

  const batch = MOCK_BATCHES.find(b => b.id === selectedBatchId) || MOCK_BATCHES[0];
  const grossProfit = batch.total_revenue - batch.total_costs;
  const margin = batch.total_revenue > 0 ? (grossProfit / batch.total_revenue) * 100 : 0;
  const roi = batch.total_costs > 0 ? (grossProfit / batch.total_costs) * 100 : 0;

  const totalRevenue = MOCK_BATCHES.reduce((s, b) => s + b.total_revenue, 0);
  const totalCosts = MOCK_BATCHES.reduce((s, b) => s + b.total_costs, 0);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" /> Financial AI & P&amp;L
          </h1>
          <p className="text-sm text-slate-500 mt-1">Real-time P&L per batch, break-even analysis & AI credit scoring</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue (YTD)', value: `K${(totalRevenue / 1000).toFixed(0)}k`, icon: TrendingUp, positive: true },
          { label: 'Total Costs (YTD)', value: `K${(totalCosts / 1000).toFixed(0)}k`, icon: TrendingDown, positive: false },
          { label: 'Net Profit (YTD)', value: `K${((totalRevenue - totalCosts) / 1000).toFixed(0)}k`, icon: DollarSign, positive: totalRevenue > totalCosts },
          { label: 'Active Batches', value: MOCK_BATCHES.filter(b => !b.end_date).length.toString(), icon: BarChart3, positive: true },
        ].map(({ label, value, icon: Icon, positive }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${positive ? 'bg-green-50' : 'bg-red-50'}`}>
              <Icon className={`w-5 h-5 ${positive ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className="font-bold text-slate-900 text-lg">{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['pl', 'costs', 'breakeven', 'loans'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'pl' ? 'P&L' : t === 'breakeven' ? 'Break-Even' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'pl' && (
        <div className="space-y-4">
          {/* Batch selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600 font-medium">Batch:</label>
            <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
              {MOCK_BATCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {/* P&L card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">{batch.name} — P&amp;L Summary</h3>
              <span className="text-xs text-slate-400">{batch.start_date} → {batch.end_date || 'Ongoing'}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-xs text-slate-500 mb-1">Total Revenue</div>
                <div className="text-2xl font-bold text-blue-700">K{batch.total_revenue.toLocaleString()}</div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <div className="text-xs text-slate-500 mb-1">Total Costs</div>
                <div className="text-2xl font-bold text-red-600">K{batch.total_costs.toLocaleString()}</div>
              </div>
              <div className={`rounded-xl p-4 text-center ${grossProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="text-xs text-slate-500 mb-1">Gross Profit</div>
                <div className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {grossProfit >= 0 ? '' : '-'}K{Math.abs(grossProfit).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Profit Margin</span>
                <span className={`font-bold ${margin >= 0 ? 'text-green-700' : 'text-red-600'}`}>{margin.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">ROI</span>
                <span className={`font-bold ${roi >= 0 ? 'text-green-700' : 'text-red-600'}`}>{roi.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* All batches table */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">All Batches</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 text-xs text-slate-500 uppercase">
                  <th className="text-left py-2 font-medium">Batch</th>
                  <th className="text-right py-2 font-medium">Revenue</th>
                  <th className="text-right py-2 font-medium">Costs</th>
                  <th className="text-right py-2 font-medium">Profit</th>
                  <th className="text-right py-2 font-medium">Margin</th>
                  <th className="text-left py-2 font-medium">Status</th>
                </tr></thead>
                <tbody>
                  {MOCK_BATCHES.map(b => {
                    const gp = b.total_revenue - b.total_costs;
                    const m = b.total_revenue > 0 ? (gp / b.total_revenue) * 100 : 0;
                    return (
                      <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-2.5">
                          <div className="font-medium text-slate-800">{b.name}</div>
                          <div className="text-xs text-slate-400">{b.enterprise}</div>
                        </td>
                        <td className="py-2.5 text-right text-slate-700">K{b.total_revenue.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-slate-700">K{b.total_costs.toLocaleString()}</td>
                        <td className={`py-2.5 text-right font-semibold ${gp >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                          <span className="flex items-center justify-end gap-1">
                            {gp >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            K{Math.abs(gp).toLocaleString()}
                          </span>
                        </td>
                        <td className={`py-2.5 text-right font-semibold ${m >= 0 ? 'text-green-700' : 'text-red-600'}`}>{m.toFixed(1)}%</td>
                        <td className="py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full ${b.end_date ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-700'}`}>{b.end_date ? 'Closed' : 'Active'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'costs' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Cost Breakdown — Broiler Batch #12</h3>
            <button className="flex items-center gap-1 text-sm text-blue-600 font-medium"><Plus className="w-3 h-3" /> Add Cost Entry</button>
          </div>
          <div className="space-y-3">
            {COST_BREAKDOWN.map((c, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700 font-medium">{c.category}</span>
                  <span className="font-semibold text-slate-900">K{c.amount.toLocaleString()} <span className="text-xs text-slate-400">({c.pct.toFixed(1)}%)</span></span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-100 flex justify-between font-semibold text-sm">
              <span>Total</span>
              <span className="text-blue-700">K{COST_BREAKDOWN.reduce((s, c) => s + c.amount, 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'breakeven' && <BreakEvenCalculator />}

      {tab === 'loans' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Apply for Loan
            </button>
          </div>

          {/* AI Credit Score */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-80 mb-1">AI Credit Score</div>
                <div className="text-6xl font-bold">742</div>
                <div className="text-sm mt-2 opacity-90">Good standing — Eligible for seasonal & equipment finance</div>
              </div>
              <div className="text-right">
                <CreditCard className="w-12 h-12 opacity-60 ml-auto mb-2" />
                <div className="text-xs opacity-70">Based on: Revenue history, batch performance,<br />payment records, farm assets</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Max Loan', value: 'K250,000' },
                { label: 'Best Rate', value: '12.5% pa' },
                { label: 'Max Term', value: '36 months' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white bg-opacity-20 rounded-xl p-3">
                  <div className="text-xs opacity-70">{label}</div>
                  <div className="font-bold">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
            <h3 className="font-semibold text-slate-900">Loan Applications</h3>
            {[
              { type: 'Seasonal Input Loan', lender: 'ZANACO Agri', amount: 'K85,000', status: 'approved', rate: '14% pa', term: '12 months' },
              { type: 'Equipment Finance', lender: 'DBZ', amount: 'K180,000', status: 'under_review', rate: '11% pa', term: '24 months' },
            ].map((loan, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-medium text-slate-900">{loan.type}</div>
                  <div className="text-xs text-slate-500">{loan.lender} · {loan.rate} · {loan.term}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{loan.amount}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${loan.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{loan.status.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
