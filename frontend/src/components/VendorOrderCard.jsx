import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrderById } from '../api/orders.api';
import StatusBadge from './StatusBadge';
import DetailModal from './DetailModal';

const BORDER = { pending: 'border-l-yellow-400', accepted: 'border-l-green-500', rejected: 'border-l-red-400' };

// cb | Order | Phone | Retailer | Date | Units | Location | Status | Action | Toggle
export const COLS = '20px 90px 110px 1fr 130px 55px 120px 90px 140px 60px';

export default function VendorOrderCard({ order, onAccept, onReject, checkable, checked, onCheck }) {
  const navigate              = useNavigate();
  const [details, setDetails]   = useState(null);
  const [acting, setActing]     = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const isPending               = order.status === 'pending';
  const [expanded, setExpanded] = useState(isPending);

  useEffect(() => {
    getOrderById(order.id).then(setDetails).catch(() => {});
  }, [order.id]);

  const handle = async (action) => {
    setActing(action);
    try {
      action === 'accept' ? await onAccept(order.id) : await onReject(order.id);
    } finally {
      setActing(null);
    }
  };

  const date     = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const daysDiff = Math.floor((Date.now() - new Date(order.created_at)) / 86400000);
  const age      = daysDiff === 0 ? 'Today' : `${daysDiff}d ago`;
  const location = [order.retailer_city, order.retailer_state].filter(Boolean).join(', ');
  const totalQty = details?.items?.reduce((s, i) => s + i.quantity, 0) ?? order.item_count;

  const ActionCell = () => (
    <div className="flex items-center gap-1 flex-wrap">
      {isPending && onAccept && (
        <>
          <button onClick={() => handle('accept')} disabled={!!acting}
            className="text-xs bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-2 py-1 rounded-lg font-medium flex items-center gap-0.5">
            {acting === 'accept' ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '✓'} Accept
          </button>
          <button onClick={() => handle('reject')} disabled={!!acting}
            className="text-xs bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-2 py-1 rounded-lg font-medium flex items-center gap-0.5">
            {acting === 'reject' ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '✕'} Reject
          </button>
        </>
      )}
      {order.status === 'accepted' && (
        <button onClick={() => navigate('/vendor/dispatch')}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg font-medium whitespace-nowrap">
          Dispatch →
        </button>
      )}
    </div>
  );

  const ToggleBtn = () => (
    <button onClick={() => setExpanded(v => !v)}
      className="text-xs text-blue-500 hover:text-blue-700 font-medium whitespace-nowrap">
      {expanded ? 'Hide ↑' : 'Details ↓'}
    </button>
  );

  return (
    <div className={`bg-white border-l-4 overflow-hidden ${BORDER[order.status] || 'border-l-gray-300'}`}>

      {/* ── Mobile ── */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {checkable && (
                <input type="checkbox" checked={checked}
                  onChange={(e) => onCheck(order.id, e.target.checked)}
                  className="w-4 h-4 accent-blue-600" />
              )}
              <span className="font-mono font-bold text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">{order.order_number}</span>
              {order.order_type === 'photo' && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">📷</span>
              )}
              <StatusBadge status={order.status} />
            </div>
            <p className={`text-sm ${isPending ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
              {order.retailer_name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {date} · {totalQty} unit{totalQty !== 1 ? 's' : ''}
              {location && ` · ${location}`}
            </p>
          </div>
          {order.retailer_mobile && <p className="text-xs text-gray-400 shrink-0">{order.retailer_mobile}</p>}
        </div>
        <div className="flex items-center justify-between">
          <ActionCell />
          <ToggleBtn />
        </div>
      </div>

      {/* ── Desktop grid row — matches COLS (10 columns) ── */}
      <div className="hidden md:grid px-4 py-3 items-center gap-x-3"
        style={{ gridTemplateColumns: COLS }}>
        {/* cb */}
        <div>
          {checkable && (
            <input type="checkbox" checked={checked}
              onChange={(e) => onCheck(order.id, e.target.checked)}
              className="w-4 h-4 accent-blue-600" />
          )}
        </div>
        {/* Order */}
        <span className="font-mono font-bold text-gray-800 text-sm bg-gray-100 px-2 py-0.5 rounded truncate">
          {order.order_number}
        </span>
        {/* Phone */}
        <span className="text-sm text-gray-600 truncate">{order.retailer_mobile || '—'}</span>
        {/* Retailer */}
        <p className={`text-sm truncate ${isPending ? 'font-bold text-gray-900' : 'font-normal text-gray-700'}`}>
          {order.retailer_name}
        </p>
        {/* Date */}
        <div>
          <p className="text-xs text-gray-500">{date}</p>
          <p className="text-xs text-gray-400">{age}</p>
        </div>
        {/* Units */}
        <span className="text-sm text-gray-500">{totalQty}</span>
        {/* Location */}
        <span className="text-xs text-gray-500 truncate">{location || '—'}</span>
        {/* Status */}
        <div><StatusBadge status={order.status} /></div>
        {/* Action */}
        <div><ActionCell /></div>
        {/* Toggle */}
        <div><ToggleBtn /></div>
      </div>

      {/* ── Item details — toggled, pending starts expanded ── */}
      {expanded && <div className="border-t border-gray-100 bg-gray-50">
        {!details ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : details.order_type === 'photo' ? (
          /* ── Photo order items ── */
          <div className="divide-y divide-gray-100">
            {details.items.map((item, i) => (
              <div key={item.id || i} className="px-4 py-3 space-y-2">
                <div className="flex items-start gap-3">
                  <a href={item.photo_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                    <img src={item.photo_url} alt="Part" className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
                  </a>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {item.vehicle_brand && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">{item.vehicle_brand}</span>}
                      {item.vehicle_model && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">{item.vehicle_model}</span>}
                      {item.manufacture_year && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">{item.manufacture_year}</span>}
                    </div>
                    <p className="text-xs text-gray-500">Qty: <span className="font-semibold text-gray-800">{item.quantity}</span></p>
                    {item.note && <p className="text-xs text-gray-500 italic mt-0.5">"{item.note}"</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Sub-header — desktop, same COLS grid */}
            <div className="hidden md:grid px-4 pt-2 pb-1 gap-x-3 text-xs font-medium text-gray-400 border-b border-gray-100"
              style={{ gridTemplateColumns: COLS }}>
              <div /><span>Brand</span><span>Part Name</span><span>Model</span>
              <span /><span>Qty</span><span /><span /><span /><span />
            </div>

            {/* Item rows */}
            {details.items.map((item, i) => (
              <div key={item.id} className={`px-4 py-2 ${i < details.items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="hidden md:grid items-center gap-x-3 text-sm"
                  style={{ gridTemplateColumns: COLS }}>
                  <div />
                  <span className="text-gray-600 truncate">{item.vehicle_brand || '—'}</span>
                  <span className="text-gray-800 font-medium truncate">{item.part_name || item.product_name}</span>
                  <span className="text-gray-500 truncate">{item.vehicle_model || '—'}</span>
                  <span />
                  <span className="font-semibold text-gray-800">{item.quantity}</span>
                  <span /><span /><span /><span />
                </div>
                <div className="md:hidden">
                  <p className="text-sm font-medium text-gray-800">{item.part_name || item.product_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.vehicle_brand}{item.vehicle_model && ` · ${item.vehicle_model}`} · Qty: {item.quantity}
                  </p>
                </div>
              </div>
            ))}

            {details.notes && (
              <p className="px-4 py-2 text-xs text-gray-500 italic border-t border-gray-100">
                Note: {details.notes}
              </p>
            )}
          </>
        )}
        <div className="px-4 py-2 border-t border-gray-100 flex justify-end">
          <button onClick={() => setShowDetail(true)}
            className="text-xs text-blue-600 hover:underline font-medium">
            View Status
          </button>
        </div>
      </div>}

      {showDetail && <DetailModal type="order" id={order.id} onClose={() => setShowDetail(false)} />}
    </div>
  );
}
