import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllOrders, acceptOrder, rejectOrder, bulkAcceptOrders } from '../../api/vendor.api';
import { getReturns, acceptReturn, settleReturn } from '../../api/returns.api';
import VendorOrderCard, { COLS } from '../../components/VendorOrderCard';

function StatPill({ label, value, color }) {
  return (
    <div className={`flex-1 rounded-xl p-3 text-center border ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-0.5">{label}</p>
    </div>
  );
}

export default function VendorHome() {
  const { user }            = useAuth();
  const navigate            = useNavigate();
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [o, r] = await Promise.all([getAllOrders(), getReturns()]);
      setOrders(o); setReturns(r);
    } finally { setLoading(false); }
  }

  async function act(fn, ...args) {
    setActing(args[0]);
    try { await fn(...args); await load(); } finally { setActing(null); }
  }

  const pending   = orders.filter((o) => o.status === 'pending');
  const accepted  = orders.filter((o) => o.status === 'accepted');
  const dispatched = orders.filter((o) => o.status === 'dispatched');
  const pendingReturns = returns.filter((r) => r.status === 'return_requested');
  const recentOrders = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

  const acceptedByCity = {};
  for (const o of accepted) {
    const city = o.retailer_city || 'Unknown';
    if (!acceptedByCity[city]) acceptedByCity[city] = { city, state: o.retailer_state, count: 0 };
    acceptedByCity[city].count++;
  }

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-3">
      {[...Array(5)].map((_, i) => <div key={i} className="bg-gray-100 rounded-xl h-14 animate-pulse" />)}
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{greeting}, {user.name.split(' ')[0]}</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Quick stats */}
      <div className="flex gap-3">
        <StatPill label="Pending"    value={pending.length}      color="bg-yellow-50 border-yellow-200 text-yellow-700" />
        <StatPill label="Accepted"   value={accepted.length}     color="bg-blue-50 border-blue-200 text-blue-700" />
        <StatPill label="Dispatched" value={dispatched.length}   color="bg-purple-50 border-purple-200 text-purple-700" />
        <StatPill label="Returns"    value={pendingReturns.length} color="bg-amber-50 border-amber-200 text-amber-700" />
      </div>

      {/* Section 1 — Needs Action */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Needs Your Attention</h2>

        {/* Pending orders */}
        <div className="bg-grey rounded-xl border border-gray-200 shadow-sm mb-4 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pending.length > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
              {pending.length} orders pending
            </span>
            {pending.length > 0 && (
              <button
                onClick={() => act(bulkAcceptOrders, pending.map((o) => o.id))}
                disabled={!!acting}
                className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50">
                Accept All
              </button>
            )}
          </div>
          {pending.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-green-600 font-medium text-sm">✅ No pending orders</p>
            </div>
          ) : (
            <>
              <div className="hidden md:grid px-4 py-2 gap-x-3 text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50"
                style={{ gridTemplateColumns: COLS }}>
                <div /><span>Order</span><span>Phone</span><span>Retailer</span>
                <span>Date</span><span>Units</span><span>Location</span>
                <span>Status</span><span>Action</span><span />
              </div>
              {pending.map((o, i) => (
                <div key={o.id} className={i < pending.length - 1 ? 'border-b border-gray-100' : ''}>
                  <VendorOrderCard order={o}
                    onAccept={(id) => act(acceptOrder, id)}
                    onReject={(id) => act(rejectOrder, id)} />
                </div>
              ))}
            </>
          )}
        </div>

        {/* Return requests */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pendingReturns.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
              {pendingReturns.length} return requests
            </span>
          </div>
          {pendingReturns.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-green-600 font-medium text-sm">✅ No pending returns</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingReturns.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
                  <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{r.return_number}</span>
                  <span className="text-sm font-medium text-gray-800">{r.retailer_name}</span>
                  <span className="text-xs text-gray-400">{r.city}</span>
                  <span className="text-xs text-gray-500 italic truncate max-w-[160px]">{r.reason}</span>
                  <div className="ml-auto flex gap-2">
                    <button onClick={() => act(acceptReturn, r.id)} disabled={acting === r.id}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50">
                      Accept
                    </button>
                    <button onClick={() => act(settleReturn, r.id)} disabled={acting === r.id}
                      className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg font-medium disabled:opacity-50">
                      Settle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section 2 — Ready to Dispatch */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Ready to Dispatch</h2>
          {accepted.length > 0 && (
            <button onClick={() => navigate('/vendor/dispatch')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-xl">
              Create Dispatch →
            </button>
          )}
        </div>
        {accepted.length === 0 ? (
          <p className="text-sm text-gray-400">No accepted orders ready for dispatch.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.values(acceptedByCity).map((g) => (
              <div key={g.city} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="font-semibold text-gray-900 truncate">{g.city}</p>
                {g.state && <p className="text-xs text-gray-400">{g.state}</p>}
                <p className="text-2xl font-bold text-blue-600 mt-1">{g.count}</p>
                <p className="text-xs text-blue-500">orders</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 3 — Recent Activity */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Recent Orders</h2>
          <button onClick={() => navigate('/vendor/dashboard')}
            className="text-xs text-blue-600 hover:underline font-medium">View All →</button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 p-4">No orders yet.</p>
          ) : (
            <>
              <div className="hidden md:grid px-4 py-2 gap-x-3 text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50"
                style={{ gridTemplateColumns: COLS }}>
                <div /><span>Order</span><span>Phone</span><span>Retailer</span>
                <span>Date</span><span>Units</span><span>Location</span>
                <span>Status</span><span>Action</span><span />
              </div>
              {recentOrders.map((o, i) => (
                <div key={o.id} className={i < recentOrders.length - 1 ? 'border-b border-gray-100' : ''}>
                  <VendorOrderCard order={o}
                    onAccept={(id) => act(acceptOrder, id)}
                    onReject={(id) => act(rejectOrder, id)} />
                </div>
              ))}
            </>
          )}
        </div>
      </section>

    </div>
  );
}
