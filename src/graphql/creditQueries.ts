// ─────────────────────────────────────────────────────────────────────────────
// Farm credit summary + lender sharing — GraphQL documents + types.
// ─────────────────────────────────────────────────────────────────────────────

export interface CreditFactor { key: string; label: string; weight: number; score: number; evidence: string }
export interface CreditSummary {
  generated_at: string; as_of: string;
  farm: { name: string; province: string; district: string; country: string; member_since: string; tenure_months: number; enterprises: string[]; enterprise_count: number; area_ha: number };
  score: number; band: string; band_label: string; thin_file: boolean; factors: CreditFactor[];
  records: { records_12m: number; active_months_12: number; days_since_last_record: number | null; batches_total: number; batches_completed: number };
  financials: { revenue_12m: number; costs_12m: number; profit_12m: number; roi_pct_12m: number | null; margin_pct_12m: number | null; revenue_lifetime: number; costs_lifetime: number; profitable_batches: number; scored_batches: number; basis?: 'ledger' | 'batches'; revenue_trend_pct: number | null; monthly_revenue: { month: string; revenue: number }[] };
  trading: { contracts_fulfilled: number; contracts_open: number; contracts_disputed: number; fulfilled_value: number; fulfilment_rate_pct: number | null; verified_buyers: number; active_listings: number };
  verification: { data_sharing_consent: boolean; extension_officer: boolean; extension_visits_12m: number; programmes: { name: string; partner: string; status: string }[]; support_value: number; certifications: string[]; insurance_active: boolean; loans: { lender: string; type: string; status: string; requested: number; approved: number }[] };
  shared_with?: { lender: string; purpose: string; expires_at: string };
}
export interface ShareGrant { id: string; lenderName: string; lenderContact: string; purpose: string; token: string; expiresAt: string; isRevoked: boolean; isActive: boolean; accessCount: number; lastAccessedAt: string | null; createdAt: string; shareUrlPath: string }

export function parseSummary(raw: any): CreditSummary {
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

const GRANT = `id lenderName lenderContact purpose token expiresAt isRevoked isActive accessCount lastAccessedAt createdAt shareUrlPath`;

export const MY_CREDIT_QUERY = `query MyCredit { myCreditSummary { score band bandLabel thinFile summary } creditShareGrants { ${GRANT} } }`;
export const LENDER_REPORT_QUERY = `query Lender($t: String!) { lenderCreditReport(token: $t) { score band bandLabel thinFile summary } }`;
export const CREATE_SHARE_MUTATION = `mutation($n: String!, $c: String, $p: String, $d: Int) { createCreditShareGrant(lenderName: $n, lenderContact: $c, purpose: $p, validDays: $d) { grant { ${GRANT} } } }`;
export const REVOKE_SHARE_MUTATION = `mutation($id: UUID!) { revokeCreditShareGrant(id: $id) { ok } }`;
export const CREDIT_PDF_MUTATION = `mutation($l: String) { generateCreditSummaryPdf(forLender: $l) { url } }`;
