import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useOrderFlow } from '../context/OrderFlowContext';
import { placeOrder } from '../api/orders.api';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { vehicleType, brand, model } = useOrderFlow();
  const [notes, setNotes]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [placedOrders, setPlacedOrders] = useState(null);
  const navigate = useNavigate();

  const vehicleLabel = [vehicleType?.name, brand?.name, model?.name].filter(Boolean).join(' › ');

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  const handlePlace = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await placeOrder({ items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })), notes });
      clearCart();
      setPlacedOrders(result.orders);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (placedOrders) {
    const multi = placedOrders.length > 1;
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-sm w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {multi ? `${placedOrders.length} Orders Placed!` : 'Order Placed!'}
          </h2>
          <div className="mb-5 space-y-1">
            {placedOrders.map((o) => (
              <p key={o.id} className="text-sm text-gray-500">
                <span className="font-mono font-bold text-gray-800">{o.order_number}</span>
              </p>
            ))}
          </div>
          <div className="space-y-3 text-left mb-6">
            {[
              { icon: '✅', label: 'Orders received by suppliers' },
              { icon: '⏳', label: 'Suppliers will confirm shortly' },
              { icon: '📦', label: 'Parts will be ready for pickup' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm text-gray-600">
                <span className="text-base">{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/orders')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm">
            Track My Orders
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <p className="text-5xl mb-4">🛒</p>
        <p className="text-lg font-semibold text-gray-700 mb-1">Your cart is empty</p>
        <p className="text-sm text-gray-400 mb-6">Add some products to get started</p>
        <Link to="/products" className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-5xl mx-auto">
      {vehicleLabel && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
          <span className="text-base">🏍️</span>
          <p className="text-sm text-blue-700 font-medium">Parts for: <span className="font-bold">{vehicleLabel}</span></p>
        </div>
      )}
      <h1 className="text-xl font-bold text-gray-900 mb-5">
        Your Cart <span className="text-gray-400 font-normal text-base">({cart.length} item{cart.length > 1 ? 's' : ''})</span>
      </h1>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Items list */}
        <div className="flex-1 space-y-3">
          {cart.map((item) => (
            <div key={item.product_id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                </div>
                <button onClick={() => removeFromCart(item.product_id)}
                  className="text-red-400 hover:text-red-600 text-base leading-none flex-shrink-0 mt-0.5" title="Remove">✕</button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => item.quantity > 1 && updateQuantity(item.product_id, item.quantity - 1)}
                    className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-xl">−</button>
                  <span className="w-9 text-center text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-xl">+</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary card */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 space-y-4 lg:sticky lg:top-20">
            <h2 className="font-bold text-gray-900">Order Summary</h2>
            <div className="space-y-1.5 text-sm text-gray-600">
              {cart.map((i) => (
                <div key={i.product_id} className="flex justify-between">
                  <span className="truncate mr-2">{i.name}</span>
                  <span className="flex-shrink-0 font-medium">×{i.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
              <span>Total Items</span>
              <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
            </div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Order notes (optional)" rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button onClick={handlePlace} disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Placing…' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
