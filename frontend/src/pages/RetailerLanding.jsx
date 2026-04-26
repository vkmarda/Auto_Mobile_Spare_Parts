import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderFlow } from '../context/OrderFlowContext';
import { useCart } from '../context/CartContext';
import { getOrders, getOrderById } from '../api/orders.api';

export default function RetailerLanding() {
  const navigate = useNavigate();
  const { resetFlow, setVehicleType, setBrand, setModel } = useOrderFlow();
  const { addToCart } = useCart();
  const [lastOrder, setLastOrder] = useState(null);
  const [reordering, setReordering] = useState(false);
  const [savedVehicles, setSavedVehicles] = useState([]);

  useEffect(() => {
    getOrders().then((orders) => {
      if (orders.length > 0) setLastOrder(orders[0]);
    }).catch(() => {});

    try {
      const saved = JSON.parse(localStorage.getItem('purzaa_saved_vehicles') || '[]');
      setSavedVehicles(saved);
    } catch (_) {}
  }, []);

  function startSelectPart() {
    resetFlow();
    navigate('/order/vehicle-type');
  }

  function quickSelectVehicle({ vehicleType, brandName, modelName }) {
    setVehicleType(vehicleType ? { name: vehicleType } : null);
    setBrand(brandName ? { name: brandName } : null);
    setModel(modelName ? { id: modelName, name: modelName, slug: modelName.toLowerCase().replace(/\s+/g, '-') } : null);
    navigate('/products');
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
        <h1 className="text-3xl font-bold text-gray-900">🔧 Purzaa</h1>
        <p className="text-gray-500 mt-1">Your trusted automobile spare parts ordering platform</p>
      </div>

      {/* Saved vehicle quick-select chips */}
      {savedVehicles.length > 0 && (
        <div className="w-full max-w-xl mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">Recent Vehicles</p>
          <div className="flex flex-wrap gap-2">
            {savedVehicles.map((v, i) => (
              <button key={i} onClick={() => quickSelectVehicle(v)}
                className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-amber-400 hover:bg-amber-50 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-full transition-colors shadow-sm">
                <span className="text-base">{v.vehicleType === 'scooter' ? '🛵' : '🏍️'}</span>
                {v.brandName} {v.modelName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Place new order — two options */}
      <div className="w-full max-w-xl mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">
          Place New Order
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={startSelectPart}
            className="bg-amber-600 text-white rounded-2xl p-6 shadow-lg hover:bg-amber-700 hover:scale-105 transition-all text-center">
            <span className="text-3xl block mb-2">🔍</span>
            <p className="text-base font-bold">Select Part</p>
            <p className="text-xs text-amber-200 mt-1">Browse by vehicle</p>
          </button>

          <button onClick={() => navigate('/order/photo')}
            className="bg-white text-gray-900 rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:border-amber-400 hover:scale-105 transition-all text-center">
            <span className="text-3xl block mb-2">📷</span>
            <p className="text-base font-bold">Add Photo</p>
            <p className="text-xs text-gray-400 mt-1">Upload & describe part</p>
          </button>
        </div>
      </div>

      {/* Track orders */}
      <div className="w-full max-w-xl mb-4">
        <button onClick={() => navigate('/orders')}
          className="w-full bg-white text-gray-900 rounded-2xl px-6 py-4 shadow-sm border-2 border-gray-200 hover:border-amber-400 hover:scale-105 transition-all flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div className="text-left">
              <p className="text-base font-bold">Track My Orders</p>
              <p className="text-xs text-gray-400">View status of placed orders</p>
            </div>
          </div>
          <span className="text-gray-300 text-lg">›</span>
        </button>
      </div>

      {/* Quick reorder */}
      {lastOrder && (
        <button onClick={handleReorder} disabled={reordering}
          className="w-full max-w-xl bg-white border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-2xl px-6 py-4 text-left transition-all hover:shadow-md disabled:opacity-50">
          <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Quick Reorder</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-800">Last order — {lastOrder.order_number}</p>
              <p className="text-xs text-gray-400 mt-0.5">{lastOrder.item_count} item{lastOrder.item_count !== 1 ? 's' : ''}</p>
            </div>
            <span className="text-amber-600 text-sm font-semibold">
              {reordering ? 'Adding…' : 'Reorder →'}
            </span>
          </div>
        </button>
      )}
    </div>
  );
}
