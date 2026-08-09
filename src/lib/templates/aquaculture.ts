import { ProductionTemplate } from '../types';

export const tilapiaTemplate: ProductionTemplate = {
  id: 'tilapia',
  name: 'Tilapia (Pond)',
  shortName: 'Tilapia',
  category: 'aquaculture',
  species: 'Tilapia',
  environment: 'pond',
  description: 'Pond-based tilapia grow-out — from fingerlings to harvest.',
  icon: '🐟',
  color: 'blue',
  tags: ['aquaculture', 'tilapia', 'pond', 'fish'],
  materials: [
    { id: 'fingerling', name: 'Fingerlings', unit: 'count', category: 'input' },
    { id: 'fish_feed', name: 'Fish Feed (Pellets)', unit: 'kg', category: 'input' },
    { id: 'lime', name: 'Lime / Pond Inputs', unit: 'kg', category: 'input' },
    { id: 'harvested_fish', name: 'Harvested Fish', unit: 'kg', category: 'output', perishable: true, requiresColdChain: true },
    { id: 'fish_mortality', name: 'Mortality', unit: 'count', category: 'waste' },
  ],
  kpis: [
    { id: 'fcr', name: 'Feed Conversion Ratio', unit: 'ratio', goodDirection: 'down', benchmark: 1.6 },
    { id: 'survival_rate', name: 'Survival Rate', unit: '%', goodDirection: 'up', benchmark: 85 },
    { id: 'avg_body_weight', name: 'Average Body Weight', unit: 'g', goodDirection: 'up', benchmark: 400 },
    { id: 'yield_per_m2', name: 'Yield per m²', unit: 'kg', goodDirection: 'up', benchmark: 3 },
    { id: 'cost_per_kg', name: 'Cost per kg', unit: 'ZMW', goodDirection: 'down' },
  ],
  stages: [
    {
      id: 'pond_prep',
      name: 'Pond Preparation',
      typicalDurationDays: 14,
      color: 'slate',
      inputs: [
        { id: 'lime', label: 'Lime', unit: 'kg', required: true },
      ],
      activities: ['Drain and dry pond', 'Apply lime', 'Fertilise with manure', 'Fill pond', 'Water quality test'],
      measurements: [
        { id: 'ph', name: 'Water pH', unit: 'ratio', frequency: 'daily', required: true, benchmark: { min: 6.5, max: 8.5 } },
        { id: 'do', name: 'Dissolved Oxygen', unit: 'ratio', frequency: 'daily', required: true, benchmark: { min: 5 } },
        { id: 'temp', name: 'Water Temperature', unit: 'celsius', frequency: 'daily', required: true, benchmark: { min: 22, max: 30 } },
      ],
      outputs: [],
      possibleNextStages: ['stocking'],
    },
    {
      id: 'stocking',
      name: 'Stocking',
      typicalDurationDays: 1,
      color: 'cyan',
      inputs: [
        { id: 'fingerling', label: 'Fingerlings', unit: 'count', required: true },
      ],
      activities: ['Acclimatise fish', 'Count and weigh sample', 'Stock at recommended density', 'Begin feeding programme'],
      measurements: [
        { id: 'stocking_count', name: 'Total Stocked', unit: 'count', frequency: 'per_event', required: true },
        { id: 'avg_weight', name: 'Average Fingerling Weight', unit: 'g', frequency: 'per_event', required: true },
        { id: 'water_temp', name: 'Water Temperature', unit: 'celsius', frequency: 'per_event', required: true },
      ],
      outputs: [],
      possibleNextStages: ['grow_out'],
    },
    {
      id: 'grow_out',
      name: 'Grow-out',
      typicalDurationDays: 150,
      color: 'blue',
      inputs: [
        { id: 'fish_feed', label: 'Fish Feed', unit: 'kg', required: true },
      ],
      activities: ['Feed twice daily (3–5% body weight)', 'Bi-weekly sampling', 'Water quality management', 'Aeration if needed'],
      measurements: [
        { id: 'feed_intake', name: 'Daily Feed Given', unit: 'kg', frequency: 'daily', required: true },
        { id: 'mortality', name: 'Mortality', unit: 'count', frequency: 'daily', required: true },
        { id: 'avg_weight', name: 'Average Body Weight (sample)', unit: 'g', frequency: 'weekly', required: true },
        { id: 'ph', name: 'Water pH', unit: 'ratio', frequency: 'daily', required: true, benchmark: { min: 6.5, max: 8.5 } },
        { id: 'do', name: 'Dissolved Oxygen', unit: 'ratio', frequency: 'daily', required: true, benchmark: { min: 5 } },
        { id: 'temp', name: 'Water Temp', unit: 'celsius', frequency: 'daily', required: false, benchmark: { min: 22, max: 30 } },
      ],
      outputs: [],
      possibleNextStages: ['harvest'],
      alerts: [
        { metric: 'do', condition: 'below', threshold: 4, message: 'Dissolved oxygen critical — add aeration immediately.', severity: 'critical' },
        { metric: 'mortality', condition: 'above', threshold: 50, message: 'High mortality — check water quality and disease.', severity: 'critical' },
        { metric: 'ph', condition: 'above', threshold: 9, message: 'pH too high — risk of ammonia toxicity.', severity: 'warning' },
      ],
    },
    {
      id: 'harvest',
      name: 'Harvest',
      typicalDurationDays: 2,
      color: 'green',
      inputs: [],
      activities: ['Drain pond partially', 'Seine net harvest', 'Weigh total catch', 'Grade by size', 'Ice and pack', 'Dispatch to market'],
      measurements: [
        { id: 'total_kg', name: 'Total Harvest (kg)', unit: 'kg', frequency: 'per_event', required: true },
        { id: 'total_count', name: 'Total Fish Counted', unit: 'count', frequency: 'per_event', required: true },
        { id: 'avg_weight', name: 'Average Harvest Weight', unit: 'g', frequency: 'per_event', required: true },
        { id: 'price_per_kg', name: 'Sale Price per kg', unit: 'kg', frequency: 'per_event', required: true },
      ],
      outputs: [
        { id: 'harvested_fish', label: 'Harvested Fish', unit: 'kg', routingOptions: ['sale', 'processing', 'inventory'] },
      ],
      possibleNextStages: [],
    },
  ],
};

export const catfishTemplate: ProductionTemplate = {
  id: 'catfish',
  name: 'Catfish (Tank / Pond)',
  shortName: 'Catfish',
  category: 'aquaculture',
  species: 'Catfish',
  environment: 'tank',
  description: 'Catfish production in tanks or earthen ponds.',
  icon: '🐠',
  color: 'indigo',
  tags: ['aquaculture', 'catfish', 'tank', 'fish'],
  materials: [
    { id: 'catfish_fingerling', name: 'Catfish Fingerlings', unit: 'count', category: 'input' },
    { id: 'catfish_feed', name: 'Catfish Feed', unit: 'kg', category: 'input' },
    { id: 'catfish_harvest', name: 'Harvested Catfish', unit: 'kg', category: 'output', perishable: true, requiresColdChain: true },
  ],
  kpis: [
    { id: 'fcr', name: 'Feed Conversion Ratio', unit: 'ratio', goodDirection: 'down', benchmark: 1.4 },
    { id: 'survival_rate', name: 'Survival Rate', unit: '%', goodDirection: 'up', benchmark: 80 },
    { id: 'avg_weight', name: 'Average Harvest Weight', unit: 'kg', goodDirection: 'up', benchmark: 1.2 },
  ],
  stages: [
    {
      id: 'grow_out',
      name: 'Grow-out',
      typicalDurationDays: 120,
      color: 'indigo',
      inputs: [
        { id: 'catfish_fingerling', label: 'Fingerlings', unit: 'count', required: true },
        { id: 'catfish_feed', label: 'Feed', unit: 'kg', required: true },
      ],
      activities: ['Feed twice daily', 'Water quality monitoring', 'Bi-weekly sampling', 'Aeration management'],
      measurements: [
        { id: 'feed_given', name: 'Daily Feed Given', unit: 'kg', frequency: 'daily', required: true },
        { id: 'mortality', name: 'Mortality', unit: 'count', frequency: 'daily', required: true },
        { id: 'avg_weight', name: 'Average Weight (sample)', unit: 'g', frequency: 'weekly', required: true },
        { id: 'do', name: 'Dissolved Oxygen', unit: 'ratio', frequency: 'daily', required: true },
      ],
      outputs: [
        { id: 'catfish_harvest', label: 'Harvested Catfish', unit: 'kg', routingOptions: ['sale', 'processing', 'inventory'] },
      ],
      possibleNextStages: [],
    },
  ],
};
