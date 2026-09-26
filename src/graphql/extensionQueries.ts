// ─────────────────────────────────────────────────────────────────────────────
// Extension officer — GraphQL documents + types.
// ─────────────────────────────────────────────────────────────────────────────

export interface CaseloadFarm {
  farmId: string; name: string; province: string; district: string;
  directorName: string | null; directorPhone: string | null;
  enterprises: number; enterpriseCategories: string[]; activeBatches: number;
  openAlerts: number; criticalAlerts: number; unresolvedReports: number; severeDiagnoses30d: number;
  records30d: number; lastVisitDate: string | null; nextFollowUp: string | null; followUpOverdue: boolean;
  priorityScore: number; assignedAt: string;
}
export interface AvailableFarm { farmId: string; name: string; province: string; district: string; enterprises: number; unresolvedReports: number; consentedAt: string | null }
export interface FarmReport { id: string; category: string; title: string; description: string; cropOrAnimal: string; severity: string | null; diagnosis: string | null; isResolved: boolean; resolutionNotes: string; createdAt: string }
export interface FarmDiagnosis { id: string; analysisType: string; diagnosis: string; severity: string; confidencePct: number; createdAt: string }
export interface FarmAlert { id: string; source: string; severity: string; title: string; isResolved: boolean; createdAt: string }
export interface FarmEnterprise { id: string; name: string; category: string; productionType: string; activeBatches: number }
export interface ExtVisit {
  id: string; farmId: string; farmName: string; officerName: string; visitDate: string; visitType: string; purpose: string;
  findings: string; recommendations: string; followUpDate: string | null; followUpDone: boolean; createdAt: string;
}
export interface FarmDetail { summary: CaseloadFarm; enterprises: FarmEnterprise[]; reports: FarmReport[]; diagnoses: FarmDiagnosis[]; alerts: FarmAlert[]; visits: ExtVisit[] }
export interface ExtOverview { caseloadSize: number; farmsAvailable: number; farmsNeedingAttention: number; followUpsOverdue: number; followUpsThisWeek: number; visits30d: number; unresolvedReports: number; workingArea: string }
export interface Officer { id: string; fullName: string; phone: string; email: string; organizationName: string | null; assignedAt: string }

const CASELOAD_FIELDS = `farmId name province district directorName directorPhone enterprises enterpriseCategories activeBatches
  openAlerts criticalAlerts unresolvedReports severeDiagnoses30d records30d lastVisitDate nextFollowUp followUpOverdue priorityScore assignedAt`;
const VISIT_FIELDS = `id farmId farmName officerName visitDate visitType purpose findings recommendations followUpDate followUpDone createdAt`;

export const EXT_HOME_QUERY = `
query ExtHome {
  extensionOverview { caseloadSize farmsAvailable farmsNeedingAttention followUpsOverdue followUpsThisWeek visits30d unresolvedReports workingArea }
  extensionCaseload { ${CASELOAD_FIELDS} }
}`;
export const EXT_AVAILABLE_QUERY = `query ExtAvailable($search: String) { extensionAvailableFarms(search: $search) { farmId name province district enterprises unresolvedReports consentedAt } }`;
export const EXT_FARM_DETAIL_QUERY = `
query ExtFarm($id: ID!) {
  extensionFarmDetail(farmId: $id) {
    summary { ${CASELOAD_FIELDS} }
    enterprises { id name category productionType activeBatches }
    reports { id category title description cropOrAnimal severity diagnosis isResolved resolutionNotes createdAt }
    diagnoses { id analysisType diagnosis severity confidencePct createdAt }
    alerts { id source severity title isResolved createdAt }
    visits { ${VISIT_FIELDS} }
  }
}`;
export const EXT_VISITS_QUERY = `query ExtVisits($pending: Boolean) { extensionVisits(pendingFollowUp: $pending) { ${VISIT_FIELDS} } }`;

export const ASSIGN_FARM_MUTATION = `mutation Assign($id: ID!) { assignCaseloadFarm(farmId: $id) { farm { farmId name } } }`;
export const REMOVE_FARM_MUTATION = `mutation Remove($id: ID!) { removeCaseloadFarm(farmId: $id) { ok } }`;
export const LOG_VISIT_MUTATION = `mutation LogVisit($input: VisitInput!) { logExtensionVisit(input: $input) { visit { ${VISIT_FIELDS} } } }`;
export const COMPLETE_FOLLOW_UP_MUTATION = `mutation Done($id: ID!) { completeFollowUp(visitId: $id) { visit { id followUpDone } } }`;
export const RESOLVE_REPORT_MUTATION = `mutation Resolve($id: ID!, $notes: String!) { resolveFarmerReport(reportId: $id, resolutionNotes: $notes) { report { id isResolved resolutionNotes } } }`;
export const SEND_ADVICE_MUTATION = `mutation Advice($id: ID!, $title: String!, $message: String!, $priority: String) { sendFarmAdvice(farmId: $id, title: $title, message: $message, priority: $priority) { recipients } }`;

// Farmer-facing
export const MY_EXTENSION_QUERY = `
query MyExtension {
  myExtensionOfficers { id fullName phone email organizationName assignedAt }
  myExtensionVisits { ${VISIT_FIELDS} }
}`;
