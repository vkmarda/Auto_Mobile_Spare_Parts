import { useEffect, useState } from 'react';
import { getOrderById } from '../api/orders.api';
import StatusBadge from './StatusBadge';

export default function OrderCard({ order, showRetailerName, onAccept, onReject, checkable, checked, onCheck }) {
  const [details, setDetails] = useState(null);
  const [acting, setActing]   = useState(null);

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

  const totalQty = details
    ? details.items.reduce((s, i) => s + i.quantity, 0)
    : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

      {/* Header row */}
      <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
        {checkable && (
          <input type="checkbox" checked={checked}
            onChange={(e) => onCheck(order.id, e.target.checked)}
            className="w-4 h-4 accent-blue-600 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-gray-800 text-xs sm:text-sm bg-gray-100 px-2 py-0.5 rounded">
              {order.order_number}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {showRetailerName && (
              <span className="font-medium text-gray-700">{order.retailer_name} · </span>
            )}
            {new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
            {totalQty !== null && (
              <span className="ml-2 text-gray-400">· {totalQty} unit{totalQty !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
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
      </div>

      {/* Items detail — always visible */}
      <div className="border-t border-gray-100 bg-gray-50 px-3 sm:px-4 py-3">
        {!details ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-200">
                    <th className="text-left pb-2 pr-3 font-medium">Part</th>
                    <th className="text-left pb-2 pr-3 font-medium hidden sm:table-cell">Brand</th>
                    <th className="text-left pb-2 pr-3 font-medium hidden sm:table-cell">Model</th>
                    <th className="text-left pb-2 pr-3 font-medium">SKU</th>
                    <th className="text-right pb-2 font-medium">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {details.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-1.5 pr-3 text-gray-800 font-medium">
                        {item.part_name || item.product_name}
                      </td>
                      <td className="py-1.5 pr-3 text-gray-500 hidden sm:table-cell">
                        {item.vehicle_brand || '—'}
                      </td>
                      <td className="py-1.5 pr-3 text-gray-500 hidden sm:table-cell">
                        {item.vehicle_model || '—'}
                      </td>
                      <td className="py-1.5 pr-3 text-gray-400 font-mono text-xs">
                        {item.sku}
                      </td>
                      <td className="py-1.5 text-right font-semibold text-gray-800">
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {details.notes && (
              <p className="text-xs text-gray-400 italic mt-2">Note: {details.notes}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
