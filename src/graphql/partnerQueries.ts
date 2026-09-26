// ─────────────────────────────────────────────────────────────────────────────
// Supporting partner (FAO / donor / NGO) programmes — GraphQL documents + types.
// ─────────────────────────────────────────────────────────────────────────────

export interface Indicator { key: string; label: string; unit: string; target: number | null }
export interface IndicatorStatus extends Indicator { baseline: number | null; latestValue: number | null; latestPeriod: string | null; progressPct: number | null; autoSource: string; breakdown: any }
export interface ResultNode { id: string; parentId: string | null; level: 'goal' | 'outcome' | 'output' | 'activity'; code: string; statement: string; assumptions: string; order: number }
export interface LogframeIndicator { id: string; resultId: string | null; key: string; label: string; unit: string; baseline: number | null; baselineDate: string | null; target: number | null; targetDate: string | null; meansOfVerification: string; dataSource: string; disaggregations: string[]; autoSource: string; order: number; value: number | null; period: string | null; progressPct: number | null; breakdown: any }
export interface ParticipantProfile { organizationId: string; headSex: string | null; headBirthYear: number | null; headAge: number | null; householdSize: number | null; femaleMembers: number | null; maleMembers: number | null; youthLed: boolean | null; isYouth: boolean; disability: boolean; landHa: number | null; hasNationalId: boolean; updatedAt: string }
export interface ProgrammeResults {
  farmsEnrolled: number; farmsActive: number; districts: number; enterprises: number; activeBatches: number;
  recordsSinceStart: number; harvestRecordsSinceStart: number; harvestQuantitySinceStart: number;
  reportsResolvedSinceStart: number; reportsOpen: number; supportEvents: number; supportValue: number;
  farmsSupported: number; budgetUsedPct: number; enrolmentPct: number; marketListings: number; contractsFulfilled: number; participantsByType: any;
  participantsWomen: number; participantsMen: number; participantsYouth: number; participantsDisability: number; participantsWithProfile: number; householdsReached: number; participantsBySex: any; participantsByAge: any;
}
export interface Programme {
  id: string; name: string; code: string; description: string; funder: string; status: string;
  startDate: string; endDate: string | null; budget: number; currency: string;
  targetProvinces: string[]; targetDistricts: string[]; targetEnterpriseCategories: string[]; targetParticipantTypes: string[]; targetFarms: number;
  indicators: Indicator[]; results: ProgrammeResults; indicatorStatus: IndicatorStatus[]; organizationName: string;
}
export interface EnrolledFarm {
  enrollmentId: string; farmId: string; name: string; businessType: string; marketListings: number; contractsFulfilled: number; province: string; district: string; status: string; cohort: string;
  enrolledAt: string; enterprises: number; enterpriseCategories: string[]; recordsSinceStart: number;
  harvestQuantitySinceStart: number; supportEvents: number; supportValue: number;
  headSex: string | null; headAge: number | null; isYouth: boolean | null; householdSize: number | null; hasProfile: boolean;
}
export interface EligibleFarm { farmId: string; name: string; businessType: string; province: string; district: string; enterprises: number; enterpriseCategories: string[] }
export interface Support { id: string; farmId: string; farmName: string; programmeName: string; supportType: string; description: string; quantity: number; unit: string; value: number; currency: string; deliveredOn: string; reference: string }
export interface SupportByType { supportType: string; events: number; farms: number; value: number }
export interface ProgrammeDistrict { province: string; district: string; farms: number; recordsSinceStart: number; harvestQuantitySinceStart: number; supportValue: number }
export interface IndicatorReading { id: string; indicatorKey: string; period: string; value: number; notes: string; recordedByName: string | null; disaggregation: any }
export interface PartnerOverview { programmes: number; activeProgrammes: number; farmsEnrolled: number; totalBudget: number; supportValue: number; districtsReached: number }
export interface MyProgramme { programmeId: string; name: string; partnerName: string; funder: string; status: string; cohort: string; enrolledAt: string; support: Support[] }

const RESULTS = `results { farmsEnrolled farmsActive districts enterprises activeBatches recordsSinceStart harvestRecordsSinceStart
  harvestQuantitySinceStart reportsResolvedSinceStart reportsOpen supportEvents supportValue farmsSupported budgetUsedPct enrolmentPct marketListings contractsFulfilled participantsByType
  participantsWomen participantsMen participantsYouth participantsDisability participantsWithProfile householdsReached participantsBySex participantsByAge }`;
const PROG = `id name code description funder status startDate endDate budget currency targetProvinces targetDistricts
  targetEnterpriseCategories targetParticipantTypes targetFarms indicators { key label unit target } organizationName ${RESULTS}
  indicatorStatus { key label unit baseline target latestValue latestPeriod progressPct autoSource breakdown }`;
const SUPPORT = `id farmId farmName programmeName supportType description quantity unit value currency deliveredOn reference`;

export const PARTNER_HOME_QUERY = `query PartnerHome {
  partnerOverview { programmes activeProgrammes farmsEnrolled totalBudget supportValue districtsReached }
  partnerProgrammes { ${PROG} }
}`;
export const PROGRAMME_QUERY = `query Programme($id: ID!) {
  partnerProgramme(id: $id) { ${PROG} }
  programmeEnrolledFarms(programmeId: $id) { enrollmentId farmId name businessType marketListings contractsFulfilled province district status cohort enrolledAt enterprises enterpriseCategories recordsSinceStart harvestQuantitySinceStart supportEvents supportValue headSex headAge isYouth householdSize hasProfile }
  programmeSupport(programmeId: $id) { ${SUPPORT} }
  programmeSupportByType(programmeId: $id) { supportType events farms value }
  programmeDistricts(programmeId: $id) { province district farms recordsSinceStart harvestQuantitySinceStart supportValue }
  programmeIndicatorReadings(programmeId: $id) { id indicatorKey period value notes recordedByName disaggregation }
}`;
export const ELIGIBLE_QUERY = `query Eligible($id: ID!, $search: String, $district: String) { programmeEligibleFarms(programmeId: $id, search: $search, district: $district) { farmId name businessType province district enterprises enterpriseCategories } }`;

export const CREATE_PROGRAMME_MUTATION = `mutation Create($input: ProgrammeInput!) { createProgramme(input: $input) { programme { id } } }`;
export const UPDATE_PROGRAMME_MUTATION = `mutation Update($id: ID!, $input: ProgrammeInput!) { updateProgramme(id: $id, input: $input) { programme { id status } } }`;
export const ENROLL_FARM_MUTATION = `mutation Enroll($p: ID!, $f: ID!, $c: String) { enrollFarm(programmeId: $p, farmId: $f, cohort: $c) { enrollmentId } }`;
export const UPDATE_ENROLLMENT_MUTATION = `mutation UpdEnr($e: ID!, $status: String) { updateEnrollment(enrollmentId: $e, status: $status) { ok } }`;
export const RECORD_SUPPORT_MUTATION = `mutation Support($input: SupportInput!) { recordSupport(input: $input) { support { id } } }`;
export const RECORD_READING_MUTATION = `mutation Reading($p: ID!, $k: String!, $d: Date!, $v: Float!, $n: String, $dis: JSONString) { recordIndicatorReading(programmeId: $p, indicatorKey: $k, period: $d, value: $v, notes: $n, disaggregation: $dis) { reading { id } } }`;
const LF_IND = `id resultId key label unit baseline baselineDate target targetDate meansOfVerification dataSource disaggregations autoSource order value period progressPct breakdown`;
export const LOGFRAME_QUERY = `query Logframe($p: ID!) { programmeLogframe(programmeId: $p) { results { id parentId level code statement assumptions order } indicators { ${LF_IND} } autoSources } }`;
export const UPSERT_RESULT_MUTATION = `mutation UpsertResult($p: ID!, $id: ID, $in: ResultInput!) { upsertResult(programmeId: $p, id: $id, input: $in) { result { id } } }`;
export const DELETE_RESULT_MUTATION = `mutation DeleteResult($id: ID!) { deleteResult(id: $id) { ok } }`;
export const UPSERT_INDICATOR_MUTATION = `mutation UpsertIndicator($p: ID!, $id: ID, $in: LogframeIndicatorInput!) { upsertIndicator(programmeId: $p, id: $id, input: $in) { indicator { id } } }`;
export const DELETE_INDICATOR_MUTATION = `mutation DeleteIndicator($id: ID!) { deleteIndicator(id: $id) { ok } }`;
const PROFILE = `organizationId headSex headBirthYear headAge householdSize femaleMembers maleMembers youthLed isYouth disability landHa hasNationalId updatedAt`;
export const SET_PROFILE_MUTATION = `mutation SetProfile($o: ID, $in: ParticipantProfileInput!) { setParticipantProfile(organizationId: $o, input: $in) { profile { ${PROFILE} } } }`;
export const MY_PROFILE_QUERY = `query MyProfile { myParticipantProfile { ${PROFILE} } }`;
export const PROGRAMME_REPORT_MUTATION = `mutation Report($p: ID!, $f: String, $s: Date, $e: Date) { generateProgrammeReport(programmeId: $p, format: $f, periodStart: $s, periodEnd: $e) { url } }`;
export const SEND_NOTICE_MUTATION = `mutation Notice($p: ID!, $title: String!, $message: String!, $priority: String) { sendProgrammeNotice(programmeId: $p, title: $title, message: $message, priority: $priority) { farms recipients } }`;

// Farmer-facing
export const MY_PROGRAMMES_QUERY = `query MyProgrammes { myProgrammes { programmeId name partnerName funder status cohort enrolledAt support { ${SUPPORT} } } }`;
