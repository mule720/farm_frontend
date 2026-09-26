// ─────────────────────────────────────────────────────────────────────────────
// Weather & field intelligence — live data (Open-Meteo forecasts, NASA MODIS NDVI).
// ─────────────────────────────────────────────────────────────────────────────

export interface Reading { temperatureC: number | null; humidityPct: number | null; windSpeedKmh: number | null; windDirectionDeg: number | null; rainfallMm: number; pressureHpa: number | null; uvIndex: number | null; dewPointC: number | null; isAlert: boolean; alertType: string; recordedAt: string }
export interface Forecast { forecastDate: string; condition: string; tempMinC: number | null; tempMaxC: number | null; rainProbabilityPct: number; expectedRainfallMm: number; windSpeedKmh: number; farmingAdvisory: string }
export interface StationOverview { id: string; name: string; latitude: number | null; longitude: number | null; provider: string; lastSyncedAt: string | null; current: Reading | null; forecast: Forecast[] }
export interface NdviPoint { recordedAt: string; ndviValue: number; source: string; healthAssessment: string }
export interface FieldOverview { id: string; name: string; cropType: string; cropStage: string; areaHa: number; latitude: number | null; longitude: number | null; latestNdvi: number | null; latestNdviDate: string | null; health: string | null; recommendations: string[]; ndviHistory: NdviPoint[] }
export interface WeatherAlert { stationName: string; alertType: string; recordedAt: string; temperatureC: number | null; windSpeedKmh: number | null }
export interface WeatherOverview { stations: StationOverview[]; fields: FieldOverview[]; rainDays7: number; expectedRainfallMm7: number; avgMaxTempC7: number | null; alerts: WeatherAlert[] }

export const WEATHER_OVERVIEW_QUERY = `query WeatherOverview {
  weatherOverview {
    stations { id name latitude longitude provider lastSyncedAt
      current { temperatureC humidityPct windSpeedKmh windDirectionDeg rainfallMm pressureHpa uvIndex dewPointC isAlert alertType recordedAt }
      forecast { forecastDate condition tempMinC tempMaxC rainProbabilityPct expectedRainfallMm windSpeedKmh farmingAdvisory } }
    fields { id name cropType cropStage areaHa latitude longitude latestNdvi latestNdviDate health recommendations
      ndviHistory { recordedAt ndviValue source healthAssessment } }
    rainDays7 expectedRainfallMm7 avgMaxTempC7
    alerts { stationName alertType recordedAt temperatureC windSpeedKmh }
  }
}`;

export const SYNC_WEATHER_NOW_MUTATION = `mutation { syncWeatherNow { stations forecastDays fields ndviRecords errors } }`;
export const SYNC_STATION_MUTATION = `mutation($id: UUID!) { syncStationForecast(stationId: $id) { forecastDays } }`;
export const SYNC_FIELD_NDVI_MUTATION = `mutation($id: UUID!) { syncFieldNdvi(fieldId: $id) { newRecords } }`;
export const CREATE_STATION_MUTATION = `mutation($name: String!, $lat: Float, $lon: Float, $provider: String) { createWeatherStation(name: $name, latitude: $lat, longitude: $lon, provider: $provider) { station { id } } }`;
export const DELETE_STATION_MUTATION = `mutation($id: UUID!) { deleteWeatherStation(stationId: $id) { ok } }`;
export const CREATE_FIELD_MUTATION = `mutation($name: String!, $crop: String, $stage: String, $area: Float, $lat: Float, $lon: Float, $station: UUID) { createFarmField(name: $name, cropType: $crop, cropStage: $stage, areaHa: $area, latitude: $lat, longitude: $lon, nearestStationId: $station) { field { id } } }`;
export const DELETE_FIELD_MUTATION = `mutation($id: UUID!) { deleteFarmField(fieldId: $id) { ok } }`;
