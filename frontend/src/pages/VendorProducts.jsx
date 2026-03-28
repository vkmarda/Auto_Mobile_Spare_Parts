import { useEffect, useState } from 'react';
import { getProducts, createProduct, updateProduct } from '../api/products.api';

function StockBadge({ stock }) {
  if (stock === 0)   return <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">Out of Stock</span>;
  if (stock < 10)    return <span className="flex items-center gap-1 text-xs text-red-600"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Critical</span>;
  if (stock <= 50)   return <span className="flex items-center gap-1 text-xs text-yellow-600"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />Low Stock</span>;
  return <span className="flex items-center gap-1 text-xs text-green-600"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />In Stock</span>;
}

function Modal({ product, onClose, onSave, allProducts }) {
  const [form, setForm] = useState({
    name:        product?.name        || '',
    sku:         product?.sku         || '',
    description: product?.description || '',
    unit_price:  product?.unit_price  || '',
    stock:       product?.stock       ?? 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.sku || !form.unit_price) {
      setError('Name, SKU and Unit Price are required');
      return;
    }
    // Client-side SKU uniqueness check
    const skuTaken = allProducts.some(
      (p) => p.sku.toLowerCase() === form.sku.trim().toLowerCase() && p.id !== product?.id
    );
    if (skuTaken) {
      setError('This SKU is already in use by another product');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = { ...form, unit_price: parseFloat(form.unit_price), stock: parseInt(form.stock) };
      product ? await updateProduct(product.id, data) : await createProduct(data);
      onSave();
    } catch (err) {
      const msg = err.response?.data?.error || '';
      setError(msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('duplicate')
        ? 'This SKU is already in use by another product'
        : msg || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const field = (label, key, type = 'text', required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}{required && ' *'}</label>
      <input type={type} value={form[key]} onChange={(e) => set(key, e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-base font-bold text-gray-900">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          {field('Name', 'name', 'text', true)}
          {field('SKU', 'sku', 'text', true)}
          {field('Description', 'description')}
          {field('Unit Price (₹)', 'unit_price', 'number', true)}

          {/* Stock stepper */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock</label>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden w-fit">
              <button type="button"
                onClick={() => set('stock', Math.max(0, parseInt(form.stock || 0) - 1))}
                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg font-medium">
                −
              </button>
              <span className="w-14 text-center text-sm font-semibold text-gray-900">{form.stock}</span>
              <button type="button"
                onClick={() => set('stock', parseInt(form.stock || 0) + 1)}
                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg font-medium">
                +
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Saving…' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | 'add' | product object

  const refresh = () => getProducts().then((d) => { setProducts(d); setLoading(false); });
  useEffect(() => { refresh(); }, []);

  const handleSave = () => { setModal(null); refresh(); };

  if (loading) return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-xl h-12 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} products</p>
        </div>
        <button onClick={() => setModal('add')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          + Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <p className="text-3xl mb-2">📦</p>
          <p className="text-sm font-medium text-gray-500">No products yet. Add your first product.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'SKU', 'Price', 'Stock', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-gray-600 font-medium text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3">
                    ₹{parseFloat(p.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-700">{p.stock}</td>
                  <td className="px-4 py-3"><StockBadge stock={p.stock} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => setModal(p)}
                      className="text-xs text-blue-600 hover:underline font-medium">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {modal && (
        <Modal
          product={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          allProducts={products}
        />
      )}
    </div>
  );
}
