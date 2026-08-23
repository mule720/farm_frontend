import React, { useState, useMemo } from 'react';
import {
  Search, MapPin, Phone, Mail, Shield, CheckCircle,
  Plus, X, ChevronRight, Globe, Clock, Tag, Building2, BadgeCheck,
  CalendarDays, Loader2, WifiOff,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useOrg } from '@/store/orgStore';
import { useProviderApi, HireBookingPayload, VetAppointmentPayload } from '@/hooks/useProviderApi';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ProviderType =
  | 'agro_dealer' | 'equipment_hire' | 'vet' | 'agronomist'
  | 'labour' | 'land' | 'finance' | 'lab' | 'processing' | 'training';

export interface ProviderService {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  available: boolean;
}

export interface ProviderReview {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  serviceUsed: string;
  createdAt: string;
}

export interface ProviderCertification {
  body: string;
  certNumber: string;
  certType: string;
  expires?: string;
}

export interface Provider {
  id: string;
  providerType: ProviderType;
  name: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  website?: string;
  location: string;
  districts: string[];
  operatingHours?: string;
  licenseNumber?: string;
  verified: boolean;
  certified: boolean;
  ratingAvg: number;
  ratingCount: number;
  active: boolean;
  mine: boolean;
  services: ProviderService[];
  reviews: ProviderReview[];
  certifications: ProviderCertification[];
  tags: string[];
  createdAt: string;
  specialties?: string[];
  coverageType?: string;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useProviders(storageKey: string, mockProviders: Provider[]) {
  const [stored, setStored] = useState<Provider[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as Provider[]) : [];
    } catch {
      return [];
    }
  });

  const providers = useMemo<Provider[]>(() => {
    const storedIds = new Set(stored.map((p) => p.id));
    const merged = [...stored, ...mockProviders.filter((m) => !storedIds.has(m.id))];
    return merged;
  }, [stored, mockProviders]);

  function persist(next: Provider[]) {
    const onlyStored = next.filter((p) => p.mine || stored.some((s) => s.id === p.id));
    setStored(onlyStored);
    localStorage.setItem(storageKey, JSON.stringify(onlyStored));
  }

  function addProvider(p: Provider) {
    const next = [...stored, p];
    setStored(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function updateProvider(id: string, patch: Partial<Provider>) {
    const next = stored.map((p) => (p.id === id ? { ...p, ...patch } : p));
    setStored(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function deleteProvider(id: string) {
    const next = stored.filter((p) => p.id !== id);
    setStored(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  return { providers, addProvider, updateProvider, deleteProvider };
}

// ─── Config ──────────────────────────────────────────────────────────────────

export type BookingType = 'hire' | 'vet' | 'enquiry';

export interface ProviderDirectoryConfig {
  storageKey: string;
  providerType: ProviderType;
  title: string;
  icon: string;
  accent: string;
  categories: string[];
  serviceUnitLabel: string;
  registerLabel: string;
  mockProviders: Provider[];
  bookingType?: BookingType;           // enables the Book button in detail modal
  renderExtras?: (p: Provider) => React.ReactNode;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count: number }) {
  const filled = Math.round(rating);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
      <span style={{ color: '#f59e0b', letterSpacing: '1px' }}>
        {'★'.repeat(filled)}{'☆'.repeat(5 - filled)}
      </span>
      <span style={{ color: 'var(--muted-foreground)', fontSize: '12px' }}>({count})</span>
    </span>
  );
}

function accentClasses(accent: string) {
  const map: Record<string, { btn: string; chip: string; pill: string }> = {
    amber:  { btn: 'bg-amber-500 hover:bg-amber-600 text-white',  chip: 'bg-amber-100 text-amber-800',  pill: 'bg-amber-50 text-amber-700 border border-amber-200' },
    orange: { btn: 'bg-orange-500 hover:bg-orange-600 text-white', chip: 'bg-orange-100 text-orange-800', pill: 'bg-orange-50 text-orange-700 border border-orange-200' },
    pink:   { btn: 'bg-pink-500 hover:bg-pink-600 text-white',    chip: 'bg-pink-100 text-pink-800',    pill: 'bg-pink-50 text-pink-700 border border-pink-200' },
    green:  { btn: 'bg-green-600 hover:bg-green-700 text-white',  chip: 'bg-green-100 text-green-800',  pill: 'bg-green-50 text-green-700 border border-green-200' },
  };
  return map[accent] ?? map['amber'];
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
}

// ─── ProviderShell ───────────────────────────────────────────────────────────

export function ProviderShell({ cfg }: { cfg: ProviderDirectoryConfig }) {
  const {
    providers,
    loading,
    apiOnline,
    addLocalProvider,
    createHireBooking,
    bookVetAppointment,
  } = useProviderApi({
    providerType: cfg.providerType,
    mockProviders: cfg.mockProviders,
    storageKey: cfg.storageKey,
  });

  // Keep backward-compat alias
  const addProvider = addLocalProvider;
  const ac = accentClasses(cfg.accent);

  const [tab, setTab] = useState<'browse' | 'mine'>('browse');
  const [search, setSearch] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selected, setSelected] = useState<Provider | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'services' | 'reviews' | 'certs'>('overview');
  const [showRegister, setShowRegister] = useState(false);

  // Booking state
  const [bookingProvider, setBookingProvider] = useState<Provider | null>(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingDone, setBookingDone] = useState<string | null>(null); // ref number

  const [form, setForm] = useState({
    name: '', tagline: '', description: '', phone: '', email: '',
    website: '', location: '', districts: '', operatingHours: '', licenseNumber: '', tags: '',
  });

  const allDistricts = useMemo(() => {
    const s = new Set<string>();
    providers.forEach((p) => p.districts.forEach((d) => s.add(d)));
    return Array.from(s).sort();
  }, [providers]);

  const filtered = useMemo(() => {
    let list = tab === 'mine' ? providers.filter((p) => p.mine) : providers;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (filterDistrict) list = list.filter((p) => p.districts.includes(filterDistrict));
    if (filterCategory) list = list.filter((p) => p.services.some((s) => s.category === filterCategory));
    return list;
  }, [providers, tab, search, filterDistrict, filterCategory]);

  function handleRegister() {
    if (!form.name || !form.phone || !form.location) return;
    const newP: Provider = {
      id: uuidv4(),
      providerType: cfg.providerType,
      name: form.name,
      tagline: form.tagline,
      description: form.description,
      phone: form.phone,
      email: form.email,
      website: form.website || undefined,
      location: form.location,
      districts: form.districts.split(',').map((d) => d.trim()).filter(Boolean),
      operatingHours: form.operatingHours || undefined,
      licenseNumber: form.licenseNumber || undefined,
      verified: false,
      certified: false,
      ratingAvg: 0,
      ratingCount: 0,
      active: true,
      mine: true,
      services: [],
      reviews: [],
      certifications: [],
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    };
    addProvider(newP);
    setShowRegister(false);
    setForm({ name: '', tagline: '', description: '', phone: '', email: '', website: '', location: '', districts: '', operatingHours: '', licenseNumber: '', tags: '' });
    setTab('mine');
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* API status banner */}
      {!apiOnline && !loading && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs">
          <WifiOff size={12} />
          <span>Showing sample data — connect to AgroNexus backend to see live provider profiles</span>
        </div>
      )}
      {loading && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b border-blue-200 text-blue-700 text-xs">
          <Loader2 size={12} className="animate-spin" />
          <span>Loading provider directory…</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{cfg.icon}</span>
            <div>
              <h1 className="text-xl font-bold">{cfg.title}</h1>
              <p className="text-sm text-muted-foreground">Find &amp; connect with verified providers</p>
            </div>
          </div>
          <button
            onClick={() => setShowRegister(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${ac.btn}`}
          >
            <Plus size={15} /> {cfg.registerLabel}
          </button>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {(['browse', 'mine'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === t ? ac.btn : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {t === 'browse' ? 'Browse All' : 'My Listings'}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 sm:px-6 border-b border-border flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Search providers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="text-sm bg-muted border border-border rounded-lg px-3 py-1.5 focus:outline-none"
          value={filterDistrict}
          onChange={(e) => setFilterDistrict(e.target.value)}
        >
          <option value="">All Districts</option>
          {allDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          className="text-sm bg-muted border border-border rounded-lg px-3 py-1.5 focus:outline-none"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {cfg.categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Grid */}
      <div className="px-4 py-6 sm:px-6">
        {tab === 'mine' && filtered.length === 0 ? (
          <div className="text-center py-20">
            <Building2 size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-medium mb-1">No listings yet</p>
            <p className="text-sm text-muted-foreground mb-4">Register your business to appear in the directory.</p>
            <button onClick={() => setShowRegister(true)} className={`px-4 py-2 rounded-lg text-sm font-medium ${ac.btn}`}>
              {cfg.registerLabel}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No providers match your search.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <ProviderCard key={p.id} provider={p} ac={ac} onSelect={() => { setSelected(p); setDetailTab('overview'); }} />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <DetailModal
          provider={selected}
          cfg={cfg}
          ac={ac}
          activeTab={detailTab}
          onTabChange={setDetailTab}
          onClose={() => setSelected(null)}
          onBook={cfg.bookingType ? (p) => { setBookingProvider(p); setBookingDone(null); } : undefined}
        />
      )}

      {/* Booking Modal */}
      {bookingProvider && cfg.bookingType && (
        <BookingModal
          provider={bookingProvider}
          bookingType={cfg.bookingType}
          ac={ac}
          submitting={bookingSubmitting}
          doneRef={bookingDone}
          onClose={() => { setBookingProvider(null); setBookingDone(null); }}
          onSubmitHire={async (payload) => {
            setBookingSubmitting(true);
            try {
              const res = await createHireBooking(payload);
              setBookingDone(res.booking?.bookingRef ?? 'Submitted');
            } catch {
              setBookingDone('Enquiry saved — provider will contact you shortly.');
            } finally {
              setBookingSubmitting(false);
            }
          }}
          onSubmitVet={async (payload) => {
            setBookingSubmitting(true);
            try {
              const res = await bookVetAppointment(payload);
              setBookingDone(res.appointment?.apptRef ?? 'Submitted');
            } catch {
              setBookingDone('Appointment request saved — provider will confirm.');
            } finally {
              setBookingSubmitting(false);
            }
          }}
        />
      )}

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-base">{cfg.registerLabel}</h2>
              <button onClick={() => setShowRegister(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {([
                ['Business Name *', 'name', 'text'],
                ['Tagline', 'tagline', 'text'],
                ['Phone *', 'phone', 'tel'],
                ['Email', 'email', 'email'],
                ['Website', 'website', 'url'],
                ['Location *', 'location', 'text'],
                ['Districts (comma-separated)', 'districts', 'text'],
                ['Operating Hours', 'operatingHours', 'text'],
                ['License Number', 'licenseNumber', 'text'],
                ['Tags (comma-separated)', 'tags', 'text'],
              ] as [string, keyof typeof form, string][]).map(([label, key, type]) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">{label}</label>
                  <input
                    type={type}
                    className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Description</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <button
                onClick={handleRegister}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold ${ac.btn}`}
              >
                Save Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ProviderCard ─────────────────────────────────────────────────────────────

function ProviderCard({
  provider: p,
  ac,
  onSelect,
}: {
  provider: Provider;
  ac: ReturnType<typeof accentClasses>;
  onSelect: () => void;
}) {
  return (
    <div
      className="relative bg-card border border-border rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow flex flex-col gap-3"
      onClick={onSelect}
    >
      {p.mine && (
        <span className="absolute top-3 right-3 text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
          My Business
        </span>
      )}
      {/* Name & location */}
      <div className="pr-20">
        <div className="font-semibold text-sm leading-tight">{p.name}</div>
        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.tagline}</div>
        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
          <MapPin size={11} />
          <span>{p.location}</span>
          {p.districts.slice(0, 2).map((d) => (
            <span key={d} className="ml-1 bg-muted px-1.5 py-0.5 rounded-full text-[10px]">{d}</span>
          ))}
          {p.districts.length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{p.districts.length - 2}</span>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {p.verified && (
          <span className="flex items-center gap-1 text-[10px] font-medium bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
            <BadgeCheck size={10} /> Verified
          </span>
        )}
        {p.certified && (
          <span className="flex items-center gap-1 text-[10px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-full">
            <Shield size={10} /> Certified
          </span>
        )}
      </div>

      {/* Rating */}
      {p.ratingCount > 0 && <StarRating rating={p.ratingAvg} count={p.ratingCount} />}

      {/* Tags */}
      {p.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {p.tags.slice(0, 3).map((t) => (
            <span key={t} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      )}

      {/* Services preview */}
      {p.services.length > 0 && (
        <div className="space-y-1">
          {p.services.slice(0, 2).map((s) => (
            <div key={s.id} className="flex justify-between items-baseline text-xs">
              <span className="text-muted-foreground truncate max-w-[65%]">{s.name}</span>
              <span className="font-medium text-foreground ml-2 shrink-0">
                {s.price > 0 ? `K${s.price.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${s.unit}` : s.unit}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="flex justify-end mt-auto pt-1">
        <span className="flex items-center gap-1 text-xs font-medium text-primary">
          View Profile <ChevronRight size={13} />
        </span>
      </div>
    </div>
  );
}

// ─── DetailModal ──────────────────────────────────────────────────────────────

function DetailModal({
  provider: p,
  cfg,
  ac,
  activeTab,
  onTabChange,
  onClose,
  onBook,
}: {
  provider: Provider;
  cfg: ProviderDirectoryConfig;
  ac: ReturnType<typeof accentClasses>;
  activeTab: 'overview' | 'services' | 'reviews' | 'certs';
  onTabChange: (t: 'overview' | 'services' | 'reviews' | 'certs') => void;
  onClose: () => void;
  onBook?: (p: Provider) => void;
}) {
  const detailTabs: { key: 'overview' | 'services' | 'reviews' | 'certs'; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'services', label: `Services (${p.services.length})` },
    { key: 'reviews', label: `Reviews (${p.reviews.length})` },
    { key: 'certs', label: 'Certifications' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
      <div className="bg-background border border-border rounded-xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-base">{p.name}</h2>
              {p.verified && (
                <span className="flex items-center gap-1 text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                  <BadgeCheck size={10} /> Verified
                </span>
              )}
              {p.certified && (
                <span className="flex items-center gap-1 text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-full">
                  <Shield size={10} /> Certified
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{p.tagline}</p>
            {p.ratingCount > 0 && <div className="mt-1"><StarRating rating={p.ratingAvg} count={p.ratingCount} /></div>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"><X size={18} /></button>
        </div>

        {/* Contact Strip */}
        <div className="px-5 py-3 border-b border-border bg-muted/40 shrink-0">
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin size={11} />{p.location}</span>
            <span className="flex items-center gap-1"><Phone size={11} />{p.phone}</span>
            <span className="flex items-center gap-1"><Mail size={11} />{p.email}</span>
            {p.website && <span className="flex items-center gap-1"><Globe size={11} />{p.website}</span>}
            {p.operatingHours && <span className="flex items-center gap-1"><Clock size={11} />{p.operatingHours}</span>}
            {p.licenseNumber && <span className="flex items-center gap-1"><Tag size={11} />Lic: {p.licenseNumber}</span>}
          </div>
        </div>

        {/* Inner Tabs */}
        <div className="flex gap-0 border-b border-border shrink-0 px-5 pt-0">
          {detailTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">{p.description}</p>
              {p.districts.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Coverage Areas</div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.districts.map((d) => (
                      <span key={d} className="text-xs bg-muted px-2.5 py-1 rounded-full">{d}</span>
                    ))}
                  </div>
                </div>
              )}
              {p.coverageType && (
                <div className="text-xs text-muted-foreground">Coverage type: <span className="font-medium text-foreground capitalize">{p.coverageType}</span></div>
              )}
              {p.tags.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Tags</div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span key={t} className={`text-xs px-2.5 py-1 rounded-full ${ac.pill}`}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {cfg.renderExtras && cfg.renderExtras(p)}
            </div>
          )}

          {activeTab === 'services' && (
            p.services.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">No services listed yet.</div>
            ) : (
              <div className="space-y-3">
                {p.services.map((s) => (
                  <div key={s.id} className="border border-border rounded-lg p-3 bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{s.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{s.description}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold text-sm">
                          {s.price > 0 ? `K${s.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'POA'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{s.unit}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{s.category}</span>
                      {s.available ? (
                        <span className="text-[10px] text-green-600 flex items-center gap-1"><CheckCircle size={10} /> Available</span>
                      ) : (
                        <span className="text-[10px] text-red-500">Unavailable</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'reviews' && (
            p.reviews.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">No reviews yet.</div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <StarRating rating={p.ratingAvg} count={p.ratingCount} />
                  <span className="text-xs text-muted-foreground">average rating</span>
                </div>
                {p.reviews.map((r) => (
                  <div key={r.id} className="border border-border rounded-lg p-3 bg-card space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs">{r.reviewerName}</span>
                      <span className="text-[10px] text-muted-foreground">{relTime(r.createdAt)}</span>
                    </div>
                    <StarRating rating={r.rating} count={0} />
                    <p className="text-xs text-muted-foreground leading-relaxed">{r.comment}</p>
                    <div className="text-[10px] text-muted-foreground">Service: {r.serviceUsed}</div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'certs' && (
            p.certifications.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">No certifications uploaded.</div>
            ) : (
              <div className="space-y-2">
                {p.certifications.map((c, i) => (
                  <div key={i} className="border border-border rounded-lg p-3 bg-card grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div><div className="text-[10px] text-muted-foreground mb-0.5">Body</div><div className="font-medium">{c.body}</div></div>
                    <div><div className="text-[10px] text-muted-foreground mb-0.5">Type</div><div>{c.certType}</div></div>
                    <div><div className="text-[10px] text-muted-foreground mb-0.5">Number</div><div className="font-mono text-xs">{c.certNumber}</div></div>
                    <div><div className="text-[10px] text-muted-foreground mb-0.5">Expires</div><div>{c.expires ?? '—'}</div></div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/30 flex flex-wrap gap-2 shrink-0">
          <a
            href={`tel:${p.phone}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 border border-border"
          >
            📞 Call
          </a>
          <a
            href={`mailto:${p.email}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 border border-border"
          >
            ✉️ Email
          </a>
          {p.website && (
            <a
              href={`https://${p.website.replace(/^https?:\/\//, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 border border-border"
            >
              🌐 Website
            </a>
          )}
          {onBook && !p.mine && (
            <button
              onClick={() => onBook(p)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold ${ac.btn}`}
            >
              <CalendarDays size={13} /> Book / Enquire
            </button>
          )}
          {p.mine && (
            <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 border border-border">
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BookingModal ─────────────────────────────────────────────────────────────

function BookingModal({
  provider: p,
  bookingType,
  ac,
  submitting,
  doneRef,
  onClose,
  onSubmitHire,
  onSubmitVet,
}: {
  provider: Provider;
  bookingType: BookingType;
  ac: ReturnType<typeof accentClasses>;
  submitting: boolean;
  doneRef: string | null;
  onClose: () => void;
  onSubmitHire: (payload: HireBookingPayload) => Promise<void>;
  onSubmitVet: (payload: VetAppointmentPayload) => Promise<void>;
}) {
  const today = new Date().toISOString().split('T')[0];

  // Hire form state
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate]     = useState(today);
  const [hectares, setHectares]   = useState('');
  const [delivery, setDelivery]   = useState('');
  const [hireNotes, setHireNotes] = useState('');

  // Vet form state
  const [apptType, setApptType]     = useState('consultation');
  const [apptDate, setApptDate]     = useState(today);
  const [species, setSpecies]       = useState('');
  const [animalCount, setAnimalCount] = useState('');
  const [symptoms, setSymptoms]     = useState('');
  const [vetNotes, setVetNotes]     = useState('');

  // Enquiry form state
  const [enquiryMsg, setEnquiryMsg] = useState('');

  function handleSubmit() {
    if (bookingType === 'hire') {
      onSubmitHire({
        providerId: p.id,
        startDate,
        endDate,
        hectares: hectares ? parseFloat(hectares) : undefined,
        deliveryAddress: delivery || undefined,
        notes: hireNotes || undefined,
      });
    } else if (bookingType === 'vet') {
      onSubmitVet({
        providerId: p.id,
        apptType,
        apptDate,
        species: species || undefined,
        animalCount: animalCount ? parseInt(animalCount, 10) : undefined,
        symptoms: symptoms || undefined,
        notes: vetNotes || undefined,
      });
    } else {
      // enquiry — store locally as a pending request
      onSubmitVet({
        providerId: p.id,
        apptType: 'consultation',
        apptDate: today,
        notes: enquiryMsg,
      });
    }
  }

  const VET_TYPES = [
    ['consultation','General Consultation'],
    ['vaccination','Vaccination'],
    ['treatment','Treatment / Procedure'],
    ['diagnosis','Diagnosis / Lab'],
    ['deworming','Deworming'],
    ['pregnancy','Pregnancy Check'],
    ['teleconsult','Teleconsultation (Remote)'],
    ['other','Other'],
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-background border border-border rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-sm">
              {bookingType === 'hire' ? '🚜 Book Equipment' : bookingType === 'vet' ? '🩺 Book Vet Service' : '✉️ Send Enquiry'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{p.name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="px-5 py-4">
          {/* Done state */}
          {doneRef ? (
            <div className="text-center py-8 space-y-3">
              <div className="text-4xl">✅</div>
              <div className="font-semibold">Request submitted!</div>
              {doneRef.startsWith('HB-') || doneRef.startsWith('VA-') ? (
                <div className="text-xs text-muted-foreground">
                  Reference: <span className="font-mono font-semibold text-foreground">{doneRef}</span>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">{doneRef}</div>
              )}
              <p className="text-xs text-muted-foreground">{p.name} will contact you on {p.phone}.</p>
              <button onClick={onClose} className={`mt-2 px-6 py-2 rounded-lg text-sm font-medium ${ac.btn}`}>Close</button>
            </div>
          ) : bookingType === 'hire' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Start Date *</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">End Date *</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Hectares (optional)</label>
                <input type="number" value={hectares} onChange={e => setHectares(e.target.value)}
                  placeholder="e.g. 5.0"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Delivery / Site Address</label>
                <input type="text" value={delivery} onChange={e => setDelivery(e.target.value)}
                  placeholder="Farm location or GPS coordinates"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Notes</label>
                <textarea rows={3} value={hireNotes} onChange={e => setHireNotes(e.target.value)}
                  placeholder="Equipment type, soil conditions, any special requirements…"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none resize-none" />
              </div>
            </div>
          ) : bookingType === 'vet' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Service Type *</label>
                <select value={apptType} onChange={e => setApptType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none">
                  {VET_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Appointment Date *</label>
                <input type="date" value={apptDate} onChange={e => setApptDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Species</label>
                  <input type="text" value={species} onChange={e => setSpecies(e.target.value)}
                    placeholder="e.g. Broilers, Tilapia"
                    className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Animal Count</label>
                  <input type="number" value={animalCount} onChange={e => setAnimalCount(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Symptoms / Reason</label>
                <textarea rows={2} value={symptoms} onChange={e => setSymptoms(e.target.value)}
                  placeholder="Describe symptoms or what the visit is for…"
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Additional Notes</label>
                <textarea rows={2} value={vetNotes} onChange={e => setVetNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none resize-none" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Send a message to <strong>{p.name}</strong>. They will respond via phone or email.</p>
              <textarea rows={5} value={enquiryMsg} onChange={e => setEnquiryMsg(e.target.value)}
                placeholder="Describe what you need, quantities, location, timing…"
                className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none resize-none" />
            </div>
          )}

          {!doneRef && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`mt-4 w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${ac.btn} disabled:opacity-60`}
            >
              {submitting ? <><Loader2 size={14} className="animate-spin" />Submitting…</> : 'Submit Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
