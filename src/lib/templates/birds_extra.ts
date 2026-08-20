// ─────────────────────────────────────────────────────────────────────────────
// Extra Bird Templates: Goose, Ostrich, Pigeon/Squab, Peacock
// ─────────────────────────────────────────────────────────────────────────────
import type { ProductionTemplate } from '../types';

// ─── GOOSE ───────────────────────────────────────────────────────────────────
export const gooseTemplate: ProductionTemplate = {
  id: 'goose',
  name: 'Goose (Meat & Foie Gras)',
  shortName: 'Goose',
  category: 'poultry',
  species: 'Goose',
  purpose: 'Meat, Fat, Feathers',
  description: 'Embden or Toulouse geese for meat, fat, and feather production. Excellent foragers; low-input system suitable for smallholders.',
  icon: '🪿',
  color: '#f0f9ff',
  tags: ['goose', 'waterfowl', 'meat', 'fat', 'feathers', 'foraging'],
  materials: [
    { id: 'gosling', name: 'Day-Old Goslings', unit: 'count', category: 'input' },
    { id: 'goose-starter', name: 'Waterfowl Starter Feed', unit: 'kg', category: 'input' },
    { id: 'goose-grower', name: 'Grower / Finisher Feed', unit: 'kg', category: 'input' },
    { id: 'goose-carcass', name: 'Dressed Goose Carcass', unit: 'kg', category: 'output' },
    { id: 'goose-fat', name: 'Rendered Goose Fat', unit: 'kg', category: 'output' },
    { id: 'goose-feathers', name: 'Down Feathers', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'slaughter-weight', name: 'Slaughter Weight', unit: 'kg', benchmark: 5.5 },
    { id: 'feed-conversion', name: 'Feed Conversion Ratio', unit: 'ratio', benchmark: 3.2 },
    { id: 'mortality', name: 'Mortality Rate', unit: 'percent', benchmark: 5 },
    { id: 'dress-pct', name: 'Dressing %', unit: 'percent', benchmark: 72 },
  ],
  stages: [
    {
      id: 'brooding',
      name: 'Brooding (0–3 weeks)',
      order: 1, durationDays: 21, color: '#fef9c3',
      inputs: [
        { id: 'goslings', label: 'Goslings', unit: 'count', required: true },
        { id: 'starter', label: 'Starter Feed (20% CP)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'brood-heat', name: 'Maintain brooder temp 32°C week 1, reduce 3°C/week', frequency: 'daily' },
        { id: 'water', name: 'Provide fresh water — goslings drink heavily', frequency: 'daily' },
        { id: 'litter', name: 'Change litter daily to prevent wet conditions', frequency: 'daily' },
        { id: 'pasture', name: 'Introduce to pasture after week 2', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'body-weight', name: 'Average Body Weight', unit: 'kg', frequency: 'weekly', required: true, benchmark: { target: 1.0 } },
        { id: 'mortality', name: 'Mortalities', unit: 'count', frequency: 'daily', required: true },
        { id: 'feed-intake', name: 'Daily Feed Intake', unit: 'kg', frequency: 'daily', required: false },
      ],
      outputs: [], possibleNextStages: ['growing'], alerts: ['Goslings are very cold-sensitive in week 1', 'Never allow brooder to get wet'],
    },
    {
      id: 'growing',
      name: 'Growing & Grazing (3–12 weeks)',
      order: 2, durationDays: 63, color: '#dcfce7',
      inputs: [
        { id: 'grower-feed', label: 'Grower Feed', unit: 'kg', required: true },
        { id: 'pasture-area', label: 'Grazing Pasture', unit: 'ha', required: false },
      ],
      activities: [
        { id: 'graze', name: 'Allow free-range grazing 6+ hours daily', frequency: 'daily' },
        { id: 'supplement', name: 'Supplement grain when pasture is short', frequency: 'daily' },
        { id: 'weigh', name: 'Weekly weight checks', frequency: 'weekly' },
        { id: 'deworming', name: 'Deworm at week 6 if pasture-raised', frequency: 'once' },
      ],
      measurements: [
        { id: 'body-weight', name: 'Average Body Weight', unit: 'kg', frequency: 'weekly', required: true, benchmark: { target: 3.5 } },
        { id: 'mortality', name: 'Mortalities', unit: 'count', frequency: 'weekly', required: true },
        { id: 'fcr', name: 'Feed Conversion Ratio', unit: 'ratio', frequency: 'weekly', required: false, benchmark: { target: 3.2 } },
      ],
      outputs: [], possibleNextStages: ['finishing'], alerts: ['Watch for angel wing deformity if feed protein is too high'],
    },
    {
      id: 'finishing',
      name: 'Finishing & Harvest (12–16 weeks)',
      order: 3, durationDays: 28, color: '#fef3c7',
      inputs: [
        { id: 'finisher', label: 'Finisher Feed (high energy)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'high-energy', name: 'Switch to high-energy finisher ration', frequency: 'once' },
        { id: 'restrict-range', name: 'Reduce range activity to increase fat deposition', frequency: 'daily' },
        { id: 'final-weigh', name: 'Final live weight assessment', frequency: 'weekly' },
        { id: 'slaughter-plan', name: 'Plan slaughter date and transport', frequency: 'once' },
      ],
      measurements: [
        { id: 'body-weight', name: 'Live Weight', unit: 'kg', frequency: 'weekly', required: true, benchmark: { target: 5.5 } },
        { id: 'fat-score', name: 'Fat Score (1–5)', unit: 'score', frequency: 'weekly', required: false, benchmark: { target: 3 } },
      ],
      outputs: [
        { materialTypeId: 'goose-carcass', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
        { materialTypeId: 'goose-feathers', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: [], alerts: ['Withhold feed 8–12 hours before slaughter'],
    },
  ],
};

// ─── OSTRICH ─────────────────────────────────────────────────────────────────
export const ostrichTemplate: ProductionTemplate = {
  id: 'ostrich',
  name: 'Ostrich',
  shortName: 'Ostrich',
  category: 'poultry',
  species: 'Ostrich',
  purpose: 'Meat, Leather, Feathers, Eggs',
  description: 'Commercial ostrich farming for premium meat, leather, and feathers. Long production cycle; high-value outputs.',
  icon: '🦢',
  color: '#fef9c3',
  tags: ['ostrich', 'ratite', 'leather', 'meat', 'feathers', 'premium'],
  materials: [
    { id: 'ostrich-chick', name: 'Day-Old Ostrich Chick', unit: 'count', category: 'input' },
    { id: 'chick-pellet', name: 'Ostrich Chick Pellets', unit: 'kg', category: 'input' },
    { id: 'ostrich-pellet', name: 'Ostrich Grower Pellets', unit: 'kg', category: 'input' },
    { id: 'ostrich-meat', name: 'Ostrich Meat', unit: 'kg', category: 'output' },
    { id: 'ostrich-hide', name: 'Ostrich Leather Hide', unit: 'count', category: 'output' },
    { id: 'ostrich-feathers', name: 'Decorative Feathers', unit: 'kg', category: 'output' },
  ],
  kpis: [
    { id: 'slaughter-weight', name: 'Slaughter Weight (14 months)', unit: 'kg', benchmark: 90 },
    { id: 'meat-yield', name: 'Meat Yield %', unit: 'percent', benchmark: 40 },
    { id: 'chick-mortality', name: 'Chick Mortality (0–3 months)', unit: 'percent', benchmark: 10 },
    { id: 'hide-grade', name: 'Prime Hide %', unit: 'percent', benchmark: 70 },
  ],
  stages: [
    {
      id: 'chick-rearing', name: 'Chick Rearing (0–3 months)', order: 1, durationDays: 90, color: '#fef9c3',
      inputs: [
        { id: 'chicks', label: 'Ostrich Chicks', unit: 'count', required: true },
        { id: 'chick-feed', label: 'Chick Starter Pellets', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'warm', name: 'Maintain heated brooder pen (30°C at floor level)', frequency: 'daily' },
        { id: 'feed', name: 'Feed chick pellets (20% CP) ad lib', frequency: 'daily' },
        { id: 'water', name: 'Fresh clean water at all times', frequency: 'daily' },
        { id: 'health-check', name: 'Daily health and behaviour checks', frequency: 'daily' },
        { id: 'vaccinate', name: 'Newcastle disease vaccination at 4 weeks', frequency: 'once' },
      ],
      measurements: [
        { id: 'weight', name: 'Average Body Weight', unit: 'kg', frequency: 'weekly', required: true, benchmark: { target: 15 } },
        { id: 'mortality', name: 'Mortalities', unit: 'count', frequency: 'daily', required: true },
      ],
      outputs: [], possibleNextStages: ['growing'],
      alerts: ['Chick mortality is highest 0–3 weeks — watch for hypothermia and impaction', 'Never feed alfalfa to young chicks — causes gut impaction'],
    },
    {
      id: 'growing', name: 'Growing (3–10 months)', order: 2, durationDays: 210, color: '#dcfce7',
      inputs: [
        { id: 'grower-pellet', label: 'Grower Pellets', unit: 'kg', required: true },
        { id: 'roughage', label: 'Lucerne / Hay', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'feed', name: 'Feed 2× daily — pellets + roughage', frequency: 'daily' },
        { id: 'weigh', name: 'Monthly weight checks', frequency: 'monthly' },
        { id: 'health', name: 'Weekly health checks, remove lame birds', frequency: 'weekly' },
        { id: 'deworm', name: 'Deworm at 6 months', frequency: 'once' },
      ],
      measurements: [
        { id: 'weight', name: 'Average Live Weight', unit: 'kg', frequency: 'monthly', required: true, benchmark: { target: 60 } },
        { id: 'mortality', name: 'Mortalities', unit: 'count', frequency: 'monthly', required: true },
      ],
      outputs: [], possibleNextStages: ['finishing'],
      alerts: ['Ostriches are fence-pacing prone — maintain 2.5 m high perimeter fences'],
    },
    {
      id: 'finishing', name: 'Finishing & Slaughter (10–14 months)', order: 3, durationDays: 120, color: '#fde68a',
      inputs: [
        { id: 'finisher', label: 'Finisher Pellets (high energy)', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'high-energy', name: 'Increase grain/energy in ration', frequency: 'daily' },
        { id: 'final-grade', name: 'Grade and assess slaughter readiness', frequency: 'monthly' },
        { id: 'slaughter', name: 'Arrange certified slaughter facility', frequency: 'once' },
      ],
      measurements: [
        { id: 'weight', name: 'Live Weight', unit: 'kg', frequency: 'monthly', required: true, benchmark: { target: 90 } },
        { id: 'hide-score', name: 'Hide Quality Score (1–5)', unit: 'score', frequency: 'once', required: false },
      ],
      outputs: [
        { materialTypeId: 'ostrich-meat', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
        { materialTypeId: 'ostrich-hide', quantity: null, unit: 'count', routing: 'inventory', qualityGrade: 'A' },
        { materialTypeId: 'ostrich-feathers', quantity: null, unit: 'kg', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Only use certified ostrich abattoirs — hide quality depends on correct skinning technique'],
    },
  ],
};

// ─── PIGEON / SQUAB ──────────────────────────────────────────────────────────
export const pigeonTemplate: ProductionTemplate = {
  id: 'pigeon-squab',
  name: 'Pigeon (Squab Production)',
  shortName: 'Squab Pigeon',
  category: 'poultry',
  species: 'Pigeon',
  purpose: 'Squab Meat, High-Value Niche Market',
  description: 'Breeding pairs produce squabs for gourmet market. Each pair yields 10–18 squabs/year. Low-space, high-value enterprise.',
  icon: '🕊️',
  color: '#ede9fe',
  tags: ['pigeon', 'squab', 'gourmet', 'niche', 'breeding pairs', 'urban farming'],
  materials: [
    { id: 'breeding-pair', name: 'Breeding Pair', unit: 'pair', category: 'input' },
    { id: 'pigeon-feed', name: 'Grain Mix (maize, wheat, peas)', unit: 'kg', category: 'input' },
    { id: 'grit', name: 'Grit / Oyster Shell', unit: 'kg', category: 'input' },
    { id: 'squab', name: 'Dressed Squab (28 days)', unit: 'count', category: 'output' },
  ],
  kpis: [
    { id: 'squabs-pair-year', name: 'Squabs per Pair per Year', unit: 'count', benchmark: 14 },
    { id: 'squab-weight', name: 'Squab Weight at 28 days', unit: 'g', benchmark: 500 },
    { id: 'pair-mortality', name: 'Annual Pair Mortality', unit: 'percent', benchmark: 5 },
    { id: 'fertility-rate', name: 'Egg Fertility Rate', unit: 'percent', benchmark: 90 },
  ],
  stages: [
    {
      id: 'setup', name: 'Loft Set-Up & Pairing', order: 1, durationDays: 21, color: '#ede9fe',
      inputs: [
        { id: 'pairs', label: 'Breeding Pairs', unit: 'pair', required: true },
        { id: 'nest-bowls', label: 'Nest Bowls / Nest Boxes', unit: 'count', required: true },
      ],
      activities: [
        { id: 'cage-setup', name: 'Install individual cage dividers (1 pair per 0.5 m²)', frequency: 'once' },
        { id: 'nesting', name: 'Provide 2 nest bowls per pair with straw', frequency: 'once' },
        { id: 'pairing', name: 'Introduce pairs and monitor bonding', frequency: 'daily' },
        { id: 'water', name: 'Fresh water and bath pan daily', frequency: 'daily' },
      ],
      measurements: [
        { id: 'pairs-bonded', name: 'Bonded Pairs', unit: 'count', frequency: 'weekly', required: true, benchmark: null },
        { id: 'first-eggs', name: 'Pairs with First Eggs', unit: 'count', frequency: 'weekly', required: false },
      ],
      outputs: [], possibleNextStages: ['production'],
      alerts: ['Pigeons mate for life — keep established pairs together', 'Allow 3 weeks bonding before expecting eggs'],
    },
    {
      id: 'production', name: 'Continuous Production', order: 2, durationDays: 365, color: '#c4b5fd',
      inputs: [
        { id: 'grain', label: 'Grain Mix (maize 50%, wheat 30%, peas 20%)', unit: 'kg', required: true },
        { id: 'grit', label: 'Grit + Mineral Block', unit: 'kg', required: true },
      ],
      activities: [
        { id: 'feed', name: 'Feed grain mix 2× daily — increase during breeding', frequency: 'daily' },
        { id: 'water', name: 'Clean water and weekly bath day', frequency: 'daily' },
        { id: 'collect', name: 'Mark eggs on day 2; remove infertile eggs day 8', frequency: 'daily' },
        { id: 'squab-check', name: 'Check squab development daily from hatch', frequency: 'daily' },
        { id: 'harvest', name: 'Harvest squabs at 28 days (pre-fledge)', frequency: 'daily' },
        { id: 'health', name: 'Monthly health inspection — check for pigeon pox, canker', frequency: 'monthly' },
      ],
      measurements: [
        { id: 'eggs-set', name: 'Eggs Set', unit: 'count', frequency: 'weekly', required: true },
        { id: 'eggs-fertile', name: 'Fertile Eggs', unit: 'count', frequency: 'weekly', required: false },
        { id: 'squabs-harvested', name: 'Squabs Harvested', unit: 'count', frequency: 'weekly', required: true },
        { id: 'squab-weight', name: 'Average Squab Weight (28d)', unit: 'g', frequency: 'weekly', required: false, benchmark: { target: 500 } },
      ],
      outputs: [
        { materialTypeId: 'squab', quantity: null, unit: 'count', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['production'],
      alerts: ['Harvest squabs at exactly 28 days — any later and they fledge and lose market value', 'Pigeon pox and canker (trichomoniasis) are main health threats — vaccinate annually'],
    },
  ],
};
