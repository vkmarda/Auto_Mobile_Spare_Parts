import { useEffect, useState } from 'react';
import { getOrderDetail, getReturnDetail } from '../api/detail.api';
import StatusBadge from './StatusBadge';

const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const TYPE_DOT = {
  placed: 'bg-blue-500', accepted: 'bg-green-500', rejected: 'bg-red-500',
  dispatched: 'bg-purple-500', delivered: 'bg-teal-500', confirmed: 'bg-green-600',
  return_requested: 'bg-amber-400', return_accepted: 'bg-blue-400',
  return_dispatched: 'bg-purple-400', return_received: 'bg-teal-400',
  return_settled: 'bg-green-400', return_cancelled: 'bg-gray-400',
};

function Timeline({ events }) {
  return (
    <div className="space-y-0">
      {events.map((e, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${TYPE_DOT[e.type] || 'bg-gray-300'}`} />
            {i < events.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
          </div>
          <div className="pb-3">
            <p className="text-sm font-medium text-gray-800">{e.event}</p>
            <p className="text-xs text-gray-400">{fmt(e.time)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderItems({ items, orderType }) {
  if (!items?.length) return <p className="text-xs text-gray-400">No items.</p>;
  if (orderType === 'photo') return (
    <table className="w-full text-xs">
      <thead><tr className="text-gray-400 border-b border-gray-100">
        <th className="text-left py-1.5">Photo</th>
        <th className="text-left py-1.5">Brand</th>
        <th className="text-left py-1.5 hidden sm:table-cell">Model</th>
        <th className="text-left py-1.5 hidden sm:table-cell">Year</th>
        <th className="text-left py-1.5 hidden sm:table-cell">Note</th>
        <th className="text-right py-1.5">Qty</th>
      </tr></thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="border-b border-gray-50 last:border-0">
            <td className="py-1.5">
              {item.photo_url
                ? <a href={item.photo_url} target="_blank" rel="noopener noreferrer">
                    <img src={item.photo_url} alt="Part" className="w-10 h-10 object-cover rounded-lg border border-gray-200 hover:opacity-80" />
                  </a>
                : '—'}
            </td>
            <td className="py-1.5 text-gray-700">{item.vehicle_brand || '—'}</td>
            <td className="py-1.5 text-gray-700 hidden sm:table-cell">{item.vehicle_model || '—'}</td>
            <td className="py-1.5 text-gray-500 hidden sm:table-cell">{item.manufacture_year || '—'}</td>
            <td className="py-1.5 text-gray-400 italic hidden sm:table-cell">{item.note || '—'}</td>
            <td className="py-1.5 text-right font-medium text-gray-800">{item.quantity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  return (
    <table className="w-full text-xs">
      <thead><tr className="text-gray-400 border-b border-gray-100">
        <th className="text-left py-1.5">Product</th>
        <th className="text-left py-1.5 hidden sm:table-cell">SKU</th>
        <th className="text-left py-1.5 hidden sm:table-cell">Vehicle</th>
        <th className="text-right py-1.5">Qty</th>
      </tr></thead>
      <tbody>
        {items.map((item) => {
          const vehicle = [item.vehicle_brand, item.vehicle_model, item.manufacture_year].filter(Boolean).join(' · ');
          return (
            <tr key={item.id} className="border-b border-gray-50 last:border-0">
              <td className="py-1.5 text-gray-700">{item.product_name}{item.part_name ? ` · ${item.part_name}` : ''}</td>
              <td className="py-1.5 text-gray-400 font-mono hidden sm:table-cell">{item.sku}</td>
              <td className="py-1.5 text-gray-500 hidden sm:table-cell">{vehicle || '—'}</td>
              <td className="py-1.5 text-right font-medium text-gray-800">{item.quantity}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function DetailModal({ type, id, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    (type === 'order' ? getOrderDetail(id) : getReturnDetail(id))
      .then(setData).catch(() => setError('Failed to load details')).finally(() => setLoading(false));
  }, [type, id]);

  const main   = type === 'order' ? data?.order  : data?.return;
  const items  = data?.items  || [];
  const timeline = data?.timeline || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-gray-800">
              {main ? (type === 'order' ? main.order_number : main.return_number) : '…'}
            </span>
            {main && <StatusBadge status={main.status} />}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {loading && <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 h-4 rounded animate-pulse" />)}</div>}
          {error  && <p className="text-sm text-red-500">{error}</p>}

          {main && (
            <>
              {/* Retailer info */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div><span className="text-xs text-gray-400">Retailer</span><p className="font-medium text-gray-800">{main.retailer_name}</p></div>
                <div><span className="text-xs text-gray-400">Mobile</span><p className="text-gray-700">{main.retailer_mobile || '—'}</p></div>
                <div><span className="text-xs text-gray-400">City</span><p className="text-gray-700">{[main.retailer_city, main.retailer_state].filter(Boolean).join(', ') || '—'}</p></div>
                {type === 'return' && main.reason && (
                  <div className="col-span-2"><span className="text-xs text-gray-400">Reason</span><p className="text-gray-700 italic">"{main.reason}"</p></div>
                )}
                {type === 'order' && main.notes && (
                  <div className="col-span-2"><span className="text-xs text-gray-400">Notes</span><p className="text-gray-700">{main.notes}</p></div>
                )}
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Items</p>
                <OrderItems items={items} orderType={type === 'order' ? main.order_type : (items[0]?.photo_url ? 'photo' : 'standard')} />
              </div>

              {/* Dispatch info (order only) */}
              {type === 'order' && data?.dispatch && (
                <div className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-sm">
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Dispatch</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-600">
                    <span className="font-mono font-bold text-purple-700">{data.dispatch.dispatch_number}</span>
                    <StatusBadge status={data.dispatch.dispatch_status} />
                    <span>{fmt(data.dispatch.dispatched_at)}</span>
                  </div>
                </div>
              )}

              {/* Return photos */}
              {type === 'return' && main.photos?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Photos</p>
                  <div className="flex flex-wrap gap-2">
                    {main.photos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Photo ${i+1}`} className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-80" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {timeline.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Audit Trail</p>
                  <Timeline events={timeline} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
