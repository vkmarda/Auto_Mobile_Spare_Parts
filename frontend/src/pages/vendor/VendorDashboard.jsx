import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Inbox, CheckCircle } from 'lucide-react';
import {
  getAllOrders, acceptOrder, rejectOrder,
  getStats, bulkAcceptOrders, getSalesChart, getProductStats,
  getLastDispatchesByCity, getCityStats, getReturnsSummary,
} from '../../api/vendor.api';
import PendingActionsByCity from '../../components/PendingActionsByCity';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
  AreaChart, Area, ResponsiveContainer, Tooltip,
} from 'recharts';
import StatCard from '../../components/StatCard';
import VendorOrderCard, { COLS, COLS_NO_CB } from '../../components/VendorOrderCard';
import Skeleton from '../../components/Skeleton';

const STATUS_CARDS = [
  { key: 'all',             label: 'All Orders',  bg: 'bg-gray-50',    text: 'text-gray-700',   border: 'border-l-gray-400',   activeBg: 'bg-gray-100',   ring: 'ring-gray-300'   },
  { key: 'pending',         label: 'Pending',     bg: 'bg-indigo-50',   text: 'text-indigo-800',  border: 'border-l-indigo-400',  activeBg: 'bg-indigo-100',  ring: 'ring-indigo-300'  },
  { key: 'accepted',        label: 'Accepted',    bg: 'bg-sky-50',     text: 'text-sky-800',    border: 'border-l-sky-400',    activeBg: 'bg-sky-100',    ring: 'ring-sky-300'    },
  { key: 'rejected',        label: 'Rejected',    bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-l-red-400',    activeBg: 'bg-red-100',    ring: 'ring-red-300'    },
  { key: 'dispatched',      label: 'Dispatched',  bg: 'bg-violet-50',  text: 'text-violet-800', border: 'border-l-violet-400', activeBg: 'bg-violet-100', ring: 'ring-violet-300' },
  { key: 'delivered',       label: 'Delivered',   bg: 'bg-teal-50',    text: 'text-teal-800',   border: 'border-l-teal-400',   activeBg: 'bg-teal-100',   ring: 'ring-teal-300'   },
  { key: 'confirmed',       label: 'Confirmed',   bg: 'bg-green-50',   text: 'text-green-800',  border: 'border-l-green-500',  activeBg: 'bg-green-100',  ring: 'ring-green-300'  },
  { key: 'return_requested',label: 'Returns',     bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-l-orange-400', activeBg: 'bg-orange-100', ring: 'ring-orange-300' },
];

const RANK_COLORS = ['text-amber-500', 'text-slate-400', 'text-amber-700'];
const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#6366f1'];

const Spinner = () => (
  <div className="flex items-center justify-center h-full">
    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function VendorDashboard() {
  const [days, setDays]             = useState(7);
  const [stats, setStats]           = useState(null);
  const [chartData, setChartData]   = useState([]);
  const [productStats, setProductStats] = useState([]);
  const [cityStats, setCityStats]       = useState([]);
  const [returnsSummary, setReturnsSummary] = useState(null);
  const [orders, setOrders]         = useState([]);
  const [lastDispatchByCity, setLastDispatchByCity] = useState({});
  const [tab, setTab]               = useState('all');
  const [selected, setSelected]     = useState(new Set());
  const [loading, setLoading]       = useState(true);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [bulking, setBulking]       = useState(false);

  const ordersRef = useRef(null);

  const fetchStats = useCallback(async () => {
    setChartsLoading(true);
    try {
      await Promise.all([
        getStats(days).then(setStats),
        getSalesChart(days).then(setChartData),
        getProductStats(days).then(setProductStats),
        getCityStats(days).then(setCityStats),
        getReturnsSummary(days).then(setReturnsSummary),
      ]);
    } finally { setChartsLoading(false); }
  }, [days]);

  const fetchData = () => Promise.all([getAllOrders(), getLastDispatchesByCity()])
    .then(([o, ldc]) => { setOrders(o); setLastDispatchByCity(ldc); });

  useEffect(() => {
    Promise.all([fetchStats(), fetchData()]).then(() => setLoading(false));
  }, []);

  useEffect(() => { if (!loading) fetchStats(); }, [days]);

  const handleAccept = async (id) => { await acceptOrder(id); await fetchData(); };
  const handleReject = async (id, reason) => { await rejectOrder(id, reason); await fetchData(); };

  const RETURN_STATUSES = ['return_requested','return_accepted','return_dispatched','return_received','return_settled','return_cancelled'];
  const POST_ACCEPTED   = ['accepted','dispatched','delivered','confirmed',...RETURN_STATUSES];

  const counts = {
    all:              orders.length,
    pending:          orders.filter((o) => o.status === 'pending').length,
    accepted:         orders.filter((o) => POST_ACCEPTED.includes(o.status)).length,
    rejected:         orders.filter((o) => o.status === 'rejected').length,
    dispatched:       orders.filter((o) => ['dispatched','delivered','confirmed',...RETURN_STATUSES].includes(o.status)).length,
    delivered:        orders.filter((o) => ['delivered','confirmed',...RETURN_STATUSES].includes(o.status)).length,
    confirmed:        orders.filter((o) => ['confirmed',...RETURN_STATUSES].includes(o.status)).length,
    return_requested: orders.filter((o) => RETURN_STATUSES.includes(o.status)).length,
  };

  const trendPct    = (curr, prev) => (prev > 0 ? ((curr - prev) / prev) * 100 : null);
  const qtyTrend    = stats ? trendPct(stats.total_quantity, stats.prev_total_quantity) : null;
  const partsTrend  = stats ? trendPct(stats.unique_parts, stats.prev_unique_parts) : null;
  const qtySpark    = chartData.map((d) => d.total_qty);
  const decisionCount   = counts.accepted + counts.rejected;
  const fulfillmentRate = decisionCount > 0 ? Math.round((counts.accepted / decisionCount) * 100) : null;

  const TAB_STATUSES = {
    pending:          ['pending'],
    accepted:         POST_ACCEPTED,
    rejected:         ['rejected'],
    dispatched:       ['dispatched','delivered','confirmed',...RETURN_STATUSES],
    delivered:        ['delivered','confirmed',...RETURN_STATUSES],
    confirmed:        ['confirmed',...RETURN_STATUSES],
    return_requested: RETURN_STATUSES,
  };

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const filtered      = tab === 'all' ? orders : orders.filter((o) => TAB_STATUSES[tab]?.includes(o.status) ?? false);
  const showBulk      = tab === 'all' || tab === 'pending';

  const toggleSelect = (id, checked) => setSelected((prev) => {
    const next = new Set(prev); checked ? next.add(id) : next.delete(id); return next;
  });
  const selectAll = () => setSelected(new Set(pendingOrders.map((o) => o.id)));
  const clearSel  = () => setSelected(new Set());

  const handleBulk = async () => {
    setBulking(true);
    try { await bulkAcceptOrders([...selected]); clearSel(); await fetchData(); }
    finally { setBulking(false); }
  };

  if (loading) return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}
    </div>
  );

  const alerts = [
    counts.pending > 0 && {
      key: 'pending', label: `${counts.pending} order${counts.pending > 1 ? 's' : ''} need action`,
      onClick: () => { setTab('pending'); clearSel(); ordersRef.current?.scrollIntoView({ behavior: 'smooth' }); },
    }
  ].filter(Boolean);

  const top5byQty = [...productStats].slice(0, 5)
    .map((p) => ({ ...p, label: p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name }));

  const hasChartData = chartData.some((d) => d.total_qty > 0);
  const hasBarData   = top5byQty.length > 0;

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">

      {/* ── Hero: Pending Orders by City ── */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-sm"><Clock size={22} /></div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Pending Orders by City</h2>
              <p className="text-xs text-indigo-700 font-medium">
                {counts.pending > 0 ? `${counts.pending} order${counts.pending !== 1 ? 's' : ''} awaiting your action` : 'All caught up — no pending orders'}
              </p>
            </div>
          </div>
          <Link to="/vendor/pending"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
            View All Pending →
          </Link>
        </div>
        <PendingActionsByCity
          orders={orders}
          lastDispatchByCity={lastDispatchByCity}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      </div>

      {alerts.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex flex-wrap gap-2">
          {alerts.map((a) => (
            <button key={a.key} onClick={a.onClick}
              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-sm font-medium rounded-full px-3 py-1 transition-colors">
              {a.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Performance</h2>
        <div className="flex items-center gap-2">
          {Object.keys(lastDispatchByCity).length > 0 && (() => {
            const earliest = Math.min(...Object.values(lastDispatchByCity).map((d) => new Date(d).getTime()));
            const daysSince = Math.max(1, Math.floor((Date.now() - earliest) / 86400000));
            return (
              <button onClick={() => setDays(daysSince)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${days === daysSince ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                Since last dispatch
              </button>
            );
          })()}
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Unique Parts" value={stats?.unique_parts ?? '—'} iconType="parts" trend={partsTrend} />
        <StatCard title="Total Qty" value={stats?.total_quantity ?? '—'} iconType="qty" trend={qtyTrend} sparkData={qtySpark} />
        <StatCard title="Fulfillment Rate" value={fulfillmentRate !== null ? `${fulfillmentRate}%` : 'N/A'} iconType="rate" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-700">Daily Orders (qty)</p>
          <p className="text-xs text-gray-400">Last {days} days</p>
        </div>
        {chartsLoading ? <div className="h-[220px]"><Spinner /></div>
          : !hasChartData ? <div className="flex items-center justify-center h-[220px] text-sm text-gray-400">No orders in this period</div>
          : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="qtyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={32} />
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return <div className="bg-white border border-gray-200 rounded-lg p-2 text-xs shadow-sm"><p className="font-semibold text-gray-700 mb-1">{label}</p><p className="text-blue-600">{payload[0].value} units ordered</p></div>;
                }} />
                <Area type="monotone" dataKey="total_qty" stroke="#3b82f6" strokeWidth={2}
                  fill="url(#qtyGrad)" dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">Top Products by Quantity</p>
        {chartsLoading ? <div className="h-[260px]"><Spinner /></div>
          : !hasBarData ? <div className="flex items-center justify-center h-[260px] text-sm text-gray-400">No orders yet</div>
          : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={top5byQty} layout="vertical" margin={{ top: 4, right: 40, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return <div className="bg-white border border-gray-200 rounded-lg p-2 text-xs shadow-sm"><p className="font-semibold text-gray-800">{d.name}</p><p className="text-gray-600">{d.total_qty} units ordered</p></div>;
                }} />
                <Bar dataKey="total_qty" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={28}>
                  <LabelList dataKey="total_qty" position="right" style={{ fontSize: 11, fill: '#6b7280' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Order Status</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATUS_CARDS.map((card) => {
            const active = tab === card.key;
            return (
              <button key={card.key} onClick={() => { setTab(card.key); clearSel(); }}
                className={`text-left rounded-xl border border-l-4 px-4 py-4 cursor-pointer transition-all shadow-sm ${card.border} border-gray-200 ${active ? `${card.activeBg} ring-2 ${card.ring}` : `${card.bg} hover:opacity-90`}`}>
                <p className={`text-2xl font-bold ${card.text}`}>{counts[card.key] ?? 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div ref={ordersRef}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-900">All Orders</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-3">
            {showBulk && pendingOrders.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox"
                  checked={selected.size === pendingOrders.length && pendingOrders.length > 0}
                  onChange={(e) => e.target.checked ? selectAll() : clearSel()}
                  className="w-4 h-4 accent-indigo-600" />
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
          <div className="bg-white rounded-xl border border-gray-200 py-14 text-center">
            {tab === 'all'
              ? <Inbox size={32} className="mx-auto mb-3 text-gray-300" />
              : <CheckCircle size={32} className="mx-auto mb-3 text-green-400" />}
            <p className="text-sm font-semibold text-gray-700">{tab === 'all' ? 'No orders yet' : `No ${tab} orders`}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="hidden md:grid px-4 py-2 gap-x-3 text-xs font-medium text-gray-500 border-l-4 border-l-transparent"
              style={{ gridTemplateColumns: showBulk ? COLS : COLS_NO_CB }}>
              {showBulk && <div />}<span>Retailer</span><span>Phone</span><span>Date</span>
              <span>Units</span><span>Location</span><span>Status</span><span>Action</span><span />
            </div>
            {filtered.map((order) => (
              <VendorOrderCard key={order.id} order={order}
                onAccept={handleAccept} onReject={handleReject}
                checkable={order.status === 'pending' && showBulk}
                checked={selected.has(order.id)} onCheck={toggleSelect}
                showCheckCol={showBulk} />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-semibold text-gray-900">Most Recent Retailers</h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">Last {days}d</span>
        </div>
        {!stats?.top_retailers?.length ? <p className="text-sm text-gray-400">No orders in this period.</p> : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[320px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-xs text-gray-500 font-medium">
                    {['#', 'Retailer', 'Location', 'Orders', 'Last Order'].map((h, i) => (
                      <th key={h} className={`px-4 py-3 ${i >= 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.top_retailers.map((r, i) => (
                    <tr key={r.name + i} className="border-b border-gray-100 last:border-0">
                      <td className={`px-4 py-3 text-sm font-bold ${RANK_COLORS[i] || 'text-gray-400'}`}>#{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                      <td className="px-4 py-3 text-gray-500">{[r.city, r.state].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{r.order_count}</td>
                      <td className="px-4 py-3 text-right text-xs text-gray-400">
                        {r.last_order_at ? new Date(r.last_order_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── City-wise Sales ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-700">Sales by City</p>
          <p className="text-xs text-gray-400">Last {days} days</p>
        </div>
        {chartsLoading ? <div className="h-[220px]"><Spinner /></div>
          : cityStats.length === 0
            ? <div className="flex items-center justify-center h-[220px] text-sm text-gray-400">No city data in this period</div>
            : (
              <ResponsiveContainer width="100%" height={Math.max(160, cityStats.length * 40)}>
                <BarChart data={cityStats} layout="vertical" margin={{ top: 4, right: 48, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="city" width={90} tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return <div className="bg-white border border-gray-200 rounded-lg p-2 text-xs shadow-sm"><p className="font-semibold text-gray-800">{d.city}</p><p className="text-gray-600">{d.total_qty} units · {d.order_count} orders</p></div>;
                  }} />
                  <Bar dataKey="total_qty" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24}>
                    <LabelList dataKey="total_qty" position="right" style={{ fontSize: 11, fill: '#6b7280' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
      </div>

      {/* ── Returns Summary ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-semibold text-gray-900">Returns Summary</h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">Last {days}d</span>
        </div>
        {chartsLoading || !returnsSummary
          ? <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          : returnsSummary.total === 0
            ? <p className="text-sm text-gray-400">No returns in this period.</p>
            : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[
                  { label: 'Requested',  value: returnsSummary.requested,  bg: 'bg-indigo-50',  text: 'text-indigo-700'  },
                  { label: 'Accepted',   value: returnsSummary.accepted,   bg: 'bg-sky-50',     text: 'text-sky-700'     },
                  { label: 'Dispatched', value: returnsSummary.dispatched, bg: 'bg-violet-50',  text: 'text-violet-700'  },
                  { label: 'Received',   value: returnsSummary.received,   bg: 'bg-blue-50',    text: 'text-blue-700'    },
                  { label: 'Settled',    value: returnsSummary.settled,    bg: 'bg-green-50',   text: 'text-green-700'   },
                  { label: 'Cancelled',  value: returnsSummary.cancelled,  bg: 'bg-red-50',     text: 'text-red-600'     },
                ].map(({ label, value, bg, text }) => (
                  <div key={label} className={`${bg} rounded-xl px-3 py-4 text-center border border-gray-100`}>
                    <p className={`text-2xl font-bold ${text}`}>{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
            )}
      </div>

    </div>
  );
}
