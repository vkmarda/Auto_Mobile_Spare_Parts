import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories } from '../../api/vehicles.api';
import { useOrderFlow } from '../../context/OrderFlowContext';

const STEPS = ['Vehicle', 'Brand', 'Model', 'Variant', 'Category'];

function ProgressBar({ current }) {
  return (
    <div className="flex items-center mb-10">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2
                ${done ? 'bg-blue-600 border-blue-600 text-white' : active ? 'border-blue-600 bg-white text-blue-600' : 'border-gray-200 bg-white text-gray-400'}`}>
                {done ? '✓' : step}
              </div>
              <span className={`text-xs mt-1 font-medium whitespace-nowrap ${active ? 'text-blue-600' : done ? 'text-blue-400' : 'text-gray-400'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 ${done ? 'bg-blue-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CategoryStep() {
  const navigate = useNavigate();
  const { vehicleType, brand, model, variant, setCategory } = useOrderFlow();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!model) { navigate('/order/model'); return; }
    if (!variant) { navigate('/order/variant'); return; }
    getCategories().then(setCategories).finally(() => setLoading(false));
  }, [model]);

  function select(cat) {
    setCategory(cat);
    navigate('/products', {
      state: {
        category_id: cat.id,
        category_name: cat.name,
      }
    });
  }

  const breadcrumb = [vehicleType?.name, brand?.name, model?.name].filter(Boolean).join(' › ');

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <ProgressBar current={5} />
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/order/model')}
            className="text-gray-400 hover:text-gray-600 text-sm font-medium">← Back</button>
          {breadcrumb && (
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">{breadcrumb}</span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">What part do you need?</h1>
        <p className="text-gray-500 text-sm mb-4">Browse by part category for your {model?.name}</p>

        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500" />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => <div key={i} className="bg-white rounded-xl h-28 animate-pulse border border-gray-200" />)}
          </div>
        ) : categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
          <p className="text-center text-gray-400 py-12">No categories found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map((c) => (
              <button key={c.id} onClick={() => select(c)}
                className="bg-white rounded-xl p-5 border-2 border-gray-100 hover:border-blue-400 shadow-sm text-center transition-all hover:scale-105 hover:shadow-md">
                <span className="text-3xl block mb-2">{c.icon || '🔩'}</span>
                <p className="text-xs font-semibold text-gray-900 leading-tight">{c.name}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
