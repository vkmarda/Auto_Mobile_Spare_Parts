import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getModels } from '../../api/vehicles.api';
import { useOrderFlow } from '../../context/OrderFlowContext';

const STEPS = ['Vehicle', 'Brand', 'Model', 'Category'];

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

export default function ModelStep() {
  const navigate = useNavigate();
  const { vehicleType, brand, setModel } = useOrderFlow();
  const [models, setModels] = useState([]);
  const [sel, setSel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!brand) { navigate('/order/brand'); return; }
    getModels(brand.id).then(setModels).finally(() => setLoading(false));
  }, [brand]);

  function select(model) {
    setSel(model.id);
    setModel(model);
    setTimeout(() => navigate('/order/category'), 150);
  }

  const breadcrumb = [vehicleType?.name, brand?.name].filter(Boolean).join(' › ');

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <ProgressBar current={3} />
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/order/brand')}
            className="text-gray-400 hover:text-gray-600 text-sm font-medium">← Back</button>
          {breadcrumb && (
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">{breadcrumb}</span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Select your model</h1>
        <p className="text-gray-500 text-sm mb-4">Pick the exact model to find compatible parts</p>

        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search models…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500" />

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-xl h-14 animate-pulse border border-gray-200" />)}
          </div>
        ) : models.filter(m => m.name.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
          <p className="text-center text-gray-400 py-12">No models found.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
            {models.filter(m => m.name.toLowerCase().includes(search.toLowerCase())).map((m) => {
              const years = m.year_from ? `${m.year_from}${m.year_to ? `–${m.year_to}` : '+'}` : null;
              return (
                <button key={m.id} onClick={() => select(m)}
                  className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors
                    ${sel === m.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <span className={`text-sm font-medium ${sel === m.id ? 'text-blue-700' : 'text-gray-900'}`}>{m.name}</span>
                  <div className="flex items-center gap-3">
                    {years && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">{years}</span>
                    )}
                    <span className="text-gray-300 text-base">›</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
