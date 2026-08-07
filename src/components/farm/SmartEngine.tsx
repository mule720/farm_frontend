import React from 'react';
import { Brain, Wheat, Droplet, TrendingUp, AlertTriangle, Sparkles, Zap } from 'lucide-react';
import { sampleBatches, getStageForAge } from '@/lib/farmData';

export default function SmartEngine() {
  // Compute today's recommendations across all batches
  const todayPlan = sampleBatches.map(b => {
    const stage = getStageForAge(b.enterprise, b.ageDays);
    if (!stage) return null;
    return {
      ...b,
      stage: stage.stage,
      feedType: stage.feedType,
      totalFeedKg: (stage.feedPerAnimalGrams * b.currentCount) / 1000,
      totalWaterL: (stage.waterPerAnimalMl * b.currentCount) / 1000,
      notes: stage.notes,
    };
  }).filter(Boolean) as any[];

  const totalFeedKg = todayPlan.reduce((s, p) => s + p.totalFeedKg, 0);
  const totalWaterL = todayPlan.reduce((s, p) => s + p.totalWaterL, 0);

  const aiInsights = [
    { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', title: 'Disease Risk Detected', body: 'Batch B-2024-101 water intake is 35% below expected — possible early Coccidiosis. Recommend immediate vet inspection.' },
    { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', title: 'Growth Above Target', body: 'Pig group P-2024-202 averaging 780g/day — 4% above target. Consider early market push for premium pricing.' },
    { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', title: 'Feed Stage Transition', body: '3 broiler batches transitioning from Starter to Grower in next 48 hours. Pre-order 1,200kg of Grower feed.' },
    { icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-50', title: 'Optimal Harvest Window', body: 'Tilapia Pond 1 entering optimal harvest window in 8-12 days. Begin contacting wholesale buyers now.' },
    { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', title: 'Feed Cost Spike Predicted', body: 'Maize commodity prices trending up. Lock in feed contracts within 7 days to save ~$2,400/month.' },
    { icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', title: 'Demand Forecast', body: 'DRC export demand projected to rise 18% next month. Recommend increasing broiler placement by 800 birds.' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-3">
          <Brain className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Smart AI Operations Engine</h1>
            <p className="text-sm text-blue-100">Predictive analytics, smart feeding, and operational guidance — running 24/7</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="text-xs text-blue-100">Today's Total Feed Need</div>
            <div className="text-2xl font-bold">{totalFeedKg.toFixed(0)} kg</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="text-xs text-blue-100">Today's Total Water</div>
            <div className="text-2xl font-bold">{totalWaterL.toFixed(0)} L</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="text-xs text-blue-100">AI Insights Generated</div>
            <div className="text-2xl font-bold">{aiInsights.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="text-xs text-blue-100">Batches Monitored</div>
            <div className="text-2xl font-bold">{sampleBatches.length}</div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">AI-Generated Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiInsights.map((insight, i) => {
            const Icon = insight.icon;
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${insight.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${insight.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{insight.title}</h3>
                    <p className="text-sm text-slate-600">{insight.body}</p>
                    <button className="mt-2 text-xs text-blue-600 hover:underline font-medium">Take Action →</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Per-Batch Smart Recommendations (Today)</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
              <tr>
                <th className="text-left px-4 py-3">Batch</th>
                <th className="text-left px-4 py-3">Stage</th>
                <th className="text-left px-4 py-3">Feed Type</th>
                <th className="text-right px-4 py-3"><Wheat className="inline w-3.5 h-3.5" /> Feed (kg)</th>
                <th className="text-right px-4 py-3"><Droplet className="inline w-3.5 h-3.5" /> Water (L)</th>
                <th className="text-left px-4 py-3">Smart Note</th>
              </tr>
            </thead>
            <tbody>
              {todayPlan.map(p => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-slate-500">Day {p.ageDays} • {p.currentCount.toLocaleString()} animals</div>
                  </td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{p.stage}</span></td>
                  <td className="px-4 py-3 text-xs">{p.feedType}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{p.totalFeedKg.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{p.totalWaterL.toFixed(0)}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-xs">{p.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Feed Forecast — Next 7 Days</h3>
          <div className="text-3xl font-bold text-green-600 mb-1">{(totalFeedKg * 7 * 1.05).toFixed(0)} kg</div>
          <div className="text-xs text-slate-500">Est. cost: ${(totalFeedKg * 7 * 0.78).toFixed(0)} USD</div>
          <button className="mt-3 w-full px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100">Generate Purchase Order</button>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Vaccine Forecast — Next 14 Days</h3>
          <div className="text-3xl font-bold text-blue-600 mb-1">12 doses</div>
          <div className="text-xs text-slate-500">Newcastle, Gumboro, Fowl Pox</div>
          <button className="mt-3 w-full px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100">View Schedule</button>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Mortality Risk Score</h3>
          <div className="text-3xl font-bold text-amber-600 mb-1">Low–Med</div>
          <div className="text-xs text-slate-500">2 batches need attention</div>
          <button className="mt-3 w-full px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100">View Risk Details</button>
        </div>
      </div>
    </div>
  );
}
