// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Inventory store
// Stock items and their movements, kept on the server (one copy per company)
// instead of in the browser. Harvests, egg and milk collections, purchases and
// processing batches post into it automatically; sales take goods out of it
// on the server when an order is fulfilled.
//
// Automatic postings go through an outbox (localStorage) so they survive a
// closed tab or a dropped connection, and carry a stable key so the server
// never records the same event twice.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useSyncExternalStore } from 'react';
import { gqlRequest } from '@/lib/api';
import { peekEvents, markConsumed, type StockInPayload, type StockOutPayload } from '@/lib/bus';

export type MaterialCategory = 'feed' | 'medicine' | 'seed' | 'fertiliser' | 'chemical' | 'equipment' | 'packaging' | 'produce' | 'processed' | 'other';
export type MovementType = 'in' | 'out' | 'adjustment' | 'transfer';

export interface StockItem {
  id: string;
  name: string;
  sku: string;
  category: MaterialCategory;
  unit: string;
  currentQty: number;
  minStockLevel: number;
  costPerUnit?: number;
  location?: string;
  supplier?: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: MovementType;
  qty: number;
  date: string;
  reference?: string;
  destination?: string;
  unitCost?: number;
  notes?: string;
  source?: string;
  recordedBy?: string;
  createdAt: string;
}

export type ItemInput = Omit<StockItem, 'id' | 'createdAt' | 'currentQty'> & { openingQty?: number };
export interface MovementInput {
  itemId: string;
  type: MovementType;
  qty: number;
  date: string;
  reference?: string;
  destination?: string;
  unitCost?: number;
  notes?: string;
}

export type AutoSource = 'production' | 'processing';
export interface AutoStock {
  sourceRef: string;
  direction: 'in' | 'out';
  name: string;
  qty: number;
  unit?: string;
  date: string;
  costPerUnit?: number;
  reference?: string;
  destination?: string;
  notes?: string;
}

interface StockState {
  orgId: string | null;
  items: StockItem[];
  movements: Record<string, StockMovement[]>;
  status: 'idle' | 'loading' | 'ready' | 'denied' | 'error';
  error: string;
  pending: number;       // automatic postings waiting in the outbox
}

// ─── GraphQL ─────────────────────────────────────────────────────────────────
const ITEM_FIELDS = 'id name sku category unit currentQty minStockLevel costPerUnit location supplier expiryDate notes createdAt';
const MOVE_FIELDS = 'id itemId type qty date reference destination unitCost notes source recordedBy createdAt';
const LIST_Q = `query StockItems { stockItems { ${ITEM_FIELDS} } }`;
const MOVES_Q = `query StockMovements($i: String!) { stockMovements(itemId: $i, limit: 100) { ${MOVE_FIELDS} } }`;
const SAVE_M = `mutation SaveStockItem($i: StockItemInput!) { saveStockItem(input: $i) { item { ${ITEM_FIELDS} } } }`;
const DELETE_M = `mutation DeleteStockItem($id: String!) { deleteStockItem(id: $id) { ok } }`;
const MOVE_M = `mutation RecordStockMovement($i: String!, $t: String!, $q: Float!, $d: Date, $r: String, $dest: String, $c: Float, $n: String) {
  recordStockMovement(itemId: $i, type: $t, qty: $q, date: $d, reference: $r, destination: $dest, unitCost: $c, notes: $n) {
    item { ${ITEM_FIELDS} } movement { ${MOVE_FIELDS} } } }`;
const POST_M = `mutation PostStock($s: String!, $items: [AutoStockInput!]!) { postStock(source: $s, items: $items) { created duplicates unmatched rejected } }`;
const IMPORT_M = `mutation ImportStockData($i: [LegacyItemInput!]!, $m: [LegacyMovementInput!]!) { importStockData(items: $i, movements: $m) { itemsCreated movementsCreated skipped rejected } }`;

const mapItem = (r: any): StockItem => ({
  id: r.id, name: r.name, sku: r.sku ?? '', category: r.category, unit: r.unit, currentQty: Number(r.currentQty),
  minStockLevel: Number(r.minStockLevel ?? 0), costPerUnit: r.costPerUnit ?? undefined, location: r.location || undefined,
  supplier: r.supplier || undefined, expiryDate: r.expiryDate || undefined, notes: r.notes || undefined, createdAt: r.createdAt,
});

const mapMovement = (r: any): StockMovement => ({
  id: r.id, itemId: r.itemId, type: r.type, qty: Number(r.qty), date: r.date, reference: r.reference || undefined,
  destination: r.destination || undefined, unitCost: r.unitCost ?? undefined, notes: r.notes || undefined,
  source: r.source, recordedBy: r.recordedBy || undefined, createdAt: r.createdAt,
});

// Old, browser-only locations (read once to bring an existing stock list across)
const LEGACY_ITEMS = 'agronexus_v2_inventory_items';
const LEGACY_MOVES = 'agronexus_v2_inventory_moves';
const ACCOUNT_KEY = 'agronexus_v2_org_account'; // written by orgStore: which company this browser's data belongs to
const outboxKey = (orgId: string) => `agronexus_v2_stock_outbox:${orgId}`;

// ─── Store ───────────────────────────────────────────────────────────────────
let state: StockState = { orgId: null, items: [], movements: {}, status: 'idle', error: '', pending: 0 };
const listeners = new Set<() => void>();
function set(patch: Partial<StockState>) {
  state = { ...state, ...patch };
  listeners.forEach(l => l());
}
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const getState = () => state;

const isDenied = (e: unknown) => /permission denied|not authenticated/i.test(String((e as any)?.message ?? e));

/** Tell the store which company is signed in. Called by the org store. */
export function setStockAccount(orgId: string | null) {
  if (state.orgId === orgId) return;
  set({ orgId, items: [], movements: {}, status: 'idle', error: '', pending: orgId ? readOutbox(orgId).length : 0 });
  if (orgId) void flushOutbox().then(() => drainLegacyBus());
}

// ─── Outbox ──────────────────────────────────────────────────────────────────
interface OutboxEntry { source: AutoSource; item: AutoStock; tries: number }

function readOutbox(orgId: string): OutboxEntry[] {
  try { return JSON.parse(localStorage.getItem(outboxKey(orgId)) ?? '[]'); } catch { return []; }
}
function writeOutbox(orgId: string, list: OutboxEntry[]) {
  try {
    if (list.length) localStorage.setItem(outboxKey(orgId), JSON.stringify(list));
    else localStorage.removeItem(outboxKey(orgId));
  } catch { /* storage full or blocked — entries stay in memory only */ }
  if (state.orgId === orgId) set({ pending: list.length });
}

const toGql = (i: AutoStock) => ({
  sourceRef: i.sourceRef, direction: i.direction, name: i.name, qty: i.qty, unit: i.unit ?? null, date: i.date,
  costPerUnit: i.costPerUnit ?? null, reference: i.reference ?? null, destination: i.destination ?? null, notes: i.notes ?? null,
});

let flushing: Promise<void> | null = null;

/** Deliver whatever is waiting in the outbox. Safe to call at any time. */
export function flushOutbox(): Promise<void> {
  if (flushing) return flushing;
  const orgId = state.orgId;
  if (!orgId) return Promise.resolve();
  flushing = (async () => {
    let list = readOutbox(orgId);
    if (!list.length) return;
    let delivered = 0;
    for (const source of ['production', 'processing'] as AutoSource[]) {
      const batch = list.filter(e => e.source === source);
      for (let i = 0; i < batch.length; i += 200) {
        const chunk = batch.slice(i, i + 200);
        try {
          await gqlRequest(POST_M, { s: source, items: chunk.map(c => toGql(c.item)) });
          list = list.filter(e => !chunk.includes(e));
          delivered += chunk.length;
        } catch (err) {
          if (isDenied(err)) list = list.filter(e => !chunk.includes(e));      // this user may not post these — retrying never helps
          else list = list.map(e => chunk.includes(e) ? { ...e, tries: e.tries + 1 } : e).filter(e => e.tries < 20);
        }
      }
    }
    writeOutbox(orgId, list);
    if (delivered && state.status === 'ready') await refresh();
  })().finally(() => { flushing = null; });
  return flushing;
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { void flushOutbox(); });
  window.setInterval(() => { if (state.orgId && state.pending > 0) void flushOutbox(); }, 30_000);
}

/** Post stock movements produced by another module. Returns immediately; delivery is retried until it succeeds. */
export function postStock(source: AutoSource, items: AutoStock[]) {
  const orgId = state.orgId;
  if (!orgId || items.length === 0) return;
  const list = readOutbox(orgId);
  const known = new Set(list.map(e => e.item.sourceRef));
  const fresh = items.filter(i => !known.has(i.sourceRef));
  if (fresh.length === 0) return;
  writeOutbox(orgId, [...list, ...fresh.map(item => ({ source, item, tries: 0 }))]);
  void flushOutbox();
}

// ─── Legacy browser data → server ────────────────────────────────────────────

const sourceOf = (module: string): AutoSource => (module === 'processing' ? 'processing' : 'production');

/** Stock events emitted before the stock moved to the server and never picked up by the Inventory page. */
async function drainLegacyBus() {
  const orgId = state.orgId;
  if (!orgId) return;
  const ins = peekEvents<StockInPayload>('inventory:stock_in');
  const outs = peekEvents<StockOutPayload>('inventory:stock_out');
  if (!ins.length && !outs.length) return;
  const by: Record<AutoSource | 'sales', { items: AutoStock[]; ids: string[] }> = {
    production: { items: [], ids: [] }, processing: { items: [], ids: [] }, sales: { items: [], ids: [] },
  };
  ins.forEach(e => {
    const b = by[sourceOf(e.sourceModule)];
    b.ids.push(e.id);
    b.items.push({ sourceRef: `bus:${e.id}`, direction: 'in', name: e.payload.materialName, qty: e.payload.quantity, unit: e.payload.unit,
      date: e.payload.date, costPerUnit: e.payload.costPerUnit, reference: e.payload.cycleRef ?? e.payload.eventRef, notes: 'From production records kept before the move to the server' });
  });
  outs.forEach(e => {
    const b = e.sourceModule === 'sales' ? by.sales : by[sourceOf(e.sourceModule)];
    b.ids.push(e.id);
    b.items.push({ sourceRef: `bus:${e.id}`, direction: 'out', name: e.payload.materialName, qty: e.payload.quantity,
      date: e.payload.date, reference: e.payload.reference, destination: e.payload.destination, notes: e.payload.reason });
  });
  for (const source of Object.keys(by) as (AutoSource | 'sales')[]) {
    const { items, ids } = by[source];
    if (!items.length) continue;
    try {
      await gqlRequest(POST_M, { s: source, items: items.map(toGql) });
      markConsumed(ids);
    } catch (err) {
      if (isDenied(err)) markConsumed(ids);   // not allowed to post them — don't keep trying
    }
  }
}

/**
 * Bring a browser-only stock list across. Runs whenever the old keys are present (the first time after the
 * upgrade, or after an old backup is restored); every record carries a stable id, so repeating it duplicates nothing.
 */
async function importLegacyStock(orgId: string) {
  if (localStorage.getItem(LEGACY_ITEMS) === null && localStorage.getItem(LEGACY_MOVES) === null) return;
  // Only data that provably belongs to this company; never another account's leftovers on a shared computer
  if (localStorage.getItem(ACCOUNT_KEY) !== orgId) return;
  const read = (k: string): any[] => { try { const v = JSON.parse(localStorage.getItem(k) ?? '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
  const items = read(LEGACY_ITEMS), moves = read(LEGACY_MOVES);
  const i = items.filter(x => x?.id && String(x.name ?? '').trim()).map(x => ({
    legacyId: String(x.id), name: String(x.name), sku: x.sku || null, category: x.category || 'other', unit: x.unit || 'kg',
    currentQty: Number(x.currentQty) || 0, minStockLevel: Number(x.minStockLevel) || 0, costPerUnit: x.costPerUnit ?? null,
    location: x.location || null, supplier: x.supplier || null, expiryDate: x.expiryDate ? String(x.expiryDate).slice(0, 10) : null, notes: x.notes || null,
  }));
  const m = moves.filter(x => x?.id && x.itemId && Number(x.qty)).map(x => ({
    legacyId: String(x.id), legacyItemId: String(x.itemId), type: x.type, qty: Number(x.qty), date: x.date ? String(x.date).slice(0, 10) : null,
    reference: x.reference || null, destination: x.destination || null, unitCost: x.unitCost ?? null, notes: x.notes || null,
  }));
  // items first, then their history, so the server can link the two
  for (let k = 0; k < i.length; k += 500) await gqlRequest(IMPORT_M, { i: i.slice(k, k + 500), m: [] });
  for (let k = 0; k < m.length; k += 500) await gqlRequest(IMPORT_M, { i: [], m: m.slice(k, k + 500) });
  try {
    if (items.length) localStorage.setItem(`${LEGACY_ITEMS}:backup`, JSON.stringify(items));
    if (moves.length) localStorage.setItem(`${LEGACY_MOVES}:backup`, JSON.stringify(moves));
    localStorage.removeItem(LEGACY_ITEMS);
    localStorage.removeItem(LEGACY_MOVES);
  } catch { /* ignore */ }
}

// ─── Loading ─────────────────────────────────────────────────────────────────

async function refresh() {
  const orgId = state.orgId;
  if (!orgId) return;
  const data = await gqlRequest<{ stockItems: any[] }>(LIST_Q);
  if (state.orgId !== orgId) return;
  set({ items: data.stockItems.map(mapItem), status: 'ready', error: '' });
}

/** Re-read the stock if it has been loaded (e.g. after the server took goods out for a sale). */
export function reloadStockIfLoaded(): Promise<void> {
  return state.status === 'ready' ? refresh().catch(() => undefined) : Promise.resolve();
}

let loading: Promise<void> | null = null;

/** Load the stock from the server (once per sign-in; pass force to reload). */
export function ensureStockLoaded(force = false): Promise<void> {
  if (!state.orgId) return Promise.resolve();
  if (!force && (state.status === 'ready' || state.status === 'denied')) return Promise.resolve();
  if (loading) return loading;
  const orgId = state.orgId;
  set({ status: 'loading', error: '' });
  loading = (async () => {
    try {
      await flushOutbox();
      try { await importLegacyStock(orgId); } catch (e) { if (!isDenied(e)) throw e; }
      await refresh();
    } catch (e) {
      if (state.orgId !== orgId) return;
      if (isDenied(e)) set({ status: 'denied', items: [], movements: {}, error: '' });
      else set({ status: 'error', error: String((e as any)?.message ?? e) });
    }
  })().finally(() => { loading = null; });
  return loading;
}

// ─── Items and movements ─────────────────────────────────────────────────────

const itemInput = (i: ItemInput, id?: string) => ({
  id, name: i.name.trim(), sku: i.sku || null, category: i.category, unit: i.unit, openingQty: id ? null : (i.openingQty ?? 0),
  minStockLevel: i.minStockLevel ?? 0, costPerUnit: i.costPerUnit ?? null, location: i.location ?? null,
  supplier: i.supplier ?? null, expiryDate: i.expiryDate || null, notes: i.notes ?? null,
});

export async function addItem(i: ItemInput): Promise<StockItem> {
  const r = await gqlRequest<{ saveStockItem: { item: any } }>(SAVE_M, { i: itemInput(i) });
  const item = mapItem(r.saveStockItem.item);
  set({ items: [...state.items, item].sort((a, b) => a.name.localeCompare(b.name)) });
  return item;
}

export async function updateItem(id: string, i: ItemInput): Promise<StockItem> {
  const r = await gqlRequest<{ saveStockItem: { item: any } }>(SAVE_M, { i: itemInput(i, id) });
  const item = mapItem(r.saveStockItem.item);
  set({ items: state.items.map(x => x.id === id ? item : x) });
  return item;
}

export async function deleteItem(id: string): Promise<void> {
  await gqlRequest(DELETE_M, { id });
  const { [id]: _gone, ...rest } = state.movements;
  set({ items: state.items.filter(x => x.id !== id), movements: rest });
}

export async function recordMovement(m: MovementInput): Promise<void> {
  const r = await gqlRequest<{ recordStockMovement: { item: any; movement: any } }>(MOVE_M, {
    i: m.itemId, t: m.type, q: m.qty, d: m.date, r: m.reference ?? null, dest: m.destination ?? null, c: m.unitCost ?? null, n: m.notes ?? null,
  });
  const item = mapItem(r.recordStockMovement.item);
  const mv = mapMovement(r.recordStockMovement.movement);
  set({ items: state.items.map(x => x.id === item.id ? item : x), movements: { ...state.movements, [item.id]: [mv, ...(state.movements[item.id] ?? [])] } });
}

/** Load an item's recent movements (called when its detail is opened). */
export async function loadMovements(itemId: string): Promise<void> {
  const r = await gqlRequest<{ stockMovements: any[] }>(MOVES_Q, { i: itemId });
  set({ movements: { ...state.movements, [itemId]: r.stockMovements.map(mapMovement) } });
}

// ─── React ───────────────────────────────────────────────────────────────────

/** Items, movements and load state; loads the stock on first use. */
export function useStockStore() {
  const s = useSyncExternalStore(subscribe, getState, getState);
  useEffect(() => { void ensureStockLoaded(); }, [s.orgId]);
  return { ...s, reload: () => ensureStockLoaded(true) };
}

/** Just the items — for dashboards, AI and reports. */
export function useStockItems(): StockItem[] {
  return useStockStore().items;
}
