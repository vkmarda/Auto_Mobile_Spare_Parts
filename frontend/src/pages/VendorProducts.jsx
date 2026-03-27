import { useEffect, useState } from 'react';
import { getProducts, createProduct, updateProduct } from '../api/products.api';

function Modal({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    description: product?.description || '',
    unit_price: product?.unit_price || '',
    stock: product?.stock ?? 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.sku || !form.unit_price) {
      setError('Name, SKU and Unit Price are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = { ...form, unit_price: parseFloat(form.unit_price), stock: parseInt(form.stock) };
      product ? await updateProduct(product.id, data) : await createProduct(data);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save product');
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
          {field('Stock', 'stock', 'number')}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold">
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
    <div className="flex items-center justify-center p-16">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Name','SKU','Price','Stock',''].map((h) => (
                <th key={h} className={`px-4 py-3 text-gray-600 font-medium text-left`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.sku}</td>
                <td className="px-4 py-3">₹{parseFloat(p.unit_price).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={p.stock < 10 ? 'text-red-500 font-medium' : 'text-gray-700'}>{p.stock}</span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setModal(p)}
                    className="text-xs text-blue-600 hover:underline font-medium">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          product={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
