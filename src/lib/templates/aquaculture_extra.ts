// ─────────────────────────────────────────────────────────────────────────────
// Extra Aquaculture Templates: Shrimp, Rainbow Trout, Common Carp, Aquaponics
// ─────────────────────────────────────────────────────────────────────────────
import type { ProductionTemplate } from '../types';

// ─── SHRIMP / PRAWN ──────────────────────────────────────────────────────────
export const shrimpTemplate: ProductionTemplate = {
  id: 'shrimp',
  name: 'Freshwater Prawn / Shrimp',
  shortName: 'Shrimp',
  category: 'aquaculture',
  species: 'Macrobrachium rosenbergii',
  purpose: 'Prawn / Shrimp Production',
  description: 'Giant freshwater prawn production in earthen ponds. High-value product with 5–6 month grow-out cycle.',
  icon: '🦐',
  color: '#fef3c7',
  tags: ['shrimp', 'prawn', 'aquaculture', 'high-value', 'freshwater'],
  materials: [
    { id: 'pnl', name: 'Post-Larvae (PL15)', unit: 'count', category: 'input' },
    { id: 'shrimp-feed', name: 'Shrimp Pellets (35% CP)', unit: 'kg', category: 'input' },
    { id: 'lime', name: 'Agricultural Lime', unit: 'kg', category: 'input' },
    { id: 'shrimp-out', name: 'Whole Shrimp', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'survival', name: 'Survival Rate', unit: 'percent', benchmark: 55 },
    { id: 'avg-weight', name: 'Avg Harvest Weight', unit: 'g', benchmark: 25 },
    { id: 'yield', name: 'Yield per Ha', unit: 'kg', benchmark: 600 },
    { id: 'fcr', name: 'Feed Conversion Ratio', unit: 'ratio', benchmark: 2.0 },
  ],
  stages: [
    {
      id: 'pond-prep', name: 'Pond Preparation', order: 1, durationDays: 21, color: '#fef9c3',
      inputs: [
        { id: 'lime', label: 'Agricultural Lime (1 t/ha)', unit: 'kg', required: true },
        { id: 'fertiliser', label: 'Organic Fertiliser for plankton bloom', unit: 'kg', required: false },
      ],
      activities: [
        { id: 'drain-dry', name: 'Drain and sun-dry pond for 10–14 days', frequency: 'once' },
        { id: 'lime', name: 'Apply lime (1,000 kg/ha) to soil and pond walls', frequency: 'once' },
        { id: 'fill', name: 'Fill pond and fertilise for plankton bloom', frequency: 'once' },
        { id: 'water-check', name: 'Check pH (7.5–8.5) and green water colour before stocking', frequency: 'daily' },
      ],
      measurements: [
        { id: 'ph', name: 'Water pH', unit: 'pH', frequency: 'daily', required: true, benchmark: { min: 7.5, max: 8.5 } },
        { id: 'secchi', name: 'Secchi Depth (turbidity)', unit: 'cm', frequency: 'daily', required: false, benchmark: { min: 25, max: 40 } },
      ],
      outputs: [], possibleNextStages: ['stocking'],
      alerts: ['Do not stock until pH is stable 7.5–8.5 and green water bloom is established'],
    },
    {
      id: 'stocking', name: 'Stocking & Nursery (weeks 1–4)', order: 2, durationDays: 28, color: '#dbeafe',
      inputs: [
        { id: 'pnl', label: 'Post-Larvae (PL15+)', unit: 'count', required: true },
        { id: 'nursery-feed', label: 'Fine Shrimp Powder (40% CP)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'acclimatise', name: 'Acclimatise PL bags in pond water for 30 min before release', frequency: 'once' },
        { id: 'feed-4x', name: 'Feed 4× daily — small amounts around pond edge', frequency: 'daily' },
        { id: 'water-check', name: 'Monitor DO, pH, ammonia and temperature twice daily', frequency: 'daily' },
        { id: 'plankton', name: 'Maintain plankton bloom with light fertilisation', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'do', name: 'Dissolved Oxygen', unit: 'mg/L', frequency: 'daily', required: true, benchmark: { min: 5 } },
        { id: 'ammonia', name: 'Total Ammonia-N', unit: 'mg/L', frequency: 'weekly', required: true, benchmark: { max: 1.0 } },
        { id: 'survival-est', name: 'Estimated Survival %', unit: 'percent', frequency: 'weekly', required: false },
      ],
      outputs: [], possibleNextStages: ['grow-out'],
      alerts: ['DO below 3 mg/L is critical — run aerators immediately', 'Overfeeding causes ammonia spike — feed only what is consumed in 2 hours'],
    },
    {
      id: 'grow-out', name: 'Grow-Out (weeks 4–20)', order: 3, durationDays: 112, color: '#a5f3fc',
      inputs: [
        { id: 'pellets', label: 'Shrimp Pellets (35% CP, 2–3 mm)', unit: 'kg', required: true },
        { id: 'probiotics', label: 'Pond Probiotics (optional)', unit: 'kg', required: false },
      ],
      activities: [
        { id: 'feed-3x', name: 'Feed 3× daily based on feed tray checks', frequency: 'daily' },
        { id: 'water-quality', name: 'Test DO, pH, ammonia and temperature daily', frequency: 'daily' },
        { id: 'cast-net', name: 'Cast net sampling weekly to check growth and adjust feeding', frequency: 'weekly' },
        { id: 'partial-harvest', name: 'Remove large males at week 14 (selective harvest)', frequency: 'weekly' },
        { id: 'aeration', name: 'Run aerators at night when DO drops', frequency: 'daily' },
      ],
      measurements: [
        { id: 'avg-weight', name: 'Average Body Weight', unit: 'g', frequency: 'weekly', required: true, benchmark: { target: 25 } },
        { id: 'do', name: 'Morning DO', unit: 'mg/L', frequency: 'daily', required: true, benchmark: { min: 4 } },
        { id: 'fcr-running', name: 'Running FCR', unit: 'ratio', frequency: 'weekly', required: false, benchmark: { max: 2.0 } },
      ],
      outputs: [
        { materialTypeId: 'shrimp-out', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Low DO at dawn is the #1 killer — check every morning before sunrise', 'Size segregation among males causes aggression — partial harvesting reduces fighting'],
    },
  ],
};

// ─── RAINBOW TROUT ───────────────────────────────────────────────────────────
export const rainbowTroutTemplate: ProductionTemplate = {
  id: 'rainbow-trout',
  name: 'Rainbow Trout',
  shortName: 'Rainbow Trout',
  category: 'aquaculture',
  species: 'Oncorhynchus mykiss',
  purpose: 'Premium Table Fish',
  description: 'Cold-water trout in raceways or tanks. Fast-growing premium fish for restaurant and retail markets. Requires cold, well-oxygenated water.',
  icon: '🐟',
  color: '#cffafe',
  tags: ['trout', 'cold water', 'premium', 'raceway', 'highland', 'table fish'],
  materials: [
    { id: 'trout-fry', name: 'Trout Fry / Fingerlings', unit: 'count', category: 'input' },
    { id: 'trout-feed', name: 'Trout Pellets (48% CP)', unit: 'kg', category: 'input' },
    { id: 'oxygen', name: 'Liquid Oxygen (if recirculating)', unit: 'L', category: 'input' },
    { id: 'whole-trout', name: 'Whole Round Trout', unit: 'kg', category: 'output' },
    { id: 'fillet', name: 'Trout Fillet', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'avg-weight', name: 'Harvest Weight (300 g portion)', unit: 'g', benchmark: 350 },
    { id: 'survival', name: 'Survival Rate', unit: 'percent', benchmark: 85 },
    { id: 'fcr', name: 'Feed Conversion Ratio', unit: 'ratio', benchmark: 1.2 },
    { id: 'sgr', name: 'Specific Growth Rate', unit: 'percent/day', benchmark: 1.8 },
  ],
  stages: [
    {
      id: 'fry', name: 'Fry Rearing (0–2 months)', order: 1, durationDays: 60, color: '#e0f2fe',
      inputs: [
        { id: 'fry', label: 'Eyed Eggs or Fry', unit: 'count', required: true },
        { id: 'fry-feed', label: 'Starter Crumbles (50% CP)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'feed-6x', name: 'Feed 6× daily — small amounts', frequency: 'daily' },
        { id: 'water-temp', name: 'Maintain water temp 10–16°C', frequency: 'daily' },
        { id: 'grade', name: 'Grade fry at 4 weeks to prevent cannibalism', frequency: 'once' },
        { id: 'dead-pick', name: 'Remove mortalities daily', frequency: 'daily' },
      ],
      measurements: [
        { id: 'water-temp', name: 'Water Temperature', unit: '°C', frequency: 'daily', required: true, benchmark: { min: 10, max: 16 } },
        { id: 'do', name: 'Dissolved Oxygen', unit: 'mg/L', frequency: 'daily', required: true, benchmark: { min: 7 } },
        { id: 'mortality', name: 'Daily Mortalities', unit: 'count', frequency: 'daily', required: true },
      ],
      outputs: [], possibleNextStages: ['fingerling'],
      alerts: ['Temperature above 20°C causes stress and disease — maintain cold inflow', 'Grade fry at 4 weeks or cannibalism losses will be severe'],
    },
    {
      id: 'fingerling', name: 'Fingerling to Grow-Out (2–6 months)', order: 2, durationDays: 120, color: '#bae6fd',
      inputs: [
        { id: 'grower-pellets', label: 'Grower Pellets (45% CP, 2–4 mm)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'feed-4x', name: 'Feed 4× daily using demand feeders or schedule', frequency: 'daily' },
        { id: 'flow-check', name: 'Check raceway flow and DO hourly during peak feed', frequency: 'daily' },
        { id: 'biomass', name: 'Monthly biomass sampling (cast net × 30 fish)', frequency: 'monthly' },
        { id: 'density', name: 'Split raceways as density rises (max 30 kg/m³)', frequency: 'monthly' },
      ],
      measurements: [
        { id: 'avg-weight', name: 'Average Weight', unit: 'g', frequency: 'monthly', required: true, benchmark: { target: 150 } },
        { id: 'do', name: 'DO at outlet', unit: 'mg/L', frequency: 'daily', required: true, benchmark: { min: 6 } },
        { id: 'fcr', name: 'Running FCR', unit: 'ratio', frequency: 'monthly', required: false, benchmark: { max: 1.3 } },
      ],
      outputs: [], possibleNextStages: ['market'],
      alerts: ['DO drop at raceway outlet indicates overstocking or poor flow — act immediately'],
    },
    {
      id: 'market', name: 'Market Size (6–9 months)', order: 3, durationDays: 90, color: '#7dd3fc',
      inputs: [
        { id: 'finisher', label: 'Finisher Pellets (42% CP) with astaxanthin', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'final-grade', name: 'Grade to uniform market size (280–400 g)', frequency: 'weekly' },
        { id: 'colour', name: 'Check flesh colour for carotenoid deposition', frequency: 'weekly' },
        { id: 'fast', name: 'Withhold feed 24 h before harvest for gut clearance', frequency: 'once' },
        { id: 'harvest', name: 'Harvest in early morning when water is coldest', frequency: 'once' },
      ],
      measurements: [
        { id: 'weight', name: 'Average Harvest Weight', unit: 'g', frequency: 'weekly', required: true, benchmark: { target: 350 } },
        { id: 'colour', name: 'Flesh Colour Score (1–5)', unit: 'score', frequency: 'weekly', required: false, benchmark: { target: 4 } },
      ],
      outputs: [
        { materialTypeId: 'whole-trout', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Harvest in ice slurry immediately — shelf life depends on rapid chilling to 0–2°C'],
    },
  ],
};

// ─── COMMON CARP ─────────────────────────────────────────────────────────────
export const commonCarpTemplate: ProductionTemplate = {
  id: 'common-carp',
  name: 'Common Carp',
  shortName: 'Common Carp',
  category: 'aquaculture',
  species: 'Cyprinus carpio',
  purpose: 'Table Fish — Semi-Intensive Pond',
  description: 'Hardy, fast-growing table fish ideal for semi-intensive earthen ponds. Tolerates poor water quality; excellent for smallholder systems.',
  icon: '🐠',
  color: '#d1fae5',
  tags: ['carp', 'pond', 'semi-intensive', 'smallholder', 'hardy', 'table fish'],
  materials: [
    { id: 'carp-fingerling', name: 'Carp Fingerlings (5–10 g)', unit: 'count', category: 'input' },
    { id: 'carp-feed', name: 'Carp Pellets (28% CP)', unit: 'kg', category: 'input' },
    { id: 'organic-fert', name: 'Organic Fertiliser (chicken litter)', unit: 'kg', category: 'input' },
    { id: 'carp-whole', name: 'Whole Carp', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Annual Yield per Ha', unit: 'kg', benchmark: 2500 },
    { id: 'avg-weight', name: 'Avg Harvest Weight', unit: 'kg', benchmark: 1.0 },
    { id: 'survival', name: 'Survival Rate', unit: 'percent', benchmark: 80 },
    { id: 'fcr', name: 'FCR', unit: 'ratio', benchmark: 1.8 },
  ],
  stages: [
    {
      id: 'pond-prep', name: 'Pond Preparation', order: 1, durationDays: 14, color: '#d1fae5',
      inputs: [
        { id: 'lime', label: 'Agricultural Lime', unit: 'kg', required: true },
        { id: 'manure', label: 'Chicken Litter / Manure', unit: 'kg', required: false },
      ],
      activities: [
        { id: 'drain-dry', name: 'Drain, dry and lime pond bottom (1 t/ha)', frequency: 'once' },
        { id: 'refill', name: 'Refill and fertilise for plankton bloom', frequency: 'once' },
        { id: 'bloom', name: 'Wait 7 days for green water bloom before stocking', frequency: 'once' },
      ],
      measurements: [
        { id: 'ph', name: 'Water pH', unit: 'pH', frequency: 'daily', required: true, benchmark: { min: 7, max: 8.5 } },
        { id: 'colour', name: 'Water Colour (green = phytoplankton bloom)', unit: 'score', frequency: 'daily', required: false },
      ],
      outputs: [], possibleNextStages: ['grow-out'],
      alerts: ['Stock only after green bloom is established — natural food reduces feed costs by 30%'],
    },
    {
      id: 'grow-out', name: 'Grow-Out (6–9 months)', order: 2, durationDays: 210, color: '#6ee7b7',
      inputs: [
        { id: 'pellets', label: 'Carp Pellets (28% CP)', unit: 'kg', required: true },
        { id: 'fertiliser', label: 'Manure / Fertiliser (fortnightly)', unit: 'kg', required: false },
      ],
      activities: [
        { id: 'feed-2x', name: 'Feed 2× daily at fixed stations', frequency: 'daily' },
        { id: 'fertilise', name: 'Fertilise fortnightly to maintain plankton', frequency: 'weekly' },
        { id: 'water-quality', name: 'Check pH, DO and temperature weekly', frequency: 'weekly' },
        { id: 'sample', name: 'Monthly cast-net sampling to estimate biomass', frequency: 'monthly' },
        { id: 'partial-drain', name: 'Partial drain and exchange 20% water monthly', frequency: 'monthly' },
      ],
      measurements: [
        { id: 'avg-weight', name: 'Average Body Weight', unit: 'kg', frequency: 'monthly', required: true, benchmark: { target: 1.0 } },
        { id: 'do', name: 'Early Morning DO', unit: 'mg/L', frequency: 'weekly', required: true, benchmark: { min: 4 } },
        { id: 'mortality', name: 'Estimated Mortalities', unit: 'count', frequency: 'monthly', required: false },
      ],
      outputs: [
        { materialTypeId: 'carp-whole', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['DO below 3 mg/L causes fish kills — drain 30% of pond water immediately', 'Carp can tolerate poor water but growth rate drops — keep fertilisation up'],
    },
  ],
};

// ─── AQUAPONICS ───────────────────────────────────────────────────────────────
export const aquaponicsTemplate: ProductionTemplate = {
  id: 'aquaponics',
  name: 'Aquaponics System',
  shortName: 'Aquaponics',
  category: 'aquaculture',
  species: 'Tilapia + Vegetables',
  purpose: 'Dual Output: Fish + Vegetables',
  description: 'Recirculating system combining tilapia (or catfish) with hydroponic vegetables. Year-round production in minimal space.',
  icon: '🌿',
  color: '#ecfdf5',
  tags: ['aquaponics', 'recirculating', 'tilapia', 'hydroponics', 'dual output', 'urban farming'],
  materials: [
    { id: 'tilapia-fry', name: 'Tilapia Fingerlings', unit: 'count', category: 'input' },
    { id: 'fish-feed', name: 'Fish Feed (32% CP)', unit: 'kg', category: 'input' },
    { id: 'seedlings', name: 'Vegetable Seedlings', unit: 'count', category: 'input' },
    { id: 'fish-out', name: 'Whole Tilapia', unit: 'kg', category: 'output' },
    { id: 'veg-out', name: 'Leafy Vegetables', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'fish-yield', name: 'Fish Yield per m³', unit: 'kg', benchmark: 40 },
    { id: 'veg-yield', name: 'Vegetable Yield per m²', unit: 'kg', benchmark: 20 },
    { id: 'water-use', name: 'Water Use vs Soil (% of equivalent)', unit: 'percent', benchmark: 10 },
    { id: 'fcr', name: 'System FCR (fish feed → dual output)', unit: 'ratio', benchmark: 1.7 },
  ],
  stages: [
    {
      id: 'system-setup', name: 'System Set-Up & Cycling', order: 1, durationDays: 30, color: '#d1fae5',
      inputs: [
        { id: 'media', label: 'Grow Media (gravel, clay balls)', unit: 'kg', required: true },
        { id: 'ammonia-source', label: 'Pure Ammonia or Fish Waste (cycling)', unit: 'L', required: false },
      ],
      activities: [
        { id: 'install', name: 'Install tanks, beds, pump and plumbing', frequency: 'once' },
        { id: 'cycle', name: 'Cycle system: add ammonia source and test daily', frequency: 'daily' },
        { id: 'nitrate-check', name: 'Wait for nitrite spike then nitrate rise (21–30 days)', frequency: 'daily' },
        { id: 'stock', name: 'Stock fish once ammonia and nitrite are near zero', frequency: 'once' },
      ],
      measurements: [
        { id: 'ammonia', name: 'Total Ammonia-N', unit: 'mg/L', frequency: 'daily', required: true, benchmark: { max: 1 } },
        { id: 'nitrite', name: 'Nitrite (NO₂)', unit: 'mg/L', frequency: 'daily', required: true, benchmark: { max: 0.5 } },
        { id: 'nitrate', name: 'Nitrate (NO₃)', unit: 'mg/L', frequency: 'daily', required: false, benchmark: { min: 20, max: 200 } },
        { id: 'ph', name: 'pH', unit: 'pH', frequency: 'daily', required: true, benchmark: { min: 6.8, max: 7.4 } },
      ],
      outputs: [], possibleNextStages: ['production'],
      alerts: ['Never stock fish until the nitrogen cycle is complete — ammonia will kill fish within 24 hours'],
    },
    {
      id: 'production', name: 'Dual Production (continuous)', order: 2, durationDays: 180, color: '#6ee7b7',
      inputs: [
        { id: 'fish-feed', label: 'Fish Pellets (32% CP)', unit: 'kg', required: true },
        { id: 'seedlings', label: 'Replacement Seedlings (staggered)', unit: 'count', required: true },
        { id: 'minerals', label: 'Iron Chelate + Potassium supplement', unit: 'g', required: false },
      ],
      activities: [
        { id: 'feed-2x', name: 'Feed fish 2–3× daily (1–2% body weight)', frequency: 'daily' },
        { id: 'water-test', name: 'Test pH, ammonia, nitrite and DO daily', frequency: 'daily' },
        { id: 'harvest-veg', name: 'Harvest vegetables on rolling 21–28 day cycle', frequency: 'weekly' },
        { id: 'transplant', name: 'Transplant new seedlings after each harvest', frequency: 'weekly' },
        { id: 'fish-partial', name: 'Harvest fish partially when 300+ g', frequency: 'monthly' },
        { id: 'sump-clean', name: 'Clean sump and solids filter weekly', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'fish-weight', name: 'Avg Fish Weight', unit: 'g', frequency: 'monthly', required: true, benchmark: { target: 400 } },
        { id: 'do', name: 'Dissolved Oxygen', unit: 'mg/L', frequency: 'daily', required: true, benchmark: { min: 5 } },
        { id: 'ph', name: 'pH', unit: 'pH', frequency: 'daily', required: true, benchmark: { min: 6.8, max: 7.4 } },
        { id: 'veg-yield', name: 'Vegetable Yield', unit: 'kg', frequency: 'weekly', required: true },
      ],
      outputs: [
        { materialTypeId: 'fish-out', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
        { materialTypeId: 'veg-out', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['production'],
      alerts: ['pH below 6.5 crashes the biofilter — add potassium bicarbonate to raise', 'Iron deficiency shows as yellowing leaves — dose chelated iron weekly'],
    },
  ],
};
