// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Finance store
// The farm's income and expense ledger, kept on the server (one copy per
// company) instead of in the browser. Everything that needs the ledger —
// the Finance page, dashboards, AI and reports — reads it from here, and
// production, sales and processing post into it automatically.
//
// Automatic postings go through an outbox (localStorage) so they survive a
// closed tab or a dropped connection, and carry a stable key so the server
// never records the same event twice.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useSyncExternalStore } from 'react';
import { gqlRequest } from '@/lib/api';
import { peekEvents, markConsumed, type CostPayload, type IncomePayload } from '@/lib/bus';

export type TxType = 'income' | 'expense';
export type TxCategory =
  | 'feed' | 'medicine' | 'seed' | 'fertiliser' | 'labour' | 'equipment' | 'transport'
  | 'utilities' | 'marketing' | 'repairs' | 'other_cost'
  | 'sale_income' | 'grant' | 'other_income';

export interface Transaction {
  id: string;
  type: TxType;
  category: TxCategory;
  description: string;
  amount: number;
  date: string;
  cycleRef?: string;
  reference?: string;
  notes?: string;
  source?: string;
  createdAt: string;
}

export type AutoSource = 'production' | 'sales' | 'processing';
export interface AutoItem {
  sourceRef: string;
  type: TxType;
  category: TxCategory;
  description: string;
  amount: number;
  date: string;
  cycleRef?: string;
  reference?: string;
  notes?: string;
}

interface FinanceState {
  orgId: string | null;
  transactions: Transaction[];
  status: 'idle' | 'loading' | 'ready' | 'denied' | 'error';
  error: string;
  pending: number;       // automatic entries waiting in the outbox
}

// ─── GraphQL ─────────────────────────────────────────────────────────────────
const FIELDS = 'id type category description amount date cycleRef reference notes source createdAt';
const LIST_Q = `query FarmTransactions { farmTransactions { ${FIELDS} } }`;
const SAVE_M = `mutation SaveFarmTransaction($i: FarmTransactionInput!) { saveFarmTransaction(input: $i) { transaction { ${FIELDS} } } }`;
const DEL_M = `mutation DeleteFarmTransaction($id: String!) { deleteFarmTransaction(id: $id) { ok } }`;
const POST_M = `mutation PostFarmTransactions($s: String!, $items: [AutoTransactionInput!]!) { postFarmTransactions(source: $s, items: $items) { created duplicates rejected } }`;

const mapRow = (r: any): Transaction => ({
  id: r.id, type: r.type, category: r.category, description: r.description, amount: Number(r.amount),
  date: r.date, cycleRef: r.cycleRef || undefined, reference: r.reference || undefined, notes: r.notes || undefined,
  source: r.source, createdAt: r.createdAt,
});

// Old, browser-only locations (read once to bring an existing ledger across)
const LEGACY_TX_KEY = 'agronexus_v2_transactions';
const ACCOUNT_KEY = 'agronexus_v2_org_account'; // written by orgStore: which company this browser's data belongs to
const outboxKey = (orgId: string) => `agronexus_v2_finance_outbox:${orgId}`;

// ─── Store ───────────────────────────────────────────────────────────────────
let state: FinanceState = { orgId: null, transactions: [], status: 'idle', error: '', pending: 0 };
const listeners = new Set<() => void>();
function set(patch: Partial<FinanceState>) {
  state = { ...state, ...patch };
  listeners.forEach(l => l());
}
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const getState = () => state;

const isDenied = (e: unknown) => /permission denied|not authenticated/i.test(String((e as any)?.message ?? e));

/** Tell the store which company is signed in. Called by the org store. */
export function setFinanceAccount(orgId: string | null) {
  if (state.orgId === orgId) return;
  set({ orgId, transactions: [], status: 'idle', error: '', pending: orgId ? readOutbox(orgId).length : 0 });
  if (orgId) {
    // Entries posted by this browser but never delivered, and bus events left from before the server ledger
    void flushOutbox().then(() => drainLegacyBus());
  }
}

// ─── Outbox ──────────────────────────────────────────────────────────────────
interface OutboxEntry { source: AutoSource; item: AutoItem; tries: number }

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
    for (const source of ['production', 'sales', 'processing'] as AutoSource[]) {
      const batch = list.filter(e => e.source === source);
      for (let i = 0; i < batch.length; i += 200) {
        const chunk = batch.slice(i, i + 200);
        try {
          await gqlRequest(POST_M, { s: source, items: chunk.map(c => c.item) });
          list = list.filter(e => !chunk.includes(e));
          delivered += chunk.length;
        } catch (err) {
          if (isDenied(err)) {            // this user may not post these — retrying will never help
            list = list.filter(e => !chunk.includes(e));
          } else {                        // offline or server hiccup — keep, try again later
            list = list.map(e => chunk.includes(e) ? { ...e, tries: e.tries + 1 } : e).filter(e => e.tries < 20);
          }
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

/** Post entries produced by another module. Returns immediately; delivery is retried until it succeeds. */
export function postFinance(source: AutoSource, items: AutoItem[]) {
  const orgId = state.orgId;
  if (!orgId || items.length === 0) return;
  const list = readOutbox(orgId);
  const known = new Set(list.map(e => e.item.sourceRef));
  const fresh = items.filter(i => !known.has(i.sourceRef));
  if (fresh.length === 0) return;
  writeOutbox(orgId, [...list, ...fresh.map(item => ({ source, item, tries: 0 }))]);
  // Show them straight away if the ledger is on screen; the server copy replaces these
  if (state.status === 'ready') {
    const now = new Date().toISOString();
    set({
      transactions: [
        ...fresh.map(i => ({ id: `pending:${i.sourceRef}`, type: i.type, category: i.category, description: i.description, amount: i.amount, date: i.date, cycleRef: i.cycleRef, reference: i.reference, notes: i.notes, source, createdAt: now })),
        ...state.transactions,
      ],
    });
  }
  void flushOutbox();
}

// ─── Legacy browser data → server ────────────────────────────────────────────

export function inferCostCategory(category: string): TxCategory {
  const c = (category ?? '').toLowerCase();
  if (/feed|fodder|silage/.test(c)) return 'feed';
  if (/medicine|vet|vaccination|treatment/.test(c)) return 'medicine';
  if (/seed|seedling/.test(c)) return 'seed';
  if (/fertiliser|fertilizer/.test(c)) return 'fertiliser';
  if (/labour|wage|salary/.test(c)) return 'labour';
  if (/equipment|machinery/.test(c)) return 'equipment';
  if (/transport|delivery/.test(c)) return 'transport';
  if (/utility|electric|water|fuel/.test(c)) return 'utilities';
  if (/repair|maintenance/.test(c)) return 'repairs';
  return 'other_cost';
}

const sourceOf = (module: string): AutoSource =>
  module === 'sales' ? 'sales' : module === 'processing' ? 'processing' : 'production';

/** Finance events emitted before the ledger moved to the server and never picked up by the Finance page. */
async function drainLegacyBus() {
  const orgId = state.orgId;
  if (!orgId) return;
  const costs = peekEvents<CostPayload>('finance:cost');
  const incomes = peekEvents<IncomePayload>('finance:income');
  if (!costs.length && !incomes.length) return;
  const bySource: Record<AutoSource, { items: AutoItem[]; ids: string[] }> = {
    production: { items: [], ids: [] }, sales: { items: [], ids: [] }, processing: { items: [], ids: [] },
  };
  costs.forEach(e => {
    const b = bySource[sourceOf(e.sourceModule)];
    b.ids.push(e.id);
    b.items.push({ sourceRef: `bus:${e.id}`, type: 'expense', category: inferCostCategory(e.payload.category), description: e.payload.description,
      amount: e.payload.amount, date: e.payload.date, cycleRef: e.payload.cycleRef, reference: e.payload.reference, notes: 'Auto-recorded from production engine' });
  });
  incomes.forEach(e => {
    const b = bySource[sourceOf(e.sourceModule)];
    b.ids.push(e.id);
    b.items.push({ sourceRef: `bus:${e.id}`, type: 'income', category: 'sale_income', description: e.payload.description,
      amount: e.payload.amount, date: e.payload.date, cycleRef: e.payload.cycleRef, reference: e.payload.reference, notes: 'Auto-recorded from production engine' });
  });
  for (const source of Object.keys(bySource) as AutoSource[]) {
    const { items, ids } = bySource[source];
    if (!items.length) continue;
    try {
      await gqlRequest(POST_M, { s: source, items });
      markConsumed(ids);
    } catch (err) {
      if (isDenied(err)) markConsumed(ids);   // not allowed to post them — don't keep trying
    }
  }
}

/**
 * Bring a browser-only ledger across to the company account. Runs whenever the old key is present
 * (the first time after the upgrade, or after an old backup is restored); every entry carries a
 * stable key, so repeating it never duplicates anything.
 */
async function importLegacyLedger(orgId: string) {
  if (localStorage.getItem(LEGACY_TX_KEY) === null) return;
  // Only data that provably belongs to this company; never another account's leftovers on a shared computer
  if (localStorage.getItem(ACCOUNT_KEY) !== orgId) return;
  let rows: any[] = [];
  try { rows = JSON.parse(localStorage.getItem(LEGACY_TX_KEY) ?? '[]'); } catch { rows = []; }
  const items: AutoItem[] = rows
    .filter(r => r && r.id && (r.type === 'income' || r.type === 'expense') && Number(r.amount) > 0 && r.description && r.date)
    .map(r => ({
      sourceRef: `local:${r.id}`, type: r.type, category: r.category, description: String(r.description), amount: Number(r.amount),
      date: String(r.date).slice(0, 10), cycleRef: r.cycleRef || undefined, reference: r.reference || undefined, notes: r.notes || undefined,
    }));
  for (let i = 0; i < items.length; i += 500) {
    await gqlRequest(POST_M, { s: 'import', items: items.slice(i, i + 500) });
  }
  try {
    if (rows.length) localStorage.setItem(`${LEGACY_TX_KEY}:backup`, JSON.stringify(rows));
    localStorage.removeItem(LEGACY_TX_KEY);
  } catch { /* ignore */ }
}

// ─── Loading ─────────────────────────────────────────────────────────────────

async function refresh() {
  const orgId = state.orgId;
  if (!orgId) return;
  const data = await gqlRequest<{ farmTransactions: any[] }>(LIST_Q);
  if (state.orgId !== orgId) return;
  const sent = new Set(readOutbox(orgId).map(e => `pending:${e.item.sourceRef}`));
  const waiting = state.transactions.filter(t => sent.has(t.id));
  set({ transactions: [...waiting, ...data.farmTransactions.map(mapRow)], status: 'ready', error: '' });
}

let loading: Promise<void> | null = null;

/** Load the ledger from the server (once per sign-in; call reload() to force). */
export function ensureFinanceLoaded(force = false): Promise<void> {
  if (!state.orgId) return Promise.resolve();
  if (!force && (state.status === 'ready' || state.status === 'denied')) return Promise.resolve();
  if (loading) return loading;
  const orgId = state.orgId;
  set({ status: 'loading', error: '' });
  loading = (async () => {
    try {
      await flushOutbox();
      try { await importLegacyLedger(orgId); } catch (e) { if (!isDenied(e)) throw e; }
      await refresh();
    } catch (e) {
      if (state.orgId !== orgId) return;
      if (isDenied(e)) set({ status: 'denied', transactions: [], error: '' });
      else set({ status: 'error', error: String((e as any)?.message ?? e) });
    }
  })().finally(() => { loading = null; });
  return loading;
}

// ─── Manual entries ──────────────────────────────────────────────────────────

export type TxInput = Omit<Transaction, 'id' | 'createdAt' | 'source'>;
const toInput = (t: TxInput, id?: string) => ({
  id, type: t.type, category: t.category, description: t.description.trim(), amount: t.amount, date: t.date,
  cycleRef: t.cycleRef ?? null, reference: t.reference ?? null, notes: t.notes ?? null,
});

export async function addTransaction(tx: TxInput): Promise<Transaction> {
  const r = await gqlRequest<{ saveFarmTransaction: { transaction: any } }>(SAVE_M, { i: toInput(tx) });
  const row = mapRow(r.saveFarmTransaction.transaction);
  set({ transactions: [row, ...state.transactions] });
  return row;
}

export async function updateTransaction(id: string, tx: TxInput): Promise<void> {
  const r = await gqlRequest<{ saveFarmTransaction: { transaction: any } }>(SAVE_M, { i: toInput(tx, id) });
  const row = mapRow(r.saveFarmTransaction.transaction);
  set({ transactions: state.transactions.map(t => t.id === id ? row : t) });
}

export async function deleteTransaction(id: string): Promise<void> {
  if (!id.startsWith('pending:')) await gqlRequest(DEL_M, { id });
  set({ transactions: state.transactions.filter(t => t.id !== id) });
}

// ─── React ───────────────────────────────────────────────────────────────────

/** The ledger and its load state; loads it on first use. */
export function useFinanceStore() {
  const s = useSyncExternalStore(subscribe, getState, getState);
  useEffect(() => { void ensureFinanceLoaded(); }, [s.orgId]);
  return { ...s, reload: () => ensureFinanceLoaded(true) };
}

/** Just the entries — for dashboards, AI and reports that only read the ledger. */
export function useTransactions(): Transaction[] {
  return useFinanceStore().transactions;
}
