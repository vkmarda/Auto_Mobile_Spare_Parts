import { useEffect, useState } from 'react';
import { getProducts } from '../api/products.api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';

function Skeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse flex flex-col gap-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
      <div className="h-6 bg-gray-200 rounded w-1/2" />
      <div className="h-9 bg-gray-100 rounded-lg" />
    </div>
  );
}

export default function ProductList() {
  const [products, setProducts]   = useState([]);
  const [search, setSearch]       = useState('');
  const [minPrice, setMinPrice]   = useState('');
  const [maxPrice, setMaxPrice]   = useState('');
  const [loading, setLoading]     = useState(true);
  const { cart } = useCart();

  useEffect(() => {
    getProducts().then((data) => { setProducts(data); setLoading(false); });
  }, []);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const price = parseFloat(p.unit_price);
    const matchMin = !minPrice || price >= parseFloat(minPrice);
    const matchMax = !maxPrice || price <= parseFloat(maxPrice);
    return matchSearch && matchMin && matchMax;
  });

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Products</h1>
          {!loading && <p className="text-sm text-gray-500 mt-0.5">{products.length} products</p>}
        </div>
        {cartCount > 0 && (
          <span className="text-sm text-gray-500 bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
            {cartCount} item{cartCount > 1 ? 's' : ''} in cart
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or SKU…"
          className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
          placeholder="Min price"
          className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Max price"
          className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">No products match your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
