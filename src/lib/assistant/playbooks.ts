/**
 * What the AGRINUXES guide knows about each kind of account: who they are, what to set up first (a checklist the
 * guide can tick off by looking at the workspace), short lessons it can teach, and what to offer when the
 * person has not said what they want yet.
 *
 * Page ids must match the ones used by the shells (farm AppShellV2, VendorShell, Government/Extension/Partner).
 */
export type AccountKind =
  | 'farmer' | 'cooperative' | 'vet_provider' | 'equipment_hire' | 'transport' | 'agro_dealer' | 'agrisupply_provider'
  | 'agrifood_seller' | 'agriservices_provider' | 'processor' | 'government' | 'extension' | 'partner' | 'individual' | 'visitor';

export interface SetupFacts {
  /** the onboarding wizard has been finished */
  onboarded: boolean;
  enterprises: number;
  /** at least one enterprise runs on a template the farm saved as its own */
  ownTemplate: boolean;
  cycles: number;
  dailyRecords: number;
}

export interface SetupStep {
  id: string;
  label: string;
  /** why it matters, in one plain sentence */
  why: string;
  page?: string;
  /** a question the guide can be asked to help with this step */
  ask: string;
  /** worked out from the workspace; steps without it are ticked by the person */
  auto?: (f: SetupFacts) => boolean;
}

export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  steps: { text: string; page?: string }[];
}

export interface Playbook {
  label: string;
  intro: string;
  starters: string[];
  steps: SetupStep[];
  lessons: Lesson[];
}

export const VENDOR_KINDS: AccountKind[] = ['vet_provider', 'equipment_hire', 'transport', 'agro_dealer', 'agrisupply_provider', 'agrifood_seller', 'agriservices_provider', 'processor'];

const farmSteps = (coop: boolean): SetupStep[] => [
  { id: 'wizard', label: 'Finish the set-up wizard', why: 'It names your business and creates your first enterprises.', ask: 'How do I finish the set-up wizard?', auto: f => f.onboarded },
  { id: 'enterprise', label: coop ? 'Add the enterprises your group runs' : 'Add an enterprise from a template', why: 'An enterprise is one line of your business, like broilers or maize. It carries the template.', page: 'config', ask: coop ? 'How do I add enterprises for my cooperative?' : 'Help me choose a template for my farm', auto: f => f.enterprises > 0 },
  { id: 'standards', label: 'Make a template your own', why: 'Set your own feed, vaccines, sprays and daily boxes once and reuse them for every cycle.', page: 'production', ask: 'Walk me through setting my own standards in a template', auto: f => f.ownTemplate },
  { id: 'cycle', label: 'Start your first production cycle', why: 'A cycle is one run, like a batch of chicks or a maize season. Day 0 starts the care plan.', page: 'production', ask: 'Help me start my first cycle', auto: f => f.cycles > 0 },
  { id: 'daily', label: 'Record your first daily log', why: 'Daily records feed your reports, your care plan and your credit profile.', page: 'production', ask: 'Show me how to record the daily log', auto: f => f.dailyRecords > 0 },
  { id: 'stock', label: 'Add your stock to Inventory', why: 'Feed, medicine and produce counted in one place. Automatic entries find your items by name.', page: 'inventory', ask: 'How do I add stock and set minimum levels?' },
  { id: 'customers', label: 'Add your customers and record a sale', why: 'Fulfilled orders post income to Finance and take stock out for you.', page: 'sales', ask: 'How do I record my first sale?' },
  { id: 'team', label: 'Add your team with the right roles', why: 'Each person sees only what their role allows. Do this after the wizard.', page: 'team', ask: 'How do I add a team member and choose their role?' },
  { id: 'share', label: 'Decide about sharing data with programmes', why: 'Switch on data sharing if you want an extension officer, a programme or a lender to see your farm.', page: 'config', ask: 'What does data sharing do and should I switch it on?' },
];

const vendorSteps = (what: string, catalogue: { label: string; page: string }): SetupStep[] => [
  { id: 'wizard', label: 'Finish the set-up wizard', why: 'It creates your business workspace.', ask: 'How do I finish the set-up wizard?', auto: f => f.onboarded },
  { id: 'listing', label: 'Fill in your Marketplace Listing', why: 'Buyers find you through this public profile: description, district, services, certificates.', page: 'marketplace', ask: 'Help me write my marketplace listing' },
  { id: 'catalogue', label: catalogue.label, why: `Buyers can only book or order what you list. ${what}`, page: catalogue.page, ask: `How do I ${catalogue.label.toLowerCase()}?` },
  { id: 'settings', label: 'Check Settings: district, phone, hours', why: 'Farmers search by district and call the phone number you give.', page: 'settings', ask: 'What should I set in Settings?' },
  { id: 'client', label: 'Add your first client', why: 'Clients are the people you serve. Orders and invoices attach to them.', page: 'clients', ask: 'How do I add a client?' },
  { id: 'invoice', label: 'Raise your first invoice', why: 'Invoices and payments show up in Revenue.', page: 'invoices', ask: 'How do I make an invoice?' },
  { id: 'team', label: 'Add your staff under Users & Permissions', why: 'Each person gets their own sign-in and role.', page: 'team', ask: 'How do I add staff?' },
];

export const PLAYBOOKS: Record<AccountKind, Playbook> = {
  farmer: {
    label: 'Farm',
    intro: 'I can set up your farm with you, teach you the daily routine and help you make templates that match how you really farm.',
    starters: ['Set up my farm', 'Help me choose a template', 'Teach me the daily log', 'How do I set my own standards?'],
    steps: farmSteps(false),
    lessons: [
      { id: 'first-day', title: 'Record your first day', minutes: 4, steps: [
        { text: 'Open Production and click your cycle in the list.', page: 'production' },
        { text: 'Click the Daily Log tab. Pick the stage and the date.' },
        { text: 'Fill the Key Measurements (marked with a red star) and any other boxes you have.' },
        { text: 'Add a note if something unusual happened, then press Save Daily Record.' },
        { text: 'Open the Care Plan tab and tick off what you did today.' },
      ] },
      { id: 'own-template', title: 'Make a template your own', minutes: 6, steps: [
        { text: 'Open Production, click a cycle, then the Care Plan tab.', page: 'production' },
        { text: 'Click Set my standards. A window called "Set your standards" opens.' },
        { text: 'On Daily record fields, add the boxes you want (feed brand, water additive) and set normal ranges and targets.' },
        { text: 'On Care guide, change the days and products to match your vet or agronomist.' },
        { text: 'Give the template a name and press Save as my template. It is shared with your whole company.' },
        { text: 'Start your next cycle from this template. Check every dose with your vet first.' },
      ] },
      { id: 'csv', title: 'Import daily records from a spreadsheet', minutes: 5, steps: [
        { text: 'Open the cycle and the Daily Log tab, then scroll to the bottom.', page: 'production' },
        { text: 'Press Template to download a CSV with the right column headings for this enterprise.' },
        { text: 'Fill one row per day in Excel or Sheets and save as CSV.' },
        { text: 'Press Import CSV, choose the file and read the preview. Fix any row marked with an error.' },
        { text: 'Press Import. The records appear in the history.' },
      ] },
      { id: 'sell', title: 'Sell, invoice and get paid', minutes: 5, steps: [
        { text: 'Open Sales and add the customer.', page: 'sales' },
        { text: 'Create an order with the product, quantity and price.' },
        { text: 'Move it to Fulfilled when it is delivered. Income and stock update by themselves.' },
        { text: 'Record each payment on the order panel.' },
      ] },
      { id: 'credit', title: 'Understand your credit profile', minutes: 3, steps: [
        { text: 'Open Credit Profile.', page: 'credit' },
        { text: 'Read the score and what raises it. Records, sales and finance entries all count.' },
        { text: 'Press Create share link to give a lender a read-only report.' },
      ] },
    ],
  },
  cooperative: {
    label: 'Cooperative',
    intro: 'I can help you set up the group, add what it runs, bring in your team and share data with programmes.',
    starters: ['Set up my cooperative', 'Add enterprises for my group', 'Add my team', 'Share data with a programme'],
    steps: farmSteps(true),
    lessons: [
      { id: 'team', title: 'Add your officers and members', minutes: 4, steps: [
        { text: 'Open Team & Permissions.', page: 'team' },
        { text: 'Press Add member, type the name and email and choose a role.' },
        { text: 'Use branches if the group has several sites, and limit people to their branch.' },
      ] },
      { id: 'share', title: 'Share with a programme or extension officer', minutes: 3, steps: [
        { text: 'Open Settings.', page: 'config' },
        { text: 'Tick Share with government & partners to let programmes see de-identified figures.' },
        { text: 'Choose your extension officer so they can add you to their caseload.' },
      ] },
    ],
  },
  vet_provider: {
    label: 'Vet business',
    intro: 'I can help you set up your clinic profile, services and appointments and teach you to write prescriptions and invoices.',
    starters: ['Set up my vet profile', 'Add my services and fees', 'How do I take an appointment?', 'Write a prescription'],
    steps: vendorSteps('Farmers pick a service and book you.', { label: 'Add your services and fees', page: 'services' }),
    lessons: [
      { id: 'appt', title: 'Receive and complete an appointment', minutes: 5, steps: [
        { text: 'Open Appointments. New marketplace bookings appear as Requested.', page: 'appointments' },
        { text: 'Open the booking, confirm it, then Start it when the visit begins.' },
        { text: 'Record the consultation or treatment, then Complete it.' },
        { text: 'Raise an invoice from the Invoices tab.', page: 'invoices' },
      ] },
      { id: 'rx', title: 'Write a prescription', minutes: 3, steps: [
        { text: 'Open Prescriptions or the appointment you are working on.', page: 'prescriptions' },
        { text: 'Add the drug, dose, route, days and the withdrawal period. Withdrawal days protect the food chain.' },
      ] },
    ],
  },
  equipment_hire: {
    label: 'Equipment hire business',
    intro: 'I can help you list your machines, take bookings and log maintenance.',
    starters: ['Set up my equipment hire', 'Add a machine to my fleet', 'How do bookings work?', 'Log maintenance'],
    steps: vendorSteps('Each machine is something farmers can book.', { label: 'Add your machines to Fleet Management', page: 'fleet' }),
    lessons: [
      { id: 'fleet', title: 'Add a machine and its rate', minutes: 4, steps: [
        { text: 'Open Fleet Management and press Add machine.', page: 'fleet' },
        { text: 'Enter the name, type, rate and unit (per day, per hectare), and set it available.' },
      ] },
      { id: 'booking', title: 'Take a booking', minutes: 4, steps: [
        { text: 'Open Bookings and press New booking, or accept one from the marketplace.', page: 'bookings' },
        { text: 'Choose the machine, dates and client. Move it through Confirmed, In progress and Completed.' },
      ] },
    ],
  },
  transport: {
    label: 'Transport business',
    intro: 'I can help you list vehicles, routes and rates and run your transport jobs.',
    starters: ['Set up my transport business', 'Add a vehicle', 'Create a transport job', 'Set my routes and rates'],
    steps: vendorSteps('Farmers book trucks and routes.', { label: 'Add your vehicles', page: 'fleet' }),
    lessons: [
      { id: 'job', title: 'Create and run a transport job', minutes: 4, steps: [
        { text: 'Open Transport Jobs and press Job.', page: 'jobs' },
        { text: 'Enter the client, route, quantity and amount. Assign a vehicle.' },
        { text: 'Move it to In progress, then Completed, and invoice the client.' },
      ] },
    ],
  },
  agro_dealer: {
    label: 'Agro dealer',
    intro: 'I can help you list your products, keep stock right and handle orders.',
    starters: ['Set up my shop', 'Add a product', 'Record an order', 'Adjust my stock'],
    steps: vendorSteps('Stock and price are what farmers see.', { label: 'Add your products to the Product Catalog', page: 'catalog' }),
    lessons: [
      { id: 'product', title: 'Add a product with stock and price', minutes: 4, steps: [
        { text: 'Open Product Catalog and press Add product.', page: 'catalog' },
        { text: 'Enter the name, unit, price and the stock you hold. Keep it listed so farmers can see it.' },
      ] },
      { id: 'order', title: 'Record an order and fulfil it', minutes: 4, steps: [
        { text: 'Open Orders and press New order.', page: 'orders' },
        { text: 'Choose the client and the items. Confirm it and mark it delivered. Stock goes down for you.' },
      ] },
    ],
  },
  agrisupply_provider: {
    label: 'AgriSupply provider',
    intro: 'I can help you list supplies, take purchase orders and track deliveries.',
    starters: ['Set up my supply business', 'Add a supply item', 'Record a purchase order', 'Track a delivery'],
    steps: vendorSteps('Buyers order from your catalogue.', { label: 'Add items to the Supply Catalog', page: 'catalog' }),
    lessons: [
      { id: 'po', title: 'Take a purchase order through delivery', minutes: 5, steps: [
        { text: 'Open Purchase Orders and press New order.', page: 'orders' },
        { text: 'Add the items, confirm, then open Deliveries to schedule the drop.', page: 'deliveries' },
      ] },
    ],
  },
  agrifood_seller: {
    label: 'AgriFood seller',
    intro: 'I can help you list produce, set prices and handle buyer orders.',
    starters: ['Set up my produce shop', 'List my produce', 'Update my prices', 'Handle a buyer order'],
    steps: vendorSteps('Buyers see your listings and call you.', { label: 'List your produce', page: 'listings' }),
    lessons: [
      { id: 'listing', title: 'List produce and keep prices fresh', minutes: 4, steps: [
        { text: 'Open Produce Listings and press Add listing.', page: 'listings' },
        { text: 'Enter the produce, unit, price and stock. Update Pricing & Stock as the market moves.', page: 'pricing' },
      ] },
    ],
  },
  agriservices_provider: {
    label: 'AgriServices provider',
    intro: 'I can help you list services and schedule jobs.',
    starters: ['Set up my services business', 'Add a service and price', 'Schedule a job', 'Invoice a completed job'],
    steps: vendorSteps('Farmers book from your list.', { label: 'Add your services and prices', page: 'services' }),
    lessons: [
      { id: 'job', title: 'Schedule and finish a job', minutes: 4, steps: [
        { text: 'Open Job Schedule and press New job.', page: 'jobs' },
        { text: 'Pick the client, service and date. Move it to In progress and Completed, then invoice.' },
      ] },
    ],
  },
  processor: {
    label: 'Agro processor',
    intro: 'I can help you record raw material intake, processing lots and traceability.',
    starters: ['Set up my processing business', 'Record raw material intake', 'Log a processing batch', 'Trace a lot'],
    steps: vendorSteps('Lots tie finished goods back to the farms.', { label: 'Record your first intake in Farm Sourcing', page: 'sourcing' }),
    lessons: [
      { id: 'lot', title: 'Record a lot from intake to finished goods', minutes: 6, steps: [
        { text: 'Open Farm Sourcing and record the raw material and the farm it came from.', page: 'sourcing' },
        { text: 'Open Processing Logs and record the batch with input, output and a lot code.', page: 'processing' },
        { text: 'Open Traceability and search the lot code to see where it came from.', page: 'traceability' },
      ] },
    ],
  },
  government: {
    label: 'Government office',
    intro: 'I can help you read the dashboards, use the map and send advisories to farmers in your area.',
    starters: ['Show me how to read the National Map', 'Send an advisory', 'Filter by my district', 'Why are few farms shown?'],
    steps: [
      { id: 'scope', label: 'Choose your province and district', why: 'Every figure is filtered to your scope.', page: 'overview', ask: 'How do I filter to my district?' },
      { id: 'map', label: 'Open the National Map', why: 'See where farms, hotspots and programmes are, without identifying anyone.', page: 'map', ask: 'How do I read the National Map?' },
      { id: 'advisory', label: 'Send your first advisory', why: 'Reach farmers in an area, for example with a pest warning.', page: 'advisories', ask: 'How do I send an advisory?' },
      { id: 'team', label: 'Add your colleagues', why: 'Give each officer the right role.', page: 'team', ask: 'How do I add colleagues?' },
    ],
    lessons: [
      { id: 'map', title: 'Read the National Map', minutes: 3, steps: [
        { text: 'Open National Map.', page: 'map' },
        { text: 'Use the legend to switch layers on and off: districts, hotspots, programmes, weather stations, providers.' },
        { text: 'Click a circle or a row to drill into a district. Only farms that opted in are counted.' },
      ] },
    ],
  },
  extension: {
    label: 'Extension officer',
    intro: 'I can help you build your caseload, log visits and send advisories.',
    starters: ['Add farms to my caseload', 'Log a farm visit', 'See who needs a follow-up', 'Send an advisory'],
    steps: [
      { id: 'add', label: 'Add farms to your caseload', why: 'Only farms that opted in to data sharing in your area can be added.', page: 'add', ask: 'How do I add farms to my caseload?' },
      { id: 'visit', label: 'Log your first visit', why: 'Visits, notes and follow-up dates keep farmers on track.', page: 'visits', ask: 'How do I log a farm visit?' },
      { id: 'team', label: 'Check your team and branches', why: 'Supervisors can see their officers.', page: 'team', ask: 'How do supervisors work?' },
    ],
    lessons: [
      { id: 'visit', title: 'Log a visit with a follow-up', minutes: 4, steps: [
        { text: 'Open My Caseload and open a farm.', page: 'caseload' },
        { text: 'Press Log visit. Add notes, what you advised and a follow-up date.' },
        { text: 'Open Visits & Follow-ups to see overdue follow-ups.', page: 'visits' },
      ] },
    ],
  },
  partner: {
    label: 'Programme partner',
    intro: 'I can help you create a programme, enrol farms, record support and build the results framework.',
    starters: ['Create my first programme', 'Enrol eligible farms', 'Build the results framework', 'Generate the donor report'],
    steps: [
      { id: 'programme', label: 'Create your first programme', why: 'Sector, dates, budget, target districts and eligibility.', page: 'programmes', ask: 'Help me create a programme' },
      { id: 'enrol', label: 'Enrol eligible farms', why: 'Only farms that opted in can be enrolled, one at a time.', page: 'programmes', ask: 'How do I enrol farms?' },
      { id: 'logframe', label: 'Build the results framework', why: 'Indicators, baselines and targets let you show results to donors.', page: 'programmes', ask: 'How do I build the results framework?' },
      { id: 'team', label: 'Add your team with the right roles', why: 'Managers, M&E officers and observers see different things.', page: 'team', ask: 'Which roles should my team have?' },
    ],
    lessons: [
      { id: 'prog', title: 'Create a programme and enrol farms', minutes: 6, steps: [
        { text: 'Open Programmes and press New programme.', page: 'programmes' },
        { text: 'Fill in sector, dates, budget, target districts and who is eligible.' },
        { text: 'Open the programme and enrol farms one at a time. Record each support delivered in the support ledger.' },
      ] },
    ],
  },
  individual: {
    label: 'Individual buyer',
    intro: 'I can help you find the right vet, dealer or seller and contact them.',
    starters: ['Find a vet near me', 'Find an agro dealer', 'How do I save a provider?', 'How do I order?'],
    steps: [],
    lessons: [
      { id: 'find', title: 'Find and contact a provider', minutes: 2, steps: [
        { text: 'Open Marketplace and pick a category or search.' },
        { text: 'Open a provider\'s Details to see services, prices and reviews.' },
        { text: 'Press Call to phone them. Save the heart icon to find them again.' },
      ] },
    ],
  },
  visitor: {
    label: 'Visitor',
    intro: 'I can help you choose the right account and get registered.',
    starters: ['Which account should I register?', 'How do I register a farm?', 'Can I browse without an account?', 'I am a vet, what do I do?'],
    steps: [],
    lessons: [],
  },
};

/** Work out the account kind from what the app knows about the signed-in person. */
export function accountKind(profile: any, org: any): AccountKind {
  if (!profile) return 'visitor';
  const role = String(profile.role || '');
  if (['gov_viewer', 'gov_admin'].includes(role)) return 'government';
  if (['extension_officer', 'extension_supervisor'].includes(role)) return 'extension';
  if (['partner_manager', 'partner_admin', 'partner_me_officer', 'partner_observer'].includes(role)) return 'partner';
  if (profile.organization === 'individual') return 'individual';
  const bt = String(profile.businessType || org?.businessType || 'farmer');
  return (bt in PLAYBOOKS ? bt : 'farmer') as AccountKind;
}
