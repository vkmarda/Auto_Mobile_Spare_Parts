import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Camera, X, Eye, EyeOff } from 'lucide-react';
import { getOrderById } from '../api/orders.api';
import StatusBadge from './StatusBadge';
import DetailModal from './DetailModal';
import { useToast } from '../context/ToastContext';

const BORDER = { pending: 'border-l-indigo-400', accepted: 'border-l-sky-400', partially_accepted: 'border-l-orange-400', partial_confirmed: 'border-l-sky-400', rejected: 'border-l-red-400', dispatched: 'border-l-violet-400', delivered: 'border-l-teal-400', confirmed: 'border-l-green-500' };

// cb | Retailer+Order | Phone | Date | Units | Location | Status | Action | Toggle
export const COLS       = '20px minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) 120px 48px';
export const COLS_NO_CB =      'minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) 120px 48px';

const REJECT_REASONS = ['Out of stock', 'Duplicate order', 'Incomplete details', 'Price issue'];

function ConfirmActionModal({ type, order, details, rejectReason, setRejectReason, onConfirm, onCancel, loading }) {
  const isAccept = type === 'accept';
  const items = isAccept && details?.order_type !== 'photo' ? (details?.items ?? null) : null;

  const [qtys, setQtys] = useState(() => {
    if (!items) return {};
    const init = {};
    items.forEach((i) => { init[i.id] = i.quantity; });
    return init;
  });

  const isPartial  = items && items.some((i) => (qtys[i.id] ?? i.quantity) < i.quantity);
  const hasAnyQty  = !items || items.some((i) => (qtys[i.id] ?? i.quantity) > 0);

  const handleConfirm = () => {
    if (isPartial) {
      onConfirm(true, items.map((i) => ({ id: i.id, approved_quantity: qtys[i.id] ?? i.quantity })));
    } else {
      onConfirm(false, null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">
            {isAccept ? (isPartial ? 'Partially Accept Order?' : 'Accept Order?') : 'Reject Order?'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="bg-gray-50 rounded-lg border border-gray-100 px-4 py-3 mb-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Order</span>
            <span className="font-mono font-bold text-gray-800">{order.order_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Retailer</span>
            <span className="font-medium text-gray-800">{order.retailer_name}</span>
          </div>
        </div>

        {isAccept && items && (
          <>
            <p className="text-xs text-gray-400 mb-2">Adjust quantities if you can only partially fulfill this order.</p>
            <div className="space-y-2 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.part_name || item.product_name}</p>
                    <p className="text-xs text-gray-400">{[item.vehicle_brand, item.vehicle_model].filter(Boolean).join(' · ') || item.sku}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input type="number" min="0" max={item.quantity}
                      value={qtys[item.id] ?? item.quantity}
                      onChange={(e) => {
                        const v = Math.min(Math.max(0, parseInt(e.target.value) || 0), item.quantity);
                        setQtys((p) => ({ ...p, [item.id]: v }));
                      }}
                      className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-400" />
                    <span className="text-xs text-gray-400">of {item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
            {isPartial && (
              <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-3">
                Retailer will need to confirm these quantities before you can dispatch.
              </p>
            )}
            {!hasAnyQty && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                At least one item must have a quantity greater than 0.
              </p>
            )}
          </>
        )}

        {!isAccept && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Reason for rejection</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {REJECT_REASONS.map((r) => (
                <button key={r} onClick={() => setRejectReason(r)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${rejectReason === r ? 'bg-red-100 border-red-300 text-red-700 font-medium' : 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-600'}`}>
                  {r}
                </button>
              ))}
            </div>
            <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Or type a reason…"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300" />
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleConfirm}
            disabled={loading || (!isAccept && !rejectReason.trim()) || (isAccept && !hasAnyQty)}
            className={`flex-1 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${
              !isAccept ? 'bg-red-500 hover:bg-red-600' :
              isPartial ? 'bg-orange-500 hover:bg-orange-600' :
              'bg-green-600 hover:bg-green-700'
            }`}>
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? 'Processing…' : !isAccept ? 'Reject Order' : isPartial ? 'Partially Accept' : 'Accept Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VendorOrderCard({ order, onAccept, onReject, onPartialAccept, checkable, checked, onCheck, defaultExpanded, showCheckCol }) {
  const navigate                  = useNavigate();
  const showToast                 = useToast();
  const [details, setDetails]     = useState(null);
  const [acting, setActing]       = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'accept' | 'reject' | null
  const [rejectReason, setRejectReason] = useState('');
  const isPending                 = order.status === 'pending';
  const useCheckCol               = checkable || showCheckCol;
  const [expanded, setExpanded]   = useState(defaultExpanded !== undefined ? defaultExpanded : false);

  useEffect(() => {
    getOrderById(order.id).then(setDetails).catch(() => {});
  }, [order.id]);

  const handle = async (isPartial, items) => {
    const action = confirmAction;
    setActing(action);
    try {
      if (action === 'accept') {
        if (isPartial) {
          await onPartialAccept(order.id, { items });
          showToast(`${order.order_number} partially accepted · awaiting retailer confirmation`, 'info');
        } else {
          await onAccept(order.id);
          showToast(`${order.order_number} accepted · ${order.retailer_name}`);
        }
      } else {
        await onReject(order.id, rejectReason);
        showToast(`${order.order_number} rejected · ${order.retailer_name}`, 'info');
      }
    } finally {
      setActing(null);
      setConfirmAction(null);
      setRejectReason('');
    }
  };

  const date     = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const daysDiff = Math.floor((Date.now() - new Date(order.created_at)) / 86400000);
  const ageText  = daysDiff === 0 ? 'Today' : `${daysDiff}d ago`;
  const ageColor = daysDiff >= 5 ? 'text-red-500 font-semibold' : daysDiff >= 3 ? 'text-orange-500 font-semibold' : 'text-gray-400';
  const location = [order.retailer_city, order.retailer_state].filter(Boolean).join(', ');
  const totalQty = details?.items?.reduce((s, i) => s + i.quantity, 0) ?? order.item_count;

  const ActionCell = () => (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {isPending && onAccept && (
        <>
          <button onClick={() => setConfirmAction('accept')} disabled={!!acting}
            className="text-xs bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1">
            <Check size={12} strokeWidth={3} />Accept
          </button>
          <button onClick={() => { setRejectReason(''); setConfirmAction('reject'); }} disabled={!!acting}
            className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50 font-medium">
            Reject
          </button>
        </>
      )}
      {(order.status === 'accepted' || order.status === 'partial_confirmed') && (
        <button onClick={() => navigate('/vendor/dispatch')}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap">
          Dispatch →
        </button>
      )}
    </div>
  );

  const ToggleBtn = () => (
    <button onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
      className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors flex-shrink-0 ${expanded ? 'text-indigo-600 hover:bg-indigo-50' : 'text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
      {expanded ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  return (
    <div className={`bg-white border border-gray-200 border-l-4 rounded-xl shadow-sm overflow-hidden ${BORDER[order.status] || 'border-l-gray-300'}`}>

      {/* ── Mobile ── */}
      <div className="md:hidden px-4 py-3 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {checkable && (
                <input type="checkbox" checked={checked}
                  onChange={(e) => onCheck(order.id, e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 accent-blue-600" />
              )}
              <span className="font-mono font-bold text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">{order.order_number}</span>
              {order.order_type === 'photo' && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Camera size={10} />Photo</span>
              )}
              <StatusBadge status={order.status} />
            </div>
            <p className={`text-sm ${isPending ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
              {order.retailer_name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {date} · <span className={ageColor}>{ageText}</span> · {totalQty} unit{totalQty !== 1 ? 's' : ''}
              {location && ` · ${location}`}
            </p>
          </div>
          {order.retailer_mobile && (
            <a href={`tel:${order.retailer_mobile}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-blue-500 hover:text-blue-700 hover:underline shrink-0 font-medium">
              {order.retailer_mobile}
            </a>
          )}
        </div>
        <div className="flex items-center justify-between">
          <ActionCell />
          <ToggleBtn />
        </div>
      </div>

      {/* ── Desktop grid row ── */}
      <div className="hidden md:grid px-4 py-3 items-center gap-x-3 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
        style={{ gridTemplateColumns: useCheckCol ? COLS : COLS_NO_CB }}>
        {/* cb — reserve column when list uses checkboxes, even if this card isn't checkable */}
        {useCheckCol && (
          <div>
            {checkable && (
              <input type="checkbox" checked={checked}
                onChange={(e) => onCheck(order.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 accent-blue-600" />
            )}
          </div>
        )}
        {/* Retailer + Order# */}
        <div className="min-w-0">
          <p className={`text-sm truncate ${isPending ? 'font-bold text-gray-900' : 'font-normal text-gray-700'}`}>
            {order.retailer_name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{order.order_number}</span>
            {order.order_type === 'photo' && (
              <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1"><Camera size={10} />Photo</span>
            )}
          </div>
        </div>
        {/* Phone */}
        {order.retailer_mobile
          ? <a href={`tel:${order.retailer_mobile}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-blue-500 hover:text-blue-700 hover:underline whitespace-nowrap font-medium">
              {order.retailer_mobile}
            </a>
          : <span className="text-sm text-gray-400">—</span>}
        {/* Date */}
        <div>
          <p className="text-xs text-gray-500">{date}</p>
          <p className={`text-xs ${ageColor}`}>{ageText}</p>
        </div>
        {/* Units */}
        <span className="text-sm text-gray-500">{totalQty}</span>
        {/* Location */}
        <span className="text-xs text-gray-500 break-words">{location || '—'}</span>
        {/* Status */}
        <div><StatusBadge status={order.status} /></div>
        {/* Action */}
        <div className="min-w-0"><ActionCell /></div>
        {/* Toggle */}
        <div><ToggleBtn /></div>
      </div>

      {/* ── Item details — toggled ── */}
      {expanded && (
        <div className="border-t-2 border-gray-200 bg-gray-50 px-3 pb-3 pt-2.5">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            {!details ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : details.order_type === 'photo' ? (
              <div className="divide-y divide-gray-100">
                {details.items.map((item, i) => (
                  <div key={item.id || i} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <a href={item.photo_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                        <img src={item.photo_url} alt="Part" className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
                      </a>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
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
                <div className="hidden md:grid px-4 py-2 gap-x-4 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200"
                  style={{ gridTemplateColumns: 'minmax(80px,1fr) minmax(120px,2fr) minmax(80px,1fr) 48px' }}>
                  <span>Brand</span><span>Part Name</span><span>Model</span><span>Qty</span>
                </div>
                {details.items.map((item, i) => (
                  <div key={item.id} className={`px-4 py-2.5 ${i < details.items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="hidden md:grid items-center gap-x-4 text-sm"
                      style={{ gridTemplateColumns: 'minmax(80px,1fr) minmax(120px,2fr) minmax(80px,1fr) 48px' }}>
                      <span className="text-gray-500 break-words">{item.vehicle_brand || '—'}</span>
                      <span className="text-gray-900 font-semibold break-words">{item.part_name || item.product_name}</span>
                      <span className="text-gray-500 break-words">{item.vehicle_model || '—'}</span>
                      <span className="font-bold text-gray-800">{item.quantity}</span>
                    </div>
                    <div className="md:hidden">
                      <p className="text-sm font-semibold text-gray-900">{item.part_name || item.product_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.vehicle_brand}{item.vehicle_model && ` · ${item.vehicle_model}`} · Qty: <span className="font-semibold text-gray-700">{item.quantity}</span>
                      </p>
                    </div>
                  </div>
                ))}
                {details.notes && (
                  <p className="px-4 py-2.5 text-xs text-gray-500 italic border-t border-gray-100 bg-gray-50">
                    Note: {details.notes}
                  </p>
                )}
              </>
            )}
            <div className="px-4 py-2.5 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button onClick={() => setShowDetail(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                View Full Details →
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetail && <DetailModal type="order" id={order.id} onClose={() => setShowDetail(false)} />}
      {confirmAction && (
        <ConfirmActionModal
          type={confirmAction}
          order={order}
          details={details}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          onConfirm={handle}
          onCancel={() => { setConfirmAction(null); setRejectReason(''); }}
          loading={!!acting}
        />
      )}
    </div>
  );
}
