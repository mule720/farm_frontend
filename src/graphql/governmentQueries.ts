// ─────────────────────────────────────────────────────────────────────────────
// Government & partner dashboard — GraphQL documents + types.
// Every query is de-identified: counts and sums only, never a farm name.
// ─────────────────────────────────────────────────────────────────────────────

export interface GovOverview {
  farmsReporting: number; farmsEligible: number;
  provincesCovered: number; districtsCovered: number;
  totalEnterprises: number; activeBatches: number;
  records30d: number; harvestRecords30d: number; harvestQuantity30d: number;
  openCriticalAlerts: number; unresolvedReports: number; activeListings: number;
}
export interface GovDistrictRow {
  province: string; district: string; farms: number; enterprises: number;
  activeBatches: number; records30d: number; openAlerts: number; unresolvedReports: number;
}
export interface GovMixRow { category: string; enterprises: number; activeBatches: number; farms: number }
export interface GovTrendPoint { label: string; weekStart: string; records: number; harvestRecords: number; harvestQuantity: number; reports: number }
export interface GovPriceRow {
  commodity: string; unit: string; currency: string; latestPrice: number; latestDate: string | null;
  avgPrice30d: number; minPrice30d: number; maxPrice30d: number; samples30d: number;
}
export interface GovSupplyRow { commodity: string; unit: string; listings: number; farms: number; quantityAvailable: number; avgAskingPrice: number }
export interface GovHotspot { province: string; district: string; category: string; reports: number; farms: number }
export interface GovSeverity { analysisType: string; severity: string; count: number }
export interface GovSustainability {
  carbonEmissionsKg: number; carbonOffsetsKg: number; carbonEntries: number;
  waterVolumeM3: number; waterEntries: number; farmsWithCertifications: number; activeCertifications: number;
}
export interface GovFilters { provinces: string[]; districts: { province: string; district: string; farms: number }[] }
export interface Advisory {
  id: string; title: string; message: string; category: string; priority: string;
  province: string; district: string; enterpriseCategory: string;
  farmsReached: number; recipientsReached: number; createdAt: string; issuedByName: string | null;
}

export interface GovDashboardData {
  govOverview: GovOverview;
  govDistrictSummary: GovDistrictRow[];
  govEnterpriseMix: GovMixRow[];
  govProductionTrend: GovTrendPoint[];
  govCommodityPrices: GovPriceRow[];
  govMarketSupply: GovSupplyRow[];
  govHotspots: GovHotspot[];
  govDiagnosisSeverity: GovSeverity[];
  govSustainability: GovSustainability;
}

export const GOV_FILTERS_QUERY = `query GovFilters { govFilters { provinces districts { province district farms } } }`;

export const GOV_DASHBOARD_QUERY = `
query GovDashboard($province: String, $district: String) {
  govOverview(province: $province, district: $district) {
    farmsReporting farmsEligible provincesCovered districtsCovered
    totalEnterprises activeBatches records30d harvestRecords30d harvestQuantity30d
    openCriticalAlerts unresolvedReports activeListings
  }
  govDistrictSummary(province: $province, district: $district) {
    province district farms enterprises activeBatches records30d openAlerts unresolvedReports
  }
  govEnterpriseMix(province: $province, district: $district) { category enterprises activeBatches farms }
  govProductionTrend(weeks: 12, province: $province, district: $district) {
    label weekStart records harvestRecords harvestQuantity reports
  }
  govCommodityPrices(province: $province, district: $district) {
    commodity unit currency latestPrice latestDate avgPrice30d minPrice30d maxPrice30d samples30d
  }
  govMarketSupply(province: $province, district: $district) {
    commodity unit listings farms quantityAvailable avgAskingPrice
  }
  govHotspots(days: 90, province: $province, district: $district) { province district category reports farms }
  govDiagnosisSeverity(days: 90, province: $province, district: $district) { analysisType severity count }
  govSustainability(province: $province, district: $district) {
    carbonEmissionsKg carbonOffsetsKg carbonEntries waterVolumeM3 waterEntries
    farmsWithCertifications activeCertifications
  }
}`;

export const GOV_ADVISORIES_QUERY = `
query GovAdvisories {
  govAdvisories {
    id title message category priority province district enterpriseCategory
    farmsReached recipientsReached createdAt issuedByName
  }
}`;

export const ISSUE_ADVISORY_MUTATION = `
mutation IssueAdvisory($input: AdvisoryInput!) {
  issueAdvisory(input: $input) {
    advisory { id title farmsReached recipientsReached createdAt }
  }
}`;

export const SET_CONSENT_MUTATION = `
mutation SetConsent($consent: Boolean!) {
  setDataSharingConsent(consent: $consent) {
    organization { id dataSharingConsent dataSharingConsentedAt province district }
  }
}`;

export const MY_ORG_QUERY = `query MyOrg { organization { id name orgType province district dataSharingConsent dataSharingConsentedAt } }`;

export const UPDATE_ORG_LOCATION_MUTATION = `
mutation UpdateOrgLocation($input: UpdateOrganizationInput!) {
  updateOrganization(input: $input) { organization { id province district } }
}`;
