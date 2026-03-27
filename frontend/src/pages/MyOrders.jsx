import { useEffect, useState } from 'react';
import { getOrders } from '../api/orders.api';
import OrderCard from '../components/OrderCard';

const TABS = ['all', 'pending', 'accepted', 'rejected'];

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [tab, setTab]       = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders().then((data) => { setOrders(data); setLoading(false); });
  }, []);

  const filtered = tab === 'all' ? orders : orders.filter((o) => o.status === tab);

  if (loading) return (
    <div className="flex items-center justify-center p-16">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
        <p className="text-sm text-gray-500 mt-0.5">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-5 w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p className="font-medium">{tab === 'all' ? 'No orders yet' : `No ${tab} orders`}</p>
          {tab === 'all' && (
            <a href="/products" className="text-blue-600 text-sm hover:underline mt-1 inline-block">Start shopping →</a>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} showRetailerName={false} />
          ))}
        </div>
      )}
    </div>
  );
}
