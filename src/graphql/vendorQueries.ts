// ─────────────────────────────────────────────────────────────────────────────
// Vendor-side GraphQL documents — matches apps/market/vendor_schema.py
// Decimal fields arrive as strings; enum-converted fields on the older
// provider types (providerType, status…) arrive UPPER_CASE — use lc()/num().
// ─────────────────────────────────────────────────────────────────────────────

export const lc = (v: any) => (typeof v === 'string' ? v.toLowerCase() : v ?? '');
export const num = (v: any) => (v == null || v === '' ? 0 : Number(v));
export const parseJson = (v: any) => { if (typeof v !== 'string') return v ?? null; try { return JSON.parse(v); } catch { return v; } };
// JSONField lists (coverageDistricts, tags, specialties, qualifications, photos) arrive as JSON strings
export const arr = (v: any): any[] => { const p = parseJson(v); return Array.isArray(p) ? p : []; };

const PROVIDER = `id name slug providerType tagline description phone email website whatsapp district town address coverageDistricts mobileService emergencyAvailable serviceHours
  isVerified status avgRating reviewCount bookingCount tags specialties yearEstablished businessRegNo taxId logoUrl latitude longitude`;
const STAFF = `id name role phone email bio qualifications licenceNo active`;
const SERVICE = `id name description category pricingModel price priceMax currency unitLabel isAvailable leadTimeDays notes`;
const CERT = `id name issuingBody certNumber issuedDate expiryDate status verified documentUrl`;
const EQUIP = `id equipmentType name make model year capacity dailyRate perHaRate currency operatorIncluded fuelIncluded minHireDays isAvailable notes`;
const BOOKING = `id bookingRef status startDate endDate hectares quotedAmount agreedAmount currency depositPaid finalPaid deliveryAddress notes providerNotes createdAt clientName clientPhone
  organization { id name district } equipment { id name } requestedBy { fullName }`;
const APPT = `id apptRef status apptType apptDate apptTime species animalCount symptoms diagnosis treatmentGiven medications followUpDate outcomeNotes consultationFee totalAmount currency paid createdAt
  clientName clientPhone organization { id name district } vetOfficer { id name } requestedBy { fullName }`;
const JOB = `id jobRef kind title description location destination district distanceKm quantity unit scheduledDate scheduledTime status quotedAmount agreedAmount currency paid completedAt completionNotes notes createdAt
  clientName clientPhone clientOrgName clientOrg { id } serviceName service { id } staffName assignedStaff { id } equipmentName equipment { id }`;
const ORDER = `id orderRef source status items subtotal discount total currency deliveryRequired deliveryAddress deliveryDate deliveredAt paid notes createdAt clientName clientPhone clientOrgName clientOrg { id }`;
const BATCH = `id lotCode status sourceName sourceDistrict sourceOrgName sourceOrg { id } inputCommodity inputQuantity inputUnit pricePaid currency receivedOn product outputQuantity outputUnit quantitySold quantityRemaining yieldPct startedOn completedOn expiryDate qcPassed qcNotes notes`;
const INVOICE = `id invoiceRef status items subtotal tax total currency issuedOn dueOn paidOn paymentMethod notes linkType linkId linkRef clientName clientPhone clientOrgName clientOrg { id } createdAt`;
const MAINT = `id kind date description cost currency hoursReading downtimeDays nextDueDate performedBy notes equipmentName equipment { id }`;
const LISTING = `id commodity description quantityAvailable unit askingPrice currency minOrderQuantity status availableUntil deliveryAvailable location viewsCount createdAt`;
const SUMMARY = `providerId providerType status isVerified avgRating reviewCount openBookings upcomingAppointments followUpsDue openJobs openOrders unpaidInvoices unpaidAmount revenue30d revenueYtd revenueSeries revenueByKind
  clients listingsActive lowStock equipmentCount equipmentAvailable maintenanceDue batchesInProcess finishedStock today`;

export const ENSURE_PROVIDER = `mutation { ensureMyProvider { created provider { ${PROVIDER} } } }`;
export const VENDOR_HOME = `query VendorHome { myProvider { ${PROVIDER} } vendorSummary { ${SUMMARY} } }`;
export const UPDATE_PROVIDER = `mutation UpdateProvider($in: VendorProfileInput!) { updateMyProvider(input: $in) { provider { ${PROVIDER} } } }`;
export const PROVIDER_TYPES = `query { providerTypeChoices }`;

export const STAFF_Q = `query { myStaff { ${STAFF} } }`;
export const UPSERT_STAFF = `mutation($id: UUID, $in: StaffInput!) { upsertStaff(id: $id, input: $in) { staff { ${STAFF} } } }`;
export const DELETE_STAFF = `mutation($id: UUID!) { deleteStaff(id: $id) { ok } }`;
export const SERVICES_Q = `query { myServices { ${SERVICE} } }`;
export const UPSERT_SERVICE = `mutation($id: UUID, $in: ServiceInput!) { upsertService(id: $id, input: $in) { service { ${SERVICE} } } }`;
export const DELETE_SERVICE = `mutation($id: UUID!) { deleteService(id: $id) { ok } }`;
export const CERTS_Q = `query { myCertifications { ${CERT} } }`;
export const UPSERT_CERT = `mutation($id: UUID, $in: CertificationInput!) { upsertCertification(id: $id, input: $in) { certification { ${CERT} } } }`;
export const DELETE_CERT = `mutation($id: UUID!) { deleteCertification(id: $id) { ok } }`;
export const REVIEWS_Q = `query { myProviderReviews { id rating title body serviceUsed approved createdAt organization { name } } }`;

export const EQUIPMENT_Q = `query { vendorEquipment { ${EQUIP} } }`;
export const UPSERT_EQUIPMENT = `mutation($id: UUID, $in: EquipmentInput!) { upsertEquipment(id: $id, input: $in) { equipment { ${EQUIP} } } }`;
export const DELETE_EQUIPMENT = `mutation($id: UUID!) { deleteEquipment(id: $id) { ok } }`;
export const MAINT_Q = `query($e: UUID) { vendorMaintenance(equipmentId: $e) { ${MAINT} } }`;
export const ADD_MAINT = `mutation($in: MaintenanceInput!) { addMaintenance(input: $in) { record { id } } }`;
export const DELETE_MAINT = `mutation($id: UUID!) { deleteMaintenance(id: $id) { ok } }`;

export const BOOKINGS_Q = `query($status: String) { providerHireBookings(status: $status) { ${BOOKING} } }`;
export const CREATE_BOOKING = `mutation($in: ProviderBookingInput!) { createProviderBooking(input: $in) { booking { id } } }`;
export const UPDATE_BOOKING = `mutation($id: UUID!, $in: HireBookingUpdateInput!) { vendorUpdateHireBooking(id: $id, input: $in) { booking { id status } } }`;

export const APPTS_Q = `query($status: String, $upcoming: Boolean, $meds: Boolean) { providerVetAppointments(status: $status, upcoming: $upcoming, withMedications: $meds) { ${APPT} } }`;
export const PATIENTS_Q = `query { vetPatients { key orgId clientName clientPhone species animalCount visits lastVisit nextFollowUp conditions medications outstanding } }`;
export const CREATE_APPT = `mutation($in: ProviderAppointmentInput!) { createProviderAppointment(input: $in) { appointment { id } } }`;
export const UPDATE_APPT = `mutation($id: UUID!, $in: VetOutcomeInput!) { vendorUpdateVetAppointment(id: $id, input: $in) { appointment { id status } } }`;

export const JOBS_Q = `query($status: String, $kind: String) { vendorWorkOrders(status: $status, kind: $kind) { ${JOB} } }`;
export const UPSERT_JOB = `mutation($id: UUID, $in: WorkOrderInput!) { upsertWorkOrder(id: $id, input: $in) { job { id } } }`;
export const DELETE_JOB = `mutation($id: UUID!) { deleteWorkOrder(id: $id) { ok } }`;

export const ORDERS_Q = `query($status: String) { vendorOrders(status: $status) { ${ORDER} } }`;
export const UPSERT_ORDER = `mutation($id: UUID, $in: VendorOrderInput!) { upsertVendorOrder(id: $id, input: $in) { order { id } } }`;
export const DELETE_ORDER = `mutation($id: UUID!) { deleteVendorOrder(id: $id) { ok } }`;

export const LISTINGS_Q = `query { vendorListings { ${LISTING} } }`;
export const CREATE_LISTING = `mutation($c: String!, $q: Float!, $p: Float!, $u: String, $d: String, $l: String, $until: Date) { createListing(commodity: $c, quantityAvailable: $q, askingPrice: $p, unit: $u, description: $d, location: $l, availableUntil: $until) { listing { id } } }`;
export const UPDATE_LISTING = `mutation($id: UUID!, $in: ListingUpdateInput!) { updateListing(id: $id, input: $in) { listing { id } } }`;

export const BATCHES_Q = `query($status: String) { vendorBatches(status: $status) { ${BATCH} } }`;
export const UPSERT_BATCH = `mutation($id: UUID, $in: BatchInput!) { upsertBatch(id: $id, input: $in) { batch { id } } }`;
export const DELETE_BATCH = `mutation($id: UUID!) { deleteBatch(id: $id) { ok } }`;

export const INVOICES_Q = `query($status: String) { vendorInvoices(status: $status) { ${INVOICE} } }`;
export const UPSERT_INVOICE = `mutation($id: UUID, $in: InvoiceInput!) { upsertInvoice(id: $id, input: $in) { invoice { id invoiceRef } } }`;
export const SET_INVOICE_STATUS = `mutation($id: UUID!, $s: String!, $m: String) { setInvoiceStatus(id: $id, status: $s, paymentMethod: $m) { invoice { id status } } }`;
export const DELETE_INVOICE = `mutation($id: UUID!) { deleteInvoice(id: $id) { ok } }`;

export const CLIENTS_Q = `query { vendorClients { key orgId name phone district businessType interactions lastDate totalValue outstanding kinds } }`;
export const CLIENT_SEARCH = `query($s: String!) { vendorClientSearch(search: $s) { id name district province businessType } }`;
