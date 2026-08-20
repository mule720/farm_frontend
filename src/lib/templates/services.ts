// ─────────────────────────────────────────────────────────────────────────────
// Agricultural Services Templates
// Veterinary Services, Agri-Consulting, Equipment Hire, Lab Testing,
// Farmer Training / Extension, Crop Insurance, Transport & Cold Chain
// ─────────────────────────────────────────────────────────────────────────────
import type { ProductionTemplate } from '../types';

// ─── VETERINARY SERVICES ─────────────────────────────────────────────────────
export const vetServicesTemplate: ProductionTemplate = {
  id: 'vet-services',
  name: 'Veterinary Clinic / Mobile Vet Services',
  shortName: 'Vet Services',
  category: 'services',
  species: 'Multi-species',
  purpose: 'Livestock Health Services',
  description: 'Service-cycle template for a veterinary practice or mobile vet service. Covers consultation clinics, vaccination campaigns, AI services, disease investigations, and post-mortem inspections.',
  icon: '🩺',
  color: '#dbeafe',
  tags: ['veterinary', 'livestock health', 'vaccination', 'AI', 'disease investigation', 'services'],
  materials: [
    { id: 'vaccine', name: 'Vaccines (various)', unit: 'dose', category: 'input' },
    { id: 'drugs', name: 'Veterinary Drugs / Antibiotics', unit: 'vial', category: 'input' },
    { id: 'AI-straws', name: 'Semen Straws (AI)', unit: 'straw', category: 'input' },
    { id: 'consumables', name: 'Disposable Consumables (needles, gloves, swabs)', unit: 'pack', category: 'input' },
    { id: 'health-cert', name: 'Veterinary Health Certificate', unit: 'count', category: 'output' },
    { id: 'lab-report', name: 'Diagnostic Lab Report', unit: 'count', category: 'output' },
  ],
  kpis: [
    { id: 'animals-attended', name: 'Animals Attended per Day', unit: 'count', benchmark: 30 },
    { id: 'vaccination-coverage', name: 'Vaccination Campaign Coverage %', unit: 'percent', benchmark: 95 },
    { id: 'ai-conception', name: 'AI Conception Rate', unit: 'percent', benchmark: 60 },
    { id: 'case-resolution', name: 'Case Resolution Rate (recovered)', unit: 'percent', benchmark: 85 },
  ],
  stages: [
    {
      id: 'intake-triage', name: 'Client Intake & Animal Triage', order: 1, durationDays: 1, color: '#dbeafe',
      inputs: [
        { id: 'referral', label: 'Referral / Appointment or Walk-in', unit: 'count', required: true },
      ],
      activities: [
        { id: 'register', name: 'Register client and animal details (owner, species, breed, age, sex)', frequency: 'once' },
        { id: 'triage', name: 'Triage: temperature, pulse, respiration, mucous membranes, BCS', frequency: 'once' },
        { id: 'history', name: 'Take history: feeding, recent changes, previous treatments, movement', frequency: 'once' },
        { id: 'notify', name: 'If notifiable disease suspected — notify DVO immediately', frequency: 'once' },
      ],
      measurements: [
        { id: 'temp', name: 'Body Temperature', unit: '°C', frequency: 'once', required: true, benchmark: { min: 38, max: 39.5 } },
        { id: 'pr', name: 'Pulse Rate', unit: 'bpm', frequency: 'once', required: false },
        { id: 'rr', name: 'Respiratory Rate', unit: 'breaths/min', frequency: 'once', required: false },
      ],
      outputs: [], possibleNextStages: ['diagnosis-treatment'],
      alerts: ['Notifiable diseases (FMD, Newcastle, Anthrax, CBPP, Rift Valley Fever, Lumpy Skin) must be reported to the district veterinary officer within 24 hours — not doing so is a criminal offence in most jurisdictions'],
    },
    {
      id: 'diagnosis-treatment', name: 'Diagnosis & Treatment', order: 2, durationDays: 3, color: '#bfdbfe',
      inputs: [
        { id: 'drugs-in', label: 'Veterinary Drugs / Biologics', unit: 'vial', required: true },
        { id: 'consumables-in', label: 'Disposable Consumables', unit: 'pack', required: true },
      ],
      activities: [
        { id: 'diagnose', name: 'Clinical examination; differential diagnosis list', frequency: 'once' },
        { id: 'samples', name: 'Collect samples if lab needed (blood smear, swab, faeces, urine)', frequency: 'once' },
        { id: 'treat', name: 'Administer treatment per protocol; record drugs, dose, route, batch number', frequency: 'daily' },
        { id: 'prescribe', name: 'Issue prescription and withdrawal period note', frequency: 'once' },
        { id: 'recheck', name: 'Schedule recheck in 3 days if no improvement', frequency: 'once' },
      ],
      measurements: [
        { id: 'cases', name: 'Cases Treated', unit: 'count', frequency: 'daily', required: true },
        { id: 'drug-units', name: 'Drug Units Dispensed', unit: 'vial', frequency: 'daily', required: true },
        { id: 'samples-sent', name: 'Samples Sent to Lab', unit: 'count', frequency: 'daily', required: false },
      ],
      outputs: [
        { materialTypeId: 'health-cert', quantity: null, unit: 'count', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['follow-up'],
      alerts: ['Always record withdrawal periods for meat and milk — failure to do so can contaminate the food chain with drug residues'],
    },
    {
      id: 'follow-up', name: 'Follow-up & Records', order: 3, durationDays: 1, color: '#93c5fd',
      inputs: [],
      activities: [
        { id: 'recheck', name: 'Recheck treatment response at 3 and 7 days', frequency: 'daily' },
        { id: 'close', name: 'Close case: recovered / referred / slaughter recommendation / death', frequency: 'once' },
        { id: 'records', name: 'Update client animal health record', frequency: 'once' },
        { id: 'invoice', name: 'Issue invoice and receipt', frequency: 'once' },
        { id: 'report', name: 'Compile monthly disease surveillance report for DVO', frequency: 'once' },
      ],
      measurements: [
        { id: 'recovery-rate', name: 'Case Outcome: Recovered %', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 80 } },
        { id: 'revenue', name: 'Revenue from Services', unit: 'currency', frequency: 'once', required: false },
      ],
      outputs: [
        { materialTypeId: 'lab-report', quantity: null, unit: 'count', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Lab reports arriving after case closure must still update the patient record for disease surveillance purposes'],
    },
  ],
};

// ─── AGRICULTURAL CONSULTING ──────────────────────────────────────────────────
export const agriConsultingTemplate: ProductionTemplate = {
  id: 'agri-consulting',
  name: 'Agricultural Consulting & Advisory',
  shortName: 'Agri Consulting',
  category: 'services',
  species: 'N/A',
  purpose: 'Farm Business Advisory & Technical Extension',
  description: 'Consulting service cycle: initial diagnostic, farm plan development, on-site monitoring visits, and final evaluation report. Covers crop, livestock, and agri-business advisory.',
  icon: '📋',
  color: '#d1fae5',
  tags: ['consulting', 'advisory', 'extension', 'farm planning', 'soil testing', 'services'],
  materials: [
    { id: 'soil-kit', name: 'Soil Sampling Kit', unit: 'kit', category: 'input' },
    { id: 'farm-plan', name: 'Farm Development Plan', unit: 'document', category: 'output' },
    { id: 'advisory-report', name: 'Advisory / Monitoring Report', unit: 'document', category: 'output' },
    { id: 'training-material', name: 'Training Materials / Fact Sheets', unit: 'set', category: 'output' },
  ],
  kpis: [
    { id: 'clients-active', name: 'Active Client Farms', unit: 'count', benchmark: 40 },
    { id: 'farm-visits', name: 'Farm Visits per Month', unit: 'count', benchmark: 60 },
    { id: 'yield-improvement', name: 'Client Yield Improvement %', unit: 'percent', benchmark: 25 },
    { id: 'client-retention', name: 'Client Retention Rate', unit: 'percent', benchmark: 80 },
  ],
  stages: [
    {
      id: 'diagnostic', name: 'Initial Farm Diagnostic', order: 1, durationDays: 2, color: '#d1fae5',
      inputs: [
        { id: 'soil-samples', label: 'Soil Samples (per field)', unit: 'count', required: false },
      ],
      activities: [
        { id: 'intake', name: 'Sign engagement letter; clarify scope and fees', frequency: 'once' },
        { id: 'farm-walk', name: 'Full farm walk: soil, crops/livestock, infrastructure, water, labour', frequency: 'once' },
        { id: 'soil-sample', name: 'Take composite soil samples per field; submit to lab', frequency: 'once' },
        { id: 'records-review', name: 'Review existing production and financial records', frequency: 'once' },
        { id: 'pest-survey', name: 'Pest and disease pressure assessment', frequency: 'once' },
      ],
      measurements: [
        { id: 'fields-mapped', name: 'Fields Mapped', unit: 'count', frequency: 'once', required: true },
        { id: 'soil-samples', name: 'Soil Samples Collected', unit: 'count', frequency: 'once', required: false },
      ],
      outputs: [], possibleNextStages: ['plan-development'],
      alerts: ['Do not recommend fertilizer applications before soil test results return — blanket recommendations waste client money and can damage soil structure'],
    },
    {
      id: 'plan-development', name: 'Farm Plan Development', order: 2, durationDays: 5, color: '#a7f3d0',
      inputs: [],
      activities: [
        { id: 'soil-results', name: 'Receive and interpret soil test results', frequency: 'once' },
        { id: 'gross-margin', name: 'Prepare gross margin analysis for recommended enterprises', frequency: 'once' },
        { id: 'write-plan', name: 'Write integrated farm development plan with priorities and timeline', frequency: 'once' },
        { id: 'present', name: 'Present plan to farmer; incorporate feedback', frequency: 'once' },
        { id: 'action-list', name: 'Agree on 90-day priority action list with assigned responsible person', frequency: 'once' },
      ],
      measurements: [
        { id: 'plan-delivered', name: 'Farm Plans Delivered', unit: 'count', frequency: 'once', required: true },
        { id: 'action-items', name: 'Priority Action Items', unit: 'count', frequency: 'once', required: false },
      ],
      outputs: [
        { materialTypeId: 'farm-plan', quantity: null, unit: 'document', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['monitoring'],
      alerts: ['Farm plans must be costed and cashflow-tested — technically correct plans that the farmer cannot finance will not be implemented'],
    },
    {
      id: 'monitoring', name: 'Implementation & Monitoring Visits', order: 3, durationDays: 90, color: '#34d399',
      inputs: [],
      activities: [
        { id: 'monthly-visit', name: 'Monthly monitoring visit: check progress against action list', frequency: 'monthly' },
        { id: 'record-check', name: 'Review production records at each visit', frequency: 'monthly' },
        { id: 'problem-solve', name: 'Troubleshoot any emerging crop/livestock/management issues', frequency: 'monthly' },
        { id: 'update-plan', name: 'Update plan if conditions change (drought, disease outbreak, market shift)', frequency: 'monthly' },
      ],
      measurements: [
        { id: 'visit-count', name: 'Monitoring Visits Conducted', unit: 'count', frequency: 'monthly', required: true },
        { id: 'actions-completed', name: 'Action Items Completed %', unit: 'percent', frequency: 'monthly', required: true, benchmark: { min: 60 } },
      ],
      outputs: [
        { materialTypeId: 'advisory-report', quantity: null, unit: 'document', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['evaluation'],
      alerts: ['Missed monitoring visits are the #1 reason for plan failure — reschedule within 7 days, never skip entirely'],
    },
    {
      id: 'evaluation', name: 'End-of-Season Evaluation', order: 4, durationDays: 3, color: '#10b981',
      inputs: [],
      activities: [
        { id: 'yield-compare', name: 'Compare actual yields vs planned and historical baselines', frequency: 'once' },
        { id: 'gross-margin-actual', name: 'Compile actual gross margin vs projected', frequency: 'once' },
        { id: 'lessons', name: 'Document lessons learned and recommendations for next season', frequency: 'once' },
        { id: 'renewal', name: 'Discuss contract renewal or follow-on services', frequency: 'once' },
      ],
      measurements: [
        { id: 'yield-improvement', name: 'Yield Change vs Baseline %', unit: 'percent', frequency: 'once', required: true },
        { id: 'roi', name: 'Client ROI on Consulting Fees', unit: 'ratio', frequency: 'once', required: false, benchmark: { min: 3 } },
      ],
      outputs: [
        { materialTypeId: 'advisory-report', quantity: null, unit: 'document', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Always document outcomes — client success stories are your most powerful marketing tool for acquiring the next client'],
    },
  ],
};

// ─── EQUIPMENT HIRE ───────────────────────────────────────────────────────────
export const equipmentHireTemplate: ProductionTemplate = {
  id: 'equipment-hire',
  name: 'Agricultural Equipment Hire (Custom Hiring)',
  shortName: 'Equipment Hire',
  category: 'services',
  species: 'N/A',
  purpose: 'Tractor, Machinery & Irrigation Equipment Hire',
  description: 'Custom hiring service for tractors, planters, harvesters, threshers, sprayers, and irrigation sets. Manages booking, pre-hire inspection, field operations, and maintenance scheduling.',
  icon: '🚜',
  color: '#fef3c7',
  tags: ['equipment hire', 'tractor', 'ploughing', 'custom hiring', 'mechanisation', 'services'],
  materials: [
    { id: 'fuel', name: 'Diesel Fuel', unit: 'L', category: 'input' },
    { id: 'lubricant', name: 'Engine Oil / Lubricants', unit: 'L', category: 'input' },
    { id: 'hire-invoice', name: 'Hire Invoice (per acre or per hour)', unit: 'count', category: 'output' },
  ],
  kpis: [
    { id: 'utilisation', name: 'Equipment Utilisation Rate %', unit: 'percent', benchmark: 70 },
    { id: 'acres-day', name: 'Acres Serviced per Day', unit: 'acres', benchmark: 20 },
    { id: 'fuel-acre', name: 'Fuel Consumption per Acre', unit: 'L/acre', benchmark: 4 },
    { id: 'downtime', name: 'Unplanned Downtime Days', unit: 'days', benchmark: 2 },
  ],
  stages: [
    {
      id: 'booking', name: 'Booking & Pre-Season Scheduling', order: 1, durationDays: 7, color: '#fef3c7',
      inputs: [],
      activities: [
        { id: 'book', name: 'Receive and confirm client booking; record acreage, field location, date', frequency: 'once' },
        { id: 'schedule', name: 'Build equipment schedule: sequence clients by geography to minimise travel', frequency: 'once' },
        { id: 'pre-inspect', name: 'Pre-season inspection: service engine, check tyres, test all implements', frequency: 'once' },
        { id: 'parts', name: 'Order spare parts inventory before season starts', frequency: 'once' },
      ],
      measurements: [
        { id: 'bookings', name: 'Bookings Confirmed', unit: 'count', frequency: 'once', required: true },
        { id: 'total-acres', name: 'Total Acres Committed', unit: 'acres', frequency: 'once', required: true },
      ],
      outputs: [], possibleNextStages: ['field-operation'],
      alerts: ['Over-booking equipment is the most common complaint — leave 20% schedule buffer for breakdowns and weather delays'],
    },
    {
      id: 'field-operation', name: 'Field Operations', order: 2, durationDays: 1, color: '#fde68a',
      inputs: [
        { id: 'diesel', label: 'Diesel Fuel', unit: 'L', required: true },
      ],
      activities: [
        { id: 'pre-op', name: 'Pre-operation check: fluids, tyre pressure, implement attachment', frequency: 'once' },
        { id: 'operate', name: 'Complete field operation per booking specifications', frequency: 'once' },
        { id: 'measure', name: 'Measure acres completed; confirm with client', frequency: 'once' },
        { id: 'fuel-log', name: 'Record fuel consumption per field', frequency: 'once' },
        { id: 'defect', name: 'Record any defects or abnormalities observed', frequency: 'once' },
      ],
      measurements: [
        { id: 'acres-done', name: 'Acres Completed', unit: 'acres', frequency: 'once', required: true },
        { id: 'fuel-used', name: 'Fuel Used', unit: 'L', frequency: 'once', required: true },
        { id: 'hours', name: 'Machine Hours', unit: 'hours', frequency: 'once', required: true },
      ],
      outputs: [
        { materialTypeId: 'hire-invoice', quantity: null, unit: 'count', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['maintenance'],
      alerts: ['Confirm acreage with client on the day — disputes after invoicing damage client relationships and are hard to resolve'],
    },
    {
      id: 'maintenance', name: 'Scheduled Maintenance & Log', order: 3, durationDays: 1, color: '#f59e0b',
      inputs: [
        { id: 'oil', label: 'Engine Oil (service)', unit: 'L', required: false },
        { id: 'filter', label: 'Oil / Air / Fuel Filters', unit: 'count', required: false },
      ],
      activities: [
        { id: 'service-interval', name: 'Every 250 hours: change oil, filters; check all belts and chains', frequency: 'once' },
        { id: 'tyres', name: 'Check and adjust tyre pressure weekly', frequency: 'weekly' },
        { id: 'grease', name: 'Grease all zerks and pivot points daily', frequency: 'daily' },
        { id: 'seasonal-service', name: 'Full end-of-season service before storage', frequency: 'once' },
        { id: 'hours-log', name: 'Update machine hours log after each day', frequency: 'daily' },
      ],
      measurements: [
        { id: 'engine-hours', name: 'Total Season Hours', unit: 'hours', frequency: 'once', required: true },
        { id: 'fuel-total', name: 'Total Season Fuel', unit: 'L', frequency: 'once', required: true },
        { id: 'maintenance-cost', name: 'Maintenance Cost per Hour', unit: 'currency/hr', frequency: 'once', required: false, benchmark: { max: 5 } },
      ],
      outputs: [], possibleNextStages: [],
      alerts: ['Deferred maintenance always costs more than scheduled maintenance — an engine seized in the middle of planting season causes revenue loss far exceeding the service cost'],
    },
  ],
};

// ─── FARMER TRAINING / EXTENSION ─────────────────────────────────────────────
export const farmerTrainingTemplate: ProductionTemplate = {
  id: 'farmer-training',
  name: 'Farmer Training & Extension Services',
  shortName: 'Farmer Training',
  category: 'services',
  species: 'N/A',
  purpose: 'Agricultural Extension & Capacity Building',
  description: 'Training cycle for farmer groups: needs assessment, curriculum design, classroom and field training, and follow-up evaluation. Covers FFS (Farmer Field Schools), demonstration plots, and digital extension.',
  icon: '🎓',
  color: '#ede9fe',
  tags: ['training', 'extension', 'farmer field school', 'FFS', 'capacity building', 'services'],
  materials: [
    { id: 'manual', name: 'Training Manual / Handout', unit: 'copy', category: 'input' },
    { id: 'demo-inputs', name: 'Demonstration Plot Inputs', unit: 'set', category: 'input' },
    { id: 'certificate', name: 'Completion Certificate', unit: 'count', category: 'output' },
    { id: 'training-report', name: 'Training Report', unit: 'document', category: 'output' },
  ],
  kpis: [
    { id: 'farmers-trained', name: 'Farmers Trained per Year', unit: 'count', benchmark: 200 },
    { id: 'attendance', name: 'Session Attendance Rate', unit: 'percent', benchmark: 80 },
    { id: 'knowledge-gain', name: 'Pre/Post Test Knowledge Gain', unit: 'percent', benchmark: 40 },
    { id: 'practice-adoption', name: 'Technology Adoption Rate (6-month follow-up)', unit: 'percent', benchmark: 60 },
  ],
  stages: [
    {
      id: 'needs-assessment', name: 'Needs Assessment & Curriculum Design', order: 1, durationDays: 7, color: '#ede9fe',
      inputs: [],
      activities: [
        { id: 'fgd', name: 'Focus group discussion with target farmer group — identify priority constraints', frequency: 'once' },
        { id: 'baseline', name: 'Administer baseline knowledge and practice survey', frequency: 'once' },
        { id: 'curriculum', name: 'Design curriculum matching identified gaps and local context', frequency: 'once' },
        { id: 'demo-setup', name: "Set up demonstration plot on a cooperating farmer's land", frequency: 'once' },
      ],
      measurements: [
        { id: 'farmers-targeted', name: 'Target Farmers', unit: 'count', frequency: 'once', required: true },
        { id: 'topics-prioritised', name: 'Priority Topics Identified', unit: 'count', frequency: 'once', required: false },
        { id: 'baseline-score', name: 'Baseline Knowledge Score', unit: 'percent', frequency: 'once', required: false },
      ],
      outputs: [], possibleNextStages: ['training-delivery'],
      alerts: ['A needs assessment that confirms what the trainer already wanted to teach is worthless — the FGD findings must be allowed to change the training plan'],
    },
    {
      id: 'training-delivery', name: 'Training Delivery (Classroom & Field)', order: 2, durationDays: 14, color: '#ddd6fe',
      inputs: [
        { id: 'manuals', label: 'Training Manuals / Handouts', unit: 'copy', required: true },
        { id: 'inputs-demo', label: 'Demo Plot Inputs (seed, fertilizer, etc.)', unit: 'set', required: false },
      ],
      activities: [
        { id: 'session', name: 'Deliver weekly 3-hour training session (classroom + field)', frequency: 'weekly' },
        { id: 'attendance', name: 'Record attendance; follow up absentees', frequency: 'weekly' },
        { id: 'demo-walk', name: 'Walk demo plot at each session; compare treatments', frequency: 'weekly' },
        { id: 'field-practice', name: 'Supervised practical exercise on demo plot', frequency: 'weekly' },
        { id: 'quiz', name: 'Short quiz at session end to track learning progression', frequency: 'weekly' },
      ],
      measurements: [
        { id: 'session-count', name: 'Sessions Delivered', unit: 'count', frequency: 'weekly', required: true },
        { id: 'attendance-pct', name: 'Average Attendance Rate %', unit: 'percent', frequency: 'weekly', required: true, benchmark: { min: 75 } },
        { id: 'quiz-score', name: 'Average Quiz Score', unit: 'percent', frequency: 'weekly', required: false, benchmark: { min: 65 } },
      ],
      outputs: [
        { materialTypeId: 'certificate', quantity: null, unit: 'count', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: ['follow-up-evaluation'],
      alerts: ['Adult learning principle: maximum 30% lecture, 70% practice. Purely classroom training achieves near-zero adoption rates'],
    },
    {
      id: 'follow-up-evaluation', name: 'Follow-up & Impact Evaluation', order: 3, durationDays: 180, color: '#8b5cf6',
      inputs: [],
      activities: [
        { id: 'post-test', name: 'Administer post-training knowledge test immediately after last session', frequency: 'once' },
        { id: 'farm-visit', name: 'Farm visit at 1 month: check if practice adopted', frequency: 'once' },
        { id: 'season-follow-up', name: 'End-of-season follow-up: measure yield change vs control', frequency: 'once' },
        { id: 'impact-report', name: 'Compile training impact report with disaggregated data (gender, age)', frequency: 'once' },
      ],
      measurements: [
        { id: 'post-score', name: 'Post-Training Knowledge Score', unit: 'percent', frequency: 'once', required: true },
        { id: 'adoption-rate', name: 'Technology Adoption Rate %', unit: 'percent', frequency: 'once', required: true, benchmark: { min: 60 } },
        { id: 'yield-change', name: 'Farmer Yield Change vs Non-Trained Neighbours', unit: 'percent', frequency: 'once', required: false },
      ],
      outputs: [
        { materialTypeId: 'training-report', quantity: null, unit: 'document', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['Report must capture women and youth separately — donors and governments require disaggregated data; combined totals mask inequality in access'],
    },
  ],
};

// ─── LAB TESTING SERVICES ────────────────────────────────────────────────────
export const labTestingTemplate: ProductionTemplate = {
  id: 'agri-lab-testing',
  name: 'Agricultural Laboratory Testing',
  shortName: 'Lab Testing',
  category: 'services',
  species: 'N/A',
  purpose: 'Soil, Water, Crop, and Food Quality Testing',
  description: 'Laboratory service cycle for soil fertility analysis, water quality testing, crop residue testing, and food safety (aflatoxin, heavy metals, pesticide residues). Generates certified test reports.',
  icon: '🔬',
  color: '#ecfdf5',
  tags: ['laboratory', 'soil testing', 'water quality', 'food safety', 'aflatoxin', 'services'],
  materials: [
    { id: 'sample-kit', name: 'Sample Collection Kit', unit: 'kit', category: 'input' },
    { id: 'reagents', name: 'Laboratory Reagents', unit: 'L', category: 'input' },
    { id: 'test-report', name: 'Certified Test Report', unit: 'count', category: 'output' },
  ],
  kpis: [
    { id: 'samples-day', name: 'Samples Processed per Day', unit: 'count', benchmark: 50 },
    { id: 'tat', name: 'Turnaround Time (routine)', unit: 'days', benchmark: 5 },
    { id: 'precision', name: 'Internal QC Precision (CV%)', unit: 'percent', benchmark: 5 },
    { id: 'report-on-time', name: 'Reports Issued On Time %', unit: 'percent', benchmark: 95 },
  ],
  stages: [
    {
      id: 'sample-intake', name: 'Sample Intake & Chain of Custody', order: 1, durationDays: 1, color: '#ecfdf5',
      inputs: [
        { id: 'samples', label: 'Client Samples (labelled, sealed)', unit: 'count', required: true },
      ],
      activities: [
        { id: 'receive', name: 'Receive samples; check label, condition, chain of custody form', frequency: 'once' },
        { id: 'log', name: 'Log into LIMS; assign unique sample ID and barcode', frequency: 'once' },
        { id: 'reject', name: 'Reject if: container damaged, label missing, wrong preservative used — notify client', frequency: 'once' },
        { id: 'store', name: 'Sub-sample and store aliquots at appropriate temperature', frequency: 'once' },
      ],
      measurements: [
        { id: 'samples-received', name: 'Samples Received', unit: 'count', frequency: 'daily', required: true },
        { id: 'rejection-rate', name: 'Sample Rejection Rate %', unit: 'percent', frequency: 'daily', required: false, benchmark: { max: 5 } },
      ],
      outputs: [], possibleNextStages: ['analysis'],
      alerts: ['Chain of custody must be unbroken from client to report — an undocumented sample has no legal standing and cannot be used in regulatory or legal proceedings'],
    },
    {
      id: 'analysis', name: 'Laboratory Analysis & QC', order: 2, durationDays: 4, color: '#bbf7d0',
      inputs: [
        { id: 'reagents-in', label: 'Reagents (specify per method)', unit: 'L', required: true },
      ],
      activities: [
        { id: 'prep', name: 'Sample preparation per standard method (extraction, digestion, dilution)', frequency: 'once' },
        { id: 'analyse', name: 'Run analysis on instrument (AAS, HPLC, ICP, spectrophotometer)', frequency: 'once' },
        { id: 'qc-blank', name: 'Run method blank, standard reference material, and duplicate each batch', frequency: 'daily' },
        { id: 'calibrate', name: 'Calibrate instrument before each run; check with certified standard', frequency: 'daily' },
        { id: 'data-entry', name: 'Enter results into LIMS; flag outliers for rerun', frequency: 'daily' },
      ],
      measurements: [
        { id: 'qc-cv', name: 'Internal QC CV %', unit: 'percent', frequency: 'daily', required: true, benchmark: { max: 5 } },
        { id: 'recovery', name: 'Spike Recovery % (QC standard)', unit: 'percent', frequency: 'daily', required: true, benchmark: { min: 85, max: 115 } },
        { id: 'batch-size', name: 'Samples per Batch', unit: 'count', frequency: 'daily', required: false },
      ],
      outputs: [], possibleNextStages: ['reporting'],
      alerts: ['QC failure means the ENTIRE batch must be rerun — never report results from a batch where QC was out of acceptable range'],
    },
    {
      id: 'reporting', name: 'Result Review & Report Issuance', order: 3, durationDays: 1, color: '#34d399',
      inputs: [],
      activities: [
        { id: 'review', name: 'Technical reviewer checks all results against method spec; approves or flags', frequency: 'once' },
        { id: 'interpret', name: 'Add interpretation panel (e.g. soil fertility rating, food safety pass/fail)', frequency: 'once' },
        { id: 'sign', name: 'Authorised signatory signs and stamps each report', frequency: 'once' },
        { id: 'issue', name: 'Issue certified report to client; retain copy for 5 years', frequency: 'once' },
        { id: 'flag', name: 'If critical result found (aflatoxin >20 ppb, heavy metal exceedance) — call client immediately before posting report', frequency: 'once' },
      ],
      measurements: [
        { id: 'reports-issued', name: 'Reports Issued', unit: 'count', frequency: 'daily', required: true },
        { id: 'tat-avg', name: 'Average Turnaround Time', unit: 'days', frequency: 'daily', required: true, benchmark: { max: 5 } },
      ],
      outputs: [
        { materialTypeId: 'test-report', quantity: null, unit: 'count', routing: 'inventory', qualityGrade: 'A' },
      ],
      possibleNextStages: [],
      alerts: ['A result showing aflatoxin above 20 ppb in grain destined for human consumption is a public health emergency — call the client immediately and report to the relevant food safety authority'],
    },
  ],
};
