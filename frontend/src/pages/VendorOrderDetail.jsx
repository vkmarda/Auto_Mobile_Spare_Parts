import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById } from '../api/orders.api';
import { acceptOrder, rejectOrder, dispatchOrder, deliverOrder } from '../api/vendor.api';
import StatusBadge from '../components/StatusBadge';

const STEPS = ['pending', 'accepted', 'dispatched', 'delivered'];

function Timeline({ status }) {
  const stepIdx  = STEPS.indexOf(status);
  const rejected = status === 'rejected';
  return (
    <div className="flex items-start mb-8">
      {STEPS.map((step, i) => {
        const done    = !rejected && i < stepIdx;
        const current = !rejected && i === stepIdx;
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${done ? 'bg-green-500 text-white' : current ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {done ? '✓' : i + 1}
              </div>
              <p className={`text-xs mt-1 whitespace-nowrap
                ${current ? 'text-blue-600 font-semibold' : done ? 'text-green-600' : 'text-gray-400'}`}>
                {step.charAt(0).toUpperCase() + step.slice(1)}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mb-5 mx-1 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function VendorOrderDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    try { setOrder(await getOrderById(id)); } finally { setLoading(false); }
  }

  async function act(fn) {
    setActing(true);
    try { await fn(id); await load(); } finally { setActing(false); }
  }

  if (loading) return <div className="p-12 text-center text-gray-400">Loading…</div>;
  if (!order)  return <div className="p-12 text-center text-gray-400">Order not found.</div>;

  const { status } = order;
  const subtitle = [order.retailer_mobile, order.retailer_city, order.retailer_state].filter(Boolean).join(' · ');

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button onClick={() => navigate('/vendor')}
        className="text-sm text-gray-400 hover:text-gray-700 mb-6 flex items-center gap-1">
        ← Back to home
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs text-gray-400 font-mono mb-0.5">{order.order_number || `#${order.id.slice(0, 8)}`}</p>
          <h1 className="text-xl font-bold text-gray-900">{order.retailer_name}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="text-right">
          <StatusBadge status={status} />
          <p className="text-xs text-gray-400 mt-2">
            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      <Timeline status={status} />

      <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
        <div className="grid grid-cols-[1fr_56px] text-xs font-semibold text-gray-400 px-4 py-2.5 border-b border-gray-100 uppercase tracking-wide">
          <span>Product</span>
          <span className="text-center">Qty</span>
        </div>
        {(order.items || []).map(item => (
          <div key={item.id} className="grid grid-cols-[1fr_56px] px-4 py-3 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm text-gray-900">{item.product_name}</p>
              <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
            </div>
            <span className="text-sm text-gray-700 text-center self-center">{item.quantity}</span>
          </div>
        ))}
      </div>

      {order.notes && (
        <p className="text-sm text-gray-500 italic mb-6">Notes: {order.notes}</p>
      )}

      <div className="flex gap-3">
        {status === 'pending' && <>
          <button disabled={acting} onClick={() => act(acceptOrder)}
            className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-40">
            Accept Order
          </button>
          <button disabled={acting} onClick={() => act(rejectOrder)}
            className="flex-1 bg-red-100 text-red-700 py-3 rounded-xl font-semibold text-sm hover:bg-red-200 disabled:opacity-40">
            Reject Order
          </button>
        </>}
        {status === 'accepted' && (
          <button disabled={acting} onClick={() => act(dispatchOrder)}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-40">
            Mark as Dispatched
          </button>
        )}
        {status === 'dispatched' && (
          <button disabled={acting} onClick={() => act(deliverOrder)}
            className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-purple-700 disabled:opacity-40">
            Mark as Delivered
          </button>
        )}
        {(status === 'delivered' || status === 'rejected') && (
          <p className="text-sm text-gray-400 py-3">
            Order is {status}. No further actions available.
          </p>
        )}
      </div>
    </div>
  );
}
