import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getProducts } from '../api/products.api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';

function Skeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse flex flex-col">
      <div className="h-1.5 bg-gray-200 w-full" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-9 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

export default function SearchResults() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { cart } = useCart();

  const initialQ = searchParams.get('q') || '';
  const [inputVal, setInputVal] = useState(initialQ);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setInputVal(q);
    if (!q.trim()) { setProducts([]); return; }
    setLoading(true);
    getProducts(null, null, q.trim())
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [searchParams]);

  const handleSearch = () => {
    const q = inputVal.trim();
    if (!q) return;
    setSearchParams({ q });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const q = searchParams.get('q') || '';

  const vendorOptions = [...new Map(
    products.filter((p) => p.vendor_id).map((p) => [p.vendor_id, { id: p.vendor_id, name: p.vendor_name }])
  ).values()];

  const [selectedVendor, setSelectedVendor] = useState('');
  const filtered = selectedVendor
    ? products.filter((p) => p.vendor_id === selectedVendor)
    : products;

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Search header bar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 text-xl leading-none flex-shrink-0">←</button>
          <div className="flex-1 flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white">
            <input
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search parts by name or SKU…"
              className="flex-1 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
              autoFocus
            />
            <button onClick={handleSearch}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center flex-shrink-0 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Vendor filter — only when multiple vendors in results */}
        {vendorOptions.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-5">
            <select value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All Vendors</option>
              {vendorOptions.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        )}

        {/* Results header */}
        {q && (
          <div className="mb-4">
            <h1 className="text-lg font-bold text-gray-900">
              Results for &ldquo;{q}&rdquo;
            </h1>
            {!loading && (
              <p className="text-xs text-gray-400 mt-0.5">{filtered.length} part{filtered.length !== 1 ? 's' : ''} found</p>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : !q ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium text-gray-500">Type something to search</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium text-gray-500">No products found for &ldquo;{q}&rdquo;</p>
            <p className="text-sm mt-1">Try a different name or SKU</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>

      {/* Sticky bottom cart bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/')}
            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
            ← Back
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
