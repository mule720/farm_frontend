// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Marketplace Base
// Shared components used by AgriFood, AgriSupply, AgriServices
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import { Plus, X, Search, Star, MapPin, Phone, ChevronRight, Tag } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// ─── Types ───────────────────────────────────────────────────────────────────
export type ListingStatus = 'active' | 'sold' | 'inactive';

export interface Listing {
  id: string;
  title: string;
  description?: string;
  category: string;
  subCategory?: string;
  price: number;
  unit?: string;
  priceNegotiable?: boolean;
  qty?: number;
  location?: string;
  sellerName: string;
  sellerPhone?: string;
  tags?: string[];
  status: ListingStatus;
  postedDate: string;
  mine: boolean;   // true = posted by this org
  createdAt: string;
}

// ─── Storage helper ───────────────────────────────────────────────────────────
export function useListings(storageKey: string) {
  const [listings, setListings] = useState<Listing[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? '[]'); } catch { return []; }
  });
  React.useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(listings)); }, [listings]);

  function addListing(l: Omit<Listing, 'id' | 'createdAt'>) {
    const item = { ...l, id: uuidv4(), createdAt: new Date().toISOString() };
    setListings(prev => [...prev, item]);
    return item;
  }
  function updateListing(id: string, patch: Partial<Listing>) {
    setListings(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  }
  function deleteListing(id: string) {
    setListings(prev => prev.filter(l => l.id !== id));
  }
  return { listings, addListing, updateListing, deleteListing };
}

// ─────────────────────────────────────────────────────────────────────────────
// Marketplace Shell — renders both the listing browser and "My Listings"
// ─────────────────────────────────────────────────────────────────────────────
interface MarketplaceConfig {
  storageKey: string;
  title: string;
  icon: string;
  accent: string;            // Tailwind color name e.g. "orange", "teal", "blue"
  categories: string[];
  defaultUnit?: string;
  newListingLabel?: string;
  mockListings?: Listing[];  // pre-seeded demo listings
}

export function MarketplaceShell({ cfg }: { cfg: MarketplaceConfig }) {
  const { listings: stored, addListing, updateListing, deleteListing } = useListings(cfg.storageKey);
  const [tab, setTab] = useState<'browse' | 'mine'>('browse');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [selected, setSelected] = useState<Listing | null>(null);
  const [showNew, setShowNew] = useState(false);

  // Merge stored + mock (deduped by id)
  const allListings = useMemo(() => {
    const mock = (cfg.mockListings ?? []).filter(m => !stored.find(s => s.id === m.id));
    return [...stored, ...mock].filter(l => l.status === 'active' || l.mine);
  }, [stored, cfg.mockListings]);

  const browsable = allListings.filter(l => l.status === 'active' && !l.mine);
  const mine      = allListings.filter(l => l.mine);

  const filtered = useMemo(() => {
    const base = tab === 'browse' ? browsable : mine;
    return base.filter(l => {
      const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase()) || (l.description ?? '').toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === 'all' || l.category === filterCat;
      return matchSearch && matchCat;
    });
  }, [browsable, mine, tab, search, filterCat]);

  const accentBg  = `bg-${cfg.accent}-600`;
  const accentHov = `hover:bg-${cfg.accent}-700`;
  const accentFocus = `focus:ring-${cfg.accent}-400`;

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 border-r border-slate-200 bg-white`}>
        <div className="px-4 py-4 border-b border-slate-100 flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{cfg.icon}</span>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">{cfg.title}</h2>
                <p className="text-xs text-slate-400">{browsable.length} listings</p>
              </div>
            </div>
            <button onClick={() => setShowNew(true)}
              className={`flex items-center gap-1 px-3 py-1.5 ${accentBg} ${accentHov} text-white rounded-lg text-xs font-medium`}>
              <Plus className="w-3.5 h-3.5" /> {cfg.newListingLabel ?? 'Post Listing'}
            </button>
          </div>
          <div className="flex gap-1">
            {(['browse', 'mine'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg capitalize ${tab === t ? `bg-${cfg.accent}-100 text-${cfg.accent}-700` : 'text-slate-500 hover:bg-slate-100'}`}>
                {t === 'browse' ? 'Browse' : `My Listings (${mine.length})`}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search listings…"
              className={`w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${accentFocus}`} />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className={`w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 ${accentFocus}`}>
            <option value="all">All Categories</option>
            {cfg.categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">{tab === 'browse' ? 'No listings found.' : 'You have no listings yet.'}</p>
            </div>
          )}
          {filtered.map(l => (
            <ListingCard key={l.id} listing={l} selected={selected?.id === l.id} accent={cfg.accent} onClick={() => setSelected(l)} />
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className={`${selected ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-slate-50 min-w-0`}>
        {selected ? (
          <ListingDetail
            listing={selected}
            accent={cfg.accent}
            onClose={() => setSelected(null)}
            onUpdate={patch => { updateListing(selected.id, { ...patch }); setSelected(s => s ? { ...s, ...patch } : s); }}
            onDelete={() => { deleteListing(selected.id); setSelected(null); }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <span className="text-5xl mb-4">{cfg.icon}</span>
            <p className="text-sm">Select a listing to view details</p>
          </div>
        )}
      </div>

      {showNew && (
        <NewListingModal
          categories={cfg.categories}
          defaultUnit={cfg.defaultUnit}
          accent={cfg.accent}
          onSave={data => { addListing({ ...data, mine: true, status: 'active', postedDate: new Date().toISOString().slice(0, 10) }); setShowNew(false); }}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  );
}

// ─── Listing Card ─────────────────────────────────────────────────────────────
function ListingCard({ listing, selected, accent, onClick }: { listing: Listing; selected: boolean; accent: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left p-3.5 rounded-xl border transition-all ${selected ? `bg-${accent}-50 border-${accent}-200` : 'hover:bg-slate-50 border-transparent'}`}>
      <div className="flex items-start gap-2.5">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-slate-800 truncate">{listing.title}</div>
          <div className="text-xs text-slate-400 mt-0.5 truncate">{listing.category}{listing.subCategory ? ` · ${listing.subCategory}` : ''}</div>
          {listing.location && <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5"><MapPin className="w-3 h-3" />{listing.location}</div>}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-bold text-slate-700">
            {listing.price.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            {listing.unit && <span className="text-xs text-slate-400 font-normal">/{listing.unit}</span>}
          </div>
          {listing.priceNegotiable && <div className="text-[10px] text-slate-400">negotiable</div>}
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-slate-500">{listing.sellerName}</span>
        {listing.mine && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">My listing</span>}
      </div>
    </button>
  );
}

// ─── Listing Detail ───────────────────────────────────────────────────────────
function ListingDetail({ listing, accent, onClose, onUpdate, onDelete }: {
  listing: Listing; accent: string;
  onClose: () => void;
  onUpdate: (p: Partial<Listing>) => void;
  onDelete: () => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h2 className="font-bold text-slate-900">{listing.title}</h2>
            <div className="text-xs text-slate-400 mt-0.5">{listing.category}{listing.subCategory ? ` · ${listing.subCategory}` : ''}</div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg lg:hidden"><X className="w-4 h-4" /></button>
        </div>
        {/* Price */}
        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900">
            {listing.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            {listing.unit && <span className="text-sm text-slate-400 font-normal ml-1">/ {listing.unit}</span>}
          </div>
          {listing.priceNegotiable && <div className="text-xs text-slate-500 mt-0.5">Price negotiable</div>}
          {listing.qty && <div className="text-xs text-slate-500 mt-0.5">Available: {listing.qty} {listing.unit ?? 'units'}</div>}
        </div>
        {/* Actions */}
        {listing.mine && !editMode && (
          <div className="flex gap-2 mt-3">
            <button onClick={() => setEditMode(true)} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-200">Edit</button>
            <button onClick={() => onUpdate({ status: listing.status === 'active' ? 'inactive' : 'active' })}
              className="px-3 py-2 bg-amber-100 text-amber-700 rounded-xl text-xs font-medium hover:bg-amber-200">
              {listing.status === 'active' ? 'Deactivate' : 'Reactivate'}
            </button>
            {confirmDel ? (
              <><button onClick={onDelete} className="px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-medium">Confirm Delete</button>
              <button onClick={() => setConfirmDel(false)} className="px-3 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs">Cancel</button></>
            ) : (
              <button onClick={() => setConfirmDel(true)} className="px-3 py-2 border border-red-200 text-red-500 rounded-xl text-xs hover:bg-red-50">Delete</button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {editMode ? (
          <EditListingForm listing={listing} accent={accent} onSave={p => { onUpdate(p); setEditMode(false); }} onCancel={() => setEditMode(false)} />
        ) : (
          <ViewListing listing={listing} accent={accent} />
        )}
      </div>
    </div>
  );
}

function ViewListing({ listing, accent }: { listing: Listing; accent: string }) {
  return (
    <div className="max-w-lg space-y-4">
      {listing.description && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Description</h3>
          <p className="text-sm text-slate-700 leading-relaxed">{listing.description}</p>
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Seller</h3>
        <div className="text-sm font-medium text-slate-800">{listing.sellerName}</div>
        {listing.sellerPhone && (
          <a href={`tel:${listing.sellerPhone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <Phone className="w-4 h-4" />{listing.sellerPhone}
          </a>
        )}
        {listing.location && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="w-4 h-4" />{listing.location}
          </div>
        )}
        <div className="text-xs text-slate-400">Posted {new Date(listing.postedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>
      {listing.tags && listing.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {listing.tags.map(t => (
            <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs"><Tag className="w-3 h-3" />{t}</span>
          ))}
        </div>
      )}
      {listing.sellerPhone && (
        <a href={`tel:${listing.sellerPhone}`}
          className={`flex items-center justify-center gap-2 w-full py-3 bg-${accent}-600 hover:bg-${accent}-700 text-white rounded-xl text-sm font-medium`}>
          <Phone className="w-4 h-4" /> Call Seller
        </a>
      )}
    </div>
  );
}

function EditListingForm({ listing, accent, onSave, onCancel }: { listing: Listing; accent: string; onSave: (p: Partial<Listing>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ ...listing });
  function set(k: keyof Listing, v: any) { setForm(f => ({ ...f, [k]: v })); }
  return (
    <div className="max-w-md space-y-3">
      <Field label="Title"><input className={INP} value={form.title} onChange={e => set('title', e.target.value)} /></Field>
      <Field label="Price"><input type="number" step="any" className={INP} value={form.price} onChange={e => set('price', parseFloat(e.target.value) || 0)} /></Field>
      <Field label="Unit"><input className={INP} value={form.unit ?? ''} onChange={e => set('unit', e.target.value || undefined)} /></Field>
      <Field label="Available Qty"><input type="number" className={INP} value={form.qty ?? ''} onChange={e => set('qty', parseFloat(e.target.value) || undefined)} /></Field>
      <Field label="Description"><textarea className={INP + ' resize-none'} rows={3} value={form.description ?? ''} onChange={e => set('description', e.target.value || undefined)} /></Field>
      <Field label="Location"><input className={INP} value={form.location ?? ''} onChange={e => set('location', e.target.value || undefined)} /></Field>
      <Field label="Phone"><input className={INP} value={form.sellerPhone ?? ''} onChange={e => set('sellerPhone', e.target.value || undefined)} /></Field>
      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
        <input type="checkbox" checked={form.priceNegotiable ?? false} onChange={e => set('priceNegotiable', e.target.checked)} className="rounded" />
        Price negotiable
      </label>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600">Cancel</button>
        <button onClick={() => onSave(form)} className={`flex-1 py-2.5 bg-${accent}-600 hover:bg-${accent}-700 text-white rounded-xl text-sm font-medium`}>Save</button>
      </div>
    </div>
  );
}

// ─── New Listing Modal ─────────────────────────────────────────────────────────
function NewListingModal({ categories, defaultUnit, accent, onSave, onClose }: {
  categories: string[]; defaultUnit?: string; accent: string;
  onSave: (d: Omit<Listing, 'id' | 'createdAt' | 'mine' | 'status' | 'postedDate'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ title: '', category: categories[0] ?? '', description: '', price: '', unit: defaultUnit ?? '', qty: '', location: '', sellerName: '', sellerPhone: '', priceNegotiable: false, tags: '' });
  function set(k: keyof typeof form, v: any) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="font-bold text-slate-900">Post New Listing</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <Field label="Title *"><input className={INP} placeholder="e.g. Broiler Chickens – 500 birds ready" value={form.title} onChange={e => set('title', e.target.value)} /></Field>
          <Field label="Category">
            <select className={INP} value={form.category} onChange={e => set('category', e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price *"><input type="number" step="any" className={INP} placeholder="0.00" value={form.price} onChange={e => set('price', e.target.value)} /></Field>
            <Field label="Unit"><input className={INP} placeholder="kg / bird / bag" value={form.unit} onChange={e => set('unit', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity Available"><input type="number" className={INP} value={form.qty} onChange={e => set('qty', e.target.value)} /></Field>
            <Field label="Location"><input className={INP} placeholder="e.g. Lusaka" value={form.location} onChange={e => set('location', e.target.value)} /></Field>
          </div>
          <Field label="Description"><textarea className={INP + ' resize-none'} rows={3} placeholder="Describe what you're selling…" value={form.description} onChange={e => set('description', e.target.value)} /></Field>
          <Field label="Your Name"><input className={INP} value={form.sellerName} onChange={e => set('sellerName', e.target.value)} /></Field>
          <Field label="Phone"><input className={INP} placeholder="+260…" value={form.sellerPhone} onChange={e => set('sellerPhone', e.target.value)} /></Field>
          <Field label="Tags (comma-separated)"><input className={INP} placeholder="e.g. organic, fresh, bulk" value={form.tags} onChange={e => set('tags', e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={form.priceNegotiable} onChange={e => set('priceNegotiable', e.target.checked)} className="rounded" />
            Price negotiable
          </label>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600">Cancel</button>
          <button
            onClick={() => onSave({
              title: form.title, category: form.category, description: form.description || undefined,
              price: parseFloat(form.price) || 0, unit: form.unit || undefined, qty: parseFloat(form.qty) || undefined,
              location: form.location || undefined, sellerName: form.sellerName || 'Me', sellerPhone: form.sellerPhone || undefined,
              priceNegotiable: form.priceNegotiable,
              tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
            })}
            disabled={!form.title.trim() || !form.price}
            className={`flex-1 py-2.5 bg-${accent}-600 hover:bg-${accent}-700 text-white rounded-xl text-sm font-medium disabled:opacity-50`}>
            Post Listing
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const INP = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300';
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
