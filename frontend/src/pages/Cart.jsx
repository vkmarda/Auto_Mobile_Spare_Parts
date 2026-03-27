import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { placeOrder } from '../api/orders.api';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [notes, setNotes]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const navigate = useNavigate();

  const total = cart.reduce((s, i) => s + i.quantity * parseFloat(i.unit_price), 0);

  const handlePlace = async () => {
    setError('');
    setLoading(true);
    try {
      await placeOrder({ items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })), notes });
      clearCart();
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">
        Your Cart <span className="text-gray-400 font-normal text-base">({cart.length} item{cart.length > 1 ? 's' : ''})</span>
      </h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Items list */}
        <div className="flex-1 space-y-3">
          {cart.map((item) => (
            <div key={item.product_id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku} · ₹{parseFloat(item.unit_price).toFixed(2)} each</p>
              </div>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => item.quantity > 1 && updateQuantity(item.product_id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg">−</button>
                <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg">+</button>
              </div>
              <span className="w-20 text-right font-bold text-gray-900 text-sm">
                ₹{(item.quantity * parseFloat(item.unit_price)).toFixed(2)}
              </span>
              <button onClick={() => removeFromCart(item.product_id)}
                className="text-red-400 hover:text-red-600 text-lg leading-none" title="Remove">✕</button>
            </div>
          ))}
        </div>

        {/* Summary card */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4 sticky top-20">
            <h2 className="font-bold text-gray-900">Order Summary</h2>
            <div className="space-y-1.5 text-sm text-gray-600">
              {cart.map((i) => (
                <div key={i.product_id} className="flex justify-between">
                  <span className="truncate mr-2">{i.name} ×{i.quantity}</span>
                  <span className="flex-shrink-0">₹{(i.quantity * parseFloat(i.unit_price)).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
              <span>Subtotal</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Order notes (optional)" rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button onClick={handlePlace} disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Placing…' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
