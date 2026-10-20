/**
 * Alert rules that run on real readings. They live on the server: every time a device reports, each matching rule
 * is checked, and a rule that fires records the event and (optionally) opens a task. Nothing here is simulated.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Bell, Zap, Play } from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import { useLiveSnapshot } from '@/lib/liveDevices';

const RULES_Q = `{ automationRules { id name isEnabled conditionMetric conditionOperator conditionValue actionType actionMessage actionPriority cooldownMinutes lastTriggeredAt triggerCount }
  triggerLog(limit: 15) { id triggeredAt triggeredValue actionTaken rule { id name } } }`;
const CREATE = `mutation($i:AutomationRuleInput!){ createAutomationRule(input:$i){ rule { id } } }`;
const TOGGLE = `mutation($id:ID!){ toggleAutomationRule(id:$id){ rule { id isEnabled } } }`;
const DELETE = `mutation($id:ID!){ deleteAutomationRule(id:$id){ success } }`;
const TEST = `mutation($id:ID!,$v:Float!){ testAutomationRule(id:$id, testValue:$v){ triggered } }`;

type Rule = { id: string; name: string; isEnabled: boolean; conditionMetric: string; conditionOperator: string; conditionValue: number; actionType: string; actionMessage: string; actionPriority: string; cooldownMinutes: number; lastTriggeredAt: string | null; triggerCount: number };
type Log = { id: string; triggeredAt: string; triggeredValue: number; actionTaken: string; rule: { id: string; name: string } };

const OPS: [string, string][] = [['gt', 'is above'], ['lt', 'is below'], ['gte', 'is at least'], ['lte', 'is at most'], ['eq', 'equals']];
const COMMON_METRICS = ['temperature', 'humidity', 'soil_moisture', 'ph', 'dissolved_oxygen', 'ammonia', 'co2', 'water_level', 'battery_pct', 'power_kw', 'weight'];
const ACTIONS: [string, string][] = [['alert', 'Raise an alert'], ['task', 'Create a task for the team'], ['notification', 'Send a notification']];

function ago(iso: string | null) {
  if (!iso) return 'never';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
const opText = (o: string) => OPS.find(x => x[0] === o)?.[1] ?? o;

export default function LiveAlertRules() {
  const snap = useLiveSnapshot();
  const [rules, setRules] = useState<Rule[]>([]);
  const [log, setLog] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await gqlRequest<any>(RULES_Q);
      setRules((d.automationRules || []).map((r: any) => ({ ...r, conditionValue: Number(r.conditionValue) })));
      setLog(d.triggerLog || []); setErr('');
    } catch (e: any) { setErr(e.message || 'Could not load the rules.'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  const knownMetrics = useMemo(() => {
    const set = new Set<string>(COMMON_METRICS);
    Object.values(snap.readings).forEach(m => Object.keys(m).forEach(k => set.add(k)));
    return Array.from(set).sort();
  }, [snap]);

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900">
        <b>These rules run on real device readings.</b> Each time a sensor reports, every matching rule is checked on the server. A rule that fires is recorded below, and it can open a task for your team.
        They only watch and alert. They cannot switch pumps or valves on by themselves yet.
      </div>
      {err && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{err}</div>}
      {msg && <div className="p-3 rounded-lg bg-slate-100 text-sm text-slate-700">{msg}</div>}

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Alert rules <span className="text-slate-400 font-normal">({rules.length})</span></h3>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white text-sm rounded-xl hover:bg-purple-700"><Plus className="w-4 h-4" />New alert rule</button>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {!loading && rules.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center text-sm text-slate-500">
          <Zap className="w-7 h-7 mx-auto mb-2 text-slate-300" />No alert rules yet. For example: <i>when dissolved oxygen is below 4, raise an alert</i>.
        </div>
      )}
      {rules.map(r => (
        <div key={r.id} className={`bg-white border rounded-xl p-4 ${r.isEnabled ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}>
          <div className="flex items-start gap-3 flex-wrap">
            <div className="flex-1 min-w-[220px]">
              <div className="font-semibold text-slate-800">{r.name}</div>
              <div className="text-sm text-slate-600 mt-0.5">When <b>{r.conditionMetric.replace(/_/g, ' ')}</b> {opText(r.conditionOperator)} <b>{r.conditionValue}</b> → {ACTIONS.find(a => a[0] === r.actionType)?.[1].toLowerCase() ?? r.actionType}</div>
              <div className="text-xs text-slate-400 mt-1">“{r.actionMessage}” · {r.actionPriority} · at most once every {r.cooldownMinutes} min · fired {r.triggerCount} time{r.triggerCount === 1 ? '' : 's'}, last {ago(r.lastTriggeredAt)}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={async () => { const v = window.prompt?.(`Test value for ${r.conditionMetric}? (nothing is saved)`); if (v == null || v === '') return; try { const t = await gqlRequest<any>(TEST, { id: r.id, v: parseFloat(v) }); setMsg(t.testAutomationRule.triggered ? `With ${v}, this rule would fire.` : `With ${v}, this rule would not fire.`); } catch (e: any) { setMsg(e.message); } }}
                className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-1"><Play className="w-3 h-3" />Test</button>
              <button onClick={async () => { await gqlRequest(TOGGLE, { id: r.id }); load(); }} className={`text-xs px-2.5 py-1.5 rounded-lg ${r.isEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{r.isEnabled ? 'On' : 'Off'}</button>
              <button onClick={async () => { if (window.confirm?.(`Delete "${r.name}"?`) === false) return; await gqlRequest(DELETE, { id: r.id }); load(); }} className="p-1.5 text-slate-300 hover:text-red-500 border border-slate-200 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      ))}

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-2"><Bell className="w-4 h-4 text-amber-500" />Recent alerts from real readings</h3>
        {log.length === 0 ? <p className="text-sm text-slate-400">Nothing has fired yet.</p> : (
          <ul className="divide-y divide-slate-100 text-sm">
            {log.map(l => <li key={l.id} className="py-2 flex justify-between gap-3"><span><b>{l.rule?.name}</b> <span className="text-slate-500">at {Number(l.triggeredValue)}</span> · {l.actionTaken}</span><span className="text-xs text-slate-400 flex-shrink-0">{ago(l.triggeredAt)}</span></li>)}
          </ul>
        )}
      </div>

      {adding && <NewRule metrics={knownMetrics} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}
    </div>
  );
}

function NewRule({ metrics, onClose, onSaved }: { metrics: string[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ name: '', metric: 'dissolved_oxygen', op: 'lt', value: '4', action: 'alert', message: '', priority: 'critical', cooldown: '60' });
  const [err, setErr] = useState('');
  const cls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500';
  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    try {
      await gqlRequest(CREATE, { i: {
        name: f.name, conditionMetric: f.metric, conditionOperator: f.op, conditionValue: parseFloat(f.value), actionType: f.action,
        actionMessage: f.message || `${f.metric.replace(/_/g, ' ')} ${opText(f.op)} ${f.value}`, actionPriority: f.priority, cooldownMinutes: parseInt(f.cooldown) || 60,
      } });
      onSaved();
    } catch (e2: any) { setErr(e2.message); }
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={save} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5 space-y-3">
        <h3 className="font-bold text-slate-900">New alert rule</h3>
        <div><label className="block text-xs text-slate-500 mb-1">Name *</label><input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="e.g. Pond oxygen too low" className={cls} /></div>
        <div className="grid grid-cols-3 gap-2">
          <div><label className="block text-xs text-slate-500 mb-1">When this measure</label>
            <input list="metric-list" value={f.metric} onChange={e => setF({ ...f, metric: e.target.value.trim().toLowerCase().replace(/\s+/g, '_') })} className={cls} />
            <datalist id="metric-list">{metrics.map(m => <option key={m} value={m} />)}</datalist></div>
          <div><label className="block text-xs text-slate-500 mb-1">is</label><select value={f.op} onChange={e => setF({ ...f, op: e.target.value })} className={cls}>{OPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div><label className="block text-xs text-slate-500 mb-1">this value</label><input required type="number" step="any" value={f.value} onChange={e => setF({ ...f, value: e.target.value })} className={cls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="block text-xs text-slate-500 mb-1">Then</label><select value={f.action} onChange={e => setF({ ...f, action: e.target.value })} className={cls}>{ACTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div><label className="block text-xs text-slate-500 mb-1">How urgent</label><select value={f.priority} onChange={e => setF({ ...f, priority: e.target.value })} className={cls}><option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option></select></div>
        </div>
        <div><label className="block text-xs text-slate-500 mb-1">Message</label><input value={f.message} onChange={e => setF({ ...f, message: e.target.value })} placeholder="e.g. Start the aerator now" className={cls} /></div>
        <div><label className="block text-xs text-slate-500 mb-1">Do not repeat within (minutes)</label><input type="number" min={1} value={f.cooldown} onChange={e => setF({ ...f, cooldown: e.target.value })} className={cls} /></div>
        {err && <p className="text-xs text-red-600">{err}</p>}
        <div className="flex gap-2"><button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm">Cancel</button><button className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium">Save rule</button></div>
      </form>
    </div>
  );
}
