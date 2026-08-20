// ─────────────────────────────────────────────────────────────────────────────
// Additional Horticulture, Orchard & Greenhouse Templates
// Cabbage, Pepper, Cucumber, Carrot, Green Beans, Mango, Avocado, Citrus,
// Banana, Apple Orchard, Onion
// ─────────────────────────────────────────────────────────────────────────────
import type { ProductionTemplate } from '../types';

// ─── CABBAGE ──────────────────────────────────────────────────────────────────
export const cabbageTemplate: ProductionTemplate = {
  id: 'cabbage',
  name: 'Cabbage (Green / Red / Savoy)',
  shortName: 'Cabbage',
  category: 'horticulture',
  species: 'Cabbage',
  purpose: 'Vegetable Production',
  description: 'Commercial cabbage for fresh market. 90–120 days from transplant.',
  icon: '🥬',
  color: '#22c55e',
  tags: ['cabbage', 'brassica', 'vegetable', 'fresh market'],
  materials: [
    { id: 'cabbage-seed', name: 'Cabbage Seed (hybrid)', unit: 'g', category: 'input' },
    { id: 'cabbage-seedling', name: 'Cabbage Seedlings', unit: 'count', category: 'input' },
    { id: 'cabbage-fert', name: 'Compound D + CAN', unit: 'kg', category: 'input' },
    { id: 'cabbage-head', name: 'Cabbage Heads', unit: 'tonne', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Head Yield', unit: 'tonne', benchmark: 40 },
    { id: 'avg-head-wt', name: 'Avg Head Weight', unit: 'kg', benchmark: 2.5 },
    { id: 'marketable-pct', name: 'Marketable %', unit: 'percent', benchmark: 85 },
  ],
  stages: [
    {
      id: 'nursery',
      name: 'Nursery (0–28 days)',
      order: 1,
      durationDays: 28,
      color: '#bbf7d0',
      inputs: [
        { id: 'seed', label: 'Hybrid Cabbage Seed', unit: 'g', required: true },
      ],
      activities: [
        { id: 'tray', name: 'Sow in seedling trays with commercial mix', frequency: 'once' },
        { id: 'water-nursery', name: 'Water seedlings twice daily', frequency: 'twice_daily' },
        { id: 'harden', name: 'Harden off seedlings 5 days before transplanting', frequency: 'daily' },
      ],
      measurements: [
        { id: 'germ', name: 'Germination %', unit: 'percent', frequency: 'once', required: false, benchmark: 90 },
        { id: 'seedling-height', name: 'Seedling Height', unit: 'celsius', frequency: 'weekly', required: false, benchmark: 12 },
      ],
      outputs: [],
      possibleNextStages: ['transplanting'],
      alerts: ['Transplant at 4–5 cm height with 4–6 true leaves', 'Avoid damping off — good drainage and airflow in nursery'],
    },
    {
      id: 'transplanting',
      name: 'Transplanting & Establishment (28–42 days)',
      order: 2,
      durationDays: 14,
      color: '#4ade80',
      inputs: [
        { id: 'seedlings', label: 'Cabbage Seedlings', unit: 'count', required: true },
        { id: 'fert-basal', label: 'Compound D (Basal in planting hole)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'transplant', name: 'Transplant at 60×60 cm (irrigated) or 45×45 cm', frequency: 'once' },
        { id: 'water-in', name: 'Water immediately after transplanting', frequency: 'once' },
        { id: 'check-take', name: 'Check take-hold at 7 days, replace dead seedlings', frequency: 'once' },
      ],
      measurements: [
        { id: 'take', name: 'Establishment %', unit: 'percent', frequency: 'once', required: false, benchmark: 95 },
        { id: 'area', name: 'Area Transplanted', unit: 'ha', frequency: 'once', required: true, benchmark: null },
      ],
      outputs: [],
      possibleNextStages: ['vegetative'],
      alerts: [],
    },
    {
      id: 'vegetative',
      name: 'Vegetative Growth (42–80 days)',
      order: 3,
      durationDays: 38,
      color: '#22c55e',
      inputs: [
        { id: 'can1', label: 'CAN / Urea (1st top-dressing)', unit: 'kg', required: true },
        { id: 'pesticide', label: 'Caterpillar / Diamondback Moth Insecticide', unit: 'litre', required: false },
      ],
      activities: [
        { id: 'top-1', name: '1st CAN top-dressing at 21 DAT', frequency: 'once' },
        { id: 'top-2', name: '2nd CAN top-dressing at 42 DAT', frequency: 'once' },
        { id: 'irrigation', name: 'Irrigate every 5–7 days (2–3 cm per application)', frequency: 'weekly' },
        { id: 'dbm-spray', name: 'Spray for Diamondback Moth at first sign', frequency: 'weekly' },
        { id: 'weed', name: 'Weed at 14 and 35 DAT', frequency: 'once' },
      ],
      measurements: [
        { id: 'leaf-count', name: 'True Leaf Count', unit: 'count', frequency: 'weekly', required: false, benchmark: 15 },
        { id: 'dbm-level', name: 'DBM Larva Count (per plant)', unit: 'count', frequency: 'weekly', required: false, benchmark: 1 },
      ],
      outputs: [],
      possibleNextStages: ['heading'],
      alerts: ['Diamondback Moth is the most destructive pest — use Bt/spinosad for resistance management', 'Boron deficiency causes hollow stem — add borax if needed'],
    },
    {
      id: 'heading',
      name: 'Heading & Harvest (80–120 days)',
      order: 4,
      durationDays: 40,
      color: '#f59e0b',
      inputs: [],
      activities: [
        { id: 'reduce-water', name: 'Reduce irrigation when heads approaching full size', frequency: 'weekly' },
        { id: 'harvest', name: 'Harvest when heads firm and compact', frequency: 'daily' },
        { id: 'grade-pack', name: 'Grade and pack: A (>1.5kg), B (0.8–1.5kg)', frequency: 'daily' },
      ],
      measurements: [
        { id: 'yield', name: 'Head Yield', unit: 'tonne', frequency: 'once', required: true, benchmark: null },
        { id: 'avg-head', name: 'Avg Head Weight', unit: 'kg', frequency: 'once', required: false, benchmark: 2.5 },
        { id: 'marketable', name: 'Marketable Grade %', unit: 'percent', frequency: 'once', required: false, benchmark: 85 },
      ],
      outputs: [
        { materialTypeId: 'cabbage-head', quantity: null, unit: 'tonne', routing: 'sale', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Heads split if left too long after maturity — harvest promptly', 'Over-irrigation at heading causes splitting and internal browning'],
    },
  ],
};

// ─── PEPPER ───────────────────────────────────────────────────────────────────
export const pepperTemplate: ProductionTemplate = {
  id: 'pepper',
  name: 'Bell Pepper / Chilli Pepper',
  shortName: 'Pepper',
  category: 'horticulture',
  species: 'Pepper',
  purpose: 'Vegetable / Spice Production',
  description: 'Pepper for fresh market or drying. Continuous harvesting over 4–6 months.',
  icon: '🫑',
  color: '#16a34a',
  tags: ['pepper', 'capsicum', 'chilli', 'vegetable', 'spice'],
  materials: [
    { id: 'pepper-seed', name: 'Pepper Seed', unit: 'g', category: 'input' },
    { id: 'pepper-fert', name: 'Compound D + Foliar Feed', unit: 'kg', category: 'input' },
    { id: 'mulch', name: 'Mulch (plastic / organic)', unit: 'kg', category: 'input' },
    { id: 'pepper-fresh', name: 'Fresh Pepper', unit: 'tonne', category: 'output' },
    { id: 'pepper-dry', name: 'Dried Chilli', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Fresh Yield', unit: 'tonne', benchmark: 20 },
    { id: 'marketable', name: 'Marketable %', unit: 'percent', benchmark: 85 },
    { id: 'picks', name: 'Harvest Picks', unit: 'count', benchmark: 8 },
  ],
  stages: [
    {
      id: 'nursery',
      name: 'Nursery (0–35 days)',
      order: 1,
      durationDays: 35,
      color: '#bbf7d0',
      inputs: [
        { id: 'seed', label: 'Pepper Seed', unit: 'g', required: true },
      ],
      activities: [
        { id: 'sow', name: 'Sow seed in trays, 1–2 cm deep', frequency: 'once' },
        { id: 'water', name: 'Water twice daily', frequency: 'twice_daily' },
        { id: 'fungicide-dm', name: 'Preventive fungicide spray for damping off', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'germ', name: 'Germination %', unit: 'percent', frequency: 'once', required: false, benchmark: 85 },
        { id: 'seedling-wk', name: 'Seedling Uniformity', unit: 'percent', frequency: 'weekly', required: false, benchmark: 90 },
      ],
      outputs: [],
      possibleNextStages: ['transplant'],
      alerts: ['Pepper seed germinates slowly (10–14 days) — do not over-water before germination', 'Ready to transplant at 5–6 true leaves (35 days)'],
    },
    {
      id: 'transplant',
      name: 'Transplanting',
      order: 2,
      durationDays: 7,
      color: '#4ade80',
      inputs: [
        { id: 'seedlings', label: 'Pepper Seedlings', unit: 'count', required: true },
        { id: 'fert-basal', label: 'Compound D / 2:3:2 Basal', unit: 'kg', required: true },
        { id: 'mulch-mat', label: 'Plastic / Organic Mulch', unit: 'kg', required: false },
      ],
      activities: [
        { id: 'mulch', name: 'Lay mulch before transplanting', frequency: 'once' },
        { id: 'plant', name: 'Transplant at 60×45 cm, water immediately', frequency: 'once' },
        { id: 'stake', name: 'Install stakes / trellis for tall varieties', frequency: 'once' },
      ],
      measurements: [
        { id: 'area', name: 'Area Planted', unit: 'ha', frequency: 'once', required: true, benchmark: null },
      ],
      outputs: [],
      possibleNextStages: ['vegetative'],
      alerts: [],
    },
    {
      id: 'vegetative',
      name: 'Vegetative & Flowering (7–90 DAT)',
      order: 3,
      durationDays: 83,
      color: '#22c55e',
      inputs: [
        { id: 'fertigation', label: 'Fertigation / Foliar Feed (weekly)', unit: 'kg', required: true },
        { id: 'mites-spray', name: 'Spider Mite Miticide', unit: 'litre', required: false } as any,
      ],
      activities: [
        { id: 'top-dress', name: 'Top-dress CAN every 2 weeks', frequency: 'bi_weekly' },
        { id: 'irrigate', name: 'Irrigate every 3–5 days (3 cm)', frequency: 'weekly' },
        { id: 'scout-viral', name: 'Scout for Pepper Mild Mottle Virus (PMMoV)', frequency: 'weekly' },
        { id: 'mites', name: 'Scout for spider mites on leaf undersides', frequency: 'weekly' },
        { id: 'tie-stake', name: 'Tie plants to stakes as they grow', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'plant-height', name: 'Plant Height', unit: 'celsius', frequency: 'weekly', required: false, benchmark: 60 },
        { id: 'flowers', name: 'Flowers per Plant', unit: 'count', frequency: 'weekly', required: false, benchmark: 15 },
        { id: 'viral-incidence', name: 'Virus Incidence', unit: 'percent', frequency: 'weekly', required: false, benchmark: 5 },
      ],
      outputs: [],
      possibleNextStages: ['harvest'],
      alerts: ['PMMoV transmitted by seed + thrips — use clean seed, insect nets', 'Blossom drop: cool night temperatures or drought stress'],
    },
    {
      id: 'harvest',
      name: 'Harvest (90–240 DAT)',
      order: 4,
      durationDays: 150,
      color: '#f59e0b',
      inputs: [
        { id: 'cont-fert', label: 'Continued Fertigation', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'pick-green', name: 'Harvest green/unripe (fresh market)', frequency: 'weekly' },
        { id: 'pick-red', name: 'Or harvest red/ripe (processing/drying)', frequency: 'weekly' },
        { id: 'grade', name: 'Grade by size and quality', frequency: 'daily' },
        { id: 'nutrient-boost', name: 'Foliar micronutrient spray every 2 weeks', frequency: 'bi_weekly' },
      ],
      measurements: [
        { id: 'yield-per-pick', name: 'Yield per Harvest', unit: 'kg', frequency: 'weekly', required: true, benchmark: null },
        { id: 'cumulative', name: 'Cumulative Yield', unit: 'tonne', frequency: 'monthly', required: true, benchmark: null },
        { id: 'marketable', name: 'Marketable %', unit: 'percent', frequency: 'weekly', required: false, benchmark: 85 },
      ],
      outputs: [
        { materialTypeId: 'pepper-fresh', quantity: null, unit: 'tonne', routing: 'sale', qualityGrade: 'A' },
        { materialTypeId: 'pepper-dry', quantity: null, unit: 'kg', routing: 'processing', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Harvest bell peppers at green OR coloured stage — both have markets', 'Continuous picking stimulates more fruit set'],
    },
  ],
};

// ─── CUCUMBER ─────────────────────────────────────────────────────────────────
export const cucumberTemplate: ProductionTemplate = {
  id: 'cucumber',
  name: 'Cucumber (Outdoor / Greenhouse)',
  shortName: 'Cucumber',
  category: 'horticulture',
  species: 'Cucumber',
  purpose: 'Vegetable Production',
  description: 'Cucumber for fresh market. Continuous harvest from 45–120 DAT.',
  icon: '🥒',
  color: '#16a34a',
  tags: ['cucumber', 'vegetable', 'fresh market', 'greenhouse'],
  materials: [
    { id: 'cuc-seed', name: 'Cucumber Seed (hybrid/grafted)', unit: 'count', category: 'input' },
    { id: 'cuc-fert', name: 'NPK Fertiliser / Fertigation', unit: 'kg', category: 'input' },
    { id: 'cuc-trellis', name: 'Trellis Wire / Net', unit: 'm', category: 'input' },
    { id: 'cucumbers', name: 'Fresh Cucumbers', unit: 'tonne', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Total Yield', unit: 'tonne', benchmark: 50 },
    { id: 'fruit-day', name: 'Fruit Quality (grade A%)', unit: 'percent', benchmark: 80 },
  ],
  stages: [
    {
      id: 'seeding',
      name: 'Seeding / Direct Sowing',
      order: 1,
      durationDays: 10,
      color: '#bbf7d0',
      inputs: [
        { id: 'seed', label: 'Cucumber Seed / Grafted Seedling', unit: 'count', required: true },
        { id: 'fert', label: 'Compound D (basal)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'trellis', name: 'Install trellis / wire system at 1.5 m height', frequency: 'once' },
        { id: 'sow', name: 'Sow 2 seeds per station at 60×30 cm, thin to 1', frequency: 'once' },
      ],
      measurements: [
        { id: 'area', name: 'Area Planted', unit: 'ha', frequency: 'once', required: true, benchmark: null },
        { id: 'germ', name: 'Germination % (7 days)', unit: 'percent', frequency: 'once', required: false, benchmark: 90 },
      ],
      outputs: [],
      possibleNextStages: ['vegetative'],
      alerts: [],
    },
    {
      id: 'vegetative',
      name: 'Vegetative & Training (10–35 DAP)',
      order: 2,
      durationDays: 25,
      color: '#22c55e',
      inputs: [
        { id: 'can', label: 'CAN / Urea (1st top-dressing at 21 DAP)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'train', name: 'Train vines up trellis / string daily', frequency: 'daily' },
        { id: 'prune-lat', name: 'Remove lateral shoots below 5th node', frequency: 'daily' },
        { id: 'irrigate', name: 'Drip irrigate every 2 days', frequency: 'daily' },
        { id: 'scout-mites', name: 'Scout for spider mites and powdery mildew', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'vine-length', name: 'Vine Length', unit: 'celsius', frequency: 'weekly', required: false, benchmark: 80 },
      ],
      outputs: [],
      possibleNextStages: ['harvest'],
      alerts: ['Cucumbers are heavy water users — never drought-stress at flowering/fruiting'],
    },
    {
      id: 'harvest',
      name: 'Harvest (35–120 DAP)',
      order: 3,
      durationDays: 85,
      color: '#f59e0b',
      inputs: [
        { id: 'fertigation', label: 'Continued Fertigation', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'pick', name: 'Harvest every 2–3 days (cucumbers grow fast!)', frequency: 'daily' },
        { id: 'grade', name: 'Grade: straight, uniform colour, no yellowing', frequency: 'daily' },
        { id: 'powdery', name: 'Scout and spray for powdery mildew', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'kg-pick', name: 'Yield per Harvest', unit: 'kg', frequency: 'daily', required: true, benchmark: null },
        { id: 'grade-a', name: 'Grade A %', unit: 'percent', frequency: 'weekly', required: false, benchmark: 80 },
      ],
      outputs: [
        { materialTypeId: 'cucumbers', quantity: null, unit: 'tonne', routing: 'sale', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Harvest every 2–3 days — over-mature cucumbers turn yellow and stop fruit set', 'End of crop when powdery mildew takes over or yield drops below threshold'],
    },
  ],
};

// ─── MANGO ────────────────────────────────────────────────────────────────────
export const mangoTemplate: ProductionTemplate = {
  id: 'mango',
  name: 'Mango Orchard',
  shortName: 'Mango',
  category: 'orchard',
  species: 'Mango',
  purpose: 'Fruit Production',
  description: 'Mango orchard management — from young tree through to full bearing (Year 5+).',
  icon: '🥭',
  color: '#f59e0b',
  tags: ['mango', 'orchard', 'tropical fruit', 'export'],
  materials: [
    { id: 'mango-tree', name: 'Mango Grafted Tree', unit: 'count', category: 'input' },
    { id: 'mango-fert', name: 'Compound Fertiliser', unit: 'kg', category: 'input' },
    { id: 'mango-fruit', name: 'Mango Fruit', unit: 'tonne', category: 'output' },
  ],
  kpis: [
    { id: 'yield-tree', name: 'Yield / Tree', unit: 'kg', benchmark: 200 },
    { id: 'grade-a-pct', name: 'Export Grade %', unit: 'percent', benchmark: 60 },
    { id: 'on-crop', name: 'On-Crop Year Yield', unit: 'tonne', benchmark: 15 },
  ],
  stages: [
    {
      id: 'planting-estab',
      name: 'Planting & Establishment (Year 1–3)',
      order: 1,
      durationDays: 1095,
      color: '#fbbf24',
      inputs: [
        { id: 'trees', label: 'Grafted Mango Trees', unit: 'count', required: true },
        { id: 'compost', label: 'Compost / Manure (per planting hole)', unit: 'kg', required: true },
        { id: 'fert-yr1', label: 'Annual Fertiliser', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'hole', name: 'Dig 60×60×60 cm planting holes (8×8m spacing)', frequency: 'once' },
        { id: 'plant', name: 'Plant trees at start of rains', frequency: 'once' },
        { id: 'water-yr1', name: 'Water twice weekly in dry season (Year 1–2)', frequency: 'weekly' },
        { id: 'prune-form', name: 'Formative pruning — 3 scaffold branches', frequency: 'once' },
        { id: 'fert-yr', name: 'Annual fertiliser application (split 2 times/year)', frequency: 'monthly' },
        { id: 'flower-remove', name: 'Remove all flowers in years 1–2 (allow tree establishment)', frequency: 'once' },
      ],
      measurements: [
        { id: 'survival', name: 'Tree Survival %', unit: 'percent', frequency: 'monthly', required: true, benchmark: 95 },
        { id: 'canopy-spread', name: 'Canopy Spread', unit: 'celsius', frequency: 'monthly', required: false, benchmark: 2 },
      ],
      outputs: [],
      possibleNextStages: ['young-bearing'],
      alerts: ['Remove flowers for first 2 seasons to build tree structure', 'Stem borer: paint trunk white or use sticky bands'],
    },
    {
      id: 'young-bearing',
      name: 'Young Bearing (Year 3–5)',
      order: 2,
      durationDays: 730,
      color: '#22c55e',
      inputs: [
        { id: 'fert-yr3', label: 'Fertiliser (3× annual rate of mature tree)', unit: 'kg', required: true },
        { id: 'pruning-tools', label: 'Pruning Implements', unit: 'count', required: false },
      ],
      activities: [
        { id: 'prune-annual', name: 'Annual post-harvest pruning', frequency: 'once' },
        { id: 'thinning', name: 'Thin fruit clusters to 2 fruits per panicle', frequency: 'once' },
        { id: 'anthracnose', name: 'Spray copper fungicide at flowering/fruit set', frequency: 'monthly' },
        { id: 'irrigate-dry', name: 'Withhold water 6–8 weeks pre-flowering (induces uniform flush)', frequency: 'monthly' },
      ],
      measurements: [
        { id: 'yield-yr', name: 'Annual Fruit Yield', unit: 'tonne', frequency: 'once', required: true, benchmark: 5 },
        { id: 'anthracnose', name: 'Anthracnose Incidence', unit: 'percent', frequency: 'weekly', required: false, benchmark: 10 },
      ],
      outputs: [
        { materialTypeId: 'mango-fruit', quantity: null, unit: 'tonne', routing: 'sale', qualityGrade: 'A' },
      ],
      possibleNextStages: ['full-bearing'],
      alerts: ['Water stress 6–8 weeks before expected flowering promotes uniform bud break', 'Mango hoppers: spray at bud break and early panicle stage'],
    },
    {
      id: 'full-bearing',
      name: 'Full Bearing (Year 5+, annual cycle)',
      order: 3,
      durationDays: 365,
      color: '#f59e0b',
      inputs: [
        { id: 'fert-mature', label: 'Mature Tree Fertiliser (post-harvest)', unit: 'kg', required: true },
        { id: 'fungicide-anth', label: 'Anthracnose Fungicide', unit: 'litre', required: true },
      ],
      activities: [
        { id: 'post-harvest-prune', name: 'Post-harvest pruning — remove 1/3 of canopy', frequency: 'once' },
        { id: 'rest-dry', name: 'Impose dry period (stress treatment) 6–8 weeks', frequency: 'once' },
        { id: 'flower-spray', name: 'KNO₃ spray to synchronise flowering', frequency: 'once' },
        { id: 'fruit-set-spray', name: 'Spray copper at 50% open flowers', frequency: 'once' },
        { id: 'harvest-grading', name: 'Harvest by colour/firmness + grade', frequency: 'daily' },
      ],
      measurements: [
        { id: 'yield', name: 'Annual Yield', unit: 'tonne', frequency: 'once', required: true, benchmark: 15 },
        { id: 'grade-a', name: 'Export Grade A %', unit: 'percent', frequency: 'once', required: false, benchmark: 60 },
        { id: 'yield-tree', name: 'Yield per Tree', unit: 'kg', frequency: 'once', required: false, benchmark: 200 },
      ],
      outputs: [
        { materialTypeId: 'mango-fruit', quantity: null, unit: 'tonne', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['full-bearing'],
      alerts: ['Mango alternates — heavy on-year followed by light off-year', 'Post-harvest fungicide dip or hot water treatment for export markets'],
    },
  ],
};

// ─── CITRUS ───────────────────────────────────────────────────────────────────
export const citrusTemplate: ProductionTemplate = {
  id: 'citrus',
  name: 'Citrus Orchard (Orange / Lemon / Mandarin)',
  shortName: 'Citrus',
  category: 'orchard',
  species: 'Citrus',
  purpose: 'Fruit Production',
  description: 'Commercial citrus orchard — bearing from Year 3, full production Year 6+.',
  icon: '🍊',
  color: '#f97316',
  tags: ['citrus', 'orange', 'lemon', 'mandarin', 'orchard'],
  materials: [
    { id: 'citrus-tree', name: 'Citrus Budded Tree', unit: 'count', category: 'input' },
    { id: 'citrus-fert', name: 'Citrus Fertiliser (NPK + Mg)', unit: 'kg', category: 'input' },
    { id: 'citrus-fruit', name: 'Citrus Fruit', unit: 'tonne', category: 'output' },
    { id: 'citrus-juice', name: 'Citrus Juice (processing)', unit: 'litre', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Yield / ha', unit: 'tonne', benchmark: 40 },
    { id: 'brix', name: 'Brix', unit: 'ratio', benchmark: 10 },
    { id: 'grade-a-pct', name: 'Grade A %', unit: 'percent', benchmark: 70 },
  ],
  stages: [
    {
      id: 'establishment',
      name: 'Orchard Establishment (Year 1–3)',
      order: 1,
      durationDays: 1095,
      color: '#fde68a',
      inputs: [
        { id: 'trees', label: 'Certified Budded Trees', unit: 'count', required: true },
        { id: 'mulch', label: 'Organic Mulch (basin)', unit: 'kg', required: false },
        { id: 'fert', label: 'NPK Fertiliser (reduced young tree rate)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'plant', name: 'Plant at 6×4 m (high density) or 7×5 m (standard)', frequency: 'once' },
        { id: 'formative-prune', name: 'Formative pruning — create 3 scaffold branches', frequency: 'once' },
        { id: 'irrigate-estab', name: 'Drip irrigate 3× weekly until established', frequency: 'daily' },
        { id: 'fert-split', name: 'Apply fertiliser in 3–4 splits per year', frequency: 'monthly' },
        { id: 'staking', name: 'Stake trees against wind for first 2 years', frequency: 'once' },
      ],
      measurements: [
        { id: 'survival', name: 'Survival Rate', unit: 'percent', frequency: 'monthly', required: true, benchmark: 98 },
        { id: 'trunk-diam', name: 'Trunk Diameter', unit: 'celsius', frequency: 'monthly', required: false, benchmark: 5 },
      ],
      outputs: [],
      possibleNextStages: ['bearing'],
      alerts: ['Citrus greening (HLB): inspect for yellow shoots, misshapen fruit — incurable once infected', 'Use certified disease-free planting material only'],
    },
    {
      id: 'bearing',
      name: 'Annual Production Cycle (Year 3+)',
      order: 2,
      durationDays: 365,
      color: '#f97316',
      inputs: [
        { id: 'fert-annual', label: 'Annual Fertiliser (NPK + Mg + micro)', unit: 'kg', required: true },
        { id: 'lime-s', name: 'Lime Sulphur / Pest Control', unit: 'litre', required: false } as any,
      ],
      activities: [
        { id: 'fert-jan-mar', name: 'Pre-flowering fertiliser (Jan–Feb)', frequency: 'monthly' },
        { id: 'fert-post', name: 'Post-harvest fertiliser (June–July)', frequency: 'once' },
        { id: 'pruning', name: 'Skirt and maintenance pruning', frequency: 'once' },
        { id: 'psyllid-scout', name: 'Scout for Asian Citrus Psyllid (HLB vector)', frequency: 'weekly' },
        { id: 'harvest', name: 'Harvest at colour break + Brix check', frequency: 'daily' },
        { id: 'grade', name: 'Grade by size, colour, and blemish', frequency: 'daily' },
      ],
      measurements: [
        { id: 'yield', name: 'Annual Yield', unit: 'tonne', frequency: 'once', required: true, benchmark: null },
        { id: 'brix', name: 'Brix (sugar)', unit: 'ratio', frequency: 'weekly', required: false, benchmark: 10 },
        { id: 'grade-a', name: 'Grade A %', unit: 'percent', frequency: 'once', required: false, benchmark: 70 },
        { id: 'alternaria', name: 'Post-harvest Alternaria Incidence', unit: 'percent', frequency: 'once', required: false, benchmark: 5 },
      ],
      outputs: [
        { materialTypeId: 'citrus-fruit', quantity: null, unit: 'tonne', routing: 'inventory', qualityGrade: 'A' },
        { materialTypeId: 'citrus-juice', quantity: null, unit: 'litre', routing: 'processing', qualityGrade: 'A' },
      ],
      possibleNextStages: ['bearing'],
      alerts: ['Alternate bearing in some varieties — manage with crop load thinning', 'Cold storage at 7°C extends shelf life to 6–8 weeks for export'],
    },
  ],
};

// ─── BANANA ───────────────────────────────────────────────────────────────────
export const bananaTemplate: ProductionTemplate = {
  id: 'banana',
  name: 'Banana (Cavendish / FHIA / Local)',
  shortName: 'Banana',
  category: 'orchard',
  species: 'Banana',
  purpose: 'Fruit Production',
  description: 'Banana for fresh market or processing. 9–12 month first crop, ratoon every 9 months.',
  icon: '🍌',
  color: '#fbbf24',
  tags: ['banana', 'plantain', 'tropical fruit', 'continuous'],
  materials: [
    { id: 'banana-sucker', name: 'Banana Suckers / TC Plants', unit: 'count', category: 'input' },
    { id: 'banana-fert', name: 'NPK + Potassium (high K)', unit: 'kg', category: 'input' },
    { id: 'banana-bunch', name: 'Banana Bunch', unit: 'tonne', category: 'output' },
  ],
  kpis: [
    { id: 'bunch-wt', name: 'Avg Bunch Weight', unit: 'kg', benchmark: 25 },
    { id: 'yield-ha', name: 'Yield / ha / Year', unit: 'tonne', benchmark: 35 },
    { id: 'ratoon-cycles', name: 'Ratoon Cycles', unit: 'count', benchmark: 5 },
  ],
  stages: [
    {
      id: 'planting',
      name: 'Planting',
      order: 1,
      durationDays: 14,
      color: '#fde68a',
      inputs: [
        { id: 'suckers', label: 'Suckers or TC Plants', unit: 'count', required: true },
        { id: 'compost', label: 'Compost / Manure', unit: 'kg', required: true },
        { id: 'fert', label: 'Triple Superphosphate (basal)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'hole', name: 'Dig 60×60×60 cm hole, fill with topsoil + compost', frequency: 'once' },
        { id: 'plant', name: 'Plant at 3×3 m (1,100 plants/ha) or 2×2 m high density', frequency: 'once' },
        { id: 'water', name: 'Water immediately and weekly until established', frequency: 'weekly' },
        { id: 'mulch', name: 'Apply 10 cm mulch around base (30 cm from plant)', frequency: 'once' },
      ],
      measurements: [
        { id: 'area', name: 'Area Planted', unit: 'ha', frequency: 'once', required: true, benchmark: null },
        { id: 'plants', name: 'Plants Established', unit: 'count', frequency: 'once', required: true, benchmark: null },
      ],
      outputs: [],
      possibleNextStages: ['vegetative'],
      alerts: ['Banana Xanthomonas Wilt: plant-to-plant spread — use clean tools', 'Panama disease: use Cavendish or FHIA resistant varieties'],
    },
    {
      id: 'vegetative',
      name: 'Vegetative Growth (1–6 months)',
      order: 2,
      durationDays: 180,
      color: '#22c55e',
      inputs: [
        { id: 'fert-monthly', label: 'Monthly NPK + KCl Application', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'deleaf', name: 'Remove dead/diseased leaves monthly', frequency: 'monthly' },
        { id: 'sucker-selection', name: 'Select 1 ratoon sucker per mat at 4 months', frequency: 'once' },
        { id: 'sigatoka', name: 'Scout for Black Sigatoka (leaf streak)', frequency: 'weekly' },
        { id: 'irrigate', name: 'Drip or flood irrigate weekly', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'leaf-count', name: 'Number of Leaves per Plant', unit: 'count', frequency: 'monthly', required: false, benchmark: 10 },
        { id: 'sigatoka', name: 'Sigatoka Severity Score (0–6)', unit: 'ratio', frequency: 'weekly', required: false, benchmark: 2 },
      ],
      outputs: [],
      possibleNextStages: ['bunching'],
      alerts: ['At least 9 functional leaves needed at shooting for good bunch size', 'Black Sigatoka spray programme critical in high-humidity areas'],
    },
    {
      id: 'bunching',
      name: 'Shooting, Bunching & Harvest (6–12 months)',
      order: 3,
      durationDays: 180,
      color: '#f59e0b',
      inputs: [
        { id: 'bunch-bags', label: 'Blue Polythene Bunch Covers', unit: 'count', required: false },
        { id: 'fert-bunch', label: 'High-K Fertigation at Shooting', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'decap', name: 'Decap (remove male bud) 8 hands from bottom', frequency: 'once' },
        { id: 'bunch-cover', name: 'Cover bunch with polythene bag at shooting', frequency: 'once' },
        { id: 'prop', name: 'Prop plants to prevent lodging under bunch weight', frequency: 'once' },
        { id: 'harvest', name: 'Harvest at 75–80% full (75–90 days after shooting)', frequency: 'once' },
      ],
      measurements: [
        { id: 'days-shoot', name: 'Days from Shoot to Harvest', unit: 'day', frequency: 'once', required: false, benchmark: 85 },
        { id: 'bunch-wt', name: 'Avg Bunch Weight', unit: 'kg', frequency: 'once', required: true, benchmark: 25 },
        { id: 'hands', name: 'Hands per Bunch', unit: 'count', frequency: 'once', required: false, benchmark: 9 },
        { id: 'fingers', name: 'Fingers per Hand', unit: 'count', frequency: 'once', required: false, benchmark: 16 },
      ],
      outputs: [
        { materialTypeId: 'banana-bunch', quantity: null, unit: 'tonne', routing: 'sale', qualityGrade: 'A' },
      ],
      possibleNextStages: ['vegetative'],
      alerts: ['Harvest green but full — avoid over-ripening on plant', 'Ratoon next crop already growing — redirect fertiliser to ratoon'],
    },
  ],
};

// ─── AVOCADO ──────────────────────────────────────────────────────────────────
export const avocadoTemplate: ProductionTemplate = {
  id: 'avocado',
  name: 'Avocado Orchard (Hass / Fuerte / Reed)',
  shortName: 'Avocado',
  category: 'orchard',
  species: 'Avocado',
  purpose: 'Fruit Production',
  description: 'Avocado orchard for export and domestic markets. Bearing from Year 3–4.',
  icon: '🥑',
  color: '#16a34a',
  tags: ['avocado', 'hass', 'export', 'orchard', 'subtropical'],
  materials: [
    { id: 'avo-tree', name: 'Avocado Grafted Tree', unit: 'count', category: 'input' },
    { id: 'avo-fert', name: 'Avocado Fertiliser (NPK + Ca + Zn)', unit: 'kg', category: 'input' },
    { id: 'avo-fruit', name: 'Avocado Fruit', unit: 'tonne', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Yield / ha', unit: 'tonne', benchmark: 15 },
    { id: 'packing-pct', name: 'Packout %', unit: 'percent', benchmark: 75 },
    { id: 'dry-matter', name: 'Dry Matter %', unit: 'percent', benchmark: 23 },
  ],
  stages: [
    {
      id: 'establishment',
      name: 'Establishment (Year 1–3)',
      order: 1,
      durationDays: 1095,
      color: '#bbf7d0',
      inputs: [
        { id: 'trees', label: 'Grafted Avocado Trees (A & B type mix)', unit: 'count', required: true },
        { id: 'mulch', label: 'Thick Organic Mulch', unit: 'kg', required: true },
        { id: 'fert', label: 'Young Tree Fertiliser (low N, high P)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'wind-shelter', name: 'Establish windbreak before planting', frequency: 'once' },
        { id: 'plant', name: 'Plant at 7×7m (standard) or 4×4m (high density)', frequency: 'once' },
        { id: 'protect', name: 'Paint trunks white (sunscald prevention)', frequency: 'once' },
        { id: 'irrigate', name: 'Irrigate 2× weekly until established', frequency: 'weekly' },
        { id: 'mulch-apply', name: 'Maintain 10 cm organic mulch (60 cm from trunk)', frequency: 'monthly' },
      ],
      measurements: [
        { id: 'survival', name: 'Survival %', unit: 'percent', frequency: 'monthly', required: true, benchmark: 95 },
        { id: 'growth', name: 'Annual Height Growth', unit: 'celsius', frequency: 'monthly', required: false, benchmark: 60 },
      ],
      outputs: [],
      possibleNextStages: ['production'],
      alerts: ['Avocado roots are shallow — NEVER cultivate near trunk', 'Phytophthora root rot: avoid waterlogging; plant on ridges in wet areas'],
    },
    {
      id: 'production',
      name: 'Annual Production Cycle (Year 4+)',
      order: 2,
      durationDays: 365,
      color: '#16a34a',
      inputs: [
        { id: 'fert-annual', label: 'Annual Fertiliser (3 splits: pre-flower, post-set, post-harvest)', unit: 'kg', required: true },
        { id: 'phytoph', label: 'Phosphonate / Metalaxyl (Phytophthora control)', unit: 'litre', required: false },
      ],
      activities: [
        { id: 'prune', name: 'Annual light pruning for light penetration', frequency: 'once' },
        { id: 'flower-thin', name: 'Do not thin — avocado sheds most flowers naturally', frequency: 'once' },
        { id: 'irrigate-crit', name: 'Critical irrigation: flowering, cell division (6–10 weeks post-set), oil fill', frequency: 'weekly' },
        { id: 'dm-check', name: 'Dry matter checks monthly from fruit set', frequency: 'monthly' },
        { id: 'harvest', name: 'Harvest at 23% DM (Hass) / 25% DM (Fuerte)', frequency: 'daily' },
        { id: 'pack', name: 'Grade, pack, and cold chain', frequency: 'daily' },
      ],
      measurements: [
        { id: 'yield', name: 'Annual Yield', unit: 'tonne', frequency: 'once', required: true, benchmark: 15 },
        { id: 'dry-matter', name: 'Avg Dry Matter % at Harvest', unit: 'percent', frequency: 'monthly', required: true, benchmark: 23 },
        { id: 'packout', name: 'Packout %', unit: 'percent', frequency: 'once', required: false, benchmark: 75 },
        { id: 'stem-end-rot', name: 'Stem-end Rot Incidence', unit: 'percent', frequency: 'monthly', required: false, benchmark: 3 },
      ],
      outputs: [
        { materialTypeId: 'avo-fruit', quantity: null, unit: 'tonne', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['production'],
      alerts: ['Harvest by DM — not by colour or size for Hass', 'Alternate bearing is common — thin off-year to encourage on-year'],
    },
  ],
};
