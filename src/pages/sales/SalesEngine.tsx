// ─────────────────────────────────────────────────────────────────────────────
// AgroNexus v2 — Sales Engine
// Customers, orders, invoices, payment tracking
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import {
  Plus, X, ShoppingCart, User, FileText, CheckCircle2,
  Clock, AlertCircle, Search, ChevronRight, DollarSign,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// ─── Types ───────────────────────────────────────────────────────────────────
type OrderStatus    = 'draft' | 'confirmed' | 'fulfilled' | 'cancelled';
type PaymentStatus  = 'unpaid' | 'partial' | 'paid' | 'overdue';
type CustomerType   = 'individual' | 'business' | 'wholesale' | 'export';

interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

interface OrderLine {
  id: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
}

interface SaleOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  lines: OrderLine[];
  subtotal: number;
  taxPct?: number;
  discountAmt?: number;
  total: number;
  amountPaid: number;
  notes?: string;
  createdAt: string;
}

// ─── Storage ─────────────────────────────────────────────────────────────────
const CUST_KEY   = 'agronexus_v2_customers';
const ORDERS_KEY = 'agronexus_v2_orders';

function calcTotal(lines: OrderLine[], taxPct = 0, discountAmt = 0) {
  const sub = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  return Math.max(0, sub * (1 + taxPct / 100) - discountAmt);
}

function useSales() {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try { return JSON.parse(localStorage.getItem(CUST_KEY) ?? '[]'); } catch { return []; }
  });
  const [orders, setOrders] = useState<SaleOrder[]>(() => {
    try { return JSON.parse(localStorage.getItem(ORDERS_KEY) ?? '[]'); } catch { return []; }
  });
  React.useEffect(() => { localStorage.setItem(CUST_KEY,   JSON.stringify(customers)); }, [customers]);
  React.useEffect(() => { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));    }, [orders]);

  function addCustomer(c: Omit<Customer, 'id' | 'createdAt'>) {
    const cust = { ...c, id: uuidv4(), createdAt: new Date().toISOString() };
    setCustomers(prev => [...prev, cust]);
    return cust;
  }
  function updateCustomer(id: string, patch: Partial<Customer>) {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  }
  function addOrder(o: Omit<SaleOrder, 'id' | 'createdAt'>) {
    const order = { ...o, id: uuidv4(), createdAt: new Date().toISOString() };
    setOrders(prev => [...prev, order]);
    return order;
  }
  function updateOrder(id: string, patch: Partial<SaleOrder>) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));
  }
  function recordPayment(orderId: string, amount: number) {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const paid = o.amountPaid + amount;
      const paymentStatus: PaymentStatus = paid >= o.total ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
      return { ...o, amountPaid: paid, paymentStatus };
    }));
  }

  return { customers, orders, addCustomer, updateCustomer, addOrder, updateOrder, recordPayment };
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────
export default function SalesEngine() {
  const { customers, orders, addCustomer, updateCustomer, addOrder, updateOrder, recordPayment } = useSales();
  const [tab, setTab] = useState<'orders' | 'customers'>('orders');
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [payModal, setPayModal] = useState<string | null>(null); // orderId

  const filteredOrders = useMemo(() =>
    orders.filter(o => !search || o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.customerName.toLowerCase().includes(search.toLowerCase()))
  , [orders, search]);

  const filteredCustomers = useMemo(() =>
    customers.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
  , [customers, search]);

  const selected = selectedOrderId ? orders.find(o => o.id === selectedOrderId) : null;

  // Summary stats
  const totalRevenue  = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const totalUnpaid   = orders.filter(o => o.paymentStatus !== 'paid' && o.status !== 'cancelled').reduce((s, o) => s + (o.total - o.amountPaid), 0);
  const activeOrders  = orders.filter(o => o.status === 'confirmed' || o.status === 'draft').length;

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 border-r border-slate-200 bg-white`}>
        <div className="px-4 py-4 border-b border-slate-100 flex-shrink-0 space-y-3">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Revenue" value={totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0 })} color="green" />
            <MiniStat label="Outstanding" value={totalUnpaid.toLocaleString(undefined, { minimumFractionDigits: 0 })} color={totalUnpaid > 0 ? 'red' : 'slate'} />
            <MiniStat label="Active Orders" value={String(activeOrders)} color="blue" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {(['orders', 'customers'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize ${tab === t ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={() => tab === 'orders' ? setShowNewOrder(true) : setShowNewCustomer(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700">
              <Plus className="w-3.5 h-3.5" /> {tab === 'orders' ? 'New Order' : 'Add Customer'}
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === 'orders' ? 'Search orders…' : 'Search customers…'}
              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {tab === 'orders' && (
            <>
              {filteredOrders.length === 0 && <EmptyMsg icon={<ShoppingCart />} msg="No orders yet." />}
              {filteredOrders
                .slice().sort((a, b) => b.date.localeCompare(a.date))
                .map(o => <OrderRow key={o.id} order={o} selected={selectedOrderId === o.id} onClick={() => { setSelectedOrderId(o.id); setTab('orders'); }} />)}
            </>
          )}
          {tab === 'customers' && (
            <>
              {filteredCustomers.length === 0 && <EmptyMsg icon={<User />} msg="No customers yet." />}
              {filteredCustomers.map(c => <CustomerRow key={c.id} customer={c} onClick={() => {}} />)}
            </>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className={`${selected ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-slate-50 min-w-0`}>
        {selected ? (
          <OrderDetail
            order={selected}
            onClose={() => setSelectedOrderId(null)}
            onUpdate={patch => updateOrder(selected.id, patch)}
            onRecordPayment={() => setPayModal(selected.id)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">Select an order to view details</p>
          </div>
        )}
      </div>

      {showNewOrder && (
        <NewOrderModal
          customers={customers}
          onAddCustomer={addCustomer}
          onSave={data => { const o = addOrder(data); setSelectedOrderId(o.id); setShowNewOrder(false); }}
          onClose={() => setShowNewOrder(false)}
        />
      )}
      {showNewCustomer && (
        <AddCustomerModal
          onSave={data => { addCustomer(data); setShowNewCustomer(false); }}
          onClose={() => setShowNewCustomer(false)}
        />
      )}
      {payModal && (
        <PaymentModal
          order={orders.find(o => o.id === payModal)!}
          onSave={amount => { recordPayment(payModal, amount); setPayModal(null); }}
          onClose={() => setPayModal(null)}
        />
      )}
    </div>
  );
}

// ─── Order Row ────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<OrderStatus, { label: string; dot: string }> = {
  draft:     { label: 'Draft',     dot: 'bg-slate-400' },
  confirmed: { label: 'Confirmed', dot: 'bg-blue-500' },
  fulfilled: { label: 'Fulfilled', dot: 'bg-green-500' },
  cancelled: { label: 'Cancelled', dot: 'bg-red-400' },
};
const PAY_CONFIG: Record<PaymentStatus, { label: string; color: string }> = {
  unpaid:  { label: 'Unpaid',  color: 'text-red-500' },
  partial: { label: 'Partial', color: 'text-amber-600' },
  paid:    { label: 'Paid',    color: 'text-green-600' },
  overdue: { label: 'Overdue', color: 'text-red-600' },
};

function OrderRow({ order, selected, onClick }: { order: SaleOrder; selected: boolean; onClick: () => void }) {
  const sc = STATUS_CONFIG[order.status];
  const pc = PAY_CONFIG[order.paymentStatus];
  return (
    <button onClick={onClick}
      className={`w-full text-left p-3 rounded-xl transition-all ${selected ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-slate-50 border border-transparent'}`}>
      <div className="flex items-center gap-2.5">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-sm text-slate-800">{order.orderNumber}</span>
            <span className="text-xs text-slate-400 truncate">{order.customerName}</span>
          </div>
          <div className="text-xs mt-0.5 flex items-center gap-2">
            <span className="text-slate-400">{new Date(order.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
            <span className={`font-medium ${pc.color}`}>{pc.label}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-bold text-slate-700">{order.total.toLocaleString(undefined, { minimumFractionDigits: 0 })}</div>
          {order.paymentStatus !== 'paid' && order.amountPaid > 0 && (
            <div className="text-[10px] text-amber-600">{order.amountPaid.toLocaleString()} paid</div>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Customer Row ─────────────────────────────────────────────────────────────
function CustomerRow({ customer, onClick }: { customer: Customer; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-transparent flex items-center gap-2.5">
      <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
        {customer.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-slate-800 truncate">{customer.name}</div>
        <div className="text-xs text-slate-400 capitalize">{customer.type}{customer.phone ? ` · ${customer.phone}` : ''}</div>
      </div>
    </button>
  );
}

// ─── Order Detail ─────────────────────────────────────────────────────────────
type OTab = 'invoice' | 'payments' | 'notes';

function OrderDetail({ order, onClose, onUpdate, onRecordPayment }: {
  order: SaleOrder;
  onClose: () => void;
  onUpdate: (p: Partial<SaleOrder>) => void;
  onRecordPayment: () => void;
}) {
  const [tab, setTab] = useState<OTab>('invoice');
  const sc = STATUS_CONFIG[order.status];
  const pc = PAY_CONFIG[order.paymentStatus];
  const outstanding = order.total - order.amountPaid;

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900">{order.orderNumber}</h2>
            <div className="text-xs text-slate-500 mt-0.5">{order.customerName} · {new Date(order.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg lg:hidden"><X className="w-4 h-4" /></button>
        </div>

        {/* Status + total */}
        <div className="flex items-center gap-4 mt-3">
          <div>
            <div className="text-2xl font-bold text-slate-900">{order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600`}>{sc.label}</span>
              <span className={`text-xs font-medium ${pc.color}`}>{pc.label}</span>
            </div>
          </div>
          {outstanding > 0.01 && (
            <div className="ml-auto">
              <div className="text-xs text-slate-400">Outstanding</div>
              <div className="text-lg font-bold text-red-500">{outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {order.status === 'draft' && (
            <button onClick={() => onUpdate({ status: 'confirmed' })}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-xl text-xs font-medium hover:bg-blue-200">✓ Confirm</button>
          )}
          {order.status === 'confirmed' && (
            <button onClick={() => onUpdate({ status: 'fulfilled' })}
              className="px-3 py-2 bg-green-100 text-green-700 rounded-xl text-xs font-medium hover:bg-green-200">📦 Mark Fulfilled</button>
          )}
          {order.paymentStatus !== 'paid' && order.status !== 'cancelled' && (
            <button onClick={onRecordPayment}
              className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-medium hover:bg-emerald-200">💳 Record Payment</button>
          )}
          {order.status !== 'cancelled' && order.status !== 'fulfilled' && (
            <button onClick={() => onUpdate({ status: 'cancelled' })}
              className="px-3 py-2 border border-red-200 text-red-500 rounded-xl text-xs hover:bg-red-50">Cancel</button>
          )}
        </div>

        <div className="flex gap-0.5 mt-4">
          {(['invoice', 'payments', 'notes'] as OTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize ${tab === t ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'invoice'  && <InvoiceView  order={order} />}
        {tab === 'payments' && <PaymentsView order={order} />}
        {tab === 'notes'    && (
          <div className="max-w-md space-y-3">
            <textarea className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" rows={5}
              defaultValue={order.notes ?? ''} placeholder="Order notes…"
              onBlur={e => onUpdate({ notes: e.target.value || undefined })} />
          </div>
        )}
      </div>
    </div>
  );
}

function InvoiceView({ order }: { order: SaleOrder }) {
  const subtotal = order.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  return (
    <div className="max-w-lg bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-bold text-slate-900 text-lg">{order.orderNumber}</div>
            <div className="text-xs text-slate-400 mt-0.5">Date: {new Date(order.date).toLocaleDateString('en-GB')}</div>
            {order.dueDate && <div className="text-xs text-slate-400">Due: {new Date(order.dueDate).toLocaleDateString('en-GB')}</div>}
          </div>
          <div className="text-right">
            <div className="font-semibold text-sm text-slate-700">{order.customerName}</div>
          </div>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="bg-slate-50 text-xs text-slate-500">
          <th className="text-left px-4 py-2.5">Description</th>
          <th className="text-right px-4 py-2.5">Qty</th>
          <th className="text-right px-4 py-2.5">Unit</th>
          <th className="text-right px-4 py-2.5">Price</th>
          <th className="text-right px-4 py-2.5">Amount</th>
        </tr></thead>
        <tbody>
          {order.lines.map(l => (
            <tr key={l.id} className="border-t border-slate-100">
              <td className="px-4 py-2.5 text-slate-700">{l.description}</td>
              <td className="px-4 py-2.5 text-right text-slate-600">{l.qty}</td>
              <td className="px-4 py-2.5 text-right text-slate-400">{l.unit}</td>
              <td className="px-4 py-2.5 text-right text-slate-600">{l.unitPrice.toFixed(2)}</td>
              <td className="px-4 py-2.5 text-right font-medium text-slate-700">{(l.qty * l.unitPrice).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-slate-100 px-4 py-3 space-y-1.5">
        <div className="flex justify-between text-sm text-slate-500"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
        {order.taxPct && <div className="flex justify-between text-sm text-slate-500"><span>Tax ({order.taxPct}%)</span><span>{(subtotal * order.taxPct / 100).toFixed(2)}</span></div>}
        {order.discountAmt && <div className="flex justify-between text-sm text-slate-500"><span>Discount</span><span>-{order.discountAmt.toFixed(2)}</span></div>}
        <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-100"><span>Total</span><span>{order.total.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">Paid</span><span className="text-green-600 font-medium">{order.amountPaid.toFixed(2)}</span></div>
        {order.total - order.amountPaid > 0.01 && (
          <div className="flex justify-between text-sm font-bold"><span className="text-slate-500">Balance Due</span><span className="text-red-500">{(order.total - order.amountPaid).toFixed(2)}</span></div>
        )}
      </div>
    </div>
  );
}

function PaymentsView({ order }: { order: SaleOrder }) {
  return (
    <div className="max-w-md space-y-3">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="text-sm font-semibold text-slate-800 mb-3">Payment Summary</div>
        <div className="space-y-2">
          <Row label="Order Total"    value={order.total.toFixed(2)} />
          <Row label="Amount Paid"    value={order.amountPaid.toFixed(2)} color="text-green-600" />
          <Row label="Balance Due"    value={(order.total - order.amountPaid).toFixed(2)} color="text-red-500" bold />
        </div>
      </div>
      <div className="bg-slate-100 rounded-xl p-4 text-xs text-slate-500">
        Use the "Record Payment" button above to log a payment received.
      </div>
    </div>
  );
}
function Row({ label, value, color = 'text-slate-700', bold = false }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? 'border-t border-slate-100 pt-2 font-bold' : ''}`}>
      <span className="text-slate-500">{label}</span><span className={color}>{value}</span>
    </div>
  );
}

// ─── New Order Modal ──────────────────────────────────────────────────────────
function NewOrderModal({ customers, onAddCustomer, onSave, onClose }: {
  customers: Customer[];
  onAddCustomer: (c: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  onSave: (o: Omit<SaleOrder, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '');
  const [newCustName, setNewCustName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [taxPct, setTaxPct] = useState('');
  const [discountAmt, setDiscountAmt] = useState('');
  const [lines, setLines] = useState<OrderLine[]>([{ id: uuidv4(), description: '', qty: 1, unit: 'kg', unitPrice: 0 }]);
  const [useNewCust, setUseNewCust] = useState(customers.length === 0);

  const orderNum = `ORD-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Math.floor(Math.random() * 900) + 100)}`;
  const total = calcTotal(lines, parseFloat(taxPct) || 0, parseFloat(discountAmt) || 0);
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  function addLine() { setLines(l => [...l, { id: uuidv4(), description: '', qty: 1, unit: 'kg', unitPrice: 0 }]); }
  function removeLine(id: string) { setLines(l => l.filter(x => x.id !== id)); }
  function updateLine(id: string, patch: Partial<OrderLine>) { setLines(l => l.map(x => x.id === id ? { ...x, ...patch } : x)); }

  function save() {
    let custId = customerId;
    let custName = customers.find(c => c.id === customerId)?.name ?? '';
    if (useNewCust && newCustName.trim()) {
      const c = onAddCustomer({ name: newCustName.trim(), type: 'individual' });
      custId = c.id; custName = c.name;
    }
    onSave({
      orderNumber: orderNum, customerId: custId, customerName: custName, date, dueDate: dueDate || undefined,
      status: 'draft', paymentStatus: 'unpaid', lines, subtotal, taxPct: parseFloat(taxPct) || undefined,
      discountAmt: parseFloat(discountAmt) || undefined, total, amountPaid: 0,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="font-bold text-slate-900">New Sale Order</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Customer */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Customer</label>
            {customers.length > 0 && !useNewCust ? (
              <div className="flex gap-2">
                <select className={INP} value={customerId} onChange={e => setCustomerId(e.target.value)}>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={() => setUseNewCust(true)} className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 whitespace-nowrap">New</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input className={INP + ' flex-1'} placeholder="Customer name" value={newCustName} onChange={e => setNewCustName(e.target.value)} />
                {customers.length > 0 && <button onClick={() => setUseNewCust(false)} className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50">Existing</button>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Date</label>
              <input type="date" className={INP} value={date} onChange={e => setDate(e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Due Date (opt.)</label>
              <input type="date" className={INP} value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
          </div>

          {/* Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600">Line Items</label>
              <button onClick={addLine} className="text-xs text-emerald-600 hover:underline">+ Add line</button>
            </div>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={l.id} className="grid grid-cols-12 gap-1.5 items-center">
                  <input className={INP + ' col-span-5'} placeholder="Description" value={l.description} onChange={e => updateLine(l.id, { description: e.target.value })} />
                  <input type="number" className={INP + ' col-span-2'} placeholder="Qty" value={l.qty || ''} onChange={e => updateLine(l.id, { qty: parseFloat(e.target.value) || 0 })} />
                  <input className={INP + ' col-span-2'} placeholder="Unit" value={l.unit} onChange={e => updateLine(l.id, { unit: e.target.value })} />
                  <input type="number" step="any" className={INP + ' col-span-2'} placeholder="Price" value={l.unitPrice || ''} onChange={e => updateLine(l.id, { unitPrice: parseFloat(e.target.value) || 0 })} />
                  {lines.length > 1 && <button onClick={() => removeLine(l.id)} className="col-span-1 text-slate-300 hover:text-red-400"><X className="w-3.5 h-3.5 mx-auto" /></button>}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Tax %</label>
              <input type="number" step="any" className={INP} placeholder="0" value={taxPct} onChange={e => setTaxPct(e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Discount Amount</label>
              <input type="number" step="any" className={INP} placeholder="0.00" value={discountAmt} onChange={e => setDiscountAmt(e.target.value)} /></div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 text-sm">
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-slate-900 mt-1 pt-1 border-t border-slate-200"><span>Total</span><span>{total.toFixed(2)}</span></div>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={lines.every(l => !l.description.trim())}
            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
            Create Order
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Customer Modal ────────────────────────────────────────────────────────
function AddCustomerModal({ onSave, onClose }: { onSave: (c: Omit<Customer, 'id' | 'createdAt'>) => void; onClose: () => void }) {
  const [form, setForm] = useState<Omit<Customer, 'id' | 'createdAt'>>({ name: '', type: 'individual' });
  function set(k: keyof typeof form, v: any) { setForm(f => ({ ...f, [k]: v })); }
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Add Customer</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Name *</label><input className={INP} value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
            <select className={INP} value={form.type} onChange={e => set('type', e.target.value)}>
              {(['individual', 'business', 'wholesale', 'export'] as CustomerType[]).map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Phone</label><input className={INP} placeholder="+260…" value={form.phone ?? ''} onChange={e => set('phone', e.target.value || undefined)} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label><input type="email" className={INP} value={form.email ?? ''} onChange={e => set('email', e.target.value || undefined)} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Address</label><textarea className={INP + ' resize-none'} rows={2} value={form.address ?? ''} onChange={e => set('address', e.target.value || undefined)} /></div>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600">Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.name.trim()}
            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">Add</button>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ order, onSave, onClose }: { order: SaleOrder; onSave: (amount: number) => void; onClose: () => void }) {
  const outstanding = order.total - order.amountPaid;
  const [amount, setAmount] = useState(String(outstanding.toFixed(2)));
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Record Payment</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-600">
            Outstanding: <span className="font-bold text-red-500">{outstanding.toFixed(2)}</span>
          </div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Amount Received</label>
            <input type="number" step="any" className={INP} value={amount} onChange={e => setAmount(e.target.value)} /></div>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600">Cancel</button>
          <button onClick={() => onSave(parseFloat(amount) || 0)} disabled={!amount || parseFloat(amount) <= 0}
            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">Record</button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const INP = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400';

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  const c: Record<string, string> = { green: 'text-green-700', red: 'text-red-500', blue: 'text-blue-600', slate: 'text-slate-500' };
  return (
    <div className="bg-slate-50 rounded-xl p-2.5 text-center">
      <div className={`text-sm font-bold ${c[color] ?? c.slate}`}>{value}</div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function EmptyMsg({ icon, msg }: { icon: React.ReactNode; msg: string }) {
  return (
    <div className="text-center py-12 text-slate-400">
      <div className="w-8 h-8 mx-auto mb-3 opacity-25">{icon}</div>
      <p className="text-sm">{msg}</p>
    </div>
  );
}
