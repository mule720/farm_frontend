/**
 * Device Gateway - connect real sensors, gateways and scripts to the farm.
 *   Devices  the devices that have reported (or that you added), their latest readings and last-seen time
 *   Keys     secrets a device uses to send readings (shown once)
 *   Connect  copy-and-paste examples: curl, Arduino/ESP32, Python
 * Everything here is saved on the server and shared with the whole company. Nothing is simulated.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Radio, KeyRound, PlugZap, Plus, Trash2, Copy, Check, RefreshCw, Battery, Signal, X, AlertTriangle, Cpu } from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import { useOrg } from '@/store/orgStore';

const DEVICES_Q = `{ devices { id name identifier deviceType location status batteryPct signalStrength lastSeenAt createdAt }
  sensorReadings(limit: 400) { id metric value unit isAlert recordedAt device { id } } }`;
const KEYS_Q = `{ deviceKeys { id name prefix isActive allowNewDevices lastUsedAt createdAt } }`;
const PAIR = `mutation($i:PairDeviceInput!){ pairDevice(input:$i){ device { id } } }`;
const UNPAIR = `mutation($id:ID!){ unpairDevice(id:$id){ success } }`;
const TEST_READING = `mutation($i:SensorReadingInput!){ ingestSensorReading(input:$i){ alertsTriggered } }`;
const CREATE_KEY = `mutation($n:String!,$a:Boolean){ createDeviceKey(name:$n, allowNewDevices:$a){ key deviceKey { id } } }`;
const REVOKE_KEY = `mutation($id:ID!){ revokeDeviceKey(id:$id){ ok } }`;

type Dev = { id: string; name: string; identifier: string; deviceType: string; location: string; status: string; batteryPct: number | null; signalStrength: number | null; lastSeenAt: string | null };
type Reading = { id: string; metric: string; value: string; unit: string; isAlert: boolean; recordedAt: string; device: { id: string } };
type Key = { id: string; name: string; prefix: string; isActive: boolean; allowNewDevices: boolean; lastUsedAt: string | null; createdAt: string };

const ONLINE_WINDOW_MS = 15 * 60 * 1000;
const TYPES = [['sensor', 'Sensor'], ['gateway', 'Gateway'], ['camera', 'Camera'], ['controller', 'Controller'], ['weighscale', 'Weigh scale'], ['drone', 'Drone']];
const METRICS = ['temperature', 'humidity', 'soil_moisture', 'ph', 'dissolved_oxygen', 'ammonia', 'co2', 'water_level', 'weight', 'light'];

function endpoint() {
  const raw = (import.meta as any).env?.VITE_API_URL || '/graphql/';
  try { return new URL(raw, window.location.origin).origin + '/api/devices/readings/'; } catch { return window.location.origin + '/api/devices/readings/'; }
}

function ago(iso: string | null) {
  if (!iso) return 'never';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

function state(d: Dev): 'online' | 'warning' | 'offline' | 'never' {
  if (!d.lastSeenAt) return 'never';
  if (Date.now() - new Date(d.lastSeenAt).getTime() > ONLINE_WINDOW_MS) return 'offline';
  return d.status === 'warning' ? 'warning' : 'online';
}

const BADGE: Record<string, string> = {
  online: 'bg-green-100 text-green-700', warning: 'bg-amber-100 text-amber-800', offline: 'bg-slate-200 text-slate-600', never: 'bg-slate-100 text-slate-500',
};
const BADGE_TEXT: Record<string, string> = { online: 'Online', warning: 'Alert', offline: 'Offline', never: 'No data yet' };

function CopyBox({ text, mono = true }: { text: string; mono?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <div className="relative">
      <pre className={`bg-slate-900 text-slate-100 rounded-lg p-3 pr-20 text-xs overflow-x-auto whitespace-pre-wrap break-all ${mono ? 'font-mono' : ''}`}>{text}</pre>
      <button onClick={() => { navigator.clipboard?.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}
        className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white rounded px-2 py-1 text-[11px] flex items-center gap-1">
        {done ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
      </button>
    </div>
  );
}

export default function DeviceGateway() {
  const { org } = useOrg();
  const [tab, setTab] = useState<'devices' | 'keys' | 'connect'>('devices');
  const [devices, setDevices] = useState<Dev[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [keys, setKeys] = useState<Key[] | null>(null);
  const [keysError, setKeysError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState<{ name: string; secret: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await gqlRequest<any>(DEVICES_Q);
      setDevices(d.devices || []); setReadings(d.sensorReadings || []); setError('');
    } catch (e: any) { setError(e.message || 'Could not load devices.'); } finally { setLoading(false); }
    try { const k = await gqlRequest<any>(KEYS_Q); setKeys(k.deviceKeys || []); setKeysError(''); } catch (e: any) { setKeys(null); setKeysError(e.message || ''); }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  const byDevice = useMemo(() => {
    const m: Record<string, Reading[]> = {};
    for (const r of readings) (m[r.device.id] ||= []).push(r);
    return m;
  }, [readings]);
  const latest = (id: string) => {
    const seen = new Set<string>(); const out: Reading[] = [];
    for (const r of byDevice[id] ?? []) if (!seen.has(r.metric)) { seen.add(r.metric); out.push(r); }
    return out;
  };

  const counts = useMemo(() => {
    const c = { online: 0, warning: 0, offline: 0, never: 0 };
    devices.forEach(d => { c[state(d)]++; });
    return c;
  }, [devices]);

  const origin = endpoint();
  const sampleKey = 'agk_YOUR_KEY';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-600" />
            <div>
              <h2 className="font-bold text-slate-900">Device Gateway</h2>
              <p className="text-xs text-slate-500">{devices.length} device{devices.length === 1 ? '' : 's'} · {counts.online + counts.warning} reporting now · {counts.offline} offline</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="flex items-center gap-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"><RefreshCw className="w-3 h-3" />Refresh</button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"><Plus className="w-3 h-3" />Add device</button>
          </div>
        </div>
        <div className="flex gap-1 mt-3">
          {([['devices', 'Devices', Cpu], ['keys', 'Keys', KeyRound], ['connect', 'Connect', PlugZap]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg ${tab === id ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}><Icon className="w-3.5 h-3.5" />{label}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

        {tab === 'devices' && (
          <div className="max-w-4xl space-y-3">
            {loading && <p className="text-sm text-slate-500">Loading…</p>}
            {!loading && devices.length === 0 && (
              <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
                <PlugZap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No devices have reported yet</p>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">Create a key, then follow the steps under <b>Connect</b>. The first reading a device sends makes it appear here by itself. You can also add one by hand.</p>
                <div className="flex justify-center gap-2 mt-4">
                  <button onClick={() => setTab('keys')} className="text-sm px-4 py-2 bg-cyan-600 text-white rounded-lg">Create a key</button>
                  <button onClick={() => setTab('connect')} className="text-sm px-4 py-2 border border-slate-300 rounded-lg">How to connect</button>
                </div>
              </div>
            )}
            {devices.map(d => {
              const st = state(d); const lat = latest(d.id); const isOpen = open === d.id;
              return (
                <div key={d.id} className="bg-white border border-slate-200 rounded-xl">
                  <button onClick={() => setOpen(isOpen ? null : d.id)} className="w-full text-left p-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900">{d.name}</span>
                        <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${BADGE[st]}`}>{BADGE_TEXT[st]}</span>
                        <span className="text-[11px] text-slate-400 capitalize">{d.deviceType}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {d.identifier ? <>ID <code className="bg-slate-100 rounded px-1">{d.identifier}</code> · </> : null}last seen {ago(d.lastSeenAt)}{d.location ? ` · ${d.location}` : ''}
                      </div>
                      {lat.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {lat.map(r => (
                            <span key={r.metric} className={`text-xs rounded-lg px-2 py-1 ${r.isAlert ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700'}`}>
                              {r.metric.replace(/_/g, ' ')}: <b>{Number(r.value)}</b> {r.unit}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-[11px] text-slate-500 space-y-0.5 flex-shrink-0">
                      {d.batteryPct != null && <div className="flex items-center gap-1 justify-end"><Battery className="w-3 h-3" />{d.batteryPct}%</div>}
                      {d.signalStrength != null && <div className="flex items-center gap-1 justify-end"><Signal className="w-3 h-3" />{d.signalStrength}%</div>}
                    </div>
                  </button>
                  {isOpen && <DeviceDetail d={d} readings={byDevice[d.id] ?? []} onChanged={load} />}
                </div>
              );
            })}
            <p className="text-[11px] text-slate-400 pt-2">A device shows Offline when it has not reported for 15 minutes. This page refreshes by itself every 15 seconds.</p>
          </div>
        )}

        {tab === 'keys' && (
          <div className="max-w-3xl space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800">Device keys</h3>
              <p className="text-sm text-slate-500 mt-1">A key is the password a sensor, gateway or script uses to send readings. Make one per gateway so you can switch off a single one if it is lost. The key is shown only once, when you create it.</p>
              <CreateKeyForm onCreated={(name, secret) => { setNewKey({ name, secret }); load(); }} />
            </div>
            {keysError && <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">{keysError}</div>}
            {(keys ?? []).map(k => (
              <div key={k.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                <KeyRound className={`w-5 h-5 ${k.isActive ? 'text-cyan-600' : 'text-slate-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800">{k.name} {!k.isActive && <span className="text-[10px] bg-slate-200 rounded px-1.5 py-0.5 ml-1">revoked</span>}</div>
                  <div className="text-xs text-slate-500"><code>{k.prefix}…</code> · last used {ago(k.lastUsedAt)} · {k.allowNewDevices ? 'can add new devices' : 'known devices only'}</div>
                </div>
                {k.isActive && <button onClick={async () => { if (window.confirm?.(`Revoke "${k.name}"? Devices using it will stop being accepted.`) === false) return; await gqlRequest(REVOKE_KEY, { id: k.id }); load(); }}
                  className="text-xs text-red-600 hover:underline">Revoke</button>}
              </div>
            ))}
            {keys && keys.length === 0 && <p className="text-sm text-slate-400">No keys yet.</p>}
          </div>
        )}

        {tab === 'connect' && (
          <div className="max-w-3xl space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-slate-800">How a device sends readings</h3>
              <ol className="text-sm text-slate-700 space-y-2 list-decimal pl-5">
                <li>Create a key under <button className="text-cyan-700 underline" onClick={() => setTab('keys')}>Keys</button> and copy it.</li>
                <li>Make the device (or the gateway it reports through) send an HTTPS <b>POST</b> to the address below, with the key in the <code>Authorization</code> header.</li>
                <li>Give each device a short, unique <b>device</b> name, such as <code>pond-1</code> or its serial number. It appears here the first time it reports.</li>
              </ol>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Address</div>
              <CopyBox text={origin} />
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">The message (JSON)</div>
              <CopyBox text={`{ "device": "pond-1", "metric": "temperature", "value": 27.4, "unit": "C", "battery": 88, "signal": 70 }`} />
              <p className="text-xs text-slate-500"><b>metric</b> is a lower-case word such as temperature, humidity, soil_moisture, ph, dissolved_oxygen, ammonia, co2, water_level or weight. <b>unit</b>, <b>battery</b> and <b>signal</b> are optional. To send many at once use <code>{`{ "readings": [ {…}, {…} ] }`}</code> (up to 200).</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-slate-800">Try it from a computer</h3>
              <CopyBox text={`curl -X POST ${origin} \\\n  -H "Authorization: Bearer ${sampleKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"device":"pond-1","metric":"temperature","value":27.4}'`} />
              <p className="text-xs text-slate-500">A good answer looks like <code>{`{"accepted":1,"alerts":0,"rejected":[]}`}</code>. Then open the Devices tab: pond-1 is there.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-slate-800">ESP32 / Arduino (Wi-Fi)</h3>
              <CopyBox text={`#include <WiFi.h>\n#include <HTTPClient.h>\n#include <WiFiClientSecure.h>\n\nvoid sendReading(float value) {\n  WiFiClientSecure client;\n  client.setInsecure();              // for a quick test; pin the certificate for production\n  HTTPClient http;\n  http.begin(client, "${origin}");\n  http.addHeader("Content-Type", "application/json");\n  http.addHeader("Authorization", "Bearer ${sampleKey}");\n  String body = String("{\\"device\\":\\"pond-1\\",\\"metric\\":\\"temperature\\",\\"value\\":") + value + "}";\n  int code = http.POST(body);        // 200 = accepted\n  http.end();\n}`} />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-slate-800">Python (Raspberry Pi, gateway computer)</h3>
              <CopyBox text={`import requests\n\nr = requests.post("${origin}",\n    headers={"Authorization": "Bearer ${sampleKey}"},\n    json={"readings": [\n        {"device": "pond-1", "metric": "temperature", "value": 27.4},\n        {"device": "pond-1", "metric": "dissolved_oxygen", "value": 5.8},\n    ]}, timeout=15)\nprint(r.status_code, r.json())`} />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 text-sm text-slate-600 space-y-2">
              <h3 className="font-semibold text-slate-800">Sensors that talk MQTT, LoRaWAN or Zigbee</h3>
              <p>These do not call the web address directly. Put a small bridge in the middle that forwards each message to the address above, for example <b>Node-RED</b> (an "http request" node), <b>ChirpStack</b> or <b>The Things Network</b> HTTP integrations, or a few lines of Python on a Raspberry Pi. The message format is the same as above. The Farm Gateway page's MQTT settings do not connect to anything yet.</p>
              <p>The sensor needs power and a way online (Wi-Fi, a mobile data SIM or a gateway). If a sensor is far from signal, a LoRa gateway or a phone hotspot is the usual answer.</p>
            </div>
          </div>
        )}
      </div>

      {showAdd && <AddDevice org={org} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
      {newKey && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5 space-y-3">
            <h3 className="font-bold text-slate-900">Your key for "{newKey.name}"</h3>
            <div className="flex gap-2 items-start text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3"><AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />Copy it now. For safety it is never shown again. If you lose it, revoke it and make a new one.</div>
            <CopyBox text={newKey.secret} />
            <button onClick={() => setNewKey(null)} className="w-full py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-medium">I have copied it</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateKeyForm({ onCreated }: { onCreated: (name: string, secret: string) => void }) {
  const [name, setName] = useState('');
  const [allowNew, setAllowNew] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const r = await gqlRequest<any>(CREATE_KEY, { n: name, a: allowNew });
      onCreated(name, r.createDeviceKey.key); setName('');
    } catch (e2: any) { setErr(e2.message); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={go} className="mt-3 flex flex-wrap gap-2 items-center">
      <input value={name} onChange={e => setName(e.target.value)} placeholder='Name, e.g. "Pond gateway"' maxLength={100}
        className="flex-1 min-w-[200px] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
      <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={allowNew} onChange={e => setAllowNew(e.target.checked)} />Let new devices add themselves</label>
      <button disabled={busy || !name.trim()} className="px-4 py-2 bg-cyan-600 text-white text-sm rounded-lg disabled:opacity-40">Create key</button>
      {err && <p className="w-full text-xs text-red-600">{err}</p>}
    </form>
  );
}

function DeviceDetail({ d, readings, onChanged }: { d: Dev; readings: Reading[]; onChanged: () => void }) {
  const [metric, setMetric] = useState('temperature');
  const [value, setValue] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  async function test(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    try {
      await gqlRequest(TEST_READING, { i: { deviceId: d.id, metric, value: parseFloat(value), unit: '' } });
      setMsg({ ok: true, t: 'Test reading saved. It is marked as coming from you, not from the device.' }); setValue(''); onChanged();
    } catch (err: any) { setMsg({ ok: false, t: err.message }); }
  }
  return (
    <div className="border-t border-slate-100 p-4 space-y-4 text-sm">
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Recent readings</div>
        {readings.length === 0 ? <p className="text-slate-400 text-xs">Nothing received yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-left text-slate-400"><th className="py-1 pr-3">When</th><th className="pr-3">Measure</th><th>Value</th></tr></thead>
            <tbody>{readings.slice(0, 12).map(r => (
              <tr key={r.id} className="border-t border-slate-50"><td className="py-1 pr-3 text-slate-500">{new Date(r.recordedAt).toLocaleString()}</td><td className="pr-3 capitalize">{r.metric.replace(/_/g, ' ')}</td>
                <td className={r.isAlert ? 'text-red-600 font-semibold' : ''}>{Number(r.value)} {r.unit}{r.isAlert ? '  ⚠' : ''}</td></tr>))}</tbody></table></div>
        )}
      </div>
      <form onSubmit={test} className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-slate-500">Send a test reading:</span>
        <select value={metric} onChange={e => setMetric(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs">{METRICS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}</select>
        <input value={value} onChange={e => setValue(e.target.value)} type="number" step="any" placeholder="value" className="w-24 border border-slate-300 rounded-lg px-2 py-1.5 text-xs" />
        <button disabled={!value} className="px-3 py-1.5 text-xs bg-slate-800 text-white rounded-lg disabled:opacity-40">Send</button>
      </form>
      {msg && <p className={`text-xs ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.t}</p>}
      <button onClick={async () => { if (window.confirm?.(`Remove "${d.name}" and its readings?`) === false) return; await gqlRequest(UNPAIR, { id: d.id }); onChanged(); }}
        className="flex items-center gap-1 text-xs text-red-600 hover:underline"><Trash2 className="w-3 h-3" />Remove this device</button>
    </div>
  );
}

function AddDevice({ org, onClose, onSaved }: { org: any; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ name: '', deviceType: 'sensor', identifier: '', location: '' });
  const [err, setErr] = useState('');
  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    try { await gqlRequest(PAIR, { i: { name: f.name, deviceType: f.deviceType, identifier: f.identifier, location: f.location } }); onSaved(); }
    catch (e2: any) { setErr(e2.message); }
  }
  const cls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500';
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={save} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-bold text-slate-900">Add a device</h3><button type="button" onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-4 h-4" /></button></div>
        <div><label className="block text-xs text-slate-500 mb-1">Name *</label><input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder={`e.g. ${org?.name ? 'Pond 1 sensor' : 'Pond 1 sensor'}`} className={cls} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="block text-xs text-slate-500 mb-1">Type</label><select value={f.deviceType} onChange={e => setF({ ...f, deviceType: e.target.value })} className={cls}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div><label className="block text-xs text-slate-500 mb-1">Device ID</label><input value={f.identifier} onChange={e => setF({ ...f, identifier: e.target.value })} placeholder="pond-1" className={cls} /></div>
        </div>
        <div><label className="block text-xs text-slate-500 mb-1">Where it is</label><input value={f.location} onChange={e => setF({ ...f, location: e.target.value })} placeholder="e.g. North pond" className={cls} /></div>
        <p className="text-[11px] text-slate-400">The device ID is the name the device uses when it sends readings. Leave it empty and use the name the device sends instead; it will add itself.</p>
        {err && <p className="text-xs text-red-600">{err}</p>}
        <button className="w-full py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-medium">Add device</button>
      </form>
    </div>
  );
}
