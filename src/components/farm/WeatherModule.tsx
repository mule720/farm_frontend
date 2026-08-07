import React, { useState } from 'react';
import { Cloud, Sun, CloudRain, Thermometer, Wind, Droplets, AlertTriangle, Satellite, MapPin } from 'lucide-react';

interface DayForecast {
  date: string;
  day: string;
  condition: string;
  temp_min: number;
  temp_max: number;
  rain_pct: number;
  rainfall_mm: number;
  advisory: string;
}

const FORECAST: DayForecast[] = [
  { date: '2026-06-05', day: 'Today', condition: 'partly_cloudy', temp_min: 12, temp_max: 24, rain_pct: 15, rainfall_mm: 0, advisory: 'Good day for field operations. Low rain risk.' },
  { date: '2026-06-06', day: 'Sat', condition: 'light_rain', temp_min: 10, temp_max: 20, rain_pct: 65, rainfall_mm: 8, advisory: 'Light rain expected. Hold off on spraying.' },
  { date: '2026-06-07', day: 'Sun', condition: 'heavy_rain', temp_min: 9, temp_max: 18, rain_pct: 85, rainfall_mm: 22, advisory: 'Heavy rain. Ensure drainage is clear.' },
  { date: '2026-06-08', day: 'Mon', condition: 'cloudy', temp_min: 11, temp_max: 21, rain_pct: 30, rainfall_mm: 2, advisory: 'Cloudy. Suitable for transplanting seedlings.' },
  { date: '2026-06-09', day: 'Tue', condition: 'sunny', temp_min: 14, temp_max: 27, rain_pct: 5, rainfall_mm: 0, advisory: 'Sunny and warm. Good for drying and harvesting.' },
  { date: '2026-06-10', day: 'Wed', condition: 'sunny', temp_min: 15, temp_max: 28, rain_pct: 5, rainfall_mm: 0, advisory: 'Clear skies. Irrigate morning/evening to reduce evaporation.' },
  { date: '2026-06-11', day: 'Thu', condition: 'partly_cloudy', temp_min: 13, temp_max: 25, rain_pct: 20, rainfall_mm: 1, advisory: 'Mild day. Good for planting and fertilizing.' },
];

const CONDITION_ICONS: Record<string, React.ReactNode> = {
  sunny: <Sun className="w-6 h-6 text-amber-400" />,
  partly_cloudy: <Cloud className="w-6 h-6 text-slate-400" />,
  cloudy: <Cloud className="w-6 h-6 text-slate-500" />,
  light_rain: <CloudRain className="w-6 h-6 text-blue-400" />,
  heavy_rain: <CloudRain className="w-6 h-6 text-blue-600" />,
  thunderstorm: <CloudRain className="w-6 h-6 text-purple-600" />,
};

interface FieldNDVI {
  name: string;
  crop: string;
  area_ha: number;
  ndvi: number;
  health: string;
  stage: string;
  date: string;
}

const NDVI_FIELDS: FieldNDVI[] = [
  { name: 'Field A', crop: 'Maize', area_ha: 2.5, ndvi: 0.72, health: 'Excellent', stage: 'Vegetative', date: '2026-06-01' },
  { name: 'Field B', crop: 'Tomatoes', area_ha: 1.2, ndvi: 0.58, health: 'Good', stage: 'Flowering', date: '2026-06-01' },
  { name: 'Field C', crop: 'Soybeans', area_ha: 3.0, ndvi: 0.41, health: 'Fair', stage: 'Vegetative', date: '2026-06-01' },
  { name: 'Orchard', crop: 'Citrus', area_ha: 3.8, ndvi: 0.63, health: 'Good', stage: 'Fruiting', date: '2026-06-01' },
];

function ndviColor(v: number) {
  if (v >= 0.65) return 'bg-green-500';
  if (v >= 0.45) return 'bg-lime-400';
  if (v >= 0.30) return 'bg-yellow-400';
  return 'bg-red-400';
}

function ndviLabel(v: number) {
  if (v >= 0.65) return { label: 'Excellent', cls: 'bg-green-100 text-green-700' };
  if (v >= 0.45) return { label: 'Good', cls: 'bg-lime-100 text-lime-700' };
  if (v >= 0.30) return { label: 'Fair', cls: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Poor', cls: 'bg-red-100 text-red-700' };
}

export default function WeatherModule() {
  const [tab, setTab] = useState<'forecast' | 'current' | 'ndvi' | 'stations'>('forecast');

  const rainDays = FORECAST.filter(f => f.rain_pct > 50).length;
  const totalRain = FORECAST.reduce((s, f) => s + f.rainfall_mm, 0);
  const today = FORECAST[0];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Cloud className="w-6 h-6 text-sky-500" /> Weather & Field Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-1">7-day forecast, NDVI satellite maps & farming advisories</p>
        </div>
      </div>

      {/* Today summary card */}
      <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium opacity-80">Today — Lusaka Farm</div>
            <div className="text-5xl font-bold mt-1">{today.temp_max}°C</div>
            <div className="text-sm opacity-80 mt-1">Low {today.temp_min}°C · {today.condition.replace('_', ' ')}</div>
          </div>
          <div className="text-right">
            <div className="opacity-90 mb-3">{CONDITION_ICONS[today.condition] && React.cloneElement(CONDITION_ICONS[today.condition] as React.ReactElement, { className: 'w-14 h-14 text-white ml-auto' })}</div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1"><Droplets className="w-4 h-4 opacity-80" />{today.rain_pct}%</div>
              <div className="flex items-center gap-1"><Wind className="w-4 h-4 opacity-80" />12 km/h</div>
              <div className="flex items-center gap-1"><Thermometer className="w-4 h-4 opacity-80" />58% humidity</div>
            </div>
          </div>
        </div>
        <div className="mt-4 bg-white bg-opacity-20 rounded-xl p-3 text-sm">
          <span className="font-semibold">Farm Advisory:</span> {today.advisory}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Rain days (7d)', value: rainDays, icon: CloudRain, color: 'blue' },
          { label: 'Expected rainfall', value: `${totalRain} mm`, icon: Droplets, color: 'sky' },
          { label: 'Avg max temp', value: `${Math.round(FORECAST.reduce((s, f) => s + f.temp_max, 0) / FORECAST.length)}°C`, icon: Thermometer, color: 'orange' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 bg-${color}-50 rounded-lg flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-lg">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['forecast', 'current', 'ndvi', 'stations'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t}</button>
        ))}
      </div>

      {tab === 'forecast' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">7-Day Forecast & Advisories</h3>
          <div className="grid grid-cols-7 gap-2">
            {FORECAST.map((day, i) => (
              <div key={i} className={`rounded-xl p-3 text-center space-y-2 ${i === 0 ? 'bg-sky-50 border border-sky-200' : 'bg-slate-50'}`}>
                <div className="text-xs font-semibold text-slate-600">{day.day}</div>
                <div className="flex justify-center">{CONDITION_ICONS[day.condition]}</div>
                <div className="text-sm font-bold text-slate-900">{day.temp_max}°</div>
                <div className="text-xs text-slate-500">{day.temp_min}°</div>
                {day.rain_pct > 0 && (
                  <div className={`text-xs px-1 py-0.5 rounded-full ${day.rain_pct > 50 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    {day.rain_pct}%
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {FORECAST.filter(f => f.rain_pct > 40).map((day, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                <span><strong>{day.day}:</strong> {day.advisory}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'current' && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Temperature', value: '22°C', sub: 'Feels like 20°C', icon: Thermometer, color: 'orange' },
            { label: 'Humidity', value: '58%', sub: 'Comfortable', icon: Droplets, color: 'sky' },
            { label: 'Wind Speed', value: '12 km/h', sub: 'NE direction', icon: Wind, color: 'slate' },
            { label: 'UV Index', value: '4 — Moderate', sub: 'Wear sunscreen if outdoors', icon: Sun, color: 'amber' },
            { label: 'Rainfall (today)', value: '0 mm', sub: 'MTD: 18 mm', icon: CloudRain, color: 'blue' },
            { label: 'Soil Temp (10cm)', value: '19°C', sub: 'Good for germination', icon: Thermometer, color: 'green' },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className={`w-12 h-12 bg-${color}-50 rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-6 h-6 text-${color}-600`} />
              </div>
              <div>
                <div className="text-xs text-slate-500">{label}</div>
                <div className="font-bold text-slate-900">{value}</div>
                <div className="text-xs text-slate-400">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'ndvi' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Satellite className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-slate-900">Satellite NDVI Field Map</h3>
              <span className="ml-auto text-xs text-slate-400">Last scan: 2026-06-01 · Source: Sentinel-2</span>
            </div>
            <div className="bg-slate-100 rounded-xl h-40 flex items-center justify-center text-sm text-slate-400">
              [NDVI Map visualization — connect drone/satellite API]
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-400 rounded" />Poor (&lt;0.3)</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-400 rounded" />Fair (0.3–0.45)</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-lime-400 rounded" />Good (0.45–0.65)</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded" />Excellent (&gt;0.65)</div>
            </div>
          </div>
          <div className="space-y-3">
            {NDVI_FIELDS.map((field, i) => {
              const { label, cls } = ndviLabel(field.ndvi);
              return (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{field.name} — {field.crop}</div>
                      <div className="text-xs text-slate-500">{field.area_ha} ha · {field.stage} · Scanned {field.date}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>NDVI Score</span>
                      <span className="font-semibold">{field.ndvi.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${ndviColor(field.ndvi)}`} style={{ width: `${field.ndvi * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'stations' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><MapPin className="w-4 h-4" /> Weather Stations</h3>
            <button className="flex items-center gap-1 text-sm text-sky-600 font-medium">+ Add Station</button>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Main Station (Farm HQ)', provider: 'Davis Instruments', temp: '22°C', humidity: '58%', rain: '0 mm', wind: '12 km/h', status: 'online' },
              { name: 'Field A Remote Sensor', provider: 'In-house IoT', temp: '21°C', humidity: '61%', rain: '0 mm', wind: '8 km/h', status: 'online' },
              { name: 'OpenWeather API', provider: 'OpenWeatherMap', temp: '22°C', humidity: '57%', rain: '0 mm', wind: '14 km/h', status: 'online' },
            ].map((station, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm text-slate-900">{station.name}</div>
                  <div className="text-xs text-slate-500">{station.provider}</div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span>{station.temp}</span>
                  <span>{station.humidity}</span>
                  <span>{station.rain}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" />{station.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
