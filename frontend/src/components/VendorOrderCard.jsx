import { useState } from 'react';
import { getOrderById } from '../api/orders.api';
import StatusBadge from './StatusBadge';

const BORDER = { pending: 'border-l-yellow-400', accepted: 'border-l-green-500', rejected: 'border-l-red-400' };

const COLS = '20px 90px 110px 1fr 130px 55px 120px 90px auto';

export default function VendorOrderCard({ order, onAccept, onReject, checkable, checked, onCheck }) {
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails]   = useState(null);
  const [acting, setActing]     = useState(null);

  const toggle = async () => {
    if (!expanded && !details) {
      const data = await getOrderById(order.id);
      setDetails(data);
    }
    setExpanded((v) => !v);
  };

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
  const totalQty = details?.items?.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 overflow-hidden ${BORDER[order.status] || 'border-l-gray-300'}`}>

      {/* ── Mobile card (< md) ── */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {checkable && (
                <input type="checkbox" checked={checked} onChange={(e) => onCheck(order.id, e.target.checked)}
                  className="w-4 h-4 accent-blue-600" />
              )}
              <span className="font-mono font-bold text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">{order.order_number}</span>
              <StatusBadge status={order.status} />
            </div>
            <p className={`text-sm ${order.status === 'pending' ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
              {order.retailer_name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {date} · {order.item_count} item{order.item_count != 1 ? 's' : ''}
              {location && ` · ${location}`}
            </p>
          </div>
          <div className="text-right shrink-0">
            {order.retailer_mobile && (
              <p className="text-xs text-gray-400">{order.retailer_mobile}</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-1.5">
          {order.status === 'pending' && onAccept && (
            <>
              <button onClick={() => handle('accept')} disabled={!!acting}
                className="text-xs bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium flex items-center gap-1">
                {acting === 'accept'
                  ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : '✓'} Accept
              </button>
              <button onClick={() => handle('reject')} disabled={!!acting}
                className="text-xs bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium flex items-center gap-1">
                {acting === 'reject'
                  ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : '✕'} Reject
              </button>
            </>
          )}
          <button onClick={toggle} className="text-xs text-blue-600 hover:underline px-1">
            {expanded ? 'Hide ↑' : 'Details →'}
          </button>
        </div>
      </div>

      {/* ── Desktop grid row (≥ md) ── */}
      <div className="hidden md:grid px-4 py-3 items-center gap-x-3"
        style={{ gridTemplateColumns: COLS }}>

        <div className="flex items-center">
          {checkable
            ? <input type="checkbox" checked={checked} onChange={(e) => onCheck(order.id, e.target.checked)}
                className="w-4 h-4 accent-blue-600" />
            : null}
        </div>

        <span className="font-mono font-bold text-gray-800 text-sm bg-gray-100 px-2 py-0.5 rounded truncate">{order.order_number}</span>
        <span className="text-sm text-gray-700 truncate">{order.retailer_mobile || '—'}</span>

        <div className="min-w-0">
          <p className={`text-sm truncate ${order.status === 'pending' ? 'font-bold text-gray-900' : 'font-normal text-gray-700'}`}>{order.retailer_name}</p>
        </div>

        <div className="min-w-0">
          <p className="text-xs text-gray-500">{date}</p>
          <p className="text-xs text-gray-400">{age}</p>
        </div>

        <span className="text-sm text-gray-500">{order.item_count} item{order.item_count != 1 ? 's' : ''}</span>
        <span className="text-xs text-gray-500 truncate">{location || '—'}</span>
        <div><StatusBadge status={order.status} /></div>

        <div className="flex items-center gap-1.5 justify-end">
          {order.status === 'pending' && onAccept && (
            <>
              <button onClick={() => handle('accept')} disabled={!!acting}
                className="text-xs bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                {acting === 'accept'
                  ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : '✓'} Accept
              </button>
              <button onClick={() => handle('reject')} disabled={!!acting}
                className="text-xs bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                {acting === 'reject'
                  ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : '✕'} Reject
              </button>
            </>
          )}
          <button onClick={toggle} className="text-xs text-blue-600 hover:underline whitespace-nowrap">
            {expanded ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {/* Expanded items — shared */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          {!details ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm mb-3 min-w-[360px]">
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
                <p className="text-xs text-gray-500 italic">Note: {details.notes}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export { COLS };
