// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Universal Agricultural Event System
// Every agricultural activity maps to one of these typed events.
// Category-aware: the ProductionEngine reads `categories` to show only relevant
// event types for the current template.
// ─────────────────────────────────────────────────────────────────────────────
import type { ProductionCategory } from './types';

export type UniversalEventType =
  // Universal (all categories)
  | 'observation' | 'purchase' | 'transfer' | 'treatment' | 'mortality'
  | 'weighing' | 'vaccination' | 'harvest' | 'sale'
  // Poultry / Livestock
  | 'egg_collection'
  | 'milk_collection'
  | 'birth'
  | 'breeding'
  | 'pregnancy_check'
  | 'weaning'
  | 'drying_off'
  // Aquaculture
  | 'water_quality'
  | 'stocking'
  | 'feeding_record'
  | 'partial_harvest'
  // Crops / Horticulture / Orchard
  | 'planting'
  | 'fertilisation'
  | 'irrigation'
  | 'spraying'
  | 'scouting'
  | 'weeding'
  | 'pruning'
  | 'thinning'
  | 'pollination'
  // Apiary
  | 'hive_inspection'
  | 'honey_harvest'
  | 'swarm_control'
  | 'queen_management'
  // Mushroom
  | 'substrate_prep'
  | 'inoculation';

export interface EventField {
  id: string;
  label: string;
  type: 'number' | 'text' | 'select' | 'date' | 'textarea' | 'boolean';
  unit?: string;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  computed?: boolean; // display-only, auto-calculated from other fields
}

export interface EventTypeConfig {
  type: UniversalEventType;
  label: string;
  icon: string;
  description: string;
  /** Which template categories show this event type */
  categories: ProductionCategory[];
  fields: EventField[];
  /** Does submitting this event create material outputs (routes to inventory/processing/etc)? */
  hasOutputs?: boolean;
  /** Does this event create a finance:cost entry automatically? */
  hasCost?: boolean;
  /** Does this event create a finance:income entry automatically? */
  hasIncome?: boolean;
  color: string; // tailwind bg color class
}

// ─── UNIVERSAL EVENTS ─────────────────────────────────────────────────────────

const ALL_CATEGORIES: ProductionCategory[] = [
  'poultry', 'livestock', 'aquaculture', 'crops',
  'horticulture', 'greenhouse', 'orchard', 'apiary', 'mushroom',
  'processing', 'services',
];

const FIELD_CATEGORIES: ProductionCategory[] = [
  'crops', 'horticulture', 'greenhouse', 'orchard',
];

const ANIMAL_CATEGORIES: ProductionCategory[] = [
  'poultry', 'livestock', 'aquaculture',
];

export const EVENT_TYPES: EventTypeConfig[] = [

  // ─── Observation (all) ───────────────────────────────────────────────────
  {
    type: 'observation',
    label: 'Observation',
    icon: '👁️',
    description: 'General farm/field observation or note',
    categories: ALL_CATEGORIES,
    color: 'bg-slate-100',
    fields: [
      { id: 'subject', label: 'Subject', type: 'text', placeholder: 'What did you observe?', required: true },
      { id: 'severity', label: 'Severity', type: 'select', options: ['Info', 'Watch', 'Warning', 'Critical'] },
      { id: 'action_taken', label: 'Action Taken', type: 'textarea', placeholder: 'What was done (if anything)?' },
      { id: 'notes', label: 'Additional Notes', type: 'textarea' },
    ],
  },

  // ─── Mortality ────────────────────────────────────────────────────────────
  {
    type: 'mortality',
    label: 'Mortality / Loss',
    icon: '💀',
    description: 'Record death or loss of animals / plants',
    categories: ANIMAL_CATEGORIES,
    color: 'bg-red-50',
    fields: [
      { id: 'count', label: 'Count', type: 'number', unit: 'head', required: true, placeholder: '0' },
      { id: 'cause', label: 'Cause', type: 'select', required: true, options: ['Disease', 'Injury', 'Predator', 'Poor nutrition', 'Environmental stress', 'Culled', 'Unknown', 'Other'] },
      { id: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe symptoms or circumstances' },
      { id: 'disposition', label: 'Disposition of Carcass', type: 'select', options: ['Buried', 'Composted', 'Incinerated', 'Rendering', 'Post-mortem sent', 'Other'] },
      { id: 'post_mortem', label: 'Post-Mortem Done?', type: 'boolean' },
    ],
  },

  // ─── Treatment ────────────────────────────────────────────────────────────
  {
    type: 'treatment',
    label: 'Treatment',
    icon: '💊',
    description: 'Disease treatment, medication, pest control',
    categories: ALL_CATEGORIES,
    color: 'bg-orange-50',
    hasCost: true,
    fields: [
      { id: 'product', label: 'Product / Chemical', type: 'text', required: true },
      { id: 'target', label: 'Target (disease/pest)', type: 'text', placeholder: 'e.g. Coccidiosis, Aphids' },
      { id: 'dose', label: 'Dose / Rate', type: 'text', placeholder: 'e.g. 2ml/L, 500g/ha' },
      { id: 'route', label: 'Route / Method', type: 'select', options: ['Oral (water)', 'Injectable', 'Topical', 'Spray', 'Pour-on', 'Drench', 'Dip', 'In-feed', 'Fumigation', 'Other'] },
      { id: 'treated_count', label: 'Animals Treated', type: 'number', unit: 'head' },
      { id: 'area_treated', label: 'Area Treated', type: 'number', unit: 'ha' },
      { id: 'withdrawal_days', label: 'Withdrawal Period', type: 'number', unit: 'days' },
      { id: 'cost', label: 'Cost', type: 'number', unit: 'currency', required: false },
      { id: 'batch_no', label: 'Batch / Lot No.', type: 'text' },
      { id: 'prescribed_by', label: 'Prescribed By', type: 'text' },
    ],
  },

  // ─── Vaccination ─────────────────────────────────────────────────────────
  {
    type: 'vaccination',
    label: 'Vaccination',
    icon: '💉',
    description: 'Vaccine administration record',
    categories: ANIMAL_CATEGORIES,
    color: 'bg-blue-50',
    hasCost: true,
    fields: [
      { id: 'vaccine_name', label: 'Vaccine Name', type: 'text', required: true },
      { id: 'disease_target', label: 'Disease Target', type: 'text', placeholder: 'e.g. Newcastle, Foot & Mouth' },
      { id: 'route', label: 'Route', type: 'select', options: ['Oral (water)', 'Eye drop', 'Nasal spray', 'Wing-web', 'Injectable (SC)', 'Injectable (IM)', 'Other'] },
      { id: 'dose', label: 'Dose', type: 'text', placeholder: 'e.g. 1 dose per bird' },
      { id: 'vaccinated_count', label: 'Animals Vaccinated', type: 'number', unit: 'head', required: true },
      { id: 'batch_no', label: 'Batch / Lot No.', type: 'text' },
      { id: 'expiry', label: 'Vaccine Expiry', type: 'date' },
      { id: 'cost', label: 'Cost', type: 'number', unit: 'currency' },
      { id: 'next_due', label: 'Next Due Date', type: 'date' },
      { id: 'administered_by', label: 'Administered By', type: 'text' },
    ],
  },

  // ─── Weighing ─────────────────────────────────────────────────────────────
  {
    type: 'weighing',
    label: 'Weighing / Sampling',
    icon: '⚖️',
    description: 'Body weight or biomass sampling',
    categories: ANIMAL_CATEGORIES,
    color: 'bg-purple-50',
    fields: [
      { id: 'sample_count', label: 'Sample Count', type: 'number', unit: 'head', required: true },
      { id: 'avg_weight', label: 'Average Weight', type: 'number', unit: 'kg', required: true },
      { id: 'total_biomass', label: 'Total Biomass (estimated)', type: 'number', unit: 'kg', computed: false },
      { id: 'weight_gain_since_last', label: 'Weight Gain Since Last', type: 'number', unit: 'kg/week' },
      { id: 'condition_score', label: 'Body Condition Score', type: 'select', options: ['1 – Emaciated', '2 – Thin', '3 – Ideal', '4 – Fat', '5 – Obese'] },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  // ─── Purchase ─────────────────────────────────────────────────────────────
  {
    type: 'purchase',
    label: 'Input Purchase',
    icon: '🛒',
    description: 'Buy feed, seed, chemicals, animals, or other inputs',
    categories: ALL_CATEGORIES,
    color: 'bg-amber-50',
    hasCost: true,
    fields: [
      { id: 'item', label: 'Item Name', type: 'text', required: true, placeholder: 'e.g. Layer Mash, Maize Seed, Tilmicosin' },
      { id: 'category', label: 'Category', type: 'select', required: true, options: ['Feed', 'Seed / Planting material', 'Fertiliser', 'Chemical / Medicine', 'Animals / Birds / Fingerlings', 'Packaging', 'Equipment', 'Fuel', 'Labour', 'Other'] },
      { id: 'quantity', label: 'Quantity', type: 'number', required: true },
      { id: 'unit', label: 'Unit', type: 'text', placeholder: 'kg, bags, head, litres…' },
      { id: 'unit_cost', label: 'Unit Cost', type: 'number', unit: 'currency', required: true },
      { id: 'total_cost', label: 'Total Cost', type: 'number', unit: 'currency', computed: true },
      { id: 'supplier', label: 'Supplier', type: 'text' },
      { id: 'receipt_no', label: 'Receipt / Invoice No.', type: 'text' },
      { id: 'add_to_inventory', label: 'Add to Inventory', type: 'boolean' },
    ],
  },

  // ─── Transfer ─────────────────────────────────────────────────────────────
  {
    type: 'transfer',
    label: 'Transfer / Move',
    icon: '🔁',
    description: 'Move animals, produce, or materials between locations',
    categories: ALL_CATEGORIES,
    color: 'bg-cyan-50',
    fields: [
      { id: 'item', label: 'Item / Animal', type: 'text', required: true },
      { id: 'count', label: 'Count / Quantity', type: 'number', required: true },
      { id: 'unit', label: 'Unit', type: 'text', placeholder: 'head, kg, crates…' },
      { id: 'from_location', label: 'From', type: 'text', placeholder: 'e.g. House 1, Pond A' },
      { id: 'to_location', label: 'To', type: 'text', placeholder: 'e.g. House 2, Quarantine', required: true },
      { id: 'reason', label: 'Reason', type: 'text' },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  // ─── Sale ─────────────────────────────────────────────────────────────────
  {
    type: 'sale',
    label: 'Direct Sale',
    icon: '💵',
    description: 'Record a farm-gate or direct sale',
    categories: ALL_CATEGORIES,
    color: 'bg-green-50',
    hasIncome: true,
    hasOutputs: true,
    fields: [
      { id: 'product', label: 'Product', type: 'text', required: true, placeholder: 'e.g. Live broilers, Maize bags' },
      { id: 'quantity', label: 'Quantity', type: 'number', required: true },
      { id: 'unit', label: 'Unit', type: 'text', required: true, placeholder: 'kg, head, bags, crates…' },
      { id: 'unit_price', label: 'Unit Price', type: 'number', unit: 'currency', required: true },
      { id: 'total_value', label: 'Total Value', type: 'number', unit: 'currency', computed: true },
      { id: 'buyer', label: 'Buyer', type: 'text' },
      { id: 'payment_method', label: 'Payment Method', type: 'select', options: ['Cash', 'Mobile Money', 'Bank Transfer', 'Cheque', 'Credit', 'Other'] },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  // ─── Harvest (general) ────────────────────────────────────────────────────
  {
    type: 'harvest',
    label: 'Harvest',
    icon: '🌾',
    description: 'Record a harvest or slaughter output',
    categories: ALL_CATEGORIES,
    color: 'bg-yellow-50',
    hasOutputs: true,
    fields: [
      { id: 'product', label: 'Product / Output', type: 'text', required: true, placeholder: 'e.g. Maize grain, Live birds, Tomatoes' },
      { id: 'quantity', label: 'Quantity', type: 'number', required: true },
      { id: 'unit', label: 'Unit', type: 'text', required: true, placeholder: 'kg, tonnes, head, crates…' },
      { id: 'area_harvested', label: 'Area Harvested', type: 'number', unit: 'ha' },
      { id: 'quality_grade', label: 'Quality Grade', type: 'select', options: ['Premium / Grade A', 'Grade B', 'Grade C', 'Below Grade', 'Mixed'] },
      { id: 'routing', label: 'Route To', type: 'select', required: true, options: ['Inventory', 'Direct Sale', 'Processing', 'Own Use', 'Waste'] },
      { id: 'price_per_unit', label: 'Est. Price / Unit', type: 'number', unit: 'currency' },
      { id: 'method', label: 'Method', type: 'select', options: ['Manual', 'Mechanical', 'Combined', 'Other'] },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  // ─── EGG COLLECTION ──────────────────────────────────────────────────────
  {
    type: 'egg_collection',
    label: 'Egg Collection',
    icon: '🥚',
    description: 'Daily egg collection from laying flock',
    categories: ['poultry'],
    color: 'bg-yellow-50',
    hasOutputs: true,
    fields: [
      { id: 'total_collected', label: 'Total Collected', type: 'number', unit: 'eggs', required: true },
      { id: 'table_eggs', label: 'Table Eggs', type: 'number', unit: 'eggs' },
      { id: 'hatching_eggs', label: 'Hatching Eggs', type: 'number', unit: 'eggs' },
      { id: 'cracked', label: 'Cracked / Damaged', type: 'number', unit: 'eggs' },
      { id: 'dirty', label: 'Dirty / Soiled', type: 'number', unit: 'eggs' },
      { id: 'avg_egg_weight', label: 'Avg Egg Weight', type: 'number', unit: 'g' },
      { id: 'collection_round', label: 'Collection Round', type: 'select', options: ['Morning', 'Afternoon', 'Evening', 'Full Day'] },
    ],
  },

  // ─── MILK COLLECTION ──────────────────────────────────────────────────────
  {
    type: 'milk_collection',
    label: 'Milk Collection',
    icon: '🥛',
    description: 'Daily milk yield recording',
    categories: ['livestock'],
    color: 'bg-blue-50',
    hasOutputs: true,
    fields: [
      { id: 'cows_milked', label: 'Animals Milked', type: 'number', unit: 'head', required: true },
      { id: 'morning_litres', label: 'Morning Yield', type: 'number', unit: 'litres' },
      { id: 'afternoon_litres', label: 'Afternoon Yield', type: 'number', unit: 'litres' },
      { id: 'evening_litres', label: 'Evening Yield', type: 'number', unit: 'litres' },
      { id: 'total_litres', label: 'Total Yield', type: 'number', unit: 'litres', required: true },
      { id: 'fat_pct', label: 'Fat %', type: 'number', unit: '%' },
      { id: 'protein_pct', label: 'Protein %', type: 'number', unit: '%' },
      { id: 'scc', label: 'SCC (cells/ml)', type: 'number' },
      { id: 'temperature', label: 'Storage Temp', type: 'number', unit: '°C' },
      { id: 'routing', label: 'Route To', type: 'select', options: ['Sale', 'Processing', 'Own Use / Calves', 'Waste (mastitis etc)'] },
    ],
  },

  // ─── BIRTH / CALVING / FARROWING / KIDDING ────────────────────────────────
  {
    type: 'birth',
    label: 'Birth / Calving / Farrowing',
    icon: '🐣',
    description: 'Record offspring born — any livestock species',
    categories: ['livestock', 'poultry'],
    color: 'bg-pink-50',
    fields: [
      { id: 'dam_id', label: 'Dam / Mother ID', type: 'text' },
      { id: 'sire_id', label: 'Sire / Father ID', type: 'text' },
      { id: 'offspring_born', label: 'Total Born', type: 'number', unit: 'head', required: true },
      { id: 'offspring_alive', label: 'Born Alive', type: 'number', unit: 'head', required: true },
      { id: 'stillborn', label: 'Stillborn', type: 'number', unit: 'head' },
      { id: 'male_count', label: 'Males', type: 'number', unit: 'head' },
      { id: 'female_count', label: 'Females', type: 'number', unit: 'head' },
      { id: 'avg_birth_weight', label: 'Avg Birth Weight', type: 'number', unit: 'kg' },
      { id: 'complications', label: 'Complications', type: 'textarea' },
      { id: 'assisted', label: 'Assisted Delivery?', type: 'boolean' },
    ],
  },

  // ─── BREEDING / MATING ───────────────────────────────────────────────────
  {
    type: 'breeding',
    label: 'Breeding / Mating',
    icon: '🤝',
    description: 'Record a mating or artificial insemination event',
    categories: ['livestock', 'poultry'],
    color: 'bg-rose-50',
    fields: [
      { id: 'method', label: 'Method', type: 'select', options: ['Natural mating', 'Artificial Insemination (AI)', 'Embryo Transfer'] },
      { id: 'female_count', label: 'Females Bred', type: 'number', unit: 'head', required: true },
      { id: 'sire', label: 'Sire / Bull / Boar ID', type: 'text' },
      { id: 'breed', label: 'Sire Breed', type: 'text' },
      { id: 'semen_batch', label: 'Semen Batch No.', type: 'text' },
      { id: 'expected_birth', label: 'Expected Birth (approx)', type: 'date' },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  // ─── PREGNANCY CHECK ─────────────────────────────────────────────────────
  {
    type: 'pregnancy_check',
    label: 'Pregnancy Check',
    icon: '🔬',
    description: 'Pregnancy diagnosis results',
    categories: ['livestock'],
    color: 'bg-purple-50',
    fields: [
      { id: 'method', label: 'Method', type: 'select', options: ['Physical palpation', 'Ultrasound', 'Blood test', 'Milk progesterone', 'Visual'] },
      { id: 'positive', label: 'Pregnant', type: 'number', unit: 'head', required: true },
      { id: 'negative', label: 'Open / Not Pregnant', type: 'number', unit: 'head' },
      { id: 'uncertain', label: 'Uncertain', type: 'number', unit: 'head' },
      { id: 'expected_births', label: 'Expected Birth Range', type: 'text', placeholder: 'e.g. 2026-09-01 to 2026-09-15' },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  // ─── WEANING ─────────────────────────────────────────────────────────────
  {
    type: 'weaning',
    label: 'Weaning',
    icon: '🍼',
    description: 'Wean offspring from dams',
    categories: ['livestock'],
    color: 'bg-orange-50',
    fields: [
      { id: 'count', label: 'Count Weaned', type: 'number', unit: 'head', required: true },
      { id: 'avg_weight', label: 'Avg Weaning Weight', type: 'number', unit: 'kg' },
      { id: 'age_days', label: 'Age at Weaning', type: 'number', unit: 'days' },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  // ─── DRYING OFF ──────────────────────────────────────────────────────────
  {
    type: 'drying_off',
    label: 'Drying Off',
    icon: '🛑',
    description: 'Cease milking for dry period',
    categories: ['livestock'],
    color: 'bg-slate-50',
    fields: [
      { id: 'count', label: 'Animals Dried Off', type: 'number', unit: 'head', required: true },
      { id: 'dry_cow_therapy', label: 'Dry Cow Therapy Applied?', type: 'boolean' },
      { id: 'product', label: 'DCT Product', type: 'text' },
      { id: 'expected_calving', label: 'Expected Next Calving', type: 'date' },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  // ─── WATER QUALITY ───────────────────────────────────────────────────────
  {
    type: 'water_quality',
    label: 'Water Quality',
    icon: '🌊',
    description: 'Record pond/tank water parameters',
    categories: ['aquaculture'],
    color: 'bg-cyan-50',
    fields: [
      { id: 'location', label: 'Pond / Tank', type: 'text', placeholder: 'e.g. Pond A, Tank 3', required: true },
      { id: 'do_mgl', label: 'Dissolved Oxygen (DO)', type: 'number', unit: 'mg/L' },
      { id: 'ph', label: 'pH', type: 'number' },
      { id: 'temperature', label: 'Temperature', type: 'number', unit: '°C' },
      { id: 'ammonia', label: 'Ammonia (NH₃)', type: 'number', unit: 'mg/L' },
      { id: 'nitrite', label: 'Nitrite (NO₂)', type: 'number', unit: 'mg/L' },
      { id: 'salinity', label: 'Salinity', type: 'number', unit: 'ppt' },
      { id: 'turbidity', label: 'Turbidity / Secchi', type: 'select', options: ['Clear (>40cm)', 'Moderate (20–40cm)', 'Turbid (<20cm)', 'Algae bloom'] },
      { id: 'action_taken', label: 'Action Taken', type: 'textarea', placeholder: 'e.g. Added lime, increased aeration' },
    ],
  },

  // ─── STOCKING ────────────────────────────────────────────────────────────
  {
    type: 'stocking',
    label: 'Stocking / Seeding',
    icon: '🐟',
    description: 'Stock fish/shrimp fingerlings into pond or tank',
    categories: ['aquaculture'],
    color: 'bg-teal-50',
    hasCost: true,
    fields: [
      { id: 'species', label: 'Species', type: 'text', required: true },
      { id: 'location', label: 'Pond / Tank', type: 'text', required: true },
      { id: 'count', label: 'Number Stocked', type: 'number', unit: 'fingerlings', required: true },
      { id: 'avg_weight', label: 'Avg Fingerling Weight', type: 'number', unit: 'g' },
      { id: 'stocking_density', label: 'Stocking Density', type: 'number', unit: '/m³' },
      { id: 'source', label: 'Source / Hatchery', type: 'text' },
      { id: 'cost_per_fingerling', label: 'Cost per Fingerling', type: 'number', unit: 'currency' },
      { id: 'total_cost', label: 'Total Cost', type: 'number', unit: 'currency', computed: true },
    ],
  },

  // ─── FEEDING RECORD ──────────────────────────────────────────────────────
  {
    type: 'feeding_record',
    label: 'Feeding Record',
    icon: '🍽️',
    description: 'Record feed given to fish/shrimp',
    categories: ['aquaculture'],
    color: 'bg-amber-50',
    hasCost: true,
    fields: [
      { id: 'location', label: 'Pond / Tank', type: 'text', required: true },
      { id: 'feed_type', label: 'Feed Type / Brand', type: 'text', required: true },
      { id: 'amount_kg', label: 'Amount Fed', type: 'number', unit: 'kg', required: true },
      { id: 'feeding_rate_pct', label: 'Feeding Rate', type: 'number', unit: '% of biomass' },
      { id: 'feed_response', label: 'Feed Response', type: 'select', options: ['Excellent', 'Good', 'Moderate', 'Poor — uneaten'] },
      { id: 'uneaten_pct', label: 'Estimated Uneaten', type: 'number', unit: '%' },
      { id: 'cost_per_kg', label: 'Feed Cost / kg', type: 'number', unit: 'currency' },
    ],
  },

  // ─── PARTIAL HARVEST (aquaculture) ───────────────────────────────────────
  {
    type: 'partial_harvest',
    label: 'Partial Harvest',
    icon: '🎣',
    description: 'Selective harvest from pond/tank',
    categories: ['aquaculture'],
    color: 'bg-green-50',
    hasOutputs: true,
    hasIncome: true,
    fields: [
      { id: 'location', label: 'Pond / Tank', type: 'text', required: true },
      { id: 'count', label: 'Fish Harvested', type: 'number', unit: 'fish' },
      { id: 'total_weight', label: 'Total Weight', type: 'number', unit: 'kg', required: true },
      { id: 'avg_weight', label: 'Avg Weight', type: 'number', unit: 'g' },
      { id: 'remaining_estimate', label: 'Est. Remaining Biomass', type: 'number', unit: 'kg' },
      { id: 'routing', label: 'Route To', type: 'select', options: ['Sale', 'Processing', 'Inventory', 'Own Use'] },
      { id: 'price_per_kg', label: 'Price / kg', type: 'number', unit: 'currency' },
    ],
  },

  // ─── PLANTING ────────────────────────────────────────────────────────────
  {
    type: 'planting',
    label: 'Planting / Sowing',
    icon: '🌱',
    description: 'Record planting or seeding of crops',
    categories: FIELD_CATEGORIES,
    color: 'bg-green-50',
    hasCost: true,
    fields: [
      { id: 'crop', label: 'Crop / Variety', type: 'text', required: true },
      { id: 'area', label: 'Area Planted', type: 'number', unit: 'ha', required: true },
      { id: 'seed_rate', label: 'Seed Rate', type: 'number', unit: 'kg/ha' },
      { id: 'seeds_per_hole', label: 'Seeds per Hole', type: 'number' },
      { id: 'spacing_row_cm', label: 'Row Spacing', type: 'number', unit: 'cm' },
      { id: 'spacing_plant_cm', label: 'Plant Spacing', type: 'number', unit: 'cm' },
      { id: 'depth_cm', label: 'Planting Depth', type: 'number', unit: 'cm' },
      { id: 'method', label: 'Method', type: 'select', options: ['Broadcast', 'Direct drill', 'Transplant', 'Hand planting', 'Ridges', 'Beds'] },
      { id: 'seed_source', label: 'Seed Source', type: 'text' },
      { id: 'cost', label: 'Seed Cost', type: 'number', unit: 'currency' },
    ],
  },

  // ─── FERTILISATION ───────────────────────────────────────────────────────
  {
    type: 'fertilisation',
    label: 'Fertilisation',
    icon: '💩',
    description: 'Record fertiliser or manure application',
    categories: FIELD_CATEGORIES,
    color: 'bg-amber-50',
    hasCost: true,
    fields: [
      { id: 'product', label: 'Product / Fertiliser', type: 'text', required: true, placeholder: 'e.g. D-Compound, Urea, Cattle manure' },
      { id: 'type', label: 'Type', type: 'select', options: ['Basal dressing', 'Top dressing', 'Foliar spray', 'Organic / Manure', 'Lime / pH amendment', 'Fertigation'] },
      { id: 'rate', label: 'Application Rate', type: 'number', unit: 'kg/ha or L/ha' },
      { id: 'area', label: 'Area Applied', type: 'number', unit: 'ha', required: true },
      { id: 'total_applied', label: 'Total Applied', type: 'number', unit: 'kg or L', computed: true },
      { id: 'method', label: 'Application Method', type: 'select', options: ['Broadcast', 'Banded / Side-dressed', 'Foliar spray', 'Fertigation / Drip', 'Manual basal'] },
      { id: 'npk', label: 'NPK Grade', type: 'text', placeholder: 'e.g. 10:18:24' },
      { id: 'cost', label: 'Cost', type: 'number', unit: 'currency' },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  // ─── IRRIGATION ──────────────────────────────────────────────────────────
  {
    type: 'irrigation',
    label: 'Irrigation',
    icon: '💧',
    description: 'Record water application to field/crop',
    categories: FIELD_CATEGORIES,
    color: 'bg-blue-50',
    fields: [
      { id: 'area', label: 'Area Irrigated', type: 'number', unit: 'ha', required: true },
      { id: 'method', label: 'Method', type: 'select', options: ['Flood / Basin', 'Drip', 'Sprinkler', 'Furrow', 'Centre pivot', 'Manual / Watering can'] },
      { id: 'duration_hrs', label: 'Duration', type: 'number', unit: 'hours' },
      { id: 'volume_mm', label: 'Water Applied', type: 'number', unit: 'mm' },
      { id: 'source', label: 'Water Source', type: 'select', options: ['Borehole', 'River / Canal', 'Dam / Reservoir', 'Municipal / Town', 'Rainwater harvest', 'Other'] },
      { id: 'cost', label: 'Cost (fuel/electricity)', type: 'number', unit: 'currency' },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  // ─── SPRAYING ────────────────────────────────────────────────────────────
  {
    type: 'spraying',
    label: 'Spraying',
    icon: '🧴',
    description: 'Pesticide, herbicide, or fungicide application',
    categories: FIELD_CATEGORIES,
    color: 'bg-red-50',
    hasCost: true,
    fields: [
      { id: 'product', label: 'Product Name', type: 'text', required: true },
      { id: 'ai', label: 'Active Ingredient', type: 'text' },
      { id: 'target', label: 'Target Pest / Disease / Weed', type: 'text', required: true },
      { id: 'type', label: 'Type', type: 'select', options: ['Herbicide', 'Fungicide', 'Insecticide', 'Acaricide', 'Bactericide', 'Growth Regulator', 'Other'] },
      { id: 'rate_per_ha', label: 'Rate', type: 'number', unit: 'g or ml / ha' },
      { id: 'water_per_ha', label: 'Water Volume', type: 'number', unit: 'L/ha' },
      { id: 'area', label: 'Area Sprayed', type: 'number', unit: 'ha', required: true },
      { id: 'method', label: 'Equipment', type: 'select', options: ['Knapsack sprayer', 'Tractor boom', 'Drone / UAV', 'Aerial', 'Fogger / Mist blower'] },
      { id: 'phi_days', label: 'Pre-Harvest Interval', type: 'number', unit: 'days' },
      { id: 'wind_speed', label: 'Wind Speed', type: 'text', placeholder: 'e.g. Calm, <10 km/h' },
      { id: 'cost', label: 'Cost', type: 'number', unit: 'currency' },
    ],
  },

  // ─── SCOUTING ────────────────────────────────────────────────────────────
  {
    type: 'scouting',
    label: 'Field Scouting',
    icon: '🔍',
    description: 'Crop health, pest & disease monitoring',
    categories: FIELD_CATEGORIES,
    color: 'bg-teal-50',
    fields: [
      { id: 'growth_stage', label: 'Growth Stage', type: 'text', placeholder: 'e.g. V4, Flowering, Pod-fill' },
      { id: 'pest_disease', label: 'Pest / Disease Found', type: 'text' },
      { id: 'severity', label: 'Severity', type: 'select', options: ['None', 'Low (<10%)', 'Moderate (10–30%)', 'High (30–60%)', 'Severe (>60%)'] },
      { id: 'area_affected_pct', label: 'Area Affected', type: 'number', unit: '%' },
      { id: 'action_recommended', label: 'Recommended Action', type: 'textarea' },
      { id: 'weed_pressure', label: 'Weed Pressure', type: 'select', options: ['None', 'Low', 'Moderate', 'High'] },
      { id: 'observations', label: 'General Observations', type: 'textarea' },
      { id: 'next_scout_date', label: 'Next Scouting Date', type: 'date' },
    ],
  },

  // ─── WEEDING ─────────────────────────────────────────────────────────────
  {
    type: 'weeding',
    label: 'Weeding',
    icon: '🌿',
    description: 'Manual or mechanical weed removal',
    categories: FIELD_CATEGORIES,
    color: 'bg-lime-50',
    fields: [
      { id: 'area', label: 'Area Weeded', type: 'number', unit: 'ha', required: true },
      { id: 'method', label: 'Method', type: 'select', options: ['Hand weeding', 'Mechanical (hoe)', 'Tractor cultivation', 'Herbicide (chemical)', 'Mulching'] },
      { id: 'labour_days', label: 'Labour Days', type: 'number', unit: 'person-days' },
      { id: 'cost', label: 'Labour / Material Cost', type: 'number', unit: 'currency' },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  // ─── PRUNING ─────────────────────────────────────────────────────────────
  {
    type: 'pruning',
    label: 'Pruning / Trimming',
    icon: '✂️',
    description: 'Prune trees, vines, or plants',
    categories: ['orchard', 'horticulture', 'greenhouse'],
    color: 'bg-emerald-50',
    fields: [
      { id: 'area', label: 'Area / Trees', type: 'text', required: true, placeholder: 'e.g. 2 ha, 150 trees' },
      { id: 'type', label: 'Type', type: 'select', options: ['Maintenance pruning', 'Corrective pruning', 'Thinning', 'Topping / hedging', 'Skirting', 'Dead-wooding', 'Training'] },
      { id: 'tools', label: 'Tools Used', type: 'text' },
      { id: 'labour_days', label: 'Labour Days', type: 'number', unit: 'person-days' },
      { id: 'cost', label: 'Cost', type: 'number', unit: 'currency' },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  // ─── THINNING ────────────────────────────────────────────────────────────
  {
    type: 'thinning',
    label: 'Fruit Thinning',
    icon: '🍑',
    description: 'Remove excess fruit to improve size and quality',
    categories: ['orchard', 'horticulture'],
    color: 'bg-orange-50',
    fields: [
      { id: 'area', label: 'Area / Trees', type: 'text', required: true },
      { id: 'method', label: 'Method', type: 'select', options: ['Hand thinning', 'Chemical thinning', 'Mechanical'] },
      { id: 'target_load', label: 'Target Fruit Load', type: 'text', placeholder: 'e.g. 1 fruit per 25 leaves' },
      { id: 'labour_days', label: 'Labour Days', type: 'number', unit: 'person-days' },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  // ─── POLLINATION ─────────────────────────────────────────────────────────
  {
    type: 'pollination',
    label: 'Pollination',
    icon: '🐝',
    description: 'Assisted or hive pollination record',
    categories: ['orchard', 'horticulture', 'greenhouse'],
    color: 'bg-yellow-50',
    fields: [
      { id: 'method', label: 'Method', type: 'select', options: ['Honey bee hives (placed)', 'Bumblebee hives', 'Hand pollination', 'Natural wind / open'] },
      { id: 'hives_placed', label: 'Hives Placed', type: 'number', unit: 'hives' },
      { id: 'area', label: 'Area Covered', type: 'number', unit: 'ha' },
      { id: 'bloom_stage', label: 'Bloom Stage', type: 'select', options: ['Pre-bloom', 'Early bloom (10%)', 'Full bloom (80%+)', 'Petal fall'] },
      { id: 'cost', label: 'Hive Hire Cost', type: 'number', unit: 'currency' },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  // ─── HIVE INSPECTION ─────────────────────────────────────────────────────
  {
    type: 'hive_inspection',
    label: 'Hive Inspection',
    icon: '🔎',
    description: 'Regular colony health check',
    categories: ['apiary'],
    color: 'bg-amber-50',
    fields: [
      { id: 'hive_id', label: 'Hive ID', type: 'text', required: true },
      { id: 'queen_seen', label: 'Queen Seen?', type: 'boolean' },
      { id: 'queen_laying', label: 'Laying Normally?', type: 'boolean' },
      { id: 'brood_pattern', label: 'Brood Pattern', type: 'select', options: ['Excellent – solid', 'Good – minor gaps', 'Fair – scattered', 'Poor – serious issue'] },
      { id: 'honey_stores', label: 'Honey Stores', type: 'select', options: ['Full – supers capped', 'Adequate', 'Low – supplement needed', 'Empty – emergency'] },
      { id: 'population', label: 'Colony Population', type: 'select', options: ['Very strong (12+ frames)', 'Strong (8–12)', 'Medium (4–8)', 'Weak (<4 frames)'] },
      { id: 'varroa_count', label: 'Varroa Mite Count', type: 'number', unit: 'mites/100 bees' },
      { id: 'disease_signs', label: 'Disease / Pest Signs', type: 'text' },
      { id: 'action_taken', label: 'Action Taken', type: 'textarea' },
    ],
  },

  // ─── HONEY HARVEST ───────────────────────────────────────────────────────
  {
    type: 'honey_harvest',
    label: 'Honey Harvest',
    icon: '🍯',
    description: 'Record honey and wax extraction',
    categories: ['apiary'],
    color: 'bg-yellow-50',
    hasOutputs: true,
    hasIncome: true,
    fields: [
      { id: 'hives_harvested', label: 'Hives Harvested', type: 'number', unit: 'hives', required: true },
      { id: 'frames_extracted', label: 'Frames Extracted', type: 'number', unit: 'frames' },
      { id: 'honey_kg', label: 'Honey Yield', type: 'number', unit: 'kg', required: true },
      { id: 'wax_kg', label: 'Wax Yield', type: 'number', unit: 'kg' },
      { id: 'moisture_pct', label: 'Moisture %', type: 'number', unit: '%' },
      { id: 'color_grade', label: 'Colour Grade', type: 'select', options: ['Water white', 'Extra white', 'White', 'Extra light amber', 'Light amber', 'Amber', 'Dark'] },
      { id: 'routing', label: 'Route To', type: 'select', options: ['Sale', 'Inventory / Storage', 'Processing', 'Own Use'] },
      { id: 'price_per_kg', label: 'Est. Price / kg', type: 'number', unit: 'currency' },
    ],
  },

  // ─── SWARM CONTROL ───────────────────────────────────────────────────────
  {
    type: 'swarm_control',
    label: 'Swarm Control',
    icon: '🐝',
    description: 'Swarm prevention or capture',
    categories: ['apiary'],
    color: 'bg-orange-50',
    fields: [
      { id: 'hive_id', label: 'Hive ID', type: 'text', required: true },
      { id: 'action', label: 'Action', type: 'select', options: ['Caught swarm', 'Added super (prevent)', 'Split colony', 'Removed queen cells', 'Clipped queen wings', 'Artificial swarm'] },
      { id: 'swarm_caught', label: 'Swarm Successfully Captured?', type: 'boolean' },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  // ─── QUEEN MANAGEMENT ────────────────────────────────────────────────────
  {
    type: 'queen_management',
    label: 'Queen Management',
    icon: '👑',
    description: 'Queen introduction, removal, or marking',
    categories: ['apiary'],
    color: 'bg-purple-50',
    fields: [
      { id: 'hive_id', label: 'Hive ID', type: 'text', required: true },
      { id: 'action', label: 'Action', type: 'select', options: ['Queen introduced', 'Queen removed', 'Queen marked', 'Queen clipped', 'Requeen (replace)', 'Queen cell introduced', 'Queen cell removed'] },
      { id: 'queen_source', label: 'Queen Source / Breed', type: 'text' },
      { id: 'acceptance', label: 'Queen Accepted?', type: 'boolean' },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  // ─── SUBSTRATE PREPARATION (mushroom) ────────────────────────────────────
  {
    type: 'substrate_prep',
    label: 'Substrate Preparation',
    icon: '🪵',
    description: 'Prepare and sterilise growing substrate',
    categories: ['mushroom'],
    color: 'bg-stone-50',
    hasCost: true,
    fields: [
      { id: 'substrate_type', label: 'Substrate Type', type: 'text', required: true, placeholder: 'e.g. Wheat straw, Sawdust, Cottonseed hulls' },
      { id: 'dry_weight_kg', label: 'Dry Weight', type: 'number', unit: 'kg', required: true },
      { id: 'supplement', label: 'Supplement Added', type: 'text', placeholder: 'e.g. Wheat bran 20%, Lime 2%' },
      { id: 'moisture_pct', label: 'Target Moisture %', type: 'number', unit: '%' },
      { id: 'sterilization', label: 'Sterilisation Method', type: 'select', options: ['Autoclave', 'Pressure cooker', 'Pasteurisation (hot water)', 'Steam', 'Lime pasteurisation', 'Fermentation (LSPS)'] },
      { id: 'bags_prepared', label: 'Bags / Blocks Prepared', type: 'number', unit: 'bags' },
      { id: 'cost', label: 'Material Cost', type: 'number', unit: 'currency' },
    ],
  },

  // ─── INOCULATION (mushroom) ───────────────────────────────────────────────
  {
    type: 'inoculation',
    label: 'Inoculation',
    icon: '🔬',
    description: 'Inoculate substrate with mushroom spawn',
    categories: ['mushroom'],
    color: 'bg-violet-50',
    hasCost: true,
    fields: [
      { id: 'spawn_type', label: 'Spawn Type / Species', type: 'text', required: true, placeholder: 'e.g. Oyster mushroom grain spawn' },
      { id: 'spawn_rate_pct', label: 'Spawn Rate', type: 'number', unit: '% of substrate wt' },
      { id: 'bags_inoculated', label: 'Bags Inoculated', type: 'number', unit: 'bags', required: true },
      { id: 'incubation_room', label: 'Incubation Room / Location', type: 'text' },
      { id: 'expected_colonise_days', label: 'Expected Colonisation', type: 'number', unit: 'days' },
      { id: 'expected_pin_date', label: 'Expected Pinning Date', type: 'date' },
      { id: 'spawn_source', label: 'Spawn Supplier', type: 'text' },
      { id: 'cost', label: 'Spawn Cost', type: 'number', unit: 'currency' },
    ],
  },

];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get event types relevant to a template category */
export function getEventTypesForCategory(category: ProductionCategory): EventTypeConfig[] {
  return EVENT_TYPES.filter(e => e.categories.includes(category));
}

/** Get a specific event type config */
export function getEventType(type: UniversalEventType): EventTypeConfig | undefined {
  return EVENT_TYPES.find(e => e.type === type);
}

/** All event types as a lookup map */
export const EVENT_TYPE_MAP: Record<string, EventTypeConfig> = Object.fromEntries(
  EVENT_TYPES.map(e => [e.type, e])
);
