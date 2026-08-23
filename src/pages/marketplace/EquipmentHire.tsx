import React from 'react';
import { ProviderShell, Provider, ProviderDirectoryConfig } from './ProviderDirectory';

const MOCK_HIRE: Provider[] = [
  {
    id: 'eh-1', providerType: 'equipment_hire',
    name: 'FarmMech Services',
    tagline: 'Tractors, disc ploughs & land preparation — Central Province',
    description: 'Professional farm mechanisation hire. New Holland and Massey Ferguson tractors. Disc ploughing, harrowing, ripping, ridging, and planting available. Operators provided. Minimum 4 hours.',
    phone: '+260 966 240004', email: 'hire@farmmech.zm',
    location: 'Chisamba, Central Province', districts: ['Central', 'Lusaka', 'Mkushi'],
    operatingHours: 'Jun–Dec: Daily 06:00–18:00 | Jan–May: Limited availability',
    verified: true, certified: true, ratingAvg: 4.7, ratingCount: 58, active: true, mine: false,
    tags: ['Tractor Hire', 'Operator Included', 'Disc Plough', 'Harrowing', 'Ridging'],
    specialties: ['Land Preparation', 'Planting', 'Crop Establishment'],
    coverageType: 'mobile',
    services: [
      { id: 'fms1', name: 'Disc Ploughing', description: 'New Holland T6 tractor + disc plough. Per hectare rate includes fuel and operator.', price: 550, unit: 'per ha', category: 'Land Prep', available: true },
      { id: 'fms2', name: 'Disc Harrowing', description: '2-pass disc harrow finishing. Good seedbed preparation.', price: 350, unit: 'per ha', category: 'Land Prep', available: true },
      { id: 'fms3', name: 'Subsoil Ripping', description: 'Deep ripping 40–50cm. Breaks hardpan. Single pass.', price: 700, unit: 'per ha', category: 'Land Prep', available: true },
      { id: 'fms4', name: 'Ridging', description: 'Tied ridges for conservation farming. Per ha rate.', price: 400, unit: 'per ha', category: 'Conservation', available: true },
      { id: 'fms5', name: 'Tractor + Trailer Hire', description: '5-ton trailer for produce transport or material haulage.', price: 850, unit: 'per day', category: 'Transport', available: true },
    ],
    reviews: [
      { id: 'fmr1', reviewerName: 'KwaZuma Farms', rating: 5, comment: 'Excellent work rate, ploughed 40ha in 3 days. Operators are skilled.', serviceUsed: 'Disc Ploughing', createdAt: '2026-07-01T08:00:00Z' },
      { id: 'fmr2', reviewerName: 'Central Grain Co', rating: 4, comment: 'Good quality, arrived 1 day late but communicated well.', serviceUsed: 'Disc Harrowing', createdAt: '2026-06-15T09:00:00Z' },
    ],
    certifications: [
      { body: 'ZAFFICO', certNumber: 'ZAF-MECH-2024-011', certType: 'Farm Machinery Operator Licence' },
    ],
    licenseNumber: 'MVL-2024-05588',
    createdAt: '2023-08-01T00:00:00Z',
  },
  {
    id: 'eh-2', providerType: 'equipment_hire',
    name: 'AgroDrone Zambia',
    tagline: 'Precision aerial spraying — GPS-mapped, licensed operators',
    description: 'ZCAA-licensed drone operators for crop spraying, field mapping, and multispectral imagery. DJI Agras T40 — 40L tank, 8ha/hour. Available nationwide with 48-hour advance booking.',
    phone: '+260 955 250005', email: 'spray@agrodrone.zm', website: 'www.agrodronezm.com',
    location: 'Lusaka, Lusaka Province', districts: ['Lusaka', 'Central', 'Southern', 'Eastern', 'Copperbelt'],
    operatingHours: 'Daily 05:30–10:00 & 15:00–18:30 (optimal spray windows)',
    verified: true, certified: true, ratingAvg: 4.9, ratingCount: 41, active: true, mine: false,
    tags: ['ZCAA Licensed', 'GPS Mapping', 'DJI Agras T40', 'Nationwide', 'Precision Spray'],
    specialties: ['Crop Spraying', 'Field Mapping', 'NDVI Imaging'],
    coverageType: 'mobile',
    services: [
      { id: 'ads1', name: 'Aerial Crop Spraying', description: 'DJI Agras T40, 40L tank. Client provides chemical. GPS-mapped flight path. ~8ha/hour.', price: 180, unit: 'per ha', category: 'Spraying', available: true },
      { id: 'ads2', name: 'Field Boundary Mapping', description: 'GPS drone survey — field boundary + area measurement. KML/shapefile output.', price: 1200, unit: 'per farm (up to 20ha)', category: 'Mapping', available: true },
      { id: 'ads3', name: 'NDVI Crop Health Imagery', description: 'Multispectral map showing crop health variability. Ideal for variable-rate application.', price: 2500, unit: 'per 20ha', category: 'Mapping', available: true },
    ],
    reviews: [
      { id: 'adr1', reviewerName: 'Greenfield Hort', rating: 5, comment: 'Incredible accuracy. 12ha sprayed in under 2 hours, zero drift on neighbouring plots.', serviceUsed: 'Aerial Crop Spraying', createdAt: '2026-07-20T07:00:00Z' },
      { id: 'adr2', reviewerName: 'Northern Farms', rating: 5, comment: 'NDVI map revealed two areas of waterlogging we had not noticed. Saved us significant inputs.', serviceUsed: 'NDVI Crop Health Imagery', createdAt: '2026-06-30T11:00:00Z' },
    ],
    certifications: [
      { body: 'ZCAA', certNumber: 'ZCAA-UA-2024-0033', certType: 'Unmanned Aircraft Operator Certificate', expires: '2026-09-30' },
    ],
    licenseNumber: 'ZCAA-UA-2024-0033',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'eh-3', providerType: 'equipment_hire',
    name: 'Harvest Solutions Zambia',
    tagline: 'Combine harvester hire — Southern & Eastern Province',
    description: 'John Deere S660 and Claas Lexion combine harvesters for maize, soya, wheat, and sunflower. Experienced operators. Grain cart and truck available for in-field grain management.',
    phone: '+260 977 260006', email: 'harvest@harvestsolutions.zm',
    location: 'Mazabuka, Southern Province', districts: ['Southern', 'Eastern', 'Central'],
    operatingHours: 'Apr–Jul harvest season: Daily operations',
    verified: true, certified: false, ratingAvg: 4.5, ratingCount: 27, active: true, mine: false,
    tags: ['Combine Harvester', 'Maize', 'Soya', 'Wheat', 'Operator Included'],
    specialties: ['Harvesting', 'Threshing', 'Grain Cart'],
    coverageType: 'mobile',
    services: [
      { id: 'hs1', name: 'Combine Harvesting — Maize', description: 'John Deere S660, 12-row header. Operator included. Client provides grain bags/bulk container.', price: 850, unit: 'per ha', category: 'Harvesting', available: true },
      { id: 'hs2', name: 'Combine Harvesting — Soya / Wheat', description: 'Claas Lexion 770 with flex head. Losses under 1%.', price: 780, unit: 'per ha', category: 'Harvesting', available: true },
      { id: 'hs3', name: 'Grain Cart Service', description: '26-tonne grain cart alongside combine for uninterrupted harvest.', price: 200, unit: 'per ha (added to harvest rate)', category: 'Harvesting', available: false },
    ],
    reviews: [
      { id: 'hsr1', reviewerName: 'Sunrise Farms', rating: 5, comment: 'Fast, clean cut. 80ha done in 4 days. Grain loss minimal.', serviceUsed: 'Combine Harvesting — Maize', createdAt: '2026-05-15T14:00:00Z' },
    ],
    certifications: [],
    createdAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'eh-4', providerType: 'equipment_hire',
    name: 'IrriTech Hire',
    tagline: 'Centre pivot & pump hire for irrigation season',
    description: 'Seasonal hire of centre pivot irrigators (Valmont, Lindsay), high-volume diesel and electric pumps, and portable drip irrigation systems. Technical support and installation included.',
    phone: '+260 955 270007', email: 'hire@irritechafrica.zm',
    location: 'Chisamba, Central Province', districts: ['Central', 'Lusaka', 'Southern'],
    operatingHours: 'Mon–Fri 08:00–17:00',
    verified: false, certified: true, ratingAvg: 4.3, ratingCount: 15, active: true, mine: false,
    tags: ['Centre Pivot', 'Irrigation Pumps', 'Seasonal Hire', 'Technical Support'],
    specialties: ['Irrigation', 'Pivot Systems', 'Pump Installation'],
    coverageType: 'mobile',
    services: [
      { id: 'ih1', name: 'Centre Pivot — Seasonal Hire', description: 'Valmont 50ha pivot. Full installation, commissioning, monthly maintenance included. Min 4-month hire.', price: 18000, unit: 'per month', category: 'Centre Pivot', available: true },
      { id: 'ih2', name: 'Diesel Pump Hire', description: '75kW diesel pump set, 120m³/hr capacity. Delivery and installation included.', price: 4500, unit: 'per month', category: 'Pumps', available: true },
      { id: 'ih3', name: 'Portable Drip Kit Hire', description: '1ha portable drip system — emitters, filters, mainlines. Suitable for dry-season vegetables.', price: 1800, unit: 'per month', category: 'Drip Irrigation', available: true },
    ],
    reviews: [],
    certifications: [
      { body: 'ZEMA', certNumber: 'ZEMA-IRR-2023-0077', certType: 'Irrigation Equipment Registration' },
    ],
    createdAt: '2023-05-01T00:00:00Z',
  },
  {
    id: 'eh-5', providerType: 'equipment_hire',
    name: 'Musika Farm Equipment Hire',
    tagline: 'Affordable tractor & tillage hire for smallholder farmers',
    description: 'NGO-supported equipment hire service making tractor mechanisation accessible to smallholder farmers. Subsidised rates for registered smallholders. Standard rates for commercial farms.',
    phone: '+260 966 280008', email: 'equipment@musikafarm.org',
    location: 'Kabwe, Central Province', districts: ['Central', 'Copperbelt', 'Lusaka', 'Northern'],
    operatingHours: 'Mon–Sat 07:00–17:00',
    verified: true, certified: true, ratingAvg: 4.1, ratingCount: 88, active: true, mine: false,
    tags: ['Smallholder Friendly', 'Subsidised Rates', 'NGO-Supported', 'Ploughing', 'Planting'],
    specialties: ['Maize', 'Groundnuts', 'Sorghum'],
    coverageType: 'mobile',
    services: [
      { id: 'mfh1', name: 'Ploughing (Smallholder Rate)', description: 'Registered smallholders (<5ha). Subsidised rate per ha.', price: 280, unit: 'per ha', category: 'Land Prep', available: true },
      { id: 'mfh2', name: 'Ploughing (Commercial Rate)', description: 'Commercial farms and cooperatives.', price: 490, unit: 'per ha', category: 'Land Prep', available: true },
      { id: 'mfh3', name: 'Planting (Jab Planter)', description: '2-row jab planter, maize and groundnuts. Operator included.', price: 220, unit: 'per ha', category: 'Planting', available: true },
    ],
    reviews: [
      { id: 'mfhr1', reviewerName: 'Chanda Smallholder', rating: 4, comment: 'Fair prices and they came within the scheduled week. Very helpful staff.', serviceUsed: 'Ploughing (Smallholder Rate)', createdAt: '2026-07-08T08:00:00Z' },
    ],
    certifications: [
      { body: 'MAL', certNumber: 'MAL-EH-2024-0092', certType: 'Farm Equipment Hire Registration' },
    ],
    createdAt: '2022-11-01T00:00:00Z',
  },
];

export default function EquipmentHire() {
  return (
    <ProviderShell cfg={{
      storageKey: 'agronexus_v2_providers_hire',
      providerType: 'equipment_hire',
      title: 'Equipment Hire',
      icon: '🚛',
      accent: 'orange',
      categories: ['Land Prep', 'Planting', 'Spraying', 'Harvesting', 'Irrigation', 'Transport', 'Conservation', 'Mapping'],
      serviceUnitLabel: 'per ha / per day',
      registerLabel: 'List your equipment',
      bookingType: 'hire',
      mockProviders: MOCK_HIRE,
      renderExtras: (p) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
          {p.coverageType && (
            <span style={{ padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
              {p.coverageType === 'mobile' ? '🚛 Mobile service' : p.coverageType}
            </span>
          )}
          {p.operatingHours && (
            <span style={{ fontSize: '11px', color: '#64748b' }}>⏱ {p.operatingHours}</span>
          )}
        </div>
      ),
    } as ProviderDirectoryConfig} />
  );
}
