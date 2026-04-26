import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderFlow } from '../context/OrderFlowContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Search, Camera, Package, ChevronRight, Bike, RotateCcw } from 'lucide-react';
import { getOrders, getOrderById } from '../api/orders.api';

export default function RetailerLanding() {
  const navigate = useNavigate();
  const { resetFlow, setVehicleType, setBrand, setModel } = useOrderFlow();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [lastOrder, setLastOrder] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [reordering, setReordering] = useState(false);
  const [savedVehicles, setSavedVehicles] = useState([]);

  useEffect(() => {
    getOrders().then((orders) => {
      if (orders.length > 0) setLastOrder(orders[0]);
      setPendingCount(orders.filter(o => o.status === 'pending').length);
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

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gray-50 flex flex-col items-center px-6 pt-10 pb-10 md:justify-center md:pt-0 md:pb-0">
      <div className="w-full max-w-xl mb-8 hidden md:block">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Welcome back</p>
        <h2 className="text-2xl font-bold text-gray-900">Hello, {firstName}</h2>
        <p className="text-sm text-gray-500 mt-0.5">What would you like to do today?</p>
      </div>

      {/* Saved vehicle quick-select chips */}
      {savedVehicles.length > 0 && (
        <div className="w-full max-w-xl mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">Recent Vehicles</p>
          <div className="flex flex-wrap gap-2">
            {savedVehicles.map((v, i) => (
              <button key={i} onClick={() => quickSelectVehicle(v)}
                className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-full transition-colors shadow-sm">
                <Bike size={14} className="text-gray-400" />
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
            className="bg-indigo-600 text-white rounded-2xl p-6 shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all text-center">
            <Search size={28} className="mx-auto mb-2" />
            <p className="text-base font-bold">Select Part</p>
            <p className="text-xs text-indigo-200 mt-1">Browse by vehicle</p>
          </button>

          <button onClick={() => navigate('/order/photo')}
            className="bg-white text-gray-900 rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:border-indigo-400 hover:scale-105 transition-all text-center">
            <Camera size={28} className="mx-auto mb-2 text-gray-500" />
            <p className="text-base font-bold">Add Photo</p>
            <p className="text-xs text-gray-400 mt-1">Upload & describe part</p>
          </button>
        </div>
      </div>

      {/* Track orders */}
      <div className="w-full max-w-xl mb-4">
        <button onClick={() => navigate('/orders')}
          className="w-full bg-white text-gray-900 rounded-2xl px-6 py-4 shadow-sm border-2 border-gray-200 hover:border-indigo-400 hover:scale-105 transition-all flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package size={22} className="text-gray-500 flex-shrink-0" />
            <div className="text-left">
              <p className="text-base font-bold">Track My Orders</p>
              {pendingCount > 0 ? (
                <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                  {pendingCount} order{pendingCount !== 1 ? 's' : ''} awaiting confirmation
                </p>
              ) : (
                <p className="text-xs text-gray-400">View status of placed orders</p>
              )}
            </div>
          </div>
          {pendingCount > 0 ? (
            <span className="w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
              {pendingCount}
            </span>
          ) : (
            <ChevronRight size={18} className="text-gray-300" />
          )}
        </button>
      </div>

      {/* Quick reorder */}
      {lastOrder && (
        <button onClick={handleReorder} disabled={reordering}
          className="w-full max-w-xl bg-white border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-2xl px-6 py-4 text-left transition-all hover:shadow-md disabled:opacity-50">
          <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Quick Reorder</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-800">Last order — {lastOrder.order_number}</p>
              <p className="text-xs text-gray-400 mt-0.5">{lastOrder.item_count} item{lastOrder.item_count !== 1 ? 's' : ''}</p>
            </div>
            <span className="text-indigo-600 text-sm font-semibold">
              {reordering ? 'Adding…' : 'Reorder →'}
            </span>
          </div>
        </button>
      )}
    </div>
  );
}
