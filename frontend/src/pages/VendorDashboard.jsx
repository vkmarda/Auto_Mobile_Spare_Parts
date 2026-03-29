import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getDemand, getAllOrders, acceptOrder, rejectOrder,
  getStats, bulkAcceptOrders, getSalesChart, getProductStats,
} from '../api/vendor.api';
import { getProducts } from '../api/products.api';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
  AreaChart, Area,
} from 'recharts';
import StatCard from '../components/StatCard';
import VendorOrderCard, { COLS } from '../components/VendorOrderCard';

const STATUS_CARDS = [
  { key: 'all',      label: 'All Orders', bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-400',   activeBg: 'bg-gray-200',   ring: 'ring-gray-400'   },
  { key: 'pending',  label: 'Pending',    bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-400', activeBg: 'bg-yellow-200', ring: 'ring-yellow-400' },
  { key: 'accepted', label: 'Accepted',   bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-400',  activeBg: 'bg-green-200',  ring: 'ring-green-400'  },
  { key: 'rejected', label: 'Rejected',   bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-400',    activeBg: 'bg-red-200',    ring: 'ring-red-400'    },
];

const MEDALS  = ['🥇', '🥈', '🥉'];
const COLORS  = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#6366f1'];

const Spinner = () => (
  <div className="flex items-center justify-center h-full">
    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function VendorDashboard() {
  const [days, setDays]             = useState(7);
  const [stats, setStats]           = useState(null);
  const [chartData, setChartData]   = useState([]);
  const [productStats, setProductStats] = useState([]);
  const [demand, setDemand]         = useState([]);
  const [orders, setOrders]         = useState([]);
  const [products, setProducts]     = useState([]);
  const [tab, setTab]               = useState('all');
  const [selected, setSelected]     = useState(new Set());
  const [loading, setLoading]       = useState(true);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [bulking, setBulking]       = useState(false);

  const ordersRef = useRef(null);
  const demandRef = useRef(null);

  const fetchStats = useCallback(async () => {
    setChartsLoading(true);
    try {
      await Promise.all([
        getStats(days).then(setStats),
        getSalesChart(days).then(setChartData),
        getProductStats(days).then(setProductStats),
      ]);
    } finally {
      setChartsLoading(false);
    }
  }, [days]);

  const fetchData = () => Promise.all([getAllOrders(), getDemand(), getProducts()])
    .then(([o, d, p]) => { setOrders(o); setDemand(d); setProducts(p); });

  useEffect(() => {
    Promise.all([fetchStats(), fetchData()]).then(() => setLoading(false));
  }, []);

  useEffect(() => { if (!loading) fetchStats(); }, [days]);

  const handleAccept = async (id) => { await acceptOrder(id); await fetchData(); };
  const handleReject = async (id) => { await rejectOrder(id); await fetchData(); };

  const counts = {
    all:      orders.length,
    pending:  orders.filter((o) => o.status === 'pending').length,
    accepted: orders.filter((o) => o.status === 'accepted').length,
    rejected: orders.filter((o) => o.status === 'rejected').length,
  };

  const trendPct = (curr, prev) => (prev > 0 ? ((curr - prev) / prev) * 100 : null);
  const qtyTrend   = stats ? trendPct(stats.total_quantity, stats.prev_total_quantity) : null;
  const partsTrend = stats ? trendPct(stats.unique_parts, stats.prev_unique_parts) : null;

  const qtySpark   = chartData.map((d) => d.total_qty);

  const decisionCount   = counts.accepted + counts.rejected;
  const fulfillmentRate = decisionCount > 0 ? Math.round((counts.accepted / decisionCount) * 100) : null;

  const lowStockProducts = products.filter((p) => p.stock < 10);
  const pendingOrders    = orders.filter((o) => o.status === 'pending');
  const filtered         = tab === 'all' ? orders : orders.filter((o) => o.status === tab);
  const showBulk         = tab === 'all' || tab === 'pending';

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
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-xl h-16 animate-pulse" />
      ))}
    </div>
  );

  const alerts = [
    counts.pending > 0 && {
      key: 'pending',
      label: `⚠️ ${counts.pending} order${counts.pending > 1 ? 's' : ''} pending action`,
      onClick: () => { setTab('pending'); clearSel(); ordersRef.current?.scrollIntoView({ behavior: 'smooth' }); },
    },
    lowStockProducts.length > 0 && {
      key: 'stock',
      label: `🔴 ${lowStockProducts.length} part${lowStockProducts.length > 1 ? 's' : ''} low on stock`,
      onClick: () => demandRef.current?.scrollIntoView({ behavior: 'smooth' }),
    },
  ].filter(Boolean);

  const top5byQty = [...productStats].slice(0, 5)
    .map((p) => ({ ...p, label: p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name }));

  const hasChartData    = chartData.some((d) => d.total_qty > 0);
  const hasPieData      = productStats.length > 0;
  const hasBarData      = top5byQty.length > 0;

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Alert Bar */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-wrap gap-2">
          {alerts.map((a) => (
            <button key={a.key} onClick={a.onClick}
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-medium rounded-full px-3 py-1 transition-colors">
              {a.label}
            </button>
          ))}
        </div>
      )}

      {/* SECTION 1 — Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Unique Parts"
          value={stats?.unique_parts ?? '—'}
          iconType="parts" trend={partsTrend} />
        <StatCard title="Total Qty"
          value={stats?.total_quantity ?? '—'}
          iconType="qty" trend={qtyTrend} sparkData={qtySpark} />
        <StatCard title="Fulfillment Rate"
          value={fulfillmentRate !== null ? `${fulfillmentRate}%` : 'N/A'}
          iconType="rate" />
      </div>

      {/* SECTION 2 — Pie + Bar side by side */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-6">

          {/* Left: Pie */}
          <div className="w-full sm:w-[45%]">
            <p className="text-sm font-semibold text-gray-700 mb-3">Orders by Product (qty)</p>
            {chartsLoading ? <div className="h-[260px]"><Spinner /></div>
              : !hasPieData ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-gray-400">No sales data</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={productStats} dataKey="total_qty" nameKey="name"
                      cx="50%" cy="50%" outerRadius={100} paddingAngle={2}
                      outerRadius={75}
                      label={({ cx, cy, midAngle, outerRadius, percent, name }) => {
                        const RADIAN = Math.PI / 180;
                        const x = cx + (outerRadius + 18) * Math.cos(-midAngle * RADIAN);
                        const y = cy + (outerRadius + 18) * Math.sin(-midAngle * RADIAN);
                        return percent > 0.04 ? (
                          <text x={x} y={y} fill="#6b7280" fontSize={9} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                            {`${name} ${(percent * 100).toFixed(0)}%`}
                          </text>
                        ) : null;
                      }}
                      labelLine={{ stroke: '#d1d5db', strokeWidth: 1 }}>
                      {productStats.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg p-2 text-xs shadow-sm">
                            <p className="font-semibold text-gray-800 mb-1">{d.name}</p>
                            <p className="text-gray-600">Qty: {d.total_qty} units</p>
                          </div>
                        );
                      }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px bg-gray-100 self-stretch" />

          {/* Right: Horizontal Bar */}
          <div className="w-full sm:w-[55%]">
            <p className="text-sm font-semibold text-gray-700 mb-3">Top Products by Quantity</p>
            {chartsLoading ? <div className="h-[260px]"><Spinner /></div>
              : !hasBarData ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-gray-400">No orders yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={top5byQty} layout="vertical"
                    margin={{ top: 4, right: 40, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="label" width={90}
                      tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg p-2 text-xs shadow-sm">
                            <p className="font-semibold text-gray-800">{d.name}</p>
                            <p className="text-gray-600">{d.total_qty} units ordered</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="total_qty" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={28}>
                      <LabelList dataKey="total_qty" position="right"
                        style={{ fontSize: 11, fill: '#6b7280' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
          </div>
        </div>
      </div>

      {/* SECTION 3 — Daily Sales Area Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-700">Daily Orders (qty)</p>
          <p className="text-xs text-gray-400">Last {days} days</p>
        </div>
        {chartsLoading ? <div className="h-[220px]"><Spinner /></div>
          : !hasChartData ? (
            <div className="flex items-center justify-center h-[220px] text-sm text-gray-400">No orders in this period</div>
          ) : (
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
                <YAxis allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={32} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg p-2 text-xs shadow-sm">
                        <p className="font-semibold text-gray-700 mb-1">{label}</p>
                        <p className="text-blue-600">{payload[0].value} units ordered</p>
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="total_qty" stroke="#3b82f6" strokeWidth={2}
                  fill="url(#qtyGrad)" dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                  activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
      </div>

      {/* Pending Demand */}
      <div ref={demandRef}>
        <h2 className="text-base font-bold text-gray-900 mb-3">
          Pending Demand {demand.length > 0 && <span className="text-gray-400 font-normal">({demand.length} products)</span>}
        </h2>
        {demand.length === 0 ? (
          <p className="text-sm text-gray-400">No pending demand.</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[320px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Product', 'SKU', 'Pending Qty'].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-gray-600 font-medium ${i > 1 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {demand.map((r) => (
                  <tr key={r.id} className={`border-b border-gray-100 last:border-0 ${parseInt(r.total_quantity_pending) > 10 ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                    <td className="px-4 py-3 text-gray-500">{r.sku}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{r.total_quantity_pending}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td className="px-4 py-3 font-bold text-gray-900">Total</td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    {demand.reduce((s, r) => s + parseInt(r.total_quantity_pending), 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
            </div>
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
                className={`text-left rounded-xl border-l-4 px-4 py-3 cursor-pointer transition-all shadow-sm
                  ${card.border}
                  ${active ? `${card.activeBg} ring-2 ${card.ring}` : `${card.bg} hover:${card.activeBg}`}
                `}>
                <p className={`text-2xl font-bold ${card.text}`}>{counts[card.key]}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* All Orders */}
      <div ref={ordersRef}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
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
          <div className="space-y-1.5">
            <div className="hidden md:grid px-4 py-1.5 gap-x-3 text-xs font-medium text-gray-400 uppercase tracking-wide"
              style={{ gridTemplateColumns: COLS }}>
              <div /><span>Order</span><span>Phone</span><span>Retailer</span>
              <span>Date</span><span>Items</span><span>Location</span>
              <span>Status</span><span />
            </div>
            {filtered.map((order) => (
              <VendorOrderCard key={order.id} order={order}
                onAccept={handleAccept} onReject={handleReject}
                checkable={order.status === 'pending' && showBulk}
                checked={selected.has(order.id)}
                onCheck={toggleSelect} />
            ))}
          </div>
        )}
      </div>

      {/* Top Retailers */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">
          Top Retailers <span className="text-gray-400 font-normal text-sm">· Last {days} days</span>
        </h2>
        {!stats?.top_retailers?.length ? (
          <p className="text-sm text-gray-400">No orders in this period.</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[320px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Rank', 'Retailer Name', 'Location', 'Orders'].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-gray-600 font-medium ${i >= 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.top_retailers.map((r, i) => (
                  <tr key={r.name + i} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-lg">{MEDALS[i] || `#${i + 1}`}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                    <td className="px-4 py-3 text-gray-500">{[r.city, r.state].filter(Boolean).join(', ') || '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{r.order_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
