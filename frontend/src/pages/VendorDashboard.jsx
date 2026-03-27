import { useEffect, useState, useCallback } from 'react';
import { getDemand, getAllOrders, acceptOrder, rejectOrder, getStats, bulkAcceptOrders } from '../api/vendor.api';
import StatCard from '../components/StatCard';
import OrderCard from '../components/OrderCard';

const STATUS_CARDS = [
  { key: 'all',      label: 'All Orders', bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-400',   activeBg: 'bg-gray-200',   ring: 'ring-gray-400'   },
  { key: 'pending',  label: 'Pending',    bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-400', activeBg: 'bg-yellow-200', ring: 'ring-yellow-400' },
  { key: 'accepted', label: 'Accepted',   bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-400',  activeBg: 'bg-green-200',  ring: 'ring-green-400'  },
  { key: 'rejected', label: 'Rejected',   bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-400',    activeBg: 'bg-red-200',    ring: 'ring-red-400'    },
];

export default function VendorDashboard() {
  const [days, setDays]         = useState(7);
  const [stats, setStats]       = useState(null);
  const [demand, setDemand]     = useState([]);
  const [orders, setOrders]     = useState([]);
  const [tab, setTab]           = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading]   = useState(true);
  const [bulking, setBulking]   = useState(false);

  const fetchStats  = useCallback(() => getStats(days).then(setStats), [days]);
  const fetchOrders = () => Promise.all([getAllOrders(), getDemand()])
    .then(([o, d]) => { setOrders(o); setDemand(d); });

  useEffect(() => {
    Promise.all([fetchStats(), fetchOrders()]).then(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStats(); }, [days]);

  const handleAccept = async (id) => { await acceptOrder(id); await fetchOrders(); };
  const handleReject = async (id) => { await rejectOrder(id); await fetchOrders(); };

  const counts = {
    all:      orders.length,
    pending:  orders.filter((o) => o.status === 'pending').length,
    accepted: orders.filter((o) => o.status === 'accepted').length,
    rejected: orders.filter((o) => o.status === 'rejected').length,
  };
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const filtered      = tab === 'all' ? orders : orders.filter((o) => o.status === tab);
  const showBulk      = tab === 'all' || tab === 'pending';

  const toggleSelect = (id, checked) => setSelected((prev) => {
    const next = new Set(prev);
    checked ? next.add(id) : next.delete(id);
    return next;
  });
  const selectAll = () => setSelected(new Set(pendingOrders.map((o) => o.id)));
  const clearSel  = () => setSelected(new Set());

  const handleBulk = async () => {
    setBulking(true);
    try { await bulkAcceptOrders([...selected]); clearSel(); await fetchOrders(); }
    finally { setBulking(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-16">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">

      {/* Stats */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Sales" value={stats ? `₹${parseFloat(stats.total_sales).toLocaleString('en-IN', {minimumFractionDigits:2})}` : '—'} icon="💰" color="blue" />
          <StatCard title="Total Order Qty" value={stats?.total_quantity ?? '—'} icon="📦" color="purple" />
          <StatCard title="Unique Parts" value={stats?.unique_parts ?? '—'} icon="🔩" color="orange" />
          <StatCard title="Retailers Ordered" value={stats?.unique_retailers ?? '—'} icon="🏪" color="green" />
        </div>
      </div>

      {/* Demand */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">
          Pending Demand {demand.length > 0 && <span className="text-gray-400 font-normal">({demand.length} products)</span>}
        </h2>
        {demand.length === 0 ? (
          <p className="text-sm text-gray-400">No pending demand.</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Product','SKU','Unit Price','Pending Qty'].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-gray-600 font-medium ${i > 1 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {demand.map((r) => (
                  <tr key={r.id} className={`border-b border-gray-100 last:border-0 ${parseInt(r.total_quantity_pending) > 10 ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                    <td className="px-4 py-3 text-gray-500">{r.sku}</td>
                    <td className="px-4 py-3 text-right">₹{parseFloat(r.unit_price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{r.total_quantity_pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Status Summary */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">Order Status Summary</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATUS_CARDS.map((card) => {
            const active = tab === card.key;
            return (
              <button key={card.key} onClick={() => { setTab(card.key); clearSel(); }}
                className={`text-left rounded-xl border-l-4 px-4 py-4 cursor-pointer transition-all shadow-sm
                  ${card.border}
                  ${active ? `${card.activeBg} ring-2 ${card.ring}` : `${card.bg} hover:${card.activeBg}`}
                `}>
                <p className={`text-3xl font-bold ${card.text}`}>{counts[card.key]}</p>
                <p className={`text-sm font-medium mt-1 ${card.text}`}>{card.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">
            All Orders <span className="text-gray-400 font-normal">({filtered.length})</span>
          </h2>
          <div className="flex items-center gap-3">
            {showBulk && pendingOrders.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox"
                  checked={selected.size === pendingOrders.length && pendingOrders.length > 0}
                  onChange={(e) => e.target.checked ? selectAll() : clearSel()}
                  className="w-4 h-4 accent-blue-600" />
                Select All Pending
              </label>
            )}
            {selected.size > 0 && (
              <button onClick={handleBulk} disabled={bulking}
                className="text-sm bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg font-medium flex items-center gap-2">
                {bulking && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Accept Selected ({selected.size})
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">{tab === 'all' ? 'No orders yet.' : `No ${tab} orders.`}</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} showRetailerName
                onAccept={handleAccept} onReject={handleReject}
                checkable={order.status === 'pending' && showBulk}
                checked={selected.has(order.id)}
                onCheck={toggleSelect} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
