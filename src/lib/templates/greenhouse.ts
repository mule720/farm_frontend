// ─────────────────────────────────────────────────────────────────────────────
// Greenhouse Templates: Rose (cut flowers), Herbs, Strawberry,
// Hydroponic Lettuce / Microgreens, Bell Pepper
// ─────────────────────────────────────────────────────────────────────────────
import type { ProductionTemplate } from '../types';

// ─── CUT FLOWER ROSES ────────────────────────────────────────────────────────
export const cutRoseTemplate: ProductionTemplate = {
  id: 'cut-rose',
  name: 'Cut Flower Rose',
  shortName: 'Cut Rose',
  category: 'greenhouse',
  species: 'Rosa × hybrida',
  purpose: 'Cut Flowers — Export & Local Market',
  description: 'Commercial cut flower rose production under greenhouse. High-value export crop. Continuous year-round production once established. 5–8 year economic life.',
  icon: '🌹',
  color: '#fce7f3',
  tags: ['roses', 'cut flowers', 'greenhouse', 'export', 'floricultural', 'high value'],
  materials: [
    { id: 'rose-rootstock', name: 'Budded Rose on Rootstock', unit: 'count', category: 'input' },
    { id: 'rose-fert', name: 'Rose Fertigation Solution (NPK)', unit: 'L', category: 'input' },
    { id: 'rose-bunch', name: 'Cut Rose Stems (bunch of 20)', unit: 'bunch', category: 'output' },
  ],
  kpis: [
    { id: 'stems-m2-year', name: 'Stems per m² per Year', unit: 'count', benchmark: 220 },
    { id: 'vase-life', name: 'Vase Life (days)', unit: 'days', benchmark: 14 },
    { id: 'stem-length', name: 'Avg Stem Length', unit: 'cm', benchmark: 60 },
    { id: 'grade-a-pct', name: 'Grade A (60+ cm) %', unit: 'percent', benchmark: 60 },
  ],
  stages: [
    {
      id: 'establishment', name: 'Planting & Establishment (weeks 1–12)', order: 1, durationDays: 84, color: '#fce7f3',
      inputs: [
        { id: 'plants', label: 'Budded Rose Bushes (7 plants/m²)', unit: 'count', required: true },
        { id: 'grow-bags', label: 'Perlite / Cocopeat Grow Bags', unit: 'count', required: true },
        { id: 'drip-fert', label: 'Establishment Nutrient Solution', unit: 'L', required: true },
      ],
      activities: [
        { id: 'plant', name: 'Plant in grow bags or soil beds with drip irrigation', frequency: 'once' },
        { id: 'humidity', name: 'Maintain 80–85% relative humidity for first 4 weeks', frequency: 'daily' },
        { id: 'fertigation', name: 'Fertigate daily with dilute solution (EC 1.5–2.0 mS/cm)', frequency: 'daily' },
        { id: 'form-prune', name: 'Bend down first shoots at 45° to build strong base', frequency: 'weekly' },
        { id: 'climate', name: 'Maintain 18–22°C night / 24–26°C day temperature', frequency: 'daily' },
      ],
      measurements: [
        { id: 'shoot-count', name: 'New Shoots per Plant', unit: 'count', frequency: 'weekly', required: true, benchmark: { target: 5 } },
        { id: 'temp', name: 'Greenhouse Temperature', unit: '°C', frequency: 'daily', required: true, benchmark: { min: 18, max: 28 } },
        { id: 'humidity', name: 'Relative Humidity', unit: 'percent', frequency: 'daily', required: true, benchmark: { min: 70, max: 85 } },
      ],
      outputs: [], possibleNextStages: ['production'],
      alerts: ['Botrytis (grey mould) explodes above 85% RH and below 18°C — ventilate aggressively at night'],
    },
    {
      id: 'production', name: 'Continuous Production (months 3–60)', order: 2, durationDays: 1460, color: '#fbcfe8',
      inputs: [
        { id: 'fert-solution', label: 'Complete Nutrient Solution (daily fertigation)', unit: 'L', required: true },
        { id: 'pesticide', label: 'IPM: predatory mites, fungicides', unit: 'L', required: true },
        { id: 'co2', label: 'CO₂ Enrichment (optional, 700–1000 ppm)', unit: 'kg', required: false },
      ],
      activities: [
        { id: 'fertigation', name: 'Fertigate 4–6× daily at EC 2.0–2.5 mS/cm', frequency: 'daily' },
        { id: 'harvest', name: 'Harvest stems at "bud stage" (first petal unfurling) in early morning', frequency: 'daily' },
        { id: 'grade', name: 'Grade, bunch and immediately place in hydration solution', frequency: 'daily' },
        { id: 'cold-room', name: 'Pre-cool in cold room at 2–4°C within 2 hours of harvest', frequency: 'daily' },
        { id: 'ipm', name: 'Weekly IPM programme: scout for spider mite, thrips, Botrytis', frequency: 'weekly' },
        { id: 'renewal-prune', name: 'Hard prune 20% of plants on rotation to renew production', frequency: 'monthly' },
        { id: 'leaf-remove', name: 'Remove all leaves below 3rd stem node weekly', frequency: 'weekly' },
        { id: 'climate-manage', name: 'Manage temperature and humidity via ventilation and heating/cooling', frequency: 'daily' },
      ],
      measurements: [
        { id: 'stems-m2', name: 'Stems Harvested per m² per Week', unit: 'count', frequency: 'weekly', required: true, benchmark: { target: 4 } },
        { id: 'grade-a', name: 'Grade A (60+ cm) %', unit: 'percent', frequency: 'weekly', required: true, benchmark: { min: 60 } },
        { id: 'pest-pressure', name: 'Pest Pressure Score (1–5)', unit: 'score', frequency: 'weekly', required: false },
        { id: 'ec', name: 'Drain Water EC', unit: 'mS/cm', frequency: 'daily', required: false, benchmark: { max: 4.0 } },
      ],
      outputs: [
        { materialTypeId: 'rose-bunch', quantity: null, unit: 'bunch', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['production'],
      alerts: ['Spider mite populations double every 3 days in hot weather — introduce Phytoseiulus immediately at first detection', 'Cold room must be operational BEFORE first harvest — flowers harvested warm have half the vase life'],
    },
  ],
};

// ─── FRESH HERBS ─────────────────────────────────────────────────────────────
export const herbsTemplate: ProductionTemplate = {
  id: 'fresh-herbs',
  name: 'Fresh Herbs (Basil, Mint, Coriander)',
  shortName: 'Fresh Herbs',
  category: 'greenhouse',
  species: 'Ocimum basilicum / Mentha / Coriandrum',
  purpose: 'Fresh Culinary Herbs — Market & Restaurant Supply',
  description: 'Fast-cycling greenhouse herb production for fresh market. Continuous cut-and-come-again system; multiple varieties to supply restaurants and supermarkets year-round.',
  icon: '🌿',
  color: '#d1fae5',
  tags: ['herbs', 'basil', 'mint', 'coriander', 'fast cycle', 'greenhouse', 'restaurant supply'],
  materials: [
    { id: 'herb-seed', name: 'Herb Seed (basil, coriander, parsley)', unit: 'g', category: 'input' },
    { id: 'seedling-mix', name: 'Sterile Seedling Mix', unit: 'kg', category: 'input' },
    { id: 'herb-fert', name: 'Liquid Fertiliser (N-rich)', unit: 'L', category: 'input' },
    { id: 'fresh-herbs', name: 'Fresh Herb Bunches', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'yield-m2', name: 'Yield per m² per Month', unit: 'kg', benchmark: 3 },
    { id: 'days-first', name: 'Days to First Harvest (basil)', unit: 'days', benchmark: 25 },
    { id: 'cycles-year', name: 'Production Cycles per Year', unit: 'count', benchmark: 8 },
  ],
  stages: [
    {
      id: 'seeding', name: 'Seeding & Germination (days 1–10)', order: 1, durationDays: 10, color: '#d1fae5',
      inputs: [
        { id: 'seed', label: 'Herb Seed (20 g/m² for basil; 5 g/m² for coriander)', unit: 'g', required: true },
        { id: 'trays', label: 'Seedling Trays / Jiffy Plugs', unit: 'count', required: true },
      ],
      activities: [
        { id: 'fill-trays', name: 'Fill trays with moist sterile mix', frequency: 'once' },
        { id: 'sow', name: 'Sow 2–3 seeds per cell; cover lightly', frequency: 'once' },
        { id: 'mist', name: 'Mist twice daily; do not flood', frequency: 'daily' },
        { id: 'heat', name: 'Maintain 22–25°C for fast germination', frequency: 'daily' },
      ],
      measurements: [
        { id: 'germination', name: 'Germination % (day 7)', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 85 } },
      ],
      outputs: [], possibleNextStages: ['production'],
      alerts: ['Basil seed germinates in 5–7 days at 22°C but fails below 18°C — use heat mat if needed'],
    },
    {
      id: 'production', name: 'Rapid Growth & Continuous Harvest (weeks 2–8)', order: 2, durationDays: 42, color: '#86efac',
      inputs: [
        { id: 'liquid-fert', label: 'Liquid N Fertiliser (weekly at half rate)', unit: 'L', required: true },
        { id: 'water', label: 'Irrigation Water', unit: 'L', required: true },
      ],
      activities: [
        { id: 'water', name: 'Water daily — basil wilts fast and does not recover well', frequency: 'daily' },
        { id: 'feed', name: 'Apply liquid fertiliser weekly', frequency: 'weekly' },
        { id: 'harvest', name: 'Cut herb tops above 3rd leaf node — triggers bushy regrowth', frequency: 'weekly' },
        { id: 'pinch-flower', name: 'Remove flower buds immediately on basil — flowering reduces leaf quality', frequency: 'daily' },
        { id: 'batch-new', name: 'Start new seedling batch every 3–4 weeks for staggered supply', frequency: 'weekly' },
        { id: 'pest', name: 'Scout for aphids, whitefly and fungus gnats weekly', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'yield-week', name: 'Weekly Yield', unit: 'kg', frequency: 'weekly', required: true, benchmark: { target: 0.5 } },
        { id: 'leaf-quality', name: 'Leaf Quality Score (1–5)', unit: 'score', frequency: 'weekly', required: false },
      ],
      outputs: [
        { materialTypeId: 'fresh-herbs', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['production'],
      alerts: ['Harvest herbs in the morning when essential oils are highest — never harvest in peak afternoon heat', 'Fungus gnats breed in wet potting mix — allow surface to dry slightly between watering'],
    },
  ],
};

// ─── HYDROPONIC LETTUCE & MICROGREENS ────────────────────────────────────────
export const hydroponicLettuceTemplate: ProductionTemplate = {
  id: 'hydroponic-lettuce',
  name: 'Hydroponic Lettuce & Microgreens',
  shortName: 'Hydroponic Lettuce',
  category: 'greenhouse',
  species: 'Lactuca sativa / Mixed Species',
  purpose: 'Fast-Cycle Premium Salad Greens',
  description: 'NFT or floating raft hydroponic lettuce and microgreens. Fastest cash crop in controlled environment; 21–28 day cycles. High market value at restaurants and supermarkets.',
  icon: '🥗',
  color: '#d1fae5',
  tags: ['hydroponics', 'lettuce', 'microgreens', 'NFT', 'floating raft', 'fast cycle', 'urban farming'],
  materials: [
    { id: 'lettuce-seed', name: 'Lettuce / Microgreen Seed', unit: 'g', category: 'input' },
    { id: 'nutrient-ab', name: 'Hydroponic A+B Nutrient Concentrate', unit: 'L', category: 'input' },
    { id: 'growing-medium', name: 'Rockwool / Clay Pebbles / Jiffy Plugs', unit: 'count', category: 'input' },
    { id: 'lettuce-head', name: 'Lettuce Head', unit: 'count', category: 'output' },
    { id: 'microgreens', name: 'Microgreens (punnet)', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'heads-m2-year', name: 'Lettuce Heads per m² per Year', unit: 'count', benchmark: 150 },
    { id: 'microgreen-yield', name: 'Microgreen Yield per Tray (28 × 53 cm)', unit: 'g', benchmark: 400 },
    { id: 'days-lettuce', name: 'Days to Harvest (lettuce)', unit: 'days', benchmark: 28 },
    { id: 'days-microgreen', name: 'Days to Harvest (microgreens)', unit: 'days', benchmark: 10 },
    { id: 'water-use', name: 'Water Use vs Soil Grown', unit: 'percent', benchmark: 10 },
  ],
  stages: [
    {
      id: 'seeding', name: 'Seeding & Germination (days 1–5)', order: 1, durationDays: 5, color: '#d1fae5',
      inputs: [
        { id: 'seed', label: 'Seed in Rockwool plugs / jiffy plugs (1 seed per cell)', unit: 'g', required: true },
        { id: 'starter-solution', label: 'Nutrient Starter Solution (EC 0.8 mS/cm, pH 5.8)', unit: 'L', required: true },
      ],
      activities: [
        { id: 'soak-plugs', name: 'Pre-soak rockwool plugs to pH 5.8 for 1 hour', frequency: 'once' },
        { id: 'sow', name: 'Place 1 seed per plug; cover with propagation dome', frequency: 'once' },
        { id: 'dark-sprout', name: 'Keep in dark at 20–22°C for 2 days for fast germination', frequency: 'once' },
        { id: 'move-light', name: 'Move to light (14–16 h photoperiod) at radicle emergence', frequency: 'once' },
      ],
      measurements: [
        { id: 'germination', name: 'Germination % (day 5)', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 90 } },
      ],
      outputs: [], possibleNextStages: ['grow-out'],
      alerts: ['pH must be maintained at 5.5–6.5 — outside this range nutrients become unavailable regardless of concentration'],
    },
    {
      id: 'grow-out', name: 'Hydroponic Grow-Out (days 5–28)', order: 2, durationDays: 23, color: '#86efac',
      inputs: [
        { id: 'nutrient-ab', label: 'A+B Nutrient Solution (EC 1.6–2.0 mS/cm)', unit: 'L', required: true },
      ],
      activities: [
        { id: 'ec-check', name: 'Check EC and pH twice daily; adjust to target range', frequency: 'daily' },
        { id: 'top-up', name: 'Top up reservoir with water as plants uptake nutrients', frequency: 'daily' },
        { id: 'clean-reservoir', name: 'Replace full nutrient solution weekly to prevent salt build-up', frequency: 'weekly' },
        { id: 'thin-check', name: 'Remove any dead or diseased plants immediately', frequency: 'daily' },
        { id: 'harvest-micro', name: 'Harvest microgreens at cotyledon stage (day 7–12) with scissors', frequency: 'daily' },
        { id: 'harvest-lettuce', name: 'Harvest lettuce at 100–150 g head weight (day 21–28)', frequency: 'daily' },
      ],
      measurements: [
        { id: 'ec', name: 'Nutrient Solution EC', unit: 'mS/cm', frequency: 'daily', required: true, benchmark: { min: 1.4, max: 2.2 } },
        { id: 'ph', name: 'Nutrient Solution pH', unit: 'pH', frequency: 'daily', required: true, benchmark: { min: 5.5, max: 6.5 } },
        { id: 'head-weight', name: 'Average Head Weight at Harvest', unit: 'g', frequency: 'once', required: true, benchmark: { target: 120 } },
        { id: 'do', name: 'Dissolved Oxygen in Solution', unit: 'mg/L', frequency: 'daily', required: false, benchmark: { min: 5 } },
      ],
      outputs: [
        { materialTypeId: 'lettuce-head', quantity: null, unit: 'count', routing: 'inventory', qualityGrade: 'A' },
        { materialTypeId: 'microgreens', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['seeding'],
      alerts: ['pH drift above 7.0 causes iron deficiency (yellowing) within 48 hours — check twice daily', 'Pythium root rot is the main disease — ensure good DO (oxygenation) and clean systems between cycles'],
    },
  ],
};

// ─── GREENHOUSE BELL PEPPER ───────────────────────────────────────────────────
export const greenhousePepperTemplate: ProductionTemplate = {
  id: 'greenhouse-pepper',
  name: 'Greenhouse Bell Pepper (Capsicum)',
  shortName: 'GH Bell Pepper',
  category: 'greenhouse',
  species: 'Capsicum annuum',
  purpose: 'Premium Fresh Pepper — Restaurant & Export',
  description: 'Long-season greenhouse sweet pepper crop. High-value red, yellow, and orange peppers for premium markets. 9–12 month continuous production cycle.',
  icon: '🫑',
  color: '#d1fae5',
  tags: ['bell pepper', 'capsicum', 'sweet pepper', 'greenhouse', 'long season', 'premium', 'export'],
  materials: [
    { id: 'pepper-seed', name: 'Hybrid Bell Pepper Seed', unit: 'g', category: 'input' },
    { id: 'grow-bag', name: 'Cocopeat Grow Bags', unit: 'count', category: 'input' },
    { id: 'nutrient-sol', name: 'Pepper Nutrient Solution', unit: 'L', category: 'input' },
    { id: 'bell-pepper', name: 'Fresh Bell Pepper', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'yield-m2', name: 'Yield per m²', unit: 'kg', benchmark: 35 },
    { id: 'fruit-wt', name: 'Average Fruit Weight', unit: 'g', benchmark: 200 },
    { id: 'grade-a', name: 'Grade A (Extra Class) %', unit: 'percent', benchmark: 70 },
    { id: 'harvest-weeks', name: 'Weeks of Continuous Harvest', unit: 'weeks', benchmark: 32 },
  ],
  stages: [
    {
      id: 'nursery', name: 'Nursery (6–7 weeks)', order: 1, durationDays: 45, color: '#d1fae5',
      inputs: [
        { id: 'seed', label: 'Hybrid Seed (200–250 g/ha)', unit: 'g', required: true },
        { id: 'rockwool-cubes', label: 'Rockwool Propagation Cubes (4 cm)', unit: 'count', required: true },
      ],
      activities: [
        { id: 'sow', name: 'Sow 1 seed per cube; germinate at 26–28°C', frequency: 'once' },
        { id: 'grow-on', name: 'Grow on at 22–24°C; 16 h photoperiod', frequency: 'daily' },
        { id: 'harden', name: 'Harden off for 5 days at lower temperature before transplant', frequency: 'daily' },
      ],
      measurements: [
        { id: 'germination', name: 'Germination % (day 8)', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 90 } },
        { id: 'seedling-height', name: 'Seedling Height at 6 weeks', unit: 'cm', frequency: 'once', required: false, benchmark: { target: 15 } },
      ],
      outputs: [], possibleNextStages: ['vegetative'],
      alerts: ['Germination below 22°C is very slow and uneven — use a heat mat for consistent results'],
    },
    {
      id: 'vegetative', name: 'Vegetative & Flower Initiation (weeks 7–14)', order: 2, durationDays: 49, color: '#bbf7d0',
      inputs: [
        { id: 'grow-bags', label: 'Cocopeat Grow Bags (2 plants per bag)', unit: 'count', required: true },
        { id: 'nutrient', label: 'Growth Phase Nutrient Solution (EC 2.0–2.5)', unit: 'L', required: true },
        { id: 'strings', label: 'Hanging Strings for Vertical Training', unit: 'count', required: true },
      ],
      activities: [
        { id: 'transplant', name: 'Transplant at 6-week stage; 2 plants per grow bag', frequency: 'once' },
        { id: 'v-train', name: 'Train to "V" system: 2 stems per plant upward on strings', frequency: 'weekly' },
        { id: 'leaf-remove', name: 'Remove all leaves below first flower truss', frequency: 'weekly' },
        { id: 'crown-bud', name: 'Remove crown bud (first bud at fork) to promote even production', frequency: 'once' },
        { id: 'fertigation', name: 'Fertigate 4–6× daily; adjust EC by weather', frequency: 'daily' },
      ],
      measurements: [
        { id: 'stem-height', name: 'Stem Height', unit: 'cm', frequency: 'weekly', required: true, benchmark: { target: 80 } },
        { id: 'trusses', name: 'Trusses Set per Stem', unit: 'count', frequency: 'weekly', required: false },
        { id: 'ec', name: 'Drain EC', unit: 'mS/cm', frequency: 'daily', required: true, benchmark: { min: 3.5, max: 5.5 } },
      ],
      outputs: [], possibleNextStages: ['production'],
      alerts: ['Remove the crown bud at first branching — without this plants unbalance and early production is lost'],
    },
    {
      id: 'production', name: 'Continuous Production (weeks 14–50)', order: 3, durationDays: 252, color: '#4ade80',
      inputs: [
        { id: 'nutrient', label: 'Production Nutrient Solution (EC 2.5–3.0)', unit: 'L', required: true },
        { id: 'ipm-bio', label: 'Biological IPM (Encarsia, Amblyseius)', unit: 'count', required: true },
        { id: 'bumble-bee', label: 'Bumble Bee Hive for Pollination', unit: 'count', required: false },
      ],
      activities: [
        { id: 'harvest', name: 'Harvest peppers at full colour (red/yellow/orange) 2–3× per week', frequency: 'weekly' },
        { id: 'pollinate', name: 'Vibrate flowers with electric pollinator or bumble bee hive', frequency: 'daily' },
        { id: 'lower-leaf', name: 'Remove leaves below lowest developing truss weekly', frequency: 'weekly' },
        { id: 'ipm-release', name: 'Weekly bio-control releases: Encarsia for whitefly, Amblyseius for mite', frequency: 'weekly' },
        { id: 'nutrient-adjust', name: 'Adjust EC/pH twice daily based on weather and crop stage', frequency: 'daily' },
        { id: 'humidity', name: 'Maintain 65–75% RH — below 60% causes blossom drop', frequency: 'daily' },
      ],
      measurements: [
        { id: 'yield-m2', name: 'Weekly Yield per m²', unit: 'kg', frequency: 'weekly', required: true, benchmark: { target: 1.0 } },
        { id: 'fruit-wt', name: 'Average Fruit Weight', unit: 'g', frequency: 'weekly', required: false, benchmark: { target: 200 } },
        { id: 'grade-a', name: 'Grade A %', unit: 'percent', frequency: 'weekly', required: true, benchmark: { min: 70 } },
        { id: 'pest-pressure', name: 'Pest Pressure Score (1–5)', unit: 'score', frequency: 'weekly', required: false },
      ],
      outputs: [
        { materialTypeId: 'bell-pepper', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['production'],
      alerts: ['Pepper blossom drop occurs above 32°C or below 60% RH — critical to manage during hot days', 'Tuta absoluta and western flower thrips are key pests — monitor sticky traps weekly and release bio-controls proactively'],
    },
  ],
};

// ─── STRAWBERRY ──────────────────────────────────────────────────────────────
export const strawberryTemplate: ProductionTemplate = {
  id: 'strawberry',
  name: 'Strawberry (Greenhouse)',
  shortName: 'Strawberry',
  category: 'greenhouse',
  species: 'Fragaria × ananassa',
  purpose: 'Premium Fresh Berry',
  description: 'Everbearing or day-neutral strawberries in tabletop or substrate systems. High-value crop for direct sales, supermarkets and pick-your-own.',
  icon: '🍓',
  color: '#fce7f3',
  tags: ['strawberry', 'berry', 'greenhouse', 'premium', 'pick-your-own', 'tabletop'],
  materials: [
    { id: 'strawberry-plant', name: 'Certified Strawberry Plug Plant', unit: 'count', category: 'input' },
    { id: 'cocopeat', name: 'Cocopeat / Substrate Grow Bag', unit: 'count', category: 'input' },
    { id: 'strawberry-fert', name: 'Strawberry Nutrient Solution', unit: 'L', category: 'input' },
    { id: 'strawberry-fruit', name: 'Fresh Strawberry', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'yield-plant', name: 'Yield per Plant', unit: 'kg', benchmark: 1.2 },
    { id: 'fruit-wt', name: 'Average Fruit Weight', unit: 'g', benchmark: 28 },
    { id: 'brix', name: 'Brix (sweetness)', unit: 'percent', benchmark: 9 },
    { id: 'days-first', name: 'Days to First Harvest', unit: 'days', benchmark: 60 },
  ],
  stages: [
    {
      id: 'establishment', name: 'Planting & Establishment (weeks 1–6)', order: 1, durationDays: 42, color: '#fce7f3',
      inputs: [
        { id: 'plugs', label: 'Plug Plants (4 plants per grow bag, 40 cm apart)', unit: 'count', required: true },
        { id: 'bags', label: 'Cocopeat Grow Bags', unit: 'count', required: true },
        { id: 'starter-nutrient', label: 'Starter Solution (low EC, high P)', unit: 'L', required: true },
      ],
      activities: [
        { id: 'plant', name: 'Plant in grow bags at tabletop height; water immediately', frequency: 'once' },
        { id: 'crown-check', name: 'Ensure crown is at soil level — too deep = crown rot; too high = dries out', frequency: 'once' },
        { id: 'drip', name: 'Install drip irrigation; fertigate 4–6× daily', frequency: 'daily' },
        { id: 'flower-remove', name: 'Remove all flowers in first 3 weeks to build plant vigour', frequency: 'weekly' },
        { id: 'runner-remove', name: 'Remove all runners throughout the season', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'survival', name: 'Plant Survival % (week 2)', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 95 } },
        { id: 'crown-diameter', name: 'Crown Diameter at week 6', unit: 'mm', frequency: 'once', required: false, benchmark: { target: 12 } },
      ],
      outputs: [], possibleNextStages: ['production'],
      alerts: ['Removing all flowers for first 3 weeks doubles the final season yield — this is the most common skipped step'],
    },
    {
      id: 'production', name: 'Fruiting & Continuous Harvest (weeks 6–30)', order: 2, durationDays: 168, color: '#fda4af',
      inputs: [
        { id: 'production-nutrient', label: 'Fruiting Nutrient Solution (EC 1.5–2.0, high K)', unit: 'L', required: true },
        { id: 'bio-control', label: 'Bio-controls (Amblyseius cucumeris for Botrytis / thrips)', unit: 'count', required: false },
      ],
      activities: [
        { id: 'harvest', name: 'Harvest fully red fruits every 2–3 days in early morning', frequency: 'daily' },
        { id: 'remove-old', name: 'Remove old, damaged and diseased leaves weekly', frequency: 'weekly' },
        { id: 'botrytis', name: 'Scout for Botrytis (grey mould) weekly — critical in high humidity', frequency: 'weekly' },
        { id: 'bump-pollinate', name: 'Vibrate flowers daily for good fruit shape (or introduce bumble bees)', frequency: 'daily' },
        { id: 'ventilate', name: 'Ventilate aggressively at night to keep RH below 85%', frequency: 'daily' },
      ],
      measurements: [
        { id: 'yield-week', name: 'Weekly Yield per Plant', unit: 'g', frequency: 'weekly', required: true, benchmark: { target: 100 } },
        { id: 'brix', name: 'Average Brix', unit: 'percent', frequency: 'weekly', required: false, benchmark: { min: 9 } },
        { id: 'botrytis', name: 'Botrytis Incidence %', unit: 'percent', frequency: 'weekly', required: false, benchmark: { max: 3 } },
      ],
      outputs: [
        { materialTypeId: 'strawberry-fruit', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['production'],
      alerts: ['Botrytis thrives above 85% RH and spreads through contact — ventilate, space plants and remove affected fruit immediately', 'Never harvest unripe strawberries — unlike tomatoes they do NOT ripen after picking'],
    },
  ],
};
