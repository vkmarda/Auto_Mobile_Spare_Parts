import { useState, useEffect } from 'react';
import * as returnsApi from '../../api/returns.api';
import StatusBadge from '../../components/StatusBadge';
import DetailModal from '../../components/DetailModal';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const TABS = [
  { key: 'all',              label: 'All' },
  { key: 'return_requested', label: 'Requested' },
  { key: 'return_accepted',  label: 'Accepted' },
  { key: 'return_dispatched',label: 'In Transit' },
  { key: 'return_received',  label: 'Received' },
  { key: 'return_settled',   label: 'Settled' },
];

const BORDER = {
  return_requested:  'border-l-amber-400',
  return_accepted:   'border-l-blue-400',
  return_dispatched: 'border-l-purple-400',
  return_received:   'border-l-teal-400',
  return_settled:    'border-l-green-500',
};

export default function VendorReturns() {
  const [returns, setReturns]         = useState([]);
  const [tab, setTab]                 = useState('all');
  const [loading, setLoading]         = useState(true);
  const [counts, setCounts]           = useState({ requested: 0, accepted: 0, dispatched: 0, received: 0, settled: 0 });
  const [actionLoading, setActionLoading] = useState(null);
  const [loadError, setLoadError]     = useState('');
  const [detailId, setDetailId]       = useState(null);

  useEffect(() => { fetchReturns(); }, []);

  const fetchReturns = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await returnsApi.getReturns();
      setReturns(data);
      setCounts({
        requested:  data.filter((r) => r.status === 'return_requested').length,
        accepted:   data.filter((r) => r.status === 'return_accepted').length,
        dispatched: data.filter((r) => r.status === 'return_dispatched').length,
        received:   data.filter((r) => r.status === 'return_received').length,
        settled:    data.filter((r) => r.status === 'return_settled').length,
      });
    } catch (err) {
      setLoadError(err.response?.data?.error || 'Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptReturn = async (id) => {
    setActionLoading(id);
    try {
      await returnsApi.acceptReturn(id);
      await fetchReturns();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSettleReturn = async (id) => {
    if (!window.confirm('Mark this return as settled? No further action will be needed.')) return;
    setActionLoading(id);
    try {
      await returnsApi.settleReturn(id);
      await fetchReturns();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const tabCount = (key) => {
    if (key === 'all')               return returns.length;
    if (key === 'return_requested')  return counts.requested;
    if (key === 'return_accepted')   return counts.accepted;
    if (key === 'return_dispatched') return counts.dispatched;
    if (key === 'return_received')   return counts.received;
    return counts.settled;
  };

  const filtered = tab === 'all' ? returns : returns.filter((r) => r.status === tab);

  if (loading) return (
    <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-3">
      {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse" />)}
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Returns</h1>

      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{counts.requested}</p>
          <p className="text-xs text-amber-600 mt-0.5">Requested</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{counts.accepted}</p>
          <p className="text-xs text-blue-600 mt-0.5">Accepted</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-purple-700">{counts.dispatched}</p>
          <p className="text-xs text-purple-600 mt-0.5">In Transit</p>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-teal-700">{counts.received}</p>
          <p className="text-xs text-teal-600 mt-0.5">Received</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{counts.settled}</p>
          <p className="text-xs text-green-600 mt-0.5">Settled</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="bg-white rounded-xl shadow-sm p-1 inline-flex gap-1 flex-wrap">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              tab === key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}>
            {label}
            <span className={`text-xs font-bold rounded-full px-1.5 py-0.5 ${tab === key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {tabCount(key)}
            </span>
          </button>
        ))}
      </div>

      {/* Return Deliveries — grouped view for dispatched returns */}
      {(() => {
        const dispatched = returns.filter((r) => (r.status === 'return_dispatched' || r.status === 'return_received') && r.return_delivery_id);
        if (dispatched.length === 0) return null;
        const groups = {};
        for (const r of dispatched) {
          const key = r.return_delivery_id;
          if (!groups[key]) groups[key] = { return_delivery_id: key, dispatch_number: r.dispatch_number, items: [] };
          groups[key].items.push(r);
        }
        return (
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Return Deliveries</h2>
            <div className="space-y-3">
              {Object.values(groups).map((g) => (
                <div key={g.return_delivery_id} className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-purple-100 bg-purple-50">
                    <span className="text-xs font-bold uppercase tracking-wide text-purple-700">↩ Return Delivery</span>
                    <span className="font-mono text-xs text-purple-600 bg-white border border-purple-200 px-2 py-0.5 rounded font-bold">
                      {g.dispatch_number}
                    </span>
                    <span className="text-xs text-purple-500">{g.items.length} return{g.items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {g.items.map((r) => (
                      <div key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                        <span className="font-mono font-bold text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          {r.return_number}
                        </span>
                        <span className="text-sm font-medium text-gray-800">{r.retailer_name}</span>
                        {r.city && <span className="text-xs text-gray-400">{r.city}</span>}
                        {r.reason && <span className="text-xs text-gray-400 italic truncate max-w-xs">"{r.reason}"</span>}
                        <StatusBadge status={r.status} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
            </div>
          </section>
        );
      })()}

      {/* All Returns heading */}
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">All Returns</h2>

      {/* Returns list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">No returns {tab !== 'all' ? 'in this status' : 'yet'}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((return_) => {
            const border = BORDER[return_.status] || 'border-l-gray-300';
            const isSettled = return_.status === 'return_settled';
            return (
              <div key={return_.id}
                className={`bg-white rounded-xl border border-gray-200 border-l-4 ${border} shadow-sm overflow-hidden ${isSettled ? 'opacity-75' : ''}`}>

                {/* Top row */}
                <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-100">
                  <span className="font-mono font-bold text-sm text-amber-600">{return_.return_number}</span>
                  <span className="text-xs text-gray-400">linked to</span>
                  <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{return_.order_number}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <StatusBadge status={return_.status} />
                    <span className="text-xs text-gray-400">{fmtDate(return_.created_at)}</span>
                  </div>
                </div>

                {/* Middle row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
                  <span className="font-semibold text-gray-900 text-sm">{return_.retailer_name}</span>
                  {return_.city && (
                    <span className="text-xs text-gray-400">
                      📍 {[return_.city, return_.state].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {return_.reason && (
                    <span className="text-xs text-gray-400 italic">"{return_.reason}"</span>
                  )}
                </div>

                {/* Return items — works for both standard and photo orders */}
                {return_.items?.length > 0 && (
                  <div className="px-4 pb-2">
                    {return_.items[0]?.photo_url ? (
                      /* Photo order return items */
                      <div className="space-y-2">
                        {return_.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                            <a href={item.photo_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                              <img src={item.photo_url} alt="Part" className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                            </a>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap gap-1 mb-0.5">
                                {item.vehicle_brand && <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-medium">{item.vehicle_brand}</span>}
                                {item.vehicle_model && <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-medium">{item.vehicle_model}</span>}
                                {item.manufacture_year && <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-medium">{item.manufacture_year}</span>}
                              </div>
                              {item.note && <p className="text-xs text-gray-400 italic truncate">"{item.note}"</p>}
                            </div>
                            <span className="text-xs font-semibold text-gray-800 flex-shrink-0">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Standard order return items */
                      <table className="w-full text-xs bg-gray-50 rounded-lg overflow-hidden">
                        <thead>
                          <tr className="text-gray-400 border-b border-gray-200">
                            <th className="text-left px-3 py-2">Product</th>
                            <th className="text-left px-3 py-2 hidden sm:table-cell">SKU</th>
                            <th className="text-right px-3 py-2">Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {return_.items.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100 last:border-0">
                              <td className="px-3 py-2 text-gray-700">{item.product_name}</td>
                              <td className="px-3 py-2 text-gray-400 font-mono hidden sm:table-cell">{item.sku}</td>
                              <td className="px-3 py-2 text-right font-medium text-gray-800">{item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* Return photos */}
                {return_.photos?.length > 0 && (
                  <div className="px-4 pb-3">
                    <p className="text-xs font-medium text-gray-400 mb-2">Photos</p>
                    <div className="flex flex-wrap gap-2">
                      {return_.photos.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={`Return photo ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-t border-gray-100">
                  {return_.status === 'return_requested' && (
                    <>
                      <button
                        onClick={() => handleAcceptReturn(return_.id)}
                        disabled={actionLoading === return_.id}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        {actionLoading === return_.id ? 'Processing...' : 'Accept Return'}
                      </button>
                      <button
                        onClick={() => handleSettleReturn(return_.id)}
                        disabled={actionLoading === return_.id}
                        className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        {actionLoading === return_.id ? 'Processing...' : 'Settled'}
                      </button>
                    </>
                  )}

                  {return_.status === 'return_accepted' && (
                    <>
                      <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-3 py-1">
                        Will be grouped in next dispatch
                      </span>
                      <button
                        onClick={() => handleSettleReturn(return_.id)}
                        disabled={actionLoading === return_.id}
                        className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Mark Settled
                      </button>
                    </>
                  )}

                  {return_.status === 'return_dispatched' && (
                    <>
                      {return_.dispatch_number && (
                        <span className="font-mono text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded-full px-3 py-1">
                          ↩ {return_.dispatch_number}
                        </span>
                      )}
                      <span className="text-xs text-purple-500 italic">Will be marked received when dispatch is delivered</span>
                    </>
                  )}

                  {return_.status === 'return_received' && (
                    <span className="text-xs bg-teal-50 text-teal-600 border border-teal-200 rounded-full px-3 py-1">
                      ✓ Items back at warehouse
                    </span>
                  )}

                  {return_.status === 'return_settled' && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      ✓ Settled — no further action needed
                    </span>
                  )}
                  <button
                    onClick={() => setDetailId(return_.id)}
                    className="ml-auto text-xs text-blue-600 hover:underline font-medium">
                    More Details
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {detailId && (
        <DetailModal type="return" id={detailId} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}
