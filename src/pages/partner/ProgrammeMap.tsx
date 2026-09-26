// ─────────────────────────────────────────────────────────────────────────────
// Programme map — where a programme's participants, support and still-eligible
// organisations are, district by district. Also exports DistrictPicker, the
// map-based district selector used by the programme form for targeting.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, AlertTriangle, X, Plus } from 'lucide-react';
import { gqlRequest } from '@/lib/api';

const PROGRAMME_MAP_QUERY = `query PMap($id: ID!) { programmeMap(programmeId: $id) { centerLat centerLng unplacedParticipants unplacedEligible
  districts { province district lat lng approximate targeted participants participantsByType supportEvents supportValue eligible eligibleByType } } }`;
const GAZETTEER_QUERY = `query Gaz { districtGazetteer { province district lat lng } }`;

const TYPE_LABEL: Record<string, string> = { farmer: 'Farms', cooperative: 'Cooperatives', agro_dealer: 'Agro dealers', vet_provider: 'Vets', equipment_hire: 'Equipment hire', agrifood_seller: 'AgriFood sellers', agrisupply_provider: 'AgriSupply', agriservices_provider: 'AgriServices', processor: 'Processors', transport: 'Transport' };
const parse = (v: any): Record<string, number> => (typeof v === 'string' ? JSON.parse(v) : v) ?? {};
const fmt = (n: number) => Number(n ?? 0).toLocaleString();
const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function FlyTo({ target }: { target: [number, number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (target) map.flyTo([target[0], target[1]], target[2], { duration: 0.7 }); }, [target, map]);
  return null;
}

// ─── Programme map tab ───────────────────────────────────────────────────────

interface Props { programmeId: string; programmeName: string; onEnrolFromDistrict?: (district: string) => void }

export default function ProgrammeMap({ programmeId, programmeName, onEnrolFromDistrict }: Props) {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [fly, setFly] = useState<[number, number, number] | null>(null);
  const load = useCallback(async () => {
    setErr('');
    try { const r = await gqlRequest(PROGRAMME_MAP_QUERY, { id: programmeId }); setData(r.programmeMap); } catch (e: any) { setErr(e?.message ?? 'Failed to load the map'); }
  }, [programmeId]);
  useEffect(() => { load(); }, [load]);

  const districts: any[] = data?.districts ?? [];
  const maxP = useMemo(() => Math.max(1, ...districts.map(d => d.participants)), [districts]);
  const maxE = useMemo(() => Math.max(1, ...districts.map(d => d.eligible)), [districts]);
  const totals = useMemo(() => districts.reduce((a, d) => ({ p: a.p + d.participants, e: a.e + d.eligible, s: a.s + d.supportValue }), { p: 0, e: 0, s: 0 }), [districts]);
  const bounds = useMemo<[number, number, number] | null>(() => {
    if (!districts.length) return null;
    const lat = districts.reduce((a, d) => a + d.lat, 0) / districts.length, lng = districts.reduce((a, d) => a + d.lng, 0) / districts.length;
    const spread = Math.max(...districts.map(d => Math.abs(d.lat - lat) + Math.abs(d.lng - lng)));
    return [lat, lng, spread > 4 ? 6 : spread > 1.5 ? 7 : 8];
  }, [districts]);

  if (err) return <div className="flex items-center gap-2 p-3 rounded-xl text-sm border bg-red-50 border-red-200 text-red-700"><AlertTriangle className="w-4 h-4" /> {err}</div>;
  if (!data) return <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading programme map…</div>;
  const pick = (d: any) => { setSelected(d); setFly([d.lat, d.lng, 9]); };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">{programmeName}: <strong>{fmt(totals.p)}</strong> participants in {districts.filter(d => d.participants).length} districts · <strong>{fmt(totals.e)}</strong> eligible organisations not yet enrolled · ZMW {fmt(totals.s)} support delivered.{data.unplacedParticipants ? ` ${data.unplacedParticipants} participant(s) without a district are not drawn.` : ''} Purple = enrolled, hollow amber = eligible, green ring = targeted district.</p>
      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100" style={{ height: 480 }}>
          <MapContainer center={[bounds?.[0] ?? data.centerLat, bounds?.[1] ?? data.centerLng]} zoom={bounds?.[2] ?? 6} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
            <TileLayer attribution={ATTR} url={TILES} />
            <FlyTo target={fly} />
            {districts.filter(d => d.targeted).map(d => (
              <CircleMarker key={'t' + d.province + d.district} center={[d.lat, d.lng]} radius={30} interactive={false} pathOptions={{ color: '#16a34a', weight: 2, fill: true, fillColor: '#16a34a', fillOpacity: 0.06, dashArray: d.approximate ? '4 4' : undefined }} />
            ))}
            {districts.filter(d => d.eligible > 0).map(d => (
              <CircleMarker key={'e' + d.province + d.district} center={[d.lat, d.lng]} radius={8 + 16 * Math.sqrt(d.eligible / maxE)} eventHandlers={{ click: () => pick(d) }} pathOptions={{ color: '#d97706', weight: 2, fill: true, fillColor: '#fbbf24', fillOpacity: 0.15 }}>
                <Tooltip direction="bottom"><span className="text-xs"><strong>{d.eligible}</strong> eligible in {d.district}, not yet enrolled</span></Tooltip>
              </CircleMarker>
            ))}
            {districts.filter(d => d.participants > 0).map(d => (
              <CircleMarker key={'p' + d.province + d.district} center={[d.lat, d.lng]} radius={6 + 16 * Math.sqrt(d.participants / maxP)} eventHandlers={{ click: () => pick(d) }} pathOptions={{ color: selected?.district === d.district ? '#0f172a' : '#fff', weight: selected?.district === d.district ? 3 : 1.5, fillColor: '#7c3aed', fillOpacity: 0.85 }}>
                <Tooltip direction="top"><div className="text-xs"><strong>{d.district}</strong> · {d.province}<br />{d.participants} participants · ZMW {fmt(d.supportValue)} support<br />{d.eligible} eligible not yet enrolled</div></Tooltip>
              </CircleMarker>
            ))}
            {districts.filter(d => d.participants === 0 && d.eligible === 0).map(d => (
              <CircleMarker key={'z' + d.province + d.district} center={[d.lat, d.lng]} radius={4} eventHandlers={{ click: () => pick(d) }} pathOptions={{ color: '#16a34a', weight: 1, fillColor: '#fff', fillOpacity: 1 }}>
                <Tooltip><span className="text-xs">{d.district}: targeted, nobody eligible or enrolled yet</span></Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
        <aside className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 h-fit">
          {!selected ? (
            <>
              <h4 className="font-semibold text-slate-800 text-sm">Districts</h4>
              <ul className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto text-sm">
                {[...districts].sort((a, b) => b.participants - a.participants || b.eligible - a.eligible).map(d => (
                  <li key={d.province + d.district}><button onClick={() => pick(d)} className="w-full text-left py-1.5 px-1 rounded hover:bg-slate-50 flex items-center gap-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${d.participants ? 'bg-violet-600' : d.eligible ? 'bg-amber-400' : 'bg-slate-300'}`} />
                    <span className="flex-1 truncate">{d.district}{d.targeted && <span className="text-green-700 text-[10px] ml-1">target</span>}</span>
                    <span className="tabular-nums text-xs text-slate-600">{d.participants} <span className="text-slate-400">/ {d.eligible} eligible</span></span>
                  </button></li>
                ))}
                {!districts.length && <li className="py-3 text-xs text-slate-400">Nothing to place yet — enrol participants or set target districts.</li>}
              </ul>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div><h4 className="font-semibold text-slate-900">{selected.district}</h4><div className="text-xs text-slate-500">{selected.province} Province{selected.targeted ? ' · targeted' : ''}{selected.approximate ? ' · placed at province centroid' : ''}</div></div>
                <button onClick={() => { setSelected(null); if (bounds) setFly(bounds); }} className="p-1 rounded hover:bg-slate-100" aria-label="Back to all districts"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[['Participants', selected.participants], ['Eligible', selected.eligible], ['Support events', selected.supportEvents], ['Support (ZMW)', fmt(selected.supportValue)]].map(([l, v]) => (
                  <div key={String(l)} className="bg-slate-50 rounded-lg p-2"><div className="text-[10px] uppercase tracking-wide text-slate-500">{l}</div><div className="font-bold text-slate-900 tabular-nums">{v as any}</div></div>
                ))}
              </div>
              {Object.keys(parse(selected.participantsByType)).length > 0 && <div><div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Enrolled by type</div><div className="flex flex-wrap gap-1">{Object.entries(parse(selected.participantsByType)).map(([k, v]) => <span key={k} className="text-[11px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-800 border border-violet-200">{TYPE_LABEL[k] ?? k} {v}</span>)}</div></div>}
              {Object.keys(parse(selected.eligibleByType)).length > 0 && <div><div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Eligible, not yet enrolled</div><div className="flex flex-wrap gap-1">{Object.entries(parse(selected.eligibleByType)).map(([k, v]) => <span key={k} className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">{TYPE_LABEL[k] ?? k} {v}</span>)}</div></div>}
              {onEnrolFromDistrict && selected.eligible > 0 && <button onClick={() => onEnrolFromDistrict(selected.district)} className="w-full inline-flex items-center justify-center gap-1 text-sm font-medium bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-2"><Plus className="w-4 h-4" /> Enrol from {selected.district}</button>}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

// ─── Map-based district picker (programme form) ──────────────────────────────

export function DistrictPicker({ value, onChange, onClose }: { value: string[]; onChange: (districts: string[]) => void; onClose: () => void }) {
  const [gaz, setGaz] = useState<any[]>([]);
  const [province, setProvince] = useState('');
  useEffect(() => { gqlRequest(GAZETTEER_QUERY).then((r: any) => setGaz(r.districtGazetteer)).catch(() => {}); }, []);
  const provinces = useMemo(() => [...new Set(gaz.map(g => g.province))].sort(), [gaz]);
  const sel = new Set(value.map(v => v.toLowerCase()));
  const toggle = (d: string) => onChange(sel.has(d.toLowerCase()) ? value.filter(v => v.toLowerCase() !== d.toLowerCase()) : [...value, d]);
  const shown = gaz.filter(g => !province || g.province === province);
  return (
    <div className="md:col-span-2 rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs">
        <span className="font-medium text-slate-700">Pick target districts on the map</span>
        <select value={province} onChange={e => setProvince(e.target.value)} className="border border-slate-300 rounded px-1.5 py-1 bg-white"><option value="">All provinces</option>{provinces.map(p => <option key={p}>{p}</option>)}</select>
        <span className="text-slate-500">{value.length ? `${value.length} selected: ${value.join(', ')}` : 'Click a district to select it; click again to remove.'}</span>
        <div className="flex-1" />
        {value.length > 0 && <button type="button" onClick={() => onChange([])} className="text-slate-500 hover:text-slate-800">Clear</button>}
        <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800" aria-label="Close map picker"><X className="w-4 h-4" /></button>
      </div>
      <div style={{ height: 340 }}>
        <MapContainer center={[-13.45, 27.85]} zoom={6} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution={ATTR} url={TILES} />
          {shown.map(g => {
            const on = sel.has(g.district.toLowerCase());
            return (
              <CircleMarker key={g.province + g.district} center={[g.lat, g.lng]} radius={on ? 9 : 5} eventHandlers={{ click: () => toggle(g.district) }}
                pathOptions={{ color: on ? '#065f46' : '#64748b', weight: on ? 2 : 1, fillColor: on ? '#10b981' : '#cbd5e1', fillOpacity: on ? 0.95 : 0.7 }}>
                <Tooltip direction="top"><span className="text-xs"><strong>{g.district}</strong> · {g.province}{on ? ' ✓' : ''}</span></Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
