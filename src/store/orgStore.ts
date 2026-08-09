// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Organisation store (React Context + localStorage)
// Holds the org profile, enterprise configs, and production data
// ─────────────────────────────────────────────────────────────────────────────
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  OrgProfile, EnterpriseConfig, ProductionCycle, ProductionUnit,
  DailyRecord, ProductionEvent,
} from '@/lib/types';
import { getTemplate } from '@/lib/templates';

// ─── State shape ──────────────────────────────────────────────────────────────

interface OrgState {
  org: OrgProfile | null;
  cycles: ProductionCycle[];
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
}

// ─── Context ──────────────────────────────────────────────────────────────────

const OrgContext = createContext<OrgState | null>(null);

const STORAGE_KEY = 'agronexus_v2_org';
const CYCLES_KEY  = 'agronexus_v2_cycles';

// ─── Provider ─────────────────────────────────────────────────────────────────

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [org, setOrg] = useState<OrgProfile | null>(null);
  const [cycles, setCycles] = useState<ProductionCycle[]>([]);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOrg(JSON.parse(raw));
      const rawCycles = localStorage.getItem(CYCLES_KEY);
      if (rawCycles) setCycles(JSON.parse(rawCycles));
    } catch { /* ignore corrupt data */ }
    setLoading(false);
  }, []);

  // Persist org to localStorage whenever it changes
  useEffect(() => {
    if (org) localStorage.setItem(STORAGE_KEY, JSON.stringify(org));
  }, [org]);

  // Persist cycles
  useEffect(() => {
    localStorage.setItem(CYCLES_KEY, JSON.stringify(cycles));
  }, [cycles]);

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
    setCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      return {
        ...c,
        stages: c.stages.map(s => {
          if (s.id !== stageId) return s;
          return { ...s, events: [...s.events, { ...event, id: uuidv4() }] };
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

  return React.createElement(OrgContext.Provider, {
    value: {
      org, cycles, loading,
      createOrg, updateOrg, completeOnboarding,
      addEnterprise, updateEnterprise, removeEnterprise,
      addCycle, updateCycle, getCyclesForEnterprise, getActiveCycle,
      addDailyRecord, addEvent, advanceStage, completeCycle,
    }
  }, children);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOrg(): OrgState {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be inside OrgProvider');
  return ctx;
}
