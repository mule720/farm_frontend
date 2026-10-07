// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Starter care guides, second pass
// The remaining templates. Same rules as careSchedule.ts: days count from the
// start of the cycle (day 0); these are typical practice offered as a guide,
// to be confirmed with a vet, agronomist, extension officer or the product
// label before use. Farmers edit them and save their own version.
// ─────────────────────────────────────────────────────────────────────────────
import type { CareItem, CareKind } from './types';

type O = Partial<Omit<CareItem, 'id' | 'kind' | 'title' | 'startDay'>>;
type C = (kind: CareKind, title: string, startDay: number, o?: O) => CareItem;
type Row = [CareKind, string, number, O?];

const g = (tpl: string): C => {
  let n = 0;
  return (kind, title, startDay, o = {}) => ({ id: `${tpl}.${++n}`, kind, title, startDay, ...o });
};
const rows = (tpl: string, list: Row[]): CareItem[] => { const c = g(tpl); return list.map(r => c(r[0], r[1], r[2], r[3])); };

const LABEL = 'Rotate active ingredients and follow the label, including the pre-harvest interval.';

// ═════════════════════════════════════════════════════════════════════════════
// Field and vegetable crops — one builder, tuned per crop
// ═════════════════════════════════════════════════════════════════════════════
interface Spray { title: string; from: number; to: number; every: number; product?: string; wd?: number; notes?: string; kind?: CareKind }
interface CropSpec {
  P: number;                                              // planting / transplanting day
  prep?: string;                                          // land preparation note (day 0), when planting is later than day 0
  nursery?: string;                                       // nursery sowing note (day 0) for transplanted crops
  plant: { title?: string; dose?: string };
  basal: { product: string; dose: string; notes?: string };
  topdress?: { days: number[]; product: string; dose: string; notes?: string };
  weed?: number[];
  thin?: { day: number; note?: string };
  water?: { from: number; to: number; dose: string; title?: string };
  scout?: { from: number; to: number; every: number; title: string; notes?: string };
  sprays?: Spray[];
  extra?: Row[];
  harvest: { day: number; end?: number; every?: number; title: string; notes?: string };
  after?: Row[];
}

function crop(tpl: string, s: CropSpec): CareItem[] {
  const c = g(tpl);
  const out: CareItem[] = [];
  if (s.nursery) out.push(c('task', 'Sow the nursery', 0, { notes: s.nursery }));
  else if (s.prep) out.push(c('task', 'Land preparation', 0, { notes: s.prep }));
  out.push(c('task', s.plant.title ?? 'Plant', s.P, { dose: s.plant.dose }));
  out.push(c('fertiliser', 'Basal fertiliser at planting', s.P, { product: s.basal.product, dose: s.basal.dose, notes: s.basal.notes }));
  if (s.thin) out.push(c('task', 'Thin to the final stand', s.thin.day, { notes: s.thin.note }));
  (s.weed ?? []).forEach((d, i) => out.push(c('task', i === 0 ? 'First weeding' : `Weeding ${i + 1}`, d)));
  if (s.topdress) {
    s.topdress.days.forEach((d, i) => out.push(c('fertiliser', s.topdress!.days.length > 1 ? `Top-dress ${i + 1}` : 'Top-dress', d,
      { product: s.topdress!.product, dose: s.topdress!.dose, notes: s.topdress!.notes })));
  }
  if (s.water) out.push(c('water', s.water.title ?? 'Irrigate', s.water.from, { endDay: s.water.to, dose: s.water.dose }));
  if (s.scout) out.push(c('inspection', s.scout.title, s.scout.from, { endDay: s.scout.to, repeatEveryDays: s.scout.every, notes: s.scout.notes }));
  (s.sprays ?? []).forEach(sp => out.push(c(sp.kind ?? 'spray', sp.title, sp.from,
    { endDay: sp.to, repeatEveryDays: sp.every, product: sp.product, withdrawalDays: sp.wd, notes: sp.notes ?? (sp.wd ? LABEL : undefined) })));
  (s.extra ?? []).forEach(r => out.push(c(r[0], r[1], r[2], r[3])));
  out.push(c('task', s.harvest.title, s.harvest.day,
    { endDay: s.harvest.end, repeatEveryDays: s.harvest.every, notes: s.harvest.notes }));
  (s.after ?? []).forEach(r => out.push(c(r[0], r[1], r[2], r[3])));
  return out.sort((a, b) => a.startDay - b.startDay);
}

const FIELD: Record<string, CareItem[]> = {
  rice: crop('rice', {
    P: 25, nursery: 'Sow a seedbed; keep it moist and weed-free.', plant: { title: 'Transplant 3–4-week seedlings', dose: 'About 20 × 20 cm, 2–3 seedlings per hill' },
    basal: { product: 'Compound D', dose: 'About 200 kg/ha' },
    topdress: { days: [45, 70], product: 'Urea', dose: 'About 50–100 kg/ha each', notes: 'At tillering and at panicle initiation.' },
    water: { from: 25, to: 115, dose: 'Keep about 5 cm of standing water; drain about 10 days before harvest', title: 'Manage the water level' },
    weed: [40, 60], scout: { from: 30, to: 130, every: 7, title: 'Scout for blast, stem borer and birds' },
    extra: [['task', 'Drain the field about 10 days before harvest', 120]],
    harvest: { day: 135, end: 145, title: 'Harvest when about 80–85 % of grains are straw-coloured' },
    after: [['task', 'Dry the paddy to about 14 % moisture before storing or milling', 148]],
  }),
  soybean: crop('soybean', {
    P: 0, plant: { dose: 'Rows 45–50 cm apart, about 5 cm in the row' },
    basal: { product: 'Single super phosphate or Compound D', dose: 'About 150–200 kg/ha, per soil test', notes: 'Soybean fixes its own nitrogen — no urea top-dress.' },
    extra: [['task', 'Inoculate the seed with Bradyrhizobium just before planting', 0, { notes: 'Shade the seed; plant the same day.' }]],
    weed: [14, 35], scout: { from: 21, to: 90, every: 7, title: 'Scout for rust, aphids and pod borers', notes: 'Treat only when thresholds are reached.' },
    sprays: [{ title: 'Fungicide against soybean rust (if rust is in your area)', from: 40, to: 70, every: 21, product: 'Approved fungicide', wd: 21 }],
    harvest: { day: 95, end: 110, title: 'Harvest when 95 % of pods are brown', notes: 'Grain moisture about 13 %.' },
    after: [['task', 'Dry to 12–13 % moisture before storage', 100]],
  }),
  sorghum: crop('sorghum', {
    P: 0, plant: { dose: 'Rows 75 cm apart; about 10 kg/ha seed' },
    basal: { product: 'Compound D', dose: 'About 100–150 kg/ha' },
    thin: { day: 14, note: 'Leave 2 plants per station.' }, weed: [21, 42],
    topdress: { days: [28], product: 'Urea', dose: 'About 50–100 kg/ha' },
    scout: { from: 14, to: 100, every: 7, title: 'Scout for shoot fly, stem borer and head bugs' },
    extra: [['task', 'Scare birds from heading to harvest', 70, { endDay: 110 }]],
    harvest: { day: 105, end: 120, title: 'Harvest when the grain is hard', notes: 'Cut heads, dry, then thresh.' },
    after: [['spray', 'Treat stored grain with a storage insecticide', 125, { product: 'Approved storage pesticide' }]],
  }),
  sunflower: crop('sunflower', {
    P: 0, plant: { dose: 'Rows 75 cm apart, 30 cm in the row' },
    basal: { product: 'Compound D', dose: 'About 100–150 kg/ha' },
    thin: { day: 14 }, weed: [21, 42],
    topdress: { days: [30], product: 'Urea or CAN', dose: 'About 50–100 kg/ha' },
    scout: { from: 21, to: 100, every: 7, title: 'Scout for head moth, cutworms and head rot' },
    extra: [['task', 'Protect heads from birds', 75, { endDay: 105 }]],
    harvest: { day: 100, end: 110, title: 'Harvest when the back of the head is yellow-brown', notes: 'Seed moisture about 10 % before storage.' },
  }),
  groundnut: crop('groundnut', {
    P: 7, prep: 'Plough and level; groundnut needs loose, well-drained soil.',
    plant: { dose: 'Rows 45–60 cm apart, 10–15 cm in the row; use certified seed' },
    basal: { product: 'Single super phosphate', dose: 'About 100–150 kg/ha' },
    extra: [
      ['spray', 'Dress the seed with a fungicide before planting', 6],
      ['fertiliser', 'Apply gypsum at flowering / pegging', 37, { product: 'Gypsum', dose: 'About 250–400 kg/ha', notes: 'Spread on the surface when the plants flower.' }],
    ],
    weed: [21, 35], scout: { from: 21, to: 120, every: 7, title: 'Scout for aphids (rosette virus), leaf spot and termites' },
    sprays: [{ title: 'Fungicide against leaf spot', from: 42, to: 97, every: 14, product: 'Approved fungicide', wd: 14 }],
    harvest: { day: 127, title: 'Lift when the inside of the pods turns dark and the kernels fill the shell' },
    after: [['task', 'Dry quickly to 8–10 % moisture and sort out mouldy pods', 134, { notes: 'Prevents aflatoxin.' }]],
  }),
  cassava: crop('cassava', {
    P: 7, prep: 'Plough or ridge.', plant: { dose: '25–30 cm stem cuttings; about 1 m × 1 m' },
    basal: { product: 'Manure, or NPK', dose: 'About 5 t/ha manure, or NPK 100–200 kg/ha at 6–8 weeks' },
    weed: [37, 67, 97], scout: { from: 37, to: 270, every: 14, title: 'Scout for mosaic virus, mealybug and green mite', notes: 'Remove and burn plants with mosaic.' },
    harvest: { day: 277, end: 540, title: 'Harvest from 9 months', notes: 'Lift only what you can process or sell within 24–48 hours.' },
  }),
  'sweet-potato': crop('sweet-potato', {
    P: 7, prep: 'Make ridges or mounds.', plant: { dose: '30 cm vine cuttings; about 30 cm apart on ridges 90 cm apart' },
    basal: { product: 'Compound D or manure', dose: 'About 100–150 kg/ha compound' },
    weed: [28, 49], extra: [['task', 'Earth up the ridges and lift vines to stop rooting at the nodes', 40]],
    scout: { from: 21, to: 110, every: 14, title: 'Scout for weevils and virus' },
    harvest: { day: 100, end: 127, title: 'Harvest 3–4 months after planting' },
    after: [['task', 'Cure the roots for 4–7 days in warm, humid shade before storing', 130]],
  }),
  wheat: crop('wheat', {
    P: 7, prep: 'Plough and level; make irrigation furrows.', plant: { dose: 'About 100–125 kg/ha seed in rows 15–20 cm apart' },
    basal: { product: 'Compound D', dose: 'About 200–300 kg/ha' },
    topdress: { days: [35, 56], product: 'Urea', dose: 'About 100–150 kg/ha in two splits', notes: 'At tillering and stem elongation.' },
    water: { from: 7, to: 105, dose: 'About 25–40 mm every 7–10 days' },
    weed: [28], scout: { from: 42, to: 110, every: 7, title: 'Scout for rust and aphids' },
    sprays: [{ title: 'Herbicide for broadleaf weeds', from: 28, to: 28, every: 1, product: 'Approved herbicide', kind: 'spray' },
             { title: 'Fungicide at flag-leaf if rust is present', from: 65, to: 80, every: 14, product: 'Approved fungicide', wd: 28 }],
    extra: [['task', 'Stop irrigating about 2 weeks before harvest', 105]],
    harvest: { day: 122, title: 'Harvest at about 14 % grain moisture' },
    after: [['task', 'Dry to 12.5 % moisture and store', 125]],
  }),
  'finger-millet': crop('finger-millet', {
    P: 21, nursery: 'Sow a small seedbed; keep it moist.', plant: { title: 'Transplant 3-week seedlings', dose: 'About 15 cm in rows 30 cm apart' },
    basal: { product: 'Compound D', dose: 'About 100 kg/ha' },
    topdress: { days: [50], product: 'Urea', dose: 'About 50 kg/ha' }, weed: [35, 56, 77],
    scout: { from: 40, to: 100, every: 7, title: 'Scout for blast disease' },
    extra: [['task', 'Scare birds from heading to harvest', 90, { endDay: 120 }]],
    harvest: { day: 120, title: 'Harvest when the heads turn brown' },
    after: [['task', 'Dry and thresh', 127]],
  }),
  'pearl-millet': crop('pearl-millet', {
    P: 0, plant: { dose: 'Rows 75 cm apart' }, basal: { product: 'Compound D', dose: 'About 100 kg/ha' },
    thin: { day: 14 }, weed: [21, 42], topdress: { days: [28], product: 'Urea', dose: 'About 50 kg/ha' },
    scout: { from: 14, to: 90, every: 7, title: 'Scout for downy mildew, ergot and stem borer' },
    extra: [['task', 'Scare birds from heading to harvest', 65, { endDay: 95 }]],
    harvest: { day: 95, title: 'Harvest when the grain is hard' },
  }),
  'irish-potato': crop('irish-potato', {
    P: 28, prep: 'Plough deeply. Start pre-sprouting (chitting) the seed tubers in diffused light.',
    plant: { dose: 'Certified seed 35–55 mm; rows 75–90 cm apart, 25–30 cm in the row' },
    basal: { product: 'Compound D or potato blend', dose: 'About 600–800 kg/ha, per soil test' },
    weed: [42], topdress: { days: [56], product: 'CAN', dose: 'About 150–200 kg/ha' },
    extra: [['task', 'Hill up the rows (first and second hilling)', 49, { endDay: 63, repeatEveryDays: 14 }]],
    water: { from: 28, to: 120, dose: 'Every 5–7 days; keep the soil evenly moist' },
    scout: { from: 42, to: 120, every: 7, title: 'Scout for late blight, aphids and tuber moth' },
    sprays: [{ title: 'Preventive fungicide against late blight', from: 56, to: 120, every: 8, product: 'e.g. mancozeb or copper', wd: 7 }],
    harvest: { day: 140, title: 'Cut the haulm, then lift 10–14 days later', notes: 'Waiting lets the skins set.' },
    after: [['task', 'Cure the tubers for 7–10 days in the shade, then sort and store', 154]],
  }),
  cowpea: crop('cowpea', {
    P: 0, plant: { dose: 'Rows 50–75 cm apart' }, basal: { product: 'Single super phosphate (optional)', dose: 'About 100 kg/ha' },
    weed: [14, 28], scout: { from: 21, to: 75, every: 7, title: 'Scout for aphids and pod borers' },
    sprays: [{ title: 'Insecticide at flowering if pests are found', from: 35, to: 49, every: 14, product: 'Approved insecticide', wd: 7 }],
    harvest: { day: 60, end: 90, every: 7, title: 'Pick dry pods as they mature' },
    after: [['task', 'Dry the grain and store in hermetic bags', 92]],
  }),
  sugarcane: crop('sugarcane', {
    P: 7, prep: 'Deep ploughing, furrows, drainage.', plant: { dose: 'Two-bud setts laid end to end in furrows 1.4–1.5 m apart' },
    basal: { product: 'NPK compound', dose: 'Per soil and leaf analysis' },
    topdress: { days: [49, 130], product: 'Nitrogen (e.g. urea)', dose: 'About 100–150 kg N/ha in two splits' },
    weed: [37, 67], water: { from: 7, to: 300, dose: 'Every 10–14 days in the dry season', title: 'Irrigate' },
    scout: { from: 60, to: 400, every: 30, title: 'Scout for eldana borer, smut and mosaic' },
    extra: [['task', 'Dry off — stop irrigating 6–8 weeks before harvest', 300]],
    harvest: { day: 372, end: 450, title: 'Harvest at 12–15 months when the cane is ripe', notes: 'Cut and deliver to the mill quickly.' },
  }),
  yam: crop('yam', {
    P: 7, prep: 'Make mounds or ridges.', plant: { dose: 'Seed yam setts 200–300 g, one per mound' },
    basal: { product: 'Manure and NPK', dose: 'Manure on the mound; NPK about 200 kg/ha' },
    extra: [['task', 'Mulch the mounds', 28], ['task', 'Stake the vines', 37, { endDay: 67 }]],
    weed: [37, 67, 97], scout: { from: 37, to: 300, every: 14, title: 'Scout for yam beetle and anthracnose' },
    harvest: { day: 277, end: 370, title: 'Harvest when the leaves yellow and dry' },
    after: [['task', 'Cure the tubers for 7 days in shade, then store ventilated', 380]],
  }),
};

const VEG: Record<string, CareItem[]> = {
  pepper: crop('pepper', {
    P: 35, nursery: 'Sow treated seed in trays or beds.', plant: { title: 'Transplant 5-week seedlings', dose: 'About 90 × 45 cm' },
    basal: { product: 'Compound D + manure', dose: 'About 400–500 kg/ha compound' },
    topdress: { days: [56, 77, 98, 119], product: 'CAN', dose: 'About 100–150 kg/ha' },
    extra: [['spray', 'Drench against damping-off if needed', 7, { product: 'Approved fungicide' }], ['task', 'Stake the plants', 56]],
    water: { from: 35, to: 200, dose: 'Keep the soil evenly moist; avoid wetting the leaves' },
    scout: { from: 42, to: 200, every: 3, title: 'Scout twice a week for aphids, thrips, mites and blight' },
    sprays: [{ title: 'Preventive fungicide', from: 49, to: 180, every: 10, product: 'e.g. copper-based', wd: 3 },
             { title: 'Insecticide — only if scouting finds pests', from: 49, to: 180, every: 10, product: 'Approved insecticide', wd: 7 }],
    harvest: { day: 125, end: 240, every: 7, title: 'Harvest ripe fruit' },
  }),
  cucumber: crop('cucumber', {
    P: 0, plant: { title: 'Sow', dose: 'About 60–100 cm between plants' }, basal: { product: 'Compound D + manure', dose: 'About 300 kg/ha compound' },
    thin: { day: 10 }, topdress: { days: [28, 49], product: 'CAN', dose: 'About 100–150 kg/ha' },
    extra: [['task', 'Put up trellis strings and train the vines', 14, { endDay: 49, repeatEveryDays: 7 }]],
    water: { from: 0, to: 110, dose: 'Regular, light irrigation; avoid wetting leaves' },
    scout: { from: 14, to: 115, every: 3, title: 'Scout for mildew, aphids, whitefly and red spider mite' },
    sprays: [{ title: 'Fungicide against downy / powdery mildew', from: 21, to: 100, every: 10, product: 'Approved fungicide', wd: 3 }],
    harvest: { day: 40, end: 120, every: 2, title: 'Pick young, firm fruit' },
  }),
  carrot: crop('carrot', {
    P: 0, plant: { title: 'Sow in rows on deep, fine beds', dose: 'Rows 20–25 cm apart' }, basal: { product: 'Compound D', dose: 'About 300 kg/ha — not too much nitrogen' },
    weed: [14, 28, 42], extra: [['task', 'Thin to about 5 cm apart', 14, { endDay: 28, repeatEveryDays: 14 }]],
    topdress: { days: [35], product: 'CAN', dose: 'About 50–100 kg/ha' },
    water: { from: 0, to: 80, dose: 'Light and frequent until germination, then about weekly' },
    scout: { from: 21, to: 85, every: 7, title: 'Scout for leaf blight, aphids and carrot fly' },
    sprays: [{ title: 'Fungicide against leaf blight', from: 35, to: 80, every: 10, product: 'Approved fungicide', wd: 7 }],
    harvest: { day: 75, end: 90, title: 'Lift when roots reach market size', notes: 'Stop irrigating a week before.' },
    after: [['task', 'Wash, grade and keep cool', 80]],
  }),
  'kale-spinach': crop('kale-spinach', {
    P: 28, nursery: 'Sow in the nursery.', plant: { title: 'Transplant seedlings', dose: 'About 30–45 cm apart' },
    basal: { product: 'Manure + Compound D', dose: 'About 300 kg/ha compound' },
    topdress: { days: [49, 70, 91], product: 'CAN', dose: 'About 50–100 kg/ha after cutting' },
    water: { from: 28, to: 115, dose: 'Daily or every second day' },
    scout: { from: 28, to: 115, every: 7, title: 'Scout for aphids and diamondback moth' },
    sprays: [{ title: 'Soap / Bt spray only if pests are damaging', from: 35, to: 105, every: 7, product: 'Bt or insecticidal soap', wd: 3 }],
    harvest: { day: 42, end: 112, every: 7, title: 'Cut the outer leaves', notes: 'Leave the growing point.' },
  }),
  watermelon: crop('watermelon', {
    P: 14, nursery: 'Sow in trays.', plant: { title: 'Transplant 2-week seedlings', dose: 'About 2 m × 1 m' },
    basal: { product: 'Compound D', dose: 'About 400 kg/ha' }, topdress: { days: [28, 42], product: 'CAN', dose: 'About 100 kg/ha' },
    extra: [['task', 'Make sure bees can reach the flowers (or hand-pollinate)', 35, { endDay: 49 }], ['task', 'Stop irrigating as fruits ripen', 70]],
    water: { from: 14, to: 70, dose: 'Deep and regular; avoid wetting leaves' },
    scout: { from: 21, to: 85, every: 4, title: 'Scout for mildew, aphids and fruit fly' },
    sprays: [{ title: 'Fungicide against downy mildew / anthracnose', from: 21, to: 75, every: 10, product: 'Approved fungicide', wd: 7 }],
    harvest: { day: 77, end: 90, every: 3, title: 'Pick when the tendril dries and the underside turns yellow' },
  }),
  'pumpkin-butternut': crop('pumpkin-butternut', {
    P: 0, plant: { dose: 'About 1 m × 1 m hills, 2 seeds per hill' }, basal: { product: 'Manure + Compound D', dose: 'About 200–300 kg/ha compound' },
    thin: { day: 14 }, weed: [21, 35], topdress: { days: [28], product: 'CAN', dose: 'About 100–150 kg/ha' },
    scout: { from: 21, to: 100, every: 7, title: 'Scout for mildew, aphids and fruit fly' },
    sprays: [{ title: 'Fungicide against mildew', from: 28, to: 90, every: 10, product: 'Approved fungicide', wd: 7 }],
    harvest: { day: 100, end: 120, title: 'Harvest when the rind is hard and the stalk corky' },
    after: [['task', 'Cure in the sun or shade for about 10 days, then store', 122]],
  }),
  garlic: crop('garlic', {
    P: 0, plant: { title: 'Plant cloves', dose: 'About 10 cm apart, rows 20–25 cm' }, basal: { product: 'Compound D + manure', dose: 'About 300–400 kg/ha compound' },
    weed: [21, 42, 63, 84], topdress: { days: [45, 75], product: 'CAN', dose: 'About 100 kg/ha' },
    water: { from: 0, to: 150, dose: 'About weekly' }, scout: { from: 30, to: 170, every: 7, title: 'Scout for thrips, rust and purple blotch' },
    sprays: [{ title: 'Fungicide against rust / purple blotch', from: 60, to: 150, every: 14, product: 'Approved fungicide', wd: 7 }],
    extra: [['task', 'Stop irrigating when the tops begin to yellow', 150]],
    harvest: { day: 180, end: 210, title: 'Lift when about half the leaves have dried' },
    after: [['task', 'Cure in shade for 2–3 weeks, then store', 200]],
  }),
  'broccoli-cauliflower': crop('broccoli-cauliflower', {
    P: 25, nursery: 'Sow in the nursery.', plant: { title: 'Transplant seedlings', dose: 'About 60 × 45 cm' },
    basal: { product: 'Compound D', dose: 'About 400 kg/ha' }, topdress: { days: [46, 60], product: 'CAN', dose: 'About 150 kg/ha' },
    scout: { from: 25, to: 90, every: 7, title: 'Scout for diamondback moth, aphids and black rot' },
    sprays: [{ title: 'Bt or other approved product for caterpillars', from: 35, to: 85, every: 7, product: 'e.g. Bacillus thuringiensis', wd: 3 },
             { title: 'Copper fungicide against black rot', from: 40, to: 80, every: 10, product: 'Copper-based', wd: 7 }],
    extra: [['task', 'Tie the leaves over cauliflower curds to blanch', 65], ['water', 'Irrigate evenly', 25, { endDay: 90 }]],
    harvest: { day: 75, end: 92, every: 3, title: 'Cut heads while tight and compact' },
  }),
  eggplant: crop('eggplant', {
    P: 38, nursery: 'Sow in trays; transplant at 5–6 weeks.', plant: { title: 'Transplant seedlings', dose: 'About 90 × 60 cm' },
    basal: { product: 'Compound D + manure', dose: 'About 400 kg/ha compound' }, topdress: { days: [59, 80, 101, 122], product: 'CAN', dose: 'About 100–150 kg/ha' },
    extra: [['task', 'Stake the plants', 52]],
    water: { from: 38, to: 170, dose: 'Keep evenly moist' },
    scout: { from: 45, to: 170, every: 3, title: 'Scout for fruit and shoot borer, red spider mite, whitefly and bacterial wilt', notes: 'Remove wilted plants.' },
    sprays: [{ title: 'Insecticide — only if scouting finds pests', from: 52, to: 150, every: 10, product: 'Approved insecticide', wd: 7 },
             { title: 'Preventive fungicide', from: 52, to: 150, every: 10, product: 'Copper-based', wd: 3 }],
    harvest: { day: 80, end: 170, every: 4, title: 'Pick glossy fruit before seeds harden' },
  }),
};

// ═════════════════════════════════════════════════════════════════════════════
// Orchards — three cycle types: annual season, new planting, harvest window
// ═════════════════════════════════════════════════════════════════════════════
interface OrchardSpec {
  fert: { product: string; dose: string };
  prune: string;
  sprays: Spray[];
  trap?: string;                 // pest trap / scouting title
  harvest: { day: number; title: string; notes?: string };
  harvestTasks: string[];
  extra?: Row[];
  newNotes?: string;
}

function orchard(tpl: string, s: OrchardSpec): CareItem[] {
  const c = g(tpl);
  const A = ['orchard_season']; const N = ['new_planting']; const H = ['harvest_window'];
  const out: CareItem[] = [
    c('task', 'Prune and clean up', 0, { visibleFor: A, notes: s.prune }),
    c('fertiliser', 'Apply manure or compost and mulch', 7, { visibleFor: A }),
    c('fertiliser', 'Main fertiliser application', 14, { visibleFor: A, product: s.fert.product, dose: s.fert.dose, notes: 'Scale to tree age and size; a soil or leaf test is best.' }),
    c('fertiliser', 'Second fertiliser application', 120, { visibleFor: A, product: s.fert.product, dose: s.fert.dose }),
    ...s.sprays.map(sp => c(sp.kind ?? 'spray', sp.title, sp.from,
      { visibleFor: A, endDay: sp.to, repeatEveryDays: sp.every, product: sp.product, withdrawalDays: sp.wd, notes: sp.notes ?? (sp.wd ? LABEL : undefined) })),
    c('inspection', s.trap ?? 'Scout for pests and disease', 30, { visibleFor: A, endDay: 240, repeatEveryDays: 14 }),
    c('water', 'Irrigate according to tree age and rainfall', 0, { visibleFor: A, endDay: 240 }),
    c('task', s.harvest.title, s.harvest.day, { visibleFor: A, notes: s.harvest.notes }),
    ...(s.extra ?? []).map(r => c(r[0], r[1], r[2], { visibleFor: A, ...(r[3] ?? {}) })),
    // New planting
    c('task', 'Mark out and dig planting holes (about 60 × 60 × 60 cm)', 0, { visibleFor: N }),
    c('fertiliser', 'Fill the holes with topsoil, manure and phosphate', 21, { visibleFor: N, product: 'Manure 10–20 kg + single super phosphate about 200 g per hole' }),
    c('task', 'Plant certified seedlings at the start of the rains', 42, { visibleFor: N, notes: s.newNotes }),
    c('task', 'Mulch and stake; protect from termites, rodents and livestock', 49, { visibleFor: N }),
    c('water', 'Water young trees twice a week in dry weather', 42, { visibleFor: N, endDay: 180, dose: 'About 20 L per tree' }),
    c('task', 'Weed around each tree (keep a 1 m clear circle)', 70, { visibleFor: N, endDay: 700, repeatEveryDays: 30 }),
    c('fertiliser', 'Feed young trees', 100, { visibleFor: N, endDay: 700, repeatEveryDays: 60, product: 'NPK compound', dose: 'About 100 g per tree, rising with age' }),
    c('task', 'Formative pruning', 180, { visibleFor: N, notes: 'Shape the tree for an open, strong framework.' }),
    c('inspection', 'Scout for pests and disease', 70, { visibleFor: N, endDay: 700, repeatEveryDays: 14 }),
    // Harvest window
    ...s.harvestTasks.map((t, i) => c('task', t, i === 0 ? 0 : i * 2, { visibleFor: H })),
    c('inspection', 'Check the next block for maturity', 0, { visibleFor: H, endDay: 60, repeatEveryDays: 4 }),
  ];
  return out;
}

const ORCHARD: Record<string, CareItem[]> = {
  mango: orchard('mango', {
    fert: { product: 'NPK compound', dose: 'About 1–2 kg per mature tree' }, prune: 'Remove dead wood and crowded branches after harvest.',
    sprays: [
      { title: 'Fungicide for anthracnose and powdery mildew at flowering', from: 45, to: 90, every: 14, product: 'e.g. copper or sulphur', wd: 14 },
    ],
    trap: 'Scout for fruit fly, mealybug and powdery mildew', harvest: { day: 170, title: 'Harvest mature fruit', notes: 'Pick when shoulders are full and a few fruits change colour.' },
    extra: [['task', 'Hang fruit-fly traps after fruit set', 100, { endDay: 200, repeatEveryDays: 14 }]],
    harvestTasks: ['Pick at maturity with a short stalk', 'Sort and grade; discard damaged fruit', 'Cool and pack; keep out of the sun'],
  }),
  avocado: orchard('avocado', {
    fert: { product: 'NPK compound', dose: 'About 1–2 kg per mature tree, split over the season' }, prune: 'Light pruning after harvest; keep the canopy open.',
    sprays: [
      { title: 'Copper spray against anthracnose and leaf spots at flowering and fruit set', from: 45, to: 100, every: 21, product: 'Copper-based', wd: 14 },
      { title: 'Phosphonate against root rot (Phytophthora)', from: 30, to: 120, every: 90, product: 'Phosphonate, per label', notes: 'Trunk injection or foliar, per label. Keep drainage good.' },
    ],
    trap: 'Scout for root rot, thrips, mites and fruit spotting', harvest: { day: 170, title: 'Harvest once the dry-matter test passes', notes: 'Test dry matter (about 21–24 % for Hass) before picking.' },
    extra: [['spray', 'Zinc / boron foliar spray at flowering', 45, { product: 'Zinc and boron foliar' }]],
    harvestTasks: ['Pick mature fruit with a short stalk', 'Handle gently — avoid dropping', 'Cool and pack'],
  }),
  citrus: orchard('citrus', {
    fert: { product: 'NPK compound', dose: 'About 1–2 kg per mature tree, split in 3–4 doses' }, prune: 'Remove dead wood, water shoots and crossing branches.',
    sprays: [
      { title: 'Fungicide against scab and greasy spot', from: 30, to: 120, every: 21, product: 'e.g. copper', wd: 7 },
      { title: 'Insecticide for scale, aphids and leaf miner — only if scouting finds them', from: 30, to: 150, every: 21, product: 'Approved insecticide', wd: 14 },
    ],
    trap: 'Scout for scale, aphids, leaf miner, fruit fly and greening', harvest: { day: 180, title: 'Harvest when fruit reaches the right colour and sweetness' },
    extra: [['task', 'Hang fruit-fly traps', 120, { endDay: 220, repeatEveryDays: 14 }]],
    harvestTasks: ['Pick fruit that has reached colour and sugar-acid balance', 'Clip stalks short; sort and grade', 'Wash, wax or pack as required'],
  }),
  banana: crop('banana', {
    P: 0, plant: { title: 'Plant tissue-culture plantlets or clean suckers', dose: 'About 3 × 3 m' },
    basal: { product: 'Manure + NPK', dose: 'About 10–20 kg manure per hole' },
    topdress: { days: [60, 120, 180, 240, 300], product: 'NPK with extra potassium', dose: 'About 100–200 g per plant per application' },
    water: { from: 0, to: 330, dose: 'Regular — bananas need steady moisture' },
    scout: { from: 30, to: 330, every: 14, title: 'Scout for weevils, nematodes, sigatoka and bunchy top' },
    extra: [
      ['task', 'Desucker — keep one follower per plant', 60, { endDay: 360, repeatEveryDays: 30 }],
      ['task', 'Remove dead and diseased leaves', 60, { endDay: 360, repeatEveryDays: 30 }],
      ['task', 'Prop the plants as the bunches fill', 150, { endDay: 330, repeatEveryDays: 14 }],
      ['task', 'Bag the bunches and remove the male bud after the last hand opens', 200],
      ['inspection', 'Check weevil traps', 30, { endDay: 330, repeatEveryDays: 14 }],
    ],
    harvest: { day: 270, end: 340, title: 'Cut the bunch when the fingers are round (about three-quarters full)' },
  }),
  guava: orchard('guava', {
    fert: { product: 'NPK compound', dose: 'About 0.5–1 kg per mature tree' }, prune: 'Prune after harvest to keep the tree low and open.',
    sprays: [{ title: 'Copper fungicide against anthracnose', from: 45, to: 100, every: 21, product: 'Copper-based', wd: 7 }],
    trap: 'Scout for fruit fly, mealybug and wilt', harvest: { day: 150, title: 'Harvest ripe fruit' },
    extra: [['task', 'Bag fruits or hang fruit-fly traps', 90, { endDay: 180, repeatEveryDays: 14 }]],
    harvestTasks: ['Pick at the colour change, handle gently', 'Sort and grade', 'Cool quickly — guava is highly perishable'],
  }),
  'passion-fruit': orchard('passion-fruit', {
    fert: { product: 'NPK compound', dose: 'About 100–150 g per vine, every 60 days' }, prune: 'Train vines onto the trellis; remove dead and tangled growth.',
    sprays: [{ title: 'Fungicide against brown spot and scab', from: 30, to: 150, every: 14, product: 'e.g. copper', wd: 7 }],
    trap: 'Scout for woodiness virus, fusarium wilt, mites and fruit fly', harvest: { day: 120, title: 'Collect fruit that has fallen or turned purple, every week', notes: 'Pick up fallen fruit at least weekly.' },
    extra: [['task', 'Hand-pollinate in the afternoon if bees are scarce', 60, { endDay: 150, repeatEveryDays: 2 }]],
    newNotes: 'Trellis posts and wires must be in place before planting.',
    harvestTasks: ['Collect fallen or purple fruit weekly', 'Sort and grade', 'Pack in ventilated crates'],
  }),
  macadamia: orchard('macadamia', {
    fert: { product: 'NPK compound', dose: 'Per tree age; follow a leaf analysis if possible' }, prune: 'Remove dead wood and lower suckers; keep the tree open.',
    sprays: [{ title: 'Fungicide against husk spot where it occurs', from: 45, to: 120, every: 21, product: 'Approved fungicide', wd: 14 }],
    trap: 'Scout for stink bugs, nut borer and husk spot', harvest: { day: 200, title: 'Collect nuts that have fallen — every week', notes: 'Dehusk within 24 hours; dry to about 10 % moisture within two weeks.' },
    extra: [['task', 'Collect fallen nuts weekly during the season', 200, { endDay: 260, repeatEveryDays: 7 }]],
    harvestTasks: ['Collect fallen nuts weekly', 'Dehusk within 24 hours', 'Dry to about 10 % moisture'],
  }),
  pawpaw: crop('pawpaw', {
    P: 60, nursery: 'Sow in bags; transplant at about 2 months.', plant: { title: 'Transplant seedlings (3 per hole)', dose: 'About 2.5 × 2.5 m' },
    basal: { product: 'Manure + NPK', dose: 'About 10 kg manure per hole' },
    topdress: { days: [90, 120, 150, 180, 210, 240], product: 'NPK compound', dose: 'About 100–150 g per plant every 30 days' },
    extra: [['task', 'Thin to one female or hermaphrodite plant per hole once the flowers show the sex', 150]],
    water: { from: 60, to: 360, dose: 'Regular; avoid waterlogging' },
    scout: { from: 60, to: 360, every: 14, title: 'Scout for ringspot virus, mites and mealybug', notes: 'Remove virus-infected plants at once.' },
    sprays: [{ title: 'Copper fungicide against powdery mildew / anthracnose', from: 90, to: 360, every: 14, product: 'Copper-based', wd: 7 }],
    harvest: { day: 270, end: 540, every: 7, title: 'Pick when the fruit shows colour at the base' },
  }),
  moringa: crop('moringa', {
    P: 0, plant: { dose: 'About 1 m × 1 m for leaf production' }, basal: { product: 'Manure', dose: 'A bucket per planting hole' },
    weed: [21, 45], extra: [['task', 'Pinch out the top at about 1 m to make the tree bush out', 60]],
    water: { from: 0, to: 365, dose: 'Regular in the dry season' },
    scout: { from: 30, to: 365, every: 14, title: 'Scout for caterpillars', notes: 'Avoid pesticides on leaves that will be eaten.' },
    harvest: { day: 90, end: 365, every: 40, title: 'Cut leafy branches about 30 cm above the ground', notes: 'Apply manure after each cut.' },
  }),
};

// ═════════════════════════════════════════════════════════════════════════════
// Birds
// ═════════════════════════════════════════════════════════════════════════════
const BIRDS: Record<string, CareItem[]> = {
  'meat-duck': rows('meat-duck', [
    ['task', 'Brooder pre-heated and ducklings placed', 0, { notes: 'About 32 °C under the heater for week 1, then lower by about 3 °C each week.' }],
    ['feed', 'Starter feed', 0, { endDay: 13, product: 'Duck starter (about 20 % protein, with niacin)', dose: 'Free access' }],
    ['feed', 'Grower feed', 14, { endDay: 35, product: 'Duck grower', dose: 'Free access' }],
    ['feed', 'Finisher feed', 36, { endDay: 56, product: 'Duck finisher', dose: 'Free access' }],
    ['water', 'Clean water deep enough to dip the bill', 0, { endDay: 56, dose: 'Ducks drink while eating — never limit water' }],
    ['vaccination', 'Duck plague / duck viral enteritis — only if your vet advises it for your area', 21],
    ['weighing', 'Weigh a sample of 20 ducks', 7, { endDay: 56, repeatEveryDays: 7 }],
    ['task', 'Remove feed 4–6 hours before catching', 55],
    ['task', 'Slaughter or sell at about 7–8 weeks', 49, { endDay: 63, notes: 'Pekin reaches about 3 kg at 7 weeks.' }],
  ]),
  'layer-duck': rows('layer-duck', [
    ['feed', 'Starter feed', 0, { endDay: 13, product: 'Duck starter', dose: 'Free access' }],
    ['feed', 'Grower feed', 14, { endDay: 125, product: 'Duck grower', dose: 'Controlled so birds stay lean' }],
    ['feed', 'Layer feed', 126, { endDay: 500, product: 'Duck layer feed', dose: 'About 150–170 g/duck/day' }],
    ['feed', 'Calcium for shell strength', 126, { endDay: 500, product: 'Oyster shell or limestone', dose: 'Free choice' }],
    ['water', 'Clean water deep enough to dip the bill', 0, { endDay: 500 }],
    ['task', 'Increase day length to about 16 hours of light', 119, { notes: 'Do this only when the birds are at target weight.' }],
    ['medication', 'Deworm', 84, { product: 'Dewormer as advised by your vet' }],
    ['medication', 'Deworm before lay', 126, { product: 'Dewormer as advised by your vet' }],
    ['vaccination', 'Duck plague — only if your vet advises it for your area', 21],
    ['weighing', 'Weigh a sample to keep the flock on target', 14, { endDay: 126, repeatEveryDays: 14 }],
    ['task', 'Collect eggs each morning (ducks lay at night)', 126, { endDay: 500, repeatEveryDays: 1 }],
  ]),
  turkey: rows('turkey', [
    ['task', 'Brooder pre-heated; teach poults to find feed and water in the first 48 hours', 0, { notes: 'About 35 °C in week 1, then lower by about 3 °C a week.' }],
    ['feed', 'Turkey starter', 0, { endDay: 41, product: 'Turkey starter (about 28 % protein)', dose: 'Free access' }],
    ['feed', 'Turkey grower', 42, { endDay: 83, product: 'Turkey grower', dose: 'Free access' }],
    ['feed', 'Turkey finisher', 84, { endDay: 140, product: 'Turkey finisher', dose: 'Free access' }],
    ['water', 'Clean water at all times; vitamins and electrolytes in the first week', 0, { endDay: 6, product: 'Vitamin/electrolyte powder' }],
    ['vaccination', 'Newcastle disease', 28, { method: 'Drinking water or eye drop' }],
    ['vaccination', 'Newcastle booster', 84],
    ['vaccination', 'Fowl pox', 49, { method: 'Wing-web stab' }],
    ['medication', 'Deworm', 56, { product: 'Dewormer as advised by your vet' }],
    ['medication', 'Deworm', 98, { product: 'Dewormer as advised by your vet' }],
    ['task', 'Keep turkeys away from chickens (blackhead disease)', 0, { endDay: 140 }],
    ['weighing', 'Weigh a sample of 20 birds', 14, { endDay: 140, repeatEveryDays: 14 }],
    ['task', 'Remove feed 6–8 hours before catching', 139],
  ]),
  'guinea-fowl': rows('guinea-fowl', [
    ['task', 'Brooder pre-heated and keets placed', 0, { notes: 'About 35 °C in week 1, then lower by about 3 °C a week.' }],
    ['feed', 'Keet starter', 0, { endDay: 27, product: 'Keet / game-bird starter (about 24–28 % protein)', dose: 'Free access' }],
    ['feed', 'Grower feed plus free-range foraging', 28, { endDay: 112, product: 'Grower feed', dose: 'About 50–80 g/bird/day as a supplement' }],
    ['water', 'Clean water at all times', 0, { endDay: 112 }],
    ['vaccination', 'Newcastle disease', 21, { method: 'Eye drop or drinking water' }],
    ['vaccination', 'Newcastle booster', 56],
    ['medication', 'Coccidiosis prevention', 10, { endDay: 21, product: 'Anticoccidial', dose: 'As per label / vet' }],
    ['medication', 'Deworm', 56, { product: 'Dewormer as advised by your vet' }],
    ['task', 'Let the birds out to range gradually; train them to return to the house at night', 28],
    ['weighing', 'Weigh a sample of 20 birds', 14, { endDay: 112, repeatEveryDays: 14 }],
    ['task', 'Market or slaughter', 98, { endDay: 112 }],
  ]),
  quail: rows('quail', [
    ['task', 'Brooder pre-heated and chicks placed', 0, { notes: 'About 35–37 °C in week 1, lowering by about 3 °C a week to room temperature by week 4.' }],
    ['feed', 'Starter feed', 0, { endDay: 20, product: 'Game-bird starter (about 24–28 % protein)', dose: 'Free access' }],
    ['feed', 'Grower feed', 21, { endDay: 41, product: 'Quail grower', dose: 'Free access' }],
    ['feed', 'Layer feed', 42, { endDay: 364, product: 'Quail layer (about 20 % protein) + calcium', dose: 'About 25–30 g/bird/day' }],
    ['water', 'Shallow clean water that chicks cannot drown in', 0, { endDay: 364 }],
    ['medication', 'Coccidiosis prevention', 7, { endDay: 21, product: 'Anticoccidial', dose: 'As per label / vet' }],
    ['task', 'Move to the laying cages and give 14–16 hours of light', 35],
    ['task', 'Check the male : female ratio and cull weak birds', 49],
    ['weighing', 'Weigh a sample of 20 birds', 14, { endDay: 42, repeatEveryDays: 14 }],
    ['task', 'Collect eggs daily', 42, { endDay: 364, repeatEveryDays: 1 }],
  ]),
  'indigenous-chicken': rows('indigenous-chicken', [
    ['task', 'Brooder pre-heated and chicks placed', 0, { notes: 'About 32–35 °C in week 1, then lower by about 3 °C a week.' }],
    ['feed', 'Chick starter', 0, { endDay: 55, product: 'Chick starter', dose: 'Free access' }],
    ['feed', 'Supplement while scavenging', 56, { endDay: 168, product: 'Grain, bran and kitchen scraps; grower mash', dose: 'About 40–60 g/bird/day' }],
    ['water', 'Clean water at all times', 0, { endDay: 168 }],
    ['vaccination', 'Newcastle disease (heat-tolerant I-2 type)', 7, { method: 'Eye drop' }],
    ['vaccination', 'Newcastle booster', 28],
    ['vaccination', 'Newcastle booster every 3 months', 118, { endDay: 168, repeatEveryDays: 90 }],
    ['vaccination', 'Gumboro (IBD)', 14, { method: 'Drinking water' }],
    ['vaccination', 'Fowl pox', 49, { method: 'Wing-web stab' }],
    ['medication', 'Deworm', 56, { product: 'Dewormer as advised by your vet' }],
    ['medication', 'Deworm', 140, { product: 'Dewormer as advised by your vet' }],
    ['spray', 'Treat for lice and mites', 56, { endDay: 168, repeatEveryDays: 30, product: 'Approved ectoparasite treatment' }],
    ['weighing', 'Weigh a sample', 56, { endDay: 168, repeatEveryDays: 28 }],
    ['task', 'Market or sell', 168, { endDay: 190 }],
  ]),
  goose: rows('goose', [
    ['task', 'Brooder pre-heated and goslings placed', 0, { notes: 'About 30 °C in week 1, lowering by about 3 °C a week.' }],
    ['feed', 'Gosling starter', 0, { endDay: 20, product: 'Gosling starter (about 20 % protein)', dose: 'Free access' }],
    ['feed', 'Pasture plus supplement', 21, { endDay: 83, product: 'Fresh grass + grower feed', dose: 'About 200–300 g/bird/day supplement' }],
    ['feed', 'Finisher', 84, { endDay: 112, product: 'Grain-based finisher', dose: 'Free access' }],
    ['water', 'Clean water deep enough to dip the bill', 0, { endDay: 112 }],
    ['medication', 'Deworm', 56, { product: 'Dewormer as advised by your vet' }],
    ['weighing', 'Weigh a sample', 14, { endDay: 112, repeatEveryDays: 14 }],
    ['task', 'Sell or slaughter at 14–16 weeks', 98, { endDay: 112 }],
  ]),
  ostrich: rows('ostrich', [
    ['task', 'Warm, dry chick room ready; keep chicks active', 0, { notes: 'About 32 °C for the first week; walk or exercise chicks daily to prevent leg problems.' }],
    ['feed', 'Chick starter', 0, { endDay: 89, product: 'Ostrich starter (about 20–22 % protein)', dose: 'Free access; add fine grit from the first week' }],
    ['feed', 'Grower', 90, { endDay: 299, product: 'Ostrich grower (about 16 % protein) + lucerne / pasture' }],
    ['feed', 'Finisher', 300, { endDay: 420, product: 'Ostrich finisher (about 14 % protein)' }],
    ['water', 'Clean water at all times', 0, { endDay: 420 }],
    ['vaccination', 'Newcastle disease (inactivated) — schedule set by your vet', 21],
    ['vaccination', 'Newcastle booster', 49],
    ['medication', 'Deworm', 120, { endDay: 420, repeatEveryDays: 90, product: 'Dewormer as advised by your vet' }],
    ['weighing', 'Weigh the chicks / young birds', 14, { endDay: 420, repeatEveryDays: 30 }],
    ['task', 'Slaughter or sell at 12–14 months', 365, { endDay: 420 }],
  ]),
  'pigeon-squab': rows('pigeon-squab', [
    ['task', 'Loft cleaned and disinfected; nest bowls fitted; pairs housed', 0],
    ['feed', 'Pigeon grain mix with grit and minerals', 0, { endDay: 365, product: 'Pigeon mix (about 15–16 % protein), grit and mineral block', dose: 'About 30–40 g/bird/day' }],
    ['water', 'Clean water daily', 0, { endDay: 365 }],
    ['task', 'Check nests; harvest squabs at about 25–28 days old', 28, { endDay: 365, repeatEveryDays: 7 }],
    ['task', 'Clean nest bowls and the loft', 7, { endDay: 365, repeatEveryDays: 7 }],
    ['vaccination', 'Paramyxovirus (PMV-1) and pigeon pox — per your vet', 0, { endDay: 365, repeatEveryDays: 365 }],
    ['medication', 'Treat or check for canker (trichomoniasis) and worms', 30, { endDay: 365, repeatEveryDays: 90, product: 'As advised by your vet' }],
  ]),
  broiler_breeder: rows('broiler_breeder', [
    ['feed', 'Breeder feed, controlled to the breed target', 0, { endDay: 280, product: 'Breeder feed', dose: 'About 140–160 g/hen/day — follow the breed guide' }],
    ['feed', 'Calcium for shell strength', 0, { endDay: 280, product: 'Oyster shell or limestone', dose: 'Free choice' }],
    ['water', 'Clean water at all times', 0, { endDay: 280 }],
    ['vaccination', 'Newcastle booster', 28, { endDay: 280, repeatEveryDays: 84, method: 'Drinking water or injection' }],
    ['medication', 'Deworm', 30, { endDay: 280, repeatEveryDays: 90, product: 'Dewormer as advised by your vet' }],
    ['task', 'Collect hatching eggs at least 4 times a day; store at 15–18 °C', 0, { endDay: 280, repeatEveryDays: 1 }],
    ['inspection', 'Check the cockerel : hen ratio (about 1 : 10) and fertility', 14, { endDay: 280, repeatEveryDays: 14 }],
    ['weighing', 'Weigh 50 hens to stay on the breed target', 7, { endDay: 280, repeatEveryDays: 7 }],
  ]),
};

// ═════════════════════════════════════════════════════════════════════════════
// Livestock
// ═════════════════════════════════════════════════════════════════════════════
const STOCK: Record<string, CareItem[]> = {
  'dairy-goat': rows('dairy-goat', [
    ['feed', 'Dry-doe ration', 0, { endDay: 55, product: 'Good hay and browse + minerals', dose: 'Limit concentrate' }],
    ['feed', 'Lactation ration', 57, { endDay: 336, product: 'Hay / browse + dairy concentrate', dose: 'About 0.4 kg concentrate per litre of milk' }],
    ['feed', 'Mineral lick', 0, { endDay: 336, dose: 'Free access' }],
    ['water', 'Clean water at all times', 0, { endDay: 336, dose: 'A milking doe drinks several litres a day' }],
    ['medication', 'Dry-off: check the udder and treat if advised', 0, { notes: 'Ask your vet; observe milk withdrawal.' }],
    ['vaccination', 'Clostridial / pulpy-kidney booster', 35, { notes: 'About 3–4 weeks before kidding.' }],
    ['medication', 'Deworm before kidding (only if needed)', 42, { notes: 'Check eyelid colour (FAMACHA) first.' }],
    ['task', 'Kidding: dip navels in iodine; kids get colostrum within 1–2 hours', 56],
    ['task', 'Teat dip after every milking', 57, { endDay: 336 }],
    ['inspection', 'California Mastitis Test (CMT)', 63, { endDay: 336, repeatEveryDays: 14 }],
    ['spray', 'Tick control', 0, { endDay: 336, repeatEveryDays: 7, product: 'Acaricide as advised', notes: 'Check the milk withdrawal period.' }],
    ['task', 'Trim hooves', 0, { endDay: 336, repeatEveryDays: 90 }],
    ['weighing', 'Body condition score', 0, { endDay: 336, repeatEveryDays: 30 }],
    ['task', 'Ask your vet about brucellosis and TB testing', 0],
  ]),
  'meat-sheep': rows('meat-sheep', [
    ['feed', 'Pasture / hay with a mineral lick', 0, { endDay: 400, dose: 'Free access' }],
    ['feed', 'Late-gestation supplement', 120, { endDay: 146, product: 'Concentrate', dose: 'About 250–400 g/ewe/day' }],
    ['feed', 'Lactation supplement', 147, { endDay: 240, product: 'Concentrate', dose: 'About 300–500 g/ewe/day' }],
    ['feed', 'Creep feed for lambs', 165, { endDay: 240 }],
    ['water', 'Clean water at all times', 0, { endDay: 400 }],
    ['vaccination', 'Clostridial / pulpy-kidney booster for the ewe', 119, { notes: 'About 4 weeks before lambing.' }],
    ['task', 'Lambing: dip navels in iodine; lamb has colostrum within 1–2 hours', 147],
    ['vaccination', 'Lambs: first pulpy-kidney dose', 195],
    ['vaccination', 'Lambs: pulpy-kidney booster', 223],
    ['task', 'Wean the lambs', 240],
    ['inspection', 'FAMACHA check — deworm only anaemic animals', 0, { endDay: 400, repeatEveryDays: 30 }],
    ['spray', 'Tick and blowfly control', 0, { endDay: 400, repeatEveryDays: 14, product: 'Approved product' }],
    ['task', 'Check feet and trim hooves', 0, { endDay: 400, repeatEveryDays: 60 }],
    ['weighing', 'Weigh the lambs', 180, { endDay: 400, repeatEveryDays: 30 }],
  ]),
  rabbit: rows('rabbit', [
    ['task', 'Mate the doe (take her to the buck)', 0],
    ['task', 'Palpate or re-mate if she is not pregnant', 14],
    ['task', 'Put the nest box in with dry bedding', 26],
    ['task', 'Kindling: check the litter, remove dead kits', 31],
    ['feed', 'Doe feed', 0, { endDay: 59, product: 'Rabbit pellets + fresh forage', dose: 'About 150–180 g/day; up to about 400 g/day while nursing' }],
    ['feed', 'Creep feed for kits', 52, { endDay: 59, product: 'Pellets' }],
    ['feed', 'Growing rabbits', 60, { endDay: 115, product: 'Rabbit growth pellets + forage', dose: 'Free access to hay or forage' }],
    ['water', 'Clean water at all times', 0, { endDay: 115 }],
    ['task', 'Wean the kits', 59],
    ['task', 'Re-breed the doe', 45],
    ['medication', 'Coccidiosis prevention at weaning', 59, { endDay: 80, product: 'Anticoccidial as advised by your vet' }],
    ['vaccination', 'Myxomatosis / viral haemorrhagic disease — if the vaccine is available in your area', 0],
    ['task', 'Clean hutches and feeders', 0, { endDay: 115, repeatEveryDays: 7 }],
    ['inspection', 'Check for ear mites and sore hocks', 0, { endDay: 115, repeatEveryDays: 30 }],
    ['weighing', 'Weigh the growers', 66, { endDay: 115, repeatEveryDays: 14 }],
    ['task', 'Slaughter or sell at 8–10 weeks', 115, { notes: 'Check the market weight you aim for.' }],
  ]),
  'deer-venison': rows('deer-venison', [
    ['feed', 'Pasture and browse with a mineral supplement', 0, { endDay: 717 }],
    ['feed', 'Late-pregnancy supplement', 200, { endDay: 277, product: 'Concentrate or good hay' }],
    ['feed', 'Lactation supplement', 278, { endDay: 338 }],
    ['water', 'Clean water at all times', 0, { endDay: 717 }],
    ['vaccination', 'Clostridial and other vaccines — programme set by your vet', 200],
    ['medication', 'Deworm', 180, { endDay: 700, repeatEveryDays: 120, product: 'Dewormer as advised by your vet' }],
    ['task', 'Fawning: keep disturbance low; tag fawns when safe', 278],
    ['task', 'Wean the fawns', 338],
    ['inspection', 'Check fences and gates', 0, { endDay: 717, repeatEveryDays: 7 }],
    ['weighing', 'Weigh young stock', 338, { endDay: 703, repeatEveryDays: 60 }],
    ['task', 'Velvet harvest — by a vet or trained person only', 703],
  ]),
  'camelid-fiber': rows('camelid-fiber', [
    ['feed', 'Pasture / hay with a mineral supplement', 0, { endDay: 592, dose: 'Free access' }],
    ['feed', 'Late-pregnancy supplement', 300, { endDay: 344 }],
    ['feed', 'Lactation supplement', 345, { endDay: 525 }],
    ['water', 'Clean water at all times', 0, { endDay: 592 }],
    ['vaccination', 'Clostridial booster before birth — per your vet', 315],
    ['task', 'Birth: check the cria nurses within 6 hours', 345],
    ['vaccination', 'Cria: first clostridial dose', 461],
    ['vaccination', 'Cria: booster', 489],
    ['inspection', 'Check eyelid colour (FAMACHA) and body condition', 0, { endDay: 592, repeatEveryDays: 30 }],
    ['medication', 'Deworm only if needed', 30, { endDay: 592, repeatEveryDays: 60, product: 'Dewormer as advised by your vet' }],
    ['task', 'Trim toenails', 0, { endDay: 592, repeatEveryDays: 90 }],
    ['weighing', 'Weigh the cria weekly for the first month, then monthly', 345, { endDay: 373, repeatEveryDays: 7 }],
    ['task', 'Wean the cria', 525],
    ['task', 'Shear before the hot season and sort the fibre', 585],
  ]),
};

// ═════════════════════════════════════════════════════════════════════════════
// Aquaculture
// ═════════════════════════════════════════════════════════════════════════════
const AQUA: Record<string, CareItem[]> = {
  catfish: rows('catfish', [
    ['task', 'Stock fingerlings; count and acclimatise to the water temperature', 0],
    ['feed', 'Fingerling feed', 0, { endDay: 30, product: 'About 45 % protein', dose: 'About 5–8 % of body weight per day, 3–4 feeds' }],
    ['feed', 'Grower feed', 31, { endDay: 75, product: 'About 40 % protein', dose: 'About 3–5 % of body weight per day, 2–3 feeds' }],
    ['feed', 'Finisher feed', 76, { endDay: 119, product: 'About 35 % protein', dose: 'About 2–3 % of body weight per day, 2 feeds' }],
    ['task', 'Grade and separate sizes to reduce cannibalism', 21, { endDay: 63, repeatEveryDays: 21 }],
    ['weighing', 'Sample 20–30 fish and adjust the feed', 14, { endDay: 112, repeatEveryDays: 14 }],
    ['task', 'Partial water exchange', 14, { endDay: 112, repeatEveryDays: 14, notes: 'More often if ammonia or pH is out of range.' }],
    ['inspection', 'Early-morning oxygen check — gasping fish mean low oxygen', 0, { endDay: 119 }],
    ['task', 'Stop feeding 24 hours before harvest', 119],
    ['task', 'Harvest', 120],
  ]),
  shrimp: rows('shrimp', [
    ['task', 'Drain and dry the pond; repair walls and screens', 0],
    ['fertiliser', 'Lime the pond bottom', 2, { product: 'Agricultural lime', dose: 'About 1 t/ha — adjust to soil pH' }],
    ['fertiliser', 'Fertilise to grow natural food', 5, { product: 'Manure / compost' }],
    ['task', 'Fill the pond and let the water green up', 6],
    ['task', 'Stock post-larvae; acclimatise slowly', 7],
    ['feed', 'Nursery feed', 7, { endDay: 34, product: 'Starter prawn feed (about 40 % protein)', dose: 'Small, frequent feeds' }],
    ['feed', 'Grow-out feed', 35, { endDay: 147, product: 'Prawn grower (about 30–35 % protein)', dose: 'About 3–5 % of body weight per day' }],
    ['inspection', 'Check dissolved oxygen, pH and ammonia', 7, { endDay: 147 }],
    ['weighing', 'Sample the prawns and adjust the feed', 35, { endDay: 147, repeatEveryDays: 14 }],
    ['task', 'Stop feeding the day before harvest', 146],
    ['task', 'Harvest', 147],
  ]),
  'rainbow-trout': rows('rainbow-trout', [
    ['feed', 'Fry feed', 0, { endDay: 60, product: 'Starter crumb (about 50 % protein)', dose: 'Small feeds 6–8 times a day' }],
    ['feed', 'Fingerling feed', 61, { endDay: 180, product: 'Trout fingerling pellet', dose: '2–3 % of body weight, 3–4 feeds' }],
    ['feed', 'Grow-out feed', 181, { endDay: 269, product: 'Trout grower pellet', dose: '1–2 % of body weight, 2 feeds' }],
    ['inspection', 'Check water temperature (keep about 10–18 °C), oxygen and flow', 0, { endDay: 269 }],
    ['task', 'Grade by size to reduce competition', 30, { endDay: 240, repeatEveryDays: 30 }],
    ['weighing', 'Sample and adjust the feed', 14, { endDay: 260, repeatEveryDays: 14 }],
    ['task', 'Remove dead fish and check for disease', 0, { endDay: 269, repeatEveryDays: 1 }],
    ['task', 'Stop feeding 24 hours before harvest', 269],
  ]),
  'common-carp': rows('common-carp', [
    ['task', 'Drain, dry and repair the pond', 0],
    ['fertiliser', 'Lime the pond bottom', 3, { product: 'Agricultural lime', dose: 'About 1 t/ha' }],
    ['fertiliser', 'Fertilise with manure to grow natural food', 7, { product: 'Manure / compost', dose: 'About 1–2 t/ha' }],
    ['task', 'Fill the pond; stock fingerlings', 14],
    ['feed', 'Supplementary feed', 15, { endDay: 240, product: 'Carp pellet (about 30 % protein) or farm by-products', dose: 'About 2–4 % of body weight per day' }],
    ['fertiliser', 'Top up with manure to keep the water green', 28, { endDay: 200, repeatEveryDays: 14 }],
    ['weighing', 'Sample 20–30 fish', 36, { endDay: 240, repeatEveryDays: 21 }],
    ['inspection', 'Check oxygen early in the morning', 15, { endDay: 240 }],
    ['task', 'Stop feeding 24 hours before harvest', 239],
    ['task', 'Harvest at 6–9 months', 240, { endDay: 284 }],
  ]),
  aquaponics: rows('aquaponics', [
    ['task', 'Build and fill the system; start fishless or low-fish cycling', 0, { notes: 'Ammonia → nitrite → nitrate takes about 3–4 weeks.' }],
    ['inspection', 'Test ammonia, nitrite and nitrate', 7, { endDay: 365, repeatEveryDays: 7 }],
    ['task', 'Add fish once nitrite is near zero', 28],
    ['feed', 'Feed the fish', 35, { endDay: 365, product: 'Quality fish feed', dose: 'About 1–2 % of body weight per day; no more than eaten in 10 minutes' }],
    ['task', 'Plant seedlings in the grow beds', 35],
    ['inspection', 'Check pH (aim for about 6–7) and water temperature', 0, { endDay: 365 }],
    ['fertiliser', 'Add chelated iron if the leaves yellow', 21, { endDay: 365, repeatEveryDays: 21, product: 'Chelated iron' }],
    ['task', 'Clean filters and pumps', 7, { endDay: 365, repeatEveryDays: 7 }],
    ['task', 'Top up evaporated water', 1, { endDay: 365, repeatEveryDays: 3 }],
    ['weighing', 'Sample the fish', 49, { endDay: 365, repeatEveryDays: 30 }],
  ]),
};

// ═════════════════════════════════════════════════════════════════════════════
// Greenhouse and protected crops
// ═════════════════════════════════════════════════════════════════════════════
const GREEN: Record<string, CareItem[]> = {
  'cut-rose': rows('cut-rose', [
    ['task', 'Prepare beds and plant', 0],
    ['water', 'Fertigation with a balanced nutrient solution', 7, { endDay: 1825, dose: 'EC and pH per your nutrient recipe (typically EC 1.5–2.0, pH 5.5–6.0)' }],
    ['inspection', 'Scout for spider mite, thrips, powdery mildew and botrytis', 7, { endDay: 1825, repeatEveryDays: 4 }],
    ['spray', 'Preventive fungicide programme', 21, { endDay: 1825, repeatEveryDays: 10, product: 'Rotate active ingredients', withdrawalDays: 1, notes: 'Follow the label re-entry and harvest intervals.' }],
    ['task', 'Pinch and shape young plants', 14, { endDay: 84, repeatEveryDays: 14 }],
    ['task', 'Cut stems at the right bud stage into clean water with preservative', 84, { endDay: 1825, repeatEveryDays: 2 }],
    ['task', 'Ventilate and manage humidity morning and evening', 0, { endDay: 1825 }],
  ]),
  'fresh-herbs': rows('fresh-herbs', [
    ['task', 'Sow seed and keep moist', 0],
    ['water', 'Seedling nutrient solution, then full strength', 10, { endDay: 60, dose: 'EC about 1.0–1.6; keep the pH about 5.8–6.5' }],
    ['task', 'First cut', 28, { notes: 'Cut above a pair of leaves.' }],
    ['task', 'Regular cutting', 35, { endDay: 56, repeatEveryDays: 7 }],
    ['inspection', 'Scout for aphids and whitefly', 7, { endDay: 56, repeatEveryDays: 4, notes: 'Use soap or neem only; avoid chemicals on herbs.' }],
    ['task', 'Pinch out flower buds', 21, { endDay: 56, repeatEveryDays: 7 }],
  ]),
  'hydroponic-lettuce': rows('hydroponic-lettuce', [
    ['task', 'Seed into the rockwool or growing plugs', 0],
    ['task', 'Move the seedlings into the system', 5],
    ['water', 'Nutrient solution — lower strength first, then stronger', 5, { endDay: 27, dose: 'EC about 0.8–1.2, rising to about 1.2–1.8; pH about 5.5–6.5' }],
    ['inspection', 'Check EC, pH and water temperature (keep it cool)', 5, { endDay: 27 }],
    ['task', 'Top up the tank', 6, { endDay: 27, repeatEveryDays: 1 }],
    ['task', 'Replace the nutrient solution', 19, { notes: 'About every two weeks.' }],
    ['task', 'Harvest', 28],
    ['task', 'Clean and sanitise the system before the next crop', 29],
  ]),
  'greenhouse-pepper': rows('greenhouse-pepper', [
    ['task', 'Sow seed in trays', 0],
    ['task', 'Transplant to the greenhouse', 45],
    ['water', 'Fertigation per your nutrient recipe', 45, { endDay: 350, dose: 'Higher potassium once fruit sets' }],
    ['task', 'Prune and train to 2–3 stems', 56, { endDay: 350, repeatEveryDays: 7 }],
    ['inspection', 'Scout for aphids, thrips, mites and whitefly', 49, { endDay: 350, repeatEveryDays: 4 }],
    ['spray', 'Biological or approved sprays — only if scouting finds pests', 56, { endDay: 330, repeatEveryDays: 10, product: 'Approved product', withdrawalDays: 3 }],
    ['spray', 'Calcium foliar against blossom-end rot', 70, { endDay: 330, repeatEveryDays: 14, product: 'Calcium foliar' }],
    ['task', 'Pick coloured fruit', 100, { endDay: 350, repeatEveryDays: 4 }],
  ]),
  strawberry: rows('strawberry', [
    ['task', 'Plant crowns or runners and lay mulch', 0],
    ['task', 'Remove the first flowers to build strong plants', 7, { endDay: 35, repeatEveryDays: 7 }],
    ['water', 'Fertigation — moderate nitrogen', 14, { endDay: 210, dose: 'Per your nutrient recipe' }],
    ['inspection', 'Scout for botrytis, spider mite and aphids', 14, { endDay: 210, repeatEveryDays: 4 }],
    ['spray', 'Preventive fungicide against grey mould', 35, { endDay: 200, repeatEveryDays: 10, product: 'Approved fungicide', withdrawalDays: 3 }],
    ['task', 'Remove runners and old leaves', 28, { endDay: 210, repeatEveryDays: 14 }],
    ['task', 'Pick ripe fruit', 42, { endDay: 210, repeatEveryDays: 3 }],
  ]),
};

// ═════════════════════════════════════════════════════════════════════════════
// Bees, insects, algae, forestry, mushrooms
// ═════════════════════════════════════════════════════════════════════════════
const SMALL: Record<string, CareItem[]> = {
  'honeybee-langstroth': rows('honeybee-langstroth', [
    ['inspection', 'Inspect the hive: queen, brood pattern, space and stores', 0, { endDay: 180, repeatEveryDays: 10 }],
    ['feed', 'Feed sugar syrup 1 : 1 if no nectar is flowing', 0, { endDay: 30, product: 'Sugar syrup 1 : 1', dose: 'About 1 L per colony as needed' }],
    ['task', 'Add a super when the frames are about 70–80 % covered', 45, { endDay: 120, repeatEveryDays: 14 }],
    ['inspection', 'Check varroa mites and small hive beetle', 0, { endDay: 180, repeatEveryDays: 30 }],
    ['task', 'Harvest capped honey frames', 120, { endDay: 135, notes: 'Leave about 10–15 kg of stores for the colony.' }],
    ['task', 'Extract, filter and settle the honey', 122, { endDay: 137 }],
    ['medication', 'Treat for varroa if needed', 140, { product: 'As advised by your beekeeping officer' }],
    ['task', 'Reduce the entrance and combine weak colonies', 150],
    ['inspection', 'Check for ants and wax moth', 0, { endDay: 180, repeatEveryDays: 14 }],
  ]),
  'honeybee-topbar': rows('honeybee-topbar', [
    ['task', 'Set up the hive, bait it with wax or lemongrass, and hang it in shade', 0],
    ['inspection', 'Check whether bees have colonised the hive', 14, { endDay: 60, repeatEveryDays: 14 }],
    ['inspection', 'Inspect the combs and brood', 21, { endDay: 365, repeatEveryDays: 14 }],
    ['task', 'Harvest honey combs from the back, leaving the brood', 90, { endDay: 360, repeatEveryDays: 90 }],
    ['inspection', 'Check ant guards, hive stand and roof', 0, { endDay: 365, repeatEveryDays: 14 }],
    ['inspection', 'Check for wax moth and small hive beetle', 0, { endDay: 365, repeatEveryDays: 30 }],
  ]),
  'stingless-bee': rows('stingless-bee', [
    ['task', 'Acquire or transfer the colony into its box', 0, { endDay: 30 }],
    ['inspection', 'Inspect the colony gently', 30, { endDay: 390, repeatEveryDays: 30 }],
    ['feed', 'Feed syrup only if there is no forage', 30, { endDay: 390, product: 'Sugar syrup 1 : 1' }],
    ['inspection', 'Check for ants and phorid flies', 0, { endDay: 400, repeatEveryDays: 14 }],
    ['weighing', 'Weigh the hive to track colony growth', 30, { endDay: 395, repeatEveryDays: 30 }],
    ['task', 'Harvest a small amount of honey', 395, { endDay: 398 }],
    ['task', 'Divide the strong colony into two', 398, { endDay: 488 }],
  ]),
  'bsf-larvae': rows('bsf-larvae', [
    ['inspection', 'Adult fly cage: keep at about 27–30 °C, 60–70 % humidity, with light', 0, { endDay: 21 }],
    ['task', 'Place egg traps (corrugated cardboard) over decaying material', 7, { endDay: 21, repeatEveryDays: 2 }],
    ['task', 'Collect the eggs and put them in the nursery box', 21, { notes: 'Hatching takes about 4 days at 28 °C.' }],
    ['task', 'Move the hatchlings onto the waste bed', 25],
    ['feed', 'Feed the larvae', 25, { endDay: 38, product: 'Organic waste — kitchen or crop waste, in small portions', dose: 'Keep the layer under 5 cm; moisture about 60–70 %' }],
    ['inspection', 'Check temperature, moisture and smell', 25, { endDay: 38, repeatEveryDays: 1 }],
    ['task', 'Harvest the pre-pupae and sift the frass', 39],
    ['task', 'Keep about 10 % of the pre-pupae to start the next breeding colony', 39],
  ]),
  'cricket-farming': rows('cricket-farming', [
    ['task', 'Put laying medium (moist peat or soil) in the breeding box', 0, { endDay: 7, repeatEveryDays: 2 }],
    ['task', 'Remove the laying trays and incubate at 30–32 °C', 7],
    ['feed', 'Feed the nymphs', 17, { endDay: 44, product: 'Ground starter feed (about 20–22 % protein) + fresh greens', dose: 'Fresh daily; remove leftovers' }],
    ['water', 'Provide clean water gel or wet cotton', 17, { endDay: 44 }],
    ['task', 'Remove dead crickets and clean the boxes', 17, { endDay: 44, repeatEveryDays: 2 }],
    ['weighing', 'Weigh a sample', 30, { endDay: 44, repeatEveryDays: 10 }],
    ['task', 'Harvest: chill, then freeze for 24 hours', 45],
    ['task', 'Keep about 10 % as breeders', 45],
  ]),
  'mealworm-farming': rows('mealworm-farming', [
    ['feed', 'Feed the colony', 0, { endDay: 100, product: 'Wheat bran with a slice of vegetable', dose: 'Twice a week' }],
    ['inspection', 'Keep the temperature about 25–28 °C and humidity about 50–70 %', 0, { endDay: 123 }],
    ['task', 'Sift out the eggs and move them to a separate tray', 7, { endDay: 30, repeatEveryDays: 7 }],
    ['task', 'Sift and clean the larval trays', 30, { endDay: 100, repeatEveryDays: 14 }],
    ['task', 'Harvest the larvae when they reach about 2.5 cm', 100],
    ['task', 'Separate the pupae into a new tray', 100, { endDay: 121 }],
    ['task', 'Return emerged beetles to the breeding colony', 121],
  ]),
  'silkworm-sericulture': rows('silkworm-sericulture', [
    ['task', 'Disinfect the rearing room and equipment', 0],
    ['inspection', 'Incubate the eggs at about 25 °C with high humidity', 0, { endDay: 9 }],
    ['feed', 'Young silkworms: feed tender mulberry leaves', 10, { endDay: 21, product: 'Tender mulberry leaves, chopped', dose: '3–4 times a day' }],
    ['feed', 'Late-age silkworms: feed mature mulberry leaves', 22, { endDay: 33, product: 'Mature mulberry leaves', dose: '4 times a day, plenty' }],
    ['task', 'Clean the beds and remove litter', 10, { endDay: 33, repeatEveryDays: 1 }],
    ['inspection', 'Watch for moulting — stop feeding until most worms have moulted', 10, { endDay: 33 }],
    ['task', 'Move ripe worms onto the mountages', 34],
    ['task', 'Harvest cocoons', 39, { endDay: 40 }],
    ['task', 'Sort the cocoons; stifle and reel or sell', 41],
  ]),
  vermiculture: rows('vermiculture', [
    ['task', 'Make the bedding; add the worms', 0, { endDay: 14 }],
    ['inspection', 'Keep the bed moist like a wrung-out sponge, at about 20–27 °C', 0, { endDay: 111, repeatEveryDays: 1 }],
    ['feed', 'Add feed in a thin layer', 14, { endDay: 100, repeatEveryDays: 7, product: 'Kitchen waste or aged manure', dose: 'No more than the worms can eat; avoid citrus, onion, meat', notes: 'Keep the feed under about 5 cm.' }],
    ['task', 'Harvest: move the worms to a new bed with fresh bait feed', 104, { endDay: 111 }],
    ['task', 'Sift and cure the vermicompost', 108],
  ]),
  'snail-heliciculture': rows('snail-heliciculture', [
    ['feed', 'Breeders: leaves, calcium and a protein feed', 0, { endDay: 60, product: 'Lettuce, cabbage, pawpaw leaves + crushed shell', dose: 'Fresh each evening' }],
    ['task', 'Collect egg clutches and incubate in damp soil at about 25–28 °C', 14, { endDay: 60, repeatEveryDays: 7 }],
    ['feed', 'Hatchlings: tender leaves with calcium', 88, { endDay: 147, product: 'Tender leaves + calcium + a little protein feed' }],
    ['feed', 'Grow-out feed', 148, { endDay: 298, product: 'Protein feed (about 16–20 %), leaves and calcium' }],
    ['inspection', 'Keep pens damp (mist morning and evening) and shaded', 0, { endDay: 305 }],
    ['task', 'Clean the pens and remove dead snails', 0, { endDay: 305, repeatEveryDays: 7 }],
    ['task', 'Grade by size', 148, { endDay: 298, repeatEveryDays: 60 }],
    ['task', 'Harvest at market size', 298, { endDay: 305 }],
  ]),
  'seaweed-farming': rows('seaweed-farming', [
    ['task', 'Set up lines or rafts; check depth, salinity and current', 0, { endDay: 13 }],
    ['task', 'Seed: tie cuttings of about 100 g, 20–25 cm apart', 14, { endDay: 16 }],
    ['inspection', 'Clean the lines, replace lost plants, check for whitening (ice-ice)', 17, { endDay: 66, repeatEveryDays: 7 }],
    ['weighing', 'Weigh a sample — the weight should roughly double every two weeks', 31, { endDay: 59, repeatEveryDays: 14 }],
    ['task', 'Harvest at 45–60 days; keep seed stock for the next crop', 66, { endDay: 69 }],
    ['task', 'Dry on raised racks until crisp', 69, { endDay: 75 }],
  ]),
  'spirulina-microalgae': rows('spirulina-microalgae', [
    ['task', 'Inoculate the culture and build up to full volume', 0, { endDay: 13 }],
    ['inspection', 'Check pH (about 9–11), temperature and density', 0, { endDay: 380, repeatEveryDays: 1 }],
    ['fertiliser', 'Top up the nutrient medium', 14, { endDay: 365, repeatEveryDays: 7, product: 'Culture medium (e.g. Zarrouk)' }],
    ['inspection', 'Check under the microscope for contamination', 7, { endDay: 365, repeatEveryDays: 7 }],
    ['task', 'Harvest and filter', 21, { endDay: 365, repeatEveryDays: 3 }],
    ['task', 'Wash and dry or freeze the biomass; recycle the filtrate', 21, { endDay: 365, repeatEveryDays: 3 }],
  ]),
  'timber-forestry': rows('timber-forestry', [
    ['task', 'Clear the site and mark fire breaks', 0],
    ['task', 'Dig planting holes', 30, { notes: 'About 30 × 30 × 30 cm at your chosen spacing.' }],
    ['task', 'Plant at the start of the rains', 60],
    ['task', 'Replace seedlings that have died', 90],
    ['task', 'Weed around the trees', 90, { endDay: 365, repeatEveryDays: 90 }],
    ['inspection', 'Check for termites, borers and disease', 90, { endDay: 1185, repeatEveryDays: 90 }],
    ['task', 'Maintain the fire breaks before the dry season', 240, { endDay: 2000, repeatEveryDays: 365 }],
    ['task', 'Formative pruning', 365, { endDay: 730, repeatEveryDays: 365 }],
    ['task', 'First thinning', 1185, { notes: 'Remove the weakest trees to leave the final stand.' }],
    ['task', 'Second thinning', 1650],
    ['task', 'Final harvest', 1915],
  ]),
  agroforestry: rows('agroforestry', [
    ['task', 'Design the layout: tree rows on the contour, species mix, spacing', 0],
    ['task', 'Plant the trees at the start of the rains', 30],
    ['task', 'Protect from livestock, termites and fire', 45],
    ['task', 'Weed around the trees', 60, { endDay: 365, repeatEveryDays: 60 }],
    ['task', 'Prune nitrogen-fixing trees as green manure', 180, { endDay: 740, repeatEveryDays: 120 }],
    ['task', 'Plant crops between the tree rows', 395],
    ['task', 'Bring in livestock only when the trees are well established', 500],
    ['task', 'Harvest timber, poles or fruit as they mature', 760, { endDay: 820 }],
  ]),
  'oyster-mushroom': rows('oyster-mushroom', [
    ['task', 'Prepare and pasteurise the substrate', 0, { notes: 'Soak, then heat to about 60–80 °C for 1–2 hours or steam it.' }],
    ['task', 'Cool to about 30 °C and inoculate with spawn', 1, { notes: 'About 3–5 % spawn by weight; keep everything clean.' }],
    ['inspection', 'Incubate in the dark at about 22–28 °C; check for green or black mould', 2, { endDay: 21, repeatEveryDays: 3 }],
    ['task', 'Move bags to the fruiting room when fully white', 21],
    ['inspection', 'Keep humidity high (about 85–95 %) with fresh air; mist 2–3 times a day', 21, { endDay: 70 }],
    ['task', 'Harvest mature mushrooms — pick when the cap edges are still curled', 28, { endDay: 35, repeatEveryDays: 1 }],
    ['task', 'Rest the bags between flushes and remove contaminated bags', 35, { endDay: 70, repeatEveryDays: 3 }],
  ]),
  'button-mushroom': rows('button-mushroom', [
    ['task', 'Phase I composting: make the compost heap', 0],
    ['task', 'Turn the compost', 4, { endDay: 14, repeatEveryDays: 3 }],
    ['inspection', 'Phase II: pasteurise indoors, then condition', 17, { endDay: 23 }],
    ['task', 'Spawn the compost and fill the trays', 24],
    ['inspection', 'Spawn run: keep about 24–25 °C and high humidity', 24, { endDay: 37 }],
    ['task', 'Apply the casing layer', 38],
    ['inspection', 'Case run: keep casing moist; watch temperature and CO₂', 38, { endDay: 47 }],
    ['task', 'Lower the temperature to induce pinning', 48, { notes: 'About 16–18 °C with plenty of fresh air.' }],
    ['task', 'Pick mushrooms before the veil opens', 58, { endDay: 100, repeatEveryDays: 1 }],
  ]),
};

// ═════════════════════════════════════════════════════════════════════════════
// Processing and service operations — routine checks instead of a growing cycle
// ═════════════════════════════════════════════════════════════════════════════
const OPS: Record<string, CareItem[]> = {
  maize_milling: rows('maize_milling', [
    ['inspection', 'Test incoming grain moisture, remove foreign matter, screen for mould', 0, { endDay: 30, repeatEveryDays: 1, notes: 'Grain should be about 12.5 % moisture or less.' }],
    ['task', 'Clean and lubricate the mill', 0, { endDay: 365, repeatEveryDays: 7 }],
    ['task', 'Check sieves and screens', 0, { endDay: 365, repeatEveryDays: 7 }],
    ['task', 'Calibrate the scales', 0, { endDay: 365, repeatEveryDays: 30 }],
    ['task', 'Pest control in the store', 0, { endDay: 365, repeatEveryDays: 30 }],
    ['task', 'Check dust build-up, fire extinguishers and electrical safety', 0, { endDay: 365, repeatEveryDays: 30 }],
    ['task', 'Add the fortification premix if required in your market, and check the dosing', 0, { endDay: 30, repeatEveryDays: 1 }],
    ['task', 'Label every bag with batch number and date', 0, { endDay: 30, repeatEveryDays: 1 }],
  ]),
  dairy_processing: rows('dairy_processing', [
    ['inspection', 'Test incoming milk (alcohol and acidity) and check its temperature', 0, { endDay: 30, repeatEveryDays: 1 }],
    ['task', 'Pasteurise (for example 63 °C for 30 minutes, or 72 °C for 15 seconds)', 1, { endDay: 30, repeatEveryDays: 1 }],
    ['task', 'Yoghurt: culture and incubate at about 43 °C for 4–6 hours; check pH reaches about 4.5', 2, { endDay: 30, repeatEveryDays: 1 }],
    ['inspection', 'Keep finished products cold (4 °C or below) and log the temperature', 3, { endDay: 30, repeatEveryDays: 1 }],
    ['task', 'Clean equipment after every batch (CIP)', 0, { endDay: 365, repeatEveryDays: 1 }],
    ['task', 'Calibrate thermometers', 0, { endDay: 365, repeatEveryDays: 7 }],
    ['task', 'Send a sample for bacterial count', 0, { endDay: 365, repeatEveryDays: 30 }],
    ['task', 'Check staff hygiene and medical certificates', 0, { endDay: 365, repeatEveryDays: 30 }],
  ]),
  'honey-processing': rows('honey-processing', [
    ['inspection', 'Test the moisture of incoming honey', 0, { endDay: 30, repeatEveryDays: 1, notes: 'Aim for 20 % or less.' }],
    ['task', 'Uncap and extract', 1, { endDay: 30, repeatEveryDays: 1 }],
    ['task', 'Settle for about 48 hours, then filter', 2, { endDay: 30, repeatEveryDays: 1, notes: 'Do not heat above about 40 °C.' }],
    ['task', 'Bottle, label with batch number and date, and store cool and dry', 3, { endDay: 30, repeatEveryDays: 1 }],
    ['task', 'Clean and sanitise equipment', 0, { endDay: 365, repeatEveryDays: 7 }],
    ['task', 'Keep a sample from each batch', 0, { endDay: 365, repeatEveryDays: 7 }],
  ]),
  'cassava-processing': rows('cassava-processing', [
    ['task', 'Process cassava within 24–48 hours of harvest', 0, { endDay: 30, repeatEveryDays: 1 }],
    ['task', 'Peel, wash, grate, press and crumble to remove cyanide', 0, { endDay: 30, repeatEveryDays: 1 }],
    ['inspection', 'Dry to about 12–13 % moisture', 1, { endDay: 30, repeatEveryDays: 1 }],
    ['task', 'Mill, sieve and pack; label with batch and date', 2, { endDay: 30, repeatEveryDays: 1 }],
    ['task', 'Clean the equipment and drying racks', 0, { endDay: 365, repeatEveryDays: 7 }],
    ['task', 'Check storage for pests and damp', 0, { endDay: 365, repeatEveryDays: 14 }],
  ]),
  'fruit-juice': rows('fruit-juice', [
    ['task', 'Sort and wash the fruit', 0, { endDay: 30, repeatEveryDays: 1 }],
    ['task', 'Extract and clarify', 0, { endDay: 30, repeatEveryDays: 1 }],
    ['inspection', 'Check Brix and pH of each batch', 0, { endDay: 30, repeatEveryDays: 1 }],
    ['task', 'Pasteurise and hot-fill (about 85 °C or above)', 1, { endDay: 30, repeatEveryDays: 1 }],
    ['task', 'Sterilise bottles and caps; label with date and batch', 1, { endDay: 30, repeatEveryDays: 1 }],
    ['task', 'Clean in place after every run', 0, { endDay: 365, repeatEveryDays: 1 }],
    ['task', 'Calibrate the thermometer and refractometer', 0, { endDay: 365, repeatEveryDays: 30 }],
  ]),
  'feed-mill': rows('feed-mill', [
    ['inspection', 'Check raw materials for moisture, mould and foreign matter', 0, { endDay: 30, repeatEveryDays: 1 }],
    ['task', 'Calibrate the scales', 0, { endDay: 365, repeatEveryDays: 14 }],
    ['task', 'Mix to the formula and mix for the correct time', 0, { endDay: 30, repeatEveryDays: 1 }],
    ['task', 'Flush the mixer between medicated and plain feed', 0, { endDay: 30, repeatEveryDays: 1 }],
    ['task', 'Bag, label with batch, date and expiry; keep a retained sample', 0, { endDay: 30, repeatEveryDays: 1 }],
    ['task', 'Test mixer uniformity', 0, { endDay: 365, repeatEveryDays: 90 }],
    ['task', 'Pest control and store hygiene', 0, { endDay: 365, repeatEveryDays: 30 }],
  ]),
  'vet-services': rows('vet-services', [
    ['inspection', 'Check the vaccine fridge temperature (2–8 °C) and log it', 0, { endDay: 365, repeatEveryDays: 1 }],
    ['task', 'Check expiry dates on drugs and vaccines', 0, { endDay: 365, repeatEveryDays: 30 }],
    ['task', 'Update the controlled-drug register', 0, { endDay: 365, repeatEveryDays: 7 }],
    ['task', 'Sterilise instruments and clean the consulting room', 0, { endDay: 365, repeatEveryDays: 1 }],
    ['task', 'Follow-up call to clients treated in the last week', 0, { endDay: 365, repeatEveryDays: 7 }],
    ['task', 'Back up the records and reconcile payments', 0, { endDay: 365, repeatEveryDays: 7 }],
  ]),
  'agri-consulting': rows('agri-consulting', [
    ['task', 'Initial farm diagnostic visit', 0],
    ['task', 'Deliver the farm plan to the client', 14],
    ['task', 'Monitoring visit', 28, { endDay: 300, repeatEveryDays: 28 }],
    ['task', 'Send a progress note to the client', 14, { endDay: 300, repeatEveryDays: 14 }],
    ['task', 'End-of-season evaluation with the client', 300],
    ['task', 'Invoice and collect payment', 0, { endDay: 300, repeatEveryDays: 30 }],
  ]),
  'equipment-hire': rows('equipment-hire', [
    ['task', 'Inspect the equipment before and after every hire', 0, { endDay: 365, repeatEveryDays: 1 }],
    ['task', 'Check oil, fuel, coolant and tyre pressure', 0, { endDay: 365, repeatEveryDays: 7 }],
    ['task', 'Service at the interval in the manual (for example every 250 hours)', 30, { endDay: 365, repeatEveryDays: 60 }],
    ['task', 'Update the maintenance log', 0, { endDay: 365, repeatEveryDays: 7 }],
    ['task', 'Check insurance and licences are current', 0, { endDay: 365, repeatEveryDays: 90 }],
    ['task', 'Confirm next month\'s bookings with clients', 0, { endDay: 365, repeatEveryDays: 30 }],
  ]),
  'farmer-training': rows('farmer-training', [
    ['task', 'Run the needs assessment', 0],
    ['task', 'Finalise the curriculum and materials', 7],
    ['task', 'Confirm venue, trainers and materials two days before each session', 12, { endDay: 120, repeatEveryDays: 14 }],
    ['task', 'Deliver the training session', 14, { endDay: 120, repeatEveryDays: 14 }],
    ['task', 'Record attendance and collect feedback', 14, { endDay: 120, repeatEveryDays: 14 }],
    ['task', 'Follow-up visit to see what farmers have adopted', 60, { endDay: 180, repeatEveryDays: 30 }],
    ['task', 'Impact evaluation', 180],
  ]),
  'agri-lab-testing': rows('agri-lab-testing', [
    ['task', 'Check samples in and record the chain of custody', 0, { endDay: 365, repeatEveryDays: 1 }],
    ['task', 'Calibrate the balances and pH meters', 0, { endDay: 365, repeatEveryDays: 7 }],
    ['task', 'Run quality-control samples with each batch', 0, { endDay: 365, repeatEveryDays: 1 }],
    ['task', 'Check reagent expiry dates', 0, { endDay: 365, repeatEveryDays: 30 }],
    ['task', 'Review results before issuing each report', 0, { endDay: 365, repeatEveryDays: 1 }],
    ['task', 'Take part in a proficiency test', 90, { endDay: 365, repeatEveryDays: 90 }],
  ]),
};

/** Starter guides for every template not covered in careSchedule.ts. */
export const CARE_DEFAULTS_2: Record<string, CareItem[]> = {
  ...FIELD, ...VEG, ...ORCHARD, ...BIRDS, ...STOCK, ...AQUA, ...GREEN, ...SMALL, ...OPS,
};
