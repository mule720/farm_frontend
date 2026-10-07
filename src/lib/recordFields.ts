// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Daily record fields
// The built-in defaults for what to log every day, per enterprise category.
// A farmer's own standards (ProductionTemplate.recordFields) take priority;
// these are only used when a template has not been customised.
//   visibleFor  — variant ids the field applies to; omitted = always shown
//   computed    — derived from other numeric fields (computedFrom)
// ─────────────────────────────────────────────────────────────────────────────
import type { ProductionCycle, ProductionTemplate, RecordFieldDef } from './types';

export const CATEGORY_DAILY_FIELDS: Record<string, RecordFieldDef[]> = {

  // ── POULTRY ────────────────────────────────────────────────────────────────
  poultry: [
    // Layer / breeder fields
    { id: 'eggs_collected',  label: 'Eggs Collected',      type: 'number', unit: 'eggs',  required: true,
      goodDirection: 'up',
      visibleFor: ['layer_from_chicks','layer_from_pol','layer_continuing','breeder_flock','quail_cycle','duck_cycle'] },
    { id: 'cracked_eggs',    label: 'Cracked / Broken',    type: 'number', unit: 'eggs',
      visibleFor: ['layer_from_chicks','layer_from_pol','layer_continuing','breeder_flock','quail_cycle','duck_cycle'] },
    { id: 'egg_trays',       label: 'Trays Collected',     type: 'number', unit: 'trays',
      hint: '30 eggs per tray',
      visibleFor: ['layer_from_chicks','layer_from_pol','layer_continuing','breeder_flock'] },
    { id: 'eggs_to_incubation', label: 'Eggs Set for Incubation', type: 'number', unit: 'eggs',
      hint: 'Fertile eggs transferred to setter today',
      visibleFor: ['breeder_flock'] },

    // Incubation fields
    { id: 'setter_temp',     label: 'Setter Temperature',  type: 'number', unit: '°C',    required: true,
      benchmark: { min: 37.2, max: 37.8, target: 37.5 }, goodDirection: 'neutral',
      visibleFor: ['incubation'] },
    { id: 'setter_humidity', label: 'Setter Humidity',     type: 'number', unit: '%RH',   required: true,
      benchmark: { min: 55, max: 65, target: 60 }, goodDirection: 'neutral',
      visibleFor: ['incubation'] },
    { id: 'hatcher_temp',    label: 'Hatcher Temperature', type: 'number', unit: '°C',
      benchmark: { min: 36.9, max: 37.2, target: 37.0 }, goodDirection: 'neutral',
      visibleFor: ['incubation'] },
    { id: 'hatcher_humidity',label: 'Hatcher Humidity',    type: 'number', unit: '%RH',
      benchmark: { min: 70, max: 80, target: 75 }, goodDirection: 'neutral',
      visibleFor: ['incubation'] },
    { id: 'turner_status',   label: 'Turner / Auto-Turn',  type: 'select',
      options: ['Running OK','Manual turn done','Off — check immediately'],
      visibleFor: ['incubation'] },
    { id: 'candle_rejects',  label: 'Candle Rejects Removed', type: 'number', unit: 'eggs',
      hint: 'Infertile / dead eggs removed after candling',
      visibleFor: ['incubation'] },
    { id: 'chicks_hatched',  label: 'Chicks Hatched',      type: 'number', unit: 'chicks',
      goodDirection: 'up', visibleFor: ['incubation'] },
    { id: 'chicks_culled',   label: 'Chicks Culled / Weak',type: 'number', unit: 'chicks',
      goodDirection: 'down', visibleFor: ['incubation'] },

    // Universal poultry — all except incubation
    { id: 'feed_kg',         label: 'Feed Consumed',       type: 'number', unit: 'kg',    required: true,
      goodDirection: 'neutral',
      visibleFor: ['broiler_grow_out','layer_from_chicks','layer_from_pol','layer_continuing',
                   'breeder_flock','turkey_grow_out','duck_cycle','quail_cycle'] },
    { id: 'feed_type',       label: 'Type of Feed',        type: 'select',
      options: ['Starter','Grower','Finisher','Layer mash','Breeder feed','Own mix','Other'],
      visibleFor: ['broiler_grow_out','layer_from_chicks','layer_from_pol','layer_continuing',
                   'breeder_flock','turkey_grow_out','duck_cycle','quail_cycle'] },
    { id: 'water_additive',  label: 'Water Additive',      type: 'text',
      hint: 'Vitamins, electrolytes, acidifier, medication in the drinking water',
      visibleFor: ['broiler_grow_out','layer_from_chicks','layer_from_pol','layer_continuing',
                   'breeder_flock','turkey_grow_out','duck_cycle','quail_cycle'] },
    { id: 'treatment_given', label: 'Vaccine / Medicine Given', type: 'text',
      hint: 'Name, route and dose — e.g. Newcastle Lasota, eye drop',
      visibleFor: ['broiler_grow_out','layer_from_chicks','layer_from_pol','layer_continuing',
                   'breeder_flock','turkey_grow_out','duck_cycle','quail_cycle'] },
    { id: 'water_litres',    label: 'Water Consumed',      type: 'number', unit: 'L',
      visibleFor: ['broiler_grow_out','layer_from_chicks','layer_from_pol','layer_continuing',
                   'breeder_flock','turkey_grow_out','duck_cycle','quail_cycle'] },
    { id: 'mortality_count', label: 'Mortality Count',     type: 'number', unit: 'birds', goodDirection: 'down',
      visibleFor: ['broiler_grow_out','layer_from_chicks','layer_from_pol','layer_continuing',
                   'breeder_flock','turkey_grow_out','duck_cycle','quail_cycle'] },
    { id: 'mortality_reason',label: 'Mortality Reason',    type: 'select',
      options: ['Unknown','Disease','Injury','Predator','Heat stress','Cold stress','Culled','Other'],
      visibleFor: ['broiler_grow_out','layer_from_chicks','layer_from_pol','layer_continuing',
                   'breeder_flock','turkey_grow_out','duck_cycle','quail_cycle'] },
    { id: 'avg_body_weight', label: 'Avg Body Weight Sample', type: 'number', unit: 'g',
      hint: 'Sample 10–20 birds and enter average',
      visibleFor: ['broiler_grow_out','layer_from_chicks','turkey_grow_out','duck_cycle','quail_cycle'] },
    { id: 'litter_condition',label: 'Litter Condition',    type: 'select',
      options: ['Dry & crumbly (excellent)','Slightly damp (acceptable)','Wet / caked (action needed)','Very wet (critical)'],
      visibleFor: ['broiler_grow_out','turkey_grow_out'] },
    { id: 'house_temp',      label: 'House Temperature',   type: 'number', unit: '°C',
      benchmark: { min: 18, max: 32 }, goodDirection: 'neutral',
      visibleFor: ['broiler_grow_out','layer_from_chicks','layer_from_pol','layer_continuing',
                   'breeder_flock','turkey_grow_out','duck_cycle','quail_cycle'] },
    { id: 'live_bird_count', label: 'Live Bird Count',     type: 'number', unit: 'birds',
      hint: 'Current total — subtract mortalities daily',
      visibleFor: ['broiler_grow_out','layer_from_chicks','layer_from_pol','layer_continuing',
                   'breeder_flock','turkey_grow_out','duck_cycle','quail_cycle'] },
  ],

  // ── LIVESTOCK ──────────────────────────────────────────────────────────────
  livestock: [
    { id: 'milk_morning',    label: 'Morning Milk',        type: 'number', unit: 'L',     required: true, goodDirection: 'up' },
    { id: 'milk_afternoon',  label: 'Afternoon Milk',      type: 'number', unit: 'L',                    goodDirection: 'up' },
    { id: 'milk_evening',    label: 'Evening Milk',        type: 'number', unit: 'L',                    goodDirection: 'up' },
    { id: 'milk_total',      label: 'Total Milk Yield',    type: 'computed', unit: 'L',
      computedFrom: ['milk_morning','milk_afternoon','milk_evening'], goodDirection: 'up' },
    { id: 'milking_animals', label: 'Animals Milked',      type: 'number', unit: 'head' },
    { id: 'concentrate_kg',  label: 'Concentrate Feed',    type: 'number', unit: 'kg' },
    { id: 'fodder_kg',       label: 'Fodder / Roughage',   type: 'number', unit: 'kg' },
    { id: 'water_litres',    label: 'Water Consumed',      type: 'number', unit: 'L' },
    { id: 'feed_type',       label: 'Type of Feed',        type: 'select',
      options: ['Pasture / grazing','Hay','Silage','Crop residue','Dairy meal','Grower ration','Finisher ration','Mineral lick','Own mix','Other'] },
    { id: 'treatment_given', label: 'Vaccine / Medicine / Dip', type: 'text',
      hint: 'Product, dose and animals treated — e.g. FMD vaccine, 12 head' },
    { id: 'mortality_count', label: 'Deaths / Culls',      type: 'number', unit: 'head',  goodDirection: 'down' },
    { id: 'calvings',        label: 'Births / Calvings',   type: 'number', unit: 'head',  goodDirection: 'up' },
    { id: 'health_flag',     label: 'Health Status',       type: 'select',
      options: ['All healthy','Monitor 1–2 animals','Sick animal(s) — see notes','Emergency — vet called'] },
    { id: 'avg_body_weight', label: 'Avg Body Weight Sample', type: 'number', unit: 'kg',
      hint: 'Weigh 3–5 animals and average' },
  ],

  // ── AQUACULTURE ────────────────────────────────────────────────────────────
  aquaculture: [
    { id: 'feed_kg',         label: 'Feed Given',          type: 'number', unit: 'kg',    required: true, goodDirection: 'neutral' },
    { id: 'water_temp',      label: 'Water Temperature',   type: 'number', unit: '°C',    required: true,
      benchmark: { min: 25, max: 32, target: 28 }, goodDirection: 'neutral' },
    { id: 'dissolved_o2',    label: 'Dissolved Oxygen',    type: 'number', unit: 'mg/L',  required: true,
      benchmark: { min: 5, max: 10, target: 7 }, goodDirection: 'up' },
    { id: 'ph',              label: 'pH Level',            type: 'number', unit: 'pH',
      benchmark: { min: 6.5, max: 8.5, target: 7.5 }, goodDirection: 'neutral' },
    { id: 'ammonia',         label: 'Ammonia (NH₃)',       type: 'number', unit: 'mg/L',
      benchmark: { max: 0.02 }, goodDirection: 'down' },
    { id: 'turbidity',       label: 'Turbidity / Secchi',  type: 'number', unit: 'cm' },
    { id: 'feed_type',       label: 'Type of Feed',        type: 'select',
      options: ['Fingerling starter','Grower pellet','Finisher pellet','Own mix','Natural (pond fertiliser)','Other'] },
    { id: 'treatment_given', label: 'Treatment / Pond Input', type: 'text',
      hint: 'Lime, salt, fertiliser, medication — product and amount' },
    { id: 'mortality_count', label: 'Mortality Count',     type: 'number', unit: 'fish',  goodDirection: 'down' },
    { id: 'water_change_pct',label: 'Water Change',        type: 'number', unit: '%' },
    { id: 'avg_weight_g',    label: 'Avg Weight Sample',   type: 'number', unit: 'g',
      hint: 'Weigh 10–20 fish from a single pond/tank', goodDirection: 'up' },
    { id: 'feeding_response',label: 'Feeding Response',    type: 'select',
      options: ['Vigorous — all food consumed','Good — consumed within 30min','Poor — leftover feed','Very poor — not feeding'] },
  ],

  // ── CROPS ──────────────────────────────────────────────────────────────────
  crops: [
    { id: 'irrigation_mm',   label: 'Irrigation Applied',  type: 'number', unit: 'mm' },
    { id: 'fertilizer_kg',   label: 'Fertilizer Applied',  type: 'number', unit: 'kg/ha' },
    { id: 'pest_pressure',   label: 'Pest Pressure',       type: 'select',
      options: ['None observed','Low — monitor','Moderate — spray threshold','High — immediate action'] },
    { id: 'disease_pressure',label: 'Disease Pressure',    type: 'select',
      options: ['None observed','Low — monitor','Moderate — treat','High — severe'] },
    { id: 'growth_stage',    label: 'Growth Stage',        type: 'select',
      options: ['Germination','Seedling','Vegetative','Flowering','Grain fill','Maturity','Harvest ready'] },
    { id: 'harvest_kg',      label: 'Harvest Collected',   type: 'number', unit: 'kg',  goodDirection: 'up' },
    { id: 'spray_product',   label: 'Spray Applied',       type: 'text',   hint: 'Product name + rate' },
    { id: 'fertilizer_type', label: 'Fertiliser Type',     type: 'text',   hint: 'Compound D, urea, CAN, manure…' },
    { id: 'weeding_done',    label: 'Weeding / Cultivation', type: 'select', options: ['No','Hand weeding','Herbicide','Cultivator'] },
    { id: 'rain_mm',         label: 'Rainfall',            type: 'number', unit: 'mm' },
  ],

  // ── HORTICULTURE ───────────────────────────────────────────────────────────
  horticulture: [
    { id: 'harvest_kg',      label: 'Harvest Weight',      type: 'number', unit: 'kg',    required: true, goodDirection: 'up' },
    { id: 'harvest_units',   label: 'Units Harvested',     type: 'number', unit: 'units', goodDirection: 'up' },
    { id: 'grade_a_kg',      label: 'Grade A',             type: 'number', unit: 'kg',    goodDirection: 'up' },
    { id: 'grade_b_kg',      label: 'Grade B / Seconds',   type: 'number', unit: 'kg' },
    { id: 'rejects_kg',      label: 'Rejects / Waste',     type: 'number', unit: 'kg',    goodDirection: 'down' },
    { id: 'irrigation_mm',   label: 'Irrigation Applied',  type: 'number', unit: 'mm' },
    { id: 'spray_product',   label: 'Spray Applied',       type: 'text',   hint: 'Product, rate and target (fungicide / insecticide)' },
    { id: 'fertilizer_type', label: 'Fertiliser Applied',  type: 'text',   hint: 'Type and amount — e.g. CAN 50 kg' },
    { id: 'pest_disease',    label: 'Pest / Disease Flag',  type: 'select',
      options: ['None','Aphids','Spider mite','Whitefly','Botrytis','Downy mildew','Other — see notes'] },
    { id: 'plant_health',    label: 'Plant Health',        type: 'select',
      options: ['Excellent','Good','Fair — monitor','Concern — action needed'] },
  ],

  // ── GREENHOUSE ─────────────────────────────────────────────────────────────
  greenhouse: [
    { id: 'ec',              label: 'Nutrient Solution EC', type: 'number', unit: 'mS/cm', required: true,
      benchmark: { min: 1.2, max: 2.5, target: 1.8 }, goodDirection: 'neutral' },
    { id: 'ph',              label: 'Nutrient Solution pH', type: 'number', unit: 'pH',    required: true,
      benchmark: { min: 5.5, max: 6.5, target: 6.0 }, goodDirection: 'neutral' },
    { id: 'air_temp',        label: 'Air Temperature',     type: 'number', unit: '°C',
      benchmark: { min: 18, max: 28 }, goodDirection: 'neutral' },
    { id: 'humidity',        label: 'Humidity',            type: 'number', unit: '%',
      benchmark: { min: 60, max: 80 }, goodDirection: 'neutral' },
    { id: 'nutrient_topup_l',label: 'Nutrient Top-Up',     type: 'number', unit: 'L' },
    { id: 'harvest_kg',      label: 'Harvest Weight',      type: 'number', unit: 'kg',    goodDirection: 'up' },
    { id: 'harvest_units',   label: 'Plants Harvested',    type: 'number', unit: 'plants',goodDirection: 'up' },
    { id: 'plant_health',    label: 'Plant Health',        type: 'select',
      options: ['Excellent','Good','Yellowing — check nutrients','Wilting — check roots','Disease spotted'] },
    { id: 'pest_flag',       label: 'Pest Observation',    type: 'select',
      options: ['None','Aphids','Spider mite','Fungus gnats','Thrips','Other'] },
  ],

  // ── ORCHARD ────────────────────────────────────────────────────────────────
  orchard: [
    { id: 'irrigation_hours',label: 'Irrigation Duration', type: 'number', unit: 'hours' },
    { id: 'irrigation_mm',   label: 'Irrigation Amount',   type: 'number', unit: 'mm' },
    { id: 'spray_product',   label: 'Spray Applied',       type: 'text',   hint: 'Product, concentration, and target (fungicide / insecticide / foliar)' },
    { id: 'pest_pressure',   label: 'Pest / Disease Scouting', type: 'select',
      options: ['None detected','Low — continue monitoring','Moderate — schedule spray','High — immediate action'] },
    { id: 'fruit_thinned',   label: 'Fruit Thinned',       type: 'number', unit: 'fruits',
      hint: 'Hand-thinning count to improve sizing' },
    { id: 'harvest_kg',      label: 'Harvest Collected',   type: 'number', unit: 'kg',    goodDirection: 'up' },
    { id: 'fruit_grade_a_kg',label: 'Grade A Fruit',       type: 'number', unit: 'kg',    goodDirection: 'up' },
    { id: 'fruit_rejects_kg',label: 'Rejects / Drops',     type: 'number', unit: 'kg',    goodDirection: 'down' },
    { id: 'tree_health',     label: 'Tree Health Status',  type: 'select',
      options: ['All healthy','Minor yellowing — monitor','Suspected disease — isolate','Confirmed disease — action'] },
    { id: 'rain_mm',         label: 'Rainfall',            type: 'number', unit: 'mm' },
  ],

  // ── APIARY ─────────────────────────────────────────────────────────────────
  apiary: [
    { id: 'hives_inspected', label: 'Hives Inspected',     type: 'number', unit: 'hives' },
    { id: 'hive_status',     label: 'General Hive Status', type: 'select',
      options: ['All healthy & queenright','1–2 hives weak — monitor','Queenless hive detected','Swarming activity','Disease signs (varroa/EFB/AFB)'] },
    { id: 'honey_super_kg',  label: 'Honey Super Weight',  type: 'number', unit: 'kg',    goodDirection: 'up',
      hint: 'Total weight of honey supers across all hives' },
    { id: 'honey_harvested_kg', label: 'Honey Harvested',  type: 'number', unit: 'kg',    goodDirection: 'up' },
    { id: 'mite_count',      label: 'Varroa Mite Count',   type: 'number', unit: 'mites/100 bees',
      benchmark: { max: 3 }, goodDirection: 'down' },
    { id: 'treatment',       label: 'Treatment Applied',   type: 'text',   hint: 'Product name + dose (oxalic, formic, etc.)' },
    { id: 'feed_syrup_l',    label: 'Syrup Fed',           type: 'number', unit: 'L' },
  ],

  // ── MUSHROOM ───────────────────────────────────────────────────────────────
  mushroom: [
    { id: 'air_temp',        label: 'Air Temperature',     type: 'number', unit: '°C',
      benchmark: { min: 16, max: 24, target: 20 }, goodDirection: 'neutral' },
    { id: 'humidity',        label: 'Humidity',            type: 'number', unit: '%',
      benchmark: { min: 80, max: 95, target: 90 }, goodDirection: 'neutral' },
    { id: 'co2_ppm',         label: 'CO₂ Level',           type: 'number', unit: 'ppm',
      benchmark: { max: 1000 }, goodDirection: 'down' },
    { id: 'pinning_count',   label: 'Pinning Count',       type: 'number', unit: 'fruiting bodies', goodDirection: 'up' },
    { id: 'harvest_kg',      label: 'Harvest Weight',      type: 'number', unit: 'kg',    goodDirection: 'up' },
    { id: 'substrate_moisture', label: 'Substrate Moisture', type: 'select',
      options: ['Optimal (60–70%)','Too dry — mist','Too wet — air out','Contamination visible'] },
    { id: 'contamination',   label: 'Contamination',       type: 'select',
      options: ['None','Slight — isolated','Moderate — quarantine block','Severe — dispose'] },
    { id: 'misting_done',    label: 'Misting Done',        type: 'select',  options: ['Yes','No','Partial'] },
  ],

  // ── PROCESSING ─────────────────────────────────────────────────────────────
  processing: [
    { id: 'input_kg',        label: 'Raw Input Received',  type: 'number', unit: 'kg',    required: true },
    { id: 'output_kg',       label: 'Finished Output',     type: 'number', unit: 'kg',    required: true, goodDirection: 'up' },
    { id: 'waste_kg',        label: 'Waste / Loss',        type: 'number', unit: 'kg',    goodDirection: 'down' },
    { id: 'yield_pct',       label: 'Processing Yield',    type: 'computed', unit: '%',
      computedFrom: ['output_kg','input_kg'], goodDirection: 'up',
      hint: 'Auto-calculated: output ÷ input × 100' },
    { id: 'batches',         label: 'Batches Processed',   type: 'number', unit: 'batches' },
    { id: 'downtime_hours',  label: 'Downtime',            type: 'number', unit: 'hours',  goodDirection: 'down' },
    { id: 'quality_pass',    label: 'Quality Check Result',type: 'select',
      options: ['Pass — all within spec','Minor deviation — acceptable','Fail — hold batch','Critical failure — destroy'] },
  ],

  // ── SERVICES ───────────────────────────────────────────────────────────────
  services: [
    { id: 'clients_served',  label: 'Clients Served',      type: 'number', unit: 'clients', goodDirection: 'up' },
    { id: 'hours_worked',    label: 'Hours Worked',        type: 'number', unit: 'hours' },
    { id: 'revenue_today',   label: 'Revenue Collected',   type: 'number', unit: 'currency', goodDirection: 'up' },
    { id: 'pending_invoices',label: 'Pending Invoices',    type: 'number', unit: 'invoices', goodDirection: 'down' },
    { id: 'service_type',    label: 'Service Type',        type: 'select',
      options: ['Consultation','Field visit','Training','Lab test','Advisory call','Other'] },
  ],

  // ── INSECTS & WORMS ────────────────────────────────────────────────────────
  insects: [
    { id: 'feed_kg',         label: 'Feed / Substrate Added', type: 'number', unit: 'kg', required: true },
    { id: 'feed_type',       label: 'Type of Feed',        type: 'select',
      options: ['Kitchen waste','Crop residue','Manure','Commercial feed','Bran / grain','Other'] },
    { id: 'air_temp',        label: 'Temperature',         type: 'number', unit: '°C',
      benchmark: { min: 24, max: 32 }, goodDirection: 'neutral' },
    { id: 'humidity',        label: 'Humidity',            type: 'number', unit: '%',
      benchmark: { min: 60, max: 80 }, goodDirection: 'neutral' },
    { id: 'substrate_moisture', label: 'Substrate Moisture', type: 'select',
      options: ['Optimal','Too dry — mist','Too wet — add dry matter'] },
    { id: 'harvest_kg',      label: 'Harvest Weight',      type: 'number', unit: 'kg', goodDirection: 'up' },
    { id: 'mortality_flag',  label: 'Mortality / Pests',   type: 'select',
      options: ['None','Some die-off','Mites / flies present','Heavy loss — see notes'] },
  ],

  // ── AQUATIC PLANTS & ALGAE ─────────────────────────────────────────────────
  aquatic_plants: [
    { id: 'water_temp',      label: 'Water Temperature',   type: 'number', unit: '°C', required: true },
    { id: 'ph',              label: 'pH Level',            type: 'number', unit: 'pH' },
    { id: 'salinity',        label: 'Salinity / EC',       type: 'number', unit: 'ppt / mS' },
    { id: 'nutrient_added',  label: 'Nutrient / Fertiliser Added', type: 'text', hint: 'Product and amount' },
    { id: 'culture_density', label: 'Culture Density',     type: 'number', unit: 'g/L' },
    { id: 'harvest_kg',      label: 'Harvest Weight',      type: 'number', unit: 'kg', goodDirection: 'up' },
    { id: 'culture_health',  label: 'Culture Health',      type: 'select',
      options: ['Excellent','Good','Fair — monitor','Contaminated / crashing'] },
  ],

  // ── FORESTRY & AGROFORESTRY ────────────────────────────────────────────────
  forestry: [
    { id: 'activity',        label: 'Activity Today',      type: 'select',
      options: ['Planting','Weeding','Pruning / thinning','Fire-break maintenance','Pest scouting','Watering','Harvest / felling','Other'] },
    { id: 'trees_planted',   label: 'Trees Planted',       type: 'number', unit: 'trees' },
    { id: 'workers',         label: 'Workers on Site',     type: 'number', unit: 'people' },
    { id: 'survival_pct',    label: 'Survival Rate (sample)', type: 'number', unit: '%', goodDirection: 'up' },
    { id: 'tree_health',     label: 'Stand Health',        type: 'select',
      options: ['All healthy','Minor pest / disease','Fire damage','Drought stress','Serious loss — see notes'] },
    { id: 'rain_mm',         label: 'Rainfall',            type: 'number', unit: 'mm' },
  ],

};

/** A few universally useful fields for categories without a specific form. */
const GENERIC_FIELDS: RecordFieldDef[] = [
  { id: 'activity_done', label: 'Activity Today', type: 'text', hint: 'What was done today' },
  { id: 'workers',       label: 'Workers on Site', type: 'number', unit: 'people' },
];

/**
 * The daily record fields that apply to a template: the farmer's own list if
 * they have customised it, otherwise the built-in defaults for its category.
 */
export function getRecordFields(template: ProductionTemplate | undefined | null): RecordFieldDef[] {
  if (!template) return [];
  if (template.recordFields) return template.recordFields;
  return CATEGORY_DAILY_FIELDS[template.category] ?? GENERIC_FIELDS;
}

/** Same, narrowed to the fields that show for one cycle type. */
export function fieldsForVariant(fields: RecordFieldDef[], variantId: string): RecordFieldDef[] {
  return fields.filter(f => !f.visibleFor || f.visibleFor.includes(variantId));
}

/** The cycle type (variant id) — stored on the cycle, or worked out for older cycles that lack it. */
export function inferVariant(cycle: ProductionCycle, category: string): string {
  if (cycle.variantId) return cycle.variantId;
  if (category === 'poultry') {
    const hasEggUnit = cycle.productionUnits.some(u => u.unit === 'eggs');
    if (hasEggUnit) return 'incubation';
    const hasEggRouting = cycle.notes?.toLowerCase().includes('egg');
    return hasEggRouting ? 'layer_from_pol' : 'broiler_grow_out';
  }
  return '__default__';
}
