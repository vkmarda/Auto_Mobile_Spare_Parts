import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOrders, getOrderById } from '../api/orders.api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const BORDER = {
  pending:    'border-l-yellow-400',
  accepted:   'border-l-green-500',
  dispatched: 'border-l-blue-400',
  delivered:  'border-l-emerald-500',
  rejected:   'border-l-red-400',
};

const TABS = [
  { key: 'all',        label: 'All',        emoji: '📦' },
  { key: 'pending',    label: 'Pending',    emoji: '⏳' },
  { key: 'accepted',   label: 'Accepted',   emoji: '✅' },
  { key: 'dispatched', label: 'Dispatched', emoji: '🚚' },
  { key: 'delivered',  label: 'Received',   emoji: '📬' },
  { key: 'rejected',   label: 'Rejected',   emoji: '❌' },
];

const EMPTY = {
  all:        { emoji: '📦', msg: "You haven't placed any orders yet.", sub: 'Start by browsing products.', link: true },
  pending:    { emoji: '⏳', msg: 'No pending orders right now.',        sub: null, link: false },
  accepted:   { emoji: '✅', msg: 'No accepted orders yet.',             sub: null, link: false },
  dispatched: { emoji: '🚚', msg: 'No dispatched orders.',               sub: null, link: false },
  delivered:  { emoji: '📬', msg: 'No received orders yet.',             sub: null, link: false },
  rejected:   { emoji: '❌', msg: 'No rejected orders.',                 sub: null, link: false },
};

const COLS = '110px 1fr 120px 1fr 110px 130px';

/* ── Status badge ────────────────────────────────── */
function Badge({ status }) {
  const LABELS = { delivered: 'Received' };
  const label = LABELS[status] || status.charAt(0).toUpperCase() + status.slice(1);
  const cls = {
    pending:    'bg-yellow-100 text-yellow-700',
    accepted:   'bg-green-100 text-green-700',
    dispatched: 'bg-blue-100 text-blue-700',
    delivered:  'bg-emerald-100 text-emerald-700',
    rejected:   'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${cls[status] || 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  );
}

/* ── Status timeline (4 steps) ───────────────────── */
function StatusTimeline({ status }) {
  const STEP = { pending: 0, accepted: 1, dispatched: 2, delivered: 3, rejected: 0 };
  const current = STEP[status] ?? 0;
  const isRejected = status === 'rejected';

  const dotCls = (idx) => {
    if (isRejected && idx === 1) return 'bg-red-500 border-red-400';
    if (idx < current)  return 'bg-green-500 border-green-500';
    if (idx === current) return 'bg-blue-500 border-blue-500';
    return 'bg-white border-gray-300';
  };
  const lineCls = (idx) => {
    if (isRejected && idx === 0) return 'bg-red-300';
    if (idx < current) return 'bg-green-400';
    return 'bg-gray-200';
  };
  const labelCls = (idx) => {
    if (isRejected && idx === 1) return 'text-red-400';
    if (idx <= current) return 'text-gray-600';
    return 'text-gray-300';
  };
  const LABELS = ['Placed', isRejected ? 'Rejected' : 'Confirmed', 'Dispatched', 'Received'];
  const filled  = (idx) => idx <= current || (isRejected && idx === 1);

  return (
    <div className="flex items-start gap-0">
      {LABELS.map((label, idx) => (
        <div key={label} className="flex items-start">
          <div className="flex flex-col items-center">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${dotCls(idx)}`}>
              {filled(idx) && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <span className={`text-xs mt-1 whitespace-nowrap ${labelCls(idx)}`}>{label}</span>
          </div>
          {idx < LABELS.length - 1 && (
            <div className={`h-0.5 mt-2 mx-1 ${lineCls(idx)}`} style={{ width: 22 }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Loading skeleton ────────────────────────────── */
function Skeleton() {
  return (
    <div className="bg-white rounded-xl h-16 animate-pulse border border-gray-100 border-l-4 border-l-gray-200" />
  );
}

/* ── Order card ──────────────────────────────────── */
function OrderCard({ order }) {
  const navigate      = useNavigate();
  const { addToCart } = useCart();
  const [expanded, setExpanded]           = useState(false);
  const [details, setDetails]             = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reordering, setReordering]       = useState(false);

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
      let data = details;
      if (!data) {
        data = await getOrderById(order.id);
        setDetails(data);
      }
      data.items.forEach((item) =>
        addToCart(
          { id: item.product_id, name: item.product_name, sku: item.sku, vendor_id: data.vendor_id, vendor_name: data.vendor_name },
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
    ? `${order.item_count} item${order.item_count != 1 ? 's' : ''}`
    : names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2} more` : '');

  const date    = fmtDate(order.created_at);
  const daysDiff = Math.floor((Date.now() - new Date(order.created_at)) / 86400000);
  const age     = daysDiff === 0 ? 'Today' : `${daysDiff}d ago`;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 overflow-hidden ${BORDER[order.status] || 'border-l-gray-300'}`}>

      {/* ── Mobile card (< md) ── */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono font-bold text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">{order.order_number}</span>
              <Badge status={order.status} />
            </div>
            <p className="text-sm font-semibold text-gray-900">{order.vendor_name || '—'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{preview} · {date}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button onClick={handleReorder} disabled={reordering}
            className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50 font-medium">
            {reordering ? 'Adding…' : 'Reorder'}
          </button>
          <button onClick={toggle} className="text-xs text-blue-600 hover:underline font-medium">
            {expanded ? 'Hide ↑' : 'Details →'}
          </button>
        </div>
      </div>

      {/* ── Desktop grid row (≥ md) ── */}
      <div className="hidden md:grid px-4 py-3 items-center gap-x-3"
        style={{ gridTemplateColumns: COLS }}>
        <span className="font-mono font-bold text-sm bg-gray-100 text-gray-800 px-2 py-0.5 rounded truncate">
          {order.order_number}
        </span>
        <p className="text-sm font-semibold text-gray-900 truncate">{order.vendor_name || '—'}</p>
        <div>
          <p className="text-xs text-gray-500">{date}</p>
          <p className="text-xs text-gray-400">{age}</p>
        </div>
        <p className="text-sm text-gray-500 truncate">{preview}</p>
        <div><Badge status={order.status} /></div>
        <div className="flex items-center gap-2 justify-end">
          <button onClick={handleReorder} disabled={reordering}
            className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50 font-medium">
            {reordering ? 'Adding…' : 'Reorder'}
          </button>
          <button onClick={toggle} className="text-xs text-blue-600 hover:underline whitespace-nowrap">
            {expanded ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {/* ── Expanded section ── */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
          {detailLoading || !details ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <StatusTimeline status={order.status} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[300px]">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-200">
                      <th className="text-left pb-2">Product</th>
                      <th className="text-left pb-2 hidden sm:table-cell">SKU</th>
                      <th className="text-right pb-2">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-1.5 text-gray-800">{item.product_name}</td>
                        <td className="py-1.5 text-gray-500 text-xs hidden sm:table-cell">{item.sku}</td>
                        <td className="py-1.5 text-right">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {details.notes && (
                <p className="text-xs text-gray-500 italic">📝 {details.notes}</p>
              )}
            </div>
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
    all:        orders.length,
    pending:    orders.filter((o) => o.status === 'pending').length,
    accepted:   orders.filter((o) => o.status === 'accepted').length,
    dispatched: orders.filter((o) => o.status === 'dispatched').length,
    delivered:  orders.filter((o) => o.status === 'delivered').length,
    rejected:   orders.filter((o) => o.status === 'rejected').length,
  };

  const filtered = tab === 'all' ? orders : orders.filter((o) => o.status === tab);
  const empty    = EMPTY[tab];

  if (loading) return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto space-y-3">
      <div className="h-7 w-28 bg-gray-200 rounded animate-pulse mb-5" />
      <div className="flex gap-3 mb-5">
        {[...Array(3)].map((_, i) => <div key={i} className="h-9 w-32 bg-gray-100 rounded-full animate-pulse" />)}
      </div>
      {[...Array(4)].map((_, i) => <Skeleton key={i} />)}
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto">

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
        <div className="space-y-1.5">
          <div className="hidden md:grid px-4 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide gap-x-3"
            style={{ gridTemplateColumns: COLS }}>
            <span>Order</span><span>Vendor</span><span>Date</span>
            <span>Items</span><span>Status</span><span />
          </div>
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

    </div>
  );
}
