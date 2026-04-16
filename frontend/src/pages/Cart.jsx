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
  const totalItems   = cart.reduce((s, i) => s + i.quantity, 0);
  const cartCount    = totalItems;

  const handlePlace = async () => {
    setError('');
    setLoading(true);
    try {
      const validItems = cart.filter(item =>
        item.product_id &&
        item.product_id !== 'null' &&
        item.product_id !== 'undefined'
      )
      if (validItems.length === 0) {
        alert('No valid items in cart')
        return
      }
      const items = validItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))
      const result = await placeOrder({ items, notes });
      clearCart();
      localStorage.removeItem('cart');
      setPlacedOrders(result.orders);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (placedOrders) {
    const multi = placedOrders.length > 1;
    const steps = [
      { icon: '📋', label: 'Order received', sub: 'Your order is with the vendor', done: true },
      { icon: '✅', label: 'Vendor confirms', sub: 'Usually within a few hours', done: false },
      { icon: '🚚', label: 'Dispatched to you', sub: 'Typically within 1–3 business days', done: false },
      { icon: '📦', label: 'Collect your parts', sub: 'Pick up when notified', done: false },
    ];
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-sm w-full">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {multi ? `${placedOrders.length} Orders Placed!` : 'Order Placed!'}
          </h2>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {placedOrders.map((o) => (
              <span key={o.id} className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">
                {o.order_number}
              </span>
            ))}
          </div>

          {/* Timeline */}
          <div className="text-left space-y-0 mb-6">
            {steps.map((s, i) => (
              <div key={s.label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${s.done ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {s.icon}
                  </div>
                  {i < steps.length - 1 && <div className="w-px flex-1 bg-gray-100 my-1" />}
                </div>
                <div className="pb-4 pt-1 min-w-0">
                  <p className={`text-sm font-semibold ${s.done ? 'text-green-700' : 'text-gray-700'}`}>{s.label}</p>
                  <p className="text-xs text-gray-400">{s.sub}</p>
                </div>
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

      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Continue Shopping
        </button>
        <h1 className="text-xl font-bold text-gray-900">Your Cart ({cartCount} items)</h1>
        <div className="w-36" />
      </div>

      {vehicleLabel && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
          <span className="text-base">🏍️</span>
          <p className="text-sm text-blue-700 font-medium">Parts for: <span className="font-bold">{vehicleLabel}</span></p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Items list */}
        <div className="flex-1 space-y-3">
          {cart.map((item) => (
            <div key={item.product_id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                  {item.sku && <p className="text-xs text-gray-400 font-mono mt-0.5">{item.sku}</p>}
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
            <div className="border-t border-gray-100 pt-3 text-center font-semibold text-gray-700 text-sm">
              {totalItems} item{totalItems !== 1 ? 's' : ''} in your order
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
