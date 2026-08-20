// ─────────────────────────────────────────────────────────────────────────────
// Extra Processing Templates: Honey, Cassava, Fruit Juice, Meat Processing,
// Animal Feed Mill, Tomato Sauce / Paste
// ─────────────────────────────────────────────────────────────────────────────
import type { ProductionTemplate } from '../types';

// ─── HONEY PROCESSING ────────────────────────────────────────────────────────
export const honeyProcessingTemplate: ProductionTemplate = {
  id: 'honey-processing',
  name: 'Honey Processing & Packing',
  shortName: 'Honey Processing',
  category: 'processing',
  species: 'Honey',
  purpose: 'Value-Added Honey Products',
  description: 'Post-harvest honey processing: extraction, settling, filtration, bottling, and labelling. Covers raw honey, creamed honey, and infused honey.',
  icon: '🍯',
  color: '#fef3c7',
  tags: ['honey', 'processing', 'extraction', 'bottling', 'packaging', 'value-added'],
  materials: [
    { id: 'raw-honey-in', name: 'Raw Honey in Comb', unit: 'kg', category: 'input' },
    { id: 'jar', name: 'Glass Jars with Lids', unit: 'count', category: 'input' },
    { id: 'label', name: 'Product Labels', unit: 'count', category: 'input' },
    { id: 'honey-jar', name: 'Bottled Honey (jar)', unit: 'count', category: 'output' },
    { id: 'beeswax-block', name: 'Beeswax Block', unit: 'kg', category: 'output' },
    { id: 'honey-bulk', name: 'Bulk Honey (kg drums)', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'extraction-yield', name: 'Extraction Yield %', unit: 'percent', benchmark: 95 },
    { id: 'moisture', name: 'Final Moisture Content', unit: 'percent', benchmark: 17.5 },
    { id: 'hmi', name: 'HMF (Hydroxymethylfurfural)', unit: 'mg/kg', benchmark: 15 },
  ],
  stages: [
    {
      id: 'receive-inspect', name: 'Receive & Quality Inspection', order: 1, durationDays: 1, color: '#fef9c3',
      inputs: [
        { id: 'honey', label: 'Honey in Supers (capped frames only)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'moisture-check', name: 'Check moisture with refractometer — reject if >20%', frequency: 'once' },
        { id: 'smell', name: 'Sensory check: aroma, colour, clarity', frequency: 'once' },
        { id: 'weigh', name: 'Weigh incoming honey in supers', frequency: 'once' },
        { id: 'record-origin', name: 'Record hive source and harvest date for traceability', frequency: 'once' },
      ],
      measurements: [
        { id: 'moisture-in', name: 'Incoming Moisture %', unit: 'percent', frequency: 'once', required: true, benchmark: { max: 20 } },
        { id: 'weight-in', name: 'Gross Incoming Weight', unit: 'kg', frequency: 'once', required: true },
      ],
      outputs: [], possibleNextStages: ['extraction'],
      alerts: ['REJECT honey above 20% moisture — it will ferment in jar within weeks and is unsellable'],
    },
    {
      id: 'extraction', name: 'Uncapping & Extraction', order: 2, durationDays: 1, color: '#fde68a',
      inputs: [
        { id: 'knife', label: 'Uncapping Knife or Fork (heated)', unit: 'count', required: true },
      ],
      activities: [
        { id: 'warm-room', name: 'Warm room to 28–32°C for easier extraction (reduces viscosity)', frequency: 'once' },
        { id: 'uncap', name: 'Uncap frames with heated knife — slice off wax caps', frequency: 'once' },
        { id: 'extract', name: 'Load frames into extractor; spin 5–10 min per side', frequency: 'once' },
        { id: 'wax-render', name: 'Drain wax cappings; render in solar wax melter', frequency: 'once' },
      ],
      measurements: [
        { id: 'honey-kg', name: 'Honey Extracted (kg)', unit: 'kg', frequency: 'once', required: true },
        { id: 'wax-kg', name: 'Wax Recovered (kg)', unit: 'kg', frequency: 'once', required: false },
      ],
      outputs: [], possibleNextStages: ['settling'],
      alerts: ['Do not heat honey above 40°C — destroys enzymes and raises HMF above legal limits in many countries'],
    },
    {
      id: 'settling', name: 'Settling, Filtering & Drying', order: 3, durationDays: 3, color: '#fbbf24',
      inputs: [],
      activities: [
        { id: 'coarse-filter', name: 'Pass through 600-micron stainless steel strainer first', frequency: 'once' },
        { id: 'fine-filter', name: 'Pass through 200-micron filter (no pressure filtering — destroys pollen)', frequency: 'once' },
        { id: 'settle', name: 'Allow to settle in settling tank 24–48 hours; skim foam', frequency: 'daily' },
        { id: 'dehumidify', name: 'If moisture >18%, run dehumidifier in sealed room 24–72 hours before bottling', frequency: 'daily' },
      ],
      measurements: [
        { id: 'moisture-post', name: 'Moisture after Settling', unit: 'percent', frequency: 'daily', required: true, benchmark: { max: 18 } },
        { id: 'clarity', name: 'Clarity / Foam Level', unit: 'score', frequency: 'once', required: false },
      ],
      outputs: [], possibleNextStages: ['bottling'],
      alerts: ['Never fine-filter under pressure (no "ultra-filtration") — removes pollen which proves floral source for export premium pricing'],
    },
    {
      id: 'bottling', name: 'Bottling & Labelling', order: 4, durationDays: 1, color: '#f59e0b',
      inputs: [
        { id: 'jars', label: 'Glass Jars (250 g, 500 g, 1 kg)', unit: 'count', required: true },
        { id: 'labels', label: 'Moisture-Proof Labels', unit: 'count', required: true },
      ],
      activities: [
        { id: 'wash-jars', name: 'Wash and sanitise jars; hot-air dry — no water residue', frequency: 'once' },
        { id: 'fill', name: 'Fill jars by weight using bottling valve; wipe neck before capping', frequency: 'once' },
        { id: 'label', name: 'Label with: product name, weight, producer, batch number, best-before', frequency: 'once' },
        { id: 'final-moisture', name: 'Re-check moisture on random sample of filled jars', frequency: 'once' },
        { id: 'qc', name: 'Quality check: seal integrity, label alignment, fill weight', frequency: 'once' },
      ],
      measurements: [
        { id: 'jars-packed', name: 'Jars Packed (count)', unit: 'count', frequency: 'once', required: true },
        { id: 'final-moisture', name: 'Final Jar Moisture %', unit: 'percent', frequency: 'once', required: true, benchmark: { max: 18.6 } },
        { id: 'fill-weight', name: 'Avg Fill Weight Variance', unit: 'g', frequency: 'once', required: false, benchmark: { max: 2 } },
      ],
      outputs: [
        { materialTypeId: 'honey-jar', quantity: null, unit: 'count', routing: 'inventory', qualityGrade: 'A' },
        { materialTypeId: 'beeswax-block', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Honey above 18.6% moisture CANNOT be sold legally in most countries — verify before labelling'],
    },
  ],
};

// ─── CASSAVA PROCESSING ──────────────────────────────────────────────────────
export const cassavaProcessingTemplate: ProductionTemplate = {
  id: 'cassava-processing',
  name: 'Cassava Processing (Flour & Chips)',
  shortName: 'Cassava Processing',
  category: 'processing',
  species: 'Cassava',
  purpose: 'Cassava Flour, Chips & Starch',
  description: 'Fresh cassava roots converted to high-quality cassava flour (HQF), dried chips, or wet starch. HQF is a wheat flour substitute with growing industrial demand.',
  icon: '🏭',
  color: '#fef9c3',
  tags: ['cassava', 'processing', 'flour', 'chips', 'starch', 'value-added', 'HQCF'],
  materials: [
    { id: 'fresh-cassava', name: 'Fresh Cassava Roots', unit: 'kg', category: 'input' },
    { id: 'cassava-flour', name: 'High-Quality Cassava Flour (HQCF)', unit: 'kg', category: 'output' },
    { id: 'cassava-chips', name: 'Dried Cassava Chips', unit: 'kg', category: 'output' },
    { id: 'cassava-peel', name: 'Cassava Peel (animal feed)', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'flour-yield', name: 'Flour Yield from Fresh Root', unit: 'percent', benchmark: 25 },
    { id: 'moisture', name: 'Final Flour Moisture', unit: 'percent', benchmark: 12 },
    { id: 'whiteness', name: 'Flour Whiteness Index', unit: 'score', benchmark: 85 },
    { id: 'hcn', name: 'HCN (cyanide) in finished product', unit: 'mg/kg', benchmark: 10 },
  ],
  stages: [
    {
      id: 'receive-peel', name: 'Receiving, Washing & Peeling', order: 1, durationDays: 1, color: '#fef9c3',
      inputs: [
        { id: 'fresh-roots', label: 'Fresh Cassava Roots (process within 24 h of harvest)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'receive', name: 'Receive and weigh fresh roots; reject rotten or mouldy ones', frequency: 'once' },
        { id: 'wash', name: 'Wash roots in clean running water to remove soil', frequency: 'once' },
        { id: 'peel', name: 'Peel outer and inner cork layer (mechanical or manual)', frequency: 'once' },
        { id: 'rewash', name: 'Wash peeled roots again before grating', frequency: 'once' },
      ],
      measurements: [
        { id: 'waste-pct', name: 'Peeling Loss %', unit: 'percent', frequency: 'once', required: false, benchmark: { max: 20 } },
        { id: 'weight-peeled', name: 'Weight after Peeling', unit: 'kg', frequency: 'once', required: true },
      ],
      outputs: [
        { materialTypeId: 'cassava-peel', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'B' },
      ],
      possibleNextStages: ['grating-pressing'],
      alerts: ['Process cassava within 24 hours of harvest — after 48 hours blue-black discolouration (post-harvest physiological deterioration) begins and the flour will be off-colour'],
    },
    {
      id: 'grating-pressing', name: 'Grating, Pressing & Crumbling', order: 2, durationDays: 1, color: '#fde68a',
      inputs: [],
      activities: [
        { id: 'grate', name: 'Grate peeled roots to wet mash using drum grater', frequency: 'once' },
        { id: 'press', name: 'Press mash in bags using hydraulic or screw press to remove water (target 50% MC)', frequency: 'once' },
        { id: 'crumble', name: 'Break pressed cake into uniform crumbs for drying', frequency: 'once' },
        { id: 'sieve-wet', name: 'Sieve crumbs through 2 mm mesh to remove lumps', frequency: 'once' },
      ],
      measurements: [
        { id: 'wet-mc', name: 'Wet Press Cake Moisture', unit: 'percent', frequency: 'once', required: true, benchmark: { max: 50 } },
        { id: 'crumb-weight', name: 'Crumb Weight After Pressing', unit: 'kg', frequency: 'once', required: true },
      ],
      outputs: [], possibleNextStages: ['drying'],
      alerts: ['Under-pressing (>55% MC) means much longer drying time and higher risk of mould during drying'],
    },
    {
      id: 'drying', name: 'Flash Drying or Sun Drying', order: 3, durationDays: 2, color: '#fb923c',
      inputs: [
        { id: 'energy', label: 'Flash Dryer Energy (firewood/diesel/solar)', unit: 'kg', required: false },
      ],
      activities: [
        { id: 'flash-dry', name: 'Flash dry at 120°C inlet / 60°C outlet for 5–10 min (commercial)', frequency: 'once' },
        { id: 'sun-dry', name: 'Or: Spread crumbs 2 cm thick on raised sun-drying tables; stir hourly', frequency: 'daily' },
        { id: 'moisture-check', name: 'Check moisture every 2 hours with moisture meter (target ≤12.5%)', frequency: 'daily' },
        { id: 'cover', name: 'Cover during rain or night — do not allow re-wetting', frequency: 'daily' },
      ],
      measurements: [
        { id: 'mc-hourly', name: 'Moisture Content', unit: 'percent', frequency: 'daily', required: true, benchmark: { max: 12.5 } },
        { id: 'colour', name: 'Flour Colour (visual: white to cream)', unit: 'score', frequency: 'once', required: false },
      ],
      outputs: [], possibleNextStages: ['milling'],
      alerts: ['Never package flour above 12.5% MC — it will mould in bags within days', 'Flash drying is preferred — sun drying takes 2 days and risks colour problems if cassava is left wet overnight'],
    },
    {
      id: 'milling', name: 'Milling, Sieving & Packaging', order: 4, durationDays: 1, color: '#f59e0b',
      inputs: [
        { id: 'bags', label: 'Packaging Bags (food grade, moisture-proof)', unit: 'count', required: true },
      ],
      activities: [
        { id: 'mill', name: 'Mill dried crumbs through hammer mill to fine flour', frequency: 'once' },
        { id: 'sieve-fine', name: 'Sieve through 250-micron mesh — must pass for food-grade HQCF', frequency: 'once' },
        { id: 'final-moisture', name: 'Final moisture check on flour before sealing', frequency: 'once' },
        { id: 'bag-seal', name: 'Fill and seal bags; label with batch, date, moisture, weight', frequency: 'once' },
        { id: 'store', name: 'Store in cool, dry place (below 25°C) — shelf life 6 months at 12% MC', frequency: 'once' },
      ],
      measurements: [
        { id: 'flour-yield', name: 'Final Flour Yield from Fresh Root', unit: 'percent', frequency: 'once', required: true, benchmark: { target: 25 } },
        { id: 'final-mc', name: 'Final Flour Moisture', unit: 'percent', frequency: 'once', required: true, benchmark: { max: 12.5 } },
        { id: 'granulation', name: 'Granulation (% passing 250 µm sieve)', unit: 'percent', frequency: 'once', required: false, benchmark: { min: 90 } },
      ],
      outputs: [
        { materialTypeId: 'cassava-flour', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
        { materialTypeId: 'cassava-chips', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'B' },
      ],
      possibleNextStages: [],
      alerts: ['HQCF must pass the whiteness test (index >80) and the swelling test to meet industrial buyer specs'],
    },
  ],
};

// ─── FRUIT JUICE PROCESSING ──────────────────────────────────────────────────
export const fruitJuiceTemplate: ProductionTemplate = {
  id: 'fruit-juice',
  name: 'Fruit Juice Processing',
  shortName: 'Fruit Juice',
  category: 'processing',
  species: 'Mixed Tropical Fruits',
  purpose: 'Fresh and Pasteurised Fruit Juice',
  description: 'Small to mid-scale juice processing from mango, passion fruit, orange, guava, and other tropical fruits. Covers fresh-pressed, pasteurised, and concentrated products.',
  icon: '🧃',
  color: '#ffedd5',
  tags: ['juice', 'fruit processing', 'mango', 'passion fruit', 'pasteurisation', 'value-added'],
  materials: [
    { id: 'fresh-fruit', name: 'Fresh Tropical Fruit', unit: 'kg', category: 'input' },
    { id: 'juice-bottle', name: 'Juice Bottle / Tetra Pack', unit: 'count', category: 'input' },
    { id: 'juice-out', name: 'Bottled Fruit Juice', unit: 'L', category: 'output' },
    { id: 'juice-pulp', name: 'Fruit Pulp / Concentrate', unit: 'kg', category: 'output' },
    { id: 'pomace', name: 'Fruit Pomace (animal feed)', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'juice-yield', name: 'Juice Yield % from Fresh Fruit', unit: 'percent', benchmark: 55 },
    { id: 'brix', name: 'Brix of Final Product', unit: 'percent', benchmark: 12 },
    { id: 'shelf-life', name: 'Shelf Life (pasteurised)', unit: 'days', benchmark: 21 },
  ],
  stages: [
    {
      id: 'receive', name: 'Receiving & Sorting', order: 1, durationDays: 1, color: '#ffedd5',
      inputs: [
        { id: 'fruit', label: 'Fresh Ripe Fruit (sorted, undamaged)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'sort', name: 'Sort fruit: remove rotten, mouldy, immature and overripe', frequency: 'once' },
        { id: 'wash', name: 'Wash in chlorinated water (100 ppm) and rinse', frequency: 'once' },
        { id: 'weigh', name: 'Weigh incoming and sorted batches', frequency: 'once' },
        { id: 'brix-check', name: 'Check Brix of raw fruit — target >9 Brix for good juice', frequency: 'once' },
      ],
      measurements: [
        { id: 'grade-in', name: 'Useable Fruit %', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 85 } },
        { id: 'brix-raw', name: 'Raw Fruit Brix', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 9 } },
      ],
      outputs: [], possibleNextStages: ['extraction'],
      alerts: ['Even 5% rotten fruit contaminating a batch ruins the flavour and shelf life — zero tolerance in sorting'],
    },
    {
      id: 'extraction', name: 'Extraction & Clarification', order: 2, durationDays: 1, color: '#fde68a',
      inputs: [],
      activities: [
        { id: 'peel', name: 'Peel/de-stone as required by fruit type', frequency: 'once' },
        { id: 'pulp', name: 'Pulp in stainless pulper; pass through 0.5 mm screen', frequency: 'once' },
        { id: 'centrifuge', name: 'Centrifuge or basket-press to separate juice from pomace', frequency: 'once' },
        { id: 'enzyme', name: 'Add pectinase enzyme to improve yield and clarity (optional)', frequency: 'once' },
        { id: 'blend', name: 'Blend juice to target Brix (dilute or concentrate)', frequency: 'once' },
      ],
      measurements: [
        { id: 'yield-pct', name: 'Juice Yield %', unit: 'percent', frequency: 'once', required: true, benchmark: { target: 55 } },
        { id: 'brix-juice', name: 'Juice Brix Before Pasteurisation', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 10 } },
      ],
      outputs: [
        { materialTypeId: 'pomace', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'B' },
      ],
      possibleNextStages: ['pasteurisation'],
      alerts: ['Use only stainless steel and food-grade equipment — aluminium causes oxidation and off-flavours'],
    },
    {
      id: 'pasteurisation', name: 'Pasteurisation & Hot-Fill', order: 3, durationDays: 1, color: '#fb923c',
      inputs: [
        { id: 'bottles', label: 'Pre-sterilised Bottles / Packs', unit: 'count', required: true },
        { id: 'caps', label: 'Tamper-Evident Caps / Seals', unit: 'count', required: true },
      ],
      activities: [
        { id: 'heat', name: 'Pasteurise at 85°C for 15 seconds (HTST) or 72°C for 30 min (LTLT)', frequency: 'once' },
        { id: 'hot-fill', name: 'Hot-fill into pre-sterilised bottles at 82°C minimum', frequency: 'once' },
        { id: 'invert', name: 'Invert bottles for 60 seconds to sterilise cap', frequency: 'once' },
        { id: 'cool', name: 'Cool rapidly in water bath to below 35°C', frequency: 'once' },
        { id: 'label', name: 'Label with: name, volume, Brix, ingredients, BBD, batch number', frequency: 'once' },
      ],
      measurements: [
        { id: 'pasteurisation-temp', name: 'Pasteurisation Temperature', unit: '°C', frequency: 'daily', required: true, benchmark: { min: 85 } },
        { id: 'fill-temp', name: 'Hot-Fill Temperature', unit: '°C', frequency: 'daily', required: true, benchmark: { min: 82 } },
        { id: 'ph', name: 'Product pH', unit: 'pH', frequency: 'once', required: true, benchmark: { max: 4.5 } },
      ],
      outputs: [
        { materialTypeId: 'juice-out', quantity: null, unit: 'L', routing: 'inventory', qualityGrade: 'A' },
        { materialTypeId: 'juice-pulp', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Juice above pH 4.5 is NOT self-preserving — must achieve pH ≤4.5 or refrigerate. Add citric acid to reach target.', 'Hot-fill temperature below 82°C means bottles are not self-sterilised — shelf life drops to days'],
    },
  ],
};

// ─── ANIMAL FEED MILL ────────────────────────────────────────────────────────
export const feedMillTemplate: ProductionTemplate = {
  id: 'feed-mill',
  name: 'On-Farm Feed Mill',
  shortName: 'Feed Mill',
  category: 'processing',
  species: 'Mixed Farm Feeds',
  purpose: 'Compounded Animal Feed — Broiler, Layer, Pig, Dairy',
  description: 'Small-scale on-farm or commercial feed mill producing compounded feeds (mash or pellets). Reduces feed costs by 20–35% vs buying commercial feed.',
  icon: '🌾',
  color: '#fef9c3',
  tags: ['feed mill', 'animal feed', 'broiler', 'layer', 'pig', 'dairy', 'compounding'],
  materials: [
    { id: 'maize', name: 'Maize Grain', unit: 'kg', category: 'input' },
    { id: 'soybean-meal', name: 'Soybean Meal (44% CP)', unit: 'kg', category: 'input' },
    { id: 'fishmeal', name: 'Fishmeal (65% CP)', unit: 'kg', category: 'input' },
    { id: 'premix', name: 'Vitamin/Mineral Premix', unit: 'kg', category: 'input' },
    { id: 'limestone', name: 'Limestone / Dicalcium Phosphate', unit: 'kg', category: 'input' },
    { id: 'broiler-starter', name: 'Broiler Starter (22% CP)', unit: 'kg', category: 'output' },
    { id: 'layer-mash', name: 'Layer Mash (17% CP)', unit: 'kg', category: 'output' },
    { id: 'pig-grower', name: 'Pig Grower (18% CP)', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'batch-size', name: 'Batch Size', unit: 'kg', benchmark: 1000 },
    { id: 'mixing-uniformity', name: 'Mixing Uniformity (CV)', unit: 'percent', benchmark: 5 },
    { id: 'cost-vs-commercial', name: 'Cost Saving vs Commercial Feed', unit: 'percent', benchmark: 25 },
    { id: 'throughput', name: 'Daily Throughput', unit: 'tonne', benchmark: 5 },
  ],
  stages: [
    {
      id: 'raw-material', name: 'Raw Material Procurement & QC', order: 1, durationDays: 3, color: '#fef9c3',
      inputs: [
        { id: 'maize', label: 'Maize Grain (≤13% MC, <0.5 ppm aflatoxin)', unit: 'kg', required: true },
        { id: 'soybean', label: 'Soybean Meal (44% CP, urease <0.2)', unit: 'kg', required: true },
        { id: 'premix', label: 'Vitamin/Mineral Premix (for target species)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'receive-test', name: 'Test grain moisture and screen for aflatoxin on arrival', frequency: 'once' },
        { id: 'urease-test', name: 'Urease test on soybean meal (under-processed = toxic to monogastrics)', frequency: 'once' },
        { id: 'segregate', name: 'Store ingredients separated by type; FIFO rotation', frequency: 'once' },
      ],
      measurements: [
        { id: 'maize-mc', name: 'Maize Moisture Content', unit: 'percent', frequency: 'once', required: true, benchmark: { max: 13 } },
        { id: 'aflatoxin', name: 'Aflatoxin (rapid strip test)', unit: 'ppb', frequency: 'once', required: true, benchmark: { max: 20 } },
        { id: 'urease-ph', name: 'Urease Activity ΔpH', unit: 'pH', frequency: 'once', required: true, benchmark: { max: 0.2 } },
      ],
      outputs: [], possibleNextStages: ['milling'],
      alerts: ['Aflatoxin contaminated maize causes immunosuppression and liver damage in livestock — REJECT batches above 20 ppb'],
    },
    {
      id: 'milling', name: 'Grinding, Weighing & Mixing', order: 2, durationDays: 1, color: '#fde68a',
      inputs: [],
      activities: [
        { id: 'grind-maize', name: 'Grind maize to medium particle size (2–3 mm for mash; 1.5 mm for pellets)', frequency: 'once' },
        { id: 'weigh-ingredients', name: 'Weigh each ingredient per formula to ±0.5% accuracy', frequency: 'once' },
        { id: 'load-sequence', name: 'Load mixer in sequence: large ingredients first, premix last', frequency: 'once' },
        { id: 'mix', name: 'Mix for 5–7 minutes after all ingredients loaded', frequency: 'once' },
        { id: 'uniformity', name: 'Spot-check mixing uniformity (salt dispersion test)', frequency: 'once' },
      ],
      measurements: [
        { id: 'batch-weight', name: 'Batch Weight (formula vs actual)', unit: 'kg', frequency: 'once', required: true },
        { id: 'mix-time', name: 'Mixing Time', unit: 'minutes', frequency: 'once', required: true, benchmark: { min: 5 } },
        { id: 'cp-estimate', name: 'Estimated Crude Protein %', unit: 'percent', frequency: 'once', required: false },
      ],
      outputs: [], possibleNextStages: ['bagging'],
      alerts: ['Short mixing time is the #1 cause of poor feed uniformity — minimum 5 minutes after the last ingredient is added'],
    },
    {
      id: 'bagging', name: 'Bagging, Labelling & QC', order: 3, durationDays: 1, color: '#f59e0b',
      inputs: [
        { id: 'bags', label: 'Feed Bags (25 kg or 50 kg)', unit: 'count', required: true },
      ],
      activities: [
        { id: 'sample', name: 'Take retention sample from each batch (200 g) for lab analysis', frequency: 'once' },
        { id: 'bag-weigh', name: 'Fill and weigh bags to ±0.5 kg accuracy', frequency: 'once' },
        { id: 'label', name: 'Label: feed type, species, batch, date, protein guarantee, ingredients', frequency: 'once' },
        { id: 'store', name: 'Store on pallets in dry, rodent-proof warehouse', frequency: 'once' },
        { id: 'shelf-life', name: 'Feed shelf life: 3 months max (vitamins degrade); use FIFO', frequency: 'once' },
      ],
      measurements: [
        { id: 'batches-produced', name: 'Batches Produced', unit: 'count', frequency: 'once', required: true },
        { id: 'total-kg', name: 'Total Feed Produced', unit: 'kg', frequency: 'once', required: true },
        { id: 'cost-per-kg', name: 'Cost per kg vs Commercial', unit: 'ratio', frequency: 'once', required: false },
      ],
      outputs: [
        { materialTypeId: 'broiler-starter', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
        { materialTypeId: 'layer-mash', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
        { materialTypeId: 'pig-grower', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Vitamins in premix degrade rapidly — compounded feed shelf life is 3 months maximum. Label with date and rotate stock.'],
    },
  ],
};
