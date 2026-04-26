import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Truck, Package, ShoppingCart, Wrench, Bike } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useOrderFlow } from '../context/OrderFlowContext';
import { placeOrder } from '../api/orders.api';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { vehicleType, brand, model } = useOrderFlow();
  const [notes, setNotes]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [placedOrders, setPlacedOrders] = useState(null);
  const [cartSnapshot, setCartSnapshot] = useState(null);
  const navigate = useNavigate();

  const vehicleLabel = [vehicleType?.name, brand?.name, model?.name].filter(Boolean).join(' › ');
  const totalItems   = cart.reduce((s, i) => s + i.quantity, 0);
  const cartCount    = totalItems;

  // Group items by vendor
  const vendorGroups = cart.reduce((acc, item) => {
    const key = item.vendor_id || 'unknown';
    if (!acc[key]) acc[key] = { vendor_id: item.vendor_id, vendor_name: item.vendor_name || 'Unknown Vendor', items: [] };
    acc[key].items.push(item);
    return acc;
  }, {});
  const groups = Object.values(vendorGroups);

  const handlePlace = async () => {
    setError('');
    setLoading(true);
    try {
      const validItems = cart.filter(item =>
        item.product_id &&
        item.product_id !== 'null' &&
        item.product_id !== 'undefined'
      );
      if (validItems.length === 0) {
        alert('No valid items in cart');
        return;
      }
      const items = validItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));
      // Capture snapshot before clearing
      const snapshot = { groups: [...groups] };
      const result = await placeOrder({ items, notes });
      clearCart();
      localStorage.removeItem('cart');
      setCartSnapshot(snapshot);
      setPlacedOrders(result.orders);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (placedOrders) {
    // Map order number → vendor name using snapshot
    const orderVendorMap = {};
    if (cartSnapshot) {
      placedOrders.forEach((o, i) => {
        const group = cartSnapshot.groups[i];
        if (group) orderVendorMap[o.order_number] = group;
      });
    }
    const multi = placedOrders.length > 1;

    return (
      <div className="min-h-[70vh] px-4 py-8 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {multi ? `${placedOrders.length} Orders Placed!` : 'Order Placed!'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">You'll be notified on WhatsApp once confirmed</p>
          </div>

          {/* Per-vendor order breakdown */}
          <div className="space-y-4 mb-6">
            {placedOrders.map((o) => {
              const group = orderVendorMap[o.order_number];
              return (
                <div key={o.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-indigo-600">
                          {group?.vendor_name?.charAt(0).toUpperCase() || 'V'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{group?.vendor_name || 'Vendor'}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">
                      {o.order_number}
                    </span>
                  </div>
                  {group?.items.map((item) => (
                    <div key={item.product_id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-contain p-0.5" />
                        ) : (
                          <Wrench size={16} className="text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                        {item.sku && <p className="text-xs text-gray-400 font-mono">{item.sku}</p>}
                      </div>
                      <span className="text-sm font-semibold text-gray-600 flex-shrink-0">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* What's next */}
          <div className="mb-6 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">What happens next</p>
            {[
              { icon: CheckCircle, cls: 'text-green-600', text: 'Vendor reviews and confirms your order', sub: 'You\'ll get a WhatsApp message' },
              { icon: Truck,       cls: 'text-blue-600',  text: 'Order dispatched to you', sub: 'Typically within 1–3 business days' },
              { icon: Package,     cls: 'text-gray-500',  text: 'Collect your parts', sub: 'Pick up from the agreed location' },
            ].map((s) => (
              <div key={s.text} className="flex items-start gap-3">
                <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <s.icon size={14} className={s.cls} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{s.text}</p>
                  <p className="text-xs text-gray-400">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <button onClick={() => navigate('/orders')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm">
              Track My Orders
            </button>
            <button onClick={() => navigate('/retailer')}
              className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-3 rounded-xl text-sm">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <ShoppingCart size={40} className="mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-semibold text-gray-700 mb-1">Your cart is empty</p>
        <p className="text-sm text-gray-400 mb-6">Add some products to get started</p>
        <Link to="/products" className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
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
          onClick={() => navigate('/products')}
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
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
          <Bike size={16} className="text-indigo-500 flex-shrink-0" />
          <p className="text-sm text-indigo-700 font-medium">Parts for: <span className="font-bold">{vehicleLabel}</span></p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Items grouped by vendor */}
        <div className="flex-1 space-y-5">
          {groups.map((group, gi) => (
            <div key={group.vendor_id || gi}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-600">{group.vendor_name.charAt(0).toUpperCase()}</span>
                </div>
                <p className="text-sm font-semibold text-gray-700">{group.vendor_name}</p>
                {groups.length > 1 && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    Order {gi + 1} of {groups.length}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={item.product_id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
                    <div className="flex items-start gap-3 mb-2">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 border border-gray-100">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Wrench size={20} className="text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-snug">
                          {[item.brand, item.vehicle_brand, item.vehicle_model, item.name].filter(Boolean).join(' ')}
                        </p>
                      </div>
                      <button onClick={() => removeFromCart(item.product_id)}
                        className="text-red-400 hover:text-red-600 text-base leading-none flex-shrink-0 mt-0.5" title="Remove">✕</button>
                    </div>
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden w-fit">
                      <button onClick={() => item.quantity > 1 && updateQuantity(item.product_id, item.quantity - 1)}
                        className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-xl">−</button>
                      <span className="w-9 text-center text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-xl">+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary card */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 space-y-4 lg:sticky lg:top-20">
            <h2 className="font-bold text-gray-900">Order Summary</h2>
            {groups.length > 1 && (
              <p className="text-xs text-indigo-600 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg">
                {groups.length} separate orders will be placed
              </p>
            )}
            <div className="space-y-3 text-sm text-gray-600">
              {groups.map((group, gi) => (
                <div key={group.vendor_id || gi}>
                  <p className="text-xs font-semibold text-gray-500 mb-1">{group.vendor_name}</p>
                  {group.items.map((i) => (
                    <div key={i.product_id} className="flex justify-between py-0.5">
                      <span className="truncate mr-2">{i.name}</span>
                      <span className="flex-shrink-0 font-medium">×{i.quantity}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 text-center font-semibold text-gray-700 text-sm">
              {totalItems} item{totalItems !== 1 ? 's' : ''} · {groups.length} order{groups.length !== 1 ? 's' : ''}
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Order notes <span className="font-normal text-gray-400">(optional)</span></label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions…"
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button onClick={handlePlace} disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Placing…' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
