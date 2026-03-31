import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderFlow } from '../context/OrderFlowContext';
import { useCart } from '../context/CartContext';
import { getOrders, getOrderById } from '../api/orders.api';

/* ── Page ────────────────────────────────────────── */
export default function RetailerLanding() {
  const navigate = useNavigate();
  const { resetFlow } = useOrderFlow();
  const { addToCart } = useCart();
  const [lastOrder, setLastOrder] = useState(null);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    getOrders().then((orders) => {
      if (orders.length > 0) setLastOrder(orders[0]);
    }).catch(() => {});
  }, []);

  function startOrder() {
    resetFlow();
    navigate('/order/vehicle-type');
  }

  async function handleReorder() {
    setReordering(true);
    try {
      const data = await getOrderById(lastOrder.id);
      data.items.forEach((item) =>
        addToCart({ id: item.product_id, name: item.product_name, sku: item.sku, vendor_id: data.vendor_id, vendor_name: data.vendor_name }, item.quantity)
      );
      navigate('/cart');
    } finally {
      setReordering(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="text-center mb-8">
        <span className="text-5xl mb-4 block">🔧</span>
        <h1 className="text-3xl font-bold text-gray-900">Parts Order</h1>
        <p className="text-gray-500 mt-1">Your trusted spare parts supplier</p>
      </div>

      <div className="flex gap-4 w-full max-w-xl mb-4">
        <button onClick={startOrder}
          className="flex-1 bg-blue-600 text-white rounded-2xl p-8 shadow-lg hover:bg-blue-700 hover:scale-105 transition-all text-center">
          <span className="text-4xl block mb-3">🛒</span>
          <p className="text-xl font-bold">Place New Order</p>
          <p className="text-sm text-blue-200 mt-1">Browse parts by your vehicle</p>
        </button>

        <button onClick={() => navigate('/orders')}
          className="flex-1 bg-white text-gray-900 rounded-2xl p-8 shadow-lg border-2 border-gray-200 hover:border-blue-400 hover:scale-105 transition-all text-center">
          <span className="text-4xl block mb-3">📦</span>
          <p className="text-xl font-bold">Track My Orders</p>
          <p className="text-sm text-gray-400 mt-1">View status of placed orders</p>
        </button>
      </div>

      {lastOrder && (
        <button onClick={handleReorder} disabled={reordering}
          className="w-full max-w-xl bg-white border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-2xl px-6 py-4 text-left transition-all hover:shadow-md disabled:opacity-50">
          <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Quick Reorder</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-800">Last order — {lastOrder.order_number}</p>
              <p className="text-xs text-gray-400 mt-0.5">{lastOrder.item_count} item{lastOrder.item_count !== 1 ? 's' : ''}</p>
            </div>
            <span className="text-blue-600 text-sm font-semibold">
              {reordering ? 'Adding…' : 'Reorder →'}
            </span>
          </div>
        </button>
      )}
    </div>
  );
}
