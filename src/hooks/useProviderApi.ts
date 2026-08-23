/**
 * useProviderApi — fetches providers from the Django GraphQL backend.
 * Falls back gracefully to the localStorage mock data when the API is
 * unreachable (useful during frontend-only dev without the backend running).
 *
 * Usage:
 *   const { providers, loading, apiOnline } = useProviderApi({
 *     providerType: 'equipment_hire',
 *     mockProviders,
 *     storageKey: 'agronexus_v2_providers_hire',
 *   });
 */
import { useState, useEffect, useCallback } from 'react';
import { gqlRequest } from '@/lib/api';
import { Provider } from '@/pages/marketplace/ProviderDirectory';
import {
  PROVIDERS_QUERY,
  CREATE_HIRE_BOOKING_MUTATION,
  BOOK_VET_APPOINTMENT_MUTATION,
  POST_REVIEW_MUTATION,
} from '@/graphql/providerQueries';

// ── Type adapters ─────────────────────────────────────────────────────────────
// Map Django snake_case / camelCase GraphQL response → frontend Provider shape

function adaptApiProvider(raw: any): Provider {
  return {
    id:             raw.id,
    providerType:   raw.providerType,
    name:           raw.name,
    tagline:        raw.tagline ?? '',
    description:    raw.description ?? '',
    phone:          raw.phone ?? '',
    email:          raw.email ?? '',
    website:        raw.website || undefined,
    location:       [raw.town, raw.district].filter(Boolean).join(', '),
    districts:      raw.coverageDistricts ?? [],
    operatingHours: raw.serviceHours || undefined,
    verified:       raw.isVerified ?? false,
    certified:      (raw.certifications?.length ?? 0) > 0,
    ratingAvg:      parseFloat(raw.avgRating ?? 0),
    ratingCount:    raw.reviewCount ?? 0,
    active:         raw.status === 'active',
    mine:           false,   // set by caller if registered_by === current org
    services:       [],      // loaded on detail expand
    reviews:        [],
    certifications: [],
    tags:           raw.tags ?? [],
    createdAt:      raw.updatedAt ?? new Date().toISOString(),
    specialties:    raw.specialties ?? [],
  };
}

// ── Booking / review payloads ─────────────────────────────────────────────────

export interface HireBookingPayload {
  providerId: string;
  equipmentId?: string;
  enterpriseId?: string;
  startDate: string;   // YYYY-MM-DD
  endDate: string;
  hectares?: number;
  deliveryAddress?: string;
  notes?: string;
}

export interface VetAppointmentPayload {
  providerId: string;
  enterpriseId?: string;
  vetOfficerId?: string;
  apptType: string;
  apptDate: string;
  species?: string;
  animalCount?: number;
  symptoms?: string;
  notes?: string;
}

export interface ReviewPayload {
  providerId: string;
  rating: number;
  title?: string;
  body?: string;
  serviceUsed?: string;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface Options {
  providerType: string;
  mockProviders: Provider[];
  storageKey: string;
}

export function useProviderApi({ providerType, mockProviders, storageKey }: Options) {
  const [apiProviders, setApiProviders] = useState<Provider[]>([]);
  const [loading, setLoading]           = useState(false);
  const [apiOnline, setApiOnline]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // Locally stored (user-registered) providers survive the API call
  const [localStored, setLocalStored] = useState<Provider[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? '[]') as Provider[];
    } catch { return []; }
  });

  // ── Fetch from Django API ──────────────────────────────────────────────────

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gqlRequest<{ providers: any[] }>(PROVIDERS_QUERY, {
        providerType,
      });
      const adapted = (data.providers ?? []).map(adaptApiProvider);
      setApiProviders(adapted);
      setApiOnline(true);
    } catch (err: any) {
      // API unreachable — silently fall back to mocks
      setApiOnline(false);
      setError(err?.message ?? 'API unavailable');
    } finally {
      setLoading(false);
    }
  }, [providerType]);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  // ── Merged provider list ───────────────────────────────────────────────────
  // Priority: local (mine) > API results > mocks
  const providers = (() => {
    const localIds = new Set(localStored.map((p) => p.id));
    const apiIds   = new Set(apiProviders.map((p) => p.id));

    const apiList  = apiOnline ? apiProviders : [];
    // mocks fill in when API is offline, deduped against both
    const mockFill = apiOnline
      ? []
      : mockProviders.filter((m) => !localIds.has(m.id));

    return [
      ...localStored,
      ...apiList.filter((p) => !localIds.has(p.id)),
      ...mockFill.filter((m) => !apiIds.has(m.id)),
    ];
  })();

  // ── CRUD for user-registered providers ────────────────────────────────────

  function addLocalProvider(p: Provider) {
    const next = [...localStored, { ...p, mine: true }];
    setLocalStored(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function updateLocalProvider(id: string, patch: Partial<Provider>) {
    const next = localStored.map((p) => (p.id === id ? { ...p, ...patch } : p));
    setLocalStored(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function deleteLocalProvider(id: string) {
    const next = localStored.filter((p) => p.id !== id);
    setLocalStored(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  // ── Booking mutations ──────────────────────────────────────────────────────

  async function createHireBooking(payload: HireBookingPayload) {
    const data = await gqlRequest<{ createHireBooking: { ok: boolean; booking: any } }>(
      CREATE_HIRE_BOOKING_MUTATION,
      { input: payload },
    );
    return data.createHireBooking;
  }

  async function bookVetAppointment(payload: VetAppointmentPayload) {
    const data = await gqlRequest<{ bookVetAppointment: { ok: boolean; appointment: any } }>(
      BOOK_VET_APPOINTMENT_MUTATION,
      { input: payload },
    );
    return data.bookVetAppointment;
  }

  async function postReview(payload: ReviewPayload) {
    const data = await gqlRequest<{ postProviderReview: { ok: boolean } }>(
      POST_REVIEW_MUTATION,
      { input: payload },
    );
    return data.postProviderReview;
  }

  return {
    providers,
    loading,
    apiOnline,
    error,
    refresh: fetchProviders,
    // local CRUD
    addLocalProvider,
    updateLocalProvider,
    deleteLocalProvider,
    // mutations
    createHireBooking,
    bookVetAppointment,
    postReview,
  };
}
