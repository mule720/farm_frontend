// ─────────────────────────────────────────────────────────────────────────────
// Weather & Field Intelligence — LIVE data.
// Forecasts + current conditions: Open-Meteo (per weather station location).
// Field health: NASA MODIS 250 m NDVI, 16-day composites (per field location).
// Everything shown here comes from the backend; "Sync now" pulls fresh data.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { Cloud, Sun, CloudRain, CloudLightning, Snowflake, Flame, Thermometer, Wind, Droplets, AlertTriangle, Satellite, MapPin, RefreshCw, Loader2, Plus, Trash2, Gauge } from 'lucide-react';
import { gqlRequest } from '@/lib/api';
import {
  WEATHER_OVERVIEW_QUERY, SYNC_WEATHER_NOW_MUTATION, SYNC_STATION_MUTATION, SYNC_FIELD_NDVI_MUTATION,
  CREATE_STATION_MUTATION, DELETE_STATION_MUTATION, CREATE_FIELD_MUTATION, DELETE_FIELD_MUTATION,
  type WeatherOverview, type Forecast, type FieldOverview,
} from '@/graphql/weatherQueries';

const CONDITION_ICONS: Record<string, React.ReactNode> = {
  sunny: <Sun className="w-6 h-6 text-amber-400" />,
  partly_cloudy: <Cloud className="w-6 h-6 text-slate-400" />,
  cloudy: <Cloud className="w-6 h-6 text-slate-500" />,
  light_rain: <CloudRain className="w-6 h-6 text-blue-400" />,
  heavy_rain: <CloudRain className="w-6 h-6 text-blue-600" />,
  thunderstorm: <CloudLightning className="w-6 h-6 text-purple-600" />,
  frost: <Snowflake className="w-6 h-6 text-cyan-500" />,
  heat_wave: <Flame className="w-6 h-6 text-red-500" />,
  drought: <Sun className="w-6 h-6 text-orange-600" />,
};
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const title = (s: string) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const dayLabel = (iso: string, i: number) => i === 0 ? 'Today' : DAY_NAMES[new Date(iso + 'T00:00').getDay()];
const n1 = (v: number | null | undefined, d = 0) => v == null ? '—' : Number(v).toFixed(d);
const compass = (deg: number | null) => deg == null ? '' : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];

function ndviColor(v: number) { return v >= 0.65 ? 'bg-green-500' : v >= 0.45 ? 'bg-lime-400' : v >= 0.30 ? 'bg-yellow-400' : 'bg-red-400'; }
function ndviLabel(v: number) {
  if (v >= 0.65) return { label: 'Excellent', cls: 'bg-green-100 text-green-700' };
  if (v >= 0.45) return { label: 'Good', cls: 'bg-lime-100 text-lime-700' };
  if (v >= 0.30) return { label: 'Fair', cls: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Poor', cls: 'bg-red-100 text-red-700' };
}
const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400';

export default function WeatherModule() {
  const [tab, setTab] = useState<'forecast' | 'current' | 'ndvi' | 'stations'>('forecast');
  const [data, setData] = useState<WeatherOverview | null>(null);
  const [stationId, setStationId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await gqlRequest<{ weatherOverview: WeatherOverview }>(WEATHER_OVERVIEW_QUERY);
      setData(r.weatherOverview);
      setStationId(id => id && r.weatherOverview.stations.some(s => s.id === id) ? id : (r.weatherOverview.stations[0]?.id ?? ''));
    } catch (e: any) { setMsg({ ok: false, text: e?.message ?? 'Failed to load' }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function syncAll() {
    setSyncing(true); setMsg(null);
    try {
      const r = await gqlRequest<{ syncWeatherNow: { stations: number; forecastDays: number; fields: number; ndviRecords: number; errors: string[] } }>(SYNC_WEATHER_NOW_MUTATION);
      const s = r.syncWeatherNow;
      setMsg({ ok: !s.errors.length, text: `Synced ${s.stations} station${s.stations === 1 ? '' : 's'} (${s.forecastDays} forecast days) and ${s.fields} field${s.fields === 1 ? '' : 's'} (${s.ndviRecords} new NDVI composites).${s.errors.length ? ' Errors: ' + s.errors.join('; ') : ''}` });
      await load();
    } catch (e: any) { setMsg({ ok: false, text: e?.message ?? 'Sync failed' }); }
    finally { setSyncing(false); }
  }

  const station = useMemo(() => data?.stations.find(s => s.id === stationId) ?? data?.stations[0] ?? null, [data, stationId]);
  const forecast: Forecast[] = station?.forecast ?? [];
  const today = forecast[0];
  const current = station?.current ?? null;
  const rainDays = forecast.filter(f => f.rainProbabilityPct > 50).length;
  const totalRain = forecast.reduce((s, f) => s + Number(f.expectedRainfallMm || 0), 0);
  const avgMax = forecast.length ? forecast.reduce((s, f) => s + Number(f.tempMaxC || 0), 0) / forecast.length : null;
  const noStation = !loading && data && data.stations.length === 0;
  const noForecast = station && forecast.length === 0;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Cloud className="w-6 h-6 text-sky-500" /> Weather & Field Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">Live 7-day forecast (Open-Meteo), satellite NDVI (NASA MODIS) & farming advisories</p>
        </div>
        <div className="flex items-center gap-2">
          {data && data.stations.length > 1 && (
            <select value={station?.id ?? ''} onChange={e => setStationId(e.target.value)} className={`${inputCls} w-auto`}>
              {data.stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button onClick={syncAll} disabled={syncing || !!noStation} className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-50">
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Sync now
          </button>
        </div>
      </div>

      {msg && <div className={`flex items-start gap-2 p-3 rounded-xl text-sm border ${msg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}><AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />{msg.text}</div>}

      {loading && !data && <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading weather…</div>}

      {noStation && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-900">
          <div className="font-semibold mb-1">No weather station yet</div>
          Add a station with your farm's GPS coordinates under the <button onClick={() => setTab('stations')} className="underline font-semibold">Stations</button> tab, then press <strong>Sync now</strong> to pull a live forecast.
        </div>
      )}

      {station && (
        <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium opacity-80">{today ? 'Today' : 'No forecast yet'} — {station.name}{station.latitude != null && <span className="opacity-70"> · {Number(station.latitude).toFixed(3)}, {Number(station.longitude).toFixed(3)}</span>}</div>
              <div className="text-5xl font-bold mt-1">{today ? `${n1(today.tempMaxC)}°C` : '—'}</div>
              <div className="text-sm opacity-80 mt-1">{today ? <>Low {n1(today.tempMinC)}°C · {title(today.condition)}</> : 'Press Sync now to fetch the live forecast'}</div>
            </div>
            <div className="text-right">
              <div className="opacity-90 mb-3">{today && CONDITION_ICONS[today.condition] && React.cloneElement(CONDITION_ICONS[today.condition] as React.ReactElement, { className: 'w-14 h-14 text-white ml-auto' })}</div>
              <div className="flex gap-4 text-sm justify-end">
                <div className="flex items-center gap-1"><Droplets className="w-4 h-4 opacity-80" />{today ? `${today.rainProbabilityPct}%` : '—'}</div>
                <div className="flex items-center gap-1"><Wind className="w-4 h-4 opacity-80" />{current ? `${n1(current.windSpeedKmh)} km/h` : today ? `${n1(today.windSpeedKmh)} km/h` : '—'}</div>
                <div className="flex items-center gap-1"><Thermometer className="w-4 h-4 opacity-80" />{current?.humidityPct != null ? `${current.humidityPct}% humidity` : '—'}</div>
              </div>
            </div>
          </div>
          {today && <div className="mt-4 bg-white bg-opacity-20 rounded-xl p-3 text-sm"><span className="font-semibold">Farm advisory:</span> {today.farmingAdvisory}</div>}
          {station.lastSyncedAt && <div className="mt-2 text-[11px] opacity-70">Source: {station.provider || 'Open-Meteo'} · last synced {new Date(station.lastSyncedAt).toLocaleString()}</div>}
        </div>
      )}

      {data && data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /><strong>{title(a.alertType)}</strong> at {a.stationName} · {new Date(a.recordedAt).toLocaleString()}{a.temperatureC != null && ` · ${n1(a.temperatureC)}°C`}{a.windSpeedKmh != null && ` · ${n1(a.windSpeedKmh)} km/h`}
            </div>
          ))}
        </div>
      )}

      {station && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Rain days (7d)', value: forecast.length ? rainDays : '—', icon: CloudRain, color: 'blue' },
            { label: 'Expected rainfall', value: forecast.length ? `${totalRain.toFixed(1)} mm` : '—', icon: Droplets, color: 'sky' },
            { label: 'Avg max temp', value: avgMax != null ? `${avgMax.toFixed(0)}°C` : '—', icon: Thermometer, color: 'orange' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 bg-${color}-50 rounded-lg flex items-center justify-center flex-shrink-0`}><Icon className={`w-5 h-5 text-${color}-600`} /></div>
              <div><div className="font-bold text-slate-900 text-lg">{value}</div><div className="text-xs text-slate-500">{label}</div></div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['forecast', 'current', 'ndvi', 'stations'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t === 'ndvi' ? 'Fields & NDVI' : t}</button>
        ))}
      </div>

      {tab === 'forecast' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">7-Day Forecast & Advisories</h3>
          {!forecast.length ? <p className="text-sm text-slate-400 text-center py-6">{noStation ? 'Add a station first.' : 'No forecast yet — press Sync now.'}</p> : (
            <>
              <div className="grid grid-cols-7 gap-2">
                {forecast.map((day, i) => (
                  <div key={day.forecastDate} className={`rounded-xl p-3 text-center space-y-2 ${i === 0 ? 'bg-sky-50 border border-sky-200' : 'bg-slate-50'}`}>
                    <div className="text-xs font-semibold text-slate-600">{dayLabel(day.forecastDate, i)}</div>
                    <div className="text-[10px] text-slate-400">{day.forecastDate.slice(5)}</div>
                    <div className="flex justify-center">{CONDITION_ICONS[day.condition] ?? CONDITION_ICONS.partly_cloudy}</div>
                    <div className="text-sm font-bold text-slate-900">{n1(day.tempMaxC)}°</div>
                    <div className="text-xs text-slate-500">{n1(day.tempMinC)}°</div>
                    <div className={`text-xs px-1 py-0.5 rounded-full ${day.rainProbabilityPct > 50 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{day.rainProbabilityPct}% · {Number(day.expectedRainfallMm).toFixed(0)}mm</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {forecast.map((day, i) => (
                  <div key={day.forecastDate} className={`flex items-start gap-2 p-3 rounded-lg text-xs ${day.rainProbabilityPct > 50 || ['thunderstorm', 'heat_wave', 'frost', 'heavy_rain'].includes(day.condition) ? 'bg-blue-50' : 'bg-slate-50'}`}>
                    <AlertTriangle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span><strong>{dayLabel(day.forecastDate, i)} ({title(day.condition)}, wind {n1(day.windSpeedKmh)} km/h):</strong> {day.farmingAdvisory}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'current' && (
        !current ? <p className="text-sm text-slate-400 text-center py-6 bg-white rounded-xl border border-slate-200">No current reading yet — press Sync now.</p> : (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Temperature', value: `${n1(current.temperatureC, 1)}°C`, sub: current.dewPointC != null ? `Dew point ${n1(current.dewPointC, 1)}°C` : '', icon: Thermometer, color: 'orange' },
              { label: 'Humidity', value: `${current.humidityPct ?? '—'}%`, sub: (current.humidityPct ?? 0) > 80 ? 'High — fungal disease risk' : (current.humidityPct ?? 0) < 30 ? 'Very dry' : 'Comfortable', icon: Droplets, color: 'sky' },
              { label: 'Wind', value: `${n1(current.windSpeedKmh)} km/h`, sub: `${compass(current.windDirectionDeg)} ${current.windDirectionDeg ?? ''}°`.trim(), icon: Wind, color: 'slate' },
              { label: 'UV index (max today)', value: current.uvIndex == null ? '—' : `${n1(current.uvIndex)} — ${Number(current.uvIndex) >= 8 ? 'Very high' : Number(current.uvIndex) >= 6 ? 'High' : Number(current.uvIndex) >= 3 ? 'Moderate' : 'Low'}`, sub: Number(current.uvIndex) >= 6 ? 'Limit midday field work' : '', icon: Sun, color: 'amber' },
              { label: 'Rain (last hour)', value: `${n1(current.rainfallMm, 1)} mm`, sub: today ? `Today: ${Number(today.expectedRainfallMm).toFixed(1)} mm expected` : '', icon: CloudRain, color: 'blue' },
              { label: 'Pressure', value: current.pressureHpa == null ? '—' : `${n1(current.pressureHpa)} hPa`, sub: 'Surface pressure', icon: Gauge, color: 'green' },
            ].map(({ label, value, sub, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                <div className={`w-12 h-12 bg-${color}-50 rounded-xl flex items-center justify-center flex-shrink-0`}><Icon className={`w-6 h-6 text-${color}-600`} /></div>
                <div><div className="text-xs text-slate-500">{label}</div><div className="font-bold text-slate-900">{value}</div><div className="text-xs text-slate-400">{sub}</div></div>
              </div>
            ))}
            <div className="col-span-2 text-[11px] text-slate-400">Observed {new Date(current.recordedAt).toLocaleString()} · {station?.provider || 'Open-Meteo'}</div>
          </div>
        )
      )}

      {tab === 'ndvi' && data && <FieldsTab data={data} onChanged={load} />}
      {tab === 'stations' && data && <StationsTab data={data} onChanged={load} />}
    </div>
  );
}

// ─── Fields & NDVI ───────────────────────────────────────────────────────────

function FieldsTab({ data, onChanged }: { data: WeatherOverview; onChanged: () => Promise<void> }) {
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: '', crop: '', stage: 'vegetative', area: '', lat: '', lon: '', station: data.stations[0]?.id ?? '' });
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) => setF(x => ({ ...x, [k]: e.target.value }));

  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy('new'); setErr('');
    try {
      await gqlRequest(CREATE_FIELD_MUTATION, { name: f.name, crop: f.crop, stage: f.stage, area: f.area ? Number(f.area) : 0, lat: f.lat ? Number(f.lat) : null, lon: f.lon ? Number(f.lon) : null, station: f.station || null });
      setAdding(false); setF(x => ({ ...x, name: '', crop: '', area: '', lat: '', lon: '' })); await onChanged();
    } catch (e: any) { setErr(e?.message); } finally { setBusy(null); }
  }
  async function sync(fld: FieldOverview) {
    setBusy(fld.id); setErr('');
    try { const r = await gqlRequest<{ syncFieldNdvi: { newRecords: number } }>(SYNC_FIELD_NDVI_MUTATION, { id: fld.id }); await onChanged(); if (!r.syncFieldNdvi.newRecords) setErr(`${fld.name}: already up to date (MODIS publishes a new composite every 16 days).`); }
    catch (e: any) { setErr(e?.message); } finally { setBusy(null); }
  }
  async function remove(fld: FieldOverview) {
    if (!confirm(`Delete field "${fld.name}" and its NDVI history?`)) return;
    await gqlRequest(DELETE_FIELD_MUTATION, { id: fld.id }); await onChanged();
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Satellite className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-slate-900">Satellite field health (NDVI)</h3>
          <span className="ml-auto text-xs text-slate-400">Source: NASA MODIS MOD13Q1 · 250 m · 16-day composites</span>
          <button onClick={() => setAdding(a => !a)} className="inline-flex items-center gap-1 text-sm text-sky-600 font-medium hover:text-sky-700"><Plus className="w-4 h-4" /> Add field</button>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-400 rounded" />Poor (&lt;0.3)</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-400 rounded" />Fair (0.3–0.45)</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-lime-400 rounded" />Good (0.45–0.65)</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded" />Excellent (&gt;0.65)</div>
        </div>
        {err && <p className="text-sm text-amber-700">{err}</p>}
        {adding && (
          <form onSubmit={create} className="grid md:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            <input value={f.name} onChange={set('name')} placeholder="Field name (e.g. Block A)" className={inputCls} required />
            <input value={f.crop} onChange={set('crop')} placeholder="Crop (e.g. Maize)" className={inputCls} />
            <select value={f.stage} onChange={set('stage')} className={`${inputCls} bg-white`}>
              {['fallow', 'land_prep', 'planting', 'vegetative', 'flowering', 'fruiting', 'harvest_ready', 'harvested'].map(s => <option key={s} value={s}>{title(s)}</option>)}
            </select>
            <input type="number" step="any" value={f.area} onChange={set('area')} placeholder="Area (ha)" className={inputCls} />
            <input type="number" step="any" value={f.lat} onChange={set('lat')} placeholder="Latitude (e.g. -15.33)" className={inputCls} />
            <input type="number" step="any" value={f.lon} onChange={set('lon')} placeholder="Longitude (e.g. 28.52)" className={inputCls} />
            <select value={f.station} onChange={set('station')} className={`${inputCls} bg-white md:col-span-2`}>
              <option value="">Nearest station (used for location if no coordinates)</option>
              {data.stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button type="submit" disabled={busy === 'new'} className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{busy === 'new' ? 'Saving…' : 'Save field'}</button>
          </form>
        )}
      </div>

      {!data.fields.length ? <p className="text-sm text-slate-400 text-center py-6 bg-white rounded-xl border border-slate-200">No fields yet. Add a field with coordinates (or a nearest station), then sync to pull satellite NDVI.</p> : (
        <div className="space-y-3">
          {data.fields.map(field => {
            const v = field.latestNdvi == null ? null : Number(field.latestNdvi);
            const lab = v == null ? null : ndviLabel(v);
            const hist = field.ndviHistory.map(h => ({ date: h.recordedAt.slice(5), ndvi: Number(h.ndviValue) }));
            return (
              <div key={field.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{field.name}{field.cropType && ` — ${field.cropType}`}</div>
                    <div className="text-xs text-slate-500">{Number(field.areaHa) > 0 && `${Number(field.areaHa)} ha · `}{title(field.cropStage)}{field.latestNdviDate ? ` · Satellite pass ${field.latestNdviDate}` : ' · No satellite data yet'}{field.latitude != null && ` · ${Number(field.latitude).toFixed(3)}, ${Number(field.longitude).toFixed(3)}`}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {lab && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lab.cls}`}>{lab.label}</span>}
                    <button onClick={() => sync(field)} disabled={busy === field.id} title="Pull latest satellite NDVI" className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-sky-600 disabled:opacity-50">{busy === field.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}</button>
                    <button onClick={() => remove(field)} className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {v != null ? (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500"><span>NDVI · {field.health}</span><span className="font-semibold">{v.toFixed(2)}</span></div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ndviColor(v)}`} style={{ width: `${Math.max(0, Math.min(1, v)) * 100}%` }} /></div>
                    </div>
                    {hist.length > 1 && (
                      <div className="h-28">
                        <ResponsiveContainer><LineChart data={hist} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis domain={[0, 1]} tick={{ fontSize: 10 }} /><Tooltip />
                          <ReferenceLine y={0.45} stroke="#a3e635" strokeDasharray="4 4" /><ReferenceLine y={0.3} stroke="#facc15" strokeDasharray="4 4" />
                          <Line isAnimationActive={false} type="monotone" dataKey="ndvi" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart></ResponsiveContainer>
                      </div>
                    )}
                    {field.recommendations.length > 0 && <ul className="text-xs text-slate-600 list-disc pl-4 space-y-0.5">{field.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>}
                  </>
                ) : <p className="text-xs text-slate-400">Press the sync icon to pull the latest satellite composite for this field.</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Stations ────────────────────────────────────────────────────────────────

function StationsTab({ data, onChanged }: { data: WeatherOverview; onChanged: () => Promise<void> }) {
  const [adding, setAdding] = useState(data.stations.length === 0);
  const [s, setS] = useState({ name: '', lat: '', lon: '', provider: 'Open-Meteo' });
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const set = (k: keyof typeof s) => (e: React.ChangeEvent<any>) => setS(x => ({ ...x, [k]: e.target.value }));

  function useMyLocation() {
    if (!navigator.geolocation) { setErr('Geolocation not available in this browser'); return; }
    navigator.geolocation.getCurrentPosition(p => setS(x => ({ ...x, lat: p.coords.latitude.toFixed(5), lon: p.coords.longitude.toFixed(5) })), () => setErr('Could not read your location'));
  }
  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy('new'); setErr('');
    try {
      const r = await gqlRequest<{ createWeatherStation: { station: { id: string } } }>(CREATE_STATION_MUTATION, { name: s.name, lat: Number(s.lat), lon: Number(s.lon), provider: s.provider });
      await gqlRequest(SYNC_STATION_MUTATION, { id: r.createWeatherStation.station.id }).catch(e => setErr(`Station saved, but the first sync failed: ${e?.message}`));
      setAdding(false); setS({ name: '', lat: '', lon: '', provider: 'Open-Meteo' }); await onChanged();
    } catch (e: any) { setErr(e?.message); } finally { setBusy(null); }
  }
  async function sync(id: string) { setBusy(id); setErr(''); try { await gqlRequest(SYNC_STATION_MUTATION, { id }); await onChanged(); } catch (e: any) { setErr(e?.message); } finally { setBusy(null); } }
  async function remove(id: string, name: string) { if (!confirm(`Delete station "${name}"?`)) return; await gqlRequest(DELETE_STATION_MUTATION, { id }); await onChanged(); }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2"><MapPin className="w-4 h-4" /> Weather stations (forecast locations)</h3>
        <button onClick={() => setAdding(a => !a)} className="flex items-center gap-1 text-sm text-sky-600 font-medium hover:text-sky-700"><Plus className="w-4 h-4" /> Add station</button>
      </div>
      {err && <p className="text-sm text-red-700">{err}</p>}
      {adding && (
        <form onSubmit={create} className="grid md:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-xl">
          <input value={s.name} onChange={set('name')} placeholder="Name (e.g. Farm HQ)" className={inputCls} required />
          <input type="number" step="any" value={s.lat} onChange={set('lat')} placeholder="Latitude (e.g. -15.33)" className={inputCls} required />
          <input type="number" step="any" value={s.lon} onChange={set('lon')} placeholder="Longitude (e.g. 28.52)" className={inputCls} required />
          <div className="flex gap-2">
            <button type="button" onClick={useMyLocation} className="px-3 py-2 border border-slate-300 rounded-lg text-xs whitespace-nowrap">Use my location</button>
            <button type="submit" disabled={busy === 'new'} className="flex-1 px-3 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{busy === 'new' ? 'Saving…' : 'Save & sync'}</button>
          </div>
        </form>
      )}
      <div className="space-y-3">
        {data.stations.map(st => (
          <div key={st.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg gap-3">
            <div>
              <div className="font-medium text-sm text-slate-900">{st.name}</div>
              <div className="text-xs text-slate-500">{st.provider || 'Open-Meteo'}{st.latitude != null && ` · ${Number(st.latitude).toFixed(4)}, ${Number(st.longitude).toFixed(4)}`}{st.lastSyncedAt ? ` · synced ${new Date(st.lastSyncedAt).toLocaleString()}` : ' · never synced'}</div>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              {st.current ? <><span>{n1(st.current.temperatureC, 1)}°C</span><span>{st.current.humidityPct}%</span><span>{n1(st.current.rainfallMm, 1)} mm</span><span>{n1(st.current.windSpeedKmh)} km/h</span></> : <span className="text-slate-400">no reading</span>}
              <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${st.forecast.length ? 'bg-green-400' : 'bg-slate-300'}`} />{st.forecast.length ? 'live' : 'idle'}</span>
              <button onClick={() => sync(st.id)} disabled={busy === st.id} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-sky-600 disabled:opacity-50">{busy === st.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}</button>
              <button onClick={() => remove(st.id, st.name)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {!data.stations.length && !adding && <p className="text-sm text-slate-400 text-center py-4">No stations yet.</p>}
      </div>
    </div>
  );
}
