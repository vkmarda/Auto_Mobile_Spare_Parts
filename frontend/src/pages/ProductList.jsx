import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../api/products.api';
import { useCart } from '../context/CartContext';
import { useOrderFlow } from '../context/OrderFlowContext';
import ProductCard from '../components/ProductCard';

function Skeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse flex flex-col">
      <div className="h-1.5 bg-gray-200 w-full" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-6 bg-gray-200 rounded w-1/2" />
        <div className="h-9 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

export default function ProductList() {
  const navigate = useNavigate();
  const { cart } = useCart();
  const { vehicleType, brand, model, category, resetFlow } = useOrderFlow();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getProducts(category?.id, null, null, model?.id).then(setProducts).finally(() => setLoading(false));
  }, [category?.id, model?.id]);

  const vendorOptions = [...new Map(
    products.filter((p) => p.vendor_id).map((p) => [p.vendor_id, { id: p.vendor_id, name: p.vendor_name }])
  ).values()];

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchVendor = !selectedVendor || p.vendor_id === selectedVendor;
    return matchSearch && matchVendor;
  });

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const breadcrumb = [vehicleType?.name, brand?.name, model?.name, category?.name].filter(Boolean);

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Vehicle context bar */}
      {breadcrumb.length > 0 && (
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">Browsing for:</span>
              <span className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                {breadcrumb.join(' › ')}
              </span>
            </div>
            <button onClick={() => { resetFlow(); navigate('/'); }}
              className="text-xs text-blue-600 hover:underline font-medium flex-shrink-0 ml-3">
              Change Vehicle
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search & filter card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-5">
          <div className="flex flex-wrap gap-3">
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU…"
              className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {vendorOptions.length > 1 && (
              <select value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">All Vendors</option>
                {vendorOptions.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{category?.name ?? 'All Products'}</h1>
            {!loading && (
              <p className="text-xs text-gray-400 mt-0.5">{filtered.length} part{filtered.length !== 1 ? 's' : ''} found</p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium text-gray-500">No products match your filters</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/order/category')}
            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
            ← Change Category
          </button>
          <button onClick={() => navigate('/cart')} disabled={cartCount === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
            {cartCount > 0 ? (
              <>
                <span className="bg-white text-blue-600 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center">{cartCount}</span>
                View Cart · {cartCount} item{cartCount !== 1 ? 's' : ''}
              </>
            ) : 'View Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
