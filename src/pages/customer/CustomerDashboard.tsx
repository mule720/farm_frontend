// ─────────────────────────────────────────────────────────────────────────────
// CustomerDashboard — for individual (non-business) registered users
// Lets customers browse the marketplace, manage their profile, view activity
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sprout, Store, User, Bell, LogOut, Home, Heart, Phone,
  MapPin, BadgeCheck, ChevronRight, Star, Search, X, Video,
  ShoppingCart, Package, Settings, ArrowRight, Stethoscope,
  Wrench, Leaf, Truck, Menu,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MarketItem {
  id: string;
  type: 'provider' | 'product';
  category: string;
  name: string;
  tagline?: string;
  seller?: string;
  location: string;
  phone: string;
  rating?: number;
  ratingCount?: number;
  verified?: boolean;
  tags?: string[];
  description: string;
  priceFrom?: string;
  price?: number;
  unit?: string;
  qty?: number;
}

// ─── Mock marketplace data (same catalogue as landing) ────────────────────────

const ALL_ITEMS: MarketItem[] = [
  { id: 'v1', type: 'provider', category: 'Vet Services',   name: 'AgriVet Zambia',            tagline: 'Mobile vet — poultry, livestock & aquaculture', location: 'Lusaka',   phone: '+260 977 210001', rating: 4.8, ratingCount: 73,  verified: true,  tags: ['VBZ Registered','Mobile','24/7'],          description: 'Full-service mobile vet. Farm visits, vaccinations, post-mortems, AI services.', priceFrom: 'ZMW 120/visit' },
  { id: 'v2', type: 'provider', category: 'Vet Services',   name: 'Central Veterinary Clinic',  tagline: 'Full-service clinic — Lusaka',                  location: 'Lusaka',   phone: '+260 955 220002', rating: 4.5, ratingCount: 112, verified: true,  tags: ['Clinic','Lab','Surgery'],                   description: 'On-site lab, cold-chain vaccines, surgery. Walk-in Mon–Sat.', priceFrom: 'ZMW 200/consult' },
  { id: 'v3', type: 'provider', category: 'Vet Services',   name: 'Aqua Health Vets',           tagline: 'Aquaculture & fishery specialists',              location: 'Siavonga', phone: '+260 966 230003', rating: 4.9, ratingCount: 22,  verified: true,  tags: ['Aquaculture','Tilapia','Catfish'],           description: "Zambia's only dedicated aquaculture vet service.",             priceFrom: 'ZMW 400/visit' },
  { id: 'v4', type: 'provider', category: 'Vet Services',   name: 'TeleFarm Vet',               tagline: 'Remote consultation — nationwide',              location: 'Online',   phone: '+260 955 217005', rating: 4.6, ratingCount: 38,  verified: true,  tags: ['Teleconsultation','Video','2-Hour SLA'],    description: 'Video & WhatsApp consultations. Diagnosis within 2 hours.',    priceFrom: 'ZMW 80/session' },
  { id: 'e1', type: 'provider', category: 'Equipment Hire', name: 'ZamTractor Hire Co',         tagline: 'Tractors & implements',                         location: 'Lusaka',   phone: '+260 977 310001', rating: 4.7, ratingCount: 64,  verified: true,  tags: ['Tractors','Planting','Harvesting'],         description: 'Full fleet of 50–120HP tractors. Operator included.',         priceFrom: 'ZMW 850/hr' },
  { id: 'e2', type: 'provider', category: 'Equipment Hire', name: 'IrrigaLet Solutions',        tagline: 'Drip & sprinkler irrigation rental',            location: 'Chisamba', phone: '+260 955 320002', rating: 4.5, ratingCount: 31,  verified: true,  tags: ['Drip','Sprinklers','Installation'],         description: 'Rent complete irrigation systems. Setup included.',            priceFrom: 'ZMW 1,200/ha' },
  { id: 'e3', type: 'provider', category: 'Equipment Hire', name: 'AeroCrop Zambia',            tagline: 'Drone spraying & mapping',                     location: 'Lusaka',   phone: '+260 966 330003', rating: 4.8, ratingCount: 19,  verified: true,  tags: ['Drone','Mapping','Precision'],              description: 'Agricultural drones: mapping, NDVI, precision spraying.',       priceFrom: 'ZMW 180/ha' },
  { id: 'a1', type: 'provider', category: 'Agro Dealers',   name: 'AgriInput Distributors Ltd', tagline: "Zambia's leading agro-input supplier",          location: 'Lusaka',   phone: '+260 977 110001', rating: 4.6, ratingCount: 89,  verified: true,  tags: ['SCCI Certified','Pioneer Dealer','Seeds'],  description: 'Full-range agro-dealer. Seeds, fertilisers, chemicals.',       priceFrom: 'ZMW 180/10kg seed' },
  { id: 'a2', type: 'provider', category: 'Agro Dealers',   name: 'FeedMills Zambia',           tagline: 'Complete animal nutrition solutions',           location: 'Lusaka',   phone: '+260 955 120002', rating: 4.8, ratingCount: 142, verified: true,  tags: ['Own Mill','Poultry Feed','Bulk Orders'],    description: 'Manufacturer of broiler, layer, and livestock feeds.',         priceFrom: 'ZMW 295/50kg' },
  { id: 'f1', type: 'product',  category: 'AgriFood',       name: 'Broiler Chickens – 500 birds', seller: 'KwaZuma Farms',         location: 'Lusaka',   phone: '+260 977 001001', price: 58,  unit: 'bird', qty: 500, description: 'Live broilers 42–45 days, 2.1–2.3kg avg liveweight.' },
  { id: 'f2', type: 'product',  category: 'AgriFood',       name: 'Fresh Grade-A Tilapia',        seller: 'Lake Fresh Aqua',      location: 'Siavonga', phone: '+260 955 002002', price: 32,  unit: 'kg',   qty: 800, description: 'Freshly harvested tilapia, 300–500g. Iced delivery 24h.' },
  { id: 'f3', type: 'product',  category: 'AgriFood',       name: 'Organic Tomatoes',             seller: 'Greenfield Hort',      location: 'Chisamba', phone: '+260 966 003003', price: 8,   unit: 'kg',   qty: 2000, description: 'GAP-certified organic tomatoes. No chemical residues.' },
  { id: 'f4', type: 'product',  category: 'AgriFood',       name: 'Whole Maize – 50kg Bags',      seller: 'Central Grain Co',     location: 'Kabwe',    phone: '+260 977 004004', price: 175, unit: 'bag',  qty: 300, description: 'Dried, cleaned maize. 14% moisture. ZABS tested.' },
  { id: 's1', type: 'product',  category: 'AgriSupply',     name: 'Pioneer 30Y87 Maize Seed',     seller: 'AgriInput Distributors',location: 'Lusaka',  phone: '+260 977 110001', price: 380, unit: 'pack', qty: 150, description: 'SCCI-certified Pioneer 30Y87 hybrid seed, 10kg packs.' },
  { id: 's2', type: 'product',  category: 'AgriSupply',     name: 'D-Compound NPK 10-20-10',      seller: 'AgriInput Distributors',location: 'Lusaka',  phone: '+260 977 110001', price: 480, unit: 'bag',  qty: 400, description: 'Basal dressing fertiliser for maize, soya. 50kg bags.' },
  { id: 'r1', type: 'provider', category: 'AgriServices',   name: 'Zambia Crop Advisory',       tagline: 'Agronomic consulting & farm planning',         location: 'Lusaka',   phone: '+260 977 410001', rating: 4.7, ratingCount: 38,  verified: true,  tags: ['Agronomy','Farm Planning','Soil Testing'],  description: 'Soil mapping, crop management plans, IPM programmes.',         priceFrom: undefined },
  { id: 'r2', type: 'provider', category: 'AgriServices',   name: 'AgriLab Zambia',             tagline: 'Accredited soil & water testing lab',          location: 'Lusaka',   phone: '+260 955 420002', rating: 4.8, ratingCount: 55,  verified: true,  tags: ['Accredited','Soil Testing','Aflatoxin'],    description: 'ZABS-accredited lab. 5-day turnaround.',                       priceFrom: undefined },
];

const CATEGORIES = [
  { key: 'All',           icon: <Store className="w-3.5 h-3.5" /> },
  { key: 'Vet Services',  icon: <Stethoscope className="w-3.5 h-3.5" /> },
  { key: 'Equipment Hire',icon: <Wrench className="w-3.5 h-3.5" /> },
  { key: 'Agro Dealers',  icon: <Leaf className="w-3.5 h-3.5" /> },
  { key: 'AgriFood',      icon: <ShoppingCart className="w-3.5 h-3.5" /> },
  { key: 'AgriSupply',    icon: <Package className="w-3.5 h-3.5" /> },
  { key: 'AgriServices',  icon: <Truck className="w-3.5 h-3.5" /> },
];

type Page = 'home' | 'marketplace' | 'saved' | 'profile';

// ─── Stars ─────────────────────────────────────────────────────────────────────

function Stars({ r }: { r: number }) {
  return <span className="flex items-center gap-px">{[1,2,3,4,5].map(i => <span key={i} className={`text-[9px] ${i <= Math.round(r) ? 'text-amber-400' : 'text-slate-300'}`}>★</span>)}</span>;
}

// ─── Item card ─────────────────────────────────────────────────────────────────

function ItemCard({ item, saved, onSave, onSelect }: { item: MarketItem; saved: boolean; onSave: () => void; onSelect: () => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md hover:border-green-300 transition-all group">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-semibold px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full">{item.category}</span>
        <button onClick={onSave} className={`p-1 rounded-lg transition-colors ${saved ? 'text-red-500' : 'text-slate-300 hover:text-red-400'}`}>
          <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
        </button>
      </div>
      <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-1 group-hover:text-green-700 transition-colors">{item.name}</h3>
      {item.tagline && <p className="text-xs text-slate-500 mb-2 line-clamp-1">{item.tagline}</p>}
      {item.type === 'product' && (
        <div className="text-sm font-bold text-slate-800 mb-1">ZMW {item.price}<span className="text-xs font-normal text-slate-400">/{item.unit}</span></div>
      )}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
        <MapPin className="w-3 h-3 flex-shrink-0" />{item.location}
        {item.verified && <span className="flex items-center gap-0.5 text-green-600 font-medium"><BadgeCheck className="w-3 h-3" />Verified</span>}
      </div>
      {item.rating !== undefined && (
        <div className="flex items-center gap-1.5 mb-3">
          <Stars r={item.rating} />
          <span className="text-xs text-slate-400">{item.rating} ({item.ratingCount})</span>
        </div>
      )}
      <div className="flex gap-2 mt-3">
        <a href={`tel:${item.phone}`} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
          <Phone className="w-3 h-3" /> Call
        </a>
        <button onClick={onSelect} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
          Details <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Detail drawer ─────────────────────────────────────────────────────────────

function DetailDrawer({ item, onClose }: { item: MarketItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-green-700 to-emerald-800 px-5 py-4 flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold text-green-200 uppercase tracking-wider">{item.category}</span>
            <h2 className="text-white font-bold text-lg leading-tight mt-0.5">{item.name}</h2>
            {item.tagline && <p className="text-green-200 text-sm">{item.tagline}</p>}
          </div>
          <button onClick={onClose} className="text-green-200 hover:text-white mt-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          {item.type === 'product' ? (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">ZMW {item.price}</span>
              <span className="text-sm text-slate-500">/{item.unit} · {item.qty?.toLocaleString()} available</span>
            </div>
          ) : item.priceFrom ? (
            <div className="text-sm text-slate-600">From <span className="font-semibold text-slate-900">{item.priceFrom}</span></div>
          ) : null}
          <p className="text-slate-700 text-sm leading-relaxed">{item.description}</p>
          {item.rating !== undefined && (
            <div className="flex items-center gap-2">
              <Stars r={item.rating} />
              <span className="text-sm text-slate-600">{item.rating} · {item.ratingCount} reviews</span>
            </div>
          )}
          {item.tags && (
            <div className="flex flex-wrap gap-1.5">{item.tags.map(t => <span key={t} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{t}</span>)}</div>
          )}
          <div className="flex items-center gap-2 text-sm text-slate-600 pt-1">
            <MapPin className="w-4 h-4 text-slate-400" />{item.location}
            {item.seller && <><span className="text-slate-300">·</span> {item.seller}</>}
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <a href={`tel:${item.phone}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Phone className="w-4 h-4" /> Call directly
          </a>
          {item.tags?.includes('Video') && (
            <button className="flex items-center gap-1.5 px-3 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
              <Video className="w-4 h-4" /> Video
            </button>
          )}
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold">
            {item.type === 'product' ? <><ShoppingCart className="w-4 h-4" /> Order</> : <><ArrowRight className="w-4 h-4" /> Enquire</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function CustomerDashboard({ onSignOut }: { onSignOut: () => void }) {
  const { profile, signOut } = useAuth();
  const [page, setPage] = useState<Page>('home');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<MarketItem | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const filtered = ALL_ITEMS.filter(i => {
    const matchCat = category === 'All' || i.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || (i.tagline ?? '').toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  function toggleSave(id: string) {
    setSaved(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSignOut() {
    await signOut();
    onSignOut();
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ─── Top nav ──────────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center">
              <Sprout className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">AgroNexus</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {([['home','Home',<Home className="w-4 h-4"/>],['marketplace','Marketplace',<Store className="w-4 h-4"/>],['saved','Saved',<Heart className="w-4 h-4"/>],['profile','Profile',<User className="w-4 h-4"/>]] as [Page,string,React.ReactNode][]).map(([p,label,icon]) => (
              <button key={p} onClick={() => setPage(p)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-green-50 text-green-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}>
                {icon}{label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                {firstName[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-green-800">{firstName}</span>
            </div>
            <button onClick={() => setMenuOpen(v => !v)} className="sm:hidden p-1.5 text-slate-500 hover:text-slate-800">
              <Menu className="w-5 h-5" />
            </button>
            <button onClick={handleSignOut} className="hidden sm:flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1">
            {([['home','Home',<Home className="w-4 h-4"/>],['marketplace','Marketplace',<Store className="w-4 h-4"/>],['saved','Saved',<Heart className="w-4 h-4"/>],['profile','Profile',<User className="w-4 h-4"/>]] as [Page,string,React.ReactNode][]).map(([p,label,icon]) => (
              <button key={p} onClick={() => { setPage(p); setMenuOpen(false); }} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${page === p ? 'bg-green-50 text-green-700' : 'text-slate-600'}`}>
                {icon}{label}
              </button>
            ))}
            <button onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        )}
      </nav>

      {/* ─── Content ──────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">

        {/* HOME ─────────────────────────────────────────────────────────────── */}
        {page === 'home' && (
          <div className="space-y-6">
            {/* Greeting */}
            <div className="bg-gradient-to-r from-green-700 to-emerald-800 rounded-2xl p-6 text-white">
              <p className="text-green-200 text-sm mb-1">Welcome back,</p>
              <h1 className="text-2xl font-bold mb-2">{profile?.full_name ?? 'Farmer'} 👋</h1>
              <p className="text-green-200 text-sm">{profile?.email}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => setPage('marketplace')} className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl border border-white/20 transition-colors">
                  <Store className="w-4 h-4" /> Browse Marketplace
                </button>
                <button onClick={() => setPage('saved')} className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl border border-white/20 transition-colors">
                  <Heart className="w-4 h-4" /> Saved ({saved.size})
                </button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Saved',    value: saved.size, icon: <Heart className="w-5 h-5 text-red-500" />,   bg: 'bg-red-50' },
                { label: 'Browsed',  value: ALL_ITEMS.length, icon: <Store className="w-5 h-5 text-blue-500" />,  bg: 'bg-blue-50' },
                { label: 'Calls',    value: 0,          icon: <Phone className="w-5 h-5 text-green-500" />, bg: 'bg-green-50' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex flex-col items-center text-center`}>
                  {s.icon}
                  <div className="text-2xl font-bold text-slate-800 mt-1">{s.value}</div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Featured providers */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-800">Featured providers</h2>
                <button onClick={() => setPage('marketplace')} className="text-xs text-green-600 hover:underline flex items-center gap-0.5">View all <ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ALL_ITEMS.filter(i => i.type === 'provider' && i.verified).slice(0, 4).map(item => (
                  <ItemCard key={item.id} item={item} saved={saved.has(item.id)} onSave={() => toggleSave(item.id)} onSelect={() => setSelected(item)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MARKETPLACE ──────────────────────────────────────────────────────── */}
        {page === 'marketplace' && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800 text-lg">Marketplace</h2>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search providers, products..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/* Category pills */}
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${category === c.key ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-600 border-slate-200 hover:border-green-300'}`}
                >
                  {c.icon} {c.key}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-400">{filtered.length} listing{filtered.length !== 1 ? 's' : ''}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(item => (
                <ItemCard key={item.id} item={item} saved={saved.has(item.id)} onSave={() => toggleSave(item.id)} onSelect={() => setSelected(item)} />
              ))}
            </div>
          </div>
        )}

        {/* SAVED ───────────────────────────────────────────────────────────── */}
        {page === 'saved' && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800 text-lg">Saved providers & products</h2>
            {saved.size === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nothing saved yet</p>
                <button onClick={() => setPage('marketplace')} className="mt-3 text-green-600 text-sm hover:underline">Browse marketplace</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ALL_ITEMS.filter(i => saved.has(i.id)).map(item => (
                  <ItemCard key={item.id} item={item} saved={true} onSave={() => toggleSave(item.id)} onSelect={() => setSelected(item)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE ─────────────────────────────────────────────────────────── */}
        {page === 'profile' && (
          <div className="space-y-4 max-w-sm mx-auto sm:mx-0">
            <h2 className="font-bold text-slate-800 text-lg">My Profile</h2>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                  {(profile?.full_name ?? 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-lg">{profile?.full_name}</div>
                  <div className="text-sm text-slate-500">Individual customer</div>
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-3">
                {[
                  { label: 'Email',   value: profile?.email },
                  { label: 'Phone',   value: profile?.phone ?? '—' },
                  { label: 'Account type', value: 'Individual / Customer' },
                ].map(f => (
                  <div key={f.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{f.label}</span>
                    <span className="text-sm text-slate-800 font-medium">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
              <strong>Want to manage a farm?</strong><br />
              Sign out and register a <strong>Business / Farm</strong> account to access production tracking, payroll, and AI analytics.
            </div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-3 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        )}
      </main>

      {/* Detail drawer */}
      {selected && <DetailDrawer item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
