/**
 * Enhanced Automation Rules — Compound conditions, time triggers, cascade actions, templates
 * Fully localStorage-based; no backend required.
 */
import React, { useState, useMemo } from 'react';
import {
  Zap, Plus, Trash2, X, CheckCircle, AlertTriangle, Play,
  Pause, Clock, Activity, Settings2, RefreshCw, Copy,
  ChevronDown, ChevronUp, ArrowRight, Layers, Droplets,
  Wind, Sun, Thermometer, Bell,
} from 'lucide-react';
import { useOrg } from '@/store/orgStore';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ConditionType =
  | 'soil_moisture_below' | 'soil_moisture_above'
  | 'tank_level_below'    | 'tank_level_above'
  | 'temperature_above'   | 'temperature_below'
  | 'do_below'            | 'ammonia_above'
  | 'humidity_above'      | 'humidity_below'
  | 'time_of_day'         | 'day_of_week'
  | 'no_rain_last_hours'  | 'battery_soc_above';

type ConditionOperator = 'AND' | 'OR';

type ActionType =
  | 'start_pump'      | 'stop_pump'
  | 'open_valve'      | 'close_valve'
  | 'start_aerator'   | 'stop_aerator'
  | 'start_fan'       | 'stop_fan'
  | 'start_heater'    | 'stop_heater'
  | 'send_alert'      | 'log_event'
  | 'start_generator' | 'stop_generator';

interface Condition {
  id: string;
  type: ConditionType;
  value: string;        // threshold / time
  valueB?: string;      // for ranges
  device?: string;      // device/zone name
  label: string;
}

interface Action {
  id: string;
  type: ActionType;
  target: string;       // device/pump/valve name
  value?: string;       // optional param (e.g. duration minutes)
  label: string;
  delayMin?: number;    // delay before this action in cascade
}

type TriggerStyle = 'all_conditions' | 'any_condition' | 'schedule';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  category: 'irrigation' | 'aeration' | 'climate' | 'energy' | 'alert' | 'custom';
  enabled: boolean;
  triggerStyle: TriggerStyle;
  conditions: Condition[];
  actions: Action[];
  cooldownMin: number;        // min minutes between triggers
  lastTriggeredAt: string | null;
  triggerCount: number;
  runLog: { ts: string; result: 'success'|'skipped'|'error'; note: string }[];
  addedAt: string;
}

interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: AutomationRule['category'];
  icon: string;
  rule: Omit<AutomationRule, 'id'|'addedAt'|'lastTriggeredAt'|'triggerCount'|'runLog'>;
}

// ─── localStorage ──────────────────────────────────────────────────────────────
const LS = { RULES: 'agronexus_v2_auto_rules' };

// ─── Condition/Action meta ──────────────────────────────────────────────────────

const CONDITION_META: Record<ConditionType, { label: string; unit: string; placeholder: string }> = {
  soil_moisture_below:  { label:'Soil Moisture Below',  unit:'%',       placeholder:'30' },
  soil_moisture_above:  { label:'Soil Moisture Above',  unit:'%',       placeholder:'80' },
  tank_level_below:     { label:'Tank Level Below',     unit:'%',       placeholder:'20' },
  tank_level_above:     { label:'Tank Level Above',     unit:'%',       placeholder:'80' },
  temperature_above:    { label:'Temperature Above',    unit:'°C',      placeholder:'30' },
  temperature_below:    { label:'Temperature Below',    unit:'°C',      placeholder:'18' },
  do_below:             { label:'DO Below',             unit:'mg/L',    placeholder:'5' },
  ammonia_above:        { label:'Ammonia Above',        unit:'mg/L',    placeholder:'0.1' },
  humidity_above:       { label:'Humidity Above',       unit:'%',       placeholder:'75' },
  humidity_below:       { label:'Humidity Below',       unit:'%',       placeholder:'40' },
  time_of_day:          { label:'Time of Day Is',       unit:'HH:MM',   placeholder:'06:00' },
  day_of_week:          { label:'Day of Week Is',       unit:'',        placeholder:'Mon,Wed,Fri' },
  no_rain_last_hours:   { label:'No Rain in Last',      unit:'hours',   placeholder:'24' },
  battery_soc_above:    { label:'Battery SOC Above',    unit:'%',       placeholder:'80' },
};

const ACTION_META: Record<ActionType, { label: string; hasTarget: boolean; hasDuration: boolean }> = {
  start_pump:      { label:'Start Pump',         hasTarget:true, hasDuration:true },
  stop_pump:       { label:'Stop Pump',          hasTarget:true, hasDuration:false },
  open_valve:      { label:'Open Valve',         hasTarget:true, hasDuration:true },
  close_valve:     { label:'Close Valve',        hasTarget:true, hasDuration:false },
  start_aerator:   { label:'Start Aerator',      hasTarget:true, hasDuration:true },
  stop_aerator:    { label:'Stop Aerator',       hasTarget:true, hasDuration:false },
  start_fan:       { label:'Start Fan',          hasTarget:true, hasDuration:true },
  stop_fan:        { label:'Stop Fan',           hasTarget:true, hasDuration:false },
  start_heater:    { label:'Start Heater',       hasTarget:true, hasDuration:true },
  stop_heater:     { label:'Stop Heater',        hasTarget:true, hasDuration:false },
  send_alert:      { label:'Send Alert',         hasTarget:false, hasDuration:false },
  log_event:       { label:'Log Event',          hasTarget:false, hasDuration:false },
  start_generator: { label:'Start Generator',   hasTarget:true, hasDuration:true },
  stop_generator:  { label:'Stop Generator',    hasTarget:true, hasDuration:false },
};

const CATEGORY_META: Record<AutomationRule['category'], { label:string; color:string; icon:string }> = {
  irrigation: { label:'Irrigation',  color:'bg-blue-100 text-blue-700 border-blue-200',  icon:'💧' },
  aeration:   { label:'Aeration',    color:'bg-cyan-100 text-cyan-700 border-cyan-200',   icon:'🌊' },
  climate:    { label:'Climate',     color:'bg-orange-100 text-orange-700 border-orange-200', icon:'🌡' },
  energy:     { label:'Energy',      color:'bg-yellow-100 text-yellow-700 border-yellow-200', icon:'⚡' },
  alert:      { label:'Alert',       color:'bg-red-100 text-red-700 border-red-200',      icon:'🔔' },
  custom:     { label:'Custom',      color:'bg-slate-100 text-slate-700 border-slate-200', icon:'⚙️' },
};

// ─── Seed rules ─────────────────────────────────────────────────────────────────

function mkSeeds(): AutomationRule[] {
  const uid = () => Math.random().toString(36).slice(2,10);
  return [
    {
      id:'r-1', name:'Maize Field Irrigation — Soil Trigger', description:'Irrigate Field A when soil moisture drops below 30% AND no rain in last 24h',
      category:'irrigation', enabled:true, triggerStyle:'all_conditions', cooldownMin:360,
      conditions:[
        { id:'c-1', type:'soil_moisture_below', value:'30', device:'Field A — Maize Block', label:'Soil moisture < 30%' },
        { id:'c-2', type:'no_rain_last_hours', value:'24', label:'No rain in last 24h' },
      ],
      actions:[
        { id:'a-1', type:'open_valve', target:'Valve 1 — Field A North', value:'90', label:'Open Valve 1 (90 min)', delayMin:0 },
        { id:'a-2', type:'start_pump', target:'Field Irrigation Pump 1', value:'90', label:'Start Pump 1 (90 min)', delayMin:1 },
        { id:'a-3', type:'log_event', target:'', label:'Log irrigation event', delayMin:0 },
      ],
      lastTriggeredAt: new Date(Date.now()-2*86400000).toISOString(), triggerCount:8,
      runLog:[
        { ts:new Date(Date.now()-2*86400000).toISOString(), result:'success', note:'Soil 28%, no rain 36h — ran 90 min' },
        { ts:new Date(Date.now()-4*86400000).toISOString(), result:'success', note:'Soil 26% — ran 90 min' },
      ], addedAt:new Date().toISOString(),
    },
    {
      id:'r-2', name:'Pond B DO Emergency Aeration', description:'Start aerators in Pond B immediately when DO falls below 4 mg/L OR ammonia exceeds 0.15 mg/L',
      category:'aeration', enabled:true, triggerStyle:'any_condition', cooldownMin:30,
      conditions:[
        { id:'c-3', type:'do_below', value:'4', device:'Pond B — Catfish Juveniles', label:'DO < 4 mg/L' },
        { id:'c-4', type:'ammonia_above', value:'0.15', device:'Pond B — Catfish Juveniles', label:'Ammonia > 0.15 mg/L' },
      ],
      actions:[
        { id:'a-4', type:'start_aerator', target:'Pond B Aerator 1', value:'120', label:'Start Aerator (120 min)', delayMin:0 },
        { id:'a-5', type:'send_alert', target:'', label:'Send critical water quality alert', delayMin:0 },
      ],
      lastTriggeredAt: new Date(Date.now()-3*3600000).toISOString(), triggerCount:3,
      runLog:[
        { ts:new Date(Date.now()-3*3600000).toISOString(), result:'success', note:'DO dropped to 3.1 mg/L — aerator started' },
      ], addedAt:new Date().toISOString(),
    },
    {
      id:'r-3', name:'Poultry House Fan Control', description:'Start fans when temperature rises above 30°C OR humidity exceeds 75% AND stop when both return to normal',
      category:'climate', enabled:true, triggerStyle:'any_condition', cooldownMin:15,
      conditions:[
        { id:'c-5', type:'temperature_above', value:'30', device:'Layer House A', label:'Temp > 30°C' },
        { id:'c-6', type:'humidity_above', value:'75', device:'Layer House A', label:'Humidity > 75%' },
      ],
      actions:[
        { id:'a-6', type:'start_fan', target:'Layer House A — Main Fans', label:'Start all fans', delayMin:0 },
        { id:'a-7', type:'send_alert', target:'', label:'Alert: house temp/humidity high', delayMin:0 },
      ],
      lastTriggeredAt: new Date(Date.now()-45*60000).toISOString(), triggerCount:12,
      runLog:[
        { ts:new Date(Date.now()-45*60000).toISOString(), result:'success', note:'Temp 32°C detected — fans started' },
        { ts:new Date(Date.now()-3*3600000).toISOString(), result:'success', note:'Humidity 78% — fans started' },
      ], addedAt:new Date().toISOString(),
    },
    {
      id:'r-4', name:'Morning Irrigation Schedule', description:'Run drip irrigation on all tomato zones every morning at 06:00',
      category:'irrigation', enabled:false, triggerStyle:'schedule', cooldownMin:1380,
      conditions:[
        { id:'c-7', type:'time_of_day', value:'06:00', label:'Time is 06:00' },
        { id:'c-8', type:'day_of_week', value:'Mon,Tue,Wed,Thu,Fri,Sat,Sun', label:'Every day' },
      ],
      actions:[
        { id:'a-8', type:'open_valve', target:'Valve 2 — Tomato Drip Zone', value:'60', label:'Open tomato drip valve (60 min)', delayMin:0 },
        { id:'a-9', type:'start_pump', target:'Drip Pump', value:'60', label:'Start drip pump (60 min)', delayMin:1 },
      ],
      lastTriggeredAt: null, triggerCount:0,
      runLog:[], addedAt:new Date().toISOString(),
    },
    {
      id:'r-5', name:'Battery-First Generator Control', description:'Auto-start diesel genset when battery SOC exceeds 80% (stop it; solar is sufficient)',
      category:'energy', enabled:true, triggerStyle:'all_conditions', cooldownMin:120,
      conditions:[
        { id:'c-9', type:'battery_soc_above', value:'80', device:'Main LFP Bank', label:'Battery SOC > 80%' },
      ],
      actions:[
        { id:'a-10', type:'stop_generator', target:'Diesel Genset 60kVA', label:'Stop diesel genset', delayMin:0 },
        { id:'a-11', type:'log_event', target:'', label:'Log battery-first switch', delayMin:0 },
      ],
      lastTriggeredAt: new Date(Date.now()-6*3600000).toISOString(), triggerCount:5,
      runLog:[
        { ts:new Date(Date.now()-6*3600000).toISOString(), result:'success', note:'Battery 82% — genset stopped' },
      ], addedAt:new Date().toISOString(),
    },
  ];
}

// ─── Rule templates ─────────────────────────────────────────────────────────────

const TEMPLATES: RuleTemplate[] = [
  {
    id:'t-1', name:'Soil Moisture Trigger', description:'Irrigate when soil moisture drops below threshold AND no recent rain', category:'irrigation', icon:'💧',
    rule:{ name:'Soil Moisture Auto-Irrigate', description:'', enabled:false, triggerStyle:'all_conditions', cooldownMin:360,
      conditions:[{id:'t-c-1',type:'soil_moisture_below',value:'30',device:'',label:'Soil moisture < 30%'},{id:'t-c-2',type:'no_rain_last_hours',value:'24',label:'No rain in last 24h'}],
      actions:[{id:'t-a-1',type:'start_pump',target:'',value:'90',label:'Start irrigation pump (90 min)',delayMin:0},{id:'t-a-2',type:'log_event',target:'',label:'Log event',delayMin:0}] },
  },
  {
    id:'t-2', name:'DO Emergency Aeration', description:'Start aerators immediately when dissolved oxygen drops critically', category:'aeration', icon:'🌊',
    rule:{ name:'DO Emergency Aeration', description:'', enabled:false, triggerStyle:'any_condition', cooldownMin:30,
      conditions:[{id:'t-c-3',type:'do_below',value:'4',device:'',label:'DO < 4 mg/L'}],
      actions:[{id:'t-a-3',type:'start_aerator',target:'',value:'120',label:'Start aerator (120 min)',delayMin:0},{id:'t-a-4',type:'send_alert',target:'',label:'Send critical alert',delayMin:0}] },
  },
  {
    id:'t-3', name:'Heat Stress Fan Trigger', description:'Start fans when temperature or humidity exceeds threshold', category:'climate', icon:'🌡',
    rule:{ name:'Heat Stress Fan Control', description:'', enabled:false, triggerStyle:'any_condition', cooldownMin:15,
      conditions:[{id:'t-c-4',type:'temperature_above',value:'30',device:'',label:'Temp > 30°C'},{id:'t-c-5',type:'humidity_above',value:'75',device:'',label:'Humidity > 75%'}],
      actions:[{id:'t-a-5',type:'start_fan',target:'',label:'Start fans',delayMin:0},{id:'t-a-6',type:'send_alert',target:'',label:'Alert heat stress',delayMin:0}] },
  },
  {
    id:'t-4', name:'Time-Based Schedule', description:'Run an action on a fixed daily schedule', category:'irrigation', icon:'⏰',
    rule:{ name:'Scheduled Irrigation', description:'', enabled:false, triggerStyle:'schedule', cooldownMin:1380,
      conditions:[{id:'t-c-6',type:'time_of_day',value:'06:00',label:'Time is 06:00'}],
      actions:[{id:'t-a-7',type:'start_pump',target:'',value:'60',label:'Start pump (60 min)',delayMin:0}] },
  },
  {
    id:'t-5', name:'Tank Low Alert', description:'Alert when tank level drops below minimum and stop upstream pump', category:'alert', icon:'🔔',
    rule:{ name:'Tank Low Alert', description:'', enabled:false, triggerStyle:'all_conditions', cooldownMin:60,
      conditions:[{id:'t-c-7',type:'tank_level_below',value:'20',device:'',label:'Tank level < 20%'}],
      actions:[{id:'t-a-8',type:'send_alert',target:'',label:'Send tank low alert',delayMin:0},{id:'t-a-9',type:'stop_pump',target:'',label:'Stop upstream pump',delayMin:0}] },
  },
  {
    id:'t-6', name:'Cascade Irrigation', description:'Multi-zone sequential irrigation with delays between zones', category:'irrigation', icon:'🌊',
    rule:{ name:'Multi-Zone Cascade Irrigate', description:'', enabled:false, triggerStyle:'schedule', cooldownMin:1380,
      conditions:[{id:'t-c-8',type:'time_of_day',value:'05:00',label:'Time is 05:00'}],
      actions:[
        {id:'t-a-10',type:'open_valve',target:'Zone 1 Valve',value:'60',label:'Open Zone 1 (60 min)',delayMin:0},
        {id:'t-a-11',type:'open_valve',target:'Zone 2 Valve',value:'60',label:'Open Zone 2 (60 min)',delayMin:65},
        {id:'t-a-12',type:'open_valve',target:'Zone 3 Valve',value:'60',label:'Open Zone 3 (60 min)',delayMin:130},
      ] },
  },
];

// ─── Utilities ─────────────────────────────────────────────────────────────────
function ls<T>(key: string, def: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : def; } catch { return def; }
}
function lsSet<T>(key: string, v: T) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }
function uid() { return Math.random().toString(36).slice(2, 10); }
function fmtTs(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 7*86400) return `${Math.floor(diff/86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── Rule Card ──────────────────────────────────────────────────────────────────

function RuleCard({ rule, onToggle, onSimulate, onDelete, onExpand, expanded }: {
  rule: AutomationRule;
  onToggle: () => void; onSimulate: () => void; onDelete: () => void;
  onExpand: () => void; expanded: boolean;
}) {
  const cat = CATEGORY_META[rule.category];
  const canRun = rule.enabled && (!rule.lastTriggeredAt || Date.now() - new Date(rule.lastTriggeredAt).getTime() > rule.cooldownMin * 60000);
  const cooldownLeft = rule.lastTriggeredAt ? Math.max(0, rule.cooldownMin - Math.floor((Date.now() - new Date(rule.lastTriggeredAt).getTime()) / 60000)) : 0;

  return (
    <div className={`bg-white rounded-xl border-2 transition-all ${rule.enabled ? 'border-slate-200' : 'border-slate-100 opacity-70'}`}>
      <div className="p-4">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${cat.color}`}>{cat.icon} {cat.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${rule.triggerStyle==='all_conditions'?'bg-purple-100 text-purple-700':rule.triggerStyle==='any_condition'?'bg-orange-100 text-orange-700':'bg-blue-100 text-blue-700'}`}>
                {rule.triggerStyle==='all_conditions'?'ALL conditions':rule.triggerStyle==='any_condition'?'ANY condition':'Schedule'}
              </span>
              {!rule.enabled && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 font-bold">DISABLED</span>}
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">{rule.name}</h3>
            {rule.description && <p className="text-[11px] text-slate-400 mt-0.5">{rule.description}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {canRun && (
              <button onClick={onSimulate} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">
                <Play className="w-3 h-3" /> Run
              </button>
            )}
            {!canRun && cooldownLeft > 0 && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{cooldownLeft}m</span>
            )}
            <button onClick={onToggle} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${rule.enabled ? 'bg-green-500' : 'bg-slate-300'}`}>
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${rule.enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
            </button>
            <button onClick={onExpand} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button onClick={onDelete} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3 flex-wrap text-xs text-slate-500">
          <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{rule.conditions.length} condition{rule.conditions.length>1?'s':''}</span>
          <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" />{rule.actions.length} action{rule.actions.length>1?'s':''}</span>
          <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{rule.triggerCount} runs</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Cooldown: {rule.cooldownMin}min</span>
          {rule.lastTriggeredAt && <span className="flex items-center gap-1 text-slate-400">Last: {fmtTs(rule.lastTriggeredAt)}</span>}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4">
          {/* Conditions */}
          <div>
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              IF {rule.triggerStyle === 'all_conditions' ? 'ALL of these' : rule.triggerStyle === 'any_condition' ? 'ANY of these' : 'On schedule'}
            </div>
            <div className="space-y-1.5">
              {rule.conditions.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2">
                  {i > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${rule.triggerStyle==='all_conditions'?'bg-purple-100 text-purple-700':'bg-orange-100 text-orange-700'}`}>{rule.triggerStyle==='all_conditions'?'AND':'OR'}</span>}
                  <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2 text-xs">
                    {c.device && <span className="font-medium text-slate-700">[{c.device}] </span>}
                    <span className="text-slate-600">{CONDITION_META[c.type]?.label ?? c.type}</span>
                    {c.value && <span className="font-bold text-slate-800 ml-1">{c.value} {CONDITION_META[c.type]?.unit ?? ''}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5" /> THEN do these (in order)
            </div>
            <div className="space-y-1.5">
              {rule.actions.map((a, i) => (
                <div key={a.id} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono w-4">{i+1}.</span>
                  {(a.delayMin ?? 0) > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold whitespace-nowrap">+{a.delayMin}min</span>}
                  <div className="flex-1 bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-xs">
                    <span className="font-medium text-green-800">{ACTION_META[a.type]?.label ?? a.type}</span>
                    {a.target && <span className="text-green-600 ml-1">→ {a.target}</span>}
                    {a.value && <span className="text-green-500 ml-1">({a.value} min)</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Run log */}
          {rule.runLog.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Recent Runs</div>
              <div className="space-y-1">
                {rule.runLog.slice(-3).reverse().map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.result==='success'?'bg-green-500':r.result==='skipped'?'bg-amber-400':'bg-red-500'}`} />
                    <span className="text-slate-400 flex-shrink-0">{fmtTs(r.ts)}</span>
                    <span className="text-slate-600">{r.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Rule Builder ───────────────────────────────────────────────────────────────

function RuleBuilder({ onSave, onClose }: { onSave: (r: AutomationRule) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDesc] = useState('');
  const [category, setCategory] = useState<AutomationRule['category']>('custom');
  const [triggerStyle, setTrigger] = useState<TriggerStyle>('all_conditions');
  const [cooldownMin, setCooldown] = useState(60);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [actions, setActions] = useState<Action[]>([]);

  // New condition form
  const [nc, setNC] = useState({ type: 'soil_moisture_below' as ConditionType, value: '', device: '' });
  // New action form
  const [na, setNA] = useState({ type: 'start_pump' as ActionType, target: '', value: '', delayMin: '0' });

  function addCondition() {
    if (!nc.value && nc.type !== 'day_of_week') return;
    const meta = CONDITION_META[nc.type];
    setConditions(prev => [...prev, { id:uid(), type:nc.type, value:nc.value, device:nc.device, label:`${meta.label} ${nc.value} ${meta.unit}` }]);
    setNC({ type:nc.type, value:'', device:'' });
  }

  function addAction() {
    const meta = ACTION_META[na.type];
    setActions(prev => [...prev, { id:uid(), type:na.type, target:na.target, value:na.value||undefined, delayMin:parseInt(na.delayMin)||0, label:`${meta.label}${na.target?' → '+na.target:''}` }]);
    setNA({ type:na.type, target:'', value:'', delayMin:'0' });
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name || conditions.length === 0 || actions.length === 0) return;
    onSave({
      id:`r-${uid()}`, name, description, category, enabled:true,
      triggerStyle, conditions, actions, cooldownMin,
      lastTriggeredAt:null, triggerCount:0, runLog:[],
      addedAt:new Date().toISOString(),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><Zap className="w-4 h-4 text-purple-600" /> Build Automation Rule</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={save} className="p-5 space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="block text-xs text-slate-500 mb-1">Rule Name *</label>
              <input required value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Field A Morning Irrigation" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Category</label>
              <select value={category} onChange={e=>setCategory(e.target.value as any)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                {Object.entries(CATEGORY_META).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select></div>
            <div><label className="block text-xs text-slate-500 mb-1">Trigger Logic</label>
              <select value={triggerStyle} onChange={e=>setTrigger(e.target.value as any)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                <option value="all_conditions">ALL conditions (AND)</option>
                <option value="any_condition">ANY condition (OR)</option>
                <option value="schedule">Scheduled</option>
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-slate-500 mb-1">Description</label>
              <input value={description} onChange={e=>setDesc(e.target.value)} placeholder="Describe what this rule does…" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Cooldown (minutes)</label>
              <input type="number" value={cooldownMin} onChange={e=>setCooldown(parseInt(e.target.value)||60)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" /></div>
          </div>

          {/* Conditions */}
          <div>
            <div className="text-sm font-semibold text-slate-700 mb-2">IF Conditions</div>
            {conditions.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {conditions.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-2">
                    {i > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">{triggerStyle==='any_condition'?'OR':'AND'}</span>}
                    <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-700">{c.device && `[${c.device}] `}{CONDITION_META[c.type]?.label} {c.value} {CONDITION_META[c.type]?.unit}</div>
                    <button type="button" onClick={() => setConditions(prev => prev.filter(x=>x.id!==c.id))} className="text-red-400 hover:text-red-600 p-1"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3">
              <div><label className="block text-[10px] text-slate-400 mb-1">Condition type</label>
                <select value={nc.type} onChange={e=>setNC(f=>({...f,type:e.target.value as any}))} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs">
                  {Object.entries(CONDITION_META).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></div>
              <div><label className="block text-[10px] text-slate-400 mb-1">Value ({CONDITION_META[nc.type]?.unit})</label>
                <input value={nc.value} onChange={e=>setNC(f=>({...f,value:e.target.value}))} placeholder={CONDITION_META[nc.type]?.placeholder} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs" /></div>
              <div><label className="block text-[10px] text-slate-400 mb-1">Device/Zone (optional)</label>
                <input value={nc.device} onChange={e=>setNC(f=>({...f,device:e.target.value}))} placeholder="Pond B / Field A" className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs" /></div>
              <div className="col-span-3 flex justify-end">
                <button type="button" onClick={addCondition} className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Condition</button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="text-sm font-semibold text-slate-700 mb-2">THEN Actions</div>
            {actions.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {actions.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono w-4">{i+1}.</span>
                    {(a.delayMin??0) > 0 && <span className="text-[10px] px-1.5 rounded bg-blue-100 text-blue-700">+{a.delayMin}m</span>}
                    <div className="flex-1 bg-green-50 rounded-lg px-3 py-2 text-xs text-green-800">{ACTION_META[a.type]?.label}{a.target && ` → ${a.target}`}{a.value && ` (${a.value}min)`}</div>
                    <button type="button" onClick={() => setActions(prev => prev.filter(x=>x.id!==a.id))} className="text-red-400 hover:text-red-600 p-1"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-4 gap-2 bg-green-50 rounded-xl p-3">
              <div><label className="block text-[10px] text-slate-400 mb-1">Action</label>
                <select value={na.type} onChange={e=>setNA(f=>({...f,type:e.target.value as any}))} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs">
                  {Object.entries(ACTION_META).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></div>
              {ACTION_META[na.type]?.hasTarget && <div><label className="block text-[10px] text-slate-400 mb-1">Target device</label><input value={na.target} onChange={e=>setNA(f=>({...f,target:e.target.value}))} placeholder="Pump 1 / Valve A" className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs" /></div>}
              {ACTION_META[na.type]?.hasDuration && <div><label className="block text-[10px] text-slate-400 mb-1">Duration (min)</label><input type="number" value={na.value} onChange={e=>setNA(f=>({...f,value:e.target.value}))} placeholder="60" className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs" /></div>}
              <div><label className="block text-[10px] text-slate-400 mb-1">Delay (min)</label><input type="number" value={na.delayMin} onChange={e=>setNA(f=>({...f,delayMin:e.target.value}))} placeholder="0" className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs" /></div>
              <div className="col-span-4 flex justify-end">
                <button type="button" onClick={addAction} className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Action</button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={!name||conditions.length===0||actions.length===0} className="flex-1 bg-purple-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
              <Zap className="w-4 h-4" /> Create Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────

export default function AutomationRules() {
  const [rules, setRules] = useState<AutomationRule[]>(() => ls(LS.RULES, mkSeeds()));
  const [tab, setTab]     = useState<'rules'|'templates'|'log'>('rules');
  const [expandedId, setExpanded] = useState<string | null>(null);
  const [showBuilder, setBuilder] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('all');

  function sv(val: AutomationRule[]) { setRules(val); lsSet(LS.RULES, val); }

  function toggleRule(id: string) {
    sv(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }

  function executeAction(action: Action): string {
    try {
      const t = action.type;
      const target = action.target.toLowerCase();

      // ── Water Management: pumps ──────────────────────────────────────────────
      if (t === 'start_pump' || t === 'stop_pump') {
        const pumps: any[] = JSON.parse(localStorage.getItem('agronexus_v2_wm_pumps') ?? '[]');
        const updated = pumps.map(p =>
          p.name?.toLowerCase().includes(target) || target === 'all'
            ? { ...p, status: t === 'start_pump' ? 'on' : 'off' }
            : p
        );
        localStorage.setItem('agronexus_v2_wm_pumps', JSON.stringify(updated));
        const changed = updated.filter((_p, i) => updated[i].status !== pumps[i]?.status).length;
        return `${t === 'start_pump' ? 'Started' : 'Stopped'} ${changed || 'matching'} pump(s)`;
      }

      // ── Water Management: valves ─────────────────────────────────────────────
      if (t === 'open_valve' || t === 'close_valve') {
        const valves: any[] = JSON.parse(localStorage.getItem('agronexus_v2_wm_valves') ?? '[]');
        const updated = valves.map(v =>
          v.name?.toLowerCase().includes(target) || target === 'all'
            ? { ...v, status: t === 'open_valve' ? 'open' : 'closed' }
            : v
        );
        localStorage.setItem('agronexus_v2_wm_valves', JSON.stringify(updated));
        return `${t === 'open_valve' ? 'Opened' : 'Closed'} matching valve(s)`;
      }

      // ── Aquaculture: aerators ────────────────────────────────────────────────
      if (t === 'start_aerator' || t === 'stop_aerator') {
        const ponds: any[] = JSON.parse(localStorage.getItem('agronexus_v2_aqua_ponds') ?? '[]');
        const updated = ponds.map(p =>
          p.name?.toLowerCase().includes(target) || target === 'all'
            ? { ...p, aeratorOn: t === 'start_aerator' }
            : p
        );
        localStorage.setItem('agronexus_v2_aqua_ponds', JSON.stringify(updated));
        return `${t === 'start_aerator' ? 'Started' : 'Stopped'} aerator on matching pond(s)`;
      }

      // ── Poultry: fans / heaters ──────────────────────────────────────────────
      if (t === 'start_fan' || t === 'stop_fan' || t === 'start_heater' || t === 'stop_heater') {
        const houses: any[] = JSON.parse(localStorage.getItem('agronexus_v2_ph_houses') ?? '[]');
        const isFan = t.includes('fan');
        const isOn  = t.startsWith('start');
        const updated = houses.map(h =>
          h.name?.toLowerCase().includes(target) || target === 'all'
            ? isFan
              ? { ...h, fanSpeedPct: isOn ? 80 : 0 }
              : { ...h, heaterOn: isOn }
            : h
        );
        localStorage.setItem('agronexus_v2_ph_houses', JSON.stringify(updated));
        return `${isOn ? 'Started' : 'Stopped'} ${isFan ? 'fan' : 'heater'} on matching house(s)`;
      }

      // ── Energy: generators ───────────────────────────────────────────────────
      if (t === 'start_generator' || t === 'stop_generator') {
        const gens: any[] = JSON.parse(localStorage.getItem('agronexus_v2_em_generator') ?? '[]');
        const updated = gens.map(g =>
          g.name?.toLowerCase().includes(target) || target === 'all'
            ? { ...g, status: t === 'start_generator' ? 'running' : 'idle' }
            : g
        );
        localStorage.setItem('agronexus_v2_em_generator', JSON.stringify(updated));
        return `${t === 'start_generator' ? 'Started' : 'Stopped'} matching generator(s)`;
      }

      // ── Log event ────────────────────────────────────────────────────────────
      if (t === 'log_event') return `Event logged: ${action.label}`;
      if (t === 'send_alert') return `Alert queued: ${action.target}`;

      return `Action ${t} executed on ${action.target}`;
    } catch (err) {
      return `Error: ${String(err)}`;
    }
  }

  function simulateRun(id: string) {
    sv(rules.map(r => {
      if (r.id !== id) return r;
      const results = r.actions.map(a => executeAction(a));
      const note = results.join(' · ');
      const logEntry = { ts: new Date().toISOString(), result:'success' as const, note };
      return { ...r, lastTriggeredAt: new Date().toISOString(), triggerCount: r.triggerCount + 1, runLog: [...r.runLog.slice(-49), logEntry] };
    }));
  }

  function deleteRule(id: string) {
    if (confirm('Delete this rule?')) sv(rules.filter(r => r.id !== id));
  }

  function addFromTemplate(t: RuleTemplate) {
    const newRule: AutomationRule = {
      ...t.rule, id:`r-${uid()}`, addedAt:new Date().toISOString(),
      lastTriggeredAt:null, triggerCount:0, runLog:[],
    };
    // Regenerate condition/action IDs
    newRule.conditions = newRule.conditions.map(c => ({ ...c, id:uid() }));
    newRule.actions    = newRule.actions.map(a => ({ ...a, id:uid() }));
    sv([...rules, newRule]);
    setTab('rules');
  }

  const enabledCount  = rules.filter(r => r.enabled).length;
  const totalRuns     = rules.reduce((s, r) => s + r.triggerCount, 0);
  const allLogs       = rules.flatMap(r => r.runLog.map(l => ({ ...l, ruleName: r.name }))).sort((a,b)=>new Date(b.ts).getTime()-new Date(a.ts).getTime());
  const filteredRules = filterCat === 'all' ? rules : rules.filter(r => r.category === filterCat);

  const TABS = [
    { id:'rules', label:'Rules' }, { id:'templates', label:'Templates' }, { id:'log', label:'Run Log' },
  ] as const;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Automation Rules</h1>
            <p className="text-purple-100 text-sm">Compound conditions · cascade actions · schedules · templates</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'Total Rules', value: rules.length },
            { label:'Active Rules', value: enabledCount },
            { label:'Total Runs', value: totalRuns },
            { label:'Templates Available', value: TEMPLATES.length },
          ].map(s => (
            <div key={s.label} className="rounded-lg p-3 bg-white/10">
              <div className="text-xs text-white/70 mb-1">{s.label}</div>
              <div className="text-2xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${tab===t.id ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            {t.label}
          </button>
        ))}
        {tab === 'rules' && (
          <div className="ml-auto flex gap-2 flex-wrap">
            {/* Category filter */}
            <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600">
              <option value="all">All categories</option>
              {Object.entries(CATEGORY_META).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <button onClick={() => setBuilder(true)} className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm rounded-xl hover:bg-purple-700">
              <Plus className="w-4 h-4" /> New Rule
            </button>
          </div>
        )}
      </div>

      {/* RULES */}
      {tab === 'rules' && (
        <div className="space-y-3">
          {filteredRules.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <div className="text-sm">No rules yet. Create one or use a template.</div>
            </div>
          ) : (
            filteredRules.map(r => (
              <RuleCard key={r.id} rule={r}
                onToggle={() => toggleRule(r.id)}
                onSimulate={() => simulateRun(r.id)}
                onDelete={() => deleteRule(r.id)}
                onExpand={() => setExpanded(expandedId === r.id ? null : r.id)}
                expanded={expandedId === r.id}
              />
            ))
          )}
        </div>
      )}

      {/* TEMPLATES */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <div className="text-sm text-slate-500">Click a template to add it as a new rule — then edit the targets and values.</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATES.map(t => {
              const cat = CATEGORY_META[t.category];
              return (
                <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-purple-200 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-2xl">{t.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${cat.color}`}>{cat.label}</span>
                      </div>
                      <h3 className="font-semibold text-slate-800 text-sm">{t.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                    </div>
                  </div>
                  <div className="space-y-1 mb-4">
                    {t.rule.conditions.map(c => (
                      <div key={c.id} className="text-[11px] text-slate-500 bg-slate-50 rounded px-2 py-1 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-purple-400" /> IF {CONDITION_META[c.type]?.label} {c.value} {CONDITION_META[c.type]?.unit}
                      </div>
                    ))}
                    {t.rule.actions.map(a => (
                      <div key={a.id} className="text-[11px] text-slate-500 bg-green-50 rounded px-2 py-1 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-green-500" /> {ACTION_META[a.type]?.label}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addFromTemplate(t)} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700">
                    <Copy className="w-3 h-3" /> Use This Template
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RUN LOG */}
      {tab === 'log' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 font-semibold text-sm text-slate-800">All Rule Run History</div>
          {allLogs.length === 0 ? (
            <div className="px-5 py-8 text-slate-400 text-sm text-center">No runs recorded yet.</div>
          ) : (
            allLogs.map((l, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${l.result==='success'?'bg-green-500':l.result==='skipped'?'bg-amber-400':'bg-red-500'}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-800">{l.ruleName}</div>
                  <div className="text-xs text-slate-500">{l.note}</div>
                </div>
                <div className="text-xs text-slate-400 flex-shrink-0">{fmtTs(l.ts)}</div>
              </div>
            ))
          )}
        </div>
      )}

      {showBuilder && <RuleBuilder onSave={r => { sv([...rules, r]); }} onClose={() => setBuilder(false)} />}
    </div>
  );
}
