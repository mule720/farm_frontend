import React, { useState } from 'react';
import {
  Wifi, MessageCircle, DollarSign, FileText, Radio, Link2, CheckCircle,
  AlertTriangle, Settings, RefreshCw, ExternalLink, ChevronRight, Zap,
  Building2, Phone, Cloud, Globe,
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  category: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  description: string;
  lastSync?: string;
  icon: React.ElementType;
  color: string;
}

const INTEGRATIONS: Integration[] = [
  { id: 'whatsapp', name: 'WhatsApp Business API', category: 'Communication', status: 'connected', description: 'Automated alerts: disease risks, low tank levels, harvest reminders, payroll notifications.', lastSync: '2 min ago', icon: MessageCircle, color: 'green' },
  { id: 'quickbooks', name: 'QuickBooks Online', category: 'ERP / Accounting', status: 'connected', description: 'Auto-sync cost entries, revenue, invoices, and payroll to accounting ledger.', lastSync: '1h ago', icon: DollarSign, color: 'blue' },
  { id: 'xero', name: 'Xero', category: 'ERP / Accounting', status: 'disconnected', description: 'Two-way sync of chart of accounts, bills, and bank transactions.', icon: DollarSign, color: 'blue' },
  { id: 'sage', name: 'Sage Business Cloud', category: 'ERP / Accounting', status: 'disconnected', description: 'South African and Zambian payroll compliance + ledger integration.', icon: Building2, color: 'green' },
  { id: 'zanaco', name: 'Zanaco Bank API', category: 'Banking', status: 'pending', description: 'Automatic bank statement reconciliation and payroll disbursement via ZNBS.', icon: Building2, color: 'indigo' },
  { id: 'stanbic', name: 'Stanbic Bank API', category: 'Banking', status: 'disconnected', description: 'Direct bank transfer for supplier payments and employee net pay.', icon: Building2, color: 'blue' },
  { id: 'lorawan', name: 'LoRaWAN Gateway', category: 'IoT / Connectivity', status: 'connected', description: 'Long-range low-power sensor network for soil, borehole, and weather station data.', lastSync: '5 min ago', icon: Radio, color: 'purple' },
  { id: 'nbiot', name: 'NB-IoT / LTE-M', category: 'IoT / Connectivity', status: 'connected', description: 'Cellular IoT for GPS livestock trackers and remote actuator control.', lastSync: '1 min ago', icon: Wifi, color: 'purple' },
  { id: 'govt_moa', name: 'MoA E-Voucher Portal', category: 'Government', status: 'pending', description: 'Zambia Ministry of Agriculture FISP e-voucher and subsidy reporting.', icon: FileText, color: 'amber' },
  { id: 'govt_zra', name: 'ZRA TaxOnline', category: 'Government', status: 'disconnected', description: 'Auto-generate and submit monthly PAYE returns directly to ZRA.', icon: Globe, color: 'amber' },
  { id: 'sms_gateway', name: 'SMS Gateway (Airtel/MTN)', category: 'Communication', status: 'connected', description: 'Low-bandwidth fallback for field alerts when internet is unavailable.', lastSync: '8 min ago', icon: Phone, color: 'orange' },
  { id: 'ndvi', name: 'Sentinel-2 NDVI Feed', category: 'Remote Sensing', status: 'connected', description: 'Weekly satellite imagery for crop health monitoring and insurance evidence.', lastSync: '2 days ago', icon: Cloud, color: 'teal' },
];

const WHATSAPP_ALERTS = [
  { time: '06:15', message: 'LOW TANK: Borehole 1 at 18% — pump triggered automatically', type: 'warning', sent: true },
  { time: '07:02', message: 'ATTENDANCE: 12/14 workers clocked in. Nsama Phiri late (07:45).', type: 'info', sent: true },
  { time: '08:30', message: 'DISEASE ALERT: Newcastle risk 87% in 5 days. Vaccinate today.', type: 'alert', sent: true },
  { time: '12:00', message: 'FERTIGATION: Tunnel 1 midday dose complete — EC 1.9 mS/cm ✓', type: 'info', sent: true },
  { time: '—', message: 'HARVEST REMINDER: Broiler Flock A ready in 3 days. Contact buyer.', type: 'info', sent: false },
];

const SYNC_HISTORY = [
  { system: 'QuickBooks Online', event: 'Cost entries synced (14 records)', status: 'ok', time: '1h ago' },
  { system: 'LoRaWAN Gateway', event: 'Sensor data received (48 readings)', status: 'ok', time: '5m ago' },
  { system: 'WhatsApp API', event: 'Bulk alert sent (12 contacts)', status: 'ok', time: '2m ago' },
  { system: 'NB-IoT', event: 'GPS ping — Cattle herd (23 animals)', status: 'ok', time: '1m ago' },
  { system: 'Zanaco API', event: 'Auth token refresh pending approval', status: 'warning', time: '3h ago' },
  { system: 'MoA Portal', event: 'FISP quarterly report submission failed — retry scheduled', status: 'error', time: '6h ago' },
];

function StatusBadge({ status }: { status: Integration['status'] }) {
  const cfg = {
    connected: 'bg-green-100 text-green-700',
    disconnected: 'bg-slate-100 text-slate-500',
    error: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700',
  }[status];
  const labels = { connected: 'Connected', disconnected: 'Not connected', error: 'Error', pending: 'Pending setup' };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg}`}>{labels[status]}</span>;
}

function SyncBadge({ status }: { status: string }) {
  const cfg = { ok: 'text-green-600', warning: 'text-amber-600', error: 'text-red-600' }[status] || 'text-slate-500';
  const Icon = status === 'ok' ? CheckCircle : AlertTriangle;
  return <Icon className={`w-4 h-4 ${cfg}`} />;
}

const CATEGORIES = ['All', 'Communication', 'ERP / Accounting', 'Banking', 'IoT / Connectivity', 'Government', 'Remote Sensing'];

export default function IntegrationsModule() {
  const [tab, setTab] = useState<'overview' | 'whatsapp' | 'sync'>('overview');
  const [filterCat, setFilterCat] = useState('All');

  const filtered = filterCat === 'All' ? INTEGRATIONS : INTEGRATIONS.filter(i => i.category === filterCat);
  const connected = INTEGRATIONS.filter(i => i.status === 'connected').length;
  const errors = INTEGRATIONS.filter(i => i.status === 'error').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Integrations & Connectivity</h1>
          <p className="text-sm text-slate-500 mt-1">WhatsApp · ERP · banking · government reporting · IoT gateways · remote sensing</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg">
            <CheckCircle className="w-4 h-4" />{connected} connected
          </span>
          {errors > 0 && (
            <span className="flex items-center gap-1.5 text-sm bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg">
              <AlertTriangle className="w-4 h-4" />{errors} error
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {[{ id: 'overview', label: 'All Integrations' }, { id: 'whatsapp', label: 'WhatsApp Bot' }, { id: 'sync', label: 'Sync History' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setFilterCat(cat)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filterCat === cat ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(intg => {
              const Icon = intg.icon;
              return (
                <div key={intg.id} className={`bg-white rounded-xl border p-4 ${intg.status === 'error' ? 'border-red-200' : intg.status === 'connected' ? 'border-slate-200' : 'border-slate-200'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${intg.color === 'green' ? 'bg-green-100' : intg.color === 'blue' ? 'bg-blue-100' : intg.color === 'purple' ? 'bg-purple-100' : intg.color === 'amber' ? 'bg-amber-100' : intg.color === 'orange' ? 'bg-orange-100' : intg.color === 'indigo' ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                        <Icon className={`w-4 h-4 ${intg.color === 'green' ? 'text-green-600' : intg.color === 'blue' ? 'text-blue-600' : intg.color === 'purple' ? 'text-purple-600' : intg.color === 'amber' ? 'text-amber-600' : intg.color === 'orange' ? 'text-orange-600' : intg.color === 'indigo' ? 'text-indigo-600' : 'text-slate-500'}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{intg.name}</div>
                        <div className="text-xs text-slate-400">{intg.category}</div>
                      </div>
                    </div>
                    <StatusBadge status={intg.status} />
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{intg.description}</p>
                  <div className="flex items-center justify-between">
                    {intg.lastSync ? (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1"><RefreshCw className="w-3 h-3" />Last sync: {intg.lastSync}</span>
                    ) : <span />}
                    <button className={`text-xs flex items-center gap-1 font-medium ${intg.status === 'connected' ? 'text-slate-500 hover:text-slate-700' : 'text-blue-600 hover:text-blue-700'}`}>
                      {intg.status === 'connected' ? <><Settings className="w-3 h-3" />Configure</> : <><Link2 className="w-3 h-3" />Connect</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'whatsapp' && (
        <div className="space-y-4 max-w-2xl">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-green-800">WhatsApp Business Bot — Active</div>
              <div className="text-sm text-green-700">Number: +260 97X XXX XXX · 12 contacts subscribed</div>
            </div>
            <CheckCircle className="w-5 h-5 text-green-500 ml-auto flex-shrink-0" />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="font-semibold text-slate-800 mb-3">Today's Automated Messages</div>
            <div className="space-y-3">
              {WHATSAPP_ALERTS.map((alert, i) => (
                <div key={i} className={`rounded-lg p-3 ${alert.type === 'alert' ? 'bg-red-50 border border-red-100' : alert.type === 'warning' ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50 border border-slate-100'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="text-xs font-mono text-slate-700">{alert.message}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {alert.time !== '—' && <span className="text-[10px] text-slate-400">{alert.time}</span>}
                      {alert.sent ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Clock className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="font-semibold text-slate-800 mb-3">Alert Triggers Configuration</div>
            <div className="space-y-2">
              {[
                { label: 'Tank level below threshold', enabled: true },
                { label: 'Disease risk > 70%', enabled: true },
                { label: 'Worker absent (no clock-in by 07:30)', enabled: true },
                { label: 'Climate alert (temp/humidity out of range)', enabled: true },
                { label: 'Harvest due in 3 days', enabled: true },
                { label: 'Payroll deadline reminder', enabled: false },
                { label: 'ASF/FMD regional outbreak news', enabled: false },
              ].map((trigger, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-700">{trigger.label}</span>
                  <div className={`w-9 h-5 rounded-full flex items-center transition-colors cursor-pointer ${trigger.enabled ? 'bg-green-500' : 'bg-slate-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-all mx-0.5 ${trigger.enabled ? 'ml-4' : ''}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'sync' && (
        <div className="space-y-3 max-w-3xl">
          <div className="text-sm text-slate-500">Last 24-hour integration activity log</div>
          {SYNC_HISTORY.map((ev, i) => (
            <div key={i} className={`bg-white rounded-xl border px-4 py-3 flex items-center gap-3 ${ev.status === 'error' ? 'border-red-200' : ev.status === 'warning' ? 'border-amber-200' : 'border-slate-200'}`}>
              <SyncBadge status={ev.status} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800">{ev.system}</div>
                <div className="text-xs text-slate-500 truncate">{ev.event}</div>
              </div>
              <div className="text-xs text-slate-400 flex-shrink-0">{ev.time}</div>
              {ev.status !== 'ok' && (
                <button className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 flex-shrink-0"><RefreshCw className="w-3 h-3" />Retry</button>
              )}
            </div>
          ))}
          <div className="text-center">
            <button className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mx-auto">
              <ExternalLink className="w-3.5 h-3.5" />View full audit log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
