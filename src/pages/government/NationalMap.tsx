// ─────────────────────────────────────────────────────────────────────────────
// National map — every district as a proportional circle (choropleth-style
// colour by the chosen metric), with participant / hotspot / programme /
// station / provider layers and a drill-down panel. De-identified: districts
// and public marketplace providers only; stations are rounded to ~1 km.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon, Loader2, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { gqlRequest } from '@/lib/api';

const QUERY = `query EcoMap($p: String, $d: String) {
  ecoMap(province: $p, district: $d) {
    centerLat centerLng unplaced
    districts { province district lat lng approximate organisations farms vendors consenting counts coverageScore gaps programmes participants supportValue partners hotspotReports hotspotCategories stations providers }
    points { layer label kind lat lng district verified }
  }
}`;

type Metric = 'organisations' | 'farms' | 'vendors' | 'consenting' | 'participants' | 'hotspotReports' | 'coverageScore';
const METRICS: { id: Metric; label: string; hint: string }[] = [
  { id: 'organisations', label: 'All organisations', hint: 'Farms, cooperatives and every vendor type' },
  { id: 'farms', label: 'Farms & cooperatives', hint: 'Producers only' },
  { id: 'vendors', label: 'Vendors', hint: 'Dealers, vets, hire, processors, transport…' },
  { id: 'consenting', label: 'Sharing data', hint: 'Organisations that opted in' },
  { id: 'participants', label: 'Programme participants', hint: 'Enrolled in any partner or government programme' },
  { id: 'hotspotReports', label: 'Disease / pest reports', hint: 'Last 90 days, consenting farms' },
  { id: 'coverageScore', label: 'Service coverage', hint: '0 = no services near farms, 5 = fully served' },
];
const TYPE_LABEL: Record<string, string> = { farmer: 'Farms', cooperative: 'Cooperatives', agro_dealer: 'Agro dealers', vet_provider: 'Vets', equipment_hire: 'Equipment hire', agrifood_seller: 'AgriFood sellers', agrisupply_provider: 'AgriSupply', agriservices_provider: 'AgriServices', processor: 'Processors', transport: 'Transport' };
const CAT_LABEL: Record<string, string> = { crop_disease: 'Crop disease', pest: 'Pest', animal_disease: 'Animal disease', nutritional: 'Nutritional', yield_issue: 'Yield issue', weed: 'Weed', other: 'Other' };
const PROVIDER_COLOR: Record<string, string> = { vet_services: '#0284c7', agro_dealer: '#d97706', equipment_hire: '#ea580c', processing: '#9333ea', transport: '#4b5563', finance: '#059669', insurance: '#0d9488', extension: '#65a30d', cold_storage: '#2563eb' };
const parse = (v: any) => (typeof v === 'string' ? JSON.parse(v) : v) ?? {};
const fmt = (n: number) => Number(n ?? 0).toLocaleString();

// green (good) → amber → red for coverage; light → dark amber for counts
function colourFor(metric: Metric, v: number, max: number) {
  if (metric === 'coverageScore') return v >= 4 ? '#16a34a' : v >= 2 ? '#d97706' : '#dc2626';
  if (metric === 'hotspotReports') return v === 0 ? '#94a3b8' : v >= max * 0.66 ? '#b91c1c' : v >= max * 0.33 ? '#ea580c' : '#f59e0b';
  const t = max ? v / max : 0;
  return t > 0.66 ? '#92400e' : t > 0.33 ? '#d97706' : t > 0 ? '#fbbf24' : '#cbd5e1';
}

function FlyTo({ target }: { target: [number, number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (target) map.flyTo([target[0], target[1]], target[2], { duration: 0.8 }); }, [target, map]);
  return null;
}

interface Props { province?: string; district?: string; onOpenDistrict?: (province: string, district: string) => void }

export default function NationalMap({ province, district, onOpenDistrict }: Props) {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<Metric>('organisations');
  const [layers, setLayers] = useState({ districts: true, hotspots: true, programmes: true, stations: true, providers: true });
  const [selected, setSelected] = useState<any>(null);
  const [fly, setFly] = useState<[number, number, number] | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try { const r = await gqlRequest(QUERY, { p: province || null, d: district || null }); setData(r.ecoMap); }
    catch (e: any) { setErr(e?.message ?? 'Failed to load the map'); } finally { setLoading(false); }
  }, [province, district]);
  useEffect(() => { load(); }, [load]);

  const districts: any[] = data?.districts ?? [];
  const max = useMemo(() => Math.max(1, ...districts.map(d => Number(d[metric]) || 0)), [districts, metric]);
  const totals = useMemo(() => districts.reduce((a, d) => ({ orgs: a.orgs + d.organisations, hot: a.hot + d.hotspotReports, part: a.part + d.participants }), { orgs: 0, hot: 0, part: 0 }), [districts]);

  if (err) return <div className="p-6"><div className="flex items-center gap-2 p-3 rounded-xl text-sm border bg-red-50 border-red-200 text-red-700"><AlertTriangle className="w-4 h-4" /> {err}</div></div>;

  const pick = (d: any) => { setSelected(d); setFly([d.lat, d.lng, 9]); };
  const Toggle = ({ k, label, swatch }: { k: keyof typeof layers; label: string; swatch: string }) => (
    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
      <input type="checkbox" checked={layers[k]} onChange={e => setLayers({ ...layers, [k]: e.target.checked })} className="accent-amber-600" />
      <span className="inline-block w-3 h-3 rounded-full border border-white shadow" style={{ background: swatch }} />{label}
    </label>
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><MapIcon className="w-5 h-5 text-amber-500" /> National Map</h2>
          <p className="text-xs text-slate-500">{district || province || 'Zambia'} · {fmt(totals.orgs)} organisations in {districts.length} districts · {fmt(totals.part)} programme participants · {fmt(totals.hot)} disease / pest reports (90 d). Districts are drawn at their centroid; nobody is identified.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={metric} onChange={e => setMetric(e.target.value as Metric)} className="text-sm border border-slate-300 rounded-lg px-2 py-1.5 bg-white" aria-label="Colour districts by">
            {METRICS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <button onClick={load} className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50" aria-label="Refresh"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100" style={{ height: 560 }}>
          {loading && !data && <div className="absolute inset-0 z-[500] flex items-center justify-center text-sm text-slate-500 gap-2 bg-white/70"><Loader2 className="w-4 h-4 animate-spin" /> Loading map…</div>}
          <MapContainer center={[data?.centerLat ?? -13.45, data?.centerLng ?? 27.85]} zoom={province || district ? 8 : 6} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FlyTo target={fly} />
            {layers.districts && districts.map(d => {
              const v = Number(d[metric]) || 0;
              const r = metric === 'coverageScore' ? 14 : 8 + 26 * Math.sqrt(v / max);
              return (
                <CircleMarker key={d.province + d.district} center={[d.lat, d.lng]} radius={r} eventHandlers={{ click: () => pick(d) }}
                  pathOptions={{ color: selected?.district === d.district ? '#0f172a' : '#ffffff', weight: selected?.district === d.district ? 3 : 1.5, fillColor: colourFor(metric, v, max), fillOpacity: 0.75, dashArray: d.approximate ? '4 4' : undefined }}>
                  <Tooltip direction="top" offset={[0, -r]}><div className="text-xs"><strong>{d.district}</strong> · {d.province}<br />{METRICS.find(m => m.id === metric)?.label}: <strong>{metric === 'coverageScore' ? `${v} / 5` : fmt(v)}</strong><br />{d.organisations} organisations · {d.participants} participants{d.approximate ? <><br /><em>placed at province centroid</em></> : null}</div></Tooltip>
                </CircleMarker>
              );
            })}
            {layers.hotspots && districts.filter(d => d.hotspotReports > 0).map(d => (
              <CircleMarker key={'h' + d.district} center={[d.lat, d.lng]} radius={10 + 20 * Math.sqrt(d.hotspotReports / Math.max(1, ...districts.map(x => x.hotspotReports)))} interactive={false}
                pathOptions={{ color: '#dc2626', weight: 2, fill: false, dashArray: '2 4' }} />
            ))}
            {layers.programmes && districts.filter(d => d.participants > 0).map(d => (
              <CircleMarker key={'p' + d.district} center={[d.lat + 0.12, d.lng + 0.12]} radius={5 + 3 * Math.min(4, d.programmes)} eventHandlers={{ click: () => pick(d) }}
                pathOptions={{ color: '#fff', weight: 1, fillColor: '#7c3aed', fillOpacity: 0.9 }}>
                <Tooltip direction="right"><div className="text-xs"><strong>{d.programmes} programme{d.programmes === 1 ? '' : 's'}</strong> in {d.district}<br />{d.participants} participants · {d.partners.join(', ')}</div></Tooltip>
              </CircleMarker>
            ))}
            {layers.stations && (data?.points ?? []).filter((p: any) => p.layer === 'station').map((p: any, i: number) => (
              <CircleMarker key={'s' + i} center={[p.lat, p.lng]} radius={4} pathOptions={{ color: '#fff', weight: 1, fillColor: '#0284c7', fillOpacity: 1 }}>
                <Tooltip><span className="text-xs">{p.label} (≈1 km)</span></Tooltip>
              </CircleMarker>
            ))}
            {layers.providers && (data?.points ?? []).filter((p: any) => p.layer === 'provider').map((p: any, i: number) => (
              <CircleMarker key={'v' + i} center={[p.lat - 0.08, p.lng - 0.1]} radius={5} pathOptions={{ color: '#fff', weight: 1, fillColor: PROVIDER_COLOR[p.kind] ?? '#f97316', fillOpacity: 1 }}>
                <Tooltip><div className="text-xs"><strong>{p.label}</strong>{p.verified ? ' ✓ verified' : ''}<br />{p.kind.replace('_', ' ')} · {p.district}</div></Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
          <div className="absolute bottom-3 left-3 z-[500] bg-white/95 backdrop-blur rounded-xl border border-slate-200 p-3 space-y-1.5 shadow">
            <Toggle k="districts" label="Districts (participants)" swatch="#d97706" />
            <Toggle k="hotspots" label="Disease / pest hotspots" swatch="#dc2626" />
            <Toggle k="programmes" label="Programmes" swatch="#7c3aed" />
            <Toggle k="stations" label="Weather stations" swatch="#0284c7" />
            <Toggle k="providers" label="Marketplace providers" swatch="#f97316" />
            <div className="text-[10px] text-slate-400 pt-1">{METRICS.find(m => m.id === metric)?.hint}{data?.unplaced ? ` · ${data.unplaced} without a district not shown` : ''}</div>
          </div>
        </div>

        <aside className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 h-fit lg:sticky lg:top-4">
          {!selected ? (
            <>
              <h3 className="font-semibold text-slate-800">Districts</h3>
              <p className="text-xs text-slate-500">Click a circle or a row to drill in.</p>
              <ul className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto text-sm">
                {[...districts].sort((a, b) => (Number(b[metric]) || 0) - (Number(a[metric]) || 0)).map(d => (
                  <li key={d.province + d.district}><button onClick={() => pick(d)} className="w-full text-left py-1.5 flex items-center gap-2 hover:bg-slate-50 rounded px-1">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: colourFor(metric, Number(d[metric]) || 0, max) }} />
                    <span className="flex-1 truncate">{d.district}<span className="text-slate-400"> · {d.province}</span></span>
                    <span className="tabular-nums font-medium">{metric === 'coverageScore' ? `${d[metric]} / 5` : fmt(d[metric])}</span>
                  </button></li>
                ))}
                {!districts.length && !loading && <li className="py-3 text-slate-400 text-xs">No placeable organisations in scope.</li>}
              </ul>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div><h3 className="font-semibold text-slate-900">{selected.district}</h3><div className="text-xs text-slate-500">{selected.province} Province{selected.approximate ? ' · placed at province centroid' : ''}</div></div>
                <button onClick={() => { setSelected(null); setFly([data.centerLat, data.centerLng, province || district ? 8 : 6]); }} className="p-1 rounded hover:bg-slate-100" aria-label="Back to all districts"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[['Organisations', selected.organisations], ['Farms', selected.farms], ['Vendors', selected.vendors], ['Sharing data', selected.consenting], ['Programmes', selected.programmes], ['Participants', selected.participants], ['Support (ZMW)', fmt(selected.supportValue)], ['Reports 90 d', selected.hotspotReports], ['Stations', selected.stations], ['Providers', selected.providers]].map(([l, v]) => (
                  <div key={String(l)} className="bg-slate-50 rounded-lg p-2"><div className="text-[10px] uppercase tracking-wide text-slate-500">{l}</div><div className="font-bold text-slate-900 tabular-nums">{v as any}</div></div>
                ))}
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">By type</div>
                <div className="flex flex-wrap gap-1">{Object.entries(parse(selected.counts)).map(([k, v]) => <span key={k} className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">{TYPE_LABEL[k] ?? k} {v as any}</span>)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Service coverage <span className={`ml-1 px-1.5 rounded-full text-[10px] font-semibold ${selected.coverageScore >= 4 ? 'bg-green-100 text-green-700' : selected.coverageScore >= 2 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{selected.coverageScore} / 5</span></div>
                <div className="text-xs text-slate-600">{selected.gaps.length ? selected.gaps.join(' · ') : 'Fully served'}</div>
              </div>
              {selected.hotspotReports > 0 && <div><div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Hotspot categories</div><div className="text-xs text-slate-600">{Object.entries(parse(selected.hotspotCategories)).map(([k, v]) => `${CAT_LABEL[k] ?? k} ${v}`).join(' · ')}</div></div>}
              {selected.partners.length > 0 && <div><div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Partners active here</div><div className="text-xs text-slate-600">{selected.partners.join(', ')}</div></div>}
              {onOpenDistrict && <button onClick={() => onOpenDistrict(selected.province, selected.district)} className="w-full text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-2">Open {selected.district} dashboards</button>}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
