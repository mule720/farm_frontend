// Module-based subscription pricing registry

export interface ModulePrice {
  id: string;
  label: string;
  group: string;
  price: number;       // USD per month
  description: string;
  isCore: boolean;     // core modules always included (price = 0)
}

export const MODULE_CATALOG: ModulePrice[] = [
  // Core — always included
  { id: 'dashboard',      label: 'Dashboard',           group: 'Core',         price: 0,  isCore: true,  description: 'Real-time KPI overview' },
  { id: 'smart-engine',   label: 'Smart AI Engine',     group: 'Core',         price: 0,  isCore: true,  description: 'Daily feed & water AI recommendations' },
  { id: 'settings',       label: 'Settings',            group: 'Core',         price: 0,  isCore: true,  description: 'Account, users, preferences' },
  // Production
  { id: 'poultry',        label: 'Broiler Poultry',     group: 'Production',   price: 10, isCore: false, description: 'Broiler batch & lifecycle management' },
  { id: 'village-chicken',label: 'Village Chicken',     group: 'Production',   price: 8,  isCore: false, description: 'Free-range flock management' },
  { id: 'piggery',        label: 'Piggery',             group: 'Production',   price: 10, isCore: false, description: 'Pig breeding, litters & finishing' },
  { id: 'fish',           label: 'Fish Farming',        group: 'Production',   price: 10, isCore: false, description: 'Pond aquaculture & water quality' },
  { id: 'duck',           label: 'Duck Management',     group: 'Production',   price: 8,  isCore: false, description: 'Duck meat & egg production' },
  { id: 'goat-sheep',     label: 'Goats & Sheep',       group: 'Production',   price: 8,  isCore: false, description: 'Small ruminant herd management' },
  { id: 'horticulture',   label: 'Horticulture',        group: 'Production',   price: 10, isCore: false, description: 'Vegetable & crop cycle tracking' },
  // Operations
  { id: 'inventory',      label: 'Feed & Inventory',    group: 'Operations',   price: 12, isCore: false, description: 'Stock management, reorder alerts' },
  { id: 'sales',          label: 'Sales & Customers',   group: 'Operations',   price: 12, isCore: false, description: 'Orders, invoices, customer accounts' },
  { id: 'finance',        label: 'Financial Mgmt',      group: 'Operations',   price: 15, isCore: false, description: 'Ledger, cash flow, budgets' },
  { id: 'financial-ai',   label: 'P&L & Financial AI',  group: 'Operations',   price: 25, isCore: false, description: 'Real-time P&L, break-even, carbon credits' },
  { id: 'hr',             label: 'Human Resources',     group: 'Operations',   price: 12, isCore: false, description: 'Staff records, contracts, HR' },
  { id: 'procurement',    label: 'Procurement',         group: 'Operations',   price: 12, isCore: false, description: 'Purchase orders, suppliers' },
  { id: 'biosecurity',    label: 'Biosecurity & Vet',   group: 'Operations',   price: 15, isCore: false, description: 'Vaccination schedules, disease tracking' },
  { id: 'sustainability', label: 'Sustainability',      group: 'Operations',   price: 15, isCore: false, description: 'Carbon footprint, GAP, certifications' },
  // Smart Farm
  { id: 'irrigation',     label: 'Smart Irrigation',    group: 'Smart Farm',   price: 18, isCore: false, description: 'Soil sensors, automated watering zones' },
  { id: 'equipment',      label: 'Fleet & Equipment',   group: 'Smart Farm',   price: 18, isCore: false, description: 'Tractors, implements, maintenance' },
  { id: 'tracking',       label: 'Animal Tracking',     group: 'Smart Farm',   price: 22, isCore: false, description: 'GPS tags, weight logs, heat detection' },
  { id: 'greenhouse',     label: 'Greenhouse',          group: 'Smart Farm',   price: 28, isCore: false, description: 'Climate control, fertigation, hydroponics' },
  { id: 'labor',          label: 'Labor & HR (GPS)',    group: 'Smart Farm',   price: 22, isCore: false, description: 'Biometric attendance, task GPS, payroll' },
  // Intelligence
  { id: 'smart-vision',   label: 'Vision & AI',         group: 'Intelligence', price: 35, isCore: false, description: 'CCTV livestock health scoring, weed detection' },
  { id: 'predictive-ai',  label: 'Predictive AI',       group: 'Intelligence', price: 38, isCore: false, description: 'Disease prediction, yield & FCR forecasting' },
  { id: 'weather',        label: 'Weather & NDVI',      group: 'Intelligence', price: 18, isCore: false, description: 'Satellite NDVI, 7-day forecast, frost alerts' },
  // Markets
  { id: 'marketplace',    label: 'Commodity Market',    group: 'Markets',      price: 12, isCore: false, description: 'Live prices, auction module, buyers' },
  // Strategy
  { id: 'planner',        label: 'Plans & Budgets',     group: 'Strategy',     price: 12, isCore: false, description: 'Farm planning, seasonal budget templates' },
  { id: 'integrations',   label: 'Integrations',        group: 'Strategy',     price: 32, isCore: false, description: 'WhatsApp, ERP, bank API, LoRaWAN' },
  { id: 'reports',        label: 'Reports & BI',        group: 'Strategy',     price: 18, isCore: false, description: 'Custom reports, BI dashboards, exports' },
  { id: 'export',         label: 'Export & Logistics',  group: 'Strategy',     price: 22, isCore: false, description: 'Phytosanitary docs, cold chain, COMESA' },
  { id: 'assets',         label: 'Assets & Infra',      group: 'Strategy',     price: 10, isCore: false, description: 'Asset register, maintenance schedules' },
  { id: 'mobile',         label: 'Mobile App',          group: 'Strategy',     price: 10, isCore: false, description: 'iOS & Android offline field app' },
];

export function calcPrice(moduleIds: string[]): number {
  return moduleIds.reduce((sum, id) => {
    const m = MODULE_CATALOG.find(m => m.id === id);
    return sum + (m ? m.price : 0);
  }, 0);
}

// ─── Preset bundles ──────────────────────────────────────────────────────────

export interface PlanBundle {
  id: string;
  name: string;
  description: string;
  tagline: string;
  modules: string[];
  flatPrice: number;        // discounted flat price (lower than sum of parts)
  maxUsers: number;         // -1 = unlimited
  color: string;
  popular?: boolean;
}

const CORE_IDS = MODULE_CATALOG.filter(m => m.isCore).map(m => m.id);

export const PLAN_BUNDLES: PlanBundle[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For smallholder farms just getting started',
    tagline: 'Perfect for single-enterprise farms',
    modules: [...CORE_IDS, 'poultry', 'inventory', 'sales', 'finance', 'hr', 'biosecurity'],
    flatPrice: 49,
    maxUsers: 5,
    color: 'slate',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing commercial farms',
    tagline: 'Most popular for multi-enterprise farms',
    modules: [...CORE_IDS, 'poultry', 'piggery', 'horticulture', 'inventory', 'sales', 'finance', 'financial-ai', 'hr', 'biosecurity', 'sustainability', 'irrigation', 'tracking', 'weather', 'marketplace', 'planner', 'reports'],
    flatPrice: 149,
    maxUsers: 20,
    color: 'green',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For agribusiness groups with full operations',
    tagline: 'All modules, unlimited users, dedicated CSM',
    modules: MODULE_CATALOG.map(m => m.id),
    flatPrice: 349,
    maxUsers: -1,
    color: 'purple',
  },
];

export const TRIAL_DAYS = 14;

// ─── Platform staff roles ─────────────────────────────────────────────────────

export interface PlatformStaffRole {
  id: string;
  label: string;
  description: string;
  permissions: string[];
}

export const PLATFORM_ROLES: PlatformStaffRole[] = [
  {
    id: 'platform_admin',
    label: 'Platform Admin',
    description: 'Full access to all admin functions',
    permissions: ['companies', 'subscriptions', 'staff', 'billing', 'modules', 'impersonate', 'support', 'analytics'],
  },
  {
    id: 'support',
    label: 'Customer Support',
    description: 'View companies, handle support tickets, send messages',
    permissions: ['companies', 'support'],
  },
  {
    id: 'billing',
    label: 'Billing Manager',
    description: 'Manage subscriptions, invoices, and payments',
    permissions: ['companies', 'subscriptions', 'billing'],
  },
  {
    id: 'developer',
    label: 'Developer',
    description: 'Access API logs, integration status, module config',
    permissions: ['companies', 'modules', 'analytics'],
  },
  {
    id: 'account_manager',
    label: 'Account Manager',
    description: 'Manage company accounts, onboarding, and upsell',
    permissions: ['companies', 'subscriptions', 'support', 'analytics'],
  },
];

export const PLATFORM_PERMISSIONS = [
  { id: 'companies',     label: 'View & manage companies' },
  { id: 'subscriptions', label: 'Change subscription plans' },
  { id: 'staff',         label: 'Manage platform staff' },
  { id: 'billing',       label: 'Billing & invoices' },
  { id: 'modules',       label: 'Module access control' },
  { id: 'impersonate',   label: 'Login as customer' },
  { id: 'support',       label: 'Support tickets & messaging' },
  { id: 'analytics',     label: 'Platform analytics' },
];
