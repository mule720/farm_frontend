// ─────────────────────────────────────────────────────────────────────────────
// Additional Crop Templates: Wheat, Finger Millet, Pearl Millet, Cotton,
// Sugarcane, Irish Potato, Yam, Cowpea/Beans, Barley
// ─────────────────────────────────────────────────────────────────────────────
import type { ProductionTemplate } from '../types';

// ─── WHEAT ───────────────────────────────────────────────────────────────────
export const wheatTemplate: ProductionTemplate = {
  id: 'wheat',
  name: 'Wheat',
  shortName: 'Wheat',
  category: 'crops',
  species: 'Triticum aestivum',
  purpose: 'Grain for Milling & Bread',
  description: 'Bread wheat production for grain. Suited to cooler, highland areas. 4–5 month cycle with high milling value.',
  icon: '🌾',
  color: '#fef3c7',
  tags: ['wheat', 'cereal', 'grain', 'milling', 'highland', 'bread'],
  materials: [
    { id: 'wheat-seed', name: 'Certified Wheat Seed', unit: 'kg', category: 'input' },
    { id: 'basal-fert', name: 'Basal Fertiliser (D-compound)', unit: 'kg', category: 'input' },
    { id: 'top-dress', name: 'Top Dressing (CAN)', unit: 'kg', category: 'input' },
    { id: 'wheat-grain', name: 'Wheat Grain', unit: 'kg', category: 'output' },
    { id: 'wheat-straw', name: 'Wheat Straw', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Grain Yield', unit: 'kg/ha', benchmark: 3500 },
    { id: 'test-weight', name: 'Test Weight', unit: 'kg/hl', benchmark: 78 },
    { id: 'protein', name: 'Grain Protein %', unit: 'percent', benchmark: 12 },
    { id: 'harvest-index', name: 'Harvest Index', unit: 'ratio', benchmark: 0.45 },
  ],
  stages: [
    {
      id: 'land-prep', name: 'Land Preparation & Planting', order: 1, durationDays: 21, color: '#fef9c3',
      inputs: [
        { id: 'seed', label: 'Certified Seed (120–150 kg/ha)', unit: 'kg', required: true },
        { id: 'basal', label: 'Basal Fertiliser D-Compound (200 kg/ha)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'plough', name: 'Plough to 20 cm depth', frequency: 'once' },
        { id: 'disc', name: 'Disc harrow twice to fine tilth', frequency: 'once' },
        { id: 'drill', name: 'Drill seed at 15–18 cm row spacing with basal fertiliser', frequency: 'once' },
        { id: 'emergence', name: 'Check emergence (7–10 days)', frequency: 'daily' },
      ],
      measurements: [
        { id: 'emergence-pct', name: 'Emergence % (plant count)', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 80 } },
        { id: 'soil-moisture', name: 'Soil Moisture (sowing depth)', unit: 'score', frequency: 'daily', required: false },
      ],
      outputs: [], possibleNextStages: ['vegetative'],
      alerts: ['Seed rate is critical — too sparse reduces yield, too dense increases disease risk', 'Do not sow into dry soil — wait for opening rains or irrigate before drilling'],
    },
    {
      id: 'vegetative', name: 'Vegetative & Tillering', order: 2, durationDays: 45, color: '#d1fae5',
      inputs: [
        { id: 'top-dress', label: 'Top Dressing CAN (150–200 kg/ha) at tillering', unit: 'kg', required: true },
        { id: 'herbicide', label: 'Broadleaf Herbicide (if needed)', unit: 'L', required: false },
      ],
      activities: [
        { id: 'top-dress', name: 'Apply CAN at Zadoks GS 25–30 (tillering)', frequency: 'once' },
        { id: 'weed-control', name: 'Spray broadleaf weeds at GS 13–25', frequency: 'once' },
        { id: 'rust-scout', name: 'Scout for leaf rust and stem rust weekly', frequency: 'weekly' },
        { id: 'aphid', name: 'Check for Russian wheat aphid and BYDV vectors', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'tillers', name: 'Tillers per Plant', unit: 'count', frequency: 'weekly', required: false, benchmark: { target: 4 } },
        { id: 'crop-cover', name: 'Crop Ground Cover %', unit: 'percent', frequency: 'weekly', required: false },
        { id: 'disease-rating', name: 'Rust Severity (0–9 scale)', unit: 'score', frequency: 'weekly', required: false },
      ],
      outputs: [], possibleNextStages: ['heading'],
      alerts: ['Stem rust can destroy 70% of yield if not sprayed at first sign — act within 48 hours'],
    },
    {
      id: 'heading', name: 'Heading & Grain Fill', order: 3, durationDays: 45, color: '#fde68a',
      inputs: [
        { id: 'fungicide', label: 'Fungicide (for Septoria / Fusarium head blight)', unit: 'L', required: false },
      ],
      activities: [
        { id: 'head-check', name: 'Monitor ear emergence and flag for spray timing', frequency: 'daily' },
        { id: 'fhb-spray', name: 'Spray fungicide at GS 65 (50% heading) for FHB control', frequency: 'once' },
        { id: 'bird-scare', name: 'Bird scarers active during grain fill', frequency: 'daily' },
      ],
      measurements: [
        { id: 'ears-m2', name: 'Ear Count per m²', unit: 'count', frequency: 'once', required: false, benchmark: { target: 350 } },
        { id: 'grain-fill', name: 'Grain Fill Stage (milky/dough/ripe)', unit: 'score', frequency: 'weekly', required: true },
        { id: 'disease', name: 'Septoria / FHB Severity', unit: 'percent', frequency: 'weekly', required: false },
      ],
      outputs: [], possibleNextStages: ['harvest'],
      alerts: ['Spray FHB fungicide at heading not after — it is a preventative, not curative'],
    },
    {
      id: 'harvest', name: 'Harvest', order: 4, durationDays: 14, color: '#f59e0b',
      inputs: [],
      activities: [
        { id: 'moisture-check', name: 'Check grain moisture — harvest at 13–14% MC', frequency: 'daily' },
        { id: 'combine', name: 'Combine at 14% MC or below', frequency: 'once' },
        { id: 'dry', name: 'Dry if MC above 14% before storage', frequency: 'once' },
        { id: 'store', name: 'Store in ventilated metal silo or bags with hermetic seal', frequency: 'once' },
      ],
      measurements: [
        { id: 'moisture', name: 'Grain Moisture Content', unit: 'percent', frequency: 'daily', required: true, benchmark: { max: 14 } },
        { id: 'yield', name: 'Grain Yield', unit: 'kg/ha', frequency: 'once', required: true, benchmark: { target: 3500 } },
        { id: 'test-weight', name: 'Test Weight', unit: 'kg/hl', frequency: 'once', required: false, benchmark: { target: 78 } },
      ],
      outputs: [
        { materialTypeId: 'wheat-grain', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
        { materialTypeId: 'wheat-straw', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'B' },
      ],
      possibleNextStages: [],
      alerts: ['Harvest within 3–5 days of ripening or shattering and weather losses mount rapidly'],
    },
  ],
};

// ─── FINGER MILLET ───────────────────────────────────────────────────────────
export const fingerMilletTemplate: ProductionTemplate = {
  id: 'finger-millet',
  name: 'Finger Millet (Rapoko)',
  shortName: 'Finger Millet',
  category: 'crops',
  species: 'Eleusine coracana',
  purpose: 'Grain — Food Security & Traditional Beer',
  description: 'Drought-tolerant, nutritious small grain. High calcium content; stores for years without pests. Cornerstone of smallholder food security in southern and east Africa.',
  icon: '🌿',
  color: '#fef3c7',
  tags: ['finger millet', 'rapoko', 'small grain', 'drought tolerant', 'food security', 'traditional'],
  materials: [
    { id: 'fm-seed', name: 'Finger Millet Seed', unit: 'kg', category: 'input' },
    { id: 'fm-compound', name: 'Compound Fertiliser', unit: 'kg', category: 'input' },
    { id: 'fm-grain', name: 'Finger Millet Grain', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Grain Yield', unit: 'kg/ha', benchmark: 1200 },
    { id: 'harvest-index', name: 'Harvest Index', unit: 'ratio', benchmark: 0.30 },
  ],
  stages: [
    {
      id: 'nursery', name: 'Nursery & Transplanting', order: 1, durationDays: 35, color: '#fef9c3',
      inputs: [
        { id: 'seed', label: 'Seed (5–8 kg/ha for nursery)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'nursery', name: 'Sow in nursery beds, 1 m wide, thin to 5 cm apart', frequency: 'once' },
        { id: 'water', name: 'Water nursery daily', frequency: 'daily' },
        { id: 'transplant', name: 'Transplant 3–4 week seedlings at 20 × 20 cm spacing', frequency: 'once' },
      ],
      measurements: [
        { id: 'seedling-height', name: 'Seedling Height', unit: 'cm', frequency: 'weekly', required: false },
        { id: 'transplant-survival', name: 'Transplant Survival %', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 90 } },
      ],
      outputs: [], possibleNextStages: ['vegetative'],
      alerts: ['Transplant in the evening or on a cloudy day to reduce transplant shock'],
    },
    {
      id: 'vegetative', name: 'Vegetative Growth', order: 2, durationDays: 45, color: '#d1fae5',
      inputs: [
        { id: 'compound', label: 'Compound D (200 kg/ha)', unit: 'kg', required: true },
        { id: 'can', label: 'Top Dressing CAN (100 kg/ha at 4 weeks)', unit: 'kg', required: false },
      ],
      activities: [
        { id: 'weed', name: 'Weed at 2 and 5 weeks after transplanting', frequency: 'once' },
        { id: 'fertilise', name: 'Apply basal fertiliser at transplanting, top-dress at 4 weeks', frequency: 'once' },
        { id: 'gap-fill', name: 'Fill gaps within 7 days of transplanting', frequency: 'once' },
      ],
      measurements: [
        { id: 'plant-height', name: 'Plant Height', unit: 'cm', frequency: 'weekly', required: false },
        { id: 'weed-cover', name: 'Weed Ground Cover %', unit: 'percent', frequency: 'weekly', required: false, benchmark: { max: 10 } },
      ],
      outputs: [], possibleNextStages: ['harvest'],
      alerts: ['Striga (witchweed) is a major threat in some areas — plant trap crops to reduce seed bank'],
    },
    {
      id: 'harvest', name: 'Harvest & Threshing', order: 3, durationDays: 21, color: '#f59e0b',
      inputs: [],
      activities: [
        { id: 'harvest', name: 'Harvest by cutting heads when 80% are ripe-brown', frequency: 'once' },
        { id: 'dry', name: 'Dry cut heads on tarpaulins for 3–5 days', frequency: 'daily' },
        { id: 'thresh', name: 'Thresh by beating or use threshing machine', frequency: 'once' },
        { id: 'winnow', name: 'Winnow to remove chaff', frequency: 'once' },
        { id: 'store', name: 'Store in grain bags or clay pots — pest-resistant naturally', frequency: 'once' },
      ],
      measurements: [
        { id: 'yield', name: 'Grain Yield', unit: 'kg/ha', frequency: 'once', required: true, benchmark: { target: 1200 } },
        { id: 'moisture', name: 'Grain Moisture at Storage', unit: 'percent', frequency: 'once', required: true, benchmark: { max: 12 } },
      ],
      outputs: [
        { materialTypeId: 'fm-grain', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Finger millet is naturally pest-resistant and can store for 5+ years at 12% MC'],
    },
  ],
};

// ─── PEARL MILLET ─────────────────────────────────────────────────────────────
export const pearlMilletTemplate: ProductionTemplate = {
  id: 'pearl-millet',
  name: 'Pearl Millet (Bulrush Millet)',
  shortName: 'Pearl Millet',
  category: 'crops',
  species: 'Pennisetum glaucum',
  purpose: 'Grain & Fodder — Dryland Farming',
  description: 'Extremely drought-tolerant cereal for hot, arid areas where maize fails. Dual purpose: grain for food and stalks for fodder.',
  icon: '🌾',
  color: '#fef9c3',
  tags: ['pearl millet', 'bulrush', 'drought tolerant', 'arid', 'fodder', 'food security'],
  materials: [
    { id: 'pm-seed', name: 'Pearl Millet Seed', unit: 'kg', category: 'input' },
    { id: 'pm-grain', name: 'Pearl Millet Grain', unit: 'kg', category: 'output' },
    { id: 'pm-stover', name: 'Millet Stover (fodder)', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Grain Yield', unit: 'kg/ha', benchmark: 1500 },
    { id: 'days-to-maturity', name: 'Days to Maturity', unit: 'days', benchmark: 90 },
  ],
  stages: [
    {
      id: 'planting', name: 'Planting (direct seeding)', order: 1, durationDays: 14, color: '#fef9c3',
      inputs: [
        { id: 'seed', label: 'Seed (5–10 kg/ha)', unit: 'kg', required: true },
        { id: 'basal', label: 'Basal Fertiliser (optional in low-input systems)', unit: 'kg', required: false },
      ],
      activities: [
        { id: 'plant', name: 'Plant in station holes: 75 × 30 cm, 2–3 seeds per hole at 2–3 cm depth', frequency: 'once' },
        { id: 'thin', name: 'Thin to 1–2 plants per hole at 2 weeks', frequency: 'once' },
      ],
      measurements: [
        { id: 'emergence', name: 'Emergence % (day 7)', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 85 } },
      ],
      outputs: [], possibleNextStages: ['vegetative'],
      alerts: ['Plant immediately after first good rains — late planting severely reduces yield'],
    },
    {
      id: 'vegetative', name: 'Vegetative & Tillering (weeks 2–8)', order: 2, durationDays: 42, color: '#d1fae5',
      inputs: [
        { id: 'top-dress', label: 'Urea / CAN top dressing (optional)', unit: 'kg', required: false },
      ],
      activities: [
        { id: 'weed', name: 'Weed at 2 and 5 weeks after emergence', frequency: 'once' },
        { id: 'downy-mildew', name: 'Scout for downy mildew (blue fuzzy growth on leaves)', frequency: 'weekly' },
        { id: 'striga-control', name: 'Hand-pull Striga before it sets seed', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'height', name: 'Plant Height', unit: 'cm', frequency: 'weekly', required: false },
        { id: 'tillers', name: 'Tillers per Plant', unit: 'count', frequency: 'weekly', required: false },
      ],
      outputs: [], possibleNextStages: ['harvest'],
      alerts: ['Downy mildew is the most damaging disease of pearl millet — use resistant varieties'],
    },
    {
      id: 'harvest', name: 'Harvest (90–100 days)', order: 3, durationDays: 14, color: '#f59e0b',
      inputs: [],
      activities: [
        { id: 'harvest-heads', name: 'Harvest heads when grain is hard (dough stage)', frequency: 'once' },
        { id: 'dry', name: 'Sun-dry heads for 5–7 days', frequency: 'daily' },
        { id: 'thresh', name: 'Thresh and winnow', frequency: 'once' },
        { id: 'stover', name: 'Cut and bundle stover for livestock fodder', frequency: 'once' },
      ],
      measurements: [
        { id: 'yield', name: 'Grain Yield', unit: 'kg/ha', frequency: 'once', required: true, benchmark: { target: 1500 } },
        { id: 'stover-yield', name: 'Stover Yield', unit: 'kg/ha', frequency: 'once', required: false },
      ],
      outputs: [
        { materialTypeId: 'pm-grain', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
        { materialTypeId: 'pm-stover', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'B' },
      ],
      possibleNextStages: [],
      alerts: ['Birds are a major pest at grain fill — deploy bird scarers and nets'],
    },
  ],
};

// ─── IRISH POTATO ────────────────────────────────────────────────────────────
export const irishPotatoTemplate: ProductionTemplate = {
  id: 'irish-potato',
  name: 'Irish Potato',
  shortName: 'Irish Potato',
  category: 'crops',
  species: 'Solanum tuberosum',
  purpose: 'Fresh Tubers & Processing',
  description: 'Intensive potato production from certified seed. High-value crop with 90–120 day cycle. Requires good soil drainage and disease management.',
  icon: '🥔',
  color: '#fef3c7',
  tags: ['potato', 'irish potato', 'tuber', 'vegetable', 'highland', 'certified seed'],
  materials: [
    { id: 'seed-potato', name: 'Certified Seed Potato', unit: 'kg', category: 'input' },
    { id: 'compound-d', name: 'Compound D Fertiliser', unit: 'kg', category: 'input' },
    { id: 'can', name: 'CAN Top Dressing', unit: 'kg', category: 'input' },
    { id: 'fungicide', name: 'Late Blight Fungicide', unit: 'L', category: 'input' },
    { id: 'potato-fresh', name: 'Fresh Ware Potatoes', unit: 'kg', category: 'output' },
    { id: 'potato-seed', name: 'Seed Potatoes (recycled)', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Tuber Yield', unit: 't/ha', benchmark: 25 },
    { id: 'marketable-pct', name: 'Marketable Tuber %', unit: 'percent', benchmark: 80 },
    { id: 'specific-gravity', name: 'Specific Gravity (processing)', unit: 'ratio', benchmark: 1.085 },
  ],
  stages: [
    {
      id: 'land-prep', name: 'Land Preparation & Planting', order: 1, durationDays: 21, color: '#fef9c3',
      inputs: [
        { id: 'seed', label: 'Certified Seed Potato (cut/whole, 2–3 t/ha)', unit: 'kg', required: true },
        { id: 'fert', label: 'Compound D (500–600 kg/ha in furrow)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'plough', name: 'Deep plough 30 cm, ridges 30 cm high × 75 cm apart', frequency: 'once' },
        { id: 'cut-seed', name: 'Cut seed to 40–60 g pieces with 2 eyes each; dust with fungicide', frequency: 'once' },
        { id: 'plant', name: 'Plant in furrow at 30 cm spacing, cover to 10 cm', frequency: 'once' },
        { id: 'emergence', name: 'Check emergence at 14–18 days', frequency: 'daily' },
      ],
      measurements: [
        { id: 'emergence', name: 'Emergence %', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 90 } },
      ],
      outputs: [], possibleNextStages: ['vegetative'],
      alerts: ['Only plant certified disease-free seed — save-your-own seed quickly degrades with virus', 'Do not plant in ground that had potatoes the previous season — rotate minimum 3 years'],
    },
    {
      id: 'vegetative', name: 'Vegetative & Hilling', order: 2, durationDays: 35, color: '#d1fae5',
      inputs: [
        { id: 'can', label: 'CAN Top Dressing (200–300 kg/ha at 4–5 weeks)', unit: 'kg', required: true },
        { id: 'herbicide', label: 'Pre-emergence Herbicide', unit: 'L', required: false },
      ],
      activities: [
        { id: 'weed', name: 'Weed and hill-up at 4 and 7 weeks', frequency: 'weekly' },
        { id: 'top-dress', name: 'Apply CAN at hilling-up (4–5 WAP)', frequency: 'once' },
        { id: 'blight-spray', name: 'Begin preventive blight sprays at 4 WAP — every 7–10 days', frequency: 'weekly' },
        { id: 'aphid', name: 'Scout for aphids (virus vectors) weekly', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'canopy-cover', name: 'Canopy Cover %', unit: 'percent', frequency: 'weekly', required: false },
        { id: 'blight', name: 'Late Blight Incidence %', unit: 'percent', frequency: 'weekly', required: true, benchmark: { max: 5 } },
      ],
      outputs: [], possibleNextStages: ['tuber-bulk'],
      alerts: ['Late blight can destroy a field in 4 days under cool, wet conditions — DO NOT skip sprays'],
    },
    {
      id: 'tuber-bulk', name: 'Tuber Bulking (weeks 7–12)', order: 3, durationDays: 35, color: '#fde68a',
      inputs: [
        { id: 'fungicide', label: 'Blight Fungicide (rotate actives)', unit: 'L', required: true },
        { id: 'irrigation', label: 'Irrigation Water (if dry spell)', unit: 'm3', required: false },
      ],
      activities: [
        { id: 'blight-spray', name: 'Continue weekly blight sprays — rotate fungicides', frequency: 'weekly' },
        { id: 'leaf-check', name: 'Monitor for early blight, black leg, aphids', frequency: 'weekly' },
        { id: 'vine-kill', name: 'Kill vines 2 weeks before harvest to toughen skins', frequency: 'once' },
      ],
      measurements: [
        { id: 'blight', name: 'Late Blight Severity (%)', unit: 'percent', frequency: 'weekly', required: true, benchmark: { max: 10 } },
        { id: 'tuber-size', name: 'Sample Tuber Size (dig 5 plants)', unit: 'g', frequency: 'weekly', required: false, benchmark: { target: 200 } },
      ],
      outputs: [], possibleNextStages: ['harvest'],
      alerts: ['Vine kill 2 weeks early is essential — soft skins bruise badly at harvest and store poorly'],
    },
    {
      id: 'harvest', name: 'Harvest & Curing', order: 4, durationDays: 14, color: '#f59e0b',
      inputs: [],
      activities: [
        { id: 'harvest', name: 'Harvest on dry day — avoid harvest on wet soil', frequency: 'once' },
        { id: 'cure', name: 'Cure in dark, ventilated store at 12–15°C for 10–14 days', frequency: 'daily' },
        { id: 'grade', name: 'Grade: ware (>50 mm), seed (30–50 mm), reject', frequency: 'once' },
        { id: 'store', name: 'Cold store at 4–8°C for long-term; 12°C for ware', frequency: 'once' },
      ],
      measurements: [
        { id: 'yield', name: 'Tuber Yield', unit: 't/ha', frequency: 'once', required: true, benchmark: { target: 25 } },
        { id: 'marketable', name: 'Marketable %', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 80 } },
        { id: 'dry-matter', name: 'Dry Matter % (processing)', unit: 'percent', frequency: 'once', required: false, benchmark: { min: 20 } },
      ],
      outputs: [
        { materialTypeId: 'potato-fresh', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
        { materialTypeId: 'potato-seed', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'B' },
      ],
      possibleNextStages: [],
      alerts: ['Never expose tubers to light after harvest — greening = solanine (toxic and unmarketable)'],
    },
  ],
};

// ─── COWPEA / DRIED BEANS ────────────────────────────────────────────────────
export const cowpeaTemplate: ProductionTemplate = {
  id: 'cowpea',
  name: 'Cowpea (Dried Beans)',
  shortName: 'Cowpea',
  category: 'crops',
  species: 'Vigna unguiculata',
  purpose: 'Protein Grain & Nitrogen Fixation',
  description: 'Drought-tolerant legume for grain and fodder. Fixes atmospheric nitrogen; excellent rotation crop after cereals. 60–90 day cycle.',
  icon: '🫘',
  color: '#fef3c7',
  tags: ['cowpea', 'bean', 'legume', 'protein', 'drought tolerant', 'nitrogen fixation', 'rotation'],
  materials: [
    { id: 'cowpea-seed', name: 'Cowpea Seed', unit: 'kg', category: 'input' },
    { id: 'rhizobium', name: 'Rhizobium Inoculant', unit: 'kg', category: 'input' },
    { id: 'cowpea-grain', name: 'Dried Cowpea Grain', unit: 'kg', category: 'output' },
    { id: 'cowpea-hay', name: 'Cowpea Hay (fodder)', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Grain Yield', unit: 'kg/ha', benchmark: 800 },
    { id: 'protein', name: 'Grain Protein %', unit: 'percent', benchmark: 23 },
    { id: 'n-fixed', name: 'Nitrogen Fixed', unit: 'kg N/ha', benchmark: 100 },
  ],
  stages: [
    {
      id: 'planting', name: 'Planting', order: 1, durationDays: 14, color: '#fef9c3',
      inputs: [
        { id: 'seed', label: 'Seed (25–30 kg/ha) inoculated with Rhizobium', unit: 'kg', required: true },
        { id: 'basal', label: 'Starter P-fertiliser (SSP 100 kg/ha)', unit: 'kg', required: false },
      ],
      activities: [
        { id: 'inoculate', name: 'Coat seed with Rhizobium inoculant before planting', frequency: 'once' },
        { id: 'plant', name: 'Plant at 75 × 25 cm (1 seed per hole at 3 cm depth)', frequency: 'once' },
        { id: 'emergence', name: 'Check emergence (5–7 days)', frequency: 'daily' },
      ],
      measurements: [
        { id: 'emergence', name: 'Emergence %', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 80 } },
      ],
      outputs: [], possibleNextStages: ['vegetative'],
      alerts: ['Inoculation increases yield by 30–50% — do not plant without it', 'Do not apply N fertiliser — cowpea fixes its own nitrogen'],
    },
    {
      id: 'vegetative', name: 'Vegetative & Flowering (weeks 2–6)', order: 2, durationDays: 28, color: '#d1fae5',
      inputs: [
        { id: 'insecticide', label: 'Insecticide for pod borers (at flowering)', unit: 'L', required: false },
      ],
      activities: [
        { id: 'weed', name: 'Weed once at 3 weeks — after canopy closure weeds are suppressed', frequency: 'once' },
        { id: 'nodule-check', name: 'Check root nodules at 3 weeks (should be pink inside)', frequency: 'once' },
        { id: 'aphid-scout', name: 'Scout for aphids and flower thrips at flowering', frequency: 'weekly' },
        { id: 'pod-borer', name: 'Spray insecticide at 10% pod set if pod borers present', frequency: 'once' },
      ],
      measurements: [
        { id: 'nodule-score', name: 'Nodule Colour Score (pink=active)', unit: 'score', frequency: 'once', required: false },
        { id: 'flowering-pct', name: 'Plants in Flower %', unit: 'percent', frequency: 'weekly', required: false },
      ],
      outputs: [], possibleNextStages: ['harvest'],
      alerts: ['Pink nodules = active N fixation. Brown/white = inoculant failed — may need re-planting'],
    },
    {
      id: 'harvest', name: 'Harvest (60–90 days)', order: 3, durationDays: 14, color: '#f59e0b',
      inputs: [],
      activities: [
        { id: 'harvest', name: 'Harvest pods when 90% are dry and brown', frequency: 'once' },
        { id: 'dry', name: 'Sun-dry harvested plants 5–7 days before threshing', frequency: 'daily' },
        { id: 'thresh', name: 'Beat or machine-thresh; winnow to clean', frequency: 'once' },
        { id: 'store', name: 'Store at 12% MC with ash or P-cellar hermetic bags', frequency: 'once' },
      ],
      measurements: [
        { id: 'yield', name: 'Grain Yield', unit: 'kg/ha', frequency: 'once', required: true, benchmark: { target: 800 } },
        { id: 'moisture', name: 'Storage Moisture', unit: 'percent', frequency: 'once', required: true, benchmark: { max: 12 } },
      ],
      outputs: [
        { materialTypeId: 'cowpea-grain', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
        { materialTypeId: 'cowpea-hay', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'B' },
      ],
      possibleNextStages: [],
      alerts: ['Cowpea weevil destroys stored beans quickly — use hermetic bags or admix with wood ash'],
    },
  ],
};

// ─── SUGARCANE ───────────────────────────────────────────────────────────────
export const sugarcaneTemplate: ProductionTemplate = {
  id: 'sugarcane',
  name: 'Sugarcane',
  shortName: 'Sugarcane',
  category: 'crops',
  species: 'Saccharum officinarum',
  purpose: 'Sugar, Juice & Ethanol',
  description: 'Long-season crop (12–18 months) producing sucrose-rich cane for sugar mills, juice bars, or ethanol. Ratoon crops reduce replanting cost.',
  icon: '🎋',
  color: '#d1fae5',
  tags: ['sugarcane', 'sugar', 'cane', 'ethanol', 'biofuel', 'juice', 'ratoon'],
  materials: [
    { id: 'cane-sets', name: 'Planting Sets / Setts', unit: 'count', category: 'input' },
    { id: 'cane-fert', name: 'Compound Fertiliser', unit: 'kg', category: 'input' },
    { id: 'sugar-cane-out', name: 'Harvested Cane', unit: 't', category: 'output' },
    { id: 'cane-tops', name: 'Green Tops (fodder)', unit: 't', category: 'output' },
  ],
  kpis: [
    { id: 'tcane-ha', name: 'Tonnes Cane per Ha', unit: 't/ha', benchmark: 80 },
    { id: 'sucrose-pct', name: 'Sucrose Content (CCS)', unit: 'percent', benchmark: 12 },
    { id: 'ratoon-yield', name: 'Ratoon Yield Retention %', unit: 'percent', benchmark: 85 },
  ],
  stages: [
    {
      id: 'land-prep', name: 'Land Preparation & Planting', order: 1, durationDays: 30, color: '#fef9c3',
      inputs: [
        { id: 'setts', label: 'Cane Setts (2-bud, 3 per metre)', unit: 'count', required: true },
        { id: 'basal', label: 'Basal Compound Fertiliser', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'subsoil', name: 'Sub-soil to 60 cm to break hardpan', frequency: 'once' },
        { id: 'furrow', name: 'Open planting furrows 30 cm deep × 1.5 m apart', frequency: 'once' },
        { id: 'plant', name: 'Lay setts end-to-end and cover with 5–8 cm soil', frequency: 'once' },
        { id: 'irrigate', name: 'Irrigate to field capacity at planting', frequency: 'once' },
      ],
      measurements: [
        { id: 'germination', name: 'Germination % (21 days)', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 70 } },
      ],
      outputs: [], possibleNextStages: ['growing'],
      alerts: ['Use only disease-free, mosaic-certified setts — ratoon losses from mosaic are irreversible'],
    },
    {
      id: 'growing', name: 'Grand Growth Phase (months 3–10)', order: 2, durationDays: 210, color: '#d1fae5',
      inputs: [
        { id: 'nitrogen', label: 'Urea / CAN (split 3× during growth)', unit: 'kg', required: true },
        { id: 'irrigation', label: 'Irrigation Water (if not rainfed)', unit: 'm3', required: false },
      ],
      activities: [
        { id: 'weed', name: 'Weed and inter-row cultivation at 1 and 3 months', frequency: 'monthly' },
        { id: 'fert', name: 'Apply N in 3 splits: 1, 3 and 6 months', frequency: 'monthly' },
        { id: 'trash-mulch', name: 'Trash-mulch between rows to conserve moisture', frequency: 'once' },
        { id: 'pest-scout', name: 'Scout for stalk borers, woolly aphid, rats monthly', frequency: 'monthly' },
        { id: 'irrigate', name: 'Irrigate weekly during dry periods (≥50 mm/month crop requirement)', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'cane-height', name: 'Stalk Height', unit: 'cm', frequency: 'monthly', required: false, benchmark: { target: 250 } },
        { id: 'stoolcount', name: 'Stalks per Stool', unit: 'count', frequency: 'monthly', required: false },
        { id: 'borer-infestation', name: 'Stalk Borer Dead-Heart %', unit: 'percent', frequency: 'monthly', required: false, benchmark: { max: 5 } },
      ],
      outputs: [], possibleNextStages: ['ripening'],
      alerts: ['Stop N fertiliser 3 months before harvest — late N reduces sucrose content'],
    },
    {
      id: 'ripening', name: 'Ripening & Harvest (months 12–15)', order: 3, durationDays: 90, color: '#fde68a',
      inputs: [],
      activities: [
        { id: 'stress-ripen', name: 'Withhold irrigation 8 weeks before harvest to stress-ripen', frequency: 'once' },
        { id: 'sample', name: 'Test Brix and sucrose monthly from month 10', frequency: 'monthly' },
        { id: 'green-trash', name: 'Remove dry and green trash (or burn if allowed)', frequency: 'once' },
        { id: 'harvest', name: 'Harvest at peak sucrose — mechanical or manual cutting', frequency: 'once' },
        { id: 'ratoon', name: 'Clean stool base; apply ratoon N fertiliser immediately after harvest', frequency: 'once' },
      ],
      measurements: [
        { id: 'brix', name: 'Brix (Hand Refractometer)', unit: 'percent', frequency: 'monthly', required: true, benchmark: { min: 18 } },
        { id: 'ccs', name: 'CCS (Commercial Cane Sugar)', unit: 'percent', frequency: 'once', required: false, benchmark: { target: 12 } },
        { id: 'yield', name: 'Yield', unit: 't/ha', frequency: 'once', required: true, benchmark: { target: 80 } },
      ],
      outputs: [
        { materialTypeId: 'sugar-cane-out', quantity: null, unit: 't', routing: 'processing', qualityGrade: 'A' },
        { materialTypeId: 'cane-tops', quantity: null, unit: 't', routing: 'inventory', qualityGrade: 'B' },
      ],
      possibleNextStages: ['growing'],
      alerts: ['Mill cane within 24–48 hours of cutting — sucrose inversion (loss) begins immediately'],
    },
  ],
};

// ─── YAM ─────────────────────────────────────────────────────────────────────
export const yamTemplate: ProductionTemplate = {
  id: 'yam',
  name: 'Yam (White Yam)',
  shortName: 'Yam',
  category: 'crops',
  species: 'Dioscorea rotundata',
  purpose: 'Tuber — Food & High-Value Market',
  description: 'Long-season tropical tuber (9–12 months). Important food security and cash crop in West and Central Africa. Stakes required for climbing vine.',
  icon: '🍠',
  color: '#fef3c7',
  tags: ['yam', 'tuber', 'West Africa', 'climbing vine', 'food security', 'staple'],
  materials: [
    { id: 'yam-sett', name: 'Yam Setts (seed yam, 200–300 g)', unit: 'kg', category: 'input' },
    { id: 'yam-stake', name: 'Wooden Stakes (1.5–2 m)', unit: 'count', category: 'input' },
    { id: 'yam-tuber', name: 'Fresh Yam Tubers', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'yield', name: 'Tuber Yield', unit: 't/ha', benchmark: 15 },
    { id: 'dry-matter', name: 'Tuber Dry Matter %', unit: 'percent', benchmark: 28 },
    { id: 'seed-ratio', name: 'Seed-to-Ware Ratio', unit: 'ratio', benchmark: 8 },
  ],
  stages: [
    {
      id: 'planting', name: 'Mound Preparation & Planting', order: 1, durationDays: 30, color: '#fef9c3',
      inputs: [
        { id: 'setts', label: 'Yam Setts (200–300 g, 2–3 t/ha)', unit: 'kg', required: true },
        { id: 'basal', label: 'Organic Matter + Compound D', unit: 'kg', required: false },
      ],
      activities: [
        { id: 'mound', name: 'Build planting mounds 30 cm high, 1 m diameter, 1 m apart', frequency: 'once' },
        { id: 'treat-sett', name: 'Dust setts with wood ash or fungicide before planting', frequency: 'once' },
        { id: 'plant', name: 'Plant sett on top of mound, 10 cm deep', frequency: 'once' },
        { id: 'mulch', name: 'Mulch mounds with dry grass to conserve moisture', frequency: 'once' },
      ],
      measurements: [
        { id: 'sprout', name: 'Sprouting % (3 weeks)', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 85 } },
      ],
      outputs: [], possibleNextStages: ['vine-growth'],
      alerts: ['Only use healthy setts — cut from disease-free mother tubers and treat cut surfaces'],
    },
    {
      id: 'vine-growth', name: 'Vine Growth & Staking (months 2–5)', order: 2, durationDays: 90, color: '#d1fae5',
      inputs: [
        { id: 'stakes', label: 'Stakes (1 per plant, 1.5–2 m tall)', unit: 'count', required: true },
        { id: 'top-dress', label: 'NPK Top Dressing', unit: 'kg', required: false },
      ],
      activities: [
        { id: 'stake', name: 'Insert stakes when vines reach 30 cm; tie if needed', frequency: 'once' },
        { id: 'weed', name: 'Weed mounds at 4 and 8 weeks', frequency: 'once' },
        { id: 'top-dress', name: 'Apply NPK at 6–8 weeks when vines are growing fast', frequency: 'once' },
        { id: 'pests', name: 'Scout for yam anthracnose and mealybugs', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'vine-length', name: 'Vine Length', unit: 'cm', frequency: 'monthly', required: false },
        { id: 'anthracnose', name: 'Anthracnose Incidence %', unit: 'percent', frequency: 'monthly', required: false, benchmark: { max: 10 } },
      ],
      outputs: [], possibleNextStages: ['tuber-bulk'],
      alerts: ['Stakes are essential — vines on the ground triple disease risk and reduce yield by 50%'],
    },
    {
      id: 'tuber-bulk', name: 'Tuber Bulking (months 6–9)', order: 3, durationDays: 90, color: '#fde68a',
      inputs: [
        { id: 'irrigation', label: 'Supplementary Irrigation (if dry spell)', unit: 'm3', required: false },
      ],
      activities: [
        { id: 'earth-up', name: 'Earth-up mounds as tubers grow to prevent greening', frequency: 'monthly' },
        { id: 'anthracnose-spray', name: 'Spray copper fungicide if anthracnose spreads', frequency: 'weekly' },
        { id: 'monitor-tuber', name: 'Probe gently to estimate tuber size monthly', frequency: 'monthly' },
      ],
      measurements: [
        { id: 'vine-condition', name: 'Vine Health Score (1–5)', unit: 'score', frequency: 'monthly', required: false },
      ],
      outputs: [], possibleNextStages: ['harvest'],
      alerts: ['Never allow drought stress during tuber bulking — reduce by 30–50% of expected yield'],
    },
    {
      id: 'harvest', name: 'Harvest (9–12 months)', order: 4, durationDays: 21, color: '#f59e0b',
      inputs: [],
      activities: [
        { id: 'vine-cut', name: 'Cut vines 2 weeks before harvest to cure the skin', frequency: 'once' },
        { id: 'dig', name: 'Dig carefully around the mound — avoid tuber damage', frequency: 'once' },
        { id: 'cure', name: 'Cure in shade for 5 days to heal any cuts', frequency: 'daily' },
        { id: 'store', name: 'Store on yam barns (hung on sticks) for up to 6 months', frequency: 'once' },
        { id: 'select-seed', name: 'Set aside best small tubers as next season\'s seed', frequency: 'once' },
      ],
      measurements: [
        { id: 'yield', name: 'Tuber Yield', unit: 't/ha', frequency: 'once', required: true, benchmark: { target: 15 } },
        { id: 'avg-size', name: 'Average Tuber Weight', unit: 'kg', frequency: 'once', required: false, benchmark: { target: 2.5 } },
      ],
      outputs: [
        { materialTypeId: 'yam-tuber', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Yam tubers bruise easily — avoid dropping or rough handling. Store in well-ventilated barns only.'],
    },
  ],
};
