import { useState } from 'react';
import { getOrderById } from '../api/orders.api';
import StatusBadge from './StatusBadge';

export default function OrderCard({ order, showRetailerName, onAccept, onReject, checkable, checked, onCheck }) {
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

  const total = details?.items?.reduce((s, i) => s + i.quantity * parseFloat(i.unit_price), 0);
  const fmt   = (v) => parseFloat(v).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
        {checkable && (
          <input type="checkbox" checked={checked} onChange={(e) => onCheck(order.id, e.target.checked)}
            className="w-4 h-4 accent-blue-600 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-gray-800 text-xs sm:text-sm bg-gray-100 px-2 py-0.5 rounded">{order.order_number}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {showRetailerName && <span className="font-medium text-gray-700">{order.retailer_name} · </span>}
            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <span className="font-bold text-gray-900 flex-shrink-0 text-sm">₹{fmt(order.total_amount)}</span>
        {order.status === 'pending' && onAccept && (
          <div className="flex gap-1 sm:gap-1.5 flex-shrink-0">
            <button onClick={() => handle('accept')} disabled={!!acting}
              className="text-xs bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-2.5 sm:px-3 py-1.5 rounded-lg font-medium">
              {acting === 'accept' ? '…' : 'Accept'}
            </button>
            <button onClick={() => handle('reject')} disabled={!!acting}
              className="text-xs bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-2.5 sm:px-3 py-1.5 rounded-lg font-medium">
              {acting === 'reject' ? '…' : 'Reject'}
            </button>
          </div>
        )}
        <button onClick={toggle} className="text-xs text-blue-600 hover:underline flex-shrink-0">
          {expanded ? 'Hide' : 'Details'}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-3 sm:px-4 py-3">
          {!details ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm mb-3 min-w-[300px]">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-200">
                      <th className="text-left pb-2">Product</th>
                      <th className="text-left pb-2 hidden sm:table-cell">SKU</th>
                      <th className="text-right pb-2">Qty</th>
                      <th className="text-right pb-2 hidden sm:table-cell">Unit Price</th>
                      <th className="text-right pb-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-1.5 text-gray-800">{item.product_name}</td>
                        <td className="py-1.5 text-gray-500 text-xs hidden sm:table-cell">{item.sku}</td>
                        <td className="py-1.5 text-right">{item.quantity}</td>
                        <td className="py-1.5 text-right text-gray-600 hidden sm:table-cell">₹{fmt(item.unit_price)}</td>
                        <td className="py-1.5 text-right font-medium">₹{fmt(item.quantity * parseFloat(item.unit_price))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
