// ─────────────────────────────────────────────────────────────────────────────
// Trade contracts, buyers & export documents — GraphQL documents + types.
// ─────────────────────────────────────────────────────────────────────────────

export interface Buyer { id: string; name: string; buyerType: string; contactPerson: string; phone: string; email: string; address: string; town: string; country: string; paymentTerms: string; isVerified: boolean }
export interface Contract {
  id: string; commodity: string; quantityAgreed: number; unit: string; agreedPrice: number; currency: string; totalValue: number; status: string;
  deliveryDate: string | null; deliveryAddress: string; paymentTerms: string; depositPct: number; depositPaid: boolean; finalPaid: boolean;
  quantityDelivered: number; notes: string; createdAt: string; buyer: Buyer | null;
}
export interface ExportDoc {
  id: string; contractId: string | null; docType: string; docTypeDisplay: string; docNumber: string; issuingAuthority: string; commodity: string;
  quantity: number; unit: string; destinationCountry: string; status: string; statusDisplay: string; issueDate: string | null; expiryDate: string | null;
  documentUrl: string; notes: string; createdAt: string; updatedAt: string;
}
export interface ChecklistItem { docType: string; label: string; required: boolean; document: ExportDoc | null }

const BUYER = `id name buyerType contactPerson phone email address town country paymentTerms isVerified`;
const CONTRACT = `id commodity quantityAgreed unit agreedPrice currency totalValue status deliveryDate deliveryAddress paymentTerms depositPct depositPaid finalPaid quantityDelivered notes createdAt buyer { ${BUYER} }`;
const DOC = `id contractId docType docTypeDisplay docNumber issuingAuthority commodity quantity unit destinationCountry status statusDisplay issueDate expiryDate documentUrl notes createdAt updatedAt`;

export const TRADE_HOME_QUERY = `query TradeHome { tradeContracts { ${CONTRACT} } buyerProfiles { ${BUYER} } exportDocuments { ${DOC} } }`;
export const CHECKLIST_QUERY = `query Checklist($id: UUID!) { exportChecklist(contractId: $id) { docType label required document { ${DOC} } } }`;

export const CREATE_BUYER_MUTATION = `mutation($name: String!, $buyerType: String, $contactPerson: String, $phone: String, $email: String, $address: String, $town: String, $country: String, $paymentTerms: String) {
  createBuyerProfile(name: $name, buyerType: $buyerType, contactPerson: $contactPerson, phone: $phone, email: $email, address: $address, town: $town, country: $country, paymentTerms: $paymentTerms) { buyer { id } } }`;
export const CREATE_CONTRACT_MUTATION = `mutation($commodity: String!, $qty: Float!, $price: Float!, $buyerId: UUID, $unit: String, $deliveryDate: Date, $paymentTerms: String, $depositPct: Int) {
  createTradeContract(commodity: $commodity, quantityAgreed: $qty, agreedPrice: $price, buyerId: $buyerId, unit: $unit, deliveryDate: $deliveryDate, paymentTerms: $paymentTerms, depositPct: $depositPct) { contract { id } } }`;
export const UPDATE_CONTRACT_STATUS_MUTATION = `mutation($id: UUID!, $status: String!, $depositPaid: Boolean, $finalPaid: Boolean, $delivered: Float) {
  updateContractStatus(id: $id, status: $status, depositPaid: $depositPaid, finalPaid: $finalPaid, quantityDelivered: $delivered) { contract { id status } } }`;
export const UPDATE_CONTRACT_MUTATION = `mutation($id: UUID!, $currency: String, $deliveryAddress: String, $paymentTerms: String, $terms: String, $notes: String) {
  updateTradeContract(id: $id, currency: $currency, deliveryAddress: $deliveryAddress, paymentTerms: $paymentTerms, termsAndConditions: $terms, notes: $notes) { contract { id } } }`;
export const CONTRACT_PDF_MUTATION = `mutation($id: UUID!) { generateContractPdf(id: $id) { url } }`;
export const CREATE_DOC_MUTATION = `mutation($input: ExportDocumentInput!, $generate: Boolean) { createExportDocument(input: $input, generate: $generate) { document { ${DOC} } } }`;
export const UPDATE_DOC_MUTATION = `mutation($id: UUID!, $input: ExportDocumentInput!, $regenerate: Boolean) { updateExportDocument(id: $id, input: $input, regenerate: $regenerate) { document { ${DOC} } } }`;
export const DOC_PDF_MUTATION = `mutation($id: UUID!) { generateExportDocumentPdf(id: $id) { url document { ${DOC} } } }`;
export const EXPORT_PACK_MUTATION = `mutation($id: UUID!) { generateExportPack(contractId: $id) { created documents { ${DOC} } } }`;
export const DELETE_DOC_MUTATION = `mutation($id: UUID!) { deleteExportDocument(id: $id) { ok } }`;

/** Media files are served by the Django backend, not the Vite dev server. */
export function mediaUrl(path: string): string {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  const api = (import.meta as any).env?.VITE_API_URL as string | undefined;
  const origin = api ? api.replace(/\/graphql\/?$/, '') : '';
  return origin + path;
}
