// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Cross-Module Event Bus
// Synchronous localStorage-backed pub/sub. Modules emit; consumers read+clear.
// ─────────────────────────────────────────────────────────────────────────────
import { v4 as uuidv4 } from 'uuid';

export type BusEventType =
  // Inventory
  | 'inventory:stock_in'
  | 'inventory:stock_out'
  | 'inventory:reserve'
  | 'inventory:unreserve'
  | 'inventory:quarantine'
  | 'inventory:unquarantine'
  // Finance
  | 'finance:cost'
  | 'finance:income'
  // Incubation / hatchery
  | 'incubation:eggs_set'
  | 'incubation:hatch_recorded'
  // Processing
  | 'processing:queue_input'
  // Notifications
  | 'alert:low_stock'
  | 'alert:quality_fail';

export interface BusEvent<T = any> {
  id: string;
  type: BusEventType;
  payload: T;
  timestamp: string;
  consumed: boolean;
  sourceModule: string;
}

const BUS_KEY = 'agronexus_v2_bus';
const MAX_EVENTS = 500; // cap to prevent unbounded growth

function readBus(): BusEvent[] {
  try { return JSON.parse(localStorage.getItem(BUS_KEY) ?? '[]'); }
  catch { return []; }
}
function writeBus(events: BusEvent[]) {
  // Keep only the last MAX_EVENTS (consumed + unconsumed)
  const trimmed = events.slice(-MAX_EVENTS);
  localStorage.setItem(BUS_KEY, JSON.stringify(trimmed));
}

/** Emit an event onto the bus */
export function emit<T = any>(type: BusEventType, payload: T, sourceModule = 'unknown') {
  const events = readBus();
  events.push({ id: uuidv4(), type, payload, timestamp: new Date().toISOString(), consumed: false, sourceModule });
  writeBus(events);
}

/** Consume all unconsumed events of a given type. Marks them consumed atomically. */
export function consume<T = any>(type: BusEventType): T[] {
  const events = readBus();
  const pending = events.filter(e => e.type === type && !e.consumed);
  if (pending.length === 0) return [];
  const pendingIds = new Set(pending.map(e => e.id));
  writeBus(events.map(e => pendingIds.has(e.id) ? { ...e, consumed: true } : e));
  return pending.map(e => e.payload as T);
}

/** Peek at unconsumed events without consuming them */
export function peek<T = any>(type: BusEventType): T[] {
  return readBus().filter(e => e.type === type && !e.consumed).map(e => e.payload as T);
}

/** Count unconsumed events of a type (for badges) */
export function pendingCount(type: BusEventType): number {
  return readBus().filter(e => e.type === type && !e.consumed).length;
}

/** Clear all bus events (dev/reset use only) */
export function clearBus() {
  localStorage.removeItem(BUS_KEY);
}

// ─── Typed payload shapes ──────────────────────────────────────────────────────

export interface StockInPayload {
  materialTypeId: string;
  materialName: string;
  quantity: number;
  unit: string;
  cycleRef?: string;
  stageRef?: string;
  eventRef?: string;
  processingBatchRef?: string;
  date: string;
  costPerUnit?: number;
  qualityStatus?: 'pass' | 'fail' | 'pending';
  notes?: string;
}

export interface StockOutPayload {
  inventoryItemId?: string;
  materialTypeId?: string;
  materialName: string;
  quantity: number;
  unit: string;
  reason: string;
  reference?: string;
  destination?: string;
  cycleRef?: string;
  date: string;
}

export interface ReservePayload {
  inventoryItemId?: string;
  materialTypeId?: string;
  materialName: string;
  quantity: number;
  unit: string;
  salesOrderId: string;
  date: string;
}

export interface CostPayload {
  category: string;
  description: string;
  amount: number;
  date: string;
  cycleRef?: string;
  enterpriseRef?: string;
  reference?: string;
}

export interface IncomePayload {
  description: string;
  amount: number;
  date: string;
  cycleRef?: string;
  reference?: string;
}

export interface EggsSetPayload {
  quantity: number;
  date: string;
  cycleRef: string;
  stageRef: string;
  species?: string;
  breed?: string;
}
