// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Reports Engine
// Cross-module analytics: production KPIs, financial trends, cycle comparisons
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Activity, Package, DollarSign } from 'lucide-react';
import { useOrg } from '@/store/orgStore';
import { getTemplate } from '@/lib/templates';

export default function ReportsEngine() {
  const { org, cycles } = useOrg();
  const [section, setSection] = useState<'production' | 'cycles' | 'overview'>('overview');

  // Pull finance & inventory stats from localStorage
  const txs: any[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('agronexus_v2_transactions') ?? '[]'); } catch { return []; }
  }, []);
  const invItems: any[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('agronexus_v2_inventory_items') ?? '[]'); } catch { return []; }
  }, []);
  const orders: any[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('agronexus_v2_orders') ?? '[]'); } catch { return []; }
  }, []);
  const batches: any[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('agronexus_v2_batches') ?? '[]'); } catch { return []; }
  }, []);

  const totalIncome  = txs.filter(t => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
  const profit       = totalIncome - totalExpense;
  const orderRevenue = orders.filter((o: any) => o.status !== 'cancelled').reduce((s: number, o: any) => s + o.total, 0);

  const completedCycles = cycles.filter(c => c.status === 'completed');
  const activeCycles    = cycles.filter(c => c.status === 'active');
  const totalMortality  = completedCycles.reduce((s, c) => s + c.stages.flatMap(s => s.events).filter(e => e.type === 'mortality').reduce((ms: number, e: any) => ms + (e.data?.count ?? 0), 0), 0);
  const invValue        = invItems.reduce((s: number, i: any) => s + i.currentQty * (i.costPerUnit ?? 0), 0);
  const lowStock        = invItems.filter((i: any) => i.currentQty <= i.minStockLevel).length;

  const cyclesByEnterprise = useMemo(() => {
    const map: Record<string, typeof cycles> = {};
    cycles.forEach(c => { (map[c.enterpriseId] ??= []).push(c); });
    return map;
  }, [cycles]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <h2 className="font-bold text-slate-900 mb-3">Reports & Analytics</h2>
        <div className="flex gap-1">
          {(['overview', 'production', 'cycles'] as const).map(s => (
            <button key={s} onClick={() => setSection(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize ${section === s ? 'bg-violet-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {section === 'overview' && (
          <div className="space-y-5 max-w-2xl">
            <h3 className="text-sm font-semibold text-slate-700">Business Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <KpiCard icon="🌱" label="Enterprises" value={String(org?.enterprises.length ?? 0)} sub="configured" />
              <KpiCard icon="🔄" label="Active Cycles" value={String(activeCycles.length)} sub="in production" />
              <KpiCard icon="✅" label="Completed Cycles" value={String(completedCycles.length)} sub="historical" />
              <KpiCard icon="💰" label="Total Income" value={totalIncome > 0 ? totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'} sub="all time" color="green" />
              <KpiCard icon="💸" label="Total Expenses" value={totalExpense > 0 ? totalExpense.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'} sub="all time" color="red" />
              <KpiCard icon="📈" label="Net Profit" value={txs.length > 0 ? profit.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'} sub="all time" color={profit >= 0 ? 'green' : 'red'} />
              <KpiCard icon="🛒" label="Order Revenue" value={orderRevenue > 0 ? orderRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'} sub="from sales" />
              <KpiCard icon="📦" label="Inventory Value" value={invValue > 0 ? invValue.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'} sub={lowStock > 0 ? `${lowStock} low stock` : 'all OK'} color={lowStock > 0 ? 'red' : 'green'} />
              <KpiCard icon="🏭" label="Processing Batches" value={String(batches.length)} sub={`${batches.filter((b: any) => b.status === 'completed').length} completed`} />
            </div>

            {/* Enterprise breakdown */}
            {org && org.enterprises.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Enterprises</h3>
                <div className="space-y-2">
                  {org.enterprises.map(e => {
                    const tpl = getTemplate(e.templateId);
                    const eCycles = cyclesByEnterprise[e.id] ?? [];
                    const active = eCycles.filter(c => c.status === 'active');
                    return (
                      <div key={e.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <span className="text-xl">{tpl?.icon ?? '🌱'}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-800">{e.name}</div>
                          <div className="text-xs text-slate-400">{tpl?.name}</div>
                        </div>
                        <div className="text-right text-xs">
                          <div className="font-medium text-slate-700">{eCycles.length} cycle{eCycles.length !== 1 ? 's' : ''}</div>
                          {active.length > 0 && <div className="text-green-600">{active.length} active</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {txs.length === 0 && cycles.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No data yet. Start using the modules to see reports here.</p>
              </div>
            )}
          </div>
        )}

        {section === 'production' && (
          <div className="space-y-5 max-w-2xl">
            <h3 className="text-sm font-semibold text-slate-700">Production Analytics</h3>
            {cycles.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No production cycles yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Cycle status breakdown */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3">Cycle Status Breakdown</h4>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {(['active', 'completed', 'failed', 'paused'] as const).map(status => {
                      const count = cycles.filter(c => c.status === status).length;
                      const colors: Record<string, string> = { active: 'text-green-600 bg-green-50', completed: 'text-blue-600 bg-blue-50', failed: 'text-red-500 bg-red-50', paused: 'text-amber-600 bg-amber-50' };
                      return (
                        <div key={status} className={`rounded-xl p-3 ${colors[status] ?? 'text-slate-500 bg-slate-50'}`}>
                          <div className="text-xl font-bold">{count}</div>
                          <div className="text-[10px] capitalize">{status}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Per-cycle summary table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-800">All Cycles</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-slate-50 text-slate-500">
                        <th className="text-left px-4 py-2.5">Cycle</th>
                        <th className="text-left px-4 py-2.5">Enterprise</th>
                        <th className="text-left px-4 py-2.5">Status</th>
                        <th className="text-right px-4 py-2.5">Stages</th>
                        <th className="text-right px-4 py-2.5">Events</th>
                      </tr></thead>
                      <tbody>
                        {cycles.slice().reverse().map(c => {
                          const ent = org?.enterprises.find(e => e.id === c.enterpriseId);
                          const totalEvents = c.stages.flatMap(s => s.events).length;
                          const completedStages = c.stages.filter(s => s.status === 'completed').length;
                          const statusColor: Record<string, string> = { active: 'text-green-600', completed: 'text-blue-600', failed: 'text-red-500', paused: 'text-amber-600' };
                          return (
                            <tr key={c.id} className="border-t border-slate-100">
                              <td className="px-4 py-2.5 text-slate-800 font-medium">Cycle #{c.cycleNumber}</td>
                              <td className="px-4 py-2.5 text-slate-600">{ent?.name ?? '—'}</td>
                              <td className={`px-4 py-2.5 font-medium capitalize ${statusColor[c.status] ?? 'text-slate-500'}`}>{c.status}</td>
                              <td className="px-4 py-2.5 text-right text-slate-600">{completedStages}/{c.stages.length}</td>
                              <td className="px-4 py-2.5 text-right text-slate-600">{totalEvents}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {section === 'cycles' && (
          <div className="space-y-5 max-w-2xl">
            <h3 className="text-sm font-semibold text-slate-700">Cycle Comparison</h3>
            {completedCycles.length < 2 ? (
              <div className="text-center py-16 text-slate-400">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Complete at least 2 cycles to see a comparison.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-800">Completed Cycles Comparison</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-slate-50 text-slate-500">
                      <th className="text-left px-4 py-2.5">Cycle</th>
                      <th className="text-left px-4 py-2.5">Enterprise</th>
                      <th className="text-right px-4 py-2.5">Duration</th>
                      <th className="text-right px-4 py-2.5">Events</th>
                      <th className="text-right px-4 py-2.5">Records</th>
                    </tr></thead>
                    <tbody>
                      {completedCycles.map(c => {
                        const ent = org?.enterprises.find(e => e.id === c.enterpriseId);
                        const days = c.endDate ? Math.round((new Date(c.endDate).getTime() - new Date(c.startDate).getTime()) / 86400000) : null;
                        const events = c.stages.flatMap(s => s.events).length;
                        const records = c.stages.flatMap(s => s.dailyRecords).length;
                        return (
                          <tr key={c.id} className="border-t border-slate-100">
                            <td className="px-4 py-2.5 font-medium text-slate-800">#{c.cycleNumber}</td>
                            <td className="px-4 py-2.5 text-slate-600">{ent?.name ?? '—'}</td>
                            <td className="px-4 py-2.5 text-right text-slate-600">{days != null ? `${days}d` : '—'}</td>
                            <td className="px-4 py-2.5 text-right text-slate-600">{events}</td>
                            <td className="px-4 py-2.5 text-right text-slate-600">{records}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color?: 'green' | 'red' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5">
      <div className="text-lg mb-1">{icon}</div>
      <div className={`text-lg font-bold ${color === 'green' ? 'text-green-700' : color === 'red' ? 'text-red-600' : 'text-slate-900'}`}>{value}</div>
      <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{label}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}
