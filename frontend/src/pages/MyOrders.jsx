import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, Truck, Inbox, Check, XCircle, RotateCcw, AlertTriangle, Camera, MapPin } from 'lucide-react';
import { getOrders, getOrderById, confirmOrder, cancelOrder, confirmPartialOrder } from '../api/orders.api';
import { createReturn, cancelReturn, getReturns } from '../api/returns.api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toWebP, uploadPhoto } from '../utils/uploadPhoto';
import ConfirmModal from '../components/ConfirmModal';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const BORDER = {
  pending:              'border-l-indigo-400',
  accepted:             'border-l-sky-400',
  partially_accepted:   'border-l-orange-400',
  partial_confirmed:    'border-l-sky-400',
  dispatched:           'border-l-violet-400',
  confirmed:            'border-l-green-500',
  rejected:             'border-l-red-400',
  cancelled:            'border-l-gray-300',
  return_requested:     'border-l-indigo-400',
  return_accepted:      'border-l-sky-400',
  return_dispatched:    'border-l-violet-400',
  return_received:      'border-l-teal-400',
  return_settled:       'border-l-green-500',
  return_cancelled:     'border-l-gray-300',
};

const BADGE_CLS = {
  pending:              'bg-indigo-100 text-indigo-800',
  accepted:             'bg-sky-100 text-sky-800',
  partially_accepted:   'bg-orange-100 text-orange-800',
  partial_confirmed:    'bg-sky-100 text-sky-800',
  dispatched:           'bg-violet-100 text-violet-800',
  confirmed:            'bg-green-100 text-green-800',
  rejected:             'bg-red-100 text-red-700',
  cancelled:            'bg-gray-100 text-gray-500',
  return_requested:     'bg-indigo-100 text-indigo-800',
  return_accepted:      'bg-sky-100 text-sky-800',
  return_dispatched:    'bg-violet-100 text-violet-800',
  return_received:      'bg-teal-100 text-teal-800',
  return_settled:       'bg-green-100 text-green-800',
  return_cancelled:     'bg-gray-100 text-gray-500',
};

const BADGE_LABELS = {
  pending:              'Pending — Awaiting vendor confirmation',
  accepted:             'Accepted — Vendor confirmed, preparing for dispatch',
  partially_accepted:   'Partially Accepted — Review quantities and confirm',
  partial_confirmed:    'Partial Confirmed — Waiting for vendor to dispatch',
  dispatched:           'Dispatched — Confirm when received',
  confirmed:            'Confirmed — Order complete',
  rejected:             'Rejected — Vendor declined',
  cancelled:            'Cancelled',
  return_requested:     'Return Requested',
  return_accepted:      'Return Accepted',
  return_dispatched:    'Return in Transit',
  return_received:      'Return Received',
  return_settled:       'Return Settled',
  return_cancelled:     'Return Cancelled',
};

const BADGE_SHORT = {
  pending:              'Pending',
  accepted:             'Accepted',
  partially_accepted:   'Partially Accepted',
  partial_confirmed:    'Partial Confirmed',
  dispatched:           'Dispatched',
  confirmed:            'Confirmed',
  rejected:             'Rejected',
  cancelled:            'Cancelled',
  return_requested:     'Return Requested',
  return_accepted:      'Return Accepted',
  return_dispatched:    'Return in Transit',
  return_received:      'Return Received',
  return_settled:       'Return Settled',
  return_cancelled:     'Return Cancelled',
};

const TABS = [
  { key: 'all',        label: 'All' },
  { key: 'pending',    label: 'Pending' },
  { key: 'partial',    label: 'Partial' },
  { key: 'accepted',   label: 'Accepted' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'confirmed',  label: 'Confirmed' },
  { key: 'rejected',   label: 'Rejected' },
  { key: 'returns',    label: 'Returns' },
  { key: 'cancelled',  label: 'Cancelled' },
];

const EMPTY = {
  all:        { icon: Package,      msg: "You haven't placed any orders yet.", sub: 'Start by browsing products.', link: true },
  pending:    { icon: Clock,        msg: 'No pending orders right now.',   sub: null, link: false },
  accepted:   { icon: CheckCircle,  msg: 'No accepted orders yet.',         sub: null, link: false },
  dispatched: { icon: Truck,        msg: 'No dispatched orders.',           sub: null, link: false },
  confirmed:  { icon: Check,        msg: 'No confirmed orders.',            sub: null, link: false },
  rejected:   { icon: XCircle,      msg: 'No rejected orders.',             sub: null, link: false },
  returns:    { icon: RotateCcw,    msg: 'No return requests.',             sub: null, link: false },
};

const COLS = '110px 1fr 120px 1fr 110px 130px';

const RETURN_STATES = ['return_requested', 'return_accepted', 'return_dispatched', 'return_received', 'return_settled', 'return_cancelled'];

const STATUS_LEGEND = [
  { status: 'pending',    label: 'Pending',    desc: 'Sent to vendor, waiting for confirmation' },
  { status: 'accepted',   label: 'Accepted',   desc: 'Vendor confirmed, will be dispatched soon' },
  { status: 'dispatched', label: 'Dispatched', desc: 'On its way — tap Confirm Delivery when you receive it' },
  { status: 'confirmed',  label: 'Confirmed',  desc: 'Order complete — you can request a return if needed' },
  { status: 'rejected',   label: 'Rejected',   desc: 'Vendor could not fulfill this order' },
];

function Badge({ status }) {
  const short = BADGE_SHORT[status] || status.charAt(0).toUpperCase() + status.slice(1);
  const full  = BADGE_LABELS[status];
  return (
    <span title={full}
      className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full cursor-default ${BADGE_CLS[status] || 'bg-gray-100 text-gray-600'}`}>
      {short}
    </span>
  );
}

/* ── 5-step Status timeline ──────────────────────── */
function StatusTimeline({ status }) {
  const isRejected = status === 'rejected';
  const isReturn   = RETURN_STATES.includes(status);
  const STEPS      = ['pending', 'accepted', 'dispatched', 'confirmed'];
  const LABELS     = ['Placed', isRejected ? 'Rejected' : 'Accepted', 'Dispatched', 'Confirmed'];

  const normalised = (status === 'partially_accepted' || status === 'partial_confirmed') ? 'accepted' : status;
  const stepIdx = isReturn ? 4 : Math.max(0, STEPS.indexOf(normalised));

  const dotCls = (idx) => {
    if (isRejected && idx === 1) return 'bg-red-500 border-red-500';
    if (isReturn || idx < stepIdx) return 'bg-green-500 border-green-500';
    if (idx === stepIdx) return 'bg-blue-500 border-blue-500';
    return 'bg-white border-gray-300';
  };
  const lineCls = (idx) => {
    if (isRejected && idx === 0) return 'bg-red-300';
    if (isReturn || idx < stepIdx) return 'bg-green-400';
    return 'bg-gray-200';
  };
  const labelCls = (idx) => {
    if (isRejected && idx === 1) return 'text-red-500';
    if (isReturn || idx <= stepIdx) return 'text-gray-600';
    return 'text-gray-300';
  };
  const filled = (idx) => isReturn || idx < stepIdx || idx === stepIdx || (isRejected && idx === 1);

  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-0">
        {LABELS.map((label, idx) => (
          <div key={label} className="flex items-start">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${dotCls(idx)}`}>
                {filled(idx) && <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white" />}
              </div>
              <span className={`text-[9px] sm:text-xs mt-0.5 sm:mt-1 whitespace-nowrap ${labelCls(idx)}`}>{label}</span>
            </div>
            {idx < LABELS.length - 1 && (
              <div className={`h-0.5 mt-1.5 sm:mt-2 mx-0.5 sm:mx-1 ${lineCls(idx)}`} style={{ width: 12 }} />
            )}
          </div>
        ))}
      </div>
      {isReturn && <Badge status={status} />}
    </div>
  );
}

/* ── Return modal ────────────────────────────────── */
function ReturnModal({ order, details, onClose, onSuccess }) {
  const fileRef                     = useRef(null);
  const isPhotoOrder                = details.order_type === 'photo';
  const [reason, setReason]         = useState('');
  const [selected, setSelected]     = useState({});
  const [quantities, setQuantities] = useState({});
  const [photos, setPhotos]         = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const toggleItem = (id, checked) => {
    setSelected((p) => ({ ...p, [id]: checked }));
    if (!checked) setQuantities((p) => { const n = { ...p }; delete n[id]; return n; });
  };

  const setQty = (id, val, max) =>
    setQuantities((p) => ({ ...p, [id]: Math.min(Math.max(1, parseInt(val) || 1), max) }));

  const handleFiles = async (files) => {
    const remaining = 5 - photos.length;
    const toAdd = Array.from(files).slice(0, remaining);
    const converted = await Promise.all(
      toAdd.map(async (f) => { const blob = await toWebP(f); return { blob, preview: URL.createObjectURL(blob) }; })
    );
    setPhotos((p) => [...p, ...converted]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const checkedItems = details.items.filter((i) => selected[i.id]);
    if (!checkedItems.length) { setError('Select at least one item to return'); return; }
    if (!reason.trim()) { setError('Reason is required'); return; }
    if (photos.length === 0) { setError('At least 1 photo is required'); return; }
    setSubmitting(true); setError('');
    try {
      const photoUrls = await Promise.all(photos.map((p) => uploadPhoto(p.blob, 'returns')));
      const result = await createReturn({
        order_id: order.id,
        reason:   reason.trim(),
        photos:   photoUrls,
        items:    checkedItems.map((i) => ({
          ...(isPhotoOrder ? { order_photo_item_id: i.id } : { order_item_id: i.id, product_id: i.product_id }),
          quantity: quantities[i.id] || i.quantity,
        })),
      });
      onSuccess(result.return_number);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit return request');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-gray-900">Request Return — {order.order_number}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Items — same UI for both order types */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Select Items to Return</p>
            <div className="space-y-2">
              {details.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <input type="checkbox" checked={!!selected[item.id]}
                    onChange={(e) => toggleItem(item.id, e.target.checked)}
                    className="w-4 h-4 accent-blue-600 flex-shrink-0" />
                  {item.photo_url ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <img src={item.photo_url} alt="Part" className="w-10 h-10 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {[item.vehicle_brand, item.vehicle_model, item.manufacture_year].filter(Boolean).join(' · ') || 'Photo item'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.product_name}</p>
                      <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                    </div>
                  )}
                  <span className="text-xs text-gray-400 whitespace-nowrap">Qty: {item.quantity}</span>
                  {selected[item.id] && (
                    <input type="number" min="1" max={item.quantity}
                      value={quantities[item.id] || item.quantity}
                      onChange={(e) => setQty(item.id, e.target.value, item.quantity)}
                      className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-center flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Return photos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Return Photos <span className="text-red-500">*</span></label>
              <span className="text-xs text-gray-400">{photos.length}/5</span>
            </div>
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {photos.map((p, i) => (
                  <div key={i} className="relative w-20 h-20">
                    <img src={p.preview} alt={`Photo ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                    <button type="button" onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center leading-none shadow">✕</button>
                  </div>
                ))}
              </div>
            )}
            {photos.length < 5 && (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-lg py-3 text-sm text-gray-400 hover:text-indigo-600 transition-colors">
                <Camera size={14} className="inline mr-1" />{photos.length === 0 ? 'Add photos (min 1 required)' : 'Add more photos'}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => handleFiles(e.target.files)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason *</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} required
              placeholder="Please describe the reason for return..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
              {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {submitting ? 'Uploading & submitting…' : 'Submit Return Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Skeleton() {
  return <div className="bg-white rounded-xl h-16 animate-pulse border border-gray-100 border-l-4 border-l-gray-200" />;
}

/* ── Order card ──────────────────────────────────── */
function OrderCard({ order, onRefresh, returnData }) {
  const navigate      = useNavigate();
  const { addToCart } = useCart();
  const [details, setDetails]       = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [reordering, setReordering]       = useState(false);
  const [confirming, setConfirming]       = useState(false);
  const [confirmingPartial, setConfirmingPartial] = useState(false);
  const [cancelling, setCancelling]       = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [showReturn, setShowReturn]   = useState(false);
  const [returnSuccess, setReturnSuccess] = useState('');
  const [toast, setToast]             = useState('');
  const [confirmModal, setConfirmModal] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    getOrderById(order.id)
      .then(setDetails)
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  }, [order.id]);

  const handleReorder = async () => {
    if (!details) return;
    setReordering(true);
    try {
      details.items.forEach((item) =>
        addToCart({ id: item.product_id, name: item.product_name, sku: item.sku, vendor_id: details.vendor_id, vendor_name: details.vendor_name }, item.quantity)
      );
      navigate('/cart');
    } finally { setReordering(false); }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try { await confirmOrder(order.id); showToast('Delivery confirmed!'); onRefresh(); } finally { setConfirming(false); }
  };

  const handleConfirmPartial = async () => {
    setConfirmingPartial(true);
    try { await confirmPartialOrder(order.id); showToast('Partial acceptance confirmed!'); onRefresh(); }
    catch (err) { showToast(err.response?.data?.error || 'Could not confirm'); }
    finally { setConfirmingPartial(false); }
  };

  const handleCancelOrder = () => {
    setConfirmModal({
      title: 'Cancel Order',
      message: 'Cancel this pending order? This cannot be undone.',
      onConfirm: async () => {
        setConfirmModal(null);
        setCancellingOrder(true);
        try { await cancelOrder(order.id); showToast('Order cancelled.'); onRefresh(); }
        catch (err) { showToast(err.response?.data?.error || 'Could not cancel order'); }
        finally { setCancellingOrder(false); }
      },
    });
  };

  const handleCancelReturn = () => {
    setConfirmModal({
      title: 'Cancel Return Request',
      message: 'Cancel this return request? This cannot be undone.',
      onConfirm: async () => {
        setConfirmModal(null);
        setCancelling(true);
        try { await cancelReturn(order.id); onRefresh(); }
        catch (err) { console.error(err); }
        finally { setCancelling(false); }
      },
    });
  };

  const handleReturnOpen = () => setShowReturn(true);

  const handleReturnSuccess = (returnNumber) => {
    setShowReturn(false);
    setReturnSuccess(`Return request ${returnNumber} submitted`);
    onRefresh();
  };

  const totalQty = details ? details.items.reduce((s, i) => s + i.quantity, 0) : null;
  const date     = fmtDate(order.created_at);
  const daysDiff = Math.floor((Date.now() - new Date(order.created_at)) / 86400000);
  const age      = daysDiff === 0 ? 'Today' : `${daysDiff}d ago`;

  return (
    <>
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}
      <div className={`rounded-xl shadow-sm border border-l-4 overflow-hidden ${
        order.status === 'dispatched' ? 'bg-teal-50 border-teal-200 border-l-teal-400' :
        `bg-white border-gray-200 ${BORDER[order.status] || 'border-l-gray-300'}`
      }`}>

        {order.status === 'dispatched' && (
          <div className="bg-teal-100 border-b border-teal-200 px-4 py-2 text-xs text-teal-800 font-medium flex items-center gap-1.5">
            <Package size={13} className="flex-shrink-0" />Parts arrived? Tap <span className="font-bold">Confirm Delivery</span> to close this order.
          </div>
        )}
        {order.status === 'partially_accepted' && (
          <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 text-xs text-orange-800 font-medium flex items-center gap-1.5">
            <AlertTriangle size={13} className="flex-shrink-0" />Vendor can only partially fulfill this order. Review the approved quantities below and confirm to proceed.
          </div>
        )}
        {/* Header */}
        <div className="px-4 py-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono font-bold text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">{order.order_number}</span>
              {order.order_type === 'photo' && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Camera size={10} />Photo</span>
              )}
              <Badge status={order.status} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-gray-900">{order.vendor_name || '—'}</p>
              {details?.vendor_mobile && (
                <a href={`tel:${details.vendor_mobile}`} className="text-xs text-blue-600 hover:underline">{details.vendor_mobile}</a>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {date} · {age}
              {totalQty !== null && <span> · {totalQty} unit{totalQty !== 1 ? 's' : ''}</span>}
            </p>
            {order.status === 'rejected' && order.rejection_reason && (
              <p className="text-xs text-red-500 mt-0.5 italic">Reason: {order.rejection_reason}</p>
            )}
          </div>
          <button onClick={handleReorder} disabled={reordering || !details}
            className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-40 font-medium flex-shrink-0 mt-1">
            {reordering ? 'Adding…' : 'Reorder'}
          </button>
        </div>

        {/* Details — always visible */}
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
          {detailLoading || !details ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <StatusTimeline status={order.status} />
              {returnSuccess && (
                <p className="text-sm text-green-600 font-medium bg-green-50 px-3 py-2 rounded-lg flex items-center gap-1.5"><CheckCircle size={14} />{returnSuccess}</p>
              )}

              {/* Return request details */}
              {returnData && RETURN_STATES.includes(order.status) && (
                <div className="rounded-lg border border-indigo-200 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-indigo-50 border-b border-indigo-100">
                    <span className="text-xs font-bold text-indigo-700">↩ Return</span>
                    <span className="font-mono text-xs text-indigo-600">{returnData.return_number}</span>
                    <Badge status={returnData.status} />
                    {returnData.reason && (
                      <span className="text-xs text-gray-400 italic truncate max-w-[160px]">"{returnData.reason}"</span>
                    )}
                  </div>
                  {returnData.items?.length > 0 && (
                    returnData.items[0]?.photo_url ? (
                      <div className="px-3 py-2 space-y-1.5">
                        {returnData.items.map((item, i) => (
                          <div key={item.id || i} className="flex items-center gap-2">
                            <img src={item.photo_url} alt="Part" className="w-10 h-10 object-cover rounded border border-gray-200 flex-shrink-0" />
                            <p className="text-xs text-gray-700 truncate">
                              {[item.vehicle_brand, item.vehicle_model, item.manufacture_year].filter(Boolean).join(' · ')}
                            </p>
                            <span className="text-xs text-gray-500 ml-auto flex-shrink-0">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-400 bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-3 py-1.5 font-medium">Part</th>
                            <th className="text-left px-3 py-1.5 font-medium hidden sm:table-cell">SKU</th>
                            <th className="text-right px-3 py-1.5 font-medium">Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {returnData.items.map((item) => (
                            <tr key={item.id} className="border-b border-gray-50 last:border-0">
                              <td className="px-3 py-1.5 text-gray-700">{item.product_name}</td>
                              <td className="px-3 py-1.5 text-gray-400 font-mono hidden sm:table-cell">{item.sku}</td>
                              <td className="px-3 py-1.5 text-right font-medium text-gray-800">{item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  )}
                  {returnData.photos?.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-3 pb-3 pt-2">
                      {returnData.photos.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={`Return photo ${i + 1}`} className="w-16 h-16 object-cover rounded-lg border border-indigo-200 hover:opacity-80 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {details.order_type === 'photo' ? (
                /* Photo order items */
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm min-w-[320px]">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-gray-200">
                        <th className="text-left pb-2 pr-3 font-medium">Photo</th>
                        <th className="text-left pb-2 pr-3 font-medium hidden sm:table-cell">Brand</th>
                        <th className="text-left pb-2 pr-3 font-medium hidden sm:table-cell">Model</th>
                        <th className="text-left pb-2 pr-3 font-medium">Year</th>
                        <th className="text-right pb-2 font-medium">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 last:border-0">
                          <td className="py-1.5 pr-3">
                            <a href={item.photo_url} target="_blank" rel="noopener noreferrer">
                              <img src={item.photo_url} alt="Part" className="w-10 h-10 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
                            </a>
                          </td>
                          <td className="py-1.5 pr-3 text-gray-500 hidden sm:table-cell">{item.vehicle_brand || '—'}</td>
                          <td className="py-1.5 pr-3 text-gray-500 hidden sm:table-cell">{item.vehicle_model || '—'}</td>
                          <td className="py-1.5 pr-3 text-gray-400 font-mono text-xs">{item.manufacture_year || '—'}</td>
                          <td className="py-1.5 text-right font-semibold text-gray-800">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Standard order items */
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm min-w-[320px]">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-gray-200">
                        <th className="text-left pb-2 pr-3 font-medium">Part</th>
                        <th className="text-left pb-2 pr-3 font-medium hidden sm:table-cell">Brand</th>
                        <th className="text-left pb-2 pr-3 font-medium hidden sm:table-cell">Model</th>
                        <th className="text-left pb-2 pr-3 font-medium">SKU</th>
                        <th className="text-right pb-2 font-medium">Ordered</th>
                        {(order.status === 'partially_accepted' || order.status === 'partial_confirmed') && (
                          <th className="text-right pb-2 pl-2 font-medium text-orange-600">Approved</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {details.items.map((item) => {
                        const isReduced = item.approved_quantity != null && item.approved_quantity < item.quantity;
                        return (
                          <tr key={item.id} className={`border-b border-gray-100 last:border-0 ${isReduced ? 'bg-orange-50' : ''}`}>
                            <td className="py-1.5 pr-3 text-gray-800 font-medium">{item.part_name || item.product_name}</td>
                            <td className="py-1.5 pr-3 text-gray-500 hidden sm:table-cell">{item.vehicle_brand || '—'}</td>
                            <td className="py-1.5 pr-3 text-gray-500 hidden sm:table-cell">{item.vehicle_model || '—'}</td>
                            <td className="py-1.5 pr-3 text-gray-400 font-mono text-xs">{item.sku}</td>
                            <td className={`py-1.5 text-right font-semibold ${isReduced ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{item.quantity}</td>
                            {(order.status === 'partially_accepted' || order.status === 'partial_confirmed') && (
                              <td className={`py-1.5 pl-2 text-right font-bold ${item.approved_quantity === 0 ? 'text-red-500' : 'text-orange-700'}`}>
                                {item.approved_quantity != null ? item.approved_quantity : item.quantity}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              )}
              {details.notes && <p className="text-xs text-gray-500 italic">Notes: {details.notes}</p>}
              {/* Status timestamps (item 39) */}
              {details && (details.accepted_at || details.dispatched_at || details.delivered_at) && (
                <div className="flex flex-wrap gap-3 text-xs text-gray-400 pt-1">
                  {details.accepted_at  && <span>Accepted: {fmtDate(details.accepted_at)}</span>}
                  {details.dispatched_at && <span>Dispatched: {fmtDate(details.dispatched_at)}</span>}
                  {details.delivered_at  && <span>Delivered: {fmtDate(details.delivered_at)}</span>}
                  {details.confirmed_at  && <span>Confirmed: {fmtDate(details.confirmed_at)}</span>}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {order.status === 'dispatched' && (
                  <button onClick={handleConfirm} disabled={confirming}
                    className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2">
                    {confirming && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {confirming ? 'Confirming…' : <><Check size={14} strokeWidth={3} />Confirm Delivery</>}
                  </button>
                )}
                {order.status === 'partially_accepted' && (
                  <button onClick={handleConfirmPartial} disabled={confirmingPartial}
                    className="text-sm bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2">
                    {confirmingPartial && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {confirmingPartial ? 'Confirming…' : <><Check size={14} strokeWidth={3} />Confirm Partial</>}
                  </button>
                )}
                {order.status === 'confirmed' && (
                  <button onClick={handleReturnOpen}
                    className="text-sm border border-indigo-500 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg font-medium">
                    Request Return
                  </button>
                )}
                {(order.status === 'pending' || order.status === 'partially_accepted') && (
                  <button onClick={handleCancelOrder} disabled={cancellingOrder}
                    className="text-sm border border-red-300 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2">
                    {cancellingOrder && <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />}
                    {cancellingOrder ? 'Cancelling…' : 'Cancel Order'}
                  </button>
                )}
                {order.status === 'return_requested' && (
                  <button onClick={handleCancelReturn} disabled={cancelling}
                    className="text-sm border border-red-300 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2">
                    {cancelling && <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />}
                    {cancelling ? 'Cancelling…' : 'Cancel Return'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showReturn && details && (
        <ReturnModal order={order} details={details} onClose={() => setShowReturn(false)} onSuccess={handleReturnSuccess} />
      )}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </>
  );
}

function StatusLegend() {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50">
        <span className="text-xs font-medium text-gray-500">What do the statuses mean?</span>
        <span className={`text-gray-400 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {STATUS_LEGEND.map(({ status, label, desc }) => (
            <div key={status} className="flex items-center gap-3 px-4 py-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${BADGE_CLS[status] || 'bg-gray-100 text-gray-600'}`}>{label}</span>
              <span className="text-xs text-gray-500">{desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────── */
export default function MyOrders() {
  const { user }              = useAuth();
  const [orders, setOrders]       = useState([]);
  const [returnsMap, setReturnsMap] = useState({});
  const [tab, setTab]             = useState('all');
  const [loading, setLoading]     = useState(true);

  const load = async () => {
    const [orderData, returnData] = await Promise.all([getOrders(), getReturns().catch(() => [])]);
    setOrders(orderData);
    const map = {};
    for (const r of returnData) { map[r.order_id] = r; }
    setReturnsMap(map);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const counts = {
    all:        orders.length,
    pending:    orders.filter((o) => o.status === 'pending').length,
    partial:    orders.filter((o) => o.status === 'partially_accepted' || o.status === 'partial_confirmed').length,
    accepted:   orders.filter((o) => o.status === 'accepted').length,
    dispatched: orders.filter((o) => o.status === 'dispatched').length,
    confirmed:  orders.filter((o) => o.status === 'confirmed').length,
    rejected:   orders.filter((o) => o.status === 'rejected').length,
    returns:    orders.filter((o) => o.status.startsWith('return_')).length,
    cancelled:  orders.filter((o) => o.status === 'cancelled').length,
  };

  const filtered = tab === 'returns'
    ? orders.filter((o) => o.status.startsWith('return_'))
    : tab === 'partial' ? orders.filter((o) => o.status === 'partially_accepted' || o.status === 'partial_confirmed')
    : tab === 'all' ? orders : orders.filter((o) => o.status === tab);
  const empty = EMPTY[tab] || { icon: Package, msg: 'No orders here.', sub: null, link: false };

  if (loading) return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto space-y-3">
      <div className="h-7 w-28 bg-gray-200 rounded animate-pulse mb-5" />
      <div className="flex gap-3 mb-5">
        {[...Array(4)].map((_, i) => <div key={i} className="h-9 w-24 bg-gray-100 rounded-full animate-pulse" />)}
      </div>
      {[...Array(4)].map((_, i) => <Skeleton key={i} />)}
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
        {user?.city && <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1"><MapPin size={12} />{[user.city, user.state].filter(Boolean).join(', ')}</p>}
      </div>

      <StatusLegend />

      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm font-medium shadow-sm text-gray-700">
          Total: <span className="font-bold text-gray-900">{orders.length}</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm font-medium shadow-sm text-gray-700">
          Pending: <span className="font-bold text-yellow-600">{counts.pending}</span>
        </div>
        {counts.dispatched > 0 && (
          <div className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm font-medium shadow-sm text-gray-700">
            To confirm: <span className="font-bold text-orange-600">{counts.dispatched}</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto mb-5">
        <div className="bg-white rounded-xl shadow-sm p-1 inline-flex gap-1 min-w-full sm:min-w-0">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                tab === key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {label}
              <span className={`text-xs font-bold rounded-full px-1.5 py-0.5 ${tab === key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {counts[key] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          {empty.icon && <empty.icon size={36} className="mx-auto mb-3 text-gray-300" />}
          <p className="font-semibold text-gray-700 mb-1">{empty.msg}</p>
          {empty.sub && <p className="text-sm text-gray-400 mb-4">{empty.sub}</p>}
          {empty.link && (
            <Link to="/order/vehicle-type"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
              Browse Products
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="hidden md:grid px-4 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide gap-x-3"
            style={{ gridTemplateColumns: COLS }}>
            <span>Order</span><span>Vendor</span><span>Date</span>
            <span>Items</span><span>Status</span><span />
          </div>
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} onRefresh={load} returnData={returnsMap[order.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
