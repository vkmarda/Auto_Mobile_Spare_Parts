import { useState, useEffect, useMemo } from 'react';
import { getAllOrders } from '../../api/vendor.api';
import { getReturns } from '../../api/returns.api';
import { getOrderDetail } from '../../api/detail.api';
import StatusBadge from '../../components/StatusBadge';
import DetailModal from '../../components/DetailModal';
import { printOrders } from '../../utils/printOrders';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUSES = [
  { key: 'all',        label: 'All' },
  { key: 'pending',    label: 'Pending' },
  { key: 'accepted',   label: 'Accepted' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'delivered',  label: 'Delivered' },
  { key: 'confirmed',  label: 'Confirmed' },
  { key: 'returned',   label: 'Returned' },
];

const RETURN_STATUSES = new Set(['return_requested','return_accepted','return_dispatched','return_received','return_settled','return_cancelled']);

function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default function VendorOrders() {
  const [orders, setOrders]   = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus]   = useState('all');
  const [retailer, setRetailer] = useState('');
  const [city, setCity]       = useState('');
  const [numPrefix, setNumPrefix] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [detail, setDetail]     = useState(null);
  const [exporting, setExporting]   = useState(false);
  const [exporting2, setExporting2] = useState(false);

  useEffect(() => {
    Promise.all([getAllOrders(), getReturns()])
      .then(([o, r]) => { setOrders(o); setReturns(r); })
      .finally(() => setLoading(false));
  }, []);

  // Index returns by order_id for fast lookup
  const returnsByOrder = useMemo(() => {
    const map = {};
    for (const r of returns) {
      if (!map[r.order_id]) map[r.order_id] = [];
      map[r.order_id].push(r);
    }
    return map;
  }, [returns]);

  const retailers = useMemo(() => [...new Set(orders.map((o) => o.retailer_name))].sort(), [orders]);
  const cities    = useMemo(() => [...new Set(orders.map((o) => o.retailer_city).filter(Boolean))].sort(), [orders]);

  const filtered = useMemo(() => orders.filter((o) => {
    if (retailer && o.retailer_name !== retailer) return false;
    if (city && o.retailer_city !== city) return false;
    if (numPrefix) {
      const p = numPrefix.toUpperCase();
      const matchOrder  = o.order_number?.toUpperCase().startsWith(p);
      const matchReturn = (returnsByOrder[o.id] || []).some((r) => r.return_number?.toUpperCase().startsWith(p));
      if (!matchOrder && !matchReturn) return false;
    }
    if (dateFrom && new Date(o.created_at) < new Date(dateFrom)) return false;
    if (dateTo   && new Date(o.created_at) > new Date(dateTo + 'T23:59:59')) return false;
    if (status !== 'all') {
      if (status === 'returned') return RETURN_STATUSES.has(o.status);
      if (o.status !== status) return false;
    }
    return true;
  }), [orders, retailer, city, numPrefix, dateFrom, dateTo, status, returnsByOrder]);

  // Shared: fetch expanded rows for all filtered orders
  const buildRows = async () => {
    const result = [];
    for (const o of filtered) {
      const ret      = (returnsByOrder[o.id] || [])[0] || null;
      const retItems = ret?.items || [];
      let detail;
      try { detail = await getOrderDetail(o.id); } catch { detail = null; }
      result.push({ order: o, orderItems: detail?.items || [], ret, retItems });
    }
    return result;
  };

  const downloadCsv = async () => {
    setExporting(true);
    try {
      const esc   = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const phone = (v) => v ? `="${v}"` : '""';
      const B7 = Array(7).fill(esc('')), B6 = Array(6).fill(esc('')), B5 = Array(5).fill(esc(''));
      const header = ['Order No','Retailer','Mobile','City','State','Date','Order Status',
        'Brand','Model','Year','Product / Part','SKU','Qty',
        'Return No','Ret Brand','Ret Model','Ret Product / Part','Ret Qty','Return Status'].map(esc).join(',');
      const rows = [header];

      for (const { order: o, orderItems, ret, retItems } of await buildRows()) {
        const oH = [esc(o.order_number), esc(o.retailer_name), phone(o.retailer_mobile),
          esc(o.retailer_city||''), esc(o.retailer_state||''), esc(fmtDate(o.created_at)), esc(o.status)];
        if (orderItems.length === 0) {
          rows.push([...oH, ...B6, ...B5].join(','));
        } else {
          orderItems.forEach((item, idx) => {
            rows.push([...(idx===0?oH:B7),
              esc(item.vehicle_brand||''), esc(item.vehicle_model||''), esc(item.manufacture_year||''),
              esc(item.product_name ? `${item.product_name}${item.part_name?' · '+item.part_name:''}` : ''),
              esc(item.sku||''), esc(item.quantity), ...B5].join(','));
          });
        }
        if (ret && retItems.length > 0) {
          retItems.forEach((ri, idx) => {
            const brand   = ri.vehicle_brand || '';
            const model   = ri.vehicle_model || '';
            const product = ri.product_name || (brand ? `${brand} ${model}`.trim() : '');
            rows.push([...B7, ...B6,
              idx===0?esc(ret.return_number):esc(''), esc(brand), esc(model), esc(product), esc(ri.quantity),
              idx===0?esc(ret.status):esc('')].join(','));
          });
        } else if (ret) {
          rows.push([...B7, ...B6, esc(ret.return_number), esc(''), esc(''), esc(''), esc(''), esc(ret.status)].join(','));
        }
      }

      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `orders_${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  };

  const downloadPdf = async () => {
    setExporting2(true);
    try {
      const rows = await buildRows();
      const filters = [retailer, city, dateFrom && `From ${dateFrom}`, dateTo && `To ${dateTo}`].filter(Boolean).join(' · ');
      printOrders(rows, filters);
    } finally { setExporting2(false); }
  };

  const counts = useMemo(() => ({
    pending:    orders.filter((o) => o.status === 'pending').length,
    accepted:   orders.filter((o) => o.status === 'accepted').length,
    dispatched: orders.filter((o) => o.status === 'dispatched').length,
    delivered:  orders.filter((o) => o.status === 'delivered').length,
    confirmed:  orders.filter((o) => o.status === 'confirmed').length,
    returned:   orders.filter((o) => RETURN_STATUSES.has(o.status)).length,
  }), [orders]);

  const tabCount = (key) => key === 'all' ? orders.length : (counts[key] ?? 0);

  if (loading) return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto space-y-3">
      {[...Array(5)].map((_, i) => <div key={i} className="bg-gray-100 rounded-xl h-12 animate-pulse" />)}
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Orders</h1>
        <div className="flex items-center gap-2">
          <h2>Generate report</h2>
          <button onClick={downloadCsv} disabled={exporting || exporting2}
            className="text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 px-3 py-2 rounded-lg font-medium flex items-center gap-1.5">
            {exporting && <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />}
            {exporting ? 'Preparing…' : '↓ CSV'}
          </button>
          <button onClick={downloadPdf} disabled={exporting || exporting2}
            className="text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 px-3 py-2 rounded-lg font-medium flex items-center gap-1.5">
            {exporting2 && <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />}
            {exporting2 ? 'Preparing…' : '🖨 PDF'}
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="bg-white rounded-xl shadow-sm p-1 inline-flex gap-1 flex-wrap">
        {STATUSES.map(({ key, label }) => (
          <button key={key} onClick={() => setStatus(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              status === key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}>
            {label}
            <span className={`text-xs font-bold rounded-full px-1.5 py-0.5 ${status === key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {tabCount(key)}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={numPrefix} onChange={(e) => setNumPrefix(e.target.value)}
          placeholder="Order / Return no."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
        />
        <Select value={retailer} onChange={setRetailer} options={retailers} placeholder="All retailers" />
        <Select value={city}     onChange={setCity}     options={cities}    placeholder="All cities" />
        <div className="flex items-center gap-1.5">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {(retailer || city || numPrefix || dateFrom || dateTo) && (
          <button onClick={() => { setRetailer(''); setCity(''); setNumPrefix(''); setDateFrom(''); setDateTo(''); }}
            className="text-xs text-gray-400 hover:text-red-500 font-medium">
            Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-14 text-center">
          <p className="text-gray-400 text-sm">No orders match the current filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Order</th>
                  <th className="text-left px-4 py-3">Retailer</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">City</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Date</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Return</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((o) => {
                  const linked = returnsByOrder[o.id] || [];
                  const latestReturn = linked[0];
                  return (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{o.order_number}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{o.retailer_name}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">{o.retailer_city || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">{fmtDate(o.created_at)}</td>
                      <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-3">
                        {latestReturn ? (
                          <button onClick={() => setDetail({ type: 'return', id: latestReturn.id })}
                            className="font-mono text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded hover:bg-amber-100">
                            {latestReturn.return_number}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setDetail({ type: 'order', id: o.id })}
                          className="text-xs text-blue-600 hover:underline font-medium">
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detail && <DetailModal type={detail.type} id={detail.id} onClose={() => setDetail(null)} />}
    </div>
  );
}
