// ─────────────────────────────────────────────────────────────────────────────
// Orchard Extra Templates: Guava, Pawpaw, Apple, Passion Fruit, Macadamia, Moringa
// ─────────────────────────────────────────────────────────────────────────────
import type { ProductionTemplate } from '../types';

// ─── GUAVA ───────────────────────────────────────────────────────────────────
export const guavaTemplate: ProductionTemplate = {
  id: 'guava',
  name: 'Guava',
  shortName: 'Guava',
  category: 'orchard',
  species: 'Psidium guajava',
  purpose: 'Fresh Fruit, Juice & Processing',
  description: 'Fast-bearing tropical fruit tree. Bears 2–3 times per year after the 2nd year. Excellent for fresh market and processing (jam, juice, paste).',
  icon: '🍈',
  color: '#d1fae5',
  tags: ['guava', 'tropical fruit', 'fast bearing', 'juice', 'processing', 'smallholder'],
  materials: [
    { id: 'guava-plant', name: 'Guava Seedling / Grafted Tree', unit: 'count', category: 'input' },
    { id: 'compost', name: 'Compost / Kraal Manure', unit: 'kg', category: 'input' },
    { id: 'guava-fruit', name: 'Fresh Guava Fruit', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Annual Yield per Tree', unit: 'kg', benchmark: 35 },
    { id: 'fruit-wt', name: 'Average Fruit Weight', unit: 'g', benchmark: 200 },
    { id: 'first-bearing', name: 'Age at First Bearing', unit: 'years', benchmark: 2 },
  ],
  stages: [
    {
      id: 'establishment', name: 'Establishment (Year 1)', order: 1, durationDays: 365, color: '#d1fae5',
      inputs: [
        { id: 'plants', label: 'Grafted Guava Plants (5 m × 5 m spacing)', unit: 'count', required: true },
        { id: 'compost', label: 'Compost (10 kg per hole)', unit: 'kg', required: true },
        { id: 'compound', label: 'Compound D (200 g/tree at planting)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'dig-holes', name: 'Dig 60 × 60 × 60 cm holes; fill with compost and topsoil mix', frequency: 'once' },
        { id: 'plant', name: 'Plant in centre of hole at same depth as nursery level', frequency: 'once' },
        { id: 'stake', name: 'Stake young tree for first 6 months', frequency: 'once' },
        { id: 'mulch', name: 'Mulch 1 m radius around base to 10 cm deep', frequency: 'monthly' },
        { id: 'water', name: 'Water twice weekly in dry season during establishment', frequency: 'weekly' },
        { id: 'form-prune', name: 'Formative pruning: train to open-vase shape at 60 cm height', frequency: 'monthly' },
        { id: 'weed', name: 'Keep tree base weed-free (1 m radius)', frequency: 'monthly' },
        { id: 'fertilise', name: 'Apply compound fertiliser every 2 months (200 g/tree)', frequency: 'monthly' },
      ],
      measurements: [
        { id: 'height', name: 'Tree Height', unit: 'cm', frequency: 'monthly', required: true, benchmark: { target: 150 } },
        { id: 'canopy', name: 'Canopy Spread', unit: 'cm', frequency: 'monthly', required: false },
        { id: 'survival', name: 'Survival %', unit: 'percent', frequency: 'monthly', required: true, benchmark: { min: 95 } },
      ],
      outputs: [], possibleNextStages: ['annual-production'],
      alerts: ['Guava grows vigorously — prune to open-vase early to prevent overcrowding which promotes disease'],
    },
    {
      id: 'annual-production', name: 'Annual Production (Year 2+)', order: 2, durationDays: 365, color: '#86efac',
      inputs: [
        { id: 'compound', label: 'Compound D (500 g–1 kg/tree twice/year)', unit: 'kg', required: true },
        { id: 'compost', label: 'Compost / Mulch (10–15 kg/tree annually)', unit: 'kg', required: true },
        { id: 'copper-fungicide', label: 'Copper Fungicide for anthracnose', unit: 'L', required: false },
      ],
      activities: [
        { id: 'fertilise', name: 'Apply compound fertiliser twice yearly (before flowering)', frequency: 'monthly' },
        { id: 'prune', name: 'Annual maintenance prune — remove crossing, dead and diseased branches', frequency: 'monthly' },
        { id: 'harvest', name: 'Harvest at 3/4 mature (firm-ripe) for market; fully ripe for processing', frequency: 'weekly' },
        { id: 'pest-scout', name: 'Scout for fruit fly, mealybug, scale insects monthly', frequency: 'monthly' },
        { id: 'mulch', name: 'Replenish mulch annually', frequency: 'monthly' },
        { id: 'irrigate', name: 'Irrigate during flowering and fruit set if dry', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'yield-tree', name: 'Yield per Tree', unit: 'kg', frequency: 'monthly', required: true, benchmark: { target: 35 } },
        { id: 'fruit-wt', name: 'Average Fruit Weight', unit: 'g', frequency: 'monthly', required: false, benchmark: { target: 200 } },
        { id: 'fruit-fly', name: 'Fruit Fly Infestation %', unit: 'percent', frequency: 'weekly', required: false, benchmark: { max: 5 } },
      ],
      outputs: [
        { materialTypeId: 'guava-fruit', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['annual-production'],
      alerts: ['Fruit fly is the main pest — use protein bait sprays and male annihilation traps', 'Harvest fruit early in the morning when it is still cool to maximise shelf life'],
    },
  ],
};

// ─── PAWPAW (PAPAYA) ─────────────────────────────────────────────────────────
export const pawpawTemplate: ProductionTemplate = {
  id: 'pawpaw',
  name: 'Pawpaw (Papaya)',
  shortName: 'Pawpaw',
  category: 'orchard',
  species: 'Carica papaya',
  purpose: 'Fresh Fruit & Papain Processing',
  description: 'Fast-growing tropical fruit plant. Bears within 9–12 months from seed. High yield per hectare; short economic life (3–5 years). Papain for latex adds value.',
  icon: '🍈',
  color: '#fef3c7',
  tags: ['pawpaw', 'papaya', 'tropical', 'fast bearing', 'papain', 'latex'],
  materials: [
    { id: 'pawpaw-seed', name: 'Pawpaw Seed or Seedling', unit: 'count', category: 'input' },
    { id: 'compound', name: 'Compound Fertiliser', unit: 'kg', category: 'input' },
    { id: 'pawpaw-fruit', name: 'Ripe Pawpaw Fruit', unit: 'kg', category: 'output' },
    { id: 'pawpaw-latex', name: 'Crude Papain Latex', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Annual Yield per Plant', unit: 'kg', benchmark: 50 },
    { id: 'first-fruit', name: 'Days to First Fruit', unit: 'days', benchmark: 270 },
    { id: 'sex-ratio', name: 'Hermaphrodite Plants %', unit: 'percent', benchmark: 70 },
  ],
  stages: [
    {
      id: 'nursery', name: 'Nursery & Transplanting (months 1–3)', order: 1, durationDays: 90, color: '#fef9c3',
      inputs: [
        { id: 'seed', label: 'Pawpaw Seed (from ripe hermaphrodite fruit)', unit: 'count', required: true },
        { id: 'compost', label: 'Seedling Mix', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'sow-3-per-hole', name: 'Sow 3 seeds per bag or per hole (for sex thinning later)', frequency: 'once' },
        { id: 'water', name: 'Water daily; keep consistently moist', frequency: 'daily' },
        { id: 'transplant', name: 'Transplant 6–8 week seedlings at 2.5 × 2.5 m spacing', frequency: 'once' },
        { id: 'shade', name: 'Shade transplants for first week', frequency: 'once' },
      ],
      measurements: [
        { id: 'germination', name: 'Germination % (day 14)', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 70 } },
      ],
      outputs: [], possibleNextStages: ['vegetative'],
      alerts: ['Plant 3 per hole — thin to 1 hermaphrodite at first flowering to ensure fruit set'],
    },
    {
      id: 'vegetative', name: 'Rapid Vegetative Growth (months 3–9)', order: 2, durationDays: 180, color: '#fde68a',
      inputs: [
        { id: 'compound', label: 'Compound D (500 g/plant at 2 month intervals)', unit: 'kg', required: true },
        { id: 'compost', label: 'Compost mulch (10 kg/plant)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'sex-thin', name: 'Thin to 1 hermaphrodite per hole at first flowering (month 4–5)', frequency: 'once' },
        { id: 'fertilise', name: 'Apply compound every 2 months; CAN monthly during fruiting', frequency: 'monthly' },
        { id: 'irrigate', name: 'Irrigate 2× weekly in dry season', frequency: 'weekly' },
        { id: 'weed', name: 'Keep weed-free in 1 m radius', frequency: 'monthly' },
        { id: 'phytophthora', name: 'Scout for Phytophthora (stem rot) — ensure good drainage', frequency: 'monthly' },
      ],
      measurements: [
        { id: 'height', name: 'Plant Height', unit: 'cm', frequency: 'monthly', required: false },
        { id: 'first-flower', name: 'Flowering Started (month)', unit: 'score', frequency: 'once', required: false },
      ],
      outputs: [], possibleNextStages: ['fruiting'],
      alerts: ['Waterlogging kills pawpaw within days — ensure excellent drainage at planting site'],
    },
    {
      id: 'fruiting', name: 'Fruiting & Harvest (months 9+, continuous)', order: 3, durationDays: 365, color: '#fb923c',
      inputs: [
        { id: 'can', label: 'CAN (200 g/plant per month during fruiting)', unit: 'kg', required: true },
        { id: 'potassium', label: 'MOP / Potassium for fruit quality', unit: 'kg', required: false },
        { id: 'fungicide', label: 'Copper fungicide for anthracnose (post-harvest)', unit: 'L', required: false },
      ],
      activities: [
        { id: 'harvest', name: 'Harvest when 10% of skin turns yellow (for transport); fully yellow (for local)', frequency: 'weekly' },
        { id: 'latex', name: 'Score unripe fruit with razor for latex extraction (for papain)', frequency: 'weekly' },
        { id: 'rogue', name: 'Remove male or female-only plants that set no fruit', frequency: 'monthly' },
        { id: 'lower-leaves', name: 'Remove old dry leaves at base regularly', frequency: 'monthly' },
        { id: 'spray-papaya-mosaic', name: 'Control aphids (mosaic virus vectors) — yellow sticky traps', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'yield-plant', name: 'Yield per Plant', unit: 'kg', frequency: 'monthly', required: true, benchmark: { target: 50 } },
        { id: 'fruit-count', name: 'Fruits per Plant per Month', unit: 'count', frequency: 'monthly', required: false, benchmark: { target: 8 } },
      ],
      outputs: [
        { materialTypeId: 'pawpaw-fruit', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
        { materialTypeId: 'pawpaw-latex', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['fruiting'],
      alerts: ['Papaya ringspot virus is incurable — remove infected plants immediately to protect the rest', 'Harvest every 7 days — fruit left on tree rapidly over-ripens and becomes unsaleable'],
    },
  ],
};

// ─── PASSION FRUIT ───────────────────────────────────────────────────────────
export const passionFruitTemplate: ProductionTemplate = {
  id: 'passion-fruit',
  name: 'Passion Fruit',
  shortName: 'Passion Fruit',
  category: 'orchard',
  species: 'Passiflora edulis',
  purpose: 'Fresh Fruit & Juice Processing',
  description: 'Fast-bearing climbing vine. Bears within 12–18 months; economic life 3–5 years. Purple or yellow varieties. High-value fruit for juice and fresh markets.',
  icon: '🌸',
  color: '#ede9fe',
  tags: ['passion fruit', 'vine', 'tropical', 'juice', 'fast bearing', 'trellis'],
  materials: [
    { id: 'passion-cutting', name: 'Passion Fruit Cutting or Seedling', unit: 'count', category: 'input' },
    { id: 'trellis-wire', name: 'Trellis Wire & Posts', unit: 'count', category: 'input' },
    { id: 'compound', name: 'Compound Fertiliser', unit: 'kg', category: 'input' },
    { id: 'passion-fruit', name: 'Fresh Passion Fruit', unit: 'kg', category: 'output' },
    { id: 'passion-juice', name: 'Passion Fruit Juice / Pulp', unit: 'L', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Annual Yield per Hectare', unit: 't', benchmark: 18 },
    { id: 'juice-pct', name: 'Juice Yield %', unit: 'percent', benchmark: 35 },
    { id: 'first-harvest', name: 'Months to First Harvest', unit: 'months', benchmark: 12 },
  ],
  stages: [
    {
      id: 'establishment', name: 'Trellis & Establishment (months 1–6)', order: 1, durationDays: 180, color: '#ede9fe',
      inputs: [
        { id: 'plants', label: 'Cuttings or Seedlings (2.5 × 5 m spacing = 800/ha)', unit: 'count', required: true },
        { id: 'posts', label: 'Trellis Posts (2 m tall, 5 m apart) + wire', unit: 'count', required: true },
        { id: 'compost', label: 'Compost (10 kg/hole)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'erect-trellis', name: 'Erect trellis before planting — 2 wires at 1.5 m and 2 m height', frequency: 'once' },
        { id: 'plant', name: 'Plant and tie to stake immediately', frequency: 'once' },
        { id: 'train', name: 'Train single leader to top wire; pinch tip to promote lateral branching', frequency: 'weekly' },
        { id: 'irrigate', name: 'Water 3× weekly in dry season during establishment', frequency: 'weekly' },
        { id: 'fertilise', name: 'Apply compound fertiliser monthly (200–300 g/plant)', frequency: 'monthly' },
      ],
      measurements: [
        { id: 'vine-length', name: 'Vine Length', unit: 'cm', frequency: 'monthly', required: true, benchmark: { target: 300 } },
        { id: 'survival', name: 'Survival %', unit: 'percent', frequency: 'monthly', required: true, benchmark: { min: 90 } },
      ],
      outputs: [], possibleNextStages: ['production'],
      alerts: ['Train vines aggressively in first 6 months — the framework built now determines the productive lifespan'],
    },
    {
      id: 'production', name: 'Production (months 12–48)', order: 2, durationDays: 730, color: '#a78bfa',
      inputs: [
        { id: 'can', label: 'CAN (200 g/plant monthly)', unit: 'kg', required: true },
        { id: 'mop', label: 'MOP / Potassium Sulphate (200 g/plant twice/year)', unit: 'kg', required: true },
        { id: 'copper-fungicide', label: 'Copper Oxychloride for brown spot', unit: 'L', required: false },
      ],
      activities: [
        { id: 'fertilise', name: 'Apply CAN monthly; K twice yearly before flowering', frequency: 'monthly' },
        { id: 'prune', name: 'Annual renewal pruning — cut all laterals back to 30 cm after main harvest', frequency: 'monthly' },
        { id: 'train', name: 'Train new growth on trellis system regularly', frequency: 'weekly' },
        { id: 'harvest', name: 'Harvest fallen or dark-wrinkled fruit from ground daily', frequency: 'daily' },
        { id: 'woodiness-scout', name: 'Scout for woodiness virus (distorted leaves) — remove plants', frequency: 'weekly' },
        { id: 'fungus-spray', name: 'Spray copper fungicide for brown spot at fruiting', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'yield-ha', name: 'Monthly Yield per Ha', unit: 'kg', frequency: 'monthly', required: true, benchmark: { target: 1500 } },
        { id: 'brix', name: 'Juice Brix', unit: 'percent', frequency: 'monthly', required: false, benchmark: { min: 12 } },
        { id: 'woodiness', name: 'Woodiness Virus Incidence %', unit: 'percent', frequency: 'monthly', required: false, benchmark: { max: 2 } },
      ],
      outputs: [
        { materialTypeId: 'passion-fruit', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
        { materialTypeId: 'passion-juice', quantity: null, unit: 'L', routing: 'processing', qualityGrade: 'A' },
      ],
      possibleNextStages: ['production'],
      alerts: ['Woodiness virus has no cure — infected plants must be destroyed to protect neighbouring vines', 'Annual renewal pruning is the single most important practice for sustained high yield'],
    },
  ],
};

// ─── MACADAMIA ───────────────────────────────────────────────────────────────
export const macadamiaTemplate: ProductionTemplate = {
  id: 'macadamia',
  name: 'Macadamia',
  shortName: 'Macadamia',
  category: 'orchard',
  species: 'Macadamia integrifolia / tetraphylla',
  purpose: 'Premium Nut Production',
  description: 'Long-life premium nut tree. Grafted trees bear from year 4–5; full production by year 10. Very high nut-in-shell prices; excellent long-term investment.',
  icon: '🥥',
  color: '#fef3c7',
  tags: ['macadamia', 'nut', 'premium', 'long-term', 'export', 'grafted'],
  materials: [
    { id: 'mac-plant', name: 'Grafted Macadamia Tree', unit: 'count', category: 'input' },
    { id: 'mac-fert', name: 'Macadamia Fertiliser (low P)', unit: 'kg', category: 'input' },
    { id: 'nis', name: 'Nut-in-Shell (NIS)', unit: 'kg', category: 'output' },
    { id: 'kernel', name: 'Macadamia Kernel', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'nis-yield', name: 'NIS Yield per Tree (Year 10)', unit: 'kg', benchmark: 25 },
    { id: 'kernel-recovery', name: 'Kernel Recovery %', unit: 'percent', benchmark: 30 },
    { id: 'sound-kernel', name: 'Sound Kernel Recovery (SKR)', unit: 'percent', benchmark: 28 },
    { id: 'first-yield', name: 'Year to First Commercial Crop', unit: 'years', benchmark: 5 },
  ],
  stages: [
    {
      id: 'establishment', name: 'Establishment (Years 1–3)', order: 1, durationDays: 1095, color: '#fef3c7',
      inputs: [
        { id: 'trees', label: 'Grafted Trees (7 m × 7 m = 204 trees/ha)', unit: 'count', required: true },
        { id: 'compost', label: 'Compost (20 kg/hole)', unit: 'kg', required: true },
        { id: 'fert', label: 'Macadamia Fertiliser (no phosphorus — toxic to mac)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'dig', name: 'Dig 60 × 60 × 60 cm holes; mix with compost and topsoil', frequency: 'once' },
        { id: 'plant', name: 'Plant grafted trees; stake; mulch 2 m radius', frequency: 'once' },
        { id: 'water', name: 'Irrigate 3× weekly for 2 years', frequency: 'weekly' },
        { id: 'fertilise', name: 'Apply macadamia fertiliser every 2 months (avoid P)', frequency: 'monthly' },
        { id: 'form-prune', name: 'Formative pruning to single leader and 3–4 main scaffolds', frequency: 'monthly' },
        { id: 'weed', name: 'Keep weed-free in tree circle; mow between rows', frequency: 'monthly' },
      ],
      measurements: [
        { id: 'height', name: 'Tree Height', unit: 'm', frequency: 'monthly', required: true, benchmark: { target: 2.0 } },
        { id: 'survival', name: 'Survival %', unit: 'percent', frequency: 'monthly', required: true, benchmark: { min: 98 } },
      ],
      outputs: [], possibleNextStages: ['early-bearing'],
      alerts: ['NEVER apply phosphorus fertiliser — macadamia is a Proteaceae and dies from phosphorus toxicity', 'Graft union must remain above soil — planting too deep causes slow death'],
    },
    {
      id: 'early-bearing', name: 'Early Bearing (Years 4–7)', order: 2, durationDays: 1460, color: '#fde68a',
      inputs: [
        { id: 'fert', label: 'NPK Mac fertiliser (increasing annually)', unit: 'kg', required: true },
        { id: 'compost', label: 'Compost / mulch renewal', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'fertilise', name: 'Apply compound fertiliser split 3× through season', frequency: 'monthly' },
        { id: 'prune', name: 'Light canopy management — lift skirt, open centre for air', frequency: 'monthly' },
        { id: 'scout', name: 'Scout for nut borer, stinkbugs and felted coccid monthly', frequency: 'monthly' },
        { id: 'harvest', name: 'Harvest fallen nuts promptly — collect weekly', frequency: 'weekly' },
        { id: 'husk-remove', name: 'De-husk within 24 hours of harvest; dry NIS to <10% MC', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'nis-yield', name: 'NIS Yield per Tree', unit: 'kg', frequency: 'monthly', required: true, benchmark: { target: 8 } },
        { id: 'skr', name: 'Sound Kernel Recovery %', unit: 'percent', frequency: 'monthly', required: false, benchmark: { min: 26 } },
      ],
      outputs: [
        { materialTypeId: 'nis', quantity: null, unit: 'kg', routing: 'processing', qualityGrade: 'A' },
      ],
      possibleNextStages: ['full-production'],
      alerts: ['Collect fallen nuts every 3–4 days maximum — delayed collection causes kernel darkening and mould, destroying value'],
    },
    {
      id: 'full-production', name: 'Full Production (Year 8+)', order: 3, durationDays: 365, color: '#fbbf24',
      inputs: [
        { id: 'fert', label: 'Macadamia Fertiliser (full rate per tree)', unit: 'kg', required: true },
        { id: 'compost', label: 'Compost / mulch', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'fertilise', name: 'Split fertiliser application 3× per year', frequency: 'monthly' },
        { id: 'harvest-freq', name: 'Increase harvest rounds to 2× per week at peak fall', frequency: 'weekly' },
        { id: 'ipm', name: 'Integrated pest management for stinkbug and nut borer', frequency: 'monthly' },
        { id: 'canopy-mgmt', name: 'Canopy management pruning post-harvest', frequency: 'monthly' },
        { id: 'leaf-sampling', name: 'Annual leaf nutrient analysis to fine-tune fertiliser', frequency: 'monthly' },
      ],
      measurements: [
        { id: 'nis-yield', name: 'NIS Yield per Tree', unit: 'kg', frequency: 'monthly', required: true, benchmark: { target: 25 } },
        { id: 'skr', name: 'SKR %', unit: 'percent', frequency: 'monthly', required: true, benchmark: { min: 28 } },
        { id: 'total-ha', name: 'Total NIS Yield per Ha', unit: 'kg', frequency: 'monthly', required: false, benchmark: { target: 5000 } },
      ],
      outputs: [
        { materialTypeId: 'nis', quantity: null, unit: 'kg', routing: 'processing', qualityGrade: 'A' },
        { materialTypeId: 'kernel', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['full-production'],
      alerts: ['Macadamia roots are very sensitive to soil disturbance — never cultivate under the canopy'],
    },
  ],
};

// ─── MORINGA ─────────────────────────────────────────────────────────────────
export const moringaTemplate: ProductionTemplate = {
  id: 'moringa',
  name: 'Moringa (Drumstick Tree)',
  shortName: 'Moringa',
  category: 'orchard',
  species: 'Moringa oleifera',
  purpose: 'Leaves, Pods & Oil Seeds — Nutrition & Health Market',
  description: 'Fast-growing drought-tolerant multipurpose tree. Leaves (powder/fresh), pods (drumstick vegetable), seeds (oil and water purification), and roots all have commercial value.',
  icon: '🌿',
  color: '#d1fae5',
  tags: ['moringa', 'superfood', 'multipurpose', 'drought tolerant', 'leaf powder', 'nutraceutical'],
  materials: [
    { id: 'moringa-seed', name: 'Moringa Seeds (or cuttings)', unit: 'kg', category: 'input' },
    { id: 'moringa-leaves', name: 'Fresh / Dried Moringa Leaves', unit: 'kg', category: 'output' },
    { id: 'moringa-pods', name: 'Fresh Drumstick Pods', unit: 'kg', category: 'output' },
    { id: 'moringa-seeds', name: 'Moringa Seeds (for oil)', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'leaf-yield', name: 'Dry Leaf Powder Yield per Ha/year', unit: 'kg', benchmark: 3000 },
    { id: 'pod-yield', name: 'Pod Yield per Tree', unit: 'kg', benchmark: 30 },
    { id: 'first-harvest', name: 'Days to First Leaf Harvest', unit: 'days', benchmark: 60 },
  ],
  stages: [
    {
      id: 'establishment', name: 'Planting & Establishment', order: 1, durationDays: 90, color: '#d1fae5',
      inputs: [
        { id: 'seeds', label: 'Moringa Seeds (direct seeded at 2 per hole)', unit: 'kg', required: true },
        { id: 'basal', label: 'Compost / Kraal Manure (5 kg/hole)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'plant', name: 'Plant 2 seeds per hole; 2 × 2 m spacing for leaf production (or 5 × 5 m for pods)', frequency: 'once' },
        { id: 'thin', name: 'Thin to 1 plant per hole after 3 weeks', frequency: 'once' },
        { id: 'water', name: 'Water twice weekly until established', frequency: 'weekly' },
        { id: 'weed', name: 'Keep weed-free in first 3 months', frequency: 'monthly' },
      ],
      measurements: [
        { id: 'germination', name: 'Germination % (day 10)', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 80 } },
        { id: 'height', name: 'Plant Height at 3 months', unit: 'cm', frequency: 'monthly', required: false, benchmark: { target: 100 } },
      ],
      outputs: [], possibleNextStages: ['leaf-production'],
      alerts: ['Moringa grows very fast — first harvest possible at 60 days. It is one of the fastest-growing food trees.'],
    },
    {
      id: 'leaf-production', name: 'Leaf & Pod Production (cut-and-regrow)', order: 2, durationDays: 365, color: '#4ade80',
      inputs: [
        { id: 'manure', label: 'Manure / Compost (10 kg/tree per cut)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'cut-leaf', name: 'Cut branches at 1 m height every 45–60 days for leaf production', frequency: 'monthly' },
        { id: 'dry-leaves', name: 'Dry leaves in shade (not direct sun) for 3–5 days before milling', frequency: 'monthly' },
        { id: 'mill', name: 'Mill dried leaves to fine powder; screen through 0.5 mm mesh', frequency: 'monthly' },
        { id: 'pod-harvest', name: 'Harvest drumstick pods at 30–45 cm length when still tender', frequency: 'weekly' },
        { id: 'seed-harvest', name: 'Allow some pods to mature fully for seed oil extraction', frequency: 'monthly' },
        { id: 'fertilise', name: 'Apply manure or compost after each cutting to promote regrowth', frequency: 'monthly' },
      ],
      measurements: [
        { id: 'leaf-yield', name: 'Fresh Leaf Yield per Cut', unit: 'kg', frequency: 'monthly', required: true, benchmark: { target: 2 } },
        { id: 'powder-yield', name: 'Dry Leaf Powder (from 100 kg fresh)', unit: 'kg', frequency: 'monthly', required: false, benchmark: { target: 25 } },
        { id: 'pod-yield', name: 'Pods per Tree per Month', unit: 'kg', frequency: 'monthly', required: false },
      ],
      outputs: [
        { materialTypeId: 'moringa-leaves', quantity: null, unit: 'kg', routing: 'processing', qualityGrade: 'A' },
        { materialTypeId: 'moringa-pods', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
        { materialTypeId: 'moringa-seeds', quantity: null, unit: 'kg', routing: 'processing', qualityGrade: 'A' },
      ],
      possibleNextStages: ['leaf-production'],
      alerts: ['Never dry moringa leaves in direct sun — heat destroys the vitamins and turns leaves yellow', 'Always cut at 1 m height — cutting at soil level can kill the tree'],
    },
  ],
};
