// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Universal Agriculture & Food Platform
// Core type system: the single source of truth for every engine
// ─────────────────────────────────────────────────────────────────────────────

// ─── Categories & Enums ──────────────────────────────────────────────────────

export type ProductionCategory =
  | 'poultry'
  | 'livestock'
  | 'aquaculture'
  | 'crops'
  | 'horticulture'
  | 'greenhouse'
  | 'orchard'
  | 'apiary'
  | 'mushroom'
  | 'insects'          // BSF, crickets, mealworms, silkworms, earthworms, snails
  | 'aquatic_plants'   // Seaweed, spirulina/microalgae
  | 'forestry'         // Timber forestry, agroforestry/silvopastoral
  | 'processing'
  | 'services';

/**
 * Maps to the 11-template universal architecture recommended by the system design.
 * Adding a new species/crop/niche should be configuration, not a new template.
 *   T1  Annual/Seasonal Crop
 *   T2  Horticultural Plant (vegetables, herbs, flowers)
 *   T3  Perennial/Orchard Plant (fruit trees, vines, coffee)
 *   T4  Tree/Forest Production
 *   T5  Agroforestry / Mixed Production
 *   T6  Terrestrial Animal (cattle, goats, sheep, pigs, rabbits, deer, camelids)
 *   T7  Avian / Flock (all poultry & birds)
 *   T8  Aquatic Animal Production (fish, shellfish, shrimp)
 *   T9  Aquatic Plant / Algae (seaweed, spirulina)
 *  T10  Colony / Small Organism (bees, insects, worms, snails)
 *  T11  Fungi / Controlled Biomass (mushrooms)
 */
export type UniversalTemplate = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'T8' | 'T9' | 'T10' | 'T11';

export type ProductionEnvironment =
  | 'open_field' | 'greenhouse' | 'shade_house' | 'hydroponics' | 'indoor'
  | 'pond' | 'tank' | 'cage' | 'raceway' | 'ras'
  | 'barn' | 'pen' | 'pasture' | 'feedlot'
  | 'orchard' | 'nursery';

export type MeasurementUnit =
  | 'kg' | 'g' | 'tonne' | 'lb'
  | 'count' | 'head' | 'flock' | 'hive' | 'tray' | 'crate' | 'bag' | 'box'
  | 'litre' | 'ml' | 'm3'
  | 'ha' | 'acre' | 'm2'
  | 'celsius' | 'fahrenheit'
  | 'percent' | 'ratio'
  | 'hour' | 'day';

export type OutputRouting =
  | 'sale'
  | 'inventory'
  | 'processing'
  | 'incubation'
  | 'hatchery'
  | 'transfer'
  | 'waste'
  | 'own_use';

export type CycleStatus = 'planning' | 'active' | 'paused' | 'completed' | 'aborted';
export type StageStatus  = 'pending' | 'active' | 'completed' | 'skipped';

// ─── Configuration Engine ─────────────────────────────────────────────────────

export interface StageTemplate {
  id: string;
  name: string;
  description?: string;
  typicalDurationDays?: number;
  inputs: StageInput[];
  activities: string[];
  measurements: MeasurementConfig[];
  outputs: StageOutput[];
  possibleNextStages: string[];   // stage template IDs
  alerts?: StageAlert[];
  color?: string;
}

export interface StageInput {
  id: string;
  label: string;
  unit: MeasurementUnit;
  required: boolean;
}

export interface StageOutput {
  id: string;
  label: string;
  unit: MeasurementUnit;
  routingOptions: OutputRouting[];
}

export interface MeasurementConfig {
  id: string;
  name: string;
  unit: MeasurementUnit;
  frequency: 'daily' | 'weekly' | 'per_event' | 'as_needed';
  required: boolean;
  benchmark?: { min?: number; max?: number; target?: number };
}

export interface StageAlert {
  metric: string;
  condition: 'above' | 'below' | 'change_pct';
  threshold: number;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface MaterialType {
  id: string;
  name: string;
  unit: MeasurementUnit;
  category: 'input' | 'output' | 'intermediate' | 'byproduct' | 'waste';
  perishable?: boolean;
  requiresColdChain?: boolean;
}

export interface KPIConfig {
  id: string;
  name: string;
  unit: string;
  description?: string;
  goodDirection: 'up' | 'down' | 'neutral';
  benchmark?: number;
}

export interface ProductionTemplate {
  id: string;
  name: string;
  shortName: string;
  category: ProductionCategory;
  /** Which of the 11 universal template archetypes this maps to (T1–T11) */
  universalTemplate?: UniversalTemplate;
  species?: string;
  breed?: string;
  purpose?: string;
  environment?: ProductionEnvironment;
  description: string;
  icon: string;
  color: string;           // tailwind color name: 'amber', 'green', etc.
  stages: StageTemplate[];
  materials: MaterialType[];
  kpis: KPIConfig[];
  tags: string[];
}

// ─── Edit Approval System ─────────────────────────────────────────────────────

/**
 * Org-level configuration for the edit approval workflow.
 * When enabled, any edit or delete creates a pending EditRequest
 * that must be approved before the change is applied.
 */
export interface EditApprovalConfig {
  enabled: boolean;          // false = open editing; true = require approval
  approverName: string;      // display name of the designated approver
  currentUserName: string;   // display name of the current staff member
  requireReason: boolean;    // require a reason field on every edit/delete
}

/**
 * A single pending (or resolved) edit request.
 * Stores enough information to show, apply, or reject the change.
 */
export interface EditRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected';

  // What entity is being changed
  entityType: 'cycle' | 'daily_record' | 'event';
  entityId: string;                 // id of the record/event/cycle being edited
  cycleId: string;                  // always set — which cycle owns this record
  stageId?: string;                 // for records and events

  // Human-readable description of the change
  entityLabel: string;              // e.g. "Daily Record — 2024-03-10"
  fieldLabel: string;               // e.g. "notes" or "Feed Consumed" or "DELETE"
  oldValueDisplay: string;          // stringified previous value
  newValueDisplay: string;          // stringified new value

  // The actual patch to apply when approved
  // Serialised as JSON string to keep the interface simple
  applyPayload: string;

  reason?: string;                  // optional reason provided by submitter

  // Audit trail
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionNote?: string;
}

// ─── Organisation Config ──────────────────────────────────────────────────────

export type BusinessType =
  | 'farmer'
  | 'agro_dealer'
  | 'vet_provider'
  | 'equipment_hire'
  | 'agrifood_seller'
  | 'agrisupply_provider'
  | 'agriservices_provider'
  | 'processor'
  | 'transport'
  | 'cooperative';

export interface VendorListing {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  available: boolean;
  tags: string[];
  createdAt: string;
}

export interface VendorOrder {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerName: string;
  buyerPhone: string;
  quantity: number;
  unit: string;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
  createdAt: string;
}

export interface OrgProfile {
  id: string;
  name: string;
  country: string;
  currency: string;
  timezone: string;
  onboardingComplete: boolean;
  businessType: BusinessType;
  serviceCategories?: string[]; // for vendors — what they offer
  enterprises: EnterpriseConfig[];
  vendorListings?: VendorListing[];
  vendorOrders?: VendorOrder[];
  editApproval?: EditApprovalConfig; // edit workflow configuration
  createdAt: string;
}

export interface EnterpriseConfig {
  id: string;
  name: string;
  templateId: string;
  color: string;
  active: boolean;
  location?: string;
  notes?: string;
  createdAt: string;
}

// ─── Production Engine ────────────────────────────────────────────────────────

export interface ProductionUnit {
  id: string;
  enterpriseId: string;
  name: string;
  type: string;                 // flock | pond | field | herd | house | hive
  quantity: number;
  unit: MeasurementUnit;
  species?: string;
  breed?: string;
  location?: string;
  active: boolean;
}

export interface ProductionCycle {
  id: string;
  enterpriseId: string;
  cycleNumber: number;
  name: string;
  variantId?: string;          // e.g. 'layer_from_pol', 'broiler_grow_out', 'incubation'
  setupValues?: Record<string, string>; // raw wizard answers for reference
  // Production Program grouping
  programId?: string;          // shared ID across all phases of one program
  programName?: string;        // e.g. "Guinea Fowl Breeding Program"
  programPhase?: number;       // 1, 2, 3 … (display order within the program)
  programPhaseLabel?: string;  // e.g. "Phase 1: Keet Grow-Out"
  // Lineage tracking
  sourceRef?: string;          // ID of the cycle that produced the starting stock for this one
  transferHistory?: TransferRecord[]; // log of outputs transferred out of this cycle
  startDate: string;
  expectedEndDate?: string;
  endDate?: string;
  status: CycleStatus;
  currentStageId: string;
  stages: CycleStage[];
  productionUnits: ProductionUnit[];
  notes?: string;
  createdAt: string;
}

export interface TransferRecord {
  id: string;
  date: string;
  outputType: string;        // 'birds' | 'eggs' | 'keets' | 'chicks' | custom label
  totalQuantity: number;
  unit: string;
  soldQuantity: number;
  soldPricePerUnit?: number;
  soldRevenue?: number;
  transferredQuantity: number;
  destinationCycleId?: string;   // existing cycle that received the transfer
  destinationCycleName?: string;
  newCycleCreated?: boolean;
  notes?: string;
}

export interface CycleStage {
  id: string;
  templateId: string;
  name: string;
  status: StageStatus;
  startDate?: string;
  endDate?: string;
  events: ProductionEvent[];
  dailyRecords: DailyRecord[];
}

export interface DailyRecord {
  id: string;
  date: string;
  measurements: Record<string, number>;   // numeric fields: measurementConfigId → value
  data?: Record<string, string>;          // text/select fields: fieldId → string value
  notes?: string;
  recordedBy: string;
}

export interface ProductionEvent {
  id: string;
  type: string;
  date: string;
  description?: string;
  /** Universal field values from the dynamic event form — keyed by EventField.id */
  data?: Record<string, string | number | boolean>;
  measurements?: Record<string, number>;
  outputs?: MaterialOutput[];
  cost?: number;
  notes?: string;
  recordedBy: string;
  attachments?: string[];
}

export interface MaterialOutput {
  id: string;
  materialTypeId: string;
  materialName: string;
  quantity: number;
  unit: MeasurementUnit;
  routing: OutputRouting;
  notes?: string;
}

// ─── Processing Engine ────────────────────────────────────────────────────────

export interface ProcessingRecipe {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  inputs: RecipeIngredient[];
  outputs: RecipeOutput[];
  steps: string[];
  laborHoursPerBatch?: number;
  equipment?: string[];
  active: boolean;
}

export interface RecipeIngredient {
  materialTypeId: string;
  materialName: string;
  quantityPer100kg: number;
  unit: MeasurementUnit;
}

export interface RecipeOutput {
  materialTypeId: string;
  materialName: string;
  expectedYieldPct: number;
  unit: MeasurementUnit;
  type: 'main' | 'byproduct' | 'waste';
}

export interface ProcessingBatch {
  id: string;
  recipeId: string;
  recipeName: string;
  batchNumber: string;
  startDate: string;
  endDate?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'failed';
  actualInputs: Array<RecipeIngredient & { actualQty: number }>;
  actualOutputs: Array<RecipeOutput & { actualQty: number }>;
  actualYieldPct?: number;
  totalInputCost?: number;
  laborCost?: number;
  overheadCost?: number;
  totalCost?: number;
  costPerUnit?: number;
  qualityStatus?: 'pass' | 'fail' | 'pending';
  notes?: string;
}

// ─── Inventory Engine ─────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  orgId: string;
  materialTypeId: string;
  materialName: string;
  quantity: number;
  unit: MeasurementUnit;
  location: string;
  batchRef?: string;
  cycleRef?: string;
  processingBatchRef?: string;
  expiryDate?: string;
  costPerUnit?: number;
  totalValue?: number;
  status: 'available' | 'reserved' | 'quarantine' | 'sold' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  orgId: string;
  itemId: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  reason: string;
  reference?: string;        // cycle ID, order ID, processing batch ID
  date: string;
  recordedBy: string;
}

// ─── Quality Engine ───────────────────────────────────────────────────────────

export interface QualityCheck {
  id: string;
  orgId: string;
  entityType: 'cycle_stage' | 'processing_batch' | 'inventory_item' | 'delivery';
  entityId: string;
  date: string;
  checkedBy: string;
  parameters: QualityParameter[];
  overallResult: 'pass' | 'fail' | 'conditional';
  notes?: string;
  certifications?: string[];
}

export interface QualityParameter {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  min?: number;
  max?: number;
  expected?: number | string;
  result: 'pass' | 'fail' | 'na';
}

// ─── Commerce / Sales ─────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  orgId: string;
  name: string;
  type: 'individual' | 'business' | 'cooperative' | 'institution';
  phone?: string;
  email?: string;
  location?: string;
  creditLimit?: number;
  balance?: number;
  tags: string[];
  active: boolean;
}

export interface SalesOrder {
  id: string;
  orgId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  deliveryDate?: string;
  status: 'draft' | 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';
  items: SalesOrderItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  amountPaid: number;
  balance: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  channel: 'direct' | 'marketplace' | 'phone' | 'other';
  notes?: string;
}

export interface SalesOrderItem {
  id: string;
  inventoryItemId?: string;
  materialTypeId: string;
  materialName: string;
  quantity: number;
  unit: MeasurementUnit;
  unitPrice: number;
  total: number;
}

// ─── Marketplace ──────────────────────────────────────────────────────────────

export type MarketplaceType = 'supply' | 'services' | 'food';

export interface MarketplaceListing {
  id: string;
  type: MarketplaceType;
  sellerId: string;
  sellerName: string;
  sellerRating?: number;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  currency: string;
  unit?: string;
  minOrder?: number;
  location: string;
  images: string[];
  rating: number;
  reviewCount: number;
  available: boolean;
  tags: string[];
  verified: boolean;
  createdAt: string;
}

// ─── Finance Engine ───────────────────────────────────────────────────────────

export interface CostRecord {
  id: string;
  orgId: string;
  enterpriseId?: string;
  cycleId?: string;
  category: string;         // feed | labour | medicine | equipment | transport | overhead
  description: string;
  amount: number;
  currency: string;
  date: string;
  reference?: string;
  recordedBy: string;
}

// ─── Traceability ─────────────────────────────────────────────────────────────

export interface TraceabilityNode {
  id: string;
  type: 'farm' | 'cycle' | 'stage' | 'processing' | 'inventory' | 'delivery' | 'sale';
  label: string;
  date: string;
  location?: string;
  quantity?: number;
  unit?: MeasurementUnit;
  metadata?: Record<string, unknown>;
  children?: TraceabilityNode[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'list' | 'alert' | 'activity';
  title: string;
  enterpriseId?: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
  data?: unknown;
}

export interface KPICard {
  label: string;
  value: string | number;
  unit?: string;
  change?: number;          // % change vs previous period
  trend?: 'up' | 'down' | 'flat';
  goodDirection?: 'up' | 'down';
  color?: string;
  icon?: string;
}
