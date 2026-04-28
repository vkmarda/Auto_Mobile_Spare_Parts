import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { getRetailerById } from '../../api/vendor.api';
import RetailerOrderRow from '../../components/RetailerOrderRow';
import Skeleton from '../../components/Skeleton';

const STATUSES = ['all', 'pending', 'accepted', 'dispatched', 'confirmed', 'rejected'];

export default function VendorRetailerDetail() {
  const { id } = useParams();
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatus]   = useState('all');

  useEffect(() => {
    getRetailerById(id).then(setData).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto space-y-4">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}
    </div>
  );

  if (!data) return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto text-center pt-20">
      <p className="text-gray-400 text-sm mb-3">Retailer not found.</p>
      <Link to="/vendor/retailers" className="text-xs text-blue-600 hover:underline">← Back to Retailers</Link>
    </div>
  );

  const counts = {};
  for (const s of STATUSES.slice(1)) counts[s] = data.orders.filter((o) => o.status === s).length;

  const filtered = statusFilter === 'all'
    ? data.orders
    : data.orders.filter((o) => o.status === statusFilter);

  const lastDispatched = data.orders.find((o) => o.dispatched_at);

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto space-y-6">

      {/* Back + header */}
      <div>
        <Link to="/vendor/retailers" className="text-xs text-gray-400 hover:text-blue-600 font-medium">← All Retailers</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{data.name}</h1>
        <div className="flex flex-wrap gap-4 mt-1.5 text-sm text-gray-500">
          {data.city && <span>{data.city}{data.state ? `, ${data.state}` : ''}</span>}
          {data.mobile && <a href={`tel:${data.mobile}`} className="hover:text-blue-600">{data.mobile}</a>}
          {data.email  && <a href={`mailto:${data.email}`} className="hover:text-blue-600">{data.email}</a>}
        </div>
        {lastDispatched && (
          <p className="text-xs text-violet-600 mt-1.5 font-medium">
            Last dispatch: {new Date(lastDispatched.dispatched_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Stats chips */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-center shadow-sm">
          <p className="text-xl font-bold text-gray-900">{data.orders.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total</p>
        </div>
        {Object.entries(counts).filter(([, v]) => v > 0).map(([s, v]) => (
          <div key={s} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-center shadow-sm">
            <p className="text-xl font-bold text-gray-900">{v}</p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{s}</p>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {s === 'all'
              ? `All (${data.orders.length})`
              : `${s.charAt(0).toUpperCase() + s.slice(1)}${counts[s] ? ` (${counts[s]})` : ''}`}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-14 text-center">
          <ClipboardList size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">No orders</p>
          <p className="text-xs text-gray-400 mt-1">No orders match this filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {filtered.map((o) => <RetailerOrderRow key={o.id} order={o} />)}
        </div>
      )}

    </div>
  );
}
