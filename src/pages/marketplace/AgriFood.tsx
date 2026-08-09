// AgriFood Market — B2B / B2C fresh & processed food marketplace
import React from 'react';
import { MarketplaceShell, Listing } from './MarketplaceBase';

const MOCK_LISTINGS: Listing[] = [
  { id: 'af1', title: 'Broiler Chickens – 500 birds ready', category: 'Poultry', price: 58, unit: 'bird', qty: 500, location: 'Lusaka', sellerName: 'KwaZuma Farms', sellerPhone: '+260 977 001001', status: 'active', postedDate: '2026-08-01', mine: false, createdAt: '' },
  { id: 'af2', title: 'Fresh Tilapia – Grade A', category: 'Fish & Seafood', price: 32, unit: 'kg', qty: 800, location: 'Siavonga', sellerName: 'Lake Fresh Aqua', sellerPhone: '+260 955 002002', status: 'active', postedDate: '2026-08-05', mine: false, createdAt: '' },
  { id: 'af3', title: 'Organic Tomatoes – Farm Gate Price', category: 'Vegetables', price: 8, unit: 'kg', qty: 2000, location: 'Chisamba', sellerName: 'Greenfield Hort', sellerPhone: '+260 966 003003', status: 'active', postedDate: '2026-08-07', mine: false, createdAt: '' },
  { id: 'af4', title: 'Whole Maize – Dried 50kg Bags', category: 'Grains & Cereals', price: 175, unit: 'bag', qty: 300, location: 'Kabwe', sellerName: 'Central Grain Co', sellerPhone: '+260 977 004004', status: 'active', postedDate: '2026-08-03', mine: false, createdAt: '' },
  { id: 'af5', title: 'Fresh Cow Milk – Daily Supply', category: 'Dairy', price: 12, unit: 'litre', qty: 500, location: 'Mkushi', sellerName: 'Sunrise Dairy', sellerPhone: '+260 955 005005', status: 'active', postedDate: '2026-08-08', mine: false, createdAt: '' },
  { id: 'af6', title: 'Honey – Raw Beeswax 500g Jars', category: 'Processed Foods', price: 85, unit: 'jar', qty: 200, location: 'Kasama', sellerName: 'Northern Hive Co', status: 'active', postedDate: '2026-08-06', mine: false, createdAt: '' },
];

export default function AgriFood() {
  return (
    <MarketplaceShell cfg={{
      storageKey: 'agronexus_v2_mkt_food',
      title: 'AgriFood Market',
      icon: '🏪',
      accent: 'orange',
      categories: ['Poultry', 'Livestock', 'Fish & Seafood', 'Vegetables', 'Fruits', 'Grains & Cereals', 'Dairy', 'Eggs', 'Processed Foods', 'Other'],
      defaultUnit: 'kg',
      newListingLabel: 'Sell Food',
      mockListings: MOCK_LISTINGS,
    }} />
  );
}
