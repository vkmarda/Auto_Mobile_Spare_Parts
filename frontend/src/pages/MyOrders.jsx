import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOrders, getOrderById } from '../api/orders.api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const fmt = (v) =>
  parseFloat(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const BORDER = {
  pending:  'border-l-yellow-400',
  accepted: 'border-l-green-500',
  rejected: 'border-l-red-400',
};

const TABS = [
  { key: 'all',      label: 'All',      emoji: '📦' },
  { key: 'pending',  label: 'Pending',  emoji: '⏳' },
  { key: 'accepted', label: 'Accepted', emoji: '✅' },
  { key: 'rejected', label: 'Rejected', emoji: '❌' },
];

const EMPTY = {
  all:      { emoji: '📦', msg: "You haven't placed any orders yet.", sub: 'Start by browsing products.', link: true },
  pending:  { emoji: '⏳', msg: 'No pending orders right now.',       sub: null,                           link: false },
  accepted: { emoji: '✅', msg: 'No accepted orders yet.',            sub: null,                           link: false },
  rejected: { emoji: '❌', msg: 'No rejected orders.',                sub: null,                           link: false },
};

/* ── Status timeline ─────────────────────────────── */
function StatusTimeline({ status }) {
  const isPending  = status === 'pending';
  const isAccepted = status === 'accepted';
  const isRejected = status === 'rejected';

  const s2Dot  = isPending  ? 'bg-yellow-400 border-yellow-400'
               : isAccepted ? 'bg-green-500 border-green-500'
               :               'bg-red-500 border-red-400';
  const s3Dot  = isAccepted ? 'bg-green-500 border-green-500'
               : isRejected ? 'bg-red-500 border-red-400'
               :               'bg-white border-gray-300';
  const line1  = isPending  ? 'bg-yellow-300'
               : isAccepted ? 'bg-green-400'
               :               'bg-red-400';
  const line2  = isAccepted ? 'bg-green-400'
               : isRejected ? 'bg-red-400'
               :               'bg-gray-200';
  const s3Text = isAccepted ? 'text-green-600'
               : isRejected ? 'text-red-400'
               :               'text-gray-400';
  const s3Label = isAccepted ? 'Confirmed' : isRejected ? 'Rejected' : 'Pending…';

  const Dot = ({ cls, filled }) => (
    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${cls}`}>
      {filled && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
    </div>
  );

  return (
    <div className="flex items-start gap-0">
      <div className="flex flex-col items-center">
        <Dot cls="bg-blue-500 border-blue-500" filled />
        <span className="text-xs text-gray-400 mt-1 whitespace-nowrap">Placed</span>
      </div>
      <div className={`h-0.5 mt-2 mx-1 ${line1}`} style={{ width: 28 }} />
      <div className="flex flex-col items-center">
        <Dot cls={s2Dot} filled />
        <span className="text-xs text-gray-400 mt-1 whitespace-nowrap">Review</span>
      </div>
      <div className={`h-0.5 mt-2 mx-1 ${line2}`} style={{ width: 28 }} />
      <div className="flex flex-col items-center">
        <Dot cls={s3Dot} filled={isAccepted || isRejected} />
        <span className={`text-xs mt-1 whitespace-nowrap ${s3Text}`}>{s3Label}</span>
      </div>
    </div>
  );
}

/* ── Status badge ────────────────────────────────── */
function Badge({ status }) {
  const cls = {
    pending:  'bg-yellow-100 text-yellow-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${cls[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/* ── Loading skeleton ────────────────────────────── */
function Skeleton() {
  return (
    <div className="bg-white rounded-xl h-28 animate-pulse border border-gray-100 overflow-hidden border-l-4 border-l-gray-200 p-4 space-y-3">
      <div className="flex gap-3">
        <div className="h-5 w-20 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
        <div className="h-5 w-20 bg-gray-100 rounded ml-auto" />
      </div>
      <div className="h-4 w-3/4 bg-gray-100 rounded" />
      <div className="h-4 w-1/2 bg-gray-100 rounded" />
    </div>
  );
}

/* ── Order card ──────────────────────────────────── */
function OrderCard({ order }) {
  const navigate        = useNavigate();
  const { addToCart }   = useCart();
  const [expanded, setExpanded]       = useState(false);
  const [details, setDetails]         = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reordering, setReordering]   = useState(false);

  const toggle = async () => {
    if (!expanded && !details) {
      setDetailLoading(true);
      try { setDetails(await getOrderById(order.id)); }
      finally { setDetailLoading(false); }
    }
    setExpanded((v) => !v);
  };

  const handleReorder = async () => {
    setReordering(true);
    try {
      let items = details?.items;
      if (!items) {
        const data = await getOrderById(order.id);
        setDetails(data);
        items = data.items;
      }
      items.forEach((item) =>
        addToCart(
          { id: item.product_id, name: item.product_name, sku: item.sku, unit_price: item.unit_price },
          item.quantity
        )
      );
      navigate('/cart');
    } finally {
      setReordering(false);
    }
  };

  const names   = Array.isArray(order.product_names) ? order.product_names : [];
  const preview = names.length === 0
    ? null
    : names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2} more` : '');

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden border-l-4 ${BORDER[order.status] || 'border-l-gray-300'} ${order.status === 'rejected' ? 'bg-red-50' : ''}`}>

      {/* Top row */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2 flex-wrap">
        <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-sm">{order.order_number}</span>
        <Badge status={order.status} />
        <span className="ml-auto text-xs text-gray-400 whitespace-nowrap">{fmtDate(order.created_at)}</span>
      </div>

      {/* Middle row: item summary + amount */}
      <div className="px-4 pb-3 flex items-center gap-3">
        <p className="text-sm text-gray-600 min-w-0 flex-1 truncate">
          <span className="font-medium text-gray-700">{order.item_count} item{order.item_count != 1 ? 's' : ''}</span>
          {preview && <span className="text-gray-400"> · {preview}</span>}
        </p>
        <span className="text-base font-bold text-gray-900 shrink-0">₹{fmt(order.total_amount)}</span>
      </div>

      {/* Timeline row */}
      <div className="px-4 pb-3 flex items-end justify-between gap-4 flex-wrap">
        <StatusTimeline status={order.status} />
        <button onClick={handleReorder} disabled={reordering}
          className="text-xs text-blue-500 underline hover:text-blue-700 disabled:opacity-50 shrink-0">
          {reordering ? 'Adding…' : 'Reorder'}
        </button>
      </div>

      {/* Rejected message */}
      {order.status === 'rejected' && (
        <p className="px-4 pb-3 text-xs text-red-400 italic">
          This order was not accepted. Place a new order to try again.
        </p>
      )}

      {/* Expand toggle */}
      <button onClick={toggle}
        className="w-full text-xs text-blue-500 hover:text-blue-700 px-4 py-2.5 border-t border-gray-100 flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors">
        {expanded ? '▲ Hide Items' : '▼ View Items'}
      </button>

      {/* Expanded items */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          {detailLoading || !details ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[300px]">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-gray-400 bg-gray-100 rounded">
                      <th className="text-left px-2 py-2 rounded-l-lg">Product</th>
                      <th className="text-left px-2 py-2 hidden sm:table-cell">SKU</th>
                      <th className="text-right px-2 py-2">Qty</th>
                      <th className="text-right px-2 py-2 hidden sm:table-cell">Unit Price</th>
                      <th className="text-right px-2 py-2 rounded-r-lg">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 px-2 text-gray-800">{item.product_name}</td>
                        <td className="py-2 px-2 text-gray-500 text-xs hidden sm:table-cell">{item.sku}</td>
                        <td className="py-2 px-2 text-right">{item.quantity}</td>
                        <td className="py-2 px-2 text-right text-gray-600 hidden sm:table-cell">₹{fmt(item.unit_price)}</td>
                        <td className="py-2 px-2 text-right font-medium">
                          ₹{fmt(item.quantity * parseFloat(item.unit_price))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex items-start justify-between gap-3 flex-wrap">
                {details.notes && (
                  <p className="text-xs text-gray-500 italic">📝 {details.notes}</p>
                )}
                <p className="text-sm font-bold text-gray-900 ml-auto">
                  Order Total: ₹{fmt(details.total_amount)}
                </p>
              </div>

              {order.status === 'rejected' && (
                <div className="mt-3 flex justify-end">
                  <button onClick={handleReorder} disabled={reordering}
                    className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5">
                    {reordering && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {reordering ? 'Adding to cart…' : 'Reorder these items →'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────── */
export default function MyOrders() {
  const { user }              = useAuth();
  const [orders, setOrders]   = useState([]);
  const [tab, setTab]         = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders().then((data) => { setOrders(data); setLoading(false); });
  }, []);

  const counts = {
    all:      orders.length,
    pending:  orders.filter((o) => o.status === 'pending').length,
    accepted: orders.filter((o) => o.status === 'accepted').length,
    rejected: orders.filter((o) => o.status === 'rejected').length,
  };

  const totalSpent   = orders
    .filter((o) => o.status === 'accepted')
    .reduce((s, o) => s + parseFloat(o.total_amount), 0);

  const filtered = tab === 'all' ? orders : orders.filter((o) => o.status === tab);
  const empty    = EMPTY[tab];

  if (loading) return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-2xl mx-auto space-y-3">
      <div className="h-7 w-28 bg-gray-200 rounded animate-pulse mb-5" />
      <div className="flex gap-3 mb-5">
        {[...Array(3)].map((_, i) => <div key={i} className="h-9 w-32 bg-gray-100 rounded-full animate-pulse" />)}
      </div>
      {[...Array(3)].map((_, i) => <Skeleton key={i} />)}
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
        {user?.city && (
          <p className="text-sm text-gray-400 mt-0.5">
            📍 {[user.city, user.state].filter(Boolean).join(', ')}
          </p>
        )}
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm font-medium shadow-sm text-gray-700">
          Total Orders: <span className="font-bold text-gray-900">{orders.length}</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm font-medium shadow-sm text-gray-700">
          Total Spent: <span className="font-bold text-green-600">₹{fmt(totalSpent)}</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm font-medium shadow-sm text-gray-700">
          Pending: <span className="font-bold text-yellow-600">{counts.pending} order{counts.pending !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="overflow-x-auto mb-5">
        <div className="bg-white rounded-xl shadow-sm p-1 inline-flex gap-1 min-w-full sm:min-w-0">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                tab === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {label}
              <span className={`text-xs font-bold rounded-full px-1.5 py-0.5 ${
                tab === key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders list / empty state */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">{empty.emoji}</p>
          <p className="font-semibold text-gray-700 mb-1">{empty.msg}</p>
          {empty.sub && <p className="text-sm text-gray-400 mb-4">{empty.sub}</p>}
          {empty.link && (
            <Link to="/order/vehicle-type"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
              Browse Products
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

    </div>
  );
}
