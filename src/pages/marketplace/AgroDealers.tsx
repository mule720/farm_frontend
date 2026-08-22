import React from 'react';
import { ProviderShell, Provider, ProviderDirectoryConfig } from './ProviderDirectory';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_DEALERS: Provider[] = [
  {
    id: 'ad-1',
    providerType: 'agro_dealer',
    name: 'AgriInput Distributors Ltd',
    tagline: "Zambia's leading agro-input supplier since 2008",
    description:
      'Full-range agro-dealer stocking certified seeds, fertilisers, agro-chemicals, and farm equipment. SCCI certified seed stockist. Pioneer and Pannar authorised dealer.',
    phone: '+260 977 110001',
    email: 'sales@agriinput.zm',
    website: 'www.agriinput.zm',
    location: 'Lusaka, Lusaka Province',
    districts: ['Lusaka', 'Kafue', 'Chilanga'],
    operatingHours: 'Mon–Sat 07:00–18:00',
    licenseNumber: 'ZABS-AD-2024-0041',
    verified: true,
    certified: true,
    ratingAvg: 4.6,
    ratingCount: 89,
    active: true,
    mine: false,
    tags: ['Pioneer Dealer', 'SCCI Certified', 'Fertiliser', 'Seeds', 'Agro-chemicals'],
    specialties: ['Maize', 'Soya', 'Wheat', 'Vegetables'],
    services: [
      { id: 'ads1', name: 'Certified Maize Seed', description: 'Pioneer, Pannar, Seed Co varieties', price: 650, unit: 'per 50kg bag', category: 'Seeds', available: true },
      { id: 'ads2', name: 'NPK Fertiliser', description: 'Basal Dressing 10-20-10, 50kg', price: 480, unit: 'per 50kg bag', category: 'Fertiliser', available: true },
      { id: 'ads3', name: 'Urea Top Dressing', description: '46% N, 50kg bags', price: 460, unit: 'per 50kg bag', category: 'Fertiliser', available: true },
      { id: 'ads4', name: 'Agro-chemicals', description: 'Herbicides, fungicides, insecticides — full range', price: 0, unit: 'varies', category: 'Chemicals', available: true },
      { id: 'ads5', name: 'Farm Equipment', description: 'Knapsack sprayers, irrigation fittings, hand tools', price: 0, unit: 'varies', category: 'Equipment', available: true },
    ],
    reviews: [
      { id: 'adr1', reviewerName: 'Chanda Farms', rating: 5, comment: 'Excellent stock availability, fast delivery to farm.', serviceUsed: 'Certified Maize Seed', createdAt: '2026-07-15T10:00:00Z' },
      { id: 'adr2', reviewerName: 'Greenfield Hort', rating: 4, comment: 'Good prices on fertiliser, could improve packaging.', serviceUsed: 'NPK Fertiliser', createdAt: '2026-06-20T09:00:00Z' },
    ],
    certifications: [
      { body: 'SCCI', certNumber: 'SCCI-2024-0089', certType: 'Seed Dealer Certification', expires: '2025-12-31' },
      { body: 'ZABS', certNumber: 'ZABS-AD-2024-0041', certType: 'Agro-dealer Licence' },
    ],
    createdAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'ad-2',
    providerType: 'agro_dealer',
    name: 'FeedMills Zambia',
    tagline: 'Complete animal nutrition solutions',
    description:
      'Manufacturer and distributor of broiler, layer, and livestock feeds. Own mill in Lusaka. Also stocks veterinary supplements and feed additives.',
    phone: '+260 955 120002',
    email: 'orders@feedmillszm.com',
    location: 'Lusaka, Lusaka Province',
    districts: ['Lusaka', 'Copperbelt', 'Central'],
    operatingHours: 'Mon–Fri 06:00–17:00, Sat 06:00–12:00',
    verified: true,
    certified: true,
    ratingAvg: 4.8,
    ratingCount: 142,
    active: true,
    mine: false,
    tags: ['Own Mill', 'Poultry Feed', 'Livestock Feed', 'Bulk Orders'],
    specialties: ['Poultry', 'Swine', 'Dairy', 'Beef'],
    services: [
      { id: 'fms1', name: 'Broiler Starter 50kg', description: '18% CP, high energy — 0–21 days', price: 320, unit: 'per bag', category: 'Poultry Feed', available: true },
      { id: 'fms2', name: 'Broiler Grower 50kg', description: '16% CP — 22–35 days', price: 300, unit: 'per bag', category: 'Poultry Feed', available: true },
      { id: 'fms3', name: 'Broiler Finisher 50kg', description: '15% CP — 36–42 days', price: 295, unit: 'per bag', category: 'Poultry Feed', available: true },
      { id: 'fms4', name: 'Layer Mash 50kg', description: '16.5% CP + calcium for shell strength', price: 310, unit: 'per bag', category: 'Poultry Feed', available: true },
      { id: 'fms5', name: 'Dairy Meal 50kg', description: '16% CP for lactating cows', price: 340, unit: 'per bag', category: 'Livestock Feed', available: true },
    ],
    reviews: [
      { id: 'fmr1', reviewerName: 'KwaZuma Farms', rating: 5, comment: 'Best broiler feed in Zambia — FCR consistently under 1.7.', serviceUsed: 'Broiler Starter/Grower/Finisher', createdAt: '2026-08-01T14:00:00Z' },
      { id: 'fmr2', reviewerName: 'Sunrise Poultry', rating: 5, comment: 'Reliable supply, good mill turnover. Fresh stock always available.', serviceUsed: 'Broiler Grower', createdAt: '2026-07-22T11:00:00Z' },
    ],
    certifications: [
      { body: 'ZABS', certNumber: 'ZABS-FM-2023-0188', certType: 'Feed Manufacturing Licence', expires: '2026-06-30' },
    ],
    createdAt: '2023-06-01T00:00:00Z',
  },
  {
    id: 'ad-3',
    providerType: 'agro_dealer',
    name: 'ZamPoultry Hatchery & Supplies',
    tagline: 'Day-old chicks & complete poultry equipment',
    description:
      'Licensed hatchery producing day-old broiler and layer chicks. Also stocks incubators, feeders, drinkers, cages, and poultry medications. Delivery nationwide.',
    phone: '+260 966 130003',
    email: 'chicks@zampoultry.zm',
    location: 'Lusaka, Lusaka Province',
    districts: ['Lusaka', 'Southern', 'Central', 'Eastern'],
    operatingHours: 'Mon–Sat 06:00–17:00',
    verified: true,
    certified: true,
    ratingAvg: 4.4,
    ratingCount: 67,
    active: true,
    mine: false,
    tags: ['Hatchery', 'Day-Old Chicks', 'Poultry Equipment', 'Broiler', 'Layer'],
    specialties: ['Poultry'],
    services: [
      { id: 'zps1', name: 'Day-Old Broilers (100-box)', description: 'Ross 308 / Cobb 500 — vaccinated ND+IB', price: 1800, unit: 'per 100-chick box', category: 'Day-Old Chicks', available: true },
      { id: 'zps2', name: 'Day-Old Layers (100-box)', description: 'Hy-Line W-36 / Lohmann Brown', price: 2200, unit: 'per 100-chick box', category: 'Day-Old Chicks', available: true },
      { id: 'zps3', name: 'Poultry Drinkers', description: 'Bell drinkers 5L, nipple systems', price: 45, unit: 'per unit', category: 'Equipment', available: true },
      { id: 'zps4', name: 'Poultry Feeders', description: 'Tube feeders, trough feeders, chick feeders', price: 38, unit: 'per unit', category: 'Equipment', available: true },
    ],
    reviews: [
      { id: 'zpr1', reviewerName: 'Alice Banda Poultry', rating: 4, comment: 'Healthy chicks, delivery was on time. Will reorder.', serviceUsed: 'Day-Old Broilers', createdAt: '2026-07-10T08:00:00Z' },
    ],
    certifications: [
      { body: 'Department of Livestock', certNumber: 'DOL-HAT-2024-007', certType: 'Hatchery Operating Licence', expires: '2026-12-31' },
    ],
    createdAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 'ad-4',
    providerType: 'agro_dealer',
    name: 'AgroChems Ltd',
    tagline: 'Professional agro-chemical distribution — Copperbelt',
    description:
      'ZEMA-registered distributor of herbicides, fungicides, insecticides, and foliar nutrients. Technical staff available for spray programme advice. Copperbelt and Northern Province.',
    phone: '+260 977 140004',
    email: 'info@agrochems.zm',
    location: 'Ndola, Copperbelt Province',
    districts: ['Copperbelt', 'Northern', 'Luapula'],
    operatingHours: 'Mon–Fri 08:00–17:00',
    verified: true,
    certified: false,
    ratingAvg: 4.2,
    ratingCount: 31,
    active: true,
    mine: false,
    tags: ['ZEMA Registered', 'Herbicides', 'Fungicides', 'Foliar Feed', 'Technical Support'],
    specialties: ['Maize', 'Soya', 'Wheat', 'Sugarcane'],
    services: [
      { id: 'acs1', name: 'Herbicide Programme', description: 'Pre/post-emergent herbicide selection and mixing advice', price: 150, unit: 'per consultation', category: 'Advisory', available: true },
      { id: 'acs2', name: 'Agro-chemicals Supply', description: 'Glyphosate, Atrazine, Mancozeb, Lambda-cyhalothrin', price: 0, unit: 'varies by product', category: 'Chemicals', available: true },
      { id: 'acs3', name: 'Foliar Nutrients', description: 'Hydrofol, Bayfolan, micro-nutrient blends', price: 0, unit: 'varies', category: 'Nutrients', available: true },
    ],
    reviews: [],
    certifications: [
      { body: 'ZEMA', certNumber: 'ZEMA-D-2023-0421', certType: 'Agro-chemical Dealer Registration' },
    ],
    createdAt: '2023-09-01T00:00:00Z',
  },
  {
    id: 'ad-5',
    providerType: 'agro_dealer',
    name: 'SolarAgri Solutions',
    tagline: 'Solar-powered farm equipment & irrigation',
    description:
      'Specialists in solar water pumps, borehole pumps, drip and sprinkler irrigation kits, and solar-powered fencing. Installation and after-sales service included.',
    phone: '+260 955 150005',
    email: 'solar@solaragri.zm',
    website: 'www.solaragri.zm',
    location: 'Lusaka, Lusaka Province',
    districts: ['Lusaka', 'Central', 'Southern', 'Eastern', 'Western'],
    operatingHours: 'Mon–Sat 08:00–17:00',
    verified: false,
    certified: true,
    ratingAvg: 4.7,
    ratingCount: 54,
    active: true,
    mine: false,
    tags: ['Solar', 'Irrigation', 'Borehole Pumps', 'Installation', 'After-Sales'],
    specialties: ['Irrigation', 'Solar Energy'],
    services: [
      { id: 'sas1', name: 'Solar Borehole Pump', description: 'Lorentz, Grundfos, Franklin — 0.5–5kW, 20–200m head', price: 8500, unit: 'per unit (installed)', category: 'Solar Pumps', available: true },
      { id: 'sas2', name: 'Drip Irrigation Kit', description: '0.5ha, 1ha, 2ha kits — emitters, mainlines, fittings', price: 3200, unit: 'per 0.5ha kit', category: 'Irrigation', available: true },
      { id: 'sas3', name: 'Sprinkler Irrigation', description: 'Impact and micro-sprinklers for vegetables/orchards', price: 4800, unit: 'per 1ha kit', category: 'Irrigation', available: true },
    ],
    reviews: [
      { id: 'sar1', reviewerName: 'Central Grain Co', rating: 5, comment: 'Excellent installation, pump running perfectly after 8 months.', serviceUsed: 'Solar Borehole Pump', createdAt: '2026-05-10T10:00:00Z' },
    ],
    certifications: [
      { body: 'REA Zambia', certNumber: 'REA-2024-0112', certType: 'Renewable Energy Dealer' },
    ],
    createdAt: '2024-02-15T00:00:00Z',
  },
  {
    id: 'ad-6',
    providerType: 'agro_dealer',
    name: 'Eastern Agro Store',
    tagline: "Eastern Province's farm input hub",
    description:
      'Community-focused agro-dealer serving smallholder and commercial farmers in Eastern Province. Stocks seeds, fertilisers, hand tools, and protective equipment. Government subsidy e-voucher accepted.',
    phone: '+260 966 160006',
    email: 'easternagro@zamtel.zm',
    location: 'Chipata, Eastern Province',
    districts: ['Eastern', 'Petauke', 'Lundazi', 'Katete'],
    operatingHours: 'Mon–Sat 07:30–17:30',
    verified: false,
    certified: true,
    ratingAvg: 4.0,
    ratingCount: 22,
    active: true,
    mine: false,
    tags: ['E-Voucher Accepted', 'Smallholder Friendly', 'Seeds', 'Tools'],
    specialties: ['Maize', 'Groundnuts', 'Cotton', 'Sorghum'],
    services: [
      { id: 'eas1', name: 'Government Subsidy Input Pack', description: 'FISP e-voucher redemption — 2×50kg D-Compound + Urea + 10kg maize seed', price: 0, unit: 'per pack (voucher)', category: 'Subsidised Inputs', available: true },
      { id: 'eas2', name: 'Open-pollinated Maize Seed', description: 'Lusaka White, MM604', price: 180, unit: 'per 10kg pack', category: 'Seeds', available: true },
    ],
    reviews: [],
    certifications: [
      { body: 'SCCI', certNumber: 'SCCI-2023-0177', certType: 'Seed Dealer Registration' },
      { body: 'MAL', certNumber: 'MAL-FISP-0441', certType: 'FISP E-Voucher Dealer' },
    ],
    createdAt: '2023-04-01T00:00:00Z',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const cfg: ProviderDirectoryConfig = {
  storageKey: 'agronexus_v2_providers_dealers',
  providerType: 'agro_dealer',
  title: 'Agro Dealers',
  icon: '🏬',
  accent: 'amber',
  categories: [
    'Seeds',
    'Fertiliser',
    'Chemicals',
    'Animal Feed',
    'Equipment',
    'Day-Old Chicks',
    'Solar & Irrigation',
    'Subsidised Inputs',
  ],
  serviceUnitLabel: 'per unit',
  registerLabel: 'Register your dealership',
  mockProviders: MOCK_DEALERS,
  renderExtras: (p) =>
    p.specialties && p.specialties.length > 0 ? (
      <div>
        <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Specialist crops / products
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {p.specialties.map((s) => (
            <span
              key={s}
              style={{ padding: '2px 8px', borderRadius: '4px', background: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: 500 }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    ) : null,
};

export default function AgroDealers() {
  return <ProviderShell cfg={cfg} />;
}
