// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Organisation store (React Context + localStorage)
// Holds the org profile, enterprise configs, and production data
// ─────────────────────────────────────────────────────────────────────────────
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  OrgProfile, EnterpriseConfig, ProductionCycle, ProductionUnit,
  DailyRecord, ProductionEvent, EditRequest,
} from '@/lib/types';
import { getTemplate } from '@/lib/templates';
import { emit, type StockInPayload, type CostPayload, type IncomePayload, type EggsSetPayload } from '@/lib/bus';
import { supabase } from '@/lib/supabase';

// ─── State shape ──────────────────────────────────────────────────────────────

interface OrgState {
  org: OrgProfile | null;
  cycles: ProductionCycle[];
  editRequests: EditRequest[];
  loading: boolean;

  // Org setup
  createOrg: (name: string, country: string, currency: string) => void;
  updateOrg: (patch: Partial<OrgProfile>) => void;
  completeOnboarding: () => void;

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

// ─── Provider ─────────────────────────────────────────────────────────────────

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [org, setOrg] = useState<OrgProfile | null>(null);
  const [cycles, setCycles] = useState<ProductionCycle[]>([]);
  const [editRequests, setEditRequests] = useState<EditRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Hydrate: localStorage first (instant), then Supabase (authoritative / cross-device)
  useEffect(() => {
    // 1. Load localStorage for instant display
    let localOrgId: string | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { const parsed = JSON.parse(raw); setOrg(parsed); localOrgId = parsed?.id ?? null; }
      const rawCycles = localStorage.getItem(CYCLES_KEY);
      if (rawCycles) setCycles(JSON.parse(rawCycles));
      const rawEdits = localStorage.getItem(EDITS_KEY);
      if (rawEdits) setEditRequests(JSON.parse(rawEdits));
    } catch { /* ignore corrupt data */ }

    // 2. Load from Supabase (overrides localStorage with fresher/cross-device data)
    if (localOrgId) {
      Promise.all([
        supabase.from('agronexus_orgs').select('data').eq('id', localOrgId).maybeSingle(),
        supabase.from('agronexus_cycles').select('data').eq('org_id', localOrgId),
        supabase.from('agronexus_edit_requests').select('data').eq('org_id', localOrgId),
      ]).then(([orgRes, cyclesRes, editsRes]) => {
        if (!orgRes.error && orgRes.data) setOrg(orgRes.data.data as OrgProfile);
        if (!cyclesRes.error && cyclesRes.data?.length) setCycles(cyclesRes.data.map((r: any) => r.data as ProductionCycle));
        if (!editsRes.error && editsRes.data?.length) setEditRequests(editsRes.data.map((r: any) => r.data as EditRequest));
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist org (localStorage + Supabase)
  useEffect(() => {
    if (org) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(org));
      supabase.from('agronexus_orgs').upsert({ id: org.id, data: org, updated_at: new Date().toISOString() });
    }
  }, [org]);

  // Persist cycles (localStorage + Supabase)
  useEffect(() => {
    localStorage.setItem(CYCLES_KEY, JSON.stringify(cycles));
    if (!org?.id) return;
    const orgId = org.id;
    if (cycles.length > 0) {
      supabase.from('agronexus_cycles').upsert(
        cycles.map(c => ({ id: c.id, org_id: orgId, enterprise_id: c.enterpriseId, data: c, updated_at: new Date().toISOString() }))
      );
    }
    // Remove any cycles deleted from this org that no longer exist
    const ids = cycles.map(c => c.id);
    if (ids.length > 0) {
      supabase.from('agronexus_cycles').delete().eq('org_id', orgId).not('id', 'in', `(${ids.map(i => `'${i}'`).join(',')})`)
        .then(); // best-effort cleanup
    } else {
      supabase.from('agronexus_cycles').delete().eq('org_id', orgId).then();
    }
  }, [cycles, org?.id]);

  // Persist edit requests (localStorage + Supabase)
  useEffect(() => {
    localStorage.setItem(EDITS_KEY, JSON.stringify(editRequests));
    if (!org?.id || !editRequests.length) return;
    const orgId = org.id;
    supabase.from('agronexus_edit_requests').upsert(
      editRequests.map(r => ({ id: r.id, org_id: orgId, data: r, updated_at: new Date().toISOString() }))
    );
  }, [editRequests, org?.id]);

  // ─── Org ────────────────────────────────────────────────────────────────────

  const createOrg = useCallback((name: string, country: string, currency: string) => {
    const newOrg: OrgProfile = {
      id: uuidv4(),
      name,
      country,
      currency,
      timezone: 'Africa/Lusaka',
      onboardingComplete: false,
      enterprises: [],
      createdAt: new Date().toISOString(),
    };
    setOrg(newOrg);
  }, []);

  const updateOrg = useCallback((patch: Partial<OrgProfile>) => {
    setOrg(prev => prev ? { ...prev, ...patch } : null);
  }, []);

  const completeOnboarding = useCallback(() => {
    setOrg(prev => prev ? { ...prev, onboardingComplete: true } : null);
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
      emit<CostPayload>('finance:cost', {
        category: d.category ?? 'Production Input',
        description: d.item ?? 'Farm purchase',
        amount: Number(d.total_cost),
        date: (event.date as string) ?? today,
        cycleRef: cycleId,
        reference: d.receipt_no,
      }, 'production');
      if (d.add_to_inventory) {
        emit<StockInPayload>('inventory:stock_in', {
          materialTypeId: d.item ?? 'unknown',
          materialName: d.item ?? 'Farm Input',
          quantity: Number(d.quantity ?? 0),
          unit: String(d.unit ?? ''),
          cycleRef: cycleId,
          stageRef: stageId,
          date: (event.date as string) ?? today,
          costPerUnit: d.unit_cost ? Number(d.unit_cost) : undefined,
        }, 'production');
      }
    }

    // 2. Treatments → finance:cost
    if ((event.type === 'treatment' || event.type === 'vaccination') && d.cost) {
      emit<CostPayload>('finance:cost', {
        category: event.type === 'vaccination' ? 'Veterinary – Vaccination' : 'Veterinary – Treatment',
        description: `${d.vaccine_name ?? d.product ?? 'Vet treatment'} (${d.treated_count ?? ''} head)`,
        amount: Number(d.cost),
        date: (event.date as string) ?? today,
        cycleRef: cycleId,
      }, 'production');
    }

    // 3. Stocking → finance:cost
    if (event.type === 'stocking' && d.total_cost) {
      emit<CostPayload>('finance:cost', {
        category: 'Stocking – Fingerlings',
        description: `${d.count ?? ''} ${d.species ?? 'fish'} stocked (${d.location ?? ''})`,
        amount: Number(d.total_cost),
        date: (event.date as string) ?? today,
        cycleRef: cycleId,
      }, 'production');
    }

    // 4. Direct sale → finance:income
    if (event.type === 'sale' && d.total_value) {
      emit<IncomePayload>('finance:income', {
        description: `Farm sale: ${d.product ?? ''} (${d.quantity ?? ''} ${d.unit ?? ''})`,
        amount: Number(d.total_value),
        date: (event.date as string) ?? today,
        cycleRef: cycleId,
      }, 'production');
    }

    // 5. Harvest → inventory:stock_in (when routed to inventory)
    if ((event.type === 'harvest' || event.type === 'partial_harvest') && d.routing === 'Inventory') {
      emit<StockInPayload>('inventory:stock_in', {
        materialTypeId: d.product ?? 'harvest-output',
        materialName: d.product ?? 'Harvest Output',
        quantity: Number(d.quantity ?? d.total_weight ?? 0),
        unit: String(d.unit ?? 'kg'),
        cycleRef: cycleId,
        stageRef: stageId,
        eventRef: eventId,
        date: (event.date as string) ?? today,
        qualityStatus: 'pending',
      }, 'production');
    }

    // 6. Egg collection → inventory:stock_in for table eggs, incubation:eggs_set for hatching eggs
    if (event.type === 'egg_collection') {
      if (d.table_eggs && Number(d.table_eggs) > 0) {
        emit<StockInPayload>('inventory:stock_in', {
          materialTypeId: 'table-eggs',
          materialName: 'Table Eggs',
          quantity: Number(d.table_eggs),
          unit: 'count',
          cycleRef: cycleId,
          stageRef: stageId,
          date: (event.date as string) ?? today,
          qualityStatus: 'pass',
        }, 'production');
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
      emit<StockInPayload>('inventory:stock_in', {
        materialTypeId: 'fresh-milk',
        materialName: 'Fresh Milk',
        quantity: Number(d.total_litres),
        unit: 'litre',
        cycleRef: cycleId,
        stageRef: stageId,
        date: (event.date as string) ?? today,
        qualityStatus: 'pending',
        notes: d.routing ? String(d.routing) : undefined,
      }, 'production');
    }

    // 8. Honey harvest → inventory:stock_in + finance:income
    if (event.type === 'honey_harvest' && d.honey_kg) {
      emit<StockInPayload>('inventory:stock_in', {
        materialTypeId: 'honey',
        materialName: 'Honey',
        quantity: Number(d.honey_kg),
        unit: 'kg',
        cycleRef: cycleId,
        stageRef: stageId,
        date: (event.date as string) ?? today,
        qualityStatus: 'pass',
      }, 'production');
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
      createOrg, updateOrg, completeOnboarding,
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
