import { useState, useEffect } from 'react';
import * as returnsApi from '../../api/returns.api';
import { RotateCcw, Check, CheckCircle } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../context/ToastContext';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const TILE_BG = {
  return_requested:  'bg-indigo-50 hover:bg-indigo-100',
  return_accepted:   'bg-blue-50 hover:bg-blue-100',
  return_dispatched: 'bg-purple-50 hover:bg-purple-100',
  return_received:   'bg-teal-50 hover:bg-teal-100',
  return_settled:    'bg-green-50 hover:bg-green-100',
};

function ReturnTile({ ret, isSelected, onClick }) {
  return (
    <button onClick={onClick}
      className={`${TILE_BG[ret.status] || 'bg-gray-50 hover:bg-gray-100'} ${isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'shadow-sm'} rounded-xl border border-transparent p-4 text-left transition-all w-full md:w-[210px] md:flex-none`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="font-mono font-bold text-sm text-gray-800">{ret.return_number}</span>
        <StatusBadge status={ret.status} small />
      </div>
      <p className="text-sm font-semibold text-gray-900 truncate mb-0.5">{ret.retailer_name}</p>
      {ret.city && <p className="text-xs text-gray-500 truncate">{[ret.city, ret.state].filter(Boolean).join(', ')}</p>}
      {ret.reason && <p className="text-xs text-gray-400 italic truncate mt-0.5">"{ret.reason}"</p>}
      <p className="text-xs text-gray-400 mt-2">{fmtDate(ret.created_at)}</p>
    </button>
  );
}

function ReturnDetailPanel({ ret, onClose, onAccept, onReceive, onSettle, actionLoading }) {
  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden flex flex-col shadow-lg" style={{ maxHeight: 'calc(100vh - 160px)' }}>
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3.5 border-b border-slate-700 flex-shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-mono font-bold text-sm text-white">{ret.return_number}</span>
            {ret.order_number && (
              <span className="font-mono text-xs text-slate-300 bg-slate-700 px-1.5 py-0.5 rounded">↩ {ret.order_number}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-white truncate">{ret.retailer_name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{fmtDate(ret.created_at)}</p>
        </div>
        <div className="flex items-start gap-2 flex-shrink-0 ml-3">
          <StatusBadge status={ret.status} small />
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">✕</button>
        </div>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4 scrollbar-dark">
        {/* Retailer info */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          {ret.retailer_mobile && (
            <div>
              <p className="text-slate-500 mb-0.5">Mobile</p>
              <p className="text-slate-300">{ret.retailer_mobile}</p>
            </div>
          )}
          {ret.city && (
            <div>
              <p className="text-slate-500 mb-0.5">City</p>
              <p className="text-slate-300">{[ret.city, ret.state].filter(Boolean).join(', ')}</p>
            </div>
          )}
          {ret.reason && (
            <div className="col-span-2">
              <p className="text-slate-500 mb-0.5">Reason</p>
              <p className="text-slate-300 italic">"{ret.reason}"</p>
            </div>
          )}
        </div>

        {/* Items */}
        {ret.items?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">Items</p>
            {ret.items[0]?.photo_url ? (
              <div className="space-y-2">
                {ret.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-slate-800 rounded-lg p-2">
                    <a href={item.photo_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                      <img src={item.photo_url} alt="Part" className="w-10 h-10 object-cover rounded-lg border border-slate-600" />
                    </a>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1">
                        {item.vehicle_brand && <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{item.vehicle_brand}</span>}
                        {item.vehicle_model && <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{item.vehicle_model}</span>}
                        {item.manufacture_year && <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{item.manufacture_year}</span>}
                      </div>
                      {item.note && <p className="text-[10px] text-slate-400 italic truncate mt-0.5">"{item.note}"</p>}
                    </div>
                    <span className="text-xs text-slate-300 flex-shrink-0">×{item.quantity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {ret.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-2 bg-slate-800 rounded px-2.5 py-1.5 text-xs">
                    <span className="text-slate-200 truncate">{item.product_name}</span>
                    <span className="text-slate-400 flex-shrink-0">×{item.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Photos */}
        {ret.photos?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">Photos</p>
            <div className="flex flex-wrap gap-2">
              {ret.photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt={`Photo ${i + 1}`} className="w-14 h-14 object-cover rounded-lg border border-slate-600 hover:opacity-80" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Dispatch reference */}
        {ret.dispatch_number && (
          <div className="bg-slate-800 rounded-lg px-3 py-2 flex items-center gap-2">
            <RotateCcw size={11} className="text-slate-400 flex-shrink-0" />
            <span className="font-mono text-xs text-slate-300">{ret.dispatch_number}</span>
            {ret.status === 'return_dispatched' && (
              <span className="text-xs text-slate-400 italic ml-1">In transit</span>
            )}
          </div>
        )}
      </div>

      {/* Actions footer */}
      <div className="px-4 py-3 border-t border-slate-700 flex-shrink-0">
        {ret.status === 'return_requested' && (
          <div className="flex gap-2">
            <button onClick={onAccept} disabled={actionLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-xs font-semibold">
              {actionLoading ? 'Processing…' : 'Accept Return'}
            </button>
            <button onClick={onSettle} disabled={actionLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-xs font-semibold">
              {actionLoading ? 'Processing…' : 'Mark Settled'}
            </button>
          </div>
        )}
        {ret.status === 'return_accepted' && (
          <div className="flex gap-2">
            <button onClick={onReceive} disabled={actionLoading}
              className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2 rounded-lg text-xs font-semibold">
              {actionLoading ? 'Processing…' : 'Mark Received'}
            </button>
            <button onClick={onSettle} disabled={actionLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-xs font-semibold">
              {actionLoading ? 'Processing…' : 'Mark Settled'}
            </button>
          </div>
        )}
        {ret.status === 'return_dispatched' && (
          <div className="space-y-2">
            <button onClick={onReceive} disabled={actionLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2 rounded-lg text-xs font-semibold">
              {actionLoading ? 'Processing…' : 'Confirm Return Received'}
            </button>
            <p className="text-[10px] text-slate-500 text-center">Auto-advances when retailer confirms delivery</p>
          </div>
        )}
        {ret.status === 'return_received' && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-teal-400">
              <Check size={12} strokeWidth={3} />Items back at warehouse
            </div>
            <button onClick={onSettle} disabled={actionLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-xs font-semibold">
              {actionLoading ? 'Processing…' : 'Mark Settled'}
            </button>
          </div>
        )}
        {ret.status === 'return_settled' && (
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <CheckCircle size={12} />Settled — no further action needed
          </div>
        )}
      </div>
    </div>
  );
}

function TileSection({ title, accent, items, selectedReturn, onSelect, onAccept, onReceive, onSettle, actionLoading, emptyText }) {
  return (
    <section>
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`w-1 h-5 ${accent} rounded-full`} />
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${items.length > 0 ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-500'}`}>
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
          <RotateCcw size={28} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">{emptyText}</p>
        </div>
      ) : (
        <div className="flex gap-5 items-start">
          <div className="flex-1 min-w-0">
            {/* Mobile: vertical stack, panel opens below selected tile */}
            <div className="md:hidden space-y-2">
              {items.map((ret) => (
                <div key={ret.id}>
                  <ReturnTile ret={ret}
                    isSelected={selectedReturn?.id === ret.id}
                    onClick={() => onSelect((prev) => prev?.id === ret.id ? null : ret)} />
                  {selectedReturn?.id === ret.id && (
                    <div className="mt-2">
                      <ReturnDetailPanel key={ret.id} ret={selectedReturn}
                        onClose={() => onSelect(null)}
                        onAccept={() => onAccept(selectedReturn)}
                        onReceive={() => onReceive(selectedReturn)}
                        onSettle={() => onSettle(selectedReturn)}
                        actionLoading={actionLoading === selectedReturn.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: flex-wrap tiles */}
            <div className="hidden md:flex flex-wrap gap-3">
              {items.map((ret) => (
                <ReturnTile key={ret.id} ret={ret}
                  isSelected={selectedReturn?.id === ret.id}
                  onClick={() => onSelect((prev) => prev?.id === ret.id ? null : ret)} />
              ))}
            </div>
          </div>

          {/* Desktop: sticky side panel — only render for the section that owns the selected tile */}
          {selectedReturn && items.some((r) => r.id === selectedReturn.id) && (
            <div className="hidden md:block w-80 flex-shrink-0 sticky top-6 pb-8">
              <ReturnDetailPanel key={selectedReturn.id} ret={selectedReturn}
                onClose={() => onSelect(null)}
                onAccept={() => onAccept(selectedReturn)}
                onReceive={() => onReceive(selectedReturn)}
                onSettle={() => onSettle(selectedReturn)}
                actionLoading={actionLoading === selectedReturn.id} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function VendorReturns() {
  const showToast = useToast();
  const [returns, setReturns]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [counts, setCounts]       = useState({ requested: 0, accepted: 0, dispatched: 0, received: 0, settled: 0 });
  const [actionLoading, setActionLoading] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [confirmModal, setConfirmModal]   = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);

  useEffect(() => { fetchReturns(); }, []);

  const fetchReturns = async () => {
    setLoading(true); setLoadError('');
    try {
      const data = await returnsApi.getReturns();
      setReturns(data);
      setCounts({
        requested:  data.filter((r) => r.status === 'return_requested').length,
        accepted:   data.filter((r) => r.status === 'return_accepted').length,
        dispatched: data.filter((r) => r.status === 'return_dispatched').length,
        received:   data.filter((r) => r.status === 'return_received').length,
        settled:    data.filter((r) => r.status === 'return_settled').length,
      });
      setSelectedReturn((prev) => prev ? (data.find((r) => r.id === prev.id) || null) : null);
    } catch (err) {
      setLoadError(err.response?.data?.error || 'Failed to load returns');
    } finally { setLoading(false); }
  };

  const handleAcceptReturn = async (ret) => {
    setActionLoading(ret.id);
    try {
      await returnsApi.acceptReturn(ret.id);
      await fetchReturns();
      showToast(`${ret.return_number} accepted · ${ret.retailer_name}`);
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handleReceiveReturn = async (ret) => {
    setActionLoading(ret.id);
    try {
      await returnsApi.receiveReturn(ret.id);
      await fetchReturns();
      showToast(`${ret.return_number} marked received · ${ret.retailer_name}`);
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handleSettleReturn = (ret) => {
    setConfirmModal({
      title: 'Settle Return',
      message: 'Mark this return as settled? No further action will be needed.',
      onConfirm: async () => {
        setConfirmModal(null);
        setActionLoading(ret.id);
        try {
          await returnsApi.settleReturn(ret.id);
          await fetchReturns();
          showToast(`${ret.return_number} settled · ${ret.retailer_name}`);
        } catch (err) { console.error(err); }
        finally { setActionLoading(null); }
      },
    });
  };

  const newRequests = returns.filter((r) => r.status === 'return_requested');
  const allOthers   = returns.filter((r) => r.status !== 'return_requested');

  if (loading) return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-3">
      {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 rounded-xl h-14 animate-pulse" />)}
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Returns</h1>
        <p className="text-sm text-gray-500 mt-1">Manage return requests and track their status</p>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{loadError}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Requested', count: counts.requested, cls: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
          { label: 'Accepted',  count: counts.accepted,  cls: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'In Transit',count: counts.dispatched,cls: 'bg-purple-50 border-purple-200 text-purple-700' },
          { label: 'Received',  count: counts.received,  cls: 'bg-teal-50 border-teal-200 text-teal-700' },
          { label: 'Settled',   count: counts.settled,   cls: 'bg-green-50 border-green-200 text-green-700' },
        ].map(({ label, count, cls }) => (
          <div key={label} className={`${cls} border rounded-xl p-3 text-center`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <TileSection
        title="New Requests"
        accent="bg-indigo-500"
        items={newRequests}
        selectedReturn={selectedReturn}
        onSelect={setSelectedReturn}
        onAccept={handleAcceptReturn}
        onReceive={handleReceiveReturn}
        onSettle={handleSettleReturn}
        actionLoading={actionLoading}
        emptyText="No pending return requests"
      />

      <TileSection
        title="All Returns"
        accent="bg-blue-600"
        items={allOthers}
        selectedReturn={selectedReturn}
        onSelect={setSelectedReturn}
        onAccept={handleAcceptReturn}
        onReceive={handleReceiveReturn}
        onSettle={handleSettleReturn}
        actionLoading={actionLoading}
        emptyText="No returns yet"
      />

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
