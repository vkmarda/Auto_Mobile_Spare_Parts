import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, Package, AlertTriangle, Printer, Eye, EyeOff, X } from 'lucide-react';
import { getAllOrders } from '../../api/vendor.api';
import { getReturns } from '../../api/returns.api';
import { createDispatch, createDispatchForOrder, getDispatches, getDispatchSheet } from '../../api/dispatch.api';
import { getOrderDetail, getReturnDetail } from '../../api/detail.api';
import { printDispatch } from '../../utils/printDispatch';
import StatusBadge from '../../components/StatusBadge';
import VendorOrderCard, { COLS_NO_CB } from '../../components/VendorOrderCard';
import { useToast } from '../../context/ToastContext';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDateKey = (d) => {
  const ds = new Date(d).toDateString();
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (ds === today) return 'Today';
  if (ds === yesterday) return 'Yesterday';
  return 'Earlier';
};

function ConfirmModal({ city, orderCount, cityCount, returnCount, retailers, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">
          {city ? `Dispatch ${city}` : 'Confirm Dispatch'}
        </h2>

        {/* Summary line */}
        <p className="text-sm text-gray-600 mb-3">
          {city ? (
            <><span className="font-semibold text-blue-600">{orderCount} order{orderCount !== 1 ? 's' : ''}</span> to <span className="font-semibold">{city}</span></>
          ) : (
            <><span className="font-semibold text-blue-600">{cityCount} dispatch{cityCount !== 1 ? 'es' : ''}</span> · <span className="font-semibold">{orderCount} orders</span></>
          )}
        </p>

        {/* Retailer checklist */}
        {retailers?.length > 0 && (
          <div className="bg-gray-50 rounded-lg border border-gray-100 divide-y divide-gray-100 mb-3">
            {retailers.map((r) => (
              <div key={r.name} className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-gray-700">{r.name}</span>
                <span className="text-xs text-gray-400">{r.count} order{r.count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        )}

        {/* Warnings */}
        {returnCount > 0 && (
          <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 mb-3">
            ↩ Also picking up <span className="font-semibold">{returnCount}</span> return{returnCount !== 1 ? 's' : ''}.
          </p>
        )}

        <div className="flex gap-3 mt-4">
          <button onClick={onCancel} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? 'Creating…' : 'Confirm Dispatch'}
          </button>
        </div>
      </div>
    </div>
  );
}



function DispatchTile({ dispatch, isSelected, onClick }) {
  const daysSince = dispatch.status === 'dispatched'
    ? Math.floor((Date.now() - new Date(dispatch.created_at)) / 86400000)
    : null;
  const isStale = daysSince !== null && daysSince >= 5;

  const bgCls = isStale
    ? 'bg-orange-50 hover:bg-orange-100'
    : dispatch.status === 'completed'
      ? 'bg-teal-50 hover:bg-teal-100'
      : dispatch.status === 'dispatched'
        ? 'bg-violet-50 hover:bg-violet-100'
        : 'bg-gray-50 hover:bg-gray-100';

  const ringCls = isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'shadow-sm';

  return (
    <button onClick={onClick}
      className={`${bgCls} ${ringCls} rounded-xl border border-transparent p-4 text-left transition-all w-full md:w-[210px] md:flex-none`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-mono font-bold text-sm text-gray-800">{dispatch.dispatch_number}</span>
        <StatusBadge status={dispatch.status} />
      </div>
      <p className="font-semibold text-gray-900 text-sm truncate mb-1">
        {dispatch.city}{dispatch.state ? `, ${dispatch.state}` : ''}
      </p>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mb-2.5">
        <span className="text-xs text-gray-500">{dispatch.order_count} order{dispatch.order_count !== 1 ? 's' : ''}</span>
        {dispatch.return_delivery?.return_count > 0 && (
          <span className="text-xs text-indigo-500">↩ {dispatch.return_delivery.return_count} return{dispatch.return_delivery.return_count !== 1 ? 's' : ''}</span>
        )}
      </div>
      <p className="text-xs text-gray-400">{fmtDate(dispatch.created_at)}</p>
      {isStale && (
        <p className="text-xs text-orange-600 font-medium mt-2 flex items-center gap-1">
          <AlertTriangle size={11} className="flex-shrink-0" />{daysSince}d — awaiting confirmation
        </p>
      )}
    </button>
  );
}

const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const DETAIL_DOT = {
  placed: 'bg-blue-400', accepted: 'bg-green-400', rejected: 'bg-red-400',
  dispatched: 'bg-purple-400', confirmed: 'bg-green-500',
  return_requested: 'bg-indigo-400', return_accepted: 'bg-blue-400',
  return_dispatched: 'bg-purple-400', return_received: 'bg-teal-400',
  return_settled: 'bg-green-400', return_cancelled: 'bg-slate-500',
};

function InlineDetailPanel({ type, id, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true); setError(''); setData(null);
    (type === 'order' ? getOrderDetail(id) : getReturnDetail(id))
      .then(setData).catch(() => setError('Failed to load')).finally(() => setLoading(false));
  }, [type, id]);

  const main     = type === 'order' ? data?.order  : data?.return;
  const items    = data?.items    || [];
  const timeline = data?.timeline || [];

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-700">
      {/* Mini header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono font-bold text-xs text-white">
            {main ? (type === 'order' ? main.order_number : main.return_number) : '…'}
          </span>
          {main && <StatusBadge status={main.status} small />}
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white flex-shrink-0 ml-2">
          <X size={14} />
        </button>
      </div>

      <div className="px-4 py-3 space-y-4 max-h-80 overflow-y-auto scrollbar-dark">
        {loading && <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="bg-slate-800 h-3 rounded animate-pulse" />)}</div>}
        {error && <p className="text-xs text-red-400">{error}</p>}

        {main && (
          <>
            {/* Retailer info */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <div>
                <p className="text-slate-500 mb-0.5">Retailer</p>
                <p className="text-white font-medium">{main.retailer_name}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-0.5">Mobile</p>
                <p className="text-slate-300">{main.retailer_mobile || '—'}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-0.5">City</p>
                <p className="text-slate-300">{[main.retailer_city, main.retailer_state].filter(Boolean).join(', ') || '—'}</p>
              </div>
              {type === 'return' && main.reason && (
                <div className="col-span-2">
                  <p className="text-slate-500 mb-0.5">Reason</p>
                  <p className="text-slate-300 italic">"{main.reason}"</p>
                </div>
              )}
              {type === 'order' && main.notes && (
                <div className="col-span-2">
                  <p className="text-slate-500 mb-0.5">Notes</p>
                  <p className="text-slate-300">{main.notes}</p>
                </div>
              )}
            </div>

            {/* Items */}
            {items.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Items</p>
                <div className="space-y-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-2 bg-slate-800 rounded px-2.5 py-1.5 text-xs">
                      <span className="text-slate-200 truncate">{item.product_name || item.part_name || '—'}</span>
                      <span className="text-slate-400 flex-shrink-0">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {timeline.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Timeline</p>
                <div className="space-y-0">
                  {timeline.map((e, i) => (
                    <div key={i} className="flex gap-2.5">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${DETAIL_DOT[e.type] || 'bg-slate-500'}`} />
                        {i < timeline.length - 1 && <div className="w-px flex-1 bg-slate-700 my-1" />}
                      </div>
                      <div className="pb-2.5">
                        <p className="text-xs text-slate-200">{e.event}</p>
                        <p className="text-[10px] text-slate-500">{fmtDateTime(e.time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DispatchDetailPanel({ dispatch, onClose }) {
  const [printing, setPrinting] = useState(false);
  const [inlineDetail, setInlineDetail] = useState(null); // { type, id }

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const data = await getDispatchSheet(dispatch.id);
      printDispatch(data);
    } finally { setPrinting(false); }
  };

  const confirmedCount = (dispatch.orders || []).filter((o) => o.status === 'confirmed').length;

  const handleShowDetail = (item) => {
    setInlineDetail((prev) => (prev?.id === item.id ? null : item));
  };

  return (
    <div className="space-y-3">
      <div className="bg-slate-900 rounded-xl overflow-hidden flex flex-col shadow-lg" style={{ maxHeight: 'calc(100vh - 160px)' }}>
        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3.5 border-b border-slate-700 flex-shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono font-bold text-sm text-white">{dispatch.dispatch_number}</span>
            </div>
            <p className="text-sm font-semibold text-white truncate">
              {dispatch.city}{dispatch.state ? `, ${dispatch.state}` : ''}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {fmtDate(dispatch.created_at)} · {confirmedCount}/{dispatch.order_count} confirmed
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none flex-shrink-0 ml-3">✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4 scrollbar-dark">
          <div>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">Orders</p>
            <div className="space-y-1.5">
              {(dispatch.orders || []).map((o) => (
                <div key={o.id}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 transition-colors ${inlineDetail?.id === o.id ? 'bg-slate-700' : 'bg-slate-800'}`}>
                  <span className="font-mono text-xs font-semibold text-white bg-slate-700 px-1.5 py-0.5 rounded flex-shrink-0">
                    {o.order_number}
                  </span>
                  <span className="text-xs text-white flex-1 truncate min-w-0">{o.retailer_name}</span>
                  <StatusBadge status={o.status} small />
                  <button onClick={() => handleShowDetail({ type: 'order', id: o.id })}
                    className={`text-xs font-medium flex-shrink-0 transition-colors ${inlineDetail?.id === o.id ? 'text-white' : 'text-slate-300 hover:text-white'}`}>
                    →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {dispatch.return_delivery?.requests?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">↩ Return Pickups</p>
              <div className="rounded-lg overflow-hidden divide-y divide-slate-700 border border-slate-700">
                {dispatch.return_delivery.requests.map((r) => (
                  <div key={r.id}
                    className={`flex items-center gap-2 px-3 py-2.5 transition-colors ${inlineDetail?.id === r.id ? 'bg-slate-700' : 'bg-slate-800'}`}>
                    <span className="font-mono text-xs font-semibold text-white bg-slate-700 px-1.5 py-0.5 rounded flex-shrink-0">
                      {r.return_number}
                    </span>
                    <span className="text-xs text-white font-medium flex-1 truncate min-w-0">{r.retailer_name}</span>
                    <StatusBadge status={r.status} small />
                    <button onClick={() => handleShowDetail({ type: 'return', id: r.id })}
                      className={`text-xs font-medium flex-shrink-0 transition-colors ${inlineDetail?.id === r.id ? 'text-white' : 'text-slate-300 hover:text-white'}`}>
                      →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 py-3 border-t border-slate-700 flex-shrink-0">
          <button onClick={handlePrint} disabled={printing}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 flex items-center gap-1.5">
            {printing
              ? <><span className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />Preparing…</>
              : <><Printer size={13} />Print Sheet</>}
          </button>
        </div>
      </div>

      {/* Inline detail panel */}
      {inlineDetail && (
        <InlineDetailPanel
          type={inlineDetail.type}
          id={inlineDetail.id}
          onClose={() => setInlineDetail(null)}
        />
      )}
    </div>
  );
}

function CityDispatchCard({ city, state, orders, returnCount, onDispatchCity }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 border-l-4 border-l-sky-400 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-x-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{city}{state && <span className="text-xs text-gray-400 font-normal ml-1.5">{state}</span>}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-sky-600 font-medium">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
            {returnCount > 0 && (
              <span className="text-xs text-indigo-600 font-medium">+ {returnCount} return pickup{returnCount !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDispatchCity(city, state); }}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium whitespace-nowrap">
          Dispatch {city}
        </button>
        <button onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
          className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors flex-shrink-0 ${expanded ? 'text-indigo-600 hover:bg-indigo-50' : 'text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
          {expanded ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100">
          <div className="hidden md:grid px-7 py-2 gap-x-3 text-xs font-medium text-gray-500"
            style={{ gridTemplateColumns: COLS_NO_CB }}>
            <span>Retailer</span><span>Phone</span><span>Date</span>
            <span>Units</span><span>Location</span><span>Status</span><span></span><span />
          </div>
          <div className="px-3 py-2 space-y-1.5">
            {orders.map((o) => (
              <VendorOrderCard key={o.id} order={o} readOnly compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendorDispatch() {
  const showToast               = useToast();
  const [orders, setOrders]       = useState([]);
  const [returns, setReturns]     = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [error, setError]         = useState('');
  const [dispatchCity, setDispatchCity]   = useState(null);
  const [showCityConfirm, setShowCityConfirm] = useState(false);
  const [dispatchOrder, setDispatchOrder] = useState(null);
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [historyCity, setHistoryCity] = useState('');
  const [mode, setMode] = useState('city'); // 'city' | 'individual'

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [o, r, d] = await Promise.all([getAllOrders(), getReturns(), getDispatches()]);
      setOrders(o); setReturns(r); setDispatches(d);
    } finally { setLoading(false); }
  }

  const accepted       = orders.filter((o) => o.status === 'accepted' || o.status === 'partial_confirmed');
  const returnAccepted = returns.filter((r) => r.status === 'return_accepted');

  const overdueOrders = accepted.filter((o) =>
    Math.floor((Date.now() - new Date(o.created_at)) / 86400000) >= 3
  );

  const dispatchCities = useMemo(() =>
    [...new Set(dispatches.map((d) => d.city).filter(Boolean))].sort(),
    [dispatches]
  );
  const filteredDispatches = useMemo(() =>
    historyCity ? dispatches.filter((d) => d.city === historyCity) : dispatches,
    [dispatches, historyCity]
  );

  const retailersForCity = (city) => {
    const map = {};
    accepted.filter((o) => o.retailer_city === city).forEach((o) => {
      if (!map[o.retailer_id]) map[o.retailer_id] = { name: o.retailer_name, count: 0 };
      map[o.retailer_id].count++;
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  };

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
      const nums = result.dispatches.map((d) => d.dispatch_number).join(', ');
      const label = city ? `Dispatched to ${city} · ${nums}` : `${result.dispatches.length} dispatch${result.dispatches.length !== 1 ? 'es' : ''} created · ${nums}`;
      showToast(label);
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

  const handleDispatchSingleOrder = async () => {
    setDispatching(true); setError('');
    try {
      const result = await createDispatchForOrder(dispatchOrder.id);
      const num = result.dispatches[0]?.dispatch_number;
      showToast(`${dispatchOrder.order_number} dispatched · ${num}`);
      setDispatchOrder(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create dispatch');
      setDispatchOrder(null);
    } finally { setDispatching(false); }
  };

  if (loading) return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto space-y-4">
      <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse" />
      {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 rounded-xl h-14 animate-pulse" />)}
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dispatch</h1>
        <p className="text-sm text-gray-500 mt-1">Send accepted orders and track deliveries by city</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {overdueOrders.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
          <AlertTriangle size={14} className="inline mr-1" /><span className="font-semibold">{overdueOrders.length} accepted order{overdueOrders.length !== 1 ? 's' : ''}</span> {overdueOrders.length === 1 ? 'has' : 'have'} been waiting 3+ days without dispatch.
          {' '}<span className="text-orange-500">{overdueOrders.map((o) => o.order_number).join(', ')}</span>
        </div>
      )}

      {/* Ready to dispatch */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 bg-blue-600 rounded-full" />
              <h2 className="text-base font-semibold text-gray-900">Ready to Dispatch</h2>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${accepted.length > 0 ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-500'}`}>
              {accepted.length}
            </span>
          </div>
          {accepted.length > 0 && (
            <button onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl">
              Dispatch All
            </button>
          )}
        </div>

        {accepted.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-14 text-center">
            <CheckCircle size={32} className="mx-auto mb-3 text-green-400" />
            <p className="text-sm font-semibold text-gray-700">Nothing to dispatch</p>
            <p className="text-xs text-gray-400 mt-1">All accepted orders have been sent</p>
          </div>
        ) : (
          <>
            {/* Mode toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-4">
              <button onClick={() => setMode('city')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode === 'city' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                By City
              </button>
              <button onClick={() => setMode('individual')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode === 'individual' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                Individual Order
              </button>
            </div>

            {/* By City */}
            {mode === 'city' && (
              <div className="space-y-2">
                {Object.values(ordersByCity).map((g) => (
                  <CityDispatchCard
                    key={g.city}
                    city={g.city}
                    state={g.state}
                    orders={g.orders}
                    returnCount={returnsByCity[g.city]?.returns.length || 0}
                    onDispatchCity={handleDispatchByCity}
                  />
                ))}
                {returnAccepted.length > 0 && Object.keys(returnsByCity).some((city) => !ordersByCity[city]) && (
                  <div className="mt-1 space-y-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium px-1">Return pickups only</p>
                    {Object.values(returnsByCity).filter((g) => !ordersByCity[g.city]).map((g) => (
                      <div key={g.city} className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                        <p className="text-sm font-semibold text-gray-800">{g.city} — {g.returns.length} return{g.returns.length !== 1 ? 's' : ''}</p>
                        {g.returns.map((r) => (
                          <p key={r.id} className="text-xs text-gray-500 mt-0.5">{r.return_number} · {r.retailer_name}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Individual Order */}
            {mode === 'individual' && (
              <div className="space-y-1.5">
                <div className="hidden md:grid px-4 py-2 gap-x-3 text-xs font-medium text-gray-500 border-l-4 border-l-transparent"
                  style={{ gridTemplateColumns: COLS_NO_CB }}>
                  <span>Retailer</span><span>Phone</span><span>Date</span>
                  <span>Units</span><span>Location</span><span>Status</span><span>Action</span><span />
                </div>
                {accepted.map((o) => (
                  <VendorOrderCard key={o.id} order={o}
                    onDispatch={(id) => setDispatchOrder(accepted.find((a) => a.id === id))} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Dispatch history */}
      <section>
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 bg-blue-600 rounded-full" />
              <h2 className="text-base font-semibold text-gray-900">Dispatch History</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
              {filteredDispatches.length}
            </span>
          </div>
          {dispatchCities.length > 0 && (
            <select value={historyCity} onChange={(e) => setHistoryCity(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All cities</option>
              {dispatchCities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {historyCity && (
            <button onClick={() => setHistoryCity('')} className="text-xs text-gray-400 hover:text-red-500">Clear</button>
          )}
        </div>
        {filteredDispatches.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-14 text-center">
            <Package size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-semibold text-gray-700">No dispatches yet</p>
            <p className="text-xs text-gray-400 mt-1">Dispatched orders will appear here</p>
          </div>
        ) : (
          <div className="flex gap-5 items-start">
            {/* Tiles */}
            <div className="flex-1 min-w-0 space-y-6">
              {['Today', 'Yesterday', 'Earlier'].map((group) => {
                const groupItems = filteredDispatches.filter((d) => fmtDateKey(d.created_at) === group);
                if (!groupItems.length) return null;
                return (
                  <div key={group}>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">{group}</p>

                    {/* Mobile: vertical stack, panel opens right after selected tile */}
                    <div className="md:hidden space-y-2">
                      {groupItems.map((d) => (
                        <div key={d.id}>
                          <DispatchTile dispatch={d}
                            isSelected={selectedDispatch?.id === d.id}
                            onClick={() => setSelectedDispatch(prev => prev?.id === d.id ? null : d)} />
                          {selectedDispatch?.id === d.id && (
                            <div className="mt-2">
                              <DispatchDetailPanel
                                key={selectedDispatch.id}
                                dispatch={selectedDispatch}
                                onClose={() => setSelectedDispatch(null)}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Desktop: flex-wrap tiles */}
                    <div className="hidden md:flex flex-wrap gap-3">
                      {groupItems.map((d) => (
                        <DispatchTile key={d.id} dispatch={d}
                          isSelected={selectedDispatch?.id === d.id}
                          onClick={() => setSelectedDispatch(prev => prev?.id === d.id ? null : d)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: sticky side panel */}
            {selectedDispatch && (
              <div className="hidden md:block w-80 flex-shrink-0 sticky top-6 pb-8">
                <DispatchDetailPanel
                  key={selectedDispatch.id}
                  dispatch={selectedDispatch}
                  onClose={() => setSelectedDispatch(null)}
                />
              </div>
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
          retailers={null}
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
          retailers={retailersForCity(dispatchCity.city)}
          onConfirm={() => runDispatch(dispatchCity.city, dispatchCity.state)}
          onCancel={() => { setShowCityConfirm(false); setDispatchCity(null); }}
          loading={dispatching}
        />
      )}
      {dispatchOrder && (
        <ConfirmModal
          city={dispatchOrder.retailer_city}
          orderCount={1}
          cityCount={1}
          returnCount={returnsByCity[dispatchOrder.retailer_city]?.returns.length || 0}
          retailers={[{ name: dispatchOrder.retailer_name, count: 1 }]}
          onConfirm={handleDispatchSingleOrder}
          onCancel={() => setDispatchOrder(null)}
          loading={dispatching}
        />
      )}
    </div>
  );
}
