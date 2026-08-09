// AgroNexus - Smart agricultural data and recommendations engine

export type EnterpriseId =
  | 'poultry'
  | 'village-chicken'
  | 'piggery'
  | 'fish'
  | 'duck'
  | 'goat-sheep'
  | 'horticulture';

export interface Enterprise {
  id: EnterpriseId;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  activeBatches: number;
  totalAnimals: number;
  monthlyRevenue: number;
  mortalityRate: number;
  fcr: number;
}

export const enterprises: Enterprise[] = [
  {
    id: 'poultry',
    name: 'Broiler Poultry',
    icon: 'Bird',
    color: '#16a34a',
    bgColor: 'bg-green-50',
    description: 'Commercial broiler production',
    activeBatches: 6,
    totalAnimals: 12500,
    monthlyRevenue: 285000,
    mortalityRate: 2.4,
    fcr: 1.65,
  },
  {
    id: 'village-chicken',
    name: 'Village Chicken',
    icon: 'Egg',
    color: '#ca8a04',
    bgColor: 'bg-yellow-50',
    description: 'Free-range indigenous flocks',
    activeBatches: 4,
    totalAnimals: 1850,
    monthlyRevenue: 42000,
    mortalityRate: 4.1,
    fcr: 2.8,
  },
  {
    id: 'piggery',
    name: 'Piggery',
    icon: 'PiggyBank',
    color: '#db2777',
    bgColor: 'bg-pink-50',
    description: 'Pig breeding & finishing',
    activeBatches: 8,
    totalAnimals: 320,
    monthlyRevenue: 168000,
    mortalityRate: 1.8,
    fcr: 2.95,
  },
  {
    id: 'fish',
    name: 'Fish Farming',
    icon: 'Fish',
    color: '#0891b2',
    bgColor: 'bg-cyan-50',
    description: 'Pond aquaculture',
    activeBatches: 5,
    totalAnimals: 45000,
    monthlyRevenue: 96000,
    mortalityRate: 5.2,
    fcr: 1.4,
  },
  {
    id: 'duck',
    name: 'Duck Management',
    icon: 'Bird',
    color: '#7c3aed',
    bgColor: 'bg-violet-50',
    description: 'Duck meat & egg production',
    activeBatches: 3,
    totalAnimals: 950,
    monthlyRevenue: 28000,
    mortalityRate: 3.0,
    fcr: 2.4,
  },
  {
    id: 'goat-sheep',
    name: 'Goats & Sheep',
    icon: 'Sheep',
    color: '#ea580c',
    bgColor: 'bg-orange-50',
    description: 'Small ruminant production',
    activeBatches: 2,
    totalAnimals: 180,
    monthlyRevenue: 64000,
    mortalityRate: 2.1,
    fcr: 5.5,
  },
  {
    id: 'horticulture',
    name: 'Horticulture',
    icon: 'Sprout',
    color: '#15803d',
    bgColor: 'bg-emerald-50',
    description: 'Vegetable & crop production',
    activeBatches: 12,
    totalAnimals: 0,
    monthlyRevenue: 78000,
    mortalityRate: 0,
    fcr: 0,
  },
];

// Smart feeding recommendation tables
export interface FeedingStage {
  stage: string;
  ageRange: string;
  feedType: string;
  feedPerAnimalGrams: number;
  waterPerAnimalMl: number;
  notes: string;
}

export const broilerFeedingTable: FeedingStage[] = [
  { stage: 'Pre-starter', ageRange: 'Day 1-7', feedType: 'Pre-starter Crumble', feedPerAnimalGrams: 18, waterPerAnimalMl: 36, notes: 'Provide warmth at 33°C. Frequent small feeds.' },
  { stage: 'Starter', ageRange: 'Day 8-14', feedType: 'Starter Crumble', feedPerAnimalGrams: 55, waterPerAnimalMl: 110, notes: 'Reduce temp to 30°C. Begin lighting program.' },
  { stage: 'Grower', ageRange: 'Day 15-28', feedType: 'Grower Pellets', feedPerAnimalGrams: 110, waterPerAnimalMl: 220, notes: 'Monitor weight gain weekly.' },
  { stage: 'Finisher', ageRange: 'Day 29-Sale', feedType: 'Finisher Pellets', feedPerAnimalGrams: 165, waterPerAnimalMl: 330, notes: 'Withdraw medication 7 days before slaughter.' },
];

export const piggeryFeedingTable: FeedingStage[] = [
  { stage: 'Piglet', ageRange: '0-4 weeks', feedType: 'Creep Feed (High Protein)', feedPerAnimalGrams: 250, waterPerAnimalMl: 1000, notes: 'Iron injection at 3 days.' },
  { stage: 'Weaner', ageRange: '4-10 weeks', feedType: 'Weaner Mash', feedPerAnimalGrams: 900, waterPerAnimalMl: 3500, notes: 'Critical transition period.' },
  { stage: 'Grower', ageRange: '10-18 weeks', feedType: 'Grower Pellets', feedPerAnimalGrams: 1800, waterPerAnimalMl: 7000, notes: 'Target 750g daily gain.' },
  { stage: 'Finisher', ageRange: '18-26 weeks', feedType: 'Finisher Ration', feedPerAnimalGrams: 2800, waterPerAnimalMl: 10000, notes: 'Market weight 90-110kg.' },
  { stage: 'Pregnant Sow', ageRange: 'Gestation', feedType: 'Sow Gestation Feed', feedPerAnimalGrams: 2500, waterPerAnimalMl: 12000, notes: 'Avoid overfeeding.' },
  { stage: 'Lactating Sow', ageRange: 'Lactation', feedType: 'Lactation Feed', feedPerAnimalGrams: 6500, waterPerAnimalMl: 25000, notes: 'Free access. Critical for milk production.' },
];

export const fishFeedingTable: FeedingStage[] = [
  { stage: 'Fingerling', ageRange: '1-30g', feedType: 'Fingerling Crumble (40% protein)', feedPerAnimalGrams: 1.2, waterPerAnimalMl: 0, notes: 'Feed 4-6 times daily.' },
  { stage: 'Juvenile', ageRange: '30-150g', feedType: 'Juvenile Pellet (35% protein)', feedPerAnimalGrams: 4.5, waterPerAnimalMl: 0, notes: 'Maintain DO above 5mg/L.' },
  { stage: 'Grower', ageRange: '150-400g', feedType: 'Grower Pellet (32% protein)', feedPerAnimalGrams: 9, waterPerAnimalMl: 0, notes: 'Feed 3 times daily.' },
  { stage: 'Finisher', ageRange: '400g-Harvest', feedType: 'Finisher Pellet (28% protein)', feedPerAnimalGrams: 14, waterPerAnimalMl: 0, notes: 'Reduce feed last 3 days before harvest.' },
];

export const goatFeedingTable: FeedingStage[] = [
  { stage: 'Kid', ageRange: '0-3 months', feedType: 'Milk + Starter Concentrate', feedPerAnimalGrams: 200, waterPerAnimalMl: 500, notes: 'Wean at 12 weeks.' },
  { stage: 'Weaner', ageRange: '3-6 months', feedType: 'Grower Mash + Hay', feedPerAnimalGrams: 600, waterPerAnimalMl: 2500, notes: 'Provide mineral lick.' },
  { stage: 'Adult', ageRange: '6m+', feedType: 'Roughage + Supplement', feedPerAnimalGrams: 1500, waterPerAnimalMl: 5000, notes: 'Grazing 6-8 hours/day.' },
  { stage: 'Pregnant', ageRange: 'Gestation', feedType: 'Pregnancy Ration', feedPerAnimalGrams: 1800, waterPerAnimalMl: 7000, notes: 'Increase last 6 weeks.' },
  { stage: 'Lactating', ageRange: 'Nursing', feedType: 'Lactation Feed + Mineral', feedPerAnimalGrams: 2200, waterPerAnimalMl: 9000, notes: 'High-quality forage.' },
];

export const duckFeedingTable: FeedingStage[] = [
  { stage: 'Duckling', ageRange: 'Day 1-14', feedType: 'Duck Starter', feedPerAnimalGrams: 40, waterPerAnimalMl: 120, notes: 'Constant water access.' },
  { stage: 'Grower', ageRange: 'Day 15-42', feedType: 'Duck Grower', feedPerAnimalGrams: 130, waterPerAnimalMl: 380, notes: 'Begin swim access.' },
  { stage: 'Finisher', ageRange: 'Day 43-Sale', feedType: 'Duck Finisher', feedPerAnimalGrams: 200, waterPerAnimalMl: 550, notes: 'Market at 7-9 weeks.' },
  { stage: 'Layer', ageRange: 'Egg production', feedType: 'Layer Mash', feedPerAnimalGrams: 170, waterPerAnimalMl: 450, notes: '16hr light cycle.' },
];

export function getFeedingTable(enterprise: EnterpriseId): FeedingStage[] {
  switch (enterprise) {
    case 'poultry':
    case 'village-chicken':
      return broilerFeedingTable;
    case 'piggery':
      return piggeryFeedingTable;
    case 'fish':
      return fishFeedingTable;
    case 'goat-sheep':
      return goatFeedingTable;
    case 'duck':
      return duckFeedingTable;
    default:
      return [];
  }
}

export function getStageForAge(enterprise: EnterpriseId, ageDays: number): FeedingStage | null {
  const table = getFeedingTable(enterprise);
  if (table.length === 0) return null;
  
  if (enterprise === 'poultry' || enterprise === 'village-chicken') {
    if (ageDays <= 7) return table[0];
    if (ageDays <= 14) return table[1];
    if (ageDays <= 28) return table[2];
    return table[3];
  }
  if (enterprise === 'piggery') {
    const weeks = ageDays / 7;
    if (weeks <= 4) return table[0];
    if (weeks <= 10) return table[1];
    if (weeks <= 18) return table[2];
    return table[3];
  }
  if (enterprise === 'duck') {
    if (ageDays <= 14) return table[0];
    if (ageDays <= 42) return table[1];
    return table[2];
  }
  return table[Math.min(Math.floor(ageDays / 30), table.length - 1)];
}

export interface Batch {
  id: string;
  enterprise: EnterpriseId;
  name: string;
  startDate: string;
  ageDays: number;
  initialCount: number;
  currentCount: number;
  mortality: number;
  avgWeightKg: number;
  house: string;
  status: 'active' | 'sold' | 'archived';
  totalFeedKg: number;
  totalCostUSD: number;
  projectedRevenue: number;
}

export const sampleBatches: Batch[] = [
  { id: 'B-2024-101', enterprise: 'poultry', name: 'Broiler Batch 101', startDate: '2026-04-15', ageDays: 22, initialCount: 2500, currentCount: 2438, mortality: 62, avgWeightKg: 1.15, house: 'House A1', status: 'active', totalFeedKg: 4200, totalCostUSD: 8400, projectedRevenue: 14200 },
  { id: 'B-2024-102', enterprise: 'poultry', name: 'Broiler Batch 102', startDate: '2026-04-28', ageDays: 9, initialCount: 2000, currentCount: 1976, mortality: 24, avgWeightKg: 0.21, house: 'House A2', status: 'active', totalFeedKg: 380, totalCostUSD: 1900, projectedRevenue: 11800 },
  { id: 'B-2024-103', enterprise: 'poultry', name: 'Broiler Batch 103', startDate: '2026-05-02', ageDays: 5, initialCount: 3000, currentCount: 2985, mortality: 15, avgWeightKg: 0.12, house: 'House B1', status: 'active', totalFeedKg: 180, totalCostUSD: 2100, projectedRevenue: 17500 },
  { id: 'P-2024-201', enterprise: 'piggery', name: 'Sow Group Alpha', startDate: '2026-01-10', ageDays: 118, initialCount: 12, currentCount: 12, mortality: 0, avgWeightKg: 145, house: 'Pen 1', status: 'active', totalFeedKg: 2800, totalCostUSD: 5600, projectedRevenue: 18000 },
  { id: 'P-2024-202', enterprise: 'piggery', name: 'Finisher Group B', startDate: '2025-12-01', ageDays: 158, initialCount: 28, currentCount: 27, mortality: 1, avgWeightKg: 95, house: 'Pen 3', status: 'active', totalFeedKg: 6500, totalCostUSD: 11200, projectedRevenue: 24300 },
  { id: 'F-2024-301', enterprise: 'fish', name: 'Tilapia Pond 1', startDate: '2026-02-01', ageDays: 96, initialCount: 12000, currentCount: 11400, mortality: 600, avgWeightKg: 0.32, house: 'Pond 1', status: 'active', totalFeedKg: 1850, totalCostUSD: 3200, projectedRevenue: 18240 },
  { id: 'V-2024-401', enterprise: 'village-chicken', name: 'Free Range Flock 1', startDate: '2026-03-15', ageDays: 53, initialCount: 500, currentCount: 478, mortality: 22, avgWeightKg: 0.95, house: 'Range Area 1', status: 'active', totalFeedKg: 420, totalCostUSD: 850, projectedRevenue: 4780 },
  { id: 'D-2024-501', enterprise: 'duck', name: 'Pekin Duck Batch', startDate: '2026-04-01', ageDays: 36, initialCount: 400, currentCount: 388, mortality: 12, avgWeightKg: 1.85, house: 'Duck Pen 1', status: 'active', totalFeedKg: 980, totalCostUSD: 1750, projectedRevenue: 5820 },
];

export interface InventoryItem {
  id: string;
  name: string;
  category: 'feed' | 'medication' | 'vaccine' | 'tool' | 'packaging' | 'seed' | 'fertilizer' | 'fuel';
  quantity: number;
  unit: string;
  reorderLevel: number;
  unitCost: number;
  supplier: string;
  lastUpdated: string;
}

export const sampleInventory: InventoryItem[] = [
  { id: 'INV-001', name: 'Broiler Pre-Starter Feed', category: 'feed', quantity: 1850, unit: 'kg', reorderLevel: 500, unitCost: 0.85, supplier: 'Novatek Animal Feeds', lastUpdated: '2026-05-07' },
  { id: 'INV-002', name: 'Broiler Starter Feed', category: 'feed', quantity: 2400, unit: 'kg', reorderLevel: 800, unitCost: 0.78, supplier: 'Novatek Animal Feeds', lastUpdated: '2026-05-06' },
  { id: 'INV-003', name: 'Broiler Grower Feed', category: 'feed', quantity: 320, unit: 'kg', reorderLevel: 1000, unitCost: 0.72, supplier: 'Tiger Feeds', lastUpdated: '2026-05-05' },
  { id: 'INV-004', name: 'Pig Grower Pellets', category: 'feed', quantity: 1600, unit: 'kg', reorderLevel: 600, unitCost: 0.68, supplier: 'National Milling', lastUpdated: '2026-05-07' },
  { id: 'INV-005', name: 'Newcastle Disease Vaccine', category: 'vaccine', quantity: 24, unit: 'vials', reorderLevel: 10, unitCost: 12.50, supplier: 'VetSupply Zambia', lastUpdated: '2026-05-04' },
  { id: 'INV-006', name: 'Gumboro Vaccine', category: 'vaccine', quantity: 8, unit: 'vials', reorderLevel: 12, unitCost: 14.00, supplier: 'VetSupply Zambia', lastUpdated: '2026-05-03' },
  { id: 'INV-007', name: 'Amprolium 20%', category: 'medication', quantity: 45, unit: 'kg', reorderLevel: 15, unitCost: 22.00, supplier: 'AgriPharm', lastUpdated: '2026-05-02' },
  { id: 'INV-008', name: 'Tilapia Floating Feed', category: 'feed', quantity: 850, unit: 'kg', reorderLevel: 400, unitCost: 1.20, supplier: 'Aquafeed Solutions', lastUpdated: '2026-05-06' },
  { id: 'INV-009', name: 'Vegetable Seeds (Mixed)', category: 'seed', quantity: 18, unit: 'kg', reorderLevel: 5, unitCost: 35.00, supplier: 'SeedCo', lastUpdated: '2026-04-28' },
  { id: 'INV-010', name: 'NPK Fertilizer', category: 'fertilizer', quantity: 1200, unit: 'kg', reorderLevel: 500, unitCost: 0.95, supplier: 'Greenbelt Agro', lastUpdated: '2026-05-01' },
  { id: 'INV-011', name: 'Diesel Fuel', category: 'fuel', quantity: 380, unit: 'L', reorderLevel: 200, unitCost: 1.45, supplier: 'TotalEnergies', lastUpdated: '2026-05-07' },
  { id: 'INV-012', name: 'Egg Trays', category: 'packaging', quantity: 240, unit: 'pcs', reorderLevel: 100, unitCost: 0.15, supplier: 'PackZam', lastUpdated: '2026-05-06' },
];

export interface Customer {
  id: string;
  name: string;
  type: 'restaurant' | 'butchery' | 'wholesaler' | 'retail' | 'export';
  contact: string;
  email: string;
  location: string;
  totalPurchases: number;
  outstandingBalance: number;
  status: 'active' | 'inactive';
}

export const sampleCustomers: Customer[] = [
  { id: 'C-001', name: 'Lusaka Premium Grill', type: 'restaurant', contact: '+260 977 123 456', email: 'orders@lpgrill.com', location: 'Lusaka', totalPurchases: 24500, outstandingBalance: 1200, status: 'active' },
  { id: 'C-002', name: 'Mokambo Butchery', type: 'butchery', contact: '+260 966 789 012', email: 'info@mokambo.zm', location: 'Kitwe', totalPurchases: 18200, outstandingBalance: 0, status: 'active' },
  { id: 'C-003', name: 'Kinshasa Foods Ltd', type: 'export', contact: '+243 81 234 5678', email: 'import@kinshasafoods.cd', location: 'Kinshasa, DRC', totalPurchases: 86500, outstandingBalance: 8400, status: 'active' },
  { id: 'C-004', name: 'Shoprite Wholesale', type: 'wholesaler', contact: '+260 211 256 789', email: 'procurement@shoprite.zm', location: 'Lusaka', totalPurchases: 142000, outstandingBalance: 12500, status: 'active' },
  { id: 'C-005', name: 'Lubumbashi Meat Co', type: 'export', contact: '+243 99 876 5432', email: 'sales@lumbatmeats.cd', location: 'Lubumbashi, DRC', totalPurchases: 64200, outstandingBalance: 5800, status: 'active' },
  { id: 'C-006', name: 'The Garden Restaurant', type: 'restaurant', contact: '+260 955 432 109', email: 'chef@gardenrest.zm', location: 'Lusaka', totalPurchases: 8900, outstandingBalance: 450, status: 'active' },
  { id: 'C-007', name: 'Copperbelt Butchery', type: 'butchery', contact: '+260 977 555 333', email: 'orders@cbbutchery.zm', location: 'Ndola', totalPurchases: 32100, outstandingBalance: 2100, status: 'active' },
  { id: 'C-008', name: 'Pick n Pay Foods', type: 'wholesaler', contact: '+260 211 333 222', email: 'supply@pnp.zm', location: 'Lusaka', totalPurchases: 96800, outstandingBalance: 0, status: 'active' },
];

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  salary: number;
  startDate: string;
  status: 'active' | 'on-leave' | 'inactive';
  performance: number;
}

export const sampleEmployees: Employee[] = [
  { id: 'EMP-001', name: 'Joseph Mwansa', role: 'General Manager', department: 'Management', phone: '+260 977 111 001', email: 'joseph@farmpulse.demo', salary: 2500, startDate: '2023-01-15', status: 'active', performance: 92 },
  { id: 'EMP-002', name: 'Sarah Banda', role: 'Production Manager', department: 'Poultry', phone: '+260 977 111 002', email: 'sarah@farmpulse.demo', salary: 1800, startDate: '2023-03-20', status: 'active', performance: 88 },
  { id: 'EMP-003', name: 'David Phiri', role: 'Veterinary Officer', department: 'Veterinary', phone: '+260 977 111 003', email: 'david@farmpulse.demo', salary: 1600, startDate: '2023-06-10', status: 'active', performance: 95 },
  { id: 'EMP-004', name: 'Grace Tembo', role: 'Finance Officer', department: 'Finance', phone: '+260 977 111 004', email: 'grace@farmpulse.demo', salary: 1400, startDate: '2024-01-08', status: 'active', performance: 90 },
  { id: 'EMP-005', name: 'Peter Zulu', role: 'Piggery Supervisor', department: 'Piggery', phone: '+260 977 111 005', email: 'peter@farmpulse.demo', salary: 950, startDate: '2024-04-12', status: 'active', performance: 85 },
  { id: 'EMP-006', name: 'Mary Chilufya', role: 'Sales Coordinator', department: 'Sales', phone: '+260 977 111 006', email: 'mary@farmpulse.demo', salary: 1100, startDate: '2024-02-18', status: 'active', performance: 87 },
  { id: 'EMP-007', name: 'James Mulenga', role: 'Farm Hand', department: 'Poultry', phone: '+260 977 111 007', email: 'james@farmpulse.demo', salary: 450, startDate: '2024-08-01', status: 'active', performance: 78 },
  { id: 'EMP-008', name: 'Linda Kasonde', role: 'Horticulture Lead', department: 'Horticulture', phone: '+260 977 111 008', email: 'linda@farmpulse.demo', salary: 1200, startDate: '2024-05-22', status: 'active', performance: 91 },
];

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  enterprise: string;
  timestamp: string;
}

export const sampleAlerts: Alert[] = [
  { id: 'A-001', severity: 'critical', title: 'High Mortality Detected', message: 'Broiler Batch 101 mortality rate exceeded 3% threshold today', enterprise: 'Poultry', timestamp: '2 hours ago' },
  { id: 'A-002', severity: 'warning', title: 'Low Feed Stock', message: 'Broiler Grower Feed below reorder level (320kg remaining)', enterprise: 'Inventory', timestamp: '4 hours ago' },
  { id: 'A-003', severity: 'warning', title: 'Vaccination Due', message: 'Newcastle vaccine due for Batch 102 tomorrow', enterprise: 'Poultry', timestamp: '6 hours ago' },
  { id: 'A-004', severity: 'info', title: 'Harvest Ready', message: 'Tilapia Pond 1 reaching market weight in 10 days', enterprise: 'Fish', timestamp: '1 day ago' },
  { id: 'A-005', severity: 'critical', title: 'Water Intake Anomaly', message: 'House A1 water consumption 35% below expected — investigate', enterprise: 'Poultry', timestamp: '3 hours ago' },
  { id: 'A-006', severity: 'warning', title: 'Gumboro Vaccine Low', message: 'Only 8 vials remaining — order more immediately', enterprise: 'Inventory', timestamp: '5 hours ago' },
  { id: 'A-007', severity: 'info', title: 'DRC Export Scheduled', message: 'Shipment to Kinshasa Foods departs Friday 9 AM', enterprise: 'Logistics', timestamp: '8 hours ago' },
];

export interface Subscriber {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'trial' | 'suspended' | 'churned';
  monthlyRevenue: number;
  startDate: string;
  enterpriseTypes: string[];
  totalUsers: number;
}

export const sampleSubscribers: Subscriber[] = [
  { id: 'SUB-001', companyName: 'Afrivera Investments Ltd', contactPerson: 'Joseph Mwansa', email: 'joseph@afrivera.zm', phone: '+260 977 100 100', country: 'Zambia', plan: 'enterprise', status: 'active', monthlyRevenue: 499, startDate: '2025-08-01', enterpriseTypes: ['Poultry', 'Piggery', 'Fish', 'Horticulture'], totalUsers: 24 },
  { id: 'SUB-002', companyName: 'Zambeef Products PLC', contactPerson: 'Mary Chanda', email: 'm.chanda@zambeef.zm', phone: '+260 211 369 800', country: 'Zambia', plan: 'enterprise', status: 'active', monthlyRevenue: 999, startDate: '2025-06-15', enterpriseTypes: ['Poultry', 'Piggery', 'Cattle'], totalUsers: 58 },
  { id: 'SUB-003', companyName: 'GreenFarm Kenya Ltd', contactPerson: 'David Kimani', email: 'david@greenfarm.co.ke', phone: '+254 722 456 789', country: 'Kenya', plan: 'professional', status: 'active', monthlyRevenue: 199, startDate: '2025-11-20', enterpriseTypes: ['Horticulture', 'Poultry'], totalUsers: 12 },
  { id: 'SUB-004', companyName: 'Tanzania Fish Co-op', contactPerson: 'Amina Hassan', email: 'amina@tzfish.co.tz', phone: '+255 754 123 456', country: 'Tanzania', plan: 'professional', status: 'active', monthlyRevenue: 199, startDate: '2026-01-10', enterpriseTypes: ['Fish', 'Aquaculture'], totalUsers: 8 },
  { id: 'SUB-005', companyName: 'Sunrise Agro Uganda', contactPerson: 'Robert Okello', email: 'robert@sunriseagro.ug', phone: '+256 772 987 654', country: 'Uganda', plan: 'starter', status: 'trial', monthlyRevenue: 0, startDate: '2026-04-25', enterpriseTypes: ['Poultry'], totalUsers: 3 },
  { id: 'SUB-006', companyName: 'Cape Vine Farms', contactPerson: 'Pieter van der Merwe', email: 'pieter@capevine.co.za', phone: '+27 82 555 7890', country: 'South Africa', plan: 'enterprise', status: 'active', monthlyRevenue: 999, startDate: '2025-04-01', enterpriseTypes: ['Horticulture', 'Vineyard'], totalUsers: 42 },
  { id: 'SUB-007', companyName: 'Kinshasa Poultry Group', contactPerson: 'Patrice Mbala', email: 'patrice@kinpoultry.cd', phone: '+243 81 444 5566', country: 'DR Congo', plan: 'professional', status: 'active', monthlyRevenue: 199, startDate: '2026-02-14', enterpriseTypes: ['Poultry'], totalUsers: 15 },
  { id: 'SUB-008', companyName: 'Lagos Fresh Produce', contactPerson: 'Folake Adeyemi', email: 'folake@lagosfresh.ng', phone: '+234 803 222 1111', country: 'Nigeria', plan: 'professional', status: 'active', monthlyRevenue: 199, startDate: '2025-09-30', enterpriseTypes: ['Horticulture', 'Poultry'], totalUsers: 18 },
  { id: 'SUB-009', companyName: 'Harare Pig Farms', contactPerson: 'Tendai Moyo', email: 'tendai@hararepig.zw', phone: '+263 77 333 4444', country: 'Zimbabwe', plan: 'starter', status: 'active', monthlyRevenue: 49, startDate: '2026-03-05', enterpriseTypes: ['Piggery'], totalUsers: 4 },
  { id: 'SUB-010', companyName: 'Malawi Maize & Livestock', contactPerson: 'Chimwemwe Banda', email: 'chimwe@malawiml.mw', phone: '+265 99 777 8888', country: 'Malawi', plan: 'starter', status: 'suspended', monthlyRevenue: 0, startDate: '2025-12-01', enterpriseTypes: ['Poultry', 'Goat'], totalUsers: 2 },
  { id: 'SUB-011', companyName: 'Ethiopian Dairy Group', contactPerson: 'Selam Tesfaye', email: 'selam@etdairy.et', phone: '+251 91 234 5678', country: 'Ethiopia', plan: 'professional', status: 'trial', monthlyRevenue: 0, startDate: '2026-05-01', enterpriseTypes: ['Cattle', 'Dairy'], totalUsers: 6 },
  { id: 'SUB-012', companyName: 'Botswana Beef Ltd', contactPerson: 'Kagiso Mogale', email: 'kagiso@botbeef.bw', phone: '+267 71 234 567', country: 'Botswana', plan: 'enterprise', status: 'active', monthlyRevenue: 999, startDate: '2025-07-12', enterpriseTypes: ['Cattle', 'Goat'], totalUsers: 35 },
];

export const monthlyRevenueData = [
  { month: 'Nov', revenue: 562000, costs: 398000, profit: 164000 },
  { month: 'Dec', revenue: 618000, costs: 412000, profit: 206000 },
  { month: 'Jan', revenue: 595000, costs: 405000, profit: 190000 },
  { month: 'Feb', revenue: 672000, costs: 438000, profit: 234000 },
  { month: 'Mar', revenue: 728000, costs: 461000, profit: 267000 },
  { month: 'Apr', revenue: 761000, costs: 478000, profit: 283000 },
  { month: 'May', revenue: 798000, costs: 491000, profit: 307000 },
];

export const productionTrendData = [
  { week: 'W1', target: 2500, actual: 2410 },
  { week: 'W2', target: 2600, actual: 2680 },
  { week: 'W3', target: 2700, actual: 2620 },
  { week: 'W4', target: 2800, actual: 2890 },
  { week: 'W5', target: 2900, actual: 2950 },
  { week: 'W6', target: 3000, actual: 3120 },
  { week: 'W7', target: 3100, actual: 3080 },
  { week: 'W8', target: 3200, actual: 3340 },
];
