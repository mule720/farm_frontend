/** Cycle types (variants) and the set-up questions for each category. Used by the New Cycle wizard and the AI guide. */
// ─────────────────────────────────────────────────────────────────────────────
// Cycle Variant definitions — category → list of specific cycle types
// ─────────────────────────────────────────────────────────────────────────────
export interface CycleVariant {
  id: string;
  label: string;
  description: string;
  icon: string;
  defaultDays: number;
}

export const CYCLE_VARIANTS: Record<string, CycleVariant[]> = {
  poultry: [
    { id: 'broiler_grow_out',   label: 'Broiler Grow-Out',         icon: '🍗', description: 'Day-old chicks → live weight / slaughter. Typically 35–45 days.',       defaultDays: 42  },
    { id: 'layer_from_chicks',  label: 'Layer — from Day-Old',     icon: '🐥', description: 'Day-old chicks → pullets → full lay. Includes brooding & growing phases.', defaultDays: 500 },
    { id: 'layer_from_pol',     label: 'Layer — from Point-of-Lay',icon: '🥚', description: 'Start with 18-week+ pullets ready to lay.',                              defaultDays: 380 },
    { id: 'layer_continuing',   label: 'Layer — Continuing Flock', icon: '🐓', description: 'Already-laying flock, tracking ongoing production season.',              defaultDays: 90  },
    { id: 'incubation',         label: 'Egg Incubation & Hatch',   icon: '🥚→🐣', description: 'Set fertile eggs → candle → lock-down → hatch → chick grading.',    defaultDays: 22  },
    { id: 'breeder_flock',      label: 'Breeder Flock',            icon: '💑', description: 'Roosters + hens managed for fertile egg production.',                    defaultDays: 365 },
    { id: 'turkey_grow_out',    label: 'Turkey Grow-Out',          icon: '🦃', description: 'Poults → market weight. Typically 16–20 weeks.',                         defaultDays: 120 },
    { id: 'duck_cycle',         label: 'Duck Cycle',               icon: '🦆', description: 'Ducklings → meat or layer production.',                                  defaultDays: 60  },
    { id: 'quail_cycle',        label: 'Quail Cycle',              icon: '🐦', description: 'Quail chicks → eggs or meat.',                                           defaultDays: 90  },
  ],
  livestock: [
    { id: 'dairy_season',       label: 'Dairy Production Season',  icon: '🥛', description: 'Track lactation, milk yield, breeding and dry-off for a dairy herd.',    defaultDays: 305 },
    { id: 'beef_grow_out',      label: 'Beef Grow-Out',            icon: '🥩', description: 'Weaners / stockers → slaughter weight.',                                 defaultDays: 180 },
    { id: 'pig_grow_out',       label: 'Pig Grow-Out',             icon: '🐖', description: 'Weaners → market weight. Typically 16–20 weeks post-weaning.',          defaultDays: 120 },
    { id: 'sow_farrowing',      label: 'Sow Farrowing Cycle',     icon: '🐷', description: 'Pregnancy → farrowing → weaning for a sow or group of sows.',           defaultDays: 90  },
    { id: 'goat_season',        label: 'Goat Production Season',   icon: '🐐', description: 'Dairy or meat goats — kidding, milking, or grow-out.',                  defaultDays: 180 },
    { id: 'sheep_season',       label: 'Sheep Season',             icon: '🐑', description: 'Lambing or meat lamb grow-out.',                                          defaultDays: 120 },
    { id: 'rabbit_batch',       label: 'Rabbit Batch',             icon: '🐇', description: 'Kits at weaning → market weight. Typically 70–90 days.',                defaultDays: 80  },
  ],
  aquaculture: [
    { id: 'pond_grow_out',      label: 'Pond Grow-Out',            icon: '🏊', description: 'Fingerlings stocked into pond → harvest weight.',                        defaultDays: 180 },
    { id: 'cage_culture',       label: 'Cage Culture',             icon: '🐟', description: 'Fish in floating cages in a lake or dam.',                               defaultDays: 150 },
    { id: 'tank_rearing',       label: 'Tank / RAS System',       icon: '🚰', description: 'Recirculating aquaculture system — controlled indoor environment.',       defaultDays: 120 },
    { id: 'shrimp_pond',        label: 'Shrimp Pond Cycle',        icon: '🦐', description: 'Post-larvae stocking → harvest. Typically 90–120 days.',                defaultDays: 100 },
    { id: 'aquaponics_cycle',   label: 'Aquaponics Cycle',         icon: '🌿', description: 'Fish + plants in a closed-loop system.',                                 defaultDays: 120 },
    { id: 'hatchery_cycle',     label: 'Hatchery / Nursery Cycle', icon: '🐣', description: 'Broodstock conditioning → spawning → larvae rearing → fingerlings.',   defaultDays: 45  },
  ],
  crops: [
    { id: 'rain_fed_season',    label: 'Rain-Fed Season',          icon: '🌧️', description: 'Single rainy-season crop — maize, sorghum, groundnuts etc.',            defaultDays: 120 },
    { id: 'irrigated_season',   label: 'Irrigated Season',         icon: '💧', description: 'Irrigated crop — can span any calendar period.',                         defaultDays: 90  },
    { id: 'nursery_seedbed',    label: 'Nursery / Seedbed',        icon: '🌱', description: 'Seed germination and seedling raising before transplanting.',            defaultDays: 30  },
    { id: 'ratoon_crop',        label: 'Ratoon Crop',              icon: '🎋', description: 'Second harvest from the same root system (sugarcane, banana).',          defaultDays: 180 },
  ],
  horticulture: [
    { id: 'transplant_cycle',   label: 'Transplant Cycle',         icon: '🌿', description: 'Seedling transplant → harvest. For tomato, cabbage, kale, pepper.',     defaultDays: 90  },
    { id: 'direct_sown',        label: 'Direct-Sown Crop',         icon: '🌾', description: 'Seed direct in field — carrot, beetroot, onion, watermelon.',           defaultDays: 75  },
    { id: 'perennial_season',   label: 'Perennial Season',         icon: '🔄', description: 'Track a growing season on a perennial vegetable (chilli, eggplant).',   defaultDays: 120 },
  ],
  greenhouse: [
    { id: 'hydroponic_cycle',   label: 'Hydroponic Cycle',         icon: '💧', description: 'NFT, DWC, or drip lettuce / herbs / spinach cycle.',                    defaultDays: 35  },
    { id: 'greenhouse_tomato',  label: 'Greenhouse Tomato',        icon: '🍅', description: 'Transplant to first pick to end-of-season for greenhouse tomato.',       defaultDays: 180 },
    { id: 'cut_flower_cycle',   label: 'Cut Flower Production',    icon: '🌹', description: 'Planting to first cut and repeat cycles for roses, carnations.',        defaultDays: 90  },
    { id: 'strawberry_cycle',   label: 'Strawberry Cycle',         icon: '🍓', description: 'Transplant to first harvest and peak production window.',               defaultDays: 75  },
  ],
  orchard: [
    { id: 'orchard_season',     label: 'Annual Production Season', icon: '📅', description: 'Track flowering → fruit set → harvest → post-harvest for one year.',    defaultDays: 365 },
    { id: 'new_planting',       label: 'New Orchard Planting',     icon: '🌳', description: 'Land prep → planting → establishment phase for new trees.',             defaultDays: 180 },
    { id: 'harvest_window',     label: 'Harvest Window',           icon: '🛒', description: 'Focus on the active harvest period only.',                               defaultDays: 45  },
  ],
  apiary: [
    { id: 'honey_season',       label: 'Honey Production Season',  icon: '🍯', description: 'Colony build-up → main flow → extraction → post-harvest assessment.',   defaultDays: 120 },
    { id: 'colony_buildup',     label: 'Colony Build-Up',          icon: '🐝', description: 'Package or nuc → full colony establishment.',                           defaultDays: 60  },
    { id: 'queen_rearing',      label: 'Queen Rearing Cycle',      icon: '👑', description: 'Cell grafting → capping → emergence → mating → laying.',               defaultDays: 30  },
  ],
  mushroom: [
    { id: 'block_cycle',        label: 'Spawn Block Cycle',        icon: '🍄', description: 'Inoculation → colonisation → pinning → fruiting → end-of-life.',        defaultDays: 60  },
    { id: 'bag_spawn',          label: 'Bag Spawn Cycle',          icon: '🛍️', description: 'Substrate bags inoculated and cycled through fruiting.',                defaultDays: 45  },
  ],
  processing: [
    { id: 'processing_batch',   label: 'Processing Batch',         icon: '⚙️', description: 'A defined batch of raw material through the processing line.',          defaultDays: 7   },
    { id: 'processing_month',   label: 'Monthly Operation',        icon: '📆', description: 'Track one calendar month of processing activity.',                      defaultDays: 30  },
  ],
  services: [
    { id: 'service_contract',   label: 'Service Contract',         icon: '📋', description: 'A defined service engagement — consulting, training, vet rounds.',      defaultDays: 30  },
    { id: 'equipment_hire',     label: 'Equipment Hire Period',    icon: '🚜', description: 'Track utilisation and returns for hired equipment.',                    defaultDays: 14  },
  ],
};

// Category-specific setup fields
export interface SetupField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  options?: string[];
  unit?: string;
  placeholder?: string;
  required?: boolean;
  visibleFor?: string[];  // cycle variant IDs where this field appears; undefined = always
  hint?: string;
}

export const CATEGORY_SETUP_FIELDS: Record<string, SetupField[]> = {
  poultry: [
    { id: 'bird_count',      label: 'Number of Birds',           type: 'number', unit: 'birds',   required: true, placeholder: '500', visibleFor: ['broiler_grow_out','layer_from_chicks','layer_from_pol','layer_continuing','breeder_flock','turkey_grow_out','duck_cycle','quail_cycle'] },
    { id: 'egg_count',       label: 'Eggs Set',                  type: 'number', unit: 'eggs',    required: true, placeholder: '1000', visibleFor: ['incubation'] },
    { id: 'breed',           label: 'Breed / Strain',            type: 'text',   placeholder: 'e.g. Ross 308, Lohmann Brown', required: false },
    { id: 'house_pen',       label: 'House / Pen ID',            type: 'text',   placeholder: 'e.g. House A, Pen 3', required: false },
    { id: 'chick_source',    label: 'Chick / Egg Source',        type: 'text',   placeholder: 'Hatchery or farm name', required: false },
    { id: 'target_age_days', label: 'Target Slaughter Age',      type: 'number', unit: 'days',    required: false, placeholder: '42', visibleFor: ['broiler_grow_out','turkey_grow_out'] },
    { id: 'starting_age',    label: 'Starting Age',              type: 'number', unit: 'weeks',   required: false, placeholder: '18', visibleFor: ['layer_from_pol','layer_continuing'] },
    { id: 'egg_routing',     label: 'Egg Routing Intent',        type: 'select', options: ['Table eggs → market','Fertile eggs → incubation (in-house)','Fertile eggs → sale','Mixed (split between uses)'], visibleFor: ['layer_from_chicks','layer_from_pol','layer_continuing','breeder_flock'], hint: 'What will you do with collected eggs?' },
    { id: 'setter_id',       label: 'Setter / Incubator ID',     type: 'text',   placeholder: 'e.g. Cabinet 1', visibleFor: ['incubation'] },
    { id: 'expected_hatch',  label: 'Expected Hatch Date',       type: 'text',   placeholder: 'YYYY-MM-DD', visibleFor: ['incubation'] },
    { id: 'housing_type',    label: 'Housing System',            type: 'select', options: ['Deep litter','Cages (battery)','Free range','Semi-intensive','Aviary'] },
  ],
  livestock: [
    { id: 'head_count',      label: 'Number of Animals',         type: 'number', unit: 'head',    required: true,  placeholder: '20' },
    { id: 'breed',           label: 'Breed',                     type: 'text',   placeholder: 'e.g. Friesian, Boer' },
    { id: 'age_months',      label: 'Average Age',               type: 'number', unit: 'months',  placeholder: '6' },
    { id: 'sex_breakdown',   label: 'Sex Breakdown',             type: 'text',   placeholder: 'e.g. 10 cows, 1 bull', visibleFor: ['dairy_season','goat_season','breeder_flock'] },
    { id: 'purpose',         label: 'Primary Purpose',           type: 'select', options: ['Dairy','Beef / Meat','Breeding','Mixed'] },
    { id: 'pen_location',    label: 'Pen / Paddock',             type: 'text',   placeholder: 'e.g. Paddock B' },
    { id: 'avg_weight_kg',   label: 'Average Starting Weight',   type: 'number', unit: 'kg',      placeholder: '120' },
    { id: 'feeding_system',  label: 'Feeding System',            type: 'select', options: ['Zero-grazing (cut & carry)','Grazing (pasture)','Mixed grazing + supplement','Feedlot (total confinement)'] },
  ],
  aquaculture: [
    { id: 'pond_count',      label: 'Number of Ponds / Tanks',   type: 'number', unit: 'units',   required: true,  placeholder: '4' },
    { id: 'pond_area_m2',    label: 'Pond Area per Unit',        type: 'number', unit: 'm²',      placeholder: '500' },
    { id: 'fingerlings',     label: 'Fingerlings Stocked',       type: 'number', unit: 'fish',    required: true,  placeholder: '5000' },
    { id: 'stocking_density',label: 'Stocking Density',          type: 'number', unit: 'fish/m²', placeholder: '5' },
    { id: 'species_variant', label: 'Species / Strain',          type: 'text',   placeholder: 'e.g. Nile Tilapia, African Catfish' },
    { id: 'avg_fingerling_g',label: 'Avg Fingerling Weight',     type: 'number', unit: 'g',       placeholder: '5' },
    { id: 'water_source',    label: 'Water Source',              type: 'select', options: ['Borehole','River / stream','Municipal','Rainwater harvested','Recirculating (RAS)'] },
    { id: 'feed_type',       label: 'Primary Feed Type',         type: 'select', options: ['Commercial pellets','Farm-made feed','Natural (algae/plankton)','Mixed'] },
    { id: 'target_weight_g', label: 'Target Harvest Weight',     type: 'number', unit: 'g',       placeholder: '500' },
  ],
  crops: [
    { id: 'field_id',        label: 'Field / Plot Name',         type: 'text',   required: true,  placeholder: 'e.g. Plot A1, North Field' },
    { id: 'area_ha',         label: 'Area',                      type: 'number', unit: 'ha',      required: true,  placeholder: '2.5' },
    { id: 'variety',         label: 'Variety / Cultivar',        type: 'text',   placeholder: 'e.g. SC403, DK8031' },
    { id: 'irrigation',      label: 'Irrigation System',         type: 'select', options: ['Rain-fed (no irrigation)','Drip irrigation','Flood / furrow','Centre pivot','Sprinkler','Manual watering'] },
    { id: 'soil_type',       label: 'Soil Type',                 type: 'select', options: ['Sandy loam','Clay loam','Sandy','Clay','Silt loam','Not assessed'] },
    { id: 'expected_yield',  label: 'Expected Yield',            type: 'number', unit: 'bags/ha', placeholder: '50' },
    { id: 'seed_rate_kg_ha', label: 'Seed Rate',                 type: 'number', unit: 'kg/ha',   placeholder: '25' },
  ],
  horticulture: [
    { id: 'field_id',        label: 'Field / Bed Name',          type: 'text',   required: true,  placeholder: 'e.g. Bed 1, Tunnel A' },
    { id: 'area_ha',         label: 'Area',                      type: 'number', unit: 'ha',      required: true,  placeholder: '0.5' },
    { id: 'variety',         label: 'Variety / Cultivar',        type: 'text',   placeholder: 'e.g. Roma, Nuru F1' },
    { id: 'transplant_date', label: 'Transplant / Sowing Date',  type: 'text',   placeholder: 'YYYY-MM-DD' },
    { id: 'plant_count',     label: 'Plant Count',               type: 'number', unit: 'plants',  placeholder: '5000' },
    { id: 'irrigation',      label: 'Irrigation',                type: 'select', options: ['Drip','Furrow','Sprinkler','Manual','Rain-fed'] },
    { id: 'expected_yield',  label: 'Expected Yield',            type: 'number', unit: 'kg/ha',   placeholder: '15000' },
  ],
  greenhouse: [
    { id: 'structure_name',  label: 'Greenhouse / Tunnel Name',  type: 'text',   required: true,  placeholder: 'e.g. Greenhouse 1, Tunnel B' },
    { id: 'growing_area_m2', label: 'Growing Area',              type: 'number', unit: 'm²',      required: true,  placeholder: '500' },
    { id: 'growing_system',  label: 'Growing System',            type: 'select', options: ['Soil (raised beds)','Drip to soil','NFT Hydroponics','DWC Hydroponics','Coco coir / substrate','Aeroponics'] },
    { id: 'plant_count',     label: 'Plant Count',               type: 'number', unit: 'plants',  placeholder: '2000' },
    { id: 'variety',         label: 'Variety / Cultivar',        type: 'text',   placeholder: 'e.g. Elegance Rose, Lollo Rossa' },
    { id: 'lighting',        label: 'Lighting',                  type: 'select', options: ['Natural light only','Supplemental LED','Full artificial lighting'] },
    { id: 'climate_control', label: 'Climate Control',           type: 'select', options: ['None (passive)','Shade nets','Evaporative cooling','Full HVAC'] },
  ],
  orchard: [
    { id: 'plot_name',       label: 'Plot / Block Name',         type: 'text',   required: true,  placeholder: 'e.g. Block A, Mango Section' },
    { id: 'tree_count',      label: 'Number of Trees',           type: 'number', unit: 'trees',   required: true,  placeholder: '200' },
    { id: 'plot_area_ha',    label: 'Plot Area',                 type: 'number', unit: 'ha',      placeholder: '5' },
    { id: 'tree_age_years',  label: 'Tree Age',                  type: 'number', unit: 'years',   placeholder: '4' },
    { id: 'variety',         label: 'Variety / Cultivar',        type: 'text',   placeholder: 'e.g. Tommy Atkins, Hass' },
    { id: 'spacing',         label: 'Tree Spacing',              type: 'text',   placeholder: 'e.g. 5m × 5m' },
    { id: 'irrigation',      label: 'Irrigation',                type: 'select', options: ['Rain-fed','Drip','Micro-jets','Flood / furrow'] },
    { id: 'expected_yield_t',label: 'Expected Yield',            type: 'number', unit: 'tonnes',  placeholder: '10' },
  ],
  apiary: [
    { id: 'hive_count',      label: 'Number of Hives',           type: 'number', unit: 'hives',   required: true,  placeholder: '20' },
    { id: 'hive_type',       label: 'Hive Type',                 type: 'select', options: ['Langstroth','Kenya Top Bar (KTBH)','Top Bar (other)','Warré','Log hive (traditional)'] },
    { id: 'apiary_location', label: 'Apiary Location / Name',    type: 'text',   placeholder: 'e.g. Forest apiary, Orchard site' },
    { id: 'colony_strength', label: 'Average Colony Strength',   type: 'select', options: ['Weak (< 3 frames brood)','Medium (3–5 frames)','Strong (5+ frames)'] },
    { id: 'expected_honey_kg',label: 'Expected Honey Yield',     type: 'number', unit: 'kg/hive', placeholder: '15' },
  ],
  mushroom: [
    { id: 'block_count',     label: 'Number of Growing Blocks / Bags', type: 'number', unit: 'blocks', required: true, placeholder: '200' },
    { id: 'substrate',       label: 'Substrate Type',            type: 'select', options: ['Sawdust (hardwood)','Rice straw','Wheat straw','Coffee grounds','Cotton waste','Compost (button mushroom)'] },
    { id: 'growing_room',    label: 'Growing Room / Shed',       type: 'text',   placeholder: 'e.g. Room A' },
    { id: 'target_yield_kg', label: 'Target Yield',              type: 'number', unit: 'kg',      placeholder: '300' },
    { id: 'inoculation_date',label: 'Inoculation Date',          type: 'text',   placeholder: 'YYYY-MM-DD' },
  ],
  processing: [
    { id: 'raw_material_kg', label: 'Raw Material Quantity',     type: 'number', unit: 'kg',      required: true,  placeholder: '5000' },
    { id: 'raw_material_name',label: 'Raw Material',             type: 'text',   required: true,  placeholder: 'e.g. Maize, Cassava, Milk' },
    { id: 'expected_output_kg',label: 'Expected Finished Output',type: 'number', unit: 'kg',      placeholder: '4500' },
    { id: 'processing_line', label: 'Line / Machine',            type: 'text',   placeholder: 'e.g. Mill 1, Line B' },
  ],
  services: [
    { id: 'client_name',     label: 'Client / Customer Name',    type: 'text',   required: true,  placeholder: 'Farm or individual name' },
    { id: 'service_scope',   label: 'Service Scope',             type: 'text',   placeholder: 'Brief description of service' },
    { id: 'service_location',label: 'Location',                  type: 'text',   placeholder: 'District / GPS' },
    { id: 'contracted_value',label: 'Contracted Value',          type: 'number', unit: 'ZMW',     placeholder: '5000' },
  ],
};

