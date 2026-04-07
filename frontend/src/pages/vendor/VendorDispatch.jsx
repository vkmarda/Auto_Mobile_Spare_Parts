import { useState, useEffect } from 'react';
import { getAllOrders } from '../../api/vendor.api';
import { getReturns } from '../../api/returns.api';
import { createDispatch, getDispatches, markDispatchDelivered, getDispatchSheet } from '../../api/dispatch.api';
import { printDispatch } from '../../utils/printDispatch';
import StatusBadge from '../../components/StatusBadge';
import DetailModal from '../../components/DetailModal';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDateKey = (d) => {
  const ds = new Date(d).toDateString();
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (ds === today) return 'Today';
  if (ds === yesterday) return 'Yesterday';
  return 'Earlier';
};

function ConfirmModal({ city, orderCount, cityCount, returnCount, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-bold text-gray-900 mb-3">
          {city ? `Dispatch ${city}` : 'Confirm Dispatch'}
        </h2>
        <p className="text-sm text-gray-600 mb-2">
          {city ? (
            <>Dispatch <span className="font-semibold text-blue-600">{orderCount} order{orderCount !== 1 ? 's' : ''}</span> to <span className="font-semibold">{city}</span>.</>
          ) : (
            <>Create <span className="font-semibold text-blue-600">{cityCount} dispatch{cityCount !== 1 ? 'es' : ''}</span> for <span className="font-semibold">{orderCount} orders</span>.</>
          )}
        </p>
        {returnCount > 0 && (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-4">
            Also includes <span className="font-semibold">{returnCount}</span> return pickup{returnCount !== 1 ? 's' : ''}.
          </p>
        )}
        <div className="flex gap-3 mt-4">
          <button onClick={onCancel} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? 'Creating…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}



function DispatchCard({ dispatch, onMarkDelivered, onShowDetail }) {
  const [expanded, setExpanded] = useState(false);
  const [acting, setActing]     = useState(false);
  const [printing, setPrinting] = useState(false);

  const handleDeliver = async () => {
    setActing(true);
    try { await onMarkDelivered(dispatch.id); } finally { setActing(false); }
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const data = await getDispatchSheet(dispatch.id);
      await printDispatch(data);
    } finally { setPrinting(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <span className="font-mono font-bold text-sm text-gray-800">{dispatch.dispatch_number}</span>
        <span className="text-sm text-gray-600">{dispatch.city}{dispatch.state ? `, ${dispatch.state}` : ''}</span>
        <StatusBadge status={dispatch.status} />
        <span className="text-xs text-gray-400">
          {dispatch.order_count} order{dispatch.order_count !== 1 ? 's' : ''}
          {dispatch.return_delivery && (
            <span className="text-amber-500"> · {dispatch.return_delivery.return_count} return pickup{dispatch.return_delivery.return_count !== 1 ? 's' : ''}</span>
          )}
          {' · '}{fmtDate(dispatch.created_at)}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={handlePrint} disabled={printing}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 flex items-center gap-1.5">
            {printing && <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />}
            {printing ? 'Preparing…' : '🖨 Print Sheet'}
          </button>
          {dispatch.status === 'dispatched' && (
            <button onClick={handleDeliver} disabled={acting}
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 flex items-center gap-1.5">
              {acting && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Mark Delivered
            </button>
          )}
          <button onClick={() => setExpanded(v => !v)}
            className="text-xs text-blue-600 hover:underline">
            {expanded ? 'Hide ↑' : 'Details ↓'}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-3">
          {/* Orders list */}
          <div className="space-y-1.5">
            {(dispatch.orders || []).map((o) => (
              <div key={o.id} className="flex items-center gap-2 text-sm">
                <span className="font-mono text-xs text-gray-600 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                  {o.order_number}
                </span>
                <span className="text-gray-700">{o.retailer_name}</span>
                <StatusBadge status={o.status} />
                <button onClick={() => onShowDetail({ type: 'order', id: o.id })}
                  className="ml-auto text-xs text-blue-600 hover:underline font-medium">
                  Details
                </button>
              </div>
            ))}
          </div>

          {/* Return requests linked to this dispatch */}
          {dispatch.return_delivery?.requests?.length > 0 && (
            <div className="border border-amber-200 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-b border-amber-100">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">↩ Return Pickups</span>
                <span className="text-xs text-amber-500">{dispatch.return_delivery.return_count} request{dispatch.return_delivery.return_count !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-amber-50 bg-white">
                {dispatch.return_delivery.requests.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                    <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                      {r.return_number}
                    </span>
                    <span className="text-xs text-gray-700 font-medium">{r.retailer_name}</span>
                    {r.city && <span className="text-xs text-gray-400">{r.city}</span>}
                    <div className="ml-auto flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <button onClick={() => onShowDetail({ type: 'return', id: r.id })}
                        className="text-xs text-blue-600 hover:underline font-medium">
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VendorDispatch() {
  const [orders, setOrders]       = useState([]);
  const [returns, setReturns]     = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [successMsg, setSuccessMsg]   = useState('');
  const [error, setError]         = useState('');
  const [dispatchCity, setDispatchCity]   = useState(null);
  const [showCityConfirm, setShowCityConfirm] = useState(false);
  const [detail, setDetail] = useState(null); // { type, id }

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [o, r, d] = await Promise.all([getAllOrders(), getReturns(), getDispatches()]);
      setOrders(o); setReturns(r); setDispatches(d);
    } finally { setLoading(false); }
  }

  const accepted       = orders.filter((o) => o.status === 'accepted');
  const returnAccepted = returns.filter((r) => r.status === 'return_accepted');

  const ordersByCity = {};
  for (const o of accepted) {
    const city = o.retailer_city || 'Unknown';
    if (!ordersByCity[city]) ordersByCity[city] = { city, state: o.retailer_state, orders: [] };
    ordersByCity[city].orders.push(o);
  }

  const returnsByCity = {};
  for (const r of returnAccepted) {
    const city = r.city || 'Unknown';
    if (!returnsByCity[city]) returnsByCity[city] = { city, state: r.state, returns: [] };
    returnsByCity[city].returns.push(r);
  }

  const handleDispatchByCity = (city, state) => {
    setDispatchCity({ city, state });
    setShowCityConfirm(true);
  };

  const runDispatch = async (city, state) => {
    setDispatching(true); setError('');
    try {
      const result = await createDispatch(city, state);
      setSuccessMsg(`Created ${result.dispatches.length} dispatch${result.dispatches.length !== 1 ? 'es' : ''}: ${result.dispatches.map((d) => d.dispatch_number).join(', ')}`);
      setShowModal(false);
      setShowCityConfirm(false);
      setDispatchCity(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create dispatch');
      setShowModal(false);
      setShowCityConfirm(false);
    } finally { setDispatching(false); }
  };

  const handleMarkDelivered = async (id) => {
    await markDispatchDelivered(id);
    await load();
  };

  const grouped = { Today: [], Yesterday: [], Earlier: [] };
  for (const d of dispatches) grouped[fmtDateKey(d.created_at)].push(d);

  if (loading) return (
    <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-3">
      {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 rounded-xl h-14 animate-pulse" />)}
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-xl font-bold text-gray-900">Dispatch</h1>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
          ✅ {successMsg}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Ready to dispatch */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Ready to Dispatch</h2>
          {accepted.length > 0 && (
            <button onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-xl">
              Dispatch All
            </button>
          )}
        </div>

        {accepted.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-10 text-center">
            <p className="text-gray-400 text-sm">No accepted orders to dispatch.</p>
          </div>
        ) : (
          <>
            {/* Orders table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2 font-medium">Order</th>
                    <th className="text-left px-4 py-2 font-medium">Retailer</th>
                    <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">City</th>
                    <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Items</th>
                    <th className="text-right px-4 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {accepted.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{o.order_number}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-800">{o.retailer_name}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">{o.retailer_city}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">{o.item_count ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setDetail({ type: 'order', id: o.id })}
                            className="text-xs text-blue-600 hover:underline font-medium">
                            Details
                          </button>
                          <button
                            onClick={() => handleDispatchByCity(o.retailer_city, o.retailer_state)}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium">
                            Dispatch {o.retailer_city}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* City summary rows */}
            <div className="space-y-2">
              {Object.values(ordersByCity).map((g) => (
                <div key={g.city} className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-semibold text-gray-900">{g.city}</span>
                    {g.state && <span className="text-xs text-gray-400">{g.state}</span>}
                    <span className="text-sm text-blue-600">{g.orders.length} order{g.orders.length !== 1 ? 's' : ''}</span>
                    {returnsByCity[g.city] && (
                      <span className="text-xs text-amber-600">+ {returnsByCity[g.city].returns.length} return{returnsByCity[g.city].returns.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDispatchByCity(g.city, g.state)}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium whitespace-nowrap">
                    Dispatch {g.city} Only
                  </button>
                </div>
              ))}
            </div>

            {returnAccepted.length > 0 && Object.keys(returnsByCity).some((city) => !ordersByCity[city]) && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Return pickups (no new dispatch)</p>
                {Object.values(returnsByCity).filter((g) => !ordersByCity[g.city]).map((g) => (
                  <div key={g.city} className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-sm font-semibold text-gray-800">{g.city} — {g.returns.length} return{g.returns.length !== 1 ? 's' : ''}</p>
                    {g.returns.map((r) => (
                      <p key={r.id} className="text-xs text-gray-500">{r.return_number} · {r.retailer_name}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Dispatch history */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Dispatch History</h2>
        {dispatches.length === 0 ? (
          <p className="text-sm text-gray-400">No dispatches yet.</p>
        ) : (
          <div className="space-y-6">
            {['Today', 'Yesterday', 'Earlier'].map((group) =>
              grouped[group].length > 0 ? (
                <div key={group}>
                  <p className="text-xs font-medium text-gray-400 mb-2">{group}</p>
                  <div className="space-y-2">
                    {grouped[group].map((d) => (
                      <DispatchCard key={d.id} dispatch={d} onMarkDelivered={handleMarkDelivered} onShowDetail={setDetail} />
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </section>

      {showModal && (
        <ConfirmModal
          city={null}
          orderCount={accepted.length}
          cityCount={Object.keys(ordersByCity).length}
          returnCount={Object.values(returnsByCity).reduce((s, g) => s + g.returns.length, 0)}
          onConfirm={() => runDispatch(null, null)}
          onCancel={() => setShowModal(false)}
          loading={dispatching}
        />
      )}
      {showCityConfirm && dispatchCity && (
        <ConfirmModal
          city={dispatchCity.city}
          orderCount={ordersByCity[dispatchCity.city]?.orders.length || 0}
          cityCount={1}
          returnCount={returnsByCity[dispatchCity.city]?.returns.length || 0}
          onConfirm={() => runDispatch(dispatchCity.city, dispatchCity.state)}
          onCancel={() => { setShowCityConfirm(false); setDispatchCity(null); }}
          loading={dispatching}
        />
      )}
      {detail && (
        <DetailModal type={detail.type} id={detail.id} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}
