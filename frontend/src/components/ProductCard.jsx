import { useState } from 'react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  const handleAdd = () => {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const dec = () => setQty((q) => Math.max(1, q - 1));
  const inc = () => setQty((q) => Math.min(product.stock, q + 1));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col gap-3">
      <div>
        <p className="font-semibold text-gray-900 leading-tight">{product.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">SKU: {product.sku}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-blue-600 font-bold text-lg">
          ₹{parseFloat(product.unit_price).toFixed(2)}
        </span>
        {product.stock < 10 ? (
          <span className="text-xs font-medium text-red-500">Low stock ({product.stock})</span>
        ) : (
          <span className="text-xs text-gray-400">In stock: {product.stock}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button onClick={dec} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg">−</button>
          <span className="w-8 text-center text-sm font-medium">{qty}</span>
          <button onClick={inc} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg">+</button>
        </div>
        <button
          onClick={handleAdd}
          disabled={product.stock === 0}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            added
              ? 'bg-green-500 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40'
          }`}
        >
          {added ? '✓ Added' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
