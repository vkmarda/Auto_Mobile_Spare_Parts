import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllOrders, acceptOrder, rejectOrder, bulkAcceptOrders, partialAcceptOrder } from '../../api/vendor.api';
import { getReturns, acceptReturn, settleReturn } from '../../api/returns.api';
import VendorOrderCard, { COLS_NO_CB } from '../../components/VendorOrderCard';
import Skeleton from '../../components/Skeleton';
import { useToast } from '../../context/ToastContext';
import { Clock, Check, Truck, RotateCcw, Inbox, CheckCircle } from 'lucide-react';

const STAT_CARDS = [
  { key: 'pending',    icon: Clock,      label: 'Need Action',   sub: 'Pending orders',    iconCls: 'text-indigo-600', iconBg: 'bg-indigo-100',  numCls: 'text-indigo-700',  stripe: 'bg-indigo-400'  },
  { key: 'accepted',   icon: Check,      label: 'Accepted',      sub: 'Ready to dispatch', iconCls: 'text-sky-600',    iconBg: 'bg-sky-100',     numCls: 'text-sky-700',     stripe: 'bg-sky-400'    },
  { key: 'dispatched', icon: Truck,      label: 'In Transit',    sub: 'Out for delivery',  iconCls: 'text-violet-600', iconBg: 'bg-violet-100',  numCls: 'text-violet-700',  stripe: 'bg-violet-400' },
  { key: 'returns',    icon: RotateCcw,  label: 'Returns',       sub: 'Awaiting review',   iconCls: 'text-orange-600', iconBg: 'bg-orange-100',  numCls: 'text-orange-700',  stripe: 'bg-orange-400' },
];

function StatCard({ icon: Icon, label, sub, value, iconBg, iconCls, numCls, stripe }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={`h-1 w-full ${stripe}`} />
      <div className="p-4 sm:p-5 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${iconCls}`}>
          <Icon size={20} />
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

function ReturnConfirmModal({ action, ret, onConfirm, onCancel, loading }) {
  const isAccept = action === 'accept';
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">
          {isAccept ? 'Accept Return?' : 'Settle Return?'}
        </h2>
        <div className="bg-gray-50 rounded-lg border border-gray-100 px-4 py-3 mb-5 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Return</span>
            <span className="font-mono font-bold text-indigo-700">{ret.return_number}</span>
          </div>
          {ret.order_number && (
            <div className="flex justify-between">
              <span className="text-gray-500">Order</span>
              <span className="font-mono text-gray-600">{ret.order_number}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Retailer</span>
            <span className="font-medium text-gray-800">{ret.retailer_name}</span>
          </div>
          {ret.reason && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-500 shrink-0">Reason</span>
              <span className="text-gray-600 italic text-right">"{ret.reason}"</span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${isAccept ? 'bg-sky-600 hover:bg-sky-700' : 'bg-green-600 hover:bg-green-700'}`}>
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? 'Processing…' : isAccept ? 'Accept Return' : 'Settle Return'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VendorPending() {
  const { user }            = useAuth();
  const showToast           = useToast();
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState(null);
  const [confirmAcceptAll, setConfirmAcceptAll] = useState(false);
  const [confirmReturn, setConfirmReturn] = useState(null); // { action, ret }

  useEffect(() => { load(); }, []);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const [o, r] = await Promise.all([getAllOrders(), getReturns()]);
      setOrders(o); setReturns(r);
    } finally { if (!silent) setLoading(false); }
  }

  async function act(fn, ...args) {
    setActing(args[0]);
    try { await fn(...args); await load(true); } finally { setActing(null); }
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
          {pending.length > 0 && <span className="ml-2 text-indigo-600 font-medium">· {pending.length} order{pending.length !== 1 ? 's' : ''} need action</span>}
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
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pending.length > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
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
            <CheckCircle size={32} className="mx-auto mb-3 text-green-400" />
            <p className="text-sm font-semibold text-gray-700">All caught up</p>
            <p className="text-xs text-gray-400 mt-1">No pending orders right now</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="hidden md:grid px-4 py-2 gap-x-3 text-xs font-medium text-gray-500 border-l-4 border-l-transparent"
              style={{ gridTemplateColumns: COLS_NO_CB }}>
              <span>Retailer</span><span>Phone</span><span>Date</span>
              <span>Units</span><span>Location</span><span>Status</span><span>Action</span><span />
            </div>
            {pending.map((o) => (
              <VendorOrderCard key={o.id} order={o}
                onAccept={(id) => act(acceptOrder, id)}
                onReject={(id, reason) => act(rejectOrder, id, reason)}
                onPartialAccept={(id, data) => act(partialAcceptOrder, id, data)} />
            ))}
          </div>
        )}
      </section>

      {/* Accept All confirm modal */}
      {confirmAcceptAll && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={22} className="text-green-600" strokeWidth={3} />
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
              <button onClick={async () => { const n = pending.length; setConfirmAcceptAll(false); await act(bulkAcceptOrders, pending.map((o) => o.id)); showToast(`${n} order${n !== 1 ? 's' : ''} accepted · all pending`); }}
                disabled={!!acting}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold">
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmReturn && (
        <ReturnConfirmModal
          action={confirmReturn.action}
          ret={confirmReturn.ret}
          onConfirm={async () => {
            const fn  = confirmReturn.action === 'accept' ? acceptReturn : settleReturn;
            const ret = confirmReturn.ret;
            const msg = confirmReturn.action === 'accept'
              ? `${ret.return_number} accepted · ${ret.retailer_name}${ret.order_number ? ` (↩ ${ret.order_number})` : ''}`
              : `${ret.return_number} settled · ${ret.retailer_name}`;
            setConfirmReturn(null);
            await act(fn, confirmReturn.ret.id);
            showToast(msg);
          }}
          onCancel={() => setConfirmReturn(null)}
          loading={acting === confirmReturn.ret.id}
        />
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
              <CheckCircle size={32} className="mx-auto mb-3 text-green-400" />
              <p className="text-sm font-semibold text-gray-700">No pending returns</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingReturns.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-4">
                  <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg">{r.return_number}</span>
                    {r.order_number && (
                      <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit"><RotateCcw size={10} />{r.order_number}</span>
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
                    <button onClick={() => setConfirmReturn({ action: 'accept', ret: r })} disabled={!!acting}
                      className="text-sm bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition-colors">
                      Accept
                    </button>
                    <button onClick={() => setConfirmReturn({ action: 'settle', ret: r })} disabled={!!acting}
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
