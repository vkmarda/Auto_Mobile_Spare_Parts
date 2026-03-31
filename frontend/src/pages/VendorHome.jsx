import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllOrders, acceptOrder, rejectOrder } from '../api/vendor.api';
import VendorOrderCard, { COLS } from '../components/VendorOrderCard';

export default function VendorHome() {
  const { user }          = useAuth();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setOrders(await getAllOrders()); } finally { setLoading(false); }
  }

  async function handleAccept(id) { await acceptOrder(id); await load(); }
  async function handleReject(id) { await rejectOrder(id); await load(); }

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

  const colHeader = (
    <div className="hidden md:grid px-4 py-1.5 gap-x-3 text-xs font-medium text-gray-400 uppercase tracking-wide"
      style={{ gridTemplateColumns: COLS }}>
      <div /><span>Order</span><span>Phone</span><span>Retailer</span>
      <span>Date</span><span>Items</span><span>Location</span>
      <span>Status</span><span />
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
          <div className="space-y-1.5">
            {colHeader}
            {pending.map((o) => (
              <VendorOrderCard key={o.id} order={o}
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
          <div className="space-y-1.5">
            {colHeader}
            {accepted.map((o) => (
              <VendorOrderCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
