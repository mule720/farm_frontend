// ─────────────────────────────────────────────────────────────────────────────
// Additional Poultry Templates: Duck (Meat), Duck (Layer), Turkey, Guinea Fowl,
// Quail (Meat/Egg), Indigenous Chicken (Broiler/Layer)
// ─────────────────────────────────────────────────────────────────────────────
import type { ProductionTemplate } from '../types';

// ─── DUCK — MEAT ─────────────────────────────────────────────────────────────
export const meatDuckTemplate: ProductionTemplate = {
  id: 'meat-duck',
  name: 'Meat Duck (Pekin/Muscovy)',
  shortName: 'Meat Duck',
  category: 'poultry',
  species: 'Duck',
  purpose: 'Meat',
  description: 'Fast-growing ducks for meat production. 7–9 week grow-out.',
  icon: '🦆',
  color: '#0ea5e9',
  tags: ['duck', 'meat', 'poultry'],
  materials: [
    { id: 'duck-chick', name: 'Day-old Ducklings', unit: 'head', category: 'input' },
    { id: 'duck-feed-starter', name: 'Duck Starter Feed', unit: 'kg', category: 'input' },
    { id: 'duck-feed-grower', name: 'Duck Grower Feed', unit: 'kg', category: 'input' },
    { id: 'duck-feed-finisher', name: 'Duck Finisher Feed', unit: 'kg', category: 'input' },
    { id: 'duck-meat', name: 'Duck Meat (live)', unit: 'head', category: 'output' },
    { id: 'duck-water', name: 'Water', unit: 'litre', category: 'input' },
  ],
  kpis: [
    { id: 'fcr', name: 'FCR', unit: 'ratio', benchmark: 2.8 },
    { id: 'mortality', name: 'Mortality Rate', unit: 'percent', benchmark: 3 },
    { id: 'avg-weight', name: 'Avg Live Weight', unit: 'kg', benchmark: 3.2 },
    { id: 'adg', name: 'ADG', unit: 'g/day', benchmark: 55 },
  ],
  stages: [
    {
      id: 'brooding',
      name: 'Brooding',
      order: 1,
      durationDays: 21,
      color: '#fbbf24',
      inputs: [
        { id: 'ducklings', label: 'Day-old Ducklings', unit: 'head', required: true },
        { id: 'duck-starter', label: 'Duck Starter Feed', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'temp-check', name: 'Check brooder temperature (32°C week 1)', frequency: 'daily' },
        { id: 'water', name: 'Check water drinkers (ducks need lots of water)', frequency: 'twice_daily' },
      ],
      measurements: [
        { id: 'temp', name: 'Brooder Temp', unit: 'celsius', frequency: 'daily', required: true, benchmark: 32 },
        { id: 'mortality', name: 'Daily Mortality', unit: 'count', frequency: 'daily', required: true, benchmark: 0 },
        { id: 'feed-consumed', name: 'Feed Consumed', unit: 'kg', frequency: 'daily', required: false, benchmark: null },
      ],
      outputs: [],
      possibleNextStages: ['growing'],
      alerts: ['Ducks need access to water for dipping bills (not swimming) from day 1', 'Remove heat by day 21–28 depending on weather'],
    },
    {
      id: 'growing',
      name: 'Growing',
      order: 2,
      durationDays: 28,
      color: '#22c55e',
      inputs: [
        { id: 'duck-grower', label: 'Duck Grower / Finisher Feed', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'weigh', name: 'Weekly weighing (sample 30)', frequency: 'weekly' },
        { id: 'litter', name: 'Monitor & manage litter (ducks are wet!)', frequency: 'daily' },
      ],
      measurements: [
        { id: 'avg-weight', name: 'Avg Live Weight', unit: 'kg', frequency: 'weekly', required: true, benchmark: 2.5 },
        { id: 'mortality', name: 'Daily Mortality', unit: 'count', frequency: 'daily', required: true, benchmark: 0 },
        { id: 'fcr-running', name: 'Running FCR', unit: 'ratio', frequency: 'weekly', required: false, benchmark: 2.6 },
      ],
      outputs: [
        { materialTypeId: 'duck-meat', quantity: null, unit: 'head', routing: 'sale', qualityGrade: 'A' },
      ],
      possibleNextStages: ['harvest'],
      alerts: ['Litter management critical — ducks spill water freely', 'Target slaughter at 3.0–3.5kg (7–9 weeks)'],
    },
    {
      id: 'harvest',
      name: 'Harvest / Slaughter',
      order: 3,
      durationDays: 3,
      color: '#ef4444',
      inputs: [],
      activities: [
        { id: 'withdrawal', name: 'Feed withdrawal (4–6 hours pre-slaughter)', frequency: 'once' },
        { id: 'catch', name: 'Catching & transport to slaughter', frequency: 'once' },
      ],
      measurements: [
        { id: 'final-weight', name: 'Final Avg Weight', unit: 'kg', frequency: 'once', required: true, benchmark: 3.2 },
        { id: 'final-count', name: 'Birds Harvested', unit: 'count', frequency: 'once', required: true, benchmark: null },
        { id: 'mortality-harvest', name: 'Deaths at Catch', unit: 'count', frequency: 'once', required: false, benchmark: 0 },
      ],
      outputs: [
        { materialTypeId: 'duck-meat', quantity: null, unit: 'head', routing: 'sale', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Record total revenue and cost to calculate gross margin'],
    },
  ],
};

// ─── DUCK — LAYER ─────────────────────────────────────────────────────────────
export const layerDuckTemplate: ProductionTemplate = {
  id: 'layer-duck',
  name: 'Layer Duck (Khaki Campbell/Indian Runner)',
  shortName: 'Layer Duck',
  category: 'poultry',
  species: 'Duck',
  purpose: 'Egg Production',
  description: 'High-laying duck breeds producing 250–330 eggs/year.',
  icon: '🥚',
  color: '#f59e0b',
  tags: ['duck', 'eggs', 'layer', 'poultry'],
  materials: [
    { id: 'duck-starter-f', name: 'Duck Starter Feed', unit: 'kg', category: 'input' },
    { id: 'duck-grower-f', name: 'Duck Grower Feed', unit: 'kg', category: 'input' },
    { id: 'duck-layer-f', name: 'Duck Layer Feed', unit: 'kg', category: 'input' },
    { id: 'duck-egg', name: 'Duck Eggs', unit: 'count', category: 'output' },
  ],
  kpis: [
    { id: 'hdp', name: 'Hen-Day Production', unit: 'percent', benchmark: 80 },
    { id: 'feed-per-egg', name: 'Feed per Egg', unit: 'g', benchmark: 180 },
    { id: 'egg-weight', name: 'Avg Egg Weight', unit: 'g', benchmark: 65 },
  ],
  stages: [
    {
      id: 'rearing',
      name: 'Rearing (0–18 weeks)',
      order: 1,
      durationDays: 126,
      color: '#fbbf24',
      inputs: [
        { id: 'duck-chicks', label: 'Day-old Ducklings', unit: 'head', required: true },
        { id: 'duck-starter', label: 'Starter Feed', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'light', name: 'Manage lighting programme (12h light)', frequency: 'daily' },
        { id: 'weigh-weekly', name: 'Weekly weighing', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'body-weight', name: 'Avg Body Weight', unit: 'kg', frequency: 'weekly', required: true, benchmark: 1.5 },
        { id: 'mortality', name: 'Mortality', unit: 'count', frequency: 'weekly', required: true, benchmark: 0 },
      ],
      outputs: [],
      possibleNextStages: ['laying'],
      alerts: ['Restrict feed from 6 weeks to control body weight', 'Never let layer ducks become overweight before lay'],
    },
    {
      id: 'laying',
      name: 'Laying Production',
      order: 2,
      durationDays: 365,
      color: '#10b981',
      inputs: [
        { id: 'layer-feed', label: 'Duck Layer Feed (18% CP, 3% Ca)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'egg-collect', name: 'Collect eggs early morning (ducks lay at night)', frequency: 'daily' },
        { id: 'light-prog', name: 'Maintain 16h light programme', frequency: 'daily' },
        { id: 'hdp', name: 'Calculate Hen-Day Production', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'eggs-collected', name: 'Eggs Collected', unit: 'count', frequency: 'daily', required: true, benchmark: null },
        { id: 'hdp-pct', name: 'HDP %', unit: 'percent', frequency: 'weekly', required: true, benchmark: 80 },
        { id: 'mortality', name: 'Mortality', unit: 'count', frequency: 'weekly', required: true, benchmark: 0 },
        { id: 'feed-consumed', name: 'Feed Consumed', unit: 'kg', frequency: 'daily', required: false, benchmark: null },
      ],
      outputs: [
        { materialTypeId: 'duck-egg', quantity: null, unit: 'count', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['deplete'],
      alerts: ['Ducks lay early morning — collect before 8am', 'Duck eggs have 3× longer shelf-life vs chicken'],
    },
    {
      id: 'deplete',
      name: 'Depletion / Cull',
      order: 3,
      durationDays: 14,
      color: '#ef4444',
      inputs: [],
      activities: [{ id: 'cull', name: 'Progressive culling of low producers', frequency: 'weekly' }],
      measurements: [
        { id: 'final-hdp', name: 'Final HDP %', unit: 'percent', frequency: 'once', required: true, benchmark: null },
        { id: 'remaining', name: 'Birds Remaining', unit: 'count', frequency: 'once', required: true, benchmark: null },
      ],
      outputs: [],
      possibleNextStages: [],
      alerts: ['Cull when HDP drops below 50% consistently'],
    },
  ],
};

// ─── TURKEY ──────────────────────────────────────────────────────────────────
export const turkeyTemplate: ProductionTemplate = {
  id: 'turkey',
  name: 'Turkey (Broad-Breasted / Bronze)',
  shortName: 'Turkey',
  category: 'poultry',
  species: 'Turkey',
  purpose: 'Meat',
  description: 'Commercial turkey grow-out for festive/premium meat market. 16–22 weeks.',
  icon: '🦃',
  color: '#b45309',
  tags: ['turkey', 'meat', 'poultry'],
  materials: [
    { id: 'turkey-poult', name: 'Day-old Poults', unit: 'head', category: 'input' },
    { id: 'turkey-starter-f', name: 'Turkey Starter (28% CP)', unit: 'kg', category: 'input' },
    { id: 'turkey-grower-f', name: 'Turkey Grower (22% CP)', unit: 'kg', category: 'input' },
    { id: 'turkey-finisher-f', name: 'Turkey Finisher (18% CP)', unit: 'kg', category: 'input' },
    { id: 'turkey-meat', name: 'Turkey (live)', unit: 'head', category: 'output' },
  ],
  kpis: [
    { id: 'fcr', name: 'FCR', unit: 'ratio', benchmark: 3.2 },
    { id: 'mortality', name: 'Mortality Rate', unit: 'percent', benchmark: 5 },
    { id: 'live-weight', name: 'Live Weight', unit: 'kg', benchmark: 12 },
  ],
  stages: [
    {
      id: 'brooding',
      name: 'Brooding & Starting (0–6 weeks)',
      order: 1,
      durationDays: 42,
      color: '#fbbf24',
      inputs: [
        { id: 'poults', label: 'Day-old Poults', unit: 'head', required: true },
        { id: 'starter', label: 'Turkey Starter Feed (28% CP)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'dip', name: 'Dip poult beaks in water on arrival', frequency: 'once' },
        { id: 'temp', name: 'Monitor brooder temp (36°C wk 1, reduce 3°C/week)', frequency: 'daily' },
        { id: 'light', name: '24h light first 5 days, then reduce', frequency: 'daily' },
      ],
      measurements: [
        { id: 'temp', name: 'Brooder Temp', unit: 'celsius', frequency: 'daily', required: true, benchmark: 36 },
        { id: 'mortality', name: 'Daily Mortality', unit: 'count', frequency: 'daily', required: true, benchmark: 0 },
        { id: 'feed', name: 'Feed Consumed', unit: 'kg', frequency: 'daily', required: false, benchmark: null },
      ],
      outputs: [],
      possibleNextStages: ['growing'],
      alerts: ['Turkeys are fragile in first 2 weeks — heat critical', 'Vitamin E / Se supplement reduces starve-out'],
    },
    {
      id: 'growing',
      name: 'Growing & Finishing (6–20 weeks)',
      order: 2,
      durationDays: 98,
      color: '#22c55e',
      inputs: [
        { id: 'grower', label: 'Turkey Grower/Finisher Feed', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'weigh', name: 'Bi-weekly weighing (sample 20)', frequency: 'bi_weekly' },
        { id: 'debeaking', name: 'Beak trim if needed (reduce cannibalism)', frequency: 'once' },
        { id: 'move-outside', name: 'Move to range / grow-out house at 6 weeks', frequency: 'once' },
      ],
      measurements: [
        { id: 'avg-weight', name: 'Avg Live Weight', unit: 'kg', frequency: 'weekly', required: true, benchmark: 8 },
        { id: 'mortality', name: 'Weekly Mortality', unit: 'count', frequency: 'weekly', required: true, benchmark: 0 },
        { id: 'fcr', name: 'Cumulative FCR', unit: 'ratio', frequency: 'weekly', required: false, benchmark: 3.0 },
      ],
      outputs: [
        { materialTypeId: 'turkey-meat', quantity: null, unit: 'head', routing: 'sale', qualityGrade: 'A' },
      ],
      possibleNextStages: ['slaughter'],
      alerts: ['Males (toms) reach 10–12kg, females (hens) 6–8kg at market', 'Stagger slaughter: females at 16 weeks, toms at 20–22'],
    },
    {
      id: 'slaughter',
      name: 'Slaughter & Sale',
      order: 3,
      durationDays: 7,
      color: '#ef4444',
      inputs: [],
      activities: [
        { id: 'withdrawal', name: 'Feed withdrawal 6–8 hours', frequency: 'once' },
        { id: 'final-weights', name: 'Final live weight check', frequency: 'once' },
      ],
      measurements: [
        { id: 'final-weight', name: 'Final Avg Weight', unit: 'kg', frequency: 'once', required: true, benchmark: 12 },
        { id: 'count-harvested', name: 'Birds Harvested', unit: 'count', frequency: 'once', required: true, benchmark: null },
      ],
      outputs: [
        { materialTypeId: 'turkey-meat', quantity: null, unit: 'head', routing: 'sale', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Festive season premium — plan harvest timing for November/December'],
    },
  ],
};

// ─── GUINEA FOWL ─────────────────────────────────────────────────────────────
export const guineaFowlTemplate: ProductionTemplate = {
  id: 'guinea-fowl',
  name: 'Guinea Fowl (Helmeted)',
  shortName: 'Guinea Fowl',
  category: 'poultry',
  species: 'Guinea Fowl',
  purpose: 'Meat & Eggs',
  description: 'Hardy native African bird for meat and eggs. 12–16 week grow-out.',
  icon: '🐦',
  color: '#7c3aed',
  tags: ['guinea fowl', 'meat', 'eggs', 'indigenous'],
  materials: [
    { id: 'keet', name: 'Guinea Fowl Keets (day-old)', unit: 'head', category: 'input' },
    { id: 'gf-feed', name: 'Guinea Fowl Feed (high protein)', unit: 'kg', category: 'input' },
    { id: 'gf-meat', name: 'Guinea Fowl (live)', unit: 'head', category: 'output' },
    { id: 'gf-eggs', name: 'Guinea Fowl Eggs', unit: 'count', category: 'output' },
  ],
  kpis: [
    { id: 'mortality', name: 'Mortality Rate', unit: 'percent', benchmark: 8 },
    { id: 'fcr', name: 'FCR', unit: 'ratio', benchmark: 3.5 },
    { id: 'market-weight', name: 'Market Weight', unit: 'kg', benchmark: 1.5 },
  ],
  stages: [
    {
      id: 'brooding',
      name: 'Brooding (0–4 weeks)',
      order: 1,
      durationDays: 28,
      color: '#fbbf24',
      inputs: [
        { id: 'keets', label: 'Day-old Keets', unit: 'head', required: true },
        { id: 'starter', label: 'Starter Feed (24% CP min)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'warmth', name: 'Keep brooder at 37°C week 1, reduce weekly', frequency: 'daily' },
        { id: 'netting', name: 'Cover run with fine netting (keets escape easily)', frequency: 'once' },
      ],
      measurements: [
        { id: 'temp', name: 'Brooder Temp', unit: 'celsius', frequency: 'daily', required: true, benchmark: 37 },
        { id: 'mortality', name: 'Daily Mortality', unit: 'count', frequency: 'daily', required: true, benchmark: 0 },
      ],
      outputs: [],
      possibleNextStages: ['range'],
      alerts: ['Keets are highly strung — minimize noise and sudden movements', 'Mortality is highest in first 3 weeks'],
    },
    {
      id: 'range',
      name: 'Range Rearing (4–16 weeks)',
      order: 2,
      durationDays: 84,
      color: '#10b981',
      inputs: [
        { id: 'gf-feed-g', label: 'Grower Feed', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'range', name: 'Free range during day, house at night', frequency: 'daily' },
        { id: 'weigh', name: 'Monthly weighing', frequency: 'monthly' },
        { id: 'parasite', name: 'Check for external parasites', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'weight', name: 'Avg Live Weight', unit: 'kg', frequency: 'monthly', required: true, benchmark: 1.2 },
        { id: 'mortality', name: 'Weekly Mortality', unit: 'count', frequency: 'weekly', required: true, benchmark: 0 },
      ],
      outputs: [
        { materialTypeId: 'gf-meat', quantity: null, unit: 'head', routing: 'sale', qualityGrade: 'A' },
      ],
      possibleNextStages: ['harvest'],
      alerts: ['Guinea fowl make excellent tick/insect control on mixed farms', 'Can be noisy — consider neighbour proximity'],
    },
    {
      id: 'harvest',
      name: 'Harvest',
      order: 3,
      durationDays: 3,
      color: '#ef4444',
      inputs: [],
      activities: [{ id: 'harvest', name: 'Harvest at 1.2–1.8kg live weight', frequency: 'once' }],
      measurements: [
        { id: 'final-weight', name: 'Final Avg Weight', unit: 'kg', frequency: 'once', required: true, benchmark: 1.5 },
        { id: 'birds-out', name: 'Birds Harvested', unit: 'count', frequency: 'once', required: true, benchmark: null },
      ],
      outputs: [
        { materialTypeId: 'gf-meat', quantity: null, unit: 'head', routing: 'sale', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: [],
    },
  ],
};

// ─── QUAIL ────────────────────────────────────────────────────────────────────
export const quailTemplate: ProductionTemplate = {
  id: 'quail',
  name: 'Quail (Japanese / Coturnix)',
  shortName: 'Quail',
  category: 'poultry',
  species: 'Quail',
  purpose: 'Meat & Egg Production',
  description: 'Fast-maturing quail for eggs (6 weeks to lay) and meat. Very low space requirement.',
  icon: '🐣',
  color: '#d97706',
  tags: ['quail', 'coturnix', 'eggs', 'meat', 'small-scale'],
  materials: [
    { id: 'quail-chick', name: 'Day-old Quail Chicks', unit: 'head', category: 'input' },
    { id: 'quail-starter', name: 'Quail Starter / Game Bird Feed (28% CP)', unit: 'kg', category: 'input' },
    { id: 'quail-layer-f', name: 'Quail Layer Feed (24% CP)', unit: 'kg', category: 'input' },
    { id: 'quail-egg', name: 'Quail Eggs', unit: 'count', category: 'output' },
    { id: 'quail-meat', name: 'Quail (live / processed)', unit: 'head', category: 'output' },
  ],
  kpis: [
    { id: 'hdp', name: 'HDP', unit: 'percent', benchmark: 80 },
    { id: 'age-at-lay', name: 'Age at First Lay', unit: 'day', benchmark: 42 },
    { id: 'eggs-per-bird', name: 'Eggs / Bird / Year', unit: 'count', benchmark: 280 },
  ],
  stages: [
    {
      id: 'brooding',
      name: 'Brooding (0–3 weeks)',
      order: 1,
      durationDays: 21,
      color: '#fbbf24',
      inputs: [
        { id: 'chicks', label: 'Day-old Quail Chicks', unit: 'head', required: true },
        { id: 'starter', label: 'Game Bird Starter (28% CP)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'temp', name: 'Brooder temp 37°C week 1, reduce 3°C weekly', frequency: 'daily' },
        { id: 'cover', name: 'Keep covered — quail fly from day 2!', frequency: 'daily' },
      ],
      measurements: [
        { id: 'temp', name: 'Brooder Temp', unit: 'celsius', frequency: 'daily', required: true, benchmark: 37 },
        { id: 'mortality', name: 'Daily Mortality', unit: 'count', frequency: 'daily', required: true, benchmark: 0 },
      ],
      outputs: [],
      possibleNextStages: ['laying'],
      alerts: ['Quail need very fine-mesh enclosures — adults can squeeze through 2cm gaps', 'Males are aggressive to other males; sex-separate at 3 weeks'],
    },
    {
      id: 'laying',
      name: 'Laying Production (6 weeks – 52 weeks)',
      order: 2,
      durationDays: 322,
      color: '#10b981',
      inputs: [
        { id: 'layer-feed', label: 'Quail Layer Feed (24% CP, Ca 3%)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'collect', name: 'Collect eggs twice daily (quail eggs are tiny)', frequency: 'twice_daily' },
        { id: 'light', name: 'Maintain 16h light', frequency: 'daily' },
      ],
      measurements: [
        { id: 'eggs', name: 'Eggs Collected', unit: 'count', frequency: 'daily', required: true, benchmark: null },
        { id: 'hdp', name: 'HDP %', unit: 'percent', frequency: 'weekly', required: true, benchmark: 80 },
        { id: 'mortality', name: 'Mortality', unit: 'count', frequency: 'weekly', required: true, benchmark: 0 },
      ],
      outputs: [
        { materialTypeId: 'quail-egg', quantity: null, unit: 'count', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['deplete'],
      alerts: ['Japanese quail peak lay at 8 weeks, natural decline after 12 months', 'Male:female ratio 1:3–4 for fertile eggs'],
    },
    {
      id: 'deplete',
      name: 'Deplete / Meat Sale',
      order: 3,
      durationDays: 7,
      color: '#ef4444',
      inputs: [],
      activities: [{ id: 'cull', name: 'Cull spent layers for meat market', frequency: 'once' }],
      measurements: [
        { id: 'birds-culled', name: 'Birds Culled', unit: 'count', frequency: 'once', required: true, benchmark: null },
      ],
      outputs: [
        { materialTypeId: 'quail-meat', quantity: null, unit: 'head', routing: 'sale', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Spent quail average 150–180g each — price as specialty meat'],
    },
  ],
};

// ─── INDIGENOUS CHICKEN ───────────────────────────────────────────────────────
export const indigenousChickenTemplate: ProductionTemplate = {
  id: 'indigenous-chicken',
  name: 'Indigenous / Village Chicken',
  shortName: 'Indigenous Chicken',
  category: 'poultry',
  species: 'Chicken',
  purpose: 'Dual Purpose (Meat & Eggs)',
  description: 'Free-range indigenous chickens for local markets. Slow growth, high premium price.',
  icon: '🐔',
  color: '#92400e',
  tags: ['indigenous', 'village', 'dual-purpose', 'free-range', 'local'],
  materials: [
    { id: 'indig-chick', name: 'Indigenous Chicks', unit: 'head', category: 'input' },
    { id: 'indig-feed', name: 'Supplementary Feed (grains/mash)', unit: 'kg', category: 'input' },
    { id: 'indig-meat', name: 'Indigenous Chicken (live)', unit: 'head', category: 'output' },
    { id: 'indig-egg', name: 'Free-range Eggs', unit: 'count', category: 'output' },
  ],
  kpis: [
    { id: 'mortality', name: 'Mortality Rate', unit: 'percent', benchmark: 15 },
    { id: 'market-weight', name: 'Market Weight', unit: 'kg', benchmark: 1.8 },
    { id: 'months-to-market', name: 'Weeks to Market', unit: 'day', benchmark: 180 },
  ],
  stages: [
    {
      id: 'brooding',
      name: 'Brooding (0–8 weeks)',
      order: 1,
      durationDays: 56,
      color: '#fbbf24',
      inputs: [
        { id: 'chicks', label: 'Indigenous Chicks', unit: 'head', required: true },
        { id: 'suppl', label: 'Supplementary Feed', unit: 'kg', required: false },
      ],
      activities: [
        { id: 'warmth', name: 'Provide heat source (charcoal or electric) first 3 weeks', frequency: 'daily' },
        { id: 'vaccinate', name: 'Newcastle vaccine (eye drop) at day 7 and 21', frequency: 'once' },
        { id: 'feed', name: 'Supply supplementary grain or chick mash', frequency: 'daily' },
      ],
      measurements: [
        { id: 'mortality', name: 'Weekly Mortality', unit: 'count', frequency: 'weekly', required: true, benchmark: 0 },
        { id: 'weight', name: 'Avg Weight', unit: 'kg', frequency: 'monthly', required: false, benchmark: 0.3 },
      ],
      outputs: [],
      possibleNextStages: ['range'],
      alerts: ['Newcastle Disease is main killer — vaccinate religiously', 'Predator management critical in open range'],
    },
    {
      id: 'range',
      name: 'Range Growing (8–24 weeks)',
      order: 2,
      durationDays: 112,
      color: '#10b981',
      inputs: [
        { id: 'grain', label: 'Grain / Mash Supplement', unit: 'kg', required: false },
      ],
      activities: [
        { id: 'booster', name: 'Newcastle booster vaccine at 12 weeks', frequency: 'once' },
        { id: 'range', name: 'Supervise range access / predator checks', frequency: 'daily' },
        { id: 'monthly-count', name: 'Monthly flock count', frequency: 'monthly' },
      ],
      measurements: [
        { id: 'count', name: 'Flock Count', unit: 'count', frequency: 'monthly', required: true, benchmark: null },
        { id: 'weight', name: 'Avg Live Weight', unit: 'kg', frequency: 'monthly', required: false, benchmark: 1.2 },
        { id: 'eggs', name: 'Eggs Collected', unit: 'count', frequency: 'weekly', required: false, benchmark: null },
      ],
      outputs: [
        { materialTypeId: 'indig-egg', quantity: null, unit: 'count', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['market'],
      alerts: ['Premium local market: "village chicken" commands 2–3x price of broiler', 'Hens begin laying at 5–7 months — collect daily'],
    },
    {
      id: 'market',
      name: 'Market / Sale',
      order: 3,
      durationDays: 14,
      color: '#ef4444',
      inputs: [],
      activities: [{ id: 'sell', name: 'Progressive sale at local market / farm gate', frequency: 'weekly' }],
      measurements: [
        { id: 'sold', name: 'Birds Sold', unit: 'count', frequency: 'weekly', required: true, benchmark: null },
        { id: 'avg-price', name: 'Average Sale Price', unit: 'kg', frequency: 'weekly', required: true, benchmark: null },
      ],
      outputs: [
        { materialTypeId: 'indig-meat', quantity: null, unit: 'head', routing: 'sale', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Sell males first at 4–5 months; keep hens for eggs until 18–24 months'],
    },
  ],
};
