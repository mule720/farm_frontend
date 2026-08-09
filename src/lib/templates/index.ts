import { ProductionTemplate, ProductionCategory } from '../types';
import { broilerTemplate, layerTemplate, broilerBreederTemplate } from './poultry';
import { dairyCattleTemplate, beefCattleTemplate, piggeryTemplate } from './livestock';
import { tilapiaTemplate, catfishTemplate } from './aquaculture';
import { maizeTemplate, soybeanTemplate } from './crops';
import { tomatoTemplate, onionTemplate, mangoTemplate } from './horticulture';
import { maizeMealTemplate, dairyProcessingTemplate } from './processing';

// All built-in production templates
export const ALL_TEMPLATES: ProductionTemplate[] = [
  // Poultry
  broilerTemplate,
  layerTemplate,
  broilerBreederTemplate,
  // Livestock
  dairyCattleTemplate,
  beefCattleTemplate,
  piggeryTemplate,
  // Aquaculture
  tilapiaTemplate,
  catfishTemplate,
  // Crops
  maizeTemplate,
  soybeanTemplate,
  // Horticulture / Orchard
  tomatoTemplate,
  onionTemplate,
  mangoTemplate,
  // Processing
  maizeMealTemplate,
  dairyProcessingTemplate,
];

export function getTemplate(id: string): ProductionTemplate | undefined {
  return ALL_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: ProductionCategory): ProductionTemplate[] {
  return ALL_TEMPLATES.filter(t => t.category === category);
}

// ─── Category definitions for onboarding UI ──────────────────────────────────

export interface CategoryDef {
  id: ProductionCategory;
  label: string;
  icon: string;
  description: string;
  color: string;          // Tailwind color name
  bgClass: string;
  borderClass: string;
  textClass: string;
  templates: ProductionTemplate[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: 'poultry',
    label: 'Poultry & Birds',
    icon: '🐔',
    description: 'Chicken, duck, turkey, guinea fowl, quail, goose, pigeon...',
    color: 'amber',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-700',
    templates: getTemplatesByCategory('poultry'),
  },
  {
    id: 'livestock',
    label: 'Livestock',
    icon: '🐄',
    description: 'Cattle, goats, sheep, pigs, rabbits, horses, camels...',
    color: 'orange',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-300',
    textClass: 'text-orange-700',
    templates: getTemplatesByCategory('livestock'),
  },
  {
    id: 'aquaculture',
    label: 'Aquaculture',
    icon: '🐟',
    description: 'Tilapia, catfish, trout, carp, shrimp, aquaponics...',
    color: 'blue',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-300',
    textClass: 'text-blue-700',
    templates: getTemplatesByCategory('aquaculture'),
  },
  {
    id: 'crops',
    label: 'Crops & Grains',
    icon: '🌽',
    description: 'Maize, wheat, soybean, sorghum, rice, sunflower...',
    color: 'yellow',
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-300',
    textClass: 'text-yellow-700',
    templates: getTemplatesByCategory('crops'),
  },
  {
    id: 'horticulture',
    label: 'Horticulture',
    icon: '🍅',
    description: 'Vegetables, herbs, flowers, nursery plants...',
    color: 'green',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-300',
    textClass: 'text-green-700',
    templates: getTemplatesByCategory('horticulture'),
  },
  {
    id: 'greenhouse',
    label: 'Greenhouse',
    icon: '🏡',
    description: 'Climate-controlled, hydroponic, shade house...',
    color: 'emerald',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-300',
    textClass: 'text-emerald-700',
    templates: getTemplatesByCategory('greenhouse'),
  },
  {
    id: 'orchard',
    label: 'Orchards',
    icon: '🥭',
    description: 'Mango, avocado, citrus, apple, banana, guava...',
    color: 'orange',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-300',
    textClass: 'text-orange-700',
    templates: getTemplatesByCategory('orchard'),
  },
  {
    id: 'apiary',
    label: 'Apiary',
    icon: '🐝',
    description: 'Beekeeping, honey and wax production...',
    color: 'yellow',
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-300',
    textClass: 'text-yellow-700',
    templates: getTemplatesByCategory('apiary'),
  },
  {
    id: 'mushroom',
    label: 'Mushroom',
    icon: '🍄',
    description: 'Oyster, shiitake, button, portobello...',
    color: 'stone',
    bgClass: 'bg-stone-50',
    borderClass: 'border-stone-300',
    textClass: 'text-stone-700',
    templates: getTemplatesByCategory('mushroom'),
  },
  {
    id: 'processing',
    label: 'Processing',
    icon: '🏭',
    description: 'Milling, dairy processing, meat, juice, packaging, feed...',
    color: 'slate',
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-300',
    textClass: 'text-slate-700',
    templates: getTemplatesByCategory('processing'),
  },
  {
    id: 'services',
    label: 'Agricultural Services',
    icon: '🔧',
    description: 'Consulting, vet services, equipment hire, transport, lab...',
    color: 'violet',
    bgClass: 'bg-violet-50',
    borderClass: 'border-violet-300',
    textClass: 'text-violet-700',
    templates: getTemplatesByCategory('services'),
  },
];

export {
  broilerTemplate, layerTemplate, broilerBreederTemplate,
  dairyCattleTemplate, beefCattleTemplate, piggeryTemplate,
  tilapiaTemplate, catfishTemplate,
  maizeTemplate, soybeanTemplate,
  tomatoTemplate, onionTemplate, mangoTemplate,
  maizeMealTemplate, dairyProcessingTemplate,
};
