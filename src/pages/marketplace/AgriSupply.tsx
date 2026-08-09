// AgriSupply — Inputs marketplace (seeds, feeds, fertilisers, equipment)
import React from 'react';
import { MarketplaceShell, Listing } from './MarketplaceBase';

const MOCK_LISTINGS: Listing[] = [
  { id: 'as1', title: 'Pannar PAN 67 Maize Seed – 50kg', category: 'Seeds', price: 650, unit: 'bag', qty: 100, location: 'Lusaka', sellerName: 'AgriInput Distributors', sellerPhone: '+260 977 011001', status: 'active', postedDate: '2026-08-01', mine: false, createdAt: '' },
  { id: 'as2', title: 'Broiler Starter Feed 50kg Bags', category: 'Animal Feed', price: 320, unit: 'bag', qty: 500, location: 'Lusaka', sellerName: 'FeedMills Zambia', sellerPhone: '+260 955 012002', status: 'active', postedDate: '2026-08-04', mine: false, createdAt: '' },
  { id: 'as3', title: 'NPK 10-20-10 Fertiliser 50kg', category: 'Fertiliser', price: 480, unit: 'bag', qty: 200, location: 'Ndola', sellerName: 'AgroChems Ltd', sellerPhone: '+260 966 013003', status: 'active', postedDate: '2026-08-06', mine: false, createdAt: '' },
  { id: 'as4', title: 'Borehole Water Pump – Solar', category: 'Equipment', price: 8500, unit: 'unit', qty: 10, location: 'Lusaka', sellerName: 'SolarAgri Solutions', sellerPhone: '+260 977 014004', status: 'active', postedDate: '2026-08-02', mine: false, createdAt: '' },
  { id: 'as5', title: 'Poultry Vaccines – Newcastle 1000 doses', category: 'Medicines & Vaccines', price: 180, unit: 'vial', qty: 50, location: 'Lusaka', sellerName: 'Vetpharm Zambia', sellerPhone: '+260 955 015005', status: 'active', postedDate: '2026-08-07', mine: false, createdAt: '' },
  { id: 'as6', title: 'Drip Irrigation Kit – 0.5ha', category: 'Irrigation', price: 3200, unit: 'kit', qty: 15, location: 'Chisamba', sellerName: 'IrriTech Africa', sellerPhone: '+260 977 016006', status: 'active', postedDate: '2026-08-05', mine: false, createdAt: '' },
  { id: 'as7', title: 'Chick Boxes – Day-Old Broilers 100', category: 'Day-Old Chicks', price: 1800, unit: 'box', qty: 30, location: 'Lusaka', sellerName: 'ZamPoultry Hatchery', sellerPhone: '+260 955 017007', status: 'active', postedDate: '2026-08-08', mine: false, createdAt: '' },
];

export default function AgriSupply() {
  return (
    <MarketplaceShell cfg={{
      storageKey: 'agronexus_v2_mkt_supply',
      title: 'AgriSupply',
      icon: '🚜',
      accent: 'teal',
      categories: ['Seeds', 'Animal Feed', 'Fertiliser', 'Chemicals & Pesticides', 'Medicines & Vaccines', 'Day-Old Chicks', 'Fingerlings', 'Equipment', 'Irrigation', 'Storage', 'Packaging', 'Other Inputs'],
      defaultUnit: 'bag',
      newListingLabel: 'Sell Inputs',
      mockListings: MOCK_LISTINGS,
    }} />
  );
}
