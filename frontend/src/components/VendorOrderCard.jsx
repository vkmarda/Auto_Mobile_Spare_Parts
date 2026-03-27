import { useState } from 'react';
import { getOrderById } from '../api/orders.api';
import StatusBadge from './StatusBadge';

const BORDER = { pending: 'border-l-yellow-400', accepted: 'border-l-green-500', rejected: 'border-l-red-400' };

// Column template — must match the header in VendorDashboard
const COLS = '20px 80px 110px 1fr 130px 55px 120px 80px 85px auto';

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
  const total    = details?.items?.reduce((s, i) => s + i.quantity * parseFloat(i.unit_price), 0);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 overflow-hidden ${BORDER[order.status] || 'border-l-gray-300'}`}>

      {/* Data row — grid aligned */}
      <div className="px-4 py-3 grid items-center gap-x-3"
        style={{ gridTemplateColumns: COLS }}>

        {/* Checkbox */}
        <div className="flex items-center">
          {checkable
            ? <input type="checkbox" checked={checked} onChange={(e) => onCheck(order.id, e.target.checked)}
                className="w-4 h-4 accent-blue-600" />
            : null}
        </div>

        {/* Order ID */}
        <span className="font-mono text-xs text-gray-500 truncate">#{order.id.slice(0, 8)}</span>

        {/* Phone */}
        <span className="text-sm text-gray-700 truncate">{order.retailer_mobile || '—'}</span>

        {/* Retailer name */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{order.retailer_name}</p>
        </div>

        {/* Date + age */}
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{date}</p>
          <p className="text-xs text-gray-400">{age}</p>
        </div>

        {/* Items */}
        <span className="text-sm text-gray-500">
          {order.item_count} item{order.item_count != 1 ? 's' : ''}
        </span>

        {/* Location */}
        <span className="text-xs text-gray-500 truncate">
          {location || '—'}
        </span>

        {/* Amount */}
        <span className="text-sm font-bold text-gray-900 text-right">
          ₹{parseFloat(order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>

        {/* Status */}
        <div><StatusBadge status={order.status} /></div>

        {/* Actions */}
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

      {/* Expanded items */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          {!details ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <table className="w-full text-sm mb-3">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-200">
                    <th className="text-left pb-2">Product</th>
                    <th className="text-left pb-2">SKU</th>
                    <th className="text-right pb-2">Qty</th>
                    <th className="text-right pb-2">Unit Price</th>
                    <th className="text-right pb-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {details.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-1.5 text-gray-800">{item.product_name}</td>
                      <td className="py-1.5 text-gray-500 text-xs">{item.sku}</td>
                      <td className="py-1.5 text-right">{item.quantity}</td>
                      <td className="py-1.5 text-right text-gray-600">₹{parseFloat(item.unit_price).toFixed(2)}</td>
                      <td className="py-1.5 text-right font-medium">₹{(item.quantity * parseFloat(item.unit_price)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between items-center">
                {details.notes && <p className="text-xs text-gray-500 italic">Note: {details.notes}</p>}
                <p className="text-sm font-bold text-gray-900 ml-auto">Total: ₹{total.toFixed(2)}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export { COLS };
