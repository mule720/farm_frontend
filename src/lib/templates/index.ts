import { ProductionTemplate, ProductionCategory } from '../types';

// ─── Existing poultry ─────────────────────────────────────────────────────────
import { broilerTemplate, layerTemplate, broilerBreederTemplate } from './poultry';
// ─── Additional birds ─────────────────────────────────────────────────────────
import {
  meatDuckTemplate, layerDuckTemplate, turkeyTemplate,
  guineaFowlTemplate, quailTemplate, indigenousChickenTemplate,
} from './birds';
// ─── Extra birds ──────────────────────────────────────────────────────────────
import { gooseTemplate, ostrichTemplate, pigeonTemplate } from './birds_extra';

// ─── Existing livestock ───────────────────────────────────────────────────────
import { dairyCattleTemplate, beefCattleTemplate, piggeryTemplate } from './livestock';
// ─── Additional livestock ─────────────────────────────────────────────────────
import {
  meatGoatTemplate, dairyGoatTemplate, meatSheepTemplate, rabbitTemplate,
} from './livestock_extra';

// ─── Existing aquaculture ─────────────────────────────────────────────────────
import { tilapiaTemplate, catfishTemplate } from './aquaculture';
// ─── Extra aquaculture ────────────────────────────────────────────────────────
import {
  shrimpTemplate, rainbowTroutTemplate, commonCarpTemplate, aquaponicsTemplate,
} from './aquaculture_extra';

// ─── Existing crops (maize only; soybean replaced by richer version below) ───
import { maizeTemplate } from './crops';
// ─── Additional crops ─────────────────────────────────────────────────────────
import {
  riceTemplate, cassavaTemplate, groundnutTemplate, sweetPotatoTemplate,
  sorghumTemplate, sunflowerTemplate, soybeanTemplate,
} from './crops_extra';
// ─── Extra crops 2 ────────────────────────────────────────────────────────────
import {
  wheatTemplate, fingerMilletTemplate, pearlMilletTemplate, irishPotatoTemplate,
  cowpeaTemplate, sugarcaneTemplate, yamTemplate,
} from './crops_extra2';

// ─── Existing horticulture (tomato + onion only; mango replaced below) ────────
import { tomatoTemplate, onionTemplate } from './horticulture';
// ─── Additional horticulture & orchard ───────────────────────────────────────
import {
  cabbageTemplate, pepperTemplate, cucumberTemplate,
  mangoTemplate, citrusTemplate, bananaTemplate, avocadoTemplate,
} from './horticulture_extra';
// ─── Extra horticulture 2 ────────────────────────────────────────────────────
import {
  carrotTemplate, kaleTemplate, watermelonTemplate, pumpkinTemplate,
  garlicTemplate, broccoliTemplate, eggplantTemplate,
} from './horticulture_extra2';

// ─── Greenhouse ───────────────────────────────────────────────────────────────
import {
  cutRoseTemplate, herbsTemplate, hydroponicLettuceTemplate,
  greenhousePepperTemplate, strawberryTemplate,
} from './greenhouse';

// ─── Orchards ────────────────────────────────────────────────────────────────
import {
  guavaTemplate, pawpawTemplate, passionFruitTemplate,
  macadamiaTemplate, moringaTemplate,
} from './orchard_extra';

// ─── Apiary ──────────────────────────────────────────────────────────────────
import { honeybeeTemplate, topBarHiveTemplate } from './apiary';
// ─── Insects & Worms ─────────────────────────────────────────────────────────
import {
  bsfTemplate, cricketFarmingTemplate, mealwormTemplate,
  silkwormTemplate, vermicultureTemplate, snailFarmingTemplate,
  stinglessBeeTemplate,
} from './insects_worms';

// ─── Aquatic Plants & Algae ───────────────────────────────────────────────────
import { seaweedTemplate, spirulinaTemplate } from './aquatic_plants';

// ─── Forestry & Agroforestry ─────────────────────────────────────────────────
import { timberForestryTemplate, agroforestryTemplate } from './forestry';

// ─── Specialised Livestock (deer, camelids) ───────────────────────────────────
import { deerTemplate, camelidTemplate } from './livestock_extra2';

// ─── Mushroom ─────────────────────────────────────────────────────────────────
import { oysterMushroomTemplate, buttonMushroomTemplate } from './mushroom';

// ─── Processing ───────────────────────────────────────────────────────────────
import { maizeMealTemplate, dairyProcessingTemplate } from './processing';
// ─── Extra processing ────────────────────────────────────────────────────────
import {
  honeyProcessingTemplate, cassavaProcessingTemplate,
  fruitJuiceTemplate, feedMillTemplate,
} from './processing_extra';

// ─── Services ────────────────────────────────────────────────────────────────
import {
  vetServicesTemplate, agriConsultingTemplate, equipmentHireTemplate,
  farmerTrainingTemplate, labTestingTemplate,
} from './services';

// ─────────────────────────────────────────────────────────────────────────────
// Master template registry
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_TEMPLATES: ProductionTemplate[] = [
  // ── Poultry & Birds ──
  broilerTemplate,
  layerTemplate,
  broilerBreederTemplate,
  meatDuckTemplate,
  layerDuckTemplate,
  turkeyTemplate,
  guineaFowlTemplate,
  quailTemplate,
  indigenousChickenTemplate,
  gooseTemplate,
  ostrichTemplate,
  pigeonTemplate,

  // ── Livestock ──
  dairyCattleTemplate,
  beefCattleTemplate,
  piggeryTemplate,
  meatGoatTemplate,
  dairyGoatTemplate,
  meatSheepTemplate,
  rabbitTemplate,
  deerTemplate,
  camelidTemplate,

  // ── Aquaculture ──
  tilapiaTemplate,
  catfishTemplate,
  shrimpTemplate,
  rainbowTroutTemplate,
  commonCarpTemplate,
  aquaponicsTemplate,

  // ── Crops ──
  maizeTemplate,
  riceTemplate,
  soybeanTemplate,
  sorghumTemplate,
  sunflowerTemplate,
  groundnutTemplate,
  cassavaTemplate,
  sweetPotatoTemplate,
  wheatTemplate,
  fingerMilletTemplate,
  pearlMilletTemplate,
  irishPotatoTemplate,
  cowpeaTemplate,
  sugarcaneTemplate,
  yamTemplate,

  // ── Horticulture / Vegetables ──
  tomatoTemplate,
  onionTemplate,
  cabbageTemplate,
  pepperTemplate,
  cucumberTemplate,
  carrotTemplate,
  kaleTemplate,
  watermelonTemplate,
  pumpkinTemplate,
  garlicTemplate,
  broccoliTemplate,
  eggplantTemplate,

  // ── Greenhouse ──
  cutRoseTemplate,
  herbsTemplate,
  hydroponicLettuceTemplate,
  greenhousePepperTemplate,
  strawberryTemplate,

  // ── Orchard & Tree Fruit ──
  mangoTemplate,
  avocadoTemplate,
  citrusTemplate,
  bananaTemplate,
  guavaTemplate,
  pawpawTemplate,
  passionFruitTemplate,
  macadamiaTemplate,
  moringaTemplate,

  // ── Apiary & Bees ──
  honeybeeTemplate,
  topBarHiveTemplate,
  stinglessBeeTemplate,

  // ── Insects & Worms ──
  bsfTemplate,
  cricketFarmingTemplate,
  mealwormTemplate,
  silkwormTemplate,
  vermicultureTemplate,
  snailFarmingTemplate,

  // ── Aquatic Plants & Algae ──
  seaweedTemplate,
  spirulinaTemplate,

  // ── Forestry & Agroforestry ──
  timberForestryTemplate,
  agroforestryTemplate,

  // ── Mushroom ──
  oysterMushroomTemplate,
  buttonMushroomTemplate,

  // ── Processing ──
  maizeMealTemplate,
  dairyProcessingTemplate,
  honeyProcessingTemplate,
  cassavaProcessingTemplate,
  fruitJuiceTemplate,
  feedMillTemplate,

  // ── Agricultural Services ──
  vetServicesTemplate,
  agriConsultingTemplate,
  equipmentHireTemplate,
  farmerTrainingTemplate,
  labTestingTemplate,
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

// Templates the company has customised and saved. Kept in a module registry
// (filled by the org store) so every existing getTemplate() caller finds them.
let CUSTOM_TEMPLATES: ProductionTemplate[] = [];

export function setCustomTemplates(list: ProductionTemplate[] | undefined) {
  CUSTOM_TEMPLATES = list ?? [];
}

export function getCustomTemplates(): ProductionTemplate[] {
  return CUSTOM_TEMPLATES;
}

export function getTemplate(id: string): ProductionTemplate | undefined {
  return ALL_TEMPLATES.find(t => t.id === id) ?? CUSTOM_TEMPLATES.find(t => t.id === id);
}

/** The built-in a template descends from (itself, if it is built-in). */
export function baseTemplateOf(t: ProductionTemplate): ProductionTemplate {
  return (t.baseTemplateId && ALL_TEMPLATES.find(b => b.id === t.baseTemplateId)) || t;
}

/** The built-in plus every saved version of it — what the farmer can switch between. */
export function templateFamily(t: ProductionTemplate): ProductionTemplate[] {
  const base = baseTemplateOf(t);
  return [base, ...CUSTOM_TEMPLATES.filter(c => c.baseTemplateId === base.id)];
}

export function getTemplatesByCategory(category: ProductionCategory): ProductionTemplate[] {
  return ALL_TEMPLATES.filter(t => t.category === category);
}

export function searchTemplates(query: string): ProductionTemplate[] {
  const q = query.toLowerCase();
  return ALL_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(q) ||
    (t.species?.toLowerCase() ?? '').includes(q) ||
    (t.purpose?.toLowerCase() ?? '').includes(q) ||
    t.tags.some(tag => tag.toLowerCase().includes(q))
  );
}

// ─── Category definitions for onboarding UI ──────────────────────────────────

export interface CategoryDef {
  id: ProductionCategory;
  label: string;
  icon: string;
  description: string;
  color: string;
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
    description: 'Chicken, duck, turkey, guinea fowl, quail, goose, ostrich, pigeon...',
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
    description: 'Maize, wheat, rice, soybean, millet, sorghum, cassava, yam, sugarcane...',
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
    description: 'Tomato, onion, pepper, carrot, kale, watermelon, garlic, eggplant...',
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
    description: 'Cut roses, herbs, hydroponic lettuce, bell pepper, strawberry...',
    color: 'emerald',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-300',
    textClass: 'text-emerald-700',
    templates: getTemplatesByCategory('greenhouse'),
  },
  {
    id: 'orchard',
    label: 'Orchards & Tree Fruit',
    icon: '🥭',
    description: 'Mango, avocado, citrus, banana, guava, pawpaw, passion fruit, macadamia...',
    color: 'orange',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-300',
    textClass: 'text-orange-700',
    templates: getTemplatesByCategory('orchard'),
  },
  {
    id: 'apiary',
    label: 'Apiary & Beekeeping',
    icon: '🐝',
    description: 'Beekeeping, honey, wax, pollination services...',
    color: 'yellow',
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-300',
    textClass: 'text-yellow-700',
    templates: getTemplatesByCategory('apiary'),
  },
  {
    id: 'mushroom',
    label: 'Mushroom Cultivation',
    icon: '🍄',
    description: 'Oyster, shiitake, button, portobello...',
    color: 'stone',
    bgClass: 'bg-stone-50',
    borderClass: 'border-stone-300',
    textClass: 'text-stone-700',
    templates: getTemplatesByCategory('mushroom'),
  },
  {
    id: 'insects',
    label: 'Insects & Worms',
    icon: '🪲',
    description: 'BSF, crickets, mealworms, silkworms, vermiculture, snails, stingless bees...',
    color: 'lime',
    bgClass: 'bg-lime-50',
    borderClass: 'border-lime-300',
    textClass: 'text-lime-700',
    templates: getTemplatesByCategory('insects'),
  },
  {
    id: 'aquatic_plants',
    label: 'Aquatic Plants & Algae',
    icon: '🌿',
    description: 'Seaweed farming, spirulina, microalgae...',
    color: 'teal',
    bgClass: 'bg-teal-50',
    borderClass: 'border-teal-300',
    textClass: 'text-teal-700',
    templates: getTemplatesByCategory('aquatic_plants'),
  },
  {
    id: 'forestry',
    label: 'Forestry & Agroforestry',
    icon: '🌲',
    description: 'Timber plantations, agroforestry, silvopastoral systems...',
    color: 'green',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-300',
    textClass: 'text-green-800',
    templates: getTemplatesByCategory('forestry'),
  },
  {
    id: 'processing',
    label: 'Agro-Processing',
    icon: '🏭',
    description: 'Milling, dairy, honey, cassava, juice, feed mill, meat processing...',
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
    description: 'Vet services, consulting, equipment hire, lab testing, farmer training...',
    color: 'violet',
    bgClass: 'bg-violet-50',
    borderClass: 'border-violet-300',
    textClass: 'text-violet-700',
    templates: getTemplatesByCategory('services'),
  },
];

// ─── Named re-exports ─────────────────────────────────────────────────────────
export {
  // Poultry
  broilerTemplate, layerTemplate, broilerBreederTemplate,
  meatDuckTemplate, layerDuckTemplate, turkeyTemplate,
  guineaFowlTemplate, quailTemplate, indigenousChickenTemplate,
  gooseTemplate, ostrichTemplate, pigeonTemplate,
  // Livestock
  dairyCattleTemplate, beefCattleTemplate, piggeryTemplate,
  meatGoatTemplate, dairyGoatTemplate, meatSheepTemplate, rabbitTemplate,
  // Aquaculture
  tilapiaTemplate, catfishTemplate,
  shrimpTemplate, rainbowTroutTemplate, commonCarpTemplate, aquaponicsTemplate,
  // Crops
  maizeTemplate, riceTemplate, soybeanTemplate, sorghumTemplate,
  sunflowerTemplate, groundnutTemplate, cassavaTemplate, sweetPotatoTemplate,
  wheatTemplate, fingerMilletTemplate, pearlMilletTemplate, irishPotatoTemplate,
  cowpeaTemplate, sugarcaneTemplate, yamTemplate,
  // Horticulture
  tomatoTemplate, onionTemplate, cabbageTemplate, pepperTemplate, cucumberTemplate,
  carrotTemplate, kaleTemplate, watermelonTemplate, pumpkinTemplate,
  garlicTemplate, broccoliTemplate, eggplantTemplate,
  // Greenhouse
  cutRoseTemplate, herbsTemplate, hydroponicLettuceTemplate,
  greenhousePepperTemplate, strawberryTemplate,
  // Orchard
  mangoTemplate, avocadoTemplate, citrusTemplate, bananaTemplate,
  guavaTemplate, pawpawTemplate, passionFruitTemplate, macadamiaTemplate, moringaTemplate,
  // Apiary
  honeybeeTemplate, topBarHiveTemplate, stinglessBeeTemplate,
  // Insects & Worms
  bsfTemplate, cricketFarmingTemplate, mealwormTemplate,
  silkwormTemplate, vermicultureTemplate, snailFarmingTemplate,
  // Aquatic Plants & Algae
  seaweedTemplate, spirulinaTemplate,
  // Forestry & Agroforestry
  timberForestryTemplate, agroforestryTemplate,
  // Extra Livestock
  deerTemplate, camelidTemplate,
  // Mushroom
  oysterMushroomTemplate, buttonMushroomTemplate,
  // Processing
  maizeMealTemplate, dairyProcessingTemplate,
  honeyProcessingTemplate, cassavaProcessingTemplate, fruitJuiceTemplate, feedMillTemplate,
  // Services
  vetServicesTemplate, agriConsultingTemplate, equipmentHireTemplate,
  farmerTrainingTemplate, labTestingTemplate,
};
