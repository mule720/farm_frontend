/**
 * Live devices for the dashboards.
 *
 * One shared store polls the server every 15 s (only while a dashboard is on screen) for the devices and the newest
 * value of every measure. A dashboard links each of its items (a pond, a poultry house, a cold room...) to a device
 * with `deviceId`; `useLinked` then overlays the real readings on the item. An item with no device keeps the values
 * the farmer typed or the demo values, and says so.
 */
import React, { useEffect, useMemo, useSyncExternalStore } from 'react';
import { gqlRequest } from '@/lib/api';

export interface LiveDevice { id: string; name: string; identifier: string; deviceType: string; status: string; lastSeenAt: string | null; batteryPct: number | null }
interface LiveReading { deviceId: string; metric: string; value: number; unit: string; isAlert: boolean; recordedAt: string }

/** A reading older than this is shown as stale instead of live. */
export const FRESH_MS = 30 * 60 * 1000;
const POLL_MS = 15000;
const Q = `{ devices { id name identifier deviceType status lastSeenAt batteryPct } liveReadings { deviceId metric value unit isAlert recordedAt } }`;

interface Snapshot { devices: LiveDevice[]; readings: Record<string, Record<string, LiveReading>>; ready: boolean; error: string; at: number }
let snap: Snapshot = { devices: [], readings: {}, ready: false, error: '', at: 0 };
const subs = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let inflight = false;

async function refresh() {
  if (inflight) return;
  inflight = true;
  try {
    const d = await gqlRequest<any>(Q);
    const readings: Snapshot['readings'] = {};
    for (const r of d.liveReadings || []) (readings[r.deviceId] ||= {})[r.metric] = r;
    // a device's battery level is available as a measure too (battery_pct)
    for (const dv of d.devices || []) if (dv.batteryPct != null) (readings[dv.id] ||= {}).battery_pct = { deviceId: dv.id, metric: 'battery_pct', value: dv.batteryPct, unit: '%', isAlert: false, recordedAt: dv.lastSeenAt || new Date().toISOString() };
    snap = { devices: d.devices || [], readings, ready: true, error: '', at: Date.now() };
  } catch (e: any) {
    snap = { ...snap, ready: true, error: e?.message || 'Could not reach the server.' };
  } finally {
    inflight = false;
    subs.forEach(f => f());
  }
}

function subscribe(cb: () => void) {
  subs.add(cb);
  if (subs.size === 1) { refresh(); timer = setInterval(refresh, POLL_MS); }
  return () => {
    subs.delete(cb);
    if (subs.size === 0 && timer) { clearInterval(timer); timer = null; }
  };
}

export function useLiveSnapshot(): Snapshot {
  return useSyncExternalStore(subscribe, () => snap, () => snap);
}

export interface LiveInfo {
  deviceId: string;
  deviceName: string;
  lastSeenAt: string | null;
  /** nothing fresh from this device */
  stale: boolean;
  /** the item fields that now hold real values */
  fields: string[];
}
export type WithLive<T> = T & { live?: LiveInfo };

/**
 * Overlay real readings on items that have a `deviceId`.
 * `resolve(item, get)` returns the fields to override; `get(metric, ...fallbacks)` gives the newest fresh value from the
 * item's device (or undefined). `derive` recomputes anything that depends on the new values (status, averages...).
 */
export function useLinked<T extends { deviceId?: string }>(
  items: T[],
  resolve: (item: T, get: (...metrics: string[]) => number | undefined, info: { lastSeenAt: string | null }) => Partial<T>,
  derive?: (item: T) => T,
): WithLive<T>[] {
  const s = useLiveSnapshot();
  return useMemo(() => items.map(item => {
    if (!item.deviceId) { const { live: _stale, ...rest } = item as any; return rest as WithLive<T>; }
    const dev = s.devices.find(d => d.id === item.deviceId);
    const byMetric = s.readings[item.deviceId] || {};
    const now = Date.now();
    const get = (...metrics: string[]) => {
      for (const m of metrics) {
        const r = byMetric[m];
        if (r && now - new Date(r.recordedAt).getTime() <= FRESH_MS) return r.value;
      }
      return undefined;
    };
    const over = resolve(item, get, { lastSeenAt: dev?.lastSeenAt ?? null });
    const fields = Object.keys(over).filter(k => (over as any)[k] !== undefined);
    const clean: any = {};
    fields.forEach(k => { clean[k] = (over as any)[k]; });
    let merged: T = { ...item, ...clean };
    if (fields.length && derive) merged = derive(merged);
    return { ...merged, live: { deviceId: item.deviceId, deviceName: dev?.name || 'device', lastSeenAt: dev?.lastSeenAt ?? null, stale: fields.length === 0, fields } } as WithLive<T>;
  }), [items, s, resolve, derive]);
}

function ago(iso: string | null) {
  if (!iso) return 'never';
  const sec = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} h ago`;
  return `${Math.floor(sec / 86400)} d ago`;
}

/** Small tag for an item's header: LIVE with the device name, or "no recent data". */
export function LiveBadge({ live }: { live?: LiveInfo }) {
  if (!live) return <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-slate-100 text-slate-500" title="Values were typed in or are demo values. Link a device to see real readings.">Manual</span>;
  return live.stale
    ? <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-amber-100 text-amber-800" title={`${live.deviceName} last reported ${ago(live.lastSeenAt)}`}>No recent data · {live.deviceName}</span>
    : <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-green-100 text-green-700" title={`Last reading ${ago(live.lastSeenAt)}`}>● LIVE · {live.deviceName} · {ago(live.lastSeenAt)}</span>;
}

/** Choose which real device feeds this item. */
export function DeviceLink({ value, onChange, className = '' }: { value?: string; onChange: (deviceId: string | undefined) => void; className?: string }) {
  const s = useLiveSnapshot();
  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <span className="text-slate-500">Device:</span>
      <select value={value ?? ''} onChange={e => onChange(e.target.value || undefined)}
        className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white text-slate-700 max-w-[220px]">
        <option value="">Not linked (manual values)</option>
        {s.devices.map(d => <option key={d.id} value={d.id}>{d.name}{d.identifier ? ` (${d.identifier})` : ''}</option>)}
      </select>
      {s.ready && s.devices.length === 0 && <span className="text-slate-400">No devices yet. Add one under Device Gateway.</span>}
    </div>
  );
}

/** For effects that need the page to keep the store alive even when nothing is linked yet. */
export function useKeepLive() { useLiveSnapshot(); }

/** The measures a device has reported (for a "which value feeds this?" picker). */
export function useDeviceMetrics(deviceId?: string): string[] {
  const s = useLiveSnapshot();
  return useMemo(() => (deviceId ? Object.keys(s.readings[deviceId] || {}).sort() : []), [s, deviceId]);
}
