import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllOrders, acceptOrder, rejectOrder, bulkAcceptOrders } from '../../api/vendor.api';
import { getReturns, acceptReturn, settleReturn } from '../../api/returns.api';
import VendorOrderCard, { COLS } from '../../components/VendorOrderCard';
import Skeleton from '../../components/Skeleton';

const STAT_CARDS = [
  { key: 'pending',    icon: '⏳', label: 'Need Action',   sub: 'Pending orders',    iconBg: 'bg-amber-100',  numCls: 'text-amber-700',  stripe: 'bg-amber-400'  },
  { key: 'accepted',   icon: '✓',  label: 'Accepted',      sub: 'Ready to dispatch', iconBg: 'bg-sky-100',    numCls: 'text-sky-700',    stripe: 'bg-sky-400'    },
  { key: 'dispatched', icon: '🚚', label: 'In Transit',    sub: 'Out for delivery',  iconBg: 'bg-violet-100', numCls: 'text-violet-700', stripe: 'bg-violet-400' },
  { key: 'returns',    icon: '↩',  label: 'Returns',       sub: 'Awaiting review',   iconBg: 'bg-orange-100', numCls: 'text-orange-700', stripe: 'bg-orange-400' },
];

function StatCard({ icon, label, sub, value, iconBg, numCls, stripe }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={`h-1 w-full ${stripe}`} />
      <div className="p-4 sm:p-5 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-2xl font-bold leading-none ${numCls}`}>{value}</p>
          <p className="text-sm font-semibold text-gray-700 mt-1">{label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, badge, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-blue-600 rounded-full" />
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>
        {badge}
      </div>
      {action}
    </div>
  );
}

export default function VendorPending() {
  const { user }            = useAuth();
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState(null);
  const [confirmAcceptAll, setConfirmAcceptAll] = useState(false);

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

  const pending        = orders.filter((o) => o.status === 'pending');
  const accepted       = orders.filter((o) => o.status === 'accepted');
  const dispatched     = orders.filter((o) => o.status === 'dispatched');
  const pendingReturns = returns.filter((r) => r.status === 'return_requested');

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const statValues = { pending: pending.length, accepted: accepted.length, dispatched: dispatched.length, returns: pendingReturns.length };

  if (loading) return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{greeting}, {user.name.split(' ')[0]}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {pending.length > 0 && <span className="ml-2 text-amber-600 font-medium">· {pending.length} order{pending.length !== 1 ? 's' : ''} need action</span>}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {STAT_CARDS.map((c) => (
          <StatCard key={c.key} icon={c.icon} label={c.label} sub={c.sub}
            value={statValues[c.key]} iconBg={c.iconBg} numCls={c.numCls} />
        ))}
      </div>

      {/* Pending orders */}
      <section>
        <SectionHeader
          title="Pending Orders"
          badge={
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pending.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
              {pending.length}
            </span>
          }
          action={pending.length > 0 && (
            <button onClick={() => setConfirmAcceptAll(true)} disabled={!!acting}
              className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition-colors">
              Accept All ({pending.length})
            </button>
          )}
        />
        {pending.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-14 text-center">
            <p className="text-3xl mb-3">✅</p>
            <p className="text-sm font-semibold text-gray-700">All caught up</p>
            <p className="text-xs text-gray-400 mt-1">No pending orders right now</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="hidden md:grid px-4 py-2 gap-x-3 text-xs font-medium text-gray-500"
              style={{ gridTemplateColumns: COLS }}>
              <div /><span>Order</span><span>Phone</span><span>Retailer</span>
              <span>Date</span><span>Units</span><span>Location</span>
              <span>Status</span><span>Action</span><span />
            </div>
            {pending.map((o) => (
              <VendorOrderCard key={o.id} order={o}
                onAccept={(id) => act(acceptOrder, id)}
                onReject={(id, reason) => act(rejectOrder, id, reason)} />
            ))}
          </div>
        )}
      </section>

      {/* Accept All confirm modal */}
      {confirmAcceptAll && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">✓</span>
            </div>
            <h2 className="text-base font-bold text-gray-900 text-center mb-1">Accept All Pending Orders?</h2>
            <p className="text-sm text-gray-500 text-center mb-5">
              This will accept all <span className="font-semibold text-gray-800">{pending.length} orders</span> at once.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAcceptAll(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => { setConfirmAcceptAll(false); act(bulkAcceptOrders, pending.map((o) => o.id)); }}
                disabled={!!acting}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold">
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return requests */}
      <section>
        <SectionHeader
          title="Pending Returns"
          badge={
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pendingReturns.length > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
              {pendingReturns.length}
            </span>
          }
        />
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {pendingReturns.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-3xl mb-3">✅</p>
              <p className="text-sm font-semibold text-gray-700">No pending returns</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingReturns.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-4">
                  <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                    <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">{r.return_number}</span>
                    {r.order_number && (
                      <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">↩ {r.order_number}</span>
                    )}
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-gray-800">{r.retailer_name}</span>
                      {r.city && <span className="text-xs text-gray-400 ml-2">{r.city}</span>}
                    </div>
                    {r.reason && (
                      <span className="text-xs text-gray-500 italic truncate max-w-[200px]">"{r.reason}"</span>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => act(acceptReturn, r.id)} disabled={acting === r.id}
                      className="text-sm bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition-colors">
                      Accept
                    </button>
                    <button onClick={() => act(settleReturn, r.id)} disabled={acting === r.id}
                      className="text-sm bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition-colors">
                      Settle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
