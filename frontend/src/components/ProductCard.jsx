import { useState } from 'react';
import { useCart } from '../context/CartContext';

const barColor = (stock) => {
  if (stock === 0) return 'bg-red-400';
  if (stock < 10) return 'bg-yellow-400';
  return 'bg-green-400';
};

const stockLabel = (stock) => {
  if (stock === 0) return { text: 'Out of Stock', cls: 'text-red-500 bg-red-50' };
  if (stock < 10) return { text: `Only ${stock} left`, cls: 'text-yellow-600 bg-yellow-50' };
  return { text: `${stock} in stock`, cls: 'text-green-600 bg-green-50' };
};

export default function ProductCard({ product }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [toast, setToast] = useState(false);
  const { cart, addToCart, clearCart } = useCart();

  const handleAdd = () => {
    const cartVendorId = cart.length > 0 ? cart[0].vendor_id : null;
    if (cartVendorId && product.vendor_id && cartVendorId !== product.vendor_id) {
      const cartVendorName = cart[0].vendor_name || 'another vendor';
      if (!window.confirm(`Your cart has items from ${cartVendorName}. Adding this will clear your cart. Continue?`)) return;
      clearCart();
    }
    addToCart(product, qty);
    setAdded(true);
    setToast(true);
    setTimeout(() => { setAdded(false); setToast(false); }, 3000);
  };

  const dec = () => setQty((q) => Math.max(1, q - 1));
  const inc = () => setQty((q) => Math.min(product.stock, q + 1));

  const stock = stockLabel(product.stock);

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className={`h-1.5 w-full ${barColor(product.stock)}`} />
        <div className="p-4 flex flex-col gap-3 flex-1">
          <div>
            <p className="font-semibold text-gray-900 leading-tight">{product.name}</p>
            <p className="text-xs text-gray-300 mt-0.5 font-mono">{product.sku}</p>
            {product.vendor_name && (
              <p className="text-xs text-blue-600 mt-1 font-medium">{product.vendor_name}</p>
            )}
          </div>

          {/* <div className="flex items-center justify-end">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stock.cls}`}>
              {stock.text}
            </span>
          </div> */}

           <div className="flex items-center gap-2 mt-auto">
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={dec} 
                className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-xl disabled:opacity-30">−</button>
              <span className="w-9 text-center text-sm font-semibold text-gray-900">{qty}</span>
              <button onClick={inc} 
                className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-xl disabled:opacity-30">+</button>
            </div>
            <button onClick={handleAdd} 
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-colors ${
                added ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40'
              }`}>
              {added ? '✓ Added!' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-20 right-4 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 pointer-events-none">
          <span className="text-green-400">✓</span>
          {product.name} added to cart
        </div>
      )}
    </>
  );
}
