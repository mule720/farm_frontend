// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Procurement / Purchase Orders
// Log supplier orders, compare quotes, track delivery status
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import {
  Plus, X, Truck, Package, Star, AlertTriangle, ChevronDown, ChevronUp,
  ShoppingBag, Calendar, CheckCircle2, Clock, XCircle, Building2, Search,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useOrg } from '@/store/orgStore';

// ─── Types ───────────────────────────────────────────────────────────────────
type OrderStatus   = 'draft' | 'sent' | 'confirmed' | 'delivered' | 'cancelled';
type PaymentStatus = 'unpaid' | 'partial' | 'paid';
type SupplierCategory = 'feed' | 'vet_supplies' | 'equipment' | 'seeds' | 'chemicals' | 'other';

interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  category: SupplierCategory;
  rating: 1 | 2 | 3 | 4 | 5;
  notes: string;
}

interface OrderLine {
  item: string;
  unit: string;
  qty: number;
  unitPrice: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  enterpriseId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  orderDate: string;
  expectedDelivery: string;
  deliveredDate?: string;
  lines: OrderLine[];
  totalAmount: number;
  amountPaid: number;
  notes: string;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────
const PO_KEY  = 'agronexus_v2_procurement_orders';
const SUP_KEY = 'agronexus_v2_procurement_suppliers';

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'FeedCo Ltd', contact: 'James Mwape', phone: '+260 97 111 2233', email: 'james@feedco.zm', category: 'feed', rating: 4, notes: 'Reliable delivery, bulk discounts available' },
  { id: 'sup-2', name: 'AgroVet Supplies', contact: 'Dr. Nkandu', phone: '+260 96 455 6677', email: 'orders@agrovet.zm', category: 'vet_supplies', rating: 5, notes: 'Certified veterinary products, fast processing' },
  { id: 'sup-3', name: 'SeedMasters Zambia', contact: 'Patricia Banda', phone: '+260 95 888 0011', email: 'patricia@seedmasters.zm', category: 'seeds', rating: 3, notes: 'Good variety, delivery can be slow in peak season' },
];

function makeSeedOrders(today: string): PurchaseOrder[] {
  const d = (offset: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + offset);
    return dt.toISOString().slice(0, 10);
  };
  return [
    {
      id: 'po-1', poNumber: 'PO-2025-001', supplierId: 'sup-1', supplierName: 'FeedCo Ltd',
      enterpriseId: '', status: 'delivered', paymentStatus: 'paid',
      orderDate: d(-20), expectedDelivery: d(-15), deliveredDate: d(-14),
      lines: [
        { item: 'Broiler Starter Feed (50kg)', unit: 'bag', qty: 20, unitPrice: 180 },
        { item: 'Broiler Finisher Feed (50kg)', unit: 'bag', qty: 15, unitPrice: 170 },
      ],
      totalAmount: 6150, amountPaid: 6150, notes: 'Regular monthly order',
    },
    {
      id: 'po-2', poNumber: 'PO-2025-002', supplierId: 'sup-2', supplierName: 'AgroVet Supplies',
      enterpriseId: '', status: 'confirmed', paymentStatus: 'partial',
      orderDate: d(-5), expectedDelivery: d(3), deliveredDate: undefined,
      lines: [
        { item: 'Newcastle Disease Vaccine', unit: 'vial', qty: 10, unitPrice: 85 },
        { item: 'Vitamin Supplement 1L', unit: 'bottle', qty: 5, unitPrice: 120 },
        { item: 'Antibiotics 500ml', unit: 'bottle', qty: 3, unitPrice: 200 },
      ],
      totalAmount: 1850, amountPaid: 925, notes: 'Quarterly vet supplies',
    },
    {
      id: 'po-3', poNumber: 'PO-2025-003', supplierId: 'sup-3', supplierName: 'SeedMasters Zambia',
      enterpriseId: '', status: 'sent', paymentStatus: 'unpaid',
      orderDate: d(-2), expectedDelivery: d(10),
      lines: [
        { item: 'Maize Seed SC403 (10kg)', unit: 'pack', qty: 50, unitPrice: 95 },
        { item: 'Soybean Seed (25kg)', unit: 'bag', qty: 20, unitPrice: 145 },
      ],
      totalAmount: 7650, amountPaid: 0, notes: 'Rainy season planting',
    },
    {
      id: 'po-4', poNumber: 'PO-2025-004', supplierId: 'sup-1', supplierName: 'FeedCo Ltd',
      enterpriseId: '', status: 'draft', paymentStatus: 'unpaid',
      orderDate: d(0), expectedDelivery: d(14),
      lines: [
        { item: 'Layer Mash (50kg)', unit: 'bag', qty: 30, unitPrice: 165 },
      ],
      totalAmount: 4950, amountPaid: 0, notes: 'Pending approval',
    },
  ];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return 'K ' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function today() { return new Date().toISOString().slice(0, 10); }

const STATUS_META: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft:     { label: 'Draft',     color: 'bg-slate-100 text-slate-600',   icon: <Clock className="w-3 h-3" /> },
  sent:      { label: 'Sent',      color: 'bg-blue-100 text-blue-700',     icon: <Truck className="w-3 h-3" /> },
  confirmed: { label: 'Confirmed', color: 'bg-amber-100 text-amber-700',   icon: <CheckCircle2 className="w-3 h-3" /> },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700', icon: <Package className="w-3 h-3" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600',       icon: <XCircle className="w-3 h-3" /> },
};
const PAY_META: Record<PaymentStatus, { label: string; color: string }> = {
  unpaid:  { label: 'Unpaid',  color: 'bg-red-100 text-red-600' },
  partial: { label: 'Partial', color: 'bg-amber-100 text-amber-700' },
  paid:    { label: 'Paid',    color: 'bg-emerald-100 text-emerald-700' },
};
const CAT_LABELS: Record<SupplierCategory, string> = {
  feed: 'Feed', vet_supplies: 'Vet Supplies', equipment: 'Equipment',
  seeds: 'Seeds', chemicals: 'Chemicals', other: 'Other',
};
const CAT_COLORS: Record<SupplierCategory, string> = {
  feed: 'bg-orange-100 text-orange-700', vet_supplies: 'bg-purple-100 text-purple-700',
  equipment: 'bg-slate-100 text-slate-700', seeds: 'bg-green-100 text-green-700',
  chemicals: 'bg-red-100 text-red-700', other: 'bg-gray-100 text-gray-700',
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${m.color}`}>
      {m.icon}{m.label}
    </span>
  );
}
function PayBadge({ status }: { status: PaymentStatus }) {
  const m = PAY_META[status];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${m.color}`}>{m.label}</span>;
}
function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
      ))}
    </span>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
function useProcurement() {
  const td = today();
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(SUP_KEY) ?? 'null');
      return stored ?? SEED_SUPPLIERS;
    } catch { return SEED_SUPPLIERS; }
  });
  const [orders, setOrders] = useState<PurchaseOrder[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(PO_KEY) ?? 'null');
      return stored ?? makeSeedOrders(td);
    } catch { return makeSeedOrders(td); }
  });

  React.useEffect(() => { localStorage.setItem(SUP_KEY, JSON.stringify(suppliers)); }, [suppliers]);
  React.useEffect(() => { localStorage.setItem(PO_KEY,  JSON.stringify(orders));    }, [orders]);

  function addSupplier(s: Omit<Supplier, 'id'>) {
    const sup = { ...s, id: uuidv4() };
    setSuppliers(prev => [...prev, sup]);
    return sup;
  }
  function addOrder(o: Omit<PurchaseOrder, 'id'>) {
    const po = { ...o, id: uuidv4() };
    setOrders(prev => [...prev, po]);
    return po;
  }
  function updateOrder(id: string, patch: Partial<PurchaseOrder>) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));
  }

  return { suppliers, orders, addSupplier, addOrder, updateOrder };
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ orders }: { orders: PurchaseOrder[] }) {
  const td = today();
  const thisMonthStart = td.slice(0, 7) + '-01';

  const totalOrders   = orders.length;
  const pendingDel    = orders.filter(o => o.status === 'sent' || o.status === 'confirmed').length;
  const overdue       = orders.filter(o =>
    (o.status === 'sent' || o.status === 'confirmed') && o.expectedDelivery < td,
  ).length;
  const monthSpend    = orders
    .filter(o => o.orderDate >= thisMonthStart && o.status !== 'cancelled')
    .reduce((s, o) => s + o.totalAmount, 0);

  const recentOrders  = [...orders].sort((a, b) => b.orderDate.localeCompare(a.orderDate)).slice(0, 5);
  const upcoming7     = orders.filter(o =>
    (o.status === 'sent' || o.status === 'confirmed') &&
    o.expectedDelivery >= td &&
    o.expectedDelivery <= new Date(Date.now() + 7*86400000).toISOString().slice(0,10),
  ).sort((a, b) => a.expectedDelivery.localeCompare(b.expectedDelivery));

  return (
    <div className="p-5 space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders',       value: String(totalOrders), sub: 'all time',        icon: <ShoppingBag className="w-5 h-5 text-blue-500" />,    bg: 'bg-blue-50' },
          { label: 'Pending Delivery',   value: String(pendingDel),  sub: 'sent/confirmed',  icon: <Truck className="w-5 h-5 text-amber-500" />,         bg: 'bg-amber-50' },
          { label: 'Overdue',            value: String(overdue),     sub: 'past expected',   icon: <AlertTriangle className="w-5 h-5 text-red-500" />,   bg: 'bg-red-50' },
          { label: 'Spend This Month',   value: fmt(monthSpend),     sub: 'all non-cancelled', icon: <Package className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-50' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl p-4 flex items-start gap-3`}>
            <div className="mt-0.5">{k.icon}</div>
            <div>
              <p className="text-xl font-bold text-slate-800">{k.value}</p>
              <p className="text-xs font-medium text-slate-600">{k.label}</p>
              <p className="text-xs text-slate-400">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div>
        <h3 className="text-sm font-semibold text-slate-600 mb-2">Recent Orders</h3>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {recentOrders.length === 0 ? (
            <p className="text-sm text-slate-400 p-4 text-center">No orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['PO #', 'Supplier', 'Status', 'Payment', 'Date', 'Total'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 px-3 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-mono text-xs text-slate-700">{o.poNumber}</td>
                    <td className="px-3 py-2 text-slate-700">{o.supplierName}</td>
                    <td className="px-3 py-2"><StatusBadge status={o.status} /></td>
                    <td className="px-3 py-2"><PayBadge status={o.paymentStatus} /></td>
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{o.orderDate}</td>
                    <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">{fmt(o.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Upcoming deliveries */}
      <div>
        <h3 className="text-sm font-semibold text-slate-600 mb-2">Upcoming Deliveries (Next 7 Days)</h3>
        {upcoming7.length === 0 ? (
          <p className="text-sm text-slate-400">No deliveries expected in the next 7 days.</p>
        ) : (
          <div className="space-y-2">
            {upcoming7.map(o => (
              <div key={o.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{o.poNumber} — {o.supplierName}</p>
                  <p className="text-xs text-slate-400">{o.lines.length} line{o.lines.length !== 1 ? 's' : ''} · {fmt(o.totalAmount)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-slate-700">{o.expectedDelivery}</p>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab({
  orders, suppliers, enterprises,
  onAddOrder, onUpdateOrder,
}: {
  orders: PurchaseOrder[];
  suppliers: Supplier[];
  enterprises: { id: string; name: string }[];
  onAddOrder: (o: Omit<PurchaseOrder, 'id'>) => void;
  onUpdateOrder: (id: string, patch: Partial<PurchaseOrder>) => void;
}) {
  const [filterStatus, setFilterStatus]   = useState<'all' | OrderStatus>('all');
  const [filterPay, setFilterPay]         = useState<'all' | PaymentStatus>('all');
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [showModal, setShowModal]         = useState(false);
  const [search, setSearch]               = useState('');

  const filtered = useMemo(() => orders.filter(o => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (filterPay !== 'all' && o.paymentStatus !== filterPay) return false;
    if (search && !o.poNumber.toLowerCase().includes(search.toLowerCase()) &&
        !o.supplierName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [orders, filterStatus, filterPay, search]);

  function markDelivered(id: string) {
    onUpdateOrder(id, { status: 'delivered', deliveredDate: today() });
  }
  function markPaid(id: string, totalAmount: number) {
    onUpdateOrder(id, { paymentStatus: 'paid', amountPaid: totalAmount });
  }

  return (
    <div className="p-5 space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search PO# or supplier…"
            className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
          <option value="all">All Statuses</option>
          {(Object.keys(STATUS_META) as OrderStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
        <select value={filterPay} onChange={e => setFilterPay(e.target.value as any)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
          <option value="all">All Payments</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Order
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No orders match your filters.</p>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-6 px-3 py-2" />
                {['PO #', 'Supplier', 'Enterprise', 'Status', 'Payment', 'Expected Delivery', 'Total', 'Balance Due', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 px-3 py-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const expanded = expandedId === o.id;
                const balance  = o.totalAmount - o.amountPaid;
                const ent = enterprises.find(e => e.id === o.enterpriseId);
                return (
                  <React.Fragment key={o.id}>
                    <tr className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => setExpandedId(expanded ? null : o.id)}>
                      <td className="px-3 py-2 text-slate-400">
                        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-700 whitespace-nowrap">{o.poNumber}</td>
                      <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{o.supplierName}</td>
                      <td className="px-3 py-2 text-slate-500 text-xs">{ent?.name ?? '—'}</td>
                      <td className="px-3 py-2"><StatusBadge status={o.status} /></td>
                      <td className="px-3 py-2"><PayBadge status={o.paymentStatus} /></td>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{o.expectedDelivery}</td>
                      <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">{fmt(o.totalAmount)}</td>
                      <td className={`px-3 py-2 whitespace-nowrap ${balance > 0 ? 'text-red-600 font-medium' : 'text-slate-400'}`}>{fmt(balance)}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          {(o.status === 'sent' || o.status === 'confirmed') && (
                            <button onClick={() => markDelivered(o.id)}
                              className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 whitespace-nowrap">
                              Mark Delivered
                            </button>
                          )}
                          {o.paymentStatus !== 'paid' && o.status !== 'cancelled' && (
                            <button onClick={() => markPaid(o.id, o.totalAmount)}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 whitespace-nowrap">
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="bg-slate-50 border-t border-slate-100">
                        <td colSpan={10} className="px-6 py-3">
                          <div className="text-xs font-semibold text-slate-500 mb-2">Line Items</div>
                          <table className="text-sm w-full max-w-xl">
                            <thead>
                              <tr className="text-xs text-slate-400">
                                <th className="text-left pb-1">Item</th>
                                <th className="text-right pb-1">Qty</th>
                                <th className="text-right pb-1">Unit</th>
                                <th className="text-right pb-1">Unit Price</th>
                                <th className="text-right pb-1">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {o.lines.map((l, i) => (
                                <tr key={i} className="border-t border-slate-200">
                                  <td className="py-1 text-slate-700">{l.item}</td>
                                  <td className="py-1 text-right text-slate-600">{l.qty}</td>
                                  <td className="py-1 text-right text-slate-500">{l.unit}</td>
                                  <td className="py-1 text-right text-slate-600">{fmt(l.unitPrice)}</td>
                                  <td className="py-1 text-right font-medium text-slate-800">{fmt(l.qty * l.unitPrice)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {o.notes && <p className="mt-2 text-xs text-slate-400 italic">Note: {o.notes}</p>}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <AddOrderModal
          suppliers={suppliers}
          enterprises={enterprises}
          onSave={data => { onAddOrder(data); setShowModal(false); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ─── Suppliers Tab ────────────────────────────────────────────────────────────
function SuppliersTab({
  suppliers, onAddSupplier,
}: {
  suppliers: Supplier[];
  onAddSupplier: (s: Omit<Supplier, 'id'>) => void;
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-5 space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        {suppliers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No suppliers yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Name', 'Category', 'Contact', 'Phone', 'Rating', 'Notes'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[s.category]}`}>
                      {CAT_LABELS[s.category]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{s.contact}</td>
                  <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{s.phone}</td>
                  <td className="px-3 py-2"><Stars rating={s.rating} /></td>
                  <td className="px-3 py-2 text-slate-400 text-xs max-w-xs truncate">{s.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <AddSupplierModal
          onSave={data => { onAddSupplier(data); setShowModal(false); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ─── Add Order Modal ──────────────────────────────────────────────────────────
function AddOrderModal({
  suppliers, enterprises, onSave, onClose,
}: {
  suppliers: Supplier[];
  enterprises: { id: string; name: string }[];
  onSave: (o: Omit<PurchaseOrder, 'id'>) => void;
  onClose: () => void;
}) {
  const [supplierId, setSupplierId] = useState('');
  const [enterpriseId, setEnterpriseId] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<OrderLine[]>([{ item: '', unit: 'unit', qty: 1, unitPrice: 0 }]);

  const totalAmount = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  function addLine() { setLines(prev => [...prev, { item: '', unit: 'unit', qty: 1, unitPrice: 0 }]); }
  function removeLine(i: number) { setLines(prev => prev.filter((_, idx) => idx !== i)); }
  function updateLine(i: number, patch: Partial<OrderLine>) {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  }

  function handleSave() {
    if (!supplierId || !expectedDelivery || lines.every(l => !l.item)) return;
    const sup = suppliers.find(s => s.id === supplierId);
    const poNum = 'PO-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4);
    onSave({
      poNumber: poNum,
      supplierId,
      supplierName: sup?.name ?? '',
      enterpriseId,
      status: 'draft',
      paymentStatus: 'unpaid',
      orderDate: today(),
      expectedDelivery,
      lines: lines.filter(l => l.item),
      totalAmount,
      amountPaid: 0,
      notes,
    });
  }

  return (
    <ModalShell title="New Purchase Order" onClose={onClose} onSave={handleSave}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Supplier *</label>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option value="">Select supplier…</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Enterprise</label>
            <select value={enterpriseId} onChange={e => setEnterpriseId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option value="">None</option>
              {enterprises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Expected Delivery *</label>
          <input type="date" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>

        {/* Line items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-600">Line Items</label>
            <button onClick={addLine} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Line
            </button>
          </div>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-1 items-center">
                <input value={l.item} onChange={e => updateLine(i, { item: e.target.value })} placeholder="Item"
                  className="col-span-4 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                <input value={l.unit} onChange={e => updateLine(i, { unit: e.target.value })} placeholder="Unit"
                  className="col-span-2 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                <input type="number" value={l.qty} min={0} onChange={e => updateLine(i, { qty: +e.target.value })} placeholder="Qty"
                  className="col-span-2 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                <input type="number" value={l.unitPrice} min={0} step={0.01} onChange={e => updateLine(i, { unitPrice: +e.target.value })} placeholder="Price"
                  className="col-span-3 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                <button onClick={() => removeLine(i)} className="col-span-1 flex justify-center text-slate-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-right text-sm font-semibold text-slate-700 mt-2">Total: {fmt(totalAmount)}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional notes…"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Add Supplier Modal ───────────────────────────────────────────────────────
function AddSupplierModal({ onSave, onClose }: { onSave: (s: Omit<Supplier, 'id'>) => void; onClose: () => void }) {
  const [form, setForm] = useState<Omit<Supplier, 'id'>>({
    name: '', contact: '', phone: '', email: '', category: 'feed', rating: 3, notes: '',
  });
  const set = (k: keyof typeof form, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <ModalShell title="Add Supplier" onClose={onClose} onSave={() => { if (form.name) onSave(form); }}>
      <div className="space-y-3">
        {([
          ['Name *', 'name', 'text'],
          ['Contact Person', 'contact', 'text'],
          ['Phone', 'phone', 'tel'],
          ['Email', 'email', 'email'],
        ] as const).map(([label, key, type]) => (
          <div key={key}>
            <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
            <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value as SupplierCategory)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
              {(Object.entries(CAT_LABELS) as [SupplierCategory, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Rating</label>
            <select value={form.rating} onChange={e => set('rating', +e.target.value as 1|2|3|4|5)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
              {[1,2,3,4,5].map(r => <option key={r} value={r}>{'★'.repeat(r)} ({r}/5)</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Modal Shell ──────────────────────────────────────────────────────────────
function ModalShell({ title, children, onSave, onClose }: {
  title: string; children: React.ReactNode;
  onSave: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>
        <div className="flex gap-2 justify-end px-5 py-4 border-t border-slate-200 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
          <button onClick={onSave} className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Procurement() {
  const { org } = useOrg();
  const enterprises = (org?.enterprises ?? []).map(e => ({ id: e.id, name: e.name }));
  const { suppliers, orders, addSupplier, addOrder, updateOrder } = useProcurement();
  const [tab, setTab] = useState<'overview' | 'orders' | 'suppliers'>('overview');

  const TABS = [
    { key: 'overview',   label: 'Overview' },
    { key: 'orders',     label: 'Orders' },
    { key: 'suppliers',  label: 'Suppliers' },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Procurement</h1>
            <p className="text-xs text-slate-400">Supplier orders, quotes, and delivery tracking</p>
          </div>
        </div>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'overview'  && <OverviewTab orders={orders} />}
        {tab === 'orders'    && (
          <OrdersTab
            orders={orders}
            suppliers={suppliers}
            enterprises={enterprises}
            onAddOrder={addOrder}
            onUpdateOrder={updateOrder}
          />
        )}
        {tab === 'suppliers' && (
          <SuppliersTab suppliers={suppliers} onAddSupplier={addSupplier} />
        )}
      </div>
    </div>
  );
}
