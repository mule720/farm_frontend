// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Sales store
// Customers, orders and payments, kept on the server (one copy per company)
// instead of in the browser. The server numbers orders, works out totals,
// enforces the order flow, and posts income to the ledger when an order is
// fulfilled; this store just asks it to and shows the result.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useSyncExternalStore } from 'react';
import { gqlRequest } from '@/lib/api';
import { reloadFinanceIfLoaded } from '@/lib/financeStore';
import { reloadStockIfLoaded } from '@/lib/inventoryStore';

export type OrderStatus = 'draft' | 'confirmed' | 'fulfilled' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';
export type CustomerType = 'individual' | 'business' | 'wholesale' | 'export';

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface OrderLine { id: string; description: string; qty: number; unit: string; unitPrice: number }
export interface Payment { id: string; amount: number; paidOn: string; note?: string; recordedBy?: string }

export interface SaleOrder {
  id: string;
  orderNumber: string;
  customerId: string;          // '' when the customer has since been deleted
  customerName: string;
  date: string;
  dueDate?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  lines: OrderLine[];
  subtotal: number;
  taxPct?: number;
  discountAmt?: number;
  total: number;
  amountPaid: number;
  cycleRef?: string;
  notes?: string;
  createdAt: string;
  payments: Payment[];
}

export type CustomerInput = Omit<Customer, 'id' | 'createdAt'>;
export interface NewOrder {
  customerId?: string;
  newCustomerName?: string;
  date: string;
  dueDate?: string;
  lines: OrderLine[];
  taxPct?: number;
  discountAmt?: number;
  cycleRef?: string;
  notes?: string;
}

interface SalesState {
  orgId: string | null;
  customers: Customer[];
  orders: SaleOrder[];
  status: 'idle' | 'loading' | 'ready' | 'denied' | 'error';
  error: string;
}

// ─── GraphQL ─────────────────────────────────────────────────────────────────
const CUSTOMER_FIELDS = 'id name type phone email address notes createdAt';
const ORDER_FIELDS = `id orderNumber customerId customerName date dueDate status paymentStatus lines subtotal taxPct discountAmt total amountPaid cycleRef notes createdAt payments { id amount paidOn note recordedBy }`;
const LOAD_Q = `query SalesData { saleCustomers { ${CUSTOMER_FIELDS} } saleOrders { ${ORDER_FIELDS} } }`;
const CUSTOMERS_Q = `query SaleCustomers { saleCustomers { ${CUSTOMER_FIELDS} } }`;
const SAVE_CUSTOMER_M = `mutation SaveSaleCustomer($i: SaleCustomerInput!) { saveSaleCustomer(input: $i) { customer { ${CUSTOMER_FIELDS} } } }`;
const DELETE_CUSTOMER_M = `mutation DeleteSaleCustomer($id: String!) { deleteSaleCustomer(id: $id) { ok } }`;
const CREATE_ORDER_M = `mutation CreateSaleOrder($i: SaleOrderInput!) { createSaleOrder(input: $i) { order { ${ORDER_FIELDS} } } }`;
const UPDATE_ORDER_M = `mutation UpdateSaleOrder($id: String!, $status: String, $notes: String) { updateSaleOrder(id: $id, status: $status, notes: $notes) { order { ${ORDER_FIELDS} } } }`;
const PAY_M = `mutation RecordSalePayment($o: String!, $a: Float!, $note: String) { recordSalePayment(orderId: $o, amount: $a, note: $note) { order { ${ORDER_FIELDS} } } }`;
const IMPORT_M = `mutation ImportSalesData($c: [LegacyCustomerInput!]!, $o: [LegacyOrderInput!]!) { importSalesData(customers: $c, orders: $o) { customersCreated ordersCreated skipped rejected } }`;

const parseLines = (raw: unknown): OrderLine[] => {
  try { const v = typeof raw === 'string' ? JSON.parse(raw) : raw; return Array.isArray(v) ? v : []; } catch { return []; }
};

const mapCustomer = (r: any): Customer => ({
  id: r.id, name: r.name, type: r.type, phone: r.phone || undefined, email: r.email || undefined,
  address: r.address || undefined, notes: r.notes || undefined, createdAt: r.createdAt,
});

const mapOrder = (r: any): SaleOrder => ({
  id: r.id, orderNumber: r.orderNumber, customerId: r.customerId ?? '', customerName: r.customerName,
  date: r.date, dueDate: r.dueDate || undefined, status: r.status, paymentStatus: r.paymentStatus,
  lines: parseLines(r.lines), subtotal: Number(r.subtotal), taxPct: r.taxPct ?? undefined,
  discountAmt: r.discountAmt ? Number(r.discountAmt) : undefined, total: Number(r.total), amountPaid: Number(r.amountPaid),
  cycleRef: r.cycleRef || undefined, notes: r.notes || undefined, createdAt: r.createdAt,
  payments: (r.payments ?? []).map((p: any) => ({ id: p.id, amount: Number(p.amount), paidOn: p.paidOn, note: p.note || undefined, recordedBy: p.recordedBy || undefined })),
});

// Old, browser-only locations (read once to bring an existing list across)
const LEGACY_CUSTOMERS = 'agronexus_v2_customers';
const LEGACY_ORDERS = 'agronexus_v2_orders';
const ACCOUNT_KEY = 'agronexus_v2_org_account'; // written by orgStore: which company this browser's data belongs to

// ─── Store ───────────────────────────────────────────────────────────────────
let state: SalesState = { orgId: null, customers: [], orders: [], status: 'idle', error: '' };
const listeners = new Set<() => void>();
function set(patch: Partial<SalesState>) {
  state = { ...state, ...patch };
  listeners.forEach(l => l());
}
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const getState = () => state;

const isDenied = (e: unknown) => /permission denied|not authenticated/i.test(String((e as any)?.message ?? e));

/** Tell the store which company is signed in. Called by the org store. */
export function setSalesAccount(orgId: string | null) {
  if (state.orgId === orgId) return;
  set({ orgId, customers: [], orders: [], status: 'idle', error: '' });
}

/** Bring a browser-only customer and order list across. Repeats are harmless (the server skips what it has). */
async function importLegacySales(orgId: string) {
  if (localStorage.getItem(LEGACY_CUSTOMERS) === null && localStorage.getItem(LEGACY_ORDERS) === null) return;
  // Only data that provably belongs to this company; never another account's leftovers on a shared computer
  if (localStorage.getItem(ACCOUNT_KEY) !== orgId) return;
  const read = (k: string): any[] => { try { const v = JSON.parse(localStorage.getItem(k) ?? '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
  const customers = read(LEGACY_CUSTOMERS), orders = read(LEGACY_ORDERS);
  const c = customers.filter(x => x?.id && String(x.name ?? '').trim()).map(x => ({
    legacyId: String(x.id), name: String(x.name), type: x.type || 'individual',
    phone: x.phone || null, email: x.email || null, address: x.address || null, notes: x.notes || null,
  }));
  const o = orders.filter(x => x?.id && x.date && Array.isArray(x.lines) && x.lines.length).map(x => ({
    legacyId: String(x.id), orderNumber: x.orderNumber || null, legacyCustomerId: x.customerId || null, customerName: x.customerName || null,
    date: String(x.date).slice(0, 10), dueDate: x.dueDate ? String(x.dueDate).slice(0, 10) : null,
    status: x.status || 'draft', taxPct: x.taxPct ?? null, discountAmt: x.discountAmt ?? null, amountPaid: x.amountPaid ?? 0,
    cycleRef: x.cycleRef || null, notes: x.notes || null,
    lines: x.lines.map((l: any) => ({ id: l.id || null, description: String(l.description ?? ''), qty: Number(l.qty) || 0, unit: l.unit || '', unitPrice: Number(l.unitPrice) || 0 })),
  }));
  for (let i = 0; i < Math.max(c.length, o.length); i += 500) {
    await gqlRequest(IMPORT_M, { c: c.slice(i, i + 500), o: o.slice(i, i + 500) });
  }
  try {
    if (customers.length) localStorage.setItem(`${LEGACY_CUSTOMERS}:backup`, JSON.stringify(customers));
    if (orders.length) localStorage.setItem(`${LEGACY_ORDERS}:backup`, JSON.stringify(orders));
    localStorage.removeItem(LEGACY_CUSTOMERS);
    localStorage.removeItem(LEGACY_ORDERS);
  } catch { /* ignore */ }
}

async function refresh() {
  const orgId = state.orgId;
  if (!orgId) return;
  const data = await gqlRequest<{ saleCustomers: any[]; saleOrders: any[] }>(LOAD_Q);
  if (state.orgId !== orgId) return;
  set({ customers: data.saleCustomers.map(mapCustomer), orders: data.saleOrders.map(mapOrder), status: 'ready', error: '' });
}

let loading: Promise<void> | null = null;

/** Load customers and orders from the server (once per sign-in; pass force to reload). */
export function ensureSalesLoaded(force = false): Promise<void> {
  if (!state.orgId) return Promise.resolve();
  if (!force && (state.status === 'ready' || state.status === 'denied')) return Promise.resolve();
  if (loading) return loading;
  const orgId = state.orgId;
  set({ status: 'loading', error: '' });
  loading = (async () => {
    try {
      try { await importLegacySales(orgId); } catch (e) { if (!isDenied(e)) throw e; }
      await refresh();
    } catch (e) {
      if (state.orgId !== orgId) return;
      if (isDenied(e)) set({ status: 'denied', customers: [], orders: [], error: '' });
      else set({ status: 'error', error: String((e as any)?.message ?? e) });
    }
  })().finally(() => { loading = null; });
  return loading;
}

// ─── Customers ───────────────────────────────────────────────────────────────

const customerInput = (c: CustomerInput, id?: string) => ({
  id, name: c.name.trim(), type: c.type, phone: c.phone ?? null, email: c.email ?? null, address: c.address ?? null, notes: c.notes ?? null,
});

export async function saveCustomer(c: CustomerInput, id?: string): Promise<Customer> {
  const r = await gqlRequest<{ saveSaleCustomer: { customer: any } }>(SAVE_CUSTOMER_M, { i: customerInput(c, id) });
  const row = mapCustomer(r.saveSaleCustomer.customer);
  set({
    customers: id ? state.customers.map(x => x.id === id ? row : x) : [...state.customers, row].sort((a, b) => a.name.localeCompare(b.name)),
    // the server renames the customer on their orders too
    orders: id ? state.orders.map(o => o.customerId === id ? { ...o, customerName: row.name } : o) : state.orders,
  });
  return row;
}

export async function deleteCustomer(id: string): Promise<void> {
  await gqlRequest(DELETE_CUSTOMER_M, { id });
  // their orders stay, with the name kept on them
  set({ customers: state.customers.filter(c => c.id !== id), orders: state.orders.map(o => o.customerId === id ? { ...o, customerId: '' } : o) });
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function createOrder(o: NewOrder): Promise<SaleOrder> {
  const r = await gqlRequest<{ createSaleOrder: { order: any } }>(CREATE_ORDER_M, {
    i: {
      customerId: o.customerId || null, newCustomerName: o.newCustomerName?.trim() || null, date: o.date, dueDate: o.dueDate || null,
      lines: o.lines.map(l => ({ id: l.id, description: l.description, qty: l.qty, unit: l.unit, unitPrice: l.unitPrice })),
      taxPct: o.taxPct ?? null, discountAmt: o.discountAmt ?? null, cycleRef: o.cycleRef ?? null, notes: o.notes ?? null,
    },
  });
  const order = mapOrder(r.createSaleOrder.order);
  set({ orders: [order, ...state.orders] });
  if (o.newCustomerName?.trim()) {                       // the server created a customer; pick it up
    try { set({ customers: (await gqlRequest<{ saleCustomers: any[] }>(CUSTOMERS_Q)).saleCustomers.map(mapCustomer) }); } catch { /* shown on next load */ }
  }
  return order;
}

export async function updateOrder(id: string, patch: { status?: OrderStatus; notes?: string }): Promise<SaleOrder> {
  const before = state.orders.find(o => o.id === id);
  const r = await gqlRequest<{ updateSaleOrder: { order: any } }>(UPDATE_ORDER_M, { id, status: patch.status ?? null, notes: patch.notes ?? null });
  const order = mapOrder(r.updateSaleOrder.order);
  set({ orders: state.orders.map(o => o.id === id ? order : o) });
  if (before && before.status !== 'fulfilled' && order.status === 'fulfilled') {
    void reloadFinanceIfLoaded();                       // the server just posted the income…
    void reloadStockIfLoaded();                         // …and took the goods out of stock
  }
  return order;
}

export async function recordPayment(id: string, amount: number, note?: string): Promise<SaleOrder> {
  const r = await gqlRequest<{ recordSalePayment: { order: any } }>(PAY_M, { o: id, a: amount, note: note ?? null });
  const order = mapOrder(r.recordSalePayment.order);
  set({ orders: state.orders.map(o => o.id === id ? order : o) });
  return order;
}

// ─── React ───────────────────────────────────────────────────────────────────

/** Customers, orders and load state; loads them on first use. */
export function useSalesStore() {
  const s = useSyncExternalStore(subscribe, getState, getState);
  useEffect(() => { void ensureSalesLoaded(); }, [s.orgId]);
  return { ...s, reload: () => ensureSalesLoaded(true) };
}

/** Just the orders — for dashboards, AI and reports. */
export function useOrders(): SaleOrder[] {
  return useSalesStore().orders;
}
