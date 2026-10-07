// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Organisation store (React Context + localStorage)
// Holds the org profile, enterprise configs, and production data
// ─────────────────────────────────────────────────────────────────────────────
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  OrgProfile, EnterpriseConfig, ProductionCycle, ProductionUnit,
  DailyRecord, ProductionEvent, EditRequest, ProductionTemplate,
} from '@/lib/types';
import { getTemplate, setCustomTemplates } from '@/lib/templates';
import { emit, type EggsSetPayload } from '@/lib/bus';
import { postStock, setStockAccount } from '@/lib/inventoryStore';
import { gqlRequest } from '@/lib/api';
import { postFinance, setFinanceAccount, inferCostCategory } from '@/lib/financeStore';
import { setSalesAccount } from '@/lib/salesStore';
import { useAuth } from '@/contexts/AuthContext';

// ─── State shape ──────────────────────────────────────────────────────────────

interface OrgState {
  org: OrgProfile | null;
  cycles: ProductionCycle[];
  editRequests: EditRequest[];
  loading: boolean;

  // Org setup
  createOrg: (name: string, country: string, currency: string, businessType?: string) => void;
  updateOrg: (patch: Partial<OrgProfile>) => void;
  completeOnboarding: () => void;
  /** Erase the whole company workspace (shared copy + this browser) and restart onboarding. */
  resetWorkspace: () => Promise<void>;

  // Saved templates (the farmer's own standards) + care-guide ticks
  /** Save (create or update) a customised template and optionally switch an enterprise to it. */
  saveCustomTemplate: (template: ProductionTemplate, useForEnterpriseId?: string) => void;
  deleteCustomTemplate: (id: string) => void;
  setCareDone: (cycleId: string, key: string, done: boolean, by?: string) => void;

  // Enterprises
  addEnterprise: (config: Omit<EnterpriseConfig, 'id' | 'createdAt'>) => EnterpriseConfig;
  updateEnterprise: (id: string, patch: Partial<EnterpriseConfig>) => void;
  removeEnterprise: (id: string) => void;

  // Production cycles
  addCycle: (cycle: Omit<ProductionCycle, 'id' | 'createdAt' | 'cycleNumber' | 'stages'>) => ProductionCycle;
  updateCycle: (id: string, patch: Partial<ProductionCycle>) => void;
  getCyclesForEnterprise: (enterpriseId: string) => ProductionCycle[];
  getActiveCycle: (enterpriseId: string) => ProductionCycle | undefined;

  // Stage & record operations
  addDailyRecord: (cycleId: string, stageId: string, record: Omit<DailyRecord, 'id'>) => void;
  addEvent: (cycleId: string, stageId: string, event: Omit<ProductionEvent, 'id'>) => void;
  advanceStage: (cycleId: string) => void;
  completeCycle: (cycleId: string, endDate: string, notes?: string) => void;
  deleteCycle: (cycleId: string) => void;

  // Edit & delete operations (apply immediately or queue for approval)
  updateDailyRecord: (cycleId: string, stageId: string, recordId: string, patch: Partial<DailyRecord>) => void;
  deleteDailyRecord: (cycleId: string, stageId: string, recordId: string) => void;
  updateEvent: (cycleId: string, stageId: string, eventId: string, patch: Partial<ProductionEvent>) => void;
  deleteEvent: (cycleId: string, stageId: string, eventId: string) => void;

  // Edit approval workflow
  submitEdit: (req: Omit<EditRequest, 'id' | 'status' | 'requestedAt'>) => void;
  approveEdit: (id: string) => void;
  rejectEdit: (id: string, note: string) => void;
  dismissEdit: (id: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const OrgContext = createContext<OrgState | null>(null);

const STORAGE_KEY = 'agronexus_v2_org';
const CYCLES_KEY  = 'agronexus_v2_cycles';
const EDITS_KEY   = 'agronexus_v2_edit_requests';
// Which backend organisation the cached workspace belongs to. Absent on data
// written before workspaces were keyed by account (legacy, random org ids).
const ACCOUNT_KEY = 'agronexus_v2_org_account';

// ─── Backend sync (one shared workspace per organisation) ────────────────────

const WORKSPACE_QUERY = `query Workspace { workspace { orgData cycles editRequests } }`;
const SAVE_WORKSPACE = `mutation SaveWorkspace($i: SaveWorkspaceInput!) { saveWorkspace(input: $i) { ok } }`;
const RESET_WORKSPACE = `mutation ResetWorkspace { resetWorkspace { ok } }`;

function parseJson<T>(raw: unknown): T | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'string') { try { return JSON.parse(raw) as T; } catch { return null; } }
  return raw as T;
}

/** Load the organisation's shared workspace from the backend (null when not set up yet). */
async function fetchWorkspace() {
  const res = await gqlRequest<{ workspace: { orgData: string; cycles: string; editRequests: string } | null }>(WORKSPACE_QUERY);
  const ws = res.workspace;
  if (!ws) return { org: null, cycles: null, edits: null, exists: false };
  return {
    org: parseJson<OrgProfile>(ws.orgData),
    cycles: parseJson<ProductionCycle[]>(ws.cycles),
    edits: parseJson<EditRequest[]>(ws.editRequests),
    exists: true,
  };
}

function saveWorkspace(parts: { org?: OrgProfile; cycles?: ProductionCycle[]; edits?: EditRequest[] }) {
  const i: Record<string, string> = {};
  if (parts.org) i.orgData = JSON.stringify(parts.org);
  if (parts.cycles) i.cycles = JSON.stringify(parts.cycles);
  if (parts.edits) i.editRequests = JSON.stringify(parts.edits);
  if (!Object.keys(i).length) return Promise.resolve();
  return gqlRequest(SAVE_WORKSPACE, { i }).then(() => undefined).catch(() => { /* offline — localStorage keeps the copy, next save retries */ });
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { profile, loading: authLoading } = useAuth();
  // The workspace is shared by the whole company: keyed by the backend organisation.
  const accountOrgId = profile?.organizationId ?? null;
  const [org, setOrg] = useState<OrgProfile | null>(null);
  const [cycles, setCycles] = useState<ProductionCycle[]>([]);
  const [editRequests, setEditRequests] = useState<EditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  // Block persistence until hydration has settled so an empty initial state
  // never overwrites the shared copy.
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  // Hydrate: localStorage first (instant), then Supabase (authoritative / cross-device)
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setLoading(true);
    setHydratedFor(null);

    // 1. Load localStorage for instant display
    let local: OrgProfile | null = null;
    let localCycles: ProductionCycle[] = [];
    let localEdits: EditRequest[] = [];
    let localAccount: string | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) local = JSON.parse(raw);
      const rawCycles = localStorage.getItem(CYCLES_KEY);
      if (rawCycles) localCycles = JSON.parse(rawCycles);
      const rawEdits = localStorage.getItem(EDITS_KEY);
      if (rawEdits) localEdits = JSON.parse(rawEdits);
      localAccount = localStorage.getItem(ACCOUNT_KEY);
    } catch { /* ignore corrupt data */ }

    // Cached data from another company (or none) must not leak into this account.
    const cacheMatches = !accountOrgId
      || (local?.id === accountOrgId)
      || (!localAccount && !!local && local.id !== accountOrgId); // legacy cache → migrate below
    if (cacheMatches && local) {
      setOrg(local); setCycles(localCycles); setEditRequests(localEdits);
    } else {
      setOrg(null); setCycles([]); setEditRequests([]);
    }

    // 2. Load the shared copy from the backend (authoritative, cross-device, all members)
    if (!accountOrgId) { setLoading(false); setHydratedFor(''); return; }

    (async () => {
      const ws = await fetchWorkspace();
      if (cancelled) return;

      if (!ws.exists && local && !localAccount) {
        // First login since workspaces moved to the backend: this browser holds
        // the company's data (random legacy id). Adopt it for the whole company.
        const adopted: OrgProfile = { ...local, id: accountOrgId };
        await saveWorkspace({ org: adopted, cycles: localCycles, edits: localEdits });
        if (cancelled) return;
        setOrg(adopted); setCycles(localCycles); setEditRequests(localEdits);
        return;
      }

      if (ws.org) setOrg(ws.org);
      else setOrg(null);
      setCycles(ws.cycles ?? []);
      setEditRequests(ws.edits ?? []);
    })().catch(() => { /* offline — keep whatever the cache gave us */ })
      .finally(() => { if (!cancelled) { setLoading(false); setHydratedFor(accountOrgId ?? ''); } });

    return () => { cancelled = true; };
  }, [accountOrgId, authLoading]);

  const ready = hydratedFor !== null && hydratedFor === (accountOrgId ?? '');

  // The finance ledger is per company, held on the server
  useEffect(() => { setFinanceAccount(accountOrgId); setSalesAccount(accountOrgId); setStockAccount(accountOrgId); }, [accountOrgId]);

  // Make the company's saved templates visible to every getTemplate() caller.
  // Done during render so children never see a stale list.
  setCustomTemplates(org?.customTemplates);

  // Persist org (localStorage + backend). Skips the hydration render itself.
  const skipNext = React.useRef({ org: true, cycles: true, edits: true });
  useEffect(() => { skipNext.current = { org: true, cycles: true, edits: true }; }, [hydratedFor]);

  useEffect(() => {
    if (!ready) return;
    const skip = skipNext.current.org; skipNext.current.org = false;
    if (!org) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(org));
    if (accountOrgId) localStorage.setItem(ACCOUNT_KEY, accountOrgId);
    if (!skip && accountOrgId) saveWorkspace({ org });
  }, [org, ready, accountOrgId]);

  // Persist cycles (localStorage + backend), debounced — daily logging and CSV imports write in bursts
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(CYCLES_KEY, JSON.stringify(cycles));
    const skip = skipNext.current.cycles; skipNext.current.cycles = false;
    if (skip || !accountOrgId || !org?.id) return;
    const t = setTimeout(() => saveWorkspace({ cycles }), 600);
    return () => clearTimeout(t);
  }, [cycles, org?.id, ready, accountOrgId]);

  // Persist edit requests (localStorage + backend)
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(EDITS_KEY, JSON.stringify(editRequests));
    const skip = skipNext.current.edits; skipNext.current.edits = false;
    if (skip || !accountOrgId || !org?.id) return;
    const t = setTimeout(() => saveWorkspace({ edits: editRequests }), 600);
    return () => clearTimeout(t);
  }, [editRequests, org?.id, ready, accountOrgId]);

  // ─── Org ────────────────────────────────────────────────────────────────────

  const createOrg = useCallback((name: string, country: string, currency: string, businessType = 'farmer') => {
    const newOrg: OrgProfile = {
      // Keyed by the backend organisation so every member shares one workspace
      id: accountOrgId ?? uuidv4(),
      name,
      country,
      currency,
      timezone: 'Africa/Lusaka',
      onboardingComplete: false,
      businessType: businessType as import('@/lib/types').BusinessType,
      enterprises: [],
      createdAt: new Date().toISOString(),
    };
    setOrg(newOrg);
  }, [accountOrgId]);

  const updateOrg = useCallback((patch: Partial<OrgProfile>) => {
    setOrg(prev => prev ? { ...prev, ...patch } : null);
  }, []);

  const completeOnboarding = useCallback(() => {
    setOrg(prev => prev ? { ...prev, onboardingComplete: true } : null);
  }, []);

  const resetWorkspace = useCallback(async () => {
    if (accountOrgId) await gqlRequest(RESET_WORKSPACE);
    [STORAGE_KEY, CYCLES_KEY, EDITS_KEY, ACCOUNT_KEY].forEach(k => localStorage.removeItem(k));
    window.location.reload();
  }, [accountOrgId]);

  // ─── Saved templates & care guide ────────────────────────────────────────────

  const saveCustomTemplate = useCallback((template: ProductionTemplate, useForEnterpriseId?: string) => {
    setOrg(prev => {
      if (!prev) return prev;
      const saved: ProductionTemplate = { ...template, isCustom: true, updatedAt: new Date().toISOString() };
      const list = prev.customTemplates ?? [];
      const exists = list.some(t => t.id === saved.id);
      return {
        ...prev,
        customTemplates: exists ? list.map(t => t.id === saved.id ? saved : t) : [...list, saved],
        enterprises: useForEnterpriseId
          ? prev.enterprises.map(e => e.id === useForEnterpriseId ? { ...e, templateId: saved.id } : e)
          : prev.enterprises,
      };
    });
  }, []);

  const deleteCustomTemplate = useCallback((id: string) => {
    setOrg(prev => {
      if (!prev) return prev;
      const gone = (prev.customTemplates ?? []).find(t => t.id === id);
      return {
        ...prev,
        customTemplates: (prev.customTemplates ?? []).filter(t => t.id !== id),
        // enterprises using it fall back to the built-in it was copied from
        enterprises: prev.enterprises.map(e =>
          e.templateId === id && gone?.baseTemplateId ? { ...e, templateId: gone.baseTemplateId } : e),
      };
    });
  }, []);

  const setCareDone = useCallback((cycleId: string, key: string, done: boolean, by?: string) => {
    setCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      const log = { ...(c.careLog ?? {}) };
      if (done) log[key] = { doneAt: new Date().toISOString(), by };
      else delete log[key];
      return { ...c, careLog: log };
    }));
  }, []);

  // ─── Enterprises ─────────────────────────────────────────────────────────────

  const addEnterprise = useCallback((config: Omit<EnterpriseConfig, 'id' | 'createdAt'>) => {
    const enterprise: EnterpriseConfig = {
      ...config,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setOrg(prev => prev ? {
      ...prev,
      enterprises: [...prev.enterprises, enterprise],
    } : null);
    return enterprise;
  }, []);

  const updateEnterprise = useCallback((id: string, patch: Partial<EnterpriseConfig>) => {
    setOrg(prev => prev ? {
      ...prev,
      enterprises: prev.enterprises.map(e => e.id === id ? { ...e, ...patch } : e),
    } : null);
  }, []);

  const removeEnterprise = useCallback((id: string) => {
    setOrg(prev => prev ? {
      ...prev,
      enterprises: prev.enterprises.filter(e => e.id !== id),
    } : null);
  }, []);

  // ─── Cycles ──────────────────────────────────────────────────────────────────

  const addCycle = useCallback((cycleData: Omit<ProductionCycle, 'id' | 'createdAt' | 'cycleNumber' | 'stages'>) => {
    const template = getTemplate(
      org?.enterprises.find(e => e.id === cycleData.enterpriseId)?.templateId ?? ''
    );
    const cycleNumber = cycles.filter(c => c.enterpriseId === cycleData.enterpriseId).length + 1;

    const cycle: ProductionCycle = {
      ...cycleData,
      id: uuidv4(),
      cycleNumber,
      createdAt: new Date().toISOString(),
      stages: template?.stages.map((s, idx) => ({
        id: uuidv4(),
        templateId: s.id,
        name: s.name,
        status: idx === 0 ? 'active' : 'pending',
        events: [],
        dailyRecords: [],
      })) ?? [],
      currentStageId: '',
    };
    // Set current stage to first stage
    if (cycle.stages.length > 0) {
      cycle.currentStageId = cycle.stages[0].id;
    }
    setCycles(prev => [...prev, cycle]);
    return cycle;
  }, [cycles, org]);

  const updateCycle = useCallback((id: string, patch: Partial<ProductionCycle>) => {
    setCycles(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  }, []);

  const getCyclesForEnterprise = useCallback((enterpriseId: string) => {
    return cycles.filter(c => c.enterpriseId === enterpriseId);
  }, [cycles]);

  const getActiveCycle = useCallback((enterpriseId: string) => {
    return cycles.find(c => c.enterpriseId === enterpriseId && c.status === 'active');
  }, [cycles]);

  // ─── Stage & Record operations ────────────────────────────────────────────────

  const addDailyRecord = useCallback((cycleId: string, stageId: string, record: Omit<DailyRecord, 'id'>) => {
    setCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      return {
        ...c,
        stages: c.stages.map(s => {
          if (s.id !== stageId) return s;
          return { ...s, dailyRecords: [...s.dailyRecords, { ...record, id: uuidv4() }] };
        }),
      };
    }));
  }, []);

  const addEvent = useCallback((cycleId: string, stageId: string, event: Omit<ProductionEvent, 'id'>) => {
    const eventId = uuidv4();
    const today = new Date().toISOString().slice(0, 10);
    const d = event.data ?? {};

    // ─── Cross-module bus emissions ──────────────────────────────────────────
    // 1. Purchases → finance:cost + optionally inventory:stock_in
    if (event.type === 'purchase' && d.total_cost) {
      postFinance('production', [{
        sourceRef: `prod:${eventId}:purchase`, type: 'expense', category: inferCostCategory(d.category ?? 'Production Input'),
        description: d.item ?? 'Farm purchase', amount: Number(d.total_cost),
        date: (event.date as string) ?? today, cycleRef: cycleId, reference: d.receipt_no,
        notes: 'Auto-recorded from production engine',
      }]);
      if (d.add_to_inventory) {
        postStock('production', [{
          sourceRef: `prod:${eventId}:stock-purchase`, direction: 'in', name: d.item ?? 'Farm Input',
          qty: Number(d.quantity ?? 0), unit: String(d.unit ?? ''), date: (event.date as string) ?? today,
          costPerUnit: d.unit_cost ? Number(d.unit_cost) : undefined, reference: cycleId, notes: 'Purchase logged in production',
        }]);
      }
    }

    // 2. Treatments → finance:cost
    if ((event.type === 'treatment' || event.type === 'vaccination') && d.cost) {
      postFinance('production', [{
        sourceRef: `prod:${eventId}:treatment`, type: 'expense', category: 'medicine',
        description: `${d.vaccine_name ?? d.product ?? 'Vet treatment'} (${d.treated_count ?? ''} head)`,
        amount: Number(d.cost), date: (event.date as string) ?? today, cycleRef: cycleId,
        notes: 'Auto-recorded from production engine',
      }]);
    }

    // 3. Stocking → finance:cost
    if (event.type === 'stocking' && d.total_cost) {
      postFinance('production', [{
        sourceRef: `prod:${eventId}:stocking`, type: 'expense', category: 'other_cost',
        description: `${d.count ?? ''} ${d.species ?? 'fish'} stocked (${d.location ?? ''})`,
        amount: Number(d.total_cost), date: (event.date as string) ?? today, cycleRef: cycleId,
        notes: 'Auto-recorded from production engine',
      }]);
    }

    // 4. Direct sale → finance:income
    if (event.type === 'sale' && d.total_value) {
      postFinance('production', [{
        sourceRef: `prod:${eventId}:sale`, type: 'income', category: 'sale_income',
        description: `Farm sale: ${d.product ?? ''} (${d.quantity ?? ''} ${d.unit ?? ''})`,
        amount: Number(d.total_value), date: (event.date as string) ?? today, cycleRef: cycleId,
        notes: 'Auto-recorded from production engine',
      }]);
    }

    // 5. Harvest → inventory:stock_in (when routed to inventory)
    if ((event.type === 'harvest' || event.type === 'partial_harvest') && d.routing === 'Inventory') {
      postStock('production', [{
        sourceRef: `prod:${eventId}:stock-harvest`, direction: 'in', name: d.product ?? 'Harvest Output',
        qty: Number(d.quantity ?? d.total_weight ?? 0), unit: String(d.unit ?? 'kg'), date: (event.date as string) ?? today,
        reference: cycleId, notes: 'Harvest sent to inventory',
      }]);
    }

    // 6. Egg collection → inventory:stock_in for table eggs, incubation:eggs_set for hatching eggs
    if (event.type === 'egg_collection') {
      if (d.table_eggs && Number(d.table_eggs) > 0) {
        postStock('production', [{
          sourceRef: `prod:${eventId}:stock-eggs`, direction: 'in', name: 'Table Eggs', qty: Number(d.table_eggs), unit: 'count',
          date: (event.date as string) ?? today, reference: cycleId, notes: 'Egg collection',
        }]);
      }
      if (d.hatching_eggs && Number(d.hatching_eggs) > 0) {
        emit<EggsSetPayload>('incubation:eggs_set', {
          quantity: Number(d.hatching_eggs),
          date: (event.date as string) ?? today,
          cycleRef: cycleId,
          stageRef: stageId,
        }, 'production');
      }
    }

    // 7. Milk collection → inventory:stock_in
    if (event.type === 'milk_collection' && d.total_litres && Number(d.total_litres) > 0) {
      postStock('production', [{
        sourceRef: `prod:${eventId}:stock-milk`, direction: 'in', name: 'Fresh Milk', qty: Number(d.total_litres), unit: 'litre',
        date: (event.date as string) ?? today, reference: cycleId, notes: d.routing ? String(d.routing) : 'Milk collection',
      }]);
    }

    // 8. Honey harvest → inventory:stock_in + finance:income
    if (event.type === 'honey_harvest' && d.honey_kg) {
      postStock('production', [{
        sourceRef: `prod:${eventId}:stock-honey`, direction: 'in', name: 'Honey', qty: Number(d.honey_kg), unit: 'kg',
        date: (event.date as string) ?? today, reference: cycleId, notes: 'Honey harvest',
      }]);
    }

    // ─── Persist event ──────────────────────────────────────────────────────
    setCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      return {
        ...c,
        stages: c.stages.map(s => {
          if (s.id !== stageId) return s;
          return { ...s, events: [...s.events, { ...event, id: eventId }] };
        }),
      };
    }));
  }, []);

  const advanceStage = useCallback((cycleId: string) => {
    setCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      const currentIdx = c.stages.findIndex(s => s.id === c.currentStageId);
      if (currentIdx === -1) return c;
      const nextStage = c.stages[currentIdx + 1];
      const updatedStages = c.stages.map((s, idx) => {
        if (idx === currentIdx) return { ...s, status: 'completed' as const, endDate: new Date().toISOString().slice(0, 10) };
        if (idx === currentIdx + 1) return { ...s, status: 'active' as const, startDate: new Date().toISOString().slice(0, 10) };
        return s;
      });
      return {
        ...c,
        stages: updatedStages,
        currentStageId: nextStage?.id ?? c.currentStageId,
      };
    }));
  }, []);

  const deleteCycle = useCallback((cycleId: string) => {
    setCycles(prev => prev.filter(c => c.id !== cycleId));
  }, []);

  const completeCycle = useCallback((cycleId: string, endDate: string, notes?: string) => {
    setCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      return {
        ...c,
        status: 'completed' as const,
        endDate,
        notes: notes ?? c.notes,
        stages: c.stages.map(s =>
          s.status === 'active' ? { ...s, status: 'completed' as const, endDate } : s
        ),
      };
    }));
  }, []);

  // ─── Direct-apply edit primitives ────────────────────────────────────────────

  const updateDailyRecord = useCallback((cycleId: string, stageId: string, recordId: string, patch: Partial<DailyRecord>) => {
    setCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      return {
        ...c,
        stages: c.stages.map(s => {
          if (s.id !== stageId) return s;
          return {
            ...s,
            dailyRecords: s.dailyRecords.map(r =>
              r.id === recordId ? { ...r, ...patch } : r
            ),
          };
        }),
      };
    }));
  }, []);

  const deleteDailyRecord = useCallback((cycleId: string, stageId: string, recordId: string) => {
    setCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      return {
        ...c,
        stages: c.stages.map(s => {
          if (s.id !== stageId) return s;
          return {
            ...s,
            dailyRecords: s.dailyRecords.filter(r => r.id !== recordId),
          };
        }),
      };
    }));
  }, []);

  const updateEvent = useCallback((cycleId: string, stageId: string, eventId: string, patch: Partial<ProductionEvent>) => {
    setCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      return {
        ...c,
        stages: c.stages.map(s => {
          if (s.id !== stageId) return s;
          return {
            ...s,
            events: s.events.map(e =>
              e.id === eventId ? { ...e, ...patch } : e
            ),
          };
        }),
      };
    }));
  }, []);

  const deleteEvent = useCallback((cycleId: string, stageId: string, eventId: string) => {
    setCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      return {
        ...c,
        stages: c.stages.map(s => {
          if (s.id !== stageId) return s;
          return {
            ...s,
            events: s.events.filter(e => e.id !== eventId),
          };
        }),
      };
    }));
  }, []);

  // ─── Edit approval workflow ────────────────────────────────────────────────

  /** Route an edit: if approval is enabled, queue it; otherwise apply immediately. */
  const submitEdit = useCallback((req: Omit<EditRequest, 'id' | 'status' | 'requestedAt'>) => {
    if (org?.editApproval?.enabled) {
      // Queue for approval
      const fullReq: EditRequest = {
        ...req,
        id: uuidv4(),
        status: 'pending',
        requestedAt: new Date().toISOString(),
      };
      setEditRequests(prev => [...prev, fullReq]);
    } else {
      // Apply immediately by parsing the payload
      const payload = JSON.parse(req.applyPayload) as {
        action: 'update_record' | 'delete_record' | 'update_event' | 'delete_event' | 'update_cycle';
        cycleId: string;
        stageId?: string;
        entityId: string;
        patch?: Record<string, unknown>;
      };
      applyPayload(payload, req.cycleId, req.stageId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

  /** Internal helper — apply a parsed payload object. */
  function applyPayload(
    payload: { action: string; cycleId: string; stageId?: string; entityId: string; patch?: Record<string, unknown> },
    cycleId: string,
    stageId?: string,
  ) {
    const sid = payload.stageId ?? stageId ?? '';
    if (payload.action === 'update_record') {
      updateDailyRecord(cycleId, sid, payload.entityId, (payload.patch ?? {}) as Partial<DailyRecord>);
    } else if (payload.action === 'delete_record') {
      deleteDailyRecord(cycleId, sid, payload.entityId);
    } else if (payload.action === 'update_event') {
      updateEvent(cycleId, sid, payload.entityId, (payload.patch ?? {}) as Partial<ProductionEvent>);
    } else if (payload.action === 'delete_event') {
      deleteEvent(cycleId, sid, payload.entityId);
    } else if (payload.action === 'update_cycle') {
      updateCycle(cycleId, (payload.patch ?? {}) as Partial<ProductionCycle>);
    }
  }

  const approveEdit = useCallback((id: string) => {
    setEditRequests(prev => prev.map(r => {
      if (r.id !== id || r.status !== 'pending') return r;
      try {
        const payload = JSON.parse(r.applyPayload);
        applyPayload(payload, r.cycleId, r.stageId);
      } catch { /* bad payload — still mark approved */ }
      return {
        ...r,
        status: 'approved' as const,
        reviewedAt: new Date().toISOString(),
        reviewedBy: org?.editApproval?.approverName ?? 'Approver',
      };
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

  const rejectEdit = useCallback((id: string, note: string) => {
    setEditRequests(prev => prev.map(r =>
      r.id === id && r.status === 'pending'
        ? {
            ...r,
            status: 'rejected' as const,
            reviewedAt: new Date().toISOString(),
            reviewedBy: org?.editApproval?.approverName ?? 'Approver',
            rejectionNote: note,
          }
        : r
    ));
  }, [org]);

  const dismissEdit = useCallback((id: string) => {
    setEditRequests(prev => prev.filter(r => r.id !== id));
  }, []);

  return React.createElement(OrgContext.Provider, {
    value: {
      org, cycles, editRequests, loading,
      createOrg, updateOrg, completeOnboarding, resetWorkspace,
      saveCustomTemplate, deleteCustomTemplate, setCareDone,
      addEnterprise, updateEnterprise, removeEnterprise,
      addCycle, updateCycle, getCyclesForEnterprise, getActiveCycle,
      addDailyRecord, addEvent, advanceStage, completeCycle, deleteCycle,
      updateDailyRecord, deleteDailyRecord, updateEvent, deleteEvent,
      submitEdit, approveEdit, rejectEdit, dismissEdit,
    }
  }, children);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOrg(): OrgState {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be inside OrgProvider');
  return ctx;
}
