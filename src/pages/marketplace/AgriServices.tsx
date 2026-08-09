// AgriServices — Services marketplace (vets, agronomists, transport, hire)
import React from 'react';
import { MarketplaceShell, Listing } from './MarketplaceBase';

const MOCK_LISTINGS: Listing[] = [
  { id: 'asv1', title: 'Mobile Veterinary Services – Poultry & Livestock', category: 'Veterinary', price: 350, unit: 'visit', location: 'Lusaka (mobile)', sellerName: 'Dr. M. Zimba – AgriVet', sellerPhone: '+260 977 021001', description: 'Fully qualified vet with 10 years experience. Vaccinations, disease diagnosis, post-mortems.', status: 'active', postedDate: '2026-08-01', mine: false, createdAt: '' },
  { id: 'asv2', title: 'Crop Scouting & Agronomist Consultation', category: 'Agronomy', price: 500, unit: 'day', location: 'Copperbelt & CB Province', sellerName: 'Green Consult Ltd', sellerPhone: '+260 955 022002', description: 'Soil sampling, crop health assessment, spray programmes. Available weekdays.', status: 'active', postedDate: '2026-08-03', mine: false, createdAt: '' },
  { id: 'asv3', title: '5-Ton Truck – Farm Produce Transport', category: 'Transport', price: 2800, unit: 'trip', location: 'Nationwide', sellerName: 'Agro Haulage Zambia', sellerPhone: '+260 977 023003', description: 'Refrigerated and standard trucks available. Lusaka–Copperbelt–Eastern Province routes.', status: 'active', postedDate: '2026-08-05', mine: false, createdAt: '' },
  { id: 'asv4', title: 'Tractor Hire – Ploughing & Harrowing', category: 'Equipment Hire', price: 850, unit: 'hour', location: 'Central Province', sellerName: 'FarmMech Services', sellerPhone: '+260 966 024004', description: 'New Holland tractor + disc plough. Minimum 4-hour hire. Available June–December.', status: 'active', postedDate: '2026-08-06', mine: false, createdAt: '' },
  { id: 'asv5', title: 'Drone Crop Spraying – Per Hectare', category: 'Aerial Services', price: 180, unit: 'ha', location: 'Southern Province', sellerName: 'AgroDrone Zambia', sellerPhone: '+260 955 025005', description: 'Precision aerial spraying. 20L tank capacity. GPS mapping included.', status: 'active', postedDate: '2026-08-07', mine: false, createdAt: '' },
  { id: 'asv6', title: 'Cold Storage Rental – Per Pallet Space', category: 'Storage', price: 450, unit: 'week', location: 'Lusaka', sellerName: 'FreshStore Zambia', sellerPhone: '+260 977 026006', status: 'active', postedDate: '2026-08-04', mine: false, createdAt: '' },
  { id: 'asv7', title: 'Irrigation Installation & Maintenance', category: 'Irrigation Services', price: 4500, unit: 'project', location: 'Nationwide', sellerName: 'IrriPro Africa', sellerPhone: '+260 966 027007', description: 'Drip & sprinkler systems. Free site assessment. 1-year warranty on parts.', status: 'active', postedDate: '2026-08-02', mine: false, createdAt: '' },
  { id: 'asv8', title: 'Accounting & Tax for Farmers', category: 'Finance & Accounting', price: 800, unit: 'month', location: 'Remote (online)', sellerName: 'AgroBooks Ltd', sellerPhone: '+260 955 028008', description: 'Bookkeeping, VAT returns, income tax for farming businesses. ZRA registered.', status: 'active', postedDate: '2026-08-08', mine: false, createdAt: '' },
];

export default function AgriServices() {
  return (
    <MarketplaceShell cfg={{
      storageKey: 'agronexus_v2_mkt_services',
      title: 'AgriServices',
      icon: '🔧',
      accent: 'blue',
      categories: ['Veterinary', 'Agronomy', 'Transport', 'Equipment Hire', 'Aerial Services', 'Storage', 'Irrigation Services', 'Finance & Accounting', 'Training', 'Labour', 'Other Services'],
      defaultUnit: 'visit',
      newListingLabel: 'Offer Service',
      mockListings: MOCK_LISTINGS,
    }} />
  );
}
