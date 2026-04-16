import { useState } from 'react';
import StatusBadge from './StatusBadge';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

export default function RetailerOrderRow({ order }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex flex-wrap items-center gap-2 px-4 py-3 hover:bg-gray-50 text-left">
        <span className={`text-gray-400 text-xs transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}>▾</span>
        <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{order.order_number}</span>
        <StatusBadge status={order.status} />
        <span className="text-xs text-gray-400">{fmtDate(order.created_at)}</span>
        <span className="text-xs text-gray-500">{order.total_qty} unit{order.total_qty !== 1 ? 's' : ''}</span>
        {order.notes && (
          <span className="text-xs text-gray-400 italic truncate max-w-[160px]">"{order.notes}"</span>
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 pl-9 space-y-2">
          {/* Items */}
          {!order.items || order.items.length === 0 ? (
            <p className="text-xs text-gray-400">No item details.</p>
          ) : order.order_type === 'photo' ? (
            order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                <img src={item.photo_url} alt="part" className="w-10 h-10 object-cover rounded border border-gray-200" />
                <span>{item.vehicle_brand} {item.vehicle_model}</span>
                <span className="font-semibold">×{item.quantity}</span>
                {item.note && <span className="italic text-gray-400">"{item.note}"</span>}
              </div>
            ))
          ) : (
            order.items.map((item, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                <span className="font-medium">{item.product_name}</span>
                {item.sku && <span className="text-gray-400 font-mono">{item.sku}</span>}
                {item.vehicle_brand && (
                  <span className="text-gray-400">{item.vehicle_brand} {item.vehicle_model}</span>
                )}
                <span className="font-semibold ml-auto">×{item.quantity}</span>
              </div>
            ))
          )}

          {/* Timeline */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-400 pt-1">
            {fmtDate(order.accepted_at)   && <span>Accepted: {fmtDate(order.accepted_at)}</span>}
            {fmtDate(order.dispatched_at) && <span>Dispatched: {fmtDate(order.dispatched_at)}</span>}
            {fmtDate(order.delivered_at)  && <span>Delivered: {fmtDate(order.delivered_at)}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
