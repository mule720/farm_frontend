// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Public Marketplace + Auth
// Design language: warm stone / earthy, Tourism-inspired white cards,
// emerald primary, amber accents, 2-step business registration
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import { useOrg } from '@/store/orgStore';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/contexts/AuthContext';
import {
  Sprout, ArrowRight, ArrowLeft, Search, MapPin, Phone, BadgeCheck,
  Video, ShoppingCart, Wrench, Stethoscope, Store, Truck, Leaf,
  ChevronRight, X, Package, Star, Eye, EyeOff, User, Building2,
  LogIn, UserPlus, CheckCircle2, AlertCircle, Brain, Zap,
  Loader2, Menu, Globe, Landmark,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MarketItem {
  id: string; type: 'provider' | 'product'; category: string;
  name: string; tagline?: string; seller?: string;
  location: string; phone: string;
  rating?: number; ratingCount?: number; verified?: boolean; tags?: string[];
  description: string; priceFrom?: string;
  price?: number; unit?: string; qty?: number;
  image: string; // Unsplash photo URL
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATS = [
  { key: 'Vet Services',    emoji: '💉', chip: 'bg-rose-100 text-rose-700 border-rose-200',     dot: 'bg-rose-400' },
  { key: 'Equipment Hire',  emoji: '🚜', chip: 'bg-orange-100 text-orange-700 border-orange-200',dot: 'bg-orange-400' },
  { key: 'Agro Dealers',    emoji: '🏬', chip: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  { key: 'AgriFood',        emoji: '🛒', chip: 'bg-green-100 text-green-700 border-green-200',   dot: 'bg-green-500' },
  { key: 'AgriSupply',      emoji: '📦', chip: 'bg-sky-100 text-sky-700 border-sky-200',         dot: 'bg-sky-500' },
  { key: 'AgriServices',    emoji: '🌱', chip: 'bg-emerald-100 text-emerald-700 border-emerald-200',dot: 'bg-emerald-500' },
];

// ─── Data ─────────────────────────────────────────────────────────────────────

// Unsplash image helper — returns a sized CDN URL
const img = (id: string, w = 600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

const ALL_ITEMS: MarketItem[] = [
  // ── Vet Services ──────────────────────────────────────────────────────────
  { id:'v1',type:'provider',category:'Vet Services',   name:'AgriVet Zambia',               tagline:'Mobile vet — poultry, livestock & aquaculture', location:'Lusaka',    phone:'+260 977 210001',rating:4.8,ratingCount:73, verified:true, tags:['VBZ Registered','Mobile','24/7'],           description:'Full-service mobile vet practice. Farm visits, vaccination programmes, AI services, emergency cover 24/7.',priceFrom:'ZMW 120/visit', image:img('1560493676-04071c5f467b')},
  { id:'v2',type:'provider',category:'Vet Services',   name:'Central Veterinary Clinic',     tagline:'Full-service clinic — Lusaka',                  location:'Lusaka',    phone:'+260 955 220002',rating:4.5,ratingCount:112,verified:true, tags:['Clinic','Lab','Surgery'],                    description:'On-site laboratory, cold-chain vaccine storage, surgical facilities. Walk-in Mon–Sat.',              priceFrom:'ZMW 200/consult', image:img('1579684385127-1ef15d508118')},
  { id:'v3',type:'provider',category:'Vet Services',   name:'Aqua Health Vets',              tagline:'Aquaculture & fishery specialists',              location:'Siavonga',  phone:'+260 966 230003',rating:4.9,ratingCount:22, verified:true, tags:['Aquaculture','Tilapia'],                     description:"Zambia's only dedicated aquaculture vet. Disease diagnosis, water quality assessments.",              priceFrom:'ZMW 400/visit',   image:img('1523049673429-df3fdda6dc19')},
  { id:'v4',type:'provider',category:'Vet Services',   name:'TeleFarm Vet',                  tagline:'Remote consultation — nationwide',              location:'Online',    phone:'+260 955 217005',rating:4.6,ratingCount:38, verified:true, tags:['Video','Teleconsultation','2-Hour SLA'],     description:'Video & WhatsApp consultations with registered vets. Diagnosis and prescription within 2 hours.',    priceFrom:'ZMW 80/session',  image:img('1576091160550-2173dba999ef')},
  { id:'v5',type:'provider',category:'Vet Services',   name:'Para-Vet Rural Services',       tagline:'Affordable rural animal health',                location:'Kasama',    phone:'+260 977 215004',rating:4.2,ratingCount:45, verified:true, tags:['Subsidised','Rural','Cattle'],               description:'Para-vet officers providing vaccinations, deworming, wound care at community rates.',                priceFrom:'ZMW 8/animal',    image:img('1500595046743-cd271d694d30')},
  // ── Equipment Hire ────────────────────────────────────────────────────────
  { id:'e1',type:'provider',category:'Equipment Hire', name:'ZamTractor Hire Co',            tagline:'Tractors & implements — Copperbelt & Lusaka',   location:'Lusaka',    phone:'+260 977 310001',rating:4.7,ratingCount:64, verified:true, tags:['Tractors','Planting','Harvesting'],          description:'Full fleet 50–120HP tractors, planters, disc ploughs, ridgers, trailers. Operator included.',       priceFrom:'ZMW 850/hr',      image:img('1574943320219-553eb213f72d')},
  { id:'e2',type:'provider',category:'Equipment Hire', name:'IrrigaLet Solutions',           tagline:'Drip & sprinkler irrigation rental',            location:'Chisamba',  phone:'+260 955 320002',rating:4.5,ratingCount:31, verified:true, tags:['Drip','Sprinklers','Installation'],          description:'Rent complete drip and sprinkler irrigation systems. Setup and dismantling included.',               priceFrom:'ZMW 1,200/ha',    image:img('1530836176250-93e71de6f97e')},
  { id:'e3',type:'provider',category:'Equipment Hire', name:'AeroCrop Zambia',               tagline:'Drone spraying & aerial mapping',               location:'Lusaka',    phone:'+260 966 330003',rating:4.8,ratingCount:19, verified:true, tags:['Drone','Mapping','Precision'],               description:'Agricultural drones: field mapping, NDVI analysis, precision chemical application.',                priceFrom:'ZMW 180/ha',      image:img('1527977966861-2651c1ddd9ad')},
  { id:'e4',type:'provider',category:'Equipment Hire', name:'ColdTruck Logistics',           tagline:'Refrigerated transport — nationwide',           location:'Lusaka',    phone:'+260 977 340004',rating:4.4,ratingCount:28, verified:false,tags:['Cold Chain','Reefer'],                       description:'Refrigerated trucks 3t–20t. Temperature-controlled transport for produce, vaccines, perishables.',  priceFrom:'ZMW 4,500/trip',  image:img('1558618049-1e886dc2c9cc')},
  // ── Agro Dealers ─────────────────────────────────────────────────────────
  { id:'a1',type:'provider',category:'Agro Dealers',   name:'AgriInput Distributors Ltd',    tagline:"Zambia's leading agro-input supplier since 2008",location:'Lusaka',   phone:'+260 977 110001',rating:4.6,ratingCount:89, verified:true, tags:['SCCI Certified','Pioneer Dealer','Seeds'],   description:'Full-range agro-dealer: certified seeds, fertilisers, agro-chemicals, equipment. e-Voucher accepted.',priceFrom:'ZMW 180/10kg',  image:img('1416879595882-3373a0480b5b')},
  { id:'a2',type:'provider',category:'Agro Dealers',   name:'FeedMills Zambia',              tagline:'Complete animal nutrition solutions',           location:'Lusaka',    phone:'+260 955 120002',rating:4.8,ratingCount:142,verified:true, tags:['Own Mill','Poultry Feed','Bulk'],            description:'Manufacturer and distributor of broiler, layer, and livestock feeds. Own mill in Lusaka.',          priceFrom:'ZMW 295/50kg',    image:img('1548550023-2bdb3c5beed7')},
  { id:'a3',type:'provider',category:'Agro Dealers',   name:'SolarAgri Solutions',           tagline:'Solar water pumps & drip irrigation',          location:'Lusaka',    phone:'+260 955 150005',rating:4.7,ratingCount:54, verified:false,tags:['Solar','Irrigation','Installation'],         description:'Solar water pumps, borehole pumps, drip irrigation kits, solar fencing.',                          priceFrom:'ZMW 3,200/0.5ha', image:img('1508193638397-1c4234db14d8')},
  { id:'a4',type:'provider',category:'Agro Dealers',   name:'AgroChems Ltd',                 tagline:'Professional agro-chemical distribution',      location:'Ndola',     phone:'+260 977 140004',rating:4.2,ratingCount:31, verified:true, tags:['ZEMA Registered','Herbicides','Fungicides'],  description:'ZEMA-registered distributor of herbicides, fungicides, insecticides. Technical advisory included.',priceFrom:'ZMW 150/consult',  image:img('1586771107529-9e99ea087877')},
  // ── AgriFood ─────────────────────────────────────────────────────────────
  { id:'f1',type:'product', category:'AgriFood',       name:'Broiler Chickens – 500 birds',  seller:'KwaZuma Farms',        location:'Lusaka',    phone:'+260 977 001001',price:58, unit:'bird',qty:500, description:'Live broilers 42–45 days, 2.1–2.3kg avg liveweight. Health certificates available.',  image:img('1548550023-2bdb3c5beed7')},
  { id:'f2',type:'product', category:'AgriFood',       name:'Fresh Grade-A Tilapia',         seller:'Lake Fresh Aqua',      location:'Siavonga',  phone:'+260 955 002002',price:32, unit:'kg',  qty:800, description:'Freshly harvested tilapia, 300–500g whole fish. Iced delivery within 24h.',           image:img('1604594996959-1b63b3dc5e4c')},
  { id:'f3',type:'product', category:'AgriFood',       name:'Organic Tomatoes – Farm Gate',  seller:'Greenfield Hort',      location:'Chisamba',  phone:'+260 966 003003',price:8,  unit:'kg',  qty:2000,description:'GAP-certified organic tomatoes, Roma and cocktail varieties. No chemical residues.',    image:img('1546793665-c74683f339c1')},
  { id:'f4',type:'product', category:'AgriFood',       name:'Whole Maize – 50kg Bags',       seller:'Central Grain Co',     location:'Kabwe',     phone:'+260 977 004004',price:175,unit:'bag', qty:300, description:'Dried, cleaned maize, 14% moisture. ZABS tested. Collection or delivery.',            image:img('1464226184884-fa280b87c399')},
  { id:'f5',type:'product', category:'AgriFood',       name:'Fresh Cow Milk – Daily Supply', seller:'Sunrise Dairy',        location:'Mkushi',    phone:'+260 955 005005',price:12, unit:'litre',qty:500, description:'Fresh milk, brucellosis-tested herd. Daily farm collection or delivered.',            image:img('1563636619-e9143da7973b')},
  { id:'f6',type:'product', category:'AgriFood',       name:'Raw Beeswax Honey – 500g',      seller:'Northern Hive Co',     location:'Kasama',    phone:'+260 966 006006',price:85, unit:'jar', qty:200, description:'Raw, unfiltered wild honey from miombo woodland beehives. No additives.',             image:img('1524401872399-c1f2b20f0dc6')},
  // ── AgriSupply ───────────────────────────────────────────────────────────
  { id:'s1',type:'product', category:'AgriSupply',     name:'Pioneer 30Y87 Maize Seed 10kg', seller:'AgriInput Distributors',location:'Lusaka',   phone:'+260 977 110001',price:380,unit:'pack',qty:150, description:'SCCI-certified Pioneer 30Y87 hybrid maize seed. 10kg packs.',                         image:img('1464226184884-fa280b87c399')},
  { id:'s2',type:'product', category:'AgriSupply',     name:'D-Compound NPK 10-20-10 50kg',  seller:'AgriInput Distributors',location:'Lusaka',   phone:'+260 977 110001',price:480,unit:'bag', qty:400, description:'Basal dressing fertiliser for maize, soya. 50kg bags. Bulk discount available.',       image:img('1592982537447-7440770cbfc9')},
  { id:'s3',type:'product', category:'AgriSupply',     name:'Broiler Starter Feed 50kg',     seller:'FeedMills Zambia',     location:'Lusaka',    phone:'+260 955 120002',price:320,unit:'bag', qty:800, description:'18% CP broiler starter for 0–21 days. Medicated for coccidiosis prevention.',         image:img('1548550023-2bdb3c5beed7')},
  { id:'s4',type:'product', category:'AgriSupply',     name:'Knapsack Sprayer 15L',          seller:'AgriInput Distributors',location:'Lusaka',   phone:'+260 977 110001',price:250,unit:'unit',qty:60,  description:'15-litre manual knapsack sprayer with adjustable nozzle.',                           image:img('1586771107529-9e99ea087877')},
  // ── AgriServices ─────────────────────────────────────────────────────────
  { id:'r1',type:'provider',category:'AgriServices',   name:'Zambia Crop Advisory',          tagline:'Agronomic consulting & farm planning',         location:'Lusaka',    phone:'+260 977 410001',rating:4.7,ratingCount:38, verified:true, tags:['Agronomy','Farm Planning','Soil Testing'],   description:'Soil fertility mapping, crop management plans, IPM programmes, post-harvest advisory.',                                                  image:img('1464226184884-fa280b87c399')},
  { id:'r2',type:'provider',category:'AgriServices',   name:'AgriLab Zambia',                tagline:'Accredited soil & water testing laboratory',   location:'Lusaka',    phone:'+260 955 420002',rating:4.8,ratingCount:55, verified:true, tags:['Accredited','Soil Testing','Aflatoxin'],     description:'ZABS-accredited lab. Soil, water, aflatoxin & pesticide testing. 5-day turnaround.',                                                    image:img('1592982537447-7440770cbfc9')},
  { id:'r3',type:'provider',category:'AgriServices',   name:'FarmerSkills Zambia',           tagline:'Farmer training & extension services',         location:'Nationwide', phone:'+260 966 430003',rating:4.5,ratingCount:29, verified:true, tags:['FFS','Extension','Digital Training'],         description:'Farmer Field Schools, GAP training, market linkage, digital agri-extension.',                                                            image:img('1500382017468-9049fed747ef')},
  { id:'r4',type:'provider',category:'AgriServices',   name:'AgroFinance Partners',          tagline:'Farm input loans & crop insurance',            location:'Lusaka',    phone:'+260 977 440004',rating:4.3,ratingCount:21, verified:false,tags:['Input Loans','Insurance'],                    description:'Seasonal input credit and crop insurance tailored for smallholder and commercial farmers.',                                               image:img('1554224154-d1d9f7ccffd7')},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Stars({ r }: { r: number }) {
  return (
    <span className="flex items-center gap-px">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3 h-3 ${i <= Math.round(r) ? 'text-amber-400' : 'text-stone-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

// ─── Marketplace card ─────────────────────────────────────────────────────────

function ItemCard({ item, onSelect }: { item: MarketItem; onSelect: () => void }) {
  const cat = CATS.find(c => c.key === item.category)!;
  return (
    <button
      onClick={onSelect}
      className="text-left w-full bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-md hover:border-emerald-400 hover:shadow-xl transition-all group"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-stone-100">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Category chip overlaid on image */}
        <span className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm ${cat.chip}`}>
          {cat.emoji} {item.category}
        </span>
        {item.verified && (
          <span className="absolute top-2.5 right-2.5 flex items-center gap-0.5 bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            <BadgeCheck className="w-3 h-3" /> Verified
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-stone-900 text-sm leading-snug mb-1 group-hover:text-emerald-700 transition-colors">
          {item.name}
        </h3>

        {item.tagline && (
          <p className="text-xs text-stone-500 mb-2 line-clamp-2 leading-relaxed">{item.tagline}</p>
        )}

        {item.type === 'product' && (
          <p className="text-lg font-extrabold text-stone-900 mb-1">
            ZMW {item.price}<span className="text-xs font-normal text-stone-400 ml-0.5">/{item.unit}</span>
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
          <MapPin className="w-3 h-3 flex-shrink-0 text-stone-400" />
          <span>{item.location}</span>
        </div>

        {item.rating !== undefined && (
          <div className="flex items-center gap-1.5 mb-2">
            <Stars r={item.rating} />
            <span className="text-xs text-stone-500">{item.rating} <span className="text-stone-300">·</span> {item.ratingCount}</span>
          </div>
        )}

        {item.type === 'product' && (
          <p className="text-xs text-stone-400 mb-2">{item.qty?.toLocaleString()} available · {item.seller}</p>
        )}

        {item.priceFrom && (
          <p className="text-xs text-stone-500 mb-2">From <span className="font-semibold text-stone-700">{item.priceFrom}</span></p>
        )}

        <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold group-hover:gap-2 transition-all pt-2 border-t border-stone-100">
          View details <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </button>
  );
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

function ItemModal({ item, onClose, openAuth }: { item: MarketItem; onClose: () => void; openAuth: () => void }) {
  const cat = CATS.find(c => c.key === item.category)!;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-stone-100" onClick={e => e.stopPropagation()}>
        {/* Image header */}
        <div className="relative h-48 overflow-hidden bg-stone-200">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors backdrop-blur-sm"><X className="w-4 h-4" /></button>
          <div className="absolute bottom-3 left-4 right-4">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mb-1.5 backdrop-blur-sm ${cat.chip}`}>
              {cat.emoji} {item.category}
            </span>
            <h2 className="text-white font-extrabold text-lg leading-tight drop-shadow">{item.name}</h2>
            {item.tagline && <p className="text-stone-300 text-xs mt-0.5">{item.tagline}</p>}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {item.type === 'product' ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-stone-900">ZMW {item.price}</span>
                <span className="text-sm text-stone-500">/{item.unit} · {item.qty?.toLocaleString()} available</span>
              </div>
              <p className="text-stone-600 text-sm leading-relaxed">{item.description}</p>
              <div className="flex items-center gap-3 text-sm text-stone-500">
                <span className="flex items-center gap-1"><Store className="w-3.5 h-3.5 text-stone-400" />{item.seller}</span>
                <span className="text-stone-300">·</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-stone-400" />{item.location}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <span className="flex items-center gap-1 text-stone-600"><MapPin className="w-3.5 h-3.5 text-stone-400" />{item.location}</span>
                {item.verified && (
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold"><BadgeCheck className="w-3.5 h-3.5" />Verified</span>
                )}
                {item.rating && (
                  <span className="flex items-center gap-1.5"><Stars r={item.rating} /><span className="text-stone-500 text-xs">({item.ratingCount})</span></span>
                )}
              </div>
              <p className="text-stone-600 text-sm leading-relaxed">{item.description}</p>
              {item.priceFrom && (
                <p className="text-sm text-stone-600">Starting from <span className="font-bold text-stone-900">{item.priceFrom}</span></p>
              )}
              {item.tags && (
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map(t => (
                    <span key={t} className="px-2.5 py-0.5 bg-stone-100 text-stone-600 text-xs font-medium rounded-full border border-stone-200">{t}</span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-3 flex flex-wrap gap-2">
          <a href={`tel:${item.phone}`} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-sm font-medium transition-colors">
            <Phone className="w-4 h-4" /> Call directly
          </a>
          {item.tags?.some(t => ['Video','Teleconsultation'].includes(t)) && (
            <button onClick={openAuth} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
              <Video className="w-4 h-4" /> Video call
            </button>
          )}
          <button onClick={openAuth} className="ml-auto flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors">
            {item.type === 'product' ? <><ShoppingCart className="w-4 h-4" /> Order</> : <><ArrowRight className="w-4 h-4" /> Book / Enquire</>}
          </button>
        </div>

        {/* Auth nudge */}
        <div className="mx-6 mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          🔒 <strong>Sign in</strong> (or register free) to book, order, and start video calls — takes under 2 minutes.
        </div>
      </div>
    </div>
  );
}

// ─── Shared input component ───────────────────────────────────────────────────

function Input({ type = 'text', value, onChange, placeholder, required, className = '' }: {
  type?: string; value: string; onChange: (v: string) => void;
  placeholder: string; required?: boolean; className?: string;
}) {
  return (
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} required={required}
      className={`w-full px-4 py-3 rounded-xl border border-stone-200 text-sm outline-none
        focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-stone-400
        transition-shadow ${className}`}
    />
  );
}

function PasswordInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required
        className="w-full px-4 py-3 pr-10 rounded-xl border border-stone-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-stone-400 transition-shadow"
      />
      <button type="button" onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function TermsCheck({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-2.5 text-sm text-stone-600 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-emerald-700 focus:ring-emerald-500 accent-emerald-700" />
      <span>
        I agree to the{' '}
        <span className="font-semibold text-emerald-700">Terms of Service</span>
        {' '}and{' '}
        <span className="font-semibold text-emerald-700">Privacy Policy</span>.
      </span>
    </label>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return msg ? (
    <p className="flex items-center gap-1.5 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
      <AlertCircle className="w-4 h-4 flex-shrink-0" /> {msg}
    </p>
  ) : null;
}

// ─── Auth modal ───────────────────────────────────────────────────────────────

type AuthTab = 'login' | 'individual' | 'business' | 'government';

function AuthModal({ onClose, onLoginSuccess, onBusinessRegister }: {
  onClose: () => void;
  onLoginSuccess: () => void;
  onBusinessRegister: () => void;
}) {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<AuthTab>('login');

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');

  // Individual
  const [indName, setIndName] = useState('');
  const [indEmail, setIndEmail] = useState('');
  const [indPhone, setIndPhone] = useState('');
  const [indCountry, setIndCountry] = useState('');
  const [indPw, setIndPw] = useState('');
  const [indPw2, setIndPw2] = useState('');
  const [indTerms, setIndTerms] = useState(false);

  // Business step 1
  const [bizStep, setBizStep] = useState<1 | 2>(1);
  const [bizContact, setBizContact] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizPw, setBizPw] = useState('');
  const [bizPw2, setBizPw2] = useState('');
  const [bizTerms, setBizTerms] = useState(false);
  // Business step 2
  const [bizName, setBizName] = useState('');
  const [bizType, setBizType] = useState('');
  const [bizCountry, setBizCountry] = useState('Zambia');
  const [bizHectares, setBizHectares] = useState('');
  const [bizHeadcount, setBizHeadcount] = useState('');

  // Government / partner
  const [govName, setGovName] = useState('');
  const [govEmail, setGovEmail] = useState('');
  const [govPhone, setGovPhone] = useState('');
  const [govPw, setGovPw] = useState('');
  const [govPw2, setGovPw2] = useState('');
  const [govOrg, setGovOrg] = useState('');
  const [govOrgType, setGovOrgType] = useState<'government' | 'ngo' | 'donor'>('government');
  const [govProvince, setGovProvince] = useState('');
  const [govDistrict, setGovDistrict] = useState('');
  const [govTerms, setGovTerms] = useState(false);
  const [govRole, setGovRole] = useState<'gov_viewer' | 'extension_officer' | 'partner_manager'>('gov_viewer');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGovernment(e: React.FormEvent) {
    e.preventDefault();
    if (!govTerms) { setError('Please agree to the Terms of Service to continue.'); return; }
    if (govPw !== govPw2) { setError('Passwords do not match.'); return; }
    if (govPw.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (!govPhone.trim()) { setError('Please enter a phone number.'); return; }
    setLoading(true); resetErr();
    const { error: err } = await signUp(govEmail, govPw, govName, govRole as UserRole, govOrg,
      { phone: govPhone, orgType: govOrgType, province: govProvince, district: govDistrict });
    setLoading(false);
    if (err) setError(err); else { onClose(); onLoginSuccess(); }
  }

  function resetErr() { setError(''); }
  function switchTab(t: AuthTab) {
    setTab(t); setError(''); setBizStep(1);
    setLoginEmail(''); setLoginPw('');
    setIndName(''); setIndEmail(''); setIndPhone(''); setIndCountry(''); setIndPw(''); setIndPw2(''); setIndTerms(false);
    setBizContact(''); setBizEmail(''); setBizPhone(''); setBizPw(''); setBizPw2(''); setBizTerms(false);
    setBizName(''); setBizType(''); setBizHectares(''); setBizHeadcount('');
    setGovRole('gov_viewer'); setGovName(''); setGovEmail(''); setGovPhone(''); setGovPw(''); setGovPw2(''); setGovOrg(''); setGovProvince(''); setGovDistrict(''); setGovTerms(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); resetErr();
    const { error: err } = await signIn(loginEmail, loginPw);
    setLoading(false);
    if (err) setError(err); else { onClose(); onLoginSuccess(); }
  }

  async function handleIndividual(e: React.FormEvent) {
    e.preventDefault();
    if (!indTerms) { setError('Please agree to the Terms of Service to continue.'); return; }
    if (indPw !== indPw2) { setError('Passwords do not match.'); return; }
    if (indPw.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (!indPhone.trim()) { setError('Please enter a phone number.'); return; }
    setLoading(true); resetErr();
    const { error: err } = await signUp(indEmail, indPw, indName, 'farmhand' as UserRole, 'individual', { phone: indPhone });
    setLoading(false);
    if (err) setError(err); else { onClose(); onLoginSuccess(); }
  }

  function handleBizStep1() {
    if (!bizContact || !bizEmail || !bizPw) { setError('Please fill in all required fields.'); return; }
    if (!bizPhone.trim()) { setError('Please enter a phone number.'); return; }
    if (!bizTerms) { setError('Please agree to the Terms of Service to continue.'); return; }
    if (bizPw !== bizPw2) { setError('Passwords do not match.'); return; }
    if (bizPw.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError(''); setBizStep(2);
  }

  async function handleBusiness(e: React.FormEvent) {
    e.preventDefault();
    if (!bizName || !bizType) { setError('Please enter your farm name and type.'); return; }
    setLoading(true); resetErr();
    const { error: err } = await signUp(bizEmail, bizPw, bizContact, 'director' as UserRole, bizName, { phone: bizPhone, businessType: BUSINESS_TYPE_FROM_LABEL[bizType] ?? 'farmer' });
    setLoading(false);
    if (err) setError(err); else { onClose(); onBusinessRegister(); }
  }

  const COUNTRIES = ['Zambia','Zimbabwe','Malawi','Tanzania','Mozambique','Botswana','Namibia','Angola','Congo DRC','Kenya','Uganda','Other'];
  const BUSINESS_TYPE_FROM_LABEL: Record<string, string> = { 'Agro Dealer / Input Shop': 'agro_dealer', 'Cooperative / Smallholder Group': 'cooperative', 'Agribusiness / Processing': 'processor', 'Veterinary / Animal Health': 'vet_provider', 'Equipment Hire': 'equipment_hire', 'AgriFood Seller / Trader': 'agrifood_seller', 'AgriSupply Provider': 'agrisupply_provider', 'AgriServices Provider': 'agriservices_provider', 'Transport / Haulage': 'transport' };
  const FARM_TYPES = ['Crop Farm','Poultry Farm','Livestock / Cattle Farm','Aquaculture / Fish Farm','Mixed Farm','Cooperative / Smallholder Group','Agro Dealer / Input Shop','Veterinary / Animal Health','Equipment Hire','AgriFood Seller / Trader','AgriSupply Provider','AgriServices Provider','Agribusiness / Processing','Transport / Haulage','Other'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-stone-100 my-4" onClick={e => e.stopPropagation()}>

        {/* Logo header */}
        <div className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-sm">
                <Sprout className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-extrabold text-stone-900 leading-tight">AgroNexus</p>
                <p className="text-[10px] text-stone-400 leading-tight">Zambia's farm platform</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab switcher */}
          <div className="grid grid-cols-3 gap-1 bg-stone-100 rounded-xl p-1 mb-5">
            {([
              ['login',      <LogIn className="w-3.5 h-3.5" />,    'Sign In'],
              ['individual', <User className="w-3.5 h-3.5" />,     'Individual'],
              ['business',   <Building2 className="w-3.5 h-3.5" />,'Business'],
              ['government', <Landmark className="w-3.5 h-3.5" />, 'Gov / Partner'],
            ] as [AuthTab, React.ReactNode, string][]).map(([t, icon, label]) => (
              <button
                key={t} onClick={() => switchTab(t)}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  tab === t ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {icon}{label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Sign In ─────────────────────────────────────────────────────── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="px-6 pb-6 space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-stone-900">Welcome back</h2>
              <p className="text-sm text-stone-500 mt-0.5">Sign in to your AgroNexus account</p>
            </div>
            <Input type="email" value={loginEmail} onChange={setLoginEmail} placeholder="Email address" required />
            <div className="space-y-1">
              <PasswordInput value={loginPw} onChange={setLoginPw} placeholder="Password" />
              <div className="text-right">
                <button type="button" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">Forgot password?</button>
              </div>
            </div>
            <ErrorMsg msg={error} />
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              Sign In
            </button>
            <p className="text-center text-sm text-stone-500">
              No account?{' '}
              <button type="button" onClick={() => switchTab('individual')} className="text-emerald-700 font-semibold hover:underline">Individual</button>
              {' '}or{' '}
              <button type="button" onClick={() => switchTab('business')} className="text-emerald-700 font-semibold hover:underline">Business</button>
            </p>
          </form>
        )}

        {/* ── Individual ──────────────────────────────────────────────────── */}
        {tab === 'individual' && (
          <form onSubmit={handleIndividual} className="px-6 pb-6 space-y-3">
            <div>
              <h2 className="text-xl font-extrabold text-stone-900">Create your account</h2>
              <p className="text-sm text-stone-500 mt-0.5">Browse, save favourites, book services & order produce</p>
            </div>

            <div className="flex items-start gap-3 p-3 bg-sky-50 border border-sky-200 rounded-xl">
              <User className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-sky-800 leading-relaxed">
                <strong>Individual account</strong> — for buyers, farmers, and customers who want to browse and contact providers without managing a full farm platform.
              </p>
            </div>

            <Input value={indName} onChange={setIndName} placeholder="Full name" required />
            <Input type="email" value={indEmail} onChange={setIndEmail} placeholder="Email address" required />
            <Input type="tel" value={indPhone} onChange={setIndPhone} placeholder="Phone number (e.g. +260 977 000 111)" required />

            <select value={indCountry} onChange={e => setIndCountry(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-stone-700">
              <option value="">Country (optional)</option>
              {['Zambia','Zimbabwe','Malawi','Tanzania','Mozambique','Botswana','Kenya','Uganda','Other'].map(c =>
                <option key={c} value={c}>{c}</option>
              )}
            </select>

            <PasswordInput value={indPw} onChange={setIndPw} placeholder="Password (min 6 characters)" />
            <PasswordInput value={indPw2} onChange={setIndPw2} placeholder="Confirm password" />
            <TermsCheck checked={indTerms} onChange={setIndTerms} />
            <ErrorMsg msg={error} />

            <button type="submit" disabled={loading || !indTerms}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Create Account <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-3 border-t border-stone-100 text-center">
              <button type="button" onClick={() => switchTab('business')}
                className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-emerald-700 font-semibold transition-colors">
                <Building2 className="w-4 h-4" /> Register a farm or business instead
              </button>
            </div>
            <p className="text-center text-sm text-stone-500">
              Already have an account? <button type="button" onClick={() => switchTab('login')} className="text-emerald-700 font-semibold hover:underline">Sign in</button>
            </p>
          </form>
        )}

        {/* ── Business ─────────────────────────────────────────────────────── */}
        {tab === 'business' && (
          <div className="px-6 pb-6">
            <div className="mb-4">
              <h2 className="text-xl font-extrabold text-stone-900">Register your business</h2>
              <p className="text-sm text-stone-500 mt-0.5">
                {bizStep === 1 ? 'Step 1 of 2 — your account details' : 'Step 2 of 2 — your farm or business'}
              </p>
              {/* Step dots */}
              <div className="flex items-center gap-2 mt-3">
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${bizStep >= 1 ? 'bg-emerald-600' : 'bg-stone-200'}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${bizStep >= 2 ? 'bg-emerald-600' : 'bg-stone-200'}`} />
              </div>
            </div>

            {bizStep === 1 && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <Building2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    <strong>Business / Farm account</strong> — full farm management: production cycles, staff, payroll, inventory, AI analytics, IoT, and the complete marketplace.
                  </p>
                </div>

                <Input value={bizContact} onChange={setBizContact} placeholder="Your full name (director / owner)" required />
                <Input type="email" value={bizEmail} onChange={setBizEmail} placeholder="Email address" required />
                <Input type="tel" value={bizPhone} onChange={setBizPhone} placeholder="Phone number (e.g. +260 977 000 111)" required />
                <PasswordInput value={bizPw} onChange={setBizPw} placeholder="Password (min 6 characters)" />
                <PasswordInput value={bizPw2} onChange={setBizPw2} placeholder="Confirm password" />
                <TermsCheck checked={bizTerms} onChange={setBizTerms} />
                <ErrorMsg msg={error} />

                <button type="button" onClick={handleBizStep1} disabled={!bizTerms}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors">
                  Continue to farm details <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-3 border-t border-stone-100 text-center">
                  <button type="button" onClick={() => switchTab('individual')}
                    className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-emerald-700 font-semibold transition-colors">
                    <User className="w-4 h-4" /> Register as an individual instead
                  </button>
                </div>
                <p className="text-center text-sm text-stone-500">
                  Already registered? <button type="button" onClick={() => switchTab('login')} className="text-emerald-700 font-semibold hover:underline">Sign in</button>
                </p>
              </div>
            )}

            {bizStep === 2 && (
              <form onSubmit={handleBusiness} className="space-y-3">
                <Input value={bizName} onChange={setBizName} placeholder="Farm / business name" required />

                <select value={bizType} onChange={e => setBizType(e.target.value)} required
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-stone-700">
                  <option value="">Type of farm / business</option>
                  {FARM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                <select value={bizCountry} onChange={e => setBizCountry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-stone-700">
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-600 mb-1 block">Farm size (ha) <span className="font-normal text-stone-400">optional</span></label>
                    <Input value={bizHectares} onChange={setBizHectares} placeholder="e.g. 25" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-600 mb-1 block">Staff / users <span className="font-normal text-stone-400">optional</span></label>
                    <Input value={bizHeadcount} onChange={setBizHeadcount} placeholder="e.g. 8" />
                  </div>
                </div>

                <ErrorMsg msg={error} />

                <div className="flex gap-2">
                  <button type="button" onClick={() => { setBizStep(1); setError(''); }}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-sm font-semibold transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Create Farm Account
                  </button>
                </div>

                <p className="text-center text-sm text-stone-500">
                  Already registered? <button type="button" onClick={() => switchTab('login')} className="text-emerald-700 font-semibold hover:underline">Sign in</button>
                </p>
              </form>
            )}
          </div>
        )}

        {/* ── Government / Partner ───────────────────────────────────────── */}
        {tab === 'government' && (
          <form onSubmit={handleGovernment} className="px-6 pb-6 space-y-3">
            <div>
              <h2 className="text-xl font-extrabold text-stone-900">Government & partner access</h2>
              <p className="text-sm text-stone-500 mt-0.5">Ministries, district offices, NGOs and donor programmes</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <Landmark className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Read-only, de-identified dashboards</strong> — production, prices, disease hotspots and sustainability aggregated across farms that have opted in. You can also broadcast advisories by district.
              </p>
            </div>
            <Input value={govName} onChange={setGovName} placeholder="Your full name" required />
            <Input type="email" value={govEmail} onChange={setGovEmail} placeholder="Official email address" required />
            <Input type="tel" value={govPhone} onChange={setGovPhone} placeholder="Phone number" required />
            <Input value={govOrg} onChange={setGovOrg} placeholder="Organisation (e.g. Ministry of Agriculture — Chongwe DACO)" required />
            <select value={govOrgType} onChange={e => setGovOrgType(e.target.value as any)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-stone-700">
              <option value="government">Government ministry / district office</option>
              <option value="ngo">NGO / development partner</option>
              <option value="donor">Donor programme</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setGovRole('gov_viewer')}
                className={`p-3 rounded-xl border text-left text-xs transition-colors ${govRole === 'gov_viewer' ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-stone-200 text-stone-600'}`}>
                <div className="font-bold text-sm">Dashboard viewer</div>
                Aggregated district & national data
              </button>
              <button type="button" onClick={() => setGovRole('extension_officer')}
                className={`p-3 rounded-xl border text-left text-xs transition-colors ${govRole === 'extension_officer' ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-stone-200 text-stone-600'}`}>
                <div className="font-bold text-sm">Extension officer</div>
                Caseload of farms in your camp / district
              </button>
              <button type="button" onClick={() => { setGovRole('partner_manager'); if (govOrgType === 'government') setGovOrgType('donor'); }}
                className={`col-span-2 p-3 rounded-xl border text-left text-xs transition-colors ${govRole === 'partner_manager' ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-stone-200 text-stone-600'}`}>
                <div className="font-bold text-sm">Supporting partner (FAO, donor, NGO)</div>
                Run programmes: enrol farms, deliver inputs & training, track results
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input value={govProvince} onChange={setGovProvince} placeholder={govRole === 'extension_officer' ? 'Province' : 'Province (optional)'} required={govRole === 'extension_officer'} />
              <Input value={govDistrict} onChange={setGovDistrict} placeholder={govRole === 'extension_officer' ? 'District' : 'District (optional)'} required={govRole === 'extension_officer'} />
            </div>
            <PasswordInput value={govPw} onChange={setGovPw} placeholder="Password (min 6 characters)" />
            <PasswordInput value={govPw2} onChange={setGovPw2} placeholder="Confirm password" />
            <TermsCheck checked={govTerms} onChange={setGovTerms} />
            <ErrorMsg msg={error} />
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Landmark className="w-4 h-4" />}
              Create partner account
            </button>
            <p className="text-center text-sm text-stone-500">
              Already registered? <button type="button" onClick={() => switchTab('login')} className="text-emerald-700 font-semibold hover:underline">Sign in</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Landing page ─────────────────────────────────────────────────────────────

export default function LandingV2() {
  const { createOrg } = useOrg();
  const { profile } = useAuth();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MarketItem | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const filtered = useMemo(() => {
    let items = ALL_ITEMS;
    if (activeCategory !== 'All') items = items.filter(i => i.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.tagline ?? '').toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.tags ?? []).some(t => t.toLowerCase().includes(q))
      );
    }
    return items;
  }, [activeCategory, search]);

  function handleBusinessRegister() { createOrg('My Farm', 'Zambia', 'ZMW'); }

  if (profile) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-stone-600">Signed in as <strong>{profile.full_name}</strong></p>
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800">
            Go to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-200 flex flex-col">

      {/* ─── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-sm">
              <Sprout className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-stone-900 text-base">AgroNexus</span>
              <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded uppercase tracking-widest border border-amber-200">Marketplace</span>
            </div>
          </div>

          {/* Desktop auth */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-stone-400 text-sm mr-1">Zambia's agri marketplace</span>
            <button onClick={() => setShowAuth(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-stone-200 text-stone-700 hover:border-emerald-400 hover:text-emerald-700 text-sm font-semibold rounded-xl transition-colors">
              <LogIn className="w-4 h-4" /> Sign in
            </button>
            <button onClick={() => setShowAuth(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
              <UserPlus className="w-4 h-4" /> Register free
            </button>
          </div>

          <button onClick={() => setMobileMenu(v => !v)} className="sm:hidden p-2 text-stone-500">
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenu && (
          <div className="sm:hidden px-4 pb-4 flex flex-col gap-2 border-t border-stone-100 pt-3">
            <button onClick={() => { setShowAuth(true); setMobileMenu(false); }}
              className="w-full py-2.5 border border-stone-200 text-stone-700 rounded-xl text-sm font-semibold">Sign in</button>
            <button onClick={() => { setShowAuth(true); setMobileMenu(false); }}
              className="w-full py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-semibold">Register free</button>
          </div>
        )}
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-stone-900 via-stone-800 to-emerald-950 px-4 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
          {/* Copy */}
          <div className="flex-1 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-full text-xs font-semibold mb-5">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              Browse free — no account needed
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              Zambia's agricultural<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-emerald-400">
                marketplace &amp; services
              </span>
            </h1>
            <p className="text-stone-400 leading-relaxed mb-7 text-sm sm:text-base">
              Browse verified vets, equipment hire, agro dealers, farm inputs, and fresh produce.
              Call any provider directly for free. Register to book, order, and manage your farm.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setShowAuth(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-colors shadow-lg">
                <User className="w-4 h-4" /> Register as Individual
              </button>
              <button onClick={() => setShowAuth(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold rounded-xl text-sm transition-colors">
                <Building2 className="w-4 h-4" /> Register Farm / Business
              </button>
            </div>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs flex-shrink-0">
            {[
              { icon: <Store className="w-5 h-5 text-amber-400" />,   title: `${ALL_ITEMS.length} listings`,  sub: 'Providers & products' },
              { icon: <BadgeCheck className="w-5 h-5 text-emerald-400" />, title: 'Verified sellers', sub: 'Checked & certified' },
              { icon: <Brain className="w-5 h-5 text-purple-400" />,  title: 'AI farm tools',    sub: 'For business accounts' },
              { icon: <Zap className="w-5 h-5 text-sky-400" />,       title: 'Instant booking',  sub: 'Once registered' },
            ].map(f => (
              <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                {f.icon}
                <p className="font-bold text-white text-sm mt-2">{f.title}</p>
                <p className="text-stone-400 text-xs">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Filters bar ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-stone-200 sticky top-[57px] z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search providers, products, categories…"
                className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50 placeholder:text-stone-400" />
            </div>
            <p className="self-center text-xs text-stone-400 hidden sm:block">
              {filtered.length} listing{filtered.length !== 1 ? 's' : ''} · phone calls always free
            </p>
          </div>
          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setActiveCategory('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                activeCategory === 'All'
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
              }`}>
              All ({ALL_ITEMS.length})
            </button>
            {CATS.map(c => (
              <button key={c.key} onClick={() => setActiveCategory(c.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  activeCategory === c.key
                    ? `${c.chip}`
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                }`}>
                {c.emoji} {c.key} ({ALL_ITEMS.filter(i => i.category === c.key).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Listings ────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No results for "{search}"</p>
            <button onClick={() => { setSearch(''); setActiveCategory('All'); }}
              className="mt-2 text-emerald-700 text-sm hover:underline font-semibold">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(item => <ItemCard key={item.id} item={item} onSelect={() => setSelected(item)} />)}
          </div>
        )}
      </main>



      {/* Footer */}
      <footer className="bg-stone-950 text-center py-5 text-xs text-stone-600 border-t border-stone-800">
        © {new Date().getFullYear()} AgroNexus · Built for African farmers ·{' '}
        <button onClick={() => setShowAuth(true)} className="text-emerald-500 hover:text-emerald-400 font-semibold">Sign in / Register</button>
      </footer>

      {/* Modals */}
      {selected && (
        <ItemModal item={selected} onClose={() => setSelected(null)} openAuth={() => { setSelected(null); setShowAuth(true); }} />
      )}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onLoginSuccess={() => setShowAuth(false)}
          onBusinessRegister={handleBusinessRegister}
        />
      )}
    </div>
  );
}
