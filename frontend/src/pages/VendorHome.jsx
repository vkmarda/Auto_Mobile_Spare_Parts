import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllOrders, acceptOrder, rejectOrder } from '../api/vendor.api';
import { getOrderById } from '../api/orders.api';

const fmt = (v) =>
  parseFloat(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function OrderRow({ o, acting, onAccept, onReject }) {
  const [expanded, setExpanded]           = useState(false);
  const [details, setDetails]             = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const age      = Math.floor((Date.now() - new Date(o.created_at)) / 86400000);
  const ageLabel = age === 0 ? 'Today' : `${age}d ago`;
  const location = [o.retailer_city, o.retailer_state].filter(Boolean).join(', ');

  const handleView = async () => {
    if (!expanded && !details) {
      setLoadingDetails(true);
      try { setDetails(await getOrderById(o.id)); }
      finally { setLoadingDetails(false); }
    }
    setExpanded((v) => !v);
  };

  return (
    <div className="px-4 py-4">
      {/* Row 1: order number + retailer name + amount + age */}
      <div className="flex items-center justify-between gap-4 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono font-bold text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded shrink-0">
            {o.order_number}
          </span>
          <p className="text-sm font-bold text-gray-900 truncate">{o.retailer_name}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-base font-bold text-gray-900">₹{fmt(o.total_amount)}</span>
          <span className="text-xs text-gray-400">{ageLabel}</span>
        </div>
      </div>

      {/* Row 2: metadata + actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
          {o.retailer_mobile && <span>📱 {o.retailer_mobile}</span>}
          {location          && <span>📍 {location}</span>}
          {o.item_count      && <span>📦 {o.item_count} item{o.item_count > 1 ? 's' : ''}</span>}
          <span className="text-gray-300">·</span>
          <span>{fmtDate(o.created_at)}</span>
        </div>
        <div className="flex gap-2 shrink-0">
          {onAccept && (
            <>
              <button disabled={acting === o.id} onClick={() => onAccept(o.id)}
                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-40">
                Accept
              </button>
              <button disabled={acting === o.id} onClick={() => onReject(o.id)}
                className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-medium hover:bg-red-200 disabled:opacity-40">
                Reject
              </button>
            </>
          )}
          <button onClick={handleView}
            className="text-xs text-blue-600 hover:underline px-2 py-1.5 font-medium">
            {expanded ? 'Hide ↑' : 'View →'}
          </button>
        </div>
      </div>

      {/* Inline detail */}
      {expanded && (
        <div className="mt-3 bg-gray-50 rounded-lg p-3">
          {loadingDetails || !details ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-xs mb-2 min-w-[320px]">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-200">
                    <th className="text-left pb-1.5 font-medium">Product</th>
                    <th className="text-left pb-1.5 font-medium hidden sm:table-cell">SKU</th>
                    <th className="text-right pb-1.5 font-medium">Qty</th>
                    <th className="text-right pb-1.5 font-medium hidden sm:table-cell">Unit Price</th>
                    <th className="text-right pb-1.5 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {details.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-1.5 text-gray-800">{item.product_name}</td>
                      <td className="py-1.5 text-gray-500 hidden sm:table-cell">{item.sku}</td>
                      <td className="py-1.5 text-right">{item.quantity}</td>
                      <td className="py-1.5 text-right text-gray-600 hidden sm:table-cell">₹{fmt(item.unit_price)}</td>
                      <td className="py-1.5 text-right font-medium">
                        ₹{fmt(item.quantity * parseFloat(item.unit_price))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <div className="flex justify-between items-center pt-1">
                {details.notes && <p className="text-xs text-gray-500 italic">Note: {details.notes}</p>}
                <p className="text-sm font-bold text-gray-900 ml-auto">Total: ₹{fmt(details.total_amount)}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function VendorHome() {
  const { user }          = useAuth();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setOrders(await getAllOrders()); } finally { setLoading(false); }
  }

  async function handleAccept(id) {
    setActing(id);
    try { await acceptOrder(id); await load(); } finally { setActing(null); }
  }

  async function handleReject(id) {
    setActing(id);
    try { await rejectOrder(id); await load(); } finally { setActing(null); }
  }

  const pending  = orders.filter((o) => o.status === 'pending');
  const accepted = orders.filter((o) => o.status === 'accepted');
  const rejected = orders.filter((o) => o.status === 'rejected');

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-xl h-16 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">{greeting}, {user.name.split(' ')[0]}</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-yellow-700">{pending.length}</p>
          <p className="text-sm text-yellow-600 mt-0.5">Pending</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-700">{accepted.length}</p>
          <p className="text-sm text-green-600 mt-0.5">Accepted</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-red-700">{rejected.length}</p>
          <p className="text-sm text-red-600 mt-0.5">Rejected</p>
        </div>
      </div>

      {/* Pending orders */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Needs Attention — Pending Orders
        </h2>
        {pending.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
            <p className="text-4xl mb-2">✅</p>
            <p className="text-sm font-medium text-green-700">All caught up! No pending orders.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {pending.map((o) => (
              <OrderRow key={o.id} o={o} acting={acting}
                onAccept={handleAccept} onReject={handleReject} />
            ))}
          </div>
        )}
      </section>

      {/* Accepted orders */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Accepted Orders</h2>
        {accepted.length === 0 ? (
          <p className="text-sm text-gray-400 py-1">No accepted orders.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {accepted.map((o) => (
              <OrderRow key={o.id} o={o} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
