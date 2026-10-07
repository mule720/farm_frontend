// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Care guide
// What to feed, vaccinate, treat or spray, and when, counted in days from the
// start of the cycle (day 0). Each template ships with a STARTER guide; the
// farmer edits it and saves their own version (ProductionTemplate.careSchedule).
//
// These are typical smallholder/commercial programmes, offered as a guide
// only — doses and products must be confirmed with a vet, extension officer
// or the product label before use.
// ─────────────────────────────────────────────────────────────────────────────
import type { CareItem, CareKind, ProductionTemplate } from './types';

export const CARE_KINDS: { id: CareKind; label: string; tone: string }[] = [
  { id: 'feed',        label: 'Feed',          tone: 'bg-amber-100 text-amber-800' },
  { id: 'water',       label: 'Water',         tone: 'bg-sky-100 text-sky-800' },
  { id: 'vaccination', label: 'Vaccination',   tone: 'bg-violet-100 text-violet-800' },
  { id: 'medication',  label: 'Medicine',      tone: 'bg-rose-100 text-rose-800' },
  { id: 'spray',       label: 'Spray',         tone: 'bg-lime-100 text-lime-800' },
  { id: 'fertiliser',  label: 'Fertiliser',    tone: 'bg-emerald-100 text-emerald-800' },
  { id: 'weighing',    label: 'Weigh / sample', tone: 'bg-indigo-100 text-indigo-800' },
  { id: 'inspection',  label: 'Check',         tone: 'bg-slate-200 text-slate-700' },
  { id: 'task',        label: 'Task',          tone: 'bg-teal-100 text-teal-800' },
];
export const careKindMeta = (k: CareKind) => CARE_KINDS.find(c => c.id === k) ?? CARE_KINDS[CARE_KINDS.length - 1];

type Opts = Partial<Omit<CareItem, 'id' | 'kind' | 'title' | 'startDay'>>;
const mk = (tpl: string) => {
  let n = 0;
  return (kind: CareKind, title: string, startDay: number, o: Opts = {}): CareItem =>
    ({ id: `${tpl}.${++n}`, kind, title, startDay, ...o });
};

// ── Poultry ───────────────────────────────────────────────────────────────────
const broiler = (() => {
  const c = mk('broiler'); const V = ['broiler_grow_out'];
  const o = (x: Opts = {}): Opts => ({ visibleFor: V, ...x });
  return [
    c('task',        'Brooder pre-heated and chicks placed', 0, o({ notes: 'Heat the brooder 24 h before arrival; check litter depth, drinkers and feeders.' })),
    c('inspection',  'Brooder temperature 32–35 °C', 0, o({ endDay: 6, notes: 'Watch the chicks: huddled = cold, spread to the edges = hot.' })),
    c('inspection',  'Brooder temperature 29–32 °C', 7, o({ endDay: 13 })),
    c('inspection',  'Brooder temperature 26–29 °C', 14, o({ endDay: 20 })),
    c('inspection',  'Brooder temperature 23–26 °C, then ambient', 21, o({ endDay: 42 })),
    c('feed',        'Starter feed', 0, o({ endDay: 13, product: 'Broiler starter (crumbs)', dose: 'Free access — about 15–60 g/bird/day' })),
    c('feed',        'Grower feed', 14, o({ endDay: 27, product: 'Broiler grower (pellets)', dose: 'Free access — about 65–145 g/bird/day' })),
    c('feed',        'Finisher feed', 28, o({ endDay: 42, product: 'Broiler finisher (pellets)', dose: 'Free access — about 150–220 g/bird/day' })),
    c('water',       'Vitamins and electrolytes against stress', 0, o({ endDay: 4, product: 'Vitamin/electrolyte powder', method: 'Drinking water', dose: 'As per label' })),
    c('water',       'Clean, cool drinking water at all times', 0, o({ endDay: 42, dose: 'About twice the weight of feed eaten; wash drinkers daily' })),
    c('vaccination', 'Confirm hatchery vaccinations (Marek\'s, Newcastle/IB)', 0, o({ notes: 'Check the chick certificate.' })),
    c('vaccination', 'Newcastle + Infectious Bronchitis', 7, o({ product: 'e.g. Hitchner B1 + H120', method: 'Eye drop or drinking water' })),
    c('vaccination', 'Gumboro (IBD)', 14, o({ product: 'IBD vaccine (intermediate)', method: 'Drinking water' })),
    c('vaccination', 'Newcastle booster', 21, o({ product: 'e.g. La Sota', method: 'Drinking water' })),
    c('medication',  'Coccidiosis prevention', 14, o({ endDay: 21, product: 'Anticoccidial (in feed or water)', dose: 'As per label / vet', notes: 'Many starter feeds already contain one — check the feed bag first.' })),
    c('weighing',    'Weigh a sample of 20 birds', 7, o({ endDay: 42, repeatEveryDays: 7, notes: 'Compare with your breed\'s target weight table and adjust feed.' })),
    c('task',        'Remove feed 6–8 hours before catching', 41, o({ notes: 'Keep water available.' })),
  ];
})();

const layer = (() => {
  const c = mk('layer'); const REAR = ['layer_from_chicks']; const LAYING = ['layer_from_pol', 'layer_continuing'];
  const r = (x: Opts = {}): Opts => ({ visibleFor: REAR, ...x });
  const l = (x: Opts = {}): Opts => ({ visibleFor: LAYING, ...x });
  return [
    c('feed',        'Chick starter', 0, r({ endDay: 55, product: 'Chick starter mash/crumbs', dose: 'Free access — about 10–45 g/bird/day' })),
    c('feed',        'Grower / developer', 56, r({ endDay: 125, product: 'Grower mash', dose: 'Controlled — about 50–95 g/bird/day; weigh to keep on target' })),
    c('feed',        'Layer mash', 126, r({ endDay: 500, product: 'Layer mash', dose: 'About 105–120 g/bird/day' })),
    c('feed',        'Layer mash', 0, l({ endDay: 500, product: 'Layer mash', dose: 'About 105–120 g/bird/day' })),
    c('feed',        'Calcium for shell strength', 0, l({ endDay: 500, product: 'Oyster shell or limestone grit', dose: 'Free choice, separate from mash' })),
    c('water',       'Vitamins and electrolytes against stress', 0, r({ endDay: 4, product: 'Vitamin/electrolyte powder', method: 'Drinking water' })),
    c('vaccination', 'Confirm hatchery vaccinations (Marek\'s)', 0, r()),
    c('vaccination', 'Newcastle + Infectious Bronchitis', 7, r({ method: 'Eye drop or drinking water' })),
    c('vaccination', 'Gumboro (IBD)', 14, r({ method: 'Drinking water' })),
    c('vaccination', 'Newcastle booster (La Sota)', 21, r({ method: 'Drinking water' })),
    c('vaccination', 'Fowl pox', 42, r({ method: 'Wing-web stab' })),
    c('vaccination', 'Newcastle booster', 56, r({ method: 'Drinking water' })),
    c('vaccination', 'Newcastle + IB + EDS (inactivated) before lay', 112, r({ method: 'Injection', notes: 'Best done by or with your vet.' })),
    c('medication',  'Deworm', 70, r({ product: 'Dewormer as advised by your vet', dose: 'As per label' })),
    c('medication',  'Deworm before lay', 126, r({ product: 'Dewormer as advised by your vet', dose: 'As per label' })),
    c('weighing',    'Weigh 50 birds — check flock uniformity', 14, r({ endDay: 126, repeatEveryDays: 14 })),
    c('task',        'Move pullets to the laying house and set up nests', 112, r()),
    c('task',        'Increase day length towards 14–16 hours of light', 119, r({ notes: 'Increase gradually; do not increase light before the birds reach target weight.' })),
    c('vaccination', 'Newcastle booster', 28, l({ endDay: 500, repeatEveryDays: 84, method: 'Drinking water' })),
    c('medication',  'Deworm', 30, l({ endDay: 500, repeatEveryDays: 90, product: 'Dewormer as advised by your vet' })),
  ];
})();

// ── Livestock ─────────────────────────────────────────────────────────────────
const dairy = (() => {
  const c = mk('dairy');
  return [
    c('feed',        'Dry-cow ration', 0, { endDay: 59, product: 'Good hay / pasture + minerals', dose: 'Limit concentrates to about 1–2 kg/day' }),
    c('feed',        'Early-lactation ration', 63, { endDay: 163, product: 'Dairy meal + hay / silage', dose: 'About 1 kg dairy meal per 2–3 L of milk above maintenance; roughage free access' }),
    c('feed',        'Mid / late-lactation ration', 164, { endDay: 368, product: 'Dairy meal + hay / silage', dose: 'Adjust dairy meal to the milk yield' }),
    c('feed',        'Mineral lick', 0, { endDay: 368, product: 'Dairy mineral lick', dose: 'Free access' }),
    c('water',       'Clean water at all times', 0, { endDay: 368, dose: 'A milking cow drinks about 80–120 L/day' }),
    c('medication',  'Dry-cow treatment at drying-off', 0, { product: 'Intramammary dry-cow tube', notes: 'Ask your vet; observe the milk withdrawal period on the label.' }),
    c('vaccination', 'Check FMD, anthrax, black quarter and lumpy skin vaccinations are up to date', 0, { notes: 'Follow the Department of Veterinary Services schedule; vaccinate any that are due.' }),
    c('task',        'Pre-calving health check', 45, { notes: 'Ask your vet about a scours vaccine 3–6 weeks before calving.' }),
    c('task',        'Move the cow to a clean calving pen', 57),
    c('task',        'Calving: calf gets colostrum within 6 hours, dip the navel in iodine, tag and record', 60),
    c('task',        'Teat dip after every milking', 63, { endDay: 368 }),
    c('inspection',  'California Mastitis Test (CMT)', 63, { endDay: 368, repeatEveryDays: 14 }),
    c('spray',       'Tick control (dip or spray)', 0, { endDay: 368, repeatEveryDays: 7, product: 'Acaricide as advised', method: 'Dip / spray', notes: 'Weekly in the rainy season, less often in the dry season. Observe milk withdrawal on the label.' }),
    c('medication',  'Strategic deworming', 15, { endDay: 368, repeatEveryDays: 90, product: 'Dewormer as advised by your vet' }),
    c('weighing',    'Body condition score', 0, { endDay: 368, repeatEveryDays: 30 }),
  ];
})();

const beef = (() => {
  const c = mk('beef');
  return [
    c('task',        'Arrival: quarantine, health check, weigh and tag', 0),
    c('vaccination', 'Vaccinate: FMD, anthrax, black quarter, lumpy skin as due', 3, { notes: 'Follow the Department of Veterinary Services schedule.' }),
    c('medication',  'Deworm on arrival', 3, { product: 'Dewormer as advised by your vet' }),
    c('feed',        'Adaptation: hay / pasture, introduce concentrate slowly', 0, { endDay: 20, dose: 'Start concentrate at about 0.5 kg/head/day and build up' }),
    c('feed',        'Growing ration', 21, { endDay: 110, product: 'Pasture + 1–2 kg/head/day supplement' }),
    c('feed',        'Finishing ration', 111, { endDay: 200, product: 'High-energy finisher ration', dose: 'About 2–2.5 % of body weight (dry matter)' }),
    c('feed',        'Mineral lick', 0, { endDay: 200, dose: 'Free access' }),
    c('water',       'Clean water at all times', 0, { endDay: 200, dose: 'About 30–50 L/head/day in hot weather' }),
    c('spray',       'Tick control (dip or spray)', 0, { endDay: 200, repeatEveryDays: 7, product: 'Acaricide as advised', method: 'Dip / spray', withdrawalDays: 7, notes: 'Check the slaughter withdrawal period on the label.' }),
    c('medication',  'Deworm', 93, { endDay: 200, repeatEveryDays: 90, product: 'Dewormer as advised by your vet' }),
    c('weighing',    'Weigh the group', 0, { endDay: 200, repeatEveryDays: 30 }),
  ];
})();

const pig = (() => {
  const c = mk('pig');
  return [
    c('feed',        'Gestation ration', 0, { endDay: 89, product: 'Sow gestation feed', dose: 'About 2–2.5 kg/sow/day, adjusted to body condition' }),
    c('feed',        'Late-gestation ration', 90, { endDay: 110, product: 'Sow gestation feed', dose: 'About 3 kg/sow/day' }),
    c('feed',        'Lactation ration', 114, { endDay: 141, product: 'Sow lactation feed', dose: 'Free access after the first days' }),
    c('feed',        'Creep feed for piglets', 121, { endDay: 141, product: 'Piglet creep feed' }),
    c('feed',        'Weaner ration', 142, { endDay: 183, product: 'Weaner feed' }),
    c('feed',        'Grower ration', 184, { endDay: 225, product: 'Grower feed' }),
    c('feed',        'Finisher ration', 226, { endDay: 268, product: 'Finisher feed' }),
    c('water',       'Clean water at all times', 0, { endDay: 268, dose: 'Lactating sow: about 15–30 L/day' }),
    c('vaccination', 'Sow vaccinations before farrowing (e.g. parvovirus, erysipelas, scours)', 84, { notes: 'Programme set by your vet.' }),
    c('medication',  'Deworm the sow and wash before moving to the farrowing pen', 100, { product: 'Dewormer as advised by your vet' }),
    c('task',        'Move the sow to a clean, disinfected farrowing pen', 107),
    c('task',        'Farrowing: dry piglets, check colostrum intake, warm creep area', 114),
    c('medication',  'Iron injection for piglets', 117, { product: 'Iron dextran', dose: 'About 200 mg per piglet' }),
    c('task',        'Needle teeth, tail and ear notching; castrate males (per farm policy)', 121),
    c('task',        'Wean the piglets and move to the weaner pen', 142),
    c('task',        'Check the sow for heat 4–7 days after weaning', 146),
    c('weighing',    'Weigh a sample of pigs', 142, { endDay: 268, repeatEveryDays: 14 }),
  ];
})();

const goat = (() => {
  const c = mk('goat');
  return [
    c('feed',        'Browse / hay with a mineral lick', 0, { endDay: 400, dose: 'Free access' }),
    c('feed',        'Late-gestation supplement', 120, { endDay: 149, product: 'Concentrate', dose: 'About 250–400 g/doe/day' }),
    c('feed',        'Lactation supplement', 150, { endDay: 240, product: 'Concentrate', dose: 'About 300–500 g/doe/day' }),
    c('feed',        'Creep feed for kids', 165, { endDay: 240 }),
    c('water',       'Clean water at all times', 0, { endDay: 400 }),
    c('vaccination', 'Clostridial / pulpy-kidney booster for the doe', 120, { notes: 'About 4 weeks before kidding.' }),
    c('medication',  'Deworm before kidding (only if needed)', 130, { notes: 'Check eyelid colour (FAMACHA) first.' }),
    c('task',        'Kidding: dip navels in iodine; kid has colostrum within 1–2 hours', 150),
    c('vaccination', 'Kids: pulpy-kidney first dose', 192),
    c('vaccination', 'Kids: pulpy-kidney booster', 220),
    c('task',        'Wean the kids', 240),
    c('inspection',  'FAMACHA check — deworm only anaemic animals', 0, { endDay: 400, repeatEveryDays: 30 }),
    c('spray',       'Tick control', 0, { endDay: 400, repeatEveryDays: 7, product: 'Acaricide as advised', method: 'Spray' }),
    c('task',        'Trim hooves', 0, { endDay: 400, repeatEveryDays: 90 }),
    c('weighing',    'Weigh the kids', 180, { endDay: 400, repeatEveryDays: 30 }),
  ];
})();

// ── Aquaculture ───────────────────────────────────────────────────────────────
const tilapia = (() => {
  const c = mk('tilapia');
  return [
    c('task',        'Drain, dry and repair the pond walls, inlets and screens', 0),
    c('fertiliser',  'Lime the pond bottom', 3, { product: 'Agricultural lime', dose: 'About 1 t/ha — adjust to soil pH' }),
    c('fertiliser',  'Fertilise to grow natural food', 7, { product: 'Manure / compost', dose: 'About 1–2 t/ha' }),
    c('task',        'Fill the pond and let the water turn green (Secchi 25–40 cm)', 10),
    c('task',        'Stock fingerlings: count, and acclimatise to pond water temperature', 14),
    c('feed',        'Fingerling feed', 15, { endDay: 44, product: 'About 40 % protein', dose: '5–8 % of body weight per day, in 3–4 feeds' }),
    c('feed',        'Grower feed', 45, { endDay: 104, product: 'About 30–35 % protein', dose: '3–4 % of body weight per day, in 2–3 feeds' }),
    c('feed',        'Finisher feed', 105, { endDay: 164, product: 'About 28–30 % protein', dose: '2–3 % of body weight per day, in 2 feeds' }),
    c('weighing',    'Sample 20–30 fish and adjust the feed to the new average weight', 29, { endDay: 161, repeatEveryDays: 14 }),
    c('inspection',  'Early-morning oxygen check — fish gasping at the surface means low oxygen', 15, { endDay: 164 }),
    c('task',        'Partial water exchange if ammonia or pH is out of range', 29, { endDay: 161, repeatEveryDays: 14 }),
    c('task',        'Stop feeding 24 hours before harvest', 163),
  ];
})();

// ── Crops & vegetables ────────────────────────────────────────────────────────
const maize = (() => {
  const c = mk('maize');
  return [
    c('task',        'Land preparation: plough or rip, then harrow', 0),
    c('fertiliser',  'Lime if the soil test shows acid soil', 14, { product: 'Agricultural lime', dose: 'As per soil test' }),
    c('task',        'Plant on the first good rains', 21, { dose: 'Rows 75 cm apart, 25 cm in the row, one seed per station (about 53 000 plants/ha)' }),
    c('fertiliser',  'Basal fertiliser at planting', 21, { product: 'Compound D (10:20:10)', dose: 'About 200 kg/ha', method: 'Place in the planting hole or furrow' }),
    c('spray',       'Pre-emergence herbicide (if not weeding by hand)', 22, { product: 'Per agrodealer / extension advice', dose: 'As per label' }),
    c('task',        'First weeding', 35),
    c('fertiliser',  'Top-dress', 49, { product: 'Urea', dose: 'About 200 kg/ha', notes: '4–5 weeks after planting, when the soil is moist.' }),
    c('task',        'Second weeding', 63),
    c('inspection',  'Scout for fall armyworm', 28, { endDay: 100, repeatEveryDays: 7, notes: 'Look in the whorls. If more than about 5–10 % of plants show fresh damage, control with an approved product.' }),
    c('task',        'Harvest when the husks are dry', 142, { notes: 'Grain moisture about 20–25 % at harvest.' }),
    c('task',        'Dry the grain to 12.5 % moisture before storing', 150),
    c('spray',       'Treat the grain with a storage insecticide', 152, { product: 'Approved storage pesticide', dose: 'As per label' }),
  ];
})();

const tomato = (() => {
  const c = mk('tomato');
  return [
    c('task',        'Sow treated seed in nursery trays or beds', 0),
    c('spray',       'Drench against damping-off if needed', 7, { product: 'Approved fungicide', dose: 'As per label' }),
    c('task',        'Harden off seedlings', 21, { endDay: 27 }),
    c('task',        'Transplant 4-week seedlings', 28, { dose: 'About 100 × 50 cm' }),
    c('fertiliser',  'Basal fertiliser at transplanting', 28, { product: 'Compound D + well-rotted manure', dose: 'About 300–500 kg/ha compound, per soil test' }),
    c('fertiliser',  'Top-dress', 49, { endDay: 110, repeatEveryDays: 21, product: 'CAN', dose: 'About 100–150 kg/ha' }),
    c('task',        'Stake the plants and remove suckers', 42, { endDay: 120, repeatEveryDays: 7 }),
    c('inspection',  'Scout twice a week: leaves and fruits for blight, leaf miner, whitefly', 35, { endDay: 125, repeatEveryDays: 3 }),
    c('spray',       'Preventive fungicide against early and late blight', 40, { endDay: 125, repeatEveryDays: 10, product: 'e.g. mancozeb or copper', withdrawalDays: 7, notes: 'Rotate active ingredients and follow the label pre-harvest interval.' }),
    c('spray',       'Insecticide — only if scouting finds pests', 42, { endDay: 125, repeatEveryDays: 10, product: 'Approved insecticide for whitefly / Tuta absoluta / aphids', withdrawalDays: 7, notes: 'Rotate chemistries; follow the label pre-harvest interval.' }),
    c('water',       'Irrigate to keep soil evenly moist without wetting the leaves', 28, { endDay: 125, dose: 'About 25–35 mm per week in the dry season' }),
  ];
})();

const cabbage = (() => {
  const c = mk('cabbage');
  return [
    c('task',        'Sow in the nursery', 0),
    c('task',        'Transplant seedlings', 28, { dose: 'About 60 × 45 cm' }),
    c('fertiliser',  'Basal fertiliser at transplanting', 28, { product: 'Compound D', dose: 'About 300–400 kg/ha, per soil test' }),
    c('fertiliser',  'Top-dress', 49, { endDay: 90, repeatEveryDays: 21, product: 'CAN or urea', dose: 'About 100–150 kg/ha' }),
    c('task',        'Weed and earth up', 42, { endDay: 70, repeatEveryDays: 14 }),
    c('inspection',  'Scout for diamondback moth, aphids and black rot', 28, { endDay: 115, repeatEveryDays: 7 }),
    c('spray',       'Insecticide for diamondback moth / caterpillars', 35, { endDay: 105, repeatEveryDays: 7, product: 'e.g. Bacillus thuringiensis (Bt) or other approved product', withdrawalDays: 3, notes: 'Rotate products; follow the label pre-harvest interval.' }),
    c('spray',       'Copper fungicide against black rot / leaf spot', 42, { endDay: 100, repeatEveryDays: 10, product: 'Copper-based fungicide', withdrawalDays: 7 }),
    c('water',       'Irrigate evenly', 28, { endDay: 115 }),
    c('task',        'Harvest firm heads', 105, { endDay: 120 }),
  ];
})();

const onion = (() => {
  const c = mk('onion');
  return [
    c('task',        'Sow in the nursery', 0),
    c('task',        'Transplant seedlings', 42, { dose: 'About 10 cm between plants, 25–30 cm between rows' }),
    c('fertiliser',  'Basal fertiliser at transplanting', 42, { product: 'Compound D', dose: 'About 300–400 kg/ha, per soil test' }),
    c('fertiliser',  'Top-dress', 63, { endDay: 105, repeatEveryDays: 21, product: 'CAN', dose: 'About 100–150 kg/ha' }),
    c('task',        'Weed', 49, { endDay: 119, repeatEveryDays: 14 }),
    c('inspection',  'Scout for thrips, purple blotch and downy mildew', 49, { endDay: 125, repeatEveryDays: 7 }),
    c('spray',       'Fungicide against purple blotch / downy mildew', 56, { endDay: 125, repeatEveryDays: 10, product: 'e.g. mancozeb', withdrawalDays: 7, notes: 'Follow the label pre-harvest interval.' }),
    c('spray',       'Insecticide for thrips — only if scouting finds them', 56, { endDay: 120, repeatEveryDays: 10, product: 'Approved insecticide', withdrawalDays: 7 }),
    c('task',        'Stop irrigating about 2 weeks before harvest', 119),
    c('task',        'Lift the bulbs when about 70 % of the tops have fallen over', 132),
    c('task',        'Cure the bulbs in shade for 10–14 days', 132, { endDay: 146 }),
  ];
})();

/** Starter care guides, keyed by template id. Templates not listed start with an empty guide. */
export const CARE_DEFAULTS: Record<string, CareItem[]> = {
  broiler_chicken: broiler,
  layer_chicken: layer,
  dairy_cattle: dairy,
  beef_cattle: beef,
  piggery: pig,
  'meat-goat': goat,
  tilapia,
  maize,
  tomato,
  cabbage,
  onion,
};

/** The care guide that applies to a template: the farmer's own if saved, otherwise the starter guide. */
export function getCareSchedule(template: ProductionTemplate | undefined | null): CareItem[] {
  if (!template) return [];
  if (template.careSchedule) return template.careSchedule;
  return CARE_DEFAULTS[template.baseTemplateId ?? template.id] ?? [];
}

/** True when the guide being shown is the built-in starter, not something the farmer has reviewed. */
export function isStarterGuide(template: ProductionTemplate | undefined | null): boolean {
  return !!template && !template.careSchedule && !!CARE_DEFAULTS[template.baseTemplateId ?? template.id];
}

// ── Scheduling ────────────────────────────────────────────────────────────────

export const isPhase = (i: CareItem) => !i.repeatEveryDays && i.endDay !== undefined && i.endDay > i.startDay;

/** The cycle days on which a one-off or repeating item falls (empty for a phase). */
export function itemDays(i: CareItem): number[] {
  if (isPhase(i)) return [];
  if (!i.repeatEveryDays || i.repeatEveryDays < 1) return [i.startDay];
  const end = i.endDay ?? i.startDay;
  const days: number[] = [];
  for (let d = i.startDay; d <= end && days.length < 400; d += i.repeatEveryDays) days.push(d);
  return days;
}

export const careKey = (itemId: string, day: number) => `${itemId}@${day}`;

export interface CareOccurrence { key: string; item: CareItem; day: number; done: boolean }

export interface CareAgenda {
  today: CareOccurrence[];
  overdue: CareOccurrence[];
  upcoming: CareOccurrence[];   // next 7 days
  phases: CareItem[];           // programmes that apply today (feed phase, brooder temp…)
}

export function cycleDayOf(startDate: string, now = new Date()): number {
  const s = new Date(startDate); s.setHours(0, 0, 0, 0);
  const n = new Date(now); n.setHours(0, 0, 0, 0);
  return Math.round((n.getTime() - s.getTime()) / 86400000);
}

export function appliesTo(item: CareItem, variantId: string): boolean {
  return !item.visibleFor || item.visibleFor.includes(variantId);
}

const OVERDUE_WINDOW = 30;

export function buildAgenda(
  items: CareItem[], cycleDay: number, variantId: string,
  careLog: Record<string, unknown> | undefined,
): CareAgenda {
  const out: CareAgenda = { today: [], overdue: [], upcoming: [], phases: [] };
  for (const item of items) {
    if (!appliesTo(item, variantId)) continue;
    if (isPhase(item)) {
      if (cycleDay >= item.startDay && cycleDay <= (item.endDay as number)) out.phases.push(item);
      continue;
    }
    for (const day of itemDays(item)) {
      const key = careKey(item.id, day);
      const occ: CareOccurrence = { key, item, day, done: !!careLog?.[key] };
      if (day === cycleDay) out.today.push(occ);
      else if (day < cycleDay && day >= cycleDay - OVERDUE_WINDOW && !occ.done) out.overdue.push(occ);
      else if (day > cycleDay && day <= cycleDay + 7) out.upcoming.push(occ);
    }
  }
  out.overdue.sort((a, b) => b.day - a.day);
  out.upcoming.sort((a, b) => a.day - b.day);
  return out;
}

/** Human description of when an item happens: "Day 14", "Day 0–13", "Every 7 days, day 7–42". */
export function describeTiming(i: CareItem): string {
  if (isPhase(i)) return `Day ${i.startDay}–${i.endDay}`;
  if (i.repeatEveryDays && i.endDay !== undefined && i.endDay > i.startDay) return `Every ${i.repeatEveryDays} days, day ${i.startDay}–${i.endDay}`;
  return `Day ${i.startDay}`;
}
