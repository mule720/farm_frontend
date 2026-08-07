import React, { useState } from 'react';
import { ShoppingBag, TrendingUp, Users, FileText, Plus, Star, Package, Handshake } from 'lucide-react';

interface Listing {
  id: string;
  commodity: string;
  quantity_available: number;
  unit: string;
  asking_price: number;
  currency: string;
  status: string;
  location: string;
  seller: string;
  available_until: string;
}

interface PriceRow {
  commodity: string;
  market: string;
  price: number;
  unit: string;
  date: string;
  change: number;
}

const MOCK_LISTINGS: Listing[] = [
  { id: '1', commodity: 'Broiler Chickens', quantity_available: 500, unit: 'head', asking_price: 78, currency: 'ZMW', status: 'active', location: 'Lusaka', seller: 'My Farm', available_until: '2026-06-20' },
  { id: '2', commodity: 'Fresh Tomatoes', quantity_available: 2400, unit: 'kg', asking_price: 6.5, currency: 'ZMW', status: 'active', location: 'Lusaka', seller: 'My Farm', available_until: '2026-06-12' },
  { id: '3', commodity: 'Goats (live)', quantity_available: 12, unit: 'head', asking_price: 850, currency: 'ZMW', status: 'negotiating', location: 'Lusaka', seller: 'Chiwala Farms', available_until: '2026-07-01' },
  { id: '4', commodity: 'Maize Grain', quantity_available: 15000, unit: 'kg', asking_price: 4.2, currency: 'ZMW', status: 'active', location: 'Kabwe', seller: 'Sunset Agri', available_until: '2026-08-30' },
];

const MOCK_PRICES: PriceRow[] = [
  { commodity: 'Broiler Chickens', market: 'Soweto Market', price: 75, unit: 'head', date: '2026-06-05', change: 2.3 },
  { commodity: 'Eggs (crate)', market: 'City Market', price: 185, unit: 'crate', date: '2026-06-05', change: -1.2 },
  { commodity: 'Fresh Tomatoes', market: 'Soweto Market', price: 6.0, unit: 'kg', date: '2026-06-05', change: 8.5 },
  { commodity: 'Maize Grain', market: 'FRA', price: 3.8, unit: 'kg', date: '2026-06-04', change: 0 },
  { commodity: 'Pigs (live)', market: 'Matero Market', price: 950, unit: 'head', date: '2026-06-05', change: 4.1 },
  { commodity: 'Cattle (feeder)', market: 'Showgrounds', price: 4200, unit: 'head', date: '2026-06-03', change: -0.8 },
];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  negotiating: 'bg-blue-100 text-blue-700',
  sold: 'bg-slate-100 text-slate-600',
  expired: 'bg-red-100 text-red-600',
};

export default function MarketplaceModule() {
  const [tab, setTab] = useState<'prices' | 'listings' | 'buyers' | 'contracts'>('prices');
  const [showCreateListing, setShowCreateListing] = useState(false);

  const myListings = MOCK_LISTINGS.filter(l => l.seller === 'My Farm');

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-green-600" /> Commodity Marketplace
          </h1>
          <p className="text-sm text-slate-500 mt-1">Live price feeds, buyer network & trade contracts</p>
        </div>
        <button onClick={() => setShowCreateListing(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
          <Plus className="w-4 h-4" /> List Product
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Listings', value: myListings.filter(l => l.status === 'active').length, icon: Package, color: 'green' },
          { label: 'In Negotiation', value: MOCK_LISTINGS.filter(l => l.status === 'negotiating').length, icon: Handshake, color: 'blue' },
          { label: 'Price Updates Today', value: MOCK_PRICES.filter(p => p.date === '2026-06-05').length, icon: TrendingUp, color: 'amber' },
          { label: 'Registered Buyers', value: 8, icon: Users, color: 'purple' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-9 h-9 bg-${color}-50 rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['prices', 'listings', 'buyers', 'contracts'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t}</button>
        ))}
      </div>

      {tab === 'prices' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-600" /> Live Market Prices</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 text-xs text-slate-500 uppercase">
                <th className="text-left py-2 font-medium">Commodity</th>
                <th className="text-left py-2 font-medium">Market</th>
                <th className="text-right py-2 font-medium">Price (ZMW)</th>
                <th className="text-left py-2 font-medium">Unit</th>
                <th className="text-right py-2 font-medium">Change</th>
                <th className="text-left py-2 font-medium">Date</th>
              </tr></thead>
              <tbody>
                {MOCK_PRICES.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2.5 font-medium text-slate-800">{row.commodity}</td>
                    <td className="py-2.5 text-slate-600">{row.market}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">{row.price.toFixed(2)}</td>
                    <td className="py-2.5 text-slate-500 text-xs">/{row.unit}</td>
                    <td className="py-2.5 text-right">
                      <span className={`text-xs font-semibold ${row.change > 0 ? 'text-green-600' : row.change < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {row.change > 0 ? '+' : ''}{row.change !== 0 ? `${row.change.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400 text-xs">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'listings' && (
        <div className="space-y-4">
          {showCreateListing && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <h3 className="font-semibold text-slate-900">Create Market Listing</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="block text-xs font-medium text-slate-600 mb-1">Commodity</label><input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Broiler Chickens" /></div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Quantity</label><input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Unit</label><select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"><option>head</option><option>kg</option><option>tonne</option><option>crate</option></select></div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Asking Price (ZMW)</label><input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Available Until</label><input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowCreateListing(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">Cancel</button>
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">Publish Listing</button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_LISTINGS.map(listing => (
              <div key={listing.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{listing.commodity}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{listing.seller} · {listing.location}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[listing.status] || 'bg-slate-100 text-slate-600'}`}>{listing.status}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs text-slate-500">Available</div>
                    <div className="font-bold text-slate-900">{listing.quantity_available.toLocaleString()} {listing.unit}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Asking price</div>
                    <div className="font-bold text-green-700 text-lg">{listing.currency} {listing.asking_price.toFixed(2)}<span className="text-xs font-normal text-slate-500">/{listing.unit}</span></div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Expires: {listing.available_until}</span>
                  <button className="text-blue-600 font-medium hover:text-blue-800">Make Offer →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'buyers' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Users className="w-4 h-4" /> Buyer Network</h3>
            <button className="flex items-center gap-1 text-sm text-green-600 font-medium"><Plus className="w-3 h-3" /> Add Buyer</button>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Shoprite Zambia', type: 'Supermarket', commodities: ['Eggs', 'Broilers', 'Fresh Veg'], rating: 5, verified: true, town: 'Lusaka' },
              { name: 'Choppies', type: 'Supermarket', commodities: ['Broilers', 'Pork'], rating: 4, verified: true, town: 'Lusaka' },
              { name: 'Nkwazi Processors', type: 'Processor', commodities: ['Cattle', 'Goats'], rating: 4, verified: false, town: 'Kabwe' },
              { name: 'FRA Lusaka', type: 'Government', commodities: ['Maize', 'Sorghum'], rating: 3, verified: true, town: 'Lusaka' },
            ].map((buyer, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm text-slate-900 flex items-center gap-2">
                    {buyer.name}
                    {buyer.verified && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Verified</span>}
                  </div>
                  <div className="text-xs text-slate-500">{buyer.type} · {buyer.town} · Buys: {buyer.commodities.join(', ')}</div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: buyer.rating }).map((_, j) => <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                  {Array.from({ length: 5 - buyer.rating }).map((_, j) => <Star key={j} className="w-3 h-3 text-slate-200" />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'contracts' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><FileText className="w-4 h-4" /> Trade Contracts</h3>
            <button className="flex items-center gap-1 text-sm text-green-600 font-medium"><Plus className="w-3 h-3" /> New Contract</button>
          </div>
          <div className="space-y-3">
            {[
              { commodity: 'Broiler Chickens', buyer: 'Shoprite Zambia', qty: '500 head', price: 'K78/head', total: 'K39,000', delivery: '2026-06-20', status: 'accepted', deposit: true },
              { commodity: 'Fresh Tomatoes', buyer: 'Choppies', qty: '1,500 kg', price: 'K6.50/kg', total: 'K9,750', delivery: '2026-06-15', status: 'in_progress', deposit: true },
              { commodity: 'Maize Grain', buyer: 'FRA Lusaka', qty: '10,000 kg', price: 'K4.50/kg', total: 'K45,000', delivery: '2026-08-01', status: 'offered', deposit: false },
            ].map((row, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-slate-900">{row.commodity}</div>
                    <div className="text-xs text-slate-500">Buyer: {row.buyer} · Delivery: {row.delivery}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.status === 'accepted' || row.status === 'in_progress' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{row.status.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-600">{row.qty} @ {row.price}</span>
                  <span className="font-bold text-green-700">{row.total}</span>
                  {row.deposit && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Deposit paid</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
