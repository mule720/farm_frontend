// ─────────────────────────────────────────────────────────────────────────────
// Extra Horticulture Templates: Carrot, Kale/Spinach, Lettuce, Pumpkin,
// Watermelon, Eggplant, Garlic, Broccoli/Cauliflower
// ─────────────────────────────────────────────────────────────────────────────
import type { ProductionTemplate } from '../types';

// ─── CARROT ──────────────────────────────────────────────────────────────────
export const carrotTemplate: ProductionTemplate = {
  id: 'carrot',
  name: 'Carrot',
  shortName: 'Carrot',
  category: 'horticulture',
  species: 'Daucus carota',
  purpose: 'Fresh Root Vegetable',
  description: 'Deep-rooted root vegetable. 70–90 day cycle. Requires well-drained, stone-free, sandy-loam soil. High market demand for fresh and processing markets.',
  icon: '🥕',
  color: '#ffedd5',
  tags: ['carrot', 'root vegetable', 'horticulture', 'direct seeding', 'high value'],
  materials: [
    { id: 'carrot-seed', name: 'Carrot Seed', unit: 'g', category: 'input' },
    { id: 'compound', name: 'Compound Fertiliser', unit: 'kg', category: 'input' },
    { id: 'fresh-carrot', name: 'Fresh Carrots', unit: 'kg', category: 'output' },
    { id: 'carrot-tops', name: 'Carrot Tops (fodder)', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Yield', unit: 't/ha', benchmark: 25 },
    { id: 'marketable-pct', name: 'Marketable %', unit: 'percent', benchmark: 75 },
    { id: 'fork-pct', name: 'Forked/Deformed Roots %', unit: 'percent', benchmark: 10 },
  ],
  stages: [
    {
      id: 'soil-prep', name: 'Deep Bed Preparation & Seeding', order: 1, durationDays: 14, color: '#ffedd5',
      inputs: [
        { id: 'seed', label: 'Carrot Seed (2–4 kg/ha)', unit: 'g', required: true },
        { id: 'fert', label: 'Compound D (400 kg/ha)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'deep-till', name: 'Till soil 30 cm deep and remove all stones — forking guaranteed with stones', frequency: 'once' },
        { id: 'raised-beds', name: 'Form raised beds 1.2 m wide, 20 cm high', frequency: 'once' },
        { id: 'incorporate-fert', name: 'Incorporate basal fertiliser well into top 20 cm', frequency: 'once' },
        { id: 'sow', name: 'Broadcast or drill seed at 1 cm depth, 15 cm row spacing', frequency: 'once' },
        { id: 'mulch', name: 'Light mulch (dry grass) to prevent crusting over seeds', frequency: 'once' },
        { id: 'water', name: 'Gentle watering 2× daily until emergence', frequency: 'daily' },
      ],
      measurements: [
        { id: 'emergence', name: 'Emergence % (14 days)', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 60 } },
      ],
      outputs: [], possibleNextStages: ['growing'],
      alerts: ['Never add fresh manure — causes forked and hairy roots', 'Soil must be stone- and clod-free or roots will fork'],
    },
    {
      id: 'growing', name: 'Growing & Thinning (weeks 2–8)', order: 2, durationDays: 42, color: '#d1fae5',
      inputs: [
        { id: 'can', label: 'CAN Top Dressing (100 kg/ha at week 4)', unit: 'kg', required: true },
        { id: 'herbicide', label: 'Pre/Post-emergent Herbicide', unit: 'L', required: false },
      ],
      activities: [
        { id: 'thin', name: 'Thin to 5 cm spacing when 5 cm tall', frequency: 'once' },
        { id: 'weed', name: 'Weed carefully — roots very sensitive to cultivation damage', frequency: 'weekly' },
        { id: 'irrigate', name: 'Consistent irrigation — stop-start causes splitting', frequency: 'daily' },
        { id: 'top-dress', name: 'Top-dress with CAN at 4 weeks', frequency: 'once' },
        { id: 'scout-alternaria', name: 'Scout for Alternaria leaf blight weekly', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'stand', name: 'Plant Stand (plants/m²)', unit: 'count', frequency: 'once', required: false, benchmark: { target: 60 } },
        { id: 'leaf-health', name: 'Leaf Blight Incidence %', unit: 'percent', frequency: 'weekly', required: false },
      ],
      outputs: [], possibleNextStages: ['harvest'],
      alerts: ['Irregular irrigation causes split and cracked roots — maintain even soil moisture at all times'],
    },
    {
      id: 'harvest', name: 'Harvest & Grading (70–90 days)', order: 3, durationDays: 14, color: '#fde68a',
      inputs: [],
      activities: [
        { id: 'harvest-check', name: 'Check shoulder diameter (>2 cm = harvest-ready)', frequency: 'daily' },
        { id: 'loosen', name: 'Irrigate day before to loosen soil; pull or fork carefully', frequency: 'once' },
        { id: 'top', name: 'Twist off tops immediately after pulling', frequency: 'once' },
        { id: 'wash-grade', name: 'Wash, grade by size: jumbo/standard/small/processing', frequency: 'daily' },
        { id: 'cold-store', name: 'Store at 0–2°C in perforated bags for up to 4 weeks', frequency: 'once' },
      ],
      measurements: [
        { id: 'yield', name: 'Total Yield', unit: 't/ha', frequency: 'once', required: true, benchmark: { target: 25 } },
        { id: 'marketable', name: 'Marketable %', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 75 } },
      ],
      outputs: [
        { materialTypeId: 'fresh-carrot', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
        { materialTypeId: 'carrot-tops', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'B' },
      ],
      possibleNextStages: [],
      alerts: ['Leave tops on in field until packed — removed tops wilt rapidly in heat'],
    },
  ],
};

// ─── KALE & SPINACH ──────────────────────────────────────────────────────────
export const kaleTemplate: ProductionTemplate = {
  id: 'kale-spinach',
  name: 'Kale & Spinach (Leafy Greens)',
  shortName: 'Kale / Spinach',
  category: 'horticulture',
  species: 'Brassica oleracea / Spinacia oleracea',
  purpose: 'Fresh Leafy Greens',
  description: 'Fast-growing leafy greens for urban and peri-urban markets. Cut-and-come-again harvest; multiple harvests from one planting over 3–4 months.',
  icon: '🥬',
  color: '#d1fae5',
  tags: ['kale', 'spinach', 'leafy greens', 'cut-and-come-again', 'urban farming', 'nutrition'],
  materials: [
    { id: 'kale-seed', name: 'Kale / Spinach Seed', unit: 'g', category: 'input' },
    { id: 'compost', name: 'Compost / Organic Matter', unit: 'kg', category: 'input' },
    { id: 'kale-leaves', name: 'Fresh Kale / Spinach Leaves', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'yield-cycle', name: 'Total Yield per Cycle', unit: 'kg/m²', benchmark: 8 },
    { id: 'harvests', name: 'Number of Harvests', unit: 'count', benchmark: 6 },
    { id: 'days-first', name: 'Days to First Harvest', unit: 'days', benchmark: 35 },
  ],
  stages: [
    {
      id: 'establishment', name: 'Nursery & Transplanting', order: 1, durationDays: 21, color: '#d1fae5',
      inputs: [
        { id: 'seed', label: 'Seed (0.5–1 g/m² for nursery)', unit: 'g', required: true },
        { id: 'compost', label: 'Compost (5 kg/m²)', unit: 'kg', required: true },
        { id: 'compound', label: 'Compound D (50 g/m²)', unit: 'kg', required: false },
      ],
      activities: [
        { id: 'nursery', name: 'Sow in seedling trays or nursery bed; thin to 3 cm', frequency: 'once' },
        { id: 'transplant', name: 'Transplant 3–4 week seedlings at 30 × 30 cm spacing', frequency: 'once' },
        { id: 'water-daily', name: 'Water 2× daily until established (7 days)', frequency: 'daily' },
      ],
      measurements: [
        { id: 'transplant-survival', name: 'Transplant Survival %', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 90 } },
      ],
      outputs: [], possibleNextStages: ['production'],
      alerts: ['Transplant in the evening or shade first 2 days to prevent transplant shock'],
    },
    {
      id: 'production', name: 'Cut-and-Come-Again Production (weeks 5–16)', order: 2, durationDays: 84, color: '#6ee7b7',
      inputs: [
        { id: 'can', label: 'CAN Top Dressing (15 g/m² after each harvest)', unit: 'kg', required: true },
        { id: 'insecticide', label: 'Neem/pyrethrin for aphids', unit: 'L', required: false },
      ],
      activities: [
        { id: 'harvest-leaves', name: 'Harvest outer leaves at 5–7 cm (leave 4 inner leaves)', frequency: 'weekly' },
        { id: 'top-dress', name: 'Apply CAN after each harvest to stimulate re-growth', frequency: 'weekly' },
        { id: 'water', name: 'Irrigate to keep soil consistently moist', frequency: 'daily' },
        { id: 'aphid-control', name: 'Inspect for aphids and caterpillars weekly; spray if needed', frequency: 'weekly' },
        { id: 'remove-yellows', name: 'Remove yellowing outer leaves to prevent disease', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'yield-harvest', name: 'Yield per Harvest', unit: 'kg/m²', frequency: 'weekly', required: true, benchmark: { target: 1.2 } },
        { id: 'leaf-quality', name: 'Leaf Quality Score (1–5)', unit: 'score', frequency: 'weekly', required: false },
        { id: 'pest-incidence', name: 'Aphid/Caterpillar Incidence %', unit: 'percent', frequency: 'weekly', required: false, benchmark: { max: 5 } },
      ],
      outputs: [
        { materialTypeId: 'kale-leaves', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['production'],
      alerts: ['Never strip more than 50% of leaves per harvest — plants need leaves to photosynthesise and re-grow', 'Aphid colonies multiply rapidly — inspect the underside of leaves weekly'],
    },
  ],
};

// ─── WATERMELON ──────────────────────────────────────────────────────────────
export const watermelonTemplate: ProductionTemplate = {
  id: 'watermelon',
  name: 'Watermelon',
  shortName: 'Watermelon',
  category: 'horticulture',
  species: 'Citrullus lanatus',
  purpose: 'Fresh Fruit — High-Value Summer Crop',
  description: 'High-value warm-season vine crop. 75–90 days from transplant. Requires hot, sunny conditions and good pollination. Very popular street food fruit.',
  icon: '🍉',
  color: '#d1fae5',
  tags: ['watermelon', 'cucurbit', 'fruit', 'hot weather', 'summer', 'high value'],
  materials: [
    { id: 'wm-seed', name: 'Watermelon Seed (hybrid)', unit: 'g', category: 'input' },
    { id: 'compound', name: 'Compound Fertiliser', unit: 'kg', category: 'input' },
    { id: 'wm-fruit', name: 'Whole Watermelon', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Yield', unit: 't/ha', benchmark: 30 },
    { id: 'avg-fruit-wt', name: 'Average Fruit Weight', unit: 'kg', benchmark: 8 },
    { id: 'fruits-plant', name: 'Fruits per Plant', unit: 'count', benchmark: 2.5 },
    { id: 'brix', name: 'Sugar Content (Brix)', unit: 'percent', benchmark: 10 },
  ],
  stages: [
    {
      id: 'seedling', name: 'Nursery & Transplanting', order: 1, durationDays: 18, color: '#d1fae5',
      inputs: [
        { id: 'seed', label: 'Hybrid Seed (1–2 kg/ha)', unit: 'g', required: true },
      ],
      activities: [
        { id: 'sow-trays', name: 'Sow in seedling trays; germinate at 25–30°C', frequency: 'once' },
        { id: 'harden-off', name: 'Harden off seedlings before transplanting (days 10–14)', frequency: 'daily' },
        { id: 'transplant', name: 'Transplant 14–16 day seedlings at 2 × 1 m spacing', frequency: 'once' },
        { id: 'shade', name: 'Shade transplants for 3 days with crop netting', frequency: 'once' },
      ],
      measurements: [
        { id: 'germination', name: 'Germination % (day 5)', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 90 } },
      ],
      outputs: [], possibleNextStages: ['vine-growth'],
      alerts: ['Watermelon does not tolerate root disturbance — use seedling trays, not bare-root'],
    },
    {
      id: 'vine-growth', name: 'Vine Development & Pollination (weeks 3–6)', order: 2, durationDays: 28, color: '#bbf7d0',
      inputs: [
        { id: 'compound', label: 'Compound D (side dress at 2 WAT)', unit: 'kg', required: true },
        { id: 'mulch', label: 'Black Plastic Mulch or Organic Mulch', unit: 'm²', required: false },
      ],
      activities: [
        { id: 'train-vines', name: 'Train vines away from centre in star pattern', frequency: 'weekly' },
        { id: 'pollinator', name: 'Ensure bees or hand-pollinate female flowers in early morning', frequency: 'daily' },
        { id: 'weed', name: 'Weed before vines spread; no cultivation after', frequency: 'weekly' },
        { id: 'male-female', name: 'Mark female flowers (small fruit behind flower) — confirm set', frequency: 'daily' },
        { id: 'fungicide', name: 'Preventive spray for powdery mildew / downy mildew', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'flowers-female', name: 'Female Flowers per Plant', unit: 'count', frequency: 'weekly', required: false, benchmark: { target: 4 } },
        { id: 'fruit-set', name: 'Fruit Set per Plant', unit: 'count', frequency: 'weekly', required: true, benchmark: { target: 3 } },
      ],
      outputs: [], possibleNextStages: ['fruit-fill'],
      alerts: ['Female flowers are only open for ONE morning — pollination must occur before 9 AM', 'No bees = no fruit — keep beehive near field during flowering or hand-pollinate'],
    },
    {
      id: 'fruit-fill', name: 'Fruit Fill & Maturation (weeks 6–11)', order: 3, durationDays: 35, color: '#4ade80',
      inputs: [
        { id: 'potassium', label: 'Potassium Sulphate (at fruit set — improves Brix)', unit: 'kg', required: false },
      ],
      activities: [
        { id: 'thin-fruit', name: 'Thin to 2–3 fruits per plant at tennis-ball size', frequency: 'once' },
        { id: 'turn-fruit', name: 'Turn fruits gently once to prevent white belly patches', frequency: 'weekly' },
        { id: 'reduce-water', name: 'Reduce irrigation in final 2 weeks to increase sugar', frequency: 'weekly' },
        { id: 'maturity-check', name: 'Check: curly tendril near fruit dried; hollow knock sound; yellow spot', frequency: 'daily' },
      ],
      measurements: [
        { id: 'fruit-wt', name: 'Estimated Fruit Weight', unit: 'kg', frequency: 'weekly', required: false, benchmark: { target: 8 } },
        { id: 'brix', name: 'Brix (hand refractometer on juice)', unit: 'percent', frequency: 'weekly', required: false, benchmark: { min: 10 } },
      ],
      outputs: [
        { materialTypeId: 'wm-fruit', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Do NOT harvest based on calendar — check the three maturity indicators together', 'Overwatering in the last 2 weeks dilutes sugar and causes fruit cracking'],
    },
  ],
};

// ─── PUMPKIN / BUTTERNUT ─────────────────────────────────────────────────────
export const pumpkinTemplate: ProductionTemplate = {
  id: 'pumpkin-butternut',
  name: 'Pumpkin & Butternut',
  shortName: 'Pumpkin',
  category: 'horticulture',
  species: 'Cucurbita maxima / moschata',
  purpose: 'Fresh Fruit — Food Security & Market',
  description: 'Hardy cucurbit producing large, long-shelf-life fruit. Low-input, drought-tolerant once established. Popular for both subsistence and market.',
  icon: '🎃',
  color: '#ffedd5',
  tags: ['pumpkin', 'butternut', 'cucurbit', 'long shelf life', 'drought tolerant'],
  materials: [
    { id: 'pump-seed', name: 'Pumpkin / Butternut Seed', unit: 'g', category: 'input' },
    { id: 'pump-fruit', name: 'Whole Pumpkin / Butternut', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Yield', unit: 't/ha', benchmark: 20 },
    { id: 'fruits-plant', name: 'Fruits per Plant', unit: 'count', benchmark: 4 },
    { id: 'avg-fruit-wt', name: 'Average Fruit Weight', unit: 'kg', benchmark: 3 },
  ],
  stages: [
    {
      id: 'planting', name: 'Planting & Establishment', order: 1, durationDays: 21, color: '#ffedd5',
      inputs: [
        { id: 'seed', label: 'Seed (2–4 kg/ha)', unit: 'g', required: true },
        { id: 'compost', label: 'Compost or Kraal Manure (5 kg/hole)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'dig-holes', name: 'Dig planting holes 30 cm deep, 3 × 2 m spacing; fill with compost', frequency: 'once' },
        { id: 'plant', name: 'Plant 3 seeds per hole 2 cm deep; thin to 1 plant after emergence', frequency: 'once' },
        { id: 'water', name: 'Water twice weekly until vines spread', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'emergence', name: 'Emergence % (day 7)', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 80 } },
      ],
      outputs: [], possibleNextStages: ['vine-growth'],
      alerts: ['Pumpkin is frost-sensitive — do not plant until all frost risk has passed'],
    },
    {
      id: 'vine-growth', name: 'Vine Growth & Pollination (weeks 3–7)', order: 2, durationDays: 28, color: '#fef9c3',
      inputs: [],
      activities: [
        { id: 'weed', name: 'Weed before vines cover ground', frequency: 'weekly' },
        { id: 'pollinate', name: 'Ensure good bee activity; hand-pollinate if low bee numbers', frequency: 'daily' },
        { id: 'powdery', name: 'Scout for powdery mildew on leaves', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'fruit-set', name: 'Fruit Set per Plant', unit: 'count', frequency: 'weekly', required: false },
      ],
      outputs: [], possibleNextStages: ['harvest'],
      alerts: ['Powdery mildew kills leaves early and reduces fruit fill — spray at first sign'],
    },
    {
      id: 'harvest', name: 'Maturation & Harvest (90–120 days)', order: 3, durationDays: 21, color: '#fde68a',
      inputs: [],
      activities: [
        { id: 'check-skin', name: 'Check skin — hard and dull = mature (fingernail does not penetrate)', frequency: 'daily' },
        { id: 'harvest', name: 'Cut stem leaving 5 cm attached; do not carry by stem', frequency: 'once' },
        { id: 'cure', name: 'Cure in shade 7 days to harden skin for long storage', frequency: 'daily' },
        { id: 'store', name: 'Store in cool, dry, ventilated shed — 3–6 months shelf life', frequency: 'once' },
      ],
      measurements: [
        { id: 'yield', name: 'Yield', unit: 't/ha', frequency: 'once', required: true, benchmark: { target: 20 } },
        { id: 'avg-wt', name: 'Avg Fruit Weight', unit: 'kg', frequency: 'once', required: false, benchmark: { target: 3 } },
      ],
      outputs: [
        { materialTypeId: 'pump-fruit', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Stems broken at harvest dramatically reduce shelf life — always leave 5 cm of stem on fruit'],
    },
  ],
};

// ─── GARLIC ──────────────────────────────────────────────────────────────────
export const garlicTemplate: ProductionTemplate = {
  id: 'garlic',
  name: 'Garlic',
  shortName: 'Garlic',
  category: 'horticulture',
  species: 'Allium sativum',
  purpose: 'Culinary Bulb — Fresh & Processed',
  description: 'Long-season (6–8 months) high-value allium. Planted from cloves; harvested as cured bulbs. Strong demand for fresh, dried, and processed products.',
  icon: '🧄',
  color: '#fef9c3',
  tags: ['garlic', 'allium', 'bulb', 'spice', 'high value', 'curing'],
  materials: [
    { id: 'garlic-cloves', name: 'Seed Garlic Cloves', unit: 'kg', category: 'input' },
    { id: 'compound', name: 'Compound Fertiliser', unit: 'kg', category: 'input' },
    { id: 'garlic-bulb', name: 'Cured Garlic Bulbs', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Bulb Yield', unit: 't/ha', benchmark: 8 },
    { id: 'bulb-size', name: 'Avg Bulb Diameter', unit: 'mm', benchmark: 50 },
    { id: 'marketable-pct', name: 'Marketable %', unit: 'percent', benchmark: 80 },
  ],
  stages: [
    {
      id: 'planting', name: 'Clove Planting', order: 1, durationDays: 21, color: '#fef9c3',
      inputs: [
        { id: 'cloves', label: 'Seed Cloves (600–800 kg/ha — largest outer cloves only)', unit: 'kg', required: true },
        { id: 'compound', label: 'Compound D (400 kg/ha)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'select-cloves', name: 'Select largest outer cloves only — inner cloves produce small bulbs', frequency: 'once' },
        { id: 'dip', name: 'Dip cloves in fungicide solution for 30 min before planting', frequency: 'once' },
        { id: 'plant', name: 'Plant pointed end up, 10 cm deep, 15 × 30 cm spacing', frequency: 'once' },
        { id: 'check-sprout', name: 'Check sprouting at 2 weeks — replace any gaps', frequency: 'once' },
      ],
      measurements: [
        { id: 'sprouting', name: 'Sprouting % (day 14)', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 85 } },
      ],
      outputs: [], possibleNextStages: ['vegetative'],
      alerts: ['Only plant the largest outer cloves — small cloves produce small bulbs regardless of management'],
    },
    {
      id: 'vegetative', name: 'Vegetative Growth (months 2–5)', order: 2, durationDays: 90, color: '#d1fae5',
      inputs: [
        { id: 'can', label: 'CAN Top Dressing (200 kg/ha split twice)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'weed', name: 'Weed at 3, 6 and 10 weeks — garlic is a poor weed competitor', frequency: 'weekly' },
        { id: 'top-dress', name: 'Apply CAN at weeks 3 and 7', frequency: 'once' },
        { id: 'irrigate', name: 'Keep evenly moist — avoid waterlogging (causes neck rot)', frequency: 'weekly' },
        { id: 'scape', name: 'Remove flower scapes (hardneck types) when they curl', frequency: 'weekly' },
        { id: 'white-rot', name: 'Scout for white rot (fluffy white base) — remove affected plants', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'leaf-count', name: 'Leaf Count (indicates bulb size potential)', unit: 'count', frequency: 'monthly', required: false, benchmark: { target: 10 } },
        { id: 'white-rot', name: 'White Rot Incidence %', unit: 'percent', frequency: 'monthly', required: false, benchmark: { max: 2 } },
      ],
      outputs: [], possibleNextStages: ['harvest'],
      alerts: ['Stop N fertiliser 6 weeks before harvest — late N delays maturity and causes thick necks'],
    },
    {
      id: 'harvest', name: 'Harvest & Curing (months 6–8)', order: 3, durationDays: 28, color: '#fde68a',
      inputs: [],
      activities: [
        { id: 'maturity', name: 'Harvest when 50–75% of leaves are yellow-brown', frequency: 'daily' },
        { id: 'dig', name: 'Dig or pull carefully — avoid bruising wrappers', frequency: 'once' },
        { id: 'cure', name: 'Cure in shade with good airflow for 3–4 weeks at 28–32°C', frequency: 'daily' },
        { id: 'trim', name: 'Trim roots and tops after curing; grade by size', frequency: 'once' },
        { id: 'store', name: 'Store in mesh bags in cool, dry, ventilated place — 6–8 months', frequency: 'once' },
      ],
      measurements: [
        { id: 'yield', name: 'Cured Bulb Yield', unit: 't/ha', frequency: 'once', required: true, benchmark: { target: 8 } },
        { id: 'bulb-dia', name: 'Average Bulb Diameter', unit: 'mm', frequency: 'once', required: false, benchmark: { target: 50 } },
      ],
      outputs: [
        { materialTypeId: 'garlic-bulb', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Inadequate curing is the most common cause of garlic rotting in storage — minimum 3 weeks at 28–32°C with airflow'],
    },
  ],
};

// ─── BROCCOLI & CAULIFLOWER ───────────────────────────────────────────────────
export const broccoliTemplate: ProductionTemplate = {
  id: 'broccoli-cauliflower',
  name: 'Broccoli & Cauliflower',
  shortName: 'Brassica',
  category: 'horticulture',
  species: 'Brassica oleracea var. italica / botrytis',
  purpose: 'Premium Fresh Vegetable',
  description: 'Cool-season brassicas for high-value fresh and export markets. 70–90 days from transplant. Requires consistent moisture and temperature management.',
  icon: '🥦',
  color: '#d1fae5',
  tags: ['broccoli', 'cauliflower', 'brassica', 'cool season', 'premium', 'export'],
  materials: [
    { id: 'brassica-seed', name: 'Broccoli / Cauliflower Seed (hybrid)', unit: 'g', category: 'input' },
    { id: 'compound', name: 'Compound D Fertiliser', unit: 'kg', category: 'input' },
    { id: 'head', name: 'Fresh Broccoli / Cauliflower Head', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Head Yield', unit: 't/ha', benchmark: 18 },
    { id: 'head-wt', name: 'Average Head Weight', unit: 'kg', benchmark: 1.2 },
    { id: 'marketable-pct', name: 'Marketable %', unit: 'percent', benchmark: 80 },
  ],
  stages: [
    {
      id: 'nursery', name: 'Nursery (3–4 weeks)', order: 1, durationDays: 28, color: '#d1fae5',
      inputs: [
        { id: 'seed', label: 'Hybrid Seed (200–300 g/ha)', unit: 'g', required: true },
        { id: 'nursery-mix', label: 'Sterile Seedling Mix', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'sow', name: 'Sow in seedling trays (1 seed per cell)', frequency: 'once' },
        { id: 'water', name: 'Mist water 2× daily', frequency: 'daily' },
        { id: 'harden', name: 'Harden off outdoors 5 days before transplanting', frequency: 'daily' },
      ],
      measurements: [
        { id: 'germination', name: 'Germination % (day 7)', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 90 } },
      ],
      outputs: [], possibleNextStages: ['vegetative'],
      alerts: ['Brassica seedlings are very prone to damping-off — use sterile medium and avoid overwatering'],
    },
    {
      id: 'vegetative', name: 'Vegetative Growth (weeks 4–8)', order: 2, durationDays: 28, color: '#bbf7d0',
      inputs: [
        { id: 'compound', label: 'Compound D (400 kg/ha)', unit: 'kg', required: true },
        { id: 'can', label: 'CAN Top Dressing (200 kg/ha at week 4)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'transplant', name: 'Transplant 3–4 week seedlings at 50 × 40 cm', frequency: 'once' },
        { id: 'weed', name: 'Weed at 2 and 5 weeks after transplanting', frequency: 'weekly' },
        { id: 'caterpillar', name: 'Scout for diamond-back moth and cabbage white caterpillars weekly', frequency: 'weekly' },
        { id: 'top-dress', name: 'Apply CAN at 4 weeks after transplanting', frequency: 'once' },
        { id: 'blanch-cauli', name: 'Tie outer leaves over cauliflower curd when head is 5 cm (for white curd)', frequency: 'once' },
      ],
      measurements: [
        { id: 'plant-height', name: 'Plant Height', unit: 'cm', frequency: 'weekly', required: false },
        { id: 'caterpillar', name: 'Caterpillar Infestation %', unit: 'percent', frequency: 'weekly', required: false, benchmark: { max: 5 } },
      ],
      outputs: [], possibleNextStages: ['heading'],
      alerts: ['Diamond-back moth is resistant to many insecticides — rotate actives and use bio-controls (BT)'],
    },
    {
      id: 'heading', name: 'Head Development & Harvest (weeks 8–12)', order: 3, durationDays: 28, color: '#86efac',
      inputs: [],
      activities: [
        { id: 'check-head', name: 'Check head daily when forming — harvest window is narrow', frequency: 'daily' },
        { id: 'harvest-broc', name: 'Harvest broccoli when head is tight and dark green (before yellow flower buds)', frequency: 'daily' },
        { id: 'harvest-cauli', name: 'Harvest cauliflower when curd is firm, white and 15–20 cm across', frequency: 'daily' },
        { id: 'cold-chain', name: 'Pre-cool to 1°C within 4 hours of harvest — shelf life depends on it', frequency: 'daily' },
      ],
      measurements: [
        { id: 'yield', name: 'Head Yield', unit: 't/ha', frequency: 'once', required: true, benchmark: { target: 18 } },
        { id: 'head-weight', name: 'Average Head Weight', unit: 'kg', frequency: 'once', required: true, benchmark: { target: 1.2 } },
        { id: 'marketable', name: 'Marketable %', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 80 } },
      ],
      outputs: [
        { materialTypeId: 'head', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Broccoli heads that open into yellow flowers CANNOT be sold — harvest window is 2–4 days, check daily'],
    },
  ],
};

// ─── EGGPLANT / BRINJAL ──────────────────────────────────────────────────────
export const eggplantTemplate: ProductionTemplate = {
  id: 'eggplant',
  name: 'Eggplant (Brinjal)',
  shortName: 'Eggplant',
  category: 'horticulture',
  species: 'Solanum melongena',
  purpose: 'Fresh Fruit Vegetable',
  description: 'Warm-season vegetable with long bearing period (4–6 months continuous harvest). Popular in African and Asian markets. Tolerates heat well.',
  icon: '🍆',
  color: '#ede9fe',
  tags: ['eggplant', 'brinjal', 'aubergine', 'warm season', 'continuous harvest'],
  materials: [
    { id: 'eg-seed', name: 'Eggplant Seed', unit: 'g', category: 'input' },
    { id: 'compound', name: 'Compound Fertiliser', unit: 'kg', category: 'input' },
    { id: 'eg-fruit', name: 'Fresh Eggplant', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Total Cycle Yield', unit: 't/ha', benchmark: 30 },
    { id: 'harvest-freq', name: 'Harvest Frequency', unit: 'days', benchmark: 7 },
    { id: 'marketable-pct', name: 'Marketable %', unit: 'percent', benchmark: 80 },
  ],
  stages: [
    {
      id: 'nursery', name: 'Nursery (5–6 weeks)', order: 1, durationDays: 35, color: '#ede9fe',
      inputs: [
        { id: 'seed', label: 'Seed (250–300 g/ha)', unit: 'g', required: true },
        { id: 'nursery-fert', label: 'Nursery Fertiliser (CAN spray)', unit: 'kg', required: false },
      ],
      activities: [
        { id: 'sow', name: 'Sow in seed trays; germinate at 25–30°C', frequency: 'once' },
        { id: 'prick-out', name: 'Prick out to individual pots at 4-leaf stage', frequency: 'once' },
        { id: 'harden', name: 'Harden off for 5 days before transplanting', frequency: 'daily' },
      ],
      measurements: [
        { id: 'germination', name: 'Germination % (day 10)', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 80 } },
      ],
      outputs: [], possibleNextStages: ['vegetative'],
      alerts: ['Eggplant is very sensitive to cold — soil must be above 18°C at transplant'],
    },
    {
      id: 'vegetative', name: 'Vegetative & First Flowering (weeks 6–10)', order: 2, durationDays: 30, color: '#ddd6fe',
      inputs: [
        { id: 'compound', label: 'Compound D (400 kg/ha)', unit: 'kg', required: true },
        { id: 'can', label: 'CAN Top Dressing at 4 WAT', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'transplant', name: 'Transplant 5-week seedlings at 75 × 60 cm', frequency: 'once' },
        { id: 'stake', name: 'Stake plants at 30 cm with 1 m bamboo stake', frequency: 'once' },
        { id: 'weed', name: 'Weed twice in the first 4 weeks', frequency: 'weekly' },
        { id: 'aphid', name: 'Scout for aphids, spider mites and fruit borers weekly', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'flower-count', name: 'Flowers per Plant', unit: 'count', frequency: 'weekly', required: false },
      ],
      outputs: [], possibleNextStages: ['production'],
      alerts: ['Fruit and shoot borer is devastating — spray at first flower; never delay'],
    },
    {
      id: 'production', name: 'Continuous Fruiting (months 2–5)', order: 3, durationDays: 90, color: '#a78bfa',
      inputs: [
        { id: 'can', label: 'CAN (15 g/plant monthly)', unit: 'kg', required: true },
        { id: 'insecticide', label: 'Rotation insecticides for fruit borer', unit: 'L', required: true },
      ],
      activities: [
        { id: 'harvest', name: 'Harvest fruits weekly when glossy and full-sized (immature = better quality)', frequency: 'weekly' },
        { id: 'prune', name: 'Remove diseased or damaged branches monthly', frequency: 'monthly' },
        { id: 'side-dress', name: 'Side-dress CAN monthly to sustain productivity', frequency: 'monthly' },
        { id: 'fruit-borer', name: 'Spray insecticide on rotation every 2 weeks for fruit borer', frequency: 'weekly' },
        { id: 'mite', name: 'Spray acaricide if spider mites visible (bronze colour on leaves)', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'yield-week', name: 'Weekly Yield per Plant', unit: 'kg', frequency: 'weekly', required: true, benchmark: { target: 0.8 } },
        { id: 'borer-incidence', name: 'Fruit Borer Incidence %', unit: 'percent', frequency: 'weekly', required: false, benchmark: { max: 5 } },
      ],
      outputs: [
        { materialTypeId: 'eg-fruit', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['production'],
      alerts: ['Overmature eggplant turns dull, seeds harden and quality drops rapidly — harvest every 7 days'],
    },
  ],
};
